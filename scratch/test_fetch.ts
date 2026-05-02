import { listApartmentsByDistrictAction } from "../server/actions/location";
import { connectDB } from "../lib/db";
import ApartmentModel from "../lib/models/apartment";

async function run() {
  try {
    await connectDB();
    const apt = await ApartmentModel.findOne().lean();
    if (!apt) return console.log("No apt");

    console.log("DB state:", apt.name, apt.isCodEnabled);
    
    const fetchRes = await listApartmentsByDistrictAction(apt.districtId.toString());
    const fetchedApt = fetchRes.apartments.find((a: any) => a._id === apt._id.toString());
    
    console.log("Action state:", fetchedApt?.name, fetchedApt?.isCodEnabled);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
