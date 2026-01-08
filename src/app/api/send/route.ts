import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      id,
      clientName,
      clientEmail,
      date,
      time,
      birthDate,
      serviceName,
      therapistName,
    } = body;

    // --- CORREÇÃO AQUI ---
    // Define a URL base dependendo de onde o código está rodando
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://wellness.gmpsaas.com";

    const cancelLink = `${baseUrl}/cancel/${id}`;
    // ---------------------

    const { data, error } = await resend.emails.send({
      from: "GMP Wellness <agendamento@gmpsaas.com>", // Perfeito, já validamos o domínio!
      to: [clientEmail],
      subject: "Agendamento Confirmado - GMP Wellness",
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ff8f73;">Olá, ${clientName}!</h1>
          <p>Seu momento de relaxamento está confirmado.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Serviço:</strong> ${serviceName}</p>
          <p><strong>Terapeuta:</strong> ${therapistName}</p>
          <p><strong>Data:</strong> ${date}</p>
          <p><strong>Horário:</strong> ${time}</p>
          <p><strong>Nascimento:</strong> ${birthDate || "Não informado"}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          
          <p style="margin-bottom: 20px;">
            Imprevistos acontecem. Se precisar cancelar, utilize o botão abaixo:
          </p>
          <a href="${cancelLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Cancelar Agendamento
          </a>

          <p style="font-size: 12px; color: #888; margin-top: 40px;">GMP Wellness Team</p>
        </div>
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
