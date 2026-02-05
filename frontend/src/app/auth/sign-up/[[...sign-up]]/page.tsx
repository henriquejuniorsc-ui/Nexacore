import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Zap, Check } from "lucide-react";

const benefits = [
  "14 dias de teste grátis",
  "Sem cartão de crédito",
  "Configuração em minutos",
  "Suporte em português",
];

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-pink/20 via-transparent to-transparent" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-brand-orange/20 rounded-full blur-[128px]" />
        
        <div className="relative flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-gradient rounded-lg flex items-center justify-center glow">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-2xl text-text-primary">NexaCore</span>
          </Link>

          {/* Content */}
          <div className="max-w-md">
            <h1 className="font-heading text-display-3 text-text-primary mb-4">
              Comece sua jornada de automação
            </h1>
            <p className="text-text-secondary text-lg mb-8">
              Junte-se a centenas de clínicas que já economizam horas por dia com a NexaCore.
            </p>

            {/* Benefits */}
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <span className="text-text-secondary">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <p className="text-text-tertiary text-sm">
            © {new Date().getFullYear()} NexaCore. Tecnologia que conecta ideias.
          </p>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-brand-gradient rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-2xl text-text-primary">NexaCore</span>
          </div>

          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-surface border border-white/10 shadow-xl",
                headerTitle: "text-text-primary font-heading",
                headerSubtitle: "text-text-secondary",
                socialButtonsBlockButton: "bg-surface-hover border-white/10 text-text-primary hover:bg-white/10",
                socialButtonsBlockButtonText: "text-text-primary",
                dividerLine: "bg-white/10",
                dividerText: "text-text-tertiary",
                formFieldLabel: "text-text-secondary",
                formFieldInput: "bg-surface border-white/10 text-text-primary focus:border-cta focus:ring-cta/50",
                formButtonPrimary: "bg-cta text-cta-text hover:bg-cta-hover shadow-cta",
                footerActionLink: "text-cta hover:text-cta-hover",
                identityPreviewText: "text-text-primary",
                identityPreviewEditButton: "text-cta",
                formFieldInputShowPasswordButton: "text-text-tertiary hover:text-text-primary",
                alertText: "text-text-secondary",
                formFieldSuccessText: "text-success",
                formFieldErrorText: "text-error",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
