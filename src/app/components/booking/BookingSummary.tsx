import {
  Calendar,
  Clock,
  User,
  Sparkles,
  CheckCircle2,
  MailWarning,
} from "lucide-react";

interface BookingSummaryProps {
  service: string;
  therapist: string;
  date: string;
  time: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
}

export function BookingSummary({
  service,
  therapist,
  date,
  time,
  contact,
}: BookingSummaryProps) {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-primary">
          Agendamento Confirmado!
        </h2>

        <div className="mt-4 space-y-2">
          <p className="text-muted-foreground">
            Enviamos um e-mail de confirmação para{" "}
            <span className="font-medium text-foreground">{contact.email}</span>
          </p>

          {/* MENSAGEM DE ALERTA SOBRE SPAM */}
          <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 py-2 px-4 rounded-full w-fit mx-auto border border-amber-200">
            <MailWarning className="w-4 h-4" />
            <p>
              Caso não encontre, verifique sua caixa de <strong>Spam</strong> ou{" "}
              <strong>Lixo Eletrônico</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-accent/50 rounded-2xl p-6 space-y-4 border-2 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground text-sm font-medium">Serviço</p>
            <p className="mt-1 font-semibold">{service}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground text-sm font-medium">
              Terapeuta
            </p>
            <p className="mt-1 font-semibold">{therapist}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground text-sm font-medium">Data</p>
            <p className="mt-1 font-semibold">{date}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground text-sm font-medium">Horário</p>
            <p className="mt-1 font-semibold">{time}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 border-2 border-border/50">
        <h4 className="mb-3 font-semibold">Dados de Contato</h4>
        <div className="space-y-2 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Nome:</span>{" "}
            {contact.name}
          </p>
          <p>
            <span className="font-medium text-foreground">E-mail:</span>{" "}
            {contact.email}
          </p>
          <p>
            <span className="font-medium text-foreground">Telefone:</span>{" "}
            {contact.phone}
          </p>
        </div>
      </div>
    </div>
  );
}
