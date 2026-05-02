import { toggleApartmentCodAction } from "../server/actions/location-admin";
import { listApartmentsByDistrictAction } from "../server/actions/location";
import { connectDB } from "../lib/db";
import ApartmentModel from "../lib/models/apartment";

async function run() {
  try {
    await connectDB();
    const apt = await ApartmentModel.findOne().lean();
    if (!apt) return console.log("No apt");

    console.log("Initial state:", apt.name, apt.isCodEnabled);
    
    // Toggle via action
    const toggleRes = await toggleApartmentCodAction(apt._id.toString(), false);
    console.log("Toggle result:", toggleRes);

    // Fetch via action
    const fetchRes = await listApartmentsByDistrictAction(apt.districtId.toString());
    const fetchedApt = fetchRes.apartments.find((a: any) => a._id === apt._id.toString());
    
    console.log("Fetched state:", fetchedApt?.name, fetchedApt?.isCodEnabled);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
