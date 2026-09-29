import type { ReactNode } from "react";
import { ArrowUpRight, GraduationCap, ShieldCheck } from "lucide-react";

type AuthLayoutProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  signInWelcome?: boolean;
};

export function AuthLayout({ eyebrow, title, description, children, footer, signInWelcome = false }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="School portal">
        <div className="auth-visual-grid" aria-hidden="true" />
        <div className="auth-visual-top">
          <div className="auth-brand auth-brand-light">
            <span className="auth-brand-mark"><GraduationCap aria-hidden="true" /></span>
            <span>School Portal</span>
          </div>
          <span className="auth-campus-label">School community portal</span>
        </div>

        <div className="auth-visual-copy">
          <p className="auth-kicker">Learn. Grow. Achieve.</p>
          <h1>A connected school day, in one secure place.</h1>
          <p>
            ACADEMIX brings learning, teaching, family communication, attendance and academic progress together for every stage of school life.
          </p>
          <div className="auth-values" aria-label="Portal features">
            <span>Nursery to Secondary</span>
            <span>Trusted school records</span>
            <span>One connected community</span>
          </div>
        </div>

        <div className="auth-visual-bottom">
          <span><ShieldCheck aria-hidden="true" /> Secure access for your school community</span>
          <a href="/" className="auth-public-link">Visit public website <ArrowUpRight aria-hidden="true" /></a>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          {signInWelcome ? <div className="auth-sign-in-panel">
            <div className="auth-school-logos" aria-label="Eckernforde schools">
              <img src="/eckernforde-english-medium-primary-badge.png" alt="Primary school badge" />
              <img src="/eckernforde-cambridge-badge.png" alt="Secondary school badge" />
            </div>
            <div className="auth-heading auth-sign-in-welcome">
              <h2 className="auth-kicker">Welcome to Eckernforde<br />Academy Management System<br />[EAMS]</h2>
              <p>Please sign-in to your account</p>
            </div>
          </div> : <div className="auth-mobile-brand auth-brand">
            <span className="auth-brand-mark"><GraduationCap aria-hidden="true" /></span>
            <span>School Portal</span>
          </div>}
          {(eyebrow || title || description) && <div className="auth-heading">
            {eyebrow && <p className="auth-kicker">{eyebrow}</p>}
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>}
          {children}
          {footer}
        </div>
      </section>
    </main>
  );
}
