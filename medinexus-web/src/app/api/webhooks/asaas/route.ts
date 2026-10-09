import { NextRequest, NextResponse } from "next/server";
// import { getAdminSupabase } from "@/app/lib/supabase"; // Mock para o webhook

export async function POST(req: NextRequest) {
  try {
    // 1. O Asaas envia um header de segurança que configuramos no dashboard deles
    const asaasToken = req.headers.get("asaas-access-token");
    if (asaasToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
      // Para fins de dev (sandbox local), deixaremos passar se a env não estiver setada
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = await req.json();

    // 2. Filtramos apenas os eventos de confirmação de pagamento
    if (payload.event === "PAYMENT_RECEIVED" || payload.event === "PAYMENT_CONFIRMED") {
      const paymentId = payload.payment?.id;
      const externalReference = payload.payment?.externalReference; // ID da Consulta

      if (externalReference) {
        // 3. Atualizamos o status da consulta no Supabase 
        console.log(`[Webhook Asaas] Pagamento confirmado para a consulta ${externalReference} (Asaas ID: ${paymentId})`);
        
        // Na integração final real:
        // const supabase = getAdminSupabase();
        // await supabase.from("appointments").update({ status: "confirmed" }).eq("id", externalReference);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
