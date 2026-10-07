export interface FamilyDependent {
  id: string;
  name: string;
  relationship: "Filho(a)" | "Pai/Mãe" | "Cônjuge" | "Outro";
  birthDate: string;
  cpf?: string;
  healthPlan?: string;
}

const STORAGE_KEY = "medinexus_family_dependents";
const ACTIVE_KEY = "medinexus_active_dependent_id";

export const DEFAULT_DEPENDENTS: FamilyDependent[] = [
  {
    id: "dep-lucas",
    name: "Lucas Pimentel",
    relationship: "Filho(a)",
    birthDate: "2018-05-14",
    cpf: "045.***.***-12",
    healthPlan: "Unimed Pleno"
  },
  {
    id: "dep-maria",
    name: "Maria Helena Pimentel",
    relationship: "Pai/Mãe",
    birthDate: "1954-11-20",
    cpf: "189.***.***-34",
    healthPlan: "Bradesco Saúde Top"
  }
];

export function getFamilyDependents(): FamilyDependent[] {
  if (typeof window === "undefined") return DEFAULT_DEPENDENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEPENDENTS));
      return DEFAULT_DEPENDENTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DEPENDENTS;
  }
}

export function saveFamilyDependent(dependent: Omit<FamilyDependent, "id"> & { id?: string }): FamilyDependent {
  const list = getFamilyDependents();
  const id = dependent.id || `dep-${Date.now()}`;
  const record: FamilyDependent = { ...dependent, id };
  const existingIndex = list.findIndex(d => d.id === id);
  if (existingIndex >= 0) {
    list[existingIndex] = record;
  } else {
    list.push(record);
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  return record;
}

export function removeFamilyDependent(id: string): void {
  const list = getFamilyDependents().filter(d => d.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (getActiveDependentId() === id) {
      setActiveDependentId("self");
    }
  }
}

export function getActiveDependentId(): string {
  if (typeof window === "undefined") return "self";
  try {
    return localStorage.getItem(ACTIVE_KEY) || "self";
  } catch {
    return "self";
  }
}

export function setActiveDependentId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_KEY, id);
    window.dispatchEvent(new CustomEvent("medinexus:dependent_changed", { detail: { id } }));
  } catch {}
}
