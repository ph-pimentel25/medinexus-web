import { createClient } from "@supabase/supabase-js";
import { AccessToken } from "livekit-server-sdk";
import {
  ACCESS_MESSAGES,
  checkJoinWindow,
  roomNameFor,
} from "../../../lib/telemedicine-access";

const headers = { "Cache-Control": "no-store" };

function cleanLivekitUrl(raw?: string): string {
  if (!raw) return "";
  let u = raw.trim().replace(/^["']|["']$/g, "").trim();
  u = u.replace(/\/+$/, "");
  if (u.startsWith("https://")) u = "wss://" + u.slice(8);
  else if (u.startsWith("http://")) u = "ws://" + u.slice(7);
  else if (!u.startsWith("wss://") && !u.startsWith("ws://")) u = "wss://" + u;
  return u;
}

export function GET() {
  const available = Boolean(
    process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET
  );
  return Response.json({ available }, { headers });
}

export async function POST(request: Request) {
  const rawLkUrl = process.env.LIVEKIT_URL;
  const rawLkKey = process.env.LIVEKIT_API_KEY;
  const rawLkSecret = process.env.LIVEKIT_API_SECRET;

  const lkUrl = cleanLivekitUrl(rawLkUrl);
  const lkKey = (rawLkKey || "").trim().replace(/^["']|["']$/g, "").trim();
  const lkSecret = (rawLkSecret || "").trim().replace(/^["']|["']$/g, "").trim();

  if (!lkUrl || !lkKey || !lkSecret) {
    return Response.json(
      { error: "Telemedicina ainda não ativada neste ambiente." },
      { status: 503, headers }
    );
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) {
    return Response.json({ error: "Entre na sua conta." }, { status: 401, headers });
  }

  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const {
    data: { user },
  } = await client.auth.getUser(token);
  if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401, headers });

  let body: { appointmentId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400, headers });
  }
  const appointmentId = body?.appointmentId;
  if (typeof appointmentId !== "string" || !/^[0-9a-f-]{36}$/i.test(appointmentId)) {
    return Response.json({ error: "Pedido inválido." }, { status: 400, headers });
  }

  // A leitura usa o token do usuário: o RLS só devolve consultas que ele pode ver.
  const { data: appt } = await client
    .from("appointments")
    .select("id, status, patient_id, doctor_id, clinic_id, confirmed_start_at, confirmed_end_at")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appt) return Response.json({ error: "Consulta não encontrada." }, { status: 404, headers });

  let role: "patient" | "doctor" | null = null;
  let displayName = "Participante";
  if (appt.patient_id === user.id) {
    role = "patient";
    displayName = "Paciente";
  } else {
    const { data: member } = await client
      .from("clinic_members")
      .select("doctor_id")
      .eq("user_id", user.id)
      .eq("clinic_id", appt.clinic_id)
      .eq("doctor_id", appt.doctor_id)
      .maybeSingle();
    if (member) {
      role = "doctor";
      displayName = "Médico";
    }
  }
  if (!role) return Response.json({ error: "Sem acesso a esta consulta." }, { status: 403, headers });

  const decision = checkJoinWindow(appt);
  if (!decision.ok) {
    return Response.json(
      { error: ACCESS_MESSAGES[decision.reason], reason: decision.reason },
      { status: 409, headers }
    );
  }

  const at = new AccessToken(lkKey, lkSecret, {
    identity: `${role}:${user.id}`,
    name: displayName,
    ttl: "10m",
  });
  at.addGrant({
    room: roomNameFor(appt.id),
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return Response.json({ token: await at.toJwt(), url: lkUrl, role }, { headers });
}
