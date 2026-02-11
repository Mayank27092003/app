import bcrypt from "bcryptjs";

export async function generateOtp(length = 6): Promise<string> {
  return Array(length)
    .fill(null)
    .map(() => Math.floor(Math.random() * 10))
    .join("");
}

export async function hashOtp(otp: string): Promise<string> {
  return await bcrypt.hash(otp, 10);
}

export async function compareOtp(
  input: string,
  hashed: string
): Promise<boolean> {
  return await bcrypt.compare(input, hashed);
}
