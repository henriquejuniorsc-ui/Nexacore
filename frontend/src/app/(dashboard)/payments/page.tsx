"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  CreditCard, Plus, Search, Filter, ExternalLink, Download,
  Check, Clock, AlertCircle, XCircle, RefreshCw, Eye
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

// Mock data
const mockPayments = [
  {
    id: "1",
    client: "Maria Silva",
    description: "Botox - Região Frontal",
    amount: 1200,
    status: "received",
    billingType: "pix",
    dueDate: new Date("2024-03-01"),
    paidAt: new Date("2024-03-01"),
    invoiceUrl: "https://asaas.com/invoice/123",
  },
  {
    id: "2",
    client: "João Santos",
    description: "Preenchimento Labial",
    amount: 1350,
    status: "pending",
    billingType: "pix",
    dueDate: new Date("2024-03-05"),
    paidAt: null,
    invoiceUrl: "https://asaas.com/invoice/124",
  },
  {
    id: "3",
    client: "Carla Oliveira",
    description: "Limpeza de Pele",
    amount: 350,
    status: "received",
    billingType: "credit_card",
    dueDate: new Date("2024-02-28"),
    paidAt: new Date("2024-02-28"),
    invoiceUrl: "https://asaas.com/invoice/125",
  },
  {
    id: "4",
    client: "Pedro Lima",
    description: "Harmonização Facial",
    amount: 2500,
    status: "overdue",
    billingType: "boleto",
    dueDate: new Date("2024-02-20"),
    paidAt: null,
    invoiceUrl: "https://asaas.com/invoice/126",
  },
  {
    id: "5",
    client: "Ana Paula Souza",
    description: "Skinbooster",
    amount: 800,
    status: "canceled",
    billingType: "pix",
    dueDate: new Date("2024-02-25"),
    paidAt: null,
    invoiceUrl: null,
  },
];

const statusConfig = {
  pending: { 
    icon: Clock, 
    label: "Pendente", 
    bg: "bg-warning/20", 
    text: "text-warning" 
  },
  received: { 
    icon: Check, 
    label: "Recebido", 
    bg: "bg-success/20", 
    text: "text-success" 
  },
  confirmed: { 
    icon: Check, 
    label: "Confirmado", 
    bg: "bg-success/20", 
    text: "text-success" 
  },
  overdue: { 
    icon: AlertCircle, 
    label: "Vencido", 
    bg: "bg-error/20", 
    text: "text-error" 
  },
  canceled: { 
    icon: XCircle, 
    label: "Cancelado", 
    bg: "bg-text-tertiary/20", 
    text: "text-text-tertiary" 
  },
  refunded: { 
    icon: RefreshCw, 
    label: "Estornado", 
    bg: "bg-trust/20", 
    text: "text-trust" 
  },
};

const billingTypeLabels = {
  pix: "PIX",
  boleto: "Boleto",
  credit_card: "Cartão",
};

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch = 
      payment.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalReceived = mockPayments
    .filter((p) => p.status === "received")
    .reduce((acc, p) => acc + p.amount, 0);

  const totalPending = mockPayments
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => acc + p.amount, 0);

  const totalOverdue = mockPayments
    .filter((p) => p.status === "overdue")
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-text-primary">Pagamentos</h1>
          <p className="text-text-secondary">
            Gerencie cobranças e recebimentos
          </p>
        </div>
        <Link href="/payments/new" className="btn-cta">
          <Plus className="w-5 h-5" />
          Nova Cobrança
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-text-tertiary text-sm">Recebido (Mês)</p>
          <p className="text-2xl font-bold text-success font-mono">
            {formatCurrency(totalReceived)}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-text-tertiary text-sm">Pendente</p>
          <p className="text-2xl font-bold text-warning font-mono">
            {formatCurrency(totalPending)}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-text-tertiary text-sm">Vencido</p>
          <p className="text-2xl font-bold text-error font-mono">
            {formatCurrency(totalOverdue)}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-text-tertiary text-sm">Total Cobranças</p>
          <p className="text-2xl font-bold text-text-primary font-mono">
            {mockPayments.length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente ou descrição..."
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "received", "overdue"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                filterStatus === status
                  ? "bg-brand-gradient text-white"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              )}
            >
              {status === "all" ? "Todos" : statusConfig[status as keyof typeof statusConfig]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-text-tertiary text-sm font-medium">Cliente</th>
                <th className="text-left p-4 text-text-tertiary text-sm font-medium hidden md:table-cell">Descrição</th>
                <th className="text-left p-4 text-text-tertiary text-sm font-medium">Valor</th>
                <th className="text-left p-4 text-text-tertiary text-sm font-medium hidden lg:table-cell">Forma</th>
                <th className="text-left p-4 text-text-tertiary text-sm font-medium hidden lg:table-cell">Vencimento</th>
                <th className="text-left p-4 text-text-tertiary text-sm font-medium">Status</th>
                <th className="text-right p-4 text-text-tertiary text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => {
                const status = statusConfig[payment.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;
                
                return (
                  <tr 
                    key={payment.id}
                    className="border-b border-white/5 hover:bg-surface-hover transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-text-primary font-bold">
                          {payment.client.charAt(0)}
                        </div>
                        <div>
                          <p className="text-text-primary font-medium">{payment.client}</p>
                          <p className="text-text-tertiary text-sm md:hidden">
                            {payment.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-text-secondary">{payment.description}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-text-primary font-mono font-bold">
                        {formatCurrency(payment.amount)}
                      </p>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="px-2 py-1 rounded bg-surface-hover text-text-secondary text-xs">
                        {billingTypeLabels[payment.billingType as keyof typeof billingTypeLabels]}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <p className="text-text-secondary">{formatDate(payment.dueDate)}</p>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        status.bg, status.text
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {payment.invoiceUrl && (
                          <a 
                            href={payment.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
                            title="Ver fatura"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button 
                          className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {payment.status === "overdue" && (
                          <button 
                            className="p-2 text-warning hover:text-warning/80 transition-colors"
                            title="Reenviar cobrança"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary">Nenhum pagamento encontrado</p>
            <p className="text-text-tertiary text-sm">
              Tente ajustar os filtros ou crie uma nova cobrança
            </p>
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface text-text-secondary hover:text-text-primary transition-colors">
          <Download className="w-4 h-4" />
          Exportar Relatório
        </button>
      </div>
    </div>
  );
}
