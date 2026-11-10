/**
 * data.js – Sample demonstration data for LeaveFlow.
 * Dates for sample requests are generated relative to "today" so the demo
 * always shows a realistic mix of past, current and upcoming leave.
 */

const LEAVE_TYPES = [
  { id: "annual", name: "Annual Leave", allowance: 20, color: "#4f46e5", icon: "🏖️" },
  { id: "sick", name: "Sick Leave", allowance: 10, color: "#dc2626", icon: "🤒" },
  { id: "casual", name: "Casual Leave", allowance: 7, color: "#0891b2", icon: "☕" },
  { id: "parental", name: "Parental Leave", allowance: 30, color: "#db2777", icon: "👶" },
  { id: "unpaid", name: "Unpaid Leave", allowance: null, color: "#64748b", icon: "📄" } // null = no limit
];

const SAMPLE_EMPLOYEES = [
  { id: "E001", name: "Aarav Sharma", department: "Engineering", role: "Senior Developer", color: "#4f46e5" },
  { id: "E002", name: "Priya Nair", department: "Engineering", role: "QA Engineer", color: "#0891b2" },
  { id: "E003", name: "Rahul Verma", department: "Sales", role: "Account Executive", color: "#16a34a" },
  { id: "E004", name: "Sneha Iyer", department: "Marketing", role: "Content Strategist", color: "#db2777" },
  { id: "E005", name: "Vikram Singh", department: "Finance", role: "Financial Analyst", color: "#d97706" },
  { id: "E006", name: "Ananya Gupta", department: "HR", role: "HR Specialist", color: "#7c3aed" }
];

/** Returns an ISO date (YYYY-MM-DD) offset by `days` from today (local time). */
function relDate(days) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Builds the initial set of sample leave requests. */
function buildSampleRequests() {
  // [employeeId, typeId, startOffset, endOffset, reason, status, appliedOffset, comment]
  const rows = [
    ["E001", "annual", -40, -36, "Family trip to Goa", "Approved", -55, "Enjoy your holiday!"],
    ["E001", "sick", -15, -14, "Fever and cold", "Approved", -15, "Get well soon."],
    ["E001", "casual", 9, 9, "Personal errand – bank and passport office", "Pending", -1, ""],
    ["E002", "annual", 14, 18, "Sister's wedding", "Pending", -3, ""],
    ["E002", "casual", -22, -22, "Home maintenance appointment", "Rejected", -25, "Release deadline that day, please reschedule."],
    ["E003", "annual", -5, 2, "Vacation in Kerala", "Approved", -30, "Approved. Please hand over client accounts."],
    ["E003", "unpaid", 30, 34, "Extended personal travel", "Pending", -2, ""],
    ["E004", "parental", -10, 19, "Paternity / parental care", "Approved", -40, "Congratulations!"],
    ["E005", "sick", -3, -2, "Dental surgery recovery", "Approved", -4, ""],
    ["E005", "annual", 21, 25, "Year-end break", "Pending", 0, ""],
    ["E006", "casual", -60, -60, "Moving house", "Approved", -70, ""],
    ["E006", "annual", 4, 6, "Attending a friend's graduation", "Rejected", -6, "Quarterly reviews scheduled, sorry."],
    ["E002", "sick", -1, -1, "Migraine", "Pending", -1, ""],
    ["E004", "casual", -80, -80, "Personal day", "Cancelled", -85, ""]
  ];

  return rows.map((r, i) => {
    let [employeeId, type, s, e, reason, status, applied, comment] = r;
    // Shift ranges that start on a weekend to the next weekday so every
    // sample request contains at least one working day.
    while (isWeekend(relDate(s))) { s++; e++; }
    const startDate = relDate(s);
    const endDate = relDate(e);
    return {
      id: "LR" + String(1001 + i),
      employeeId,
      type,
      startDate,
      endDate,
      days: countWorkingDays(startDate, endDate),
      reason,
      status,
      appliedOn: relDate(applied),
      managerComment: comment,
      decidedOn: status === "Approved" || status === "Rejected" ? relDate(Math.min(applied + 1, 0)) : null
    };
  });
}

/** True if the ISO date falls on Saturday or Sunday. */
function isWeekend(iso) {
  const day = new Date(iso + "T12:00:00").getDay();
  return day === 0 || day === 6;
}

/** Counts working days (Mon–Fri) between two ISO dates, inclusive. */
function countWorkingDays(startIso, endIso) {
  const start = new Date(startIso + "T12:00:00");
  const end = new Date(endIso + "T12:00:00");
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  let count = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}
