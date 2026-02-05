import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import {
  connectWhatsApp,
  getWhatsAppStatus,
  disconnectWhatsApp,
  deleteWhatsAppInstance,
  reconfigureWebhook,
} from "@/services/evolution-service";

// GET - Obter status da conexão
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

    const status = await getWhatsAppStatus(user.tenantId);
    return NextResponse.json(status);

  } catch (error: any) {
    console.error("[WhatsApp API] GET Error:", error);
    return NextResponse.json({
      connected: false,
      status: "error",
      message: error.message || "Erro ao verificar status",
    });
  }
}

// POST - Conectar WhatsApp (criar instância e obter QR Code)
export async function POST(request: NextRequest) {
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

    const result = await connectWhatsApp(user.tenantId);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[WhatsApp API] POST Error:", error);
    return NextResponse.json({
      connected: false,
      status: "error",
      message: error.message || "Erro ao conectar",
    });
  }
}

// PUT - Reconfigurar webhook (corrigir URL)
export async function PUT(request: NextRequest) {
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

    console.log(`[WhatsApp API] Reconfiguring webhook for tenant: ${user.tenantId}`);
    const success = await reconfigureWebhook(user.tenantId);

    return NextResponse.json({
      success,
      message: success
        ? "Webhook reconfigurado com sucesso"
        : "Erro ao reconfigurar webhook",
    });

  } catch (error: any) {
    console.error("[WhatsApp API] PUT Error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Erro ao reconfigurar webhook",
    });
  }
}

// DELETE - Desconectar WhatsApp
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const fullDelete = searchParams.get("full") === "true";

    const success = fullDelete
      ? await deleteWhatsAppInstance(user.tenantId)
      : await disconnectWhatsApp(user.tenantId);

    return NextResponse.json({
      success,
      message: success ? "Desconectado" : "Erro ao desconectar",
    });

  } catch (error: any) {
    console.error("[WhatsApp API] DELETE Error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Erro ao desconectar",
    });
  }
}
