import { spawn } from "node:child_process";
export function runCommandStreaming(command,cwd,sink) {
  return new Promise(resolve => {
    const child=spawn(command,{cwd,shell:true,env:process.env});
    const send=(type,data)=>sink.send?.(type,data.toString());
    child.stdout.on("data",d=>send("stdout",d)); child.stderr.on("data",d=>send("stderr",d));
    child.on("close",code=>resolve({code:code ?? 1})); child.on("error",err=>{send("stderr",`Failed to start command: ${err.message}
`); resolve({code:1});});
  });
}
