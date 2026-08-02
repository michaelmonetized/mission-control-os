import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
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
  const addLocation = useMutation(api.hierarchy.addLocation);
  const addSite = useMutation(api.hierarchy.addSite);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [locName, setLocName] = useState("Main");
  const [locAddress, setLocAddress] = useState("");
  const [origin, setOrigin] = useState("https://example.com");
  const [locationId, setLocationId] = useState("");
  const isAdmin = useIsAgencyAdmin();

  const effectiveClient =
    selected || clients?.find((c) => c.isSelf)?.id || clients?.[0]?.id || "";

  const locations = useQuery(
    api.hierarchy.listLocations,
    effectiveClient ? { clientId: effectiveClient as Id<"clients"> } : "skip",
  );
  const effectiveLoc = locationId || locations?.[0]?.id || "";
  const sites = useQuery(
    api.hierarchy.listSites,
    effectiveLoc ? { locationId: effectiveLoc as Id<"locations"> } : "skip",
  );

  async function addClient() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await add({ name: name.trim() });
      setName("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Clients</h1>
      <p className="text-sm text-[var(--color-mocha-subtext0)]">
        Hierarchy: Agency → Client → Location → Site (ADR-0002). Self Client seeded on org open.
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

      <ul className="space-y-2">
        {(clients ?? []).map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={`w-full mc-glass px-4 py-3 rounded-[var(--radius-md)] flex justify-between text-left ${
                effectiveClient === c.id ? "mc-neon-border" : ""
              }`}
              onClick={() => {
                setSelected(c.id);
                setLocationId("");
              }}
            >
              <span>
                {c.name}{" "}
                {c.isSelf ? (
                  <span className="text-xs text-[var(--color-brand-flamingo)]">Self Client</span>
                ) : null}
              </span>
              <span className="text-xs text-[var(--color-mocha-subtext0)] font-mono">{c.id}</span>
            </button>
          </li>
        ))}
      </ul>

      {effectiveClient ? (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="Location name"
                value={locName}
                onChange={(e) => setLocName(e.target.value)}
              />
              <Input
                placeholder="Address (optional)"
                value={locAddress}
                onChange={(e) => setLocAddress(e.target.value)}
              />
              <Button
                onClick={() =>
                  void addLocation({
                    clientId: effectiveClient as Id<"clients">,
                    name: locName,
                    address: locAddress || undefined,
                  }).then((r) => setLocationId(r.id))
                }
              >
                Add location
              </Button>
              <ul className="text-sm space-y-1">
                {(locations ?? []).map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      className={`w-full text-left px-2 py-1 rounded ${
                        effectiveLoc === l.id ? "text-[var(--color-brand-sky)]" : ""
                      }`}
                      onClick={() => setLocationId(l.id)}
                    >
                      {l.name}
                      {l.address ? ` · ${l.address}` : ""}
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sites</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input value={origin} onChange={(e) => setOrigin(e.target.value)} />
              <Button
                disabled={!effectiveLoc}
                onClick={() =>
                  void addSite({
                    locationId: effectiveLoc as Id<"locations">,
                    origin,
                  })
                }
              >
                Add site origin
              </Button>
              <ul className="text-sm space-y-1 font-mono">
                {(sites ?? []).map((s) => (
                  <li key={s.id} className="mc-glass px-2 py-1 rounded">
                    {s.origin}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : null}
      {!isAdmin ? (
        <p className="text-xs text-[var(--color-mocha-subtext0)]">
          Member role — portal invites require Admin.
        </p>
      ) : null}
    </div>
  );
}
