"use client";

import { useEffect, useState } from "react";

/**
 * Interface fictícia que carrega o script externo do Memed Sinapse
 * e permite que o médico faça prescrições assinadas.
 */
export default function MemedWidget({ doctorId, buttonClassName, buttonLabel = "Prescrever via Memed" }: { doctorId: string, buttonClassName?: string, buttonLabel?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Na vida real, injetaríamos o script da Memed aqui:
    // const script = document.createElement("script");
    // script.src = "https://sandbox.memed.com.br/modulos/plataforma.sinapse-prescricao/build/sinapse-prescricao.min.js";
    // script.dataset.color = "#164957"; // mn-teal
    // document.body.appendChild(script);
  }, []);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className={buttonClassName || "w-full mt-4 rounded-xl bg-mn-teal py-3 text-sm font-bold text-white transition hover:bg-[#123B46]"}
      >
        {buttonLabel}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mn-graphite/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[85vh] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-mn-border px-6 py-4 bg-mn-sand">
          <div>
            <h3 className="font-bold text-mn-graphite">Memed Sinapse (Sandbox)</h3>
            <p className="text-xs text-mn-graphite/60">Ambiente de Testes</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-sm font-bold text-rose-500 hover:text-rose-700"
          >
            Fechar Prescritor
          </button>
        </div>
        
        {/* Simulação da UI da Memed */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-mn-teal/10 flex items-center justify-center text-mn-teal text-2xl font-bold">
            M
          </div>
          <h2 className="text-xl font-bold text-mn-graphite">Prescritor Digital ICP-Brasil</h2>
          <p className="max-w-md text-sm text-mn-graphite/70">
            Esta é uma interface de integração. Para liberar o widget real da Memed, 
            é necessário que o seu CNPJ de Healthtech seja cadastrado no portal de parceiros deles.
          </p>
          <button 
            onClick={() => {
              alert("Em produção, a Memed gera o PDF e salva no histórico do paciente automaticamente.");
              setIsOpen(false);
            }}
            className="mt-6 rounded-full bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700"
          >
            Simular Emissão e Assinatura
          </button>
        </div>
      </div>
    </div>
  );
}
