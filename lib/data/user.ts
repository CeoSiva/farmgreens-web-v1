import { connectDB } from "../db";
import UserModel, { IUser } from "../models/user";

export async function getUserByMobile(mobile: string): Promise<IUser | null> {
  await connectDB();
  return UserModel.findOne({ mobile }).lean();
}

export async function createUser(data: Partial<IUser>): Promise<IUser> {
  await connectDB();
  return UserModel.create(data);
}
