"use client";

import { useState, useEffect } from "react";
import { COLORS, mono } from "../lib/colors";
import { TASKS } from "../lib/mockData";
import { SectionHeader, Badge } from "./shared";

const typeBadgeColor = {
  "tarefa":    COLORS.amber,
  "urgente":   COLORS.coral,
  "expedição": COLORS.green,
  "reunião":   COLORS.blue,
};

export default function TasksWidget({ role, max = 3 }) {
  const [tasks, setTasks] = useState(
    (role === "admin" ? TASKS : TASKS.filter(t => t.role === role)).slice(0, max)
  );
  const [done, setDone] = useState(() =>
    TASKS.reduce((acc, t) => ({ ...acc, [t.id]: t.done }), {})
  );

  useEffect(() => {
    const url = role === "admin" ? "/api/tasks" : `/api/tasks?role=${role}`;
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setTasks(data.filter(t => !t.done).slice(0, max));
        setDone(data.reduce((acc, t) => ({ ...acc, [t.id]: t.done }), {}));
      });
  }, [role, max]);

  async function toggleDone(task) {
    const newDone = !done[task.id];
    setDone(prev => ({ ...prev, [task.id]: newDone }));
    setTasks(prev => prev.filter(t => t.id !== task.id || !newDone));

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: newDone }),
      });
    } catch {
      // fallback silencioso — o estado local já actualizou
    }
  }

  return (
    <div>
      <SectionHeader title="Próximas tarefas" />
      {tasks.length === 0 ? (
        <div style={{ fontSize: 13, color: COLORS.textMuted }}>Sem tarefas pendentes.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tasks.map(task => (
            <div
              key={task.id}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 0",
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <div
                onClick={() => toggleDone(task)}
                style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: `1.5px solid ${done[task.id] ? COLORS.green : COLORS.borderHover}`,
                  background: done[task.id] ? COLORS.green : "transparent",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                {done[task.id] && <span style={{ fontSize: 10, color: COLORS.bg, fontWeight: 700 }}>✓</span>}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, color: task.priority === "urgent" ? COLORS.coral : COLORS.text }}>
                  {task.title}
                </span>
              </div>

              <span style={{ fontSize: 11, fontFamily: mono, color: COLORS.textDim, flexShrink: 0 }}>
                {task.time}
              </span>

              <Badge color={typeBadgeColor[task.type] || COLORS.textMuted}>
                {task.type}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
