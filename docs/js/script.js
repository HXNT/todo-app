"use strict";

const STORAGE_KEY = "todo-tasks";

// === DOM refs ===
const taskInput    = document.getElementById("taskInput");
const addBtn       = document.getElementById("addBtn");
const taskList     = document.getElementById("taskList");
const emptyState   = document.getElementById("emptyState");
const countLabel   = document.getElementById("countLabel");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const errorMsg     = document.getElementById("errorMsg");
const filterBtns   = document.querySelectorAll(".filter-btn");

let currentFilter = "all";

// === Storage helpers ===
function getTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
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

function renderList() {
  const all = getTasks();
  let tasks = all;

  if (currentFilter === "active") tasks = all.filter(t => !t.done);
  if (currentFilter === "done")   tasks = all.filter(t =>  t.done);

  taskList.innerHTML = "";

  if (tasks.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
    tasks.forEach(t => taskList.appendChild(renderTask(t)));
  }

  updateFooter(all);
}

function updateFooter(all) {
  const active = all.filter(t => !t.done).length;
  const done   = all.filter(t =>  t.done).length;

  if (currentFilter === "all") {
    countLabel.textContent = `${active} активн${pluralRu(active, ["ая", "ых", "ых"])} · ${done} завершён${pluralRu(done, ["а", "о", "о"])}`;
  } else if (currentFilter === "active") {
    countLabel.textContent = `${active} активн${pluralRu(active, ["ая", "ых", "ых"])}`;
  } else {
    countLabel.textContent = `${done} завершён${pluralRu(done, ["а", "о", "о"])}`;
  }

  clearDoneBtn.classList.toggle("hidden", done === 0);
}

// === Actions ===
function addTask() {
  const title = taskInput.value.trim();
  if (!title) {
    showError("Введите название задачи");
    taskInput.focus();
    return;
  }
  clearError();

  const tasks = getTasks();
  tasks.push({
    id: Date.now(),
    title,
    done: false,
    created_at: new Date().toISOString(),
  });
  setTasks(tasks);

  taskInput.value = "";
  renderList();
}

function toggleTask(id, li) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.done = !task.done;
  setTasks(tasks);

  if (currentFilter !== "all") {
    li.classList.add("removing");
    setTimeout(renderList, 250);
  } else {
    li.classList.toggle("done", task.done);
    li.querySelector(".task-check").checked = task.done;
    updateFooter(tasks);
  }
}

function deleteTask(id, li) {
  li.classList.add("removing");
  setTimeout(() => {
    const tasks = getTasks().filter(t => t.id !== id);
    setTasks(tasks);
    renderList();
  }, 250);
}

function clearDone() {
  const tasks = getTasks().filter(t => !t.done);
  setTasks(tasks);
  renderList();
}

// === Utilities ===
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
    renderList();
  });
});

clearDoneBtn.addEventListener("click", clearDone);

// === Init ===
renderList();
