import { useState, useEffect, useRef } from "react";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// ─── Persistent Storage Helpers ───────────────────────────────────────────────
const DB = {
  get: async (key) => {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
  },
  set: async (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { console.error("storage err"); }
  },
};

// ─── Gemini AI Helper ─────────────────────────────────────────────────────────
async function askClaude(prompt) {
  try {
    const res = await fetch("/api/ai/suggestion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return data.content || "Unable to generate suggestion.";
  } catch(e) { return "Unable to generate suggestion."; }
}

// ─── Phase Detection ──────────────────────────────────────────────────────────
function getCyclePhase(dayOfCycle) {
  if (dayOfCycle <= 5) return { phase: "Menstruation", color: "#D85A30", emoji: "🌑" };
  if (dayOfCycle <= 13) return { phase: "Follicular", color: "#1D9E75", emoji: "🌒" };
  if (dayOfCycle <= 16) return { phase: "Ovulation", color: "#EF9F27", emoji: "🌕" };
  return { phase: "Luteal", color: "#7F77DD", emoji: "🌖" };
}

function daysBetween(d1, d2) {
  return Math.floor((new Date(d2) - new Date(d1)) / 86400000);
}

// ─── OTP Simulation ──────────────────────────────────────────────────────────
function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app: { fontFamily: "'Lora', Georgia, serif", minHeight: "100vh", background: "linear-gradient(135deg, #fff5f7 0%, #fce7f3 50%, #f3e8ff 100%)", color: "#2d1b2e" },
  card: { background: "rgba(255,255,255,0.92)", borderRadius: 20, padding: "2rem", boxShadow: "0 8px 40px rgba(216,90,90,0.10)", border: "1px solid rgba(216,90,142,0.12)", backdropFilter: "blur(12px)" },
  input: { width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #f0d0e0", fontSize: 15, fontFamily: "inherit", background: "rgba(255,255,255,0.8)", color: "#2d1b2e", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" },
  btn: { padding: "13px 28px", borderRadius: 50, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "inherit", transition: "all 0.2s", letterSpacing: 0.3 },
  btnPrimary: { background: "linear-gradient(135deg, #e879a0, #a855f7)", color: "#fff", boxShadow: "0 4px 20px rgba(168,85,247,0.3)" },
  btnOutline: { background: "transparent", border: "1.5px solid #e879a0", color: "#e879a0" },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#9b6b8a", marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" },
  h1: { fontSize: 28, fontWeight: 700, color: "#2d1b2e", margin: "0 0 8px" },
  h2: { fontSize: 22, fontWeight: 700, color: "#2d1b2e", margin: "0 0 16px" },
  muted: { color: "#9b6b8a", fontSize: 14 },
  errorBox: { background: "#fff0f3", border: "1px solid #ffb3c6", borderRadius: 10, padding: "10px 14px", color: "#c0002a", fontSize: 13, marginTop: 8 },
  successBox: { background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "10px 14px", color: "#166534", fontSize: 13, marginTop: 8 },
  section: { marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  tag: { display: "inline-block", padding: "4px 12px", borderRadius: 50, fontSize: 12, fontWeight: 600 },
  navBar: { display: "flex", justifyContent: "space-around", padding: "10px 0 20px", position: "sticky", top: 0, background: "rgba(255,245,247,0.95)", backdropFilter: "blur(12px)", zIndex: 100, borderBottom: "1px solid rgba(216,90,142,0.1)" },
};

// ─── SCREENS ──────────────────────────────────────────────────────────────────

function Splash({ onStart }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🌸</div>
      <h1 style={{ ...S.h1, fontSize: 38, background: "linear-gradient(135deg, #e879a0, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", paddingBottom: "10px", lineHeight: 1.2 }}>CycleSync</h1>
      <p style={{ ...S.muted, fontSize: 17, marginBottom: 8 }}>Your personal cycle companion</p>
      <p style={{ ...S.muted, fontSize: 13, marginBottom: 40, maxWidth: 300 }}>From first period to menopause — track, understand, and care for yourself</p>
      <button style={{ ...S.btn, ...S.btnPrimary, fontSize: 17, padding: "15px 44px" }} onClick={() => onStart("register")}>Get Started</button>
      <button style={{ ...S.btn, ...S.btnOutline, marginTop: 12 }} onClick={() => onStart("login")}>I already have an account</button>
    </div>
  );
}

function RegisterScreen({ onDone }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", dob: "", email: "", mobile: "+91", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const handleSendOtp = async () => {
    const hasEmail = form.email && form.email.length > 3;
    const hasMobile = form.mobile && form.mobile.length > 6;
    if (!form.name || !form.dob || (!hasEmail && !hasMobile) || !form.password) { setErr("Please fill all fields."); return; }
    const calculatedAge = Math.floor((new Date() - new Date(form.dob).getTime()) / 3.15576e+10);
    if (calculatedAge < 10 || calculatedAge > 60) { setErr("Age must be between 10–60 based on your DOB."); return; }
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email })
      });
      if (!res.ok) throw new Error("Failed to send OTP.");
      setErr("");
      setMsg("OTP sent to your email!");
      setStep(2);
    } catch (e) { setErr(e.message); }
  };

  const handleVerify = async () => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register.");
      await DB.set("current_user", data.user);
      await DB.set("token", data.token);
      setErr("");
      onDone(data.user, data.token);
    } catch(e) { setErr(e.message); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  if (step === 2) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
      <div style={{ ...S.card, maxWidth: 420, width: "100%" }}>
        <div style={{ fontSize: 40, marginBottom: 8, textAlign: "center" }}>📬</div>
        <h2 style={{ ...S.h2, textAlign: "center" }}>Verify your OTP</h2>
        <p style={{ ...S.muted, textAlign: "center", marginBottom: 24 }}>A 6-digit code was sent to your {form.email ? "email" : "mobile"}</p>
        {msg && <div style={S.successBox}>{msg}</div>}
        <div style={{ ...S.section, marginTop: 16 }}>
          <label style={S.label}>Enter OTP</label>
          <input style={{ ...S.input, textAlign: "center", fontSize: 24, letterSpacing: 8, fontWeight: 700 }} value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} placeholder="● ● ● ● ● ●" />
        </div>
        {err && <div style={S.errorBox}>{err}</div>}
        <button style={{ ...S.btn, ...S.btnPrimary, width: "100%", marginTop: 16 }} onClick={handleVerify}>Verify & Create Account</button>
        <button style={{ ...S.btn, ...S.btnOutline, width: "100%", marginTop: 8 }} onClick={() => { setStep(1); setErr(""); }}>Go Back</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
      <div style={{ ...S.card, maxWidth: 480, width: "100%" }}>
        <div style={{ fontSize: 40, marginBottom: 8, textAlign: "center" }}>🌸</div>
        <h2 style={{ ...S.h2, textAlign: "center" }}>Create your account</h2>
        <p style={{ ...S.muted, textAlign: "center", marginBottom: 24 }}>Safe, private, and just for you</p>

        <div style={S.section}>
          <label style={S.label}>Full Name</label>
          <input style={S.input} placeholder="Your name" value={form.name} onChange={e => f("name", e.target.value)} />
        </div>
        <div style={{ ...S.grid2, marginBottom: 16 }}>
          <div>
            <label style={S.label}>Date of Birth</label>
            <input style={S.input} type="date" value={form.dob} onChange={e => f("dob", e.target.value)} />
          </div>
          <div>
            <label style={S.label}>Gender</label>
            <input style={{ ...S.input, background: "#fdf2f8", color: "#9b6b8a" }} value="Female 🚺" readOnly />
          </div>
        </div>
        <div style={S.section}>
          <label style={S.label}>Email Address</label>
          <input style={S.input} type="email" placeholder="you@email.com" value={form.email} onChange={e => f("email", e.target.value)} />
        </div>
        <div style={S.section}>
          <label style={S.label}>Mobile (optional)</label>
          <PhoneInput
            international
            defaultCountry="IN"
            value={form.mobile}
            onChange={v => f("mobile", v)}
            style={{ ...S.input, padding: "8px 16px", display: "flex", alignItems: "center" }}
            numberInputProps={{ style: { border: "none", background: "transparent", outline: "none", fontSize: 15, fontFamily: "inherit", color: "#2d1b2e", flex: 1, width: "100%" } }}
          />
        </div>
        <div style={S.section}>
          <label style={S.label}>Password</label>
          <div style={{ position: "relative" }}>
            <input style={{ ...S.input, paddingRight: 40 }} type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={form.password} onChange={e => f("password", e.target.value)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "#9b6b8a", outline: "none", padding: 0 }}>
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
        {err && <div style={S.errorBox}>{err}</div>}
        <button style={{ ...S.btn, ...S.btnPrimary, width: "100%", marginTop: 8 }} onClick={handleSendOtp}>Send OTP & Continue →</button>
      </div>
    </div>
  );
}

function LoginScreen({ onDone, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState("login"); // "login" | "forgot-1" | "forgot-2"
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setErr("Enter email and password"); return; }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      await DB.set("current_user", data.user);
      await DB.set("token", data.token);
      onDone(data.user, data.token);
    } catch (e) { setErr(e.message); }
  };

  const handleForgotOtp = async () => {
    if (!email) { setErr("Enter your email address first"); return; }
    try {
      setMsg("Sending reset code..."); setErr("");
      const res = await fetch("/api/auth/forgot-password-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setErr(""); setMsg("Reset OTP sent to your email!");
      setStep("forgot-2");
    } catch(e) { setErr(e.message); setMsg(""); }
  };

  const handleReset = async () => {
    if (!otp || !newPassword) { setErr("Enter OTP and new password"); return; }
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setErr(""); setMsg("Password reset successful! Please log in.");
      setPassword(""); setStep("login");
    } catch(e) { setErr(e.message); }
  };

  if (step === "forgot-1") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
      <div style={{ ...S.card, maxWidth: 420, width: "100%" }}>
        <h2 style={{ ...S.h2, textAlign: "center", fontSize: 24 }}>Reset Password</h2>
        <p style={{ ...S.muted, textAlign: "center", marginBottom: 24, fontSize: 13 }}>Enter your email to receive a reset code.</p>
        {msg && <div style={S.successBox}>{msg}</div>}
        <div style={S.section}>
          <label style={S.label}>Email Address</label>
          <input style={S.input} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        {err && <div style={S.errorBox}>{err}</div>}
        <button style={{ ...S.btn, ...S.btnPrimary, width: "100%", marginTop: 8 }} onClick={handleForgotOtp}>Send Reset Code</button>
        <button style={{ ...S.btn, ...S.btnOutline, width: "100%", marginTop: 8 }} onClick={() => { setStep("login"); setErr(""); setMsg(""); }}>Back to Login</button>
      </div>
    </div>
  );

  if (step === "forgot-2") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
      <div style={{ ...S.card, maxWidth: 420, width: "100%" }}>
        <h2 style={{ ...S.h2, textAlign: "center", fontSize: 24 }}>Enter Code & New Password</h2>
        {msg && <div style={S.successBox}>{msg}</div>}
        <div style={S.section}>
          <label style={S.label}>Reset OTP</label>
          <input style={{ ...S.input, textAlign: "center", fontSize: 24, letterSpacing: 8, fontWeight: 700 }} value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} placeholder="● ● ● ● ● ●" />
        </div>
        <div style={S.section}>
          <label style={S.label}>New Password</label>
          <div style={{ position: "relative" }}>
            <input style={{ ...S.input, paddingRight: 40 }} type={showPassword ? "text" : "password"} placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "#9b6b8a", outline: "none", padding: 0 }}>
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
        {err && <div style={S.errorBox}>{err}</div>}
        <button style={{ ...S.btn, ...S.btnPrimary, width: "100%", marginTop: 8 }} onClick={handleReset}>Reset Password</button>
        <button style={{ ...S.btn, ...S.btnOutline, width: "100%", marginTop: 8 }} onClick={() => { setStep("forgot-1"); setErr(""); setMsg(""); }}>Back</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
      <div style={{ ...S.card, maxWidth: 420, width: "100%" }}>
        <div style={{ fontSize: 40, textAlign: "center", marginBottom: 8 }}>🌸</div>
        <h2 style={{ ...S.h2, textAlign: "center" }}>Welcome back</h2>
        {msg && <div style={S.successBox}>{msg}</div>}
        <div style={S.section}>
          <label style={S.label}>Email Address</label>
          <input style={S.input} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={S.label}>Password</label>
            <span style={{ fontSize: 12, color: "#e879a0", cursor: "pointer", fontWeight: 600, marginBottom: 8 }} onClick={() => { setStep("forgot-1"); setErr(""); setMsg(""); }}>Forgot Password?</span>
          </div>
          <div style={{ position: "relative" }}>
            <input style={{ ...S.input, paddingRight: 40 }} type={showPassword ? "text" : "password"} placeholder="Verify your password" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "#9b6b8a", outline: "none", padding: 0 }}>
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
        {err && <div style={S.errorBox}>{err}</div>}
        <button style={{ ...S.btn, ...S.btnPrimary, width: "100%", marginTop: 8 }} onClick={handleLogin}>Log In</button>
        <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "#9b6b8a" }}>
          New to CycleSync? <span style={{ color: "#e879a0", fontWeight: 700, cursor: "pointer" }} onClick={onRegister}>Create an account</span>
        </div>
      </div>
    </div>
  );
}

// ─── JOURNAL LOG SCREEN ───────────────────────────────────────────────────────
function LevelButton({ label, value, selected, onClick, color }) {
  return (
    <button onClick={() => onClick(value)} style={{ padding: "8px 16px", borderRadius: 50, border: selected ? "none" : "1.5px solid #e0c0d0", background: selected ? color : "transparent", color: selected ? "#fff" : "#9b6b8a", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s" }}>
      {label}
    </button>
  );
}

function SliderField({ label, min, max, value, onChange, color, leftLabel, rightLabel }) {
  return (
    <div style={S.section}>
      <label style={S.label}>{label}</label>
      <input type="range" min={min} max={max} value={value} step={1} onChange={e => onChange(parseInt(e.target.value))} style={{ width: "100%", accentColor: color }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9b6b8a", marginTop: 4 }}>
        <span>{leftLabel}</span>
        <span style={{ fontWeight: 700, color }}>{value} / {max}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

const SYMPTOMS = ["Cramps", "Bloating", "Headache", "Back pain", "Breast tenderness", "Nausea", "Fatigue", "Acne", "Mood swings", "Food cravings", "Insomnia", "Spotting"];
const MOODS = [{ v: 1, l: "😭 Terrible" }, { v: 2, l: "😔 Low" }, { v: 3, l: "😐 Okay" }, { v: 4, l: "🙂 Good" }, { v: 5, l: "😄 Great" }];

function LogScreen({ user, token, onSave }) {
  const today = new Date().toISOString().split("T")[0];
  const [entry, setEntry] = useState({
    date: today, flowLevel: 2, painLevel: 3, moodLevel: 3,
    symptoms: [], notes: "", bloodColor: "red", clotting: 1,
    energyLevel: 3, discharge: "none"
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/log/" + user.id + "/" + today, { headers: { "Authorization": `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d) setEntry({ ...entry, ...d }); });
  }, []);

  const toggleSymptom = (s) => setEntry(p => ({ ...p, symptoms: p.symptoms.includes(s) ? p.symptoms.filter(x => x !== s) : [...p.symptoms, s] }));

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/logs/" + user.id, {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(entry)
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onSave && onSave(); }, 1500);
  };

  const f = (k, v) => setEntry(p => ({ ...p, [k]: v }));

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 100px" }}>
      <h2 style={{ ...S.h2, fontSize: 26 }}>📓 Today's Journal</h2>
      <p style={S.muted}>Log how you're feeling — every detail helps</p>

      <div style={{ ...S.card, marginTop: 20 }}>
        <div style={S.section}>
          <label style={S.label}>Date</label>
          <input type="date" style={S.input} value={entry.date} onChange={e => f("date", e.target.value)} />
        </div>

        <div style={S.section}>
          <label style={S.label}>Flow Level</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[{ v: 0, l: "None" }, { v: 1, l: "Spotting" }, { v: 2, l: "Light" }, { v: 3, l: "Medium" }, { v: 4, l: "Heavy" }, { v: 5, l: "Very Heavy" }].map(({ v, l }) => (
              <LevelButton key={v} value={v} label={l} selected={entry.flowLevel === v} onClick={v => f("flowLevel", v)} color="#e879a0" />
            ))}
          </div>
        </div>

        {entry.flowLevel > 0 && (
          <>
            <div style={S.section}>
              <label style={S.label}>Blood Color</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[["Bright Red", "red", "#e53e3e"], ["Dark Red/Brown", "dark", "#7b341e"], ["Pink", "pink", "#ed64a6"], ["Orange", "orange", "#dd6b20"], ["Black", "black", "#2d3748"]].map(([l, v, c]) => (
                  <LevelButton key={v} value={v} label={l} selected={entry.bloodColor === v} onClick={v => f("bloodColor", v)} color={c} />
                ))}
              </div>
            </div>
            <SliderField label="Clotting" min={0} max={3} value={entry.clotting} onChange={v => f("clotting", v)} color="#c05621" leftLabel="None" rightLabel="Heavy" />
          </>
        )}

        <SliderField label="Pain Level" min={0} max={10} value={entry.painLevel} onChange={v => f("painLevel", v)} color="#a855f7" leftLabel="No pain" rightLabel="Worst pain" />
        <SliderField label="Energy Level" min={1} max={5} value={entry.energyLevel} onChange={v => f("energyLevel", v)} color="#1D9E75" leftLabel="Exhausted" rightLabel="Energized" />
        <SliderField label="Mood Level" min={1} max={5} value={entry.moodLevel} onChange={v => f("moodLevel", v)} color="#e879a0" leftLabel="Very low" rightLabel="Excellent" />

        <div style={S.section}>
          <label style={S.label}>Discharge (non-period days)</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["None", "none"], ["Clear", "clear"], ["White/Creamy", "white"], ["Stretchy", "stretchy"], ["Yellow", "yellow"], ["Unusual", "unusual"]].map(([l, v]) => (
              <LevelButton key={v} value={v} label={l} selected={entry.discharge === v} onClick={v => f("discharge", v)} color="#7F77DD" />
            ))}
          </div>
        </div>

        <div style={S.section}>
          <label style={S.label}>Symptoms</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SYMPTOMS.map(s => (
              <button key={s} onClick={() => toggleSymptom(s)} style={{ padding: "7px 14px", borderRadius: 50, fontSize: 13, cursor: "pointer", border: entry.symptoms.includes(s) ? "none" : "1.5px solid #e0c0d0", background: entry.symptoms.includes(s) ? "linear-gradient(135deg, #e879a0, #a855f7)" : "transparent", color: entry.symptoms.includes(s) ? "#fff" : "#9b6b8a", fontFamily: "inherit", fontWeight: 500, transition: "all 0.15s" }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div style={S.section}>
          <label style={S.label}>Notes / Reflections</label>
          <textarea style={{ ...S.input, minHeight: 80, resize: "vertical" }} placeholder="How are you feeling today? Any other notes..." value={entry.notes} onChange={e => f("notes", e.target.value)} />
        </div>

        {saved ? (
          <div style={{ ...S.successBox, textAlign: "center", fontSize: 16, padding: 14 }}>✅ Entry saved!</div>
        ) : (
          <button style={{ ...S.btn, ...S.btnPrimary, width: "100%", marginTop: 8 }} onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : "Save Journal Entry 🌸"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── DASHBOARD SCREEN ─────────────────────────────────────────────────────────
function StatCard({ label, value, color, unit }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.85)", borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(216,90,142,0.12)", textAlign: "center" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9b6b8a", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || "#e879a0" }}>{value}<span style={{ fontSize: 13, marginLeft: 2, color: "#9b6b8a" }}>{unit}</span></div>
    </div>
  );
}

function CycleRing({ dayOfCycle, cycleLength = 28, hasData = true }) {
  const pct = hasData ? Math.min(dayOfCycle / cycleLength, 1) : 1;
  const r = 54, cx = 64, cy = 64;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  const { phase, color } = hasData ? getCyclePhase(dayOfCycle) : { phase: "No data", color: "#cbd5e1" };
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={128} height={128} viewBox="0 0 128 128">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0d0e0" strokeWidth={10} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={20} fontWeight={700} fill={color}>{hasData ? dayOfCycle : "-"}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fill="#9b6b8a">{hasData ? `day ${dayOfCycle}` : "Start logging"}</text>
      </svg>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginTop: -8 }}>{phase}</div>
    </div>
  );
}

function Dashboard({ user, token }) {
  const [logs, setLogs] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [cycleStart, setCycleStart] = useState(null);
  const [cycleLength, setCycleLength] = useState(28);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await fetch("/api/logs/" + user.id, { headers: { "Authorization": `Bearer ${token}` } });
    const valid = await res.json();
    setLogs(valid);

    // Find last period start
    const periods = valid.filter(e => e.flowLevel > 0).map(e => e.date);
    if (periods.length > 0) {
      const last = periods[periods.length - 1];
      setCycleStart(last);
      if (periods.length > 1) {
        const prevs = periods.slice(-5, -1);
        let total = 0;
        for (let i = 1; i < prevs.length; i++) total += daysBetween(prevs[i - 1], prevs[i]);
        if (prevs.length > 1) setCycleLength(Math.round(total / (prevs.length - 1)));
      }
    }
  };

  const dayOfCycle = cycleStart ? daysBetween(cycleStart, new Date().toISOString().split("T")[0]) + 1 : 1;
  const nextPeriod = cycleStart ? new Date(new Date(cycleStart).getTime() + cycleLength * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";
  const { phase, color } = cycleStart ? getCyclePhase(dayOfCycle) : { phase: "No logs yet", color: "#cbd5e1" };

  const getAISuggestion = async () => {
    setAiLoading(true);
    setAiSuggestion("");
    const latest = logs[logs.length - 1];
    const prompt = `You are a compassionate women's health AI. A ${user.age}-year-old woman is on day ${dayOfCycle} of her menstrual cycle (${phase} phase).
${latest ? `Her latest journal entry shows: flow level ${latest.flowLevel}/5, pain ${latest.painLevel}/10, mood ${latest.moodLevel}/5, energy ${latest.energyLevel}/5, symptoms: ${latest.symptoms.join(", ") || "none"}, notes: "${latest.notes || "none"}".` : "No recent log."}
Provide 3 gentle, practical suggestions in these categories:
1. 🥗 Food & Nutrition: specific foods to eat or avoid right now
2. 🧘 Relaxation & Therapy: a specific activity (yoga pose, breathing, affirmation)
3. 💊 Care Tip: a practical self-care tip for this phase
Keep it warm, non-judgmental, under 180 words total. Use the emojis as headers. Do not use asterisks or markdown.`;
    const text = await askClaude(prompt);
    setAiSuggestion(text);
    setAiLoading(false);
  };

  const recent = logs.slice(-7).reverse();
  const avgPain = logs.length ? (logs.reduce((s, l) => s + l.painLevel, 0) / logs.length).toFixed(1) : "—";
  const avgMood = logs.length ? (logs.reduce((s, l) => s + l.moodLevel, 0) / logs.length).toFixed(1) : "—";

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 100px" }}>
      <h2 style={{ ...S.h2, fontSize: 26 }}>Hello, {user.name.split(" ")[0]} 🌸</h2>
      <p style={{ ...S.muted, marginBottom: 20 }}>Here's your cycle overview</p>

      <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
        <CycleRing dayOfCycle={dayOfCycle} cycleLength={cycleLength} hasData={!!cycleStart} />
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 13, color: "#9b6b8a", fontWeight: 600, marginBottom: 4 }}>CURRENT PHASE</div>
          <div style={{ fontSize: 20, fontWeight: 700, color, marginBottom: 12 }}>{phase}</div>
          <div style={{ fontSize: 12, color: "#9b6b8a" }}>Next period</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#e879a0" }}>{nextPeriod}</div>
          <div style={{ fontSize: 12, color: "#9b6b8a", marginTop: 8 }}>Cycle length</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#a855f7" }}>{cycleLength} days</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Logs" value={logs.length} color="#e879a0" />
        <StatCard label="Avg Pain" value={avgPain} color="#a855f7" unit="/10" />
        <StatCard label="Avg Mood" value={avgMood} color="#1D9E75" unit="/5" />
      </div>

      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>🤖 AI Wellness Suggestions</h3>
          <button style={{ ...S.btn, ...S.btnPrimary, padding: "8px 18px", fontSize: 13 }} onClick={getAISuggestion} disabled={aiLoading}>
            {aiLoading ? "Loading…" : "Refresh ✨"}
          </button>
        </div>
        {aiLoading && (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#a855f7" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🌸</div>
            <p style={S.muted}>Getting personalized suggestions…</p>
          </div>
        )}
        {!aiSuggestion && !aiLoading && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <p style={S.muted}>Tap "Refresh" to get AI-powered food, relaxation, and care tips tailored to your cycle phase.</p>
          </div>
        )}
        {aiSuggestion && (
          <div style={{ fontSize: 14, lineHeight: 1.8, color: "#2d1b2e", whiteSpace: "pre-wrap" }}>{aiSuggestion}</div>
        )}
      </div>

      <div style={S.card}>
        <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>📅 Recent Entries</h3>
        {recent.length === 0 && <p style={S.muted}>No entries yet. Start logging today!</p>}
        {recent.map(e => {
          const flowLabels = ["None", "Spotting", "Light", "Medium", "Heavy", "Very Heavy"];
          return (
            <div key={e.date} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid #fce7f3" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: e.flowLevel > 0 ? "linear-gradient(135deg, #e879a0, #a855f7)" : "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {e.flowLevel > 0 ? "🌑" : "📝"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{new Date(e.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</div>
                <div style={{ fontSize: 12, color: "#9b6b8a", marginTop: 2 }}>
                  Flow: <b>{flowLabels[e.flowLevel]}</b> · Pain: <b>{e.painLevel}/10</b> · Mood: <b>{e.moodLevel}/5</b>
                </div>
                {e.symptoms.length > 0 && <div style={{ fontSize: 11, color: "#a855f7", marginTop: 2 }}>{e.symptoms.slice(0, 3).join(" · ")}{e.symptoms.length > 3 ? " +" + (e.symptoms.length - 3) : ""}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── HISTORY SCREEN ───────────────────────────────────────────────────────────
function HistoryScreen({ user, token }) {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/logs/" + user.id, { headers: { "Authorization": `Bearer ${token}` } });
    const valid = await res.json();
    setLogs(valid);    }
    load();
  }, []);

  const filtered = logs.filter(e => {
    if (filter === "period") return e.flowLevel > 0;
    if (filter === "pain") return e.painLevel >= 6;
    if (filter === "mood") return e.moodLevel <= 2;
    return true;
  });

  const flowLabels = ["None", "Spotting", "Light", "Medium", "Heavy", "Very Heavy"];
  const flowColors = ["#d0d0d0", "#f9a8d4", "#e879a0", "#db2777", "#be185d", "#831843"];

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 100px" }}>
      <h2 style={{ ...S.h2, fontSize: 26 }}>📚 Cycle History</h2>
      <p style={{ ...S.muted, marginBottom: 20 }}>{logs.length} entries tracked</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[["all", "All Entries"], ["period", "Period Days"], ["pain", "High Pain"], ["mood", "Low Mood"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ ...S.btn, padding: "8px 16px", fontSize: 13, ...(filter === v ? S.btnPrimary : S.btnOutline) }}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 && <div style={{ ...S.card, textAlign: "center", padding: "40px 20px" }}><p style={S.muted}>No entries match this filter.</p></div>}

      {filtered.map(e => (
        <div key={e.date} style={{ ...S.card, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {new Date(e.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
            {e.flowLevel > 0 && (
              <span style={{ ...S.tag, background: flowColors[e.flowLevel] + "30", color: flowColors[e.flowLevel], border: `1px solid ${flowColors[e.flowLevel]}40` }}>{flowLabels[e.flowLevel]}</span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: e.symptoms.length ? 10 : 0 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#9b6b8a", textTransform: "uppercase", fontWeight: 600 }}>Pain</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: e.painLevel >= 7 ? "#e53e3e" : e.painLevel >= 4 ? "#dd6b20" : "#1D9E75" }}>{e.painLevel}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#9b6b8a", textTransform: "uppercase", fontWeight: 600 }}>Mood</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#e879a0" }}>{e.moodLevel}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#9b6b8a", textTransform: "uppercase", fontWeight: 600 }}>Energy</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#a855f7" }}>{e.energyLevel}</div>
            </div>
          </div>

          {e.symptoms.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {e.symptoms.map(s => <span key={s} style={{ ...S.tag, background: "#f3e8ff", color: "#7c3aed", fontSize: 11 }}>{s}</span>)}
            </div>
          )}

          {e.notes && <div style={{ fontSize: 13, color: "#9b6b8a", fontStyle: "italic", borderTop: "1px solid #fce7f3", paddingTop: 8, marginTop: 4 }}>"{e.notes}"</div>}
        </div>
      ))}
    </div>
  );
}

// ─── PROFILE SCREEN ───────────────────────────────────────────────────────────
function ProfileScreen({ user, token, onLogout }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // Dynamically calculate age from dob
  const userAge = user.dob ? Math.floor((new Date() - new Date(user.dob).getTime()) / 3.15576e+10) : user.age || 0;

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/logs/" + user.id, { headers: { "Authorization": `Bearer ${token}` } });
    const entries = await res.json();
    setLogs(entries);    }
    load();
  }, []);

  const getInsight = async () => {
    setLoading(true);
    setInsight("");
    const totalPeriodDays = logs.filter(l => l.flowLevel > 0).length;
    const avgPain = logs.length ? (logs.reduce((s, l) => s + l.painLevel, 0) / logs.length).toFixed(1) : 0;
    const commonSymptoms = {};
    logs.forEach(l => l.symptoms.forEach(s => { commonSymptoms[s] = (commonSymptoms[s] || 0) + 1; }));
    const topSymptoms = Object.entries(commonSymptoms).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s).join(", ");

    const prompt = `You are a compassionate women's health coach. Give a warm, personalized health insight summary for a ${userAge}-year-old woman who has been tracking for ${logs.length} days. Stats: ${totalPeriodDays} period days logged, average pain score ${avgPain}/10, most common symptoms: ${topSymptoms || "none yet"}. 

Write 2-3 short paragraphs covering:
1. A positive observation about their tracking habits
2. One gentle health insight based on their patterns  
3. One encouragement or reminder for their age group (teens need different guidance than 30s or 40s+)

Keep it under 150 words. Warm, non-judgmental tone. No asterisks or markdown formatting.`;
    const text = await askClaude(prompt);
    setInsight(text);
    setLoading(false);
  };

  const ageGroup = parseInt(userAge) < 20 ? "Teen" : parseInt(userAge) < 35 ? "Adult" : parseInt(userAge) < 45 ? "Premenopausal" : "Perimenopausal";

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 100px" }}>
      <div style={{ ...S.card, textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #e879a0, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 12px" }}>
          {user.name[0].toUpperCase()}
        </div>
        <h2 style={{ ...S.h2, fontSize: 22, marginBottom: 4 }}>{user.name}</h2>
        <p style={S.muted}>{user.email || user.mobile}</p>
        <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 50, background: "#f3e8ff", color: "#7c3aed", fontSize: 12, fontWeight: 700, marginTop: 8 }}>
          {ageGroup} · Age {userAge}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Logs" value={logs.length} color="#e879a0" />
        <StatCard label="Period Days" value={logs.filter(l => l.flowLevel > 0).length} color="#a855f7" />
      </div>

      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>🧠 AI Health Insight</h3>
          <button style={{ ...S.btn, ...S.btnPrimary, padding: "7px 16px", fontSize: 13 }} onClick={getInsight} disabled={loading}>
            {loading ? "…" : "Generate"}
          </button>
        </div>
        {loading && <p style={S.muted}>Analyzing your patterns…</p>}
        {insight && <p style={{ fontSize: 14, lineHeight: 1.8, color: "#2d1b2e", margin: 0 }}>{insight}</p>}
        {!insight && !loading && <p style={S.muted}>Get a personalized health insight based on your tracked data.</p>}
      </div>

      <div style={S.card}>
        <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>⚙️ Account</h3>
        <div style={{ fontSize: 14, color: "#9b6b8a", marginBottom: 4 }}>Gender: Female · Age: {userAge}</div>
        <div style={{ fontSize: 14, color: "#9b6b8a", marginBottom: 16 }}>Member since: {new Date(user.createdAt).toLocaleDateString("en-IN")}</div>
        <button style={{ ...S.btn, background: "#fff0f3", color: "#c0002a", border: "1.5px solid #ffb3c6", width: "100%" }} onClick={onLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── REMINDER SCREEN ─────────────────────────────────────────────────────────
function RemindersScreen({ user, token }) {
  const [reminders, setReminders] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReminders, setAiReminders] = useState("");

  const defaultReminders = [
    { id: 1, label: "Log today's entry", time: "8:00 PM", active: true, icon: "📓" },
    { id: 2, label: "Period due soon reminder", time: "2 days before", active: true, icon: "🌑" },
    { id: 3, label: "Ovulation window", time: "Cycle day 12", active: true, icon: "🌕" },
    { id: 4, label: "Take iron supplements", time: "During period", active: false, icon: "💊" },
    { id: 5, label: "Hydration reminder", time: "Every 3 hours", active: false, icon: "💧" },
  ];

  useEffect(() => {
    fetch("/api/reminders/" + user.id, { headers: { "Authorization": `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d && d.reminders) {
          setReminders(d.reminders);
        } else {
          setReminders(defaultReminders);
          fetch("/api/reminders/" + user.id, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ reminders: defaultReminders })
          });
        }
      });
  }, []);

  const toggle = (id) => {
    const updated = reminders.map(r => r.id === id ? { ...r, active: !r.active } : r);
    setReminders(updated);
    fetch("/api/reminders/" + user.id, {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ reminders: updated })
    });
  };

  const getAIReminders = async () => {
    setAiLoading(true);
    setAiReminders("");
    const prompt = `You are a women's health assistant. A ${user.age}-year-old woman wants personalized cycle-based reminders. 
Generate 4 specific, actionable daily/weekly reminders she should set for self-care throughout her cycle. 
Format each as: [Emoji] Title — When to set it — Why it matters (one sentence)
Cover: nutrition, exercise, emotional check-in, and one phase-specific tip.
Keep it practical, warm, under 180 words. No markdown asterisks.`;
    const text = await askClaude(prompt);
    setAiReminders(text);
    setAiLoading(false);
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 100px" }}>
      <h2 style={{ ...S.h2, fontSize: 26 }}>🔔 Reminders</h2>
      <p style={{ ...S.muted, marginBottom: 20 }}>Stay on top of your cycle with smart reminders</p>

      <div style={S.card}>
        {reminders.map(r => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #fce7f3" }}>
            <div style={{ fontSize: 24 }}>{r.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.label}</div>
              <div style={{ fontSize: 12, color: "#9b6b8a" }}>{r.time}</div>
            </div>
            <div onClick={() => toggle(r.id)} style={{ width: 44, height: 24, borderRadius: 50, background: r.active ? "linear-gradient(135deg, #e879a0, #a855f7)" : "#e0d0d8", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: r.active ? 22 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>✨ AI-Suggested Reminders</h3>
          <button style={{ ...S.btn, ...S.btnPrimary, padding: "7px 16px", fontSize: 13 }} onClick={getAIReminders} disabled={aiLoading}>
            {aiLoading ? "…" : "Generate"}
          </button>
        </div>
        {aiLoading && <p style={S.muted}>Crafting your personalized reminders…</p>}
        {aiReminders && <div style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap", color: "#2d1b2e" }}>{aiReminders}</div>}
        {!aiReminders && !aiLoading && <p style={S.muted}>Get personalized reminder suggestions based on your age and cycle needs.</p>}
      </div>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: "dashboard", icon: "🏠", label: "Home" },
  { key: "log", icon: "📓", label: "Log" },
  { key: "history", icon: "📅", label: "History" },
  { key: "reminders", icon: "🔔", label: "Reminders" },
  { key: "profile", icon: "👤", label: "Profile" },
];

function NavBar({ active, onNav }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 520, margin: "0 auto", background: "rgba(255,245,247,0.97)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(216,90,142,0.15)", display: "flex", justifyContent: "space-around", padding: "8px 0 env(safe-area-inset-bottom, 8px)", zIndex: 200 }}>
      {NAV_ITEMS.map(n => (
        <button key={n.key} onClick={() => onNav(n.key)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "transparent", border: "none", cursor: "pointer", padding: "4px 12px" }}>
          <span style={{ fontSize: active === n.key ? 24 : 20, transition: "font-size 0.15s", filter: active === n.key ? "none" : "grayscale(0.5) opacity(0.6)" }}>{n.icon}</span>
          <span style={{ fontSize: 10, fontWeight: active === n.key ? 700 : 500, color: active === n.key ? "#e879a0" : "#9b6b8a", letterSpacing: 0.3, fontFamily: "inherit" }}>{n.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("splash");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    Promise.all([DB.get("current_user"), DB.get("token")]).then(([u, t]) => {
      if (u && t) { setUser(u); setToken(t); setScreen("app"); }
    });
  }, []);

  const handleLogin = (u, t) => { setUser(u); setToken(t); setScreen("app"); setTab("dashboard"); };
  const handleLogout = async () => { await DB.set("current_user", null); await DB.set("token", null); setUser(null); setToken(null); setScreen("splash"); };

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap" rel="stylesheet" />
      {screen === "splash" && <Splash onStart={s => setScreen(s)} />}
      {screen === "register" && <RegisterScreen onDone={handleLogin} />}
      {screen === "login" && <LoginScreen onDone={handleLogin} onRegister={() => setScreen("register")} />}
      {screen === "app" && user && token && (
        <>
          {tab === "dashboard" && <Dashboard user={user} token={token} />}
          {tab === "log" && <LogScreen user={user} token={token} onSave={() => setTab("dashboard")} />}
          {tab === "history" && <HistoryScreen user={user} token={token} />}
          {tab === "reminders" && <RemindersScreen user={user} token={token} />}
          {tab === "profile" && <ProfileScreen user={user} token={token} onLogout={handleLogout} />}
          <NavBar active={tab} onNav={setTab} />
        </>
      )}
    </div>
  );
}
