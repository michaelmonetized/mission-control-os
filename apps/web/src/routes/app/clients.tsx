import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/mc/card";
import { Input } from "@/components/mc/input";
import { API } from "@mc/protocol";

export const Route = createFileRoute("/app/clients")({
  component: ClientsPage,
});

type ClientRow = { id: string; name: string; isSelf?: boolean; domain?: string };

function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch(API.clients.list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters: {}, limit: 50 }),
    });
    const json = await res.json();
    if (json.ok) setClients(json.data?.items ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addClient() {
    if (!name.trim()) return;
    setLoading(true);
    await fetch(API.clients.add, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    await load();
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Clients</h1>
      <p className="text-sm text-[var(--color-mocha-subtext0)]">
        POST {API.clients.list} / {API.clients.add} — body filters, no path ids (ADR-0042).
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
          />
          <Button onClick={() => void addClient()} disabled={loading}>
            Add
          </Button>
        </CardContent>
      </Card>
      <ul className="space-y-2">
        {clients.map((c) => (
          <li key={c.id} className="mc-glass px-4 py-3 rounded-[var(--radius-md)] flex justify-between">
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
    </div>
  );
}
