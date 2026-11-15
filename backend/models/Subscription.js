const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    planId: { type: String, enum: ["basic", "standard", "premium"], required: true },
    status: { type: String, enum: ["active", "cancelled"], default: "active" },
    startDate: { type: Date, default: Date.now },
    renewalDate: { type: Date },
    // No real payment gateway yet (per the backend plan: build the
    // subscription logic first, wire up Razorpay/Stripe/etc. later). This
    // just tracks whether the dummy "charge" succeeded.
    paymentStatus: { type: String, enum: ["paid", "unpaid"], default: "paid" },

    // Populated once a real Razorpay payment has been verified — null for
    // subscriptions created via the dummy free-subscribe endpoint.
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
