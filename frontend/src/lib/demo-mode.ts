/**
 * NexaCore - Demo Mode Configuration
 * 
 * Dados mocados para teste do sistema sem autenticação
 */

export const DEMO_MODE = true; // Toggle para ativar/desativar modo demo

export const DEMO_USER = {
    id: "demo-admin-user",
    firstName: "Admin",
    lastName: "Demo",
    fullName: "Admin Demo",
    email: "admin@demo.nexacore.com",
    imageUrl: null,
    role: "OWNER" as const,
};

export const DEMO_TENANT = {
    id: "demo-tenant-001",
    name: "Clínica Demonstração",
    slug: "clinica-demo",
    email: "contato@clinica-demo.com",
    phone: "(11) 99999-9999",
    timezone: "America/Sao_Paulo",
    isActive: true,
    onboardingStep: 5, // Onboarding completo
};

// Dados de exemplo para o dashboard
export const DEMO_STATS = {
    clientsTotal: 247,
    clientsChange: 12,
    appointmentsToday: 8,
    appointmentsChange: 3,
    revenueMonth: 45890.00,
    revenueChange: 15.5,
    conversionRate: 78,
    conversionChange: 5,
};

export const DEMO_APPOINTMENTS = [
    {
        id: "apt-001",
        clientName: "Maria Silva",
        service: "Limpeza de Pele",
        professional: "Dra. Ana Costa",
        time: "09:00",
        status: "CONFIRMED",
    },
    {
        id: "apt-002",
        clientName: "João Santos",
        service: "Botox",
        professional: "Dr. Carlos Lima",
        time: "10:30",
        status: "SCHEDULED",
    },
    {
        id: "apt-003",
        clientName: "Patricia Oliveira",
        service: "Peeling Químico",
        professional: "Dra. Ana Costa",
        time: "14:00",
        status: "CONFIRMED",
    },
    {
        id: "apt-004",
        clientName: "Roberto Almeida",
        service: "Harmonização Facial",
        professional: "Dr. Carlos Lima",
        time: "15:30",
        status: "SCHEDULED",
    },
    {
        id: "apt-005",
        clientName: "Carla Mendes",
        service: "Microagulhamento",
        professional: "Dra. Beatriz Souza",
        time: "16:30",
        status: "IN_PROGRESS",
    },
];

export const DEMO_CLIENTS = [
    { id: "cli-001", name: "Maria Silva", phone: "(11) 98765-4321", email: "maria@email.com", lastVisit: "2026-02-01" },
    { id: "cli-002", name: "João Santos", phone: "(11) 91234-5678", email: "joao@email.com", lastVisit: "2026-01-28" },
    { id: "cli-003", name: "Patricia Oliveira", phone: "(11) 99876-5432", email: "patricia@email.com", lastVisit: "2026-01-25" },
    { id: "cli-004", name: "Roberto Almeida", phone: "(11) 94321-8765", email: "roberto@email.com", lastVisit: "2026-01-20" },
    { id: "cli-005", name: "Carla Mendes", phone: "(11) 95678-1234", email: "carla@email.com", lastVisit: "2026-02-03" },
];

export const DEMO_SERVICES = [
    { id: "srv-001", name: "Limpeza de Pele", duration: 60, price: 150.00, category: "Facial" },
    { id: "srv-002", name: "Botox", duration: 30, price: 800.00, category: "Injetáveis" },
    { id: "srv-003", name: "Peeling Químico", duration: 45, price: 350.00, category: "Facial" },
    { id: "srv-004", name: "Harmonização Facial", duration: 90, price: 2500.00, category: "Injetáveis" },
    { id: "srv-005", name: "Microagulhamento", duration: 60, price: 450.00, category: "Facial" },
    { id: "srv-006", name: "Depilação a Laser", duration: 30, price: 200.00, category: "Corporal" },
];

export const DEMO_PROFESSIONALS = [
    { id: "pro-001", name: "Dra. Ana Costa", specialty: "Dermatologista", avatar: null },
    { id: "pro-002", name: "Dr. Carlos Lima", specialty: "Cirurgião Plástico", avatar: null },
    { id: "pro-003", name: "Dra. Beatriz Souza", specialty: "Esteticista", avatar: null },
];

export const DEMO_INBOX_MESSAGES = [
    {
        id: "msg-001",
        clientName: "Maria Silva",
        clientPhone: "(11) 98765-4321",
        lastMessage: "Olá! Gostaria de remarcar meu horário de amanhã",
        unreadCount: 2,
        timestamp: "10:45",
        status: "OPEN",
    },
    {
        id: "msg-002",
        clientName: "João Santos",
        clientPhone: "(11) 91234-5678",
        lastMessage: "Confirmado! Até amanhã às 10:30",
        unreadCount: 0,
        timestamp: "09:30",
        status: "RESOLVED",
    },
    {
        id: "msg-003",
        clientName: "Nova Lead",
        clientPhone: "(11) 99999-0000",
        lastMessage: "Oi, quanto custa o procedimento de botox?",
        unreadCount: 1,
        timestamp: "Agora",
        status: "OPEN",
    },
];
