"use client";

import { useEffect, useState } from "react";
import { FALLBACK_PROJECTS, safeUrl, type Project } from "@/lib/projects";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(FALLBACK_PROJECTS);

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

  return (
    <div className="grid">
      {projects.map((p) => {
        const live = safeUrl(p.live_url);
        const code = safeUrl(p.code_url);
        return (
          <article className="card project-card" key={p.id}>
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
                {live && <a href={live} target="_blank" rel="noopener noreferrer">Live</a>}
                {code && <a href={code} target="_blank" rel="noopener noreferrer">Code</a>}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
