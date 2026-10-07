"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bot, Sparkles, X, Send, Stethoscope, ChevronRight, AlertCircle, HelpCircle } from "lucide-react";

type Message = {
  id: string;
  sender: "assistant" | "user";
  text: string;
  actionLink?: { label: string; href: string };
};

const SUGGESTIONS = [
  "Qual especialidade devo procurar para dor nas costas?",
  "Como agendar uma consulta médica?",
  "Como funcionam os exames em laboratórios parceiros?",
  "A MediNexus cobra alguma taxa dos pacientes?",
];

function generateAssistantResponse(query: string): { text: string; actionLink?: { label: string; href: string } } {
  const q = query.toLowerCase();

  // Especialidades por sintoma
  if (q.includes("costa") || q.includes("coluna") || q.includes("lombar") || q.includes("joelho") || q.includes("articul")) {
    return {
      text: "Para dores nas costas, coluna ou articulações, a recomendação inicial é consultar um Ortopedista ou Reumatologista. Um Clínico Geral também pode fazer a avaliação inicial e solicitar exames de imagem (como Raio-X ou Ressonância).",
      actionLink: { label: "Buscar Ortopedistas na rede", href: "/descobrir?query=Ortopedia" },
    };
  }
  if (q.includes("cabeça") || q.includes("enxaqueca") || q.includes("tontura")) {
    return {
      text: "Dores de cabeça persistentes ou enxaquecas devem ser investigadas por um Neurologista ou Clínico Geral. Eles podem avaliar gatilhos, solicitar exames e indicar a medicação adequada.",
      actionLink: { label: "Buscar Neurologistas", href: "/descobrir?query=Neurologia" },
    };
  }
  if (q.includes("coraç") || q.includes("pressão") || q.includes("palpita") || q.includes("peito")) {
    return {
      text: "Para sintomas cardiovasculares, como pressão alta ou palpitações, procure um Cardiologista. Se houver dor forte no peito com irradiação para o braço, procure um pronto-socorro imediatamente.",
      actionLink: { label: "Buscar Cardiologistas", href: "/descobrir?query=Cardiologia" },
    };
  }
  if (q.includes("pele") || q.includes("mancha") || q.includes("coceira") || q.includes("acne")) {
    return {
      text: "Alterações na pele, manchas, sinais ou coceiras são avaliados pelo Dermatologista, especialista no diagnóstico e cuidado dermatológico.",
      actionLink: { label: "Buscar Dermatologistas", href: "/descobrir?query=Dermatologia" },
    };
  }
  if (q.includes("estômago") || q.includes("azia") || q.includes("refluxo") || q.includes("barriga") || q.includes("intestino")) {
    return {
      text: "Desconfortos digestivos, azia e dores abdominais são cuidados por um Gastroenterologista.",
      actionLink: { label: "Buscar Gastroenterologistas", href: "/descobrir?query=Gastroenterologia" },
    };
  }
  if (q.includes("olho") || q.includes("vista") || q.includes("visão")) {
    return {
      text: "Para dificuldades visuais, irritações oculares ou exames de rotina preventiva, consulte um Oftalmologista.",
      actionLink: { label: "Buscar Oftalmologistas", href: "/descobrir?query=Oftalmologia" },
    };
  }
  if (q.includes("ansiedade") || q.includes("sono") || q.includes("depress") || q.includes("estresse")) {
    return {
      text: "Para cuidados de saúde mental, controle de ansiedade e distúrbios do sono, recomendamos agendar com um Psiquiatra ou Psicólogo.",
      actionLink: { label: "Buscar profissionais de Saúde Mental", href: "/descobrir?query=Psiquiatria" },
    };
  }

  // Agendamento
  if (q.includes("agendar") || q.includes("marcar") || q.includes("consulta")) {
    return {
      text: "Para agendar uma consulta: acesse a página de Busca, selecione a especialidade desejada e a cidade. Você pode informar seus dias e horários livres para que o MediNexus encontre o melhor encaixe na rede automaticamente!",
      actionLink: { label: "Ir para busca de consultas", href: "/descobrir" },
    };
  }

  // Exames
  if (q.includes("exame") || q.includes("laborat") || q.includes("sangue")) {
    return {
      text: "O MediNexus conecta pacientes a laboratórios credenciados para realização de exames de sangue e imagem com condições especiais e laudo digital. Você pode visualizar suas solicitações em 'Documentos Médicos' e agendar diretamente.",
      actionLink: { label: "Acessar Documentos e Exames", href: "/dashboard" },
    };
  }

  // Taxas
  if (q.includes("taxa") || q.includes("cobr") || q.includes("pago") || q.includes("preço") || q.includes("grátis") || q.includes("gratuito")) {
    return {
      text: "O MediNexus é 100% gratuito para pacientes! Não cobramos comissão, mensalidade nem taxas de agendamento. Nas consultas particulares, você paga apenas o valor do atendimento diretamente ao profissional ou clínica.",
      actionLink: { label: "Conhecer mais sobre o MediNexus", href: "/sobre" },
    };
  }

  // Resposta padrão inteligente
  return {
    text: "Posso ajudar você a encontrar médicos por especialidade, explicar o funcionamento do agendamento inteligente ou tirar dúvidas sobre receitas e exames. Caso não saiba qual médico procurar, me conte qual sintoma está sentindo!",
    actionLink: { label: "Explorar Especialidades", href: "/descobrir" },
  };
}

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Olá! Sou a Assistente Virtual da MediNexus. Como posso ajudar você a cuidar da sua saúde hoje?",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  function handleSend(textToSend?: string) {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput("");

    // Resposta com leve delay para naturalidade
    setTimeout(() => {
      const response = generateAssistantResponse(query);
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: response.text,
        actionLink: response.actionLink,
      };
      setMessages(prev => [...prev, assistantMsg]);
    }, 400);
  }

  return (
    <aside aria-label="Assistente IA" className="fixed bottom-24 right-6 z-40">
      {/* Botão Flutuante da IA */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir Assistente Virtual MediNexus"
          className="group flex h-14 w-14 items-center justify-center rounded-full bg-mn-teal text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-mn-teal/90 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-mn-teal/30"
        >
          <Sparkles size={24} className="text-mn-sage-light transition-transform group-hover:rotate-12" />
          <span className="pointer-events-none absolute right-16 hidden whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-md opacity-0 transition-opacity duration-200 group-hover:block group-hover:opacity-100 sm:inline-block">
            Assistente Virtual IA
          </span>
        </button>
      )}

      {/* Caixa de Conversa Flutuante */}
      {isOpen && (
        <div className="flex h-[520px] w-[350px] sm:w-[380px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden transition-all duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-mn-teal/20 bg-mn-teal px-4 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                <Bot size={20} className="text-mn-sage-light" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight">Assistente MediNexus</h3>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-white/80">Guia de saúde e agendamentos</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-mn-teal text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 shadow-sm rounded-bl-none"
                  }`}
                >
                  <p>{m.text}</p>
                  {m.actionLink && (
                    <Link
                      href={m.actionLink.href}
                      onClick={() => setIsOpen(false)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-mn-sand px-2.5 py-1 text-[11px] font-bold text-mn-teal hover:bg-mn-sage-light transition-colors"
                    >
                      <span>{m.actionLink.label}</span>
                      <ChevronRight size={12} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas */}
          {messages.length <= 2 && (
            <div className="border-t border-slate-100 bg-white px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Sugestões:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSend(s)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 hover:bg-mn-sand hover:text-mn-teal transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer Médico */}
          <div className="px-3 py-1 bg-amber-50/80 border-t border-amber-100/60 flex items-center gap-1.5 text-[10px] text-amber-800">
            <AlertCircle size={12} className="shrink-0 text-amber-600" />
            <span>Orientação informativa. Não substitui consulta médica. Em urgências, ligue 192 (SAMU).</span>
          </div>

          {/* Input de Envio */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Digite sua dúvida ou sintoma..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-mn-teal focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-mn-teal text-white transition-opacity disabled:opacity-40 hover:bg-mn-teal/90"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
