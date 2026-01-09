import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, title, price, email } = body;

    const { error: dbError } = await supabase
      .from("appointments")
      .update({ status: "awaiting_payment" })
      .eq("id", appointmentId);

    if (dbError) throw dbError;

    if (!process.env.MP_ACCESS_TOKEN) {
      console.log("⚠️ Sem Token. Simulando...");
      return NextResponse.json({
        url: "https://www.google.com/search?q=simulacao+pagamento+gmp",
      });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const preference = new Preference(client);

    // Validade de 15 minutos
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 15);

    console.log("🚀 Criando preferência no Mercado Pago...");

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
          success: "https://wellness.gmpsaas.com//search?q=sucesso",
          failure: "https://wellness.gmpsaas.com//search?q=falha",
          pending: "https://wellness.gmpsaas.com//search?q=pendente",
        },
        auto_return: "approved",
      },
    });

    console.log("✅ SUCESSO! Link gerado:", result.init_point);
    return NextResponse.json({ url: result.init_point });
  } catch (error: any) {
    console.error("❌ ERRO NO CHECKOUT:", JSON.stringify(error, null, 2));

    return NextResponse.json(
      { error: "Erro ao criar pagamento", details: error.message },
      { status: 500 }
    );
  }
}
