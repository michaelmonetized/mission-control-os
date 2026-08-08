import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Input } from "@/components/mc/input";

export const Route = createFileRoute("/app/crm")({
  component: CrmPage,
});

type Scope = "agency" | "client";
type Channel = "email" | "sms" | "social_dm" | "web_form" | "live_chat";

function CrmPage() {
  const [scope, setScope] = useState<Scope>("agency");
  const [clientId, setClientId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const clients = useQuery(api.clients.list, {});
  const scopeArgs =
    scope === "agency"
      ? { kind: "agency" as const }
      : clientId
        ? { kind: "client" as const, clientId: clientId as Id<"clients"> }
        : "skip";

  const contacts = useQuery(api.crm.listContacts, scopeArgs === "skip" ? "skip" : scopeArgs);
  const conversations = useQuery(
    api.crm.listConversations,
    scopeArgs === "skip" ? "skip" : scopeArgs,
  );
  const messages = useQuery(
    api.crm.listMessages,
    activeConversation
      ? { conversationId: activeConversation as Id<"conversations"> }
      : "skip",
  );

  const opportunities = useQuery(
    api.opportunities.list,
    scopeArgs === "skip" ? "skip" : scopeArgs,
  );
  const companies = useQuery(
    api.opportunities.listCompanies,
    scopeArgs === "skip" ? "skip" : scopeArgs,
  );
  const addContact = useMutation(api.crm.addContact);
  const openConversation = useMutation(api.crm.openConversation);
  const ingest = useMutation(api.crm.ingestMessage);
  const addOpp = useMutation(api.opportunities.add);
  const setStage = useMutation(api.opportunities.setStage);
  const addCompany = useMutation(api.opportunities.addCompany);
  const [oppName, setOppName] = useState("");
  const [companyName, setCompanyName] = useState("");

  async function createContact() {
    if (!contactName.trim() || scopeArgs === "skip") return;
    try {
      await addContact({ ...scopeArgs, name: contactName.trim(), email: contactEmail || undefined });
      setContactName("");
      setContactEmail("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function startThread() {
    if (!body.trim() || scopeArgs === "skip") return;
    try {
      const res = await openConversation({
        ...scopeArgs,
        channel,
        subject: subject || undefined,
        initialBody: body,
        direction: "outbound",
      });
      setActiveConversation(res.conversationId);
      setBody("");
      setSubject("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function sendReply() {
    if (!reply.trim() || !activeConversation) return;
    try {
      await ingest({
        conversationId: activeConversation as Id<"conversations">,
        channel,
        direction: "outbound",
        body: reply.trim(),
      });
      setReply("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function simulateInbound() {
    if (scopeArgs === "skip") return;
    try {
      const res = await ingest({
        ...scopeArgs,
        channel: "web_form",
        direction: "inbound",
        body: "Inbound web form lead: interested in local SEO package.",
        subject: "Web form — new lead",
      });
      setActiveConversation(res.conversationId);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">CRM</h1>
      <p className="text-[var(--color-mocha-subtext0)] max-w-[42rem]">
        Agency and per-client conversation workspaces. Channels:
        email, SMS, social DM, web form, live chat.
      </p>

      <div className="flex flex-wrap gap-2 items-center">
        <Button variant={scope === "agency" ? "default" : "secondary"} onClick={() => setScope("agency")}>
          Agency CRM
        </Button>
        <Button variant={scope === "client" ? "default" : "secondary"} onClick={() => setScope("client")}>
          Client CRM
        </Button>
        {scope === "client" ? (
          <select
            className="rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setActiveConversation(null);
            }}
          >
            <option value="">Select client</option>
            {(clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : null}
        <Button variant="ghost" onClick={() => void simulateInbound()} disabled={scopeArgs === "skip"}>
          Simulate inbound web form
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Contacts</CardTitle>
            <CardDescription>Workspace-scoped</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <Input
              placeholder="Email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <Button onClick={() => void createContact()} disabled={!contactName.trim() || scopeArgs === "skip"}>
              Add contact
            </Button>
            <ul className="space-y-1 text-sm pt-2">
              {(contacts ?? []).map((c) => (
                <li key={c.id} className="mc-glass px-3 py-2 rounded-md">
                  {c.name}
                  {c.email ? (
                    <span className="block text-xs text-[var(--color-mocha-subtext0)]">{c.email}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Conversations</CardTitle>
            <CardDescription>Inbox by last activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {conversations === undefined ? (
              <p className="text-sm text-[var(--color-mocha-subtext0)]">Loading…</p>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-[var(--color-mocha-subtext0)]">No threads yet.</p>
            ) : (
              <ul className="space-y-2">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`w-full text-left mc-glass px-3 py-2 rounded-md text-sm ${
                        activeConversation === c.id ? "mc-neon-border" : ""
                      }`}
                      onClick={() => setActiveConversation(c.id)}
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-medium truncate">{c.subject ?? "(no subject)"}</span>
                        <span className="text-xs text-[var(--color-brand-sky)]">{c.channel}</span>
                      </div>
                      <div className="text-xs text-[var(--color-mocha-subtext0)] truncate">
                        {c.lastBody ?? "—"}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">
              {activeConversation ? "Thread" : "New conversation"}
            </CardTitle>
            <CardDescription>Multi-channel compose</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!activeConversation ? (
              <>
                <select
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as Channel)}
                >
                  <option value="email">email</option>
                  <option value="sms">sms</option>
                  <option value="social_dm">social_dm</option>
                  <option value="web_form">web_form</option>
                  <option value="live_chat">live_chat</option>
                </select>
                <Input
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <textarea
                  className="w-full min-h-24 rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
                  placeholder="Message body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <Button onClick={() => void startThread()} disabled={!body.trim() || scopeArgs === "skip"}>
                  Start thread
                </Button>
              </>
            ) : (
              <>
                <ul className="space-y-2 max-h-64 overflow-y-auto text-sm">
                  {(messages ?? []).map((m) => (
                    <li
                      key={m.id}
                      className={`px-3 py-2 rounded-md ${
                        m.direction === "inbound"
                          ? "bg-[color-mix(in_oklab,var(--color-brand-sky)_12%,transparent)]"
                          : "mc-glass"
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wide text-[var(--color-mocha-subtext0)]">
                        {m.direction} · {m.channel}
                      </div>
                      {m.body}
                    </li>
                  ))}
                </ul>
                <textarea
                  className="w-full min-h-16 rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
                  placeholder="Reply…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={() => void sendReply()} disabled={!reply.trim()}>
                    Send
                  </Button>
                  <Button variant="ghost" onClick={() => setActiveConversation(null)}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Companies</CardTitle>
            <CardDescription>Accounts / orgs in workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Button
                disabled={!companyName.trim() || scopeArgs === "skip"}
                onClick={() =>
                  void addCompany({
                    ...(scopeArgs === "skip" ? {} : scopeArgs),
                    name: companyName.trim(),
                  }).then(() => setCompanyName(""))
                }
              >
                Add
              </Button>
            </div>
            <ul className="text-sm space-y-1">
              {(companies ?? []).map((c) => (
                <li key={c.id} className="mc-glass px-3 py-2 rounded-md">
                  {c.name}
                  {c.domain ? (
                    <span className="text-xs text-[var(--color-mocha-subtext0)]"> · {c.domain}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Opportunities</CardTitle>
            <CardDescription>Pipeline · won creates delivery Client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Deal name"
                value={oppName}
                onChange={(e) => setOppName(e.target.value)}
              />
              <Button
                disabled={!oppName.trim() || scopeArgs === "skip"}
                onClick={() =>
                  void addOpp({
                    ...(scopeArgs === "skip" ? {} : scopeArgs),
                    name: oppName.trim(),
                  }).then(() => setOppName(""))
                }
              >
                Add
              </Button>
            </div>
            <ul className="text-sm space-y-2">
              {(opportunities ?? []).map((o) => (
                <li
                  key={o.id}
                  className="mc-glass px-3 py-2 rounded-md flex flex-wrap justify-between gap-2"
                >
                  <span>
                    {o.name}{" "}
                    <span className="text-xs text-[var(--color-mocha-subtext0)]">{o.stage}</span>
                  </span>
                  <select
                    className="text-xs rounded border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-2 py-1"
                    value={o.stage}
                    onChange={(e) =>
                      void setStage({
                        opportunityId: o.id as Id<"opportunities">,
                        stage: e.target.value,
                      })
                    }
                  >
                    <option value="qualified">qualified</option>
                    <option value="proposal">proposal</option>
                    <option value="negotiation">negotiation</option>
                    <option value="won">won</option>
                    <option value="lost">lost</option>
                  </select>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
