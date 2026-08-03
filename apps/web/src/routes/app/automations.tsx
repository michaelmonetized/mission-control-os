import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Input } from "@/components/mc/input";
import { useIsAgencyAdmin } from "@/lib/auth-guards";

export const Route = createFileRoute("/app/automations")({
  component: AutomationsPage,
});

const TRIGGERS = [
  "ingest.contact",
  "status.changed",
  "pipeline.stage_changed",
  "deal.won",
  "deal.lost",
  "message.received",
  "tag.added",
] as const;

const STEP_TYPES = [
  "create_task",
  "send_email",
  "send_sms",
  "add_tag",
  "notify_internal",
  "webhook",
  "wait",
] as const;

function AutomationsPage() {
  const isAdmin = useIsAgencyAdmin();
  const automations = useQuery(api.automations.list, {});
  const templates = useQuery(api.automations.listTemplates, {});
  const save = useMutation(api.automations.save);
  const saveTemplate = useMutation(api.automations.saveTemplate);
  const setEnabled = useMutation(api.automations.setEnabled);
  const runInline = useMutation(api.automations.runInline);
  const handoffs = useQuery(api.handoffs.listQueued, {});
  const handoffHistory = useQuery(api.handoffs.listRecent, { limit: 20 });
  const markHandoff = useMutation(api.handoffs.mark);

  const [name, setName] = useState("Welcome sequence");
  const [trigger, setTrigger] = useState<string>("ingest.contact");
  const [steps, setSteps] = useState<{ type: string; config?: Record<string, unknown> }[]>([
    { type: "create_task", config: { title: "Follow up new lead" } },
    { type: "send_email", config: { template: "welcome" } },
  ]);
  const [tplName, setTplName] = useState("Welcome email");
  const [tplBody, setTplBody] = useState("Hi {{name}}, thanks for reaching out.");
  const [note, setNote] = useState<string | null>(null);

  async function createAutomation() {
    try {
      const res = await save({
        name,
        trigger,
        definition: { steps },
        enabled: true,
      });
      setNote(`Saved automation ${res.id}`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Failed");
    }
  }

  async function createTemplate() {
    try {
      const res = await saveTemplate({
        channel: "email",
        name: tplName,
        body: tplBody,
        subject: tplName,
      });
      setNote(`Saved template ${res.id}`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Failed");
    }
  }

  async function run(id: Id<"automations">) {
    try {
      const res = await runInline({ automationId: id });
      setNote(
        res.status === "handoff_trigger"
          ? `Handoff → Trigger.dev: ${JSON.stringify(res.triggerPayload)}`
          : `Completed inline (${res.results?.length ?? 0} steps)`,
      );
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Automations</h1>
      <p className="text-[var(--color-mocha-subtext0)] max-w-2xl">
        Trigger → steps builder (ADR-0043). Inline first; external failure / wait → Trigger.dev handoff
        (ADR-0046). First-class outside CRM too (ADR-0044).
      </p>
      {note ? (
        <pre className="text-xs mc-glass p-3 rounded-md overflow-x-auto text-[var(--color-brand-sky)]">
          {note}
        </pre>
      ) : null}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email / SMS templates</CardTitle>
            <CardDescription>Admin authors · reused in steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input value={tplName} onChange={(e) => setTplName(e.target.value)} />
            <textarea
              className="w-full min-h-20 rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
              value={tplBody}
              onChange={(e) => setTplBody(e.target.value)}
            />
            <Button onClick={() => void createTemplate()} disabled={!isAdmin}>
              Save email template
            </Button>
            <ul className="text-sm space-y-1 pt-2">
              {(templates ?? []).map((t) => (
                <li key={t.id} className="mc-glass px-2 py-1 rounded">
                  {t.channel}: {t.name}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">New workflow</CardTitle>
            <CardDescription>Structured trigger → steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <select
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
            >
              {TRIGGERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    className="flex-1 rounded border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-2 py-1 text-xs"
                    value={s.type}
                    onChange={(e) => {
                      const next = [...steps];
                      next[i] = { ...s, type: e.target.value };
                      setSteps(next);
                    }}
                  >
                    {STEP_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                onClick={() => setSteps([...steps, { type: "notify_internal" }])}
              >
                + Step
              </Button>
            </div>
            <Button onClick={() => void createAutomation()} disabled={!isAdmin}>
              Save automation
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trigger.dev handoff queue</CardTitle>
          <CardDescription>Durable recovery jobs (ADR-0046)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(handoffs ?? []).length === 0 ? (
            <p className="text-[var(--color-mocha-subtext0)]">No queued handoffs.</p>
          ) : (
            (handoffs ?? []).map((h) => (
              <div
                key={h.id}
                className="mc-glass px-3 py-2 rounded-md flex flex-wrap justify-between gap-2"
              >
                <span>
                  step {h.fromStep} · {h.reason} · {h.status}
                </span>
                <Button
                  variant="ghost"
                  onClick={() =>
                    void markHandoff({
                      handoffId: h.id as Id<"automationHandoffs">,
                      status: "done",
                    })
                  }
                >
                  Mark done
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Handoff history</CardTitle>
          <CardDescription>Recent Trigger.dev jobs · all statuses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(handoffHistory ?? []).length === 0 ? (
            <p className="text-[var(--color-mocha-subtext0)]">No handoffs yet.</p>
          ) : (
            (handoffHistory ?? []).map((h) => (
              <div
                key={h.id}
                className="mc-glass px-3 py-2 rounded-md flex flex-wrap justify-between gap-2"
              >
                <span>
                  {h.status} · step {h.fromStep} · {h.reason}
                </span>
                <time className="text-[10px] text-[var(--color-mocha-subtext0)]">
                  {new Date(h.createdAt).toLocaleString()}
                </time>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflows</CardTitle>
          <CardDescription>Run inline · handoff payload on failure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(automations ?? []).map((a) => (
            <div
              key={a.id}
              className="mc-glass px-3 py-3 rounded-md flex flex-wrap justify-between gap-2 text-sm"
            >
              <div>
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-[var(--color-mocha-subtext0)]">
                  {a.trigger} · {a.enabled ? "enabled" : "disabled"} ·{" "}
                  {(a.definition as { steps?: unknown[] })?.steps?.length ?? 0} steps
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => void run(a.id as Id<"automations">)}>
                  Run inline
                </Button>
                {isAdmin ? (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      void setEnabled({
                        automationId: a.id as Id<"automations">,
                        enabled: !a.enabled,
                      })
                    }
                  >
                    {a.enabled ? "Disable" : "Enable"}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
