import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Input } from "@/components/mc/input";

export const Route = createFileRoute("/app/tasks")({
  component: TasksPage,
});

type Lens = "all" | "crm_nurture" | "delivery";

function TasksPage() {
  const [lens, setLens] = useState<Lens>("all");
  const [title, setTitle] = useState("");
  const [flag, setFlag] = useState<"crm_nurture" | "delivery">("crm_nurture");
  const [clientId, setClientId] = useState<string>("");
  const [projectName, setProjectName] = useState("");
  const [projectClientId, setProjectClientId] = useState<string>("");
  const [promoteTaskId, setPromoteTaskId] = useState<string>("");
  const [promoteProjectId, setPromoteProjectId] = useState<string>("");

  const clients = useQuery(api.clients.list, {});
  const projects = useQuery(api.tasks.listProjects, {});
  const tasks = useQuery(api.tasks.list, { lens });
  const addTask = useMutation(api.tasks.add);
  const updateTask = useMutation(api.tasks.update);
  const addProject = useMutation(api.tasks.addProject);
  const promote = useMutation(api.tasks.promoteToProject);

  const clientName = useMemo(() => {
    const map = new Map<string, string>((clients ?? []).map((c) => [c.id as string, c.name]));
    return (id?: string | null) => (id ? map.get(id) ?? id : "—");
  }, [clients]);

  async function createTask() {
    if (!title.trim()) return;
    try {
      await addTask({
        title: title.trim(),
        flags: [flag],
        clientId: clientId ? (clientId as Id<"clients">) : undefined,
      });
      setTitle("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function createProject() {
    if (!projectName.trim() || !projectClientId) return;
    try {
      await addProject({
        clientId: projectClientId as Id<"clients">,
        name: projectName.trim(),
      });
      setProjectName("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function doPromote() {
    if (!promoteTaskId || !promoteProjectId) return;
    try {
      await promote({
        taskId: promoteTaskId as Id<"tasks">,
        projectId: promoteProjectId as Id<"projects">,
      });
      setPromoteTaskId("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tasks & Projects</h1>
      <p className="text-[var(--color-mocha-subtext0)]">
        One Task system (ADR-0035). Flags route CRM nurture vs Client PM. Promote moves a nurture task
        into a delivery Project.
      </p>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["crm_nurture", "CRM nurture"],
            ["delivery", "Client PM"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            variant={lens === id ? "default" : "secondary"}
            onClick={() => setLens(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add task</CardTitle>
            <CardDescription>Flag selects the default lens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void createTask()}
            />
            <select
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
              value={flag}
              onChange={(e) => setFlag(e.target.value as "crm_nurture" | "delivery")}
            >
              <option value="crm_nurture">crm_nurture</option>
              <option value="delivery">delivery</option>
            </select>
            <select
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">No client (Agency CRM)</option>
              {(clients ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button onClick={() => void createTask()} disabled={!title.trim()}>
              Add task
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add project</CardTitle>
            <CardDescription>Delivery container under a Client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <select
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
              value={projectClientId}
              onChange={(e) => setProjectClientId(e.target.value)}
            >
              <option value="">Select client</option>
              {(clients ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button
              onClick={() => void createProject()}
              disabled={!projectName.trim() || !projectClientId}
            >
              Add project
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Promote to Project</CardTitle>
          <CardDescription>
            Moves task → delivery flag + project membership (ADR-0035)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <select
            className="flex-1 min-w-[12rem] rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
            value={promoteTaskId}
            onChange={(e) => setPromoteTaskId(e.target.value)}
          >
            <option value="">Select nurture task</option>
            {(tasks ?? [])
              .filter((t) => t.flags.includes("crm_nurture"))
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
          <select
            className="flex-1 min-w-[12rem] rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
            value={promoteProjectId}
            onChange={(e) => setPromoteProjectId(e.target.value)}
          >
            <option value="">Select project</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({clientName(p.clientId)})
              </option>
            ))}
          </select>
          <Button onClick={() => void doPromote()} disabled={!promoteTaskId || !promoteProjectId}>
            Promote
          </Button>
        </CardContent>
      </Card>

      {/* Kanban board (ADR-0035 PM view) */}
      <div>
        <h2 className="text-lg font-medium mb-3">
          Board {tasks === undefined ? "…" : `(${tasks.length})`}
        </h2>
        {tasks === undefined ? (
          <p className="text-sm text-[var(--color-mocha-subtext0)]">Loading…</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-[var(--color-mocha-subtext0)]">No tasks in this lens.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {(["todo", "in_progress", "blocked", "done"] as const).map((status) => {
              const col = (tasks ?? []).filter((t) => {
                if (status === "todo") return t.status === "todo" || t.status === "open" || !t.status;
                return t.status === status;
              });
              return (
                <Card key={status} className="min-h-40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm capitalize flex justify-between">
                      <span>{status.replace("_", " ")}</span>
                      <span className="text-[var(--color-mocha-subtext0)] font-normal">
                        {col.length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {col.map((t) => (
                      <div key={t.id} className="mc-glass px-2 py-2 rounded-md text-sm space-y-1">
                        <div className="font-medium leading-snug">{t.title}</div>
                        <div className="text-[10px] text-[var(--color-mocha-subtext0)]">
                          {t.flags.join(", ")}
                          {t.clientId ? ` · ${clientName(t.clientId)}` : ""}
                        </div>
                        <select
                          className="w-full text-[10px] rounded border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-1 py-0.5"
                          value={t.status === "open" ? "todo" : t.status}
                          onChange={(e) =>
                            void updateTask({
                              taskId: t.id as Id<"tasks">,
                              patch: { status: e.target.value },
                            })
                          }
                        >
                          {["todo", "in_progress", "blocked", "done"].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">List</h2>
        {tasks === undefined ? (
          <p className="text-sm text-[var(--color-mocha-subtext0)]">Loading…</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-[var(--color-mocha-subtext0)]">No tasks in this lens.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="mc-glass px-4 py-3 rounded-[var(--radius-md)] flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-[var(--color-mocha-subtext0)] space-x-2">
                    <span>{t.status}</span>
                    <span>{t.flags.join(", ")}</span>
                    {t.clientId ? <span>· {clientName(t.clientId)}</span> : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  {t.status !== "done" ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        void updateTask({ taskId: t.id as Id<"tasks">, patch: { status: "done" } })
                      }
                    >
                      Done
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        void updateTask({ taskId: t.id as Id<"tasks">, patch: { status: "todo" } })
                      }
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">
          Projects {projects === undefined ? "…" : `(${projects.length})`}
        </h2>
        <ul className="space-y-2">
          {(projects ?? []).map((p) => (
            <li key={p.id} className="mc-glass px-4 py-3 rounded-[var(--radius-md)] flex justify-between">
              <span>{p.name}</span>
              <span className="text-xs text-[var(--color-mocha-subtext0)]">
                {clientName(p.clientId)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
