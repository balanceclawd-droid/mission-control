"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import {
  tasks as mockTasks,
  weightedScore as mockWeightedScore,
  getMiniSprintTasks,
  type Task,
  type TaskPriority,
} from "@/lib/mock/phase1-tasks";

// ── Types ──────────────────────────────────────────────────────────────────────

interface LiveTask {
  id: string;
  googleTaskId: string;
  googleListId: string;
  title: string;
  priority: TaskPriority;
  list: "today" | "blocked";
  estimateMinutes: number;
  ageHours: number;
  annoyanceScore: number;
  annoyanceReason: string;
  blocked: boolean;
  blockedBy?: string;
  tags: string[];
  completed: boolean;
}

type BoardTask = Task & {
  googleTaskId?: string;
  googleListId?: string;
  completed?: boolean;
};

// ── Toasts ─────────────────────────────────────────────────────────────────────

interface ToastMsg {
  id: number;
  message: string;
  type: "success" | "error";
}

let toastSeq = 0;

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastMsg[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-medium cursor-pointer transition-all
            ${
              t.type === "success"
                ? "bg-emerald-900/90 border border-emerald-500/40 text-emerald-300"
                : "bg-red-900/90 border border-red-500/40 text-red-300"
            }`}
        >
          <span>{t.type === "success" ? "✓" : "✗"}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ── Data source badge ──────────────────────────────────────────────────────────

type DataSource = "live" | "mock" | "loading" | "error";

function DataSourceBadge({ source }: { source: DataSource }) {
  const config = {
    live: {
      dot: "bg-emerald-400",
      wrapper: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      label: "Google Tasks API",
    },
    mock: {
      dot: "bg-amber-400",
      wrapper: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      label: "Mock fallback",
    },
    loading: {
      dot: "bg-slate-400 animate-pulse",
      wrapper: "bg-slate-500/15 text-slate-400 border-slate-500/30",
      label: "Loading…",
    },
    error: {
      dot: "bg-red-400",
      wrapper: "bg-red-500/15 text-red-400 border-red-500/30",
      label: "API error — mock fallback",
    },
  };

  const c = config[source];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${c.wrapper}`}
      title={
        source === "live"
          ? "Live data from Google Tasks API"
          : source === "mock"
          ? "Showing local mock data — API unavailable or not configured"
          : source === "error"
          ? "Google Tasks API returned an error; showing mock data"
          : "Connecting to Google Tasks API…"
      }
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ── Annoyance meter ────────────────────────────────────────────────────────────

function AnnoyanceMeter({ score }: { score: number }) {
  const color =
    score >= 8 ? "bg-red-500" : score >= 5 ? "bg-amber-500" : "bg-slate-600";
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 rounded-full bg-slate-800 w-16">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <span className="text-xs text-slate-500">{score}/10</span>
    </div>
  );
}

// ── Task row ───────────────────────────────────────────────────────────────────

const priorityVariant: Record<
  TaskPriority,
  "high" | "medium" | "low" | "default"
> = {
  critical: "high",
  high: "high",
  medium: "medium",
  low: "low",
};

const priorityLabel: Record<TaskPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

function TaskRow({
  task,
  onStart,
  isStartHere,
  onComplete,
  completePending,
  isCompleted,
}: {
  task: BoardTask;
  onStart: (id: string) => void;
  isStartHere: boolean;
  onComplete?: (task: BoardTask) => void;
  completePending?: boolean;
  isCompleted?: boolean;
}) {
  const done = isCompleted || task.completed;

  return (
    <div
      className={`flex items-start gap-3 py-3 border-b border-slate-800/60 last:border-0 transition-all ${
        isStartHere && !done ? "bg-emerald-500/5 rounded-md px-2" : ""
      } ${done ? "opacity-50" : ""}`}
    >
      {/* Completion checkbox */}
      <button
        type="button"
        disabled={completePending || done}
        onClick={() => !done && onComplete?.(task)}
        aria-label={done ? "Task completed" : "Mark task as complete"}
        className={`w-4 h-4 rounded border shrink-0 mt-0.5 transition-all flex items-center justify-center
          ${
            done
              ? "border-emerald-600 bg-emerald-600/30 cursor-default"
              : completePending
              ? "border-slate-500 bg-slate-700 cursor-wait animate-pulse"
              : "border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
          }`}
      >
        {done && (
          <svg
            className="w-2.5 h-2.5 text-emerald-400"
            fill="none"
            viewBox="0 0 12 12"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {completePending && !done && (
          <div className="w-2 h-2 rounded-full bg-slate-400" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium ${
              done ? "text-slate-500 line-through" : "text-slate-200"
            }`}
          >
            {task.title}
          </span>
          {isStartHere && !done && (
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-medium">
              Start Here
            </span>
          )}
          {done && (
            <span className="text-xs bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded">
              Done
            </span>
          )}
          {!done && task.blocked && (
            <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">
              Blocked
            </span>
          )}
          {!done && task.estimateMinutes <= 5 && (
            <span className="text-xs bg-violet-500/15 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded">
              ≤5 min
            </span>
          )}
        </div>
        {!done && (
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <Badge variant={priorityVariant[task.priority]}>
              {priorityLabel[task.priority]}
            </Badge>
            <AnnoyanceMeter score={task.annoyanceScore} />
            <span className="text-xs text-slate-600">{task.annoyanceReason}</span>
          </div>
        )}
        {!done && task.blocked && task.blockedBy && (
          <div className="mt-1 text-xs text-red-400/80">
            ↳ Blocked by: {task.blockedBy}
          </div>
        )}
      </div>

      {!done && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-600 hidden sm:block">
            ~{task.estimateMinutes}m · {task.ageHours}h old
          </span>
          <button
            onClick={() => onStart(task.id)}
            className="px-2.5 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors"
          >
            Start →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function weightedScore(task: BoardTask): number {
  const priorityMap: Record<TaskPriority, number> = {
    critical: 40,
    high: 30,
    medium: 20,
    low: 10,
  };
  const ageWeight = Math.min(task.ageHours / 24, 5) * 5;
  return task.annoyanceScore * 3 + priorityMap[task.priority] + ageWeight;
}

function liveToBoardTask(t: LiveTask): BoardTask {
  return {
    ...t,
    tags: t.tags ?? [],
    blocked: t.blocked ?? false,
  };
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [started, setStarted] = useState<Set<string>>(new Set());
  const [sprintActive, setSprintActive] = useState(false);

  // Completion state
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());

  // Toast state
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  // Data state
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>("loading");

  // Toasts
  const addToast = useCallback((message: string, type: ToastMsg["type"]) => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch tasks on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/tasks");
        if (!cancelled) {
          if (res.ok) {
            const data = (await res.json()) as {
              tasks: LiveTask[];
              source: string;
            };
            if (data.tasks && data.tasks.length >= 0) {
              setTasks(data.tasks.map(liveToBoardTask));
              setDataSource("live");
              return;
            }
          }
          // API returned error — fall back to mock
          setTasks(mockTasks as BoardTask[]);
          setDataSource("error");
        }
      } catch {
        if (!cancelled) {
          setTasks(mockTasks as BoardTask[]);
          setDataSource("error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle task completion
  const handleComplete = useCallback(
    async (task: BoardTask) => {
      if (completed.has(task.id) || pending.has(task.id)) return;

      // Optimistic update
      setPending((prev) => new Set([...prev, task.id]));

      // If no Google IDs, just mark locally (mock fallback)
      if (!task.googleTaskId || !task.googleListId) {
        setTimeout(() => {
          setPending((prev) => {
            const next = new Set(prev);
            next.delete(task.id);
            return next;
          });
          setCompleted((prev) => new Set([...prev, task.id]));
          addToast("Task marked complete (local only)", "success");
        }, 400);
        return;
      }

      try {
        const res = await fetch("/api/tasks/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: task.googleTaskId,
            listId: task.googleListId,
          }),
        });

        setPending((prev) => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });

        if (res.ok) {
          setCompleted((prev) => new Set([...prev, task.id]));
          addToast(`✓ "${task.title.slice(0, 40)}" completed`, "success");
        } else {
          const err = (await res.json().catch(() => ({ error: "Unknown error" }))) as {
            error?: string;
          };
          addToast(`Failed: ${err.error ?? "Unknown error"}`, "error");
        }
      } catch (e) {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
        addToast(`Network error: ${e instanceof Error ? e.message : "Unknown"}`, "error");
      }
    },
    [completed, pending, addToast]
  );

  function handleStart(id: string) {
    setStarted((prev) => new Set([...prev, id]));
  }

  // Filter out completed tasks for display
  const activeTasks = useMemo(
    () => tasks.filter((t) => !completed.has(t.id) && !t.completed),
    [tasks, completed]
  );

  const todayTasks = useMemo(
    () =>
      activeTasks
        .filter((t) => t.list === "today")
        .sort((a, b) => weightedScore(b) - weightedScore(a)),
    [activeTasks]
  );

  const blockedTasks = useMemo(
    () =>
      activeTasks
        .filter((t) => t.list === "blocked")
        .sort((a, b) => weightedScore(b) - weightedScore(a)),
    [activeTasks]
  );

  const miniSprint = useMemo(() => {
    if (dataSource === "live" || dataSource === "loading") {
      // Use live tasks for mini sprint
      return activeTasks
        .filter((t) => t.estimateMinutes <= 5)
        .sort((a, b) => weightedScore(b) - weightedScore(a));
    }
    // Mock fallback
    return getMiniSprintTasks(mockTasks) as BoardTask[];
  }, [activeTasks, dataSource]);

  const sprintTotalMinutes = miniSprint.reduce(
    (sum, t) => sum + t.estimateMinutes,
    0
  );
  const topTask = todayTasks[0];

  const criticalCount = activeTasks.filter(
    (t) => t.priority === "critical"
  ).length;
  const blockedCount = activeTasks.filter((t) => t.blocked).length;
  const miniSprintCount = miniSprint.length;
  const completedCount = completed.size;

  const isMockFallback = dataSource === "mock" || dataSource === "error";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast stack */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Task Board</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Priority-sorted tasks with annoyance weighting, mini sprints, and
            live Google Tasks sync
          </p>
        </div>
        <DataSourceBadge source={dataSource} />
      </div>

      {/* Fallback notice */}
      {isMockFallback && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/8 border border-amber-500/20 text-xs text-amber-400">
          <span className="mt-0.5">⚠️</span>
          <span>
            <strong>
              {dataSource === "error" ? "API error" : "Offline dev mode"}
            </strong>{" "}
            — showing mock task data. Ensure{" "}
            <code className="font-mono bg-slate-800 px-1 rounded">
              ~/.openclaw/credentials/google-tasks-token.json
            </code>{" "}
            exists and has the{" "}
            <code className="font-mono bg-slate-800 px-1 rounded">
              https://www.googleapis.com/auth/tasks
            </code>{" "}
            scope. Completion toggles work locally only in mock mode.
          </span>
        </div>
      )}

      {/* Loading skeleton */}
      {dataSource === "loading" && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/40 border border-slate-700 text-xs text-slate-400">
          <div className="w-3 h-3 rounded-full bg-slate-500 animate-pulse" />
          Connecting to Google Tasks API…
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Active Tasks"
          value={String(activeTasks.length)}
          trend="neutral"
        />
        <StatCard
          label="Critical"
          value={String(criticalCount)}
          trend={criticalCount > 0 ? "down" : "up"}
        />
        <StatCard
          label="Blocked"
          value={String(blockedCount)}
          trend={blockedCount > 0 ? "warn" : "neutral"}
        />
        <StatCard
          label="Completed"
          value={String(completedCount)}
          sub={miniSprintCount > 0 ? `Mini sprint: ~${sprintTotalMinutes}m` : undefined}
          trend={completedCount > 0 ? "up" : "neutral"}
        />
      </div>

      {/* Mini Sprint banner */}
      <Card className="border-violet-500/30 bg-violet-500/5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">⚡</span>
              <span className="text-sm font-semibold text-slate-100">
                Mini Sprint Block
              </span>
              <span className="text-xs text-violet-400 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded">
                {miniSprintCount} tasks · ~{sprintTotalMinutes} min
              </span>
            </div>
            <p className="text-xs text-slate-500">
              All tasks ≤5 minutes — batch these together for a quick
              productivity burst.
            </p>
          </div>
          <button
            onClick={() => setSprintActive(!sprintActive)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              sprintActive
                ? "bg-violet-600 hover:bg-violet-500 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-slate-200"
            }`}
          >
            {sprintActive ? "Sprint Active ▶" : "Start Sprint"}
          </button>
        </div>
        {sprintActive && (
          <div className="mt-4 space-y-0">
            {miniSprint.map((task, idx) => (
              <TaskRow
                key={task.id}
                task={task}
                onStart={handleStart}
                isStartHere={idx === 0 && !started.has(task.id)}
                onComplete={handleComplete}
                completePending={pending.has(task.id)}
                isCompleted={completed.has(task.id)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Main two-column task grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* To Do Today */}
        <Card padding="none">
          <div className="p-4 border-b border-slate-800">
            <SectionHeader
              title="To Do Today"
              subtitle={`${todayTasks.length} tasks · sorted by priority + annoyance`}
            />
          </div>
          <div className="p-4">
            {todayTasks.length === 0 && dataSource !== "loading" ? (
              <p className="text-xs text-slate-600 py-2">
                {dataSource === "live"
                  ? "All caught up 🎉"
                  : "No tasks in this list."}
              </p>
            ) : (
              todayTasks.map((task, idx) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onStart={handleStart}
                  isStartHere={idx === 0}
                  onComplete={handleComplete}
                  completePending={pending.has(task.id)}
                  isCompleted={completed.has(task.id)}
                />
              ))
            )}
          </div>
        </Card>

        {/* Right now / Blocked */}
        <Card padding="none">
          <div className="p-4 border-b border-slate-800">
            <SectionHeader
              title="Right Now / Blocked"
              subtitle={`${blockedTasks.length} items · short tasks and blockers`}
            />
          </div>
          <div className="p-4">
            {blockedTasks.length === 0 && dataSource !== "loading" ? (
              <p className="text-xs text-slate-600 py-2">
                {dataSource === "live"
                  ? "Nothing blocked right now 👍"
                  : "No tasks in this list."}
              </p>
            ) : (
              blockedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onStart={handleStart}
                  isStartHere={false}
                  onComplete={handleComplete}
                  completePending={pending.has(task.id)}
                  isCompleted={completed.has(task.id)}
                />
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Top priority callout */}
      {topTask && !completed.has(topTask.id) && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-start gap-3">
            <span className="text-base mt-0.5">🚀</span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-emerald-400 mb-0.5">
                Start Here
              </div>
              <div className="text-sm text-slate-200">{topTask.title}</div>
              <div className="text-xs text-slate-500 mt-1">
                Annoyance: {topTask.annoyanceScore}/10 ·{" "}
                {topTask.annoyanceReason}
              </div>
            </div>
            <button
              onClick={() => handleComplete(topTask)}
              className="px-3 py-1.5 rounded text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shrink-0"
            >
              {pending.has(topTask.id) ? "Saving…" : "Done ✓"}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
