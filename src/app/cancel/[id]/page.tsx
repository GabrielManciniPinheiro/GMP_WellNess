"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { Button } from "../../components/ui/button";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "../../components/ui/sonner";

export default function CancelPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<
    "loading" | "confirm" | "success" | "error" | "already_cancelled"
  >("loading");
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    fetchAppointment();
  }, [id]);

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
        setAppointment(data);
        setStatus("confirm");
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
        {status === "confirm" && (
          <div className="animate-in fade-in zoom-in">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Cancelar Agendamento?</h1>
            <p className="text-muted-foreground mb-6">
              Você tem certeza que deseja cancelar sua sessão de{" "}
              <strong>{appointment?.services?.name}</strong>?
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={() => router.push("/")}
              >
                Não, manter
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-12 rounded-xl"
                onClick={handleCancel}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Sim, cancelar"
                )}
              </Button>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="animate-in fade-in zoom-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Cancelado!</h1>
            <p className="text-muted-foreground mb-6">
              Seu agendamento foi cancelado com sucesso. Esperamos ver você em
              breve.
            </p>
            <Button
              className="w-full h-12 rounded-xl"
              onClick={() => router.push("/")}
            >
              Voltar ao Início
            </Button>
          </div>
        )}

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
