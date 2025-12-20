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

// Horários de semana (Seg-Sex)
const weekDaySlots = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

// Horários de Sábado (até 14h)
const saturdaySlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];

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
  const [availableSlots, setAvailableSlots] = useState<string[]>(weekDaySlots);

  // --- CORREÇÃO DE FUSO: Função manual para formatar YYYY-MM-DD ---
  const formatDateToLocalISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (selectedDate && selectedTherapist) {
      const dayOfWeek = selectedDate.getDay();
      if (dayOfWeek === 6) {
        setAvailableSlots(saturdaySlots);
      } else {
        setAvailableSlots(weekDaySlots);
      }
      fetchAvailability();
    } else {
      setBookedTimes([]);
    }
  }, [selectedDate, selectedTherapist]);

  const fetchAvailability = async () => {
    if (!selectedDate || !selectedTherapist) return;

    setLoading(true);
    setError(null);

    try {
      // Usa a formatação manual para garantir consistência com o banco
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
    maxDate.setDate(today.getDate() + 30);

    return date < today || date > maxDate || date.getDay() === 0;
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
