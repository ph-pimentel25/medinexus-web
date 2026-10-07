export interface AnamnesisTemplate {
  id: string;
  specialty: string;
  label: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export const ANAMNESIS_TEMPLATES: AnamnesisTemplate[] = [
  {
    id: "cardiologia",
    specialty: "Cardiologia",
    label: "Cardiologia (Avaliação Cardiovascular Completa)",
    subjective: "Queixa principal: Dor torácica / Palpitações / Dispneia aos esforços.\nHMA: Paciente refere início dos sintomas há [X] semanas, piora ao esforço físico e alívio com repouso. Nega síncope ou ortopneia.\nClasse Funcional NYHA: Classe I (sem limitação) / Classe II (leve limitação a esforços ordinários).\nFatores de risco cardiovascular: Hipertensão arterial sistêmica, Diabetes Mellitus tipo 2, Tabagismo (negado/ativo), Dislipidemia, Histórico familiar precoce de DAC em parente de 1º grau.",
    objective: "Exame Físico Cardiovascular:\n- PA: 120x80 mmHg (MSD, sentado) | FC: 72 bpm | SatO2: 98% em ar ambiente.\n- Ictus cordis no 5º EIC na LHC, sem desvios.\n- Ausculta Cardíaca: Ritmo cardíaco regular em 2 tempos, bulhas normofonéticas (B1 e B2 presentes), sem sopros audíveis ou extrassístoles.\n- Ausculta Pulmonar: Murmúrio vesicular universalmente audível, sem ruídos adventícios.\n- Pulsos periféricos amplos e simétricos (+4/+4). Sem estase jugular a 45º. Sem edema em membros inferiores (cacifo negativo).",
    assessment: "1. Doença Arterial Coronariana estável / Síndrome Metabólica em investigação.\n2. Risco Cardiovascular Global (Framingham/Diretriz SBC): Risco Moderado.\n3. HAS controlada em monoterapia.",
    plan: "1. Solicitação de Eletrocardiograma de repouso (ECG) e Teste Ergométrico / Ecocardiograma com Doppler.\n2. Perfil lipídico completo, glicemia de jejum, HbA1c, creatinina sérica e microalbuminúria.\n3. Manter Losartana 50mg 1x/dia pela manhã.\n4. Prescrever AAS 100mg/dia e Atorvastatina 20mg à noite se indicado.\n5. Orientações sobre dieta hipossódica DASH e atividade física aeróbica 150 min/semana. Retorno em 30 dias com exames."
  },
  {
    id: "dermatologia",
    specialty: "Dermatologia",
    label: "Dermatologia (Exame Cutâneo & Lesões Elementares)",
    subjective: "Queixa principal: Lesão cutânea pigmentada / Prurido / Dermatite.\nHMA: Paciente relata aparecimento de lesão há [X] meses, com alteração gradual de cor/tamanho. Refere exposição solar frequente na infância com queimaduras de 2º grau. Nega histórico familiar de melanoma.\nFototipo Fitzpatrick: Fototipo III (moreno claro, queima moderadamente, bronzeia gradualmente).",
    objective: "Exame Dermatológico:\n- Inspeção geral: Pele e mucosas normocoradas.\n- Lesão em estudo: Localizada em dorso superior / região escapular direita.\n- Características elementares: Mácula pigmentada de 6mm, bordas discretamente irregulares, coloração castanho-clara com áreas acastanhadas mais escuras. Ausência de ulceração ou sangramento ativo.\n- Dermatoscopia Digital: Rede pigmentar atípica leve, estrias ausentes, véu azul-esbranquiçado ausente. Critérios ABCDE: A (leve assimetria), B (bordas discretamente chanfradas), C (2 cores), D (6mm), E (estável segundo relato).\n- Demais nevos corporais: Padrão homogêneo habitual sem atipias suspeitas.",
    assessment: "1. Nevo melanocítico atípico (displásico) em dorso.\n2. Fotoenvelhecimento cutâneo leve (escala Glogau II).",
    plan: "1. Biópsia excisional por fuso simples com margem de segurança de 2mm para estudo anatomopatológico.\n2. Orientações intensivas sobre fotoproteção diária (FPS 50+ amplo espectro, reaplicação a cada 3h).\n3. Retorno em 15 dias para retirada de pontos e revisão do laudo histopatológico."
  },
  {
    id: "ortopedia",
    specialty: "Ortopedia",
    label: "Ortopedia (Avaliação Musculoesquelética & Articular)",
    subjective: "Queixa principal: Dor em joelho direito / Lombalgia / Dor em ombro.\nHMA: Dor de caráter mecânico há [X] meses, pior ao final do dia e após caminhadas prolongadas. Relata sensação de travamento ou estalido articular ocasional. Nega trauma agudo recente, febre ou perda ponderal.\nEscala Visual Analógica de Dor (EVA): 6/10 em atividade física, 2/10 em repouso.",
    objective: "Exame Físico Ortopédico (Membro Inferior Direito - Joelho):\n- Inspeção estática e dinâmica: Alinhamento femorotibial em discreto varismo fisiológico. Sem atrofia evidente de quadríceps. Marcha antálgica leve.\n- Palpação: Dor à palpação da interlinha articular medial. Sem aumento de temperatura local. Sem derrame articular palpável (teste da tecla/choque patelar negativo).\n- Amplitude de Movimento (ADM): Flexão 125º ativa, extensão completa 0º.\n- Manobras especiais:\n  * Teste de McMurray: Positivo para menisco medial (desencadeia estalido doloroso).\n  * Teste de Lachman: Negativo (sem frouxidão do LCA).\n  * Teste da Gaveta Anterior e Posterior: Negativos.\n  * Estresse em Varo e Valgo: Estáveis a 0º e 30º.",
    assessment: "1. Lesão degenerativa do menisco medial do joelho direito.\n2. Gonartrose incipiente (grau I-II de Kellgren-Lawrence).",
    plan: "1. Solicitação de Ressonância Magnética (RM) do joelho direito e Radiografias com carga (AP e perfil bilateral).\n2. Crioterapia local por 20 minutos 3x ao dia.\n3. Encaminhamento para Fisioterapia motora (fortalecimento de quadríceps/isquiotibiais e propriocepção).\n4. Prescrição de anti-inflamatório por 5 dias e analgésico de resgate se dor EVA > 4.\n5. Retorno com laudo da imagem em 3 semanas."
  },
  {
    id: "pediatria",
    specialty: "Pediatria",
    label: "Pediatria (Puericultura & Desenvolvimento Infantil)",
    subjective: "Consulta de Puericultura de rotina / Queixa aguda de tosse e coriza.\nIdade: [X] anos e [Y] meses. Nascido a termo (39 semanas), peso ao nascer 3.250g, Apgar 9/10.\nAlimentação: Aleitamento materno exclusivo até os 6 meses / Alimentação complementar variada, boa aceitação de frutas e hortaliças.\nDesenvolvimento Neuropsicomotor (DNPM): Adequado para a idade (marcha independente, vocabulário em expansão com frases simples, controle esfincteriano em evolução).\nVacinação: Carteira de vacinação em dia de acordo com o Calendário Básico do PNI (reforços atualizados).",
    objective: "Exame Físico Pediátrico:\n- Dados Antropométricos: Peso: [X] kg (Percentil 50-75 OMS) | Estatura: [Y] cm (Percentil 50 OMS) | Perímetro Cefálico: [Z] cm (adequado).\n- Estado Geral: Bom estado geral, corado, hidratado, anictérico, acianótico, ativo e reativo.\n- Oroscopia: Orofaringe sem hiperemia importante, amígdalas sem exsudato purulento.\n- Otoscopia: Membranas timpânicas íntegras, translúcidas, com reflexo de luz preservado bilateralmente.\n- Aparelho Respiratório: Murmúrio vesicular presente bilateralmente, sem sibilos ou estertores. Frequência respiratória normal para a idade, sem tiragem intercostal.\n- Abdome: Semigloboso, flácido, indolor à palpação superficial e profunda, sem visceromegalias.\n- Genitália: Típica para a idade, testículos tópicos na bolsa escrotal bilateralmente.",
    assessment: "1. Criança hígida em acompanhamento de puericultura.\n2. Crescimento e desenvolvimento neuropsicomotor adequados para a faixa etária.\n3. Estado nutricional eutrófico (Escore Z de IMC entre -1 e +1).",
    plan: "1. Manutenção do aleitamento materno e estímulo a hábitos alimentares saudáveis com redução de ultraprocessados.\n2. Suplementação profilática de Vitamina D (400-600 UI/dia) e Ferro elementar conforme faixa etária.\n3. Estímulo à brincadeira ao ar livre e tempo de tela zero/restrito conforme diretriz SBP.\n4. Próxima consulta de puericultura agendada para 3 meses."
  },
  {
    id: "clinica_geral",
    specialty: "Clínica Geral",
    label: "Clínica Geral / Medicina de Família (SOAP Rápido)",
    subjective: "Queixa principal: Check-up de rotina / Astenia / Controle de doenças crônicas.\nHMA: Paciente assintomático no momento, busca renovação de receitas e checagem geral de saúde. Relata sono não reparador e rotina de trabalho estressante. Nega perda de peso recente, febre ou queixas gastrointestinais/urinárias.\nHábitos: Nega tabagismo. Etilismo social ocasional. Sedentário.",
    objective: "Exame Físico Geral:\n- Estado geral bom, orientado no tempo e espaço, mucosas coradas e hidratadas.\n- Sinais Vitais: PA: 125x82 mmHg | FC: 74 bpm | SatO2: 98% | Temperatura axilar: 36,4ºC | IMC: 26,2 kg/m² (sobrepeso leve).\n- Aparelho Cardiovascular: RCR 2T, BNF sem sopros.\n- Aparelho Respiratório: MV presente bilateralmente sem ruídos adventícios.\n- Abdome: RHA presentes, flácido, indolor, ausência de massas palpáveis.\n- Extremidades: Bem perfundidas, pulsos simétricos, sem edemas.",
    assessment: "1. Exame periódico de saúde preventiva em adulto.\n2. Sobrepeso com necessidade de adequação de estilo de vida.\n3. Rastreamento preventivo conforme faixa etária e sexo.",
    plan: "1. Exames laboratoriais de triagem: Hemograma completo, Glicemia de jejum, Perfil lipídico fracionado, TSH, TGO, TGP, Ureia, Creatinina, EAS.\n2. Rastreamento conforme protocolos MS: Sangue oculto nas fezes / Mamografia / Preventivo (conforme idade/sexo).\n3. Encaminhamento para orientação nutricional e programa de exercícios físicos aeróbicos e resistidos.\n4. Retorno para avaliação com os resultados laboratoriais em 30 dias."
  }
];
