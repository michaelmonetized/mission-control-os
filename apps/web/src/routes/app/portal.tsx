import { createFileRoute } from "@tanstack/react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/mc/button";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/mc/card";
import { Input } from "@/components/mc/input";
import { useIsAgencyAdmin } from "@/lib/auth-guards";

export const Route = createFileRoute("/app/portal")({
  component: PortalSetupPage,
});

function PortalSetupPage() {
  const clients = useQuery(api.clients.list, {});
  const isAdmin = useIsAgencyAdmin();
  const invite = useMutation(api.portal.invite);
  const sendInviteEmail = useAction(api.notify.sendPortalInviteEmail);
  const [clientId, setClientId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [status, setStatus] = useState<string | null>(null);

  const selected = (clientId || clients?.[0]?.id) as Id<"clients"> | undefined;
  const grants = useQuery(
    api.portal.listGrants,
    selected ? { clientId: selected } : "skip",
  );

  async function sendInvite() {
    if (!selected || !email.trim()) return;
    setStatus(null);
    try {
      const res = await invite({
        clientId: selected,
        email: email.trim(),
        role,
      });
      const clientName = clients?.find((c) => c.id === selected)?.name;
      const mail = await sendInviteEmail({
        to: res.email,
        clientName,
        portalUrl: `${window.location.origin}/portal`,
      }).catch((e) => ({ mock: true, note: String(e) }));
      setStatus(
        `Invited ${res.email} as ${res.role}${
          "mock" in mail && mail.mock ? " · email mock/skipped" : " · email sent"
        }`,
      );
      setEmail("");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Invite failed");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Client Portal setup</h1>
      <p className="text-[var(--color-mocha-subtext0)]">
        Client Users authenticate with Clerk but stay <strong>outside</strong> the Agency org
        (ADR-0026). Access is a Convex grant + allowlist (ADR-0027).
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Invite portal user</CardTitle>
          <CardDescription>
            Sends grant + allowlist row. User claims via /portal after sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block text-sm space-y-1">
            Client
            <select
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2"
              value={selected ?? ""}
              onChange={(e) => setClientId(e.target.value)}
            >
              {(clients ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isSelf ? " (Self)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm space-y-1">
            Email
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              disabled={!isAdmin}
            />
          </label>
          <label className="block text-sm space-y-1">
            Portal role
            <select
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "member")}
              disabled={!isAdmin}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <Button onClick={() => void sendInvite()} disabled={!isAdmin || !email.trim()}>
            Invite
          </Button>
          {!isAdmin ? (
            <p className="text-xs text-[var(--color-mocha-subtext0)]">Admin role required.</p>
          ) : null}
          {status ? <p className="text-sm text-[var(--color-brand-sky)]">{status}</p> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Grants for selected client</CardTitle>
        </CardHeader>
        <CardContent>
          {grants === undefined ? (
            <p className="text-sm text-[var(--color-mocha-subtext0)]">Loading…</p>
          ) : grants.length === 0 ? (
            <p className="text-sm text-[var(--color-mocha-subtext0)]">No grants yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {grants.map((g) => (
                <li key={g._id} className="flex justify-between mc-glass px-3 py-2 rounded-md">
                  <span>{g.email}</span>
                  <span className="text-[var(--color-mocha-subtext0)]">
                    {g.role}
                    {g.clerkUserId ? " · claimed" : " · pending"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
