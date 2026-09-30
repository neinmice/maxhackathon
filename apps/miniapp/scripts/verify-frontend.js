// Полная frontend-проверка: четыре focused harness, honesty и существующий build.
// build вызывается отдельным npm-скриптом и сам сюда не ссылается — рекурсии нет.
// Любой ненулевой статус сохраняется; остальные шаги всё равно выполняются.
import { spawnSync } from 'node:child_process';

const steps = [
  [process.execPath, ['scripts/health-contract.mjs']],
  [process.execPath, ['scripts/catalog-contract.mjs']],
  [process.execPath, ['scripts/quiz-contract.mjs']],
  [process.execPath, ['scripts/deep-link-contract.mjs']],
  [process.execPath, ['scripts/honesty-regressions.mjs']],
  ['npm', ['run', 'build']],
];

let failed = 0;
for (const [command, args] of steps) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  const code = result.status === 0 ? 0 : (result.status ?? 1);
  if (code !== 0) failed += 1;
  const status = code === 0 ? 'PASS' : 'FAIL';
  console.log(`VERIFY ${status} exit=${code} :: ${command} ${args.join(' ')}`);
}

if (failed !== 0) {
  console.error(`VERIFY aggregate FAIL failed_steps=${failed}`);
  process.exit(1);
}

console.log('VERIFY aggregate PASS failed_steps=0');
