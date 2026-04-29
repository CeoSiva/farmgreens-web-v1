import { scryptSync, randomBytes } from "crypto";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

// User Schema (Simplified version for script)
const UserSchema = new mongoose.Schema({
  mobile: String,
  countryCode: String,
  password: String,
  name: String,
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hashed = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hashed}`;
}

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI!);
    console.log("Connected.");

    const mobile = "7904391341";
    const countryCode = "+91";
    const password = "ceo@1703";

    // Check if user exists
    const existing = await User.findOne({ mobile });
    if (existing) {
      console.log(`User with mobile ${mobile} already exists skipping...`);
      return;
    }

    const hashedPassword = hashPassword(password);

    await User.create({
      mobile,
      countryCode,
      name: "Admin User",
      password: hashedPassword,
    });

    console.log("-------------------");
    console.log("Seeding successful!");
    console.log(`Mobile: ${countryCode} ${mobile}`);
    console.log(`Password: ${password}`);
    console.log("-------------------");

  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seed();
