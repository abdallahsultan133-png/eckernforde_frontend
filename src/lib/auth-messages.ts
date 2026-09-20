/** Converts transport/backend failures into safe, user-facing auth copy. */
export function friendlyAuthError(error: unknown, fallback = "We could not complete that request. Please check your details and try again.") {
  const raw = error instanceof Error ? error.message : "";
  if (/already|exists|duplicate|unique/i.test(raw)) return "An account with this email already exists.";
  if (/email/i.test(raw) && /invalid|valid/i.test(raw)) return "Please enter a valid email address.";
  if (/password/i.test(raw)) return "Use a password that meets the school's requirements.";
  if (/network|fetch|connect|timeout/i.test(raw)) return "Unable to connect. Please try again.";
  return fallback;
}
