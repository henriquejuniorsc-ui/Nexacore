"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, Users, Briefcase, CreditCard,
  Settings, Bot, Menu, X, Zap, ChevronLeft, Bell,
  UserCircle, HelpCircle, MessageSquare,
  Package, Sparkles, UsersRound, Search, Command
} from "lucide-react";
import { cn, getGreeting } from "@/lib/utils";
import { SocketProvider } from "@/components/providers/SocketProvider";

// Animation constants
const EASE = [0.25, 0.1, 0.25, 1];
const DURATION = { fast: 0.15, normal: 0.2, slow: 0.3 };

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agendamentos", href: "/appointments", icon: Calendar },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Profissionais", href: "/professionals", icon: UserCircle },
  { name: "Serviços", href: "/services", icon: Briefcase },
  { name: "Produtos", href: "/products", icon: Package },
  { name: "Pagamentos", href: "/payments", icon: CreditCard },
  { name: "Upsell", href: "/upsell", icon: Sparkles },
  { name: "Inbox", href: "/inbox", icon: MessageSquare, badge: true },
  { name: "Assistente IA", href: "/ai-assistant", icon: Bot },
  { name: "Equipe", href: "/team", icon: UsersRound },
];

const bottomNavigation = [
  { name: "Configurações", href: "/settings", icon: Settings },
  { name: "Ajuda", href: "/help", icon: HelpCircle },
];

// Loading component
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <motion.div
          className="w-16 h-16 bg-brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow"
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 0 20px rgba(255, 0, 110, 0.3)",
              "0 0 40px rgba(255, 0, 110, 0.5)",
              "0 0 20px rgba(255, 0, 110, 0.3)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Zap className="w-8 h-8 text-white" />
        </motion.div>
        <div className="w-48 h-1 bg-surface-hover rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-brand-gradient rounded-full"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <motion.p
          className="text-text-secondary mt-4 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Preparando seu workspace...
        </motion.p>
      </motion.div>
    </div>
  );
}

// Sidebar component
function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse
}: {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col",
        "bg-surface/95 backdrop-blur-xl border-r border-white/10",
        "transition-all duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "lg:w-20" : "lg:w-64",
        "w-64"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 bg-brand-gradient rounded-xl flex items-center justify-center shadow-glow flex-shrink-0"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-5 h-5 text-white" />
            </motion.div>
            {!isCollapsed && (
              <span className="font-heading text-lg text-text-primary">NexaCore</span>
            )}
          </Link>

          <motion.button
            onClick={onClose}
            className="lg:hidden p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-hover"
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>

          <motion.button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-hover"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: DURATION.normal }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.div>
          </motion.button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: DURATION.normal }}
              >
                <Link href={item.href} onClick={onClose}>
                  <motion.div
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150",
                      isActive
                        ? "text-white"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                    )}
                    whileHover={{ x: isCollapsed ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-brand-gradient rounded-xl shadow-glow"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-3">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium whitespace-nowrap">{item.name}</span>
                      )}
                    </span>
                    {item.badge && !isCollapsed && (
                      <motion.span
                        className="relative z-10 ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-error/20 text-error"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        3
                      </motion.span>
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5 space-y-1">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} onClick={onClose}>
                <motion.div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150",
                    isActive
                      ? "bg-surface-hover text-text-primary"
                      : "text-text-tertiary hover:text-text-secondary hover:bg-surface-hover"
                  )}
                  whileHover={{ x: isCollapsed ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="whitespace-nowrap">{item.name}</span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}

// TopBar component
function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useUser();
  const greeting = getGreeting();
  const [hasNotifications] = useState(true);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: DURATION.normal, delay: 0.1 }}
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 bg-background/80 backdrop-blur-xl border-b border-white/5"
    >
      <div className="flex items-center gap-4">
        <motion.button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-hover"
          whileTap={{ scale: 0.9 }}
        >
          <Menu className="w-5 h-5" />
        </motion.button>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-text-tertiary text-sm">{greeting},</p>
          <p className="text-text-primary font-medium">{user?.firstName || "Admin"}</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="hidden md:flex items-center"
      >
        <motion.button
          className="flex items-center gap-3 px-4 py-2 bg-surface/50 border border-white/10 rounded-xl text-text-tertiary hover:text-text-secondary hover:border-white/20 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Buscar...</span>
          <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-surface-hover rounded-md border border-white/10">
            <Command className="w-3 h-3" />K
          </kbd>
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2"
      >
        <motion.button
          className="relative p-2.5 text-text-tertiary hover:text-text-primary rounded-xl hover:bg-surface-hover transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="w-5 h-5" />
          {hasNotifications && (
            <motion.span
              className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            />
          )}
        </motion.button>

        <div className="ml-2">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-9 h-9 ring-2 ring-white/10 hover:ring-white/20 transition-all",
                userButtonPopoverCard: "bg-surface border border-white/10 shadow-2xl",
                userButtonPopoverActionButton: "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
                userButtonPopoverActionButtonText: "text-text-secondary",
                userButtonPopoverActionButtonIcon: "text-text-tertiary",
                userButtonPopoverFooter: "hidden",
              },
            }}
          />
        </div>
      </motion.div>
    </motion.header>
  );
}

// Main Layout
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setCheckingOnboarding(false);
      return;
    }
    if (pathname === "/onboarding") {
      setCheckingOnboarding(false);
      return;
    }

    const checkOnboarding = async () => {
      try {
        const response = await fetch("/api/tenants");
        const data = await response.json();

        if (data.needsOnboarding) {
          if (data.reason === "not_authenticated" && retryCount < 3) {
            setRetryCount(prev => prev + 1);
            setTimeout(() => checkOnboarding(), 1000);
            return;
          }
          if (data.reason === "user_not_provisioned") {
            setNeedsOnboarding(true);
            router.push("/onboarding");
            return;
          }
        }
        setNeedsOnboarding(false);
        setCheckingOnboarding(false);
      } catch (error) {
        console.error("[Dashboard] Error checking onboarding:", error);
        setCheckingOnboarding(false);
      }
    };
    checkOnboarding();
  }, [pathname, router, isLoaded, isSignedIn, retryCount]);

  if (checkingOnboarding || (needsOnboarding && pathname !== "/onboarding")) {
    return <LoadingSkeleton />;
  }

  if (pathname === "/onboarding") {
    return <>{children}</>;
  }

  return (
    <SocketProvider>
      <div className="min-h-screen bg-background">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className={cn(
          "min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}>
          <TopBar onMenuClick={() => setSidebarOpen(true)} />

          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: DURATION.normal, ease: EASE }}
              className="p-4 lg:p-6"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </SocketProvider>
  );
}