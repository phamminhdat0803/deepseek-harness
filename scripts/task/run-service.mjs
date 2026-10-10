import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LOG_FILE = path.join(REPO_ROOT, 'logs', 'dsh-web.log');

function checkPort(port = 3080, host = '127.0.0.1', timeoutMs = 400) {
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

// 1. Kiem tra port 3080 da duoc su dung chua de tranh khoi dong trung lap
const isRunning = await checkPort(3080);
if (isRunning) {
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    const now = new Date().toLocaleString('vi-VN');
    fs.appendFileSync(LOG_FILE, `[${now}] [dsh-web] Port 3080 da duoc su dung. Bo qua khoi dong trung lap.\n`);
  } catch {}
  process.exit(0);
}

// 2. Neu duoc khoi chay tu wrapper (nhu wscript cua Task Scheduler), theo doi tien trinh cha.
// Khi Task Scheduler ket thuc wscript.exe, tien trinh node nay se tu dong thoat ngay lap tuc.
if (process.env.DSH_WATCH_PARENT === '1' && process.ppid) {
  const parentPid = process.ppid;
  const parentWatcher = setInterval(() => {
    try {
      process.kill(parentPid, 0);
    } catch (err) {
      if (err.code === 'ESRCH') {
        process.exit(0);
      }
    }
  }, 400);
  parentWatcher.unref();
}

// 3. Thiet lap CA cert neu co
const caCert = 'C:\\Users\\Welcome\\AppData\\Roaming\\9router\\mitm\\rootCA.crt';
if (fs.existsSync(caCert) && !process.env.NODE_EXTRA_CA_CERTS) {
  process.env.NODE_EXTRA_CA_CERTS = caCert;
}

// 4. Chuyen huong stdout / stderr vao file logs/dsh-web.log
try {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  const logStream = fs.createWriteStream(LOG_FILE, { flags: 'w' });
  logStream.on('error', () => {});

  const origStdoutWrite = process.stdout.write.bind(process.stdout);
  const origStderrWrite = process.stderr.write.bind(process.stderr);

  process.stdout.write = (chunk, encoding, cb) => {
    try { logStream.write(chunk, encoding); } catch {}
    return origStdoutWrite(chunk, encoding, cb);
  };
  process.stderr.write = (chunk, encoding, cb) => {
    try { logStream.write(chunk, encoding); } catch {}
    return origStderrWrite(chunk, encoding, cb);
  };
} catch {}

// 5. Thiet lap working directory va tham so chay dsh web
process.chdir(REPO_ROOT);
const binPath = path.join(REPO_ROOT, 'apps', 'cli', 'src', 'bin.ts');
process.argv = [process.argv[0], binPath, 'web', ...process.argv.slice(2)];

// 6. Khoi chay CLI trong cung process
const { runCli } = await import('../../apps/cli/src/bin.ts');
await runCli();
