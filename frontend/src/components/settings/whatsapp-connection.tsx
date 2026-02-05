"use client";

import { useState, useEffect } from "react";
import { 
  MessageSquare, QrCode, RefreshCw, Check, X, 
  Loader2, Smartphone, Wifi, WifiOff, AlertTriangle
} from "lucide-react";

interface WhatsAppStatus {
  connected: boolean;
  status: "connected" | "qrcode" | "connecting" | "disconnected" | "error";
  qrCode?: string;
  phone?: string;
  message: string;
}

export default function WhatsAppConnection() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Buscar status
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp");
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      setStatus({
        connected: false,
        status: "error",
        message: "Erro ao verificar status",
      });
    } finally {
      setLoading(false);
    }
  };

  // Conectar
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/whatsapp", { method: "POST" });
      const data = await res.json();
      setStatus(data);
      
      // Se retornou QR, iniciar polling
      if (data.status === "qrcode") {
        startPolling();
      }
    } catch (error) {
      alert("Erro ao conectar. Verifique se a Evolution API está rodando.");
    } finally {
      setConnecting(false);
    }
  };

  // Desconectar
  const handleDisconnect = async () => {
    if (!confirm("Deseja desconectar o WhatsApp?")) return;
    
    try {
      await fetch("/api/whatsapp?full=true", { method: "DELETE" });
      setStatus({
        connected: false,
        status: "disconnected",
        message: "WhatsApp desconectado",
      });
    } catch (error) {
      alert("Erro ao desconectar");
    }
  };

  // Polling para verificar se conectou
  const startPolling = () => {
    let count = 0;
    const interval = setInterval(async () => {
      count++;
      if (count > 60) { // 3 minutos máximo
        clearInterval(interval);
        return;
      }
      
      try {
        const res = await fetch("/api/whatsapp");
        const data = await res.json();
        setStatus(data);
        
        if (data.connected) {
          clearInterval(interval);
        }
      } catch {}
    }, 3000);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Renderizar QR Code
  const renderQRCode = (qr: string | undefined) => {
    if (!qr) return null;
    
    // Se já é data URL
    if (qr.startsWith("data:")) {
      return <img src={qr} alt="QR Code" className="w-64 h-64" />;
    }
    
    // Se é base64 puro
    return <img src={`data:image/png;base64,${qr}`} alt="QR Code" className="w-64 h-64" />;
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            status?.connected ? "bg-green-500/20" : "bg-pink-500/20"
          }`}>
            <MessageSquare className={`w-6 h-6 ${
              status?.connected ? "text-green-500" : "text-pink-500"
            }`} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">WhatsApp Business</h3>
            <p className="text-gray-400 text-sm">Evolution API v2.3.7</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          status?.connected 
            ? "bg-green-500/20 text-green-400" 
            : status?.status === "qrcode"
            ? "bg-yellow-500/20 text-yellow-400"
            : "bg-red-500/20 text-red-400"
        }`}>
          {status?.connected ? (
            <><Wifi className="w-4 h-4" /> Conectado</>
          ) : status?.status === "qrcode" ? (
            <><QrCode className="w-4 h-4" /> QR Code</>
          ) : (
            <><WifiOff className="w-4 h-4" /> Desconectado</>
          )}
        </div>
      </div>

      {/* CONECTADO */}
      {status?.connected && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <Smartphone className="w-10 h-10 text-green-500" />
            <div>
              <p className="text-white font-medium">WhatsApp Conectado!</p>
              <p className="text-gray-400">{status.phone || "Número conectado"}</p>
            </div>
            <Check className="w-6 h-6 text-green-500 ml-auto" />
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-400 font-medium">Evolution API v2.3.7</p>
                <p className="text-gray-400">Suporte completo a LID (remoteJidAlt)</p>
              </div>
            </div>
          </div>

          <p className="text-gray-400 text-sm">
            ✅ A IA está pronta para responder mensagens automaticamente.
          </p>

          <button
            onClick={handleDisconnect}
            className="w-full py-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Desconectar WhatsApp
          </button>
        </div>
      )}

      {/* QR CODE */}
      {status?.status === "qrcode" && status.qrCode && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-300 mb-4">
              Escaneie o QR Code com seu WhatsApp
            </p>
            
            <div className="inline-block p-4 bg-white rounded-xl">
              {renderQRCode(status.qrCode)}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Aguardando leitura...</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gray-800/50">
            <p className="text-white font-medium mb-2">📱 Como conectar:</p>
            <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
              <li>Abra o WhatsApp no celular</li>
              <li>Toque em Menu (⋮) → Dispositivos conectados</li>
              <li>Toque em "Conectar um dispositivo"</li>
              <li>Escaneie este QR Code</li>
            </ol>
          </div>

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full py-2 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 flex items-center justify-center gap-2"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Gerar Novo QR Code
          </button>
        </div>
      )}

      {/* DESCONECTADO */}
      {!status?.connected && status?.status !== "qrcode" && (
        <div className="space-y-4">
          <div className="p-6 rounded-lg bg-gray-800/50 text-center">
            <QrCode className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">
              WhatsApp não conectado
            </p>
            <p className="text-gray-400 text-sm">
              Conecte seu WhatsApp para habilitar o atendimento automático.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-400 font-medium">Evolution API v2.3.7</p>
                <p className="text-gray-400">Correção de problemas com LID (@lid)</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold hover:opacity-90 flex items-center justify-center gap-2"
          >
            {connecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <QrCode className="w-5 h-5" />
            )}
            {connecting ? "Conectando..." : "Conectar WhatsApp"}
          </button>

          {status?.status === "error" && (
            <p className="text-red-400 text-sm text-center">
              ⚠️ {status.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
