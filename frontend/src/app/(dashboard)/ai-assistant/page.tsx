"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, Calendar, Users, CreditCard, TrendingUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  { icon: Calendar, text: "Quantos agendamentos tenho hoje?" },
  { icon: Users, text: "Quais clientes não retornam há mais de 3 meses?" },
  { icon: CreditCard, text: "Qual foi o faturamento dessa semana?" },
  { icon: TrendingUp, text: "Quais são os serviços mais procurados?" },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Olá! 👋 Sou sua assistente virtual. Posso ajudar você a consultar dados da sua clínica, como agendamentos, faturamento, clientes e muito mais. Como posso ajudar?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Chamar API real
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.error || "Desculpe, não consegui processar sua pergunta.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center glow">
          <Bot className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-2xl text-text-primary">Assistente IA</h1>
          <p className="text-text-secondary">
            Pergunte qualquer coisa sobre sua clínica
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-success text-sm font-medium">Online</span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 glass-card flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-cta text-cta-text rounded-br-md"
                    : "bg-surface-hover text-text-primary rounded-bl-md"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className={cn(
                  "text-xs mt-1",
                  message.role === "user" ? "text-black/50" : "text-text-tertiary"
                )}>
                  {message.timestamp.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center flex-shrink-0">
                  <span className="text-text-primary text-sm font-medium">V</span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-surface-hover rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-pink" />
                  <span className="text-text-secondary">Pensando...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="p-4 border-t border-white/10">
            <p className="text-text-tertiary text-sm mb-3">Perguntas sugeridas:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(question.text)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors text-sm"
                >
                  <question.icon className="w-4 h-4" />
                  {question.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua pergunta..."
                rows={1}
                className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-white/10 text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:border-cta focus:ring-1 focus:ring-cta/50"
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                input.trim() && !isLoading
                  ? "bg-cta text-cta-text hover:bg-cta-hover shadow-cta"
                  : "bg-surface-hover text-text-tertiary cursor-not-allowed"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-text-tertiary text-xs mt-2 text-center">
            Pressione Enter para enviar • Shift + Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}

// Mock response generator (replace with actual AI integration)
function generateMockResponse(question: string): string {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes("agendamento") && lowerQuestion.includes("hoje")) {
    return `📅 **Agendamentos de Hoje**

Você tem **12 agendamentos** para hoje:

• 09:00 - Maria Silva (Limpeza de Pele) - Dra. Ana
• 10:30 - João Santos (Botox) - Dr. Ricardo  
• 11:00 - Carla Oliveira (Consulta) - Dra. Ana
• 14:00 - Pedro Lima (Harmonização) - Dr. Ricardo
• 15:30 - Fernanda Costa (Preenchimento) - Dra. Ana
...e mais 7 agendamentos.

**Status:**
✅ 8 confirmados
⏳ 3 aguardando confirmação
❌ 1 cancelado

Quer que eu envie lembretes para os que ainda não confirmaram?`;
  }

  if (lowerQuestion.includes("faturamento") || lowerQuestion.includes("receita")) {
    return `💰 **Faturamento da Semana**

Total: **R$ 18.450,00**

**Por serviço:**
• Botox: R$ 7.200 (6 procedimentos)
• Preenchimento: R$ 5.400 (4 procedimentos)
• Limpeza de Pele: R$ 3.150 (9 procedimentos)
• Outros: R$ 2.700

**Comparativo:**
📈 +15% em relação à semana passada
📊 Meta mensal: 68% atingida

Quer ver o detalhamento por profissional?`;
  }

  if (lowerQuestion.includes("cliente") && (lowerQuestion.includes("retorn") || lowerQuestion.includes("3 meses"))) {
    return `👥 **Clientes sem Retorno (+90 dias)**

Encontrei **23 clientes** que não visitam a clínica há mais de 3 meses:

**Top 5 por valor potencial:**
1. Ana Paula Souza - Último: Botox (95 dias) - Potencial: R$ 1.200
2. Fernanda Lima - Último: Preenchimento (110 dias) - Potencial: R$ 1.350
3. Roberto Carlos - Último: Harmonização (102 dias) - Potencial: R$ 2.500
4. Juliana Mendes - Último: Limpeza (98 dias) - Potencial: R$ 350
5. Marcelo Santos - Último: Botox (91 dias) - Potencial: R$ 1.200

Quer que eu envie mensagens de recuperação para esses clientes?`;
  }

  if (lowerQuestion.includes("serviço") && lowerQuestion.includes("procurad")) {
    return `📊 **Serviços Mais Procurados (Último Mês)**

1. 🥇 **Botox** - 45 procedimentos (32%)
2. 🥈 **Limpeza de Pele** - 38 procedimentos (27%)
3. 🥉 **Preenchimento Labial** - 28 procedimentos (20%)
4. **Harmonização Facial** - 18 procedimentos (13%)
5. **Skinbooster** - 11 procedimentos (8%)

**Tendência:**
📈 Botox +20% vs mês anterior
📈 Skinbooster +35% (novo destaque!)
📉 Limpeza de Pele -5%

Dica: Considere criar pacotes combinando Botox + Skinbooster para aumentar o ticket médio.`;
  }

  return `Entendi sua pergunta! 🤔

Para fornecer informações precisas sobre "${question}", preciso acessar os dados atualizados da sua clínica.

Enquanto isso, posso ajudar com:
• 📅 Consultar agendamentos
• 💰 Ver faturamento e receitas
• 👥 Analisar base de clientes
• 📊 Gerar relatórios de serviços
• 🔔 Verificar lembretes pendentes

Reformule sua pergunta ou escolha uma das opções acima!`;
}
