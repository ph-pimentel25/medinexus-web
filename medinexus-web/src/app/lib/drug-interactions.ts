export type InteractionSeverity = "critica" | "alta" | "moderada";

export interface DrugInteraction {
  drugA: string;
  drugB: string;
  severity: InteractionSeverity;
  riskTitle: string;
  description: string;
  clinicalRecommendation: string;
}

export interface InteractionAlert {
  matchedDrugA: string;
  matchedDrugB: string;
  severity: InteractionSeverity;
  riskTitle: string;
  description: string;
  clinicalRecommendation: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

// Catálogo de regras clínicas validadas segundo literatura farmacológica
const INTERACTION_RULES: {
  groupA: string[];
  groupB: string[];
  severity: InteractionSeverity;
  riskTitle: string;
  description: string;
  clinicalRecommendation: string;
}[] = [
  {
    groupA: ["varfarina", "rivaroxabana", "apixabana", "dabigatrana", "aas", "aspirina", "clopidogrel", "anticoagulante", "anticoagulantes"],
    groupB: ["ibuprofeno", "cetoprofeno", "diclofenaco", "nimesulida", "naproxeno", "meloxicam", "piroxicam", "cetorolaco", "aines", "antiinflamatorio"],
    severity: "alta",
    riskTitle: "Hemorragia Gastrintestinal e Sangramento Sistêmico",
    description: "A associação de AINEs com anticoagulantes ou antiagregantes plaquetários inibe a hemostasia e lesiona a mucosa gástrica, elevando expressivamente o risco de sangramento fatal.",
    clinicalRecommendation: "Substituir o AINE por analgésico não anti-inflamatório (ex: Paracetamol ou Dipirona). Se indispensável, associar inibidor de bomba de prótons (IBP) e monitorar INR/plaquetas."
  },
  {
    groupA: ["losartana", "valsartana", "candesartana", "enalapril", "captopril", "ramipril"],
    groupB: ["espironolactona", "amilorida", "triantereno", "cloreto de potassio"],
    severity: "alta",
    riskTitle: "Hipercalemia Grave e Arritmias Ventriculares",
    description: "Bloqueadores do SRAA combinados com diuréticos poupadores de potássio ou suplementos retêm potássio nos túbulos renais, provocando hipercalemia aguda.",
    clinicalRecommendation: "Monitore os níveis séricos de potássio e creatinina em até 7 a 14 dias do início do tratamento. Oriente o paciente sobre sintomas de fraqueza muscular e palpitações."
  },
  {
    groupA: ["fluoxetina", "sertralina", "escitalopram", "citalopram", "paroxetina", "venlafaxina", "duloxetina"],
    groupB: ["tramadol", "fentanil", "selegilina", "rasagilina", "linezolida", "triptano", "sumatriptano"],
    severity: "critica",
    riskTitle: "Síndrome Serotoninérgica Potencialmente Fatal",
    description: "A coadministração de múltiplos agentes pró-serotoninérgicos pode deflagrar hipertermia, hiperreflexia, mioclonia, agitação e instabilidade autonômica aguda.",
    clinicalRecommendation: "Evite o uso concomitante. Para analgesia moderada a grave, considere alternativas não serotoninérgicas como Paracetamol com Codeína ou opioides com menor afinidade 5-HT sob vigilância."
  },
  {
    groupA: ["sinvastatina", "atorvastatina", "lovastatina"],
    groupB: ["azitromicina", "claritromicina", "eritromicina", "fluconazol", "itraconazol", "cetoconazol"],
    severity: "alta",
    riskTitle: "Miopatia Severa e Rabdomiólise por Inibição do CYP3A4",
    description: "Macrolídeos e antifúngicos azólicos inibem intensamente o citocromo P450 3A4, aumentando a concentração sérica da estatina em até 10 vezes.",
    clinicalRecommendation: "Suspender temporariamente a estatina durante o ciclo do antimicrobiano ou utilizar Rosuvastatina (não metabolizada predominantemente pelo CYP3A4)."
  },
  {
    groupA: ["ciprofloxacino", "levofloxacino", "moxifloxacino"],
    groupB: ["prednisona", "prednisolona", "dexametasona", "betametasona", "hidrocortisona"],
    severity: "alta",
    riskTitle: "Ruptura de Tendão (Especialmente Aquileu)",
    description: "A coadministração de fluoroquinolonas com corticosteroides sistêmicos multiplica por mais de 3x o risco de tendinite e ruptura tendínea aguda, especialmente em idosos.",
    clinicalRecommendation: "Considere antibiótico de classe alternativa (ex: Amoxicilina+Clavulanato ou Cefalosporina) caso o corticosteroide seja imprescindível."
  },
  {
    groupA: ["clonazepam", "diazepam", "alprazolam", "lorazepam", "zolpidem"],
    groupB: ["morfina", "codeina", "tramadol", "metadona", "oxicodona", "fentanil"],
    severity: "critica",
    riskTitle: "Depressão Respiratória Grave e Sedação Profunda",
    description: "Efeito sinérgico de depressores centrais (GABAérgicos e opioides) que pode resultar em insuficiência respiratória aguda, coma e óbito.",
    clinicalRecommendation: "Prescrever a menor dose eficaz com titulação cautelosa e orientar familiares quanto ao risco de sonolência excessiva e bradipneia. Evite duplicidade desnecessária."
  },
  {
    groupA: ["levotiroxina", "puran", "euthyrox"],
    groupB: ["carbonato de calcio", "calcio", "sulfato ferroso", "ferro", "omeprazol", "pantoprazol", "hidroxido de aluminio"],
    severity: "moderada",
    riskTitle: "Redução Substancial da Absorção de Hormônio Tireoidiano",
    description: "Cátions metálicos e inibidores de acidez gástrica formam complexos insolúveis ou reduzem a dissolução da levotiroxina, provocando descompensação do hipotireoidismo.",
    clinicalRecommendation: "Respeitar intervalo de pelo menos 4 horas entre a tomada de Levotiroxina (em jejum estrito) e os suplementos de cálcio, ferro ou antiácidos."
  },
  {
    groupA: ["metformina"],
    groupB: ["contraste iodado", "contraste"],
    severity: "alta",
    riskTitle: "Risco de Nefropatia Induzida por Contraste e Acidose Lática",
    description: "A deterioração transitória da função renal após contraste radiológico pode causar acúmulo tóxico de metformina e acidose lática.",
    clinicalRecommendation: "Suspender a metformina 48h antes de exames com contraste iodado intravascular em pacientes com TFG reduzida e reintroduzir 48h após conferência da função renal."
  }
];

export function checkDrugInteractions(
  newMedication: string,
  currentMedications: string[]
): InteractionAlert[] {
  if (!newMedication || !currentMedications.length) return [];

  const normNew = normalize(newMedication);
  if (!normNew) return [];

  const alerts: InteractionAlert[] = [];

  for (const currentMed of currentMedications) {
    const normCur = normalize(currentMed);
    if (!normCur || normCur === normNew) continue;

    for (const rule of INTERACTION_RULES) {
      const newInA = rule.groupA.some(a => normNew.includes(normalize(a)));
      const curInB = rule.groupB.some(b => normCur.includes(normalize(b)));

      const newInB = rule.groupB.some(b => normNew.includes(normalize(b)));
      const curInA = rule.groupA.some(a => normCur.includes(normalize(a)));

      if ((newInA && curInB) || (newInB && curInA)) {
        // Encontrou interação
        const matchedA = newInA ? newMedication : currentMed;
        const matchedB = newInA ? currentMed : newMedication;

        alerts.push({
          matchedDrugA: matchedA,
          matchedDrugB: matchedB,
          severity: rule.severity,
          riskTitle: rule.riskTitle,
          description: rule.description,
          clinicalRecommendation: rule.clinicalRecommendation
        });
      }
    }
  }

  return alerts;
}

export function checkAllInteractions(medications: string[]): InteractionAlert[] {
  const alerts: InteractionAlert[] = [];
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const results = checkDrugInteractions(medications[i], [medications[j]]);
      alerts.push(...results);
    }
  }
  return alerts;
}
