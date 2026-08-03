"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  FileText,
  Code,
  Eye,
  Tag,
} from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import type { EmailTemplateItem } from "@/lib/backend";

function CreateTemplateDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    subject: "",
    htmlContent: "",
    variables: "firstName, company, email",
  });

  const { createTemplateMutation } = useCampaigns();
  const error = createTemplateMutation.error?.message ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const varsArray = form.variables.split(",").map((v) => v.trim()).filter(Boolean);
    await createTemplateMutation.mutateAsync({
      name: form.name,
      subject: form.subject,
      htmlContent: form.htmlContent,
      variables: varsArray,
    });
    setOpen(false);
    setForm({ name: "", subject: "", htmlContent: "", variables: "firstName, company, email" });
    onCreated?.();
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-9 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm rounded-lg"
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        New Template
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#111827] border-white/[0.08] text-[#F1F5F9] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#64748B] mb-1">Template Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="Welcome Onboarding Email"
                  className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-9 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#64748B] mb-1">Subject Line *</label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  required
                  placeholder="Welcome to Growth Cloud, {{firstName}}!"
                  className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-9 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#64748B] mb-1">Available Variables (comma separated)</label>
              <Input
                value={form.variables}
                onChange={(e) => setForm((p) => ({ ...p, variables: e.target.value }))}
                placeholder="firstName, company, email"
                className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-9 text-sm font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-[#64748B] mb-1">HTML Content *</label>
              <textarea
                value={form.htmlContent}
                onChange={(e) => setForm((p) => ({ ...p, htmlContent: e.target.value }))}
                required
                rows={10}
                placeholder="<div style='font-family:sans-serif;'><h1>Hi {{firstName}}!</h1><p>Welcome to {{company}}.</p></div>"
                className="w-full rounded-xl bg-[#0B0F1A] border border-white/[0.08] p-3 text-[#F1F5F9] text-xs font-mono focus:outline-none focus:border-sky-500/40"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-[#64748B]">Cancel</Button>
              <Button type="submit" disabled={createTemplateMutation.isPending} className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold">
                {createTemplateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : "Save Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function TemplatesPage() {
  const { templates, isLoading, error, deleteTemplateMutation } = useCampaigns();
  const [selectedTemplate, setSelectedTemplate] = React.useState<EmailTemplateItem | null>(null);

  return (
    <main className="min-h-screen text-[#F1F5F9] p-6 md:p-10">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* Navigation Top */}
        <div className="flex items-center justify-between">
          <Link href="/campaigns" className="inline-flex items-center text-sm text-[#64748B] hover:text-[#F1F5F9] transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Campaigns
          </Link>
          <CreateTemplateDialog />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Email Templates</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Build reusable HTML email templates with personalization tags (<code className="text-sky-300">{"{{firstName}}"}</code>, <code className="text-sky-300">{"{{company}}"}</code>).
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error instanceof Error ? error.message : "Failed to load templates"}
          </div>
        )}

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 h-56 animate-pulse" />
            ))
          ) : templates.length === 0 ? (
            <div className="col-span-full bg-[#111827] border border-white/[0.08] rounded-2xl p-12 text-center text-sm text-[#64748B]">
              No templates created yet. Click <strong>"New Template"</strong> above to create your first email template.
            </div>
          ) : (
            templates.map((tpl) => (
              <div key={tpl.id} className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between hover:border-white/[0.14] transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-400" />
                      <h3 className="font-semibold text-base text-[#F1F5F9]">{tpl.name}</h3>
                    </div>
                    <button
                      onClick={() => deleteTemplateMutation.mutate(tpl.id)}
                      className="p-1 rounded text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#94A3B8] font-mono mb-4 truncate">Subject: {tpl.subject}</p>
                  
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(tpl.variables || []).map((v) => (
                      <span key={v} className="px-2 py-0.5 bg-[#0B0F1A] border border-white/[0.08] rounded text-[11px] font-mono text-sky-300">
                        {"{{" + v + "}}"}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTemplate(tpl)}
                  className="w-full h-8 text-xs border-white/[0.12] text-[#94A3B8] bg-transparent hover:bg-white/5 hover:text-[#F1F5F9]"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview HTML
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Preview Modal */}
        {selectedTemplate && (
          <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
            <DialogContent className="bg-[#111827] border-white/[0.08] text-[#F1F5F9] max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedTemplate.name} — Preview</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="text-xs font-mono text-[#94A3B8] bg-[#0B0F1A] p-3 rounded-lg border border-white/[0.08]">
                  <strong>Subject:</strong> {selectedTemplate.subject}
                </div>
                <div className="bg-white rounded-xl p-6 text-slate-900 min-h-[240px] max-h-[400px] overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent }} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setSelectedTemplate(null)} className="text-[#64748B]">Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </main>
  );
}
