import './styles.css';
import './auth-portal.js';
import { getFollowUpQueue, getSalesMetrics, recommendNextAction } from './operations.js';
import { buildContentPrompt, getCopilotCapabilities } from './copilot.js';
import { getContentPlannerModules, getContentPlannerModule } from './content-planner-modules.js';

const KEY = 'bkbusicare-workspace-v1';
const BRAND_LOGO_URL = 'https://busicarecom.wordpress.com/wp-content/uploads/2026/11/bk-busicare-official-logo.png.jpg';
const PROFILE_PHOTO_URL = 'https://busicarecom.wordpress.com/wp-content/uploads/2026/11/bk-busicare-profile.jpg';
const defaultData = {workspace:{name:'BK-BusiCare',plan:'Internal workspace'},leads:[],content:[]};
let data = load();
let page = 'Dashboard';
let selectedSubmenu = '';
let leadQuery = '';
let leadStatus = 'All';
let selectedContentModule = 'social-content';
let storeCart = {};
const demoProducts = [
  {id:'sample-1',name:'BK-BusiCare Business Starter Kit',kind:'Digital concept',description:'Sample catalogue item for layout testing. No product or download is supplied.'},
  {id:'sample-2',name:'BK-BusiCare Brand Essentials',kind:'Service concept',description:'Sample service listing for interface preview. No booking or payment is available.'},
  {id:'sample-3',name:'BK-BusiCare Marketing Toolkit',kind:'Digital concept',description:'Sample catalogue item only. Digital access is not enabled.'}
];
function load(){
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return structuredClone(defaultData);
    const workspace = stored.workspace && typeof stored.workspace === 'object' && !Array.isArray(stored.workspace)
      ? {...defaultData.workspace, name: typeof stored.workspace.name === 'string' && stored.workspace.name.trim() ? stored.workspace.name.trim().slice(0,120) : defaultData.workspace.name}
      : structuredClone(defaultData.workspace);
    const leads = Array.isArray(stored.leads) ? stored.leads.filter(l =>
      l && typeof l === 'object' && Number.isSafeInteger(Number(l.id)) && Number(l.id) > 0 &&
      typeof l.name === 'string' && l.name.trim() && l.name.length <= 160 &&
      typeof (l.company ?? '') === 'string' && l.company.length <= 160 &&
      typeof (l.service ?? '') === 'string' && l.service.length <= 120 &&
      typeof (l.phone ?? '') === 'string' && l.phone.length <= 40 &&
      typeof (l.email ?? '') === 'string' && l.email.length <= 254 &&
      typeof (l.notes ?? '') === 'string' && l.notes.length <= 4000 &&
      typeof (l.followUp ?? '') === 'string' && l.followUp.length <= 10 &&
      Number.isFinite(Number(l.value ?? 0)) && Number(l.value ?? 0) >= 0 &&
      ['New','Contacted','Proposal','Won','Lost'].includes(l.status)
    ).map(l => ({...l, id:Number(l.id), name:l.name.trim(), value:Number(l.value ?? 0)})) : [];
    const content = Array.isArray(stored.content) ? stored.content.filter(c =>
      c && typeof c === 'object' && typeof c.title === 'string' && c.title.trim() && c.title.length <= 200 &&
      ['Facebook','Instagram','TikTok','LinkedIn','YouTube'].includes(c.platform) &&
      ['Idea','Draft','Ready for review'].includes(c.status) && typeof (c.date ?? '') === 'string' && (c.date ?? '').length <= 10
    ) : [];
    return {workspace, leads, content};
  } catch {
    return structuredClone(defaultData);
  }
}
function save(){
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    // Keep the in-memory view consistent with the last successfully persisted state.
    data = load();
    alert('Data could not be saved. The previously saved data has been restored. Clear browser storage and try again.');
    return false;
  }
}
function money(n){return 'BDT '+Number(n||0).toLocaleString('en-BD')}
function csvCell(value){const raw=String(value??'');const safe=/^[\u0000-\u0020\uFEFF\u200B-\u200D\u2060]*[=+@-]/.test(raw)?"'"+raw:raw;return '"'+safe.replaceAll('"','""')+'"'}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const nav=[['Dashboard','▦'],['Leads','◉'],['Sales Pipeline','⇢'],['Content Planner','▤'],['Store','▣'],['Reports','▥'],['Settings','⚙']];

const submenuItems={
  'Dashboard':['Overview','Follow-ups','Recent Leads'],
  'Leads':['All Leads','Add Lead','Follow-ups','Status'],
  'Sales Pipeline':['Pipeline Overview','New','Contacted','Proposal','Won','Lost'],
  'Content Planner':['Planner Modules','Planning Brief','AI Copilot','Content Calendar'],
  'Store':['Catalogue','Categories','Demo Cart'],
  'Reports':['Sales Summary','Lead Status','Export'],
  'Settings':['Workspace','Data Backup','SaaS Capabilities']
};
function renderSubmenu(){
  const items=submenuItems[page]||[];
  if(!items.length)return '';
  if(!items.includes(selectedSubmenu))selectedSubmenu=items[0];
  return items.map((label,i)=>'<button type="button" class="subnav-item '+(label===selectedSubmenu?'active':'')+'" data-submenu="'+esc(label)+'">'+esc(label)+'</button>').join('');
}
function activateSubmenu(label){
  selectedSubmenu=label;
  const targets={
    'Overview':'#dashboard-overview','Follow-ups':page==='Leads'?'#leads-followups':'#dashboard-followups','Recent Leads':'#dashboard-recent-leads',
    'All Leads':'#leads-table','Add Lead':'#add-lead','Status':'#lead-status-filter',
    'Pipeline Overview':'#pipeline-overview','New':'#pipeline-stage-new','Contacted':'#pipeline-stage-contacted','Proposal':'#pipeline-stage-proposal','Won':'#pipeline-stage-won','Lost':'#pipeline-stage-lost',
    'Planner Modules':'#planner-modules','Planning Brief':'#planner-brief-form','AI Copilot':'#planner-copilot','Content Calendar':'#content-calendar',
    'Catalogue':'#store-catalogue','Categories':'#store-catalogue','Demo Cart':'#store-cart',
    'Sales Summary':'#report-summary','Lead Status':'#report-status','Export':'#export',
    'Workspace':'#workspace-settings','Data Backup':'#data-backup','SaaS Capabilities':'#saas-capabilities'
  };
  render();
  if(label==='Add Lead'){document.querySelector('#add-lead')?.click();return;}
  if(label==='Export'){document.querySelector('#export')?.click();return;}
  const selector=targets[label];
  const target=selector?document.querySelector(selector):null;
  if(target){target.scrollIntoView({behavior:'smooth',block:'start'});if(label==='Status')target.focus();}
}
function shell(){document.querySelector('#app').innerHTML=`
<div class="layout"><aside class="sidebar"><div class="brand"><img src="https://busicarecom.wordpress.com/wp-content/uploads/2026/11/busicare-app-icon.jpg" alt="BusiCare app icon" class="app-brand-icon"><div class="app-brand-name">Busi<span>Care</span><small>BUSINESS WORKSPACE</small></div></div><div class="workspace">WORKSPACE <strong>${esc(data.workspace.name)}</strong></div><nav>${nav.map(([n,i])=>`<button class="nav ${page===n?'active':''}" data-page="${n}"><span>${i}</span>${n}</button>`).join('')}</nav><div class="side-foot"><span class="status-dot"></span> Local MVP · Demo mode</div></aside><main class="main"><header><div><div class="eyebrow">BUSICARE / WORKSPACE</div><h1>${page}</h1></div><div class="user"><img class="avatar" src="${PROFILE_PHOTO_URL}" alt="Administrator profile photo" style="width:44px;height:44px;object-fit:cover;border-radius:50%;border:2px solid #d8b35f"><div><small>Welcome,</small><b>Md. Rezaul Karim</b><small>AI Skills Mentor | Business Growth Consultant</small></div></div></header><nav class="page-subnav" aria-label="${page} sections">${renderSubmenu()}</nav><section id="view">${renderPage()}</section><footer>BK-BusiCare AI Agent System <span>Version 0.2.0 · MVP</span></footer></main></div>`;}
function renderPage(){
if(page==='Dashboard'){const metrics=getSalesMetrics(data.leads), followUps=getFollowUpQueue(data.leads), total=metrics.totalLeads, pipeline=metrics.openPipelineValue,won=metrics.wonDeals;return `<div class="welcome" id="dashboard-overview"><div><div class="eyebrow light">BUSINESS OVERVIEW</div><h2>All Your Business Operations in One Place</h2><p>Manage Leads, Sales & Marketing Operations.</p></div><div class="welcome-mark">BK</div></div><div class="stats" id="report-summary"><article class="stat"><span>Total Leads</span><strong>${total}</strong><small>All Potential Customers</small></article><article class="stat"><span>Pipeline Value</span><strong>${money(pipeline)}</strong><small>Current Pipeline Value</small></article><article class="stat"><span>Won Deals</span><strong>${won}</strong><small>Closed-Won Deals</small></article><article class="stat"><span>Content Planned</span><strong>${data.content.length}</strong><small>Planned Content Items</small></article></div><div class="stats compact"><article class="stat"><span>Won Revenue</span><strong>${money(metrics.wonRevenue)}</strong><small>Revenue from Won Deals</small></article><article class="stat"><span>Win Rate</span><strong>${metrics.winRate}%</strong><small>Won / (Won + Lost)</small></article></div><div class="panel" id="dashboard-followups"><h3>Today's Follow-ups</h3><p class="muted">Scheduled and overdue follow-ups</p>${followUps.map(item=>{const lead=data.leads.find(l=>l.id===item.id);return lead?`<div class="report-row"><div><b>${esc(item.name)}</b><small>${esc(item.followUp)} · ${esc(recommendNextAction(lead))}</small></div><span class="pill">${item.overdue?'Overdue':'Due today'}</span></div>`:''}).join('')||'<p class="empty">No follow-ups are due today or overdue.</p>'}</div><div class="section-head" id="dashboard-recent-leads"><div><h3>Recent Leads</h3><p>Most recently added potential customers</p></div><button class="primary" data-go="Leads">+ Add Lead</button></div>${leadTable(data.leads.slice().reverse().slice(0,5))}<div class="notice"><b>Upcoming Integrations</b><p>Zoho CRM, Meta, Instagram, TikTok, LinkedIn, and YouTube integrations are not yet enabled. They will be added after API permissions and security checks.</p></div>`}
if(page==='Leads')return `<div class="section-head"><div><h3>Lead Management</h3><p>Create leads, manage communication, follow-ups, and update statuses</p></div><button class="primary" id="add-lead">+ New Lead</button></div><div class="filters"><input id="lead-search" placeholder="Search by name, company, or phone" value="${esc(leadQuery)}"><select id="lead-status-filter"><option value="All">All Statuses</option>${['New','Contacted','Proposal','Won','Lost'].map(s=>`<option value="${s}" ${leadStatus===s?'selected':''}>${s}</option>`).join('')}</select></div><div id="leads-table">${leadTable(filteredLeads(),true)}</div><div id="lead-form"></div><div class="panel" id="leads-followups"><h3>Lead Follow-ups</h3><p class="muted">Upcoming and overdue follow-ups for your leads</p>${getFollowUpQueue(data.leads).map(item=>{const lead=data.leads.find(l=>l.id===item.id);return lead?`<article class="report-row"><div><b>${esc(item.name)}</b><small>${esc(item.followUp)} · ${esc(recommendNextAction(lead))}</small></div><span class="pill">${item.overdue?"Overdue":"Due today"}</span></article>`:""}).join("")||'<p class="empty">No follow-ups are due today or overdue.</p>'}</div>`;
if(page==='Sales Pipeline'){const stages=['New','Contacted','Proposal','Won','Lost'];return `<div class="stats compact" id="pipeline-overview"><article class="stat"><span>Pipeline Value</span><strong>${money(data.leads.filter(l=>!['Won','Lost'].includes(l.status)).reduce((s,l)=>s+Number(l.value||0),0))}</strong></article><article class="stat"><span>Closed Won</span><strong>${data.leads.filter(l=>l.status==='Won').length}</strong></article><article class="stat"><span>Open Deals</span><strong>${data.leads.filter(l=>!['Won','Lost'].includes(l.status)).length}</strong></article></div><div class="board">${stages.map(s=>`<div class="stage" id="pipeline-stage-${s.toLowerCase()}"><div class="stage-title">${s}<span>${data.leads.filter(l=>l.status===s).length}</span></div>${data.leads.filter(l=>l.status===s).map(l=>`<article class="deal"><b>${esc(l.name)}</b><small>${esc(l.company||l.service)}</small><strong>${money(l.value)}</strong><select data-status="${esc(l.id)}">${stages.map(x=>`<option ${x===l.status?'selected':''}>${x}</option>`).join('')}</select></article>`).join('')||'<p class="empty">No deals</p>'}</div>`).join('')}</div>`}
if(page==='Content Planner')return renderContentPlanner();
if(page==='Store')return renderStore();
if(page==='Reports')return `<div class="stats" id="report-summary"><article class="stat"><span>Total Leads</span><strong>${data.leads.length}</strong></article><article class="stat"><span>Won</span><strong>${data.leads.filter(l=>l.status==='Won').length}</strong></article><article class="stat"><span>Lost</span><strong>${data.leads.filter(l=>l.status==='Lost').length}</strong></article><article class="stat"><span>Open Pipeline Value</span><strong>${money(data.leads.filter(l=>!['Won','Lost'].includes(l.status)).reduce((s,l)=>s+Number(l.value||0),0))}</strong></article></div><div class="panel" id="report-status"><h3>Lead Status Report</h3>${['New','Contacted','Proposal','Won','Lost'].map(s=>`<div class="report-row"><span>${s}</span><div class="bar"><i style="width:${data.leads.length?data.leads.filter(l=>l.status===s).length/data.leads.length*100:0}%"></i></div><b>${data.leads.filter(l=>l.status===s).length}</b></div>`).join('')}<button class="secondary" id="export">CSV Export</button></div>`;
return `<div class="panel" id="workspace-settings"><h3>Workspace Settings</h3><label>Business / Workspace name<input id="workspace-name" value="${esc(data.workspace.name)}"></label><p class="muted">In this MVP, data is stored in this browser's Local Storage. Cross-device sync and multi-user login are not yet available.</p><button class="primary" id="save-settings">Save Settings</button><hr><h3 id="data-backup">Data Backup</h3><p class="muted">Download a JSON backup of leads, content, and workspace data. Restore a previously exported BK-BusiCare JSON backup here. Importing will replace the current data.</p><div class="actions"><button class="secondary" id="backup-export">JSON Backup Export</button><label class="secondary" for="backup-import" style="display:inline-flex;align-items:center;cursor:pointer">JSON Backup Import<input id="backup-import" type="file" accept="application/json,.json" style="display:none"></label></div><hr><h3 id="saas-capabilities">Planned SaaS Capabilities</h3><ul><li>Separate workspaces and data for each organization</li><li>Role-based access and team management</li><li>Subscription, billing, and usage limits</li><li>Secure cloud database and audit logs</li></ul></div>`;
}


function renderStore(){
  const count=Object.values(storeCart).reduce((sum,n)=>sum+n,0);
  const paymentMethods=['bKash','Rocket','Visa / Mastercard','Bank payment'];
  return `<div class="welcome"><div><div class="eyebrow light">BK-BUSICARE / STORE PREVIEW</div><h2>BK-BusiCare Store</h2><p>Catalogue and cart interface preview — live sales are not enabled.</p></div><div class="welcome-mark">BK</div></div>
  <div class="notice"><b>Demo catalogue only</b><p>All products and services below are samples. They are not real offers, inventory, prices, or orders. The cart is a temporary demo in this browser; checkout, payments, and order submission are disabled.</p></div>
  <div class="store-toolbar" id="store-catalogue"><div><h3>Catalogue</h3><p class="muted">Sample products and services</p></div><span class="pill">Cart items: ${count}</span></div>
  <div class="store-grid">${demoProducts.map(p=>`<article class="store-card"><div class="store-art">BK</div><span class="pill">${esc(p.kind)}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="store-meta"><b>Price unavailable</b><small>Price not set</small></div><button class="secondary" data-cart-add="${esc(p.id)}">Add to Demo Cart</button></article>`).join('')}</div>
  <div class="panel store-cart" id="store-cart"><div class="section-head"><div><h3>Demo Cart</h3><p>Cart quantities are stored for this session only</p></div><button class="text-btn" id="clear-cart">Clear Cart</button></div>
  ${count?demoProducts.filter(p=>storeCart[p.id]).map(p=>`<div class="report-row"><span>${esc(p.name)}</span><div class="store-quantity"><button data-cart-minus="${p.id}">−</button><b>${storeCart[p.id]}</b><button data-cart-plus="${p.id}">+</button></div><button class="text-btn" data-cart-remove="${p.id}">Delete</button></div>`).join(''):'<p class="empty">Your cart is empty.</p>'}
  <div class="notice"><b>Planned payment gateway: SSLCOMMERZ</b><p>Selected methods: ${paymentMethods.map(esc).join(' · ')}. This is a display-only preview. No payment session is created and no money can be collected.</p><p><b>Activation blocked:</b> a responsible adult business owner must complete merchant onboarding and authorization. Sandbox integration, server-side payment validation, IPN verification, refund handling, and security tests must be completed before any live payment is considered.</p></div>
  <button class="primary" disabled title="Payment integration is not connected">Checkout — Disabled (Sandbox readiness pending)</button></div>`;
}

function renderContentPlanner(){
  const modules=getContentPlannerModules();
  const active=getContentPlannerModule(selectedContentModule)||modules[0];
  const moduleCards=modules.map(m=>`<button type="button" class="planner-tab ${m.id===active.id?'active':''}" data-planner-module="${m.id}"><b>${esc(m.label)}</b><small>${esc(m.description)}</small></button>`).join('');
  const items=active.items.map(item=>`<li>${esc(item)}</li>`).join('');
  const platformOptions=active.id==='meta-ads'?'<option>Facebook</option><option>Instagram</option>':active.id==='google-ads'?'<option>Search Ads</option><option>Display Ads</option><option>YouTube Ads</option>':'<option>Facebook</option><option>Instagram</option><option>TikTok</option><option>LinkedIn</option><option>YouTube</option>';
  const briefLabel=active.id==='meta-ads'?'Campaign objective, audience and budget brief':active.id==='google-ads'?'Campaign objective, keywords and budget brief':active.id==='publishing-scheduling'?'Publishing schedule brief':'Content / campaign brief';
  return `<div class="section-head"><div><h3>Content Planner Workspace</h3><p>Create and review plans across five modules</p></div></div>
  <div class="planner-layout"><aside class="planner-nav" id="planner-modules"><div class="planner-nav-title">PLANNER MODULES</div>${moduleCards}</aside>
  <section class="planner-main"><div class="panel planner-module-head"><div class="eyebrow">CONTENT PLANNER / MODULE</div><h2>${esc(active.label)}</h2><p class="muted">${esc(active.description)}</p><ul class="planner-items">${items}</ul><span class="pill">Planning mode · No live execution</span></div>
  <form class="panel form" id="planner-brief-form"><h3>${briefLabel}</h3><div class="form-grid">
  <label>Platform / Channel<select name="platform">${platformOptions}</select></label>
  <label>Campaign / Content title *<input name="title" maxlength="160" required placeholder="Enter a clear title"></label>
  <label>Objective<input name="objective" maxlength="160" placeholder="Awareness, leads, traffic, conversions"></label>
  <label>Target audience<input name="audience" maxlength="160" placeholder="Audience segment"></label>
  <label>Budget (BDT, planning only)<input name="budget" type="number" min="0" max="100000000" step="1" placeholder="Optional planning estimate"></label>
  <label>Proposed date<input name="date" type="date"></label>
  <label class="planner-wide">Notes / Keywords / Creative direction<input name="notes" maxlength="1000" placeholder="Add keywords, message, creative or scheduling notes"></label>
  </div><div class="actions"><button class="primary" type="submit">Build Planning Brief</button><button class="secondary" type="button" id="planner-download" disabled>Download Brief</button></div><textarea id="planner-brief-output" rows="8" readonly placeholder="Your structured planning brief will appear here."></textarea></form>
  </section></div>
  <div class="panel" id="planner-copilot"><h3>AI Copilot · Prompt Builder</h3><p class="muted">Enter a topic and platform. Copy the prompt and use it with your preferred AI tool. No live AI provider is connected.</p><div class="form-grid"><label>Content Topic *<input id="copilot-topic" maxlength="180" placeholder="Example: Promote a business with AI"></label><label>Platform<select id="copilot-platform"><option>Facebook</option><option>Instagram</option><option>TikTok</option><option>LinkedIn</option><option>YouTube</option></select></label><label>Target Audience<input id="copilot-audience" maxlength="120" value="Potential customers in Bangladesh"></label><label>Objective<input id="copilot-objective" maxlength="120" value="engagement and qualified leads"></label><label>Offer / Key Details<input id="copilot-offer" maxlength="180" placeholder="Optional"></label></div><div class="actions"><button class="primary" type="button" id="build-copilot-prompt">Build AI Prompt</button><button class="secondary" type="button" id="copy-copilot-prompt" disabled>Copy Prompt</button></div><textarea id="copilot-output" rows="7" readonly placeholder="Your prompt will appear here"></textarea><small class="muted">Provider connected: ${getCopilotCapabilities().liveProviderConnected?'Yes':'No'} · Auto publishing: No</small></div>
  <div class="section-head" id="content-calendar"><div><h3>Organic Content Calendar</h3><p>Content plans for Facebook, Instagram, TikTok, LinkedIn, and YouTube</p></div><button class="primary" id="add-content">+ Add Content</button></div><div id="content-form"></div><div class="content-list">${data.content.map((c,i)=>`<article class="content-card"><div><b>${esc(c.title)}</b><small>${esc(c.platform)} · ${esc(c.date||'Date not set')}</small></div><span class="pill">${esc(c.status)}</span><button class="text-btn" data-delete-content="${i}">Delete</button></article>`).join('')||'<div class="empty-panel">No content plans yet. Select “Add Content” to get started.</div>'}</div>
  <div class="notice"><b>Execution & safety boundary</b><p>You can create and download briefs here. No Meta or Google account is connected. Ads are not created or launched, no money is spent, and automatic publishing or background scheduling is not performed.</p></div>`;
}

function filteredLeads(){const q=leadQuery.trim().toLocaleLowerCase();return data.leads.slice().reverse().filter(l=>(leadStatus==='All'||l.status===leadStatus)&&(!q||[l.name,l.company,l.phone,l.service].some(v=>String(v||'').toLocaleLowerCase().includes(q))))}
function leadTable(items,actions=false){return `<div class="table-wrap"><table><thead><tr><th>Name / Company</th><th>Service</th><th>Status</th><th>Potential Value</th>${actions?'<th>Actions</th>':''}</tr></thead><tbody>${items.map(l=>`<tr><td><b>${esc(l.name)}</b><small>${esc(l.company||'')} · ${esc(l.phone||'No phone')}${l.followUp?` · Follow-up: ${esc(l.followUp)}`:''}</small></td><td>${esc(l.service)}</td><td><span class="pill">${esc(l.status)}</span></td><td>${money(l.value)}</td>${actions?`<td><button class="text-btn" data-edit-lead="${esc(l.id)}">Edit</button> <button class="text-btn" data-delete-lead="${esc(l.id)}">Delete</button></td>`:''}</tr>`).join('')||`<tr><td colspan="${actions?5:4}" class="empty">No leads found</td></tr>`}</tbody></table></div>`}
function bindLeadActions(){
document.querySelectorAll('[data-edit-lead]').forEach(b=>b.onclick=()=>{const lead=data.leads.find(x=>x.id===Number(b.dataset.editLead));if(!lead)return;const host=document.querySelector('#lead-form');if(!host)return;host.innerHTML=`<form class="panel form" id="edit-lead-form"><h3>Edit Lead</h3><div class="form-grid"><label>Name *<input name="name" maxlength="160" required value="${esc(lead.name)}"></label><label>Company<input name="company" maxlength="160" value="${esc(lead.company||'')}"></label><label>Service<input name="service" value="${esc(lead.service||'')}"></label><label>Phone<input name="phone" maxlength="40" value="${esc(lead.phone||'')}"></label><label>Potential Value (BDT)<input name="value" type="number" min="0" value="${Number(lead.value||0)}"></label><label>Next Follow-up<input name="followUp" type="date" value="${esc(lead.followUp||'')}"></label></div><div class="actions"><button class="primary">Save Changes</button><button type="button" class="secondary" id="cancel-edit">Cancel</button></div></form>`;document.querySelector('#edit-lead-form').onsubmit=e=>{e.preventDefault();const form=new FormData(e.target);const name=String(form.get('name')||'').trim();const value=Number(form.get('value'));if(!name||name.length>160||!Number.isFinite(value)||value<0){alert('Enter a name and a valid value of zero or more.');return;}Object.assign(lead,{name,company:String(form.get('company')||'').trim().slice(0,160),service:String(form.get('service')||'').trim().slice(0,120),phone:String(form.get('phone')||'').trim().slice(0,40),value,followUp:String(form.get('followUp')||'')});save();shell()};document.querySelector('#cancel-edit').onclick=()=>host.innerHTML='';host.scrollIntoView({behavior:'smooth',block:'start'})});
document.querySelectorAll('[data-delete-lead]').forEach(b=>b.onclick=()=>{const id=Number(b.dataset.deleteLead);const lead=data.leads.find(x=>x.id===id);if(lead&&confirm(`Permanently delete the lead “${lead.name}”?`)){data.leads=data.leads.filter(x=>x.id!==id);save();shell()}});
}
function bind(){
document.querySelectorAll('[data-cart-add]').forEach(b=>b.onclick=()=>{const id=b.dataset.cartAdd;storeCart[id]=Math.min(10,(storeCart[id]||0)+1);render();bind()});
document.querySelectorAll('[data-cart-plus]').forEach(b=>b.onclick=()=>{const id=b.dataset.cartPlus;storeCart[id]=Math.min(10,(storeCart[id]||0)+1);render();bind()});
document.querySelectorAll('[data-cart-minus]').forEach(b=>b.onclick=()=>{const id=b.dataset.cartMinus;storeCart[id]=Math.max(0,(storeCart[id]||0)-1);if(!storeCart[id])delete storeCart[id];render();bind()});
document.querySelectorAll('[data-cart-remove]').forEach(b=>b.onclick=()=>{delete storeCart[b.dataset.cartRemove];render();bind()});
const clearCart=document.querySelector('#clear-cart');if(clearCart)clearCart.onclick=()=>{storeCart={};render();bind()};


const plannerForm=document.querySelector('#planner-brief-form');
if(plannerForm)plannerForm.onsubmit=e=>{e.preventDefault();const f=new FormData(plannerForm);const title=String(f.get('title')||'').trim();if(!title){alert('A brief title is required.');return;}const budget=String(f.get('budget')||'').trim();const brief=['BK-BusiCare · '+(getContentPlannerModule(selectedContentModule)?.label||'Content Planner'),'Title: '+title,'Platform: '+String(f.get('platform')||''),'Objective: '+String(f.get('objective')||''),'Audience: '+String(f.get('audience')||''),'Planning budget (BDT): '+(budget||'Not specified'),'Proposed date: '+String(f.get('date')||'Not specified'),'Notes: '+String(f.get('notes')||''),'Status: Planning only — no live campaign, publishing or spend.'].join('\\n');const output=document.querySelector('#planner-brief-output');output.value=brief;const download=document.querySelector('#planner-download');download.disabled=false;};
const plannerDownload=document.querySelector('#planner-download');
if(plannerDownload)plannerDownload.onclick=()=>{const value=document.querySelector('#planner-brief-output')?.value||'';if(!value)return;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([value],{type:'text/plain;charset=utf-8'}));a.download='bk-busicare-planning-brief.txt';a.click();URL.revokeObjectURL(a.href);};


const search=document.querySelector('#lead-search');if(search)search.oninput=()=>{leadQuery=search.value;document.querySelector('#leads-table').innerHTML=leadTable(filteredLeads(),true);bindLeadActions()};
const statusFilter=document.querySelector('#lead-status-filter');if(statusFilter)statusFilter.onchange=()=>{leadStatus=statusFilter.value;document.querySelector('#leads-table').innerHTML=leadTable(filteredLeads(),true);bindLeadActions()};
const add=document.querySelector('#add-lead');if(add)add.onclick=()=>{document.querySelector('#lead-form').innerHTML=`<form class="panel form" id="new-lead"><h3>New Lead</h3><div class="form-grid"><label>Name *<input name="name" maxlength="160" required></label><label>Company<input name="company" maxlength="160"></label><label>Service<select name="service"><option>Digital Marketing</option><option>Branding</option><option>Web Development</option><option>AI Automation</option><option>SEO</option></select></label><label>Phone<input name="phone" maxlength="40"></label><label>Potential Value (BDT)<input name="value" type="number" min="0" step="0.01" value="0"></label><label>Next Follow-up<input name="followUp" type="date"></label></div><div class="actions"><button class="primary">Save</button><button type="button" class="secondary" id="cancel-lead">Cancel</button></div></form>`;document.querySelector('#new-lead').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const name=String(f.get('name')||'').trim();const value=Number(f.get('value')||0);if(!name||name.length>160||!Number.isFinite(value)||value<0){alert('Enter a name and a valid value of zero or more.');return;}data.leads.push({id:Date.now(),name,company:String(f.get('company')||'').trim().slice(0,160),service:String(f.get('service')||'').trim().slice(0,120),phone:String(f.get('phone')||'').trim().slice(0,40),value,followUp:String(f.get('followUp')||''),status:'New',created:new Date().toISOString()});save();shell()};document.querySelector('#cancel-lead').onclick=()=>document.querySelector('#lead-form').innerHTML=''};
bindLeadActions();
document.querySelectorAll('[data-status]').forEach(s=>s.onchange=()=>{const l=data.leads.find(x=>x.id===Number(s.dataset.status));if(l){l.status=s.value;save();shell()}});
const buildPrompt=document.querySelector('#build-copilot-prompt');if(buildPrompt)buildPrompt.onclick=()=>{try{const prompt=buildContentPrompt({topic:document.querySelector('#copilot-topic').value,platform:document.querySelector('#copilot-platform').value,audience:document.querySelector('#copilot-audience').value,objective:document.querySelector('#copilot-objective').value,offer:document.querySelector('#copilot-offer').value});document.querySelector('#copilot-output').value=prompt;document.querySelector('#copy-copilot-prompt').disabled=false}catch(error){alert(error.message)}};const copyPrompt=document.querySelector('#copy-copilot-prompt');if(copyPrompt)copyPrompt.onclick=async()=>{const output=document.querySelector('#copilot-output');try{await navigator.clipboard.writeText(output.value);alert('Prompt copied.')}catch{output.focus();output.select();alert('Prompt selected. Choose Copy to copy it.')}};
const ac=document.querySelector('#add-content');if(ac)ac.onclick=()=>{document.querySelector('#content-form').innerHTML=`<form class="panel form" id="new-content"><h3>Content Plan</h3><div class="form-grid"><label>Content Title *<input name="title" maxlength="200" required></label><label>Platform<select name="platform"><option>Facebook</option><option>Instagram</option><option>TikTok</option><option>LinkedIn</option><option>YouTube</option></select></label><label>Date<input name="date" type="date"></label><label>Status<select name="status"><option>Idea</option><option>Draft</option><option>Ready for review</option></select></label></div><button class="primary">Save</button></form>`;document.querySelector('#new-content').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const item=Object.fromEntries(f);item.title=String(item.title||'').trim();if(!item.title||item.title.length>200){alert('Enter a content title of no more than 200 characters.');return;}data.content.push(item);save();shell()}};
document.querySelectorAll('[data-delete-content]').forEach(b=>b.onclick=()=>{data.content.splice(Number(b.dataset.deleteContent),1);save();shell()});
const ss=document.querySelector('#save-settings');if(ss)ss.onclick=()=>{data.workspace.name=document.querySelector('#workspace-name').value.trim()||'BK-BusiCare';save();shell()};
const be=document.querySelector('#backup-export');if(be)be.onclick=()=>{const blob=new Blob([JSON.stringify({format:'bkbusicare-backup',version:1,exportedAt:new Date().toISOString(),data},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bk-busicare-backup.json';a.click();URL.revokeObjectURL(a.href)};
const bi=document.querySelector('#backup-import');if(bi)bi.onchange=async()=>{const file=bi.files?.[0];if(!file)return;try{if(file.size>2*1024*1024)throw new Error('Backup file exceeds 2 MB limit');const parsed=JSON.parse(await file.text());const incoming=parsed?.data;const statuses=['New','Contacted','Proposal','Won','Lost'];const platforms=['Facebook','Instagram','TikTok','LinkedIn','YouTube'];const contentStatuses=['Idea','Draft','Ready for review'];const textOk=(v,max)=>typeof v==='string'&&v.length<=max;const ids=new Set();const leadsOk=Array.isArray(incoming?.leads)&&incoming.leads.every(l=>{if(!l||typeof l!=='object'||!Number.isSafeInteger(Number(l.id))||Number(l.id)<=0||ids.has(Number(l.id))||!textOk(l.name,160)||!l.name.trim()||!textOk(l.company??'',160)||!textOk(l.service??'',120)||!textOk(l.phone??'',40)||!Number.isFinite(Number(l.value??0))||Number(l.value??0)<0||!statuses.includes(l.status)||!textOk(l.followUp??'',20))return false;ids.add(Number(l.id));return true});const contentOk=Array.isArray(incoming?.content)&&incoming.content.every(c=>c&&typeof c==='object'&&textOk(c.title,200)&&c.title.trim()&&platforms.includes(c.platform)&&contentStatuses.includes(c.status)&&textOk(c.date??'',20));if(parsed?.format!=='bkbusicare-backup'||!incoming||!incoming.workspace||!textOk(incoming.workspace.name,120)||incoming.workspace.name.trim().length<2||!leadsOk||!contentOk)throw new Error('invalid');if(!confirm('Importing will replace the current workspace data. Have you created a backup? Continue?'))return;const previousData=data;data={workspace:{...defaultData.workspace,name:incoming.workspace.name.trim()},leads:incoming.leads.map(l=>({id:Number(l.id),name:l.name.trim(),company:l.company??'',service:l.service??'',phone:l.phone??'',value:Number(l.value??0),followUp:l.followUp??'',status:l.status,created:textOk(l.created??'',80)?(l.created??''):''})),content:incoming.content.map(c=>({title:c.title.trim(),platform:c.platform,date:c.date??'',status:c.status}))};if(!save()){data=previousData;return;}alert('Backup restored successfully.');shell()}catch{alert('The backup file is invalid or unreadable. No data was changed.')}finally{bi.value=''}};

const ex=document.querySelector('#export');if(ex)ex.onclick=()=>{const rows=[['Name','Company','Service','Status','Value BDT'],...data.leads.map(l=>[l.name,l.company,l.service,l.status,l.value])];const csv=rows.map(r=>r.map(csvCell).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download='bk-busicare-leads.csv';a.click();URL.revokeObjectURL(a.href)};
}
/* Delegate navigation clicks from the document so they survive complete page re-renders. */
document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const subnavButton = target.closest('[data-submenu]');
  if (subnavButton) {
    event.preventDefault();
    activateSubmenu(subnavButton.getAttribute('data-submenu'));
    return;
  }
  const pageButton = target.closest('[data-page]');
  if (pageButton) {
    event.preventDefault();
    const nextPage = pageButton.getAttribute('data-page');
    if (nextPage && nav.some(([name]) => name === nextPage)) {
      page = nextPage;
      render();
    }
    return;
  }
  const goButton = target.closest('[data-go]');
  if (goButton) {
    event.preventDefault();
    const nextPage = goButton.getAttribute('data-go');
    if (nextPage) { page = nextPage; render(); }
    return;
  }
  const moduleButton = target.closest('[data-planner-module]');
  if (moduleButton) {
    event.preventDefault();
    const nextModule = moduleButton.getAttribute('data-planner-module');
    if (nextModule) { selectedContentModule = nextModule; render(); }
  }
});

function render(){shell();bind()}
const hasSupabaseUrl=Boolean(import.meta.env.VITE_SUPABASE_URL?.trim());
const hasSupabaseKey=Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY?.trim());
if (!hasSupabaseUrl && !hasSupabaseKey) render();
