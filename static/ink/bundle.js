/**
 * Ink/JavaScript runtime/interop layer
 * implements Ink system interfaces for web and Node JS runtimes
 */

const __NODE = typeof process === 'object';

/* Ink builtins */

function args() {
	return process.argv;
}

function __ink_ident_in(cb) {
	// TODO
}

function out(s) {
	s = __as_ink_string(s);
	if (__NODE) {
		process.stdout.write(string(s).valueOf());
	} else {
		console.log(string(s).valueOf());
	}
	return null;
}

function dir(path, cb) {
	// TODO
}

function make(path, cb) {
	// TODO
}

function stat(path, cb) {
	// TODO
}

function read(path, offset, length, cb) {
	// TODO
}

function write(path, offset, data, cb) {
	// TODO
}

function __ink_ident_delete(path, cb) {
	// TODO
}

function listen(host, handler) {
	// TODO
}

function req(data, callback) {
	// TODO
}

function rand() {
	return Math.random();
}

function urand(length) {
	// TODO
}

function time() {
	return Date.now() / 1000;
}

function wait(duration, cb) {
	setTimeout(cb, duration * 1000);
	return null;
}

function exec(path, args, stdin, stdoutFn) {
	// TODO
}

function exit(code) {
	if (__NODE) {
		process.exit(code);
	} else {
		// TODO
	}
	return null;
}

function sin(n) {
	return Math.sin(n);
}

function cos(n) {
	return Math.cos(n);
}

function asin(n) {
	return Math.asin(n);
}

function acos(n) {
	return Math.acos(n);
}

function pow(b, n) {
	return Math.pow(b, n);
}

function ln(n) {
	return Math.log(n);
}

function floor(n) {
	return Math.floor(n);
}

function load(path) {
	if (__NODE) {
		return require(string(path).valueOf());
	} else {
		throw new Error('load() not implemented!');
	}
}

function __is_ink_string(x) {
	if (x == null) {
		return false;
	}
	return x.__mark_ink_string;
}

// both JS native strings and __Ink_Strings are valid in the runtime
// semantics but we want to coerce values to __Ink_Strings
// within runtime builtins; this utility fn is useful for this.
function __as_ink_string(x) {
	if (typeof x === 'string') {
		return __Ink_String(x);
	}
	return x;
}

function string(x) {
	x = __as_ink_string(x);
	if (x === null) {
		return '()';
	} else if (typeof x === 'number') {
		const sign = x > 0 ? 1 : -1;
		x = sign * x;
		const whole = Math.floor(x);
		const frac = x - whole;
		const wholeStr = (sign * whole).toString();
		if (frac == 0) {
			return wholeStr;
		} else {
			const fracStr = frac.toString().substr(0, 10).padEnd(10, '0').substr(1);
			return wholeStr + fracStr;
		}
	} else if (__is_ink_string(x)) {
		return x;
	} else if (typeof x === 'boolean') {
		return x.toString();
	} else if (typeof x === 'function') {
		return x.toString(); // implementation-dependent, not specified
	} else if (Array.isArray(x) || typeof x === 'object') {
		const entries = [];
		for (const key of keys(x)) {
			entries.push(`${key}: ${__is_ink_string(x[key]) ? `'${x[key].valueOf().replace('\\', '\\\\').replace('\'', '\\\'')}'` : string(x[key])}`);
		}
		return '{' + entries.join(', ') + '}';
	} else if (x === undefined) {
		return 'undefined'; // undefined behavior
	}
	throw new Error('string() called on unknown type ' + x);
}

function number(x) {
	x = __as_ink_string(x);
	if (x === null) {
		return 0;
	} else if (typeof x === 'number') {
		return x;
	} else if (__is_ink_string(x)) {
		const n = parseFloat(x);
		return isNaN(n) ? null : n;
	} else if (typeof x === 'boolean') {
		return x ? 1 : 0;
	}
	return 0;
}

function point(c) {
	c = __as_ink_string(c);
	return c.valueOf().charCodeAt(0);
}

function char(n) {
	return String.fromCharCode(n);
}

function type(x) {
	x = __as_ink_string(x);
	if (x === null) {
		return '()';
	} else if (typeof x === 'number') {
		return 'number';
	} else if (__is_ink_string(x)) {
		return 'string';
	} else if (typeof x === 'boolean') {
		return 'boolean'
	} else if (typeof x === 'function') {
		return 'function';
	} else if (Array.isArray(x) || typeof x === 'object') {
		return 'composite';
	}
	throw new Error('type() called on unknown type ' + x);
}

function len(x) {
	x = __as_ink_string(x);
	switch (type(x)) {
		case 'string':
			return x.valueOf().length;
		case 'composite':
			if (Array.isArray(x)) {
				// -1 for .length
				return Object.getOwnPropertyNames(x).length - 1;
			} else {
				return Object.getOwnPropertyNames(x).length;
			}
		default:
			throw new Error('len() takes a string or composite value, but got ' + string(x));
	}
}

function keys(x) {
	if (type(x).valueOf() === 'composite') {
		if (Array.isArray(x)) {
			return Object.getOwnPropertyNames(x).filter(name => name !== 'length');
		} else {
			return Object.getOwnPropertyNames(x);
		}
	}
	throw new Error('keys() takes a composite value, but got ' + string(x).valueOf());
}

/* Ink semantics polyfill */

function __ink_negate(x) {
	if (x === true) {
		return false;
	}
	if (x === false) {
		return true;
	}

	return -x;
}

function __ink_eq(a, b) {
	a = __as_ink_string(a);
	b = __as_ink_string(b);
	if (a === __Ink_Empty || b === __Ink_Empty) {
		return true;
	}

	if (a === null && b === null) {
		return true;
	}
	if (a === null || b === null) {
		return false;
	}

	if (typeof a !== typeof b) {
		return false;
	}
	if (__is_ink_string(a) && __is_ink_string(b)) {
		return a.valueOf() === b.valueOf();
	}
	if (typeof a === 'number' || typeof a === 'boolean' || typeof a === 'function') {
		return a === b;
	}

	// deep equality check for composite types
	if (typeof a !== 'object') {
		return false;
	}
	if (len(a) !== len(b)) {
		return false;
	}
	for (const key of keys(a)) {
		if (!__ink_eq(a[key], b[key])) {
			return false;
		}
	}
	return true;
}

function __ink_and(a, b) {
	if (typeof a === 'boolean' && typeof b === 'boolean') {
		return a && b;
	}

	if (__is_ink_string(a) && __is_ink_string(b)) {
		const max = Math.max(a.length, b.length);
		const get = (s, i) => s.valueOf().charCodeAt(i) || 0;

		let res = '';
		for (let i = 0; i < max; i ++) {
			res += String.fromCharCode(get(a, i) & get(b, i));
		}
		return res;
	}

	return a & b;
}

function __ink_or(a, b) {
	if (typeof a === 'boolean' && typeof b === 'boolean') {
		return a || b;
	}

	if (__is_ink_string(a) && __is_ink_string(b)) {
		const max = Math.max(a.length, b.length);
		const get = (s, i) => s.valueOf().charCodeAt(i) || 0;

		let res = '';
		for (let i = 0; i < max; i ++) {
			res += String.fromCharCode(get(a, i) | get(b, i));
		}
		return res;
	}

	return a | b;
}

function __ink_xor(a, b) {
	if (typeof a === 'boolean' && typeof b === 'boolean') {
		return (a && !b) || (!a && b);
	}

	if (__is_ink_string(a) && __is_ink_string(b)) {
		const max = Math.max(a.length, b.length);
		const get = (s, i) => s.valueOf().charCodeAt(i) || 0;

		let res = '';
		for (let i = 0; i < max; i ++) {
			res += String.fromCharCode(get(a, i) ^ get(b, i));
		}
		return res;
	}

	return a ^ b;
}

function __ink_match(cond, clauses) {
	for (const [target, expr] of clauses) {
		if (__ink_eq(cond, target())) {
			return expr();
		}
	}
	return null;
}

/* Ink types */

const __Ink_Empty = Symbol('__Ink_Empty');

const __Ink_String = s => {
	if (__is_ink_string(s)) return s;

	return {
		__mark_ink_string: true,
		assign(i, slice) {
			if (i === s.length) {
				return s += slice;
			}

			return s = s.substr(0, i) + slice + s.substr(i + slice.length);
		},
		toString() {
			return s;
		},
		valueOf() {
			return s;
		},
		get length() {
			return s.length;
		},
	}
}

/* TCE trampoline helpers */

function __ink_resolve_trampoline(fn, ...args) {
	let rv = fn(...args);
	while (rv && rv.__is_ink_trampoline) {
		rv = rv.fn(...rv.args);
	}
	return rv;
}

function __ink_trampoline(fn, ...args) {
	return {
		__is_ink_trampoline: true,
		fn: fn,
		args: args,
	}
}

/* Ink -> JavaScript interop helpers */

const bind = (target, fn) => target[fn].bind(target);

function jsnew(Constructor, args) {
	return new Constructor(...args);
}
!function(t){var e={};function s(r){if(e[r])return e[r].exports;var n=e[r]={i:r,l:!1,exports:{}};return t[r].call(n.exports,n,n.exports,s),n.l=!0,n.exports}s.m=t,s.c=e,s.d=function(t,e,r){s.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},s.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},s.t=function(t,e){if(1&e&&(t=s(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(s.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var n in t)s.d(r,n,function(e){return t[e]}.bind(null,n));return r},s.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return s.d(e,"a",e),e},s.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},s.p="",s(s.s=0)}([function(t,e,s){const{render:r,Component:n,Styled:o,StyledComponent:i,List:c,ListOf:l,Record:a,Store:d,StoreOf:u,Router:h}=s(1),{jdom:f,css:m}=s(2);t.exports={render:r,Component:n,Styled:o,StyledComponent:i,List:c,ListOf:l,Record:a,Store:d,StoreOf:u,Router:h,jdom:f,css:m}},function(t,e,s){let r=0;const n=t=>null!==t&&"object"==typeof t,o=t=>{void 0===t.attrs&&(t.attrs={}),void 0===t.events&&(t.events={}),void 0===t.children&&(t.children=[])},i=t=>Array.isArray(t)?t:[t],c=()=>document.createComment("");let l=[];const a={replaceChild:()=>{}};const d=(t,e,s)=>{for(const r of Object.keys(t)){const n=i(t[r]),o=i(e[r]||[]);for(const t of n)o.includes(t)||"function"!=typeof t||s(r,t)}},u=(t,e,s)=>{const i=e=>{t&&t!==e&&l.push([2,t,e]),t=e};if(r++,e!==s)if(null===s)i(c());else if("string"==typeof s||"number"==typeof s)"string"==typeof e||"number"==typeof e?t.data=s:i(document.createTextNode(s));else if(void 0!==s.appendChild)i(s);else{(void 0===t||!n(e)||e&&void 0!==e.appendChild||e.tag!==s.tag)&&(e={tag:null},i(document.createElement(s.tag))),o(e),o(s);for(const r of Object.keys(s.attrs)){const n=e.attrs[r],o=s.attrs[r];if("class"===r){const e=o;Array.isArray(e)?t.className=e.join(" "):t.className=e}else if("style"===r){const e=n||{},s=o;for(const r of Object.keys(s))s[r]!==e[r]&&(t.style[r]=s[r]);for(const r of Object.keys(e))void 0===s[r]&&(t.style[r]="")}else r in t?(t[r]!==o||void 0===n&&n!==o)&&(t[r]=o):n!==o&&t.setAttribute(r,o)}for(const r of Object.keys(e.attrs))void 0===s.attrs[r]&&(r in t?t[r]=null:t.removeAttribute(r));d(s.events,e.events,(e,s)=>{t.addEventListener(e,s)}),d(e.events,s.events,(e,s)=>{t.removeEventListener(e,s)});const r=e.children,c=s.children,a=r.length,h=c.length;if(h+a>0){const n=e._nodes||[],o=a<h?a:h;let i=0;for(;i<o;i++)r[i]!==c[i]&&(n[i]=u(n[i],r[i],c[i]));if(a<h)for(;i<h;i++){const e=u(void 0,void 0,c[i]);l.push([0,t,e]),n.push(e)}else{for(;i<a;i++)l.push([1,t,n[i]]);n.splice(h,a-h)}s._nodes=n}}return 0==--r&&function(){const t=l.length;for(let e=0;e<t;e++){const t=l[e],s=t[0];if(1===s)t[1].removeChild(t[2]);else if(2===s){const e=t[1],s=c(),r=e.parentNode;null!==r?(r.replaceChild(s,e),t[1]=s,t[3]=r):t[3]=a}}for(let e=0;e<t;e++){const t=l[e],s=t[0];0===s?t[1].appendChild(t[2]):2===s&&t[3].replaceChild(t[2],t[1])}l=[]}(),t};class h{constructor(...t){this.jdom=void 0,this.node=void 0,this.event={source:null,handler:()=>{}},this.init(...t),void 0===this.node&&this.render()}static from(t){return class extends h{init(...t){this.args=t}compose(){return t(...this.args)}}}init(){}get record(){return this.event.source}bind(t,e){if(this.unbind(),!(t instanceof j))throw new Error(`cannot bind to ${t}, which is not an instance of Evented.`);this.event={source:t,handler:e},t.addHandler(e)}unbind(){this.record&&this.record.removeHandler(this.event.handler),this.event={source:null,handler:()=>{}}}remove(){this.unbind()}compose(){return null}preprocess(t){return t}render(t){t=t||this.record&&this.record.summarize();const e=this.preprocess(this.compose(t),t);if(void 0===e)throw new Error(this.constructor.name+".compose() returned undefined.");try{this.node=u(this.node,this.jdom,e)}catch(t){console.error("rendering error.",t)}return this.jdom=e}}const f=new Set;let m;const p=new WeakMap,v=(t,e)=>t+"{"+e+"}",b=(t,e)=>{let s=[],r="";for(const n of Object.keys(e)){const o=e[n];if("@"===n[0])n.startsWith("@media")?s.push(v(n,b(t,o).join(""))):s.push(v(n,b("",o).join("")));else if("object"==typeof o){const e=n.split(",");for(const r of e)if(r.includes("&")){const e=r.replace(/&/g,t);s=s.concat(b(e,o))}else s=s.concat(b(t+" "+r,o))}else r+=n+":"+o+";"}return r&&s.unshift(v(t,r)),s},g=t=>{const e=(t=>{if(!p.has(t)){const e=JSON.stringify(t);let s=e.length,r=1989;for(;s;)r=13*r^e.charCodeAt(--s);p.set(t,"_torus"+(r>>>0))}return p.get(t)})(t);let s=0;if(!f.has(e)){m||(()=>{const t=document.createElement("style");t.setAttribute("data-torus",""),document.head.appendChild(t),m=t.sheet})();const r=b("."+e,t);for(const t of r)m.insertRule(t,s++);f.add(e)}return e},y=t=>class extends t{styles(){return{}}preprocess(t,e){return n(t)&&(t.attrs=t.attrs||{},t.attrs.class=i(t.attrs.class||[]),t.attrs.class.push(g(this.styles(e)))),t}};class x extends h{get itemClass(){return h}init(t,...e){this.store=t,this.items=new Map,this.filterFn=null,this.itemData=e,this.bind(this.store,()=>this.itemsChanged())}itemsChanged(){const t=this.store.summarize(),e=this.items;for(const s of e.keys())t.includes(s)||(e.get(s).remove(),e.delete(s));for(const s of t)e.has(s)||e.set(s,new this.itemClass(s,()=>this.store.remove(s),...this.itemData));let s=[...e.entries()];null!==this.filterFn&&(s=s.filter(t=>this.filterFn(t[0]))),s.sort((e,s)=>t.indexOf(e[0])-t.indexOf(s[0])),this.items=new Map(s),this.render()}filter(t){this.filterFn=t,this.itemsChanged()}unfilter(){this.filterFn=null,this.itemsChanged()}get components(){return[...this]}get nodes(){return this.components.map(t=>t.node)}[Symbol.iterator](){return this.items.values()}remove(){super.remove();for(const t of this.items.values())t.remove()}compose(){return{tag:"ul",children:this.nodes}}}class j{constructor(){this.handlers=new Set}summarize(){}emitEvent(){const t=this.summarize();for(const e of this.handlers)e(t)}addHandler(t){this.handlers.add(t),t(this.summarize())}removeHandler(t){this.handlers.delete(t)}}class w extends j{constructor(t,e={}){super(),n(t)&&(e=t,t=null),this.id=t,this.data=e}update(t){Object.assign(this.data,t),this.emitEvent()}get(t){return this.data[t]}summarize(){return Object.assign({id:this.id},this.data)}serialize(){return this.summarize()}}class O extends j{constructor(t=[]){super(),this.reset(t)}get recordClass(){return w}get comparator(){return null}create(t,e){return this.add(new this.recordClass(t,e))}add(t){return this.records.add(t),this.emitEvent(),t}remove(t){return this.records.delete(t),this.emitEvent(),t}[Symbol.iterator](){return this.records.values()}find(t){for(const e of this.records)if(e.id===t)return e;return null}reset(t){this.records=new Set(t),this.emitEvent()}summarize(){return[...this.records].map(t=>[this.comparator?this.comparator(t):null,t]).sort((t,e)=>t[0]<e[0]?-1:t[0]>e[0]?1:0).map(t=>t[1])}serialize(){return this.summarize().map(t=>t.serialize())}}const C=t=>{let e;const s=[];for(;null!==e;)if(e=/:\w+/.exec(t),e){const r=e[0];s.push(r.substr(1)),t=t.replace(r,"(.+)")}return[new RegExp(t),s]};const S={render:u,Component:h,Styled:y,StyledComponent:y(h),List:x,ListOf:t=>class extends x{get itemClass(){return t}},Record:w,Store:O,StoreOf:t=>class extends O{get recordClass(){return t}},Router:class extends j{constructor(t){super(),this.routes=Object.entries(t).map(([t,e])=>[t,...C(e)]),this.lastMatch=["",null],this._cb=()=>this.route(location.pathname),window.addEventListener("popstate",this._cb),this._cb()}summarize(){return this.lastMatch}go(t,{replace:e=!1}={}){window.location.pathname!==t&&(e?history.replaceState(null,document.title,t):history.pushState(null,document.title,t),this.route(t))}route(t){for(const[e,s,r]of this.routes){const n=s.exec(t);if(null!==n){const t={},s=n.slice(1);r.forEach((e,r)=>t[e]=s[r]),this.lastMatch=[e,t];break}}this.emitEvent()}remove(){window.removeEventListener("popstate",this._cb)}}};"object"==typeof window&&(window.Torus=S),t.exports&&(t.exports=S)},function(t,e,s){const r=t=>null!==t&&"object"==typeof t,n=(t,e)=>t.substr(0,t.length-e.length),o=(t,e)=>{let s=t[0];for(let r=1,n=e.length;r<=n;r++)s+=e[r-1]+t[r];return s};class i{constructor(t){this.idx=0,this.content=t,this.len=t.length}next(){const t=this.content[this.idx++];return void 0===t&&(this.idx=this.len),t}back(){this.idx--}readUpto(t){const e=this.content.substr(this.idx).indexOf(t);return this.toNext(e)}readUntil(t){const e=this.content.substr(this.idx).indexOf(t)+t.length;return this.toNext(e)}toNext(t){const e=this.content.substr(this.idx);if(-1===t)return this.idx=this.len,e;{const s=e.substr(0,t);return this.idx+=t,s}}clipEnd(t){return!!this.content.endsWith(t)&&(this.content=n(this.content,t),!0)}}const c=t=>{let e="";for(let s=0,r=t.length;s<r;s++)e+="-"===t[s]?t[++s].toUpperCase():t[s];return e},l=t=>{if("!"===(t=t.trim())[0])return{jdom:null,selfClosing:!0};if(!t.includes(" ")){const e=t.endsWith("/");return{jdom:{tag:e?n(t,"/"):t,attrs:{},events:{}},selfClosing:e}}const e=new i(t),s=e.clipEnd("/");let r="",o=!1,l=!1;const a=[];let d=0;const u=t=>{r=r.trim(),(""!==r||t)&&(a.push({type:d,value:r}),o=!1,r="")};for(let t=e.next();void 0!==t;t=e.next())switch(t){case"=":l?r+=t:(u(),o=!0,d=1);break;case" ":l?r+=t:o||(u(),d=0);break;case"\\":l&&(t=e.next(),r+=t);break;case'"':l?(l=!1,u(!0),d=0):1===d&&(l=!0);break;default:r+=t,o=!1}u();let h="";const f={},m={};h=a.shift().value;let p=null,v=a.shift();const b=()=>{p=v,v=a.shift()};for(;void 0!==v;){if(1===v.type){const t=p.value;let e=v.value.trim();if(t.startsWith("on"))m[t.substr(2)]=[e];else if("class"===t)""!==e&&(f[t]=e.split(" "));else if("style"===t){e.endsWith(";")&&(e=e.substr(0,e.length-1));const s={};for(const t of e.split(";")){const e=t.indexOf(":"),r=t.substr(0,e),n=t.substr(e+1);s[c(r.trim())]=n.trim()}f[t]=s}else f[t]=e;b()}else p&&(f[p.value]=!0);b()}return p&&0===p.type&&(f[p.value]=!0),{jdom:{tag:h,attrs:f,events:m},selfClosing:s}},a=t=>{const e=[];let s=null,r=!1;const n=()=>{r&&""===s.trim()||s&&e.push(s),s=null,r=!1},o=t=>{!1===r&&(n(),r=!0,s=""),s+=t};for(let e=t.next();void 0!==e;e=t.next())if("<"===e){if(n(),"/"===t.next()){t.readUntil(">");break}{t.back();const e=l(t.readUpto(">"));t.next(),s=e&&e.jdom,e.selfClosing||null===s||(s.children=a(t))}}else o("&"===e?(i=e+t.readUntil(";"),String.fromCodePoint(+/&#(\w+);/.exec(i)[1])):e);var i;return n(),e},d=new Map,u=/jdom_tpl_obj_\[(\d+)\]/,h=(t,e)=>{if((t=>"string"==typeof t&&t.includes("jdom_tpl_"))(t)){const s=u.exec(t),r=t.split(s[0]),n=s[1],o=h(r[1],e);let i=[];return""!==r[0]&&i.push(r[0]),Array.isArray(e[n])?i=i.concat(e[n]):i.push(e[n]),0!==o.length&&(i=i.concat(o)),i}return""!==t?[t]:[]},f=(t,e)=>{const s=[];for(const n of t)for(const t of h(n,e))r(t)&&v(t,e),s.push(t);const n=s[0],o=s[s.length-1];return"string"==typeof n&&""===n.trim()&&s.shift(),"string"==typeof o&&""===o.trim()&&s.pop(),s},m=(t,e)=>{if(t.length<14)return t;{const s=u.exec(t);if(null===s)return t;if(t.trim()===s[0])return e[s[1]];{const r=t.split(s[0]);return r[0]+e[s[1]]+m(r[1],e)}}},p=(t,e)=>{for(let s=0,r=t.length;s<r;s++){const r=t[s];"string"==typeof r?t[s]=m(r,e):Array.isArray(r)?p(r,e):v(r,e)}},v=(t,e)=>{for(const s of Object.keys(t)){const n=t[s];"string"==typeof n?t[s]=m(n,e):Array.isArray(n)?"children"===s?t.children=f(n,e):p(n,e):r(n)&&v(n,e)}},b=t=>{const e={};let s=0,r=["",""];const n=()=>{"string"==typeof r[1]?e[r[0].trim()]=r[1].trim():e[r[0].trim()]=r[1],r=["",""]};t.readUntil("{");for(let e=t.next();void 0!==e&&"}"!==e;e=t.next()){const o=r[0];switch(e){case'"':case"'":for(r[s]+=e+t.readUntil(e);r[s].endsWith("\\"+e);)r[s]+=t.readUntil(e);break;case":":""===o.trim()||o.includes("&")||o.includes("@")||o.includes(":")?r[s]+=e:s=1;break;case";":s=0,n();break;case"{":t.back(),r[1]=b(t),n();break;default:r[s]+=e}}return""!==r[0].trim()&&n(),e},g=new Map,y={jdom:(t,...e)=>{const s=t.join("jdom_tpl_joiner");try{if(!d.has(s)){const r=e.map((t,e)=>`jdom_tpl_obj_[${e}]`),n=new i(o(t.map(t=>t.replace(/\s+/g," ")),r)),c=a(n)[0],l=typeof c,u=JSON.stringify(c);d.set(s,t=>{if("string"===l)return m(c,t);if("object"===l){const e={},s=JSON.parse(u);return v(Object.assign(e,s),t),e}return null})}return d.get(s)(e)}catch(s){return console.error(`jdom parse error.\ncheck for mismatched brackets, tags, quotes.\n${o(t,e)}\n${s.stack||s}`),""}},css:(t,...e)=>{const s=o(t,e).trim();return g.has(s)||g.set(s,b(new i("{"+s+"}"))),g.get(s)}};"object"==typeof window&&Object.assign(window,y),t.exports&&(t.exports=y)}]);/*!
  Highlight.js v11.0.1 (git: 1cf31f015d)
  (c) 2006-2021 Ivan Sagalaev and other contributors
  License: BSD-3-Clause
 */
var hljs=function(){"use strict";var e={exports:{}};function n(e){
return e instanceof Map?e.clear=e.delete=e.set=()=>{
throw Error("map is read-only")}:e instanceof Set&&(e.add=e.clear=e.delete=()=>{
throw Error("set is read-only")
}),Object.freeze(e),Object.getOwnPropertyNames(e).forEach((t=>{var a=e[t]
;"object"!=typeof a||Object.isFrozen(a)||n(a)})),e}
e.exports=n,e.exports.default=n;var t=e.exports;class a{constructor(e){
void 0===e.data&&(e.data={}),this.data=e.data,this.isMatchIgnored=!1}
ignoreMatch(){this.isMatchIgnored=!0}}function i(e){
return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")
}function s(e,...n){const t=Object.create(null);for(const n in e)t[n]=e[n]
;return n.forEach((e=>{for(const n in e)t[n]=e[n]})),t}const r=e=>!!e.kind
;class o{constructor(e,n){
this.buffer="",this.classPrefix=n.classPrefix,e.walk(this)}addText(e){
this.buffer+=i(e)}openNode(e){if(!r(e))return;let n=e.kind
;n=e.sublanguage?"language-"+n:((e,{prefix:n})=>{if(e.includes(".")){
const t=e.split(".")
;return[`${n}${t.shift()}`,...t.map(((e,n)=>`${e}${"_".repeat(n+1)}`))].join(" ")
}return`${n}${e}`})(n,{prefix:this.classPrefix}),this.span(n)}closeNode(e){
r(e)&&(this.buffer+="</span>")}value(){return this.buffer}span(e){
this.buffer+=`<span class="${e}">`}}class l{constructor(){this.rootNode={
children:[]},this.stack=[this.rootNode]}get top(){
return this.stack[this.stack.length-1]}get root(){return this.rootNode}add(e){
this.top.children.push(e)}openNode(e){const n={kind:e,children:[]}
;this.add(n),this.stack.push(n)}closeNode(){
if(this.stack.length>1)return this.stack.pop()}closeAllNodes(){
for(;this.closeNode(););}toJSON(){return JSON.stringify(this.rootNode,null,4)}
walk(e){return this.constructor._walk(e,this.rootNode)}static _walk(e,n){
return"string"==typeof n?e.addText(n):n.children&&(e.openNode(n),
n.children.forEach((n=>this._walk(e,n))),e.closeNode(n)),e}static _collapse(e){
"string"!=typeof e&&e.children&&(e.children.every((e=>"string"==typeof e))?e.children=[e.children.join("")]:e.children.forEach((e=>{
l._collapse(e)})))}}class c extends l{constructor(e){super(),this.options=e}
addKeyword(e,n){""!==e&&(this.openNode(n),this.addText(e),this.closeNode())}
addText(e){""!==e&&this.add(e)}addSublanguage(e,n){const t=e.root
;t.kind=n,t.sublanguage=!0,this.add(t)}toHTML(){
return new o(this,this.options).value()}finalize(){return!0}}function d(e){
return e?"string"==typeof e?e:e.source:null}function g(e){return b("(?=",e,")")}
function u(e){return b("(?:",e,")?")}function b(...e){
return e.map((e=>d(e))).join("")}function m(...e){return"("+((e=>{
const n=e[e.length-1]
;return"object"==typeof n&&n.constructor===Object?(e.splice(e.length-1,1),n):{}
})(e).capture?"":"?:")+e.map((e=>d(e))).join("|")+")"}function p(e){
return RegExp(e.toString()+"|").exec("").length-1}
const _=/\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./
;function h(e,{joinWith:n}){let t=0;return e.map((e=>{t+=1;const n=t
;let a=d(e),i="";for(;a.length>0;){const e=_.exec(a);if(!e){i+=a;break}
i+=a.substring(0,e.index),
a=a.substring(e.index+e[0].length),"\\"===e[0][0]&&e[1]?i+="\\"+(Number(e[1])+n):(i+=e[0],
"("===e[0]&&t++)}return i})).map((e=>`(${e})`)).join(n)}
const f="[a-zA-Z]\\w*",E="[a-zA-Z_]\\w*",y="\\b\\d+(\\.\\d+)?",N="(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)",w="\\b(0b[01]+)",v={
begin:"\\\\[\\s\\S]",relevance:0},O={scope:"string",begin:"'",end:"'",
illegal:"\\n",contains:[v]},M={scope:"string",begin:'"',end:'"',illegal:"\\n",
contains:[v]},x=(e,n,t={})=>{const a=s({scope:"comment",begin:e,end:n,
contains:[]},t);a.contains.push({scope:"doctag",
begin:"[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
end:/(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,excludeBegin:!0,relevance:0})
;const i=m("I","a","is","so","us","to","at","if","in","it","on",/[A-Za-z]+['](d|ve|re|ll|t|s|n)/,/[A-Za-z]+[-][a-z]+/,/[A-Za-z][a-z]{2,}/)
;return a.contains.push({begin:b(/[ ]+/,"(",i,/[.]?[:]?([.][ ]|[ ])/,"){3}")}),a
},S=x("//","$"),k=x("/\\*","\\*/"),A=x("#","$");var C=Object.freeze({
__proto__:null,MATCH_NOTHING_RE:/\b\B/,IDENT_RE:f,UNDERSCORE_IDENT_RE:E,
NUMBER_RE:y,C_NUMBER_RE:N,BINARY_NUMBER_RE:w,
RE_STARTERS_RE:"!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",
SHEBANG:(e={})=>{const n=/^#![ ]*\//
;return e.binary&&(e.begin=b(n,/.*\b/,e.binary,/\b.*/)),s({scope:"meta",begin:n,
end:/$/,relevance:0,"on:begin":(e,n)=>{0!==e.index&&n.ignoreMatch()}},e)},
BACKSLASH_ESCAPE:v,APOS_STRING_MODE:O,QUOTE_STRING_MODE:M,PHRASAL_WORDS_MODE:{
begin:/\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
},COMMENT:x,C_LINE_COMMENT_MODE:S,C_BLOCK_COMMENT_MODE:k,HASH_COMMENT_MODE:A,
NUMBER_MODE:{scope:"number",begin:y,relevance:0},C_NUMBER_MODE:{scope:"number",
begin:N,relevance:0},BINARY_NUMBER_MODE:{scope:"number",begin:w,relevance:0},
REGEXP_MODE:{begin:/(?=\/[^/\n]*\/)/,contains:[{scope:"regexp",begin:/\//,
end:/\/[gimuy]*/,illegal:/\n/,contains:[v,{begin:/\[/,end:/\]/,relevance:0,
contains:[v]}]}]},TITLE_MODE:{scope:"title",begin:f,relevance:0},
UNDERSCORE_TITLE_MODE:{scope:"title",begin:E,relevance:0},METHOD_GUARD:{
begin:"\\.\\s*[a-zA-Z_]\\w*",relevance:0},END_SAME_AS_BEGIN:e=>Object.assign(e,{
"on:begin":(e,n)=>{n.data._beginMatch=e[1]},"on:end":(e,n)=>{
n.data._beginMatch!==e[1]&&n.ignoreMatch()}})});function T(e,n){
"."===e.input[e.index-1]&&n.ignoreMatch()}function R(e,n){
void 0!==e.className&&(e.scope=e.className,delete e.className)}function D(e,n){
n&&e.beginKeywords&&(e.begin="\\b("+e.beginKeywords.split(" ").join("|")+")(?!\\.)(?=\\b|\\s)",
e.__beforeBegin=T,e.keywords=e.keywords||e.beginKeywords,delete e.beginKeywords,
void 0===e.relevance&&(e.relevance=0))}function I(e,n){
Array.isArray(e.illegal)&&(e.illegal=m(...e.illegal))}function B(e,n){
if(e.match){
if(e.begin||e.end)throw Error("begin & end are not supported with match")
;e.begin=e.match,delete e.match}}function L(e,n){
void 0===e.relevance&&(e.relevance=1)}const $=(e,n)=>{if(!e.beforeMatch)return
;if(e.starts)throw Error("beforeMatch cannot be used with starts")
;const t=Object.assign({},e);Object.keys(e).forEach((n=>{delete e[n]
})),e.keywords=t.keywords,e.begin=b(t.beforeMatch,g(t.begin)),e.starts={
relevance:0,contains:[Object.assign(t,{endsParent:!0})]
},e.relevance=0,delete t.beforeMatch
},z=["of","and","for","in","not","or","if","then","parent","list","value"]
;function F(e,n,t="keyword"){const a=Object.create(null)
;return"string"==typeof e?i(t,e.split(" ")):Array.isArray(e)?i(t,e):Object.keys(e).forEach((t=>{
Object.assign(a,F(e[t],n,t))})),a;function i(e,t){
n&&(t=t.map((e=>e.toLowerCase()))),t.forEach((n=>{const t=n.split("|")
;a[t[0]]=[e,j(t[0],t[1])]}))}}function j(e,n){
return n?Number(n):(e=>z.includes(e.toLowerCase()))(e)?0:1}const U={},P=e=>{
console.error(e)},K=(e,...n)=>{console.log("WARN: "+e,...n)},q=(e,n)=>{
U[`${e}/${n}`]||(console.log(`Deprecated as of ${e}. ${n}`),U[`${e}/${n}`]=!0)
},H=Error();function G(e,n,{key:t}){let a=0;const i=e[t],s={},r={}
;for(let e=1;e<=n.length;e++)r[e+a]=i[e],s[e+a]=!0,a+=p(n[e-1])
;e[t]=r,e[t]._emit=s,e[t]._multi=!0}function Z(e){(e=>{
e.scope&&"object"==typeof e.scope&&null!==e.scope&&(e.beginScope=e.scope,
delete e.scope)})(e),"string"==typeof e.beginScope&&(e.beginScope={
_wrap:e.beginScope}),"string"==typeof e.endScope&&(e.endScope={_wrap:e.endScope
}),(e=>{if(Array.isArray(e.begin)){
if(e.skip||e.excludeBegin||e.returnBegin)throw P("skip, excludeBegin, returnBegin not compatible with beginScope: {}"),
H
;if("object"!=typeof e.beginScope||null===e.beginScope)throw P("beginScope must be object"),
H;G(e,e.begin,{key:"beginScope"}),e.begin=h(e.begin,{joinWith:""})}})(e),(e=>{
if(Array.isArray(e.end)){
if(e.skip||e.excludeEnd||e.returnEnd)throw P("skip, excludeEnd, returnEnd not compatible with endScope: {}"),
H
;if("object"!=typeof e.endScope||null===e.endScope)throw P("endScope must be object"),
H;G(e,e.end,{key:"endScope"}),e.end=h(e.end,{joinWith:""})}})(e)}function W(e){
function n(n,t){return RegExp(d(n),"m"+(e.case_insensitive?"i":"")+(t?"g":""))}
class t{constructor(){
this.matchIndexes={},this.regexes=[],this.matchAt=1,this.position=0}
addRule(e,n){
n.position=this.position++,this.matchIndexes[this.matchAt]=n,this.regexes.push([n,e]),
this.matchAt+=p(e)+1}compile(){0===this.regexes.length&&(this.exec=()=>null)
;const e=this.regexes.map((e=>e[1]));this.matcherRe=n(h(e,{joinWith:"|"
}),!0),this.lastIndex=0}exec(e){this.matcherRe.lastIndex=this.lastIndex
;const n=this.matcherRe.exec(e);if(!n)return null
;const t=n.findIndex(((e,n)=>n>0&&void 0!==e)),a=this.matchIndexes[t]
;return n.splice(0,t),Object.assign(n,a)}}class a{constructor(){
this.rules=[],this.multiRegexes=[],
this.count=0,this.lastIndex=0,this.regexIndex=0}getMatcher(e){
if(this.multiRegexes[e])return this.multiRegexes[e];const n=new t
;return this.rules.slice(e).forEach((([e,t])=>n.addRule(e,t))),
n.compile(),this.multiRegexes[e]=n,n}resumingScanAtSamePosition(){
return 0!==this.regexIndex}considerAll(){this.regexIndex=0}addRule(e,n){
this.rules.push([e,n]),"begin"===n.type&&this.count++}exec(e){
const n=this.getMatcher(this.regexIndex);n.lastIndex=this.lastIndex
;let t=n.exec(e)
;if(this.resumingScanAtSamePosition())if(t&&t.index===this.lastIndex);else{
const n=this.getMatcher(0);n.lastIndex=this.lastIndex+1,t=n.exec(e)}
return t&&(this.regexIndex+=t.position+1,
this.regexIndex===this.count&&this.considerAll()),t}}
if(e.compilerExtensions||(e.compilerExtensions=[]),
e.contains&&e.contains.includes("self"))throw Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.")
;return e.classNameAliases=s(e.classNameAliases||{}),function t(i,r){const o=i
;if(i.isCompiled)return o
;[R,B,Z,$].forEach((e=>e(i,r))),e.compilerExtensions.forEach((e=>e(i,r))),
i.__beforeBegin=null,[D,I,L].forEach((e=>e(i,r))),i.isCompiled=!0;let l=null
;return"object"==typeof i.keywords&&i.keywords.$pattern&&(i.keywords=Object.assign({},i.keywords),
l=i.keywords.$pattern,
delete i.keywords.$pattern),l=l||/\w+/,i.keywords&&(i.keywords=F(i.keywords,e.case_insensitive)),
o.keywordPatternRe=n(l,!0),
r&&(i.begin||(i.begin=/\B|\b/),o.beginRe=n(i.begin),i.end||i.endsWithParent||(i.end=/\B|\b/),
i.end&&(o.endRe=n(i.end)),
o.terminatorEnd=d(i.end)||"",i.endsWithParent&&r.terminatorEnd&&(o.terminatorEnd+=(i.end?"|":"")+r.terminatorEnd)),
i.illegal&&(o.illegalRe=n(i.illegal)),
i.contains||(i.contains=[]),i.contains=[].concat(...i.contains.map((e=>(e=>(e.variants&&!e.cachedVariants&&(e.cachedVariants=e.variants.map((n=>s(e,{
variants:null},n)))),e.cachedVariants?e.cachedVariants:Q(e)?s(e,{
starts:e.starts?s(e.starts):null
}):Object.isFrozen(e)?s(e):e))("self"===e?i:e)))),i.contains.forEach((e=>{t(e,o)
})),i.starts&&t(i.starts,r),o.matcher=(e=>{const n=new a
;return e.contains.forEach((e=>n.addRule(e.begin,{rule:e,type:"begin"
}))),e.terminatorEnd&&n.addRule(e.terminatorEnd,{type:"end"
}),e.illegal&&n.addRule(e.illegal,{type:"illegal"}),n})(o),o}(e)}function Q(e){
return!!e&&(e.endsWithParent||Q(e.starts))}const X=i,V=s,J=Symbol("nomatch")
;var Y=(e=>{const n=Object.create(null),i=Object.create(null),s=[];let r=!0
;const o="Could not find the language '{}', did you forget to load/include a language module?",l={
disableAutodetect:!0,name:"Plain text",contains:[]};let d={
ignoreUnescapedHTML:!1,noHighlightRe:/^(no-?highlight)$/i,
languageDetectRe:/\blang(?:uage)?-([\w-]+)\b/i,classPrefix:"hljs-",
cssSelector:"pre code",languages:null,__emitter:c};function g(e){
return d.noHighlightRe.test(e)}function u(e,n,t,a){let i="",s=""
;"object"==typeof n?(i=e,
t=n.ignoreIllegals,s=n.language,a=void 0):(q("10.7.0","highlight(lang, code, ...args) has been deprecated."),
q("10.7.0","Please use highlight(code, options) instead.\nhttps://github.com/highlightjs/highlight.js/issues/2277"),
s=e,i=n),void 0===t&&(t=!0);const r={code:i,language:s};N("before:highlight",r)
;const o=r.result?r.result:b(r.language,r.code,t,a)
;return o.code=r.code,N("after:highlight",o),o}function b(e,t,i,s){
const l=Object.create(null);function c(){if(!M.keywords)return void S.addText(k)
;let e=0;M.keywordPatternRe.lastIndex=0;let n=M.keywordPatternRe.exec(k),t=""
;for(;n;){t+=k.substring(e,n.index)
;const i=w.case_insensitive?n[0].toLowerCase():n[0],s=(a=i,M.keywords[a]);if(s){
const[e,a]=s
;if(S.addText(t),t="",l[i]=(l[i]||0)+1,l[i]<=7&&(A+=a),e.startsWith("_"))t+=n[0];else{
const t=w.classNameAliases[e]||e;S.addKeyword(n[0],t)}}else t+=n[0]
;e=M.keywordPatternRe.lastIndex,n=M.keywordPatternRe.exec(k)}var a
;t+=k.substr(e),S.addText(t)}function g(){null!=M.subLanguage?(()=>{
if(""===k)return;let e=null;if("string"==typeof M.subLanguage){
if(!n[M.subLanguage])return void S.addText(k)
;e=b(M.subLanguage,k,!0,x[M.subLanguage]),x[M.subLanguage]=e._top
}else e=m(k,M.subLanguage.length?M.subLanguage:null)
;M.relevance>0&&(A+=e.relevance),S.addSublanguage(e._emitter,e.language)
})():c(),k=""}function u(e,n){let t=1;for(;void 0!==n[t];){if(!e._emit[t]){t++
;continue}const a=w.classNameAliases[e[t]]||e[t],i=n[t]
;a?S.addKeyword(i,a):(k=i,c(),k=""),t++}}function p(e,n){
return e.scope&&"string"==typeof e.scope&&S.openNode(w.classNameAliases[e.scope]||e.scope),
e.beginScope&&(e.beginScope._wrap?(S.addKeyword(k,w.classNameAliases[e.beginScope._wrap]||e.beginScope._wrap),
k=""):e.beginScope._multi&&(u(e.beginScope,n),k="")),M=Object.create(e,{parent:{
value:M}}),M}function _(e,n,t){let i=((e,n)=>{const t=e&&e.exec(n)
;return t&&0===t.index})(e.endRe,t);if(i){if(e["on:end"]){const t=new a(e)
;e["on:end"](n,t),t.isMatchIgnored&&(i=!1)}if(i){
for(;e.endsParent&&e.parent;)e=e.parent;return e}}
if(e.endsWithParent)return _(e.parent,n,t)}function h(e){
return 0===M.matcher.regexIndex?(k+=e[0],1):(R=!0,0)}function E(e){
const n=e[0],a=t.substr(e.index),i=_(M,e,a);if(!i)return J;const s=M
;M.endScope&&M.endScope._wrap?(g(),
S.addKeyword(n,M.endScope._wrap)):M.endScope&&M.endScope._multi?(g(),
u(M.endScope,e)):s.skip?k+=n:(s.returnEnd||s.excludeEnd||(k+=n),
g(),s.excludeEnd&&(k=n));do{
M.scope&&!M.isMultiClass&&S.closeNode(),M.skip||M.subLanguage||(A+=M.relevance),
M=M.parent}while(M!==i.parent)
;return i.starts&&p(i.starts,e),s.returnEnd?0:n.length}let y={};function N(n,s){
const o=s&&s[0];if(k+=n,null==o)return g(),0
;if("begin"===y.type&&"end"===s.type&&y.index===s.index&&""===o){
if(k+=t.slice(s.index,s.index+1),!r){const n=Error(`0 width match regex (${e})`)
;throw n.languageName=e,n.badRule=y.rule,n}return 1}
if(y=s,"begin"===s.type)return(e=>{
const n=e[0],t=e.rule,i=new a(t),s=[t.__beforeBegin,t["on:begin"]]
;for(const t of s)if(t&&(t(e,i),i.isMatchIgnored))return h(n)
;return t.skip?k+=n:(t.excludeBegin&&(k+=n),
g(),t.returnBegin||t.excludeBegin||(k=n)),p(t,e),t.returnBegin?0:n.length})(s)
;if("illegal"===s.type&&!i){
const e=Error('Illegal lexeme "'+o+'" for mode "'+(M.scope||"<unnamed>")+'"')
;throw e.mode=M,e}if("end"===s.type){const e=E(s);if(e!==J)return e}
if("illegal"===s.type&&""===o)return 1
;if(T>1e5&&T>3*s.index)throw Error("potential infinite loop, way more iterations than matches")
;return k+=o,o.length}const w=f(e)
;if(!w)throw P(o.replace("{}",e)),Error('Unknown language: "'+e+'"')
;const v=W(w);let O="",M=s||v;const x={},S=new d.__emitter(d);(()=>{const e=[]
;for(let n=M;n!==w;n=n.parent)n.scope&&e.unshift(n.scope)
;e.forEach((e=>S.openNode(e)))})();let k="",A=0,C=0,T=0,R=!1;try{
for(M.matcher.considerAll();;){
T++,R?R=!1:M.matcher.considerAll(),M.matcher.lastIndex=C
;const e=M.matcher.exec(t);if(!e)break;const n=N(t.substring(C,e.index),e)
;C=e.index+n}return N(t.substr(C)),S.closeAllNodes(),S.finalize(),O=S.toHTML(),{
language:e,value:O,relevance:A,illegal:!1,_emitter:S,_top:M}}catch(n){
if(n.message&&n.message.includes("Illegal"))return{language:e,value:X(t),
illegal:!0,relevance:0,_illegalBy:{message:n.message,index:C,
context:t.slice(C-100,C+100),mode:n.mode,resultSoFar:O},_emitter:S};if(r)return{
language:e,value:X(t),illegal:!1,relevance:0,errorRaised:n,_emitter:S,_top:M}
;throw n}}function m(e,t){t=t||d.languages||Object.keys(n);const a=(e=>{
const n={value:X(e),illegal:!1,relevance:0,_top:l,_emitter:new d.__emitter(d)}
;return n._emitter.addText(e),n})(e),i=t.filter(f).filter(y).map((n=>b(n,e,!1)))
;i.unshift(a);const s=i.sort(((e,n)=>{
if(e.relevance!==n.relevance)return n.relevance-e.relevance
;if(e.language&&n.language){if(f(e.language).supersetOf===n.language)return 1
;if(f(n.language).supersetOf===e.language)return-1}return 0})),[r,o]=s,c=r
;return c.secondBest=o,c}function p(e){let n=null;const t=(e=>{
let n=e.className+" ";n+=e.parentNode?e.parentNode.className:""
;const t=d.languageDetectRe.exec(n);if(t){const n=f(t[1])
;return n||(K(o.replace("{}",t[1])),
K("Falling back to no-highlight mode for this block.",e)),n?t[1]:"no-highlight"}
return n.split(/\s+/).find((e=>g(e)||f(e)))})(e);if(g(t))return
;N("before:highlightElement",{el:e,language:t
}),!d.ignoreUnescapedHTML&&e.children.length>0&&(console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."),
console.warn("https://github.com/highlightjs/highlight.js/issues/2886"),
console.warn(e)),n=e;const a=n.textContent,s=t?u(a,{language:t,ignoreIllegals:!0
}):m(a);e.innerHTML=s.value,((e,n,t)=>{const a=n&&i[n]||t
;e.classList.add("hljs"),e.classList.add("language-"+a)
})(e,t,s.language),e.result={language:s.language,re:s.relevance,
relevance:s.relevance},s.secondBest&&(e.secondBest={
language:s.secondBest.language,relevance:s.secondBest.relevance
}),N("after:highlightElement",{el:e,result:s,text:a})}let _=!1;function h(){
"loading"!==document.readyState?document.querySelectorAll(d.cssSelector).forEach(p):_=!0
}function f(e){return e=(e||"").toLowerCase(),n[e]||n[i[e]]}
function E(e,{languageName:n}){"string"==typeof e&&(e=[e]),e.forEach((e=>{
i[e.toLowerCase()]=n}))}function y(e){const n=f(e)
;return n&&!n.disableAutodetect}function N(e,n){const t=e;s.forEach((e=>{
e[t]&&e[t](n)}))}
"undefined"!=typeof window&&window.addEventListener&&window.addEventListener("DOMContentLoaded",(()=>{
_&&h()}),!1),Object.assign(e,{highlight:u,highlightAuto:m,highlightAll:h,
highlightElement:p,
highlightBlock:e=>(q("10.7.0","highlightBlock will be removed entirely in v12.0"),
q("10.7.0","Please use highlightElement now."),p(e)),configure:e=>{d=V(d,e)},
initHighlighting:()=>{
h(),q("10.6.0","initHighlighting() deprecated.  Use highlightAll() now.")},
initHighlightingOnLoad:()=>{
h(),q("10.6.0","initHighlightingOnLoad() deprecated.  Use highlightAll() now.")
},registerLanguage:(t,a)=>{let i=null;try{i=a(e)}catch(e){
if(P("Language definition for '{}' could not be registered.".replace("{}",t)),
!r)throw e;P(e),i=l}
i.name||(i.name=t),n[t]=i,i.rawDefinition=a.bind(null,e),i.aliases&&E(i.aliases,{
languageName:t})},unregisterLanguage:e=>{delete n[e]
;for(const n of Object.keys(i))i[n]===e&&delete i[n]},
listLanguages:()=>Object.keys(n),getLanguage:f,registerAliases:E,
autoDetection:y,inherit:V,addPlugin:e=>{(e=>{
e["before:highlightBlock"]&&!e["before:highlightElement"]&&(e["before:highlightElement"]=n=>{
e["before:highlightBlock"](Object.assign({block:n.el},n))
}),e["after:highlightBlock"]&&!e["after:highlightElement"]&&(e["after:highlightElement"]=n=>{
e["after:highlightBlock"](Object.assign({block:n.el},n))})})(e),s.push(e)}
}),e.debugMode=()=>{r=!1},e.safeMode=()=>{r=!0},e.versionString="11.0.1"
;for(const e in C)"object"==typeof C[e]&&t(C[e]);return Object.assign(e,C),e
})({});const ee=e=>({IMPORTANT:{scope:"meta",begin:"!important"},HEXCOLOR:{
scope:"number",begin:"#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})"},
ATTRIBUTE_SELECTOR_MODE:{scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",
contains:[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{
scope:"number",
begin:e.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
relevance:0}
}),ne=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","p","q","quote","samp","section","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video"],te=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"],ae=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"],ie=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"],se=["align-content","align-items","align-self","animation","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-timing-function","auto","backface-visibility","background","background-attachment","background-clip","background-color","background-image","background-origin","background-position","background-repeat","background-size","border","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-decoration-break","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","clear","clip","clip-path","color","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","content","counter-increment","counter-reset","cursor","direction","display","empty-cells","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-size","font-size-adjust","font-smoothing","font-stretch","font-style","font-variant","font-variant-ligatures","font-variation-settings","font-weight","height","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","inherit","initial","justify-content","left","letter-spacing","line-height","list-style","list-style-image","list-style-position","list-style-type","margin","margin-bottom","margin-left","margin-right","margin-top","marks","mask","max-height","max-width","min-height","min-width","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-wrap","overflow-x","overflow-y","padding","padding-bottom","padding-left","padding-right","padding-top","page-break-after","page-break-before","page-break-inside","perspective","perspective-origin","pointer-events","position","quotes","resize","right","src","tab-size","table-layout","text-align","text-align-last","text-decoration","text-decoration-color","text-decoration-line","text-decoration-style","text-indent","text-overflow","text-rendering","text-shadow","text-transform","text-underline-position","top","transform","transform-origin","transform-style","transition","transition-delay","transition-duration","transition-property","transition-timing-function","unicode-bidi","vertical-align","visibility","white-space","widows","width","word-break","word-spacing","word-wrap","z-index"].reverse(),re=ae.concat(ie)
;var oe="\\.([0-9](_*[0-9])*)",le="[0-9a-fA-F](_*[0-9a-fA-F])*",ce={
className:"number",variants:[{
begin:`(\\b([0-9](_*[0-9])*)((${oe})|\\.)?|(${oe}))[eE][+-]?([0-9](_*[0-9])*)[fFdD]?\\b`
},{begin:`\\b([0-9](_*[0-9])*)((${oe})[fFdD]?\\b|\\.([fFdD]\\b)?)`},{
begin:`(${oe})[fFdD]?\\b`},{begin:"\\b([0-9](_*[0-9])*)[fFdD]\\b"},{
begin:`\\b0[xX]((${le})\\.?|(${le})?\\.(${le}))[pP][+-]?([0-9](_*[0-9])*)[fFdD]?\\b`
},{begin:"\\b(0|[1-9](_*[0-9])*)[lL]?\\b"},{begin:`\\b0[xX](${le})[lL]?\\b`},{
begin:"\\b0(_*[0-7])*[lL]?\\b"},{begin:"\\b0[bB][01](_*[01])*[lL]?\\b"}],
relevance:0};function de(e,n,t){return-1===t?"":e.replace(n,(a=>de(e,n,t-1)))}
const ge="[A-Za-z$_][0-9A-Za-z$_]*",ue=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends"],be=["true","false","null","undefined","NaN","Infinity"],me=["Intl","DataView","Number","Math","Date","String","RegExp","Object","Function","Boolean","Error","Symbol","Set","Map","WeakSet","WeakMap","Proxy","Reflect","JSON","Promise","Float64Array","Int16Array","Int32Array","Int8Array","Uint16Array","Uint32Array","Float32Array","Array","Uint8Array","Uint8ClampedArray","ArrayBuffer","BigInt64Array","BigUint64Array","BigInt"],pe=["EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],_e=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],he=["arguments","this","super","console","window","document","localStorage","module","global"],fe=[].concat(_e,me,pe)
;function Ee(e){const n=ge,t={begin:/<[A-Za-z0-9\\._:-]+/,
end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(e,n)=>{
const t=e[0].length+e.index,a=e.input[t];"<"!==a?">"===a&&(((e,{after:n})=>{
const t="</"+e[0].slice(1);return-1!==e.input.indexOf(t,n)})(e,{after:t
})||n.ignoreMatch()):n.ignoreMatch()}},a={$pattern:ge,keyword:ue,literal:be,
built_in:fe,"variable.language":he
},i="\\.([0-9](_?[0-9])*)",s="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",r={
className:"number",variants:[{
begin:`(\\b(${s})((${i})|\\.)?|(${i}))[eE][+-]?([0-9](_?[0-9])*)\\b`},{
begin:`\\b(${s})\\b((${i})\\b|\\.)?|(${i})\\b`},{
begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{
begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{
begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{
begin:"\\b0[0-7]+n?\\b"}],relevance:0},o={className:"subst",begin:"\\$\\{",
end:"\\}",keywords:a,contains:[]},l={begin:"html`",end:"",starts:{end:"`",
returnEnd:!1,contains:[e.BACKSLASH_ESCAPE,o],subLanguage:"xml"}},c={
begin:"css`",end:"",starts:{end:"`",returnEnd:!1,
contains:[e.BACKSLASH_ESCAPE,o],subLanguage:"css"}},d={className:"string",
begin:"`",end:"`",contains:[e.BACKSLASH_ESCAPE,o]},u={className:"comment",
variants:[e.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{
begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",
begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,
excludeBegin:!0,relevance:0},{className:"variable",begin:n+"(?=\\s*(-)|$)",
endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]
}),e.C_BLOCK_COMMENT_MODE,e.C_LINE_COMMENT_MODE]
},m=[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,l,c,d,r,e.REGEXP_MODE]
;o.contains=m.concat({begin:/\{/,end:/\}/,keywords:a,contains:["self"].concat(m)
});const p=[].concat(u,o.contains),_=p.concat([{begin:/\(/,end:/\)/,keywords:a,
contains:["self"].concat(p)}]),h={className:"params",begin:/\(/,end:/\)/,
excludeBegin:!0,excludeEnd:!0,keywords:a,contains:_},f={variants:[{
match:[/class/,/\s+/,n],scope:{1:"keyword",3:"title.class"}},{
match:[/extends/,/\s+/,b(n,"(",b(/\./,n),")*")],scope:{1:"keyword",
3:"title.class.inherited"}}]},E={relevance:0,
match:/\b[A-Z][a-z]+([A-Z][a-z]+)*/,className:"title.class",keywords:{
_:[...me,...pe]}},y={variants:[{match:[/function/,/\s+/,n,/(?=\s*\()/]},{
match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},
label:"func.def",contains:[h],illegal:/%/},N={
match:b(/\b/,(w=[..._e,"super"],b("(?!",w.join("|"),")")),n,g(/\(/)),
className:"title.function",relevance:0};var w;const v={
begin:b(/\./,g(b(n,/(?![0-9A-Za-z$_(])/))),end:n,excludeBegin:!0,
keywords:"prototype",className:"property",relevance:0},O={
match:[/get|set/,/\s+/,n,/(?=\()/],className:{1:"keyword",3:"title.function"},
contains:[{begin:/\(\)/},h]
},M="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+e.UNDERSCORE_IDENT_RE+")\\s*=>",x={
match:[/const|var|let/,/\s+/,n,/\s*/,/=\s*/,g(M)],className:{1:"keyword",
3:"title.function"},contains:[h]};return{name:"Javascript",
aliases:["js","jsx","mjs","cjs"],keywords:a,exports:{PARAMS_CONTAINS:_},
illegal:/#(?![$_A-z])/,contains:[e.SHEBANG({label:"shebang",binary:"node",
relevance:5}),{label:"use_strict",className:"meta",relevance:10,
begin:/^\s*['"]use (strict|asm)['"]/
},e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,l,c,d,u,r,E,{className:"attr",
begin:n+g(":"),relevance:0},x,{
begin:"("+e.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",
keywords:"return throw case",relevance:0,contains:[u,e.REGEXP_MODE,{
className:"function",begin:M,returnBegin:!0,end:"\\s*=>",contains:[{
className:"params",variants:[{begin:e.UNDERSCORE_IDENT_RE,relevance:0},{
className:null,begin:/\(\s*\)/,skip:!0},{begin:/\(/,end:/\)/,excludeBegin:!0,
excludeEnd:!0,keywords:a,contains:_}]}]},{begin:/,/,relevance:0},{match:/\s+/,
relevance:0},{variants:[{begin:"<>",end:"</>"},{begin:t.begin,
"on:begin":t.isTrulyOpeningTag,end:t.end}],subLanguage:"xml",contains:[{
begin:t.begin,end:t.end,skip:!0,contains:["self"]}]}]},y,{
beginKeywords:"while if switch catch for"},{
begin:"\\b(?!function)"+e.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
returnBegin:!0,label:"func.def",contains:[h,e.inherit(e.TITLE_MODE,{begin:n,
className:"title.function"})]},{match:/\.\.\./,relevance:0},v,{match:"\\$"+n,
relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},
contains:[h]},N,{relevance:0,match:/\b[A-Z][A-Z_]+\b/,
className:"variable.constant"},f,O,{match:/\$[(.]/}]}}
const ye=e=>b(/\b/,e,/\w$/.test(e)?/\b/:/\B/),Ne=["Protocol","Type"].map(ye),we=["init","self"].map(ye),ve=["Any","Self"],Oe=["actor","associatedtype","async","await",/as\?/,/as!/,"as","break","case","catch","class","continue","convenience","default","defer","deinit","didSet","do","dynamic","else","enum","extension","fallthrough",/fileprivate\(set\)/,"fileprivate","final","for","func","get","guard","if","import","indirect","infix",/init\?/,/init!/,"inout",/internal\(set\)/,"internal","in","is","lazy","let","mutating","nonmutating",/open\(set\)/,"open","operator","optional","override","postfix","precedencegroup","prefix",/private\(set\)/,"private","protocol",/public\(set\)/,"public","repeat","required","rethrows","return","set","some","static","struct","subscript","super","switch","throws","throw",/try\?/,/try!/,"try","typealias",/unowned\(safe\)/,/unowned\(unsafe\)/,"unowned","var","weak","where","while","willSet"],Me=["false","nil","true"],xe=["assignment","associativity","higherThan","left","lowerThan","none","right"],Se=["#colorLiteral","#column","#dsohandle","#else","#elseif","#endif","#error","#file","#fileID","#fileLiteral","#filePath","#function","#if","#imageLiteral","#keyPath","#line","#selector","#sourceLocation","#warn_unqualified_access","#warning"],ke=["abs","all","any","assert","assertionFailure","debugPrint","dump","fatalError","getVaList","isKnownUniquelyReferenced","max","min","numericCast","pointwiseMax","pointwiseMin","precondition","preconditionFailure","print","readLine","repeatElement","sequence","stride","swap","swift_unboxFromSwiftValueWithType","transcode","type","unsafeBitCast","unsafeDowncast","withExtendedLifetime","withUnsafeMutablePointer","withUnsafePointer","withVaList","withoutActuallyEscaping","zip"],Ae=m(/[/=\-+!*%<>&|^~?]/,/[\u00A1-\u00A7]/,/[\u00A9\u00AB]/,/[\u00AC\u00AE]/,/[\u00B0\u00B1]/,/[\u00B6\u00BB\u00BF\u00D7\u00F7]/,/[\u2016-\u2017]/,/[\u2020-\u2027]/,/[\u2030-\u203E]/,/[\u2041-\u2053]/,/[\u2055-\u205E]/,/[\u2190-\u23FF]/,/[\u2500-\u2775]/,/[\u2794-\u2BFF]/,/[\u2E00-\u2E7F]/,/[\u3001-\u3003]/,/[\u3008-\u3020]/,/[\u3030]/),Ce=m(Ae,/[\u0300-\u036F]/,/[\u1DC0-\u1DFF]/,/[\u20D0-\u20FF]/,/[\uFE00-\uFE0F]/,/[\uFE20-\uFE2F]/),Te=b(Ae,Ce,"*"),Re=m(/[a-zA-Z_]/,/[\u00A8\u00AA\u00AD\u00AF\u00B2-\u00B5\u00B7-\u00BA]/,/[\u00BC-\u00BE\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/,/[\u0100-\u02FF\u0370-\u167F\u1681-\u180D\u180F-\u1DBF]/,/[\u1E00-\u1FFF]/,/[\u200B-\u200D\u202A-\u202E\u203F-\u2040\u2054\u2060-\u206F]/,/[\u2070-\u20CF\u2100-\u218F\u2460-\u24FF\u2776-\u2793]/,/[\u2C00-\u2DFF\u2E80-\u2FFF]/,/[\u3004-\u3007\u3021-\u302F\u3031-\u303F\u3040-\uD7FF]/,/[\uF900-\uFD3D\uFD40-\uFDCF\uFDF0-\uFE1F\uFE30-\uFE44]/,/[\uFE47-\uFEFE\uFF00-\uFFFD]/),De=m(Re,/\d/,/[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/),Ie=b(Re,De,"*"),Be=b(/[A-Z]/,De,"*"),Le=["autoclosure",b(/convention\(/,m("swift","block","c"),/\)/),"discardableResult","dynamicCallable","dynamicMemberLookup","escaping","frozen","GKInspectable","IBAction","IBDesignable","IBInspectable","IBOutlet","IBSegueAction","inlinable","main","nonobjc","NSApplicationMain","NSCopying","NSManaged",b(/objc\(/,Ie,/\)/),"objc","objcMembers","propertyWrapper","requires_stored_property_inits","resultBuilder","testable","UIApplicationMain","unknown","usableFromInline"],$e=["iOS","iOSApplicationExtension","macOS","macOSApplicationExtension","macCatalyst","macCatalystApplicationExtension","watchOS","watchOSApplicationExtension","tvOS","tvOSApplicationExtension","swift"]
;var ze=Object.freeze({__proto__:null,grmr_bash:e=>{const n={},t={begin:/\$\{/,
end:/\}/,contains:["self",{begin:/:-/,contains:[n]}]};Object.assign(n,{
className:"variable",variants:[{
begin:b(/\$[\w\d#@][\w\d_]*/,"(?![\\w\\d])(?![$])")},t]});const a={
className:"subst",begin:/\$\(/,end:/\)/,contains:[e.BACKSLASH_ESCAPE]},i={
begin:/<<-?\s*(?=\w+)/,starts:{contains:[e.END_SAME_AS_BEGIN({begin:/(\w+)/,
end:/(\w+)/,className:"string"})]}},s={className:"string",begin:/"/,end:/"/,
contains:[e.BACKSLASH_ESCAPE,n,a]};a.contains.push(s);const r={begin:/\$\(\(/,
end:/\)\)/,contains:[{begin:/\d+#[0-9a-f]+/,className:"number"},e.NUMBER_MODE,n]
},o=e.SHEBANG({binary:"(fish|bash|zsh|sh|csh|ksh|tcsh|dash|scsh)",relevance:10
}),l={className:"function",begin:/\w[\w\d_]*\s*\(\s*\)\s*\{/,returnBegin:!0,
contains:[e.inherit(e.TITLE_MODE,{begin:/\w[\w\d_]*/})],relevance:0};return{
name:"Bash",aliases:["sh"],keywords:{$pattern:/\b[a-z._-]+\b/,
keyword:["if","then","else","elif","fi","for","while","in","do","done","case","esac","function"],
literal:["true","false"],
built_in:"break cd continue eval exec exit export getopts hash pwd readonly return shift test times trap umask unset alias bind builtin caller command declare echo enable help let local logout mapfile printf read readarray source type typeset ulimit unalias set shopt autoload bg bindkey bye cap chdir clone comparguments compcall compctl compdescribe compfiles compgroups compquote comptags comptry compvalues dirs disable disown echotc echoti emulate fc fg float functions getcap getln history integer jobs kill limit log noglob popd print pushd pushln rehash sched setcap setopt stat suspend ttyctl unfunction unhash unlimit unsetopt vared wait whence where which zcompile zformat zftp zle zmodload zparseopts zprof zpty zregexparse zsocket zstyle ztcp"
},contains:[o,e.SHEBANG(),l,r,e.HASH_COMMENT_MODE,i,s,{className:"",begin:/\\"/
},{className:"string",begin:/'/,end:/'/},n]}},grmr_c:e=>{
const n=e.COMMENT("//","$",{contains:[{begin:/\\\n/}]
}),t="[a-zA-Z_]\\w*::",a="(decltype\\(auto\\)|"+u(t)+"[a-zA-Z_]\\w*"+u("<[^<>]+>")+")",i={
className:"type",variants:[{begin:"\\b[a-z\\d_]*_t\\b"},{
match:/\batomic_[a-z]{3,6}\b/}]},s={className:"string",variants:[{
begin:'(u8?|U|L)?"',end:'"',illegal:"\\n",contains:[e.BACKSLASH_ESCAPE]},{
begin:"(u8?|U|L)?'(\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)|.)",
end:"'",illegal:"."},e.END_SAME_AS_BEGIN({
begin:/(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,end:/\)([^()\\ ]{0,16})"/})]},r={
className:"number",variants:[{begin:"\\b(0b[01']+)"},{
begin:"(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)"
},{
begin:"(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)"
}],relevance:0},o={className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,keywords:{
keyword:"if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include"
},contains:[{begin:/\\\n/,relevance:0},e.inherit(s,{className:"string"}),{
className:"string",begin:/<.*?>/},n,e.C_BLOCK_COMMENT_MODE]},l={
className:"title",begin:u(t)+e.IDENT_RE,relevance:0
},c=u(t)+e.IDENT_RE+"\\s*\\(",d={
keyword:["asm","auto","break","case","const","continue","default","do","else","enum","extern","for","fortran","goto","if","inline","register","restrict","return","sizeof","static","struct","switch","typedef","union","volatile","while","_Alignas","_Alignof","_Atomic","_Generic","_Noreturn","_Static_assert","_Thread_local","alignas","alignof","noreturn","static_assert","thread_local","_Pragma"],
type:["float","double","signed","unsigned","int","short","long","char","void","_Bool","_Complex","_Imaginary","_Decimal32","_Decimal64","_Decimal128","complex","bool","imaginary"],
literal:"true false NULL",
built_in:"std string wstring cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream auto_ptr deque list queue stack vector map set pair bitset multiset multimap unordered_set unordered_map unordered_multiset unordered_multimap priority_queue make_pair array shared_ptr abort terminate abs acos asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp fscanf future isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan vfprintf vprintf vsprintf endl initializer_list unique_ptr"
},g=[o,i,n,e.C_BLOCK_COMMENT_MODE,r,s],b={variants:[{begin:/=/,end:/;/},{
begin:/\(/,end:/\)/},{beginKeywords:"new throw return else",end:/;/}],
keywords:d,contains:g.concat([{begin:/\(/,end:/\)/,keywords:d,
contains:g.concat(["self"]),relevance:0}]),relevance:0},m={
begin:"("+a+"[\\*&\\s]+)+"+c,returnBegin:!0,end:/[{;=]/,excludeEnd:!0,
keywords:d,illegal:/[^\w\s\*&:<>.]/,contains:[{begin:"decltype\\(auto\\)",
keywords:d,relevance:0},{begin:c,returnBegin:!0,contains:[e.inherit(l,{
className:"title.function"})],relevance:0},{relevance:0,match:/,/},{
className:"params",begin:/\(/,end:/\)/,keywords:d,relevance:0,
contains:[n,e.C_BLOCK_COMMENT_MODE,s,r,i,{begin:/\(/,end:/\)/,keywords:d,
relevance:0,contains:["self",n,e.C_BLOCK_COMMENT_MODE,s,r,i]}]
},i,n,e.C_BLOCK_COMMENT_MODE,o]};return{name:"C",aliases:["h"],keywords:d,
disableAutodetect:!0,illegal:"</",contains:[].concat(b,m,g,[o,{
begin:e.IDENT_RE+"::",keywords:d},{className:"class",
beginKeywords:"enum class struct union",end:/[{;:<>=]/,contains:[{
beginKeywords:"final class struct"},e.TITLE_MODE]}]),exports:{preprocessor:o,
strings:s,keywords:d}}},grmr_cpp:e=>{const n=e.COMMENT("//","$",{contains:[{
begin:/\\\n/}]
}),t="[a-zA-Z_]\\w*::",a="(?!struct)(decltype\\(auto\\)|"+u(t)+"[a-zA-Z_]\\w*"+u("<[^<>]+>")+")",i={
className:"type",begin:"\\b[a-z\\d_]*_t\\b"},s={className:"string",variants:[{
begin:'(u8?|U|L)?"',end:'"',illegal:"\\n",contains:[e.BACKSLASH_ESCAPE]},{
begin:"(u8?|U|L)?'(\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)|.)",
end:"'",illegal:"."},e.END_SAME_AS_BEGIN({
begin:/(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,end:/\)([^()\\ ]{0,16})"/})]},r={
className:"number",variants:[{begin:"\\b(0b[01']+)"},{
begin:"(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)"
},{
begin:"(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)"
}],relevance:0},o={className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,keywords:{
keyword:"if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include"
},contains:[{begin:/\\\n/,relevance:0},e.inherit(s,{className:"string"}),{
className:"string",begin:/<.*?>/},n,e.C_BLOCK_COMMENT_MODE]},l={
className:"title",begin:u(t)+e.IDENT_RE,relevance:0
},c=u(t)+e.IDENT_RE+"\\s*\\(",d={
type:["bool","char","char16_t","char32_t","char8_t","double","float","int","long","short","void","wchar_t"],
keyword:["alignas","alignof","and","and_eq","asm","atomic_cancel","atomic_commit","atomic_noexcept","auto","bitand","bitor","break","case","catch","class","co_await","co_return","co_yield","compl","concept","const","const_cast|10","consteval","constexpr","constinit","continue","decltype","default","delete","do","dynamic_cast|10","else","enum","explicit","export","extern","false","final","for","friend","goto","if","import","inline","module","mutable","namespace","new","noexcept","not","not_eq","nullptr","operator","or","or_eq","override","private","protected","public","reflexpr","register","reinterpret_cast|10","requires","return","signed","sizeof","static","static_assert","static_cast|10","struct","switch","synchronized","template","this","thread_local","throw","transaction_safe","transaction_safe_dynamic","true","try","typedef","typeid","typename","union","unsigned","using","virtual","volatile","while","xor","xor_eq,"],
literal:["NULL","false","nullopt","nullptr","true"],built_in:["_Pragma"],
_type_hints:["any","auto_ptr","barrier","binary_semaphore","bitset","complex","condition_variable","condition_variable_any","counting_semaphore","deque","false_type","future","imaginary","initializer_list","istringstream","jthread","latch","lock_guard","multimap","multiset","mutex","optional","ostringstream","packaged_task","pair","promise","priority_queue","queue","recursive_mutex","recursive_timed_mutex","scoped_lock","set","shared_future","shared_lock","shared_mutex","shared_timed_mutex","shared_ptr","stack","string_view","stringstream","timed_mutex","thread","true_type","tuple","unique_lock","unique_ptr","unordered_map","unordered_multimap","unordered_multiset","unordered_set","variant","vector","weak_ptr","wstring","wstring_view"]
},m={className:"function.dispatch",relevance:0,keywords:{
_hint:["abort","abs","acos","apply","as_const","asin","atan","atan2","calloc","ceil","cerr","cin","clog","cos","cosh","cout","declval","endl","exchange","exit","exp","fabs","floor","fmod","forward","fprintf","fputs","free","frexp","fscanf","future","invoke","isalnum","isalpha","iscntrl","isdigit","isgraph","islower","isprint","ispunct","isspace","isupper","isxdigit","labs","launder","ldexp","log","log10","make_pair","make_shared","make_shared_for_overwrite","make_tuple","make_unique","malloc","memchr","memcmp","memcpy","memset","modf","move","pow","printf","putchar","puts","realloc","scanf","sin","sinh","snprintf","sprintf","sqrt","sscanf","std","stderr","stdin","stdout","strcat","strchr","strcmp","strcpy","strcspn","strlen","strncat","strncmp","strncpy","strpbrk","strrchr","strspn","strstr","swap","tan","tanh","terminate","to_underlying","tolower","toupper","vfprintf","visit","vprintf","vsprintf"]
},
begin:b(/\b/,/(?!decltype)/,/(?!if)/,/(?!for)/,/(?!while)/,e.IDENT_RE,g(/(<[^<>]+>|)\s*\(/))
},p=[m,o,i,n,e.C_BLOCK_COMMENT_MODE,r,s],_={variants:[{begin:/=/,end:/;/},{
begin:/\(/,end:/\)/},{beginKeywords:"new throw return else",end:/;/}],
keywords:d,contains:p.concat([{begin:/\(/,end:/\)/,keywords:d,
contains:p.concat(["self"]),relevance:0}]),relevance:0},h={className:"function",
begin:"("+a+"[\\*&\\s]+)+"+c,returnBegin:!0,end:/[{;=]/,excludeEnd:!0,
keywords:d,illegal:/[^\w\s\*&:<>.]/,contains:[{begin:"decltype\\(auto\\)",
keywords:d,relevance:0},{begin:c,returnBegin:!0,contains:[l],relevance:0},{
begin:/::/,relevance:0},{begin:/:/,endsWithParent:!0,contains:[s,r]},{
relevance:0,match:/,/},{className:"params",begin:/\(/,end:/\)/,keywords:d,
relevance:0,contains:[n,e.C_BLOCK_COMMENT_MODE,s,r,i,{begin:/\(/,end:/\)/,
keywords:d,relevance:0,contains:["self",n,e.C_BLOCK_COMMENT_MODE,s,r,i]}]
},i,n,e.C_BLOCK_COMMENT_MODE,o]};return{name:"C++",
aliases:["cc","c++","h++","hpp","hh","hxx","cxx"],keywords:d,illegal:"</",
classNameAliases:{"function.dispatch":"built_in"},
contains:[].concat(_,h,m,p,[o,{
begin:"\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array|tuple|optional|variant|function)\\s*<",
end:">",keywords:d,contains:["self",i]},{begin:e.IDENT_RE+"::",keywords:d},{
match:[/\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/,/\s+/,/\w+/],
className:{1:"keyword",3:"title.class"}}])}},grmr_csharp:e=>{const n={
keyword:["abstract","as","base","break","case","class","const","continue","do","else","event","explicit","extern","finally","fixed","for","foreach","goto","if","implicit","in","interface","internal","is","lock","namespace","new","operator","out","override","params","private","protected","public","readonly","record","ref","return","sealed","sizeof","stackalloc","static","struct","switch","this","throw","try","typeof","unchecked","unsafe","using","virtual","void","volatile","while"].concat(["add","alias","and","ascending","async","await","by","descending","equals","from","get","global","group","init","into","join","let","nameof","not","notnull","on","or","orderby","partial","remove","select","set","unmanaged","value|0","var","when","where","with","yield"]),
built_in:["bool","byte","char","decimal","delegate","double","dynamic","enum","float","int","long","nint","nuint","object","sbyte","short","string","ulong","uint","ushort"],
literal:["default","false","null","true"]},t=e.inherit(e.TITLE_MODE,{
begin:"[a-zA-Z](\\.?\\w)*"}),a={className:"number",variants:[{
begin:"\\b(0b[01']+)"},{
begin:"(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)(u|U|l|L|ul|UL|f|F|b|B)"},{
begin:"(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)"
}],relevance:0},i={className:"string",begin:'@"',end:'"',contains:[{begin:'""'}]
},s=e.inherit(i,{illegal:/\n/}),r={className:"subst",begin:/\{/,end:/\}/,
keywords:n},o=e.inherit(r,{illegal:/\n/}),l={className:"string",begin:/\$"/,
end:'"',illegal:/\n/,contains:[{begin:/\{\{/},{begin:/\}\}/
},e.BACKSLASH_ESCAPE,o]},c={className:"string",begin:/\$@"/,end:'"',contains:[{
begin:/\{\{/},{begin:/\}\}/},{begin:'""'},r]},d=e.inherit(c,{illegal:/\n/,
contains:[{begin:/\{\{/},{begin:/\}\}/},{begin:'""'},o]})
;r.contains=[c,l,i,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,a,e.C_BLOCK_COMMENT_MODE],
o.contains=[d,l,s,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,a,e.inherit(e.C_BLOCK_COMMENT_MODE,{
illegal:/\n/})];const g={variants:[c,l,i,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]
},u={begin:"<",end:">",contains:[{beginKeywords:"in out"},t]
},b=e.IDENT_RE+"(<"+e.IDENT_RE+"(\\s*,\\s*"+e.IDENT_RE+")*>)?(\\[\\])?",m={
begin:"@"+e.IDENT_RE,relevance:0};return{name:"C#",aliases:["cs","c#"],
keywords:n,illegal:/::/,contains:[e.COMMENT("///","$",{returnBegin:!0,
contains:[{className:"doctag",variants:[{begin:"///",relevance:0},{
begin:"\x3c!--|--\x3e"},{begin:"</?",end:">"}]}]
}),e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{className:"meta",begin:"#",
end:"$",keywords:{
keyword:"if else elif endif define undef warning error line region endregion pragma checksum"
}},g,a,{beginKeywords:"class interface",relevance:0,end:/[{;=]/,
illegal:/[^\s:,]/,contains:[{beginKeywords:"where class"
},t,u,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{beginKeywords:"namespace",
relevance:0,end:/[{;=]/,illegal:/[^\s:]/,
contains:[t,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{
beginKeywords:"record",relevance:0,end:/[{;=]/,illegal:/[^\s:]/,
contains:[t,u,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{className:"meta",
begin:"^\\s*\\[(?=[\\w])",excludeBegin:!0,end:"\\]",excludeEnd:!0,contains:[{
className:"string",begin:/"/,end:/"/}]},{
beginKeywords:"new return throw await else",relevance:0},{className:"function",
begin:"("+b+"\\s+)+"+e.IDENT_RE+"\\s*(<.+>\\s*)?\\(",returnBegin:!0,
end:/\s*[{;=]/,excludeEnd:!0,keywords:n,contains:[{
beginKeywords:"public private protected static internal protected abstract async extern override unsafe virtual new sealed partial",
relevance:0},{begin:e.IDENT_RE+"\\s*(<.+>\\s*)?\\(",returnBegin:!0,
contains:[e.TITLE_MODE,u],relevance:0},{className:"params",begin:/\(/,end:/\)/,
excludeBegin:!0,excludeEnd:!0,keywords:n,relevance:0,
contains:[g,a,e.C_BLOCK_COMMENT_MODE]
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},m]}},grmr_css:e=>{
const n=ee(e),t=[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE];return{name:"CSS",
case_insensitive:!0,illegal:/[=|'\$]/,keywords:{keyframePosition:"from to"},
classNameAliases:{keyframePosition:"selector-tag"},
contains:[e.C_BLOCK_COMMENT_MODE,{begin:/-(webkit|moz|ms|o)-(?=[a-z])/
},n.CSS_NUMBER_MODE,{className:"selector-id",begin:/#[A-Za-z0-9_-]+/,relevance:0
},{className:"selector-class",begin:"\\.[a-zA-Z-][a-zA-Z0-9_-]*",relevance:0
},n.ATTRIBUTE_SELECTOR_MODE,{className:"selector-pseudo",variants:[{
begin:":("+ae.join("|")+")"},{begin:"::("+ie.join("|")+")"}]},{
className:"attribute",begin:"\\b("+se.join("|")+")\\b"},{begin:":",end:"[;}]",
contains:[n.HEXCOLOR,n.IMPORTANT,n.CSS_NUMBER_MODE,...t,{
begin:/(url|data-uri)\(/,end:/\)/,relevance:0,keywords:{built_in:"url data-uri"
},contains:[{className:"string",begin:/[^)]/,endsWithParent:!0,excludeEnd:!0}]
},{className:"built_in",begin:/[\w-]+(?=\()/}]},{begin:g(/@/),end:"[{;]",
relevance:0,illegal:/:/,contains:[{className:"keyword",begin:/@-?\w[\w]*(-\w+)*/
},{begin:/\s/,endsWithParent:!0,excludeEnd:!0,relevance:0,keywords:{
$pattern:/[a-z-]+/,keyword:"and or not only",attribute:te.join(" ")},contains:[{
begin:/[a-z-]+(?=:)/,className:"attribute"},...t,n.CSS_NUMBER_MODE]}]},{
className:"selector-tag",begin:"\\b("+ne.join("|")+")\\b"}]}},grmr_diff:e=>({
name:"Diff",aliases:["patch"],contains:[{className:"meta",relevance:10,
match:m(/^@@ +-\d+,\d+ +\+\d+,\d+ +@@/,/^\*\*\* +\d+,\d+ +\*\*\*\*$/,/^--- +\d+,\d+ +----$/)
},{className:"comment",variants:[{
begin:m(/Index: /,/^index/,/={3,}/,/^-{3}/,/^\*{3} /,/^\+{3}/,/^diff --git/),
end:/$/},{match:/^\*{15}$/}]},{className:"addition",begin:/^\+/,end:/$/},{
className:"deletion",begin:/^-/,end:/$/},{className:"addition",begin:/^!/,
end:/$/}]}),grmr_go:e=>{const n={
keyword:["break","default","func","interface","select","case","map","struct","chan","else","goto","package","switch","const","fallthrough","if","range","type","continue","for","import","return","var","go","defer","bool","byte","complex64","complex128","float32","float64","int8","int16","int32","int64","string","uint8","uint16","uint32","uint64","int","uint","uintptr","rune"],
literal:["true","false","iota","nil"],
built_in:["append","cap","close","complex","copy","imag","len","make","new","panic","print","println","real","recover","delete"]
};return{name:"Go",aliases:["golang"],keywords:n,illegal:"</",
contains:[e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{className:"string",
variants:[e.QUOTE_STRING_MODE,e.APOS_STRING_MODE,{begin:"`",end:"`"}]},{
className:"number",variants:[{begin:e.C_NUMBER_RE+"[i]",relevance:1
},e.C_NUMBER_MODE]},{begin:/:=/},{className:"function",beginKeywords:"func",
end:"\\s*(\\{|$)",excludeEnd:!0,contains:[e.TITLE_MODE,{className:"params",
begin:/\(/,end:/\)/,keywords:n,illegal:/["']/}]}]}},grmr_ini:e=>{const n={
className:"number",relevance:0,variants:[{begin:/([+-]+)?[\d]+_[\d_]+/},{
begin:e.NUMBER_RE}]},t=e.COMMENT();t.variants=[{begin:/;/,end:/$/},{begin:/#/,
end:/$/}];const a={className:"variable",variants:[{begin:/\$[\w\d"][\w\d_]*/},{
begin:/\$\{(.*?)\}/}]},i={className:"literal",
begin:/\bon|off|true|false|yes|no\b/},s={className:"string",
contains:[e.BACKSLASH_ESCAPE],variants:[{begin:"'''",end:"'''",relevance:10},{
begin:'"""',end:'"""',relevance:10},{begin:'"',end:'"'},{begin:"'",end:"'"}]
},r={begin:/\[/,end:/\]/,contains:[t,i,a,s,n,"self"],relevance:0
},o=m(/[A-Za-z0-9_-]+/,/"(\\"|[^"])*"/,/'[^']*'/);return{name:"TOML, also INI",
aliases:["toml"],case_insensitive:!0,illegal:/\S/,contains:[t,{
className:"section",begin:/\[+/,end:/\]+/},{
begin:b(o,"(\\s*\\.\\s*",o,")*",g(/\s*=\s*[^#\s]/)),className:"attr",starts:{
end:/$/,contains:[t,r,i,a,s,n]}}]}},grmr_java:e=>{
const n="[\xc0-\u02b8a-zA-Z_$][\xc0-\u02b8a-zA-Z_$0-9]*",t=n+de("(?:<"+n+"~~~(?:\\s*,\\s*"+n+"~~~)*>)?",/~~~/g,2),a={
keyword:["synchronized","abstract","private","var","static","if","const ","for","while","strictfp","finally","protected","import","native","final","void","enum","else","break","transient","catch","instanceof","volatile","case","assert","package","default","public","try","switch","continue","throws","protected","public","private","module","requires","exports","do"],
literal:["false","true","null"],
type:["char","boolean","long","float","int","byte","short","double"],
built_in:["super","this"]},i={className:"meta",begin:"@"+n,contains:[{
begin:/\(/,end:/\)/,contains:["self"]}]},s={className:"params",begin:/\(/,
end:/\)/,keywords:a,relevance:0,contains:[e.C_BLOCK_COMMENT_MODE],endsParent:!0}
;return{name:"Java",aliases:["jsp"],keywords:a,illegal:/<\/|#/,
contains:[e.COMMENT("/\\*\\*","\\*/",{relevance:0,contains:[{begin:/\w+@/,
relevance:0},{className:"doctag",begin:"@[A-Za-z]+"}]}),{
begin:/import java\.[a-z]+\./,keywords:"import",relevance:2
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,{
match:[/\b(?:class|interface|enum|extends|implements|new)/,/\s+/,n],className:{
1:"keyword",3:"title.class"}},{begin:[n,/\s+/,n,/\s+/,/=/],className:{1:"type",
3:"variable",5:"operator"}},{begin:[/record/,/\s+/,n],className:{1:"keyword",
3:"title.class"},contains:[s,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{
beginKeywords:"new throw return else",relevance:0},{
begin:["(?:"+t+"\\s+)",e.UNDERSCORE_IDENT_RE,/\s*(?=\()/],className:{
2:"title.function"},keywords:a,contains:[{className:"params",begin:/\(/,
end:/\)/,keywords:a,relevance:0,
contains:[i,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,ce,e.C_BLOCK_COMMENT_MODE]
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},ce,i]}},grmr_javascript:Ee,
grmr_json:e=>({name:"JSON",contains:[{className:"attr",
begin:/"(\\.|[^\\"\r\n])*"(?=\s*:)/,relevance:1.01},{match:/[{}[\],:]/,
className:"punctuation",relevance:0},e.QUOTE_STRING_MODE,{
beginKeywords:"true false null"
},e.C_NUMBER_MODE,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE],illegal:"\\S"}),
grmr_kotlin:e=>{const n={
keyword:"abstract as val var vararg get set class object open private protected public noinline crossinline dynamic final enum if else do while for when throw try catch finally import package is in fun override companion reified inline lateinit init interface annotation data sealed internal infix operator out by constructor super tailrec where const inner suspend typealias external expect actual",
built_in:"Byte Short Char Int Long Boolean Float Double Void Unit Nothing",
literal:"true false null"},t={className:"symbol",begin:e.UNDERSCORE_IDENT_RE+"@"
},a={className:"subst",begin:/\$\{/,end:/\}/,contains:[e.C_NUMBER_MODE]},i={
className:"variable",begin:"\\$"+e.UNDERSCORE_IDENT_RE},s={className:"string",
variants:[{begin:'"""',end:'"""(?=[^"])',contains:[i,a]},{begin:"'",end:"'",
illegal:/\n/,contains:[e.BACKSLASH_ESCAPE]},{begin:'"',end:'"',illegal:/\n/,
contains:[e.BACKSLASH_ESCAPE,i,a]}]};a.contains.push(s);const r={
className:"meta",
begin:"@(?:file|property|field|get|set|receiver|param|setparam|delegate)\\s*:(?:\\s*"+e.UNDERSCORE_IDENT_RE+")?"
},o={className:"meta",begin:"@"+e.UNDERSCORE_IDENT_RE,contains:[{begin:/\(/,
end:/\)/,contains:[e.inherit(s,{className:"string"})]}]
},l=ce,c=e.COMMENT("/\\*","\\*/",{contains:[e.C_BLOCK_COMMENT_MODE]}),d={
variants:[{className:"type",begin:e.UNDERSCORE_IDENT_RE},{begin:/\(/,end:/\)/,
contains:[]}]},g=d;return g.variants[1].contains=[d],d.variants[1].contains=[g],
{name:"Kotlin",aliases:["kt","kts"],keywords:n,
contains:[e.COMMENT("/\\*\\*","\\*/",{relevance:0,contains:[{className:"doctag",
begin:"@[A-Za-z]+"}]}),e.C_LINE_COMMENT_MODE,c,{className:"keyword",
begin:/\b(break|continue|return|this)\b/,starts:{contains:[{className:"symbol",
begin:/@\w+/}]}},t,r,o,{className:"function",beginKeywords:"fun",end:"[(]|$",
returnBegin:!0,excludeEnd:!0,keywords:n,relevance:5,contains:[{
begin:e.UNDERSCORE_IDENT_RE+"\\s*\\(",returnBegin:!0,relevance:0,
contains:[e.UNDERSCORE_TITLE_MODE]},{className:"type",begin:/</,end:/>/,
keywords:"reified",relevance:0},{className:"params",begin:/\(/,end:/\)/,
endsParent:!0,keywords:n,relevance:0,contains:[{begin:/:/,end:/[=,\/]/,
endsWithParent:!0,contains:[d,e.C_LINE_COMMENT_MODE,c],relevance:0
},e.C_LINE_COMMENT_MODE,c,r,o,s,e.C_NUMBER_MODE]},c]},{className:"class",
beginKeywords:"class interface trait",end:/[:\{(]|$/,excludeEnd:!0,
illegal:"extends implements",contains:[{
beginKeywords:"public protected internal private constructor"
},e.UNDERSCORE_TITLE_MODE,{className:"type",begin:/</,end:/>/,excludeBegin:!0,
excludeEnd:!0,relevance:0},{className:"type",begin:/[,:]\s*/,end:/[<\(,]|$/,
excludeBegin:!0,returnEnd:!0},r,o]},s,{className:"meta",begin:"^#!/usr/bin/env",
end:"$",illegal:"\n"},l]}},grmr_less:e=>{
const n=ee(e),t=re,a="([\\w-]+|@\\{[\\w-]+\\})",i=[],s=[],r=e=>({
className:"string",begin:"~?"+e+".*?"+e}),o=(e,n,t)=>({className:e,begin:n,
relevance:t}),l={$pattern:/[a-z-]+/,keyword:"and or not only",
attribute:te.join(" ")},c={begin:"\\(",end:"\\)",contains:s,keywords:l,
relevance:0}
;s.push(e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,r("'"),r('"'),n.CSS_NUMBER_MODE,{
begin:"(url|data-uri)\\(",starts:{className:"string",end:"[\\)\\n]",
excludeEnd:!0}
},n.HEXCOLOR,c,o("variable","@@?[\\w-]+",10),o("variable","@\\{[\\w-]+\\}"),o("built_in","~?`[^`]*?`"),{
className:"attribute",begin:"[\\w-]+\\s*:",end:":",returnBegin:!0,excludeEnd:!0
},n.IMPORTANT);const d=s.concat({begin:/\{/,end:/\}/,contains:i}),g={
beginKeywords:"when",endsWithParent:!0,contains:[{beginKeywords:"and not"
}].concat(s)},u={begin:a+"\\s*:",returnBegin:!0,end:/[;}]/,relevance:0,
contains:[{begin:/-(webkit|moz|ms|o)-/},{className:"attribute",
begin:"\\b("+se.join("|")+")\\b",end:/(?=:)/,starts:{endsWithParent:!0,
illegal:"[<=$]",relevance:0,contains:s}}]},b={className:"keyword",
begin:"@(import|media|charset|font-face|(-[a-z]+-)?keyframes|supports|document|namespace|page|viewport|host)\\b",
starts:{end:"[;{}]",keywords:l,returnEnd:!0,contains:s,relevance:0}},m={
className:"variable",variants:[{begin:"@[\\w-]+\\s*:",relevance:15},{
begin:"@[\\w-]+"}],starts:{end:"[;}]",returnEnd:!0,contains:d}},p={variants:[{
begin:"[\\.#:&\\[>]",end:"[;{}]"},{begin:a,end:/\{/}],returnBegin:!0,
returnEnd:!0,illegal:"[<='$\"]",relevance:0,
contains:[e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,g,o("keyword","all\\b"),o("variable","@\\{[\\w-]+\\}"),{
begin:"\\b("+ne.join("|")+")\\b",className:"selector-tag"
},o("selector-tag",a+"%?",0),o("selector-id","#"+a),o("selector-class","\\."+a,0),o("selector-tag","&",0),n.ATTRIBUTE_SELECTOR_MODE,{
className:"selector-pseudo",begin:":("+ae.join("|")+")"},{
className:"selector-pseudo",begin:"::("+ie.join("|")+")"},{begin:/\(/,end:/\)/,
relevance:0,contains:d},{begin:"!important"}]},_={
begin:`[\\w-]+:(:)?(${t.join("|")})`,returnBegin:!0,contains:[p]}
;return i.push(e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,b,m,_,u,p),{
name:"Less",case_insensitive:!0,illegal:"[=>'/<($\"]",contains:i}},grmr_lua:e=>{
const n="\\[=*\\[",t="\\]=*\\]",a={begin:n,end:t,contains:["self"]
},i=[e.COMMENT("--(?!\\[=*\\[)","$"),e.COMMENT("--\\[=*\\[",t,{contains:[a],
relevance:10})];return{name:"Lua",keywords:{$pattern:e.UNDERSCORE_IDENT_RE,
literal:"true false nil",
keyword:"and break do else elseif end for goto if in local not or repeat return then until while",
built_in:"_G _ENV _VERSION __index __newindex __mode __call __metatable __tostring __len __gc __add __sub __mul __div __mod __pow __concat __unm __eq __lt __le assert collectgarbage dofile error getfenv getmetatable ipairs load loadfile loadstring module next pairs pcall print rawequal rawget rawset require select setfenv setmetatable tonumber tostring type unpack xpcall arg self coroutine resume yield status wrap create running debug getupvalue debug sethook getmetatable gethook setmetatable setlocal traceback setfenv getinfo setupvalue getlocal getregistry getfenv io lines write close flush open output type read stderr stdin input stdout popen tmpfile math log max acos huge ldexp pi cos tanh pow deg tan cosh sinh random randomseed frexp ceil floor rad abs sqrt modf asin min mod fmod log10 atan2 exp sin atan os exit setlocale date getenv difftime remove time clock tmpname rename execute package preload loadlib loaded loaders cpath config path seeall string sub upper len gfind rep find match char dump gmatch reverse byte format gsub lower table setn insert getn foreachi maxn foreach concat sort remove"
},contains:i.concat([{className:"function",beginKeywords:"function",end:"\\)",
contains:[e.inherit(e.TITLE_MODE,{
begin:"([_a-zA-Z]\\w*\\.)*([_a-zA-Z]\\w*:)?[_a-zA-Z]\\w*"}),{className:"params",
begin:"\\(",endsWithParent:!0,contains:i}].concat(i)
},e.C_NUMBER_MODE,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,{className:"string",
begin:n,end:t,contains:[a],relevance:5}])}},grmr_makefile:e=>{const n={
className:"variable",variants:[{begin:"\\$\\("+e.UNDERSCORE_IDENT_RE+"\\)",
contains:[e.BACKSLASH_ESCAPE]},{begin:/\$[@%<?\^\+\*]/}]},t={className:"string",
begin:/"/,end:/"/,contains:[e.BACKSLASH_ESCAPE,n]},a={className:"variable",
begin:/\$\([\w-]+\s/,end:/\)/,keywords:{
built_in:"subst patsubst strip findstring filter filter-out sort word wordlist firstword lastword dir notdir suffix basename addsuffix addprefix join wildcard realpath abspath error warning shell origin flavor foreach if or and call eval file value"
},contains:[n]},i={begin:"^"+e.UNDERSCORE_IDENT_RE+"\\s*(?=[:+?]?=)"},s={
className:"section",begin:/^[^\s]+:/,end:/$/,contains:[n]};return{
name:"Makefile",aliases:["mk","mak","make"],keywords:{$pattern:/[\w-]+/,
keyword:"define endef undefine ifdef ifndef ifeq ifneq else endif include -include sinclude override export unexport private vpath"
},contains:[e.HASH_COMMENT_MODE,n,t,a,i,{className:"meta",begin:/^\.PHONY:/,
end:/$/,keywords:{$pattern:/[\.\w]+/,keyword:".PHONY"}},s]}},grmr_xml:e=>{
const n=b(/[A-Z_]/,u(/[A-Z0-9_.-]*:/),/[A-Z0-9_.-]*/),t={className:"symbol",
begin:/&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/},a={begin:/\s/,contains:[{
className:"keyword",begin:/#?[a-z_][a-z1-9_-]+/,illegal:/\n/}]},i=e.inherit(a,{
begin:/\(/,end:/\)/}),s=e.inherit(e.APOS_STRING_MODE,{className:"string"
}),r=e.inherit(e.QUOTE_STRING_MODE,{className:"string"}),o={endsWithParent:!0,
illegal:/</,relevance:0,contains:[{className:"attr",begin:/[A-Za-z0-9._:-]+/,
relevance:0},{begin:/=\s*/,relevance:0,contains:[{className:"string",
endsParent:!0,variants:[{begin:/"/,end:/"/,contains:[t]},{begin:/'/,end:/'/,
contains:[t]},{begin:/[^\s"'=<>`]+/}]}]}]};return{name:"HTML, XML",
aliases:["html","xhtml","rss","atom","xjb","xsd","xsl","plist","wsf","svg"],
case_insensitive:!0,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,
relevance:10,contains:[a,r,s,i,{begin:/\[/,end:/\]/,contains:[{className:"meta",
begin:/<![a-z]/,end:/>/,contains:[a,i,r,s]}]}]},e.COMMENT(/<!--/,/-->/,{
relevance:10}),{begin:/<!\[CDATA\[/,end:/\]\]>/,relevance:10},t,{
className:"meta",begin:/<\?xml/,end:/\?>/,relevance:10},{className:"tag",
begin:/<style(?=\s|>)/,end:/>/,keywords:{name:"style"},contains:[o],starts:{
end:/<\/style>/,returnEnd:!0,subLanguage:["css","xml"]}},{className:"tag",
begin:/<script(?=\s|>)/,end:/>/,keywords:{name:"script"},contains:[o],starts:{
end:/<\/script>/,returnEnd:!0,subLanguage:["javascript","handlebars","xml"]}},{
className:"tag",begin:/<>|<\/>/},{className:"tag",
begin:b(/</,g(b(n,m(/\/>/,/>/,/\s/)))),end:/\/?>/,contains:[{className:"name",
begin:n,relevance:0,starts:o}]},{className:"tag",begin:b(/<\//,g(b(n,/>/))),
contains:[{className:"name",begin:n,relevance:0},{begin:/>/,relevance:0,
endsParent:!0}]}]}},grmr_markdown:e=>{const n={begin:/<\/?[A-Za-z_]/,end:">",
subLanguage:"xml",relevance:0},t={variants:[{begin:/\[.+?\]\[.*?\]/,relevance:0
},{begin:/\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,
relevance:2},{begin:b(/\[.+?\]\(/,/[A-Za-z][A-Za-z0-9+.-]*/,/:\/\/.*?\)/),
relevance:2},{begin:/\[.+?\]\([./?&#].*?\)/,relevance:1},{
begin:/\[.+?\]\(.*?\)/,relevance:0}],returnBegin:!0,contains:[{
className:"string",relevance:0,begin:"\\[",end:"\\]",excludeBegin:!0,
returnEnd:!0},{className:"link",relevance:0,begin:"\\]\\(",end:"\\)",
excludeBegin:!0,excludeEnd:!0},{className:"symbol",relevance:0,begin:"\\]\\[",
end:"\\]",excludeBegin:!0,excludeEnd:!0}]},a={className:"strong",contains:[],
variants:[{begin:/_{2}/,end:/_{2}/},{begin:/\*{2}/,end:/\*{2}/}]},i={
className:"emphasis",contains:[],variants:[{begin:/\*(?!\*)/,end:/\*/},{
begin:/_(?!_)/,end:/_/,relevance:0}]};a.contains.push(i),i.contains.push(a)
;let s=[n,t]
;return a.contains=a.contains.concat(s),i.contains=i.contains.concat(s),
s=s.concat(a,i),{name:"Markdown",aliases:["md","mkdown","mkd"],contains:[{
className:"section",variants:[{begin:"^#{1,6}",end:"$",contains:s},{
begin:"(?=^.+?\\n[=-]{2,}$)",contains:[{begin:"^[=-]*$"},{begin:"^",end:"\\n",
contains:s}]}]},n,{className:"bullet",begin:"^[ \t]*([*+-]|(\\d+\\.))(?=\\s+)",
end:"\\s+",excludeEnd:!0},a,i,{className:"quote",begin:"^>\\s+",contains:s,
end:"$"},{className:"code",variants:[{begin:"(`{3,})[^`](.|\\n)*?\\1`*[ ]*"},{
begin:"(~{3,})[^~](.|\\n)*?\\1~*[ ]*"},{begin:"```",end:"```+[ ]*$"},{
begin:"~~~",end:"~~~+[ ]*$"},{begin:"`.+?`"},{begin:"(?=^( {4}|\\t))",
contains:[{begin:"^( {4}|\\t)",end:"(\\n)$"}],relevance:0}]},{
begin:"^[-\\*]{3,}",end:"$"},t,{begin:/^\[[^\n]+\]:/,returnBegin:!0,contains:[{
className:"symbol",begin:/\[/,end:/\]/,excludeBegin:!0,excludeEnd:!0},{
className:"link",begin:/:\s*/,end:/$/,excludeBegin:!0}]}]}},grmr_objectivec:e=>{
const n=/[a-zA-Z@][a-zA-Z0-9_]*/,t={$pattern:n,
keyword:["@interface","@class","@protocol","@implementation"]};return{
name:"Objective-C",aliases:["mm","objc","obj-c","obj-c++","objective-c++"],
keywords:{$pattern:n,
keyword:["int","float","while","char","export","sizeof","typedef","const","struct","for","union","unsigned","long","volatile","static","bool","mutable","if","do","return","goto","void","enum","else","break","extern","asm","case","short","default","double","register","explicit","signed","typename","this","switch","continue","wchar_t","inline","readonly","assign","readwrite","self","@synchronized","id","typeof","nonatomic","super","unichar","IBOutlet","IBAction","strong","weak","copy","in","out","inout","bycopy","byref","oneway","__strong","__weak","__block","__autoreleasing","@private","@protected","@public","@try","@property","@end","@throw","@catch","@finally","@autoreleasepool","@synthesize","@dynamic","@selector","@optional","@required","@encode","@package","@import","@defs","@compatibility_alias","__bridge","__bridge_transfer","__bridge_retained","__bridge_retain","__covariant","__contravariant","__kindof","_Nonnull","_Nullable","_Null_unspecified","__FUNCTION__","__PRETTY_FUNCTION__","__attribute__","getter","setter","retain","unsafe_unretained","nonnull","nullable","null_unspecified","null_resettable","class","instancetype","NS_DESIGNATED_INITIALIZER","NS_UNAVAILABLE","NS_REQUIRES_SUPER","NS_RETURNS_INNER_POINTER","NS_INLINE","NS_AVAILABLE","NS_DEPRECATED","NS_ENUM","NS_OPTIONS","NS_SWIFT_UNAVAILABLE","NS_ASSUME_NONNULL_BEGIN","NS_ASSUME_NONNULL_END","NS_REFINED_FOR_SWIFT","NS_SWIFT_NAME","NS_SWIFT_NOTHROW","NS_DURING","NS_HANDLER","NS_ENDHANDLER","NS_VALUERETURN","NS_VOIDRETURN"],
literal:["false","true","FALSE","TRUE","nil","YES","NO","NULL"],
built_in:["BOOL","dispatch_once_t","dispatch_queue_t","dispatch_sync","dispatch_async","dispatch_once"]
},illegal:"</",contains:[{className:"built_in",
begin:"\\b(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)\\w+"
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,e.C_NUMBER_MODE,e.QUOTE_STRING_MODE,e.APOS_STRING_MODE,{
className:"string",variants:[{begin:'@"',end:'"',illegal:"\\n",
contains:[e.BACKSLASH_ESCAPE]}]},{className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,
keywords:{
keyword:"if else elif endif define undef warning error line pragma ifdef ifndef include"
},contains:[{begin:/\\\n/,relevance:0},e.inherit(e.QUOTE_STRING_MODE,{
className:"string"}),{className:"string",begin:/<.*?>/,end:/$/,illegal:"\\n"
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{className:"class",
begin:"("+t.keyword.join("|")+")\\b",end:/(\{|$)/,excludeEnd:!0,keywords:t,
contains:[e.UNDERSCORE_TITLE_MODE]},{begin:"\\."+e.UNDERSCORE_IDENT_RE,
relevance:0}]}},grmr_perl:e=>{const n=/[dualxmsipngr]{0,12}/,t={
$pattern:/[\w.]+/,
keyword:"abs accept alarm and atan2 bind binmode bless break caller chdir chmod chomp chop chown chr chroot close closedir connect continue cos crypt dbmclose dbmopen defined delete die do dump each else elsif endgrent endhostent endnetent endprotoent endpwent endservent eof eval exec exists exit exp fcntl fileno flock for foreach fork format formline getc getgrent getgrgid getgrnam gethostbyaddr gethostbyname gethostent getlogin getnetbyaddr getnetbyname getnetent getpeername getpgrp getpriority getprotobyname getprotobynumber getprotoent getpwent getpwnam getpwuid getservbyname getservbyport getservent getsockname getsockopt given glob gmtime goto grep gt hex if index int ioctl join keys kill last lc lcfirst length link listen local localtime log lstat lt ma map mkdir msgctl msgget msgrcv msgsnd my ne next no not oct open opendir or ord our pack package pipe pop pos print printf prototype push q|0 qq quotemeta qw qx rand read readdir readline readlink readpipe recv redo ref rename require reset return reverse rewinddir rindex rmdir say scalar seek seekdir select semctl semget semop send setgrent sethostent setnetent setpgrp setpriority setprotoent setpwent setservent setsockopt shift shmctl shmget shmread shmwrite shutdown sin sleep socket socketpair sort splice split sprintf sqrt srand stat state study sub substr symlink syscall sysopen sysread sysseek system syswrite tell telldir tie tied time times tr truncate uc ucfirst umask undef unless unlink unpack unshift untie until use utime values vec wait waitpid wantarray warn when while write x|0 xor y|0"
},a={className:"subst",begin:"[$@]\\{",end:"\\}",keywords:t},i={begin:/->\{/,
end:/\}/},s={variants:[{begin:/\$\d/},{
begin:b(/[$%@](\^\w\b|#\w+(::\w+)*|\{\w+\}|\w+(::\w*)*)/,"(?![A-Za-z])(?![@$%])")
},{begin:/[$%@][^\s\w{]/,relevance:0}]
},r=[e.BACKSLASH_ESCAPE,a,s],o=[/!/,/\//,/\|/,/\?/,/'/,/"/,/#/],l=(e,t,a="\\1")=>{
const i="\\1"===a?a:b(a,t)
;return b(b("(?:",e,")"),t,/(?:\\.|[^\\\/])*?/,i,/(?:\\.|[^\\\/])*?/,a,n)
},c=(e,t,a)=>b(b("(?:",e,")"),t,/(?:\\.|[^\\\/])*?/,a,n),d=[s,e.HASH_COMMENT_MODE,e.COMMENT(/^=\w/,/=cut/,{
endsWithParent:!0}),i,{className:"string",contains:r,variants:[{
begin:"q[qwxr]?\\s*\\(",end:"\\)",relevance:5},{begin:"q[qwxr]?\\s*\\[",
end:"\\]",relevance:5},{begin:"q[qwxr]?\\s*\\{",end:"\\}",relevance:5},{
begin:"q[qwxr]?\\s*\\|",end:"\\|",relevance:5},{begin:"q[qwxr]?\\s*<",end:">",
relevance:5},{begin:"qw\\s+q",end:"q",relevance:5},{begin:"'",end:"'",
contains:[e.BACKSLASH_ESCAPE]},{begin:'"',end:'"'},{begin:"`",end:"`",
contains:[e.BACKSLASH_ESCAPE]},{begin:/\{\w+\}/,relevance:0},{
begin:"-?\\w+\\s*=>",relevance:0}]},{className:"number",
begin:"(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b",
relevance:0},{
begin:"(\\/\\/|"+e.RE_STARTERS_RE+"|\\b(split|return|print|reverse|grep)\\b)\\s*",
keywords:"split return print reverse grep",relevance:0,
contains:[e.HASH_COMMENT_MODE,{className:"regexp",variants:[{
begin:l("s|tr|y",m(...o,{capture:!0}))},{begin:l("s|tr|y","\\(","\\)")},{
begin:l("s|tr|y","\\[","\\]")},{begin:l("s|tr|y","\\{","\\}")}],relevance:2},{
className:"regexp",variants:[{begin:/(m|qr)\/\//,relevance:0},{
begin:c("(?:m|qr)?",/\//,/\//)},{begin:c("m|qr",m(...o,{capture:!0}),/\1/)},{
begin:c("m|qr",/\(/,/\)/)},{begin:c("m|qr",/\[/,/\]/)},{
begin:c("m|qr",/\{/,/\}/)}]}]},{className:"function",beginKeywords:"sub",
end:"(\\s*\\(.*?\\))?[;{]",excludeEnd:!0,relevance:5,contains:[e.TITLE_MODE]},{
begin:"-\\w\\b",relevance:0},{begin:"^__DATA__$",end:"^__END__$",
subLanguage:"mojolicious",contains:[{begin:"^@@.*",end:"$",className:"comment"}]
}];return a.contains=d,i.contains=d,{name:"Perl",aliases:["pl","pm"],keywords:t,
contains:d}},grmr_php:e=>{const n={className:"variable",
begin:"\\$+[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*(?![A-Za-z0-9])(?![$])"},t={
className:"meta",variants:[{begin:/<\?php/,relevance:10},{begin:/<\?[=]?/},{
begin:/\?>/}]},a={className:"subst",variants:[{begin:/\$\w+/},{begin:/\{\$/,
end:/\}/}]},i=e.inherit(e.APOS_STRING_MODE,{illegal:null
}),s=e.inherit(e.QUOTE_STRING_MODE,{illegal:null,
contains:e.QUOTE_STRING_MODE.contains.concat(a)}),r=e.END_SAME_AS_BEGIN({
begin:/<<<[ \t]*(\w+)\n/,end:/[ \t]*(\w+)\b/,
contains:e.QUOTE_STRING_MODE.contains.concat(a)}),o={className:"string",
contains:[e.BACKSLASH_ESCAPE,t],variants:[e.inherit(i,{begin:"b'",end:"'"
}),e.inherit(s,{begin:'b"',end:'"'}),s,i,r]},l={className:"number",variants:[{
begin:"\\b0b[01]+(?:_[01]+)*\\b"},{begin:"\\b0o[0-7]+(?:_[0-7]+)*\\b"},{
begin:"\\b0x[\\da-f]+(?:_[\\da-f]+)*\\b"},{
begin:"(?:\\b\\d+(?:_\\d+)*(\\.(?:\\d+(?:_\\d+)*))?|\\B\\.\\d+)(?:e[+-]?\\d+)?"
}],relevance:0},c={
keyword:"__CLASS__ __DIR__ __FILE__ __FUNCTION__ __LINE__ __METHOD__ __NAMESPACE__ __TRAIT__ die echo exit include include_once print require require_once array abstract and as binary bool boolean break callable case catch class clone const continue declare default do double else elseif empty enddeclare endfor endforeach endif endswitch endwhile enum eval extends final finally float for foreach from global goto if implements instanceof insteadof int integer interface isset iterable list match|0 mixed new object or private protected public real return string switch throw trait try unset use var void while xor yield",
literal:"false null true",
built_in:"Error|0 AppendIterator ArgumentCountError ArithmeticError ArrayIterator ArrayObject AssertionError BadFunctionCallException BadMethodCallException CachingIterator CallbackFilterIterator CompileError Countable DirectoryIterator DivisionByZeroError DomainException EmptyIterator ErrorException Exception FilesystemIterator FilterIterator GlobIterator InfiniteIterator InvalidArgumentException IteratorIterator LengthException LimitIterator LogicException MultipleIterator NoRewindIterator OutOfBoundsException OutOfRangeException OuterIterator OverflowException ParentIterator ParseError RangeException RecursiveArrayIterator RecursiveCachingIterator RecursiveCallbackFilterIterator RecursiveDirectoryIterator RecursiveFilterIterator RecursiveIterator RecursiveIteratorIterator RecursiveRegexIterator RecursiveTreeIterator RegexIterator RuntimeException SeekableIterator SplDoublyLinkedList SplFileInfo SplFileObject SplFixedArray SplHeap SplMaxHeap SplMinHeap SplObjectStorage SplObserver SplObserver SplPriorityQueue SplQueue SplStack SplSubject SplSubject SplTempFileObject TypeError UnderflowException UnexpectedValueException UnhandledMatchError ArrayAccess Closure Generator Iterator IteratorAggregate Serializable Stringable Throwable Traversable WeakReference WeakMap Directory __PHP_Incomplete_Class parent php_user_filter self static stdClass"
};return{case_insensitive:!0,keywords:c,
contains:[e.HASH_COMMENT_MODE,e.COMMENT("//","$",{contains:[t]
}),e.COMMENT("/\\*","\\*/",{contains:[{className:"doctag",begin:"@[A-Za-z]+"}]
}),e.COMMENT("__halt_compiler.+?;",!1,{endsWithParent:!0,
keywords:"__halt_compiler"}),t,{className:"keyword",begin:/\$this\b/},n,{
begin:/(::|->)+[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/},{className:"function",
relevance:0,beginKeywords:"fn function",end:/[;{]/,excludeEnd:!0,
illegal:"[$%\\[]",contains:[{beginKeywords:"use"},e.UNDERSCORE_TITLE_MODE,{
begin:"=>",endsParent:!0},{className:"params",begin:"\\(",end:"\\)",
excludeBegin:!0,excludeEnd:!0,keywords:c,
contains:["self",n,e.C_BLOCK_COMMENT_MODE,o,l]}]},{className:"class",variants:[{
beginKeywords:"enum",illegal:/[($"]/},{beginKeywords:"class interface trait",
illegal:/[:($"]/}],relevance:0,end:/\{/,excludeEnd:!0,contains:[{
beginKeywords:"extends implements"},e.UNDERSCORE_TITLE_MODE]},{
beginKeywords:"namespace",relevance:0,end:";",illegal:/[.']/,
contains:[e.UNDERSCORE_TITLE_MODE]},{beginKeywords:"use",relevance:0,end:";",
contains:[e.UNDERSCORE_TITLE_MODE]},o,l]}},grmr_php_template:e=>({
name:"PHP template",subLanguage:"xml",contains:[{begin:/<\?(php|=)?/,end:/\?>/,
subLanguage:"php",contains:[{begin:"/\\*",end:"\\*/",skip:!0},{begin:'b"',
end:'"',skip:!0},{begin:"b'",end:"'",skip:!0},e.inherit(e.APOS_STRING_MODE,{
illegal:null,className:null,contains:null,skip:!0
}),e.inherit(e.QUOTE_STRING_MODE,{illegal:null,className:null,contains:null,
skip:!0})]}]}),grmr_plaintext:e=>({name:"Plain text",aliases:["text","txt"],
disableAutodetect:!0}),grmr_python:e=>{const n={$pattern:/[A-Za-z]\w+|__\w+__/,
keyword:["and","as","assert","async","await","break","class","continue","def","del","elif","else","except","finally","for","from","global","if","import","in","is","lambda","nonlocal|10","not","or","pass","raise","return","try","while","with","yield"],
built_in:["__import__","abs","all","any","ascii","bin","bool","breakpoint","bytearray","bytes","callable","chr","classmethod","compile","complex","delattr","dict","dir","divmod","enumerate","eval","exec","filter","float","format","frozenset","getattr","globals","hasattr","hash","help","hex","id","input","int","isinstance","issubclass","iter","len","list","locals","map","max","memoryview","min","next","object","oct","open","ord","pow","print","property","range","repr","reversed","round","set","setattr","slice","sorted","staticmethod","str","sum","super","tuple","type","vars","zip"],
literal:["__debug__","Ellipsis","False","None","NotImplemented","True"],
type:["Any","Callable","Coroutine","Dict","List","Literal","Generic","Optional","Sequence","Set","Tuple","Type","Union"]
},t={className:"meta",begin:/^(>>>|\.\.\.) /},a={className:"subst",begin:/\{/,
end:/\}/,keywords:n,illegal:/#/},i={begin:/\{\{/,relevance:0},s={
className:"string",contains:[e.BACKSLASH_ESCAPE],variants:[{
begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,end:/'''/,
contains:[e.BACKSLASH_ESCAPE,t],relevance:10},{
begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,end:/"""/,
contains:[e.BACKSLASH_ESCAPE,t],relevance:10},{
begin:/([fF][rR]|[rR][fF]|[fF])'''/,end:/'''/,
contains:[e.BACKSLASH_ESCAPE,t,i,a]},{begin:/([fF][rR]|[rR][fF]|[fF])"""/,
end:/"""/,contains:[e.BACKSLASH_ESCAPE,t,i,a]},{begin:/([uU]|[rR])'/,end:/'/,
relevance:10},{begin:/([uU]|[rR])"/,end:/"/,relevance:10},{
begin:/([bB]|[bB][rR]|[rR][bB])'/,end:/'/},{begin:/([bB]|[bB][rR]|[rR][bB])"/,
end:/"/},{begin:/([fF][rR]|[rR][fF]|[fF])'/,end:/'/,
contains:[e.BACKSLASH_ESCAPE,i,a]},{begin:/([fF][rR]|[rR][fF]|[fF])"/,end:/"/,
contains:[e.BACKSLASH_ESCAPE,i,a]},e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]
},r="[0-9](_?[0-9])*",o=`(\\b(${r}))?\\.(${r})|\\b(${r})\\.`,l={
className:"number",relevance:0,variants:[{
begin:`(\\b(${r})|(${o}))[eE][+-]?(${r})[jJ]?\\b`},{begin:`(${o})[jJ]?`},{
begin:"\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?\\b"},{
begin:"\\b0[bB](_?[01])+[lL]?\\b"},{begin:"\\b0[oO](_?[0-7])+[lL]?\\b"},{
begin:"\\b0[xX](_?[0-9a-fA-F])+[lL]?\\b"},{begin:`\\b(${r})[jJ]\\b`}]},c={
className:"comment",begin:g(/# type:/),end:/$/,keywords:n,contains:[{
begin:/# type:/},{begin:/#/,end:/\b\B/,endsWithParent:!0}]},d={
className:"params",variants:[{className:"",begin:/\(\s*\)/,skip:!0},{begin:/\(/,
end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:n,
contains:["self",t,l,s,e.HASH_COMMENT_MODE]}]};return a.contains=[s,l,t],{
name:"Python",aliases:["py","gyp","ipython"],keywords:n,
illegal:/(<\/|->|\?)|=>/,contains:[t,l,{begin:/\bself\b/},{beginKeywords:"if",
relevance:0},s,c,e.HASH_COMMENT_MODE,{match:[/def/,/\s+/,f],scope:{1:"keyword",
3:"title.function"},contains:[d]},{variants:[{
match:[/class/,/\s+/,f,/\s*/,/\(\s*/,f,/\s*\)/]},{match:[/class/,/\s+/,f]}],
scope:{1:"keyword",3:"title.class",6:"title.class.inherited"}},{
className:"meta",begin:/^[\t ]*@/,end:/(?=#)|$/,contains:[l,d,s]}]}},
grmr_python_repl:e=>({aliases:["pycon"],contains:[{className:"meta",starts:{
end:/ |$/,starts:{end:"$",subLanguage:"python"}},variants:[{
begin:/^>>>(?=[ ]|$)/},{begin:/^\.\.\.(?=[ ]|$)/}]}]}),grmr_r:e=>{
const n=/(?:(?:[a-zA-Z]|\.[._a-zA-Z])[._a-zA-Z0-9]*)|\.(?!\d)/,t=m(/0[xX][0-9a-fA-F]+\.[0-9a-fA-F]*[pP][+-]?\d+i?/,/0[xX][0-9a-fA-F]+(?:[pP][+-]?\d+)?[Li]?/,/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[Li]?/),a=/[=!<>:]=|\|\||&&|:::?|<-|<<-|->>|->|\|>|[-+*\/?!$&|:<=>@^~]|\*\*/,i=m(/[()]/,/[{}]/,/\[\[/,/[[\]]/,/\\/,/,/)
;return{name:"R",keywords:{$pattern:n,
keyword:"function if in break next repeat else for while",
literal:"NULL NA TRUE FALSE Inf NaN NA_integer_|10 NA_real_|10 NA_character_|10 NA_complex_|10",
built_in:"LETTERS letters month.abb month.name pi T F abs acos acosh all any anyNA Arg as.call as.character as.complex as.double as.environment as.integer as.logical as.null.default as.numeric as.raw asin asinh atan atanh attr attributes baseenv browser c call ceiling class Conj cos cosh cospi cummax cummin cumprod cumsum digamma dim dimnames emptyenv exp expression floor forceAndCall gamma gc.time globalenv Im interactive invisible is.array is.atomic is.call is.character is.complex is.double is.environment is.expression is.finite is.function is.infinite is.integer is.language is.list is.logical is.matrix is.na is.name is.nan is.null is.numeric is.object is.pairlist is.raw is.recursive is.single is.symbol lazyLoadDBfetch length lgamma list log max min missing Mod names nargs nzchar oldClass on.exit pos.to.env proc.time prod quote range Re rep retracemem return round seq_along seq_len seq.int sign signif sin sinh sinpi sqrt standardGeneric substitute sum switch tan tanh tanpi tracemem trigamma trunc unclass untracemem UseMethod xtfrm"
},contains:[e.COMMENT(/#'/,/$/,{contains:[{scope:"doctag",begin:"@examples",
starts:{contains:[{begin:/\n/},{begin:/#'\s*(?=@[a-zA-Z]+)/,endsParent:!0},{
begin:/#'/,end:/$/,excludeBegin:!0}]}},{scope:"doctag",begin:"@param",end:/$/,
contains:[{scope:"variable",variants:[{begin:n},{begin:/`(?:\\.|[^`\\])+`/}],
endsParent:!0}]},{scope:"doctag",begin:/@[a-zA-Z]+/},{scope:"keyword",
begin:/\\[a-zA-Z]+/}]}),e.HASH_COMMENT_MODE,{scope:"string",
contains:[e.BACKSLASH_ESCAPE],variants:[e.END_SAME_AS_BEGIN({
begin:/[rR]"(-*)\(/,end:/\)(-*)"/}),e.END_SAME_AS_BEGIN({begin:/[rR]"(-*)\{/,
end:/\}(-*)"/}),e.END_SAME_AS_BEGIN({begin:/[rR]"(-*)\[/,end:/\](-*)"/
}),e.END_SAME_AS_BEGIN({begin:/[rR]'(-*)\(/,end:/\)(-*)'/
}),e.END_SAME_AS_BEGIN({begin:/[rR]'(-*)\{/,end:/\}(-*)'/
}),e.END_SAME_AS_BEGIN({begin:/[rR]'(-*)\[/,end:/\](-*)'/}),{begin:'"',end:'"',
relevance:0},{begin:"'",end:"'",relevance:0}]},{relevance:0,variants:[{scope:{
1:"operator",2:"number"},match:[a,t]},{scope:{1:"operator",2:"number"},
match:[/%[^%]*%/,t]},{scope:{1:"punctuation",2:"number"},match:[i,t]},{scope:{
2:"number"},match:[/[^a-zA-Z0-9._]|^/,t]}]},{scope:{3:"operator"},
match:[n,/\s+/,/<-/,/\s+/]},{scope:"operator",relevance:0,variants:[{match:a},{
match:/%[^%]*%/}]},{scope:"punctuation",relevance:0,match:i},{begin:"`",end:"`",
contains:[{begin:/\\./}]}]}},grmr_ruby:e=>{
const n="([a-zA-Z_]\\w*[!?=]?|[-+~]@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?)",t={
keyword:"and then defined module in return redo if BEGIN retry end for self when next until do begin unless END rescue else break undef not super class case require yield alias while ensure elsif or include attr_reader attr_writer attr_accessor __FILE__",
built_in:"proc lambda",literal:"true false nil"},a={className:"doctag",
begin:"@[A-Za-z]+"},i={begin:"#<",end:">"},s=[e.COMMENT("#","$",{contains:[a]
}),e.COMMENT("^=begin","^=end",{contains:[a],relevance:10
}),e.COMMENT("^__END__","\\n$")],r={className:"subst",begin:/#\{/,end:/\}/,
keywords:t},o={className:"string",contains:[e.BACKSLASH_ESCAPE,r],variants:[{
begin:/'/,end:/'/},{begin:/"/,end:/"/},{begin:/`/,end:/`/},{begin:/%[qQwWx]?\(/,
end:/\)/},{begin:/%[qQwWx]?\[/,end:/\]/},{begin:/%[qQwWx]?\{/,end:/\}/},{
begin:/%[qQwWx]?</,end:/>/},{begin:/%[qQwWx]?\//,end:/\//},{begin:/%[qQwWx]?%/,
end:/%/},{begin:/%[qQwWx]?-/,end:/-/},{begin:/%[qQwWx]?\|/,end:/\|/},{
begin:/\B\?(\\\d{1,3})/},{begin:/\B\?(\\x[A-Fa-f0-9]{1,2})/},{
begin:/\B\?(\\u\{?[A-Fa-f0-9]{1,6}\}?)/},{
begin:/\B\?(\\M-\\C-|\\M-\\c|\\c\\M-|\\M-|\\C-\\M-)[\x20-\x7e]/},{
begin:/\B\?\\(c|C-)[\x20-\x7e]/},{begin:/\B\?\\?\S/},{
begin:b(/<<[-~]?'?/,g(/(\w+)(?=\W)[^\n]*\n(?:[^\n]*\n)*?\s*\1\b/)),
contains:[e.END_SAME_AS_BEGIN({begin:/(\w+)/,end:/(\w+)/,
contains:[e.BACKSLASH_ESCAPE,r]})]}]},l="[0-9](_?[0-9])*",c={className:"number",
relevance:0,variants:[{
begin:`\\b([1-9](_?[0-9])*|0)(\\.(${l}))?([eE][+-]?(${l})|r)?i?\\b`},{
begin:"\\b0[dD][0-9](_?[0-9])*r?i?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*r?i?\\b"
},{begin:"\\b0[oO][0-7](_?[0-7])*r?i?\\b"},{
begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*r?i?\\b"},{
begin:"\\b0(_?[0-7])+r?i?\\b"}]},d={className:"params",begin:"\\(",end:"\\)",
endsParent:!0,keywords:t},u=[o,{className:"class",beginKeywords:"class module",
end:"$|;",illegal:/=/,contains:[e.inherit(e.TITLE_MODE,{
begin:"[A-Za-z_]\\w*(::\\w+)*(\\?|!)?"}),{begin:"<\\s*",contains:[{
begin:"("+e.IDENT_RE+"::)?"+e.IDENT_RE,relevance:0}]}].concat(s)},{
className:"function",begin:b(/def\s+/,g(n+"\\s*(\\(|;|$)")),relevance:0,
keywords:"def",end:"$|;",contains:[e.inherit(e.TITLE_MODE,{begin:n
}),d].concat(s)},{begin:e.IDENT_RE+"::"},{className:"symbol",
begin:e.UNDERSCORE_IDENT_RE+"(!|\\?)?:",relevance:0},{className:"symbol",
begin:":(?!\\s)",contains:[o,{begin:n}],relevance:0},c,{className:"variable",
begin:"(\\$\\W)|((\\$|@@?)(\\w+))(?=[^@$?])(?![A-Za-z])(?![@$?'])"},{
className:"params",begin:/\|/,end:/\|/,relevance:0,keywords:t},{
begin:"("+e.RE_STARTERS_RE+"|unless)\\s*",keywords:"unless",contains:[{
className:"regexp",contains:[e.BACKSLASH_ESCAPE,r],illegal:/\n/,variants:[{
begin:"/",end:"/[a-z]*"},{begin:/%r\{/,end:/\}[a-z]*/},{begin:"%r\\(",
end:"\\)[a-z]*"},{begin:"%r!",end:"![a-z]*"},{begin:"%r\\[",end:"\\][a-z]*"}]
}].concat(i,s),relevance:0}].concat(i,s);r.contains=u,d.contains=u;const m=[{
begin:/^\s*=>/,starts:{end:"$",contains:u}},{className:"meta",
begin:"^([>?]>|[\\w#]+\\(\\w+\\):\\d+:\\d+>|(\\w+-)?\\d+\\.\\d+\\.\\d+(p\\d+)?[^\\d][^>]+>)(?=[ ])",
starts:{end:"$",contains:u}}];return s.unshift(i),{name:"Ruby",
aliases:["rb","gemspec","podspec","thor","irb"],keywords:t,illegal:/\/\*/,
contains:[e.SHEBANG({binary:"ruby"})].concat(m).concat(s).concat(u)}},
grmr_rust:e=>{const n={className:"title.function.invoke",relevance:0,
begin:b(/\b/,/(?!let\b)/,e.IDENT_RE,g(/\s*\(/))
},t="([ui](8|16|32|64|128|size)|f(32|64))?",a=["drop ","Copy","Send","Sized","Sync","Drop","Fn","FnMut","FnOnce","ToOwned","Clone","Debug","PartialEq","PartialOrd","Eq","Ord","AsRef","AsMut","Into","From","Default","Iterator","Extend","IntoIterator","DoubleEndedIterator","ExactSizeIterator","SliceConcatExt","ToString","assert!","assert_eq!","bitflags!","bytes!","cfg!","col!","concat!","concat_idents!","debug_assert!","debug_assert_eq!","env!","panic!","file!","format!","format_args!","include_bin!","include_str!","line!","local_data_key!","module_path!","option_env!","print!","println!","select!","stringify!","try!","unimplemented!","unreachable!","vec!","write!","writeln!","macro_rules!","assert_ne!","debug_assert_ne!"]
;return{name:"Rust",aliases:["rs"],keywords:{$pattern:e.IDENT_RE+"!?",
type:["i8","i16","i32","i64","i128","isize","u8","u16","u32","u64","u128","usize","f32","f64","str","char","bool","Box","Option","Result","String","Vec"],
keyword:["abstract","as","async","await","become","box","break","const","continue","crate","do","dyn","else","enum","extern","false","final","fn","for","if","impl","in","let","loop","macro","match","mod","move","mut","override","priv","pub","ref","return","self","Self","static","struct","super","trait","true","try","type","typeof","unsafe","unsized","use","virtual","where","while","yield"],
literal:["true","false","Some","None","Ok","Err"],built_in:a},illegal:"</",
contains:[e.C_LINE_COMMENT_MODE,e.COMMENT("/\\*","\\*/",{contains:["self"]
}),e.inherit(e.QUOTE_STRING_MODE,{begin:/b?"/,illegal:null}),{
className:"string",variants:[{begin:/b?r(#*)"(.|\n)*?"\1(?!#)/},{
begin:/b?'\\?(x\w{2}|u\w{4}|U\w{8}|.)'/}]},{className:"symbol",
begin:/'[a-zA-Z_][a-zA-Z0-9_]*/},{className:"number",variants:[{
begin:"\\b0b([01_]+)"+t},{begin:"\\b0o([0-7_]+)"+t},{
begin:"\\b0x([A-Fa-f0-9_]+)"+t},{
begin:"\\b(\\d[\\d_]*(\\.[0-9_]+)?([eE][+-]?[0-9_]+)?)"+t}],relevance:0},{
begin:[/fn/,/\s+/,e.UNDERSCORE_IDENT_RE],className:{1:"keyword",
3:"title.function"}},{className:"meta",begin:"#!?\\[",end:"\\]",contains:[{
className:"string",begin:/"/,end:/"/}]},{
begin:[/let/,/\s+/,/(?:mut\s+)?/,e.UNDERSCORE_IDENT_RE],className:{1:"keyword",
3:"keyword",4:"variable"}},{
begin:[/for/,/\s+/,e.UNDERSCORE_IDENT_RE,/\s+/,/in/],className:{1:"keyword",
3:"variable",5:"keyword"}},{begin:[/type/,/\s+/,e.UNDERSCORE_IDENT_RE],
className:{1:"keyword",3:"title.class"}},{
begin:[/(?:trait|enum|struct|union|impl|for)/,/\s+/,e.UNDERSCORE_IDENT_RE],
className:{1:"keyword",3:"title.class"}},{begin:e.IDENT_RE+"::",keywords:{
keyword:"Self",built_in:a}},{className:"punctuation",begin:"->"},n]}},
grmr_scss:e=>{const n=ee(e),t=ie,a=ae,i="@[a-z-]+",s={className:"variable",
begin:"(\\$[a-zA-Z-][a-zA-Z0-9_-]*)\\b"};return{name:"SCSS",case_insensitive:!0,
illegal:"[=/|']",contains:[e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{
className:"selector-id",begin:"#[A-Za-z0-9_-]+",relevance:0},{
className:"selector-class",begin:"\\.[A-Za-z0-9_-]+",relevance:0
},n.ATTRIBUTE_SELECTOR_MODE,{className:"selector-tag",
begin:"\\b("+ne.join("|")+")\\b",relevance:0},{className:"selector-pseudo",
begin:":("+a.join("|")+")"},{className:"selector-pseudo",
begin:"::("+t.join("|")+")"},s,{begin:/\(/,end:/\)/,contains:[n.CSS_NUMBER_MODE]
},{className:"attribute",begin:"\\b("+se.join("|")+")\\b"},{
begin:"\\b(whitespace|wait|w-resize|visible|vertical-text|vertical-ideographic|uppercase|upper-roman|upper-alpha|underline|transparent|top|thin|thick|text|text-top|text-bottom|tb-rl|table-header-group|table-footer-group|sw-resize|super|strict|static|square|solid|small-caps|separate|se-resize|scroll|s-resize|rtl|row-resize|ridge|right|repeat|repeat-y|repeat-x|relative|progress|pointer|overline|outside|outset|oblique|nowrap|not-allowed|normal|none|nw-resize|no-repeat|no-drop|newspaper|ne-resize|n-resize|move|middle|medium|ltr|lr-tb|lowercase|lower-roman|lower-alpha|loose|list-item|line|line-through|line-edge|lighter|left|keep-all|justify|italic|inter-word|inter-ideograph|inside|inset|inline|inline-block|inherit|inactive|ideograph-space|ideograph-parenthesis|ideograph-numeric|ideograph-alpha|horizontal|hidden|help|hand|groove|fixed|ellipsis|e-resize|double|dotted|distribute|distribute-space|distribute-letter|distribute-all-lines|disc|disabled|default|decimal|dashed|crosshair|collapse|col-resize|circle|char|center|capitalize|break-word|break-all|bottom|both|bolder|bold|block|bidi-override|below|baseline|auto|always|all-scroll|absolute|table|table-cell)\\b"
},{begin:":",end:";",
contains:[s,n.HEXCOLOR,n.CSS_NUMBER_MODE,e.QUOTE_STRING_MODE,e.APOS_STRING_MODE,n.IMPORTANT]
},{begin:"@(page|font-face)",keywords:{$pattern:i,keyword:"@page @font-face"}},{
begin:"@",end:"[{;]",returnBegin:!0,keywords:{$pattern:/[a-z-]+/,
keyword:"and or not only",attribute:te.join(" ")},contains:[{begin:i,
className:"keyword"},{begin:/[a-z-]+(?=:)/,className:"attribute"
},s,e.QUOTE_STRING_MODE,e.APOS_STRING_MODE,n.HEXCOLOR,n.CSS_NUMBER_MODE]}]}},
grmr_shell:e=>({name:"Shell Session",aliases:["console","shellsession"],
contains:[{className:"meta",begin:/^\s{0,3}[/~\w\d[\]()@-]*[>%$#][ ]?/,starts:{
end:/[^\\](?=\s*$)/,subLanguage:"bash"}}]}),grmr_sql:e=>{
const n=e.COMMENT("--","$"),t=["true","false","unknown"],a=["bigint","binary","blob","boolean","char","character","clob","date","dec","decfloat","decimal","float","int","integer","interval","nchar","nclob","national","numeric","real","row","smallint","time","timestamp","varchar","varying","varbinary"],i=["abs","acos","array_agg","asin","atan","avg","cast","ceil","ceiling","coalesce","corr","cos","cosh","count","covar_pop","covar_samp","cume_dist","dense_rank","deref","element","exp","extract","first_value","floor","json_array","json_arrayagg","json_exists","json_object","json_objectagg","json_query","json_table","json_table_primitive","json_value","lag","last_value","lead","listagg","ln","log","log10","lower","max","min","mod","nth_value","ntile","nullif","percent_rank","percentile_cont","percentile_disc","position","position_regex","power","rank","regr_avgx","regr_avgy","regr_count","regr_intercept","regr_r2","regr_slope","regr_sxx","regr_sxy","regr_syy","row_number","sin","sinh","sqrt","stddev_pop","stddev_samp","substring","substring_regex","sum","tan","tanh","translate","translate_regex","treat","trim","trim_array","unnest","upper","value_of","var_pop","var_samp","width_bucket"],s=["create table","insert into","primary key","foreign key","not null","alter table","add constraint","grouping sets","on overflow","character set","respect nulls","ignore nulls","nulls first","nulls last","depth first","breadth first"],r=i,o=["abs","acos","all","allocate","alter","and","any","are","array","array_agg","array_max_cardinality","as","asensitive","asin","asymmetric","at","atan","atomic","authorization","avg","begin","begin_frame","begin_partition","between","bigint","binary","blob","boolean","both","by","call","called","cardinality","cascaded","case","cast","ceil","ceiling","char","char_length","character","character_length","check","classifier","clob","close","coalesce","collate","collect","column","commit","condition","connect","constraint","contains","convert","copy","corr","corresponding","cos","cosh","count","covar_pop","covar_samp","create","cross","cube","cume_dist","current","current_catalog","current_date","current_default_transform_group","current_path","current_role","current_row","current_schema","current_time","current_timestamp","current_path","current_role","current_transform_group_for_type","current_user","cursor","cycle","date","day","deallocate","dec","decimal","decfloat","declare","default","define","delete","dense_rank","deref","describe","deterministic","disconnect","distinct","double","drop","dynamic","each","element","else","empty","end","end_frame","end_partition","end-exec","equals","escape","every","except","exec","execute","exists","exp","external","extract","false","fetch","filter","first_value","float","floor","for","foreign","frame_row","free","from","full","function","fusion","get","global","grant","group","grouping","groups","having","hold","hour","identity","in","indicator","initial","inner","inout","insensitive","insert","int","integer","intersect","intersection","interval","into","is","join","json_array","json_arrayagg","json_exists","json_object","json_objectagg","json_query","json_table","json_table_primitive","json_value","lag","language","large","last_value","lateral","lead","leading","left","like","like_regex","listagg","ln","local","localtime","localtimestamp","log","log10","lower","match","match_number","match_recognize","matches","max","member","merge","method","min","minute","mod","modifies","module","month","multiset","national","natural","nchar","nclob","new","no","none","normalize","not","nth_value","ntile","null","nullif","numeric","octet_length","occurrences_regex","of","offset","old","omit","on","one","only","open","or","order","out","outer","over","overlaps","overlay","parameter","partition","pattern","per","percent","percent_rank","percentile_cont","percentile_disc","period","portion","position","position_regex","power","precedes","precision","prepare","primary","procedure","ptf","range","rank","reads","real","recursive","ref","references","referencing","regr_avgx","regr_avgy","regr_count","regr_intercept","regr_r2","regr_slope","regr_sxx","regr_sxy","regr_syy","release","result","return","returns","revoke","right","rollback","rollup","row","row_number","rows","running","savepoint","scope","scroll","search","second","seek","select","sensitive","session_user","set","show","similar","sin","sinh","skip","smallint","some","specific","specifictype","sql","sqlexception","sqlstate","sqlwarning","sqrt","start","static","stddev_pop","stddev_samp","submultiset","subset","substring","substring_regex","succeeds","sum","symmetric","system","system_time","system_user","table","tablesample","tan","tanh","then","time","timestamp","timezone_hour","timezone_minute","to","trailing","translate","translate_regex","translation","treat","trigger","trim","trim_array","true","truncate","uescape","union","unique","unknown","unnest","update","upper","user","using","value","values","value_of","var_pop","var_samp","varbinary","varchar","varying","versioning","when","whenever","where","width_bucket","window","with","within","without","year","add","asc","collation","desc","final","first","last","view"].filter((e=>!i.includes(e))),l={
begin:b(/\b/,m(...r),/\s*\(/),relevance:0,keywords:{built_in:r}};return{
name:"SQL",case_insensitive:!0,illegal:/[{}]|<\//,keywords:{
$pattern:/\b[\w\.]+/,keyword:((e,{exceptions:n,when:t}={})=>{const a=t
;return n=n||[],e.map((e=>e.match(/\|\d+$/)||n.includes(e)?e:a(e)?e+"|0":e))
})(o,{when:e=>e.length<3}),literal:t,type:a,
built_in:["current_catalog","current_date","current_default_transform_group","current_path","current_role","current_schema","current_transform_group_for_type","current_user","session_user","system_time","system_user","current_time","localtime","current_timestamp","localtimestamp"]
},contains:[{begin:m(...s),relevance:0,keywords:{$pattern:/[\w\.]+/,
keyword:o.concat(s),literal:t,type:a}},{className:"type",
begin:m("double precision","large object","with timezone","without timezone")
},l,{className:"variable",begin:/@[a-z0-9]+/},{className:"string",variants:[{
begin:/'/,end:/'/,contains:[{begin:/''/}]}]},{begin:/"/,end:/"/,contains:[{
begin:/""/}]},e.C_NUMBER_MODE,e.C_BLOCK_COMMENT_MODE,n,{className:"operator",
begin:/[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,relevance:0}]}},
grmr_swift:e=>{const n={match:/\s+/,relevance:0},t=e.COMMENT("/\\*","\\*/",{
contains:["self"]}),a=[e.C_LINE_COMMENT_MODE,t],i={match:[/\./,m(...Ne,...we)],
className:{2:"keyword"}},s={match:b(/\./,m(...Oe)),relevance:0
},r=Oe.filter((e=>"string"==typeof e)).concat(["_|0"]),o={variants:[{
className:"keyword",
match:m(...Oe.filter((e=>"string"!=typeof e)).concat(ve).map(ye),...we)}]},l={
$pattern:m(/\b\w+/,/#\w+/),keyword:r.concat(Se),literal:Me},c=[i,s,o],d=[{
match:b(/\./,m(...ke)),relevance:0},{className:"built_in",
match:b(/\b/,m(...ke),/(?=\()/)}],u={match:/->/,relevance:0},p=[u,{
className:"operator",relevance:0,variants:[{match:Te},{match:`\\.(\\.|${Ce})+`}]
}],_="([0-9a-fA-F]_*)+",h={className:"number",relevance:0,variants:[{
match:"\\b(([0-9]_*)+)(\\.(([0-9]_*)+))?([eE][+-]?(([0-9]_*)+))?\\b"},{
match:`\\b0x(${_})(\\.(${_}))?([pP][+-]?(([0-9]_*)+))?\\b`},{
match:/\b0o([0-7]_*)+\b/},{match:/\b0b([01]_*)+\b/}]},f=(e="")=>({
className:"subst",variants:[{match:b(/\\/,e,/[0\\tnr"']/)},{
match:b(/\\/,e,/u\{[0-9a-fA-F]{1,8}\}/)}]}),E=(e="")=>({className:"subst",
match:b(/\\/,e,/[\t ]*(?:[\r\n]|\r\n)/)}),y=(e="")=>({className:"subst",
label:"interpol",begin:b(/\\/,e,/\(/),end:/\)/}),N=(e="")=>({begin:b(e,/"""/),
end:b(/"""/,e),contains:[f(e),E(e),y(e)]}),w=(e="")=>({begin:b(e,/"/),
end:b(/"/,e),contains:[f(e),y(e)]}),v={className:"string",
variants:[N(),N("#"),N("##"),N("###"),w(),w("#"),w("##"),w("###")]},O={
match:b(/`/,Ie,/`/)},M=[O,{className:"variable",match:/\$\d+/},{
className:"variable",match:`\\$${De}+`}],x=[{match:/(@|#)available/,
className:"keyword",starts:{contains:[{begin:/\(/,end:/\)/,keywords:$e,
contains:[...p,h,v]}]}},{className:"keyword",match:b(/@/,m(...Le))},{
className:"meta",match:b(/@/,Ie)}],S={match:g(/\b[A-Z]/),relevance:0,contains:[{
className:"type",
match:b(/(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)/,De,"+")
},{className:"type",match:Be,relevance:0},{match:/[?!]+/,relevance:0},{
match:/\.\.\./,relevance:0},{match:b(/\s+&\s+/,g(Be)),relevance:0}]},k={
begin:/</,end:/>/,keywords:l,contains:[...a,...c,...x,u,S]};S.contains.push(k)
;const A={begin:/\(/,end:/\)/,relevance:0,keywords:l,contains:["self",{
match:b(Ie,/\s*:/),keywords:"_|0",relevance:0
},...a,...c,...d,...p,h,v,...M,...x,S]},C={begin:/</,end:/>/,contains:[...a,S]
},T={begin:/\(/,end:/\)/,keywords:l,contains:[{
begin:m(g(b(Ie,/\s*:/)),g(b(Ie,/\s+/,Ie,/\s*:/))),end:/:/,relevance:0,
contains:[{className:"keyword",match:/\b_\b/},{className:"params",match:Ie}]
},...a,...c,...p,h,v,...x,S,A],endsParent:!0,illegal:/["']/},R={
match:[/func/,/\s+/,m(O.match,Ie,Te)],className:{1:"keyword",3:"title.function"
},contains:[C,T,n],illegal:[/\[/,/%/]},D={
match:[/\b(?:subscript|init[?!]?)/,/\s*(?=[<(])/],className:{1:"keyword"},
contains:[C,T,n],illegal:/\[|%/},I={match:[/operator/,/\s+/,Te],className:{
1:"keyword",3:"title"}},B={begin:[/precedencegroup/,/\s+/,Be],className:{
1:"keyword",3:"title"},contains:[S],keywords:[...xe,...Me],end:/}/}
;for(const e of v.variants){const n=e.contains.find((e=>"interpol"===e.label))
;n.keywords=l;const t=[...c,...d,...p,h,v,...M];n.contains=[...t,{begin:/\(/,
end:/\)/,contains:["self",...t]}]}return{name:"Swift",keywords:l,
contains:[...a,R,D,{beginKeywords:"struct protocol class extension enum actor",
end:"\\{",excludeEnd:!0,keywords:l,contains:[e.inherit(e.TITLE_MODE,{
className:"title.class",begin:/[A-Za-z$_][\u00C0-\u02B80-9A-Za-z$_]*/}),...c]
},I,B,{beginKeywords:"import",end:/$/,contains:[...a],relevance:0
},...c,...d,...p,h,v,...M,...x,S,A]}},grmr_typescript:e=>{const n={$pattern:ge,
keyword:ue.concat(["type","namespace","typedef","interface","public","private","protected","implements","declare","abstract","readonly"]),
literal:be,
built_in:fe.concat(["any","void","number","boolean","string","object","never","enum"]),
"variable.language":he},t={className:"meta",begin:"@[A-Za-z$_][0-9A-Za-z$_]*"
},a=(e,n,t)=>{const a=e.contains.findIndex((e=>e.label===n))
;if(-1===a)throw Error("can not find mode to replace");e.contains.splice(a,1,t)
},i=Ee(e)
;return Object.assign(i.keywords,n),i.exports.PARAMS_CONTAINS.push(t),i.contains=i.contains.concat([t,{
beginKeywords:"namespace",end:/\{/,excludeEnd:!0},{beginKeywords:"interface",
end:/\{/,excludeEnd:!0,keywords:"interface extends"
}]),a(i,"shebang",e.SHEBANG()),a(i,"use_strict",{className:"meta",relevance:10,
begin:/^\s*['"]use strict['"]/
}),i.contains.find((e=>"func.def"===e.label)).relevance=0,Object.assign(i,{
name:"TypeScript",aliases:["ts","tsx"]}),i},grmr_vbnet:e=>{
const n=/\d{1,2}\/\d{1,2}\/\d{4}/,t=/\d{4}-\d{1,2}-\d{1,2}/,a=/(\d|1[012])(:\d+){0,2} *(AM|PM)/,i=/\d{1,2}(:\d{1,2}){1,2}/,s={
className:"literal",variants:[{begin:b(/# */,m(t,n),/ *#/)},{
begin:b(/# */,i,/ *#/)},{begin:b(/# */,a,/ *#/)},{
begin:b(/# */,m(t,n),/ +/,m(a,i),/ *#/)}]},r=e.COMMENT(/'''/,/$/,{contains:[{
className:"doctag",begin:/<\/?/,end:/>/}]}),o=e.COMMENT(null,/$/,{variants:[{
begin:/'/},{begin:/([\t ]|^)REM(?=\s)/}]});return{name:"Visual Basic .NET",
aliases:["vb"],case_insensitive:!0,classNameAliases:{label:"symbol"},keywords:{
keyword:"addhandler alias aggregate ansi as async assembly auto binary by byref byval call case catch class compare const continue custom declare default delegate dim distinct do each equals else elseif end enum erase error event exit explicit finally for friend from function get global goto group handles if implements imports in inherits interface into iterator join key let lib loop me mid module mustinherit mustoverride mybase myclass namespace narrowing new next notinheritable notoverridable of off on operator option optional order overloads overridable overrides paramarray partial preserve private property protected public raiseevent readonly redim removehandler resume return select set shadows shared skip static step stop structure strict sub synclock take text then throw to try unicode until using when where while widening with withevents writeonly yield",
built_in:"addressof and andalso await directcast gettype getxmlnamespace is isfalse isnot istrue like mod nameof new not or orelse trycast typeof xor cbool cbyte cchar cdate cdbl cdec cint clng cobj csbyte cshort csng cstr cuint culng cushort",
type:"boolean byte char date decimal double integer long object sbyte short single string uinteger ulong ushort",
literal:"true false nothing"},
illegal:"//|\\{|\\}|endif|gosub|variant|wend|^\\$ ",contains:[{
className:"string",begin:/"(""|[^/n])"C\b/},{className:"string",begin:/"/,
end:/"/,illegal:/\n/,contains:[{begin:/""/}]},s,{className:"number",relevance:0,
variants:[{begin:/\b\d[\d_]*((\.[\d_]+(E[+-]?[\d_]+)?)|(E[+-]?[\d_]+))[RFD@!#]?/
},{begin:/\b\d[\d_]*((U?[SIL])|[%&])?/},{begin:/&H[\dA-F_]+((U?[SIL])|[%&])?/},{
begin:/&O[0-7_]+((U?[SIL])|[%&])?/},{begin:/&B[01_]+((U?[SIL])|[%&])?/}]},{
className:"label",begin:/^\w+:/},r,o,{className:"meta",
begin:/[\t ]*#(const|disable|else|elseif|enable|end|externalsource|if|region)\b/,
end:/$/,keywords:{
keyword:"const disable else elseif enable end externalsource if region then"},
contains:[o]}]}},grmr_yaml:e=>{
const n="true false yes no null",t="[\\w#;/?:@&=+$,.~*'()[\\]]+",a={
className:"string",relevance:0,variants:[{begin:/'/,end:/'/},{begin:/"/,end:/"/
},{begin:/\S+/}],contains:[e.BACKSLASH_ESCAPE,{className:"template-variable",
variants:[{begin:/\{\{/,end:/\}\}/},{begin:/%\{/,end:/\}/}]}]},i=e.inherit(a,{
variants:[{begin:/'/,end:/'/},{begin:/"/,end:/"/},{begin:/[^\s,{}[\]]+/}]}),s={
end:",",endsWithParent:!0,excludeEnd:!0,keywords:n,relevance:0},r={begin:/\{/,
end:/\}/,contains:[s],illegal:"\\n",relevance:0},o={begin:"\\[",end:"\\]",
contains:[s],illegal:"\\n",relevance:0},l=[{className:"attr",variants:[{
begin:"\\w[\\w :\\/.-]*:(?=[ \t]|$)"},{begin:'"\\w[\\w :\\/.-]*":(?=[ \t]|$)'},{
begin:"'\\w[\\w :\\/.-]*':(?=[ \t]|$)"}]},{className:"meta",begin:"^---\\s*$",
relevance:10},{className:"string",
begin:"[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"},{
begin:"<%[%=-]?",end:"[%-]?%>",subLanguage:"ruby",excludeBegin:!0,excludeEnd:!0,
relevance:0},{className:"type",begin:"!\\w+!"+t},{className:"type",
begin:"!<"+t+">"},{className:"type",begin:"!"+t},{className:"type",begin:"!!"+t
},{className:"meta",begin:"&"+e.UNDERSCORE_IDENT_RE+"$"},{className:"meta",
begin:"\\*"+e.UNDERSCORE_IDENT_RE+"$"},{className:"bullet",begin:"-(?=[ ]|$)",
relevance:0},e.HASH_COMMENT_MODE,{beginKeywords:n,keywords:{literal:n}},{
className:"number",
begin:"\\b[0-9]{4}(-[0-9][0-9]){0,2}([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?(\\.[0-9]*)?([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?\\b"
},{className:"number",begin:e.C_NUMBER_RE+"\\b",relevance:0},r,o,a],c=[...l]
;return c.pop(),c.push(i),s.contains=c,{name:"YAML",case_insensitive:!0,
aliases:["yml"],contains:l}}});const Fe=Y;for(const e of Object.keys(ze)){
const n=e.replace("grmr_","");Fe.registerLanguage(n,ze[e])}return Fe}()
;"object"==typeof exports&&"undefined"!=typeof module&&(module.exports=hljs);load = s => window

log = val => out(__as_ink_string(string(val) + __Ink_String(`
`)));
scan = cb => (() => { let acc; acc = [__Ink_String(``)]; return __ink_ident_in(evt => __ink_match((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})(), [[() => (__Ink_String(`end`)), () => (cb((() => {let __ink_acc_trgt = __as_ink_string(acc); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})()))], [() => (__Ink_String(`data`)), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(0, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(acc); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})() + slice((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[data] || null : (__ink_acc_trgt.data !== undefined ? __ink_acc_trgt.data : null)})(), 0, (len((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[data] || null : (__ink_acc_trgt.data !== undefined ? __ink_acc_trgt.data : null)})()) - 1)))) : (__ink_assgn_trgt[0]) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(acc); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})() + slice((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[data] || null : (__ink_acc_trgt.data !== undefined ? __ink_acc_trgt.data : null)})(), 0, (len((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[data] || null : (__ink_acc_trgt.data !== undefined ? __ink_acc_trgt.data : null)})()) - 1))); return __ink_assgn_trgt})(); return false })())]])) })();
hToN = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, [__Ink_String(`a`)]: 10, [__Ink_String(`b`)]: 11, [__Ink_String(`c`)]: 12, [__Ink_String(`d`)]: 13, [__Ink_String(`e`)]: 14, [__Ink_String(`f`)]: 15};
nToH = __Ink_String(`0123456789abcdef`);
hex = n => (() => { let __ink_trampolined_sub; let sub; return sub = (p, acc) => (() => { __ink_trampolined_sub = (p, acc) => __ink_match((p < 16), [[() => (true), () => (__as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(nToH); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return p })()] || null : (__ink_acc_trgt[(() => { return p })()] !== undefined ? __ink_acc_trgt[(() => { return p })()] : null)})() + acc))], [() => (false), () => (__ink_trampoline(__ink_trampolined_sub, floor((p / 16)), __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(nToH); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return (p % 16) })()] || null : (__ink_acc_trgt[(() => { return (p % 16) })()] !== undefined ? __ink_acc_trgt[(() => { return (p % 16) })()] : null)})() + acc)))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, p, acc) })() })()(floor(n), __Ink_String(``));
xeh = s => (() => { let max; max = len(s); return (() => { let __ink_trampolined_sub; let sub; return sub = (i, acc) => (() => { __ink_trampolined_sub = (i, acc) => __ink_match(i, [[() => (max), () => (acc)], [() => (__Ink_Empty), () => (__ink_trampoline(__ink_trampolined_sub, __as_ink_string(i + 1), __as_ink_string((acc * 16) + (() => {let __ink_acc_trgt = __as_ink_string(hToN); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})() })()] || null : (__ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})() })()] !== undefined ? __ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})() })()] : null)})())))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i, acc) })() })()(0, 0) })();
min = numbers => reduce(numbers, (acc, n) => __ink_match((n < acc), [[() => (true), () => (n)], [() => (false), () => (acc)]]), (() => {let __ink_acc_trgt = __as_ink_string(numbers); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})());
max = numbers => reduce(numbers, (acc, n) => __ink_match((n > acc), [[() => (true), () => (n)], [() => (false), () => (acc)]]), (() => {let __ink_acc_trgt = __as_ink_string(numbers); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})());
range = (start, end, step) => (() => { let __ink_trampolined_sub; let span; let sub; span = (end - start); sub = (i, v, acc) => (() => { __ink_trampolined_sub = (i, v, acc) => __ink_match((((() => { return (v - start) })() / span) < 1), [[() => (true), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return i })(), v) : (__ink_assgn_trgt[(() => { return i })()]) = v; return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub, __as_ink_string(i + 1), __as_ink_string(v + step), acc) })())], [() => (false), () => (acc)]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i, v, acc) })(); return __ink_match((((() => { return (end - start) })() / step) > 0), [[() => (true), () => (sub(0, start, []))], [() => (false), () => ([])]]) })();
clamp = (start, end, min, max) => (() => { start = (() => { return __ink_match((start < min), [[() => (true), () => (min)], [() => (false), () => (start)]]) })(); end = (() => { return __ink_match((end < min), [[() => (true), () => (min)], [() => (false), () => (end)]]) })(); end = (() => { return __ink_match((end > max), [[() => (true), () => (max)], [() => (false), () => (end)]]) })(); start = (() => { return __ink_match((start > end), [[() => (true), () => (end)], [() => (false), () => (start)]]) })(); return {start: start, end: end} })();
slice = (s, start, end) => (() => { let max; let x; x = clamp(start, end, 0, len(s)); start = (() => {let __ink_acc_trgt = __as_ink_string(x); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[start] || null : (__ink_acc_trgt.start !== undefined ? __ink_acc_trgt.start : null)})(); max = ((() => {let __ink_acc_trgt = __as_ink_string(x); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[end] || null : (__ink_acc_trgt.end !== undefined ? __ink_acc_trgt.end : null)})() - start); return (() => { let __ink_trampolined_sub; let sub; return sub = (i, acc) => (() => { __ink_trampolined_sub = (i, acc) => __ink_match(i, [[() => (max), () => (acc)], [() => (__Ink_Empty), () => (__ink_trampoline(__ink_trampolined_sub, __as_ink_string(i + 1), (() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return i })(), (() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return __as_ink_string(start + i) })()] || null : (__ink_acc_trgt[(() => { return __as_ink_string(start + i) })()] !== undefined ? __ink_acc_trgt[(() => { return __as_ink_string(start + i) })()] : null)})()) : (__ink_assgn_trgt[(() => { return i })()]) = (() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return __as_ink_string(start + i) })()] || null : (__ink_acc_trgt[(() => { return __as_ink_string(start + i) })()] !== undefined ? __ink_acc_trgt[(() => { return __as_ink_string(start + i) })()] : null)})(); return __ink_assgn_trgt})()))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i, acc) })() })()(0, __ink_match(type(s), [[() => (__Ink_String(`string`)), () => (__Ink_String(``))], [() => (__Ink_String(`composite`)), () => ([])]])) })();
append = (base, child) => (() => { let baseLength; let childLength; baseLength = len(base); childLength = len(child); return (() => { let __ink_trampolined_sub; let sub; return sub = i => (() => { __ink_trampolined_sub = i => __ink_match(i, [[() => (childLength), () => (base)], [() => (__Ink_Empty), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(base); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return __as_ink_string(baseLength + i) })(), (() => {let __ink_acc_trgt = __as_ink_string(child); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})()) : (__ink_assgn_trgt[(() => { return __as_ink_string(baseLength + i) })()]) = (() => {let __ink_acc_trgt = __as_ink_string(child); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})(); return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub, __as_ink_string(i + 1)) })())]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i) })() })()(0) })();
join = (base, child) => append(clone(base), child);
clone = x => __ink_match(type(x), [[() => (__Ink_String(`string`)), () => (__as_ink_string(__Ink_String(``) + x))], [() => (__Ink_String(`composite`)), () => (reduce(keys(x), (acc, k) => (() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return k })(), (() => {let __ink_acc_trgt = __as_ink_string(x); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return k })()] || null : (__ink_acc_trgt[(() => { return k })()] !== undefined ? __ink_acc_trgt[(() => { return k })()] : null)})()) : (__ink_assgn_trgt[(() => { return k })()]) = (() => {let __ink_acc_trgt = __as_ink_string(x); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return k })()] || null : (__ink_acc_trgt[(() => { return k })()] !== undefined ? __ink_acc_trgt[(() => { return k })()] : null)})(); return __ink_assgn_trgt})(), {}))], [() => (__Ink_Empty), () => (x)]]);
stringList = list => __as_ink_string(__as_ink_string(__Ink_String(`[`) + cat(map(list, string), __Ink_String(`, `))) + __Ink_String(`]`));
reverse = list => (() => { let __ink_trampolined_sub; let sub; return sub = (acc, i, j) => (() => { __ink_trampolined_sub = (acc, i, j) => __ink_match(j, [[() => (0), () => ((() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return i })(), (() => {let __ink_acc_trgt = __as_ink_string(list); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})()) : (__ink_assgn_trgt[(() => { return i })()]) = (() => {let __ink_acc_trgt = __as_ink_string(list); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})(); return __ink_assgn_trgt})())], [() => (__Ink_Empty), () => (__ink_trampoline(__ink_trampolined_sub, (() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return i })(), (() => {let __ink_acc_trgt = __as_ink_string(list); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return j })()] || null : (__ink_acc_trgt[(() => { return j })()] !== undefined ? __ink_acc_trgt[(() => { return j })()] : null)})()) : (__ink_assgn_trgt[(() => { return i })()]) = (() => {let __ink_acc_trgt = __as_ink_string(list); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return j })()] || null : (__ink_acc_trgt[(() => { return j })()] !== undefined ? __ink_acc_trgt[(() => { return j })()] : null)})(); return __ink_assgn_trgt})(), __as_ink_string(i + 1), (j - 1)))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, acc, i, j) })() })()([], 0, (len(list) - 1));
map = (list, f) => reduce(list, (l, item, i) => (() => {let __ink_assgn_trgt = __as_ink_string(l); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return i })(), f(item, i)) : (__ink_assgn_trgt[(() => { return i })()]) = f(item, i); return __ink_assgn_trgt})(), {});
filter = (list, f) => reduce(list, (l, item, i) => __ink_match(f(item, i), [[() => (true), () => ((() => {let __ink_assgn_trgt = __as_ink_string(l); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(len(l), item) : (__ink_assgn_trgt[len(l)]) = item; return __ink_assgn_trgt})())], [() => (__Ink_Empty), () => (l)]]), []);
reduce = (list, f, acc) => (() => { let max; max = len(list); return (() => { let __ink_trampolined_sub; let sub; return sub = (i, acc) => (() => { __ink_trampolined_sub = (i, acc) => __ink_match(i, [[() => (max), () => (acc)], [() => (__Ink_Empty), () => (__ink_trampoline(__ink_trampolined_sub, __as_ink_string(i + 1), f(acc, (() => {let __ink_acc_trgt = __as_ink_string(list); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})(), i)))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i, acc) })() })()(0, acc) })();
reduceBack = (list, f, acc) => (() => { let __ink_trampolined_sub; let sub; return sub = (i, acc) => (() => { __ink_trampolined_sub = (i, acc) => __ink_match(i, [[() => (__ink_negate(1)), () => (acc)], [() => (__Ink_Empty), () => (__ink_trampoline(__ink_trampolined_sub, (i - 1), f(acc, (() => {let __ink_acc_trgt = __as_ink_string(list); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})(), i)))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i, acc) })() })()((len(list) - 1), acc);
flatten = list => reduce(list, append, []);
some = list => reduce(list, (acc, x) => __ink_or(acc, x), false);
every = list => reduce(list, (acc, x) => __ink_and(acc, x), true);
cat = (list, joiner) => (() => { let max; return __ink_match(max = len(list), [[() => (0), () => (__Ink_String(``))], [() => (__Ink_Empty), () => ((() => { let __ink_trampolined_sub; let sub; return sub = (i, acc) => (() => { __ink_trampolined_sub = (i, acc) => __ink_match(i, [[() => (max), () => (acc)], [() => (__Ink_Empty), () => (__ink_trampoline(__ink_trampolined_sub, __as_ink_string(i + 1), (() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(len(acc), __as_ink_string(joiner + (() => {let __ink_acc_trgt = __as_ink_string(list); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})())) : (__ink_assgn_trgt[len(acc)]) = __as_ink_string(joiner + (() => {let __ink_acc_trgt = __as_ink_string(list); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})()); return __ink_assgn_trgt})()))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i, acc) })() })()(1, clone((() => {let __ink_acc_trgt = __as_ink_string(list); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})())))]]) })();
each = (list, f) => (() => { let max; max = len(list); return (() => { let __ink_trampolined_sub; let sub; return sub = i => (() => { __ink_trampolined_sub = i => __ink_match(i, [[() => (max), () => (null)], [() => (__Ink_Empty), () => ((() => { f((() => {let __ink_acc_trgt = __as_ink_string(list); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})(), i); return __ink_trampoline(__ink_trampolined_sub, __as_ink_string(i + 1)) })())]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i) })() })()(0) })();
encode = str => (() => { let max; max = len(str); return (() => { let __ink_trampolined_sub; let sub; return sub = (i, acc) => (() => { __ink_trampolined_sub = (i, acc) => __ink_match(i, [[() => (max), () => (acc)], [() => (__Ink_Empty), () => (__ink_trampoline(__ink_trampolined_sub, __as_ink_string(i + 1), (() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return i })(), point((() => {let __ink_acc_trgt = __as_ink_string(str); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})())) : (__ink_assgn_trgt[(() => { return i })()]) = point((() => {let __ink_acc_trgt = __as_ink_string(str); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})()); return __ink_assgn_trgt})()))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i, acc) })() })()(0, []) })();
decode = data => reduce(data, (acc, cp) => (() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(len(acc), char(cp)) : (__ink_assgn_trgt[len(acc)]) = char(cp); return __ink_assgn_trgt})(), __Ink_String(``));
readFile = (path, cb) => (() => { let BufSize; BufSize = 4096; return (() => { let sub; return sub = (offset, acc) => read(path, offset, BufSize, evt => __ink_match((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})(), [[() => (__Ink_String(`error`)), () => (cb(null))], [() => (__Ink_String(`data`)), () => ((() => { let dataLen; dataLen = len((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[data] || null : (__ink_acc_trgt.data !== undefined ? __ink_acc_trgt.data : null)})()); return __ink_match(__ink_eq(dataLen, BufSize), [[() => (true), () => (sub(__as_ink_string(offset + dataLen), (() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(len(acc), (() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[data] || null : (__ink_acc_trgt.data !== undefined ? __ink_acc_trgt.data : null)})()) : (__ink_assgn_trgt[len(acc)]) = (() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[data] || null : (__ink_acc_trgt.data !== undefined ? __ink_acc_trgt.data : null)})(); return __ink_assgn_trgt})()))], [() => (false), () => (cb((() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(len(acc), (() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[data] || null : (__ink_acc_trgt.data !== undefined ? __ink_acc_trgt.data : null)})()) : (__ink_assgn_trgt[len(acc)]) = (() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[data] || null : (__ink_acc_trgt.data !== undefined ? __ink_acc_trgt.data : null)})(); return __ink_assgn_trgt})()))]]) })())]])) })()(0, __Ink_String(``)) })();
writeFile = (path, data, cb) => __ink_ident_delete(path, evt => __ink_match((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})(), [[() => (__Ink_String(`end`)), () => (write(path, 0, data, evt => __ink_match((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})(), [[() => (__Ink_String(`error`)), () => (cb(null))], [() => (__Ink_String(`end`)), () => (cb(true))]])))], [() => (__Ink_Empty), () => (cb(null))]]));
format = (raw, values) => (() => { let append; let max; let readNext; let state; state = {idx: 0, which: 0, key: __Ink_String(``), buf: __Ink_String(``)}; append = c => (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(buf, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[buf] || null : (__ink_acc_trgt.buf !== undefined ? __ink_acc_trgt.buf : null)})() + c)) : (__ink_assgn_trgt.buf) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[buf] || null : (__ink_acc_trgt.buf !== undefined ? __ink_acc_trgt.buf : null)})() + c); return __ink_assgn_trgt})(); readNext = () => (() => { let c; c = (() => {let __ink_acc_trgt = __as_ink_string(raw); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() })()] || null : (__ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() })()] !== undefined ? __ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() })()] : null)})(); __ink_match((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[which] || null : (__ink_acc_trgt.which !== undefined ? __ink_acc_trgt.which : null)})(), [[() => (0), () => (__ink_match(c, [[() => (__Ink_String(`{`)), () => ((() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(which, 1) : (__ink_assgn_trgt.which) = 1; return __ink_assgn_trgt})())], [() => (__Ink_Empty), () => (append(c))]]))], [() => (1), () => (__ink_match(c, [[() => (__Ink_String(`{`)), () => ((() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(which, 2) : (__ink_assgn_trgt.which) = 2; return __ink_assgn_trgt})())], [() => (__Ink_Empty), () => ((() => { append(__as_ink_string(__Ink_String(`{`) + c)); return (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(which, 0) : (__ink_assgn_trgt.which) = 0; return __ink_assgn_trgt})() })())]]))], [() => (2), () => (__ink_match(c, [[() => (__Ink_String(`}`)), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(buf, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[buf] || null : (__ink_acc_trgt.buf !== undefined ? __ink_acc_trgt.buf : null)})() + string((() => {let __ink_acc_trgt = __as_ink_string(values); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[key] || null : (__ink_acc_trgt.key !== undefined ? __ink_acc_trgt.key : null)})() })()] || null : (__ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[key] || null : (__ink_acc_trgt.key !== undefined ? __ink_acc_trgt.key : null)})() })()] !== undefined ? __ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[key] || null : (__ink_acc_trgt.key !== undefined ? __ink_acc_trgt.key : null)})() })()] : null)})()))) : (__ink_assgn_trgt.buf) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[buf] || null : (__ink_acc_trgt.buf !== undefined ? __ink_acc_trgt.buf : null)})() + string((() => {let __ink_acc_trgt = __as_ink_string(values); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[key] || null : (__ink_acc_trgt.key !== undefined ? __ink_acc_trgt.key : null)})() })()] || null : (__ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[key] || null : (__ink_acc_trgt.key !== undefined ? __ink_acc_trgt.key : null)})() })()] !== undefined ? __ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[key] || null : (__ink_acc_trgt.key !== undefined ? __ink_acc_trgt.key : null)})() })()] : null)})())); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(key, __Ink_String(``)) : (__ink_assgn_trgt.key) = __Ink_String(``); return __ink_assgn_trgt})(); return (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(which, 3) : (__ink_assgn_trgt.which) = 3; return __ink_assgn_trgt})() })())], [() => (__Ink_String(` `)), () => (null)], [() => (__Ink_Empty), () => ((() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(key, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[key] || null : (__ink_acc_trgt.key !== undefined ? __ink_acc_trgt.key : null)})() + c)) : (__ink_assgn_trgt.key) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[key] || null : (__ink_acc_trgt.key !== undefined ? __ink_acc_trgt.key : null)})() + c); return __ink_assgn_trgt})())]]))], [() => (3), () => (__ink_match(c, [[() => (__Ink_String(`}`)), () => ((() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(which, 0) : (__ink_assgn_trgt.which) = 0; return __ink_assgn_trgt})())], [() => (__Ink_Empty), () => (null)]]))]]); return (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(idx, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() + 1)) : (__ink_assgn_trgt.idx) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() + 1); return __ink_assgn_trgt})() })(); max = len(raw); return (() => { let __ink_trampolined_sub; let sub; return sub = () => (() => { __ink_trampolined_sub = () => __ink_match(((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() < max), [[() => (true), () => ((() => { readNext(); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (false), () => ((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[buf] || null : (__ink_acc_trgt.buf !== undefined ? __ink_acc_trgt.buf : null)})())]]); return __ink_resolve_trampoline(__ink_trampolined_sub) })() })()() })()

std = load(__Ink_String(`std`));
map = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[map] || null : (__ink_acc_trgt.map !== undefined ? __ink_acc_trgt.map : null)})();
slice = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[slice] || null : (__ink_acc_trgt.slice !== undefined ? __ink_acc_trgt.slice : null)})();
reduce = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[reduce] || null : (__ink_acc_trgt.reduce !== undefined ? __ink_acc_trgt.reduce : null)})();
reduceBack = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[reduceBack] || null : (__ink_acc_trgt.reduceBack !== undefined ? __ink_acc_trgt.reduceBack : null)})();
checkRange = (lo, hi) => c => (() => { let p; p = point(c); return __ink_and((lo < p), (p < hi)) })();
upper__ink_qm__ = checkRange((point(__Ink_String(`A`)) - 1), __as_ink_string(point(__Ink_String(`Z`)) + 1));
lower__ink_qm__ = checkRange((point(__Ink_String(`a`)) - 1), __as_ink_string(point(__Ink_String(`z`)) + 1));
digit__ink_qm__ = checkRange((point(__Ink_String(`0`)) - 1), __as_ink_string(point(__Ink_String(`9`)) + 1));
letter__ink_qm__ = c => __ink_or(upper__ink_qm__(c), lower__ink_qm__(c));
ws__ink_qm__ = c => __ink_match(point(c), [[() => (32), () => (true)], [() => (10), () => (true)], [() => (9), () => (true)], [() => (13), () => (true)], [() => (__Ink_Empty), () => (false)]]);
hasPrefix__ink_qm__ = (s, prefix) => reduce(prefix, (acc, c, i) => __ink_and(acc, (() => { return __ink_eq((() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})(), c) })()), true);
hasSuffix__ink_qm__ = (s, suffix) => (() => { let diff; diff = (len(s) - len(suffix)); return reduce(suffix, (acc, c, i) => __ink_and(acc, (() => { return __ink_eq((() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return __as_ink_string(i + diff) })()] || null : (__ink_acc_trgt[(() => { return __as_ink_string(i + diff) })()] !== undefined ? __ink_acc_trgt[(() => { return __as_ink_string(i + diff) })()] : null)})(), c) })()), true) })();
matchesAt__ink_qm__ = (s, substring, idx) => (() => { let max; max = len(substring); return (() => { let __ink_trampolined_sub; let sub; return sub = i => (() => { __ink_trampolined_sub = i => __ink_match(i, [[() => (max), () => (true)], [() => (__Ink_Empty), () => (__ink_match((() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return __as_ink_string(idx + i) })()] || null : (__ink_acc_trgt[(() => { return __as_ink_string(idx + i) })()] !== undefined ? __ink_acc_trgt[(() => { return __as_ink_string(idx + i) })()] : null)})(), [[() => ((() => { return (() => {let __ink_acc_trgt = __as_ink_string(substring); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})() })()), () => (__ink_trampoline(__ink_trampolined_sub, __as_ink_string(i + 1)))], [() => (__Ink_Empty), () => (false)]]))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i) })() })()(0) })();
index = (s, substring) => (() => { let max; max = (len(s) - 1); return (() => { let __ink_trampolined_sub; let sub; return sub = i => (() => { __ink_trampolined_sub = i => __ink_match(matchesAt__ink_qm__(s, substring, i), [[() => (true), () => (i)], [() => (false), () => (__ink_match((i < max), [[() => (true), () => (__ink_trampoline(__ink_trampolined_sub, __as_ink_string(i + 1)))], [() => (false), () => (__ink_negate(1))]]))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i) })() })()(0) })();
contains__ink_qm__ = (s, substring) => (index(s, substring) > __ink_negate(1));
lower = s => reduce(s, (acc, c, i) => __ink_match(upper__ink_qm__(c), [[() => (true), () => ((() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return i })(), char(__as_ink_string(point(c) + 32))) : (__ink_assgn_trgt[(() => { return i })()]) = char(__as_ink_string(point(c) + 32)); return __ink_assgn_trgt})())], [() => (false), () => ((() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return i })(), c) : (__ink_assgn_trgt[(() => { return i })()]) = c; return __ink_assgn_trgt})())]]), __Ink_String(``));
upper = s => reduce(s, (acc, c, i) => __ink_match(lower__ink_qm__(c), [[() => (true), () => ((() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return i })(), char((point(c) - 32))) : (__ink_assgn_trgt[(() => { return i })()]) = char((point(c) - 32)); return __ink_assgn_trgt})())], [() => (false), () => ((() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return i })(), c) : (__ink_assgn_trgt[(() => { return i })()]) = c; return __ink_assgn_trgt})())]]), __Ink_String(``));
title = s => (() => { let lowered; lowered = lower(s); return (() => {let __ink_assgn_trgt = __as_ink_string(lowered); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(0, upper((() => {let __ink_acc_trgt = __as_ink_string(lowered); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})())) : (__ink_assgn_trgt[0]) = upper((() => {let __ink_acc_trgt = __as_ink_string(lowered); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})()); return __ink_assgn_trgt})() })();
replaceNonEmpty = (s, old, __ink_ident_new) => (() => { let lnew; let lold; lold = len(old); lnew = len(__ink_ident_new); return (() => { let __ink_trampolined_sub; let sub; return sub = (acc, i) => (() => { __ink_trampolined_sub = (acc, i) => __ink_match(matchesAt__ink_qm__(acc, old, i), [[() => (true), () => (__ink_trampoline(__ink_trampolined_sub, __as_ink_string(__as_ink_string(slice(acc, 0, i) + __ink_ident_new) + slice(acc, __as_ink_string(i + lold), len(acc))), __as_ink_string(i + lnew)))], [() => (false), () => (__ink_match((i < len(acc)), [[() => (true), () => (__ink_trampoline(__ink_trampolined_sub, acc, __as_ink_string(i + 1)))], [() => (false), () => (acc)]]))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, acc, i) })() })()(s, 0) })();
replace = (s, old, __ink_ident_new) => __ink_match(old, [[() => (__Ink_String(``)), () => (s)], [() => (__Ink_Empty), () => (replaceNonEmpty(s, old, __ink_ident_new))]]);
splitNonEmpty = (s, delim) => (() => { let coll; let ldelim; coll = []; ldelim = len(delim); return (() => { let __ink_trampolined_sub; let sub; return sub = (acc, i, last) => (() => { __ink_trampolined_sub = (acc, i, last) => __ink_match(matchesAt__ink_qm__(acc, delim, i), [[() => (true), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(coll); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(len(coll), slice(acc, last, i)) : (__ink_assgn_trgt[len(coll)]) = slice(acc, last, i); return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub, acc, __as_ink_string(i + ldelim), __as_ink_string(i + ldelim)) })())], [() => (false), () => (__ink_match((i < len(acc)), [[() => (true), () => (__ink_trampoline(__ink_trampolined_sub, acc, __as_ink_string(i + 1), last))], [() => (false), () => ((() => {let __ink_assgn_trgt = __as_ink_string(coll); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(len(coll), slice(acc, last, len(acc))) : (__ink_assgn_trgt[len(coll)]) = slice(acc, last, len(acc)); return __ink_assgn_trgt})())]]))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, acc, i, last) })() })()(s, 0, 0) })();
split = (s, delim) => __ink_match(delim, [[() => (__Ink_String(``)), () => (map(s, c => c))], [() => (__Ink_Empty), () => (splitNonEmpty(s, delim))]]);
trimPrefixNonEmpty = (s, prefix) => (() => { let idx; let lpref; let max; max = len(s); lpref = len(prefix); idx = (() => { let __ink_trampolined_sub; let sub; return sub = i => (() => { __ink_trampolined_sub = i => __ink_match((i < max), [[() => (true), () => (__ink_match(matchesAt__ink_qm__(s, prefix, i), [[() => (true), () => (__ink_trampoline(__ink_trampolined_sub, __as_ink_string(i + lpref)))], [() => (false), () => (i)]]))], [() => (false), () => (i)]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i) })() })()(0); return slice(s, idx, len(s)) })();
trimPrefix = (s, prefix) => __ink_match(prefix, [[() => (__Ink_String(``)), () => (s)], [() => (__Ink_Empty), () => (trimPrefixNonEmpty(s, prefix))]]);
trimSuffixNonEmpty = (s, suffix) => (() => { let idx; let lsuf; lsuf = len(suffix); idx = (() => { let __ink_trampolined_sub; let sub; return sub = i => (() => { __ink_trampolined_sub = i => __ink_match((i > __ink_negate(1)), [[() => (true), () => (__ink_match(matchesAt__ink_qm__(s, suffix, (i - lsuf)), [[() => (true), () => (__ink_trampoline(__ink_trampolined_sub, (i - lsuf)))], [() => (false), () => (i)]]))], [() => (false), () => (i)]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i) })() })()(len(s)); return slice(s, 0, idx) })();
trimSuffix = (s, suffix) => __ink_match(suffix, [[() => (__Ink_String(``)), () => (s)], [() => (__Ink_Empty), () => (trimSuffixNonEmpty(s, suffix))]]);
trim = (s, ss) => trimPrefix(trimSuffix(s, ss), ss)

std = load(__Ink_String(`../vendor/std`));
map = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[map] || null : (__ink_acc_trgt.map !== undefined ? __ink_acc_trgt.map : null)})();
clone = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[clone] || null : (__ink_acc_trgt.clone !== undefined ? __ink_acc_trgt.clone : null)})();
sortBy = (v, pred) => (() => { let partition; let vPred; vPred = map(v, pred); partition = (v, lo, hi) => (() => { let __ink_trampolined_lsub; let __ink_trampolined_rsub; let lsub; let pivot; let rsub; pivot = (() => {let __ink_acc_trgt = __as_ink_string(vPred); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return lo })()] || null : (__ink_acc_trgt[(() => { return lo })()] !== undefined ? __ink_acc_trgt[(() => { return lo })()] : null)})(); lsub = i => (() => { __ink_trampolined_lsub = i => __ink_match((() => { return ((() => {let __ink_acc_trgt = __as_ink_string(vPred); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})() < pivot) })(), [[() => (true), () => (__ink_trampoline(__ink_trampolined_lsub, __as_ink_string(i + 1)))], [() => (false), () => (i)]]); return __ink_resolve_trampoline(__ink_trampolined_lsub, i) })(); rsub = j => (() => { __ink_trampolined_rsub = j => __ink_match((() => { return ((() => {let __ink_acc_trgt = __as_ink_string(vPred); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return j })()] || null : (__ink_acc_trgt[(() => { return j })()] !== undefined ? __ink_acc_trgt[(() => { return j })()] : null)})() > pivot) })(), [[() => (true), () => (__ink_trampoline(__ink_trampolined_rsub, (j - 1)))], [() => (false), () => (j)]]); return __ink_resolve_trampoline(__ink_trampolined_rsub, j) })(); return (() => { let __ink_trampolined_sub; let sub; return sub = (i, j) => (() => { __ink_trampolined_sub = (i, j) => (() => { i = lsub(i); j = rsub(j); return __ink_match((() => { return (i < j) })(), [[() => (false), () => (j)], [() => (true), () => ((() => { let tmp; let tmpPred; tmp = (() => {let __ink_acc_trgt = __as_ink_string(v); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})(); tmpPred = (() => {let __ink_acc_trgt = __as_ink_string(vPred); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})(); (() => {let __ink_assgn_trgt = __as_ink_string(v); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return i })(), (() => {let __ink_acc_trgt = __as_ink_string(v); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return j })()] || null : (__ink_acc_trgt[(() => { return j })()] !== undefined ? __ink_acc_trgt[(() => { return j })()] : null)})()) : (__ink_assgn_trgt[(() => { return i })()]) = (() => {let __ink_acc_trgt = __as_ink_string(v); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return j })()] || null : (__ink_acc_trgt[(() => { return j })()] !== undefined ? __ink_acc_trgt[(() => { return j })()] : null)})(); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(v); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return j })(), tmp) : (__ink_assgn_trgt[(() => { return j })()]) = tmp; return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(vPred); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return i })(), (() => {let __ink_acc_trgt = __as_ink_string(vPred); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return j })()] || null : (__ink_acc_trgt[(() => { return j })()] !== undefined ? __ink_acc_trgt[(() => { return j })()] : null)})()) : (__ink_assgn_trgt[(() => { return i })()]) = (() => {let __ink_acc_trgt = __as_ink_string(vPred); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return j })()] || null : (__ink_acc_trgt[(() => { return j })()] !== undefined ? __ink_acc_trgt[(() => { return j })()] : null)})(); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(vPred); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return j })(), tmpPred) : (__ink_assgn_trgt[(() => { return j })()]) = tmpPred; return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub, __as_ink_string(i + 1), (j - 1)) })())]]) })(); return __ink_resolve_trampoline(__ink_trampolined_sub, i, j) })() })()(lo, hi) })(); return (() => { let __ink_trampolined_quicksort; let quicksort; return quicksort = (v, lo, hi) => (() => { __ink_trampolined_quicksort = (v, lo, hi) => __ink_match(len(v), [[() => (0), () => (v)], [() => (__Ink_Empty), () => (__ink_match((() => { return (lo < hi) })(), [[() => (false), () => (v)], [() => (true), () => ((() => { let p; p = partition(v, lo, hi); quicksort(v, lo, p); return __ink_trampoline(__ink_trampolined_quicksort, v, __as_ink_string(p + 1), hi) })())]]))]]); return __ink_resolve_trampoline(__ink_trampolined_quicksort, v, lo, hi) })() })()(v, 0, (len(v) - 1)) })();
sort__ink_em__ = v => sortBy(v, x => x);
sort = v => sort__ink_em__(clone(v))

std = load(__Ink_String(`std`));
str = load(__Ink_String(`str`));
map = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[map] || null : (__ink_acc_trgt.map !== undefined ? __ink_acc_trgt.map : null)})();
cat = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[cat] || null : (__ink_acc_trgt.cat !== undefined ? __ink_acc_trgt.cat : null)})();
ws__ink_qm__ = (() => {let __ink_acc_trgt = __as_ink_string(str); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[ws__ink_qm__] || null : (__ink_acc_trgt.ws__ink_qm__ !== undefined ? __ink_acc_trgt.ws__ink_qm__ : null)})();
digit__ink_qm__ = (() => {let __ink_acc_trgt = __as_ink_string(str); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[digit__ink_qm__] || null : (__ink_acc_trgt.digit__ink_qm__ !== undefined ? __ink_acc_trgt.digit__ink_qm__ : null)})();
esc = c => __ink_match(point(c), [[() => (9), () => (__Ink_String(`\\t`))], [() => (10), () => (__Ink_String(`\\n`))], [() => (13), () => (__Ink_String(`\\r`))], [() => (34), () => (__Ink_String(`\\"`))], [() => (92), () => (__Ink_String(`\\\\`))], [() => (__Ink_Empty), () => (c)]]);
escape = s => (() => { let max; max = len(s); return (() => { let __ink_trampolined_sub; let sub; return sub = (i, acc) => (() => { __ink_trampolined_sub = (i, acc) => __ink_match(i, [[() => (max), () => (acc)], [() => (__Ink_Empty), () => (__ink_trampoline(__ink_trampolined_sub, __as_ink_string(i + 1), __as_ink_string(acc + esc((() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})()))))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i, acc) })() })()(0, __Ink_String(``)) })();
ser = c => __ink_match(type(c), [[() => (__Ink_String(`()`)), () => (__Ink_String(`null`))], [() => (__Ink_String(`string`)), () => (__as_ink_string(__as_ink_string(__Ink_String(`"`) + escape(c)) + __Ink_String(`"`)))], [() => (__Ink_String(`number`)), () => (string(c))], [() => (__Ink_String(`boolean`)), () => (string(c))], [() => (__Ink_String(`function`)), () => (__Ink_String(`null`))], [() => (__Ink_String(`composite`)), () => (__as_ink_string(__as_ink_string(__Ink_String(`{`) + cat(map(keys(c), k => __as_ink_string(__as_ink_string(__as_ink_string(__Ink_String(`"`) + k) + __Ink_String(`":`)) + ser((() => {let __ink_acc_trgt = __as_ink_string(c); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return k })()] || null : (__ink_acc_trgt[(() => { return k })()] !== undefined ? __ink_acc_trgt[(() => { return k })()] : null)})()))), __Ink_String(`,`))) + __Ink_String(`}`)))]]);
num__ink_qm__ = c => __ink_match(c, [[() => (__Ink_String(``)), () => (false)], [() => (__Ink_String(`.`)), () => (true)], [() => (__Ink_Empty), () => (digit__ink_qm__(c))]]);
reader = s => (() => { let next; let peek; let state; state = {idx: 0, err__ink_qm__: false}; next = () => (() => { let c; (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(idx, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() + 1)) : (__ink_assgn_trgt.idx) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() + 1); return __ink_assgn_trgt})(); return __ink_match(c = (() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return ((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() - 1) })()] || null : (__ink_acc_trgt[(() => { return ((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() - 1) })()] !== undefined ? __ink_acc_trgt[(() => { return ((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() - 1) })()] : null)})(), [[() => (null), () => (__Ink_String(``))], [() => (__Ink_Empty), () => (c)]]) })(); peek = () => (() => { let c; return __ink_match(c = (() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() })()] || null : (__ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() })()] !== undefined ? __ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() })()] : null)})(), [[() => (null), () => (__Ink_String(``))], [() => (__Ink_Empty), () => (c)]]) })(); return {next: next, peek: peek, ff: () => (() => { let __ink_trampolined_sub; let sub; return sub = () => (() => { __ink_trampolined_sub = () => __ink_match(ws__ink_qm__(peek()), [[() => (true), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(idx, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() + 1)) : (__ink_assgn_trgt.idx) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() + 1); return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())]]); return __ink_resolve_trampoline(__ink_trampolined_sub) })() })()(), done__ink_qm__: () => __ink_negate((() => { return ((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() < len(s)) })()), err: () => (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(err__ink_qm__, true) : (__ink_assgn_trgt.err__ink_qm__) = true; return __ink_assgn_trgt})(), err__ink_qm__: () => (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[err__ink_qm__] || null : (__ink_acc_trgt.err__ink_qm__ !== undefined ? __ink_acc_trgt.err__ink_qm__ : null)})()} })();
deNull = r => (() => { let n; n = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[next] || null : (__ink_acc_trgt.next !== undefined ? __ink_acc_trgt.next : null)})(); return __ink_match(__as_ink_string(__as_ink_string(__as_ink_string(n() + n()) + n()) + n()), [[() => (__Ink_String(`null`)), () => (null)], [() => (__Ink_Empty), () => ((() => { return (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[err] || null : (__ink_acc_trgt.err !== undefined ? __ink_acc_trgt.err : null)})() })()())]]) })();
deString = r => (() => { let n; let p; n = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[next] || null : (__ink_acc_trgt.next !== undefined ? __ink_acc_trgt.next : null)})(); p = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[peek] || null : (__ink_acc_trgt.peek !== undefined ? __ink_acc_trgt.peek : null)})(); n(); return (() => { let __ink_trampolined_sub; let sub; return sub = acc => (() => { __ink_trampolined_sub = acc => __ink_match(p(), [[() => (__Ink_String(``)), () => ((() => { (() => { return (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[err] || null : (__ink_acc_trgt.err !== undefined ? __ink_acc_trgt.err : null)})() })()(); return null })())], [() => (__Ink_String(`\\`)), () => ((() => { n(); return __ink_trampoline(__ink_trampolined_sub, __as_ink_string(acc + (() => { let c; return __ink_match(c = n(), [[() => (__Ink_String(`t`)), () => (char(9))], [() => (__Ink_String(`n`)), () => (char(10))], [() => (__Ink_String(`r`)), () => (char(13))], [() => (__Ink_String(`"`)), () => (__Ink_String(`"`))], [() => (__Ink_Empty), () => (c)]]) })())) })())], [() => (__Ink_String(`"`)), () => ((() => { n(); return acc })())], [() => (__Ink_Empty), () => (__ink_trampoline(__ink_trampolined_sub, __as_ink_string(acc + n())))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, acc) })() })()(__Ink_String(``)) })();
deNumber = r => (() => { let n; let p; let result; let state; n = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[next] || null : (__ink_acc_trgt.next !== undefined ? __ink_acc_trgt.next : null)})(); p = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[peek] || null : (__ink_acc_trgt.peek !== undefined ? __ink_acc_trgt.peek : null)})(); state = {negate__ink_qm__: false, decimal__ink_qm__: false}; __ink_match(p(), [[() => (__Ink_String(`-`)), () => ((() => { n(); return (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(negate__ink_qm__, true) : (__ink_assgn_trgt.negate__ink_qm__) = true; return __ink_assgn_trgt})() })())]]); result = (() => { let __ink_trampolined_sub; let sub; return sub = acc => (() => { __ink_trampolined_sub = acc => __ink_match(num__ink_qm__(p()), [[() => (true), () => (__ink_match(p(), [[() => (__Ink_String(`.`)), () => (__ink_match((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[decimal__ink_qm__] || null : (__ink_acc_trgt.decimal__ink_qm__ !== undefined ? __ink_acc_trgt.decimal__ink_qm__ : null)})(), [[() => (true), () => ((() => { return (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[err] || null : (__ink_acc_trgt.err !== undefined ? __ink_acc_trgt.err : null)})() })()())], [() => (false), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(decimal__ink_qm__, true) : (__ink_assgn_trgt.decimal__ink_qm__) = true; return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub, __as_ink_string(acc + n())) })())]]))], [() => (__Ink_Empty), () => (__ink_trampoline(__ink_trampolined_sub, __as_ink_string(acc + n())))]]))], [() => (false), () => (acc)]]); return __ink_resolve_trampoline(__ink_trampolined_sub, acc) })() })()(__Ink_String(``)); return __ink_match((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[negate__ink_qm__] || null : (__ink_acc_trgt.negate__ink_qm__ !== undefined ? __ink_acc_trgt.negate__ink_qm__ : null)})(), [[() => (false), () => (number(result))], [() => (true), () => (__ink_negate(number(result)))]]) })();
deTrue = r => (() => { let n; n = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[next] || null : (__ink_acc_trgt.next !== undefined ? __ink_acc_trgt.next : null)})(); return __ink_match(__as_ink_string(__as_ink_string(__as_ink_string(n() + n()) + n()) + n()), [[() => (__Ink_String(`true`)), () => (true)], [() => (__Ink_Empty), () => ((() => { return (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[err] || null : (__ink_acc_trgt.err !== undefined ? __ink_acc_trgt.err : null)})() })()())]]) })();
deFalse = r => (() => { let n; n = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[next] || null : (__ink_acc_trgt.next !== undefined ? __ink_acc_trgt.next : null)})(); return __ink_match(__as_ink_string(__as_ink_string(__as_ink_string(__as_ink_string(n() + n()) + n()) + n()) + n()), [[() => (__Ink_String(`false`)), () => (false)], [() => (__Ink_Empty), () => ((() => { return (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[err] || null : (__ink_acc_trgt.err !== undefined ? __ink_acc_trgt.err : null)})() })()())]]) })();
deList = r => (() => { let ff; let n; let p; let state; n = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[next] || null : (__ink_acc_trgt.next !== undefined ? __ink_acc_trgt.next : null)})(); p = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[peek] || null : (__ink_acc_trgt.peek !== undefined ? __ink_acc_trgt.peek : null)})(); ff = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[ff] || null : (__ink_acc_trgt.ff !== undefined ? __ink_acc_trgt.ff : null)})(); state = {idx: 0}; n(); ff(); return (() => { let __ink_trampolined_sub; let sub; return sub = acc => (() => { __ink_trampolined_sub = acc => __ink_match((() => { return (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[err__ink_qm__] || null : (__ink_acc_trgt.err__ink_qm__ !== undefined ? __ink_acc_trgt.err__ink_qm__ : null)})() })()(), [[() => (true), () => (null)], [() => (false), () => (__ink_match(p(), [[() => (__Ink_String(``)), () => ((() => { (() => { return (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[err] || null : (__ink_acc_trgt.err !== undefined ? __ink_acc_trgt.err : null)})() })()(); return null })())], [() => (__Ink_String(`]`)), () => ((() => { n(); return acc })())], [() => (__Ink_Empty), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() })(), der(r)) : (__ink_assgn_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() })()]) = der(r); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(idx, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() + 1)) : (__ink_assgn_trgt.idx) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[idx] || null : (__ink_acc_trgt.idx !== undefined ? __ink_acc_trgt.idx : null)})() + 1); return __ink_assgn_trgt})(); ff(); __ink_match(p(), [[() => (__Ink_String(`,`)), () => (n())]]); ff(); return __ink_trampoline(__ink_trampolined_sub, acc) })())]]))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, acc) })() })()([]) })();
deComp = r => (() => { let ff; let n; let p; n = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[next] || null : (__ink_acc_trgt.next !== undefined ? __ink_acc_trgt.next : null)})(); p = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[peek] || null : (__ink_acc_trgt.peek !== undefined ? __ink_acc_trgt.peek : null)})(); ff = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[ff] || null : (__ink_acc_trgt.ff !== undefined ? __ink_acc_trgt.ff : null)})(); n(); ff(); return (() => { let __ink_trampolined_sub; let sub; return sub = acc => (() => { __ink_trampolined_sub = acc => __ink_match((() => { return (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[err__ink_qm__] || null : (__ink_acc_trgt.err__ink_qm__ !== undefined ? __ink_acc_trgt.err__ink_qm__ : null)})() })()(), [[() => (true), () => (null)], [() => (false), () => (__ink_match(p(), [[() => (__Ink_String(``)), () => ((() => { return (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[err] || null : (__ink_acc_trgt.err !== undefined ? __ink_acc_trgt.err : null)})() })()())], [() => (__Ink_String(`}`)), () => ((() => { n(); return acc })())], [() => (__Ink_Empty), () => ((() => { let key; key = deString(r); return __ink_match((() => { return (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[err__ink_qm__] || null : (__ink_acc_trgt.err__ink_qm__ !== undefined ? __ink_acc_trgt.err__ink_qm__ : null)})() })()(), [[() => (false), () => ((() => { let val; ff(); __ink_match(p(), [[() => (__Ink_String(`:`)), () => (n())]]); ff(); val = der(r); return __ink_match((() => { return (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[err__ink_qm__] || null : (__ink_acc_trgt.err__ink_qm__ !== undefined ? __ink_acc_trgt.err__ink_qm__ : null)})() })()(), [[() => (false), () => ((() => { ff(); __ink_match(p(), [[() => (__Ink_String(`,`)), () => (n())]]); ff(); (() => {let __ink_assgn_trgt = __as_ink_string(acc); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return key })(), val) : (__ink_assgn_trgt[(() => { return key })()]) = val; return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub, acc) })())]]) })())]]) })())]]))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, acc) })() })()({}) })();
der = r => (() => { let result; (() => { return (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[ff] || null : (__ink_acc_trgt.ff !== undefined ? __ink_acc_trgt.ff : null)})() })()(); result = (() => { return __ink_match((() => { return (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[peek] || null : (__ink_acc_trgt.peek !== undefined ? __ink_acc_trgt.peek : null)})() })()(), [[() => (__Ink_String(`n`)), () => (deNull(r))], [() => (__Ink_String(`"`)), () => (deString(r))], [() => (__Ink_String(`t`)), () => (deTrue(r))], [() => (__Ink_String(`f`)), () => (deFalse(r))], [() => (__Ink_String(`[`)), () => (deList(r))], [() => (__Ink_String(`{`)), () => (deComp(r))], [() => (__Ink_Empty), () => (deNumber(r))]]) })(); return __ink_match((() => { return (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[err__ink_qm__] || null : (__ink_acc_trgt.err__ink_qm__ !== undefined ? __ink_acc_trgt.err__ink_qm__ : null)})() })()(), [[() => (true), () => (null)], [() => (false), () => (result)]]) })();
de = s => der(reader(s))

str = s => bind(s, __Ink_String(`valueOf`))(s);
arr = bind(Object, __Ink_String(`values`));
hae = (tag, classList, attrs, events, children) => ({tag: str(tag), attrs: (() => {let __ink_assgn_trgt = __as_ink_string(attrs); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return __Ink_String(`class`) })(), arr(map(classList, str))) : (__ink_assgn_trgt[(() => { return __Ink_String(`class`) })()]) = arr(map(classList, str)); return __ink_assgn_trgt})(), events: events, children: arr(map(children, child => __ink_match(type(child), [[() => (__Ink_String(`string`)), () => (str(child))], [() => (__Ink_Empty), () => (child)]])))});
ha = (tag, classList, attrs, children) => hae(tag, classList, attrs, {}, children);
h = (tag, classList, children) => hae(tag, classList, {}, {}, children);
Renderer = root => (() => { let InitialDom; let node; let render; let self; render = (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(window); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Torus] || null : (__ink_acc_trgt.Torus !== undefined ? __ink_acc_trgt.Torus : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[render] || null : (__ink_acc_trgt.render !== undefined ? __ink_acc_trgt.render : null)})(); InitialDom = h(__Ink_String(`div`), [], []); node = render(null, null, InitialDom); bind(root, __Ink_String(`appendChild`))(node); return self = {node: node, prev: InitialDom, update: jdom => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(self); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(node, render((() => {let __ink_acc_trgt = __as_ink_string(self); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[node] || null : (__ink_acc_trgt.node !== undefined ? __ink_acc_trgt.node : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(self); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[prev] || null : (__ink_acc_trgt.prev !== undefined ? __ink_acc_trgt.prev : null)})(), jdom)) : (__ink_assgn_trgt.node) = render((() => {let __ink_acc_trgt = __as_ink_string(self); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[node] || null : (__ink_acc_trgt.node !== undefined ? __ink_acc_trgt.node : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(self); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[prev] || null : (__ink_acc_trgt.prev !== undefined ? __ink_acc_trgt.prev : null)})(), jdom); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(self); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(prev, jdom) : (__ink_assgn_trgt.prev) = jdom; return __ink_assgn_trgt})(); return (() => {let __ink_acc_trgt = __as_ink_string(self); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[node] || null : (__ink_acc_trgt.node !== undefined ? __ink_acc_trgt.node : null)})() })()} })()

std = load(__Ink_String(`std`));
log = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[log] || null : (__ink_acc_trgt.log !== undefined ? __ink_acc_trgt.log : null)})();
f = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[format] || null : (__ink_acc_trgt.format !== undefined ? __ink_acc_trgt.format : null)})();
json = load(__Ink_String(`json`));
serJSON = (() => {let __ink_acc_trgt = __as_ink_string(json); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[ser] || null : (__ink_acc_trgt.ser !== undefined ? __ink_acc_trgt.ser : null)})();
deJSON = (() => {let __ink_acc_trgt = __as_ink_string(json); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[de] || null : (__ink_acc_trgt.de !== undefined ? __ink_acc_trgt.de : null)})();
Newline = char(10);
MaxPathChars = 16;
FileType = {Blob: __ink_negate(1), Text: 0, Image: 1};
fetchAPI = (url, data, withRespJSON) => (() => { let json; let resp; resp = fetch(url, data); json = bind(resp, __Ink_String(`then`))(resp => bind(resp, __Ink_String(`json`))()); return bind(json, __Ink_String(`then`))(data => withRespJSON(data)) })();
fetchRepo = (userName, repoName, withRepo) => fetchAPI(f(__Ink_String(`/repo/{{ 0 }}/{{ 1 }}`), [userName, repoName]), {}, data => withRepo(data));
fetchContents = (userName, repoName, path, withContents) => fetchAPI(f(__Ink_String(`/repo/{{ 0 }}/{{ 1 }}/files{{ 2 }}`), [userName, repoName, path]), {}, data => withContents(data));
translateFileFromAPI = fileFromAPI => ({open__ink_qm__: false, name: (() => {let __ink_acc_trgt = __as_ink_string(fileFromAPI); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})(), path: (() => {let __ink_acc_trgt = __as_ink_string(fileFromAPI); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[path] || null : (__ink_acc_trgt.path !== undefined ? __ink_acc_trgt.path : null)})(), type: (() => {let __ink_acc_trgt = __as_ink_string(fileFromAPI); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})(), download: (() => {let __ink_acc_trgt = __as_ink_string(fileFromAPI); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`download_url`)] || null : (__ink_acc_trgt[__Ink_String(`download_url`)] !== undefined ? __ink_acc_trgt[__Ink_String(`download_url`)] : null)})(), content: null, children: null});
fileInWorkspace__ink_qm__ = file => (() => { let allOpenFiles; allOpenFiles = flatten(map((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[panes] || null : (__ink_acc_trgt.panes !== undefined ? __ink_acc_trgt.panes : null)})(), pane => (() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})())); return (() => { let __ink_trampolined_sub; let sub; return sub = i => (() => { __ink_trampolined_sub = i => __ink_match(i, [[() => (len(allOpenFiles)), () => (false)], [() => (__Ink_Empty), () => (__ink_match((() => {let __ink_acc_trgt = __as_ink_string(allOpenFiles); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})(), [[() => (file), () => (true)], [() => (__Ink_Empty), () => (__ink_trampoline(__ink_trampolined_sub, __as_ink_string(i + 1)))]]))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i) })() })()(0) })();
fileTypeFromPath = path => __ink_match(true, [[() => (hasSuffix__ink_qm__(path, __Ink_String(`.jpg`))), () => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Image] || null : (__ink_acc_trgt.Image !== undefined ? __ink_acc_trgt.Image : null)})())], [() => (hasSuffix__ink_qm__(path, __Ink_String(`.png`))), () => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Image] || null : (__ink_acc_trgt.Image !== undefined ? __ink_acc_trgt.Image : null)})())], [() => (hasSuffix__ink_qm__(path, __Ink_String(`.gif`))), () => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Image] || null : (__ink_acc_trgt.Image !== undefined ? __ink_acc_trgt.Image : null)})())], [() => (hasSuffix__ink_qm__(path, __Ink_String(`.bmp`))), () => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Image] || null : (__ink_acc_trgt.Image !== undefined ? __ink_acc_trgt.Image : null)})())], [() => (hasSuffix__ink_qm__(path, __Ink_String(`.sqlite`))), () => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Blob] || null : (__ink_acc_trgt.Blob !== undefined ? __ink_acc_trgt.Blob : null)})())], [() => (__Ink_Empty), () => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Text] || null : (__ink_acc_trgt.Text !== undefined ? __ink_acc_trgt.Text : null)})())]]);
State = {theme: __Ink_String(`light`), userName: __Ink_String(`thesephist`), repoName: __Ink_String(`kin`), repo: null, files: [], panes: []};
Link = (name, href) => ha(__Ink_String(`a`), [], {href: href, target: __Ink_String(`_blank`)}, [name]);
RepoPanel = (() => { let state; state = {userName: (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(), repoName: (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(), inputVisible: false}; return () => (() => { let repo; return h(__Ink_String(`div`), [__Ink_String(`repo-panel`)], [h(__Ink_String(`div`), [__Ink_String(`repo-panel-header`)], [h(__Ink_String(`div`), [__Ink_String(`repo-header-link`)], [Link(f(__Ink_String(`{{ userName }}/{{ repoName }}`), State), f(__Ink_String(`https://github.com/{{ userName }}/{{ repoName }}`), State))]), hae(__Ink_String(`button`), [__Ink_String(`repo-toggle-input`)], {}, {click: evt => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(inputVisible, __ink_negate((() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[inputVisible] || null : (__ink_acc_trgt.inputVisible !== undefined ? __ink_acc_trgt.inputVisible : null)})() })())) : (__ink_assgn_trgt.inputVisible) = __ink_negate((() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[inputVisible] || null : (__ink_acc_trgt.inputVisible !== undefined ? __ink_acc_trgt.inputVisible : null)})() })()); return __ink_assgn_trgt})(); __ink_match((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[inputVisible] || null : (__ink_acc_trgt.inputVisible !== undefined ? __ink_acc_trgt.inputVisible : null)})(), [[() => (true), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(userName, (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})()) : (__ink_assgn_trgt.userName) = (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(); return __ink_assgn_trgt})(); return (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(repoName, (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})()) : (__ink_assgn_trgt.repoName) = (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(); return __ink_assgn_trgt})() })())]]); return render() })()}, [__Ink_String(`edit`)])]), __ink_match((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[inputVisible] || null : (__ink_acc_trgt.inputVisible !== undefined ? __ink_acc_trgt.inputVisible : null)})(), [[() => (true), () => (h(__Ink_String(`div`), [__Ink_String(`repo-input-panel`)], [hae(__Ink_String(`input`), [__Ink_String(`repo-input-username`)], {value: (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(), placeholder: __Ink_String(`username`)}, {input: evt => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(userName, (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[target] || null : (__ink_acc_trgt.target !== undefined ? __ink_acc_trgt.target : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[value] || null : (__ink_acc_trgt.value !== undefined ? __ink_acc_trgt.value : null)})()) : (__ink_assgn_trgt.userName) = (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[target] || null : (__ink_acc_trgt.target !== undefined ? __ink_acc_trgt.target : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[value] || null : (__ink_acc_trgt.value !== undefined ? __ink_acc_trgt.value : null)})(); return __ink_assgn_trgt})(); return render() })()}, []), hae(__Ink_String(`input`), [__Ink_String(`repo-input-reponame`)], {value: (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(), placeholder: __Ink_String(`repo name`)}, {input: evt => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(repoName, (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[target] || null : (__ink_acc_trgt.target !== undefined ? __ink_acc_trgt.target : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[value] || null : (__ink_acc_trgt.value !== undefined ? __ink_acc_trgt.value : null)})()) : (__ink_assgn_trgt.repoName) = (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[target] || null : (__ink_acc_trgt.target !== undefined ? __ink_acc_trgt.target : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[value] || null : (__ink_acc_trgt.value !== undefined ? __ink_acc_trgt.value : null)})(); return __ink_assgn_trgt})(); return render() })()}, []), hae(__Ink_String(`button`), [__Ink_String(`repo-input-submit`)], {}, {click: () => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(userName, (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})()) : (__ink_assgn_trgt.userName) = (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(repoName, (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})()) : (__ink_assgn_trgt.repoName) = (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(inputVisible, false) : (__ink_assgn_trgt.inputVisible) = false; return __ink_assgn_trgt})(); return refreshRepo() })()}, [__Ink_String(`Go`)])]))]]), __ink_match(repo = (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repo] || null : (__ink_acc_trgt.repo !== undefined ? __ink_acc_trgt.repo : null)})(), [[() => (null), () => (h(__Ink_String(`div`), [__Ink_String(`repo-info-panel`), __Ink_String(`empty`)], [__Ink_String(`Loading repo...`)]))], [() => (__Ink_Empty), () => (h(__Ink_String(`div`), [__Ink_String(`repo-info-panel`)], [h(__Ink_String(`div`), [__Ink_String(`repo-info-description`)], [(() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[description] || null : (__ink_acc_trgt.description !== undefined ? __ink_acc_trgt.description : null)})()]), h(__Ink_String(`div`), [__Ink_String(`repo-info-homepage`)], [Link((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[homepage] || null : (__ink_acc_trgt.homepage !== undefined ? __ink_acc_trgt.homepage : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[homepage] || null : (__ink_acc_trgt.homepage !== undefined ? __ink_acc_trgt.homepage : null)})())]), h(__Ink_String(`div`), [__Ink_String(`repo-info-language`)], [(() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[language] || null : (__ink_acc_trgt.language !== undefined ? __ink_acc_trgt.language : null)})()])]))]])]) })() })();
FileTreeNode = file => h(__Ink_String(`div`), [__Ink_String(`file-tree-node`)], [h(__Ink_String(`div`), [__Ink_String(`file-tree-node-row`), __ink_match(fileInWorkspace__ink_qm__(file), [[() => (true), () => (__Ink_String(`in-workspace`))], [() => (__Ink_Empty), () => (__Ink_String(``))]])], [__ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})(), [[() => (__Ink_String(`dir`)), () => (hae(__Ink_String(`button`), [__Ink_String(`file-tree-node-toggle`), __ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})(), [[() => (true), () => (__Ink_String(`open`))], [() => (__Ink_Empty), () => (__Ink_String(`closed`))]])], {}, {click: () => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(file); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(open__ink_qm__, __ink_negate((() => { return (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})() })())) : (__ink_assgn_trgt.open__ink_qm__) = __ink_negate((() => { return (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})() })()); return __ink_assgn_trgt})(); fetchFileChildren(file, render); return render() })()}, [__Ink_String(`▼`)]))], [() => (__Ink_Empty), () => (null)]]), hae(__Ink_String(`button`), [__Ink_String(`file-tree-node-name`)], {}, {click: () => __ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})(), [[() => (__Ink_String(`file`)), () => (__ink_match(fileInWorkspace__ink_qm__(file), [[() => (true), () => (render((() => {let __ink_assgn_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[panes] || null : (__ink_acc_trgt.panes !== undefined ? __ink_acc_trgt.panes : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`0`)] || null : (__ink_acc_trgt[__Ink_String(`0`)] !== undefined ? __ink_acc_trgt[__Ink_String(`0`)] : null)})()); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(active, file) : (__ink_assgn_trgt.active) = file; return __ink_assgn_trgt})()))], [() => (__Ink_Empty), () => ((() => { let pane; __ink_match(pane = (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[panes] || null : (__ink_acc_trgt.panes !== undefined ? __ink_acc_trgt.panes : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})(), [[() => (null), () => ((() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(panes, [{active: file, files: [file]}]) : (__ink_assgn_trgt.panes) = [{active: file, files: [file]}]; return __ink_assgn_trgt})())], [() => (__Ink_Empty), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})()); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(len((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})()), file) : (__ink_assgn_trgt[len((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})())]) = file; return __ink_assgn_trgt})(); return (() => {let __ink_assgn_trgt = __as_ink_string(pane); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(active, file) : (__ink_assgn_trgt.active) = file; return __ink_assgn_trgt})() })())]]); fetchFileContent(file, () => (() => { let codePre; render(); return __ink_match(hasSuffix__ink_qm__((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})(), __Ink_String(`.ink`)), [[() => (true), () => (log(__Ink_String(`syntax highlight ink`)))], [() => (__Ink_Empty), () => (__ink_match(codePre = bind(document, __Ink_String(`querySelector`))(__Ink_String(`.file-preview-line-texts`)), [[() => (null), () => (null)], [() => (__Ink_Empty), () => ((() => { return (() => {let __ink_acc_trgt = __as_ink_string(hljs); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[highlightBlock] || null : (__ink_acc_trgt.highlightBlock !== undefined ? __ink_acc_trgt.highlightBlock : null)})() })()(codePre))]]))]]) })()); return render() })())]]))], [() => (__Ink_String(`dir`)), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(file); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(open__ink_qm__, __ink_negate((() => { return (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})() })())) : (__ink_assgn_trgt.open__ink_qm__) = __ink_negate((() => { return (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})() })()); return __ink_assgn_trgt})(); fetchFileChildren(file, render); return render() })())]])}, [(() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})()])]), __ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})(), [[() => (false), () => (null)], [() => (__Ink_Empty), () => (__ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[children] || null : (__ink_acc_trgt.children !== undefined ? __ink_acc_trgt.children : null)})(), [[() => (null), () => (__Ink_String(`Loading files...`))], [() => (__Ink_Empty), () => (FileTreeList((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[children] || null : (__ink_acc_trgt.children !== undefined ? __ink_acc_trgt.children : null)})()))]]))]])]);
FileTreeList = files => h(__Ink_String(`ul`), [__Ink_String(`file-tree-list`)], (() => { let sortedFiles; sortedFiles = sortBy(clone(files), file => (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})()); return map(sortedFiles, file => h(__Ink_String(`li`), [__Ink_String(`file-tree-list-item`)], [FileTreeNode(file)])) })());
Sidebar = () => h(__Ink_String(`div`), [__Ink_String(`sidebar`)], [h(__Ink_String(`nav`), [], [ha(__Ink_String(`a`), [__Ink_String(`home-link`)], {href: __Ink_String(`/`)}, [__Ink_String(`Ink codebase browser`)])]), RepoPanel(), h(__Ink_String(`div`), [__Ink_String(`file-tree-list-container`)], [FileTreeList((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})())])]);
FilePreview = file => (() => { let content; return __ink_match(fileTypeFromPath((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[path] || null : (__ink_acc_trgt.path !== undefined ? __ink_acc_trgt.path : null)})()), [[() => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Blob] || null : (__ink_acc_trgt.Blob !== undefined ? __ink_acc_trgt.Blob : null)})()), () => (h(__Ink_String(`div`), [__Ink_String(`file-preview`), __Ink_String(`file-preview-blob`)], [__Ink_String(`Can't preview this type of file`)]))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Image] || null : (__ink_acc_trgt.Image !== undefined ? __ink_acc_trgt.Image : null)})()), () => (h(__Ink_String(`div`), [__Ink_String(`file-preview`), __Ink_String(`file-preview-image`)], [ha(__Ink_String(`img`), [__Ink_String(`file-preview-image-content`)], {src: (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[download] || null : (__ink_acc_trgt.download !== undefined ? __ink_acc_trgt.download : null)})()}, [])]))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Text] || null : (__ink_acc_trgt.Text !== undefined ? __ink_acc_trgt.Text : null)})()), () => (__ink_match(content = (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[content] || null : (__ink_acc_trgt.content !== undefined ? __ink_acc_trgt.content : null)})(), [[() => (null), () => (h(__Ink_String(`div`), [__Ink_String(`file-preview`), __Ink_String(`file-preview-text`), __Ink_String(`loading`)], []))], [() => (__Ink_Empty), () => (h(__Ink_String(`div`), [__Ink_String(`file-preview`), __Ink_String(`file-preview-text`)], [(() => { let splitLines; splitLines = split(content, Newline); return ha(__Ink_String(`div`), [__Ink_String(`file-preview-text-scroller`)], {style: {height: __as_ink_string(string(__as_ink_string((len(splitLines) * 1.25) + 5)) + __Ink_String(`em`))}}, [h(__Ink_String(`div`), [__Ink_String(`file-preview-line-nos`)], map(splitLines, (__0, n) => h(__Ink_String(`pre`), [__Ink_String(`file-preview-line-no`)], [__as_ink_string(n + 1)]))), h(__Ink_String(`pre`), [__Ink_String(`file-preview-line-texts`)], [content])]) })()]))]]))]]) })();
FilePane = pane => h(__Ink_String(`div`), [__Ink_String(`file-pane`)], [h(__Ink_String(`div`), [__Ink_String(`file-pane-header`)], (() => { return map((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})(), file => h(__Ink_String(`div`), [__Ink_String(`file-pane-header`)], [h(__Ink_String(`div`), [__Ink_String(`file-pane-header-tab`), __ink_match((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[active] || null : (__ink_acc_trgt.active !== undefined ? __ink_acc_trgt.active : null)})(), [[() => (file), () => (__Ink_String(`active`))], [() => (__Ink_Empty), () => (__Ink_String(``))]])], [hae(__Ink_String(`button`), [__Ink_String(`file-pane-header-info`)], {title: (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[path] || null : (__ink_acc_trgt.path !== undefined ? __ink_acc_trgt.path : null)})()}, {click: () => render((() => {let __ink_assgn_trgt = __as_ink_string(pane); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(active, file) : (__ink_assgn_trgt.active) = file; return __ink_assgn_trgt})())}, [h(__Ink_String(`span`), [__Ink_String(`file-pane-header-path`)], [(() => { let path; path = trimSuffix((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[path] || null : (__ink_acc_trgt.path !== undefined ? __ink_acc_trgt.path : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})()); return __ink_match((len(path) < MaxPathChars), [[() => (true), () => (path)], [() => (__Ink_Empty), () => (__as_ink_string(__Ink_String(`...`) + slice(path, (len(path) - MaxPathChars), len(path))))]]) })()]), h(__Ink_String(`span`), [__Ink_String(`file-pane-header-name`)], [(() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})()])]), hae(__Ink_String(`button`), [__Ink_String(`file-pane-close`)], {}, {click: () => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(pane); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(files, filter((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})(), f => __ink_negate((() => { return __ink_eq(f, file) })()))) : (__ink_assgn_trgt.files) = filter((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})(), f => __ink_negate((() => { return __ink_eq(f, file) })())); return __ink_assgn_trgt})(); __ink_match((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})(), [[() => ([]), () => ((() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(panes, filter((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[panes] || null : (__ink_acc_trgt.panes !== undefined ? __ink_acc_trgt.panes : null)})(), p => __ink_negate((() => { return __ink_eq(p, pane) })()))) : (__ink_assgn_trgt.panes) = filter((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[panes] || null : (__ink_acc_trgt.panes !== undefined ? __ink_acc_trgt.panes : null)})(), p => __ink_negate((() => { return __ink_eq(p, pane) })())); return __ink_assgn_trgt})())], [() => (__Ink_Empty), () => (__ink_match((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[active] || null : (__ink_acc_trgt.active !== undefined ? __ink_acc_trgt.active : null)})(), [[() => (file), () => ((() => {let __ink_assgn_trgt = __as_ink_string(pane); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(active, (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})()) : (__ink_assgn_trgt.active) = (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})(); return __ink_assgn_trgt})())]]))]]); return render() })()}, [__Ink_String(`×`)])])])) })()), FilePreview((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[active] || null : (__ink_acc_trgt.active !== undefined ? __ink_acc_trgt.active : null)})())]);
FilePanes = () => h(__Ink_String(`div`), [__Ink_String(`file-panes`)], map((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[panes] || null : (__ink_acc_trgt.panes !== undefined ? __ink_acc_trgt.panes : null)})(), pane => FilePane(pane)));
root = bind(document, __Ink_String(`querySelector`))(__Ink_String(`#root`));
r = Renderer(root);
update = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[update] || null : (__ink_acc_trgt.update !== undefined ? __ink_acc_trgt.update : null)})();
refreshRepo = () => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(repo, null) : (__ink_assgn_trgt.repo) = null; return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(files, []) : (__ink_assgn_trgt.files) = []; return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(panes, []) : (__ink_assgn_trgt.panes) = []; return __ink_assgn_trgt})(); render(); fetchRepo((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(), repo => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(repo, {owner: {username: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[login] || null : (__ink_acc_trgt.login !== undefined ? __ink_acc_trgt.login : null)})(), avatar: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`avatar_url`)] || null : (__ink_acc_trgt[__Ink_String(`avatar_url`)] !== undefined ? __ink_acc_trgt[__Ink_String(`avatar_url`)] : null)})(), url: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`html_url`)] || null : (__ink_acc_trgt[__Ink_String(`html_url`)] !== undefined ? __ink_acc_trgt[__Ink_String(`html_url`)] : null)})()}, description: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[description] || null : (__ink_acc_trgt.description !== undefined ? __ink_acc_trgt.description : null)})(), homepage: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[homepage] || null : (__ink_acc_trgt.homepage !== undefined ? __ink_acc_trgt.homepage : null)})(), language: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[language] || null : (__ink_acc_trgt.language !== undefined ? __ink_acc_trgt.language : null)})()}) : (__ink_assgn_trgt.repo) = {owner: {username: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[login] || null : (__ink_acc_trgt.login !== undefined ? __ink_acc_trgt.login : null)})(), avatar: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`avatar_url`)] || null : (__ink_acc_trgt[__Ink_String(`avatar_url`)] !== undefined ? __ink_acc_trgt[__Ink_String(`avatar_url`)] : null)})(), url: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`html_url`)] || null : (__ink_acc_trgt[__Ink_String(`html_url`)] !== undefined ? __ink_acc_trgt[__Ink_String(`html_url`)] : null)})()}, description: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[description] || null : (__ink_acc_trgt.description !== undefined ? __ink_acc_trgt.description : null)})(), homepage: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[homepage] || null : (__ink_acc_trgt.homepage !== undefined ? __ink_acc_trgt.homepage : null)})(), language: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[language] || null : (__ink_acc_trgt.language !== undefined ? __ink_acc_trgt.language : null)})()}; return __ink_assgn_trgt})(); return render() })()); return fetchContents((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(), __Ink_String(`/`), contents => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(files, map(contents, translateFileFromAPI)) : (__ink_assgn_trgt.files) = map(contents, translateFileFromAPI); return __ink_assgn_trgt})(); return render() })()) })();
fetchFileChildren = (file, cb) => __ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[children] || null : (__ink_acc_trgt.children !== undefined ? __ink_acc_trgt.children : null)})(), [[() => (null), () => ((() => { return fetchContents((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(), __as_ink_string(__Ink_String(`/`) + (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[path] || null : (__ink_acc_trgt.path !== undefined ? __ink_acc_trgt.path : null)})()), contents => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(file); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(children, map(contents, translateFileFromAPI)) : (__ink_assgn_trgt.children) = map(contents, translateFileFromAPI); return __ink_assgn_trgt})(); return cb() })()) })())], [() => (__Ink_Empty), () => (cb())]]);
fetchFileContent = (file, cb) => __ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[content] || null : (__ink_acc_trgt.content !== undefined ? __ink_acc_trgt.content : null)})(), [[() => (null), () => ((() => { let resp; let text; resp = fetch((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[download] || null : (__ink_acc_trgt.download !== undefined ? __ink_acc_trgt.download : null)})()); text = bind(resp, __Ink_String(`then`))(resp => bind(resp, __Ink_String(`text`))()); return bind(text, __Ink_String(`then`))(text => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(file); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(content, text) : (__ink_assgn_trgt.content) = text; return __ink_assgn_trgt})(); return cb() })()) })())], [() => (__Ink_Empty), () => (cb())]]);
render = () => update(h(__Ink_String(`div`), [__Ink_String(`app`)], [Sidebar(), FilePanes()]));
refreshRepo();
render()

