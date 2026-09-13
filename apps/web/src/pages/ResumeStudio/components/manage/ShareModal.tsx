import React, { useState } from "react";
import {
  Share2, X, Copy, Check, Lock, Globe, Trash2,
  AlertTriangle, ExternalLink, RefreshCw
} from "lucide-react";
import { ApiClient } from "../../../../lib/api";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: any;
  onUpdateResume: (updatedResume: any) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  resume,
  onUpdateResume,
}) => {
  const [password, setPassword] = useState("");
  const [enablePassword, setEnablePassword] = useState(false);
  const [expiresDays, setExpiresDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const shareData = resume?.share || null;
  const isShared = Boolean(shareData?.isShared && shareData?.slug);
  const publicUrl = isShared
    ? `${window.location.origin}/resume/public/${shareData.slug}`
    : "";

  const handleCreateShare = async () => {
    if (!resume?._id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.createResumeShare(resume._id, {
        password: enablePassword && password.trim() ? password.trim() : undefined,
        expiresDays,
      });

      if (res?.resume) {
        onUpdateResume(res.resume);
      } else if (res?.share) {
        onUpdateResume({ ...resume, share: res.share });
      }
    } catch (err: any) {
      setError(err.message || "Failed to publish share link.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!resume?._id) return;
    if (!window.confirm("Are you sure you want to unpublish this resume? Public links will stop working immediately.")) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.deleteResumeShare(resume._id);
      if (res?.resume) {
        onUpdateResume(res.resume);
      } else {
        onUpdateResume({ ...resume, share: { isShared: false, slug: null } });
      }
    } catch (err: any) {
      setError(err.message || "Failed to revoke public link.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-100">Share Public Resume Link</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Create an unlisted public URL for recruiters and hiring managers. Viewers see your rendered resume with a high-fidelity print & PDF download option, with zero dashboard UI exposed.
          </p>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isShared ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Globe className="w-3.5 h-3.5" />
                    Published & Active
                  </span>
                  {shareData.expiresAt && (
                    <span className="text-[11px] text-slate-500">
                      Expires {new Date(shareData.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                    title="Open public page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {shareData.hasPassword && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400/90 pt-1">
                    <Lock className="w-3.5 h-3.5" />
                    Protected with a passcode
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handleRevokeShare}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Unpublish Link
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePassword}
                    onChange={(e) => setEnablePassword(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  Require a password to view this resume
                </label>

                {enablePassword && (
                  <div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Set access passcode"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Link Expiration Duration
                  </label>
                  <select
                    value={expiresDays}
                    onChange={(e) => setExpiresDays(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={365}>1 year</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCreateShare}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  {loading ? "Generating Link..." : "Create Public Link"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
