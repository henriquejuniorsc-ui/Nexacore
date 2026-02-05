import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET - Listar conversas do tenant
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const temperature = searchParams.get("temperature");
    const tagId = searchParams.get("tagId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Construir filtros
    const where: any = {
      tenantId: user.tenantId,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (temperature && temperature !== "ALL") {
      where.temperature = temperature;
    }

    if (tagId) {
      where.tags = {
        some: { tagId },
      };
    }

    if (search) {
      where.OR = [
        { client: { name: { contains: search, mode: "insensitive" } } },
        { client: { phone: { contains: search } } },
        { lastMessagePreview: { contains: search, mode: "insensitive" } },
      ];
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { lastMessageAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.conversation.count({ where }),
    ]);

    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Inbox API] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
