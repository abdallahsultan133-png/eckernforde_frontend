import { Camera, CheckCircle2 } from "lucide-react";
import { Link } from "react-router";
import { PublicPageMeta } from "@/components/public/public-page-meta";

const collections = [
  ["Learning", "Classrooms, projects and practical learning across Nursery, Primary and Secondary."],
  ["Belonging", "Student life, friendships, clubs and the everyday moments that make a school community."],
  ["The campus", "Facilities, outdoor spaces and specialist learning environments shown as they really are."],
  ["Celebrations", "Arts, sport, trips and community events captured with permission and context."],
];

export default function GalleryPage() {
  return <>
    <PublicPageMeta title="Gallery" description="Approved photography and stories from school life." />
    <section className="public-page-hero">
      <p className="public-eyebrow">Gallery</p>
      <h1>See the school through real moments, not stock imagery.</h1>
      <p className="public-lede">This gallery is designed for original, consented photography from the school community. It will only publish images and captions approved by the school.</p>
    </section>
    <section className="mx-auto max-w-[1440px] px-4 pb-20 sm:px-6 lg:px-10" aria-labelledby="gallery-collections">
      <div className="border-t border-[#172b3a]/20 pt-5"><p className="public-eyebrow" id="gallery-collections">Collections</p></div>
      <div className="mt-8 grid gap-px bg-[#172b3a]/15 sm:grid-cols-2 lg:grid-cols-4">
        {collections.map(([title, copy], index) => <article key={title} className="bg-[#f7f4ee] p-6 sm:p-8">
          <div className="grid aspect-[4/3] place-items-center bg-[#315d65] text-white/80"><Camera className="h-8 w-8" aria-hidden="true" /><span className="sr-only">Approved {title.toLowerCase()} photograph pending</span></div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.15em] text-[#ba4a32]">0{index + 1}</p>
          <h2 className="mt-2 font-serif text-2xl">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#172b3a]/75">{copy}</p>
        </article>)}
      </div>
      <div className="mt-16 grid gap-5 border-l-4 border-[#ba4a32] bg-white p-6 sm:p-8 md:grid-cols-[auto_1fr] md:items-start">
        <CheckCircle2 className="h-7 w-7 text-[#ba4a32]" aria-hidden="true" />
        <div><h2 className="font-serif text-2xl">A careful publishing standard</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-[#172b3a]/75">Images will be published only with the school’s permission, accurate captions and appropriate safeguarding review. Personal academic information never appears in the public gallery.</p><Link to="/contact" className="public-text-link mt-5">Ask about a visit</Link></div>
      </div>
    </section>
  </>;
}
