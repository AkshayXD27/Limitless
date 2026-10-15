const { useState } = React;

function AuthApp() {
  const [mode, setMode] = useState("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  function formatFirebaseError(err) {
    const code = err?.code || "";
    if (code === "auth/email-already-in-use") {
      return "An account with this email already exists. Please log in.";
    }
    if (code === "auth/invalid-email") {
      return "Please enter a valid email address.";
    }
    if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
      return "Email or password was not recognized.";
    }
    if (code === "auth/weak-password") {
      return "Password is too weak. Please use at least 8 characters.";
    }
    if (code === "auth/popup-closed-by-user") {
      return "Sign-in popup was closed before completing.";
    }
    if (code === "auth/unauthorized-domain") {
      return "This domain is not yet authorized in Firebase Console (Authentication > Settings > Authorized domains). Add your Vercel URL to continue.";
    }
    if (code === "auth/operation-not-allowed") {
      return "Email/Password sign-in is disabled in Firebase Console (Authentication > Sign-in method). Please enable it.";
    }
    return err?.message || "Authentication failed. Please check your credentials and try again.";
  }

  async function syncSessionWithServer(userObj, authProvider = "firebase") {
    const response = await fetch("/api/auth/firebase-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userObj.email,
        name: userObj.displayName || form.name || "",
        firebaseUid: userObj.uid,
        authProvider
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to establish server session.");
    return data;
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (mode === "register" && form.password !== form.confirm) {
      setError("Your passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      // 1. If Firebase Auth is loaded on window, authenticate with Firebase
      if (window.SakhiFirebase && window.SakhiFirebase.isLoaded) {
        let firebaseUser;
        if (mode === "register") {
          firebaseUser = await window.SakhiFirebase.registerWithEmail(form.name, form.email, form.password);
        } else {
          firebaseUser = await window.SakhiFirebase.loginWithEmail(form.email, form.password);
        }

        // Sync authenticated Firebase user to MongoDB & establish Express session
        const sessionData = await syncSessionWithServer(firebaseUser, "firebase");
        window.location.href = sessionData.next;
        return;
      }

      // 2. Direct server fallback if Firebase client hasn't loaded
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authentication failed.");
      window.location.href = data.next;
    } catch (err) {
      console.error("Auth submit error:", err);
      setError(formatFirebaseError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setBusy(true);
    try {
      if (!window.SakhiFirebase || !window.SakhiFirebase.loginWithGoogle) {
        throw new Error("Google sign-in is initializing. Please wait a moment and try again.");
      }

      const firebaseUser = await window.SakhiFirebase.loginWithGoogle();
      const sessionData = await syncSessionWithServer(firebaseUser, "google");
      window.location.href = sessionData.next;
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError(formatFirebaseError(err));
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

        <button type="button" className="btn-google" onClick={handleGoogleSignIn} disabled={busy}>
          <svg viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{mode === "login" ? "Continue with Google" : "Sign up with Google"}</span>
        </button>

        <div className="auth-divider">or with email</div>

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