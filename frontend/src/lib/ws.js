export function connectTerminal({ onData, onExit }) {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${proto}://${location.host}/ws/terminal`);

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "exit") onExit?.(msg.data);
    else onData?.(msg.data, msg.type);
  };

  return {
    run: (command, cwd) => socket.send(JSON.stringify({ type: "run", command, cwd })),
    close: () => socket.close(),
    socket
  };
}
