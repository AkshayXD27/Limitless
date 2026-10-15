const { useState } = React;

const sections = [
  { key:"basic", title:"Basic information", subtitle:"A few basics help us make the experience more relevant." },
  { key:"medical", title:"Medical history", subtitle:"Share anything you feel comfortable sharing." },
  { key:"family", title:"Family history", subtitle:"Some health patterns can run in families." },
  { key:"symptoms", title:"Current symptoms", subtitle:"Use your own words. You can write in a regional language." },
  { key:"work", title:"Work & lifestyle", subtitle:"Daily routines can be useful context for a care conversation." },
  { key:"meds", title:"Medications", subtitle:"Include medicines, supplements, and whether you currently take them." },
  { key:"review", title:"Review & continue", subtitle:"Check your information before continuing." }
];

function Onboarding() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    age:"", height:"", weight:"", medicalHistory:"", familyHistory:"",
    symptoms:"", workHistory:"", medications:"", language:"English"
  });
  const update = event => setForm({ ...form, [event.target.name]: event.target.value });
  const section = sections[step];

  async function finish() {
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/profile", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please check your information.");
      window.location.href = data.next;
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <main className="onboarding-shell">
    <nav className="top-nav"><a className="brand" href="/"><span className="brand-mark">✿</span><span><b>Sakhi Health</b><small>Understand · Learn · Care</small></span></a><span className="nav-note">Your information stays yours</span></nav>
    <div className="onboarding-wrap">
      <aside className="step-sidebar glass-card">
        <div className="step-intro"><span className="mini-flower">✿</span><h2>Let's get to know you</h2><p>Your profile helps you keep useful health notes in one place.</p></div>
        <div className="step-list">{sections.map((item,index)=><button key={item.key} onClick={()=>setStep(index)} className={`step-item ${index===step?"current":""} ${index<step?"done":""}`}><span className="step-number">{index<step?"✓":index+1}</span><span>{item.title}</span></button>)}</div>
        <div className="sidebar-privacy"><span>♡</span><p><b>Your privacy matters</b><br/>Only share what you feel comfortable sharing. This prototype stores information in temporary server memory.</p></div>
      </aside>
      <section className="onboarding-card glass-card">
        <div className="progress-meta"><span>YOUR HEALTH PROFILE</span><span>STEP {step+1} OF {sections.length}</span></div>
        <div className="progress"><div className="progress-bar" style={{width:`${(step+1)/sections.length*100}%`}}></div></div>
        <h1>{section.title}</h1><p className="section-subtitle">{section.subtitle}</p>
        {step===0 && <div className="row g-3">
          <div className="col-md-4"><label className="field-label">Age<input className="form-control" type="number" min="13" max="120" name="age" value={form.age} onChange={update} placeholder="e.g. 24" required/></label></div>
          <div className="col-md-4"><label className="field-label">Height (cm)<input className="form-control" type="number" min="50" max="250" name="height" value={form.height} onChange={update} placeholder="e.g. 162" required/></label></div>
          <div className="col-md-4"><label className="field-label">Weight (kg)<input className="form-control" type="number" min="20" max="500" name="weight" value={form.weight} onChange={update} placeholder="e.g. 58" required/></label></div>
          <div className="col-12"><label className="field-label">Preferred language<select className="form-select" name="language" value={form.language} onChange={update}><option>English</option><option>Telugu</option><option>Hindi</option><option>Kannada</option><option>Tamil</option></select></label></div>
        </div>}
        {step===1 && <label className="field-label">Medical history<textarea className="form-control large-textarea" name="medicalHistory" value={form.medicalHistory} onChange={update} placeholder="Any past conditions, surgeries, allergies, or health concerns? You can write 'Prefer not to say'."/></label>}
        {step===2 && <label className="field-label">Family health history<textarea className="form-control large-textarea" name="familyHistory" value={form.familyHistory} onChange={update} placeholder="For example, PCOS, diabetes, thyroid conditions, or other relevant family history."/></label>}
        {step===3 && <><label className="field-label">What symptoms or changes are you experiencing?<textarea className="form-control large-textarea" name="symptoms" value={form.symptoms} onChange={update} placeholder="Describe it naturally, in English or your preferred language. Include when it started if you know."/></label><div className="helper-note">You don't need medical terms. This tool can help explain information, but it cannot diagnose a condition.</div></>}
        {step===4 && <label className="field-label">Work, routine & lifestyle<textarea className="form-control large-textarea" name="workHistory" value={form.workHistory} onChange={update} placeholder="Work or study routine, shift work, sleep, activity, or other context you want to note."/></label>}
        {step===5 && <label className="field-label">Current or previous medications<textarea className="form-control large-textarea" name="medications" value={form.medications} onChange={update} placeholder="Medicine or supplement name, dose if known, and whether you currently use it. Don't stop prescribed medicines based on this app."/></label>}
        {step===6 && <div className="review-list">{[
          ["Age",form.age ? `${form.age} years` : "Not provided"],
          ["Height",form.height ? `${form.height} cm` : "Not provided"],
          ["Weight",form.weight ? `${form.weight} kg` : "Not provided"],
          ["Preferred language",form.language],
          ["Medical history",form.medicalHistory],
          ["Family history",form.familyHistory],
          ["Current symptoms",form.symptoms],
          ["Work & lifestyle",form.workHistory],
          ["Medications",form.medications]
        ].map(([label,value])=><div className="review-row" key={label}><b>{label}</b><span>{value || "Not provided"}</span></div>)}</div>}
        {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
        <div className="wizard-actions"><button className="btn btn-outline-sakhi" disabled={step===0} onClick={()=>setStep(value=>Math.max(0,value-1))}>← Back</button>{step<sections.length-1?<button className="btn btn-sakhi" onClick={()=>{setError("");if(step===0&&(!form.age||!form.height||!form.weight)){setError("Please complete age, height, and weight to continue.");return;}setStep(value=>value+1);}}>Continue →</button>:<button className="btn btn-sakhi" disabled={busy} onClick={finish}>{busy?"Saving…":"Go to dashboard →"}</button>}</div>
      </section>
    </div>
    <footer className="site-footer">You are more than a symptom. Take your health one step at a time. <span>♡</span></footer>
  </main>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Onboarding />);