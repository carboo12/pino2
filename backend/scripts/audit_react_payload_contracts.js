#!/usr/bin/env node

/**
 * Compara payloads literales de React con @Body() de NestJS.
 * Es una auditoría estática: los payloads construidos dinámicamente quedan
 * marcados para revisión manual, nunca se consideran correctos por suposición.
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const backendSrc = path.join(root, 'backend/src');
const webSrc = path.join(root, 'web/src');
const output = path.resolve(
  process.argv[2] ||
    path.join(root, 'docs/MATRIZ_PAYLOADS_REACT_NESTJS_2026-07-26.txt'),
);
const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function walk(dir, predicate) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full, predicate));
    else if (predicate(full)) files.push(full);
  }
  return files.sort();
}

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function decorators(node) {
  return ts.canHaveDecorators(node) ? ts.getDecorators(node) || [] : [];
}

function decoratorInfo(decorator) {
  const expression = decorator.expression;
  if (ts.isCallExpression(expression)) {
    const name = ts.isIdentifier(expression.expression)
      ? expression.expression.text
      : expression.expression.getText();
    return { name, args: expression.arguments };
  }
  return {
    name: ts.isIdentifier(expression) ? expression.text : expression.getText(),
    args: [],
  };
}

function decorator(node, names) {
  return decorators(node)
    .map(decoratorInfo)
    .find((item) => names.includes(item.name));
}

function literalText(node) {
  if (!node) return '';
  if (
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node)
  ) {
    return node.text;
  }
  if (ts.isTemplateExpression(node)) {
    return (
      node.head.text +
      node.templateSpans
        .map((span) => `:param${span.literal.text}`)
        .join('')
    );
  }
  return '';
}

function normalizeEndpoint(raw) {
  let value = String(raw || '').trim();
  value = value.replace(/^:param(?=\/)/, '');
  value = value.replace(/^https?:\/\/[^/]+/i, '');
  value = value.replace(/^\/api(?:\/v\d+)?(?=\/|$)/, '');
  if (!value.startsWith('/')) value = `/${value}`;
  value = value.split('?')[0].replace(/\/+/g, '/');
  return value.length > 1 ? value.replace(/\/$/, '') : value;
}

function endpointMatches(actual, expected) {
  const left = normalizeEndpoint(actual).split('/').filter(Boolean);
  const right = normalizeEndpoint(expected).split('/').filter(Boolean);
  return (
    left.length === right.length &&
    left.every(
      (segment, index) =>
        segment === right[index] ||
        segment.startsWith(':') ||
        right[index].startsWith(':'),
    )
  );
}

function propertyName(node) {
  if (!node) return '';
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  return node.getText();
}

function collectDtoDefinitions(files) {
  const definitions = new Map();
  for (const file of files) {
    const sourceText = fs.readFileSync(file, 'utf8');
    const source = ts.createSourceFile(
      file,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
    );
    source.forEachChild((node) => {
      if (!ts.isClassDeclaration(node) || !node.name) return;
      const fields = [];
      for (const member of node.members) {
        if (!ts.isPropertyDeclaration(member)) continue;
        const name = propertyName(member.name);
        const optionalDecorator = decorator(member, ['IsOptional']);
        fields.push({
          name,
          required: !member.questionToken && !optionalDecorator,
        });
      }
      const extendsClause = node.heritageClauses
        ?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)
        ?.types[0]?.expression.getText();
      definitions.set(node.name.text, {
        fields,
        extends: extendsClause || null,
      });
    });
  }
  return definitions;
}

function resolvedDtoFields(typeName, definitions, visited = new Set()) {
  if (!typeName || visited.has(typeName)) return [];
  visited.add(typeName);
  const definition = definitions.get(typeName);
  if (!definition) return [];
  return [
    ...resolvedDtoFields(definition.extends, definitions, visited),
    ...definition.fields,
  ];
}

function fieldsFromType(type, definitions) {
  if (!type) return { fields: [], typed: false };
  if (ts.isTypeReferenceNode(type)) {
    const name = type.typeName.getText();
    const fields = resolvedDtoFields(name, definitions);
    return { fields, typed: fields.length > 0, typeName: name };
  }
  if (ts.isTypeLiteralNode(type)) {
    const fields = type.members
      .filter(ts.isPropertySignature)
      .map((member) => ({
        name: propertyName(member.name),
        required: !member.questionToken,
      }));
    return { fields, typed: true, typeName: 'inline' };
  }
  return { fields: [], typed: false, typeName: type.getText() };
}

function extractBackendContracts(files, definitions) {
  const contracts = [];
  for (const file of files.filter((item) => item.endsWith('.controller.ts'))) {
    const sourceText = fs.readFileSync(file, 'utf8');
    const source = ts.createSourceFile(
      file,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
    );
    for (const statement of source.statements) {
      if (!ts.isClassDeclaration(statement)) continue;
      const controller = decorator(statement, ['Controller']);
      if (!controller) continue;
      const base = literalText(controller.args[0]);
      for (const member of statement.members) {
        if (!ts.isMethodDeclaration(member)) continue;
        const http = decorator(member, ['Get', 'Post', 'Put', 'Patch', 'Delete']);
        if (!http) continue;
        const method = http.name.toUpperCase();
        if (!WRITE_METHODS.has(method)) continue;
        const suffix = literalText(http.args[0]);
        const bodyParameter = member.parameters.find((parameter) =>
          Boolean(decorator(parameter, ['Body'])),
        );
        const contract = fieldsFromType(bodyParameter?.type, definitions);
        contracts.push({
          method,
          path: normalizeEndpoint(`/${base}/${suffix}`),
          handler: propertyName(member.name),
          file: rel(file),
          hasBody: Boolean(bodyParameter),
          ...contract,
        });
      }
    }
  }
  return contracts;
}

function objectKeys(expression, variableObjects, knownKeys) {
  if (!expression) return { resolved: true, keys: [], hasSpread: false };
  if (ts.isParenthesizedExpression(expression)) {
    return objectKeys(expression.expression, variableObjects, knownKeys);
  }
  if (ts.isIdentifier(expression) && variableObjects.has(expression.text)) {
    return objectKeys(
      variableObjects.get(expression.text),
      variableObjects,
      knownKeys,
    );
  }
  if (ts.isIdentifier(expression) && knownKeys.has(expression.text)) {
    return {
      resolved: true,
      keys: knownKeys.get(expression.text),
      hasSpread: false,
    };
  }
  if (!ts.isObjectLiteralExpression(expression)) {
    return { resolved: false, keys: [], hasSpread: false };
  }
  const keys = [];
  let hasSpread = false;
  for (const property of expression.properties) {
    if (ts.isSpreadAssignment(property)) {
      const spread = objectKeys(property.expression, variableObjects, knownKeys);
      if (spread.resolved && !spread.hasSpread) keys.push(...spread.keys);
      else hasSpread = true;
      continue;
    }
    if (
      ts.isPropertyAssignment(property) ||
      ts.isShorthandPropertyAssignment(property) ||
      ts.isMethodDeclaration(property)
    ) {
      keys.push(propertyName(property.name));
    }
  }
  return { resolved: true, keys: [...new Set(keys)], hasSpread };
}

function extractFrontendWrites(files) {
  const writes = [];
  for (const file of files) {
    const sourceText = fs.readFileSync(file, 'utf8');
    const source = ts.createSourceFile(
      file,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const variableObjects = new Map();
    const localTypes = new Map();
    const zodSchemas = new Map();
    const knownKeys = new Map();
    const ambiguousKnownKeys = new Set();

    function registerKnownKeys(name, keys) {
      if (!keys || ambiguousKnownKeys.has(name)) return;
      const existing = knownKeys.get(name);
      if (
        existing &&
        [...existing].sort().join('|') !== [...keys].sort().join('|')
      ) {
        knownKeys.delete(name);
        ambiguousKnownKeys.add(name);
        return;
      }
      knownKeys.set(name, keys);
    }

    for (const statement of source.statements) {
      if (ts.isInterfaceDeclaration(statement)) {
        localTypes.set(
          statement.name.text,
          statement.members
            .filter(ts.isPropertySignature)
            .map((member) => propertyName(member.name)),
        );
      }
      if (
        ts.isTypeAliasDeclaration(statement) &&
        ts.isTypeLiteralNode(statement.type)
      ) {
        localTypes.set(
          statement.name.text,
          statement.type.members
            .filter(ts.isPropertySignature)
            .map((member) => propertyName(member.name)),
        );
      }
      if (
        ts.isVariableStatement(statement)
      ) {
        for (const declaration of statement.declarationList.declarations) {
          if (
            ts.isIdentifier(declaration.name) &&
            declaration.initializer &&
            ts.isCallExpression(declaration.initializer) &&
            ts.isPropertyAccessExpression(declaration.initializer.expression) &&
            declaration.initializer.expression.name.text === 'object' &&
            declaration.initializer.arguments[0] &&
            ts.isObjectLiteralExpression(declaration.initializer.arguments[0])
          ) {
            zodSchemas.set(
              declaration.name.text,
              declaration.initializer.arguments[0].properties
                .filter(
                  (property) =>
                    ts.isPropertyAssignment(property) ||
                    ts.isShorthandPropertyAssignment(property),
                )
                .map((property) => propertyName(property.name)),
            );
          }
        }
      }
    }

    function keysFromType(type) {
      if (!type) return null;
      if (ts.isTypeReferenceNode(type)) {
        const direct = localTypes.get(type.typeName.getText());
        if (direct) return direct;
        if (
          type.typeName.getText() === 'z.infer' &&
          type.typeArguments?.[0] &&
          ts.isTypeQueryNode(type.typeArguments[0])
        ) {
          return zodSchemas.get(type.typeArguments[0].exprName.getText()) || null;
        }
      }
      if (ts.isTypeLiteralNode(type)) {
        return type.members
          .filter(ts.isPropertySignature)
          .map((member) => propertyName(member.name));
      }
      return null;
    }

    function indexVariables(node) {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        variableObjects.set(node.name.text, node.initializer);
        const keys = keysFromType(node.type);
        registerKnownKeys(node.name.text, keys);
      }
      if (ts.isParameter(node) && ts.isIdentifier(node.name)) {
        const keys = keysFromType(node.type);
        registerKnownKeys(node.name.text, keys);
      }
      ts.forEachChild(node, indexVariables);
    }
    indexVariables(source);

    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        HTTP_METHODS.has(node.expression.name.text.toLowerCase())
      ) {
        const receiver = node.expression.expression.getText(source);
        if (!['apiClient', 'axios'].includes(receiver)) {
          ts.forEachChild(node, visit);
          return;
        }
        const method = node.expression.name.text.toUpperCase();
        if (!WRITE_METHODS.has(method)) {
          ts.forEachChild(node, visit);
          return;
        }
        const endpoint = literalText(node.arguments[0]);
        if (!endpoint) {
          writes.push({
            method,
            path: 'ARGUMENTO_DINAMICO',
            file: rel(file),
            line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            payload: { resolved: false, keys: [], hasSpread: false },
          });
        } else {
          writes.push({
            method,
            path: normalizeEndpoint(endpoint),
            file: rel(file),
            line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            payload: objectKeys(node.arguments[1], variableObjects, knownKeys),
          });
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return writes;
}

function render() {
  const backendFiles = walk(backendSrc, (file) => file.endsWith('.ts'));
  const webFiles = walk(webSrc, (file) => /\.(ts|tsx)$/.test(file));
  const definitions = collectDtoDefinitions(backendFiles);
  const contracts = extractBackendContracts(backendFiles, definitions);
  const writes = extractFrontendWrites(webFiles);
  const results = writes.map((write) => {
    const matches = contracts.filter(
      (contract) =>
        contract.method === write.method &&
        endpointMatches(write.path, contract.path),
    );
    if (write.path === 'ARGUMENTO_DINAMICO' || matches.length !== 1) {
      return { write, matches, status: 'REVISAR_MANUAL', missing: [], unknown: [] };
    }
    const contract = matches[0];
    if (
      !contract.hasBody &&
      write.payload.resolved &&
      write.payload.keys.length === 0
    ) {
      return { write, matches, status: 'OK', missing: [], unknown: [] };
    }
    if (!contract.typed || !write.payload.resolved || write.payload.hasSpread) {
      return { write, matches, status: 'REVISAR_MANUAL', missing: [], unknown: [] };
    }
    const required = contract.fields
      .filter((field) => field.required)
      .map((field) => field.name);
    const allowed = new Set(contract.fields.map((field) => field.name));
    const missing = required.filter((field) => !write.payload.keys.includes(field));
    const unknown = write.payload.keys.filter((field) => !allowed.has(field));
    return {
      write,
      matches,
      status: missing.length ? 'FALTA_CAMPO_REQUERIDO' : unknown.length ? 'CAMPOS_EXTRA' : 'OK',
      missing,
      unknown,
    };
  });

  const lines = [
    'MATRIZ DE PAYLOADS REACT <-> @Body NESTJS',
    `Generado: ${new Date().toISOString()}`,
    '',
    'RESUMEN',
    `- Operaciones React de escritura detectadas: ${writes.length}`,
    `- Contratos backend de escritura detectados: ${contracts.length}`,
    `- Compatibles por análisis estático: ${results.filter((item) => item.status === 'OK').length}`,
    `- Falta campo requerido: ${results.filter((item) => item.status === 'FALTA_CAMPO_REQUERIDO').length}`,
    `- Campos extra: ${results.filter((item) => item.status === 'CAMPOS_EXTRA').length}`,
    `- Revisión manual: ${results.filter((item) => item.status === 'REVISAR_MANUAL').length}`,
    '',
    'NOTA: CAMPOS_EXTRA puede ser válido si ValidationPipe usa whitelist; se revisa',
    'porque suele revelar nombres antiguos o payloads dirigidos a otro contrato.',
    '',
    'A. OPERACIONES REACT',
  ];

  results.forEach((item, index) => {
    const contract = item.matches.length === 1 ? item.matches[0] : null;
    lines.push(
      '',
      `A.${index + 1} [${item.status}] ${item.write.method} ${item.write.path}`,
      `  React: ${item.write.file}:${item.write.line}`,
      `  Claves enviadas: ${item.write.payload.keys.join(', ') || '(no resueltas/vacío)'}`,
      `  Backend: ${contract ? `${contract.file}#${contract.handler}` : `${item.matches.length} coincidencias`}`,
      `  Tipo body: ${contract?.typeName || 'no resuelto'}`,
      `  Requeridos faltantes: ${item.missing.join(', ') || 'ninguno'}`,
      `  Campos extra: ${item.unknown.join(', ') || 'ninguno'}`,
    );
  });

  lines.push('', 'B. CONTRATOS BACKEND SIN CONSUMIDOR REACT DIRECTO');
  contracts
    .filter(
      (contract) =>
        !writes.some(
          (write) =>
            write.method === contract.method &&
            endpointMatches(write.path, contract.path),
        ),
    )
    .forEach((contract, index) => {
      lines.push(
        `B.${index + 1} ${contract.method} ${contract.path} -> ${contract.file}#${contract.handler}`,
      );
    });

  fs.writeFileSync(output, `${lines.join('\n')}\n`, 'utf8');
  process.stdout.write(
    JSON.stringify(
      {
        output: rel(output),
        frontendWrites: writes.length,
        backendWriteContracts: contracts.length,
        ok: results.filter((item) => item.status === 'OK').length,
        missingRequired: results.filter(
          (item) => item.status === 'FALTA_CAMPO_REQUERIDO',
        ).length,
        extraFields: results.filter((item) => item.status === 'CAMPOS_EXTRA').length,
        manual: results.filter((item) => item.status === 'REVISAR_MANUAL').length,
      },
      null,
      2,
    ) + '\n',
  );
}

render();
