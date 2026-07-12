/**
 * Sorts debts according to the selected strategy.
 * @param {Array} debts - Array of debt objects
 * @param {string} strategy - 'snowball' or 'avalanche'
 * @returns {Array} Sorted copy of the debts
 */
export function sortByStrategy(debts, strategy) {
  // Only sort active debts. Paid off ones are filtered or put at the bottom.
  const activeDebts = debts.filter(d => !d.isPaidOff);
  
  if (strategy === 'snowball') {
    // Smallest principal first
    return activeDebts.sort((a, b) => a.principal - b.principal || a.name.localeCompare(b.name));
  } else if (strategy === 'avalanche') {
    // Highest interest rate first
    return activeDebts.sort((a, b) => b.interestRate - a.interestRate || a.principal - b.principal);
  }
  
  return activeDebts;
}

/**
 * Calculates monthly payoff schedule for a given set of debts and strategy.
 * @param {Array} debts - All debts
 * @param {string} strategy - 'snowball' or 'avalanche'
 * @param {number} extraPayment - Extra monthly payment amount
 * @returns {Object} { schedule: Array, totalInterest: number, months: number, isInfinite: boolean }
 */
export function calculatePayoffSchedule(debts, strategy, extraPayment = 0) {
  const activeDebts = debts.filter(d => !d.isPaidOff).map(d => ({
    id: d.id,
    name: d.name,
    type: d.type,
    balance: d.principal,
    interestRate: d.interestRate,
    minPayment: d.minPayment,
    dueDate: d.dueDate
  }));

  if (activeDebts.length === 0) {
    return { schedule: [], totalInterest: 0, months: 0, isInfinite: false };
  }

  // Calculate the fixed total monthly budget: sum of all initial min payments + extra payment
  const initialMinPaymentSum = activeDebts.reduce((sum, d) => sum + d.minPayment, 0);
  const totalMonthlyBudget = initialMinPaymentSum + extraPayment;

  const schedule = [];
  let totalInterestAccumulated = 0;
  let monthCount = 0;
  const maxMonths = 360; // 30 years safety limit
  let isInfinite = false;

  // Setup starting month
  let currentDate = new Date();
  // Move to next month for the first payment
  currentDate.setMonth(currentDate.getMonth() + 1);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

  while (activeDebts.length > 0 && monthCount < maxMonths) {
    monthCount++;
    const monthLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    let monthlyRemainingBudget = Math.max(totalMonthlyBudget, activeDebts.reduce((sum, d) => sum + d.minPayment, 0));
    let monthlyTotalRemaining = 0;
    
    const monthlyDebtsDetails = [];

    // 1. Calculate monthly interest and apply to balances
    let monthlyInterestTotal = 0;
    let balanceGrew = false;
    
    for (const debt of activeDebts) {
      const monthlyRate = (debt.interestRate / 100) / 12;
      const interestAccrued = Math.round(debt.balance * monthlyRate);
      
      const oldBalance = debt.balance;
      debt.balance += interestAccrued;
      totalInterestAccumulated += interestAccrued;
      monthlyInterestTotal += interestAccrued;
      
      // Safety check: if interest accrued is greater than or equal to minPayment and no extra payment can cover it, balance will grow
      if (debt.balance > oldBalance && debt.minPayment <= interestAccrued && extraPayment === 0) {
        balanceGrew = true;
      }

      debt.lastInterestAccrued = interestAccrued;
      debt.lastPayment = 0;
    }

    if (balanceGrew && monthCount > 120) {
      // If balance is growing and it has been 10 years, trigger safety break
      isInfinite = true;
      break;
    }

    // 2. Pay minimum payments
    for (const debt of activeDebts) {
      const payment = Math.min(debt.minPayment, debt.balance);
      debt.balance -= payment;
      debt.lastPayment += payment;
      monthlyRemainingBudget -= payment;
    }

    // 3. Apply snowball (leftover budget) to priority debt
    // Sort active list again according to strategy to find priority target
    const prioritized = sortByStrategy(activeDebts, strategy);
    
    for (const debt of prioritized) {
      if (monthlyRemainingBudget <= 0) break;
      if (debt.balance <= 0) continue;

      const extraToApply = Math.min(monthlyRemainingBudget, debt.balance);
      debt.balance -= extraToApply;
      debt.lastPayment += extraToApply;
      monthlyRemainingBudget -= extraToApply;
    }

    // Record monthly snapshot
    for (const debt of activeDebts) {
      monthlyTotalRemaining += debt.balance;
      monthlyDebtsDetails.push({
        id: debt.id,
        name: debt.name,
        remainingBalance: debt.balance,
        interestPaid: debt.lastInterestAccrued,
        paymentPaid: debt.lastPayment
      });
    }

    schedule.push({
      month: monthLabel,
      debts: monthlyDebtsDetails,
      totalRemaining: monthlyTotalRemaining,
      interestPaidThisMonth: monthlyInterestTotal
    });

    // Remove paid off debts
    for (let i = activeDebts.length - 1; i >= 0; i--) {
      if (activeDebts[i].balance <= 0) {
        activeDebts.splice(i, 1);
      }
    }

    // Advance month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  if (monthCount >= maxMonths) {
    isInfinite = true;
  }

  return {
    schedule,
    totalInterest: totalInterestAccumulated,
    months: monthCount,
    isInfinite
  };
}

/**
 * Compares Snowball vs Avalanche strategies side-by-side.
 * @param {Array} debts - Array of debts
 * @param {number} extraPayment - Extra monthly payment
 * @returns {Object} comparison details
 */
export function compareStrategies(debts, extraPayment = 0) {
  const snowball = calculatePayoffSchedule(debts, 'snowball', extraPayment);
  const avalanche = calculatePayoffSchedule(debts, 'avalanche', extraPayment);

  return {
    snowball: {
      months: snowball.months,
      totalInterest: snowball.totalInterest,
      isInfinite: snowball.isInfinite
    },
    avalanche: {
      months: avalanche.months,
      totalInterest: avalanche.totalInterest,
      isInfinite: avalanche.isInfinite
    },
    betterStrategy: avalanche.totalInterest < snowball.totalInterest ? 'avalanche' : 'snowball',
    interestSaved: Math.abs(snowball.totalInterest - avalanche.totalInterest),
    monthsSaved: Math.abs(snowball.months - avalanche.months)
  };
}
