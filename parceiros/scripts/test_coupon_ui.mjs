import assert from "node:assert/strict";
import {couponBenefitLabel, couponShareText} from "../public/coupon_ui.js";

const proCoupon = {
  shareable: true,
  benefit: {kind: "pro_days", proDays: 7},
};
assert.equal(couponBenefitLabel(proCoupon), "7 dias de PRO");
assert.equal(
    couponShareText(proCoupon, "maria7"),
    "Use o meu código MARIA7 e ganhe 7 dias de PRO no Ausculto.",
);

const discountCoupon = {
  shareable: true,
  benefit: {kind: "discount_percent", percentOff: 15},
};
assert.equal(couponBenefitLabel(discountCoupon), "15% de desconto");
assert.ok(couponShareText(discountCoupon, "liga15").includes("15% de desconto"));

assert.equal(couponShareText({...proCoupon, shareable: false}, "MARIA7"), "");
assert.equal(couponShareText({shareable: true, benefit: {}}, "MARIA7"), "");
assert.equal(couponShareText(proCoupon, ""), "");

console.log("[test_coupon_ui] OK: beneficio dinamico e divulgacao bloqueada.");
