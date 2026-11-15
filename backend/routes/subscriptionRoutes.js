const express = require("express");
const {
  getPlans,
  subscribe,
  createOrder,
  verifyPayment,
  getCurrentSubscription,
  cancelSubscription,
} = require("../controllers/subscriptionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/plans", getPlans);
router.post("/", protect, subscribe);
router.post("/checkout", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.get("/current", protect, getCurrentSubscription);
router.post("/cancel", protect, cancelSubscription);

module.exports = router;
