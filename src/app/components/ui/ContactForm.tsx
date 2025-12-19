import { Input } from "./input";
import { Label } from "./label";

interface ContactFormProps {
  formData: {
    name: string;
    email: string;
    phone: string;
  };
  onUpdateForm: (field: string, value: string) => void;
}

export function ContactForm({ formData, onUpdateForm }: ContactFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter your name"
          value={formData.name}
          onChange={(e) => onUpdateForm("name", e.target.value)}
          className="h-12 rounded-xl border-2 bg-input-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={(e) => onUpdateForm("email", e.target.value)}
          className="h-12 rounded-xl border-2 bg-input-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={formData.phone}
          onChange={(e) => onUpdateForm("phone", e.target.value)}
          className="h-12 rounded-xl border-2 bg-input-background"
        />
      </div>
    </div>
  );
}
