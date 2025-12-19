"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { ServiceSelection } from "./components/booking/ServiceSelection";
import { TherapistSelection } from "./components/booking/TherapistSelection";
import { DateTimeSelection } from "./components/booking/DateTimeSelection";
import { ContactForm } from "./components/booking/ContactForm";
import { BookingSummary } from "./components/booking/BookingSummary";
import { Button } from "./components/ui/button";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

const services = [
  {
    id: "swedish",
    name: "Massagem Sueca",
    duration: "60 min",
    price: "R$ 85",
    description:
      "Massagem suave e relaxante com movimentos fluidos para aliviar a tensão e promover o relaxamento.",
  },
  {
    id: "deep-tissue",
    name: "Massagem Profunda (Deep Tissue)",
    duration: "75 min",
    price: "R$ 110",
    description:
      "Pressão firme focada nas camadas mais profundas dos músculos e tecidos conjuntivos.",
  },
  {
    id: "hot-stone",
    name: "Terapia com Pedras Quentes",
    duration: "90 min",
    price: "R$ 135",
    description:
      "Pedras aquecidas posicionadas em pontos-chave para aliviar o estresse e a rigidez muscular.",
  },
  {
    id: "aromatherapy",
    name: "Massagem com Aromaterapia",
    duration: "60 min",
    price: "R$ 95",
    description:
      "Óleos essenciais combinados com massagem suave para uma cura holística e bem-estar.",
  },
];

const therapists = [
  {
    id: "Dirlene",
    name: "Dirlene",
    specialty: "Massoterapeuta",
    image:
      "https://images.unsplash.com/photo-1620148222862-b95cf7405a7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjB0aGVyYXBpc3QlMjB3b21hbnxlbnwxfHx8fDE3NjYxNTA2MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

const steps = [
  { id: 1, name: "Serviço", icon: Sparkles },
  { id: 2, name: "Terapeuta", icon: Sparkles },
  { id: 3, name: "Data/Hora", icon: Sparkles },
  { id: 4, name: "Contato", icon: Sparkles },
  { id: 5, name: "Confirmar", icon: Sparkles },
];

export default function Page() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedTherapist, setSelectedTherapist] = useState<string | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isBooking, setIsBooking] = useState(false);

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
      const dateString = selectedDate.toISOString().split("T")[0];

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f348aebd/appointments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            serviceId: selectedService,
            therapistId: selectedTherapist,
            date: dateString,
            time: selectedTime,
            contact: formData,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Agendamento realizado com sucesso!");
        setCurrentStep(5);
      } else {
        if (response.status === 409) {
          toast.error(
            "Desculpe, este horário acabou de ser reservado. Por favor, escolha outro."
          );
          setCurrentStep(3);
        } else {
          toast.error(data.error || "Falha ao realizar agendamento");
        }
      }
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast.error("Não foi possível agendar. Tente novamente.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedService !== null;
      case 2:
        return selectedTherapist !== null;
      case 3:
        return selectedDate !== undefined && selectedTime !== null;
      case 4:
        return formData.name && formData.email && formData.phone;
      default:
        return true;
    }
  };

  const getServiceName = () =>
    services.find((s) => s.id === selectedService)?.name || "";
  const getTherapistName = () =>
    therapists.find((t) => t.id === selectedTherapist)?.name || "";

  // Alterado para pt-BR
  const getDateString = () =>
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
    setFormData({ name: "", email: "", phone: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Cabeçalho */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="mb-2">GMP Wellness</h1>
          <p className="text-muted-foreground">
            Reserve sua experiência de massagem perfeita
          </p>
        </div>

        {/* Passos do Progresso */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      currentStep >= step.id
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <span className="text-sm">✓</span>
                    ) : (
                      <span className="text-sm">{step.id}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 hidden md:block ${
                      currentStep >= step.id
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-all duration-300 ${
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="bg-card rounded-3xl border-2 border-border p-6 md:p-10 mb-8 shadow-sm">
          {currentStep === 1 && (
            <>
              <h2 className="mb-6">Escolha seu Serviço</h2>
              <ServiceSelection
                services={services}
                selectedService={selectedService}
                onSelectService={setSelectedService}
              />
            </>
          )}

          {currentStep === 2 && (
            <>
              <h2 className="mb-6">Selecione seu Terapeuta</h2>
              <TherapistSelection
                therapists={therapists}
                selectedTherapist={selectedTherapist}
                onSelectTherapist={setSelectedTherapist}
              />
            </>
          )}

          {currentStep === 3 && (
            <>
              <h2 className="mb-6">Escolha Data e Hora</h2>
              <DateTimeSelection
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                selectedTherapist={selectedTherapist}
                onSelectDate={setSelectedDate}
                onSelectTime={setSelectedTime}
              />
            </>
          )}

          {currentStep === 4 && (
            <>
              <h2 className="mb-6">Suas Informações de Contato</h2>
              <ContactForm formData={formData} onUpdateForm={updateFormData} />
            </>
          )}

          {currentStep === 5 && (
            <BookingSummary
              service={getServiceName()}
              therapist={getTherapistName()}
              date={getDateString()}
              time={selectedTime || ""}
              contact={formData}
            />
          )}
        </div>

        {/* Botões de Navegação */}
        <div className="flex gap-4">
          {currentStep > 1 && currentStep < 5 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-12 rounded-xl border-2"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          )}

          {currentStep < 5 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isBooking}
              className="flex-1 h-12 rounded-xl"
            >
              {isBooking ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Reservando...
                </>
              ) : (
                <>
                  Continuar
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNewBooking}
              className="flex-1 h-12 rounded-xl"
            >
              Realizar Novo Agendamento
            </Button>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}
