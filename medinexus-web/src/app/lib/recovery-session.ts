type RecoverySession = { access_token: string; expires_at?: number; user: { id: string } };
type RecoveryGrant = { userId: string; token: string; expiresAt: number };
let grant: RecoveryGrant | null = null;
// Capture next to createClient so recovery redirects cannot race page mounting.
// A URL flag, metadata or a normal authenticated session never authorizes recovery.
export function observeRecoveryEvent(event: string, session: RecoverySession | null, now=Date.now()) {
  if(event==="PASSWORD_RECOVERY" && session) {
    grant={userId:session.user.id,token:session.access_token,expiresAt:Math.min(now+15*60_000,(session.expires_at??Infinity)*1000)};
  } else if(event==="SIGNED_OUT"||event==="SIGNED_IN") grant=null;
  else if(event==="TOKEN_REFRESHED" && grant && session && grant.userId===session.user.id) grant.token=session.access_token;
}
export function canResetPassword(session: RecoverySession | null, now=Date.now()) {
  return !!(grant&&session&&grant.userId===session.user.id&&grant.token===session.access_token&&now<grant.expiresAt);
}
export function clearRecoveryGrant(){grant=null;}
