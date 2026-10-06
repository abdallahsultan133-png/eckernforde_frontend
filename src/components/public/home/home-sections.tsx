import {
  ArrowRight,
  BookOpen,
  Compass,
  FlaskConical,
  HeartHandshake,
  Map,
  Music2,
  Palette,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";

import { PublicCta } from "@/components/public/public-cta";
import { PUBLIC_BRAND } from "@/components/public/public-brand";
import { HomeReveal, ParallaxImage } from "./home-motion";

export function SchoolIntroduction() {
  return (
    <section className="homepage-intro public-container" id="school-story" aria-labelledby="school-story-title">
      <HomeReveal className="homepage-intro__marker">
        <span>01</span>
        <span>Why this school</span>
      </HomeReveal>
      <HomeReveal className="homepage-intro__statement" delay={0.04}>
        <p className="homepage-eyebrow">A connected education</p>
        <h2 id="school-story-title">Known with care. Challenged with purpose. Ready to grow.</h2>
      </HomeReveal>
      <HomeReveal className="homepage-intro__copy" delay={0.08}>
        <p>
          Children thrive when school feels both grounding and expansive. The journey brings
          Nursery, Primary and Secondary together through thoughtful teaching, trusted
          relationships and room to participate.
        </p>
        <PublicCta to="/about" variant="text" showArrow>Meet the school</PublicCta>
      </HomeReveal>
      <div className="homepage-intro__orbit" aria-hidden="true">
        <span>Care</span>
        <span>Curiosity</span>
        <span>Confidence</span>
      </div>
    </section>
  );
}

const academicPaths = [
  {
    icon: BookOpen,
    label: "Curriculum and subjects",
    copy: "Strong foundations, inquiry and practical problem-solving across every stage.",
    href: "/academics/curriculum",
  },
  {
    icon: HeartHandshake,
    label: "Learning support",
    copy: "The right balance of care, challenge and guidance for each learner.",
    href: "/academics/learning-support",
  },
  {
    icon: FlaskConical,
    label: "Examinations and progress",
    copy: "A clear view of how knowledge, habits and independence develop over time.",
    href: "/academics/examinations",
  },
] as const;

export function AcademicsSection() {
  return (
    <section className="homepage-academics" aria-labelledby="academics-title">
      <div className="public-container homepage-academics__layout">
        <HomeReveal className="homepage-academics__lead">
          <p className="homepage-eyebrow homepage-eyebrow--light">Academics</p>
          <h2 id="academics-title">Knowledge that becomes confidence in action.</h2>
          <p>
            Learning is built through explanation, practice, questions, conversation and the
            chance to apply ideas in meaningful ways.
          </p>
          <PublicCta to="/academics" variant="secondary" showArrow>Explore academics</PublicCta>
        </HomeReveal>

        <div className="homepage-academics__paths">
          {academicPaths.map((path, index) => {
            const Icon = path.icon;
            return (
              <HomeReveal className="homepage-academics__path" delay={index * 0.06} key={path.label}>
                <span className="homepage-academics__path-number">0{index + 1}</span>
                <Icon aria-hidden="true" />
                <div>
                  <h3>{path.label}</h3>
                  <p>{path.copy}</p>
                </div>
                <Link to={path.href} aria-label={`Explore ${path.label}`}>
                  <ArrowRight aria-hidden="true" />
                </Link>
              </HomeReveal>
            );
          })}
        </div>
      </div>
      <div className="homepage-academics__word" aria-hidden="true">Learn</div>
    </section>
  );
}

export function CampusSection() {
  return (
    <section className="homepage-campus" aria-labelledby="campus-title">
      <div className="public-container homepage-campus__layout">
        <HomeReveal className="homepage-campus__copy">
          <p className="homepage-eyebrow">Facilities and campus</p>
          <h2 id="campus-title">Spaces that invite movement, focus and discovery.</h2>
          <p>
            Classrooms, creative spaces, outdoor areas and shared places shape how students move
            through the day and encounter new possibilities.
          </p>
          <PublicCta to="/about/campus-facilities" variant="text" showArrow>Explore our facilities</PublicCta>
        </HomeReveal>

        {/* This visual boundary can be replaced by Campus3DExperience in Step 4. */}
        <div className="homepage-campus__experience-slot" data-campus-experience-slot>
          <div className="homepage-campus__perspective" aria-hidden="true">
            <span className="homepage-campus__plane homepage-campus__plane--one" />
            <span className="homepage-campus__plane homepage-campus__plane--two" />
          </div>
          <ParallaxImage
            className="homepage-campus__image"
            imageClassName="homepage-campus__image-content"
            src="/images/kijani-community-voice.png"
            alt="A student standing in a green school courtyard"
          />
          <div className="homepage-campus__caption">
            <Map aria-hidden="true" />
            <span>Campus perspective</span>
            <strong>Places designed around learning and belonging</strong>
          </div>
          <div className="homepage-campus__direction" aria-hidden="true">
            <span>Library</span>
            <span>Learning spaces</span>
            <span>Outdoor life</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SchoolLifeSection() {
  return (
    <section className="homepage-life" aria-labelledby="school-life-title">
      <div className="public-container homepage-life__heading">
        <HomeReveal>
          <p className="homepage-eyebrow homepage-eyebrow--light">School life</p>
          <h2 id="school-life-title">A school day is made of more than lessons.</h2>
        </HomeReveal>
        <HomeReveal delay={0.05}>
          <p>
            Creativity, movement, friendship, leadership and shared projects give every learner
            more ways to participate and belong.
          </p>
          <PublicCta to="/school-life" variant="secondary" showArrow>Discover school life</PublicCta>
        </HomeReveal>
      </div>

      <div className="public-container homepage-life__story">
        <ParallaxImage
          className="homepage-life__image"
          imageClassName="homepage-life__image-content"
          src="/images/kijani-creative-learning.png"
          alt="Students collaborating around a large painting in an art studio"
        />
        <div className="homepage-life__caption">
          <span>Creative learning</span>
          <strong>Making ideas visible, together.</strong>
        </div>
        <div className="homepage-life__threads" aria-label="Explore school life themes">
          <Link to="/school-life/arts-music"><Palette aria-hidden="true" /><span>Arts and expression</span><ArrowRight aria-hidden="true" /></Link>
          <Link to="/school-life/sports-wellbeing"><Compass aria-hidden="true" /><span>Sport and wellbeing</span><ArrowRight aria-hidden="true" /></Link>
          <Link to="/school-life/clubs-activities"><Music2 aria-hidden="true" /><span>Clubs and activities</span><ArrowRight aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}

const proofPoints = [
  {
    label: "One connected path",
    copy: "Nursery, Primary and Secondary are presented as one continuous educational journey.",
  },
  {
    label: "Clear public information",
    copy: "Approved school-wide news and events remain available to families and visitors.",
  },
  {
    label: "Protected personal records",
    copy: "Student, family and staff information stays behind the secure school portal.",
  },
] as const;

export function ProofSection() {
  return (
    <section className="homepage-proof" aria-labelledby="proof-title">
      <div className="public-container homepage-proof__layout">
        <HomeReveal>
          <p className="homepage-eyebrow">Trust, made visible</p>
          <h2 id="proof-title">A clear journey for prospective and current families.</h2>
        </HomeReveal>
        <div className="homepage-proof__points">
          {proofPoints.map((point, index) => (
            <HomeReveal className="homepage-proof__point" delay={index * 0.05} key={point.label}>
              <span>0{index + 1}</span>
              <div><h3>{point.label}</h3><p>{point.copy}</p></div>
            </HomeReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const admissionSteps = [
  { number: "01", label: "Discover", copy: "Understand the learning journey and what the school values.", href: "/admissions/why-choose-us" },
  { number: "02", label: "Visit", copy: "Ask about an appropriate time to experience the campus.", href: "/admissions/visit" },
  { number: "03", label: "Enquire", copy: "Share a focused question and receive the school's verified next steps.", href: "/admissions" },
] as const;

export function AdmissionsJourney() {
  return (
    <section className="homepage-admissions" aria-labelledby="admissions-title">
      <div className="public-container">
        <HomeReveal className="homepage-admissions__heading">
          <div>
            <p className="homepage-eyebrow">Admissions</p>
            <h2 id="admissions-title">A thoughtful first step for your family.</h2>
          </div>
          <p>
            Begin with clear information, arrange a conversation, and let the school guide you
            through its current requirements.
          </p>
        </HomeReveal>
        <div className="homepage-admissions__steps">
          {admissionSteps.map((step, index) => (
            <HomeReveal className="homepage-admissions__step" delay={index * 0.06} key={step.label}>
              <span>{step.number}</span>
              <h3>{step.label}</h3>
              <p>{step.copy}</p>
              <Link to={step.href} aria-label={`${step.label}: ${step.copy}`}><ArrowRight aria-hidden="true" /></Link>
            </HomeReveal>
          ))}
        </div>
        <HomeReveal className="homepage-admissions__actions">
          <PublicCta to="/admissions" variant="primary" showArrow>Start an enquiry</PublicCta>
          <PublicCta to="/admissions/visit" variant="text" showArrow>Plan a visit</PublicCta>
        </HomeReveal>
      </div>
    </section>
  );
}

export function FinalCallToAction() {
  return (
    <section className="homepage-final" aria-labelledby="final-title">
      <div className="homepage-final__glow" aria-hidden="true" />
      <div className="public-container homepage-final__layout">
        <HomeReveal>
          <p className="homepage-eyebrow homepage-eyebrow--light">Your next chapter</p>
          <h2 id="final-title">Come and see where the journey could begin.</h2>
        </HomeReveal>
        <HomeReveal className="homepage-final__action" delay={0.05}>
          <p>{PUBLIC_BRAND.tagline}. Start with a visit or a focused admissions conversation.</p>
          <div>
            <PublicCta to="/admissions/visit" variant="primary" showArrow>Plan a visit</PublicCta>
            <PublicCta to="/admissions" variant="secondary" showArrow>Enquire</PublicCta>
          </div>
        </HomeReveal>
      </div>
      <div className="homepage-final__seal" aria-hidden="true"><Sparkles /><span>{PUBLIC_BRAND.mark}</span></div>
      <div className="homepage-final__trust" aria-hidden="true"><ShieldCheck /><span>Secure portal access remains available for current families</span></div>
    </section>
  );
}
