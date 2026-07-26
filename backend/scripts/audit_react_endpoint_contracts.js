#!/usr/bin/env node

/**
 * Inventario estático React -> API -> NestJS.
 *
 * No ejecuta endpoints ni modifica datos. El objetivo es que la revisión no
 * dependa de una lista manual que pueda omitir páginas o controladores.
 *
 * Uso:
 *   node backend/scripts/audit_react_endpoint_contracts.js [salida.txt]
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const webSrc = path.join(root, 'web/src');
const backendSrc = path.join(root, 'backend/src');
const outputPath = path.resolve(
  process.argv[2] ||
    path.join(root, 'docs/MATRIZ_REACT_ENDPOINTS_IA_NUCLEO_2026-07-26.txt'),
);

function walk(dir, predicate) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full, predicate));
    else if (predicate(full)) result.push(full);
  }
  return result.sort();
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function normalizeEndpoint(raw) {
  if (!raw) return '';
  let value = raw.trim();
  value = value.replace(/\$\{[^}]*(?:API|BASE_URL|api)[^}]*\}/g, '');
  value = value.replace(/\$\{[^}]+\}/g, ':param');
  value = value.replace(/^https?:\/\/[^/]+/i, '');
  value = value.replace(/^\/api(?:\/v\d+)?(?=\/|$)/, '');
  value = value.split('?')[0];
  if (!value.startsWith('/')) value = `/${value}`;
  value = value.replace(/\/+/g, '/');
  if (value.length > 1) value = value.replace(/\/$/, '');
  return value;
}

function endpointMatches(frontendPath, backendPath) {
  const left = normalizeEndpoint(frontendPath).split('/').filter(Boolean);
  const right = normalizeEndpoint(backendPath).split('/').filter(Boolean);
  if (left.length !== right.length) return false;
  return left.every((segment, index) => {
    const expected = right[index];
    return (
      segment === expected ||
      segment === ':param' ||
      expected.startsWith(':') ||
      segment.startsWith(':')
    );
  });
}

function extractBackendEndpoints() {
  const files = walk(
    backendSrc,
    (file) => file.endsWith('.controller.ts'),
  );
  const endpoints = [];
  const decoratorPattern = /@(Get|Post|Put|Patch|Delete)\s*\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/g;

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const controllerPattern =
      /@Controller\s*\(\s*['"`]([^'"`]*)['"`]\s*\)/g;
    const controllers = [];
    let controllerMatch;
    while ((controllerMatch = controllerPattern.exec(source))) {
      controllers.push({
        base: controllerMatch[1],
        start: controllerPattern.lastIndex,
      });
    }
    for (let index = 0; index < controllers.length; index++) {
      const controller = controllers[index];
      const end =
        index + 1 < controllers.length ? controllers[index + 1].start : source.length;
      const chunk = source.slice(controller.start, end);
      decoratorPattern.lastIndex = 0;
      let match;
      while ((match = decoratorPattern.exec(chunk))) {
        const after = chunk.slice(decoratorPattern.lastIndex);
        const methodMatch = after.match(
          /(?:@[\w.]+(?:\([^)]*\))?\s*)*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(/,
        );
        const method = match[1].toUpperCase();
        const suffix = match[2] || '';
        endpoints.push({
          method,
          path: normalizeEndpoint(`/${controller.base}/${suffix}`),
          handler: methodMatch ? methodMatch[1] : 'NO_RESUELTO',
          file: relative(file),
        });
      }
    }
  }
  return endpoints.sort((a, b) =>
    `${a.path} ${a.method}`.localeCompare(`${b.path} ${b.method}`),
  );
}

function extractApiCalls(file, source) {
  const calls = [];
  const literalCall =
    /\b(apiClient|axios|fetcher|fetch)\s*(?:\.\s*(get|post|put|patch|delete))?\s*\(\s*(['"`])([\s\S]*?)\3/g;
  let match;
  while ((match = literalCall.exec(source))) {
    const client = match[1];
    const method = (match[2] || 'GET').toUpperCase();
    const raw = match[4].replace(/\s+/g, ' ').trim();
    if (!raw || (!raw.includes('/') && !raw.includes('${'))) continue;
    const line = source.slice(0, match.index).split('\n').length;
    const sourceLine = source.split('\n')[line - 1] || '';
    if (sourceLine.trimStart().startsWith('//')) continue;
    calls.push({
      method,
      path: normalizeEndpoint(raw),
      raw,
      file: relative(file),
      line,
      client,
      resolvable: true,
    });
  }

  const allCallPattern =
    /\b(apiClient|axios)\s*\.\s*(get|post|put|patch|delete)\s*\(/g;
  let totalKnownClients = 0;
  let allCallMatch;
  while ((allCallMatch = allCallPattern.exec(source))) {
    const line = source.slice(0, allCallMatch.index).split('\n').length;
    const sourceLine = source.split('\n')[line - 1] || '';
    if (!sourceLine.trimStart().startsWith('//')) totalKnownClients++;
  }
  const resolvedKnownClients = calls.filter((call) =>
    ['apiClient', 'axios'].includes(call.client),
  ).length;
  for (let index = resolvedKnownClients; index < totalKnownClients; index++) {
    calls.push({
      method: 'NO_RESUELTO',
      path: 'ARGUMENTO_DINAMICO',
      raw: '',
      file: relative(file),
      line: 0,
      client: 'apiClient/axios',
      resolvable: false,
    });
  }
  return calls;
}

function resolveImport(fromFile, specifier) {
  let base;
  if (specifier.startsWith('@/')) {
    base = path.join(webSrc, specifier.slice(2));
  } else if (specifier.startsWith('.')) {
    base = path.resolve(path.dirname(fromFile), specifier);
  } else {
    return null;
  }
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function extractFrontendInventory() {
  const files = walk(webSrc, (file) => /\.(ts|tsx)$/.test(file));
  const fileData = new Map();
  const importPattern = /(?:import|export)\s+[\s\S]*?\sfrom\s+['"]([^'"]+)['"]/g;

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const imports = [];
    let match;
    while ((match = importPattern.exec(source))) {
      const resolved = resolveImport(file, match[1]);
      if (resolved) imports.push(resolved);
    }
    fileData.set(file, {
      imports: [...new Set(imports)],
      calls: extractApiCalls(file, source),
    });
  }
  return { files, fileData };
}

function extractRoutes() {
  const appFile = path.join(webSrc, 'App.tsx');
  const source = fs.readFileSync(appFile, 'utf8');
  const lazyImports = new Map();
  const lazyPattern =
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]([^'"]+)['"]\s*\)\s*,?\s*\)/g;
  let match;
  while ((match = lazyPattern.exec(source))) {
    lazyImports.set(match[1], resolveImport(appFile, match[2]));
  }

  const routes = [];
  const routePattern = /<Route\b([\s\S]*?)\/>/g;
  while ((match = routePattern.exec(source))) {
    const block = match[1];
    const pathMatch = block.match(/\bpath\s*=\s*["']([^"']+)["']/);
    if (!pathMatch) continue;
    const componentMatches = [
      ...block.matchAll(/<([A-Z][A-Za-z0-9_$]*)\b/g),
    ].map((item) => item[1]);
    const component = componentMatches
      .reverse()
      .find((name) => name !== 'ProtectedRoute');
    routes.push({
      route: pathMatch[1],
      component: component || 'NO_RESUELTO',
      pageFile: component ? lazyImports.get(component) || null : null,
    });
  }
  return routes;
}

function transitiveCalls(startFile, fileData) {
  if (!startFile || !fileData.has(startFile)) return [];
  const pending = [startFile];
  const visited = new Set();
  const calls = [];
  while (pending.length) {
    const current = pending.pop();
    if (!current || visited.has(current) || !fileData.has(current)) continue;
    visited.add(current);
    const data = fileData.get(current);
    calls.push(...data.calls);
    pending.push(...data.imports);
  }
  const unique = new Map();
  for (const call of calls) {
    unique.set(`${call.method}|${call.path}|${call.file}|${call.line}`, call);
  }
  return [...unique.values()];
}

function statusForCall(call, backendEndpoints) {
  if (!call.resolvable) return { status: 'REVISAR_DINAMICO', matches: [] };
  const pathMatches = backendEndpoints.filter((endpoint) =>
    endpointMatches(call.path, endpoint.path),
  );
  const exact = pathMatches.filter((endpoint) => endpoint.method === call.method);
  if (exact.length) return { status: 'OK', matches: exact };
  if (pathMatches.length) return { status: 'METODO_INCOMPATIBLE', matches: pathMatches };
  return { status: 'ENDPOINT_NO_EXISTE', matches: [] };
}

function render() {
  const backendEndpoints = extractBackendEndpoints();
  const { files, fileData } = extractFrontendInventory();
  const routes = extractRoutes();
  const pageFiles = files.filter((file) =>
    relative(file).startsWith('web/src/pages/'),
  );
  const routedPages = new Set(routes.map((route) => route.pageFile).filter(Boolean));
  const allCalls = [...fileData.values()].flatMap((data) => data.calls);
  const callResults = allCalls.map((call) => ({
    call,
    result: statusForCall(call, backendEndpoints),
  }));

  const lines = [];
  const push = (...values) => lines.push(...values);
  push(
    'MATRIZ REACT <-> ENDPOINTS NESTJS - IA-NUCLEO',
    `Generado: ${new Date().toISOString()}`,
    'Alcance: inventario estático completo; no ejecuta operaciones ni modifica datos.',
    '',
    'RESUMEN',
    `- Rutas React detectadas: ${routes.length}`,
    `- Archivos de página detectados: ${pageFiles.length}`,
    `- Páginas sin ruta directa: ${pageFiles.filter((file) => !routedPages.has(file)).length}`,
    `- Endpoints NestJS detectados: ${backendEndpoints.length}`,
    `- Llamadas API literales/dinámicas detectadas: ${allCalls.length}`,
    `- Llamadas con endpoint inexistente: ${callResults.filter((item) => item.result.status === 'ENDPOINT_NO_EXISTE').length}`,
    `- Llamadas con método incompatible: ${callResults.filter((item) => item.result.status === 'METODO_INCOMPATIBLE').length}`,
    `- Llamadas dinámicas a revisar: ${callResults.filter((item) => item.result.status === 'REVISAR_DINAMICO').length}`,
    '',
    'REGLA DE LECTURA',
    '- OK: método y ruta compatibles con un controlador NestJS.',
    '- ENDPOINT_NO_EXISTE: no hay ruta estructural equivalente.',
    '- METODO_INCOMPATIBLE: existe la ruta, pero no el verbo HTTP usado.',
    '- REVISAR_DINAMICO: la URL no es literal y requiere inspección manual.',
    '- SIN_LLAMADAS: la página puede ser visual, usar contexto o depender de un hijo no resuelto.',
    '',
    'A. TODAS LAS RUTAS REACT Y SUS CONSUMOS TRANSITIVOS',
  );

  routes.forEach((route, index) => {
    const calls = transitiveCalls(route.pageFile, fileData);
    push(
      '',
      `A.${index + 1} ${route.route}`,
      `Componente: ${route.component}`,
      `Página: ${route.pageFile ? relative(route.pageFile) : 'NO_RESUELTA'}`,
    );
    if (!calls.length) {
      push('  [SIN_LLAMADAS]');
      return;
    }
    calls.forEach((call) => {
      const result = statusForCall(call, backendEndpoints);
      push(
        `  [${result.status}] ${call.method} ${call.path} <- ${call.file}:${call.line || '?'}`,
      );
    });
  });

  push('', 'B. PÁGINAS SIN RUTA DIRECTA EN App.tsx');
  pageFiles
    .filter((file) => !routedPages.has(file))
    .forEach((file, index) => {
      const calls = transitiveCalls(file, fileData);
      push('', `B.${index + 1} ${relative(file)}`);
      if (!calls.length) push('  [SIN_LLAMADAS]');
      calls.forEach((call) => {
        const result = statusForCall(call, backendEndpoints);
        push(
          `  [${result.status}] ${call.method} ${call.path} <- ${call.file}:${call.line || '?'}`,
        );
      });
    });

  push('', 'C. HALLAZGOS FRONTEND QUE REQUIEREN ACCIÓN');
  const actionable = callResults.filter((item) => item.result.status !== 'OK');
  actionable.forEach(({ call, result }, index) => {
    const alternatives = result.matches
      .map((endpoint) => `${endpoint.method} ${endpoint.path}`)
      .join(', ');
    push(
      `C.${index + 1} [${result.status}] ${call.method} ${call.path}`,
      `  Fuente: ${call.file}:${call.line || '?'}`,
      `  Alternativas backend: ${alternatives || 'ninguna'}`,
    );
  });
  if (!actionable.length) push('Sin hallazgos estáticos.');

  push('', 'D. TODOS LOS ENDPOINTS NESTJS Y CONSUMIDORES REACT');
  backendEndpoints.forEach((endpoint, index) => {
    const consumers = allCalls.filter(
      (call) =>
        call.resolvable &&
        call.method === endpoint.method &&
        endpointMatches(call.path, endpoint.path),
    );
    push(
      '',
      `D.${index + 1} ${endpoint.method} ${endpoint.path}`,
      `  Backend: ${endpoint.file}#${endpoint.handler}`,
      `  Consumidores React: ${consumers.length}`,
    );
    consumers.forEach((call) =>
      push(`    - ${call.file}:${call.line} (${call.path})`),
    );
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
  process.stdout.write(
    JSON.stringify(
      {
        output: relative(outputPath),
        reactRoutes: routes.length,
        pageFiles: pageFiles.length,
        backendEndpoints: backendEndpoints.length,
        frontendCalls: allCalls.length,
        missing: callResults.filter(
          (item) => item.result.status === 'ENDPOINT_NO_EXISTE',
        ).length,
        wrongMethod: callResults.filter(
          (item) => item.result.status === 'METODO_INCOMPATIBLE',
        ).length,
        dynamic: callResults.filter(
          (item) => item.result.status === 'REVISAR_DINAMICO',
        ).length,
      },
      null,
      2,
    ) + '\n',
  );
}

render();
