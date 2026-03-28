import { spawn, ChildProcess } from "child_process";
import * as net from "net";
import { TUNNEL_CONFIG, type Environment } from "./types.js";

const runningTunnels: Map<Environment, ChildProcess> = new Map();

function isTunnelReady(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 1000);

    socket.connect(port, "127.0.0.1", () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true);
    });

    socket.on("error", () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForTunnelReady(
  port: number,
  options: { timeout: number; interval?: number } = { timeout: 30000, interval: 500 }
): Promise<void> {
  const { timeout, interval = 500 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await isTunnelReady(port)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(
    `Tunnel failed to become ready on port ${port} within ${timeout}ms. ` +
    `Ensure cloudflared is installed and you are authenticated (run: cloudflared login)`
  );
}

export async function ensureTunnel(env: Environment): Promise<void> {
  const config = TUNNEL_CONFIG[env];

  // Check if tunnel is already running (either by us or externally)
  if (await isTunnelReady(config.port)) {
    return;
  }

  // Check if we have a tracked process that's still alive
  const existing = runningTunnels.get(env);
  if (existing && !existing.killed) {
    // Process exists but port not ready - wait a bit
    await waitForTunnelReady(config.port, { timeout: 10000 });
    return;
  }

  // Spawn new tunnel
  const proc = spawn("cloudflared", [
    "access",
    "tcp",
    "--hostname",
    config.hostname,
    "--url",
    `127.0.0.1:${config.port}`,
  ], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });

  // Track the process
  runningTunnels.set(env, proc);

  // Handle process errors
  proc.on("error", (err) => {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      console.error(
        "Error: cloudflared not found. Install it with: brew install cloudflared"
      );
    } else {
      console.error(`Tunnel process error for ${env}:`, err.message);
    }
    runningTunnels.delete(env);
  });

  proc.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Tunnel for ${env} exited with code ${code}`);
    }
    runningTunnels.delete(env);
  });

  // Capture stderr for debugging
  proc.stderr?.on("data", (data) => {
    const msg = data.toString();
    // Only log errors, not routine messages
    if (msg.toLowerCase().includes("error") || msg.toLowerCase().includes("failed")) {
      console.error(`Tunnel ${env}:`, msg.trim());
    }
  });

  // Wait for tunnel to be ready
  try {
    await waitForTunnelReady(config.port, { timeout: 30000 });
  } catch (error) {
    // Kill the process if it didn't become ready
    proc.kill();
    runningTunnels.delete(env);
    throw error;
  }
}

export function getTunnelPort(env: Environment): number {
  return TUNNEL_CONFIG[env].port;
}

export function cleanupTunnels(): void {
  for (const [env, proc] of runningTunnels.entries()) {
    if (!proc.killed) {
      proc.kill();
    }
    runningTunnels.delete(env);
  }
}

// Cleanup on process exit
process.on("SIGTERM", () => {
  cleanupTunnels();
  process.exit(0);
});

process.on("SIGINT", () => {
  cleanupTunnels();
  process.exit(0);
});

process.on("exit", () => {
  cleanupTunnels();
});
