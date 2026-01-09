import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  console.log("💳 INICIANDO CHECKOUT 💳");

  try {
    const body = await request.json();
    const { appointmentId, title, price, email } = body;

    // 1. Atualiza o status no banco para "Aguardando Pagamento"
    const { error: dbError } = await supabase
      .from("appointments")
      .update({ status: "awaiting_payment" })
      .eq("id", appointmentId);

    if (dbError) throw dbError;

    // 2. Verifica se o Token existe
    if (!process.env.MP_ACCESS_TOKEN) {
      console.log("⚠️ Sem Token configurado.");
      return NextResponse.json(
        { error: "Sem token de pagamento" },
        { status: 500 }
      );
    }

    // 3. Inicializa o SDK do Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    // 4. DEFINE A URL CORRETA (AUTOMÁTICA) 🧠
    // Se for 'development' (seu PC), usa localhost.
    // Se for 'production' (Vercel), usa a URL oficial que você passou.
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://wellness.gmpsaas.com";

    console.log(`🔗 URL de Retorno configurada para: ${baseUrl}`);

    const preference = new Preference(client);

    // Validade do link: 15 minutos
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 15);

    // 5. Cria a preferência de pagamento
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
          // Se o email vier vazio, usa um genérico para não travar
          email: email || "cliente@gmpsaas.com",
        },
        external_reference: appointmentId,
        date_of_expiration: expirationDate.toISOString(),

        // As URLs agora são dinâmicas baseadas no ambiente
        back_urls: {
          success: `${baseUrl}/payment/success?id=${appointmentId}`,
          failure: `${baseUrl}/payment/failure?id=${appointmentId}`,
          pending: `${baseUrl}/payment/pending?id=${appointmentId}`,
        },
        auto_return: "approved",
      },
    });

    console.log("✅ Link de Pagamento Gerado:", result.init_point);
    return NextResponse.json({ url: result.init_point });
  } catch (error: any) {
    console.error("❌ ERRO NO CHECKOUT:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Erro ao criar pagamento", details: error.message },
      { status: 500 }
    );
  }
}
