import React, { useState } from "react";
import { useResumeStore } from "../../store/useResumeStore";
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";

export const EducationEditor: React.FC = () => {
  const { resume, updateProfileData } = useResumeStore();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!resume) return null;
  const education = resume.profileData?.education || [];

  const handleUpdate = (index: number, field: string, value: any) => {
    const newEdu = [...education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    updateProfileData("education", newEdu);
  };

  const handleAdd = () => {
    const newEdu = [
      {
        id: crypto.randomUUID(),
        institution: "University Name",
        degree: "Degree",
        field: "Field of Study",
        startDate: "",
        endDate: "",
        gpa: ""
      },
      ...education
    ];
    updateProfileData("education", newEdu);
    setExpandedIndex(0);
  };

  const handleDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newEdu = education.filter((_, i) => i !== index);
    updateProfileData("education", newEdu);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const inputClass = "w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-zinc-100 placeholder-zinc-600 transition-colors";
  const labelClass = "block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Education</h3>
          <p className="text-xs text-zinc-500">Add your academic background.</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded hover:bg-indigo-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="space-y-3">
        {education.map((edu, index) => (
          <div key={edu.id || index} className="border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden shadow-sm">
            {/* Header / Accordion Toggle */}
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-zinc-600" />
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">{edu.institution || "Untitled Institution"}</h4>
                  <p className="text-xs text-zinc-500">{edu.degree || "Degree"} in {edu.field || "Field"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => handleDelete(index, e)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {expandedIndex === index ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
              </div>
            </div>

            {/* Body */}
            {expandedIndex === index && (
              <div className="p-4 border-t border-zinc-800 bg-zinc-950 space-y-4">
                <div>
                  <label className={labelClass}>Institution</label>
                  <input 
                    type="text" 
                    value={edu.institution || ""} 
                    onChange={(e) => handleUpdate(index, "institution", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Degree</label>
                    <input 
                      type="text" 
                      value={edu.degree || ""} 
                      onChange={(e) => handleUpdate(index, "degree", e.target.value)}
                      placeholder="e.g. B.S., Master's"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Field of Study</label>
                    <input 
                      type="text" 
                      value={edu.field || ""} 
                      onChange={(e) => handleUpdate(index, "field", e.target.value)}
                      placeholder="e.g. Computer Science"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Start Date</label>
                    <input 
                      type="text" 
                      value={edu.startDate || ""} 
                      onChange={(e) => handleUpdate(index, "startDate", e.target.value)}
                      placeholder="e.g. 2016"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>End Date</label>
                    <input 
                      type="text" 
                      value={edu.endDate || ""} 
                      onChange={(e) => handleUpdate(index, "endDate", e.target.value)}
                      placeholder="e.g. 2020"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>GPA (Optional)</label>
                    <input 
                      type="text" 
                      value={edu.gpa || ""} 
                      onChange={(e) => handleUpdate(index, "gpa", e.target.value)}
                      placeholder="e.g. 3.8/4.0"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {education.length === 0 && (
          <div className="text-center py-8 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-500 mb-2">No education added yet.</p>
            <button
              onClick={handleAdd}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Add your education
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
