import React, { useState } from "react";
import {
  useAssessmentQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useWeakQuestions,
} from "@/modules/assessment/hooks/useAssessmentQuestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/providers/ToastProvider";
import { Plus, Search, Filter, BookOpen, AlertTriangle, Eye, ShieldAlert, Edit, Trash2 } from "lucide-react";

export function QuestionBankTab() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  
  // Form fields
  const [formCategory, setFormCategory] = useState("aptitude");
  const [formDifficulty, setFormDifficulty] = useState("medium");
  const [formText, setFormText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState("0");

  const { data, isLoading, refetch } = useAssessmentQuestions({
    category: category || undefined,
    difficulty: difficulty || undefined,
    isActive: true,
    page,
    pageSize: 10,
  });

  const { data: weakQuestions } = useWeakQuestions();
  
  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();
  const deleteMutation = useDeleteQuestion();

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setFormCategory("aptitude");
    setFormDifficulty("medium");
    setFormText("");
    setOptions(["", "", "", ""]);
    setCorrectOption("0");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (q: any) => {
    setEditingQuestion(q);
    setFormCategory(q.category);
    setFormDifficulty(q.difficulty);
    setFormText(q.questionText);
    setOptions(q.options || ["", "", "", ""]);
    setCorrectOption(String(q.correctOption));
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to archive/delete this question?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast("Question archived successfully", "success");
      refetch();
    } catch (err: any) {
      toast(err.message || "Failed to delete question", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) {
      toast("Question text is required", "error");
      return;
    }
    const filteredOptions = options.map(o => o.trim()).filter(Boolean);
    if (filteredOptions.length < 2) {
      toast("At least 2 options are required", "error");
      return;
    }

    const payload = {
      category: formCategory,
      difficulty: formDifficulty,
      questionText: formText,
      options: filteredOptions,
      correctOption: parseInt(correctOption),
    };

    try {
      if (editingQuestion) {
        await updateMutation.mutateAsync({ id: editingQuestion.id, data: payload });
        toast("Question updated (New version spawn registered)", "success");
      } else {
        await createMutation.mutateAsync(payload);
        toast("Question created successfully", "success");
      }
      setIsFormOpen(false);
      refetch();
    } catch (err: any) {
      toast(err.message || "Failed to save question", "error");
    }
  };

  const categories = [
    { value: "aptitude", label: "Aptitude" },
    { value: "mathematics", label: "Mathematics" },
    { value: "english", label: "English Language" },
    { value: "logical_reasoning", label: "Logical Reasoning" },
    { value: "computer_knowledge", label: "Computer Knowledge" },
    { value: "general_knowledge", label: "General Knowledge" },
    { value: "current_affairs", label: "Current Affairs" },
    { value: "technical", label: "Technical Competence" },
  ];

  return (
    <div className="space-y-6">
      {/* Flagged/Weak Questions Alert Deck */}
      {weakQuestions && weakQuestions.length > 0 && (
        <Card className="border border-red-200 bg-red-50/45 dark:bg-red-950/10 rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <ShieldAlert className="h-5 w-5" />
              <CardTitle className="text-sm font-extrabold uppercase">Outlier Questions Flagged</CardTitle>
            </div>
            <CardDescription className="text-xs text-red-600/80">
              The algorithm flagged {weakQuestions.length} questions that are statistically too hard or too easy (attempts &gt; 5).
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <div className="max-h-36 overflow-y-auto space-y-2 pr-2 text-xs">
              {weakQuestions.map((q: any) => (
                <div key={q.id} className="flex justify-between items-start p-2.5 bg-background/80 rounded-xl border border-red-100">
                  <div className="space-y-1">
                    <span className="font-semibold text-foreground line-clamp-1">{q.questionText}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-black">{q.category}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${q.status === "TOO_HARD" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      {q.status.replace("_", " ")}
                    </span>
                    <span className="text-muted-foreground text-[10px]">{q.passRate}% Pass Rate</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Control filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            options={[{ value: "", label: "All Categories" }, ...categories]}
            className="w-full sm:w-44"
          />
          <Select
            value={difficulty}
            onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
            options={[
              { value: "", label: "All Difficulties" },
              { value: "easy", label: "Easy" },
              { value: "medium", label: "Medium" },
              { value: "hard", label: "Hard" },
            ]}
            className="w-full sm:w-40"
          />
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto rounded-xl flex items-center gap-1.5 text-xs h-10 px-4">
          <Plus className="h-4 w-4" />
          <span>Add Question</span>
        </Button>
      </div>

      {/* Question Cards listing */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-muted-foreground font-semibold">Loading questions...</div>
      ) : !data || data.items.length === 0 ? (
        <Card className="border border-dashed p-12 text-center rounded-2xl flex flex-col items-center justify-center space-y-3">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
          <div>
            <h4 className="text-sm font-bold text-foreground">Empty Question Bank</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Add some technical, aptitude, or English MCQs to begin designing templates.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {data.items.map((q: any) => (
              <Card key={q.id} className="rounded-2xl border bg-card/45 backdrop-blur-md shadow-sm">
                <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-foreground/5 text-foreground px-2 py-0.5 rounded border">
                        {q.category.replace("_", " ")}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        q.difficulty === "easy" || q.difficulty === "EASY" ? "bg-green-50 text-green-700 border-green-200" :
                        q.difficulty === "medium" || q.difficulty === "MEDIUM" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground">Version: v{q.version}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground leading-relaxed">{q.questionText}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {q.options.map((opt: string, idx: number) => (
                        <div key={idx} className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
                          idx === q.correctOption 
                            ? "bg-green-50/50 border-green-200 text-green-800 dark:text-green-300 font-bold" 
                            : "bg-muted/30 border-border/40 text-muted-foreground"
                        }`}>
                          <span className="h-5 w-5 rounded-full bg-foreground/5 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="line-clamp-1">{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start pt-3 sm:pt-0 border-t sm:border-t-0 border-border/20 shrink-0">
                    <Button onClick={() => handleOpenEdit(q)} variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => handleDelete(q.id)} variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-500 hover:text-red-700 rounded-xl">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/20 pt-4">
              <span className="text-xs text-muted-foreground font-semibold">
                Page {page} of {data.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  variant="outline"
                  className="h-9 px-3 rounded-xl text-xs"
                >
                  Previous
                </Button>
                <Button
                  disabled={page === data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  variant="outline"
                  className="h-9 px-3 rounded-xl text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Dialog Modal */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingQuestion ? "Edit Question (Spawns New Version)" : "Add Question to Bank"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category *</label>
              <Select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                options={categories}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Difficulty *</label>
              <Select
                value={formDifficulty}
                onChange={(e) => setFormDifficulty(e.target.value)}
                options={[
                  { value: "easy", label: "Easy" },
                  { value: "medium", label: "Medium" },
                  { value: "hard", label: "Hard" },
                ]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Question Text *</label>
            <textarea
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              placeholder="e.g. In a class of 45 students, what is the probability that..."
              className="w-full min-h-[90px] p-3 text-xs bg-background rounded-2xl border border-border/70 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Answer Options *</label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-xl bg-foreground/5 flex items-center justify-center font-bold text-xs shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <Input
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...options];
                    newOpts[idx] = e.target.value;
                    setOptions(newOpts);
                  }}
                  placeholder={`Option ${idx + 1}`}
                  className="h-10 rounded-xl"
                  required
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Correct Option (0-indexed index) *</label>
            <Select
              value={correctOption}
              onChange={(e) => setCorrectOption(e.target.value)}
              options={options.map((_, idx) => ({
                value: String(idx),
                label: `Option ${String.fromCharCode(65 + idx)} (Option ${idx + 1})`,
              }))}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border/20 pt-4 mt-2">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="rounded-xl px-4 text-xs h-10">
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl px-4 text-xs h-10">
              {editingQuestion ? "Spawn Version" : "Add Question"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
