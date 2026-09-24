import { Project } from "../types";

export const PROJECTS: Project[] = [
  {
    id: "interviewai",
    title: "InterviewAI",
    category: "AI & SPEECH PROCESSING",
    tagline: "Autonomous Technical & Algorithmic Mock Interview Platform",
    description: "An AI-powered mock interview simulator engineered with live speech transcription, dynamic follow-up questioning, real-time Monaco code execution, and 8-dimensional rubric evaluation.",
    detailedOverview: "InterviewAI simulates high-bar technical, HR, and coding interviews. Built with FastAPI and Next.js, it leverages Groq Whisper for sub-second speech transcription and high-speed LLMs (gpt-oss-120b / qwen3.8-27b) for strict Pydantic JSON evaluations. Includes an interactive multi-language Monaco sandbox (Python, JS, Java, C++) backed by Piston and PostgreSQL persistence.",
    highlights: [
      "Pluggable dual-engine speech pipeline pairing zero-latency Web Speech API with Groq Whisper audio chunking",
      "Dynamic contextual follow-up questioning driven by real-time verbal transcript parsing",
      "Integrated Monaco Editor with Piston sandbox code execution across 4 major languages",
      "Comprehensive 8-dimensional rubric grading (correctness, depth, communication, problem-solving, etc.)",
      "Production-ready Docker Compose orchestration for FastAPI, PostgreSQL, and Piston runner"
    ],
    technologies: ["FastAPI", "Python 3.13", "Next.js 15", "Groq Cloud API", "Whisper STT", "Monaco Editor", "PostgreSQL", "Docker", "Piston", "Tailwind CSS"],
    metrics: [
      { label: "Speech Latency", value: "<450ms" },
      { label: "Rubric Dimensions", value: "8 Axes" },
      { label: "Languages Executed", value: "4 Targets" },
      { label: "Architecture", value: "Dockerized" }
    ],
    githubUrl: "https://github.com/Gundavenkatasai/interviewai",
    accentColor: "#0284c7",
    secondaryColor: "#38bdf8",
    featured: true,
    type: "ai"
  },
  {
    id: "pizza_craft",
    title: "PizzaCraft",
    category: "FULL-STACK & REAL-TIME WEBSOCKETS",
    tagline: "Unified Multi-Portal Food-Ordering & Operations Ecosystem",
    description: "Full-stack food commerce suite uniting a high-fidelity customer ordering application, restaurant kitchen admin panel, and super-admin operations dashboard with synchronized WebSockets.",
    detailedOverview: "Engineered as an enterprise multi-portal system with 105+ menu items. Features live order synchronization via Socket.IO across 4 distinct lifecycle stages (Received, Preparing, Out for Delivery, Delivered), Razorpay payment gateway integration with server-side price recalculation, 8% GST audit rules, and strict role-based access control (RBAC).",
    highlights: [
      "Tri-portal architecture: unified customer storefront, kitchen management, and executive control hub",
      "Bidirectional Socket.IO event orchestration for instant order status dispatch without polling",
      "Server-side order total recalculation with ad-blocker network guards and Razorpay API v1",
      "Automated MongoDB Atlas database seeding scripts delivering 105+ item configurations",
      "Deployed with dual-layer cloud resilience across Vercel serverless rewrites and Render backend services"
    ],
    technologies: ["React 18", "TypeScript", "Node.js", "Express.js", "Socket.IO", "MongoDB Atlas", "Mongoose", "Razorpay", "Tailwind CSS", "Vercel", "Render"],
    metrics: [
      { label: "Menu Catalog", value: "105+ Items" },
      { label: "Order Lifecycle", value: "4 Stages" },
      { label: "Portals Unified", value: "3 Surfaces" },
      { label: "Live Sync", value: "Socket.IO" }
    ],
    githubUrl: "https://github.com/Gundavenkatasai/pizza_craft",
    liveUrl: "https://pizza-craft-1zi3.vercel.app/",
    accentColor: "#ea580c",
    secondaryColor: "#f97316",
    featured: true,
    type: "realtime"
  },
  {
    id: "lpulive",
    title: "LPU Live",
    category: "CAMPUS REAL-TIME COMMUNICATION",
    tagline: "Identity-First University Messaging & Collaboration Platform",
    description: "Real-time communication platform tailored for university ecosystems, authenticating users via institutional Registration Numbers with Socket.IO instant messaging and live telemetry.",
    detailedOverview: "Built to provide seamless campus-wide interaction, LPU Live replaces phone-number identification with student and faculty Registration Numbers. Features Socket.IO powered chat rooms, live typing indicators, delivery and read receipts (blue/white ticks), file exchange for academic documents, and university-branded orange aesthetics with persistent MongoDB storage.",
    highlights: [
      "Institutional Registration-Number authentication with bcrypt password hashing and JWT authorization",
      "Real-time bidirectional message dispatch with immediate delivery and blue-tick read receipts",
      "Live presence detection displaying active peer status and typing indicators",
      "Multi-channel architecture supporting personal direct messaging, group channels, and university broadcasts",
      "Academic document distribution supporting PDF, DOCX, and media uploads"
    ],
    technologies: ["React", "Vite", "Node.js", "Express.js", "Socket.IO", "MongoDB", "JWT", "Bcrypt", "Tailwind CSS"],
    metrics: [
      { label: "Auth Protocol", value: "Reg-Number" },
      { label: "Real-Time Engine", value: "Socket.IO" },
      { label: "Presence Tracking", value: "Sub-Second" },
      { label: "Security", value: "JWT + Bcrypt" }
    ],
    githubUrl: "https://github.com/Gundavenkatasai/lpulive",
    accentColor: "#ea580c",
    secondaryColor: "#fb923c",
    featured: true,
    type: "realtime"
  },
  {
    id: "queue_analytics",
    title: "Queue Analytics System",
    category: "COMPUTER VISION & REAL-TIME ML",
    tagline: "YOLOv8 & ByteTrack Vision Engine for Real-Time Crowd Density",
    description: "High-throughput computer vision pipeline using YOLOv8n and ByteTrack multi-object tracking to analyze queue dynamics, person counts, and flow rates with live dashboard telemetry.",
    detailedOverview: "Engineered for real-time facility monitoring, this vision system processes video streams using an optimized YOLOv8 nano model with centroid tracking and frame-skipping algorithms. Detection statistics are published to a Flask REST API backend and visualized on an auto-refreshing React operations dashboard with temporal area charts and entry/exit counters.",
    highlights: [
      "YOLOv8n object detection model tuned for rapid pedestrian recognition (60+ FPS on GPU, 30+ FPS CPU)",
      "ByteTrack multi-object centroid tracking maintaining accurate identity trails across camera frames",
      "Real-time analytics engine calculating active queue length, total foot traffic, and entry/exit rates",
      "Flask REST API backend handling high-frequency metrics ingest under 100ms response times",
      "Interactive operations dashboard with 2-second auto-refresh polling and historical area trends"
    ],
    technologies: ["Python 3.13", "YOLOv8 (Ultralytics)", "OpenCV", "ByteTrack", "Flask", "React", "Recharts", "CUDA"],
    metrics: [
      { label: "GPU Inference", value: "60+ FPS" },
      { label: "CPU Inference", value: "30+ FPS" },
      { label: "API Response", value: "<100ms" },
      { label: "Model Footprint", value: "~40MB (Nano)" }
    ],
    githubUrl: "https://github.com/Gundavenkatasai/Queue-Analytics-System-",
    accentColor: "#10b981",
    secondaryColor: "#34d399",
    featured: true,
    type: "cv"
  },
  {
    id: "smart_audit_ai",
    title: "Smart-Audit AI",
    category: "AI CALL INTELLIGENCE & QA",
    tagline: "Automated Speech-to-Text & Sentiment Compliance Engine",
    description: "Enterprise call-center QA dashboard processing 100+ daily support recordings with Deepgram speech-to-text, multilingual Hindi/English diarization, and SOP deviation tracking.",
    detailedOverview: "Built to eliminate manual customer call auditing, Smart-Audit AI extracts verbatim dialogue, segments speakers, and evaluates agent tone and adherence to standard operating procedures. Results are plotted across 10+ analytical metrics in Recharts to highlight escalation triggers and customer sentiment shifts.",
    highlights: [
      "Deepgram Nova-2 speech-to-text integration with dual-channel Hindi and English transcription",
      "Automated sentiment intelligence tracking customer frustration inflection points",
      "SOP compliance scoring detecting greeting compliance, resolution speed, and escalation rules",
      "Dynamic operational analytics dashboard built with React and Recharts"
    ],
    technologies: ["React", "Vite", "JavaScript", "Tailwind CSS", "Recharts", "Deepgram API", "Context API", "Google Sheets API"],
    metrics: [
      { label: "Audited Calls", value: "100+/Day" },
      { label: "Languages", value: "Hindi & English" },
      { label: "Analytics Charts", value: "10+ Metrics" }
    ],
    githubUrl: "https://github.com/Gundavenkatasai",
    accentColor: "#8b5cf6",
    secondaryColor: "#a78bfa",
    featured: false,
    type: "ai"
  },
  {
    id: "movieguru",
    title: "MovieGuru",
    category: "AI STREAMING & VECTOR SEARCH",
    tagline: "High-Availability Streaming Engine with Vector Recommendations",
    description: "Full-stack streaming platform with PostgreSQL/Prisma relational persistence, vector-similarity content recommendations, and automated 6-provider streaming failover.",
    detailedOverview: "Designed with a robust relational architecture spanning 5+ models for user accounts, watchlists, and cross-device bookmarking. Powered by a dedicated Python/FastAPI microservice executing vector cosine-similarity across 1,000+ titles with TMDB and YouTube metadata pipelines.",
    highlights: [
      "Prisma ORM data modeling over PostgreSQL ensuring transactional consistency for watch sessions",
      "FastAPI vector-similarity recommendation microservice indexing 1,000+ media entries",
      "Multi-provider streaming fallback architecture switching sources within 10 seconds during playback stalls",
      "State management engineered with Redux Toolkit and modern TypeScript React components"
    ],
    technologies: ["React", "TypeScript", "Redux Toolkit", "Prisma", "PostgreSQL", "Python", "FastAPI", "TMDB API"],
    metrics: [
      { label: "Indexed Titles", value: "1,000+" },
      { label: "Failover Providers", value: "6 Sources" },
      { label: "Switch Timeout", value: "10 Seconds" }
    ],
    githubUrl: "https://github.com/Gundavenkatasai",
    accentColor: "#ec4899",
    secondaryColor: "#f472b6",
    featured: false,
    type: "fullstack"
  },
  {
    id: "document_intelligence",
    title: "Document Intelligence Service",
    category: "DISTRIBUTED ASYNC DOCUMENT AI",
    tagline: "High-Throughput Exam Question Extraction & Answer Matching",
    description: "Asynchronous microservice utilizing FastAPI, Celery, Redis, and OpenCV deskewing to extract examination questions from multi-page PDFs and match against answer keys.",
    detailedOverview: "Engineered to ingest complex academic exam papers and raster scans. Employs OpenCV deskewing algorithms and Tesseract OCR pipelines, orchestrating asynchronous tasks via Celery and Redis. Feeds extracted structured payloads into a human review queue with confidence scoring and automated answer key matching.",
    highlights: [
      "Asynchronous Celery task processing with Redis broker handling multi-megabyte PDF parsing",
      "OpenCV preprocessing pipeline featuring rotation correction, noise removal, and layout segmentation",
      "Automated question-to-answer key pairing algorithm with confidence-threshold human verification queues",
      "Interactive OpenAPI Swagger documentation, ReDoc endpoints, and Docker Compose deployment"
    ],
    technologies: ["FastAPI", "Python 3.11", "Celery", "Redis", "PostgreSQL", "OpenCV", "Tesseract OCR", "Docker Compose"],
    metrics: [
      { label: "Pipeline Arch", value: "Async Celery" },
      { label: "Test Coverage", value: "80%+ Pytest" },
      { label: "Queue Broker", value: "Redis" }
    ],
    githubUrl: "https://github.com/Gundavenkatasai/Document_intelligence_Question_Extraction_Service",
    accentColor: "#06b6d4",
    secondaryColor: "#22d3ee",
    featured: false,
    type: "ai"
  },
  {
    id: "stock_advisor",
    title: "AI Real-Time Stock Advisor",
    category: "FINANCIAL INTELLIGENCE",
    tagline: "Predictive Market Telemetry & Investment Analytics Engine",
    description: "Machine learning market analysis tool calculating equity risk indices, historical trend forecasts, and real-time investment signals using Python data science libraries.",
    detailedOverview: "Built with Python, Scikit-learn, and Pandas to ingest financial datasets, compute moving averages, forecast directional indicators, and display actionable portfolio risk evaluations through a clean web dashboard.",
    highlights: [
      "Automated time-series data aggregation utilizing Pandas and NumPy mathematical transforms",
      "Predictive machine learning models trained for trend forecasting and volatility classification",
      "Risk metric calculation weighting beta, Sharpe ratio approximations, and historical drawdowns",
      "Lightweight web interface for interactive stock exploration and scenario backtesting"
    ],
    technologies: ["Python", "Pandas", "NumPy", "Scikit-Learn", "Flask", "HTML5", "CSS3"],
    metrics: [
      { label: "Core Library", value: "Scikit-Learn" },
      { label: "Data Pipeline", value: "Pandas/NumPy" },
      { label: "Output", value: "Risk Indices" }
    ],
    githubUrl: "https://github.com/Gundavenkatasai/AI-RealTime-Stock-Advisor",
    accentColor: "#eab308",
    secondaryColor: "#fde047",
    featured: false,
    type: "ai"
  },
  {
    id: "farmer_marketplace",
    title: "AgriMarket - Farmers' Marketplace",
    category: "E-COMMERCE & SUPPLY CHAIN",
    tagline: "Direct Farmer-to-Supplier Agricultural Marketplace",
    description: "Full-stack marketplace connecting agricultural producers directly with verified seed and fertilizer distributors, featuring price discovery and order management.",
    detailedOverview: "Developed to eliminate predatory middlemen in farming supply chains. Features a dual-sided portal for farmers and suppliers, product catalog management, supplier verification badges, discount promo logic, and structured MySQL order tracking.",
    highlights: [
      "Dual-sided interface separating buyer ordering workflows from supplier inventory management",
      "Price comparison matrix for agricultural inputs (seeds, organic nutrients, fertilizers)",
      "Secure order processing pipeline with invoice generation and order status updates",
      "Relational MySQL database schema managing user profiles, catalogs, and transaction ledgers"
    ],
    technologies: ["PHP", "MySQL", "JavaScript", "HTML5", "CSS3", "Apache"],
    metrics: [
      { label: "Architecture", value: "Dual-Sided" },
      { label: "Database", value: "Relational MySQL" }
    ],
    githubUrl: "https://github.com/Gundavenkatasai/farmer_marketplace",
    accentColor: "#84cc16",
    secondaryColor: "#a3e635",
    featured: false,
    type: "fullstack"
  }
];
