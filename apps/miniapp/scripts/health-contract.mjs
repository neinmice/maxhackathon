// Focused health-contract harness: только getHealth, изолированно от общего
// honesty-прогона (который держит целевые assertions нереализованных Задач 4-6).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const clientSource = readFileSync(join(here, '..', 'src', 'api', 'client.ts'), 'utf8');

const transpiled = ts.transpileModule(clientSource, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
  },
  fileName: 'api/client.ts',
}).outputText;

const clientModule = { exports: {} };
const localRequire = (request) => {
  if (request === './fixtures') return { FIXTURE_MEASURES: [] };
  throw new Error(`Unexpected import in health contract harness: ${request}`);
};
new Function('exports', 'require', 'module', transpiled)(clientModule.exports, localRequire, clientModule);
const { ApiClient, ApiErrorResponse } = clientModule.exports;

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return typeof body === 'string' ? body : JSON.stringify(body);
    },
  };
}

const botHealth503 = {
  status: 'not_ready',
  service: 'bot',
  version: '0.1.0',
  max_configured: false,
  webhook_configured: false,
  database_ready: false,
};

// Матрица: [имя, ответ fetch, ожидаемый code, ожидаемый requestId]
const matrix = [
  ['network failure', () => { throw new TypeError('Failed to fetch'); }, 'network_error', undefined],
  ['HTTP 401 envelope', jsonResponse(401, { error: { code: 'invalid_launch_data', message: 'x', request_id: 'req-401' } }), 'invalid_launch_data', 'req-401'],
  ['HTTP 404 envelope', jsonResponse(404, { error: { code: 'measure_not_found', message: 'x', request_id: 'req-404' } }), 'measure_not_found', 'req-404'],
  ['HTTP 503 BotHealth без envelope', jsonResponse(503, botHealth503), 'http_error', undefined],
  ['HTTP 500 non-JSON тело', jsonResponse(500, 'Internal Server Error'), 'http_error', undefined],
  ['200 non-JSON proxy-ответ', jsonResponse(200, '<html>proxy</html>'), 'invalid_response', undefined],
  ['200 без version в схеме', jsonResponse(200, { status: 'ok' }), 'invalid_response', undefined],
];

for (const [name, response, expectCode, expectRequestId] of matrix) {
  const respond = typeof response === 'function' ? response : () => response;
  globalThis.fetch = async () => respond();
  const client = new ApiClient('http://bot.local');
  await assert.rejects(client.getHealth(), (err) => {
    assert.equal(err instanceof ApiErrorResponse, true, name);
    assert.equal(err.name, 'ApiErrorResponse', name);
    assert.equal(err.code, expectCode, name);
    assert.equal(err.requestId, expectRequestId, name);
    return true;
  }, `${name}: getHealth must reject with ApiErrorResponse`);
}

globalThis.fetch = async () => jsonResponse(200, { status: 'ok', version: '1' });
const health = await new ApiClient('http://bot.local').getHealth();
assert.deepEqual(health, { status: 'ok', version: '1' });

assert.equal(clientSource.includes('demo_ok'), false, 'demo_ok must be gone from client.ts');
assert.equal(clientSource.includes('mock_ok'), false, 'mock_ok must be gone from client.ts');

console.log(`health contract: ${matrix.length} failure modes reject with typed ApiErrorResponse, valid response resolves, no demo_ok`);
