# 🌿 LeaveFlow – Employee Leave Management

A modern, interactive **Employee Leave Management** web application built with plain **HTML, CSS and JavaScript**. No frameworks, no build step, no backend: all data is stored in the browser's **localStorage**, and the app ships with sample employees and leave requests so you can demo it right away.

## ✨ Features

### 👤 Employee view
- **Switch between sample employees** with the "Signed in as" selector.
- **Leave balance cards** for each leave type, showing days left, days used, days pending and a progress bar.
- **Apply for leave**: pick a leave type, start/end dates and a reason.
  - Working days are calculated live (weekends are excluded).
  - Validation covers missing dates, invalid ranges, insufficient balance and overlap with existing pending or approved leave.
- **Leave history** with status badges (Pending / Approved / Rejected / Cancelled), manager comments and a status filter.
- **Cancel** your own pending requests.

### 📊 Manager dashboard
- **Statistics**: total requests, pending, approved, rejected, employees on leave today, approved leave days and approval rate.
- **Charts**: approved days by leave type and requests by department.
- **Requests table** that you can filter by **status** (chips with live counts) and **leave type**, plus a free-text **search** (employee, department, reason or request ID).
- **Approve / Reject** pending requests through a confirmation dialog with an optional comment for the employee.

### 💾 Data
- Everything is saved in `localStorage`, so changes are kept after a page refresh.
- **↺ Reset demo data** restores the original sample data.
- Sample request dates are generated relative to today, so the demo always has past, current and upcoming leave.

## 🗂️ Project structure

```
employee-leave-manage/
├── index.html        # App layout: header, employee view, manager dashboard, modal
├── css/
│   └── styles.css    # Modern responsive styling (cards, badges, charts, modal, toasts)
├── js/
│   ├── data.js       # Leave types, sample employees, sample requests, date helpers
│   ├── storage.js    # localStorage wrapper (load, save, seed, reset)
│   └── app.js        # UI rendering, form validation, approvals, filters, statistics
└── README.md
```

## 🏷️ Leave types & annual allowances

| Leave type     | Allowance (working days) |
|----------------|--------------------------|
| Annual Leave   | 20                       |
| Sick Leave     | 10                       |
| Casual Leave   | 7                        |
| Parental Leave | 30                       |
| Unpaid Leave   | No limit                 |

Allowances are defined in `js/data.js` (`LEAVE_TYPES`) and you can change them there.

## 👥 Sample employees

| ID   | Name         | Department  | Role               |
|------|--------------|-------------|--------------------|
| E001 | Aarav Sharma | Engineering | Senior Developer   |
| E002 | Priya Nair   | Engineering | QA Engineer        |
| E003 | Rahul Verma  | Sales       | Account Executive  |
| E004 | Sneha Iyer   | Marketing   | Content Strategist |
| E005 | Vikram Singh | Finance     | Financial Analyst  |
| E006 | Ananya Gupta | HR          | HR Specialist      |

The app includes 14 sample leave requests across all statuses.

## 🚀 Running locally

### Prerequisites
- A modern web browser (Edge, Chrome, Firefox or Safari).
- Optional: [Git](https://git-scm.com/), plus Python 3, Node.js or VS Code if you want to use a local web server.

### 1. Get the code
```bash
git clone https://github.com/techbliss1/employee-leave-manage.git
cd employee-leave-manage
```
Or download the ZIP from GitHub (**Code → Download ZIP**) and extract it.

### 2. Run the app (choose one option)

**Option A: Open the file directly**
Double-click `index.html` to open it in your browser.

**Option B: Python's built-in web server**
```bash
python -m http.server 8080
```
Then open <http://localhost:8080>.

**Option C: Node.js**
```bash
npx serve .
```
Then open the URL printed in the terminal.

**Option D: VS Code Live Server**
Install the *Live Server* extension, right-click `index.html` and choose **Open with Live Server**.

## 🧭 Demo walkthrough
1. In the **Employee** view, choose an employee and review their leave balances and history.
2. Submit a new leave request. Its status will show as **Pending**.
3. Switch to **Manager Dashboard**, filter by **Pending** and approve or reject the request with a comment.
4. Switch back to the employee. The updated status, manager comment and balance are shown.
5. Click **↺ Reset demo data** at any time to start over.

## 🔧 Customization
- **Add employees**: edit `SAMPLE_EMPLOYEES` in `js/data.js`, then click **Reset demo data**.
- **Change leave types or allowances**: edit `LEAVE_TYPES` in `js/data.js`.
- **Theme colours**: update the CSS variables in the `:root` section of `css/styles.css`.

## ⚠️ Notes
- This is a demonstration app. Data is stored only in your browser and is not shared between browsers or devices.
- Clearing your browser's site data also clears the app data. It will be re-seeded with the sample data on the next load.
- Working days exclude Saturdays and Sundays. Public holidays are not taken into account.

## 📄 License
MIT. You are free to use and modify this project.
