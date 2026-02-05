import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET - Listar tags do tenant
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { clerkUserId: userId },
      select: { tenantId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const tags = await prisma.tag.findMany({
      where: { tenantId: user.tenantId },
      include: {
        _count: {
          select: { conversations: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("[Tags API] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST - Criar nova tag
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { clerkUserId: userId },
      select: { tenantId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, color, icon, category } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const tag = await prisma.tag.create({
      data: {
        tenantId: user.tenantId,
        name,
        color: color || "#3B82F6",
        icon,
        category,
      },
    });

    return NextResponse.json(tag);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Tag already exists" }, { status: 400 });
    }
    console.error("[Tags API] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
