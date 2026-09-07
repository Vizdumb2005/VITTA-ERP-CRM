"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Flag, FolderKanban, ListTodo, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { DataTable, type Column } from "@/components/vitta/ui/data-table";
import { Kanban, type KanbanStage } from "@/components/vitta/ui/kanban";
import { RecordDrawer, type FieldDef, type RecordValues } from "@/components/vitta/ui/record-drawer";
import { StatusBadge } from "@/components/vitta/ui/status-badge";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { EmptyState } from "@/components/vitta/ui/empty-state";
import { cn } from "@/lib/utils";
import { fmtDate, toDateInput, initials } from "@/lib/vitta/format";
import type { Employee, Project, Task } from "@/lib/vitta/types";

const PROJECT_COLORS = [
  { hex: "#714B67", name: "Plum" },
  { hex: "#00A88D", name: "Teal" },
  { hex: "#F8931D", name: "Orange" },
  { hex: "#31A3DD", name: "Sky" },
  { hex: "#7C2D5E", name: "Wine" },
  { hex: "#FBB04E", name: "Sand" },
];

const TASK_STAGES: KanbanStage[] = [
  { key: "todo", label: "To Do", dot: "bg-stone-400" },
  { key: "in_progress", label: "In Progress", dot: "bg-sky-500" },
  { key: "review", label: "In Review", dot: "bg-amber-500" },
  { key: "done", label: "Done", dot: "bg-emerald-500" },
];

const FALLBACK_COLOR = "#A8A29E";

type ProjectPayload = {
  name: string;
  color: string;
  status: Project["status"];
  deadline: string | null;
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function Chip({ active, onClick, children, ariaPressed }: { active: boolean; onClick: () => void; children: React.ReactNode; ariaPressed: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors",
        active
          ? "border-[#714B67] bg-[#714B67] text-white"
          : "border-border bg-white text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

/** Project create/edit drawer with a color swatch picker (local to this module). */
function ProjectSheet({
  open,
  onClose,
  initial,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  initial: Project | null;
  onSubmit: (payload: ProjectPayload) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0].hex);
  const [status, setStatus] = useState<Project["status"]>("active");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setColor(initial?.color ?? PROJECT_COLORS[0].hex);
    setStatus(initial?.status ?? "active");
    setDeadline(toDateInput(initial?.deadline));
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    try {
      setSaving(true);
      await onSubmit({
        name: name.trim(),
        color,
        status,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    try {
      setDeleting(true);
      await onDelete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="scroll-slim flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>{initial ? `Edit — ${initial.name}` : "New Project"}</SheetTitle>
          <SheetDescription>Group tasks under a color-coded project.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="grid flex-1 grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="prj-name" className="mb-1.5 block text-xs">
                Project name<span className="ml-0.5 text-rose-500">*</span>
              </Label>
              <Input
                id="prj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Website Redesign"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs">Color</Label>
              <div className="flex flex-wrap items-center gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    aria-label={`${c.name} (${c.hex})`}
                    aria-pressed={color === c.hex}
                    className={cn(
                      "h-9 w-9 rounded-full border border-black/10 transition-all",
                      color === c.hex && "ring-2 ring-[#714B67] ring-offset-2"
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="prj-status" className="mb-1.5 block text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Project["status"])}>
                <SelectTrigger id="prj-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="prj-deadline" className="mb-1.5 block text-xs">Deadline</Label>
              <Input id="prj-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <SheetFooter className="flex-row items-center justify-between gap-2 border-t px-5 py-4">
            <div>
              {onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting || saving}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  {deleting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                  Delete
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || deleting}>
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default function ProjectModule() {
  const {
    items: projects,
    loading: projLoading,
    reload: reloadProjects,
    create: createProject,
    update: updateProject,
    remove: removeProject,
  } = useResource<Project>("projects");
  const {
    items: tasks,
    loading: tasksLoading,
    reload: reloadTasks,
    create: createTask,
    update: updateTask,
    remove: removeTask,
  } = useResource<Task>("tasks");
  const { items: employees } = useResource<Employee>("employees");

  const [tab, setTab] = useState<"projects" | "tasks">("projects");
  const [taskView, setTaskView] = useState<"board" | "list">("board");
  const [q, setQ] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [projectDrawer, setProjectDrawer] = useState<{ open: boolean; item: Project | null }>({ open: false, item: null });
  const [taskDrawer, setTaskDrawer] = useState<{ open: boolean; item: Task | null }>({ open: false, item: null });

  const todayMs = useMemo(() => startOfToday(), []);

  const filteredProjects = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(needle));
  }, [projects, q]);

  const filteredTasks = useMemo(() => {
    const scoped = projectFilter ? tasks.filter((t) => t.projectId === projectFilter) : tasks;
    const needle = q.trim().toLowerCase();
    if (!needle) return scoped;
    return scoped.filter(
      (t) =>
        t.title.toLowerCase().includes(needle) ||
        (t.assignee ?? "").toLowerCase().includes(needle) ||
        (t.projectName ?? "").toLowerCase().includes(needle)
    );
  }, [tasks, projectFilter, q]);

  const openTasksByProject = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      if (t.stage !== "done") map[t.projectId] = (map[t.projectId] ?? 0) + 1;
    }
    return map;
  }, [tasks]);

  const activeProjects = projects.filter((p) => p.status === "active").length;
  const openTasks = tasks.filter((t) => t.stage !== "done").length;
  const doneTasks = tasks.filter((t) => t.stage === "done").length;

  const projectOptions = useMemo(() => projects.map((p) => ({ value: p.id, label: p.name })), [projects]);
  const assigneeOptions = useMemo(
    () => [{ value: "", label: "— Unassigned —" }, ...employees.map((e) => ({ value: e.name, label: e.name }))],
    [employees]
  );

  const taskFields = useMemo<FieldDef[]>(
    () => [
      { name: "title", label: "Task title", type: "text", required: true, full: true, placeholder: "e.g. Prepare project charter" },
      { name: "projectId", label: "Project", type: "select", required: true, options: projectOptions },
      { name: "stage", label: "Stage", type: "select", defaultValue: "todo", options: TASK_STAGES.map((s) => ({ value: s.key, label: s.label })) },
      {
        name: "priority",
        label: "Priority",
        type: "select",
        defaultValue: "0",
        options: [
          { value: "0", label: "Normal" },
          { value: "1", label: "High" },
        ],
      },
      { name: "assignee", label: "Assignee", type: "select", options: assigneeOptions },
      { name: "dueDate", label: "Due date", type: "date" },
    ],
    [projectOptions, assigneeOptions]
  );

  function refreshAll() {
    void reloadProjects();
    void reloadTasks();
  }

  function openProjectTasks(projectId: string) {
    setTab("tasks");
    setProjectFilter(projectId);
    setQ("");
  }

  async function handleProjectSave(payload: ProjectPayload) {
    if (projectDrawer.item) {
      await updateProject(projectDrawer.item.id, payload);
      toast.success("Project updated");
    } else {
      await createProject(payload);
      toast.success("Project created");
    }
    setProjectDrawer({ open: false, item: null });
  }

  async function handleProjectDelete() {
    if (!projectDrawer.item) return;
    await removeProject(projectDrawer.item.id);
    toast.success("Project deleted");
    setProjectDrawer({ open: false, item: null });
  }

  async function handleTaskSave(values: RecordValues) {
    const payload = {
      title: values.title,
      projectId: values.projectId,
      stage: (values.stage || "todo") as Task["stage"],
      priority: Number(values.priority || 0),
      assignee: values.assignee || null,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
    };
    if (taskDrawer.item) {
      await updateTask(taskDrawer.item.id, payload);
      toast.success("Task updated");
    } else {
      await createTask(payload);
      toast.success("Task created");
    }
    setTaskDrawer({ open: false, item: null });
  }

  async function handleTaskDelete() {
    if (!taskDrawer.item) return;
    await removeTask(taskDrawer.item.id);
    toast.success("Task deleted");
    setTaskDrawer({ open: false, item: null });
  }

  async function setTaskStage(task: Task, stage: string) {
    await updateTask(task.id, { stage: stage as Task["stage"] });
    toast.success(`Moved to ${TASK_STAGES.find((s) => s.key === stage)?.label ?? stage}`);
  }

  const taskColumns: Column<Task>[] = [
    {
      key: "title",
      header: "Task",
      render: (t) => (
        <span className={cn("font-medium", t.stage === "done" && "text-muted-foreground line-through")}>{t.title}</span>
      ),
    },
    {
      key: "projectName",
      header: "Project",
      hideSm: true,
      render: (t) => {
        const project = projects.find((p) => p.id === t.projectId);
        return (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: project?.color ?? FALLBACK_COLOR }} />
            <span className="truncate">{t.projectName ?? project?.name ?? "—"}</span>
          </span>
        );
      },
    },
    {
      key: "assignee",
      header: "Assignee",
      render: (t) =>
        t.assignee ? (
          <span className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarFallback className="bg-[#F3EDF2] text-[9px] font-bold text-[#714B67]">{initials(t.assignee)}</AvatarFallback>
            </Avatar>
            <span className="truncate">{t.assignee}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    { key: "dueDate", header: "Due", render: (t) => fmtDate(t.dueDate) },
    {
      key: "priority",
      header: "Priority",
      render: (t) =>
        t.priority === 1 ? (
          <Flag className="h-4 w-4 text-amber-500" aria-label="High priority" />
        ) : (
          <span className="text-xs text-muted-foreground">Normal</span>
        ),
    },
    { key: "stage", header: "Stage", render: (t) => <StatusBadge status={t.stage} /> },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Projects"
        itemCount={tab === "projects" ? filteredProjects.length : filteredTasks.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder={tab === "projects" ? "Search projects..." : "Search tasks..."}
        onRefresh={refreshAll}
        loading={tab === "projects" ? projLoading : tasksLoading}
        actions={
          <Button
            onClick={() =>
              tab === "projects" ? setProjectDrawer({ open: true, item: null }) : setTaskDrawer({ open: true, item: null })
            }
            className="h-9"
          >
            <Plus className="mr-1 h-4 w-4" /> {tab === "projects" ? "New Project" : "New Task"}
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as "projects" | "tasks");
              setQ("");
            }}
          >
            <TabsList className="h-8">
              <TabsTrigger value="projects" className="h-6 px-3 text-xs">Projects</TabsTrigger>
              <TabsTrigger value="tasks" className="h-6 px-3 text-xs">Tasks</TabsTrigger>
            </TabsList>
          </Tabs>
          {tab === "tasks" ? (
            <Tabs value={taskView} onValueChange={(v) => setTaskView(v as "board" | "list")}>
              <TabsList className="h-8">
                <TabsTrigger value="board" className="h-6 px-3 text-xs">Board</TabsTrigger>
                <TabsTrigger value="list" className="h-6 px-3 text-xs">List</TabsTrigger>
              </TabsList>
            </Tabs>
          ) : null}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-3 md:px-6">
        <StatCard label="Active projects" value={activeProjects} sub={`${projects.length} total`} icon={<FolderKanban className="h-5 w-5" />} tone="brand" />
        <StatCard label="Open tasks" value={openTasks} icon={<ListTodo className="h-5 w-5" />} tone="sky" />
        <StatCard label="Completed tasks" value={doneTasks} icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" />
      </div>

      {tab === "projects" ? (
        projLoading ? (
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:p-6 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            title="No projects found"
            description="Create your first project to start organizing tasks."
            icon={<Search className="h-7 w-7" />}
          />
        ) : (
          <div className="scroll-slim flex-1 overflow-auto p-4 md:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProjects.map((p) => {
                const overdue = p.status === "active" && !!p.deadline && new Date(p.deadline).getTime() < todayMs;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openProjectTasks(p.id)}
                    className="rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="truncate font-medium">{p.name}</span>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                      <span className={cn("truncate", overdue ? "font-medium text-rose-600" : "text-muted-foreground")}>
                        Deadline {fmtDate(p.deadline)}
                      </span>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                        {openTasksByProject[p.id] ?? 0} open
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5 px-4 pt-4 md:px-6">
            <Chip active={projectFilter === ""} ariaPressed={projectFilter === ""} onClick={() => setProjectFilter("")}>
              All projects
            </Chip>
            {projects.map((p) => (
              <Chip
                key={p.id}
                active={projectFilter === p.id}
                ariaPressed={projectFilter === p.id}
                onClick={() => setProjectFilter(p.id)}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </Chip>
            ))}
          </div>
          {taskView === "board" ? (
            <Kanban
              stages={TASK_STAGES}
              items={filteredTasks}
              getStage={(t) => t.stage}
              renderCard={(t) => {
                const project = projects.find((p) => p.id === t.projectId);
                const overdue = t.stage !== "done" && !!t.dueDate && new Date(t.dueDate).getTime() < todayMs;
                return (
                  <div className="cursor-pointer" onClick={() => setTaskDrawer({ open: true, item: t })}>
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn("text-sm font-medium leading-snug", t.stage === "done" && "text-muted-foreground line-through")}>
                        {t.title}
                      </span>
                      {t.priority === 1 ? <Flag className="h-4 w-4 shrink-0 text-amber-500" aria-label="High priority" /> : null}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: project?.color ?? FALLBACK_COLOR }} />
                      <span className="truncate">{t.projectName ?? project?.name ?? "—"}</span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      {t.assignee ? (
                        <Avatar className="size-6">
                          <AvatarFallback className="bg-[#F3EDF2] text-[9px] font-bold text-[#714B67]">{initials(t.assignee)}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                      <span className={cn("text-xs", overdue ? "font-medium text-rose-600" : "text-muted-foreground")}>
                        {fmtDate(t.dueDate)}
                      </span>
                    </div>
                  </div>
                );
              }}
              onStageChange={setTaskStage}
              loading={tasksLoading}
            />
          ) : (
            <DataTable
              columns={taskColumns}
              items={filteredTasks}
              onRowClick={(t) => setTaskDrawer({ open: true, item: t })}
              loading={tasksLoading}
              emptyIcon={<Search className="h-7 w-7" />}
              emptyTitle="No tasks found"
              emptyDescription="Create your first task to start tracking work."
            />
          )}
        </>
      )}

      <ProjectSheet
        open={projectDrawer.open}
        onClose={() => setProjectDrawer({ open: false, item: null })}
        initial={projectDrawer.item}
        onSubmit={handleProjectSave}
        onDelete={projectDrawer.item ? handleProjectDelete : undefined}
      />

      <RecordDrawer
        open={taskDrawer.open}
        onClose={() => setTaskDrawer({ open: false, item: null })}
        title={taskDrawer.item ? "Edit Task" : "New Task"}
        description="Work items tracked across project stages."
        fields={taskFields}
        initial={
          taskDrawer.item
            ? { ...taskDrawer.item, dueDate: toDateInput(taskDrawer.item.dueDate) }
            : projectFilter
              ? { projectId: projectFilter }
              : null
        }
        onSubmit={handleTaskSave}
        onDelete={taskDrawer.item ? handleTaskDelete : undefined}
      />
    </div>
  );
}
