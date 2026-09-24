import React, { useState, useEffect } from "react";
import { CanvasContainer } from "./components/three/CanvasContainer";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { CustomCursor } from "./components/layout/CustomCursor";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import { HeroSection } from "./components/sections/HeroSection";
import { AboutSection } from "./components/sections/AboutSection";
import { SkillsSection } from "./components/sections/SkillsSection";
import { ProjectsShowcase } from "./components/sections/ProjectsShowcase";
import { ExperienceSection } from "./components/sections/ExperienceSection";
import { GitHubSection } from "./components/sections/GitHubSection";
import { ContactSection } from "./components/sections/ContactSection";
import { ProjectModal } from "./components/sections/ProjectModal";
import { useLenis } from "./hooks/useLenis";
import { useMousePosition } from "./hooks/useMousePosition";
import { Project } from "./types";

export const App: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeScreen, setActiveScreen] = useState<"hero" | "interviewai" | "pizza_craft" | "lpulive" | "queue_analytics">("hero");
  const [modalProject, setModalProject] = useState<Project | null>(null);

  const { scrollTo } = useLenis();
  const mouse = useMousePosition();

  // Track global scroll progress for 3D camera choreography
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(1, Math.max(0, window.scrollY / totalHeight));
        setScrollProgress(progress);

        // Update 3D screen based on scroll landmarks if not overridden
        if (progress < 0.25) {
          setActiveScreen("hero");
        } else if (progress >= 0.25 && progress < 0.45) {
          setActiveScreen("interviewai");
        } else if (progress >= 0.45 && progress < 0.65) {
          setActiveScreen("pizza_craft");
        } else if (progress >= 0.65 && progress < 0.8) {
          setActiveScreen("queue_analytics");
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#09090b] text-[#f4f4f5] selection:bg-[#ea580c] selection:text-white">
      {/* Cinematic Initializing Loader */}
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}

      {/* Desktop Custom Cursor */}
      <CustomCursor />

      {/* 3D WebGL Background Scene */}
      <CanvasContainer
        scrollProgress={scrollProgress}
        mouse={mouse}
        activeScreen={activeScreen}
      />

      {/* Overlay Content Stream */}
      <div className="relative z-10 w-full flex flex-col">
        <Navbar onNavigate={(target) => scrollTo(target)} />

        <main className="w-full flex flex-col">
          <HeroSection onExplore={() => scrollTo("#work")} />
          <AboutSection />
          <SkillsSection />
          <ProjectsShowcase
            onSelectProjectForModal={(project) => setModalProject(project)}
            activeScreen={activeScreen}
            onChangeActiveScreen={(screen) => setActiveScreen(screen)}
          />
          <ExperienceSection />
          <GitHubSection />
          <ContactSection />
        </main>

        <Footer onScrollTop={() => scrollTo("#hero")} />
      </div>

      {/* Detailed Case Study Modal */}
      <ProjectModal
        project={modalProject}
        onClose={() => setModalProject(null)}
      />
    </div>
  );
};

export default App;
