"use server";

import { listAreasByDistrict, listDistricts } from "@/lib/data/location";

export async function listDistrictsAction() {
  const districts = await listDistricts();
  return { districts };
}

export async function listAreasByDistrictAction(districtId: string) {
  const areas = await listAreasByDistrict(districtId);
  return { areas };
}
