import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  console.log("💳 CHECKOUT BLINDADO INICIADO 💳");

  try {
    const body = await request.json();
    const { appointmentId, title, price, email } = body;

    // 1. Atualiza status no banco
    const { error: dbError } = await supabase
      .from("appointments")
      .update({ status: "awaiting_payment" })
      .eq("id", appointmentId);

    if (dbError) throw dbError;

    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ error: "Token ausente" }, { status: 500 });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    // 2. Define a URL da Vercel (Onde o robô mora)
    // Se estiver local, ainda usamos a da Vercel para o Webhook funcionar!
    // O Webhook precisa ser público (https), localhost não funciona pro MP avisar.
    const siteUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000" // Para onde o usuário volta (Front)
        : "https://wellness.gmpsaas.com";

    // URL DO ROBÔ (Sempre a de produção)
    const webhookUrl = "https://wellness.gmpsaas.com/api/webhook/payment";

    const preference = new Preference(client);

    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 15);

    // 3. Cria preferência com notification_url
    const result = await preference.create({
      body: {
        items: [
          {
            id: appointmentId,
            title: title || "Agendamento GMP Wellness",
            quantity: 1,
            unit_price: Number(price) || 35.0,
            currency_id: "BRL",
          },
        ],
        payer: {
          email: email,
        },
        external_reference: appointmentId,
        date_of_expiration: expirationDate.toISOString(),
        notification_url: webhookUrl,

        payment_methods: {
          excluded_payment_types: [{ id: "ticket" }],
          installments: 1,
        },

        back_urls: {
          success: `${siteUrl}/payment/success?id=${appointmentId}`,
          failure: `${siteUrl}/payment/failure?id=${appointmentId}`,
          pending: `${siteUrl}/payment/pending?id=${appointmentId}`,
        },
        auto_return: "approved",
      },
    });

    return NextResponse.json({ url: result.init_point });
  } catch (error: any) {
    console.error("❌ ERRO:", error);
    return NextResponse.json(
      { error: "Erro no checkout", details: error.message },
      { status: 500 }
    );
  }
}
