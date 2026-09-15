import React, { useState } from "react";
import { LayoutTemplate, Palette, Type, Layout } from "lucide-react";
import { TemplateSelector } from "./TemplateSelector";
import { ColorSettings } from "./ColorSettings";
import { TypographySettings } from "./TypographySettings";
import { LayoutSettings } from "./LayoutSettings";

type Tab = "template" | "colors" | "typography" | "layout";

export const RightSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab | null>("template");

  return (
    <div className="flex h-full w-full">
      {/* Editor Panel */}
      {activeTab && (
        <div className="w-80 flex flex-col bg-zinc-950 border-r border-zinc-800 animate-in slide-in-from-right-8 duration-200">
          <div className="p-4 border-b border-zinc-800 flex items-center">
            <span className="font-bold text-lg text-zinc-100 capitalize">
              {activeTab === "typography" ? "Fonts" : activeTab}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
            {activeTab === "template" && <TemplateSelector />}
            {activeTab === "colors" && <ColorSettings />}
            {activeTab === "typography" && <TypographySettings />}
            {activeTab === "layout" && <LayoutSettings />}
          </div>
        </div>
      )}

      {/* Navbar (Far Right) */}
      <div className="w-16 flex flex-col items-center py-4 bg-zinc-950 space-y-2">
        <NavButton 
          active={activeTab === "template"} 
          onClick={() => setActiveTab(activeTab === "template" ? null : "template")}
          icon={<LayoutTemplate className="w-5 h-5" />}
          label="Template"
        />
        <NavButton 
          active={activeTab === "colors"} 
          onClick={() => setActiveTab(activeTab === "colors" ? null : "colors")}
          icon={<Palette className="w-5 h-5" />}
          label="Colors"
        />
        <NavButton 
          active={activeTab === "typography"} 
          onClick={() => setActiveTab(activeTab === "typography" ? null : "typography")}
          icon={<Type className="w-5 h-5" />}
          label="Fonts"
        />
        <NavButton 
          active={activeTab === "layout"} 
          onClick={() => setActiveTab(activeTab === "layout" ? null : "layout")}
          icon={<Layout className="w-5 h-5" />}
          label="Layout"
        />
      </div>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-xl transition-all ${
      active 
        ? "bg-zinc-800 text-zinc-100" 
        : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
    }`}
    title={label}
  >
    {icon}
  </button>
);
