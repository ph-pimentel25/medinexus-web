"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Plus, ExternalLink, Calendar, CheckCircle2, AlertTriangle, Syringe, Clock, X } from "lucide-react";
import { getActiveDependentId, getFamilyDependents } from "../lib/family-dependents";

export interface VaccineRecord {
  id: string;
  dependentId: string; // "self" or dependent id
  name: string;
  dose: string;
  appliedAt: string;
  lot?: string;
  location?: string;
  nextBooster?: string;
  status: "em_dia" | "reforco_pendente" | "proximo_vencimento";
}

const DEFAULT_VACCINES: VaccineRecord[] = [
  {
    id: "vac-1",
    dependentId: "self",
    name: "Gripe (Influenza Quadrivalente)",
    dose: "Dose Anual 2026",
    appliedAt: "2026-04-12",
    lot: "INF-883912",
    location: "UBS Vila Mariana / MediNexus Imunização",
    nextBooster: "2027-04-12",
    status: "em_dia"
  },
  {
    id: "vac-2",
    dependentId: "self",
    name: "Tétano e Difteria (dT adulto)",
    dose: "Reforço 10 anos",
    appliedAt: "2021-08-10",
    lot: "TET-40192",
    location: "Centro de Saúde Central",
    nextBooster: "2031-08-10",
    status: "em_dia"
  },
  {
    id: "vac-3",
    dependentId: "self",
    name: "Covid-19 (Bivalente Atualizada)",
    dose: "Dose de Reforço",
    appliedAt: "2025-06-18",
    lot: "COV-991204",
    location: "Clínica Integrada MediNexus",
    nextBooster: "2026-06-18",
    status: "reforco_pendente"
  },
  {
    id: "vac-4",
    dependentId: "self",
    name: "Hepatite B (Recombinante)",
    dose: "Esquema completo (3 doses)",
    appliedAt: "2018-03-15",
    lot: "HEP-2018-03",
    location: "Posto de Saúde Municipal",
    nextBooster: "Imunidade permanente",
    status: "em_dia"
  },
  {
    id: "vac-5",
    dependentId: "self",
    name: "Febre Amarela (Atenuada)",
    dose: "Dose Única (CIVP)",
    appliedAt: "2019-11-04",
    lot: "FA-77123",
    location: "Ambulatório de Medicina do Viajante",
    nextBooster: "Dose única para toda a vida",
    status: "em_dia"
  },
  {
    id: "vac-6",
    dependentId: "dep-lucas",
    name: "HPV Quadrivalente (Tipos 6, 11, 16 e 18)",
    dose: "1ª Dose",
    appliedAt: "2025-10-10",
    lot: "HPV-5521",
    location: "Clínica Pediátrica Parceira",
    nextBooster: "2026-04-10 (2ª dose)",
    status: "reforco_pendente"
  },
  {
    id: "vac-7",
    dependentId: "dep-maria",
    name: "Gripe (Influenza Idoso Alta Dosagem)",
    dose: "Dose Anual 2026",
    appliedAt: "2026-04-05",
    lot: "INF-SR-901",
    location: "UBS Central",
    nextBooster: "2027-04-05",
    status: "em_dia"
  }
];

const STORAGE_KEY = "medinexus_vaccine_records";

export default function VaccineWallet() {
  const [records, setRecords] = useState<VaccineRecord[]>([]);
  const [activeDependentId, setActiveDepId] = useState<string>("self");
  const [activeName, setActiveName] = useState<string>("Você");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [vacName, setVacName] = useState("");
  const [dose, setDose] = useState("Dose única");
  const [appliedAt, setAppliedAt] = useState(new Date().toISOString().split("T")[0]);
  const [lot, setLot] = useState("");
  const [location, setLocation] = useState("");
  const [nextBooster, setNextBooster] = useState("");

  const loadData = () => {
    const curDep = getActiveDependentId();
    setActiveDepId(curDep);
    if (curDep === "self") {
      setActiveName("Você");
    } else {
      const dependents = getFamilyDependents();
      const found = dependents.find(d => d.id === curDep);
      setActiveName(found ? found.name : "Familiar");
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecords(JSON.parse(stored));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_VACCINES));
        setRecords(DEFAULT_VACCINES);
      }
    } catch {
      setRecords(DEFAULT_VACCINES);
    }
  };

  useEffect(() => {
    loadData();

    const handleDepChange = (e: Event) => {
      const custom = e as CustomEvent<{ id: string }>;
      if (custom.detail?.id) {
        setActiveDepId(custom.detail.id);
        if (custom.detail.id === "self") {
          setActiveName("Você");
        } else {
          const dependents = getFamilyDependents();
          const found = dependents.find(d => d.id === custom.detail.id);
          setActiveName(found ? found.name : "Familiar");
        }
      }
    };

    window.addEventListener("medinexus:dependent_changed", handleDepChange);
    return () => window.removeEventListener("medinexus:dependent_changed", handleDepChange);
  }, []);

  const handleAddVaccine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacName.trim()) return;

    const newRecord: VaccineRecord = {
      id: `vac-${Date.now()}`,
      dependentId: activeDependentId,
      name: vacName.trim(),
      dose: dose.trim(),
      appliedAt,
      lot: lot.trim() || undefined,
      location: location.trim() || undefined,
      nextBooster: nextBooster.trim() || undefined,
      status: nextBooster ? "reforco_pendente" : "em_dia"
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    setVacName("");
    setLot("");
    setLocation("");
    setNextBooster("");
    setShowAddModal(false);
  };

  const patientVaccines = records.filter(r => r.dependentId === activeDependentId);

  return (
    <div className="space-y-6">
      {/* Banner Oficial Conexão Meu SUS Digital */}
      <div className="overflow-hidden rounded-3xl border border-mn-border bg-gradient-to-r from-[#0F3642] to-mn-teal p-6 text-white shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-200">
                <ShieldCheck size={14} /> Integração RNDS / SUS
              </span>
              <span className="text-xs text-emerald-100/70">Rede Nacional de Dados em Saúde</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">Carteira de Vacinação Digital</h3>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-200">
              Acompanhe doses aplicadas, histórico vacinal e receba lembretes automáticos de reforços anuais (Gripe, Covid-19, Tétano, HPV e Hepatite B).
              Sincronize ou importe seu registro oficial diretamente pelo portal gov.br.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://meususdigital.saude.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-mn-teal shadow transition hover:bg-mn-sand"
            >
              <span>Acessar Meu SUS Digital</span>
              <ExternalLink size={14} />
            </a>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-emerald-500"
            >
              <Plus size={15} />
              <span>Registrar dose</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de reforço preventivo */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900">
        <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={18} />
        <div>
          <strong className="block text-sm font-bold text-amber-950">Lembrete Preventivo: Campanha Anual de Imunização</strong>
          <p className="mt-1 leading-5">
            Reforço anual da vacina contra a Gripe (Influenza) e Covid-19 recomendado para proteção contínua.
            Para tétano (dT), mantenha o reforço atualizado a cada 10 anos.
          </p>
        </div>
      </div>

      {/* Grid de Vacinas */}
      <div className="grid gap-4 md:grid-cols-2">
        {patientVaccines.length === 0 ? (
          <div className="col-span-2 rounded-3xl border border-mn-border bg-white p-8 text-center text-slate-500 shadow-sm">
            <Syringe className="mx-auto mb-2 text-mn-teal opacity-60" size={32} />
            <h4 className="font-bold text-slate-800">Nenhuma vacina registrada para {activeName}</h4>
            <p className="mt-1 text-xs">Clique no botão &quot;Registrar dose&quot; acima para adicionar a primeira vacina.</p>
          </div>
        ) : (
          patientVaccines.map(vac => (
            <div
              key={vac.id}
              className="flex flex-col justify-between rounded-3xl border border-mn-border bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mn-sage-light text-mn-teal">
                      <Syringe size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{vac.name}</h4>
                      <p className="text-xs font-semibold text-mn-teal">{vac.dose}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      vac.status === "em_dia"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {vac.status === "em_dia" ? (
                      <>
                        <CheckCircle2 size={12} /> Em dia
                      </>
                    ) : (
                      <>
                        <Clock size={12} /> Reforço pendente
                      </>
                    )}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Data de aplicação:</span>
                    <strong className="text-slate-800">{new Date(vac.appliedAt).toLocaleDateString("pt-BR")}</strong>
                  </div>

                  {vac.lot && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Lote da vacina:</span>
                      <span className="font-mono text-slate-700">{vac.lot}</span>
                    </div>
                  )}

                  {vac.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Local de aplicação:</span>
                      <span className="text-slate-700 truncate max-w-[200px] text-right">{vac.location}</span>
                    </div>
                  )}

                  {vac.nextBooster && (
                    <div className="flex items-center justify-between pt-1 font-semibold text-mn-teal">
                      <span>Próximo reforço:</span>
                      <span>{vac.nextBooster}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Registrar Dose */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-mn-border bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-mn-border pb-4">
              <div className="flex items-center gap-2">
                <Syringe className="text-mn-teal" size={20} />
                <h3 className="text-lg font-bold text-slate-900">Registrar Dose de Vacina</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddVaccine} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Nome da Vacina</label>
                <input
                  type="text"
                  required
                  value={vacName}
                  onChange={e => setVacName(e.target.value)}
                  placeholder="Ex: Gripe (Influenza), Tétano (dT), Febre Amarela, HPV..."
                  className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Dose</label>
                  <select
                    value={dose}
                    onChange={e => setDose(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                  >
                    <option value="Dose única">Dose única</option>
                    <option value="1ª Dose">1ª Dose</option>
                    <option value="2ª Dose">2ª Dose</option>
                    <option value="3ª Dose">3ª Dose</option>
                    <option value="Reforço Anual">Reforço Anual</option>
                    <option value="Reforço 10 anos">Reforço 10 anos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Data da Aplicação</label>
                  <input
                    type="date"
                    required
                    value={appliedAt}
                    onChange={e => setAppliedAt(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Número do Lote</label>
                  <input
                    type="text"
                    value={lot}
                    onChange={e => setLot(e.target.value)}
                    placeholder="Ex: LOTE-8931"
                    className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Próximo Reforço (opcional)</label>
                  <input
                    type="text"
                    value={nextBooster}
                    onChange={e => setNextBooster(e.target.value)}
                    placeholder="Ex: Anual / 10 anos / Em 6 meses"
                    className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Unidade de Saúde ou Clínica</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Ex: UBS Central, Clínica MediNexus Imunização..."
                  className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-mn-border px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-mn-teal px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#123B46]"
                >
                  Salvar na Carteira
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
