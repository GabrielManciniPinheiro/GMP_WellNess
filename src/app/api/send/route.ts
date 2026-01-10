import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Função auxiliar para formatar a data
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      id,
      clientName,
      clientEmail,
      date, // Espera-se formato YYYY-MM-DD ou DD/MM/YYYY
      time,
      serviceName,
      therapistName,
    } = body;

    // Define URL base
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://wellness.gmpsaas.com";

    const cancelLink = `${baseUrl}/cancel/${id}`;

    // Tenta formatar a data se ela vier como YYYY-MM-DD
    let displayDate = date;
    if (date && date.includes("-")) {
      displayDate = formatDate(date);
    }

    const { data, error } = await resend.emails.send({
      from: "GMP Wellness <agendamento@gmpsaas.com>",
      to: [clientEmail],
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
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">Anaya Terapia Corporal</h1>
                <p style="color: #e2e8f0; margin: 5px 0 0 0; font-size: 14px;">Seu momento de cuidado</p>
              </div>

              <div style="padding: 40px 30px;">
                <h2 style="color: #556b2f; margin-top: 0; text-align: center;">Olá, ${clientName}!</h2>
                <p style="color: #666666; font-size: 16px; line-height: 1.6; text-align: center;">
                  Seu agendamento está confirmado! Abaixo estão os detalhes da sua sessão.
                </p>

                <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0;">
                  
                  <div style="margin-bottom: 15px; border-bottom: 1px solid #eef2ff; padding-bottom: 15px;">
                    <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase;">Serviço</p>
                    <p style="margin: 5px 0 0 0; color: #333; font-size: 18px; font-weight: 600;">${serviceName}</p>
                  </div>

                  <div style="margin-bottom: 15px; border-bottom: 1px solid #eef2ff; padding-bottom: 15px;">
                    <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase;">Profissional</p>
                    <p style="margin: 5px 0 0 0; color: #333; font-size: 16px;">${therapistName}</p>
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="50%">
                        <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase;">Data</p>
                        <p style="margin: 5px 0 0 0; color: #333; font-size: 16px; font-weight: 600;">${displayDate}</p>
                      </td>
                      <td width="50%">
                         <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase;">Horário</p>
                        <p style="margin: 5px 0 0 0; color: #333; font-size: 16px; font-weight: 600;">${time}</p>
                      </td>
                    </tr>
                  </table>
                </div>

                <div style="text-align: center; margin-top: 40px;">
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

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao enviar email" },
      { status: 500 }
    );
  }
}
