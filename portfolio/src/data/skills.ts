import { SkillCategory } from "../types";

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    title: "Frontend Engineering",
    categoryKey: "frontend",
    description: "Modern, reactive, and accessible user interfaces built with typed components and 3D web engines.",
    skills: [
      { name: "React 18 / 19", level: "Advanced", description: "Hooks, Context API, Suspense, Concurrent Mode" },
      { name: "TypeScript", level: "Advanced", description: "Strict typing, generics, complex interfaces" },
      { name: "Next.js 15", level: "Proficient", description: "App router, SSR, server components" },
      { name: "Three.js & R3F", level: "Specialized", description: "WebGL scenes, camera choreography, custom shaders" },
      { name: "Tailwind CSS", level: "Advanced", description: "Utility-first design systems, custom variables" },
      { name: "Redux Toolkit", level: "Proficient", description: "Global state slices, async thunks" },
      { name: "Recharts", level: "Advanced", description: "Dynamic telemetry, area charts, data dashboards" },
      { name: "Vite", level: "Advanced", description: "High-speed bundling, HMR, production optimization" }
    ]
  },
  {
    title: "Backend & Microservices",
    categoryKey: "backend",
    description: "Robust, high-throughput backend services and secure RESTful architectures.",
    skills: [
      { name: "Node.js", level: "Advanced", description: "Event-driven runtime, streams, worker threads" },
      { name: "Express.js", level: "Advanced", description: "REST APIs, middleware chains, error handling" },
      { name: "FastAPI", level: "Advanced", description: "Python async endpoints, Pydantic v2 schemas" },
      { name: "JWT & Bcrypt", level: "Advanced", description: "Stateless token auth, salted hashing, RBAC" },
      { name: "Python 3.13", level: "Advanced", description: "Asynchronous I/O, microservices, data processing" },
      { name: "RESTful Design", level: "Advanced", description: "Resource modeling, HTTP status semantics, OpenAPI" }
    ]
  },
  {
    title: "Real-Time & WebSockets",
    categoryKey: "realtime",
    description: "Sub-second bidirectional communication channels and streaming data systems.",
    skills: [
      { name: "Socket.IO", level: "Advanced", description: "Rooms, namespaces, heartbeat reconnects, binary events" },
      { name: "WebSockets (Native)", level: "Advanced", description: "RFC 6455 protocol, custom framing, multiplexing" },
      { name: "WebRTC & PeerJS", level: "Proficient", description: "P2P data channels, audio streams, media constraints" },
      { name: "Live Event Systems", level: "Advanced", description: "State synchronization, delivery & read ticks, typing alerts" }
    ]
  },
  {
    title: "AI & Computer Vision",
    categoryKey: "ai_cv",
    description: "Machine learning integration, vision tracking pipelines, and LLM orchestration.",
    skills: [
      { name: "YOLOv8 (Ultralytics)", level: "Advanced", description: "Nano/medium models, bounding boxes, video inference" },
      { name: "ByteTrack & Centroid", level: "Advanced", description: "Multi-object tracking, trail retention, flow analytics" },
      { name: "Groq Cloud API", level: "Advanced", description: "Sub-second LLM inference (Llama, GPT-OSS, Qwen)" },
      { name: "Groq Whisper STT", level: "Advanced", description: "Zero-latency audio chunking & transcription" },
      { name: "Deepgram Nova-2", level: "Specialized", description: "Multilingual speech-to-text & sentiment intelligence" },
      { name: "OpenCV", level: "Proficient", description: "Image deskewing, contour detection, noise suppression" },
      { name: "Tesseract OCR", level: "Proficient", description: "Optical character extraction from scanned documents" }
    ]
  },
  {
    title: "Databases & Storage",
    categoryKey: "database",
    description: "Relational modeling, document stores, and cloud cluster administration.",
    skills: [
      { name: "MongoDB & Atlas", level: "Advanced", description: "Aggregation pipelines, indexing, replica clustering" },
      { name: "PostgreSQL", level: "Advanced", description: "ACID transactions, relational joins, Docker instances" },
      { name: "Prisma ORM", level: "Advanced", description: "Type-safe schemas, automated migrations, relation queries" },
      { name: "MySQL", level: "Proficient", description: "Relational queries, foreign keys, stored procedures" },
      { name: "Redis", level: "Proficient", description: "Message brokering, in-memory caching, Celery queues" }
    ]
  },
  {
    title: "DevOps, Cloud & Tools",
    categoryKey: "devops",
    description: "Containerization, automated deployments, and development infrastructure.",
    skills: [
      { name: "Docker & Compose", level: "Advanced", description: "Multi-container orchestration, volume binds, networking" },
      { name: "Google Cloud (GCP)", level: "Proficient", description: "IAM policies, compute instances, cloud networking (240+ labs)" },
      { name: "Vercel & Render", level: "Advanced", description: "Serverless functions, auto CI/CD, environmental secrets" },
      { name: "Git & GitHub", level: "Advanced", description: "Branching strategies, actions, collaboration workflows" },
      { name: "Postman", level: "Advanced", description: "API automated testing collections, environments" },
      { name: "Razorpay API v1", level: "Proficient", description: "Order creation, signature verification, payment hooks" }
    ]
  },
  {
    title: "CS Fundamentals & Core",
    categoryKey: "fundamentals",
    description: "Deep foundation in computer science and algorithmic engineering.",
    skills: [
      { name: "Data Structures & Algos", level: "Advanced", description: "250+ LeetCode/GFG problems, trees, graphs, DP" },
      { name: "Object-Oriented Programming", level: "Advanced", description: "Design patterns, inheritance, polymorphism in C++/Java" },
      { name: "Computer Networks", level: "Advanced", description: "TCP/IP, OSI, HTTP/HTTPS, DNS, routing (NPTEL certified)" },
      { name: "Operating Systems", level: "Advanced", description: "Process scheduling, concurrency, memory management" },
      { name: "Database Systems (DBMS)", level: "Advanced", description: "Normalization, indexing, transaction isolation" }
    ]
  }
];
