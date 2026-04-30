import { getSettings } from "./lib/data/setting";
import { connectDB } from "./lib/db";

async function main() {
  await connectDB();
  const settings = await getSettings();
  console.log("Settings in DB:", settings);
}

main().catch(console.error);
