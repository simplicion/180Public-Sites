#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const APPS = {
  marketing: {
    name: '180 Marketing & Landing Web',
    filter: 'apps-marketing-web',
    cmd: 'pnpm',
    args: ['--filter', 'apps-marketing-web', 'dev'],
    port: 3004,
    color: '\x1b[33m', // Yellow
  },
  docs: {
    name: '180 Public Documentation Portal',
    filter: 'apps-docs',
    cmd: 'pnpm',
    args: ['--filter', 'apps-docs', 'dev'],
    port: 3005,
    color: '\x1b[36m', // Cyan
  },
};

const ALIASES = {
  web: 'marketing',
  marketing: 'marketing',
  'marketing-web': 'marketing',
  doc: 'docs',
  documentation: 'docs',
  docusaurus: 'docs',
};

const rawArg = (process.argv[2] || '').trim().toLowerCase();
const requestedApp = ALIASES[rawArg] || rawArg;

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function printBanner() {
  console.log('\n' + BOLD + '============================================================' + RESET);
  console.log(BOLD + '        180 PUBLIC SITES — DEV RUNNER' + RESET);
  console.log(BOLD + '============================================================' + RESET);
  console.log('Available targets:\n');
  for (const [key, app] of Object.entries(APPS)) {
    const portStr = app.port ? ` -> http://localhost:${app.port}` : '';
    console.log(`  ${app.color}${key.padEnd(16)}${RESET} : ${app.name}${portStr}`);
  }
  console.log('\nUsage commands:');
  console.log('  pnpm dev                 (Spins up BOTH Marketing Web & Docs)');
  console.log('  pnpm dev:marketing       (Runs Marketing Portal on :3004)');
  console.log('  pnpm dev:docs            (Runs Docs Portal on :3005)');
  console.log(BOLD + '============================================================\n' + RESET);
}

function runSingleApp(key) {
  const app = APPS[key];
  if (!app) {
    console.error(`\nUnknown app: "${key}". See list above for valid app keys.`);
    process.exit(1);
  }

  console.log(`\nLaunching ${BOLD}${app.name}${RESET}...`);
  if (app.port) {
    console.log(`URL: http://localhost:${app.port}`);
  }

  const child = spawn(app.cmd, app.args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

function runAllApps() {
  console.log(BOLD + 'Starting ALL 180 Public Sites in parallel...' + RESET);
  console.log('  [apps-marketing-web] -> http://localhost:3004 (Marketing Portal)');
  console.log('  [apps-docs]          -> http://localhost:3005 (Product Docs Portal)');
  console.log('\nPress Ctrl+C to terminate all servers.\n');

  const turboArgs = [
    'exec',
    'turbo',
    'run',
    'dev',
    '--concurrency=10',
    '--filter=apps-marketing-web',
    '--filter=apps-docs',
  ];

  const turboChild = spawn('pnpm', turboArgs, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });

  const cleanup = () => {
    try {
      turboChild.kill('SIGINT');
    } catch (_) {}
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  turboChild.on('exit', (code) => {
    cleanup();
  });
}

if (requestedApp === 'help' || requestedApp === '--help' || requestedApp === '-h') {
  printBanner();
  process.exit(0);
}

if (!requestedApp || requestedApp === '' || requestedApp === 'all' || requestedApp === 'full') {
  printBanner();
  runAllApps();
} else if (APPS[requestedApp]) {
  runSingleApp(requestedApp);
} else {
  printBanner();
  console.error(`Error: Unknown target "${rawArg}".\n`);
  process.exit(1);
}
