import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface ContactFormProps {
  formData: {
    name: string;
    email: string;
    phone: string;
  };
  onUpdateForm: (field: string, value: string) => void;
}

export function ContactForm({ formData, onUpdateForm }: ContactFormProps) {
  const [emailError, setEmailError] = useState("");

  // Função para validar formato de email
  const validateEmail = (email: string) => {
    // Regex padrão para validação de email (exige texto + @ + texto + . + texto)
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Valida quando o usuário clica fora do campo (onBlur)
  const handleEmailBlur = () => {
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError("Por favor, insira um e-mail válido.");
    } else {
      setEmailError("");
    }
  };

  // Mantivemos a lógica do telefone que criamos antes
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
      {/* NOME */}
      <div className="space-y-2">
        <Label htmlFor="name">Nome Completo</Label>
        <Input
          id="name"
          type="text"
          placeholder="Digite seu nome"
          value={formData.name}
          onChange={(e) => onUpdateForm("name", e.target.value)}
          className="h-12 rounded-xl border-2 bg-input-background focus-visible:ring-primary"
        />
      </div>

      {/* EMAIL COM VALIDAÇÃO */}
      <div className="space-y-2">
        <Label htmlFor="email" className={emailError ? "text-destructive" : ""}>
          E-mail
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={(e) => {
            onUpdateForm("email", e.target.value);
            // Se o usuário começar a corrigir, limpa o erro
            if (emailError) setEmailError("");
          }}
          onBlur={handleEmailBlur} // Dispara a validação ao sair do campo
          className={`h-12 rounded-xl border-2 bg-input-background focus-visible:ring-primary ${
            emailError
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }`}
        />
        {emailError && (
          <p className="text-sm text-destructive font-medium animate-in slide-in-from-top-1">
            {emailError}
          </p>
        )}
      </div>

      {/* TELEFONE */}
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone / WhatsApp</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(11) 99999-9999"
          value={formData.phone}
          onChange={handlePhoneChange}
          maxLength={15}
          className="h-12 rounded-xl border-2 bg-input-background focus-visible:ring-primary"
        />
        <p className="text-xs text-muted-foreground">
          Digite apenas os números, nós formatamos para você.
        </p>
      </div>
    </div>
  );
}
