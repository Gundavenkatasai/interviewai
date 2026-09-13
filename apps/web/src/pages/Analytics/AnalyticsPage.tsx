import React, { useState } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { 
  BarChart3, TrendingUp, AlertTriangle, Briefcase, ChevronRight, RefreshCw, FileText
} from 'lucide-react';
import { AnalyticsGaps } from './AnalyticsGaps';
import { EvidenceDrawer } from './EvidenceDrawer';
import { Link } from 'react-router-dom';

export default function AnalyticsPage() {
  const { data, loading, error, refresh, fetchEvidence } = useAnalytics();
  const [activeTab, setActiveTab] = useState<'overview' | 'gaps'>('overview');
  
  const [evidenceConfig, setEvidenceConfig] = useState<{ isOpen: boolean; title: string; type: 'applications' | 'interviews'; ids: string[] }>({
    isOpen: false,
    title: '',
    type: 'applications',
    ids: []
  });

  if (loading && !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-rose-400">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Failed to load analytics</h2>
        <p className="mt-2 text-slate-400">{error}</p>
        <button onClick={refresh} className="mt-4 px-4 py-2 bg-slate-800 rounded-lg text-white font-medium hover:bg-slate-700">
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const showEvidence = (title: string, type: 'applications' | 'interviews', ids: string[]) => {
    setEvidenceConfig({ isOpen: true, title, type, ids });
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            Career Analytics
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            Based on {data.dataQuality.totalRecords} records from {new Date(data.periodStart).toLocaleDateString()} to {new Date(data.periodEnd).toLocaleDateString()}
            {data.dataQuality.missingSourceCount > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20" title={`${data.dataQuality.missingSourceCount} apps missing source`}>
                Partial Data
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={refresh} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 rounded-lg border border-slate-800 transition-colors" title="Force Refresh">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'}`}
        >
          Overview & Funnel
        </button>
        <button 
          onClick={() => setActiveTab('gaps')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'gaps' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'}`}
        >
          Career Gaps & Actions
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {data.aiSummary && (
            <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <h2 className="text-indigo-400 font-bold mb-2 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> What your data is telling you
              </h2>
              <p className="text-indigo-100/80 leading-relaxed text-sm">{data.aiSummary.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors" onClick={() => showEvidence('Total Applications', 'applications', data.funnelMetrics.evidenceIds?.submitted || [])}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Applications</p>
              <p className="text-3xl font-extrabold text-white">{data.funnelMetrics.submitted}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors" onClick={() => showEvidence('Interviews', 'applications', data.funnelMetrics.evidenceIds?.interviewing || [])}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Interview Rate</p>
              <p className="text-3xl font-extrabold text-emerald-400">{(data.funnelMetrics.interviewRate * 100).toFixed(1)}%</p>
              <p className="text-[10px] text-slate-500 mt-1">{data.funnelMetrics.interviewing} interviews</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Offer Rate</p>
              <p className="text-3xl font-extrabold text-purple-400">{(data.funnelMetrics.offerRate * 100).toFixed(1)}%</p>
              <p className="text-[10px] text-slate-500 mt-1">{data.funnelMetrics.offers} offers</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors" onClick={() => showEvidence('Mock Interviews', 'interviews', data.interviewMetrics.evidenceIds || [])}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Avg Mock Score</p>
              <p className="text-3xl font-extrabold text-amber-400">{data.interviewMetrics.averageScore ? data.interviewMetrics.averageScore.toFixed(1) : '-'}</p>
              <p className="text-[10px] text-slate-500 mt-1">out of 10</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Briefcase className="w-5 h-5 text-indigo-400"/> Source Performance</h3>
              <div className="space-y-4">
                {data.sourceMetrics.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No source data available.</p>
                ) : (
                  data.sourceMetrics.map((source, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors" onClick={() => showEvidence(`Source: ${source.source}`, 'applications', source.evidenceIds)}>
                      <div>
                        <p className="font-semibold text-slate-200">{source.source}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{source.applications} applications</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">{(source.interviewRate * 100).toFixed(1)}%</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{source.confidence}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-400"/> Role Performance</h3>
              <div className="space-y-4">
                {data.roleMetrics.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No role data available.</p>
                ) : (
                  data.roleMetrics.map((role, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors" onClick={() => showEvidence(`Role: ${role.role}`, 'applications', role.evidenceIds)}>
                      <div>
                        <p className="font-semibold text-slate-200">{role.role}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{role.applications} applications</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">{(role.interviewRate * 100).toFixed(1)}%</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{role.confidence}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gaps' && (
        <AnalyticsGaps data={data} showEvidence={showEvidence} />
      )}

      <EvidenceDrawer 
        isOpen={evidenceConfig.isOpen} 
        onClose={() => setEvidenceConfig({ ...evidenceConfig, isOpen: false })} 
        title={evidenceConfig.title} 
        type={evidenceConfig.type} 
        ids={evidenceConfig.ids} 
        fetchEvidence={fetchEvidence} 
      />

    </div>
  );
}
