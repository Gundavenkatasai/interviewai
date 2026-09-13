export interface ATSCategoryWeights {
  parsing: number;
  structure: number;
  formatting: number;
  keywords: number;
  jobAlignment: number;
  content: number;
}

export interface ScoreBand {
  min: number;
  grade: string;
  label: string;
  color: string;
}

export interface ATSProfile {
  label: string;
  strictness: number;
  note: string;
}

export interface CountryConvention {
  spelling: "US" | "UK";
  photoExpected: boolean;
  dateFormat: string;
  resumeName: string;
  note: string;
}

export interface JobCategory {
  id: string;
  name: string;
  roles: string[];
}

export const ATS_RULES = {
  categoryWeights: {
    parsing: 0.10,
    structure: 0.14,
    formatting: 0.14,
    keywords: 0.22,
    jobAlignment: 0.20,
    content: 0.20
  } as Record<string, number>,

  scoreBands: [
    { min: 90, grade: "A+", label: "Excellent", color: "#10b981" },
    { min: 80, grade: "A", label: "Very Good", color: "#10b981" },
    { min: 70, grade: "B", label: "Good", color: "#3b82f6" },
    { min: 60, grade: "C", label: "Fair", color: "#f59e0b" },
    { min: 50, grade: "D", label: "Needs Work", color: "#f97316" },
    { min: 0, grade: "F", label: "Poor", color: "#ef4444" }
  ] as ScoreBand[],

  atsProfiles: {
    generic: {
      label: "Generic ATS",
      strictness: 1.0,
      note: "Standard keyword + structure parsing, tolerant of minor formatting issues."
    },
    strict: {
      label: "Strict / Legacy ATS",
      strictness: 1.25,
      note: "Older enterprise systems (e.g. Taleo-style). Penalizes tables, columns, graphics, and non-standard headers heavily."
    },
    modern: {
      label: "Modern / AI-assisted ATS",
      strictness: 0.85,
      note: "Newer systems with semantic matching. More forgiving of synonyms and layout, still penalizes missing keywords."
    }
  } as Record<string, ATSProfile>,

  seniorityExpectedYears: {
    "Intern": [0, 1],
    "Entry / Junior": [0, 2],
    "Mid-level": [2, 5],
    "Senior": [5, 10],
    "Lead / Principal": [8, 30]
  } as Record<string, [number, number]>,

  countryConventions: {
    "USA": { spelling: "US", photoExpected: false, dateFormat: "MM/DD/YYYY", resumeName: "Resume", note: "No photo, no age, no marital status. 1 page preferred for <10 yrs experience." },
    "UK": { spelling: "UK", photoExpected: false, dateFormat: "DD/MM/YYYY", resumeName: "CV", note: "Called a CV. No photo. Can run 2 pages." },
    "Canada": { spelling: "US", photoExpected: false, dateFormat: "MM/DD/YYYY", resumeName: "Resume", note: "Similar to US conventions." },
    "Australia": { spelling: "UK", photoExpected: false, dateFormat: "DD/MM/YYYY", resumeName: "Resume", note: "No photo. 2-3 pages acceptable." },
    "Germany": { spelling: "UK", photoExpected: true, dateFormat: "DD.MM.YYYY", resumeName: "Lebenslauf", note: "Photo and personal details more common, but increasingly optional." },
    "Singapore": { spelling: "UK", photoExpected: false, dateFormat: "DD/MM/YYYY", resumeName: "Resume", note: "US/UK hybrid conventions." },
    "India": { spelling: "UK", photoExpected: false, dateFormat: "DD/MM/YYYY", resumeName: "Resume/CV", note: "Photo optional, increasingly discouraged for corporate roles." },
    "Bangladesh": { spelling: "UK", photoExpected: true, dateFormat: "DD/MM/YYYY", resumeName: "CV", note: "Photo commonly included; keep professional and recent." }
  } as Record<string, CountryConvention>,

  formattingRisks: {
    maxRecommendedPages: 2,
    minWordsWarn: 150,
    maxWordsWarn: 1100,
    idealBulletLength: [8, 28] as [number, number]
  }
};

export const KEYWORDS_DATA = {
  stopwords: [
    "a","an","the","and","or","but","of","in","on","at","to","for","with","by","is","are","was","were","be","been",
    "being","this","that","these","those","it","its","as","from","into","than","then","so","such","also","will",
    "would","can","could","should","may","might","must","have","has","had","do","does","did","not","no","yes","i",
    "we","you","he","she","they","them","his","her","their","our","your","seeking","looking","responsible",
    "requirements","qualifications","experience","candidate","role","job","description","plus","years",
    "preferred","knowledge","skills","ability","ideal","successful","position","opportunity","team","work"
  ],

  certifications: [
    "AWS Certified", "Azure Certified", "Google Cloud Certified", "PMP", "Scrum Master", "CSM", "Six Sigma",
    "CPA", "CFA", "CISSP", "CompTIA", "Cisco CCNA", "Cisco CCNP", "Oracle Certified", "Salesforce Certified",
    "Microsoft Certified", "ITIL", "CEH", "OSCP", "Meta Certified", "IBM Certified", "Coursera Certificate",
    "Udemy Certificate", "HubSpot Certified", "Google Analytics Certified", "Google Ads Certified", "SHRM-CP", "PHR"
  ],

  tech_stack: [
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin",
    "React", "Angular", "Vue", "Node.js", "Django", "Flask", "Spring Boot", "Laravel", ".NET", "AWS", "Azure",
    "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins", "Git", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "TensorFlow", "PyTorch", "Pandas", "NumPy", "Power BI", "Tableau", "Excel", "Figma", "Photoshop", "Salesforce",
    "SAP", "Jira", "Confluence"
  ],

  section_headers: {
    contact: ["contact", "contact information", "personal information", "contact details"],
    summary: ["summary", "professional summary", "objective", "career objective", "profile", "about me", "executive summary"],
    experience: ["experience", "work experience", "employment history", "professional experience", "career history", "work history"],
    education: ["education", "academic background", "qualifications", "academic history"],
    skills: ["skills", "technical skills", "core competencies", "key skills", "expertise", "technologies"],
    projects: ["projects", "personal projects", "key projects", "notable projects"],
    certifications: ["certifications", "certificates", "licenses"],
    awards: ["awards", "honors", "achievements"],
    publications: ["publications", "papers"],
    research: ["research", "research experience"],
    languages: ["languages", "language proficiency"],
    volunteer: ["volunteer", "volunteering", "community service"],
    references: ["references"]
  } as Record<string, string[]>
};

export const ACTION_VERBS_DATA = {
  strong: [
    "achieved", "accelerated", "architected", "automated", "boosted", "built", "championed", "closed",
    "coordinated", "created", "cut", "decreased", "delivered", "designed", "developed", "directed", "drove",
    "eliminated", "engineered", "enhanced", "established", "executed", "expanded", "generated", "grew",
    "implemented", "improved", "increased", "initiated", "launched", "led", "managed", "mentored", "negotiated",
    "optimized", "orchestrated", "overhauled", "pioneered", "produced", "reduced", "redesigned", "resolved",
    "restructured", "saved", "scaled", "secured", "spearheaded", "streamlined", "strengthened", "transformed", "upgraded"
  ],

  weak: [
    "responsible for", "worked on", "helped with", "assisted with", "involved in", "participated in",
    "tasked with", "duties included", "in charge of", "dealt with", "handled", "did", "was part of",
    "various", "things", "stuff", "etc", "good communication skills", "hard working", "team player",
    "detail oriented", "go-getter", "synergy", "dynamic", "results-driven", "self-starter"
  ],

  buzzwords: [
    "synergy", "thought leader", "ninja", "rockstar", "guru", "go-getter", "team player", "hard worker",
    "results-driven", "dynamic", "proactive", "detail oriented", "outside the box", "value add", "circle back",
    "best of breed", "game changer", "wheelhouse"
  ]
};

export const SKILLS_DATA: Record<string, string[]> = {
  "software-engineering": ["JavaScript","TypeScript","Python","Java","C++","Git","REST API","SQL","Data Structures","Algorithms","CI/CD","Unit Testing","Agile","System Design","Object-Oriented Programming","Debugging","Docker","Version Control"],
  "ai-data": ["Python","SQL","Machine Learning","TensorFlow","PyTorch","Pandas","NumPy","Data Visualization","Statistics","Feature Engineering","A/B Testing","Data Pipelines","Model Deployment","NLP","Deep Learning"],
  "devops-cloud": ["AWS","Azure","GCP","Kubernetes","Docker","Terraform","CI/CD","Linux","Ansible","Jenkins","Monitoring","Bash Scripting","Infrastructure as Code","Networking","Load Balancing"],
  "cybersecurity": ["Network Security","SIEM","Penetration Testing","Vulnerability Assessment","Firewalls","Incident Response","Risk Assessment","ISO 27001","OWASP","Threat Modeling","Encryption","Compliance"],
  "networking-it": ["TCP/IP","DNS","VPN","Windows Server","Active Directory","Cisco","Troubleshooting","LAN/WAN","Help Desk Support","Hardware Maintenance","ITIL"],
  "qa-testing": ["Test Planning","Selenium","Manual Testing","Automation Testing","JIRA","Regression Testing","API Testing","Test Cases","Bug Tracking","Performance Testing","Cypress"],
  "ui-ux-creative": ["Figma","Adobe XD","Wireframing","Prototyping","User Research","Sketch","Photoshop","Illustrator","Design Systems","Usability Testing","Interaction Design","Typography"],
  "product-project": ["Roadmapping","Agile","Scrum","Stakeholder Management","JIRA","Backlog Management","User Stories","Prioritization","Risk Management","Product Strategy","KPI Tracking"],
  "business-ops": ["Process Improvement","Data Analysis","Stakeholder Management","SOPs","Reporting","Cross-functional Collaboration","Excel","Forecasting","Budgeting"],
  "marketing": ["SEO","Google Analytics","Content Strategy","Google Ads","Social Media Marketing","Email Marketing","A/B Testing","Copywriting","CRM","Campaign Management","Marketing Automation"],
  "sales": ["CRM","Lead Generation","Negotiation","Pipeline Management","Cold Calling","Salesforce","Account Management","Closing","Forecasting","Client Relationship Management"],
  "content-media": ["Copywriting","SEO Writing","Editing","Content Strategy","CMS","Proofreading","Storytelling","AP Style","Research"],
  "finance-accounting": ["Excel","Financial Modeling","Bookkeeping","GAAP","Reconciliation","Budgeting","Forecasting","QuickBooks","Tax Preparation","Auditing","Accounts Payable"],
  "banking": ["Credit Analysis","Risk Assessment","Loan Processing","KYC","Compliance","Financial Statements","Customer Relationship Management"],
  "human-resources": ["Recruitment","Onboarding","HRIS","Employee Relations","Performance Management","Compensation & Benefits","Talent Acquisition","Labor Law","Training & Development"],
  "healthcare": ["Patient Care","Clinical Documentation","HIPAA","EMR/EHR","Medical Terminology","Vital Signs","Care Coordination","Infection Control"],
  "education": ["Curriculum Development","Lesson Planning","Classroom Management","Student Assessment","LMS","Differentiated Instruction","Educational Technology"],
  "engineering": ["AutoCAD","Project Management","MATLAB","SolidWorks","Structural Analysis","Technical Documentation","Quality Control","Safety Compliance"],
  "architecture-construction": ["AutoCAD","Revit","Blueprint Reading","Building Codes","Project Scheduling","Site Supervision","Cost Estimation"],
  "legal": ["Contract Drafting","Legal Research","Compliance","Litigation Support","Negotiation","Due Diligence","Regulatory Filings"],
  "government-public": ["Policy Analysis","Public Administration","Report Writing","Stakeholder Engagement","Regulatory Compliance"],
  "hospitality-tourism": ["Guest Relations","Reservation Systems","POS Systems","Menu Planning","Event Coordination","Hospitality Management"],
  "logistics-supply": ["Inventory Management","Supply Chain Planning","Procurement","Warehouse Management","ERP","Vendor Management","Demand Forecasting"],
  "manufacturing": ["Lean Manufacturing","Six Sigma","Quality Control","Production Planning","Safety Compliance","Root Cause Analysis"],
  "retail-ecommerce": ["Inventory Management","POS Systems","Merchandising","E-commerce Platforms","Customer Service","Sales Forecasting","Amazon Seller Central"],
  "customer-service": ["Customer Support","CRM","Conflict Resolution","Ticketing Systems","Communication","Problem Solving"],
  "administration": ["Scheduling","Microsoft Office","Correspondence","Data Entry","Office Management","Travel Coordination"],
  "ngo-development": ["Program Management","Monitoring & Evaluation","Grant Writing","Community Outreach","Stakeholder Engagement","Report Writing"],
  "freelancing": ["Client Management","Time Management","Self-Management","Communication","Project Delivery","Invoicing"],
  "other": ["Communication","Problem Solving","Leadership","Research","Project Management","Critical Thinking"]
};

export const JOB_ROLES_DATA: { categories: JobCategory[] } = {
  categories: [
    { id: "software-engineering", name: "Software Engineering", roles: [
      "Software Engineer","Software Developer","Full Stack Developer","Frontend Developer","Backend Developer","Web Developer","Mobile App Developer","Android Developer","iOS Developer","React Developer","Angular Developer","Vue.js Developer","Node.js Developer","PHP Developer","Laravel Developer","Python Developer","Java Developer","Spring Boot Developer",".NET Developer","C# Developer","C++ Developer","Go Developer","Rust Developer","Ruby on Rails Developer","WordPress Developer","Shopify Developer","WooCommerce Developer","Magento Developer","Drupal Developer","API Developer","Microservices Engineer","Embedded Software Engineer","Firmware Engineer","Game Developer","Unity Developer","Unreal Engine Developer"
    ]},
    { id: "ai-data", name: "Artificial Intelligence & Data", roles: [
      "Data Scientist","Data Analyst","Business Intelligence Analyst","Machine Learning Engineer","AI Engineer","NLP Engineer","Computer Vision Engineer","Deep Learning Engineer","MLOps Engineer","Data Engineer","Big Data Engineer","Analytics Engineer","Research Scientist","Statistician","Quantitative Analyst"
    ]},
    { id: "devops-cloud", name: "DevOps & Cloud", roles: [
      "DevOps Engineer","Cloud Engineer","AWS Engineer","Azure Engineer","Google Cloud Engineer","Site Reliability Engineer","Platform Engineer","Infrastructure Engineer","Kubernetes Engineer","Docker Engineer"
    ]},
    { id: "cybersecurity", name: "Cybersecurity", roles: [
      "Cybersecurity Analyst","Security Engineer","Penetration Tester","SOC Analyst","Information Security Analyst","Network Security Engineer","Cloud Security Engineer","Security Consultant"
    ]},
    { id: "networking-it", name: "Networking & IT Support", roles: [
      "Network Engineer","System Administrator","IT Administrator","IT Support Specialist","Help Desk Engineer","Desktop Support Engineer","Technical Support Engineer"
    ]},
    { id: "qa-testing", name: "QA & Testing", roles: [
      "QA Engineer","Software Tester","Automation Tester","Test Engineer","Performance Tester","Manual Tester"
    ]},
    { id: "ui-ux-creative", name: "UI / UX / Creative", roles: [
      "UI Designer","UX Designer","UI/UX Designer","Product Designer","Graphic Designer","Motion Designer","Illustrator","Brand Designer","Visual Designer","Web Designer"
    ]},
    { id: "product-project", name: "Product & Project Management", roles: [
      "Product Manager","Associate Product Manager","Technical Product Manager","Project Manager","Program Manager","Scrum Master","Agile Coach","Delivery Manager"
    ]},
    { id: "business-ops", name: "Business & Operations", roles: [
      "Business Analyst","Operations Manager","Operations Executive","Business Development Executive","Strategy Consultant","Management Consultant"
    ]},
    { id: "marketing", name: "Marketing", roles: [
      "Digital Marketing Specialist","SEO Specialist","Local SEO Specialist","Technical SEO Specialist","PPC Specialist","SEM Specialist","Social Media Manager","Social Media Executive","Email Marketing Specialist","Content Marketing Specialist","Marketing Manager","Growth Marketer","Performance Marketer","Affiliate Marketing Specialist","Influencer Marketing Manager"
    ]},
    { id: "sales", name: "Sales", roles: [
      "Sales Executive","Sales Manager","Account Executive","Business Development Manager","Customer Success Manager","Customer Success Executive","Inside Sales Representative","Outside Sales Representative"
    ]},
    { id: "content-media", name: "Content & Media", roles: [
      "Content Writer","Copywriter","Technical Writer","Blogger","Journalist","Editor","Proofreader","Script Writer","Video Editor","Content Creator"
    ]},
    { id: "finance-accounting", name: "Finance & Accounting", roles: [
      "Accountant","Senior Accountant","Bookkeeper","Auditor","Internal Auditor","Tax Consultant","Financial Analyst","Finance Manager","Payroll Specialist","Cost Accountant","Investment Analyst"
    ]},
    { id: "banking", name: "Banking", roles: [
      "Banking Officer","Relationship Manager","Credit Analyst","Loan Officer","Branch Manager","Treasury Analyst"
    ]},
    { id: "human-resources", name: "Human Resources", roles: [
      "HR Executive","HR Manager","Recruiter","Talent Acquisition Specialist","HR Business Partner","Learning & Development Specialist","Compensation Analyst"
    ]},
    { id: "healthcare", name: "Healthcare", roles: [
      "Doctor","Medical Officer","Nurse","Pharmacist","Medical Technologist","Lab Technician","Healthcare Administrator","Clinical Research Associate"
    ]},
    { id: "education", name: "Education", roles: [
      "Teacher","Lecturer","Assistant Professor","Professor","Research Assistant","Research Associate","Academic Coordinator","Trainer"
    ]},
    { id: "engineering", name: "Engineering", roles: [
      "Civil Engineer","Structural Engineer","Mechanical Engineer","Electrical Engineer","Electronics Engineer","Industrial Engineer","Chemical Engineer","Petroleum Engineer","Marine Engineer","Aerospace Engineer"
    ]},
    { id: "architecture-construction", name: "Architecture & Construction", roles: [
      "Architect","Interior Designer","Quantity Surveyor","Construction Manager","Site Engineer"
    ]},
    { id: "legal", name: "Legal", roles: [
      "Lawyer","Legal Advisor","Legal Consultant","Compliance Officer","Contract Manager","Corporate Counsel"
    ]},
    { id: "government-public", name: "Government & Public Sector", roles: [
      "Administrative Officer","Government Officer","Public Relations Officer","Foreign Service Officer"
    ]},
    { id: "hospitality-tourism", name: "Hospitality & Tourism", roles: [
      "Hotel Manager","Restaurant Manager","Chef","Sous Chef","Front Desk Executive","Travel Consultant","Tour Manager"
    ]},
    { id: "logistics-supply", name: "Logistics & Supply Chain", roles: [
      "Supply Chain Manager","Logistics Coordinator","Procurement Specialist","Warehouse Manager","Inventory Manager","Operations Coordinator"
    ]},
    { id: "manufacturing", name: "Manufacturing", roles: [
      "Production Engineer","Production Manager","Quality Engineer","Plant Manager","Maintenance Engineer"
    ]},
    { id: "retail-ecommerce", name: "Retail & E-commerce", roles: [
      "Store Manager","Retail Manager","Merchandiser","E-commerce Manager","Amazon Specialist","Shopify Store Manager"
    ]},
    { id: "customer-service", name: "Customer Service", roles: [
      "Customer Support Executive","Call Center Agent","Customer Care Representative","Technical Customer Support"
    ]},
    { id: "administration", name: "Administration", roles: [
      "Administrative Assistant","Executive Assistant","Office Manager","Office Administrator","Receptionist"
    ]},
    { id: "ngo-development", name: "NGO & Development", roles: [
      "Program Officer","Monitoring & Evaluation Officer","Project Coordinator","Development Officer"
    ]},
    { id: "freelancing", name: "Freelancing", roles: [
      "Freelancer","Virtual Assistant","Remote Consultant","Online Tutor"
    ]},
    { id: "other", name: "Other", roles: [
      "Researcher","Scientist","Entrepreneur","Founder","Co-Founder","Startup Advisor","Consultant","Trainer","Public Speaker"
    ]}
  ]
};
