import { ArrowUpRight, Camera, CheckCircle2, Images } from "lucide-react";
import { Link } from "react-router";
import { PublicPageMeta } from "@/components/public/public-page-meta";

const collections = [
  ["Learning", "Classrooms, projects and practical learning across Nursery, Primary and Secondary.", "/images/kijani-creative-learning.png"],
  ["Belonging", "Student life, friendships, clubs and the everyday moments that make a school community.", "/images/kijani-community-voice.png"],
  ["The campus", "Facilities, outdoor spaces and specialist learning environments shown as they really are.", "/images/kijani-hero.png"],
  ["Celebrations", "Arts, sport, trips and community events captured with permission and context.", "/images/kijani-community-voice.png"],
];

export default function GalleryPage() {
  return <>
    <PublicPageMeta title="Gallery" description="Approved photography and stories from school life." />
    <section className="public-page-hero gallery-hero">
      <div className="gallery-hero-copy"><p className="public-eyebrow">Gallery</p><h1>Moments that make our school community.</h1><p className="public-lede">Explore a growing collection of learning, friendship, creativity and celebration from across Eckernforde Schools.</p><div className="gallery-hero-actions"><Link to="/contact" className="gallery-primary-link">Plan a visit <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link><span className="gallery-safe-note"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Consent-led publishing</span></div></div>
      <div className="gallery-hero-mosaic" aria-label="A preview of school life"><img className="gallery-mosaic-main" src="/images/kijani-hero.png" alt="Students learning together" fetchPriority="high" decoding="async" /><img src="/images/kijani-creative-learning.png" alt="Creative learning in the classroom" loading="lazy" decoding="async" /><img src="/images/kijani-community-voice.png" alt="The school community" loading="lazy" decoding="async" /><span className="gallery-mosaic-label">Real moments<br /><strong>Shared with care</strong></span></div>
    </section>
    <section className="mx-auto max-w-[1440px] px-4 pb-20 sm:px-6 lg:px-10" aria-labelledby="gallery-collections">
      <div className="gallery-section-heading"><div><p className="public-eyebrow" id="gallery-collections">Explore the gallery</p><h2>Life at Eckernforde</h2></div><Images className="h-7 w-7" aria-hidden="true" /></div>
      <div className="gallery-collection-grid">{collections.map(([title, copy, image], index) => <article key={title} className="gallery-collection-card"><div className="gallery-card-image"><img src={image} alt="" loading="lazy" decoding="async" /><span className="gallery-card-number">0{index + 1}</span><span className="gallery-card-overlay"><Camera className="h-5 w-5" aria-hidden="true" /> View collection</span></div><div className="gallery-card-copy"><h3>{title}</h3><p>{copy}</p><ArrowUpRight className="gallery-card-arrow h-5 w-5" aria-hidden="true" /></div></article>)}</div>
      <div className="gallery-standard"><CheckCircle2 className="h-7 w-7 shrink-0" aria-hidden="true" /><div><p className="public-eyebrow">Our publishing standard</p><h2>Every image has a story—and permission behind it.</h2><p>Images are published only with the school’s permission, accurate captions and appropriate safeguarding review. Personal academic information never appears in the public gallery.</p><Link to="/contact" className="public-text-link mt-5">Ask about a visit</Link></div></div>
    </section>
  </>;
}
