"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { Button } from "../../components/ui/button";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Phone,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "../../components/ui/sonner";

export default function CancelPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<
    | "loading"
    | "confirm"
    | "success"
    | "error"
    | "already_cancelled"
    | "too_late"
  >("loading");
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  // Lógica para verificar as 24 horas
  const checkCanCancel = (apptDate: string, apptTime: string) => {
    // Cria data do agendamento (YYYY-MM-DD + Time)
    const appointmentDateTime = new Date(`${apptDate}T${apptTime}`);
    const now = new Date();

    // Calcula diferença em horas
    const diffInMs = appointmentDateTime.getTime() - now.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    // Se faltar menos de 24h, retorna falso
    return diffInHours >= 24;
  };

  const fetchAppointment = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`*, services(name)`)
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data.status === "cancelled") {
        setStatus("already_cancelled");
      } else {
        // Verifica a regra de 24h
        const canCancel = checkCanCancel(data.date, data.time);

        if (canCancel) {
          setAppointment(data);
          setStatus("confirm");
        } else {
          setAppointment(data);
          setStatus("too_late"); // Novo status para bloqueio
        }
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;

      setStatus("success");
      toast.success("Agendamento cancelado com sucesso.");
    } catch (error) {
      toast.error("Erro ao cancelar.");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 NOVA LÓGICA DE REAGENDAMENTO SEGURO
  // Não cancela agora! Manda para a home com o ID na URL.
  // O cancelamento só acontece lá na Home se o usuário concluir o novo agendamento.
  const handleReschedule = () => {
    router.push(`/?rescheduleId=${id}`);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-card p-8 rounded-3xl border shadow-lg space-y-6">
        {/* CENÁRIO 1: CONFIRMAÇÃO (DENTRO DO PRAZO) */}
        {status === "confirm" && (
          <div className="animate-in fade-in zoom-in">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Gerenciar Agendamento</h1>
            <p className="text-muted-foreground mb-6">
              O que você deseja fazer com sua sessão de{" "}
              <strong>{appointment?.services?.name}</strong>?
            </p>

            <div className="space-y-3">
              {/* Botão Reagendar (Destaque) */}
              <Button
                className="w-full h-12 rounded-xl text-base"
                onClick={handleReschedule}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <CalendarDays className="mr-2 w-4 h-4" />
                )}
                Reagendar (Trocar Data)
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => router.push("/")}
                >
                  Voltar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 h-12 rounded-xl"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CENÁRIO 2: TARDE DEMAIS (> 24h) */}
        {status === "too_late" && (
          <div className="animate-in fade-in zoom-in">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-600 mb-4">
              <Phone className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Cancelamento Bloqueado</h1>
            <p className="text-muted-foreground mb-6">
              Faltam menos de 24 horas para o seu atendimento. Para cancelar ou
              reagendar, por favor entre em contato diretamente com a clínica.
            </p>
            <div className="bg-muted p-4 rounded-xl mb-6">
              <p className="font-bold text-lg text-foreground">
                (11) 96831-1914
              </p>
              <p className="text-sm text-muted-foreground">Falar com Dirlene</p>
            </div>
            <Button
              className="w-full h-12 rounded-xl"
              onClick={() => router.push("/")}
            >
              Voltar ao Início
            </Button>
          </div>
        )}

        {/* CENÁRIO 3: SUCESSO */}
        {status === "success" && (
          <div className="animate-in fade-in zoom-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Feito!</h1>
            <p className="text-muted-foreground mb-6">
              Seu agendamento foi cancelado com sucesso.
            </p>
            <Button
              className="w-full h-12 rounded-xl"
              onClick={() => router.push("/")}
            >
              Realizar Novo Agendamento
            </Button>
          </div>
        )}

        {/* OUTROS ESTADOS (Erro, Já cancelado) */}
        {status === "already_cancelled" && (
          <div className="animate-in fade-in zoom-in">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-500 mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold mb-2">Já Cancelado</h1>
            <p className="text-muted-foreground mb-6">
              Este agendamento já foi cancelado anteriormente.
            </p>
            <Button
              className="w-full h-12 rounded-xl"
              variant="outline"
              onClick={() => router.push("/")}
            >
              Voltar
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="animate-in fade-in zoom-in">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold mb-2">
              Agendamento não encontrado
            </h1>
            <p className="text-muted-foreground mb-6">
              O link pode estar inválido ou expirado.
            </p>
            <Button
              className="w-full h-12 rounded-xl"
              variant="outline"
              onClick={() => router.push("/")}
            >
              Voltar
            </Button>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}
