/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,t=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),a=new WeakMap;let s=class{constructor(e,t,a){if(this._$cssResult$=!0,a!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const i=this.t;if(t&&void 0===e){const t=void 0!==i&&1===i.length;t&&(e=a.get(i)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&a.set(i,e))}return e}toString(){return this.cssText}};const n=(e,...t)=>{const a=1===e.length?e[0]:t.reduce((t,i,a)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[a+1],e[0]);return new s(a,e,i)},r=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new s("string"==typeof e?e:e+"",void 0,i))(t)})(e):e,{is:o,defineProperty:l,getOwnPropertyDescriptor:h,getOwnPropertyNames:c,getOwnPropertySymbols:d,getPrototypeOf:u}=Object,_=globalThis,g=_.trustedTypes,p=g?g.emptyScript:"",m=_.reactiveElementPolyfillSupport,f=(e,t)=>e,v={toAttribute(e,t){switch(t){case Boolean:e=e?p:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},y=(e,t)=>!o(e,t),b={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:y};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),_.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=b){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),a=this.getPropertyDescriptor(e,i,t);void 0!==a&&l(this.prototype,e,a)}}static getPropertyDescriptor(e,t,i){const{get:a,set:s}=h(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:a,set(t){const n=a?.call(this);s?.call(this,t),this.requestUpdate(e,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??b}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const e=u(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const e=this.properties,t=[...c(e),...d(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(r(e))}else void 0!==e&&t.push(r(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((i,a)=>{if(t)i.adoptedStyleSheets=a.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const t of a){const a=document.createElement("style"),s=e.litNonce;void 0!==s&&a.setAttribute("nonce",s),a.textContent=t.cssText,i.appendChild(a)}})(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),a=this.constructor._$Eu(e,i);if(void 0!==a&&!0===i.reflect){const s=(void 0!==i.converter?.toAttribute?i.converter:v).toAttribute(t,i.type);this._$Em=e,null==s?this.removeAttribute(a):this.setAttribute(a,s),this._$Em=null}}_$AK(e,t){const i=this.constructor,a=i._$Eh.get(e);if(void 0!==a&&this._$Em!==a){const e=i.getPropertyOptions(a),s="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:v;this._$Em=a;const n=s.fromAttribute(t,e.type);this[a]=n??this._$Ej?.get(a)??n,this._$Em=null}}requestUpdate(e,t,i,a=!1,s){if(void 0!==e){const n=this.constructor;if(!1===a&&(s=this[e]),i??=n.getPropertyOptions(e),!((i.hasChanged??y)(s,t)||i.useDefault&&i.reflect&&s===this._$Ej?.get(e)&&!this.hasAttribute(n._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:a,wrapped:s},n){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,n??t??this[e]),!0!==s||void 0!==n)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===a&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,a=this[t];!0!==e||this._$AL.has(t)||void 0===a||this.C(t,void 0,i,a)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[f("elementProperties")]=new Map,w[f("finalized")]=new Map,m?.({ReactiveElement:w}),(_.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $=globalThis,k=e=>e,x=$.trustedTypes,S=x?x.createPolicy("lit-html",{createHTML:e=>e}):void 0,A="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,E="?"+C,D=`<${E}>`,M=document,P=()=>M.createComment(""),N=e=>null===e||"object"!=typeof e&&"function"!=typeof e,T=Array.isArray,R="[ \t\n\f\r]",O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,j=/-->/g,z=/>/g,U=RegExp(`>|${R}(?:([^\\s"'>=/]+)(${R}*=${R}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),I=/'/g,H=/"/g,q=/^(?:script|style|textarea|title)$/i,G=e=>(t,...i)=>({_$litType$:e,strings:t,values:i}),B=G(1),L=G(2),W=Symbol.for("lit-noChange"),F=Symbol.for("lit-nothing"),K=new WeakMap,V=M.createTreeWalker(M,129);function Z(e,t){if(!T(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(t):t}const J=(e,t)=>{const i=e.length-1,a=[];let s,n=2===t?"<svg>":3===t?"<math>":"",r=O;for(let t=0;t<i;t++){const i=e[t];let o,l,h=-1,c=0;for(;c<i.length&&(r.lastIndex=c,l=r.exec(i),null!==l);)c=r.lastIndex,r===O?"!--"===l[1]?r=j:void 0!==l[1]?r=z:void 0!==l[2]?(q.test(l[2])&&(s=RegExp("</"+l[2],"g")),r=U):void 0!==l[3]&&(r=U):r===U?">"===l[0]?(r=s??O,h=-1):void 0===l[1]?h=-2:(h=r.lastIndex-l[2].length,o=l[1],r=void 0===l[3]?U:'"'===l[3]?H:I):r===H||r===I?r=U:r===j||r===z?r=O:(r=U,s=void 0);const d=r===U&&e[t+1].startsWith("/>")?" ":"";n+=r===O?i+D:h>=0?(a.push(o),i.slice(0,h)+A+i.slice(h)+C+d):i+C+(-2===h?t:d)}return[Z(e,n+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),a]};class Q{constructor({strings:e,_$litType$:t},i){let a;this.parts=[];let s=0,n=0;const r=e.length-1,o=this.parts,[l,h]=J(e,t);if(this.el=Q.createElement(l,i),V.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(a=V.nextNode())&&o.length<r;){if(1===a.nodeType){if(a.hasAttributes())for(const e of a.getAttributeNames())if(e.endsWith(A)){const t=h[n++],i=a.getAttribute(e).split(C),r=/([.?@])?(.*)/.exec(t);o.push({type:1,index:s,name:r[2],strings:i,ctor:"."===r[1]?ie:"?"===r[1]?ae:"@"===r[1]?se:te}),a.removeAttribute(e)}else e.startsWith(C)&&(o.push({type:6,index:s}),a.removeAttribute(e));if(q.test(a.tagName)){const e=a.textContent.split(C),t=e.length-1;if(t>0){a.textContent=x?x.emptyScript:"";for(let i=0;i<t;i++)a.append(e[i],P()),V.nextNode(),o.push({type:2,index:++s});a.append(e[t],P())}}}else if(8===a.nodeType)if(a.data===E)o.push({type:2,index:s});else{let e=-1;for(;-1!==(e=a.data.indexOf(C,e+1));)o.push({type:7,index:s}),e+=C.length-1}s++}}static createElement(e,t){const i=M.createElement("template");return i.innerHTML=e,i}}function X(e,t,i=e,a){if(t===W)return t;let s=void 0!==a?i._$Co?.[a]:i._$Cl;const n=N(t)?void 0:t._$litDirective$;return s?.constructor!==n&&(s?._$AO?.(!1),void 0===n?s=void 0:(s=new n(e),s._$AT(e,i,a)),void 0!==a?(i._$Co??=[])[a]=s:i._$Cl=s),void 0!==s&&(t=X(e,s._$AS(e,t.values),s,a)),t}class Y{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,a=(e?.creationScope??M).importNode(t,!0);V.currentNode=a;let s=V.nextNode(),n=0,r=0,o=i[0];for(;void 0!==o;){if(n===o.index){let t;2===o.type?t=new ee(s,s.nextSibling,this,e):1===o.type?t=new o.ctor(s,o.name,o.strings,this,e):6===o.type&&(t=new ne(s,this,e)),this._$AV.push(t),o=i[++r]}n!==o?.index&&(s=V.nextNode(),n++)}return V.currentNode=M,a}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class ee{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,a){this.type=2,this._$AH=F,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=a,this._$Cv=a?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=X(this,e,t),N(e)?e===F||null==e||""===e?(this._$AH!==F&&this._$AR(),this._$AH=F):e!==this._$AH&&e!==W&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>T(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==F&&N(this._$AH)?this._$AA.nextSibling.data=e:this.T(M.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,a="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=Q.createElement(Z(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===a)this._$AH.p(t);else{const e=new Y(a,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=K.get(e.strings);return void 0===t&&K.set(e.strings,t=new Q(e)),t}k(e){T(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,a=0;for(const s of e)a===t.length?t.push(i=new ee(this.O(P()),this.O(P()),this,this.options)):i=t[a],i._$AI(s),a++;a<t.length&&(this._$AR(i&&i._$AB.nextSibling,a),t.length=a)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=k(e).nextSibling;k(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class te{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,a,s){this.type=1,this._$AH=F,this._$AN=void 0,this.element=e,this.name=t,this._$AM=a,this.options=s,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=F}_$AI(e,t=this,i,a){const s=this.strings;let n=!1;if(void 0===s)e=X(this,e,t,0),n=!N(e)||e!==this._$AH&&e!==W,n&&(this._$AH=e);else{const a=e;let r,o;for(e=s[0],r=0;r<s.length-1;r++)o=X(this,a[i+r],t,r),o===W&&(o=this._$AH[r]),n||=!N(o)||o!==this._$AH[r],o===F?e=F:e!==F&&(e+=(o??"")+s[r+1]),this._$AH[r]=o}n&&!a&&this.j(e)}j(e){e===F?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class ie extends te{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===F?void 0:e}}class ae extends te{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==F)}}class se extends te{constructor(e,t,i,a,s){super(e,t,i,a,s),this.type=5}_$AI(e,t=this){if((e=X(this,e,t,0)??F)===W)return;const i=this._$AH,a=e===F&&i!==F||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,s=e!==F&&(i===F||a);a&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ne{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){X(this,e)}}const re=$.litHtmlPolyfillSupport;re?.(Q,ee),($.litHtmlVersions??=[]).push("3.3.3");const oe=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class le extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const a=i?.renderBefore??t;let s=a._$litPart$;if(void 0===s){const e=i?.renderBefore??null;a._$litPart$=s=new ee(t.insertBefore(P(),e),e,void 0,i??{})}return s._$AI(e),s})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}le._$litElement$=!0,le.finalized=!0,oe.litElementHydrateSupport?.({LitElement:le});const he=oe.litElementPolyfillSupport;function ce(e,t,i={}){const a=function(e,t,i={}){if(!t)return;const a=e?.states[t]?.attributes,s="string"==typeof a?.friendly_name&&a.friendly_name||i.name,n="string"==typeof a?.entity_picture&&a.entity_picture||i.picture||void 0;return s||n?{name:s??"",picture:n}:void 0}(e,t,i);return a?B`<span class="avatar" role="img" aria-label=${a.name} title=${a.name}
    >${a.picture?B`<img src=${a.picture} alt="" loading="lazy" />`:B`<span class="initials" aria-hidden="true">${function(e){const t=e.trim().split(/\s+/).filter(Boolean);if(!t.length)return"";const i=e=>Array.from(e)[0]?.toUpperCase()??"";return 1===t.length?i(t[0]):`${i(t[0])}${i(t[t.length-1])}`}(a.name)}</span>`}</span
  >`:F}he?.({LitElement:le}),(oe.litElementVersions??=[]).push("4.2.2");const de=n`
  .avatar {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--dc-avatar-size, 24px);
    height: var(--dc-avatar-size, 24px);
    border-radius: 50%;
    overflow: hidden;
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    font-size: calc(var(--dc-avatar-size, 24px) * 0.42);
    font-weight: 500;
    line-height: 1;
    user-select: none;
  }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`,ue=["year","6months","3months"],_e={year:53,"6months":26,"3months":13},ge=864e5;function pe(e){const[t,i,a]=e.split("-").map(Number);return Math.round(Date.UTC(t,i-1,a)/ge)}function me(e){return new Date(e*ge).toISOString().slice(0,10)}const fe={add_amount:"Add {amount}",all_reached_today:"Everyone reached today's goal ✓",best:"Best",cancel:"Cancel",card_description:"Track today's progress of a daily challenge.",card_name:"Daily Challenge",catch_up:"Today: {target} + {deficit} deficit",caught_up:"Deficit made up ✓",celebrate_best_day:"New best day: {value} {unit}!",celebrate_best_streak:"New best streak: {value} days!",celebrate_streak:"{value} days in a row!",celebrate_total:"{value} {unit} in total!",challenge:"Challenge",change:"{name}: {change}",current_streak:"Current streak",day_from_source:"Today's value comes from the source sensor.",day_fulfilled:"fulfilled ✓",day_not_fulfilled:"not fulfilled",day_target:"Target {target}",day_value:"Value",edit_value:"Enter today's value",entities:"Challenges (empty: all)",entity_not_found:"Entity not found: {entity}",finished:"Challenge finished · {percent}%",finished_goal_reached:"Challenge finished · goal reached ✓",goal_month:"Shared goal this month",goal_reached:"Goal reached ✓",goal_remaining:"{remaining} to go",goal_week:"Shared goal this week",goal_year:"Shared goal this year",group:"Group",group_not_found:"Daily Challenge group not found.",group_not_loaded:"The group is not loaded right now.",group_streak:"Group streak",heatmap:"Daily values as a calendar",heatmap_range:"Calendar range",invalid_entities:"entities must be a list of entities.",invalid_option:"{option} must be one of: {values}.",invalid_value:"Enter a whole number from 0.",leaderboard_description:"Ranking of a group of challenges.",leaderboard_name:"Daily Challenge leaderboard",left_in_days:"{remaining} left in {days} days",left_to_goal:"{remaining} left to goal",left_to_goal_last_day:"{remaining} left on the last day",loading:"Loading…",metric:"Ranking by",metric_amount:"Amount",metric_percent:"Percent",metric_streak:"Streak",missing_entity:"Please define an entity of a Daily Challenge.",missing_group:"Please choose a Daily Challenge group.",no_challenges:"No Daily Challenge set up yet.",no_groups:"No Daily Challenge group set up yet.",not_a_challenge:"{entity} does not belong to a Daily Challenge.",only_mine:"Only my challenges",overview_description:"All challenges at a glance.",overview_ended:"Finished",overview_missing:"None of the chosen challenges exists any more.",overview_name:"Daily Challenge overview",overview_none_mine:"No challenge is assigned to you yet.",period:"Period",period_month:"Month",period_today:"Today",period_total:"Total",period_week:"Week",range_3months:"3 months",range_6months:"6 months",range_year:"1 year",rank:"Rank {rank}",ranking:"Ranking by (empty: as in the group)",ranking_empty:"No challenge of the group is loaded.",required_per_day:"Ø {per_day}/day",rescuable:"can still be made up today",save:"Save",show_buttons:"Show buttons",show_catch_up:"Show catch-up deficit",show_celebration:"Celebrate goals and milestones",show_goal:"Show shared goal",show_heatmap:"Show calendar (heatmap)",show_remaining:"Show what is left until the end goal",show_required_average:"Show required average per day",show_stats:"Show statistics",show_streak:"Show streak",show_target_vs_actual:"Show actual vs. target",stat_average:"Ø per day",stat_best_day:"Best day",stat_best_streak:"Best streak",stat_total:"Total",streak_day:"{value} day",streak_days:"{value} days",target_vs_actual:"Actual {total} / Target {target}",title:"Title",undo:"Undo",value_percent:"{value}%"},ve={de:{add_amount:"{amount} hinzufügen",all_reached_today:"Alle haben das heutige Ziel erreicht ✓",best:"Rekord",cancel:"Abbrechen",card_description:"Zeigt den heutigen Fortschritt einer täglichen Challenge.",card_name:"Daily Challenge",catch_up:"Heute: {target} + {deficit} Rückstand",caught_up:"Rückstand aufgeholt ✓",celebrate_best_day:"Neuer bester Tag: {value} {unit}!",celebrate_best_streak:"Neuer bester Streak: {value} Tage!",celebrate_streak:"{value} Tage in Folge!",celebrate_total:"{value} {unit} insgesamt!",challenge:"Challenge",change:"{name}: {change}",current_streak:"Aktueller Streak",day_from_source:"Der heutige Wert kommt vom Quell-Sensor.",day_fulfilled:"erfüllt ✓",day_not_fulfilled:"nicht erfüllt",day_target:"Ziel {target}",day_value:"Wert",edit_value:"Heutigen Wert eingeben",entities:"Challenges (leer: alle)",entity_not_found:"Entität nicht gefunden: {entity}",finished:"Challenge abgeschlossen · {percent} %",finished_goal_reached:"Challenge abgeschlossen · Ziel erreicht ✓",goal_month:"Gemeinsames Ziel diesen Monat",goal_reached:"Ziel erreicht ✓",goal_remaining:"Noch {remaining}",goal_week:"Gemeinsames Ziel diese Woche",goal_year:"Gemeinsames Ziel dieses Jahr",group:"Gruppe",group_not_found:"Gruppe der Daily Challenge nicht gefunden.",group_not_loaded:"Die Gruppe ist gerade nicht geladen.",group_streak:"Gruppen-Streak",heatmap:"Tageswerte als Kalender",heatmap_range:"Zeitraum des Kalenders",invalid_entities:"entities muss eine Liste von Entitäten sein.",invalid_option:"{option} muss einer dieser Werte sein: {values}.",invalid_value:"Gib eine ganze Zahl ab 0 ein.",leaderboard_description:"Rangliste einer Gruppe von Challenges.",leaderboard_name:"Daily Challenge Rangliste",left_in_days:"Noch {remaining} in {days} Tagen",left_to_goal:"Noch {remaining} bis zum Ziel",left_to_goal_last_day:"Noch {remaining} am letzten Tag",loading:"Wird geladen …",metric:"Rangliste nach",metric_amount:"Menge",metric_percent:"Prozent",metric_streak:"Streak",missing_entity:"Bitte gib eine Entität einer Daily Challenge an.",missing_group:"Bitte wähle eine Gruppe der Daily Challenge.",no_challenges:"Noch keine Daily Challenge eingerichtet.",no_groups:"Noch keine Gruppe der Daily Challenge eingerichtet.",not_a_challenge:"{entity} gehört zu keiner Daily Challenge.",only_mine:"Nur meine Challenges",overview_description:"Alle Challenges auf einen Blick.",overview_ended:"Beendet",overview_missing:"Keine der gewählten Challenges gibt es noch.",overview_name:"Daily Challenge Übersicht",overview_none_mine:"Dir ist noch keine Challenge zugeordnet.",period:"Zeitraum",period_month:"Monat",period_today:"Heute",period_total:"Gesamt",period_week:"Woche",range_3months:"3 Monate",range_6months:"6 Monate",range_year:"1 Jahr",rank:"Rang {rank}",ranking:"Rangliste nach (leer: wie in der Gruppe)",ranking_empty:"Keine Challenge der Gruppe ist geladen.",required_per_day:"Ø {per_day}/Tag",rescuable:"heute noch aufholbar",save:"Speichern",show_buttons:"Buttons anzeigen",show_catch_up:"Rückstand beim Aufholen anzeigen",show_celebration:"Ziele und Meilensteine feiern",show_goal:"Gemeinsames Ziel anzeigen",show_heatmap:"Kalender (Heatmap) anzeigen",show_remaining:"Rest bis zum Ziel anzeigen",show_required_average:"Nötigen Schnitt pro Tag anzeigen",show_stats:"Statistik anzeigen",show_streak:"Streak anzeigen",show_target_vs_actual:"Ist / Soll anzeigen",stat_average:"Ø pro Tag",stat_best_day:"Bester Tag",stat_best_streak:"Bester Streak",stat_total:"Total",streak_day:"{value} Tag",streak_days:"{value} Tage",target_vs_actual:"Ist {total} / Soll {target}",title:"Titel",undo:"Rückgängig",value_percent:"{value} %"},en:fe,fr:{add_amount:"Ajouter {amount}",all_reached_today:"Tout le monde a atteint l'objectif du jour ✓",best:"Record",cancel:"Annuler",card_description:"Affiche la progression du jour d'un défi quotidien.",card_name:"Daily Challenge",catch_up:"Aujourd'hui : {target} + {deficit} de retard",caught_up:"Retard rattrapé ✓",celebrate_best_day:"Nouveau meilleur jour : {value} {unit} !",celebrate_best_streak:"Nouvelle meilleure série : {value} jours !",celebrate_streak:"{value} jours d'affilée !",celebrate_total:"{value} {unit} au total !",challenge:"Défi",change:"{name} : {change}",current_streak:"Série actuelle",day_from_source:"La valeur du jour provient du capteur source.",day_fulfilled:"atteint ✓",day_not_fulfilled:"non atteint",day_target:"Objectif {target}",day_value:"Valeur",edit_value:"Saisir la valeur du jour",entities:"Défis (vide : tous)",entity_not_found:"Entité introuvable : {entity}",finished:"Challenge terminé · {percent} %",finished_goal_reached:"Challenge terminé · objectif atteint ✓",goal_month:"Objectif commun ce mois-ci",goal_reached:"Objectif atteint ✓",goal_remaining:"Encore {remaining}",goal_week:"Objectif commun cette semaine",goal_year:"Objectif commun cette année",group:"Groupe",group_not_found:"Groupe Daily Challenge introuvable.",group_not_loaded:"Le groupe n'est pas chargé pour le moment.",group_streak:"Série du groupe",heatmap:"Valeurs quotidiennes en calendrier",heatmap_range:"Période du calendrier",invalid_entities:"entities doit être une liste d'entités.",invalid_option:"{option} doit être l'une de ces valeurs : {values}.",invalid_value:"Saisis un nombre entier à partir de 0.",leaderboard_description:"Classement d'un groupe de défis.",leaderboard_name:"Daily Challenge – classement",left_in_days:"Encore {remaining} en {days} jours",left_to_goal:"Encore {remaining} jusqu'à l'objectif",left_to_goal_last_day:"Encore {remaining} le dernier jour",loading:"Chargement…",metric:"Classer par",metric_amount:"Quantité",metric_percent:"Pourcentage",metric_streak:"Série",missing_entity:"Veuillez indiquer une entité d'un Daily Challenge.",missing_group:"Veuillez choisir un groupe Daily Challenge.",no_challenges:"Aucun Daily Challenge configuré pour l'instant.",no_groups:"Aucun groupe Daily Challenge configuré pour l'instant.",not_a_challenge:"{entity} n'appartient à aucun Daily Challenge.",only_mine:"Seulement mes défis",overview_description:"Tous les défis en un coup d'œil.",overview_ended:"Terminé",overview_missing:"Aucun des défis choisis n'existe encore.",overview_name:"Daily Challenge – aperçu",overview_none_mine:"Aucun défi ne vous est encore attribué.",period:"Période",period_month:"Mois",period_today:"Aujourd'hui",period_total:"Total",period_week:"Semaine",range_3months:"3 mois",range_6months:"6 mois",range_year:"1 an",rank:"Rang {rank}",ranking:"Classer par (vide : comme dans le groupe)",ranking_empty:"Aucun défi du groupe n'est chargé.",required_per_day:"Ø {per_day}/jour",rescuable:"encore rattrapable aujourd'hui",save:"Enregistrer",show_buttons:"Afficher les boutons",show_catch_up:"Afficher le retard à rattraper",show_celebration:"Fêter les objectifs et les jalons",show_goal:"Afficher l'objectif commun",show_heatmap:"Afficher le calendrier (heatmap)",show_remaining:"Afficher le reste jusqu'à l'objectif",show_required_average:"Afficher la moyenne nécessaire par jour",show_stats:"Afficher les statistiques",show_streak:"Afficher la série",show_target_vs_actual:"Afficher réel / objectif",stat_average:"Ø par jour",stat_best_day:"Meilleur jour",stat_best_streak:"Meilleure série",stat_total:"Total",streak_day:"{value} jour",streak_days:"{value} jours",target_vs_actual:"Réel {total} / Objectif {target}",title:"Titre",undo:"Annuler",value_percent:"{value} %"},it:{add_amount:"Aggiungi {amount}",all_reached_today:"Tutti hanno raggiunto l'obiettivo di oggi ✓",best:"Record",cancel:"Annulla",card_description:"Mostra i progressi di oggi di una sfida giornaliera.",card_name:"Daily Challenge",catch_up:"Oggi: {target} + {deficit} di ritardo",caught_up:"Ritardo recuperato ✓",celebrate_best_day:"Nuovo giorno migliore: {value} {unit}!",celebrate_best_streak:"Nuova serie migliore: {value} giorni!",celebrate_streak:"{value} giorni di fila!",celebrate_total:"{value} {unit} in totale!",challenge:"Sfida",change:"{name}: {change}",current_streak:"Serie attuale",day_from_source:"Il valore di oggi proviene dal sensore sorgente.",day_fulfilled:"raggiunto ✓",day_not_fulfilled:"non raggiunto",day_target:"Obiettivo {target}",day_value:"Valore",edit_value:"Inserisci il valore di oggi",entities:"Sfide (vuoto: tutte)",entity_not_found:"Entità non trovata: {entity}",finished:"Challenge conclusa · {percent} %",finished_goal_reached:"Challenge conclusa · obiettivo raggiunto ✓",goal_month:"Obiettivo comune questo mese",goal_reached:"Obiettivo raggiunto ✓",goal_remaining:"Ancora {remaining}",goal_week:"Obiettivo comune questa settimana",goal_year:"Obiettivo comune quest'anno",group:"Gruppo",group_not_found:"Gruppo Daily Challenge non trovato.",group_not_loaded:"Il gruppo non è caricato al momento.",group_streak:"Serie del gruppo",heatmap:"Valori giornalieri come calendario",heatmap_range:"Periodo del calendario",invalid_entities:"entities deve essere un elenco di entità.",invalid_option:"{option} deve essere uno di questi valori: {values}.",invalid_value:"Inserisci un numero intero da 0.",leaderboard_description:"Classifica di un gruppo di sfide.",leaderboard_name:"Daily Challenge – classifica",left_in_days:"Ancora {remaining} in {days} giorni",left_to_goal:"Ancora {remaining} all'obiettivo",left_to_goal_last_day:"Ancora {remaining} nell'ultimo giorno",loading:"Caricamento…",metric:"Classifica per",metric_amount:"Quantità",metric_percent:"Percentuale",metric_streak:"Serie",missing_entity:"Indica un'entità di una Daily Challenge.",missing_group:"Scegli un gruppo Daily Challenge.",no_challenges:"Nessuna Daily Challenge configurata.",no_groups:"Nessun gruppo Daily Challenge configurato.",not_a_challenge:"{entity} non appartiene a nessuna Daily Challenge.",only_mine:"Solo le mie sfide",overview_description:"Tutte le sfide in un colpo d'occhio.",overview_ended:"Terminata",overview_missing:"Nessuna delle sfide scelte esiste ancora.",overview_name:"Daily Challenge – panoramica",overview_none_mine:"Non ti è ancora stata assegnata nessuna sfida.",period:"Periodo",period_month:"Mese",period_today:"Oggi",period_total:"Totale",period_week:"Settimana",range_3months:"3 mesi",range_6months:"6 mesi",range_year:"1 anno",rank:"Posizione {rank}",ranking:"Classifica per (vuoto: come nel gruppo)",ranking_empty:"Nessuna sfida del gruppo è caricata.",required_per_day:"Ø {per_day}/giorno",rescuable:"ancora recuperabile oggi",save:"Salva",show_buttons:"Mostra pulsanti",show_catch_up:"Mostra ritardo da recuperare",show_celebration:"Festeggia obiettivi e traguardi",show_goal:"Mostra obiettivo comune",show_heatmap:"Mostra calendario (heatmap)",show_remaining:"Mostra quanto manca all'obiettivo",show_required_average:"Mostra media necessaria al giorno",show_stats:"Mostra statistiche",show_streak:"Mostra serie",show_target_vs_actual:"Mostra effettivo / obiettivo",stat_average:"Ø al giorno",stat_best_day:"Giorno migliore",stat_best_streak:"Serie migliore",stat_total:"Totale",streak_day:"{value} giorno",streak_days:"{value} giorni",target_vs_actual:"Effettivo {total} / Obiettivo {target}",title:"Titolo",undo:"Annulla",value_percent:"{value}%"}};function ye(e){return e?.locale?.language||("undefined"==typeof document?"":document.documentElement.lang)||"en"}function be(e,t,i={}){return(a=ye(e),ve[a]??ve[a.split("-")[0]]??fe)[t].replace(/\{(\w+)\}/g,(e,t)=>t in i?i[t]:e);var a}const we={comma_decimal:["en-US","en"],decimal_comma:["de","es","it"],quote_decimal:["de-CH"],space_comma:["fr","sv","cs"],system:void 0};function $e(e,t){const i=e?.locale?.number_format??"language",a=i in we?we[i]:"none"===i?["en-US"]:[ye(e)];try{return function(e,t){const i=`${e?.join(",")??""}|${t}`;let a=ke.get(i);a||(a=new Intl.NumberFormat(e,{useGrouping:t}),ke.set(i,a));return a}(a,"none"!==i).format(t)}catch{return String(t)}}const ke=new Map;const xe=new Map;function Se(e){if("object"==typeof e&&null!==e&&"message"in e){const t=e.message;if("string"==typeof t&&t)return t}return String(e)}function Ae(e,t){return 0===t?"±0":`${t>0?"+":"−"}${$e(e,Math.abs(t))}`}const Ce=["show_streak","show_target_vs_actual","show_remaining","show_required_average","show_catch_up","show_buttons","show_stats","show_heatmap","show_celebration"],Ee=["today","week","month","total"],De=["percent","amount","streak"],Me="daily-challenge-card-editor";class Pe extends le{static properties={hass:{attribute:!1},_config:{state:!0},_challenges:{state:!0}};_loading=!1;setConfig(e){this._config=e}willUpdate(e){e.has("hass")&&this.hass&&!this._loading&&!this._challenges&&(this._loading=!0,this._load())}async _load(){try{const e=await(this.hass?.callWS({type:"daily_challenge/list"}));this._challenges=e?.challenges??[]}catch{this._challenges=[]}finally{this._loading=!1}}_selected(){const e=this._config?.entity;return this._challenges?.find(t=>Object.values(t.entities).includes(e??""))?.entry_id}_schema(e){return[{name:"challenge",required:!0,selector:{select:{mode:"dropdown",options:e.map(e=>({value:e.entry_id,label:e.name}))}}},...Ce.map(e=>({name:e,selector:{boolean:{}}})),{name:"heatmap_range",selector:{select:{mode:"dropdown",options:ue.map(e=>({value:e,label:be(this.hass,`range_${e}`)}))}}}]}_formData(){const e={challenge:this._selected(),heatmap_range:this._config?.heatmap_range??"year"};for(const t of Ce)e[t]=!1!==this._config?.[t];return e}_valueChanged(e){if(e.stopPropagation(),!this._config)return;const t=e.detail.value,i=t.challenge===this._selected()?void 0:this._challenges?.find(e=>e.entry_id===t.challenge),a={...this._config,entity:i?.entities.today??this._config.entity};for(const e of Ce)!1===t[e]?a[e]=!1:delete a[e];const s=t.heatmap_range;s&&"year"!==s&&ue.includes(s)?a.heatmap_range=s:delete a.heatmap_range,JSON.stringify(a)!==JSON.stringify(this._config)&&(this._config=a,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:a},bubbles:!0,composed:!0})))}render(){return this.hass&&this._config&&this._challenges?0===this._challenges.length?B`<p>${be(this.hass,"no_challenges")}</p>`:B`<ha-form
      .hass=${this.hass}
      .data=${this._formData()}
      .schema=${this._schema(this._challenges)}
      .computeLabel=${e=>be(this.hass,e.name)}
      @value-changed=${this._valueChanged}
    ></ha-form>`:F}}customElements.get(Me)||customElements.define(Me,Pe);const Ne="daily-challenge-leaderboard-card-editor";class Te extends le{static properties={hass:{attribute:!1},_config:{state:!0},_groups:{state:!0}};_loading=!1;setConfig(e){this._config=e}willUpdate(e){e.has("hass")&&this.hass&&!this._loading&&!this._groups&&(this._loading=!0,this._load())}async _load(){try{const e=await(this.hass?.callWS({type:"daily_challenge/list"}));this._groups=e?.groups??[]}catch{this._groups=[]}finally{this._loading=!1}}_schema(e){const t=(e,t)=>t.map(t=>({value:t,label:be(this.hass,`${e}_${t}`)}));return[{name:"group",required:!0,selector:{select:{mode:"dropdown",options:e.map(e=>({value:e.entry_id,label:e.name}))}}},{name:"title",selector:{text:{}}},{name:"period",selector:{select:{mode:"dropdown",options:t("period",Ee)}}},{name:"ranking",selector:{select:{mode:"dropdown",options:t("metric",De)}}},{name:"show_goal",selector:{boolean:{}}}]}_valueChanged(e){if(e.stopPropagation(),!this._config)return;const t=e.detail.value,i={...this._config};delete i.title,delete i.period,delete i.ranking,delete i.show_goal,"string"==typeof t.group&&t.group&&(i.group=t.group);const a="string"==typeof t.title?t.title.trim():"";a&&(i.title=a);const s=t.period;s&&"week"!==s&&Ee.includes(s)&&(i.period=s);const n=t.ranking;n&&De.includes(n)&&(i.ranking=n),!1===t.show_goal&&(i.show_goal=!1),JSON.stringify(i)!==JSON.stringify(this._config)&&(this._config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0})))}render(){if(!this.hass||!this._config||!this._groups)return F;if(0===this._groups.length)return B`<p>${be(this.hass,"no_groups")}</p>`;const e={group:this._config.group||void 0,title:this._config.title??"",period:this._config.period??"week",ranking:this._config.ranking,show_goal:!1!==this._config.show_goal};return B`<ha-form
      .hass=${this.hass}
      .data=${e}
      .schema=${this._schema(this._groups)}
      .computeLabel=${e=>be(this.hass,e.name)}
      @value-changed=${this._valueChanged}
    ></ha-form>`}}customElements.get(Ne)||customElements.define(Ne,Te);const Re="daily-challenge-leaderboard-card",Oe=Symbol("not loaded");class je extends le{static properties={hass:{attribute:!1},_config:{state:!0},_group:{state:!0},_ranking:{state:!0},_error:{state:!0},_period:{state:!0},_metric:{state:!0}};static getConfigElement(){return document.createElement(Ne)}static async getStubConfig(e){let t="";try{const i=await(e?.callWS({type:"daily_challenge/list"}));t=i?.groups?.[0]?.entry_id??""}catch{}return{type:`custom:${Re}`,group:t}}_members=[];_watched;_entitiesSeen=Oe;_listRetryAt=0;_listId=0;_rankingKey;_rankingRetryAt=0;_rankingId=0;constructor(){super(),this._period="week"}setConfig(e){if(!e?.group)throw new Error(be(this.hass,"missing_group"));const t=(e,t,i)=>{if(void 0!==t&&!i.includes(t))throw new Error(be(this.hass,"invalid_option",{option:e,values:i.join(", ")}))};t("period",e.period,Ee),t("ranking",e.ranking,De);const i=this._config;e.group!==i?.group&&(this._group=void 0,this._ranking=void 0,this._error=void 0,this._members=[],this._watched=void 0,this._entitiesSeen=Oe,this._listRetryAt=0,this._rankingKey=void 0,this._rankingRetryAt=0),e.group===i?.group&&e.period===i?.period||(this._period=e.period??"week"),e.group===i?.group&&e.ranking===i?.ranking||(this._metric=e.ranking),this._config=e}getCardSize(){const e=this._ranking?.rows.length??this._group?.members.length??3,t=Number(Boolean(this._ranking?.goal)&&!1!==this._config?.show_goal);return 2+Math.max(1,e)+t+1}getGridOptions(){return{columns:6,min_columns:4,rows:"auto"}}get ranking(){return this._ranking}shouldUpdate(e){if(1!==e.size||!e.has("hass")||void 0===this._watched)return!0;const t=e.get("hass"),i=this.hass;return!t||!i||t.entities!==i.entities||t.locale!==i.locale||t.user!==i.user||this._rankingKey!==this._key()||this._watched.some(e=>t.states[e]!==i.states[e])}willUpdate(e){this.hass&&this._config&&this.hass.entities!==this._entitiesSeen&&Date.now()>=this._listRetryAt&&(this._entitiesSeen=this.hass.entities,this._loadList());const t=this._key();this.hass&&this._config&&void 0!==this._watched&&t!==this._rankingKey&&Date.now()>=this._rankingRetryAt&&(this._rankingKey=t,this._loadRanking())}_key(){const e=(this._watched??[]).map(e=>this.hass?.states[e]?.state);return JSON.stringify([this._config?.group,this._period,this._metric,e,(new Date).toDateString()])}async _loadList(){const e=this._config?.group,t=++this._listId;try{const i=await(this.hass?.callWS({type:"daily_challenge/list"}));if(t!==this._listId||e!==this._config?.group)return;const a=i?.groups?.find(t=>t.entry_id===e)??null,s=i?.challenges??[];this._group=a,this._members=(a?.members??[]).map(e=>s.find(t=>t.entry_id===e)).filter(e=>void 0!==e),this._watched=this._members.flatMap(e=>[e.entities.today,e.person].filter(e=>Boolean(e)))}catch{t===this._listId&&(this._entitiesSeen=Oe,this._listRetryAt=Date.now()+5e3)}}async _loadRanking(){const e=this._config?.group,t=++this._rankingId,i={type:"daily_challenge/ranking",entry_id:e,period:this._period};this._metric&&(i.metric=this._metric);try{const a=await(this.hass?.callWS(i));t===this._rankingId&&e===this._config?.group&&(this._ranking=a,this._error=void 0)}catch(i){if(t!==this._rankingId||e!==this._config?.group)return;const a=function(e){if("object"==typeof e&&null!==e&&"code"in e){const t=e.code;return"string"==typeof t?t:void 0}}(i);"not_found"!==a&&"not_loaded"!==a||(this._error=a,this._ranking=void 0),this._rankingKey=void 0,this._rankingRetryAt=Date.now()+5e3}}_choosePeriod(e){this._period=e,this._rankingRetryAt=0}_chooseMetric(e){this._metric=e,this._rankingRetryAt=0}_shownMetric(){return this._metric??this._ranking?.metric??this._group?.ranking??"percent"}_moreInfo(e){const t=this._members.find(t=>t.entry_id===e.entry_id)?.entities.today;t&&this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:t},bubbles:!0,composed:!0}))}render(){if(!this._config||!this.hass)return F;const e=this.hass,t=this._config.title??this._ranking?.name??this._group?.name??"",i=this._ranking?.icon??this._group?.icon,a=t||i?B`<div class="header">
            ${i?B`<ha-icon .icon=${i}></ha-icon>`:F}
            <h1 class="title">${t}</h1>
          </div>`:F;if(this._error)return B`<ha-card>
        ${a}
        <div class="message warning">
          ${be(e,"not_found"===this._error?"group_not_found":"group_not_loaded")}
        </div>
      </ha-card>`;const s=this._ranking;return B`<ha-card>
      ${a} ${this._renderSelectors()}
      ${s?B`<div class="rows" aria-busy=${this._loadingOther()?"true":"false"}>
              ${s.rows.length?s.rows.map(e=>this._renderRow(s,e)):B`<div class="message">${be(e,"ranking_empty")}</div>`}
            </div>
            ${this._renderGoal(s)} ${this._renderStreak(s)}`:B`<div class="message" aria-live="polite">${be(e,"loading")}</div>`}
    </ha-card>`}_loadingOther(){const e=this._ranking;return void 0!==e&&(e.period!==this._period||void 0!==this._metric&&e.metric!==this._metric)}_renderSelectors(){const e=this.hass,t=this._shownMetric(),i=(t,i,a,s,n)=>B`<div class="segments" role="group" aria-label=${be(e,t)}>
        ${a.map(t=>B`<button
              class="segment ${t===s?"selected":""}"
              aria-pressed=${t===s?"true":"false"}
              @click=${()=>n(t)}
            >
              ${be(e,`${i}_${t}`)}
            </button>`)}
      </div>`;return B`<div class="selectors">
      ${i("period","period",Ee,this._period,e=>this._choosePeriod(e))}
      ${i("metric","metric",De,t,e=>this._chooseMetric(e))}
    </div>`}_formatValue(e,t){const i=this.hass;switch(e.metric){case"amount":return`${$e(i,t.amount)} ${t.unit}`.trim();case"streak":return be(i,1===t.streak?"streak_day":"streak_days",{value:$e(i,t.streak)});default:return be(i,"value_percent",{value:$e(i,t.percent)})}}_renderRow(e,t){const i=this.hass,a=Math.max(0,Math.min(100,t.percent||0)),s=t.rank>=1&&t.rank<=3?`medal-${t.rank}`:"",n=t.person?ce(i,t.person,{name:t.name,picture:t.picture}):F,r=()=>this._moreInfo(t);return B`<div
      class="row"
      role="button"
      tabindex="0"
      @click=${r}
      @keydown=${e=>{"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),r())}}
    >
      <span
        class="rank ${s}"
        role="img"
        aria-label=${be(i,"rank",{rank:String(t.rank)})}
        >${t.rank}</span
      >
      ${n===F?B`<span class="avatar icon-avatar" aria-hidden="true"
            ><ha-icon .icon=${t.icon}></ha-icon
          ></span>`:n}
      <div class="main">
        <div class="line">
          <span class="name">${t.name}</span>
          <span class="value">${this._formatValue(e,t)}</span>
        </div>
        ${t.challenge&&t.challenge!==t.name?B`<div class="challenge">${t.challenge}</div>`:F}
        <div class="bar" aria-hidden="true">
          <div
            class="fill ${a>=100?"reached":""}"
            style="width: ${a}%"
          ></div>
        </div>
      </div>
    </div>`}_renderGoal(e){const t=e.goal;if(!t||!1===this._config?.show_goal)return F;const i=this.hass,a=e.unit??"",s=Math.max(0,Math.min(100,t.progress||0)),n=t.remaining<=0;return B`<div class="goal">
      <div class="line">
        <span class="label">${be(i,`goal_${t.period}`)}</span>
        <span class="value"
          >${$e(i,t.total)} / ${$e(i,t.goal)}
          ${a}</span
        >
      </div>
      <div
        class="bar"
        role="progressbar"
        aria-label=${be(i,`goal_${t.period}`)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${s}
      >
        <div class="fill ${n?"reached":""}" style="width: ${s}%"></div>
      </div>
      <div class="note">
        ${n?be(i,"goal_reached"):be(i,"goal_remaining",{remaining:`${$e(i,t.remaining)} ${a}`.trim()})}
      </div>
    </div>`}_renderStreak(e){const t=this.hass;return B`<div class="group-streak">
      <span class="label">${be(t,"group_streak")}</span>
      <span class="streak"
        >🔥 <span class="current">${$e(t,e.streak)}</span>
        <span class="best"
          >· ${be(t,"best")} ${$e(t,e.best_streak)}</span
        ></span
      >
      ${e.all_reached_today?B`<div class="all-reached">${be(t,"all_reached_today")}</div>`:F}
    </div>`}static styles=[de,n`
      ha-card {
        display: block;
        padding: 16px;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      .header ha-icon {
        color: var(--state-icon-color, var(--primary-color));
      }
      .title {
        flex: 1;
        min-width: 0;
        margin: 0;
        font-size: 1.2em;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .selectors {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 8px;
      }
      .segments {
        display: inline-flex;
        flex-wrap: wrap;
        border: 1px solid var(--divider-color);
        border-radius: 16px;
        overflow: hidden;
      }
      .segment {
        padding: 4px 10px;
        border: none;
        background: transparent;
        color: var(--primary-text-color);
        font: inherit;
        font-size: 0.85em;
        cursor: pointer;
      }
      .segment + .segment {
        border-left: 1px solid var(--divider-color);
      }
      .segment.selected {
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
      }
      .segment:focus-visible {
        outline: 2px solid var(--primary-text-color);
        outline-offset: -2px;
      }
      .rows {
        display: flex;
        flex-direction: column;
        margin: 0 -8px;
      }
      .rows[aria-busy="true"] {
        opacity: 0.6;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        --dc-avatar-size: 32px;
      }
      .row:hover,
      .row:focus-visible {
        background: var(--secondary-background-color);
        outline: none;
      }
      .rank {
        flex: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        color: var(--secondary-text-color);
        font-weight: 500;
        font-variant-numeric: tabular-nums;
      }
      .rank.medal-1,
      .rank.medal-2,
      .rank.medal-3 {
        color: #000;
      }
      .rank.medal-1 {
        background: #f5c518;
      }
      .rank.medal-2 {
        background: #c0c4c8;
      }
      .rank.medal-3 {
        background: #d39a64;
      }
      .icon-avatar {
        background: var(--secondary-background-color);
        color: var(--state-icon-color, var(--primary-color));
        --mdc-icon-size: 20px;
      }
      .main {
        flex: 1;
        min-width: 0;
      }
      .line {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }
      .name {
        flex: 1;
        min-width: 0;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .value {
        flex: none;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .challenge,
      .note,
      .label,
      .best {
        color: var(--secondary-text-color);
      }
      .challenge {
        font-size: 0.85em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .bar {
        height: 6px;
        margin-top: 4px;
        border-radius: 3px;
        background: var(--divider-color);
        overflow: hidden;
      }
      .fill {
        height: 100%;
        border-radius: 3px;
        background: var(--primary-color);
        transition: width 0.3s ease;
      }
      .fill.reached {
        background: var(--success-color, #43a047);
      }
      .goal,
      .group-streak {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--divider-color);
      }
      .goal .label {
        flex: 1;
        min-width: 0;
      }
      .note {
        margin-top: 4px;
        font-size: 0.9em;
      }
      .group-streak {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 4px 8px;
      }
      .streak {
        white-space: nowrap;
      }
      .current {
        font-weight: 500;
      }
      .all-reached {
        flex-basis: 100%;
        color: var(--success-color, #43a047);
        font-size: 0.9em;
      }
      .message {
        padding: 8px 0;
        color: var(--secondary-text-color);
      }
      .message.warning {
        color: var(--warning-color, var(--primary-text-color));
      }
    `]}customElements.get(Re)||customElements.define(Re,je);const ze=window;ze.customCards??=[],ze.customCards.some(e=>e.type===Re)||ze.customCards.push({type:Re,name:be(void 0,"leaderboard_name"),description:be(void 0,"leaderboard_description"),preview:!0,documentationURL:"https://github.com/Skylolerr/ha-daily-challenge"});const Ue="daily-challenge-overview-card-editor",Ie=[{name:"title",selector:{text:{}}},{name:"entities",selector:{entity:{multiple:!0,filter:[{integration:"daily_challenge",domain:"number"}]}}},{name:"show_buttons",selector:{boolean:{}}},{name:"only_mine",selector:{boolean:{}}}];class He extends le{static properties={hass:{attribute:!1},_config:{state:!0}};setConfig(e){this._config=e}_valueChanged(e){if(e.stopPropagation(),!this._config)return;const t=e.detail.value,i={...this._config};delete i.title,delete i.entities,delete i.show_buttons,delete i.only_mine;const a="string"==typeof t.title?t.title.trim():"";a&&(i.title=a);const s=Array.isArray(t.entities)?t.entities.filter(Boolean):[];s.length&&(i.entities=s),!1===t.show_buttons&&(i.show_buttons=!1),!0===t.only_mine&&(i.only_mine=!0),JSON.stringify(i)!==JSON.stringify(this._config)&&(this._config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0})))}render(){if(!this.hass||!this._config)return F;const e={title:this._config.title??"",entities:this._config.entities??[],show_buttons:!1!==this._config.show_buttons,only_mine:!0===this._config.only_mine};return B`<ha-form
      .hass=${this.hass}
      .data=${e}
      .schema=${Ie}
      .computeLabel=${e=>be(this.hass,e.name)}
      @value-changed=${this._valueChanged}
    ></ha-form>`}}customElements.get(Ue)||customElements.define(Ue,He);const qe="daily-challenge-overview-card",Ge=Symbol("not loaded"),Be=new Set(["unknown","unavailable"]);class Le extends le{static properties={hass:{attribute:!1},_config:{state:!0},_challenges:{state:!0}};static getConfigElement(){return document.createElement(Ue)}static getStubConfig(){return{type:`custom:${qe}`}}_entitiesSeen=Ge;_retryAt=0;_lookupId=0;setConfig(e){if(void 0!==e.entities&&!Array.isArray(e.entities))throw new Error(be(this.hass,"invalid_entities"));this._config=e}getCardSize(){const e=this._challenges?this._visible().length:this._config?.entities?.length??3;return Number(Boolean(this._config?.title))+Math.max(1,e)}getGridOptions(){return{columns:6,min_columns:4,rows:"auto"}}willUpdate(e){this.hass&&this.hass.entities!==this._entitiesSeen&&Date.now()>=this._retryAt&&(this._entitiesSeen=this.hass.entities,this._load())}async _load(){const e=++this._lookupId;try{const t=await(this.hass?.callWS({type:"daily_challenge/list"}));e===this._lookupId&&(this._challenges=t?.challenges??[])}catch{e===this._lookupId&&(this._entitiesSeen=Ge,this._retryAt=Date.now()+5e3)}}_chosen(){const e=this._challenges??[],t=this._config?.entities??[];return 0===t.length?e:t.map(t=>e.find(e=>e.entities.today===t)).filter(e=>void 0!==e)}_visible(){const e=this._chosen();if(!this._config?.only_mine)return e;const t=this.hass?.user?.id;return e.filter(e=>{const i=e.person?this.hass?.states[e.person]:void 0;return void 0!==t&&i?.attributes.user_id===t})}_emptyMessage(){return this._challenges?.length?this._config?.entities?.length&&!this._chosen().length?be(this.hass,"overview_missing"):be(this.hass,"overview_none_mine"):be(this.hass,"no_challenges")}_state(e,t){const i=e.entities[t];return i?this.hass?.states[i]?.state:void 0}_number(e,t){const i=this._state(e,t);if(void 0===i||Be.has(i))return;const a=Number(i);return Number.isFinite(a)?a:void 0}_smallestStep(e){if(!1===this._config?.show_buttons||e.today_from_source)return;const t=Object.keys(e.entities).filter(e=>/^add_\d+$/.test(e)).map(e=>Number(e.slice(4))).sort((e,t)=>e-t).filter(t=>{const i=this._state(e,`add_${t}`);return void 0!==i&&"unavailable"!==i});return t[0]}_moreInfo(e){this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:e.entities.today},bubbles:!0,composed:!0}))}async _add(e,t,i){e.stopPropagation();try{await(this.hass?.callService("button","press",{entity_id:t.entities[`add_${i}`]}))}catch(e){this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:Se(e)},bubbles:!0,composed:!0}))}}render(){if(!this._config||!this.hass)return F;const e=this._config.title?B`<h1 class="card-header">${this._config.title}</h1>`:F;if(void 0===this._challenges)return B`<ha-card>${e}</ha-card>`;const t=this._visible();return B`<ha-card>
      ${e}
      <div class="rows">
        ${t.length?t.map(e=>this._renderRow(e)):B`<div class="empty">${this._emptyMessage()}</div>`}
      </div>
    </ha-card>`}_renderRow(e){const t=this.hass,i=0===this._number(e,"days_left"),a=this._number(e,"today"),s=this._number(e,"today_target"),n="on"===this._state(e,"goal_reached_today"),r=this._number(e,"current_streak"),o=t?.states[e.entities.today]?.attributes.unit_of_measurement??e.unit,l=n?1:void 0!==a&&s?Math.min(1,a/s):0,h=e=>void 0===e?"–":$e(t,e),c=i?void 0:this._smallestStep(e);return B`<div
      class="row"
      role="button"
      tabindex="0"
      @click=${()=>this._moreInfo(e)}
      @keydown=${t=>{"Enter"!==t.key&&" "!==t.key||(t.preventDefault(),this._moreInfo(e))}}
    >
      <ha-icon .icon=${e.icon}></ha-icon>
      <div class="main">
        <div class="name-line">
          ${ce(t,e.person)}
          <span class="name">${e.name}</span>
        </div>
        <div class="bar" aria-hidden="true">
          <div
            class="fill ${n?"reached":""}"
            style="width: ${100*(i?0:l)}%"
          ></div>
        </div>
        <div class="figures">
          ${i?be(t,"overview_ended"):B`${h(a)} / ${h(s)} ${o}`}
        </div>
      </div>
      <span class="streak" title=${be(t,"current_streak")}
        >🔥 ${h(r)}</span
      >
      ${void 0===c?F:B`<button
            class="add"
            ?disabled=${void 0===s}
            aria-label=${be(t,"add_amount",{amount:String(c)})}
            @click=${t=>this._add(t,e,c)}
            @keydown=${e=>e.stopPropagation()}
          >
            +${c}
          </button>`}
    </div>`}static styles=[de,n`
    ha-card {
      display: block;
      padding-bottom: 8px;
    }
    .card-header {
      margin: 0;
      padding: 16px 16px 0;
      font-size: 1.2em;
      font-weight: 500;
    }
    .rows {
      display: flex;
      flex-direction: column;
      padding: 8px 8px 0;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
    }
    .row:hover,
    .row:focus-visible {
      background: var(--secondary-background-color);
      outline: none;
    }
    ha-icon {
      color: var(--state-icon-color, var(--primary-color));
      flex: none;
    }
    .main {
      flex: 1;
      min-width: 0;
    }
    .name-line {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      --dc-avatar-size: 20px;
    }
    .name {
      min-width: 0;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .figures {
      margin-top: 2px;
      color: var(--secondary-text-color);
      font-size: 0.9em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .bar {
      height: 6px;
      margin-top: 4px;
      border-radius: 3px;
      background: var(--divider-color);
      overflow: hidden;
    }
    .fill {
      height: 100%;
      border-radius: 3px;
      background: var(--primary-color);
      transition: width 0.3s ease;
    }
    .fill.reached {
      background: var(--success-color, #43a047);
    }
    .streak {
      flex: none;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }
    .add {
      flex: none;
      min-width: 48px;
      padding: 6px 10px;
      border: none;
      border-radius: 18px;
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      font: inherit;
      font-weight: 500;
      cursor: pointer;
    }
    .add:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .add:focus-visible {
      outline: 2px solid var(--primary-text-color);
      outline-offset: 2px;
    }
    .empty {
      padding: 8px;
      color: var(--secondary-text-color);
    }
  `]}customElements.get(qe)||customElements.define(qe,Le);const We=window;We.customCards??=[],We.customCards.some(e=>e.type===qe)||We.customCards.push({type:qe,name:be(void 0,"overview_name"),description:be(void 0,"overview_description"),preview:!0,documentationURL:"https://github.com/Skylolerr/ha-daily-challenge"});const Fe="daily-challenge-card",Ke=500,Ve=5e3,Ze=8e3,Je=3e3,Qe=["var(--success-color, #43a047)","var(--primary-color, #03a9f4)","var(--warning-color, #ffa600)","var(--accent-color, #ff9800)"],Xe=2*Math.PI*52,Ye=Symbol("not loaded"),et=new Set(["unknown","unavailable"]);function tt(e){const t=Object.values(e?.entities??{}).find(e=>"daily_challenge"===e.platform&&"today"===e.translation_key);return t?.entity_id??""}function it(e){return Object.keys(e).filter(e=>/^add_\d+$/.test(e)).map(e=>Number(e.slice(4))).sort((e,t)=>e-t)}class at extends le{static properties={hass:{attribute:!1},_config:{state:!0},_challenge:{state:!0},_editing:{state:!0},_history:{state:!0},_dialog:{state:!0},_celebration:{state:!0},_focusDate:{state:!0}};static getConfigElement(){return document.createElement(Me)}static getStubConfig(e){return{type:`custom:${Fe}`,entity:tt(e)}}_lastGoal;_lastMilestone;_celebrationTimer;_historyRetryAt=0;_todaySeen;_heatmapCache;_entitiesSeen=Ye;_pressTimer;_committing=!1;_historyTotal;_lookupId=0;_historyId=0;_retryAt=0;_editValue="";constructor(){super(),this._editing=!1}setConfig(e){if(!e?.entity)throw new Error(be(this.hass,"missing_entity"));e.entity!==this._config?.entity&&(this._lastGoal=void 0,this._lastMilestone=void 0,this._dialog=void 0,this._focusDate=void 0,this._historyRetryAt=0,this._todaySeen=void 0,this._challenge=void 0,this._history=void 0,this._historyTotal=void 0,this._entitiesSeen=Ye),this._config=e}getCardSize(){const e=Number(this._show("show_stats"))+(this._show("show_heatmap")?3:0);if(this._ended())return 6+e;const t=Number(this._show("show_target_vs_actual"))+Number(this._show("show_remaining")||this._show("show_required_average")),i=this._show("show_buttons")&&!this._challenge?.today_from_source;return 5+t+Number(i)+e}getGridOptions(){return{columns:6,min_columns:6,rows:"auto"}}shouldUpdate(e){if(1!==e.size||!e.has("hass")||!this._challenge||!this._history)return!0;const t=e.get("hass"),i=this.hass;if(!t||!i||t.entities!==i.entities||t.locale!==i.locale)return!0;const a=Object.values(this._challenge.entities);return this._challenge.person&&a.push(this._challenge.person),a.some(e=>t.states[e]!==i.states[e])}willUpdate(e){this.hass&&this._config&&this.hass.entities!==this._entitiesSeen&&Date.now()>=this._retryAt&&(this._entitiesSeen=this.hass.entities,this._loadChallenge()),this._watchCelebrations();const t=this._state("today");this._challenge&&"unavailable"===this._todaySeen&&void 0!==t&&"unavailable"!==t&&this._loadChallenge(),this._todaySeen=t;const i=this._state("total"),a=`${i}|${this._state("target_to_date")??(new Date).toDateString()}`;this._challenge&&void 0!==i&&a!==this._historyTotal&&Date.now()>=this._historyRetryAt&&(this._historyTotal=a,this._loadHistory(this._challenge.entry_id))}get history(){return this._history}async _loadHistory(e){const t=++this._historyId;try{const i=await(this.hass?.callWS({type:"daily_challenge/history",entry_id:e}));t===this._historyId&&e===this._challenge?.entry_id&&(this._history=i,this._refreshDialog())}catch{t===this._historyId&&(this._historyTotal=void 0,this._historyRetryAt=Date.now()+Ve)}}_refreshDialog(){const e=this._dialog,t=this._history;if(!e||!t||e.saving)return;const i=e.cell.date,a=t.days[i]??0,s={...e.cell,value:a,target:t.targets[i]??e.cell.target,fulfilled:!0===t.fulfilled[i],rescuable:(t.rescuable??[]).includes(i)},n=e.value!==String(e.cell.value);this._dialog={...e,cell:s,value:n?e.value:String(a)}}updated(e){if(e.has("_dialog")&&this._dialog&&!e.get("_dialog")){const e=this.renderRoot.querySelector(".day-input");e?.focus(),e?.select()}if((e.has("_focusDate")||e.has("_dialog")&&!this._dialog)&&this._focusDate&&!this._dialog&&this.renderRoot.querySelector(`rect[data-date="${this._focusDate}"]`)?.focus(),e.has("_editing"))if(this._editing){const e=this.renderRoot.querySelector("input");e?.focus(),e?.select(),document.addEventListener("pointerdown",this._outsidePointer,!0)}else document.removeEventListener("pointerdown",this._outsidePointer,!0)}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this._celebrationTimer),this._celebration=void 0,this._lastGoal=void 0,this._lastMilestone=void 0,document.removeEventListener("pointerdown",this._outsidePointer,!0),this._clearPress()}_outsidePointer=e=>{const t=this.renderRoot.querySelector("input");t&&!e.composedPath().includes(t)&&this._commit(t)};async _loadChallenge(){const e=this._config?.entity;if(!this.hass||!e)return;const t=++this._lookupId;try{const i=await this.hass.callWS({type:"daily_challenge/list"});if(t!==this._lookupId||e!==this._config?.entity)return;this._challenge=i.challenges.find(t=>Object.values(t.entities).includes(e))??null}catch{if(t!==this._lookupId)return;this._entitiesSeen=Ye,this._retryAt=Date.now()+Ve}}_state(e){const t=this._challenge?.entities[e];return t?this.hass?.states[t]?.state:void 0}_number(e){const t=this._state(e);if(void 0===t||et.has(t))return;const i=Number(t);return Number.isFinite(i)?i:void 0}async _call(e,t,i){try{return await(this.hass?.callService(e,t,i)),!0}catch(e){return this._notify({message:Se(e)}),!1}}_notify(e){this.dispatchEvent(new CustomEvent("hass-notification",{detail:e,bubbles:!0,composed:!0}))}_offerUndo(e,t,i,a){this._notify({message:be(this.hass,"change",{name:e.name,change:t}),duration:Ze,action:{text:be(this.hass,"undo"),action:()=>{this._call("daily_challenge",i,{config_entry_id:e.entry_id,...a})}}})}async _press(e){const t=this._challenge,i=t?.entities[e];if(!t||!i)return;const a=this._number("today"),s="subtract"===e?-(it(t.entities)[0]??0):Number(e.slice(4)),n=Number(this.hass?.states[t.entities.today]?.attributes.max),r=void 0!==a&&n>=a?n-a:s,o=void 0!==a&&s<0?Math.max(s,-a):Math.min(s,r);await this._call("button","press",{entity_id:i})&&o&&this._offerUndo(t,Ae(this.hass,o),"add",{amount:-o})}_pointerDown(){this._clearPress(),this._pressTimer=setTimeout(()=>this._startEdit(),500)}_clearPress(){clearTimeout(this._pressTimer),this._pressTimer=void 0}_valueKeyDown(e){"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),this._startEdit())}_startEdit(){if(this._clearPress(),this._challenge?.today_from_source)return;const e=this._number("today");void 0!==e&&(this._editValue=String(e),this._committing=!1,this._editing=!0)}_inputKeyDown(e){"Enter"===e.key?(e.preventDefault(),e.stopPropagation(),this._commit(e.target)):"Escape"===e.key&&(e.preventDefault(),e.stopPropagation(),this._committing=!0,this._editing=!1)}async _commit(e){if(this._committing)return;this._committing=!0,this._editing=!1;const t=Number(e.value),i=this._challenge?.entities.today,a=this._number("today");i&&void 0!==a&&""!==e.value.trim()&&Number.isInteger(t)&&t>=0&&t!==a&&await this._call("number","set_value",{entity_id:i,value:t})&&this._challenge&&this._offerUndo(this._challenge,$e(this.hass,t),"set",{value:a})}render(){if(!this._config||!this.hass)return F;const e=this._config.entity;return this.hass.states[e]?void 0===this._challenge?B`<ha-card></ha-card>`:null===this._challenge?this._warning(be(this.hass,"not_a_challenge",{entity:e})):B`<ha-card>
      ${this._renderHeader(this._challenge)} ${this._renderValue(this._challenge)}
      ${this._renderSummary()} ${this._renderButtons(this._challenge)}
      ${this._renderStats()} ${this._renderHeatmap()} ${this._renderCelebration()}
      ${this._renderDialog()}
    </ha-card>`:this._warning(be(this.hass,"entity_not_found",{entity:e}))}_warning(e){return B`<ha-card><div class="warning">${e}</div></ha-card>`}_renderHeader(e){const t=e=>{const t=this._number(e);return void 0===t?"–":$e(this.hass,t)},i=t("current_streak"),a=t("best_streak");return B`<div class="header">
      <ha-icon .icon=${e.icon}></ha-icon>
      ${ce(this.hass,e.person)}
      <span class="name">${e.name}</span>
      ${this._show("show_streak")?B`<span class="streak" title=${be(this.hass,"current_streak")}>
            🔥 <span class="current">${i}</span>
            <span class="best">· ${be(this.hass,"best")} ${a}</span>
          </span>`:F}
    </div>`}_ended(){return 0===this._number("days_left")}_show(e){return!1!==this._config?.[e]}_renderValue(e){const t=this._ended(),i=this._number(t?"total":"today"),a=this._number(t?"target_to_date":"today_target"),s=t?void 0!==i&&void 0!==a&&i>=a:"on"===this._state("goal_reached_today"),n=s?1:void 0!==i&&a?Math.min(1,i/a):0,r=this.hass?.states[e.entities.today]?.attributes.unit_of_measurement??e.unit;return B`<div class="value-area">
      <svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
        ${L`<circle class="track" cx="60" cy="60" r=${52}></circle>
          <circle
            class="progress ${s?"reached":""}"
            cx="60"
            cy="60"
            r=${52}
            stroke-dasharray=${Xe}
            stroke-dashoffset=${Xe*(1-n)}
            transform="rotate(-90 60 60)"
          ></circle>`}
      </svg>
      ${t||e.today_from_source?B`<div class="value">${this._renderFigures(i,a,r)}</div>`:this._editing?B`<input
            class="value-input"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            aria-label=${be(this.hass,"edit_value")}
            .value=${this._editValue}
            @keydown=${this._inputKeyDown}
            @blur=${e=>this._commit(e.target)}
          />`:B`<div
            class="value"
            role="button"
            tabindex="0"
            title=${be(this.hass,"edit_value")}
            @pointerdown=${this._pointerDown}
            @pointerup=${this._clearPress}
            @pointerleave=${this._clearPress}
            @pointercancel=${this._clearPress}
            @contextmenu=${e=>e.preventDefault()}
            @keydown=${this._valueKeyDown}
          >
            ${this._renderFigures(i,a,r)}
          </div>`}
    </div>`}_renderFigures(e,t,i){const a=e=>void 0===e?"–":$e(this.hass,e),s=a(e),n=s.length>5?`font-size: ${Math.max(1,13/s.length).toFixed(2)}em`:F;return B`<span class="number" style=${n}>${s}</span>
      <span class="target">/ ${a(t)}</span>
      <span class="unit" title=${i}>${i}</span>`}_renderFinished(){const e=this.hass,t=this._number("total"),i=this._number("target_to_date");if(void 0===t||void 0===i)return F;const a=t>=i?be(e,"finished_goal_reached"):be(e,"finished",{percent:$e(e,i?Math.floor(t/i*100):0)});return B`<div class="summary"><div class="finished">${a}</div></div>`}_renderSummary(){if(this._ended())return this._renderFinished();const e=this.hass,t=this._number("total"),i=this._number("target_to_date"),a=this._number("delta"),s=this._number("remaining"),n=this._challenge?.entities.today_target,r=n?e?.states[n]?.attributes:void 0,o=this._number("today_target"),l=Number(r?.daily_target),h=Number(r?.deficit),c=void 0!==o&&Number.isFinite(l)&&h>0&&o>l,d=[];this._show("show_target_vs_actual")&&void 0!==t&&void 0!==i&&d.push(B`<div class="target-vs-actual">
          ${be(e,"target_vs_actual",{total:$e(e,t),target:$e(e,i)})}${void 0===a?F:B` ·
                <span class="delta ${a<0?"behind":"ahead"}"
                  >${Ae(e,a)}</span
                >`}
        </div>`);const u=void 0===s?[]:this._remainingParts(s);return u.length&&d.push(B`<div class="remaining">
          ${u.map((e,t)=>B`${t?" · ":""}<span class="part">${e}</span>`)}
        </div>`),this._show("show_catch_up")&&c&&d.push(B`<div class="catch-up">
          ${"on"===this._state("goal_reached_today")?be(e,"caught_up"):be(e,"catch_up",{target:$e(e,l),deficit:$e(e,h)})}
        </div>`),d.length?B`<div class="summary">${d}</div>`:F}_remainingParts(e){const t=this.hass,i=this._number("days_left"),a=this._number("required_per_day"),s=$e(t,e),n=[];return this._show("show_remaining")&&(1===i?n.push(be(t,"left_to_goal_last_day",{remaining:s})):void 0!==i&&i>1?n.push(be(t,"left_in_days",{remaining:s,days:$e(t,i)})):n.push(be(t,"left_to_goal",{remaining:s}))),this._show("show_required_average")&&void 0!==i&&i>1&&void 0!==a&&n.push(be(t,"required_per_day",{per_day:$e(t,a)})),n}_renderButtons(e){if(!this._show("show_buttons")||this._ended()||e.today_from_source)return F;const t=t=>{const i=e.entities[t];return void 0!==i&&void 0!==this.hass?.states[i]},i=it(e.entities),a=i.filter(e=>t(`add_${e}`)),s=void 0===this._number("today_target");return B`<div class="buttons">
      ${t("subtract")&&i.length?B`<button
            class="subtract"
            ?disabled=${s}
            @click=${()=>this._press("subtract")}
          >
            −${i[0]}
          </button>`:F}
      ${a.map(e=>B`<button
            class="add"
            ?disabled=${s}
            @click=${()=>this._press(`add_${e}`)}
          >
            +${e}
          </button>`)}
    </div>`}_watchCelebrations(){const e=this._challenge;if(!e||!this.hass)return;const t=this._state("goal_reached_today"),i=e.entities.milestone,a=i?this.hass.states[i]:void 0,s=this._show("show_celebration");s&&"off"===this._lastGoal&&"on"===t&&this._celebrate(),s&&a&&void 0!==this._lastMilestone&&"unavailable"!==this._lastMilestone&&a.state!==this._lastMilestone&&!et.has(a.state)&&this._celebrate(this._milestoneMessage(a.attributes)),this._lastGoal=t,this._lastMilestone=a?.state}_milestoneMessage(e){const t=e.event_type,i=Number(e.value);if(!Number.isFinite(i))return;const a=this.hass?.states[this._challenge?.entities.today??""]?.attributes.unit_of_measurement??this._challenge?.unit??"",s={value:$e(this.hass,i),unit:a};switch(t){case"streak":return be(this.hass,"celebrate_streak",s);case"best_streak":return be(this.hass,"celebrate_best_streak",s);case"best_day":return be(this.hass,"celebrate_best_day",s);case"total":return be(this.hass,"celebrate_total",s);default:return}}_celebrate(e){const t=(this._celebration?.id??0)+1,i=e??this._celebration?.message,a=Array.from({length:24},(e,t)=>{const i=t/24*2*Math.PI+.4*Math.random(),a=70+60*Math.random();return{x:Math.round(Math.cos(i)*a),y:Math.round(Math.sin(i)*a),rotate:Math.round(720*Math.random()-360),delay:Math.round(150*Math.random()),color:Qe[t%Qe.length]}});this._celebration={id:t,message:i,pieces:a},clearTimeout(this._celebrationTimer),this._celebrationTimer=setTimeout(()=>{this._celebration?.id===t&&(this._celebration=void 0)},3e3)}_renderCelebration(){const e=this._celebration;return e?B`<div class="celebration" aria-live="polite">
      ${e.pieces.map(e=>B`<span
            class="confetti"
            style="--x: ${e.x}px; --y: ${e.y}px; --r: ${e.rotate}deg; --delay: ${e.delay}ms; background: ${e.color}"
          ></span>`)}
      ${e.message?B`<div class="celebration-message">${e.message}</div>`:F}
    </div>`:F}_renderStats(){if(!this._show("show_stats"))return F;const e=this.hass,t=(t,i="")=>{const a=this._number(t);return void 0===a?"–":`${$e(e,a)}${i}`},i=[[be(e,"stat_total"),t("total")],[be(e,"stat_average"),t("average")],[be(e,"stat_best_day"),t("best_day")],[be(e,"stat_best_streak"),t("best_streak")]];return B`<div class="stats">
      ${i.map(([e,t])=>B`<div class="stat">
            <span class="stat-value">${t}</span>
            <span class="stat-label">${e}</span>
          </div>`)}
    </div>`}_formatDate(e,t){return function(e,t,i){const[a,s,n]=t.split("-").map(Number),r=ye(e),o=`${r}|${JSON.stringify(i)}`;try{let e=xe.get(o);return e||(e=new Intl.DateTimeFormat(r,{...i,timeZone:"UTC"}),xe.set(o,e)),e.format(new Date(Date.UTC(a,s-1,n)))}catch{return t}}(this.hass,e,t)}_cellTitle(e){const t=this._formatDate(e.date,{dateStyle:"medium"});if(!e.inPeriod)return t;return`${t}: ${`${$e(this.hass,e.value)} / ${$e(this.hass,e.target)}`}${e.fulfilled?" ✓":e.rescuable?` · ${be(this.hass,"rescuable")}`:""}`}_renderHeatmap(){const e=this._history;if(!this._show("show_heatmap")||!e)return F;const t=[e,this._config?.heatmap_range,this._focusDate,this.hass?.locale?.language,this.hass?.locale?.number_format],i=this._heatmapCache;if(i&&i.key.every((e,i)=>e===t[i]))return i.template;const a=this._buildHeatmap(e);return this._heatmapCache={key:t,template:a},a}_buildHeatmap(e){const t=function(e,t){const i=Object.keys(e.targets).sort();if(0===i.length)return{weeks:[],months:[]};const a=pe(i[i.length-1]),s=pe(i[0]),n=_e[t],r=a-(a+3)%7-7*(n-1),o=new Set(e.rescuable??[]),l=[],h=[];for(let t=0;t<n;t++){const i=[];for(let n=0;n<7;n++){const l=r+7*t+n;if(l>a){i.push(null);continue}const c=me(l);(c.endsWith("-01")||0===t&&0===n)&&h.push({week:t,date:c});const d=l>=s&&c in e.targets,u=e.days[c]??0,_=e.targets[c]??0;i.push({date:c,inPeriod:d,value:u,target:_,fulfilled:d&&!0===e.fulfilled[c],rescuable:d&&o.has(c),last:l===a,ratio:_>0?Math.min(1,u/_):u>0?1:0})}l.push(i)}const c=Math.max(3,Math.round(n/8)),d=[];for(const e of[...h].reverse()){const t=d[0];(!t||t.week-e.week>=c)&&d.unshift(e)}return{weeks:l,months:d}}(e,this._config?.heatmap_range??"year");if(!t.weeks.length)return F;const i=13*t.weeks.length-3,a=t.weeks.flat().filter(e=>null!==e),s=a.find(e=>e.date===this._focusDate)?.date??a[a.length-1]?.date,n=t.weeks.flatMap((e,t)=>e.map((e,i)=>{if(!e)return F;const a=this._cellTitle(e),n=["cell",e.inPeriod?e.fulfilled?"fulfilled":0===e.value?"empty":"partial":"outside",e.rescuable?"rescuable":"",e.last?"last":""].join(" ");return L`<rect
          class=${n}
          x=${13*t}
          y=${13*i}
          width="10"
          height="10"
          rx="2"
          opacity=${function(e){return e.inPeriod&&0!==e.value?e.fulfilled?.45+.55*e.ratio:.2+.6*e.ratio:1}(e)}
          data-date=${e.date}
          role=${e.inPeriod?"button":"presentation"}
          tabindex=${e.date===s?0:-1}
          aria-label=${a}
          @click=${()=>this._openDay(e)}
        ><title>${a}</title></rect>`})),r=t.months.map(e=>B`<span class="month" style="left: ${13*e.week/i*100}%"
          >${this._formatDate(e.date,{month:"short"})}</span
        >`);return B`<div class="heatmap">
      <div class="heatmap-grid" style="max-width: ${22*t.weeks.length}px">
        <div class="months">${r}</div>
        <svg
          viewBox="0 0 ${i} ${88}"
          role="group"
          aria-label=${be(this.hass,"heatmap")}
          @keydown=${e=>this._heatmapKeyDown(e,a)}
        >
          ${n}
        </svg>
      </div>
    </div>`}_heatmapKeyDown(e,t){const i=e.target?.getAttribute?.("data-date"),a=t.find(e=>e.date===i);if(!a)return;if("Enter"===e.key||" "===e.key)return e.preventDefault(),void this._openDay(a);const s={ArrowLeft:-7,ArrowRight:7,ArrowUp:-1,ArrowDown:1,Home:-1/0,End:1/0};if(!(e.key in s))return;e.preventDefault();const n=s[e.key],r=Number.isFinite(n)?t.find(e=>e.date===function(e,t){return me(pe(e)+t)}(a.date,n)):n<0?t[0]:t[t.length-1];r&&(this._focusDate=r.date)}_openDay(e){e.inPeriod&&(this._focusDate=e.date,this._dialog={cell:e,value:String(e.value)})}_closeDay(){this._dialog=void 0}_dialogFromSource(e){return Boolean(this._challenge?.today_from_source&&e.last&&!this._ended())}async _saveDay(){const e=this._dialog,t=this._challenge;if(!e||e.saving||!t||!this.hass)return;const i=e.value.trim(),a=Number(i);if(""===i||!Number.isInteger(a)||a<0)return void(this._dialog={...e,error:be(this.hass,"invalid_value")});const s=this._history?.days[e.cell.date]??e.cell.value;if(a===s)return void this._closeDay();const n=i=>this.hass?.callWS({type:"daily_challenge/set_day",entry_id:t.entry_id,date:e.cell.date,value:i}),r={...e,saving:!0,error:void 0};this._dialog=r;try{await n(a)}catch(t){const i=Se(t);return void(this._dialog===r?this._dialog={...e,error:i}:this._notify({message:i}))}this._dialog===r&&this._closeDay(),this._notify({message:be(this.hass,"change",{name:t.name,change:`${this._formatDate(e.cell.date,{dateStyle:"medium"})}: ${$e(this.hass,a)}`}),duration:Ze,action:{text:be(this.hass,"undo"),action:()=>{Promise.resolve(n(s)).catch(e=>this._notify({message:Se(e)}))}}})}_dialogKeyDown(e){"Escape"===e.key?(e.preventDefault(),e.stopPropagation(),this._closeDay()):"Enter"===e.key&&e.target?.classList?.contains("day-input")&&(e.preventDefault(),e.stopPropagation(),this._saveDay())}_renderDialog(){const e=this._dialog;if(!e)return F;const t=this.hass,i=e.cell,a=this._dialogFromSource(i),s=i.fulfilled?be(t,"day_fulfilled"):i.rescuable?be(t,"rescuable"):be(t,"day_not_fulfilled");return B`<div class="backdrop" @click=${this._closeDay}>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-title"
        @click=${e=>e.stopPropagation()}
        @keydown=${this._dialogKeyDown}
      >
        <div id="day-title" class="dialog-title">
          ${this._formatDate(i.date,{dateStyle:"full"})}
        </div>
        <div class="dialog-info">
          ${be(t,"day_target",{target:$e(t,i.target)})} ·
          ${s}
        </div>
        <label class="dialog-field">
          <span>${be(t,"day_value")}</span>
          <input
            class="day-input"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            .value=${e.value}
            ?disabled=${a}
            @input=${t=>{this._dialog={...e,value:t.target.value,error:void 0}}}
          />
        </label>
        ${a?B`<div class="dialog-note">${be(t,"day_from_source")}</div>`:F}
        ${e.error?B`<div class="dialog-error">${e.error}</div>`:F}
        <div class="dialog-actions">
          <button class="cancel" @click=${this._closeDay}>
            ${be(t,"cancel")}
          </button>
          ${a?F:B`<button class="save" @click=${()=>this._saveDay()}>
                ${be(t,"save")}
              </button>`}
        </div>
      </div>
    </div>`}static styles=[de,n`
    ha-card {
      display: block;
      padding: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .name {
      flex: 1;
      min-width: 0;
      font-size: 1.2em;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .streak {
      color: var(--secondary-text-color);
      white-space: nowrap;
    }
    .streak .current {
      color: var(--primary-text-color);
      font-weight: 500;
    }
    .value-area {
      position: relative;
      width: 160px;
      height: 160px;
      margin: 16px auto;
    }
    .ring {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .ring circle {
      fill: none;
      stroke-width: 10;
    }
    .ring .track {
      stroke: var(--divider-color, #e0e0e0);
    }
    .ring .progress {
      stroke: var(--primary-color);
      stroke-linecap: round;
      transition: stroke-dashoffset 0.3s ease;
    }
    .ring .progress.reached {
      stroke: var(--success-color, #43a047);
    }
    .value,
    .value-input {
      position: absolute;
      inset: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      user-select: none;
      -webkit-user-select: none;
      cursor: pointer;
    }
    .value:focus-visible {
      outline: 2px solid var(--primary-color);
    }
    .number {
      font-size: 2.6em;
      font-weight: 500;
      line-height: 1;
    }
    .target,
    .unit {
      color: var(--secondary-text-color);
      font-size: 0.9em;
    }
    .unit {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .value-input {
      box-sizing: border-box;
      border: 2px solid var(--primary-color);
      background: var(--card-background-color, transparent);
      color: var(--primary-text-color);
      font: inherit;
      font-size: 2em;
      text-align: center;
      cursor: text;
    }
    .summary {
      margin-bottom: 16px;
      text-align: center;
      color: var(--secondary-text-color);
      line-height: 1.5;
    }
    .delta {
      font-weight: 500;
    }
    .remaining .part {
      white-space: nowrap;
    }
    .delta.ahead {
      color: var(--success-color, #43a047);
    }
    .delta.behind,
    .catch-up {
      color: var(--warning-color, #ffa600);
    }
    .buttons {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    button {
      min-width: 56px;
      min-height: 40px;
      padding: 0 12px;
      border: none;
      border-radius: 20px;
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      font: inherit;
      font-weight: 500;
      cursor: pointer;
    }
    button.subtract {
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--primary-text-color);
    }
    button:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .warning {
      color: var(--error-color);
    }
    ha-card {
      position: relative;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 4px;
      margin-top: 16px;
      text-align: center;
    }
    .stat {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .stat-value {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .stat-label {
      color: var(--secondary-text-color);
      font-size: 0.8em;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }
    .heatmap {
      margin-top: 16px;
      display: flex;
      justify-content: center;
    }
    .heatmap-grid {
      width: 100%;
    }
    .heatmap svg {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
    }
    .months {
      position: relative;
      overflow: hidden;
      height: 1.3em;
      font-size: 0.75em;
      color: var(--secondary-text-color);
    }
    .month {
      position: absolute;
      top: 0;
      white-space: nowrap;
    }
    .cell {
      cursor: pointer;
    }
    .cell:focus {
      outline: none;
    }

    .cell.outside {
      fill: var(--disabled-color, #bdbdbd);
      opacity: 0.25;
      cursor: default;
    }
    .cell.empty {
      fill: var(--divider-color, #e0e0e0);
    }
    .cell.partial {
      fill: var(--primary-color);
    }
    .cell.fulfilled {
      fill: var(--success-color, #43a047);
    }
    .cell.rescuable {
      stroke: var(--warning-color, #ffa600);
      stroke-width: 1.5;
      stroke-dasharray: 2 1.5;
    }
    .cell.last {
      stroke: var(--primary-text-color);
      stroke-width: 1.5;
    }
    /* After the outlines above, so the focus wins on today and yesterday too. */
    .heatmap .cell:focus-visible {
      stroke: var(--primary-color);
      stroke-width: 2.5;
      stroke-dasharray: none;
    }
    .celebration {
      position: absolute;
      inset: 0;
      z-index: 1;
      overflow: hidden;
      pointer-events: none;
      border-radius: var(--ha-card-border-radius, 12px);
    }
    .confetti {
      position: absolute;
      top: 120px;
      left: 50%;
      width: 8px;
      height: 12px;
      border-radius: 2px;
      opacity: 0;
      animation: dc-burst 1.4s ease-out var(--delay) forwards;
    }
    @keyframes dc-burst {
      0% {
        opacity: 1;
        transform: translate(-50%, -50%) rotate(0deg);
      }
      100% {
        opacity: 0;
        transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y) + 40px))
          rotate(var(--r));
      }
    }
    .celebration-message {
      position: absolute;
      top: 12px;
      left: 50%;
      max-width: calc(100% - 32px);
      padding: 6px 14px;
      border-radius: 16px;
      background: var(--success-color, #43a047);
      color: #fff;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transform: translateX(-50%);
      animation: dc-pop 3s ease forwards;
    }
    @keyframes dc-pop {
      0% {
        opacity: 0;
        transform: translate(-50%, -6px);
      }
      10%,
      85% {
        opacity: 1;
        transform: translate(-50%, 0);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, 0);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .confetti {
        display: none;
      }
      .celebration-message {
        animation: none;
      }
    }
    .backdrop {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      border-radius: var(--ha-card-border-radius, 12px);
      background: rgba(0, 0, 0, 0.4);
    }
    .dialog {
      width: 100%;
      max-width: 320px;
      padding: 16px;
      border-radius: 12px;
      background: var(--card-background-color, var(--ha-card-background, #fff));
      color: var(--primary-text-color);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }
    .dialog-title {
      font-size: 1.1em;
      font-weight: 500;
    }
    .dialog-info,
    .dialog-note {
      margin-top: 4px;
      color: var(--secondary-text-color);
    }
    .dialog-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 12px;
    }
    .day-input {
      font: inherit;
      font-size: 1.4em;
      padding: 6px 8px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
    }
    .dialog-error {
      margin-top: 8px;
      color: var(--error-color);
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
    .dialog-actions button {
      padding: 8px 16px;
      border: none;
      border-radius: 18px;
      font: inherit;
      font-weight: 500;
      cursor: pointer;
    }
    .dialog-actions .cancel {
      background: transparent;
      color: var(--primary-color);
    }
    .dialog-actions .save {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
  `]}customElements.get(Fe)||customElements.define(Fe,at);const st=window;st.customCards??=[],st.customCards.some(e=>e.type===Fe)||st.customCards.push({type:Fe,name:be(void 0,"card_name"),description:be(void 0,"card_description"),preview:!0,documentationURL:"https://github.com/Skylolerr/ha-daily-challenge"});export{Fe as CARD_TYPE,Je as CELEBRATION_MS,at as DailyChallengeCard,Ke as LONG_PRESS_MS,Ve as LOOKUP_RETRY_MS,Ze as UNDO_MS,tt as findStubEntity};
