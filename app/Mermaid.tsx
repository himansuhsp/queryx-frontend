"use client";
import { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  flowchart: { curve: "basis" },
});

export default function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return; // <- error solved

    const renderGraph = async () => {
      try {
        const id = "mermaid-" + Math.random().toString(36).substr(2, 9);
        const { svg } = await mermaid.render(id, chart);
        if (ref.current) ref.current.innerHTML = svg; // <- double check, no TS error
      } catch (err) {
        console.error("Mermaid render error:", err);
        if (ref.current) {
          ref.current.innerHTML = "<p style='color:red'>Graph render failed.</p>";
        }
      }
    };

    renderGraph();
  }, [chart]);

  return (
    <div
      ref={ref}
      className="my-4 p-3 rounded-lg bg-white border shadow transition-all"
      style={{ overflowX: "auto" }}
    ></div>
  );
}
