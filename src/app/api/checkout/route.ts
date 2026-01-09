import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  console.log("🧪 INICIANDO CHECKOUT (TESTE -> VERCEL) 🧪");

  try {
    const body = await request.json();
    const { appointmentId, title, price, email } = body;

    // 1. Atualiza banco
    const { error: dbError } = await supabase
      .from("appointments")
      .update({ status: "awaiting_payment" })
      .eq("id", appointmentId);

    if (dbError) throw dbError;

    // 2. Valida Token
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Token não configurado" },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const preference = new Preference(client);

    // 3. Validade de 30 min
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 15);

    // 4. URL Fixa de Produção (conforme solicitado)
    const baseUrl = "https://wellness.gmpsaas.com";

    // 5. Cria a preferência
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
          email: email, // Usa estritamente o que veio do front
        },
        external_reference: appointmentId,
        date_of_expiration: expirationDate.toISOString(),

        back_urls: {
          success: `${baseUrl}/payment/success?id=${appointmentId}`,
          failure: `${baseUrl}/payment/failure?id=${appointmentId}`,
          pending: `${baseUrl}/payment/pending?id=${appointmentId}`,
        },
        auto_return: "approved",
      },
    });

    console.log("✅ Link Gerado:", result.init_point);
    return NextResponse.json({ url: result.init_point });
  } catch (error: any) {
    console.error("❌ ERRO NO CHECKOUT:", error);
    return NextResponse.json(
      { error: "Erro ao criar pagamento", details: error.message },
      { status: 500 }
    );
  }
}
