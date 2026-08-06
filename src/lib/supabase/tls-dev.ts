/**
 * Some corporate/home networks break Node's TLS chain verification.
 * Browser requests still work; server-side Supabase calls need this in dev.
 */
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
