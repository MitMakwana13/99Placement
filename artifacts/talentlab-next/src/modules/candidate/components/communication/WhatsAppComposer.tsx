import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/providers/ToastProvider";
import { apiClient } from "@/lib/api-client";
import { Send } from "lucide-react";

interface WhatsAppComposerProps {
  candidatePhone: string | null;
  pipelineId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppComposer({ candidatePhone, pipelineId, isOpen, onClose }: WhatsAppComposerProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!pipelineId) {
      toast("No active pipeline for this candidate.", "error");
      return;
    }
    if (!candidatePhone) {
      toast("Candidate has no phone number on file.", "error");
      return;
    }
    if (!message.trim()) {
      toast("Please enter a message.", "error");
      return;
    }

    setIsSending(true);
    try {
      await apiClient.post("/communication/whatsapp", {
        to: candidatePhone,
        message,
        pipelineId
      });
      toast("WhatsApp message sent!", "success");
      setMessage("");
      onClose();
    } catch (error) {
      toast("Failed to send WhatsApp message.", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Send WhatsApp">
      <div className="space-y-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Message will be sent to {candidatePhone || "N/A"}. This will be logged in the candidate's timeline.
        </p>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Message</label>
          <textarea 
            placeholder="Hi there, checking in on your availability..." 
            value={message}
            onChange={(e: any) => setMessage(e.target.value)}
            className="flex min-h-[160px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSending} className="rounded-xl h-11">
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="rounded-xl h-11 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            {isSending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
