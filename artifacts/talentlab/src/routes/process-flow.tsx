import { PageHeader, tone } from "@/components/app-shell";
import { ArrowRight, CheckCircle2, ClipboardList, Search, Users, Target, CalendarDays, MessageSquare, HandCoins, FileCheck, CalendarClock, Flag, Zap } from "lucide-react";


const steps = [
  {
    num: 1,
    title: "Requirement Collection",
    desc: "Gather JD, qualifications, salary, location, and timeline from client.",
    icon: ClipboardList,
    tone: "pastel-yellow",
    stage: "Pipeline",
  },
  {
    num: 2,
    title: "Candidate Sourcing",
    desc: "Source candidates through portals, social, references & internal DB.",
    icon: Search,
    tone: "pastel-peach",
    stage: "Pipeline",
  },
  {
    num: 3,
    title: "99 Screening & Assessment",
    desc: "Mandatory first interview + assessment test at 99 Placement Consultancy.",
    icon: Target,
    tone: "pastel-pink",
    stage: "Pipeline",
  },
  {
    num: 4,
    title: "Client Interview Coordination",
    desc: "Share profiles and schedule interviews as per client availability.",
    icon: CalendarDays,
    tone: "pastel-blue",
    stage: "Pipeline",
  },
  {
    num: 5,
    title: "Interview Feedback",
    desc: "Collect feedback from both client and candidate, coordinate next rounds.",
    icon: MessageSquare,
    tone: "pastel-lavender",
    stage: "Operations",
  },
  {
    num: 6,
    title: "Salary Negotiation",
    desc: "Facilitate negotiations between client and candidate to mutual agreement.",
    icon: HandCoins,
    tone: "pastel-green",
    stage: "Operations",
  },
  {
    num: 7,
    title: "Offer Management",
    desc: "Assist client in issuing offer letter and obtain acceptance.",
    icon: FileCheck,
    tone: "pastel-yellow",
    stage: "Operations",
  },
  {
    num: 8,
    title: "Pre-Joining Follow-Up",
    desc: "Track notice period progress and resolve any concerns.",
    icon: CalendarClock,
    tone: "pastel-peach",
    stage: "Operations",
  },
  {
    num: 9,
    title: "Candidate Joining",
    desc: "Confirm successful joining with the client and get documentation.",
    icon: Users,
    tone: "pastel-pink",
    stage: "Operations",
  },
  {
    num: 10,
    title: "Post-Joining Support",
    desc: "Follow up for smooth onboarding and manage guarantees if applicable.",
    icon: Flag,
    tone: "pastel-blue",
    stage: "Operations",
  },
];

export function ProcessFlowPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="99 Placement Hiring Process"
        subtitle="The official 10-step recruitment process flow as defined in the PRD."
      />

      <div className="relative mt-8 max-w-5xl">
        {/* Vertical line connecting steps */}
        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-border/60 hidden md:block" />

        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="relative flex flex-col md:flex-row gap-6 md:items-start group">
                <div className="hidden md:flex shrink-0 items-center justify-center w-16 h-16 rounded-3xl z-10 bg-background border-4 border-background transition-transform group-hover:scale-110">
                  <div className={`w-full h-full rounded-2xl flex items-center justify-center ${tone(step.tone)}`}>
                    <Icon className="w-6 h-6 opacity-80" />
                  </div>
                </div>

                <div className={`flex-1 rounded-3xl p-6 transition-colors border border-transparent hover:border-border/40 ${tone(step.tone)} bg-opacity-20`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold opacity-50">Step {step.num}</span>
                      <span className="text-[10px] uppercase tracking-wider font-bold opacity-60 bg-background/40 px-2 py-0.5 rounded-full">
                        {step.stage}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm opacity-80 leading-relaxed max-w-2xl">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
