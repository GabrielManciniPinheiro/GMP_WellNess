import { useState, useEffect } from "react";
import { Check, Loader2, User } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

// Interface alinhada com as colunas do seu Banco de Dados
interface Therapist {
  id: string;
  name: string;
  bio: string | null; // No banco é 'bio', antigo 'specialty'
  photo_url: string | null; // No banco é 'photo_url', antigo 'image'
}

interface TherapistSelectionProps {
  selectedTherapist: string | null;
  onSelectTherapist: (therapistId: string) => void;
  // Removemos 'therapists' daqui, pois agora o componente busca sozinho
}

export function TherapistSelection({
  selectedTherapist,
  onSelectTherapist,
}: TherapistSelectionProps) {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      setLoading(true);
      // Busca apenas terapeutas ativos
      const { data, error } = await supabase
        .from("therapists")
        .select("*")
        .eq("active", true);

      if (error) throw error;

      if (data) {
        setTherapists(data);
        // Se só tiver um terapeuta (Dirlene), já seleciona automaticamente pra facilitar
        if (data.length === 1 && !selectedTherapist) {
          onSelectTherapist(data[0].id);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar terapeutas:", err);
      setError("Não foi possível carregar os terapeutas.");
    } finally {
      setLoading(false);
    }
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {therapists.map((therapist) => (
        <button
          key={therapist.id}
          onClick={() => onSelectTherapist(therapist.id)}
          className={`text-left p-4 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden ${
            selectedTherapist === therapist.id
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-border bg-card hover:border-primary/40 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-4 z-10 relative">
            <div className="relative">
              <div
                className={`w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center bg-muted ${
                  selectedTherapist === therapist.id
                    ? "border-primary"
                    : "border-border"
                }`}
              >
                {therapist.photo_url ? (
                  <img
                    src={therapist.photo_url}
                    alt={therapist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // Fallback caso não tenha foto (ex: Dirlene agora)
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>

              {selectedTherapist === therapist.id && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-in zoom-in">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-lg truncate">
                {therapist.name}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {therapist.bio || "Especialista"}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
