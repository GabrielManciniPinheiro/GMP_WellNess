import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, title, price, email } = body;

    // 1. Atualiza status no banco para "Aguardando Pagamento"
    const { error: dbError } = await supabase
      .from("appointments")
      .update({ status: "awaiting_payment" })
      .eq("id", appointmentId);

    if (dbError) throw dbError;

    // 🛠️ MODO DE TESTE (SEM TOKEN)
    if (!process.env.MP_ACCESS_TOKEN) {
      console.log("⚠️ [DEV MODE] Sem Token do MP. Simulando checkout...");
      return NextResponse.json({
        url: "https://wellness.gmpsaas.com",
      });
    }

    // =====================================================
    // 🚀 MODO REAL (COM TOKEN)
    // =====================================================

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://gmpsaas.com";

    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 15);

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: appointmentId,
            title: title || "Taxa de Agendamento",
            quantity: 1,
            unit_price: Number(price) || 35.0,
            currency_id: "BRL",
          },
        ],
        payer: { email: email },
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

    return NextResponse.json({ url: result.init_point });
  } catch (error) {
    console.error("Erro no checkout:", error);
    return NextResponse.json(
      { error: "Erro ao criar pagamento" },
      { status: 500 }
    );
  }
}
