"use client";

import { useState } from "react";
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
  ArrowUpRight,
  ShieldCheck,
  Filter,
} from "lucide-react";

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
  status: "liquidado" | "a_receber";
}

const MOCK_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: "tx-1",
    date: "2026-10-06 14:30",
    patientName: "Lucas Henrique Pimentel",
    type: "Particular",
    methodOrOperator: "PIX Direto",
    mode: "Presencial",
    grossAmount: 350,
    platformFee: 0,
    netAmount: 350,
    status: "liquidado",
  },
  {
    id: "tx-2",
    date: "2026-10-05 16:00",
    patientName: "Mariana Costa Silva",
    type: "Particular",
    methodOrOperator: "Cartão de Crédito (1x)",
    mode: "Telemedicina",
    grossAmount: 300,
    platformFee: 0,
    netAmount: 300,
    status: "liquidado",
  },
  {
    id: "tx-3",
    date: "2026-10-04 10:15",
    patientName: "Carlos Eduardo Rocha",
    type: "Convênio",
    methodOrOperator: "Bradesco Saúde Top",
    mode: "Presencial",
    grossAmount: 180,
    platformFee: 0,
    netAmount: 180,
    status: "liquidado",
  },
  {
    id: "tx-4",
    date: "2026-10-03 11:30",
    patientName: "Beatriz Almeida",
    type: "Convênio",
    methodOrOperator: "SulAmérica Especial",
    mode: "Presencial",
    grossAmount: 195,
    platformFee: 0,
    netAmount: 195,
    status: "liquidado",
  },
  {
    id: "tx-5",
    date: "2026-10-02 15:45",
    patientName: "Roberto Mendonça",
    type: "Particular",
    methodOrOperator: "PIX Direto",
    mode: "Telemedicina",
    grossAmount: 350,
    platformFee: 0,
    netAmount: 350,
    status: "liquidado",
  },
  {
    id: "tx-6",
    date: "2026-10-01 09:00",
    patientName: "Fernanda Guimarães",
    type: "Convênio",
    methodOrOperator: "Unimed Pleno",
    mode: "Presencial",
    grossAmount: 175,
    platformFee: 0,
    netAmount: 175,
    status: "a_receber",
  },
  {
    id: "tx-7",
    date: "2026-09-30 17:00",
    patientName: "Gabriel Vasconcelos",
    type: "Particular",
    methodOrOperator: "Cartão de Crédito",
    mode: "Presencial",
    grossAmount: 400,
    platformFee: 0,
    netAmount: 400,
    status: "liquidado",
  },
];

export default function MedicoFinanceiroPage() {
  const [filterType, setFilterType] = useState<"all" | "Particular" | "Convênio">("all");
  const [exportNotice, setExportNotice] = useState("");

  const filtered = MOCK_TRANSACTIONS.filter((tx) => {
    if (filterType === "all") return true;
    return tx.type === filterType;
  });

  const totalParticular = MOCK_TRANSACTIONS.filter((t) => t.type === "Particular").reduce(
    (acc, cur) => acc + cur.grossAmount,
    0
  );
  const totalConvenio = MOCK_TRANSACTIONS.filter((t) => t.type === "Convênio").reduce(
    (acc, cur) => acc + cur.grossAmount,
    0
  );
  const totalGeral = totalParticular + totalConvenio;
  const ticketMedio = Math.round(totalGeral / MOCK_TRANSACTIONS.length);

  const handleExportCsv = () => {
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
    setExportNotice("Extrato CSV exportado com sucesso para conciliação bancária!");
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
              Acompanhe seu faturamento mensal em consultas particulares e convênios credenciados, com 0% de comissão retida.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-2xl bg-mn-teal px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123B46]"
            >
              <Download size={16} />
              <span>Exportar extrato (CSV)</span>
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {exportNotice && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {exportNotice}
          </div>
        )}

        {/* Banner de Compromisso 0% de comissão */}
        <div className="flex items-center justify-between rounded-2xl border border-mn-border bg-mn-sage-light/60 p-4 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="text-mn-teal" size={18} />
            <span>
              <strong>Comissão MediNexus: 0%</strong> • 100% dos honorários de consultas particulares e convênios repassados integralmente ao médico.
            </span>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-mn-teal border border-mn-border">
            Chave PIX ativa
          </span>
        </div>

        {/* Cards de Métricas Financeiras */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Faturado no Mês</span>
              <DollarSign className="text-emerald-600" size={18} />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              R$ {totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-slate-500">Total de atendimentos liquidados</p>
          </div>

          <div className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Particulares (65%)</span>
              <CreditCard className="text-mn-teal" size={18} />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-mn-teal">
              R$ {totalParticular.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-slate-500">Pagamento direto via PIX / Cartão</p>
          </div>

          <div className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Convênios (35%)</span>
              <Building className="text-mn-purple" size={18} />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-mn-purple">
              R$ {totalConvenio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-slate-500">Operadoras parceiras cadastradas</p>
          </div>

          <div className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Ticket Médio</span>
              <TrendingUp className="text-mn-sage" size={18} />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              R$ {ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-slate-500">Por consulta realizada</p>
          </div>
        </div>

        {/* Tabela / Extrato com Filtros */}
        <div className="rounded-3xl border border-mn-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-mn-border pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Histórico de Atendimentos & Repasses</h3>
              <p className="text-xs text-slate-500">Listagem de lançamentos para conferência contábil e extrato de repasses.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  filterType === "all" ? "bg-mn-teal text-white" : "bg-mn-sand text-slate-700 hover:bg-slate-200"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterType("Particular")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  filterType === "Particular" ? "bg-mn-teal text-white" : "bg-mn-sand text-slate-700 hover:bg-slate-200"
                }`}
              >
                Particulares
              </button>
              <button
                type="button"
                onClick={() => setFilterType("Convênio")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  filterType === "Convênio" ? "bg-mn-teal text-white" : "bg-mn-sand text-slate-700 hover:bg-slate-200"
                }`}
              >
                Convênios
              </button>
            </div>
          </div>

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
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {tx.status === "liquidado" ? (
                          <>
                            <CheckCircle2 size={11} /> Liquidado
                          </>
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
        </div>
      </section>
    </main>
  );
}
