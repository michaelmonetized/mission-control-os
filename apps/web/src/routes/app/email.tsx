import { createFileRoute } from "@tanstack/react-router";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Input } from "@/components/mc/input";
import { useIsAgencyAdmin } from "@/lib/auth-guards";

export const Route = createFileRoute("/app/email")({
  component: EmailPage,
});

type DnsRec = {
  type?: string;
  name?: string;
  value?: string;
  record?: string;
  priority?: number;
  status?: string;
};

function EmailPage() {
  const isAdmin = useIsAgencyAdmin();
  const clients = useQuery(api.clients.list, {});
  const agencyDomains = useQuery(api.email.listDomains, {});
  const [clientId, setClientId] = useState("");
  const clientDomains = useQuery(
    api.email.listDomains,
    clientId ? { clientId: clientId as Id<"clients"> } : "skip",
  );

  const [agencyDomain, setAgencyDomain] = useState("");
  const [clientDomain, setClientDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const provision = useAction(api.email.provisionDomain);
  const verify = useAction(api.email.verifyDomain);

  async function provisionAgency() {
    if (!agencyDomain.trim()) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await provision({ domain: agencyDomain.trim() });
      setNote(
        res.mock
          ? `Mock DNS for ${res.domain} (set RESEND_API_KEY on Convex for live Resend)`
          : `Provisioned ${res.domain} · ${res.status}`,
      );
      setAgencyDomain("");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function provisionClient() {
    if (!clientDomain.trim() || !clientId) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await provision({
        domain: clientDomain.trim(),
        clientId: clientId as Id<"clients">,
      });
      setNote(
        res.mock
          ? `Mock Client DNS for ${res.domain}`
          : `Client domain ${res.domain} · ${res.status}`,
      );
      setClientDomain("");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function DnsTable({ records }: { records: unknown }) {
    const list = (Array.isArray(records) ? records : []) as DnsRec[];
    if (!list.length) {
      return <p className="text-xs text-[var(--color-mocha-subtext0)]">No DNS records yet.</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[var(--color-mocha-subtext0)]">
            <tr>
              <th className="py-1 pr-2">Type</th>
              <th className="py-1 pr-2">Name</th>
              <th className="py-1 pr-2">Value</th>
              <th className="py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r, i) => (
              <tr key={i} className="border-t border-[var(--color-mocha-surface1)]">
                <td className="py-1 pr-2 font-mono">{r.type ?? r.record}</td>
                <td className="py-1 pr-2 font-mono">{r.name}</td>
                <td className="py-1 pr-2 font-mono break-all max-w-xs">{r.value}</td>
                <td className="py-1">{r.status ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function DomainCard({
    title,
    domains,
  }: {
    title: string;
    domains:
      | {
          id: string;
          domain: string;
          verified: boolean;
          status?: string;
          dnsRecords?: unknown;
        }[]
      | undefined;
  }) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>SPF/DKIM from Resend · verify polling</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {domains === undefined ? (
            <p className="text-sm text-[var(--color-mocha-subtext0)]">Loading…</p>
          ) : domains.length === 0 ? (
            <p className="text-sm text-[var(--color-mocha-subtext0)]">No domains yet.</p>
          ) : (
            domains.map((d) => (
              <div key={d.id} className="mc-glass p-4 rounded-[var(--radius-md)] space-y-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{d.domain}</span>
                  <span
                    className={
                      d.verified
                        ? "text-xs text-[var(--color-mocha-green)]"
                        : "text-xs text-[var(--color-mocha-peach)]"
                    }
                  >
                    {d.status ?? (d.verified ? "verified" : "pending")}
                  </span>
                </div>
                <DnsTable records={d.dnsRecords} />
                <Button
                  variant="secondary"
                  disabled={!isAdmin || busy}
                  onClick={() =>
                    void verify({ emailDomainId: d.id as Id<"emailDomains"> }).then((r) =>
                      setNote(`Verify ${d.domain}: ${r.status}`),
                    )
                  }
                >
                  Verify / refresh
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Email ESP</h1>
      <p className="text-[var(--color-mocha-subtext0)]">
        Full ESP on Resend (ADR-0036). Agency + Client Email Domains · DNS onboarding · isolated
        workspaces. Admin-only provision.
      </p>
      {note ? <p className="text-sm text-[var(--color-brand-sky)]">{note}</p> : null}
      {!isAdmin ? (
        <p className="text-xs text-[var(--color-mocha-subtext0)]">Admin role required to provision.</p>
      ) : null}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agency Email Domain</CardTitle>
            <CardDescription>Agency brand / system send identity</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="mail.agency.com"
              value={agencyDomain}
              onChange={(e) => setAgencyDomain(e.target.value)}
              disabled={!isAdmin}
            />
            <Button
              onClick={() => void provisionAgency()}
              disabled={!isAdmin || busy || !agencyDomain.trim()}
            >
              Provision
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client Email Domain</CardTitle>
            <CardDescription>Client brand send (agency often holds DNS)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <select
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
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
            <div className="flex gap-2">
              <Input
                placeholder="hello.client.com"
                value={clientDomain}
                onChange={(e) => setClientDomain(e.target.value)}
                disabled={!isAdmin}
              />
              <Button
                onClick={() => void provisionClient()}
                disabled={!isAdmin || busy || !clientDomain.trim() || !clientId}
              >
                Provision
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <DomainCard title="Agency domains" domains={agencyDomains} />
      {clientId ? <DomainCard title="Client domains" domains={clientDomains} /> : null}
    </div>
  );
}
