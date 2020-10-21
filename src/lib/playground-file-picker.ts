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
import '@material/mwc-tab-bar';
import {TabBar} from '@material/mwc-tab-bar';
import '@material/mwc-tab';
import {SampleFile} from '../shared/worker-api.js';
import {nothing} from 'lit-html';
import '@material/mwc-icon-button';
import {PlaygroundProject} from './playground-project.js';

// Hack to workaround Safari crashing and reloading the entire browser tab
// whenever an <mwc-tab> is clicked to switch files, because of a bug relating
// to delegatesFocus and shadow roots.
//
// https://bugs.webkit.org/show_bug.cgi?id=215732
// https://github.com/material-components/material-components-web-components/issues/1720
import {Tab} from '@material/mwc-tab';
import {PlaygroundEditor} from './playground-editor.js';
((Tab.prototype as unknown) as {
  createRenderRoot: Tab['createRenderRoot'];
  attachShadow: Tab['attachShadow'];
}).createRenderRoot = function () {
  return this.attachShadow({mode: 'open', delegatesFocus: false});
};

/**
 * A file picker associated with a <playground-editor>.
 */
@customElement('playground-file-picker')
export class PlaygroundFilePicker extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: var(--playground-bar-height, 35px);
    }

    mwc-tab-bar {
      --mdc-tab-height: var(--playground-bar-height, 35px);
      box-sizing: border-box;
      /* The tab bar doesn't hold its height unless there are tabs inside it.
      Also setting height here prevents a resize flashes after the project file
      manifest loads. */
      height: var(--mdc-tab-height);
      color: blue;
      --mdc-typography-button-text-transform: none;
      --mdc-typography-button-font-weight: normal;
      --mdc-typography-button-font-size: 0.75rem;
      --mdc-typography-button-letter-spacing: normal;
      --mdc-icon-button-size: 36px;
      --mdc-icon-size: 18px;
      --mdc-theme-primary: var(--playground-highlight-color, #6200ee);
      --mdc-tab-text-label-color-default: var(
        --playground-file-picker-foreground-color,
        black
      );
      color: #444;
      border-bottom: var(--playground-border, solid 1px #ddd);
      background-color: var(--playground-file-picker-background-color, white);
      border-radius: inherit;
    }

    mwc-tab {
      flex: 0;
    }
  `;

  /**
   * Whether to show the "Add File" button on the UI that allows
   * users to add a new blank file to the project.
   */
  @property({type: Boolean})
  enableAddFile = false;

  @query('mwc-tab-bar')
  private _tabBar!: TabBar;

  @property({attribute: false})
  files?: SampleFile[];

  /**
   * The name of the project file that is currently being displayed. Set when
   * changing tabs. Does not reflect to attribute.
   */
  @property()
  filename?: string;

  @internalProperty()
  private _currentFileIndex?: number;

  public get _currentFile() {
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

  /**
   * The editor that this editor is associated with. Either the
   * `<playground-editor>` node itself, or its `id` in the host scope.
   */
  @property()
  editor: PlaygroundEditor | string | undefined = undefined;

  private _editor: PlaygroundEditor | undefined = undefined;

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
    if (changedProperties.has('editor')) {
      this._findEditor();
    }
    if (changedProperties.has('files') || changedProperties.has('filename')) {
      this._currentFileIndex =
        this.files && this.filename
          ? this.files.map((f) => f.name).indexOf(this.filename)
          : 0;
      // TODO(justinfagnani): whyyyy?
      if (this._tabBar) {
        await this._tabBar.updateComplete;
        this._tabBar.activeIndex = -1;
        this._tabBar.activeIndex = this._currentFileIndex;
      }
    }
    super.update(changedProperties);
  }

  render() {
    return html`
      <mwc-tab-bar
        part="file-picker"
        .activeIndex=${this._currentFileIndex ?? 0}
        @MDCTabBar:activated=${this._tabActivated}
      >
        ${this.files?.map((file) => {
          const label =
            file.label || file.name.substring(file.name.lastIndexOf('/') + 1);
          return html`<mwc-tab
            .isFadingIndicator=${true}
            label=${label}
          ></mwc-tab>`;
        })}
        ${this.enableAddFile
          ? html`<mwc-icon-button icon="add"></mwc-icon-button>`
          : nothing}
      </mwc-tab-bar>
    `;
  }

  private _tabActivated(e: CustomEvent<{index: number}>) {
    this._currentFileIndex = e.detail.index;
    this.filename = this.files?.[this._currentFileIndex].name;
    if (this._editor) {
      this._editor.filename = this.filename;
    }
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

  private _findEditor() {
    if (this.editor instanceof HTMLElement) {
      this._editor = this.editor;
    } else if (typeof this.editor === 'string') {
      this._editor =
        (((this.getRootNode() as unknown) as
          | Document
          | ShadowRoot).getElementById(
          this.editor
        ) as PlaygroundEditor | null) || undefined;
    } else {
      this._editor = undefined;
    }
    if (this._editor && this.filename) {
      this._editor.filename = this.filename;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'playground-file-picker': PlaygroundFilePicker;
  }
}
