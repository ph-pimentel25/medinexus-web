"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type PackageRow = {
  id: string;
  target_type: "doctor" | "clinic";
  name: string;
  subtitle: string | null;
  monthly_price_cents: number;
  yearly_price_cents: number | null;
  max_doctors: number | null;
  max_appointments_per_month: number | null;
  has_public_page: boolean | null;
  has_documents: boolean | null;
  has_ai_features: boolean | null;
  has_priority_support: boolean | null;
  display_order: number | null;
};

function formatMoney(cents: number | null) {
  if (!cents) return "Sob consulta";

  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PacotesPage() {
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("medinexus_packages")
      .select(
        `
        id,
        target_type,
        name,
        subtitle,
        monthly_price_cents,
        yearly_price_cents,
        max_doctors,
        max_appointments_per_month,
        has_public_page,
        has_documents,
        has_ai_features,
        has_priority_support,
        display_order
      `
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      setMessage(`Erro ao carregar pacotes: ${error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    setPackages((data || []) as PackageRow[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="app-shell py-10">
          <p className="text-slate-600">Carregando pacotes...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#EAF1F0_0,#F8FAFC_34%,#FFFFFF_100%)]">
      <section className="app-shell py-12">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1B4B58]">
            Pacotes MediNexus
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Planos para médicos e clínicas crescerem com tecnologia
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Escolha o pacote ideal para gerenciar agenda, solicitações,
            documentos médicos, página pública e experiência digital do paciente.
          </p>
        </div>

        {message && (
          <div className="mx-auto mt-8 max-w-3xl">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {packages.map((item) => (
            <article
              key={item.id}
              className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)]"
            >
              <div className="mb-5 inline-flex rounded-full bg-[#EAF1F0] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1B4B58]">
                {item.target_type === "doctor" ? "Médico" : "Clínica"}
              </div>

              <h2 className="text-3xl font-black tracking-[-0.03em] text-slate-950">
                {item.name}
              </h2>

              <p className="mt-3 min-h-[56px] text-slate-600">
                {item.subtitle || "Pacote MediNexus"}
              </p>

              <div className="mt-6 rounded-[28px] bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-500">
                  Mensalidade
                </p>
                <p className="mt-2 text-4xl font-black text-[#1B4B58]">
                  {formatMoney(item.monthly_price_cents)}
                </p>
              </div>

              <div className="mt-6 grid gap-3 text-sm text-slate-700">
                <p>
                  <span className="font-bold">Médicos incluídos:</span>{" "}
                  {item.max_doctors || "Sob consulta"}
                </p>
                <p>
                  <span className="font-bold">Consultas/mês:</span>{" "}
                  {item.max_appointments_per_month || "Sob consulta"}
                </p>
                <p>
                  <span className="font-bold">Página pública:</span>{" "}
                  {item.has_public_page ? "Incluída" : "Não incluída"}
                </p>
                <p>
                  <span className="font-bold">Documentos médicos:</span>{" "}
                  {item.has_documents ? "Incluídos" : "Não incluídos"}
                </p>
                <p>
                  <span className="font-bold">Recursos de IA:</span>{" "}
                  {item.has_ai_features ? "Incluídos" : "Não incluídos"}
                </p>
                <p>
                  <span className="font-bold">Suporte prioritário:</span>{" "}
                  {item.has_priority_support ? "Incluído" : "Não incluído"}
                </p>
              </div>

              <div className="mt-8">
                <Link
                  href={
                    item.target_type === "clinic"
                      ? "/clinica/cadastro"
                      : "/medico/cadastro"
                  }
                  className="app-button-primary w-full text-center"
                >
                  Começar com este pacote
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}