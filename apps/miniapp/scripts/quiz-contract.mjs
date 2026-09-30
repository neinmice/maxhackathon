// Focused H4 harness: quiz/certificate — только серверный результат, storage/query invariants.
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
      jsx: ts.JsxEmit.React,
    },
    fileName: relativePath,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (request) => {
    if (request.endsWith('/api/client') || request === '../api/client' || request === './api/client') {
      return load('api/client.ts');
    }
    throw new Error(`Unexpected import in quiz contract harness: ${request} from ${relativePath}`);
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

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => storage.set(String(key), String(value)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

const storageModule = load('lib/storage.ts');
const { saveCertificate, loadCertificates } = storageModule;
const { ApiClient, ApiErrorResponse } = load('api/client.ts');
const client = new ApiClient('http://bot.local');

// 1..4: failure modes — все дают typed rejection без сертификата
const failureModes = [
  {
    name: 'network down',
    respond: () => { throw new TypeError('Failed to fetch'); },
    check(err) {
      assert.equal(err instanceof ApiErrorResponse, true);
      assert.equal(err.code, 'network_error');
      assert.equal(err.kind, 'network');
    },
  },
  {
    name: '401 invalid launch data',
    respond: () => jsonResponse(401, {
      error: { code: 'invalid_launch_data', message: 'Некорректные данные запуска', request_id: 'req-401' },
    }),
    check(err) {
      assert.equal(err.code, 'invalid_launch_data');
      assert.equal(err.status, 401);
      assert.equal(err.kind, 'unauthorized');
    },
  },
  {
    name: '503 quiz_not_configured',
    respond: () => jsonResponse(503, {
      error: { code: 'quiz_not_configured', message: 'Ключ ответов квиза ещё не настроен', request_id: 'req-503' },
    }),
    check(err) {
      assert.equal(err.code, 'quiz_not_configured');
      assert.equal(err.status, 503);
      assert.equal(err.kind, 'unavailable');
    },
  },
  {
    name: '200 non-json body',
    respond: () => jsonResponse(200, '<html>proxy error</html>'),
    check(err) {
      assert.equal(err.code, 'invalid_response');
    },
  },
  {
    name: '200 schema mismatch (no attempt_id/pass_score)',
    respond: () => jsonResponse(200, { score: 80, passed: true, certificate: null }),
    check(err) {
      assert.equal(err.code, 'invalid_response');
    },
  },
  {
    name: 'passed=true without certificate',
    respond: () => jsonResponse(200, {
      attempt_id: 'srv-x', score: 100, passed: true, pass_score: 70, certificate: null,
    }),
    check(err) {
      assert.equal(err.code, 'invalid_response');
    },
  },
  {
    name: 'passed=true with partial certificate (no payload)',
    respond: () => jsonResponse(200, {
      attempt_id: 'srv-x', score: 100, passed: true, pass_score: 70,
      certificate: { certificate_id: 'c-1', title: 't', disclaimer: 'd' },
    }),
    check(err) {
      assert.equal(err.code, 'invalid_response');
    },
  },
  {
    name: 'passed=false with unexpected certificate',
    respond: () => jsonResponse(200, {
      attempt_id: 'srv-x', score: 0, passed: false, pass_score: 70,
      certificate: { certificate_id: 'c-1', title: 't', disclaimer: 'd', payload: 'p' },
    }),
    check(err) {
      assert.equal(err.code, 'invalid_response');
    },
  },
];

for (const mode of failureModes) {
  installFetch(mode.respond);
  storage.clear();
  await assert.rejects(client.submitQuiz('v1', { q1: 'a', q2: 'b', q3: 'c', q4: 'a', q5: 'b' }), (err) => {
    mode.check(err);
    return true;
  }, `${mode.name}: quiz must reject, not fake success`);
  assert.deepEqual(loadCertificates(), [], `${mode.name}: no certificate may be persisted`);
  assert.equal([...storage.keys()].filter((k) => k.includes('quiz_completed')).length, 0, `${mode.name}: quiz_completed must not be set`);
}

// 5: server failed result — резолвится, но без сертификата
installFetch(() => jsonResponse(200, {
  attempt_id: 'srv-fail', score: 40, passed: false, pass_score: 70, certificate: null,
}));
const failed = await client.submitQuiz('v1', { q1: 'b', q2: 'b', q3: 'a', q4: 'b', q5: 'a' });
assert.equal(failed.passed, false);
assert.equal(failed.certificate, null);
assert.equal(failed.score, 40);
assert.equal(failed.pass_score, 70);
assert.deepEqual(loadCertificates(), []);

// 6: server pass с реальным сертификатом — storage хранит только точные серверные поля
installFetch(() => jsonResponse(200, {
  attempt_id: 'srv-pass', score: 100, passed: true, pass_score: 70,
  certificate: {
    certificate_id: 'srv-cert-0001',
    title: 'Памятный сертификат за прохождение квиза*',
    disclaimer: 'Сертификат носит информационно-поощрительный характер.',
    payload: 'base64urlbody.hmacsignature',
  },
}));
const passed = await client.submitQuiz('v1', { q1: 'a', q2: 'b', q3: 'c', q4: 'a', q5: 'b' });
assert.equal(passed.passed, true);
assert.equal(passed.certificate.certificate_id, 'srv-cert-0001');
saveCertificate({
  id: passed.certificate.certificate_id,
  userName: 'Тест',
  date: '1 октября 2026 г.',
  score: `${passed.score}%`,
  title: passed.certificate.title,
});
const stored = loadCertificates();
assert.equal(stored.length, 1);
assert.equal(stored[0].id, 'srv-cert-0001');
assert.equal(stored[0].title, 'Памятный сертификат за прохождение квиза*');
assert.equal(stored[0].score, '100%');
for (const entry of storage.values()) {
  for (const marker of ['offline-', 'local-attempt-', 'demo-signed-payload', 'signed-cert.', 'ZV-CERT-2026-A1B2C3D4', 'signed-demo-payload']) {
    assert.equal(entry.includes(marker), false, `fake marker leaked into storage: ${marker}`);
  }
}

// 7: повреждённый persisted payload — игнорируется, честное пустое состояние
storage.set('zvery_certificates_v1', '{not-json');
assert.deepEqual(loadCertificates(), []);

// 8: query/deeplink invariants — synthetic result и quiz_completed-доступы удалены
for (const [rel, forbidden] of [
  ['pages/QuizPage.tsx', ['cert=1', 'demo-cert-1', 'signed-demo-payload', "localStorage.setItem('quiz_completed'", 'offline-', 'ZV-CERT-']],
  ['components/QuizModal.tsx', ['cert=1', 'demo-cert-1', 'signed-demo-payload', "localStorage.setItem('quiz_completed'", 'offline-', 'ZV-CERT-']],
  ['pages/CertificatesPage.tsx', ['quiz_completed', 'ZV-CERT-2026-MVP-01']],
  ['pages/Other.tsx', ['quiz_completed']],
]) {
  const source = readFileSync(join(srcRoot, rel), 'utf8');
  for (const marker of forbidden) {
    assert.equal(source.includes(marker), false, `${rel} still contains ${marker}`);
  }
}
const appSource = readFileSync(join(srcRoot, 'App.tsx'), 'utf8');
assert.equal(appSource.includes("params.get('cert')"), false, 'App.tsx must not read cert query param');

// 9: error/retry-семантика присутствует в обеих quiz-поверхностях
for (const rel of ['pages/QuizPage.tsx', 'components/QuizModal.tsx']) {
  const source = readFileSync(join(srcRoot, rel), 'utf8');
  assert.equal(source.includes('setSubmitError'), true, `${rel}: honest error state required`);
  assert.equal(source.includes('чтобы повторить'), true, `${rel}: retry wording required`);
}

console.log('quiz contract: 8 failure/schema modes reject, failed resolves cleanly, pass persists server cert only, corrupted payload ignored, query invariants hold');
