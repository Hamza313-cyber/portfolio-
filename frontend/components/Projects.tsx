"use client";

import { useEffect, useState } from "react";
import { FALLBACK_PROJECTS, safeUrl, type Project } from "@/lib/projects";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(FALLBACK_PROJECTS);
  const [filter, setFilter] = useState("All projects");

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/projects", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: Project[]) => {
        if (Array.isArray(data) && data.length) setProjects(data);
      })
      .catch(() => {
        /* keep the built-in list */
      });
    return () => ctrl.abort();
  }, []);

  const visible = projects.filter((p) => {
    if (filter === "In progress") return p.status === "in_progress";
    if (filter === "AI & automation") return p.tags.some((tag) => /\bai\b|python|n8n|automation/i.test(tag));
    if (filter === "Websites") return p.tags.some((tag) => /next|react|website|tailwind/i.test(tag));
    return true;
  });

  return (
    <>
    <div className="project-filters" role="group" aria-label="Filter projects">
      {["All projects", "Websites", "AI & automation", "In progress"].map((label) => <button type="button" key={label} aria-pressed={filter === label} onClick={() => setFilter(label)}>{label}</button>)}
    </div>
    <p className="sr-only" role="status">{visible.length} {visible.length === 1 ? "project" : "projects"} shown</p>
    <div className="grid project-grid">
      {visible.map((p) => {
        const live = safeUrl(p.live_url);
        const code = safeUrl(p.code_url);
        return (
          <article className="card project-card" key={p.id}>
            <div className="project-index" aria-hidden="true">{String(projects.indexOf(p) + 1).padStart(2, "0")}<span>↗</span></div>
            {p.status === "in_progress" ? <span className="status">In progress</span> : <span className="project-label">Featured work</span>}
            <h3>{p.title}</h3>
            <p>{p.description}</p>
            <div className="project-meta"><span>Built with</span><span>{p.tags.slice(0, 3).join(" · ") || "Custom stack"}</span></div>
            {p.tags.length > 0 && (
              <div className="tags">
                {p.tags.map((t) => (
                  <span className="tag" key={t}>{t}</span>
                ))}
              </div>
            )}
            {(live || code) && (
              <div className="links">
                {live && <a href={live} target="_blank" rel="noopener noreferrer" aria-label={`View ${p.title} live`}>View live <span aria-hidden="true">↗</span></a>}
                {code && <a href={code} target="_blank" rel="noopener noreferrer" aria-label={`View ${p.title} source code`}>Source code <span aria-hidden="true">↗</span></a>}
              </div>
            )}
          </article>
        );
      })}
      {!visible.length && <p className="project-empty">No projects in this category yet.</p>}
    </div>
    </>
  );
}
