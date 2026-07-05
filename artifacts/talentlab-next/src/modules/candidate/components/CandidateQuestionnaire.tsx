"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/providers/ToastProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ClipboardList, Loader2, Save } from "lucide-react";
import { Candidate } from "../types";

interface CandidateQuestionnaireProps {
  candidate: Candidate;
}

const DEFAULT_QUESTIONS = [
  { id: "q1", text_en: "Are you comfortable with night shifts?", text_hi: "क्या आप नाईट शिफ्ट के साथ सहज हैं?", text_gu: "શું તમે નાઈટ શિફ્ટમાં કામ કરવા તૈયાર છો?" },
  { id: "q2", text_en: "Do you have your own vehicle for transport?", text_hi: "क्या आपके पास यात्रा के लिए अपना वाहन है?", text_gu: "શું તમારી પાસે મુસાફરી માટે પોતાનું વાહન છે?" },
  { id: "q3", text_en: "Are you willing to relocate?", text_hi: "क्या आप स्थानांतरण (रिलोकेट) करने को तैयार हैं?", text_gu: "શું તમે સ્થળાંતર (રિલોકેટ) કરવા તૈયાર છો?" },
  { id: "q4", text_en: "Can you provide 2 professional references?", text_hi: "क्या आप 2 पेशेवर संदर्भ दे सकते हैं?", text_gu: "શું તમે 2 વ્યાવસાયિક સંદર્ભો આપી શકો છો?" }
];

export function CandidateQuestionnaire({ candidate }: CandidateQuestionnaireProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [responses, setResponses] = useState<Record<string, string>>(
    candidate.questionnaireResponses || {}
  );

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.put(`/candidates/${candidate.id}`, {
        questionnaireResponses: data
      });
    },
    onSuccess: () => {
      toast("Questionnaire responses saved successfully!", "success");
      queryClient.invalidateQueries({ queryKey: ["candidate", candidate.id] });
    },
    onError: (err: any) => {
      toast(err.message || "Failed to save questionnaire", "error");
    }
  });

  const handleSave = () => {
    updateMutation.mutate(responses);
  };

  return (
    <Card className="border border-border/80 shadow-sm p-2">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-emerald-400" />
          Multilingual Candidate Questionnaire
        </CardTitle>
        <CardDescription>Record standardized candidate responses during screening</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-5">
          {DEFAULT_QUESTIONS.map((q, idx) => (
            <div key={q.id} className="bg-card/45 backdrop-blur-md border border-border/60 p-4 rounded-2xl space-y-3">
              <div className="space-y-1 border-b border-border/30 pb-2">
                <p className="text-xs font-bold text-foreground">
                  <span className="text-muted-foreground mr-2">Q{idx + 1}.</span> 
                  {q.text_en}
                </p>
                <p className="text-[10px] text-muted-foreground">{q.text_hi}</p>
                <p className="text-[10px] text-muted-foreground">{q.text_gu}</p>
              </div>
              
              <div className="pt-1">
                <Input
                  value={responses[q.id] || ""}
                  onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
                  placeholder="Record candidate's answer here..."
                  className="h-10 rounded-xl bg-background border-border/80"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-border/40">
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
            className="flex items-center gap-1.5 h-11 px-6 rounded-2xl cursor-pointer shadow"
          >
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Responses
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
