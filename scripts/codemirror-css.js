import cssom from 'cssom';
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';

const customPropertyDefinitions = [
  {
    name: '--playground-code-background',
    matcher: /^\.cm-s-[^ \.]+\.CodeMirror$/,
    cmProperty: 'background',
  },
  {
    name: '--playground-code-gutter-background',
    matcher: /^(\.cm-s-[^ \.]+)?\.CodeMirror-gutters$/,
    cmProperty: 'background-color',
  },
  {
    name: '--playground-code-activeline-background',
    matcher: /^(\.cm-s-[^ \.]+)?\s*\.CodeMirror-activeline-background$/,
    cmProperty: 'background',
  },
  {
    name: '--playground-linenumber-color',
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
  ].map((name) => ({
    name: `--playground-code-${name}`,
    cmProperty: 'color',
    matcher: new RegExp(`^.cm-s-[^ \\.]*\\s*(span)?\\.cm-${name}$`),
  })),
];

function propertyForRule(rule) {
  if (!rule.style | !rule.selectorText) {
    return;
  }
  const selectorText = rule.selectorText.trim();
  for (const {name, cmProperty, matcher} of customPropertyDefinitions) {
    if (selectorText.match(matcher)) {
      const style = rule.style;
      if (style[cmProperty]) {
        return {name, prop: cmProperty};
      }
    }
  }
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

  const unhandled = new Set(customPropertyDefinitions.map((prop) => prop.name));
  const handled = new Set();
  for (const rule of rules.cssRules) {
    const match = propertyForRule(rule);
    if (match === undefined) {
      continue;
    }
    const style = rule.style;
    const current = style[match.prop];
    style[match.prop] = `var(${match.name}, ${current})`;
    unhandled.delete(match.name);
    handled.add(match.name);
    //console.log(rule.selectorText);
    //console.log('  ', style[match.prop]);
    //console.log();
  }
  if (unhandled.size > 0) {
    console.log('UNHANDLED CUSTOM PROPS:');
    for (const p of unhandled) {
      console.log(`  ${p}`);
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
    const match = propertyForRule(rule);
    if (match === undefined) {
      console.log('UNMATCHED', rule.cssText);
      continue;
    }
    const style = rule.style;
    const current = style[match.prop];
    const newRule = `${match.name}: ${current};`;
    newRules.push(newRule);
    //console.log(
    //  `${rule.selectorText} { ${match.prop}: ${style[match.prop]}; }`
    //);
    //console.log('  ', newRule);
    //console.log();
  }
  console.log('========================');
  return `.theme-${themeName} {
${newRules.sort().join('\n')}
}`;
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
  const themeCssFilenames = fs.readdirSync(path.join(cmDir, 'theme'));
  for (const cssFilename of themeCssFilenames) {
    const themeName = cssFilename.replace(/\.css$/, '');
    themeNames.push(themeName);
    const cmThemeCss = fs.readFileSync(
      path.join(cmDir, 'theme', cssFilename),
      'utf8'
    );
    const ourThemeCss = rewriteTheme(cssom.parse(cmThemeCss), themeName);
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
  const ourDefaultCss = rewriteDefault(cssom.parse(cmDefaultCss));
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
