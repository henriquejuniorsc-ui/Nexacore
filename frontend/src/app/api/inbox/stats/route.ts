import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

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

    // Buscar conversas com mensagens não lidas
    const conversations = await prisma.conversation.findMany({
      where: {
        tenantId: user.tenantId,
        unreadCount: { gt: 0 },
      },
      select: {
        id: true,
        unreadCount: true,
        lastMessageAt: true,
        lastMessagePreview: true,
        client: {
          select: { name: true },
        },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 10,
    });

    // Total de não lidas
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    return NextResponse.json({
      totalUnread,
      conversations: conversations.map((c) => ({
        id: c.id,
        unreadCount: c.unreadCount,
        lastMessageAt: c.lastMessageAt,
        lastMessagePreview: c.lastMessagePreview,
        clientName: c.client.name,
      })),
    });
  } catch (error) {
    console.error("[Inbox Stats] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
