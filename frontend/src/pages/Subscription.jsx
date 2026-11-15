import { useState } from "react";
import { PLANS, createCheckoutOrder } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Subscription() {
  const { user, confirmPayment, cancelSubscription } = useAuth();
  const [savingPlan, setSavingPlan] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  async function handleChoose(planId) {
    setPaymentError("");
    setSavingPlan(planId);

    try {
      const order = await createCheckoutOrder(planId);

      if (typeof window.Razorpay !== "function") {
        throw new Error("Payment widget failed to load. Check your connection and try again.");
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "StreamX",
        description: `${order.plan.name} Plan`,
        theme: { color: "#e63946" },
        prefill: { name: user?.name, email: user?.email },
        handler: async (response) => {
          try {
            await confirmPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
            });
          } catch (err) {
            setPaymentError(
              err.message || "Payment went through but we couldn't confirm it. Contact support."
            );
          } finally {
            setSavingPlan(null);
          }
        },
        modal: {
          // Widget closed without completing payment — not an error, just
          // stop showing "Processing...".
          ondismiss: () => setSavingPlan(null),
        },
      });

      checkout.open();
    } catch (err) {
      setPaymentError(err.message || "Could not start checkout. Please try again.");
      setSavingPlan(null);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    await cancelSubscription();
    setCancelling(false);
  }

  return (
    <main className="subscription-page">
      <h1>Choose Your Plan</h1>

      <p className="subscription-description">
        Select a plan and start watching your favorite content.
      </p>

      {paymentError && (
        <div className="form-error" style={{ maxWidth: "400px", margin: "0 auto 20px" }}>
          {paymentError}
        </div>
      )}

      <div className="plans">
        {PLANS.map((plan) => {
          const isCurrent = user?.plan === plan.id;

          return (
            <div className={`plan-card ${isCurrent ? "current" : ""}`} key={plan.id}>
              <h2>{plan.name}</h2>
              <h3>{plan.price}</h3>
              <p>per month</p>

              <hr />

              <p><i class="fa-solid fa-check"></i> {plan.quality} streaming</p>
              <p><i class="fa-solid fa-check"></i> Multiple devices</p>
              <p><i class="fa-solid fa-check"></i> Watchlist</p>
              <p><i class="fa-solid fa-check"></i> Watch history</p>

              <button onClick={() => handleChoose(plan.id)} disabled={savingPlan === plan.id || isCurrent}>
                {isCurrent ? "Current Plan" : savingPlan === plan.id ? "Processing..." : "Choose Plan"}
              </button>

              {isCurrent && (
                <button
                  className="mini-btn"
                  style={{ marginTop: "10px", width: "100%" }}
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling..." : "Cancel Plan"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default Subscription;
