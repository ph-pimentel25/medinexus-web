"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type MemberRow = {
  doctor_id: string | null;
  member_role: "owner" | "admin" | "doctor";
};

type AvailabilityRow = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

const weekdayOptions = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default function MedicoDisponibilidadePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [doctorId, setDoctorId] = useState<string>("");
  const [windows, setWindows] = useState<AvailabilityRow[]>([]);

  const [form, setForm] = useState({
    dayOfWeek: "1",
    startTime: "08:00",
    endTime: "12:00",
  });

  const groupedWindows = useMemo(() => {
    return weekdayOptions.map((day) => ({
      ...day,
      items: windows.filter((item) => item.day_of_week === day.value),
    }));
  }, [windows]);

  useEffect(() => {
    loadAvailability();
  }, []);

  async function loadAvailability() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: member, error: memberError } = await supabase
      .from("clinic_members")
      .select("doctor_id, member_role")
      .eq("user_id", user.id)
      .eq("member_role", "doctor")
      .single<MemberRow>();

    if (memberError || !member || !member.doctor_id) {
      setMessage("Você não possui acesso à área médica.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setDoctorId(member.doctor_id);

    const { data, error } = await supabase
      .from("doctor_availability")
      .select("id, day_of_week, start_time, end_time, is_active")
      .eq("doctor_id", member.doctor_id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      setMessage("Erro ao carregar a disponibilidade.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setWindows((data || []) as AvailabilityRow[]);
    setLoading(false);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleAddWindow(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!doctorId) {
      setMessage("Médico não encontrado.");
      setMessageType("error");
      return;
    }

    if (form.startTime >= form.endTime) {
      setMessage("A hora final precisa ser maior que a hora inicial.");
      setMessageType("error");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("doctor_availability").insert({
      doctor_id: doctorId,
      day_of_week: Number(form.dayOfWeek),
      start_time: form.startTime,
      end_time: form.endTime,
      is_active: true,
    });

    if (error) {
      setMessage(`Erro ao adicionar disponibilidade: ${error.message}`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    setMessage("Disponibilidade adicionada com sucesso.");
    setMessageType("success");
    setSaving(false);
    await loadAvailability();
  }

  async function handleToggleActive(item: AvailabilityRow) {
    setMessage("");
    setActingId(item.id);

    const { error } = await supabase
      .from("doctor_availability")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);

    if (error) {
      setMessage("Erro ao alterar status da disponibilidade.");
      setMessageType("error");
      setActingId(null);
      return;
    }

    setMessage("Disponibilidade atualizada com sucesso.");
    setMessageType("success");
    setActingId(null);
    await loadAvailability();
  }

  async function handleDelete(id: string) {
    setMessage("");
    setActingId(id);

    const { error } = await supabase
      .from("doctor_availability")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage("Erro ao remover disponibilidade.");
      setMessageType("error");
      setActingId(null);
      return;
    }

    setMessage("Disponibilidade removida com sucesso.");
    setMessageType("success");
    setActingId(null);
    await loadAvailability();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando disponibilidade...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <Link
            href="/medico/dashboard"
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            ← Voltar para o dashboard médico
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Disponibilidade do médico
          </p>
          <h1 className="mt-3 app-section-title">
            Configure sua agenda semanal
          </h1>
          <p className="app-section-subtitle">
            Defina os períodos em que você pode atender. A confirmação de consultas
            passará a respeitar essa disponibilidade.
          </p>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="mb-8 app-card p-8">
          <h2 className="text-2xl font-semibold text-slate-900">
            Adicionar disponibilidade
          </h2>

          <form onSubmit={handleAddWindow} className="mt-6 grid gap-5 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Dia da semana
              </label>
              <select
                name="dayOfWeek"
                value={form.dayOfWeek}
                onChange={handleChange}
                className="app-input"
              >
                {weekdayOptions.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Hora inicial
              </label>
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                className="app-input"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Hora final
              </label>
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                className="app-input"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="app-button-primary w-full"
              >
                {saving ? "Salvando..." : "Adicionar"}
              </button>
            </div>
          </form>
        </div>

        <div className="grid gap-6">
          {groupedWindows.map((group) => (
            <div key={group.value} className="app-card p-8">
              <h3 className="text-xl font-semibold text-slate-900">
                {group.label}
              </h3>

              {group.items.length === 0 ? (
                <p className="mt-4 text-slate-500">
                  Nenhum horário cadastrado neste dia.
                </p>
              ) : (
                <div className="mt-5 grid gap-4">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {formatTime(item.start_time)} às {formatTime(item.end_time)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Status: {item.is_active ? "ativo" : "inativo"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          disabled={actingId === item.id}
                          className="app-button-secondary"
                        >
                          {item.is_active ? "Desativar" : "Ativar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={actingId === item.id}
                          className="app-button-danger"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}