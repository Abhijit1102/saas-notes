import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = verifyToken(req);

    const notes = await prisma.note.findMany({
      where: { tenantId: user.tenantId },
      include: { author: { select: { id: true, email: true, role: true, plan: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Show all notes for ADMIN, or only user's own notes for MEMBER
    const visibleNotes = user.role === "ADMIN" ? notes : notes.filter(n => n.author?.id === user.userId);

    return NextResponse.json({
      notes: visibleNotes,
      plan: user.plan,
      me: { id: user.userId, role: user.role },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = verifyToken(req);
    const { title, content } = await req.json();

    // Restrict FREE members to 3 notes
    if (user.role === "MEMBER" && user.plan === "FREE") {
      const count = await prisma.note.count({ where: { tenantId: user.tenantId, authorId: user.userId } });
      if (count >= 3) return NextResponse.json({ error: "FREE plan allows only 3 notes" }, { status: 403 });
    }

    const note = await prisma.note.create({
      data: { title, content, tenantId: user.tenantId, authorId: user.userId },
      include: { author: { select: { id: true, email: true, role: true } } },
    });

    return NextResponse.json(note);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
