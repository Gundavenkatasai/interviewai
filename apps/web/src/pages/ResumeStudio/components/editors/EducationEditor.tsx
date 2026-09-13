import React from "react";
import { GraduationCap, Plus, Trash2, Calendar, MapPin } from "lucide-react";

interface EducationEditorProps {
  education: any[];
  onChange: (newList: any[]) => void;
}

export const EducationEditor: React.FC<EducationEditorProps> = ({
  education = [],
  onChange
}) => {
  const handleAddEducation = () => {
    const newEdu = {
      id: String(Date.now()),
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      gpa: ""
    };
    onChange([...education, newEdu]);
  };

  const handleUpdate = (index: number, field: string, value: string) => {
    const list = [...education];
    list[index] = { ...list[index], [field]: value };
    onChange(list);
  };

  const handleDelete = (index: number) => {
    const list = [...education];
    list.splice(index, 1);
    onChange(list);
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            Education &amp; Credentials
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Degrees, academic background, and relevant coursework.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddEducation}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Education
        </button>
      </div>

      {education.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
          <GraduationCap className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No education entries added</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Many screening filters check for highest degree institution or diploma status.
          </p>
          <button
            type="button"
            onClick={handleAddEducation}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            + Add Education
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {education.map((edu, idx) => (
            <div
              key={edu.id || idx}
              className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 relative group"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold text-white">
                  {edu.degree || "Degree"} {edu.field ? `in ${edu.field}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-300">Institution / University *</label>
                  <input
                    type="text"
                    value={edu.institution || ""}
                    onChange={(e) => handleUpdate(idx, "institution", e.target.value)}
                    placeholder="e.g. University of California, Berkeley"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Degree *</label>
                  <input
                    type="text"
                    value={edu.degree || ""}
                    onChange={(e) => handleUpdate(idx, "degree", e.target.value)}
                    placeholder="e.g. Bachelor of Science"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Field of Study</label>
                  <input
                    type="text"
                    value={edu.field || ""}
                    onChange={(e) => handleUpdate(idx, "field", e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Graduation Year / End Date</label>
                  <input
                    type="text"
                    value={edu.endDate || ""}
                    onChange={(e) => handleUpdate(idx, "endDate", e.target.value)}
                    placeholder="e.g. 2023 or May 2024"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300">GPA (Optional)</label>
                  <input
                    type="text"
                    value={edu.gpa || ""}
                    onChange={(e) => handleUpdate(idx, "gpa", e.target.value)}
                    placeholder="e.g. 3.85 / 4.0"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
