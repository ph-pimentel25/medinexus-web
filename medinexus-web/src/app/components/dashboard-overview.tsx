import Link from "next/link";
import { CalendarDays, Clock3, Users, FileCheck2, ArrowUpRight } from "lucide-react";
type Metric = { label: string; value: number; hint: string };
export default function DashboardOverview({ eyebrow, title, description, metrics, loading, actions }: {
  eyebrow: string; title: string; description: string; metrics: Metric[]; loading: boolean;
  actions: { label: string; href: string }[];
}) {
  const icons = [CalendarDays, Users, Clock3, FileCheck2];
  return <section className="mn-dashboard-overview">
    <div className="mn-dashboard-heading"><div><p className="mn-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="mn-dashboard-description">{description}</p></div>
      <div className="mn-dashboard-actions">{actions.map((action, i) => <Link key={action.href} href={action.href} className={i === 0 ? "mn-button" : "mn-button-secondary"}>{action.label}<ArrowUpRight size={16} /></Link>)}</div>
    </div>
    <div className="mn-metrics">{metrics.map((metric, i) => { const Icon = icons[i % icons.length]; return <div key={metric.label} className="mn-metric">
      <div className="mn-metric-top"><span className={`mn-metric-icon mn-tone-${i % 3}`}><Icon size={19} strokeWidth={1.7} /></span><span className="mn-metric-label">{metric.label}</span></div>
      <p className="mn-metric-value" aria-label={loading ? "Carregando" : undefined}>{loading ? <span className="mn-skeleton inline-block h-9 w-16" /> : metric.value.toLocaleString("pt-BR")}</p>
      <p className="mn-metric-hint">{metric.hint}</p>
    </div>; })}</div>
  </section>;
}
