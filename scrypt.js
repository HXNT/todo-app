"use strict";

const STORAGE_KEY = "todo-tasks";

// Ссылки на элементы DOM
const taskInput    = document.getElementById("taskInput");
const addBtn       = document.getElementById("addBtn");
const taskList     = document.getElementById("taskList");
const emptyState   = document.getElementById("emptyState");
const countLabel   = document.getElementById("countLabel");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const errorMsg     = document.getElementById("errorMsg");
const filterBtns   = document.querySelectorAll(".filter-btn");

let currentFilter = "all";

// === Работа с LocalStorage ===
function getTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function setTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// === Отрисовка одной задачи ===
function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = `task-item${task.done ? " done" : ""}`;

  li.innerHTML = `
    <input type="checkbox" class="task-check" ${task.done ? "checked" : ""} />
    <span class="task-title">${escapeHtml(task.title)}</span>
    <button class="delete-btn">&times;</button>
  `;

  // Обработчик клика на чекбокс
  li.querySelector(".task-check").addEventListener("change", () => {
    toggleTask(task.id);
  });

  // Обработчик удаления
  li.querySelector(".delete-btn").addEventListener("click", () => {
    deleteTask(task.id);
  });

  return li;
}

// === Обновление интерфейса списка ===
function render() {
  const allTasks = getTasks();
  let filteredTasks = allTasks;

  if (currentFilter === "active") filteredTasks = allTasks.filter(t => !t.done);
  if (currentFilter === "done") filteredTasks = allTasks.filter(t => t.done);

  taskList.innerHTML = "";

  if (filteredTasks.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
    filteredTasks.forEach(task => {
      taskList.appendChild(createTaskElement(task));
    });
  }

  updateFooter(allTasks);
}

// === Обновление счетчиков внизу ===
function updateFooter(allTasks) {
  const activeCount = allTasks.filter(t => !t.done).length;
  const doneCount = allTasks.length - activeCount;

  countLabel.textContent = `Активных: ${activeCount} · Завершённых: ${doneCount}`;
  
  // Показываем кнопку очистки только если есть завершенные задачи
  if (doneCount > 0) {
    clearDoneBtn.classList.remove("hidden");
  } else {
    clearDoneBtn.classList.add("hidden");
  }
}

// === Логика манипуляции данными ===
function addTask() {
  const title = taskInput.value.trim();
  if (!title) {
    errorMsg.textContent = "Название задачи не может быть пустым";
    return;
  }
  errorMsg.textContent = "";

  const tasks = getTasks();
  tasks.push({
    id: Date.now(),
    title: title,
    done: false
  });
  
  setTasks(tasks);
  taskInput.value = "";
  render();
}

function toggleTask(id) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    setTasks(tasks);
    render();
  }
}

function deleteTask(id) {
  const tasks = getTasks().filter(t => t.id !== id);
  setTasks(tasks);
  render();
}

function clearDone() {
  const tasks = getTasks().filter(t => !t.done);
  setTasks(tasks);
  render();
}

// === Безопасность (экранирование HTML) ===
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// === Добавление событий ===
addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});

clearDoneBtn.addEventListener("click", clearDone);

// Первый запуск при загрузке страницы
render();