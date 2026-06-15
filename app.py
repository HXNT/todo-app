from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

DATA_FILE = "tasks.json"

def load_tasks():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_tasks(tasks):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    tasks = load_tasks()
    filter_type = request.args.get("filter", "all")
    if filter_type == "active":
        tasks = [t for t in tasks if not t["done"]]
    elif filter_type == "done":
        tasks = [t for t in tasks if t["done"]]
    return jsonify(tasks)

@app.route("/api/tasks", methods=["POST"])
def add_task():
    data = request.get_json()
    if not data or not data.get("title", "").strip():
        return jsonify({"error": "Название задачи не может быть пустым"}), 400
    tasks = load_tasks()
    task = {
        "id": int(datetime.now().timestamp() * 1000),
        "title": data["title"].strip(),
        "done": False,
        "created_at": datetime.now().isoformat()
    }
    tasks.append(task)
    save_tasks(tasks)
    return jsonify(task), 201

@app.route("/api/tasks/<int:task_id>", methods=["PATCH"])
def toggle_task(task_id):
    tasks = load_tasks()
    for task in tasks:
        if task["id"] == task_id:
            task["done"] = not task["done"]
            save_tasks(tasks)
            return jsonify(task)
    return jsonify({"error": "Задача не найдена"}), 404

@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    tasks = load_tasks()
    new_tasks = [t for t in tasks if t["id"] != task_id]
    if len(new_tasks) == len(tasks):
        return jsonify({"error": "Задача не найдена"}), 404
    save_tasks(new_tasks)
    return jsonify({"ok": True})

@app.route("/api/tasks/clear-done", methods=["DELETE"])
def clear_done():
    tasks = load_tasks()
    tasks = [t for t in tasks if not t["done"]]
    save_tasks(tasks)
    return jsonify({"ok": True})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
