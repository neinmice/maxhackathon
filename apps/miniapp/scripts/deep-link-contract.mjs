// Focused deep-link harness (корректирующий Пакет 3): реальный production deepLink.ts + api/client.ts.
// Контракт: docs/API_CONTRACT.md «Deep link» — только measure_<id>, payload ≤ 512, legacy отвергается.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(here, '..', 'src');

function load(relativePath) {
  const source = readFileSync(join(srcRoot, relativePath), 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
    fileName: relativePath,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (request) => {
    if (request === '../types/bridge' || request === '../types/api') return {};
    throw new Error(`Unexpected import in deep-link harness: ${request} from ${relativePath}`);
  };
  const runner = new Function('exports', 'require', 'module', transpiled);
  runner(module.exports, localRequire, module);
  return module.exports;
}

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return typeof body === 'string' ? body : JSON.stringify(body);
    },
  };
}

function installFetch(handler) {
  globalThis.fetch = async (url, init) => handler(String(url), init);
  globalThis.window = { WebApp: { initData: 'present-not-printed' } };
}

const deepLink = load('lib/deepLink.ts');
const { classifyStartParam, resolveLaunchParam, resolveLaunchParamFromWindow, applyLaunchParam } = deepLink;
const { apiClient } = load('api/client.ts');

// --- 1. Классификация payload: канонический measure_<id> ---
const canonical = 'measure_demo-kazan-agro-001';
assert.deepEqual(classifyStartParam(canonical), { kind: 'measure', measureId: 'demo-kazan-agro-001' });

// 512-символьный payload: 'measure_' (8) + ID 504 = максимум
const maxPayload = `measure_${'a'.repeat(504)}`;
assert.equal(maxPayload.length, 512);
assert.deepEqual(classifyStartParam(maxPayload), { kind: 'measure', measureId: 'a'.repeat(504) });

// 513 — отказ (лимит полного payload, не выдуманный 128)
assert.equal(classifyStartParam(`measure_${'a'.repeat(505)}`), null);
assert.equal(classifyStartParam('a'.repeat(513)), null);

// --- 2. Отклонения: legacy, голый префикс, whitespace, uppercase/underscore ---
assert.equal(classifyStartParam('measure'), null, 'bare measure must not open anything');
assert.equal(classifyStartParam('measure_'), null, 'measure_ without id must not open anything');
assert.equal(classifyStartParam('MEASURE_demo-kazan-agro-001'), null, 'uppercase payload rejected');
assert.equal(classifyStartParam('measure_DEMO-kazan-agro-001'), null, 'uppercase id rejected');
assert.equal(classifyStartParam('measure_demo_kazan'), null, 'underscore id rejected');
assert.equal(classifyStartParam(' measure_demo-kazan-agro-001'), null, 'leading whitespace rejected');
assert.equal(classifyStartParam('measure_demo-kazan-agro-001 '), null, 'trailing whitespace rejected');
assert.equal(classifyStartParam('measure demo-kazan'), null, 'space inside rejected');
assert.equal(classifyStartParam('measure_demo--id'), null, 'empty hyphen segment rejected');
assert.equal(classifyStartParam('measure_-demo'), null, 'leading hyphen id rejected');
assert.equal(classifyStartParam(''), null, 'empty payload rejected');
assert.equal(classifyStartParam(null), null);
assert.equal(classifyStartParam(undefined), null);

// --- 3. Сохранённые обычные маршруты ---
for (const route of ['home', 'quiz', 'cert', 'catalog', 'saved', 'onboarding']) {
  assert.deepEqual(classifyStartParam(route), { kind: 'route', route });
}
assert.equal(classifyStartParam('unknown-route'), null);
assert.equal(classifyStartParam('cert=1'), null);

// --- 4. Приоритет источников: bridge → startapp → tgWebAppStartParam → start_param → hash ---
assert.equal(
  resolveLaunchParam({ bridgeStartParam: 'measure_bridge-1', search: '?startapp=measure_query-1' }),
  'measure_bridge-1',
  'bridge start_param wins',
);
assert.equal(
  resolveLaunchParam({ search: '?startapp=measure_query-1&tgWebAppStartParam=measure_tg-1' }),
  'measure_query-1',
  'query startapp beats tgWebAppStartParam',
);
assert.equal(
  resolveLaunchParam({ search: '?tgWebAppStartParam=measure_tg-1&start_param=measure_sp-1' }),
  'measure_tg-1',
  'tgWebAppStartParam beats start_param',
);
assert.equal(
  resolveLaunchParam({ search: '?start_param=measure_sp-1', hash: '#startapp=measure_hash-1' }),
  'measure_sp-1',
  'query beats hash',
);
assert.equal(resolveLaunchParam({ hash: '#startapp=measure_hash-1' }), 'measure_hash-1', 'hash parsed');
assert.equal(resolveLaunchParam({ hash: '#tgWebAppStartParam=measure_hash-tg' }), 'measure_hash-tg');
assert.equal(resolveLaunchParam({}), null, 'no sources → null');
assert.equal(resolveLaunchParam({ search: '?' }), null, 'empty query values → null');

// Невалидный приоритетный источник не проваливается к нижнему валидному
const hostile = resolveLaunchParam({
  bridgeStartParam: 'measure_DEMO-invalid',
  search: '?startapp=measure_demo-kazan-agro-001',
});
assert.equal(hostile, 'measure_DEMO-invalid', 'first non-empty source is returned as-is');
assert.equal(classifyStartParam(hostile), null, 'invalid priority source must not fall through');
assert.equal(applyLaunchParam(hostile, openDeps()), false, 'nothing opens from invalid priority source');

// --- 5. window-обёртка: no-window и MAXBridge fallback ---
{
  const savedWindow = globalThis.window;
  delete globalThis.window;
  assert.equal(resolveLaunchParamFromWindow(), null, 'no window → null');
  globalThis.window = savedWindow;
}
globalThis.window = {
  MAXBridge: { initDataUnsafe: { start_param: canonical } },
  location: { search: '?startapp=quiz', hash: '' },
};
assert.equal(resolveLaunchParamFromWindow(), canonical, 'MAXBridge fallback works');

// --- 6. Интеграция: resolver → client.getMeasure → открытие карточки ---
function openDeps() {
  const calls = { opened: [], navigated: [], quiz: 0, onboarding: 0 };
  return {
    calls,
    deps: {
      openMeasure: (id) => {
        apiClient.getMeasure(id).then((m) => calls.opened.push(m.id)).catch(() => {});
      },
      openQuiz: () => { calls.quiz += 1; },
      openOnboarding: () => { calls.onboarding += 1; },
      navigate: (path) => { calls.navigated.push(path); },
    },
  };
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function setWindowLaunch(search) {
  globalThis.window = { WebApp: { initData: 'present-not-printed' }, location: { search, hash: '' } };
}

// success: валидный payload открывает точный ID через настоящий getMeasure
const canonicalMeasure = {
  id: 'demo-kazan-agro-001',
  title: 'Демонстрационная мера: агро, Казань',
  operator: 'Модельный оператор каталога',
  region: 'kazan',
  roles: ['ip'],
  tax_modes: ['usn6'],
  sector: 'agro',
  goal: 'support',
  documents: ['профиль бизнеса'],
  deadline: null,
  source_name: 'MODEL DATA',
  source_url: 'https://example.invalid/model-data',
  last_checked: '2026-09-19',
  freshness_status: 'model',
  data_status: 'MODEL DATA',
  disclaimer: 'Демонстрационная запись.',
};
installFetch(() => jsonResponse(200, canonicalMeasure));
setWindowLaunch(`?startapp=${canonical}`);
{
  const { calls, deps } = openDeps();
  assert.equal(applyLaunchParam(resolveLaunchParamFromWindow(), deps), true);
  await settle();
  assert.deepEqual(calls.opened, ['demo-kazan-agro-001'], 'success opens the exact requested id');
  assert.equal(calls.quiz, 0);
  assert.deepEqual(calls.navigated, []);
}

// unknown id: 404 — карточка не открывается
installFetch(() => jsonResponse(404, { error: { code: 'measure_not_found', message: 'Мера не найдена' } }));
setWindowLaunch('?startapp=measure_missing-id');
{
  const { calls, deps } = openDeps();
  assert.equal(applyLaunchParam('measure_missing-id', deps), true, 'syntax is valid');
  await settle();
  assert.deepEqual(calls.opened, [], 'unknown id must not open a card');
}

// network failure — карточка не открывается
installFetch(() => { throw new TypeError('network down'); });
setWindowLaunch(`?startapp=${canonical}`);
{
  const { calls, deps } = openDeps();
  applyLaunchParam('measure_demo-kazan-agro-001', deps);
  await settle();
  assert.deepEqual(calls.opened, [], 'network failure must not open a card');
}

// mismatch: 200 с чужим id — карточка не открывается
installFetch(() => jsonResponse(200, { ...canonicalMeasure, id: 'fixture-should-not-leak' }));
setWindowLaunch(`?startapp=${canonical}`);
{
  const { calls, deps } = openDeps();
  applyLaunchParam('measure_demo-kazan-agro-001', deps);
  await settle();
  assert.deepEqual(calls.opened, [], 'mismatched response id must not open a card');
}

// legacy query startapp=measure&id=... — карточка не открывается даже при валидном id в ответе
installFetch(() => jsonResponse(200, canonicalMeasure));
globalThis.window = { location: { search: '?startapp=measure&id=demo-kazan-agro-001', hash: '' } };
{
  const { calls, deps } = openDeps();
  assert.equal(applyLaunchParam(resolveLaunchParamFromWindow(), deps), false, 'legacy measure payload rejected');
  await settle();
  assert.deepEqual(calls.opened, [], 'legacy query must not open a card');
}

// маршруты через deps (сохранённые сценарии)
globalThis.window = { location: { search: '', hash: '' } };
{
  const { calls, deps } = openDeps();
  assert.equal(applyLaunchParam('quiz', deps), true);
  assert.equal(applyLaunchParam('cert', deps), true);
  assert.equal(applyLaunchParam('catalog', deps), true);
  assert.equal(applyLaunchParam('saved', deps), true);
  assert.equal(applyLaunchParam('home', deps), true);
  assert.equal(applyLaunchParam('onboarding', deps), true);
  assert.equal(calls.quiz, 2, 'quiz and cert open quiz');
  assert.deepEqual(calls.navigated, ['/grants', '/profile', '/'], 'catalog/saved/home navigate');
  assert.equal(calls.onboarding, 1);
  assert.deepEqual(calls.opened, [], 'routes never open measure cards');
}
assert.equal(applyLaunchParam('measure', openDeps().deps), false, 'bare measure route is a no-op');

console.log('deep-link-contract: all assertions passed');
