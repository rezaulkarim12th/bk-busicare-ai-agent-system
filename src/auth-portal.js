import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const hasUrl = Boolean(url);
const hasKey = Boolean(key);

if (hasUrl !== hasKey) {
  const warning = document.createElement('section');
  warning.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#f4f7f5;display:grid;place-items:center;padding:24px;font-family:Arial,sans-serif;color:#18372b';
  warning.innerHTML = '<div style="max-width:520px;background:white;border:1px solid #dce8df;border-radius:16px;padding:26px"><b>BK-BusiCare · Configuration required</b><h2>Supabase setup is incomplete</h2><p>Both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be configured. Local Demo has been disabled for security.</p></div>';
  document.body.appendChild(warning);
} else if (url && key) {
  const supabase = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  const root = document.createElement('section');
  root.id = 'bk-secure-gate';
  root.style.cssText = 'position:fixed;inset:0;z-index:99999;overflow:auto;background:#f4f7f5;padding:24px;font-family:Arial,sans-serif;color:#18372b';
  document.body.appendChild(root);
  const responsiveStyle = document.createElement('style');
  responsiveStyle.textContent = `
    .busicare-auth-brand{display:flex;align-items:center;gap:12px;margin:0 0 24px;color:#102542;font-weight:800;font-size:clamp(17px,4vw,22px)}
    .busicare-auth-brand img{width:52px;height:52px;object-fit:contain;border-radius:14px;border:1px solid #d3ad5b;background:#081a33;padding:4px;box-shadow:0 4px 14px #10254218}
    #bk-secure-gate table { width:100%; border-collapse:collapse; }
    #bk-secure-gate th, #bk-secure-gate td { padding:10px 8px; text-align:left; vertical-align:top; border-bottom:1px solid #e6eee8; }
    #bk-secure-gate input, #bk-secure-gate select, #bk-secure-gate textarea, #bk-secure-gate button { max-width:100%; box-sizing:border-box; }
    #bk-secure-gate button { min-height:40px; }
    @media (max-width:640px) {
      #bk-secure-gate { padding:12px !important; }
      #bk-secure-gate > div { padding:16px !important; }
      #bk-secure-gate table { display:block; overflow-x:auto; }
      #bk-secure-gate table thead { display:none; }
      #bk-secure-gate table tbody { display:block; }
      #bk-secure-gate table tr { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; padding:10px 0; border-bottom:1px solid #dce8df; }
      #bk-secure-gate table td { display:block; min-width:0; overflow-wrap:anywhere; border:0; padding:5px; }
      #bk-secure-gate table td[data-label]::before { content:attr(data-label); display:block; margin-bottom:4px; color:#687a70; font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
      #bk-secure-gate form { min-width:0; }
    }
  `;
  responsiveStyle.textContent += `
    /* Premium reference-inspired styling for the authenticated workspace portal. */
    #bk-secure-gate { background:#f3f5f8 !important; color:#14243b !important; }
    #bk-secure-gate > div {
      max-width:1100px !important; padding:22px !important;
      border:1px solid #e4e8ef !important; border-radius:24px !important;
      box-shadow:0 16px 44px #10254216 !important;
    }
    #bk-secure-gate header {
      background:linear-gradient(120deg,#081a33,#17395f) !important;
      border:1px solid #c9a24f !important; border-radius:20px !important;
      padding:22px !important; color:#fff !important;
    }
    #bk-secure-gate header b { color:#fff !important; font-size:20px; letter-spacing:-.2px; }
    #bk-secure-gate header p { color:#d7e1ee !important; }
    #bk-secure-gate hr { border:0; border-top:1px solid #e4e8ef; margin:20px 0; }
    #bk-secure-gate nav[style] {
      display:grid !important; grid-template-columns:repeat(2,minmax(0,1fr)) !important;
      gap:10px !important; margin:18px 0 22px !important;
      padding:12px !important; border:1px solid #e5e8ef !important;
      border-radius:20px !important; background:#fafbfd !important;
    }
    #bk-secure-gate nav[style] button {
      min-height:66px !important; margin:0 !important; padding:12px 10px !important;
      border:1px solid #c49a43 !important; border-radius:15px !important;
      background:linear-gradient(145deg,#ffffff,#f3f6fb) !important;
      border-color:#dfe5ee !important; color:#102542 !important; font-weight:750 !important; font-size:14px !important;
      box-shadow:0 5px 14px #10254212 !important;
    }
    #bk-secure-gate nav[style] button[style*="background"] {
      background:linear-gradient(135deg,#f4e2b1,#d0a650) !important;
      border-color:#c9a24f !important; color:#102542 !important;
      box-shadow:inset 0 0 0 1px #c9a24f33,0 6px 16px #10254212 !important;
    }
    #bk-secure-gate button {
      border-radius:13px !important; font-weight:700 !important;
      border-color:#c49a43 !important;
    }
    #bk-secure-gate input,#bk-secure-gate select,#bk-secure-gate textarea {
      border:1px solid #d9e0e9 !important; border-radius:12px !important;
      background:#fff !important; color:#182b45 !important; padding:12px !important;
    }
    #bk-secure-gate h2 { color:#102542 !important; font-weight:800 !important; }
    #bk-secure-gate table th { background:#f3f6fa; color:#52657d; }
    #bk-secure-gate table td { border-bottom-color:#e6ebf1; }
    @media(max-width:640px) {
      #bk-secure-gate { padding:10px !important; }
      #bk-secure-gate > div { padding:14px !important; border-radius:19px !important; }
      #bk-secure-gate nav[style] { gap:8px !important; padding:9px !important; }
      #bk-secure-gate nav[style] button { min-height:62px !important; font-size:12px !important; }
      #bk-secure-gate header { padding:18px !important; }
      #bk-secure-gate header b { font-size:18px !important; }
    }
    @media(max-width:360px) {
      #bk-secure-gate nav[style] { grid-template-columns:1fr !important; }
    }
  `;

  responsiveStyle.textContent += `
    /* Authenticated BusiCare portal: match the approved navy/gold mobile app direction. */
    #bk-secure-gate{background:#f3f5f8!important;color:#14243b!important;padding:clamp(10px,3vw,24px)!important}
    #bk-secure-gate>div{max-width:1120px!important;padding:clamp(14px,3vw,26px)!important;border-radius:22px!important}
    #bk-secure-gate .busicare-secure-header{
      display:flex!important;align-items:center!important;justify-content:space-between!important;
      gap:12px!important;padding:18px!important;border:1px solid #c9a24f!important;
      border-radius:20px!important;background:linear-gradient(120deg,#081a33,#17395f)!important;color:#fff!important
    }
    #bk-secure-gate .busicare-secure-brand{display:flex;align-items:center;gap:12px;min-width:0}
    #bk-secure-gate .busicare-secure-brand img{width:48px;height:48px;flex:0 0 48px;object-fit:cover;border-radius:13px;border:2px solid #e0bf70;background:#fff}
    #bk-secure-gate .busicare-secure-brand b{display:block;color:#fff!important;font-size:clamp(15px,2vw,20px)!important;line-height:1.2}
    #bk-secure-gate .busicare-secure-brand b span{color:#75d27e}
    #bk-secure-gate .busicare-secure-brand p{color:#d7e1ee!important;font-size:13px;overflow-wrap:anywhere}
    #bk-secure-gate #logout{flex:0 0 auto}
    #bk-secure-gate>div>label{display:block;margin:18px 0 12px!important;color:#59677a!important;font-weight:750}
    #bk-secure-gate #workspace-select{display:block;width:100%;margin:8px 0!important;min-height:48px}
    #bk-secure-gate nav[style]{
      display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
      gap:10px!important;margin:18px 0 22px!important;padding:12px!important;
      border:1px solid #e5e8ef!important;border-radius:20px!important;background:#fafbfd!important
    }
    #bk-secure-gate nav[style] button{
      display:flex!important;align-items:center!important;justify-content:center!important;
      min-width:0!important;min-height:64px!important;margin:0!important;padding:12px 8px!important;
      border:1px solid #dfe5ee!important;border-radius:15px!important;
      background:linear-gradient(145deg,#102c4c,#0b1e37)!important;
      color:#eef3f8!important;font-weight:750!important;font-size:14px!important;
      box-shadow:0 5px 14px #10254220!important;white-space:normal!important
    }
    #bk-secure-gate nav[style] button[style*="background:#dcefe4"]{
      background:linear-gradient(135deg,#f4e2b1,#d0a650)!important;
      border-color:#c9a24f!important;color:#102542!important
    }
    #bk-secure-gate h2{font-size:clamp(21px,3vw,28px)!important;margin:22px 0 14px!important}
    #bk-secure-gate [style*="background:#edf5f0"]{
      flex:1 1 145px!important;min-width:0!important;padding:17px!important;
      border:1px solid #e7ddc9!important;border-radius:15px!important;
      background:linear-gradient(145deg,#fffdf8,#f8f2e5)!important;color:#536174!important
    }
    #bk-secure-gate [style*="background:#edf5f0"] strong{display:block;color:#102542;font-size:28px;line-height:1.3}
    #bk-secure-gate hr{margin:18px 0!important;border-top-color:#e5e8ef!important}
    @media(max-width:640px){
      #bk-secure-gate{padding:8px!important}
      #bk-secure-gate>div{padding:12px!important;border-radius:19px!important}
      #bk-secure-gate .busicare-secure-header{padding:14px!important;gap:8px!important}
      #bk-secure-gate .busicare-secure-brand{gap:9px}
      #bk-secure-gate .busicare-secure-brand img{width:42px;height:42px;flex-basis:42px}
      #bk-secure-gate .busicare-secure-brand b{font-size:15px!important}
      #bk-secure-gate .busicare-secure-brand p{font-size:11px}
      #bk-secure-gate #logout{min-height:40px!important;padding:8px 10px!important;font-size:12px!important}
      #bk-secure-gate nav[style]{gap:8px!important;padding:9px!important;margin:14px 0 18px!important}
      #bk-secure-gate nav[style] button{min-height:58px!important;font-size:12px!important}
      #bk-secure-gate h2{margin:18px 0 12px!important}
    }
    @media(max-width:360px){
      #bk-secure-gate nav[style]{grid-template-columns:1fr!important}
      #bk-secure-gate .busicare-secure-brand img{width:36px;height:36px;flex-basis:36px}
      #bk-secure-gate .busicare-secure-brand b{font-size:13px!important}
    }
  `;

  responsiveStyle.textContent += `
    /* Full reference-inspired BusiCare app home layout for secure workspace. */
    #bk-secure-gate{background:#f4f6fa!important;color:#132844!important}
    #bk-secure-gate>div{max-width:1180px!important;border-radius:26px!important}
    #bk-secure-gate .busicare-secure-header{
      display:flex!important;align-items:center!important;justify-content:space-between!important;
      gap:12px!important;padding:17px!important;border:1px solid #d0aa58!important;
      border-radius:20px!important;background:linear-gradient(120deg,#071a32,#153b63)!important;color:#fff!important
    }
    #bk-secure-gate .busicare-secure-brand{display:flex;align-items:center;gap:12px;min-width:0}
    #bk-secure-gate .busicare-secure-brand img{width:48px;height:48px;flex:0 0 48px;object-fit:cover;border-radius:13px;border:2px solid #e0bf70;background:#fff}
    #bk-secure-gate .busicare-secure-brand b{display:block;color:#fff!important;font-size:19px!important;line-height:1.2}
    #bk-secure-gate .busicare-secure-brand b span{color:#75d27e}
    #bk-secure-gate .busicare-secure-brand p{color:#d7e1ee!important;font-size:12px;overflow-wrap:anywhere}
    #bk-secure-gate #logout{flex:0 0 auto}
    #bk-secure-gate .busicare-profile-hero{
      display:flex;align-items:center;gap:16px;margin:18px 0;padding:18px 20px;
      border:1px solid #d2ad5d;border-radius:19px;
      background:linear-gradient(110deg,#0a203b,#173d65);color:#fff
    }
    #bk-secure-gate .busicare-profile-hero img{
      width:78px;height:78px;flex:0 0 78px;object-fit:cover;
      border:3px solid #e4c36f;border-radius:50%;background:#fff
    }
    #bk-secure-gate .busicare-profile-hero small{font-size:10px;letter-spacing:1.5px;color:#f1d58f;font-weight:800}
    #bk-secure-gate .busicare-profile-hero h2{margin:4px 0!important;color:#fff!important;font-size:23px!important}
    #bk-secure-gate .busicare-profile-hero p{margin:0;color:#d8e3ef!important;font-size:12px}
    #bk-secure-gate>div>label{display:block;margin:16px 0 12px!important;color:#59677a!important;font-weight:750}
    #bk-secure-gate #workspace-select{display:block;width:100%;margin:8px 0!important;min-height:48px}
    #bk-secure-gate nav[style]{
      display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
      gap:10px!important;margin:16px 0 18px!important;padding:12px!important;
      border:1px solid #e5e8ef!important;border-radius:20px!important;background:#fafbfd!important
    }
    #bk-secure-gate nav[style] button{
      display:flex!important;align-items:center!important;justify-content:center!important;
      min-width:0!important;min-height:66px!important;margin:0!important;padding:12px 8px!important;
      border:1px solid #dfe5ee!important;border-radius:15px!important;
      background:linear-gradient(145deg,#0e2c4d,#091e38)!important;
      color:#eef3f8!important;font-weight:750!important;font-size:14px!important;
      box-shadow:0 5px 14px #10254220!important;white-space:normal!important
    }
    #bk-secure-gate nav[style] button[style*="background:#dcefe4"]{
      background:linear-gradient(135deg,#f4e2b1,#d0a650)!important;
      border-color:#c9a24f!important;color:#102542!important
    }
    #bk-secure-gate .busicare-course-promo{
      display:flex;justify-content:space-between;align-items:center;gap:12px;
      margin:16px 0 22px;padding:17px 19px;border:1px solid #d4ae5d;border-radius:17px;
      background:linear-gradient(110deg,#0a203b,#174a7b);color:#fff
    }
    #bk-secure-gate .busicare-course-promo small{display:block;color:#f0d48d;font-size:9px;font-weight:800;letter-spacing:1.4px;margin-bottom:5px}
    #bk-secure-gate .busicare-course-promo b{display:block;color:#fff;font-size:17px;line-height:1.25}
    #bk-secure-gate .busicare-course-promo span{display:block;color:#f3d991;font-size:11px;margin-top:7px}
    #bk-secure-gate .course-mark{font-size:38px;color:#f1d58f}
    #bk-secure-gate h2{font-size:clamp(21px,3vw,28px)!important;margin:22px 0 14px!important}
    #bk-secure-gate [style*="background:#edf5f0"]{
      flex:1 1 145px!important;min-width:0!important;padding:17px!important;
      border:1px solid #e7ddc9!important;border-radius:15px!important;
      background:linear-gradient(145deg,#fffdf8,#f8f2e5)!important;color:#536174!important
    }
    #bk-secure-gate [style*="background:#edf5f0"] strong{display:block;color:#102542;font-size:28px;line-height:1.3}
    @media(max-width:640px){
      #bk-secure-gate{padding:8px!important}
      #bk-secure-gate>div{padding:12px!important;border-radius:19px!important}
      #bk-secure-gate .busicare-secure-header{padding:13px!important;gap:8px!important}
      #bk-secure-gate .busicare-secure-brand{gap:9px}
      #bk-secure-gate .busicare-secure-brand img{width:42px;height:42px;flex-basis:42px}
      #bk-secure-gate .busicare-secure-brand b{font-size:15px!important}
      #bk-secure-gate .busicare-secure-brand p{font-size:11px}
      #bk-secure-gate #logout{min-height:40px!important;padding:8px 10px!important;font-size:12px!important}
      #bk-secure-gate .busicare-profile-hero{padding:14px!important;gap:11px!important}
      #bk-secure-gate .busicare-profile-hero img{width:62px;height:62px;flex-basis:62px}
      #bk-secure-gate .busicare-profile-hero h2{font-size:18px!important}
      #bk-secure-gate .busicare-profile-hero p{font-size:10px}
      #bk-secure-gate nav[style]{gap:8px!important;padding:9px!important;margin:13px 0 15px!important}
      #bk-secure-gate nav[style] button{min-height:58px!important;font-size:12px!important}
      #bk-secure-gate .busicare-course-promo{padding:14px!important}
      #bk-secure-gate .busicare-course-promo b{font-size:14px}
      #bk-secure-gate h2{margin:18px 0 12px!important}
    }
    @media(max-width:360px){
      #bk-secure-gate nav[style]{grid-template-columns:1fr!important}
      #bk-secure-gate .busicare-profile-hero img{width:54px;height:54px;flex-basis:54px}
    }
  `;

  responsiveStyle.textContent += `
    #bk-secure-gate .busicare-bottom-nav{display:none}
    @media(max-width:640px){
      #bk-secure-gate{padding-bottom:76px!important}
      #bk-secure-gate .busicare-bottom-nav{
        position:fixed;z-index:100001;left:8px;right:8px;bottom:8px;
        display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;
        padding:8px 5px calc(8px + env(safe-area-inset-bottom));
        border:1px solid #caa452;border-radius:18px;
        background:linear-gradient(110deg,#071a32f5,#14375cf5);
        box-shadow:0 8px 28px #07172a40;backdrop-filter:blur(12px)
      }
      #bk-secure-gate .busicare-bottom-nav button{
        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
        min-width:0;min-height:48px;padding:5px 2px!important;margin:0!important;
        border:1px solid transparent!important;border-radius:12px!important;
        background:transparent!important;color:#e8edf5!important;box-shadow:none!important
      }
      #bk-secure-gate .busicare-bottom-nav button span{font-size:20px;line-height:1}
      #bk-secure-gate .busicare-bottom-nav button small{font-size:9px;line-height:1.15;white-space:nowrap}
      #bk-secure-gate .busicare-bottom-nav button.active{
        background:linear-gradient(135deg,#f4e2b1,#d0a650)!important;
        border-color:#e7c979!important;color:#102542!important
      }
    }
  `;

  responsiveStyle.textContent += `
  /* Approved 10-folder home dashboard — mobile-first, navy and gold. */
  #bk-secure-gate .busicare-secure-header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:16px 18px!important;background:linear-gradient(115deg,#081a32,#173b61)!important;border:1px solid #d2ad5d!important;border-radius:18px!important;color:#fff!important}
  #bk-secure-gate .busicare-secure-brand{display:flex;align-items:center;gap:11px;min-width:0}
  #bk-secure-gate .busicare-secure-brand img{width:46px;height:46px;flex:0 0 46px;object-fit:contain;border:2px solid #e3c16d;border-radius:12px;background:#fff}
  #bk-secure-gate .busicare-secure-brand b{font-size:clamp(15px,2vw,20px)!important;color:#fff!important}
  #bk-secure-gate .busicare-secure-brand p{margin:4px 0 0;color:#d8e3ef!important;font-size:12px}
  #bk-secure-gate .busicare-header-actions{display:flex;align-items:center;gap:10px;min-width:0}
  #bk-secure-gate .busicare-header-actions span{font-size:11px;color:#dce5ef;overflow-wrap:anywhere}
  #bk-secure-gate .busicare-header-actions button,#bk-secure-gate .busicare-portal-content button,#bk-secure-gate .busicare-action-grid button{background:linear-gradient(135deg,#f4e2b1,#d0a650)!important;color:#102542!important;border:1px solid #c9a24f!important}
  #bk-secure-gate #workspace-select{width:100%;margin:7px 0 12px!important;border:1px solid #dce2ea!important;border-radius:12px!important}
  #bk-secure-gate .busicare-profile-hero{margin:14px 0;padding:18px 20px;border:1px solid #d2ad5d;border-radius:18px;background:linear-gradient(110deg,#0a203b,#173d65);color:#fff}
  #bk-secure-gate .busicare-profile-hero small{color:#f1d58f;font-size:10px;letter-spacing:1.5px;font-weight:800}
  #bk-secure-gate .busicare-profile-hero h2{color:#fff!important;margin:5px 0!important}
  #bk-secure-gate .busicare-profile-hero p{color:#d8e3ef;margin:0}
  #bk-secure-gate .busicare-course-promo{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0 18px;padding:16px 18px;border:1px solid #d4ae5d;border-radius:16px;background:linear-gradient(110deg,#0a203b,#174a7b);color:#fff}
  #bk-secure-gate .busicare-course-promo small{display:block;color:#f0d48d;font-size:9px;font-weight:800;letter-spacing:1.4px;margin-bottom:5px}
  #bk-secure-gate .busicare-course-promo b{display:block;color:#fff;font-size:17px;line-height:1.25}
  #bk-secure-gate .busicare-course-promo span{display:block;color:#f3d991;font-size:11px;margin-top:7px}
  #bk-secure-gate .busicare-portal-content{padding:2px 0 16px}
  #bk-secure-gate .busicare-home-hero{position:relative;overflow:hidden;display:flex;justify-content:space-between;gap:12px;padding:20px 22px;margin:4px 0 18px;border:1px solid #cba34e;border-radius:18px;background:linear-gradient(115deg,#0a203b,#173d65);color:#fff}
  #bk-secure-gate .busicare-home-hero>div:first-child{position:relative;z-index:1}
  #bk-secure-gate .busicare-home-hero span{color:#f1d58f;font-size:10px;font-weight:800;letter-spacing:1.5px}
  #bk-secure-gate .busicare-home-hero h2{color:#fff!important;font-size:clamp(22px,4vw,30px)!important;margin:7px 0!important}
  #bk-secure-gate .busicare-home-hero p{color:#e0e8f0;margin:0 0 13px;font-size:13px}
  #bk-secure-gate .busicare-home-tags{display:flex;flex-wrap:wrap;gap:7px}
  #bk-secure-gate .busicare-home-tags span{padding:5px 9px;border:1px solid #e6c87866;border-radius:30px;background:#ffffff12;color:#f5dfaa;font-size:10px;letter-spacing:0}
  #bk-secure-gate .busicare-home-mark{align-self:center;color:#f3d78b55;font-size:clamp(42px,8vw,72px);font-weight:900;letter-spacing:-7px}
  #bk-secure-gate .busicare-folder-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
  #bk-secure-gate .busicare-folder-card{position:relative;display:flex!important;align-items:center!important;gap:12px!important;min-width:0!important;min-height:94px!important;margin:0!important;padding:13px!important;text-align:left!important;border:1px solid #e7e0d3!important;border-radius:17px!important;background:linear-gradient(145deg,#fff,#fbf8f0)!important;color:#142943!important;box-shadow:0 5px 14px #10254212!important;transition:transform .16s ease,box-shadow .16s ease}
  #bk-secure-gate .busicare-folder-card:active{transform:scale(.985)}
  #bk-secure-gate .busicare-folder-icon{display:grid;place-items:center;flex:0 0 48px;width:48px;height:48px;border-radius:13px;background:linear-gradient(145deg,#0d2a49,#081a32);color:#f1cc69;font-size:25px;font-weight:800}
  #bk-secure-gate .busicare-folder-copy{display:grid;gap:5px;min-width:0;flex:1}
  #bk-secure-gate .busicare-folder-copy b{font-size:clamp(13px,2vw,16px);line-height:1.2;color:#142943}
  #bk-secure-gate .busicare-folder-copy small{font-size:10px;line-height:1.35;color:#778292}
  #bk-secure-gate .busicare-folder-arrow{font-size:25px;color:#b58b37;line-height:1}
  #bk-secure-gate .busicare-home-note,#bk-secure-gate .busicare-info-card{display:grid;gap:7px;margin-top:17px;padding:15px 17px;border:1px solid #e8dfcc;border-radius:14px;background:#fbf8f0;color:#142943}
  #bk-secure-gate .busicare-home-note span,#bk-secure-gate .busicare-info-card span{font-size:12px;color:#667489;line-height:1.6}
  #bk-secure-gate .busicare-secure-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0;padding:15px;border:1px solid #e7e0d3;border-radius:15px;background:#fff}
  #bk-secure-gate .busicare-secure-form label{display:grid;gap:6px;min-width:0;font-size:12px;color:#56677e}
  #bk-secure-gate .busicare-secure-form input,#bk-secure-gate .busicare-secure-form select,#bk-secure-gate .busicare-secure-form textarea{width:100%;min-width:0;padding:10px!important;border:1px solid #dce2ea!important;border-radius:10px!important;background:#fff!important}
  #bk-secure-gate .busicare-secure-form textarea{min-height:86px}
  #bk-secure-gate .busicare-form-wide{grid-column:1/-1}
  #bk-secure-gate .busicare-secure-form button{grid-column:1/-1;min-height:44px;background:linear-gradient(135deg,#f4e2b1,#d0a650)!important;color:#102542!important;border:1px solid #c9a24f!important}
  #bk-secure-gate .busicare-data-table{overflow-x:auto;margin-top:14px;border:1px solid #e7e0d3;border-radius:13px;background:#fff}
  #bk-secure-gate .busicare-data-table table{min-width:560px}
  #bk-secure-gate .busicare-action-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0}
  #bk-secure-gate .busicare-action-grid button{min-height:48px}
  #bk-secure-gate .busicare-invite-form{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
  #bk-secure-gate .busicare-invite-form input{flex:1 1 180px;min-width:0}
  #bk-secure-gate .busicare-output-label{display:grid;gap:7px;margin-top:14px;color:#53657b;font-size:12px}
  #bk-secure-gate #ai-draft-output{width:100%;padding:12px;border:1px solid #dce2ea;border-radius:10px;background:#fff}
  #bk-secure-gate .busicare-bottom-nav{display:none}
  @media(max-width:640px){
    #bk-secure-gate{padding-bottom:82px!important}
    #bk-secure-gate>div{padding:11px!important}
    #bk-secure-gate .busicare-secure-header{padding:12px!important}
    #bk-secure-gate .busicare-secure-brand img{width:40px;height:40px;flex-basis:40px}
    #bk-secure-gate .busicare-secure-brand b{font-size:15px!important}
    #bk-secure-gate .busicare-secure-brand p{font-size:10px}
    #bk-secure-gate .busicare-header-actions span{display:none}
    #bk-secure-gate .busicare-profile-hero{padding:13px 15px}
    #bk-secure-gate .busicare-profile-hero h2{font-size:18px!important}
    #bk-secure-gate .busicare-course-promo{padding:13px 15px}
    #bk-secure-gate .busicare-course-promo b{font-size:14px}
    #bk-secure-gate .busicare-home-hero{padding:17px 15px}
    #bk-secure-gate .busicare-home-mark{display:none}
    #bk-secure-gate .busicare-folder-grid{gap:9px}
    #bk-secure-gate .busicare-folder-card{gap:8px!important;min-height:88px!important;padding:10px!important;border-radius:14px!important}
    #bk-secure-gate .busicare-folder-icon{width:39px;height:39px;flex-basis:39px;border-radius:11px;font-size:21px}
    #bk-secure-gate .busicare-folder-copy b{font-size:12px}
    #bk-secure-gate .busicare-folder-copy small{font-size:9px}
    #bk-secure-gate .busicare-folder-arrow{font-size:20px}
    #bk-secure-gate .busicare-secure-form{grid-template-columns:1fr;padding:12px}
    #bk-secure-gate .busicare-form-wide{grid-column:auto}
    #bk-secure-gate .busicare-bottom-nav{
      position:fixed;z-index:100001;left:8px;right:8px;bottom:8px;
      display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;
      padding:7px 5px calc(7px + env(safe-area-inset-bottom));
      border:1px solid #caa452;border-radius:17px;
      background:linear-gradient(110deg,#071a32f5,#14375cf5);
      box-shadow:0 8px 28px #07172a40;backdrop-filter:blur(12px)
    }
    #bk-secure-gate .busicare-bottom-nav button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:0;min-height:47px;padding:4px 2px!important;margin:0!important;border:1px solid transparent!important;border-radius:11px!important;background:transparent!important;color:#e8edf5!important;box-shadow:none!important}
    #bk-secure-gate .busicare-bottom-nav button span{font-size:19px;line-height:1}
    #bk-secure-gate .busicare-bottom-nav button small{font-size:9px;line-height:1.15;white-space:nowrap}
    #bk-secure-gate .busicare-bottom-nav button.active{background:linear-gradient(135deg,#f4e2b1,#d0a650)!important;border-color:#e7c979!important;color:#102542!important}
  }
  @media(max-width:360px){#bk-secure-gate .busicare-folder-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(responsiveStyle);

  let session = null;
  let workspaces = [];
  let activeId = '';
  let activeRole = '';
  let leads = [];
  let contentItems = [];
  let aiDraft = null;
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

  // Keep unfinished AI form input for this signed-in user and workspace.
  // sessionStorage avoids persisting potentially sensitive briefs beyond this tab session.
  function aiFormDraftKey() {
    return session?.user?.id && activeId ? 'bkbusicare-ai-form-v1:' + session.user.id + ':' + activeId : '';
  }
  function persistAiFormDraft(form) {
    const key = aiFormDraftKey();
    if (!key || !form) return;
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      sessionStorage.setItem(key, JSON.stringify({ values, draft: aiDraft }));
    } catch {
      note('The AI form draft could not be temporarily saved in this browser.', true);
    }
  }
  function restoreAiFormDraft(form) {
    const key = aiFormDraftKey();
    if (!key || !form) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (!saved || typeof saved !== 'object') return;
      for (const [name, value] of Object.entries(saved.values || {})) {
        const control = form.elements.namedItem(name);
        if (control && typeof value === 'string') control.value = value;
      }
      if (saved.draft && typeof saved.draft.text === 'string' && saved.draft.text.trim()) {
        aiDraft = {
          text: saved.draft.text,
          title: typeof saved.draft.title === 'string' ? saved.draft.title : '',
          platform: typeof saved.draft.platform === 'string' ? saved.draft.platform : 'Facebook'
        };
        const output = root.querySelector('#ai-draft-output');
        if (output) output.value = aiDraft.text;
        const save = root.querySelector('[data-action="save-ai-draft"]');
        if (save) save.disabled = false;
      }
    } catch {
      // Ignore malformed or unavailable session storage; the form remains usable.
    }
  }
  function authView(mode) {
    card('<div class="busicare-auth-brand"><img src="' + import.meta.env.BASE_URL + 'busicare-app-icon.svg" alt="BK-BusiCare One app icon"><span>BK-BusiCare · Secure Access</span></div><h2>' + (mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Reset password' : 'Sign in') + '</h2><p>Securely access your workspace.</p><form id="auth-form">' + field('Email','email','email',true,'') + (mode === 'reset' ? '' : field('Password (minimum 12 characters)','password','password',true,'')) + '<button>Continue</button></form><p>' + button('Sign in','mode-login') + button('Create account','mode-signup') + button('Forgot password','mode-reset') + '</p><p data-note></p><small>Supabase Auth handles passwords. This app does not store them.</small>');
    root.querySelector('#auth-form').onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const email = String(f.get('email')).trim();
      const password = String(f.get('password') || '');
      try {
        if (mode === 'signup' && password.length < 12) return note('Password must be at least 12 characters long.',true);
        if (mode === 'login') {
          const r = await supabase.auth.signInWithPassword({ email, password });
          if (r.error) throw r.error;
          session = r.data.session;
          await portal();
        } else if (mode === 'signup') {
          const r = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: new URL(import.meta.env.BASE_URL, location.origin).toString() } });
          if (r.error) throw r.error;
          if (r.data.session) { session = r.data.session; await portal(); }
          else note('Account created. Confirm your email, then sign in.');
        } else {
          const r = await supabase.auth.resetPasswordForEmail(email, { redirectTo: new URL(import.meta.env.BASE_URL, location.origin).toString() });
          if (r.error) throw r.error;
          note('If the account exists, a password reset link has been sent.');
        }
      } catch (err) {
        const detail = String(err?.message || '');
        const networkFailure = err instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(detail);
        note(networkFailure
          ? 'Could not reach Supabase Auth. Check your internet connection, Android Private DNS/VPN settings, and try again. If the connection is stable, contact support to check the Auth service.'
          : (detail || 'Authentication failed. Please try again.'), true);
      }
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
    return leads.map(l => '<tr><td data-label="Name"><b>' + safe(l.name) + '</b><br><small>' + safe(l.company) + ' · ' + safe(l.phone) + ' · ' + safe(l.email) + '</small></td><td data-label="Service">' + safe(l.service) + '</td><td data-label="Status">' + (activeRole==='viewer'?safe(l.status):'<select data-lead-status="' + safe(l.id) + '">' + ['New','Contacted','Proposal','Won','Lost'].map(s => '<option' + (l.status===s?' selected':'') + '>' + s + '</option>').join('') + '</select>') + '</td><td data-label="Value">BDT ' + Number(l.value || 0).toLocaleString('en-BD') + '</td><td data-label="Actions">' + (activeRole==='viewer'?'':button('Edit','edit-lead',' data-id="' + safe(l.id) + '"')) + ((activeRole==='owner'||activeRole==='admin')?button('Delete','delete-lead',' data-id="' + safe(l.id) + '"'):'') + '</td></tr>').join('') || '<tr><td colspan="5">No leads yet.</td></tr>';
  }
  function contentRows() {
    return contentItems.map(c => '<tr><td data-label="Title"><b>' + safe(c.title) + '</b><br><small>' + safe(c.body) + '</small></td><td data-label="Platform">' + safe(c.platform) + '</td><td data-label="Schedule">' + safe(c.scheduled_at || 'Not scheduled') + '</td><td data-label="Status">' + (activeRole==='viewer'?safe(c.status):'<select data-content-status="' + safe(c.id) + '">' + ['Draft','Needs approval','Approved','Scheduled','Published','Failed'].map(s => '<option' + (c.status===s?' selected':'') + '>' + s + '</option>').join('') + '</select>') + '</td><td data-label="Actions">' + (activeRole==='viewer'?'':button('Edit','edit-content',' data-id="' + safe(c.id) + '"')) + ((activeRole==='owner'||activeRole==='admin')?button('Delete','delete-content',' data-id="' + safe(c.id) + '"'):'') + '</td></tr>').join('') || '<tr><td colspan="5">No content items yet.</td></tr>';
  }
  function portalView() {
    const w = workspaces.find(x => x.id === activeId);
    if (!w) return;
    activeRole = w.role;
    const folderItems = [
      ['AI Tools','✦','Create · Write · Automate','AI Content Studio'],
      ['Marketing','◉','Plan · Ads · Campaigns','Marketing'],
      ['SEO Growth','↗','Rank · Traffic · Conversion','SEO Growth'],
      ['Freelancing','▣','Skills · Gigs · Career','Freelancing'],
      ['Training','⌂','Courses · Live Class · Skills','Training'],
      ['Projects','▤','Plan · Tasks · Progress','Projects'],
      ['E-commerce','▧','Store · Products · Orders','E-commerce'],
      ['Team','♙','Members · Roles · Work','Team'],
      ['Profile','◎','Account · Workspace','Profile'],
      ['Settings','⚙','Security · Backup · Help','Settings']
    ];
    let body = '';
    if (page === 'Dashboard') {
      body = '<section class="busicare-home-hero"><div><span>WELCOME TO ONE</span><h2>Grow your business with AI</h2><p>Your business and career workspace</p><div class="busicare-home-tags"><span>AI</span><span>Marketing</span><span>Freelancing</span><span>E-commerce</span><span>Training</span></div></div><div class="busicare-home-mark">BK</div></section>' +
        '<div class="busicare-folder-grid" aria-label="Workspace folders">' + folderItems.map(([name,icon,description,route]) => '<button type="button" class="busicare-folder-card" data-folder="' + safe(route) + '"><span class="busicare-folder-icon">' + icon + '</span><span class="busicare-folder-copy"><b>' + safe(name) + '</b><small>' + safe(description) + '</small></span><span class="busicare-folder-arrow" aria-hidden="true">›</span></button>').join('') + '</div>' +
        '<div class="busicare-home-note"><b>Workspace Overview</b><span>' + leads.length + ' leads · ' + contentItems.length + ' content items · ' + safe(activeRole) + ' access</span></div>';
    } else if (page === 'Leads') {
      body = '<h2>Lead Management</h2>' + (activeRole==='viewer'?'<p>Read-only access</p>':'<form id="lead-form" class="busicare-secure-form">' + field('Name','name','text',true,'') + field('Company','company','text',false,'') + field('Service','service','text',false,'Digital Marketing') + field('Phone','phone','tel',false,'') + field('Email','email','email',false,'') + field('Value (BDT)','value','number',false,'0') + field('Follow-up date','follow_up','date',false,'') + '<label class="busicare-form-wide">Notes<textarea name="notes" maxlength="4000"></textarea></label><button>Add Lead</button></form>') + '<div class="busicare-data-table"><table><thead><tr><th>Name</th><th>Service</th><th>Status</th><th>Value</th><th>Actions</th></tr></thead><tbody>' + leadRows() + '</tbody></table></div>';
    } else if (page === 'Content Planner' || page === 'Marketing') {
      body = '<h2>' + (page === 'Marketing' ? 'Marketing Workspace' : 'Content Planner') + '</h2><p>Plan campaigns and manage content drafts. No campaign is published or ad spend initiated from this workspace.</p>' +
        (page === 'Marketing' ? '<div class="busicare-action-grid">' + button('Lead Management','page',' data-page="Leads"') + button('Content Planner','page',' data-page="Content Planner"') + '</div>' : '') +
        (activeRole==='viewer'?'<p>Read-only access</p>':'<form id="content-form" class="busicare-secure-form">' + field('Title','title','text',true,'') + '<label>Platform<select name="platform"><option>Facebook</option><option>Instagram</option><option>TikTok</option><option>LinkedIn</option><option>YouTube</option></select></label>' + field('Schedule','scheduled_at','datetime-local',false,'') + '<label class="busicare-form-wide">Content<textarea name="body" maxlength="10000"></textarea></label><button>Add Content Draft</button></form>') +
        '<div class="busicare-data-table"><table><thead><tr><th>Title</th><th>Platform</th><th>Schedule</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + contentRows() + '</tbody></table></div>';
    } else if (page === 'AI Content Studio' || page === 'AI Tools') {
      body = '<h2>AI Content Studio</h2><p>Only authenticated workspace members can create drafts. AI does not publish posts or send messages to anyone.</p>' + (activeRole==='viewer'?'<p>Read-only access</p>':'<form id="ai-content-form" class="busicare-secure-form"><label>Topic *<input name="topic" maxlength="500" required></label><label>Platform<select name="platform"><option>Facebook</option><option>Instagram</option><option>TikTok</option><option>LinkedIn</option><option>YouTube</option></select></label><label>Audience<input name="audience" maxlength="240" value="General audience"></label><label>Objective<input name="objective" maxlength="240" value="Useful, accurate engagement"></label><label class="busicare-form-wide">Offer / verified facts<textarea name="offer" maxlength="300"></textarea></label><button>Generate AI draft</button></form>') + '<label class="busicare-output-label">Generated draft<textarea id="ai-draft-output" rows="12" readonly>' + safe(aiDraft?.text || '') + '</textarea></label>' + (activeRole==='viewer'?'':button('Save draft to Content Planner','save-ai-draft','' + (aiDraft?'':' disabled'))) + '<p>AI output is a draft. Verify the information and obtain human approval before publishing.</p>';
    } else if (page === 'Team') {
      body = '<h2>Team & Collaboration</h2><p>Role: ' + safe(activeRole) + '</p>' + ((activeRole==='owner'||activeRole==='admin')?'<form id="invite-form" class="busicare-invite-form"><input name="email" type="email" required placeholder="Member email"><select name="role"><option value="member">Member</option><option value="viewer">Viewer</option>' + (activeRole==='owner'?'<option value="admin">Admin</option>':'') + '</select><button>Send invitation</button></form>':'') + '<div id="members">Loading members…</div>';
    } else if (page === 'Profile') {
      body = '<h2>My Profile</h2><div class="busicare-info-card"><b>' + safe(session.user.email) + '</b><span>Signed-in account</span><span>Workspace role: ' + safe(activeRole) + '</span><span>Workspace: ' + safe(w.name) + '</span></div>';
    } else if (page === 'Settings') {
      body = '<h2>Workspace Settings</h2><div class="busicare-info-card"><b>Security & Access</b><span>Authenticated Supabase session</span><span>Workspace-level data access protected by Row Level Security (RLS)</span><span>Current role: ' + safe(activeRole) + '</span></div><p>Account, workspace, security and recovery controls remain managed by the secure workspace services.</p>';
    } else {
      const info = {
        'SEO Growth':['SEO Growth','SEO Audit · Keyword Research · On-page SEO · Local SEO','SEO tools are planned for this workspace. No external site is crawled and no SEO changes are published yet.'],
        'Freelancing':['Freelancing','Profile · Portfolio · Proposals · Client Pipeline','Freelancing workspace structure is reserved. Marketplace connections and proposal submission are not enabled.'],
        'Training':['Learning & Training','Courses · Live Classes · Learning Progress · Certificates','Training section is reserved for course access and progress tracking.'],
        'Projects':['Projects & Tasks','Projects · Tasks · Milestones · Reports','Project tracking modules are planned. No project tasks are currently synchronized.'],
        'E-commerce':['E-commerce','Store · Products · Orders · Customers','E-commerce section is a workspace placeholder. Live inventory, checkout and payments are not enabled.'],
        'More':['More Workspace Sections','Leads · Team · Profile · Settings','Open a workspace folder from the Home dashboard to continue.']
      }[page] || ['Workspace Section', 'Workspace modules', 'This section is not connected yet.'];
      body = '<h2>' + safe(info[0]) + '</h2><div class="busicare-info-card"><b>' + safe(info[1]) + '</b><span>' + safe(info[2]) + '</span></div>' +
        (page === 'More' ? '<div class="busicare-action-grid">' + button('Leads','page',' data-page="Leads"') + button('Team','page',' data-page="Team"') + button('Profile','page',' data-page="Profile"') + button('Settings','page',' data-page="Settings"') + '</div>' : '');
    }
    const bottomNav = [['Dashboard','⌂','Home'],['AI Content Studio','✦','AI Tools'],['Marketing','◉','Marketing'],['SEO Growth','↗','SEO'],['More','▦','More']];
    card('<header class="busicare-secure-header"><div class="busicare-secure-brand"><img src="' + import.meta.env.BASE_URL + 'busicare-app-icon.svg" alt="BK-BusiCare One app icon"><div><b>BK-BusiCare One</b><p>AI Business & Career Platform</p></div></div><div class="busicare-header-actions"><span>' + safe(session.user.email) + '</span><button type="button" id="logout">Sign out</button></div></header>' +
      '<label>Workspace<select id="workspace-select">' + workspaces.map(x => '<option value="' + safe(x.id) + '"' + (x.id===activeId?' selected':'') + '>' + safe(x.name) + ' · ' + safe(x.role) + '</option>').join('') + '</select></label>' +
      '<section class="busicare-profile-hero"><div><small>WELCOME BACK</small><h2>Md. Rezaul Karim</h2><p>AI Skills Mentor | Business Growth Consultant</p></div></section>' +
      '<section class="busicare-course-promo"><div><small>FEATURED LEARNING</small><b>AI Powered Digital Marketing Mastery Course</b><span>Learn · Practice · Earn</span></div><div class="course-mark">↗</div></section>' +
      '<main class="busicare-portal-content">' + body + '<p data-note aria-live="polite"></p></main>' +
      '<nav class="busicare-bottom-nav" aria-label="Quick navigation">' + bottomNav.map(([route,icon,label]) => '<button type="button" data-page="' + route + '" class="' + (page===route?'active':'') + '"><span>' + icon + '</span><small>' + label + '</small></button>').join('') + '</nav>');
    root.querySelector('#logout').onclick = logout;
    root.querySelector('#workspace-select').onchange = async e => {
      persistAiFormDraft(root.querySelector('#ai-content-form'));
      activeId=e.target.value;
      aiDraft = null;
      await refresh();
    };
    const currentAiForm = root.querySelector('#ai-content-form');
    if (currentAiForm) {
      restoreAiFormDraft(currentAiForm);
      currentAiForm.addEventListener('input', () => persistAiFormDraft(currentAiForm));
      currentAiForm.addEventListener('change', () => persistAiFormDraft(currentAiForm));
    }
    root.querySelectorAll('[data-page]').forEach(b => b.onclick = () => {
      persistAiFormDraft(root.querySelector('#ai-content-form'));
      page=b.dataset.page;
      portalView();
      bindDataActions();
    });
    root.querySelectorAll('[data-folder]').forEach(b => b.onclick = () => {
      persistAiFormDraft(root.querySelector('#ai-content-form'));
      page=b.dataset.folder;
      portalView();
      bindDataActions();
    });
    if (page === 'Team') loadMembers();
    bindDataActions();
  }
  async function loadMembers() {
    const r = await supabase.from('workspace_members').select('user_id,role,created_at').eq('workspace_id',activeId).order('created_at');
    const host = root.querySelector('#members');
    if (!host) return;
    if (r.error) { host.textContent = r.error.message; return; }
    const members = r.data || [];
    if (!members.length) { host.textContent = 'No workspace members found.'; return; }
    host.innerHTML = '<table><thead><tr><th>Member</th><th>Role</th><th>Actions</th></tr></thead><tbody>' + members.map(m => '<tr><td data-label="Member">' + (m.user_id===session.user.id ? 'You (current account)' : 'Workspace member') + '</td><td data-label="Role"><b>' + safe(m.role) + '</b></td><td data-label="Actions">' + ((activeRole==='owner'||activeRole==='admin')&&m.role!=='owner'&&m.user_id!==session.user.id?'<select aria-label="Member role" data-member-role="' + safe(m.user_id) + '">' + (activeRole==='owner'?'<option value="admin"' + (m.role==='admin'?' selected':'') + '>Admin</option>':'') + '<option value="member"' + (m.role==='member'?' selected':'') + '>Member</option><option value="viewer"' + (m.role==='viewer'?' selected':'') + '>Viewer</option></select> <button type="button" data-set-role="' + safe(m.user_id) + '">Save role</button>':'—') + '</td></tr>').join('') + '</tbody></table>';
    host.querySelectorAll('[data-set-role]').forEach(b => b.onclick = async () => {
      const select = host.querySelector('[data-member-role="' + b.dataset.setRole + '"]');
      if (!select) return;
      const result = await supabase.functions.invoke('manage-workspace-member',{body:{action:'set_role',workspace_id:activeId,user_id:b.dataset.setRole,role:select.value}});
      if (result.error || result.data?.error) { note(result.data?.error || result.error?.message || 'Role update failed.',true); return; }
      await loadMembers();
      note('Workspace role updated.');
    });
  }
  async function refresh() {
    if (busy) return;
    busy = true;
    try { await loadRecords(); portalView(); }
    catch (err) { card('<b>Workspace data error</b><p>' + safe(err.message || 'Unable to load workspace data.') + '</p><p data-note></p>'); }
    finally { busy = false; }
  }
  function bindDataActions() {
    const aiForm = root.querySelector('#ai-content-form');
    if (aiForm) aiForm.onsubmit = async e => {
      e.preventDefault();
      const submit = aiForm.querySelector('button[type="submit"],button:not([type])');
      if (submit) { submit.disabled = true; submit.textContent = 'Generating…'; }
      const f = new FormData(aiForm);
      const payload = {
        workspace_id: activeId,
        topic: String(f.get('topic') || '').trim(),
        platform: String(f.get('platform') || ''),
        audience: String(f.get('audience') || '').trim(),
        objective: String(f.get('objective') || '').trim(),
        offer: String(f.get('offer') || '').trim()
      };
      try {
        const result = await supabase.functions.invoke('ai-content', { body: payload });
        if (result.error || result.data?.error) throw new Error(result.data?.error || result.error?.message || 'AI generation failed');
        if (typeof result.data?.text !== 'string' || !result.data.text.trim()) throw new Error('AI provider returned an empty draft');
        aiDraft = { text: result.data.text.trim(), title: payload.topic.slice(0,200), platform: payload.platform };
        persistAiFormDraft(aiForm);
        const output = root.querySelector('#ai-draft-output');
        if (output) output.value = aiDraft.text;
        const save = root.querySelector('[data-action="save-ai-draft"]');
        if (save) save.disabled = false;
        note('AI draft generated. Review it and select Save Draft.');
      } catch (err) {
        note(err.message || 'AI generation unavailable. Check the TEST provider configuration.', true);
      } finally {
        if (submit) { submit.disabled = false; submit.textContent = 'Generate AI draft'; }
      }
    };
    const saveAi = root.querySelector('[data-action="save-ai-draft"]');
    if (saveAi) saveAi.onclick = async () => {
      if (!aiDraft || activeRole === 'viewer') return;
      saveAi.disabled = true;
      const payload = { workspace_id: activeId, title: aiDraft.title, platform: aiDraft.platform, body: aiDraft.text, created_by: session.user.id, status: 'Draft' };
      const result = await supabase.from('content_items').insert(payload);
      if (result.error) { saveAi.disabled = false; note(result.error.message, true); return; }
      aiDraft = null;
      const draftKey = aiFormDraftKey();
      if (draftKey) { try { sessionStorage.removeItem(draftKey); } catch { /* storage may be unavailable */ } }
      note('AI draft saved to Content Planner.');
      await refresh();
    };
    const inviteForm = root.querySelector('#invite-form');
    if (inviteForm) inviteForm.onsubmit = async e => {
      e.preventDefault();
      const values = new FormData(inviteForm);
      const result = await supabase.functions.invoke('manage-workspace-member',{body:{action:'invite',workspace_id:activeId,email:String(values.get('email')).trim(),role:String(values.get('role'))}});
      if (result.error || result.data?.error) { note(result.data?.error || result.error?.message || 'Invitation failed.',true); return; }
      inviteForm.reset();
      await loadMembers();
      note('Invitation email sent.');
    };
    const lf = root.querySelector('#lead-form');
    if (lf) lf.onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(lf);
      const payload = {workspace_id:activeId,name:String(f.get('name')).trim(),company:String(f.get('company')||'').trim(),service:String(f.get('service')||'').trim(),phone:String(f.get('phone')||'').trim(),email:String(f.get('email')||'').trim(),value:Math.max(0,Number(f.get('value')||0)),follow_up:f.get('follow_up')||null,notes:String(f.get('notes')||'').trim(),created_by:session.user.id};
      if (!payload.name || !Number.isFinite(payload.value)) return note('Enter a name and a valid value.',true);
      const r = await supabase.from('leads').insert(payload);
      if (r.error) return note(r.error.message,true);
      await refresh();
    };
    const cf = root.querySelector('#content-form');
    if (cf) cf.onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(cf);
      const payload = {workspace_id:activeId,title:String(f.get('title')).trim(),platform:String(f.get('platform')).trim(),body:String(f.get('body')||'').trim(),scheduled_at:f.get('scheduled_at')?new Date(f.get('scheduled_at')).toISOString():null,created_by:session.user.id,status:'Draft'};
      if (!payload.title || !payload.platform) return note('Enter a title and platform.',true);
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
      if (!confirm('Permanently delete this record?')) return;
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
        card('<b>BK-BusiCare · Workspace Setup</b><h2>Create your workspace</h2><p>You will be assigned the Owner role.</p><form id="workspace-form">' + field('Workspace name','name','text',true,'') + '<button>Create workspace</button></form><p data-note></p><button id="logout">Sign out</button>');
        root.querySelector('#workspace-form').onsubmit = async e => {
          e.preventDefault();
          const name = String(new FormData(e.currentTarget).get('name')).trim();
          if (name.length < 2 || name.length > 120) { note('Workspace name must be between 2 and 120 characters.', true); return; }
          const { data: created, error } = await supabase.functions.invoke('create-workspace', { body: { workspace_name: name } });
          if (error || created?.error || !created?.workspace_id) { note(created?.error || error?.message || 'Workspace creation failed. Please try again.',true); return; }
          activeId = created.workspace_id;
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
      if (password.length < 12) return note('Password must be at least 12 characters long.',true);
      const result = await supabase.auth.updateUser({ password });
      if (result.error) { note(result.error.message,true); return; }
      note('Password updated successfully.');
    };
  }
  async function logout() {
    const r = await supabase.auth.signOut();
    if (r.error) { note(r.error.message,true); return; }
    const draftKey = aiFormDraftKey();
    if (draftKey) { try { sessionStorage.removeItem(draftKey); } catch { /* storage may be unavailable */ } }
    session = null; workspaces = []; activeId = ''; leads = []; contentItems = []; aiDraft = null; authView('login');
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
