// ============================================
// CMS MODULE — Auth, 2FA, RBAC, Editor, Files, Users
// ============================================

// ————— CMS i18n —————
var CMS_I18N = {
  // Login
  cms_admin:       {en:'CMS Admin', hans:'CMS 管理', hant:'CMS 管理'},
  login_sub:       {en:'Please login to manage website content', hans:'请登录以管理网站内容', hant:'請登入以管理網站內容'},
  username:        {en:'Username', hans:'用户名', hant:'用戶名'},
  password:        {en:'Password', hans:'密码', hant:'密碼'},
  enter_pwd:       {en:'Enter password', hans:'请输入密码', hant:'請輸入密碼'},
  login:           {en:'Login', hans:'登录', hant:'登入'},
  verifying:       {en:'Verifying...', hans:'验证中...', hant:'驗證中...'},
  logout:          {en:'Logout', hans:'登出', hant:'登出'},
  // 2FA
  twofa_code:      {en:'2FA Code', hans:'双重验证码', hant:'雙重驗證碼'},
  six_digit:       {en:'6-digit code', hans:'6位数字', hant:'6位數字'},
  verify_2fa:      {en:'Verify 2FA', hans:'验证 2FA', hant:'驗證 2FA'},
  enter_2fa:       {en:'Enter your 2FA code from authenticator app.', hans:'请输入验证器应用中的验证码。', hant:'請輸入驗證器應用中的驗證碼。'},
  invalid_2fa:     {en:'Invalid 2FA code. Try again.', hans:'验证码错误，请重试。', hant:'驗證碼錯誤，請重試。'},
  // Login errors
  too_many:        {en:'Too many failed attempts. Try again in ', hans:'登录尝试次数过多，请于 ', hant:'登入嘗試次數過多，請於 '},
  minutes:         {en:' minutes.', hans:' 分钟后重试。', hant:' 分鐘後重試。'},
  ip_denied:       {en:'Access denied. Your IP is not in the whitelist.', hans:'拒绝访问。您的IP不在白名单中。', hant:'拒絕存取。您的IP不在白名單中。'},
  acct_disabled:   {en:'Account disabled. Contact admin.', hans:'帐户已停用，请联系管理员。', hant:'帳戶已停用，請聯絡管理員。'},
  wrong_pwd:       {en:'Incorrect username or password.', hans:'用户名或密码错误。', hant:'用戶名或密碼錯誤。'},
  attempts_left:   {en:' attempts remaining.', hans:' 次尝试剩余。', hant:' 次嘗試剩餘。'},
  session_expired: {en:'Session expired. Please login again.', hans:'会话已过期，请重新登录。', hant:'工作階段已過期，請重新登入。'},
  // CMS header
  cms_title:       {en:'Content Management System', hans:'内容管理系统', hant:'內容管理系統'},
  // Section tabs
  tab_pages:       {en:'Pages', hans:'页面内容', hant:'頁面內容'},
  tab_banners:     {en:'Banners', hans:'首页横幅', hant:'首頁橫幅'},
  tab_blog:        {en:'News', hans:'新闻文章', hant:'新聞文章'},
  tab_files:       {en:'Downloads', hans:'档案下载', hant:'檔案下載'},
  tab_account:     {en:'My Account', hans:'我的帐户', hant:'我的帳戶'},
  tab_users:       {en:'Users', hans:'用户管理', hant:'用戶管理'},
  tab_security:    {en:'Security', hans:'安全设定', hant:'安全設定'},
  // Sidebar
  sidebar_title:   {en:'Website Pages', hans:'网站页面', hant:'網站頁面'},
  sidebar_count:   {en:' pages', hans:' 个页面', hant:' 個頁面'},
  search_pages:    {en:'Search pages...', hans:'搜索页面...', hant:'搜尋頁面...'},
  select_page:     {en:'Select a page from the sidebar to start editing', hans:'从左侧选择页面开始编辑', hant:'從左側選擇頁面開始編輯'},
  // Page editor
  title_label:     {en:'Title', hans:'标题', hant:'標題'},
  body_label:      {en:'Body (HTML)', hans:'正文 (HTML)', hant:'正文 (HTML)'},
  insert_dl:       {en:'Insert Download Link', hans:'插入下载链接', hant:'插入下載連結'},
  read_only:       {en:'Read-only', hans:'只读', hant:'唯讀'},
  save_changes:    {en:'Save Changes', hans:'保存修改', hant:'儲存變更'},
  view_page:       {en:'View Page', hans:'查看页面', hant:'查看頁面'},
  viewer_nosave:   {en:'Viewer mode — cannot save', hans:'查看模式 — 无法保存', hant:'查看模式 — 無法儲存'},
  preview:         {en:'Preview', hans:'预览', hant:'預覽'},
  saved:           {en:'Saved: ', hans:'已保存: ', hant:'已儲存: '},
  // Export/Import/Reset
  exported:        {en:'Exported JSON (pages+banners+blog+files)', hans:'已导出JSON（页面+横幅+文章+文件）', hant:'已匯出JSON（頁面+橫幅+文章+檔案）'},
  imported:        {en:'Imported successfully', hans:'导入成功', hant:'匯入成功'},
  invalid_json:    {en:'Invalid JSON file', hans:'无效的JSON文件', hant:'無效的JSON檔案'},
  reset_confirm:   {en:'Reset all CMS edits to default?', hans:'重置所有CMS编辑为默认？', hant:'重設所有CMS編輯為預設？'},
  reset_done:      {en:'Reset to defaults', hans:'已重置为默认', hant:'已重設為預設'},
  // Files
  files_title:     {en:'Downloads Manager', hans:'档案管理', hant:'檔案管理'},
  files_desc:      {en:'Upload files or add external links. Copy the HTML snippet to paste into any page body.', hans:'上传文件或添加外部链接。复制HTML代码片段可粘贴到任何页面中。', hant:'上傳檔案或添加外部連結。複製HTML程式碼可貼到任何頁面中。'},
  drag_drop:       {en:'Drag & drop', hans:'拖放', hant:'拖放'},
  files_here:      {en:' PDF, DOC, DOCX, JPG or PNG files here', hans:' PDF、DOC、DOCX、JPG 或 PNG 文件到此处', hant:' PDF、DOC、DOCX、JPG 或 PNG 檔案到此處'},
  or_browse:       {en:'or click to browse (max 2MB each)', hans:'或点击浏览（每个最大2MB）', hant:'或點擊瀏覽（每個最大2MB）'},
  choose_file:     {en:'Choose File', hans:'选择文件', hant:'選擇檔案'},
  link_title:      {en:'Link title (e.g. Account Opening Form)', hans:'链接标题（如：开户表格）', hant:'連結標題（如：開戶表格）'},
  ext_url:         {en:'External URL (https://...)', hans:'外部网址 (https://...)', hant:'外部網址 (https://...)'},
  add_url:         {en:'Add URL', hans:'添加网址', hant:'新增網址'},
  copy_link:       {en:'Copy Link', hans:'复制链接', hant:'複製連結'},
  delete:          {en:'Delete', hans:'删除', hant:'刪除'},
  no_files:        {en:'No files yet.', hans:'暂无文件。', hant:'暫無檔案。'},
  upload_hint:     {en:' Upload a file or add a URL below.', hans:' 上传文件或在下方添加网址。', hant:' 上傳檔案或在下方新增網址。'},
  viewer_hint:     {en:' Contact an admin to upload files.', hans:' 请联系管理员上传文件。', hant:' 請聯絡管理員上傳檔案。'},
  view_only:       {en:'View only — editor or admin access needed.', hans:'仅查看 — 需要编辑或管理员权限。', hant:'僅檢視 — 需要編輯或管理員權限。'},
  name_desc:       {en:'Name / Description', hans:'名称 / 描述', hant:'名稱 / 描述'},
  type:            {en:'Type', hans:'类型', hant:'類型'},
  size:            {en:'Size', hans:'大小', hant:'大小'},
  uploaded:        {en:'Uploaded', hans:'上传时间', hant:'上傳時間'},
  actions:         {en:'Actions', hans:'操作', hant:'操作'},
  copied:          {en:'Copied to clipboard!', hans:'已复制到剪贴板！', hant:'已複製到剪貼簿！'},
  del_file_q:      {en:'Delete this file/link?', hans:'删除此文件/链接？', hant:'刪除此檔案/連結？'},
  enter_both:      {en:'Enter both name and URL', hans:'请输入名称和网址', hant:'請輸入名稱和網址'},
  // Banners
  banners_title:   {en:'Banner Management', hans:'横幅管理', hant:'橫幅管理'},
  banners_desc:    {en:'Upload JPG/PNG images for the homepage carousel. Recommended size: <strong>1200&times;500px</strong>. Max 5MB each.', hans:'上传首页轮播的JPG/PNG图片。建议尺寸：<strong>1200&times;500px</strong>。每张最大5MB。', hant:'上傳首頁輪播的JPG/PNG圖片。建議尺寸：<strong>1200&times;500px</strong>。每張最大5MB。'},
  preview_carousel:{en:'Preview Carousel', hans:'预览轮播', hant:'預覽輪播'},
  drag_img:        {en:' JPG or PNG images here', hans:' JPG 或 PNG 图片到此处', hant:' JPG 或 PNG 圖片到此處'},
  or_browse_5:     {en:'or click to browse (max 5MB each)', hans:'或点击浏览（每张最大5MB）', hant:'或點擊瀏覽（每張最大5MB）'},
  choose_img:      {en:'Choose Image', hans:'选择图片', hant:'選擇圖片'},
  paste_url:       {en:'Or paste image URL', hans:'或粘贴图片网址', hant:'或貼上圖片網址'},
  alt_title:       {en:'Alt text / Title', hans:'替代文字 / 标题', hant:'替代文字 / 標題'},
  banner_desc:     {en:'Banner description', hans:'横幅描述', hant:'橫幅描述'},
  link_opt:        {en:'Link (optional)', hans:'链接（可选）', hant:'連結（可選）'},
  add:             {en:'Add', hans:'添加', hant:'新增'},
  no_banner:       {en:'No custom banners. Using default banner images.', hans:'暂无自定义横幅。使用默认横幅图片。', hant:'暫無自訂橫幅。使用預設橫幅圖片。'},
  no_link:         {en:'No link', hans:'无链接', hant:'無連結'},
  del_banner_q:    {en:'Delete this banner?', hans:'删除此横幅？', hant:'刪除此橫幅？'},
  // Blog
  blog_title:      {en:'Blog / News Articles', hans:'新闻文章', hant:'新聞文章'},
  blog_desc:       {en:'Manage articles shown on the <strong>Hong Kong News</strong> page.', hans:'管理<strong>香港新闻</strong>页面上显示的文章。', hant:'管理<strong>香港新聞</strong>頁面上顯示的文章。'},
  blog_img_hint:   {en:'Card images: <strong>800&times;600px</strong> (4:3). Hero images: <strong>1200&times;525px</strong> (16:7). Images are auto-resized on upload.', hans:'卡片图片: <strong>800&times;600px</strong> (4:3)。大图: <strong>1200&times;525px</strong> (16:7)。上传时自动调整大小。', hant:'卡片圖片: <strong>800&times;600px</strong> (4:3)。大圖: <strong>1200&times;525px</strong> (16:7)。上傳時自動調整大小。'},
  new_article:     {en:'+ New Article', hans:'+ 新增文章', hant:'+ 新增文章'},
  edit_article:    {en:'Edit Article', hans:'编辑文章', hant:'編輯文章'},
  new_article_h:   {en:'New Article', hans:'新增文章', hant:'新增文章'},
  back:            {en:'Back', hans:'返回', hant:'返回'},
  slug_url:        {en:'Slug (URL)', hans:'Slug (网址)', hant:'Slug (網址)'},
  date:            {en:'Date', hans:'日期', hant:'日期'},
  image:           {en:'Image', hans:'图片', hant:'圖片'},
  upload:          {en:'Upload', hans:'上传', hant:'上傳'},
  auto_resize:     {en:'Auto-resized to <strong>1200&times;525px</strong> on upload. Max 5MB.', hans:'上传时自动调整为 <strong>1200&times;525px</strong>。最大5MB。', hant:'上傳時自動調整為 <strong>1200&times;525px</strong>。最大5MB。'},
  save_article:    {en:'Save Article', hans:'保存文章', hant:'儲存文章'},
  cancel:          {en:'Cancel', hans:'取消', hant:'取消'},
  edit:            {en:'Edit', hans:'编辑', hant:'編輯'},
  del_short:       {en:'Del', hans:'删', hant:'刪'},
  no_articles:     {en:'No blog articles yet.', hans:'暂无文章。', hant:'暫無文章。'},
  article_saved:   {en:'Article saved', hans:'文章已保存', hant:'文章已儲存'},
  del_article_q:   {en:'Delete this article?', hans:'删除此文章？', hant:'刪除此文章？'},
  article_deleted: {en:'Article deleted', hans:'文章已删除', hant:'文章已刪除'},
  // My Account
  my_account:      {en:'My Account', hans:'我的帐户', hant:'我的帳戶'},
  change_pwd:      {en:'Change Password', hans:'修改密码', hant:'修改密碼'},
  current_pwd:     {en:'Current Password', hans:'当前密码', hant:'目前密碼'},
  new_pwd:         {en:'New Password', hans:'新密码', hant:'新密碼'},
  confirm_pwd:     {en:'Confirm New Password', hans:'确认新密码', hant:'確認新密碼'},
  update_pwd:      {en:'Update Password', hans:'更新密码', hant:'更新密碼'},
  twofa_title:     {en:'Two-Factor Authentication', hans:'双重身份验证', hant:'雙重身份驗證'},
  twofa_on:        {en:'2FA Enabled', hans:'2FA 已启用', hant:'2FA 已啟用'},
  twofa_off:       {en:'2FA Disabled', hans:'2FA 已停用', hant:'2FA 已停用'},
  twofa_on_desc:   {en:'Two-factor authentication is active. You will need your authenticator app to login.', hans:'双重身份验证已激活。登录时需要验证器应用。', hant:'雙重身份驗證已啟用。登入時需要驗證器應用程式。'},
  twofa_off_desc:  {en:'Enable 2FA for extra security. You will need an authenticator app like Google Authenticator.', hans:'启用2FA以增强安全性。您需要Google Authenticator等验证器应用。', hant:'啟用2FA以增強安全性。您需要Google Authenticator等驗證器應用程式。'},
  disable_2fa:     {en:'Disable 2FA', hans:'停用 2FA', hant:'停用 2FA'},
  setup_2fa:       {en:'Setup 2FA', hans:'设置 2FA', hant:'設定 2FA'},
  // User Management
  user_mgmt:       {en:'User Management', hans:'用户管理', hant:'用戶管理'},
  users_total:     {en:' users total', hans:' 个用户', hant:' 個用戶'},
  add_new_user:    {en:'Add New User', hans:'新增用户', hant:'新增用戶'},
  role:            {en:'Role', hans:'角色', hant:'角色'},
  add_user:        {en:'Add User', hans:'新增用户', hant:'新增用戶'},
  you:             {en:'You', hans:'你', hant:'你'},
  disabled_label:  {en:'(Disabled)', hans:'（已停用）', hant:'（已停用）'},
  enable:          {en:'Enable', hans:'启用', hant:'啟用'},
  disable:         {en:'Disable', hans:'停用', hant:'停用'},
  remove:          {en:'Remove', hans:'移除', hant:'移除'},
  reset_2fa:       {en:'Reset 2FA', hans:'重置 2FA', hant:'重設 2FA'},
  // Security
  security_title:  {en:'Security Settings', hans:'安全设定', hant:'安全設定'},
  security_desc:   {en:'Manage IP restrictions, session timeout, and view audit log.', hans:'管理IP限制、会话超时和查看审计日志。', hant:'管理IP限制、工作階段逾時和檢視稽核日誌。'},
  security_overview:{en:'Security Overview', hans:'安全概况', hant:'安全概況'},
  ip_whitelist:    {en:'IP Whitelist', hans:'IP 白名单', hant:'IP 白名單'},
  session_timeout: {en:'Session Timeout', hans:'会话超时', hant:'工作階段逾時'},
  audit_log:       {en:'Login Audit Log', hans:'登录审计日志', hant:'登入稽核日誌'},
  clear_log:       {en:'Clear Log', hans:'清除日志', hant:'清除日誌'},
  clear_log_q:     {en:'Clear audit log?', hans:'清除审计日志？', hant:'清除稽核日誌？'},
  ip_addr:         {en:'IP Address', hans:'IP 地址', hant:'IP 地址'},
  label_opt:       {en:'Label (optional)', hans:'标签（可选）', hant:'標籤（可選）'},
  add_ip:          {en:'Add IP', hans:'添加IP', hant:'新增IP'},
  add_my_ip:       {en:'Add My Current IP', hans:'添加我当前的IP', hant:'新增我目前的IP'},
  timeout_min:     {en:'Timeout (minutes)', hans:'超时（分钟）', hant:'逾時（分鐘）'},
  save:            {en:'Save', hans:'保存', hant:'儲存'},
  no_log:          {en:'No log entries yet.', hans:'暂无日志。', hant:'暫無日誌。'},
  popup_blocked:   {en:'Pop-up blocked', hans:'弹窗被阻止', hant:'彈出視窗被阻擋'},
  select_first:    {en:'Select a page first', hans:'请先选择页面', hant:'請先選擇頁面'}
};
function CL(key){ var lang=window.currentLang||'zh-Hant'; var e=CMS_I18N[key]; if(!e) return key; if(lang==='en') return e.en; if(lang==='zh-Hans') return e.hans; return e.hant; }

var CMS_KEY = "ecap_cms_pages";
var CMS_FILES_KEY = "ecap_cms_files";
var CMS_USERS_KEY = "ecap_cms_users";
var CMS_BANNERS_KEY = "ecap_cms_banners";
var CMS_BLOG_KEY = "ecap_cms_blog";
var CMS_IP_KEY = "ecap_cms_ip_whitelist";
var CMS_AUDIT_KEY = "ecap_cms_audit_log";
var CMS_SESSION_TIMEOUT_KEY = "ecap_cms_session_timeout";
var _adminCurrentUser = null;
function getCmsFiles(){ try{var d=JSON.parse(localStorage.getItem(CMS_FILES_KEY));return d||[];}catch(e){return[];} }
function saveCmsFiles(d){ localStorage.setItem(CMS_FILES_KEY,JSON.stringify(d)); }
function getCmsUsers(){ try{var d=JSON.parse(localStorage.getItem(CMS_USERS_KEY));return d||[];}catch(e){return[];} }
function saveCmsUsers(d){ localStorage.setItem(CMS_USERS_KEY,JSON.stringify(d)); }
function getCmsBanners(){ try{var d=JSON.parse(localStorage.getItem(CMS_BANNERS_KEY));return d||[];}catch(e){return[];} }
function saveCmsBanners(d){ localStorage.setItem(CMS_BANNERS_KEY,JSON.stringify(d)); }
function getCmsBlog(){ try{var d=JSON.parse(localStorage.getItem(CMS_BLOG_KEY));return d||null;}catch(e){return null;} }
function saveCmsBlog(d){ localStorage.setItem(CMS_BLOG_KEY,JSON.stringify(d)); }
window.getCmsBlog = getCmsBlog;
window.saveCmsBlog = saveCmsBlog;
function getIpWhitelist(){ try{var d=JSON.parse(localStorage.getItem(CMS_IP_KEY));return d||[];}catch(e){return[];} }
function saveIpWhitelist(d){ localStorage.setItem(CMS_IP_KEY,JSON.stringify(d)); }
function getAuditLog(){ try{var d=JSON.parse(localStorage.getItem(CMS_AUDIT_KEY));return d||[];}catch(e){return[];} }
function addAuditLog(action, detail){
  var log = getAuditLog();
  log.unshift({time:new Date().toISOString(), user:sessionStorage.getItem('ecap_admin_user')||'unknown', action:action, detail:detail||''});
  if(log.length > 100) log = log.slice(0,100);
  localStorage.setItem(CMS_AUDIT_KEY, JSON.stringify(log));
}
function getSessionTimeout(){ return parseInt(localStorage.getItem(CMS_SESSION_TIMEOUT_KEY))||30; }
function saveSessionTimeout(m){ localStorage.setItem(CMS_SESSION_TIMEOUT_KEY, String(m)); }
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
      var found = users.find(function(u){ return u.username===username && u.hash===hash && u.enabled!==false; });
      if(found) return {username:found.username, role:found.role||"admin"};
      var disabled = users.find(function(u){ return u.username===username && u.hash===hash && u.enabled===false; });
      if(disabled) return {error:"disabled"};
      // Fallback: always allow default admin even when custom users exist
      if(username==="admin" && hash===ADMIN_HASH) return {username:"admin", role:"admin"};
      return null;
    }
    if(username==="admin" && hash===ADMIN_HASH) return {username:"admin", role:"admin"};
    return null;
  });
}

// ————— Rate Limiting —————
var CMS_LOCKOUT_KEY = "ecap_cms_lockout";
function getLoginAttempts(){
  try{ var d=JSON.parse(localStorage.getItem(CMS_LOCKOUT_KEY)); return d||{}; }catch(e){ return {}; }
}
function recordFailedLogin(username){
  var data = getLoginAttempts();
  if(!data[username]) data[username] = {count:0, firstAttempt:Date.now()};
  data[username].count++;
  data[username].lastAttempt = Date.now();
  localStorage.setItem(CMS_LOCKOUT_KEY, JSON.stringify(data));
}
function clearLoginAttempts(username){
  var data = getLoginAttempts();
  delete data[username];
  localStorage.setItem(CMS_LOCKOUT_KEY, JSON.stringify(data));
}
function isLockedOut(username){
  var data = getLoginAttempts();
  if(!data[username]) return false;
  var lockoutMinutes = 15;
  var maxAttempts = 5;
  if(data[username].count >= maxAttempts){
    var elapsed = Date.now() - data[username].lastAttempt;
    if(elapsed < lockoutMinutes * 60 * 1000){
      return Math.ceil((lockoutMinutes * 60 * 1000 - elapsed) / 60000);
    }
    // Lockout expired, clear
    clearLoginAttempts(username);
  }
  // Clear old attempts (older than lockout window)
  if(Date.now() - data[username].firstAttempt > lockoutMinutes * 60 * 1000){
    clearLoginAttempts(username);
  }
  return false;
}

// ————— Session Fingerprint —————
function getSessionFingerprint(){
  return navigator.userAgent + '|' + screen.width + 'x' + screen.height + '|' + (new Date().getTimezoneOffset());
}
function validateSessionFingerprint(){
  var stored = sessionStorage.getItem('ecap_session_fp');
  if(!stored) return true; // first check
  return stored === getSessionFingerprint();
}

// ————— Password Strength —————
function checkPasswordStrength(pass){
  var score = 0;
  if(pass.length >= 8) score++;
  if(pass.length >= 12) score++;
  if(/[a-z]/.test(pass)) score++;
  if(/[A-Z]/.test(pass)) score++;
  if(/[0-9]/.test(pass)) score++;
  if(/[^a-zA-Z0-9]/.test(pass)) score++;
  if(score <= 2) return {level:'weak', color:'#dc2626', label:'Weak'};
  if(score <= 4) return {level:'medium', color:'#f59e0b', label:'Medium'};
  return {level:'strong', color:'#059669', label:'Strong'};
}

// ————— Last Login Tracking —————
function recordLastLogin(username){
  var users = getCmsUsers();
  users.forEach(function(u){
    if(u.username === username) u.lastLogin = new Date().toISOString();
  });
  if(users.length) saveCmsUsers(users);
}
// IP whitelist check — fetches client IP and validates
function checkIpWhitelist(){
  var whitelist = getIpWhitelist();
  if(!whitelist.length) return Promise.resolve(true); // No whitelist = allow all
  return fetch('https://api.ipify.org?format=json').then(function(r){return r.json();}).then(function(d){
    var ip = d.ip;
    sessionStorage.setItem('ecap_client_ip', ip);
    return whitelist.some(function(item){return item.ip===ip && item.enabled!==false;});
  }).catch(function(){
    // If IP check fails, allow access (network issue)
    return true;
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
      +'<h2>'+CL('cms_admin')+'</h2>'
      +'<p class="login-sub">'+CL('login_sub')+'</p>'
      +'<form onsubmit="return window._adminLogin(event)">'
      +'<div class="login-field"><label>'+CL('username')+'</label><input type="text" id="adminUser" value="admin" autocomplete="username" oninput="var t=document.getElementById(\x27totpField\x27);if(t)t.style.display=get2FAConfig()[this.value.trim()]?\x27\x27:\x27none\x27"/></div>'
      +'<div class="login-field"><label>'+CL('password')+'</label><input type="password" id="adminPass" placeholder="'+CL('enter_pwd')+'" autocomplete="current-password"/></div>'
      +'<div class="login-field" id="totpField" style="display:none"><label>'+CL('twofa_code')+'</label><input type="text" id="adminTOTP" placeholder="'+CL('six_digit')+'" maxlength="6" autocomplete="one-time-code" inputmode="numeric" pattern="[0-9]*" style="letter-spacing:4px;font-size:18px;text-align:center"/></div>'
      +'<button type="submit" class="login-btn" id="loginBtn">'+CL('login')+'</button>'
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

  // Get display title for a page slug
  function _pageTitle(slug){
    var pg = SITE.pages[slug];
    if(!pg) return slug;
    var lang = window.currentLang || 'zh-Hant';
    if(pg[lang] && pg[lang].title) return pg[lang].title;
    if(pg['zh-Hant'] && pg['zh-Hant'].title) return pg['zh-Hant'].title;
    return slug;
  }

  return '<div class="cms-layout">'
    // Sidebar
    +'<aside class="cms-sidebar">'
    +'<div class="cms-sidebar-hdr"><h2><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:6px"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'+CL('sidebar_title')+'</h2><p>'+allPages.length+CL('sidebar_count')+'</p></div>'
    +'<div class="cms-search"><input type="text" id="cmsSearch" placeholder="'+CL('search_pages')+'" oninput="window._cmsFilter(this.value)"/></div>'
    +'<div class="cms-page-list" id="cmsPageList">'
    + allPages.map(function(slug){
        var edited = cms[slug] ? ' edited' : '';
        var title = _pageTitle(slug);
        return '<div class="cms-page-item'+edited+'" data-slug="'+esc(slug)+'" onclick="window._cmsEditPage(\''+slug+'\')">'
          +'<span class="page-dot"></span>'
          +'<div class="page-info"><span class="page-name">'+esc(title)+'</span>'
          +'<span class="page-slug">'+esc(slug)+'</span></div></div>';
      }).join('')
    +'</div></aside>'
    // Main
    +'<div class="cms-main">'
    // Compact header: logo text + user info only
    +'<div class="cms-main-header"><h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:6px"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>'+CL('cms_title')+'</h3>'
    +'<div class="cms-header-acts">'
    +'<div class="cms-lang-switch">'
    +'<button class="cms-lang-btn'+(window.currentLang==='zh-Hant'?' active':'')+'" onclick="window.setLang(\'zh-Hant\')">繁</button>'
    +'<button class="cms-lang-btn'+(window.currentLang==='zh-Hans'?' active':'')+'" onclick="window.setLang(\'zh-Hans\')">简</button>'
    +'<button class="cms-lang-btn'+(window.currentLang==='en'?' active':'')+'" onclick="window.setLang(\'en\')">EN</button>'
    +'</div>'
    +'<span class="role-badge role-'+_curRole+'" style="margin-left:4px">'+_curRole+'</span>'
    +'<button class="admin-btn secondary" onclick="window._adminLogout()" style="margin-left:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> '+CL('logout')+'</button>'
    +'</div></div>'
    // Section bar with tabs + tools on the right
    +'<div class="cms-section-bar">'
    +'<div class="cms-section-tabs">'
    +'<button class="cms-section-btn active" id="stab_pages" onclick="window._cmsSectionSwitch(\'pages\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> '+CL('tab_pages')+'</button>'
    +'<button class="cms-section-btn" id="stab_banners" onclick="window._cmsSectionSwitch(\'banners\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> '+CL('tab_banners')+'</button>'
    +'<button class="cms-section-btn" id="stab_blog" onclick="window._cmsSectionSwitch(\'blog\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> '+CL('tab_blog')+'</button>'
    +'<button class="cms-section-btn" id="stab_files" onclick="window._cmsSectionSwitch(\'files\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> '+CL('tab_files')+'</button>'
    +'<button class="cms-section-btn" id="stab_account" onclick="window._cmsSectionSwitch(\'account\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> '+CL('tab_account')+'</button>'
    +(_isAdmin?'<button class="cms-section-btn" id="stab_users" onclick="window._cmsSectionSwitch(\'users\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> '+CL('tab_users')+'</button>':'')
    +(_isAdmin?'<button class="cms-section-btn" id="stab_security" onclick="window._cmsSectionSwitch(\'security\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> '+CL('tab_security')+'</button>':'')
    +'</div>'
    // Tools on right side of section bar
    +(_isAdmin ? '<div class="cms-section-tools">'
    +'<button class="cms-tool-btn" onclick="window._cmsExport()" title="匯出"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>'
    +'<button class="cms-tool-btn" onclick="document.getElementById(\'cmsImportFile\').click()" title="匯入"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></button>'
    +'<input type="file" id="cmsImportFile" accept=".json" style="display:none" onchange="window._cmsImport(event)"/>'
    +'<button class="cms-tool-btn" onclick="window._cmsReset()" title="重設">&#x21BA;</button>'
    +'</div>' : '')
    +'</div>'
    +'<div class="cms-editor-area" id="cmsEditor">'
    +'<div class="cms-empty"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div><p>'+CL('select_page')+'</p></div>'
    +'</div></div></div>';
}
// Expose for router
window.adminView = adminView;

// ————————————————————— ADMIN AUTH —————————————————————
// Default password: "admin" — SHA-256 hash below
var ADMIN_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";
var ADMIN_SESSION_KEY = "ecap_admin_auth";

function isAdminLoggedIn(){
  if(sessionStorage.getItem(ADMIN_SESSION_KEY) !== "1") return false;
  // Validate session fingerprint
  if(!validateSessionFingerprint()){
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return false;
  }
  return true;
}
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
  btn.textContent = CL('verifying');

  // Check rate limiting
  var lockMins = isLockedOut(user);
  if(lockMins){
    addAuditLog('login_locked', 'User: '+user+', locked for '+lockMins+' min');
    errEl.textContent = CL('too_many')+lockMins+CL('minutes');
    errEl.style.color='';
    btn.disabled = false;
    btn.textContent = CL('login');
    return false;
  }

  // Check IP whitelist first
  checkIpWhitelist().then(function(ipOk){
    if(!ipOk){
      addAuditLog('login_blocked_ip', 'User: '+user+', IP: '+(sessionStorage.getItem('ecap_client_ip')||'unknown'));
      errEl.textContent = CL('ip_denied');
      errEl.style.color='';
      btn.disabled = false;
      btn.textContent = CL('login');
      return;
    }

    checkAdminLogin(user, pass).then(function(matched){
    if(matched && matched.error==='disabled'){
      addAuditLog('login_disabled', 'User: '+user);
      errEl.textContent = CL('acct_disabled');
      errEl.style.color='';
      btn.disabled = false;
      btn.textContent = CL('login');
      return;
    }
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
          errEl.textContent=CL('enter_2fa');
          errEl.style.color='var(--brand)';
          btn.disabled=false;
          btn.textContent=CL('verify_2fa');
          return;
        }
        var code = totpInput.value.replace(/\s/g,'');
        if(code.length!==6){errEl.textContent='Enter 6-digit code.';errEl.style.color='';btn.disabled=false;btn.textContent=CL('verify_2fa');return;}
        verifyTOTP(userSecret, code).then(function(valid){
          if(valid){
            sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
            sessionStorage.setItem('ecap_admin_user', matched.username||matched);
            sessionStorage.setItem('ecap_admin_role', matched.role||'admin');
            sessionStorage.setItem('ecap_admin_login_time', Date.now().toString());
            _adminCurrentUser = matched.username||matched;
            clearLoginAttempts(matched.username||user);
            recordLastLogin(matched.username||user);
            sessionStorage.setItem('ecap_session_fp', getSessionFingerprint());
            addAuditLog('login_success', 'User: '+(matched.username||user)+', 2FA: yes');
            _startSessionTimer();
            window.route();
          } else {
            addAuditLog('login_2fa_fail', 'User: '+(matched.username||user));
            errEl.textContent=CL('invalid_2fa');
            errEl.style.color='';
            btn.disabled=false;
            btn.textContent=CL('verify_2fa');
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
      sessionStorage.setItem('ecap_admin_login_time', Date.now().toString());
      _adminCurrentUser = matched.username||matched;
      clearLoginAttempts(matched.username||user);
      recordLastLogin(matched.username||user);
      sessionStorage.setItem('ecap_session_fp', getSessionFingerprint());
      addAuditLog('login_success', 'User: '+(matched.username||user)+', 2FA: no');
      _startSessionTimer();
      window.route();
    } else {
      recordFailedLogin(user);
      addAuditLog('login_fail', 'User: '+user);
      var attempts = getLoginAttempts();
      var remaining = 5 - ((attempts[user]||{}).count||0);
      errEl.textContent = CL('wrong_pwd') + (remaining <= 2 && remaining > 0 ? " "+remaining+CL('attempts_left') : "");
      errEl.style.color='';
      btn.disabled = false;
      btn.textContent = CL('login');
    }
  });
  });
  return false;
};

// Session timeout management
var _sessionTimerHandle = null;
function _startSessionTimer(){
  if(_sessionTimerHandle) clearInterval(_sessionTimerHandle);
  _sessionTimerHandle = setInterval(function(){
    if(!isAdminLoggedIn()) { clearInterval(_sessionTimerHandle); return; }
    var loginTime = parseInt(sessionStorage.getItem('ecap_admin_login_time'))||Date.now();
    var timeoutMin = getSessionTimeout();
    if(Date.now() - loginTime > timeoutMin*60*1000){
      addAuditLog('session_timeout', 'Auto-logout after '+timeoutMin+' minutes');
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      clearInterval(_sessionTimerHandle);
      showToast(CL('session_expired'));
      location.hash='#/admin';
      window.route();
    }
  }, 30000); // check every 30 seconds
}
// Start timer if already logged in
if(typeof sessionStorage !== 'undefined' && sessionStorage.getItem(ADMIN_SESSION_KEY)==='1') _startSessionTimer();

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
  if(!_cmsCurrentSlug){ showToast(CL('select_first')); return; }
  var slug = _cmsCurrentSlug;
  var bodyEl = document.getElementById('cms_b_'+slug+'_'+currentLang);
  var titleEl = document.getElementById('cms_t_'+slug+'_'+currentLang);
  var pg = getPage(slug, currentLang) || {};
  var body = bodyEl ? bodyEl.value : (pg.body||'');
  var title = titleEl ? titleEl.value : (pg.title||slug);
  var css = '';
  try{ css = document.querySelector('style').textContent; }catch(e){}
  var pw = window.open('', '_blank', 'width=960,height=720,scrollbars=yes,resizable=yes');
  if(!pw){ showToast(CL('popup_blocked')); return; }
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
      +'<div class="admin-field"><label>'+CL('title_label')+'</label><input type="text" id="cms_t_'+slug+'_'+lang+'" value="'+escAttr(title)+'"'+(!_canEditPages?' readonly style="background:#f3f4f6;color:var(--text-muted)"':'')+'/></div>'
      +'<div class="admin-field">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
      +'<label style="margin:0">'+CL('body_label')+'</label>'
      +(_canEditPages ? '<button type="button" class="cms-insert-file-btn" data-slug="'+slug+'" data-lang="'+lang+'" onclick="event.preventDefault();event.stopPropagation();window._cmsShowFilePicker(this)">'+CL('insert_dl')+'</button>' : '<span class="role-badge role-viewer">'+CL('read_only')+'</span>')
      +'</div>'
      +tbHtml
      +'<textarea id="'+taId+'" style="min-height:200px;font-family:monospace;font-size:13px"'+(!_canEditPages?' readonly':'')+'>'+escHtml(body)+'</textarea>'
      +'</div></div>';
  });

  html += '<div style="display:flex;gap:8px;margin-top:8px">'
    +(_canEditPages ? '<button class="admin-btn primary" onclick="window._cmsSavePage(\''+slug+'\')">'+CL('save_changes')+'</button>' : '<span style="font-size:12px;color:var(--text-muted);align-self:center">'+CL('viewer_nosave')+'</span>')
    +'<a href="#/page/'+esc(slug)+'" target="_blank" class="admin-btn secondary" style="text-decoration:none;display:inline-flex;align-items:center">'+CL('view_page')+'</a></div>';

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
  showToast(CL('saved') + slug);
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
  var exportData = {
    pages: full,
    banners: getCmsBanners(),
    blog: getCmsBlog() || [],
    files: getCmsFiles()
  };
  var blob = new Blob([JSON.stringify(exportData, null, 2)], {type:"application/json"});
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ecapital-cms-"+new Date().toISOString().slice(0,10)+".json";
  a.click();
  URL.revokeObjectURL(a.href);
  showToast(CL('exported'));
};

window._cmsImport = function(e){
  var file = e.target.files[0];
  if(!file) return;
  var reader = new FileReader();
  reader.onload = function(ev){
    try {
      var data = JSON.parse(ev.target.result);
      // Support new format (with pages/banners/blog keys) and legacy (flat pages object)
      if(data.pages && typeof data.pages === 'object' && !data.pages.title){
        saveCmsPages(data.pages);
        if(data.banners) saveCmsBanners(data.banners);
        if(data.blog) saveCmsBlog(data.blog);
        if(data.files) saveCmsFiles(data.files);
      } else {
        // Legacy: entire object is pages
        saveCmsPages(data);
      }
      showToast(CL('imported'));
      window.route();
    } catch(err){ showToast(CL('invalid_json')); }
  };
  reader.readAsText(file);
  e.target.value = "";
};

window._cmsReset = function(){
  if(confirm(CL('reset_confirm'))) {
    localStorage.removeItem(CMS_KEY);
    showToast(CL('reset_done'));
    window.route();
  }
};

// ————————————————————— CMS SECTION SWITCHER —————————————————————
var _cmsSection = "pages";
window._cmsSectionSwitch = function(sec){
  if(typeof sec === "number"){
    var secs = ["pages","files","users","banners"];
    sec = secs[sec] || "pages";
  }
  _cmsSection = sec;
  ["pages","banners","blog","files","account","users","security"].forEach(function(s){
    var b = document.getElementById("stab_"+s);
    if(b) b.classList.toggle("active", s===sec);
  });
  var sidebar = document.querySelector(".cms-sidebar");
  if(sidebar) sidebar.style.display = sec==="pages" ? "" : "none";
  if(sec==="pages") {
    document.getElementById("cmsEditor").innerHTML = '<div class="cms-empty"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div><p>'+CL('select_page')+'</p></div>';
  } else if(sec==="files") {
    window._cmsFilesView();
  } else if(sec==="account") {
    window._cmsAccountView();
  } else if(sec==="users") {
    window._cmsUserMgmtView();
  } else if(sec==="security") {
    window._cmsSecurityView();
  } else if(sec==="banners") {
    window._cmsBannersView();
  } else if(sec==="blog") {
    window._cmsBlogView();
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
      +'<button class="admin-btn secondary" style="font-size:11px;padding:4px 10px;margin-right:4px" onclick="window._cmsFileCopy('+i+')">'+CL('copy_link')+'</button>'
      +(_canDelFile?'<button class="admin-btn danger" style="font-size:11px;padding:4px 10px" onclick="window._cmsFileDelete('+i+')">'+CL('delete')+'</button>':'')
      +'</td></tr>';
  }).join("") : '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px">'+CL('no_files')+(  _canUpload?CL('upload_hint'):CL('viewer_hint'))+'</td></tr>';

  document.getElementById("cmsEditor").innerHTML =
    '<div class="cms-panel">'
    +'<h3 style="font-size:20px;font-weight:700;margin-bottom:6px">'+CL('files_title')+'</h3>'
    +'<p style="color:var(--text-muted);font-size:13px;margin-bottom:20px">'+CL('files_desc')+'</p>'
    +(_canUpload ? '<div class="cms-upload-zone" id="cmsDropZone">' : '<div style="display:none">')
    +'<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:8px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
    +'<p><strong>'+CL('drag_drop')+'</strong>'+CL('files_here')+'</p>'
    +'<p style="font-size:12px;color:var(--text-muted)">'+CL('or_browse')+'</p>'
    +'<input type="file" id="cmsFileInput" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style="display:none" onchange="window._cmsFileUpload(event)"/>'
    +'<button class="admin-btn primary" onclick="window._cmsChooseFile()" style="margin-top:8px">'+CL('choose_file')+'</button>'
    +'</div>'
    +(_canUpload ? '<div class="cms-add-url-row">' : '<div style="display:none">')
    +'<input type="text" id="cmsUrlName" placeholder="'+CL('link_title')+'"/>'
    +'<input type="url" id="cmsUrlHref" placeholder="'+CL('ext_url')+'"/>'
    +'<button class="admin-btn secondary" onclick="window._cmsAddUrl()">'+CL('add_url')+'</button>'
    +'</div>'
    +(_canUpload ? '' : '</div>')
    +(   _canUpload ? '' : '<div style="background:#fef9c3;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;font-size:13px;margin-bottom:12px">'+CL('view_only')+'</div>')
    +'<table class="cms-files-table"><thead><tr><th>'+CL('name_desc')+'</th><th>'+CL('type')+'</th><th>'+CL('size')+'</th><th>'+CL('uploaded')+'</th><th>'+CL('actions')+'</th></tr></thead><tbody>'+rows+'</tbody></table>'
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
  if(!name || !url){ showToast(CL('enter_both')); return; }
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
  navigator.clipboard ? navigator.clipboard.writeText(snippet).then(function(){ showToast(CL('copied')); }) : showToast(snippet);
};

window._cmsFileDelete = function(idx){
  if(!confirm(CL('del_file_q'))) return;
  var files = getCmsFiles();
  files.splice(idx,1);
  saveCmsFiles(files);
  window._cmsFilesView();
};

// ————————————————————— CMS USERS MANAGER —————————————————————
// My Account view (standalone tab)
window._cmsAccountView = function(){
  var currentUser = sessionStorage.getItem("ecap_admin_user") || "admin";
  var cfg2fa = get2FAConfig();
  document.getElementById("cmsEditor").innerHTML = '<div class="cms-panel">' + _cmsAccountTab(currentUser, cfg2fa) + '</div>';
};

// User Management view (standalone tab, admin only)
window._cmsUserMgmtView = function(){
  var currentUser = sessionStorage.getItem("ecap_admin_user") || "admin";
  var users = getCmsUsers();
  var cfg2fa = get2FAConfig();
  document.getElementById("cmsEditor").innerHTML = '<div class="cms-panel">' + _cmsUserMgmtTab(users, currentUser, cfg2fa) + '</div>';
};

// Security view (standalone tab, admin only)
window._cmsSecurityView = function(){
  document.getElementById("cmsEditor").innerHTML = '<div class="cms-panel">' + _cmsSecurityTab() + '</div>';
};

// Legacy function kept for compatibility
window._cmsUsersView = function(tab){
  if(tab === 'account') window._cmsAccountView();
  else if(tab === 'users') window._cmsUserMgmtView();
  else if(tab === 'security') window._cmsSecurityView();
  else window._cmsAccountView();
};

function _cmsAccountTab(currentUser, cfg2fa){
  return '<div class="cms-section-box">'
    +'<h3 style="font-size:20px;font-weight:700;margin-bottom:20px">'+CL('my_account')+'</h3>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start">'
    // Left: Change Password
    +'<div class="cms-card-box">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:16px">'+CL('change_pwd')+'</h4>'
    +'<div class="admin-field"><label>'+CL('current_pwd')+'</label><input type="password" id="pwdCurrent" placeholder="'+CL('current_pwd')+'"/></div>'
    +'<div class="admin-field"><label>'+CL('new_pwd')+'</label><input type="password" id="pwdNew" placeholder="'+CL('new_pwd')+'"/></div>'
    +'<div class="admin-field"><label>'+CL('confirm_pwd')+'</label><input type="password" id="pwdConfirm" placeholder="'+CL('confirm_pwd')+'"/></div>'
    +'<button class="admin-btn primary" onclick="window._cmsChangePassword()">'+CL('update_pwd')+'</button>'
    +'<div id="pwdMsg" style="font-size:13px;margin-top:8px;min-height:20px"></div>'
    +'</div>'
    // Right: My 2FA
    +'<div class="cms-card-box">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:16px">'+CL('twofa_title')+'</h4>'
    +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">'
    +'<span style="font-size:14px;padding:4px 10px;border-radius:100px;font-weight:700;'+(cfg2fa[currentUser]?'background:#d1fae5;color:#059669':'background:#fee2e2;color:#dc2626')+'">'+(cfg2fa[currentUser]?CL('twofa_on'):CL('twofa_off'))+'</span>'
    +'</div>'
    +'<p style="font-size:14px;color:var(--text-sec);line-height:1.6;margin-bottom:16px">'+(cfg2fa[currentUser]?CL('twofa_on_desc'):CL('twofa_off_desc'))+'</p>'
    +'<button class="admin-btn '+(cfg2fa[currentUser]?'danger':'primary')+'" onclick="window._cms2FASetup(sessionStorage.getItem(\'ecap_admin_user\')||\'admin\')">'+(cfg2fa[currentUser]?CL('disable_2fa'):CL('setup_2fa'))+'</button>'
    +'</div>'
    +'</div>'
    +'</div>';
}

function _cmsUserMgmtTab(users, currentUser, cfg2fa){
  var userRows = users.length ? users.map(function(u,i){
    var isMe = u.username===currentUser;
    var uRole = u.role||"admin";
    var disabled = u.enabled===false;
    return '<div class="cms-user-row'+(disabled?' user-disabled':'')+'">'
      +'<div class="u-avatar'+(disabled?' disabled':'')+'">'+esc(u.username[0].toUpperCase())+'</div>'
      +'<div style="flex:1;min-width:0">'
      +'<div class="u-name">'+esc(u.username)+(isMe?' <span class="u-tag">'+CL('you')+'</span>':'')+(disabled?' <span style="color:#dc2626;font-size:12px;font-weight:600">'+CL('disabled_label')+'</span>':'')+'</div>'
      +'<div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">'
      +'<span class="role-badge role-'+uRole+'">'+uRole+'</span>'
      +'<span style="font-size:11px;padding:2px 8px;border-radius:100px;font-weight:600;'+(cfg2fa[u.username]?'background:#d1fae5;color:#059669':'background:#fee2e2;color:#dc2626')+'">'+(cfg2fa[u.username]?'2FA ON':'2FA OFF')+'</span>'
      +(u.lastLogin?'<span style="font-size:11px;color:var(--text-muted)">Last login: '+new Date(u.lastLogin).toLocaleDateString('zh-HK')+'</span>':'')
      +'</div>'
      +'</div>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0">'
      +(!isMe?'<button class="admin-btn secondary" style="font-size:12px;padding:5px 12px" onclick="window._cmsEditUser('+i+')">'+CL('edit')+'</button>':'')
      +(!isMe&&cfg2fa[u.username]?'<button class="admin-btn secondary" style="font-size:12px;padding:5px 12px" onclick="window._cmsReset2FA(\''+u.username+'\')">'+CL('reset_2fa')+'</button>':'')
      +(!isMe?'<button class="admin-btn '+(disabled?'primary':'secondary')+'" style="font-size:12px;padding:5px 12px" onclick="window._cmsToggleUser('+i+')">'+(disabled?CL('enable'):CL('disable'))+'</button>':'')
      +(!isMe?'<button class="admin-btn danger" style="font-size:12px;padding:5px 14px" onclick="window._cmsUserDelete('+i+')">'+CL('remove')+'</button>':'')
      +'</div></div>';
  }).join("") : '<div style="color:var(--text-muted);font-size:14px;padding:8px 0">Using default admin account. Add users below to replace it.</div>';

  return '<div class="cms-section-box">'
    +'<h3 style="font-size:20px;font-weight:700;margin-bottom:4px">'+CL('user_mgmt')+'</h3>'
    +'<p style="color:var(--text-muted);font-size:13px;margin-bottom:20px">'+(users.length||1)+CL('users_total')+'</p>'
    +'<div class="cms-users-list" style="margin-bottom:24px">'+userRows+'</div>'
    // Add new user
    +'<div class="cms-card-box">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:16px">'+CL('add_new_user')+'</h4>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
    +'<div class="admin-field"><label>'+CL('username')+'</label><input type="text" id="newUsername" placeholder="e.g. editor1"/></div>'
    +'<div class="admin-field"><label>'+CL('password')+'</label><input type="password" id="newUserPass" placeholder="Min 8 chars, mix upper/lower/numbers"/></div>'
    +'</div>'
    +'<div class="admin-field"><label>'+CL('role')+'</label><select id="newUserRole" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:inherit;background:var(--white)">'
    +'<option value="admin">Admin \u2014 Full access (pages, files, users, export)</option>'
    +'<option value="editor" selected>Editor \u2014 Edit pages & uploads, no user management</option>'
    +'<option value="viewer">Viewer \u2014 Read-only, cannot save or upload</option>'
    +'</select></div>'
    +'<button class="admin-btn primary" onclick="window._cmsUserAdd()">'+CL('add_user')+'</button>'
    +'<div id="addUserMsg" style="font-size:13px;margin-top:8px;min-height:20px"></div>'
    +'</div>'
    +'</div>';
}

function _cmsSecurityTab(){
  var whitelist = getIpWhitelist();
  var auditLog = getAuditLog();
  var timeout = getSessionTimeout();
  var clientIp = sessionStorage.getItem('ecap_client_ip')||'';

  var ipRows = whitelist.length ? whitelist.map(function(item,i){
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--border-light);border-radius:8px;margin-bottom:6px;background:var(--white)">'
      +'<span style="font-family:monospace;font-size:14px;flex:1">'+esc(item.ip)+'</span>'
      +'<span style="font-size:12px;color:var(--text-muted)">'+esc(item.label||'')+'</span>'
      +'<span style="font-size:11px;padding:2px 8px;border-radius:100px;font-weight:600;'+(item.enabled!==false?'background:#d1fae5;color:#059669':'background:#fee2e2;color:#dc2626')+'">'+(item.enabled!==false?'Active':'Disabled')+'</span>'
      +'<button class="admin-btn secondary" style="font-size:11px;padding:4px 10px" onclick="window._cmsToggleIp('+i+')">'+(item.enabled!==false?CL('disable'):CL('enable'))+'</button>'
      +'<button class="admin-btn danger" style="font-size:11px;padding:4px 10px" onclick="window._cmsRemoveIp('+i+')">'+CL('remove')+'</button>'
      +'</div>';
  }).join('') : '<div style="color:var(--text-muted);font-size:13px;padding:8px 0">No IP restrictions. All IPs can access CMS.</div>';

  var auditRows = auditLog.slice(0,20).map(function(entry){
    var icon = entry.action.indexOf('login_success')>=0?'&#9989;':entry.action.indexOf('fail')>=0||entry.action.indexOf('blocked')>=0?'&#10060;':'&#128276;';
    return '<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:13px">'
      +'<span>'+icon+'</span>'
      +'<span style="color:var(--text-muted);min-width:140px;flex-shrink:0">'+new Date(entry.time).toLocaleString('zh-HK')+'</span>'
      +'<span style="font-weight:600;min-width:80px">'+esc(entry.user)+'</span>'
      +'<span style="color:var(--text-sec)">'+esc(entry.action.replace(/_/g,' '))+'</span>'
      +(entry.detail?'<span style="color:var(--text-muted);margin-left:auto">'+esc(entry.detail)+'</span>':'')
      +'</div>';
  }).join('');

  return '<div class="cms-section-box">'
    +'<h3 style="font-size:20px;font-weight:700;margin-bottom:4px">'+CL('security_title')+'</h3>'
    +'<p style="color:var(--text-muted);font-size:13px;margin-bottom:24px">'+CL('security_desc')+'</p>'
    // Security Status Overview
    +'<div class="cms-card-box" style="margin-bottom:24px;background:linear-gradient(135deg,rgba(180,21,64,.04),rgba(180,21,64,.08));border:1px solid rgba(180,21,64,.12)">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:12px">'+CL('security_overview')+'</h4>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">'
    +'<div>&#128274; <strong>'+CL('ip_whitelist')+':</strong> '+(whitelist.length?'<span style="color:#059669">'+whitelist.filter(function(x){return x.enabled!==false}).length+' active IPs</span>':'<span style="color:#f59e0b">Off (all IPs allowed)</span>')+'</div>'
    +'<div>&#9201; <strong>'+CL('session_timeout')+':</strong> '+timeout+' minutes</div>'
    +'<div>&#128272; <strong>2FA:</strong> '+(Object.keys(get2FAConfig()).length?'<span style="color:#059669">'+Object.keys(get2FAConfig()).length+' users enabled</span>':'<span style="color:#f59e0b">No users enabled</span>')+'</div>'
    +'<div>&#128737; <strong>Rate Limiting:</strong> <span style="color:#059669">5 attempts / 15 min lockout</span></div>'
    +'<div>&#128270; <strong>Session Fingerprint:</strong> <span style="color:#059669">Active</span></div>'
    +'<div>&#128196; <strong>Audit Log:</strong> '+auditLog.length+' entries</div>'
    +'</div>'
    +'</div>'
    // IP Whitelist
    +'<div class="cms-card-box" style="margin-bottom:24px">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:4px">'+CL('ip_whitelist')+'</h4>'
    +'<p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Only listed IPs can login to CMS. Leave empty to allow all IPs.'+(clientIp?' Your current IP: <strong>'+esc(clientIp)+'</strong>':'')+'</p>'
    +ipRows
    +'<div style="display:flex;gap:8px;margin-top:12px;align-items:end">'
    +'<div class="admin-field" style="flex:1;margin:0"><label>'+CL('ip_addr')+'</label><input type="text" id="newIpAddr" placeholder="e.g. 192.168.1.100"/></div>'
    +'<div class="admin-field" style="flex:1;margin:0"><label>'+CL('label_opt')+'</label><input type="text" id="newIpLabel" placeholder="e.g. Office"/></div>'
    +'<button class="admin-btn primary" onclick="window._cmsAddIp()" style="height:44px;white-space:nowrap">'+CL('add_ip')+'</button>'
    +'</div>'
    +'<button class="admin-btn secondary" style="margin-top:8px;font-size:12px" onclick="window._cmsAddMyIp()">'+CL('add_my_ip')+'</button>'
    +'</div>'
    // Session Timeout
    +'<div class="cms-card-box" style="margin-bottom:24px">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:12px">'+CL('session_timeout')+'</h4>'
    +'<div style="display:flex;gap:12px;align-items:center">'
    +'<div class="admin-field" style="margin:0;flex:0 0 200px"><label>'+CL('timeout_min')+'</label><input type="number" id="sessionTimeout" value="'+timeout+'" min="5" max="480" style="width:100%"/></div>'
    +'<button class="admin-btn primary" onclick="window._cmsSaveTimeout()" style="align-self:end;height:44px">'+CL('save')+'</button>'
    +'</div>'
    +'<p style="font-size:12px;color:var(--text-muted);margin-top:8px">Auto-logout after inactivity. Current: '+timeout+' minutes.</p>'
    +'</div>'
    // Audit Log
    +'<div class="cms-card-box">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    +'<h4 style="font-size:16px;font-weight:700;margin:0">'+CL('audit_log')+'</h4>'
    +'<button class="admin-btn secondary" style="font-size:11px;padding:4px 10px" onclick="if(confirm(CL(\'clear_log_q\')))localStorage.removeItem(\''+CMS_AUDIT_KEY+'\');window._cmsUsersView(\'security\')">'+CL('clear_log')+'</button>'
    +'</div>'
    +(auditRows||'<div style="color:var(--text-muted);font-size:13px">'+CL('no_log')+'</div>')
    +'</div>'
    +'</div>';
}

// IP Whitelist management
window._cmsAddIp = function(){
  var ip = document.getElementById('newIpAddr').value.trim();
  if(!ip){ showToast('Enter an IP address'); return; }
  var label = document.getElementById('newIpLabel').value.trim();
  var list = getIpWhitelist();
  if(list.some(function(x){return x.ip===ip;})){ showToast('IP already in list'); return; }
  list.push({ip:ip, label:label, enabled:true, addedAt:new Date().toISOString()});
  saveIpWhitelist(list);
  addAuditLog('ip_added', ip+(label?' ('+label+')':''));
  showToast('IP added: '+ip);
  window._cmsUsersView('security');
};
window._cmsAddMyIp = function(){
  var ip = sessionStorage.getItem('ecap_client_ip');
  if(!ip){
    fetch('https://api.ipify.org?format=json').then(function(r){return r.json();}).then(function(d){
      sessionStorage.setItem('ecap_client_ip', d.ip);
      document.getElementById('newIpAddr').value = d.ip;
      document.getElementById('newIpLabel').value = 'My IP';
      showToast('Your IP: '+d.ip+' — click Add IP to save');
    }).catch(function(){ showToast('Could not detect IP'); });
    return;
  }
  document.getElementById('newIpAddr').value = ip;
  document.getElementById('newIpLabel').value = 'My IP';
};
window._cmsToggleIp = function(idx){
  var list = getIpWhitelist();
  if(!list[idx]) return;
  list[idx].enabled = list[idx].enabled===false ? true : false;
  saveIpWhitelist(list);
  addAuditLog('ip_toggled', list[idx].ip+' '+(list[idx].enabled?'enabled':'disabled'));
  window._cmsUsersView('security');
};
window._cmsRemoveIp = function(idx){
  var list = getIpWhitelist();
  if(!list[idx]) return;
  if(!confirm('Remove IP '+list[idx].ip+'?')) return;
  var ip = list[idx].ip;
  list.splice(idx,1);
  saveIpWhitelist(list);
  addAuditLog('ip_removed', ip);
  showToast('IP removed');
  window._cmsUsersView('security');
};
window._cmsSaveTimeout = function(){
  var val = parseInt(document.getElementById('sessionTimeout').value)||30;
  if(val<5) val=5; if(val>480) val=480;
  saveSessionTimeout(val);
  addAuditLog('timeout_changed', val+' minutes');
  showToast('Session timeout set to '+val+' minutes');
};

// Toggle user enable/disable
window._cmsToggleUser = function(idx){
  var users = getCmsUsers();
  if(!users[idx]) return;
  users[idx].enabled = users[idx].enabled===false ? true : false;
  saveCmsUsers(users);
  addAuditLog('user_toggled', users[idx].username+' '+(users[idx].enabled!==false?'enabled':'disabled'));
  showToast(users[idx].username+' '+(users[idx].enabled!==false?'enabled':'disabled'));
  window._cmsUserMgmtView();
};

// Edit user modal (change role, reset password)
window._cmsEditUser = function(idx){
  var users = getCmsUsers();
  var u = users[idx];
  if(!u) return;
  var div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center';
  div.innerHTML = '<div style="background:var(--white);border-radius:12px;padding:32px;max-width:440px;width:90%;box-shadow:0 12px 40px rgba(0,0,0,.2)">'
    +'<h3 style="margin:0 0 20px;font-size:18px;font-weight:700">Edit User: '+esc(u.username)+'</h3>'
    +'<div class="admin-field"><label>'+CL('role')+'</label><select id="editUserRole" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:inherit;background:var(--white)">'
    +'<option value="admin"'+(u.role==='admin'?' selected':'')+'>Admin</option>'
    +'<option value="editor"'+(u.role==='editor'?' selected':'')+'>Editor</option>'
    +'<option value="viewer"'+(u.role==='viewer'?' selected':'')+'>Viewer</option>'
    +'</select></div>'
    +'<div class="admin-field"><label>New Password (leave blank to keep)</label><input type="password" id="editUserPass" placeholder="Min 6 characters"/></div>'
    +'<div style="display:flex;gap:8px;margin-top:16px">'
    +'<button class="admin-btn primary" id="editUserSaveBtn">'+CL('save_changes')+'</button>'
    +'<button class="admin-btn secondary" id="editUserCancelBtn">'+CL('cancel')+'</button>'
    +'</div>'
    +'<div id="editUserMsg" style="font-size:13px;margin-top:8px"></div>'
    +'</div>';
  document.body.appendChild(div);
  document.getElementById('editUserCancelBtn').addEventListener('click', function(){ div.remove(); });
  div.addEventListener('click', function(e){ if(e.target===div) div.remove(); });
  document.getElementById('editUserSaveBtn').addEventListener('click', function(){
    var newRole = document.getElementById('editUserRole').value;
    var newPass = document.getElementById('editUserPass').value;
    var msg = document.getElementById('editUserMsg');
    var usr = getCmsUsers();
    if(!usr[idx]){msg.textContent='User not found';return;}
    usr[idx].role = newRole;
    if(newPass){
      if(newPass.length<6){msg.style.color='#dc3545';msg.textContent='Password must be at least 6 characters.';return;}
      sha256hex(newPass).then(function(hash){
        usr[idx].hash = hash;
        saveCmsUsers(usr);
        addAuditLog('user_edited', u.username+': role='+newRole+', password reset');
        showToast('User updated: '+u.username);
        div.remove();
        window._cmsUsersView('users');
      });
    } else {
      saveCmsUsers(usr);
      addAuditLog('user_edited', u.username+': role='+newRole);
      showToast('User updated: '+u.username);
      div.remove();
      window._cmsUsersView('users');
    }
  });
};

window._cmsChangePassword = function(){
  var cur = document.getElementById("pwdCurrent").value;
  var nw = document.getElementById("pwdNew").value;
  var cf = document.getElementById("pwdConfirm").value;
  var msg = document.getElementById("pwdMsg");
  if(nw.length < 8){ msg.style.color="#dc3545"; msg.textContent="Password must be at least 8 characters."; return; }
  var strength = checkPasswordStrength(nw);
  if(strength.level==='weak'){ msg.style.color="#dc3545"; msg.textContent="Password too weak. Use uppercase, lowercase, numbers and symbols."; return; }
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
  if(pass.length < 8){ msg.style.color="#dc3545"; msg.textContent="Password must be at least 8 characters."; return; }
  var strength = checkPasswordStrength(pass);
  if(strength.level==='weak'){ msg.style.color="#dc3545"; msg.textContent="Password too weak. Use uppercase, lowercase, numbers."; return; }
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
window._cmsReset2FA = function(username){
  if(!confirm('Reset 2FA for '+username+'? They will need to set it up again on next login.')) return;
  var cfg = get2FAConfig();
  delete cfg[username];
  save2FAConfig(cfg);
  showToast('2FA reset for '+username+'. They can re-enable it.');
  window._cmsUsersView();
};
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
    +'<button class="admin-btn secondary" id="cancel2FABtn">'+CL('cancel')+'</button>'
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
  inner += '<div class="cfp-close">'+CL('cancel')+'</div>';
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

// ————————————————————— CMS BLOG MANAGER —————————————————————
// Blog articles are stored in localStorage CMS_BLOG_KEY as array.
// Each article: { slug, title_en, title_hans, title_hant, tag_en, tag_hans, tag_hant, date, img, body_en, body_hans, body_hant }
// When CMS blog data exists, it overrides the default BLOG_ARTICLES from app.js.

var _cmsBlogEditIdx = -1; // -1 = new article

function _getBlogArticles(){
  var cms = getCmsBlog();
  if(cms && cms.length) return cms;
  if(typeof BLOG_ARTICLES !== 'undefined') return BLOG_ARTICLES.slice();
  return [];
}

window._cmsBlogView = function(){
  var articles = _getBlogArticles();
  var _canEdit = _cmsHasPermission("editPage");

  var rows = articles.length ? articles.map(function(a,i){
    var title = a.title_hant || a.title_en || 'Untitled';
    return '<div class="cms-item-card">'
      +'<img class="cms-item-thumb" src="'+escAttr(a.img||'')+'" onerror="this.style.background=\'#eee\'"/>'
      +'<div class="cms-item-info">'
      +'<div class="cms-item-title">'+esc(title)+'</div>'
      +'<div class="cms-item-meta">'+esc(a.date||'')+' &middot; '+esc(a.tag_hant||a.tag_en||'')+'</div>'
      +'<div class="cms-item-meta">slug: '+esc(a.slug||'')+'</div>'
      +'</div>'
      +'<div class="cms-item-actions">'
      +'<button class="admin-btn secondary" style="font-size:11px;padding:4px 10px" onclick="window._cmsBlogPreview('+i+')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>'
      +(_canEdit?'<button class="admin-btn primary" style="font-size:11px;padding:4px 10px" onclick="window._cmsBlogEdit('+i+')">'+CL('edit')+'</button>':'')
      +(i>0?'<button class="admin-btn secondary" style="font-size:11px;padding:4px 8px" onclick="window._cmsBlogMove('+i+',-1)">&uarr;</button>':'')
      +(i<articles.length-1?'<button class="admin-btn secondary" style="font-size:11px;padding:4px 8px" onclick="window._cmsBlogMove('+i+',1)">&darr;</button>':'')
      +(_canEdit?'<button class="admin-btn danger" style="font-size:11px;padding:4px 8px" onclick="window._cmsBlogDelete('+i+')">'+CL('del_short')+'</button>':'')
      +'</div></div>';
  }).join("") : '<div class="cms-item-meta" style="padding:12px 0">'+CL('no_articles')+'</div>';

  document.getElementById("cmsEditor").innerHTML =
    '<div class="cms-panel">'
    +'<div class="cms-panel-header"><h3>'+CL('blog_title')+'</h3>'
    +'<p>'+CL('blog_desc')+'<br>'+CL('blog_img_hint')+'</p></div>'
    +'<div id="cmsBlogList">' + rows + '</div>'
    +(_canEdit?'<button class="admin-btn primary" style="margin-top:12px" onclick="window._cmsBlogEdit(-1)">'+CL('new_article')+'</button>':'')
    +'</div>';
};

window._cmsBlogEdit = function(idx){
  var articles = _getBlogArticles();
  _cmsBlogEditIdx = idx;
  var a = idx >= 0 ? articles[idx] : {slug:'hk-news-',title_en:'',title_hans:'',title_hant:'',tag_en:'',tag_hans:'',tag_hant:'',date:new Date().toISOString().slice(0,10),img:'',body_en:'',body_hans:'',body_hant:''};

  var h = '<div class="cms-panel">'
    +'<div class="cms-form-row" style="align-items:center;margin-bottom:16px">'
    +'<button class="admin-btn secondary" onclick="window._cmsBlogView()">&larr; '+CL('back')+'</button>'
    +'<h3 style="font-size:18px;font-weight:700;margin:0">'+(idx>=0?CL('edit_article'):CL('new_article_h'))+'</h3>'
    +'</div>'
    // Row 1: slug + date
    +'<div class="cms-form-row">'
    +'<div class="admin-field" style="flex:2"><label>'+CL('slug_url')+'</label><input type="text" id="blogSlug" value="'+escAttr(a.slug)+'" placeholder="hk-news-my-article"'+(idx>=0?' readonly style="opacity:.6"':'')+'/></div>'
    +'<div class="admin-field" style="flex:1"><label>'+CL('date')+'</label><input type="date" id="blogDate" value="'+escAttr(a.date)+'"/></div>'
    +'</div>'
    // Row 2: tags
    +'<div class="cms-form-row">'
    +'<div class="admin-field"><label>Tag (繁)</label><input type="text" id="blogTagHant" value="'+escAttr(a.tag_hant)+'" placeholder="市場"/></div>'
    +'<div class="admin-field"><label>Tag (简)</label><input type="text" id="blogTagHans" value="'+escAttr(a.tag_hans)+'" placeholder="市场"/></div>'
    +'<div class="admin-field"><label>Tag (EN)</label><input type="text" id="blogTagEn" value="'+escAttr(a.tag_en)+'" placeholder="Market"/></div>'
    +'</div>'
    // Row 3: titles
    +'<div class="admin-field"><label>Title (繁體)</label><input type="text" id="blogTitleHant" value="'+escAttr(a.title_hant)+'"/></div>'
    +'<div class="admin-field"><label>Title (简体)</label><input type="text" id="blogTitleHans" value="'+escAttr(a.title_hans)+'"/></div>'
    +'<div class="admin-field"><label>Title (EN)</label><input type="text" id="blogTitleEn" value="'+escAttr(a.title_en)+'"/></div>'
    // Image
    +'<div class="admin-field"><label>'+CL('image')+'</label>'
    +'<div class="cms-form-row" style="align-items:end;margin-bottom:0">'
    +'<input type="text" id="blogImg" value="'+escAttr(a.img)+'" placeholder="images/ecap-blog-xxx.png or paste URL" style="flex:1"/>'
    +'<button class="admin-btn secondary" onclick="document.getElementById(\'blogImgFile\').click()" style="height:44px;white-space:nowrap">'+CL('upload')+'</button>'
    +'<input type="file" id="blogImgFile" accept=".jpg,.jpeg,.png,.webp" style="display:none" onchange="window._cmsBlogImgUpload(event)"/>'
    +'</div>'
    +'<p class="cms-item-meta" style="margin-top:4px">'+CL('auto_resize')+'</p>'
    +(a.img?'<img src="'+escAttr(a.img)+'" style="max-width:300px;height:auto;border-radius:8px;margin-top:8px" onerror="this.style.display=\'none\'"/>':'')
    +'</div>'
    // Body tabs
    +'<div class="admin-field">'
    +'<div class="cms-body-tabs">'
    +'<button class="cms-section-btn active" id="blogBodyTabHant" onclick="window._cmsBlogBodyTab(\'hant\')">繁體內容</button>'
    +'<button class="cms-section-btn" id="blogBodyTabHans" onclick="window._cmsBlogBodyTab(\'hans\')">简体内容</button>'
    +'<button class="cms-section-btn" id="blogBodyTabEn" onclick="window._cmsBlogBodyTab(\'en\')">EN Content</button>'
    +'</div>'
    +'<textarea id="blogBodyHant" class="admin-field" style="min-height:300px;font-family:monospace;font-size:13px">'+escHtml(a.body_hant||'')+'</textarea>'
    +'<textarea id="blogBodyHans" class="admin-field" style="min-height:300px;font-family:monospace;font-size:13px;display:none">'+escHtml(a.body_hans||'')+'</textarea>'
    +'<textarea id="blogBodyEn" class="admin-field" style="min-height:300px;font-family:monospace;font-size:13px;display:none">'+escHtml(a.body_en||'')+'</textarea>'
    +'</div>'
    // Save
    +'<div class="cms-form-row">'
    +'<button class="admin-btn primary" onclick="window._cmsBlogSave()">'+CL('save_article')+'</button>'
    +'<button class="admin-btn secondary" onclick="window._cmsBlogView()">'+CL('cancel')+'</button>'
    +'</div>'
    +'</div>';

  document.getElementById("cmsEditor").innerHTML = h;
};

window._cmsBlogBodyTab = function(lang){
  ['hant','hans','en'].forEach(function(l){
    var ta = document.getElementById('blogBody'+l.charAt(0).toUpperCase()+l.slice(1));
    var btn = document.getElementById('blogBodyTab'+l.charAt(0).toUpperCase()+l.slice(1));
    if(ta) ta.style.display = l===lang ? '' : 'none';
    if(btn) btn.classList.toggle('active', l===lang);
  });
};

window._cmsBlogImgUpload = function(e){
  var file = e.target.files[0];
  if(!file) return;
  if(file.size > 5*1024*1024){ showToast('Image too large (max 5MB)'); return; }
  var reader = new FileReader();
  reader.onload = function(ev){
    var img = new Image();
    img.onload = function(){
      // Auto-resize to hero size 1200x525
      var canvas = document.createElement('canvas');
      canvas.width = 1200; canvas.height = 525;
      var ctx = canvas.getContext('2d');
      // Cover fit
      var scale = Math.max(1200/img.width, 525/img.height);
      var sw = 1200/scale, sh = 525/scale;
      var sx = (img.width - sw)/2, sy = (img.height - sh)/2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 1200, 525);
      var dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      document.getElementById('blogImg').value = dataUrl;
      showToast('Image resized to 1200×525px');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
};

window._cmsBlogSave = function(){
  var slug = document.getElementById('blogSlug').value.trim();
  if(!slug || slug.indexOf('hk-news-')!==0){ showToast('Slug must start with "hk-news-"'); return; }
  var titleHant = document.getElementById('blogTitleHant').value.trim();
  if(!titleHant){ showToast('Please enter a title (繁體)'); return; }

  var article = {
    slug: slug,
    date: document.getElementById('blogDate').value,
    tag_hant: document.getElementById('blogTagHant').value.trim(),
    tag_hans: document.getElementById('blogTagHans').value.trim(),
    tag_en: document.getElementById('blogTagEn').value.trim(),
    title_hant: titleHant,
    title_hans: document.getElementById('blogTitleHans').value.trim(),
    title_en: document.getElementById('blogTitleEn').value.trim(),
    img: document.getElementById('blogImg').value.trim(),
    body_hant: document.getElementById('blogBodyHant').value,
    body_hans: document.getElementById('blogBodyHans').value,
    body_en: document.getElementById('blogBodyEn').value
  };

  var articles = _getBlogArticles();
  if(_cmsBlogEditIdx >= 0){
    articles[_cmsBlogEditIdx] = article;
  } else {
    // Check slug uniqueness
    for(var i=0;i<articles.length;i++){
      if(articles[i].slug === slug){ showToast('Slug "'+slug+'" already exists'); return; }
    }
    articles.unshift(article);
  }
  saveCmsBlog(articles);
  // Update global BLOG_ARTICLES so front-end picks up instantly
  if(typeof window.BLOG_ARTICLES !== 'undefined') window.BLOG_ARTICLES = articles;
  addAuditLog('blog_save', slug);
  showToast(CL('article_saved'));
  window._cmsBlogView();
};

window._cmsBlogDelete = function(idx){
  if(!confirm(CL('del_article_q'))) return;
  var articles = _getBlogArticles();
  var slug = articles[idx] ? articles[idx].slug : '';
  articles.splice(idx,1);
  saveCmsBlog(articles);
  if(typeof window.BLOG_ARTICLES !== 'undefined') window.BLOG_ARTICLES = articles;
  addAuditLog('blog_delete', slug);
  showToast(CL('article_deleted'));
  window._cmsBlogView();
};

window._cmsBlogMove = function(idx, dir){
  var articles = _getBlogArticles();
  var newIdx = idx + dir;
  if(newIdx < 0 || newIdx >= articles.length) return;
  var tmp = articles[idx];
  articles[idx] = articles[newIdx];
  articles[newIdx] = tmp;
  saveCmsBlog(articles);
  window._cmsBlogView();
};

// ————————————————————— CMS BANNERS MANAGER —————————————————————
window._cmsBannersView = function(){
  var banners = getCmsBanners();
  var _canUpload = _cmsHasPermission("upload");
  var rows = banners.length ? banners.map(function(b,i){
    return '<div class="cms-item-card">'
      +'<img class="cms-item-thumb" src="'+escAttr(b.img)+'"/>'
      +'<div class="cms-item-info">'
      +'<div class="cms-item-title">'+esc(b.alt||'Banner '+(i+1))+'</div>'
      +'<div class="cms-item-meta">'+esc(b.link||CL('no_link'))+'</div>'
      +'</div>'
      +'<div class="cms-item-actions">'
      +(i>0?'<button class="admin-btn secondary" style="font-size:11px;padding:4px 8px" onclick="window._cmsBannerMove('+i+',-1)">&uarr;</button>':'')
      +(i<banners.length-1?'<button class="admin-btn secondary" style="font-size:11px;padding:4px 8px" onclick="window._cmsBannerMove('+i+',1)">&darr;</button>':'')
      +(_canUpload?'<button class="admin-btn danger" style="font-size:11px;padding:4px 8px" onclick="window._cmsBannerDelete('+i+')">'+CL('delete')+'</button>':'')
      +'</div></div>';
  }).join("") : '<div class="cms-item-meta" style="padding:12px 0">'+CL('no_banner')+'</div>';

  document.getElementById("cmsEditor").innerHTML =
    '<div class="cms-panel">'
    +'<div class="cms-panel-header"><h3>'+CL('banners_title')+'</h3>'
    +'<p>'+CL('banners_desc')+'</p></div>'
    +(banners.length ? '<button class="admin-btn secondary" style="margin-bottom:12px" onclick="window._cmsBannerPreview()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> '+CL('preview_carousel')+'</button>' : '')
    +'<div class="cms-banners-list" id="cmsBannersList">' + rows + '</div>'
    +(_canUpload ?
      '<div class="cms-drop-zone" id="cmsBannerDropZone">'
      +'<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:8px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
      +'<p><strong>'+CL('drag_drop')+'</strong>'+CL('drag_img')+'</p>'
      +'<p class="cms-item-meta">'+CL('or_browse_5')+'</p>'
      +'<input type="file" id="cmsBannerInput" accept=".jpg,.jpeg,.png,.webp" style="display:none" onchange="window._cmsBannerUpload(event)" multiple/>'
      +'<button class="admin-btn primary" onclick="document.getElementById(\'cmsBannerInput\').click()" style="margin-top:8px">'+CL('choose_img')+'</button>'
      +'</div>'
      +'<div class="cms-url-row">'
      +'<div class="admin-field"><label>'+CL('paste_url')+'</label><input type="url" id="cmsBannerUrl" placeholder="https://..."/></div>'
      +'<div class="admin-field"><label>'+CL('alt_title')+'</label><input type="text" id="cmsBannerAlt" placeholder="'+CL('banner_desc')+'"/></div>'
      +'<div class="admin-field"><label>'+CL('link_opt')+'</label><input type="text" id="cmsBannerLink" placeholder="#/page/slug or https://..."/></div>'
      +'<button class="admin-btn primary" onclick="window._cmsBannerAddUrl()" style="height:44px;white-space:nowrap;align-self:end">'+CL('add')+'</button>'
      +'</div>'
    : '<div style="background:#fef9c3;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;font-size:13px;margin-top:12px">View only — editor or admin access needed.</div>')
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
  if(!confirm(CL('del_banner_q'))) return;
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

// Banner carousel preview in popup
window._cmsBannerPreview = function(){
  var banners = getCmsBanners();
  if(!banners.length){ showToast('No banners to preview'); return; }
  var slides = banners.map(function(b){
    return '<div class="swiper-slide" style="border-radius:12px;overflow:hidden"><img src="'+escAttr(b.img)+'" style="width:100%;height:auto;display:block" alt="'+escAttr(b.alt||'')+'"/></div>';
  }).join('');
  var pw = window.open('','_blank','width=900,height=560,scrollbars=yes,resizable=yes');
  if(!pw){ showToast('Pop-up blocked'); return; }
  pw.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Banner Preview</title>'
    +'<link rel="stylesheet" href="lib/swiper-bundle.min.css">'
    +'<style>body{margin:0;background:#1a1a2e;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif}'
    +'.bar{background:#f59e0b;color:#fff;font-size:12px;font-weight:600;padding:6px 20px;text-align:center;position:fixed;top:0;left:0;right:0;z-index:10}'
    +'.wrap{width:90%;max-width:820px;margin-top:40px}'
    +'.swiper-slide img{border-radius:12px}</style></head><body>'
    +'<div class="bar">BANNER PREVIEW — '+banners.length+' slides</div>'
    +'<div class="wrap"><div class="swiper" id="pvSwiper"><div class="swiper-wrapper">'+slides+'</div><div class="swiper-pagination"></div></div></div>'
    +'<script src="lib/swiper-bundle.min.js"><\/script>'
    +'<script>new Swiper("#pvSwiper",{loop:true,autoplay:{delay:3000},pagination:{el:".swiper-pagination",clickable:true}});<\/script>'
    +'</body></html>');
  pw.document.close();
};

// Blog article preview in popup
window._cmsBlogPreview = function(idx){
  var articles = _getBlogArticles();
  var a = articles[idx];
  if(!a){ showToast('Article not found'); return; }
  var lang = window.currentLang || 'zh-Hant';
  var title = lang==='en' ? (a.title_en||a.title_hant) : (lang==='zh-Hans' ? (a.title_hans||a.title_hant) : a.title_hant);
  var body = lang==='en' ? (a.body_en||a.body_hant) : (lang==='zh-Hans' ? (a.body_hans||a.body_hant) : a.body_hant);
  var tag = lang==='en' ? (a.tag_en||a.tag_hant) : (lang==='zh-Hans' ? (a.tag_hans||a.tag_hant) : a.tag_hant);
  var pw = window.open('','_blank','width=960,height=720,scrollbars=yes,resizable=yes');
  if(!pw){ showToast('Pop-up blocked'); return; }
  pw.document.write('<!DOCTYPE html><html lang="'+lang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title>'
    +'<style>*{margin:0;padding:0;box-sizing:border-box}'
    +'body{font-family:"Be Vietnam Pro","Noto Sans TC",sans-serif;background:#f8f9fa;color:#1a1a2e}'
    +'.bar{background:#f59e0b;color:#fff;font-size:12px;font-weight:600;padding:6px 20px;text-align:center}'
    +'.hero{width:100%;max-width:900px;margin:24px auto 0;padding:0 24px}'
    +'.hero img{width:100%;border-radius:16px;aspect-ratio:16/7;object-fit:cover}'
    +'.content{max-width:740px;margin:0 auto;padding:32px 24px}'
    +'.tag{display:inline-block;background:#B41540;color:#fff;font-size:12px;font-weight:600;padding:4px 12px;border-radius:99px;margin-bottom:12px}'
    +'h1{font-size:28px;font-weight:800;margin-bottom:8px;line-height:1.3}'
    +'.date{font-size:13px;color:#6b7280;margin-bottom:24px}'
    +'.body{font-size:15px;line-height:1.8;color:#374151}'
    +'.body h3{font-size:18px;font-weight:700;margin:24px 0 12px}'
    +'.body ul,.body ol{padding-left:24px;margin:12px 0}'
    +'.body li{margin-bottom:6px}'
    +'</style></head><body>'
    +'<div class="bar">ARTICLE PREVIEW — '+esc(lang)+'</div>'
    +'<div class="hero"><img src="'+escAttr(a.img)+'" alt=""></div>'
    +'<div class="content">'
    +'<span class="tag">'+esc(tag)+'</span>'
    +'<h1>'+esc(title)+'</h1>'
    +'<div class="date">'+esc(a.date)+'</div>'
    +'<div class="body">'+body+'</div>'
    +'</div></body></html>');
  pw.document.close();
};

// CMS initialization
_adminCurrentUser = sessionStorage.getItem("ecap_admin_user");
