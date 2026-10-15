const { useState } = React;

function AuthApp() {
  const [mode, setMode] = useState("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (mode === "register" && form.password !== form.confirm) {
      setError("Your passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      window.location.href = data.next;
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-shell">
    <nav className="top-nav">
      <a className="brand" href="/"><span className="brand-mark">✿</span><span><b>Sakhi Health</b><small>Understand · Learn · Care</small></span></a>
      <span className="nav-note">A gentler way to understand your health</span>
    </nav>
    <section className="auth-layout">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot"></span> YOUR HEALTH, YOUR STRENGTH</div>
        <h1>Feel heard.<br/><em>Understand more.</em></h1>
        <p className="hero-lead">A safe, supportive space to make sense of symptoms and find guidance toward appropriate care.</p>
        <div className="benefit-list">
          <div><span>♡</span><p><b>Understand your symptoms</b><small>Clear information, without the medical jargon.</small></p></div>
          <div><span>⌁</span><p><b>Your language matters</b><small>Designed for everyday words and regional languages.</small></p></div>
          <div><span>✧</span><p><b>Know your next step</b><small>Prepare for a more informed care conversation.</small></p></div>
        </div>
        <div className="health-note"><span className="note-flower">✿</span><div><b>Women's health matters.</b><p>Know your body, understand changes, and take informed steps toward a healthier, happier you.</p></div></div>
      </div>
      <div className="auth-card glass-card">
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => {setMode("login");setError("");}}>Login</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => {setMode("register");setError("");}}>Register</button>
        </div>
        <div className="form-heading"><span className="form-icon">✿</span><h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2><p>{mode === "login" ? "Continue your health journey with care." : "Start your journey toward better health."}</p></div>
        <form onSubmit={submit}>
          {mode === "register" && <label className="field-label">Full name<input className="form-control" name="name" value={form.name} onChange={update} placeholder="What should we call you?" autoComplete="name" required/></label>}
          <label className="field-label">Email address<input className="form-control" type="email" name="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" required/></label>
          <label className="field-label">Password<input className="form-control" type="password" name="password" value={form.password} onChange={update} placeholder="At least 8 characters" minLength="8" autoComplete={mode === "login" ? "current-password" : "new-password"} required/></label>
          {mode === "register" && <label className="field-label">Confirm password<input className="form-control" type="password" name="confirm" value={form.confirm} onChange={update} placeholder="Enter password again" minLength="8" autoComplete="new-password" required/></label>}
          {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
          <button className="btn btn-sakhi w-100 mt-2" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Login to your space →" : "Create account →"}</button>
        </form>
        <p className="switch-copy">{mode === "login" ? "New to Sakhi Health?" : "Already have an account?"} <button onClick={() => {setMode(mode === "login" ? "register" : "login");setError("");}}>{mode === "login" ? "Register here" : "Login here"}</button></p>
        <div className="privacy-line"><span>♧</span> Your health information deserves care and privacy.</div>
      </div>
    </section>
    <footer className="site-footer">Made with care for every woman's health journey <span>♡</span> <small> · Educational guidance only, not a diagnosis.</small></footer>
  </main>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<AuthApp />);