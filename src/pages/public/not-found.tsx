import { ArrowLeft, SearchX } from "lucide-react";
import { Link } from "react-router";
import { PublicPageMeta } from "@/components/public/public-page-meta";

export default function PublicNotFoundPage() {
  return <>
    <PublicPageMeta title="Page not found" description="The requested school information page could not be found." />
    <section className="mx-auto flex min-h-[60svh] max-w-[1440px] items-center px-4 py-20 sm:px-6 lg:px-10">
      <div className="max-w-2xl border-l-4 border-[#ba4a32] pl-6 sm:pl-8">
        <SearchX className="h-8 w-8 text-[#ba4a32]" aria-hidden="true" />
        <p className="public-eyebrow mt-8">Page not found</p>
        <h1 className="mt-3 font-serif text-5xl leading-none sm:text-7xl">That school page is not here.</h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-[#172b3a]/75">The information may have moved, may not be published yet, or the address may be incorrect.</p>
        <Link to="/" className="public-primary-button mt-8"> <ArrowLeft className="h-4 w-4" aria-hidden="true" />Return home</Link>
      </div>
    </section>
  </>;
}
