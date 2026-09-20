import { useId, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { DashboardGreeting } from "./dashboard-greeting";
import { AcademicContext } from "./academic-context";
import "./campus-workspace.css";

export function CampusWorkspace({ title, description, actions, children }: {
  title: string; description: string; actions: { label: string; href: string }[]; children: ReactNode;
}) {
  return <div className="campus-workspace">
    <header className="campus-heading"><div><p className="campus-eyebrow">ACADEMIX / {title}</p>
      <DashboardGreeting subtitle={description} /><AcademicContext /></div></header>
    <div className="campus-board">
      <nav className="campus-toolbar" aria-label={`${title} shortcuts`}>
        {actions.map((action) => <Link key={action.href} to={action.href}>{action.label}<span aria-hidden="true">-&gt;</span></Link>)}
      </nav>
      {children}
    </div>
  </div>;
}

export function WorkspaceColumn({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return <section className="campus-column" aria-labelledby={id}><h2 id={id} className="campus-column-title">{title}</h2>{children}</section>;
}

export function WorkspaceDirectory({ items }: { items: { label: string; href: string; description: string }[] }) {
  return <nav className="campus-directory" aria-label="Explore your school portal">
    <div className="campus-directory-heading"><p className="campus-eyebrow">Your school, connected</p><h2>Continue your school day</h2></div>
    <ul>{items.map((item) => <li key={item.href}><Link to={item.href}><span><strong>{item.label}</strong><small>{item.description}</small></span><ArrowUpRight size={18} aria-hidden="true" /></Link></li>)}</ul>
  </nav>;
}
