"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

export default function MedicoCadastroPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    crm: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: "",
          role: "doctor",
        },
      },
    });

    if (error) {
      console.error("doctor signUp error:", error);
      setMessage(`Erro ao criar conta do médico: ${error.message}`);
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    if (!data.session || !data.user) {
      setMessage(
        "Conta criada. Confirme o e-mail antes de concluir o acesso médico."
      );
      setMessageType("info");
      setSubmitting(false);
      return;
    }

    const userId = data.user.id;

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        phone: null,
        role: "doctor",
      })
      .eq("id", userId);

    if (profileUpdateError) {
      console.error("profileUpdateError:", profileUpdateError);
      setMessage(`Conta criada, mas houve erro ao atualizar o perfil: ${profileUpdateError.message}`);
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeCrm(value: string) {
  return value.replace(/\D/g, "").trim();
}

const normalizedEmail = normalizeEmail(formData.email);
const normalizedCrm = normalizeCrm(formData.crm);

const { data: doctorCandidates, error: matchedDoctorError } = await supabase
  .from("doctors")
  .select("id, clinic_id, name, professional_email, crm")
  .ilike("professional_email", normalizedEmail);

const matchedDoctor =
  (doctorCandidates || []).find((doctor) => {
    const doctorEmail = normalizeEmail(doctor.professional_email || "");
    const doctorCrm = normalizeCrm(doctor.crm || "");

    return doctorEmail === normalizedEmail && doctorCrm === normalizedCrm;
  }) || null;

if (matchedDoctorError || !matchedDoctor) {
  console.error("matchedDoctorError:", matchedDoctorError);
  console.error("doctorCandidates:", doctorCandidates);
  setMessage(
    "Conta criada, mas nenhum médico pré-cadastrado foi encontrado com este e-mail e CRM. Revise o cadastro do médico na clínica."
  );
  setMessageType("error");
  setSubmitting(false);
  return;
}

    const { error: fullNameUpdateError } = await supabase
      .from("profiles")
      .update({
        full_name: matchedDoctor.name,
      })
      .eq("id", userId);

    if (fullNameUpdateError) {
      console.error("fullNameUpdateError:", fullNameUpdateError);
    }

    const { error: memberInsertError } = await supabase.from("clinic_members").insert({
      clinic_id: matchedDoctor.clinic_id,
      user_id: userId,
      member_role: "doctor",
      doctor_id: matchedDoctor.id,
    });

    if (memberInsertError) {
      console.error("memberInsertError:", memberInsertError);
      setMessage(`Conta criada, mas houve erro ao vincular o médico: ${memberInsertError.message}`);
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    setMessage("Conta médica criada com sucesso! Redirecionando...");
    setMessageType("success");
    setSubmitting(false);

    setTimeout(() => {
      router.push("/medico/dashboard");
    }, 1000);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-2">
          <div>
            <span className="brand-chip">Cadastro do médico</span>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Ative o acesso médico Ã  área restrita da MediNexus.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Use o mesmo e-mail profissional e CRM cadastrados pela clínica para vincular sua conta corretamente.
            </p>

            <div className="mt-8 app-card p-6">
              <p className="text-sm font-medium text-slate-500">
                Antes de se cadastrar
              </p>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  A clínica precisa ter cadastrado seu e-mail profissional
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  O CRM informado aqui deve bater com o CRM do cadastro
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Depois do vínculo, sua área médica será liberada
                </div>
              </div>
            </div>
          </div>

          <div className="app-card p-8 shadow-xl shadow-slate-200/60">
            <div className="mb-8">
              <Link
                href="/login"
                className="text-sm font-medium text-sky-700 hover:underline"
              >
                â† Voltar para login
              </Link>
            </div>

            <h2 className="text-3xl font-bold text-slate-900">Criar conta médica</h2>
            <p className="mt-2 text-slate-600">
              Preencha exatamente como foi cadastrado pela clínica.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  E-mail profissional
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Digite seu e-mail profissional"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  CRM
                </label>
                <input
                  name="crm"
                  value={formData.crm}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Digite seu CRM"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Senha
                </label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Crie uma senha"
                  required
                  minLength={6}
                />
              </div>

              {message && <Alert variant={messageType}>{message}</Alert>}

              <button
                type="submit"
                disabled={submitting}
                className="app-button-primary"
              >
                {submitting ? "Criando conta..." : "Criar conta médica"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}


