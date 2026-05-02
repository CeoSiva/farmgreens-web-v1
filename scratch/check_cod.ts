import { config } from "dotenv";
config({ path: ".env.local" });
import mongoose from "mongoose";
import ApartmentModel from "../lib/models/apartment";
import { connectDB } from "../lib/db";

async function run() {
  try {
    await connectDB();
    console.log("Connected to DB");
    
    const apartments = await ApartmentModel.find().lean();
    console.log("\nApartments COD status (first 10):");
    apartments.slice(0, 10).forEach(a => console.log(`- ${a.name}: ${a.isCodEnabled}`));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
