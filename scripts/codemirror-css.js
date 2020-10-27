import cssom from 'cssom';
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';
import CleanCSS from 'clean-css';

const customPropertyDefinitions = [
  {
    name: '--playground-code-selected',
    matcher: /^(\.cm-s-[^ \.]+)?\s*(div)?\.CodeMirror-selected$/,
    cmProperty: ['background', 'background-color'],
  },
  {
    name: '--playground-code-cursor',
    matcher: /^(\.cm-s-[^ \.]+)?\s*\.CodeMirror-cursor$/,
    cmProperty: ['border-left'],
  },
  {
    name: '--playground-code-activeline-background',
    matcher: /^(\.cm-s-[^ \.]+)?\s*\.CodeMirror-activeline-background$/,
    cmProperty: ['background', 'background-color'],
  },
  {
    name: '--playground-code-background',
    matcher: /^(\.cm-s-[^ \.]+)?\s*\.CodeMirror$/,
    cmProperty: ['background', 'background-color'],
    defaultSelector: '.CodeMirror',
  },
  {
    name: '--playground-code-color',
    matcher: /^(\.cm-s-[^ \.]+)?\.CodeMirror$/,
    cmProperty: 'color',
  },
  {
    name: '--playground-code-gutter-background',
    matcher: /^(\.cm-s-[^ \.]+)?\.CodeMirror-gutters$/,
    cmProperty: ['background', 'background-color'],
  },
  {
    name: '--playground-code-linenumber-color',
    matcher: /^(\.cm-s-[^ \.]+)?\s*\.CodeMirror-linenumber$/,
    cmProperty: 'color',
  },
  {
    name: '--playground-code-color',
    matcher: /^(\.cm-s-[^ \.]+)?\.CodeMirror$/,
    cmProperty: 'color',
  },
  ...[
    'variable',
    'variable-2',
    'variable-3',
    'comment',
    'string',
    'string-2',
    'keyword',
    'type',
    'atom',
    'builtin',
    'attribute',
    'def',
    'error',
    'bracket',
    'tag',
    'header',
    'link',
    'number',
    'property',
    'meta',
    'operator',
    'qualifier',
    'hr',
    'invalidchar',
  ].map((name) => ({
    name: `--playground-code-${name}`,
    cmProperty: 'color',
    matcher: new RegExp(`^(.cm-s-[^ \\.]*)?\\s*(span)?\\.cm-${name}$`),
    defaultSelector: `.cm-${name}`,
  })),
];

function propertyForRule(rule) {
  if (!rule.style | !rule.selectorText) {
    return [];
  }
  const matching = [];
  const selectorText = rule.selectorText.trim();
  for (const def of customPropertyDefinitions) {
    if (selectorText.match(def.matcher)) {
      let props = def.cmProperty;
      if (typeof props === 'string') {
        props = [props];
      }
      for (const p of props) {
        if (rule.style[p]) {
          matching.push([def, p]);
          break;
        }
      }
    }
  }
  return matching;
}

/**
 * Given:
 *  foo, bar { color: blue; }
 *
 * Replace with:
 *   foo { color: blue; }
 *   bar { color: blue; }
 */
const denormalizeRules = (rules) => {
  for (let r = 0; r < rules.cssRules.length; r++) {
    const rule = rules.cssRules[r];
    if (!rule.selectorText) {
      continue;
    }
    const selectors = rule.selectorText.split(',');
    if (selectors.length > 1) {
      rule.selectorText = selectors[0];
      const ruleBody = rule.cssText.replace(/.*{/, '{');
      for (let s = 1; s < selectors.length; s++) {
        rules.insertRule(`${selectors[s]} ${ruleBody}`, r + s);
        r++;
      }
    }
  }
};

const rewriteDefault = (rules) => {
  console.log();
  console.log('========================');
  console.log('default');
  console.log('========================');

  // TODO(aomarks) We only need to do this for rules with some matching
  // property.
  denormalizeRules(rules);

  const unhandled = new Set(customPropertyDefinitions);
  const handled = new Set();
  for (const rule of rules.cssRules) {
    if (!rule.selectorText) {
      continue;
    }
    // We don't need this prefix.
    rule.selectorText = rule.selectorText.replace('.cm-s-default', '');

    const defs = propertyForRule(rule);
    const style = rule.style;
    for (const [def, p] of defs) {
      const current = style[p];
      style[p] = `var(${def.name}, ${current})`;
      unhandled.delete(def);
      handled.add(def);
      //console.log(rule.selectorText);
      //console.log('  ', style[match.cmProperty]);
      //console.log();
    }
  }
  if (unhandled.size > 0) {
    console.log('UNHANDLED CUSTOM PROPS:');
    for (const def of unhandled) {
      console.log(`  ${def.name}`);
      if (def.defaultSelector) {
        const newRule = `${def.defaultSelector} {${def.cmProperty}: var(${def.name});}`;
        console.log({newRule});
        rules.insertRule(newRule);
      }
    }
  }
  console.log('========================');
  return rules.toString();
};

const rewriteTheme = (rules, themeName) => {
  console.log();
  console.log('========================');
  console.log(themeName);
  console.log('========================');
  denormalizeRules(rules);
  const newRules = [];
  for (const rule of rules.cssRules) {
    const defs = propertyForRule(rule);
    if (defs.length === 0) {
      console.log('UNMATCHED', rule.cssText);
      continue;
    }
    const style = rule.style;
    for (const [def, p] of defs) {
      const current = style[p];
      const newRule = `${def.name}: ${current};`;
      newRules.push(newRule);
      //console.log(
      //  `${rule.selectorText} { ${match.cmProperty}: ${style[match.cmProperty]}; }`
      //);
      //console.log('  ', newRule);
      //console.log();
    }
  }
  console.log('========================');
  return `.playground-theme-${themeName} {
${newRules.sort().join('\n')}
}`;
};

const minifier = new CleanCSS({level: 2, format: 'beautify'});
const minifyCss = (cssText) => {
  const r = minifier.minify(cssText);
  if (r.errors.length !== 0) {
    throw new Error(`CleanCSS errors: ${r.errors.join(';')}`);
  }
  return r.styles;
};

const cssModule = (cssText) => `import {css} from 'lit-element';
const style = css\`${cssText}\`;
export default style;
`;

function main() {
  console.log('\n\n\n\n');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(__dirname, '..');
  const cmDir = path.join(rootDir, 'node_modules', 'codemirror');
  const ourThemeCssDir = path.join(rootDir, '_codemirror', 'themes');
  const ourThemeTsDir = path.join(rootDir, 'src', '_codemirror', 'themes');

  const mkdirs = [
    ['_codemirror'],
    ['_codemirror', 'themes'],
    ['src', '_codemirror'],
    ['src', '_codemirror', 'themes'],
  ];
  for (const dir of mkdirs) {
    try {
      fs.mkdirSync(path.join(__dirname, '..', ...dir));
    } catch (e) {
      if (e.code !== 'EEXIST') {
        throw e;
      }
    }
  }

  // Theme styles
  const themeNames = [];
  const themeCssFilenames = fs
    .readdirSync(path.join(cmDir, 'theme'))
    .filter((name) => name === 'liquibyte.css');
  for (const cssFilename of themeCssFilenames) {
    const themeName = cssFilename.replace(/\.css$/, '');
    themeNames.push(themeName);
    const cmThemeCss = fs.readFileSync(
      path.join(cmDir, 'theme', cssFilename),
      'utf8'
    );
    const ourThemeCss = minifyCss(
      rewriteTheme(cssom.parse(cmThemeCss), themeName)
    );
    // .css
    fs.writeFileSync(
      path.join(ourThemeCssDir, cssFilename),
      ourThemeCss,
      'utf8'
    );
    // .css.ts
    fs.writeFileSync(
      path.join(ourThemeTsDir, cssFilename + '.ts'),
      cssModule(ourThemeCss),
      'utf8'
    );
  }

  // Default style
  const cmDefaultCss = fs.readFileSync(
    path.join(cmDir, 'lib', 'codemirror.css'),
    'utf8'
  );
  const ourDefaultCss = minifyCss(rewriteDefault(cssom.parse(cmDefaultCss)));
  // .css
  fs.writeFileSync(
    path.join(ourThemeCssDir, 'default.css'),
    ourDefaultCss,
    'utf8'
  );
  // .css.ts
  fs.writeFileSync(
    path.join(ourThemeTsDir, 'default.css.ts'),
    cssModule(ourDefaultCss),
    'utf8'
  );

  // Manifest
  themeNames.sort();
  const manifestTs = `export const themeNames = [
${themeNames.map((themeName) => `  '${themeName}',`).join('\n')}
] as const;
`;
  fs.writeFileSync(path.join(ourThemeTsDir, 'manifest.ts'), manifestTs, 'utf8');

  // All themes
  const allThemesTs = `
${themeNames
  .map(
    (themeFile) =>
      `import t${themeFile.replace(/-/g, '_')} from './${themeFile}.css.js';`
  )
  .join('\n')}

export const themeStyles = [
${themeNames
  .map((themeFile) => `  t${themeFile.replace(/-/g, '_')},`)
  .join('\n')}
] as const;`;
  fs.writeFileSync(path.join(ourThemeTsDir, 'all.ts'), allThemesTs, 'utf8');
}

main();
