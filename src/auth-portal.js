import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const hasUrl = Boolean(url);
const hasKey = Boolean(key);

if (hasUrl !== hasKey) {
  const warning = document.createElement('section');
  warning.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#f4f7f5;display:grid;place-items:center;padding:24px;font-family:Arial,sans-serif;color:#18372b';
  warning.innerHTML = '<div style="max-width:520px;background:white;border:1px solid #dce8df;border-radius:16px;padding:26px"><b>BK-BusiCare · Configuration required</b><h2>Supabase setup is incomplete</h2><p>VITE_SUPABASE_URL এবং VITE_SUPABASE_ANON_KEY—দুটিই সেট করতে হবে। নিরাপত্তার জন্য Local Demo চালু করা হয়নি।</p></div>';
  document.body.appendChild(warning);
} else if (url && key) {
  const supabase = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  const root = document.createElement('section');
  root.id = 'bk-secure-gate';
  root.style.cssText = 'position:fixed;inset:0;z-index:99999;overflow:auto;background:#f4f7f5;padding:24px;font-family:Arial,sans-serif;color:#18372b';
  document.body.appendChild(root);

  let session = null;
  let workspaces = [];
  let activeId = '';
  let activeRole = '';
  let leads = [];
  let contentItems = [];
  let page = 'Dashboard';
  let busy = false;

  function safe(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function card(html) {
    root.innerHTML = '<div style="max-width:1100px;margin:0 auto;background:white;border:1px solid #dce8df;border-radius:16px;padding:24px;box-shadow:0 16px 48px #1232">' + html + '</div>';
  }
  function note(message, error) {
    const node = root.querySelector('[data-note]');
    if (node) { node.textContent = message; node.style.color = error ? '#a33' : '#176344'; }
  }
  function button(label, action, extra) {
    return '<button type="button" data-action="' + action + '" style="padding:9px 13px;margin:3px;border:1px solid #b8cfc0;border-radius:8px;background:white;color:#18372b;cursor:pointer"' + (extra || '') + '>' + label + '</button>';
  }
  function field(label, name, type, required, value) {
    return '<label style="display:block;margin:9px 0">' + label + '<input name="' + name + '" type="' + (type || 'text') + '"' + (required ? ' required' : '') + ' value="' + safe(value || '') + '" style="display:block;width:100%;box-sizing:border-box;padding:10px;margin-top:5px;border:1px solid #ccd9d0;border-radius:7px"></label>';
  }
  function authView(mode) {
    card('<b>BK-BusiCare · Secure Access</b><h2>' + (mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Reset password' : 'Sign in') + '</h2><p>আপনার workspace-এ নিরাপদে প্রবেশ করুন।</p><form id="auth-form">' + field('Email','email','email',true,'') + (mode === 'reset' ? '' : field('Password (minimum 12 characters)','password','password',true,'')) + '<button>Continue</button></form><p>' + button('Sign in','mode-login') + button('Create account','mode-signup') + button('Forgot password','mode-reset') + '</p><p data-note></p><small>Supabase Auth handles passwords. This app does not store them.</small>');
    root.querySelector('#auth-form').onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const email = String(f.get('email')).trim();
      const password = String(f.get('password') || '');
      try {
        if (mode === 'login') {
          const r = await supabase.auth.signInWithPassword({ email, password });
          if (r.error) throw r.error;
          session = r.data.session;
          await portal();
        } else if (mode === 'signup') {
          const r = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: location.origin } });
          if (r.error) throw r.error;
          if (r.data.session) { session = r.data.session; await portal(); }
          else note('Account created. Confirm your email, then sign in.');
        } else {
          const r = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
          if (r.error) throw r.error;
          note('If the account exists, a password reset link has been sent.');
        }
      } catch (err) { note(err.message || 'Authentication failed.', true); }
    };
    root.querySelectorAll('[data-action^="mode-"]').forEach(b => b.onclick = () => authView(b.dataset.action.replace('mode-','')));
  }
  async function loadWorkspaces() {
    const r = await supabase.from('workspace_members').select('workspace_id,role,workspaces!inner(id,name)').eq('user_id', session.user.id);
    if (r.error) throw r.error;
    workspaces = (r.data || []).map(x => ({ id: x.workspaces.id, name: x.workspaces.name, role: x.role }));
    if (!workspaces.some(x => x.id === activeId)) activeId = workspaces[0]?.id || '';
  }
  async function loadRecords() {
    const [l,c] = await Promise.all([
      supabase.from('leads').select('id,name,company,service,phone,email,status,value,follow_up,notes,created_at,updated_at').eq('workspace_id',activeId).order('created_at',{ascending:false}),
      supabase.from('content_items').select('id,title,platform,body,scheduled_at,status,created_at,updated_at').eq('workspace_id',activeId).order('created_at',{ascending:false})
    ]);
    if (l.error) throw l.error;
    if (c.error) throw c.error;
    leads = l.data || [];
    contentItems = c.data || [];
  }
  function leadRows() {
    return leads.map(l => '<tr><td><b>' + safe(l.name) + '</b><br><small>' + safe(l.company) + ' · ' + safe(l.phone) + ' · ' + safe(l.email) + '</small></td><td>' + safe(l.service) + '</td><td><select data-lead-status="' + safe(l.id) + '">' + ['New','Contacted','Proposal','Won','Lost'].map(s => '<option' + (l.status===s?' selected':'') + '>' + s + '</option>').join('') + '</select></td><td>৳' + Number(l.value || 0).toLocaleString('en-BD') + '</td><td>' + button('Edit','edit-lead',' data-id="' + safe(l.id) + '"') + ((activeRole==='owner'||activeRole==='admin')?button('Delete','delete-lead',' data-id="' + safe(l.id) + '"'):'') + '</td></tr>').join('') || '<tr><td colspan="5">এখনো কোনো Lead নেই।</td></tr>';
  }
  function contentRows() {
    return contentItems.map(c => '<tr><td><b>' + safe(c.title) + '</b><br><small>' + safe(c.body) + '</small></td><td>' + safe(c.platform) + '</td><td>' + safe(c.scheduled_at || 'Not scheduled') + '</td><td><select data-content-status="' + safe(c.id) + '">' + ['Draft','Needs approval','Approved','Scheduled','Published','Failed'].map(s => '<option' + (c.status===s?' selected':'') + '>' + s + '</option>').join('') + '</select></td><td>' + button('Edit','edit-content',' data-id="' + safe(c.id) + '"') + ((activeRole==='owner'||activeRole==='admin')?button('Delete','delete-content',' data-id="' + safe(c.id) + '"'):'') + '</td></tr>').join('') || '<tr><td colspan="5">এখনো কোনো Content item নেই।</td></tr>';
  }
  function portalView() {
    const w = workspaces.find(x => x.id === activeId);
    if (!w) return;
    activeRole = w.role;
    const nav = ['Dashboard','Leads','Content Planner','Team'];
    let body = '';
    if (page === 'Dashboard') {
      body = '<h2>Workspace Overview</h2><div style="display:flex;gap:14px;flex-wrap:wrap"><div style="padding:18px;background:#edf5f0;border-radius:10px">Total Leads<br><strong style="font-size:28px">' + leads.length + '</strong></div><div style="padding:18px;background:#edf5f0;border-radius:10px">Open Pipeline<br><strong style="font-size:28px">৳' + leads.filter(x=>!['Won','Lost'].includes(x.status)).reduce((a,x)=>a+Number(x.value||0),0).toLocaleString('en-BD') + '</strong></div><div style="padding:18px;background:#edf5f0;border-radius:10px">Content Items<br><strong style="font-size:28px">' + contentItems.length + '</strong></div></div><p>আপনার ডেটা Supabase Cloud-এ Workspace RLS দ্বারা সীমাবদ্ধ।</p>';
    } else if (page === 'Leads') {
      body = '<h2>Lead Management</h2><form id="lead-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">' + field('Name','name','text',true,'') + field('Company','company','text',false,'') + field('Service','service','text',false,'Digital Marketing') + field('Phone','phone','tel',false,'') + field('Email','email','email',false,'') + field('Value (BDT)','value','number',false,'0') + field('Follow-up date','follow_up','date',false,'') + '<label style="grid-column:1/-1">Notes<textarea name="notes" maxlength="4000" style="display:block;width:100%;padding:10px"></textarea></label><button style="grid-column:1/-1">Add Lead</button></form><div style="overflow:auto;margin-top:16px"><table style="width:100%;border-collapse:collapse"><thead><tr><th>Name</th><th>Service</th><th>Status</th><th>Value</th><th>Actions</th></tr></thead><tbody>' + leadRows() + '</tbody></table></div>';
    } else if (page === 'Content Planner') {
      body = '<h2>Content Planner</h2><form id="content-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">' + field('Title','title','text',true,'') + field('Platform','platform','text',true,'Facebook') + field('Schedule (ISO date/time)','scheduled_at','datetime-local',false,'') + '<label style="grid-column:1/-1">Content<textarea name="body" maxlength="10000" style="display:block;width:100%;padding:10px"></textarea></label><button style="grid-column:1/-1">Add Content</button></form><div style="overflow:auto;margin-top:16px"><table style="width:100%;border-collapse:collapse"><thead><tr><th>Title</th><th>Platform</th><th>Schedule</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + contentRows() + '</tbody></table></div><p>এখানে Content পরিকল্পনা সংরক্ষিত হয়; স্বয়ংক্রিয়ভাবে সামাজিক মাধ্যমে প্রকাশ হয় না।</p>';
    } else {
      body = '<h2>Team</h2><p>Role: ' + safe(activeRole) + '</p>' + ((activeRole==='owner'||activeRole==='admin')?'<form id="invite-form" style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0"><input name="email" type="email" required placeholder="Member email" style="flex:1;min-width:200px;padding:10px"><select name="role" style="padding:10px"><option value="member">Member</option><option value="viewer">Viewer</option>' + (activeRole==='owner'?'<option value="admin">Admin</option>':'') + '</select><button>Send invitation</button></form>':'') + '<div id="members">Loading members…</div>';
    }
    card('<header style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><b>BK-BusiCare · Secure Workspace</b><p style="margin:5px 0">' + safe(session.user.email) + '</p></div><button type="button" id="logout">Sign out</button></header><hr><label>Workspace<select id="workspace-select" style="padding:10px;margin:8px">' + workspaces.map(x => '<option value="' + safe(x.id) + '"' + (x.id===activeId?' selected':'') + '>' + safe(x.name) + ' · ' + safe(x.role) + '</option>').join('') + '</select></label><nav style="display:flex;gap:6px;flex-wrap:wrap;margin:12px 0">' + nav.map(n => button(n,'page',' data-page="' + n + '"' + (n===page?' style="background:#dcefe4;padding:10px;border-radius:8px"':''))).join('') + '</nav>' + body + '<p data-note></p>');
    root.querySelector('#logout').onclick = logout;
    root.querySelector('#workspace-select').onchange = async e => { activeId=e.target.value; await refresh(); };
    root.querySelectorAll('[data-page]').forEach(b => b.onclick = () => { page=b.dataset.page; portalView(); bindDataActions(); });
    if (page === 'Team') loadMembers();
    bindDataActions();
  }
  async function loadMembers() {
    const r = await supabase.from('workspace_members').select('user_id,role,created_at').eq('workspace_id',activeId).order('created_at');
    const host = root.querySelector('#members');
    if (!host) return;
    if (r.error) { host.textContent = r.error.message; return; }
    host.innerHTML = (r.data || []).map(m => '<p style="border-bottom:1px solid #eee;padding:8px 0;overflow-wrap:anywhere">' + safe(m.user_id) + ' — <b>' + safe(m.role) + '</b></p>').join('') || 'No members found.';
  }
  async function refresh() {
    if (busy) return;
    busy = true;
    try { await loadRecords(); portalView(); }
    catch (err) { card('<b>Workspace data error</b><p>' + safe(err.message || 'Unable to load workspace data.') + '</p><p data-note></p>'); }
    finally { busy = false; }
  }
  function bindDataActions() {
    const lf = root.querySelector('#lead-form');
    if (lf) lf.onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(lf);
      const payload = {workspace_id:activeId,name:String(f.get('name')).trim(),company:String(f.get('company')||'').trim(),service:String(f.get('service')||'').trim(),phone:String(f.get('phone')||'').trim(),email:String(f.get('email')||'').trim(),value:Math.max(0,Number(f.get('value')||0)),follow_up:f.get('follow_up')||null,notes:String(f.get('notes')||'').trim(),created_by:session.user.id};
      if (!payload.name || !Number.isFinite(payload.value)) return note('Name এবং সঠিক Value দিন।',true);
      const r = await supabase.from('leads').insert(payload);
      if (r.error) return note(r.error.message,true);
      await refresh();
    };
    const cf = root.querySelector('#content-form');
    if (cf) cf.onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(cf);
      const payload = {workspace_id:activeId,title:String(f.get('title')).trim(),platform:String(f.get('platform')).trim(),body:String(f.get('body')||'').trim(),scheduled_at:f.get('scheduled_at')?new Date(f.get('scheduled_at')).toISOString():null,created_by:session.user.id,status:'Draft'};
      if (!payload.title || !payload.platform) return note('Title ও Platform দিন।',true);
      const r = await supabase.from('content_items').insert(payload);
      if (r.error) return note(r.error.message,true);
      await refresh();
    };
    root.querySelectorAll('[data-lead-status]').forEach(s => s.onchange = async () => {
      const r = await supabase.from('leads').update({status:s.value}).eq('id',s.dataset.leadStatus).eq('workspace_id',activeId);
      if (r.error) note(r.error.message,true); else await refresh();
    });
    root.querySelectorAll('[data-content-status]').forEach(s => s.onchange = async () => {
      const r = await supabase.from('content_items').update({status:s.value}).eq('id',s.dataset.contentStatus).eq('workspace_id',activeId);
      if (r.error) note(r.error.message,true); else await refresh();
    });
    root.querySelectorAll('[data-action="delete-lead"],[data-action="delete-content"]').forEach(b => b.onclick = async () => {
      if (!confirm('এই record স্থায়ীভাবে মুছবেন?')) return;
      const table = b.dataset.action === 'delete-lead' ? 'leads' : 'content_items';
      const r = await supabase.from(table).delete().eq('id',b.dataset.id).eq('workspace_id',activeId);
      if (r.error) note(r.error.message,true); else await refresh();
    });
    root.querySelectorAll('[data-action="edit-lead"]').forEach(b => b.onclick = async () => {
      const item = leads.find(x=>x.id===b.dataset.id);
      if (!item) return;
      const name = prompt('Lead name',item.name);
      if (name===null) return;
      const r = await supabase.from('leads').update({name:name.trim(),company:prompt('Company',item.company)||'',service:prompt('Service',item.service)||'',phone:prompt('Phone',item.phone)||'',email:prompt('Email',item.email)||'',notes:prompt('Notes',item.notes)||''}).eq('id',item.id).eq('workspace_id',activeId);
      if (r.error) note(r.error.message,true); else await refresh();
    });
    root.querySelectorAll('[data-action="edit-content"]').forEach(b => b.onclick = async () => {
      const item = contentItems.find(x=>x.id===b.dataset.id);
      if (!item) return;
      const title = prompt('Content title',item.title);
      if (title===null) return;
      const r = await supabase.from('content_items').update({title:title.trim(),platform:prompt('Platform',item.platform)||item.platform,body:prompt('Content',item.body)||''}).eq('id',item.id).eq('workspace_id',activeId);
      if (r.error) note(r.error.message,true); else await refresh();
    });
  }
  async function portal() {
    if (!session) return authView('login');
    try {
      await loadWorkspaces();
      if (!workspaces.length) {
        card('<b>BK-BusiCare · Workspace Setup</b><h2>Create your workspace</h2><p>আপনাকে Owner হিসেবে যুক্ত করা হবে।</p><form id="workspace-form">' + field('Workspace name','name','text',true,'') + '<button>Create workspace</button></form><p data-note></p><button id="logout">Sign out</button>');
        root.querySelector('#workspace-form').onsubmit = async e => {
          e.preventDefault();
          const name = String(new FormData(e.currentTarget).get('name')).trim();
          const r = await supabase.rpc('create_workspace', { workspace_name: name });
          if (r.error) { note(r.error.message,true); return; }
          activeId = r.data;
          await portal();
        };
        root.querySelector('#logout').onclick = logout;
        return;
      }
      await refresh();
    } catch (err) {
      card('<b>BK-BusiCare · Workspace error</b><p>' + safe(err.message || 'Workspace loading failed.') + '</p><button id="retry">Retry</button><button id="logout">Sign out</button>');
      root.querySelector('#retry').onclick = portal;
      root.querySelector('#logout').onclick = logout;
    }
  }
  function passwordUpdateView() {
    card('<b>BK-BusiCare · Password recovery</b><h2>Set a new password</h2><form id="new-password">' + field('New password','password','password',true,'') + '<button>Update password</button></form><p data-note></p>');
    root.querySelector('#new-password').onsubmit = async e => {
      e.preventDefault();
      const password = String(new FormData(e.currentTarget).get('password') || '');
      const result = await supabase.auth.updateUser({ password });
      if (result.error) { note(result.error.message,true); return; }
      note('Password updated successfully.');
    };
  }
  async function logout() {
    const r = await supabase.auth.signOut();
    if (r.error) { note(r.error.message,true); return; }
    session = null; workspaces = []; activeId = ''; leads = []; contentItems = []; authView('login');
  }
  let passwordRecoveryPending = false;
  supabase.auth.onAuthStateChange((event,next) => {
    session = next;
    if (event === 'PASSWORD_RECOVERY') {
      passwordRecoveryPending = true;
      passwordUpdateView();
      return;
    }
    if (event === 'SIGNED_OUT') {
      session = null; workspaces=[]; activeId=''; leads=[]; contentItems=[]; authView('login');
      return;
    }
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      queueMicrotask(() => { if (session) portal().catch(err => { card('<p>' + safe(err.message) + '</p>'); }); });
    }
  });
  supabase.auth.getSession().then(async r => {
    if (r.error) throw r.error;
    session = r.data.session;
    if (passwordRecoveryPending) passwordUpdateView();
    else if (session) await portal();
    else authView('login');
  }).catch(err => { authView('login'); note(err.message || 'Unable to initialize secure session.',true); });
}
