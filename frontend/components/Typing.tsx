"use client";

import { useEffect, useState } from "react";

const LINES = [
  "n8n automations that save hours",
  "Excel reports on autopilot",
  "Websites that bring clients",
  "Real business experience, real results",
];

// Typewriter effect: types a line, holds it, deletes it, moves to the next.
export default function Typing() {
  const [text, setText] = useState(LINES[0]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let line = 0;
    let chars = LINES[0].length;
    let deleting = true;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = LINES[line];
      if (deleting) {
        chars -= 1;
        setText(current.slice(0, chars));
        if (chars <= 0) {
          deleting = false;
          line = (line + 1) % LINES.length;
          timer = setTimeout(tick, 350);
          return;
        }
        timer = setTimeout(tick, 28);
      } else {
        chars += 1;
        setText(LINES[line].slice(0, chars));
        if (chars >= LINES[line].length) {
          deleting = true;
          timer = setTimeout(tick, 1700);
          return;
        }
        timer = setTimeout(tick, 65);
      }
    };
    timer = setTimeout(tick, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <p className="typing">
      <span>{text}</span>
      <span className="cur" aria-hidden="true" />
    </p>
  );
}
