import { Check } from "lucide-react";

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  description: string;
}

interface ServiceSelectionProps {
  services: Service[];
  selectedService: string | null;
  onSelectService: (serviceId: string) => void;
}

export function ServiceSelection({
  services,
  selectedService,
  onSelectService,
}: ServiceSelectionProps) {
  return (
    <div className="space-y-4">
      {services.map((service) => (
        <button
          key={service.id}
          onClick={() => onSelectService(service.id)}
          className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 ${
            selectedService === service.id
              ? "border-primary bg-accent shadow-lg scale-[1.02]"
              : "border-border bg-card hover:border-primary/40 hover:shadow-md"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3>{service.name}</h3>
                {selectedService === service.id && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <p className="text-muted-foreground mt-2">
                {service.description}
              </p>
              <div className="flex gap-4 mt-3">
                <span className="text-primary">{service.duration}</span>
                <span className="text-primary">{service.price}</span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
