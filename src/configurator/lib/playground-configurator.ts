/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {LitElement, customElement, html, css} from 'lit-element';

import '../../lib/playground-layout.js';
import '../../lib/playground-codemirror.js';
import {
  Knob,
  KnobId,
  KnobValueType,
  KnobValues,
  KnobsOfType,
  knobIds,
  knobSectionNames,
  knobs,
  knobsById,
  knobsBySection,
} from './knobs.js';

/**
 * A configurator for the playground-* elements.
 */
@customElement('playground-configurator')
export class PlaygroundConfigurator extends LitElement {
  static styles = css`
    :host {
      display: flex;
      font-family: Roboto, Arial, Helvetica, sans-serif;
    }

    #lhs {
      width: 260px;
      overflow-y: auto;
      border-right: 1px solid #ccc;
      box-shadow: -2px 0 6px 0px rgb(0 0 0 / 50%);
      z-index: 1;
      color: #424242;
      font-size: 13px;
    }

    #rhs {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: auto;
    }

    #container {
      display: flex;
      justify-content: center;
      align-items: center;
      flex: 1;
      /* To position the GitHub cat corner. */
      position: relative;
    }

    playground-layout {
      flex: 1;
      margin: 50px;
      max-width: 900px;
    }

    #code {
      display: flex;
      flex-wrap: wrap;
      border-top: 1px solid #ccc;
      padding: 10px;
      --playground-code-font-family: 'Roboto Mono', monospace;
      --playground-code-font-size: 12px;
      --playground-editor-background-color: #f7f7f7;
      background-color: #f7f7f7;
    }

    h3 {
      color: #949494;
      font-weight: 400;
      text-transform: uppercase;
    }

    #code h3 {
      margin: 0;
    }

    #lhs section {
      padding: 15px;
      border-bottom: 1px solid #ccc;
    }

    .sectionLabel {
      margin-top: 5px;
    }

    .knobs {
      display: grid;
      grid-template-columns: 70px 1fr;
      max-width: 400px;
      row-gap: 15px;
      column-gap: 10px;
      align-items: center;
    }

    input[type='range'] {
      width: 100px;
    }

    .knobs label {
      text-align: right;
      cursor: pointer;
    }

    #container {
      flex: 1;
    }

    .sliderAndValue {
      display: flex;
      align-items: center;
    }

    .sliderValue {
      margin-left: 5px;
    }
  `;

  private values = new KnobValues();

  connectedCallback() {
    super.connectedCallback();
    this.readUrlParams(new URL(document.location.href).searchParams);
  }

  private setValue<T extends KnobId>(id: T, value: KnobValueType<T>) {
    this.values.setValue(id, value);
    this.setUrlParams();
    this.requestUpdate();
  }

  private readUrlParams(params: URLSearchParams) {
    for (const id of knobIds) {
      let urlValue = params.get(id);
      if (urlValue === null) {
        continue;
      }
      const knob = knobsById[id];
      switch (knob.type) {
        case 'checkbox':
          this.setValue(knob.id, urlValue === 'y');
          break;
        case 'color':
          this.setValue(knob.id, '#' + urlValue);
          break;
        case 'slider':
          this.setValue(knob.id, Number(urlValue));
          break;
        case 'select':
          this.setValue(knob.id, urlValue as any);
          break;
        default:
          throwUnreachable(knob, `Unexpected knob type ${(knob as Knob).type}`);
      }
    }
  }

  private setUrlParams() {
    const params = new URLSearchParams();
    for (const knob of knobs) {
      let value = this.values.getValue(knob.id);
      if (value === knob.default) {
        continue;
      }
      switch (knob.type) {
        case 'checkbox':
          params.set(knob.id, (value as boolean) ? 'y' : 'n');
          break;
        case 'color':
          params.set(knob.id, (value as string).substring(1));
          break;
        case 'slider':
          params.set(knob.id, String(value as number));
          break;
        case 'select':
          params.set(knob.id, value as string);
          break;
        default:
          throwUnreachable(knob, `Unexpected knob type ${(knob as Knob).type}`);
      }
    }
    history.replaceState(null, '', '?' + params.toString());
  }

  render() {
    return html`
      <style>
        ${this.cssText}
      </style>

      <div id="lhs">${this.knobs}</div>

      <div id="rhs">
        <div
          id="container"
          style="background-color:${this.values.getValue('pageBackground')}"
        >
          <playground-layout
            theme=${this.values.getValue('theme')}
            .lineNumbers=${this.values.getValue('lineNumbers')}
            project-src="./project/project.json"
          >
          </playground-layout>

          ${githubCorner}
        </div>

        <div id="code">
          <div>
            <h3>CSS</h3>
            <playground-codemirror .value=${this.cssText} type="css" readonly>
            </playground-codemirror>
          </div>

          <div>
            <h3>HTML</h3>
            <playground-codemirror .value=${this.htmlText} type="html" readonly>
            </playground-codemirror>
          </div>
        </div>
      </div>
    `;
  }

  private get knobs() {
    return knobSectionNames.map(
      (section) =>
        html`<section>
          <h3 class="sectionLabel">${section}</h3>
          <div class="knobs">
            ${knobsBySection[section].map((knob) => this.knob(knob))}
          </div>
        </section>`
    );
  }

  private get htmlText() {
    return `
<playground-layout${this.htmlTextAttributes}>
</playground-layout>
`;
  }

  private get htmlTextAttributes() {
    const attributes = [];
    for (const id of knobIds) {
      const knob: Knob = knobsById[id];
      if (!knob.htmlAttribute) {
        continue;
      }
      const value = this.values.getValue(id);
      if (value === knob.default) {
        continue;
      }
      switch (knob.type) {
        case 'checkbox':
          if (value) {
            attributes.push(` ${knob.htmlAttribute}`);
          }
          break;
        default:
          attributes.push(` ${knob.htmlAttribute}="${value}"`);
          break;
      }
    }
    return attributes.join('');
  }

  private get cssText() {
    const props = [];
    for (const id of knobIds) {
      const knob: Knob = knobsById[id];
      if (!(knob as Knob).cssProperty) {
        continue;
      }
      const value = this.values.getValue(id);
      let line = `${knob.cssProperty}: ${
        knob.formatCss ? (knob as any).formatCss(value) : value
      };`;
      if (value === knob.default) {
        line = `/*${line}*/`;
      } else {
        line = `  ${line}`;
      }
      props.push(line);
    }
    return `
playground-layout {
${props.join('\n')}
}
    `;
  }

  private knob(knob: Knob) {
    const label = html`<label for=${knob.id}>${knob.label}</label>`;
    switch (knob.type) {
      case 'select':
        return [label, this.selectKnob(knob)];
      case 'slider':
        return [label, this.sliderKnob(knob)];
      case 'color':
        return [label, this.colorKnob(knob)];
      case 'checkbox':
        return [label, this.checkboxKnob(knob)];
    }
    return '';
  }

  private selectKnob(knob: KnobsOfType<'select'>) {
    const value = this.values.getValue(knob.id);
    return html`
      <select
        id=${knob.id}
        @input=${(event: Event & {target: HTMLSelectElement}) => {
          this.setValue(knob.id, event.target.value as any);
        }}
      >
        ${(knob.options as ReadonlyArray<string>).map(
          (option) =>
            html`<option value=${option} ?selected=${option === value}>
              ${option}
            </option>`
        )}
      </select>
    `;
  }

  private sliderKnob(knob: KnobsOfType<'slider'>) {
    const value = this.values.getValue(knob.id);
    return html`
      <span class="sliderAndValue">
        <input
          id=${knob.id}
          type="range"
          min=${knob.min}
          max=${knob.max}
          value=${value}
          @input=${(event: Event & {target: HTMLInputElement}) => {
            this.setValue(knob.id, Number(event.target.value));
          }}
        />
        <span class="sliderValue"
          >${knob.formatCss ? knob.formatCss(value) : value}</span
        >
      </span>
    `;
  }

  private colorKnob(knob: KnobsOfType<'color'>) {
    let value = this.values.getValue(knob.id);
    return html`
      ${'unsetLabel' in knob
        ? html`
            <div style="margin-bottom: 5px">
              <input
                id=${knob.id + '-unset'}
                type="checkbox"
                ?checked=${value === ''}
                @input=${(event: Event & {target: HTMLInputElement}) => {
                  value = event.target.checked ? '' : '#ffffff';
                  this.setValue(knob.id, value);
                }}
              />
              <label for=${knob.id + '-unset'}> ${knob.unsetLabel}</label>
            </div>
            <span></span>
          `
        : ''}
      <input
        id=${knob.id}
        type="color"
        .value=${value === '' ? '#ffffff' : String(value)}
        ?disabled=${value === ''}
        @input=${(event: Event & {target: HTMLInputElement}) => {
          this.setValue(knob.id, event.target.value);
        }}
      />
    `;
  }

  private checkboxKnob(knob: KnobsOfType<'checkbox'>) {
    let value = this.values.getValue(knob.id);
    return html`
      <input
        id=${knob.id}
        type="checkbox"
        ?checked=${value}
        @change=${(event: Event & {target: HTMLInputElement}) => {
          this.setValue(knob.id, event.target.checked);
        }}
      />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'playground-configurator': PlaygroundConfigurator;
  }
}

function throwUnreachable(_x: never, msg: string) {
  throw new Error(msg);
}

/**
 * https://tholman.com/github-corners/
 */
const githubCorner = html`<a
    href="https://github.com/PolymerLabs/playground-elements"
    class="github-corner"
    aria-label="View source on GitHub"
    ><svg
      width="80"
      height="80"
      viewBox="0 0 250 250"
      style="fill:#00000033; color:#fff; position: absolute; top: 0; border: 0; right: 0;"
      aria-hidden="true"
    >
      <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
      <path
        d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
        fill="currentColor"
        style="transform-origin: 130px 106px;"
        class="octo-arm"
      ></path>
      <path
        d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
        fill="currentColor"
        class="octo-body"
      ></path></svg></a
  ><style>
    .github-corner:hover .octo-arm {
      animation: octocat-wave 560ms ease-in-out;
    }
    @keyframes octocat-wave {
      0%,
      100% {
        transform: rotate(0);
      }
      20%,
      60% {
        transform: rotate(-25deg);
      }
      40%,
      80% {
        transform: rotate(10deg);
      }
    }
    @media (max-width: 500px) {
      .github-corner:hover .octo-arm {
        animation: none;
      }
      .github-corner .octo-arm {
        animation: octocat-wave 560ms ease-in-out;
      }
    }
  </style>`;
