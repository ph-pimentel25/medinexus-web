"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

export default function ClinicaCadastroPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [formData, setFormData] = useState({
    tradeName: "",
    email: "",
    password: "",
    phone: "",
    addressText: "",
    city: "",
    state: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
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
        full_name: formData.tradeName,
        phone: formData.phone,
        role: "clinic_admin",
      },
    },
  });

  if (error) {
    console.error("signUp error:", error);
    setMessage(`Erro ao criar a conta: ${error.message}`);
    setMessageType("error");
    setSubmitting(false);
    return;
  }

  if (!data.session || !data.user) {
    setMessage(
      "Conta criada. Faça a confirmação do e-mail antes de concluir o cadastro da clínica."
    );
    setMessageType("info");
    setSubmitting(false);
    return;
  }

  const userId = data.user.id;
const clinicId = userId;

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      full_name: formData.tradeName,
      phone: formData.phone || null,
      role: "clinic_admin",
    })
    .eq("id", userId);

  if (profileUpdateError) {
    console.error("profileUpdateError:", profileUpdateError);
    setMessage(`Conta criada, mas houve erro ao atualizar o perfil: ${profileUpdateError.message}`);
    setMessageType("error");
    setSubmitting(false);
    return;
  }

  const { error: clinicError } = await supabase.from("clinics").insert({
  id: clinicId,
  trade_name: formData.tradeName,
  contact_phone: formData.phone || null,
  contact_email: formData.email,
  address_text: formData.addressText || null,
  city: formData.city || null,
  state: formData.state || null,
  is_verified: false,
  created_by: userId,
});

  if (clinicError) {
    console.error("clinicError:", clinicError);
    setMessage(`Erro ao criar a clínica: ${clinicError.message}`);
    setMessageType("error");
    setSubmitting(false);
    return;
  }

const { error: memberError } = await supabase.from("clinic_members").insert({
  clinic_id: clinicId,
  user_id: userId,
  member_role: "owner",
});

  if (memberError) {
    console.error("memberError:", memberError);
    setMessage(`Erro ao vincular usuário à clínica: ${memberError.message}`);
    setMessageType("error");
    setSubmitting(false);
    return;
  }

  setMessage("Clínica cadastrada com sucesso! Redirecionando...");
  setMessageType("success");

  setTimeout(() => {
    router.push("/clinica/dashboard");
  }, 1200);

  setSubmitting(false);
}
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-2">
          <div>
            <span className="brand-chip">Cadastro da clínica</span>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Crie a área privada da sua clínica na MediNexus.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Cadastre a clínica, crie a conta do responsável e prepare sua estrutura
              para receber solicitações de pacientes.
            </p>

            <div className="mt-8 app-card p-6">
              <p className="text-sm font-medium text-slate-500">
                Nesta primeira etapa você já terá
              </p>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Conta dona da clínica
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Dashboard privado da clínica
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Gestão dos planos aceitos
                </div>
              </div>
            </div>
          </div>

          <div className="app-card p-8 shadow-xl shadow-slate-200/60">
            <div className="mb-8">
              <Link
                href="/"
                className="text-sm font-medium text-sky-700 hover:underline"
              >
                ← Voltar para a página inicial
              </Link>
            </div>

            <h2 className="text-3xl font-bold text-slate-900">Cadastrar clínica</h2>
            <p className="mt-2 text-slate-600">
              Preencha os dados básicos da clínica e da conta responsável.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nome da clínica
                </label>
                <input
                  name="tradeName"
                  value={formData.tradeName}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Digite o nome da clínica"
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    E-mail
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="app-input"
                    placeholder="Digite o e-mail"
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
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Telefone
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="(21) 99999-9999"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Endereço
                </label>
                <textarea
                  name="addressText"
                  value={formData.addressText}
                  onChange={handleChange}
                  className="app-textarea"
                  placeholder="Rua, número, complemento..."
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Cidade
                  </label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="app-input"
                    placeholder="Digite a cidade"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Estado
                  </label>
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="app-input"
                    placeholder="Digite o estado"
                  />
                </div>
              </div>

              {message && <Alert variant={messageType}>{message}</Alert>}

              <button
                type="submit"
                disabled={submitting}
                className="app-button-primary"
              >
                {submitting ? "Cadastrando..." : "Cadastrar clínica"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}