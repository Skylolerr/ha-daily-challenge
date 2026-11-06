/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,e=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),s=new WeakMap;let a=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const i=this.t;if(e&&void 0===t){const e=void 0!==i&&1===i.length;e&&(t=s.get(i)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&s.set(i,t))}return t}toString(){return this.cssText}};const n=(t,...e)=>{const s=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new a(s,t,i)},r=e?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new a("string"==typeof t?t:t+"",void 0,i))(e)})(t):t,{is:o,defineProperty:l,getOwnPropertyDescriptor:h,getOwnPropertyNames:c,getOwnPropertySymbols:d,getPrototypeOf:u}=Object,_=globalThis,g=_.trustedTypes,p=g?g.emptyScript:"",m=_.reactiveElementPolyfillSupport,f=(t,e)=>t,v={toAttribute(t,e){switch(e){case Boolean:t=t?p:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!o(t,e),b={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:y};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),_.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&l(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:a}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const n=s?.call(this);a?.call(this,e),this.requestUpdate(t,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const t=this.properties,e=[...c(t),...d(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(r(t))}else void 0!==t&&e.push(r(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((i,s)=>{if(e)i.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const e of s){const s=document.createElement("style"),a=t.litNonce;void 0!==a&&s.setAttribute("nonce",a),s.textContent=e.cssText,i.appendChild(s)}})(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const a=(void 0!==i.converter?.toAttribute?i.converter:v).toAttribute(e,i.type);this._$Em=t,null==a?this.removeAttribute(s):this.setAttribute(s,a),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),a="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:v;this._$Em=s;const n=a.fromAttribute(e,t.type);this[s]=n??this._$Ej?.get(s)??n,this._$Em=null}}requestUpdate(t,e,i,s=!1,a){if(void 0!==t){const n=this.constructor;if(!1===s&&(a=this[t]),i??=n.getPropertyOptions(t),!((i.hasChanged??y)(a,e)||i.useDefault&&i.reflect&&a===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:a},n){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),!0!==a||void 0!==n)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[f("elementProperties")]=new Map,$[f("finalized")]=new Map,m?.({ReactiveElement:$}),(_.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w=globalThis,x=t=>t,A=w.trustedTypes,S=A?A.createPolicy("lit-html",{createHTML:t=>t}):void 0,k="$lit$",E=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+E,D=`<${C}>`,P=document,T=()=>P.createComment(""),N=t=>null===t||"object"!=typeof t&&"function"!=typeof t,M=Array.isArray,U="[ \t\n\f\r]",O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,j=/>/g,H=RegExp(`>|${U}(?:([^\\s"'>=/]+)(${U}*=${U}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),z=/'/g,I=/"/g,q=/^(?:script|style|textarea|title)$/i,B=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),L=B(1),V=B(2),W=Symbol.for("lit-noChange"),F=Symbol.for("lit-nothing"),K=new WeakMap,Z=P.createTreeWalker(P,129);function J(t,e){if(!M(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const G=(t,e)=>{const i=t.length-1,s=[];let a,n=2===e?"<svg>":3===e?"<math>":"",r=O;for(let e=0;e<i;e++){const i=t[e];let o,l,h=-1,c=0;for(;c<i.length&&(r.lastIndex=c,l=r.exec(i),null!==l);)c=r.lastIndex,r===O?"!--"===l[1]?r=R:void 0!==l[1]?r=j:void 0!==l[2]?(q.test(l[2])&&(a=RegExp("</"+l[2],"g")),r=H):void 0!==l[3]&&(r=H):r===H?">"===l[0]?(r=a??O,h=-1):void 0===l[1]?h=-2:(h=r.lastIndex-l[2].length,o=l[1],r=void 0===l[3]?H:'"'===l[3]?I:z):r===I||r===z?r=H:r===R||r===j?r=O:(r=H,a=void 0);const d=r===H&&t[e+1].startsWith("/>")?" ":"";n+=r===O?i+D:h>=0?(s.push(o),i.slice(0,h)+k+i.slice(h)+E+d):i+E+(-2===h?e:d)}return[J(t,n+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Q{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let a=0,n=0;const r=t.length-1,o=this.parts,[l,h]=G(t,e);if(this.el=Q.createElement(l,i),Z.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=Z.nextNode())&&o.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(k)){const e=h[n++],i=s.getAttribute(t).split(E),r=/([.?@])?(.*)/.exec(e);o.push({type:1,index:a,name:r[2],strings:i,ctor:"."===r[1]?it:"?"===r[1]?st:"@"===r[1]?at:et}),s.removeAttribute(t)}else t.startsWith(E)&&(o.push({type:6,index:a}),s.removeAttribute(t));if(q.test(s.tagName)){const t=s.textContent.split(E),e=t.length-1;if(e>0){s.textContent=A?A.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],T()),Z.nextNode(),o.push({type:2,index:++a});s.append(t[e],T())}}}else if(8===s.nodeType)if(s.data===C)o.push({type:2,index:a});else{let t=-1;for(;-1!==(t=s.data.indexOf(E,t+1));)o.push({type:7,index:a}),t+=E.length-1}a++}}static createElement(t,e){const i=P.createElement("template");return i.innerHTML=t,i}}function X(t,e,i=t,s){if(e===W)return e;let a=void 0!==s?i._$Co?.[s]:i._$Cl;const n=N(e)?void 0:e._$litDirective$;return a?.constructor!==n&&(a?._$AO?.(!1),void 0===n?a=void 0:(a=new n(t),a._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=a:i._$Cl=a),void 0!==a&&(e=X(t,a._$AS(t,e.values),a,s)),e}class Y{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??P).importNode(e,!0);Z.currentNode=s;let a=Z.nextNode(),n=0,r=0,o=i[0];for(;void 0!==o;){if(n===o.index){let e;2===o.type?e=new tt(a,a.nextSibling,this,t):1===o.type?e=new o.ctor(a,o.name,o.strings,this,t):6===o.type&&(e=new nt(a,this,t)),this._$AV.push(e),o=i[++r]}n!==o?.index&&(a=Z.nextNode(),n++)}return Z.currentNode=P,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class tt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=F,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=X(this,t,e),N(t)?t===F||null==t||""===t?(this._$AH!==F&&this._$AR(),this._$AH=F):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>M(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==F&&N(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Q.createElement(J(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Y(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=K.get(t.strings);return void 0===e&&K.set(t.strings,e=new Q(t)),e}k(t){M(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const a of t)s===e.length?e.push(i=new tt(this.O(T()),this.O(T()),this,this.options)):i=e[s],i._$AI(a),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=x(t).nextSibling;x(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class et{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,a){this.type=1,this._$AH=F,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=a,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=F}_$AI(t,e=this,i,s){const a=this.strings;let n=!1;if(void 0===a)t=X(this,t,e,0),n=!N(t)||t!==this._$AH&&t!==W,n&&(this._$AH=t);else{const s=t;let r,o;for(t=a[0],r=0;r<a.length-1;r++)o=X(this,s[i+r],e,r),o===W&&(o=this._$AH[r]),n||=!N(o)||o!==this._$AH[r],o===F?t=F:t!==F&&(t+=(o??"")+a[r+1]),this._$AH[r]=o}n&&!s&&this.j(t)}j(t){t===F?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class it extends et{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===F?void 0:t}}class st extends et{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==F)}}class at extends et{constructor(t,e,i,s,a){super(t,e,i,s,a),this.type=5}_$AI(t,e=this){if((t=X(this,t,e,0)??F)===W)return;const i=this._$AH,s=t===F&&i!==F||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,a=t!==F&&(i===F||s);s&&this.element.removeEventListener(this.name,this,i),a&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class nt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){X(this,t)}}const rt=w.litHtmlPolyfillSupport;rt?.(Q,tt),(w.litHtmlVersions??=[]).push("3.3.3");const ot=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class lt extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let a=s._$litPart$;if(void 0===a){const t=i?.renderBefore??null;s._$litPart$=a=new tt(e.insertBefore(T(),t),t,void 0,i??{})}return a._$AI(t),a})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}lt._$litElement$=!0,lt.finalized=!0,ot.litElementHydrateSupport?.({LitElement:lt});const ht=ot.litElementPolyfillSupport;ht?.({LitElement:lt}),(ot.litElementVersions??=[]).push("4.2.2");const ct=["year","6months","3months"],dt={year:53,"6months":26,"3months":13},ut=864e5;function _t(t){const[e,i,s]=t.split("-").map(Number);return Math.round(Date.UTC(e,i-1,s)/ut)}function gt(t){return new Date(t*ut).toISOString().slice(0,10)}const pt={add_amount:"Add {amount}",best:"Best",cancel:"Cancel",card_description:"Track today's progress of a daily challenge.",card_name:"Daily Challenge",catch_up:"Today: {target} + {deficit} deficit",caught_up:"Deficit made up ✓",challenge:"Challenge",change:"{name}: {change}",current_streak:"Current streak",day_from_source:"Today's value comes from the source sensor.",day_fulfilled:"fulfilled ✓",day_not_fulfilled:"not fulfilled",day_target:"Target {target}",day_value:"Value",edit_value:"Enter today's value",entities:"Challenges (empty: all)",entity_not_found:"Entity not found: {entity}",finished:"Challenge finished · {percent}%",finished_goal_reached:"Challenge finished · goal reached ✓",heatmap:"Daily values as a calendar",heatmap_range:"Calendar range",invalid_entities:"entities must be a list of entities.",invalid_value:"Enter a whole number from 0.",left_in_days:"{remaining} left in {days} days",left_to_goal:"{remaining} left to goal",left_to_goal_last_day:"{remaining} left on the last day",missing_entity:"Please define an entity of a Daily Challenge.",no_challenges:"No Daily Challenge set up yet.",not_a_challenge:"{entity} does not belong to a Daily Challenge.",overview_description:"All challenges at a glance.",overview_ended:"Finished",overview_name:"Daily Challenge overview",range_3months:"3 months",range_6months:"6 months",range_year:"1 year",required_per_day:"Ø {per_day}/day",rescuable:"can still be made up today",save:"Save",show_buttons:"Show buttons",show_catch_up:"Show catch-up deficit",show_heatmap:"Show calendar (heatmap)",show_remaining:"Show what is left until the end goal",show_required_average:"Show required average per day",show_stats:"Show statistics",show_streak:"Show streak",show_target_vs_actual:"Show actual vs. target",stat_average:"Ø per day",stat_best_day:"Best day",stat_best_streak:"Best streak",stat_total:"Total",target_vs_actual:"Actual {total} / Target {target}",title:"Title",undo:"Undo"},mt={de:{add_amount:"{amount} hinzufügen",best:"Rekord",cancel:"Abbrechen",card_description:"Zeigt den heutigen Fortschritt einer täglichen Challenge.",card_name:"Daily Challenge",catch_up:"Heute: {target} + {deficit} Rückstand",caught_up:"Rückstand aufgeholt ✓",challenge:"Challenge",change:"{name}: {change}",current_streak:"Aktueller Streak",day_from_source:"Der heutige Wert kommt vom Quell-Sensor.",day_fulfilled:"erfüllt ✓",day_not_fulfilled:"nicht erfüllt",day_target:"Ziel {target}",day_value:"Wert",edit_value:"Heutigen Wert eingeben",entities:"Challenges (leer: alle)",entity_not_found:"Entität nicht gefunden: {entity}",finished:"Challenge abgeschlossen · {percent} %",finished_goal_reached:"Challenge abgeschlossen · Ziel erreicht ✓",heatmap:"Tageswerte als Kalender",heatmap_range:"Zeitraum des Kalenders",invalid_entities:"entities muss eine Liste von Entitäten sein.",invalid_value:"Gib eine ganze Zahl ab 0 ein.",left_in_days:"Noch {remaining} in {days} Tagen",left_to_goal:"Noch {remaining} bis zum Ziel",left_to_goal_last_day:"Noch {remaining} am letzten Tag",missing_entity:"Bitte gib eine Entität einer Daily Challenge an.",no_challenges:"Noch keine Daily Challenge eingerichtet.",not_a_challenge:"{entity} gehört zu keiner Daily Challenge.",overview_description:"Alle Challenges auf einen Blick.",overview_ended:"Beendet",overview_name:"Daily Challenge Übersicht",range_3months:"3 Monate",range_6months:"6 Monate",range_year:"1 Jahr",required_per_day:"Ø {per_day}/Tag",rescuable:"heute noch aufholbar",save:"Speichern",show_buttons:"Buttons anzeigen",show_catch_up:"Rückstand beim Aufholen anzeigen",show_heatmap:"Kalender (Heatmap) anzeigen",show_remaining:"Rest bis zum Ziel anzeigen",show_required_average:"Nötigen Schnitt pro Tag anzeigen",show_stats:"Statistik anzeigen",show_streak:"Streak anzeigen",show_target_vs_actual:"Ist / Soll anzeigen",stat_average:"Ø pro Tag",stat_best_day:"Bester Tag",stat_best_streak:"Bester Streak",stat_total:"Total",target_vs_actual:"Ist {total} / Soll {target}",title:"Titel",undo:"Rückgängig"},en:pt,fr:{add_amount:"Ajouter {amount}",best:"Record",cancel:"Annuler",card_description:"Affiche la progression du jour d'un défi quotidien.",card_name:"Daily Challenge",catch_up:"Aujourd'hui : {target} + {deficit} de retard",caught_up:"Retard rattrapé ✓",challenge:"Défi",change:"{name} : {change}",current_streak:"Série actuelle",day_from_source:"La valeur du jour provient du capteur source.",day_fulfilled:"atteint ✓",day_not_fulfilled:"non atteint",day_target:"Objectif {target}",day_value:"Valeur",edit_value:"Saisir la valeur du jour",entities:"Défis (vide : tous)",entity_not_found:"Entité introuvable : {entity}",finished:"Challenge terminé · {percent} %",finished_goal_reached:"Challenge terminé · objectif atteint ✓",heatmap:"Valeurs quotidiennes en calendrier",heatmap_range:"Période du calendrier",invalid_entities:"entities doit être une liste d'entités.",invalid_value:"Saisis un nombre entier à partir de 0.",left_in_days:"Encore {remaining} en {days} jours",left_to_goal:"Encore {remaining} jusqu'à l'objectif",left_to_goal_last_day:"Encore {remaining} le dernier jour",missing_entity:"Veuillez indiquer une entité d'un Daily Challenge.",no_challenges:"Aucun Daily Challenge configuré pour l'instant.",not_a_challenge:"{entity} n'appartient à aucun Daily Challenge.",overview_description:"Tous les défis en un coup d'œil.",overview_ended:"Terminé",overview_name:"Daily Challenge – aperçu",range_3months:"3 mois",range_6months:"6 mois",range_year:"1 an",required_per_day:"Ø {per_day}/jour",rescuable:"encore rattrapable aujourd'hui",save:"Enregistrer",show_buttons:"Afficher les boutons",show_catch_up:"Afficher le retard à rattraper",show_heatmap:"Afficher le calendrier (heatmap)",show_remaining:"Afficher le reste jusqu'à l'objectif",show_required_average:"Afficher la moyenne nécessaire par jour",show_stats:"Afficher les statistiques",show_streak:"Afficher la série",show_target_vs_actual:"Afficher réel / objectif",stat_average:"Ø par jour",stat_best_day:"Meilleur jour",stat_best_streak:"Meilleure série",stat_total:"Total",target_vs_actual:"Réel {total} / Objectif {target}",title:"Titre",undo:"Annuler"},it:{add_amount:"Aggiungi {amount}",best:"Record",cancel:"Annulla",card_description:"Mostra i progressi di oggi di una sfida giornaliera.",card_name:"Daily Challenge",catch_up:"Oggi: {target} + {deficit} di ritardo",caught_up:"Ritardo recuperato ✓",challenge:"Sfida",change:"{name}: {change}",current_streak:"Serie attuale",day_from_source:"Il valore di oggi proviene dal sensore sorgente.",day_fulfilled:"raggiunto ✓",day_not_fulfilled:"non raggiunto",day_target:"Obiettivo {target}",day_value:"Valore",edit_value:"Inserisci il valore di oggi",entities:"Sfide (vuoto: tutte)",entity_not_found:"Entità non trovata: {entity}",finished:"Challenge conclusa · {percent} %",finished_goal_reached:"Challenge conclusa · obiettivo raggiunto ✓",heatmap:"Valori giornalieri come calendario",heatmap_range:"Periodo del calendario",invalid_entities:"entities deve essere un elenco di entità.",invalid_value:"Inserisci un numero intero da 0.",left_in_days:"Ancora {remaining} in {days} giorni",left_to_goal:"Ancora {remaining} all'obiettivo",left_to_goal_last_day:"Ancora {remaining} nell'ultimo giorno",missing_entity:"Indica un'entità di una Daily Challenge.",no_challenges:"Nessuna Daily Challenge configurata.",not_a_challenge:"{entity} non appartiene a nessuna Daily Challenge.",overview_description:"Tutte le sfide in un colpo d'occhio.",overview_ended:"Terminata",overview_name:"Daily Challenge – panoramica",range_3months:"3 mesi",range_6months:"6 mesi",range_year:"1 anno",required_per_day:"Ø {per_day}/giorno",rescuable:"ancora recuperabile oggi",save:"Salva",show_buttons:"Mostra pulsanti",show_catch_up:"Mostra ritardo da recuperare",show_heatmap:"Mostra calendario (heatmap)",show_remaining:"Mostra quanto manca all'obiettivo",show_required_average:"Mostra media necessaria al giorno",show_stats:"Mostra statistiche",show_streak:"Mostra serie",show_target_vs_actual:"Mostra effettivo / obiettivo",stat_average:"Ø al giorno",stat_best_day:"Giorno migliore",stat_best_streak:"Serie migliore",stat_total:"Totale",target_vs_actual:"Effettivo {total} / Obiettivo {target}",title:"Titolo",undo:"Annulla"}};function ft(t){return t?.locale.language||("undefined"==typeof document?"":document.documentElement.lang)||"en"}function vt(t,e,i={}){return(s=ft(t),mt[s]??mt[s.split("-")[0]]??pt)[e].replace(/\{(\w+)\}/g,(t,e)=>e in i?i[e]:t);var s}const yt={comma_decimal:["en-US","en"],decimal_comma:["de","es","it"],quote_decimal:["de-CH"],space_comma:["fr","sv","cs"],system:void 0};function bt(t,e){const i=t?.locale.number_format??"language",s=i in yt?yt[i]:"none"===i?["en-US"]:[ft(t)];try{return new Intl.NumberFormat(s,{useGrouping:"none"!==i}).format(e)}catch{return String(e)}}function $t(t,e){return 0===e?"±0":`${e>0?"+":"−"}${bt(t,Math.abs(e))}`}const wt=["show_streak","show_target_vs_actual","show_remaining","show_required_average","show_catch_up","show_buttons","show_stats","show_heatmap"],xt="daily-challenge-card-editor";class At extends lt{static properties={hass:{attribute:!1},_config:{state:!0},_challenges:{state:!0}};_loading=!1;setConfig(t){this._config=t}willUpdate(t){t.has("hass")&&this.hass&&!this._loading&&!this._challenges&&(this._loading=!0,this._load())}async _load(){try{const t=await(this.hass?.callWS({type:"daily_challenge/list"}));this._challenges=t?.challenges??[]}catch{this._challenges=[]}finally{this._loading=!1}}_selected(){const t=this._config?.entity;return this._challenges?.find(e=>Object.values(e.entities).includes(t??""))?.entry_id}_schema(t){return[{name:"challenge",required:!0,selector:{select:{mode:"dropdown",options:t.map(t=>({value:t.entry_id,label:t.name}))}}},...wt.map(t=>({name:t,selector:{boolean:{}}})),{name:"heatmap_range",selector:{select:{mode:"dropdown",options:ct.map(t=>({value:t,label:vt(this.hass,`range_${t}`)}))}}}]}_formData(){const t={challenge:this._selected(),heatmap_range:this._config?.heatmap_range??"year"};for(const e of wt)t[e]=!1!==this._config?.[e];return t}_valueChanged(t){if(t.stopPropagation(),!this._config)return;const e=t.detail.value,i=e.challenge===this._selected()?void 0:this._challenges?.find(t=>t.entry_id===e.challenge),s={...this._config,entity:i?.entities.today??this._config.entity};for(const t of wt)!1===e[t]?s[t]=!1:delete s[t];const a=e.heatmap_range;a&&"year"!==a&&ct.includes(a)?s.heatmap_range=a:delete s.heatmap_range,JSON.stringify(s)!==JSON.stringify(this._config)&&(this._config=s,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:s},bubbles:!0,composed:!0})))}render(){return this.hass&&this._config&&this._challenges?0===this._challenges.length?L`<p>${vt(this.hass,"no_challenges")}</p>`:L`<ha-form
      .hass=${this.hass}
      .data=${this._formData()}
      .schema=${this._schema(this._challenges)}
      .computeLabel=${t=>vt(this.hass,t.name)}
      @value-changed=${this._valueChanged}
    ></ha-form>`:F}}customElements.get(xt)||customElements.define(xt,At);const St="daily-challenge-overview-card-editor",kt=[{name:"title",selector:{text:{}}},{name:"entities",selector:{entity:{multiple:!0,filter:[{integration:"daily_challenge",domain:"number"}]}}},{name:"show_buttons",selector:{boolean:{}}}];class Et extends lt{static properties={hass:{attribute:!1},_config:{state:!0}};setConfig(t){this._config=t}_valueChanged(t){if(t.stopPropagation(),!this._config)return;const e=t.detail.value,i={type:this._config.type},s="string"==typeof e.title?e.title.trim():"";s&&(i.title=s);const a=Array.isArray(e.entities)?e.entities.filter(Boolean):[];a.length&&(i.entities=a),!1===e.show_buttons&&(i.show_buttons=!1),JSON.stringify(i)!==JSON.stringify(this._config)&&(this._config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0})))}render(){if(!this.hass||!this._config)return F;const t={title:this._config.title??"",entities:this._config.entities??[],show_buttons:!1!==this._config.show_buttons};return L`<ha-form
      .hass=${this.hass}
      .data=${t}
      .schema=${kt}
      .computeLabel=${t=>vt(this.hass,t.name)}
      @value-changed=${this._valueChanged}
    ></ha-form>`}}customElements.get(St)||customElements.define(St,Et);const Ct="daily-challenge-overview-card",Dt=Symbol("not loaded"),Pt=new Set(["unknown","unavailable"]);class Tt extends lt{static properties={hass:{attribute:!1},_config:{state:!0},_challenges:{state:!0}};static getConfigElement(){return document.createElement(St)}static getStubConfig(){return{type:`custom:${Ct}`}}_entitiesSeen=Dt;_retryAt=0;_lookupId=0;setConfig(t){if(void 0!==t.entities&&!Array.isArray(t.entities))throw new Error(vt(this.hass,"invalid_entities"));this._config=t}getCardSize(){return Number(Boolean(this._config?.title))+Math.max(1,this._visible().length)}willUpdate(t){this.hass&&this.hass.entities!==this._entitiesSeen&&Date.now()>=this._retryAt&&(this._entitiesSeen=this.hass.entities,this._load())}async _load(){const t=++this._lookupId;try{const e=await(this.hass?.callWS({type:"daily_challenge/list"}));t===this._lookupId&&(this._challenges=e?.challenges??[])}catch{t===this._lookupId&&(this._entitiesSeen=Dt,this._retryAt=Date.now()+5e3)}}_visible(){const t=this._challenges??[],e=this._config?.entities??[];return 0===e.length?t:e.map(e=>t.find(t=>t.entities.today===e)).filter(t=>void 0!==t)}_state(t,e){const i=t.entities[e];return i?this.hass?.states[i]?.state:void 0}_number(t,e){const i=this._state(t,e);if(void 0===i||Pt.has(i))return;const s=Number(i);return Number.isFinite(s)?s:void 0}_smallestStep(t){if(!1===this._config?.show_buttons||t.today_from_source)return;const e=Object.keys(t.entities).filter(t=>/^add_\d+$/.test(t)).map(t=>Number(t.slice(4))).sort((t,e)=>t-e).filter(e=>{const i=this._state(t,`add_${e}`);return void 0!==i&&"unavailable"!==i});return e[0]}_moreInfo(t){this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:t.entities.today},bubbles:!0,composed:!0}))}async _add(t,e,i){t.stopPropagation();try{await(this.hass?.callService("button","press",{entity_id:e.entities[`add_${i}`]}))}catch(t){this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:t instanceof Error?t.message:String(t)},bubbles:!0,composed:!0}))}}render(){if(!this._config||!this.hass)return F;const t=this._config.title?L`<h1 class="card-header">${this._config.title}</h1>`:F;if(void 0===this._challenges)return L`<ha-card>${t}</ha-card>`;const e=this._visible();return L`<ha-card>
      ${t}
      <div class="rows">
        ${e.length?e.map(t=>this._renderRow(t)):L`<div class="empty">${vt(this.hass,"no_challenges")}</div>`}
      </div>
    </ha-card>`}_renderRow(t){const e=this.hass,i=0===this._number(t,"days_left"),s=this._number(t,"today"),a=this._number(t,"today_target"),n="on"===this._state(t,"goal_reached_today"),r=this._number(t,"current_streak"),o=e?.states[t.entities.today]?.attributes.unit_of_measurement??t.unit,l=n?1:void 0!==s&&a?Math.min(1,s/a):0,h=t=>void 0===t?"–":bt(e,t),c=i?void 0:this._smallestStep(t);return L`<div
      class="row"
      role="button"
      tabindex="0"
      @click=${()=>this._moreInfo(t)}
      @keydown=${e=>{"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),this._moreInfo(t))}}
    >
      <ha-icon .icon=${t.icon}></ha-icon>
      <div class="main">
        <div class="name">${t.name}</div>
        <div class="bar" aria-hidden="true">
          <div
            class="fill ${n?"reached":""}"
            style="width: ${100*(i?0:l)}%"
          ></div>
        </div>
        <div class="figures">
          ${i?vt(e,"overview_ended"):L`${h(s)} / ${h(a)} ${o}`}
        </div>
      </div>
      <span class="streak" title=${vt(e,"current_streak")}
        >🔥 ${h(r)}</span
      >
      ${void 0===c?F:L`<button
            class="add"
            aria-label=${vt(e,"add_amount",{amount:String(c)})}
            @click=${e=>this._add(e,t,c)}
            @keydown=${t=>t.stopPropagation()}
          >
            +${c}
          </button>`}
    </div>`}static styles=n`
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
    .name {
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
    .add:focus-visible {
      outline: 2px solid var(--primary-text-color);
      outline-offset: 2px;
    }
    .empty {
      padding: 8px;
      color: var(--secondary-text-color);
    }
  `}customElements.get(Ct)||customElements.define(Ct,Tt);const Nt=window;Nt.customCards??=[],Nt.customCards.some(t=>t.type===Ct)||Nt.customCards.push({type:Ct,name:vt(void 0,"overview_name"),description:vt(void 0,"overview_description"),preview:!0,documentationURL:"https://github.com/Skylolerr/ha-daily-challenge"});const Mt="daily-challenge-card",Ut=500,Ot=5e3,Rt=8e3,jt=2*Math.PI*52,Ht=Symbol("not loaded"),zt=new Set(["unknown","unavailable"]);function It(t){const e=Object.values(t?.entities??{}).find(t=>"daily_challenge"===t.platform&&"today"===t.translation_key);return e?.entity_id??""}function qt(t){return Object.keys(t).filter(t=>/^add_\d+$/.test(t)).map(t=>Number(t.slice(4))).sort((t,e)=>t-e)}class Bt extends lt{static properties={hass:{attribute:!1},_config:{state:!0},_challenge:{state:!0},_editing:{state:!0},_history:{state:!0},_dialog:{state:!0}};static getConfigElement(){return document.createElement(xt)}static getStubConfig(t){return{type:`custom:${Mt}`,entity:It(t)}}_entitiesSeen=Ht;_pressTimer;_committing=!1;_historyTotal;_lookupId=0;_historyId=0;_retryAt=0;_editValue="";constructor(){super(),this._editing=!1}setConfig(t){if(!t?.entity)throw new Error(vt(this.hass,"missing_entity"));t.entity!==this._config?.entity&&(this._challenge=void 0,this._history=void 0,this._historyTotal=void 0,this._entitiesSeen=Ht),this._config=t}getCardSize(){if(this._ended())return 6;const t=Number(this._show("show_target_vs_actual"))+Number(this._show("show_remaining")||this._show("show_required_average")),e=this._show("show_buttons")&&!this._challenge?.today_from_source,i=this._show("show_heatmap")?3:0;return 5+t+Number(e)+Number(this._show("show_stats"))+i}willUpdate(t){this.hass&&this._config&&this.hass.entities!==this._entitiesSeen&&Date.now()>=this._retryAt&&(this._entitiesSeen=this.hass.entities,this._loadChallenge());const e=this._state("total"),i=`${e}|${(new Date).toDateString()}`;this._challenge&&void 0!==e&&i!==this._historyTotal&&(this._historyTotal=i,this._loadHistory(this._challenge.entry_id))}get history(){return this._history}async _loadHistory(t){const e=++this._historyId;try{const i=await(this.hass?.callWS({type:"daily_challenge/history",entry_id:t}));e===this._historyId&&t===this._challenge?.entry_id&&(this._history=i)}catch{}}updated(t){if(t.has("_dialog")&&this._dialog&&!t.get("_dialog")){const t=this.renderRoot.querySelector(".day-input");t?.focus(),t?.select()}if(t.has("_editing"))if(this._editing){const t=this.renderRoot.querySelector("input");t?.focus(),t?.select(),document.addEventListener("pointerdown",this._outsidePointer,!0)}else document.removeEventListener("pointerdown",this._outsidePointer,!0)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("pointerdown",this._outsidePointer,!0),this._clearPress()}_outsidePointer=t=>{const e=this.renderRoot.querySelector("input");e&&!t.composedPath().includes(e)&&this._commit(e)};async _loadChallenge(){const t=this._config?.entity;if(!this.hass||!t)return;const e=++this._lookupId;try{const i=await this.hass.callWS({type:"daily_challenge/list"});if(e!==this._lookupId||t!==this._config?.entity)return;this._challenge=i.challenges.find(e=>Object.values(e.entities).includes(t))??null}catch{if(e!==this._lookupId)return;this._entitiesSeen=Ht,this._retryAt=Date.now()+5e3}}_state(t){const e=this._challenge?.entities[t];return e?this.hass?.states[e]?.state:void 0}_number(t){const e=this._state(t);if(void 0===e||zt.has(e))return;const i=Number(e);return Number.isFinite(i)?i:void 0}async _call(t,e,i){try{return await(this.hass?.callService(t,e,i)),!0}catch(t){return this._notify({message:t instanceof Error?t.message:String(t)}),!1}}_notify(t){this.dispatchEvent(new CustomEvent("hass-notification",{detail:t,bubbles:!0,composed:!0}))}_offerUndo(t,e,i,s){this._notify({message:vt(this.hass,"change",{name:t.name,change:e}),duration:Rt,action:{text:vt(this.hass,"undo"),action:()=>{this._call("daily_challenge",i,{config_entry_id:t.entry_id,...s})}}})}async _press(t){const e=this._challenge,i=e?.entities[t];if(!e||!i)return;const s=this._number("today"),a="subtract"===t?-(qt(e.entities)[0]??0):Number(t.slice(4)),n=Number(this.hass?.states[e.entities.today]?.attributes.max),r=void 0!==s&&n>=s?n-s:a,o=void 0!==s&&a<0?Math.max(a,-s):Math.min(a,r);await this._call("button","press",{entity_id:i})&&o&&this._offerUndo(e,$t(this.hass,o),"add",{amount:-o})}_pointerDown(){this._clearPress(),this._pressTimer=setTimeout(()=>this._startEdit(),500)}_clearPress(){clearTimeout(this._pressTimer),this._pressTimer=void 0}_valueKeyDown(t){"Enter"!==t.key&&" "!==t.key||(t.preventDefault(),this._startEdit())}_startEdit(){if(this._clearPress(),this._challenge?.today_from_source)return;const t=this._number("today");void 0!==t&&(this._editValue=String(t),this._committing=!1,this._editing=!0)}_inputKeyDown(t){"Enter"===t.key?(t.preventDefault(),t.stopPropagation(),this._commit(t.target)):"Escape"===t.key&&(t.preventDefault(),t.stopPropagation(),this._committing=!0,this._editing=!1)}async _commit(t){if(this._committing)return;this._committing=!0,this._editing=!1;const e=Number(t.value),i=this._challenge?.entities.today,s=this._number("today");i&&void 0!==s&&""!==t.value.trim()&&Number.isInteger(e)&&e>=0&&e!==s&&await this._call("number","set_value",{entity_id:i,value:e})&&this._challenge&&this._offerUndo(this._challenge,bt(this.hass,e),"set",{value:s})}render(){if(!this._config||!this.hass)return F;const t=this._config.entity;return this.hass.states[t]?void 0===this._challenge?L`<ha-card></ha-card>`:null===this._challenge?this._warning(vt(this.hass,"not_a_challenge",{entity:t})):L`<ha-card>
      ${this._renderHeader(this._challenge)} ${this._renderValue(this._challenge)}
      ${this._renderSummary()} ${this._renderButtons(this._challenge)}
      ${this._renderStats()} ${this._renderHeatmap()} ${this._renderDialog()}
    </ha-card>`:this._warning(vt(this.hass,"entity_not_found",{entity:t}))}_warning(t){return L`<ha-card><div class="warning">${t}</div></ha-card>`}_renderHeader(t){const e=t=>{const e=this._number(t);return void 0===e?"–":bt(this.hass,e)},i=e("current_streak"),s=e("best_streak");return L`<div class="header">
      <ha-icon .icon=${t.icon}></ha-icon>
      <span class="name">${t.name}</span>
      ${this._show("show_streak")?L`<span class="streak" title=${vt(this.hass,"current_streak")}>
            🔥 <span class="current">${i}</span>
            <span class="best">· ${vt(this.hass,"best")} ${s}</span>
          </span>`:F}
    </div>`}_ended(){return 0===this._number("days_left")}_show(t){return!1!==this._config?.[t]}_renderValue(t){const e=this._ended(),i=this._number(e?"total":"today"),s=this._number(e?"target_to_date":"today_target"),a=e?void 0!==i&&void 0!==s&&i>=s:"on"===this._state("goal_reached_today"),n=a?1:void 0!==i&&s?Math.min(1,i/s):0,r=this.hass?.states[t.entities.today]?.attributes.unit_of_measurement??t.unit;return L`<div class="value-area">
      <svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
        ${V`<circle class="track" cx="60" cy="60" r=${52}></circle>
          <circle
            class="progress ${a?"reached":""}"
            cx="60"
            cy="60"
            r=${52}
            stroke-dasharray=${jt}
            stroke-dashoffset=${jt*(1-n)}
            transform="rotate(-90 60 60)"
          ></circle>`}
      </svg>
      ${e||t.today_from_source?L`<div class="value">${this._renderFigures(i,s,r)}</div>`:this._editing?L`<input
            class="value-input"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            aria-label=${vt(this.hass,"edit_value")}
            .value=${this._editValue}
            @keydown=${this._inputKeyDown}
            @blur=${t=>this._commit(t.target)}
          />`:L`<div
            class="value"
            role="button"
            tabindex="0"
            title=${vt(this.hass,"edit_value")}
            @pointerdown=${this._pointerDown}
            @pointerup=${this._clearPress}
            @pointerleave=${this._clearPress}
            @pointercancel=${this._clearPress}
            @contextmenu=${t=>t.preventDefault()}
            @keydown=${this._valueKeyDown}
          >
            ${this._renderFigures(i,s,r)}
          </div>`}
    </div>`}_renderFigures(t,e,i){const s=t=>void 0===t?"–":bt(this.hass,t),a=s(t),n=a.length>5?`font-size: ${Math.max(1,13/a.length).toFixed(2)}em`:F;return L`<span class="number" style=${n}>${a}</span>
      <span class="target">/ ${s(e)}</span>
      <span class="unit" title=${i}>${i}</span>`}_renderFinished(){const t=this.hass,e=this._number("total"),i=this._number("target_to_date");if(void 0===e||void 0===i)return F;const s=e>=i?vt(t,"finished_goal_reached"):vt(t,"finished",{percent:bt(t,i?Math.floor(e/i*100):0)});return L`<div class="summary"><div class="finished">${s}</div></div>`}_renderSummary(){if(this._ended())return this._renderFinished();const t=this.hass,e=this._number("total"),i=this._number("target_to_date"),s=this._number("delta"),a=this._number("remaining"),n=this._challenge?.entities.today_target,r=n?t?.states[n]?.attributes:void 0,o=this._number("today_target"),l=Number(r?.daily_target),h=Number(r?.deficit),c=void 0!==o&&Number.isFinite(l)&&h>0&&o>l,d=[];this._show("show_target_vs_actual")&&void 0!==e&&void 0!==i&&d.push(L`<div class="target-vs-actual">
          ${vt(t,"target_vs_actual",{total:bt(t,e),target:bt(t,i)})}${void 0===s?F:L` ·
                <span class="delta ${s<0?"behind":"ahead"}"
                  >${$t(t,s)}</span
                >`}
        </div>`);const u=void 0===a?[]:this._remainingParts(a);return u.length&&d.push(L`<div class="remaining">
          ${u.map((t,e)=>L`${e?" · ":""}<span class="part">${t}</span>`)}
        </div>`),this._show("show_catch_up")&&c&&d.push(L`<div class="catch-up">
          ${"on"===this._state("goal_reached_today")?vt(t,"caught_up"):vt(t,"catch_up",{target:bt(t,l),deficit:bt(t,h)})}
        </div>`),d.length?L`<div class="summary">${d}</div>`:F}_remainingParts(t){const e=this.hass,i=this._number("days_left"),s=this._number("required_per_day"),a=bt(e,t),n=[];return this._show("show_remaining")&&(1===i?n.push(vt(e,"left_to_goal_last_day",{remaining:a})):void 0!==i&&i>1?n.push(vt(e,"left_in_days",{remaining:a,days:bt(e,i)})):n.push(vt(e,"left_to_goal",{remaining:a}))),this._show("show_required_average")&&void 0!==i&&i>1&&void 0!==s&&n.push(vt(e,"required_per_day",{per_day:bt(e,s)})),n}_renderButtons(t){if(!this._show("show_buttons")||this._ended()||t.today_from_source)return F;const e=e=>{const i=t.entities[e];return void 0!==i&&void 0!==this.hass?.states[i]},i=qt(t.entities),s=i.filter(t=>e(`add_${t}`)),a=void 0===this._number("today_target");return L`<div class="buttons">
      ${e("subtract")&&i.length?L`<button
            class="subtract"
            ?disabled=${a}
            @click=${()=>this._press("subtract")}
          >
            −${i[0]}
          </button>`:F}
      ${s.map(t=>L`<button
            class="add"
            ?disabled=${a}
            @click=${()=>this._press(`add_${t}`)}
          >
            +${t}
          </button>`)}
    </div>`}_renderStats(){if(!this._show("show_stats"))return F;const t=this.hass,e=(e,i="")=>{const s=this._number(e);return void 0===s?"–":`${bt(t,s)}${i}`},i=[[vt(t,"stat_total"),e("total")],[vt(t,"stat_average"),e("average")],[vt(t,"stat_best_day"),e("best_day")],[vt(t,"stat_best_streak"),e("best_streak")]];return L`<div class="stats">
      ${i.map(([t,e])=>L`<div class="stat">
            <span class="stat-value">${e}</span>
            <span class="stat-label">${t}</span>
          </div>`)}
    </div>`}_formatDate(t,e){const[i,s,a]=t.split("-").map(Number);try{return new Intl.DateTimeFormat(this.hass?.locale.language||"en",{...e,timeZone:"UTC"}).format(new Date(Date.UTC(i,s-1,a)))}catch{return t}}_cellTitle(t){const e=this._formatDate(t.date,{dateStyle:"medium"});if(!t.inPeriod)return e;return`${e}: ${`${bt(this.hass,t.value)} / ${bt(this.hass,t.target)}`}${t.fulfilled?" ✓":t.rescuable?` · ${vt(this.hass,"rescuable")}`:""}`}_renderHeatmap(){const t=this._history;if(!this._show("show_heatmap")||!t)return F;const e=function(t,e){const i=Object.keys(t.targets).sort();if(0===i.length)return{weeks:[],months:[]};const s=_t(i[i.length-1]),a=_t(i[0]),n=dt[e],r=s-(s+3)%7-7*(n-1),o=new Set(t.rescuable??[]),l=[],h=[];for(let e=0;e<n;e++){const i=[];for(let n=0;n<7;n++){const l=r+7*e+n;if(l>s){i.push(null);continue}const c=gt(l);(c.endsWith("-01")||0===e&&0===n)&&h.push({week:e,date:c});const d=l>=a&&c in t.targets,u=t.days[c]??0,_=t.targets[c]??0;i.push({date:c,inPeriod:d,value:u,target:_,fulfilled:d&&!0===t.fulfilled[c],rescuable:d&&o.has(c),last:l===s,ratio:_>0?Math.min(1,u/_):u>0?1:0})}l.push(i)}const c=Math.max(3,Math.round(n/8)),d=[];for(const t of[...h].reverse()){const e=d[0];(!e||e.week-t.week>=c)&&d.unshift(t)}return{weeks:l,months:d}}(t,this._config?.heatmap_range??"year");if(!e.weeks.length)return F;const i=13*e.weeks.length-3,s=e.weeks.flatMap((t,e)=>t.map((t,i)=>{if(!t)return F;const s=["cell",t.inPeriod?0===t.value?"empty":t.fulfilled?"fulfilled":"partial":"outside",t.rescuable?"rescuable":"",t.last?"last":""].join(" ");return V`<rect
          class=${s}
          x=${13*e}
          y=${13*i}
          width="10"
          height="10"
          rx="2"
          opacity=${function(t){return t.inPeriod&&0!==t.value?t.fulfilled?.45+.55*t.ratio:.2+.6*t.ratio:1}(t)}
          data-date=${t.date}
          @click=${()=>this._openDay(t)}
        ><title>${this._cellTitle(t)}</title></rect>`})),a=e.months.map(t=>L`<span class="month" style="left: ${13*t.week/i*100}%"
          >${this._formatDate(t.date,{month:"short"})}</span
        >`);return L`<div class="heatmap">
      <div class="heatmap-grid" style="max-width: ${22*e.weeks.length}px">
        <div class="months">${a}</div>
        <svg
          viewBox="0 0 ${i} ${88}"
          role="img"
          aria-label=${vt(this.hass,"heatmap")}
        >
          ${s}
        </svg>
      </div>
    </div>`}_openDay(t){t.inPeriod&&(this._dialog={cell:t,value:String(t.value)})}_closeDay(){this._dialog=void 0}_dialogFromSource(t){return Boolean(this._challenge?.today_from_source&&t.last&&!this._ended())}async _saveDay(){const t=this._dialog,e=this._challenge;if(!t||!e||!this.hass)return;const i=t.value.trim(),s=Number(i);if(""===i||!Number.isInteger(s)||s<0)return void(this._dialog={...t,error:vt(this.hass,"invalid_value")});if(s===t.cell.value)return void this._closeDay();const a=i=>this.hass?.callWS({type:"daily_challenge/set_day",entry_id:e.entry_id,date:t.cell.date,value:i});try{await a(s)}catch(e){const i=e?.message??String(e);return void(this._dialog={...t,error:i})}this._closeDay();const n=t.cell.value;this._notify({message:vt(this.hass,"change",{name:e.name,change:`${this._formatDate(t.cell.date,{dateStyle:"medium"})}: ${bt(this.hass,s)}`}),duration:Rt,action:{text:vt(this.hass,"undo"),action:()=>{Promise.resolve(a(n)).catch(t=>this._notify({message:t?.message??String(t)}))}}})}_dialogKeyDown(t){"Escape"===t.key?(t.preventDefault(),t.stopPropagation(),this._closeDay()):"Enter"===t.key&&(t.preventDefault(),t.stopPropagation(),this._saveDay())}_renderDialog(){const t=this._dialog;if(!t)return F;const e=this.hass,i=t.cell,s=this._dialogFromSource(i),a=i.fulfilled?vt(e,"day_fulfilled"):i.rescuable?vt(e,"rescuable"):vt(e,"day_not_fulfilled");return L`<div class="backdrop" @click=${this._closeDay}>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-title"
        @click=${t=>t.stopPropagation()}
        @keydown=${this._dialogKeyDown}
      >
        <div id="day-title" class="dialog-title">
          ${this._formatDate(i.date,{dateStyle:"full"})}
        </div>
        <div class="dialog-info">
          ${vt(e,"day_target",{target:bt(e,i.target)})} ·
          ${a}
        </div>
        <label class="dialog-field">
          <span>${vt(e,"day_value")}</span>
          <input
            class="day-input"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            .value=${t.value}
            ?disabled=${s}
            @input=${e=>{this._dialog={...t,value:e.target.value,error:void 0}}}
          />
        </label>
        ${s?L`<div class="dialog-note">${vt(e,"day_from_source")}</div>`:F}
        ${t.error?L`<div class="dialog-error">${t.error}</div>`:F}
        <div class="dialog-actions">
          <button class="cancel" @click=${this._closeDay}>
            ${vt(e,"cancel")}
          </button>
          ${s?F:L`<button class="save" @click=${()=>this._saveDay()}>
                ${vt(e,"save")}
              </button>`}
        </div>
      </div>
    </div>`}static styles=n`
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
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
  `}customElements.get(Mt)||customElements.define(Mt,Bt);const Lt=window;Lt.customCards??=[],Lt.customCards.some(t=>t.type===Mt)||Lt.customCards.push({type:Mt,name:vt(void 0,"card_name"),description:vt(void 0,"card_description"),preview:!0,documentationURL:"https://github.com/Skylolerr/ha-daily-challenge"});export{Mt as CARD_TYPE,Bt as DailyChallengeCard,Ut as LONG_PRESS_MS,Ot as LOOKUP_RETRY_MS,Rt as UNDO_MS,It as findStubEntity};
