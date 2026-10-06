import { HomeHero } from "@/components/public/home/home-hero";
import { HomeNewsEvents } from "@/components/public/home/home-news-events";
import {
  AcademicsSection,
  AdmissionsJourney,
  CampusSection,
  FinalCallToAction,
  ProofSection,
  SchoolIntroduction,
  SchoolLifeSection,
} from "@/components/public/home/home-sections";
import { LearningJourney } from "@/components/public/home/learning-journey";
import "@/components/public/home/home.css";

export default function PublicHome() {
  return (
    <div className="homepage">
      <HomeHero />
      <SchoolIntroduction />
      <LearningJourney />
      <AcademicsSection />
      <CampusSection />
      <SchoolLifeSection />
      <ProofSection />
      <AdmissionsJourney />
      <HomeNewsEvents />
      <FinalCallToAction />
    </div>
  );
}
