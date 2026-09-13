import React, { useEffect, useState } from 'react';
import { X, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'applications' | 'interviews';
  ids: string[];
  fetchEvidence: (type: 'applications' | 'interviews', ids: string[]) => Promise<any[]>;
}

export function EvidenceDrawer({ isOpen, onClose, title, type, ids, fetchEvidence }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && ids.length > 0) {
      setLoading(true);
      fetchEvidence(type, ids).then(res => {
        setData(res);
        setLoading(false);
      });
    }
  }, [isOpen, ids, type, fetchEvidence]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400">{ids.length} records</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center p-8 text-slate-500 text-sm">
              No evidence records found.
            </div>
          ) : (
            data.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                {type === 'applications' ? (
                  <>
                    <h4 className="font-semibold text-slate-200">{item.jobId?.title || 'Unknown Role'}</h4>
                    <p className="text-sm text-slate-400">{item.jobId?.companyName}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 font-medium">
                        {item.status}
                      </span>
                      <Link to={`/applications/${item._id}`} className="text-xs text-indigo-400 hover:text-indigo-300">
                        View Details
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="font-semibold text-slate-200">Interview Session</h4>
                    <p className="text-sm text-slate-400">{new Date(item.created_at).toLocaleDateString()}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 font-medium flex items-center gap-1">
                        {item.score?.overall_score ? (
                          <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Score: {item.score.overall_score.toFixed(1)}/10</>
                        ) : (
                          <><Clock className="w-3 h-3 text-slate-500" /> Unscored</>
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </>
  );
}
