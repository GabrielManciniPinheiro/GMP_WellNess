import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js"; // Importa direto do pacote
import { Resend } from "resend";

// 1. Configurações
const mpAccessToken = process.env.MP_ACCESS_TOKEN;
const resendApiKey = process.env.RESEND_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // <--- CHAVE MESTRA

// 2. Cliente MP
const client = new MercadoPagoConfig({ accessToken: mpAccessToken! });

// 3. Cliente Supabase ADMIN (Bypassa o RLS)
// Usamos este cliente específico aqui para ter permissão de escrita sem usuário logado
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const resend = new Resend(resendApiKey);

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic") || searchParams.get("type");
    const paymentId = searchParams.get("id") || searchParams.get("data.id");

    if (topic !== "payment" || !paymentId) {
      return NextResponse.json({ status: "ignored" });
    }

    // Consulta status no Mercado Pago
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    // Se aprovado
    if (paymentData.status === "approved") {
      const appointmentId = paymentData.external_reference;

      console.log(
        `Webhook: Pagamento ${paymentId} aprovado para agendamento ${appointmentId}`
      );

      // 4. Atualiza usando o ADMIN (supabaseAdmin)
      const { data: appointment, error: dbError } = await supabaseAdmin
        .from("appointments")
        .update({ status: "scheduled" })
        .eq("id", appointmentId)
        .select(`*, services(name), therapists(name)`)
        .single();

      if (dbError) {
        console.error("❌ Erro Webhook Banco:", dbError);
        return NextResponse.json(
          { error: "Falha ao atualizar banco" },
          { status: 500 }
        );
      }

      // Envia email...
      const baseUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : "https://wellness.gmpsaas.com";

      if (appointment) {
        await resend.emails.send({
          from: "GMP Wellness <agendamento@gmpsaas.com>",
          to: [appointment.client_email],
          subject: "Pagamento Confirmado! Agendamento Realizado.",
          html: `
              <h1>Pagamento Recebido!</h1>
              <p>Olá, ${
                appointment.client_name
              }. Seu agendamento foi confirmado.</p>
              <p>Serviço: ${appointment.services?.name}</p>
              <p>Data: ${new Date(appointment.date).toLocaleDateString(
                "pt-BR"
              )}</p>
              <a href="${baseUrl}/cancel/${appointment.id}">Gerenciar</a>
            `,
        });
        console.log("✅ Email enviado.");
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("❌ Erro Fatal Webhook:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
