// Texto de beneficio e compartilhamento derivado exclusivamente do contrato
// retornado pelo backend. Mantido puro para ser testado sem Firebase/DOM.

function positiveInt(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

export function couponBenefitLabel(coupon) {
  const benefit = coupon?.benefit || {};
  if (benefit.kind === "pro_days") {
    const days = positiveInt(benefit.proDays);
    if (!days) return "Benefício indisponível";
    return `${days} ${days === 1 ? "dia" : "dias"} de PRO`;
  }
  if (benefit.kind === "discount_percent") {
    const percent = positiveInt(benefit.percentOff);
    if (!percent) return "Benefício indisponível";
    return `${percent}% de desconto`;
  }
  return "Benefício indisponível";
}

export function couponShareText(coupon, rawCode) {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code || coupon?.shareable !== true) return "";
  const benefit = couponBenefitLabel(coupon);
  if (benefit === "Benefício indisponível") return "";
  return `Use o meu código ${code} e ganhe ${benefit} no Ausculto.`;
}
