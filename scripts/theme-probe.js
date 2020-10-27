/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as fs from 'fs';
import * as pathlib from 'path';
import * as url from 'url';

import * as webDevServer from '@web/dev-server';
import * as playwright from 'playwright';
import CleanCSS from 'clean-css';

const fromMap = {
  color: 'color',
  backgroundColor: 'background',
  borderLeftColor: 'border-left-color',
};

const rootDir = pathlib.resolve(
  pathlib.dirname(url.fileURLToPath(import.meta.url)),
  '..'
);

const minifier = new CleanCSS({level: {2: {all: true}}, format: 'beautify'});
const minifyCss = (cssText) => {
  const r = minifier.minify(cssText);
  if (r.errors.length !== 0) {
    throw new Error(`CleanCSS errors: ${r.errors.join(';')}`);
  }
  return r.styles;
};

const makeDefaultCss = (results) => {
  let css = fs.readFileSync(
    pathlib.join(
      rootDir,
      'node_modules',
      'codemirror',
      'lib',
      'codemirror.css'
    ),
    'utf8'
  );
  css = css.replace(/.cm-s-default/g, '');
  const fakeValues = {};
  let i = 0;
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  for (const {from, to, value, className} of results) {
    // Hack! Neither clean-css nor csso are able to remove redundant rules when
    // var() is used. But, they do assume that any [a-z]+ is a valid color name,
    // so we can just generate some random ones during minification, and then
    // substitute back after. Maybe related issue:
    // https://github.com/jakubpawlowicz/clean-css/issues/1121
    let fakeValue;
    do {
      fakeValue = Array.from(
        new Array(10),
        () => alphabet[Math.floor(Math.random() * alphabet.length)]
      ).join('');
    } while (fakeValue in fakeValues);
    fakeValues[fakeValue] = `var(${to}, ${value})`;
    css += `.${className} { ${fromMap[from]}: ${fakeValue}; }\n`;
  }
  css = minifyCss(css);
  for (const [fake, real] of Object.entries(fakeValues)) {
    css = css.replace(fake, real);
  }
  return css;
};

const makeThemeCss = (themeName, results) => {
  return `.playground-theme-${themeName} {
${results.map(({to, value}) => `  ${to}: ${value};`).join('\n')}
}`;
};

const makeCssModule = (css) => {
  return `import {css} from 'lit-element';
const style = css\`
${css}
\`;
export default style;
`;
};

const main = async () => {
  const serverPromise = webDevServer.startDevServer({
    config: {
      rootDir,
    },
  });

  const browser = await playwright.chromium.launch({
    headless: true,
    args: ['--auto-open-devtools-for-tabs'],
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const server = await serverPromise;

  const url = `http://localhost:${server.config.port}/scripts/theme-probe.html`;
  await page.goto(url);

  const writes = [];

  // Default style
  const defaultResults = await page.evaluate(() =>
    window.probe('/node_modules/codemirror/lib/codemirror.css', 'default')
  );
  const defaultCss = makeDefaultCss(defaultResults);
  writes.push(
    fs.promises.writeFile(
      pathlib.join(rootDir, 'src', '_codemirror', 'themes', 'default.css.ts'),
      makeCssModule(defaultCss),
      'utf8'
    )
  );

  // Themes
  const themeFilenames = fs.readdirSync(
    pathlib.resolve(rootDir, 'node_modules', 'codemirror', 'theme')
  );
  const themeNames = [];
  for (const filename of themeFilenames) {
    const themeName = filename.replace(/\.css$/, '');
    themeNames.push(themeName);
    const styleUrl = `/node_modules/codemirror/theme/${filename}`;
    const results = await page.evaluate(
      ([styleUrl, themeName]) => window.probe(styleUrl, themeName),
      [styleUrl, themeName]
    );
    const css = makeThemeCss(themeName, results);
    writes.push(
      fs.promises.writeFile(
        pathlib.join(rootDir, '_codemirror', 'themes', filename),
        css,
        'utf8'
      )
    );
    writes.push(
      fs.promises.writeFile(
        pathlib.join(rootDir, 'src', '_codemirror', 'themes', `${filename}.ts`),
        makeCssModule(css),
        'utf8'
      )
    );
  }

  // Manifest
  const manifestTs = `export const themeNames = [
${themeNames.map((themeName) => `  '${themeName}',`).join('\n')}
] as const;
`;
  writes.push(
    fs.promises.writeFile(
      pathlib.join(rootDir, 'src', '_codemirror', 'themes', 'manifest.ts'),
      manifestTs,
      'utf8'
    )
  );

  // All themes
  const allThemesTs = `
${themeNames
  .map(
    (themeName) =>
      `import t${themeName.replace(/-/g, '_')} from './${themeName}.css.js';`
  )
  .join('\n')}

  export const themeStyles = [
    ${themeNames
      .map((themeName) => `  t${themeName.replace(/-/g, '_')},`)
      .join('\n')}
    ] as const;`;
  writes.push(
    fs.promises.writeFile(
      pathlib.join(rootDir, 'src', '_codemirror', 'themes', 'all.ts'),
      allThemesTs,
      'utf8'
    )
  );

  await Promise.all([browser.close(), server.stop(), ...writes]);
};

main();
