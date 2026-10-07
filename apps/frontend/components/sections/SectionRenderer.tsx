import type { ReactNode } from "react";
import type { CMSSection, SectionKey } from "../../lib/api";
import AboutUs from "./AboutUs";
import Blog from "./Blog";
import ContactUs from "./ContactUs";
import Footer from "./Footer";
import Header from "./Header";
import HeroSection from "./HeroSection";
import Portfolio from "./Portfolio";
import Pricing from "./Pricing";
import Services from "./Services";
import Testimonials from "./Testimonials";

const renderers: Record<SectionKey, (props: { section: CMSSection }) => ReactNode> = {
  HEADER: Header, HERO: HeroSection, ABOUT: AboutUs, SERVICES: Services,
  PORTFOLIO: Portfolio, PRICING: Pricing, TESTIMONIALS: Testimonials,
  BLOG: Blog, CONTACT: ContactUs, FOOTER: Footer
};

export default function SectionRenderer({ section }: { section: CMSSection }) {
  const Renderer = renderers[section.key];
  return Renderer ? <Renderer section={section} /> : null;
}
