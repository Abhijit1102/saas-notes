import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const params = await context.params; // ✅ must await
    const { slug, id: userIdToDowngrade } = params;

    const user = await verifyToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || tenant.id !== user.tenantId)
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const targetUser = await prisma.user.findUnique({ where: { id: userIdToDowngrade } });
    if (!targetUser || targetUser.tenantId !== tenant.id)
      return NextResponse.json({ error: "User not found in tenant" }, { status: 404 });

    // ✅ Update user and tenant in a single transaction
    const [updatedUser, updatedTenant] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userIdToDowngrade },
        data: { plan: "FREE" },
        select: { id: true, email: true, role: true, plan: true },
      }),
      prisma.tenant.update({
        where: { id: tenant.id },
        data: { plan: "FREE" },
        select: { id: true, name: true, slug: true, plan: true },
      }),
    ]);

    return NextResponse.json({ user: updatedUser, tenant: updatedTenant });
  } catch (e: any) {
    console.error("Downgrade tenant error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
