export type DocumentFormat = "md" | "txt" | "html";

export type ProjectDocument = {
  id: string;
  title: string;
  description: string;
  filename: string;
  category: string;
  formats: DocumentFormat[];
};

export const projectDocuments: ProjectDocument[] = [
  {
    id: "full-blueprint-bn",
    title: "My-Project — Full Blueprint ও Live Audit Report",
    description:
      "প্রকল্পের architecture, CMS, Admin/Security, AI, automation, পূর্বের audit snapshot ও roadmap.",
    filename: "my-project-full-blueprint-bn.md",
    category: "Blueprint ও Audit",
    formats: ["md", "txt", "html"],
  },
];

// নতুন ডকুমেন্ট যোগ করতে public/docs/ ফোল্ডারে ফাইল রাখুন,
// তারপর এই তালিকায় একটি entry যোগ করুন। নিরাপত্তার জন্য API শুধু এই তালিকাভুক্ত ফাইলই পরিবেশন করে।
