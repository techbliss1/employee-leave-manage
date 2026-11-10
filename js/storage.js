/**
 * storage.js – Thin wrapper around browser localStorage.
 * All application state is persisted under versioned keys so the demo
 * data can be reset at any time.
 */

const Storage = (() => {
  const KEYS = {
    employees: "leaveflow.v1.employees",
    requests: "leaveflow.v1.requests",
    currentEmployee: "leaveflow.v1.currentEmployee",
    view: "leaveflow.v1.view"
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      console.warn("LeaveFlow: unable to read", key, err);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn("LeaveFlow: unable to write", key, err);
    }
  }

  /** Seeds sample data on first run (or when data is missing/corrupt). */
  function init() {
    const employees = read(KEYS.employees, null);
    const requests = read(KEYS.requests, null);
    if (!Array.isArray(employees) || !Array.isArray(requests)) {
      seed();
    }
  }

  function seed() {
    write(KEYS.employees, SAMPLE_EMPLOYEES);
    write(KEYS.requests, buildSampleRequests());
    write(KEYS.currentEmployee, SAMPLE_EMPLOYEES[0].id);
  }

  return {
    init,
    reset: seed,
    getEmployees: () => read(KEYS.employees, []),
    getRequests: () => read(KEYS.requests, []),
    saveRequests: (list) => write(KEYS.requests, list),
    getCurrentEmployee: () => read(KEYS.currentEmployee, null),
    setCurrentEmployee: (id) => write(KEYS.currentEmployee, id),
    getView: () => read(KEYS.view, "employee"),
    setView: (v) => write(KEYS.view, v)
  };
})();
