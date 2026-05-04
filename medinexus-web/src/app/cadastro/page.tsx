"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type AccountType = "patient" | "doctor" | "clinic";

const accountTypes: {
  value: AccountType;
  title: string;
  description: string;
}[] = [
  {
    value: "patient",
    title: "Paciente",
    description: "Buscar atendimento, acompanhar consultas e acessar documentos.",
  },
  {
    value: "doctor",
    title: "Médico",
    description: "Criar seu cadastro profissional e acessar a área médica.",
  },
  {
    value: "clinic",
    title: "Clínica",
    description: "Cadastrar sua clínica e acessar a área administrativa.",
  },
];

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

export default function CadastroPage() {
  const router = useRouter();

  const [accountType, setAccountType] = useState<AccountType>("patient");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("RJ");
  const [doctorBio, setDoctorBio] = useState("");

  const [clinicTradeName, setClinicTradeName] = useState("");
  const [clinicLegalName, setClinicLegalName] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicCity, setClinicCity] = useState("");
  const [clinicState, setClinicState] = useState("RJ");
  const [clinicNeighborhood, setClinicNeighborhood] = useState("");
  const [clinicDescription, setClinicDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  function validateBaseFields() {
    if (!fullName.trim()) {
      return "Informe seu nome.";
    }

    if (!email.trim()) {
      return "Informe seu e-mail.";
    }

    if (password.length < 6) {
      return "A senha precisa ter pelo menos 6 caracteres.";
    }

    if (accountType === "doctor") {
      if (!crm.trim()) return "Informe seu CRM.";
      if (!crmState.trim()) return "Informe o estado do CRM.";
    }

    if (accountType === "clinic") {
      if (!clinicTradeName.trim()) return "Informe o nome fantasia da clínica.";
      if (!clinicCity.trim()) return "Informe a cidade da clínica.";
      if (!clinicState.trim()) return "Informe o estado da clínica.";
    }

    return "";
  }

  async function createPatientProfile(userId: string) {
    return supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName.trim(),
    });
  }

  async function createDoctorProfile(userId: string) {
    await createPatientProfile(userId);

    return supabase.from("doctors").insert({
      user_id: userId,
      name: fullName.trim(),
      crm: onlyNumbers(crm),
      crm_state: crmState.trim().toUpperCase(),
      bio:
        doctorBio.trim() ||
        "Profissional cadastrado na plataforma MediNexus.",
      is_active: true,
    });
  }

  async function createClinicProfile(userId: string) {
    await createPatientProfile(userId);

    const { data: clinicData, error: clinicError } = await supabase
      .from("clinics")
      .insert({
        trade_name: clinicTradeName.trim(),
        legal_name: clinicLegalName.trim() || clinicTradeName.trim(),
        phone: clinicPhone.trim() || null,
        email: email.trim(),
        description:
          clinicDescription.trim() ||
          "Clínica cadastrada na plataforma MediNexus.",
        city: clinicCity.trim(),
        state: clinicState.trim().toUpperCase(),
        address_city: clinicCity.trim(),
        address_state: clinicState.trim().toUpperCase(),
        address_neighborhood: clinicNeighborhood.trim() || null,
        is_active: true,
      })
      .select("id")
      .single();

    if (clinicError) {
      return { error: clinicError };
    }

    const clinicId = clinicData?.id;

    if (!clinicId) {
      return {
        error: {
          message: "Clínica criada, mas não foi possível recuperar o ID.",
        },
      };
    }

    const { error: memberError } = await supabase
      .from("clinic_members")
      .insert({
        clinic_id: clinicId,
        user_id: userId,
        role: "owner",
      });

    if (memberError) {
      return { error: memberError };
    }

    return { error: null };
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateBaseFields();

    if (validationError) {
      setMessage(validationError);
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(`Erro ao criar conta: ${error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setMessage(
        "Conta criada. Verifique seu e-mail para confirmar o cadastro e depois faça login."
      );
      setMessageType("success");
      setLoading(false);
      return;
    }

    if (accountType === "patient") {
      const { error: profileError } = await createPatientProfile(userId);

      if (profileError) {
        setMessage(`Conta criada, mas houve erro no perfil: ${profileError.message}`);
        setMessageType("error");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
      return;
    }

    if (accountType === "doctor") {
      const { error: doctorError } = await createDoctorProfile(userId);

      if (doctorError) {
        setMessage(`Conta criada, mas houve erro no cadastro médico: ${doctorError.message}`);
        setMessageType("error");
        setLoading(false);
        return;
      }

      router.push("/medico/dashboard");
      router.refresh();
      return;
    }

    if (accountType === "clinic") {
      const { error: clinicError } = await createClinicProfile(userId);

      if (clinicError) {
        setMessage(`Conta criada, mas houve erro no cadastro da clínica: ${clinicError.message}`);
        setMessageType("error");
        setLoading(false);
        return;
      }

      router.push("/clinica/dashboard");
      router.refresh();
      return;
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#FAF6F3] text-[#2E393F]">
      <section className="relative min-h-[calc(100vh-104px)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(122,157,140,0.26),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(90,76,134,0.22),transparent_32%),linear-gradient(135deg,#FAF6F3_0%,#F5EEE9_55%,#EEF3EF_100%)]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-104px)] max-w-[1500px] items-center gap-14 px-6 py-16 sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-14">
          <div className="hidden lg:block">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-[#D8CCC5] bg-white/65 px-4 py-2 shadow-[0_24px_90px_-65px_rgba(46,57,63,0.55)] backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-[#7A9D8C]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#164957]">
                MediNexus
              </span>
            </div>

            <h1 className="max-w-5xl text-[4.4rem] font-semibold leading-[0.92] tracking-[-0.08em] text-[#2E393F]">
              Comece sua jornada conectada.
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-9 text-[#2E393F]/70">
              Crie sua conta para acessar consultas, documentos, notificações e
              uma experiência de saúde mais organizada.
            </p>

            <div className="mt-14 space-y-4">
              {[
                "Busca de profissionais e clínicas",
                "Solicitações e confirmações de consulta",
                "Documentos médicos acessíveis",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex max-w-xl items-center gap-4 rounded-[1.6rem] border border-[#E7DDD7] bg-white/55 p-4 shadow-sm backdrop-blur"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#164957] text-sm font-semibold text-white">
                    {index + 1}
                  </div>

                  <p className="text-sm font-medium text-[#2E393F]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[680px]">
            <div className="rounded-[2.8rem] border border-[#E7DDD7] bg-white/72 p-4 shadow-[0_50px_140px_-80px_rgba(46,57,63,0.75)] backdrop-blur-2xl">
              <div className="rounded-[2.25rem] border border-[#E7DDD7] bg-[#FAF6F3]/80 p-7 sm:p-9">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7A9D8C]">
                    Cadastro
                  </p>

                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-[#2E393F]">
                    Criar conta
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-[#2E393F]/64">
                    Escolha seu perfil e preencha os dados para entrar na
                    plataforma MediNexus.
                  </p>
                </div>

                {message && (
                  <div className="mt-6">
                    <Alert variant={messageType}>{message}</Alert>
                  </div>
                )}

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {accountTypes.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setAccountType(item.value)}
                      className={`rounded-[1.35rem] border p-4 text-left transition ${
                        accountType === item.value
                          ? "border-[#164957] bg-[#EEF3EF] text-[#164957]"
                          : "border-[#D8CCC5] bg-white text-[#2E393F] hover:bg-white/80"
                      }`}
                    >
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-2 text-xs leading-5 opacity-70">
                        {item.description}
                      </p>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleRegister} className="mt-7 grid gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                      Nome completo
                    </label>
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder={
                        accountType === "clinic"
                          ? "Nome do responsável"
                          : "Seu nome"
                      }
                      className="w-full rounded-2xl border border-[#D8CCC5] bg-white px-4 py-4 text-sm text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/35 focus:border-[#164957]"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="voce@email.com"
                        className="w-full rounded-2xl border border-[#D8CCC5] bg-white px-4 py-4 text-sm text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/35 focus:border-[#164957]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                        Senha
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Mínimo de 6 caracteres"
                        className="w-full rounded-2xl border border-[#D8CCC5] bg-white px-4 py-4 text-sm text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/35 focus:border-[#164957]"
                      />
                    </div>
                  </div>

                  {accountType === "doctor" && (
                    <div className="rounded-[1.8rem] border border-[#E7DDD7] bg-white/70 p-5">
                      <p className="text-sm font-semibold text-[#164957]">
                        Dados profissionais
                      </p>

                      <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_120px]">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                            CRM
                          </label>
                          <input
                            value={crm}
                            onChange={(event) => setCrm(event.target.value)}
                            placeholder="123456"
                            className="w-full rounded-2xl border border-[#D8CCC5] bg-white px-4 py-4 text-sm text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/35 focus:border-[#164957]"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                            UF
                          </label>
                          <input
                            value={crmState}
                            maxLength={2}
                            onChange={(event) => setCrmState(event.target.value)}
                            placeholder="RJ"
                            className="w-full rounded-2xl border border-[#D8CCC5] bg-white px-4 py-4 text-sm uppercase text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/35 focus:border-[#164957]"
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                          Bio profissional
                        </label>
                        <textarea
                          value={doctorBio}
                          onChange={(event) => setDoctorBio(event.target.value)}
                          placeholder="Ex.: Especialista em pediatria, atendimento humanizado..."
                          rows={4}
                          className="w-full resize-none rounded-2xl border border-[#D8CCC5] bg-white px-4 py-4 text-sm leading-7 text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/35 focus:border-[#164957]"
                        />
                      </div>
                    </div>
                  )}

                  {accountType === "clinic" && (
                    <div className="rounded-[1.8rem] border border-[#E7DDD7] bg-white/70 p-5">
                      <p className="text-sm font-semibold text-[#164957]">
                        Dados da clínica
                      </p>

                      <div className="mt-4 grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                            Nome fantasia
                          </label>
                          <input
                            value={clinicTradeName}
                            onChange={(event) =>
                              setClinicTradeName(event.target.value)
                            }
                            placeholder="Ex.: Clínica Vida"
                            className="w-full rounded-2xl border border-[#D8CCC5] bg-white px-4 py-4 text-sm text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/35 focus:border-[#164957]"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                            Razão social
                          </label>
                          <input
                            value={clinicLegalName}
                            onChange={(event) =>
                              setClinicLegalName(event.target.value)
                            }
                            placeholder="Ex.: Clínica Vida LTDA"
                            className="w-full rounded-2xl border border-[#D8CCC5] bg-white px-4 py-4 text-sm text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/35 focus:border-[#164957]"
                          />
                        </div>
                      </div>

                      <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_1fr_90px]">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                            Telefone
                          </label>
                          <input
                            value={clinicPhone}
                            onChange={(event) => setClinicPhone(event.target.value)}
                            placeholder="(21) 99999-9999"
                            className="w-full rounded-2xl border border-[#D8CCC5] bg-white px-4 py-4 text-sm text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/35 focus:border-[#164957]"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                            Cidade
                          </label>
                          <input
                            value={clinicCity}
                            onChange={(event) => setClinicCity(event.target.value)}
                            placeholder="Rio de Janeiro"
                            className="w-full rounded-2xl border border-[#D8CCC5] bg-white px-4 py-4 text-sm text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/35 focus:border-[#164957]"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                            UF
                          </label>
                          <input
                            value={clinicState}
                            maxLength={2}
                            onChange={(event) =>
                              setClinicState(event.target.value)
                            }
                            placeholder="RJ"
                            className="w-full rounded-2xl border border-[#D8CCC5] bg-white px-4 py-4 text-sm uppercase text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/35 focus:border-[#164957]"
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                          Bairro
                        </label>
                        <input
                          value={clinicNeighborhood}
                          onChange={(event) =>
                            setClinicNeighborhood(event.target.value)
                          }
                          placeholder="Centro"
                          className="w-full rounded-2xl border border-[#D8CCC5] bg-white px-4 py-4 text-sm text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/35 focus:border-[#164957]"
                        />
                      </div>

                      <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                          Descrição
                        </label>
                        <textarea
                          value={clinicDescription}
                          onChange={(event) =>
                            setClinicDescription(event.target.value)
                          }
                          placeholder="Descreva a clínica, especialidades e estrutura."
                          rows={4}
                          className="w-full resize-none rounded-2xl border border-[#D8CCC5] bg-white px-4 py-4 text-sm leading-7 text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/35 focus:border-[#164957]"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 rounded-full bg-[#164957] px-8 py-4 text-sm font-semibold text-white shadow-[0_24px_80px_-42px_rgba(22,73,87,0.85)] transition hover:-translate-y-0.5 hover:bg-[#123B46] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Criando conta..." : "Criar conta"}
                  </button>
                </form>

                <div className="mt-7 border-t border-[#E7DDD7] pt-6">
                  <p className="text-sm text-[#2E393F]/64">
                    Já tem conta?{" "}
                    <Link
                      href="/login"
                      className="font-semibold text-[#164957] hover:underline"
                    >
                      Entrar
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 text-center text-xs leading-6 text-[#2E393F]/45">
              Cadastro médico e clínica agora criam acesso completo na plataforma.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}