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

type UploadKind = "logo" | "cover";

const STORAGE_BUCKET = "clinic-branding";

const IMAGE_RULES = {
  logo: {
    label: "Logo da clínica",
    maxBytes: 2 * 1024 * 1024,
    minWidth: 300,
    minHeight: 300,
    idealText: "Ideal: 800 x 800 px",
    ratioText: "Proporção recomendada: 1:1",
    helpText:
      "PNG, JPG ou WEBP â€¢ máximo 2 MB â€¢ mínimo recomendado 300 x 300 px",
  },
  cover: {
    label: "Imagem de capa",
    maxBytes: 4 * 1024 * 1024,
    minWidth: 1200,
    minHeight: 600,
    idealText: "Ideal: 1600 x 900 px",
    ratioText: "Proporção recomendada: 16:9",
    helpText:
      "PNG, JPG ou WEBP â€¢ máximo 4 MB â€¢ mínimo recomendado 1200 x 600 px",
  },
} as const;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeFileName(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  const base = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
  const ext = dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
  return `${slugify(base) || "arquivo"}${ext}`;
}

function isAcceptedImageType(file: File) {
  return ["image/png", "image/jpeg", "image/webp"].includes(file.type);
}

async function getImageDimensions(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const img = new Image();

        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };

        img.onerror = () =>
          reject(new Error("Não foi possível ler a imagem."));
        img.src = objectUrl;
      }
    );

    return dimensions;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function validateImageFile(file: File, kind: UploadKind) {
  const rules = IMAGE_RULES[kind];

  if (!isAcceptedImageType(file)) {
    return "Envie uma imagem em PNG, JPG ou WEBP.";
  }

  if (file.size > rules.maxBytes) {
    return `O arquivo excede o tamanho máximo de ${Math.round(
      rules.maxBytes / (1024 * 1024)
    )} MB.`;
  }

  const { width, height } = await getImageDimensions(file);

  if (width < rules.minWidth || height < rules.minHeight) {
    return `A imagem é muito pequena. Mínimo recomendado: ${rules.minWidth} x ${rules.minHeight} px.`;
  }

  return null;
}

function getStoragePathFromPublicUrl(url: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const index = parsed.pathname.indexOf(marker);

    if (index === -1) return null;

    return decodeURIComponent(parsed.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

type UploadState = {
  kind: UploadKind | null;
  progress: number;
  label: string;
};

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

  const [uploadState, setUploadState] = useState<UploadState>({
    kind: null,
    progress: 0,
    label: "",
  });

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadPublicProfile();

    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function persistImageUrl(kind: UploadKind, url: string | null) {
    if (!clinicId) return;

    const field = kind === "logo" ? "logo_url" : "cover_image_url";

    const { error } = await supabase
      .from("clinics")
      .update({
        [field]: url,
      })
      .eq("id", clinicId);

    if (error) {
      throw new Error(error.message);
    }
  }

  function clearPreview(kind: UploadKind) {
    if (kind === "logo") {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      setLogoPreviewUrl(null);
      return;
    }

    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverPreviewUrl(null);
  }

  function setPreview(kind: UploadKind, objectUrl: string) {
    clearPreview(kind);

    if (kind === "logo") {
      setLogoPreviewUrl(objectUrl);
    } else {
      setCoverPreviewUrl(objectUrl);
    }
  }

  async function deleteStorageFileIfManaged(url: string | null) {
    const storagePath = getStoragePathFromPublicUrl(url);

    if (!storagePath) return;

    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    kind: UploadKind
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (!clinicId) {
      setMessage("Clínica não encontrada.");
      setMessageType("error");
      return;
    }

    setMessage("");
    setUploadState({
      kind,
      progress: 10,
      label: "Validando imagem...",
    });

    try {
      const validationError = await validateImageFile(file, kind);

      if (validationError) {
        setMessage(validationError);
        setMessageType("error");
        setUploadState({ kind: null, progress: 0, label: "" });
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreview(kind, objectUrl);

      setUploadState({
        kind,
        progress: 30,
        label: "Preparando upload...",
      });

      const fileName = safeFileName(file.name);
      const filePath = `clinics/${clinicId}/${kind}/${Date.now()}-${fileName}`;

      const oldUrl = kind === "logo" ? form.logo_url : form.cover_image_url;

      setUploadState({
        kind,
        progress: 60,
        label: "Enviando arquivo...",
      });

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setMessage(`Erro no upload: ${uploadError.message}`);
        setMessageType("error");
        setUploadState({ kind: null, progress: 0, label: "" });
        return;
      }

      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      setUploadState({
        kind,
        progress: 85,
        label: "Salvando imagem na clínica...",
      });

      try {
        await persistImageUrl(kind, publicUrl);
      } catch (persistError: any) {
        await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
        throw persistError;
      }

      if (kind === "logo") {
        setForm((prev) => ({
          ...prev,
          logo_url: publicUrl,
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          cover_image_url: publicUrl,
        }));
      }

      setUploadState({
        kind,
        progress: 95,
        label: "Removendo imagem antiga...",
      });

      if (oldUrl && oldUrl !== publicUrl) {
        await deleteStorageFileIfManaged(oldUrl);
      }

      setUploadState({
        kind,
        progress: 100,
        label: "Upload concluído.",
      });

      clearPreview(kind);

      setMessage(
        `${kind === "logo" ? "Logo" : "Imagem de capa"} enviada com sucesso.`
      );
      setMessageType("success");
    } catch (error: any) {
      setMessage(
        error?.message || "Não foi possível processar a imagem enviada."
      );
      setMessageType("error");
    } finally {
      setTimeout(() => {
        setUploadState({ kind: null, progress: 0, label: "" });
      }, 500);
    }
  }

  async function handleRemoveImage(kind: UploadKind) {
    if (!clinicId) {
      setMessage("Clínica não encontrada.");
      setMessageType("error");
      return;
    }

    const currentUrl = kind === "logo" ? form.logo_url : form.cover_image_url;

    if (!currentUrl) return;

    setMessage("");
    setUploadState({
      kind,
      progress: 25,
      label: "Removendo imagem...",
    });

    try {
      await persistImageUrl(kind, null);

      setUploadState({
        kind,
        progress: 70,
        label: "Limpando arquivo antigo...",
      });

      await deleteStorageFileIfManaged(currentUrl);

      if (kind === "logo") {
        setForm((prev) => ({
          ...prev,
          logo_url: "",
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          cover_image_url: "",
        }));
      }

      clearPreview(kind);

      setUploadState({
        kind,
        progress: 100,
        label: "Imagem removida.",
      });

      setMessage(
        `${kind === "logo" ? "Logo" : "Imagem de capa"} removida com sucesso.`
      );
      setMessageType("success");
    } catch (error: any) {
      setMessage(error?.message || "Não foi possível remover a imagem.");
      setMessageType("error");
    } finally {
      setTimeout(() => {
        setUploadState({ kind: null, progress: 0, label: "" });
      }, 500);
    }
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

  const displayedLogo = logoPreviewUrl || form.logo_url || "";
  const displayedCover = coverPreviewUrl || form.cover_image_url || "";

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

        {(uploadState.kind || saving) && (
          <div className="mb-6 app-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {uploadState.label || "Salvando alterações..."}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {uploadState.kind
                    ? `Processando ${uploadState.kind === "logo" ? "logo" : "capa"}`
                    : "Atualizando conteúdo da página pública"}
                </p>
              </div>

              <div className="text-sm font-semibold text-slate-700">
                {uploadState.progress > 0 ? `${uploadState.progress}%` : "..." }
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${uploadState.progress || (saving ? 70 : 0)}%`,
                  backgroundColor: "var(--brand-petrol)",
                }}
              />
            </div>
          </div>
        )}

        <div className="app-card p-8">
          <form onSubmit={handleSubmit} className="grid gap-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Logo da clínica
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {IMAGE_RULES.logo.helpText}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {IMAGE_RULES.logo.idealText} â€¢ {IMAGE_RULES.logo.ratioText}
                </p>

                <div className="mt-5 overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-white p-4">
                  {displayedLogo ? (
                    <div className="flex h-48 items-center justify-center">
                      <img
                        src={displayedLogo}
                        alt="Preview da logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center text-sm text-slate-400">
                      Nenhuma logo enviada
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <label className="app-button-primary cursor-pointer text-center">
                    {uploadState.kind === "logo"
                      ? "Enviando..."
                      : form.logo_url
                      ? "Trocar logo"
                      : "Enviar logo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "logo")}
                      disabled={uploadState.kind !== null || saving}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleRemoveImage("logo")}
                    disabled={!form.logo_url || uploadState.kind !== null || saving}
                    className="app-button-secondary"
                  >
                    Remover logo
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Imagem de capa
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {IMAGE_RULES.cover.helpText}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {IMAGE_RULES.cover.idealText} â€¢ {IMAGE_RULES.cover.ratioText}
                </p>

                <div className="mt-5 overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-white p-2">
                  {displayedCover ? (
                    <div className="h-48 overflow-hidden rounded-2xl">
                      <img
                        src={displayedCover}
                        alt="Preview da capa"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center text-sm text-slate-400">
                      Nenhuma capa enviada
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <label className="app-button-primary cursor-pointer text-center">
                    {uploadState.kind === "cover"
                      ? "Enviando..."
                      : form.cover_image_url
                      ? "Trocar capa"
                      : "Enviar capa"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "cover")}
                      disabled={uploadState.kind !== null || saving}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleRemoveImage("cover")}
                    disabled={
                      !form.cover_image_url || uploadState.kind !== null || saving
                    }
                    className="app-button-secondary"
                  >
                    Remover capa
                  </button>
                </div>
              </div>
            </div>

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
              disabled={saving || uploadState.kind !== null}
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


