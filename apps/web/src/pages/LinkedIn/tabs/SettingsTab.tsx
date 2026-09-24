import React, { useState } from "react";
import { Sliders, Shield, Key, CheckCircle2, RefreshCw, Sparkles } from "lucide-react";
import { ApiClient } from "../../../lib/api";

interface SettingsTabProps {
  settings: any;
  onRefresh: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ settings, onRefresh }) => {
  const [readProvider, setReadProvider] = useState(settings?.readProvider || "MANUAL");
  const [publishProvider, setPublishProvider] = useState(settings?.publishProvider || "MANUAL");
  const [mediaProvider, setMediaProvider] = useState(settings?.mediaProvider || "MANUAL");
  const [approvalMode, setApprovalMode] = useState(settings?.approvalMode || "STRICT");

  const [apifyToken, setApifyToken] = useState("");
  const [publoraApiKey, setPubloraApiKey] = useState("");
  const [linkedinPlatformId, setLinkedinPlatformId] = useState("");
  const [pixfaroToken, setPixfaroToken] = useState("");

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await ApiClient.updateLinkedInSettings({
        readProvider,
        publishProvider,
        mediaProvider,
        approvalMode,
        apifyToken: apifyToken || undefined,
        publoraApiKey: publoraApiKey || undefined,
        linkedinPlatformId: linkedinPlatformId || undefined,
        pixfaroToken: pixfaroToken || undefined,
      });
      alert("Settings saved successfully!");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await ApiClient.testLinkedInConnections();
      setTestResult(res);
    } catch (err: any) {
      alert(err.message || "Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="h-4 w-4 text-indigo-400" /> LinkedIn Integration & Connectors
        </h3>
        <p className="text-xs text-slate-400">
          Configure optional API layers. When API keys are absent, Interview AI seamlessly operates in manual copy-paste mode.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Read Layer */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <h4 className="text-sm font-bold text-white">1. Read Layer (Public Scraper)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Active Mode</label>
              <select
                value={readProvider}
                onChange={(e) => setReadProvider(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="MANUAL">Manual Paste (No API key needed)</option>
                <option value="APIFY">Apify LinkedIn Scraper</option>
              </select>
            </div>

            {readProvider === "APIFY" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Apify API Token</label>
                <input
                  type="password"
                  value={apifyToken}
                  onChange={(e) => setApifyToken(e.target.value)}
                  placeholder={settings?.apifyTokenMasked || "apify_api_..."}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Publish Layer */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <h4 className="text-sm font-bold text-white">2. Publish Layer (Scheduling & Auto-Post)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Publishing Mode</label>
              <select
                value={publishProvider}
                onChange={(e) => setPublishProvider(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="MANUAL">Manual Copy-Ready (Free, zero setup)</option>
                <option value="PUBLORA">Publora REST API (1-click auto post on approval)</option>
              </select>
            </div>

            {publishProvider === "PUBLORA" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Publora API Key</label>
                  <input
                    type="password"
                    value={publoraApiKey}
                    onChange={(e) => setPubloraApiKey(e.target.value)}
                    placeholder={settings?.publoraApiKeyMasked || "sk_live_..."}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">LinkedIn Platform ID</label>
                  <input
                    type="text"
                    value={linkedinPlatformId}
                    onChange={(e) => setLinkedinPlatformId(e.target.value)}
                    placeholder={settings?.linkedinPlatformIdMasked || "e.g. 12345678"}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Media Layer */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <h4 className="text-sm font-bold text-white">3. Media Layer (Illustrations & Quote Cards)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Media Engine</label>
              <select
                value={mediaProvider}
                onChange={(e) => setMediaProvider(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="MANUAL">Manual Image Prompt Generator</option>
                <option value="PIXFARO">Pixfaro API (Automatic Quote Cards & AI Art)</option>
              </select>
            </div>

            {mediaProvider === "PIXFARO" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Pixfaro Token</label>
                <input
                  type="password"
                  value={pixfaroToken}
                  onChange={(e) => setPixfaroToken(e.target.value)}
                  placeholder={settings?.pixfaroTokenMasked || "pf_live_..."}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            {testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
            Test Connections
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>

      {/* Test Connection Results */}
      {testResult && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Runtime Diagnostics & Provider Verification
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Verified at {new Date(testResult.timestamp || Date.now()).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block mb-1">Active Backend</span>
              <span className="font-semibold text-white uppercase">{testResult.activeBackend}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block mb-1">Read Layer</span>
              <span className="font-semibold text-emerald-400">{testResult.providers?.read?.status}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block mb-1">Publish Layer</span>
              <span className="font-semibold text-indigo-400">{testResult.providers?.publish?.status}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block mb-1">Media Layer</span>
              <span className="font-semibold text-purple-400">{testResult.providers?.media?.status}</span>
            </div>
          </div>

          {testResult.providers?.read?.detail && (
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300">
              <span className="font-bold block mb-0.5">Apify Actor Engine:</span>
              {testResult.providers.read.detail}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
