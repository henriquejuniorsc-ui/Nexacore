import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET - Listar notas
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await prisma.conversationNote.findMany({
      where: { conversationId: params.id },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("[Notes] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST - Criar nota
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { clerkUserId: userId },
      select: { id: true, tenantId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const note = await prisma.conversationNote.create({
      data: {
        conversationId: params.id,
        content: content.trim(),
        authorId: user.id,
      },
    });

    // Criar atividade
    await prisma.conversationActivity.create({
      data: {
        conversationId: params.id,
        type: "NOTE_ADDED",
        title: "Nota adicionada",
        description: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        performedById: user.id,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("[Notes] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
