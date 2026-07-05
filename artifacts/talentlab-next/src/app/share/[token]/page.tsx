"use client";

/**
 * Public Candidate Share Page — /share/[token]
 * No authentication required. Accessible by client companies.
 * Shows candidate profile, AI score, assessment, interview feedback.
 * Allows client to submit: Approve | Reject | Need Interview
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

interface ShareData {
  shareLink: { token: string; expiresAt: string; clientDecision: string | null };
  candidate: {
    id: string; name: string; currentRole: string; experienceYears: number;
    location: string; skills: string[]; summary: string; resumeUrl: string | null;
    educations: any[]; experiences: any[];
  };
  job: { title: string; location: string; description: string | null };
  screening: { communicationScore: number | null; technicalScore: number | null; overallScore: number | null; verdict: string | null } | null;
  assessment: { percentage: number; verdict: string | null; categoryScores: any; completedAt: string } | null;
  aiScore: { communication: number; experience: number; skills: number; education: number; overall: number; recommendation: string; reasoning: string } | null;
  matchScore: { matchPercentage: number; matchedSkills: string[]; missingSkills: string[]; summary: string } | null;
}

const DECISION_COLORS: Record<string, string> = {
  APPROVED: "bg-emerald-500",
  REJECTED: "bg-red-500",
  NEED_INTERVIEW: "bg-amber-500",
};

export default function SharePage() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/share/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 410 ? "This link has expired." : "Link not found or revoked.");
        return r.json();
      })
      .then((d) => {
        setData(d);
        if (d.shareLink?.clientDecision) {
          setDecision(d.shareLink.clientDecision);
          setSubmitted(true);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function submitDecision(d: string) {
    setSubmitting(true);
    try {
      const r = await fetch(`${API_BASE}/share/${token}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: d, feedback }),
      });
      if (!r.ok) throw new Error("Failed to submit decision");
      setDecision(d);
      setSubmitted(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading candidate profile...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-red-400 mb-2">Access Unavailable</h1>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { candidate, job, screening, assessment, aiScore, matchScore } = data;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100" style={{ fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="bg-black/20 backdrop-blur-2xl border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.5)]">99</div>
          <span className="font-semibold text-gray-200 tracking-wide">99 Placement — Candidate Review</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          <span>🔒 Secure Link</span>
          <span>·</span>
          <span>Expires: {new Date(data.shareLink.expiresAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Decision Banner */}
        {submitted && decision && (
          <div className={`${DECISION_COLORS[decision]} bg-opacity-20 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-2xl animate-fade-in-up`}>
            <span className="text-3xl drop-shadow-md">{decision === "APPROVED" ? "✅" : decision === "REJECTED" ? "❌" : "📅"}</span>
            <div>
              <p className="font-semibold text-white tracking-wide">Decision Submitted: {decision.replace("_", " ")}</p>
              {feedback && <p className="text-white/80 text-sm mt-1">"{feedback}"</p>}
            </div>
          </div>
        )}

        {/* Candidate Header */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl transition-all hover:bg-white/[0.03] hover:border-white/15">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                {candidate.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{candidate.name}</h1>
                <p className="text-gray-400">{candidate.currentRole}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>📍 {candidate.location}</span>
                  <span>·</span>
                  <span>💼 {candidate.experienceYears} yrs exp</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Applied for</div>
              <div className="text-sm font-semibold text-violet-400">{job.title}</div>
              <div className="text-xs text-gray-500">{job.location}</div>
            </div>
          </div>

          {candidate.summary && (
            <p className="mt-4 text-sm text-gray-300 leading-relaxed border-t border-gray-800 pt-4">{candidate.summary}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {candidate.skills?.map((skill: string) => (
              <span key={skill} className="px-2 py-1 bg-violet-500/10 text-violet-300 text-xs rounded-lg border border-violet-500/20">{skill}</span>
            ))}
          </div>

          {candidate.resumeUrl && (
            <a href={candidate.resumeUrl} target="_blank" rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">
              📄 View Full Resume
            </a>
          )}
        </div>

        {/* AI Score */}
        {aiScore && (
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl transition-all hover:bg-white/[0.03] hover:border-white/15">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]">✨</span> AI Screening Score
              <span className={`ml-auto px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase ${
                aiScore.recommendation === "SHORTLIST" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]" :
                aiScore.recommendation === "REJECT" ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]" :
                "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              }`}>{aiScore.recommendation}</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 mb-6">
              {[
                { label: "Communication", value: aiScore.communication },
                { label: "Experience", value: aiScore.experience },
                { label: "Skills", value: aiScore.skills },
                { label: "Education", value: aiScore.education },
                { label: "Overall", value: aiScore.overall },
              ].map((item) => (
                <div key={item.label} className="text-center group">
                  <div className="text-4xl font-extrabold text-white group-hover:text-violet-400 transition-colors drop-shadow-md">{item.value}<span className="text-lg font-medium text-white/30">/10</span></div>
                  <div className="text-xs font-semibold text-white/50 mt-2 uppercase tracking-wide">{item.label}</div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-600 to-purple-400 h-1.5 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.6)] transition-all duration-1000 ease-out" style={{ width: `${item.value * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {aiScore.reasoning && (
              <p className="text-sm text-white/70 bg-white/5 border border-white/5 rounded-xl p-4 mt-4 italic leading-relaxed backdrop-blur-md">
                "{aiScore.reasoning}"
              </p>
            )}
          </div>
        )}

        {/* Match Score */}
        {matchScore && (
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl transition-all hover:bg-white/[0.03] hover:border-white/15">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3 drop-shadow-md">🎯 Job Match Score</h2>
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-600 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">{matchScore.matchPercentage}%</div>
            </div>
            <div className="w-full bg-white/5 rounded-full h-4 mb-8 overflow-hidden shadow-inner">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-4 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]" style={{ width: `${matchScore.matchPercentage}%` }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div className="bg-emerald-500/5 rounded-2xl p-5 border border-emerald-500/10">
                <p className="text-emerald-400 font-bold mb-3 tracking-wide uppercase text-xs flex items-center gap-2">✅ Matched Skills</p>
                <div className="flex flex-wrap gap-2">
                  {matchScore.matchedSkills?.map((s) => <span key={s} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 font-medium text-xs rounded-lg border border-emerald-500/20">{s}</span>)}
                </div>
              </div>
              <div className="bg-red-500/5 rounded-2xl p-5 border border-red-500/10">
                <p className="text-red-400 font-bold mb-3 tracking-wide uppercase text-xs flex items-center gap-2">⚠️ Missing Skills</p>
                <div className="flex flex-wrap gap-2">
                  {matchScore.missingSkills?.map((s) => <span key={s} className="px-2.5 py-1 bg-red-500/10 text-red-300 font-medium text-xs rounded-lg border border-red-500/20">{s}</span>)}
                </div>
              </div>
            </div>
            {matchScore.summary && <p className="text-sm text-white/60 mt-6 italic leading-relaxed text-center px-4">"{matchScore.summary}"</p>}
          </div>
        )}

        {/* Assessment Score */}
        {assessment && (
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl transition-all hover:bg-white/[0.03] hover:border-white/15">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 drop-shadow-md">
              📊 Assessment Score
              <span className={`ml-auto px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase ${
                assessment.verdict === "PASS" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
              }`}>{assessment.verdict ?? "–"}</span>
            </h2>
            <div className="flex items-center gap-8 mb-8 bg-white/5 rounded-2xl p-6 border border-white/5">
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">{assessment.percentage}%</div>
              <div className="flex-1">
                <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden shadow-inner mb-2">
                  <div className={`h-4 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_currentColor] ${assessment.percentage >= 50 ? "bg-gradient-to-r from-emerald-600 to-emerald-400 text-emerald-400" : "bg-gradient-to-r from-red-600 to-red-400 text-red-400"}`} style={{ width: `${assessment.percentage}%` }} />
                </div>
                <p className="text-xs font-semibold text-white/40 tracking-wider uppercase">Pass threshold: 50%</p>
              </div>
            </div>
            {assessment.categoryScores && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(assessment.categoryScores as Record<string, number>).map(([cat, score]) => (
                  <div key={cat} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider truncate">{cat.replace("_", " ")}</div>
                    <div className="text-xl font-bold text-white mb-2">{score}%</div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-violet-500 to-purple-400 h-1.5 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)] transition-all duration-1000" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Screening Score */}
        {screening && (
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl transition-all hover:bg-white/[0.03] hover:border-white/15">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 drop-shadow-md">
              📋 Screening Interview
              {screening.verdict && (
                <span className="ml-auto text-xs font-bold text-white/50 border border-white/10 px-3 py-1.5 rounded-full uppercase tracking-wider bg-white/5">Verdict: {screening.verdict}</span>
              )}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: "Communication", value: screening.communicationScore },
                { label: "Technical", value: screening.technicalScore },
                { label: "Overall", value: screening.overallScore },
              ].map((item) => item.value !== null && (
                <div key={item.label} className="text-center bg-white/5 rounded-2xl p-6 border border-white/5 hover:bg-white/10 transition-all duration-300 group">
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-600 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">{item.value}<span className="text-xl text-white/30 font-medium">/10</span></div>
                  <div className="text-xs font-semibold text-white/50 mt-3 uppercase tracking-wider">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Client Decision */}
        {!submitted && (
          <div className="bg-gradient-to-br from-violet-900/40 to-purple-900/40 backdrop-blur-2xl border border-violet-500/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(139,92,246,0.15)] mt-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight drop-shadow-md">Submit Your Decision</h2>
              <p className="text-sm text-white/60 mb-6 font-medium">Let the recruiter know your feedback on this candidate.</p>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optional: Add your feedback or comments..."
                className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-sm text-gray-200 placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none h-28 mb-6 shadow-inner transition-all"
              />

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => submitDecision("APPROVED")}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 border border-emerald-400/30 active:scale-95"
                >
                  <span className="text-lg drop-shadow-sm">✅</span> Approve
                </button>
                <button
                  onClick={() => submitDecision("NEED_INTERVIEW")}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 border border-amber-400/30 active:scale-95"
                >
                  <span className="text-lg drop-shadow-sm">📅</span> Need Interview
                </button>
                <button
                  onClick={() => submitDecision("REJECTED")}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2 border border-red-500/30 active:scale-95"
                >
                  <span className="text-lg drop-shadow-sm">❌</span> Reject
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs font-semibold text-white/30 pb-6 pt-4 uppercase tracking-widest">
          Powered by 99 Placement RMS · Secure & Confidential
        </p>
      </div>
    </div>
  );
}
