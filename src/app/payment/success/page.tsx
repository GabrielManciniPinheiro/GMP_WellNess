"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "../../components/ui/button";
import { CheckCircle2, Calendar, Home } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("id");

  return (
    <div className="min-h-screen bg-[#fffcfa] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-in zoom-in duration-500 border border-green-100">
        <div className="mb-6 flex justify-center">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Confirmado!
        </h1>

        <p className="text-gray-500 mb-8">
          Sua sessão foi agendada com sucesso. Enviamos os detalhes e o link de
          gerenciamento para o seu e-mail.
        </p>

        <div className="space-y-3">
          {appointmentId && (
            <p className="text-xs text-muted-foreground bg-gray-50 p-2 rounded mb-4">
              ID do Agendamento:{" "}
              <span className="font-mono">{appointmentId.slice(0, 8)}...</span>
            </p>
          )}

          <Link href="/" className="block">
            <Button className="w-full h-12 rounded-xl text-base bg-primary hover:bg-primary/90">
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
    <Suspense fallback={<div className="p-10 text-center">Carregando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
