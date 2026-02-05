import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// DELETE - Remover tag da conversa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; tagId: string } }
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

    // Verificar se conversa pertence ao tenant
    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Buscar tag para o log
    const tag = await prisma.tag.findUnique({ where: { id: params.tagId } });

    // Remover tag
    await prisma.conversationTag.deleteMany({
      where: {
        conversationId: params.id,
        tagId: params.tagId,
      },
    });

    // Criar atividade
    if (tag) {
      await prisma.conversationActivity.create({
        data: {
          conversationId: params.id,
          type: "TAG_REMOVED",
          title: `Etiqueta "${tag.name}" removida`,
          performedById: user.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Conversation Tags] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
