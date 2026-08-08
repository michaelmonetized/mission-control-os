import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Input } from "@/components/mc/input";

export const Route = createFileRoute("/app/social")({
  component: SocialPage,
});

function SocialPage() {
  const clients = useQuery(api.clients.list, {});
  const [clientId, setClientId] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState("instagram");
  const [category, setCategory] = useState<"promo" | "edu" | "ugc" | "other">("promo");
  const recycle = useMutation(api.social.recyclePost);
  const [when, setWhen] = useState(() => {
    const d = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  // Default to Self Client once loaded
  const effectiveClientId = clientId || clients?.find((c) => c.isSelf)?.id || clients?.[0]?.id || "";

  const posts = useQuery(
    api.social.listPosts,
    effectiveClientId
      ? { clientId: effectiveClientId as Id<"clients">, lookAheadWeeks: weeks }
      : "skip",
  );

  const schedule = useMutation(api.social.schedulePost);
  const disapprove = useMutation(api.social.disapprove);
  const updatePost = useMutation(api.social.updatePost);
  const attemptPublish = useMutation(api.socialPublish.attemptPublish);
  const due = useQuery(
    api.socialPublish.listDue,
    effectiveClientId
      ? { clientId: effectiveClientId as Id<"clients">, beforeMs: Date.now() + 7 * 864e5 }
      : "skip",
  );

  const byDay = useMemo(() => {
    const map = new Map<string, NonNullable<typeof posts>>();
    for (const p of posts ?? []) {
      const day = new Date(p.scheduledAt).toLocaleDateString();
      const list = map.get(day) ?? [];
      list.push(p);
      map.set(day, list);
    }
    return [...map.entries()];
  }, [posts]);

  async function addPost() {
    if (!body.trim() || !effectiveClientId) return;
    try {
      await schedule({
        clientId: effectiveClientId as Id<"clients">,
        body: body.trim(),
        channel,
        scheduledAt: new Date(when).getTime(),
        category,
      });
      setBody("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Social</h1>
      <p className="text-[var(--color-mocha-subtext0)] max-w-[42rem]">
        Default-approved posts · N-week look-ahead Approval Calendar · disapprove with notes or edit.
        Approved posts publish on schedule. Failures notify you and reschedule.
      </p>

      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm space-y-1">
          Client
          <select
            className="block rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2"
            value={effectiveClientId}
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
        <label className="text-sm space-y-1">
          Look-ahead weeks
          <Input
            type="number"
            min={1}
            max={12}
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value) || 4)}
            className="w-24"
          />
        </label>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule post</CardTitle>
          <CardDescription>Created as <strong>approved</strong> by default</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <textarea
            className="w-full min-h-20 rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
            placeholder="Post copy"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="instagram">instagram</option>
              <option value="facebook">facebook</option>
              <option value="google_business">google_business</option>
              <option value="linkedin">linkedin</option>
            </select>
            <select
              className="rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as "promo" | "edu" | "ugc" | "other")
              }
            >
              <option value="promo">promo</option>
              <option value="edu">edu</option>
              <option value="ugc">ugc</option>
              <option value="seasonal">seasonal</option>
            </select>
            <Input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="w-auto"
            />
            <Button onClick={() => void addPost()} disabled={!body.trim()}>
              Schedule (approved)
            </Button>
          </div>
        </CardContent>
      </Card>

      {due && due.length > 0 ? (
        <p className="text-xs text-[var(--color-mocha-peach)]">
          {due.length} post(s) due or within look-ahead and still approved for publish.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Approval Calendar</CardTitle>
          <CardDescription>
            {weeks}-week look-ahead · posts publish unless disapproved
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {posts === undefined ? (
            <p className="text-sm text-[var(--color-mocha-subtext0)]">Loading…</p>
          ) : byDay.length === 0 ? (
            <p className="text-sm text-[var(--color-mocha-subtext0)]">No posts in window.</p>
          ) : (
            byDay.map(([day, list]) => (
              <div key={day}>
                <h3 className="text-sm font-medium text-[var(--color-brand-sky)] mb-2">{day}</h3>
                <ul className="space-y-2">
                  {list.map((p) => (
                    <li
                      key={p.id}
                      className="mc-glass px-4 py-3 rounded-[var(--radius-md)] space-y-2"
                    >
                      <div className="flex flex-wrap justify-between gap-2 text-sm">
                        <span className="font-medium">{p.channel}</span>
                        <span className="text-xs">
                          {new Date(p.scheduledAt).toLocaleString()} ·{" "}
                          <span
                            className={
                              p.status === "disapproved"
                                ? "text-[var(--color-mocha-red)]"
                                : p.status === "failed"
                                  ? "text-[var(--color-mocha-peach)]"
                                  : "text-[var(--color-mocha-green)]"
                            }
                          >
                            {p.status}
                          </span>
                        </span>
                      </div>
                      <p className="text-sm">{p.body}</p>
                      {p.editNotes ? (
                        <p className="text-xs text-[var(--color-mocha-subtext0)]">Notes: {p.editNotes}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        {p.status !== "disapproved" ? (
                          <Button
                            variant="secondary"
                            onClick={() =>
                              void disapprove({
                                postId: p.id as Id<"socialPosts">,
                                editNotes: "Client disapproved",
                              })
                            }
                          >
                            Disapprove
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={() =>
                              void updatePost({
                                postId: p.id as Id<"socialPosts">,
                                patch: { status: "approved" },
                              })
                            }
                          >
                            Re-approve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() =>
                            void recycle({
                              postId: p.id as Id<"socialPosts">,
                              scheduledAt: Date.now() + 14 * 864e5,
                              category: category,
                            })
                          }
                        >
                          Recycle +14d
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            void attemptPublish({ postId: p.id as Id<"socialPosts"> })
                          }
                        >
                          Publish now
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            void attemptPublish({
                              postId: p.id as Id<"socialPosts">,
                              forceFail: true,
                            })
                          }
                        >
                          Simulate fail → reschedule
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
