import { Link } from "react-router";
import { PublicMedia, type PUBLIC_MEDIA } from "./public-media";
import { PublicPageMeta } from "./public-page-meta";
import { PublicArrowLink } from "./public-shell";

export function PublicLandscapeHero({ title, intro, media }: { title: string; intro: string; media: string }) {
  return <section className="ref-landscape-hero"><PublicPageMeta title={title} description={intro} /><PublicMedia name={media} eager /><div><nav className="ref-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">↗</span><span aria-current="page">{title}</span></nav><h1>{title}</h1><p>{intro}</p></div><a href="#landscape-content" className="ref-landscape-down" aria-label="Discover more">↓</a></section>;
}

export function PublicPageHero({ title, label, intro, media, image, stage }: { title: string; label: string; intro: string; media: string; image?: keyof typeof PUBLIC_MEDIA; stage?: string }) {
  const breadcrumb = <nav className="ref-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">↗</span><span aria-current="page">{label}</span></nav>;
  return <><PublicPageMeta title={label} description={intro} />{stage ? <section className="ref-stage-banner"><PublicMedia name={media} image={image} eager /><div className="ref-stage-banner-copy">{breadcrumb}<h1>Welcome to our<span>{stage}</span></h1><PublicArrowLink to="/admissions">Discover your next step</PublicArrowLink></div></section> : <div className="ref-page-banner"><PublicMedia name={media} image={image} eager /></div>}<section className="ref-page-intro">{!stage && <>{breadcrumb}<h1>{title}</h1></>}<div className="ref-reading"><p className="ref-lead">{intro}</p></div></section></>;
}

export function PublicEditorialSections({ sections, prefix }: { sections: Array<{ title: string; copy: string; href?: string }>; prefix: string }) {
  return <div className="ref-editorial-sections">{sections.map((section, i) => <section className="ref-editorial-row" key={section.title}><PublicMedia name={`${prefix}-${i + 1}`} /><div className="ref-editorial-copy"><h2>{section.title}</h2><p>{section.copy}</p>{section.href && <PublicArrowLink to={section.href}>Find out more</PublicArrowLink>}</div></section>)}</div>;
}
