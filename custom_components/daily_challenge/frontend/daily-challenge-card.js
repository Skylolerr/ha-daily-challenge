/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,e=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),i=new WeakMap;let n=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const s=this.t;if(e&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=i.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&i.set(s,t))}return t}toString(){return this.cssText}};const r=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,s,i)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[i+1],t[0]);return new n(i,t,s)},a=e?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:o,defineProperty:l,getOwnPropertyDescriptor:h,getOwnPropertyNames:c,getOwnPropertySymbols:d,getPrototypeOf:u}=Object,_=globalThis,p=_.trustedTypes,g=p?p.emptyScript:"",m=_.reactiveElementPolyfillSupport,y=(t,e)=>t,f={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},$=(t,e)=>!o(t,e),v={attribute:!0,type:String,converter:f,reflect:!1,useDefault:!1,hasChanged:$};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),_.litPropertyMetadata??=new WeakMap;let b=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=v){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,e);void 0!==i&&l(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){const{get:i,set:n}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:i,set(e){const r=i?.call(this);n?.call(this,e),this.requestUpdate(t,r,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??v}static _$Ei(){if(this.hasOwnProperty(y("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(y("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y("properties"))){const t=this.properties,e=[...c(t),...d(t)];for(const s of e)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,s]of e)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const s=this._$Eu(t,e);void 0!==s&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const s=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((s,i)=>{if(e)s.adoptedStyleSheets=i.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const e of i){const i=document.createElement("style"),n=t.litNonce;void 0!==n&&i.setAttribute("nonce",n),i.textContent=e.cssText,s.appendChild(i)}})(s,this.constructor.elementStyles),s}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(void 0!==i&&!0===s.reflect){const n=(void 0!==s.converter?.toAttribute?s.converter:f).toAttribute(e,s.type);this._$Em=t,null==n?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(t,e){const s=this.constructor,i=s._$Eh.get(t);if(void 0!==i&&this._$Em!==i){const t=s.getPropertyOptions(i),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:f;this._$Em=i;const r=n.fromAttribute(e,t.type);this[i]=r??this._$Ej?.get(i)??r,this._$Em=null}}requestUpdate(t,e,s,i=!1,n){if(void 0!==t){const r=this.constructor;if(!1===i&&(n=this[t]),s??=r.getPropertyOptions(t),!((s.hasChanged??$)(n,e)||s.useDefault&&s.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,s))))return;this.C(t,e,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:n},r){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==n||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),!0===i&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,s]of t){const{wrapped:t}=s,i=this[e];!0!==t||this._$AL.has(e)||void 0===i||this.C(e,void 0,s,i)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[y("elementProperties")]=new Map,b[y("finalized")]=new Map,m?.({ReactiveElement:b}),(_.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const A=globalThis,E=t=>t,w=A.trustedTypes,S=w?w.createPolicy("lit-html",{createHTML:t=>t}):void 0,C="$lit$",x=`lit$${Math.random().toFixed(9).slice(2)}$`,k="?"+x,P=`<${k}>`,T=document,U=()=>T.createComment(""),N=t=>null===t||"object"!=typeof t&&"function"!=typeof t,O=Array.isArray,H="[ \t\n\f\r]",D=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,M=/-->/g,R=/>/g,j=RegExp(`>|${H}(?:([^\\s"'>=/]+)(${H}*=${H}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),z=/'/g,I=/"/g,B=/^(?:script|style|textarea|title)$/i,L=t=>(e,...s)=>({_$litType$:t,strings:e,values:s}),q=L(1),W=L(2),V=Symbol.for("lit-noChange"),K=Symbol.for("lit-nothing"),F=new WeakMap,Z=T.createTreeWalker(T,129);function J(t,e){if(!O(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const G=(t,e)=>{const s=t.length-1,i=[];let n,r=2===e?"<svg>":3===e?"<math>":"",a=D;for(let e=0;e<s;e++){const s=t[e];let o,l,h=-1,c=0;for(;c<s.length&&(a.lastIndex=c,l=a.exec(s),null!==l);)c=a.lastIndex,a===D?"!--"===l[1]?a=M:void 0!==l[1]?a=R:void 0!==l[2]?(B.test(l[2])&&(n=RegExp("</"+l[2],"g")),a=j):void 0!==l[3]&&(a=j):a===j?">"===l[0]?(a=n??D,h=-1):void 0===l[1]?h=-2:(h=a.lastIndex-l[2].length,o=l[1],a=void 0===l[3]?j:'"'===l[3]?I:z):a===I||a===z?a=j:a===M||a===R?a=D:(a=j,n=void 0);const d=a===j&&t[e+1].startsWith("/>")?" ":"";r+=a===D?s+P:h>=0?(i.push(o),s.slice(0,h)+C+s.slice(h)+x+d):s+x+(-2===h?e:d)}return[J(t,r+(t[s]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),i]};class Q{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let n=0,r=0;const a=t.length-1,o=this.parts,[l,h]=G(t,e);if(this.el=Q.createElement(l,s),Z.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(i=Z.nextNode())&&o.length<a;){if(1===i.nodeType){if(i.hasAttributes())for(const t of i.getAttributeNames())if(t.endsWith(C)){const e=h[r++],s=i.getAttribute(t).split(x),a=/([.?@])?(.*)/.exec(e);o.push({type:1,index:n,name:a[2],strings:s,ctor:"."===a[1]?st:"?"===a[1]?it:"@"===a[1]?nt:et}),i.removeAttribute(t)}else t.startsWith(x)&&(o.push({type:6,index:n}),i.removeAttribute(t));if(B.test(i.tagName)){const t=i.textContent.split(x),e=t.length-1;if(e>0){i.textContent=w?w.emptyScript:"";for(let s=0;s<e;s++)i.append(t[s],U()),Z.nextNode(),o.push({type:2,index:++n});i.append(t[e],U())}}}else if(8===i.nodeType)if(i.data===k)o.push({type:2,index:n});else{let t=-1;for(;-1!==(t=i.data.indexOf(x,t+1));)o.push({type:7,index:n}),t+=x.length-1}n++}}static createElement(t,e){const s=T.createElement("template");return s.innerHTML=t,s}}function X(t,e,s=t,i){if(e===V)return e;let n=void 0!==i?s._$Co?.[i]:s._$Cl;const r=N(e)?void 0:e._$litDirective$;return n?.constructor!==r&&(n?._$AO?.(!1),void 0===r?n=void 0:(n=new r(t),n._$AT(t,s,i)),void 0!==i?(s._$Co??=[])[i]=n:s._$Cl=n),void 0!==n&&(e=X(t,n._$AS(t,e.values),n,i)),e}class Y{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??T).importNode(e,!0);Z.currentNode=i;let n=Z.nextNode(),r=0,a=0,o=s[0];for(;void 0!==o;){if(r===o.index){let e;2===o.type?e=new tt(n,n.nextSibling,this,t):1===o.type?e=new o.ctor(n,o.name,o.strings,this,t):6===o.type&&(e=new rt(n,this,t)),this._$AV.push(e),o=s[++a]}r!==o?.index&&(n=Z.nextNode(),r++)}return Z.currentNode=T,i}p(t){let e=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class tt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=K,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=X(this,t,e),N(t)?t===K||null==t||""===t?(this._$AH!==K&&this._$AR(),this._$AH=K):t!==this._$AH&&t!==V&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>O(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==K&&N(this._$AH)?this._$AA.nextSibling.data=t:this.T(T.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,i="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=Q.createElement(J(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{const t=new Y(i,this),s=t.u(this.options);t.p(e),this.T(s),this._$AH=t}}_$AC(t){let e=F.get(t.strings);return void 0===e&&F.set(t.strings,e=new Q(t)),e}k(t){O(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,i=0;for(const n of t)i===e.length?e.push(s=new tt(this.O(U()),this.O(U()),this,this.options)):s=e[i],s._$AI(n),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=E(t).nextSibling;E(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class et{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,n){this.type=1,this._$AH=K,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=n,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=K}_$AI(t,e=this,s,i){const n=this.strings;let r=!1;if(void 0===n)t=X(this,t,e,0),r=!N(t)||t!==this._$AH&&t!==V,r&&(this._$AH=t);else{const i=t;let a,o;for(t=n[0],a=0;a<n.length-1;a++)o=X(this,i[s+a],e,a),o===V&&(o=this._$AH[a]),r||=!N(o)||o!==this._$AH[a],o===K?t=K:t!==K&&(t+=(o??"")+n[a+1]),this._$AH[a]=o}r&&!i&&this.j(t)}j(t){t===K?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class st extends et{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===K?void 0:t}}class it extends et{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==K)}}class nt extends et{constructor(t,e,s,i,n){super(t,e,s,i,n),this.type=5}_$AI(t,e=this){if((t=X(this,t,e,0)??K)===V)return;const s=this._$AH,i=t===K&&s!==K||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,n=t!==K&&(s===K||i);i&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class rt{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){X(this,t)}}const at=A.litHtmlPolyfillSupport;at?.(Q,tt),(A.litHtmlVersions??=[]).push("3.3.3");const ot=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class lt extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,s)=>{const i=s?.renderBefore??e;let n=i._$litPart$;if(void 0===n){const t=s?.renderBefore??null;i._$litPart$=n=new tt(e.insertBefore(U(),t),t,void 0,s??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}}lt._$litElement$=!0,lt.finalized=!0,ot.litElementHydrateSupport?.({LitElement:lt});const ht=ot.litElementPolyfillSupport;ht?.({LitElement:lt}),(ot.litElementVersions??=[]).push("4.2.2");const ct={best:"Best",card_description:"Track today's progress of a daily challenge.",card_name:"Daily Challenge",catch_up:"Today: {target} + {deficit} deficit",challenge:"Challenge",current_streak:"Current streak",edit_value:"Enter today's value",entity_not_found:"Entity not found: {entity}",left_to_goal:"{remaining} left to goal",missing_entity:"Please define an entity of a Daily Challenge.",no_challenges:"No Daily Challenge set up yet.",not_a_challenge:"{entity} does not belong to a Daily Challenge.",target_vs_actual:"Actual {total} / Target {target}"},dt={de:{best:"Rekord",card_description:"Zeigt den heutigen Fortschritt einer täglichen Challenge.",card_name:"Daily Challenge",catch_up:"Heute: {target} + {deficit} Rückstand",challenge:"Challenge",current_streak:"Aktueller Streak",edit_value:"Heutigen Wert eingeben",entity_not_found:"Entität nicht gefunden: {entity}",left_to_goal:"Noch {remaining} bis zum Ziel",missing_entity:"Bitte gib eine Entität einer Daily Challenge an.",no_challenges:"Noch keine Daily Challenge eingerichtet.",not_a_challenge:"{entity} gehört zu keiner Daily Challenge.",target_vs_actual:"Ist {total} / Soll {target}"},en:ct,fr:{best:"Record",card_description:"Affiche la progression du jour d'un défi quotidien.",card_name:"Daily Challenge",catch_up:"Aujourd'hui : {target} + {deficit} de retard",challenge:"Défi",current_streak:"Série actuelle",edit_value:"Saisir la valeur du jour",entity_not_found:"Entité introuvable : {entity}",left_to_goal:"Encore {remaining} jusqu'à l'objectif",missing_entity:"Veuillez indiquer une entité d'un Daily Challenge.",no_challenges:"Aucun Daily Challenge configuré pour l'instant.",not_a_challenge:"{entity} n'appartient à aucun Daily Challenge.",target_vs_actual:"Réel {total} / Objectif {target}"},it:{best:"Record",card_description:"Mostra i progressi di oggi di una sfida giornaliera.",card_name:"Daily Challenge",catch_up:"Oggi: {target} + {deficit} di ritardo",challenge:"Sfida",current_streak:"Serie attuale",edit_value:"Inserisci il valore di oggi",entity_not_found:"Entità non trovata: {entity}",left_to_goal:"Ancora {remaining} all'obiettivo",missing_entity:"Indica un'entità di una Daily Challenge.",no_challenges:"Nessuna Daily Challenge configurata.",not_a_challenge:"{entity} non appartiene a nessuna Daily Challenge.",target_vs_actual:"Effettivo {total} / Obiettivo {target}"}};function ut(t){return t?.locale.language||("undefined"==typeof document?"":document.documentElement.lang)||"en"}function _t(t,e,s={}){return(i=ut(t),dt[i]??dt[i.split("-")[0]]??ct)[e].replace(/\{(\w+)\}/g,(t,e)=>e in s?s[e]:t);var i}const pt={comma_decimal:["en-US","en"],decimal_comma:["de","es","it"],quote_decimal:["de-CH"],space_comma:["fr","sv","cs"],system:void 0};function gt(t,e){const s=t?.locale.number_format??"language",i=s in pt?pt[s]:[ut(t)];try{return new Intl.NumberFormat(i,{useGrouping:"none"!==s}).format(e)}catch{return String(e)}}const mt="daily-challenge-card-editor";class yt extends lt{static properties={hass:{attribute:!1},_config:{state:!0},_challenges:{state:!0}};_loading=!1;setConfig(t){this._config=t}willUpdate(t){t.has("hass")&&this.hass&&!this._loading&&!this._challenges&&(this._loading=!0,this._load())}async _load(){try{const t=await(this.hass?.callWS({type:"daily_challenge/list"}));this._challenges=t?.challenges??[]}catch{this._challenges=[]}finally{this._loading=!1}}_selected(){const t=this._config?.entity;return this._challenges?.find(e=>Object.values(e.entities).includes(t??""))?.entry_id}_schema(t){return[{name:"challenge",required:!0,selector:{select:{mode:"dropdown",options:t.map(t=>({value:t.entry_id,label:t.name}))}}}]}_valueChanged(t){t.stopPropagation();const e=this._challenges?.find(e=>e.entry_id===t.detail.value.challenge),s=e?.entities.today;this._config&&s&&s!==this._config.entity&&(this._config={...this._config,entity:s},this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:!0,composed:!0})))}render(){return this.hass&&this._config&&this._challenges?0===this._challenges.length?q`<p>${_t(this.hass,"no_challenges")}</p>`:q`<ha-form
      .hass=${this.hass}
      .data=${{challenge:this._selected()}}
      .schema=${this._schema(this._challenges)}
      .computeLabel=${t=>_t(this.hass,t.name)}
      @value-changed=${this._valueChanged}
    ></ha-form>`:K}}customElements.get(mt)||customElements.define(mt,yt);const ft="daily-challenge-card",$t=500,vt=2*Math.PI*52,bt=Symbol("not loaded"),At=new Set(["unknown","unavailable"]);function Et(t){const e=Object.values(t?.entities??{}).find(t=>"daily_challenge"===t.platform&&"today"===t.translation_key);return e?.entity_id??""}class wt extends lt{static properties={hass:{attribute:!1},_config:{state:!0},_challenge:{state:!0},_editing:{state:!0},_history:{state:!0}};static getConfigElement(){return document.createElement(mt)}static getStubConfig(t){return{type:`custom:${ft}`,entity:Et(t)}}_entitiesSeen=bt;_pressTimer;_committing=!1;_historyTotal;constructor(){super(),this._editing=!1}setConfig(t){if(!t?.entity)throw new Error(_t(this.hass,"missing_entity"));t.entity!==this._config?.entity&&(this._challenge=void 0,this._history=void 0,this._historyTotal=void 0,this._entitiesSeen=bt),this._config=t}getCardSize(){return 4}willUpdate(t){t.has("hass")&&this.hass&&this.hass.entities!==this._entitiesSeen&&(this._entitiesSeen=this.hass.entities,this._loadChallenge());const e=this._state("total");this._challenge&&void 0!==e&&e!==this._historyTotal&&(this._historyTotal=e,this._loadHistory(this._challenge.entry_id))}get history(){return this._history}async _loadHistory(t){try{this._history=await(this.hass?.callWS({type:"daily_challenge/history",entry_id:t}))}catch{}}updated(t){if(t.has("_editing")&&this._editing){const t=this.renderRoot.querySelector("input");t?.focus(),t?.select()}}async _loadChallenge(){const t=this._config?.entity;if(this.hass&&t)try{const e=await this.hass.callWS({type:"daily_challenge/list"});this._challenge=e.challenges.find(e=>Object.values(e.entities).includes(t))??null}catch{this._challenge=null}}_state(t){const e=this._challenge?.entities[t];return e?this.hass?.states[e]?.state:void 0}_number(t){const e=this._state(t);if(void 0===e||At.has(e))return;const s=Number(e);return Number.isFinite(s)?s:void 0}async _call(t,e,s){try{await(this.hass?.callService(t,e,s))}catch(t){this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:t instanceof Error?t.message:String(t)},bubbles:!0,composed:!0}))}}_press(t){const e=this._challenge?.entities[t];e&&this._call("button","press",{entity_id:e})}_pointerDown(){this._clearPress(),this._pressTimer=setTimeout(()=>this._startEdit(),500)}_clearPress(){clearTimeout(this._pressTimer),this._pressTimer=void 0}_valueKeyDown(t){"Enter"!==t.key&&" "!==t.key||(t.preventDefault(),this._startEdit())}_startEdit(){this._clearPress(),void 0!==this._number("today")&&(this._committing=!1,this._editing=!0)}_inputKeyDown(t){"Enter"===t.key?this._commit(t.target):"Escape"===t.key&&(this._committing=!0,this._editing=!1)}async _commit(t){if(this._committing)return;this._committing=!0,this._editing=!1;const e=Number(t.value),s=this._challenge?.entities.today;s&&""!==t.value.trim()&&Number.isInteger(e)&&e>=0&&e!==this._number("today")&&await this._call("number","set_value",{entity_id:s,value:e})}render(){if(!this._config||!this.hass)return K;const t=this._config.entity;return this.hass.states[t]?void 0===this._challenge?q`<ha-card></ha-card>`:null===this._challenge?this._warning(_t(this.hass,"not_a_challenge",{entity:t})):q`<ha-card>
      ${this._renderHeader(this._challenge)} ${this._renderValue(this._challenge)}
      ${this._renderSummary()} ${this._renderButtons(this._challenge)}
    </ha-card>`:this._warning(_t(this.hass,"entity_not_found",{entity:t}))}_warning(t){return q`<ha-card><div class="warning">${t}</div></ha-card>`}_renderHeader(t){const e=this._state("current_streak")??"–",s=this._state("best_streak")??"–";return q`<div class="header">
      <ha-icon .icon=${t.icon}></ha-icon>
      <span class="name">${t.name}</span>
      <span class="streak" title=${_t(this.hass,"current_streak")}>
        🔥 <span class="current">${e}</span>
        <span class="best">· ${_t(this.hass,"best")} ${s}</span>
      </span>
    </div>`}_renderValue(t){const e=this._number("today"),s=this._number("today_target"),i="on"===this._state("goal_reached_today"),n=i?1:void 0!==e&&s?Math.min(1,e/s):0,r=this.hass?.states[t.entities.today]?.attributes.unit_of_measurement??t.unit;return q`<div class="value-area">
      <svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
        ${W`<circle class="track" cx="60" cy="60" r=${52}></circle>
          <circle
            class="progress ${i?"reached":""}"
            cx="60"
            cy="60"
            r=${52}
            stroke-dasharray=${vt}
            stroke-dashoffset=${vt*(1-n)}
            transform="rotate(-90 60 60)"
          ></circle>`}
      </svg>
      ${this._editing?q`<input
            class="value-input"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            aria-label=${_t(this.hass,"edit_value")}
            .value=${String(e??0)}
            @keydown=${this._inputKeyDown}
            @blur=${t=>this._commit(t.target)}
          />`:q`<div
            class="value"
            role="button"
            tabindex="0"
            title=${_t(this.hass,"edit_value")}
            @pointerdown=${this._pointerDown}
            @pointerup=${this._clearPress}
            @pointerleave=${this._clearPress}
            @pointercancel=${this._clearPress}
            @contextmenu=${t=>t.preventDefault()}
            @keydown=${this._valueKeyDown}
          >
            <span class="number"
              >${void 0===e?"–":gt(this.hass,e)}</span
            >
            <span class="target"
              >/ ${void 0===s?"–":gt(this.hass,s)}</span
            >
            <span class="unit">${r}</span>
          </div>`}
    </div>`}_renderSummary(){const t=this.hass,e=this._number("total"),s=this._number("target_to_date"),i=this._number("delta"),n=this._number("remaining"),r=this._challenge?.entities.today_target,a=r?t?.states[r]?.attributes:void 0,o=this._number("today_target"),l=Number(a?.daily_target),h=Number(a?.deficit),c=void 0!==o&&Number.isFinite(l)&&h>0&&o>l;return q`<div class="summary">
      ${void 0!==e&&void 0!==s?q`<div class="target-vs-actual">
            ${_t(t,"target_vs_actual",{total:gt(t,e),target:gt(t,s)})}${void 0===i?K:q` ·
                  <span class="delta ${i<0?"behind":"ahead"}"
                    >${function(t,e){return 0===e?"±0":`${e>0?"+":"−"}${gt(t,Math.abs(e))}`}(t,i)}</span
                  >`}
          </div>`:K}
      ${void 0===n?K:q`<div class="remaining">
            ${_t(t,"left_to_goal",{remaining:gt(t,n)})}
          </div>`}
      ${c?q`<div class="catch-up">
            ${_t(t,"catch_up",{target:gt(t,l),deficit:gt(t,h)})}
          </div>`:K}
    </div>`}_renderButtons(t){const e=(s=t.entities,Object.keys(s).filter(t=>/^add_\d+$/.test(t)).map(t=>Number(t.slice(4))).sort((t,e)=>t-e));var s;const i=void 0===this._number("today_target");return q`<div class="buttons">
      ${t.entities.subtract&&e.length?q`<button
            class="subtract"
            ?disabled=${i}
            @click=${()=>this._press("subtract")}
          >
            −${e[0]}
          </button>`:K}
      ${e.map(t=>q`<button
            class="add"
            ?disabled=${i}
            @click=${()=>this._press(`add_${t}`)}
          >
            +${t}
          </button>`)}
    </div>`}static styles=r`
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
  `}customElements.get(ft)||customElements.define(ft,wt);const St=window;St.customCards??=[],St.customCards.some(t=>t.type===ft)||St.customCards.push({type:ft,name:_t(void 0,"card_name"),description:_t(void 0,"card_description"),preview:!0,documentationURL:"https://github.com/Skylolerr/ha-daily-challenge"});export{ft as CARD_TYPE,wt as DailyChallengeCard,$t as LONG_PRESS_MS,Et as findStubEntity};
