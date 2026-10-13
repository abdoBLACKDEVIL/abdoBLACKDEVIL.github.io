// Interaction checks for the static site without a browser dependency.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const base = join(__dirname, '..');
class Element {
  constructor() { this.dataset={};this.children=[];this.attrs={};this.events={};this.hidden=false;this.textContent='';this.open=false;const set=new Set();this.classList={add:(...v)=>v.forEach(x=>set.add(x)),remove:(...v)=>v.forEach(x=>set.delete(x)),toggle:x=>set.has(x)?(set.delete(x),false):(set.add(x),true)}; }
  setAttribute(k,v){this.attrs[k]=String(v)}
  getAttribute(k){return this.attrs[k]}
  addEventListener(k,f){(this.events[k]??=[]).push(f)}
  fire(k,event={}){for(const f of this.events[k]||[])f(event)}
  append(...v){this.children.push(...v)}
  replaceChildren(...v){this.children=v}
  querySelector(){return new Element()}
  showModal(){this.open=true}
  close(){this.open=false}
}
const selectors=new Map();
const query=s=>{if(s==='#enquiry-form')return null;if(!selectors.has(s))selectors.set(s,new Element());return selectors.get(s)};
const doc=new Element();doc.documentElement=new Element();doc.body=new Element();doc.body.dataset.page='shop';doc.querySelector=query;doc.createElement=()=>new Element();doc.createElementNS=()=>new Element();
const filters=['all','paintings','wall-art','sculpture'].map(v=>{const el=new Element();el.dataset.filter=v;return el});
const cards=['paintings','paintings','wall-art','sculpture','sculpture','sculpture'].map(v=>{const el=new Element();el.dataset.category=v;return el});
const galleryButton=new Element();galleryButton.dataset={gallery:'products',id:'golden-study'};
const addButton=new Element();addButton.dataset.add='golden-study';
const count=new Element();
doc.querySelectorAll=s=>({'[data-filter]':filters,'[data-category]':cards,'[data-gallery]':[galleryButton],'[data-add]':[addButton],'[data-count]':[count],'dialog':[query('.gallery-dialog'),query('.request-dialog')]}[s]||[]);
const storage=new Map();
const context={document:doc,URL,URLSearchParams,Map,Set,Date,Math,JSON,crypto:require('node:crypto').webcrypto,location:{search:'',href:'file:///site/shop.html',origin:'null',protocol:'file:',pathname:'/site/shop.html',assign:()=>{}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},sessionStorage:{setItem:()=>{}},setTimeout:()=>1,clearTimeout:()=>{},matchMedia:()=>({matches:false})};
context.window=context;context.addEventListener=()=>{};
vm.createContext(context);vm.runInContext(readFileSync(join(base,'catalog.js'),'utf8'),context);vm.runInContext(readFileSync(join(base,'script.js'),'utf8'),context);
filters[3].fire('click');assert.equal(cards.filter(c=>!c.hidden).length,3);assert.equal(filters[3].attrs['aria-pressed'],'true');
filters[0].fire('click');assert.equal(cards.filter(c=>!c.hidden).length,6);
const addEvent={button:0,target:{closest:s=>s==='[data-add]'?addButton:null}};
doc.fire('click',addEvent);doc.fire('click',addEvent);assert.equal(count.textContent,1);assert.deepEqual(JSON.parse(storage.get('blvk-request')),['golden-study']);assert.match(query('#prepare-request').href,/items=golden-study/);
galleryButton.fire('click');assert.equal(query('.gallery-dialog').open,true);assert.equal(query('#gallery-title').textContent,'Golden Study');assert.equal(query('.gallery-thumbs').children.length,3);
query('[data-next]').fire('click');assert.match(query('#gallery-position').textContent,/Closer view/);
const row=query('#request-items').children[0];row.children[2].fire('click');assert.equal(count.textContent,0);assert.equal(query('#prepare-request').href,'shop.html');
console.log('PASS: filters, duplicate prevention, persisted enquiry list, contact handoff, product gallery, next image, and removal.');
