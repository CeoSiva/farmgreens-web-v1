import { SignJWT, jwtVerify } from "jose";

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret || secret.length === 0) {
    throw new Error("The environment variable JWT_SECRET_KEY is not set.");
  }
  return secret;
};

export const signToken = async (
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: { sub: string; mobile: string; [key: string]: any },
  options: { exp: string } = { exp: "7d" }
) => {
  try {
    const secret = new TextEncoder().encode(getJwtSecretKey());
    const alg = "HS256";
    return new SignJWT(payload)
      .setProtectedHeader({ alg })
      .setExpirationTime(options.exp)
      .setIssuedAt()
      .setSubject(payload.sub)
      .sign(secret);
  } catch (error) {
    throw error;
  }
};

export const verifyToken = async <T>(token: string): Promise<T> => {
  try {
    const secret = new TextEncoder().encode(getJwtSecretKey());
    const { payload } = await jwtVerify(token, secret);
    return payload as T;
  } catch (err) {
    throw new Error("Your token has expired or is invalid.");
  }
};
