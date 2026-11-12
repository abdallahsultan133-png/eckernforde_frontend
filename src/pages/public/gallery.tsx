import { PublicPageHero } from "@/components/public/public-editorial";
import { PublicMedia } from "@/components/public/public-media";
const collections = [{name:"Nursery discoveries",media:"nursery-discoveries"},{name:"Primary learning",media:"primary-learning"},{name:"Secondary projects",media:"secondary-projects"},{name:"Creative expression",media:"arts-and-music"},{name:"Our community",media:"family-community"},{name:"School celebrations",media:"school-celebrations"}];
export default function GalleryPage() {
  return <><PublicPageHero title="Our school in pictures" label="Gallery" media="gallery-welcome" intro="A space for Eckernforde Schools learning, friendship and celebration. Approved school photographs and captions are awaiting publication." /><section className="ref-gallery ref-inner-section" aria-label="School photography collections">{collections.map(item=><figure key={item.media}><PublicMedia name={item.media}/><figcaption><h2>{item.name}</h2><p>School photography to follow.</p></figcaption></figure>)}</section></>;
}
