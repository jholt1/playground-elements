!function(){"use strict";const e=Symbol("Comlink.proxy"),t=Symbol("Comlink.endpoint"),r=Symbol("Comlink.releaseProxy"),n=Symbol("Comlink.thrown"),i=e=>"object"==typeof e&&null!==e||"function"==typeof e,a=new Map([["proxy",{canHandle:t=>i(t)&&t[e],serialize(e){const{port1:t,port2:r}=new MessageChannel;return o(e,t),[r,[r]]},deserialize:e=>(e.start(),u(e,[],undefined))}],["throw",{canHandle:e=>i(e)&&n in e,serialize({value:e}){let t;return t=e instanceof Error?{isError:!0,value:{message:e.message,name:e.name,stack:e.stack}}:{isError:!1,value:e},[t,[]]},deserialize(e){if(e.isError)throw Object.assign(Error(e.value.message),e.value);throw e.value}}]]);function o(t,r=self){r.addEventListener("message",(function i(a){if(!a||!a.data)return;const{id:c,type:u,path:l}=Object.assign({path:[]},a.data),f=(a.data.argumentList||[]).map(p);let g;try{const r=l.slice(0,-1).reduce(((e,t)=>e[t]),t),n=l.reduce(((e,t)=>e[t]),t);switch(u){case 0:g=n;break;case 1:r[l.slice(-1)[0]]=p(a.data.value),g=!0;break;case 2:g=n.apply(r,f);break;case 3:g=function(t){return Object.assign(t,{[e]:!0})}(new n(...f));break;case 4:{const{port1:e,port2:r}=new MessageChannel;o(t,r),g=function(e,t){return _.set(e,t),e}(e,[e])}break;case 5:g=void 0}}catch(e){g={value:e,[n]:0}}Promise.resolve(g).catch((e=>({value:e,[n]:0}))).then((e=>{const[t,n]=d(e);r.postMessage(Object.assign(Object.assign({},t),{id:c}),n),5===u&&(r.removeEventListener("message",i),s(r))}))})),r.start&&r.start()}function s(e){(function(e){return"MessagePort"===e.constructor.name})(e)&&e.close()}function c(e){if(e)throw Error("Proxy has been released and is not useable")}function u(e,n=[],i=function(){}){let a=!1;const o=new Proxy(i,{get(t,i){if(c(a),i===r)return()=>f(e,{type:5,path:n.map((e=>e.toString()))}).then((()=>{s(e),a=!0}));if("then"===i){if(0===n.length)return{then:()=>o};const t=f(e,{type:0,path:n.map((e=>e.toString()))}).then(p);return t.then.bind(t)}return u(e,[...n,i])},set(t,r,i){c(a);const[o,s]=d(i);return f(e,{type:1,path:[...n,r].map((e=>e.toString())),value:o},s).then(p)},apply(r,i,o){c(a);const s=n[n.length-1];if(s===t)return f(e,{type:4}).then(p);if("bind"===s)return u(e,n.slice(0,-1));const[_,d]=l(o);return f(e,{type:2,path:n.map((e=>e.toString())),argumentList:_},d).then(p)},construct(t,r){c(a);const[i,o]=l(r);return f(e,{type:3,path:n.map((e=>e.toString())),argumentList:i},o).then(p)}});return o}function l(e){const t=e.map(d);return[t.map((e=>e[0])),(r=t.map((e=>e[1])),Array.prototype.concat.apply([],r))];var r}const _=new WeakMap;function d(e){for(const[t,r]of a)if(r.canHandle(e)){const[n,i]=r.serialize(e);return[{type:3,name:t,value:n},i]}return[{type:0,value:e},_.get(e)||[]]}function p(e){switch(e.type){case 3:return a.get(e.name).deserialize(e.value);case 0:return e.value}}function f(e,t,r){return new Promise((n=>{const i=[,,,,].fill(0).map((()=>Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16))).join("-");e.addEventListener("message",(function t(r){r.data&&r.data.id&&r.data.id===i&&(e.removeEventListener("message",t),n(r.data))})),e.start&&e.start(),e.postMessage(Object.assign({id:i},t),r)}))}var g="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function m(e){throw Error('Could not dynamically require "'+e+'". Please configure the dynamicRequireTargets option of @rollup/plugin-commonjs appropriately for this require call to behave properly.')}
/*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
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
     */const h={target:v.ScriptTarget.ES2017,module:v.ModuleKind.ESNext,experimentalDecorators:!0,skipDefaultLibCheck:!0,skipLibCheck:!0,moduleResolution:v.ModuleResolutionKind.NodeJs},b={after:[e=>t=>v.visitNode(t,(e=>{const t=r=>{if(v.isImportDeclaration(r)){const e=r.moduleSpecifier.text,{type:t,url:n}=T(e,self.origin);if("bare"===t){const e=v.getMutableClone(r);return e.moduleSpecifier=v.createStringLiteral(n+"?module"),e}}return v.visitEachChild(r,t,e)};return t})(e))]};o({async compileProject(e){const t=await x(e),r=new C(t,self.origin,h),n=v.createLanguageService(r,v.createDocumentRegistry()).getProgram(),i=new Map;for(const t of e)if(t.name.endsWith(".ts")){const e=new URL(t.name,self.origin).href,r=n.getSourceFile(e);n.emit(r,((e,t)=>{i.set(e,t)}),void 0,void 0,b)}return i}});const x=e=>new Promise((async(t,r)=>{const n=new Map;for(const t of e){const e=new URL(t.name,self.origin).href;if(e.endsWith(".ts")){const r=S(e,"js");n.set(r,{status:"redirected",redirectedUrl:e}),n.set(e,{status:"resolved",originalUrl:r,content:t.content})}else n.set(e,{status:"resolved",content:t.content})}let i=0;for(const r of e)if(r.name.endsWith(".ts")){const e=new URL(r.name,self.origin),a=v.preProcessFile(r.content,void 0,!0);for(const r of a.importedFiles){const a=r.fileName,{type:o,url:s}=T(a,e);n.has(s)||(i++,n.set(s,{status:"pending"}),(async()=>{await D(s,o,n),i--,0===i&&t(n)})())}}0===i&&t(n)})),D=async(e,t,r)=>{const n=await fetch(e);if("bare"===t){const t=new URL(n.url);if(t.pathname.endsWith(".js")){const i=new URL(t.href);i.pathname=S(t.pathname,"d.ts");const a=await fetch(t.href);a.ok?(r.set(e,{status:"redirected",redirectedUrl:i.href}),r.set(i.href,{status:"resolved",content:await a.text()})):r.set(e,{status:"resolved",content:await n.text()})}else r.set(e,{status:"resolved",content:await n.text()})}else r.set(e,{status:"resolved",content:await n.text()})},S=(e,t)=>{const r=e.lastIndexOf(".");return e.slice(0,r+1)+t},T=(e,t)=>{try{return{type:"url",url:new URL(e).href}}catch(r){return null!==e.match(/^(\.){0,2}\//)?{type:"relative",url:new URL(e,t).href}:{type:"bare",url:"https://unpkg.com/"+e}}};class C{constructor(e,t,r){this.packageRoot=t,this.compilerOptions=r,this.files=e}getCompilationSettings(){return this.compilerOptions}getScriptFileNames(){return Array.from(this.files.keys())}getScriptVersion(e){return"-1"}fileExists(e){return this.files.has(e)}readFile(e){const t=this.files.get(e);if(void 0!==t&&"resolved"===t.status)return t.content}getScriptSnapshot(e){if(this.fileExists(e))return v.ScriptSnapshot.fromString(this.readFile(e))}getCurrentDirectory(){return this.packageRoot}getDefaultLibFileName(e){return"__lib.d.ts"}}}();