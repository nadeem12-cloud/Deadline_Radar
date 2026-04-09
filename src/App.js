import { useState, useEffect } from "react";
import "./App.css";

const SAMPLE_DEADLINES = [
  {
    id: 1,
    subject: "DAA Assignment 3 - Graph Algorithms",
    course: "Design & Analysis of Algorithms",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    source: "prof.sharma@mbpit.ac.in",
    priority: "critical",
    notified: false,
  },
  {
    id: 2,
    subject: "Microprocessor Lab Report",
    course: "Microprocessor Technology",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    source: "hod.cse@mbpit.ac.in",
    priority: "high",
    notified: false,
  },
  {
    id: 3,
    subject: "Software Engineering Mini Project",
    course: "Software Engineering",
    dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    source: "se.faculty@mbpit.ac.in",
    priority: "medium",
    notified: false,
  },
  {
    id: 4,
    subject: "Internal Exam Registration",
    course: "Academic",
    dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    source: "exam.cell@mbpit.ac.in",
    priority: "high",
    notified: false,
  },
  {
    id: 5,
    subject: "DBMS Theory Assignment",
    course: "Database Management",
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    source: "dbms.dept@mbpit.ac.in",
    priority: "overdue",
    notified: true,
  },
];

const PRIORITY_CONFIG = {
  critical: { label: "Critical", color: "#EF4444", bgColor: "#FEE2E2", borderColor: "#FECACA" },
  high: { label: "High", color: "#F97316", bgColor: "#FFEDD5", borderColor: "#FED7AA" },
  medium: { label: "Medium", color: "#3B82F6", bgColor: "#DBEAFE", borderColor: "#BFDBFE" },
  low: { label: "Low", color: "#8B5CF6", bgColor: "#EDE9FE", borderColor: "#DDD6FE" },
  overdue: { label: "Overdue", color: "#DC2626", bgColor: "#FEE2E2", borderColor: "#FECACA" },
};

function getCountdown(dueDate) {
  const diff = new Date(dueDate) - Date.now();
  if (diff < 0) return { label: "Overdue", value: Math.abs(diff), overdue: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return { label: `${days}d ${hrs}h`, value: diff, overdue: false };
  if (hrs > 0) return { label: `${hrs}h ${mins}m`, value: diff, overdue: false };
  return { label: `${mins}m`, value: diff, overdue: false };
}

function autoPriority(dueDate) {
  const diff = new Date(dueDate) - Date.now();
  if (diff < 0) return "overdue";
  if (diff < 2 * 86400000) return "critical";
  if (diff < 5 * 86400000) return "high";
  if (diff < 14 * 86400000) return "medium";
  return "low";
}

function CountdownPill({ dueDate, priority }) {
  const cd = getCountdown(dueDate);
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <div className="countdown-pill" style={{ backgroundColor: cfg.bgColor, borderColor: cfg.borderColor }}>
      <span style={{ color: cfg.color, fontWeight: "600" }}>
        {cd.overdue ? "⚠️" : "⏱️"} {cd.label}
      </span>
    </div>
  );
}

function AddDeadlineModal({ onAdd, onClose, editingItem }) {
  const [formData, setFormData] = useState(
    editingItem || {
      subject: "",
      course: "",
      dueDate: "",
      dueTime: "23:59",
      source: "",
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.subject || !formData.course || !formData.dueDate) {
      alert("Please fill in all required fields");
      return;
    }

    const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
    const priority = autoPriority(dueDateTime.toISOString());

    const newDeadline = {
      id: editingItem?.id || Date.now(),
      subject: formData.subject,
      course: formData.course,
      dueDate: dueDateTime.toISOString(),
      source: formData.source || "Not specified",
      priority: priority,
      notified: editingItem?.notified || false,
    };

    onAdd(newDeadline);
    setFormData({
      subject: "",
      course: "",
      dueDate: "",
      dueTime: "23:59",
      source: "",
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{editingItem ? "✏️ Edit Deadline" : "✨ Add New Deadline"}</h2>
            <p className="modal-subtitle">
              {editingItem ? "Update your deadline" : "Create a new deadline reminder"}
            </p>
          </div>
          <button onClick={onClose} className="modal-close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Assignment/Task Name *</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g., DAA Assignment 3"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Course Name *</label>
            <input
              type="text"
              name="course"
              value={formData.course}
              onChange={handleChange}
              placeholder="e.g., Design & Analysis of Algorithms"
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Due Date *</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Due Time</label>
              <input
                type="time"
                name="dueTime"
                value={formData.dueTime}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Source (Email/Faculty)</label>
            <input
              type="email"
              name="source"
              value={formData.source}
              onChange={handleChange}
              placeholder="e.g., prof.sharma@mbpit.ac.in"
              className="form-input"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingItem ? "✓ Update" : "✨ Add Deadline"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeadlineCard({ item, onDismiss, onEdit }) {
  const cfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
  const dueFmt = new Date(item.dueDate).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="deadline-card" style={{ borderLeftColor: cfg.color }}>
      <div className="card-content">
        <div className="card-header">
          <div>
            <h3 className="card-title">{item.subject}</h3>
            <p className="card-meta">
              {item.course} • <span>{item.source}</span>
            </p>
          </div>
          <CountdownPill dueDate={item.dueDate} priority={item.priority} />
        </div>

        <div className="card-footer">
          <span className="card-date">📅 {dueFmt}</span>
          <div className="card-actions">
            <span
              className="badge"
              style={{
                backgroundColor: cfg.bgColor,
                color: cfg.color,
                borderColor: cfg.borderColor,
              }}
            >
              {cfg.label}
            </span>
            <button onClick={() => onEdit(item)} className="btn-icon" title="Edit">
              ✏️
            </button>
            <button onClick={() => onDismiss(item.id)} className="btn-icon btn-danger" title="Delete">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsBar({ items }) {
  const counts = items.reduce((acc, i) => {
    acc[i.priority] = (acc[i.priority] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    { key: "critical", label: "Critical", icon: "🔴", count: counts.critical || 0 },
    { key: "high", label: "High", icon: "🟠", count: counts.high || 0 },
    { key: "medium", label: "Medium", icon: "🔵", count: counts.medium || 0 },
    { key: "overdue", label: "Overdue", icon: "⚠️", count: counts.overdue || 0 },
  ];

  return (
    <div className="stats-grid">
      {stats.map((s) => (
        <div key={s.key} className="stat-card">
          <div className="stat-icon">{s.icon}</div>
          <div className="stat-value">{s.count}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function Toast({ msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return <div className="toast">{msg}</div>;
}

export default function DeadlineRadar() {
  const [deadlines, setDeadlines] = useState(() => {
    const saved = localStorage.getItem("deadlines");
    return saved ? JSON.parse(saved) : SAMPLE_DEADLINES;
  });

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("all");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    localStorage.setItem("deadlines", JSON.stringify(deadlines));
  }, [deadlines]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    deadlines.forEach((d) => {
      const diff = new Date(d.dueDate) - Date.now();
      if (!d.notified && diff > 0 && diff < 24 * 3600000) {
        setToast(`⏰ "${d.subject}" is due in less than 24 hours!`);
        setDeadlines((prev) =>
          prev.map((x) => (x.id === d.id ? { ...x, notified: true } : x))
        );
      }
    });
  }, [tick, deadlines]);

  function handleAdd(item) {
    setDeadlines((prev) => {
      const exists = prev.findIndex((d) => d.id === item.id);
      if (exists !== -1) {
        const updated = [...prev];
        updated[exists] = item;
        setToast(`✓ Deadline updated: ${item.subject}`);
        return updated;
      } else {
        setToast(`✨ Deadline added: ${item.subject}`);
        return [item, ...prev];
      }
    });
    setShowModal(false);
    setEditingItem(null);
  }

  function handleDismiss(id) {
    const deadline = deadlines.find((d) => d.id === id);
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
    setToast(`✓ Deleted: ${deadline?.subject}`);
  }

  function handleEdit(item) {
    const dueDate = new Date(item.dueDate);
    const dateStr = dueDate.toISOString().split("T")[0];
    const timeStr = dueDate.toTimeString().substring(0, 5);

    setEditingItem({
      ...item,
      dueDate: dateStr,
      dueTime: timeStr,
    });
    setShowModal(true);
  }

  const sorted = [...deadlines]
    .filter((d) => filter === "all" || d.priority === filter)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <div className="brand-logo">📡</div>
            <div>
              <h1 className="brand-name">DeadlineRadar</h1>
              <p className="brand-tagline">Stay On Top Of Your Deadlines</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
            className="btn-primary btn-lg"
          >
            ✨ Add Deadline
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          {/* Stats */}
          <StatsBar items={deadlines} />

          {/* Filters */}
          <div className="filters">
            {["all", "critical", "high", "medium", "low", "overdue"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`filter-btn ${filter === f ? "active" : ""}`}
              >
                {f}
              </button>
            ))}
            <span className="filter-count">{sorted.length} item{sorted.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Deadlines List */}
          <div className="deadlines-list">
            {sorted.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <p>No deadlines in this category</p>
                <small>Relax and enjoy!</small>
              </div>
            ) : (
              sorted.map((d) => (
                <DeadlineCard
                  key={d.id}
                  item={d}
                  onDismiss={handleDismiss}
                  onEdit={handleEdit}
                />
              ))
            )}
          </div>

          {/* Features Section */}
          <div className="features-section">
            <h3>✨ Key Features</h3>
            <div className="features-grid">
              <div className="feature-box">
                <div className="feature-icon">💾</div>
                <div className="feature-text">
                  <strong>Auto-Save</strong>
                  <p>Deadlines saved locally</p>
                </div>
              </div>
              <div className="feature-box">
                <div className="feature-icon">📅</div>
                <div className="feature-text">
                  <strong>Smart Sorting</strong>
                  <p>Automatic prioritization</p>
                </div>
              </div>
              <div className="feature-box">
                <div className="feature-icon">⏰</div>
                <div className="feature-text">
                  <strong>Live Countdown</strong>
                  <p>Real-time status updates</p>
                </div>
              </div>
              <div className="feature-box">
                <div className="feature-icon">🔔</div>
                <div className="feature-text">
                  <strong>24h Alerts</strong>
                  <p>Never miss deadlines</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals & Toasts */}
      {showModal && (
        <AddDeadlineModal
          onAdd={handleAdd}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
        />
      )}
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
}