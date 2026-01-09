import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Lock, UserCheck } from "lucide-react";

interface ContactFormProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    birthDate: string;
  };
  onUpdateForm: (field: string, value: string) => void;
  readOnly?: boolean; // 🔒 Agora bloqueia TUDO
}

export function ContactForm({
  formData,
  onUpdateForm,
  readOnly,
}: ContactFormProps) {
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailBlur = () => {
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError("Por favor, insira um e-mail válido.");
    } else {
      setEmailError("");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    value = value.substring(0, 11);
    if (value.length > 0) {
      value = "(" + value;
      if (value.length > 3) {
        value = value.substring(0, 3) + ") " + value.substring(3);
      }
      if (value.length > 10) {
        value = value.substring(0, 10) + "-" + value.substring(10);
      }
    }
    onUpdateForm("phone", value);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 🔒 AVISO DE MODO LEITURA */}
      {readOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-blue-800 text-sm">
          <UserCheck className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            <strong>Confirmando identidade:</strong> Estamos usando seus dados
            do agendamento original. Se precisar alterar seu telefone ou nome,
            entre em contato com a clínica.
          </p>
        </div>
      )}

      {/* NOME */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="name">Nome Completo</Label>
          {readOnly && <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>
        <Input
          id="name"
          type="text"
          placeholder="Digite seu nome"
          value={formData.name}
          disabled={readOnly}
          onChange={(e) => onUpdateForm("name", e.target.value)}
          className={`h-12 rounded-xl border-2 bg-input-background focus-visible:ring-primary 
            ${readOnly ? "opacity-70 bg-muted cursor-not-allowed" : ""}`}
        />
      </div>

      {/* EMAIL */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label
            htmlFor="email"
            className={emailError ? "text-destructive" : ""}
          >
            E-mail
          </Label>
          {readOnly && <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          disabled={readOnly}
          onChange={(e) => {
            onUpdateForm("email", e.target.value);
            if (emailError) setEmailError("");
          }}
          onBlur={handleEmailBlur}
          className={`h-12 rounded-xl border-2 bg-input-background focus-visible:ring-primary ${
            emailError
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          } ${readOnly ? "opacity-70 bg-muted cursor-not-allowed" : ""}`}
        />
        {emailError && (
          <p className="text-sm text-destructive font-medium animate-in slide-in-from-top-1">
            {emailError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TELEFONE */}
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone / WhatsApp</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(11) 99999-9999"
            value={formData.phone}
            disabled={readOnly}
            onChange={handlePhoneChange}
            maxLength={15}
            className={`h-12 rounded-xl border-2 bg-input-background focus-visible:ring-primary 
                ${readOnly ? "opacity-70 bg-muted cursor-not-allowed" : ""}`}
          />
        </div>

        {/* DATA DE NASCIMENTO */}
        <div className="space-y-2">
          <Label htmlFor="birthDate">Data de Nascimento</Label>
          <Input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            disabled={readOnly}
            onChange={(e) => onUpdateForm("birthDate", e.target.value)}
            className={`h-12 rounded-xl border-2 bg-input-background focus-visible:ring-primary w-full 
                ${readOnly ? "opacity-70 bg-muted cursor-not-allowed" : ""}`}
          />
        </div>
      </div>

      {!readOnly && (
        <p className="text-xs text-muted-foreground pt-1">
          Preencha seus dados corretamente para receber a confirmação.
        </p>
      )}
    </div>
  );
}
