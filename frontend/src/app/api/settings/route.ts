import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET - Buscar configurações
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Get user and tenant
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { 
        tenant: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        email: user.tenant.email,
        phone: user.tenant.phone,
        document: user.tenant.document,
        logo: user.tenant.logo,
        description: user.tenant.description,
        address: user.tenant.address,
        city: user.tenant.city,
        state: user.tenant.state,
        zipCode: user.tenant.zipCode,
        businessHours: user.tenant.businessHours,
        timezone: user.tenant.timezone,
        systemPrompt: user.tenant.systemPrompt,
        aiEnabled: user.tenant.aiEnabled,
        reminderSettings: user.tenant.reminderSettings,
        isActive: user.tenant.isActive,
        onboardingStep: user.tenant.onboardingStep,
      },
    });
  } catch (error) {
    console.error("Settings GET Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar configurações
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Get user and check permissions
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { tenant: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Only OWNER and ADMIN can update settings
    if (!["OWNER", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão para alterar configurações" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    const {
      name,
      email,
      phone,
      document,
      logo,
      description,
      address,
      city,
      state,
      zipCode,
      businessHours,
      timezone,
      systemPrompt,
      aiEnabled,
      reminderSettings,
    } = body;

    // Build update data - only include fields that are provided
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (document !== undefined) updateData.document = document;
    if (logo !== undefined) updateData.logo = logo;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (businessHours !== undefined) updateData.businessHours = businessHours;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (aiEnabled !== undefined) updateData.aiEnabled = aiEnabled;
    if (reminderSettings !== undefined) {
      // Parse if string, otherwise use as is
      updateData.reminderSettings = typeof reminderSettings === "string" 
        ? JSON.parse(reminderSettings) 
        : reminderSettings;
    }

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: user.tenantId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        email: updatedTenant.email,
        phone: updatedTenant.phone,
        address: updatedTenant.address,
        city: updatedTenant.city,
        state: updatedTenant.state,
        zipCode: updatedTenant.zipCode,
        systemPrompt: updatedTenant.systemPrompt,
        aiEnabled: updatedTenant.aiEnabled,
        reminderSettings: updatedTenant.reminderSettings,
      },
    });
  } catch (error) {
    console.error("Settings PATCH Error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar configurações" },
      { status: 500 }
    );
  }
}