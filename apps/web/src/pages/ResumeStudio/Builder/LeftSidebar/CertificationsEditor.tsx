import React, { useState } from "react";
import { useResumeStore } from "../../store/useResumeStore";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

export const CertificationsEditor: React.FC = () => {
  const { resume, updateProfileData } = useResumeStore();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!resume) return null;
  const certs = resume.profileData.certifications || [];

  const handleUpdate = (index: number, field: string, value: string) => {
    const updated = [...certs];
    updated[index] = { ...updated[index], [field]: value };
    updateProfileData("certifications", updated);
  };

  const handleAdd = () => {
    const newCerts = [
      { id: crypto.randomUUID(), name: "New Certification", issuer: "", date: "", url: "" },
      ...certs,
    ];
    updateProfileData("certifications", newCerts);
    setExpandedIndex(0);
  };

  const handleDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = certs.filter((_, i) => i !== index);
    updateProfileData("certifications", updated);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const inputClass = "w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-zinc-100 placeholder-zinc-600 transition-colors";
  const labelClass = "block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Certifications</h3>
          <p className="text-xs text-zinc-500">Add professional certifications and licenses.</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded hover:bg-indigo-500/20 transition-colors">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="space-y-3">
        {certs.map((cert, index) => (
          <div key={cert.id || index} className="border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">{cert.name || "Untitled Cert"}</h4>
                <p className="text-xs text-zinc-500">{cert.issuer || "Issuer"} {cert.date ? `· ${cert.date}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => handleDelete(index, e)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                {expandedIndex === index ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
              </div>
            </div>
            {expandedIndex === index && (
              <div className="p-4 border-t border-zinc-800 bg-zinc-950 space-y-4">
                <div>
                  <label className={labelClass}>Certification Name</label>
                  <input type="text" value={cert.name || ""} onChange={(e) => handleUpdate(index, "name", e.target.value)} placeholder="AWS Solutions Architect" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Issuer</label>
                    <input type="text" value={cert.issuer || ""} onChange={(e) => handleUpdate(index, "issuer", e.target.value)} placeholder="Amazon Web Services" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Date</label>
                    <input type="text" value={cert.date || ""} onChange={(e) => handleUpdate(index, "date", e.target.value)} placeholder="2022" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>URL / Credential Link</label>
                  <input type="text" value={(cert as any).url || ""} onChange={(e) => handleUpdate(index, "url", e.target.value)} placeholder="https://credly.com/..." className={inputClass} />
                </div>
              </div>
            )}
          </div>
        ))}
        {certs.length === 0 && (
          <div className="text-center py-8 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-500 mb-2">No certifications added yet.</p>
            <button onClick={handleAdd} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Add your first certification</button>
          </div>
        )}
      </div>
    </div>
  );
};
