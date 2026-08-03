"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLeadsStore, type LeadStage } from "@/lib/stores/leads";
import { getBackendUrl } from "@/lib/backend";
import { Plus } from "lucide-react";

export function AddLeadDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const addLead = useLeadsStore((s) => s.addLead);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [stage, setStage] = React.useState<LeadStage>("Subscriber");
  const [source, setSource] = React.useState("Direct");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(getBackendUrl("/api/v1/leads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName: name.trim().split(" ")[0] ?? name.trim(),
          lastName: name.trim().split(" ").slice(1).join(" ") || "",
          company: company.trim() || "Unknown",
          source: source.trim() || "Direct",
          lifecycleStage: stage.toLowerCase(),
        }),
      });

      if (!response.ok) throw new Error(`Lead creation failed with status ${response.status}`);

      const payload = await response.json();
      addLead({
        name: payload.data.firstName && payload.data.lastName ? `${payload.data.firstName} ${payload.data.lastName}` : payload.data.email,
        email: payload.data.email,
        company: payload.data.company || "Unknown",
        stage: (payload.data.lifecycleStage ? payload.data.lifecycleStage.charAt(0).toUpperCase() + payload.data.lifecycleStage.slice(1) : stage) as LeadStage,
        score: payload.data.score ?? 0,
        segments: [],
        source: payload.data.source || source.trim() || "Direct",
        lastActive: payload.data.updatedAt || new Date().toISOString(),
        activities: [
          {
            type: "created",
            description: "Lead created via backend",
            timestamp: payload.data.createdAt || new Date().toISOString(),
          },
        ],
        attribution: [],
      });

      setName("");
      setEmail("");
      setCompany("");
      setStage("Subscriber");
      setSource("Direct");
      setOpen(false);
      setMessage("Lead created successfully");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button
            className="h-10 px-5 text-sm font-semibold rounded-lg text-[#0B0F1A] bg-[#38BDF8] hover:bg-[#38BDF8]/90"
            style={{ boxShadow: "0 0 20px rgba(56,189,248,0.18)" }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#111827] border-white/[0.08] text-[#F1F5F9]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">Add new lead</DialogTitle>
          <DialogDescription className="text-sm text-[#94A3B8]">
            Create a new lead record in your workspace.
          </DialogDescription>
        </DialogHeader>
        {message ? <div className="rounded-lg border border-white/10 bg-[#070A14] px-3 py-2 text-sm text-[#94A3B8]">{message}</div> : null}
        <form id="add-lead-form" onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="lead-name" className="text-xs text-[#94A3B8]">
              Full name
            </Label>
            <Input
              id="lead-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. James Davidson"
              className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] placeholder:text-[#64748B] h-9 rounded-lg"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-email" className="text-xs text-[#94A3B8]">
              Email
            </Label>
            <Input
              id="lead-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="james@company.com"
              className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] placeholder:text-[#64748B] h-9 rounded-lg"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-company" className="text-xs text-[#94A3B8]">
              Company
            </Label>
            <Input
              id="lead-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc"
              className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] placeholder:text-[#64748B] h-9 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lead-stage" className="text-xs text-[#94A3B8]">
                Stage
              </Label>
              <Select
                value={stage}
                onValueChange={(v: string) => setStage(v as LeadStage)}
              >
                <SelectTrigger className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-9 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1F2E] border-white/[0.08]">
                  <SelectItem value="Subscriber">Subscriber</SelectItem>
                  <SelectItem value="MQL">MQL</SelectItem>
                  <SelectItem value="SQL">SQL</SelectItem>
                  <SelectItem value="Customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-source" className="text-xs text-[#94A3B8]">
                Source
              </Label>
              <Input
                id="lead-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Direct"
                className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] placeholder:text-[#64748B] h-9 rounded-lg"
              />
            </div>
          </div>
        </form>
        <DialogFooter className="bg-transparent border-t border-white/[0.08]">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-9 px-4 text-sm font-medium rounded-lg border-white/[0.14] text-[#94A3B8] bg-transparent hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-lead-form"
            disabled={isSubmitting || !name.trim() || !email.trim()}
            className="h-9 px-4 text-sm font-semibold rounded-lg text-[#0B0F1A] bg-[#38BDF8] hover:bg-[#38BDF8]/90 disabled:opacity-40"
          >
            Add lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
