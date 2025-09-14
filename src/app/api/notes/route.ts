import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// Shape of the decoded JWT user
interface AuthUser {
  userId: string;
  tenantId: string;
  role: "ADMIN" | "MEMBER";
  plan: "FREE" | "PRO";
}

export async function GET(req: NextRequest) {
  try {
    const user = (await verifyToken(req)) as AuthUser;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await prisma.note.findMany({
      where: { tenantId: user.tenantId },
      include: {
        author: {
          select: { id: true, email: true, role: true, plan: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const visibleNotes =
      user.role === "ADMIN"
        ? notes
        : notes.filter((n) => n.author?.id === user.userId);

    return NextResponse.json({
      notes: visibleNotes,
      plan: user.plan,
      me: { id: user.userId, role: user.role },
    });
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = (await verifyToken(req)) as AuthUser;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content } = (await req.json()) as {
      title: string;
      content: string;
    };

    if (user.role === "MEMBER" && user.plan === "FREE") {
      const count = await prisma.note.count({
        where: { tenantId: user.tenantId, authorId: user.userId },
      });
      if (count >= 3) {
        return NextResponse.json(
          { error: "FREE plan allows only 3 notes" },
          { status: 403 }
        );
      }
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        tenantId: user.tenantId,
        authorId: user.userId,
      },
      include: { author: { select: { id: true, email: true, role: true } } },
    });

    return NextResponse.json(note);
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
