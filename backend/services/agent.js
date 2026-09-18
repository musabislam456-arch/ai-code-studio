import path from "node:path";
import fs from "node:fs";
import { callGemini } from "./gemini.js";
import { listTree, readFile, writeFile, deleteFile } from "./files.js";
import { runCommandStreaming } from "./terminal.js";

const MAX_STEPS = 40;

const toolDeclarations = [{
  functionDeclarations: [
    { name: "list_files", description: "List the current workspace file tree.", parameters: { type: "OBJECT", properties: {} } },
    { name: "read_file", description: "Read a UTF-8 text file before editing it.", parameters: { type: "OBJECT", properties: { path: { type: "STRING" } }, required: ["path"] } },
    { name: "write_file", description: "Create or replace a UTF-8 file. Parent directories are created automatically.", parameters: { type: "OBJECT", properties: { path: { type: "STRING" }, content: { type: "STRING" } }, required: ["path","content"] } },
    { name: "delete_file", description: "Delete a file or directory only when the user explicitly requested it.", parameters: { type: "OBJECT", properties: { path: { type: "STRING" } }, required: ["path"] } },
    { name: "run_command", description: "Run a shell command in the workspace and return its output and exit code.", parameters: { type: "OBJECT", properties: { command: { type: "STRING" } }, required: ["command"] } }
  ]
}];

function safePath(root, rel) {
  const base = path.resolve(root);
  const full = path.resolve(root, String(rel || ""));
  if (full !== base && !full.startsWith(base + path.sep)) throw new Error("Path is outside the workspace.");
  return full;
}

function emit(send, type, data = {}) {
  send({ type, ...data });
}

function summarizeTool(name, args) {
  if (name === "read_file") return `Read ${args.path}`;
  if (name === "write_file") return `Write ${args.path}`;
  if (name === "delete_file") return `Delete ${args.path}`;
  if (name === "run_command") return `Run: ${args.command}`;
  return "List workspace files";
}

async function executeTool(name, args, root, send) {
  emit(send, "tool_start", { tool: name, label: summarizeTool(name, args), args });
  try {
    let result;
    if (name === "list_files") {
      result = { tree: listTree(root) };
    } else if (name === "read_file") {
      result = { path: args.path, content: readFile(root, args.path) };
    } else if (name === "write_file") {
      writeFile(root, args.path, args.content);
      emit(send, "file_change", { action: "write", path: args.path });
      result = { ok: true, path: args.path };
    } else if (name === "delete_file") {
      deleteFile(root, args.path);
      emit(send, "file_change", { action: "delete", path: args.path });
      result = { ok: true, path: args.path };
    } else if (name === "run_command") {
      emit(send, "command_start", { command: args.command });
      result = await runCommandStreaming(args.command, root, {
        send: (type, data) => emit(send, "command_output", { stream: type, data })
      });
      emit(send, "command_end", { command: args.command, code: result.code });
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
    emit(send, "tool_result", { tool: name, ok: true });
    return result;
  } catch (err) {
    emit(send, "tool_result", { tool: name, ok: false, error: err.message });
    return { ok: false, error: err.message };
  }
}

export async function runAgent({ apiKey, modelId, workspaceDir, messages, systemInstruction, send }) {
  fs.mkdirSync(workspaceDir, { recursive: true });
  emit(send, "agent_start", { workspace: workspaceDir });
  emit(send, "plan_summary", { text: "Task received. I’ll inspect the workspace, make the required changes, run checks, then report the result." });

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  let usedModel = modelId;
  for (let step = 0; step < MAX_STEPS; step++) {
    const result = await callGemini({
      apiKey,
      modelId: usedModel,
      contents,
      systemInstruction,
      tools: toolDeclarations
    });
    usedModel = result.usedModel;

    const modelContent = result.data?.candidates?.[0]?.content;
    const parts = modelContent?.parts || [];
    if (!parts.length) throw new Error("Gemini returned no content.");

    contents.push(modelContent);
    const textParts = parts.filter((p) => p.text).map((p) => p.text);
    if (textParts.length) emit(send, "assistant_delta", { text: textParts.join("") });

    const calls = parts.filter((p) => p.functionCall);
    if (!calls.length) {
      emit(send, "done", { usedModel });
      return { usedModel };
    }

    const responses = [];
    for (const part of calls) {
      const name = part.functionCall.name;
      const args = part.functionCall.args || {};
      const output = await executeTool(name, args, workspaceDir, send);
      responses.push({
        functionResponse: { name, response: output }
      });
    }
    contents.push({ role: "user", parts: responses });
  }

  throw new Error(`Agent stopped after ${MAX_STEPS} tool steps to prevent an infinite loop.`);
}
