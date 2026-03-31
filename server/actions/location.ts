"use server";

import { listAreasByDistrict, listDistricts, listApartmentsByDistrict } from "@/lib/data/location";

export async function listDistrictsAction() {
  const districts = await listDistricts();
  // Ensure we return a plain serializable object
  return { districts: JSON.parse(JSON.stringify(districts)) };
}

export async function listAreasByDistrictAction(districtId: string) {
  const areas = await listAreasByDistrict(districtId);
  // Ensure we return a plain serializable object
  return { areas: JSON.parse(JSON.stringify(areas)) };
}

export async function listApartmentsByDistrictAction(districtId: string) {
  const apartments = await listApartmentsByDistrict(districtId);
  // Ensure we return a plain serializable object
  return { apartments: JSON.parse(JSON.stringify(apartments)) };
}
