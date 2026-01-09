"use client";

import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Clock } from "lucide-react";

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-[#fffcfa] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-yellow-100">
        <div className="mb-6 flex justify-center">
          <div className="h-20 w-20 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento em Processamento
        </h1>

        <p className="text-gray-500 mb-8">
          Estamos aguardando a confirmação do seu pagamento. Assim que aprovar,
          você receberá um e-mail.
        </p>

        <Link href="/" className="block">
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl text-base"
          >
            Voltar para o Início
          </Button>
        </Link>
      </div>
    </div>
  );
}
