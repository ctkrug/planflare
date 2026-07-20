(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=[`postgres`,`mysql`,`sqlite`];function t(t){return e.includes(t)}function n(e){switch(e){case`postgres`:return`PostgreSQL`;case`mysql`:return`MySQL`;case`sqlite`:return`SQLite`}}var r={postgres:`Hash Join  (cost=1.16..3.31 rows=2 width=68) (actual time=0.045..15.223 rows=1200 loops=1)
  ->  Seq Scan on orders  (cost=0.00..2.10 rows=10 width=40) (actual time=0.012..12.900 rows=1200 loops=1)
        Filter: (status = 'shipped'::text)
  ->  Hash  (cost=1.05..1.05 rows=5 width=36) (actual time=0.020..0.020 rows=5 loops=1)
        ->  Index Scan using customers_pkey on customers  (cost=0.15..1.05 rows=5 width=36) (actual time=0.008..0.015 rows=5 loops=1)
`,mysql:`{
  "query_block": {
    "select_id": 1,
    "cost_info": { "query_cost": "48.60" },
    "nested_loop": [
      {
        "table": {
          "table_name": "orders",
          "access_type": "ALL",
          "rows_examined_per_scan": 1200,
          "cost_info": { "read_cost": "2.25", "eval_cost": "1.20", "prefix_cost": "3.45" }
        }
      },
      {
        "table": {
          "table_name": "customers",
          "access_type": "eq_ref",
          "rows_examined_per_scan": 1,
          "cost_info": { "read_cost": "0.25", "eval_cost": "0.10", "prefix_cost": "45.15" }
        }
      }
    ]
  }
}
`,sqlite:`1|0|0|SCAN orders
2|0|0|SEARCH customers USING INTEGER PRIMARY KEY (rowid=?)
`};function i(e,t){let n=d(e,y.__wbindgen_malloc,y.__wbindgen_realloc),r=v,i=d(t,y.__wbindgen_malloc,y.__wbindgen_realloc),a=v,o=y.parse_plan(n,r,i,a);if(o[2])throw f(o[1]);return f(o[0])}function a(){return{__proto__:null,"./planscope_parser_bg.js":{__proto__:null,__wbg_Error_92b29b0548f8b746:function(e,t){return Error(c(e,t))},__wbg_String_8564e559799eccda:function(e,t){let n=d(String(t),y.__wbindgen_malloc,y.__wbindgen_realloc),r=v;s().setInt32(e+4,r,!0),s().setInt32(e+0,n,!0)},__wbg___wbindgen_throw_344f42d3211c4765:function(e,t){throw Error(c(e,t))},__wbg_new_424e7ac060a0582f:function(){return{}},__wbg_new_9d3ab694c9e36496:function(){return[]},__wbg_set_6be42768c690e380:function(e,t,n){e[t]=n},__wbg_set_7de5a5b0dd99c30e:function(e,t,n){e[t>>>0]=n},__wbindgen_cast_0000000000000001:function(e){return e},__wbindgen_cast_0000000000000002:function(e,t){return c(e,t)},__wbindgen_cast_0000000000000003:function(e){return BigInt.asUintN(64,e)},__wbindgen_init_externref_table:function(){let e=y.__wbindgen_externrefs,t=e.grow(4);e.set(0,void 0),e.set(t+0,void 0),e.set(t+1,null),e.set(t+2,!0),e.set(t+3,!1)}}}}var o=null;function s(){return(o===null||o.buffer.detached===!0||o.buffer.detached===void 0&&o.buffer!==y.memory.buffer)&&(o=new DataView(y.memory.buffer)),o}function c(e,t){return g(e>>>0,t)}var l=null;function u(){return(l===null||l.byteLength===0)&&(l=new Uint8Array(y.memory.buffer)),l}function d(e,t,n){if(n===void 0){let n=_.encode(e),r=t(n.length,1)>>>0;return u().subarray(r,r+n.length).set(n),v=n.length,r}let r=e.length,i=t(r,1)>>>0,a=u(),o=0;for(;o<r;o++){let t=e.charCodeAt(o);if(t>127)break;a[i+o]=t}if(o!==r){o!==0&&(e=e.slice(o)),i=n(i,r,r=o+e.length*3,1)>>>0;let t=u().subarray(i+o,i+r),a=_.encodeInto(e,t);o+=a.written,i=n(i,r,o,1)>>>0}return v=o,i}function f(e){let t=y.__wbindgen_externrefs.get(e);return y.__externref_table_dealloc(e),t}var p=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0});p.decode();var m=2146435072,h=0;function g(e,t){return h+=t,h>=m&&(p=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0}),p.decode(),h=t),p.decode(u().subarray(e,e+t))}var _=new TextEncoder;`encodeInto`in _||(_.encodeInto=function(e,t){let n=_.encode(e);return t.set(n),{read:e.length,written:n.length}});var v=0,y;function b(e,t){return y=e.exports,o=null,l=null,y.__wbindgen_start(),y}async function x(e,t){if(typeof Response==`function`&&e instanceof Response){if(typeof WebAssembly.instantiateStreaming==`function`)try{return await WebAssembly.instantiateStreaming(e,t)}catch(t){if(e.ok&&n(e.type)&&e.headers.get(`Content-Type`)!==`application/wasm`)console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",t);else throw t}let r=await e.arrayBuffer();return await WebAssembly.instantiate(r,t)}else{let n=await WebAssembly.instantiate(e,t);return n instanceof WebAssembly.Instance?{instance:n,module:e}:n}function n(e){switch(e){case`basic`:case`cors`:case`default`:return!0}return!1}}async function S(e){if(y!==void 0)return y;e!==void 0&&(Object.getPrototypeOf(e)===Object.prototype?{module_or_path:e}=e:console.warn(`using deprecated parameters for the initialization function; pass a single object instead`)),e===void 0&&(e=new URL(``+new URL(`planscope_parser_bg-B8zARXig.wasm`,import.meta.url).href,``+import.meta.url));let t=a();(typeof e==`string`||typeof Request==`function`&&e instanceof Request||typeof URL==`function`&&e instanceof URL)&&(e=fetch(e));let{instance:n,module:r}=await x(await e,t);return b(n,r)}var C;function w(){return C||=S().then(()=>void 0),C}function T(e,t){try{return i(e,t)}catch(e){throw Error(typeof e==`string`?e:String(e))}}function E(e){if(e.actual_time_total_ms===void 0)return;let t=e.children.reduce((e,t)=>e+(t.actual_time_total_ms??0),0);return Math.max(e.actual_time_total_ms-t,0)}function D(e){let t,n=-1/0;function r(e){let i=E(e);i!==void 0&&i>n&&(n=i,t=e);for(let t of e.children)r(t)}return r(e),t}function O(e){let{estimated_rows:t,actual_rows:n}=e;if(t===void 0||n===void 0)return!1;if(t===0||n===0)return t!==n;let r=n/t;return r>=10||r<=.1}function k(e){return e.join(`.`)}function A(e){let t,n=-1/0;function r(e,i){let a=E(e);a!==void 0&&a>n&&(n=a,t=i),e.children.forEach((e,t)=>r(e,[...i,t]))}return r(e,[]),t}function j(e){let t=[{label:`Node type`,value:e.node_type}];return e.relation!==void 0&&t.push({label:`Relation`,value:e.relation}),e.estimated_cost_start!==void 0&&t.push({label:`Estimated cost (start)`,value:e.estimated_cost_start.toString()}),e.estimated_cost_total!==void 0&&t.push({label:`Estimated cost (total)`,value:e.estimated_cost_total.toString()}),e.estimated_rows!==void 0&&t.push({label:`Estimated rows`,value:e.estimated_rows.toLocaleString()}),e.actual_time_start_ms!==void 0&&t.push({label:`Actual time (start)`,value:`${e.actual_time_start_ms} ms`}),e.actual_time_total_ms!==void 0&&t.push({label:`Actual time (total)`,value:`${e.actual_time_total_ms} ms`}),e.actual_rows!==void 0&&t.push({label:`Actual rows`,value:e.actual_rows.toLocaleString()}),e.actual_loops!==void 0&&t.push({label:`Actual loops`,value:e.actual_loops.toString()}),t.push({label:`Children`,value:e.children.length.toString()}),t}function M(e,t={}){let n=D(e),r=new Map,i=document.createElement(`div`);i.className=`tree`,i.setAttribute(`role`,`tree`),i.appendChild(N(e,[],n,t,r));function a(e){for(let t=0;t<e.length;t++){let n=r.get(k(e.slice(0,t)));n?.toggle&&n.toggle.getAttribute(`aria-expanded`)===`false`&&n.toggle.click()}let t=r.get(k(e));t?.row.scrollIntoView?.({block:`center`}),t?.row.focus()}function o(){let e=[];for(let[t,n]of r)n.toggle&&n.toggle.getAttribute(`aria-expanded`)===`false`&&e.push(t);return e}return{element:i,focusPath:a,getCollapsedPaths:o}}function N(e,t,n,r,i){let a=k(t),o=document.createElement(`div`);o.className=`tree-node`;let s=document.createElement(`div`);s.className=`tree-row`,s.tabIndex=0,s.setAttribute(`role`,`treeitem`),s.setAttribute(`aria-level`,String(t.length+1)),e===n&&s.classList.add(`tree-row-hottest`);let c=e.children.length>0,l=c&&(r.collapsedPaths?.has(a)??!1),u,d;if(c)s.setAttribute(`aria-expanded`,String(!l)),u=document.createElement(`button`),u.type=`button`,u.className=`tree-toggle`,u.setAttribute(`aria-expanded`,String(!l)),u.setAttribute(`aria-label`,l?`Expand node`:`Collapse node`),u.textContent=l?`▸`:`▾`,s.appendChild(u);else{let e=document.createElement(`span`);e.className=`tree-toggle-spacer`,e.setAttribute(`aria-hidden`,`true`),s.appendChild(e)}let f=document.createElement(`span`);f.className=`tree-label`,f.textContent=e.relation?`${e.node_type} on ${e.relation}`:e.node_type,s.appendChild(f);let p=document.createElement(`span`);if(p.className=`tree-meta`,p.textContent=P(e),s.appendChild(p),e===n){let e=document.createElement(`span`);e.className=`tree-badge tree-badge-hot`,e.textContent=`hottest`,s.appendChild(e)}if(O(e)){let t=document.createElement(`span`);t.className=`tree-badge tree-badge-mismatch`,t.textContent=`est ${e.estimated_rows.toLocaleString()} → actual ${e.actual_rows.toLocaleString()}`,s.appendChild(t)}o.appendChild(s),i.set(a,{row:s,toggle:u});function m(){r.onNodeSelect?.(e,a,s)}if(s.addEventListener(`click`,m),s.addEventListener(`keydown`,e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),m())}),c){d=document.createElement(`div`),d.className=`tree-children`,d.setAttribute(`role`,`group`);for(let[a,o]of e.children.entries())d.appendChild(N(o,[...t,a],n,r,i));l||o.appendChild(d),u.addEventListener(`click`,e=>{e.stopPropagation();let t=u.getAttribute(`aria-expanded`)===`true`;u.setAttribute(`aria-expanded`,String(!t)),s.setAttribute(`aria-expanded`,String(!t)),u.setAttribute(`aria-label`,t?`Expand node`:`Collapse node`),u.textContent=t?`▸`:`▾`,t?d.remove():o.appendChild(d),r.onToggle?.(a,t)})}return o}function P(e){let t=[];return e.estimated_rows!==void 0&&t.push(`est ${e.estimated_rows.toLocaleString()} rows`),e.actual_rows!==void 0&&t.push(`actual ${e.actual_rows.toLocaleString()} rows`),e.actual_time_total_ms!==void 0&&t.push(`${e.actual_time_total_ms.toFixed(2)} ms`),t.join(` · `)}function F(){let e=document.createElement(`div`);e.className=`inspector-backdrop`,e.hidden=!0;let t=document.createElement(`aside`);t.className=`inspector-panel`,t.setAttribute(`role`,`dialog`),t.setAttribute(`aria-modal`,`true`),t.setAttribute(`aria-label`,`Node details`),t.tabIndex=-1;let n=document.createElement(`div`);n.className=`inspector-head`;let r=document.createElement(`h3`);r.className=`inspector-heading`,n.appendChild(r);let i=document.createElement(`button`);i.type=`button`,i.className=`ghost-btn inspector-close`,i.textContent=`Close`,i.setAttribute(`aria-label`,`Close node details`),n.appendChild(i),t.appendChild(n);let a=document.createElement(`dl`);a.className=`inspector-fields`,t.appendChild(a),e.appendChild(t);let o;function s(){e.hidden||(e.hidden=!0,o?.focus(),o=void 0)}function c(n,i){o=i,r.textContent=n.relation?`${n.node_type} on ${n.relation}`:n.node_type,a.innerHTML=``;for(let e of j(n)){let t=document.createElement(`dt`);t.textContent=e.label;let n=document.createElement(`dd`);n.textContent=e.value,a.appendChild(t),a.appendChild(n)}e.hidden=!1,t.focus()}return e.addEventListener(`click`,t=>{t.target===e&&s()}),i.addEventListener(`click`,s),t.addEventListener(`keydown`,e=>{if(e.key===`Escape`){s();return}if(e.key!==`Tab`)return;let n=Array.from(t.querySelectorAll(`a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])`));if(n.length===0){e.preventDefault(),t.focus();return}let r=n[0],i=n[n.length-1];e.shiftKey&&document.activeElement===r?(e.preventDefault(),i.focus()):!e.shiftKey&&document.activeElement===i&&(e.preventDefault(),r.focus())}),{element:e,open:c,close:s}}var I=`planscope:last-plan`;function L(){try{return typeof localStorage<`u`}catch{return!1}}function R(){if(!L())return null;let e=localStorage.getItem(I);if(!e)return null;try{let n=JSON.parse(e);return typeof n!=`object`||!n||typeof n.engine!=`string`||!t(n.engine)||typeof n.text!=`string`||!Array.isArray(n.collapsedPaths)?null:{engine:n.engine,text:n.text,collapsedPaths:n.collapsedPaths.filter(e=>typeof e==`string`)}}catch{return null}}function z(e){if(L())try{localStorage.setItem(I,JSON.stringify(e))}catch{}}function B(){if(L())try{localStorage.removeItem(I)}catch{}}var V=[`postgres`,`mysql`,`sqlite`];function H(e){e.innerHTML=`
    <header class="site-header">
      <div class="brand-lockup">
        <span class="wordmark" id="wordmark">Plan<em>flare</em></span>
        <div>
          <h1 class="tagline">Postgres EXPLAIN ANALYZE visualizer for faster fixes</h1>
          <p class="header-subhead">Paste a plan. See the tree and the node consuming the runtime.</p>
        </div>
      </div>
      <a class="repo-link" href="https://github.com/ctkrug/planscope">View on GitHub <span aria-hidden="true">↗</span></a>
    </header>
    <main class="page-main">
      <div class="workspace">
        <aside class="input-rail" aria-label="Plan input">
          <div class="input-rail-head">
            <h2>Input</h2>
            <button id="toggle-input" class="ghost-btn" type="button" aria-expanded="true" aria-controls="input-rail-body">
              Collapse
            </button>
          </div>
          <div id="input-rail-body">
            <label for="engine-select">Engine</label>
            <select id="engine-select">
              ${V.map(e=>`<option value="${e}">${n(e)}</option>`).join(``)}
            </select>
            <label for="plan-input">EXPLAIN output</label>
            <textarea
              id="plan-input"
              placeholder="Paste EXPLAIN (ANALYZE) output here..."
              spellcheck="false"
            ></textarea>
            <button id="visualize-btn" type="button">Visualize</button>
            <p id="input-error" class="input-error" role="alert" hidden></p>
            <div class="example-row" role="group" aria-label="Try an example plan">
              <span class="example-label">Try an example</span>
              ${V.map(e=>`<button type="button" class="ghost-btn example-btn" data-engine="${e}">${n(e)}</button>`).join(``)}
            </div>
            <button id="clear-saved-btn" class="ghost-btn" type="button">
              Clear saved plan
            </button>
          </div>
        </aside>
        <section class="output-panel" aria-label="Cost tree">
          <div class="output-panel-head">
            <h2>Cost tree</h2>
            <button id="jump-hottest-btn" class="ghost-btn" type="button" hidden>
              Jump to hottest node
            </button>
          </div>
          <div id="output-content" aria-live="polite">
            <p class="output-placeholder">Paste a plan and click Visualize to see the cost tree.</p>
          </div>
        </section>
      </div>

      <section class="explain-guide" aria-labelledby="guide-heading">
        <div class="guide-intro">
          <p class="guide-index">QUERY PLAN READER / 02</p>
          <h2 id="guide-heading">Turn EXPLAIN output into a diagnosis</h2>
          <p>A Postgres EXPLAIN ANALYZE visualizer should answer one practical question: which operation is making this query slow? Planflare parses the plan in your browser, renders its parent and child operations, and marks the node with the highest self-time. That keeps an expensive sequential scan or join visible instead of buried in copied terminal output.</p>
          <p>The same view accepts MySQL <code>EXPLAIN FORMAT=JSON</code> and SQLite <code>EXPLAIN QUERY PLAN</code>. Each parser converts engine-specific fields into one tree, so you can use the same reading pattern when an application moves between databases. The pasted text stays on your device because the Rust parser runs as WebAssembly with no upload step.</p>
        </div>

        <div class="benefit-grid" aria-label="Planflare capabilities">
          <article><span>01</span><h3>Find runtime hotspots</h3><p>Self-time subtracts child duration from each node's inclusive total, preventing the root operation from winning by default.</p></article>
          <article><span>02</span><h3>Catch estimate errors</h3><p>A blue badge flags row estimates that differ from actual rows by more than 10 times, a useful clue when the planner chose the wrong join or scan.</p></article>
          <article><span>03</span><h3>Inspect the full node</h3><p>Open any row to read startup cost, total cost, loops, relation, and available timing fields without expanding the raw plan again.</p></article>
        </div>

        <div class="faq">
          <h2>Query plan visualizer FAQ</h2>
          <details><summary>What is a Postgres EXPLAIN ANALYZE visualizer?</summary><p>It converts PostgreSQL's measured execution plan into a visual hierarchy. Planflare uses actual timing and row counts when they are present, highlights the operation with the highest self-time, and keeps the original estimates beside the measurements.</p></details>
          <details><summary>How does a SQL query plan visualizer find slow nodes?</summary><p>Planflare compares each node's measured total time with the totals of its direct children. The remaining self-time belongs to that operation. The largest remainder gets the red hotspot treatment, while every subtree remains collapsible for deeper inspection.</p></details>
          <details><summary>Does Planflare work as a MySQL EXPLAIN visualizer?</summary><p>Yes. Select MySQL and paste the output from <code>EXPLAIN FORMAT=JSON</code>. Nested loops, table access types, estimated rows, and query cost are normalized into the same cost tree used for PostgreSQL plans.</p></details>
          <details><summary>Can it visualize SQLite query plans?</summary><p>Yes. Paste the rows returned by <code>EXPLAIN QUERY PLAN</code> with their id, parent, unused, and detail columns. Planflare rebuilds the parent-child structure and labels scans, searches, indexes, and subqueries.</p></details>
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <span>Planflare parses locally. No plan text leaves this page.</span>
      <a href="https://apps.charliekrug.com">More by Charlie Krug <span aria-hidden="true">→</span> apps.charliekrug.com</a>
    </footer>
  `;let i=e.querySelector(`#visualize-btn`),a=e.querySelector(`#engine-select`),o=e.querySelector(`#plan-input`),s=e.querySelector(`#output-content`),c=e.querySelector(`#input-error`),l=e.querySelector(`#toggle-input`),u=e.querySelector(`#input-rail-body`),d=e.querySelector(`#wordmark`),f=e.querySelector(`#jump-hottest-btn`),p=F();e.appendChild(p.element);function m(){d.classList.remove(`swept`),d.offsetWidth,d.classList.add(`swept`)}function h(e){l.setAttribute(`aria-expanded`,String(!e)),l.textContent=e?`Expand`:`Collapse`,u.hidden=e}l.addEventListener(`click`,()=>{h(l.getAttribute(`aria-expanded`)===`true`)});function g(e,t){s.innerHTML=``;let n=document.createElement(`p`);n.className=t?`output-placeholder output-placeholder-error`:`output-placeholder`,n.textContent=e,s.appendChild(n)}function _(){f.hidden=!0,f.onclick=null}function v(e){c.textContent=e,c.hidden=!1,g(e,!0),_()}function y(){c.hidden=!0,c.textContent=``}function b(e,t,r=[]){let i=t.trim();if(!i){v(`Paste a plan first.`);return}y(),g(`Parsing as ${n(e)}…`,!1);let a=new Set(r),o=()=>z({engine:e,text:i,collapsedPaths:Array.from(a)});w().then(()=>{let t=T(e,i);s.innerHTML=``;let n=M(t,{collapsedPaths:a,onNodeSelect:(e,t,n)=>p.open(e,n),onToggle:(e,t)=>{t?a.add(e):a.delete(e),o()}});s.appendChild(n.element),h(!0),m();let r=A(t);r?(f.hidden=!1,f.onclick=()=>n.focusPath(r)):_(),o()}).catch(e=>{v(e instanceof Error?e.message:String(e))})}i.addEventListener(`click`,()=>{let e=a.value;t(e)&&b(e,o.value)}),e.querySelectorAll(`.example-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let n=e.dataset.engine;if(!n||!t(n))return;let i=r[n];a.value=n,o.value=i,b(n,i)})}),e.querySelector(`#clear-saved-btn`).addEventListener(`click`,()=>{B(),o.value=``,y(),g(`Paste a plan and click Visualize to see the cost tree.`,!1),_(),h(!1)});let x=R();x&&(a.value=x.engine,o.value=x.text,b(x.engine,x.text,x.collapsedPaths))}var U=document.getElementById(`app`);U&&H(U);