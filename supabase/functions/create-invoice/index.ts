import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get current authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const xenditSecret = Deno.env.get('XENDIT_SECRET_KEY')
    if (!xenditSecret) {
      throw new Error('XENDIT_SECRET_KEY is not configured in Supabase Secrets')
    }

    const externalId = `sub_${user.id}_${Date.now()}`
    
    // Call Xendit to create invoice
    const xenditResponse = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(xenditSecret + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: 29900,
        description: 'Langganan DebtClear Pro - 1 Bulan',
        invoice_duration: 900, // 15 minutes
        payer_email: user.email,
        payment_methods: ['QRIS'],
        success_redirect_url: 'https://debtclear.sellora.biz.id/pricing?success=true'
      })
    })

    const invoiceData = await xenditResponse.json()
    if (!xenditResponse.ok) {
      throw new Error(invoiceData.message || 'Xendit Invoice creation failed')
    }

    return new Response(JSON.stringify({
      invoice_url: invoiceData.invoice_url,
      external_id: externalId,
      status: invoiceData.status,
      expiry_date: invoiceData.expiry_date
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
