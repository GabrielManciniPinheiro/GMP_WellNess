import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { supabase } from "@/lib/supabaseClient";
import { Resend } from "resend";

// Inicializa SDKs
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // 1. Ler parâmetros da URL do Webhook (Vem do Mercado Pago)
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic") || searchParams.get("type");
    const paymentId = searchParams.get("id") || searchParams.get("data.id");

    // Ignora se não for aviso de pagamento
    if (topic !== "payment" || !paymentId) {
      return NextResponse.json({ status: "ignored" });
    }

    // 2. Consultar o pagamento real no Mercado Pago (Segurança)
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    // 3. Se o pagamento foi APROVADO
    if (paymentData.status === "approved") {
      const appointmentId = paymentData.external_reference;

      console.log(
        `💰 Pagamento aprovado para Agendamento ID: ${appointmentId}`
      );

      // a. Atualizar banco para 'scheduled'
      const { data: appointment, error: dbError } = await supabase
        .from("appointments")
        .update({ status: "scheduled" })
        .eq("id", appointmentId)
        .select(`*, services(name), therapists(name)`) // Pega dados para o email
        .single();

      if (dbError || !appointment) {
        console.error("❌ Erro ao atualizar banco:", dbError);
        // Retorna 200 mesmo com erro interno para o MP parar de mandar notificações
        return NextResponse.json({ status: "db_error" }, { status: 200 });
      }

      // b. Preparar link de cancelamento/gerenciamento
      // Em produção, deve ser o domínio real. Em dev, localhost.
      // Como o Webhook roda no servidor, não temos 'window', usamos variável ou hardcoded em dev.
      const baseUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : "https://wellness.gmpsaas.com"; //

      const cancelLink = `${baseUrl}/cancel/${appointment.id}`;

      // c. Enviar E-mail
      await resend.emails.send({
        from: "GMP Wellness <agendamento@gmpsaas.com>",
        to: [appointment.client_email],
        subject: "Pagamento Confirmado! Agendamento Realizado.",
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #556b2F;">Pagamento Recebido! 🎉</h1>
            <p>Olá, <strong>${appointment.client_name}</strong>.</p>
            <p>Sua reserva foi confirmada com sucesso.</p>
            
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            
            <p><strong>Serviço:</strong> ${appointment.services?.name}</p>
            <p><strong>Profissional:</strong> ${
              appointment.therapists?.name
            }</p>
            <p><strong>Data:</strong> ${new Date(
              appointment.date
            ).toLocaleDateString("pt-BR")}</p>
            <p><strong>Horário:</strong> ${appointment.time}</p>
            
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            
            <p style="font-size: 14px; color: #666;">
              Se precisar reagendar, clique abaixo (mínimo 24h de antecedência):
            </p>
            <br/>
            <a href="${cancelLink}" style="background-color: #556b2F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Gerenciar Agendamento
            </a>
          </div>
        `,
      });

      console.log("✅ E-mail enviado com sucesso.");
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("❌ Erro fatal no Webhook:", error);
    return NextResponse.json(
      { status: "error", message: error },
      { status: 500 }
    );
  }
}
