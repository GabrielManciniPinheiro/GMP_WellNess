"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient"; // Ajuste o caminho se necessário
import { Button } from "../../components/ui/button";
import {
  CheckCircle2,
  Home,
  Sparkles,
  User,
  Calendar,
  Clock,
  Loader2,
  MailWarning,
} from "lucide-react";

// Função auxiliar para formatar data (AAAA-MM-DD -> DD/MM/AAAA)
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("id");

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!appointmentId) return;

      try {
        const { data, error } = await supabase
          .from("appointments")
          .select(
            `
            *,
            services (name),
            therapists (name)
          `
          )
          .eq("id", appointmentId)
          .single();

        if (error) throw error;
        setAppointment(data);
      } catch (error) {
        console.error("Erro ao buscar detalhes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentDetails();
  }, [appointmentId]);

  return (
    <div className="min-h-screen bg-[#fffcfa] flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-6 md:p-8 text-center animate-in zoom-in duration-500 border border-green-100 my-8">
        {/* --- CABEÇALHO DA ANIMAÇÃO (Mantido do Sucess Page) --- */}
        <div className="mb-6 flex justify-center">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Confirmado!
        </h1>

        <p className="text-gray-500 mb-6">
          Sua sessão foi agendada e garantida.
        </p>

        {/* --- ÁREA DE CONTEÚDO DINÂMICO --- */}
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Carregando detalhes do agendamento...</p>
          </div>
        ) : appointment ? (
          <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Aviso de Email (Estilo BookingSummary) */}
            <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-amber-600 bg-amber-50 py-2 px-3 rounded-full w-full border border-amber-200 text-center">
              <MailWarning className="w-4 h-4 flex-shrink-0" />
              <p>
                Confirmação enviada para{" "}
                <strong>{appointment.client_email}</strong>. (Verifique o Spam)
              </p>
            </div>

            {/* Card de Detalhes (Estilo BookingSummary) */}
            <div className="bg-accent/50 rounded-2xl p-5 space-y-4 border border-primary/10">
              {/* Serviço */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Serviço
                  </p>
                  <p className="font-semibold text-gray-900">
                    {appointment.services?.name}
                  </p>
                </div>
              </div>

              {/* Terapeuta */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Profissional
                  </p>
                  <p className="font-semibold text-gray-900">
                    {appointment.therapists?.name}
                  </p>
                </div>
              </div>

              {/* Data e Hora */}
              <div className="flex gap-4">
                <div className="flex-1 flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Data
                    </p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(appointment.date)}
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Horário
                    </p>
                    <p className="font-semibold text-gray-900">
                      {appointment.time}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dados do Cliente */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-sm">
              <h4 className="font-semibold mb-2 text-gray-700">
                Titular do Agendamento
              </h4>
              <p className="text-gray-600">
                <span className="font-medium">Nome: </span>{" "}
                {appointment.client_name}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Telefone: </span>{" "}
                {appointment.client_phone}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-6 text-red-500">
            Não foi possível carregar os detalhes do agendamento. Mas fique
            tranquilo, se o pagamento foi confirmado, sua vaga está garantida!
          </div>
        )}

        <div className="mt-8 space-y-3">
          {appointmentId && (
            <p className="text-[10px] text-muted-foreground text-center opacity-50">
              ID da Transação:{" "}
              <span className="font-mono">{appointmentId}</span>
            </p>
          )}

          <Link href="/" className="block">
            <Button className="w-full h-12 rounded-xl text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
              <Home className="mr-2 h-4 w-4" />
              Voltar para o Início
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          Carregando...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
