import { headers } from "next/headers";
import ContactForm from "@/components/ContactForm";
import Projects from "@/components/Projects";
import Typing from "@/components/Typing";

const STACK = ["Python", "FastAPI", "n8n", "Excel", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "Supabase", "Vercel", "Git & GitHub"];

const PROCESS = [
  ["01", "Understand", "I first understand the business problem, workflow and the result you actually need."],
  ["02", "Build", "I turn the requirement into a practical website, automation or custom software tool."],
  ["03", "Test", "I test the important flows, forms and responsive layouts before calling it finished."],
  ["04", "Deliver", "You get a usable solution with clear next steps for updates and improvements."],
];

export default async function Home() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <header className="site-header">
        <nav className="wrap nav" aria-label="Main navigation">
          <a className="sig" href="#top">Tabish Ali Khan</a>
          <ul>
            <li><a href="#about">About</a></li><li><a href="#services">Services</a></li>
            <li><a href="#process">Process</a></li><li><a href="#projects">Projects</a></li>
            <li><a href="#stack">Stack</a></li><li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <main id="top">
        <section className="wrap hero" aria-labelledby="hero-title">
          <p className="hello">Assalamu Alaikum</p>
          <h1 id="hero-title">Tabish Ali Khan</h1>
          <div className="rule" aria-hidden="true"><i /><b /></div>
          <p className="role">AI Automation Developer</p>
          <Typing />
          <p className="hero-copy">I build practical automations, business websites, web apps and AI-powered tools that solve real problems.</p>
          <div className="cta"><a className="btn solid" href="#projects">See my work</a><a className="btn ghost" href="#contact">Start a project</a></div>
        </section>

        <section className="block" id="about"><div className="wrap">
          <p className="eyebrow"><i />About</p><h2>Building useful software, not just demos.</h2>
          <p className="lead">I build software for real business problems: automations that remove repetitive work, Excel reports that update themselves, and fast websites and web apps.</p>
          <p className="lead muted">I work with modern tools and AI-assisted development to ship quickly while keeping the important parts reliable, secure and maintainable. I am open to freelance work with clients worldwide.</p>
          <div className="mini-stats" aria-label="What I focus on"><div><strong>Automation</strong><span>Reduce repetitive work</span></div><div><strong>Web</strong><span>Fast, responsive experiences</span></div><div><strong>AI</strong><span>Useful business workflows</span></div></div>
        </div></section>

        <section className="block" id="services"><div className="wrap">
          <p className="eyebrow"><i />Services</p><h2>What I Can Build For You</h2>
          <div className="grid">
            <article className="card"><span className="card-number">01</span><h3>Automation</h3><p>n8n workflows that move data, send alerts and handle routine tasks automatically.</p></article>
            <article className="card"><span className="card-number">02</span><h3>Excel & Reports</h3><p>Reports and dashboards that bring the numbers together without repetitive copy-paste work.</p></article>
            <article className="card"><span className="card-number">03</span><h3>Websites</h3><p>Fast, mobile-friendly business websites with clean design and an admin panel when needed.</p></article>
            <article className="card"><span className="card-number">04</span><h3>Web Apps</h3><p>Custom tools with authentication, database features and practical business workflows.</p></article>
          </div>
        </div></section>

        <section className="block" id="process"><div className="wrap">
          <p className="eyebrow"><i />Process</p><h2>From idea to working product.</h2>
          <div className="process-grid">{PROCESS.map(([number, title, text]) => <article className="process-card" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div></section>

        <section className="block" id="projects"><div className="wrap">
          <p className="eyebrow"><i />Work</p><h2>Featured Projects</h2>
          <p className="lead muted">A selection of software and business projects. More projects can be added and managed from the admin panel.</p><Projects />
        </div></section>

        <section className="block" id="stack"><div className="wrap">
          <p className="eyebrow"><i />Tools</p><h2>Tech Stack</h2>
          <div className="stack">{STACK.map((s) => <span key={s}>{s}</span>)}</div>
        </div></section>

        <section className="block contact-section" id="contact"><div className="wrap">
          <p className="eyebrow"><i />Contact</p><h2>Have a problem worth solving?</h2>
          <p className="lead muted">Tell me what you want to automate or build, and I will reply with a practical plan.</p>
          <div className="contact-grid"><ContactForm nonce={nonce} /><div className="rows">
            <div className="row"><span className="k">Email</span><span className="v"><a href="mailto:tk44211@gmail.com">tk44211@gmail.com</a></span></div>
            <div className="row"><span className="k">GitHub</span><span className="v"><a href="https://github.com/Hamza313-cyber" target="_blank" rel="noopener noreferrer">github.com/Hamza313-cyber</a></span></div>
            <div className="row"><span className="k">Work</span><span className="v">Freelance & worldwide projects</span></div>
            <div className="row"><span className="k">Response</span><span className="v">I will reply by email</span></div>
          </div></div>
        </div></section>
      </main>

      <footer className="site-footer"><div className="wrap">
        <p className="sig">Tabish Ali Khan</p><p className="small">AI Automation · Websites · Web Apps · Business Tools</p>
        <div className="footer-links"><a href="#top">Back to top</a><a href="https://github.com/Hamza313-cyber" target="_blank" rel="noopener noreferrer">GitHub</a><a href="mailto:tk44211@gmail.com">Email</a></div>
        <p className="copyright">© {new Date().getFullYear()} Tabish Ali Khan. All rights reserved.</p>
      </div></footer>
    </>
  );
}
