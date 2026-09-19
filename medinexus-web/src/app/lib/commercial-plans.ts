/** Display/calculation helpers. Billing must use a server-verified contract snapshot. */
export const COMMISSION_BPS = { free: 1500, professional: 1000, clinic_premium: 800 } as const;
export type CommercialTier = keyof typeof COMMISSION_BPS;

export function commissionBasisPoints(tier: CommercialTier, contractedBps?: number | null) {
  if (!Object.hasOwn(COMMISSION_BPS, tier)) throw new Error("Plano comercial inválido.");
  if (contractedBps != null && (tier !== "clinic_premium" || !Number.isInteger(contractedBps) || contractedBps < 700 || contractedBps > 800)) {
    throw new Error("A comissão contratada deve estar entre 7% e 8% no plano clínica/premium.");
  }
  return contractedBps ?? COMMISSION_BPS[tier];
}

export function calculateCommission(grossCents: number, tier: CommercialTier, contractedBps?: number | null, enabled = false) {
  if (!Number.isSafeInteger(grossCents) || grossCents <= 0 || grossCents > 100_000_000) throw new Error("Valor de consulta inválido.");
  const configuredBasisPoints = commissionBasisPoints(tier, contractedBps);
  const basisPoints = enabled === true ? configuredBasisPoints : 0;
  const commissionCents = Math.floor((grossCents * basisPoints + 5000) / 10000);
  return { grossCents, basisPoints, commissionCents, recipientBeforeProviderFeesCents: grossCents - commissionCents };
}
