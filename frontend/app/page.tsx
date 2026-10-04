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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Tabish Ali Khan",
    jobTitle: "AI Automation Developer",
    url: "https://tabish-portfolio-xi.vercel.app",
    email: "mailto:tk44211@gmail.com",
    sameAs: ["https://github.com/Hamza313-cyber"],
    knowsAbout: ["AI automation", "n8n", "Python", "Next.js", "FastAPI", "Business automation"],
  };

  return (
    <>
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="site-header">
        <nav className="wrap nav" aria-label="Main navigation">
          <a className="sig" href="#top"><span className="brand-mark" aria-hidden="true">TK.</span>Tabish Ali Khan</a>
          <ul>
            <li><a href="#about">About</a></li><li><a href="#services">Services</a></li>
            <li><a href="#process">Process</a></li><li><a href="#projects">Projects</a></li>
            <li><a href="#stack">Stack</a></li><li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <main id="top">
        <section className="hero-band" aria-labelledby="hero-title"><div className="wrap hero">
          <div className="hero-topline"><span>Independent developer</span><span>Automation / Web / AI</span></div>
          <p className="hello">Assalamu Alaikum</p>
          <h1 id="hero-title">Tabish Ali Khan</h1>
          <p className="role">AI Automation Developer</p>
          <Typing />
          <p className="hero-copy">I build practical automations, business websites, web apps and AI-powered tools that solve real problems.</p>
          <div className="cta"><a className="btn solid" href="#projects">Explore my work <span aria-hidden="true">↗</span></a><a className="btn ghost" href="#contact">Let&apos;s talk <span aria-hidden="true">↗</span></a></div>
          <div className="hero-bottom"><span>Practical ideas. Thoughtful execution.</span><a href="#about">Discover more <span aria-hidden="true">↓</span></a></div>
        </div></section>

        <section className="block" id="about"><div className="wrap">
          <p className="eyebrow"><i />01 / About me</p><h2>Less busywork.<br />More possibility.</h2>
          <p className="lead">I build software for real business problems: automations that remove repetitive work, Excel reports that update themselves, and fast websites and web apps.</p>
          <p className="lead muted">I work with modern tools and AI-assisted development to ship quickly while keeping the important parts reliable, secure and maintainable. I am open to freelance work with clients worldwide.</p>
          <div className="mini-stats" aria-label="What I focus on"><div><strong>Automation</strong><span>Reduce repetitive work</span></div><div><strong>Web</strong><span>Fast, responsive experiences</span></div><div><strong>AI</strong><span>Useful business workflows</span></div></div>
          <div className="trust-strip" aria-label="Why work with me"><div><strong>Practical first</strong><span>Built around your actual workflow</span></div><div><strong>Mobile ready</strong><span>Designed for phones and desktops</span></div><div><strong>Built to grow</strong><span>Easy to improve as your needs change</span></div></div>
        </div></section>

        <section className="block" id="services"><div className="wrap">
          <p className="eyebrow"><i />02 / What I do</p><h2>Built around your business.</h2>
          <div className="grid">
            <article className="card"><span className="card-number">01</span><h3>Automation</h3><p>n8n workflows that move data, send alerts and handle routine tasks automatically.</p></article>
            <article className="card"><span className="card-number">02</span><h3>Excel & Reports</h3><p>Reports and dashboards that bring the numbers together without repetitive copy-paste work.</p></article>
            <article className="card"><span className="card-number">03</span><h3>Websites</h3><p>Fast, mobile-friendly business websites with clean design and an admin panel when needed.</p></article>
            <article className="card"><span className="card-number">04</span><h3>Web Apps</h3><p>Custom tools with authentication, database features and practical business workflows.</p></article>
          </div>
        </div></section>

        <section className="block" id="process"><div className="wrap">
          <p className="eyebrow"><i />03 / The process</p><h2>A clear path from idea to launch.</h2>
          <div className="process-grid">{PROCESS.map(([number, title, text]) => <article className="process-card" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div></section>

        <section className="block" id="projects"><div className="wrap">
          <div className="section-heading"><div><p className="eyebrow"><i />04 / Selected work</p><h2>Ideas put to work.</h2></div><a className="text-link" href="#contact">Build something with me <span aria-hidden="true">↗</span></a></div>
          <p className="lead muted">Business websites, AI-powered tools and projects in the making.</p>
          <Projects />
        </div></section>

        <section className="block" id="stack"><div className="wrap">
          <p className="eyebrow"><i />05 / My toolkit</p><h2>The right tools for the job.</h2>
          <div className="stack">{STACK.map((s) => <span key={s}>{s}</span>)}</div>
        </div></section>

        <section className="block contact-section" id="contact"><div className="wrap">
          <p className="eyebrow"><i />06 / Let&apos;s connect</p><h2>Your next idea<br />starts here.</h2>
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
