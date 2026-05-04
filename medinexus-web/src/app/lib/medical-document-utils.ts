export type GenericRow = Record<string, any>;

export type DetailSection = {
  title: string;
  value: string;
  priority?: number;
};

export function isPlainObject(value: unknown) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parsePossibleJson(value: unknown): unknown {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function humanizeValue(key: string, value: unknown) {
  const text = cleanText(value);

  if (!text) return "";

  const normalizedKey = key.toLowerCase();

  if (
    normalizedKey.includes("days_off") ||
    normalizedKey.includes("rest_days") ||
    normalizedKey.includes("leave_days") ||
    normalizedKey.includes("medical_leave_days")
  ) {
    const number = Number(text);
    if (!Number.isNaN(number)) {
      return number === 1 ? "1 dia" : `${number} dias`;
    }
  }

  const valueDictionary: Record<string, string> = {
    academic: "Acadêmica",
    academica: "Acadêmica",
    work: "Trabalho",
    professional: "Profissional",
    school: "Escolar",
    personal: "Pessoal",
    health: "Saúde",
    other: "Outra",
    true: "Sim",
    false: "Não",
  };

  return valueDictionary[text.toLowerCase()] || text;
}

export function labelizeKey(key: string) {
  const normalized = key.toLowerCase();

  const dictionary: Record<string, string> = {
    cid: "CID",
    cid10: "CID",
    cid_10: "CID",
    cid_code: "CID",
    icd: "CID",
    icd10: "CID",
    icd_10: "CID",
    icd_code: "CID",
    diagnosis_code: "CID",
    diagnosis_cid: "CID",
    diagnostic_cid: "CID",
    certificate_cid: "CID",
    medical_cid: "CID",

    diagnosis: "Diagnóstico",
    clinical_diagnosis: "Diagnóstico clínico",
    diagnostic_hypothesis: "Hipótese diagnóstica",

    rest_days: "Dias de afastamento",
    days: "Dias de afastamento",
    days_off: "Dias de afastamento",
    leave_days: "Dias de afastamento",
    medical_leave_days: "Dias de afastamento",

    rest_period: "Período de afastamento",
    leave_period: "Período de afastamento",
    period: "Período",

    rest_reason: "Motivo do afastamento",
    reason: "Motivo",
    certificate_reason: "Justificativa",
    justification: "Justificativa",

    purpose: "Finalidade",
    attendance_purpose: "Finalidade",
    document_purpose: "Finalidade",

    observations: "Observações",
    observation: "Observação",
    additional_notes: "Observações adicionais",
    remarks: "Observações",

    medications: "Medicações",
    medicine: "Medicação",
    medicine_text: "Prescrição",
    drug_prescription: "Prescrição medicamentosa",
    prescribed_medications: "Medicações prescritas",

    exams: "Exames",
    exam: "Exame",
    requested_exams: "Exames solicitados",
    exam_list: "Lista de exames",
    exam_description: "Descrição do exame",

    attendance: "Comparecimento",
    attendance_text: "Comparecimento",
    attendance_period: "Período de comparecimento",
    start_time: "Horário inicial",
    end_time: "Horário final",
    attendance_date: "Data de comparecimento",

    content: "Conteúdo",
    text: "Texto",
    description: "Descrição",
    notes: "Notas",
    instructions: "Orientações",
    prescription: "Prescrição",
    prescription_text: "Prescrição",
    exam_request: "Solicitação de exame",
    exam_requests: "Solicitação de exame",
    certificate_text: "Texto do atestado",
    declaration_text: "Texto da declaração",
    clinical_notes: "Notas clínicas",
    anamnesis: "Anamnese",
    base_anamnesis: "Anamnese",
  };

  if (dictionary[normalized]) return dictionary[normalized];

  return key
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";

  const parsed = parsePossibleJson(value);

  if (typeof parsed === "string") return parsed.trim();

  if (typeof parsed === "number" || typeof parsed === "boolean") {
    return String(parsed);
  }

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => cleanText(item))
      .filter(Boolean)
      .join("\n");
  }

  if (isPlainObject(parsed)) {
    const objectValue = parsed as Record<string, any>;

    return Object.entries(objectValue)
      .map(([key, item]) => {
        const text = humanizeValue(key, item);
        if (!text) return "";
        return `${labelizeKey(key)}: ${text}`;
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

export function valueOf(row: GenericRow | null, keys: string[]) {
  if (!row) return "";

  for (const key of keys) {
    const value = row[key];
    const text = humanizeValue(key, value);

    if (text) return text;
  }

  return "";
}

export function rawValueOf(row: GenericRow | null, keys: string[]) {
  if (!row) return null;

  for (const key of keys) {
    const value = row[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }

  return null;
}

export function getContentObject(document: GenericRow | null) {
  const raw = rawValueOf(document, [
    "content",
    "body",
    "data",
    "payload",
    "metadata",
    "document_data",
    "form_data",
    "fields",
  ]);

  return parsePossibleJson(raw);
}

export function normalizeKey(key: string) {
  return key
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

export function deepFind(source: unknown, keys: string[]): string {
  if (!source) return "";

  const parsed = parsePossibleJson(source);

  if (typeof parsed === "string") return "";

  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      const found = deepFind(item, keys);
      if (found) return found;
    }

    return "";
  }

  if (isPlainObject(parsed)) {
    const objectValue = parsed as Record<string, any>;

    for (const key of keys) {
      if (objectValue[key] !== null && objectValue[key] !== undefined) {
        const text = humanizeValue(key, objectValue[key]);
        if (text) return text;
      }
    }

    const normalizedTargets = keys.map(normalizeKey);

    for (const [currentKey, currentValue] of Object.entries(objectValue)) {
      const normalizedCurrentKey = normalizeKey(currentKey);

      const matches = normalizedTargets.some((target) => {
        if (!target) return false;
        return (
          normalizedCurrentKey === target ||
          normalizedCurrentKey.includes(target) ||
          target.includes(normalizedCurrentKey)
        );
      });

      if (matches) {
        const text = humanizeValue(currentKey, currentValue);
        if (text) return text;
      }
    }

    for (const value of Object.values(objectValue)) {
      const found = deepFind(value, keys);
      if (found) return found;
    }
  }

  return "";
}

export function deepFindByKeyIncludes(source: unknown, terms: string[]): string {
  if (!source) return "";

  const parsed = parsePossibleJson(source);

  if (typeof parsed === "string") return "";

  const normalizedTerms = terms.map(normalizeKey);

  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      const found = deepFindByKeyIncludes(item, terms);
      if (found) return found;
    }

    return "";
  }

  if (isPlainObject(parsed)) {
    const objectValue = parsed as Record<string, any>;

    for (const [key, value] of Object.entries(objectValue)) {
      const normalizedCurrentKey = normalizeKey(key);

      const matches = normalizedTerms.some((term) =>
        normalizedCurrentKey.includes(term)
      );

      if (matches) {
        const text = humanizeValue(key, value);
        if (text) return text;
      }
    }

    for (const value of Object.values(objectValue)) {
      const found = deepFindByKeyIncludes(value, terms);
      if (found) return found;
    }
  }

  return "";
}

export function getField(
  document: GenericRow | null,
  directKeys: string[],
  nestedKeys: string[]
) {
  return (
    valueOf(document, directKeys) ||
    deepFind(getContentObject(document), nestedKeys)
  );
}

export function formatDate(value?: string | null) {
  if (!value) return "Não informado";

  try {
    return new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Não informado";

  try {
    return new Date(value).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

export function getDocumentType(document: GenericRow | null) {
  const raw = valueOf(document, [
    "document_type",
    "kind",
    "category",
    "medical_document_type",
  ]).toLowerCase();

  const nestedRaw = deepFind(getContentObject(document), [
    "document_type",
    "type",
    "kind",
    "category",
  ]).toLowerCase();

  const finalRaw = raw || nestedRaw;

  if (finalRaw.includes("receita") || finalRaw.includes("prescription")) {
    return "Receita médica";
  }

  if (finalRaw.includes("exame") || finalRaw.includes("exam")) {
    return "Solicitação de exame";
  }

  if (finalRaw.includes("atestado") || finalRaw.includes("certificate")) {
    return "Atestado médico";
  }

  if (finalRaw.includes("declara") || finalRaw.includes("attendance")) {
    return "Declaração de comparecimento";
  }

  if (finalRaw.includes("anamnese") || finalRaw.includes("record")) {
    return "Ficha médica";
  }

  return "Documento médico";
}

export function getDocumentSubtitle(document: GenericRow | null) {
  const type = getDocumentType(document);

  if (type === "Receita médica") return "Prescrição emitida por profissional habilitado.";
  if (type === "Solicitação de exame") return "Pedido de exame complementar para investigação ou acompanhamento clínico.";
  if (type === "Atestado médico") return "Documento emitido para fins de comprovação médica.";
  if (type === "Declaração de comparecimento") return "Comprovação de presença em atendimento médico.";
  if (type === "Ficha médica") return "Registro clínico do atendimento e informações do paciente.";

  return "Documento emitido pela plataforma MediNexus.";
}

export function getPatientName(patient: GenericRow | null, document: GenericRow | null) {
  return (
    valueOf(patient, ["full_name", "name", "patient_name"]) ||
    valueOf(document, ["patient_name", "patient_full_name"]) ||
    deepFind(getContentObject(document), ["patient_name", "patientFullName", "full_name"]) ||
    "Paciente não informado"
  );
}

export function getPatientDocument(patient: GenericRow | null, document: GenericRow | null) {
  return (
    valueOf(patient, ["cpf", "document", "national_id"]) ||
    valueOf(document, ["patient_cpf", "patient_document"]) ||
    deepFind(getContentObject(document), ["patient_cpf", "cpf", "patient_document", "document"]) ||
    "Não informado"
  );
}

export function getPatientBirthDate(patient: GenericRow | null, document: GenericRow | null) {
  return (
    valueOf(patient, ["birth_date", "date_of_birth", "birthday"]) ||
    valueOf(document, ["patient_birth_date", "birth_date"]) ||
    deepFind(getContentObject(document), ["patient_birth_date", "birth_date", "birthday"])
  );
}

export function getPatientPhone(patient: GenericRow | null, document: GenericRow | null) {
  return (
    valueOf(patient, ["phone", "phone_number", "mobile"]) ||
    valueOf(document, ["patient_phone", "phone"]) ||
    deepFind(getContentObject(document), ["patient_phone", "phone", "mobile"])
  );
}

export function getDoctorName(doctor: GenericRow | null, document: GenericRow | null) {
  return (
    valueOf(doctor, ["name", "full_name", "doctor_name"]) ||
    valueOf(document, ["doctor_name", "professional_name"]) ||
    deepFind(getContentObject(document), ["doctor_name", "professional_name", "doctor"]) ||
    "Médico não informado"
  );
}

export function getDoctorCrm(doctor: GenericRow | null, document: GenericRow | null) {
  const crm =
    valueOf(doctor, ["crm"]) ||
    valueOf(document, ["doctor_crm", "crm"]) ||
    deepFind(getContentObject(document), ["doctor_crm", "crm"]);

  const uf =
    valueOf(doctor, ["crm_state", "state"]) ||
    valueOf(document, ["doctor_crm_state", "crm_state"]) ||
    deepFind(getContentObject(document), ["doctor_crm_state", "crm_state", "uf"]);

  if (!crm) return "CRM não informado";

  return `CRM ${crm}${uf ? ` / ${uf}` : ""}`;
}

export function getClinicName(clinic: GenericRow | null, document: GenericRow | null) {
  return (
    valueOf(clinic, ["trade_name", "legal_name", "name"]) ||
    valueOf(document, ["clinic_name"]) ||
    deepFind(getContentObject(document), ["clinic_name", "clinic"]) ||
    "MediNexus"
  );
}

export function getClinicLocation(clinic: GenericRow | null, document: GenericRow | null) {
  const city =
    valueOf(clinic, ["address_city", "city"]) ||
    valueOf(document, ["clinic_city"]) ||
    deepFind(getContentObject(document), ["clinic_city", "city"]);

  const state =
    valueOf(clinic, ["address_state", "state"]) ||
    valueOf(document, ["clinic_state"]) ||
    deepFind(getContentObject(document), ["clinic_state", "state"]);

  const neighborhood =
    valueOf(clinic, ["address_neighborhood"]) ||
    valueOf(document, ["clinic_neighborhood"]) ||
    deepFind(getContentObject(document), ["clinic_neighborhood", "neighborhood"]);

  const parts = [neighborhood, city, state].filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : "Local não informado";
}

export function getMainText(document: GenericRow | null) {
  const direct = getField(
    document,
    [
      "text",
      "description",
      "notes",
      "instructions",
      "prescription",
      "prescription_text",
      "exam_request",
      "exam_requests",
      "certificate_text",
      "declaration_text",
      "clinical_notes",
      "anamnesis",
      "base_anamnesis",
      "main_text",
      "content_text",
    ],
    [
      "text",
      "description",
      "notes",
      "instructions",
      "prescription",
      "prescription_text",
      "exam_request",
      "certificate_text",
      "declaration_text",
      "clinical_notes",
      "anamnesis",
      "base_anamnesis",
      "main_text",
      "content_text",
    ]
  );

  if (direct) return direct;

  const contentObject = getContentObject(document);

  if (isPlainObject(contentObject)) {
    const objectValue = contentObject as Record<string, any>;

    const mainCandidates = [
      objectValue.text,
      objectValue.description,
      objectValue.certificate_text,
      objectValue.declaration_text,
      objectValue.prescription_text,
      objectValue.exam_request,
      objectValue.notes,
      objectValue.instructions,
    ];

    for (const candidate of mainCandidates) {
      const text = cleanText(candidate);
      if (text) return text;
    }
  }

  return "";
}

export function getCid(document: GenericRow | null) {
  return (
    getField(
      document,
      [
        "cid",
        "cid10",
        "cid_10",
        "cid_code",
        "icd",
        "icd10",
        "icd_10",
        "icd_code",
        "diagnosis_code",
        "diagnosis_cid",
        "diagnostic_cid",
        "certificate_cid",
        "medical_cid",
      ],
      [
        "cid",
        "cid10",
        "cid_10",
        "cid_code",
        "icd",
        "icd10",
        "icd_10",
        "icd_code",
        "diagnosis_code",
        "diagnosis_cid",
        "diagnostic_cid",
        "certificate_cid",
        "medical_cid",
      ]
    ) ||
    deepFindByKeyIncludes(getContentObject(document), ["cid", "icd"])
  );
}

export function getDetailSections(document: GenericRow | null): DetailSection[] {
  const definitions = [
    {
      title: "CID / Classificação",
      value: getCid(document),
      priority: 1,
    },
    {
      title: "Diagnóstico / hipótese clínica",
      value: getField(
        document,
        ["diagnosis", "clinical_diagnosis", "diagnostic_hypothesis"],
        ["diagnosis", "clinical_diagnosis", "diagnostic_hypothesis"]
      ),
      priority: 2,
    },
    {
      title: "Dias de afastamento",
      value: getField(
        document,
        ["days_off", "rest_days", "days", "leave_days", "medical_leave_days"],
        ["days_off", "rest_days", "days", "leave_days", "medical_leave_days"]
      ),
      priority: 3,
    },
    {
      title: "Período de afastamento",
      value: getField(
        document,
        ["rest_period", "leave_period", "period"],
        ["rest_period", "leave_period", "period"]
      ),
      priority: 4,
    },
    {
      title: "Finalidade",
      value: getField(
        document,
        ["purpose", "attendance_purpose", "document_purpose"],
        ["purpose", "attendance_purpose", "document_purpose"]
      ),
      priority: 5,
    },
    {
      title: "Motivo / justificativa",
      value: getField(
        document,
        ["rest_reason", "reason", "certificate_reason", "justification"],
        ["rest_reason", "reason", "certificate_reason", "justification"]
      ),
      priority: 6,
    },
    {
      title: "Observações",
      value: getField(
        document,
        ["observations", "observation", "additional_notes", "remarks"],
        ["observations", "observation", "additional_notes", "remarks"]
      ),
      priority: 7,
    },
    {
      title: "Prescrição",
      value: getField(
        document,
        ["medications", "medicine", "medicine_text", "drug_prescription", "prescribed_medications"],
        ["medications", "medicine", "medicine_text", "drug_prescription", "prescribed_medications"]
      ),
      priority: 8,
    },
    {
      title: "Exames solicitados",
      value: getField(
        document,
        ["exams", "exam", "requested_exams", "exam_list", "exam_description"],
        ["exams", "exam", "requested_exams", "exam_list", "exam_description"]
      ),
      priority: 9,
    },
    {
      title: "Comparecimento",
      value: getField(
        document,
        ["attendance", "attendance_text", "attendance_period"],
        ["attendance", "attendance_text", "attendance_period"]
      ),
      priority: 10,
    },
  ];

  const sections = definitions
    .map((section) => ({
      title: section.title,
      value: section.value,
      priority: section.priority,
    }))
    .filter((section) => section.value);

  const knownTitles = new Set(sections.map((section) => section.title));
  const contentObject = getContentObject(document);

  if (isPlainObject(contentObject)) {
    const ignoredKeys = new Set([
      "id",
      "type",
      "kind",
      "status",
      "document_type",
      "patient_id",
      "doctor_id",
      "clinic_id",
      "created_at",
      "updated_at",
      "validation_token",
      "validation_enabled",
      "signature_status",
      "signature_provider",
      "signature_validation_url",
      "signed_pdf_url",
      "signed_at",
      "document_hash",
      "patient_name",
      "doctor_name",
      "clinic_name",
      "text",
      "description",
      "notes",
      "instructions",
      "main_text",
      "content_text",
      "certificate_text",
      "declaration_text",
      "prescription_text",
      "exam_request",
    ]);

    Object.entries(contentObject as Record<string, any>).forEach(([key, value]) => {
      if (ignoredKeys.has(key)) return;

      const label = labelizeKey(key);
      if (knownTitles.has(label)) return;

      const text = humanizeValue(key, value);
      if (!text) return;

      sections.push({
        title: label,
        value: text,
        priority: 99,
      });
    });
  }

  return sections.sort((a, b) => (a.priority || 99) - (b.priority || 99));
}

export function getIssuedAt(document: GenericRow | null) {
  return valueOf(document, ["issued_at", "created_at", "date", "document_date", "emitted_at"]);
}

export function getStatus(document: GenericRow | null) {
  const raw = valueOf(document, ["status"]);

  if (!raw) return "Emitido";

  const labels: Record<string, string> = {
    issued: "Emitido",
    emitted: "Emitido",
    active: "Ativo",
    released: "Liberado",
    draft: "Rascunho",
    cancelled: "Cancelado",
  };

  return labels[raw] || raw;
}

export function getSignatureStatusLabel(document: GenericRow | null) {
  const raw = valueOf(document, ["signature_status"]);

  const labels: Record<string, string> = {
    unsigned: "Validação MediNexus",
    pending: "Assinatura pendente",
    signed: "Assinado digitalmente",
    failed: "Falha na assinatura",
  };

  return labels[raw] || "Validação MediNexus";
}