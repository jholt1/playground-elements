import cssom from 'cssom';
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const interestingProperties = ['color', 'background', 'background-color'];

const findInterestingCategory = (selectorText) => {
  const appliesTo = [];
  const selectors = selectorText.split(/\s*,\s*/);
  for (let selector of selectors) {
    // All theme rules begin with ".cm-s-<themename>". Ignore.
    selector = selector.replace(/^\s*\.cm-s-[a-z0-9_-]+\s*/, '');
    if (selector === '.CodeMirror') {
      appliesTo.push('');
      continue;
    }

    // Many theme rules match span, not meaningful. Ignore.
    selector = selector.replace(/^span\./, '.');

    // E.g. .cm-comment, .cm-atom, .cm-keyword
    const match1 = selector.match(/^\.cm-([a-z0-9\-]+)$/);
    if (match1 !== null) {
      appliesTo.push('-' + match1[1]);
      continue;
    }

    // E.g. .CodeMirror-gutters, .CodeMirror-cursor
    const match2 = selector.match(/^\.CodeMirror-([a-z0-9\-]+)$/);
    if (match2 !== null) {
      appliesTo.push('-' + match2[1]);
      continue;
    }

    // ???
    console.log({selector});
  }
  return appliesTo;
};

const rewriteDefault = (rules) => {
  for (const rule of rules.cssRules) {
    if (!rule.style | !rule.selectorText) {
      continue;
    }
    const cats = findInterestingCategory(rule.selectorText || '');
    if (cats.length === 0) {
      continue;
    }
    rule.selectorText = rule.selectorText.replace('.cm-s-default', '');
    const style = rule.style;
    for (let prop of interestingProperties) {
      if (!style[prop]) {
        continue;
      }
      const realProp = prop;
      const value = style[prop];
      if (prop === 'color') {
        prop = '';
      } else if (prop === 'background-color') {
        prop = '-background';
      } else {
        prop = '-' + prop;
      }
      style[realProp] = `var(--playground-code${cats[0]}${prop}, ${value})`;
    }
  }
};

const rewriteTheme = (themeName, rules) => {
  const result = [];
  for (const rule of rules.cssRules) {
    if (!rule.style || !rule.selectorText) {
      continue;
    }
    const cats = findInterestingCategory(rule.selectorText);
    if (cats.length == 0) {
      continue;
    }
    const style = rule.style;
    for (let prop of interestingProperties) {
      if (!style[prop]) {
        continue;
      }
      const value = style[prop];
      if (prop === 'color') {
        prop = '';
      } else if (prop === 'background-color') {
        prop = '-background';
      } else {
        prop = '-' + prop;
      }
      for (const cat of cats) {
        result.push(`--playground-code${cat}${prop}: ${value};`);
      }
    }
  }
  return `.playground-theme-${themeName} {
  ${result.join('\n  ')}
}`;
};

try {
  fs.mkdirSync(path.join(__dirname, '..', '_codemirror'));
} catch {}
try {
  fs.mkdirSync(path.join(__dirname, '..', '_codemirror', 'themes'));
} catch {}

try {
  fs.mkdirSync(path.join(__dirname, '..', 'src', '_codemirror'));
} catch {}
try {
  fs.mkdirSync(path.join(__dirname, '..', 'src', '_codemirror', 'themes'));
} catch {}

const codeMirrorDefaultCssPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'codemirror',
  'lib',
  'codemirror.css'
);
const codeMirrorDefaultCss = fs.readFileSync(codeMirrorDefaultCssPath, 'utf8');
const rules = cssom.parse(codeMirrorDefaultCss);
rules.insertRule('.CodeMirror {background: inherit;}');
rewriteDefault(rules);
const outPath = path.join(
  __dirname,
  '..',
  '_codemirror',
  'themes',
  'default.css'
);
fs.writeFileSync(outPath, rules.toString(), 'utf8');

const tsOutPath = path.join(
  __dirname,
  '..',
  'src',
  '_codemirror',
  'themes',
  'default.css.ts'
);
const defaultTs = `import {css} from 'lit-element';
const style = css\`${rules.toString()}\`;
export default style;
`;
fs.writeFileSync(tsOutPath, defaultTs, 'utf8');

const codeMirrorThemesDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'codemirror',
  'theme'
);

const codeMirrorThemeFiles = fs.readdirSync(codeMirrorThemesDir);
for (const themeFile of codeMirrorThemeFiles) {
  const css = fs.readFileSync(
    path.join(codeMirrorThemesDir, themeFile),
    'utf8'
  );
  const rules = cssom.parse(css);
  const result = rewriteTheme(themeFile.replace(/\.css$/, ''), rules);
  const outPath = path.join(
    __dirname,
    '..',
    '_codemirror',
    'themes',
    themeFile
  );
  fs.writeFileSync(outPath, result, 'utf8');

  const tsOutPath = path.join(
    __dirname,
    '..',
    'src',
    '_codemirror',
    'themes',
    themeFile + '.ts'
  );
  const ts = `import {css} from 'lit-element';
const style = css\`${result}\`;
export default style;
`;
  fs.writeFileSync(tsOutPath, ts, 'utf8');
}

const manifestPath = path.join(
  __dirname,
  '..',
  'src',
  '_codemirror',
  'themes',
  'manifest.ts'
);
const manifestTs = `export const themeNames = [
${codeMirrorThemeFiles
  .sort((a, b) => a.localeCompare(b))
  .map((themeFile) => `  '${themeFile.replace(/\.css$/, '')}',`)
  .join('\n')}
] as const;
`;
fs.writeFileSync(manifestPath, manifestTs, 'utf8');

const allThemesPath = path.join(
  __dirname,
  '..',
  'src',
  '_codemirror',
  'themes',
  'all.ts'
);
const allThemesTs = `
${codeMirrorThemeFiles
  .sort((a, b) => a.localeCompare(b))
  .map(
    (themeFile) =>
      `import t${themeFile
        .replace(/\.css$/, '')
        .replace(/-/g, '_')} from './${themeFile}.js';`
  )
  .join('\n')}

export const themeStyles = [
${codeMirrorThemeFiles
  .sort((a, b) => a.localeCompare(b))
  .map(
    (themeFile) => `  t${themeFile.replace(/\.css$/, '').replace(/-/g, '_')},`
  )
  .join('\n')}
] as const;
`;
fs.writeFileSync(allThemesPath, allThemesTs, 'utf8');
