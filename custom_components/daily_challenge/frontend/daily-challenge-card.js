/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,t=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),s=new WeakMap;let a=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const i=this.t;if(t&&void 0===e){const t=void 0!==i&&1===i.length;t&&(e=s.get(i)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&s.set(i,e))}return e}toString(){return this.cssText}};const n=(e,...t)=>{const s=1===e.length?e[0]:t.reduce((t,i,s)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[s+1],e[0]);return new a(s,e,i)},r=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new a("string"==typeof e?e:e+"",void 0,i))(t)})(e):e,{is:o,defineProperty:l,getOwnPropertyDescriptor:h,getOwnPropertyNames:c,getOwnPropertySymbols:d,getPrototypeOf:u}=Object,_=globalThis,g=_.trustedTypes,p=g?g.emptyScript:"",m=_.reactiveElementPolyfillSupport,f=(e,t)=>e,v={toAttribute(e,t){switch(t){case Boolean:e=e?p:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},y=(e,t)=>!o(e,t),b={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:y};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),_.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=b){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(e,i,t);void 0!==s&&l(this.prototype,e,s)}}static getPropertyDescriptor(e,t,i){const{get:s,set:a}=h(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:s,set(t){const n=s?.call(this);a?.call(this,t),this.requestUpdate(e,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??b}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const e=u(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const e=this.properties,t=[...c(e),...d(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(r(e))}else void 0!==e&&t.push(r(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((i,s)=>{if(t)i.adoptedStyleSheets=s.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const t of s){const s=document.createElement("style"),a=e.litNonce;void 0!==a&&s.setAttribute("nonce",a),s.textContent=t.cssText,i.appendChild(s)}})(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,i);if(void 0!==s&&!0===i.reflect){const a=(void 0!==i.converter?.toAttribute?i.converter:v).toAttribute(t,i.type);this._$Em=e,null==a?this.removeAttribute(s):this.setAttribute(s,a),this._$Em=null}}_$AK(e,t){const i=this.constructor,s=i._$Eh.get(e);if(void 0!==s&&this._$Em!==s){const e=i.getPropertyOptions(s),a="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:v;this._$Em=s;const n=a.fromAttribute(t,e.type);this[s]=n??this._$Ej?.get(s)??n,this._$Em=null}}requestUpdate(e,t,i,s=!1,a){if(void 0!==e){const n=this.constructor;if(!1===s&&(a=this[e]),i??=n.getPropertyOptions(e),!((i.hasChanged??y)(a,t)||i.useDefault&&i.reflect&&a===this._$Ej?.get(e)&&!this.hasAttribute(n._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:s,wrapped:a},n){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,n??t??this[e]),!0!==a||void 0!==n)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===s&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,s=this[t];!0!==e||this._$AL.has(t)||void 0===s||this.C(t,void 0,i,s)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[f("elementProperties")]=new Map,$[f("finalized")]=new Map,m?.({ReactiveElement:$}),(_.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w=globalThis,x=e=>e,A=w.trustedTypes,k=A?A.createPolicy("lit-html",{createHTML:e=>e}):void 0,S="$lit$",E=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+E,D=`<${C}>`,P=document,T=()=>P.createComment(""),M=e=>null===e||"object"!=typeof e&&"function"!=typeof e,N=Array.isArray,U="[ \t\n\f\r]",O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,j=/-->/g,R=/>/g,H=RegExp(`>|${U}(?:([^\\s"'>=/]+)(${U}*=${U}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),z=/'/g,I=/"/g,q=/^(?:script|style|textarea|title)$/i,B=e=>(t,...i)=>({_$litType$:e,strings:t,values:i}),L=B(1),F=B(2),V=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),K=new WeakMap,Z=P.createTreeWalker(P,129);function G(e,t){if(!N(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==k?k.createHTML(t):t}const J=(e,t)=>{const i=e.length-1,s=[];let a,n=2===t?"<svg>":3===t?"<math>":"",r=O;for(let t=0;t<i;t++){const i=e[t];let o,l,h=-1,c=0;for(;c<i.length&&(r.lastIndex=c,l=r.exec(i),null!==l);)c=r.lastIndex,r===O?"!--"===l[1]?r=j:void 0!==l[1]?r=R:void 0!==l[2]?(q.test(l[2])&&(a=RegExp("</"+l[2],"g")),r=H):void 0!==l[3]&&(r=H):r===H?">"===l[0]?(r=a??O,h=-1):void 0===l[1]?h=-2:(h=r.lastIndex-l[2].length,o=l[1],r=void 0===l[3]?H:'"'===l[3]?I:z):r===I||r===z?r=H:r===j||r===R?r=O:(r=H,a=void 0);const d=r===H&&e[t+1].startsWith("/>")?" ":"";n+=r===O?i+D:h>=0?(s.push(o),i.slice(0,h)+S+i.slice(h)+E+d):i+E+(-2===h?t:d)}return[G(e,n+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),s]};class Q{constructor({strings:e,_$litType$:t},i){let s;this.parts=[];let a=0,n=0;const r=e.length-1,o=this.parts,[l,h]=J(e,t);if(this.el=Q.createElement(l,i),Z.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(s=Z.nextNode())&&o.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const e of s.getAttributeNames())if(e.endsWith(S)){const t=h[n++],i=s.getAttribute(e).split(E),r=/([.?@])?(.*)/.exec(t);o.push({type:1,index:a,name:r[2],strings:i,ctor:"."===r[1]?ie:"?"===r[1]?se:"@"===r[1]?ae:te}),s.removeAttribute(e)}else e.startsWith(E)&&(o.push({type:6,index:a}),s.removeAttribute(e));if(q.test(s.tagName)){const e=s.textContent.split(E),t=e.length-1;if(t>0){s.textContent=A?A.emptyScript:"";for(let i=0;i<t;i++)s.append(e[i],T()),Z.nextNode(),o.push({type:2,index:++a});s.append(e[t],T())}}}else if(8===s.nodeType)if(s.data===C)o.push({type:2,index:a});else{let e=-1;for(;-1!==(e=s.data.indexOf(E,e+1));)o.push({type:7,index:a}),e+=E.length-1}a++}}static createElement(e,t){const i=P.createElement("template");return i.innerHTML=e,i}}function X(e,t,i=e,s){if(t===V)return t;let a=void 0!==s?i._$Co?.[s]:i._$Cl;const n=M(t)?void 0:t._$litDirective$;return a?.constructor!==n&&(a?._$AO?.(!1),void 0===n?a=void 0:(a=new n(e),a._$AT(e,i,s)),void 0!==s?(i._$Co??=[])[s]=a:i._$Cl=a),void 0!==a&&(t=X(e,a._$AS(e,t.values),a,s)),t}class Y{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,s=(e?.creationScope??P).importNode(t,!0);Z.currentNode=s;let a=Z.nextNode(),n=0,r=0,o=i[0];for(;void 0!==o;){if(n===o.index){let t;2===o.type?t=new ee(a,a.nextSibling,this,e):1===o.type?t=new o.ctor(a,o.name,o.strings,this,e):6===o.type&&(t=new ne(a,this,e)),this._$AV.push(t),o=i[++r]}n!==o?.index&&(a=Z.nextNode(),n++)}return Z.currentNode=P,s}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class ee{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,s){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=X(this,e,t),M(e)?e===W||null==e||""===e?(this._$AH!==W&&this._$AR(),this._$AH=W):e!==this._$AH&&e!==V&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>N(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==W&&M(this._$AH)?this._$AA.nextSibling.data=e:this.T(P.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,s="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=Q.createElement(G(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(t);else{const e=new Y(s,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=K.get(e.strings);return void 0===t&&K.set(e.strings,t=new Q(e)),t}k(e){N(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,s=0;for(const a of e)s===t.length?t.push(i=new ee(this.O(T()),this.O(T()),this,this.options)):i=t[s],i._$AI(a),s++;s<t.length&&(this._$AR(i&&i._$AB.nextSibling,s),t.length=s)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=x(e).nextSibling;x(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class te{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,s,a){this.type=1,this._$AH=W,this._$AN=void 0,this.element=e,this.name=t,this._$AM=s,this.options=a,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=W}_$AI(e,t=this,i,s){const a=this.strings;let n=!1;if(void 0===a)e=X(this,e,t,0),n=!M(e)||e!==this._$AH&&e!==V,n&&(this._$AH=e);else{const s=e;let r,o;for(e=a[0],r=0;r<a.length-1;r++)o=X(this,s[i+r],t,r),o===V&&(o=this._$AH[r]),n||=!M(o)||o!==this._$AH[r],o===W?e=W:e!==W&&(e+=(o??"")+a[r+1]),this._$AH[r]=o}n&&!s&&this.j(e)}j(e){e===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class ie extends te{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===W?void 0:e}}class se extends te{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==W)}}class ae extends te{constructor(e,t,i,s,a){super(e,t,i,s,a),this.type=5}_$AI(e,t=this){if((e=X(this,e,t,0)??W)===V)return;const i=this._$AH,s=e===W&&i!==W||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,a=e!==W&&(i===W||s);s&&this.element.removeEventListener(this.name,this,i),a&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ne{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){X(this,e)}}const re=w.litHtmlPolyfillSupport;re?.(Q,ee),(w.litHtmlVersions??=[]).push("3.3.3");const oe=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class le extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const s=i?.renderBefore??t;let a=s._$litPart$;if(void 0===a){const e=i?.renderBefore??null;s._$litPart$=a=new ee(t.insertBefore(T(),e),e,void 0,i??{})}return a._$AI(e),a})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}}le._$litElement$=!0,le.finalized=!0,oe.litElementHydrateSupport?.({LitElement:le});const he=oe.litElementPolyfillSupport;he?.({LitElement:le}),(oe.litElementVersions??=[]).push("4.2.2");const ce=["year","6months","3months"],de={year:53,"6months":26,"3months":13},ue=864e5;function _e(e){const[t,i,s]=e.split("-").map(Number);return Math.round(Date.UTC(t,i-1,s)/ue)}function ge(e){return new Date(e*ue).toISOString().slice(0,10)}const pe={add_amount:"Add {amount}",best:"Best",cancel:"Cancel",card_description:"Track today's progress of a daily challenge.",card_name:"Daily Challenge",catch_up:"Today: {target} + {deficit} deficit",caught_up:"Deficit made up ✓",celebrate_best_day:"New best day: {value} {unit}!",celebrate_best_streak:"New best streak: {value} days!",celebrate_streak:"{value} days in a row!",celebrate_total:"{value} {unit} in total!",challenge:"Challenge",change:"{name}: {change}",current_streak:"Current streak",day_from_source:"Today's value comes from the source sensor.",day_fulfilled:"fulfilled ✓",day_not_fulfilled:"not fulfilled",day_target:"Target {target}",day_value:"Value",edit_value:"Enter today's value",entities:"Challenges (empty: all)",entity_not_found:"Entity not found: {entity}",finished:"Challenge finished · {percent}%",finished_goal_reached:"Challenge finished · goal reached ✓",heatmap:"Daily values as a calendar",heatmap_range:"Calendar range",invalid_entities:"entities must be a list of entities.",invalid_value:"Enter a whole number from 0.",left_in_days:"{remaining} left in {days} days",left_to_goal:"{remaining} left to goal",left_to_goal_last_day:"{remaining} left on the last day",missing_entity:"Please define an entity of a Daily Challenge.",no_challenges:"No Daily Challenge set up yet.",not_a_challenge:"{entity} does not belong to a Daily Challenge.",overview_description:"All challenges at a glance.",overview_ended:"Finished",overview_missing:"None of the chosen challenges exists any more.",overview_name:"Daily Challenge overview",range_3months:"3 months",range_6months:"6 months",range_year:"1 year",required_per_day:"Ø {per_day}/day",rescuable:"can still be made up today",save:"Save",show_buttons:"Show buttons",show_catch_up:"Show catch-up deficit",show_celebration:"Celebrate goals and milestones",show_heatmap:"Show calendar (heatmap)",show_remaining:"Show what is left until the end goal",show_required_average:"Show required average per day",show_stats:"Show statistics",show_streak:"Show streak",show_target_vs_actual:"Show actual vs. target",stat_average:"Ø per day",stat_best_day:"Best day",stat_best_streak:"Best streak",stat_total:"Total",target_vs_actual:"Actual {total} / Target {target}",title:"Title",undo:"Undo"},me={de:{add_amount:"{amount} hinzufügen",best:"Rekord",cancel:"Abbrechen",card_description:"Zeigt den heutigen Fortschritt einer täglichen Challenge.",card_name:"Daily Challenge",catch_up:"Heute: {target} + {deficit} Rückstand",caught_up:"Rückstand aufgeholt ✓",celebrate_best_day:"Neuer bester Tag: {value} {unit}!",celebrate_best_streak:"Neuer bester Streak: {value} Tage!",celebrate_streak:"{value} Tage in Folge!",celebrate_total:"{value} {unit} insgesamt!",challenge:"Challenge",change:"{name}: {change}",current_streak:"Aktueller Streak",day_from_source:"Der heutige Wert kommt vom Quell-Sensor.",day_fulfilled:"erfüllt ✓",day_not_fulfilled:"nicht erfüllt",day_target:"Ziel {target}",day_value:"Wert",edit_value:"Heutigen Wert eingeben",entities:"Challenges (leer: alle)",entity_not_found:"Entität nicht gefunden: {entity}",finished:"Challenge abgeschlossen · {percent} %",finished_goal_reached:"Challenge abgeschlossen · Ziel erreicht ✓",heatmap:"Tageswerte als Kalender",heatmap_range:"Zeitraum des Kalenders",invalid_entities:"entities muss eine Liste von Entitäten sein.",invalid_value:"Gib eine ganze Zahl ab 0 ein.",left_in_days:"Noch {remaining} in {days} Tagen",left_to_goal:"Noch {remaining} bis zum Ziel",left_to_goal_last_day:"Noch {remaining} am letzten Tag",missing_entity:"Bitte gib eine Entität einer Daily Challenge an.",no_challenges:"Noch keine Daily Challenge eingerichtet.",not_a_challenge:"{entity} gehört zu keiner Daily Challenge.",overview_description:"Alle Challenges auf einen Blick.",overview_ended:"Beendet",overview_missing:"Keine der gewählten Challenges gibt es noch.",overview_name:"Daily Challenge Übersicht",range_3months:"3 Monate",range_6months:"6 Monate",range_year:"1 Jahr",required_per_day:"Ø {per_day}/Tag",rescuable:"heute noch aufholbar",save:"Speichern",show_buttons:"Buttons anzeigen",show_catch_up:"Rückstand beim Aufholen anzeigen",show_celebration:"Ziele und Meilensteine feiern",show_heatmap:"Kalender (Heatmap) anzeigen",show_remaining:"Rest bis zum Ziel anzeigen",show_required_average:"Nötigen Schnitt pro Tag anzeigen",show_stats:"Statistik anzeigen",show_streak:"Streak anzeigen",show_target_vs_actual:"Ist / Soll anzeigen",stat_average:"Ø pro Tag",stat_best_day:"Bester Tag",stat_best_streak:"Bester Streak",stat_total:"Total",target_vs_actual:"Ist {total} / Soll {target}",title:"Titel",undo:"Rückgängig"},en:pe,fr:{add_amount:"Ajouter {amount}",best:"Record",cancel:"Annuler",card_description:"Affiche la progression du jour d'un défi quotidien.",card_name:"Daily Challenge",catch_up:"Aujourd'hui : {target} + {deficit} de retard",caught_up:"Retard rattrapé ✓",celebrate_best_day:"Nouveau meilleur jour : {value} {unit} !",celebrate_best_streak:"Nouvelle meilleure série : {value} jours !",celebrate_streak:"{value} jours d'affilée !",celebrate_total:"{value} {unit} au total !",challenge:"Défi",change:"{name} : {change}",current_streak:"Série actuelle",day_from_source:"La valeur du jour provient du capteur source.",day_fulfilled:"atteint ✓",day_not_fulfilled:"non atteint",day_target:"Objectif {target}",day_value:"Valeur",edit_value:"Saisir la valeur du jour",entities:"Défis (vide : tous)",entity_not_found:"Entité introuvable : {entity}",finished:"Challenge terminé · {percent} %",finished_goal_reached:"Challenge terminé · objectif atteint ✓",heatmap:"Valeurs quotidiennes en calendrier",heatmap_range:"Période du calendrier",invalid_entities:"entities doit être une liste d'entités.",invalid_value:"Saisis un nombre entier à partir de 0.",left_in_days:"Encore {remaining} en {days} jours",left_to_goal:"Encore {remaining} jusqu'à l'objectif",left_to_goal_last_day:"Encore {remaining} le dernier jour",missing_entity:"Veuillez indiquer une entité d'un Daily Challenge.",no_challenges:"Aucun Daily Challenge configuré pour l'instant.",not_a_challenge:"{entity} n'appartient à aucun Daily Challenge.",overview_description:"Tous les défis en un coup d'œil.",overview_ended:"Terminé",overview_missing:"Aucun des défis choisis n'existe encore.",overview_name:"Daily Challenge – aperçu",range_3months:"3 mois",range_6months:"6 mois",range_year:"1 an",required_per_day:"Ø {per_day}/jour",rescuable:"encore rattrapable aujourd'hui",save:"Enregistrer",show_buttons:"Afficher les boutons",show_catch_up:"Afficher le retard à rattraper",show_celebration:"Fêter les objectifs et les jalons",show_heatmap:"Afficher le calendrier (heatmap)",show_remaining:"Afficher le reste jusqu'à l'objectif",show_required_average:"Afficher la moyenne nécessaire par jour",show_stats:"Afficher les statistiques",show_streak:"Afficher la série",show_target_vs_actual:"Afficher réel / objectif",stat_average:"Ø par jour",stat_best_day:"Meilleur jour",stat_best_streak:"Meilleure série",stat_total:"Total",target_vs_actual:"Réel {total} / Objectif {target}",title:"Titre",undo:"Annuler"},it:{add_amount:"Aggiungi {amount}",best:"Record",cancel:"Annulla",card_description:"Mostra i progressi di oggi di una sfida giornaliera.",card_name:"Daily Challenge",catch_up:"Oggi: {target} + {deficit} di ritardo",caught_up:"Ritardo recuperato ✓",celebrate_best_day:"Nuovo giorno migliore: {value} {unit}!",celebrate_best_streak:"Nuova serie migliore: {value} giorni!",celebrate_streak:"{value} giorni di fila!",celebrate_total:"{value} {unit} in totale!",challenge:"Sfida",change:"{name}: {change}",current_streak:"Serie attuale",day_from_source:"Il valore di oggi proviene dal sensore sorgente.",day_fulfilled:"raggiunto ✓",day_not_fulfilled:"non raggiunto",day_target:"Obiettivo {target}",day_value:"Valore",edit_value:"Inserisci il valore di oggi",entities:"Sfide (vuoto: tutte)",entity_not_found:"Entità non trovata: {entity}",finished:"Challenge conclusa · {percent} %",finished_goal_reached:"Challenge conclusa · obiettivo raggiunto ✓",heatmap:"Valori giornalieri come calendario",heatmap_range:"Periodo del calendario",invalid_entities:"entities deve essere un elenco di entità.",invalid_value:"Inserisci un numero intero da 0.",left_in_days:"Ancora {remaining} in {days} giorni",left_to_goal:"Ancora {remaining} all'obiettivo",left_to_goal_last_day:"Ancora {remaining} nell'ultimo giorno",missing_entity:"Indica un'entità di una Daily Challenge.",no_challenges:"Nessuna Daily Challenge configurata.",not_a_challenge:"{entity} non appartiene a nessuna Daily Challenge.",overview_description:"Tutte le sfide in un colpo d'occhio.",overview_ended:"Terminata",overview_missing:"Nessuna delle sfide scelte esiste ancora.",overview_name:"Daily Challenge – panoramica",range_3months:"3 mesi",range_6months:"6 mesi",range_year:"1 anno",required_per_day:"Ø {per_day}/giorno",rescuable:"ancora recuperabile oggi",save:"Salva",show_buttons:"Mostra pulsanti",show_catch_up:"Mostra ritardo da recuperare",show_celebration:"Festeggia obiettivi e traguardi",show_heatmap:"Mostra calendario (heatmap)",show_remaining:"Mostra quanto manca all'obiettivo",show_required_average:"Mostra media necessaria al giorno",show_stats:"Mostra statistiche",show_streak:"Mostra serie",show_target_vs_actual:"Mostra effettivo / obiettivo",stat_average:"Ø al giorno",stat_best_day:"Giorno migliore",stat_best_streak:"Serie migliore",stat_total:"Totale",target_vs_actual:"Effettivo {total} / Obiettivo {target}",title:"Titolo",undo:"Annulla"}};function fe(e){return e?.locale?.language||("undefined"==typeof document?"":document.documentElement.lang)||"en"}function ve(e,t,i={}){return(s=fe(e),me[s]??me[s.split("-")[0]]??pe)[t].replace(/\{(\w+)\}/g,(e,t)=>t in i?i[t]:e);var s}const ye={comma_decimal:["en-US","en"],decimal_comma:["de","es","it"],quote_decimal:["de-CH"],space_comma:["fr","sv","cs"],system:void 0};function be(e,t){const i=e?.locale?.number_format??"language",s=i in ye?ye[i]:"none"===i?["en-US"]:[fe(e)];try{return function(e,t){const i=`${e?.join(",")??""}|${t}`;let s=$e.get(i);s||(s=new Intl.NumberFormat(e,{useGrouping:t}),$e.set(i,s));return s}(s,"none"!==i).format(t)}catch{return String(t)}}const $e=new Map;const we=new Map;function xe(e){if("object"==typeof e&&null!==e&&"message"in e){const t=e.message;if("string"==typeof t&&t)return t}return String(e)}function Ae(e,t){return 0===t?"±0":`${t>0?"+":"−"}${be(e,Math.abs(t))}`}const ke=["show_streak","show_target_vs_actual","show_remaining","show_required_average","show_catch_up","show_buttons","show_stats","show_heatmap","show_celebration"],Se="daily-challenge-card-editor";class Ee extends le{static properties={hass:{attribute:!1},_config:{state:!0},_challenges:{state:!0}};_loading=!1;setConfig(e){this._config=e}willUpdate(e){e.has("hass")&&this.hass&&!this._loading&&!this._challenges&&(this._loading=!0,this._load())}async _load(){try{const e=await(this.hass?.callWS({type:"daily_challenge/list"}));this._challenges=e?.challenges??[]}catch{this._challenges=[]}finally{this._loading=!1}}_selected(){const e=this._config?.entity;return this._challenges?.find(t=>Object.values(t.entities).includes(e??""))?.entry_id}_schema(e){return[{name:"challenge",required:!0,selector:{select:{mode:"dropdown",options:e.map(e=>({value:e.entry_id,label:e.name}))}}},...ke.map(e=>({name:e,selector:{boolean:{}}})),{name:"heatmap_range",selector:{select:{mode:"dropdown",options:ce.map(e=>({value:e,label:ve(this.hass,`range_${e}`)}))}}}]}_formData(){const e={challenge:this._selected(),heatmap_range:this._config?.heatmap_range??"year"};for(const t of ke)e[t]=!1!==this._config?.[t];return e}_valueChanged(e){if(e.stopPropagation(),!this._config)return;const t=e.detail.value,i=t.challenge===this._selected()?void 0:this._challenges?.find(e=>e.entry_id===t.challenge),s={...this._config,entity:i?.entities.today??this._config.entity};for(const e of ke)!1===t[e]?s[e]=!1:delete s[e];const a=t.heatmap_range;a&&"year"!==a&&ce.includes(a)?s.heatmap_range=a:delete s.heatmap_range,JSON.stringify(s)!==JSON.stringify(this._config)&&(this._config=s,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:s},bubbles:!0,composed:!0})))}render(){return this.hass&&this._config&&this._challenges?0===this._challenges.length?L`<p>${ve(this.hass,"no_challenges")}</p>`:L`<ha-form
      .hass=${this.hass}
      .data=${this._formData()}
      .schema=${this._schema(this._challenges)}
      .computeLabel=${e=>ve(this.hass,e.name)}
      @value-changed=${this._valueChanged}
    ></ha-form>`:W}}customElements.get(Se)||customElements.define(Se,Ee);const Ce="daily-challenge-overview-card-editor",De=[{name:"title",selector:{text:{}}},{name:"entities",selector:{entity:{multiple:!0,filter:[{integration:"daily_challenge",domain:"number"}]}}},{name:"show_buttons",selector:{boolean:{}}}];class Pe extends le{static properties={hass:{attribute:!1},_config:{state:!0}};setConfig(e){this._config=e}_valueChanged(e){if(e.stopPropagation(),!this._config)return;const t=e.detail.value,i={...this._config};delete i.title,delete i.entities,delete i.show_buttons;const s="string"==typeof t.title?t.title.trim():"";s&&(i.title=s);const a=Array.isArray(t.entities)?t.entities.filter(Boolean):[];a.length&&(i.entities=a),!1===t.show_buttons&&(i.show_buttons=!1),JSON.stringify(i)!==JSON.stringify(this._config)&&(this._config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0})))}render(){if(!this.hass||!this._config)return W;const e={title:this._config.title??"",entities:this._config.entities??[],show_buttons:!1!==this._config.show_buttons};return L`<ha-form
      .hass=${this.hass}
      .data=${e}
      .schema=${De}
      .computeLabel=${e=>ve(this.hass,e.name)}
      @value-changed=${this._valueChanged}
    ></ha-form>`}}customElements.get(Ce)||customElements.define(Ce,Pe);const Te="daily-challenge-overview-card",Me=Symbol("not loaded"),Ne=new Set(["unknown","unavailable"]);class Ue extends le{static properties={hass:{attribute:!1},_config:{state:!0},_challenges:{state:!0}};static getConfigElement(){return document.createElement(Ce)}static getStubConfig(){return{type:`custom:${Te}`}}_entitiesSeen=Me;_retryAt=0;_lookupId=0;setConfig(e){if(void 0!==e.entities&&!Array.isArray(e.entities))throw new Error(ve(this.hass,"invalid_entities"));this._config=e}getCardSize(){const e=this._challenges?this._visible().length:this._config?.entities?.length??3;return Number(Boolean(this._config?.title))+Math.max(1,e)}getGridOptions(){return{columns:6,min_columns:4,rows:"auto"}}willUpdate(e){this.hass&&this.hass.entities!==this._entitiesSeen&&Date.now()>=this._retryAt&&(this._entitiesSeen=this.hass.entities,this._load())}async _load(){const e=++this._lookupId;try{const t=await(this.hass?.callWS({type:"daily_challenge/list"}));e===this._lookupId&&(this._challenges=t?.challenges??[])}catch{e===this._lookupId&&(this._entitiesSeen=Me,this._retryAt=Date.now()+5e3)}}_visible(){const e=this._challenges??[],t=this._config?.entities??[];return 0===t.length?e:t.map(t=>e.find(e=>e.entities.today===t)).filter(e=>void 0!==e)}_state(e,t){const i=e.entities[t];return i?this.hass?.states[i]?.state:void 0}_number(e,t){const i=this._state(e,t);if(void 0===i||Ne.has(i))return;const s=Number(i);return Number.isFinite(s)?s:void 0}_smallestStep(e){if(!1===this._config?.show_buttons||e.today_from_source)return;const t=Object.keys(e.entities).filter(e=>/^add_\d+$/.test(e)).map(e=>Number(e.slice(4))).sort((e,t)=>e-t).filter(t=>{const i=this._state(e,`add_${t}`);return void 0!==i&&"unavailable"!==i});return t[0]}_moreInfo(e){this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:e.entities.today},bubbles:!0,composed:!0}))}async _add(e,t,i){e.stopPropagation();try{await(this.hass?.callService("button","press",{entity_id:t.entities[`add_${i}`]}))}catch(e){this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:xe(e)},bubbles:!0,composed:!0}))}}render(){if(!this._config||!this.hass)return W;const e=this._config.title?L`<h1 class="card-header">${this._config.title}</h1>`:W;if(void 0===this._challenges)return L`<ha-card>${e}</ha-card>`;const t=this._visible();return L`<ha-card>
      ${e}
      <div class="rows">
        ${t.length?t.map(e=>this._renderRow(e)):L`<div class="empty">
              ${ve(this.hass,this._challenges.length&&this._config.entities?.length?"overview_missing":"no_challenges")}
            </div>`}
      </div>
    </ha-card>`}_renderRow(e){const t=this.hass,i=0===this._number(e,"days_left"),s=this._number(e,"today"),a=this._number(e,"today_target"),n="on"===this._state(e,"goal_reached_today"),r=this._number(e,"current_streak"),o=t?.states[e.entities.today]?.attributes.unit_of_measurement??e.unit,l=n?1:void 0!==s&&a?Math.min(1,s/a):0,h=e=>void 0===e?"–":be(t,e),c=i?void 0:this._smallestStep(e);return L`<div
      class="row"
      role="button"
      tabindex="0"
      @click=${()=>this._moreInfo(e)}
      @keydown=${t=>{"Enter"!==t.key&&" "!==t.key||(t.preventDefault(),this._moreInfo(e))}}
    >
      <ha-icon .icon=${e.icon}></ha-icon>
      <div class="main">
        <div class="name">${e.name}</div>
        <div class="bar" aria-hidden="true">
          <div
            class="fill ${n?"reached":""}"
            style="width: ${100*(i?0:l)}%"
          ></div>
        </div>
        <div class="figures">
          ${i?ve(t,"overview_ended"):L`${h(s)} / ${h(a)} ${o}`}
        </div>
      </div>
      <span class="streak" title=${ve(t,"current_streak")}
        >🔥 ${h(r)}</span
      >
      ${void 0===c?W:L`<button
            class="add"
            ?disabled=${void 0===a}
            aria-label=${ve(t,"add_amount",{amount:String(c)})}
            @click=${t=>this._add(t,e,c)}
            @keydown=${e=>e.stopPropagation()}
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
  `}customElements.get(Te)||customElements.define(Te,Ue);const Oe=window;Oe.customCards??=[],Oe.customCards.some(e=>e.type===Te)||Oe.customCards.push({type:Te,name:ve(void 0,"overview_name"),description:ve(void 0,"overview_description"),preview:!0,documentationURL:"https://github.com/Skylolerr/ha-daily-challenge"});const je="daily-challenge-card",Re=500,He=5e3,ze=8e3,Ie=3e3,qe=["var(--success-color, #43a047)","var(--primary-color, #03a9f4)","var(--warning-color, #ffa600)","var(--accent-color, #ff9800)"],Be=2*Math.PI*52,Le=Symbol("not loaded"),Fe=new Set(["unknown","unavailable"]);function Ve(e){const t=Object.values(e?.entities??{}).find(e=>"daily_challenge"===e.platform&&"today"===e.translation_key);return t?.entity_id??""}function We(e){return Object.keys(e).filter(e=>/^add_\d+$/.test(e)).map(e=>Number(e.slice(4))).sort((e,t)=>e-t)}class Ke extends le{static properties={hass:{attribute:!1},_config:{state:!0},_challenge:{state:!0},_editing:{state:!0},_history:{state:!0},_dialog:{state:!0},_celebration:{state:!0},_focusDate:{state:!0}};static getConfigElement(){return document.createElement(Se)}static getStubConfig(e){return{type:`custom:${je}`,entity:Ve(e)}}_lastGoal;_lastMilestone;_celebrationTimer;_historyRetryAt=0;_todaySeen;_heatmapCache;_entitiesSeen=Le;_pressTimer;_committing=!1;_historyTotal;_lookupId=0;_historyId=0;_retryAt=0;_editValue="";constructor(){super(),this._editing=!1}setConfig(e){if(!e?.entity)throw new Error(ve(this.hass,"missing_entity"));e.entity!==this._config?.entity&&(this._lastGoal=void 0,this._lastMilestone=void 0,this._dialog=void 0,this._focusDate=void 0,this._historyRetryAt=0,this._todaySeen=void 0,this._challenge=void 0,this._history=void 0,this._historyTotal=void 0,this._entitiesSeen=Le),this._config=e}getCardSize(){const e=Number(this._show("show_stats"))+(this._show("show_heatmap")?3:0);if(this._ended())return 6+e;const t=Number(this._show("show_target_vs_actual"))+Number(this._show("show_remaining")||this._show("show_required_average")),i=this._show("show_buttons")&&!this._challenge?.today_from_source;return 5+t+Number(i)+e}getGridOptions(){return{columns:6,min_columns:6,rows:"auto"}}shouldUpdate(e){if(1!==e.size||!e.has("hass")||!this._challenge||!this._history)return!0;const t=e.get("hass"),i=this.hass;return!t||!i||t.entities!==i.entities||t.locale!==i.locale||Object.values(this._challenge.entities).some(e=>t.states[e]!==i.states[e])}willUpdate(e){this.hass&&this._config&&this.hass.entities!==this._entitiesSeen&&Date.now()>=this._retryAt&&(this._entitiesSeen=this.hass.entities,this._loadChallenge()),this._watchCelebrations();const t=this._state("today");this._challenge&&"unavailable"===this._todaySeen&&void 0!==t&&"unavailable"!==t&&this._loadChallenge(),this._todaySeen=t;const i=this._state("total"),s=`${i}|${this._state("target_to_date")??(new Date).toDateString()}`;this._challenge&&void 0!==i&&s!==this._historyTotal&&Date.now()>=this._historyRetryAt&&(this._historyTotal=s,this._loadHistory(this._challenge.entry_id))}get history(){return this._history}async _loadHistory(e){const t=++this._historyId;try{const i=await(this.hass?.callWS({type:"daily_challenge/history",entry_id:e}));t===this._historyId&&e===this._challenge?.entry_id&&(this._history=i,this._refreshDialog())}catch{t===this._historyId&&(this._historyTotal=void 0,this._historyRetryAt=Date.now()+He)}}_refreshDialog(){const e=this._dialog,t=this._history;if(!e||!t||e.saving)return;const i=e.cell.date,s=t.days[i]??0,a={...e.cell,value:s,target:t.targets[i]??e.cell.target,fulfilled:!0===t.fulfilled[i],rescuable:(t.rescuable??[]).includes(i)},n=e.value!==String(e.cell.value);this._dialog={...e,cell:a,value:n?e.value:String(s)}}updated(e){if(e.has("_dialog")&&this._dialog&&!e.get("_dialog")){const e=this.renderRoot.querySelector(".day-input");e?.focus(),e?.select()}if((e.has("_focusDate")||e.has("_dialog")&&!this._dialog)&&this._focusDate&&!this._dialog&&this.renderRoot.querySelector(`rect[data-date="${this._focusDate}"]`)?.focus(),e.has("_editing"))if(this._editing){const e=this.renderRoot.querySelector("input");e?.focus(),e?.select(),document.addEventListener("pointerdown",this._outsidePointer,!0)}else document.removeEventListener("pointerdown",this._outsidePointer,!0)}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this._celebrationTimer),this._celebration=void 0,this._lastGoal=void 0,this._lastMilestone=void 0,document.removeEventListener("pointerdown",this._outsidePointer,!0),this._clearPress()}_outsidePointer=e=>{const t=this.renderRoot.querySelector("input");t&&!e.composedPath().includes(t)&&this._commit(t)};async _loadChallenge(){const e=this._config?.entity;if(!this.hass||!e)return;const t=++this._lookupId;try{const i=await this.hass.callWS({type:"daily_challenge/list"});if(t!==this._lookupId||e!==this._config?.entity)return;this._challenge=i.challenges.find(t=>Object.values(t.entities).includes(e))??null}catch{if(t!==this._lookupId)return;this._entitiesSeen=Le,this._retryAt=Date.now()+He}}_state(e){const t=this._challenge?.entities[e];return t?this.hass?.states[t]?.state:void 0}_number(e){const t=this._state(e);if(void 0===t||Fe.has(t))return;const i=Number(t);return Number.isFinite(i)?i:void 0}async _call(e,t,i){try{return await(this.hass?.callService(e,t,i)),!0}catch(e){return this._notify({message:xe(e)}),!1}}_notify(e){this.dispatchEvent(new CustomEvent("hass-notification",{detail:e,bubbles:!0,composed:!0}))}_offerUndo(e,t,i,s){this._notify({message:ve(this.hass,"change",{name:e.name,change:t}),duration:ze,action:{text:ve(this.hass,"undo"),action:()=>{this._call("daily_challenge",i,{config_entry_id:e.entry_id,...s})}}})}async _press(e){const t=this._challenge,i=t?.entities[e];if(!t||!i)return;const s=this._number("today"),a="subtract"===e?-(We(t.entities)[0]??0):Number(e.slice(4)),n=Number(this.hass?.states[t.entities.today]?.attributes.max),r=void 0!==s&&n>=s?n-s:a,o=void 0!==s&&a<0?Math.max(a,-s):Math.min(a,r);await this._call("button","press",{entity_id:i})&&o&&this._offerUndo(t,Ae(this.hass,o),"add",{amount:-o})}_pointerDown(){this._clearPress(),this._pressTimer=setTimeout(()=>this._startEdit(),500)}_clearPress(){clearTimeout(this._pressTimer),this._pressTimer=void 0}_valueKeyDown(e){"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),this._startEdit())}_startEdit(){if(this._clearPress(),this._challenge?.today_from_source)return;const e=this._number("today");void 0!==e&&(this._editValue=String(e),this._committing=!1,this._editing=!0)}_inputKeyDown(e){"Enter"===e.key?(e.preventDefault(),e.stopPropagation(),this._commit(e.target)):"Escape"===e.key&&(e.preventDefault(),e.stopPropagation(),this._committing=!0,this._editing=!1)}async _commit(e){if(this._committing)return;this._committing=!0,this._editing=!1;const t=Number(e.value),i=this._challenge?.entities.today,s=this._number("today");i&&void 0!==s&&""!==e.value.trim()&&Number.isInteger(t)&&t>=0&&t!==s&&await this._call("number","set_value",{entity_id:i,value:t})&&this._challenge&&this._offerUndo(this._challenge,be(this.hass,t),"set",{value:s})}render(){if(!this._config||!this.hass)return W;const e=this._config.entity;return this.hass.states[e]?void 0===this._challenge?L`<ha-card></ha-card>`:null===this._challenge?this._warning(ve(this.hass,"not_a_challenge",{entity:e})):L`<ha-card>
      ${this._renderHeader(this._challenge)} ${this._renderValue(this._challenge)}
      ${this._renderSummary()} ${this._renderButtons(this._challenge)}
      ${this._renderStats()} ${this._renderHeatmap()} ${this._renderCelebration()}
      ${this._renderDialog()}
    </ha-card>`:this._warning(ve(this.hass,"entity_not_found",{entity:e}))}_warning(e){return L`<ha-card><div class="warning">${e}</div></ha-card>`}_renderHeader(e){const t=e=>{const t=this._number(e);return void 0===t?"–":be(this.hass,t)},i=t("current_streak"),s=t("best_streak");return L`<div class="header">
      <ha-icon .icon=${e.icon}></ha-icon>
      <span class="name">${e.name}</span>
      ${this._show("show_streak")?L`<span class="streak" title=${ve(this.hass,"current_streak")}>
            🔥 <span class="current">${i}</span>
            <span class="best">· ${ve(this.hass,"best")} ${s}</span>
          </span>`:W}
    </div>`}_ended(){return 0===this._number("days_left")}_show(e){return!1!==this._config?.[e]}_renderValue(e){const t=this._ended(),i=this._number(t?"total":"today"),s=this._number(t?"target_to_date":"today_target"),a=t?void 0!==i&&void 0!==s&&i>=s:"on"===this._state("goal_reached_today"),n=a?1:void 0!==i&&s?Math.min(1,i/s):0,r=this.hass?.states[e.entities.today]?.attributes.unit_of_measurement??e.unit;return L`<div class="value-area">
      <svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
        ${F`<circle class="track" cx="60" cy="60" r=${52}></circle>
          <circle
            class="progress ${a?"reached":""}"
            cx="60"
            cy="60"
            r=${52}
            stroke-dasharray=${Be}
            stroke-dashoffset=${Be*(1-n)}
            transform="rotate(-90 60 60)"
          ></circle>`}
      </svg>
      ${t||e.today_from_source?L`<div class="value">${this._renderFigures(i,s,r)}</div>`:this._editing?L`<input
            class="value-input"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            aria-label=${ve(this.hass,"edit_value")}
            .value=${this._editValue}
            @keydown=${this._inputKeyDown}
            @blur=${e=>this._commit(e.target)}
          />`:L`<div
            class="value"
            role="button"
            tabindex="0"
            title=${ve(this.hass,"edit_value")}
            @pointerdown=${this._pointerDown}
            @pointerup=${this._clearPress}
            @pointerleave=${this._clearPress}
            @pointercancel=${this._clearPress}
            @contextmenu=${e=>e.preventDefault()}
            @keydown=${this._valueKeyDown}
          >
            ${this._renderFigures(i,s,r)}
          </div>`}
    </div>`}_renderFigures(e,t,i){const s=e=>void 0===e?"–":be(this.hass,e),a=s(e),n=a.length>5?`font-size: ${Math.max(1,13/a.length).toFixed(2)}em`:W;return L`<span class="number" style=${n}>${a}</span>
      <span class="target">/ ${s(t)}</span>
      <span class="unit" title=${i}>${i}</span>`}_renderFinished(){const e=this.hass,t=this._number("total"),i=this._number("target_to_date");if(void 0===t||void 0===i)return W;const s=t>=i?ve(e,"finished_goal_reached"):ve(e,"finished",{percent:be(e,i?Math.floor(t/i*100):0)});return L`<div class="summary"><div class="finished">${s}</div></div>`}_renderSummary(){if(this._ended())return this._renderFinished();const e=this.hass,t=this._number("total"),i=this._number("target_to_date"),s=this._number("delta"),a=this._number("remaining"),n=this._challenge?.entities.today_target,r=n?e?.states[n]?.attributes:void 0,o=this._number("today_target"),l=Number(r?.daily_target),h=Number(r?.deficit),c=void 0!==o&&Number.isFinite(l)&&h>0&&o>l,d=[];this._show("show_target_vs_actual")&&void 0!==t&&void 0!==i&&d.push(L`<div class="target-vs-actual">
          ${ve(e,"target_vs_actual",{total:be(e,t),target:be(e,i)})}${void 0===s?W:L` ·
                <span class="delta ${s<0?"behind":"ahead"}"
                  >${Ae(e,s)}</span
                >`}
        </div>`);const u=void 0===a?[]:this._remainingParts(a);return u.length&&d.push(L`<div class="remaining">
          ${u.map((e,t)=>L`${t?" · ":""}<span class="part">${e}</span>`)}
        </div>`),this._show("show_catch_up")&&c&&d.push(L`<div class="catch-up">
          ${"on"===this._state("goal_reached_today")?ve(e,"caught_up"):ve(e,"catch_up",{target:be(e,l),deficit:be(e,h)})}
        </div>`),d.length?L`<div class="summary">${d}</div>`:W}_remainingParts(e){const t=this.hass,i=this._number("days_left"),s=this._number("required_per_day"),a=be(t,e),n=[];return this._show("show_remaining")&&(1===i?n.push(ve(t,"left_to_goal_last_day",{remaining:a})):void 0!==i&&i>1?n.push(ve(t,"left_in_days",{remaining:a,days:be(t,i)})):n.push(ve(t,"left_to_goal",{remaining:a}))),this._show("show_required_average")&&void 0!==i&&i>1&&void 0!==s&&n.push(ve(t,"required_per_day",{per_day:be(t,s)})),n}_renderButtons(e){if(!this._show("show_buttons")||this._ended()||e.today_from_source)return W;const t=t=>{const i=e.entities[t];return void 0!==i&&void 0!==this.hass?.states[i]},i=We(e.entities),s=i.filter(e=>t(`add_${e}`)),a=void 0===this._number("today_target");return L`<div class="buttons">
      ${t("subtract")&&i.length?L`<button
            class="subtract"
            ?disabled=${a}
            @click=${()=>this._press("subtract")}
          >
            −${i[0]}
          </button>`:W}
      ${s.map(e=>L`<button
            class="add"
            ?disabled=${a}
            @click=${()=>this._press(`add_${e}`)}
          >
            +${e}
          </button>`)}
    </div>`}_watchCelebrations(){const e=this._challenge;if(!e||!this.hass)return;const t=this._state("goal_reached_today"),i=e.entities.milestone,s=i?this.hass.states[i]:void 0,a=this._show("show_celebration");a&&"off"===this._lastGoal&&"on"===t&&this._celebrate(),a&&s&&void 0!==this._lastMilestone&&"unavailable"!==this._lastMilestone&&s.state!==this._lastMilestone&&!Fe.has(s.state)&&this._celebrate(this._milestoneMessage(s.attributes)),this._lastGoal=t,this._lastMilestone=s?.state}_milestoneMessage(e){const t=e.event_type,i=Number(e.value);if(!Number.isFinite(i))return;const s=this.hass?.states[this._challenge?.entities.today??""]?.attributes.unit_of_measurement??this._challenge?.unit??"",a={value:be(this.hass,i),unit:s};switch(t){case"streak":return ve(this.hass,"celebrate_streak",a);case"best_streak":return ve(this.hass,"celebrate_best_streak",a);case"best_day":return ve(this.hass,"celebrate_best_day",a);case"total":return ve(this.hass,"celebrate_total",a);default:return}}_celebrate(e){const t=(this._celebration?.id??0)+1,i=e??this._celebration?.message,s=Array.from({length:24},(e,t)=>{const i=t/24*2*Math.PI+.4*Math.random(),s=70+60*Math.random();return{x:Math.round(Math.cos(i)*s),y:Math.round(Math.sin(i)*s),rotate:Math.round(720*Math.random()-360),delay:Math.round(150*Math.random()),color:qe[t%qe.length]}});this._celebration={id:t,message:i,pieces:s},clearTimeout(this._celebrationTimer),this._celebrationTimer=setTimeout(()=>{this._celebration?.id===t&&(this._celebration=void 0)},3e3)}_renderCelebration(){const e=this._celebration;return e?L`<div class="celebration" aria-live="polite">
      ${e.pieces.map(e=>L`<span
            class="confetti"
            style="--x: ${e.x}px; --y: ${e.y}px; --r: ${e.rotate}deg; --delay: ${e.delay}ms; background: ${e.color}"
          ></span>`)}
      ${e.message?L`<div class="celebration-message">${e.message}</div>`:W}
    </div>`:W}_renderStats(){if(!this._show("show_stats"))return W;const e=this.hass,t=(t,i="")=>{const s=this._number(t);return void 0===s?"–":`${be(e,s)}${i}`},i=[[ve(e,"stat_total"),t("total")],[ve(e,"stat_average"),t("average")],[ve(e,"stat_best_day"),t("best_day")],[ve(e,"stat_best_streak"),t("best_streak")]];return L`<div class="stats">
      ${i.map(([e,t])=>L`<div class="stat">
            <span class="stat-value">${t}</span>
            <span class="stat-label">${e}</span>
          </div>`)}
    </div>`}_formatDate(e,t){return function(e,t,i){const[s,a,n]=t.split("-").map(Number),r=fe(e),o=`${r}|${JSON.stringify(i)}`;try{let e=we.get(o);return e||(e=new Intl.DateTimeFormat(r,{...i,timeZone:"UTC"}),we.set(o,e)),e.format(new Date(Date.UTC(s,a-1,n)))}catch{return t}}(this.hass,e,t)}_cellTitle(e){const t=this._formatDate(e.date,{dateStyle:"medium"});if(!e.inPeriod)return t;return`${t}: ${`${be(this.hass,e.value)} / ${be(this.hass,e.target)}`}${e.fulfilled?" ✓":e.rescuable?` · ${ve(this.hass,"rescuable")}`:""}`}_renderHeatmap(){const e=this._history;if(!this._show("show_heatmap")||!e)return W;const t=[e,this._config?.heatmap_range,this._focusDate,this.hass?.locale?.language,this.hass?.locale?.number_format],i=this._heatmapCache;if(i&&i.key.every((e,i)=>e===t[i]))return i.template;const s=this._buildHeatmap(e);return this._heatmapCache={key:t,template:s},s}_buildHeatmap(e){const t=function(e,t){const i=Object.keys(e.targets).sort();if(0===i.length)return{weeks:[],months:[]};const s=_e(i[i.length-1]),a=_e(i[0]),n=de[t],r=s-(s+3)%7-7*(n-1),o=new Set(e.rescuable??[]),l=[],h=[];for(let t=0;t<n;t++){const i=[];for(let n=0;n<7;n++){const l=r+7*t+n;if(l>s){i.push(null);continue}const c=ge(l);(c.endsWith("-01")||0===t&&0===n)&&h.push({week:t,date:c});const d=l>=a&&c in e.targets,u=e.days[c]??0,_=e.targets[c]??0;i.push({date:c,inPeriod:d,value:u,target:_,fulfilled:d&&!0===e.fulfilled[c],rescuable:d&&o.has(c),last:l===s,ratio:_>0?Math.min(1,u/_):u>0?1:0})}l.push(i)}const c=Math.max(3,Math.round(n/8)),d=[];for(const e of[...h].reverse()){const t=d[0];(!t||t.week-e.week>=c)&&d.unshift(e)}return{weeks:l,months:d}}(e,this._config?.heatmap_range??"year");if(!t.weeks.length)return W;const i=13*t.weeks.length-3,s=t.weeks.flat().filter(e=>null!==e),a=s.find(e=>e.date===this._focusDate)?.date??s[s.length-1]?.date,n=t.weeks.flatMap((e,t)=>e.map((e,i)=>{if(!e)return W;const s=this._cellTitle(e),n=["cell",e.inPeriod?e.fulfilled?"fulfilled":0===e.value?"empty":"partial":"outside",e.rescuable?"rescuable":"",e.last?"last":""].join(" ");return F`<rect
          class=${n}
          x=${13*t}
          y=${13*i}
          width="10"
          height="10"
          rx="2"
          opacity=${function(e){return e.inPeriod&&0!==e.value?e.fulfilled?.45+.55*e.ratio:.2+.6*e.ratio:1}(e)}
          data-date=${e.date}
          role=${e.inPeriod?"button":"presentation"}
          tabindex=${e.date===a?0:-1}
          aria-label=${s}
          @click=${()=>this._openDay(e)}
        ><title>${s}</title></rect>`})),r=t.months.map(e=>L`<span class="month" style="left: ${13*e.week/i*100}%"
          >${this._formatDate(e.date,{month:"short"})}</span
        >`);return L`<div class="heatmap">
      <div class="heatmap-grid" style="max-width: ${22*t.weeks.length}px">
        <div class="months">${r}</div>
        <svg
          viewBox="0 0 ${i} ${88}"
          role="group"
          aria-label=${ve(this.hass,"heatmap")}
          @keydown=${e=>this._heatmapKeyDown(e,s)}
        >
          ${n}
        </svg>
      </div>
    </div>`}_heatmapKeyDown(e,t){const i=e.target?.getAttribute?.("data-date"),s=t.find(e=>e.date===i);if(!s)return;if("Enter"===e.key||" "===e.key)return e.preventDefault(),void this._openDay(s);const a={ArrowLeft:-7,ArrowRight:7,ArrowUp:-1,ArrowDown:1,Home:-1/0,End:1/0};if(!(e.key in a))return;e.preventDefault();const n=a[e.key],r=Number.isFinite(n)?t.find(e=>e.date===function(e,t){return ge(_e(e)+t)}(s.date,n)):n<0?t[0]:t[t.length-1];r&&(this._focusDate=r.date)}_openDay(e){e.inPeriod&&(this._focusDate=e.date,this._dialog={cell:e,value:String(e.value)})}_closeDay(){this._dialog=void 0}_dialogFromSource(e){return Boolean(this._challenge?.today_from_source&&e.last&&!this._ended())}async _saveDay(){const e=this._dialog,t=this._challenge;if(!e||e.saving||!t||!this.hass)return;const i=e.value.trim(),s=Number(i);if(""===i||!Number.isInteger(s)||s<0)return void(this._dialog={...e,error:ve(this.hass,"invalid_value")});const a=this._history?.days[e.cell.date]??e.cell.value;if(s===a)return void this._closeDay();const n=i=>this.hass?.callWS({type:"daily_challenge/set_day",entry_id:t.entry_id,date:e.cell.date,value:i}),r={...e,saving:!0,error:void 0};this._dialog=r;try{await n(s)}catch(t){const i=xe(t);return void(this._dialog===r?this._dialog={...e,error:i}:this._notify({message:i}))}this._dialog===r&&this._closeDay(),this._notify({message:ve(this.hass,"change",{name:t.name,change:`${this._formatDate(e.cell.date,{dateStyle:"medium"})}: ${be(this.hass,s)}`}),duration:ze,action:{text:ve(this.hass,"undo"),action:()=>{Promise.resolve(n(a)).catch(e=>this._notify({message:xe(e)}))}}})}_dialogKeyDown(e){"Escape"===e.key?(e.preventDefault(),e.stopPropagation(),this._closeDay()):"Enter"===e.key&&e.target?.classList?.contains("day-input")&&(e.preventDefault(),e.stopPropagation(),this._saveDay())}_renderDialog(){const e=this._dialog;if(!e)return W;const t=this.hass,i=e.cell,s=this._dialogFromSource(i),a=i.fulfilled?ve(t,"day_fulfilled"):i.rescuable?ve(t,"rescuable"):ve(t,"day_not_fulfilled");return L`<div class="backdrop" @click=${this._closeDay}>
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
          ${ve(t,"day_target",{target:be(t,i.target)})} ·
          ${a}
        </div>
        <label class="dialog-field">
          <span>${ve(t,"day_value")}</span>
          <input
            class="day-input"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            .value=${e.value}
            ?disabled=${s}
            @input=${t=>{this._dialog={...e,value:t.target.value,error:void 0}}}
          />
        </label>
        ${s?L`<div class="dialog-note">${ve(t,"day_from_source")}</div>`:W}
        ${e.error?L`<div class="dialog-error">${e.error}</div>`:W}
        <div class="dialog-actions">
          <button class="cancel" @click=${this._closeDay}>
            ${ve(t,"cancel")}
          </button>
          ${s?W:L`<button class="save" @click=${()=>this._saveDay()}>
                ${ve(t,"save")}
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
  `}customElements.get(je)||customElements.define(je,Ke);const Ze=window;Ze.customCards??=[],Ze.customCards.some(e=>e.type===je)||Ze.customCards.push({type:je,name:ve(void 0,"card_name"),description:ve(void 0,"card_description"),preview:!0,documentationURL:"https://github.com/Skylolerr/ha-daily-challenge"});export{je as CARD_TYPE,Ie as CELEBRATION_MS,Ke as DailyChallengeCard,Re as LONG_PRESS_MS,He as LOOKUP_RETRY_MS,ze as UNDO_MS,Ve as findStubEntity};
