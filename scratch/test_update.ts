import mongoose from "mongoose";
import ApartmentModel from "../lib/models/apartment";
import { connectDB } from "../lib/db";

async function run() {
  try {
    await connectDB();
    const apt = await ApartmentModel.findOne();
    if (!apt) return console.log("No apartment found");
    console.log("Before update:", apt.name, apt.isCodEnabled);
    
    const updated = await ApartmentModel.findByIdAndUpdate(
      apt._id,
      { $set: { isCodEnabled: false } },
      { new: true }
    ).lean();
    console.log("After update:", updated.name, updated.isCodEnabled);

    const check = await ApartmentModel.findById(apt._id).lean();
    console.log("Re-fetched:", check.name, check.isCodEnabled);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
