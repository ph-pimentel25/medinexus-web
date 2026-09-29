/** Structural validation only; this does not query Receita Federal. */
export function normalizeCnpj(value: string) { return value.replace(/\D/g, ""); }
export function formatCnpj(value: string) {
  return normalizeCnpj(value).slice(0,14).replace(/^(\d{2})(\d)/,"$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/,"$1.$2.$3").replace(/\.(\d{3})(\d)/,".$1/$2").replace(/(\d{4})(\d)/,"$1-$2");
}
export function isValidCnpj(value: string) {
  if (/[^\d.\/\-\s]/.test(value)) return false;
  const digits=normalizeCnpj(value);
  if (!/^\d{14}$/.test(digits)||/^(\d)\1{13}$/.test(digits)) return false;
  function digit(base: string) {
    let weight=base.length-7, sum=0;
    for (const n of base) { sum+=Number(n)*weight; weight=weight===2?9:weight-1; }
    const remainder=sum%11; return remainder<2?0:11-remainder;
  }
  return Number(digits[12])===digit(digits.slice(0,12)) && Number(digits[13])===digit(digits.slice(0,13));
}
