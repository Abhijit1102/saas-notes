import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

interface JWTPayload {
  userId: string;
  tenantId: string;
  role: "ADMIN" | "MEMBER";
  plan: "FREE" | "PRO"; 
}

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export function signToken(payload: JWTPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}


export function verifyToken(req: NextRequest): JWTPayload {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) throw new Error("Invalid token format");
  const token = auth.split(" ")[1];
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
