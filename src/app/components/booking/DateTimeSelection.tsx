import { useState, useEffect } from "react";
import { Calendar } from "../ui/calendar";
import { Loader2 } from "lucide-react";
import HorizontalScroll from "../ui/horizontal-scroll";
import { supabase } from "../../../lib/supabaseClient";

interface DateTimeSelectionProps {
  selectedDate: Date | undefined;
  selectedTime: string | null;
  selectedTherapist: string | null;
  onSelectDate: (date: Date | undefined) => void;
  onSelectTime: (time: string) => void;
}

// 🟢 FUNÇÃO AUXILIAR: Gera horários de 30 em 30 min
// Start: 8h, End: 20h
const generateTimeSlots = (isSaturday: boolean) => {
  const slots: string[] = [];
  // Se for sábado vai até 14h, dia de semana vai até 20h
  const endHour = isSaturday ? 14 : 20;

  for (let hour = 8; hour < endHour; hour++) {
    // Adiciona a hora cheia (ex: 08:00)
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    // Adiciona a meia hora (ex: 08:30)
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
  }
  return slots;
};

export function DateTimeSelection({
  selectedDate,
  selectedTime,
  selectedTherapist,
  onSelectDate,
  onSelectTime,
}: DateTimeSelectionProps) {
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const formatDateToLocalISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 🟢 LOGICA DE AGENDA: Atualiza slots quando muda a data
  useEffect(() => {
    if (selectedDate && selectedTherapist) {
      const dayOfWeek = selectedDate.getDay();
      const isSaturday = dayOfWeek === 6;

      // 1. Gera todos os slots do dia (8h as 20h)
      let slots = generateTimeSlots(isSaturday);

      // 2. 🟢 REMOVER ALMOÇO: Filtra horários entre 12:00 e 13:30
      // Removemos 12:00, 12:30 e 13:00. O atendimento volta 13:30.
      slots = slots.filter((time) => {
        return time !== "12:00" && time !== "12:30" && time !== "13:00";
      });

      // 3. 🟢 REMOVER PASSADO: Se for "Hoje", remove horários que já foram
      const today = new Date();
      if (selectedDate.toDateString() === today.toDateString()) {
        const currentHour = today.getHours();
        const currentMinutes = today.getMinutes();

        slots = slots.filter((time) => {
          const [slotHour, slotMinute] = time.split(":").map(Number);
          // Se a hora do slot for maior que a atual, OK.
          // Se for a mesma hora, o minuto do slot tem que ser maior.
          if (slotHour > currentHour) return true;
          if (slotHour === currentHour && slotMinute > currentMinutes)
            return true;
          return false;
        });
      }

      setAvailableSlots(slots);
      fetchAvailability();
    } else {
      setBookedTimes([]);
      setAvailableSlots([]);
    }
  }, [selectedDate, selectedTherapist]);

  const fetchAvailability = async () => {
    if (!selectedDate || !selectedTherapist) return;

    setLoading(true);
    setError(null);

    try {
      const dateString = formatDateToLocalISO(selectedDate);

      const { data, error } = await supabase
        .from("appointments")
        .select("time")
        .eq("therapist_id", selectedTherapist)
        .eq("date", dateString)
        .neq("status", "cancelled");

      if (error) throw error;

      if (data) {
        const busyTimes = data.map((item) => item.time);
        setBookedTimes(busyTimes);
      }
    } catch (err) {
      console.error("Erro ao buscar disponibilidade:", err);
      setError("Não foi possível carregar os horários.");
    } finally {
      setLoading(false);
    }
  };

  const isTimeBooked = (time: string) => {
    return bookedTimes.includes(time);
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30); // 🟢 Mantive 30 dias de janela

    return date < today || date > maxDate || date.getDay() === 0; // Domingo fechado
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-medium">Selecione uma Data</h3>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onSelectDate}
            disabled={isDateDisabled}
            className="rounded-2xl border-2 border-border bg-card p-4 shadow-sm"
          />
        </div>
      </div>

      {selectedDate && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <h3 className="mb-4 text-lg font-medium">
            Horários disponíveis para{" "}
            {selectedDate.toLocaleDateString("pt-BR", { weekday: "long" })}
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Verificando agenda...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          ) : availableSlots.length === 0 ? (
            /* 🟢 UX: Mensagem amigável se o dia já acabou */
            <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed border-border">
              <p className="text-muted-foreground">
                Sem horários disponíveis para hoje.
              </p>
            </div>
          ) : (
            <HorizontalScroll>
              {availableSlots.map((time) => {
                const isBooked = isTimeBooked(time);
                return (
                  <button
                    key={time}
                    onClick={() => !isBooked && onSelectTime(time)}
                    disabled={isBooked}
                    className={`
                      min-w-[100px] whitespace-nowrap py-3 px-6 rounded-xl border-2 transition-all duration-300 snap-center font-medium
                      ${
                        isBooked
                          ? "border-muted bg-muted text-muted-foreground/50 cursor-not-allowed decoration-slice line-through opacity-70"
                          : selectedTime === time
                          ? "border-primary bg-primary text-white shadow-lg scale-105"
                          : "border-border bg-card hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
                      }`}
                  >
                    {time}
                    {isBooked && (
                      <div className="text-[10px] mt-1 font-normal opacity-70">
                        Ocupado
                      </div>
                    )}
                  </button>
                );
              })}
            </HorizontalScroll>
          )}
        </div>
      )}
    </div>
  );
}
