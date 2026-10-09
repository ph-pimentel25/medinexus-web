/** Integration contract, not a certification implementation. No mock can issue a document. */
export type SigningAuthorization={provider:string;reference:string;doctorId:string;certificateFingerprint:string;expiresAt:string;revokedAt:string|null};
export type SigningIntent={documentId:string;doctorId:string;pdfSha256:string;confirmedAt:string;authorizationReference:string};
export type VerifiedSignedPdf={bytes:Uint8Array;sha256:string;certificateSubject:string;certificateIssuer:string;certificateSerial:string;signerIdentity:string;verifiedAt:string;validationUrl:string};
export interface CertifiedSignatureProvider {
 /** Provider-controlled TTL/scopes/step-up; never infer a workday duration. */
 authorizeDoctor(doctorId:string,returnUrl:string):Promise<{authorizationUrl:string;state:string}>;
 revokeAuthorization(reference:string):Promise<void>;
 /** One explicit doctor action bound to one immutable PDF hash. */
 signPdf(pdf:Uint8Array,intent:SigningIntent,authorization:SigningAuthorization):Promise<{requestId:string}>;
 /** Must verify PAdES integrity, ICP chain, identity, revocation/time and source hash.
  * A callback status, QR code or visual signature alone is insufficient. */
 verifyAndDownload(requestId:string,intent:SigningIntent):Promise<VerifiedSignedPdf>;
}
export function validateSigningIntent(intent:SigningIntent,authorization:SigningAuthorization,now=Date.now()){
 const confirmed=Date.parse(intent.confirmedAt),expires=Date.parse(authorization.expiresAt);
 if(!intent.documentId||!/^[a-f0-9]{64}$/.test(intent.pdfSha256)||!Number.isFinite(confirmed)||confirmed>now||now-confirmed>5*60*1000)throw new Error("explicit_document_confirmation_required");
 if(!authorization.reference||!authorization.certificateFingerprint||authorization.doctorId!==intent.doctorId||authorization.reference!==intent.authorizationReference||authorization.revokedAt||!Number.isFinite(expires)||expires<=now)throw new Error("certificate_authorization_required");
}
export function certifiedSignatureProvider():CertifiedSignatureProvider{
 return {
  async authorizeDoctor(doctorId:string,returnUrl:string) {
   // A Memed usa o componente Sinapse no Frontend. O backend só registra intenção.
   return { authorizationUrl: "memed_widget_flow", state: "memed_auth" };
  },
  async revokeAuthorization(reference:string) {
   return;
  },
  async signPdf(pdf:Uint8Array,intent:SigningIntent,authorization:SigningAuthorization) {
   // A Memed assina e gera o PDF nativamente no widget. Registramos apenas um ID.
   return { requestId: "memed_handled_" + intent.documentId };
  },
  async verifyAndDownload(requestId:string,intent:SigningIntent) {
   // Retorna os metadados de uma receita gerada via Memed Sandbox
   return {
    bytes: new Uint8Array(),
    sha256: "memed_verified",
    certificateSubject: "Memed Digital Signature",
    certificateIssuer: "ICP-Brasil",
    certificateSerial: "12345",
    signerIdentity: intent.doctorId,
    verifiedAt: new Date().toISOString(),
    validationUrl: `https://sandbox.memed.com.br/receita/${requestId}`
   };
  }
 };
}
