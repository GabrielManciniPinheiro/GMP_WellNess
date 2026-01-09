"use client";

import { useState, useEffect, Suspense } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  Lock,
  RefreshCw,
} from "lucide-react";
import { ServiceSelection } from "./components/booking/ServiceSelection";
import { TherapistSelection } from "./components/booking/TherapistSelection";
import { DateTimeSelection } from "./components/booking/DateTimeSelection";
import { ContactForm } from "./components/booking/ContactForm";
import { BookingSummary } from "./components/booking/BookingSummary";
import { Button } from "./components/ui/button";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const steps = [
  { id: 1, name: "Serviço", icon: Sparkles },
  { id: 2, name: "Terapeuta", icon: Sparkles },
  { id: 3, name: "Data/Hora", icon: Sparkles },
  { id: 4, name: "Contato", icon: Sparkles },
  { id: 5, name: "Confirmar", icon: Sparkles },
];

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 🔄 REAGENDAMENTO: Pega o ID antigo da URL
  const rescheduleId = searchParams.get("rescheduleId");

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedTherapist, setSelectedTherapist] = useState<string | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [summaryData, setSummaryData] = useState({
    serviceName: "",
    therapistName: "",
    price: 0,
    duration: 30,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
  });

  const [isBooking, setIsBooking] = useState(false);

  // Se estiver reagendando, mostra um Toast avisando
  useEffect(() => {
    if (rescheduleId) {
      toast.info(
        "Modo Reagendamento: Seu horário anterior continua ativo até você confirmar o novo.",
        {
          duration: 5000,
          icon: <RefreshCw className="w-4 h-4" />,
        }
      );
    }
  }, [rescheduleId]);

  // 🔄 EFEITO NOVO: Se for reagendamento, busca dados originais e preenche
  useEffect(() => {
    const fetchOriginalAppointment = async () => {
      if (!rescheduleId) return;

      const { data, error } = await supabase
        .from("appointments")
        .select("client_name, client_email, client_phone, client_birth_date")
        .eq("id", rescheduleId)
        .single();

      if (data && !error) {
        setFormData({
          name: data.client_name,
          email: data.client_email,
          phone: data.client_phone,
          birthDate: data.client_birth_date || "",
        });
        toast.success("Dados carregados. Confirme o novo horário.");
      }
    };

    fetchOriginalAppointment();
  }, [rescheduleId]);

  useEffect(() => {
    const fetchNames = async () => {
      if (selectedService) {
        const { data } = await supabase
          .from("services")
          .select("name, price, duration")
          .eq("id", selectedService)
          .single();
        if (data) {
          setSummaryData((prev) => ({
            ...prev,
            serviceName: data.name,
            price: data.price,
            duration: data.duration,
          }));
        }
      }
      if (selectedTherapist) {
        const { data } = await supabase
          .from("therapists")
          .select("name")
          .eq("id", selectedTherapist)
          .single();
        if (data) {
          setSummaryData((prev) => ({ ...prev, therapistName: data.name }));
        }
      }
    };
    fetchNames();
  }, [selectedService, selectedTherapist]);

  const handleNext = async () => {
    if (currentStep === 4 && canProceed()) {
      await createAppointment();
    } else if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const createAppointment = async () => {
    if (
      !selectedService ||
      !selectedTherapist ||
      !selectedDate ||
      !selectedTime
    ) {
      toast.error("Informações de agendamento incompletas");
      return;
    }

    setIsBooking(true);

    try {
      // 🛡️ SEGURANÇA: Validação do Reagendamento antes de criar
      if (rescheduleId) {
        const { data: oldAppt, error: oldError } = await supabase
          .from("appointments")
          .select("client_email, status")
          .eq("id", rescheduleId)
          .single();

        if (oldError || !oldAppt) {
          toast.error("Agendamento original inválido.");
          setIsBooking(false);
          return;
        }

        // Garante que o email é o mesmo
        if (oldAppt.client_email !== formData.email) {
          toast.error("Erro de segurança: E-mail não corresponde ao original.");
          setIsBooking(false);
          return;
        }

        // 🛡️ TRAVA 2 (AQUI ESTÁ A CORREÇÃO):
        // Só pode reagendar se o original estiver PAGO/CONFIRMADO
        if (oldAppt.status !== "scheduled" && oldAppt.status !== "confirmed") {
          toast.error(
            "Este agendamento não é válido para reagendamento (Não pago ou cancelado)."
          );
          setIsBooking(false);
          return;
        }
      }

      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      // Se for reagendamento, já nasce confirmado ("scheduled").
      // Se for novo, nasce aguardando pagamento ("awaiting_payment").
      const initialStatus = rescheduleId ? "scheduled" : "awaiting_payment";

      // 1. CRIA O NOVO AGENDAMENTO
      const { data: newAppointment, error } = await supabase
        .from("appointments")
        .insert({
          service_id: selectedService,
          therapist_id: selectedTherapist,
          date: dateString,
          time: selectedTime,
          client_name: formData.name,
          client_email: formData.email,
          client_phone: formData.phone,
          client_birth_date: formData.birthDate || null,
          status: initialStatus,
        })
        .select()
        .single();

      if (error) throw error;

      // ============================================================
      // 🛤️ CAMINHO A: É REAGENDAMENTO (PASSE LIVRE)
      // ============================================================
      if (rescheduleId) {
        // Cancela o antigo
        await supabase
          .from("appointments")
          .update({ status: "cancelled" })
          .eq("id", rescheduleId);

        // Envia e-mail de confirmação do novo
        await sendConfirmationEmail(newAppointment.id);

        toast.success(
          "Reagendamento realizado! O horário anterior foi liberado."
        );
        router.replace("/");
        setCurrentStep(5);
        return; // PARA AQUI, NÃO COBRA
      }

      // ============================================================
      // 🛤️ CAMINHO B: É NOVO (COBRAR PAGAMENTO)
      // ============================================================
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: newAppointment.id,
          title: `Reserva: ${summaryData.serviceName}`,
          price: 35.0, // Taxa fixa
          email: formData.email,
        }),
      });

      const checkoutData = await response.json();

      if (checkoutData.url) {
        // REDIRECIONA PARA O MERCADO PAGO
        window.location.href = checkoutData.url;
      } else {
        toast.error("Erro ao gerar link de pagamento.");
      }
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast.error("Não foi possível agendar. Tente novamente.");
    } finally {
      setIsBooking(false);
    }
  };

  // Função auxiliar de envio de e-mail
  const sendConfirmationEmail = async (apptId: string) => {
    try {
      await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: apptId,
          clientName: formData.name,
          clientEmail: formData.email,
          date: getDisplayDate(),
          time: selectedTime,
          birthDate: formData.birthDate,
          serviceName: summaryData.serviceName,
          therapistName: summaryData.therapistName,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    switch (currentStep) {
      case 1:
        return selectedService !== null;
      case 2:
        return selectedTherapist !== null;
      case 3:
        return selectedDate !== undefined && selectedTime !== null;
      case 4:
        return (
          formData.name.trim().length > 2 &&
          emailRegex.test(formData.email) &&
          formData.phone.length >= 14
        );
      default:
        return true;
    }
  };

  const getDisplayDate = () =>
    selectedDate
      ? selectedDate.toLocaleDateString("pt-BR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

  const handleNewBooking = () => {
    setCurrentStep(1);
    setSelectedService(null);
    setSelectedTherapist(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setFormData({ name: "", email: "", phone: "", birthDate: "" });
    setSummaryData({
      serviceName: "",
      therapistName: "",
      price: 0,
      duration: 30,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-12">
        {rescheduleId ? (
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-in fade-in zoom-in duration-500">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin-slow" />{" "}
            {/* Ícone Diferente para Reagendar */}
          </div>
        ) : (
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 animate-in fade-in zoom-in duration-500">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
        )}

        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          {rescheduleId ? "Reagendar Sessão" : "GMP Wellness"}
        </h1>
        <p className="text-muted-foreground">
          {rescheduleId
            ? "Escolha o novo horário para sua sessão"
            : "Reserve sua experiência de massagem perfeita"}
        </p>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1 relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
                    currentStep >= step.id
                      ? "bg-primary text-white shadow-lg scale-110"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? (
                    <span className="text-sm font-bold">✓</span>
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <span
                  className={`text-xs mt-2 hidden md:block font-medium transition-colors duration-300 ${
                    currentStep >= step.id
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 relative h-0.5">
                  <div className="absolute inset-0 bg-muted"></div>
                  <div
                    className="absolute inset-0 bg-primary transition-all duration-500 ease-out"
                    style={{ width: currentStep > step.id ? "100%" : "0%" }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border/50 p-6 md:p-10 mb-8 shadow-xl shadow-primary/5 transition-all duration-500">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {currentStep === 1 && (
            <>
              <h2 className="mb-6 text-2xl font-semibold">
                Escolha seu Serviço
              </h2>
              <ServiceSelection
                selectedService={selectedService}
                onSelectService={setSelectedService}
              />
            </>
          )}
          {currentStep === 2 && (
            <>
              <h2 className="mb-6 text-2xl font-semibold">
                Selecione seu Terapeuta
              </h2>
              <TherapistSelection
                selectedTherapist={selectedTherapist}
                onSelectTherapist={setSelectedTherapist}
              />
            </>
          )}
          {currentStep === 3 && (
            <>
              <h2 className="mb-6 text-2xl font-semibold">
                Escolha Data e Hora
              </h2>
              <DateTimeSelection
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                selectedTherapist={selectedTherapist}
                serviceDuration={summaryData.duration}
                onSelectDate={setSelectedDate}
                onSelectTime={setSelectedTime}
              />
            </>
          )}
          {currentStep === 4 && (
            <>
              <h2 className="mb-6 text-2xl font-semibold">
                {rescheduleId
                  ? "Confirme seus Dados"
                  : "Suas Informações de Contato"}
              </h2>
              {/* 🔒 AQUI: Passamos readOnly se tiver ID de reagendamento */}
              <ContactForm
                formData={formData}
                onUpdateForm={updateFormData}
                readOnly={!!rescheduleId}
              />
            </>
          )}
          {currentStep === 5 && (
            <BookingSummary
              service={summaryData.serviceName}
              therapist={summaryData.therapistName}
              date={getDisplayDate()}
              time={selectedTime || ""}
              contact={formData}
            />
          )}
        </div>
      </div>

      <div className="flex gap-4 max-w-lg mx-auto">
        {currentStep > 1 && currentStep < 5 && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 h-12 rounded-xl border-2 hover:bg-muted/50"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Voltar
          </Button>
        )}
        {currentStep < 5 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isBooking}
            className="flex-1 h-12 rounded-xl text-base shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            {isBooking ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Confirmando...
              </>
            ) : (
              <>
                {rescheduleId && currentStep === 4
                  ? "Confirmar Reagendamento"
                  : "Continuar"}{" "}
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNewBooking}
            className="flex-1 h-12 rounded-xl text-base shadow-lg animate-in zoom-in"
          >
            Realizar Novo Agendamento
          </Button>
        )}
      </div>
    </div>
  );
}

// 🛡️ Wrapper Principal para Suspense
export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <div className="absolute top-4 right-4 z-50">
        <Link
          href="/admin"
          className="p-2 text-muted-foreground/20 hover:text-primary transition-colors duration-300 flex items-center gap-2 text-xs font-medium"
          title="Área Administrativa"
        >
          <Lock className="w-4 h-4" />
          <span className="opacity-0 hover:opacity-100 transition-opacity">
            Admin
          </span>
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }
      >
        <BookingContent />
      </Suspense>
      <Toaster />
    </div>
  );
}
