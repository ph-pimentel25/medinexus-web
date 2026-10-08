"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Filter,
  Loader2,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getCurrentDoctor } from "../../lib/auth";

interface FinancialTransaction {
  id: string;
  date: string;
  patientName: string;
  type: "Particular" | "Convênio";
  methodOrOperator: string;
  mode: "Presencial" | "Telemedicina";
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  status: "liquidado" | "a_receber" | "cancelado";
}

type AppointmentRow = {
  id: string;
  status: string | null;
  patient_id: string | null;
  doctor_id: string | null;
  requested_start_at: string | null;
  confirmed_start_at: string | null;
  created_at: string | null;
  patient_name: string | null;
  patient_health_plan_operator: string | null;
  patient_health_plan_product_name: string | null;
  appointment_mode?: string | null;
};

export default function MedicoFinanceiroPage() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [filterType, setFilterType] = useState<"all" | "Particular" | "Convênio">("all");
  const [exportNotice, setExportNotice] = useState("");

  useEffect(() => {
    async function loadFinancialData() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setErrorMessage("Você precisa estar logado como médico para acessar o financeiro.");
          setLoading(false);
          return;
        }

        const { data: doctorData, error: doctorError } = await getCurrentDoctor();

        if (doctorError || !doctorData?.id) {
          setErrorMessage("Cadastro médico não localizado para o usuário logado.");
          setLoading(false);
          return;
        }

        // Carrega consultas do médico via RPC oficial
        const { data: appointmentsData, error: apptError } =
          await supabase.rpc("get_my_doctor_appointments");

        const rawAppointments: AppointmentRow[] = (appointmentsData || []) as AppointmentRow[];

        // Tenta buscar eventuais cotações / comprovantes de pagamento registrados
        const { data: quotesData } = await supabase
          .from("appointment_payment_quotes")
          .select("*")
          .eq("doctor_id", doctorData.id);

        const quotesMap = new Map<string, any>();
        if (quotesData && Array.isArray(quotesData)) {
          for (const q of quotesData) {
            if (q.appointment_id) quotesMap.set(q.appointment_id, q);
          }
        }

        const parsedTransactions: FinancialTransaction[] = rawAppointments.map((appt) => {
          const quote = quotesMap.get(appt.id);
          const isConvenio = Boolean(appt.patient_health_plan_operator);
          const dateStr = appt.confirmed_start_at || appt.requested_start_at || appt.created_at || "";
          const formattedDate = dateStr
            ? new Date(dateStr).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "Data não definida";

          const gross = quote?.gross_cents
            ? quote.gross_cents / 100
            : isConvenio
            ? 180.0
            : 300.0;

          const fee = 0; // 0% de comissão garantida pela MediNexus
          const net = gross - fee;

          let status: "liquidado" | "a_receber" | "cancelado" = "a_receber";
          if (appt.status === "completed" || quote?.status === "paid") {
            status = "liquidado";
          } else if (appt.status?.includes("cancel")) {
            status = "cancelado";
          }

          const mode: "Presencial" | "Telemedicina" =
            appt.appointment_mode === "telemedicine" ? "Telemedicina" : "Presencial";

          const operatorLabel = isConvenio
            ? `${appt.patient_health_plan_operator}${
                appt.patient_health_plan_product_name
                  ? ` (${appt.patient_health_plan_product_name})`
                  : ""
              }`
            : quote?.payment_method === "card"
            ? "Cartão de Crédito"
            : "PIX Direto";

          return {
            id: appt.id,
            date: formattedDate,
            patientName: appt.patient_name || "Paciente identificado",
            type: isConvenio ? "Convênio" : "Particular",
            methodOrOperator: operatorLabel,
            mode,
            grossAmount: gross,
            platformFee: fee,
            netAmount: net,
            status,
          };
        });

        setTransactions(parsedTransactions);
      } catch (err: any) {
        setErrorMessage(err?.message || "Não foi possível carregar os dados financeiros.");
      } finally {
        setLoading(false);
      }
    }

    void loadFinancialData();
  }, []);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType === "all") return true;
      return tx.type === filterType;
    });
  }, [transactions, filterType]);

  const totalParticular = useMemo(() => {
    return transactions
      .filter((t) => t.type === "Particular" && t.status !== "cancelado")
      .reduce((acc, cur) => acc + cur.grossAmount, 0);
  }, [transactions]);

  const totalConvenio = useMemo(() => {
    return transactions
      .filter((t) => t.type === "Convênio" && t.status !== "cancelado")
      .reduce((acc, cur) => acc + cur.grossAmount, 0);
  }, [transactions]);

  const totalGeral = totalParticular + totalConvenio;
  const validTransactionsCount = transactions.filter((t) => t.status !== "cancelado").length;
  const ticketMedio = validTransactionsCount > 0 ? Math.round(totalGeral / validTransactionsCount) : 0;

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      setExportNotice("Nenhum lançamento para exportar no filtro atual.");
      setTimeout(() => setExportNotice(""), 3500);
      return;
    }

    const headers = "Data,Paciente,Tipo,Metodo,Modalidade,Bruto,Taxa,Liquido,Status\n";
    const rows = filtered
      .map(
        (t) =>
          `"${t.date}","${t.patientName}","${t.type}","${t.methodOrOperator}","${t.mode}",${t.grossAmount},${t.platformFee},${t.netAmount},"${t.status}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extrato-medinexus-honorarios-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setExportNotice("Extrato CSV exportado com sucesso para conciliação contábil!");
    setTimeout(() => setExportNotice(""), 4000);
  };

  return (
    <main className="min-h-screen bg-mn-sand">
      {/* Top Banner */}
      <section className="border-b border-mn-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-mn-border bg-mn-sand px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-mn-teal">
              Gestão Financeira & Honorários
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Extrato de Honorários Médicos
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Acompanhe seu faturamento em atendimentos particulares e convênios credenciados, com 0% de comissão retida pela MediNexus.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-mn-teal px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123B46] active:scale-95 disabled:opacity-50"
            >
              <Download size={16} />
              <span>Exportar extrato (CSV)</span>
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {errorMessage && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {exportNotice && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {exportNotice}
          </div>
        )}

        {/* Banner de Compromisso 0% de comissão */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-mn-border bg-mn-sage-light/60 p-4 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="text-mn-teal shrink-0" size={18} />
            <span>
              <strong>Comissão MediNexus: 0%</strong> • 100% dos honorários de consultas particulares e convênios repassados integralmente ao médico sem retenções abusivas.
            </span>
          </div>
          <span className="self-start sm:self-auto rounded-full bg-white px-3 py-1 text-[11px] font-bold text-mn-teal border border-mn-border shrink-0">
            Repasse Integral
          </span>
        </div>

        {/* Cards de Métricas Financeiras */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Faturado no Período</span>
              <DollarSign className="text-emerald-600" size={18} />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {loading ? (
                <span className="text-slate-300">...</span>
              ) : (
                `R$ ${totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              )}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {validTransactionsCount} {validTransactionsCount === 1 ? "atendimento contabilizado" : "atendimentos contabilizados"}
            </p>
          </div>

          <div className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Particulares</span>
              <CreditCard className="text-mn-teal" size={18} />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-mn-teal">
              {loading ? (
                <span className="text-slate-300">...</span>
              ) : (
                `R$ ${totalParticular.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              )}
            </p>
            <p className="mt-1 text-xs text-slate-500">Pagamento direto via PIX / Cartão</p>
          </div>

          <div className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Convênios</span>
              <Building className="text-mn-purple" size={18} />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-mn-purple">
              {loading ? (
                <span className="text-slate-300">...</span>
              ) : (
                `R$ ${totalConvenio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              )}
            </p>
            <p className="mt-1 text-xs text-slate-500">Operadoras vinculadas</p>
          </div>

          <div className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Ticket Médio</span>
              <TrendingUp className="text-mn-sage" size={18} />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {loading ? (
                <span className="text-slate-300">...</span>
              ) : (
                `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              )}
            </p>
            <p className="mt-1 text-xs text-slate-500">Por consulta realizada</p>
          </div>
        </div>

        {/* Tabela / Extrato com Filtros */}
        <div className="rounded-3xl border border-mn-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-mn-border pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Histórico de Atendimentos & Repasses</h3>
              <p className="text-xs text-slate-500">Lançamentos reais vinculados aos agendamentos da sua conta médica.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                  filterType === "all" ? "bg-mn-teal text-white" : "bg-mn-sand text-slate-700 hover:bg-slate-200"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterType("Particular")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                  filterType === "Particular" ? "bg-mn-teal text-white" : "bg-mn-sand text-slate-700 hover:bg-slate-200"
                }`}
              >
                Particulares
              </button>
              <button
                type="button"
                onClick={() => setFilterType("Convênio")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                  filterType === "Convênio" ? "bg-mn-teal text-white" : "bg-mn-sand text-slate-700 hover:bg-slate-200"
                }`}
              >
                Convênios
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
              <Loader2 className="animate-spin text-mn-teal" size={32} />
              <p className="text-sm font-medium">Carregando extrato de honorários...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mn-sand text-mn-teal mb-4 border border-mn-border">
                <Inbox size={28} />
              </div>
              <h4 className="text-base font-bold text-slate-900">Nenhum lançamento financeiro registrado</h4>
              <p className="mt-1.5 max-w-md text-xs leading-5 text-slate-500">
                À medida que consultas forem agendadas e concluídas em sua agenda médica, os honorários e comprovantes de liquidação aparecerão aqui automaticamente, sem cobrança de comissões.
              </p>
              <Link
                href="/medico/agenda"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-mn-teal px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#123B46]"
              >
                Ver Agenda de Atendimentos
              </Link>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Data/Hora</th>
                    <th className="py-3 px-3">Paciente</th>
                    <th className="py-3 px-3">Tipo / Origem</th>
                    <th className="py-3 px-3">Modalidade</th>
                    <th className="py-3 px-3 text-right">Valor Bruto</th>
                    <th className="py-3 px-3 text-right">Taxa MediNexus</th>
                    <th className="py-3 px-3 text-right">Líquido a Receber</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-mn-sand/50 transition">
                      <td className="py-3.5 px-3 font-medium text-slate-600">{tx.date}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">{tx.patientName}</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            tx.type === "Particular"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-purple-50 text-mn-purple"
                          }`}
                        >
                          {tx.type} • {tx.methodOrOperator}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">{tx.mode}</td>
                      <td className="py-3.5 px-3 text-right font-medium text-slate-800">
                        R$ {tx.grossAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-emerald-600">
                        R$ 0,00 (0%)
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                        R$ {tx.netAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            tx.status === "liquidado"
                              ? "bg-emerald-100 text-emerald-800"
                              : tx.status === "cancelado"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {tx.status === "liquidado" ? (
                            <>
                              <CheckCircle2 size={11} /> Liquidado
                            </>
                          ) : tx.status === "cancelado" ? (
                            <>Cancelado</>
                          ) : (
                            <>
                              <Clock size={11} /> A receber
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
