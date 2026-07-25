export interface SkillCategory {
  name: string;
  skills: string[];
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface ResumeData {
  title: string;
  summary: string;
  location: string;
  skills: SkillCategory[];
  education: Education[];
  resumePdfUrl: string;
}

export const RESUME_DATA: ResumeData = {
  title: "Software Engineer · Distributed Systems · Databases · Agentic AI",
  location: "India",
  summary:
    "Software Engineer with experience building full-stack applications and distributed backend systems. Passionate about designing scalable architectures, working with databases at scale, and exploring agentic AI workflows. Currently building SaaS features at Xplor Technologies, with a strong foundation in both frontend and backend technologies.",
  resumePdfUrl: "/files/Resume.pdf",
  skills: [
    {
      name: "Languages & Frameworks",
      skills: [
        "TypeScript",
        "JavaScript",
        "Java",
        "C#",
        "Python",
        "React",
        "Next.js",
        "Vue.js",
        "Node.js",
        "ASP.NET Core",
        "Spring Boot",
      ],
    },
    {
      name: "Backend & Distributed Systems",
      skills: [
        "REST APIs",
        "Microservices",
        "Kafka",
        "gRPC",
        "Consensus Algorithms",
        "Replication",
        "Sharding",
        "Consistent Hashing",
        "Bloom Filters",
      ],
    },
    {
      name: "Databases",
      skills: [
        "PostgreSQL",
        "SQL Server",
        "MySQL",
        "MongoDB",
        "Redis",
        "Full-Text Search",
        "B-Tree Indexing",
        "Query Optimization",
        "Transactions",
      ],
    },
    {
      name: "AI & Agentic AI",
      skills: [
        "LLMs",
        "RAG",
        "LangChain",
        "OpenAI API",
        "Vector Databases",
        "Prompt Engineering",
        "AI Agents",
        "Agentic Workflows",
      ],
    },
    {
      name: "Cloud & Infrastructure",
      skills: [
        "Azure",
        "AWS",
        "Docker",
        "Kubernetes",
        "CI/CD",
        "GitHub Actions",
        "Terraform",
        "Linux",
      ],
    },
    {
      name: "AI Development Tools",
      skills: [
        "Cursor",
        "Claude Code",
        "Opencode",
        "GitHub Copilot",
        "ChatGPT",
      ],
    },
  ],
  education: [
    {
      degree: "Bachelor of Engineering",
      institution: "Your University",
      year: "2023",
    },
  ],
};
