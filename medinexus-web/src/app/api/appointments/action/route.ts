import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type TokenRow = {
  id: string;
  appointment_id: string;
  action: "confirm" | "cancel";
  token: string;
  expires_at: string;
  used_at: string | null;
};

type AppointmentRow = {
  id: string;
  status: string;
  patient_confirmation_status: string;
  patient_confirmed_at: string | null;
};

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(
      `${baseUrl}/solicitacoes?appointmentAction=invalid-token`
    );
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.redirect(
      `${baseUrl}/solicitacoes?appointmentAction=server-config-error`
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

  const { data: tokenRow, error: tokenError } = await admin
    .from("appointment_action_tokens")
    .select("id, appointment_id, action, token, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  const typedToken = tokenRow as TokenRow | null;

  if (tokenError || !typedToken) {
    return NextResponse.redirect(
      `${baseUrl}/solicitacoes?appointmentAction=invalid-token`
    );
  }

  if (typedToken.used_at) {
    return NextResponse.redirect(
      `${baseUrl}/solicitacoes?appointmentAction=already-used`
    );
  }

  if (new Date(typedToken.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(
      `${baseUrl}/solicitacoes?appointmentAction=expired-token`
    );
  }

  const { data: appointmentRow, error: appointmentError } = await admin
    .from("appointments")
    .select("id, status, patient_confirmation_status, patient_confirmed_at")
    .eq("id", typedToken.appointment_id)
    .maybeSingle();

  const appointment = appointmentRow as AppointmentRow | null;

  if (appointmentError || !appointment) {
    return NextResponse.redirect(
      `${baseUrl}/solicitacoes?appointmentAction=appointment-not-found`
    );
  }

  if (
    appointment.status !== "confirmed" ||
    appointment.patient_confirmation_status !== "waiting"
  ) {
    return NextResponse.redirect(
      `${baseUrl}/solicitacoes?appointmentAction=not-available`
    );
  }

  const nowIso = new Date().toISOString();

  if (typedToken.action === "confirm") {
    const { error: updateError } = await admin
      .from("appointments")
      .update({
        patient_confirmation_status: "confirmed",
        patient_confirmed_at: nowIso,
      })
      .eq("id", appointment.id);

    if (updateError) {
      return NextResponse.redirect(
        `${baseUrl}/solicitacoes?appointmentAction=action-error`
      );
    }

    await admin
      .from("appointment_action_tokens")
      .update({ used_at: nowIso })
      .eq("appointment_id", appointment.id)
      .is("used_at", null);

    return NextResponse.redirect(
      `${baseUrl}/solicitacoes?appointmentAction=email-confirmed`
    );
  }

  const { error: cancelError } = await admin
    .from("appointments")
    .update({
      status: "cancelled",
      patient_confirmation_status: "cancelled_by_patient",
    })
    .eq("id", appointment.id);

  if (cancelError) {
    return NextResponse.redirect(
      `${baseUrl}/solicitacoes?appointmentAction=action-error`
    );
  }

  await admin
    .from("appointment_action_tokens")
    .update({ used_at: nowIso })
    .eq("appointment_id", appointment.id)
    .is("used_at", null);

  return NextResponse.redirect(
    `${baseUrl}/solicitacoes?appointmentAction=email-cancelled`
  );
}


