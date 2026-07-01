import { supabase } from "./supabase";
import { candidates as mockCandidates, type Candidate } from "./mock-data";

export async function getCandidates() {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.log("No Supabase URL found, using mock data");
    return mockCandidates;
  }

  const { data, error } = await supabase.from("candidates").select("*");
  if (error) {
    console.error("Error fetching candidates:", error);
    return mockCandidates;
  }
  
  return data.map((d) => ({
    ...d,
    expectedCtc: d.expected_ctc,
    noticeDays: d.notice_days,
    history: []
  })) as Candidate[];
}

export async function addCandidate(candidate: Omit<Candidate, "id" | "history">) {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    const newCandidate = { ...candidate, id: `C-${Date.now()}`, history: [] };
    mockCandidates.push(newCandidate);
    return newCandidate;
  }

  const { data, error } = await supabase.from("candidates").insert({
    name: candidate.name,
    initials: candidate.initials,
    role: candidate.role,
    experience: candidate.experience,
    location: candidate.location,
    skills: candidate.skills,
    source: candidate.source,
    stage: candidate.stage,
    notice_days: candidate.noticeDays,
    expected_ctc: candidate.expectedCtc,
    email: candidate.email,
    phone: candidate.phone,
    summary: candidate.summary,
  }).select().single();

  if (error) {
    console.error("Error inserting candidate:", error);
    throw error;
  }

  return {
    ...data,
    expectedCtc: data.expected_ctc,
    noticeDays: data.notice_days,
    history: []
  } as Candidate;
}
