import { Check } from "lucide-react";

interface Therapist {
  id: string;
  name: string;
  specialty: string;
  image: string;
}

interface TherapistSelectionProps {
  therapists: Therapist[];
  selectedTherapist: string | null;
  onSelectTherapist: (therapistId: string) => void;
}

export function TherapistSelection({
  therapists,
  selectedTherapist,
  onSelectTherapist,
}: TherapistSelectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {therapists.map((therapist) => (
        <button
          key={therapist.id}
          onClick={() => onSelectTherapist(therapist.id)}
          className={`text-left p-6 rounded-2xl border-2 transition-all duration-300 ${
            selectedTherapist === therapist.id
              ? "border-primary bg-accent shadow-lg"
              : "border-border bg-card hover:border-primary/40 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className={`w-16 h-16 rounded-full overflow-hidden border-2 ${
                  selectedTherapist === therapist.id
                    ? "border-primary"
                    : "border-border"
                }`}
              >
                <img
                  src={therapist.image}
                  alt={therapist.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {selectedTherapist === therapist.id && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4>{therapist.name}</h4>
              <p className="text-muted-foreground">{therapist.specialty}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
