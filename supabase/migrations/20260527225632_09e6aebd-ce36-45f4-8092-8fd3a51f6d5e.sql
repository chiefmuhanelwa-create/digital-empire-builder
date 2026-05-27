-- Enforce one log row per message_id so duplicate webhook retries cannot enqueue a duplicate receipt email.
CREATE UNIQUE INDEX IF NOT EXISTS email_send_log_message_id_uniq
  ON public.email_send_log (message_id)
  WHERE message_id IS NOT NULL;