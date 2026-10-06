import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, SectionKey } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const sections: Array<{
  key: SectionKey;
  title: string;
  order: number;
  content: Record<string, unknown>;
}> = [
  {
    key: SectionKey.HEADER,
    title: "Header",
    order: 1,
    content: {
      logo: { text: "My Project", imageUrl: null },
      navigation: [],
      cta: { label: "Contact Us", href: "/contact" }
    }
  },
  {
    key: SectionKey.HERO,
    title: "Hero",
    order: 2,
    content: {
      eyebrow: "Welcome",
      heading: "Build something remarkable.",
      description: "A dynamic CMS-powered website ready for your content.",
      primaryAction: { label: "Get Started", href: "/contact" },
      secondaryAction: { label: "View Services", href: "/services" },
      imageUrl: null
    }
  },
  {
    key: SectionKey.ABOUT,
    title: "About",
    order: 3,
    content: {
      heading: "About My Project",
      description: "Tell your visitors who you are, what you do, and why they should work with you.",
      imageUrl: null
    }
  },
  {
    key: SectionKey.SERVICES,
    title: "Services",
    order: 4,
    content: {
      heading: "Our Services",
      description: "Present your core services and capabilities.",
      items: []
    }
  },
  {
    key: SectionKey.PORTFOLIO,
    title: "Portfolio",
    order: 5,
    content: {
      heading: "Our Work",
      description: "Showcase selected projects and case studies.",
      items: []
    }
  },
  {
    key: SectionKey.PRICING,
    title: "Pricing",
    order: 6,
    content: {
      heading: "Pricing Plans",
      description: "Present transparent packages and pricing options.",
      plans: []
    }
  },
  {
    key: SectionKey.TESTIMONIALS,
    title: "Testimonials",
    order: 7,
    content: {
      heading: "What Our Clients Say",
      items: []
    }
  },
  {
    key: SectionKey.BLOG,
    title: "Blog",
    order: 8,
    content: {
      heading: "Latest Articles",
      description: "Publish news, insights, and useful resources.",
      posts: []
    }
  },
  {
    key: SectionKey.CONTACT,
    title: "Contact",
    order: 9,
    content: {
      heading: "Get In Touch",
      description: "Provide your visitors with a clear way to contact you.",
      email: "",
      phone: "",
      address: "",
      formEnabled: true
    }
  },
  {
    key: SectionKey.FOOTER,
    title: "Footer",
    order: 10,
    content: {
      copyright: "© My Project. All rights reserved.",
      links: [],
      socialLinks: []
    }
  }
];

async function main() {
  for (const section of sections) {
    await prisma.cMSSection.upsert({
      where: { key: section.key },
      update: {
        title: section.title,
        order: section.order
      },
      create: {
        key: section.key,
        title: section.title,
        content: section.content,
        isVisible: true,
        order: section.order
      }
    });
  }

  console.log(`Seeded ${sections.length} CMS sections.`);
}

main()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
