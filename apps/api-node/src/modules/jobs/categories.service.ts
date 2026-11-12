/**
 * 20 Job Categories Definition & Classification Engine
 *
 * Provides taxonomy and automatic classification for India tech jobs & internships.
 */

export interface JobCategoryDef {
  id: string;
  label: string;
  slug: string;
  description: string;
  keywords: string[];
  skills: string[];
}

export const JOB_CATEGORIES: JobCategoryDef[] = [
  {
    id: "software_development",
    label: "Software Development",
    slug: "software-development",
    description: "Core software engineering, SDE, application development, algorithms, and systems programming.",
    keywords: ["software engineer", "software developer", "sde", "application engineer", "programmer", "trainee programmer", "graduate engineer trainee"],
    skills: ["Data Structures", "Algorithms", "Git", "Problem Solving", "Object-Oriented Programming"]
  },
  {
    id: "fullstack_development",
    label: "Full Stack Development",
    slug: "full-stack-development",
    description: "End-to-end web and cloud application architecture across client and server.",
    keywords: ["full stack", "fullstack", "full-stack", "full stack developer", "full stack intern", "web application developer"],
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "REST APIs", "Tailwind CSS"]
  },
  {
    id: "frontend_development",
    label: "Frontend Development",
    slug: "frontend-development",
    description: "Client-side web architecture, interactive UI components, performance, and responsive web apps.",
    keywords: ["frontend", "front end", "front-end", "ui developer", "web developer", "client engineer"],
    skills: ["JavaScript", "HTML5", "CSS3", "React", "Vue.js", "Angular", "Next.js", "Tailwind"]
  },
  {
    id: "backend_development",
    label: "Backend Development",
    slug: "backend-development",
    description: "Server architecture, microservices, databases, caching, and scalable APIs.",
    keywords: ["backend", "back end", "back-end", "server engineer", "api developer", "backend engineer"],
    skills: ["Node.js", "Java", "Python", "Golang", "PostgreSQL", "Redis", "Docker", "Microservices"]
  },
  {
    id: "mern_stack",
    label: "MERN Stack",
    slug: "mern-stack",
    description: "Full-stack development using MongoDB, Express.js, React, and Node.js.",
    keywords: ["mern", "mern stack", "mern developer", "mongo express react node"],
    skills: ["MongoDB", "Express.js", "React", "Node.js", "JavaScript", "REST APIs"]
  },
  {
    id: "react_js",
    label: "React.js",
    slug: "react-js",
    description: "Specialized React, Next.js, Redux, React Native, and modern frontend component engineering.",
    keywords: ["react", "react.js", "reactjs", "react developer", "next.js", "nextjs"],
    skills: ["React", "React Hooks", "Redux", "Next.js", "TypeScript", "Tailwind CSS"]
  },
  {
    id: "node_js",
    label: "Node.js",
    slug: "node-js",
    description: "Node.js, Express, Fastify, asynchronous backend processing, and microservices.",
    keywords: ["node", "node.js", "nodejs", "node developer", "express.js", "fastify"],
    skills: ["Node.js", "Express", "Fastify", "TypeScript", "MongoDB", "Event Loop"]
  },
  {
    id: "java_development",
    label: "Java Development",
    slug: "java-development",
    description: "Enterprise Java, Spring Boot, Hibernate, microservices, and high-throughput systems.",
    keywords: ["java", "spring boot", "spring", "hibernate", "java developer", "j2ee", "core java"],
    skills: ["Java", "Spring Boot", "Hibernate", "Maven", "PostgreSQL", "Microservices"]
  },
  {
    id: "python_development",
    label: "Python Development",
    slug: "python-development",
    description: "Python application development, Django, FastAPI, Flask, automation, and backend services.",
    keywords: ["python", "django", "fastapi", "flask", "python developer", "python programmer"],
    skills: ["Python", "Django", "FastAPI", "PostgreSQL", "REST APIs", "Docker"]
  },
  {
    id: "artificial_intelligence",
    label: "Artificial Intelligence",
    slug: "artificial-intelligence",
    description: "AI research, generative AI, LLM fine-tuning, retrieval systems, and intelligent agents.",
    keywords: ["artificial intelligence", "ai engineer", "generative ai", "genai", "llm", "deep learning", "neural network"],
    skills: ["Python", "PyTorch", "Hugging Face", "LangChain", "Vector Databases", "Prompt Engineering"]
  },
  {
    id: "machine_learning",
    label: "Machine Learning",
    slug: "machine-learning",
    description: "Predictive modeling, scikit-learn, computer vision, NLP, and MLOps deployment pipelines.",
    keywords: ["machine learning", "ml engineer", "ml intern", "nlp", "computer vision", "tensorflow", "pytorch"],
    skills: ["Machine Learning", "Scikit-Learn", "TensorFlow", "PyTorch", "NumPy", "Pandas"]
  },
  {
    id: "data_science",
    label: "Data Science",
    slug: "data-science",
    description: "Statistical modeling, exploratory data analysis, hypothesis testing, and business data insights.",
    keywords: ["data science", "data scientist", "data science intern", "applied science", "statistician"],
    skills: ["Python", "R", "Pandas", "Statistical Analysis", "Jupyter", "Machine Learning"]
  },
  {
    id: "data_analyst",
    label: "Data Analyst",
    slug: "data-analyst",
    description: "Business analytics, SQL dashboards, Power BI, Tableau, ETL metrics, and business intelligence.",
    keywords: ["data analyst", "business intelligence", "bi analyst", "analytics intern", "data analytics", "sql analyst"],
    skills: ["SQL", "Power BI", "Tableau", "Excel", "Data Visualization", "Python"]
  },
  {
    id: "cloud_computing",
    label: "Cloud Computing",
    slug: "cloud-computing",
    description: "Cloud infrastructure across AWS, GCP, and Azure, Terraform, serverless architectures, and IAM.",
    keywords: ["cloud engineer", "cloud architect", "aws engineer", "azure engineer", "gcp engineer", "cloud practitioner"],
    skills: ["AWS", "Google Cloud", "Microsoft Azure", "Terraform", "Serverless", "IAM"]
  },
  {
    id: "devops",
    label: "DevOps",
    slug: "devops",
    description: "CI/CD automation, Kubernetes, Docker, observability, site reliability (SRE), and Linux.",
    keywords: ["devops", "sre", "site reliability", "kubernetes", "ci/cd", "infrastructure engineer"],
    skills: ["Docker", "Kubernetes", "CI/CD", "Linux", "Terraform", "Prometheus", "Grafana"]
  },
  {
    id: "cybersecurity",
    label: "Cybersecurity",
    slug: "cybersecurity",
    description: "Application security, penetration testing, SOC operations, network defense, and compliance.",
    keywords: ["cybersecurity", "security engineer", "infosec", "soc analyst", "penetration tester", "ethical hacker", "devsecops"],
    skills: ["Network Security", "Penetration Testing", "OWASP", "SIEM", "Linux", "Cryptography"]
  },
  {
    id: "ui_ux_design",
    label: "UI/UX Design",
    slug: "ui-ux-design",
    description: "User experience research, wireframing, high-fidelity prototypes, Figma, and design systems.",
    keywords: ["ui/ux", "ux designer", "ui designer", "product designer", "user experience", "visual designer"],
    skills: ["Figma", "Design Systems", "Wireframing", "User Research", "Prototyping", "Adobe XD"]
  },
  {
    id: "product_management",
    label: "Product Management",
    slug: "product-management",
    description: "Product strategy, user roadmap planning, feature specs, Agile execution, and growth metrics.",
    keywords: ["product manager", "associate product manager", "apm", "product intern", "product owner"],
    skills: ["Product Roadmap", "Agile", "User Stories", "Market Research", "Metrics & KPIs", "Jira"]
  },
  {
    id: "business_analyst",
    label: "Business Analyst",
    slug: "business-analyst",
    description: "Requirements gathering, functional specifications, stakeholder communication, and process workflows.",
    keywords: ["business analyst", "ba intern", "systems analyst", "functional analyst", "operations analyst"],
    skills: ["Business Analysis", "Requirements Gathering", "UML", "SQL", "Stakeholder Management"]
  },
  {
    id: "other_engineering",
    label: "Other Engineering Roles",
    slug: "other-engineering",
    description: "QA/Testing, embedded systems, hardware, robotics, mobile (iOS/Android/Flutter), and emerging tech.",
    keywords: ["qa", "testing", "tester", "mobile", "android", "ios", "flutter", "embedded", "robotics", "iot"],
    skills: ["Testing", "Selenium", "Mobile Development", "Git", "Problem Solving"]
  }
];

export class JobCategoryClassifier {
  /**
   * Classify a job into one of the 20 canonical categories.
   */
  public static classify(title: string, description: string = "", skills: string[] = []): JobCategoryDef {
    const textToMatch = `${title} ${description} ${skills.join(" ")}`.toLowerCase();

    // Priority checks for specific stacks
    if (textToMatch.includes("mern") || (textToMatch.includes("mongo") && textToMatch.includes("react") && textToMatch.includes("node"))) {
      return JOB_CATEGORIES.find(c => c.id === "mern_stack")!;
    }
    if (textToMatch.includes("react") && !textToMatch.includes("full stack")) {
      return JOB_CATEGORIES.find(c => c.id === "react_js")!;
    }
    if (textToMatch.includes("node") && !textToMatch.includes("full stack") && !textToMatch.includes("mern")) {
      return JOB_CATEGORIES.find(c => c.id === "node_js")!;
    }
    if (textToMatch.includes("spring boot") || (textToMatch.includes("java") && textToMatch.includes("backend"))) {
      return JOB_CATEGORIES.find(c => c.id === "java_development")!;
    }
    if (textToMatch.includes("django") || textToMatch.includes("fastapi") || (textToMatch.includes("python") && textToMatch.includes("developer"))) {
      return JOB_CATEGORIES.find(c => c.id === "python_development")!;
    }

    // Match by score across categories
    let bestMatch: JobCategoryDef = JOB_CATEGORIES[0];
    let highestScore = 0;

    for (const cat of JOB_CATEGORIES) {
      let score = 0;
      for (const kw of cat.keywords) {
        if (textToMatch.includes(kw.toLowerCase())) {
          score += 3;
        }
      }
      for (const sk of cat.skills) {
        if (textToMatch.includes(sk.toLowerCase())) {
          score += 1;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = cat;
      }
    }

    if (highestScore === 0) {
      return JOB_CATEGORIES.find(c => c.id === "software_development")!;
    }

    return bestMatch;
  }
}

