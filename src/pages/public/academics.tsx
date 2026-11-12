import { PublicPageHero, PublicEditorialSections } from "@/components/public/public-editorial";
import { ReferenceStages } from "@/components/public/home/reference-home";

export default function AcademicsPage() {
  return <><PublicPageHero title="Learning at Eckernforde Schools" label="Academics" media="academic-learning" intro="A connected learning journey through Nursery, Primary and Secondary. Explore each stage and discover where your child’s next chapter begins." /><ReferenceStages /><div className="ref-academics-editorial"><PublicEditorialSections prefix="academic" sections={[{ title: "A curriculum with room to think", copy: "Learning connects strong foundations with curiosity, communication and practical problem-solving. Contact the school for the current curriculum at your child’s stage.", href: "/academics/curriculum" }, { title: "Support along the way", copy: "Find out how the school approaches learning support, assessment and conversations with families.", href: "/academics/learning-support" }]} /></div></>;
}
