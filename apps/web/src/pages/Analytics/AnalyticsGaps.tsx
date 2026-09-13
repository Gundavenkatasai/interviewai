import React from 'react';
import { AnalyticsSnapshot } from '../../hooks/useAnalytics';
import { Target, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
  data: AnalyticsSnapshot;
  showEvidence: (title: string, type: 'applications' | 'interviews', ids: string[]) => void;
}

export function AnalyticsGaps({ data, showEvidence }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {data.nextBestActions && data.nextBestActions.length > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/30">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-400" /> Recommended Action
          </h2>
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <p className="text-indigo-400 text-sm font-semibold mb-1 uppercase tracking-wider">{data.nextBestActions[0].priority} PRIORITY</p>
              <h3 className="text-2xl font-bold text-slate-100">{data.nextBestActions[0].title}</h3>
              <p className="text-slate-400 mt-2">{data.nextBestActions[0].reason}</p>
            </div>
            <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors shrink-0">
              Take Action <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">Identified Gaps</h3>
        
        {data.gapMetrics.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-slate-700" />
            <p>No critical career gaps identified yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.gapMetrics.map((gap, i) => (
              <div key={i} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-xl bg-slate-950 border border-slate-800 gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-2 rounded-lg ${gap.confidence === 'HIGHER_CONFIDENCE' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200">{gap.title}</h4>
                    <p className="text-sm text-slate-400 mt-1">{gap.description}</p>
                    {gap.evidenceIds.length > 0 && (
                      <button 
                        onClick={() => showEvidence(`Evidence for: ${gap.title}`, gap.type.includes('INTERVIEW') ? 'interviews' : 'applications', gap.evidenceIds)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 font-medium transition-colors"
                      >
                        View {gap.evidenceCount} related records &rarr;
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                    {gap.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
