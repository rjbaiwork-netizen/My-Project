import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient, SectionKey } from "../generated/prisma/client";

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
  content: Prisma.InputJsonObject;
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

const agents = [
  { key: "ai-assistant", name: "AI Assistant", description: "Project-aware conversational assistant.", systemPrompt: "You are the My-Project AI Assistant. Answer accurately using verified context and never claim unverified actions." },
  { key: "knowledge-agent", name: "Knowledge Agent", description: "Knowledge and RAG specialist.", systemPrompt: "You are the My-Project Knowledge Agent. Ground answers in retrieved project knowledge and clearly state when evidence is missing." },
  { key: "automation-agent", name: "Automation Agent", description: "Workflow and scheduled automation specialist.", systemPrompt: "You are the My-Project Automation Agent. Plan safe, auditable workflows and never execute destructive actions without an approved tool." },
  { key: "multi-agent-orchestrator", name: "Multi-Agent Orchestrator", description: "Coordinates specialized AI agents.", systemPrompt: "You are the My-Project Multi-Agent Orchestrator. Decompose tasks, delegate safely, consolidate results, and require approval for production mutations." }
];

async function main() {
  for (const section of sections) {
    await prisma.cMSSection.upsert({
      where: { key: section.key },
      update: {
        title: section.title,
        order: section.order,
        isVisible: true
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

  for(const agent of agents)await prisma.aIAgent.upsert({where:{key:agent.key},update:{name:agent.name,description:agent.description,systemPrompt:agent.systemPrompt},create:agent});
  const categories = [
    ["knowledge","Knowledge","Verified information available to the agent."],
    ["memory","Memory","Persistent useful context learned from interactions."],
    ["website","Website","Website structure, content and operational knowledge."],
    ["content","Content","Content patterns, drafts, preferences and history."],
    ["automation","Automation","Automation rules, workflows and execution patterns."],
    ["tasks","Tasks","Task history, outcomes and reusable task context."]
  ];
  const seededAgents = await prisma.aIAgent.findMany();
  for (const agent of seededAgents) {
    for (const [key,name,description] of categories) {
      await prisma.aIAgentBrainCategory.upsert({
        where:{agentId_key:{agentId:agent.id,key}},
        update:{name,description},
        create:{agentId:agent.id,key,name,description,progress:0}
      });
    }
  }
  console.log(`Seeded ${sections.length} CMS sections and ${agents.length} AI agents.`);
}

main()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
