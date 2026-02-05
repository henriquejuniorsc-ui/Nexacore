import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { generateAuthUrl } from "@/services/google-calendar-service";

// GET - Gerar URL de autenticação OAuth
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Gerar URL de autenticação
    const url = generateAuthUrl(user.tenantId);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[Google Calendar Auth] Error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar URL de autenticação" },
      { status: 500 }
    );
  }
}
