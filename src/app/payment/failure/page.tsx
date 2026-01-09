"use client";

import Link from "next/link";
import { Button } from "../../components/ui/button";
import { XCircle, RefreshCcw } from "lucide-react";

export default function FailurePage() {
  return (
    <div className="min-h-screen bg-[#fffcfa] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-red-100">
        <div className="mb-6 flex justify-center">
          <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento não realizado
        </h1>

        <p className="text-gray-500 mb-8">
          Houve um problema ao processar seu pagamento. Nenhuma cobrança foi
          feita.
        </p>

        <Link href="/" className="block">
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl text-base border-2"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Tentar Agendar Novamente
          </Button>
        </Link>
      </div>
    </div>
  );
}
