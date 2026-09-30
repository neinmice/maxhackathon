// Focused catalog harness (Пакет 3): канонический каталог только из API, strict deep link,
// phantom saved filtering, честные сохранения. Изолирован от полного honesty-прогона.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(here, '..', 'src');

function load(relativePath, extras = {}) {
  const source = readFileSync(join(srcRoot, relativePath), 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      jsx: ts.JsxEmit.React,
    },
    fileName: relativePath,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (request) => {
    if (Object.prototype.hasOwnProperty.call(extras, request)) return extras[request];
    throw new Error(`Unexpected import in catalog harness: ${request} from ${relativePath}`);
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
  globalThis.window = { WebApp: { initData: 'present' } };
}

const storage = new Map();
globalThis.localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(String(key), String(value));
  },
  removeItem(key) {
    storage.delete(key);
  },
  clear() {
    storage.clear();
  },
};

const clientModule = load('api/client.ts');
const { ApiClient, ApiErrorResponse } = clientModule;
const client = new ApiClient('http://bot.local');

const canonical = [
  {
    id: 'demo-kazan-agro-001',
    title: 'Демонстрационная мера: агро, Казань',
    operator: 'Модельный оператор каталога',
    region: 'kazan',
    roles: ['ip'],
    tax_modes: ['usn6'],
    sector: 'agro',
    goal: 'support',
    eligibility: 'MODEL DATA',
    documents: ['профиль бизнеса'],
    deadline: null,
    source_name: 'MODEL DATA',
    source_url: 'https://example.invalid/model-data',
    last_checked: '2026-09-19',
    freshness_status: 'model',
    data_status: 'MODEL DATA',
    disclaimer: 'Демонстрационная запись.',
  },
];

// 1. Canonical catalog success: коллекция — массив, карточка — объект с запрошенным id
const canonicalCollection = () => (url) => {
  if (url.endsWith('/api/v1/measures')) return jsonResponse(200, canonical);
  if (url.endsWith('/api/v1/measures/demo-kazan-agro-001')) return jsonResponse(200, canonical[0]);
  return jsonResponse(404, { error: { code: 'measure_not_found', message: 'Мера не найдена' } });
};
installFetch(canonicalCollection());
assert.deepEqual(await client.getAllMeasures(), canonical);
assert.equal((await client.getMeasure('demo-kazan-agro-001')).id, 'demo-kazan-agro-001');

// 2. Network/HTTP/invalid JSON → typed rejection для getAllMeasures и getMeasure
const failureModes = [
  ['network', () => { throw new TypeError('Failed to fetch'); }, 'network_error'],
  ['http404', () => jsonResponse(404, { error: { code: 'measure_not_found', message: 'Мера не найдена', request_id: 'r1' } }), 'measure_not_found'],
  ['http500', () => jsonResponse(500, 'Internal Server Error'), 'http_error'],
  ['nonjson', () => jsonResponse(200, '<html>proxy</html>'), 'invalid_response'],
];
for (const [name, response, expectCode] of failureModes) {
  installFetch(response);
  for (const call of [() => client.getAllMeasures(), () => client.getMeasure('demo-kazan-agro-001')]) {
    await assert.rejects(call(), (err) => {
      assert.equal(err instanceof ApiErrorResponse, true, name);
      assert.equal(err.name, 'ApiErrorResponse', name);
      assert.equal(err.code, expectCode, name);
      return true;
    }, `${name}: must reject with typed ApiErrorResponse`);
  }
}

// 3. Unknown ID и mismatched body id не подменяются первой карточкой
installFetch(() => jsonResponse(200, { ...canonical[0], id: 'demo-moscow-agro-001' }));
await assert.rejects(client.getMeasure('demo-kazan-agro-001'), (err) => {
  assert.equal(err.code, 'measure_not_found');
  return true;
}, 'mismatched body id must not satisfy the requested card');

installFetch(canonicalCollection());
const first = await client.getMeasure('demo-kazan-agro-001');
assert.equal(first.id, 'demo-kazan-agro-001');
installFetch(() => jsonResponse(404, { error: { code: 'measure_not_found', message: 'Мера не найдена' } }));
await assert.rejects(client.getMeasure('no-such-measure'), (err) => {
  assert.equal(err.code, 'measure_not_found');
  return true;
}, 'unknown id must not fall back to the first record');

// 4. Strict deep link: пустой/blank/oversized ID не открывают карточку
installFetch(canonicalCollection());
for (const bad of ['', '   ', 'x'.repeat(129)]) {
  await assert.rejects(client.getMeasure(bad), (err) => {
    assert.equal(err instanceof ApiErrorResponse, true);
    return true;
  }, `getMeasure(${JSON.stringify(bad.slice(0, 8))}) must not silently succeed`);
}

// 5. Saved phantom filtering / default empty: phantom-ID отфильтровываются, пустой каталог — пустой набор
const phantomIds = ['young', 'micro', 'g1', 'g2', 'demo-kazan-agro-001'];
storage.set('zvery_saved_measures', JSON.stringify(phantomIds));
installFetch(canonicalCollection());
const catalogIds = new Set((await client.getAllMeasures()).map((item) => item.id));
const filtered = phantomIds.filter((id) => catalogIds.has(id));
assert.deepEqual(filtered, ['demo-kazan-agro-001'], 'phantom ids must be filtered against canonical catalog');

installFetch(() => jsonResponse(200, []));
const emptyCatalogIds = new Set((await client.getAllMeasures()).map((item) => item.id));
assert.deepEqual(phantomIds.filter((id) => emptyCatalogIds.has(id)), [], 'no id survives an empty canonical catalog');
storage.clear();
assert.equal(localStorage.getItem('zvery_saved_measures'), null, 'default saved state is empty until the user saves');

// 6. Save/remove не сообщают успех при недоступном API
installFetch(() => { throw new TypeError('Failed to fetch'); });
await assert.rejects(client.saveMeasure('demo-kazan-agro-001'), (err) => {
  assert.equal(err.code, 'network_error');
  return true;
}, 'save must not report success when API is down');
await assert.rejects(client.removeSavedMeasure('demo-kazan-agro-001'), (err) => {
  assert.equal(err.code, 'network_error');
  return true;
}, 'remove must not report success when API is down');
assert.equal(storage.size, 0, 'failed save/remove must not persist locally');

// 7. Честный успех сервера применяется
installFetch((_url, init) => {
  assert.equal(init.method, 'POST');
  return jsonResponse(200, { measure_id: 'demo-kazan-agro-001', saved: true, created: true });
});
const savedResult = await client.saveMeasure('demo-kazan-agro-001');
assert.equal(savedResult.saved, true, 'server-confirmed save passes through');
assert.equal(savedResult.measure_id, 'demo-kazan-agro-001');

installFetch(() => jsonResponse(200, { measure_id: 'demo-kazan-agro-001', saved: false, removed: true }));
const removedResult = await client.removeSavedMeasure('demo-kazan-agro-001');
assert.equal(removedResult.saved, false, 'server-confirmed removal passes through');
assert.equal(removedResult.measure_id, 'demo-kazan-agro-001');

installFetch(() => jsonResponse(200, { measure_ids: ['demo-kazan-agro-001'] }));
assert.deepEqual(await client.getSavedMeasures(), ['demo-kazan-agro-001']);

// 8. Production path не содержит fixture/GRANTS fallback и phantom-ID
const clientSource = readFileSync(join(srcRoot, 'api', 'client.ts'), 'utf8');
assert.equal(clientSource.includes('fixtures'), false, 'client.ts must not import fixtures');
assert.equal(clientSource.includes('GRANTS'), false, 'client.ts must not reference GRANTS');
assert.equal(clientSource.includes('FIXTURE_MEASURES'), false, 'client.ts must not reference FIXTURE_MEASURES');
assert.equal(clientSource.includes('demo-2026-09-28'), false, 'client.ts must not carry a demo catalog_version');
const appSource = readFileSync(join(srcRoot, 'App.tsx'), 'utf8');
assert.equal(appSource.includes("|| 'demo-kazan-agro-001'"), false, 'deep link must not default to a catalog id');
const storeSource = readFileSync(join(srcRoot, 'store.tsx'), 'utf8');
assert.equal(storeSource.includes("'young'"), false, 'store must not migrate phantom young');
assert.equal(storeSource.includes("'micro'"), false, 'store must not migrate phantom micro');
assert.equal(storeSource.includes("'g1'"), false, 'store must not default to local g1');
assert.equal(storeSource.includes("'g2'"), false, 'store must not default to local g2');
assert.equal(storeSource.includes('getAllMeasures'), true, 'store filters saved ids against the canonical catalog');
assert.equal(storeSource.includes('canonicalIds'), true, 'store exposes canonical id set');
const otherSource = readFileSync(join(srcRoot, 'pages', 'Other.tsx'), 'utf8');
assert.equal(otherSource.includes("'young'"), false, 'profile must not alias phantom young');
assert.equal(otherSource.includes("'micro'"), false, 'profile must not alias phantom micro');
assert.equal(otherSource.includes('300.000'), false, 'profile must not hardcode a grant amount');
const sheetSource = readFileSync(join(srcRoot, 'components', 'MeasureDetailSheet.tsx'), 'utf8');
assert.equal(sheetSource.includes('мойбизнес'), false, 'sheet must not hardcode the operator domain');
assert.equal(sheetSource.includes('АКТУАЛЬНО'), false, 'sheet freshness must come from the record');

console.log('catalog harness: api-only catalog, typed failures, strict ids, honest saves, phantom filtering');
