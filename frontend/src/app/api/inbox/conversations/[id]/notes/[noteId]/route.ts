import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// DELETE - Deletar nota
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.conversationNote.delete({
      where: { id: params.noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Notes] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH - Atualizar nota (pin/unpin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, isPinned } = body;

    const note = await prisma.conversationNote.update({
      where: { id: params.noteId },
      data: {
        ...(content !== undefined && { content }),
        ...(isPinned !== undefined && { isPinned }),
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("[Notes] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
