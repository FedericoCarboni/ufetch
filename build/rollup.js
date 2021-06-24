import { attachScopes } from '@rollup/pluginutils';
import { walk } from 'estree-walker';

import path from 'path';
// import * as buildConfig from '../src/_build_config.js';
import * as inline from '../src/_inline.js';

import MagicString from 'magic-string';

const inlineMap = new Map(Object.entries(inline));

const isReference = (node, parent) => {
  if (node.type === 'MemberExpression') {
    return !node.computed && isReference(node.object, node);
  }

  if (node.type === 'Identifier') {
    // TODO is this right?
    if (parent.type === 'MemberExpression')
      return parent.computed || node === parent.object;

    // disregard the `bar` in { bar: foo }
    if (parent.type === 'Property' && node !== parent.value) return false;

    // disregard the `bar` in `class Foo { bar () {...} }`
    if (parent.type === 'MethodDefinition') return false;

    // disregard the `bar` in `export { foo as bar }`
    if (parent.type === 'ExportSpecifier' && node !== parent.local)
      return false;

    return true;
  }

  return false;
};

const flatten = (startNode) => {
  const parts = [];
  let node = startNode;

  while (node.type === 'MemberExpression') {
    parts.unshift(node.property.name);
    node = node.object;
  }

  const { name } = node;
  parts.unshift(name);

  return { name };
};

/**
 *
 * @this {import('rollup').TransformPluginContext}
 * @param {*} code
 * @param {*} id
 * @returns
 */
export async function transform(code, id) {
  const ast = this.parse(code);

  const magicString = new MagicString(code);
  ast.body.forEach((node) => {
    if (
      node.type === 'ImportDeclaration' &&
      node.source.value.endsWith('_inline.js')
    ) {
      magicString.remove(node.start, node.end);
    }
  });

  // analyse scopes
  let scope = attachScopes(ast, 'scope');

  function handleReference(node, name) {
    if (name === 'undefined') {
      magicString.overwrite(node.start, node.end, 'void 0');
      return true;
    }

    if (inlineMap.has(name) && !scope.contains(name)) {
      const value = inlineMap.get(name);

      magicString.overwrite(
        node.start,
        node.end,
        `${JSON.stringify(value)} /* ${name} */`
      );

      return true;
    }

    return false;
  }

  walk(ast, {
    enter(node, parent) {
      if (node.scope) {
        scope = node.scope;
      }
      if (node.type === 'ImportDeclaration') return this.skip();
      // if (node.type === 'FunctionDeclaration') {
      //   id.endsWith('Promise.js') && node.id.name === 'Promise' && magicString.appendRight(node.end, '\nvar PromisePrototype = Promise.prototype;');
      // }
      // if (node.type === 'MemberExpression') {
      //   if (node.object.name === 'promise') {
      //     switch(node.property.name) {
      //       case 'PromiseResult':
      //         magicString.overwrite(node.property.start, node.property.end, 'v /* PromiseResult */');
      //         return this.skip();
      //       case 'PromiseState':
      //         magicString.overwrite(node.property.start, node.property.end, 's /* PromiseState */');
      //         return this.skip();
      //       case 'PromiseReactions':
      //         magicString.overwrite(node.property.start, node.property.end, 'r /* PromiseReactions */');
      //         return this.skip();
      //     }
      //   }
      //   if (id.endsWith('Promise.js') && node.object.name === 'Promise' && node.property.name === 'prototype') {
      //     magicString.overwrite(node.start, node.end, 'PromisePrototype');
      //     return this.skip();
      //   }
      // }
      // if (node.type === 'CallExpression' && node.callee.name === 'isFunction') {
      //   if (!buildConfig.ENABLE_TYPEOF_REGEX_FUNCTION_BUGFIX) {
      //     magicString.overwrite(node.start, node.end, `(typeof (${code.slice(node.arguments[0].start, node.arguments[0].end)}) === 'function')`);
      //   }
      // }

      // special case – shorthand properties. because node.key === node.value,
      // we can't differentiate once we've descended into the node
      if (node.type === 'Property' && node.shorthand) {
        const { name } = node.key;
        handleReference(node, name, name);
        this.skip();
        return;
      }

      if (isReference(node, parent)) {
        const { name, keypath } = flatten(node);
        const handled = handleReference(node, name, keypath);
        if (handled) {
          this.skip();
        }
      }
    },
    leave(node) {
      if (node.scope) {
        scope = scope.parent;
      }
    }
  });

  magicString.prepend(`// ${path.relative('.', id).replace(/\\/g, '/')}\n`)

  return {
    code: magicString.toString(),
    map: magicString.generateMap({ hires: true })
  };
}
