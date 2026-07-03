import React, { useState } from "react";
import {
  useAssessmentTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from "@/modules/assessment/hooks/useAssessmentTemplates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/providers/ToastProvider";
import { Plus, Edit, Trash2, Copy, FileText, Settings, Clock, CheckCircle } from "lucide-react";

export function TemplatesTab() {
  const { toast } = useToast();
  const { data: templates, isLoading, refetch } = useAssessmentTemplates();
  
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [passPercentage, setPassPercentage] = useState("50");
  const [durationMinutes, setDurationMinutes] = useState("45");
  
  // Randomization rules configuration
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("medium");
  const [rules, setRules] = useState<{ category: string; count: number }[]>([
    { category: "aptitude", count: 5 }
  ]);

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

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setName("");
    setDescription("");
    setPassPercentage("50");
    setDurationMinutes("45");
    setSelectedDifficulty("medium");
    setRules([{ category: "aptitude", count: 5 }]);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingTemplate(t);
    setName(t.name);
    setDescription(t.description || "");
    setPassPercentage(String(t.passPercentage));
    setDurationMinutes(String(t.durationMinutes));
    
    // Parse randomizationRules
    if (t.randomizationRules) {
      setSelectedDifficulty(t.randomizationRules.difficulty || "medium");
      const loadedRules = Object.entries(t.randomizationRules.categories || {}).map(([cat, val]) => ({
        category: cat,
        count: Number(val),
      }));
      setRules(loadedRules.length > 0 ? loadedRules : [{ category: "aptitude", count: 5 }]);
    } else {
      setSelectedDifficulty("medium");
      setRules([{ category: "aptitude", count: 5 }]);
    }
    setIsFormOpen(true);
  };

  const handleClone = (t: any) => {
    setName(`${t.name} (Copy)`);
    setDescription(t.description || "");
    setPassPercentage(String(t.passPercentage));
    setDurationMinutes(String(t.durationMinutes));
    
    if (t.randomizationRules) {
      setSelectedDifficulty(t.randomizationRules.difficulty || "medium");
      const loadedRules = Object.entries(t.randomizationRules.categories || {}).map(([cat, val]) => ({
        category: cat,
        count: Number(val),
      }));
      setRules(loadedRules.length > 0 ? loadedRules : [{ category: "aptitude", count: 5 }]);
    } else {
      setSelectedDifficulty("medium");
      setRules([{ category: "aptitude", count: 5 }]);
    }
    setEditingTemplate(null); // Create as new
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast("Template deleted successfully", "success");
      refetch();
    } catch (err: any) {
      toast(err.message || "Failed to delete template", "error");
    }
  };

  const handleAddRule = () => {
    setRules([...rules, { category: "aptitude", count: 5 }]);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleRuleChange = (index: number, field: "category" | "count", value: any) => {
    const updated = [...rules];
    updated[index] = {
      ...updated[index],
      [field]: field === "count" ? parseInt(value) || 0 : value,
    };
    setRules(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast("Template name is required", "error");
      return;
    }

    // Convert rules array to categories record
    const categoriesRecord: Record<string, number> = {};
    let totalQuestions = 0;
    rules.forEach((r) => {
      if (r.category && r.count > 0) {
        categoriesRecord[r.category] = (categoriesRecord[r.category] || 0) + r.count;
        totalQuestions += r.count;
      }
    });

    if (totalQuestions === 0) {
      toast("Specify at least 1 question under rules selection", "error");
      return;
    }

    const payload = {
      name,
      description: description || null,
      passPercentage: parseInt(passPercentage),
      durationMinutes: parseInt(durationMinutes),
      randomizationRules: {
        categories: categoriesRecord,
        difficulty: selectedDifficulty as any,
      },
    };

    try {
      if (editingTemplate) {
        await updateMutation.mutateAsync({ id: editingTemplate.id, data: payload });
        toast("Template updated successfully", "success");
      } else {
        await createMutation.mutateAsync(payload);
        toast("Template created successfully", "success");
      }
      setIsFormOpen(false);
      refetch();
    } catch (err: any) {
      toast(err.message || "Failed to save template", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-0.5">
          <h3 className="text-sm font-extrabold uppercase text-foreground">Assessment Templates</h3>
          <p className="text-xs text-muted-foreground">Configure standardized tests and rules for automatic question selection.</p>
        </div>
        <Button onClick={handleOpenCreate} className="rounded-xl flex items-center gap-1.5 text-xs h-10 px-4">
          <Plus className="h-4 w-4" />
          <span>New Template</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-xs text-muted-foreground font-semibold">Loading templates...</div>
      ) : !templates || templates.length === 0 ? (
        <Card className="border border-dashed p-12 text-center rounded-2xl flex flex-col items-center justify-center space-y-3">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <div>
            <h4 className="text-sm font-bold text-foreground">No Templates Configured</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Create a template with question rules to assign to candidates in bulk.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t: any) => {
            // Count total questions in rules
            const totalQ = t.randomizationRules?.categories
              ? (Object.values(t.randomizationRules.categories).reduce((a: any, b: any) => a + b, 0) as number)
              : 0;

            return (
              <Card key={t.id} className="rounded-2xl border bg-card/45 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-bold text-foreground line-clamp-1">{t.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2 h-8">{t.description || "No description provided."}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-4">
                  <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 border border-border/30 rounded-xl text-center">
                    <div>
                      <span className="text-[9px] font-black uppercase text-muted-foreground block">Duration</span>
                      <span className="text-xs font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" /> {t.durationMinutes}m
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-muted-foreground block">Pass %</span>
                      <span className="text-xs font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
                        <CheckCircle className="h-3 w-3 text-muted-foreground" /> {t.passPercentage}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-muted-foreground block">Questions</span>
                      <span className="text-xs font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
                        <Settings className="h-3 w-3 text-muted-foreground" /> {totalQ}
                      </span>
                    </div>
                  </div>

                  {t.randomizationRules?.categories && (
                    <div className="space-y-1 text-xs">
                      <span className="text-[9px] font-black uppercase text-muted-foreground">Selection Rules:</span>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(t.randomizationRules.categories).map(([cat, count]: any) => (
                          <span key={cat} className="text-[10px] font-semibold bg-foreground/5 text-foreground px-2 py-0.5 rounded-full border border-border/40">
                            {cat.replace("_", " ")}: {count}
                          </span>
                        ))}
                        {t.randomizationRules.difficulty && (
                          <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                            Diff: {t.randomizationRules.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 border-t border-border/20 pt-4 shrink-0">
                    <Button onClick={() => handleClone(t)} variant="outline" size="sm" className="h-9 px-3 rounded-xl flex items-center gap-1 text-xs text-muted-foreground">
                      <Copy className="h-3.5 w-3.5" />
                      <span>Clone</span>
                    </Button>
                    <Button onClick={() => handleOpenEdit(t)} variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => handleDelete(t.id)} variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-500 hover:text-red-700 rounded-xl">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialog Modal */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingTemplate ? "Edit Template Configuration" : "Create Standard Assessment"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Template Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Software Engineer Pre-screen MCQ"
              className="h-10 rounded-xl"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Standard 45 minutes pre-screen assessment covering coding and aptitude."
              className="h-10 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Duration (Minutes) *</label>
              <Input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min="5"
                max="240"
                className="h-10 rounded-xl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pass Score Percentage *</label>
              <Input
                type="number"
                value={passPercentage}
                onChange={(e) => setPassPercentage(e.target.value)}
                min="1"
                max="100"
                className="h-10 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-border/20 pt-4 mt-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Question Bank Rules Selection</label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddRule} className="h-8 rounded-lg px-2 text-[10px]">
                + Add Rule Row
              </Button>
            </div>

            <div className="space-y-2">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Select
                    value={rule.category}
                    onChange={(e) => handleRuleChange(idx, "category", e.target.value)}
                    options={categories}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={String(rule.count)}
                    onChange={(e) => handleRuleChange(idx, "count", e.target.value)}
                    min="1"
                    className="w-20 h-10 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={rules.length === 1}
                    onClick={() => handleRemoveRule(idx)}
                    className="text-red-500 hover:text-red-700 h-10 w-10 p-0 rounded-xl border border-border/40 bg-muted/10 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 mt-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Force Target Difficulty</label>
              <Select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                options={[
                  { value: "easy", label: "Easy questions only" },
                  { value: "medium", label: "Medium questions only" },
                  { value: "hard", label: "Hard questions only" },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border/20 pt-4 mt-2">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="rounded-xl px-4 text-xs h-10">
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl px-4 text-xs h-10">
              {editingTemplate ? "Save Changes" : "Create Template"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
