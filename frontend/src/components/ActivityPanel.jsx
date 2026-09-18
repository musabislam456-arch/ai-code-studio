import React, { useEffect, useRef } from "react";

function labelFor(event) {
  if (event.type === "agent_start") return "Agent started";
  if (event.type === "plan_summary") return event.text || "Planning";
  if (event.type === "tool_start") return event.label || event.tool;
  if (event.type === "tool_result") return event.ok ? `✓ ${event.tool}` : `✕ ${event.tool}: ${event.error}`;
  if (event.type === "file_change") return `File ${event.action}: ${event.path}`;
  if (event.type === "command_start") return `$ ${event.command}`;
  if (event.type === "command_end") return `Process exited with code ${event.code}`;
  if (event.type === "command_output") return event.data || "";
  if (event.type === "assistant_delta") return event.text || "";
  if (event.type === "done") return `Done · ${event.usedModel || "model"}`;
  if (event.type === "error") return `Error: ${event.error}`;
  return JSON.stringify(event);
}

export default function ActivityPanel({ events }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [events]);
  return (
    <div className="activity-panel">
      <div className="activity-header">Live activity</div>
      <div className="activity-events" ref={ref}>
        {events.map((event, i) => (
          <div key={i} className={`activity-event activity-${event.type}`}>
            <span className="activity-dot">●</span>
            <span>{labelFor(event)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
