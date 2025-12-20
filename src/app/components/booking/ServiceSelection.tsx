import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
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
