"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "./alert";
import SpecialtyPicker from "./specialty-picker";
import AddressLookup from "./address-lookup";
import { supabase } from "../lib/supabase";
import { completeRegistration, type Registration } from "../lib/registration";
import { useAuth } from "./auth-provider";
import { getRoleDashboardPath } from "../lib/auth";

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

export default function RegistrationForm({ initialAccountType = "patient" }: { initialAccountType?: AccountType }) {
  const router = useRouter();
  const { access, refresh } = useAuth();
  const completing = !!access.userId;

  const [selectedType, setAccountType] = useState<AccountType>(initialAccountType);
  const accountType = completing && !access.id && access.role !== "public" ? access.role : selectedType;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("RJ");
  const [specialtyIds, setSpecialtyIds] = useState<string[]>([]);
  const [doctorBio, setDoctorBio] = useState("");

  const [clinicTradeName, setClinicTradeName] = useState("");
  const [clinicLegalName, setClinicLegalName] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicCity, setClinicCity] = useState("");
  const [clinicState, setClinicState] = useState("RJ");
  const [clinicNeighborhood, setClinicNeighborhood] = useState("");
  const [clinicDescription, setClinicDescription] = useState("");
  const [clinicStreet,setClinicStreet]=useState("");
  const [clinicNumber,setClinicNumber]=useState("");
  const [clinicZipcode,setClinicZipcode]=useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  function validateBaseFields() {
    if (!fullName.trim()) {
      return "Informe seu nome.";
    }

    if (!completing && !email.trim()) {
      return "Informe seu e-mail.";
    }

    if (!completing && password.length < 6) {
      return "A senha precisa ter pelo menos 6 caracteres.";
    }

    if (accountType === "doctor") {
      if (!crm.replace(/\D/g, "")) return "Informe seu CRM.";
      if (!crmState.trim()) return "Informe o estado do CRM.";
      if (!specialtyIds.length) return "Selecione pelo menos uma especialidade.";
    }

    if (accountType === "clinic") {
      if (!clinicTradeName.trim()) return "Informe o nome fantasia da clínica.";
      if (!clinicCity.trim()) return "Informe a cidade da clínica.";
      if (!clinicState.trim()) return "Informe o estado da clínica.";
    }

    return "";
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const validationError = validateBaseFields();
    if (validationError) { setMessage(validationError); setMessageType("error"); return; }
    setLoading(true);
    setMessage("");
    const registration: Registration = {
      version: 1, accountType, fullName, crm, crmState, doctorBio, specialtyIds,
      clinicTradeName, clinicLegalName, clinicPhone, clinicCity, clinicState,
      clinicNeighborhood, clinicDescription, clinicStreet, clinicNumber, clinicZipcode,
    };
    try {
      const current = await supabase.auth.getUser();
      let user = current.data.user;
      if (!user) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(), password,
          options: {
            emailRedirectTo: window.location.origin + "/login",
            data: {
              full_name: fullName.trim(),
              role: accountType === "clinic" ? "clinic_admin" : accountType,
              medinexus_registration: registration,
            },
          },
        });
        if (error) throw error;
        if (!data.session || !data.user) {
          setMessage("Confira seu e-mail para confirmar a conta. Depois, entre na plataforma para concluir o cadastro.");
          setMessageType("info");
          return;
        }
        user = data.user;
      }
      await completeRegistration(user, registration);
      const cleared = await supabase.auth.updateUser({ data: { medinexus_registration: null } });
      if (cleared.error) throw cleared.error;
      await refresh();
      router.replace(accountType==="doctor"?"/medico/perfil":getRoleDashboardPath(accountType));
      router.refresh();
    } catch (cause) {
      const detail = cause && typeof cause === "object" && "message" in cause ? String(cause.message) : "Falha de conexão.";
      setMessage("Não foi possível concluir o cadastro: " + detail + " Se a conta já foi criada, entre com seu e-mail e senha para continuar.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-mn-sand text-mn-graphite">
      <section className="relative min-h-[calc(100vh-104px)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(122,157,140,0.26),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(90,76,134,0.22),transparent_32%),linear-gradient(135deg,#FAF6F3_0%,#F5EEE9_55%,#EEF3EF_100%)]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-104px)] max-w-[1500px] items-center gap-14 px-6 py-16 sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-14">
          <div className="hidden lg:block">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-mn-border bg-white/65 px-4 py-2 shadow-[0_24px_90px_-65px_rgba(46,57,63,0.55)] backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-mn-sage" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-mn-teal">
                MediNexus
              </span>
            </div>

            <h1 className="max-w-5xl text-[4.4rem] font-semibold leading-[0.92] tracking-[-0.08em] text-mn-graphite">
              Comece sua jornada conectada.
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-9 text-mn-graphite/70">
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
                  className="flex max-w-xl items-center gap-4 rounded-2xl border border-mn-border bg-white/55 p-4 shadow-sm backdrop-blur"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mn-teal text-sm font-semibold text-white">
                    {index + 1}
                  </div>

                  <p className="text-sm font-medium text-mn-graphite">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[680px]">
            <div className="rounded-[2.8rem] border border-mn-border bg-white/72 p-4 shadow-[0_50px_140px_-80px_rgba(46,57,63,0.75)] backdrop-blur-2xl">
              <div className="rounded-[2.25rem] border border-mn-border bg-mn-sand/80 p-7 sm:p-9">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-mn-sage">
                    Cadastro
                  </p>

                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-mn-graphite">
                    Criar conta
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-mn-graphite/64">
                    Escolha seu perfil e preencha os dados para entrar na
                    plataforma MediNexus.
                  </p>
                </div>

                {message && (
                  <div className="mt-6">
                    <Alert variant={messageType}>{message}</Alert>
                  </div>
                )}

                {completing && <div className="mt-5 rounded-xl bg-mn-sage-light p-4 text-sm">Você está conectado como {access.email}. <button type="button" onClick={() => void supabase.auth.signOut()} className="font-semibold underline">Sair para criar outra conta</button></div>}
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {accountTypes.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setAccountType(item.value)}
                      className={`rounded-[1.35rem] border p-4 text-left transition ${
                        accountType === item.value
                          ? "border-mn-teal bg-mn-sage-light text-mn-teal"
                          : "border-mn-border bg-white text-mn-graphite hover:bg-white/80"
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
                    <label className="mb-2 block text-sm font-semibold text-mn-graphite">
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
                      className="w-full rounded-2xl border border-mn-border bg-white px-4 py-4 text-sm text-mn-graphite outline-none transition placeholder:text-mn-graphite/35 focus:border-mn-teal"
                    />
                  </div>

                  {!completing && <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-mn-graphite">
                        E-mail
                      </label>
                      <input
                        type="email" autoComplete="email" required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="voce@email.com"
                        className="w-full rounded-2xl border border-mn-border bg-white px-4 py-4 text-sm text-mn-graphite outline-none transition placeholder:text-mn-graphite/35 focus:border-mn-teal"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-mn-graphite">
                        Senha
                      </label>
                      <input
                        type="password" autoComplete="new-password" minLength={6} required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Mínimo de 6 caracteres"
                        className="w-full rounded-2xl border border-mn-border bg-white px-4 py-4 text-sm text-mn-graphite outline-none transition placeholder:text-mn-graphite/35 focus:border-mn-teal"
                      />
                    </div>
                  </div>}

                  {accountType === "doctor" && (
                    <div className="rounded-2xl border border-mn-border bg-white/70 p-5">
                      <p className="text-sm font-semibold text-mn-teal">
                        Dados profissionais
                      </p>

                      <div className="my-5"><SpecialtyPicker value={specialtyIds} onChange={setSpecialtyIds} /></div>
                      <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_120px]">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-mn-graphite">
                            CRM
                          </label>
                          <input
                            value={crm}
                            onChange={(event) => setCrm(event.target.value)}
                            placeholder="123456"
                            className="w-full rounded-2xl border border-mn-border bg-white px-4 py-4 text-sm text-mn-graphite outline-none transition placeholder:text-mn-graphite/35 focus:border-mn-teal"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-mn-graphite">
                            UF
                          </label>
                          <input
                            value={crmState}
                            maxLength={2}
                            onChange={(event) => setCrmState(event.target.value)}
                            placeholder="RJ"
                            className="w-full rounded-2xl border border-mn-border bg-white px-4 py-4 text-sm uppercase text-mn-graphite outline-none transition placeholder:text-mn-graphite/35 focus:border-mn-teal"
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold text-mn-graphite">
                          Bio profissional
                        </label>
                        <textarea
                          value={doctorBio}
                          onChange={(event) => setDoctorBio(event.target.value)}
                          placeholder="Ex.: Especialista em pediatria, atendimento humanizado..."
                          rows={4}
                          className="w-full resize-none rounded-2xl border border-mn-border bg-white px-4 py-4 text-sm leading-7 text-mn-graphite outline-none transition placeholder:text-mn-graphite/35 focus:border-mn-teal"
                        />
                      </div>
                    </div>
                  )}

                  {accountType === "clinic" && (
                    <div className="rounded-2xl border border-mn-border bg-white/70 p-5">
                      <p className="text-sm font-semibold text-mn-teal">
                        Dados da clínica
                      </p>

                      <div className="mt-4 grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-mn-graphite">
                            Nome fantasia
                          </label>
                          <input
                            value={clinicTradeName}
                            onChange={(event) =>
                              setClinicTradeName(event.target.value)
                            }
                            placeholder="Ex.: Clínica Vida"
                            className="w-full rounded-2xl border border-mn-border bg-white px-4 py-4 text-sm text-mn-graphite outline-none transition placeholder:text-mn-graphite/35 focus:border-mn-teal"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-mn-graphite">
                            Razão social
                          </label>
                          <input
                            value={clinicLegalName}
                            onChange={(event) =>
                              setClinicLegalName(event.target.value)
                            }
                            placeholder="Ex.: Clínica Vida LTDA"
                            className="w-full rounded-2xl border border-mn-border bg-white px-4 py-4 text-sm text-mn-graphite outline-none transition placeholder:text-mn-graphite/35 focus:border-mn-teal"
                          />
                        </div>
                      </div>

                      <div className="my-5"><AddressLookup onAddress={a => { setClinicCity(a.city); setClinicState(a.state); setClinicNeighborhood(a.neighborhood); setClinicStreet(a.street); setClinicNumber(a.number || ""); setClinicZipcode(a.zipcode); }} /></div>
                      <div className="my-4 grid gap-3 sm:grid-cols-[1fr_100px]"><label className="text-sm font-semibold">Logradouro<input className="mn-input mt-2" value={clinicStreet} onChange={e=>setClinicStreet(e.target.value)}/></label><label className="text-sm font-semibold">Número<input className="mn-input mt-2" value={clinicNumber} onChange={e=>setClinicNumber(e.target.value)}/></label></div>
                      <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_1fr_90px]">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-mn-graphite">
                            Telefone
                          </label>
                          <input
                            value={clinicPhone}
                            onChange={(event) => setClinicPhone(event.target.value)}
                            placeholder="(21) 99999-9999"
                            className="w-full rounded-2xl border border-mn-border bg-white px-4 py-4 text-sm text-mn-graphite outline-none transition placeholder:text-mn-graphite/35 focus:border-mn-teal"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-mn-graphite">
                            Cidade
                          </label>
                          <input
                            value={clinicCity}
                            onChange={(event) => setClinicCity(event.target.value)}
                            placeholder="Rio de Janeiro"
                            className="w-full rounded-2xl border border-mn-border bg-white px-4 py-4 text-sm text-mn-graphite outline-none transition placeholder:text-mn-graphite/35 focus:border-mn-teal"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-mn-graphite">
                            UF
                          </label>
                          <input
                            value={clinicState}
                            maxLength={2}
                            onChange={(event) =>
                              setClinicState(event.target.value)
                            }
                            placeholder="RJ"
                            className="w-full rounded-2xl border border-mn-border bg-white px-4 py-4 text-sm uppercase text-mn-graphite outline-none transition placeholder:text-mn-graphite/35 focus:border-mn-teal"
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold text-mn-graphite">
                          Bairro
                        </label>
                        <input
                          value={clinicNeighborhood}
                          onChange={(event) =>
                            setClinicNeighborhood(event.target.value)
                          }
                          placeholder="Centro"
                          className="w-full rounded-2xl border border-mn-border bg-white px-4 py-4 text-sm text-mn-graphite outline-none transition placeholder:text-mn-graphite/35 focus:border-mn-teal"
                        />
                      </div>

                      <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold text-mn-graphite">
                          Descrição
                        </label>
                        <textarea
                          value={clinicDescription}
                          onChange={(event) =>
                            setClinicDescription(event.target.value)
                          }
                          placeholder="Descreva a clínica, especialidades e estrutura."
                          rows={4}
                          className="w-full resize-none rounded-2xl border border-mn-border bg-white px-4 py-4 text-sm leading-7 text-mn-graphite outline-none transition placeholder:text-mn-graphite/35 focus:border-mn-teal"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 rounded-full bg-mn-teal px-8 py-4 text-sm font-semibold text-white shadow-[0_24px_80px_-42px_rgba(22,73,87,0.85)] transition hover:-translate-y-0.5 hover:bg-[#123B46] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Criando conta..." : "Criar conta"}
                  </button>
                </form>

                <div className="mt-7 border-t border-mn-border pt-6">
                  <p className="text-sm text-mn-graphite/64">
                    Já tem conta?{" "}
                    <Link
                      href="/login"
                      className="font-semibold text-mn-teal hover:underline"
                    >
                      Entrar
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 text-center text-xs leading-6 text-mn-graphite/45">
              Cadastro médico e clínica agora criam acesso completo na plataforma.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}