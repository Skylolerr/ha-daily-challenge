/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,e=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),i=new WeakMap;let n=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const s=this.t;if(e&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=i.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&i.set(s,t))}return t}toString(){return this.cssText}};const r=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,s,i)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[i+1],t[0]);return new n(i,t,s)},a=e?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:o,defineProperty:h,getOwnPropertyDescriptor:l,getOwnPropertyNames:c,getOwnPropertySymbols:d,getPrototypeOf:_}=Object,u=globalThis,g=u.trustedTypes,p=g?g.emptyScript:"",f=u.reactiveElementPolyfillSupport,m=(t,e)=>t,y={toAttribute(t,e){switch(e){case Boolean:t=t?p:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},v=(t,e)=>!o(t,e),$={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:v};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let b=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=$){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,e);void 0!==i&&h(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){const{get:i,set:n}=l(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:i,set(e){const r=i?.call(this);n?.call(this,e),this.requestUpdate(t,r,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??$}static _$Ei(){if(this.hasOwnProperty(m("elementProperties")))return;const t=_(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(m("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(m("properties"))){const t=this.properties,e=[...c(t),...d(t)];for(const s of e)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,s]of e)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const s=this._$Eu(t,e);void 0!==s&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const s=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((s,i)=>{if(e)s.adoptedStyleSheets=i.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const e of i){const i=document.createElement("style"),n=t.litNonce;void 0!==n&&i.setAttribute("nonce",n),i.textContent=e.cssText,s.appendChild(i)}})(s,this.constructor.elementStyles),s}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(void 0!==i&&!0===s.reflect){const n=(void 0!==s.converter?.toAttribute?s.converter:y).toAttribute(e,s.type);this._$Em=t,null==n?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(t,e){const s=this.constructor,i=s._$Eh.get(t);if(void 0!==i&&this._$Em!==i){const t=s.getPropertyOptions(i),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:y;this._$Em=i;const r=n.fromAttribute(e,t.type);this[i]=r??this._$Ej?.get(i)??r,this._$Em=null}}requestUpdate(t,e,s,i=!1,n){if(void 0!==t){const r=this.constructor;if(!1===i&&(n=this[t]),s??=r.getPropertyOptions(t),!((s.hasChanged??v)(n,e)||s.useDefault&&s.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,s))))return;this.C(t,e,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:n},r){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==n||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),!0===i&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,s]of t){const{wrapped:t}=s,i=this[e];!0!==t||this._$AL.has(e)||void 0===i||this.C(e,void 0,s,i)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[m("elementProperties")]=new Map,b[m("finalized")]=new Map,f?.({ReactiveElement:b}),(u.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w=globalThis,A=t=>t,E=w.trustedTypes,S=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,C="$lit$",x=`lit$${Math.random().toFixed(9).slice(2)}$`,k="?"+x,P=`<${k}>`,N=document,U=()=>N.createComment(""),T=t=>null===t||"object"!=typeof t&&"function"!=typeof t,D=Array.isArray,O="[ \t\n\f\r]",M=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,H=/>/g,j=RegExp(`>|${O}(?:([^\\s"'>=/]+)(${O}*=${O}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),z=/'/g,q=/"/g,I=/^(?:script|style|textarea|title)$/i,L=t=>(e,...s)=>({_$litType$:t,strings:e,values:s}),B=L(1),V=L(2),W=Symbol.for("lit-noChange"),F=Symbol.for("lit-nothing"),K=new WeakMap,Z=N.createTreeWalker(N,129);function J(t,e){if(!D(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const G=(t,e)=>{const s=t.length-1,i=[];let n,r=2===e?"<svg>":3===e?"<math>":"",a=M;for(let e=0;e<s;e++){const s=t[e];let o,h,l=-1,c=0;for(;c<s.length&&(a.lastIndex=c,h=a.exec(s),null!==h);)c=a.lastIndex,a===M?"!--"===h[1]?a=R:void 0!==h[1]?a=H:void 0!==h[2]?(I.test(h[2])&&(n=RegExp("</"+h[2],"g")),a=j):void 0!==h[3]&&(a=j):a===j?">"===h[0]?(a=n??M,l=-1):void 0===h[1]?l=-2:(l=a.lastIndex-h[2].length,o=h[1],a=void 0===h[3]?j:'"'===h[3]?q:z):a===q||a===z?a=j:a===R||a===H?a=M:(a=j,n=void 0);const d=a===j&&t[e+1].startsWith("/>")?" ":"";r+=a===M?s+P:l>=0?(i.push(o),s.slice(0,l)+C+s.slice(l)+x+d):s+x+(-2===l?e:d)}return[J(t,r+(t[s]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),i]};class Q{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let n=0,r=0;const a=t.length-1,o=this.parts,[h,l]=G(t,e);if(this.el=Q.createElement(h,s),Z.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(i=Z.nextNode())&&o.length<a;){if(1===i.nodeType){if(i.hasAttributes())for(const t of i.getAttributeNames())if(t.endsWith(C)){const e=l[r++],s=i.getAttribute(t).split(x),a=/([.?@])?(.*)/.exec(e);o.push({type:1,index:n,name:a[2],strings:s,ctor:"."===a[1]?st:"?"===a[1]?it:"@"===a[1]?nt:et}),i.removeAttribute(t)}else t.startsWith(x)&&(o.push({type:6,index:n}),i.removeAttribute(t));if(I.test(i.tagName)){const t=i.textContent.split(x),e=t.length-1;if(e>0){i.textContent=E?E.emptyScript:"";for(let s=0;s<e;s++)i.append(t[s],U()),Z.nextNode(),o.push({type:2,index:++n});i.append(t[e],U())}}}else if(8===i.nodeType)if(i.data===k)o.push({type:2,index:n});else{let t=-1;for(;-1!==(t=i.data.indexOf(x,t+1));)o.push({type:7,index:n}),t+=x.length-1}n++}}static createElement(t,e){const s=N.createElement("template");return s.innerHTML=t,s}}function X(t,e,s=t,i){if(e===W)return e;let n=void 0!==i?s._$Co?.[i]:s._$Cl;const r=T(e)?void 0:e._$litDirective$;return n?.constructor!==r&&(n?._$AO?.(!1),void 0===r?n=void 0:(n=new r(t),n._$AT(t,s,i)),void 0!==i?(s._$Co??=[])[i]=n:s._$Cl=n),void 0!==n&&(e=X(t,n._$AS(t,e.values),n,i)),e}class Y{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??N).importNode(e,!0);Z.currentNode=i;let n=Z.nextNode(),r=0,a=0,o=s[0];for(;void 0!==o;){if(r===o.index){let e;2===o.type?e=new tt(n,n.nextSibling,this,t):1===o.type?e=new o.ctor(n,o.name,o.strings,this,t):6===o.type&&(e=new rt(n,this,t)),this._$AV.push(e),o=s[++a]}r!==o?.index&&(n=Z.nextNode(),r++)}return Z.currentNode=N,i}p(t){let e=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class tt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=F,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=X(this,t,e),T(t)?t===F||null==t||""===t?(this._$AH!==F&&this._$AR(),this._$AH=F):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>D(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==F&&T(this._$AH)?this._$AA.nextSibling.data=t:this.T(N.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,i="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=Q.createElement(J(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{const t=new Y(i,this),s=t.u(this.options);t.p(e),this.T(s),this._$AH=t}}_$AC(t){let e=K.get(t.strings);return void 0===e&&K.set(t.strings,e=new Q(t)),e}k(t){D(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,i=0;for(const n of t)i===e.length?e.push(s=new tt(this.O(U()),this.O(U()),this,this.options)):s=e[i],s._$AI(n),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class et{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,n){this.type=1,this._$AH=F,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=n,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=F}_$AI(t,e=this,s,i){const n=this.strings;let r=!1;if(void 0===n)t=X(this,t,e,0),r=!T(t)||t!==this._$AH&&t!==W,r&&(this._$AH=t);else{const i=t;let a,o;for(t=n[0],a=0;a<n.length-1;a++)o=X(this,i[s+a],e,a),o===W&&(o=this._$AH[a]),r||=!T(o)||o!==this._$AH[a],o===F?t=F:t!==F&&(t+=(o??"")+n[a+1]),this._$AH[a]=o}r&&!i&&this.j(t)}j(t){t===F?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class st extends et{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===F?void 0:t}}class it extends et{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==F)}}class nt extends et{constructor(t,e,s,i,n){super(t,e,s,i,n),this.type=5}_$AI(t,e=this){if((t=X(this,t,e,0)??F)===W)return;const s=this._$AH,i=t===F&&s!==F||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,n=t!==F&&(s===F||i);i&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class rt{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){X(this,t)}}const at=w.litHtmlPolyfillSupport;at?.(Q,tt),(w.litHtmlVersions??=[]).push("3.3.3");const ot=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class ht extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,s)=>{const i=s?.renderBefore??e;let n=i._$litPart$;if(void 0===n){const t=s?.renderBefore??null;i._$litPart$=n=new tt(e.insertBefore(U(),t),t,void 0,s??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}ht._$litElement$=!0,ht.finalized=!0,ot.litElementHydrateSupport?.({LitElement:ht});const lt=ot.litElementPolyfillSupport;lt?.({LitElement:ht}),(ot.litElementVersions??=[]).push("4.2.2");const ct={best:"Best",card_description:"Track today's progress of a daily challenge.",card_name:"Daily Challenge",catch_up:"Today: {target} + {deficit} deficit",caught_up:"Deficit made up ✓",challenge:"Challenge",change:"{name}: {change}",current_streak:"Current streak",edit_value:"Enter today's value",entity_not_found:"Entity not found: {entity}",finished:"Challenge finished · {percent}%",finished_goal_reached:"Challenge finished · goal reached ✓",left_in_days:"{remaining} left in {days} days",left_to_goal:"{remaining} left to goal",left_to_goal_last_day:"{remaining} left on the last day",missing_entity:"Please define an entity of a Daily Challenge.",no_challenges:"No Daily Challenge set up yet.",not_a_challenge:"{entity} does not belong to a Daily Challenge.",required_per_day:"Ø {per_day}/day",show_buttons:"Show buttons",show_catch_up:"Show catch-up deficit",show_remaining:"Show what is left until the end goal",show_required_average:"Show required average per day",show_streak:"Show streak",show_target_vs_actual:"Show actual vs. target",target_vs_actual:"Actual {total} / Target {target}",undo:"Undo"},dt={de:{best:"Rekord",card_description:"Zeigt den heutigen Fortschritt einer täglichen Challenge.",card_name:"Daily Challenge",catch_up:"Heute: {target} + {deficit} Rückstand",caught_up:"Rückstand aufgeholt ✓",challenge:"Challenge",change:"{name}: {change}",current_streak:"Aktueller Streak",edit_value:"Heutigen Wert eingeben",entity_not_found:"Entität nicht gefunden: {entity}",finished:"Challenge abgeschlossen · {percent} %",finished_goal_reached:"Challenge abgeschlossen · Ziel erreicht ✓",left_in_days:"Noch {remaining} in {days} Tagen",left_to_goal:"Noch {remaining} bis zum Ziel",left_to_goal_last_day:"Noch {remaining} am letzten Tag",missing_entity:"Bitte gib eine Entität einer Daily Challenge an.",no_challenges:"Noch keine Daily Challenge eingerichtet.",not_a_challenge:"{entity} gehört zu keiner Daily Challenge.",required_per_day:"Ø {per_day}/Tag",show_buttons:"Buttons anzeigen",show_catch_up:"Rückstand beim Aufholen anzeigen",show_remaining:"Rest bis zum Ziel anzeigen",show_required_average:"Nötigen Schnitt pro Tag anzeigen",show_streak:"Streak anzeigen",show_target_vs_actual:"Ist / Soll anzeigen",target_vs_actual:"Ist {total} / Soll {target}",undo:"Rückgängig"},en:ct,fr:{best:"Record",card_description:"Affiche la progression du jour d'un défi quotidien.",card_name:"Daily Challenge",catch_up:"Aujourd'hui : {target} + {deficit} de retard",caught_up:"Retard rattrapé ✓",challenge:"Défi",change:"{name} : {change}",current_streak:"Série actuelle",edit_value:"Saisir la valeur du jour",entity_not_found:"Entité introuvable : {entity}",finished:"Challenge terminé · {percent} %",finished_goal_reached:"Challenge terminé · objectif atteint ✓",left_in_days:"Encore {remaining} en {days} jours",left_to_goal:"Encore {remaining} jusqu'à l'objectif",left_to_goal_last_day:"Encore {remaining} le dernier jour",missing_entity:"Veuillez indiquer une entité d'un Daily Challenge.",no_challenges:"Aucun Daily Challenge configuré pour l'instant.",not_a_challenge:"{entity} n'appartient à aucun Daily Challenge.",required_per_day:"Ø {per_day}/jour",show_buttons:"Afficher les boutons",show_catch_up:"Afficher le retard à rattraper",show_remaining:"Afficher le reste jusqu'à l'objectif",show_required_average:"Afficher la moyenne nécessaire par jour",show_streak:"Afficher la série",show_target_vs_actual:"Afficher réel / objectif",target_vs_actual:"Réel {total} / Objectif {target}",undo:"Annuler"},it:{best:"Record",card_description:"Mostra i progressi di oggi di una sfida giornaliera.",card_name:"Daily Challenge",catch_up:"Oggi: {target} + {deficit} di ritardo",caught_up:"Ritardo recuperato ✓",challenge:"Sfida",change:"{name}: {change}",current_streak:"Serie attuale",edit_value:"Inserisci il valore di oggi",entity_not_found:"Entità non trovata: {entity}",finished:"Challenge conclusa · {percent} %",finished_goal_reached:"Challenge conclusa · obiettivo raggiunto ✓",left_in_days:"Ancora {remaining} in {days} giorni",left_to_goal:"Ancora {remaining} all'obiettivo",left_to_goal_last_day:"Ancora {remaining} nell'ultimo giorno",missing_entity:"Indica un'entità di una Daily Challenge.",no_challenges:"Nessuna Daily Challenge configurata.",not_a_challenge:"{entity} non appartiene a nessuna Daily Challenge.",required_per_day:"Ø {per_day}/giorno",show_buttons:"Mostra pulsanti",show_catch_up:"Mostra ritardo da recuperare",show_remaining:"Mostra quanto manca all'obiettivo",show_required_average:"Mostra media necessaria al giorno",show_streak:"Mostra serie",show_target_vs_actual:"Mostra effettivo / obiettivo",target_vs_actual:"Effettivo {total} / Obiettivo {target}",undo:"Annulla"}};function _t(t){return t?.locale.language||("undefined"==typeof document?"":document.documentElement.lang)||"en"}function ut(t,e,s={}){return(i=_t(t),dt[i]??dt[i.split("-")[0]]??ct)[e].replace(/\{(\w+)\}/g,(t,e)=>e in s?s[e]:t);var i}const gt={comma_decimal:["en-US","en"],decimal_comma:["de","es","it"],quote_decimal:["de-CH"],space_comma:["fr","sv","cs"],system:void 0};function pt(t,e){const s=t?.locale.number_format??"language",i=s in gt?gt[s]:"none"===s?["en-US"]:[_t(t)];try{return new Intl.NumberFormat(i,{useGrouping:"none"!==s}).format(e)}catch{return String(e)}}function ft(t,e){return 0===e?"±0":`${e>0?"+":"−"}${pt(t,Math.abs(e))}`}const mt=["show_streak","show_target_vs_actual","show_remaining","show_required_average","show_catch_up","show_buttons"],yt="daily-challenge-card-editor";class vt extends ht{static properties={hass:{attribute:!1},_config:{state:!0},_challenges:{state:!0}};_loading=!1;setConfig(t){this._config=t}willUpdate(t){t.has("hass")&&this.hass&&!this._loading&&!this._challenges&&(this._loading=!0,this._load())}async _load(){try{const t=await(this.hass?.callWS({type:"daily_challenge/list"}));this._challenges=t?.challenges??[]}catch{this._challenges=[]}finally{this._loading=!1}}_selected(){const t=this._config?.entity;return this._challenges?.find(e=>Object.values(e.entities).includes(t??""))?.entry_id}_schema(t){return[{name:"challenge",required:!0,selector:{select:{mode:"dropdown",options:t.map(t=>({value:t.entry_id,label:t.name}))}}},...mt.map(t=>({name:t,selector:{boolean:{}}}))]}_formData(){const t={challenge:this._selected()};for(const e of mt)t[e]=!1!==this._config?.[e];return t}_valueChanged(t){if(t.stopPropagation(),!this._config)return;const e=t.detail.value,s=e.challenge===this._selected()?void 0:this._challenges?.find(t=>t.entry_id===e.challenge),i={...this._config,entity:s?.entities.today??this._config.entity};for(const t of mt)!1===e[t]?i[t]=!1:delete i[t];JSON.stringify(i)!==JSON.stringify(this._config)&&(this._config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0})))}render(){return this.hass&&this._config&&this._challenges?0===this._challenges.length?B`<p>${ut(this.hass,"no_challenges")}</p>`:B`<ha-form
      .hass=${this.hass}
      .data=${this._formData()}
      .schema=${this._schema(this._challenges)}
      .computeLabel=${t=>ut(this.hass,t.name)}
      @value-changed=${this._valueChanged}
    ></ha-form>`:F}}customElements.get(yt)||customElements.define(yt,vt);const $t="daily-challenge-card",bt=500,wt=5e3,At=8e3,Et=2*Math.PI*52,St=Symbol("not loaded"),Ct=new Set(["unknown","unavailable"]);function xt(t){const e=Object.values(t?.entities??{}).find(t=>"daily_challenge"===t.platform&&"today"===t.translation_key);return e?.entity_id??""}function kt(t){return Object.keys(t).filter(t=>/^add_\d+$/.test(t)).map(t=>Number(t.slice(4))).sort((t,e)=>t-e)}class Pt extends ht{static properties={hass:{attribute:!1},_config:{state:!0},_challenge:{state:!0},_editing:{state:!0},_history:{state:!0}};static getConfigElement(){return document.createElement(yt)}static getStubConfig(t){return{type:`custom:${$t}`,entity:xt(t)}}_entitiesSeen=St;_pressTimer;_committing=!1;_historyTotal;_lookupId=0;_historyId=0;_retryAt=0;_editValue="";constructor(){super(),this._editing=!1}setConfig(t){if(!t?.entity)throw new Error(ut(this.hass,"missing_entity"));t.entity!==this._config?.entity&&(this._challenge=void 0,this._history=void 0,this._historyTotal=void 0,this._entitiesSeen=St),this._config=t}getCardSize(){if(this._ended())return 6;return 5+(Number(this._show("show_target_vs_actual"))+Number(this._show("show_remaining")||this._show("show_required_average")))+Number(this._show("show_buttons"))}willUpdate(t){this.hass&&this._config&&this.hass.entities!==this._entitiesSeen&&Date.now()>=this._retryAt&&(this._entitiesSeen=this.hass.entities,this._loadChallenge());const e=this._state("total");this._challenge&&void 0!==e&&e!==this._historyTotal&&(this._historyTotal=e,this._loadHistory(this._challenge.entry_id))}get history(){return this._history}async _loadHistory(t){const e=++this._historyId;try{const s=await(this.hass?.callWS({type:"daily_challenge/history",entry_id:t}));e===this._historyId&&t===this._challenge?.entry_id&&(this._history=s)}catch{}}updated(t){if(t.has("_editing"))if(this._editing){const t=this.renderRoot.querySelector("input");t?.focus(),t?.select(),document.addEventListener("pointerdown",this._outsidePointer,!0)}else document.removeEventListener("pointerdown",this._outsidePointer,!0)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("pointerdown",this._outsidePointer,!0),this._clearPress()}_outsidePointer=t=>{const e=this.renderRoot.querySelector("input");e&&!t.composedPath().includes(e)&&this._commit(e)};async _loadChallenge(){const t=this._config?.entity;if(!this.hass||!t)return;const e=++this._lookupId;try{const s=await this.hass.callWS({type:"daily_challenge/list"});if(e!==this._lookupId||t!==this._config?.entity)return;this._challenge=s.challenges.find(e=>Object.values(e.entities).includes(t))??null}catch{if(e!==this._lookupId)return;this._entitiesSeen=St,this._retryAt=Date.now()+5e3}}_state(t){const e=this._challenge?.entities[t];return e?this.hass?.states[e]?.state:void 0}_number(t){const e=this._state(t);if(void 0===e||Ct.has(e))return;const s=Number(e);return Number.isFinite(s)?s:void 0}async _call(t,e,s){try{return await(this.hass?.callService(t,e,s)),!0}catch(t){return this._notify({message:t instanceof Error?t.message:String(t)}),!1}}_notify(t){this.dispatchEvent(new CustomEvent("hass-notification",{detail:t,bubbles:!0,composed:!0}))}_offerUndo(t,e,s,i){this._notify({message:ut(this.hass,"change",{name:t.name,change:e}),duration:8e3,action:{text:ut(this.hass,"undo"),action:()=>{this._call("daily_challenge",s,{config_entry_id:t.entry_id,...i})}}})}async _press(t){const e=this._challenge,s=e?.entities[t];if(!e||!s)return;const i=this._number("today"),n="subtract"===t?-(kt(e.entities)[0]??0):Number(t.slice(4)),r=void 0!==i&&n<0?Math.max(n,-i):n;await this._call("button","press",{entity_id:s})&&r&&this._offerUndo(e,ft(this.hass,r),"add",{amount:-r})}_pointerDown(){this._clearPress(),this._pressTimer=setTimeout(()=>this._startEdit(),500)}_clearPress(){clearTimeout(this._pressTimer),this._pressTimer=void 0}_valueKeyDown(t){"Enter"!==t.key&&" "!==t.key||(t.preventDefault(),this._startEdit())}_startEdit(){this._clearPress();const t=this._number("today");void 0!==t&&(this._editValue=String(t),this._committing=!1,this._editing=!0)}_inputKeyDown(t){"Enter"===t.key?(t.preventDefault(),t.stopPropagation(),this._commit(t.target)):"Escape"===t.key&&(t.preventDefault(),t.stopPropagation(),this._committing=!0,this._editing=!1)}async _commit(t){if(this._committing)return;this._committing=!0,this._editing=!1;const e=Number(t.value),s=this._challenge?.entities.today,i=this._number("today");s&&void 0!==i&&""!==t.value.trim()&&Number.isInteger(e)&&e>=0&&e!==i&&await this._call("number","set_value",{entity_id:s,value:e})&&this._challenge&&this._offerUndo(this._challenge,pt(this.hass,e),"set",{value:i})}render(){if(!this._config||!this.hass)return F;const t=this._config.entity;return this.hass.states[t]?void 0===this._challenge?B`<ha-card></ha-card>`:null===this._challenge?this._warning(ut(this.hass,"not_a_challenge",{entity:t})):B`<ha-card>
      ${this._renderHeader(this._challenge)} ${this._renderValue(this._challenge)}
      ${this._renderSummary()} ${this._renderButtons(this._challenge)}
    </ha-card>`:this._warning(ut(this.hass,"entity_not_found",{entity:t}))}_warning(t){return B`<ha-card><div class="warning">${t}</div></ha-card>`}_renderHeader(t){const e=t=>{const e=this._number(t);return void 0===e?"–":pt(this.hass,e)},s=e("current_streak"),i=e("best_streak");return B`<div class="header">
      <ha-icon .icon=${t.icon}></ha-icon>
      <span class="name">${t.name}</span>
      ${this._show("show_streak")?B`<span class="streak" title=${ut(this.hass,"current_streak")}>
            🔥 <span class="current">${s}</span>
            <span class="best">· ${ut(this.hass,"best")} ${i}</span>
          </span>`:F}
    </div>`}_ended(){return 0===this._number("days_left")}_show(t){return!1!==this._config?.[t]}_renderValue(t){const e=this._ended(),s=this._number(e?"total":"today"),i=this._number(e?"target_to_date":"today_target"),n=e?void 0!==s&&void 0!==i&&s>=i:"on"===this._state("goal_reached_today"),r=n?1:void 0!==s&&i?Math.min(1,s/i):0,a=this.hass?.states[t.entities.today]?.attributes.unit_of_measurement??t.unit;return B`<div class="value-area">
      <svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
        ${V`<circle class="track" cx="60" cy="60" r=${52}></circle>
          <circle
            class="progress ${n?"reached":""}"
            cx="60"
            cy="60"
            r=${52}
            stroke-dasharray=${Et}
            stroke-dashoffset=${Et*(1-r)}
            transform="rotate(-90 60 60)"
          ></circle>`}
      </svg>
      ${e?B`<div class="value">${this._renderFigures(s,i,a)}</div>`:this._editing?B`<input
            class="value-input"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            aria-label=${ut(this.hass,"edit_value")}
            .value=${this._editValue}
            @keydown=${this._inputKeyDown}
            @blur=${t=>this._commit(t.target)}
          />`:B`<div
            class="value"
            role="button"
            tabindex="0"
            title=${ut(this.hass,"edit_value")}
            @pointerdown=${this._pointerDown}
            @pointerup=${this._clearPress}
            @pointerleave=${this._clearPress}
            @pointercancel=${this._clearPress}
            @contextmenu=${t=>t.preventDefault()}
            @keydown=${this._valueKeyDown}
          >
            ${this._renderFigures(s,i,a)}
          </div>`}
    </div>`}_renderFigures(t,e,s){const i=t=>void 0===t?"–":pt(this.hass,t);return B`<span class="number">${i(t)}</span>
      <span class="target">/ ${i(e)}</span>
      <span class="unit">${s}</span>`}_renderFinished(){const t=this.hass,e=this._number("total"),s=this._number("target_to_date");if(void 0===e||void 0===s)return F;const i=e>=s?ut(t,"finished_goal_reached"):ut(t,"finished",{percent:pt(t,s?Math.floor(e/s*100):0)});return B`<div class="summary"><div class="finished">${i}</div></div>`}_renderSummary(){if(this._ended())return this._renderFinished();const t=this.hass,e=this._number("total"),s=this._number("target_to_date"),i=this._number("delta"),n=this._number("remaining"),r=this._challenge?.entities.today_target,a=r?t?.states[r]?.attributes:void 0,o=this._number("today_target"),h=Number(a?.daily_target),l=Number(a?.deficit),c=void 0!==o&&Number.isFinite(h)&&l>0&&o>h,d=[];this._show("show_target_vs_actual")&&void 0!==e&&void 0!==s&&d.push(B`<div class="target-vs-actual">
          ${ut(t,"target_vs_actual",{total:pt(t,e),target:pt(t,s)})}${void 0===i?F:B` ·
                <span class="delta ${i<0?"behind":"ahead"}"
                  >${ft(t,i)}</span
                >`}
        </div>`);const _=void 0===n?[]:this._remainingParts(n);return _.length&&d.push(B`<div class="remaining">
          ${_.map((t,e)=>B`${e?" · ":""}<span class="part">${t}</span>`)}
        </div>`),this._show("show_catch_up")&&c&&d.push(B`<div class="catch-up">
          ${"on"===this._state("goal_reached_today")?ut(t,"caught_up"):ut(t,"catch_up",{target:pt(t,h),deficit:pt(t,l)})}
        </div>`),d.length?B`<div class="summary">${d}</div>`:F}_remainingParts(t){const e=this.hass,s=this._number("days_left"),i=this._number("required_per_day"),n=pt(e,t),r=[];return this._show("show_remaining")&&(1===s?r.push(ut(e,"left_to_goal_last_day",{remaining:n})):void 0!==s&&s>1?r.push(ut(e,"left_in_days",{remaining:n,days:pt(e,s)})):r.push(ut(e,"left_to_goal",{remaining:n}))),this._show("show_required_average")&&void 0!==s&&s>1&&void 0!==i&&r.push(ut(e,"required_per_day",{per_day:pt(e,i)})),r}_renderButtons(t){if(!this._show("show_buttons")||this._ended())return F;const e=e=>{const s=t.entities[e];return void 0!==s&&void 0!==this.hass?.states[s]},s=kt(t.entities),i=s.filter(t=>e(`add_${t}`)),n=void 0===this._number("today_target");return B`<div class="buttons">
      ${e("subtract")&&s.length?B`<button
            class="subtract"
            ?disabled=${n}
            @click=${()=>this._press("subtract")}
          >
            −${s[0]}
          </button>`:F}
      ${i.map(t=>B`<button
            class="add"
            ?disabled=${n}
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
  `}customElements.get($t)||customElements.define($t,Pt);const Nt=window;Nt.customCards??=[],Nt.customCards.some(t=>t.type===$t)||Nt.customCards.push({type:$t,name:ut(void 0,"card_name"),description:ut(void 0,"card_description"),preview:!0,documentationURL:"https://github.com/Skylolerr/ha-daily-challenge"});export{$t as CARD_TYPE,Pt as DailyChallengeCard,bt as LONG_PRESS_MS,wt as LOOKUP_RETRY_MS,At as UNDO_MS,xt as findStubEntity};
