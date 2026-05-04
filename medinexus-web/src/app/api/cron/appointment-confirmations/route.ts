import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ReminderAppointment = {
  id: string;
  patient_id: string;
  confirmed_start_at: string;
  confirmed_end_at: string | null;
  patient_confirmation_deadline_at: string;
  clinics?: { trade_name: string | null } | { trade_name: string | null }[] | null;
  doctors?: { name: string | null } | { name: string | null }[] | null;
  specialties?: { name: string | null } | { name: string | null }[] | null;
};

type ExpiredAppointment = {
  id: string;
  patient_id: string;
  confirmed_start_at: string | null;
  clinics?: { trade_name: string | null } | { trade_name: string | null }[] | null;
  doctors?: { name: string | null } | { name: string | null }[] | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type ActionTokenRow = {
  action: "confirm" | "cancel";
  token: string;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDateTime(value: string | null) {
  if (!value) return "Ainda não definido";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendResendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY ou RESEND_FROM_EMAIL não configurado.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend error: ${response.status} - ${body}`);
  }
}

function buildReminderEmailHtml(params: {
  patientName: string;
  clinicName: string;
  doctorName: string;
  specialtyName: string;
  confirmedStartAt: string;
  deadlineAt: string;
  confirmUrl: string;
  cancelUrl: string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#303B41;">
      <h1 style="margin:0 0 16px;font-size:28px;color:#1B4B58;">Confirmação de consulta â€” MediNexus</h1>
      <p>Olá, <strong>${escapeHtml(params.patientName)}</strong>.</p>
      <p>Você tem uma consulta confirmada e precisa confirmar sua presença com antecedência.</p>

      <div style="border:1px solid #E2E8F0;border-radius:16px;padding:16px;margin:20px 0;background:#F8F4F2;">
        <p><strong>Clínica:</strong> ${escapeHtml(params.clinicName)}</p>
        <p><strong>Médico:</strong> ${escapeHtml(params.doctorName)}</p>
        <p><strong>Especialidade:</strong> ${escapeHtml(params.specialtyName)}</p>
        <p><strong>Consulta:</strong> ${escapeHtml(formatDateTime(params.confirmedStartAt))}</p>
        <p><strong>Prazo para resposta:</strong> ${escapeHtml(formatDateTime(params.deadlineAt))}</p>
      </div>

      <p>Escolha uma das opções abaixo:</p>

      <div style="margin:24px 0;">
        <a href="${params.confirmUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#1B4B58;color:#ffffff;text-decoration:none;font-weight:700;margin-right:12px;">
          Confirmar presença
        </a>
        <a href="${params.cancelUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#B91C1C;color:#ffffff;text-decoration:none;font-weight:700;">
          Cancelar consulta
        </a>
      </div>

      <p style="font-size:14px;color:#64748B;">
        Se você não confirmar dentro do prazo, o horário será liberado para outro paciente.
      </p>
    </div>
  `;
}

function buildReminderEmailText(params: {
  patientName: string;
  clinicName: string;
  doctorName: string;
  specialtyName: string;
  confirmedStartAt: string;
  deadlineAt: string;
  confirmUrl: string;
  cancelUrl: string;
}) {
  return [
    `Olá, ${params.patientName}.`,
    ``,
    `Você precisa confirmar sua consulta.`,
    `Clínica: ${params.clinicName}`,
    `Médico: ${params.doctorName}`,
    `Especialidade: ${params.specialtyName}`,
    `Consulta: ${formatDateTime(params.confirmedStartAt)}`,
    `Prazo para resposta: ${formatDateTime(params.deadlineAt)}`,
    ``,
    `Confirmar presença: ${params.confirmUrl}`,
    `Cancelar consulta: ${params.cancelUrl}`,
  ].join("\n");
}

function buildExpiredEmailHtml(params: {
  patientName: string;
  clinicName: string;
  doctorName: string;
  confirmedStartAt: string | null;
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#303B41;">
      <h1 style="margin:0 0 16px;font-size:28px;color:#1B4B58;">Consulta liberada â€” MediNexus</h1>
      <p>Olá, <strong>${escapeHtml(params.patientName)}</strong>.</p>
      <p>Como sua presença não foi confirmada no prazo, a consulta abaixo foi liberada para outro paciente.</p>

      <div style="border:1px solid #E2E8F0;border-radius:16px;padding:16px;margin:20px 0;background:#F8F4F2;">
        <p><strong>Clínica:</strong> ${escapeHtml(params.clinicName)}</p>
        <p><strong>Médico:</strong> ${escapeHtml(params.doctorName)}</p>
        <p><strong>Consulta:</strong> ${escapeHtml(formatDateTime(params.confirmedStartAt))}</p>
      </div>

      <p style="font-size:14px;color:#64748B;">
        Você pode voltar Ã  MediNexus e fazer uma nova solicitação de consulta.
      </p>
    </div>
  `;
}

function buildExpiredEmailText(params: {
  patientName: string;
  clinicName: string;
  doctorName: string;
  confirmedStartAt: string | null;
}) {
  return [
    `Olá, ${params.patientName}.`,
    ``,
    `Como sua presença não foi confirmada no prazo, a consulta abaixo foi liberada para outro paciente.`,
    `Clínica: ${params.clinicName}`,
    `Médico: ${params.doctorName}`,
    `Consulta: ${formatDateTime(params.confirmedStartAt)}`,
  ].join("\n");
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.NEXT_PUBLIC_APP_URL
  ) {
    return NextResponse.json(
      { error: "Missing required environment variables" },
      { status: 500 }
    );
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const now = new Date();
  const nowIso = now.toISOString();

  const windowStart = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  let remindersSent = 0;
  let expiredCount = 0;
  const errors: string[] = [];

  // 1) Expira consultas não confirmadas no prazo
  const { data: expiredAppointments, error: expireError } = await admin
    .from("appointments")
    .update({
      status: "cancelled",
      patient_confirmation_status: "expired",
    })
    .eq("status", "confirmed")
    .eq("short_notice", false)
    .eq("patient_confirmation_status", "waiting")
    .is("patient_confirmed_at", null)
    .lt("patient_confirmation_deadline_at", nowIso)
    .select(`
      id,
      patient_id,
      confirmed_start_at,
      clinics (
        trade_name
      ),
      doctors (
        name
      )
    `);

  if (expireError) {
    errors.push(`expireError: ${expireError.message}`);
  } else if (expiredAppointments && expiredAppointments.length > 0) {
    expiredCount = expiredAppointments.length;

    const patientIds = expiredAppointments.map((item: any) => item.patient_id);

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", patientIds);

    const profileMap = Object.fromEntries(
      ((profiles || []) as ProfileRow[]).map((profile) => [profile.id, profile])
    );

    for (const raw of expiredAppointments as any[]) {
      const appointment = raw as ExpiredAppointment;
      const profile = profileMap[appointment.patient_id];
      const clinic = pickOne(appointment.clinics);
      const doctor = pickOne(appointment.doctors);

      await admin.from("appointment_notification_logs").insert({
        appointment_id: appointment.id,
        channel: "email",
        kind: "expired",
        status: profile?.email ? "sent" : "skipped",
        detail: profile?.email
          ? "Expiração processada."
          : "Paciente sem e-mail para aviso de expiração.",
      });

      if (!profile?.email) continue;

      try {
        await sendResendEmail({
          to: profile.email,
          subject: "Consulta liberada por falta de confirmação",
          html: buildExpiredEmailHtml({
            patientName: profile.full_name || "Paciente",
            clinicName: clinic?.trade_name || "Clínica",
            doctorName: doctor?.name || "Médico",
            confirmedStartAt: appointment.confirmed_start_at,
          }),
          text: buildExpiredEmailText({
            patientName: profile.full_name || "Paciente",
            clinicName: clinic?.trade_name || "Clínica",
            doctorName: doctor?.name || "Médico",
            confirmedStartAt: appointment.confirmed_start_at,
          }),
        });
      } catch (error: any) {
        errors.push(`expiredEmail:${appointment.id}:${error.message}`);
      }
    }
  }

  // 2) Envia lembretes na janela de 24h
  const { data: reminderAppointments, error: reminderError } = await admin
    .from("appointments")
    .select(`
      id,
      patient_id,
      confirmed_start_at,
      confirmed_end_at,
      patient_confirmation_deadline_at,
      clinics (
        trade_name
      ),
      doctors (
        name
      ),
      specialties (
        name
      )
    `)
    .eq("status", "confirmed")
    .eq("short_notice", false)
    .eq("patient_confirmation_status", "waiting")
    .is("patient_confirmed_at", null)
    .is("confirmation_reminder_sent_at", null)
    .gte("patient_confirmation_deadline_at", windowStart)
    .lte("patient_confirmation_deadline_at", windowEnd);

  if (reminderError) {
    errors.push(`reminderQueryError: ${reminderError.message}`);
  } else {
    const reminders = (reminderAppointments || []) as ReminderAppointment[];
    const patientIds = reminders.map((item) => item.patient_id);

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", patientIds);

    const profileMap = Object.fromEntries(
      ((profiles || []) as ProfileRow[]).map((profile) => [profile.id, profile])
    );

    for (const appointment of reminders) {
      const profile = profileMap[appointment.patient_id];
      const clinic = pickOne(appointment.clinics);
      const doctor = pickOne(appointment.doctors);
      const specialty = pickOne(appointment.specialties);

      if (!profile?.email) {
        await admin.from("appointment_notification_logs").insert({
          appointment_id: appointment.id,
          channel: "email",
          kind: "confirmation_required",
          status: "skipped",
          detail: "Paciente sem e-mail cadastrado.",
        });
        continue;
      }

      const { data: tokenRows, error: tokenError } = await admin
        .from("appointment_action_tokens")
        .insert([
          {
            appointment_id: appointment.id,
            action: "confirm",
            expires_at: appointment.patient_confirmation_deadline_at,
          },
          {
            appointment_id: appointment.id,
            action: "cancel",
            expires_at: appointment.patient_confirmation_deadline_at,
          },
        ])
        .select("action, token");

      if (tokenError || !tokenRows) {
        errors.push(`tokenError:${appointment.id}:${tokenError?.message}`);
        continue;
      }

      const typedTokens = tokenRows as ActionTokenRow[];
      const confirmToken = typedTokens.find((t) => t.action === "confirm")?.token;
      const cancelToken = typedTokens.find((t) => t.action === "cancel")?.token;

      if (!confirmToken || !cancelToken) {
        errors.push(`missingTokens:${appointment.id}`);
        continue;
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL!.replace(/\/$/, "");
      const confirmUrl = `${baseUrl}/api/appointments/action?token=${encodeURIComponent(
        confirmToken
      )}`;
      const cancelUrl = `${baseUrl}/api/appointments/action?token=${encodeURIComponent(
        cancelToken
      )}`;

      try {
        await sendResendEmail({
          to: profile.email,
          subject: "Confirme sua consulta na MediNexus",
          html: buildReminderEmailHtml({
            patientName: profile.full_name || "Paciente",
            clinicName: clinic?.trade_name || "Clínica",
            doctorName: doctor?.name || "Médico",
            specialtyName: specialty?.name || "Especialidade",
            confirmedStartAt: appointment.confirmed_start_at,
            deadlineAt: appointment.patient_confirmation_deadline_at,
            confirmUrl,
            cancelUrl,
          }),
          text: buildReminderEmailText({
            patientName: profile.full_name || "Paciente",
            clinicName: clinic?.trade_name || "Clínica",
            doctorName: doctor?.name || "Médico",
            specialtyName: specialty?.name || "Especialidade",
            confirmedStartAt: appointment.confirmed_start_at,
            deadlineAt: appointment.patient_confirmation_deadline_at,
            confirmUrl,
            cancelUrl,
          }),
        });

        await admin
          .from("appointments")
          .update({
            confirmation_reminder_sent_at: nowIso,
          })
          .eq("id", appointment.id);

        await admin.from("appointment_notification_logs").insert({
          appointment_id: appointment.id,
          channel: "email",
          kind: "confirmation_required",
          status: "sent",
          detail: "Lembrete enviado com links de ação.",
        });

        remindersSent += 1;
      } catch (error: any) {
        await admin.from("appointment_notification_logs").insert({
          appointment_id: appointment.id,
          channel: "email",
          kind: "confirmation_required",
          status: "failed",
          detail: error.message,
        });

        errors.push(`sendError:${appointment.id}:${error.message}`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    remindersSent,
    expiredCount,
    errors,
  });
}


