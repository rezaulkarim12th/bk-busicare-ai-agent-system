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
  root.style.cssText = 'position:fixed;inset:0;z-index:99999;overflow:auto;background:#f4f7f5;padding:24px;display:grid;place-items:center;font-family:Arial,sans-serif;color:#18372b';
  document.body.appendChild(root);
  let session = null;
  let workspaces = [];
  let activeId = '';

  function safe(value) {
    return String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function card(html) {
    root.innerHTML = '<div style="width:min(100%,520px);background:white;border:1px solid #dce8df;border-radius:16px;padding:26px;box-shadow:0 16px 48px #1233">' + html + '</div>';
  }
  function note(text, error) {
    const node = root.querySelector('[data-note]');
    if (node) { node.textContent = text; node.style.color = error ? '#a33' : '#176344'; }
  }
  function authView(mode) {
    card('<b>BK-BusiCare · Secure Access</b><h2>' + (mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Reset password' : 'Sign in') + '</h2><p>আপনার workspace-এ নিরাপদে প্রবেশ করুন।</p><form id="auth-form"><label>Email<input name="email" type="email" required maxlength="254" style="display:block;width:100%;padding:12px;margin:7px 0 14px"></label>' + (mode === 'reset' ? '' : '<label>Password<input name="password" type="password" required minlength="12" style="display:block;width:100%;padding:12px;margin:7px 0 14px"></label>') + '<button>Continue</button></form><p><button data-mode="login">Sign in</button> <button data-mode="signup">Create account</button> <button data-mode="reset">Forgot password</button></p><p data-note></p><small>Supabase Auth handles passwords. This app does not store them.</small>');
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
        } else if (mode === 'signup') {
          const r = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: location.origin } });
          if (r.error) throw r.error;
          if (r.data.session) { session = r.data.session; }
          else note('Account created. Confirm your email, then sign in.');
        } else {
          const r = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
          if (r.error) throw r.error;
          note('If the account exists, a password reset link has been sent.');
        }
      } catch (err) { note(err.message, true); }
    };
    root.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => authView(b.dataset.mode));
  }
  async function loadWorkspaces() {
    const r = await supabase.from('workspace_members').select('workspace_id,role,workspaces!inner(id,name)').eq('user_id', session.user.id);
    if (r.error) throw r.error;
    workspaces = (r.data || []).map(x => ({ id: x.workspaces.id, name: x.workspaces.name, role: x.role }));
    if (!workspaces.some(x => x.id === activeId)) activeId = workspaces[0]?.id || '';
  }
  async function portal() {
    if (!session) return authView('login');
    try { await loadWorkspaces(); } catch (err) { authView('login'); note(err.message, true); return; }
    if (!workspaces.length) {
      card('<b>BK-BusiCare · Workspace Setup</b><h2>Create your workspace</h2><p>আপনাকে Owner হিসেবে যুক্ত করা হবে।</p><form id="workspace-form"><input name="name" required minlength="2" maxlength="120" placeholder="Workspace name" style="width:100%;padding:12px;margin:10px 0"><button>Create workspace</button></form><p data-note></p><button id="logout">Sign out</button>');
      root.querySelector('#workspace-form').onsubmit = async e => {
        e.preventDefault();
        const name = String(new FormData(e.currentTarget).get('name')).trim();
        const r = await supabase.rpc('create_workspace', { workspace_name: name });
        if (r.error) { note(r.error.message, true); return; }
        activeId = r.data;
        await portal();
      };
      root.querySelector('#logout').onclick = logout;
      return;
    }
    const w = workspaces.find(x => x.id === activeId) || workspaces[0];
    activeId = w.id;
    card('<b>BK-BusiCare · Authenticated</b><h2>Workspace access verified</h2><p>Signed in as ' + safe(session.user.email) + '</p><label>Workspace<select id="workspace-select" style="display:block;width:100%;padding:12px;margin:8px 0">' + workspaces.map(x => '<option value="' + safe(x.id) + '"' + (x.id === w.id ? ' selected' : '') + '>' + safe(x.name) + ' · ' + safe(x.role) + '</option>').join('') + '</select></label><h3>Workspace members</h3><div id="members">Loading…</div><p style="background:#edf5f0;padding:12px;border-radius:8px">Lead/content cloud sync is not ready. The local demo is blocked in authenticated mode to prevent browser-local data exposure. Team invitations and role changes are disabled until a trusted server function is deployed.</p><button id="logout">Sign out</button><p data-note></p>');
    root.querySelector('#workspace-select').onchange = async e => { activeId = e.target.value; await portal(); };
    root.querySelector('#logout').onclick = logout;
    const members = await supabase.from('workspace_members').select('user_id,role,created_at').eq('workspace_id', w.id).order('created_at');
    const host = root.querySelector('#members');
    if (members.error) host.textContent = members.error.message;
    else host.innerHTML = members.data.map(m => '<p style="border-bottom:1px solid #eee;padding:8px 0;overflow-wrap:anywhere">' + safe(m.user_id) + ' — <b>' + safe(m.role) + '</b></p>').join('') || 'No members found.';
  }
  function passwordUpdateView() {
    card('<b>BK-BusiCare · Password recovery</b><h2>Set a new password</h2><form id="new-password"><label>New password<input name="password" type="password" minlength="12" required style="display:block;width:100%;padding:12px;margin:8px 0"></label><button>Update password</button></form><p data-note></p>');
    root.querySelector('#new-password').onsubmit = async e => {
      e.preventDefault();
      const password = String(new FormData(e.currentTarget).get('password') || '');
      const result = await supabase.auth.updateUser({ password });
      if (result.error) { note(result.error.message, true); return; }
      note('Password updated successfully.');
    };
  }
  async function logout() {
    const r = await supabase.auth.signOut();
    if (r.error) { note(r.error.message, true); return; }
    session = null; workspaces = []; activeId = ''; authView('login');
  }
  let passwordRecoveryPending = false;
  supabase.auth.onAuthStateChange((event, next) => {
    session = next;
    if (event === 'PASSWORD_RECOVERY') {
      passwordRecoveryPending = true;
      passwordUpdateView();
      return;
    }
    if (event === 'SIGNED_OUT') {
      workspaces = [];
      activeId = '';
      authView('login');
      return;
    }
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      queueMicrotask(() => {
        if (session) portal().catch(err => {
          authView('login');
          note(err.message || 'Workspace loading failed.', true);
        });
      });
    }
  });
  supabase.auth.getSession().then(async r => {
    if (r.error) throw r.error;
    session = r.data.session;
    if (passwordRecoveryPending) passwordUpdateView();
    else if (session) await portal(); else authView('login');
  }).catch(err => {
    authView('login');
    note(err.message || 'Unable to initialize secure session.', true);
  });
}
