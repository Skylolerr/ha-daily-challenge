/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,e=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),s=new WeakMap;let n=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const i=this.t;if(e&&void 0===t){const e=void 0!==i&&1===i.length;e&&(t=s.get(i)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&s.set(i,t))}return t}toString(){return this.cssText}};const a=(t,...e)=>{const s=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new n(s,t,i)},r=e?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,i))(e)})(t):t,{is:o,defineProperty:l,getOwnPropertyDescriptor:h,getOwnPropertyNames:c,getOwnPropertySymbols:d,getPrototypeOf:u}=Object,_=globalThis,g=_.trustedTypes,p=g?g.emptyScript:"",m=_.reactiveElementPolyfillSupport,f=(t,e)=>t,y={toAttribute(t,e){switch(e){case Boolean:t=t?p:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},v=(t,e)=>!o(t,e),$={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:v};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),_.litPropertyMetadata??=new WeakMap;let b=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=$){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&l(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const a=s?.call(this);n?.call(this,e),this.requestUpdate(t,a,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??$}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const t=this.properties,e=[...c(t),...d(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(r(t))}else void 0!==t&&e.push(r(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((i,s)=>{if(e)i.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const e of s){const s=document.createElement("style"),n=t.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=e.cssText,i.appendChild(s)}})(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:y;this._$Em=s;const a=n.fromAttribute(e,t.type);this[s]=a??this._$Ej?.get(s)??a,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const a=this.constructor;if(!1===s&&(n=this[t]),i??=a.getPropertyOptions(t),!((i.hasChanged??v)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(a._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},a){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??e??this[t]),!0!==n||void 0!==a)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[f("elementProperties")]=new Map,b[f("finalized")]=new Map,m?.({ReactiveElement:b}),(_.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w=globalThis,A=t=>t,S=w.trustedTypes,E=S?S.createPolicy("lit-html",{createHTML:t=>t}):void 0,x="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,k="?"+C,P=`<${k}>`,N=document,T=()=>N.createComment(""),D=t=>null===t||"object"!=typeof t&&"function"!=typeof t,U=Array.isArray,M="[ \t\n\f\r]",O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,H=/>/g,j=RegExp(`>|${M}(?:([^\\s"'>=/]+)(${M}*=${M}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),z=/'/g,I=/"/g,q=/^(?:script|style|textarea|title)$/i,L=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),B=L(1),F=L(2),V=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),J=new WeakMap,K=N.createTreeWalker(N,129);function Z(t,e){if(!U(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const G=(t,e)=>{const i=t.length-1,s=[];let n,a=2===e?"<svg>":3===e?"<math>":"",r=O;for(let e=0;e<i;e++){const i=t[e];let o,l,h=-1,c=0;for(;c<i.length&&(r.lastIndex=c,l=r.exec(i),null!==l);)c=r.lastIndex,r===O?"!--"===l[1]?r=R:void 0!==l[1]?r=H:void 0!==l[2]?(q.test(l[2])&&(n=RegExp("</"+l[2],"g")),r=j):void 0!==l[3]&&(r=j):r===j?">"===l[0]?(r=n??O,h=-1):void 0===l[1]?h=-2:(h=r.lastIndex-l[2].length,o=l[1],r=void 0===l[3]?j:'"'===l[3]?I:z):r===I||r===z?r=j:r===R||r===H?r=O:(r=j,n=void 0);const d=r===j&&t[e+1].startsWith("/>")?" ":"";a+=r===O?i+P:h>=0?(s.push(o),i.slice(0,h)+x+i.slice(h)+C+d):i+C+(-2===h?e:d)}return[Z(t,a+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Q{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,a=0;const r=t.length-1,o=this.parts,[l,h]=G(t,e);if(this.el=Q.createElement(l,i),K.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=K.nextNode())&&o.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(x)){const e=h[a++],i=s.getAttribute(t).split(C),r=/([.?@])?(.*)/.exec(e);o.push({type:1,index:n,name:r[2],strings:i,ctor:"."===r[1]?it:"?"===r[1]?st:"@"===r[1]?nt:et}),s.removeAttribute(t)}else t.startsWith(C)&&(o.push({type:6,index:n}),s.removeAttribute(t));if(q.test(s.tagName)){const t=s.textContent.split(C),e=t.length-1;if(e>0){s.textContent=S?S.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],T()),K.nextNode(),o.push({type:2,index:++n});s.append(t[e],T())}}}else if(8===s.nodeType)if(s.data===k)o.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(C,t+1));)o.push({type:7,index:n}),t+=C.length-1}n++}}static createElement(t,e){const i=N.createElement("template");return i.innerHTML=t,i}}function X(t,e,i=t,s){if(e===V)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const a=D(e)?void 0:e._$litDirective$;return n?.constructor!==a&&(n?._$AO?.(!1),void 0===a?n=void 0:(n=new a(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=X(t,n._$AS(t,e.values),n,s)),e}class Y{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??N).importNode(e,!0);K.currentNode=s;let n=K.nextNode(),a=0,r=0,o=i[0];for(;void 0!==o;){if(a===o.index){let e;2===o.type?e=new tt(n,n.nextSibling,this,t):1===o.type?e=new o.ctor(n,o.name,o.strings,this,t):6===o.type&&(e=new at(n,this,t)),this._$AV.push(e),o=i[++r]}a!==o?.index&&(n=K.nextNode(),a++)}return K.currentNode=N,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class tt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=X(this,t,e),D(t)?t===W||null==t||""===t?(this._$AH!==W&&this._$AR(),this._$AH=W):t!==this._$AH&&t!==V&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>U(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==W&&D(this._$AH)?this._$AA.nextSibling.data=t:this.T(N.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Q.createElement(Z(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Y(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=J.get(t.strings);return void 0===e&&J.set(t.strings,e=new Q(t)),e}k(t){U(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new tt(this.O(T()),this.O(T()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class et{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=W,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=W}_$AI(t,e=this,i,s){const n=this.strings;let a=!1;if(void 0===n)t=X(this,t,e,0),a=!D(t)||t!==this._$AH&&t!==V,a&&(this._$AH=t);else{const s=t;let r,o;for(t=n[0],r=0;r<n.length-1;r++)o=X(this,s[i+r],e,r),o===V&&(o=this._$AH[r]),a||=!D(o)||o!==this._$AH[r],o===W?t=W:t!==W&&(t+=(o??"")+n[r+1]),this._$AH[r]=o}a&&!s&&this.j(t)}j(t){t===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class it extends et{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===W?void 0:t}}class st extends et{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==W)}}class nt extends et{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=X(this,t,e,0)??W)===V)return;const i=this._$AH,s=t===W&&i!==W||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==W&&(i===W||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class at{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){X(this,t)}}const rt=w.litHtmlPolyfillSupport;rt?.(Q,tt),(w.litHtmlVersions??=[]).push("3.3.3");const ot=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class lt extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new tt(e.insertBefore(T(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}}lt._$litElement$=!0,lt.finalized=!0,ot.litElementHydrateSupport?.({LitElement:lt});const ht=ot.litElementPolyfillSupport;ht?.({LitElement:lt}),(ot.litElementVersions??=[]).push("4.2.2");const ct={add_amount:"Add {amount}",best:"Best",card_description:"Track today's progress of a daily challenge.",card_name:"Daily Challenge",catch_up:"Today: {target} + {deficit} deficit",caught_up:"Deficit made up ✓",challenge:"Challenge",change:"{name}: {change}",current_streak:"Current streak",edit_value:"Enter today's value",entities:"Challenges (empty: all)",entity_not_found:"Entity not found: {entity}",finished:"Challenge finished · {percent}%",finished_goal_reached:"Challenge finished · goal reached ✓",invalid_entities:"entities must be a list of entities.",left_in_days:"{remaining} left in {days} days",left_to_goal:"{remaining} left to goal",left_to_goal_last_day:"{remaining} left on the last day",missing_entity:"Please define an entity of a Daily Challenge.",no_challenges:"No Daily Challenge set up yet.",not_a_challenge:"{entity} does not belong to a Daily Challenge.",overview_description:"All challenges at a glance.",overview_ended:"Finished",overview_name:"Daily Challenge overview",required_per_day:"Ø {per_day}/day",show_buttons:"Show buttons",show_catch_up:"Show catch-up deficit",show_remaining:"Show what is left until the end goal",show_required_average:"Show required average per day",show_streak:"Show streak",show_target_vs_actual:"Show actual vs. target",target_vs_actual:"Actual {total} / Target {target}",title:"Title",undo:"Undo"},dt={de:{add_amount:"{amount} hinzufügen",best:"Rekord",card_description:"Zeigt den heutigen Fortschritt einer täglichen Challenge.",card_name:"Daily Challenge",catch_up:"Heute: {target} + {deficit} Rückstand",caught_up:"Rückstand aufgeholt ✓",challenge:"Challenge",change:"{name}: {change}",current_streak:"Aktueller Streak",edit_value:"Heutigen Wert eingeben",entities:"Challenges (leer: alle)",entity_not_found:"Entität nicht gefunden: {entity}",finished:"Challenge abgeschlossen · {percent} %",finished_goal_reached:"Challenge abgeschlossen · Ziel erreicht ✓",invalid_entities:"entities muss eine Liste von Entitäten sein.",left_in_days:"Noch {remaining} in {days} Tagen",left_to_goal:"Noch {remaining} bis zum Ziel",left_to_goal_last_day:"Noch {remaining} am letzten Tag",missing_entity:"Bitte gib eine Entität einer Daily Challenge an.",no_challenges:"Noch keine Daily Challenge eingerichtet.",not_a_challenge:"{entity} gehört zu keiner Daily Challenge.",overview_description:"Alle Challenges auf einen Blick.",overview_ended:"Beendet",overview_name:"Daily Challenge Übersicht",required_per_day:"Ø {per_day}/Tag",show_buttons:"Buttons anzeigen",show_catch_up:"Rückstand beim Aufholen anzeigen",show_remaining:"Rest bis zum Ziel anzeigen",show_required_average:"Nötigen Schnitt pro Tag anzeigen",show_streak:"Streak anzeigen",show_target_vs_actual:"Ist / Soll anzeigen",target_vs_actual:"Ist {total} / Soll {target}",title:"Titel",undo:"Rückgängig"},en:ct,fr:{add_amount:"Ajouter {amount}",best:"Record",card_description:"Affiche la progression du jour d'un défi quotidien.",card_name:"Daily Challenge",catch_up:"Aujourd'hui : {target} + {deficit} de retard",caught_up:"Retard rattrapé ✓",challenge:"Défi",change:"{name} : {change}",current_streak:"Série actuelle",edit_value:"Saisir la valeur du jour",entities:"Défis (vide : tous)",entity_not_found:"Entité introuvable : {entity}",finished:"Challenge terminé · {percent} %",finished_goal_reached:"Challenge terminé · objectif atteint ✓",invalid_entities:"entities doit être une liste d'entités.",left_in_days:"Encore {remaining} en {days} jours",left_to_goal:"Encore {remaining} jusqu'à l'objectif",left_to_goal_last_day:"Encore {remaining} le dernier jour",missing_entity:"Veuillez indiquer une entité d'un Daily Challenge.",no_challenges:"Aucun Daily Challenge configuré pour l'instant.",not_a_challenge:"{entity} n'appartient à aucun Daily Challenge.",overview_description:"Tous les défis en un coup d'œil.",overview_ended:"Terminé",overview_name:"Daily Challenge – aperçu",required_per_day:"Ø {per_day}/jour",show_buttons:"Afficher les boutons",show_catch_up:"Afficher le retard à rattraper",show_remaining:"Afficher le reste jusqu'à l'objectif",show_required_average:"Afficher la moyenne nécessaire par jour",show_streak:"Afficher la série",show_target_vs_actual:"Afficher réel / objectif",target_vs_actual:"Réel {total} / Objectif {target}",title:"Titre",undo:"Annuler"},it:{add_amount:"Aggiungi {amount}",best:"Record",card_description:"Mostra i progressi di oggi di una sfida giornaliera.",card_name:"Daily Challenge",catch_up:"Oggi: {target} + {deficit} di ritardo",caught_up:"Ritardo recuperato ✓",challenge:"Sfida",change:"{name}: {change}",current_streak:"Serie attuale",edit_value:"Inserisci il valore di oggi",entities:"Sfide (vuoto: tutte)",entity_not_found:"Entità non trovata: {entity}",finished:"Challenge conclusa · {percent} %",finished_goal_reached:"Challenge conclusa · obiettivo raggiunto ✓",invalid_entities:"entities deve essere un elenco di entità.",left_in_days:"Ancora {remaining} in {days} giorni",left_to_goal:"Ancora {remaining} all'obiettivo",left_to_goal_last_day:"Ancora {remaining} nell'ultimo giorno",missing_entity:"Indica un'entità di una Daily Challenge.",no_challenges:"Nessuna Daily Challenge configurata.",not_a_challenge:"{entity} non appartiene a nessuna Daily Challenge.",overview_description:"Tutte le sfide in un colpo d'occhio.",overview_ended:"Terminata",overview_name:"Daily Challenge – panoramica",required_per_day:"Ø {per_day}/giorno",show_buttons:"Mostra pulsanti",show_catch_up:"Mostra ritardo da recuperare",show_remaining:"Mostra quanto manca all'obiettivo",show_required_average:"Mostra media necessaria al giorno",show_streak:"Mostra serie",show_target_vs_actual:"Mostra effettivo / obiettivo",target_vs_actual:"Effettivo {total} / Obiettivo {target}",title:"Titolo",undo:"Annulla"}};function ut(t){return t?.locale.language||("undefined"==typeof document?"":document.documentElement.lang)||"en"}function _t(t,e,i={}){return(s=ut(t),dt[s]??dt[s.split("-")[0]]??ct)[e].replace(/\{(\w+)\}/g,(t,e)=>e in i?i[e]:t);var s}const gt={comma_decimal:["en-US","en"],decimal_comma:["de","es","it"],quote_decimal:["de-CH"],space_comma:["fr","sv","cs"],system:void 0};function pt(t,e){const i=t?.locale.number_format??"language",s=i in gt?gt[i]:"none"===i?["en-US"]:[ut(t)];try{return new Intl.NumberFormat(s,{useGrouping:"none"!==i}).format(e)}catch{return String(e)}}function mt(t,e){return 0===e?"±0":`${e>0?"+":"−"}${pt(t,Math.abs(e))}`}const ft=["show_streak","show_target_vs_actual","show_remaining","show_required_average","show_catch_up","show_buttons"],yt="daily-challenge-card-editor";class vt extends lt{static properties={hass:{attribute:!1},_config:{state:!0},_challenges:{state:!0}};_loading=!1;setConfig(t){this._config=t}willUpdate(t){t.has("hass")&&this.hass&&!this._loading&&!this._challenges&&(this._loading=!0,this._load())}async _load(){try{const t=await(this.hass?.callWS({type:"daily_challenge/list"}));this._challenges=t?.challenges??[]}catch{this._challenges=[]}finally{this._loading=!1}}_selected(){const t=this._config?.entity;return this._challenges?.find(e=>Object.values(e.entities).includes(t??""))?.entry_id}_schema(t){return[{name:"challenge",required:!0,selector:{select:{mode:"dropdown",options:t.map(t=>({value:t.entry_id,label:t.name}))}}},...ft.map(t=>({name:t,selector:{boolean:{}}}))]}_formData(){const t={challenge:this._selected()};for(const e of ft)t[e]=!1!==this._config?.[e];return t}_valueChanged(t){if(t.stopPropagation(),!this._config)return;const e=t.detail.value,i=e.challenge===this._selected()?void 0:this._challenges?.find(t=>t.entry_id===e.challenge),s={...this._config,entity:i?.entities.today??this._config.entity};for(const t of ft)!1===e[t]?s[t]=!1:delete s[t];JSON.stringify(s)!==JSON.stringify(this._config)&&(this._config=s,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:s},bubbles:!0,composed:!0})))}render(){return this.hass&&this._config&&this._challenges?0===this._challenges.length?B`<p>${_t(this.hass,"no_challenges")}</p>`:B`<ha-form
      .hass=${this.hass}
      .data=${this._formData()}
      .schema=${this._schema(this._challenges)}
      .computeLabel=${t=>_t(this.hass,t.name)}
      @value-changed=${this._valueChanged}
    ></ha-form>`:W}}customElements.get(yt)||customElements.define(yt,vt);const $t="daily-challenge-overview-card-editor",bt=[{name:"title",selector:{text:{}}},{name:"entities",selector:{entity:{multiple:!0,filter:[{integration:"daily_challenge",domain:"number"}]}}},{name:"show_buttons",selector:{boolean:{}}}];class wt extends lt{static properties={hass:{attribute:!1},_config:{state:!0}};setConfig(t){this._config=t}_valueChanged(t){if(t.stopPropagation(),!this._config)return;const e=t.detail.value,i={type:this._config.type},s="string"==typeof e.title?e.title.trim():"";s&&(i.title=s);const n=Array.isArray(e.entities)?e.entities.filter(Boolean):[];n.length&&(i.entities=n),!1===e.show_buttons&&(i.show_buttons=!1),JSON.stringify(i)!==JSON.stringify(this._config)&&(this._config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0})))}render(){if(!this.hass||!this._config)return W;const t={title:this._config.title??"",entities:this._config.entities??[],show_buttons:!1!==this._config.show_buttons};return B`<ha-form
      .hass=${this.hass}
      .data=${t}
      .schema=${bt}
      .computeLabel=${t=>_t(this.hass,t.name)}
      @value-changed=${this._valueChanged}
    ></ha-form>`}}customElements.get($t)||customElements.define($t,wt);const At="daily-challenge-overview-card",St=Symbol("not loaded"),Et=new Set(["unknown","unavailable"]);class xt extends lt{static properties={hass:{attribute:!1},_config:{state:!0},_challenges:{state:!0}};static getConfigElement(){return document.createElement($t)}static getStubConfig(){return{type:`custom:${At}`}}_entitiesSeen=St;_retryAt=0;_lookupId=0;setConfig(t){if(void 0!==t.entities&&!Array.isArray(t.entities))throw new Error(_t(this.hass,"invalid_entities"));this._config=t}getCardSize(){return Number(Boolean(this._config?.title))+Math.max(1,this._visible().length)}willUpdate(t){this.hass&&this.hass.entities!==this._entitiesSeen&&Date.now()>=this._retryAt&&(this._entitiesSeen=this.hass.entities,this._load())}async _load(){const t=++this._lookupId;try{const e=await(this.hass?.callWS({type:"daily_challenge/list"}));t===this._lookupId&&(this._challenges=e?.challenges??[])}catch{t===this._lookupId&&(this._entitiesSeen=St,this._retryAt=Date.now()+5e3)}}_visible(){const t=this._challenges??[],e=this._config?.entities??[];return 0===e.length?t:e.map(e=>t.find(t=>t.entities.today===e)).filter(t=>void 0!==t)}_state(t,e){const i=t.entities[e];return i?this.hass?.states[i]?.state:void 0}_number(t,e){const i=this._state(t,e);if(void 0===i||Et.has(i))return;const s=Number(i);return Number.isFinite(s)?s:void 0}_smallestStep(t){if(!1===this._config?.show_buttons||t.today_from_source)return;const e=Object.keys(t.entities).filter(t=>/^add_\d+$/.test(t)).map(t=>Number(t.slice(4))).sort((t,e)=>t-e).filter(e=>{const i=this._state(t,`add_${e}`);return void 0!==i&&"unavailable"!==i});return e[0]}_moreInfo(t){this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:t.entities.today},bubbles:!0,composed:!0}))}async _add(t,e,i){t.stopPropagation();try{await(this.hass?.callService("button","press",{entity_id:e.entities[`add_${i}`]}))}catch(t){this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:t instanceof Error?t.message:String(t)},bubbles:!0,composed:!0}))}}render(){if(!this._config||!this.hass)return W;const t=this._config.title?B`<h1 class="card-header">${this._config.title}</h1>`:W;if(void 0===this._challenges)return B`<ha-card>${t}</ha-card>`;const e=this._visible();return B`<ha-card>
      ${t}
      <div class="rows">
        ${e.length?e.map(t=>this._renderRow(t)):B`<div class="empty">${_t(this.hass,"no_challenges")}</div>`}
      </div>
    </ha-card>`}_renderRow(t){const e=this.hass,i=0===this._number(t,"days_left"),s=this._number(t,"today"),n=this._number(t,"today_target"),a="on"===this._state(t,"goal_reached_today"),r=this._number(t,"current_streak"),o=e?.states[t.entities.today]?.attributes.unit_of_measurement??t.unit,l=a?1:void 0!==s&&n?Math.min(1,s/n):0,h=t=>void 0===t?"–":pt(e,t),c=i?void 0:this._smallestStep(t);return B`<div
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
            class="fill ${a?"reached":""}"
            style="width: ${100*(i?0:l)}%"
          ></div>
        </div>
        <div class="figures">
          ${i?_t(e,"overview_ended"):B`${h(s)} / ${h(n)} ${o}`}
        </div>
      </div>
      <span class="streak" title=${_t(e,"current_streak")}
        >🔥 ${h(r)}</span
      >
      ${void 0===c?W:B`<button
            class="add"
            aria-label=${_t(e,"add_amount",{amount:String(c)})}
            @click=${e=>this._add(e,t,c)}
            @keydown=${t=>t.stopPropagation()}
          >
            +${c}
          </button>`}
    </div>`}static styles=a`
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
  `}customElements.get(At)||customElements.define(At,xt);const Ct=window;Ct.customCards??=[],Ct.customCards.some(t=>t.type===At)||Ct.customCards.push({type:At,name:_t(void 0,"overview_name"),description:_t(void 0,"overview_description"),preview:!0,documentationURL:"https://github.com/Skylolerr/ha-daily-challenge"});const kt="daily-challenge-card",Pt=500,Nt=5e3,Tt=8e3,Dt=2*Math.PI*52,Ut=Symbol("not loaded"),Mt=new Set(["unknown","unavailable"]);function Ot(t){const e=Object.values(t?.entities??{}).find(t=>"daily_challenge"===t.platform&&"today"===t.translation_key);return e?.entity_id??""}function Rt(t){return Object.keys(t).filter(t=>/^add_\d+$/.test(t)).map(t=>Number(t.slice(4))).sort((t,e)=>t-e)}class Ht extends lt{static properties={hass:{attribute:!1},_config:{state:!0},_challenge:{state:!0},_editing:{state:!0},_history:{state:!0}};static getConfigElement(){return document.createElement(yt)}static getStubConfig(t){return{type:`custom:${kt}`,entity:Ot(t)}}_entitiesSeen=Ut;_pressTimer;_committing=!1;_historyTotal;_lookupId=0;_historyId=0;_retryAt=0;_editValue="";constructor(){super(),this._editing=!1}setConfig(t){if(!t?.entity)throw new Error(_t(this.hass,"missing_entity"));t.entity!==this._config?.entity&&(this._challenge=void 0,this._history=void 0,this._historyTotal=void 0,this._entitiesSeen=Ut),this._config=t}getCardSize(){if(this._ended())return 6;const t=Number(this._show("show_target_vs_actual"))+Number(this._show("show_remaining")||this._show("show_required_average")),e=this._show("show_buttons")&&!this._challenge?.today_from_source;return 5+t+Number(e)}willUpdate(t){this.hass&&this._config&&this.hass.entities!==this._entitiesSeen&&Date.now()>=this._retryAt&&(this._entitiesSeen=this.hass.entities,this._loadChallenge());const e=this._state("total");this._challenge&&void 0!==e&&e!==this._historyTotal&&(this._historyTotal=e,this._loadHistory(this._challenge.entry_id))}get history(){return this._history}async _loadHistory(t){const e=++this._historyId;try{const i=await(this.hass?.callWS({type:"daily_challenge/history",entry_id:t}));e===this._historyId&&t===this._challenge?.entry_id&&(this._history=i)}catch{}}updated(t){if(t.has("_editing"))if(this._editing){const t=this.renderRoot.querySelector("input");t?.focus(),t?.select(),document.addEventListener("pointerdown",this._outsidePointer,!0)}else document.removeEventListener("pointerdown",this._outsidePointer,!0)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("pointerdown",this._outsidePointer,!0),this._clearPress()}_outsidePointer=t=>{const e=this.renderRoot.querySelector("input");e&&!t.composedPath().includes(e)&&this._commit(e)};async _loadChallenge(){const t=this._config?.entity;if(!this.hass||!t)return;const e=++this._lookupId;try{const i=await this.hass.callWS({type:"daily_challenge/list"});if(e!==this._lookupId||t!==this._config?.entity)return;this._challenge=i.challenges.find(e=>Object.values(e.entities).includes(t))??null}catch{if(e!==this._lookupId)return;this._entitiesSeen=Ut,this._retryAt=Date.now()+5e3}}_state(t){const e=this._challenge?.entities[t];return e?this.hass?.states[e]?.state:void 0}_number(t){const e=this._state(t);if(void 0===e||Mt.has(e))return;const i=Number(e);return Number.isFinite(i)?i:void 0}async _call(t,e,i){try{return await(this.hass?.callService(t,e,i)),!0}catch(t){return this._notify({message:t instanceof Error?t.message:String(t)}),!1}}_notify(t){this.dispatchEvent(new CustomEvent("hass-notification",{detail:t,bubbles:!0,composed:!0}))}_offerUndo(t,e,i,s){this._notify({message:_t(this.hass,"change",{name:t.name,change:e}),duration:8e3,action:{text:_t(this.hass,"undo"),action:()=>{this._call("daily_challenge",i,{config_entry_id:t.entry_id,...s})}}})}async _press(t){const e=this._challenge,i=e?.entities[t];if(!e||!i)return;const s=this._number("today"),n="subtract"===t?-(Rt(e.entities)[0]??0):Number(t.slice(4)),a=Number(this.hass?.states[e.entities.today]?.attributes.max),r=void 0!==s&&a>=s?a-s:n,o=void 0!==s&&n<0?Math.max(n,-s):Math.min(n,r);await this._call("button","press",{entity_id:i})&&o&&this._offerUndo(e,mt(this.hass,o),"add",{amount:-o})}_pointerDown(){this._clearPress(),this._pressTimer=setTimeout(()=>this._startEdit(),500)}_clearPress(){clearTimeout(this._pressTimer),this._pressTimer=void 0}_valueKeyDown(t){"Enter"!==t.key&&" "!==t.key||(t.preventDefault(),this._startEdit())}_startEdit(){if(this._clearPress(),this._challenge?.today_from_source)return;const t=this._number("today");void 0!==t&&(this._editValue=String(t),this._committing=!1,this._editing=!0)}_inputKeyDown(t){"Enter"===t.key?(t.preventDefault(),t.stopPropagation(),this._commit(t.target)):"Escape"===t.key&&(t.preventDefault(),t.stopPropagation(),this._committing=!0,this._editing=!1)}async _commit(t){if(this._committing)return;this._committing=!0,this._editing=!1;const e=Number(t.value),i=this._challenge?.entities.today,s=this._number("today");i&&void 0!==s&&""!==t.value.trim()&&Number.isInteger(e)&&e>=0&&e!==s&&await this._call("number","set_value",{entity_id:i,value:e})&&this._challenge&&this._offerUndo(this._challenge,pt(this.hass,e),"set",{value:s})}render(){if(!this._config||!this.hass)return W;const t=this._config.entity;return this.hass.states[t]?void 0===this._challenge?B`<ha-card></ha-card>`:null===this._challenge?this._warning(_t(this.hass,"not_a_challenge",{entity:t})):B`<ha-card>
      ${this._renderHeader(this._challenge)} ${this._renderValue(this._challenge)}
      ${this._renderSummary()} ${this._renderButtons(this._challenge)}
    </ha-card>`:this._warning(_t(this.hass,"entity_not_found",{entity:t}))}_warning(t){return B`<ha-card><div class="warning">${t}</div></ha-card>`}_renderHeader(t){const e=t=>{const e=this._number(t);return void 0===e?"–":pt(this.hass,e)},i=e("current_streak"),s=e("best_streak");return B`<div class="header">
      <ha-icon .icon=${t.icon}></ha-icon>
      <span class="name">${t.name}</span>
      ${this._show("show_streak")?B`<span class="streak" title=${_t(this.hass,"current_streak")}>
            🔥 <span class="current">${i}</span>
            <span class="best">· ${_t(this.hass,"best")} ${s}</span>
          </span>`:W}
    </div>`}_ended(){return 0===this._number("days_left")}_show(t){return!1!==this._config?.[t]}_renderValue(t){const e=this._ended(),i=this._number(e?"total":"today"),s=this._number(e?"target_to_date":"today_target"),n=e?void 0!==i&&void 0!==s&&i>=s:"on"===this._state("goal_reached_today"),a=n?1:void 0!==i&&s?Math.min(1,i/s):0,r=this.hass?.states[t.entities.today]?.attributes.unit_of_measurement??t.unit;return B`<div class="value-area">
      <svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
        ${F`<circle class="track" cx="60" cy="60" r=${52}></circle>
          <circle
            class="progress ${n?"reached":""}"
            cx="60"
            cy="60"
            r=${52}
            stroke-dasharray=${Dt}
            stroke-dashoffset=${Dt*(1-a)}
            transform="rotate(-90 60 60)"
          ></circle>`}
      </svg>
      ${e||t.today_from_source?B`<div class="value">${this._renderFigures(i,s,r)}</div>`:this._editing?B`<input
            class="value-input"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            aria-label=${_t(this.hass,"edit_value")}
            .value=${this._editValue}
            @keydown=${this._inputKeyDown}
            @blur=${t=>this._commit(t.target)}
          />`:B`<div
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
            ${this._renderFigures(i,s,r)}
          </div>`}
    </div>`}_renderFigures(t,e,i){const s=t=>void 0===t?"–":pt(this.hass,t),n=s(t),a=n.length>5?`font-size: ${Math.max(1,13/n.length).toFixed(2)}em`:W;return B`<span class="number" style=${a}>${n}</span>
      <span class="target">/ ${s(e)}</span>
      <span class="unit" title=${i}>${i}</span>`}_renderFinished(){const t=this.hass,e=this._number("total"),i=this._number("target_to_date");if(void 0===e||void 0===i)return W;const s=e>=i?_t(t,"finished_goal_reached"):_t(t,"finished",{percent:pt(t,i?Math.floor(e/i*100):0)});return B`<div class="summary"><div class="finished">${s}</div></div>`}_renderSummary(){if(this._ended())return this._renderFinished();const t=this.hass,e=this._number("total"),i=this._number("target_to_date"),s=this._number("delta"),n=this._number("remaining"),a=this._challenge?.entities.today_target,r=a?t?.states[a]?.attributes:void 0,o=this._number("today_target"),l=Number(r?.daily_target),h=Number(r?.deficit),c=void 0!==o&&Number.isFinite(l)&&h>0&&o>l,d=[];this._show("show_target_vs_actual")&&void 0!==e&&void 0!==i&&d.push(B`<div class="target-vs-actual">
          ${_t(t,"target_vs_actual",{total:pt(t,e),target:pt(t,i)})}${void 0===s?W:B` ·
                <span class="delta ${s<0?"behind":"ahead"}"
                  >${mt(t,s)}</span
                >`}
        </div>`);const u=void 0===n?[]:this._remainingParts(n);return u.length&&d.push(B`<div class="remaining">
          ${u.map((t,e)=>B`${e?" · ":""}<span class="part">${t}</span>`)}
        </div>`),this._show("show_catch_up")&&c&&d.push(B`<div class="catch-up">
          ${"on"===this._state("goal_reached_today")?_t(t,"caught_up"):_t(t,"catch_up",{target:pt(t,l),deficit:pt(t,h)})}
        </div>`),d.length?B`<div class="summary">${d}</div>`:W}_remainingParts(t){const e=this.hass,i=this._number("days_left"),s=this._number("required_per_day"),n=pt(e,t),a=[];return this._show("show_remaining")&&(1===i?a.push(_t(e,"left_to_goal_last_day",{remaining:n})):void 0!==i&&i>1?a.push(_t(e,"left_in_days",{remaining:n,days:pt(e,i)})):a.push(_t(e,"left_to_goal",{remaining:n}))),this._show("show_required_average")&&void 0!==i&&i>1&&void 0!==s&&a.push(_t(e,"required_per_day",{per_day:pt(e,s)})),a}_renderButtons(t){if(!this._show("show_buttons")||this._ended()||t.today_from_source)return W;const e=e=>{const i=t.entities[e];return void 0!==i&&void 0!==this.hass?.states[i]},i=Rt(t.entities),s=i.filter(t=>e(`add_${t}`)),n=void 0===this._number("today_target");return B`<div class="buttons">
      ${e("subtract")&&i.length?B`<button
            class="subtract"
            ?disabled=${n}
            @click=${()=>this._press("subtract")}
          >
            −${i[0]}
          </button>`:W}
      ${s.map(t=>B`<button
            class="add"
            ?disabled=${n}
            @click=${()=>this._press(`add_${t}`)}
          >
            +${t}
          </button>`)}
    </div>`}static styles=a`
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
  `}customElements.get(kt)||customElements.define(kt,Ht);const jt=window;jt.customCards??=[],jt.customCards.some(t=>t.type===kt)||jt.customCards.push({type:kt,name:_t(void 0,"card_name"),description:_t(void 0,"card_description"),preview:!0,documentationURL:"https://github.com/Skylolerr/ha-daily-challenge"});export{kt as CARD_TYPE,Ht as DailyChallengeCard,Pt as LONG_PRESS_MS,Nt as LOOKUP_RETRY_MS,Tt as UNDO_MS,Ot as findStubEntity};
