import { useState, useEffect } from "react";
import { Calendar } from "../ui/calendar";
import { Loader2 } from "lucide-react";
import HorizontalScroll from "../ui/horizontal-scroll";
import { supabase } from "../../../lib/supabaseClient";

interface DateTimeSelectionProps {
  selectedDate: Date | undefined;
  selectedTime: string | null;
  selectedTherapist: string | null;
  serviceDuration: number; // ⏱️ Recebe a duração do serviço escolhido
  onSelectDate: (date: Date | undefined) => void;
  onSelectTime: (time: string) => void;
}

// Gera horários de 30 em 30 min (8h as 20h)
const generateTimeSlots = (isSaturday: boolean) => {
  const slots: string[] = [];
  const endHour = isSaturday ? 14 : 20;

  for (let hour = 8; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
  }
  return slots;
};

// Auxiliar: Soma minutos a um horário (ex: "09:00" + 30 = "09:30")
const addMinutesToTime = (time: string, minutes: number): string => {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  const newH = String(date.getHours()).padStart(2, "0");
  const newM = String(date.getMinutes()).padStart(2, "0");
  return `${newH}:${newM}`;
};

export function DateTimeSelection({
  selectedDate,
  selectedTime,
  selectedTherapist,
  serviceDuration,
  onSelectDate,
  onSelectTime,
}: DateTimeSelectionProps) {
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [allDaySlots, setAllDaySlots] = useState<string[]>([]); // Guarda todos os slots do dia (base)

  const formatDateToLocalISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (selectedDate && selectedTherapist) {
      const dayOfWeek = selectedDate.getDay();
      const isSaturday = dayOfWeek === 6;

      // 1. Gera slots base do dia
      let slots = generateTimeSlots(isSaturday);

      // 2. Remove Almoço Padrão (Mantendo sua regra original: 12:00, 12:30, 13:30)
      slots = slots.filter((time) => {
        return time !== "12:00" && time !== "12:30" && time !== "13:30";
      });

      // ============================================================
      // 🚫 REGRAS DE NEGÓCIO DA DIRLENE (Bloqueios Específicos)
      // ============================================================

      // REGRA TERÇA-FEIRA (Dia 2): Bloqueia 10h até 14h
      if (dayOfWeek === 2) {
        slots = slots.filter((time) => {
          // Mantém se for antes das 10:00 OU a partir das 14:00
          return time < "10:00" || time >= "14:00";
        });
      }

      // REGRA QUARTA-FEIRA (Dia 3): Bloqueia 15h até 17h
      if (dayOfWeek === 3) {
        slots = slots.filter((time) => {
          // Mantém se for antes das 15:00 OU a partir das 17:00
          return time < "15:00" || time >= "17:00";
        });
      }

      // ============================================================

      // Salva os slots "estruturais" do dia para cálculos futuros
      setAllDaySlots(slots);

      // 3. Remove Passado (se for hoje)
      const today = new Date();
      if (selectedDate.toDateString() === today.toDateString()) {
        const currentHour = today.getHours();
        const currentMinutes = today.getMinutes();

        slots = slots.filter((time) => {
          const [slotHour, slotMinute] = time.split(":").map(Number);
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

      // Busca agendamentos E suas durações
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          time,
          services ( duration )
        `
        )
        .eq("therapist_id", selectedTherapist)
        .eq("date", dateString)
        .neq("status", "cancelled");

      if (error) throw error;

      const busySlots: string[] = [];

      //  Preenche os slots ocupados baseado na duração dos agendamentos existentes
      if (data) {
        data.forEach((appt: any) => {
          const startTime = appt.time;
          const duration = appt.services?.duration || 30; // Default 30 min

          // Marca o horário de início como ocupado
          busySlots.push(startTime);

          // Marca os próximos horários como ocupados dependendo da duração
          // Ex: 09:00 (60min) -> Bloqueia 09:00 e 09:30
          let slotsToBlock = duration / 30 - 1; // -1 pq o start já foi
          let currentTime = startTime;

          while (slotsToBlock > 0) {
            currentTime = addMinutesToTime(currentTime, 30);
            busySlots.push(currentTime);
            slotsToBlock--;
          }
        });

        setBookedTimes(busySlots);
      }
    } catch (err) {
      console.error("Erro ao buscar disponibilidade:", err);
      setError("Não foi possível carregar os horários.");
    } finally {
      setLoading(false);
    }
  };

  //  Valida se o NOVO serviço cabe na agenda
  // (Verifica colisões futuras baseado na duração do serviço escolhido)
  const isSlotValidForService = (startTime: string) => {
    // 1. O horário de início já está ocupado?
    if (bookedTimes.includes(startTime)) return false;

    // 2. Quantos slots de 30min esse novo serviço precisa?
    const slotsNeeded = Math.ceil(serviceDuration / 30);

    let currentTime = startTime;

    // Verifica cada slot necessário
    for (let i = 0; i < slotsNeeded; i++) {
      // Se não é o primeiro slot (que já sabemos que existe pois foi passado na função),
      // precisamos ver se ele existe na grade do dia (não caiu no almoço ou pós-expediente)

      // O horário deve existir na grade do dia (allDaySlots)
      // E não pode estar na lista de ocupados (bookedTimes)
      // Nota: Usamos allDaySlots para garantir que não avance para o almoço (que foi removido de allDaySlots)
      const existsInDay = allDaySlots.includes(currentTime);
      const isBooked = bookedTimes.includes(currentTime);

      if (!existsInDay || isBooked) {
        return false; // Colisão detectada!
      }

      // Avança para o próximo bloco de 30min
      currentTime = addMinutesToTime(currentTime, 30);
    }

    return true;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);

    // 🚫 REGRA GERAL: Bloqueia Domingo (0) e Segunda-feira (1)
    return (
      date < today ||
      date > maxDate ||
      date.getDay() === 0 ||
      date.getDay() === 1
    );
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
            <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed border-border">
              <p className="text-muted-foreground">
                Sem horários disponíveis para hoje.
              </p>
            </div>
          ) : (
            <HorizontalScroll>
              {availableSlots.map((time) => {
                const isValid = isSlotValidForService(time);

                return (
                  <button
                    key={time}
                    onClick={() => isValid && onSelectTime(time)}
                    disabled={!isValid}
                    className={`
                      min-w-[100px] whitespace-nowrap py-3 px-6 rounded-xl border-2 transition-all duration-300 snap-center font-medium
                      ${
                        !isValid
                          ? "border-muted bg-muted text-muted-foreground/50 cursor-not-allowed decoration-slice line-through opacity-70"
                          : selectedTime === time
                          ? "border-primary bg-primary text-white shadow-lg scale-105"
                          : "border-border bg-card hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
                      }`}
                  >
                    {time}
                    {!isValid && (
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
