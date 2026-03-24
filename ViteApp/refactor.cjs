const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Replace askClaude
content = content.replace(
  /async function askClaude\(prompt\) \{[\s\S]*?return data.*?\|\| "(.*?)";\n\}/g,
  `async function askClaude(prompt) {
  try {
    const res = await fetch("/api/ai/suggestion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return data.content || "$1";
  } catch(e) { return "$1"; }
}`
);

// RegisterScreen Send OTP
content = content.replace(
  /const handleSendOtp = async \(\) => \{[\s\S]*?setStep\(2\);\n  \};/g,
  `const handleSendOtp = async () => {
    if (!form.name || !form.age || (!form.email && !form.mobile) || !form.password) { setErr("Please fill all fields."); return; }
    if (parseInt(form.age) < 10 || parseInt(form.age) > 60) { setErr("Age must be between 10–60."); return; }
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
  };`
);

// RegisterScreen Verify
content = content.replace(
  /const handleVerify = async \(\) => \{[\s\S]*?onDone\(user\);\n  \};/g,
  `const handleVerify = async () => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register.");
      await DB.set("current_user", data.user);
      setErr("");
      onDone(data.user);
    } catch(e) { setErr(e.message); }
  };`
);

// LoginScreen
const loginRepl = `const handleSendOtp = async () => {
    if (!email) { setErr("Please enter email"); return; }
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error("Failed to send OTP.");
      setErr("");
      setMsg("OTP sent to your email!");
      setStep(2);
    } catch (e) { setErr(e.message); }
  };

  const handleOtpLogin = async () => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      await DB.set("current_user", data.user);
      onDone(data.user);
    } catch (e) { setErr(e.message); }
  };

  const handlePasswordLogin = async () => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      await DB.set("current_user", data.user);
      onDone(data.user);
    } catch (e) { setErr(e.message); }
  };`;

content = content.replace(
  /const handleSendOtp = async \(\) => \{[\s\S]*?onDone\(user\);\n  \};/g,
  loginRepl
);

// LogScreen UseEffect
content = content.replace(
  /useEffect\(\(\) => \{\n    DB\.get\("log_" \+ user\.id \+ "_" \+ today\)\.then\(d => \{ if \(d\) setEntry\(d\); \}\);\n  \}, \[\]\);/g,
  `useEffect(() => {
    fetch("/api/log/" + user.id + "/" + today)
      .then(r => r.json())
      .then(d => { if (d) setEntry({ ...entry, ...d }); });
  }, []);`
);

// LogScreen Save
content = content.replace(
  /const handleSave = async \(\) => \{[\s\S]*?1500\);\n  \};/g,
  `const handleSave = async () => {
    setLoading(true);
    await fetch("/api/logs/" + user.id, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry)
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onSave && onSave(); }, 1500);
  };`
);

// Replace loadData lines in Dashboard, History, Profile
const loadRegex = /const idx = \(await DB\.get\("log_index_" \+ user\.id\)\) \|\| \[\];\n\s*const entries = await Promise\.all\(idx\.map\(d => DB\.get\("log_" \+ user\.id \+ "_" \+ d\)\)\);\n\s*(const valid = entries\.filter\(Boolean\)(.*?);\n\s*setLogs\((valid|entries.*?)\);|setLogs\(entries\.filter.*?;\n)/g;
content = content.replace(loadRegex, (match, p1, p2, p3) => {
  if (p1 && p1.includes('sort')) {
     return `const res = await fetch("/api/logs/" + user.id);
    const valid = await res.json();
    setLogs(valid);`;
  }
  return `const res = await fetch("/api/logs/" + user.id);
    const entries = await res.json();
    setLogs(entries);`;
});

// Update ProfileScreen load to be proper list
content = content.replace(
  /const idx = \(await DB\.get\("log_index_" \+ user\.id\)\) \|\| \[\];\n\s*const entries = await Promise\.all\(idx\.map\(d => DB\.get\("log_" \+ user\.id \+ "_" \+ d\)\)\);\n\s*setLogs\(entries\.filter\(Boolean\)\);/g,
  `const res = await fetch("/api/logs/" + user.id);
      const entries = await res.json();
      setLogs(entries);`
);
// Update HistoryScreen load safely
content = content.replace(
  /const idx = \(await DB\.get\("log_index_" \+ user\.id\)\) \|\| \[\];\n\s*const entries = await Promise\.all\(idx\.map\(d => DB\.get\("log_" \+ user\.id \+ "_" \+ d\)\)\);\n\s*setLogs\(entries\.filter\(Boolean\)\.sort\(\(a, b\) => b\.date\.localeCompare\(a\.date\)\)\);/g,
  `const res = await fetch("/api/logs/" + user.id);
      const entries = await res.json();
      setLogs(entries.sort((a, b) => b.date.localeCompare(a.date)));`
);


fs.writeFileSync(targetFile, content);
console.log("Successfully replaced frontend React code mappings!")
