import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/mc/card";
import { Badge } from "@/components/mc/badge";
import { Input } from "@/components/mc/input";
import { Alert, AlertDescription } from "@/components/mc/alert";

export const Route = createFileRoute("/app/pipeline")({
  component: PipelinePage,
});

function PipelinePage() {
  const [scope, setScope] = useState<"agency" | "client">("agency");
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const clients = useQuery(api.clients.list, {});
  const board = useQuery(
    api.pipeline.board,
    scope === "agency"
      ? { kind: "agency" }
      : clientId
        ? { kind: "client", clientId: clientId as Id<"clients"> }
        : "skip",
  );
  const setStage = useMutation(api.opportunities.setStage);
  const addOpp = useMutation(api.opportunities.add);

  async function createDeal() {
    if (!name.trim()) return;
    if (scope === "client" && !clientId) {
      setNote("Select a client for Client CRM pipeline");
      return;
    }
    try {
      const res = await addOpp({
        kind: scope,
        clientId: scope === "client" ? (clientId as Id<"clients">) : undefined,
        name: name.trim(),
        stage: "qualified",
        value: value ? Number(value) : undefined,
      });
      setNote(`Created opportunity ${res.id}`);
      setName("");
      setValue("");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pipeline</h1>
      <p className="text-sm text-[var(--color-mocha-subtext0)]">
        Opportunity board · drag via stage menu · won creates delivery Client
      </p>
      {note ? (
        <Alert variant="success">
          <AlertDescription>{note}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={scope === "agency" ? "default" : "secondary"}
          onClick={() => setScope("agency")}
        >
          Agency
        </Button>
        <Button
          variant={scope === "client" ? "default" : "secondary"}
          onClick={() => setScope("client")}
        >
          Client
        </Button>
        {scope === "client" ? (
          <select
            className="rounded border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Select client</option>
            {(clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">New opportunity</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input
            className="min-w-[12rem] flex-1"
            placeholder="Deal name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void createDeal()}
          />
          <Input
            className="w-28"
            placeholder="Value $"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
          />
          <Button onClick={() => void createDeal()} disabled={!name.trim()}>
            Add deal
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {(board?.stages ?? []).map((stage) => (
          <Card key={stage} className="min-h-48">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex justify-between">
                <span className="capitalize">{stage}</span>
                <Badge variant="secondary">{board?.columns?.[stage]?.length ?? 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(board?.columns?.[stage] ?? []).map((o) => (
                <div key={o.id} className="mc-glass px-2 py-2 rounded-md text-sm space-y-1">
                  <div className="font-medium">{o.name}</div>
                  {o.value != null ? (
                    <div className="text-xs text-[var(--color-mocha-subtext0)]">${o.value}</div>
                  ) : null}
                  <select
                    className="w-full text-[10px] rounded border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-1 py-0.5"
                    value={o.stage}
                    onChange={(e) =>
                      void setStage({
                        opportunityId: o.id as Id<"opportunities">,
                        stage: e.target.value,
                      })
                    }
                  >
                    {(board?.stages ?? []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
