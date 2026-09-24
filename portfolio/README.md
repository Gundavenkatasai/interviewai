# Gunda Venkata Sai (SAI) — 3D Cinematic Developer Portfolio

A production-quality personal 3D developer portfolio and interactive virtual studio built with **React 18**, **TypeScript**, **Three.js**, **React Three Fiber (R3F)**, **GSAP ScrollTrigger**, **Lenis**, and **Tailwind CSS**.

Grounded strictly in real GitHub repositories, verified source code, confirmed certifications, and master resume credentials.

---

## 🌟 Key Highlights & Engineering Features

- **Virtual Studio Metaphor**: Moving through a physical workstation containing high-resolution 3D curved monitor, foreground laptop, ambient directional lighting, subtle glass reflections, and controlled depth.
- **Dynamic 3D Camera Choreography**: Synchronized with mouse parallax and GSAP ScrollTrigger to travel across sections and zoom seamlessly toward monitor displays.
- **Real-Time Interactive Screen Simulations**:
  - **InterviewAI**: Voice waveform visualizer, Groq Whisper speech pipeline, Monaco coding editor, and 8-dimensional rubric evaluator.
  - **PizzaCraft**: Multi-portal switch (Customer Storefront, Kitchen Ops, Super-Admin), Socket.IO live order tracking across 4 lifecycle stages, Razorpay payment verification with 8% GST recalculation.
  - **LPU Live**: University chat interface, registration-number credentials, Socket.IO bidirectional messaging, typing indicators, and read receipts.
  - **Queue Analytics System**: Real-time YOLOv8n person detection and ByteTrack centroid tracking simulator with CCTV grid, queue depth counters, and FPS telemetry.
- **Lenis Smooth Scrolling**: Zero-friction momentum scrolling perfectly synchronized with the GSAP ticker and WebGL camera rig.
- **Adaptive Performance & Mobile Fallback**: Automatic device detection, touch-aware custom cursor, dynamic canvas pixel ratio (dpr={[1, 1.75]}), and accessible fallback for users with prefers-reduced-motion.
- **Verified Credentials**: Features 100% verified education at Lovely Professional University (B.Tech CSE, CGPA 7.69), Oracle Cloud Generative AI Professional certification, 250+ DSA problems solved, and 240+ Google Cloud Arcade labs.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework & Core** | React 18, TypeScript 5, Vite 5 |
| **3D Engine** | Three.js, @react-three/fiber, @react-three/drei |
| **Motion & Scroll** | GSAP 3, ScrollTrigger, Lenis Smooth Scroll |
| **Styling** | Tailwind CSS 3, Custom CSS Variables, Glassmorphism |
| **Icons & Assets** | Lucide React, SVG Monograms, High-Res Portraits |

---

## 🚀 Quick Start / Local Development

### 1. Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### 2. Installation
`ash
git clone https://github.com/Gundavenkatasai/portfolio.git
cd portfolio
npm install
`

### 3. Run Development Server
`ash
npm run dev
`
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
`ash
npm run build
npm run preview
`

---

## 🏛️ Project Directory Structure

`	ext
protofolio/
├── public/
│   ├── favicon.svg             # Branded monogram favicon
│   ├── sai.jpeg                # High-res verified developer portrait
│   └── Gunda_Venkata_Sai_Resume.docx # Direct downloadable resume
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx      # Minimal editorial navigation & mobile sheet
│   │   │   ├── Footer.tsx      # Editorial footer & quick jump
│   │   │   └── CustomCursor.tsx# Desktop cursor with VIEW, LINK, and DRAG states
│   │   ├── sections/
│   │   │   ├── HeroSection.tsx # Editorial hero with status strip & CTAs
│   │   │   ├── AboutSection.tsx# Kinetic typography & verified education
│   │   │   ├── SkillsSection.tsx# Clustered technical arsenal
│   │   │   ├── ProjectsShowcase.tsx # Interactive 3D project workstation
│   │   │   ├── ProjectModal.tsx # Architectural deep-dive case study modal
│   │   │   ├── ExperienceSection.tsx # Verified timeline & certifications
│   │   │   ├── GitHubSection.tsx # Open-source repository explorer
│   │   │   └── ContactSection.tsx # Direct message dispatch & contacts
│   │   ├── three/
│   │   │   ├── CanvasContainer.tsx # WebGL canvas wrapper with fallback
│   │   │   ├── VirtualStudioScene.tsx # Master 3D scene composition
│   │   │   ├── StudioMonitor.tsx # Procedural ultra-wide curved screen
│   │   │   ├── StudioLaptop.tsx # Metallic unibody laptop in foreground
│   │   │   ├── CameraRig.tsx   # Mouse parallax & scroll trajectory
│   │   │   ├── StudioLighting.tsx # Warm orange rim & cool sky key lights
│   │   │   ├── FloatingPanels.tsx # Subtle architectural glass & particles
│   │   │   └── screens/        # Interactive project simulated UIs
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── GlassCard.tsx
│   │       └── LoadingScreen.tsx # Minimal cinematic progress loader
│   ├── data/
│   │   ├── projects.ts         # 9 verified projects with metrics & highlights
│   │   ├── skills.ts           # Confirmed skills across 7 categories
│   │   ├── timeline.ts         # Education, certifications, and achievements
│   │   └── repositories.ts     # Curated public GitHub repositories
│   ├── hooks/
│   │   ├── useLenis.ts         # Smooth scroll synchronization
│   │   ├── useMousePosition.ts # Normalized coordinates for parallax
│   │   └── useMediaQuery.ts    # Mobile & reduced motion detection
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
`

---

## 🔒 Security & Privacy

This portfolio contains zero private credentials, no exposed environment variables, and no hardcoded secret keys. All project metrics and descriptions are derived from public GitHub repositories and verified academic records.

---

**Designed & Engineered by Gunda Venkata Sai (SAI)**  
*Full Stack Developer • AI • Real-Time Systems*