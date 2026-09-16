// Which auth providers are actually configured.
//
// Google sign-in was live in the UI and not enabled in Supabase Auth, so every
// attempt returned `Unsupported provider: provider is not enabled` (400). A
// button that always fails is worse than no button — it is the first thing a
// new signup touches, and it teaches them the product is broken before they
// have seen any of it.
//
// Gated on an env flag rather than deleted, so turning it on is one variable
// once the provider is configured:
//
//   1. Google Cloud Console → OAuth 2.0 credentials (Web application)
//   2. Authorised redirect URI:
//      https://<project-ref>.supabase.co/auth/v1/callback
//   3. Supabase → Authentication → Providers → Google → enable, paste
//      Client ID + Secret
//   4. Supabase → Authentication → URL Configuration → add the site URLs to
//      the redirect allow-list
//   5. Set VITE_GOOGLE_AUTH_ENABLED=true and redeploy
export const GOOGLE_AUTH_ENABLED =
  import.meta.env.VITE_GOOGLE_AUTH_ENABLED === "true";
