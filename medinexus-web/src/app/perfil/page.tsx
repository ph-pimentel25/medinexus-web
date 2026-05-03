"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Alert from "../components/alert";
import { geocodeBrazilAddress } from "../lib/geocode";
import { supabase } from "../lib/supabase";

type ProfileRow = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  address_zipcode: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_country: string | null;
  latitude: number | null;
  longitude: number | null;
  data_usage_consent: boolean | null;
  profile_completed: boolean | null;
};

type PatientRow = {
  birth_date: string | null;
  default_health_plan_id: string | null;
  cpf: string | null;
  health_plan_card_number: string | null;
  health_plan_operator: string | null;
  health_plan_product_name: string | null;
  health_plan_accommodation: string | null;
  health_plan_network: string | null;
  health_plan_segment: string | null;
  health_plan_extra_info: string | null;
  accepts_private_consultation: boolean | null;
  patient_notes: string | null;
};

type HealthPlanRow = {
  id: string;
  name: string | null;
};

type PaymentMode = "" | "health_plan" | "private";

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function validateCpf(value: string) {
  return onlyDigits(value).length === 11;
}

function formatCoordinate(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return value.toFixed(6);
}

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);

  const [paymentMode, setPaymentMode] = useState<PaymentMode>("");

  const [savedCoordinates, setSavedCoordinates] = useState<Coordinates>({
    latitude: null,
    longitude: null,
  });

  const [deviceCoordinates, setDeviceCoordinates] = useState<Coordinates>({
    latitude: null,
    longitude: null,
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [healthPlans, setHealthPlans] = useState<HealthPlanRow[]>([]);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    cpf: "",
    birth_date: "",
    address_zipcode: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    address_country: "Brasil",
    default_health_plan_id: "",
    health_plan_card_number: "",
    health_plan_operator: "",
    health_plan_product_name: "",
    health_plan_accommodation: "",
    health_plan_network: "",
    health_plan_segment: "",
    health_plan_extra_info: "",
    accepts_private_consultation: true,
    patient_notes: "",
    data_usage_consent: false,
  });

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    const zip = onlyDigits(form.address_zipcode);

    if (zip.length !== 8) return;

    const timeout = window.setTimeout(() => {
      fetchAddressByZipcode(zip);
    }, 500);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.address_zipcode]);

  async function fetchAddressByZipcode(zipcode: string) {
    setLoadingCep(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipcode}/json/`);
      const data = await response.json();

      if (data?.erro) {
        setMessage("CEP nÃ£o encontrado. Preencha o endereÃ§o manualmente.");
        setMessageType("error");
        setLoadingCep(false);
        return;
      }

      setForm((prev) => ({
        ...prev,
        address_zipcode: zipcode,
        address_street: data.logradouro || prev.address_street,
        address_neighborhood: data.bairro || prev.address_neighborhood,
        address_city: data.localidade || prev.address_city,
        address_state: data.uf || prev.address_state,
        address_country: "Brasil",
      }));
    } catch {
      setMessage("NÃ£o foi possÃ­vel buscar o CEP agora. Preencha manualmente.");
      setMessageType("error");
    } finally {
      setLoadingCep(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage("Seu navegador nÃ£o permite capturar localizaÃ§Ã£o.");
      setMessageType("error");
      return;
    }

    setCapturingLocation(true);
    setMessage("Capturando sua localizaÃ§Ã£o precisa...");
    setMessageType("info");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setDeviceCoordinates({
          latitude,
          longitude,
        });

        setMessage("LocalizaÃ§Ã£o precisa capturada com sucesso.");
        setMessageType("success");
        setCapturingLocation(false);
      },
      () => {
        setMessage(
          "NÃ£o foi possÃ­vel capturar sua localizaÃ§Ã£o. Verifique a permissÃ£o do navegador."
        );
        setMessageType("error");
        setCapturingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  async function loadPage() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("VocÃª precisa estar logado para editar seu perfil.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const [profileResponse, patientResponse, plansResponse] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          `
          full_name,
          email,
          phone,
          cpf,
          address_zipcode,
          address_street,
          address_number,
          address_complement,
          address_neighborhood,
          address_city,
          address_state,
          address_country,
          latitude,
          longitude,
          data_usage_consent,
          profile_completed
        `
        )
        .eq("id", user.id)
        .maybeSingle<ProfileRow>(),
      supabase
        .from("patients")
        .select(
          `
          birth_date,
          default_health_plan_id,
          cpf,
          health_plan_card_number,
          health_plan_operator,
          health_plan_product_name,
          health_plan_accommodation,
          health_plan_network,
          health_plan_segment,
          health_plan_extra_info,
          accepts_private_consultation,
          patient_notes
        `
        )
        .eq("id", user.id)
        .maybeSingle<PatientRow>(),
      supabase.from("health_plans").select("id, name").order("name"),
    ]);

    if (profileResponse.error) {
      setMessage(`Erro ao carregar perfil: ${profileResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (patientResponse.error) {
      setMessage(
        `Erro ao carregar dados do paciente: ${patientResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (plansResponse.error) {
      setMessage(`Erro ao carregar planos: ${plansResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    const profile = profileResponse.data;
    const patient = patientResponse.data;

    const hasPlanData = Boolean(
      patient?.default_health_plan_id ||
        patient?.health_plan_operator ||
        patient?.health_plan_product_name ||
        patient?.health_plan_card_number
    );

    if (hasPlanData) {
      setPaymentMode("health_plan");
    } else if (patient?.accepts_private_consultation) {
      setPaymentMode("private");
    } else {
      setPaymentMode("");
    }

    setSavedCoordinates({
      latitude: profile?.latitude ?? null,
      longitude: profile?.longitude ?? null,
    });

    setDeviceCoordinates({
      latitude: null,
      longitude: null,
    });

    setHealthPlans((plansResponse.data || []) as HealthPlanRow[]);

    setForm({
      full_name: profile?.full_name || "",
      email: profile?.email || user.email || "",
      phone: profile?.phone || "",
      cpf: profile?.cpf || patient?.cpf || "",
      birth_date: patient?.birth_date || "",
      address_zipcode: profile?.address_zipcode || "",
      address_street: profile?.address_street || "",
      address_number: profile?.address_number || "",
      address_complement: profile?.address_complement || "",
      address_neighborhood: profile?.address_neighborhood || "",
      address_city: profile?.address_city || "",
      address_state: profile?.address_state || "",
      address_country: profile?.address_country || "Brasil",
      default_health_plan_id: patient?.default_health_plan_id || "",
      health_plan_card_number: patient?.health_plan_card_number || "",
      health_plan_operator: patient?.health_plan_operator || "",
      health_plan_product_name: patient?.health_plan_product_name || "",
      health_plan_accommodation: patient?.health_plan_accommodation || "",
      health_plan_network: patient?.health_plan_network || "",
      health_plan_segment: patient?.health_plan_segment || "",
      health_plan_extra_info: patient?.health_plan_extra_info || "",
      accepts_private_consultation:
        patient?.accepts_private_consultation ?? true,
      patient_notes: patient?.patient_notes || "",
      data_usage_consent: profile?.data_usage_consent || false,
    });

    setLoading(false);
  }

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;

      setForm((prev) => ({
        ...prev,
        [name]: checked,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePaymentModeChange(mode: PaymentMode) {
    setPaymentMode(mode);

    if (mode === "private") {
      setForm((prev) => ({
        ...prev,
        default_health_plan_id: "",
        health_plan_card_number: "",
        health_plan_operator: "",
        health_plan_product_name: "",
        health_plan_accommodation: "",
        health_plan_network: "",
        health_plan_segment: "",
        health_plan_extra_info: "",
        accepts_private_consultation: true,
      }));
    }

    if (mode === "health_plan") {
      setForm((prev) => ({
        ...prev,
        accepts_private_consultation: false,
      }));
    }
  }

  const requiredMissing = useMemo(() => {
    const requiredFields = [
      ["Nome completo", form.full_name],
      ["Telefone", form.phone],
      ["CPF", form.cpf],
      ["Data de nascimento", form.birth_date],
      ["CEP", form.address_zipcode],
      ["Rua", form.address_street],
      ["NÃºmero", form.address_number],
      ["Bairro", form.address_neighborhood],
      ["Cidade", form.address_city],
      ["Estado", form.address_state],
    ];

    const missing = requiredFields
      .filter(([, value]) => !String(value || "").trim())
      .map(([label]) => label);

    if (form.cpf && !validateCpf(form.cpf)) {
      missing.push("CPF vÃ¡lido com 11 dÃ­gitos");
    }

    if (!paymentMode) {
      missing.push("Tipo de atendimento: plano de saÃºde ou particular");
    }

    if (paymentMode === "health_plan") {
      if (!form.health_plan_operator.trim()) {
        missing.push("Operadora do plano");
      }

      if (!form.health_plan_product_name.trim()) {
        missing.push("Modelo exato do plano");
      }

      if (!form.health_plan_card_number.trim()) {
        missing.push("NÃºmero da carteirinha");
      }
    }

    if (!form.data_usage_consent) {
      missing.push("Consentimento de uso de dados");
    }

    return missing;
  }, [form, paymentMode]);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (requiredMissing.length > 0) {
      setMessage(
        `Preencha os campos obrigatÃ³rios: ${requiredMissing.join(", ")}.`
      );
      setMessageType("error");
      setSaving(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("SessÃ£o expirada. FaÃ§a login novamente.");
      setMessageType("error");
      setSaving(false);
      return;
    }

    const normalizedCpf = onlyDigits(form.cpf);

    const isPrivate = paymentMode === "private";
    const hasHealthPlan = paymentMode === "health_plan";

    const fallbackCoordinates = await geocodeBrazilAddress({
      zipcode: form.address_zipcode,
      street: form.address_street,
      number: form.address_number,
      neighborhood: form.address_neighborhood,
      city: form.address_city,
      state: form.address_state,
    });

    const finalLatitude =
      deviceCoordinates.latitude ?? fallbackCoordinates.latitude;

    const finalLongitude =
      deviceCoordinates.longitude ?? fallbackCoordinates.longitude;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        cpf: normalizedCpf,
        address_zipcode: onlyDigits(form.address_zipcode),
        address_street: form.address_street.trim(),
        address_number: form.address_number.trim(),
        address_complement: form.address_complement.trim() || null,
        address_neighborhood: form.address_neighborhood.trim(),
        address_city: form.address_city.trim(),
        address_state: form.address_state.trim().toUpperCase(),
        address_country: form.address_country.trim() || "Brasil",
        latitude: finalLatitude,
        longitude: finalLongitude,
        data_usage_consent: form.data_usage_consent,
        profile_completed: true,
      })
      .eq("id", user.id);

    if (profileError) {
      setMessage(`Erro ao salvar perfil: ${profileError.message}`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    const { error: patientError } = await supabase.from("patients").upsert(
      {
        id: user.id,
        birth_date: form.birth_date,
        default_health_plan_id: hasHealthPlan
          ? form.default_health_plan_id || null
          : null,
        cpf: normalizedCpf,
        health_plan_card_number: hasHealthPlan
          ? form.health_plan_card_number.trim()
          : null,
        health_plan_operator: hasHealthPlan
          ? form.health_plan_operator.trim()
          : null,
        health_plan_product_name: hasHealthPlan
          ? form.health_plan_product_name.trim()
          : null,
        health_plan_accommodation: hasHealthPlan
          ? form.health_plan_accommodation.trim() || null
          : null,
        health_plan_network: hasHealthPlan
          ? form.health_plan_network.trim() || null
          : null,
        health_plan_segment: hasHealthPlan
          ? form.health_plan_segment.trim() || null
          : null,
        health_plan_extra_info: hasHealthPlan
          ? form.health_plan_extra_info.trim() || null
          : null,
        accepts_private_consultation: isPrivate,
        patient_notes: form.patient_notes.trim() || null,
      },
      {
        onConflict: "id",
      }
    );

    if (patientError) {
      setMessage(`Erro ao salvar dados do paciente: ${patientError.message}`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    setSavedCoordinates({
      latitude: finalLatitude,
      longitude: finalLongitude,
    });

    setMessage("Perfil atualizado com sucesso.");
    setMessageType("success");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando perfil...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#EAF1F0_0,#F8FAFC_34%,#FFFFFF_100%)]">
      <section className="app-shell py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1B4B58]">
              Perfil do paciente
            </p>
            <h1 className="mt-3 app-section-title">
              Complete seu cadastro MediNexus
            </h1>
            <p className="app-section-subtitle">
              Esses dados permitem buscar clÃ­nicas prÃ³ximas, validar planos e
              organizar sua ficha.
            </p>
          </div>

          <Link href="/dashboard" className="app-button-secondary text-center">
            Voltar ao dashboard
          </Link>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        {requiredMissing.length > 0 && (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <p className="font-bold">Cadastro incompleto</p>
            <p className="mt-1 text-sm">
              Campos pendentes: {requiredMissing.join(", ")}.
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="grid gap-6">
          <div className="app-card p-8">
            <h2 className="text-2xl font-black text-slate-950">
              Dados pessoais
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nome completo *
                </label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  CPF *
                </label>
                <input
                  name="cpf"
                  value={form.cpf}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Somente nÃºmeros"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  E-mail
                </label>
                <input
                  name="email"
                  value={form.email}
                  className="app-input bg-slate-100"
                  disabled
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Telefone / WhatsApp *
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Data de nascimento *
                </label>
                <input
                  type="date"
                  name="birth_date"
                  value={form.birth_date}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>
            </div>
          </div>

          <div className="app-card p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  EndereÃ§o e localizaÃ§Ã£o
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  O CEP preenche o endereÃ§o. Para busca por raio com precisÃ£o,
                  use a localizaÃ§Ã£o atual do dispositivo.
                </p>
              </div>

              {loadingCep && (
                <span className="rounded-full bg-sky-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-700 ring-1 ring-sky-200">
                  Buscando CEP...
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={capturingLocation}
                className="rounded-2xl border border-[#1B4B58]/20 bg-[#EAF1F0] px-5 py-3 text-sm font-bold text-[#1B4B58] transition hover:bg-[#DDEBE8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {capturingLocation
                  ? "Capturando localizaÃ§Ã£o..."
                  : "Usar minha localizaÃ§Ã£o atual"}
              </button>

              {deviceCoordinates.latitude && deviceCoordinates.longitude ? (
                <p className="text-sm font-semibold text-emerald-700">
                  LocalizaÃ§Ã£o precisa capturada.
                </p>
              ) : savedCoordinates.latitude && savedCoordinates.longitude ? (
                <p className="text-sm text-slate-500">
                  LocalizaÃ§Ã£o salva: {formatCoordinate(savedCoordinates.latitude)}
                  , {formatCoordinate(savedCoordinates.longitude)}
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  Nenhuma localizaÃ§Ã£o precisa salva ainda.
                </p>
              )}
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  CEP *
                </label>
                <input
                  name="address_zipcode"
                  value={form.address_zipcode}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Ex: 25000000"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Rua *
                </label>
                <input
                  name="address_street"
                  value={form.address_street}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  NÃºmero *
                </label>
                <input
                  name="address_number"
                  value={form.address_number}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Complemento
                </label>
                <input
                  name="address_complement"
                  value={form.address_complement}
                  onChange={handleChange}
                  className="app-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Bairro *
                </label>
                <input
                  name="address_neighborhood"
                  value={form.address_neighborhood}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Cidade *
                </label>
                <input
                  name="address_city"
                  value={form.address_city}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Estado *
                </label>
                <input
                  name="address_state"
                  value={form.address_state}
                  onChange={handleChange}
                  className="app-input"
                  maxLength={2}
                  placeholder="RJ"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  PaÃ­s
                </label>
                <input
                  name="address_country"
                  value={form.address_country}
                  onChange={handleChange}
                  className="app-input"
                />
              </div>
            </div>
          </div>

          <div className="app-card p-8">
            <h2 className="text-2xl font-black text-slate-950">
              Forma de atendimento
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => handlePaymentModeChange("health_plan")}
                className={`rounded-3xl border p-6 text-left transition ${
                  paymentMode === "health_plan"
                    ? "border-[#1B4B58] bg-[#EAF1F0] text-[#1B4B58]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <p className="text-lg font-black">Tenho plano de saÃºde</p>
                <p className="mt-2 text-sm">
                  Quero buscar clÃ­nicas e mÃ©dicos compatÃ­veis com meu convÃªnio.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handlePaymentModeChange("private")}
                className={`rounded-3xl border p-6 text-left transition ${
                  paymentMode === "private"
                    ? "border-[#594E86] bg-[#F4F1FB] text-[#594E86]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <p className="text-lg font-black">Consulta particular</p>
                <p className="mt-2 text-sm">
                  NÃ£o tenho plano ou prefiro receber opÃ§Ãµes de atendimento
                  particular.
                </p>
              </button>
            </div>
          </div>

          {paymentMode === "health_plan" && (
            <div className="app-card p-8">
              <h2 className="text-2xl font-black text-slate-950">
                Plano de saÃºde
              </h2>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Plano cadastrado na MediNexus
                  </label>
                  <select
                    name="default_health_plan_id"
                    value={form.default_health_plan_id}
                    onChange={handleChange}
                    className="app-input"
                  >
                    <option value="">NÃ£o selecionar</option>
                    {healthPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Operadora *
                  </label>
                  <input
                    name="health_plan_operator"
                    value={form.health_plan_operator}
                    onChange={handleChange}
                    className="app-input"
                    placeholder="Ex: Bradesco SaÃºde"
                    required={paymentMode === "health_plan"}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Modelo exato do plano *
                  </label>
                  <input
                    name="health_plan_product_name"
                    value={form.health_plan_product_name}
                    onChange={handleChange}
                    className="app-input"
                    placeholder="Ex: Top Quarto Rede Ideal I"
                    required={paymentMode === "health_plan"}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    NÃºmero da carteirinha *
                  </label>
                  <input
                    name="health_plan_card_number"
                    value={form.health_plan_card_number}
                    onChange={handleChange}
                    className="app-input"
                    required={paymentMode === "health_plan"}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    AcomodaÃ§Ã£o
                  </label>
                  <select
                    name="health_plan_accommodation"
                    value={form.health_plan_accommodation}
                    onChange={handleChange}
                    className="app-input"
                  >
                    <option value="">NÃ£o informado</option>
                    <option value="Enfermaria">Enfermaria</option>
                    <option value="Apartamento/Quarto">
                      Apartamento/Quarto
                    </option>
                    <option value="Sem internaÃ§Ã£o">Sem internaÃ§Ã£o</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Rede
                  </label>
                  <input
                    name="health_plan_network"
                    value={form.health_plan_network}
                    onChange={handleChange}
                    className="app-input"
                    placeholder="Ex: Rede Ideal, Nacional, Preferencial"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    SegmentaÃ§Ã£o
                  </label>
                  <select
                    name="health_plan_segment"
                    value={form.health_plan_segment}
                    onChange={handleChange}
                    className="app-input"
                  >
                    <option value="">NÃ£o informado</option>
                    <option value="Ambulatorial">Ambulatorial</option>
                    <option value="Hospitalar">Hospitalar</option>
                    <option value="Hospitalar com obstetrÃ­cia">
                      Hospitalar com obstetrÃ­cia
                    </option>
                    <option value="ReferÃªncia">ReferÃªncia</option>
                    <option value="OdontolÃ³gico">OdontolÃ³gico</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Complementos do plano
                  </label>
                  <textarea
                    name="health_plan_extra_info"
                    value={form.health_plan_extra_info}
                    onChange={handleChange}
                    className="app-textarea"
                    placeholder="Ex: coparticipaÃ§Ã£o, reembolso, restriÃ§Ãµes, observaÃ§Ãµes..."
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMode === "private" && (
            <div className="rounded-3xl border border-purple-200 bg-purple-50 p-6 text-purple-800">
              <p className="font-black">Atendimento particular selecionado</p>
              <p className="mt-2 text-sm leading-6">
                Os campos de plano de saÃºde nÃ£o serÃ£o exigidos. A busca poderÃ¡
                mostrar clÃ­nicas e mÃ©dicos que aceitam consulta particular.
              </p>
            </div>
          )}

          <div className="app-card p-8">
            <h2 className="text-2xl font-black text-slate-950">
              ObservaÃ§Ãµes e consentimento
            </h2>

            <div className="mt-6 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  ObservaÃ§Ãµes pessoais para atendimento
                </label>
                <textarea
                  name="patient_notes"
                  value={form.patient_notes}
                  onChange={handleChange}
                  className="app-textarea"
                  placeholder="Ex: preferÃªncia de horÃ¡rio, observaÃ§Ãµes de contato, necessidades especÃ­ficas..."
                />
              </div>

              <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <input
                  type="checkbox"
                  name="data_usage_consent"
                  checked={form.data_usage_consent}
                  onChange={handleChange}
                  className="mt-1"
                  required
                />
                <span>
                  <span className="block font-semibold text-slate-900">
                    Autorizo o uso dos meus dados para funcionamento da
                    MediNexus *
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    Os dados serÃ£o usados para busca de consultas,
                    compatibilidade com clÃ­nicas, documentos mÃ©dicos e
                    atendimento.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving || loadingCep || capturingLocation}
              className="app-button-primary"
            >
              {saving ? "Salvando..." : "Salvar perfil completo"}
            </button>

            <Link href="/dashboard" className="app-button-secondary text-center">
              Cancelar
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}


