import React, { useState, useEffect } from "react";
import { Terminal, Github, Linkedin, FileText, Menu, X, ArrowUpRight } from "lucide-react";

interface NavbarProps {
  onNavigate: (target: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "WORK", href: "#work" },
    { label: "ABOUT", href: "#about" },
    { label: "SKILLS", href: "#skills" },
    { label: "EXPERIENCE", href: "#experience" },
    { label: "CONTACT", href: "#contact" }
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(href);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "py-3 bg-[#09090b]/85 backdrop-blur-md border-b border-white/10 shadow-2xl shadow-black/40"
            : "py-6 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Logo / Identifier */}
          <a
            href="#hero"
            onClick={(e) => handleLinkClick(e, "#hero")}
            className="group flex items-center gap-3 cursor-pointer"
            data-cursor="link"
          >
            <div className="w-9 h-9 rounded-lg bg-[#121216] border border-white/10 flex items-center justify-center group-hover:border-[#ea580c]/60 group-hover:bg-[#ea580c]/10 transition-all duration-300">
              <span className="font-display font-black text-sm text-[#f4f4f5] tracking-tighter group-hover:text-[#ea580c]">
                SAI
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xs tracking-widest uppercase text-white/90 group-hover:text-white transition-colors">
                Gunda Venkata Sai
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/80">
                  Full Stack Dev
                </span>
              </div>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                data-cursor="link"
                className="relative text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#ea580c] hover:after:w-full after:transition-all after:duration-300"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="https://github.com/Gundavenkatasai"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
              title="GitHub Profile"
              data-cursor="link"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/gunda-venkatasai"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-zinc-400 hover:text-[#0284c7] hover:bg-[#0284c7]/10 border border-transparent hover:border-[#0284c7]/20 transition-all"
              title="LinkedIn Profile"
              data-cursor="link"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="#contact"
              onClick={(e) => handleLinkClick(e, "#contact")}
              data-cursor="link"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-medium text-white bg-[#ea580c] hover:bg-[#f97316] transition-all shadow-lg shadow-[#ea580c]/20 hover:shadow-[#ea580c]/40"
            >
              <span>CONNECT</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 border border-white/10 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Fullscreen Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#09090b]/98 backdrop-blur-2xl flex flex-col justify-between p-8 pt-28 md:hidden animate-fade-in">
          <div className="flex flex-col gap-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#ea580c]">
              // Navigation
            </span>
            {navLinks.map((link, idx) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-2xl font-display font-bold tracking-tight text-zinc-300 hover:text-white flex items-center justify-between border-b border-white/5 pb-4"
              >
                <span>{link.label}</span>
                <span className="font-mono text-xs text-zinc-500">0{idx + 1}</span>
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-4 pt-6 border-t border-white/10">
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/Gundavenkatasai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-zinc-300"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
              <a
                href="https://www.linkedin.com/in/gunda-venkatasai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0284c7]/10 border border-[#0284c7]/30 text-xs font-mono text-[#38bdf8]"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
            </div>
            <a
              href="#contact"
              onClick={(e) => handleLinkClick(e, "#contact")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#ea580c] text-white text-xs font-mono font-semibold"
            >
              <span>GET IN TOUCH</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </>
  );
};
