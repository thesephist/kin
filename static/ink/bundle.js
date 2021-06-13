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
!function(t){var e={};function s(r){if(e[r])return e[r].exports;var n=e[r]={i:r,l:!1,exports:{}};return t[r].call(n.exports,n,n.exports,s),n.l=!0,n.exports}s.m=t,s.c=e,s.d=function(t,e,r){s.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},s.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},s.t=function(t,e){if(1&e&&(t=s(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(s.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var n in t)s.d(r,n,function(e){return t[e]}.bind(null,n));return r},s.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return s.d(e,"a",e),e},s.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},s.p="",s(s.s=0)}([function(t,e,s){const{render:r,Component:n,Styled:o,StyledComponent:i,List:c,ListOf:l,Record:a,Store:d,StoreOf:u,Router:h}=s(1),{jdom:f,css:m}=s(2);t.exports={render:r,Component:n,Styled:o,StyledComponent:i,List:c,ListOf:l,Record:a,Store:d,StoreOf:u,Router:h,jdom:f,css:m}},function(t,e,s){let r=0;const n=t=>null!==t&&"object"==typeof t,o=t=>{void 0===t.attrs&&(t.attrs={}),void 0===t.events&&(t.events={}),void 0===t.children&&(t.children=[])},i=t=>Array.isArray(t)?t:[t],c=()=>document.createComment("");let l=[];const a={replaceChild:()=>{}};const d=(t,e,s)=>{for(const r of Object.keys(t)){const n=i(t[r]),o=i(e[r]||[]);for(const t of n)o.includes(t)||"function"!=typeof t||s(r,t)}},u=(t,e,s)=>{const i=e=>{t&&t!==e&&l.push([2,t,e]),t=e};if(r++,e!==s)if(null===s)i(c());else if("string"==typeof s||"number"==typeof s)"string"==typeof e||"number"==typeof e?t.data=s:i(document.createTextNode(s));else if(void 0!==s.appendChild)i(s);else{(void 0===t||!n(e)||e&&void 0!==e.appendChild||e.tag!==s.tag)&&(e={tag:null},i(document.createElement(s.tag))),o(e),o(s);for(const r of Object.keys(s.attrs)){const n=e.attrs[r],o=s.attrs[r];if("class"===r){const e=o;Array.isArray(e)?t.className=e.join(" "):t.className=e}else if("style"===r){const e=n||{},s=o;for(const r of Object.keys(s))s[r]!==e[r]&&(t.style[r]=s[r]);for(const r of Object.keys(e))void 0===s[r]&&(t.style[r]="")}else r in t?(t[r]!==o||void 0===n&&n!==o)&&(t[r]=o):n!==o&&t.setAttribute(r,o)}for(const r of Object.keys(e.attrs))void 0===s.attrs[r]&&(r in t?t[r]=null:t.removeAttribute(r));d(s.events,e.events,(e,s)=>{t.addEventListener(e,s)}),d(e.events,s.events,(e,s)=>{t.removeEventListener(e,s)});const r=e.children,c=s.children,a=r.length,h=c.length;if(h+a>0){const n=e._nodes||[],o=a<h?a:h;let i=0;for(;i<o;i++)r[i]!==c[i]&&(n[i]=u(n[i],r[i],c[i]));if(a<h)for(;i<h;i++){const e=u(void 0,void 0,c[i]);l.push([0,t,e]),n.push(e)}else{for(;i<a;i++)l.push([1,t,n[i]]);n.splice(h,a-h)}s._nodes=n}}return 0==--r&&function(){const t=l.length;for(let e=0;e<t;e++){const t=l[e],s=t[0];if(1===s)t[1].removeChild(t[2]);else if(2===s){const e=t[1],s=c(),r=e.parentNode;null!==r?(r.replaceChild(s,e),t[1]=s,t[3]=r):t[3]=a}}for(let e=0;e<t;e++){const t=l[e],s=t[0];0===s?t[1].appendChild(t[2]):2===s&&t[3].replaceChild(t[2],t[1])}l=[]}(),t};class h{constructor(...t){this.jdom=void 0,this.node=void 0,this.event={source:null,handler:()=>{}},this.init(...t),void 0===this.node&&this.render()}static from(t){return class extends h{init(...t){this.args=t}compose(){return t(...this.args)}}}init(){}get record(){return this.event.source}bind(t,e){if(this.unbind(),!(t instanceof j))throw new Error(`cannot bind to ${t}, which is not an instance of Evented.`);this.event={source:t,handler:e},t.addHandler(e)}unbind(){this.record&&this.record.removeHandler(this.event.handler),this.event={source:null,handler:()=>{}}}remove(){this.unbind()}compose(){return null}preprocess(t){return t}render(t){t=t||this.record&&this.record.summarize();const e=this.preprocess(this.compose(t),t);if(void 0===e)throw new Error(this.constructor.name+".compose() returned undefined.");try{this.node=u(this.node,this.jdom,e)}catch(t){console.error("rendering error.",t)}return this.jdom=e}}const f=new Set;let m;const p=new WeakMap,v=(t,e)=>t+"{"+e+"}",b=(t,e)=>{let s=[],r="";for(const n of Object.keys(e)){const o=e[n];if("@"===n[0])n.startsWith("@media")?s.push(v(n,b(t,o).join(""))):s.push(v(n,b("",o).join("")));else if("object"==typeof o){const e=n.split(",");for(const r of e)if(r.includes("&")){const e=r.replace(/&/g,t);s=s.concat(b(e,o))}else s=s.concat(b(t+" "+r,o))}else r+=n+":"+o+";"}return r&&s.unshift(v(t,r)),s},g=t=>{const e=(t=>{if(!p.has(t)){const e=JSON.stringify(t);let s=e.length,r=1989;for(;s;)r=13*r^e.charCodeAt(--s);p.set(t,"_torus"+(r>>>0))}return p.get(t)})(t);let s=0;if(!f.has(e)){m||(()=>{const t=document.createElement("style");t.setAttribute("data-torus",""),document.head.appendChild(t),m=t.sheet})();const r=b("."+e,t);for(const t of r)m.insertRule(t,s++);f.add(e)}return e},y=t=>class extends t{styles(){return{}}preprocess(t,e){return n(t)&&(t.attrs=t.attrs||{},t.attrs.class=i(t.attrs.class||[]),t.attrs.class.push(g(this.styles(e)))),t}};class x extends h{get itemClass(){return h}init(t,...e){this.store=t,this.items=new Map,this.filterFn=null,this.itemData=e,this.bind(this.store,()=>this.itemsChanged())}itemsChanged(){const t=this.store.summarize(),e=this.items;for(const s of e.keys())t.includes(s)||(e.get(s).remove(),e.delete(s));for(const s of t)e.has(s)||e.set(s,new this.itemClass(s,()=>this.store.remove(s),...this.itemData));let s=[...e.entries()];null!==this.filterFn&&(s=s.filter(t=>this.filterFn(t[0]))),s.sort((e,s)=>t.indexOf(e[0])-t.indexOf(s[0])),this.items=new Map(s),this.render()}filter(t){this.filterFn=t,this.itemsChanged()}unfilter(){this.filterFn=null,this.itemsChanged()}get components(){return[...this]}get nodes(){return this.components.map(t=>t.node)}[Symbol.iterator](){return this.items.values()}remove(){super.remove();for(const t of this.items.values())t.remove()}compose(){return{tag:"ul",children:this.nodes}}}class j{constructor(){this.handlers=new Set}summarize(){}emitEvent(){const t=this.summarize();for(const e of this.handlers)e(t)}addHandler(t){this.handlers.add(t),t(this.summarize())}removeHandler(t){this.handlers.delete(t)}}class w extends j{constructor(t,e={}){super(),n(t)&&(e=t,t=null),this.id=t,this.data=e}update(t){Object.assign(this.data,t),this.emitEvent()}get(t){return this.data[t]}summarize(){return Object.assign({id:this.id},this.data)}serialize(){return this.summarize()}}class O extends j{constructor(t=[]){super(),this.reset(t)}get recordClass(){return w}get comparator(){return null}create(t,e){return this.add(new this.recordClass(t,e))}add(t){return this.records.add(t),this.emitEvent(),t}remove(t){return this.records.delete(t),this.emitEvent(),t}[Symbol.iterator](){return this.records.values()}find(t){for(const e of this.records)if(e.id===t)return e;return null}reset(t){this.records=new Set(t),this.emitEvent()}summarize(){return[...this.records].map(t=>[this.comparator?this.comparator(t):null,t]).sort((t,e)=>t[0]<e[0]?-1:t[0]>e[0]?1:0).map(t=>t[1])}serialize(){return this.summarize().map(t=>t.serialize())}}const C=t=>{let e;const s=[];for(;null!==e;)if(e=/:\w+/.exec(t),e){const r=e[0];s.push(r.substr(1)),t=t.replace(r,"(.+)")}return[new RegExp(t),s]};const S={render:u,Component:h,Styled:y,StyledComponent:y(h),List:x,ListOf:t=>class extends x{get itemClass(){return t}},Record:w,Store:O,StoreOf:t=>class extends O{get recordClass(){return t}},Router:class extends j{constructor(t){super(),this.routes=Object.entries(t).map(([t,e])=>[t,...C(e)]),this.lastMatch=["",null],this._cb=()=>this.route(location.pathname),window.addEventListener("popstate",this._cb),this._cb()}summarize(){return this.lastMatch}go(t,{replace:e=!1}={}){window.location.pathname!==t&&(e?history.replaceState(null,document.title,t):history.pushState(null,document.title,t),this.route(t))}route(t){for(const[e,s,r]of this.routes){const n=s.exec(t);if(null!==n){const t={},s=n.slice(1);r.forEach((e,r)=>t[e]=s[r]),this.lastMatch=[e,t];break}}this.emitEvent()}remove(){window.removeEventListener("popstate",this._cb)}}};"object"==typeof window&&(window.Torus=S),t.exports&&(t.exports=S)},function(t,e,s){const r=t=>null!==t&&"object"==typeof t,n=(t,e)=>t.substr(0,t.length-e.length),o=(t,e)=>{let s=t[0];for(let r=1,n=e.length;r<=n;r++)s+=e[r-1]+t[r];return s};class i{constructor(t){this.idx=0,this.content=t,this.len=t.length}next(){const t=this.content[this.idx++];return void 0===t&&(this.idx=this.len),t}back(){this.idx--}readUpto(t){const e=this.content.substr(this.idx).indexOf(t);return this.toNext(e)}readUntil(t){const e=this.content.substr(this.idx).indexOf(t)+t.length;return this.toNext(e)}toNext(t){const e=this.content.substr(this.idx);if(-1===t)return this.idx=this.len,e;{const s=e.substr(0,t);return this.idx+=t,s}}clipEnd(t){return!!this.content.endsWith(t)&&(this.content=n(this.content,t),!0)}}const c=t=>{let e="";for(let s=0,r=t.length;s<r;s++)e+="-"===t[s]?t[++s].toUpperCase():t[s];return e},l=t=>{if("!"===(t=t.trim())[0])return{jdom:null,selfClosing:!0};if(!t.includes(" ")){const e=t.endsWith("/");return{jdom:{tag:e?n(t,"/"):t,attrs:{},events:{}},selfClosing:e}}const e=new i(t),s=e.clipEnd("/");let r="",o=!1,l=!1;const a=[];let d=0;const u=t=>{r=r.trim(),(""!==r||t)&&(a.push({type:d,value:r}),o=!1,r="")};for(let t=e.next();void 0!==t;t=e.next())switch(t){case"=":l?r+=t:(u(),o=!0,d=1);break;case" ":l?r+=t:o||(u(),d=0);break;case"\\":l&&(t=e.next(),r+=t);break;case'"':l?(l=!1,u(!0),d=0):1===d&&(l=!0);break;default:r+=t,o=!1}u();let h="";const f={},m={};h=a.shift().value;let p=null,v=a.shift();const b=()=>{p=v,v=a.shift()};for(;void 0!==v;){if(1===v.type){const t=p.value;let e=v.value.trim();if(t.startsWith("on"))m[t.substr(2)]=[e];else if("class"===t)""!==e&&(f[t]=e.split(" "));else if("style"===t){e.endsWith(";")&&(e=e.substr(0,e.length-1));const s={};for(const t of e.split(";")){const e=t.indexOf(":"),r=t.substr(0,e),n=t.substr(e+1);s[c(r.trim())]=n.trim()}f[t]=s}else f[t]=e;b()}else p&&(f[p.value]=!0);b()}return p&&0===p.type&&(f[p.value]=!0),{jdom:{tag:h,attrs:f,events:m},selfClosing:s}},a=t=>{const e=[];let s=null,r=!1;const n=()=>{r&&""===s.trim()||s&&e.push(s),s=null,r=!1},o=t=>{!1===r&&(n(),r=!0,s=""),s+=t};for(let e=t.next();void 0!==e;e=t.next())if("<"===e){if(n(),"/"===t.next()){t.readUntil(">");break}{t.back();const e=l(t.readUpto(">"));t.next(),s=e&&e.jdom,e.selfClosing||null===s||(s.children=a(t))}}else o("&"===e?(i=e+t.readUntil(";"),String.fromCodePoint(+/&#(\w+);/.exec(i)[1])):e);var i;return n(),e},d=new Map,u=/jdom_tpl_obj_\[(\d+)\]/,h=(t,e)=>{if((t=>"string"==typeof t&&t.includes("jdom_tpl_"))(t)){const s=u.exec(t),r=t.split(s[0]),n=s[1],o=h(r[1],e);let i=[];return""!==r[0]&&i.push(r[0]),Array.isArray(e[n])?i=i.concat(e[n]):i.push(e[n]),0!==o.length&&(i=i.concat(o)),i}return""!==t?[t]:[]},f=(t,e)=>{const s=[];for(const n of t)for(const t of h(n,e))r(t)&&v(t,e),s.push(t);const n=s[0],o=s[s.length-1];return"string"==typeof n&&""===n.trim()&&s.shift(),"string"==typeof o&&""===o.trim()&&s.pop(),s},m=(t,e)=>{if(t.length<14)return t;{const s=u.exec(t);if(null===s)return t;if(t.trim()===s[0])return e[s[1]];{const r=t.split(s[0]);return r[0]+e[s[1]]+m(r[1],e)}}},p=(t,e)=>{for(let s=0,r=t.length;s<r;s++){const r=t[s];"string"==typeof r?t[s]=m(r,e):Array.isArray(r)?p(r,e):v(r,e)}},v=(t,e)=>{for(const s of Object.keys(t)){const n=t[s];"string"==typeof n?t[s]=m(n,e):Array.isArray(n)?"children"===s?t.children=f(n,e):p(n,e):r(n)&&v(n,e)}},b=t=>{const e={};let s=0,r=["",""];const n=()=>{"string"==typeof r[1]?e[r[0].trim()]=r[1].trim():e[r[0].trim()]=r[1],r=["",""]};t.readUntil("{");for(let e=t.next();void 0!==e&&"}"!==e;e=t.next()){const o=r[0];switch(e){case'"':case"'":for(r[s]+=e+t.readUntil(e);r[s].endsWith("\\"+e);)r[s]+=t.readUntil(e);break;case":":""===o.trim()||o.includes("&")||o.includes("@")||o.includes(":")?r[s]+=e:s=1;break;case";":s=0,n();break;case"{":t.back(),r[1]=b(t),n();break;default:r[s]+=e}}return""!==r[0].trim()&&n(),e},g=new Map,y={jdom:(t,...e)=>{const s=t.join("jdom_tpl_joiner");try{if(!d.has(s)){const r=e.map((t,e)=>`jdom_tpl_obj_[${e}]`),n=new i(o(t.map(t=>t.replace(/\s+/g," ")),r)),c=a(n)[0],l=typeof c,u=JSON.stringify(c);d.set(s,t=>{if("string"===l)return m(c,t);if("object"===l){const e={},s=JSON.parse(u);return v(Object.assign(e,s),t),e}return null})}return d.get(s)(e)}catch(s){return console.error(`jdom parse error.\ncheck for mismatched brackets, tags, quotes.\n${o(t,e)}\n${s.stack||s}`),""}},css:(t,...e)=>{const s=o(t,e).trim();return g.has(s)||g.set(s,b(new i("{"+s+"}"))),g.get(s)}};"object"==typeof window&&Object.assign(window,y),t.exports&&(t.exports=y)}]);load = s => window

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
fetchAPI = (url, data, withRespJSON) => (() => { let json; let resp; resp = fetch(url, data); json = bind(resp, __Ink_String(`then`))(resp => bind(resp, __Ink_String(`json`))()); return bind(json, __Ink_String(`then`))(data => withRespJSON(data)) })();
fetchRepo = (userName, repoName, withRepo) => fetchAPI(f(__Ink_String(`/repo/{{ 0 }}/{{ 1 }}`), [userName, repoName]), {}, data => withRepo(data));
fetchContents = (userName, repoName, path, withContents) => fetchAPI(f(__Ink_String(`/repo/{{ 0 }}/{{ 1 }}/files{{ 2 }}`), [userName, repoName, path]), {}, data => withContents(data));
translateFileFromAPI = fileFromAPI => ({open__ink_qm__: false, name: (() => {let __ink_acc_trgt = __as_ink_string(fileFromAPI); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})(), path: (() => {let __ink_acc_trgt = __as_ink_string(fileFromAPI); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[path] || null : (__ink_acc_trgt.path !== undefined ? __ink_acc_trgt.path : null)})(), type: (() => {let __ink_acc_trgt = __as_ink_string(fileFromAPI); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})(), download: (() => {let __ink_acc_trgt = __as_ink_string(fileFromAPI); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`download_url`)] || null : (__ink_acc_trgt[__Ink_String(`download_url`)] !== undefined ? __ink_acc_trgt[__Ink_String(`download_url`)] : null)})(), content: null, children: null});
Link = (name, href) => ha(__Ink_String(`a`), [], {href: href, target: __Ink_String(`_blank`)}, [name]);
RepoPanel = () => (() => { let repo; return __ink_match(repo = (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repo] || null : (__ink_acc_trgt.repo !== undefined ? __ink_acc_trgt.repo : null)})(), [[() => (null), () => (h(__Ink_String(`div`), [__Ink_String(`repo-panel`), __Ink_String(`empty`)], [__Ink_String(`Loading repo...`)]))], [() => (__Ink_Empty), () => (h(__Ink_String(`div`), [__Ink_String(`repo-panel`)], [h(__Ink_String(`div`), [__Ink_String(`repo-info-line`)], [(() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[username] || null : (__ink_acc_trgt.username !== undefined ? __ink_acc_trgt.username : null)})()]), h(__Ink_String(`div`), [__Ink_String(`repo-info-line`)], [(() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[description] || null : (__ink_acc_trgt.description !== undefined ? __ink_acc_trgt.description : null)})()]), h(__Ink_String(`div`), [__Ink_String(`repo-info-line`)], [Link((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[homepage] || null : (__ink_acc_trgt.homepage !== undefined ? __ink_acc_trgt.homepage : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[homepage] || null : (__ink_acc_trgt.homepage !== undefined ? __ink_acc_trgt.homepage : null)})())]), h(__Ink_String(`div`), [__Ink_String(`repo-info-line`)], [(() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[language] || null : (__ink_acc_trgt.language !== undefined ? __ink_acc_trgt.language : null)})()])]))]]) })();
FileTreeNode = file => h(__Ink_String(`div`), [__Ink_String(`file-tree-node`)], [__ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})(), [[() => (__Ink_String(`dir`)), () => (hae(__Ink_String(`button`), [__Ink_String(`file-tree-node-toggle`)], {}, {click: evt => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(file); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(open__ink_qm__, __ink_negate((() => { return (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})() })())) : (__ink_assgn_trgt.open__ink_qm__) = __ink_negate((() => { return (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})() })()); return __ink_assgn_trgt})(); fetchFileChildren(file, render); return render() })()}, [__ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})(), [[() => (true), () => (__Ink_String(`v`))], [() => (__Ink_Empty), () => (__Ink_String(`>`))]])]))], [() => (__Ink_Empty), () => (null)]]), hae(__Ink_String(`button`), [__Ink_String(`file-tree-node-file`)], {}, {}, [(() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})()]), __ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})(), [[() => (false), () => (null)], [() => (__Ink_Empty), () => (__ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[children] || null : (__ink_acc_trgt.children !== undefined ? __ink_acc_trgt.children : null)})(), [[() => (null), () => (__Ink_String(`Loading files...`))], [() => (__Ink_Empty), () => (FileTreeList((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[children] || null : (__ink_acc_trgt.children !== undefined ? __ink_acc_trgt.children : null)})()))]]))]])]);
FileTreeList = files => h(__Ink_String(`ul`), [__Ink_String(`file-tree-list`)], (() => { let sortedFiles; sortedFiles = sortBy(clone(files), file => (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})()); return map(sortedFiles, file => h(__Ink_String(`li`), [__Ink_String(`file-tree-list-item`)], [FileTreeNode(file)])) })());
Sidebar = () => h(__Ink_String(`div`), [__Ink_String(`sidebar`)], [h(__Ink_String(`nav`), [], [ha(__Ink_String(`a`), [], {href: __Ink_String(`/`)}, [__Ink_String(`Ink codebase browser`)])]), RepoPanel(), FileTreeList((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})())]);
FilePanel = file => (() => { return null })();
FileArea = () => h(__Ink_String(`div`), [__Ink_String(`file-area`)], (() => { return map((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[openFiles] || null : (__ink_acc_trgt.openFiles !== undefined ? __ink_acc_trgt.openFiles : null)})(), file => FilePanel(file)) })());
root = bind(document, __Ink_String(`querySelector`))(__Ink_String(`#root`));
r = Renderer(root);
update = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[update] || null : (__ink_acc_trgt.update !== undefined ? __ink_acc_trgt.update : null)})();
State = {theme: __Ink_String(`light`), userName: __Ink_String(`thesephist`), repoName: __Ink_String(`september`), repo: null, files: [], openFiles: []};
refreshRepo = () => (() => { fetchRepo((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(), repo => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(repo, {owner: {username: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[login] || null : (__ink_acc_trgt.login !== undefined ? __ink_acc_trgt.login : null)})(), avatar: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`avatar_url`)] || null : (__ink_acc_trgt[__Ink_String(`avatar_url`)] !== undefined ? __ink_acc_trgt[__Ink_String(`avatar_url`)] : null)})(), url: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`html_url`)] || null : (__ink_acc_trgt[__Ink_String(`html_url`)] !== undefined ? __ink_acc_trgt[__Ink_String(`html_url`)] : null)})()}, description: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[description] || null : (__ink_acc_trgt.description !== undefined ? __ink_acc_trgt.description : null)})(), homepage: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[homepage] || null : (__ink_acc_trgt.homepage !== undefined ? __ink_acc_trgt.homepage : null)})(), language: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[language] || null : (__ink_acc_trgt.language !== undefined ? __ink_acc_trgt.language : null)})()}) : (__ink_assgn_trgt.repo) = {owner: {username: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[login] || null : (__ink_acc_trgt.login !== undefined ? __ink_acc_trgt.login : null)})(), avatar: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`avatar_url`)] || null : (__ink_acc_trgt[__Ink_String(`avatar_url`)] !== undefined ? __ink_acc_trgt[__Ink_String(`avatar_url`)] : null)})(), url: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`html_url`)] || null : (__ink_acc_trgt[__Ink_String(`html_url`)] !== undefined ? __ink_acc_trgt[__Ink_String(`html_url`)] : null)})()}, description: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[description] || null : (__ink_acc_trgt.description !== undefined ? __ink_acc_trgt.description : null)})(), homepage: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[homepage] || null : (__ink_acc_trgt.homepage !== undefined ? __ink_acc_trgt.homepage : null)})(), language: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[language] || null : (__ink_acc_trgt.language !== undefined ? __ink_acc_trgt.language : null)})()}; return __ink_assgn_trgt})(); return render() })()); return fetchContents((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(), __Ink_String(`/`), contents => (() => { return (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(files, map(contents, translateFileFromAPI)) : (__ink_assgn_trgt.files) = map(contents, translateFileFromAPI); return __ink_assgn_trgt})() })()) })();
fetchFileChildren = (file, cb) => (() => { return fetchContents((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(), __as_ink_string(__Ink_String(`/`) + (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[path] || null : (__ink_acc_trgt.path !== undefined ? __ink_acc_trgt.path : null)})()), contents => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(file); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(children, map(contents, translateFileFromAPI)) : (__ink_assgn_trgt.children) = map(contents, translateFileFromAPI); return __ink_assgn_trgt})(); return cb() })()) })();
render = () => update(h(__Ink_String(`div`), [__Ink_String(`app`)], [Sidebar(), FileArea()]));
refreshRepo();
render()

