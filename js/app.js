/**
 * app.js – UI logic for LeaveFlow (Employee view + Manager dashboard).
 */
(function () {
  "use strict";

  // ---------- State ----------
  const state = {
    view: "employee",
    employeeId: null,
    historyFilter: "All",
    statusFilter: "All",
    typeFilter: "All",
    search: "",
    pendingDecision: null // { id, action }
  };

  // ---------- Helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const escapeHtml = (str) =>
    String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const typeById = (id) => LEAVE_TYPES.find((t) => t.id === id) || { name: id, color: "#64748b", icon: "📄" };
  const employeeById = (id) => Storage.getEmployees().find((e) => e.id === id);
  const initials = (name) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }
  function formatRange(a, b) {
    return a === b ? formatDate(a) : `${formatDate(a)} → ${formatDate(b)}`;
  }
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  function toast(message, kind = "info") {
    const el = document.createElement("div");
    el.className = `toast ${kind}`;
    el.textContent = message;
    $("#toastContainer").appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  /** Leave balance summary for one employee & type. */
  function getBalance(employeeId, typeId) {
    const type = typeById(typeId);
    const reqs = Storage.getRequests().filter((r) => r.employeeId === employeeId && r.type === typeId);
    const used = reqs.filter((r) => r.status === "Approved").reduce((s, r) => s + r.days, 0);
    const pending = reqs.filter((r) => r.status === "Pending").reduce((s, r) => s + r.days, 0);
    const allowance = type.allowance;
    const available = allowance === null ? Infinity : Math.max(allowance - used - pending, 0);
    return { allowance, used, pending, available };
  }

  // ---------- View switching ----------
  function setView(view) {
    state.view = view;
    Storage.setView(view);
    $$(".role-btn").forEach((b) => {
      const active = b.dataset.view === view;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", active);
    });
    $("#employeeView").classList.toggle("active", view === "employee");
    $("#managerView").classList.toggle("active", view === "manager");
    render();
  }

  function render() {
    if (state.view === "employee") renderEmployeeView();
    else renderManagerView();
  }

  // =====================================================
  // EMPLOYEE VIEW
  // =====================================================
  function populateEmployeeSelect() {
    const sel = $("#employeeSelect");
    sel.innerHTML = Storage.getEmployees()
      .map((e) => `<option value="${e.id}">${escapeHtml(e.name)}</option>`)
      .join("");
    sel.value = state.employeeId;
  }

  function populateLeaveTypes() {
    $("#leaveType").innerHTML = LEAVE_TYPES.map((t) => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join("");
    $("#typeFilter").innerHTML =
      `<option value="All">All leave types</option>` +
      LEAVE_TYPES.map((t) => `<option value="${t.id}">${t.name}</option>`).join("");
  }

  function renderEmployeeView() {
    const emp = employeeById(state.employeeId);
    if (!emp) return;
    $("#employeeSelect").value = emp.id;
    const avatar = $("#empAvatar");
    avatar.textContent = initials(emp.name);
    avatar.style.background = emp.color;
    $("#empMeta").textContent = `${emp.id} · ${emp.role} · ${emp.department}`;

    renderBalances(emp.id);
    renderHistory(emp.id);
    updateDayPreview();
  }

  function renderBalances(employeeId) {
    $("#balanceGrid").innerHTML = LEAVE_TYPES.map((t) => {
      const b = getBalance(employeeId, t.id);
      if (b.allowance === null) {
        return `<div class="balance-card" style="--c:${t.color}">
          <div class="label">${t.icon} ${t.name}</div>
          <div class="value">${b.used} <span>days taken</span></div>
          <div class="progress"><div style="width:0%"></div></div>
          <div class="foot">No limit · ${b.pending} pending</div>
        </div>`;
      }
      const pct = Math.min(((b.used + b.pending) / b.allowance) * 100, 100);
      return `<div class="balance-card" style="--c:${t.color}">
        <div class="label">${t.icon} ${t.name}</div>
        <div class="value">${b.available} <span>/ ${b.allowance} left</span></div>
        <div class="progress"><div style="width:${pct}%"></div></div>
        <div class="foot">${b.used} used · ${b.pending} pending</div>
      </div>`;
    }).join("");
  }

  function renderHistory(employeeId) {
    const list = Storage.getRequests()
      .filter((r) => r.employeeId === employeeId)
      .filter((r) => state.historyFilter === "All" || r.status === state.historyFilter)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));

    const container = $("#historyList");
    if (!list.length) {
      container.innerHTML = `<p class="empty">No leave requests found.</p>`;
      return;
    }
    container.innerHTML = list.map((r) => {
      const t = typeById(r.type);
      return `<div class="history-item" style="--c:${t.color}">
        <div class="row">
          <h4>${t.icon} ${t.name} <span class="muted small">· ${r.id}</span></h4>
          <span class="badge ${r.status}">${r.status}</span>
        </div>
        <div class="row">
          <span class="dates">${formatRange(r.startDate, r.endDate)} · ${plural(r.days, "working day")}</span>
          <span class="muted small">Applied ${formatDate(r.appliedOn)}</span>
        </div>
        <p class="reason">${escapeHtml(r.reason)}</p>
        ${r.managerComment ? `<p class="comment">💬 Manager: ${escapeHtml(r.managerComment)}</p>` : ""}
        ${r.status === "Pending" ? `<div class="row" style="justify-content:flex-end;margin-top:.5rem">
          <button class="btn btn-ghost btn-sm" data-cancel="${r.id}">Cancel request</button></div>` : ""}
      </div>`;
    }).join("");
  }

  function updateDayPreview() {
    const start = $("#startDate").value;
    const end = $("#endDate").value;
    const box = $("#dayPreview");
    box.classList.remove("warn");
    if (!start || !end) {
      box.textContent = "Select dates to calculate working days.";
      return;
    }
    if (end < start) {
      box.textContent = "End date must be on or after the start date.";
      box.classList.add("warn");
      return;
    }
    const days = countWorkingDays(start, end);
    const b = getBalance(state.employeeId, $("#leaveType").value);
    const avail = b.available === Infinity ? "unlimited" : `${b.available} available`;
    box.textContent = `${plural(days, "working day")} requested (${avail}). Weekends are excluded.`;
    if (days === 0 || days > b.available) box.classList.add("warn");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = $("#formError");
    err.textContent = "";

    const type = $("#leaveType").value;
    const startDate = $("#startDate").value;
    const endDate = $("#endDate").value;
    const reason = $("#reason").value.trim();

    if (!startDate || !endDate) return (err.textContent = "Please select both a start and end date.");
    if (endDate < startDate) return (err.textContent = "End date must be on or after the start date.");
    const days = countWorkingDays(startDate, endDate);
    if (days === 0) return (err.textContent = "The selected range contains no working days.");
    if (reason.length < 3) return (err.textContent = "Please provide a reason (at least 3 characters).");

    const bal = getBalance(state.employeeId, type);
    if (days > bal.available) {
      return (err.textContent = `Insufficient balance: ${days} days requested but only ${bal.available} available.`);
    }

    const requests = Storage.getRequests();
    const overlap = requests.find(
      (r) =>
        r.employeeId === state.employeeId &&
        (r.status === "Pending" || r.status === "Approved") &&
        r.startDate <= endDate &&
        r.endDate >= startDate
    );
    if (overlap) {
      return (err.textContent = `These dates overlap with request ${overlap.id} (${formatRange(overlap.startDate, overlap.endDate)}).`);
    }

    const nextNum = requests.reduce((m, r) => Math.max(m, parseInt(r.id.replace(/\D/g, ""), 10) || 0), 1000) + 1;
    requests.push({
      id: "LR" + nextNum,
      employeeId: state.employeeId,
      type,
      startDate,
      endDate,
      days,
      reason,
      status: "Pending",
      appliedOn: relDate(0),
      managerComment: "",
      decidedOn: null
    });
    Storage.saveRequests(requests);

    $("#leaveForm").reset();
    $("#startDate").min = "";
    toast(`Leave request LR${nextNum} submitted for ${plural(days, "day")}.`, "success");
    renderEmployeeView();
  }

  function cancelRequest(id) {
    if (!confirm("Cancel this pending leave request?")) return;
    const requests = Storage.getRequests();
    const req = requests.find((r) => r.id === id);
    if (!req || req.status !== "Pending") return;
    req.status = "Cancelled";
    req.decidedOn = relDate(0);
    Storage.saveRequests(requests);
    toast(`Request ${id} cancelled.`);
    renderEmployeeView();
  }

  // =====================================================
  // MANAGER VIEW
  // =====================================================
  function renderManagerView() {
    const requests = Storage.getRequests();
    renderStats(requests);
    renderCharts(requests);
    renderStatusCounts(requests);
    renderRequestTable(requests);
  }

  function renderStats(requests) {
    const count = (s) => requests.filter((r) => r.status === s).length;
    const today = relDate(0);
    const onLeaveToday = new Set(
      requests.filter((r) => r.status === "Approved" && r.startDate <= today && r.endDate >= today).map((r) => r.employeeId)
    ).size;
    const approvedDays = requests.filter((r) => r.status === "Approved").reduce((s, r) => s + r.days, 0);
    const decided = count("Approved") + count("Rejected");
    const approvalRate = decided ? Math.round((count("Approved") / decided) * 100) : 0;

    const stats = [
      { icon: "📨", num: requests.length, lbl: "Total requests", bg: "#eef0ff" },
      { icon: "⏳", num: count("Pending"), lbl: "Pending review", bg: "#fef3c7" },
      { icon: "✅", num: count("Approved"), lbl: "Approved", bg: "#dcfce7" },
      { icon: "❌", num: count("Rejected"), lbl: "Rejected", bg: "#fee2e2" },
      { icon: "🏝️", num: onLeaveToday, lbl: "On leave today", bg: "#e0f2fe" },
      { icon: "📆", num: approvedDays, lbl: "Approved leave days", bg: "#fce7f3" },
      { icon: "📈", num: approvalRate + "%", lbl: "Approval rate", bg: "#ede9fe" }
    ];
    $("#statsGrid").innerHTML = stats.map((s) => `<div class="stat">
      <div class="icon" style="--bg-c:${s.bg}">${s.icon}</div>
      <div><div class="num">${s.num}</div><div class="lbl">${s.lbl}</div></div>
    </div>`).join("");
  }

  function barChart(el, rows) {
    const max = Math.max(1, ...rows.map((r) => r.value));
    el.innerHTML = rows.map((r) => `<div class="bar-row">
      <span>${r.label}</span>
      <div class="bar-track"><div class="bar-fill" style="--c:${r.color}" data-w="${(r.value / max) * 100}"></div></div>
      <span class="val">${r.value}</span>
    </div>`).join("");
    // animate after paint
    requestAnimationFrame(() => el.querySelectorAll(".bar-fill").forEach((b) => (b.style.width = b.dataset.w + "%")));
  }

  function renderCharts(requests) {
    const approved = requests.filter((r) => r.status === "Approved");
    barChart(
      $("#typeChart"),
      LEAVE_TYPES.map((t) => ({
        label: `${t.icon} ${t.name.replace(" Leave", "")}`,
        value: approved.filter((r) => r.type === t.id).reduce((s, r) => s + r.days, 0),
        color: t.color
      }))
    );

    const palette = ["#4f46e5", "#0891b2", "#16a34a", "#db2777", "#d97706", "#7c3aed"];
    const depts = [...new Set(Storage.getEmployees().map((e) => e.department))];
    barChart(
      $("#deptChart"),
      depts.map((d, i) => ({
        label: d,
        value: requests.filter((r) => employeeById(r.employeeId)?.department === d).length,
        color: palette[i % palette.length]
      }))
    );
  }

  function renderStatusCounts(requests) {
    $$("#statusFilters .chip").forEach((chip) => {
      const s = chip.dataset.status;
      const n = s === "All" ? requests.length : requests.filter((r) => r.status === s).length;
      chip.innerHTML = `${s}<span class="count">${n}</span>`;
      chip.classList.toggle("active", s === state.statusFilter);
    });
  }

  function renderRequestTable(requests) {
    const q = state.search.toLowerCase();
    const statusOrder = { Pending: 0, Approved: 1, Rejected: 2, Cancelled: 3 };
    const rows = requests
      .filter((r) => state.statusFilter === "All" || r.status === state.statusFilter)
      .filter((r) => state.typeFilter === "All" || r.type === state.typeFilter)
      .filter((r) => {
        if (!q) return true;
        const emp = employeeById(r.employeeId);
        return [emp?.name, emp?.department, r.reason, r.id].some((v) => (v || "").toLowerCase().includes(q));
      })
      .sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.startDate.localeCompare(b.startDate));

    $("#emptyRequests").classList.toggle("hidden", rows.length > 0);
    $("#requestBody").innerHTML = rows.map((r) => {
      const emp = employeeById(r.employeeId) || { name: r.employeeId, department: "", color: "#64748b" };
      const t = typeById(r.type);
      const actions = r.status === "Pending"
        ? `<div class="actions">
             <button class="btn btn-sm btn-approve" data-decide="approve" data-id="${r.id}">Approve</button>
             <button class="btn btn-sm btn-reject" data-decide="reject" data-id="${r.id}">Reject</button>
           </div>`
        : `<span class="muted small" title="${escapeHtml(r.managerComment)}">${r.decidedOn ? formatDate(r.decidedOn) : "—"}</span>`;
      return `<tr>
        <td><div class="emp-cell"><div class="avatar sm" style="background:${emp.color}">${initials(emp.name)}</div>
          <div><div class="name">${escapeHtml(emp.name)}</div><div class="muted small">${escapeHtml(emp.department)}</div></div></div></td>
        <td>${t.icon} ${t.name}</td>
        <td>${formatRange(r.startDate, r.endDate)}</td>
        <td>${r.days}</td>
        <td class="reason-cell" title="${escapeHtml(r.reason)}">${escapeHtml(r.reason)}</td>
        <td>${formatDate(r.appliedOn)}</td>
        <td><span class="badge ${r.status}">${r.status}</span></td>
        <td>${actions}</td>
      </tr>`;
    }).join("");
  }

  // ---------- Approve / reject modal ----------
  function openDecision(id, action) {
    const req = Storage.getRequests().find((r) => r.id === id);
    if (!req) return;
    const emp = employeeById(req.employeeId);
    const t = typeById(req.type);
    const bal = getBalance(req.employeeId, req.type);
    state.pendingDecision = { id, action };

    $("#modalTitle").textContent = action === "approve" ? "Approve leave request" : "Reject leave request";
    $("#modalDetails").innerHTML = `
      <div><span>Request</span><strong>${req.id}</strong></div>
      <div><span>Employee</span><strong>${escapeHtml(emp?.name)}</strong></div>
      <div><span>Type</span><strong>${t.icon} ${t.name}</strong></div>
      <div><span>Dates</span><strong>${formatRange(req.startDate, req.endDate)}</strong></div>
      <div><span>Working days</span><strong>${req.days}</strong></div>
      <div><span>Balance used</span><strong>${bal.allowance === null ? "No limit" : `${bal.used} / ${bal.allowance}`}</strong></div>
      <div><span>Reason</span><strong>${escapeHtml(req.reason)}</strong></div>`;
    $("#managerComment").value = "";
    const btn = $("#modalConfirm");
    btn.textContent = action === "approve" ? "✔ Approve" : "✖ Reject";
    btn.className = `btn ${action === "approve" ? "btn-primary" : "btn-danger"}`;
    $("#modal").classList.remove("hidden");
    $("#managerComment").focus();
  }

  function closeModal() {
    $("#modal").classList.add("hidden");
    state.pendingDecision = null;
  }

  function confirmDecision() {
    const d = state.pendingDecision;
    if (!d) return;
    const requests = Storage.getRequests();
    const req = requests.find((r) => r.id === d.id);
    if (req && req.status === "Pending") {
      req.status = d.action === "approve" ? "Approved" : "Rejected";
      req.managerComment = $("#managerComment").value.trim();
      req.decidedOn = relDate(0);
      Storage.saveRequests(requests);
      toast(`Request ${req.id} ${req.status.toLowerCase()}.`, d.action === "approve" ? "success" : "error");
    }
    closeModal();
    renderManagerView();
  }

  // ---------- Event wiring ----------
  function bindEvents() {
    $$(".role-btn").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));

    $("#employeeSelect").addEventListener("change", (e) => {
      state.employeeId = e.target.value;
      Storage.setCurrentEmployee(state.employeeId);
      $("#formError").textContent = "";
      renderEmployeeView();
    });

    $("#leaveForm").addEventListener("submit", handleSubmit);
    ["#startDate", "#endDate", "#leaveType"].forEach((s) => $(s).addEventListener("change", updateDayPreview));
    $("#startDate").addEventListener("change", (e) => {
      $("#endDate").min = e.target.value;
      if (!$("#endDate").value || $("#endDate").value < e.target.value) $("#endDate").value = e.target.value;
      updateDayPreview();
    });

    $("#historyFilter").addEventListener("change", (e) => {
      state.historyFilter = e.target.value;
      renderHistory(state.employeeId);
    });
    $("#historyList").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cancel]");
      if (btn) cancelRequest(btn.dataset.cancel);
    });

    $("#statusFilters").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      state.statusFilter = chip.dataset.status;
      renderManagerView();
    });
    $("#typeFilter").addEventListener("change", (e) => {
      state.typeFilter = e.target.value;
      renderManagerView();
    });
    $("#searchBox").addEventListener("input", (e) => {
      state.search = e.target.value;
      renderRequestTable(Storage.getRequests());
    });
    $("#requestBody").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-decide]");
      if (btn) openDecision(btn.dataset.id, btn.dataset.decide);
    });

    $("#modalCancel").addEventListener("click", closeModal);
    $("#modalConfirm").addEventListener("click", confirmDecision);
    $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

    $("#resetDemo").addEventListener("click", () => {
      if (!confirm("Reset all data to the original sample data? Your changes will be lost.")) return;
      Storage.reset();
      state.employeeId = Storage.getCurrentEmployee();
      state.statusFilter = state.typeFilter = state.historyFilter = "All";
      state.search = "";
      $("#searchBox").value = "";
      $("#historyFilter").value = "All";
      $("#typeFilter").value = "All";
      populateEmployeeSelect();
      render();
      toast("Demo data restored.", "success");
    });
  }

  // ---------- Init ----------
  function init() {
    Storage.init();
    const employees = Storage.getEmployees();
    const saved = Storage.getCurrentEmployee();
    state.employeeId = employees.some((e) => e.id === saved) ? saved : employees[0].id;
    populateEmployeeSelect();
    populateLeaveTypes();
    bindEvents();
    setView(Storage.getView() === "manager" ? "manager" : "employee");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
