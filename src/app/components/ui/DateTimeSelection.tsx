import { useState, useEffect } from "react";
import { Calendar } from "./calendar";
import { Loader2 } from "lucide-react";
import { projectId, publicAnonKey } from "../../../../utils/supabase/info";

interface DateTimeSelectionProps {
  selectedDate: Date | undefined;
  selectedTime: string | null;
  selectedTherapist: string | null;
  onSelectDate: (date: Date | undefined) => void;
  onSelectTime: (time: string) => void;
}

const timeSlots = [
  "9:00",
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

  useEffect(() => {
    if (selectedDate && selectedTherapist) {
      fetchAvailability();
    }
  }, [selectedDate, selectedTherapist]);

  const fetchAvailability = async () => {
    if (!selectedDate || !selectedTherapist) return;

    setLoading(true);
    setError(null);

    try {
      const dateString = selectedDate.toISOString().split("T")[0];
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f348aebd/availability/${selectedTherapist}/${dateString}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch availability");
      }

      const data = await response.json();
      if (data.success) {
        setBookedTimes(data.bookedTimes || []);
      } else {
        setError(data.error || "Failed to fetch availability");
      }
    } catch (err) {
      console.error("Error fetching availability:", err);
      setError("Unable to load availability. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isTimeBooked = (time: string) => {
    return bookedTimes.includes(time);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4">Select Date</h3>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onSelectDate}
            disabled={(date) =>
              date < new Date(new Date().setHours(0, 0, 0, 0))
            }
            className="rounded-2xl border-2 border-border bg-card p-4"
          />
        </div>
      </div>

      {selectedDate && (
        <div>
          <h3 className="mb-4">Select Time</h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Loading availability...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {timeSlots.map((time) => {
                const isBooked = isTimeBooked(time);
                return (
                  <button
                    key={time}
                    onClick={() => !isBooked && onSelectTime(time)}
                    disabled={isBooked}
                    className={`py-3 px-4 rounded-xl border-2 transition-all duration-300 ${
                      isBooked
                        ? "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                        : selectedTime === time
                        ? "border-primary bg-primary text-white shadow-lg"
                        : "border-border bg-card hover:border-primary/40 hover:shadow-md"
                    }`}
                  >
                    {time}
                    {isBooked && <div className="text-xs mt-1">Booked</div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
