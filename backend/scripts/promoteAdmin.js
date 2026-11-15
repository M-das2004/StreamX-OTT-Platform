require("dotenv").config();
const connectDB = require("../config/database");
const User = require("../models/User");

async function run() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: node scripts/promoteAdmin.js user@example.com");
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: "admin" },
    { new: true }
  );

  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  console.log(`${user.email} is now an admin.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Promote failed:", err);
  process.exit(1);
});
