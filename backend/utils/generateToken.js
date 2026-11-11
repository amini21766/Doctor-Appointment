import jwt from "jsonwebtoken";

/**
 * Sign a JWT containing the user id and role.
 * The secret must come from the environment (never hardcoded).
 */
export const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");

  return jwt.sign({ userId, role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export default generateToken;