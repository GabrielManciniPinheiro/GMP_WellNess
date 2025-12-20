"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { LogOut, Calendar, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";

interface Appointment {
  id: string;
  date: string;
  time: string;
  client_name: string;
  client_phone: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  services: { name: string } | null;
  therapists: { name: string } | null;
}

// --- CORREÇÃO DE FUSO: Formata String manualmente ---
const formatDateString = (dateString: string) => {
  if (!dateString) return "-";
  // O banco manda "2025-12-25", nós quebramos e montamos "25/12/2025"
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

export default function AdminPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        fetchAppointments();
      }
    };
    checkUser();
  }, [router]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          services (name),
          therapists (name)
        `
        )
        .order("date", { ascending: true }) // Mais perto primeiro
        .order("time", { ascending: true });

      if (error) throw error;

      if (data) {
        setAppointments(data as any);
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Erro ao carregar agenda.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(
        `Status atualizado para: ${
          newStatus === "completed" ? "Concluído" : "Cancelado"
        }`
      );
      fetchAppointments();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pendente
          </Badge>
        );
      case "confirmed":
        return (
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20"
          >
            Confirmado
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Concluído
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffcfa]">
      <header className="bg-white border-b border-primary/10 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Painel Administrativo
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden md:block">
            {user?.email}
          </span>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-lg shadow-primary/5 border border-primary/20 overflow-hidden">
          <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-primary/5">
            <h2 className="text-lg font-semibold text-primary">
              Agendamentos Recentes
            </h2>
            <Button
              size="sm"
              className="bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white transition-colors"
              onClick={fetchAppointments}
            >
              Atualizar Lista
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/10 hover:bg-primary/10 border-b border-primary/20">
                  <TableHead className="text-primary font-bold">
                    Data / Hora
                  </TableHead>
                  <TableHead className="text-primary font-bold">
                    Cliente
                  </TableHead>
                  <TableHead className="text-primary font-bold">
                    Serviço / Terapeuta
                  </TableHead>
                  <TableHead className="text-primary font-bold">
                    Status
                  </TableHead>
                  <TableHead className="text-right text-primary font-bold">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-muted-foreground"
                    >
                      Nenhum agendamento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map((apt) => (
                    <TableRow
                      key={apt.id}
                      className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          {/* Usa a função de formatação manual aqui */}
                          <span className="text-foreground">
                            {formatDateString(apt.date)}
                          </span>
                          <span className="text-xs text-primary">
                            {apt.time}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {apt.client_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {apt.client_phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-foreground">
                            {apt.services?.name || "Serviço removido"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            com {apt.therapists?.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(apt.status)}</TableCell>
                      <TableCell className="text-right">
                        {apt.status === "pending" ||
                        apt.status === "confirmed" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100 transition-all rounded-lg"
                              onClick={() => updateStatus(apt.id, "completed")}
                              title="Marcar como Concluído"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 transition-all rounded-lg"
                              onClick={() => updateStatus(apt.id, "cancelled")}
                              title="Cancelar Agendamento"
                            >
                              <XCircle className="w-5 h-5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Arquivado
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
