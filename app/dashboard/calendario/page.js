"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "../../../components/AppShell";
import { Badge, Card, SectionHeader, KPICard, StatusDot } from "../../../components/shared";
import { COLORS, mono } from "../../../lib/colors";
import { useSession } from "../../../lib/SessionContext";
import { toYMD, todayPT } from "../../../lib/dateUtils";

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const typeColor = {
  "tarefa":    { bg: COLORS.amberDim, text: COLORS.amber },
  "reunião":   { bg: COLORS.blueDim,  text: COLORS.blue  },
  "urgente":   { bg: COLORS.coralDim, text: COLORS.coral  },
  "expedição": { bg: COLORS.greenDim, text: COLORS.green  },
};

const typeBadgeColor = {
  "tarefa":    COLORS.amber,
  "urgente":   COLORS.coral,
  "expedição": COLORS.green,
  "reunião":   COLORS.blue,
};

const TASK_TYPES  = ["tarefa", "urgente", "expedição", "reunião"];
const TASK_ROLES  = ["logistica", "gestor", "admin"];

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(monday) {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  if (monday.getMonth() === sunday.getMonth()) {
    return `${monday.getDate()} — ${sunday.getDate()} ${months[monday.getMonth()]} ${monday.getFullYear()}`;
  }
  return `${monday.getDate()} ${months[monday.getMonth()]} — ${sunday.getDate()} ${months[sunday.getMonth()]} ${monday.getFullYear()}`;
}

const PT_MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const inputStyle = {
  width: "100%", padding: "8px 10px", fontSize: 13,
  background: COLORS.elevated, border: `1px solid ${COLORS.border}`,
  borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box",
};

const labelStyle = { fontSize: 12, color: COLORS.textMuted, display: "block", marginBottom: 4 };

function ModalOverlay({ onClose, children }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 16, padding: 28, width: 440, maxWidth: "92vw",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {children}
      </div>
    </div>
  );
}

function UserTasksPopup({ user: u, tasks, taskDone, onToggle, onSave, onDelete, onClose }) {
  const userTasks = tasks
    .filter(t => t.assignee && (t.assignee === String(u.id) || t.assignee === `user-${u.id}`))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));

  const [editing, setEditing]   = useState(null); // task id
  const [editVals, setEditVals] = useState({});
  const [saving, setSaving]     = useState(false);

  function startEdit(task) {
    setEditing(task.id);
    setEditVals({ title: task.title, date: task.date, time: task.time || "", type: task.type, priority: task.priority });
  }

  async function saveEdit(taskId) {
    setSaving(true);
    await onSave(taskId, editVals);
    setSaving(false);
    setEditing(null);
  }

  return (
    <ModalOverlay onClose={onClose}>
      {/* cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>{u.name}</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
            {u.role} · {userTasks.length} tarefa{userTasks.length !== 1 ? "s" : ""}
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      {userTasks.length === 0 && (
        <div style={{ fontSize: 13, color: COLORS.textMuted }}>Sem tarefas atribuídas.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {userTasks.map(task => {
          const done = taskDone[task.id] ?? task.done;
          const isEditing = editing === task.id;
          return (
            <div key={task.id} style={{
              border: `1px solid ${isEditing ? COLORS.teal : COLORS.border}`,
              borderRadius: 10, overflow: "hidden",
              background: done ? "transparent" : COLORS.elevated,
              transition: "border-color 0.15s",
            }}>
              {/* linha principal */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
                {/* checkbox */}
                <div
                  onClick={() => onToggle(task.id, !done)}
                  style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${done ? COLORS.green : COLORS.borderHover}`,
                    background: done ? COLORS.green : "transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s",
                  }}
                >
                  {done && <span style={{ fontSize: 9, color: COLORS.bg, fontWeight: 700 }}>✓</span>}
                </div>
                {/* título + data */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500, color: done ? COLORS.textDim : (task.priority === "urgent" ? COLORS.coral : COLORS.text),
                    textDecoration: done ? "line-through" : "none",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>
                    {task.date} {task.time && `· ${task.time}`}
                  </div>
                </div>
                {/* badge tipo */}
                <Badge color={typeBadgeColor[task.type] || COLORS.textMuted}>{task.type}</Badge>
                {/* acções */}
                <button
                  onClick={() => isEditing ? setEditing(null) : startEdit(task)}
                  title="Editar"
                  style={{ background: "none", border: "none", cursor: "pointer", color: isEditing ? COLORS.teal : COLORS.textMuted, fontSize: 14, padding: "0 4px", lineHeight: 1 }}
                >✎</button>
                <button
                  onClick={() => onDelete(task.id)}
                  title="Eliminar"
                  style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.coral, fontSize: 14, padding: "0 4px", lineHeight: 1 }}
                >✕</button>
              </div>

              {/* formulário inline de edição */}
              {isEditing && (
                <div style={{ padding: "0 12px 12px", borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input
                      style={inputStyle}
                      value={editVals.title}
                      onChange={e => setEditVals(v => ({ ...v, title: e.target.value }))}
                      placeholder="Título"
                      autoFocus
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <input type="date" style={inputStyle} value={editVals.date} onChange={e => setEditVals(v => ({ ...v, date: e.target.value }))} />
                      <input type="time" style={inputStyle} value={editVals.time} onChange={e => setEditVals(v => ({ ...v, time: e.target.value }))} />
                      <select style={inputStyle} value={editVals.type} onChange={e => setEditVals(v => ({ ...v, type: e.target.value }))}>
                        {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => saveEdit(task.id)}
                        disabled={saving}
                        style={{ flex: 1, padding: "7px 0", fontSize: 12, fontWeight: 600, background: COLORS.teal, color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
                      >{saving ? "A guardar…" : "Guardar"}</button>
                      <button
                        onClick={() => setEditing(null)}
                        style={{ padding: "7px 14px", fontSize: 12, color: COLORS.textMuted, background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 7, cursor: "pointer" }}
                      >Cancelar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ModalOverlay>
  );
}

export default function DashboardCalendario() {
  const user     = useSession();
  const todayYmd = todayPT();                       // "YYYY-MM-DD" em hora PT, DST automático
  const today    = new Date(todayYmd + "T00:00:00"); // Date local para cálculos de semana

  const [weekStart, setWeekStart] = useState(getMondayOf(today));
  const [tasks, setTasks]         = useState([]);
  const [events, setEvents]       = useState([]);
  const [taskDone, setTaskDone]   = useState({});
  const [activeUsers, setActiveUsers] = useState([]);

  // Modal: criar tarefa
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [createErr, setCreateErr]   = useState("");
  const blankTask = { title: "", date: toYMD(today), time: "09:00", type: "tarefa", role: user?.role || "logistica", priority: "normal", assigneeId: "" };
  const [form, setForm] = useState(blankTask);

  // Popup tarefas por utilizador
  const [selectedUser, setSelectedUser] = useState(null);

  // Modal: atribuir tarefa
  const [showAssign, setShowAssign] = useState(false);
  const [assigning, setAssigning]   = useState(false);
  const [assignErr, setAssignErr]   = useState("");
  const blankAssign = { title: "", date: toYMD(today), time: "09:00", type: "tarefa", role: "logistica", priority: "normal", assigneeId: "" };
  const [assignForm, setAssignForm] = useState(blankAssign);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const fetchTasks = useCallback(() => {
    if (!user) return;
    const url = user.role === "admin" ? "/api/tasks" : `/api/tasks?role=${user.role}`;
    fetch(url).then(r => r.ok ? r.json() : null).then(data => {
      if (!data) return;
      setTasks(data);
      setTaskDone(data.reduce((acc, t) => ({ ...acc, [t.id]: t.done }), {}));
    });
  }, [user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    const from = toYMD(weekStart);
    const to   = toYMD(new Date(weekStart.getTime() + 6 * 86400000));
    fetch(`/api/events?from=${from}&to=${to}`).then(r => r.ok ? r.json() : null).then(d => d && setEvents(d));
  }, [weekStart]);

  useEffect(() => {
    fetch("/api/users").then(r => r.ok ? r.json() : null).then(data => {
      if (data) setActiveUsers(data.filter(u => u.active));
    });
  }, []);

  const allItems = [
    ...tasks.map(t  => ({ ...t,  _key: `task-${t.id}`  })),
    ...events.map(e => ({ ...e,  _key: `event-${e.id}` })),
  ];

  const filteredTasks = tasks.filter(t => {
    if (user?.role === "admin") return true;
    return t.role === user?.role;
  });

  const todayTasks = filteredTasks.filter(t => t.date === todayYmd);

  // KPI counts
  const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
  const thisWeekTasks = tasks.filter(t => {
    const d = new Date(t.date);
    return d >= weekStart && d < weekEnd;
  });
  const kpiToday     = filteredTasks.filter(t => t.date === todayYmd).length;
  const kpiUnassigned = tasks.filter(t => !t.assignee).length;
  const kpiLate      = tasks.filter(t => !t.done && t.date < todayYmd).length;
  const kpiDoneWeek  = thisWeekTasks.filter(t => t.done || taskDone[t.id]).length;

  async function handleCreate(e) {
    e.preventDefault();
    setCreateErr("");
    if (!form.title.trim()) { setCreateErr("Título obrigatório"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, assigneeId: form.assigneeId || null }),
      });
      if (!res.ok) { setCreateErr("Erro ao criar tarefa"); return; }
      setShowCreate(false);
      setForm(blankTask);
      fetchTasks();
    } catch {
      setCreateErr("Erro de ligação");
    } finally {
      setCreating(false);
    }
  }

  async function handleAssign(e) {
    e.preventDefault();
    setAssignErr("");
    if (!assignForm.title.trim()) { setAssignErr("Título obrigatório"); return; }
    if (!assignForm.assigneeId)   { setAssignErr("Escolhe um operador"); return; }
    setAssigning(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...assignForm }),
      });
      if (!res.ok) { setAssignErr("Erro ao atribuir tarefa"); return; }
      setShowAssign(false);
      setAssignForm(blankAssign);
      fetchTasks();
    } catch {
      setAssignErr("Erro de ligação");
    } finally {
      setAssigning(false);
    }
  }

  async function handleToggleTask(taskId, done) {
    setTaskDone(prev => ({ ...prev, [taskId]: done }));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    fetchTasks();
  }

  async function handleSaveTask(taskId, fields) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    fetchTasks();
  }

  async function handleDeleteTask(taskId) {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    fetchTasks();
  }


  return (
    <AppShell activeTab="calendario">

      {/* Modal: criar tarefa */}
      {showCreate && (
        <ModalOverlay onClose={() => setShowCreate(false)}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: 0 }}>Nova tarefa</h2>
          </div>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Título *</label>
              <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Descrição da tarefa" autoFocus />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Data *</label>
                <input type="date" style={inputStyle} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Hora</label>
                <input type="time" style={inputStyle} value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Tipo</label>
                <select style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Prioridade</label>
                <select style={inputStyle} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Papel (role)</label>
                <select style={inputStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {TASK_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Atribuir a</label>
                <select style={inputStyle} value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
                  <option value="">— sem atribuição —</option>
                  {activeUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            {createErr && <div style={{ fontSize: 12, color: COLORS.coral }}>{createErr}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button type="submit" disabled={creating} style={{
                flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600,
                background: COLORS.teal, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
                opacity: creating ? 0.6 : 1,
              }}>
                {creating ? "A criar…" : "Criar tarefa"}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} style={{
                padding: "9px 18px", fontSize: 13, color: COLORS.textMuted,
                background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer",
              }}>
                Cancelar
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* Modal: atribuir tarefa a operador */}
      {showAssign && (
        <ModalOverlay onClose={() => setShowAssign(false)}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: 0 }}>Atribuir tarefa</h2>
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>Cria uma tarefa e atribui-a directamente a um operador.</p>
          </div>
          <form onSubmit={handleAssign} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Operador *</label>
              <select style={inputStyle} value={assignForm.assigneeId} onChange={e => setAssignForm(f => ({ ...f, assigneeId: e.target.value }))} autoFocus>
                <option value="">— escolher operador —</option>
                {activeUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Título *</label>
              <input style={inputStyle} value={assignForm.title} onChange={e => setAssignForm(f => ({ ...f, title: e.target.value }))} placeholder="Descrição da tarefa" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Data *</label>
                <input type="date" style={inputStyle} value={assignForm.date} onChange={e => setAssignForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Hora</label>
                <input type="time" style={inputStyle} value={assignForm.time} onChange={e => setAssignForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Tipo</label>
                <select style={inputStyle} value={assignForm.type} onChange={e => setAssignForm(f => ({ ...f, type: e.target.value }))}>
                  {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Papel (role)</label>
                <select style={inputStyle} value={assignForm.role} onChange={e => setAssignForm(f => ({ ...f, role: e.target.value }))}>
                  {TASK_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            {assignErr && <div style={{ fontSize: 12, color: COLORS.coral }}>{assignErr}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button type="submit" disabled={assigning} style={{
                flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600,
                background: COLORS.teal, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
                opacity: assigning ? 0.6 : 1,
              }}>
                {assigning ? "A atribuir…" : "Atribuir tarefa"}
              </button>
              <button type="button" onClick={() => setShowAssign(false)} style={{
                padding: "9px 18px", fontSize: 13, color: COLORS.textMuted,
                background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer",
              }}>
                Cancelar
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* Grid mestre — 4 colunas, alinha KPIs + calendário + tarefas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        <KPICard title="Tarefas hoje"           value={kpiToday}      delay={0}   />
        <KPICard title="Por atribuir"           value={kpiUnassigned} delay={60}  />
        <KPICard title="Em atraso"              value={kpiLate}        delay={120} />
        <KPICard title="Concluídas esta semana" value={kpiDoneWeek}    delay={180} />

      {/* Calendário — colunas 1-3 */}{/* Tarefas — coluna 4 — dentro do mesmo div de grid */}
        {/* Calendário semanal — colunas 1-3 */}
        <Card delay={240} style={{ gridColumn: "1 / 4", minWidth: 0, overflow: "hidden" }}>
          {/* Navegação */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; })}
                style={{ padding: "6px 10px", fontSize: 13, color: COLORS.textMuted, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer" }}
              >← Anterior</button>
              <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.text }}>{formatWeekLabel(weekStart)}</span>
              <button
                onClick={() => setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; })}
                style={{ padding: "6px 10px", fontSize: 13, color: COLORS.textMuted, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer" }}
              >Seguinte →</button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "6px 12px", fontSize: 12, color: COLORS.text, background: COLORS.elevated, border: `1px solid ${COLORS.borderHover}`, borderRadius: 8, cursor: "pointer" }}>Semana</button>
              <button style={{ padding: "6px 12px", fontSize: 12, color: COLORS.textMuted, background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer" }}>Mês</button>
              <a
                href="/api/cal/ical?token=demo"
                download="nexusops-calendario.ics"
                style={{ padding: "6px 12px", fontSize: 12, color: COLORS.blue, background: COLORS.blueDim, border: `1px solid ${COLORS.blue}30`, borderRadius: 8, cursor: "pointer", textDecoration: "none" }}
              >+ iCal</a>
            </div>
          </div>

          {/* Grid 7 colunas */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 }}>
            {weekDays.map((day, i) => {
              const ymd = toYMD(day);
              const isToday = ymd === todayYmd;
              const dayEvents = allItems.filter(e => e.date === ymd);

              return (
                <div
                  key={ymd}
                  style={{
                    minHeight: 100, padding: "8px 6px",
                    border: `1px solid ${isToday ? COLORS.blue : COLORS.border}`,
                    background: isToday ? COLORS.blueDim : "transparent",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                    {DIAS_SEMANA[i]}
                  </div>
                  <div style={{ fontSize: 14, fontFamily: mono, fontWeight: 700, color: isToday ? COLORS.blue : COLORS.text, marginBottom: 6 }}>
                    {day.getDate()}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {dayEvents.map(ev => {
                      const tc = typeColor[ev.type] || { bg: COLORS.elevated, text: COLORS.textMuted };
                      return (
                        <div
                          key={ev._key}
                          style={{
                            padding: "2px 5px", borderRadius: 4,
                            background: tc.bg, color: tc.text,
                            fontSize: 11, lineHeight: 1.4,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}
                        >
                          {ev.time} {ev.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legenda */}
          <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
            {[
              { label: "Tarefa",    color: COLORS.amber },
              { label: "Reunião",   color: COLORS.blue  },
              { label: "Urgente",   color: COLORS.coral  },
              { label: "Expedição", color: COLORS.green  },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Tarefas do dia — coluna 4 */}
        <Card delay={300} style={{ gridColumn: "4 / 5" }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>Tarefas de hoje</h3>
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>
              {`${PT_MONTHS[today.getMonth()].slice(0, 3)}, ${today.getDate()} ${PT_MONTHS[today.getMonth()]} — ${todayTasks.length} tarefas`}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {todayTasks.length === 0 && (
              <div style={{ fontSize: 13, color: COLORS.textMuted }}>Sem tarefas para hoje.</div>
            )}
            {todayTasks.map(task => (
              <div
                key={task.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 0",
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
              >
                <div
                  onClick={() => setTaskDone(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                  style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                    border: `1.5px solid ${taskDone[task.id] ? COLORS.green : COLORS.borderHover}`,
                    background: taskDone[task.id] ? COLORS.green : "transparent",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s",
                  }}
                >
                  {taskDone[task.id] && <span style={{ fontSize: 10, color: COLORS.bg, fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: task.priority === "urgent" ? COLORS.coral : COLORS.text }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 3 }}>
                    {taskDone[task.id] ? `concluída ${task.time}` : `prazo ${task.time}`}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={{ fontSize: 11, fontFamily: mono, color: COLORS.textDim }}>{task.time}</span>
                  <Badge color={typeBadgeColor[task.type] || COLORS.textMuted}>{task.type}</Badge>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setForm({ ...blankTask }); setCreateErr(""); setShowCreate(true); }}
            style={{
              marginTop: 14, width: "100%", padding: "8px 0",
              fontSize: 13, fontWeight: 500, color: COLORS.teal,
              background: COLORS.tealDim, border: `1px solid ${COLORS.teal}30`,
              borderRadius: 8, cursor: "pointer",
            }}
          >
            + Criar tarefa
          </button>
        </Card>

      {/* Popup tarefas por utilizador */}
      {selectedUser && (
        <UserTasksPopup
          user={selectedUser}
          tasks={tasks}
          taskDone={taskDone}
          onToggle={handleToggleTask}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* 3. Atribuição de tarefas (só admin) — linha completa */}
      {user?.role === "admin" && (
        <Card delay={360} style={{ gridColumn: "1 / -1" }}>
          <SectionHeader title="Atribuição de tarefas" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {activeUsers.length === 0 && (
              <div style={{ fontSize: 13, color: COLORS.textMuted }}>Sem operadores activos.</div>
            )}
            {activeUsers.map(u => {
              const count = tasks.filter(t => t.assignee && (t.assignee === String(u.id) || t.assignee === `user-${u.id}`) && !taskDone[t.id]).length;
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 8,
                    borderBottom: `1px solid ${COLORS.border}`,
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.elevated}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <StatusDot color={COLORS.green} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</span>
                    <span style={{ fontSize: 11, color: COLORS.textDim, marginLeft: 8 }}>{u.role}</span>
                  </div>
                  <span style={{ fontSize: 13, fontFamily: mono, fontWeight: 600, color: COLORS.text }}>{count}</span>
                  <span style={{ fontSize: 11, color: COLORS.textDim }}>›</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => { setAssignForm({ ...blankAssign }); setAssignErr(""); setShowAssign(true); }}
            style={{
              marginTop: 14, width: "100%", padding: "8px 0",
              fontSize: 13, fontWeight: 500, color: COLORS.teal,
              background: COLORS.tealDim, border: `1px solid ${COLORS.teal}30`,
              borderRadius: 8, cursor: "pointer",
            }}
          >
            + Atribuir tarefa a operador
          </button>
        </Card>
      )}

      </div>{/* fim grid mestre */}
    </AppShell>
  );
}
