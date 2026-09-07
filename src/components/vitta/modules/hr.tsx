"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, IndianRupee, Plane, Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { DataTable, type Column } from "@/components/vitta/ui/data-table";
import { Kanban, type KanbanStage } from "@/components/vitta/ui/kanban";
import { RecordDrawer, type FieldDef, type RecordValues } from "@/components/vitta/ui/record-drawer";
import { StatusBadge } from "@/components/vitta/ui/status-badge";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { EmptyState } from "@/components/vitta/ui/empty-state";
import { fmtMoney, fmtDate, toDateInput, initials } from "@/lib/vitta/format";
import type { Employee, LeaveRequest } from "@/lib/vitta/types";

const DEPARTMENTS = [
  "Management",
  "Sales",
  "Finance",
  "Human Resources",
  "Operations",
  "Customer Support",
  "Manufacturing",
  "Marketing",
  "Field Service",
  "Procurement",
];

const LEAVE_STAGES: KanbanStage[] = [
  { key: "pending", label: "To Approve", dot: "bg-amber-500" },
  { key: "approved", label: "Approved", dot: "bg-emerald-500" },
  { key: "refused", label: "Refused", dot: "bg-rose-500" },
];

const EMPLOYEE_FIELDS: FieldDef[] = [
  { name: "name", label: "Name", type: "text", required: true, full: true, placeholder: "e.g. Priya Sharma" },
  { name: "email", label: "Email", type: "email", placeholder: "name@vitta.io" },
  { name: "phone", label: "Phone", type: "tel", placeholder: "+91 98765 43210" },
  { name: "jobTitle", label: "Job title", type: "text", placeholder: "e.g. Sales Executive" },
  { name: "department", label: "Department", type: "select", options: DEPARTMENTS.map((d) => ({ value: d, label: d })) },
  { name: "salary", label: "Monthly salary (₹)", type: "number", step: "0.01" },
  { name: "hireDate", label: "Hire date", type: "date" },
  {
    name: "status",
    label: "Status",
    type: "select",
    defaultValue: "active",
    options: [
      { value: "active", label: "Active" },
      { value: "on_leave", label: "On Leave" },
      { value: "departed", label: "Departed" },
    ],
  },
];

export default function HrModule() {
  const { items: employees, loading: empLoading, reload: reloadEmployees, create: createEmployee, update: updateEmployee, remove: removeEmployee } =
    useResource<Employee>("employees");
  const { items: leaves, loading: leaveLoading, reload: reloadLeaves, create: createLeave, update: updateLeave, remove: removeLeave } =
    useResource<LeaveRequest>("leaves");

  const [tab, setTab] = useState<"employees" | "timeoff">("employees");
  const [empView, setEmpView] = useState<"grid" | "list">("grid");
  const [leaveView, setLeaveView] = useState<"board" | "list">("board");
  const [q, setQ] = useState("");
  const [empDrawer, setEmpDrawer] = useState<{ open: boolean; item: Employee | null }>({ open: false, item: null });
  const [leaveDrawer, setLeaveDrawer] = useState<{ open: boolean; item: LeaveRequest | null }>({ open: false, item: null });

  const filteredEmployees = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(needle) ||
        (e.email ?? "").toLowerCase().includes(needle) ||
        (e.jobTitle ?? "").toLowerCase().includes(needle) ||
        (e.department ?? "").toLowerCase().includes(needle)
    );
  }, [employees, q]);

  const filteredLeaves = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return leaves;
    return leaves.filter(
      (l) =>
        (l.employeeName ?? "").toLowerCase().includes(needle) ||
        l.type.toLowerCase().includes(needle) ||
        (l.reason ?? "").toLowerCase().includes(needle)
    );
  }, [leaves, q]);

  const activeCount = employees.filter((e) => e.status === "active").length;
  const onLeaveCount = employees.filter((e) => e.status === "on_leave").length;
  const payroll = employees.filter((e) => e.status === "active").reduce((a, e) => a + e.salary, 0);
  const pendingCount = leaves.filter((l) => l.status === "pending").length;

  const employeeOptions = useMemo(() => employees.map((e) => ({ value: e.id, label: e.name })), [employees]);

  const leaveFields = useMemo<FieldDef[]>(
    () => [
      { name: "employeeId", label: "Employee", type: "select", required: true, options: employeeOptions },
      {
        name: "type",
        label: "Leave type",
        type: "select",
        required: true,
        defaultValue: "casual",
        options: [
          { value: "casual", label: "Casual" },
          { value: "sick", label: "Sick" },
          { value: "earned", label: "Earned" },
          { value: "unpaid", label: "Unpaid" },
        ],
      },
      { name: "from", label: "From", type: "date", required: true },
      { name: "to", label: "To", type: "date", required: true },
      { name: "days", label: "Days", type: "number", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        defaultValue: "pending",
        options: LEAVE_STAGES.map((s) => ({ value: s.key, label: s.label })),
      },
      { name: "reason", label: "Reason", type: "textarea", full: true, placeholder: "Short explanation for the request" },
    ],
    [employeeOptions]
  );

  function refreshAll() {
    void reloadEmployees();
    void reloadLeaves();
  }

  async function handleEmployeeSave(values: RecordValues) {
    const payload = {
      name: values.name,
      email: values.email || null,
      phone: values.phone || null,
      jobTitle: values.jobTitle || null,
      department: values.department || null,
      salary: Number(values.salary || 0),
      hireDate: values.hireDate ? new Date(values.hireDate).toISOString() : null,
      status: (values.status || "active") as Employee["status"],
    };
    if (empDrawer.item) {
      await updateEmployee(empDrawer.item.id, payload);
      toast.success("Employee updated");
    } else {
      await createEmployee(payload);
      toast.success("Employee created");
    }
    setEmpDrawer({ open: false, item: null });
  }

  async function handleEmployeeDelete() {
    if (!empDrawer.item) return;
    await removeEmployee(empDrawer.item.id);
    toast.success("Employee deleted");
    setEmpDrawer({ open: false, item: null });
  }

  async function handleLeaveSave(values: RecordValues) {
    const payload = {
      employeeId: values.employeeId,
      type: (values.type || "casual") as LeaveRequest["type"],
      from: values.from ? new Date(values.from).toISOString() : "",
      to: values.to ? new Date(values.to).toISOString() : "",
      days: Number(values.days || 0),
      status: (values.status || "pending") as LeaveRequest["status"],
      reason: values.reason || null,
    };
    if (leaveDrawer.item) {
      await updateLeave(leaveDrawer.item.id, payload);
      toast.success("Leave request updated");
    } else {
      await createLeave(payload);
      toast.success("Leave request created");
    }
    setLeaveDrawer({ open: false, item: null });
  }

  async function handleLeaveDelete() {
    if (!leaveDrawer.item) return;
    await removeLeave(leaveDrawer.item.id);
    toast.success("Leave request deleted");
    setLeaveDrawer({ open: false, item: null });
  }

  async function decide(leave: LeaveRequest, status: "approved" | "refused") {
    await updateLeave(leave.id, { status });
    toast.success(status === "approved" ? "Leave approved" : "Leave refused");
  }

  async function setLeaveStage(leave: LeaveRequest, status: string) {
    await updateLeave(leave.id, { status: status as LeaveRequest["status"] });
    if (status === "approved") toast.success("Leave approved");
    else if (status === "refused") toast.success("Leave refused");
    else toast.success("Leave reset to pending");
  }

  const employeeColumns: Column<Employee>[] = [
    {
      key: "name",
      header: "Employee",
      render: (e) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 border">
            <AvatarFallback className="bg-[#F3EDF2] text-[10px] font-bold text-[#714B67]">{initials(e.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate font-medium">{e.name}</div>
            <div className="truncate text-xs text-muted-foreground">{e.jobTitle ?? "—"}</div>
          </div>
        </div>
      ),
    },
    { key: "department", header: "Department" },
    { key: "email", header: "Email", hideSm: true, render: (e) => <span className="text-muted-foreground">{e.email ?? "—"}</span> },
    { key: "salary", header: "Salary", hideMd: true, render: (e) => fmtMoney(e.salary) },
    { key: "status", header: "Status", render: (e) => <StatusBadge status={e.status} /> },
  ];

  const leaveColumns: Column<LeaveRequest>[] = [
    { key: "employeeName", header: "Employee", render: (l) => <span className="font-medium">{l.employeeName ?? "—"}</span> },
    { key: "type", header: "Type", render: (l) => <span className="capitalize">{l.type}</span> },
    { key: "from", header: "From", render: (l) => fmtDate(l.from) },
    { key: "to", header: "To", render: (l) => fmtDate(l.to) },
    { key: "days", header: "Days", hideSm: true },
    { key: "status", header: "Status", render: (l) => <StatusBadge status={l.status} /> },
    { key: "reason", header: "Reason", hideMd: true, render: (l) => <span className="line-clamp-1 text-muted-foreground">{l.reason ?? "—"}</span> },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Human Resources"
        itemCount={tab === "employees" ? filteredEmployees.length : filteredLeaves.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder={tab === "employees" ? "Search employees..." : "Search time off..."}
        onRefresh={refreshAll}
        loading={tab === "employees" ? empLoading : leaveLoading}
        actions={
          <Button
            onClick={() =>
              tab === "employees" ? setEmpDrawer({ open: true, item: null }) : setLeaveDrawer({ open: true, item: null })
            }
            className="h-9"
          >
            <Plus className="mr-1 h-4 w-4" /> {tab === "employees" ? "New Employee" : "New Leave"}
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as "employees" | "timeoff");
              setQ("");
            }}
          >
            <TabsList className="h-8">
              <TabsTrigger value="employees" className="h-6 px-3 text-xs">Employees</TabsTrigger>
              <TabsTrigger value="timeoff" className="h-6 px-3 text-xs">Time Off</TabsTrigger>
            </TabsList>
          </Tabs>
          {tab === "employees" ? (
            <Tabs value={empView} onValueChange={(v) => setEmpView(v as "grid" | "list")}>
              <TabsList className="h-8">
                <TabsTrigger value="grid" className="h-6 px-3 text-xs">Grid</TabsTrigger>
                <TabsTrigger value="list" className="h-6 px-3 text-xs">List</TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <Tabs value={leaveView} onValueChange={(v) => setLeaveView(v as "board" | "list")}>
              <TabsList className="h-8">
                <TabsTrigger value="board" className="h-6 px-3 text-xs">Board</TabsTrigger>
                <TabsTrigger value="list" className="h-6 px-3 text-xs">List</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 px-4 pt-4 md:px-6 xl:grid-cols-4">
        <StatCard label="Active headcount" value={activeCount} sub={`${employees.length} total`} icon={<Users className="h-5 w-5" />} tone="brand" />
        <StatCard label="On leave" value={onLeaveCount} icon={<Plane className="h-5 w-5" />} tone="sky" />
        <StatCard label="Monthly payroll" value={fmtMoney(payroll, true)} sub="active employees" icon={<IndianRupee className="h-5 w-5" />} tone="emerald" />
        <StatCard label="Pending approvals" value={pendingCount} sub="time off requests" icon={<Clock className="h-5 w-5" />} tone="amber" />
      </div>

      {tab === "employees" ? (
        empView === "grid" ? (
          empLoading ? (
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:p-6 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <EmptyState
              title="No employees found"
              description="Add your first employee to build the directory."
              icon={<Search className="h-7 w-7" />}
            />
          ) : (
            <div className="scroll-slim flex-1 overflow-auto p-4 md:p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredEmployees.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEmpDrawer({ open: true, item: e })}
                    className="rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarFallback className="bg-[#F3EDF2] text-xs font-bold text-[#714B67]">{initials(e.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{e.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{e.jobTitle ?? "—"}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="truncate rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {e.department ?? "—"}
                      </span>
                      <StatusBadge status={e.status} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        ) : (
          <DataTable
            columns={employeeColumns}
            items={filteredEmployees}
            onRowClick={(e) => setEmpDrawer({ open: true, item: e })}
            loading={empLoading}
            emptyIcon={<Search className="h-7 w-7" />}
            emptyTitle="No employees found"
            emptyDescription="Add your first employee to build the directory."
          />
        )
      ) : leaveView === "board" ? (
        <Kanban
          stages={LEAVE_STAGES}
          items={filteredLeaves}
          getStage={(l) => l.status}
          renderCard={(l) => (
            <div className="cursor-pointer" onClick={() => setLeaveDrawer({ open: true, item: l })}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium leading-snug">{l.employeeName ?? "—"}</span>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                  {l.type}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {l.days} {l.days === 1 ? "day" : "days"} · {fmtDate(l.from)} – {fmtDate(l.to)}
              </div>
              {l.reason ? <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{l.reason}</p> : null}
              {l.status === "pending" ? (
                <div className="mt-2.5 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      void decide(l, "approved");
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex-1 border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      void decide(l, "refused");
                    }}
                  >
                    Refuse
                  </Button>
                </div>
              ) : null}
            </div>
          )}
          onStageChange={setLeaveStage}
          loading={leaveLoading}
        />
      ) : (
        <DataTable
          columns={leaveColumns}
          items={filteredLeaves}
          onRowClick={(l) => setLeaveDrawer({ open: true, item: l })}
          loading={leaveLoading}
          emptyIcon={<Search className="h-7 w-7" />}
          emptyTitle="No time off requests"
          emptyDescription="Leave requests from employees will appear here."
        />
      )}

      <RecordDrawer
        open={empDrawer.open}
        onClose={() => setEmpDrawer({ open: false, item: null })}
        title={empDrawer.item ? `Edit — ${empDrawer.item.name}` : "New Employee"}
        description="Employee directory record with payroll details."
        fields={EMPLOYEE_FIELDS}
        initial={empDrawer.item ? { ...empDrawer.item, hireDate: toDateInput(empDrawer.item.hireDate) } : null}
        onSubmit={handleEmployeeSave}
        onDelete={empDrawer.item ? handleEmployeeDelete : undefined}
      />

      <RecordDrawer
        open={leaveDrawer.open}
        onClose={() => setLeaveDrawer({ open: false, item: null })}
        title={leaveDrawer.item ? "Edit Leave Request" : "New Leave Request"}
        description="Time off requests and approvals."
        fields={leaveFields}
        initial={
          leaveDrawer.item
            ? { ...leaveDrawer.item, from: toDateInput(leaveDrawer.item.from), to: toDateInput(leaveDrawer.item.to) }
            : null
        }
        onSubmit={handleLeaveSave}
        onDelete={leaveDrawer.item ? handleLeaveDelete : undefined}
      />
    </div>
  );
}
