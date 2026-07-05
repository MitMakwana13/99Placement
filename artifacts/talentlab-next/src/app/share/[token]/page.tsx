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
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">99</div>
          <span className="font-semibold text-gray-200">99 Placement — Candidate Review</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>🔒 Secure Link</span>
          <span>·</span>
          <span>Expires: {new Date(data.shareLink.expiresAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Decision Banner */}
        {submitted && decision && (
          <div className={`${DECISION_COLORS[decision]} rounded-xl p-4 flex items-center gap-3`}>
            <span className="text-2xl">{decision === "APPROVED" ? "✅" : decision === "REJECTED" ? "❌" : "📅"}</span>
            <div>
              <p className="font-semibold text-white">Decision Submitted: {decision.replace("_", " ")}</p>
              {feedback && <p className="text-white/80 text-sm mt-1">"{feedback}"</p>}
            </div>
          </div>
        )}

        {/* Candidate Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-2xl font-bold text-white">
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
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-violet-400">✨</span> AI Screening Score
              <span className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold ${
                aiScore.recommendation === "SHORTLIST" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                aiScore.recommendation === "REJECT" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}>{aiScore.recommendation}</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
              {[
                { label: "Communication", value: aiScore.communication },
                { label: "Experience", value: aiScore.experience },
                { label: "Skills", value: aiScore.skills },
                { label: "Education", value: aiScore.education },
                { label: "Overall", value: aiScore.overall },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-3xl font-bold text-violet-400">{item.value}<span className="text-lg text-gray-500">/10</span></div>
                  <div className="text-xs text-gray-500 mt-1">{item.label}</div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
                    <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${item.value * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {aiScore.reasoning && (
              <p className="text-sm text-gray-400 bg-gray-800/50 rounded-lg p-3 mt-2 italic">"{aiScore.reasoning}"</p>
            )}
          </div>
        )}

        {/* Match Score */}
        {matchScore && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">🎯 Job Match Score</h2>
              <div className="text-4xl font-bold text-emerald-400">{matchScore.matchPercentage}%</div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-3 rounded-full transition-all" style={{ width: `${matchScore.matchPercentage}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-emerald-400 font-medium mb-2">✅ Matched Skills</p>
                <div className="flex flex-wrap gap-1">
                  {matchScore.matchedSkills?.map((s) => <span key={s} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 text-xs rounded border border-emerald-500/20">{s}</span>)}
                </div>
              </div>
              <div>
                <p className="text-red-400 font-medium mb-2">⚠️ Missing Skills</p>
                <div className="flex flex-wrap gap-1">
                  {matchScore.missingSkills?.map((s) => <span key={s} className="px-2 py-0.5 bg-red-500/10 text-red-300 text-xs rounded border border-red-500/20">{s}</span>)}
                </div>
              </div>
            </div>
            {matchScore.summary && <p className="text-sm text-gray-400 mt-3 italic">"{matchScore.summary}"</p>}
          </div>
        )}

        {/* Assessment Score */}
        {assessment && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              📊 Assessment Score
              <span className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold ${
                assessment.verdict === "PASS" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}>{assessment.verdict ?? "–"}</span>
            </h2>
            <div className="flex items-center gap-6 mb-4">
              <div className="text-5xl font-bold text-white">{assessment.percentage}%</div>
              <div className="flex-1">
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div className={`h-3 rounded-full ${assessment.percentage >= 50 ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${assessment.percentage}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Pass threshold: 50%</p>
              </div>
            </div>
            {assessment.categoryScores && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(assessment.categoryScores as Record<string, number>).map(([cat, score]) => (
                  <div key={cat} className="bg-gray-800/60 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">{cat.replace("_", " ")}</div>
                    <div className="text-lg font-bold text-white">{score}%</div>
                    <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                      <div className="bg-violet-500 h-1 rounded-full" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Screening Score */}
        {screening && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              📋 Screening Interview
              {screening.verdict && (
                <span className="ml-auto text-xs text-gray-400 border border-gray-700 px-2 py-1 rounded">Verdict: {screening.verdict}</span>
              )}
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Communication", value: screening.communicationScore },
                { label: "Technical", value: screening.technicalScore },
                { label: "Overall", value: screening.overallScore },
              ].map((item) => item.value !== null && (
                <div key={item.label} className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{item.value}<span className="text-gray-500 text-base">/10</span></div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Client Decision */}
        {!submitted && (
          <div className="bg-gray-900 border border-violet-500/30 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Submit Your Decision</h2>
            <p className="text-sm text-gray-400 mb-4">Let the recruiter know your feedback on this candidate.</p>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional: Add your feedback or comments..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-violet-500 resize-none h-24 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => submitDecision("APPROVED")}
                disabled={submitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => submitDecision("NEED_INTERVIEW")}
                disabled={submitting}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                📅 Need Interview
              </button>
              <button
                onClick={() => submitDecision("REJECTED")}
                disabled={submitting}
                className="flex-1 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                ❌ Reject
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-600 pb-4">
          Powered by 99 Placement RMS · Secure & Confidential
        </p>
      </div>
    </div>
  );
}
