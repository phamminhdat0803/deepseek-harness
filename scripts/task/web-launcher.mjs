import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LOG_FILE = path.join(REPO_ROOT, 'logs', 'dsh-web.log');

export function checkPort(port, host = '127.0.0.1', timeoutMs = 400) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

export function getActiveUrlFromLog(port = 3080) {
  try {
    if (!fs.existsSync(LOG_FILE)) return null;
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const regex = new RegExp(`dsh web:\\s+(http:\\/\\/127\\.0\\.0\\.1:${port}\\/\\S*)`, 'g');
    const matches = [...content.matchAll(regex)];
    if (matches.length > 0) {
      return matches[matches.length - 1][1];
    }
  } catch {}
  return null;
}

export function openBrowser(url) {
  try {
    const child = spawn('cmd.exe', ['/c', 'start', '', url], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();
  } catch (err) {
    console.error(`dsh web: khong the mo trinh duyet: ${err.message}`);
  }
}

export async function handleWebFastPath(args) {
  const isWebProfile = args[0] === 'web' ||
    (args[0] === '--profile' && args[1] === 'web') ||
    args.includes('web');

  if (!isWebProfile) {
    return false;
  }

  // Parse custom port if present
  let port = 3080;
  const portIdx = args.indexOf('--port');
  if (portIdx !== -1 && args[portIdx + 1]) {
    const parsed = parseInt(args[portIdx + 1], 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      port = parsed;
    }
  }

  const isOpen = await checkPort(port);
  if (!isOpen) {
    return false;
  }

  // Already running on port
  const activeUrl = getActiveUrlFromLog(port) || `http://127.0.0.1:${port}`;
  const noOpen = args.includes('--no-open');

  console.log(`dsh web: already running at ${activeUrl}`);
  if (!noOpen) {
    console.log('dsh web: opening browser...');
    openBrowser(activeUrl);
  }
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const handled = await handleWebFastPath(args);
  process.exit(handled ? 0 : 1);
}
