import { ArrowRight, CalendarDays, ChevronRight, CirclePlay, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

const stages = [
  ["Nursery & Kindergarten", "A joyful beginning built around curiosity, care and discovery.", "Explore early years"],
  ["Primary", "A strong foundation for confident learners from Standard I to VII.", "Explore primary"],
  ["Secondary", "Purposeful learning, character and preparation through Form I to IV.", "Explore secondary"],
] as const;

export default function PublicHome() {
  return <>
    <section className="public-hero">
      <div className="public-hero-copy">
        <p className="public-eyebrow">A school identity, ready to be made real</p>
        <h1>Every stage of learning deserves a clear sense of possibility.</h1>
        <p className="public-lede">A new digital home for Nursery, Primary and Secondary education—built around real school life, trusted information and meaningful next steps for families.</p>
        <div className="flex flex-wrap gap-3"><Link className="public-primary-button" to="/admissions">Start your admissions journey <ArrowRight aria-hidden="true" /></Link><Link className="public-secondary-button" to="/academics">Explore learning</Link></div>
      </div>
      <div className="public-image-placeholder public-hero-art" role="img" aria-label="Placeholder for an approved school photograph showing students learning together">
        <span>Approved school photography will shape this moment.</span>
      </div>
    </section>

    <section className="public-intro-grid">
      <p className="public-eyebrow">One school, three journeys</p>
      <div><h2>Growing with purpose, from first questions to future choices.</h2><p>This homepage intentionally avoids invented results, testimonials and statistics. Once approved school stories, photography and outcomes are supplied, this section will make the school’s educational promise tangible.</p></div>
    </section>

    <section className="public-stage-section" aria-labelledby="journey-heading">
      <div className="public-section-heading"><p className="public-eyebrow">Educational journey</p><h2 id="journey-heading">A distinct experience at every stage.</h2></div>
      <div className="public-stage-grid">{stages.map(([title, copy, action], index) => <article className="public-stage" key={title}><span className="public-stage-number">0{index + 1}</span><h3>{title}</h3><p>{copy}</p><Link to="/academics" className="public-text-link">{action} <ChevronRight aria-hidden="true" /></Link></article>)}</div>
    </section>

    <section className="public-story-band">
      <div className="public-image-placeholder public-story-art" role="img" aria-label="Placeholder for approved imagery of school life"><CirclePlay aria-hidden="true" className="h-11 w-11" /><span>School film / campus story</span></div>
      <div><p className="public-eyebrow">Learning in action</p><h2>Show the work. Tell the story. Let families see the culture.</h2><p>Real student projects, classroom moments, arts, sports and community service should be the proof—not generic marketing claims.</p><Link className="public-text-link" to="/school-life">Discover school life <ArrowRight aria-hidden="true" /></Link></div>
    </section>

    <section className="public-utility-section">
      <div><p className="public-eyebrow">For the school community</p><h2>The right information, in the right place.</h2></div>
      <div className="public-utility-list"><Link to="/news-events"><CalendarDays aria-hidden="true" /><span><b>News & events</b><small>Public stories, announcements and calendar highlights.</small></span><ArrowRight aria-hidden="true" /></Link><Link to="/portal"><ShieldCheck aria-hidden="true" /><span><b>Secure portal</b><small>Personal academic, attendance and daily-school information.</small></span><ArrowRight aria-hidden="true" /></Link><Link to="/contact"><MapPin aria-hidden="true" /><span><b>Visit and connect</b><small>Contact details and campus directions after approval.</small></span><ArrowRight aria-hidden="true" /></Link></div>
    </section>

    <section className="public-admissions-cta"><p className="public-eyebrow">Admissions</p><h2>Begin with a conversation.</h2><p>Explore the application process, arrange a visit, or contact the admissions team.</p><Link className="public-primary-button" to="/admissions">Explore admissions <ArrowRight aria-hidden="true" /></Link></section>
  </>;
}
