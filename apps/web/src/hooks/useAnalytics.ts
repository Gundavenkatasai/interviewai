import { useState, useCallback, useEffect } from "react";

export interface Gap {
  id: string;
  title: string;
  type: string;
  description: string;
  evidenceCount: number;
  evidenceIds: string[];
  confidence: string;
  priorityScore: number;
  action: string;
}

export interface NextAction {
  title: string;
  reason: string;
  priority: string;
  gapId: string;
}

export interface AnalyticsSnapshot {
  periodStart: string;
  periodEnd: string;
  calculationVersion: string;
  funnelMetrics: {
    total: number;
    saved: number;
    prepared: number;
    submitted: number;
    interviewing: number;
    offers: number;
    interviewRate: number;
    offerRate: number;
    evidenceIds: any;
  };
  sourceMetrics: any[];
  roleMetrics: any[];
  interviewMetrics: any;
  gapMetrics: Gap[];
  nextBestActions: NextAction[];
  aiSummary?: {
    summary: string;
    strengths: string[];
    concerns: string[];
  };
  dataQuality: any;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

export const useAnalytics = () => {
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("interviewai_token") || localStorage.getItem("token");
      const url = `${API_BASE}/api/analytics/overview${forceRefresh ? '?forceRefresh=true' : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const fetchEvidence = useCallback(async (type: 'applications' | 'interviews', ids: string[]) => {
    if (ids.length === 0) return [];
    try {
      const token = localStorage.getItem("interviewai_token") || localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/analytics/evidence?type=${type}&ids=${ids.join(',')}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load evidence");
      const json = await res.json();
      return json.data;
    } catch (err: any) {
      console.error(err);
      return [];
    }
  }, []);

  return { data, loading, error, refresh: () => fetchOverview(true), fetchEvidence };
};
