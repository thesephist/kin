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
var hljs=function(){"use strict";var e={exports:{}};function t(e){
return e instanceof Map?e.clear=e.delete=e.set=()=>{
throw Error("map is read-only")}:e instanceof Set&&(e.add=e.clear=e.delete=()=>{
throw Error("set is read-only")
}),Object.freeze(e),Object.getOwnPropertyNames(e).forEach((n=>{var i=e[n]
;"object"!=typeof i||Object.isFrozen(i)||t(i)})),e}
e.exports=t,e.exports.default=t;var n=e.exports;class i{constructor(e){
void 0===e.data&&(e.data={}),this.data=e.data,this.isMatchIgnored=!1}
ignoreMatch(){this.isMatchIgnored=!0}}function r(e){
return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")
}function s(e,...t){const n=Object.create(null);for(const t in e)n[t]=e[t]
;return t.forEach((e=>{for(const t in e)n[t]=e[t]})),n}const o=e=>!!e.kind
;class a{constructor(e,t){
this.buffer="",this.classPrefix=t.classPrefix,e.walk(this)}addText(e){
this.buffer+=r(e)}openNode(e){if(!o(e))return;let t=e.kind
;t=e.sublanguage?"language-"+t:((e,{prefix:t})=>{if(e.includes(".")){
const n=e.split(".")
;return[`${t}${n.shift()}`,...n.map(((e,t)=>`${e}${"_".repeat(t+1)}`))].join(" ")
}return`${t}${e}`})(t,{prefix:this.classPrefix}),this.span(t)}closeNode(e){
o(e)&&(this.buffer+="</span>")}value(){return this.buffer}span(e){
this.buffer+=`<span class="${e}">`}}class l{constructor(){this.rootNode={
children:[]},this.stack=[this.rootNode]}get top(){
return this.stack[this.stack.length-1]}get root(){return this.rootNode}add(e){
this.top.children.push(e)}openNode(e){const t={kind:e,children:[]}
;this.add(t),this.stack.push(t)}closeNode(){
if(this.stack.length>1)return this.stack.pop()}closeAllNodes(){
for(;this.closeNode(););}toJSON(){return JSON.stringify(this.rootNode,null,4)}
walk(e){return this.constructor._walk(e,this.rootNode)}static _walk(e,t){
return"string"==typeof t?e.addText(t):t.children&&(e.openNode(t),
t.children.forEach((t=>this._walk(e,t))),e.closeNode(t)),e}static _collapse(e){
"string"!=typeof e&&e.children&&(e.children.every((e=>"string"==typeof e))?e.children=[e.children.join("")]:e.children.forEach((e=>{
l._collapse(e)})))}}class c extends l{constructor(e){super(),this.options=e}
addKeyword(e,t){""!==e&&(this.openNode(t),this.addText(e),this.closeNode())}
addText(e){""!==e&&this.add(e)}addSublanguage(e,t){const n=e.root
;n.kind=t,n.sublanguage=!0,this.add(n)}toHTML(){
return new a(this,this.options).value()}finalize(){return!0}}function g(e){
return e?"string"==typeof e?e:e.source:null}function d(...e){
return e.map((e=>g(e))).join("")}function u(...e){return"("+((e=>{
const t=e[e.length-1]
;return"object"==typeof t&&t.constructor===Object?(e.splice(e.length-1,1),t):{}
})(e).capture?"":"?:")+e.map((e=>g(e))).join("|")+")"}function h(e){
return RegExp(e.toString()+"|").exec("").length-1}
const f=/\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./
;function p(e,{joinWith:t}){let n=0;return e.map((e=>{n+=1;const t=n
;let i=g(e),r="";for(;i.length>0;){const e=f.exec(i);if(!e){r+=i;break}
r+=i.substring(0,e.index),
i=i.substring(e.index+e[0].length),"\\"===e[0][0]&&e[1]?r+="\\"+(Number(e[1])+t):(r+=e[0],
"("===e[0]&&n++)}return r})).map((e=>`(${e})`)).join(t)}
const b="[a-zA-Z]\\w*",m="[a-zA-Z_]\\w*",E="\\b\\d+(\\.\\d+)?",x="(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)",y="\\b(0b[01]+)",w={
begin:"\\\\[\\s\\S]",relevance:0},_={scope:"string",begin:"'",end:"'",
illegal:"\\n",contains:[w]},v={scope:"string",begin:'"',end:'"',illegal:"\\n",
contains:[w]},O=(e,t,n={})=>{const i=s({scope:"comment",begin:e,end:t,
contains:[]},n);i.contains.push({scope:"doctag",
begin:"[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
end:/(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,excludeBegin:!0,relevance:0})
;const r=u("I","a","is","so","us","to","at","if","in","it","on",/[A-Za-z]+['](d|ve|re|ll|t|s|n)/,/[A-Za-z]+[-][a-z]+/,/[A-Za-z][a-z]{2,}/)
;return i.contains.push({begin:d(/[ ]+/,"(",r,/[.]?[:]?([.][ ]|[ ])/,"){3}")}),i
},k=O("//","$"),N=O("/\\*","\\*/"),S=O("#","$");var M=Object.freeze({
__proto__:null,MATCH_NOTHING_RE:/\b\B/,IDENT_RE:b,UNDERSCORE_IDENT_RE:m,
NUMBER_RE:E,C_NUMBER_RE:x,BINARY_NUMBER_RE:y,
RE_STARTERS_RE:"!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",
SHEBANG:(e={})=>{const t=/^#![ ]*\//
;return e.binary&&(e.begin=d(t,/.*\b/,e.binary,/\b.*/)),s({scope:"meta",begin:t,
end:/$/,relevance:0,"on:begin":(e,t)=>{0!==e.index&&t.ignoreMatch()}},e)},
BACKSLASH_ESCAPE:w,APOS_STRING_MODE:_,QUOTE_STRING_MODE:v,PHRASAL_WORDS_MODE:{
begin:/\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
},COMMENT:O,C_LINE_COMMENT_MODE:k,C_BLOCK_COMMENT_MODE:N,HASH_COMMENT_MODE:S,
NUMBER_MODE:{scope:"number",begin:E,relevance:0},C_NUMBER_MODE:{scope:"number",
begin:x,relevance:0},BINARY_NUMBER_MODE:{scope:"number",begin:y,relevance:0},
REGEXP_MODE:{begin:/(?=\/[^/\n]*\/)/,contains:[{scope:"regexp",begin:/\//,
end:/\/[gimuy]*/,illegal:/\n/,contains:[w,{begin:/\[/,end:/\]/,relevance:0,
contains:[w]}]}]},TITLE_MODE:{scope:"title",begin:b,relevance:0},
UNDERSCORE_TITLE_MODE:{scope:"title",begin:m,relevance:0},METHOD_GUARD:{
begin:"\\.\\s*[a-zA-Z_]\\w*",relevance:0},END_SAME_AS_BEGIN:e=>Object.assign(e,{
"on:begin":(e,t)=>{t.data._beginMatch=e[1]},"on:end":(e,t)=>{
t.data._beginMatch!==e[1]&&t.ignoreMatch()}})});function R(e,t){
"."===e.input[e.index-1]&&t.ignoreMatch()}function j(e,t){
void 0!==e.className&&(e.scope=e.className,delete e.className)}function A(e,t){
t&&e.beginKeywords&&(e.begin="\\b("+e.beginKeywords.split(" ").join("|")+")(?!\\.)(?=\\b|\\s)",
e.__beforeBegin=R,e.keywords=e.keywords||e.beginKeywords,delete e.beginKeywords,
void 0===e.relevance&&(e.relevance=0))}function I(e,t){
Array.isArray(e.illegal)&&(e.illegal=u(...e.illegal))}function B(e,t){
if(e.match){
if(e.begin||e.end)throw Error("begin & end are not supported with match")
;e.begin=e.match,delete e.match}}function T(e,t){
void 0===e.relevance&&(e.relevance=1)}const L=(e,t)=>{if(!e.beforeMatch)return
;if(e.starts)throw Error("beforeMatch cannot be used with starts")
;const n=Object.assign({},e);Object.keys(e).forEach((t=>{delete e[t]
})),e.keywords=n.keywords,
e.begin=d(n.beforeMatch,d("(?=",n.begin,")")),e.starts={relevance:0,
contains:[Object.assign(n,{endsParent:!0})]},e.relevance=0,delete n.beforeMatch
},D=["of","and","for","in","not","or","if","then","parent","list","value"]
;function P(e,t,n="keyword"){const i=Object.create(null)
;return"string"==typeof e?r(n,e.split(" ")):Array.isArray(e)?r(n,e):Object.keys(e).forEach((n=>{
Object.assign(i,P(e[n],t,n))})),i;function r(e,n){
t&&(n=n.map((e=>e.toLowerCase()))),n.forEach((t=>{const n=t.split("|")
;i[n[0]]=[e,C(n[0],n[1])]}))}}function C(e,t){
return t?Number(t):(e=>D.includes(e.toLowerCase()))(e)?0:1}const H={},$=e=>{
console.error(e)},U=(e,...t)=>{console.log("WARN: "+e,...t)},z=(e,t)=>{
H[`${e}/${t}`]||(console.log(`Deprecated as of ${e}. ${t}`),H[`${e}/${t}`]=!0)
},K=Error();function W(e,t,{key:n}){let i=0;const r=e[n],s={},o={}
;for(let e=1;e<=t.length;e++)o[e+i]=r[e],s[e+i]=!0,i+=h(t[e-1])
;e[n]=o,e[n]._emit=s,e[n]._multi=!0}function X(e){(e=>{
e.scope&&"object"==typeof e.scope&&null!==e.scope&&(e.beginScope=e.scope,
delete e.scope)})(e),"string"==typeof e.beginScope&&(e.beginScope={
_wrap:e.beginScope}),"string"==typeof e.endScope&&(e.endScope={_wrap:e.endScope
}),(e=>{if(Array.isArray(e.begin)){
if(e.skip||e.excludeBegin||e.returnBegin)throw $("skip, excludeBegin, returnBegin not compatible with beginScope: {}"),
K
;if("object"!=typeof e.beginScope||null===e.beginScope)throw $("beginScope must be object"),
K;W(e,e.begin,{key:"beginScope"}),e.begin=p(e.begin,{joinWith:""})}})(e),(e=>{
if(Array.isArray(e.end)){
if(e.skip||e.excludeEnd||e.returnEnd)throw $("skip, excludeEnd, returnEnd not compatible with endScope: {}"),
K
;if("object"!=typeof e.endScope||null===e.endScope)throw $("endScope must be object"),
K;W(e,e.end,{key:"endScope"}),e.end=p(e.end,{joinWith:""})}})(e)}function G(e){
function t(t,n){return RegExp(g(t),"m"+(e.case_insensitive?"i":"")+(n?"g":""))}
class n{constructor(){
this.matchIndexes={},this.regexes=[],this.matchAt=1,this.position=0}
addRule(e,t){
t.position=this.position++,this.matchIndexes[this.matchAt]=t,this.regexes.push([t,e]),
this.matchAt+=h(e)+1}compile(){0===this.regexes.length&&(this.exec=()=>null)
;const e=this.regexes.map((e=>e[1]));this.matcherRe=t(p(e,{joinWith:"|"
}),!0),this.lastIndex=0}exec(e){this.matcherRe.lastIndex=this.lastIndex
;const t=this.matcherRe.exec(e);if(!t)return null
;const n=t.findIndex(((e,t)=>t>0&&void 0!==e)),i=this.matchIndexes[n]
;return t.splice(0,n),Object.assign(t,i)}}class i{constructor(){
this.rules=[],this.multiRegexes=[],
this.count=0,this.lastIndex=0,this.regexIndex=0}getMatcher(e){
if(this.multiRegexes[e])return this.multiRegexes[e];const t=new n
;return this.rules.slice(e).forEach((([e,n])=>t.addRule(e,n))),
t.compile(),this.multiRegexes[e]=t,t}resumingScanAtSamePosition(){
return 0!==this.regexIndex}considerAll(){this.regexIndex=0}addRule(e,t){
this.rules.push([e,t]),"begin"===t.type&&this.count++}exec(e){
const t=this.getMatcher(this.regexIndex);t.lastIndex=this.lastIndex
;let n=t.exec(e)
;if(this.resumingScanAtSamePosition())if(n&&n.index===this.lastIndex);else{
const t=this.getMatcher(0);t.lastIndex=this.lastIndex+1,n=t.exec(e)}
return n&&(this.regexIndex+=n.position+1,
this.regexIndex===this.count&&this.considerAll()),n}}
if(e.compilerExtensions||(e.compilerExtensions=[]),
e.contains&&e.contains.includes("self"))throw Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.")
;return e.classNameAliases=s(e.classNameAliases||{}),function n(r,o){const a=r
;if(r.isCompiled)return a
;[j,B,X,L].forEach((e=>e(r,o))),e.compilerExtensions.forEach((e=>e(r,o))),
r.__beforeBegin=null,[A,I,T].forEach((e=>e(r,o))),r.isCompiled=!0;let l=null
;return"object"==typeof r.keywords&&r.keywords.$pattern&&(r.keywords=Object.assign({},r.keywords),
l=r.keywords.$pattern,
delete r.keywords.$pattern),l=l||/\w+/,r.keywords&&(r.keywords=P(r.keywords,e.case_insensitive)),
a.keywordPatternRe=t(l,!0),
o&&(r.begin||(r.begin=/\B|\b/),a.beginRe=t(r.begin),r.end||r.endsWithParent||(r.end=/\B|\b/),
r.end&&(a.endRe=t(r.end)),
a.terminatorEnd=g(r.end)||"",r.endsWithParent&&o.terminatorEnd&&(a.terminatorEnd+=(r.end?"|":"")+o.terminatorEnd)),
r.illegal&&(a.illegalRe=t(r.illegal)),
r.contains||(r.contains=[]),r.contains=[].concat(...r.contains.map((e=>(e=>(e.variants&&!e.cachedVariants&&(e.cachedVariants=e.variants.map((t=>s(e,{
variants:null},t)))),e.cachedVariants?e.cachedVariants:Z(e)?s(e,{
starts:e.starts?s(e.starts):null
}):Object.isFrozen(e)?s(e):e))("self"===e?r:e)))),r.contains.forEach((e=>{n(e,a)
})),r.starts&&n(r.starts,o),a.matcher=(e=>{const t=new i
;return e.contains.forEach((e=>t.addRule(e.begin,{rule:e,type:"begin"
}))),e.terminatorEnd&&t.addRule(e.terminatorEnd,{type:"end"
}),e.illegal&&t.addRule(e.illegal,{type:"illegal"}),t})(a),a}(e)}function Z(e){
return!!e&&(e.endsWithParent||Z(e.starts))}const F=r,V=s,q=Symbol("nomatch")
;var J=(e=>{const t=Object.create(null),r=Object.create(null),s=[];let o=!0
;const a="Could not find the language '{}', did you forget to load/include a language module?",l={
disableAutodetect:!0,name:"Plain text",contains:[]};let g={
ignoreUnescapedHTML:!1,noHighlightRe:/^(no-?highlight)$/i,
languageDetectRe:/\blang(?:uage)?-([\w-]+)\b/i,classPrefix:"hljs-",
cssSelector:"pre code",languages:null,__emitter:c};function d(e){
return g.noHighlightRe.test(e)}function u(e,t,n,i){let r="",s=""
;"object"==typeof t?(r=e,
n=t.ignoreIllegals,s=t.language,i=void 0):(z("10.7.0","highlight(lang, code, ...args) has been deprecated."),
z("10.7.0","Please use highlight(code, options) instead.\nhttps://github.com/highlightjs/highlight.js/issues/2277"),
s=e,r=t),void 0===n&&(n=!0);const o={code:r,language:s};w("before:highlight",o)
;const a=o.result?o.result:h(o.language,o.code,n,i)
;return a.code=o.code,w("after:highlight",a),a}function h(e,n,r,s){
const l=Object.create(null);function c(){if(!k.keywords)return void S.addText(M)
;let e=0;k.keywordPatternRe.lastIndex=0;let t=k.keywordPatternRe.exec(M),n=""
;for(;t;){n+=M.substring(e,t.index)
;const r=_.case_insensitive?t[0].toLowerCase():t[0],s=(i=r,k.keywords[i]);if(s){
const[e,i]=s
;if(S.addText(n),n="",l[r]=(l[r]||0)+1,l[r]<=7&&(R+=i),e.startsWith("_"))n+=t[0];else{
const n=_.classNameAliases[e]||e;S.addKeyword(t[0],n)}}else n+=t[0]
;e=k.keywordPatternRe.lastIndex,t=k.keywordPatternRe.exec(M)}var i
;n+=M.substr(e),S.addText(n)}function d(){null!=k.subLanguage?(()=>{
if(""===M)return;let e=null;if("string"==typeof k.subLanguage){
if(!t[k.subLanguage])return void S.addText(M)
;e=h(k.subLanguage,M,!0,N[k.subLanguage]),N[k.subLanguage]=e._top
}else e=f(M,k.subLanguage.length?k.subLanguage:null)
;k.relevance>0&&(R+=e.relevance),S.addSublanguage(e._emitter,e.language)
})():c(),M=""}function u(e,t){let n=1;for(;void 0!==t[n];){if(!e._emit[n]){n++
;continue}const i=_.classNameAliases[e[n]]||e[n],r=t[n]
;i?S.addKeyword(r,i):(M=r,c(),M=""),n++}}function p(e,t){
return e.scope&&"string"==typeof e.scope&&S.openNode(_.classNameAliases[e.scope]||e.scope),
e.beginScope&&(e.beginScope._wrap?(S.addKeyword(M,_.classNameAliases[e.beginScope._wrap]||e.beginScope._wrap),
M=""):e.beginScope._multi&&(u(e.beginScope,t),M="")),k=Object.create(e,{parent:{
value:k}}),k}function b(e,t,n){let r=((e,t)=>{const n=e&&e.exec(t)
;return n&&0===n.index})(e.endRe,n);if(r){if(e["on:end"]){const n=new i(e)
;e["on:end"](t,n),n.isMatchIgnored&&(r=!1)}if(r){
for(;e.endsParent&&e.parent;)e=e.parent;return e}}
if(e.endsWithParent)return b(e.parent,t,n)}function m(e){
return 0===k.matcher.regexIndex?(M+=e[0],1):(I=!0,0)}function x(e){
const t=e[0],i=n.substr(e.index),r=b(k,e,i);if(!r)return q;const s=k
;k.endScope&&k.endScope._wrap?(d(),
S.addKeyword(t,k.endScope._wrap)):k.endScope&&k.endScope._multi?(d(),
u(k.endScope,e)):s.skip?M+=t:(s.returnEnd||s.excludeEnd||(M+=t),
d(),s.excludeEnd&&(M=t));do{
k.scope&&!k.isMultiClass&&S.closeNode(),k.skip||k.subLanguage||(R+=k.relevance),
k=k.parent}while(k!==r.parent)
;return r.starts&&p(r.starts,e),s.returnEnd?0:t.length}let y={};function w(t,s){
const a=s&&s[0];if(M+=t,null==a)return d(),0
;if("begin"===y.type&&"end"===s.type&&y.index===s.index&&""===a){
if(M+=n.slice(s.index,s.index+1),!o){const t=Error(`0 width match regex (${e})`)
;throw t.languageName=e,t.badRule=y.rule,t}return 1}
if(y=s,"begin"===s.type)return(e=>{
const t=e[0],n=e.rule,r=new i(n),s=[n.__beforeBegin,n["on:begin"]]
;for(const n of s)if(n&&(n(e,r),r.isMatchIgnored))return m(t)
;return n.skip?M+=t:(n.excludeBegin&&(M+=t),
d(),n.returnBegin||n.excludeBegin||(M=t)),p(n,e),n.returnBegin?0:t.length})(s)
;if("illegal"===s.type&&!r){
const e=Error('Illegal lexeme "'+a+'" for mode "'+(k.scope||"<unnamed>")+'"')
;throw e.mode=k,e}if("end"===s.type){const e=x(s);if(e!==q)return e}
if("illegal"===s.type&&""===a)return 1
;if(A>1e5&&A>3*s.index)throw Error("potential infinite loop, way more iterations than matches")
;return M+=a,a.length}const _=E(e)
;if(!_)throw $(a.replace("{}",e)),Error('Unknown language: "'+e+'"')
;const v=G(_);let O="",k=s||v;const N={},S=new g.__emitter(g);(()=>{const e=[]
;for(let t=k;t!==_;t=t.parent)t.scope&&e.unshift(t.scope)
;e.forEach((e=>S.openNode(e)))})();let M="",R=0,j=0,A=0,I=!1;try{
for(k.matcher.considerAll();;){
A++,I?I=!1:k.matcher.considerAll(),k.matcher.lastIndex=j
;const e=k.matcher.exec(n);if(!e)break;const t=w(n.substring(j,e.index),e)
;j=e.index+t}return w(n.substr(j)),S.closeAllNodes(),S.finalize(),O=S.toHTML(),{
language:e,value:O,relevance:R,illegal:!1,_emitter:S,_top:k}}catch(t){
if(t.message&&t.message.includes("Illegal"))return{language:e,value:F(n),
illegal:!0,relevance:0,_illegalBy:{message:t.message,index:j,
context:n.slice(j-100,j+100),mode:t.mode,resultSoFar:O},_emitter:S};if(o)return{
language:e,value:F(n),illegal:!1,relevance:0,errorRaised:t,_emitter:S,_top:k}
;throw t}}function f(e,n){n=n||g.languages||Object.keys(t);const i=(e=>{
const t={value:F(e),illegal:!1,relevance:0,_top:l,_emitter:new g.__emitter(g)}
;return t._emitter.addText(e),t})(e),r=n.filter(E).filter(y).map((t=>h(t,e,!1)))
;r.unshift(i);const s=r.sort(((e,t)=>{
if(e.relevance!==t.relevance)return t.relevance-e.relevance
;if(e.language&&t.language){if(E(e.language).supersetOf===t.language)return 1
;if(E(t.language).supersetOf===e.language)return-1}return 0})),[o,a]=s,c=o
;return c.secondBest=a,c}function p(e){let t=null;const n=(e=>{
let t=e.className+" ";t+=e.parentNode?e.parentNode.className:""
;const n=g.languageDetectRe.exec(t);if(n){const t=E(n[1])
;return t||(U(a.replace("{}",n[1])),
U("Falling back to no-highlight mode for this block.",e)),t?n[1]:"no-highlight"}
return t.split(/\s+/).find((e=>d(e)||E(e)))})(e);if(d(n))return
;w("before:highlightElement",{el:e,language:n
}),!g.ignoreUnescapedHTML&&e.children.length>0&&(console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."),
console.warn("https://github.com/highlightjs/highlight.js/issues/2886"),
console.warn(e)),t=e;const i=t.textContent,s=n?u(i,{language:n,ignoreIllegals:!0
}):f(i);e.innerHTML=s.value,((e,t,n)=>{const i=t&&r[t]||n
;e.classList.add("hljs"),e.classList.add("language-"+i)
})(e,n,s.language),e.result={language:s.language,re:s.relevance,
relevance:s.relevance},s.secondBest&&(e.secondBest={
language:s.secondBest.language,relevance:s.secondBest.relevance
}),w("after:highlightElement",{el:e,result:s,text:i})}let b=!1;function m(){
"loading"!==document.readyState?document.querySelectorAll(g.cssSelector).forEach(p):b=!0
}function E(e){return e=(e||"").toLowerCase(),t[e]||t[r[e]]}
function x(e,{languageName:t}){"string"==typeof e&&(e=[e]),e.forEach((e=>{
r[e.toLowerCase()]=t}))}function y(e){const t=E(e)
;return t&&!t.disableAutodetect}function w(e,t){const n=e;s.forEach((e=>{
e[n]&&e[n](t)}))}
"undefined"!=typeof window&&window.addEventListener&&window.addEventListener("DOMContentLoaded",(()=>{
b&&m()}),!1),Object.assign(e,{highlight:u,highlightAuto:f,highlightAll:m,
highlightElement:p,
highlightBlock:e=>(z("10.7.0","highlightBlock will be removed entirely in v12.0"),
z("10.7.0","Please use highlightElement now."),p(e)),configure:e=>{g=V(g,e)},
initHighlighting:()=>{
m(),z("10.6.0","initHighlighting() deprecated.  Use highlightAll() now.")},
initHighlightingOnLoad:()=>{
m(),z("10.6.0","initHighlightingOnLoad() deprecated.  Use highlightAll() now.")
},registerLanguage:(n,i)=>{let r=null;try{r=i(e)}catch(e){
if($("Language definition for '{}' could not be registered.".replace("{}",n)),
!o)throw e;$(e),r=l}
r.name||(r.name=n),t[n]=r,r.rawDefinition=i.bind(null,e),r.aliases&&x(r.aliases,{
languageName:n})},unregisterLanguage:e=>{delete t[e]
;for(const t of Object.keys(r))r[t]===e&&delete r[t]},
listLanguages:()=>Object.keys(t),getLanguage:E,registerAliases:x,
autoDetection:y,inherit:V,addPlugin:e=>{(e=>{
e["before:highlightBlock"]&&!e["before:highlightElement"]&&(e["before:highlightElement"]=t=>{
e["before:highlightBlock"](Object.assign({block:t.el},t))
}),e["after:highlightBlock"]&&!e["after:highlightElement"]&&(e["after:highlightElement"]=t=>{
e["after:highlightBlock"](Object.assign({block:t.el},t))})})(e),s.push(e)}
}),e.debugMode=()=>{o=!1},e.safeMode=()=>{o=!0},e.versionString="11.0.1"
;for(const e in M)"object"==typeof M[e]&&n(M[e]);return Object.assign(e,M),e
})({}),Y=Object.freeze({__proto__:null});const Q=J
;for(const e of Object.keys(Y)){const t=e.replace("grmr_","")
;Q.registerLanguage(t,Y[e])}return Q}()
;"object"==typeof exports&&"undefined"!=typeof module&&(module.exports=hljs);hljs.registerLanguage("nginx",(()=>{"use strict";function e(e){
return n("(?=",e,")")}function n(...e){return e.map((e=>{
return(n=e)?"string"==typeof n?n:n.source:null;var n})).join("")}return a=>{
const s={className:"variable",variants:[{begin:/\$\d+/},{begin:/\$\{\w+\}/},{
begin:n(/[$@]/,a.UNDERSCORE_IDENT_RE)}]},i={endsWithParent:!0,keywords:{
$pattern:/[a-z_]{2,}|\/dev\/poll/,
literal:["on","off","yes","no","true","false","none","blocked","debug","info","notice","warn","error","crit","select","break","last","permanent","redirect","kqueue","rtsig","epoll","poll","/dev/poll"]
},relevance:0,illegal:"=>",contains:[a.HASH_COMMENT_MODE,{className:"string",
contains:[a.BACKSLASH_ESCAPE,s],variants:[{begin:/"/,end:/"/},{begin:/'/,end:/'/
}]},{begin:"([a-z]+):/",end:"\\s",endsWithParent:!0,excludeEnd:!0,contains:[s]
},{className:"regexp",contains:[a.BACKSLASH_ESCAPE,s],variants:[{begin:"\\s\\^",
end:"\\s|\\{|;",returnEnd:!0},{begin:"~\\*?\\s+",end:"\\s|\\{|;",returnEnd:!0},{
begin:"\\*(\\.[a-z\\-]+)+"},{begin:"([a-z\\-]+\\.)+\\*"}]},{className:"number",
begin:"\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}(:\\d{1,5})?\\b"},{
className:"number",begin:"\\b\\d+[kKmMgGdshdwy]?\\b",relevance:0},s]};return{
name:"Nginx config",aliases:["nginxconf"],contains:[a.HASH_COMMENT_MODE,{
beginKeywords:"upstream location",end:/;|\{/,contains:i.contains,keywords:{
section:"upstream location"}},{className:"section",
begin:n(a.UNDERSCORE_IDENT_RE+e(/\s+\{/)),relevance:0},{
begin:e(a.UNDERSCORE_IDENT_RE+"\\s"),end:";|\\{",contains:[{
className:"attribute",begin:a.UNDERSCORE_IDENT_RE,starts:i}],relevance:0}],
illegal:"[^\\s\\}\\{]"}}})());hljs.registerLanguage("lisp",(()=>{"use strict";return e=>{
var n="[a-zA-Z_\\-+\\*\\/<=>&#][a-zA-Z0-9_\\-+*\\/<=>&#!]*",a="\\|[^]*?\\|",i="(-|\\+)?\\d+(\\.\\d+|\\/\\d+)?((d|e|f|l|s|D|E|F|L|S)(\\+|-)?\\d+)?",s={
className:"literal",begin:"\\b(t{1}|nil)\\b"},l={className:"number",variants:[{
begin:i,relevance:0},{begin:"#(b|B)[0-1]+(/[0-1]+)?"},{
begin:"#(o|O)[0-7]+(/[0-7]+)?"},{begin:"#(x|X)[0-9a-fA-F]+(/[0-9a-fA-F]+)?"},{
begin:"#(c|C)\\("+i+" +"+i,end:"\\)"}]},b=e.inherit(e.QUOTE_STRING_MODE,{
illegal:null}),g=e.COMMENT(";","$",{relevance:0}),r={begin:"\\*",end:"\\*"},t={
className:"symbol",begin:"[:&]"+n},c={begin:n,relevance:0},d={begin:a},o={
contains:[l,b,r,t,{begin:"\\(",end:"\\)",contains:["self",s,b,l,c]},c],
variants:[{begin:"['`]\\(",end:"\\)"},{begin:"\\(quote ",end:"\\)",keywords:{
name:"quote"}},{begin:"'"+a}]},v={variants:[{begin:"'"+n},{
begin:"#'"+n+"(::"+n+")*"}]},m={begin:"\\(\\s*",end:"\\)"},u={endsWithParent:!0,
relevance:0};return m.contains=[{className:"name",variants:[{begin:n,relevance:0
},{begin:a}]},u],u.contains=[o,v,m,s,l,b,g,r,t,d,c],{name:"Lisp",illegal:/\S/,
contains:[l,e.SHEBANG(),s,b,g,o,v,m,c]}}})());hljs.registerLanguage("xml",(()=>{"use strict";function e(e){
return e?"string"==typeof e?e:e.source:null}function n(e){return a("(?=",e,")")}
function a(...n){return n.map((n=>e(n))).join("")}function s(...n){
return"("+((e=>{const n=e[e.length-1]
;return"object"==typeof n&&n.constructor===Object?(e.splice(e.length-1,1),n):{}
})(n).capture?"":"?:")+n.map((n=>e(n))).join("|")+")"}return e=>{
const t=a(/[A-Z_]/,a("(?:",/[A-Z0-9_.-]*:/,")?"),/[A-Z0-9_.-]*/),i={
className:"symbol",begin:/&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/},c={begin:/\s/,
contains:[{className:"keyword",begin:/#?[a-z_][a-z1-9_-]+/,illegal:/\n/}]
},r=e.inherit(c,{begin:/\(/,end:/\)/}),l=e.inherit(e.APOS_STRING_MODE,{
className:"string"}),g=e.inherit(e.QUOTE_STRING_MODE,{className:"string"}),m={
endsWithParent:!0,illegal:/</,relevance:0,contains:[{className:"attr",
begin:/[A-Za-z0-9._:-]+/,relevance:0},{begin:/=\s*/,relevance:0,contains:[{
className:"string",endsParent:!0,variants:[{begin:/"/,end:/"/,contains:[i]},{
begin:/'/,end:/'/,contains:[i]},{begin:/[^\s"'=<>`]+/}]}]}]};return{
name:"HTML, XML",
aliases:["html","xhtml","rss","atom","xjb","xsd","xsl","plist","wsf","svg"],
case_insensitive:!0,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,
relevance:10,contains:[c,g,l,r,{begin:/\[/,end:/\]/,contains:[{className:"meta",
begin:/<![a-z]/,end:/>/,contains:[c,r,g,l]}]}]},e.COMMENT(/<!--/,/-->/,{
relevance:10}),{begin:/<!\[CDATA\[/,end:/\]\]>/,relevance:10},i,{
className:"meta",begin:/<\?xml/,end:/\?>/,relevance:10},{className:"tag",
begin:/<style(?=\s|>)/,end:/>/,keywords:{name:"style"},contains:[m],starts:{
end:/<\/style>/,returnEnd:!0,subLanguage:["css","xml"]}},{className:"tag",
begin:/<script(?=\s|>)/,end:/>/,keywords:{name:"script"},contains:[m],starts:{
end:/<\/script>/,returnEnd:!0,subLanguage:["javascript","handlebars","xml"]}},{
className:"tag",begin:/<>|<\/>/},{className:"tag",
begin:a(/</,n(a(t,s(/\/>/,/>/,/\s/)))),end:/\/?>/,contains:[{className:"name",
begin:t,relevance:0,starts:m}]},{className:"tag",begin:a(/<\//,n(a(t,/>/))),
contains:[{className:"name",begin:t,relevance:0},{begin:/>/,relevance:0,
endsParent:!0}]}]}}})());hljs.registerLanguage("php",(()=>{"use strict";return e=>{const r={
className:"variable",
begin:"\\$+[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*(?![A-Za-z0-9])(?![$])"},t={
className:"meta",variants:[{begin:/<\?php/,relevance:10},{begin:/<\?[=]?/},{
begin:/\?>/}]},a={className:"subst",variants:[{begin:/\$\w+/},{begin:/\{\$/,
end:/\}/}]},n=e.inherit(e.APOS_STRING_MODE,{illegal:null
}),i=e.inherit(e.QUOTE_STRING_MODE,{illegal:null,
contains:e.QUOTE_STRING_MODE.contains.concat(a)}),o=e.END_SAME_AS_BEGIN({
begin:/<<<[ \t]*(\w+)\n/,end:/[ \t]*(\w+)\b/,
contains:e.QUOTE_STRING_MODE.contains.concat(a)}),l={className:"string",
contains:[e.BACKSLASH_ESCAPE,t],variants:[e.inherit(n,{begin:"b'",end:"'"
}),e.inherit(i,{begin:'b"',end:'"'}),i,n,o]},s={className:"number",variants:[{
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
keywords:"__halt_compiler"}),t,{className:"keyword",begin:/\$this\b/},r,{
begin:/(::|->)+[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/},{className:"function",
relevance:0,beginKeywords:"fn function",end:/[;{]/,excludeEnd:!0,
illegal:"[$%\\[]",contains:[{beginKeywords:"use"},e.UNDERSCORE_TITLE_MODE,{
begin:"=>",endsParent:!0},{className:"params",begin:"\\(",end:"\\)",
excludeBegin:!0,excludeEnd:!0,keywords:c,
contains:["self",r,e.C_BLOCK_COMMENT_MODE,l,s]}]},{className:"class",variants:[{
beginKeywords:"enum",illegal:/[($"]/},{beginKeywords:"class interface trait",
illegal:/[:($"]/}],relevance:0,end:/\{/,excludeEnd:!0,contains:[{
beginKeywords:"extends implements"},e.UNDERSCORE_TITLE_MODE]},{
beginKeywords:"namespace",relevance:0,end:";",illegal:/[.']/,
contains:[e.UNDERSCORE_TITLE_MODE]},{beginKeywords:"use",relevance:0,end:";",
contains:[e.UNDERSCORE_TITLE_MODE]},l,s]}}})());hljs.registerLanguage("php-template",(()=>{"use strict";return n=>({
name:"PHP template",subLanguage:"xml",contains:[{begin:/<\?(php|=)?/,end:/\?>/,
subLanguage:"php",contains:[{begin:"/\\*",end:"\\*/",skip:!0},{begin:'b"',
end:'"',skip:!0},{begin:"b'",end:"'",skip:!0},n.inherit(n.APOS_STRING_MODE,{
illegal:null,className:null,contains:null,skip:!0
}),n.inherit(n.QUOTE_STRING_MODE,{illegal:null,className:null,contains:null,
skip:!0})]}]})})());hljs.registerLanguage("less",(()=>{"use strict"
;const e=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","p","q","quote","samp","section","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video"],t=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"],i=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"],o=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"],n=["align-content","align-items","align-self","animation","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-timing-function","auto","backface-visibility","background","background-attachment","background-clip","background-color","background-image","background-origin","background-position","background-repeat","background-size","border","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-decoration-break","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","clear","clip","clip-path","color","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","content","counter-increment","counter-reset","cursor","direction","display","empty-cells","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-size","font-size-adjust","font-smoothing","font-stretch","font-style","font-variant","font-variant-ligatures","font-variation-settings","font-weight","height","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","inherit","initial","justify-content","left","letter-spacing","line-height","list-style","list-style-image","list-style-position","list-style-type","margin","margin-bottom","margin-left","margin-right","margin-top","marks","mask","max-height","max-width","min-height","min-width","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-wrap","overflow-x","overflow-y","padding","padding-bottom","padding-left","padding-right","padding-top","page-break-after","page-break-before","page-break-inside","perspective","perspective-origin","pointer-events","position","quotes","resize","right","src","tab-size","table-layout","text-align","text-align-last","text-decoration","text-decoration-color","text-decoration-line","text-decoration-style","text-indent","text-overflow","text-rendering","text-shadow","text-transform","text-underline-position","top","transform","transform-origin","transform-style","transition","transition-delay","transition-duration","transition-property","transition-timing-function","unicode-bidi","vertical-align","visibility","white-space","widows","width","word-break","word-spacing","word-wrap","z-index"].reverse(),r=i.concat(o)
;return a=>{const s=(e=>({IMPORTANT:{scope:"meta",begin:"!important"},HEXCOLOR:{
scope:"number",begin:"#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})"},
ATTRIBUTE_SELECTOR_MODE:{scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",
contains:[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{
scope:"number",
begin:e.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
relevance:0}}))(a),l=r,d="([\\w-]+|@\\{[\\w-]+\\})",c=[],g=[],b=e=>({
className:"string",begin:"~?"+e+".*?"+e}),m=(e,t,i)=>({className:e,begin:t,
relevance:i}),p={$pattern:/[a-z-]+/,keyword:"and or not only",
attribute:t.join(" ")},u={begin:"\\(",end:"\\)",contains:g,keywords:p,
relevance:0}
;g.push(a.C_LINE_COMMENT_MODE,a.C_BLOCK_COMMENT_MODE,b("'"),b('"'),s.CSS_NUMBER_MODE,{
begin:"(url|data-uri)\\(",starts:{className:"string",end:"[\\)\\n]",
excludeEnd:!0}
},s.HEXCOLOR,u,m("variable","@@?[\\w-]+",10),m("variable","@\\{[\\w-]+\\}"),m("built_in","~?`[^`]*?`"),{
className:"attribute",begin:"[\\w-]+\\s*:",end:":",returnBegin:!0,excludeEnd:!0
},s.IMPORTANT);const h=g.concat({begin:/\{/,end:/\}/,contains:c}),f={
beginKeywords:"when",endsWithParent:!0,contains:[{beginKeywords:"and not"
}].concat(g)},w={begin:d+"\\s*:",returnBegin:!0,end:/[;}]/,relevance:0,
contains:[{begin:/-(webkit|moz|ms|o)-/},{className:"attribute",
begin:"\\b("+n.join("|")+")\\b",end:/(?=:)/,starts:{endsWithParent:!0,
illegal:"[<=$]",relevance:0,contains:g}}]},v={className:"keyword",
begin:"@(import|media|charset|font-face|(-[a-z]+-)?keyframes|supports|document|namespace|page|viewport|host)\\b",
starts:{end:"[;{}]",keywords:p,returnEnd:!0,contains:g,relevance:0}},y={
className:"variable",variants:[{begin:"@[\\w-]+\\s*:",relevance:15},{
begin:"@[\\w-]+"}],starts:{end:"[;}]",returnEnd:!0,contains:h}},k={variants:[{
begin:"[\\.#:&\\[>]",end:"[;{}]"},{begin:d,end:/\{/}],returnBegin:!0,
returnEnd:!0,illegal:"[<='$\"]",relevance:0,
contains:[a.C_LINE_COMMENT_MODE,a.C_BLOCK_COMMENT_MODE,f,m("keyword","all\\b"),m("variable","@\\{[\\w-]+\\}"),{
begin:"\\b("+e.join("|")+")\\b",className:"selector-tag"
},m("selector-tag",d+"%?",0),m("selector-id","#"+d),m("selector-class","\\."+d,0),m("selector-tag","&",0),s.ATTRIBUTE_SELECTOR_MODE,{
className:"selector-pseudo",begin:":("+i.join("|")+")"},{
className:"selector-pseudo",begin:"::("+o.join("|")+")"},{begin:/\(/,end:/\)/,
relevance:0,contains:h},{begin:"!important"}]},E={
begin:`[\\w-]+:(:)?(${l.join("|")})`,returnBegin:!0,contains:[k]}
;return c.push(a.C_LINE_COMMENT_MODE,a.C_BLOCK_COMMENT_MODE,v,y,E,w,k),{
name:"Less",case_insensitive:!0,illegal:"[=>'/<($\"]",contains:c}}})());hljs.registerLanguage("clojure",(()=>{"use strict";return e=>{
const t="a-zA-Z_\\-!.?+*=<>&#'",n="["+t+"]["+t+"0-9/;:]*",r="def defonce defprotocol defstruct defmulti defmethod defn- defn defmacro deftype defrecord",a={
$pattern:n,
built_in:r+" cond apply if-not if-let if not not= =|0 <|0 >|0 <=|0 >=|0 ==|0 +|0 /|0 *|0 -|0 rem quot neg? pos? delay? symbol? keyword? true? false? integer? empty? coll? list? set? ifn? fn? associative? sequential? sorted? counted? reversible? number? decimal? class? distinct? isa? float? rational? reduced? ratio? odd? even? char? seq? vector? string? map? nil? contains? zero? instance? not-every? not-any? libspec? -> ->> .. . inc compare do dotimes mapcat take remove take-while drop letfn drop-last take-last drop-while while intern condp case reduced cycle split-at split-with repeat replicate iterate range merge zipmap declare line-seq sort comparator sort-by dorun doall nthnext nthrest partition eval doseq await await-for let agent atom send send-off release-pending-sends add-watch mapv filterv remove-watch agent-error restart-agent set-error-handler error-handler set-error-mode! error-mode shutdown-agents quote var fn loop recur throw try monitor-enter monitor-exit macroexpand macroexpand-1 for dosync and or when when-not when-let comp juxt partial sequence memoize constantly complement identity assert peek pop doto proxy first rest cons cast coll last butlast sigs reify second ffirst fnext nfirst nnext meta with-meta ns in-ns create-ns import refer keys select-keys vals key val rseq name namespace promise into transient persistent! conj! assoc! dissoc! pop! disj! use class type num float double short byte boolean bigint biginteger bigdec print-method print-dup throw-if printf format load compile get-in update-in pr pr-on newline flush read slurp read-line subvec with-open memfn time re-find re-groups rand-int rand mod locking assert-valid-fdecl alias resolve ref deref refset swap! reset! set-validator! compare-and-set! alter-meta! reset-meta! commute get-validator alter ref-set ref-history-count ref-min-history ref-max-history ensure sync io! new next conj set! to-array future future-call into-array aset gen-class reduce map filter find empty hash-map hash-set sorted-map sorted-map-by sorted-set sorted-set-by vec vector seq flatten reverse assoc dissoc list disj get union difference intersection extend extend-type extend-protocol int nth delay count concat chunk chunk-buffer chunk-append chunk-first chunk-rest max min dec unchecked-inc-int unchecked-inc unchecked-dec-inc unchecked-dec unchecked-negate unchecked-add-int unchecked-add unchecked-subtract-int unchecked-subtract chunk-next chunk-cons chunked-seq? prn vary-meta lazy-seq spread list* str find-keyword keyword symbol gensym force rationalize"
},s={begin:n,relevance:0},o={className:"number",begin:"[-+]?\\d+(\\.\\d+)?",
relevance:0},i=e.inherit(e.QUOTE_STRING_MODE,{illegal:null
}),c=e.COMMENT(";","$",{relevance:0}),d={className:"literal",
begin:/\b(true|false|nil)\b/},l={begin:"[\\[\\{]",end:"[\\]\\}]",relevance:0
},m={className:"comment",begin:"\\^"+n},p=e.COMMENT("\\^\\{","\\}"),u={
className:"symbol",begin:"[:]{1,2}"+n},f={begin:"\\(",end:"\\)"},h={
endsWithParent:!0,relevance:0},y={keywords:a,className:"name",begin:n,
relevance:0,starts:h},g=[f,i,m,p,c,u,l,o,d,s],b={beginKeywords:r,keywords:{
$pattern:n,keyword:r},end:'(\\[|#|\\d|"|:|\\{|\\)|\\(|$)',contains:[{
className:"title",begin:n,relevance:0,excludeEnd:!0,endsParent:!0}].concat(g)}
;return f.contains=[e.COMMENT("comment",""),b,y,h],
h.contains=g,l.contains=g,p.contains=[l],{name:"Clojure",aliases:["clj"],
illegal:/\S/,contains:[f,i,m,p,c,u,l,o,d]}}})());hljs.registerLanguage("scss",(()=>{"use strict"
;const e=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","p","q","quote","samp","section","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video"],t=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"],i=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"],r=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"],o=["align-content","align-items","align-self","animation","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-timing-function","auto","backface-visibility","background","background-attachment","background-clip","background-color","background-image","background-origin","background-position","background-repeat","background-size","border","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-decoration-break","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","clear","clip","clip-path","color","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","content","counter-increment","counter-reset","cursor","direction","display","empty-cells","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-size","font-size-adjust","font-smoothing","font-stretch","font-style","font-variant","font-variant-ligatures","font-variation-settings","font-weight","height","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","inherit","initial","justify-content","left","letter-spacing","line-height","list-style","list-style-image","list-style-position","list-style-type","margin","margin-bottom","margin-left","margin-right","margin-top","marks","mask","max-height","max-width","min-height","min-width","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-wrap","overflow-x","overflow-y","padding","padding-bottom","padding-left","padding-right","padding-top","page-break-after","page-break-before","page-break-inside","perspective","perspective-origin","pointer-events","position","quotes","resize","right","src","tab-size","table-layout","text-align","text-align-last","text-decoration","text-decoration-color","text-decoration-line","text-decoration-style","text-indent","text-overflow","text-rendering","text-shadow","text-transform","text-underline-position","top","transform","transform-origin","transform-style","transition","transition-delay","transition-duration","transition-property","transition-timing-function","unicode-bidi","vertical-align","visibility","white-space","widows","width","word-break","word-spacing","word-wrap","z-index"].reverse()
;return a=>{const n=(e=>({IMPORTANT:{scope:"meta",begin:"!important"},HEXCOLOR:{
scope:"number",begin:"#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})"},
ATTRIBUTE_SELECTOR_MODE:{scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",
contains:[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{
scope:"number",
begin:e.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
relevance:0}}))(a),l=r,s=i,d="@[a-z-]+",c={className:"variable",
begin:"(\\$[a-zA-Z-][a-zA-Z0-9_-]*)\\b"};return{name:"SCSS",case_insensitive:!0,
illegal:"[=/|']",contains:[a.C_LINE_COMMENT_MODE,a.C_BLOCK_COMMENT_MODE,{
className:"selector-id",begin:"#[A-Za-z0-9_-]+",relevance:0},{
className:"selector-class",begin:"\\.[A-Za-z0-9_-]+",relevance:0
},n.ATTRIBUTE_SELECTOR_MODE,{className:"selector-tag",
begin:"\\b("+e.join("|")+")\\b",relevance:0},{className:"selector-pseudo",
begin:":("+s.join("|")+")"},{className:"selector-pseudo",
begin:"::("+l.join("|")+")"},c,{begin:/\(/,end:/\)/,contains:[n.CSS_NUMBER_MODE]
},{className:"attribute",begin:"\\b("+o.join("|")+")\\b"},{
begin:"\\b(whitespace|wait|w-resize|visible|vertical-text|vertical-ideographic|uppercase|upper-roman|upper-alpha|underline|transparent|top|thin|thick|text|text-top|text-bottom|tb-rl|table-header-group|table-footer-group|sw-resize|super|strict|static|square|solid|small-caps|separate|se-resize|scroll|s-resize|rtl|row-resize|ridge|right|repeat|repeat-y|repeat-x|relative|progress|pointer|overline|outside|outset|oblique|nowrap|not-allowed|normal|none|nw-resize|no-repeat|no-drop|newspaper|ne-resize|n-resize|move|middle|medium|ltr|lr-tb|lowercase|lower-roman|lower-alpha|loose|list-item|line|line-through|line-edge|lighter|left|keep-all|justify|italic|inter-word|inter-ideograph|inside|inset|inline|inline-block|inherit|inactive|ideograph-space|ideograph-parenthesis|ideograph-numeric|ideograph-alpha|horizontal|hidden|help|hand|groove|fixed|ellipsis|e-resize|double|dotted|distribute|distribute-space|distribute-letter|distribute-all-lines|disc|disabled|default|decimal|dashed|crosshair|collapse|col-resize|circle|char|center|capitalize|break-word|break-all|bottom|both|bolder|bold|block|bidi-override|below|baseline|auto|always|all-scroll|absolute|table|table-cell)\\b"
},{begin:":",end:";",
contains:[c,n.HEXCOLOR,n.CSS_NUMBER_MODE,a.QUOTE_STRING_MODE,a.APOS_STRING_MODE,n.IMPORTANT]
},{begin:"@(page|font-face)",keywords:{$pattern:d,keyword:"@page @font-face"}},{
begin:"@",end:"[{;]",returnBegin:!0,keywords:{$pattern:/[a-z-]+/,
keyword:"and or not only",attribute:t.join(" ")},contains:[{begin:d,
className:"keyword"},{begin:/[a-z-]+(?=:)/,className:"attribute"
},c,a.QUOTE_STRING_MODE,a.APOS_STRING_MODE,n.HEXCOLOR,n.CSS_NUMBER_MODE]}]}}
})());hljs.registerLanguage("crystal",(()=>{"use strict";return e=>{
const n="(_?[ui](8|16|32|64|128))?",i="[a-zA-Z_]\\w*[!?=]?|[-+~]@|<<|>>|[=!]~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~|]|//|//=|&[-+*]=?|&\\*\\*|\\[\\][=?]?",s="[A-Za-z_]\\w*(::\\w+)*(\\?|!)?",a={
$pattern:"[a-zA-Z_]\\w*[!?=]?",
keyword:"abstract alias annotation as as? asm begin break case class def do else elsif end ensure enum extend for fun if include instance_sizeof is_a? lib macro module next nil? of out pointerof private protected rescue responds_to? return require select self sizeof struct super then type typeof union uninitialized unless until verbatim when while with yield __DIR__ __END_LINE__ __FILE__ __LINE__",
literal:"false nil true"},t={className:"subst",begin:/#\{/,end:/\}/,keywords:a
},c={className:"template-variable",variants:[{begin:"\\{\\{",end:"\\}\\}"},{
begin:"\\{%",end:"%\\}"}],keywords:a};function r(e,n){const i=[{begin:e,end:n}]
;return i[0].contains=i,i}const l={className:"string",
contains:[e.BACKSLASH_ESCAPE,t],variants:[{begin:/'/,end:/'/},{begin:/"/,end:/"/
},{begin:/`/,end:/`/},{begin:"%[Qwi]?\\(",end:"\\)",contains:r("\\(","\\)")},{
begin:"%[Qwi]?\\[",end:"\\]",contains:r("\\[","\\]")},{begin:"%[Qwi]?\\{",
end:/\}/,contains:r(/\{/,/\}/)},{begin:"%[Qwi]?<",end:">",contains:r("<",">")},{
begin:"%[Qwi]?\\|",end:"\\|"},{begin:/<<-\w+$/,end:/^\s*\w+$/}],relevance:0},b={
className:"string",variants:[{begin:"%q\\(",end:"\\)",contains:r("\\(","\\)")},{
begin:"%q\\[",end:"\\]",contains:r("\\[","\\]")},{begin:"%q\\{",end:/\}/,
contains:r(/\{/,/\}/)},{begin:"%q<",end:">",contains:r("<",">")},{begin:"%q\\|",
end:"\\|"},{begin:/<<-'\w+'$/,end:/^\s*\w+$/}],relevance:0},o={
begin:"(?!%\\})("+e.RE_STARTERS_RE+"|\\n|\\b(case|if|select|unless|until|when|while)\\b)\\s*",
keywords:"case if select unless until when while",contains:[{className:"regexp",
contains:[e.BACKSLASH_ESCAPE,t],variants:[{begin:"//[a-z]*",relevance:0},{
begin:"/(?!\\/)",end:"/[a-z]*"}]}],relevance:0},g=[c,l,b,{className:"regexp",
contains:[e.BACKSLASH_ESCAPE,t],variants:[{begin:"%r\\(",end:"\\)",
contains:r("\\(","\\)")},{begin:"%r\\[",end:"\\]",contains:r("\\[","\\]")},{
begin:"%r\\{",end:/\}/,contains:r(/\{/,/\}/)},{begin:"%r<",end:">",
contains:r("<",">")},{begin:"%r\\|",end:"\\|"}],relevance:0},o,{
className:"meta",begin:"@\\[",end:"\\]",
contains:[e.inherit(e.QUOTE_STRING_MODE,{className:"string"})]},{
className:"variable",
begin:"(\\$\\W)|((\\$|@@?)(\\w+))(?=[^@$?])(?![A-Za-z])(?![@$?'])"
},e.HASH_COMMENT_MODE,{className:"class",beginKeywords:"class module struct",
end:"$|;",illegal:/=/,contains:[e.HASH_COMMENT_MODE,e.inherit(e.TITLE_MODE,{
begin:s}),{begin:"<"}]},{className:"class",beginKeywords:"lib enum union",
end:"$|;",illegal:/=/,contains:[e.HASH_COMMENT_MODE,e.inherit(e.TITLE_MODE,{
begin:s})]},{beginKeywords:"annotation",end:"$|;",illegal:/=/,
contains:[e.HASH_COMMENT_MODE,e.inherit(e.TITLE_MODE,{begin:s})],relevance:2},{
className:"function",beginKeywords:"def",end:/\B\b/,
contains:[e.inherit(e.TITLE_MODE,{begin:i,endsParent:!0})]},{
className:"function",beginKeywords:"fun macro",end:/\B\b/,
contains:[e.inherit(e.TITLE_MODE,{begin:i,endsParent:!0})],relevance:2},{
className:"symbol",begin:e.UNDERSCORE_IDENT_RE+"(!|\\?)?:",relevance:0},{
className:"symbol",begin:":",contains:[l,{begin:i}],relevance:0},{
className:"number",variants:[{begin:"\\b0b([01_]+)"+n},{begin:"\\b0o([0-7_]+)"+n
},{begin:"\\b0x([A-Fa-f0-9_]+)"+n},{
begin:"\\b([1-9][0-9_]*[0-9]|[0-9])(\\.[0-9][0-9_]*)?([eE]_?[-+]?[0-9_]*)?(_?f(32|64))?(?!_)"
},{begin:"\\b([1-9][0-9_]*|0)"+n}],relevance:0}]
;return t.contains=g,c.contains=g.slice(1),{name:"Crystal",aliases:["cr"],
keywords:a,contains:g}}})());hljs.registerLanguage("sql",(()=>{"use strict";function e(e){
return e?"string"==typeof e?e:e.source:null}function r(...r){
return r.map((r=>e(r))).join("")}function t(...r){return"("+((e=>{
const r=e[e.length-1]
;return"object"==typeof r&&r.constructor===Object?(e.splice(e.length-1,1),r):{}
})(r).capture?"":"?:")+r.map((r=>e(r))).join("|")+")"}return e=>{
const n=e.COMMENT("--","$"),a=["true","false","unknown"],i=["bigint","binary","blob","boolean","char","character","clob","date","dec","decfloat","decimal","float","int","integer","interval","nchar","nclob","national","numeric","real","row","smallint","time","timestamp","varchar","varying","varbinary"],s=["abs","acos","array_agg","asin","atan","avg","cast","ceil","ceiling","coalesce","corr","cos","cosh","count","covar_pop","covar_samp","cume_dist","dense_rank","deref","element","exp","extract","first_value","floor","json_array","json_arrayagg","json_exists","json_object","json_objectagg","json_query","json_table","json_table_primitive","json_value","lag","last_value","lead","listagg","ln","log","log10","lower","max","min","mod","nth_value","ntile","nullif","percent_rank","percentile_cont","percentile_disc","position","position_regex","power","rank","regr_avgx","regr_avgy","regr_count","regr_intercept","regr_r2","regr_slope","regr_sxx","regr_sxy","regr_syy","row_number","sin","sinh","sqrt","stddev_pop","stddev_samp","substring","substring_regex","sum","tan","tanh","translate","translate_regex","treat","trim","trim_array","unnest","upper","value_of","var_pop","var_samp","width_bucket"],o=["create table","insert into","primary key","foreign key","not null","alter table","add constraint","grouping sets","on overflow","character set","respect nulls","ignore nulls","nulls first","nulls last","depth first","breadth first"],c=s,l=["abs","acos","all","allocate","alter","and","any","are","array","array_agg","array_max_cardinality","as","asensitive","asin","asymmetric","at","atan","atomic","authorization","avg","begin","begin_frame","begin_partition","between","bigint","binary","blob","boolean","both","by","call","called","cardinality","cascaded","case","cast","ceil","ceiling","char","char_length","character","character_length","check","classifier","clob","close","coalesce","collate","collect","column","commit","condition","connect","constraint","contains","convert","copy","corr","corresponding","cos","cosh","count","covar_pop","covar_samp","create","cross","cube","cume_dist","current","current_catalog","current_date","current_default_transform_group","current_path","current_role","current_row","current_schema","current_time","current_timestamp","current_path","current_role","current_transform_group_for_type","current_user","cursor","cycle","date","day","deallocate","dec","decimal","decfloat","declare","default","define","delete","dense_rank","deref","describe","deterministic","disconnect","distinct","double","drop","dynamic","each","element","else","empty","end","end_frame","end_partition","end-exec","equals","escape","every","except","exec","execute","exists","exp","external","extract","false","fetch","filter","first_value","float","floor","for","foreign","frame_row","free","from","full","function","fusion","get","global","grant","group","grouping","groups","having","hold","hour","identity","in","indicator","initial","inner","inout","insensitive","insert","int","integer","intersect","intersection","interval","into","is","join","json_array","json_arrayagg","json_exists","json_object","json_objectagg","json_query","json_table","json_table_primitive","json_value","lag","language","large","last_value","lateral","lead","leading","left","like","like_regex","listagg","ln","local","localtime","localtimestamp","log","log10","lower","match","match_number","match_recognize","matches","max","member","merge","method","min","minute","mod","modifies","module","month","multiset","national","natural","nchar","nclob","new","no","none","normalize","not","nth_value","ntile","null","nullif","numeric","octet_length","occurrences_regex","of","offset","old","omit","on","one","only","open","or","order","out","outer","over","overlaps","overlay","parameter","partition","pattern","per","percent","percent_rank","percentile_cont","percentile_disc","period","portion","position","position_regex","power","precedes","precision","prepare","primary","procedure","ptf","range","rank","reads","real","recursive","ref","references","referencing","regr_avgx","regr_avgy","regr_count","regr_intercept","regr_r2","regr_slope","regr_sxx","regr_sxy","regr_syy","release","result","return","returns","revoke","right","rollback","rollup","row","row_number","rows","running","savepoint","scope","scroll","search","second","seek","select","sensitive","session_user","set","show","similar","sin","sinh","skip","smallint","some","specific","specifictype","sql","sqlexception","sqlstate","sqlwarning","sqrt","start","static","stddev_pop","stddev_samp","submultiset","subset","substring","substring_regex","succeeds","sum","symmetric","system","system_time","system_user","table","tablesample","tan","tanh","then","time","timestamp","timezone_hour","timezone_minute","to","trailing","translate","translate_regex","translation","treat","trigger","trim","trim_array","true","truncate","uescape","union","unique","unknown","unnest","update","upper","user","using","value","values","value_of","var_pop","var_samp","varbinary","varchar","varying","versioning","when","whenever","where","width_bucket","window","with","within","without","year","add","asc","collation","desc","final","first","last","view"].filter((e=>!s.includes(e))),u={
begin:r(/\b/,t(...c),/\s*\(/),relevance:0,keywords:{built_in:c}};return{
name:"SQL",case_insensitive:!0,illegal:/[{}]|<\//,keywords:{
$pattern:/\b[\w\.]+/,keyword:((e,{exceptions:r,when:t}={})=>{const n=t
;return r=r||[],e.map((e=>e.match(/\|\d+$/)||r.includes(e)?e:n(e)?e+"|0":e))
})(l,{when:e=>e.length<3}),literal:a,type:i,
built_in:["current_catalog","current_date","current_default_transform_group","current_path","current_role","current_schema","current_transform_group_for_type","current_user","session_user","system_time","system_user","current_time","localtime","current_timestamp","localtimestamp"]
},contains:[{begin:t(...o),relevance:0,keywords:{$pattern:/[\w\.]+/,
keyword:l.concat(o),literal:a,type:i}},{className:"type",
begin:t("double precision","large object","with timezone","without timezone")
},u,{className:"variable",begin:/@[a-z0-9]+/},{className:"string",variants:[{
begin:/'/,end:/'/,contains:[{begin:/''/}]}]},{begin:/"/,end:/"/,contains:[{
begin:/""/}]},e.C_NUMBER_MODE,e.C_BLOCK_COMMENT_MODE,n,{className:"operator",
begin:/[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,relevance:0}]}}})());hljs.registerLanguage("css",(()=>{"use strict"
;const e=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","p","q","quote","samp","section","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video"],t=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"],i=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"],o=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"],r=["align-content","align-items","align-self","animation","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-timing-function","auto","backface-visibility","background","background-attachment","background-clip","background-color","background-image","background-origin","background-position","background-repeat","background-size","border","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-decoration-break","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","clear","clip","clip-path","color","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","content","counter-increment","counter-reset","cursor","direction","display","empty-cells","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-size","font-size-adjust","font-smoothing","font-stretch","font-style","font-variant","font-variant-ligatures","font-variation-settings","font-weight","height","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","inherit","initial","justify-content","left","letter-spacing","line-height","list-style","list-style-image","list-style-position","list-style-type","margin","margin-bottom","margin-left","margin-right","margin-top","marks","mask","max-height","max-width","min-height","min-width","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-wrap","overflow-x","overflow-y","padding","padding-bottom","padding-left","padding-right","padding-top","page-break-after","page-break-before","page-break-inside","perspective","perspective-origin","pointer-events","position","quotes","resize","right","src","tab-size","table-layout","text-align","text-align-last","text-decoration","text-decoration-color","text-decoration-line","text-decoration-style","text-indent","text-overflow","text-rendering","text-shadow","text-transform","text-underline-position","top","transform","transform-origin","transform-style","transition","transition-delay","transition-duration","transition-property","transition-timing-function","unicode-bidi","vertical-align","visibility","white-space","widows","width","word-break","word-spacing","word-wrap","z-index"].reverse()
;return n=>{const a=(e=>({IMPORTANT:{scope:"meta",begin:"!important"},HEXCOLOR:{
scope:"number",begin:"#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})"},
ATTRIBUTE_SELECTOR_MODE:{scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",
contains:[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{
scope:"number",
begin:e.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
relevance:0}}))(n),l=[n.APOS_STRING_MODE,n.QUOTE_STRING_MODE];return{name:"CSS",
case_insensitive:!0,illegal:/[=|'\$]/,keywords:{keyframePosition:"from to"},
classNameAliases:{keyframePosition:"selector-tag"},
contains:[n.C_BLOCK_COMMENT_MODE,{begin:/-(webkit|moz|ms|o)-(?=[a-z])/
},a.CSS_NUMBER_MODE,{className:"selector-id",begin:/#[A-Za-z0-9_-]+/,relevance:0
},{className:"selector-class",begin:"\\.[a-zA-Z-][a-zA-Z0-9_-]*",relevance:0
},a.ATTRIBUTE_SELECTOR_MODE,{className:"selector-pseudo",variants:[{
begin:":("+i.join("|")+")"},{begin:"::("+o.join("|")+")"}]},{
className:"attribute",begin:"\\b("+r.join("|")+")\\b"},{begin:":",end:"[;}]",
contains:[a.HEXCOLOR,a.IMPORTANT,a.CSS_NUMBER_MODE,...l,{
begin:/(url|data-uri)\(/,end:/\)/,relevance:0,keywords:{built_in:"url data-uri"
},contains:[{className:"string",begin:/[^)]/,endsWithParent:!0,excludeEnd:!0}]
},{className:"built_in",begin:/[\w-]+(?=\()/}]},{
begin:(s=/@/,((...e)=>e.map((e=>(e=>e?"string"==typeof e?e:e.source:null)(e))).join(""))("(?=",s,")")),
end:"[{;]",relevance:0,illegal:/:/,contains:[{className:"keyword",
begin:/@-?\w[\w]*(-\w+)*/},{begin:/\s/,endsWithParent:!0,excludeEnd:!0,
relevance:0,keywords:{$pattern:/[a-z-]+/,keyword:"and or not only",
attribute:t.join(" ")},contains:[{begin:/[a-z-]+(?=:)/,className:"attribute"
},...l,a.CSS_NUMBER_MODE]}]},{className:"selector-tag",
begin:"\\b("+e.join("|")+")\\b"}]};var s}})());hljs.registerLanguage("objectivec",(()=>{"use strict";return e=>{
const n=/[a-zA-Z@][a-zA-Z0-9_]*/,_={$pattern:n,
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
begin:"("+_.keyword.join("|")+")\\b",end:/(\{|$)/,excludeEnd:!0,keywords:_,
contains:[e.UNDERSCORE_TITLE_MODE]},{begin:"\\."+e.UNDERSCORE_IDENT_RE,
relevance:0}]}}})());hljs.registerLanguage("makefile",(()=>{"use strict";return e=>{const i={
className:"variable",variants:[{begin:"\\$\\("+e.UNDERSCORE_IDENT_RE+"\\)",
contains:[e.BACKSLASH_ESCAPE]},{begin:/\$[@%<?\^\+\*]/}]},a={className:"string",
begin:/"/,end:/"/,contains:[e.BACKSLASH_ESCAPE,i]},n={className:"variable",
begin:/\$\([\w-]+\s/,end:/\)/,keywords:{
built_in:"subst patsubst strip findstring filter filter-out sort word wordlist firstword lastword dir notdir suffix basename addsuffix addprefix join wildcard realpath abspath error warning shell origin flavor foreach if or and call eval file value"
},contains:[i]},s={begin:"^"+e.UNDERSCORE_IDENT_RE+"\\s*(?=[:+?]?=)"},r={
className:"section",begin:/^[^\s]+:/,end:/$/,contains:[i]};return{
name:"Makefile",aliases:["mk","mak","make"],keywords:{$pattern:/[\w-]+/,
keyword:"define endef undefine ifdef ifndef ifeq ifneq else endif include -include sinclude override export unexport private vpath"
},contains:[e.HASH_COMMENT_MODE,i,a,n,s,{className:"meta",begin:/^\.PHONY:/,
end:/$/,keywords:{$pattern:/[\.\w]+/,keyword:".PHONY"}},r]}}})());hljs.registerLanguage("python",(()=>{"use strict";function e(e){
return e?"string"==typeof e?e:e.source:null}function n(...n){
return n.map((n=>e(n))).join("")}const t="[a-zA-Z]\\w*",a=(t,a,s={})=>{
const i=((e,...n)=>{const t=Object.create(null);for(const n in e)t[n]=e[n]
;return n.forEach((e=>{for(const n in e)t[n]=e[n]})),t})({scope:"comment",
begin:t,end:a,contains:[]},s);i.contains.push({scope:"doctag",
begin:"[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
end:/(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,excludeBegin:!0,relevance:0})
;const r=function(...n){return"("+((e=>{const n=e[e.length-1]
;return"object"==typeof n&&n.constructor===Object?(e.splice(e.length-1,1),n):{}
})(n).capture?"":"?:")+n.map((n=>e(n))).join("|")+")"
}("I","a","is","so","us","to","at","if","in","it","on",/[A-Za-z]+['](d|ve|re|ll|t|s|n)/,/[A-Za-z]+[-][a-z]+/,/[A-Za-z][a-z]{2,}/)
;return i.contains.push({begin:n(/[ ]+/,"(",r,/[.]?[:]?([.][ ]|[ ])/,"){3}")}),i
};return a("//","$"),a("/\\*","\\*/"),a("#","$"),e=>{const a={
$pattern:/[A-Za-z]\w+|__\w+__/,
keyword:["and","as","assert","async","await","break","class","continue","def","del","elif","else","except","finally","for","from","global","if","import","in","is","lambda","nonlocal|10","not","or","pass","raise","return","try","while","with","yield"],
built_in:["__import__","abs","all","any","ascii","bin","bool","breakpoint","bytearray","bytes","callable","chr","classmethod","compile","complex","delattr","dict","dir","divmod","enumerate","eval","exec","filter","float","format","frozenset","getattr","globals","hasattr","hash","help","hex","id","input","int","isinstance","issubclass","iter","len","list","locals","map","max","memoryview","min","next","object","oct","open","ord","pow","print","property","range","repr","reversed","round","set","setattr","slice","sorted","staticmethod","str","sum","super","tuple","type","vars","zip"],
literal:["__debug__","Ellipsis","False","None","NotImplemented","True"],
type:["Any","Callable","Coroutine","Dict","List","Literal","Generic","Optional","Sequence","Set","Tuple","Type","Union"]
},s={className:"meta",begin:/^(>>>|\.\.\.) /},i={className:"subst",begin:/\{/,
end:/\}/,keywords:a,illegal:/#/},r={begin:/\{\{/,relevance:0},o={
className:"string",contains:[e.BACKSLASH_ESCAPE],variants:[{
begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,end:/'''/,
contains:[e.BACKSLASH_ESCAPE,s],relevance:10},{
begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,end:/"""/,
contains:[e.BACKSLASH_ESCAPE,s],relevance:10},{
begin:/([fF][rR]|[rR][fF]|[fF])'''/,end:/'''/,
contains:[e.BACKSLASH_ESCAPE,s,r,i]},{begin:/([fF][rR]|[rR][fF]|[fF])"""/,
end:/"""/,contains:[e.BACKSLASH_ESCAPE,s,r,i]},{begin:/([uU]|[rR])'/,end:/'/,
relevance:10},{begin:/([uU]|[rR])"/,end:/"/,relevance:10},{
begin:/([bB]|[bB][rR]|[rR][bB])'/,end:/'/},{begin:/([bB]|[bB][rR]|[rR][bB])"/,
end:/"/},{begin:/([fF][rR]|[rR][fF]|[fF])'/,end:/'/,
contains:[e.BACKSLASH_ESCAPE,r,i]},{begin:/([fF][rR]|[rR][fF]|[fF])"/,end:/"/,
contains:[e.BACKSLASH_ESCAPE,r,i]},e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]
},l="[0-9](_?[0-9])*",c=`(\\b(${l}))?\\.(${l})|\\b(${l})\\.`,b={
className:"number",relevance:0,variants:[{
begin:`(\\b(${l})|(${c}))[eE][+-]?(${l})[jJ]?\\b`},{begin:`(${c})[jJ]?`},{
begin:"\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?\\b"},{
begin:"\\b0[bB](_?[01])+[lL]?\\b"},{begin:"\\b0[oO](_?[0-7])+[lL]?\\b"},{
begin:"\\b0[xX](_?[0-9a-fA-F])+[lL]?\\b"},{begin:`\\b(${l})[jJ]\\b`}]},d={
className:"comment",begin:(g=/# type:/,n("(?=",g,")")),end:/$/,keywords:a,
contains:[{begin:/# type:/},{begin:/#/,end:/\b\B/,endsWithParent:!0}]};var g
;const p={className:"params",variants:[{className:"",begin:/\(\s*\)/,skip:!0},{
begin:/\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:a,
contains:["self",s,b,o,e.HASH_COMMENT_MODE]}]};return i.contains=[o,b,s],{
name:"Python",aliases:["py","gyp","ipython"],keywords:a,
illegal:/(<\/|->|\?)|=>/,contains:[s,b,{begin:/\bself\b/},{beginKeywords:"if",
relevance:0},o,d,e.HASH_COMMENT_MODE,{match:[/def/,/\s+/,t],scope:{1:"keyword",
3:"title.function"},contains:[p]},{variants:[{
match:[/class/,/\s+/,t,/\s*/,/\(\s*/,t,/\s*\)/]},{match:[/class/,/\s+/,t]}],
scope:{1:"keyword",3:"title.class",6:"title.class.inherited"}},{
className:"meta",begin:/^[\t ]*@/,end:/(?=#)|$/,contains:[b,p,o]}]}}})());hljs.registerLanguage("ruby",(()=>{"use strict";function e(e){
return n("(?=",e,")")}function n(...e){return e.map((e=>{
return(n=e)?"string"==typeof n?n:n.source:null;var n})).join("")}return a=>{
const i="([a-zA-Z_]\\w*[!?=]?|[-+~]@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?)",s={
keyword:"and then defined module in return redo if BEGIN retry end for self when next until do begin unless END rescue else break undef not super class case require yield alias while ensure elsif or include attr_reader attr_writer attr_accessor __FILE__",
built_in:"proc lambda",literal:"true false nil"},r={className:"doctag",
begin:"@[A-Za-z]+"},b={begin:"#<",end:">"},c=[a.COMMENT("#","$",{contains:[r]
}),a.COMMENT("^=begin","^=end",{contains:[r],relevance:10
}),a.COMMENT("^__END__","\\n$")],t={className:"subst",begin:/#\{/,end:/\}/,
keywords:s},g={className:"string",contains:[a.BACKSLASH_ESCAPE,t],variants:[{
begin:/'/,end:/'/},{begin:/"/,end:/"/},{begin:/`/,end:/`/},{begin:/%[qQwWx]?\(/,
end:/\)/},{begin:/%[qQwWx]?\[/,end:/\]/},{begin:/%[qQwWx]?\{/,end:/\}/},{
begin:/%[qQwWx]?</,end:/>/},{begin:/%[qQwWx]?\//,end:/\//},{begin:/%[qQwWx]?%/,
end:/%/},{begin:/%[qQwWx]?-/,end:/-/},{begin:/%[qQwWx]?\|/,end:/\|/},{
begin:/\B\?(\\\d{1,3})/},{begin:/\B\?(\\x[A-Fa-f0-9]{1,2})/},{
begin:/\B\?(\\u\{?[A-Fa-f0-9]{1,6}\}?)/},{
begin:/\B\?(\\M-\\C-|\\M-\\c|\\c\\M-|\\M-|\\C-\\M-)[\x20-\x7e]/},{
begin:/\B\?\\(c|C-)[\x20-\x7e]/},{begin:/\B\?\\?\S/},{
begin:n(/<<[-~]?'?/,e(/(\w+)(?=\W)[^\n]*\n(?:[^\n]*\n)*?\s*\1\b/)),
contains:[a.END_SAME_AS_BEGIN({begin:/(\w+)/,end:/(\w+)/,
contains:[a.BACKSLASH_ESCAPE,t]})]}]},d="[0-9](_?[0-9])*",l={className:"number",
relevance:0,variants:[{
begin:`\\b([1-9](_?[0-9])*|0)(\\.(${d}))?([eE][+-]?(${d})|r)?i?\\b`},{
begin:"\\b0[dD][0-9](_?[0-9])*r?i?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*r?i?\\b"
},{begin:"\\b0[oO][0-7](_?[0-7])*r?i?\\b"},{
begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*r?i?\\b"},{
begin:"\\b0(_?[0-7])+r?i?\\b"}]},o={className:"params",begin:"\\(",end:"\\)",
endsParent:!0,keywords:s},_=[g,{className:"class",beginKeywords:"class module",
end:"$|;",illegal:/=/,contains:[a.inherit(a.TITLE_MODE,{
begin:"[A-Za-z_]\\w*(::\\w+)*(\\?|!)?"}),{begin:"<\\s*",contains:[{
begin:"("+a.IDENT_RE+"::)?"+a.IDENT_RE,relevance:0}]}].concat(c)},{
className:"function",begin:n(/def\s+/,e(i+"\\s*(\\(|;|$)")),relevance:0,
keywords:"def",end:"$|;",contains:[a.inherit(a.TITLE_MODE,{begin:i
}),o].concat(c)},{begin:a.IDENT_RE+"::"},{className:"symbol",
begin:a.UNDERSCORE_IDENT_RE+"(!|\\?)?:",relevance:0},{className:"symbol",
begin:":(?!\\s)",contains:[g,{begin:i}],relevance:0},l,{className:"variable",
begin:"(\\$\\W)|((\\$|@@?)(\\w+))(?=[^@$?])(?![A-Za-z])(?![@$?'])"},{
className:"params",begin:/\|/,end:/\|/,relevance:0,keywords:s},{
begin:"("+a.RE_STARTERS_RE+"|unless)\\s*",keywords:"unless",contains:[{
className:"regexp",contains:[a.BACKSLASH_ESCAPE,t],illegal:/\n/,variants:[{
begin:"/",end:"/[a-z]*"},{begin:/%r\{/,end:/\}[a-z]*/},{begin:"%r\\(",
end:"\\)[a-z]*"},{begin:"%r!",end:"![a-z]*"},{begin:"%r\\[",end:"\\][a-z]*"}]
}].concat(b,c),relevance:0}].concat(b,c);t.contains=_,o.contains=_;const E=[{
begin:/^\s*=>/,starts:{end:"$",contains:_}},{className:"meta",
begin:"^([>?]>|[\\w#]+\\(\\w+\\):\\d+:\\d+>|(\\w+-)?\\d+\\.\\d+\\.\\d+(p\\d+)?[^\\d][^>]+>)(?=[ ])",
starts:{end:"$",contains:_}}];return c.unshift(b),{name:"Ruby",
aliases:["rb","gemspec","podspec","thor","irb"],keywords:s,illegal:/\/\*/,
contains:[a.SHEBANG({binary:"ruby"})].concat(E).concat(c).concat(_)}}})());hljs.registerLanguage("json",(()=>{"use strict";return e=>({name:"JSON",
contains:[{className:"attr",begin:/"(\\.|[^\\"\r\n])*"(?=\s*:)/,relevance:1.01
},{match:/[{}[\],:]/,className:"punctuation",relevance:0},e.QUOTE_STRING_MODE,{
beginKeywords:"true false null"
},e.C_NUMBER_MODE,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE],illegal:"\\S"})
})());hljs.registerLanguage("kotlin",(()=>{"use strict"
;var e="\\.([0-9](_*[0-9])*)",n="[0-9a-fA-F](_*[0-9a-fA-F])*",a={
className:"number",variants:[{
begin:`(\\b([0-9](_*[0-9])*)((${e})|\\.)?|(${e}))[eE][+-]?([0-9](_*[0-9])*)[fFdD]?\\b`
},{begin:`\\b([0-9](_*[0-9])*)((${e})[fFdD]?\\b|\\.([fFdD]\\b)?)`},{
begin:`(${e})[fFdD]?\\b`},{begin:"\\b([0-9](_*[0-9])*)[fFdD]\\b"},{
begin:`\\b0[xX]((${n})\\.?|(${n})?\\.(${n}))[pP][+-]?([0-9](_*[0-9])*)[fFdD]?\\b`
},{begin:"\\b(0|[1-9](_*[0-9])*)[lL]?\\b"},{begin:`\\b0[xX](${n})[lL]?\\b`},{
begin:"\\b0(_*[0-7])*[lL]?\\b"},{begin:"\\b0[bB][01](_*[01])*[lL]?\\b"}],
relevance:0};return e=>{const n={
keyword:"abstract as val var vararg get set class object open private protected public noinline crossinline dynamic final enum if else do while for when throw try catch finally import package is in fun override companion reified inline lateinit init interface annotation data sealed internal infix operator out by constructor super tailrec where const inner suspend typealias external expect actual",
built_in:"Byte Short Char Int Long Boolean Float Double Void Unit Nothing",
literal:"true false null"},i={className:"symbol",begin:e.UNDERSCORE_IDENT_RE+"@"
},s={className:"subst",begin:/\$\{/,end:/\}/,contains:[e.C_NUMBER_MODE]},t={
className:"variable",begin:"\\$"+e.UNDERSCORE_IDENT_RE},r={className:"string",
variants:[{begin:'"""',end:'"""(?=[^"])',contains:[t,s]},{begin:"'",end:"'",
illegal:/\n/,contains:[e.BACKSLASH_ESCAPE]},{begin:'"',end:'"',illegal:/\n/,
contains:[e.BACKSLASH_ESCAPE,t,s]}]};s.contains.push(r);const l={
className:"meta",
begin:"@(?:file|property|field|get|set|receiver|param|setparam|delegate)\\s*:(?:\\s*"+e.UNDERSCORE_IDENT_RE+")?"
},c={className:"meta",begin:"@"+e.UNDERSCORE_IDENT_RE,contains:[{begin:/\(/,
end:/\)/,contains:[e.inherit(r,{className:"string"})]}]
},o=a,b=e.COMMENT("/\\*","\\*/",{contains:[e.C_BLOCK_COMMENT_MODE]}),E={
variants:[{className:"type",begin:e.UNDERSCORE_IDENT_RE},{begin:/\(/,end:/\)/,
contains:[]}]},d=E;return d.variants[1].contains=[E],E.variants[1].contains=[d],
{name:"Kotlin",aliases:["kt","kts"],keywords:n,
contains:[e.COMMENT("/\\*\\*","\\*/",{relevance:0,contains:[{className:"doctag",
begin:"@[A-Za-z]+"}]}),e.C_LINE_COMMENT_MODE,b,{className:"keyword",
begin:/\b(break|continue|return|this)\b/,starts:{contains:[{className:"symbol",
begin:/@\w+/}]}},i,l,c,{className:"function",beginKeywords:"fun",end:"[(]|$",
returnBegin:!0,excludeEnd:!0,keywords:n,relevance:5,contains:[{
begin:e.UNDERSCORE_IDENT_RE+"\\s*\\(",returnBegin:!0,relevance:0,
contains:[e.UNDERSCORE_TITLE_MODE]},{className:"type",begin:/</,end:/>/,
keywords:"reified",relevance:0},{className:"params",begin:/\(/,end:/\)/,
endsParent:!0,keywords:n,relevance:0,contains:[{begin:/:/,end:/[=,\/]/,
endsWithParent:!0,contains:[E,e.C_LINE_COMMENT_MODE,b],relevance:0
},e.C_LINE_COMMENT_MODE,b,l,c,r,e.C_NUMBER_MODE]},b]},{className:"class",
beginKeywords:"class interface trait",end:/[:\{(]|$/,excludeEnd:!0,
illegal:"extends implements",contains:[{
beginKeywords:"public protected internal private constructor"
},e.UNDERSCORE_TITLE_MODE,{className:"type",begin:/</,end:/>/,excludeBegin:!0,
excludeEnd:!0,relevance:0},{className:"type",begin:/[,:]\s*/,end:/[<\(,]|$/,
excludeBegin:!0,returnEnd:!0},l,c]},r,{className:"meta",begin:"^#!/usr/bin/env",
end:"$",illegal:"\n"},o]}}})());hljs.registerLanguage("bash",(()=>{"use strict";function e(...e){
return e.map((e=>{return(s=e)?"string"==typeof s?s:s.source:null;var s
})).join("")}return s=>{const n={},t={begin:/\$\{/,end:/\}/,contains:["self",{
begin:/:-/,contains:[n]}]};Object.assign(n,{className:"variable",variants:[{
begin:e(/\$[\w\d#@][\w\d_]*/,"(?![\\w\\d])(?![$])")},t]});const a={
className:"subst",begin:/\$\(/,end:/\)/,contains:[s.BACKSLASH_ESCAPE]},i={
begin:/<<-?\s*(?=\w+)/,starts:{contains:[s.END_SAME_AS_BEGIN({begin:/(\w+)/,
end:/(\w+)/,className:"string"})]}},c={className:"string",begin:/"/,end:/"/,
contains:[s.BACKSLASH_ESCAPE,n,a]};a.contains.push(c);const o={begin:/\$\(\(/,
end:/\)\)/,contains:[{begin:/\d+#[0-9a-f]+/,className:"number"},s.NUMBER_MODE,n]
},r=s.SHEBANG({binary:"(fish|bash|zsh|sh|csh|ksh|tcsh|dash|scsh)",relevance:10
}),l={className:"function",begin:/\w[\w\d_]*\s*\(\s*\)\s*\{/,returnBegin:!0,
contains:[s.inherit(s.TITLE_MODE,{begin:/\w[\w\d_]*/})],relevance:0};return{
name:"Bash",aliases:["sh"],keywords:{$pattern:/\b[a-z._-]+\b/,
keyword:["if","then","else","elif","fi","for","while","in","do","done","case","esac","function"],
literal:["true","false"],
built_in:"break cd continue eval exec exit export getopts hash pwd readonly return shift test times trap umask unset alias bind builtin caller command declare echo enable help let local logout mapfile printf read readarray source type typeset ulimit unalias set shopt autoload bg bindkey bye cap chdir clone comparguments compcall compctl compdescribe compfiles compgroups compquote comptags comptry compvalues dirs disable disown echotc echoti emulate fc fg float functions getcap getln history integer jobs kill limit log noglob popd print pushd pushln rehash sched setcap setopt stat suspend ttyctl unfunction unhash unlimit unsetopt vared wait whence where which zcompile zformat zftp zle zmodload zparseopts zprof zpty zregexparse zsocket zstyle ztcp"
},contains:[r,s.SHEBANG(),l,o,s.HASH_COMMENT_MODE,i,c,{className:"",begin:/\\"/
},{className:"string",begin:/'/,end:/'/},n]}}})());hljs.registerLanguage("shell",(()=>{"use strict";return s=>({
name:"Shell Session",aliases:["console","shellsession"],contains:[{
className:"meta",begin:/^\s{0,3}[/~\w\d[\]()@-]*[>%$#][ ]?/,starts:{
end:/[^\\](?=\s*$)/,subLanguage:"bash"}}]})})());hljs.registerLanguage("elm",(()=>{"use strict";return e=>{const n={
variants:[e.COMMENT("--","$"),e.COMMENT(/\{-/,/-\}/,{contains:["self"]})]},i={
className:"type",begin:"\\b[A-Z][\\w']*",relevance:0},s={begin:"\\(",end:"\\)",
illegal:'"',contains:[{className:"type",
begin:"\\b[A-Z][\\w]*(\\((\\.\\.|,|\\w+)\\))?"},n]};return{name:"Elm",
keywords:["let","in","if","then","else","case","of","where","module","import","exposing","type","alias","as","infix","infixl","infixr","port","effect","command","subscription"],
contains:[{beginKeywords:"port effect module",end:"exposing",
keywords:"port effect module where command subscription exposing",
contains:[s,n],illegal:"\\W\\.|;"},{begin:"import",end:"$",
keywords:"import as exposing",contains:[s,n],illegal:"\\W\\.|;"},{begin:"type",
end:"$",keywords:"type alias",contains:[i,s,{begin:/\{/,end:/\}/,
contains:s.contains},n]},{beginKeywords:"infix infixl infixr",end:"$",
contains:[e.C_NUMBER_MODE,n]},{begin:"port",end:"$",keywords:"port",contains:[n]
},{className:"string",begin:"'\\\\?.",end:"'",illegal:"."
},e.QUOTE_STRING_MODE,e.C_NUMBER_MODE,i,e.inherit(e.TITLE_MODE,{
begin:"^[_a-z][\\w']*"}),n,{begin:"->|<-"}],illegal:/;/}}})());hljs.registerLanguage("julia",(()=>{"use strict";return e=>{
var r="[A-Za-z_\\u00A1-\\uFFFF][A-Za-z_0-9\\u00A1-\\uFFFF]*",t={$pattern:r,
keyword:["baremodule","begin","break","catch","ccall","const","continue","do","else","elseif","end","export","false","finally","for","function","global","if","import","in","isa","let","local","macro","module","quote","return","true","try","using","where","while"],
literal:["ARGS","C_NULL","DEPOT_PATH","ENDIAN_BOM","ENV","Inf","Inf16","Inf32","Inf64","InsertionSort","LOAD_PATH","MergeSort","NaN","NaN16","NaN32","NaN64","PROGRAM_FILE","QuickSort","RoundDown","RoundFromZero","RoundNearest","RoundNearestTiesAway","RoundNearestTiesUp","RoundToZero","RoundUp","VERSION|0","devnull","false","im","missing","nothing","pi","stderr","stdin","stdout","true","undef","\u03c0","\u212f"],
built_in:["AbstractArray","AbstractChannel","AbstractChar","AbstractDict","AbstractDisplay","AbstractFloat","AbstractIrrational","AbstractMatrix","AbstractRange","AbstractSet","AbstractString","AbstractUnitRange","AbstractVecOrMat","AbstractVector","Any","ArgumentError","Array","AssertionError","BigFloat","BigInt","BitArray","BitMatrix","BitSet","BitVector","Bool","BoundsError","CapturedException","CartesianIndex","CartesianIndices","Cchar","Cdouble","Cfloat","Channel","Char","Cint","Cintmax_t","Clong","Clonglong","Cmd","Colon","Complex","ComplexF16","ComplexF32","ComplexF64","CompositeException","Condition","Cptrdiff_t","Cshort","Csize_t","Cssize_t","Cstring","Cuchar","Cuint","Cuintmax_t","Culong","Culonglong","Cushort","Cvoid","Cwchar_t","Cwstring","DataType","DenseArray","DenseMatrix","DenseVecOrMat","DenseVector","Dict","DimensionMismatch","Dims","DivideError","DomainError","EOFError","Enum","ErrorException","Exception","ExponentialBackOff","Expr","Float16","Float32","Float64","Function","GlobalRef","HTML","IO","IOBuffer","IOContext","IOStream","IdDict","IndexCartesian","IndexLinear","IndexStyle","InexactError","InitError","Int","Int128","Int16","Int32","Int64","Int8","Integer","InterruptException","InvalidStateException","Irrational","KeyError","LinRange","LineNumberNode","LinearIndices","LoadError","MIME","Matrix","Method","MethodError","Missing","MissingException","Module","NTuple","NamedTuple","Nothing","Number","OrdinalRange","OutOfMemoryError","OverflowError","Pair","PartialQuickSort","PermutedDimsArray","Pipe","ProcessFailedException","Ptr","QuoteNode","Rational","RawFD","ReadOnlyMemoryError","Real","ReentrantLock","Ref","Regex","RegexMatch","RoundingMode","SegmentationFault","Set","Signed","Some","StackOverflowError","StepRange","StepRangeLen","StridedArray","StridedMatrix","StridedVecOrMat","StridedVector","String","StringIndexError","SubArray","SubString","SubstitutionString","Symbol","SystemError","Task","TaskFailedException","Text","TextDisplay","Timer","Tuple","Type","TypeError","TypeVar","UInt","UInt128","UInt16","UInt32","UInt64","UInt8","UndefInitializer","UndefKeywordError","UndefRefError","UndefVarError","Union","UnionAll","UnitRange","Unsigned","Val","Vararg","VecElement","VecOrMat","Vector","VersionNumber","WeakKeyDict","WeakRef"]
},n={keywords:t,illegal:/<\//},a={className:"subst",begin:/\$\(/,end:/\)/,
keywords:t},i={className:"variable",begin:"\\$"+r},o={className:"string",
contains:[e.BACKSLASH_ESCAPE,a,i],variants:[{begin:/\w*"""/,end:/"""\w*/,
relevance:10},{begin:/\w*"/,end:/"\w*/}]},s={className:"string",
contains:[e.BACKSLASH_ESCAPE,a,i],begin:"`",end:"`"},l={className:"meta",
begin:"@"+r};return n.name="Julia",n.contains=[{className:"number",
begin:/(\b0x[\d_]*(\.[\d_]*)?|0x\.\d[\d_]*)p[-+]?\d+|\b0[box][a-fA-F0-9][a-fA-F0-9_]*|(\b\d[\d_]*(\.[\d_]*)?|\.\d[\d_]*)([eEfF][-+]?\d+)?/,
relevance:0},{className:"string",begin:/'(.|\\[xXuU][a-zA-Z0-9]+)'/},o,s,l,{
className:"comment",variants:[{begin:"#=",end:"=#",relevance:10},{begin:"#",
end:"$"}]},e.HASH_COMMENT_MODE,{className:"keyword",
begin:"\\b(((abstract|primitive)\\s+)type|(mutable\\s+)?struct)\\b"},{begin:/<:/
}],a.contains=n.contains,n}})());hljs.registerLanguage("ini",(()=>{"use strict";function e(e){
return e?"string"==typeof e?e:e.source:null}function n(...n){
return n.map((n=>e(n))).join("")}return s=>{const a={className:"number",
relevance:0,variants:[{begin:/([+-]+)?[\d]+_[\d_]+/},{begin:s.NUMBER_RE}]
},t=s.COMMENT();t.variants=[{begin:/;/,end:/$/},{begin:/#/,end:/$/}];const i={
className:"variable",variants:[{begin:/\$[\w\d"][\w\d_]*/},{begin:/\$\{(.*?)\}/
}]},r={className:"literal",begin:/\bon|off|true|false|yes|no\b/},c={
className:"string",contains:[s.BACKSLASH_ESCAPE],variants:[{begin:"'''",
end:"'''",relevance:10},{begin:'"""',end:'"""',relevance:10},{begin:'"',end:'"'
},{begin:"'",end:"'"}]},l={begin:/\[/,end:/\]/,contains:[t,r,i,c,a,"self"],
relevance:0},o=function(...n){return"("+((e=>{const n=e[e.length-1]
;return"object"==typeof n&&n.constructor===Object?(e.splice(e.length-1,1),n):{}
})(n).capture?"":"?:")+n.map((n=>e(n))).join("|")+")"
}(/[A-Za-z0-9_-]+/,/"(\\"|[^"])*"/,/'[^']*'/);return{name:"TOML, also INI",
aliases:["toml"],case_insensitive:!0,illegal:/\S/,contains:[t,{
className:"section",begin:/\[+/,end:/\]+/},{
begin:n(o,"(\\s*\\.\\s*",o,")*",n("(?=",/\s*=\s*[^#\s]/,")")),className:"attr",
starts:{end:/$/,contains:[t,l,r,i,c,a]}}]}}})());hljs.registerLanguage("python-repl",(()=>{"use strict";return s=>({
aliases:["pycon"],contains:[{className:"meta",starts:{end:/ |$/,starts:{end:"$",
subLanguage:"python"}},variants:[{begin:/^>>>(?=[ ]|$)/},{
begin:/^\.\.\.(?=[ ]|$)/}]}]})})());hljs.registerLanguage("java",(()=>{"use strict"
;var e="\\.([0-9](_*[0-9])*)",a="[0-9a-fA-F](_*[0-9a-fA-F])*",n={
className:"number",variants:[{
begin:`(\\b([0-9](_*[0-9])*)((${e})|\\.)?|(${e}))[eE][+-]?([0-9](_*[0-9])*)[fFdD]?\\b`
},{begin:`\\b([0-9](_*[0-9])*)((${e})[fFdD]?\\b|\\.([fFdD]\\b)?)`},{
begin:`(${e})[fFdD]?\\b`},{begin:"\\b([0-9](_*[0-9])*)[fFdD]\\b"},{
begin:`\\b0[xX]((${a})\\.?|(${a})?\\.(${a}))[pP][+-]?([0-9](_*[0-9])*)[fFdD]?\\b`
},{begin:"\\b(0|[1-9](_*[0-9])*)[lL]?\\b"},{begin:`\\b0[xX](${a})[lL]?\\b`},{
begin:"\\b0(_*[0-7])*[lL]?\\b"},{begin:"\\b0[bB][01](_*[01])*[lL]?\\b"}],
relevance:0};function s(e,a,n){return-1===n?"":e.replace(a,(t=>s(e,a,n-1)))}
return e=>{
const a="[\xc0-\u02b8a-zA-Z_$][\xc0-\u02b8a-zA-Z_$0-9]*",t=a+s("(?:<"+a+"~~~(?:\\s*,\\s*"+a+"~~~)*>)?",/~~~/g,2),i={
keyword:["synchronized","abstract","private","var","static","if","const ","for","while","strictfp","finally","protected","import","native","final","void","enum","else","break","transient","catch","instanceof","volatile","case","assert","package","default","public","try","switch","continue","throws","protected","public","private","module","requires","exports","do"],
literal:["false","true","null"],
type:["char","boolean","long","float","int","byte","short","double"],
built_in:["super","this"]},r={className:"meta",begin:"@"+a,contains:[{
begin:/\(/,end:/\)/,contains:["self"]}]},l={className:"params",begin:/\(/,
end:/\)/,keywords:i,relevance:0,contains:[e.C_BLOCK_COMMENT_MODE],endsParent:!0}
;return{name:"Java",aliases:["jsp"],keywords:i,illegal:/<\/|#/,
contains:[e.COMMENT("/\\*\\*","\\*/",{relevance:0,contains:[{begin:/\w+@/,
relevance:0},{className:"doctag",begin:"@[A-Za-z]+"}]}),{
begin:/import java\.[a-z]+\./,keywords:"import",relevance:2
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,{
match:[/\b(?:class|interface|enum|extends|implements|new)/,/\s+/,a],className:{
1:"keyword",3:"title.class"}},{begin:[a,/\s+/,a,/\s+/,/=/],className:{1:"type",
3:"variable",5:"operator"}},{begin:[/record/,/\s+/,a],className:{1:"keyword",
3:"title.class"},contains:[l,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{
beginKeywords:"new throw return else",relevance:0},{
begin:["(?:"+t+"\\s+)",e.UNDERSCORE_IDENT_RE,/\s*(?=\()/],className:{
2:"title.function"},keywords:i,contains:[{className:"params",begin:/\(/,
end:/\)/,keywords:i,relevance:0,
contains:[r,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,n,e.C_BLOCK_COMMENT_MODE]
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},n,r]}}})());hljs.registerLanguage("cpp",(()=>{"use strict";function e(e){
return t("(?:",e,")?")}function t(...e){return e.map((e=>{
return(t=e)?"string"==typeof t?t:t.source:null;var t})).join("")}return n=>{
const a=n.COMMENT("//","$",{contains:[{begin:/\\\n/}]
}),r="[a-zA-Z_]\\w*::",i="(?!struct)(decltype\\(auto\\)|"+e(r)+"[a-zA-Z_]\\w*"+e("<[^<>]+>")+")",s={
className:"type",begin:"\\b[a-z\\d_]*_t\\b"},c={className:"string",variants:[{
begin:'(u8?|U|L)?"',end:'"',illegal:"\\n",contains:[n.BACKSLASH_ESCAPE]},{
begin:"(u8?|U|L)?'(\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)|.)",
end:"'",illegal:"."},n.END_SAME_AS_BEGIN({
begin:/(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,end:/\)([^()\\ ]{0,16})"/})]},o={
className:"number",variants:[{begin:"\\b(0b[01']+)"},{
begin:"(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)"
},{
begin:"(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)"
}],relevance:0},l={className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,keywords:{
keyword:"if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include"
},contains:[{begin:/\\\n/,relevance:0},n.inherit(c,{className:"string"}),{
className:"string",begin:/<.*?>/},a,n.C_BLOCK_COMMENT_MODE]},u={
className:"title",begin:e(r)+n.IDENT_RE,relevance:0
},d=e(r)+n.IDENT_RE+"\\s*\\(",p={
type:["bool","char","char16_t","char32_t","char8_t","double","float","int","long","short","void","wchar_t"],
keyword:["alignas","alignof","and","and_eq","asm","atomic_cancel","atomic_commit","atomic_noexcept","auto","bitand","bitor","break","case","catch","class","co_await","co_return","co_yield","compl","concept","const","const_cast|10","consteval","constexpr","constinit","continue","decltype","default","delete","do","dynamic_cast|10","else","enum","explicit","export","extern","false","final","for","friend","goto","if","import","inline","module","mutable","namespace","new","noexcept","not","not_eq","nullptr","operator","or","or_eq","override","private","protected","public","reflexpr","register","reinterpret_cast|10","requires","return","signed","sizeof","static","static_assert","static_cast|10","struct","switch","synchronized","template","this","thread_local","throw","transaction_safe","transaction_safe_dynamic","true","try","typedef","typeid","typename","union","unsigned","using","virtual","volatile","while","xor","xor_eq,"],
literal:["NULL","false","nullopt","nullptr","true"],built_in:["_Pragma"],
_type_hints:["any","auto_ptr","barrier","binary_semaphore","bitset","complex","condition_variable","condition_variable_any","counting_semaphore","deque","false_type","future","imaginary","initializer_list","istringstream","jthread","latch","lock_guard","multimap","multiset","mutex","optional","ostringstream","packaged_task","pair","promise","priority_queue","queue","recursive_mutex","recursive_timed_mutex","scoped_lock","set","shared_future","shared_lock","shared_mutex","shared_timed_mutex","shared_ptr","stack","string_view","stringstream","timed_mutex","thread","true_type","tuple","unique_lock","unique_ptr","unordered_map","unordered_multimap","unordered_multiset","unordered_set","variant","vector","weak_ptr","wstring","wstring_view"]
},_={className:"function.dispatch",relevance:0,keywords:{
_hint:["abort","abs","acos","apply","as_const","asin","atan","atan2","calloc","ceil","cerr","cin","clog","cos","cosh","cout","declval","endl","exchange","exit","exp","fabs","floor","fmod","forward","fprintf","fputs","free","frexp","fscanf","future","invoke","isalnum","isalpha","iscntrl","isdigit","isgraph","islower","isprint","ispunct","isspace","isupper","isxdigit","labs","launder","ldexp","log","log10","make_pair","make_shared","make_shared_for_overwrite","make_tuple","make_unique","malloc","memchr","memcmp","memcpy","memset","modf","move","pow","printf","putchar","puts","realloc","scanf","sin","sinh","snprintf","sprintf","sqrt","sscanf","std","stderr","stdin","stdout","strcat","strchr","strcmp","strcpy","strcspn","strlen","strncat","strncmp","strncpy","strpbrk","strrchr","strspn","strstr","swap","tan","tanh","terminate","to_underlying","tolower","toupper","vfprintf","visit","vprintf","vsprintf"]
},
begin:t(/\b/,/(?!decltype)/,/(?!if)/,/(?!for)/,/(?!while)/,n.IDENT_RE,(m=/(<[^<>]+>|)\s*\(/,
t("(?=",m,")")))};var m;const g=[_,l,s,a,n.C_BLOCK_COMMENT_MODE,o,c],f={
variants:[{begin:/=/,end:/;/},{begin:/\(/,end:/\)/},{
beginKeywords:"new throw return else",end:/;/}],keywords:p,contains:g.concat([{
begin:/\(/,end:/\)/,keywords:p,contains:g.concat(["self"]),relevance:0}]),
relevance:0},b={className:"function",begin:"("+i+"[\\*&\\s]+)+"+d,
returnBegin:!0,end:/[{;=]/,excludeEnd:!0,keywords:p,illegal:/[^\w\s\*&:<>.]/,
contains:[{begin:"decltype\\(auto\\)",keywords:p,relevance:0},{begin:d,
returnBegin:!0,contains:[u],relevance:0},{begin:/::/,relevance:0},{begin:/:/,
endsWithParent:!0,contains:[c,o]},{relevance:0,match:/,/},{className:"params",
begin:/\(/,end:/\)/,keywords:p,relevance:0,
contains:[a,n.C_BLOCK_COMMENT_MODE,c,o,s,{begin:/\(/,end:/\)/,keywords:p,
relevance:0,contains:["self",a,n.C_BLOCK_COMMENT_MODE,c,o,s]}]
},s,a,n.C_BLOCK_COMMENT_MODE,l]};return{name:"C++",
aliases:["cc","c++","h++","hpp","hh","hxx","cxx"],keywords:p,illegal:"</",
classNameAliases:{"function.dispatch":"built_in"},
contains:[].concat(f,b,_,g,[l,{
begin:"\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array|tuple|optional|variant|function)\\s*<",
end:">",keywords:p,contains:["self",s]},{begin:n.IDENT_RE+"::",keywords:p},{
match:[/\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/,/\s+/,/\w+/],
className:{1:"keyword",3:"title.class"}}])}}})());hljs.registerLanguage("r",(()=>{"use strict";function e(...e){return"("+((e=>{
const n=e[e.length-1]
;return"object"==typeof n&&n.constructor===Object?(e.splice(e.length-1,1),n):{}
})(e).capture?"":"?:")+e.map((e=>{return(n=e)?"string"==typeof n?n:n.source:null
;var n})).join("|")+")"}return n=>{
const a=/(?:(?:[a-zA-Z]|\.[._a-zA-Z])[._a-zA-Z0-9]*)|\.(?!\d)/,i=e(/0[xX][0-9a-fA-F]+\.[0-9a-fA-F]*[pP][+-]?\d+i?/,/0[xX][0-9a-fA-F]+(?:[pP][+-]?\d+)?[Li]?/,/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[Li]?/),s=/[=!<>:]=|\|\||&&|:::?|<-|<<-|->>|->|\|>|[-+*\/?!$&|:<=>@^~]|\*\*/,t=e(/[()]/,/[{}]/,/\[\[/,/[[\]]/,/\\/,/,/)
;return{name:"R",keywords:{$pattern:a,
keyword:"function if in break next repeat else for while",
literal:"NULL NA TRUE FALSE Inf NaN NA_integer_|10 NA_real_|10 NA_character_|10 NA_complex_|10",
built_in:"LETTERS letters month.abb month.name pi T F abs acos acosh all any anyNA Arg as.call as.character as.complex as.double as.environment as.integer as.logical as.null.default as.numeric as.raw asin asinh atan atanh attr attributes baseenv browser c call ceiling class Conj cos cosh cospi cummax cummin cumprod cumsum digamma dim dimnames emptyenv exp expression floor forceAndCall gamma gc.time globalenv Im interactive invisible is.array is.atomic is.call is.character is.complex is.double is.environment is.expression is.finite is.function is.infinite is.integer is.language is.list is.logical is.matrix is.na is.name is.nan is.null is.numeric is.object is.pairlist is.raw is.recursive is.single is.symbol lazyLoadDBfetch length lgamma list log max min missing Mod names nargs nzchar oldClass on.exit pos.to.env proc.time prod quote range Re rep retracemem return round seq_along seq_len seq.int sign signif sin sinh sinpi sqrt standardGeneric substitute sum switch tan tanh tanpi tracemem trigamma trunc unclass untracemem UseMethod xtfrm"
},contains:[n.COMMENT(/#'/,/$/,{contains:[{scope:"doctag",begin:"@examples",
starts:{contains:[{begin:/\n/},{begin:/#'\s*(?=@[a-zA-Z]+)/,endsParent:!0},{
begin:/#'/,end:/$/,excludeBegin:!0}]}},{scope:"doctag",begin:"@param",end:/$/,
contains:[{scope:"variable",variants:[{begin:a},{begin:/`(?:\\.|[^`\\])+`/}],
endsParent:!0}]},{scope:"doctag",begin:/@[a-zA-Z]+/},{scope:"keyword",
begin:/\\[a-zA-Z]+/}]}),n.HASH_COMMENT_MODE,{scope:"string",
contains:[n.BACKSLASH_ESCAPE],variants:[n.END_SAME_AS_BEGIN({
begin:/[rR]"(-*)\(/,end:/\)(-*)"/}),n.END_SAME_AS_BEGIN({begin:/[rR]"(-*)\{/,
end:/\}(-*)"/}),n.END_SAME_AS_BEGIN({begin:/[rR]"(-*)\[/,end:/\](-*)"/
}),n.END_SAME_AS_BEGIN({begin:/[rR]'(-*)\(/,end:/\)(-*)'/
}),n.END_SAME_AS_BEGIN({begin:/[rR]'(-*)\{/,end:/\}(-*)'/
}),n.END_SAME_AS_BEGIN({begin:/[rR]'(-*)\[/,end:/\](-*)'/}),{begin:'"',end:'"',
relevance:0},{begin:"'",end:"'",relevance:0}]},{relevance:0,variants:[{scope:{
1:"operator",2:"number"},match:[s,i]},{scope:{1:"operator",2:"number"},
match:[/%[^%]*%/,i]},{scope:{1:"punctuation",2:"number"},match:[t,i]},{scope:{
2:"number"},match:[/[^a-zA-Z0-9._]|^/,i]}]},{scope:{3:"operator"},
match:[a,/\s+/,/<-/,/\s+/]},{scope:"operator",relevance:0,variants:[{match:s},{
match:/%[^%]*%/}]},{scope:"punctuation",relevance:0,match:t},{begin:"`",end:"`",
contains:[{begin:/\\./}]}]}}})());hljs.registerLanguage("javascript",(()=>{"use strict"
;const e="[A-Za-z$_][0-9A-Za-z$_]*",n=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends"],a=["true","false","null","undefined","NaN","Infinity"],t=["Intl","DataView","Number","Math","Date","String","RegExp","Object","Function","Boolean","Error","Symbol","Set","Map","WeakSet","WeakMap","Proxy","Reflect","JSON","Promise","Float64Array","Int16Array","Int32Array","Int8Array","Uint16Array","Uint32Array","Float32Array","Array","Uint8Array","Uint8ClampedArray","ArrayBuffer","BigInt64Array","BigUint64Array","BigInt"],s=["EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],r=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],i=["arguments","this","super","console","window","document","localStorage","module","global"],c=[].concat(r,t,s)
;function o(e){return l("(?=",e,")")}function l(...e){return e.map((e=>{
return(n=e)?"string"==typeof n?n:n.source:null;var n})).join("")}return b=>{
const g=e,d={begin:/<[A-Za-z0-9\\._:-]+/,end:/\/[A-Za-z0-9\\._:-]+>|\/>/,
isTrulyOpeningTag:(e,n)=>{const a=e[0].length+e.index,t=e.input[a]
;"<"!==t?">"===t&&(((e,{after:n})=>{const a="</"+e[0].slice(1)
;return-1!==e.input.indexOf(a,n)})(e,{after:a
})||n.ignoreMatch()):n.ignoreMatch()}},u={$pattern:e,keyword:n,literal:a,
built_in:c,"variable.language":i
},m="\\.([0-9](_?[0-9])*)",E="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",y={
className:"number",variants:[{
begin:`(\\b(${E})((${m})|\\.)?|(${m}))[eE][+-]?([0-9](_?[0-9])*)\\b`},{
begin:`\\b(${E})\\b((${m})\\b|\\.)?|(${m})\\b`},{
begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{
begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{
begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{
begin:"\\b0[0-7]+n?\\b"}],relevance:0},_={className:"subst",begin:"\\$\\{",
end:"\\}",keywords:u,contains:[]},N={begin:"html`",end:"",starts:{end:"`",
returnEnd:!1,contains:[b.BACKSLASH_ESCAPE,_],subLanguage:"xml"}},f={
begin:"css`",end:"",starts:{end:"`",returnEnd:!1,
contains:[b.BACKSLASH_ESCAPE,_],subLanguage:"css"}},A={className:"string",
begin:"`",end:"`",contains:[b.BACKSLASH_ESCAPE,_]},v={className:"comment",
variants:[b.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{
begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",
begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,
excludeBegin:!0,relevance:0},{className:"variable",begin:g+"(?=\\s*(-)|$)",
endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]
}),b.C_BLOCK_COMMENT_MODE,b.C_LINE_COMMENT_MODE]
},p=[b.APOS_STRING_MODE,b.QUOTE_STRING_MODE,N,f,A,y,b.REGEXP_MODE]
;_.contains=p.concat({begin:/\{/,end:/\}/,keywords:u,contains:["self"].concat(p)
});const h=[].concat(v,_.contains),S=h.concat([{begin:/\(/,end:/\)/,keywords:u,
contains:["self"].concat(h)}]),w={className:"params",begin:/\(/,end:/\)/,
excludeBegin:!0,excludeEnd:!0,keywords:u,contains:S},R={variants:[{
match:[/class/,/\s+/,g],scope:{1:"keyword",3:"title.class"}},{
match:[/extends/,/\s+/,l(g,"(",l(/\./,g),")*")],scope:{1:"keyword",
3:"title.class.inherited"}}]},O={relevance:0,
match:/\b[A-Z][a-z]+([A-Z][a-z]+)*/,className:"title.class",keywords:{
_:[...t,...s]}},I={variants:[{match:[/function/,/\s+/,g,/(?=\s*\()/]},{
match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},
label:"func.def",contains:[w],illegal:/%/},T={
match:l(/\b/,(x=[...r,"super"],l("(?!",x.join("|"),")")),g,o(/\(/)),
className:"title.function",relevance:0};var x;const M={
begin:l(/\./,o(l(g,/(?![0-9A-Za-z$_(])/))),end:g,excludeBegin:!0,
keywords:"prototype",className:"property",relevance:0},k={
match:[/get|set/,/\s+/,g,/(?=\()/],className:{1:"keyword",3:"title.function"},
contains:[{begin:/\(\)/},w]
},C="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+b.UNDERSCORE_IDENT_RE+")\\s*=>",B={
match:[/const|var|let/,/\s+/,g,/\s*/,/=\s*/,o(C)],className:{1:"keyword",
3:"title.function"},contains:[w]};return{name:"Javascript",
aliases:["js","jsx","mjs","cjs"],keywords:u,exports:{PARAMS_CONTAINS:S},
illegal:/#(?![$_A-z])/,contains:[b.SHEBANG({label:"shebang",binary:"node",
relevance:5}),{label:"use_strict",className:"meta",relevance:10,
begin:/^\s*['"]use (strict|asm)['"]/
},b.APOS_STRING_MODE,b.QUOTE_STRING_MODE,N,f,A,v,y,O,{className:"attr",
begin:g+o(":"),relevance:0},B,{
begin:"("+b.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",
keywords:"return throw case",relevance:0,contains:[v,b.REGEXP_MODE,{
className:"function",begin:C,returnBegin:!0,end:"\\s*=>",contains:[{
className:"params",variants:[{begin:b.UNDERSCORE_IDENT_RE,relevance:0},{
className:null,begin:/\(\s*\)/,skip:!0},{begin:/\(/,end:/\)/,excludeBegin:!0,
excludeEnd:!0,keywords:u,contains:S}]}]},{begin:/,/,relevance:0},{match:/\s+/,
relevance:0},{variants:[{begin:"<>",end:"</>"},{begin:d.begin,
"on:begin":d.isTrulyOpeningTag,end:d.end}],subLanguage:"xml",contains:[{
begin:d.begin,end:d.end,skip:!0,contains:["self"]}]}]},I,{
beginKeywords:"while if switch catch for"},{
begin:"\\b(?!function)"+b.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
returnBegin:!0,label:"func.def",contains:[w,b.inherit(b.TITLE_MODE,{begin:g,
className:"title.function"})]},{match:/\.\.\./,relevance:0},M,{match:"\\$"+g,
relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},
contains:[w]},T,{relevance:0,match:/\b[A-Z][A-Z_]+\b/,
className:"variable.constant"},R,k,{match:/\$[(.]/}]}}})());hljs.registerLanguage("swift",(()=>{"use strict";function e(e){
return e?"string"==typeof e?e:e.source:null}function a(e){return t("(?=",e,")")}
function t(...a){return a.map((a=>e(a))).join("")}function n(...a){
return"("+((e=>{const a=e[e.length-1]
;return"object"==typeof a&&a.constructor===Object?(e.splice(e.length-1,1),a):{}
})(a).capture?"":"?:")+a.map((a=>e(a))).join("|")+")"}
const i=e=>t(/\b/,e,/\w$/.test(e)?/\b/:/\B/),s=["Protocol","Type"].map(i),u=["init","self"].map(i),c=["Any","Self"],r=["actor","associatedtype","async","await",/as\?/,/as!/,"as","break","case","catch","class","continue","convenience","default","defer","deinit","didSet","do","dynamic","else","enum","extension","fallthrough",/fileprivate\(set\)/,"fileprivate","final","for","func","get","guard","if","import","indirect","infix",/init\?/,/init!/,"inout",/internal\(set\)/,"internal","in","is","lazy","let","mutating","nonmutating",/open\(set\)/,"open","operator","optional","override","postfix","precedencegroup","prefix",/private\(set\)/,"private","protocol",/public\(set\)/,"public","repeat","required","rethrows","return","set","some","static","struct","subscript","super","switch","throws","throw",/try\?/,/try!/,"try","typealias",/unowned\(safe\)/,/unowned\(unsafe\)/,"unowned","var","weak","where","while","willSet"],o=["false","nil","true"],l=["assignment","associativity","higherThan","left","lowerThan","none","right"],m=["#colorLiteral","#column","#dsohandle","#else","#elseif","#endif","#error","#file","#fileID","#fileLiteral","#filePath","#function","#if","#imageLiteral","#keyPath","#line","#selector","#sourceLocation","#warn_unqualified_access","#warning"],p=["abs","all","any","assert","assertionFailure","debugPrint","dump","fatalError","getVaList","isKnownUniquelyReferenced","max","min","numericCast","pointwiseMax","pointwiseMin","precondition","preconditionFailure","print","readLine","repeatElement","sequence","stride","swap","swift_unboxFromSwiftValueWithType","transcode","type","unsafeBitCast","unsafeDowncast","withExtendedLifetime","withUnsafeMutablePointer","withUnsafePointer","withVaList","withoutActuallyEscaping","zip"],F=n(/[/=\-+!*%<>&|^~?]/,/[\u00A1-\u00A7]/,/[\u00A9\u00AB]/,/[\u00AC\u00AE]/,/[\u00B0\u00B1]/,/[\u00B6\u00BB\u00BF\u00D7\u00F7]/,/[\u2016-\u2017]/,/[\u2020-\u2027]/,/[\u2030-\u203E]/,/[\u2041-\u2053]/,/[\u2055-\u205E]/,/[\u2190-\u23FF]/,/[\u2500-\u2775]/,/[\u2794-\u2BFF]/,/[\u2E00-\u2E7F]/,/[\u3001-\u3003]/,/[\u3008-\u3020]/,/[\u3030]/),d=n(F,/[\u0300-\u036F]/,/[\u1DC0-\u1DFF]/,/[\u20D0-\u20FF]/,/[\uFE00-\uFE0F]/,/[\uFE20-\uFE2F]/),b=t(F,d,"*"),h=n(/[a-zA-Z_]/,/[\u00A8\u00AA\u00AD\u00AF\u00B2-\u00B5\u00B7-\u00BA]/,/[\u00BC-\u00BE\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/,/[\u0100-\u02FF\u0370-\u167F\u1681-\u180D\u180F-\u1DBF]/,/[\u1E00-\u1FFF]/,/[\u200B-\u200D\u202A-\u202E\u203F-\u2040\u2054\u2060-\u206F]/,/[\u2070-\u20CF\u2100-\u218F\u2460-\u24FF\u2776-\u2793]/,/[\u2C00-\u2DFF\u2E80-\u2FFF]/,/[\u3004-\u3007\u3021-\u302F\u3031-\u303F\u3040-\uD7FF]/,/[\uF900-\uFD3D\uFD40-\uFDCF\uFDF0-\uFE1F\uFE30-\uFE44]/,/[\uFE47-\uFEFE\uFF00-\uFFFD]/),f=n(h,/\d/,/[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/),w=t(h,f,"*"),y=t(/[A-Z]/,f,"*"),g=["autoclosure",t(/convention\(/,n("swift","block","c"),/\)/),"discardableResult","dynamicCallable","dynamicMemberLookup","escaping","frozen","GKInspectable","IBAction","IBDesignable","IBInspectable","IBOutlet","IBSegueAction","inlinable","main","nonobjc","NSApplicationMain","NSCopying","NSManaged",t(/objc\(/,w,/\)/),"objc","objcMembers","propertyWrapper","requires_stored_property_inits","resultBuilder","testable","UIApplicationMain","unknown","usableFromInline"],E=["iOS","iOSApplicationExtension","macOS","macOSApplicationExtension","macCatalyst","macCatalystApplicationExtension","watchOS","watchOSApplicationExtension","tvOS","tvOSApplicationExtension","swift"]
;return e=>{const F={match:/\s+/,relevance:0},h=e.COMMENT("/\\*","\\*/",{
contains:["self"]}),v=[e.C_LINE_COMMENT_MODE,h],A={match:[/\./,n(...s,...u)],
className:{2:"keyword"}},N={match:t(/\./,n(...r)),relevance:0
},C=r.filter((e=>"string"==typeof e)).concat(["_|0"]),D={variants:[{
className:"keyword",
match:n(...r.filter((e=>"string"!=typeof e)).concat(c).map(i),...u)}]},k={
$pattern:n(/\b\w+/,/#\w+/),keyword:C.concat(m),literal:o},B=[A,N,D],_=[{
match:t(/\./,n(...p)),relevance:0},{className:"built_in",
match:t(/\b/,n(...p),/(?=\()/)}],S={match:/->/,relevance:0},M=[S,{
className:"operator",relevance:0,variants:[{match:b},{match:`\\.(\\.|${d})+`}]
}],x="([0-9a-fA-F]_*)+",I={className:"number",relevance:0,variants:[{
match:"\\b(([0-9]_*)+)(\\.(([0-9]_*)+))?([eE][+-]?(([0-9]_*)+))?\\b"},{
match:`\\b0x(${x})(\\.(${x}))?([pP][+-]?(([0-9]_*)+))?\\b`},{
match:/\b0o([0-7]_*)+\b/},{match:/\b0b([01]_*)+\b/}]},L=(e="")=>({
className:"subst",variants:[{match:t(/\\/,e,/[0\\tnr"']/)},{
match:t(/\\/,e,/u\{[0-9a-fA-F]{1,8}\}/)}]}),O=(e="")=>({className:"subst",
match:t(/\\/,e,/[\t ]*(?:[\r\n]|\r\n)/)}),T=(e="")=>({className:"subst",
label:"interpol",begin:t(/\\/,e,/\(/),end:/\)/}),$=(e="")=>({begin:t(e,/"""/),
end:t(/"""/,e),contains:[L(e),O(e),T(e)]}),j=(e="")=>({begin:t(e,/"/),
end:t(/"/,e),contains:[L(e),T(e)]}),P={className:"string",
variants:[$(),$("#"),$("##"),$("###"),j(),j("#"),j("##"),j("###")]},K={
match:t(/`/,w,/`/)},z=[K,{className:"variable",match:/\$\d+/},{
className:"variable",match:`\\$${f}+`}],q=[{match:/(@|#)available/,
className:"keyword",starts:{contains:[{begin:/\(/,end:/\)/,keywords:E,
contains:[...M,I,P]}]}},{className:"keyword",match:t(/@/,n(...g))},{
className:"meta",match:t(/@/,w)}],U={match:a(/\b[A-Z]/),relevance:0,contains:[{
className:"type",
match:t(/(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)/,f,"+")
},{className:"type",match:y,relevance:0},{match:/[?!]+/,relevance:0},{
match:/\.\.\./,relevance:0},{match:t(/\s+&\s+/,a(y)),relevance:0}]},Z={
begin:/</,end:/>/,keywords:k,contains:[...v,...B,...q,S,U]};U.contains.push(Z)
;const V={begin:/\(/,end:/\)/,relevance:0,keywords:k,contains:["self",{
match:t(w,/\s*:/),keywords:"_|0",relevance:0
},...v,...B,..._,...M,I,P,...z,...q,U]},W={begin:/</,end:/>/,contains:[...v,U]
},G={begin:/\(/,end:/\)/,keywords:k,contains:[{
begin:n(a(t(w,/\s*:/)),a(t(w,/\s+/,w,/\s*:/))),end:/:/,relevance:0,contains:[{
className:"keyword",match:/\b_\b/},{className:"params",match:w}]
},...v,...B,...M,I,P,...q,U,V],endsParent:!0,illegal:/["']/},R={
match:[/func/,/\s+/,n(K.match,w,b)],className:{1:"keyword",3:"title.function"},
contains:[W,G,F],illegal:[/\[/,/%/]},X={
match:[/\b(?:subscript|init[?!]?)/,/\s*(?=[<(])/],className:{1:"keyword"},
contains:[W,G,F],illegal:/\[|%/},H={match:[/operator/,/\s+/,b],className:{
1:"keyword",3:"title"}},J={begin:[/precedencegroup/,/\s+/,y],className:{
1:"keyword",3:"title"},contains:[U],keywords:[...l,...o],end:/}/}
;for(const e of P.variants){const a=e.contains.find((e=>"interpol"===e.label))
;a.keywords=k;const t=[...B,..._,...M,I,P,...z];a.contains=[...t,{begin:/\(/,
end:/\)/,contains:["self",...t]}]}return{name:"Swift",keywords:k,
contains:[...v,R,X,{beginKeywords:"struct protocol class extension enum actor",
end:"\\{",excludeEnd:!0,keywords:k,contains:[e.inherit(e.TITLE_MODE,{
className:"title.class",begin:/[A-Za-z$_][\u00C0-\u02B80-9A-Za-z$_]*/}),...B]
},H,J,{beginKeywords:"import",end:/$/,contains:[...v],relevance:0
},...B,..._,...M,I,P,...z,...q,U,V]}}})());hljs.registerLanguage("haskell",(()=>{"use strict";return e=>{const n={
variants:[e.COMMENT("--","$"),e.COMMENT(/\{-/,/-\}/,{contains:["self"]})]},a={
className:"meta",begin:/\{-#/,end:/#-\}/},i={className:"meta",begin:"^#",end:"$"
},s={className:"type",begin:"\\b[A-Z][\\w']*",relevance:0},l={begin:"\\(",
end:"\\)",illegal:'"',contains:[a,i,{className:"type",
begin:"\\b[A-Z][\\w]*(\\((\\.\\.|,|\\w+)\\))?"},e.inherit(e.TITLE_MODE,{
begin:"[_a-z][\\w']*"}),n]},t="([0-9a-fA-F]_*)+",c={className:"number",
relevance:0,variants:[{
match:"\\b(([0-9]_*)+)(\\.(([0-9]_*)+))?([eE][+-]?(([0-9]_*)+))?\\b"},{
match:`\\b0[xX]_*(${t})(\\.(${t}))?([pP][+-]?(([0-9]_*)+))?\\b`},{
match:"\\b0[oO](([0-7]_*)+)\\b"},{match:"\\b0[bB](([01]_*)+)\\b"}]};return{
name:"Haskell",aliases:["hs"],
keywords:"let in if then else case of where do module import hiding qualified type data newtype deriving class instance as default infix infixl infixr foreign export ccall stdcall cplusplus jvm dotnet safe unsafe family forall mdo proc rec",
contains:[{beginKeywords:"module",end:"where",keywords:"module where",
contains:[l,n],illegal:"\\W\\.|;"},{begin:"\\bimport\\b",end:"$",
keywords:"import qualified as hiding",contains:[l,n],illegal:"\\W\\.|;"},{
className:"class",begin:"^(\\s*)?(class|instance)\\b",end:"where",
keywords:"class family instance where",contains:[s,l,n]},{className:"class",
begin:"\\b(data|(new)?type)\\b",end:"$",
keywords:"data family type newtype deriving",contains:[a,s,l,{begin:/\{/,
end:/\}/,contains:l.contains},n]},{beginKeywords:"default",end:"$",
contains:[s,l,n]},{beginKeywords:"infix infixl infixr",end:"$",
contains:[e.C_NUMBER_MODE,n]},{begin:"\\bforeign\\b",end:"$",
keywords:"foreign import export ccall stdcall cplusplus jvm dotnet safe unsafe",
contains:[s,e.QUOTE_STRING_MODE,n]},{className:"meta",
begin:"#!\\/usr\\/bin\\/env runhaskell",end:"$"
},a,i,e.QUOTE_STRING_MODE,c,s,e.inherit(e.TITLE_MODE,{begin:"^[_a-z][\\w']*"
}),n,{begin:"->|<-"}]}}})());hljs.registerLanguage("nim",(()=>{"use strict";return e=>({name:"Nim",keywords:{
keyword:["addr","and","as","asm","bind","block","break","case","cast","const","continue","converter","discard","distinct","div","do","elif","else","end","enum","except","export","finally","for","from","func","generic","guarded","if","import","in","include","interface","is","isnot","iterator","let","macro","method","mixin","mod","nil","not","notin","object","of","or","out","proc","ptr","raise","ref","return","shared","shl","shr","static","template","try","tuple","type","using","var","when","while","with","without","xor","yield"],
literal:["true","false"],
type:["int","int8","int16","int32","int64","uint","uint8","uint16","uint32","uint64","float","float32","float64","bool","char","string","cstring","pointer","expr","stmt","void","auto","any","range","array","openarray","varargs","seq","set","clong","culong","cchar","cschar","cshort","cint","csize","clonglong","cfloat","cdouble","clongdouble","cuchar","cushort","cuint","culonglong","cstringarray","semistatic"],
built_in:["stdin","stdout","stderr","result"]},contains:[{className:"meta",
begin:/\{\./,end:/\.\}/,relevance:10},{className:"string",begin:/[a-zA-Z]\w*"/,
end:/"/,contains:[{begin:/""/}]},{className:"string",begin:/([a-zA-Z]\w*)?"""/,
end:/"""/},e.QUOTE_STRING_MODE,{className:"type",begin:/\b[A-Z]\w+\b/,
relevance:0},{className:"number",relevance:0,variants:[{
begin:/\b(0[xX][0-9a-fA-F][_0-9a-fA-F]*)('?[iIuU](8|16|32|64))?/},{
begin:/\b(0o[0-7][_0-7]*)('?[iIuUfF](8|16|32|64))?/},{
begin:/\b(0(b|B)[01][_01]*)('?[iIuUfF](8|16|32|64))?/},{
begin:/\b(\d[_\d]*)('?[iIuUfF](8|16|32|64))?/}]},e.HASH_COMMENT_MODE]})})());hljs.registerLanguage("elixir",(()=>{"use strict";return e=>{
const n="[a-zA-Z_][a-zA-Z0-9_.]*(!|\\?)?",i={$pattern:n,
keyword:"and false then defined module in return redo retry end for true self when next until do begin unless nil break not case cond alias while ensure or include use alias fn quote require import with|0"
},a={className:"subst",begin:/#\{/,end:/\}/,keywords:i},s={className:"number",
begin:"(\\b0o[0-7_]+)|(\\b0b[01_]+)|(\\b0x[0-9a-fA-F_]+)|(-?\\b[1-9][0-9_]*(\\.[0-9_]+([eE][-+]?[0-9]+)?)?)",
relevance:0},b={className:"string",begin:"~[a-z](?=[/|([{<\"'])",contains:[{
endsParent:!0,contains:[{contains:[e.BACKSLASH_ESCAPE,a],variants:[{begin:/"/,
end:/"/},{begin:/'/,end:/'/},{begin:/\//,end:/\//},{begin:/\|/,end:/\|/},{
begin:/\(/,end:/\)/},{begin:/\[/,end:/\]/},{begin:/\{/,end:/\}/},{begin:/</,
end:/>/}]}]}]},d={className:"string",contains:[e.BACKSLASH_ESCAPE,a],variants:[{
begin:/"""/,end:/"""/},{begin:/'''/,end:/'''/},{begin:/~S"""/,end:/"""/,
contains:[]},{begin:/~S"/,end:/"/,contains:[]},{begin:/~S'''/,end:/'''/,
contains:[]},{begin:/~S'/,end:/'/,contains:[]},{begin:/'/,end:/'/},{begin:/"/,
end:/"/}]},r={className:"function",beginKeywords:"def defp defmacro",end:/\B\b/,
contains:[e.inherit(e.TITLE_MODE,{begin:n,endsParent:!0})]},g=e.inherit(r,{
className:"class",beginKeywords:"defimpl defmodule defprotocol defrecord",
end:/\bdo\b|$|;/}),t=[d,{className:"string",begin:"~[A-Z](?=[/|([{<\"'])",
contains:[{begin:/"/,end:/"/},{begin:/'/,end:/'/},{begin:/\//,end:/\//},{
begin:/\|/,end:/\|/},{begin:/\(/,end:/\)/},{begin:/\[/,end:/\]/},{begin:/\{/,
end:/\}/},{begin:/</,end:/>/}]},b,e.HASH_COMMENT_MODE,g,r,{begin:"::"},{
className:"symbol",begin:":(?![\\s:])",contains:[d,{
begin:"[a-zA-Z_]\\w*[!?=]?|[-+~]@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?"
}],relevance:0},{className:"symbol",begin:n+":(?!:)",relevance:0},s,{
className:"variable",begin:"(\\$\\W)|((\\$|@@?)(\\w+))"},{begin:"->"},{
begin:"("+e.RE_STARTERS_RE+")\\s*",contains:[e.HASH_COMMENT_MODE,{
begin:/\/: (?=\d+\s*[,\]])/,relevance:0,contains:[s]},{className:"regexp",
illegal:"\\n",contains:[e.BACKSLASH_ESCAPE,a],variants:[{begin:"/",end:"/[a-z]*"
},{begin:"%r\\[",end:"\\][a-z]*"}]}],relevance:0}];return a.contains=t,{
name:"Elixir",keywords:i,contains:t}}})());hljs.registerLanguage("typescript",(()=>{"use strict"
;const e="[A-Za-z$_][0-9A-Za-z$_]*",n=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends"],a=["true","false","null","undefined","NaN","Infinity"],t=["Intl","DataView","Number","Math","Date","String","RegExp","Object","Function","Boolean","Error","Symbol","Set","Map","WeakSet","WeakMap","Proxy","Reflect","JSON","Promise","Float64Array","Int16Array","Int32Array","Int8Array","Uint16Array","Uint32Array","Float32Array","Array","Uint8Array","Uint8ClampedArray","ArrayBuffer","BigInt64Array","BigUint64Array","BigInt"],s=["EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],r=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],c=["arguments","this","super","console","window","document","localStorage","module","global"],i=[].concat(r,t,s)
;function o(e){return l("(?=",e,")")}function l(...e){return e.map((e=>{
return(n=e)?"string"==typeof n?n:n.source:null;var n})).join("")}return b=>{
const d={$pattern:e,
keyword:n.concat(["type","namespace","typedef","interface","public","private","protected","implements","declare","abstract","readonly"]),
literal:a,
built_in:i.concat(["any","void","number","boolean","string","object","never","enum"]),
"variable.language":c},g={className:"meta",begin:"@[A-Za-z$_][0-9A-Za-z$_]*"
},u=(e,n,a)=>{const t=e.contains.findIndex((e=>e.label===n))
;if(-1===t)throw Error("can not find mode to replace");e.contains.splice(t,1,a)
},m=function(b){const d=e,g={begin:/<[A-Za-z0-9\\._:-]+/,
end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(e,n)=>{
const a=e[0].length+e.index,t=e.input[a];"<"!==t?">"===t&&(((e,{after:n})=>{
const a="</"+e[0].slice(1);return-1!==e.input.indexOf(a,n)})(e,{after:a
})||n.ignoreMatch()):n.ignoreMatch()}},u={$pattern:e,keyword:n,literal:a,
built_in:i,"variable.language":c
},m="\\.([0-9](_?[0-9])*)",E="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",y={
className:"number",variants:[{
begin:`(\\b(${E})((${m})|\\.)?|(${m}))[eE][+-]?([0-9](_?[0-9])*)\\b`},{
begin:`\\b(${E})\\b((${m})\\b|\\.)?|(${m})\\b`},{
begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{
begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{
begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{
begin:"\\b0[0-7]+n?\\b"}],relevance:0},f={className:"subst",begin:"\\$\\{",
end:"\\}",keywords:u,contains:[]},p={begin:"html`",end:"",starts:{end:"`",
returnEnd:!1,contains:[b.BACKSLASH_ESCAPE,f],subLanguage:"xml"}},_={
begin:"css`",end:"",starts:{end:"`",returnEnd:!1,
contains:[b.BACKSLASH_ESCAPE,f],subLanguage:"css"}},N={className:"string",
begin:"`",end:"`",contains:[b.BACKSLASH_ESCAPE,f]},A={className:"comment",
variants:[b.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{
begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",
begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,
excludeBegin:!0,relevance:0},{className:"variable",begin:d+"(?=\\s*(-)|$)",
endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]
}),b.C_BLOCK_COMMENT_MODE,b.C_LINE_COMMENT_MODE]
},v=[b.APOS_STRING_MODE,b.QUOTE_STRING_MODE,p,_,N,y,b.REGEXP_MODE]
;f.contains=v.concat({begin:/\{/,end:/\}/,keywords:u,contains:["self"].concat(v)
});const h=[].concat(A,f.contains),w=h.concat([{begin:/\(/,end:/\)/,keywords:u,
contains:["self"].concat(h)}]),S={className:"params",begin:/\(/,end:/\)/,
excludeBegin:!0,excludeEnd:!0,keywords:u,contains:w},O={variants:[{
match:[/class/,/\s+/,d],scope:{1:"keyword",3:"title.class"}},{
match:[/extends/,/\s+/,l(d,"(",l(/\./,d),")*")],scope:{1:"keyword",
3:"title.class.inherited"}}]},R={relevance:0,
match:/\b[A-Z][a-z]+([A-Z][a-z]+)*/,className:"title.class",keywords:{
_:[...t,...s]}},I={variants:[{match:[/function/,/\s+/,d,/(?=\s*\()/]},{
match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},
label:"func.def",contains:[S],illegal:/%/},x={
match:l(/\b/,(T=[...r,"super"],l("(?!",T.join("|"),")")),d,o(/\(/)),
className:"title.function",relevance:0};var T;const k={
begin:l(/\./,o(l(d,/(?![0-9A-Za-z$_(])/))),end:d,excludeBegin:!0,
keywords:"prototype",className:"property",relevance:0},M={
match:[/get|set/,/\s+/,d,/(?=\()/],className:{1:"keyword",3:"title.function"},
contains:[{begin:/\(\)/},S]
},C="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+b.UNDERSCORE_IDENT_RE+")\\s*=>",B={
match:[/const|var|let/,/\s+/,d,/\s*/,/=\s*/,o(C)],className:{1:"keyword",
3:"title.function"},contains:[S]};return{name:"Javascript",
aliases:["js","jsx","mjs","cjs"],keywords:u,exports:{PARAMS_CONTAINS:w},
illegal:/#(?![$_A-z])/,contains:[b.SHEBANG({label:"shebang",binary:"node",
relevance:5}),{label:"use_strict",className:"meta",relevance:10,
begin:/^\s*['"]use (strict|asm)['"]/
},b.APOS_STRING_MODE,b.QUOTE_STRING_MODE,p,_,N,A,y,R,{className:"attr",
begin:d+o(":"),relevance:0},B,{
begin:"("+b.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",
keywords:"return throw case",relevance:0,contains:[A,b.REGEXP_MODE,{
className:"function",begin:C,returnBegin:!0,end:"\\s*=>",contains:[{
className:"params",variants:[{begin:b.UNDERSCORE_IDENT_RE,relevance:0},{
className:null,begin:/\(\s*\)/,skip:!0},{begin:/\(/,end:/\)/,excludeBegin:!0,
excludeEnd:!0,keywords:u,contains:w}]}]},{begin:/,/,relevance:0},{match:/\s+/,
relevance:0},{variants:[{begin:"<>",end:"</>"},{begin:g.begin,
"on:begin":g.isTrulyOpeningTag,end:g.end}],subLanguage:"xml",contains:[{
begin:g.begin,end:g.end,skip:!0,contains:["self"]}]}]},I,{
beginKeywords:"while if switch catch for"},{
begin:"\\b(?!function)"+b.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
returnBegin:!0,label:"func.def",contains:[S,b.inherit(b.TITLE_MODE,{begin:d,
className:"title.function"})]},{match:/\.\.\./,relevance:0},k,{match:"\\$"+d,
relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},
contains:[S]},x,{relevance:0,match:/\b[A-Z][A-Z_]+\b/,
className:"variable.constant"},O,M,{match:/\$[(.]/}]}}(b)
;return Object.assign(m.keywords,d),
m.exports.PARAMS_CONTAINS.push(g),m.contains=m.contains.concat([g,{
beginKeywords:"namespace",end:/\{/,excludeEnd:!0},{beginKeywords:"interface",
end:/\{/,excludeEnd:!0,keywords:"interface extends"
}]),u(m,"shebang",b.SHEBANG()),u(m,"use_strict",{className:"meta",relevance:10,
begin:/^\s*['"]use strict['"]/
}),m.contains.find((e=>"func.def"===e.label)).relevance=0,Object.assign(m,{
name:"TypeScript",aliases:["ts","tsx"]}),m}})());hljs.registerLanguage("lua",(()=>{"use strict";return e=>{
const t="\\[=*\\[",a="\\]=*\\]",n={begin:t,end:a,contains:["self"]
},o=[e.COMMENT("--(?!\\[=*\\[)","$"),e.COMMENT("--\\[=*\\[",a,{contains:[n],
relevance:10})];return{name:"Lua",keywords:{$pattern:e.UNDERSCORE_IDENT_RE,
literal:"true false nil",
keyword:"and break do else elseif end for goto if in local not or repeat return then until while",
built_in:"_G _ENV _VERSION __index __newindex __mode __call __metatable __tostring __len __gc __add __sub __mul __div __mod __pow __concat __unm __eq __lt __le assert collectgarbage dofile error getfenv getmetatable ipairs load loadfile loadstring module next pairs pcall print rawequal rawget rawset require select setfenv setmetatable tonumber tostring type unpack xpcall arg self coroutine resume yield status wrap create running debug getupvalue debug sethook getmetatable gethook setmetatable setlocal traceback setfenv getinfo setupvalue getlocal getregistry getfenv io lines write close flush open output type read stderr stdin input stdout popen tmpfile math log max acos huge ldexp pi cos tanh pow deg tan cosh sinh random randomseed frexp ceil floor rad abs sqrt modf asin min mod fmod log10 atan2 exp sin atan os exit setlocale date getenv difftime remove time clock tmpname rename execute package preload loadlib loaded loaders cpath config path seeall string sub upper len gfind rep find match char dump gmatch reverse byte format gsub lower table setn insert getn foreachi maxn foreach concat sort remove"
},contains:o.concat([{className:"function",beginKeywords:"function",end:"\\)",
contains:[e.inherit(e.TITLE_MODE,{
begin:"([_a-zA-Z]\\w*\\.)*([_a-zA-Z]\\w*:)?[_a-zA-Z]\\w*"}),{className:"params",
begin:"\\(",endsWithParent:!0,contains:o}].concat(o)
},e.C_NUMBER_MODE,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,{className:"string",
begin:t,end:a,contains:[n],relevance:5}])}}})());hljs.registerLanguage("erlang",(()=>{"use strict";return e=>{
const n="[a-z'][a-zA-Z0-9_']*",r="("+n+":"+n+"|"+n+")",a={
keyword:"after and andalso|10 band begin bnot bor bsl bzr bxor case catch cond div end fun if let not of orelse|10 query receive rem try when xor",
literal:"false true"},i=e.COMMENT("%","$"),s={className:"number",
begin:"\\b(\\d+(_\\d+)*#[a-fA-F0-9]+(_[a-fA-F0-9]+)*|\\d+(_\\d+)*(\\.\\d+(_\\d+)*)?([eE][-+]?\\d+)?)",
relevance:0},c={begin:"fun\\s+"+n+"/\\d+"},t={begin:r+"\\(",end:"\\)",
returnBegin:!0,relevance:0,contains:[{begin:r,relevance:0},{begin:"\\(",
end:"\\)",endsWithParent:!0,returnEnd:!0,relevance:0}]},d={begin:/\{/,end:/\}/,
relevance:0},o={begin:"\\b_([A-Z][A-Za-z0-9_]*)?",relevance:0},l={
begin:"[A-Z][a-zA-Z0-9_]*",relevance:0},b={begin:"#"+e.UNDERSCORE_IDENT_RE,
relevance:0,returnBegin:!0,contains:[{begin:"#"+e.UNDERSCORE_IDENT_RE,
relevance:0},{begin:/\{/,end:/\}/,relevance:0}]},g={
beginKeywords:"fun receive if try case",end:"end",keywords:a}
;g.contains=[i,c,e.inherit(e.APOS_STRING_MODE,{className:""
}),g,t,e.QUOTE_STRING_MODE,s,d,o,l,b]
;const E=[i,c,g,t,e.QUOTE_STRING_MODE,s,d,o,l,b]
;t.contains[1].contains=E,d.contains=E,b.contains[1].contains=E;const u={
className:"params",begin:"\\(",end:"\\)",contains:E};return{name:"Erlang",
aliases:["erl"],keywords:a,illegal:"(</|\\*=|\\+=|-=|/\\*|\\*/|\\(\\*|\\*\\))",
contains:[{className:"function",begin:"^"+n+"\\s*\\(",end:"->",returnBegin:!0,
illegal:"\\(|#|//|/\\*|\\\\|:|;",contains:[u,e.inherit(e.TITLE_MODE,{begin:n})],
starts:{end:";|\\.",keywords:a,contains:E}},i,{begin:"^-",end:"\\.",relevance:0,
excludeEnd:!0,returnBegin:!0,keywords:{$pattern:"-"+e.IDENT_RE,
keyword:["-module","-record","-undef","-export","-ifdef","-ifndef","-author","-copyright","-doc","-vsn","-import","-include","-include_lib","-compile","-define","-else","-endif","-file","-behaviour","-behavior","-spec"].map((e=>e+"|1.5")).join(" ")
},contains:[u]},s,e.QUOTE_STRING_MODE,b,o,l,d,{begin:/\.$/}]}}})());hljs.registerLanguage("markdown",(()=>{"use strict";function n(...n){
return n.map((n=>{return(e=n)?"string"==typeof e?e:e.source:null;var e
})).join("")}return e=>{const a={begin:/<\/?[A-Za-z_]/,end:">",
subLanguage:"xml",relevance:0},i={variants:[{begin:/\[.+?\]\[.*?\]/,relevance:0
},{begin:/\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,
relevance:2},{begin:n(/\[.+?\]\(/,/[A-Za-z][A-Za-z0-9+.-]*/,/:\/\/.*?\)/),
relevance:2},{begin:/\[.+?\]\([./?&#].*?\)/,relevance:1},{
begin:/\[.+?\]\(.*?\)/,relevance:0}],returnBegin:!0,contains:[{
className:"string",relevance:0,begin:"\\[",end:"\\]",excludeBegin:!0,
returnEnd:!0},{className:"link",relevance:0,begin:"\\]\\(",end:"\\)",
excludeBegin:!0,excludeEnd:!0},{className:"symbol",relevance:0,begin:"\\]\\[",
end:"\\]",excludeBegin:!0,excludeEnd:!0}]},s={className:"strong",contains:[],
variants:[{begin:/_{2}/,end:/_{2}/},{begin:/\*{2}/,end:/\*{2}/}]},c={
className:"emphasis",contains:[],variants:[{begin:/\*(?!\*)/,end:/\*/},{
begin:/_(?!_)/,end:/_/,relevance:0}]};s.contains.push(c),c.contains.push(s)
;let t=[a,i]
;return s.contains=s.contains.concat(t),c.contains=c.contains.concat(t),
t=t.concat(s,c),{name:"Markdown",aliases:["md","mkdown","mkd"],contains:[{
className:"section",variants:[{begin:"^#{1,6}",end:"$",contains:t},{
begin:"(?=^.+?\\n[=-]{2,}$)",contains:[{begin:"^[=-]*$"},{begin:"^",end:"\\n",
contains:t}]}]},a,{className:"bullet",begin:"^[ \t]*([*+-]|(\\d+\\.))(?=\\s+)",
end:"\\s+",excludeEnd:!0},s,c,{className:"quote",begin:"^>\\s+",contains:t,
end:"$"},{className:"code",variants:[{begin:"(`{3,})[^`](.|\\n)*?\\1`*[ ]*"},{
begin:"(~{3,})[^~](.|\\n)*?\\1~*[ ]*"},{begin:"```",end:"```+[ ]*$"},{
begin:"~~~",end:"~~~+[ ]*$"},{begin:"`.+?`"},{begin:"(?=^( {4}|\\t))",
contains:[{begin:"^( {4}|\\t)",end:"(\\n)$"}],relevance:0}]},{
begin:"^[-\\*]{3,}",end:"$"},i,{begin:/^\[[^\n]+\]:/,returnBegin:!0,contains:[{
className:"symbol",begin:/\[/,end:/\]/,excludeBegin:!0,excludeEnd:!0},{
className:"link",begin:/:\s*/,end:/$/,excludeBegin:!0}]}]}}})());hljs.registerLanguage("dart",(()=>{"use strict";return e=>{const n={
className:"subst",variants:[{begin:"\\$[A-Za-z0-9_]+"}]},a={className:"subst",
variants:[{begin:/\$\{/,end:/\}/}],keywords:"true false null this is new super"
},t={className:"string",variants:[{begin:"r'''",end:"'''"},{begin:'r"""',
end:'"""'},{begin:"r'",end:"'",illegal:"\\n"},{begin:'r"',end:'"',illegal:"\\n"
},{begin:"'''",end:"'''",contains:[e.BACKSLASH_ESCAPE,n,a]},{begin:'"""',
end:'"""',contains:[e.BACKSLASH_ESCAPE,n,a]},{begin:"'",end:"'",illegal:"\\n",
contains:[e.BACKSLASH_ESCAPE,n,a]},{begin:'"',end:'"',illegal:"\\n",
contains:[e.BACKSLASH_ESCAPE,n,a]}]};a.contains=[e.C_NUMBER_MODE,t]
;const i=["Comparable","DateTime","Duration","Function","Iterable","Iterator","List","Map","Match","Object","Pattern","RegExp","Set","Stopwatch","String","StringBuffer","StringSink","Symbol","Type","Uri","bool","double","int","num","Element","ElementList"],r=i.map((e=>e+"?"))
;return{name:"Dart",keywords:{
keyword:["abstract","as","assert","async","await","break","case","catch","class","const","continue","covariant","default","deferred","do","dynamic","else","enum","export","extends","extension","external","factory","false","final","finally","for","Function","get","hide","if","implements","import","in","inferface","is","late","library","mixin","new","null","on","operator","part","required","rethrow","return","set","show","static","super","switch","sync","this","throw","true","try","typedef","var","void","while","with","yield"],
built_in:i.concat(r).concat(["Never","Null","dynamic","print","document","querySelector","querySelectorAll","window"]),
$pattern:/[A-Za-z][A-Za-z0-9_]*\??/},
contains:[t,e.COMMENT(/\/\*\*(?!\/)/,/\*\//,{subLanguage:"markdown",relevance:0
}),e.COMMENT(/\/{3,} ?/,/$/,{contains:[{subLanguage:"markdown",begin:".",
end:"$",relevance:0}]}),e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{
className:"class",beginKeywords:"class interface",end:/\{/,excludeEnd:!0,
contains:[{beginKeywords:"extends implements"},e.UNDERSCORE_TITLE_MODE]
},e.C_NUMBER_MODE,{className:"meta",begin:"@[A-Za-z]+"},{begin:"=>"}]}}})());hljs.registerLanguage("csharp",(()=>{"use strict";return e=>{const n={
keyword:["abstract","as","base","break","case","class","const","continue","do","else","event","explicit","extern","finally","fixed","for","foreach","goto","if","implicit","in","interface","internal","is","lock","namespace","new","operator","out","override","params","private","protected","public","readonly","record","ref","return","sealed","sizeof","stackalloc","static","struct","switch","this","throw","try","typeof","unchecked","unsafe","using","virtual","void","volatile","while"].concat(["add","alias","and","ascending","async","await","by","descending","equals","from","get","global","group","init","into","join","let","nameof","not","notnull","on","or","orderby","partial","remove","select","set","unmanaged","value|0","var","when","where","with","yield"]),
built_in:["bool","byte","char","decimal","delegate","double","dynamic","enum","float","int","long","nint","nuint","object","sbyte","short","string","ulong","uint","ushort"],
literal:["default","false","null","true"]},i=e.inherit(e.TITLE_MODE,{
begin:"[a-zA-Z](\\.?\\w)*"}),a={className:"number",variants:[{
begin:"\\b(0b[01']+)"},{
begin:"(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)(u|U|l|L|ul|UL|f|F|b|B)"},{
begin:"(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)"
}],relevance:0},s={className:"string",begin:'@"',end:'"',contains:[{begin:'""'}]
},t=e.inherit(s,{illegal:/\n/}),r={className:"subst",begin:/\{/,end:/\}/,
keywords:n},l=e.inherit(r,{illegal:/\n/}),c={className:"string",begin:/\$"/,
end:'"',illegal:/\n/,contains:[{begin:/\{\{/},{begin:/\}\}/
},e.BACKSLASH_ESCAPE,l]},o={className:"string",begin:/\$@"/,end:'"',contains:[{
begin:/\{\{/},{begin:/\}\}/},{begin:'""'},r]},d=e.inherit(o,{illegal:/\n/,
contains:[{begin:/\{\{/},{begin:/\}\}/},{begin:'""'},l]})
;r.contains=[o,c,s,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,a,e.C_BLOCK_COMMENT_MODE],
l.contains=[d,c,t,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,a,e.inherit(e.C_BLOCK_COMMENT_MODE,{
illegal:/\n/})];const g={variants:[o,c,s,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]
},E={begin:"<",end:">",contains:[{beginKeywords:"in out"},i]
},_=e.IDENT_RE+"(<"+e.IDENT_RE+"(\\s*,\\s*"+e.IDENT_RE+")*>)?(\\[\\])?",b={
begin:"@"+e.IDENT_RE,relevance:0};return{name:"C#",aliases:["cs","c#"],
keywords:n,illegal:/::/,contains:[e.COMMENT("///","$",{returnBegin:!0,
contains:[{className:"doctag",variants:[{begin:"///",relevance:0},{
begin:"\x3c!--|--\x3e"},{begin:"</?",end:">"}]}]
}),e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{className:"meta",begin:"#",
end:"$",keywords:{
keyword:"if else elif endif define undef warning error line region endregion pragma checksum"
}},g,a,{beginKeywords:"class interface",relevance:0,end:/[{;=]/,
illegal:/[^\s:,]/,contains:[{beginKeywords:"where class"
},i,E,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{beginKeywords:"namespace",
relevance:0,end:/[{;=]/,illegal:/[^\s:]/,
contains:[i,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{
beginKeywords:"record",relevance:0,end:/[{;=]/,illegal:/[^\s:]/,
contains:[i,E,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{className:"meta",
begin:"^\\s*\\[(?=[\\w])",excludeBegin:!0,end:"\\]",excludeEnd:!0,contains:[{
className:"string",begin:/"/,end:/"/}]},{
beginKeywords:"new return throw await else",relevance:0},{className:"function",
begin:"("+_+"\\s+)+"+e.IDENT_RE+"\\s*(<.+>\\s*)?\\(",returnBegin:!0,
end:/\s*[{;=]/,excludeEnd:!0,keywords:n,contains:[{
beginKeywords:"public private protected static internal protected abstract async extern override unsafe virtual new sealed partial",
relevance:0},{begin:e.IDENT_RE+"\\s*(<.+>\\s*)?\\(",returnBegin:!0,
contains:[e.TITLE_MODE,E],relevance:0},{className:"params",begin:/\(/,end:/\)/,
excludeBegin:!0,excludeEnd:!0,keywords:n,relevance:0,
contains:[g,a,e.C_BLOCK_COMMENT_MODE]
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},b]}}})());hljs.registerLanguage("c",(()=>{"use strict";function e(e){
return((...e)=>e.map((e=>(e=>e?"string"==typeof e?e:e.source:null)(e))).join(""))("(?:",e,")?")
}return n=>{const t=n.COMMENT("//","$",{contains:[{begin:/\\\n/}]
}),s="[a-zA-Z_]\\w*::",r="(decltype\\(auto\\)|"+e(s)+"[a-zA-Z_]\\w*"+e("<[^<>]+>")+")",a={
className:"type",variants:[{begin:"\\b[a-z\\d_]*_t\\b"},{
match:/\batomic_[a-z]{3,6}\b/}]},i={className:"string",variants:[{
begin:'(u8?|U|L)?"',end:'"',illegal:"\\n",contains:[n.BACKSLASH_ESCAPE]},{
begin:"(u8?|U|L)?'(\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)|.)",
end:"'",illegal:"."},n.END_SAME_AS_BEGIN({
begin:/(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,end:/\)([^()\\ ]{0,16})"/})]},l={
className:"number",variants:[{begin:"\\b(0b[01']+)"},{
begin:"(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)"
},{
begin:"(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)"
}],relevance:0},c={className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,keywords:{
keyword:"if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include"
},contains:[{begin:/\\\n/,relevance:0},n.inherit(i,{className:"string"}),{
className:"string",begin:/<.*?>/},t,n.C_BLOCK_COMMENT_MODE]},o={
className:"title",begin:e(s)+n.IDENT_RE,relevance:0
},d=e(s)+n.IDENT_RE+"\\s*\\(",u={
keyword:["asm","auto","break","case","const","continue","default","do","else","enum","extern","for","fortran","goto","if","inline","register","restrict","return","sizeof","static","struct","switch","typedef","union","volatile","while","_Alignas","_Alignof","_Atomic","_Generic","_Noreturn","_Static_assert","_Thread_local","alignas","alignof","noreturn","static_assert","thread_local","_Pragma"],
type:["float","double","signed","unsigned","int","short","long","char","void","_Bool","_Complex","_Imaginary","_Decimal32","_Decimal64","_Decimal128","complex","bool","imaginary"],
literal:"true false NULL",
built_in:"std string wstring cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream auto_ptr deque list queue stack vector map set pair bitset multiset multimap unordered_set unordered_map unordered_multiset unordered_multimap priority_queue make_pair array shared_ptr abort terminate abs acos asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp fscanf future isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan vfprintf vprintf vsprintf endl initializer_list unique_ptr"
},g=[c,a,t,n.C_BLOCK_COMMENT_MODE,l,i],m={variants:[{begin:/=/,end:/;/},{
begin:/\(/,end:/\)/},{beginKeywords:"new throw return else",end:/;/}],
keywords:u,contains:g.concat([{begin:/\(/,end:/\)/,keywords:u,
contains:g.concat(["self"]),relevance:0}]),relevance:0},_={
begin:"("+r+"[\\*&\\s]+)+"+d,returnBegin:!0,end:/[{;=]/,excludeEnd:!0,
keywords:u,illegal:/[^\w\s\*&:<>.]/,contains:[{begin:"decltype\\(auto\\)",
keywords:u,relevance:0},{begin:d,returnBegin:!0,contains:[n.inherit(o,{
className:"title.function"})],relevance:0},{relevance:0,match:/,/},{
className:"params",begin:/\(/,end:/\)/,keywords:u,relevance:0,
contains:[t,n.C_BLOCK_COMMENT_MODE,i,l,a,{begin:/\(/,end:/\)/,keywords:u,
relevance:0,contains:["self",t,n.C_BLOCK_COMMENT_MODE,i,l,a]}]
},a,t,n.C_BLOCK_COMMENT_MODE,c]};return{name:"C",aliases:["h"],keywords:u,
disableAutodetect:!0,illegal:"</",contains:[].concat(m,_,g,[c,{
begin:n.IDENT_RE+"::",keywords:u},{className:"class",
beginKeywords:"enum class struct union",end:/[{;:<>=]/,contains:[{
beginKeywords:"final class struct"},n.TITLE_MODE]}]),exports:{preprocessor:c,
strings:i,keywords:u}}}})());hljs.registerLanguage("perl",(()=>{"use strict";function e(e){
return e?"string"==typeof e?e:e.source:null}function n(...n){
return n.map((n=>e(n))).join("")}function t(...n){return"("+((e=>{
const n=e[e.length-1]
;return"object"==typeof n&&n.constructor===Object?(e.splice(e.length-1,1),n):{}
})(n).capture?"":"?:")+n.map((n=>e(n))).join("|")+")"}return e=>{
const r=/[dualxmsipngr]{0,12}/,s={$pattern:/[\w.]+/,
keyword:"abs accept alarm and atan2 bind binmode bless break caller chdir chmod chomp chop chown chr chroot close closedir connect continue cos crypt dbmclose dbmopen defined delete die do dump each else elsif endgrent endhostent endnetent endprotoent endpwent endservent eof eval exec exists exit exp fcntl fileno flock for foreach fork format formline getc getgrent getgrgid getgrnam gethostbyaddr gethostbyname gethostent getlogin getnetbyaddr getnetbyname getnetent getpeername getpgrp getpriority getprotobyname getprotobynumber getprotoent getpwent getpwnam getpwuid getservbyname getservbyport getservent getsockname getsockopt given glob gmtime goto grep gt hex if index int ioctl join keys kill last lc lcfirst length link listen local localtime log lstat lt ma map mkdir msgctl msgget msgrcv msgsnd my ne next no not oct open opendir or ord our pack package pipe pop pos print printf prototype push q|0 qq quotemeta qw qx rand read readdir readline readlink readpipe recv redo ref rename require reset return reverse rewinddir rindex rmdir say scalar seek seekdir select semctl semget semop send setgrent sethostent setnetent setpgrp setpriority setprotoent setpwent setservent setsockopt shift shmctl shmget shmread shmwrite shutdown sin sleep socket socketpair sort splice split sprintf sqrt srand stat state study sub substr symlink syscall sysopen sysread sysseek system syswrite tell telldir tie tied time times tr truncate uc ucfirst umask undef unless unlink unpack unshift untie until use utime values vec wait waitpid wantarray warn when while write x|0 xor y|0"
},i={className:"subst",begin:"[$@]\\{",end:"\\}",keywords:s},a={begin:/->\{/,
end:/\}/},o={variants:[{begin:/\$\d/},{
begin:n(/[$%@](\^\w\b|#\w+(::\w+)*|\{\w+\}|\w+(::\w*)*)/,"(?![A-Za-z])(?![@$%])")
},{begin:/[$%@][^\s\w{]/,relevance:0}]
},c=[e.BACKSLASH_ESCAPE,i,o],g=[/!/,/\//,/\|/,/\?/,/'/,/"/,/#/],l=(e,t,s="\\1")=>{
const i="\\1"===s?s:n(s,t)
;return n(n("(?:",e,")"),t,/(?:\\.|[^\\\/])*?/,i,/(?:\\.|[^\\\/])*?/,s,r)
},d=(e,t,s)=>n(n("(?:",e,")"),t,/(?:\\.|[^\\\/])*?/,s,r),p=[o,e.HASH_COMMENT_MODE,e.COMMENT(/^=\w/,/=cut/,{
endsWithParent:!0}),a,{className:"string",contains:c,variants:[{
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
begin:l("s|tr|y",t(...g,{capture:!0}))},{begin:l("s|tr|y","\\(","\\)")},{
begin:l("s|tr|y","\\[","\\]")},{begin:l("s|tr|y","\\{","\\}")}],relevance:2},{
className:"regexp",variants:[{begin:/(m|qr)\/\//,relevance:0},{
begin:d("(?:m|qr)?",/\//,/\//)},{begin:d("m|qr",t(...g,{capture:!0}),/\1/)},{
begin:d("m|qr",/\(/,/\)/)},{begin:d("m|qr",/\[/,/\]/)},{
begin:d("m|qr",/\{/,/\}/)}]}]},{className:"function",beginKeywords:"sub",
end:"(\\s*\\(.*?\\))?[;{]",excludeEnd:!0,relevance:5,contains:[e.TITLE_MODE]},{
begin:"-\\w\\b",relevance:0},{begin:"^__DATA__$",end:"^__END__$",
subLanguage:"mojolicious",contains:[{begin:"^@@.*",end:"$",className:"comment"}]
}];return i.contains=p,a.contains=p,{name:"Perl",aliases:["pl","pm"],keywords:s,
contains:p}}})());hljs.registerLanguage("vbnet",(()=>{"use strict";function e(e){
return e?"string"==typeof e?e:e.source:null}function n(...n){
return n.map((n=>e(n))).join("")}function t(...n){return"("+((e=>{
const n=e[e.length-1]
;return"object"==typeof n&&n.constructor===Object?(e.splice(e.length-1,1),n):{}
})(n).capture?"":"?:")+n.map((n=>e(n))).join("|")+")"}return e=>{
const a=/\d{1,2}\/\d{1,2}\/\d{4}/,i=/\d{4}-\d{1,2}-\d{1,2}/,s=/(\d|1[012])(:\d+){0,2} *(AM|PM)/,r=/\d{1,2}(:\d{1,2}){1,2}/,o={
className:"literal",variants:[{begin:n(/# */,t(i,a),/ *#/)},{
begin:n(/# */,r,/ *#/)},{begin:n(/# */,s,/ *#/)},{
begin:n(/# */,t(i,a),/ +/,t(s,r),/ *#/)}]},l=e.COMMENT(/'''/,/$/,{contains:[{
className:"doctag",begin:/<\/?/,end:/>/}]}),c=e.COMMENT(null,/$/,{variants:[{
begin:/'/},{begin:/([\t ]|^)REM(?=\s)/}]});return{name:"Visual Basic .NET",
aliases:["vb"],case_insensitive:!0,classNameAliases:{label:"symbol"},keywords:{
keyword:"addhandler alias aggregate ansi as async assembly auto binary by byref byval call case catch class compare const continue custom declare default delegate dim distinct do each equals else elseif end enum erase error event exit explicit finally for friend from function get global goto group handles if implements imports in inherits interface into iterator join key let lib loop me mid module mustinherit mustoverride mybase myclass namespace narrowing new next notinheritable notoverridable of off on operator option optional order overloads overridable overrides paramarray partial preserve private property protected public raiseevent readonly redim removehandler resume return select set shadows shared skip static step stop structure strict sub synclock take text then throw to try unicode until using when where while widening with withevents writeonly yield",
built_in:"addressof and andalso await directcast gettype getxmlnamespace is isfalse isnot istrue like mod nameof new not or orelse trycast typeof xor cbool cbyte cchar cdate cdbl cdec cint clng cobj csbyte cshort csng cstr cuint culng cushort",
type:"boolean byte char date decimal double integer long object sbyte short single string uinteger ulong ushort",
literal:"true false nothing"},
illegal:"//|\\{|\\}|endif|gosub|variant|wend|^\\$ ",contains:[{
className:"string",begin:/"(""|[^/n])"C\b/},{className:"string",begin:/"/,
end:/"/,illegal:/\n/,contains:[{begin:/""/}]},o,{className:"number",relevance:0,
variants:[{begin:/\b\d[\d_]*((\.[\d_]+(E[+-]?[\d_]+)?)|(E[+-]?[\d_]+))[RFD@!#]?/
},{begin:/\b\d[\d_]*((U?[SIL])|[%&])?/},{begin:/&H[\dA-F_]+((U?[SIL])|[%&])?/},{
begin:/&O[0-7_]+((U?[SIL])|[%&])?/},{begin:/&B[01_]+((U?[SIL])|[%&])?/}]},{
className:"label",begin:/^\w+:/},l,c,{className:"meta",
begin:/[\t ]*#(const|disable|else|elseif|enable|end|externalsource|if|region)\b/,
end:/$/,keywords:{
keyword:"const disable else elseif enable end externalsource if region then"},
contains:[c]}]}}})());hljs.registerLanguage("rust",(()=>{"use strict";function e(...e){
return e.map((e=>{return(t=e)?"string"==typeof t?t:t.source:null;var t
})).join("")}return t=>{const n={className:"title.function.invoke",relevance:0,
begin:e(/\b/,/(?!let\b)/,t.IDENT_RE,(a=/\s*\(/,e("(?=",a,")")))};var a
;const r="([ui](8|16|32|64|128|size)|f(32|64))?",i=["drop ","Copy","Send","Sized","Sync","Drop","Fn","FnMut","FnOnce","ToOwned","Clone","Debug","PartialEq","PartialOrd","Eq","Ord","AsRef","AsMut","Into","From","Default","Iterator","Extend","IntoIterator","DoubleEndedIterator","ExactSizeIterator","SliceConcatExt","ToString","assert!","assert_eq!","bitflags!","bytes!","cfg!","col!","concat!","concat_idents!","debug_assert!","debug_assert_eq!","env!","panic!","file!","format!","format_args!","include_bin!","include_str!","line!","local_data_key!","module_path!","option_env!","print!","println!","select!","stringify!","try!","unimplemented!","unreachable!","vec!","write!","writeln!","macro_rules!","assert_ne!","debug_assert_ne!"]
;return{name:"Rust",aliases:["rs"],keywords:{$pattern:t.IDENT_RE+"!?",
type:["i8","i16","i32","i64","i128","isize","u8","u16","u32","u64","u128","usize","f32","f64","str","char","bool","Box","Option","Result","String","Vec"],
keyword:["abstract","as","async","await","become","box","break","const","continue","crate","do","dyn","else","enum","extern","false","final","fn","for","if","impl","in","let","loop","macro","match","mod","move","mut","override","priv","pub","ref","return","self","Self","static","struct","super","trait","true","try","type","typeof","unsafe","unsized","use","virtual","where","while","yield"],
literal:["true","false","Some","None","Ok","Err"],built_in:i},illegal:"</",
contains:[t.C_LINE_COMMENT_MODE,t.COMMENT("/\\*","\\*/",{contains:["self"]
}),t.inherit(t.QUOTE_STRING_MODE,{begin:/b?"/,illegal:null}),{
className:"string",variants:[{begin:/b?r(#*)"(.|\n)*?"\1(?!#)/},{
begin:/b?'\\?(x\w{2}|u\w{4}|U\w{8}|.)'/}]},{className:"symbol",
begin:/'[a-zA-Z_][a-zA-Z0-9_]*/},{className:"number",variants:[{
begin:"\\b0b([01_]+)"+r},{begin:"\\b0o([0-7_]+)"+r},{
begin:"\\b0x([A-Fa-f0-9_]+)"+r},{
begin:"\\b(\\d[\\d_]*(\\.[0-9_]+)?([eE][+-]?[0-9_]+)?)"+r}],relevance:0},{
begin:[/fn/,/\s+/,t.UNDERSCORE_IDENT_RE],className:{1:"keyword",
3:"title.function"}},{className:"meta",begin:"#!?\\[",end:"\\]",contains:[{
className:"string",begin:/"/,end:/"/}]},{
begin:[/let/,/\s+/,/(?:mut\s+)?/,t.UNDERSCORE_IDENT_RE],className:{1:"keyword",
3:"keyword",4:"variable"}},{
begin:[/for/,/\s+/,t.UNDERSCORE_IDENT_RE,/\s+/,/in/],className:{1:"keyword",
3:"variable",5:"keyword"}},{begin:[/type/,/\s+/,t.UNDERSCORE_IDENT_RE],
className:{1:"keyword",3:"title.class"}},{
begin:[/(?:trait|enum|struct|union|impl|for)/,/\s+/,t.UNDERSCORE_IDENT_RE],
className:{1:"keyword",3:"title.class"}},{begin:t.IDENT_RE+"::",keywords:{
keyword:"Self",built_in:i}},{className:"punctuation",begin:"->"},n]}}})());hljs.registerLanguage("dockerfile",(()=>{"use strict";return e=>({
name:"Dockerfile",aliases:["docker"],case_insensitive:!0,
keywords:["from","maintainer","expose","env","arg","user","onbuild","stopsignal"],
contains:[e.HASH_COMMENT_MODE,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,e.NUMBER_MODE,{
beginKeywords:"run cmd entrypoint volume add copy workdir label healthcheck shell",
starts:{end:/[^\\]$/,subLanguage:"bash"}}],illegal:"</"})})());hljs.registerLanguage("go",(()=>{"use strict";return e=>{const n={
keyword:["break","default","func","interface","select","case","map","struct","chan","else","goto","package","switch","const","fallthrough","if","range","type","continue","for","import","return","var","go","defer","bool","byte","complex64","complex128","float32","float64","int8","int16","int32","int64","string","uint8","uint16","uint32","uint64","int","uint","uintptr","rune"],
literal:["true","false","iota","nil"],
built_in:["append","cap","close","complex","copy","imag","len","make","new","panic","print","println","real","recover","delete"]
};return{name:"Go",aliases:["golang"],keywords:n,illegal:"</",
contains:[e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{className:"string",
variants:[e.QUOTE_STRING_MODE,e.APOS_STRING_MODE,{begin:"`",end:"`"}]},{
className:"number",variants:[{begin:e.C_NUMBER_RE+"[i]",relevance:1
},e.C_NUMBER_MODE]},{begin:/:=/},{className:"function",beginKeywords:"func",
end:"\\s*(\\{|$)",excludeEnd:!0,contains:[e.TITLE_MODE,{className:"params",
begin:/\(/,end:/\)/,keywords:n,illegal:/["']/}]}]}}})());hljs.registerLanguage("yaml",(()=>{"use strict";return e=>{
const n="true false yes no null",a="[\\w#;/?:@&=+$,.~*'()[\\]]+",s={
className:"string",relevance:0,variants:[{begin:/'/,end:/'/},{begin:/"/,end:/"/
},{begin:/\S+/}],contains:[e.BACKSLASH_ESCAPE,{className:"template-variable",
variants:[{begin:/\{\{/,end:/\}\}/},{begin:/%\{/,end:/\}/}]}]},i=e.inherit(s,{
variants:[{begin:/'/,end:/'/},{begin:/"/,end:/"/},{begin:/[^\s,{}[\]]+/}]}),l={
end:",",endsWithParent:!0,excludeEnd:!0,keywords:n,relevance:0},t={begin:/\{/,
end:/\}/,contains:[l],illegal:"\\n",relevance:0},g={begin:"\\[",end:"\\]",
contains:[l],illegal:"\\n",relevance:0},b=[{className:"attr",variants:[{
begin:"\\w[\\w :\\/.-]*:(?=[ \t]|$)"},{begin:'"\\w[\\w :\\/.-]*":(?=[ \t]|$)'},{
begin:"'\\w[\\w :\\/.-]*':(?=[ \t]|$)"}]},{className:"meta",begin:"^---\\s*$",
relevance:10},{className:"string",
begin:"[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"},{
begin:"<%[%=-]?",end:"[%-]?%>",subLanguage:"ruby",excludeBegin:!0,excludeEnd:!0,
relevance:0},{className:"type",begin:"!\\w+!"+a},{className:"type",
begin:"!<"+a+">"},{className:"type",begin:"!"+a},{className:"type",begin:"!!"+a
},{className:"meta",begin:"&"+e.UNDERSCORE_IDENT_RE+"$"},{className:"meta",
begin:"\\*"+e.UNDERSCORE_IDENT_RE+"$"},{className:"bullet",begin:"-(?=[ ]|$)",
relevance:0},e.HASH_COMMENT_MODE,{beginKeywords:n,keywords:{literal:n}},{
className:"number",
begin:"\\b[0-9]{4}(-[0-9][0-9]){0,2}([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?(\\.[0-9]*)?([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?\\b"
},{className:"number",begin:e.C_NUMBER_RE+"\\b",relevance:0},t,g,s],c=[...b]
;return c.pop(),c.push(i),l.contains=c,{name:"YAML",case_insensitive:!0,
aliases:["yml"],contains:b}}})());hljs.registerLanguage("latex",(()=>{"use strict";function e(...e){
return"("+((e=>{const n=e[e.length-1]
;return"object"==typeof n&&n.constructor===Object?(e.splice(e.length-1,1),n):{}
})(e).capture?"":"?:")+e.map((e=>{return(n=e)?"string"==typeof n?n:n.source:null
;var n})).join("|")+")"}return n=>{const a=[{begin:/\^{6}[0-9a-f]{6}/},{
begin:/\^{5}[0-9a-f]{5}/},{begin:/\^{4}[0-9a-f]{4}/},{begin:/\^{3}[0-9a-f]{3}/
},{begin:/\^{2}[0-9a-f]{2}/},{begin:/\^{2}[\u0000-\u007f]/}],t=[{
className:"keyword",begin:/\\/,relevance:0,contains:[{endsParent:!0,
begin:e(...["(?:NeedsTeXFormat|RequirePackage|GetIdInfo)","Provides(?:Expl)?(?:Package|Class|File)","(?:DeclareOption|ProcessOptions)","(?:documentclass|usepackage|input|include)","makeat(?:letter|other)","ExplSyntax(?:On|Off)","(?:new|renew|provide)?command","(?:re)newenvironment","(?:New|Renew|Provide|Declare)(?:Expandable)?DocumentCommand","(?:New|Renew|Provide|Declare)DocumentEnvironment","(?:(?:e|g|x)?def|let)","(?:begin|end)","(?:part|chapter|(?:sub){0,2}section|(?:sub)?paragraph)","caption","(?:label|(?:eq|page|name)?ref|(?:paren|foot|super)?cite)","(?:alpha|beta|[Gg]amma|[Dd]elta|(?:var)?epsilon|zeta|eta|[Tt]heta|vartheta)","(?:iota|(?:var)?kappa|[Ll]ambda|mu|nu|[Xx]i|[Pp]i|varpi|(?:var)rho)","(?:[Ss]igma|varsigma|tau|[Uu]psilon|[Pp]hi|varphi|chi|[Pp]si|[Oo]mega)","(?:frac|sum|prod|lim|infty|times|sqrt|leq|geq|left|right|middle|[bB]igg?)","(?:[lr]angle|q?quad|[lcvdi]?dots|d?dot|hat|tilde|bar)"].map((e=>e+"(?![a-zA-Z@:_])")))
},{endsParent:!0,
begin:RegExp(["(?:__)?[a-zA-Z]{2,}_[a-zA-Z](?:_?[a-zA-Z])+:[a-zA-Z]*","[lgc]__?[a-zA-Z](?:_?[a-zA-Z])*_[a-zA-Z]{2,}","[qs]__?[a-zA-Z](?:_?[a-zA-Z])+","use(?:_i)?:[a-zA-Z]*","(?:else|fi|or):","(?:if|cs|exp):w","(?:hbox|vbox):n","::[a-zA-Z]_unbraced","::[a-zA-Z:]"].map((e=>e+"(?![a-zA-Z:_])")).join("|"))
},{endsParent:!0,variants:a},{endsParent:!0,relevance:0,variants:[{
begin:/[a-zA-Z@]+/},{begin:/[^a-zA-Z@]?/}]}]},{className:"params",relevance:0,
begin:/#+\d?/},{variants:a},{className:"built_in",relevance:0,begin:/[$&^_]/},{
className:"meta",begin:"% !TeX",end:"$",relevance:10},n.COMMENT("%","$",{
relevance:0})],i={begin:/\{/,end:/\}/,relevance:0,contains:["self",...t]
},r=n.inherit(i,{relevance:0,endsParent:!0,contains:[i,...t]}),s={begin:/\[/,
end:/\]/,endsParent:!0,relevance:0,contains:[i,...t]},c={begin:/\s+/,relevance:0
},l=[r],o=[s],d=(e,n)=>({contains:[c],starts:{relevance:0,contains:e,starts:n}
}),g=(e,n)=>({begin:"\\\\"+e+"(?![a-zA-Z@:_])",keywords:{$pattern:/\\[a-zA-Z]+/,
keyword:"\\"+e},relevance:0,contains:[c],starts:n}),m=(e,a)=>n.inherit({
begin:"\\\\begin(?=[ \t]*(\\r?\\n[ \t]*)?\\{"+e+"\\})",keywords:{
$pattern:/\\[a-zA-Z]+/,keyword:"\\begin"},relevance:0
},d(l,a)),b=(e="string")=>n.END_SAME_AS_BEGIN({className:e,begin:/(.|\r?\n)/,
end:/(.|\r?\n)/,excludeBegin:!0,excludeEnd:!0,endsParent:!0}),p=e=>({
className:"string",end:"(?=\\\\end\\{"+e+"\\})"}),v=(e="string")=>({relevance:0,
begin:/\{/,starts:{endsParent:!0,contains:[{className:e,end:/(?=\})/,
endsParent:!0,contains:[{begin:/\{/,end:/\}/,relevance:0,contains:["self"]}]}]}
});return{name:"LaTeX",aliases:["tex"],
contains:[...["verb","lstinline"].map((e=>g(e,{contains:[b()]}))),g("mint",d(l,{
contains:[b()]})),g("mintinline",d(l,{contains:[v(),b()]})),g("url",{
contains:[v("link"),v("link")]}),g("hyperref",{contains:[v("link")]
}),g("href",d(o,{contains:[v("link")]
})),...[].concat(...["","\\*"].map((e=>[m("verbatim"+e,p("verbatim"+e)),m("filecontents"+e,d(l,p("filecontents"+e))),...["","B","L"].map((n=>m(n+"Verbatim"+e,d(o,p(n+"Verbatim"+e)))))]))),m("minted",d(o,d(l,p("minted")))),...t]
}}})());hljs.registerLanguage("diff",(()=>{"use strict";function e(...e){
return"("+((e=>{const n=e[e.length-1]
;return"object"==typeof n&&n.constructor===Object?(e.splice(e.length-1,1),n):{}
})(e).capture?"":"?:")+e.map((e=>{return(n=e)?"string"==typeof n?n:n.source:null
;var n})).join("|")+")"}return n=>({name:"Diff",aliases:["patch"],contains:[{
className:"meta",relevance:10,
match:e(/^@@ +-\d+,\d+ +\+\d+,\d+ +@@/,/^\*\*\* +\d+,\d+ +\*\*\*\*$/,/^--- +\d+,\d+ +----$/)
},{className:"comment",variants:[{
begin:e(/Index: /,/^index/,/={3,}/,/^-{3}/,/^\*{3} /,/^\+{3}/,/^diff --git/),
end:/$/},{match:/^\*{15}$/}]},{className:"addition",begin:/^\+/,end:/$/},{
className:"deletion",begin:/^-/,end:/$/},{className:"addition",begin:/^!/,
end:/$/}]})})());hljs.registerLanguage("plaintext",(()=>{"use strict";return t=>({
name:"Plain text",aliases:["text","txt"],disableAutodetect:!0})})());hljs.registerLanguage("scheme",(()=>{"use strict";return e=>{
const t="[^\\(\\)\\[\\]\\{\\}\",'`;#|\\\\\\s]+",n={$pattern:t,
built_in:"case-lambda call/cc class define-class exit-handler field import inherit init-field interface let*-values let-values let/ec mixin opt-lambda override protect provide public rename require require-for-syntax syntax syntax-case syntax-error unit/sig unless when with-syntax and begin call-with-current-continuation call-with-input-file call-with-output-file case cond define define-syntax delay do dynamic-wind else for-each if lambda let let* let-syntax letrec letrec-syntax map or syntax-rules ' * + , ,@ - ... / ; < <= = => > >= ` abs acos angle append apply asin assoc assq assv atan boolean? caar cadr call-with-input-file call-with-output-file call-with-values car cdddar cddddr cdr ceiling char->integer char-alphabetic? char-ci<=? char-ci<? char-ci=? char-ci>=? char-ci>? char-downcase char-lower-case? char-numeric? char-ready? char-upcase char-upper-case? char-whitespace? char<=? char<? char=? char>=? char>? char? close-input-port close-output-port complex? cons cos current-input-port current-output-port denominator display eof-object? eq? equal? eqv? eval even? exact->inexact exact? exp expt floor force gcd imag-part inexact->exact inexact? input-port? integer->char integer? interaction-environment lcm length list list->string list->vector list-ref list-tail list? load log magnitude make-polar make-rectangular make-string make-vector max member memq memv min modulo negative? newline not null-environment null? number->string number? numerator odd? open-input-file open-output-file output-port? pair? peek-char port? positive? procedure? quasiquote quote quotient rational? rationalize read read-char real-part real? remainder reverse round scheme-report-environment set! set-car! set-cdr! sin sqrt string string->list string->number string->symbol string-append string-ci<=? string-ci<? string-ci=? string-ci>=? string-ci>? string-copy string-fill! string-length string-ref string-set! string<=? string<? string=? string>=? string>? string? substring symbol->string symbol? tan transcript-off transcript-on truncate values vector vector->list vector-fill! vector-length vector-ref vector-set! with-input-from-file with-output-to-file write write-char zero?"
},r={className:"literal",begin:"(#t|#f|#\\\\"+t+"|#\\\\.)"},a={
className:"number",variants:[{begin:"(-|\\+)?\\d+([./]\\d+)?",relevance:0},{
begin:"(-|\\+)?\\d+([./]\\d+)?[+\\-](-|\\+)?\\d+([./]\\d+)?i",relevance:0},{
begin:"#b[0-1]+(/[0-1]+)?"},{begin:"#o[0-7]+(/[0-7]+)?"},{
begin:"#x[0-9a-f]+(/[0-9a-f]+)?"}]},i=e.QUOTE_STRING_MODE,c=[e.COMMENT(";","$",{
relevance:0}),e.COMMENT("#\\|","\\|#")],s={begin:t,relevance:0},l={
className:"symbol",begin:"'"+t},o={endsWithParent:!0,relevance:0},g={variants:[{
begin:/'/},{begin:"`"}],contains:[{begin:"\\(",end:"\\)",
contains:["self",r,i,a,s,l]}]},u={className:"name",relevance:0,begin:t,
keywords:n},d={variants:[{begin:"\\(",end:"\\)"},{begin:"\\[",end:"\\]"}],
contains:[{begin:/lambda/,endsWithParent:!0,returnBegin:!0,contains:[u,{
endsParent:!0,variants:[{begin:/\(/,end:/\)/},{begin:/\[/,end:/\]/}],
contains:[s]}]},u,o]};return o.contains=[r,a,i,s,l,g,d].concat(c),{
name:"Scheme",illegal:/\S/,contains:[e.SHEBANG(),a,i,l,g,d].concat(c)}}})());load = s => window

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

__ink_ident_new = () => (() => { let self; return self = {i: __ink_negate(1), next: () => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(self); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(i, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(self); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1)) : (__ink_assgn_trgt.i) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(self); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1); return __ink_assgn_trgt})(); return (() => {let __ink_acc_trgt = __as_ink_string(self); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() })()} })()

std = load(__Ink_String(`../vendor/std`));
log = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[log] || null : (__ink_acc_trgt.log !== undefined ? __ink_acc_trgt.log : null)})();
f = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[format] || null : (__ink_acc_trgt.format !== undefined ? __ink_acc_trgt.format : null)})();
slice = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[slice] || null : (__ink_acc_trgt.slice !== undefined ? __ink_acc_trgt.slice : null)})();
map = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[map] || null : (__ink_acc_trgt.map !== undefined ? __ink_acc_trgt.map : null)})();
reduce = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[reduce] || null : (__ink_acc_trgt.reduce !== undefined ? __ink_acc_trgt.reduce : null)})();
every = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[every] || null : (__ink_acc_trgt.every !== undefined ? __ink_acc_trgt.every : null)})();
str = load(__Ink_String(`../vendor/str`));
digit__ink_qm__ = (() => {let __ink_acc_trgt = __as_ink_string(str); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[digit__ink_qm__] || null : (__ink_acc_trgt.digit__ink_qm__ !== undefined ? __ink_acc_trgt.digit__ink_qm__ : null)})();
hasPrefix__ink_qm__ = (() => {let __ink_acc_trgt = __as_ink_string(str); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[hasPrefix__ink_qm__] || null : (__ink_acc_trgt.hasPrefix__ink_qm__ !== undefined ? __ink_acc_trgt.hasPrefix__ink_qm__ : null)})();
index = (() => {let __ink_acc_trgt = __as_ink_string(str); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[index] || null : (__ink_acc_trgt.index !== undefined ? __ink_acc_trgt.index : null)})();
mkiota = (() => {let __ink_acc_trgt = __as_ink_string(load(__Ink_String(`iota`))); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__ink_ident_new] || null : (__ink_acc_trgt.__ink_ident_new !== undefined ? __ink_acc_trgt.__ink_ident_new : null)})();
Newline = char(10);
Tab = char(9);
iota = (() => {let __ink_acc_trgt = __as_ink_string(mkiota()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[next] || null : (__ink_acc_trgt.next !== undefined ? __ink_acc_trgt.next : null)})();
Tok = {Separator: iota(), Comment: iota(), Ident: iota(), EmptyIdent: iota(), NumberLiteral: iota(), StringLiteral: iota(), TrueLiteral: iota(), FalseLiteral: iota(), AccessorOp: iota(), EqOp: iota(), FunctionArrow: iota(), KeyValueSeparator: iota(), DefineOp: iota(), MatchColon: iota(), CaseArrow: iota(), SubOp: iota(), NegOp: iota(), AddOp: iota(), MulOp: iota(), DivOp: iota(), ModOp: iota(), GtOp: iota(), LtOp: iota(), AndOp: iota(), OrOp: iota(), XorOp: iota(), LParen: iota(), RParen: iota(), LBracket: iota(), RBracket: iota(), LBrace: iota(), RBrace: iota()};
typeName = type => reduce(keys(Tok), (acc, k) => __ink_match((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return k })()] || null : (__ink_acc_trgt[(() => { return k })()] !== undefined ? __ink_acc_trgt[(() => { return k })()] : null)})(), [[() => (type), () => (k)], [() => (__Ink_Empty), () => (acc)]]), __Ink_String(`(unknown token)`));
tkString = tok => f(__Ink_String(`{{ 0 }}({{ 1 }}) @ {{2}}:{{3}}`), [typeName((() => {let __ink_acc_trgt = __as_ink_string(tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})()), (() => {let __ink_acc_trgt = __as_ink_string(tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[val] || null : (__ink_acc_trgt.val !== undefined ? __ink_acc_trgt.val : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})()]);
token = (type, val, line, col, i) => ({type: type, val: val, line: line, col: col, i: i});
tokenizeWithOpt = (s, lexComments) => (() => { let S; let commit; let commitChar; let commitClear; let ensureSeparator; let finalize; let simpleCommit; let simpleCommitChar; let tokens; S = {i: __ink_negate(1), buf: __Ink_String(``), strbuf: __Ink_String(``), strbufLine: 0, strbufCol: 0, lastType: (() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Separator] || null : (__ink_acc_trgt.Separator !== undefined ? __ink_acc_trgt.Separator : null)})(), line: 1, col: 0, inStringLiteral: false}; tokens = []; simpleCommit = tok => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(lastType, (() => {let __ink_acc_trgt = __as_ink_string(tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})()) : (__ink_assgn_trgt.lastType) = (() => {let __ink_acc_trgt = __as_ink_string(tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})(); return __ink_assgn_trgt})(); return (() => {let __ink_assgn_trgt = __as_ink_string(tokens); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(len(tokens), tok) : (__ink_assgn_trgt[len(tokens)]) = tok; return __ink_assgn_trgt})() })(); simpleCommitChar = type => simpleCommit(token(type, null, (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})(), __ink_match(type, [[() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[TrueLiteral] || null : (__ink_acc_trgt.TrueLiteral !== undefined ? __ink_acc_trgt.TrueLiteral : null)})()), () => (((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() - 4))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[FalseLiteral] || null : (__ink_acc_trgt.FalseLiteral !== undefined ? __ink_acc_trgt.FalseLiteral : null)})()), () => (((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() - 5))], [() => (__Ink_Empty), () => (((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() - 1))]]))); commitClear = () => __ink_match((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[buf] || null : (__ink_acc_trgt.buf !== undefined ? __ink_acc_trgt.buf : null)})(), [[() => (__Ink_String(``)), () => (__Ink_Empty)], [() => (__Ink_Empty), () => ((() => { let cbuf; cbuf = (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[buf] || null : (__ink_acc_trgt.buf !== undefined ? __ink_acc_trgt.buf : null)})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(buf, __Ink_String(``)) : (__ink_assgn_trgt.buf) = __Ink_String(``); return __ink_assgn_trgt})(); return __ink_match(cbuf, [[() => (__Ink_String(`true`)), () => (simpleCommitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[TrueLiteral] || null : (__ink_acc_trgt.TrueLiteral !== undefined ? __ink_acc_trgt.TrueLiteral : null)})()))], [() => (__Ink_String(`false`)), () => (simpleCommitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[FalseLiteral] || null : (__ink_acc_trgt.FalseLiteral !== undefined ? __ink_acc_trgt.FalseLiteral : null)})()))], [() => (__Ink_Empty), () => (__ink_match(digit__ink_qm__(cbuf), [[() => (true), () => (simpleCommit(token((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[NumberLiteral] || null : (__ink_acc_trgt.NumberLiteral !== undefined ? __ink_acc_trgt.NumberLiteral : null)})(), number(cbuf), (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})(), ((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})() - len(cbuf)), ((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() - len(cbuf)))))], [() => (false), () => (simpleCommit(token((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Ident] || null : (__ink_acc_trgt.Ident !== undefined ? __ink_acc_trgt.Ident : null)})(), cbuf, (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})(), ((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})() - len(cbuf)), ((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() - len(cbuf)))))]]))]]) })())]]); commit = tok => (() => { commitClear(); return simpleCommit(tok) })(); commitChar = type => commit(token(type, null, (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})())); ensureSeparator = () => (() => { commitClear(); return __ink_match((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[lastType] || null : (__ink_acc_trgt.lastType !== undefined ? __ink_acc_trgt.lastType : null)})(), [[() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Separator] || null : (__ink_acc_trgt.Separator !== undefined ? __ink_acc_trgt.Separator : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[LParen] || null : (__ink_acc_trgt.LParen !== undefined ? __ink_acc_trgt.LParen : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[LBracket] || null : (__ink_acc_trgt.LBracket !== undefined ? __ink_acc_trgt.LBracket : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[LBrace] || null : (__ink_acc_trgt.LBrace !== undefined ? __ink_acc_trgt.LBrace : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[AddOp] || null : (__ink_acc_trgt.AddOp !== undefined ? __ink_acc_trgt.AddOp : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[SubOp] || null : (__ink_acc_trgt.SubOp !== undefined ? __ink_acc_trgt.SubOp : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[MulOp] || null : (__ink_acc_trgt.MulOp !== undefined ? __ink_acc_trgt.MulOp : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[DivOp] || null : (__ink_acc_trgt.DivOp !== undefined ? __ink_acc_trgt.DivOp : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[ModOp] || null : (__ink_acc_trgt.ModOp !== undefined ? __ink_acc_trgt.ModOp : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[NegOp] || null : (__ink_acc_trgt.NegOp !== undefined ? __ink_acc_trgt.NegOp : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[GtOp] || null : (__ink_acc_trgt.GtOp !== undefined ? __ink_acc_trgt.GtOp : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[LtOp] || null : (__ink_acc_trgt.LtOp !== undefined ? __ink_acc_trgt.LtOp : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[EqOp] || null : (__ink_acc_trgt.EqOp !== undefined ? __ink_acc_trgt.EqOp : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[DefineOp] || null : (__ink_acc_trgt.DefineOp !== undefined ? __ink_acc_trgt.DefineOp : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[AccessorOp] || null : (__ink_acc_trgt.AccessorOp !== undefined ? __ink_acc_trgt.AccessorOp : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[KeyValueSeparator] || null : (__ink_acc_trgt.KeyValueSeparator !== undefined ? __ink_acc_trgt.KeyValueSeparator : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[FunctionArrow] || null : (__ink_acc_trgt.FunctionArrow !== undefined ? __ink_acc_trgt.FunctionArrow : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[MatchColon] || null : (__ink_acc_trgt.MatchColon !== undefined ? __ink_acc_trgt.MatchColon : null)})()), () => (null)], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[CaseArrow] || null : (__ink_acc_trgt.CaseArrow !== undefined ? __ink_acc_trgt.CaseArrow : null)})()), () => (null)], [() => (__Ink_Empty), () => (commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Separator] || null : (__ink_acc_trgt.Separator !== undefined ? __ink_acc_trgt.Separator : null)})()))]]) })(); finalize = () => (() => { ensureSeparator(); return tokens })(); __ink_match(hasPrefix__ink_qm__(s, __Ink_String(`#!`)), [[() => (true), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(i, index(s, Newline)) : (__ink_assgn_trgt.i) = index(s, Newline); return __ink_assgn_trgt})(); return (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(line, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})() + 1)) : (__ink_assgn_trgt.line) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})() + 1); return __ink_assgn_trgt})() })())]]); return (() => { let __ink_trampolined_sub; let sub; return sub = () => (() => { __ink_trampolined_sub = () => (() => { let advance; let c; (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(i, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1)) : (__ink_assgn_trgt.i) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(col, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})() + 1)) : (__ink_assgn_trgt.col) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})() + 1); return __ink_assgn_trgt})(); c = (() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() })()] || null : (__ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() })()] !== undefined ? __ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() })()] : null)})(); return __ink_match([c, (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[inStringLiteral] || null : (__ink_acc_trgt.inStringLiteral !== undefined ? __ink_acc_trgt.inStringLiteral : null)})()], [[() => ([null, __Ink_Empty]), () => (finalize())], [() => ([__Ink_String(`'`), __Ink_Empty]), () => (__ink_match((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[inStringLiteral] || null : (__ink_acc_trgt.inStringLiteral !== undefined ? __ink_acc_trgt.inStringLiteral : null)})(), [[() => (true), () => ((() => { commit(token((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[StringLiteral] || null : (__ink_acc_trgt.StringLiteral !== undefined ? __ink_acc_trgt.StringLiteral : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[strbuf] || null : (__ink_acc_trgt.strbuf !== undefined ? __ink_acc_trgt.strbuf : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[strbufLine] || null : (__ink_acc_trgt.strbufLine !== undefined ? __ink_acc_trgt.strbufLine : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[strbufCol] || null : (__ink_acc_trgt.strbufCol !== undefined ? __ink_acc_trgt.strbufCol : null)})(), (((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() - len((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[strbuf] || null : (__ink_acc_trgt.strbuf !== undefined ? __ink_acc_trgt.strbuf : null)})())) - 1))); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(inStringLiteral, false) : (__ink_assgn_trgt.inStringLiteral) = false; return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (false), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(strbuf, __Ink_String(``)) : (__ink_assgn_trgt.strbuf) = __Ink_String(``); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(strbufLine, (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})()) : (__ink_assgn_trgt.strbufLine) = (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})(); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(strbufCol, (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})()) : (__ink_assgn_trgt.strbufCol) = (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})(); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(inStringLiteral, true) : (__ink_assgn_trgt.inStringLiteral) = true; return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())]]))], [() => ([__Ink_Empty, true]), () => (__ink_match(c, [[() => (Newline), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(line, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})() + 1)) : (__ink_assgn_trgt.line) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})() + 1); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(col, 0) : (__ink_assgn_trgt.col) = 0; return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(strbuf, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[strbuf] || null : (__ink_acc_trgt.strbuf !== undefined ? __ink_acc_trgt.strbuf : null)})() + c)) : (__ink_assgn_trgt.strbuf) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[strbuf] || null : (__ink_acc_trgt.strbuf !== undefined ? __ink_acc_trgt.strbuf : null)})() + c); return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`\\`)), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(i, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1)) : (__ink_assgn_trgt.i) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(strbuf, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[strbuf] || null : (__ink_acc_trgt.strbuf !== undefined ? __ink_acc_trgt.strbuf : null)})() + (() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() })()] || null : (__ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() })()] !== undefined ? __ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() })()] : null)})())) : (__ink_assgn_trgt.strbuf) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[strbuf] || null : (__ink_acc_trgt.strbuf !== undefined ? __ink_acc_trgt.strbuf : null)})() + (() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() })()] || null : (__ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() })()] !== undefined ? __ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() })()] : null)})()); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(col, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})() + 1)) : (__ink_assgn_trgt.col) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})() + 1); return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_Empty), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(strbuf, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[strbuf] || null : (__ink_acc_trgt.strbuf !== undefined ? __ink_acc_trgt.strbuf : null)})() + c)) : (__ink_assgn_trgt.strbuf) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[strbuf] || null : (__ink_acc_trgt.strbuf !== undefined ? __ink_acc_trgt.strbuf : null)})() + c); return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())]]))], [() => (__Ink_Empty), () => (__ink_match(c, [[() => (__Ink_String(`\``)), () => (__ink_match((() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1) })()] || null : (__ink_acc_trgt[(() => { return __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1) })()] !== undefined ? __ink_acc_trgt[(() => { return __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1) })()] : null)})(), [[() => (__Ink_String(`\``)), () => (__ink_match(advance = index(slice(s, (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})(), len(s)), Newline), [[() => (__ink_negate(1)), () => ((() => { __ink_match(lexComments, [[() => (true), () => (commit(token((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Comment] || null : (__ink_acc_trgt.Comment !== undefined ? __ink_acc_trgt.Comment : null)})(), slice(s, (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})(), len(s)), (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})())))]]); return finalize() })())], [() => (__Ink_Empty), () => ((() => { let col; let i; let line; line = (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})(); col = (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})(); i = (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(i, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + advance)) : (__ink_assgn_trgt.i) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + advance); return __ink_assgn_trgt})(); __ink_match(lexComments, [[() => (true), () => (commit(token((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Comment] || null : (__ink_acc_trgt.Comment !== undefined ? __ink_acc_trgt.Comment : null)})(), slice(s, i, (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})()), line, col, i)))]]); ensureSeparator(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(line, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})() + 1)) : (__ink_assgn_trgt.line) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})() + 1); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(col, 0) : (__ink_assgn_trgt.col) = 0; return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())]]))], [() => (__Ink_Empty), () => ((() => { let col; let i; let line; line = (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})(); col = (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})(); i = (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(i, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1)) : (__ink_assgn_trgt.i) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1); return __ink_assgn_trgt})(); (() => { let __ink_trampolined_sub; let sub; return sub = () => (() => { __ink_trampolined_sub = () => __ink_match((() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() })()] || null : (__ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() })()] !== undefined ? __ink_acc_trgt[(() => { return (() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() })()] : null)})(), [[() => (__Ink_String(`\``)), () => ((() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(col, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})() + 1)) : (__ink_assgn_trgt.col) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})() + 1); return __ink_assgn_trgt})())], [() => (Newline), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(i, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1)) : (__ink_assgn_trgt.i) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(line, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})() + 1)) : (__ink_assgn_trgt.line) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})() + 1); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(col, 0) : (__ink_assgn_trgt.col) = 0; return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (null), () => (null)], [() => (__Ink_Empty), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(i, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1)) : (__ink_assgn_trgt.i) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(col, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})() + 1)) : (__ink_assgn_trgt.col) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[col] || null : (__ink_acc_trgt.col !== undefined ? __ink_acc_trgt.col : null)})() + 1); return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())]]); return __ink_resolve_trampoline(__ink_trampolined_sub) })() })()(); __ink_match(lexComments, [[() => (true), () => (commit(token((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Comment] || null : (__ink_acc_trgt.Comment !== undefined ? __ink_acc_trgt.Comment : null)})(), slice(s, i, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1)), line, col, i)))]]); return __ink_trampoline(__ink_trampolined_sub) })())]]))], [() => (Newline), () => ((() => { ensureSeparator(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(line, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})() + 1)) : (__ink_assgn_trgt.line) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[line] || null : (__ink_acc_trgt.line !== undefined ? __ink_acc_trgt.line : null)})() + 1); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(col, 0) : (__ink_assgn_trgt.col) = 0; return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (Tab), () => ((() => { commitClear(); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(` `)), () => ((() => { commitClear(); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`_`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[EmptyIdent] || null : (__ink_acc_trgt.EmptyIdent !== undefined ? __ink_acc_trgt.EmptyIdent : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`~`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[NegOp] || null : (__ink_acc_trgt.NegOp !== undefined ? __ink_acc_trgt.NegOp : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`+`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[AddOp] || null : (__ink_acc_trgt.AddOp !== undefined ? __ink_acc_trgt.AddOp : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`*`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[MulOp] || null : (__ink_acc_trgt.MulOp !== undefined ? __ink_acc_trgt.MulOp : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`/`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[DivOp] || null : (__ink_acc_trgt.DivOp !== undefined ? __ink_acc_trgt.DivOp : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`%`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[ModOp] || null : (__ink_acc_trgt.ModOp !== undefined ? __ink_acc_trgt.ModOp : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`&`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[AndOp] || null : (__ink_acc_trgt.AndOp !== undefined ? __ink_acc_trgt.AndOp : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`|`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[OrOp] || null : (__ink_acc_trgt.OrOp !== undefined ? __ink_acc_trgt.OrOp : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`^`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[XorOp] || null : (__ink_acc_trgt.XorOp !== undefined ? __ink_acc_trgt.XorOp : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`<`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[LtOp] || null : (__ink_acc_trgt.LtOp !== undefined ? __ink_acc_trgt.LtOp : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`>`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[GtOp] || null : (__ink_acc_trgt.GtOp !== undefined ? __ink_acc_trgt.GtOp : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`,`)), () => ((() => { ensureSeparator(); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`.`)), () => (__ink_match([(() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[buf] || null : (__ink_acc_trgt.buf !== undefined ? __ink_acc_trgt.buf : null)})(), every(map((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[buf] || null : (__ink_acc_trgt.buf !== undefined ? __ink_acc_trgt.buf : null)})(), digit__ink_qm__))], [[() => ([__Ink_String(``), __Ink_Empty]), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[AccessorOp] || null : (__ink_acc_trgt.AccessorOp !== undefined ? __ink_acc_trgt.AccessorOp : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => ([__Ink_Empty, true]), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(buf, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[buf] || null : (__ink_acc_trgt.buf !== undefined ? __ink_acc_trgt.buf : null)})() + __Ink_String(`.`))) : (__ink_assgn_trgt.buf) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[buf] || null : (__ink_acc_trgt.buf !== undefined ? __ink_acc_trgt.buf : null)})() + __Ink_String(`.`)); return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_Empty), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[AccessorOp] || null : (__ink_acc_trgt.AccessorOp !== undefined ? __ink_acc_trgt.AccessorOp : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())]]))], [() => (__Ink_String(`:`)), () => (__ink_match((() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1) })()] || null : (__ink_acc_trgt[(() => { return __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1) })()] !== undefined ? __ink_acc_trgt[(() => { return __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1) })()] : null)})(), [[() => (__Ink_String(`=`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[DefineOp] || null : (__ink_acc_trgt.DefineOp !== undefined ? __ink_acc_trgt.DefineOp : null)})()); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(i, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1)) : (__ink_assgn_trgt.i) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1); return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`:`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[MatchColon] || null : (__ink_acc_trgt.MatchColon !== undefined ? __ink_acc_trgt.MatchColon : null)})()); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(i, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1)) : (__ink_assgn_trgt.i) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1); return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_Empty), () => ((() => { ensureSeparator(); commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[KeyValueSeparator] || null : (__ink_acc_trgt.KeyValueSeparator !== undefined ? __ink_acc_trgt.KeyValueSeparator : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())]]))], [() => (__Ink_String(`=`)), () => (__ink_match((() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1) })()] || null : (__ink_acc_trgt[(() => { return __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1) })()] !== undefined ? __ink_acc_trgt[(() => { return __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1) })()] : null)})(), [[() => (__Ink_String(`>`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[FunctionArrow] || null : (__ink_acc_trgt.FunctionArrow !== undefined ? __ink_acc_trgt.FunctionArrow : null)})()); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(i, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1)) : (__ink_assgn_trgt.i) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1); return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_Empty), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[EqOp] || null : (__ink_acc_trgt.EqOp !== undefined ? __ink_acc_trgt.EqOp : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())]]))], [() => (__Ink_String(`-`)), () => (__ink_match((() => {let __ink_acc_trgt = __as_ink_string(s); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1) })()] || null : (__ink_acc_trgt[(() => { return __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1) })()] !== undefined ? __ink_acc_trgt[(() => { return __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1) })()] : null)})(), [[() => (__Ink_String(`>`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[CaseArrow] || null : (__ink_acc_trgt.CaseArrow !== undefined ? __ink_acc_trgt.CaseArrow : null)})()); (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(i, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1)) : (__ink_assgn_trgt.i) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})() + 1); return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_Empty), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[SubOp] || null : (__ink_acc_trgt.SubOp !== undefined ? __ink_acc_trgt.SubOp : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())]]))], [() => (__Ink_String(`(`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[LParen] || null : (__ink_acc_trgt.LParen !== undefined ? __ink_acc_trgt.LParen : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`)`)), () => ((() => { ensureSeparator(); commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[RParen] || null : (__ink_acc_trgt.RParen !== undefined ? __ink_acc_trgt.RParen : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`[`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[LBracket] || null : (__ink_acc_trgt.LBracket !== undefined ? __ink_acc_trgt.LBracket : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`]`)), () => ((() => { ensureSeparator(); commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[RBracket] || null : (__ink_acc_trgt.RBracket !== undefined ? __ink_acc_trgt.RBracket : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`{`)), () => ((() => { commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[LBrace] || null : (__ink_acc_trgt.LBrace !== undefined ? __ink_acc_trgt.LBrace : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_String(`}`)), () => ((() => { ensureSeparator(); commitChar((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[RBrace] || null : (__ink_acc_trgt.RBrace !== undefined ? __ink_acc_trgt.RBrace : null)})()); return __ink_trampoline(__ink_trampolined_sub) })())], [() => (__Ink_Empty), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(S); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(buf, __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[buf] || null : (__ink_acc_trgt.buf !== undefined ? __ink_acc_trgt.buf : null)})() + c)) : (__ink_assgn_trgt.buf) = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(S); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[buf] || null : (__ink_acc_trgt.buf !== undefined ? __ink_acc_trgt.buf : null)})() + c); return __ink_assgn_trgt})(); return __ink_trampoline(__ink_trampolined_sub) })())]]))]]) })(); return __ink_resolve_trampoline(__ink_trampolined_sub) })() })()() })();
tokenize = s => tokenizeWithOpt(s, false);
tokenizeWithComments = s => tokenizeWithOpt(s, true)

str = s => bind(s, __Ink_String(`valueOf`))(s);
arr = bind(Object, __Ink_String(`values`));
hae = (tag, classList, attrs, events, children) => ({tag: str(tag), attrs: (() => {let __ink_assgn_trgt = __as_ink_string(attrs); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign((() => { return __Ink_String(`class`) })(), arr(map(classList, str))) : (__ink_assgn_trgt[(() => { return __Ink_String(`class`) })()]) = arr(map(classList, str)); return __ink_assgn_trgt})(), events: events, children: arr(map(children, child => __ink_match(type(child), [[() => (__Ink_String(`string`)), () => (str(child))], [() => (__Ink_Empty), () => (child)]])))});
ha = (tag, classList, attrs, children) => hae(tag, classList, attrs, {}, children);
h = (tag, classList, children) => hae(tag, classList, {}, {}, children);
Renderer = root => (() => { let InitialDom; let node; let render; let self; render = (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(window); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Torus] || null : (__ink_acc_trgt.Torus !== undefined ? __ink_acc_trgt.Torus : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[render] || null : (__ink_acc_trgt.render !== undefined ? __ink_acc_trgt.render : null)})(); InitialDom = h(__Ink_String(`div`), [], []); node = render(null, null, InitialDom); bind(root, __Ink_String(`appendChild`))(node); return self = {node: node, prev: InitialDom, update: jdom => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(self); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(node, render((() => {let __ink_acc_trgt = __as_ink_string(self); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[node] || null : (__ink_acc_trgt.node !== undefined ? __ink_acc_trgt.node : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(self); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[prev] || null : (__ink_acc_trgt.prev !== undefined ? __ink_acc_trgt.prev : null)})(), jdom)) : (__ink_assgn_trgt.node) = render((() => {let __ink_acc_trgt = __as_ink_string(self); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[node] || null : (__ink_acc_trgt.node !== undefined ? __ink_acc_trgt.node : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(self); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[prev] || null : (__ink_acc_trgt.prev !== undefined ? __ink_acc_trgt.prev : null)})(), jdom); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(self); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(prev, jdom) : (__ink_assgn_trgt.prev) = jdom; return __ink_assgn_trgt})(); return (() => {let __ink_acc_trgt = __as_ink_string(self); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[node] || null : (__ink_acc_trgt.node !== undefined ? __ink_acc_trgt.node : null)})() })()} })()

std = load(__Ink_String(`../vendor/std`));
log = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[log] || null : (__ink_acc_trgt.log !== undefined ? __ink_acc_trgt.log : null)})();
f = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[format] || null : (__ink_acc_trgt.format !== undefined ? __ink_acc_trgt.format : null)})();
map = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[map] || null : (__ink_acc_trgt.map !== undefined ? __ink_acc_trgt.map : null)})();
each = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[each] || null : (__ink_acc_trgt.each !== undefined ? __ink_acc_trgt.each : null)})();
slice = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[slice] || null : (__ink_acc_trgt.slice !== undefined ? __ink_acc_trgt.slice : null)})();
cat = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[cat] || null : (__ink_acc_trgt.cat !== undefined ? __ink_acc_trgt.cat : null)})();
Tokenize = load(__Ink_String(`tokenize`));
Tok = (() => {let __ink_acc_trgt = __as_ink_string(Tokenize); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Tok] || null : (__ink_acc_trgt.Tok !== undefined ? __ink_acc_trgt.Tok : null)})();
tokenize = (() => {let __ink_acc_trgt = __as_ink_string(Tokenize); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[tokenizeWithComments] || null : (__ink_acc_trgt.tokenizeWithComments !== undefined ? __ink_acc_trgt.tokenizeWithComments : null)})();
classForTok = tok => __ink_match((() => {let __ink_acc_trgt = __as_ink_string(tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})(), [[() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Separator] || null : (__ink_acc_trgt.Separator !== undefined ? __ink_acc_trgt.Separator : null)})()), () => (__Ink_String(`hljs-separator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Comment] || null : (__ink_acc_trgt.Comment !== undefined ? __ink_acc_trgt.Comment : null)})()), () => (__Ink_String(`hljs-comment`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Ident] || null : (__ink_acc_trgt.Ident !== undefined ? __ink_acc_trgt.Ident : null)})()), () => (__Ink_String(``))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[EmptyIdent] || null : (__ink_acc_trgt.EmptyIdent !== undefined ? __ink_acc_trgt.EmptyIdent : null)})()), () => (__Ink_String(``))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[NumberLiteral] || null : (__ink_acc_trgt.NumberLiteral !== undefined ? __ink_acc_trgt.NumberLiteral : null)})()), () => (__Ink_String(`hljs-number`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[StringLiteral] || null : (__ink_acc_trgt.StringLiteral !== undefined ? __ink_acc_trgt.StringLiteral : null)})()), () => (__Ink_String(`hljs-string`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[TrueLiteral] || null : (__ink_acc_trgt.TrueLiteral !== undefined ? __ink_acc_trgt.TrueLiteral : null)})()), () => (__Ink_String(`hljs-literal`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[FalseLiteral] || null : (__ink_acc_trgt.FalseLiteral !== undefined ? __ink_acc_trgt.FalseLiteral : null)})()), () => (__Ink_String(`hljs-literal`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[AccessorOp] || null : (__ink_acc_trgt.AccessorOp !== undefined ? __ink_acc_trgt.AccessorOp : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[EqOp] || null : (__ink_acc_trgt.EqOp !== undefined ? __ink_acc_trgt.EqOp : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[FunctionArrow] || null : (__ink_acc_trgt.FunctionArrow !== undefined ? __ink_acc_trgt.FunctionArrow : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[KeyValueSeparator] || null : (__ink_acc_trgt.KeyValueSeparator !== undefined ? __ink_acc_trgt.KeyValueSeparator : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[DefineOp] || null : (__ink_acc_trgt.DefineOp !== undefined ? __ink_acc_trgt.DefineOp : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[MatchColon] || null : (__ink_acc_trgt.MatchColon !== undefined ? __ink_acc_trgt.MatchColon : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[CaseArrow] || null : (__ink_acc_trgt.CaseArrow !== undefined ? __ink_acc_trgt.CaseArrow : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[SubOp] || null : (__ink_acc_trgt.SubOp !== undefined ? __ink_acc_trgt.SubOp : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[NegOp] || null : (__ink_acc_trgt.NegOp !== undefined ? __ink_acc_trgt.NegOp : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[AddOp] || null : (__ink_acc_trgt.AddOp !== undefined ? __ink_acc_trgt.AddOp : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[MulOp] || null : (__ink_acc_trgt.MulOp !== undefined ? __ink_acc_trgt.MulOp : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[DivOp] || null : (__ink_acc_trgt.DivOp !== undefined ? __ink_acc_trgt.DivOp : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[ModOp] || null : (__ink_acc_trgt.ModOp !== undefined ? __ink_acc_trgt.ModOp : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[GtOp] || null : (__ink_acc_trgt.GtOp !== undefined ? __ink_acc_trgt.GtOp : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[LtOp] || null : (__ink_acc_trgt.LtOp !== undefined ? __ink_acc_trgt.LtOp : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[AndOp] || null : (__ink_acc_trgt.AndOp !== undefined ? __ink_acc_trgt.AndOp : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[OrOp] || null : (__ink_acc_trgt.OrOp !== undefined ? __ink_acc_trgt.OrOp : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[XorOp] || null : (__ink_acc_trgt.XorOp !== undefined ? __ink_acc_trgt.XorOp : null)})()), () => (__Ink_String(`hljs-operator`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[LParen] || null : (__ink_acc_trgt.LParen !== undefined ? __ink_acc_trgt.LParen : null)})()), () => (__Ink_String(`hljs-punctuation`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[RParen] || null : (__ink_acc_trgt.RParen !== undefined ? __ink_acc_trgt.RParen : null)})()), () => (__Ink_String(`hljs-punctuation`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[LBracket] || null : (__ink_acc_trgt.LBracket !== undefined ? __ink_acc_trgt.LBracket : null)})()), () => (__Ink_String(`hljs-punctuation`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[RBracket] || null : (__ink_acc_trgt.RBracket !== undefined ? __ink_acc_trgt.RBracket : null)})()), () => (__Ink_String(`hljs-punctuation`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[LBrace] || null : (__ink_acc_trgt.LBrace !== undefined ? __ink_acc_trgt.LBrace : null)})()), () => (__Ink_String(`hljs-punctuation`))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[RBrace] || null : (__ink_acc_trgt.RBrace !== undefined ? __ink_acc_trgt.RBrace : null)})()), () => (__Ink_String(`hljs-punctuation`))], [() => (__Ink_Empty), () => (null)]]);
escapeHTML = s => replace(replace(s, __Ink_String(`&`), __Ink_String(`&amp;`)), __Ink_String(`<`), __Ink_String(`&lt;`));
highlightInkProg = prog => (() => { let pcs; let spans; let tokens; tokens = tokenize(prog); spans = map(tokens, (tok, i) => ({__ink_ident_class: __ink_match([(() => {let __ink_acc_trgt = __as_ink_string(tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(tokens); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return __as_ink_string(i + 1) })()] || null : (__ink_acc_trgt[(() => { return __as_ink_string(i + 1) })()] !== undefined ? __ink_acc_trgt[(() => { return __as_ink_string(i + 1) })()] : null)})()], [[() => ([(() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Ident] || null : (__ink_acc_trgt.Ident !== undefined ? __ink_acc_trgt.Ident : null)})(), {type: (() => {let __ink_acc_trgt = __as_ink_string(Tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[LParen] || null : (__ink_acc_trgt.LParen !== undefined ? __ink_acc_trgt.LParen : null)})(), val: __Ink_Empty, line: __Ink_Empty, col: __Ink_Empty, i: __Ink_Empty}]), () => (__Ink_String(`hljs-title function_`))], [() => (__Ink_Empty), () => (classForTok(tok))]]), start: (() => {let __ink_acc_trgt = __as_ink_string(tok); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})(), end: __ink_match((() => {let __ink_acc_trgt = __as_ink_string(tokens); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return __as_ink_string(i + 1) })()] || null : (__ink_acc_trgt[(() => { return __as_ink_string(i + 1) })()] !== undefined ? __ink_acc_trgt[(() => { return __as_ink_string(i + 1) })()] : null)})(), [[() => (null), () => (len(prog))], [() => (__Ink_Empty), () => ((() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(tokens); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return __as_ink_string(i + 1) })()] || null : (__ink_acc_trgt[(() => { return __as_ink_string(i + 1) })()] !== undefined ? __ink_acc_trgt[(() => { return __as_ink_string(i + 1) })()] : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[i] || null : (__ink_acc_trgt.i !== undefined ? __ink_acc_trgt.i : null)})())]])})); pcs = map(spans, span => f(__Ink_String(`<span class="{{ 0 }}">{{ 1 }}</span>`), [(() => {let __ink_acc_trgt = __as_ink_string(span); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__ink_ident_class] || null : (__ink_acc_trgt.__ink_ident_class !== undefined ? __ink_acc_trgt.__ink_ident_class : null)})(), slice(prog, (() => {let __ink_acc_trgt = __as_ink_string(span); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[start] || null : (__ink_acc_trgt.start !== undefined ? __ink_acc_trgt.start : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(span); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[end] || null : (__ink_acc_trgt.end !== undefined ? __ink_acc_trgt.end : null)})())]), span => __as_ink_string(__as_ink_string(__as_ink_string(__as_ink_string(__Ink_String(`<span class="`) + (() => {let __ink_acc_trgt = __as_ink_string(span); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__ink_ident_class] || null : (__ink_acc_trgt.__ink_ident_class !== undefined ? __ink_acc_trgt.__ink_ident_class : null)})()) + __Ink_String(`">`)) + slice(prog, (() => {let __ink_acc_trgt = __as_ink_string(span); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[start] || null : (__ink_acc_trgt.start !== undefined ? __ink_acc_trgt.start : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(span); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[end] || null : (__ink_acc_trgt.end !== undefined ? __ink_acc_trgt.end : null)})())) + __Ink_String(`</span`))); return cat(pcs, __Ink_String(``)) })()

std = load(__Ink_String(`std`));
log = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[log] || null : (__ink_acc_trgt.log !== undefined ? __ink_acc_trgt.log : null)})();
f = (() => {let __ink_acc_trgt = __as_ink_string(std); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[format] || null : (__ink_acc_trgt.format !== undefined ? __ink_acc_trgt.format : null)})();
Newline = char(10);
MaxPathChars = 16;
FileType = {Blob: __ink_negate(1), Text: 0, Image: 1};
fetchAPI = (url, data, withRespJSON) => (() => { let json; let resp; resp = fetch(url, data); json = bind(resp, __Ink_String(`then`))(resp => bind(resp, __Ink_String(`json`))()); return bind(json, __Ink_String(`then`))(data => withRespJSON(data)) })();
fetchRepo = (userName, repoName, withRepo) => fetchAPI(f(__Ink_String(`/repo/{{ 0 }}/{{ 1 }}`), [userName, repoName]), {}, data => withRepo(data));
fetchContents = (userName, repoName, path, withContents) => fetchAPI(f(__Ink_String(`/repo/{{ 0 }}/{{ 1 }}/files{{ 2 }}`), [userName, repoName, path]), {}, data => withContents(data));
translateFileFromAPI = fileFromAPI => ({open__ink_qm__: false, name: (() => {let __ink_acc_trgt = __as_ink_string(fileFromAPI); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})(), path: (() => {let __ink_acc_trgt = __as_ink_string(fileFromAPI); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[path] || null : (__ink_acc_trgt.path !== undefined ? __ink_acc_trgt.path : null)})(), type: (() => {let __ink_acc_trgt = __as_ink_string(fileFromAPI); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})(), download: (() => {let __ink_acc_trgt = __as_ink_string(fileFromAPI); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`download_url`)] || null : (__ink_acc_trgt[__Ink_String(`download_url`)] !== undefined ? __ink_acc_trgt[__Ink_String(`download_url`)] : null)})(), content: null, children: null});
fileInWorkspace__ink_qm__ = file => (() => { let allOpenFiles; allOpenFiles = flatten(map((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[panes] || null : (__ink_acc_trgt.panes !== undefined ? __ink_acc_trgt.panes : null)})(), pane => (() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})())); return (() => { let __ink_trampolined_sub; let sub; return sub = i => (() => { __ink_trampolined_sub = i => __ink_match(i, [[() => (len(allOpenFiles)), () => (false)], [() => (__Ink_Empty), () => (__ink_match((() => {let __ink_acc_trgt = __as_ink_string(allOpenFiles); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return i })()] || null : (__ink_acc_trgt[(() => { return i })()] !== undefined ? __ink_acc_trgt[(() => { return i })()] : null)})(), [[() => (file), () => (true)], [() => (__Ink_Empty), () => (__ink_trampoline(__ink_trampolined_sub, __as_ink_string(i + 1)))]]))]]); return __ink_resolve_trampoline(__ink_trampolined_sub, i) })() })()(0) })();
fileTypeFromPath = path => __ink_match(true, [[() => (hasSuffix__ink_qm__(path, __Ink_String(`.jpg`))), () => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Image] || null : (__ink_acc_trgt.Image !== undefined ? __ink_acc_trgt.Image : null)})())], [() => (hasSuffix__ink_qm__(path, __Ink_String(`.png`))), () => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Image] || null : (__ink_acc_trgt.Image !== undefined ? __ink_acc_trgt.Image : null)})())], [() => (hasSuffix__ink_qm__(path, __Ink_String(`.gif`))), () => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Image] || null : (__ink_acc_trgt.Image !== undefined ? __ink_acc_trgt.Image : null)})())], [() => (hasSuffix__ink_qm__(path, __Ink_String(`.bmp`))), () => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Image] || null : (__ink_acc_trgt.Image !== undefined ? __ink_acc_trgt.Image : null)})())], [() => (hasSuffix__ink_qm__(path, __Ink_String(`.sqlite`))), () => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Blob] || null : (__ink_acc_trgt.Blob !== undefined ? __ink_acc_trgt.Blob : null)})())], [() => (__Ink_Empty), () => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Text] || null : (__ink_acc_trgt.Text !== undefined ? __ink_acc_trgt.Text : null)})())]]);
getLanguage = (() => {let __ink_acc_trgt = __as_ink_string(hljs); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[getLanguage] || null : (__ink_acc_trgt.getLanguage !== undefined ? __ink_acc_trgt.getLanguage : null)})();
listLanguages = (() => {let __ink_acc_trgt = __as_ink_string(hljs); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[listLanguages] || null : (__ink_acc_trgt.listLanguages !== undefined ? __ink_acc_trgt.listLanguages : null)})();
highlightProg = (fileName, content) => (() => { let dotParts; let langCode; let language; langCode = str(__ink_match(fileName, [[() => (__Ink_String(`Dockerfile`)), () => (__Ink_String(`dockerfile`))], [() => (__Ink_String(`Makefile`)), () => (__Ink_String(`makefile`))], [() => (__Ink_Empty), () => (__ink_match(dotParts = split(fileName, __Ink_String(`.`)), [[() => ([__Ink_Empty]), () => (__Ink_String(`unknown`))], [() => (__Ink_Empty), () => ((() => {let __ink_acc_trgt = __as_ink_string(dotParts); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[(() => { return (len(dotParts) - 1) })()] || null : (__ink_acc_trgt[(() => { return (len(dotParts) - 1) })()] !== undefined ? __ink_acc_trgt[(() => { return (len(dotParts) - 1) })()] : null)})())]]))]])); language = (() => { return __ink_match(eval(str(__Ink_String(`getLanguage(langCode) || null`))), [[() => (null), () => (langCode)], [() => (__Ink_Empty), () => (lower((() => {let __ink_acc_trgt = __as_ink_string(getLanguage(langCode)); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})()))]]) })(); return __ink_match(filter(listLanguages(), lg => __ink_eq(lg, language)), [[() => ([__Ink_Empty]), () => ((() => { let result; result = (() => { return (() => {let __ink_acc_trgt = __as_ink_string(hljs); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[highlight] || null : (__ink_acc_trgt.highlight !== undefined ? __ink_acc_trgt.highlight : null)})() })()(content, {language: langCode}); bind(console, __Ink_String(`log`))(result); return (() => {let __ink_acc_trgt = __as_ink_string(result); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[value] || null : (__ink_acc_trgt.value !== undefined ? __ink_acc_trgt.value : null)})() })())], [() => (__Ink_Empty), () => (__ink_match(langCode, [[() => (__Ink_String(`ink`)), () => (highlightInkProg(content))], [() => (__Ink_Empty), () => (content)]]))]]) })();
State = {theme: __Ink_String(`light`), userName: __Ink_String(`thesephist`), repoName: __Ink_String(`september`), repo: null, files: [], panes: []};
Link = (name, href) => ha(__Ink_String(`a`), [], {href: href, target: __Ink_String(`_blank`)}, [name]);
RepoPanel = (() => { let state; state = {userName: (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(), repoName: (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(), inputVisible: false}; return () => (() => { let repo; return h(__Ink_String(`div`), [__Ink_String(`repo-panel`)], [h(__Ink_String(`div`), [__Ink_String(`repo-panel-header`)], [h(__Ink_String(`div`), [__Ink_String(`repo-header-link`)], [Link(f(__Ink_String(`{{ userName }}/{{ repoName }}`), State), f(__Ink_String(`https://github.com/{{ userName }}/{{ repoName }}`), State))]), hae(__Ink_String(`button`), [__Ink_String(`repo-toggle-input`)], {}, {click: evt => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(inputVisible, __ink_negate((() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[inputVisible] || null : (__ink_acc_trgt.inputVisible !== undefined ? __ink_acc_trgt.inputVisible : null)})() })())) : (__ink_assgn_trgt.inputVisible) = __ink_negate((() => { return (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[inputVisible] || null : (__ink_acc_trgt.inputVisible !== undefined ? __ink_acc_trgt.inputVisible : null)})() })()); return __ink_assgn_trgt})(); __ink_match((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[inputVisible] || null : (__ink_acc_trgt.inputVisible !== undefined ? __ink_acc_trgt.inputVisible : null)})(), [[() => (true), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(userName, (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})()) : (__ink_assgn_trgt.userName) = (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(); return __ink_assgn_trgt})(); return (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(repoName, (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})()) : (__ink_assgn_trgt.repoName) = (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(); return __ink_assgn_trgt})() })())]]); return render() })()}, [__Ink_String(`edit`)])]), __ink_match((() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[inputVisible] || null : (__ink_acc_trgt.inputVisible !== undefined ? __ink_acc_trgt.inputVisible : null)})(), [[() => (true), () => (h(__Ink_String(`div`), [__Ink_String(`repo-input-panel`)], [hae(__Ink_String(`input`), [__Ink_String(`repo-input-username`)], {value: (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(), placeholder: __Ink_String(`username`)}, {input: evt => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(userName, (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[target] || null : (__ink_acc_trgt.target !== undefined ? __ink_acc_trgt.target : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[value] || null : (__ink_acc_trgt.value !== undefined ? __ink_acc_trgt.value : null)})()) : (__ink_assgn_trgt.userName) = (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[target] || null : (__ink_acc_trgt.target !== undefined ? __ink_acc_trgt.target : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[value] || null : (__ink_acc_trgt.value !== undefined ? __ink_acc_trgt.value : null)})(); return __ink_assgn_trgt})(); return render() })()}, []), hae(__Ink_String(`input`), [__Ink_String(`repo-input-reponame`)], {value: (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(), placeholder: __Ink_String(`repo name`)}, {input: evt => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(repoName, (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[target] || null : (__ink_acc_trgt.target !== undefined ? __ink_acc_trgt.target : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[value] || null : (__ink_acc_trgt.value !== undefined ? __ink_acc_trgt.value : null)})()) : (__ink_assgn_trgt.repoName) = (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(evt); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[target] || null : (__ink_acc_trgt.target !== undefined ? __ink_acc_trgt.target : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[value] || null : (__ink_acc_trgt.value !== undefined ? __ink_acc_trgt.value : null)})(); return __ink_assgn_trgt})(); return render() })()}, []), hae(__Ink_String(`button`), [__Ink_String(`repo-input-submit`)], {}, {click: () => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(userName, (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})()) : (__ink_assgn_trgt.userName) = (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(repoName, (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})()) : (__ink_assgn_trgt.repoName) = (() => {let __ink_acc_trgt = __as_ink_string(state); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(); return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(state); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(inputVisible, false) : (__ink_assgn_trgt.inputVisible) = false; return __ink_assgn_trgt})(); return refreshRepo() })()}, [__Ink_String(`Go`)])]))]]), __ink_match(repo = (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repo] || null : (__ink_acc_trgt.repo !== undefined ? __ink_acc_trgt.repo : null)})(), [[() => (null), () => (h(__Ink_String(`div`), [__Ink_String(`repo-info-panel`), __Ink_String(`empty`)], [__Ink_String(`Loading repo...`)]))], [() => (__Ink_Empty), () => (h(__Ink_String(`div`), [__Ink_String(`repo-info-panel`)], [h(__Ink_String(`div`), [__Ink_String(`repo-info-description`)], [(() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[description] || null : (__ink_acc_trgt.description !== undefined ? __ink_acc_trgt.description : null)})()]), h(__Ink_String(`div`), [__Ink_String(`repo-info-homepage`)], [Link((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[homepage] || null : (__ink_acc_trgt.homepage !== undefined ? __ink_acc_trgt.homepage : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[homepage] || null : (__ink_acc_trgt.homepage !== undefined ? __ink_acc_trgt.homepage : null)})())]), h(__Ink_String(`div`), [__Ink_String(`repo-info-language`)], [(() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[language] || null : (__ink_acc_trgt.language !== undefined ? __ink_acc_trgt.language : null)})()])]))]])]) })() })();
FileTreeNode = file => h(__Ink_String(`div`), [__Ink_String(`file-tree-node`)], [h(__Ink_String(`div`), [__Ink_String(`file-tree-node-row`), __ink_match(fileInWorkspace__ink_qm__(file), [[() => (true), () => (__Ink_String(`in-workspace`))], [() => (__Ink_Empty), () => (__Ink_String(``))]])], [__ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})(), [[() => (__Ink_String(`dir`)), () => (hae(__Ink_String(`button`), [__Ink_String(`file-tree-node-toggle`), __ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})(), [[() => (true), () => (__Ink_String(`open`))], [() => (__Ink_Empty), () => (__Ink_String(`closed`))]])], {}, {click: () => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(file); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(open__ink_qm__, __ink_negate((() => { return (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})() })())) : (__ink_assgn_trgt.open__ink_qm__) = __ink_negate((() => { return (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})() })()); return __ink_assgn_trgt})(); fetchFileChildren(file, render); return render() })()}, [__Ink_String(`▼`)]))], [() => (__Ink_Empty), () => (null)]]), hae(__Ink_String(`button`), [__Ink_String(`file-tree-node-name`)], {}, {click: () => __ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[type] || null : (__ink_acc_trgt.type !== undefined ? __ink_acc_trgt.type : null)})(), [[() => (__Ink_String(`file`)), () => (__ink_match(fileInWorkspace__ink_qm__(file), [[() => (true), () => (render((() => {let __ink_assgn_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[panes] || null : (__ink_acc_trgt.panes !== undefined ? __ink_acc_trgt.panes : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`0`)] || null : (__ink_acc_trgt[__Ink_String(`0`)] !== undefined ? __ink_acc_trgt[__Ink_String(`0`)] : null)})()); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(active, file) : (__ink_assgn_trgt.active) = file; return __ink_assgn_trgt})()))], [() => (__Ink_Empty), () => ((() => { let pane; __ink_match(pane = (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[panes] || null : (__ink_acc_trgt.panes !== undefined ? __ink_acc_trgt.panes : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})(), [[() => (null), () => ((() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(panes, [{active: file, files: [file]}]) : (__ink_assgn_trgt.panes) = [{active: file, files: [file]}]; return __ink_assgn_trgt})())], [() => (__Ink_Empty), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})()); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(len((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})()), file) : (__ink_assgn_trgt[len((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})())]) = file; return __ink_assgn_trgt})(); return (() => {let __ink_assgn_trgt = __as_ink_string(pane); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(active, file) : (__ink_assgn_trgt.active) = file; return __ink_assgn_trgt})() })())]]); fetchFileContent(file, render); return render() })())]]))], [() => (__Ink_String(`dir`)), () => ((() => { (() => {let __ink_assgn_trgt = __as_ink_string(file); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(open__ink_qm__, __ink_negate((() => { return (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})() })())) : (__ink_assgn_trgt.open__ink_qm__) = __ink_negate((() => { return (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})() })()); return __ink_assgn_trgt})(); fetchFileChildren(file, render); return render() })())]])}, [(() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})()])]), __ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[open__ink_qm__] || null : (__ink_acc_trgt.open__ink_qm__ !== undefined ? __ink_acc_trgt.open__ink_qm__ : null)})(), [[() => (false), () => (null)], [() => (__Ink_Empty), () => (__ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[children] || null : (__ink_acc_trgt.children !== undefined ? __ink_acc_trgt.children : null)})(), [[() => (null), () => (__Ink_String(`Loading files...`))], [() => (__Ink_Empty), () => (FileTreeList((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[children] || null : (__ink_acc_trgt.children !== undefined ? __ink_acc_trgt.children : null)})()))]]))]])]);
FileTreeList = files => h(__Ink_String(`ul`), [__Ink_String(`file-tree-list`)], (() => { let sortedFiles; sortedFiles = sortBy(clone(files), file => (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})()); return map(sortedFiles, file => h(__Ink_String(`li`), [__Ink_String(`file-tree-list-item`)], [FileTreeNode(file)])) })());
Sidebar = () => h(__Ink_String(`div`), [__Ink_String(`sidebar`)], [h(__Ink_String(`nav`), [], [ha(__Ink_String(`a`), [__Ink_String(`home-link`)], {href: __Ink_String(`/`)}, [__Ink_String(`Ink codebase browser`)])]), RepoPanel(), h(__Ink_String(`div`), [__Ink_String(`file-tree-list-container`)], [FileTreeList((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})())])]);
FilePreview = file => (() => { let content; return __ink_match(fileTypeFromPath((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[path] || null : (__ink_acc_trgt.path !== undefined ? __ink_acc_trgt.path : null)})()), [[() => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Blob] || null : (__ink_acc_trgt.Blob !== undefined ? __ink_acc_trgt.Blob : null)})()), () => (h(__Ink_String(`div`), [__Ink_String(`file-preview`), __Ink_String(`file-preview-blob`)], [__Ink_String(`Can't preview this type of file`)]))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Image] || null : (__ink_acc_trgt.Image !== undefined ? __ink_acc_trgt.Image : null)})()), () => (h(__Ink_String(`div`), [__Ink_String(`file-preview`), __Ink_String(`file-preview-image`)], [ha(__Ink_String(`img`), [__Ink_String(`file-preview-image-content`)], {src: (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[download] || null : (__ink_acc_trgt.download !== undefined ? __ink_acc_trgt.download : null)})()}, [])]))], [() => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Text] || null : (__ink_acc_trgt.Text !== undefined ? __ink_acc_trgt.Text : null)})()), () => (__ink_match(content = (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[content] || null : (__ink_acc_trgt.content !== undefined ? __ink_acc_trgt.content : null)})(), [[() => (null), () => (h(__Ink_String(`div`), [__Ink_String(`file-preview`), __Ink_String(`file-preview-text`), __Ink_String(`loading`)], []))], [() => (__Ink_Empty), () => (h(__Ink_String(`div`), [__Ink_String(`file-preview`), __Ink_String(`file-preview-text`)], [(() => { let lineCount; lineCount = (len(bind(str(content), __Ink_String(`split`))(Newline)) - 1); return ha(__Ink_String(`div`), [__Ink_String(`file-preview-text-scroller`)], {style: {height: __as_ink_string(string(__as_ink_string((lineCount * 1.25) + 5)) + __Ink_String(`em`))}}, [h(__Ink_String(`pre`), [__Ink_String(`file-preview-line-nos`)], [cat(map(range(1, __as_ink_string(lineCount + 1), 1), string), Newline)]), (() => { let el; el = bind(document, __Ink_String(`createElement`))(__Ink_String(`pre`)); (() => {let __ink_assgn_trgt = __as_ink_string(el); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(className, __Ink_String(`file-preview-line-texts`)) : (__ink_assgn_trgt.className) = __Ink_String(`file-preview-line-texts`); return __ink_assgn_trgt})(); return (() => {let __ink_assgn_trgt = __as_ink_string(el); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(innerHTML, content) : (__ink_assgn_trgt.innerHTML) = content; return __ink_assgn_trgt})() })()]) })()]))]]))]]) })();
FilePane = pane => h(__Ink_String(`div`), [__Ink_String(`file-pane`)], [h(__Ink_String(`div`), [__Ink_String(`file-pane-header`)], (() => { return map((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})(), file => h(__Ink_String(`div`), [__Ink_String(`file-pane-header`)], [h(__Ink_String(`div`), [__Ink_String(`file-pane-header-tab`), __ink_match((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[active] || null : (__ink_acc_trgt.active !== undefined ? __ink_acc_trgt.active : null)})(), [[() => (file), () => (__Ink_String(`active`))], [() => (__Ink_Empty), () => (__Ink_String(``))]])], [hae(__Ink_String(`button`), [__Ink_String(`file-pane-header-info`)], {title: (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[path] || null : (__ink_acc_trgt.path !== undefined ? __ink_acc_trgt.path : null)})()}, {click: () => render((() => {let __ink_assgn_trgt = __as_ink_string(pane); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(active, file) : (__ink_assgn_trgt.active) = file; return __ink_assgn_trgt})())}, [h(__Ink_String(`span`), [__Ink_String(`file-pane-header-path`)], [(() => { let path; path = trimSuffix((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[path] || null : (__ink_acc_trgt.path !== undefined ? __ink_acc_trgt.path : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})()); return __ink_match((len(path) < MaxPathChars), [[() => (true), () => (path)], [() => (__Ink_Empty), () => (__as_ink_string(__Ink_String(`...`) + slice(path, (len(path) - MaxPathChars), len(path))))]]) })()]), h(__Ink_String(`span`), [__Ink_String(`file-pane-header-name`)], [(() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})()])]), hae(__Ink_String(`button`), [__Ink_String(`file-pane-close`)], {}, {click: () => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(pane); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(files, filter((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})(), f => __ink_negate((() => { return __ink_eq(f, file) })()))) : (__ink_assgn_trgt.files) = filter((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})(), f => __ink_negate((() => { return __ink_eq(f, file) })())); return __ink_assgn_trgt})(); __ink_match((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})(), [[() => ([]), () => ((() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(panes, filter((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[panes] || null : (__ink_acc_trgt.panes !== undefined ? __ink_acc_trgt.panes : null)})(), p => __ink_negate((() => { return __ink_eq(p, pane) })()))) : (__ink_assgn_trgt.panes) = filter((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[panes] || null : (__ink_acc_trgt.panes !== undefined ? __ink_acc_trgt.panes : null)})(), p => __ink_negate((() => { return __ink_eq(p, pane) })())); return __ink_assgn_trgt})())], [() => (__Ink_Empty), () => (__ink_match((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[active] || null : (__ink_acc_trgt.active !== undefined ? __ink_acc_trgt.active : null)})(), [[() => (file), () => ((() => {let __ink_assgn_trgt = __as_ink_string(pane); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(active, (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})()) : (__ink_assgn_trgt.active) = (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[files] || null : (__ink_acc_trgt.files !== undefined ? __ink_acc_trgt.files : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[0] || null : (__ink_acc_trgt[0] !== undefined ? __ink_acc_trgt[0] : null)})(); return __ink_assgn_trgt})())]]))]]); return render() })()}, [__Ink_String(`×`)])])])) })()), FilePreview((() => {let __ink_acc_trgt = __as_ink_string(pane); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[active] || null : (__ink_acc_trgt.active !== undefined ? __ink_acc_trgt.active : null)})())]);
FilePanes = () => h(__Ink_String(`div`), [__Ink_String(`file-panes`)], map((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[panes] || null : (__ink_acc_trgt.panes !== undefined ? __ink_acc_trgt.panes : null)})(), pane => FilePane(pane)));
root = bind(document, __Ink_String(`querySelector`))(__Ink_String(`#root`));
r = Renderer(root);
update = (() => {let __ink_acc_trgt = __as_ink_string(r); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[update] || null : (__ink_acc_trgt.update !== undefined ? __ink_acc_trgt.update : null)})();
refreshRepo = () => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(repo, null) : (__ink_assgn_trgt.repo) = null; return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(files, []) : (__ink_assgn_trgt.files) = []; return __ink_assgn_trgt})(); (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(panes, []) : (__ink_assgn_trgt.panes) = []; return __ink_assgn_trgt})(); render(); fetchRepo((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(), repo => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(repo, {owner: {username: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[login] || null : (__ink_acc_trgt.login !== undefined ? __ink_acc_trgt.login : null)})(), avatar: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`avatar_url`)] || null : (__ink_acc_trgt[__Ink_String(`avatar_url`)] !== undefined ? __ink_acc_trgt[__Ink_String(`avatar_url`)] : null)})(), url: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`html_url`)] || null : (__ink_acc_trgt[__Ink_String(`html_url`)] !== undefined ? __ink_acc_trgt[__Ink_String(`html_url`)] : null)})()}, description: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[description] || null : (__ink_acc_trgt.description !== undefined ? __ink_acc_trgt.description : null)})(), homepage: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[homepage] || null : (__ink_acc_trgt.homepage !== undefined ? __ink_acc_trgt.homepage : null)})(), language: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[language] || null : (__ink_acc_trgt.language !== undefined ? __ink_acc_trgt.language : null)})()}) : (__ink_assgn_trgt.repo) = {owner: {username: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[login] || null : (__ink_acc_trgt.login !== undefined ? __ink_acc_trgt.login : null)})(), avatar: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`avatar_url`)] || null : (__ink_acc_trgt[__Ink_String(`avatar_url`)] !== undefined ? __ink_acc_trgt[__Ink_String(`avatar_url`)] : null)})(), url: (() => {let __ink_acc_trgt = __as_ink_string((() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[owner] || null : (__ink_acc_trgt.owner !== undefined ? __ink_acc_trgt.owner : null)})()); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[__Ink_String(`html_url`)] || null : (__ink_acc_trgt[__Ink_String(`html_url`)] !== undefined ? __ink_acc_trgt[__Ink_String(`html_url`)] : null)})()}, description: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[description] || null : (__ink_acc_trgt.description !== undefined ? __ink_acc_trgt.description : null)})(), homepage: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[homepage] || null : (__ink_acc_trgt.homepage !== undefined ? __ink_acc_trgt.homepage : null)})(), language: (() => {let __ink_acc_trgt = __as_ink_string(repo); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[language] || null : (__ink_acc_trgt.language !== undefined ? __ink_acc_trgt.language : null)})()}; return __ink_assgn_trgt})(); return render() })()); return fetchContents((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(), __Ink_String(`/`), contents => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(State); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(files, map(contents, translateFileFromAPI)) : (__ink_assgn_trgt.files) = map(contents, translateFileFromAPI); return __ink_assgn_trgt})(); return render() })()) })();
fetchFileChildren = (file, cb) => __ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[children] || null : (__ink_acc_trgt.children !== undefined ? __ink_acc_trgt.children : null)})(), [[() => (null), () => ((() => { return fetchContents((() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[userName] || null : (__ink_acc_trgt.userName !== undefined ? __ink_acc_trgt.userName : null)})(), (() => {let __ink_acc_trgt = __as_ink_string(State); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[repoName] || null : (__ink_acc_trgt.repoName !== undefined ? __ink_acc_trgt.repoName : null)})(), __as_ink_string(__Ink_String(`/`) + (() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[path] || null : (__ink_acc_trgt.path !== undefined ? __ink_acc_trgt.path : null)})()), contents => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(file); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(children, map(contents, translateFileFromAPI)) : (__ink_assgn_trgt.children) = map(contents, translateFileFromAPI); return __ink_assgn_trgt})(); return cb() })()) })())], [() => (__Ink_Empty), () => (cb())]]);
fetchFileContent = (file, cb) => __ink_match((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[content] || null : (__ink_acc_trgt.content !== undefined ? __ink_acc_trgt.content : null)})(), [[() => (null), () => ((() => { let resp; let text; resp = fetch((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[download] || null : (__ink_acc_trgt.download !== undefined ? __ink_acc_trgt.download : null)})()); text = bind(resp, __Ink_String(`then`))(resp => bind(resp, __Ink_String(`text`))()); return bind(text, __Ink_String(`then`))(text => (() => { (() => {let __ink_assgn_trgt = __as_ink_string(file); __is_ink_string(__ink_assgn_trgt) ? __ink_assgn_trgt.assign(content, (() => { return __ink_match(fileTypeFromPath((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[path] || null : (__ink_acc_trgt.path !== undefined ? __ink_acc_trgt.path : null)})()), [[() => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Text] || null : (__ink_acc_trgt.Text !== undefined ? __ink_acc_trgt.Text : null)})()), () => (highlightProg((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})(), text))], [() => (__Ink_Empty), () => (text)]]) })()) : (__ink_assgn_trgt.content) = (() => { return __ink_match(fileTypeFromPath((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[path] || null : (__ink_acc_trgt.path !== undefined ? __ink_acc_trgt.path : null)})()), [[() => ((() => {let __ink_acc_trgt = __as_ink_string(FileType); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[Text] || null : (__ink_acc_trgt.Text !== undefined ? __ink_acc_trgt.Text : null)})()), () => (highlightProg((() => {let __ink_acc_trgt = __as_ink_string(file); return __is_ink_string(__ink_acc_trgt) ? __ink_acc_trgt.valueOf()[name] || null : (__ink_acc_trgt.name !== undefined ? __ink_acc_trgt.name : null)})(), text))], [() => (__Ink_Empty), () => (text)]]) })(); return __ink_assgn_trgt})(); return cb() })()) })())], [() => (__Ink_Empty), () => (cb())]]);
render = () => update(h(__Ink_String(`div`), [__Ink_String(`app`)], [Sidebar(), FilePanes()]));
refreshRepo();
render()

