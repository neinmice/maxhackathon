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
    if (request === './fixtures') {
      return {
        FIXTURE_MEASURES: [
          {
            id: 'fixture-should-not-leak',
            title: 'FIXTURE LEAK',
            data_status: 'CONFIRMED',
            region: 'kazan',
            roles: ['ip'],
            tax_modes: ['usn6'],
            last_checked: '2026-09-20',
          },
        ],
      };
    }
    if (request.endsWith('/api/client') || request === '../api/client' || request === './api/client') {
      return load('api/client.ts');
    }
    if (request === 'lucide-react' || request.includes('MascotProps')) {
      return new Proxy({}, { get: () => () => null });
    }
    if (request.includes('maxBridge')) {
      return {
        triggerHaptic() {},
        getVerifiedInitData() {
          const initData = globalThis.window?.WebApp?.initData;
          if (typeof initData !== 'string') return null;
          const trimmed = initData.trim();
          return trimmed.length > 0 ? trimmed : null;
        },
      };
    }
    throw new Error(`Unexpected import in honesty regression: ${request} from ${relativePath}`);
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

function createRenderer() {
  const hookValues = [];
  let hookCursor = 0;
  const React = {
    useState(initial) {
      const index = hookCursor++;
      if (hookValues.length <= index) {
        hookValues[index] = typeof initial === 'function' ? initial() : initial;
      }
      const setState = (update) => {
        hookValues[index] = typeof update === 'function' ? update(hookValues[index]) : update;
      };
      return [hookValues[index], setState];
    },
    createElement(type, props, ...children) {
      return { type, props: { ...(props ?? {}), children } };
    },
  };
  React.default = React;
  return {
    React,
    reset() {
      hookValues.length = 0;
      hookCursor = 0;
    },
    render(Component, props) {
      hookCursor = 0;
      return Component(props);
    },
  };
}

function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('\n');
  return textOf(node.props?.children);
}

function findButtons(node, acc = []) {
  if (node == null || typeof node === 'boolean' || typeof node === 'string' || typeof node === 'number') {
    return acc;
  }
  if (Array.isArray(node)) {
    for (const child of node) findButtons(child, acc);
    return acc;
  }
  if (node.type === 'button') acc.push(node);
  findButtons(node.props?.children, acc);
  return acc;
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

function assertNoCertificateStored() {
  for (const [key, value] of storage.entries()) {
    const haystack = `${key}\n${value}`;
    assert.equal(haystack.includes('zvery_certificates'), false, key);
    assert.equal(haystack.includes('ZVERY-NAV'), false, key);
    assert.equal(haystack.includes('certificate'), false, key);
  }
}

const certificateSources = [
  'components/education/EducationView.tsx',
  'components/assistant/MascotAssistantView.tsx',
];
const forbiddenSource = [
  'saveCertificate',
  'loadCertificates',
  'StoredCertificate',
  'ZVERY-NAV',
  'Тест сдан',
  'ПАМЯТНЫЙ СЕРТИФИКАТ',
  'Выдан предпринимателю',
  'выдавать памятный сертификат',
];
for (const relativePath of certificateSources) {
  const source = readFileSync(join(srcRoot, relativePath), 'utf8');
  for (const marker of forbiddenSource) {
    assert.equal(source.includes(marker), false, `${relativePath} still contains ${marker}`);
  }
}

const educationRuntime = createRenderer();
const educationModule = load('components/education/EducationView.tsx', {
  react: educationRuntime.React,
});
const mascotRuntime = createRenderer();
const mascotModule = load('components/assistant/MascotAssistantView.tsx', {
  react: mascotRuntime.React,
});
const { EducationView } = educationModule;
const { MascotAssistantView } = mascotModule;

function renderEducation() {
  return educationRuntime.render(EducationView, {
    userName: 'Тест',
    savedMeasures: [],
    progress: {},
    onToggleItem() {},
    onOpenMeasure() {},
  });
}

function finishEducationQuiz() {
  educationRuntime.reset();
  let tree = renderEducation();
  const quizTab = findButtons(tree).find((button) => textOf(button).includes('Квиз и сертификат'));
  assert.ok(quizTab, 'quiz tab missing');
  quizTab.props.onClick();
  tree = renderEducation();
  for (let step = 0; step < 3; step += 1) {
    const option = findButtons(tree).find((button) => {
      const label = textOf(button);
      return !['Программы', 'Квиз и сертификат', 'Мой чеклист'].some((tab) => label.includes(tab));
    });
    assert.ok(option, `quiz option missing at step ${step}`);
    option.props.onClick();
    tree = renderEducation();
  }
  return tree;
}

function renderMascot() {
  mascotRuntime.reset();
  return mascotRuntime.render(MascotAssistantView, {
    userName: 'Тест',
    onOpenMeasure() {},
    onOpenCatalog() {},
    onOpenEducation() {},
  });
}

function assertCertificateScreensStayUnissued() {
  const educationText = textOf(finishEducationQuiz());
  assert.match(educationText, /Сертификат не выдан/);
  assert.equal(/Тест сдан|ПАМЯТНЫЙ СЕРТИФИКАТ|Выдан предпринимателю|Балл:|ZVERY-NAV|№\s+\S+/.test(educationText), false);
  const mascotText = textOf(renderMascot());
  assert.equal(/Тест сдан|ПАМЯТНЫЙ СЕРТИФИКАТ|Выдан предпринимателю|Балл:|ZVERY-NAV|№\s+\S+/.test(mascotText), false);
  assertNoCertificateStored();
}

const clientModule = load('api/client.ts');
const { ApiClient, ApiErrorResponse } = clientModule;
const client = new ApiClient('http://bot.local');

const cases = [
  {
    name: 'bot down',
    response: () => {
      throw new TypeError('Failed to fetch');
    },
    kind: 'network',
  },
  {
    name: '401',
    response: () => jsonResponse(401, {
      error: { code: 'invalid_launch_data', message: 'Некорректные данные запуска', request_id: 'req-401' },
    }),
    kind: 'unauthorized',
    code: 'invalid_launch_data',
  },
  {
    name: '404',
    response: () => jsonResponse(404, {
      error: { code: 'measure_not_found', message: 'Мера не найдена', request_id: 'req-404' },
    }),
    kind: 'client',
    code: 'measure_not_found',
  },
  {
    name: '503',
    response: () => jsonResponse(503, {
      error: { code: 'quiz_not_configured', message: 'Ключ ответов квиза ещё не настроен', request_id: 'req-503' },
    }),
    kind: 'unavailable',
    code: 'quiz_not_configured',
  },
];

const forbidden = [
  'signed-proof.',
  'CERT-ZVERY-2026-OK',
  'mock_ok',
  'offline-',
  'local-attempt-',
  'fixture-should-not-leak',
  'FIXTURE LEAK',
  'zvery-verified-2026-09-20',
  'ZVERY-NAV',
];
const recommendationRequest = { region: 'kazan', role: 'ip', tax_mode: 'usn6' };

function assertApiFailure(err, item) {
  assert.equal(err instanceof ApiErrorResponse, true);
  assert.equal(err.kind, item.kind);
  if (item.code) assert.equal(err.code, item.code);
  const serialized = JSON.stringify(err);
  for (const marker of forbidden) assert.equal(serialized.includes(marker), false);
  return true;
}

for (const item of cases) {
  installFetch(item.response);

  await assert.rejects(client.getHealth(), (err) => {
    assert.equal(err instanceof ApiErrorResponse, true);
    assert.equal(err.kind, item.kind);
    assert.notEqual(err.message, 'mock_ok');
    return true;
  }, `${item.name}: health must not become mock_ok`);

  await assert.rejects(client.submitQuiz('v1', { q1: 'a' }), (err) => {
    assertApiFailure(err, item);
    return true;
  }, `${item.name}: quiz must not issue a certificate`);

  await assert.rejects(client.saveMeasure('young'), (err) => {
    assert.equal(err.kind, item.kind);
    return true;
  }, `${item.name}: save must not report success`);

  await assert.rejects(client.optInNotifications(true), (err) => {
    assert.equal(err.kind, item.kind);
    return true;
  }, `${item.name}: opt-in must not report enabled`);

  await assert.rejects(client.getRecommendations(recommendationRequest), (err) => {
    assertApiFailure(err, item);
    return true;
  }, `${item.name}: recommendations must not use the fixture catalog`);

  await assert.rejects(client.getMeasure('unknown-id'), (err) => {
    assertApiFailure(err, item);
    return true;
  }, `${item.name}: unknown measure must not become a fixture card`);

  await assert.rejects(client.getAllMeasures(), (err) => {
    assertApiFailure(err, item);
    return true;
  }, `${item.name}: measure list must not become fixtures`);

  await assert.rejects(client.getSavedMeasures(), (err) => {
    assertApiFailure(err, item);
    return true;
  }, `${item.name}: saved measures must not become an empty success`);

  assertCertificateScreensStayUnissued();
}

installFetch(() => jsonResponse(200, '<html>proxy</html>'));
for (const call of [
  () => client.submitQuiz('v1', { q1: 'a' }),
  () => client.getRecommendations(recommendationRequest),
  () => client.getMeasure('unknown-id'),
  () => client.getAllMeasures(),
  () => client.getSavedMeasures(),
]) {
  await assert.rejects(call, (err) => {
    assert.equal(err instanceof ApiErrorResponse, true);
    assert.equal(err.code, 'invalid_response');
    assert.equal(err.kind, 'unavailable');
    return true;
  }, 'non-json proxy response is not success');
}
assertCertificateScreensStayUnissued();

installFetch(() => jsonResponse(200, { status: 'ok', version: '1' }));
const health = await client.getHealth();
assert.deepEqual(health, { status: 'ok', version: '1' });

installFetch(() => jsonResponse(200, {
  attempt_id: 'srv-1',
  score: 40,
  passed: false,
  pass_score: 70,
  certificate: null,
}));
const failedQuiz = await client.submitQuiz('v1', { q1: 'a' });
assert.equal(failedQuiz.passed, false);
assert.equal(failedQuiz.certificate, null);
assert.equal(failedQuiz.score, 40);
assert.equal(failedQuiz.pass_score, 70);

installFetch(() => jsonResponse(200, {
  attempt_id: 'srv-2',
  score: 100,
  passed: true,
  pass_score: 70,
  certificate: null,
}));
await assert.rejects(client.submitQuiz('v1', { q1: 'a' }), (err) => {
  assert.equal(err.code, 'invalid_response');
  return true;
}, 'passed without a server certificate is not success');

installFetch(() => jsonResponse(200, { items: [], catalog_version: 'demo-2026-09-19' }));
const emptyRecommendations = await client.getRecommendations(recommendationRequest);
assert.deepEqual(emptyRecommendations, { items: [], catalog_version: 'demo-2026-09-19' });

installFetch(() => jsonResponse(200, { measure_ids: [] }));
assert.deepEqual(await client.getSavedMeasures(), []);

installFetch(() => jsonResponse(200, []));
assert.deepEqual(await client.getAllMeasures(), []);

const confirmedMeasure = {
  id: 'demo-kazan-agro-001',
  title: 'Демонстрационная мера: агро, Казань',
  operator: 'Модельный оператор каталога',
  region: 'kazan',
  roles: ['ip', 'self_employed'],
  tax_modes: ['usn6', 'none'],
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
};
installFetch(() => jsonResponse(200, confirmedMeasure));
assert.equal((await client.getMeasure('demo-kazan-agro-001')).id, 'demo-kazan-agro-001');

installFetch(() => jsonResponse(200, { ...confirmedMeasure, id: 'fixture-should-not-leak' }));
await assert.rejects(client.getMeasure('demo-kazan-agro-001'), (err) => {
  assert.equal(err instanceof ApiErrorResponse, true);
  assert.equal(err.code, 'invalid_response');
  assert.equal(JSON.stringify(err).includes('fixture-should-not-leak'), false);
  return true;
}, 'mismatched measure id must not replace the requested card');

const bridgeModule = load('lib/maxBridge.ts', { '../types/bridge': {} });
const {
  getDisplayUser,
  getVerifiedInitData,
  measureIdFromStartParam,
  parseStartParam,
} = bridgeModule;

globalThis.window = {};
assert.equal(getDisplayUser(), null);
assert.equal(getVerifiedInitData(), null);
assert.equal(measureIdFromStartParam('measure'), null);
assert.equal(measureIdFromStartParam('measure_missing-id'), 'missing-id');
assert.equal(parseStartParam('measure demo'), null);
assert.equal(parseStartParam('a'.repeat(513)), null);
assert.equal(parseStartParam('measure_demo-kazan-agro-001'), 'measure_demo-kazan-agro-001');

globalThis.window = {
  WebApp: {
    initData: '   ',
    initDataUnsafe: { user: { id: 1, first_name: 'Анастасия' }, start_param: 'measure_demo-kazan-agro-001' },
  },
};
assert.equal(getVerifiedInitData(), null);
assert.equal(getDisplayUser().first_name, 'Анастасия');
assert.equal(measureIdFromStartParam(bridgeModule.getDeepLinkPayload()), 'demo-kazan-agro-001');

const appSource = readFileSync(join(srcRoot, 'App.tsx'), 'utf8');
const onboardingSource = readFileSync(join(srcRoot, 'components/OnboardingSheet.tsx'), 'utf8');
const storeSource = readFileSync(join(srcRoot, 'store.tsx'), 'utf8');
const sheetSource = readFileSync(join(srcRoot, 'components/MeasureDetailSheet.tsx'), 'utf8');
const profileSource = readFileSync(join(srcRoot, 'pages/Other.tsx'), 'utf8');
assert.equal(appSource.includes("params.get('cert')"), false);
assert.equal(appSource.includes('openMeasure(measureId)'), true);
assert.equal(appSource.includes('GRANTS'), false);
assert.equal(/id:\s*'start'|id:\s*'grants'|id:\s*'growth'|id:\s*'education'/.test(onboardingSource), false);
assert.equal(onboardingSource.includes('requestRecommendations'), true);
assert.equal(onboardingSource.includes('setTimeout'), false);
assert.equal(storeSource.includes('Анастасия'), false);
assert.equal(storeSource.includes("'young'"), false);
assert.equal(storeSource.includes('getSavedMeasures'), true);
assert.equal(sheetSource.includes('ПРОВЕРЕНО'), false);
assert.equal(sheetSource.includes('мойбизнес'), false);
assert.equal(profileSource.includes('1 активная'), false);
assert.equal(profileSource.includes('300.000'), false);

storage.clear();
installFetch(() => jsonResponse(404, {
  error: { code: 'measure_not_found', message: 'Мера не найдена', request_id: 'req-save' },
}));
await assert.rejects(client.saveMeasure('missing-id'), (err) => {
  assert.equal(err.code, 'measure_not_found');
  return true;
});
assert.equal(storage.size, 0);

installFetch(() => jsonResponse(200, {
  regions: ['kazan', 'moscow', 'spb'],
  roles: ['ip'],
  tax_modes: ['usn6'],
  sectors: ['agro', 'services', 'it'],
  goals: ['support'],
  accepted_tax_modes: ['npd', 'usn6', 'usn15', 'ausn', 'osno', 'none'],
  content_gaps: ['moscow', 'spb'],
  catalog_version: 'demo-2026-09-19',
}));
const filters = await client.getCatalogFilters();
assert.deepEqual(filters.content_gaps, ['moscow', 'spb']);
assert.deepEqual(filters.goals, ['support']);
assert.equal(filters.goals.includes('start'), false);

installFetch((_url, init) => {
  const body = JSON.parse(init.body);
  assert.equal(body.region, 'moscow');
  assert.equal(body.goal, 'support');
  return jsonResponse(200, { items: [], catalog_version: 'demo-2026-09-19' });
});
const moscow = await client.getRecommendations({
  region: 'moscow',
  role: 'ip',
  tax_mode: 'usn6',
  sector: 'agro',
  goal: 'support',
});
assert.deepEqual(moscow.items, []);

installFetch(() => jsonResponse(404, {
  error: { code: 'measure_not_found', message: 'Мера не найдена', request_id: 'req-missing' },
}));
await assert.rejects(client.getMeasure('missing-id'), (err) => {
  assert.equal(err.status, 404);
  assert.equal(err.code, 'measure_not_found');
  assert.equal(JSON.stringify(err).includes('demo-kazan-agro-001'), false);
  return true;
});
assertNoCertificateStored();

console.log('honesty regressions: failure modes, non-json, empty confirmed lists, certificate screens');
