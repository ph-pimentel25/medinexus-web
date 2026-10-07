"use client";

import { useEffect, useState } from "react";
import { User, UserPlus, Users, X, Baby, Heart } from "lucide-react";
import {
  FamilyDependent,
  getFamilyDependents,
  saveFamilyDependent,
  getActiveDependentId,
  setActiveDependentId,
} from "../lib/family-dependents";

interface FamilyProfileSwitcherProps {
  onSelectDependent?: (dependent: FamilyDependent | null) => void;
  className?: string;
}

export default function FamilyProfileSwitcher({
  onSelectDependent,
  className = "",
}: FamilyProfileSwitcherProps) {
  const [dependents, setDependents] = useState<FamilyDependent[]>([]);
  const [activeId, setActiveId] = useState<string>("self");
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<FamilyDependent["relationship"]>("Filho(a)");
  const [birthDate, setBirthDate] = useState("");
  const [cpf, setCpf] = useState("");
  const [healthPlan, setHealthPlan] = useState("");

  useEffect(() => {
    setDependents(getFamilyDependents());
    const initialId = getActiveDependentId();
    setActiveId(initialId);

    const handleChanged = (e: Event) => {
      const custom = e as CustomEvent<{ id: string }>;
      if (custom.detail?.id) {
        setActiveId(custom.detail.id);
      }
    };

    window.addEventListener("medinexus:dependent_changed", handleChanged);
    return () => window.removeEventListener("medinexus:dependent_changed", handleChanged);
  }, []);

  const handleSelect = (id: string) => {
    setActiveId(id);
    setActiveDependentId(id);
    if (onSelectDependent) {
      if (id === "self") {
        onSelectDependent(null);
      } else {
        const found = dependents.find((d) => d.id === id) || null;
        onSelectDependent(found);
      }
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created = saveFamilyDependent({
      name: name.trim(),
      relationship,
      birthDate,
      cpf: cpf.trim() || undefined,
      healthPlan: healthPlan.trim() || undefined,
    });

    setDependents(getFamilyDependents());
    setName("");
    setBirthDate("");
    setCpf("");
    setHealthPlan("");
    setModalOpen(false);
    handleSelect(created.id);
  };

  const activeDependent = dependents.find((d) => d.id === activeId);

  return (
    <div className={`rounded-2xl border border-mn-border bg-white p-4 shadow-sm ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-mn-sage-light text-mn-teal">
            <Users size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Gestão Familiar & Dependentes
            </h4>
            <p className="text-xs text-slate-600">
              {activeId === "self"
                ? "Visualizando sua própria conta (Titular)"
                : `Gerenciando prontuário de ${activeDependent?.name} (${activeDependent?.relationship})`}
            </p>
          </div>
        </div>

        {/* Pills row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelect("self")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeId === "self"
                ? "bg-mn-teal text-white shadow-sm"
                : "border border-mn-border bg-mn-sand text-slate-700 hover:bg-slate-100"
            }`}
          >
            <User size={13} />
            <span>Você (Titular)</span>
          </button>

          {dependents.map((dep) => {
            const isChild = dep.relationship === "Filho(a)";
            const isParent = dep.relationship === "Pai/Mãe";
            return (
              <button
                key={dep.id}
                type="button"
                onClick={() => handleSelect(dep.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  activeId === dep.id
                    ? "bg-mn-teal text-white shadow-sm"
                    : "border border-mn-border bg-mn-sand text-slate-700 hover:bg-slate-100"
                }`}
              >
                {isChild ? <Baby size={13} /> : isParent ? <Heart size={13} /> : <User size={13} />}
                <span>
                  {dep.name.split(" ")[0]} ({dep.relationship})
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 rounded-xl border border-dashed border-mn-teal/40 bg-mn-sage-light/40 px-2.5 py-1.5 text-xs font-medium text-mn-teal transition hover:bg-mn-sage-light"
          >
            <UserPlus size={13} />
            <span>+ Adicionar familiar</span>
          </button>
        </div>
      </div>

      {activeId !== "self" && activeDependent && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-mn-sand px-3 py-2 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Perfil ativo: <strong>{activeDependent.name}</strong> • Parentesco:{" "}
              <strong>{activeDependent.relationship}</strong> • Nasc: {activeDependent.birthDate}
              {activeDependent.healthPlan ? ` • Convênio: ${activeDependent.healthPlan}` : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleSelect("self")}
            className="font-semibold text-mn-teal underline hover:text-slate-900"
          >
            Voltar ao meu perfil
          </button>
        </div>
      )}

      {/* Modal Adicionar Dependente */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-mn-border bg-white p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-mn-border pb-4">
              <div className="flex items-center gap-2">
                <Users className="text-mn-teal" size={20} />
                <h3 className="text-lg font-bold text-slate-900">Cadastrar Familiar / Dependente</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Nome completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Lucas Henrique Pimentel"
                  className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Parentesco</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value as FamilyDependent["relationship"])}
                    className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                  >
                    <option value="Filho(a)">Filho(a)</option>
                    <option value="Pai/Mãe">Pai/Mãe</option>
                    <option value="Cônjuge">Cônjuge</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Data de Nascimento</label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">CPF (opcional)</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Plano de Saúde (opcional)</label>
                  <input
                    type="text"
                    value={healthPlan}
                    onChange={(e) => setHealthPlan(e.target.value)}
                    placeholder="Ex: Unimed, Bradesco..."
                    className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Você poderá alternar entre os prontuários a qualquer momento para acompanhar consultas, vacinas e remédios de forma organizada.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-mn-border px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-mn-teal px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#123B46]"
                >
                  Salvar familiar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
