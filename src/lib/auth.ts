import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const SECRET = process.env.JWT_SECRET || "supersecret";

export interface TokenPayload {
  userId: string;
  tenantId: string;
  role: string;
  tenantSlug?: string;
  plan?: string;
}

// Generate JWT
export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: "1h" });
}

// Verify JWT from NextRequest headers
export function verifyToken(req: NextRequest): TokenPayload {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) throw new Error("Missing Authorization header");

  const token = authHeader.split(" ")[1];
  if (!token) throw new Error("Missing token");

  const payload = jwt.verify(token, SECRET) as TokenPayload;
  return payload;
}
