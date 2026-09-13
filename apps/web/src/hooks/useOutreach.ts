import { useState, useCallback } from "react";

export interface FollowUpTask {
  _id: string;
  type: string;
  status: string;
  dueAt: string;
  reason: string;
  contactId?: { _id: string; name: string; title: string; company: string; relationshipType: string };
  applicationId?: { _id: string; companyName: string; jobTitle: string };
  interviewId?: { _id: string; role: string; type: string };
}

export interface CommunicationActivity {
  _id: string;
  type: string;
  status: string;
  channel: string;
  subject?: string;
  body?: string;
  createdAt: string;
  contactId?: { _id: string; name: string; title: string; company: string; };
  metadata?: any;
}

export const useOutreach = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/api/outreach/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load outreach dashboard");
      const data = await res.json();
      return data.data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTimeline = useCallback(async (applicationId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/api/outreach/application/${applicationId}/timeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load timeline");
      const data = await res.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateDraft = useCallback(async (params: { type: string; tone: string; applicationId?: string; interviewId?: string; contactId?: string }) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/api/outreach/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(params)
      });
      if (!res.ok) throw new Error("Failed to generate draft");
      const data = await res.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitCommunication = useCallback(async (activityId: string, action: "COPY" | "SEND") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/api/outreach/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ activityId, action })
      });
      if (!res.ok) throw new Error("Failed to submit communication");
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const suppressFollowUp = useCallback(async (taskId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/api/outreach/followup/${taskId}/suppress`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to suppress follow-up");
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getDashboard, getTimeline, generateDraft, submitCommunication, suppressFollowUp, loading, error };
};
