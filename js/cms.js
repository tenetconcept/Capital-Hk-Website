// ============================================
// CMS MODULE — Auth, 2FA, RBAC, Editor, Files, Users
// ============================================

var CMS_KEY = "ecap_cms_pages";
var CMS_FILES_KEY = "ecap_cms_files";
var CMS_USERS_KEY = "ecap_cms_users";
var CMS_BANNERS_KEY = "ecap_cms_banners";
var _adminCurrentUser = null;
function getCmsFiles(){ try{var d=JSON.parse(localStorage.getItem(CMS_FILES_KEY));return d||[];}catch(e){return[];} }
function saveCmsFiles(d){ localStorage.setItem(CMS_FILES_KEY,JSON.stringify(d)); }
function getCmsUsers(){ try{var d=JSON.parse(localStorage.getItem(CMS_USERS_KEY));return d||[];}catch(e){return[];} }
function saveCmsUsers(d){ localStorage.setItem(CMS_USERS_KEY,JSON.stringify(d)); }
function getCmsBanners(){ try{var d=JSON.parse(localStorage.getItem(CMS_BANNERS_KEY));return d||[];}catch(e){return[];} }
function saveCmsBanners(d){ localStorage.setItem(CMS_BANNERS_KEY,JSON.stringify(d)); }
function sha256hex(s){ return crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)).then(function(b){return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,"0");}).join("");}); }
var CMS_2FA_KEY = "ecap_cms_2fa";
function get2FAConfig(){ try{ return JSON.parse(localStorage.getItem(CMS_2FA_KEY))||{}; }catch(e){ return {}; } }
function save2FAConfig(d){ localStorage.setItem(CMS_2FA_KEY, JSON.stringify(d)); }
// Base32 decode for TOTP
function b32decode(s){
  var alpha="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",bits="",bytes=[];
  s=s.replace(/[\s=-]/g,"").toUpperCase();
  for(var i=0;i<s.length;i++){var v=alpha.indexOf(s[i]);if(v<0)continue;bits+=("00000"+v.toString(2)).slice(-5);}
  for(var i=0;i+8<=bits.length;i+=8) bytes.push(parseInt(bits.substr(i,8),2));
  return new Uint8Array(bytes);
}
// HMAC-SHA1 via Web Crypto
function hmacSha1(keyBytes,msg){
  return crypto.subtle.importKey("raw",keyBytes,{name:"HMAC",hash:"SHA-1"},false,["sign"]).then(function(k){
    return crypto.subtle.sign("HMAC",k,msg);
  }).then(function(sig){ return new Uint8Array(sig); });
}
// Generate TOTP code from base32 secret
function generateTOTP(secret,t){
  t=t||Math.floor(Date.now()/1000);
  var step=Math.floor(t/30);
  var msg=new Uint8Array(8);
  for(var i=7;i>=0;i--){msg[i]=step&0xff;step=Math.floor(step/256);}
  var key=b32decode(secret);
  return hmacSha1(key,msg).then(function(h){
    var off=h[h.length-1]&0x0f;
    var code=((h[off]&0x7f)<<24|(h[off+1]&0xff)<<16|(h[off+2]&0xff)<<8|(h[off+3]&0xff))%1000000;
    return ("000000"+code).slice(-6);
  });
}
// Verify TOTP with +/- 1 window tolerance
function verifyTOTP(secret,token){
  var now=Math.floor(Date.now()/1000);
  return Promise.all([generateTOTP(secret,now-30),generateTOTP(secret,now),generateTOTP(secret,now+30)]).then(function(codes){
    return codes.indexOf(token)>=0;
  });
}
// Generate random base32 secret (20 bytes = 32 chars)
function generateSecret(){
  var alpha="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",arr=new Uint8Array(20);
  crypto.getRandomValues(arr);
  var s="";
  for(var i=0;i<arr.length;i++) s+=alpha[arr[i]%32];
  return s;
}
function checkAdminLogin(username, pass){
  return sha256hex(pass).then(function(hash){
    var users = getCmsUsers();
    if(users.length > 0){
      var found = users.find(function(u){ return u.username===username && u.hash===hash; });
      return found ? {username:found.username, role:found.role||"admin"} : null;
    }
    if(username==="admin" && hash===ADMIN_HASH) return {username:"admin", role:"admin"};
    return null;
  });
}
// ————— ROLE SYSTEM —————
var CMS_ROLE_PERMS = {
  admin:  {save:true,  upload:true,  deleteFile:true,  users:true,  export:true,  reset:true,  editPage:true},
  editor: {save:true,  upload:true,  deleteFile:true,  users:false, export:false, reset:false, editPage:true},
  viewer: {save:false, upload:false, deleteFile:false, users:false, export:false, reset:false, editPage:false}
};
function _cmsHasPermission(action){
  var role = sessionStorage.getItem("ecap_admin_role")||"admin";
  return (CMS_ROLE_PERMS[role]||CMS_ROLE_PERMS.admin)[action]===true;
}
function _cmsCurrentRole(){ return sessionStorage.getItem("ecap_admin_role")||"admin"; }

// ————————————————————— ADMIN VIEW —————————————————————
function adminView(){
  // --- Admin Login Gate ---
  if(!isAdminLoggedIn()){
    return '<section class="admin-login"><div class="admin-login-box">'
      +'<div class="login-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>'
      +'<h2>CMS Admin</h2>'
      +'<p class="login-sub">Please login to manage website content</p>'
      +'<form onsubmit="return window._adminLogin(event)">'
      +'<div class="login-field"><label>Username</label><input type="text" id="adminUser" value="admin" autocomplete="username" oninput="var t=document.getElementById(\x27totpField\x27);if(t)t.style.display=get2FAConfig()[this.value.trim()]?\x27\x27:\x27none\x27"/></div>'
      +'<div class="login-field"><label>Password</label><input type="password" id="adminPass" placeholder="Enter password" autocomplete="current-password"/></div>'
      +'<div class="login-field" id="totpField" style="display:none"><label>2FA Code</label><input type="text" id="adminTOTP" placeholder="6-digit code" maxlength="6" autocomplete="one-time-code" inputmode="numeric" pattern="[0-9]*" style="letter-spacing:4px;font-size:18px;text-align:center"/></div>'
      +'<button type="submit" class="login-btn" id="loginBtn">Login</button>'
      +'<div class="login-err" id="loginErr"></div>'
      +'</form>'
      +'</div></section>';
  }

  // --- Authenticated CMS View ---
  var allPages = Object.keys(SITE.pages);
  var cms = getCmsPages();
  var _curRole = _cmsCurrentRole();
  var _isAdmin = _curRole === "admin";
  var _canEdit = _curRole === "admin" || _curRole === "editor";
  return '<div class="cms-layout">'
    // Sidebar
    +'<aside class="cms-sidebar">'
    +'<div class="cms-sidebar-hdr"><h2><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:6px"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Pages</h2><p>'+allPages.length+' pages total</p></div>'
    +'<div class="cms-search"><input type="text" id="cmsSearch" placeholder="Search pages..." oninput="window._cmsFilter(this.value)"/></div>'
    +'<div class="cms-page-list" id="cmsPageList">'
    + allPages.map(function(slug){
        var edited = cms[slug] ? ' edited' : '';
        return '<div class="cms-page-item'+edited+'" data-slug="'+esc(slug)+'" onclick="window._cmsEditPage(\''+slug+'\')">'
          +'<span class="page-dot"></span><span class="page-name">'+esc(slug)+'</span></div>';
      }).join('')
    +'</div></aside>'
    // Main
    +'<div class="cms-main">'
    +'<div class="cms-main-header"><h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:6px"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>CMS Content Manager</h3>'
    +'<div class="cms-header-acts">'
    +'<button class="cms-preview-toggle" id="previewToggle" onclick="window._cmsPreviewPage()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Preview</button>'
    +(_isAdmin ? '<button class="admin-btn primary" onclick="window._cmsExport()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button>'
    +'<button class="admin-btn secondary" onclick="document.getElementById(\'cmsImportFile\').click()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Import</button>'
    +'<input type="file" id="cmsImportFile" accept=".json" style="display:none" onchange="window._cmsImport(event)"/>'
    +'<button class="admin-btn danger" onclick="window._cmsReset()">&#x21BA; Reset</button>' : '')
    +'<span class="role-badge role-'+_curRole+'" style="margin-left:4px">'+_curRole+'</span>'
    +'<button class="admin-btn secondary" onclick="window._adminLogout()" style="margin-left:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Logout</button>'
    +'</div></div>'
    +'<div class="cms-section-bar"><button class="cms-section-btn active" id="stab_pages" onclick="window._cmsSectionSwitch(0)">Pages</button><button class="cms-section-btn" id="stab_banners" onclick="window._cmsSectionSwitch(3)">Banners</button><button class="cms-section-btn" id="stab_files" onclick="window._cmsSectionSwitch(1)">Downloads</button>'+(_isAdmin?'<button class="cms-section-btn" id="stab_users" onclick="window._cmsSectionSwitch(2)">Users</button>':'')+'</div>'
    +'<div class="cms-editor-area" id="cmsEditor">'
    +'<div class="cms-empty"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div><p>Select a page from the sidebar to start editing</p></div>'
    +'</div></div></div>';
}
// Expose for router
window.adminView = adminView;

// ————————————————————— ADMIN AUTH —————————————————————
// Default password: "admin" — SHA-256 hash below
var ADMIN_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";
var ADMIN_SESSION_KEY = "ecap_admin_auth";

function isAdminLoggedIn(){ return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1"; }
window.isAdminLoggedIn = isAdminLoggedIn;

window._adminLogout = function(){
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  location.hash = "#/";
};

window._adminLogin = function(e){
  e.preventDefault();
  var user = document.getElementById("adminUser").value.trim();
  var pass = document.getElementById("adminPass").value;
  var btn = document.getElementById("loginBtn");
  var errEl = document.getElementById("loginErr");
  btn.disabled = true;
  btn.textContent = "Verifying...";
  checkAdminLogin(user, pass).then(function(matched){
    if(matched){
      // Check if 2FA is enabled for this user
      var cfg2fa = get2FAConfig();
      var userSecret = cfg2fa[matched.username||user];
      if(userSecret){
        var totpField = document.getElementById('totpField');
        var totpInput = document.getElementById('adminTOTP');
        if(totpField.style.display==='none'){
          totpField.style.display='';
          totpInput.focus();
          errEl.textContent='Enter your 2FA code from authenticator app.';
          errEl.style.color='var(--brand)';
          btn.disabled=false;
          btn.textContent='Verify 2FA';
          return;
        }
        var code = totpInput.value.replace(/\s/g,'');
        if(code.length!==6){errEl.textContent='Enter 6-digit code.';errEl.style.color='';btn.disabled=false;btn.textContent='Verify 2FA';return;}
        verifyTOTP(userSecret, code).then(function(valid){
          if(valid){
            sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
            sessionStorage.setItem('ecap_admin_user', matched.username||matched);
            sessionStorage.setItem('ecap_admin_role', matched.role||'admin');
            _adminCurrentUser = matched.username||matched;
            window.route();
          } else {
            errEl.textContent='Invalid 2FA code. Try again.';
            errEl.style.color='';
            btn.disabled=false;
            btn.textContent='Verify 2FA';
            totpInput.value='';
            totpInput.focus();
          }
        });
        return;
      }
      // No 2FA - login directly
      sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      sessionStorage.setItem("ecap_admin_user", matched.username||matched);
      sessionStorage.setItem("ecap_admin_role", matched.role||"admin");
      _adminCurrentUser = matched.username||matched;
      window.route();
    } else {
      errEl.textContent = "Incorrect username or password.";
      errEl.style.color='';
      btn.disabled = false;
      btn.textContent = "Login";
    }
  });
  return false;
};

// ————————————————————— CMS FUNCTIONS —————————————————————
var _cmsCurrentSlug = null;
var _cmsPreviewOn = false;

window._cmsFilter = function(q){
  q = q.toLowerCase();
  document.querySelectorAll('.cms-page-item').forEach(function(el){
    var slug = el.getAttribute('data-slug') || '';
    el.style.display = slug.toLowerCase().indexOf(q) >= 0 ? '' : 'none';
  });
};

window._cmsPreviewPage = function(){
  if(!_cmsCurrentSlug){ showToast("Select a page first"); return; }
  var slug = _cmsCurrentSlug;
  var bodyEl = document.getElementById('cms_b_'+slug+'_'+currentLang);
  var titleEl = document.getElementById('cms_t_'+slug+'_'+currentLang);
  var pg = getPage(slug, currentLang) || {};
  var body = bodyEl ? bodyEl.value : (pg.body||'');
  var title = titleEl ? titleEl.value : (pg.title||slug);
  var css = '';
  try{ css = document.querySelector('style').textContent; }catch(e){}
  var pw = window.open('', '_blank', 'width=960,height=720,scrollbars=yes,resizable=yes');
  if(!pw){ showToast("Pop-up blocked. Allow pop-ups and try again."); return; }
  pw.document.write('<!DOCTYPE html><html lang="'+currentLang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview — '+title+'</title><style>'+css+'</style></head><body style="padding-top:0"><div style="background:#f59e0b;color:#fff;font-size:12px;font-weight:600;padding:6px 20px;text-align:center;letter-spacing:.5px">PREVIEW MODE — unsaved changes included</div><section class="subpage"><div class="mw"><div class="subpage-header"><div class="breadcrumb">Preview</div><h1>'+title+'</h1></div><div class="subpage-body">'+body+'</div></div></section></body></html>');
  pw.document.close();
};

window._cmsEditPage = function(slug){
  _cmsCurrentSlug = slug;
  var langs = ["zh-Hant","zh-Hans","en"];
  var langNames = {"zh-Hant":"繁體中文","zh-Hans":"简体中文","en":"English"};
  var html = '<h3 style="font-size:20px;font-weight:700;margin-bottom:16px">'+esc(slug)+'</h3>';

    var _canEditPages = _cmsHasPermission('editPage');
  langs.forEach(function(lang){
    var pg = getPage(slug, lang);
    var title = pg ? pg.title : '';
    var body = pg ? pg.body : '';
    var taId = 'cms_b_'+slug+'_'+lang;
    var tbHtml = _canEditPages ? _cmsBuildToolbar(taId) : '';
    html += '<div class="cms-field-group"><h4>'+esc(langNames[lang])+' ('+lang+')</h4>'
      +'<div class="admin-field"><label>Title</label><input type="text" id="cms_t_'+slug+'_'+lang+'" value="'+escAttr(title)+'"'+(!_canEditPages?' readonly style="background:#f3f4f6;color:var(--text-muted)"':'')+'/></div>'
      +'<div class="admin-field">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
      +'<label style="margin:0">Body (HTML)</label>'
      +(_canEditPages ? '<button type="button" class="cms-insert-file-btn" data-slug="'+slug+'" data-lang="'+lang+'" onclick="event.preventDefault();event.stopPropagation();window._cmsShowFilePicker(this)">Insert Download Link</button>' : '<span class="role-badge role-viewer">Read-only</span>')
      +'</div>'
      +tbHtml
      +'<textarea id="'+taId+'" style="min-height:200px;font-family:monospace;font-size:13px"'+(!_canEditPages?' readonly':'')+'>'+escHtml(body)+'</textarea>'
      +'</div></div>';
  });

  html += '<div style="display:flex;gap:8px;margin-top:8px">'
    +(_canEditPages ? '<button class="admin-btn primary" onclick="window._cmsSavePage(\''+slug+'\')"> Save Changes</button>' : '<span style="font-size:12px;color:var(--text-muted);align-self:center">Viewer mode — cannot save</span>')
    +'<a href="#/page/'+esc(slug)+'" target="_blank" class="admin-btn secondary" style="text-decoration:none;display:inline-flex;align-items:center"> View Page</a></div>';

  if(_cmsPreviewOn){
    var previewPg = getPage(slug, currentLang);
    var previewBody = previewPg ? previewPg.body : '<p style="color:var(--text-muted)">No content</p>';
    html += '<div style="margin-top:24px"><div class="cms-preview-label"> Live Preview ('+currentLang+')</div>'
      +'<div class="cms-preview-panel"><div class="subpage-body" id="cmsPreviewBody">'+previewBody+'</div></div></div>';
  }

  document.getElementById("cmsEditor").innerHTML = html;

  // Attach toolbar events
  document.querySelectorAll('.cms-toolbar').forEach(function(tb){
    tb.addEventListener('click', function(e){
      var btn = e.target.closest('.cms-tb-btn');
      if(!btn) return;
      window._cmsToolbarAction(tb.getAttribute('data-ta'), btn.getAttribute('data-a'));
    });
  });
  // Auto-resize textareas
  document.querySelectorAll('.cms-editor-area textarea').forEach(function(ta){
    ta.addEventListener('input', function(){ this.style.height='auto'; this.style.height=this.scrollHeight+'px'; });
    ta.style.height = ta.scrollHeight+'px';
  });

  // Highlight active page in sidebar
  document.querySelectorAll('.cms-page-item').forEach(function(el){
    el.classList.toggle('active', el.getAttribute('data-slug') === slug);
  });
};

window._cmsLivePreview = function(slug){
  if(!_cmsPreviewOn) return;
  var tEl = document.getElementById("cms_t_"+slug+"_"+currentLang);
  var bEl = document.getElementById("cms_b_"+slug+"_"+currentLang);
  var preview = document.getElementById("cmsPreviewBody");
  if(bEl && preview) preview.innerHTML = bEl.value;
};

window._cmsSavePage = function(slug){
  var cms = getCmsPages();
  if(!cms[slug]) cms[slug] = {};
  ["zh-Hant","zh-Hans","en"].forEach(function(lang){
    var tEl = document.getElementById("cms_t_"+slug+"_"+lang);
    var bEl = document.getElementById("cms_b_"+slug+"_"+lang);
    if(tEl && bEl){
      cms[slug][lang] = { title: tEl.value, body: bEl.value };
    }
  });
  saveCmsPages(cms);
  showToast("Saved: " + slug);
  // Mark sidebar item as edited
  document.querySelectorAll('.cms-page-item').forEach(function(el){
    if(el.getAttribute('data-slug') === slug) el.classList.add('edited');
  });
};

window._cmsExport = function(){
  var cms = getCmsPages();
  // Merge with defaults for full export
  var full = JSON.parse(JSON.stringify(SITE.pages));
  Object.keys(cms).forEach(function(slug){
    if(!full[slug]) full[slug] = {};
    Object.keys(cms[slug]).forEach(function(lang){
      full[slug][lang] = cms[slug][lang];
    });
  });
  var blob = new Blob([JSON.stringify(full, null, 2)], {type:"application/json"});
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ecapital-cms-"+new Date().toISOString().slice(0,10)+".json";
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("Exported JSON");
};

window._cmsImport = function(e){
  var file = e.target.files[0];
  if(!file) return;
  var reader = new FileReader();
  reader.onload = function(ev){
    try {
      var data = JSON.parse(ev.target.result);
      saveCmsPages(data);
      showToast("Imported successfully");
      window.route();
    } catch(err){ showToast("Invalid JSON file"); }
  };
  reader.readAsText(file);
  e.target.value = "";
};

window._cmsReset = function(){
  if(confirm("Reset all CMS edits to default?")) {
    localStorage.removeItem(CMS_KEY);
    showToast("Reset to defaults");
    window.route();
  }
};

// ————————————————————— CMS SECTION SWITCHER —————————————————————
var _cmsSection = "pages";
window._cmsSectionSwitch = function(sec){
  var secs = ["pages","files","users","banners"];
  if(typeof sec === "number") sec = secs[sec] || "pages";
  _cmsSection = sec;
  ["pages","files","users","banners"].forEach(function(s){
    var b = document.getElementById("stab_"+s);
    if(b) b.classList.toggle("active", s===sec);
  });
  var sidebar = document.querySelector(".cms-sidebar");
  if(sidebar) sidebar.style.display = sec==="pages" ? "" : "none";
  if(sec==="pages") {
    document.getElementById("cmsEditor").innerHTML = '<div class="cms-empty"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div><p>Select a page from the sidebar to start editing</p></div>';
  } else if(sec==="files") {
    window._cmsFilesView();
  } else if(sec==="users") {
    if(!_cmsHasPermission("users")){ showToast("Admin access required"); return; }
    window._cmsUsersView();
  } else if(sec==="banners") {
    window._cmsBannersView();
  }
};

// ————————————————————— CMS FILES MANAGER —————————————————————
window._cmsFilesView = function(){
  var files = getCmsFiles();
  var _canUpload = _cmsHasPermission("upload");
  var _canDelFile = _cmsHasPermission("deleteFile");
  var rows = files.length ? files.map(function(f,i){
    var sizeStr = f.size ? (f.size < 1024 ? f.size+"B" : f.size < 1048576 ? Math.round(f.size/1024)+"KB" : Math.round(f.size/1048576)+"MB") : "—";
    var dateStr = f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString("zh-HK",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}) : "—";
    var byStr = f.uploadedBy || "—";
    return '<tr><td><span class="file-name">'+esc(f.name)+'</span>'+(f.desc?'<br/><span style="font-size:11px;color:var(--text-muted)">'+esc(f.desc)+'</span>':'')+'</td>'
      +'<td><span class="file-type">'+esc(f.type||"link")+'</span></td>'
      +'<td class="file-size">'+sizeStr+'</td>'
      +'<td style="font-size:12px;color:var(--text-muted)">'+dateStr+'<br/>'+esc(byStr)+'</td>'
      +'<td style="white-space:nowrap">'
      +'<button class="admin-btn secondary" style="font-size:11px;padding:4px 10px;margin-right:4px" onclick="window._cmsFileCopy('+i+')">Copy Link</button>'
      +(_canDelFile?'<button class="admin-btn danger" style="font-size:11px;padding:4px 10px" onclick="window._cmsFileDelete('+i+')">Delete</button>':'')
      +'</td></tr>';
  }).join("") : '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px">No files yet.'+(  _canUpload?' Upload a file or add a URL below.':' Contact an admin to upload files.')+'</td></tr>';

  document.getElementById("cmsEditor").innerHTML =
    '<div class="cms-panel">'
    +'<h3 style="font-size:20px;font-weight:700;margin-bottom:6px">Downloads Manager</h3>'
    +'<p style="color:var(--text-muted);font-size:13px;margin-bottom:20px">Upload files (stored in browser) or add external links. Copy the HTML snippet to paste into any page body.</p>'
    +(_canUpload ? '<div class="cms-upload-zone" id="cmsDropZone">' : '<div style="display:none">')
    +'<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:8px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
    +'<p><strong>Drag &amp; drop</strong> PDF, DOC, DOCX, JPG or PNG files here</p>'
    +'<p style="font-size:12px;color:var(--text-muted)">or click to browse (max 2MB each)</p>'
    +'<input type="file" id="cmsFileInput" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style="display:none" onchange="window._cmsFileUpload(event)"/>'
    +'<button class="admin-btn primary" onclick="window._cmsChooseFile()" style="margin-top:8px">Choose File</button>'
    +'</div>'
    +(_canUpload ? '<div class="cms-add-url-row">' : '<div style="display:none">')
    +'<input type="text" id="cmsUrlName" placeholder="Link title (e.g. Account Opening Form)"/>'
    +'<input type="url" id="cmsUrlHref" placeholder="External URL (https://...)"/>'
    +'<button class="admin-btn secondary" onclick="window._cmsAddUrl()">Add URL</button>'
    +'</div>'
    +(_canUpload ? '' : '</div>')
    +(   _canUpload ? '' : '<div style="background:#fef9c3;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;font-size:13px;margin-bottom:12px">View only — editor or admin access needed to upload or delete files.</div>')
    +'<table class="cms-files-table"><thead><tr><th>Name / Description</th><th>Type</th><th>Size</th><th>Uploaded</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table>'
    +'</div>';
  setTimeout(function(){ window._cmsInitDragDrop(); },50);
};

window._cmsChooseFile = function(){ document.getElementById('cmsFileInput').click(); };
window._cmsInitDragDrop = function(){
  var zone = document.getElementById('cmsDropZone');
  if(!zone) return;
  zone.addEventListener('click', function(e){ if(e.target===zone||e.target.tagName==='P'||e.target.tagName==='svg'||e.target.tagName==='path'||e.target.tagName==='polyline'||e.target.tagName==='line') window._cmsChooseFile(); });
  zone.addEventListener('dragover', function(e){ e.preventDefault(); e.stopPropagation(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', function(e){ e.preventDefault(); e.stopPropagation(); zone.classList.remove('dragover'); });
  zone.addEventListener('drop', function(e){
    e.preventDefault(); e.stopPropagation(); zone.classList.remove('dragover');
    var files = e.dataTransfer.files;
    if(!files||!files.length) return;
    for(var i=0;i<files.length;i++) window._cmsProcessDroppedFile(files[i]);
  });
};
window._cmsProcessDroppedFile = function(file){
  var allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp'];
  var allowedExt = /\.(pdf|doc|docx|jpg|jpeg|png|webp)$/i;
  if(!allowed.includes(file.type) && !allowedExt.test(file.name)){ showToast('Only PDF, DOC, DOCX, JPG, PNG: '+file.name); return; }
  if(file.size > 2*1024*1024){ showToast('Too large (max 2MB): '+file.name); return; }
  var reader = new FileReader();
  reader.onload = function(ev){
    var files = getCmsFiles();
    files.push({id:'f'+Date.now()+Math.random().toString(36).substr(2,4), name:file.name, desc:'', type:file.type||'application/octet-stream', size:file.size, url:ev.target.result, isLocal:true, uploadedAt:new Date().toISOString(), uploadedBy:sessionStorage.getItem('ecap_admin_user')||'admin'});
    saveCmsFiles(files);
    showToast('Uploaded: '+file.name);
    window._cmsFilesView();
  };
  reader.readAsDataURL(file);
};
window._cmsFileUpload = function(e){
  var file = e.target.files[0];
  if(!file) return;
  var allowed = ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","image/jpeg","image/png","image/webp"];
  var allowedExt = /\.(pdf|doc|docx|jpg|jpeg|png|webp)$/i;
  if(!allowed.includes(file.type) && !allowedExt.test(file.name)){
    showToast("Only PDF, DOC, DOCX, JPG, PNG files are allowed"); e.target.value=""; return;
  }
  if(file.size > 2*1024*1024){ showToast("File too large (max 2MB)"); return; }
  var reader = new FileReader();
  reader.onload = function(ev){
    var files = getCmsFiles();
    files.push({id:"f"+Date.now(), name:file.name, desc:"", type:file.type||"application/octet-stream", size:file.size, url:ev.target.result, isLocal:true, uploadedAt:new Date().toISOString(), uploadedBy:sessionStorage.getItem("ecap_admin_user")||"admin"});
    saveCmsFiles(files);
    showToast("Uploaded: "+file.name);
    window._cmsFilesView();
  };
  reader.readAsDataURL(file);
  e.target.value="";
};

window._cmsAddUrl = function(){
  var name = document.getElementById("cmsUrlName").value.trim();
  var url = document.getElementById("cmsUrlHref").value.trim();
  if(!name || !url){ showToast("Enter both name and URL"); return; }
  var files = getCmsFiles();
  files.push({id:"u"+Date.now(), name:name, desc:"", type:"external", size:0, url:url, isLocal:false, uploadedAt:new Date().toISOString(), uploadedBy:sessionStorage.getItem("ecap_admin_user")||"admin"});
  saveCmsFiles(files);
  showToast("Added: "+name);
  window._cmsFilesView();
};

window._cmsFileCopy = function(idx){
  var f = getCmsFiles()[idx];
  if(!f) return;
  var snippet = f.isLocal
    ? '<a href="'+f.url+'" download="'+f.name.replace(/"/g,"")+'">'+f.name+'</a>'
    : '<a href="'+f.url.replace(/"/g,"")+'" target="_blank" rel="noopener">'+f.name+'</a>';
  navigator.clipboard ? navigator.clipboard.writeText(snippet).then(function(){ showToast("Copied to clipboard!"); }) : showToast(snippet);
};

window._cmsFileDelete = function(idx){
  if(!confirm("Delete this file/link?")) return;
  var files = getCmsFiles();
  files.splice(idx,1);
  saveCmsFiles(files);
  window._cmsFilesView();
};

// ————————————————————— CMS USERS MANAGER —————————————————————
window._cmsUsersView = function(){
  var users = getCmsUsers();
  var cfg2fa = get2FAConfig();
  var currentUser = sessionStorage.getItem("ecap_admin_user") || "admin";
  var userRows = users.length ? users.map(function(u,i){
    var isMe = u.username===currentUser;
    var uRole = u.role||"admin";
    return '<div class="cms-user-row"><div class="u-avatar">'+esc(u.username[0].toUpperCase())+'</div>'
      +'<div class="u-name">'+esc(u.username)+'</div>'
      +'<span class="role-badge role-'+uRole+'">'+uRole+'</span>'
      +'<span style="font-size:10px;padding:2px 6px;border-radius:100px;'+(cfg2fa[u.username]?'background:#d1fae5;color:#059669':'background:#fee2e2;color:#dc2626')+'">'+(cfg2fa[u.username]?'2FA ON':'2FA OFF')+'</span>'
      +(isMe?'<span class="u-tag" style="margin-left:4px">You</span>':'')
      +'<div style="margin-left:auto;display:flex;gap:4px">'
      +(!isMe?'<button class="admin-btn secondary" style="font-size:11px;padding:4px 10px" onclick="window._cms2FASetup(\''+u.username+'\')">'+( cfg2fa[u.username]?'Disable 2FA':'Enable 2FA')+'</button>':'')
      +(!isMe?'<button class="admin-btn danger" style="font-size:12px;padding:5px 14px" onclick="window._cmsUserDelete('+i+')">Remove</button>':'')
      +'</div></div>';
  }).join("") : '<div style="color:var(--text-muted);font-size:13px;padding:8px 0">Using default admin account. Add users below to replace it.</div>';

  document.getElementById("cmsEditor").innerHTML =
    '<div class="cms-panel">'
    +'<h3 style="font-size:20px;font-weight:700;margin-bottom:20px">User Management</h3>'
    // Change Password
    +'<div class="cms-chpwd-box">'
    +'<h4>Change Password</h4>'
    +'<div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid rgba(0,0,0,.06)">'
    +'<button class="admin-btn '+(cfg2fa[currentUser]?'danger':'primary')+'" style="font-size:12px" onclick="window._cms2FASetup(sessionStorage.getItem(\'ecap_admin_user\')||\'admin\')">'+(cfg2fa[currentUser]?'Disable 2FA':'Setup 2FA')+'</button>'
    +'<span style="font-size:12px;color:var(--text-muted);margin-left:8px">'+(cfg2fa[currentUser]?'2FA is enabled for your account':'Enable two-factor authentication for extra security')+'</span>'
    +'</div>'
    +'<div class="admin-field"><label>Current Password</label><input type="password" id="pwdCurrent" placeholder="Current password"/></div>'
    +'<div class="admin-field"><label>New Password</label><input type="password" id="pwdNew" placeholder="New password (min 6 chars)"/></div>'
    +'<div class="admin-field"><label>Confirm New Password</label><input type="password" id="pwdConfirm" placeholder="Confirm new password"/></div>'
    +'<button class="admin-btn primary" onclick="window._cmsChangePassword()">Update Password</button>'
    +'<div id="pwdMsg" style="font-size:13px;margin-top:8px;min-height:20px"></div>'
    +'</div>'
    // Users list
    +'<h4 style="font-size:15px;font-weight:700;margin-bottom:12px">Admin Users ('+( users.length || 1 )+')</h4>'
    +'<div class="cms-users-list">'+userRows+'</div>'
    // Add new user
    +'<div class="cms-add-user-box">'
    +'<h4>Add New User</h4>'
    +'<div class="admin-field"><label>Username</label><input type="text" id="newUsername" placeholder="e.g. editor1"/></div>'
    +'<div class="admin-field"><label>Password</label><input type="password" id="newUserPass" placeholder="Min 6 characters"/></div>'
    +'<div class="admin-field"><label>Role</label><select id="newUserRole" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:inherit;background:var(--white)">'
    +'<option value="admin">Admin — Full access (pages, files, users, export)</option>'
    +'<option value="editor" selected>Editor — Edit pages &amp; uploads, no user management</option>'
    +'<option value="viewer">Viewer — Read-only, cannot save or upload</option>'
    +'</select></div>'
    +'<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:10px 12px;font-size:12px;color:#0369a1;margin-bottom:12px">'
    +'<strong>Admin</strong>: Full access including user management &amp; export/import.<br/>'
    +'<strong>Editor</strong>: Edit all pages &amp; manage downloads, no admin settings.<br/>'
    +'<strong>Viewer</strong>: Read-only access — review content without editing.</div>'
    +'<button class="admin-btn primary" onclick="window._cmsUserAdd()">Add User</button>'
    +'<div id="addUserMsg" style="font-size:13px;margin-top:8px;min-height:20px"></div>'
    +'</div>'
    +'</div>';
};

window._cmsChangePassword = function(){
  var cur = document.getElementById("pwdCurrent").value;
  var nw = document.getElementById("pwdNew").value;
  var cf = document.getElementById("pwdConfirm").value;
  var msg = document.getElementById("pwdMsg");
  if(nw.length < 6){ msg.style.color="#dc3545"; msg.textContent="New password must be at least 6 characters."; return; }
  if(nw !== cf){ msg.style.color="#dc3545"; msg.textContent="New passwords do not match."; return; }
  var currentUser = sessionStorage.getItem("ecap_admin_user") || "admin";
  checkAdminLogin(currentUser, cur).then(function(ok){
    if(!ok){ msg.style.color="#dc3545"; msg.textContent="Current password is incorrect."; return; }
    sha256hex(nw).then(function(hash){
      var users = getCmsUsers();
      if(users.length === 0){
        // Move from default to custom user list
        users = [{username:"admin", hash:hash}];
      } else {
        var found = false;
        users = users.map(function(u){ if(u.username===currentUser){found=true;return{username:u.username,hash:hash};}return u; });
        if(!found) users.push({username:currentUser,hash:hash});
      }
      saveCmsUsers(users);
      msg.style.color="#28a745"; msg.textContent="Password updated successfully.";
      document.getElementById("pwdCurrent").value="";
      document.getElementById("pwdNew").value="";
      document.getElementById("pwdConfirm").value="";
    });
  });
};

window._cmsUserAdd = function(){
  var uname = document.getElementById("newUsername").value.trim();
  var pass = document.getElementById("newUserPass").value;
  var msg = document.getElementById("addUserMsg");
  if(!uname){ msg.style.color="#dc3545"; msg.textContent="Enter a username."; return; }
  if(pass.length < 6){ msg.style.color="#dc3545"; msg.textContent="Password must be at least 6 characters."; return; }
  var users = getCmsUsers();
  if(users.some(function(u){return u.username===uname;})){ msg.style.color="#dc3545"; msg.textContent="Username already exists."; return; }
  var roleEl = document.getElementById("newUserRole");
  var role = roleEl ? roleEl.value : "editor";
  sha256hex(pass).then(function(hash){
    users.push({username:uname, hash:hash, role:role});
    saveCmsUsers(users);
    msg.style.color="#28a745"; msg.textContent="User '"+uname+"' added as "+role+".";
    document.getElementById("newUsername").value="";
    document.getElementById("newUserPass").value="";
    window._cmsUsersView();
  });
};
// ————————— 2FA Management —————————
window._cms2FASetup = function(username){
  var cfg = get2FAConfig();
  if(cfg[username]){
    if(!confirm('2FA is already enabled for '+username+'. Disable it?')) return;
    delete cfg[username];
    save2FAConfig(cfg);
    showToast('2FA disabled for '+username);
    window._cmsUsersView();
    return;
  }
  var secret = generateSecret();
  var issuer = 'e-Capital CMS';
  var otpUrl = 'otpauth://totp/'+encodeURIComponent(issuer+':'+username)+'?secret='+secret+'&issuer='+encodeURIComponent(issuer);
  var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(otpUrl);
  var div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center';
  div.innerHTML = '<div style="background:var(--white);border-radius:12px;padding:32px;max-width:400px;width:90%;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.2)">'
    +'<h3 style="margin:0 0 8px;font-size:18px">Setup 2FA for '+esc(username)+'</h3>'
    +'<p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Scan this QR code with Google Authenticator, Authy, or any TOTP app.</p>'
    +'<img src="'+qrUrl+'" alt="QR" style="width:200px;height:200px;border:1px solid var(--border);border-radius:8px;margin-bottom:12px"/>'
    +'<div style="font-family:monospace;font-size:14px;letter-spacing:2px;background:var(--bg-box);padding:8px 12px;border-radius:6px;margin-bottom:16px;word-break:break-all">'+secret+'</div>'
    +'<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Enter a code from the app to verify setup:</p>'
    +'<input type="text" id="verify2FA" maxlength="6" placeholder="000000" style="width:120px;text-align:center;font-size:20px;letter-spacing:6px;padding:8px;border:1.5px solid var(--border);border-radius:8px;margin-bottom:12px" inputmode="numeric"/>'
    +'<div style="display:flex;gap:8px;justify-content:center">'
    +'<button class="admin-btn primary" id="verify2FABtn" style="min-width:100px">Verify &amp; Enable</button>'
    +'<button class="admin-btn secondary" id="cancel2FABtn">Cancel</button>'
    +'</div>'
    +'<div id="verify2FAErr" style="font-size:12px;color:#dc2626;margin-top:8px"></div>'
    +'</div>';
  document.body.appendChild(div);
  document.getElementById('verify2FA').focus();
  document.getElementById('cancel2FABtn').addEventListener('click', function(){ div.remove(); });
  div.addEventListener('click', function(e){ if(e.target===div) div.remove(); });
  document.getElementById('verify2FABtn').addEventListener('click', function(){
    var code = document.getElementById('verify2FA').value.replace(/\s/g,'');
    if(code.length!==6){document.getElementById('verify2FAErr').textContent='Enter 6-digit code';return;}
    verifyTOTP(secret, code).then(function(ok){
      if(ok){
        var c=get2FAConfig();
        c[username]=secret;
        save2FAConfig(c);
        showToast('2FA enabled for '+username);
        div.remove();
        window._cmsUsersView();
      } else {
        document.getElementById('verify2FAErr').textContent='Invalid code. Check your app and try again.';
      }
    });
  });
};


window._cmsUserDelete = function(idx){
  var users = getCmsUsers();
  var username = (users[idx]||{}).username;
  if(!username) return;
  if(!confirm("Remove user '"+username+"'?")) return;
  users.splice(idx,1);
  saveCmsUsers(users);
  showToast("Removed: "+username);
  window._cmsUsersView();
};


// ————————————————————— FILE PICKER FOR EDITOR —————————————————————
window._cmsShowFilePicker = function(btn){
  var existingPicker = document.getElementById('cmsFilePicker');
  if(existingPicker){ existingPicker.remove(); return; }
  var slug = btn.getAttribute('data-slug');
  var lang = btn.getAttribute('data-lang');
  var textareaId = 'cms_b_'+slug+'_'+lang;
  var files = getCmsFiles();

  var div = document.createElement('div');
  div.id = 'cmsFilePicker';
  div.className = 'cms-file-picker';

  var inner = '';
  if(files.length === 0){
    inner += '<div class="cfp-title">Insert Download Link</div>'
      +'<div class="cfp-empty">No files yet.<br/>Go to the <strong>Downloads</strong> tab to upload PDF/DOC files first.</div>';
  } else {
    inner += '<div class="cfp-title">Select file to insert</div>';
    files.forEach(function(f, i){
      var icon = f.type==='external'
        ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
        : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
      inner += '<div class="cfp-item" data-file-idx="'+i+'" data-ta-id="'+textareaId+'">'+icon+'<span>'+esc(f.name)+'</span></div>';
    });
  }
  inner += '<div class="cfp-close">Cancel</div>';
  div.innerHTML = inner;

  // Event delegation for item clicks
  div.addEventListener('click', function(e){
    var item = e.target.closest('.cfp-item');
    if(item){
      var idx = parseInt(item.getAttribute('data-file-idx'));
      var taId = item.getAttribute('data-ta-id');
      window._cmsInsertFile(taId, idx);
      div.remove();
      return;
    }
    if(e.target.closest('.cfp-close')){ div.remove(); return; }
  });

  // Position picker below the button
  var rect = btn.getBoundingClientRect();
  document.body.appendChild(div);
  var pw = div.offsetWidth;
  var left = Math.max(8, Math.min(rect.right - pw, window.innerWidth - pw - 8));
  div.style.top = (rect.bottom + window.scrollY + 6)+'px';
  div.style.left = left+'px';

  // Close on outside click
  setTimeout(function(){
    function outsideClick(e){ if(!div.contains(e.target) && e.target!==btn){ div.remove(); document.removeEventListener('click', outsideClick); } }
    document.addEventListener('click', outsideClick);
  }, 10);
};

window._cmsInsertFile = function(textareaId, idx){
  var f = getCmsFiles()[idx];
  if(!f) return;
  var snippet = f.isLocal
    ? '<a href="'+f.url+'" download="'+f.name.replace(/"/g,'&quot;')+'">'+f.name+'</a>'
    : '<a href="'+f.url+'" target="_blank" rel="noopener">'+f.name+'</a>';
  var ta = document.getElementById(textareaId);
  if(!ta){ showToast('Textarea not found'); return; }
  var s = ta.selectionStart, en = ta.selectionEnd;
  ta.value = ta.value.substring(0,s) + snippet + ta.value.substring(en);
  ta.selectionStart = ta.selectionEnd = s + snippet.length;
  ta.focus();
  showToast('Inserted: '+f.name);
};


// ————————————————————— EDITOR TOOLBAR —————————————————————
function _cmsBuildToolbar(taId){
  var btns = [
    {a:'bold',   t:'Bold',          l:'<b>B</b>'},
    {a:'italic', t:'Italic',        l:'<i>I</i>'},
    {a:'under',  t:'Underline',     l:'<u>U</u>'},
    {a:'sep'},
    {a:'h2',     t:'Heading 2',     l:'H2'},
    {a:'h3',     t:'Heading 3',     l:'H3'},
    {a:'sep'},
    {a:'link',   t:'Insert Link',   l:'&#128279;'},
    {a:'img',    t:'Insert Image',  l:'&#128247;'},
    {a:'sep'},
    {a:'ul',     t:'Bullet List',   l:'&#8226; List'},
    {a:'ol',     t:'Numbered List', l:'1. List'},
    {a:'table',  t:'Table',         l:'&#9638; Table'},
    {a:'sep'},
    {a:'br',     t:'Line Break',    l:'&#8629; BR'},
    {a:'hr',     t:'Divider Line',  l:'&#8212; HR'}
  ];
  var h = '<div class="cms-toolbar" data-ta="'+taId+'">';
  btns.forEach(function(b){
    if(b.a==='sep'){ h += '<span class="cms-tb-sep"></span>'; }
    else { h += '<button class="cms-tb-btn" data-a="'+b.a+'" title="'+b.t+'">'+b.l+'</button>'; }
  });
  return h + '</div>';
}

window._cmsToolbarAction = function(taId, action){
  var ta = document.getElementById(taId);
  if(!ta) return;
  var s = ta.selectionStart, e = ta.selectionEnd;
  var sel = ta.value.substring(s, e);
  var v = ta.value;
  function wrap(open, close){ var inner=sel||'text'; insert(open+inner+close, open.length, open.length+(sel?sel.length:4)); }
  function insert(text, selStart, selEnd){
    ta.value = v.substring(0,s)+text+v.substring(e);
    ta.selectionStart = s+(selStart||text.length);
    ta.selectionEnd   = s+(selEnd!==undefined?selEnd:text.length);
    ta.focus();
    ta.dispatchEvent(new Event('input'));
  }
  switch(action){
    case 'bold':  wrap('<strong>','</strong>'); break;
    case 'italic':wrap('<em>','</em>'); break;
    case 'under': wrap('<u>','</u>'); break;
    case 'h2':    wrap('\n<h2>','</h2>\n'); break;
    case 'h3':    wrap('\n<h3>','</h3>\n'); break;
    case 'link':
      var url=prompt('Link URL (e.g. https://example.com):','https://');
      if(url) wrap('<a href="'+url+'">','</a>');
      break;
    case 'img':
      var src=prompt('Image URL:','https://');
      if(src){ var alt=prompt('Alt text (description)','Image')||''; insert('\n<img src="'+src+'" alt="'+alt+'" style="max-width:100%"/>\n'); }
      break;
    case 'ul':
      insert('\n<ul>\n<li>'+(sel||'Item 1')+'</li>\n<li>Item 2</li>\n</ul>\n');
      break;
    case 'ol':
      insert('\n<ol>\n<li>'+(sel||'Item 1')+'</li>\n<li>Item 2</li>\n</ol>\n');
      break;
    case 'table':
      insert('\n<table>\n<tr><th>Header 1</th><th>Header 2</th></tr>\n<tr><td>'+(sel||'Data')+'</td><td>Data</td></tr>\n</table>\n');
      break;
    case 'br':  insert('<br/>\n'); break;
    case 'hr':  insert('\n<hr/>\n'); break;
  }
};

// ————————————————————— CMS BANNERS MANAGER —————————————————————
window._cmsBannersView = function(){
  var banners = getCmsBanners();
  var _canUpload = _cmsHasPermission("upload");
  var rows = banners.length ? banners.map(function(b,i){
    return '<div class="cms-banner-item" style="display:flex;gap:12px;align-items:center;padding:12px;border:1px solid var(--border-light);border-radius:8px;margin-bottom:8px;background:var(--white)">'
      +'<img src="'+escAttr(b.img)+'" style="width:120px;height:60px;object-fit:cover;border-radius:6px;flex-shrink:0;background:#f3f4f6"/>'
      +'<div style="flex:1;min-width:0">'
      +'<div style="font-weight:600;font-size:14px">'+esc(b.alt||'Banner '+(i+1))+'</div>'
      +'<div style="font-size:11px;color:var(--text-muted);margin-top:2px">'+esc(b.link||'No link')+'</div>'
      +'</div>'
      +'<div style="display:flex;gap:4px;flex-shrink:0">'
      +(i>0?'<button class="admin-btn secondary" style="font-size:11px;padding:4px 8px" onclick="window._cmsBannerMove('+i+',-1)">&uarr;</button>':'')
      +(i<banners.length-1?'<button class="admin-btn secondary" style="font-size:11px;padding:4px 8px" onclick="window._cmsBannerMove('+i+',1)">&darr;</button>':'')
      +(_canUpload?'<button class="admin-btn danger" style="font-size:11px;padding:4px 8px" onclick="window._cmsBannerDelete('+i+')">Delete</button>':'')
      +'</div></div>';
  }).join("") : '<div style="color:var(--text-muted);font-size:13px;padding:12px 0">No custom banners. Using default banner images. Add banners below to customize the homepage carousel.</div>';

  document.getElementById("cmsEditor").innerHTML =
    '<div class="cms-panel">'
    +'<h3 style="font-size:20px;font-weight:700;margin-bottom:6px">Banner Management</h3>'
    +'<p style="color:var(--text-muted);font-size:13px;margin-bottom:20px">Upload JPG/PNG images for the homepage carousel. Recommended size: 1200×500px. Max 5MB each.</p>'
    +'<div class="cms-banners-list" id="cmsBannersList">' + rows + '</div>'
    +(_canUpload ?
      '<div style="border:2px dashed var(--border);border-radius:12px;padding:24px;text-align:center;margin-top:16px;cursor:pointer;transition:all .2s" id="cmsBannerDropZone">'
      +'<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:8px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
      +'<p><strong>Drag &amp; drop</strong> JPG or PNG images here</p>'
      +'<p style="font-size:12px;color:var(--text-muted)">or click to browse (max 5MB each)</p>'
      +'<input type="file" id="cmsBannerInput" accept=".jpg,.jpeg,.png,.webp" style="display:none" onchange="window._cmsBannerUpload(event)" multiple/>'
      +'<button class="admin-btn primary" onclick="document.getElementById(\'cmsBannerInput\').click()" style="margin-top:8px">Choose Image</button>'
      +'</div>'
      +'<div style="display:flex;gap:8px;align-items:end;margin-top:16px">'
      +'<div class="admin-field" style="flex:1;margin:0"><label>Or paste image URL</label><input type="url" id="cmsBannerUrl" placeholder="https://..."/></div>'
      +'<div class="admin-field" style="flex:1;margin:0"><label>Alt text / Title</label><input type="text" id="cmsBannerAlt" placeholder="Banner description"/></div>'
      +'<div class="admin-field" style="flex:1;margin:0"><label>Link (optional)</label><input type="text" id="cmsBannerLink" placeholder="#/page/slug or https://..."/></div>'
      +'<button class="admin-btn primary" onclick="window._cmsBannerAddUrl()" style="height:44px;white-space:nowrap">Add Banner</button>'
      +'</div>'
    : '<div style="background:#fef9c3;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;font-size:13px;margin-top:12px">View only — editor or admin access needed to manage banners.</div>')
    +'</div>';
  setTimeout(function(){ window._cmsBannerInitDrop(); },50);
};

window._cmsBannerInitDrop = function(){
  var zone = document.getElementById('cmsBannerDropZone');
  if(!zone) return;
  zone.addEventListener('click', function(e){ if(e.target===zone||e.target.tagName==='P'||e.target.tagName==='svg'||e.target.tagName==='path'||e.target.tagName==='polyline'||e.target.tagName==='line') document.getElementById('cmsBannerInput').click(); });
  zone.addEventListener('dragover', function(e){ e.preventDefault(); e.stopPropagation(); zone.style.borderColor='var(--brand)'; zone.style.background='rgba(180,21,64,.04)'; });
  zone.addEventListener('dragleave', function(e){ e.preventDefault(); e.stopPropagation(); zone.style.borderColor=''; zone.style.background=''; });
  zone.addEventListener('drop', function(e){
    e.preventDefault(); e.stopPropagation(); zone.style.borderColor=''; zone.style.background='';
    var files = e.dataTransfer.files;
    if(!files||!files.length) return;
    for(var i=0;i<files.length;i++) window._cmsBannerProcessFile(files[i]);
  });
};

window._cmsBannerProcessFile = function(file){
  var allowedTypes = ['image/jpeg','image/png','image/webp'];
  var allowedExt = /\.(jpg|jpeg|png|webp)$/i;
  if(!allowedTypes.includes(file.type) && !allowedExt.test(file.name)){ showToast('Only JPG, PNG, WebP: '+file.name); return; }
  if(file.size > 5*1024*1024){ showToast('Too large (max 5MB): '+file.name); return; }
  var reader = new FileReader();
  reader.onload = function(ev){
    var banners = getCmsBanners();
    banners.push({ img:ev.target.result, alt:file.name.replace(/\.[^.]+$/,''), link:'', isLocal:true });
    saveCmsBanners(banners);
    showToast('Added banner: '+file.name);
    window._cmsBannersView();
  };
  reader.readAsDataURL(file);
};

window._cmsBannerUpload = function(e){
  var files = e.target.files;
  if(!files) return;
  for(var i=0;i<files.length;i++) window._cmsBannerProcessFile(files[i]);
  e.target.value="";
};

window._cmsBannerAddUrl = function(){
  var url = document.getElementById('cmsBannerUrl').value.trim();
  var alt = document.getElementById('cmsBannerAlt').value.trim();
  var link = document.getElementById('cmsBannerLink').value.trim();
  if(!url){ showToast('Enter an image URL'); return; }
  var banners = getCmsBanners();
  banners.push({ img:url, alt:alt||'Banner', link:link, isLocal:false });
  saveCmsBanners(banners);
  showToast('Added banner');
  window._cmsBannersView();
};

window._cmsBannerDelete = function(idx){
  if(!confirm('Delete this banner?')) return;
  var banners = getCmsBanners();
  banners.splice(idx,1);
  saveCmsBanners(banners);
  window._cmsBannersView();
};

window._cmsBannerMove = function(idx, dir){
  var banners = getCmsBanners();
  var newIdx = idx + dir;
  if(newIdx < 0 || newIdx >= banners.length) return;
  var tmp = banners[idx];
  banners[idx] = banners[newIdx];
  banners[newIdx] = tmp;
  saveCmsBanners(banners);
  window._cmsBannersView();
};

// CMS initialization
_adminCurrentUser = sessionStorage.getItem("ecap_admin_user");
