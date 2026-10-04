import { headers } from "next/headers";
import ContactForm from "@/components/ContactForm";
import Projects from "@/components/Projects";
import Typing from "@/components/Typing";

const STACK = ["Python", "FastAPI", "n8n", "Excel", "JavaScript", "TypeScript", "React", "Next.js",
  "Tailwind CSS", "Supabase", "Vercel", "Git & GitHub"];

export default async function Home() {
  // The CSP nonce set by proxy.ts, passed to the one outside script (Turnstile).
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <header className="site-header">
        <nav className="wrap nav" aria-label="Main">
          <a className="sig" href="#top">Tabish Ali Khan</a>
          <ul>
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#projects">Projects</a></li>
            <li><a href="#stack">Stack</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <main id="top">
        <section className="wrap hero">
          <p className="hello">Assalamu Alaikum</p>
          <h1>Tabish Ali Khan</h1>
          <div className="rule" aria-hidden="true"><i /><b /></div>
          <p className="role">AI Automation Developer</p>
          <Typing />
          <div className="cta">
            <a className="btn solid" href="#projects">See my work</a>
            <a className="btn ghost" href="#contact">Contact me</a>
          </div>
        </section>

        <section className="block" id="about">
          <div className="wrap">
            <p className="eyebrow"><i />About</p>
            <h2>About Me</h2>
            <p className="lead">
              I build software for real business problems: automations that remove repetitive work,
              Excel reports that update themselves, and fast websites and web apps.
            </p>
            <p className="lead muted">
              I work with modern tools and AI-assisted development, so I ship quickly. Right now I am going
              deeper into n8n, Python and software development. I am open to freelance work with clients worldwide.
            </p>
          </div>
        </section>

        <section className="block" id="services">
          <div className="wrap">
            <p className="eyebrow"><i />Services</p>
            <h2>What I Can Build For You</h2>
            <div className="grid">
              <article className="card"><h3>Automation</h3><p>n8n workflows that move data, send alerts and handle routine tasks on their own.</p></article>
              <article className="card"><h3>Excel</h3><p>Reports and dashboards that pull the numbers together without manual copy-paste.</p></article>
              <article className="card"><h3>Websites</h3><p>Fast, mobile-friendly business websites, with an admin panel when you need one.</p></article>
              <article className="card"><h3>Web Apps</h3><p>Tools with login and a database, built with React, Python and Supabase.</p></article>
            </div>
          </div>
        </section>

        <section className="block" id="projects">
          <div className="wrap">
            <p className="eyebrow"><i />Work</p>
            <h2>Featured Projects</h2>
            <Projects />
          </div>
        </section>

        <section className="block" id="stack">
          <div className="wrap">
            <p className="eyebrow"><i />Tools</p>
            <h2>Tech Stack</h2>
            <div className="stack">{STACK.map((s) => <span key={s}>{s}</span>)}</div>
          </div>
        </section>

        <section className="block" id="contact">
          <div className="wrap">
            <p className="eyebrow"><i />Contact</p>
            <h2>Let&apos;s Work Together</h2>
            <p className="lead muted">Tell me what you want to automate or build, and I will reply with a plan.</p>
            <div className="contact-grid">
              <ContactForm nonce={nonce} />
              <div className="rows">
                <div className="row"><span className="k">Email</span><span className="v">tk44211@gmail.com</span></div>
                <div className="row"><span className="k">GitHub</span><span className="v"><a href="https://github.com/Hamza313-cyber" target="_blank" rel="noopener noreferrer">github.com/Hamza313-cyber</a></span></div>
                <div className="row"><span className="k">Fiverr</span><span className="v soon">Coming soon</span></div>
                <div className="row"><span className="k">LinkedIn</span><span className="v soon">Coming soon</span></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p className="sig">Tabish Ali Khan</p>
        <p className="small">Thanks for visiting</p>
      </footer>
    </>
  );
}
