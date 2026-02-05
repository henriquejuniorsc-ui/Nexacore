import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET - Listar respostas rápidas
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

    const responses = await prisma.cannedResponse.findMany({
      where: { tenantId: user.tenantId },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error("[Canned Responses] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST - Criar resposta rápida
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
    const { title, content, shortcut, category } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const response = await prisma.cannedResponse.create({
      data: {
        tenantId: user.tenantId,
        title,
        content,
        shortcut: shortcut || null,
        category: category || null,
      },
    });

    return NextResponse.json(response);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Shortcut already exists" }, { status: 400 });
    }
    console.error("[Canned Responses] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
