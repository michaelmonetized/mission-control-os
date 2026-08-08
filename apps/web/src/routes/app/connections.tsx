import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Input } from "@/components/mc/input";
import { useIsAgencyAdmin } from "@/lib/auth-guards";

export const Route = createFileRoute("/app/connections")({
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const isAdmin = useIsAgencyAdmin();
  const clients = useQuery(api.clients.list, {});
  const accounts = useQuery(api.connections.list, {});
  const connect = useMutation(api.connections.connect);
  const disconnect = useMutation(api.connections.disconnect);
  const [provider, setProvider] = useState("instagram");
  const [ownerKind, setOwnerKind] = useState<"agency" | "client">("agency");
  const [clientId, setClientId] = useState("");
  const [externalId, setExternalId] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Connected Accounts</h1>
      <p className="text-[var(--color-mocha-subtext0)] max-w-[42rem]">
        Connect social and ad accounts for the agency or a client. Prefer client-owned brand channels when they
        can complete OAuth; Agency-owned when operating under retainer.
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connect</CardTitle>
          <CardDescription>OAuth handshakes land here as external ids for now</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <select
            className="w-full rounded border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="instagram">instagram</option>
            <option value="facebook">facebook</option>
            <option value="google_business">google_business</option>
            <option value="linkedin">linkedin</option>
            <option value="meta_ads">meta_ads</option>
          </select>
          <select
            className="w-full rounded border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
            value={ownerKind}
            onChange={(e) => setOwnerKind(e.target.value as "agency" | "client")}
          >
            <option value="agency">Connect as Agency</option>
            <option value="client">Connect as Client</option>
          </select>
          {ownerKind === "client" ? (
            <select
              className="w-full rounded border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
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
          <Input
            placeholder="External account id / handle"
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
          />
          <Button
            disabled={!isAdmin || !externalId.trim() || (ownerKind === "client" && !clientId)}
            onClick={() =>
              void connect({
                provider,
                ownerKind,
                clientId: ownerKind === "client" ? (clientId as Id<"clients">) : undefined,
                externalId: externalId.trim(),
              }).then(() => setExternalId(""))
            }
          >
            Save connection
          </Button>
        </CardContent>
      </Card>
      <ul className="space-y-2">
        {(accounts ?? []).map((a) => (
          <li
            key={a.id}
            className="mc-glass px-4 py-3 rounded-[var(--radius-md)] flex justify-between text-sm"
          >
            <span>
              {a.provider} · {a.ownerKind} · {a.externalId}
            </span>
            {isAdmin ? (
              <Button
                variant="ghost"
                onClick={() =>
                  void disconnect({ accountId: a.id as Id<"connectedAccounts"> })
                }
              >
                Disconnect
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
