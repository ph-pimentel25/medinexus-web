import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface LabWebhookPayload {
  exam_id: string;
  status: "agendado" | "em_andamento" | "concluido";
  lab_name?: string;
  result_url?: string;
  result_notes?: string;
  scheduled_for?: string;
  completed_at?: string;
}

export async function POST(request: NextRequest) {
  const labKey = request.headers.get("x-lab-api-key");
  const expectedSecret = process.env.LAB_WEBHOOK_SECRET;

  // Se a chave do laboratório estiver configurada no .env, exige correspondência
  if (expectedSecret && labKey !== expectedSecret) {
    return NextResponse.json({ error: "Chave de laboratório não autorizada." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  let body: LabWebhookPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON inválido." }, { status: 400 });
  }

  const { exam_id, status, lab_name, result_url, result_notes, scheduled_for, completed_at } = body;

  if (!exam_id || !["agendado", "em_andamento", "concluido"].includes(status)) {
    return NextResponse.json(
      { error: "exam_id e status ('agendado', 'em_andamento', 'concluido') são obrigatórios." },
      { status: 400 }
    );
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (lab_name) updateData.lab_name = lab_name;
  if (result_url) updateData.result_url = result_url;
  if (result_notes) updateData.result_notes = result_notes;
  if (scheduled_for) updateData.scheduled_for = scheduled_for;
  if (status === "concluido") {
    updateData.completed_at = completed_at || new Date().toISOString();
  }

  const { data, error } = await admin
    .from("exam_orders")
    .update(updateData)
    .eq("id", exam_id)
    .select("id, status, patient_id, title")
    .maybeSingle();

  if (error) {
    console.error("[Lab Webhook Error]", error);
    return NextResponse.json({ error: "Falha ao atualizar pedido de exame." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Pedido de exame não encontrado." }, { status: 404 });
  }

  // Notifica o paciente quando o exame estiver concluído com resultados
  if (status === "concluido" && data.patient_id) {
    try {
      await admin.from("notifications").insert({
        recipient_id: data.patient_id,
        title: "Resultado de Exame Disponível",
        message: `O resultado do seu exame "${data.title}" já está disponível na sua conta MediNexus.`,
        type: "exam_result",
        read: false,
      });
    } catch {
      // Ignora falha de notificação secundária
    }
  }

  return NextResponse.json({
    success: true,
    message: `Exame atualizado para status '${status}'.`,
    exam: data,
  });
}
