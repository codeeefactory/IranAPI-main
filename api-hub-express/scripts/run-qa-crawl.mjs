import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";


const frontendPort = 4173;
const backendPort = 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(frontendDir, "..");
let isCleaningUp = false;


function spawnProcess(label, command, args, cwd, env = process.env) {
  const child = spawn(command, args, {
    cwd,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("exit", (code, signal) => {
    if (isCleaningUp) {
      return;
    }

    if (code !== null && code !== 0) {
      console.error(`${label} exited with code ${code}`);
    }
    if (signal) {
      console.error(`${label} exited with signal ${signal}`);
    }
  });

  child.on("error", (error) => {
    console.error(`${label} failed to start`, error);
  });

  return child;
}


async function waitForUrl(url, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {}

    await delay(1_000);
  }

  throw new Error(`Timed out waiting for ${url}`);
}


function terminateProcess(child) {
  if (!child || child.killed) {
    return;
  }

  try {
    if (process.platform === "win32" && child.pid) {
      spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
      });
      return;
    }

    child.kill("SIGTERM");
  } catch {}
}


async function main() {
  const sharedEnv = {
    ...process.env,
    MONGODB_USE_MOCK: process.env.MONGODB_USE_MOCK || "true",
    IRANAPI_AUTO_SEED_SAMPLE_DATA: process.env.IRANAPI_AUTO_SEED_SAMPLE_DATA || "true",
  };
  const backend = spawnProcess(
    "backend",
    "python",
    ["manage.py", "runserver", `127.0.0.1:${backendPort}`, "--noreload"],
    repoRoot,
    sharedEnv,
  );
  const frontend = spawnProcess(
    "frontend",
    "npm",
    ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(frontendPort), "--strictPort"],
    frontendDir,
    process.env,
  );

  const cleanup = () => {
    isCleaningUp = true;
    terminateProcess(frontend);
    terminateProcess(backend);
  };

  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });

  process.on("SIGTERM", () => {
    cleanup();
    process.exit(143);
  });

  try {
    await waitForUrl(`http://127.0.0.1:${backendPort}/api/v1/system/health/`, 120_000);
    await waitForUrl(`http://127.0.0.1:${frontendPort}/`, 120_000);

    await new Promise((resolve, reject) => {
      const runner = spawnProcess(
        "api-crawler",
        "python",
        [path.join("scripts", "api_crawler.py")],
        repoRoot,
        {
          ...sharedEnv,
          QA_API_BASE_URL: `http://127.0.0.1:${backendPort}`,
        },
      );
      runner.on("exit", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`API crawler exited with code ${code ?? "unknown"}`));
        }
      });
      runner.on("error", reject);
    });

    await new Promise((resolve, reject) => {
      const runner = spawnProcess("playwright", "npx", ["playwright", "test"], frontendDir, {
        ...process.env,
        QA_FRONTEND_BASE_URL: `http://127.0.0.1:${frontendPort}`,
        PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${frontendPort}`,
      });
      runner.on("exit", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Playwright exited with code ${code ?? "unknown"}`));
        }
      });
      runner.on("error", reject);
    });
  } finally {
    cleanup();
  }
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
