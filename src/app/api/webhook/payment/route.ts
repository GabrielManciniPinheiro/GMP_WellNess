import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// 1. Configurações
const mpAccessToken = process.env.MP_ACCESS_TOKEN;
const resendApiKey = process.env.RESEND_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 2. Clientes
const client = new MercadoPagoConfig({ accessToken: mpAccessToken! });
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const resend = new Resend(resendApiKey);

// Função auxiliar para data
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic") || searchParams.get("type");
    const paymentId = searchParams.get("id") || searchParams.get("data.id");

    if (topic !== "payment" || !paymentId) {
      return NextResponse.json({ status: "ignored" });
    }

    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    if (paymentData.status === "approved") {
      const appointmentId = paymentData.external_reference;

      console.log(
        `Webhook: Pagamento ${paymentId} aprovado. Atualizando agendamento ${appointmentId}`
      );

      // 3. Atualiza banco
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

      // 4. Envia E-mail Estilizado
      const baseUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : "https://wellness.gmpsaas.com";

      if (appointment) {
        const cancelLink = `${baseUrl}/cancel/${appointment.id}`;
        const formattedDate = formatDate(appointment.date);

        await resend.emails.send({
          from: "GMP Wellness <agendamento@gmpsaas.com>",
          to: [appointment.client_email],
          subject: "🌿 Agendamento Confirmado - GMP Wellness",
          html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
              </head>
              <body style="margin: 0; padding: 0; background-color: #fffcfa; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                <div style="background-color: #fffcfa; padding: 40px 20px;">
                  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
                    
                    <div style="background-color: #556b2f; padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">GMP WELLNESS</h1>
                      <p style="color: #e2e8f0; margin: 5px 0 0 0; font-size: 14px;">Seu momento de cuidado</p>
                    </div>

                    <div style="padding: 40px 30px;">
                      <h2 style="color: #556b2f; margin-top: 0; text-align: center;">Olá, ${appointment.client_name}!</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; text-align: center;">
                        Pagamento confirmado! Seu agendamento está garantido.
                      </p>

                      <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0;">
                        
                        <div style="margin-bottom: 15px; border-bottom: 1px solid #eef2ff; padding-bottom: 15px;">
                          <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase;">Serviço</p>
                          <p style="margin: 5px 0 0 0; color: #333; font-size: 18px; font-weight: 600;">${appointment.services?.name}</p>
                        </div>

                        <div style="margin-bottom: 15px; border-bottom: 1px solid #eef2ff; padding-bottom: 15px;">
                          <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase;">Profissional</p>
                          <p style="margin: 5px 0 0 0; color: #333; font-size: 16px;">${appointment.therapists?.name}</p>
                        </div>

                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td width="50%">
                              <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase;">Data</p>
                              <p style="margin: 5px 0 0 0; color: #333; font-size: 16px; font-weight: 600;">${formattedDate}</p>
                            </td>
                            <td width="50%">
                               <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase;">Horário</p>
                              <p style="margin: 5px 0 0 0; color: #333; font-size: 16px; font-weight: 600;">${appointment.time}</p>
                            </td>
                          </tr>
                        </table>
                      </div>

                      <div style="text-align: center; margin-top: 40px;">
                        <p style="font-size: 14px; color: #888; margin-bottom: 15px;">Precisa cancelar?</p>
                        <a href="${cancelLink}" style="background-color: #fff; color: #ef4444; border: 2px solid #ef4444; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; font-size: 14px;">
                          Gerenciar Agendamento
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </body>
              </html>
            `,
        });
        console.log("✅ E-mail estilizado enviado.");
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("❌ Erro Webhook:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
