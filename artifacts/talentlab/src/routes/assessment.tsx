import { useParams } from "wouter";
import { useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { tone } from "@/components/app-shell";

const questions = [
  { id: 1, text: "Which hook is used to perform side effects in React?", options: ["useState", "useEffect", "useMemo", "useRef"], correct: 1 },
  { id: 2, text: "What is the Big O time complexity of binary search?", options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"], correct: 2 },
  { id: 3, text: "Which CSS property is used to create a flex container?", options: ["display: grid", "display: block", "display: flex", "position: flex"], correct: 2 },
];

export function AssessmentPage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (qId: number, oIdx: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: oIdx }));
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
    } else {
      setSubmitted(true);
      console.log("Submitting assessment for", candidateId, answers);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="card-pastel flex max-w-md flex-col items-center text-center bg-card shadow-lg p-8">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--pastel-green)] text-[var(--pastel-green-ink)] mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold">Assessment Complete!</h1>
          <p className="mt-2 text-muted-foreground">Thank you for submitting your responses. The recruiting team will review your results and get back to you shortly.</p>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <div className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">99Placement Assessment</div>
          <h1 className="mt-2 text-3xl font-bold">Technical Screening</h1>
          <p className="mt-2 text-muted-foreground">Question {current + 1} of {questions.length}</p>
        </div>

        <div className="card-pastel bg-card shadow-xl p-6 md:p-10">
          <h2 className="text-xl font-semibold leading-relaxed">{q.text}</h2>
          <div className="mt-8 space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelect(q.id, i)}
                className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${answers[q.id] === i ? "border-[var(--ink)] bg-[var(--pastel-blue)] text-[var(--pastel-blue-ink)] font-semibold" : "border-transparent bg-muted hover:bg-muted/70"}`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="mt-10 flex justify-end">
            <button
              onClick={handleNext}
              disabled={answers[q.id] === undefined}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 font-semibold text-background disabled:opacity-50"
            >
              {current === questions.length - 1 ? "Submit Assessment" : "Next Question"}
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
