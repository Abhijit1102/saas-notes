import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

interface Params {
  id: string;
}

export async function PUT(req: NextRequest, context: { params: Params }) {
  try {
    const params = await context.params; // ✅ await dynamic params
    const id = params.id;

    const user = verifyToken(req);

    const note = await prisma.note.findUnique({ where: { id } });
    if (!note || note.tenantId !== user.tenantId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    if (user.role === "MEMBER" && note.authorId !== user.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { title, content } = await req.json();
    const updated = await prisma.note.update({
      where: { id },
      data: { title, content },
      include: { author: { select: { id: true, email: true, role: true } } },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Params }) {
  try {
    const params = await context.params;
    const id = params.id;

    const user = verifyToken(req);

    const note = await prisma.note.findUnique({ where: { id } });
    if (!note || note.tenantId !== user.tenantId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    if (user.role === "MEMBER" && note.authorId !== user.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
