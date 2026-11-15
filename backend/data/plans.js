// Single source of truth for plan pricing. `amount` is in paise (Razorpay
// requires amounts in the smallest currency unit — 100 paise = ₹1).
const PLANS = [
  { id: "basic", name: "Basic", price: "₹149", amount: 14900, quality: "HD" },
  { id: "standard", name: "Standard", price: "₹299", amount: 29900, quality: "Full HD" },
  { id: "premium", name: "Premium", price: "₹499", amount: 49900, quality: "4K Ultra HD" },
];

module.exports = PLANS;
