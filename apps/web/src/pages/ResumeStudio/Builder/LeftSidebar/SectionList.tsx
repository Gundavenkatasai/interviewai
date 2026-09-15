import React from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { IResumeSectionConfig } from "../../types/resume";
import { useResumeStore } from "../../store/useResumeStore";

interface Props {
  sections: IResumeSectionConfig[];
  icons: Record<string, React.ReactNode>;
}

export const SectionList: React.FC<Props> = ({ sections, icons }) => {
  const { updateSectionOrder, setActiveSection } = useResumeStore();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    const newSections = Array.from(sections);
    const [movedSection] = newSections.splice(sourceIndex, 1);
    newSections.splice(destIndex, 0, movedSection);
    
    newSections.forEach((s, idx) => { s.order = idx; });
    
    updateSectionOrder(newSections);
  };

  const toggleVisibility = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newSections = Array.from(sections);
    newSections[index].enabled = !newSections[index].enabled;
    updateSectionOrder(newSections);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="sections-list">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
            {sections.map((section, index) => (
              <Draggable key={section.id} draggableId={section.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      snapshot.isDragging 
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-md' 
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/50'
                    } ${!section.enabled && 'opacity-60 grayscale'}`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        {...provided.dragHandleProps} 
                        className="text-zinc-500 hover:text-zinc-300 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      
                      <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-400">
                        {icons[section.id] || <div className="w-4 h-4 rounded-sm bg-zinc-700" />}
                      </div>
                      
                      <span className="font-medium text-sm text-zinc-300 select-none">
                        {section.name}
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => toggleVisibility(e, index)}
                      className="text-zinc-500 hover:text-zinc-300 p-1"
                      title={section.enabled ? "Hide section" : "Show section"}
                    >
                      {section.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
