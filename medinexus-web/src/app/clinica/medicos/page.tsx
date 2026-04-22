import Link from "next/link";

export default function ClinicaMedicosPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <Link
            href="/clinica/dashboard"
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            ← Voltar para o dashboard da clínica
          </Link>
        </div>

        <div className="app-card p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Médicos da clínica
          </p>
          <h1 className="mt-3 app-section-title">
            Próxima etapa do MVP da clínica
          </h1>
          <p className="mt-3 text-slate-600">
            Aqui entraremos com o cadastro de médicos, vínculo com especialidades
            e permissões para médicos acessarem a área da clínica.
          </p>
        </div>
      </section>
    </main>
  );
}