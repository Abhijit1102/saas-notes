import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }


    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      tenantSlug: user.tenant.slug,
      plan: user.tenant.plan,
    });

    return NextResponse.json({
      token,
      role: user.role,
      tenant: user.tenant.slug,
    });
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
