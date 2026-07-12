import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    const callbackToken = req.headers.get('x-callback-token')
    const expectedToken = Deno.env.get('XENDIT_CALLBACK_TOKEN')

    // Optional but highly recommended: Verify callback token
    if (expectedToken && callbackToken !== expectedToken) {
      return new Response('Unauthorized Webhook Token', { status: 401 })
    }

    const body = await req.json()
    const { external_id, status, amount } = body

    console.log(`Received Xendit webhook callback: ${external_id} - ${status}`)

    // We only process PAID invoices
    if (status === 'PAID') {
      // Extract userId from external_id: format is sub_userId_timestamp
      const parts = external_id.split('_')
      if (parts.length >= 3 && parts[0] === 'sub') {
        const userId = parts[1]
        
        // Initialize Supabase admin client (Service Role) to bypass RLS policies
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          { auth: { persistSession: false } }
        )

        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30) // 1 Month duration

        // Upsert subscription details
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id: userId,
            status: 'active',
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })

        if (error) {
          console.error('Database subscription update failed:', error)
          return new Response('Database Error', { status: 500 })
        }

        console.log(`Subscription successfully updated/activated for user: ${userId}`)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(error.message, { status: 500 })
  }
})
