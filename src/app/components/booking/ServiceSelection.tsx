import { useState, useEffect } from "react";
import { Check, Loader2, Gift } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

// Interface alinhada com as colunas do Banco de Dados
interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // No banco é INTEGER (minutos)
  price: number; // No banco é DECIMAL
}

interface ServiceSelectionProps {
  selectedService: string | null;
  onSelectService: (serviceId: string) => void;
  // Removemos 'services' daqui, pois ele busca sozinho agora
}

export function ServiceSelection({
  selectedService,
  onSelectService,
}: ServiceSelectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      // Busca apenas serviços ativos
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("price", { ascending: true }); // Opcional: ordena por preço

      if (error) throw error;

      if (data) {
        setServices(data);
      }
    } catch (err) {
      console.error("Erro ao buscar serviços:", err);
      setError("Não foi possível carregar os serviços.");
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para formatar preço em Reais
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/*  CARD DE PROMOÇÃO DE ANIVERSÁRIO */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
        <div className="bg-primary text-white p-2 rounded-full shrink-0 mt-1">
          <Gift className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-primary mb-1">
            Aniversariante do Mês?
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Você ganha{" "}
            <span className="font-bold text-primary">20% de desconto</span> em
            qualquer serviço!
            <br />
            <span className="text-xs opacity-80">
              Válido para uma sessão. O desconto é aplicado no pagamento
              presencial mediante apresentação de documento.
            </span>
          </p>
        </div>
      </div>

      {services.map((service) => (
        <button
          key={service.id}
          onClick={() => onSelectService(service.id)}
          className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 group ${
            selectedService === service.id
              ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
              : "border-border bg-card hover:border-primary/40 hover:shadow-md"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg">{service.name}</h3>
                {selectedService === service.id && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-in zoom-in">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {service.description}
              </p>

              <div className="flex gap-4 mt-4 text-sm font-medium">
                <span className="text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {service.duration} min
                </span>
                <span className="text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {formatPrice(service.price)}
                </span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
