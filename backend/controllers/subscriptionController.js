const crypto = require("crypto");
const Razorpay = require("razorpay");
const Subscription = require("../models/Subscription");
const PLANS = require("../data/plans");

// Only initialized when real credentials are configured — matches the
// pattern used for Google/Facebook OAuth, so a missing key doesn't crash
// the server, just disables real checkout until it's set up.
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn("Razorpay not configured — RAZORPAY_KEY_ID/KEY_SECRET missing from .env");
}

// GET /api/subscriptions/plans — public, no auth needed to browse plans
function getPlans(_req, res) {
  res.status(200).json({ plans: PLANS });
}

// POST /api/subscriptions  { planId }
// NOTE: this is the original dummy free-subscribe path from before real
// payments existed — it activates a plan with no actual charge. Left in
// place for local testing without live Razorpay keys; the real UI now goes
// through createOrder + verifyPayment below instead.
async function subscribe(req, res) {
  try {
    const { planId } = req.body;

    if (!PLANS.some((p) => p.id === planId)) {
      return res.status(400).json({ message: "Unknown plan." });
    }

    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 30);

    const subscription = await Subscription.findOneAndUpdate(
      { user: req.user._id },
      { planId, status: "active", startDate: new Date(), renewalDate, paymentStatus: "paid" },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Kept in sync on the User document too since Profile.jsx and other
    // pages already read the current plan straight off `user.plan`.
    req.user.plan = planId;
    await req.user.save();

    res.status(200).json({ user: req.user.toJSON(), subscription: subscription.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// POST /api/subscriptions/checkout  { planId }
// Creates a Razorpay order server-side (the amount is looked up from PLANS
// here, never trusted from the request body — otherwise a modified client
// request could ask to pay ₹1 for the premium plan).
async function createOrder(req, res) {
  try {
    if (!razorpay) {
      return res.status(503).json({ message: "Payments aren't configured on this server yet." });
    }

    const { planId } = req.body;
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      return res.status(400).json({ message: "Unknown plan." });
    }

    const order = await razorpay.orders.create({
      amount: plan.amount, // paise
      currency: "INR",
      receipt: `streamx_${req.user._id}_${Date.now()}`,
      notes: { userId: String(req.user._id), planId },
    });

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
    });
  } catch (err) {
    res.status(500).json({ message: "Could not start checkout. Please try again." });
  }
}

// POST /api/subscriptions/verify
// { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId }
//
// Razorpay's checkout widget hands the frontend a payment id and a
// signature after the person pays — but the frontend can't be trusted to
// report success honestly (a modified client could just claim success
// without ever paying). This recomputes the HMAC signature server-side
// using the secret key and only activates the subscription if it matches
// exactly what Razorpay would have produced.
async function verifyPayment(req, res) {
  try {
    if (!razorpay) {
      return res.status(503).json({ message: "Payments aren't configured on this server yet." });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return res.status(400).json({ message: "Missing payment details." });
    }

    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      return res.status(400).json({ message: "Unknown plan." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed." });
    }

    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 30);

    const subscription = await Subscription.findOneAndUpdate(
      { user: req.user._id },
      {
        planId,
        status: "active",
        startDate: new Date(),
        renewalDate,
        paymentStatus: "paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    req.user.plan = planId;
    await req.user.save();

    res.status(200).json({ user: req.user.toJSON(), subscription: subscription.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong verifying your payment." });
  }
}

// GET /api/subscriptions/current
async function getCurrentSubscription(req, res) {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id, status: "active" });
    res.status(200).json({ subscription: subscription ? subscription.toJSON() : null });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// POST /api/subscriptions/cancel
async function cancelSubscription(req, res) {
  try {
    await Subscription.findOneAndUpdate({ user: req.user._id }, { status: "cancelled" });

    req.user.plan = null;
    await req.user.save();

    res.status(200).json({ user: req.user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

module.exports = { getPlans, subscribe, createOrder, verifyPayment, getCurrentSubscription, cancelSubscription };
