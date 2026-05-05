const { spawnSync } = require('node:child_process');
const path = require('node:path');
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
const prismaBin = path.join(
  serverRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'prisma.cmd' : 'prisma'
);

const migrate = spawnSync(prismaBin, ['migrate', 'deploy'], {
  cwd: serverRoot,
  env: process.env,
  stdio: 'inherit',
});

if (migrate.status !== 0) {
  process.exit(migrate.status || 1);
}

require('../index');
