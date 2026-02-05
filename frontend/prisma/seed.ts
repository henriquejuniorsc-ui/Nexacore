/**
 * Seed para popular o banco com dados de teste
 * Execute: npx tsx prisma/seed.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // 1. Criar tenant de teste
  const tenant = await prisma.tenant.upsert({
    where: { slug: "clinica-demo" },
    update: {},
    create: {
      name: "Clínica Demo NexaCore",
      slug: "clinica-demo",
      email: "demo@nexacore.com",
      phone: "11999999999",
      address: "Av. Paulista, 1000",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
      businessHours: {
        monday: { open: "08:00", close: "18:00", enabled: true },
        tuesday: { open: "08:00", close: "18:00", enabled: true },
        wednesday: { open: "08:00", close: "18:00", enabled: true },
        thursday: { open: "08:00", close: "18:00", enabled: true },
        friday: { open: "08:00", close: "18:00", enabled: true },
        saturday: { open: "08:00", close: "12:00", enabled: true },
        sunday: { open: "08:00", close: "12:00", enabled: false },
      },
      aiEnabled: true,
      systemPrompt: "Seja sempre cordial e profissional. Priorize o agendamento de consultas.",
    },
  });
  console.log(`✅ Tenant criado: ${tenant.name}`);

  // 2. Criar subscription
  const subscription = await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      plan: "PRO",
      status: "ACTIVE",
      maxProfessionals: 5,
      maxAppointments: -1,
      priceMonthly: 197,
    },
  });
  console.log(`✅ Subscription criada: ${subscription.plan}`);

  // 3. Criar tipos de procedimento
  const procedureTypes = await Promise.all([
    prisma.procedureType.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: "Botox" } },
      update: {},
      create: { tenantId: tenant.id, name: "Botox", reminderDays: 120 },
    }),
    prisma.procedureType.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: "Preenchimento Labial" } },
      update: {},
      create: { tenantId: tenant.id, name: "Preenchimento Labial", reminderDays: 180 },
    }),
    prisma.procedureType.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: "Limpeza de Pele" } },
      update: {},
      create: { tenantId: tenant.id, name: "Limpeza de Pele", reminderDays: 30 },
    }),
    prisma.procedureType.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: "Harmonização Facial" } },
      update: {},
      create: { tenantId: tenant.id, name: "Harmonização Facial", reminderDays: 365 },
    }),
  ]);
  console.log(`✅ ${procedureTypes.length} tipos de procedimento criados`);

  // 4. Criar profissionais
  const professionals = await Promise.all([
    prisma.professional.upsert({
      where: { id: "prof-1" },
      update: {},
      create: {
        id: "prof-1",
        tenantId: tenant.id,
        name: "Dra. Ana Silva",
        email: "ana@clinicademo.com",
        phone: "11988881111",
        specialty: "Dermatologista",
        bio: "Especialista em procedimentos estéticos faciais",
        bufferTime: 15,
        workingHours: {
          monday: { open: "08:00", close: "18:00", enabled: true },
          tuesday: { open: "08:00", close: "18:00", enabled: true },
          wednesday: { open: "08:00", close: "18:00", enabled: true },
          thursday: { open: "08:00", close: "18:00", enabled: true },
          friday: { open: "08:00", close: "18:00", enabled: true },
          saturday: { open: "08:00", close: "12:00", enabled: false },
          sunday: { open: "08:00", close: "12:00", enabled: false },
        },
      },
    }),
    prisma.professional.upsert({
      where: { id: "prof-2" },
      update: {},
      create: {
        id: "prof-2",
        tenantId: tenant.id,
        name: "Dr. Carlos Santos",
        email: "carlos@clinicademo.com",
        phone: "11988882222",
        specialty: "Cirurgião Plástico",
        bio: "Especialista em harmonização facial e corporal",
        bufferTime: 20,
        workingHours: {
          monday: { open: "09:00", close: "17:00", enabled: true },
          tuesday: { open: "09:00", close: "17:00", enabled: true },
          wednesday: { open: "09:00", close: "17:00", enabled: true },
          thursday: { open: "09:00", close: "17:00", enabled: true },
          friday: { open: "09:00", close: "17:00", enabled: true },
          saturday: { open: "08:00", close: "12:00", enabled: true },
          sunday: { open: "08:00", close: "12:00", enabled: false },
        },
      },
    }),
  ]);
  console.log(`✅ ${professionals.length} profissionais criados`);

  // 5. Criar serviços
  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: "svc-1" },
      update: {},
      create: {
        id: "svc-1",
        tenantId: tenant.id,
        name: "Aplicação de Botox",
        description: "Procedimento para redução de rugas de expressão",
        duration: 30,
        price: 800,
        category: "Injetáveis",
        procedureTypeId: procedureTypes[0].id,
      },
    }),
    prisma.service.upsert({
      where: { id: "svc-2" },
      update: {},
      create: {
        id: "svc-2",
        tenantId: tenant.id,
        name: "Preenchimento Labial",
        description: "Aumento e definição dos lábios com ácido hialurônico",
        duration: 45,
        price: 1200,
        category: "Injetáveis",
        procedureTypeId: procedureTypes[1].id,
      },
    }),
    prisma.service.upsert({
      where: { id: "svc-3" },
      update: {},
      create: {
        id: "svc-3",
        tenantId: tenant.id,
        name: "Limpeza de Pele Profunda",
        description: "Limpeza com extração, peeling e máscara",
        duration: 60,
        price: 180,
        category: "Facial",
        procedureTypeId: procedureTypes[2].id,
      },
    }),
    prisma.service.upsert({
      where: { id: "svc-4" },
      update: {},
      create: {
        id: "svc-4",
        tenantId: tenant.id,
        name: "Harmonização Facial Completa",
        description: "Procedimento completo de harmonização facial",
        duration: 120,
        price: 3500,
        category: "Harmonização",
        procedureTypeId: procedureTypes[3].id,
      },
    }),
    prisma.service.upsert({
      where: { id: "svc-5" },
      update: {},
      create: {
        id: "svc-5",
        tenantId: tenant.id,
        name: "Avaliação Inicial",
        description: "Consulta de avaliação para novos pacientes",
        duration: 30,
        price: 200,
        category: "Consulta",
      },
    }),
  ]);
  console.log(`✅ ${services.length} serviços criados`);

  // 6. Vincular profissionais aos serviços
  for (const pro of professionals) {
    for (const svc of services) {
      await prisma.professionalService.upsert({
        where: {
          professionalId_serviceId: {
            professionalId: pro.id,
            serviceId: svc.id,
          },
        },
        update: {},
        create: {
          professionalId: pro.id,
          serviceId: svc.id,
        },
      });
    }
  }
  console.log(`✅ Profissionais vinculados aos serviços`);

  // 7. Criar clientes de teste
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: "11999991111" } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: "Maria Oliveira",
        email: "maria@email.com",
        phone: "11999991111",
        cpf: "12345678901",
        birthDate: new Date("1985-03-15"),
        address: "Rua Augusta, 500",
        city: "São Paulo",
        state: "SP",
        allowsMarketing: true,
      },
    }),
    prisma.client.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: "11999992222" } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: "João Santos",
        email: "joao@email.com",
        phone: "11999992222",
        birthDate: new Date("1990-07-22"),
        city: "São Paulo",
        state: "SP",
        allowsMarketing: true,
      },
    }),
    prisma.client.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: "11999993333" } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: "Fernanda Lima",
        email: "fernanda@email.com",
        phone: "11999993333",
        birthDate: new Date("1988-11-08"),
        city: "Guarulhos",
        state: "SP",
        allowsMarketing: false,
      },
    }),
    prisma.client.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: "11999994444" } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: "Pedro Costa",
        email: "pedro@email.com",
        phone: "11999994444",
        city: "São Paulo",
        state: "SP",
        allowsMarketing: true,
      },
    }),
    prisma.client.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: "11999995555" } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: "Ana Paula Souza",
        email: "anapaula@email.com",
        phone: "11999995555",
        birthDate: new Date("1992-01-30"),
        city: "Osasco",
        state: "SP",
        allowsMarketing: true,
      },
    }),
  ]);
  console.log(`✅ ${clients.length} clientes criados`);

  // 8. Criar alguns agendamentos
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const appointments = [];
  
  // Agendamentos para hoje
  for (let i = 0; i < 3; i++) {
    const startTime = new Date(today);
    startTime.setHours(9 + i * 2, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + services[i].duration);

    appointments.push(
      prisma.appointment.create({
        data: {
          tenantId: tenant.id,
          clientId: clients[i].id,
          professionalId: professionals[0].id,
          serviceId: services[i].id,
          startTime,
          endTime,
          duration: services[i].duration,
          price: services[i].price,
          status: i === 0 ? "CONFIRMED" : "SCHEDULED",
        },
      })
    );
  }

  // Agendamentos para amanhã
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  for (let i = 0; i < 2; i++) {
    const startTime = new Date(tomorrow);
    startTime.setHours(10 + i * 3, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + services[i + 2].duration);

    appointments.push(
      prisma.appointment.create({
        data: {
          tenantId: tenant.id,
          clientId: clients[i + 3].id,
          professionalId: professionals[1].id,
          serviceId: services[i + 2].id,
          startTime,
          endTime,
          duration: services[i + 2].duration,
          price: services[i + 2].price,
          status: "SCHEDULED",
        },
      })
    );
  }

  await Promise.all(appointments);
  console.log(`✅ ${appointments.length} agendamentos criados`);

  // 9. Criar alguns pagamentos de teste
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        tenantId: tenant.id,
        clientId: clients[0].id,
        amount: 800,
        description: "Aplicação de Botox",
        billingType: "PIX",
        dueDate: lastMonth,
        paidAt: lastMonth,
        status: "RECEIVED",
      },
    }),
    prisma.payment.create({
      data: {
        tenantId: tenant.id,
        clientId: clients[1].id,
        amount: 1200,
        description: "Preenchimento Labial",
        billingType: "CREDIT_CARD",
        dueDate: lastMonth,
        paidAt: lastMonth,
        status: "RECEIVED",
      },
    }),
    prisma.payment.create({
      data: {
        tenantId: tenant.id,
        clientId: clients[2].id,
        amount: 180,
        description: "Limpeza de Pele",
        billingType: "PIX",
        dueDate: today,
        paidAt: today,
        status: "RECEIVED",
      },
    }),
  ]);
  console.log(`✅ ${payments.length} pagamentos criados`);

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log(`
📊 Resumo:
- 1 Tenant: ${tenant.name}
- ${procedureTypes.length} Tipos de Procedimento
- ${professionals.length} Profissionais
- ${services.length} Serviços
- ${clients.length} Clientes
- ${appointments.length} Agendamentos
- ${payments.length} Pagamentos

⚠️  IMPORTANTE:
Para que os dados apareçam no dashboard, você precisa:
1. Criar uma conta no Clerk (clerk.com)
2. Configurar CLERK_SECRET_KEY e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY no .env
3. Fazer login na aplicação
4. Criar um User vinculado ao Tenant de teste:

Execute este SQL no Prisma Studio (npx prisma studio):

INSERT INTO "User" (id, "createdAt", "updatedAt", "clerkUserId", email, name, "tenantId", role)
VALUES (gen_random_uuid(), NOW(), NOW(), 'SEU_CLERK_USER_ID', 'seu@email.com', 'Seu Nome', '${tenant.id}', 'OWNER');

Substitua SEU_CLERK_USER_ID pelo ID do usuário no Clerk (começa com "user_").
`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
