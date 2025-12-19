import { Calendar, Clock, User, Sparkles, CheckCircle2 } from "lucide-react";

interface BookingSummaryProps {
  service: string;
  therapist: string;
  date: string;
  time: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
}

export function BookingSummary({
  service,
  therapist,
  date,
  time,
  contact,
}: BookingSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h2>Booking Confirmed!</h2>
        <p className="text-muted-foreground mt-2">
          We've sent a confirmation email to {contact.email}
        </p>
      </div>

      <div className="bg-accent rounded-2xl p-6 space-y-4 border-2 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground">Service</p>
            <p className="mt-1">{service}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground">Therapist</p>
            <p className="mt-1">{therapist}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground">Date</p>
            <p className="mt-1">{date}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground">Time</p>
            <p className="mt-1">{time}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 border-2 border-border">
        <h4 className="mb-3">Contact Information</h4>
        <div className="space-y-2 text-muted-foreground">
          <p>{contact.name}</p>
          <p>{contact.email}</p>
          <p>{contact.phone}</p>
        </div>
      </div>
    </div>
  );
}
