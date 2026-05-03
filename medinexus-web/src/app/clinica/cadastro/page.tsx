"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

function normalizeCnpj(value: string) {
  return value.replace(/\D/g, "");
}

function formatCnpj(value: string) {
  const digits = normalizeCnpj(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

type FormDataState = {
  tradeName: string;
  legalName: string;
  cnpj: string;
  contactName: string;
  email: string;
  password: string;
  phone: string;
  addressText: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
};

export default function ClinicaCadastroPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [formData, setFormData] = useState<FormDataState>({
    tradeName: "",
    legalName: "",
    cnpj: "",
    contactName: "",
    email: "",
    password: "",
    phone: "",
    addressText: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    if (name === "cnpj") {
      setFormData((prev) => ({
        ...prev,
        cnpj: formatCnpj(value),
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const cnpjNormalized = normalizeCnpj(formData.cnpj);

    if (cnpjNormalized.length !== 14) {
      setMessage("Informe um CNPJ vÃ¡lido com 14 dÃ­gitos.");
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.contactName,
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
        "Conta criada. FaÃ§a a confirmaÃ§Ã£o do e-mail antes de concluir o cadastro da clÃ­nica."
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
        full_name: formData.contactName,
        phone: formData.phone || null,
        role: "clinic_admin",
      })
      .eq("id", userId);

    if (profileUpdateError) {
      console.error("profileUpdateError:", profileUpdateError);
      setMessage(
        `Conta criada, mas houve erro ao atualizar o perfil: ${profileUpdateError.message}`
      );
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    const { error: clinicError } = await supabase.from("clinics").insert({
      id: clinicId,
      trade_name: formData.tradeName,
      legal_name: formData.legalName,
      cnpj: cnpjNormalized,
      contact_name: formData.contactName,
      contact_phone: formData.phone,
      contact_email: formData.email,
      address_text: formData.addressText,
      neighborhood: formData.neighborhood || null,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zipCode,
      is_verified: false,
      created_by: userId,
    });

    if (clinicError) {
      console.error("clinicError:", clinicError);
      setMessage(`Erro ao criar a clÃ­nica: ${clinicError.message}`);
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
      setMessage(`Erro ao vincular usuÃ¡rio Ã  clÃ­nica: ${memberError.message}`);
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    setMessage("ClÃ­nica cadastrada com sucesso! Redirecionando...");
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
            <span className="brand-chip">Cadastro institucional da clÃ­nica</span>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Estruture sua clÃ­nica com um cadastro mais profissional.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Cadastre dados institucionais, responsÃ¡vel, CNPJ e informaÃ§Ãµes
              essenciais para abrir a Ã¡rea privada da clÃ­nica na MediNexus.
            </p>

            <div className="mt-8 app-card p-6">
              <p className="text-sm font-medium text-slate-500">
                Este cadastro jÃ¡ prepara
              </p>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Conta dona da clÃ­nica
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Base corporativa com CNPJ e dados institucionais
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Ãrea privada para convÃªnios, mÃ©dicos e solicitaÃ§Ãµes
                </div>
              </div>
            </div>
          </div>

          <div className="app-card p-8 shadow-xl shadow-slate-200/60">
            <div className="mb-8">
              <Link
                href="/sobre"
                className="text-sm font-medium text-sky-700 hover:underline"
              >
                â† Voltar para Sobre
              </Link>
            </div>

            <h2 className="text-3xl font-bold text-slate-900">
              Cadastrar clÃ­nica
            </h2>
            <p className="mt-2 text-slate-600">
              Preencha os dados institucionais e da conta responsÃ¡vel.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Nome fantasia
                  </label>
                  <input
                    name="tradeName"
                    value={formData.tradeName}
                    onChange={handleChange}
                    className="app-input"
                    placeholder="Ex: ClÃ­nica MediNexus Centro"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    RazÃ£o social
                  </label>
                  <input
                    name="legalName"
                    value={formData.legalName}
                    onChange={handleChange}
                    className="app-input"
                    placeholder="RazÃ£o social da empresa"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    CNPJ
                  </label>
                  <input
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    className="app-input"
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Nome do responsÃ¡vel
                  </label>
                  <input
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    className="app-input"
                    placeholder="Nome do responsÃ¡vel pela conta"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    E-mail corporativo
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="app-input"
                    placeholder="contato@clinica.com.br"
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
                  Telefone principal
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="(21) 99999-9999"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  EndereÃ§o
                </label>
                <textarea
                  name="addressText"
                  value={formData.addressText}
                  onChange={handleChange}
                  className="app-textarea"
                  placeholder="Rua, nÃºmero, complemento..."
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Bairro
                  </label>
                  <input
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    className="app-input"
                    placeholder="Digite o bairro"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    CEP
                  </label>
                  <input
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="app-input"
                    placeholder="Digite o CEP"
                    required
                  />
                </div>
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
                    required
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
                    required
                  />
                </div>
              </div>

              {message && <Alert variant={messageType}>{message}</Alert>}

              <button
                type="submit"
                disabled={submitting}
                className="app-button-primary"
              >
                {submitting ? "Cadastrando..." : "Cadastrar clÃ­nica"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}


