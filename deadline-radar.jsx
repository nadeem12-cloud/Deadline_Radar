import { useState, useEffect, useRef } from "react";

const SAMPLE_DEADLINES = [
  {
    id: 1,
    subject: "DAA Assignment 3 - Graph Algorithms",
    course: "Design & Analysis of Algorithms",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    source: "prof.sharma@mbpit.ac.in",
    priority: "critical",
    notified: false,
    extractedFrom: "Subject: DAA Assignment 3 Submission",
  },
  {
    id: 2,
    subject: "Microprocessor Lab Report",
    course: "Microprocessor Technology",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    source: "hod.cse@mbpit.ac.in",
    priority: "high",
    notified: false,
    extractedFrom: "Subject: MP Lab Report Submission Reminder",
  },
  {
    id: 3,
    subject: "Software Engineering Mini Project",
    course: "Software Engineering",
    dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    source: "se.faculty@mbpit.ac.in",
    priority: "medium",
    notified: false,
    extractedFrom: "Subject: SE Mini Project Guidelines",
  },
  {
    id: 4,
    subject: "Internal Exam Registration",
    course: "Academic",
    dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    source: "exam.cell@mbpit.ac.in",
    priority: "high",
    notified: false,
    extractedFrom: "Subject: Internal Exam Registration Open",
  },
  {
    id: 5,
    subject: "DBMS Theory Assignment",
    course: "Database Management",
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    source: "dbms.dept@mbpit.ac.in",
    priority: "overdue",
    notified: true,
    extractedFrom: "Subject: DBMS Assignment 2 Due Date",
  },
];

const PRIORITY_CONFIG = {
  critical: { label: "Critical", color: "#ff3b3b", bg: "rgba(255,59,59,0.12)", dot: "#ff3b3b" },
  high:     { label: "High",     color: "#ff8c00", bg: "rgba(255,140,0,0.12)",  dot: "#ff8c00" },
  medium:   { label: "Medium",   color: "#00c2a8", bg: "rgba(0,194,168,0.12)",  dot: "#00c2a8" },
  low:      { label: "Low",      color: "#6b7fad", bg: "rgba(107,127,173,0.12)",dot: "#6b7fad" },
  overdue:  { label: "Overdue",  color: "#ff3b3b", bg: "rgba(255,59,59,0.08)",  dot: "#ff3b3b" },
};

function getCountdown(dueDate) {
  const diff = new Date(dueDate) - Date.now();
  if (diff < 0) return { label: "Overdue", value: Math.abs(diff), overdue: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hrs  = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return { label: `${days}d ${hrs}h`, value: diff, overdue: false };
  if (hrs  > 0) return { label: `${hrs}h ${mins}m`, value: diff, overdue: false };
  return { label: `${mins}m`, value: diff, overdue: false };
}

function autoPriority(dueDate) {
  const diff = new Date(dueDate) - Date.now();
  if (diff < 0)                          return "overdue";
  if (diff < 2 * 86400000)               return "critical";
  if (diff < 5 * 86400000)               return "high";
  if (diff < 14 * 86400000)              return "medium";
  return "low";
}

// ─── Pulsing ring for critical ───────────────────────────────────────────────
function PulseRing({ color }) {
  return (
    <span style={{
      display: "inline-block",
      width: 10, height: 10,
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 0 0 ${color}`,
      animation: "pulse 1.6s ease-out infinite",
      flexShrink: 0,
    }} />
  );
}

// ─── Countdown pill ──────────────────────────────────────────────────────────
function CountdownPill({ dueDate, priority }) {
  const cd = getCountdown(dueDate);
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      background: cfg.bg,
      border: `1px solid ${cfg.color}33`,
      color: cfg.color, fontSize: 12, fontFamily: "'Space Mono', monospace",
      fontWeight: 700,
    }}>
      {cd.overdue ? "⚠ " : "⏱ "}{cd.label}
    </span>
  );
}

// ─── AI Email Parser Panel ───────────────────────────────────────────────────
function AIParserPanel({ onAdd, onClose }) {
  const [emailText, setEmailText] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  async function handleParse() {
    if (!emailText.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Extract assignment/deadline information from this email. Return ONLY valid JSON (no markdown, no backticks) with this exact shape:
{
  "subject": "short task name",
  "course": "course or subject name",
  "dueDate": "ISO 8601 datetime string",
  "source": "sender email if found else unknown@college.edu",
  "extractedFrom": "original email subject line"
}
If no due date is found, return: {"error": "no deadline found"}

Email:
${emailText}`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("").trim();
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (parsed.error) { setError("No deadline detected in this email."); return; }
      const priority = autoPriority(parsed.dueDate);
      onAdd({ ...parsed, id: Date.now(), priority, notified: false });
    } catch (e) {
      setError("Could not parse email. Try again or check the format.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(7,10,20,0.85)",
      backdropFilter: "blur(8px)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#0d1117", border: "1px solid #1e2a3a",
        borderRadius: 16, padding: 32, width: "min(560px, 90vw)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ color: "#e2eaf7", fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
              📨 Paste Email
            </div>
            <div style={{ color: "#4a6080", fontSize: 12, marginTop: 2 }}>AI will extract the deadline automatically</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4a6080", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <textarea
          value={emailText}
          onChange={e => setEmailText(e.target.value)}
          placeholder={"Paste the full email here...\n\nExample:\nSubject: DAA Assignment 3 Due\nDear students, please submit your assignment by March 15, 2026..."}
          style={{
            width: "100%", minHeight: 180, background: "#070a14",
            border: "1px solid #1e2a3a", borderRadius: 10,
            color: "#c9d8f0", fontSize: 13, padding: 14,
            resize: "vertical", fontFamily: "monospace",
            outline: "none", boxSizing: "border-box",
          }}
        />
        {error && <div style={{ color: "#ff5555", fontSize: 12, marginTop: 8 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            onClick={handleParse}
            disabled={loading || !emailText.trim()}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 10,
              background: loading ? "#1e2a3a" : "linear-gradient(135deg, #00c2a8, #0075ff)",
              border: "none", color: "#fff", fontWeight: 700,
              fontSize: 14, cursor: loading ? "wait" : "pointer",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {loading ? "⏳ Analysing..." : "✦ Extract Deadline"}
          </button>
          <button onClick={onClose} style={{
            padding: "12px 20px", borderRadius: 10, background: "#1e2a3a",
            border: "1px solid #2a3a50", color: "#6b7fad",
            fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Deadline Card ───────────────────────────────────────────────────────────
function DeadlineCard({ item, onDismiss }) {
  const cfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
  const dueFmt = new Date(item.dueDate).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });
  return (
    <div style={{
      background: "#0d1117",
      border: `1px solid ${item.priority === "overdue" ? "#ff3b3b44" : "#1e2a3a"}`,
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: 12, padding: "16px 18px",
      display: "flex", alignItems: "flex-start", gap: 14,
      transition: "transform 0.15s, box-shadow 0.15s",
      cursor: "default",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ marginTop: 3 }}>
        {item.priority === "critical" || item.priority === "overdue"
          ? <PulseRing color={cfg.color} />
          : <span style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#e2eaf7", fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>
              {item.subject}
            </div>
            <div style={{ color: "#4a6080", fontSize: 11, marginTop: 2 }}>
              {item.course} · <span style={{ color: "#3a5070" }}>{item.source}</span>
            </div>
          </div>
          <CountdownPill dueDate={item.dueDate} priority={item.priority} />
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          <div style={{ fontSize: 11, color: "#3a5070" }}>
            📅 {dueFmt}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 10,
              background: cfg.bg, color: cfg.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5
            }}>{cfg.label}</span>
            <button onClick={() => onDismiss(item.id)} style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 10,
              background: "#1e2a3a", color: "#4a6080", border: "none",
              cursor: "pointer", fontWeight: 600,
            }}>Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stats bar ───────────────────────────────────────────────────────────────
function StatsBar({ items }) {
  const counts = items.reduce((acc, i) => {
    acc[i.priority] = (acc[i.priority] || 0) + 1; return acc;
  }, {});
  const stats = [
    { key: "critical", label: "Critical", icon: "🔴" },
    { key: "high",     label: "High",     icon: "🟠" },
    { key: "medium",   label: "Medium",   icon: "🟢" },
    { key: "overdue",  label: "Overdue",  icon: "⚠️" },
  ];
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {stats.map(s => (
        <div key={s.key} style={{
          background: "#0d1117", border: "1px solid #1e2a3a",
          borderRadius: 10, padding: "10px 16px",
          display: "flex", flexDirection: "column", alignItems: "center", minWidth: 70,
          flex: 1,
        }}>
          <div style={{ fontSize: 20 }}>{s.icon}</div>
          <div style={{ color: "#e2eaf7", fontSize: 20, fontWeight: 800, fontFamily: "'Space Mono', monospace", lineHeight: 1.1 }}>
            {counts[s.key] || 0}
          </div>
          <div style={{ color: "#3a5070", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Notification Toast ──────────────────────────────────────────────────────
function Toast({ msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 200,
      background: "#0d1117", border: "1px solid #00c2a844",
      borderRadius: 12, padding: "14px 20px",
      color: "#00c2a8", fontFamily: "'Space Grotesk', sans-serif",
      fontSize: 14, fontWeight: 600,
      boxShadow: "0 8px 32px rgba(0,194,168,0.2)",
      animation: "fadeIn 0.3s ease",
      maxWidth: 340,
    }}>
      ✦ {msg}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function DeadlineRadar() {
  const [deadlines, setDeadlines]   = useState(SAMPLE_DEADLINES);
  const [showParser, setShowParser] = useState(false);
  const [toast, setToast]           = useState(null);
  const [filter, setFilter]         = useState("all");
  const [tick, setTick]             = useState(0);

  // Live countdown tick
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // Notification check
  useEffect(() => {
    deadlines.forEach(d => {
      const diff = new Date(d.dueDate) - Date.now();
      if (!d.notified && diff > 0 && diff < 24 * 3600000) {
        setToast(`⏰ "${d.subject}" is due in less than 24 hours!`);
        setDeadlines(prev => prev.map(x => x.id === d.id ? { ...x, notified: true } : x));
      }
    });
  }, [tick]);

  function handleAdd(item) {
    setDeadlines(prev => [item, ...prev]);
    setShowParser(false);
    setToast(`✦ Deadline added: ${item.subject}`);
  }

  function handleDismiss(id) {
    setDeadlines(prev => prev.filter(d => d.id !== id));
  }

  const sorted = [...deadlines]
    .filter(d => filter === "all" || d.priority === filter)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070a14",
      fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
      color: "#c9d8f0",
      padding: "0 0 60px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 currentColor; }
          70%  { box-shadow: 0 0 0 8px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #070a14; }
        ::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 3px; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(180deg, #0b1020 0%, #070a14 100%)",
        borderBottom: "1px solid #1e2a3a",
        padding: "24px 24px 20px",
        position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>📡</span>
                <span style={{
                  fontSize: 22, fontWeight: 800, letterSpacing: -0.5,
                  background: "linear-gradient(135deg, #00c2a8, #0075ff)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>DeadlineRadar</span>
              </div>
              <div style={{ color: "#3a5070", fontSize: 11, marginTop: 2, letterSpacing: 0.5 }}>
                AI-POWERED · GMAIL CONNECTED · MBPIT
              </div>
            </div>
            <button onClick={() => setShowParser(true)} style={{
              padding: "10px 20px", borderRadius: 10,
              background: "linear-gradient(135deg, #00c2a8, #0075ff)",
              border: "none", color: "#fff", fontWeight: 700,
              fontSize: 13, cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              ✦ Add from Email
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px 0" }}>

        {/* Stats */}
        <StatsBar items={deadlines} />

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginTop: 20, flexWrap: "wrap" }}>
          {["all", "critical", "high", "medium", "overdue"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", borderRadius: 20,
              background: filter === f ? (PRIORITY_CONFIG[f]?.bg || "#1e2a3a") : "transparent",
              border: `1px solid ${filter === f ? (PRIORITY_CONFIG[f]?.color || "#2a3a50") : "#1e2a3a"}`,
              color: filter === f ? (PRIORITY_CONFIG[f]?.color || "#e2eaf7") : "#4a6080",
              fontWeight: 600, fontSize: 12, cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif",
              textTransform: "capitalize",
            }}>{f}</button>
          ))}
          <span style={{ marginLeft: "auto", color: "#3a5070", fontSize: 12, alignSelf: "center" }}>
            {sorted.length} deadline{sorted.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Deadline list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
          {sorted.length === 0
            ? <div style={{ color: "#3a5070", textAlign: "center", padding: 40, fontSize: 14 }}>
                No deadlines in this category. 🎉
              </div>
            : sorted.map(d => <DeadlineCard key={d.id} item={d} onDismiss={handleDismiss} />)
          }
        </div>

        {/* Integration hint */}
        <div style={{
          marginTop: 32, background: "#0d1117",
          border: "1px solid #1e2a3a", borderRadius: 12, padding: 20,
        }}>
          <div style={{ color: "#3a5070", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            💡 Full Gmail Automation
          </div>
          <div style={{ color: "#4a6080", fontSize: 12, lineHeight: 1.7 }}>
            This dashboard uses the Claude API to parse emails. For <strong style={{ color: "#00c2a8" }}>fully automatic</strong> detection,
            connect the Gmail API so emails are scanned every 15 minutes without any copy-pasting.
            Download the setup guide below for step-by-step instructions.
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Gmail API", "OAuth 2.0", "Python Agent", "Cron Job", "Browser Notifications"].map(t => (
              <span key={t} style={{
                fontSize: 10, padding: "3px 10px", borderRadius: 20,
                background: "#1e2a3a", color: "#6b7fad", fontWeight: 600,
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Panels / Toasts */}
      {showParser && <AIParserPanel onAdd={handleAdd} onClose={() => setShowParser(false)} />}
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
