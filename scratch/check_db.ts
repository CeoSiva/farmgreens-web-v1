import mongoose from "mongoose";

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("No URI");
  await mongoose.connect(uri);
  
  const DistrictModel = mongoose.models.District || mongoose.model("District", new mongoose.Schema({ name: String, isCodEnabled: Boolean }));
  const ApartmentModel = mongoose.models.Apartment || mongoose.model("Apartment", new mongoose.Schema({ name: String, isCodEnabled: Boolean }));
  
  const d = await DistrictModel.find().lean();
  console.log("Districts:");
  d.forEach((x: any) => console.log(`- ${x.name}: ${x.isCodEnabled}`));
  
  const a = await ApartmentModel.find().lean();
  console.log("Apartments:");
  a.slice(0, 5).forEach((x: any) => console.log(`- ${x.name}: ${x.isCodEnabled}`));
  
  process.exit(0);
}
run();
