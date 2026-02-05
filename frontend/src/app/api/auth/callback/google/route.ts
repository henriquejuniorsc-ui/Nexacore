import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/services/google-calendar-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Se houve erro no OAuth
    if (error) {
      console.error("[Google OAuth] Error:", error);
      return NextResponse.redirect(
        new URL("/settings?error=google_auth_failed", request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings?error=missing_code", request.url)
      );
    }

    // Decodificar state
    let tenantId: string;
    let professionalId: string | undefined;

    try {
      const decoded = JSON.parse(Buffer.from(state || "", "base64").toString());
      tenantId = decoded.tenantId;
      professionalId = decoded.professionalId;
    } catch {
      return NextResponse.redirect(
        new URL("/settings?error=invalid_state", request.url)
      );
    }

    // Trocar código por tokens
    const tokens = await exchangeCodeForTokens(code);

    // Salvar tokens no tenant ou profissional
    if (professionalId) {
      // Salvar no profissional específico
      await prisma.professional.update({
        where: { id: professionalId },
        data: {
          googleCalendarId: "primary", // Será atualizado depois
        },
      });

      // Salvar credenciais no tenant (compartilhadas)
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          googleCredentials: tokens,
        },
      });
    } else {
      // Salvar apenas no tenant
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          googleCredentials: tokens,
        },
      });
    }

    console.log(`[Google OAuth] Successfully connected for tenant: ${tenantId}`);

    return NextResponse.redirect(
      new URL("/settings?success=google_connected", request.url)
    );
  } catch (error) {
    console.error("[Google OAuth] Error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=google_auth_error", request.url)
    );
  }
}
