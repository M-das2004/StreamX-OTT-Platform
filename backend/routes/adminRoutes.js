const express = require("express");
const { getUsers, updateUser, deleteUser, getAnalytics } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

const router = express.Router();

// Every route below requires a logged-in admin.
router.use(protect, adminOnly);

router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/analytics", getAnalytics);

module.exports = router;
