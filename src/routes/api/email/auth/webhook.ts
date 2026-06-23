import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { SignupEmail } from '@/lib/email-templates/signup'
import { InviteEmail } from '@/lib/email-templates/invite'
import { MagicLinkEmail } from '@/lib/email-templates/magic-link'
import { RecoveryEmail } from '@/lib/email-templates/recovery'
import { EmailChangeEmail } from '@/lib/email-templates/email-change'
import { ReauthenticationEmail } from '@/lib/email-templates/reauthentication'

// Native Supabase "Send Email" auth hook payload shape
interface SupabaseAuthHookPayload {
  user: {
    id: string
    email: string
    new_email?: string
  }
  email_data: {
    token: string
    token_hash: string
    token_new?: string
    token_hash_new?: string
    redirect_to: string
    email_action_type: string
    site_url: string
  }
}

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  invite: "You've been invited",
  magiclink: 'Your login link',
  recovery: 'Reset your password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

const SITE_NAME = "Christ Kingdom Platform"
const SENDER_DOMAIN = "notify.chkplt.com"
const ROOT_DOMAIN = "chkplt.com"

function redactEmail(email: string | null | undefined): string {
  if (!email) return '***'
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return '***'
  return `${localPart[0]}***@${domain}`
}

// Supabase auth hooks use HMAC-SHA256 signatures when the secret starts with "v1,whsec_".
// Header sent by Supabase: "x-supabase-signature: v1=<base64_hmac>"
// Fallback: plain Bearer token comparison for older hook configs.
async function verifyHookRequest(request: Request, secret: string): Promise<SupabaseAuthHookPayload> {
  const body = await request.text()

  // Standard Webhooks format — what Supabase Auth's Send-Email hook actually sends.
  // Headers: webhook-id, webhook-timestamp, webhook-signature ("v1,<b64> v1,<b64>...").
  // Signed content is `${id}.${timestamp}.${body}` (NOT the body alone).
  const swSig = request.headers.get('webhook-signature')
  const swId = request.headers.get('webhook-id')
  const swTs = request.headers.get('webhook-timestamp')
  if (swSig && swId && swTs && secret.startsWith('v1,whsec_')) {
    const keyBytes = Uint8Array.from(atob(secret.replace(/^v1,whsec_/, '')), (c) => c.charCodeAt(0))
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    )
    const contentBytes = new TextEncoder().encode(`${swId}.${swTs}.${body}`)
    const results = await Promise.all(
      swSig.split(' ').map(async (part) => {
        const sigB64 = part.split(',')[1]
        if (!sigB64) return false
        try {
          const sigBytes = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0))
          return await crypto.subtle.verify('HMAC', cryptoKey, sigBytes, contentBytes)
        } catch {
          return false
        }
      })
    )
    if (!results.some(Boolean)) {
      throw Object.assign(new Error('Invalid webhook signature'), { code: 'unauthorized' })
    }
    return JSON.parse(body) as SupabaseAuthHookPayload
  }

  if (secret.startsWith('v1,whsec_')) {
    const sigHeader = request.headers.get('x-supabase-signature') ?? ''
    const [version, sigB64] = sigHeader.split('=', 2)
    if (version !== 'v1' || !sigB64) {
      throw Object.assign(new Error('Missing or malformed x-supabase-signature'), { code: 'unauthorized' })
    }
    // Decode the raw key bytes from the whsec_ portion
    const rawKey = secret.replace(/^v1,whsec_/, '')
    const keyBytes = Uint8Array.from(atob(rawKey), (c) => c.charCodeAt(0))
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    )
    const sigBytes = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0))
    const bodyBytes = new TextEncoder().encode(body)
    const valid = await crypto.subtle.verify('HMAC', cryptoKey, sigBytes, bodyBytes)
    if (!valid) {
      throw Object.assign(new Error('Invalid HMAC signature'), { code: 'unauthorized' })
    }
  } else {
    // Legacy: plain Bearer token
    const authHeader = request.headers.get('authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (token !== secret) {
      throw Object.assign(new Error('Invalid authorization token'), { code: 'unauthorized' })
    }
  }

  return JSON.parse(body) as SupabaseAuthHookPayload
}

export const Route = createFileRoute("/api/email/auth/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.SUPABASE_AUTH_HOOK_SECRET
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!secret) {
          console.error('SUPABASE_AUTH_HOOK_SECRET not configured')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        if (!supabaseUrl || !supabaseServiceKey) {
          console.error('Missing Supabase environment variables')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        let payload: SupabaseAuthHookPayload
        try {
          payload = await verifyHookRequest(request, secret)
        } catch (error) {
          const code = (error as { code?: string }).code
          if (code === 'unauthorized') {
            console.error('Invalid webhook authorization', { error: (error as Error).message })
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
          }
          console.error('Webhook verification failed', { error })
          return Response.json({ error: 'Invalid webhook payload' }, { status: 400 })
        }

        const emailType = payload.email_data?.email_action_type
        const userEmail = payload.user?.email

        if (!emailType || !userEmail) {
          console.error('Webhook payload missing required fields', { emailType, userEmail })
          return Response.json({ error: 'Invalid webhook payload' }, { status: 400 })
        }

        console.log('Received auth hook event', {
          emailType,
          email_redacted: redactEmail(userEmail),
        })

        const EmailTemplate = EMAIL_TEMPLATES[emailType]
        if (!EmailTemplate) {
          console.error('Unknown email type', { emailType })
          return Response.json({ error: `Unknown email type: ${emailType}` }, { status: 400 })
        }

        const redirectTo = payload.email_data.redirect_to || `https://${ROOT_DOMAIN}/dashboard`
        const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(payload.email_data.token_hash)}&type=${encodeURIComponent(emailType)}&redirect_to=${encodeURIComponent(redirectTo)}`

        const templateProps = {
          siteName: SITE_NAME,
          siteUrl: `https://${ROOT_DOMAIN}`,
          recipient: userEmail,
          email: userEmail,
          confirmationUrl,
          token: payload.email_data.token,
          oldEmail: userEmail,
          newEmail: payload.user.new_email,
        }

        const element = React.createElement(EmailTemplate, templateProps)
        const html = await render(element)
        const text = await render(element, { plainText: true })

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const messageId = crypto.randomUUID()
        const run_id = crypto.randomUUID()

        await supabase.from('email_send_log').insert({
          message_id: messageId,
          template_name: emailType,
          recipient_email: userEmail,
          status: 'pending',
        })

        const { error: enqueueError } = await supabase.rpc('enqueue_email', {
          queue_name: 'auth_emails',
          payload: {
            run_id,
            message_id: messageId,
            to: userEmail,
            from: `${SITE_NAME} <noreply@${SENDER_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject: EMAIL_SUBJECTS[emailType] || 'Notification',
            html,
            text,
            purpose: 'transactional',
            label: emailType,
            queued_at: new Date().toISOString(),
          },
        })

        if (enqueueError) {
          console.error('Failed to enqueue auth email', { error: enqueueError, emailType })
          await supabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: emailType,
            recipient_email: userEmail,
            status: 'failed',
            error_message: 'Failed to enqueue email',
          })
          return Response.json({ error: 'Failed to enqueue email' }, { status: 500 })
        }

        console.log('Auth email enqueued', {
          emailType,
          email_redacted: redactEmail(userEmail),
        })

        return Response.json({ success: true, queued: true })
      },
    },
  },
})
