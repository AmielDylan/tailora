import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const server = await createServer({
  server: {
    host: '127.0.0.1',
    port: 4173,
  },
});

await server.listen();

const args = ['node_modules/playwright/cli.js', 'test', ...process.argv.slice(2)];
const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    TAILORA_E2E_MANAGED_SERVER: 'true',
  },
});

const exitCode = await new Promise((resolve) => {
  child.on('exit', (code) => resolve(code ?? 1));
});

await server.close();
process.exit(Number(exitCode));
