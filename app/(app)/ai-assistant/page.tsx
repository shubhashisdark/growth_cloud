"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuthSessionStore } from "@/lib/stores/auth-session";
import { runAiTool } from "@/lib/backend";
import { useLeads } from "@/hooks/useLeads";

const tools = [
  { key: "email-generator", label: "AI Email Generator", description: "Generate email copy, subject lines, and CTAs" },
  { key: "lead-summary", label: "AI Lead Summary", description: "Summarize a lead using profile and activity history" },
  { key: "lead-scoring", label: "AI Lead Scoring", description: "Recommend scoring signals and bands" },
  { key: "campaign-insights", label: "AI Campaign Insights", description: "Analyze campaign performance and recommendations" },
  { key: "segment-builder", label: "AI Segment Builder", description: "Generate audience rules and activation suggestions" },
] as const;

export default function AIAssistantPage() {
  const session = useAuthSessionStore((state) => state.session);
  const token = session?.accessToken ?? "";
  const workspaceId = session?.user?.memberships?.[0]?.workspaceId ?? "";

  const [selected, setSelected] = useState<(typeof tools)[number]["key"]>("email-generator");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  // Leads for dropdown selection
  const { items: leads = [], isLoading: isLoadingLeads } = useLeads({ limit: 100 });

  // 1. Email Generator state
  const [emailGoal, setEmailGoal] = useState("Increase newsletter signups");
  const [emailAudience, setEmailAudience] = useState("Tech enthusiasts");
  const [emailTone, setEmailTone] = useState("professional and enthusiastic");
  const [emailSubject, setEmailSubject] = useState("Introducing our new product");
  const [emailContext, setEmailContext] = useState("");

  // 2. Lead Summary state
  const [summaryLeadId, setSummaryLeadId] = useState("");

  // 3. Lead Scoring state
  const [scoringLeadId, setScoringLeadId] = useState("");
  const [scoringNotes, setScoringNotes] = useState("");

  // 4. Campaign Insights state
  const [insightsRange, setInsightsRange] = useState("30d");

  // 5. Segment Builder state
  const [segmentObjective, setSegmentObjective] = useState("Identify high-intent leads");
  const [segmentSource, setSegmentSource] = useState("");
  const [segmentAttributes, setSegmentAttributes] = useState<string[]>(["lifecycleStage", "score"]);

  // Auto-select first lead when leads load
  useEffect(() => {
    if (leads && leads.length > 0) {
      if (!summaryLeadId) setSummaryLeadId(leads[0].id);
      if (!scoringLeadId) setScoringLeadId(leads[0].id);
    }
  }, [leads, summaryLeadId, scoringLeadId]);

  const title = useMemo(() => tools.find((tool) => tool.key === selected)?.label ?? "AI Assistant", [selected]);

  // Toggle attribute selection for Segment Builder
  const handleAttributeToggle = (attr: string) => {
    setSegmentAttributes((prev) =>
      prev.includes(attr) ? prev.filter((a) => a !== attr) : [...prev, attr]
    );
  };

  async function runAiToolAction() {
    setLoading(true);
    setOutput("");

    let payloadInput: Record<string, any> = {};

    if (selected === "email-generator") {
      payloadInput = {
        goal: emailGoal,
        audience: emailAudience,
        tone: emailTone,
        subject: emailSubject,
        context: emailContext || undefined
      };
    } else if (selected === "lead-summary") {
      if (!summaryLeadId) {
        setOutput("Please select a lead first.");
        setLoading(false);
        return;
      }
      payloadInput = {
        leadId: summaryLeadId
      };
    } else if (selected === "lead-scoring") {
      payloadInput = {
        leadId: scoringLeadId || undefined,
        notes: scoringNotes || undefined
      };
    } else if (selected === "campaign-insights") {
      payloadInput = {
        range: insightsRange
      };
    } else if (selected === "segment-builder") {
      payloadInput = {
        objective: segmentObjective,
        source: segmentSource || undefined,
        attributes: segmentAttributes
      };
    }

    try {
      const response = await runAiTool(workspaceId, selected, payloadInput, token);
      setOutput(response.data.output || "AI response generated successfully but output is empty.");
    } catch (err: any) {
      setOutput(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header Section */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Marketing Intelligence</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">AI Assistant</h1>
          <p className="text-lg text-slate-400">Select an assistant below, fill out the simple fields, and generate premium AI copy, analysis, and recommendations.</p>
        </section>

        {/* Navigation Tabs */}
        <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          {tools.map((tool) => (
            <button
              key={tool.key}
              type="button"
              onClick={() => setSelected(tool.key)}
              className={`group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-300 ${
                selected === tool.key
                  ? "border-cyan-500 bg-cyan-950/20 shadow-[0_0_15px_rgba(34,211,238,0.15)] text-white"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900 text-slate-300"
              }`}
            >
              <div className="text-sm font-semibold group-hover:text-cyan-400 transition-colors">{tool.label}</div>
              <div className="mt-1 text-xxs text-slate-500 font-mono">{tool.key}</div>
            </button>
          ))}
        </section>

        {/* Main Interface Area */}
        <section className="grid gap-8 lg:grid-cols-12">
          
          {/* Dynamic Form Panel */}
          <div className="lg:col-span-5 flex flex-col space-y-6 rounded-3xl border border-slate-850 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-sm text-slate-400 mt-1">Provide parameters to guide the AI model.</p>
            </div>

            <div className="flex-1 space-y-4">
              
              {/* AI Email Generator Fields */}
              {selected === "email-generator" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Email Subject Line</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="e.g. Introducing our new product"
                      className="rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none transition"
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Audience Segment</label>
                    <input
                      type="text"
                      value={emailAudience}
                      onChange={(e) => setEmailAudience(e.target.value)}
                      placeholder="e.g. Tech enthusiasts, Active users"
                      className="rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none transition"
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Campaign Tone</label>
                    <select
                      value={emailTone}
                      onChange={(e) => setEmailTone(e.target.value)}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none transition"
                    >
                      <option value="excited and professional">Excited & Professional</option>
                      <option value="formal and informative">Formal & Informative</option>
                      <option value="casual and friendly">Casual & Friendly</option>
                      <option value="urgent and persuasive">Urgent & Persuasive</option>
                      <option value="minimalist and bold">Minimalist & Bold</option>
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Primary Goal</label>
                    <textarea
                      value={emailGoal}
                      onChange={(e) => setEmailGoal(e.target.value)}
                      placeholder="e.g. Increase sign-ups for our beta program"
                      rows={2}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none transition resize-none"
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Additional Context (Optional)</label>
                    <textarea
                      value={emailContext}
                      onChange={(e) => setEmailContext(e.target.value)}
                      placeholder="Special offers, launch details, features to highlight..."
                      rows={3}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none transition resize-none"
                    />
                  </div>
                </div>
              )}

              {/* AI Lead Summary Fields */}
              {selected === "lead-summary" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Select Lead to Summarize</label>
                    {isLoadingLeads ? (
                      <div className="text-sm text-slate-500 animate-pulse py-2">Loading leads...</div>
                    ) : leads.length === 0 ? (
                      <div className="text-sm text-amber-400 py-2">No leads found in this workspace. Add some leads first!</div>
                    ) : (
                      <select
                        value={summaryLeadId}
                        onChange={(e) => setSummaryLeadId(e.target.value)}
                        className="rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none transition"
                      >
                        {leads.map((lead: any) => (
                          <option key={lead.id} value={lead.id}>
                            {lead.firstName} {lead.lastName || ""} ({lead.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}

              {/* AI Lead Scoring Fields */}
              {selected === "lead-scoring" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Target Lead (Optional)</label>
                    {isLoadingLeads ? (
                      <div className="text-sm text-slate-500 animate-pulse py-2">Loading leads...</div>
                    ) : (
                      <select
                        value={scoringLeadId}
                        onChange={(e) => setScoringLeadId(e.target.value)}
                        className="rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none transition"
                      >
                        <option value="">-- Apply to overall workspace strategy --</option>
                        {leads.map((lead: any) => (
                          <option key={lead.id} value={lead.id}>
                            {lead.firstName} {lead.lastName || ""} ({lead.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Custom Scoring Notes</label>
                    <textarea
                      value={scoringNotes}
                      onChange={(e) => setScoringNotes(e.target.value)}
                      placeholder="e.g. Give higher weight to webinar attendance and penalize spam email addresses."
                      rows={4}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none transition resize-none"
                    />
                  </div>
                </div>
              )}

              {/* AI Campaign Insights Fields */}
              {selected === "campaign-insights" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Analysis Date Range</label>
                    <select
                      value={insightsRange}
                      onChange={(e) => setInsightsRange(e.target.value)}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none transition"
                    >
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="90d">Last 90 Days</option>
                      <option value="12m">Last 12 Months</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>
                </div>
              )}

              {/* AI Segment Builder Fields */}
              {selected === "segment-builder" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Segmentation Objective</label>
                    <textarea
                      value={segmentObjective}
                      onChange={(e) => setSegmentObjective(e.target.value)}
                      placeholder="e.g. Identify high-intent enterprise leads who have visited the pricing page."
                      rows={3}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none transition resize-none"
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Filter by Lead Source (Optional)</label>
                    <input
                      type="text"
                      value={segmentSource}
                      onChange={(e) => setSegmentSource(e.target.value)}
                      placeholder="e.g. Website, Referral, Cold Outreach"
                      className="rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none transition"
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Key Attributes to Target</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {["lifecycleStage", "score", "consentEmail", "source", "company"].map((attr) => (
                        <label
                          key={attr}
                          className="flex items-center space-x-2 rounded-lg bg-slate-950/50 border border-slate-850 px-3 py-2 cursor-pointer hover:border-slate-700 transition"
                        >
                          <input
                            type="checkbox"
                            checked={segmentAttributes.includes(attr)}
                            onChange={() => handleAttributeToggle(attr)}
                            className="rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                          />
                          <span className="font-mono text-slate-300">{attr}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            <button
              type="button"
              disabled={loading}
              onClick={runAiToolAction}
              className="w-full flex items-center justify-center rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold px-4 py-3.5 text-sm shadow-[0_4px_20px_rgba(34,211,238,0.25)] hover:shadow-[0_4px_25px_rgba(34,211,238,0.4)] disabled:opacity-55 active:scale-[0.98] transition-all duration-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Generating AI draft...</span>
                </>
              ) : (
                <span>Run AI Assistant</span>
              )}
            </button>
          </div>

          {/* AI Response Output Panel */}
          <div className="lg:col-span-7 flex flex-col space-y-4 rounded-3xl border border-slate-850 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Assistant Output</h2>
                <p className="text-sm text-slate-400 mt-0.5">Real-time analysis and copy generation.</p>
              </div>
              {output && !loading && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(output);
                  }}
                  className="text-xs bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  Copy Text
                </button>
              )}
            </div>

            <div className="flex-1 min-h-[380px] bg-slate-950/80 rounded-2xl border border-slate-850 p-6 overflow-y-auto max-h-[580px] select-text">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-3 py-12">
                  <div className="h-10 w-10 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400">Llama 3.3 is thinking...</p>
                </div>
              ) : output ? (
                <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
                  {output}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                  <svg className="h-12 w-12 text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-sm font-medium">Configure parameters and click the button to see the output.</p>
                </div>
              )}
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}
