import { PublicLandscapeHero } from "@/components/public/public-editorial";
import { PublicArrowLink } from "@/components/public/public-shell";
import { ReferenceCampus } from "@/components/public/home/reference-home";

export default function ContactPage() {
  return <><PublicLandscapeHero title="Get in touch" media="school-location" intro="Whether you are considering ACADEMIX or already part of our community, find the right place to start your conversation." /><section id="landscape-content" className="ref-contact-columns ref-inner-section ref-landscape-content"><div><h2>Admissions</h2><p>Ask about Nursery, Primary or Secondary, or tell us you would like to arrange a school visit.</p><PublicArrowLink to="/admissions">Send an enquiry</PublicArrowLink></div><div><h2>Current families</h2><p>Access your existing school account for personal learning information and communication.</p><PublicArrowLink to="/portal">GO TO PORTAL</PublicArrowLink></div><div><h2>Visit ACADEMIX</h2><p>Verified address, telephone number, email and visiting hours are awaiting confirmation. Please use the admissions enquiry form for visit requests.</p><PublicArrowLink to="/admissions/visit">Plan a visit</PublicArrowLink></div></section><ReferenceCampus standalone /></>;
}
