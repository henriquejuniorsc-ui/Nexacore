import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// DELETE - Deletar resposta rápida
export async function DELETE(
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
      select: { tenantId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.cannedResponse.deleteMany({
      where: { id: params.id, tenantId: user.tenantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Canned Responses] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH - Atualizar resposta rápida
export async function PATCH(
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
      select: { tenantId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, shortcut, category } = body;

    const response = await prisma.cannedResponse.update({
      where: { id: params.id },
      data: { title, content, shortcut, category },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Canned Responses] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
