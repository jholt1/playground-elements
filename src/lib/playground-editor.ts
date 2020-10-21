/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
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

import {
  LitElement,
  html,
  customElement,
  css,
  property,
  internalProperty,
  query,
  PropertyValues,
} from 'lit-element';
import {SampleFile} from '../shared/worker-api.js';
import {PlaygroundProject} from './playground-project';
import './playground-codemirror.js';
import {PlaygroundCodeMirror} from './playground-codemirror.js';

/**
 * A text editor associated with a <playground-project>.
 */
@customElement('playground-editor')
export class PlaygroundEditor extends LitElement {
  static styles = css`
    :host {
      display: block;
      /* Prevents scrollbars from changing container size and shifting layout
      slightly. */
      box-sizing: border-box;
      height: 350px;
    }

    slot {
      display: block;
    }

    playground-codemirror,
    slot {
      height: 100%;
    }

    playground-codemirror {
      box-sizing: border-box;
      border-radius: inherit;
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }

    slot {
      background-color: var(--playground-code-background-color, unset);
    }

    :host([no-file-picker]) playground-codemirror,
    slot {
      height: calc(100%);
    }
  `;

  /**
   * Whether to show the "Add File" button on the UI that allows
   * users to add a new blank file to the project.
   */
  @property({type: Boolean})
  enableAddFile = false;

  @query('playground-codemirror')
  private _editor!: PlaygroundCodeMirror;

  @property({attribute: false})
  files?: SampleFile[];

  /**
   * The CodeMirror theme to load.
   */
  @property()
  theme = 'default';

  /**
   * The name of the project file that is currently being displayed. Set when
   * changing tabs. Does not reflect to attribute.
   */
  @property()
  filename?: string;

  /**
   * If true, display a left-hand-side gutter with line numbers. Default false
   * (hidden).
   */
  @property({type: Boolean, attribute: 'line-numbers'})
  lineNumbers = false;

  @internalProperty()
  private _currentFileIndex?: number;

  private get _currentFile() {
    return this._currentFileIndex === undefined
      ? undefined
      : this.files?.[this._currentFileIndex];
  }

  /**
   * The project that this editor is associated with. Either the
   * `<playground-project>` node itself, or its `id` in the host scope.
   */
  @property()
  project: PlaygroundProject | string | undefined = undefined;

  private _project: PlaygroundProject | undefined = undefined;

  /*
   * The type of the file being edited, as represented by its usual file
   * extension.
   */
  @property()
  type: 'js' | 'ts' | 'html' | 'css' | undefined;

  async update(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('project')) {
      this._findProjectAndRegister();
    }
    if (changedProperties.has('files') || changedProperties.has('filename')) {
      this._currentFileIndex =
        this.files && this.filename
          ? this.files.map((f) => f.name).indexOf(this.filename)
          : 0;
    }
    super.update(changedProperties);
  }

  render() {
    return html`
      ${this._currentFile
        ? html`
            <playground-codemirror
              .value=${this._currentFile.content}
              .type=${this._currentFile
                ? mimeTypeToTypeEnum(this._currentFile.contentType)
                : undefined}
              .lineNumbers=${this.lineNumbers}
              .theme=${this.theme}
              @change=${this._onEdit}
            >
            </playground-codemirror>
          `
        : html`<slot></slot>`}
    `;
  }

  private _findProjectAndRegister() {
    const prevProject = this._project;
    if (this.project instanceof HTMLElement) {
      this._project = this.project;
    } else if (typeof this.project === 'string') {
      this._project =
        (((this.getRootNode() as unknown) as
          | Document
          | ShadowRoot).getElementById(
          this.project
        ) as PlaygroundProject | null) || undefined;
    } else {
      this._project = undefined;
    }
    if (prevProject !== this._project) {
      if (prevProject) {
        prevProject._unregisterEditor(this);
      }
      if (this._project) {
        this._project._registerEditor(this);
      }
    }
  }

  private _onEdit() {
    const value = this._editor.value;
    if (this._currentFile) {
      this._currentFile.content = value!;
      this._project?.saveDebounced();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'playground-editor': PlaygroundEditor;
  }
}

const mimeTypeToTypeEnum = (mimeType?: string) => {
  // TODO: infer type based on extension too
  if (mimeType === undefined) {
    return;
  }
  const encodingSepIndex = mimeType.indexOf(';');
  if (encodingSepIndex !== -1) {
    mimeType = mimeType.substring(0, encodingSepIndex);
  }
  switch (mimeType) {
    // TypeScript: this is the mime-type returned by servers
    // .ts files aren't usually served to browsers, so they don't yet
    // have their own mime-type.
    case 'video/mp2t':
      return 'ts';
    case 'text/javascript':
    case 'application/javascript':
      return 'js';
    case 'text/html':
      return 'html';
    case 'text/css':
      return 'css';
  }
  return undefined;
};
