const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');

dotenv.config();

const databaseUrlAliases = [
  'DATABASE_PRIVATE_URL',
  'DATABASE_PUBLIC_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
];

if (!process.env.DATABASE_URL) {
  const alias = databaseUrlAliases.find((key) => process.env[key]);

  if (alias) {
    process.env.DATABASE_URL = process.env[alias];
    console.log(`Using ${alias} as DATABASE_URL.`);
  }
}

if (!process.env.DATABASE_URL) {
  console.error(
    [
      'Missing DATABASE_URL.',
      'Add a PostgreSQL database to Railway, then set DATABASE_URL on this service.',
      'Example Railway value: ${{ Postgres.DATABASE_URL }}',
    ].join('\n')
  );
  process.exit(1);
}

const serverRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(serverRoot, '..');

const prismaPaths = [
  path.join(serverRoot, 'node_modules', '.bin', 'prisma'),
  path.join(projectRoot, 'node_modules', '.bin', 'prisma'),
];

if (process.platform === 'win32') {
  prismaPaths.push(
    path.join(serverRoot, 'node_modules', '.bin', 'prisma.cmd'),
    path.join(projectRoot, 'node_modules', '.bin', 'prisma.cmd')
  );
}

const prismaBin = prismaPaths.find((p) => fs.existsSync(p));

if (!prismaBin) {
  console.error('Could not find Prisma binary in any of the expected locations:', prismaPaths);
  process.exit(1);
}

console.log('Running Prisma migrations...');
const migrate = spawnSync(prismaBin, ['migrate', 'deploy'], {
  cwd: serverRoot,
  env: process.env,
  stdio: 'inherit',
});

if (migrate.status !== 0) {
  console.error(`Prisma migration failed with status ${migrate.status}`);
  process.exit(migrate.status || 1);
}

console.log('Migrations completed successfully. Starting server...');
require('../index');
