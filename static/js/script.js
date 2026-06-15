"use strict";

const API = "/api/tasks";

// === DOM refs ===
const taskInput   = document.getElementById("taskInput");
const addBtn      = document.getElementById("addBtn");
const taskList    = document.getElementById("taskList");
const emptyState  = document.getElementById("emptyState");
const countLabel  = document.getElementById("countLabel");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const errorMsg    = document.getElementById("errorMsg");
const filterBtns  = document.querySelectorAll(".filter-btn");

let currentFilter = "all";

// === API helpers ===
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Ошибка сервера");
  }
  return res.json();
}

// === Render ===
function renderTask(task) {
  const li = document.createElement("li");
  li.className = `task-item${task.done ? " done" : ""}`;
  li.dataset.id = task.id;

  li.innerHTML = `
    <input
      type="checkbox"
      class="task-check"
      id="check-${task.id}"
      ${task.done ? "checked" : ""}
      aria-label="Отметить задачу"
    />
    <label class="task-title" for="check-${task.id}">${escapeHtml(task.title)}</label>
    <button class="delete-btn" aria-label="Удалить задачу">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </button>
  `;

  
  li.querySelector(".task-check").addEventListener("change", () => toggleTask(task.id, li));

  
  li.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id, li));

  return li;
}

async function loadTasks() {
  try {
    const tasks = await apiFetch(`${API}?filter=${currentFilter}`);
    taskList.innerHTML = "";

    if (tasks.length === 0) {
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
      tasks.forEach(t => taskList.appendChild(renderTask(t)));
    }

    updateFooter(tasks);
  } catch (e) {
    showError("Не удалось загрузить задачи: " + e.message);
  }
}

function updateFooter(tasks) {
  const active = tasks.filter(t => !t.done).length;
  const done   = tasks.filter(t =>  t.done).length;

  if (currentFilter === "all") {
    countLabel.textContent = `${active} активн${pluralRu(active, ["ая", "ых", "ых"])} · ${done} завершён${pluralRu(done, ["а", "о", "о"])}`;
  } else if (currentFilter === "active") {
    countLabel.textContent = `${active} активн${pluralRu(active, ["ая", "ых", "ых"])}`;
  } else {
    countLabel.textContent = `${done} завершён${pluralRu(done, ["а", "о", "о"])}`;
  }

  if (done > 0) {
    clearDoneBtn.classList.remove("hidden");
  } else {
    clearDoneBtn.classList.add("hidden");
  }
}

// === Actions ===
async function addTask() {
  const title = taskInput.value.trim();
  if (!title) {
    showError("Введите название задачи");
    taskInput.focus();
    return;
  }
  clearError();
  addBtn.disabled = true;
  try {
    await apiFetch(API, { method: "POST", body: JSON.stringify({ title }) });
    taskInput.value = "";
    if (currentFilter === "done") {
      
    } else {
      await loadTasks();
    }
    
    if (currentFilter === "done") await loadTasks();
  } catch (e) {
    showError(e.message);
  } finally {
    addBtn.disabled = false;
  }
}

async function toggleTask(id, li) {
  try {
    const updated = await apiFetch(`${API}/${id}`, { method: "PATCH" });
    if (updated.done) {
      li.classList.add("done");
      li.querySelector(".task-check").checked = true;
    } else {
      li.classList.remove("done");
      li.querySelector(".task-check").checked = false;
    }

    
    if (currentFilter !== "all") {
      setTimeout(() => {
        li.classList.add("removing");
        setTimeout(() => loadTasks(), 250);
      }, 300);
    } else {
      
      const tasks = await apiFetch(`${API}?filter=all`);
      updateFooter(tasks);
    }
  } catch (e) {
    showError("Не удалось обновить задачу");
    li.querySelector(".task-check").checked = !li.querySelector(".task-check").checked;
  }
}

async function deleteTask(id, li) {
  li.classList.add("removing");
  try {
    await apiFetch(`${API}/${id}`, { method: "DELETE" });
    setTimeout(() => {
      li.remove();
      checkEmpty();
    }, 250);
    // refresh footer
    const tasks = await apiFetch(`${API}?filter=all`);
    updateFooter(tasks);
  } catch (e) {
    li.classList.remove("removing");
    showError("Не удалось удалить задачу");
  }
}

async function clearDone() {
  clearDoneBtn.disabled = true;
  try {
    await apiFetch(`${API}/clear-done`, { method: "DELETE" });
    await loadTasks();
  } catch (e) {
    showError("Ошибка при удалении завершённых задач");
  } finally {
    clearDoneBtn.disabled = false;
  }
}

// === Utilities ===
function checkEmpty() {
  if (taskList.children.length === 0) {
    emptyState.classList.remove("hidden");
  }
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add("visible");
  setTimeout(clearError, 3500);
}

function clearError() {
  errorMsg.classList.remove("visible");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pluralRu(n, forms) {
  // forms = [one, few, many]
  const mod10 = n % 10, mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

// === Event listeners ===
addBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    loadTasks();
  });
});

clearDoneBtn.addEventListener("click", clearDone);

// === Init ===
loadTasks();
