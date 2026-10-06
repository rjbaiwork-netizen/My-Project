import type { ReactNode } from "react";
import type { CMSSection, SectionKey } from "../../lib/api";
import AboutSection from "./AboutSection";
import BlogSection from "./BlogSection";
import ContactSection from "./ContactSection";
import FooterSection from "./FooterSection";
import HeaderSection from "./HeaderSection";
import HeroSection from "./HeroSection";
import PortfolioSection from "./PortfolioSection";
import PricingSection from "./PricingSection";
import ServicesSection from "./ServicesSection";
import TestimonialsSection from "./TestimonialsSection";

const renderers: Record<SectionKey, (props: { section: CMSSection }) => ReactNode> = {
  HEADER: HeaderSection, HERO: HeroSection, ABOUT: AboutSection, SERVICES: ServicesSection,
  PORTFOLIO: PortfolioSection, PRICING: PricingSection, TESTIMONIALS: TestimonialsSection,
  BLOG: BlogSection, CONTACT: ContactSection, FOOTER: FooterSection
};

export default function SectionRenderer({ section }: { section: CMSSection }) {
  const Renderer = renderers[section.key];
  return Renderer ? <Renderer section={section} /> : null;
}
