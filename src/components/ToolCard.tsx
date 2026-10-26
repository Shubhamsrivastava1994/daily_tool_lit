import type { ReactNode } from "react";

type Props = { active: boolean; onClick: () => void; icon: ReactNode; title: string; subtitle: string };

export default function ToolCard({ active, onClick, icon, title, subtitle }: Props) {
  return (
    <button type="button" className={`tool-card ${active ? "selected" : ""}`} onClick={onClick} aria-pressed={active}>
      <span className="tool-card-icon">{icon}</span>
      <span className="tool-card-copy"><strong>{title}</strong><small>{subtitle}</small></span>
      <span className="tool-card-arrow">↗</span>
    </button>
  );
}