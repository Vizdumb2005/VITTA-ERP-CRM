# VITTA ERP — Project Worklog

VITTA: a proprietary (not open source) ERP suite cloned from Odoo's UX, inspired by IDURAR & ERPNext.
Stack: Next.js 16 App Router, TypeScript, Tailwind 4 + shadcn/ui, Prisma + SQLite, zustand, sonner.
Single visible route `/` (client-side module switching via zustand). All backend via /api/* REST routes.

---
Task ID: 1
Agent: lead (orchestrator)
Task: Foundation — schema, theme, shared libs, shared UI, shell, launcher, stubs, seed

Work Log:
- Prisma schema: 20 models (Contact, Employee, LeaveRequest, Lead, Product, SaleOrder(+Line), PurchaseOrder(+Line), Invoice(+Line), Project, Task, Timesheet, HelpdeskTicket, ManufacturingOrder, Subscription, Campaign, PosOrder, Note, DocFile, SignDoc, Message) → db:push OK
- globals.css: VITTA brand (plum #714B67 family), chart colors, slim scrollbars
- src/lib/vitta/: types.ts (entity TS types + STATUS_STYLES map), format.ts (fmtMoney INR, fmtDate en-IN), api.ts (fetch wrapper), use-resource.ts (useResource hook: items/loading/reload/create/update/remove + error toasts), store.ts (zustand: activeApp/openApp/goHome), apps.ts (24-app registry)
- src/components/vitta/ui/: status-badge, stat-card, page-header, data-table (Column<T>, hideSm/hideMd), kanban (KanbanStage, stage dropdown), record-drawer (FieldDef forms + delete), empty-state
- Shell: topbar.tsx (dark plum navbar, breadcrumb, user menu), app-launcher.tsx (searchable 24-app grid + proprietary footer), module-views.tsx (id→component map), error-boundary.tsx, vitta-app.tsx
- Exemplar module: modules/subscriptions.tsx (list+board views, stats, drawer CRUD) — canonical pattern
- Exemplar API: src/app/api/contacts/route.ts + [id]/route.ts — canonical pattern
- prisma/seed.ts run OK (contacts 18, employees 10, products 14, leads 14, SO 12, PO 8, INV 14, projects 6, tasks 24, timesheets 36, tickets 12, MO 7, subs 8, campaigns 5, POS 7, notes 5, docs 8, sign 4, msgs 9)
- lint clean, dev server 200 on /

Stage Summary:
- FROZEN: prisma/schema.prisma (do not change), src/lib/vitta/* (types/format/api/use-resource/store/apps), src/components/vitta/ui/*, topbar, app-launcher, module-views, subscriptions exemplar, page.tsx, layout.tsx
- API contract: GET /api/{res} → {items}, POST → {item}, PATCH /api/{res}/{id} → {item}, DELETE → {ok:true}. Errors: {error} + status. List endpoints flatten relation names (customerName, employeeName, projectName, vendorName, productName, contactName).
- Number generation: count+1 padded 4 digits with prefixes SO/PO/MO/POS, INV/2025/xxxx
- Module files live in src/components/vitta/modules/{id}.tsx, default export, "use client"
---
Task ID: 2-d
Agent: service-apps
Task: Helpdesk, Timesheets, Manufacturing, Discuss, AI modules

Work Log:
- Read worklog + studied subscriptions exemplar, ui/ components (page-header, data-table, kanban, record-drawer, stat-card, status-badge), lib/vitta (use-resource, types, format, api) and prisma schema before writing
- helpdesk.tsx: 4 StatCards (open new+in_progress, high-priority open, solved %, unassigned), board default (new/in_progress/on_hold/resolved) + list tabs, board card w/ line-clamp-2 title, customer, priority badge, assignee initials avatar + "Nd ago" timeAgo helper, drawer (title, customer select from contacts?type=customer, 5-stage select incl. cancelled, priority, assignee from employees, description), category "helpdesk" fixed in payload
- timesheets.tsx: 4 StatCards (hours logged 7d, entries 7d + total sub, top logger name+hours, avg h/day 1 decimal), weekly summary panel above list (per-employee horizontal bars, /40h, brand fill, amber when >40), list-only view (employee avatar row, project hideSm, date, "Nh", description truncate max-w-xs), drawer (employeeId required, projectId optional "Internal", date, hours step 0.5, description)
- manufacturing.tsx: 4 StatCards (open MOs, in progress, done, delayed w/ rose tone via scheduledDate<today && open status), board (5 stages incl. cancelled) + list (mono number, product, qty, scheduled hideSm, assignee hideMd), board card w/ mono number, product, "N units", delayed date in rose + assignee avatar; bonus quick action on board: confirmed→"Start"→in_progress, in_progress→"Finish"→done (stopPropagation + toasts); drawer (productId from products, qty, 5-status select, scheduledDate, assignee optional)
- discuss.tsx: channels general/sales/support/marketing with Hash icons — desktop sidebar w-48 + mobile horizontal chip row, active state (default general), useResource<Message>("messages",{channel:active}) so hook refetches on channel change, setInterval 5000 reload cleared on unmount, auto-scroll to bottom (ref + useEffect scrollTop=scrollHeight), own messages (author===CURRENT_USER) right-aligned brand #714B67 white bubbles vs left white bordered bubbles, composer h-11 (44px) input + send icon button, disabled while empty, Enter submits (form), create then setItems append to keep chronological, fixed-height h-[calc(100vh-3rem)] chat layout with internal scroll
- ai.tsx: brand gradient band #714B67→#4C3247 with Sparkles + "Enterprise assistant · Beta" + inaccuracy disclaimer, welcome assistant message, 4 suggestion chips visible until first user message (click sends immediately), POST /api/ai/chat {messages: history.slice(-10)} (no system role ever sent), loading typing bubble with 3 animate-pulse dots, error → toast.error + optimistic user msg removed + input restored for retry, whitespace-pre-wrap text-sm bubbles, composer identical to Discuss
- Verification: bun run lint → 0 problems in my 5 files (only remaining project error is studio.tsx:33 set-state-in-effect, another agent's file); bunx tsc --noEmit filtered to modules/(helpdesk|timesheets|manufacturing|discuss|ai) → 0 errors; curl smoke tests to localhost:3000 unreachable from sandbox shell (connection refused, port 3000 not visible in this netns — server not started per rules); verified data instead via Prisma counts: tickets 12, timesheets 36, MOs 7, messages 9, employees 10, products 14, projects 6

Stage Summary:
- 5 modules written following the subscriptions exemplar: PageHeader + StatCards + DataTable/Kanban (+RecordDrawer) or chat layouts for Discuss/AI
- DEVIATION 1 (intentional): optional selects ("— No customer —", "— Unassigned —", "— Internal —") use sentinel value "__none__" mapped to null on save instead of empty string — Radix SelectItem throws at runtime on value="" (react-select dist line 823), which the frozen subscriptions exemplar currently hits with its value:"" option; my modules avoid that crash
- DEVIATION 2: helpdesk/manufacturing payloads narrow union-typed fields via `as Ticket["stage"]` / `as ManufacturingOrder["status"]` casts (systemic tsc strictness present in exemplar too; my files pass clean)
- DEVIATION 3: Discuss + AI use fixed h-[calc(100vh-3rem)] root (vs min-h in CRUD modules) so chat scrolls internally; composer error path shows toast.error (hook throws must be caught) though success sends remain toast-free per spec
- HTTP smoke test not possible from sandbox (dev server on 3000 not reachable from agent shell); /api/ai/chat built in parallel by lead — if 404 at runtime, module surfaces toast + keeps input, no crash
---
Task ID: 2-b
Agent: revenue-apps
Task: CRM, Sales, Purchase, POS modules

Work Log:
- Created shared src/components/vitta/modules/lines-editor.tsx: default-export LinesEditor({lines, onChange}) with string-valued {description,qty,price} rows, responsive grid (stacked on mobile, 5-col table on sm+), per-row fmtMoney total, add/remove row buttons, aria-labels; used by sales+purchase forms only.
- crm.tsx: resource "leads" (type Lead), default view board with 6 stages (new/qualified/proposition/negotiation/won/lost per spec colors). Kanban card: bold name + muted company, 3x Star priority row (amber-400 fill = priority), expectedRevenue semibold emerald-700 + contactName, footer ownerName + relative created date ("3d ago" helper). List: Lead/Contact(hideSm)/Expected Revenue/Priority stars/Stage badge/Owner(hideMd)/Created(hideMd). RecordDrawer with all spec fields; ownerName select fed by useResource<{id,name}>("employees") with "unassigned" sentinel (Radix Select forbids empty-string item values, so sentinel maps to null in payload). Stats: open pipeline (compact fmtMoney), won value, new leads, avg open deal. Kanban stage change -> update + toast `Moved to <Stage>`; search filters name/company/contactName.
- sales.tsx: resource "sales" (SaleOrder); list default + board (quotation/sent/sale/done/cancel). Custom right-side Sheet form (Sheet primitives copied from record-drawer): customer Select (contacts?type=customer, includes "both"-typed), date input prefilled via toDateInput(todayISO()) / toDateInput(item.date), status Select, notes Textarea, LinesEditor; footer shows live total (sum qty*price via fmtMoney) + delete/cancel/save. Submit -> create/update with {customerId, date: new Date(date).toISOString() || undefined, status, notes, lines:[{description, qty:Number, price:Number}]}; blank lines dropped. Row/board click opens prefilled edit sheet (lines mapped to strings). Stats: open quotations, orders to deliver, booked revenue (sale+done), avg order value. onStageChange -> update + toast.
- purchase.tsx: exact mirror for "purchases" (PurchaseOrder) with vendorId Select (contacts?type=vendor), title "Purchase", stages rfq/confirmed/received/cancel, stats RFQs open / confirmed awaiting receipt / purchased value (received) / avg PO value (non-cancel).
- pos.tsx: no kanban/drawer. PageHeader ("Point of Sale", product search filtering name/sku/category). Left product grid (2/3/4 cols) with category-hash colored top border from palette [#714B67,#00A88D,#F8931D,#31A3DD], 2-line clamp name, category, fmtMoney price, "In stock: n" badge (rose + disabled when 0). Right cart panel (lg:w-80, lg:sticky, stacks below on mobile): qty steppers (44px h-11 Plus/Minus buttons), trash remove, subtotal + GST 18% + bold total, 3 payment method buttons (Banknote/CreditCard/Smartphone), Charge button -> api.create("pos", {items, total, itemsCount, paymentMethod}) -> toast `Order <number> recorded` -> clear cart -> reload pos + products. Empty-cart state. Stats: today's sales, today's transactions, live cart items, GST 18%. "Recent sales" DataTable (Number mono, fmtDateTime, items, payment capitalized, total).
- Verified: bunx eslint on my 5 files -> 0 problems; bunx tsc --noEmit filtered to modules/(crm|sales|purchase|pos|lines-editor) -> 0 errors. Full-project `bun run lint` currently fails only in modules/studio.tsx (another agent's file, untouched). Port 3000 was not listening in this sandbox during verification (curl exit 7), so runtime endpoint smoke tests couldn't run — API routes owned by the parallel API agent; module code follows the frozen useResource/api contract exactly.

Stage Summary:
- Files written: src/components/vitta/modules/{crm,sales,purchase,pos,lines-editor}.tsx (only my owned files touched).
- Patterns reused: PageHeader/Tabs (list+board), StatCard row, DataTable Column<T> with hideSm/hideMd, Kanban KanbanStage + onStageChange toasts, RecordDrawer FieldDefs, useResource CRUD + error toasts, fmtMoney/fmtDate/toDateInput, StatusBadge from STATUS_STYLES.
- Decisions: Radix Select disallows empty SelectItem values -> "unassigned" sentinel for CRM owner; SaleOrder.date/PurchaseOrder.date are non-nullable in types so empty form date sends undefined (API coerces falsy -> null, same as spec's ||null); custom sales/purchase sheet keeps lines as strings in editor state and converts with Number() on submit; POS charge posts exactly {items,total,itemsCount,paymentMethod} per spec and clears cart + reloads orders/products.
---
Task ID: 2-e
Agent: productivity-apps
Task: Knowledge, Documents, Sign, Email, eCommerce, Planning, Field Service, Website, Studio

Work Log:
- Read worklog + studied exemplar subscriptions.tsx, ui/* (page-header, data-table, kanban, record-drawer, stat-card, status-badge, empty-state), lib/vitta/* (use-resource, types, format, api), apps.ts, module-views.tsx
- knowledge.tsx: card grid (pinned first, amber Pin/PinOff toggle via update), title bold + content line-clamp-3 + "Updated {fmtDate}" footer; stats Total/Pinned/Updated-this-week (7d); drawer title/content/pinned yes-no -> boolean in handleSave; search title+content
- documents.tsx: scrollable folder chip row (All + unique folders, active chip brand bg white text); file cards with kind icons (FileText pdf rose, FileSpreadsheet sheet emerald-600, FileImage image sky-500, FileText doc sky-700, Folder amber-500, Link2 link violet) in tinted squares, owner avatar, "{sizeKb} KB"; stats Total/Storage-MB/Folders/PDFs; drawer with kind select (6), folder select (8 base folders merged with existing), owner default CURRENT_USER, delete enabled
- sign.tsx: List + Cards views; stats Awaiting/Signed/Completion %; list action cell "Mark signed" (stopPropagation) -> update(id,{status:"signed"}) + toast "Document signed"; drawer name/signer/status, delete enabled
- email.tsx: stats Emails sent (sum recipients of sent), Avg open %, Avg click %, Drafts; columns Campaign (Mail icon + subject sub), Recipients fmtNumber, per-row open/click % (sent only), Sent hideSm, Status via inline map (draft stone / sent emerald); draft row Send button -> update(status:"sent") + toast "Campaign sent — stats will populate shortly"; drawer name/subject/status/recipients
- ecommerce.tsx: brand gradient hero (#714B67->#4C3247) "VITTA Store" + Powered-by chip; category chips + search; product cards with hashed accent strip (palette 714B67/00A88D/F8931D/31A3DD), price fmtMoney, stock chip (Out/Low/In, Service chip for services); stats Products/Out of stock/Avg price/Categories; drawer name/sku/category/price/qty/type (cost 0, unit Units defaults)
- planning.tsx: read-only Mon-Sun table from real employees (useResource "employees", departed filtered out); sticky first col (sticky left-0 bg-white w-40, Avatar + jobTitle); deterministic shift chips via charCodeSum(id)+dayIndex % 5 (Morning/Afternoon/Full day/Field/Off) with exact chip classes; today column border+highlight; legend; stats Active/Scheduled/Coverage %/On-shift today; header note "Week of ... auto-generated demo schedule"
- fieldservice.tsx: useResource<Ticket>("helpdesk", {category:"field"}); board default with custom stage labels To Schedule/On Site/Blocked/Completed (keys new,in_progress,on_hold,resolved) + same options in dropdown + StatusBadge map for list; cards MapPin + priority badge + assignee avatar; stats Open/High priority/Completed %/Technicians (unique assignees); drawer incl. locked category field (defaultValue "field") and category:"field" always in payload; delete enabled
- website.tsx: Page chip bar (Home/Features/Pricing/About/Contact) switches hero heading/sub + smooth-scrolls to anchors; mock browser chrome (3 dots + lock + vitta.example.com pill); nav w/ Building2 brand mark + Free demo CTA; hero with fake dashboard card (3 stat tiles + bar chart 40/65/50/80/60/90% brand-teal alternating); 6 feature cards (Users/Calculator/Boxes/UserCog/Factory/ShoppingCart); pricing 3 tiers (Starter 24000, Gold 98000 most-popular ring, Enterprise custom); brand CTA band; footer (c) 2025 VITTA Labs; Publish button -> toast "Website published (demo)"
- studio.tsx: lg:grid-cols-3 layout; left Apps card: all 24 APPS with AppIcon + Switch (default on), toggles persisted to localStorage "vitta.studio.disabled" via lazy useState initializer (loads storage, SSR-guarded) + toast.info "Visibility saved (applies to new sessions in this demo)"; right: License card (Enterprise/25 seats/Node-locked/Mar 2027/24-40 modules + proprietary notice), System card (VITTA 3.1.0/SQLite Prisma/Next.js 16/Asia-Kolkata), Danger zone rose outline Reset button -> toast.info
- Fixed TS2345/TS2322 in my files: cast union fields in payloads (kind/type/status/stage/priority/category as Ticket["x"] etc.) and used spread `{...item}` for drawer initial (interfaces lack index signature); removed unused lucide imports; fixed react-hooks/set-state-in-effect lint error in studio by moving localStorage read into lazy initializer
- Verified: `bun run lint` exit 0 (project-wide); `bunx tsc --noEmit` grep of my 9 module paths -> 0 errors; smoke-tested dev server (initially not listening, recovered): notes 5, documents 8, sign 4, campaigns 5, products 14, employees 10, helpdesk 12, helpdesk?category=field 5 all HTTP 200; PATCH /api/notes/{id} {pinned:true} -> 200 + reverted

Stage Summary:
- All 9 modules follow the subscriptions exemplar: "use client", default export, PageHeader + StatCards + views + RecordDrawer + sonner toasts, brand #714B67 accents, fmtMoney/fmtDate/fmtNumber/initials, aria-labels on icon buttons
- TS strict gotcha for future agents: useResource create/update take Partial<T> & Record<string, unknown>; pass fresh object-literal payloads and cast string -> union fields (e.g. `as Ticket["stage"]`); pass `{...item}` (not the interface instance) as RecordDrawer initial
- RecordDrawer FieldDef has no rows prop (textarea fixed at rows 3) — knowledge content textarea could not be set to rows 8 without editing frozen ui/record-drawer.tsx; deviation noted
- Planning shift mapping is deterministic (charCodeSum(employee.id) + dayIndex) % 5 so the demo board is stable across renders/sessions; board shows non-departed employees, coverage denominator = rows*7
- Studio stores only disabled app ids under localStorage key "vitta.studio.disabled"; load happens in useState initializer (client-only mount, no hydration risk since modules mount on user action)
- Dev server was momentarily down during smoke tests (parallel agents); recovered and all endpoints verified 200
---
Task ID: 2-c
Agent: ops-apps
Task: Inventory, Accounting, HR, Project modules

Work Log:
- Read worklog + studied frozen exemplars (subscriptions.tsx, ui/*, lib/vitta/*) before writing any code
- inventory.tsx: resource "products"; stats (total / stock value Σ qty*cost / low 0<qty<=10 amber / out qty==0 rose); List + Grid tabs; grid cards (name, mono SKU, price, colored stock chip, category) clickable → drawer; list columns Product(name+mono sku)/Category(hideSm)/Type badge (goods violet, service teal inline map)/Price/Cost(hideMd)/On hand(qty+unit colored)/Status chip; drawer fields per spec; search name/sku/category
- accounting.tsx: resource "invoices" + useResource("contacts"); Tabs Customer Invoices | Vendor Bills (client-side type filter, tab switch resets search); stats on customer invoices only (paid revenue, open receivables, overdue = posted && dueDate < startOfToday rose, draft total); List + Board (draft stone/posted amber/paid emerald); board card shows mono number, contactName, total, due date rose when overdue; onStageChange toasts "Invoice posted" / "Payment registered" / "Invoice moved to draft"; custom InvoiceSheet (Sheet primitives, local to file) with lines editor (state [{description,qty,price}] strings, add/remove rows, disabled remove on last row, live total); payload {type,contactId,date:iso,dueDate:iso|null,status,notes,lines:[{description,qty:Number,price:Number}]}
- hr.tsx: resources "employees" + "leaves"; Tabs Employees | Time Off (search + New button switch per tab); stats (active headcount, on leave, monthly payroll fmtMoney compact, pending approvals amber); employees grid default (Avatar initials bg-[#F3EDF2] text-[#714B67], jobTitle, department chip, status badge) + list toggle (Employee avatar+jobTitle sub / Department / Email hideSm / Salary hideMd / Status); employee drawer with 10-department select, hireDate toDateInput; time off board pending/approved/refused with on-card Approve (emerald outline) / Refuse (rose outline) quick actions (stopPropagation) + toasts, and list toggle (Employee/Type/From/To/Days hideSm/Status/Reason hideMd); leave drawer employeeId select, type, from/to required dates, days required, reason
- project.tsx: resources "projects" + "tasks" (+ employees for assignee names); stats (active projects, open tasks, completed tasks); projects grid cards (color dot, name, status badge, deadline fmtDate rose when past && active, open-task count computed from tasks where stage!=done) click → Tasks tab pre-filtered; custom ProjectSheet (local) with 6 color swatches (#714B67,#00A88D,#F8931D,#31A3DD,#7C2D5E,#FBB04E) aria-pressed ring selection; tasks board default todo/in_progress/review/done + list toggle; project filter chips row ("All projects" + per-project, selected = brand #714B67 bg); task card: title line-through muted when done, priority flag amber, project chip with color dot, assignee Avatar size-6, due date rose when past && stage!=done; task list Title/Project hideSm (dot+name)/Assignee (avatar+name)/Due/Priority (flag icon)/Stage; task drawer projectId select required (prefilled from active filter on new), stage, priority 0/1 Normal/High, assignee select of employee names, dueDate
- Fix pass: bunx tsc --noEmit errors in my files — RecordDrawer initial needs spread object literal (interfaces lack implicit index signature for Record<string,unknown>), InvoicePayload/ProjectPayload interfaces → type aliases, leave from/to null → "" fallback (LeaveRequest.from is required string)
- Verification: bun run lint clean (whole repo, zero findings); bunx tsc --noEmit filtered to my 4 files = zero errors (remaining repo errors are in seed.ts, skills/, examples/, frozen subscriptions exemplar, data-table.tsx — not mine); curl smoke tests: GET 200 for products/invoices/employees/leaves/projects/tasks/contacts; POST→DELETE round-trips OK for product, invoice with lines, leave, project, task; GET / 200

Stage Summary:
- 4 modules written strictly on the subscriptions exemplar skeleton: PageHeader(+search/refresh/New/Tabs) → StatCard row → DataTable/Kanban/grid views → RecordDrawer or custom Sheet → toast.success on every mutation, client-side search, hideSm/hideMd, fmtMoney/fmtDate everywhere, brand #714B67, aria-labels, no emojis
- Accounting and Project use custom in-file Sheet forms (InvoiceSheet with lines editor + live total; ProjectSheet with color swatch picker) since RecordDrawer FieldDef can't express them; all other forms use RecordDrawer
- Dates: toDateInput() on drawer initial, new Date(...).toISOString() on save; numbers via Number() conversion; booleans/ids null when empty
- TS gotcha documented: useResource create/update param is Partial<T> & Record<string,unknown> — inline spread literals or type aliases required, interfaces fail; statuses/stages cast to entity unions
- Kanban stage-change toasts use business labels (Invoice posted / Payment registered / Leave approved / Moved to <stage>)
- Deviations: none functional. Added a 3-card stat row to Project module (spec listed none but exemplar structure mandates StatCard row); inventory grid renders skeleton cards while loading (grid view not covered by DataTable/Kanban loading props)
---
Task ID: 2-f
Agent: icon-artist
Task: 24 hand-crafted SVG app icons

Work Log:
- Read worklog, placeholder app-icons.tsx and app-launcher.tsx usage (wrapper div supplies border/shadow; svg only needs white card + art)
- Rewrote src/components/vitta/icons/app-icons.tsx: kept "use client", cn import, exact export AppIcon({ id, className }), aria-hidden svg, white card rect x=3 y=3 w=42 h=42 rx=10
- Built Record<string, ReactElement> ICONS map with one <g> per app (24 ids verified against src/lib/vitta/apps.ts registry), generic 3x3 mauve/teal dot-grid FALLBACK for unknown ids
- Palette constants: plum #7C2D5E, mauve #9A5B8F, brand #714B67, teal #00A88D, sky #31A3DD, navy #23536B, orange #F8931D, gold #FBB04E, red #D9534F (+ green #2E7D6B only for helpdesk overlap)
- All shapes kept in the 9-39 coordinate band; layered shapes use opacity 0.8-0.95 for the Odoo overlap feel; strokes only on Sign squiggle/swoosh and Subscriptions refresh arcs (round linecaps, width 3.2-4); white fill used as "cutout" for wrench jaw, stopwatch face, card stripe, gear holes
- Verified: bun run lint clean; bunx tsc --noEmit → 0 errors mentioning app-icons

Stage Summary:
- accounting: gold coin + teal small coin + plum diagonal bar crossing them
- knowledge: plum rounded square behind teal bookmark ribbon
- sign: navy signature squiggle stroke with sky underline swoosh
- crm: wide plum funnel trapezoid with narrow teal stem overlapping at its base
- studio: teal screwdriver (handle/shaft/flat tip) crossed with plum ring-head wrench (white hole + jaw notch)
- subscriptions: orange top arc + teal bottom arc forming a refresh circle, each with a triangular arrowhead
- ai: plum letter A (notched triangle) beside orange rounded I bar
- pos: plum/orange striped scalloped shop awning over teal storefront with white door
- discuss: orange chat bubble with three white dots + small plum bubble with tail layered in front
- documents: tilted orange sheet behind a sky sheet with two white text lines
- project: teal checkmark offset behind a larger plum checkmark
- timesheets: sky stopwatch (top button + angled side nub), white face, orange hand from center dot
- fieldservice: gold lightning bolt offset behind plum lightning bolt
- planning: orange calendar card with white binder rings, two teal squares and teal play triangle poking past the edge
- helpdesk: green cross offset behind a teal medical cross
- ecommerce: plum shopping bag with arched handle cutout + gold tag dot
- website: sky half-annulus orbit arc behind teal globe with white latitude band
- email: sky paper plane with plum folded wing triangle
- purchase: teal coin with white ring behind plum credit card with white stripe + gold chip
- inventory: isometric 3D box — plum top, plum left face, orange right face
- manufacturing: toothed teal gear block with white square hole + orange square + smaller teal block overlapping
- sales: four ascending rounded bars (plum x3 with rising opacity + gold leader)
- hr: teal person (head + shoulders) behind orange person (head + shoulders)
- dashboard: 2x2 KPI tiles in plum/red/sky/teal
---
Task ID: 2-a
Agent: api-builder
Task: Build all remaining API CRUD routes (19 resources, 37 files) following the contacts exemplar

Work Log:
- Read worklog.md, frozen prisma/schema.prisma, and exemplar contacts routes; replicated their exact pattern (NextRequest, db from @/lib/db, try/catch, {items}/{item}/{ok:true})
- Created route files for: employees, leaves, leads, products, sales, purchases, invoices, projects, tasks, timesheets, helpdesk, manufacturing, subscriptions, campaigns, pos, notes, documents, sign (route.ts + [id]/route.ts each) and messages (route.ts only)
- POST: required-field 400s (Name/SKU/Customer/Vendor/Contact/Project/Employee/Title/Signer/Author/Content), Number(x||0) coercion, Math.round for Int fields, date fields new Date(x) if truthy else null (non-nullable dates fall back to Prisma default by omission)
- GET: ?q= SQLite contains on text fields incl. relation names (e.g. sales → customer.name), spec'd filters (status/type/stage/plan/category/priority/employeeId/projectId/assignee/limit), relation flattening (employeeName, projectName+projectColor, customerName, vendorName, contactName, productName) and computed total=Σ qty*price for sales/purchases/invoices (lines included)
- Number generation via count()+1 padded 4: SO/PO/MO/POS, INV/2025/xxxx; client-passed number honored; P2002 → 400 "Number already exists" / "SKU already exists" (+ products sku pre-check findUnique)
- PATCH: data built only from provided keys; lines replacement for sales/purchases/invoices inside db.$transaction (deleteMany + createMany + refetch with includes); campaigns PATCH stamps sentAt=now on draft→sent transition and simulates opens=recipients*(0.38+rand*0.15), clicks=opens*0.16 when opens===0&&recipients>0; sign PATCH stamps signedAt=now on to_sign→signed
- Error mapping in all [id] routes + FK creates: Prisma P2025 → 404 "Record not found", P2003 → 400 "Related record does not exist"; all handlers log `console.error("[METHOD] /api/{res} failed:", e)` with friendly 500
- Fixed 2 tsc errors: Employee and SignDoc models have no createdAt → employees ordered by name asc, sign by requestedAt desc
- Verification: `bunx eslint src/app/api` CLEAN; `bunx tsc --noEmit | grep src/app/api` → zero errors; started dev server temporarily (it was NOT running on port 3000 despite handoff note) for HTTP smoke tests, then stopped it and restored port state

Stage Summary:
- 37 route files created under src/app/api/{employees,leaves,leads,products,sales,purchases,invoices,projects,tasks,timesheets,helpdesk,manufacturing,subscriptions,campaigns,pos,notes,documents,sign,messages}
- Contract: GET ?filters → {items}, POST → 201 {item}, PATCH /:id → {item}, DELETE /:id → {ok:true}; messages has no [id] (GET ?channel=general asc limit 100, POST)
- pos: items stored as JSON string, parsed back to array in GET; ?limit=N default 30; notes ordered pinned desc then updatedAt desc; leaves/timesheets ordered date/from desc; orders+invoices ordered date desc
- HTTP smoke-tested end-to-end: flattening, totals, q/filters, SKU dup 400, FK P2003 400, P2025 404, validation 400s, sales lines replace, campaigns send simulation (opens 465/clicks 74 of 1000), sign signedAt auto-stamp; test rows cleaned up afterwards
---
Task ID: 3
Agent: lead (orchestrator)
Task: Dashboard + AI chat + exemplar bugfix + integration pass

Work Log:
- Fixed Radix Select crash: subscriptions exemplar used empty-string option value ("") — replaced with "__none__" sentinel + null mapping on save (agents 2-b/c/d adopted the sentinel independently)
- Created /api/ai/chat using z-ai-web-dev-sdk (backend only): system prompt = VITTA AI persona, last-12-turn context, thinking disabled, friendly errors
- Created /api/dashboard: aggregated stats (revenue/receivables/overdue/quotations/pipeline/headcount/tickets/stock/POS today), leadsByStage, salesByMonth (6 mo), recentActivity (8), lowStock
- Rewrote modules/dashboard.tsx: KPI cards, CSS bar chart (sales by month), CRM funnel bars, recent activity feed, inventory alerts, ops snapshot, quick-app links
- Fixed tsc errors: seed.ts pick() readonly, ai route role typing, data-table unused import, vitta-app appName null, subscriptions union casts; excluded scaffold examples/skills/mini-services from tsconfig
- Dev server persistence: processes die between Bash tool calls; fix = double-fork (setsid bun run dev &) — now survives
- Verified: lint 0 problems, tsc 0 errors, all 21 API endpoints 200, POST /api/ai/chat returns reply

Stage Summary:
- All 24 modules implemented, all APIs live, AI chat verified end-to-end
- Next: browser E2E verification of golden paths
---
Task ID: 4
Agent: lead (orchestrator)
Task: Browser E2E verification + polish fixes

Work Log:
- Added hash navigation (#/crm): refresh keeps module, browser back/forward works (store.ts + vitta-app.tsx, no extra routes)
- Fixed dashboard sales chart bars not rendering (% height needed sized parent)
- Fixed RecordDrawer Select controlled/uncontrolled warning (value ?? "")
- Browser-verified golden paths: launcher (24 apps + search + footer), CRM board + lead create + kanban stage change with toast, Sales custom lines form (SO0013, ₹4,46,000 math correct), POS cart→GST 18%→charge (POS0008 recorded), Dashboard KPIs/funnel/chart, VITTA AI real LLM reply, Discuss message send, Subscriptions customer select (Radix bug fixed) + create, Accounting/HR/Project/Planning/Website/Studio render
- Visited all 24 modules: zero crashes, zero error boundaries
- Mobile 390px: launcher 3-col grid, tables collapse via hideSm/hideMd, POS cart stacks
- Final: eslint 0 problems, tsc 0 errors, dev.log clean, server 200

Stage Summary:
- VITTA ERP complete: 24 Odoo-style apps on one route, 21 REST endpoints, SQLite via Prisma, proprietary branding throughout
- E2E verified in real browser (Chromium via agent-browser)
