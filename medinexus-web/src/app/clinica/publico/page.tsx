"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type MemberRow = {
  clinic_id: string;
  member_role: "owner" | "admin" | "doctor";
};

type ClinicPublicForm = {
  trade_name: string;
  description: string;
  website_url: string;
  logo_url: string;
  cover_image_url: string;
  hero_title: string;
  hero_subtitle: string;
  public_slug: string;
  public_highlight_1: string;
  public_highlight_2: string;
  public_highlight_3: string;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ClinicaPublicoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [clinicId, setClinicId] = useState("");
  const [form, setForm] = useState<ClinicPublicForm>({
    trade_name: "",
    description: "",
    website_url: "",
    logo_url: "",
    cover_image_url: "",
    hero_title: "",
    hero_subtitle: "",
    public_slug: "",
    public_highlight_1: "",
    public_highlight_2: "",
    public_highlight_3: "",
  });

  useEffect(() => {
    loadPublicProfile();
  }, []);

  async function loadPublicProfile() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const { data: member, error: memberError } = await supabase
      .from("clinic_members")
      .select("clinic_id, member_role")
      .eq("user_id", user.id)
      .single<MemberRow>();

    if (
      memberError ||
      !member ||
      !["owner", "admin"].includes(member.member_role)
    ) {
      setMessage("Você não possui permissão para editar a página pública.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setClinicId(member.clinic_id);

    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select(
        `
        trade_name,
        description,
        website_url,
        logo_url,
        cover_image_url,
        hero_title,
        hero_subtitle,
        public_slug,
        public_highlight_1,
        public_highlight_2,
        public_highlight_3
      `
      )
      .eq("id", member.clinic_id)
      .single();

    if (clinicError || !clinic) {
      setMessage("Não foi possível carregar a página pública da clínica.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setForm({
      trade_name: clinic.trade_name || "",
      description: clinic.description || "",
      website_url: clinic.website_url || "",
      logo_url: clinic.logo_url || "",
      cover_image_url: clinic.cover_image_url || "",
      hero_title: clinic.hero_title || "",
      hero_subtitle: clinic.hero_subtitle || "",
      public_slug: clinic.public_slug || "",
      public_highlight_1: clinic.public_highlight_1 || "",
      public_highlight_2: clinic.public_highlight_2 || "",
      public_highlight_3: clinic.public_highlight_3 || "",
    });

    setLoading(false);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "public_slug" ? slugify(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (!clinicId) {
      setMessage("Clínica não encontrada.");
      setMessageType("error");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("clinics")
      .update({
        trade_name: form.trade_name || null,
        description: form.description || null,
        website_url: form.website_url || null,
        logo_url: form.logo_url || null,
        cover_image_url: form.cover_image_url || null,
        hero_title: form.hero_title || null,
        hero_subtitle: form.hero_subtitle || null,
        public_slug: form.public_slug || null,
        public_highlight_1: form.public_highlight_1 || null,
        public_highlight_2: form.public_highlight_2 || null,
        public_highlight_3: form.public_highlight_3 || null,
      })
      .eq("id", clinicId);

    if (error) {
      setMessage(`Erro ao salvar página pública: ${error.message}`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    setMessage("Página pública atualizada com sucesso.");
    setMessageType("success");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando página pública...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="app-shell py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
              Página pública da clínica
            </p>
            <h1 className="mt-3 app-section-title">
              Personalize a vitrine da sua clínica
            </h1>
            <p className="app-section-subtitle">
              Edite textos, imagens e destaques que aparecem no diretório público.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/clinica/dashboard"
              className="app-button-secondary text-center"
            >
              Voltar ao dashboard
            </Link>
            {clinicId && (
              <Link
                href={`/clinicas/${clinicId}`}
                className="app-button-primary text-center"
              >
                Ver página pública
              </Link>
            )}
          </div>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="app-card p-8">
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nome da clínica
                </label>
                <input
                  name="trade_name"
                  value={form.trade_name}
                  onChange={handleChange}
                  className="app-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Slug público
                </label>
                <input
                  name="public_slug"
                  value={form.public_slug}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="ex: clinica-medinexus-centro"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Título principal
              </label>
              <input
                name="hero_title"
                value={form.hero_title}
                onChange={handleChange}
                className="app-input"
                placeholder="Ex: Cuidado especializado com atendimento humanizado"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Subtítulo principal
              </label>
              <textarea
                name="hero_subtitle"
                value={form.hero_subtitle}
                onChange={handleChange}
                className="app-textarea"
                placeholder="Descreva em poucas linhas a proposta da clínica"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Descrição institucional
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="app-textarea"
                placeholder="Conte mais sobre a clínica, diferenciais, estrutura e posicionamento"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  URL da logo
                </label>
                <input
                  name="logo_url"
                  value={form.logo_url}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  URL da imagem de capa
                </label>
                <input
                  name="cover_image_url"
                  value={form.cover_image_url}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Website
              </label>
              <input
                name="website_url"
                value={form.website_url}
                onChange={handleChange}
                className="app-input"
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Destaque 1
                </label>
                <input
                  name="public_highlight_1"
                  value={form.public_highlight_1}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Ex: Atendimento ambulatorial"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Destaque 2
                </label>
                <input
                  name="public_highlight_2"
                  value={form.public_highlight_2}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Ex: Equipe multidisciplinar"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Destaque 3
                </label>
                <input
                  name="public_highlight_3"
                  value={form.public_highlight_3}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Ex: Convênios parceiros"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="app-button-primary"
            >
              {saving ? "Salvando..." : "Salvar página pública"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}