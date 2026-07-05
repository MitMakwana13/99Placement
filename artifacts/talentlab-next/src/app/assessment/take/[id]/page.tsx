"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useCandidateTest,
  useStartTest,
  useSubmitAnswer,
  useCompleteTest,
} from "@/modules/assessment/hooks/useAssessmentTests";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/providers/ToastProvider";
import { Clock, CheckCircle2, ChevronRight, ChevronLeft, Send, ShieldAlert, Award } from "lucide-react";

export default function CandidatePublicTestPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { toast } = useToast();

  const { data: test, isLoading, refetch } = useCandidateTest(id);
  const startMutation = useStartTest();
  const submitAnswerMutation = useSubmitAnswer();
  const completeMutation = useCompleteTest();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOffline(!window.navigator.onLine);
      const handleOnline = () => {
        setIsOffline(false);
        toast("Reconnected to internet! Progress auto-save resumed.", "success");
      };
      const handleOffline = () => {
        setIsOffline(true);
        toast("Internet connection lost. Please do not refresh. Your progress is cached.", "error");
      };
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [toast]);

  // Auto-start test if not already started
  useEffect(() => {
    if (test && !test.startedAt && !test.completedAt) {
      startMutation.mutate(id, {
        onSuccess: () => {
          toast("Test has started! Timer is ticking.", "info");
          refetch();
        },
        onError: (err: any) => {
          toast(err.message || "Failed to start test.", "error");
        },
      });
    }
  }, [test, id]);

  // Timer countdown hook
  useEffect(() => {
    if (!test || !test.startedAt || test.completedAt) return;

    const durationMs = test.durationMinutes * 60 * 1000;
    const expiryTime = new Date(test.startedAt).getTime() + durationMs;

    const updateTimer = () => {
      const remainingMs = expiryTime - new Date().getTime();
      if (remainingMs <= 0) {
        setTimeLeft(0);
        clearInterval(timerInterval);
        // Trigger auto submit
        handleAutoSubmit();
      } else {
        setTimeLeft(Math.floor(remainingMs / 1000));
      }
    };

    updateTimer(); // run once immediately
    const timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval);
  }, [test]);

  const handleAutoSubmit = async () => {
    toast("Time limit expired! Auto-submitting your test...", "warning");
    try {
      await completeMutation.mutateAsync(id);
      toast("Test submitted successfully", "success");
      refetch();
    } catch (err: any) {
      toast(err.message || "Error submitting test", "error");
    }
  };

  const handleSelectOption = async (optionIdx: number) => {
    if (!test || test.completedAt) return;
    const currentQuestion = test.results[currentIdx];
    try {
      await submitAnswerMutation.mutateAsync({
        testId: id,
        questionId: currentQuestion.questionId,
        selectedOption: optionIdx,
      });
      // Refresh local test state to update the checkmark for answered question
      refetch();
    } catch (err: any) {
      toast(err.message || "Failed to save answer automatically", "error");
    }
  };

  const handleSubmitTest = async () => {
    setIsSubmitConfirmOpen(false);
    try {
      await completeMutation.mutateAsync(id);
      toast("Test completed and graded!", "success");
      refetch();
    } catch (err: any) {
      toast(err.message || "Error submitting test", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center py-20 text-xs font-semibold text-muted-foreground animate-pulse">Loading exam session...</div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center py-20 text-xs text-muted-foreground">Exam session not found or link is invalid.</div>
      </div>
    );
  }

  // Format timer display
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const currentResultSlot = test.results[currentIdx];
  const totalQuestions = test.results.length;

  // Post-submit completion view
  if (test.completedAt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border rounded-3xl shadow-xl bg-card/50 backdrop-blur-md overflow-hidden">
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto h-16 w-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary">
              <Award className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-foreground">Exam Cycle Complete</h2>
              <p className="text-xs text-muted-foreground">Your responses have been successfully graded by the engine.</p>
            </div>

            <div className="p-4 bg-muted/40 border border-border/30 rounded-2xl">
              <p className="text-xs text-muted-foreground">
                Your evaluation results have been securely transmitted to the recruitment team. They will contact you with the next steps of your application.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400">
                Completed
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground pt-2">
              You can now safely close this browser window.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* distraction-free navigation header */}
      <header className="border-b bg-card/65 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary">Candidate Assessment Center</span>
          <h1 className="text-base font-extrabold text-foreground tracking-tight">{test.template?.name || "Mcq Assessment"}</h1>
        </div>

        {/* Countdown Timer Display */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-muted/40 text-xs font-black">
          <Clock className={`h-4 w-4 ${timeLeft !== null && timeLeft < 120 ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
          <span className={timeLeft !== null && timeLeft < 120 ? "text-red-500" : ""}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </header>

      {isOffline && (
        <div className="bg-red-500 text-white text-xs font-black py-2.5 px-6 flex items-center gap-2 justify-center animate-pulse border-b border-red-600">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>INTERNET DISCONNECTED — DO NOT CLOSE OR REFRESH. PROGRESS WILL RE-SYNC AUTOMATICALLY.</span>
        </div>
      )}

      {/* Main layout containing Nav and Question pane */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Questions numbers navigation menu */}
        <div className="md:col-span-1 space-y-4 order-2 md:order-1">
          <Card className="rounded-2xl border bg-card/45 backdrop-blur-md">
            <CardContent className="p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                Question Navigator
              </span>
              <div className="grid grid-cols-5 gap-2">
                {test.results.map((r: any, idx: number) => {
                  const isAnswered = r.selectedOption !== null;
                  const isCurrent = idx === currentIdx;
                  
                  let btnStyle = "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50";
                  if (isAnswered) {
                    btnStyle = "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20";
                  }
                  if (isCurrent) {
                    btnStyle = "bg-foreground border-foreground text-background font-black shadow-sm scale-105";
                  }

                  return (
                    <button
                      key={r.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-9 rounded-xl border flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-border/30 mt-4 pt-4">
                <Button
                  onClick={() => setIsSubmitConfirmOpen(true)}
                  className="w-full rounded-xl text-xs h-10 flex items-center justify-center gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit Exam</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected question details panel */}
        <div className="md:col-span-3 space-y-6 order-1 md:order-2">
          {currentResultSlot ? (
            <Card className="rounded-3xl border bg-card/40 backdrop-blur-md shadow-sm">
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-foreground/5 border">
                    Question {currentIdx + 1} of {totalQuestions}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Auto-saving enabled
                  </span>
                </div>

                <h2 className="text-base md:text-lg font-bold text-foreground leading-relaxed">
                  {currentResultSlot.question?.questionText || "Question Content Hidden"}
                </h2>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  {currentResultSlot.question?.options?.map((opt: string, optIdx: number) => {
                    const isSelected = currentResultSlot.selectedOption === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full p-4 rounded-2xl border text-left text-xs transition-all flex items-center gap-3 cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 border-primary text-primary font-black shadow-sm"
                            : "bg-muted/20 border-border/40 hover:bg-muted/40 text-foreground"
                        }`}
                      >
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-foreground/5"
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center border-t border-border/20 pt-6">
                  <Button
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((i) => i - 1)}
                    variant="outline"
                    className="h-10 rounded-xl px-3 text-xs flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>
                  <Button
                    disabled={currentIdx === totalQuestions - 1}
                    onClick={() => setCurrentIdx((i) => i + 1)}
                    variant="outline"
                    className="h-10 rounded-xl px-3 text-xs flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 text-xs text-muted-foreground">Error loading question.</div>
          )}
        </div>
      </main>

      {/* footer bar */}
      <footer className="border-t bg-card/45 backdrop-blur-md px-6 py-3 text-center text-[10px] text-muted-foreground font-semibold">
        © 99 Placement Candidate Portal. Secure assessment engine.
      </footer>

      {/* Submit Confirmation Modal Dialog */}
      {isSubmitConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="max-w-sm w-full border rounded-3xl bg-card shadow-2xl overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto h-12 w-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold uppercase text-foreground">Finish Assessment?</h3>
                <p className="text-xs text-muted-foreground">
                  You are about to submit your exam. Once submitted, answers cannot be altered.
                </p>
              </div>

              <div className="flex gap-2 border-t border-border/20 pt-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSubmitConfirmOpen(false)}
                  className="flex-1 rounded-xl text-xs h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitTest}
                  disabled={completeMutation.isPending}
                  className="flex-1 rounded-xl text-xs h-10"
                >
                  {completeMutation.isPending ? "Submitting..." : "Yes, Submit"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
