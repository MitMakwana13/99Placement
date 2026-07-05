"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Play, ArrowRight, Trash2, Mail, MessageCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/providers/ToastProvider";

// Types
type WorkflowStep = {
  id?: string;
  order: number;
  name: string;
  type: string;
  config: any;
};

type Workflow = {
  id: string;
  name: string;
  description: string;
  triggerEvent: string;
  isActive: boolean;
  steps: WorkflowStep[];
};

export default function WorkflowsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState<Partial<Workflow>>({
    name: "",
    description: "",
    triggerEvent: "CandidateCreated",
    isActive: true,
    steps: []
  });

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      const res = await apiClient.get<Workflow[]>("/workflows");
      return res;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (wf: Partial<Workflow>) => {
      const res = await apiClient.post<Workflow>("/workflows", wf);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast("Workflow created successfully!", "success");
      setIsCreating(false);
      setNewWorkflow({ name: "", description: "", triggerEvent: "CandidateCreated", isActive: true, steps: [] });
    },
    onError: (err: any) => {
      toast(err.message || "Failed to create workflow", "error");
    }
  });

  const addStep = (type: string) => {
    setNewWorkflow(prev => ({
      ...prev,
      steps: [
        ...(prev.steps || []),
        {
          order: (prev.steps || []).length,
          name: `New ${type} Step`,
          type,
          config: type === "SEND_EMAIL" ? { template: "", subject: "" } : { message: "" }
        }
      ]
    }));
  };

  const removeStep = (index: number) => {
    setNewWorkflow(prev => {
      const newSteps = [...(prev.steps || [])];
      newSteps.splice(index, 1);
      return { ...prev, steps: newSteps.map((s, i) => ({ ...s, order: i })) };
    });
  };

  const handleCreate = () => {
    if (!newWorkflow.name) return toast("Please provide a workflow name", "error");
    createMutation.mutate(newWorkflow);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" /> 
            Workflow Automation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Design and automate your recruitment processes.</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="rounded-xl shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> New Workflow
          </Button>
        )}
      </div>

      {isCreating ? (
        <Card className="border border-border/80 shadow-sm glass-panel overflow-hidden">
          <div className="bg-muted/30 px-6 py-4 border-b border-border/40 flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground">Create New Workflow</h2>
            <div className="space-x-3">
              <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} isLoading={createMutation.isPending}>Save & Activate</Button>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workflow Name</label>
                <input 
                  type="text" 
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-background border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="e.g., Send Welcome Email" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trigger Event</label>
                <select 
                  value={newWorkflow.triggerEvent}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, triggerEvent: e.target.value }))}
                  className="w-full bg-background border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="CandidateCreated">Candidate Created</option>
                  <option value="PipelineStageChanged">Pipeline Stage Changed</option>
                  <option value="InterviewScheduled">Interview Scheduled</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Play className="h-5 w-5 text-emerald-500" />
                <span className="font-bold text-sm">When </span>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold border border-emerald-500/20">{newWorkflow.triggerEvent}</span>
                <span className="font-bold text-sm"> happens...</span>
              </div>

              {(newWorkflow.steps || []).map((step, idx) => (
                <div key={idx} className="flex flex-col ml-2 border-l-2 border-border/60 pl-6 pb-2 relative">
                  <div className="absolute w-4 h-0.5 bg-border/60 left-0 top-6" />
                  <Card className="border border-border shadow-none">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 bg-muted/20">
                      <div className="flex items-center gap-3">
                        {step.type === "SEND_EMAIL" ? <Mail className="h-4 w-4 text-primary" /> : <MessageCircle className="h-4 w-4 text-emerald-500" />}
                        <CardTitle className="text-sm">{step.name}</CardTitle>
                      </div>
                      <button onClick={() => removeStep(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {step.type === "SEND_EMAIL" && (
                        <>
                          <input type="text" placeholder="Subject" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" value={step.config.subject} onChange={(e) => {
                            const newSteps = [...(newWorkflow.steps || [])];
                            newSteps[idx].config.subject = e.target.value;
                            setNewWorkflow({ ...newWorkflow, steps: newSteps });
                          }} />
                          <textarea placeholder="Email Body" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm h-20" value={step.config.template} onChange={(e) => {
                            const newSteps = [...(newWorkflow.steps || [])];
                            newSteps[idx].config.template = e.target.value;
                            setNewWorkflow({ ...newWorkflow, steps: newSteps });
                          }} />
                        </>
                      )}
                      {step.type === "SEND_WHATSAPP" && (
                        <textarea placeholder="WhatsApp Message" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm h-20" value={step.config.message} onChange={(e) => {
                          const newSteps = [...(newWorkflow.steps || [])];
                          newSteps[idx].config.message = e.target.value;
                          setNewWorkflow({ ...newWorkflow, steps: newSteps });
                        }} />
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}

              <div className="flex flex-col ml-2 border-l-2 border-border/60 pl-6 relative pt-4">
                <div className="absolute w-4 h-0.5 bg-border/60 left-0 top-8" />
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => addStep("SEND_EMAIL")} className="border-dashed">
                    <Mail className="h-4 w-4 mr-2" /> Add Email Action
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addStep("SEND_WHATSAPP")} className="border-dashed text-emerald-500 hover:text-emerald-600 border-emerald-500/30">
                    <MessageCircle className="h-4 w-4 mr-2" /> Add WhatsApp Action
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-12 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
          ) : workflows.length === 0 ? (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/10">
              <Settings className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">No Workflows Active</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first automated workflow to save time.</p>
              <Button onClick={() => setIsCreating(true)}><Plus className="h-4 w-4 mr-2" /> Create Workflow</Button>
            </div>
          ) : (
            workflows.map((wf) => (
              <Card key={wf.id} className="border border-border/80 shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{wf.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">Triggers on <span className="font-semibold text-primary">{wf.triggerEvent}</span></CardDescription>
                    </div>
                    {wf.isActive ? (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] rounded-full font-bold border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Active</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] rounded-full font-bold">Paused</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 pb-4 bg-muted/5">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Execution Flow</p>
                    {wf.steps.map((s, idx) => (
                      <div key={s.id} className="flex items-center gap-3 text-sm">
                        <div className="h-6 w-6 rounded bg-background border flex items-center justify-center text-xs font-bold text-muted-foreground">{idx + 1}</div>
                        {s.type === "SEND_EMAIL" ? <Mail className="h-4 w-4 text-primary" /> : <MessageCircle className="h-4 w-4 text-emerald-500" />}
                        <span className="font-medium">{s.name}</span>
                      </div>
                    ))}
                    {wf.steps.length === 0 && <span className="text-xs text-muted-foreground italic">No steps defined</span>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
