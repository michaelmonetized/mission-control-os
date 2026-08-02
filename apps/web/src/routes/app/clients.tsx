import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/mc/card";
import { Input } from "@/components/mc/input";
import { useIsAgencyAdmin } from "@/lib/auth-guards";

export const Route = createFileRoute("/app/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const clients = useQuery(api.clients.list, {});
  const add = useMutation(api.clients.add);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const isAdmin = useIsAgencyAdmin();

  async function addClient() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await add({ name: name.trim() });
      setName("");
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to add client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Clients</h1>
      <p className="text-sm text-[var(--color-mocha-subtext0)]">
        Live Convex · scoped by active Clerk Organization (Agency). Self Client is seeded on first
        org open.
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Client</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Client name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void addClient();
            }}
          />
          <Button onClick={() => void addClient()} disabled={loading || !name.trim()}>
            Add
          </Button>
        </CardContent>
      </Card>
      {clients === undefined ? (
        <p className="text-sm text-[var(--color-mocha-subtext0)]">Loading clients…</p>
      ) : (
        <ul className="space-y-2">
          {clients.map((c) => (
            <li
              key={c.id}
              className="mc-glass px-4 py-3 rounded-[var(--radius-md)] flex justify-between"
            >
              <span>
                {c.name}{" "}
                {c.isSelf ? (
                  <span className="text-xs text-[var(--color-brand-flamingo)]">Self Client</span>
                ) : null}
              </span>
              <span className="text-xs text-[var(--color-mocha-subtext0)] font-mono">{c.id}</span>
            </li>
          ))}
        </ul>
      )}
      {!isAdmin ? (
        <p className="text-xs text-[var(--color-mocha-subtext0)]">
          Signed in as Member — portal invites require Admin (ADR-0045).
        </p>
      ) : null}
    </div>
  );
}
