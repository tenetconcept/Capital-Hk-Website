// ============================================
// CMS MODULE — Auth, 2FA, RBAC, Editor, Files, Users
// ============================================

// CKEditor instance store: key = textarea-id, value = editor instance
var _cmsEditors = {};
var _ckLoaded = typeof ClassicEditor !== 'undefined';
var _ckLoading = false;
function _loadCKEditor(cb){
  if(_ckLoaded){ if(cb) cb(); return; }
  if(_ckLoading){ setTimeout(function(){ _loadCKEditor(cb); }, 200); return; }
  _ckLoading = true;
  var s = document.createElement('script');
  s.src = 'https://cdn.ckeditor.com/ckeditor5/41.4.2/classic/ckeditor.js';
  s.onload = function(){ _ckLoaded = true; _ckLoading = false; if(cb) cb(); };
  s.onerror = function(){ _ckLoading = false; };
  document.head.appendChild(s);
}

// ————— Drag-and-drop list reordering —————
// Attach native HTML5 DnD to a list container. Direct children with draggable="true" become sortable.
// onSwap(fromIdx, toIdx) is called when user drops one item onto another.
function _cmsDndInit(listEl, onSwap){
  if(!listEl) return;
  var dragSrc = null;
  function attach(el){
    el.addEventListener('dragstart', function(e){
      // Skip if drag started from an input/textarea/select/button (let native behaviour handle those)
      var tag = (e.target.tagName||'').toLowerCase();
      if(tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button') return;
      dragSrc = el;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(function(){ el.classList.add('dnd-dragging'); }, 0);
    });
    el.addEventListener('dragend', function(){
      el.classList.remove('dnd-dragging');
      listEl.querySelectorAll('.dnd-over').forEach(function(x){ x.classList.remove('dnd-over'); });
      dragSrc = null;
    });
    el.addEventListener('dragover', function(e){
      if(!dragSrc || dragSrc === el) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      listEl.querySelectorAll('.dnd-over').forEach(function(x){ x.classList.remove('dnd-over'); });
      el.classList.add('dnd-over');
    });
    el.addEventListener('dragleave', function(e){
      if(!el.contains(e.relatedTarget)) el.classList.remove('dnd-over');
    });
    el.addEventListener('drop', function(e){
      e.preventDefault();
      if(dragSrc && dragSrc !== el){
        var items = Array.from(listEl.querySelectorAll(':scope > [draggable]'));
        var from = items.indexOf(dragSrc), to = items.indexOf(el);
        if(from !== -1 && to !== -1) onSwap(from, to);
      }
    });
  }
  listEl.querySelectorAll(':scope > [draggable]').forEach(attach);
}

// ————— CKEditor custom upload adapter plugin —————
// Saves uploaded images to the CMS file library (localStorage) and returns the data URL.
function _cmsCkUploadPlugin(editor){
  try{
    if(!editor.plugins || !editor.plugins.has('FileRepository')) return;
    editor.plugins.get('FileRepository').createUploadAdapter = function(loader){
      return {
        upload: function(){
          return loader.file.then(function(file){
            return new Promise(function(resolve, reject){
              var reader = new FileReader();
              reader.onload = function(e){
                var rawUrl = e.target.result;
                var isImg = file.type && file.type.indexOf('image/') === 0;
                function finish(url){
                  var files = getCmsFiles();
                  files.push({
                    id: 'f'+Date.now()+Math.random().toString(36).substr(2,4),
                    name: file.name, desc: '', type: file.type, size: file.size,
                    url: url, isLocal: true,
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: sessionStorage.getItem('ecap_admin_user')||'admin'
                  });
                  saveCmsFiles(files);
                  showToast(CL('saved')+file.name);
                  resolve({ default: url });
                }
                if(isImg){
                  // Resize image to max 1200px for localStorage savings
                  var img = new Image();
                  img.onload = function(){
                    var MAX_W = 1200;
                    var w = img.width, h = img.height;
                    if(w > MAX_W){ h = Math.round(h * MAX_W / w); w = MAX_W; }
                    var canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    finish(canvas.toDataURL('image/jpeg', 0.82));
                  };
                  img.onerror = function(){ finish(rawUrl); };
                  img.src = rawUrl;
                } else {
                  finish(rawUrl);
                }
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          });
        },
        abort: function(){}
      };
    };
  }catch(e){ console.warn('CKEditor upload adapter error:', e); }
}

// ————— CKEditor: upload any file (doc/pdf/ppt/img) and insert into editor —————
window._cmsCkFileUpload = function(input, taId){
  var file = input && input.files && input.files[0];
  if(!file){ return; }
  if(file.size > 2*1024*1024){ showToast(CL('file_too_big')); input.value=''; return; }
  var reader = new FileReader();
  reader.onload = function(e){
    var rawUrl = e.target.result;
    var isImg = /\.(jpe?g|png|gif|webp|svg)$/i.test(file.name) || (file.type && file.type.indexOf('image/') === 0);

    function finish(url){
      // Save to CMS file library
      var files = getCmsFiles();
      files.push({
        id: 'f'+Date.now()+Math.random().toString(36).substr(2,4),
        name: file.name, desc: '', type: file.type||'application/octet-stream', size: file.size,
        url: url, isLocal: true,
        uploadedAt: new Date().toISOString(),
        uploadedBy: sessionStorage.getItem('ecap_admin_user')||'admin'
      });
      saveCmsFiles(files);
      // Insert into CKEditor
      var editor = _cmsEditors[taId];
      if(!editor){ showToast(CL('editor_not_ready')); input.value=''; return; }
      var snippet;
      if(isImg){
        snippet = '<img src="'+url+'" alt="'+file.name.replace(/"/g,'&quot;')+'" style="max-width:100%;height:auto"/>';
      } else {
        snippet = '<a href="'+url+'" download="'+file.name.replace(/"/g,'&quot;')+'">'+file.name.replace(/</g,'&lt;')+'</a>';
      }
      try{
        var viewFragment = editor.data.processor.toView(snippet);
        var modelFragment = editor.data.toModel(viewFragment);
        editor.model.insertContent(modelFragment);
      }catch(err){
        editor.setData(editor.getData() + snippet);
      }
      showToast(CL('saved') + file.name);
      input.value = '';
    }

    if(isImg){
      // Resize image to max 1200px
      var img = new Image();
      img.onload = function(){
        var MAX_W = 1200;
        var w = img.width, h = img.height;
        if(w > MAX_W){ h = Math.round(h * MAX_W / w); w = MAX_W; }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        finish(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function(){ finish(rawUrl); };
      img.src = rawUrl;
    } else {
      finish(rawUrl);
    }
  };
  reader.readAsDataURL(file);
};

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
  tab_files:       {en:'File Manager', hans:'档案管理', hant:'檔案管理'},
  tab_home:        {en:'Homepage', hans:'首页', hant:'首頁'},
  tab_home_desc:   {en:'banners & content', hans:'横幅及内容', hant:'橫幅及內容'},
  home_hero:       {en:'Hero Section', hans:'主视觉', hant:'主視覺'},
  home_banners:    {en:'Banner Carousel', hans:'横幅轮播', hant:'橫幅輪播'},
  home_svc1:       {en:'Securities Trading', hans:'股票交易', hant:'股票交易'},
  home_svc2:       {en:'SH-HK Stock Connect', hans:'沪港通', hant:'滬港通'},
  home_svc3:       {en:'Futures & Options', hans:'期货及期权', hant:'期貨及期權'},
  home_cta:        {en:'CTA Section', hans:'行动呼吁', hant:'行動呼籲'},
  home_label:      {en:'Label', hans:'标签', hant:'標籤'},
  home_title:      {en:'Title (HTML OK)', hans:'标题（可用HTML）', hant:'標題（可用HTML）'},
  home_subtitle:   {en:'Subtitle', hans:'副标题', hant:'副標題'},
  home_desc:       {en:'Description', hans:'描述', hant:'描述'},
  home_img:        {en:'Image URL', hans:'图片网址', hant:'圖片網址'},
  home_badge:      {en:'Badge Text', hans:'徽章文字', hant:'徽章文字'},
  home_saved:      {en:'Homepage saved', hans:'首页已保存', hant:'首頁已儲存'},
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
  insert_dl:       {en:'Insert from Library', hans:'从文件库插入', hant:'從檔案庫插入'},
  upload_insert:   {en:'Upload & Insert', hans:'上传并插入', hant:'上傳並插入'},
  file_too_big:    {en:'File too large (max 2 MB)', hans:'文件过大（最大 2 MB）', hant:'檔案過大（最大 2 MB）'},
  editor_not_ready:{en:'Editor not ready', hans:'编辑器未就绪', hant:'編輯器未就緒'},
  read_only:       {en:'Read-only', hans:'只读', hant:'唯讀'},
  save_changes:    {en:'Save Changes', hans:'保存修改', hant:'儲存變更'},
  view_page:       {en:'View Page', hans:'查看页面', hant:'查看頁面'},
  viewer_nosave:   {en:'Viewer mode — cannot save', hans:'查看模式 — 无法保存', hant:'查看模式 — 無法儲存'},
  preview:         {en:'Preview', hans:'预览', hant:'預覽'},
  saved:           {en:'Saved: ', hans:'已保存: ', hant:'已儲存: '},
  // Export/Import
  exported:        {en:'Exported JSON (pages+banners+blog+files)', hans:'已导出JSON（页面+横幅+文章+文件）', hant:'已匯出JSON（頁面+橫幅+文章+檔案）'},
  imported:        {en:'Imported successfully', hans:'导入成功', hant:'匯入成功'},
  invalid_json:    {en:'Invalid JSON file', hans:'无效的JSON文件', hant:'無效的JSON檔案'},
  // Files
  files_title:     {en:'File Manager', hans:'档案管理', hant:'檔案管理'},
  files_desc:      {en:'Upload files or add external links. Copy the HTML snippet to paste into any page body.', hans:'上传文件或添加外部链接。复制HTML代码片段可粘贴到任何页面中。', hant:'上傳檔案或添加外部連結。複製HTML程式碼可貼到任何頁面中。'},
  drag_drop:       {en:'Drag & drop', hans:'拖放', hant:'拖放'},
  dnd_hint:        {en:'Drag cards to reorder', hans:'拖动卡片以重新排序', hant:'拖動卡片以重新排序'},
  ck_help:         {en:'Editor Help', hans:'编辑器帮助', hant:'編輯器説明'},
  ck_help_title:   {en:'Editor Guide', hans:'编辑器说明', hant:'編輯器説明'},
  tab_nav:         {en:'Navigation', hans:'导航', hant:'導航'},
  tab_nav_desc:    {en:'Manage website navigation menu', hans:'管理网站导航菜单', hant:'管理網站導航選單'},
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
  banners_title:   {en:'Homepage Banner Carousel', hans:'首页横幅轮播', hant:'首頁橫幅輪播'},
  banners_desc:    {en:'These banners display in the <strong>sliding carousel at the top of the homepage</strong>, below the hero section. Upload JPG/PNG images. Recommended size: <strong>1200&times;500px</strong>. Max 5MB each.', hans:'这些横幅显示在<strong>首页顶部的滑动轮播区域</strong>，位于主视觉下方。上传JPG/PNG图片。建议尺寸：<strong>1200&times;500px</strong>。每张最大5MB。', hant:'這些橫幅顯示在<strong>首頁頂部的滑動輪播區域</strong>，位於主視覺下方。上傳JPG/PNG圖片。建議尺寸：<strong>1200&times;500px</strong>。每張最大5MB。'},
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
  no_banners:      {en:'No banners yet.', hans:'暂无横幅。', hant:'暫無橫幅。'},
  add_banner:      {en:'Add Banner', hans:'新增横幅', hant:'新增橫幅'},
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
  btn_preview:     {en:'Preview', hans:'预览', hant:'預覽'},
  btn_move_up:     {en:'Move Up', hans:'上移', hant:'上移'},
  btn_move_down:   {en:'Move Down', hans:'下移', hant:'下移'},
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
  audit_log_desc:  {en:'Recent login activity. Shows user, action, IP address, and timestamp.', hans:'最近的登录活动。显示用户、操作、IP地址及时间。', hant:'最近的登入活動。顯示用戶、操作、IP地址及時間。'},
  audit_col_time:  {en:'Time', hans:'时间', hant:'時間'},
  audit_col_user:  {en:'User', hans:'用户', hant:'用戶'},
  audit_col_action:{en:'Action', hans:'操作', hant:'操作'},
  audit_col_ip:    {en:'IP Address', hans:'IP地址', hant:'IP地址'},
  audit_col_detail:{en:'Detail', hans:'详情', hant:'詳情'},
  clear_log:       {en:'Clear Log', hans:'清除日志', hant:'清除日誌'},
  clear_log_q:     {en:'Clear audit log?', hans:'清除审计日志？', hant:'清除稽核日誌？'},
  clear_filter:    {en:'Clear', hans:'清除', hant:'清除'},
  csv_filtered_q:  {en:'Export only the filtered date range? (Cancel = export all)', hans:'只导出筛选的日期范围？（取消 = 导出全部）', hant:'只匯出篩選的日期範圍？（取消 = 匯出全部）'},
  ip_addr:         {en:'IP Address', hans:'IP 地址', hant:'IP 地址'},
  label_opt:       {en:'Label (optional)', hans:'标签（可选）', hant:'標籤（可選）'},
  add_ip:          {en:'Add IP', hans:'添加IP', hant:'新增IP'},
  add_my_ip:       {en:'Add My Current IP', hans:'添加我当前的IP', hant:'新增我目前的IP'},
  timeout_min:     {en:'Timeout (minutes)', hans:'超时（分钟）', hant:'逾時（分鐘）'},
  save:            {en:'Save', hans:'保存', hant:'儲存'},
  no_log:          {en:'No log entries yet.', hans:'暂无日志。', hant:'暫無日誌。'},
  popup_blocked:   {en:'Pop-up blocked', hans:'弹窗被阻止', hant:'彈出視窗被阻擋'},
  select_first:    {en:'Select a page first', hans:'请先选择页面', hant:'請先選擇頁面'},
  // Groups & Permissions
  tab_groups:      {en:'Groups', hans:'群组', hant:'群組'},
  group_mgmt:      {en:'Group Management', hans:'群组管理', hant:'群組管理'},
  groups_total:    {en:' groups total', hans:' 个群组', hant:' 個群組'},
  add_new_group:   {en:'Add New Group', hans:'新增群组', hant:'新增群組'},
  group_name:      {en:'Group Name', hans:'群组名称', hant:'群組名稱'},
  add_group:       {en:'Add Group', hans:'新增群组', hant:'新增群組'},
  edit_group:      {en:'Edit Group', hans:'编辑群组', hant:'編輯群組'},
  delete_group:    {en:'Delete Group', hans:'删除群组', hant:'刪除群組'},
  del_group_q:     {en:'Delete this group? Users in this group will lose permissions.', hans:'删除此群组？该群组中的用户将失去权限。', hant:'刪除此群組？該群組中的用戶將失去權限。'},
  perm_section:    {en:'Section', hans:'区域', hant:'區域'},
  perm_none:       {en:'No Access', hans:'禁止存取', hant:'禁止存取'},
  perm_read:       {en:'Read', hans:'读取', hant:'讀取'},
  perm_write:      {en:'Write', hans:'写入', hant:'寫入'},
  perm_pages:      {en:'Pages', hans:'页面内容', hant:'頁面內容'},
  perm_banners:    {en:'Banners', hans:'首页横幅', hant:'首頁橫幅'},
  perm_nav:        {en:'Navigation', hans:'导航选单', hant:'導航選單'},
  perm_blog:       {en:'News Articles', hans:'新闻文章', hant:'新聞文章'},
  perm_files:      {en:'File Manager', hans:'档案管理', hant:'檔案管理'},
  perm_users:      {en:'User Management', hans:'用户管理', hant:'用戶管理'},
  perm_security:   {en:'Security Settings', hans:'安全设定', hant:'安全設定'},
  custom_perms:    {en:'Custom Permissions', hans:'自定义权限', hant:'自訂權限'},
  group_label:     {en:'Group', hans:'群组', hant:'群組'},
  no_group:        {en:'No Group (Custom)', hans:'无群组（自定义）', hant:'無群組（自訂）'},
  // Force 2FA
  force_2fa:       {en:'Force 2FA on next login', hans:'下次登录强制设置2FA', hant:'下次登入強制設定2FA'},
  force_2fa_title: {en:'Two-Factor Authentication Required', hans:'需要设置双重身份验证', hant:'需要設定雙重身份驗證'},
  force_2fa_desc:  {en:'Your administrator requires you to set up 2FA before accessing the CMS.', hans:'管理员要求您在访问CMS之前设置双重身份验证。', hant:'管理員要求您在存取CMS之前設定雙重身份驗證。'},
  force_2fa_btn:   {en:'Setup 2FA Now', hans:'立即设置2FA', hant:'立即設定2FA'},
  // Rate Limiting Config
  rate_limit:      {en:'Rate Limiting', hans:'登录限制', hant:'登入限制'},
  max_attempts:    {en:'Max login attempts', hans:'最大尝试次数', hant:'最大嘗試次數'},
  lockout_min:     {en:'Lockout duration (minutes)', hans:'锁定时间（分钟）', hant:'鎖定時間（分鐘）'},
  clear_lockouts:  {en:'Clear all lockouts', hans:'清除所有锁定', hant:'清除所有鎖定'},
  lockout_cleared: {en:'All lockouts cleared', hans:'已清除所有锁定', hant:'已清除所有鎖定'},
  rate_limit_desc: {en:'Lock out users after too many failed login attempts.', hans:'登录失败次数过多后锁定用户。', hant:'登入失敗次數過多後鎖定用戶。'},
  // Timezone
  timezone:        {en:'Timezone', hans:'时区', hant:'時區'},
  timezone_desc:   {en:'Used for 2FA time synchronization.', hans:'用于2FA时间同步。', hant:'用於2FA時間同步。'},
  // Session Timeout (per-user/group)
  session_timeout_desc: {en:'Override global timeout. 0 = use global setting.', hans:'覆盖全局超时。0 = 使用全局设置。', hant:'覆寫全域逾時。0 = 使用全域設定。'},
  // Confirm Password
  confirm_new_pwd: {en:'Confirm New Password', hans:'确认新密码', hant:'確認新密碼'},
  pwd_mismatch:    {en:'Passwords do not match.', hans:'两次密码不一致。', hant:'兩次密碼不一致。'},
  // User status / misc
  user_enabled:    {en:'Enabled', hans:'已启用', hant:'已啟用'},
  user_disabled_s: {en:'Disabled', hans:'已停用', hant:'已停用'},
  last_login:      {en:'Last login', hans:'上次登录', hant:'上次登入'},
  never:           {en:'Never', hans:'从未', hant:'從未'},
  pwd_weak:        {en:'Weak', hans:'弱', hant:'弱'},
  pwd_medium:      {en:'Medium', hans:'中等', hant:'中等'},
  pwd_strong:      {en:'Strong', hans:'强', hant:'強'},
  pwd_req_len:     {en:'At least 8 characters', hans:'至少8个字符', hant:'至少8個字元'},
  pwd_req_lower:   {en:'At least 1 lowercase letter', hans:'至少1个小写字母', hant:'至少1個小寫字母'},
  pwd_req_upper:   {en:'At least 1 uppercase letter', hans:'至少1个大写字母', hant:'至少1個大寫字母'},
  pwd_req_digit:   {en:'At least 1 digit', hans:'至少1个数字', hant:'至少1個數字'},
  pwd_req_symbol:  {en:'At least 1 special character', hans:'至少1个特殊字符', hant:'至少1個特殊符號'},
  pwd_complexity:  {en:'Password requirements:', hans:'密码要求：', hant:'密碼要求：'},
  active_ips:      {en:' active IPs', hans:' 个活跃IP', hant:' 個活躍IP'},
  off_all_ips:     {en:'Off (all IPs allowed)', hans:'关闭（允许所有IP）', hant:'關閉（允許所有IP）'},
  users_enabled:   {en:' users enabled', hans:' 个用户已启用', hant:' 個用戶已啟用'},
  no_users_2fa:    {en:'No users enabled', hans:'没有用户启用', hant:'沒有用戶啟用'},
  users_no_2fa:    {en:' users without 2FA', hans:' 个用户未启用2FA', hant:' 個用戶未啟用2FA'},
  all_users_2fa:   {en:'All users have 2FA', hans:'所有用户已启用2FA', hant:'所有用戶已啟用2FA'},
  session_fp:      {en:'Session Fingerprint', hans:'会话指纹', hant:'工作階段指紋'},
  active:          {en:'Active', hans:'活跃', hant:'活躍'},
  entries:         {en:' entries', hans:' 条记录', hant:' 條記錄'},
  concurrent_login:{en:'Concurrent Login Limit', hans:'并发登录限制', hant:'並行登入限制'},
  concurrent_desc: {en:'Maximum simultaneous sessions per user. 0 = unlimited.', hans:'每个用户最大同时会话数。0 = 不限制。', hant:'每個用戶最大同時工作階段數。0 = 不限制。'},
  concurrent_max:  {en:'Max sessions per user', hans:'每用户最大会话数', hant:'每用戶最大工作階段數'},
  concurrent_set:  {en:'Concurrent login limit set to ', hans:'并发登录限制已设置为 ', hant:'並行登入限制已設定為 '},
  active_sessions: {en:'Active Sessions', hans:'活跃会话', hant:'活躍工作階段'},
  sessions_desc:   {en:'Currently active login sessions. Admins can terminate sessions.', hans:'当前活跃的登录会话。管理员可终止会话。', hant:'目前活躍的登入工作階段。管理員可終止工作階段。'},
  kick_session:    {en:'Terminate', hans:'终止', hant:'終止'},
  kick_confirm:    {en:'Terminate this session?', hans:'终止此会话？', hant:'終止此工作階段？'},
  kicked:          {en:'Session terminated', hans:'会话已终止', hant:'工作階段已終止'},
  no_sessions:     {en:'No active sessions', hans:'无活跃会话', hant:'無活躍工作階段'},
  session_kicked:  {en:'Your session was terminated by an administrator.', hans:'您的会话已被管理员终止。', hant:'您的工作階段已被管理員終止。'},
  unlimited:       {en:'Unlimited', hans:'不限制', hant:'不限制'},
  ip_desc:         {en:'Only listed IPs can login to CMS. Leave empty to allow all IPs.', hans:'只有列出的IP才能登录CMS。留空允许所有IP。', hant:'只有列出的IP才能登入CMS。留空允許所有IP。'},
  your_ip:         {en:'Your current IP: ', hans:'您当前的IP：', hant:'您目前的IP：'},
  no_ip_restrict:  {en:'No IP restrictions. All IPs can access CMS.', hans:'无IP限制。所有IP均可访问CMS。', hant:'無IP限制。所有IP均可存取CMS。'},
  timeout_auto:    {en:'Auto-logout after inactivity. Current: ', hans:'不活动后自动登出。当前：', hant:'不活動後自動登出。目前：'},
  minutes_unit:    {en:' minutes.', hans:' 分钟。', hant:' 分鐘。'},
  remove_ip_q:     {en:'Remove IP ', hans:'移除IP ', hant:'移除IP '},
  ip_added:        {en:'IP added: ', hans:'已添加IP：', hant:'已新增IP：'},
  ip_exists:       {en:'IP already in list', hans:'IP已在列表中', hant:'IP已在列表中'},
  enter_ip:        {en:'Enter an IP address', hans:'请输入IP地址', hant:'請輸入IP地址'},
  ip_detected:     {en:'Your IP: ', hans:'您的IP：', hant:'您的IP：'},
  ip_detect_fail:  {en:'Could not detect IP', hans:'无法检测IP', hant:'無法偵測IP'},
  ip_removed:      {en:'IP removed', hans:'IP已移除', hant:'IP已移除'},
  timeout_set:     {en:'Session timeout set to ', hans:'会话超时已设置为 ', hant:'工作階段逾時已設定為 '},
  user_toggled:    {en:' toggled', hans:' 已切换', hant:' 已切換'},
  user_updated:    {en:'User updated: ', hans:'用户已更新：', hant:'用戶已更新：'},
  user_not_found:  {en:'User not found', hans:'用户未找到', hant:'找不到用戶'},
  pwd_min6:        {en:'Password must be at least 6 characters.', hans:'密码至少需要6个字符。', hant:'密碼至少需要6個字元。'},
  new_pwd_blank:   {en:'New Password (leave blank to keep)', hans:'新密码（留空保持不变）', hant:'新密碼（留空保持不變）'},
  enter_username:  {en:'Enter a username.', hans:'请输入用户名。', hant:'請輸入用戶名。'},
  pwd_min8:        {en:'Password must be at least 8 characters.', hans:'密码至少需要8个字符。', hant:'密碼至少需要8個字元。'},
  pwd_too_weak:    {en:'Password too weak. Use uppercase, lowercase, numbers.', hans:'密码太弱。请使用大小写字母和数字。', hant:'密碼太弱。請使用大小寫字母和數字。'},
  username_exists: {en:'Username already exists.', hans:'用户名已存在。', hant:'用戶名已存在。'},
  user_added:      {en:'User added: ', hans:'用户已添加：', hant:'用戶已新增：'},
  user_as:         {en:' as ', hans:' 角色 ', hant:' 角色 '},
  default_admin_hint:{en:'Using default admin account. Add users below to replace it.', hans:'使用默认管理员帐户。在下方添加用户以替换。', hant:'使用預設管理員帳戶。在下方新增用戶以替換。'},
  reset_2fa_q:     {en:'Reset 2FA for {0}? They will need to set it up again.', hans:'重置 {0} 的2FA？他们需要重新设置。', hant:'重設 {0} 的2FA？他們需要重新設定。'},
  twofa_reset:     {en:'2FA reset for {0}.', hans:'{0} 的2FA已重置。', hant:'{0} 的2FA已重設。'},
  twofa_disabled:  {en:'2FA disabled for {0}.', hans:'{0} 的2FA已停用。', hant:'{0} 的2FA已停用。'},
  twofa_enabled:   {en:'2FA enabled for {0}.', hans:'{0} 的2FA已启用。', hant:'{0} 的2FA已啟用。'},
  twofa_already:   {en:'2FA is already enabled for {0}. Disable it?', hans:'{0} 已启用2FA。是否停用？', hant:'{0} 已啟用2FA。是否停用？'},
  setup_2fa_for:   {en:'Setup 2FA for {0}', hans:'为 {0} 设置2FA', hant:'為 {0} 設定2FA'},
  scan_qr:         {en:'Scan this QR code with Google Authenticator, Authy, or any TOTP app.', hans:'使用Google Authenticator、Authy或任何TOTP应用扫描此二维码。', hant:'使用Google Authenticator、Authy或任何TOTP應用程式掃描此QR碼。'},
  enter_code_verify:{en:'Enter a code from the app to verify setup:', hans:'输入应用中的验证码以验证设置：', hant:'輸入應用程式中的驗證碼以驗證設定：'},
  verify_enable:   {en:'Verify & Enable', hans:'验证并启用', hant:'驗證並啟用'},
  enter_6digit:    {en:'Enter 6-digit code', hans:'请输入6位数字', hant:'請輸入6位數字'},
  invalid_code_retry:{en:'Invalid code. Check your app and try again.', hans:'验证码无效。请检查应用后重试。', hant:'驗證碼無效。請檢查應用程式後重試。'},
  remove_user_q:   {en:'Remove user \'{0}\'?', hans:'移除用户 \'{0}\'？', hant:'移除用戶 \'{0}\'？'},
  removed_user:    {en:'Removed: {0}', hans:'已移除：{0}', hant:'已移除：{0}'},
  pwd_updated:     {en:'Password updated successfully.', hans:'密码更新成功。', hant:'密碼更新成功。'},
  pwd_incorrect:   {en:'Current password is incorrect.', hans:'当前密码不正确。', hant:'目前密碼不正確。'},
  pwd_char_req:    {en:'Password too weak. Use uppercase, lowercase, numbers and symbols.', hans:'密码太弱。请使用大小写字母、数字和符号。', hant:'密碼太弱。請使用大小寫字母、數字和符號。'},
  file_only_types: {en:'Only PDF, DOC, DOCX, JPG, PNG files allowed', hans:'仅允许PDF、DOC、DOCX、JPG、PNG文件', hant:'僅允許PDF、DOC、DOCX、JPG、PNG檔案'},
  file_too_large:  {en:'File too large (max 2MB)', hans:'文件太大（最大2MB）', hant:'檔案太大（最大2MB）'},
  uploaded_file:   {en:'Uploaded: ', hans:'已上传：', hant:'已上傳：'},
  added_file:      {en:'Added: ', hans:'已添加：', hant:'已新增：'},
  img_only_types:  {en:'Only JPG, PNG, WebP', hans:'仅限JPG、PNG、WebP', hant:'僅限JPG、PNG、WebP'},
  img_too_large:   {en:'Too large (max 5MB)', hans:'太大（最大5MB）', hant:'太大（最大5MB）'},
  added_banner:    {en:'Added banner: ', hans:'已添加横幅：', hant:'已新增橫幅：'},
  enter_img_url:   {en:'Enter an image URL', hans:'请输入图片网址', hant:'請輸入圖片網址'},
  added_banner_s:  {en:'Added banner', hans:'已添加横幅', hant:'已新增橫幅'},
  no_banners_preview:{en:'No banners to preview', hans:'没有横幅可预览', hant:'沒有橫幅可預覽'},
  article_not_found:{en:'Article not found', hans:'找不到文章', hant:'找不到文章'},
  slug_prefix:     {en:'Slug must start with "hk-news-"', hans:'Slug必须以"hk-news-"开头', hant:'Slug必須以"hk-news-"開頭'},
  enter_title_hant:{en:'Please enter a title (繁體)', hans:'请输入标题（繁体）', hant:'請輸入標題（繁體）'},
  slug_exists:     {en:'Slug already exists', hans:'Slug已存在', hant:'Slug已存在'},
  img_resized:     {en:'Image resized to 1200×525px', hans:'图片已调整为1200×525px', hant:'圖片已調整為1200×525px'},
  view_only_msg:   {en:'View only — editor or admin access needed.', hans:'仅查看 — 需要编辑或管理员权限。', hant:'僅檢視 — 需要編輯或管理員權限。'},
  insert_dl_title: {en:'Insert Download Link', hans:'插入下载链接', hant:'插入下載連結'},
  no_files_dl:     {en:'No files yet. Go to the File Manager tab to upload files first.', hans:'暂无文件。请先到档案管理标签上传文件。', hant:'暫無檔案。請先到檔案管理標籤上傳檔案。'},
  select_file:     {en:'Select file to insert', hans:'选择要插入的文件', hant:'選擇要插入的檔案'},
  inserted_file:   {en:'Inserted: ', hans:'已插入：', hant:'已插入：'},
  textarea_err:    {en:'Textarea not found', hans:'找不到文本框', hant:'找不到文字框'},
  my_ip:           {en:'My IP', hans:'我的IP', hant:'我的IP'},
  banner_preview:  {en:'BANNER PREVIEW', hans:'横幅预览', hant:'橫幅預覽'},
  slides_unit:     {en:' slides', hans:' 张幻灯片', hant:' 張幻燈片'},
  article_preview: {en:'ARTICLE PREVIEW', hans:'文章预览', hant:'文章預覽'},
  preview_mode:    {en:'PREVIEW MODE', hans:'预览模式', hant:'預覽模式'},
  unsaved_inc:     {en:'unsaved changes included', hans:'包含未保存的更改', hant:'包含未儲存的變更'},
  auto_gen_pwd:    {en:'Auto-generated password', hans:'自动生成密码', hant:'自動生成密碼'},
  // Homepage extended — hero buttons, CTA steps, stats, marquee, footer, nav, order
  home_cta1_text:  {en:'Button 1 Text', hans:'按钮1文字', hant:'按鈕1文字'},
  home_cta1_link:  {en:'Button 1 Link', hans:'按钮1连结', hant:'按鈕1連結'},
  home_cta2_text:  {en:'Button 2 Text', hans:'按钮2文字', hant:'按鈕2文字'},
  home_cta2_link:  {en:'Button 2 Link', hans:'按钮2连结', hant:'按鈕2連結'},
  home_steps:      {en:'Steps', hans:'步骤', hant:'步驟'},
  home_step:       {en:'Step', hans:'步骤', hant:'步驟'},
  home_stats:      {en:'Stats / Numbers', hans:'数据统计', hant:'數據統計'},
  home_stat_num:   {en:'Number', hans:'数字', hant:'數字'},
  home_stat_label: {en:'Label', hans:'标签', hant:'標籤'},
  home_add_item:   {en:'+ Add Item', hans:'+ 新增项目', hant:'+ 新增項目'},
  home_remove:     {en:'Remove', hans:'移除', hant:'移除'},
  home_marquee:    {en:'Group Marquee', hans:'集团走马灯', hant:'集團走馬燈'},
  home_marquee_title:{en:'Marquee Title', hans:'走马灯标题', hant:'走馬燈標題'},
  home_logos:      {en:'Partner Logos', hans:'合作伙伴标志', hant:'合作夥伴標誌'},
  home_logo_name:  {en:'Name', hans:'名称', hant:'名稱'},
  home_logo_img:   {en:'Image URL', hans:'图片网址', hant:'圖片網址'},
  home_groups:     {en:'Group Names', hans:'集团名称', hant:'集團名稱'},
  home_group_name: {en:'Name', hans:'名称', hant:'名稱'},
  home_features:   {en:'Sub-features', hans:'子功能', hant:'子功能'},
  home_feat_title: {en:'Feature Title', hans:'功能标题', hant:'功能標題'},
  home_feat_desc:  {en:'Feature Desc', hans:'功能描述', hant:'功能描述'},
  home_footer:     {en:'Footer', hans:'页尾', hant:'頁尾'},
  footer_brand:    {en:'Company Name', hans:'公司名称', hant:'公司名稱'},
  footer_address:  {en:'Address', hans:'地址', hant:'地址'},
  footer_tel:      {en:'Tel', hans:'电话', hant:'電話'},
  footer_fax:      {en:'Fax', hans:'传真', hant:'傳真'},
  footer_col_title:{en:'Column Title', hans:'栏目标题', hant:'欄目標題'},
  footer_link_text:{en:'Link Text', hans:'连结文字', hant:'連結文字'},
  footer_link_href:{en:'Link URL', hans:'连结网址', hant:'連結網址'},
  footer_add_col:  {en:'+ Add Column', hans:'+ 新增栏目', hant:'+ 新增欄目'},
  footer_add_link: {en:'+ Add Link', hans:'+ 新增连结', hant:'+ 新增連結'},
  footer_copyright:{en:'Copyright', hans:'版权', hant:'版權'},
  home_nav:        {en:'Navigation Menu', hans:'导航菜单', hant:'導航選單'},
  nav_item_label:  {en:'Label', hans:'标签', hant:'標籤'},
  nav_item_page:   {en:'Page Slug', hans:'页面Slug', hant:'頁面Slug'},
  nav_item_ext:    {en:'External URL', hans:'外部连结', hant:'外部連結'},
  nav_add_item:    {en:'+ Add Item', hans:'+ 新增项目', hant:'+ 新增項目'},
  nav_add_child:   {en:'+ Add Sub-item', hans:'+ 新增子项', hant:'+ 新增子項'},
  nav_add_group:   {en:'+ Add Group', hans:'+ 新增群组', hant:'+ 新增群組'},
  nav_reset:       {en:'Reset to Default', hans:'重置为默认', hant:'重設為預設'},
  nav_reset_q:     {en:'Reset navigation to default? This cannot be undone.', hans:'重置导航为默认？此操作无法撤销。', hant:'重設導航為預設？此操作無法撤銷。'},
  nav_saved:       {en:'Navigation saved', hans:'导航已保存', hant:'導航已儲存'},
  home_order:      {en:'Section Order', hans:'区块排序', hant:'區塊排序'},
  section_hero:    {en:'Hero', hans:'主视觉', hant:'主視覺'},
  section_banners: {en:'Banners', hans:'横幅轮播', hant:'橫幅輪播'},
  section_marquee: {en:'Marquee', hans:'走马灯', hant:'走馬燈'},
  section_svc1:    {en:'Securities', hans:'股票交易', hant:'股票交易'},
  section_svc2:    {en:'Stock Connect', hans:'沪港通', hant:'滬港通'},
  section_svc3:    {en:'Futures', hans:'期货', hant:'期貨'},
  section_stats:   {en:'Stats', hans:'数据统计', hant:'數據統計'},
  section_news:    {en:'News', hans:'新闻', hant:'新聞'},
  section_cta:     {en:'CTA', hans:'行动呼吁', hant:'行動呼籲'},
  order_saved:     {en:'Section order saved', hans:'区块排序已保存', hant:'區塊排序已儲存'},
  footer_saved:    {en:'Footer saved', hans:'页尾已保存', hant:'頁尾已儲存'},
  expand_all:      {en:'Expand All', hans:'展开全部', hant:'展開全部'},
  collapse_all:    {en:'Collapse All', hans:'收合全部', hant:'收合全部'},
  copy_pwd:        {en:'Copy', hans:'复制', hant:'複製'},
  pwd_copied:      {en:'Password copied to clipboard', hans:'密码已复制到剪贴板', hant:'密碼已複製到剪貼簿'},
  must_change_pwd: {en:'Must change password on first login', hans:'首次登录必须更改密码', hant:'首次登入必須更改密碼'},
  force_change_title:{en:'Change Your Password', hans:'更改您的密码', hant:'更改您的密碼'},
  force_change_desc:{en:'You must change your password before continuing.', hans:'您必须更改密码才能继续。', hant:'您必須更改密碼才能繼續。'},
  new_pwd_label:   {en:'New Password', hans:'新密码', hant:'新密碼'},
  confirm_pwd_label:{en:'Confirm Password', hans:'确认密码', hant:'確認密碼'},
  change_continue: {en:'Change & Continue', hans:'更改并继续', hant:'更改並繼續'},
  tz_hongkong:     {en:'Hong Kong', hans:'香港', hant:'香港'},
  tz_shanghai:     {en:'Shanghai', hans:'上海', hant:'上海'},
  tz_taipei:       {en:'Taipei', hans:'台北', hant:'台北'},
  tz_tokyo:        {en:'Tokyo', hans:'东京', hant:'東京'},
  tz_singapore:    {en:'Singapore', hans:'新加坡', hant:'新加坡'},
  tz_seoul:        {en:'Seoul', hans:'首尔', hant:'首爾'},
  tz_bangkok:      {en:'Bangkok', hans:'曼谷', hant:'曼谷'},
  tz_london:       {en:'London', hans:'伦敦', hant:'倫敦'},
  tz_newyork:      {en:'New York', hans:'纽约', hant:'紐約'},
  tz_losangeles:   {en:'Los Angeles', hans:'洛杉矶', hant:'洛杉磯'},
  tz_utc:          {en:'UTC', hans:'UTC', hant:'UTC'},
  tz_custom:       {en:'Custom', hans:'自定义', hant:'自訂'},
  utc_offset:      {en:'UTC Offset', hans:'UTC偏移', hant:'UTC偏移'},
  cms_mobile_block:{en:'CMS is only available on desktop devices. Please use a computer to access the management system.', hans:'CMS仅在桌面设备上可用。请使用电脑访问管理系统。', hant:'CMS僅在桌面裝置上可用。請使用電腦存取管理系統。'},
  go_home:         {en:'Go to Homepage', hans:'返回首页', hant:'返回首頁'},
  export_json:     {en:'Export', hans:'导出', hant:'匯出'},
  import_json:     {en:'Import', hans:'导入', hant:'匯入'},
  export_csv:      {en:'Export CSV', hans:'导出 CSV', hant:'匯出 CSV'},
  backup_restore:  {en:'Backup & Restore', hans:'备份与还原', hant:'備份與還原'},
  backup_desc:     {en:'Export all CMS data (pages, blog, files, banners, nav) as JSON backup. Restore from a previously exported file.', hans:'将所有CMS数据（页面、文章、文件、横幅、导航）导出为JSON备份。从之前导出的文件还原。', hant:'將所有CMS資料（頁面、文章、檔案、橫幅、導航）匯出為JSON備份。從之前匯出的檔案還原。'},
  backup_export:   {en:'Backup (Export)', hans:'备份（导出）', hant:'備份（匯出）'},
  backup_import:   {en:'Restore (Import)', hans:'还原（导入）', hant:'還原（匯入）'},
  nav_menu_desc:   {en:'Manage website menu items — drag to reorder, click edit to change labels & links', hans:'管理网站菜单项目 — 拖动排序，点击编辑更改标签及链接', hant:'管理網站選單項目 — 拖動排序，點擊編輯更改標籤及連結'}
};
function CL(key){ var lang=window.currentLang||'zh-Hant'; var e=CMS_I18N[key]; if(!e) return key; if(lang==='en') return e.en; if(lang==='zh-Hans') return e.hans; return e.hant; }

// ————— Dynamic header action buttons —————
// Updates the CMS header bar actions based on current context
window._cmsUpdateHeaderActions = function(btns){
  var el = document.getElementById('cmsHeaderActions');
  if(!el) return;
  el.innerHTML = btns || '';
};

// ————— Page transition helper —————
window._cmsTransition = function(targetEl){
  if(!targetEl) return;
  targetEl.style.opacity = '0';
  targetEl.style.transform = 'translateY(8px)';
  targetEl.style.transition = 'opacity .25s ease, transform .25s ease';
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      targetEl.style.opacity = '1';
      targetEl.style.transform = 'translateY(0)';
    });
  });
};

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
function addAuditLog(action, detail, overrideUser){
  var log = getAuditLog();
  log.unshift({time:new Date().toISOString(), user:overrideUser||sessionStorage.getItem('ecap_admin_user')||'unknown', action:action, detail:detail||'', ip:sessionStorage.getItem('ecap_client_ip')||''});
  if(log.length > 100) log = log.slice(0,100);
  localStorage.setItem(CMS_AUDIT_KEY, JSON.stringify(log));
}
function getSessionTimeout(){ return parseInt(localStorage.getItem(CMS_SESSION_TIMEOUT_KEY))||30; }
function saveSessionTimeout(m){ localStorage.setItem(CMS_SESSION_TIMEOUT_KEY, String(m)); }
function sha256hex(s){ try{ return crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)).then(function(b){return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,"0");}).join("");}); }catch(e){ return Promise.reject(e); } }
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
// Verify TOTP with +/- 2 window tolerance (±60s for clock drift)
function verifyTOTP(secret,token){
  var now=Math.floor(Date.now()/1000);
  return Promise.all([generateTOTP(secret,now-60),generateTOTP(secret,now-30),generateTOTP(secret,now),generateTOTP(secret,now+30),generateTOTP(secret,now+60)]).then(function(codes){
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
    console.log('[CMS Login] user:', username, 'hash:', hash.slice(0,8)+'...', 'users:', users.length);
    if(users.length > 0){
      var userByName = users.find(function(u){ return u.username===username; });
      if(userByName){
        console.log('[CMS Login] found user:', userByName.username, 'enabled:', userByName.enabled);
        console.log('[CMS Login] stored hash:', userByName.hash);
        console.log('[CMS Login] login hash: ', hash);
        if(userByName.enabled===false) return {error:"disabled"};
        if(userByName.hash===hash) return {username:userByName.username, role:userByName.role||"admin"};
        // Hash mismatch — also try trimmed password (in case whitespace)
        return sha256hex(pass.trim()).then(function(h2){
          console.log('[CMS Login] trim hash: ', h2);
          if(userByName.hash===h2) return {username:userByName.username, role:userByName.role||"admin"};
          console.warn('[CMS Login] HASH MISMATCH for', username, '— stored:', userByName.hash, 'got:', hash);
          return {error:"wrong_password"};
        });
      }
      // Fallback: always allow default admin even when custom users exist
      if(username==="admin" && hash===ADMIN_HASH) return {username:"admin", role:"admin"};
      console.warn('[CMS Login] user not found:', username);
      return {error:"not_found"};
    }
    if(username==="admin" && hash===ADMIN_HASH) return {username:"admin", role:"admin"};
    return {error:"not_found"};
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
  var cfg = getRateLimitConfig();
  var lockoutMinutes = cfg.lockoutMinutes||15;
  var maxAttempts = cfg.maxAttempts||5;
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

function generatePassword(len){
  len = len || 16;
  var upper='ABCDEFGHJKLMNPQRSTUVWXYZ',lower='abcdefghjkmnpqrstuvwxyz',digits='23456789',symbols='!@#$%&*';
  var all=upper+lower+digits+symbols;
  var pwd=[upper[Math.floor(Math.random()*upper.length)],lower[Math.floor(Math.random()*lower.length)],digits[Math.floor(Math.random()*digits.length)],symbols[Math.floor(Math.random()*symbols.length)]];
  for(var i=4;i<len;i++) pwd.push(all[Math.floor(Math.random()*all.length)]);
  for(var j=pwd.length-1;j>0;j--){var k=Math.floor(Math.random()*(j+1));var t=pwd[j];pwd[j]=pwd[k];pwd[k]=t;}
  return pwd.join('');
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
  if(score <= 2) return {level:'weak', color:'#dc2626', label:CL('pwd_weak')};
  if(score <= 4) return {level:'medium', color:'#f59e0b', label:CL('pwd_medium')};
  return {level:'strong', color:'#059669', label:CL('pwd_strong')};
}
function validatePasswordComplexity(pass){
  var errors = [];
  if(pass.length < 8) errors.push(CL('pwd_req_len'));
  if(!/[a-z]/.test(pass)) errors.push(CL('pwd_req_lower'));
  if(!/[A-Z]/.test(pass)) errors.push(CL('pwd_req_upper'));
  if(!/[0-9]/.test(pass)) errors.push(CL('pwd_req_digit'));
  if(!/[^a-zA-Z0-9]/.test(pass)) errors.push(CL('pwd_req_symbol'));
  return errors;
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
// Accepts optional username to check user/group-level whitelist
function checkIpWhitelist(username){
  var whitelist = username ? getEffectiveIpWhitelist(username) : getIpWhitelist();
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
// ————— GRANULAR PERMISSION SYSTEM —————
var CMS_SECTIONS = ['pages','blog','files','users','security'];
var CMS_PERM_ACTIONS = ['read','write'];
var CMS_GROUPS_KEY = 'ecap_cms_groups';
var CMS_RATELIMIT_KEY = 'ecap_cms_ratelimit';

function getCmsGroups(){ try{ return JSON.parse(localStorage.getItem(CMS_GROUPS_KEY))||[]; }catch(e){ return []; } }
function saveCmsGroups(d){ localStorage.setItem(CMS_GROUPS_KEY, JSON.stringify(d)); }
function getRateLimitConfig(){ try{ var d=JSON.parse(localStorage.getItem(CMS_RATELIMIT_KEY)); return d||{maxAttempts:5,lockoutMinutes:15}; }catch(e){ return {maxAttempts:5,lockoutMinutes:15}; } }
function saveRateLimitConfig(d){ localStorage.setItem(CMS_RATELIMIT_KEY, JSON.stringify(d)); }

// Concurrent login settings
function getConcurrentLimit(){ return parseInt(localStorage.getItem('ecap_concurrent_limit')||'0',10); }
function setConcurrentLimit(n){ localStorage.setItem('ecap_concurrent_limit', String(n)); }
window.getConcurrentLimit = getConcurrentLimit;

// Active sessions management
var SESSION_TAB_ID = sessionStorage.getItem('ecap_tab_id') || ('tab_'+Date.now()+'_'+Math.random().toString(36).substr(2,6));
sessionStorage.setItem('ecap_tab_id', SESSION_TAB_ID);
window._sessionTabId = SESSION_TAB_ID;

function getActiveSessions(){ try{ return JSON.parse(localStorage.getItem('ecap_active_sessions')||'[]'); }catch(e){ return []; } }
function saveActiveSessions(s){ localStorage.setItem('ecap_active_sessions', JSON.stringify(s)); }

function registerSession(user){
  var sessions = getActiveSessions();
  // Remove stale entries (older than 2 hours)
  var cutoff = Date.now() - 2*60*60*1000;
  sessions = sessions.filter(function(s){ return s.lastActive > cutoff; });
  // Remove existing entry for this tab
  sessions = sessions.filter(function(s){ return s.tabId !== SESSION_TAB_ID; });
  sessions.push({ tabId: SESSION_TAB_ID, user: user, loginTime: Date.now(), lastActive: Date.now(), ip: sessionStorage.getItem('ecap_client_ip')||'', ua: navigator.userAgent.substr(0,80) });
  saveActiveSessions(sessions);
}

function unregisterSession(){
  var sessions = getActiveSessions();
  sessions = sessions.filter(function(s){ return s.tabId !== SESSION_TAB_ID; });
  saveActiveSessions(sessions);
}

function isSessionKicked(){
  var sessions = getActiveSessions();
  var mine = sessions.find(function(s){ return s.tabId === SESSION_TAB_ID; });
  return !mine && sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

// Heartbeat: update lastActive, check if kicked
var _sessionHeartbeat = setInterval(function(){
  if(sessionStorage.getItem(ADMIN_SESSION_KEY) !== '1') return;
  var sessions = getActiveSessions();
  var found = false;
  sessions.forEach(function(s){
    if(s.tabId === SESSION_TAB_ID){ s.lastActive = Date.now(); found = true; }
  });
  if(!found && sessionStorage.getItem(ADMIN_SESSION_KEY) === '1'){
    // We were kicked
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    showToast(CL('session_kicked'));
    setTimeout(function(){ location.hash = '#/'; location.reload(); }, 1500);
    return;
  }
  saveActiveSessions(sessions);
}, 15000);

window.addEventListener('beforeunload', function(){
  if(sessionStorage.getItem(ADMIN_SESSION_KEY)==='1') unregisterSession();
});

// Cross-tab sync: refresh security view when other tabs change audit/session data
window.addEventListener('storage', function(e){
  if(!e.key) return;
  if((e.key === 'ecap_active_sessions' || e.key === CMS_AUDIT_KEY) && _cmsSection === 'security'){
    var ed = document.getElementById('cmsEditor');
    if(ed) ed.innerHTML = '<div class="cms-panel">' + _cmsSecurityTab() + '</div>';
  }
});

window._cmsKickSession = function(tabId){
  if(!confirm(CL('kick_confirm'))) return;
  var sessions = getActiveSessions();
  var kicked = sessions.find(function(s){ return s.tabId === tabId; });
  sessions = sessions.filter(function(s){ return s.tabId !== tabId; });
  saveActiveSessions(sessions);
  addAuditLog('session_kicked', 'Kicked user: '+(kicked?kicked.user:'unknown')+', tabId: '+tabId);
  showToast(CL('kicked'));
  window._cmsSecurityView();
};

window._cmsSaveConcurrent = function(){
  var val = parseInt(document.getElementById('concurrentLimit').value,10);
  if(isNaN(val) || val < 0) val = 0;
  setConcurrentLimit(val);
  showToast(CL('concurrent_set')+val);
};

// Build a full-access permission object
function _cmsFullPerms(){
  var p={};
  CMS_SECTIONS.forEach(function(s){ CMS_PERM_ACTIONS.forEach(function(a){ p[s+'.'+a]=true; }); });
  return p;
}
// Build an empty (no-access) permission object
function _cmsEmptyPerms(){
  var p={};
  CMS_SECTIONS.forEach(function(s){ CMS_PERM_ACTIONS.forEach(function(a){ p[s+'.'+a]=false; }); });
  return p;
}

// Resolve effective permissions for a username
// Priority: default admin → user.perms → group.perms → empty perms
// Rule: write implies read
function _cmsResolvePerms(username){
  // Default admin always gets full perms
  if(username==='admin'){
    var users=getCmsUsers();
    var adminUser=users.find(function(u){return u.username==='admin';});
    // If admin user exists in custom list, check their groupId/perms; otherwise full access
    if(!adminUser) return _cmsFullPerms();
    // If admin has no groupId and no perms, still full access (legacy admin)
    if(!adminUser.groupId && !adminUser.perms) return _cmsFullPerms();
  }
  var users=getCmsUsers();
  var user=users.find(function(u){return u.username===username;});
  var perms;
  if(!user){
    // Not in custom list (e.g. default admin via ADMIN_HASH)
    return _cmsFullPerms();
  }
  if(user.perms){
    // User has direct custom permissions
    perms=Object.assign(_cmsEmptyPerms(), user.perms);
  } else if(user.groupId){
    // Resolve from group
    var groups=getCmsGroups();
    var grp=groups.find(function(g){return g.id===user.groupId;});
    perms=grp?Object.assign(_cmsEmptyPerms(), grp.perms):_cmsEmptyPerms();
  } else {
    // No group, no custom perms → empty (should not happen after migration)
    return _cmsEmptyPerms();
  }
  // Enforce: write implies read
  CMS_SECTIONS.forEach(function(s){
    if(perms[s+'.write']) perms[s+'.read']=true;
  });
  return perms;
}

// Legacy action map: maps old action names to new granular perms
var _LEGACY_PERM_MAP = {
  editPage:'pages.write', save:'pages.write', upload:'files.write',
  deleteFile:'files.write', users:'users.write', export:'pages.write'
};

// Backward-compatible permission check — accepts both old and new action names
function _cmsHasPermission(action){
  var username=sessionStorage.getItem('ecap_admin_user')||'admin';
  var perms=_cmsResolvePerms(username);
  // Map legacy action if needed
  var key=_LEGACY_PERM_MAP[action]||action;
  return perms[key]===true;
}

function _cmsCurrentRole(){
  // Derive a display role from permissions for badge/UI
  var username=sessionStorage.getItem('ecap_admin_user')||'admin';
  var users=getCmsUsers();
  var user=users.find(function(u){return u.username===username;});
  if(!user) return 'admin'; // default admin
  if(user.groupId){
    var groups=getCmsGroups();
    var grp=groups.find(function(g){return g.id===user.groupId;});
    return grp?grp.name:(user.role||'admin');
  }
  return user.role||'admin';
}

// ————— DATA MIGRATION —————
var CMS_MIGRATED_KEY = 'ecap_cms_migrated_v3';
function _cmsMigrateData(){
  if(localStorage.getItem(CMS_MIGRATED_KEY)==='1') return;
  // 1) Create default groups if none exist
  var groups=getCmsGroups();
  if(groups.length===0){
    groups=[
      {id:'g_admin', name:'管理員', perms:_cmsFullPerms(), sessionTimeout:0, ipWhitelist:[]},
      {id:'g_editor',name:'編輯員', perms:(function(){
        var p=_cmsEmptyPerms();
        ['pages','blog','files'].forEach(function(s){ p[s+'.read']=true; p[s+'.write']=true; });
        p['users.read']=true; p['security.read']=true;
        return p;
      })(), sessionTimeout:0, ipWhitelist:[]},
      {id:'g_viewer',name:'檢視員', perms:(function(){
        var p=_cmsEmptyPerms();
        CMS_SECTIONS.forEach(function(s){ p[s+'.read']=true; });
        return p;
      })(), sessionTimeout:0, ipWhitelist:[]}
    ];
    saveCmsGroups(groups);
  }
  // 2) Migrate existing users: role → groupId, add new fields
  var users=getCmsUsers();
  var roleGroupMap={admin:'g_admin',editor:'g_editor',viewer:'g_viewer'};
  var changed=false;
  users.forEach(function(u){
    if(!u.groupId && u.role){
      u.groupId=roleGroupMap[u.role]||'g_viewer';
      changed=true;
    }
    if(typeof u.force2FA==='undefined'){
      // Only force 2FA for non-admin users who don't already have 2FA
      var cfg2fa=get2FAConfig();
      u.force2FA=u.username!=='admin' && !cfg2fa[u.username];
      changed=true;
    }
    if(typeof u.sessionTimeout==='undefined'){ u.sessionTimeout=0; changed=true; }
    if(typeof u.ipWhitelist==='undefined'){ u.ipWhitelist=[]; changed=true; }
    if(typeof u.timezone==='undefined'){ u.timezone='Asia/Hong_Kong'; changed=true; }
    if(typeof u.enabled==='undefined'){ u.enabled=true; changed=true; }
  });
  if(changed && users.length) saveCmsUsers(users);
  // 3) Migrate rate limit config
  if(!localStorage.getItem(CMS_RATELIMIT_KEY)){
    saveRateLimitConfig({maxAttempts:5, lockoutMinutes:15});
  }
  localStorage.setItem(CMS_MIGRATED_KEY,'1');
}
// Run migration on load
_cmsMigrateData();

// ————— Effective Session Timeout & IP Whitelist —————
// Resolution chain: user → group → global
function getEffectiveSessionTimeout(username){
  var users=getCmsUsers();
  var user=users.find(function(u){return u.username===username;});
  if(user && user.sessionTimeout && user.sessionTimeout>0) return user.sessionTimeout;
  if(user && user.groupId){
    var groups=getCmsGroups();
    var grp=groups.find(function(g){return g.id===user.groupId;});
    if(grp && grp.sessionTimeout && grp.sessionTimeout>0) return grp.sessionTimeout;
  }
  return getSessionTimeout(); // global fallback
}

function getEffectiveIpWhitelist(username){
  var users=getCmsUsers();
  var user=users.find(function(u){return u.username===username;});
  if(user && user.ipWhitelist && user.ipWhitelist.length>0) return user.ipWhitelist;
  if(user && user.groupId){
    var groups=getCmsGroups();
    var grp=groups.find(function(g){return g.id===user.groupId;});
    if(grp && grp.ipWhitelist && grp.ipWhitelist.length>0) return grp.ipWhitelist;
  }
  return getIpWhitelist(); // global fallback
}

// ————————————————————— ADMIN VIEW —————————————————————
function adminView(){
  // Preload CKEditor CDN (non-blocking)
  _loadCKEditor();
  // --- Mobile Block ---
  if(window.innerWidth <= 768){
    return '<section class="admin-login"><div class="admin-login-box" style="text-align:center">'
      +'<div style="margin-bottom:16px"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>'
      +'<h2 style="font-size:18px;margin-bottom:8px">CMS</h2>'
      +'<p style="font-size:14px;color:var(--text-muted);line-height:1.6;margin-bottom:20px">'+CL('cms_mobile_block')+'</p>'
      +'<a href="#/" class="admin-btn primary" style="text-decoration:none;display:inline-flex">'+CL('go_home')+'</a>'
      +'</div></section>';
  }
  // --- Admin Login Gate ---
  if(!isAdminLoggedIn()){
    return '<section class="admin-login"><div class="admin-login-box">'
      +'<div class="login-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>'
      +'<h2>'+CL('cms_admin')+'</h2>'
      +'<p class="login-sub">'+CL('login_sub')+'</p>'
      +'<form onsubmit="return window._adminLogin(event)">'
      +'<div class="login-field"><label>'+CL('username')+'</label><input type="text" id="adminUser" value="admin" autocomplete="username" oninput="var t=document.getElementById(\x27totpField\x27);if(t)t.style.display=get2FAConfig()[this.value.trim()]?\x27\x27:\x27none\x27"/></div>'
      +'<div class="login-field"><label>'+CL('password')+'</label><div style="position:relative"><input type="password" id="adminPass" placeholder="'+CL('enter_pwd')+'" autocomplete="current-password" style="padding-right:40px"/><button type="button" onclick="var p=document.getElementById(\x27adminPass\x27);p.type=p.type===\x27password\x27?\x27text\x27:\x27password\x27;this.innerHTML=p.type===\x27password\x27?\x27&#128065;\x27:\x27&#128064;\x27" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;padding:4px;opacity:.5">&#128065;</button></div></div>'
      +'<div class="login-field" id="totpField" style="display:none"><label>'+CL('twofa_code')+'</label><input type="text" id="adminTOTP" placeholder="\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7" maxlength="6" autocomplete="one-time-code" inputmode="numeric" pattern="[0-9]*" style="letter-spacing:4px;font-size:18px;text-align:center"/></div>'
      +'<button type="submit" class="login-btn" id="loginBtn">'+CL('login')+'</button>'
      +'<div class="login-err" id="loginErr"></div>'
      +'</form>'
      +'</div></section>';
  }

  // --- Authenticated CMS View ---
  var allPages = Object.keys(SITE.pages);
  var cms = getCmsPages();
  var _curRole = _cmsCurrentRole();
  var _canViewUsers = _cmsHasPermission('users.read');
  var _canViewSecurity = _cmsHasPermission('security.read');
  var _canExport = _cmsHasPermission('pages.write');

  // Get display title for a page slug
  function _pageTitle(slug){
    var pg = SITE.pages[slug];
    if(!pg) return slug;
    var lang = window.currentLang || 'zh-Hant';
    if(pg[lang] && pg[lang].title) return pg[lang].title;
    if(pg['zh-Hant'] && pg['zh-Hant'].title) return pg['zh-Hant'].title;
    return slug;
  }

  // Sidebar dot: grey = unedited, green = has CMS edits
  var _homeEdited = (typeof getCmsHome === 'function' && getCmsHome() && Object.keys(getCmsHome()).length) ? ' edited' : '';
  var _navEdited = (typeof getCmsNav === 'function' && getCmsNav() && Object.keys(getCmsNav()).length) ? ' edited' : '';

  return ''
    // Sticky top bar — full width above sidebar+main
    +'<div class="cms-sticky-top">'
    // Compact header
    +'<div class="cms-main-header"><h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:6px"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>'+CL('cms_title')+'</h3>'
    +'<div class="cms-header-acts">'
    +'<div id="cmsHeaderActions" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"></div>'
    +'<div class="cms-avatar-wrap" style="margin-left:4px;position:relative">'
    +'<button class="cms-avatar-btn" onclick="window._cmsToggleAvatarMenu()" style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid var(--border);border-radius:100px;background:var(--white);cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;color:var(--text)">'
    +'<span style="width:28px;height:28px;border-radius:50%;background:var(--brand-gradient);color:var(--white);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700">'+(sessionStorage.getItem("ecap_admin_user")||"A")[0].toUpperCase()+'</span>'
    +'<span>'+esc(sessionStorage.getItem("ecap_admin_user")||"admin")+'</span>'
    +'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>'
    +'</button>'
    +'<div class="cms-avatar-dropdown" id="cmsAvatarMenu" style="display:none;position:absolute;right:0;top:100%;margin-top:6px;background:var(--white);border:1px solid rgba(0,0,0,.1);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);min-width:200px;z-index:100;overflow:hidden">'
    +'<div style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,.06)">'
    +'<div style="font-weight:700;font-size:14px">'+esc(sessionStorage.getItem("ecap_admin_user")||"admin")+'</div>'
    +'<div style="font-size:11px;color:var(--text-muted);margin-top:2px">'+esc(_curRole)+'</div>'
    +'</div>'
    +'<div style="padding:4px">'
    +'<button onclick="window._cmsSectionSwitch(\'account\');window._cmsCloseAvatarMenu()" style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 12px;border:none;background:transparent;font-size:13px;font-family:inherit;cursor:pointer;border-radius:6px;color:var(--text);text-align:left" onmouseover="this.style.background=\'var(--bg-light)\'" onmouseout="this.style.background=\'transparent\'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> '+CL('my_account')+'</button>'
    +'</div>'
    +'<div style="border-top:1px solid rgba(0,0,0,.06);padding:4px">'
    +'<button onclick="window._adminLogout()" style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 12px;border:none;background:transparent;font-size:13px;font-family:inherit;cursor:pointer;border-radius:6px;color:#dc2626;text-align:left" onmouseover="this.style.background=\'#fef2f2\'" onmouseout="this.style.background=\'transparent\'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> '+CL('logout')+'</button>'
    +'</div></div></div>'
    +'</div></div>'
    // Section bar with tabs + tools
    +'<div class="cms-section-bar">'
    +'<div class="cms-section-tabs">'
    +'<button class="cms-section-btn" id="stab_blog" onclick="window._cmsSectionSwitch(\'blog\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> '+CL('tab_blog')+'</button>'
    +'<button class="cms-section-btn active" id="stab_pages" onclick="window._cmsSectionSwitch(\'pages\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> '+CL('tab_pages')+'</button>'
    +'<button class="cms-section-btn" id="stab_files" onclick="window._cmsSectionSwitch(\'files\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> '+CL('tab_files')+'</button>'
    +(_canViewUsers?'<button class="cms-section-btn" id="stab_users" onclick="window._cmsSectionSwitch(\'users\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> '+CL('tab_users')+'</button>':'')
    +(_canViewSecurity?'<button class="cms-section-btn" id="stab_security" onclick="window._cmsSectionSwitch(\'security\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> '+CL('tab_security')+'</button>':'')
    +'</div>'
    +'</div>'
    +'</div>' // close cms-sticky-top
    // Layout: sidebar + main
    +'<div class="cms-layout">'
    // Sidebar
    +'<aside class="cms-sidebar">'
    +'<div class="cms-sidebar-hdr"><h2><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:6px"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'+CL('sidebar_title')+'</h2><p>'+allPages.length+CL('sidebar_count')+'</p></div>'
    +'<div class="cms-search"><input type="text" id="cmsSearch" placeholder="'+CL('search_pages')+'" oninput="window._cmsFilter(this.value)"/></div>'
    +'<div class="cms-page-list" id="cmsPageList">'
    // Homepage item
    +'<div class="cms-page-item cms-page-home'+_homeEdited+'" data-slug="__home__" onclick="window._cmsHomeView()">'
    +'<span class="page-dot"></span>'
    +'<div class="page-info"><span class="page-name" style="font-weight:700">'+CL('tab_home')+'</span>'
    +'<span class="page-slug">'+CL('tab_home_desc')+'</span></div></div>'
    // Nav item
    +'<div class="cms-page-item cms-page-nav'+_navEdited+'" data-slug="__nav__" onclick="window._cmsSectionSwitch(\'nav\')">'
    +'<span class="page-dot"></span>'
    +'<div class="page-info"><span class="page-name" style="font-weight:700">'+CL('tab_nav')+'</span>'
    +'<span class="page-slug">'+CL('tab_nav_desc')+'</span></div></div>'
    +'<div style="border-bottom:1px solid var(--border-light);margin:4px 10px"></div>'
    + allPages.map(function(slug){
        var edited = cms[slug] ? ' edited' : '';
        var title = _pageTitle(slug);
        return '<div class="cms-page-item'+edited+'" data-slug="'+esc(slug)+'" onclick="window._cmsEditPage(\''+slug+'\')">'
          +'<span class="page-dot"></span>'
          +'<div class="page-info"><span class="page-name">'+esc(title)+'</span>'
          +'<span class="page-slug">'+esc(slug)+'</span></div></div>';
      }).join('')
    +'</div></aside>'
    // Main content area
    +'<div class="cms-main">'
    +'<div class="cms-editor-area" id="cmsEditor">'
    +'<div class="cms-empty"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div><p>'+CL('select_page')+'</p></div>'
    +'</div></div></div>';
}
// Expose for router
window.adminView = adminView;

// ————————————————————— ADMIN AUTH —————————————————————
// Default password: "Abc123***!" — SHA-256 hash below
var ADMIN_HASH = "38254421368e6fa5bad4a73896e0b4fc6b77b51255a4351022ba55ab805c3e59";
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
  unregisterSession();
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  location.hash = "#/";
};

// Avatar dropdown toggle
window._cmsToggleAvatarMenu = function(){
  var m = document.getElementById('cmsAvatarMenu');
  if(!m) return;
  var vis = m.style.display !== 'none';
  m.style.display = vis ? 'none' : 'block';
  if(!vis){
    setTimeout(function(){
      function _closeMenu(e){ if(!e.target.closest('.cms-avatar-wrap')){ m.style.display='none'; document.removeEventListener('click',_closeMenu); } }
      document.addEventListener('click', _closeMenu);
    }, 10);
  }
};
window._cmsCloseAvatarMenu = function(){
  var m = document.getElementById('cmsAvatarMenu');
  if(m) m.style.display='none';
};

// ————— Force-Change-Password Full-Screen —————
window._cmsForceChangePwdScreen = function(username){
  var app = document.getElementById('app');
  if(!app) return;
  app.innerHTML = '<section class="admin-login"><div class="admin-login-box" style="max-width:440px;text-align:left">'
    +'<h2 style="font-size:20px;text-align:center;margin-bottom:4px">'+CL('force_change_title')+'</h2>'
    +'<p style="font-size:13px;color:var(--text-muted);text-align:center;margin-bottom:20px">'+CL('force_change_desc')+'</p>'
    +'<div class="admin-field"><label>'+CL('new_pwd_label')+'</label><input type="password" id="forcePwdNew" placeholder="'+CL('pwd_min8')+'"/></div>'
    +'<div class="admin-field"><label>'+CL('confirm_pwd_label')+'</label><input type="password" id="forcePwdConfirm" placeholder="'+CL('confirm_pwd_label')+'"/></div>'
    +'<div id="forcePwdStrength" style="font-size:12px;margin-bottom:12px"></div>'
    +'<div style="display:flex;gap:8px;justify-content:center">'
    +'<button class="admin-btn primary" id="forcePwdSaveBtn">'+CL('change_continue')+'</button>'
    +'<button class="admin-btn secondary" id="forcePwdLogoutBtn">'+CL('logout')+'</button>'
    +'</div>'
    +'<div id="forcePwdErr" style="font-size:12px;color:#dc2626;margin-top:8px;text-align:center"></div>'
    +'</div></section>';

  document.getElementById('forcePwdNew').focus();
  document.getElementById('forcePwdNew').addEventListener('input', function(){
    var val = this.value;
    if(!val){ document.getElementById('forcePwdStrength').innerHTML=''; return; }
    var errs = validatePasswordComplexity(val);
    var s = checkPasswordStrength(val);
    var html = '<span style="color:'+s.color+'">'+s.label+'</span>';
    if(errs.length) html += '<div style="font-size:11px;color:#dc2626;margin-top:4px">'+errs.map(function(e){return '&#10007; '+e;}).join('<br>')+'</div>';
    document.getElementById('forcePwdStrength').innerHTML=html;
  });
  document.getElementById('forcePwdLogoutBtn').addEventListener('click', function(){
    sessionStorage.removeItem('ecap_force2fa_user');
    sessionStorage.removeItem('ecap_force2fa_role');
    sessionStorage.removeItem('ecap_forcepwd_user');
    location.hash='#/admin';
    window.route();
  });
  document.getElementById('forcePwdSaveBtn').addEventListener('click', function(){
    var newPwd = document.getElementById('forcePwdNew').value;
    var confirmPwd = document.getElementById('forcePwdConfirm').value;
    var errEl = document.getElementById('forcePwdErr');
    if(newPwd.length<8){errEl.textContent=CL('pwd_min8');return;}
    if(newPwd!==confirmPwd){errEl.textContent=CL('pwd_mismatch');return;}
    var _cpxErrs=validatePasswordComplexity(newPwd);
    if(_cpxErrs.length){errEl.innerHTML=CL('pwd_complexity')+'<br>'+_cpxErrs.join('<br>');return;}
    sha256hex(newPwd).then(function(hash){
      var users=getCmsUsers();
      users.forEach(function(u){if(u.username===username){u.hash=hash;u.mustChangePassword=false;}});
      saveCmsUsers(users);
      addAuditLog('password_changed_first_login','User: '+username);
      // Check if force-2FA is still needed
      var userObj=users.find(function(u){return u.username===username;});
      var cfg2fa=get2FAConfig();
      if(userObj && userObj.force2FA && !cfg2fa[username]){
        sessionStorage.setItem('ecap_force2fa_user', username);
        sessionStorage.setItem('ecap_force2fa_role', sessionStorage.getItem('ecap_forcepwd_role')||'admin');
        sessionStorage.removeItem('ecap_forcepwd_user');
        sessionStorage.removeItem('ecap_forcepwd_role');
        window._cmsForce2FAScreen(username);
      } else {
        // Complete login
        var role=sessionStorage.getItem('ecap_forcepwd_role')||'admin';
        sessionStorage.removeItem('ecap_forcepwd_user');
        sessionStorage.removeItem('ecap_forcepwd_role');
        sessionStorage.setItem(ADMIN_SESSION_KEY,'1');
        sessionStorage.setItem('ecap_admin_user',username);
        sessionStorage.setItem('ecap_admin_role',role);
        sessionStorage.setItem('ecap_admin_login_time',Date.now().toString());
        sessionStorage.setItem('ecap_session_fp',getSessionFingerprint());
        _adminCurrentUser=username;
        // Enforce concurrent login limit
        var _concLimit = getConcurrentLimit();
        if(_concLimit > 0){
          var _allSessions = getActiveSessions().filter(function(s){ return s.lastActive > Date.now() - 2*60*60*1000; });
          var _userSessions = _allSessions.filter(function(s){ return s.user === username; });
          while(_userSessions.length >= _concLimit){
            var oldest = _userSessions.sort(function(a,b){return a.loginTime-b.loginTime;})[0];
            _allSessions = _allSessions.filter(function(s){return s.tabId!==oldest.tabId;});
            _userSessions = _userSessions.filter(function(s){return s.tabId!==oldest.tabId;});
            saveActiveSessions(_allSessions);
          }
        }
        registerSession(username);
        addAuditLog('login_success', 'User: '+username+', force-pwd-change completed');
        _startSessionTimer();
        window.route();
      }
    }).catch(function(err){
      console.error('[CMS ForcePwd] sha256 error:', err);
      errEl.textContent = 'Error saving password: '+(err&&err.message||String(err));
    });
  });
};

// ————— Force-2FA Full-Screen Setup —————
window._cmsForce2FAScreen = function(username){
  var secret = generateSecret();
  var issuer = 'e-Capital CMS';
  var otpUrl = 'otpauth://totp/'+encodeURIComponent(issuer+':'+username)+'?secret='+secret+'&issuer='+encodeURIComponent(issuer);
  var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(otpUrl);

  var app = document.getElementById('app');
  if(!app) return;
  app.innerHTML = '<section class="admin-login"><div class="admin-login-box" style="max-width:440px">'
    +'<div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#92400e;text-align:left">'+CL('force_2fa_desc')+'</div>'
    +'<h2 style="font-size:20px">'+CL('force_2fa_title')+'</h2>'
    +'<p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">'+CL('scan_qr')+'</p>'
    +'<img src="'+qrUrl+'" alt="QR" style="width:200px;height:200px;border:1px solid var(--border);border-radius:8px;margin-bottom:12px"/>'
    +'<div style="font-family:monospace;font-size:14px;letter-spacing:2px;background:var(--bg-box);padding:8px 12px;border-radius:6px;margin-bottom:16px;word-break:break-all">'+secret+'</div>'
    +'<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">'+CL('enter_code_verify')+'</p>'
    +'<input type="text" id="force2FACode" maxlength="6" placeholder="\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7" style="width:120px;text-align:center;font-size:20px;letter-spacing:6px;padding:8px;border:1.5px solid var(--border);border-radius:8px;margin-bottom:12px" inputmode="numeric"/>'
    +'<div style="display:flex;gap:8px;justify-content:center">'
    +'<button class="admin-btn primary" id="force2FAVerifyBtn">'+CL('verify_enable')+'</button>'
    +'<button class="admin-btn secondary" id="force2FALogoutBtn">'+CL('logout')+'</button>'
    +'</div>'
    +'<div id="force2FAErr" style="font-size:12px;color:#dc2626;margin-top:8px"></div>'
    +'</div></section>';

  document.getElementById('force2FACode').focus();
  document.getElementById('force2FALogoutBtn').addEventListener('click', function(){
    sessionStorage.removeItem('ecap_force2fa_user');
    sessionStorage.removeItem('ecap_force2fa_role');
    location.hash='#/admin';
    window.route();
  });
  document.getElementById('force2FAVerifyBtn').addEventListener('click', function(){
    var code = document.getElementById('force2FACode').value.replace(/\s/g,'');
    if(code.length!==6){ document.getElementById('force2FAErr').textContent=CL('enter_6digit'); return; }
    verifyTOTP(secret, code).then(function(ok){
      if(ok){
        // Save 2FA config
        var c=get2FAConfig();
        c[username]=secret;
        save2FAConfig(c);
        // Clear force2FA flag
        var users=getCmsUsers();
        users.forEach(function(u){ if(u.username===username) u.force2FA=false; });
        saveCmsUsers(users);
        // Complete login
        var role=sessionStorage.getItem('ecap_force2fa_role')||'admin';
        sessionStorage.removeItem('ecap_force2fa_user');
        sessionStorage.removeItem('ecap_force2fa_role');
        sessionStorage.setItem(ADMIN_SESSION_KEY,'1');
        sessionStorage.setItem('ecap_admin_user',username);
        sessionStorage.setItem('ecap_admin_role',role);
        sessionStorage.setItem('ecap_admin_login_time',Date.now().toString());
        sessionStorage.setItem('ecap_session_fp',getSessionFingerprint());
        _adminCurrentUser=username;
        // Enforce concurrent login limit
        var _concLimit = getConcurrentLimit();
        if(_concLimit > 0){
          var _allSessions = getActiveSessions().filter(function(s){ return s.lastActive > Date.now() - 2*60*60*1000; });
          var _userSessions = _allSessions.filter(function(s){ return s.user === username; });
          while(_userSessions.length >= _concLimit){
            var oldest = _userSessions.sort(function(a,b){return a.loginTime-b.loginTime;})[0];
            _allSessions = _allSessions.filter(function(s){return s.tabId!==oldest.tabId;});
            _userSessions = _userSessions.filter(function(s){return s.tabId!==oldest.tabId;});
            saveActiveSessions(_allSessions);
          }
        }
        registerSession(username);
        addAuditLog('force_2fa_complete','User: '+username);
        _startSessionTimer();
        showToast(CL('twofa_enabled').replace('{0}',username));
        window.route();
      } else {
        document.getElementById('force2FAErr').textContent=CL('invalid_code_retry');
        document.getElementById('force2FACode').value='';
        document.getElementById('force2FACode').focus();
      }
    });
  });
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
    addAuditLog('login_locked', 'IP: '+(sessionStorage.getItem('ecap_client_ip')||'unknown')+', locked for '+lockMins+' min', user);
    errEl.textContent = CL('too_many')+lockMins+CL('minutes');
    errEl.style.color='';
    btn.disabled = false;
    btn.textContent = CL('login');
    return false;
  }

  // Fetch client IP only if an IP whitelist is configured (avoid blocking login on external service)
  (function(){
    var stored = sessionStorage.getItem('ecap_client_ip');
    if(stored) return Promise.resolve();
    // Skip IP fetch entirely if no whitelist is active — don't block login
    if(!getIpWhitelist().length) { sessionStorage.setItem('ecap_client_ip', 'unavailable'); return Promise.resolve(); }
    // Fetch with a 5-second timeout
    function fetchWithTimeout(url, ms){
      return Promise.race([
        fetch(url).then(function(r){return r.json();}),
        new Promise(function(_,rej){setTimeout(function(){rej(new Error('timeout'));},ms);})
      ]);
    }
    return fetchWithTimeout('https://api.ipify.org?format=json', 5000).then(function(d){
      sessionStorage.setItem('ecap_client_ip', d.ip);
    }).catch(function(){
      return fetchWithTimeout('https://api.seeip.org/jsonip?', 5000).then(function(d){
        sessionStorage.setItem('ecap_client_ip', d.ip);
      }).catch(function(){
        sessionStorage.setItem('ecap_client_ip', 'unavailable');
      });
    });
  })().then(function(){
  return checkIpWhitelist();
  }).then(function(ipOk){
    if(!ipOk){
      addAuditLog('login_blocked_ip', 'IP: '+(sessionStorage.getItem('ecap_client_ip')||'unknown'), user);
      errEl.textContent = CL('ip_denied');
      errEl.style.color='';
      btn.disabled = false;
      btn.textContent = CL('login');
      return;
    }

    Promise.resolve().then(function(){ return checkAdminLogin(user, pass); }).then(function(matched){
    console.log('[CMS Login] matched:', matched);
    if(matched && matched.error==='disabled'){
      addAuditLog('login_disabled', '', user);
      errEl.textContent = CL('acct_disabled');
      errEl.style.color='';
      btn.disabled = false;
      btn.textContent = CL('login');
      return;
    }
    if(matched && !matched.error){
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
        if(code.length!==6){errEl.textContent=CL('enter_6digit');errEl.style.color='';btn.disabled=false;btn.textContent=CL('verify_2fa');return;}
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
            // Enforce concurrent login limit
            var _concLimit = getConcurrentLimit();
            if(_concLimit > 0){
              var _allSessions = getActiveSessions().filter(function(s){ return s.lastActive > Date.now() - 2*60*60*1000; });
              var _userSessions = _allSessions.filter(function(s){ return s.user === (matched.username||matched); });
              while(_userSessions.length >= _concLimit){
                var oldest = _userSessions.sort(function(a,b){return a.loginTime-b.loginTime;})[0];
                _allSessions = _allSessions.filter(function(s){return s.tabId!==oldest.tabId;});
                _userSessions = _userSessions.filter(function(s){return s.tabId!==oldest.tabId;});
                saveActiveSessions(_allSessions);
              }
            }
            registerSession(matched.username||matched);
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
      // No 2FA - check if must change password or force-2FA is required
      // Default admin (ADMIN_HASH) is exempt from force-2FA/force-pwd
      var _loginUser = matched.username||user;
      var _isDefaultAdmin = (_loginUser==='admin' && !getCmsUsers().find(function(u){return u.username==='admin';}));
      var _userObj = getCmsUsers().find(function(u){return u.username===_loginUser;});
      var _needChangePwd = !_isDefaultAdmin && _userObj && _userObj.mustChangePassword;
      var _needForce2FA = !_isDefaultAdmin && _userObj && _userObj.force2FA;
      console.log('[CMS Login] loginUser:', _loginUser, 'isDefaultAdmin:', _isDefaultAdmin, 'needChangePwd:', _needChangePwd, 'needForce2FA:', _needForce2FA);
      if(_needChangePwd){
        // Must change password first (will chain to force-2FA if needed)
        sessionStorage.setItem('ecap_forcepwd_user', _loginUser);
        sessionStorage.setItem('ecap_forcepwd_role', matched.role||'admin');
        clearLoginAttempts(_loginUser);
        recordLastLogin(_loginUser);
        addAuditLog('login_force_changepwd', 'User: '+_loginUser+' — must change password');
        window._cmsForceChangePwdScreen(_loginUser);
        return;
      }
      if(_needForce2FA){
        // Store pending login state, show force-2FA setup
        sessionStorage.setItem('ecap_force2fa_user', _loginUser);
        sessionStorage.setItem('ecap_force2fa_role', matched.role||'admin');
        clearLoginAttempts(_loginUser);
        recordLastLogin(_loginUser);
        addAuditLog('login_force2fa', 'User: '+_loginUser+' — must setup 2FA');
        window._cmsForce2FAScreen(_loginUser);
        return;
      }
      sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      sessionStorage.setItem("ecap_admin_user", _loginUser);
      sessionStorage.setItem("ecap_admin_role", matched.role||"admin");
      sessionStorage.setItem('ecap_admin_login_time', Date.now().toString());
      _adminCurrentUser = _loginUser;
      clearLoginAttempts(_loginUser);
      recordLastLogin(_loginUser);
      sessionStorage.setItem('ecap_session_fp', getSessionFingerprint());
      // Enforce concurrent login limit
      var _concLimit = getConcurrentLimit();
      if(_concLimit > 0){
        var _allSessions = getActiveSessions().filter(function(s){ return s.lastActive > Date.now() - 2*60*60*1000; });
        var _userSessions = _allSessions.filter(function(s){ return s.user === _loginUser; });
        while(_userSessions.length >= _concLimit){
          var oldest = _userSessions.sort(function(a,b){return a.loginTime-b.loginTime;})[0];
          _allSessions = _allSessions.filter(function(s){return s.tabId!==oldest.tabId;});
          _userSessions = _userSessions.filter(function(s){return s.tabId!==oldest.tabId;});
          saveActiveSessions(_allSessions);
        }
      }
      registerSession(_loginUser);
      addAuditLog('login_success', 'User: '+_loginUser+', 2FA: no');
      _startSessionTimer();
      window.route();
    } else if(matched && matched.error==='not_found'){
      console.error('[CMS Login] User not found:', user);
      recordFailedLogin(user);
      addAuditLog('login_user_not_found', 'IP: '+(sessionStorage.getItem('ecap_client_ip')||'unknown')+', user: '+user, user);
      errEl.textContent = CL('wrong_pwd');
      errEl.style.color='';
      btn.disabled = false;
      btn.textContent = CL('login');
    } else if(matched && matched.error==='wrong_password'){
      console.error('[CMS Login] Wrong password for user:', user);
      console.error('[CMS Login] All stored users:', JSON.stringify(getCmsUsers().map(function(u){return{username:u.username,hash:u.hash&&u.hash.slice(0,8)+'...',enabled:u.enabled};})));
      recordFailedLogin(user);
      addAuditLog('login_fail_password', 'IP: '+(sessionStorage.getItem('ecap_client_ip')||'unknown'), user);
      var attempts = getLoginAttempts();
      var rlCfg = getRateLimitConfig();
      var remaining = (rlCfg.maxAttempts||5) - ((attempts[user]||{}).count||0);
      errEl.textContent = CL('wrong_pwd') + (remaining <= 2 && remaining > 0 ? " "+remaining+CL('attempts_left') : "");
      errEl.style.color='';
      btn.disabled = false;
      btn.textContent = CL('login');
    } else {
      console.error('[CMS Login] FAILED for user:', user, 'result:', matched);
      recordFailedLogin(user);
      addAuditLog('login_fail', 'IP: '+(sessionStorage.getItem('ecap_client_ip')||'unknown'), user);
      errEl.textContent = CL('wrong_pwd');
      errEl.style.color='';
      btn.disabled = false;
      btn.textContent = CL('login');
    }
  })['catch'](function(err){
    console.error('[CMS Login] checkAdminLogin error:', err);
    recordFailedLogin(user);
    addAuditLog('login_error', 'IP: '+(sessionStorage.getItem('ecap_client_ip')||'unknown')+', error: '+(err&&err.message||String(err)), user);
    errEl.textContent = CL('wrong_pwd');
    errEl.style.color='';
    btn.disabled = false;
    btn.textContent = CL('login');
  });
  })['catch'](function(err){
    console.error('[CMS Login] IP/whitelist error:', err);
    recordFailedLogin(user);
    addAuditLog('login_error', 'IP: '+(sessionStorage.getItem('ecap_client_ip')||'unknown')+', error: '+(err&&err.message||String(err)), user);
    errEl.textContent = CL('wrong_pwd');
    errEl.style.color='';
    btn.disabled = false;
    btn.textContent = CL('login');
  }); // end IP+whitelist chain
  return false;
};

// Session timeout management
var _sessionTimerHandle = null;
function _startSessionTimer(){
  if(_sessionTimerHandle) clearInterval(_sessionTimerHandle);
  _sessionTimerHandle = setInterval(function(){
    if(!isAdminLoggedIn()) { clearInterval(_sessionTimerHandle); return; }
    var loginTime = parseInt(sessionStorage.getItem('ecap_admin_login_time'))||Date.now();
    var adminUser = sessionStorage.getItem('ecap_admin_user')||'admin';
    var timeoutMin = getEffectiveSessionTimeout(adminUser);
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
// Start timer if already logged in; also re-register session (F5 generates new tab ID)
if(typeof sessionStorage !== 'undefined' && sessionStorage.getItem(ADMIN_SESSION_KEY)==='1'){
  var _resumeUser = sessionStorage.getItem('ecap_admin_user')||'admin';
  registerSession(_resumeUser);
  _startSessionTimer();
}

// ————————————————————— CMS FUNCTIONS —————————————————————
var _cmsCurrentSlug = null;
var _cmsPreviewOn = false;

window._cmsFilter = function(q){
  q = q.toLowerCase();
  document.querySelectorAll('.cms-page-item').forEach(function(el){
    var slug = el.getAttribute('data-slug') || '';
    var name = (el.querySelector('.page-name') || {}).textContent || '';
    el.style.display = (slug.toLowerCase().indexOf(q) >= 0 || name.toLowerCase().indexOf(q) >= 0) ? '' : 'none';
  });
};

window._cmsPreviewPage = function(){
  if(!_cmsCurrentSlug){ showToast(CL('select_first')); return; }
  var slug = _cmsCurrentSlug;
  var titleEl = document.getElementById('cms_t_'+slug+'_'+currentLang);
  var pg = getPage(slug, currentLang) || {};
  var body = window._cmsGetBody('cms_b_'+slug+'_'+currentLang) || (pg.body||'');
  var title = titleEl ? titleEl.value : (pg.title||slug);
  var css = '';
  try{ css = document.querySelector('style').textContent; }catch(e){}
  var pw = window.open('', '_blank', 'width=960,height=720,scrollbars=yes,resizable=yes');
  if(!pw){ showToast(CL('popup_blocked')); return; }
  pw.document.write('<!DOCTYPE html><html lang="'+currentLang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+CL('preview')+' — '+title+'</title><style>'+css+'</style></head><body style="padding-top:0"><div style="background:#f59e0b;color:#fff;font-size:12px;font-weight:600;padding:6px 20px;text-align:center;letter-spacing:.5px">'+CL('preview_mode')+' — '+CL('unsaved_inc')+'</div><section class="subpage"><div class="mw"><div class="subpage-header"><div class="breadcrumb">'+CL('preview')+'</div><h1>'+title+'</h1></div><div class="subpage-body">'+body+'</div></div></section></body></html>');
  pw.document.close();
};

window._cmsEditPage = function(slug){
  _cmsCurrentSlug = slug;
  window._cmsCurrentSlug = slug;
  // Destroy any existing CKEditor instances
  Object.keys(_cmsEditors).forEach(function(k){ try{ _cmsEditors[k].destroy(); }catch(e){} });
  _cmsEditors = {};

  var langs = ["zh-Hant","zh-Hans","en"];
  var langNames = {"zh-Hant":"繁體中文","zh-Hans":"简体中文","en":"English"};
  var _canEditPages = _cmsHasPermission('editPage');
  var hasCKEditor = typeof ClassicEditor !== 'undefined';

  // Resolve translated page title for display
  var _pgDisplay = getPage(slug, currentLang);
  var _pageTitle = (_pgDisplay && _pgDisplay.title) ? _pgDisplay.title : slug;

  // Update header bar actions — only editor help
  window._cmsUpdateHeaderActions(
    '<button class="admin-btn secondary" style="font-size:12px;padding:5px 10px" onclick="window._cmsCkHelp()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> '+CL('ck_help')+'</button>'
  );

  // Page title heading with action buttons
  var html = '<div style="padding:12px 0 10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;border-bottom:1px solid rgba(0,0,0,.06);margin-bottom:16px">'
    +'<div><h3 style="font-size:20px;font-weight:700;margin:0">'+esc(_pageTitle)+'</h3>'
    +'<span style="font-size:11px;color:var(--text-muted);font-family:monospace">/'+esc(slug)+'</span></div>'
    +'<div style="display:flex;gap:6px;align-items:center">'
    +(_canEditPages ? '<button class="admin-btn primary" onclick="window._cmsSavePage(\''+slug+'\')">'+CL('save_changes')+'</button>' : '')
    +'<a href="#/page/'+esc(slug)+'" target="_blank" class="admin-btn secondary" style="text-decoration:none;display:inline-flex;align-items:center">'+CL('view_page')+'</a>'
    +'</div>'
    +'</div>';

  langs.forEach(function(lang){
    var pg = getPage(slug, lang);
    var title = pg ? pg.title : '';
    var body = pg ? pg.body : '';
    var taId = 'cms_b_'+slug+'_'+lang;
    // Only show old toolbar if CKEditor is not available
    var tbHtml = (!hasCKEditor && _canEditPages) ? _cmsBuildToolbar(taId) : '';
    html += '<div class="cms-field-group"><h4>'+esc(langNames[lang])+' ('+lang+')</h4>'
      +'<div class="admin-field"><label>'+CL('title_label')+'</label><input type="text" id="cms_t_'+slug+'_'+lang+'" value="'+escAttr(title)+'"'+(!_canEditPages?' readonly style="background:#f3f4f6;color:var(--text-muted)"':'')+'/></div>'
      +'<div class="admin-field">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
      +'<label style="margin:0">'+CL('body_label')+'</label>'
      +'<div style="display:flex;gap:6px;align-items:center">'
      +(_canEditPages && hasCKEditor ? '<button type="button" class="cms-tb-btn" style="font-size:11px;padding:2px 8px" onclick="window._cmsToggleSource(\''+taId+'\')">&#60;/&#62; Source</button>' : '')
      +(!_canEditPages ? '<span class="role-badge role-viewer">'+CL('read_only')+'</span>' : (!hasCKEditor ? '<button type="button" class="cms-insert-file-btn" data-slug="'+slug+'" data-lang="'+lang+'" onclick="event.preventDefault();event.stopPropagation();window._cmsShowFilePicker(this)">'+CL('insert_dl')+'</button>' : ''))
      +'</div></div>'
      +tbHtml
      +'<div id="'+taId+'_wrap">'
      +'<textarea id="'+taId+'" style="min-height:200px;font-family:monospace;font-size:13px"'+(!_canEditPages?' readonly':'')+'>'+escHtml(body)+'</textarea>'
      +'</div>'
      +'</div></div>';
  });

  // Bottom save button removed — now in sticky toolbar above

  if(_cmsPreviewOn){
    var previewPg = getPage(slug, currentLang);
    var previewBody = previewPg ? previewPg.body : '<p style="color:var(--text-muted)">No content</p>';
    html += '<div style="margin-top:24px"><div class="cms-preview-label"> Live Preview ('+currentLang+')</div>'
      +'<div class="cms-preview-panel"><div class="subpage-body" id="cmsPreviewBody">'+previewBody+'</div></div></div>';
  }

  document.getElementById("cmsEditor").innerHTML = html;

  // Initialize CKEditor on each textarea (if available and editable)
  if(hasCKEditor && _canEditPages){
    langs.forEach(function(lang){
      var taId = 'cms_b_'+slug+'_'+lang;
      var ta = document.getElementById(taId);
      if(!ta) return;
      ClassicEditor.create(ta, {
        extraPlugins: [_cmsCkUploadPlugin],
        toolbar: {items:['heading','|','bold','italic','underline','strikethrough','|','link','imageUpload','blockQuote','insertTable','horizontalLine','|','bulletedList','numberedList','|','outdent','indent','|','fontColor','fontBackgroundColor','removeFormat','|','undo','redo'],shouldNotGroupWhenFull:false},
        heading: { options: [
          { model:'paragraph', title:'Paragraph', class:'ck-heading_paragraph' },
          { model:'heading2', view:'h2', title:'Heading 2', class:'ck-heading_heading2' },
          { model:'heading3', view:'h3', title:'Heading 3', class:'ck-heading_heading3' },
          { model:'heading4', view:'h4', title:'Heading 4', class:'ck-heading_heading4' }
        ]},
        language: lang === 'en' ? 'en' : 'zh-cn'
      }).then(function(editor){
        _cmsEditors[taId] = editor;
        // Live preview on content change
        editor.model.document.on('change:data', function(){
          window._cmsLivePreview(slug);
        });
        // Inject file buttons into CKEditor toolbar
        var wrapDiv = document.getElementById(taId+'_wrap');
        if(wrapDiv){
          var ckToolbar = wrapDiv.querySelector('.ck-toolbar__items');
          if(ckToolbar){
            var _fid = 'cmsCkFile_'+taId.replace(/[^a-zA-Z0-9_]/g,'');
            // Separator
            var sep = document.createElement('span');
            sep.className = 'ck ck-toolbar__separator';
            ckToolbar.appendChild(sep);
            // Insert from Library button
            var libBtn = document.createElement('button');
            libBtn.type = 'button';
            libBtn.className = 'ck ck-button cms-ck-tb-btn';
            libBtn.setAttribute('data-slug', slug);
            libBtn.setAttribute('data-lang', lang);
            libBtn.title = CL('insert_dl');
            libBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg><span class="cms-ck-tb-label"> '+CL('insert_dl')+'</span>';
            libBtn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); window._cmsShowFilePicker(this); };
            ckToolbar.appendChild(libBtn);
            // Upload & Insert button
            var upBtn = document.createElement('button');
            upBtn.type = 'button';
            upBtn.className = 'ck ck-button cms-ck-tb-btn';
            upBtn.title = CL('upload_insert');
            upBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span class="cms-ck-tb-label"> '+CL('upload_insert')+'</span>';
            upBtn.onclick = function(e){ e.preventDefault(); document.getElementById(_fid).click(); };
            ckToolbar.appendChild(upBtn);
            // Hidden file input
            var finput = document.createElement('input');
            finput.type = 'file';
            finput.id = _fid;
            finput.accept = '.jpg,.jpeg,.png,.webp,.gif,.svg,.pdf,.doc,.docx,.ppt,.pptx';
            finput.style.display = 'none';
            finput.onchange = function(){ window._cmsCkFileUpload(this, taId); };
            wrapDiv.appendChild(finput);
          }
        }
      }).catch(function(err){
        console.warn('CKEditor init failed for '+taId+', falling back to textarea:', err);
      });
    });
  } else {
    // Fallback: attach old toolbar events
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
  }

  // Highlight active page in sidebar
  document.querySelectorAll('.cms-page-item').forEach(function(el){
    el.classList.toggle('active', el.getAttribute('data-slug') === slug);
  });
};

// Helper: get body content from CKEditor instance, source textarea, or fallback textarea
window._cmsGetBody = function(taId){
  // Check if source view is active
  var wrap = document.getElementById(taId+'_wrap');
  if(wrap){
    var srcTa = wrap.querySelector('textarea.cms-source-ta');
    if(srcTa) return srcTa.value;
  }
  if(_cmsEditors[taId]) return _cmsEditors[taId].getData();
  var ta = document.getElementById(taId);
  return ta ? ta.value : '';
};

window._cmsLivePreview = function(slug){
  if(!_cmsPreviewOn) return;
  var taId = 'cms_b_'+slug+'_'+currentLang;
  var preview = document.getElementById("cmsPreviewBody");
  if(preview) preview.innerHTML = window._cmsGetBody(taId);
};

window._cmsSavePage = function(slug){
  var cms = getCmsPages();
  if(!cms[slug]) cms[slug] = {};
  ["zh-Hant","zh-Hans","en"].forEach(function(lang){
    var tEl = document.getElementById("cms_t_"+slug+"_"+lang);
    var taId = 'cms_b_'+slug+'_'+lang;
    var body = window._cmsGetBody(taId);
    if(tEl){
      cms[slug][lang] = { title: tEl.value, body: body };
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
    files: getCmsFiles(),
    home: getCmsHome(),
    footer: getCmsFooter(),
    nav: getCmsNav()
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
        if(data.home) saveCmsHome(data.home);
        if(data.footer) saveCmsFooter(data.footer);
        if(data.nav) saveCmsNav(data.nav);
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

// ————————————————————— CMS SECTION SWITCHER —————————————————————
var _cmsSection = "pages";
window._cmsSection = _cmsSection;
window._cmsSectionSwitch = function(sec){
  if(typeof sec === "number"){
    var secs = ["pages","files","users","blog"];
    sec = secs[sec] || "pages";
  }
  _cmsSection = sec;
  window._cmsSection = sec;
  ["pages","blog","files","nav","account","users","security"].forEach(function(s){
    var b = document.getElementById("stab_"+s);
    if(b) b.classList.toggle("active", s===sec);
  });
  // Highlight sidebar items
  document.querySelectorAll('.cms-page-item').forEach(function(el){ el.classList.remove('active'); });
  if(sec==="nav"){ var navItem=document.querySelector('.cms-page-nav'); if(navItem) navItem.classList.add('active'); }
  var sidebar = document.querySelector(".cms-sidebar");
  if(sidebar) sidebar.style.display = (sec==="pages" || sec==="nav") ? "" : "none";
  // Clear header actions (each view will set its own)
  window._cmsUpdateHeaderActions('');
  if(sec==="pages") {
    window._cmsUpdateHeaderActions(
      '<button class="admin-btn secondary" style="font-size:12px;padding:5px 10px" onclick="window._cmsCkHelp()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> '+CL('ck_help')+'</button>'
    );
    document.getElementById("cmsEditor").innerHTML = '<div class="cms-empty"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div><p>'+CL('select_page')+'</p>'
    +(_cmsHasPermission('pages.write') ? '<div style="display:flex;gap:8px;justify-content:center;margin-top:16px">'
    +'<button class="admin-btn secondary" style="font-size:12px;padding:6px 12px" onclick="window._cmsExport()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> '+CL('export_json')+'</button>'
    +'<button class="admin-btn secondary" style="font-size:12px;padding:6px 12px" onclick="document.getElementById(\'cmsImportFile2\').click()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> '+CL('import_json')+'</button>'
    +'<input type="file" id="cmsImportFile2" accept=".json" style="display:none" onchange="window._cmsImport(event)"/>'
    +'</div>' : '')
    +'</div>';
  } else if(sec==="files") {
    window._cmsFilesView();
  } else if(sec==="account") {
    window._cmsAccountView();
  } else if(sec==="users") {
    window._cmsUserMgmtView();
  } else if(sec==="security") {
    window._cmsSecurityView();
  } else if(sec==="blog") {
    window._cmsBlogView();
  } else if(sec==="nav") {
    window._cmsNavStandaloneView();
  }
  // Animate the editor area
  var edArea = document.getElementById('cmsEditor');
  if(edArea) window._cmsTransition(edArea);
};

// ————————————————————— CMS FILES MANAGER —————————————————————
window._cmsFilesView = function(){
  var files = getCmsFiles();
  var _canUpload = _cmsHasPermission("upload");
  var _canDelFile = _cmsHasPermission("deleteFile");

  // Update header bar actions
  window._cmsUpdateHeaderActions(
    '<button class="admin-btn secondary" style="font-size:12px;padding:5px 10px" onclick="window._cmsCkHelp()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> '+CL('ck_help')+'</button>'
  );
  var rows = files.length ? files.map(function(f,i){
    var sizeStr = f.size ? (f.size < 1024 ? f.size+"B" : f.size < 1048576 ? Math.round(f.size/1024)+"KB" : Math.round(f.size/1048576)+"MB") : "—";
    var dateStr = f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString("zh-HK",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}) : "—";
    var byStr = f.uploadedBy || "—";
    var _fIsImg = /\.(jpe?g|png|gif|webp|svg)$/i.test(f.name) || /^image\//i.test(f.type||'');
    var _fIsExt = f.type === 'external';
    var _fThumb = _fIsImg && f.url
      ? '<img src="'+f.url+'" alt="" style="width:64px;height:42px;object-fit:cover;border-radius:6px;border:1px solid rgba(0,0,0,.08);flex-shrink:0;background:#f3f4f6;display:block">'
      : _fIsExt
      ? '<span style="width:40px;height:40px;background:#dbeafe;color:#1d4ed8;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;letter-spacing:0">URL</span>'
      : /pdf/i.test(f.type||f.name||'')
      ? '<span style="width:40px;height:40px;background:#fee2e2;color:#dc2626;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0">PDF</span>'
      : '<span style="width:40px;height:40px;background:#f0f0f0;color:#666;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0">DOC</span>';
    return '<tr><td><div style="display:flex;align-items:center;gap:10px">'+_fThumb+'<div><span class="file-name">'+esc(f.name)+'</span>'+(f.desc?'<br/><span style="font-size:11px;color:var(--text-muted)">'+esc(f.desc)+'</span>':'')+'</div></div></td>'
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
  if(!allowed.includes(file.type) && !allowedExt.test(file.name)){ showToast(CL('file_only_types')+': '+file.name); return; }
  if(file.size > 2*1024*1024){ showToast(CL('file_too_large')+': '+file.name); return; }
  var reader = new FileReader();
  reader.onload = function(ev){
    var files = getCmsFiles();
    files.push({id:'f'+Date.now()+Math.random().toString(36).substr(2,4), name:file.name, desc:'', type:file.type||'application/octet-stream', size:file.size, url:ev.target.result, isLocal:true, uploadedAt:new Date().toISOString(), uploadedBy:sessionStorage.getItem('ecap_admin_user')||'admin'});
    saveCmsFiles(files);
    showToast(CL('uploaded_file')+file.name);
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
    showToast(CL('file_only_types')); e.target.value=""; return;
  }
  if(file.size > 2*1024*1024){ showToast(CL('file_too_large')); return; }
  var reader = new FileReader();
  reader.onload = function(ev){
    var files = getCmsFiles();
    files.push({id:"f"+Date.now(), name:file.name, desc:"", type:file.type||"application/octet-stream", size:file.size, url:ev.target.result, isLocal:true, uploadedAt:new Date().toISOString(), uploadedBy:sessionStorage.getItem("ecap_admin_user")||"admin"});
    saveCmsFiles(files);
    showToast(CL('uploaded_file')+file.name);
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
  showToast(CL('added_file')+name);
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

// User Management view (standalone tab) — with sub-tabs for Users and Groups
var _cmsUserSubTab = 'users';
window._cmsUserMgmtView = function(subTab){
  if(subTab) _cmsUserSubTab = subTab;

  // Clear header actions — no CKEditor in user mgmt
  window._cmsUpdateHeaderActions('');
  var currentUser = sessionStorage.getItem("ecap_admin_user") || "admin";
  var users = getCmsUsers();
  var cfg2fa = get2FAConfig();
  var tabHtml = '<div class="cms-user-tabs">'
    +'<button class="cms-utab'+(_cmsUserSubTab==='users'?' active':'')+'" onclick="window._cmsUserMgmtView(\'users\')">'+CL('tab_users')+'</button>'
    +'<button class="cms-utab'+(_cmsUserSubTab==='groups'?' active':'')+'" onclick="window._cmsUserMgmtView(\'groups\')">'+CL('tab_groups')+'</button>'
    +'</div>';
  var content = _cmsUserSubTab==='groups' ? _cmsGroupsSubView() : _cmsUserMgmtTab(users, currentUser, cfg2fa);
  document.getElementById("cmsEditor").innerHTML = '<div class="cms-panel">'+tabHtml+content+'</div>';
  // Auto-generate password for new user form
  if(_cmsUserSubTab==='users'){
    var pwdEl=document.getElementById('newUserGenPwd');
    if(pwdEl && !pwdEl.value) pwdEl.value=generatePassword(16);
  }
};

// Security view (standalone tab, admin only)
var _securityRefreshTimer = null;
window._cmsSecurityView = function(){
  document.getElementById("cmsEditor").innerHTML = '<div class="cms-panel">' + _cmsSecurityTab() + '</div>';
  // Auto-refresh sessions + audit every 10s while on security tab
  if(_securityRefreshTimer) clearInterval(_securityRefreshTimer);
  _securityRefreshTimer = setInterval(function(){
    if(_cmsSection !== 'security'){ clearInterval(_securityRefreshTimer); _securityRefreshTimer=null; return; }
    document.getElementById("cmsEditor").innerHTML = '<div class="cms-panel">' + _cmsSecurityTab() + '</div>';
  }, 10000);
};

// Legacy function kept for compatibility
window._cmsUsersView = function(tab){
  if(tab === 'account') window._cmsAccountView();
  else if(tab === 'users') window._cmsUserMgmtView();
  else if(tab === 'security') window._cmsSecurityView();
  else window._cmsAccountView();
};

function _cmsAccountTab(currentUser, cfg2fa){
  var users = getCmsUsers();
  var userObj = users.find(function(u){return u.username===currentUser;});
  var userTz = userObj ? (userObj.timezone||'Asia/Hong_Kong') : 'Asia/Hong_Kong';
  var CMS_TIMEZONES = [
    {value:'Asia/Hong_Kong',label:'tz_hongkong',utc:'+8'},
    {value:'Asia/Shanghai',label:'tz_shanghai',utc:'+8'},
    {value:'Asia/Taipei',label:'tz_taipei',utc:'+8'},
    {value:'Asia/Tokyo',label:'tz_tokyo',utc:'+9'},
    {value:'Asia/Singapore',label:'tz_singapore',utc:'+8'},
    {value:'Asia/Seoul',label:'tz_seoul',utc:'+9'},
    {value:'Asia/Bangkok',label:'tz_bangkok',utc:'+7'},
    {value:'Europe/London',label:'tz_london',utc:'+0'},
    {value:'America/New_York',label:'tz_newyork',utc:'-5'},
    {value:'America/Los_Angeles',label:'tz_losangeles',utc:'-8'},
    {value:'UTC',label:'tz_utc',utc:'+0'}
  ];
  var tzOpts = CMS_TIMEZONES.map(function(tz){
    return '<option value="'+tz.value+'"'+(userTz===tz.value?' selected':'')+'>'+CL(tz.label)+' (UTC'+tz.utc+')</option>';
  }).join('');

  return '<div class="cms-section-box">'
    +'<h3 style="font-size:20px;font-weight:700;margin-bottom:20px">'+CL('my_account')+'</h3>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start">'
    // Left: Change Password
    +'<div class="cms-card-box">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:16px">'+CL('change_pwd')+'</h4>'
    +'<div class="admin-field"><label>'+CL('current_pwd')+'</label><input type="password" id="pwdCurrent" placeholder="'+CL('current_pwd')+'"/></div>'
    +'<div class="admin-field"><label>'+CL('new_pwd')+'</label><input type="password" id="pwdNew" placeholder="'+CL('new_pwd')+'" oninput="var v=this.value,el=document.getElementById(\'pwdStrength\');if(!v){el.innerHTML=\'\';return;}var e=validatePasswordComplexity(v),s=checkPasswordStrength(v),h=\'<span style=color:\'+s.color+\'>\'+s.label+\'</span>\';if(e.length)h+=\'<div style=font-size:11px;color:#dc2626;margin-top:4px>\'+e.map(function(x){return \'&#10007; \'+x}).join(\'<br>\')+\'</div>\';el.innerHTML=h"/></div>'
    +'<div id="pwdStrength" style="font-size:12px;margin:-8px 0 8px"></div>'
    +'<div class="admin-field"><label>'+CL('confirm_pwd')+'</label><input type="password" id="pwdConfirm" placeholder="'+CL('confirm_pwd')+'"/></div>'
    +'<button class="admin-btn primary" onclick="window._cmsChangePassword()">'+CL('update_pwd')+'</button>'
    +'<div id="pwdMsg" style="font-size:13px;margin-top:8px;min-height:20px"></div>'
    +'</div>'
    // Right: My 2FA + Timezone
    +'<div>'
    +'<div class="cms-card-box" style="margin-bottom:16px">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:16px">'+CL('twofa_title')+'</h4>'
    +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">'
    +'<span style="font-size:14px;padding:4px 10px;border-radius:100px;font-weight:700;'+(cfg2fa[currentUser]?'background:#d1fae5;color:#059669':'background:#fee2e2;color:#dc2626')+'">'+(cfg2fa[currentUser]?CL('twofa_on'):CL('twofa_off'))+'</span>'
    +'</div>'
    +'<p style="font-size:14px;color:var(--text-sec);line-height:1.6;margin-bottom:16px">'+(cfg2fa[currentUser]?CL('twofa_on_desc'):CL('twofa_off_desc'))+'</p>'
    +'<button class="admin-btn '+(cfg2fa[currentUser]?'danger':'primary')+'" onclick="window._cms2FASetup(sessionStorage.getItem(\'ecap_admin_user\')||\'admin\')">'+(cfg2fa[currentUser]?CL('disable_2fa'):CL('setup_2fa'))+'</button>'
    +'</div>'
    // Timezone
    +'<div class="cms-card-box">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:8px">'+CL('timezone')+'</h4>'
    +'<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">'+CL('timezone_desc')+'</p>'
    +'<div style="display:flex;gap:8px;align-items:end">'
    +'<div class="admin-field" style="margin:0;flex:1"><select id="acctTimezone" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:inherit;background:var(--white)">'+tzOpts+'</select></div>'
    +'<button class="admin-btn primary" onclick="window._cmsSaveMyTimezone()" style="height:44px">'+CL('save')+'</button>'
    +'</div>'
    +'</div>'
    +'</div>'
    +'</div>'
    +'</div>';
}

function _cmsUserMgmtTab(users, currentUser, cfg2fa){
  var groups = getCmsGroups();
  function _grpName(gid){
    var g=groups.find(function(x){return x.id===gid;});
    return g?g.name:(gid||'—');
  }
  var userRows = users.length ? users.map(function(u,i){
    var isMe = u.username===currentUser;
    var disabled = u.enabled===false;
    var grpLabel = u.groupId ? _grpName(u.groupId) : CL('custom_perms');
    return '<div class="cms-user-row'+(disabled?' user-disabled':'')+'">'
      +'<div class="u-avatar'+(disabled?' disabled':'')+'">'+esc(u.username[0].toUpperCase())+'</div>'
      +'<div style="flex:1;min-width:0">'
      +'<div class="u-name">'+esc(u.username)+(isMe?' <span class="u-tag">'+CL('you')+'</span>':'')+(disabled?' <span style="color:#dc2626;font-size:12px;font-weight:600">'+CL('disabled_label')+'</span>':'')+'</div>'
      +'<div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">'
      +'<span class="role-badge role-admin" style="font-size:10px">'+esc(grpLabel)+'</span>'
      +'<span style="font-size:11px;padding:2px 8px;border-radius:100px;font-weight:600;'+(cfg2fa[u.username]?'background:#d1fae5;color:#059669':'background:#fee2e2;color:#dc2626')+'">'+(cfg2fa[u.username]?'2FA ON':'2FA OFF')+'</span>'
      +(u.force2FA?'<span style="font-size:11px;padding:2px 8px;border-radius:100px;font-weight:600;background:#fef9c3;color:#92400e">'+CL('force_2fa')+'</span>':'')
      +(u.lastLogin?'<span style="font-size:11px;color:var(--text-muted)">'+CL('last_login')+': '+new Date(u.lastLogin).toLocaleDateString('zh-HK')+'</span>':'')
      +'</div>'
      +'</div>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0">'
      +(!isMe?'<button class="admin-btn secondary" style="font-size:12px;padding:5px 12px" onclick="window._cmsEditUser('+i+')">'+CL('edit')+'</button>':'')
      +(!isMe&&cfg2fa[u.username]?'<button class="admin-btn secondary" style="font-size:12px;padding:5px 12px" onclick="window._cmsReset2FA(\''+u.username+'\')">'+CL('reset_2fa')+'</button>':'')
      +(!isMe?'<button class="admin-btn '+(disabled?'primary':'secondary')+'" style="font-size:12px;padding:5px 12px" onclick="window._cmsToggleUser('+i+')">'+(disabled?CL('enable'):CL('disable'))+'</button>':'')
      +(!isMe?'<button class="admin-btn danger" style="font-size:12px;padding:5px 14px" onclick="window._cmsUserDelete('+i+')">'+CL('remove')+'</button>':'')
      +'</div></div>';
  }).join("") : '<div style="color:var(--text-muted);font-size:14px;padding:8px 0">'+CL('default_admin_hint')+'</div>';

  // Build group options for add-user form
  var grpOpts = groups.map(function(g){
    return '<option value="'+g.id+'">'+esc(g.name)+'</option>';
  }).join('');

  return '<div class="cms-section-box">'
    +'<h3 style="font-size:20px;font-weight:700;margin-bottom:4px">'+CL('user_mgmt')+'</h3>'
    +'<p style="color:var(--text-muted);font-size:13px;margin-bottom:20px">'+(users.length||1)+CL('users_total')+'</p>'
    +'<div class="cms-users-list" style="margin-bottom:24px">'+userRows+'</div>'
    // Add new user
    +'<div class="cms-card-box">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:16px">'+CL('add_new_user')+'</h4>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
    +'<div class="admin-field"><label>'+CL('username')+'</label><input type="text" id="newUsername" placeholder="e.g. editor1"/></div>'
    +'<div class="admin-field"><label>'+CL('group_label')+'</label><select id="newUserGroup" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:inherit;background:var(--white)">'
    +grpOpts
    +'</select></div>'
    +'</div>'
    +'<div class="admin-field"><label>'+CL('auto_gen_pwd')+'</label>'
    +'<div style="display:flex;gap:8px;align-items:center">'
    +'<input type="text" id="newUserGenPwd" placeholder="Click \u21BB to generate or type a password" style="font-family:monospace;font-size:13px;flex:1;background:#f9fafb"/>'
    +'<button type="button" class="admin-btn secondary" style="padding:8px 12px;white-space:nowrap" onclick="document.getElementById(\'newUserGenPwd\').value=generatePassword(16);document.getElementById(\'newUserGenPwd\').focus();document.getElementById(\'newUserGenPwd\').select()" title="Generate random password">&#10227;</button>'
    +'<button type="button" class="admin-btn secondary" style="padding:8px 12px;white-space:nowrap" onclick="(function(){var v=document.getElementById(\'newUserGenPwd\').value;if(!v){showToast(\'Field is empty\');return;}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(v).then(function(){showToast(CL(\'pwd_copied\'))}).catch(function(){var i=document.getElementById(\'newUserGenPwd\');i.select();document.execCommand(\'copy\');showToast(CL(\'pwd_copied\'))})}else{var i=document.getElementById(\'newUserGenPwd\');i.select();document.execCommand(\'copy\');showToast(CL(\'pwd_copied\'))}})()">'+CL('copy_pwd')+'</button>'
    +'</div></div>'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
    +'<input type="checkbox" id="newUserForce2FA"/>'
    +'<label for="newUserForce2FA" style="font-size:13px;font-weight:500;cursor:pointer">'+CL('force_2fa')+'</label>'
    +'</div>'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'
    +'<input type="checkbox" id="newUserMustChangePwd"/>'
    +'<label for="newUserMustChangePwd" style="font-size:13px;font-weight:500;cursor:pointer">'+CL('must_change_pwd')+'</label>'
    +'</div>'
    +'<button class="admin-btn primary" onclick="window._cmsUserAdd()">'+CL('add_user')+'</button>'
    +'<div id="addUserMsg" style="font-size:13px;margin-top:8px;min-height:20px"></div>'
    +'</div>'
    +'</div>';
}

// ————— Groups Sub-View —————
var CMS_PERM_LABELS = {pages:'perm_pages',blog:'perm_blog',files:'perm_files',users:'perm_users',security:'perm_security'};

function _cmsGroupsSubView(){
  var groups = getCmsGroups();
  var users = getCmsUsers();
  var _canWrite = _cmsHasPermission('users.write');

  var rows = groups.map(function(g,i){
    // Count users in this group
    var memberCount = users.filter(function(u){return u.groupId===g.id;}).length;
    // Summarize permissions
    var writeCount = CMS_SECTIONS.filter(function(s){return g.perms[s+'.write'];}).length;
    var readCount = CMS_SECTIONS.filter(function(s){return g.perms[s+'.read'] && !g.perms[s+'.write'];}).length;
    var noneCount = CMS_SECTIONS.length - writeCount - readCount;
    return '<div class="cms-user-row">'
      +'<div class="u-avatar" style="background:var(--brand-gradient);font-size:12px">G</div>'
      +'<div style="flex:1;min-width:0">'
      +'<div class="u-name">'+esc(g.name)+'</div>'
      +'<div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">'
      +'<span style="font-size:11px;color:var(--text-muted)">'+memberCount+' '+CL('tab_users')+'</span>'
      +'<span style="font-size:11px;color:'+(noneCount>0?'#dc2626':'var(--text-muted)')+'">'+CL('perm_none')+': '+noneCount+'</span>'
      +'<span style="font-size:11px;color:var(--text-muted)">'+CL('perm_read')+': '+readCount+'</span>'
      +'<span style="font-size:11px;color:var(--text-muted)">'+CL('perm_write')+': '+writeCount+'</span>'
      +'</div></div>'
      +'<div style="display:flex;gap:6px;flex-shrink:0">'
      +(_canWrite?'<button class="admin-btn secondary" style="font-size:12px;padding:5px 12px" onclick="window._cmsGroupEdit(\''+g.id+'\')">'+CL('edit')+'</button>':'')
      +(_canWrite?'<button class="admin-btn danger" style="font-size:12px;padding:5px 12px" onclick="window._cmsGroupDelete(\''+g.id+'\')">'+CL('delete_group')+'</button>':'')
      +'</div></div>';
  }).join('');

  return '<div class="cms-section-box">'
    +'<h3 style="font-size:20px;font-weight:700;margin-bottom:4px">'+CL('group_mgmt')+'</h3>'
    +'<p style="color:var(--text-muted);font-size:13px;margin-bottom:20px">'+groups.length+CL('groups_total')+'</p>'
    +'<div class="cms-users-list" style="margin-bottom:24px">'+rows+'</div>'
    +(_canWrite?
      '<div class="cms-card-box">'
      +'<h4 style="font-size:16px;font-weight:700;margin-bottom:16px">'+CL('add_new_group')+'</h4>'
      +'<div class="admin-field"><label>'+CL('group_name')+'</label><input type="text" id="newGroupName" placeholder="e.g. 市場部"/></div>'
      +'<h4 style="font-size:14px;font-weight:600;margin:12px 0 8px">'+CL('custom_perms')+'</h4>'
      +_cmsPermGrid(_cmsEmptyPerms(), 'ngp')
      +'<button class="admin-btn primary" style="margin-top:12px" onclick="window._cmsGroupAdd()">'+CL('add_group')+'</button>'
      +'<div id="addGroupMsg" style="font-size:13px;margin-top:8px;min-height:20px"></div>'
      +'</div>'
    : '')
    +'</div>';
}

// Build permission grid HTML for a perms object
function _cmsPermGrid(permsObj, idPrefix){
  var h = '<table class="cms-files-table" style="margin-top:0">'
    +'<thead><tr><th>'+CL('perm_section')+'</th><th style="text-align:center;width:80px">'+CL('perm_none')+'</th><th style="text-align:center;width:80px">'+CL('perm_read')+'</th><th style="text-align:center;width:80px">'+CL('perm_write')+'</th></tr></thead><tbody>';
  CMS_SECTIONS.forEach(function(s){
    var level = permsObj[s+'.write'] ? 'write' : (permsObj[s+'.read'] ? 'read' : 'none');
    h += '<tr><td>'+CL(CMS_PERM_LABELS[s])+'</td>'
      +'<td style="text-align:center"><input type="radio" name="'+idPrefix+'_'+s+'" value="none"'+(level==='none'?' checked':'')+'/></td>'
      +'<td style="text-align:center"><input type="radio" name="'+idPrefix+'_'+s+'" value="read"'+(level==='read'?' checked':'')+'/></td>'
      +'<td style="text-align:center"><input type="radio" name="'+idPrefix+'_'+s+'" value="write"'+(level==='write'?' checked':'')+'/></td>'
      +'</tr>';
  });
  h += '</tbody></table>';
  return h;
}

// Read perms from a grid (radio buttons: none/read/write)
function _cmsReadPermGrid(idPrefix){
  var p = _cmsEmptyPerms();
  CMS_SECTIONS.forEach(function(s){
    var radios = document.querySelectorAll('input[name="'+idPrefix+'_'+s+'"]');
    var val = 'none';
    radios.forEach(function(r){ if(r.checked) val = r.value; });
    if(val === 'write'){ p[s+'.read']=true; p[s+'.write']=true; }
    else if(val === 'read'){ p[s+'.read']=true; p[s+'.write']=false; }
    else { p[s+'.read']=false; p[s+'.write']=false; }
  });
  return p;
}

// Add new group
window._cmsGroupAdd = function(){
  var name = document.getElementById('newGroupName').value.trim();
  var msg = document.getElementById('addGroupMsg');
  if(!name){ msg.style.color='#dc3545'; msg.textContent=CL('enter_username'); return; }
  var groups = getCmsGroups();
  var id = 'g_'+name.toLowerCase().replace(/[^a-z0-9]/g,'_')+'_'+Date.now().toString(36);
  var perms = _cmsReadPermGrid('ngp');
  groups.push({id:id, name:name, perms:perms, sessionTimeout:0, ipWhitelist:[]});
  saveCmsGroups(groups);
  addAuditLog('group_added', name);
  msg.style.color='#28a745'; msg.textContent=CL('add_group')+': '+name;
  document.getElementById('newGroupName').value='';
  window._cmsUserMgmtView('groups');
};

// Delete group
window._cmsGroupDelete = function(gid){
  if(!confirm(CL('del_group_q'))) return;
  var groups = getCmsGroups();
  var grp = groups.find(function(g){return g.id===gid;});
  groups = groups.filter(function(g){return g.id!==gid;});
  saveCmsGroups(groups);
  // Clear groupId from users in this group
  var users = getCmsUsers();
  var changed = false;
  users.forEach(function(u){ if(u.groupId===gid){ u.groupId=null; u.perms=_cmsEmptyPerms(); changed=true; } });
  if(changed) saveCmsUsers(users);
  addAuditLog('group_deleted', grp?grp.name:gid);
  window._cmsUserMgmtView('groups');
};

// Edit group modal
window._cmsGroupEdit = function(gid){
  var groups = getCmsGroups();
  var grp = groups.find(function(g){return g.id===gid;});
  if(!grp) return;
  var div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center';
  div.innerHTML = '<div style="background:var(--white);border-radius:12px;padding:32px;max-width:520px;width:90%;box-shadow:0 12px 40px rgba(0,0,0,.2);max-height:80vh;overflow-y:auto">'
    +'<h3 style="margin:0 0 20px;font-size:18px;font-weight:700">'+CL('edit_group')+': '+esc(grp.name)+'</h3>'
    +'<div class="admin-field"><label>'+CL('group_name')+'</label><input type="text" id="editGrpName" value="'+escAttr(grp.name)+'"/></div>'
    +'<h4 style="font-size:14px;font-weight:600;margin:16px 0 8px">'+CL('custom_perms')+'</h4>'
    +_cmsPermGrid(grp.perms, 'egp')
    +'<div class="admin-field" style="margin-top:16px"><label>'+CL('session_timeout')+' (0 = '+CL('session_timeout_desc').split('.')[0]+')</label><input type="number" id="editGrpTimeout" value="'+(grp.sessionTimeout||0)+'" min="0" max="480"/></div>'
    +'<div style="display:flex;gap:8px;margin-top:16px">'
    +'<button class="admin-btn primary" id="editGrpSaveBtn">'+CL('save_changes')+'</button>'
    +'<button class="admin-btn secondary" id="editGrpCancelBtn">'+CL('cancel')+'</button>'
    +'</div></div>';
  document.body.appendChild(div);
  document.getElementById('editGrpCancelBtn').addEventListener('click', function(){ div.remove(); });
  div.addEventListener('click', function(e){ if(e.target===div) div.remove(); });
  document.getElementById('editGrpSaveBtn').addEventListener('click', function(){
    var name = document.getElementById('editGrpName').value.trim();
    if(!name) return;
    var perms = _cmsReadPermGrid('egp');
    var timeout = parseInt(document.getElementById('editGrpTimeout').value)||0;
    var gs = getCmsGroups();
    var g = gs.find(function(x){return x.id===gid;});
    if(g){ g.name=name; g.perms=perms; g.sessionTimeout=timeout; }
    saveCmsGroups(gs);
    addAuditLog('group_edited', name);
    div.remove();
    window._cmsUserMgmtView('groups');
  });
};

function _cmsSecurityTab(){
  var whitelist = getIpWhitelist();
  var auditLog = getAuditLog();
  var timeout = getSessionTimeout();
  var clientIp = sessionStorage.getItem('ecap_client_ip')||'';
  var rlCfg = getRateLimitConfig();

  var ipRows = whitelist.length ? whitelist.map(function(item,i){
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--border-light);border-radius:8px;margin-bottom:6px;background:var(--white)">'
      +'<span style="font-family:monospace;font-size:14px;flex:1">'+esc(item.ip)+'</span>'
      +'<span style="font-size:12px;color:var(--text-muted)">'+esc(item.label||'')+'</span>'
      +'<span style="font-size:11px;padding:2px 8px;border-radius:100px;font-weight:600;'+(item.enabled!==false?'background:#d1fae5;color:#059669':'background:#fee2e2;color:#dc2626')+'">'+(item.enabled!==false?CL('active'):CL('user_disabled_s'))+'</span>'
      +'<button class="admin-btn secondary" style="font-size:11px;padding:4px 10px" onclick="window._cmsToggleIp('+i+')">'+(item.enabled!==false?CL('disable'):CL('enable'))+'</button>'
      +'<button class="admin-btn danger" style="font-size:11px;padding:4px 10px" onclick="window._cmsRemoveIp('+i+')">'+CL('remove')+'</button>'
      +'</div>';
  }).join('') : '<div style="color:var(--text-muted);font-size:13px;padding:8px 0">'+CL('no_ip_restrict')+'</div>';

  var _auditPage = window._auditPage || 0;
  var _auditPerPage = 20;
  var _auditFrom = window._auditDateFrom || '';
  var _auditTo = window._auditDateTo || '';

  // Filter audit log by date range
  var filteredLog = auditLog;
  if(_auditFrom){
    var fromTs = new Date(_auditFrom).getTime();
    filteredLog = filteredLog.filter(function(e){ return new Date(e.time).getTime() >= fromTs; });
  }
  if(_auditTo){
    var toTs = new Date(_auditTo+'T23:59:59').getTime();
    filteredLog = filteredLog.filter(function(e){ return new Date(e.time).getTime() <= toTs; });
  }
  var totalPages = Math.max(1, Math.ceil(filteredLog.length / _auditPerPage));
  if(_auditPage >= totalPages) _auditPage = totalPages - 1;
  if(_auditPage < 0) _auditPage = 0;
  var pagedLog = filteredLog.slice(_auditPage * _auditPerPage, (_auditPage + 1) * _auditPerPage);

  var auditRows = pagedLog.map(function(entry){
    var icon = entry.action.indexOf('login_success')>=0?'&#9989;':entry.action.indexOf('fail')>=0||entry.action.indexOf('blocked')>=0||entry.action.indexOf('locked')>=0||entry.action.indexOf('not_found')>=0||entry.action.indexOf('disabled')>=0?'&#10060;':'&#128276;';
    var actionText = esc(entry.action.replace(/_/g,' '));
    if(entry.detail) actionText += ' <span style="color:var(--text-muted);font-size:11px">('+esc(entry.detail)+')</span>';
    return '<div style="display:grid;grid-template-columns:24px 1fr 80px 120px 130px;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light);font-size:13px;align-items:center">'
      +'<span>'+icon+'</span>'
      +'<span style="color:var(--text-sec);line-height:1.4">'+actionText+'</span>'
      +'<span style="font-weight:600">'+esc(entry.user)+'</span>'
      +'<span style="color:var(--text-muted);font-size:12px;font-family:monospace">'+(entry.ip?esc(entry.ip):'<span style="opacity:.4">—</span>')+'</span>'
      +'<span style="color:var(--text-muted);font-size:11px;white-space:nowrap">'+new Date(entry.time).toLocaleString('zh-HK')+'</span>'
      +'</div>';
  }).join('');

  return '<div class="cms-section-box">'
    +'<h3 style="font-size:20px;font-weight:700;margin-bottom:4px">'+CL('security_title')+'</h3>'
    +'<p style="color:var(--text-muted);font-size:13px;margin-bottom:24px">'+CL('security_desc')+'</p>'
    // Security Status Overview
    +'<div class="cms-card-box" style="margin-bottom:24px;background:linear-gradient(135deg,rgba(180,21,64,.04),rgba(180,21,64,.08));border:1px solid rgba(180,21,64,.12)">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:12px">'+CL('security_overview')+'</h4>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">'
    +'<div>&#128274; <strong>'+CL('ip_whitelist')+':</strong> '+(whitelist.length?'<span style="color:#059669">'+whitelist.filter(function(x){return x.enabled!==false}).length+CL('active_ips')+'</span>':'<span style="color:#f59e0b">'+CL('off_all_ips')+'</span>')+'</div>'
    +'<div>&#9201; <strong>'+CL('session_timeout')+':</strong> '+timeout+CL('minutes_unit')+'</div>'
    +'<div>&#128272; <strong>2FA:</strong> '+(function(){
      var cfg2fa=get2FAConfig(); var totalUsers=Math.max(getCmsUsers().length,1); var enabled2fa=Object.keys(cfg2fa).length; var without=totalUsers-enabled2fa;
      return without>0?'<span style="color:#dc2626">'+without+CL('users_no_2fa')+'</span>':'<span style="color:#059669">'+CL('all_users_2fa')+'</span>';
    })()+'</div>'
    +'<div>&#128737; <strong>'+CL('rate_limit')+':</strong> <span style="color:#059669">'+getRateLimitConfig().maxAttempts+' / '+getRateLimitConfig().lockoutMinutes+' min</span></div>'
    +'<div>&#128270; <strong>'+CL('concurrent_login')+':</strong> <span style="color:#059669">'+(getConcurrentLimit()||CL('unlimited'))+'</span></div>'
    +'<div>&#128196; <strong>'+CL('audit_log')+':</strong> '+auditLog.length+CL('entries')+'</div>'
    +'</div>'
    +'</div>'
    // Backup & Restore
    +'<div class="cms-card-box" style="margin-bottom:24px">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:4px">'+CL('backup_restore')+'</h4>'
    +'<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">'+CL('backup_desc')+'</p>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +'<button class="admin-btn primary" style="font-size:13px" onclick="window._cmsExport()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> '+CL('backup_export')+'</button>'
    +'<button class="admin-btn secondary" style="font-size:13px" onclick="document.getElementById(\'cmsImportFileRestore\').click()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> '+CL('backup_import')+'</button>'
    +'<input type="file" id="cmsImportFileRestore" accept=".json" style="display:none" onchange="window._cmsImport(event)"/>'
    +'</div>'
    +'</div>'
    // IP Whitelist
    +'<div class="cms-card-box" style="margin-bottom:24px">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:4px">'+CL('ip_whitelist')+'</h4>'
    +'<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">'+CL('ip_desc')+(clientIp?' '+CL('your_ip')+'<strong>'+esc(clientIp)+'</strong>':'')+'</p>'
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
    +'<p style="font-size:12px;color:var(--text-muted);margin-top:6px">'+CL('timeout_auto')+timeout+CL('minutes_unit')+'</p>'
    +'</div>'
    // Concurrent Login Limit
    +'<div class="cms-card-box" style="margin-bottom:24px">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:4px">'+CL('concurrent_login')+'</h4>'
    +'<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">'+CL('concurrent_desc')+'</p>'
    +'<div style="display:flex;gap:12px;align-items:center">'
    +'<div class="admin-field" style="margin:0;flex:0 0 200px"><label>'+CL('concurrent_max')+'</label><input type="number" id="concurrentLimit" value="'+getConcurrentLimit()+'" min="0" max="10" style="width:100%"/></div>'
    +'<button class="admin-btn primary" onclick="window._cmsSaveConcurrent()" style="align-self:end;height:44px">'+CL('save')+'</button>'
    +'</div>'
    +'<p style="font-size:12px;color:var(--text-muted);margin-top:6px">0 = '+CL('unlimited')+'</p>'
    +'</div>'
    // Rate Limiting Config
    +'<div class="cms-card-box" style="margin-bottom:24px">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:4px">'+CL('rate_limit')+'</h4>'
    +'<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">'+CL('rate_limit_desc')+'</p>'
    +'<div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap">'
    +'<div class="admin-field" style="margin:0;flex:0 0 180px"><label>'+CL('max_attempts')+'</label><input type="number" id="rlMaxAttempts" value="'+rlCfg.maxAttempts+'" min="1" max="50" style="width:100%"/></div>'
    +'<div class="admin-field" style="margin:0;flex:0 0 180px"><label>'+CL('lockout_min')+'</label><input type="number" id="rlLockoutMin" value="'+rlCfg.lockoutMinutes+'" min="1" max="1440" style="width:100%"/></div>'
    +'<button class="admin-btn primary" onclick="window._cmsSaveRateLimit()" style="height:44px">'+CL('save')+'</button>'
    +'<button class="admin-btn secondary" onclick="localStorage.removeItem(\''+CMS_LOCKOUT_KEY+'\');showToast(CL(\'lockout_cleared\'));window._cmsSecurityView()" style="height:44px">'+CL('clear_lockouts')+'</button>'
    +'</div>'
    +'</div>'
    // Active Sessions
    +'<div class="cms-card-box" style="margin-bottom:24px">'
    +'<h4 style="font-size:16px;font-weight:700;margin-bottom:4px">'+CL('active_sessions')+'</h4>'
    +'<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">'+CL('sessions_desc')+'</p>'
    +(function(){
      var sessions = getActiveSessions().filter(function(s){ return s.lastActive > Date.now() - 2*60*60*1000; });
      if(!sessions.length) return '<div style="color:var(--text-muted);font-size:13px;padding:8px 0">'+CL('no_sessions')+'</div>';
      return sessions.map(function(s){
        var isMe = s.tabId === SESSION_TAB_ID;
        var ago = Math.round((Date.now() - s.lastActive)/60000);
        var agoStr = ago < 1 ? 'just now' : ago+'m ago';
        return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--border-light);border-radius:8px;margin-bottom:6px;background:var(--white)">'
          +'<span style="width:8px;height:8px;border-radius:50%;background:'+(ago<2?'#22c55e':'#f59e0b')+';flex-shrink:0"></span>'
          +'<span style="font-weight:600;flex:0 0 100px">'+esc(s.user)+'</span>'
          +'<span style="font-size:12px;color:var(--text-muted);font-family:monospace;flex:0 0 120px">'+(s.ip||'—')+'</span>'
          +'<span style="font-size:11px;color:var(--text-muted);flex:1">'+agoStr+(isMe?' <span style="color:var(--brand);font-weight:700">('+CL('you')+')</span>':'')+'</span>'
          +(!isMe?'<button class="admin-btn danger" style="font-size:11px;padding:4px 10px" onclick="window._cmsKickSession(\''+s.tabId+'\')">'+CL('kick_session')+'</button>':'')
          +'</div>';
      }).join('');
    })()
    +'</div>'
    // Audit Log
    +'<div class="cms-card-box">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:8px">'
    +'<h4 style="font-size:16px;font-weight:700;margin:0">'+CL('audit_log')+'</h4>'
    +'<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">'
    +'<input type="date" id="auditDateFrom" value="'+esc(_auditFrom)+'" onchange="window._auditDateFrom=this.value;window._auditPage=0;window._cmsSecurityView()" style="font-size:11px;padding:4px 6px;border:1px solid var(--border);border-radius:6px;font-family:inherit"/>'
    +'<span style="font-size:11px;color:var(--text-muted)">–</span>'
    +'<input type="date" id="auditDateTo" value="'+esc(_auditTo)+'" onchange="window._auditDateTo=this.value;window._auditPage=0;window._cmsSecurityView()" style="font-size:11px;padding:4px 6px;border:1px solid var(--border);border-radius:6px;font-family:inherit"/>'
    +(_auditFrom||_auditTo?'<button class="admin-btn secondary" style="font-size:11px;padding:4px 8px" onclick="window._auditDateFrom=\x27\x27;window._auditDateTo=\x27\x27;window._auditPage=0;window._cmsSecurityView()">'+CL('clear_filter')+'</button>':'')
    +'<button class="admin-btn secondary" style="font-size:11px;padding:4px 10px" onclick="window._cmsExportAuditCsv()">'+CL('export_csv')+'</button>'
    +'<button class="admin-btn secondary" style="font-size:11px;padding:4px 10px" onclick="if(confirm(CL(\'clear_log_q\'))){localStorage.removeItem(\''+CMS_AUDIT_KEY+'\');window._cmsSecurityView();}">'+CL('clear_log')+'</button>'
    +'</div>'
    +'</div>'
    +'<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">'+CL('audit_log_desc')+' ('+filteredLog.length+CL('entries')+')'+'</p>'
    +'<div style="display:grid;grid-template-columns:24px 1fr 80px 120px 130px;gap:10px;padding:6px 0;border-bottom:2px solid var(--border);font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px">'
    +'<span></span><span>'+CL('audit_col_action')+'</span><span>'+CL('audit_col_user')+'</span><span>'+CL('audit_col_ip')+'</span><span>'+CL('audit_col_time')+'</span>'
    +'</div>'
    +(auditRows||'<div style="color:var(--text-muted);font-size:13px;padding:12px 0">'+CL('no_log')+'</div>')
    // Pagination
    +(totalPages>1?'<div style="display:flex;justify-content:center;align-items:center;gap:8px;padding:12px 0;margin-top:8px;border-top:1px solid var(--border-light)">'
    +'<button class="admin-btn secondary" style="font-size:11px;padding:4px 10px" onclick="window._auditPage=0;window._cmsSecurityView()"'+(_auditPage<=0?' disabled':'')+'>&#171;</button>'
    +'<button class="admin-btn secondary" style="font-size:11px;padding:4px 10px" onclick="window._auditPage='+(_auditPage-1)+';window._cmsSecurityView()"'+(_auditPage<=0?' disabled':'')+'>&#8249;</button>'
    +'<span style="font-size:12px;color:var(--text-muted);min-width:80px;text-align:center">'+(_auditPage+1)+' / '+totalPages+'</span>'
    +'<button class="admin-btn secondary" style="font-size:11px;padding:4px 10px" onclick="window._auditPage='+(_auditPage+1)+';window._cmsSecurityView()"'+(_auditPage>=totalPages-1?' disabled':'')+'>&#8250;</button>'
    +'<button class="admin-btn secondary" style="font-size:11px;padding:4px 10px" onclick="window._auditPage='+(totalPages-1)+';window._cmsSecurityView()"'+(_auditPage>=totalPages-1?' disabled':'')+'>&#187;</button>'
    +'</div>':'')
    +'</div>'
    +'</div>';
}

// Export audit log as CSV — respects active date filter
window._cmsExportAuditCsv = function(){
  var log = getAuditLog();
  if(!log.length){ showToast(CL('no_log')); return; }
  var hasFilter = window._auditDateFrom || window._auditDateTo;
  var useFilter = hasFilter && confirm(CL('csv_filtered_q'));
  var data = log;
  var suffix = 'all';
  if(useFilter){
    if(window._auditDateFrom){
      var fromTs = new Date(window._auditDateFrom).getTime();
      data = data.filter(function(e){ return new Date(e.time).getTime() >= fromTs; });
    }
    if(window._auditDateTo){
      var toTs = new Date(window._auditDateTo+'T23:59:59').getTime();
      data = data.filter(function(e){ return new Date(e.time).getTime() <= toTs; });
    }
    suffix = (window._auditDateFrom||'start')+'_'+(window._auditDateTo||'end');
  }
  if(!data.length){ showToast(CL('no_log')); return; }
  var csvRows = ['Time,User,Action,Detail,IP'];
  data.forEach(function(e){
    var row = [
      '"'+(e.time||'').replace(/"/g,'""')+'"',
      '"'+(e.user||'').replace(/"/g,'""')+'"',
      '"'+(e.action||'').replace(/"/g,'""')+'"',
      '"'+(e.detail||'').replace(/"/g,'""')+'"',
      '"'+(e.ip||'').replace(/"/g,'""')+'"'
    ];
    csvRows.push(row.join(','));
  });
  var blob = new Blob(['\ufeff'+csvRows.join('\r\n')], {type:'text/csv;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'audit_log_'+suffix+'_'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// IP Whitelist management
window._cmsAddIp = function(){
  var ip = document.getElementById('newIpAddr').value.trim();
  if(!ip){ showToast(CL('enter_ip')); return; }
  var label = document.getElementById('newIpLabel').value.trim();
  var list = getIpWhitelist();
  if(list.some(function(x){return x.ip===ip;})){ showToast(CL('ip_exists')); return; }
  list.push({ip:ip, label:label, enabled:true, addedAt:new Date().toISOString()});
  saveIpWhitelist(list);
  addAuditLog('ip_added', ip+(label?' ('+label+')':''));
  showToast(CL('ip_added')+ip);
  window._cmsUsersView('security');
};
window._cmsAddMyIp = function(){
  var ip = sessionStorage.getItem('ecap_client_ip');
  if(!ip){
    fetch('https://api.ipify.org?format=json').then(function(r){return r.json();}).then(function(d){
      sessionStorage.setItem('ecap_client_ip', d.ip);
      document.getElementById('newIpAddr').value = d.ip;
      document.getElementById('newIpLabel').value = CL('my_ip');
      showToast(CL('ip_detected')+d.ip);
    }).catch(function(){ showToast(CL('ip_detect_fail')); });
    return;
  }
  document.getElementById('newIpAddr').value = ip;
  document.getElementById('newIpLabel').value = CL('my_ip');
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
  if(!confirm(CL('remove_ip_q')+list[idx].ip+'?')) return;
  var ip = list[idx].ip;
  list.splice(idx,1);
  saveIpWhitelist(list);
  addAuditLog('ip_removed', ip);
  showToast(CL('ip_removed'));
  window._cmsUsersView('security');
};
window._cmsSaveTimeout = function(){
  var val = parseInt(document.getElementById('sessionTimeout').value)||30;
  if(val<5) val=5; if(val>480) val=480;
  saveSessionTimeout(val);
  addAuditLog('timeout_changed', val+' minutes');
  showToast(CL('timeout_set')+val+CL('minutes_unit'));
};
window._cmsSaveRateLimit = function(){
  var maxA = parseInt(document.getElementById('rlMaxAttempts').value)||5;
  var lockM = parseInt(document.getElementById('rlLockoutMin').value)||15;
  if(maxA<1) maxA=1; if(maxA>50) maxA=50;
  if(lockM<1) lockM=1; if(lockM>1440) lockM=1440;
  saveRateLimitConfig({maxAttempts:maxA, lockoutMinutes:lockM});
  addAuditLog('ratelimit_changed', maxA+' attempts / '+lockM+' min lockout');
  showToast(CL('rate_limit')+': '+maxA+' / '+lockM+' min');
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

// Edit user modal — group, permissions, password, timezone, force2FA
window._cmsEditUser = function(idx){
  var users = getCmsUsers();
  var u = users[idx];
  if(!u) return;
  var groups = getCmsGroups();
  var grpOpts = groups.map(function(g){
    return '<option value="'+g.id+'"'+(u.groupId===g.id?' selected':'')+'>'+esc(g.name)+'</option>';
  }).join('');
  var CMS_TIMEZONES = [
    {value:'Asia/Hong_Kong',label:'tz_hongkong',utc:'+8'},
    {value:'Asia/Shanghai',label:'tz_shanghai',utc:'+8'},
    {value:'Asia/Taipei',label:'tz_taipei',utc:'+8'},
    {value:'Asia/Tokyo',label:'tz_tokyo',utc:'+9'},
    {value:'Asia/Singapore',label:'tz_singapore',utc:'+8'},
    {value:'Asia/Seoul',label:'tz_seoul',utc:'+9'},
    {value:'Asia/Bangkok',label:'tz_bangkok',utc:'+7'},
    {value:'Europe/London',label:'tz_london',utc:'+0'},
    {value:'America/New_York',label:'tz_newyork',utc:'-5'},
    {value:'America/Los_Angeles',label:'tz_losangeles',utc:'-8'},
    {value:'UTC',label:'tz_utc',utc:'+0'}
  ];
  var tzOpts = CMS_TIMEZONES.map(function(tz){
    return '<option value="'+tz.value+'"'+(u.timezone===tz.value?' selected':'')+'>'+CL(tz.label)+' (UTC'+tz.utc+')</option>';
  }).join('');

  var div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center';
  div.innerHTML = '<div style="background:var(--white);border-radius:12px;padding:32px;max-width:560px;width:90%;box-shadow:0 12px 40px rgba(0,0,0,.2);max-height:85vh;overflow-y:auto">'
    +'<h3 style="margin:0 0 20px;font-size:18px;font-weight:700">'+CL('edit')+': '+esc(u.username)+'</h3>'
    // Group
    +'<div class="admin-field"><label>'+CL('group_label')+'</label><select id="editUserGroup" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:inherit;background:var(--white)" onchange="var cp=document.getElementById(\'editUserCustomPerms\');if(cp)cp.style.display=this.value===\'__custom__\'?\'block\':\'none\'">'
    +grpOpts
    +'<option value="__custom__"'+(!u.groupId?' selected':'')+'>'+CL('no_group')+' ('+CL('custom_perms')+')</option>'
    +'</select></div>'
    // Custom perms (hidden unless custom selected)
    +'<div id="editUserCustomPerms" style="display:'+(!u.groupId?'block':'none')+'">'
    +'<h4 style="font-size:14px;font-weight:600;margin:12px 0 8px">'+CL('custom_perms')+'</h4>'
    +_cmsPermGrid(u.perms||_cmsEmptyPerms(), 'eup')
    +'</div>'
    // Password
    +'<div class="admin-field"><label>'+CL('new_pwd_blank')+'</label><input type="password" id="editUserPass" placeholder="'+CL('pwd_min6')+'"/></div>'
    +'<div class="admin-field"><label>'+CL('confirm_new_pwd')+'</label><input type="password" id="editUserPassConfirm" placeholder="'+CL('confirm_new_pwd')+'"/></div>'
    // Timezone
    +'<div class="admin-field"><label>'+CL('timezone')+'</label><select id="editUserTz" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:inherit;background:var(--white)">'+tzOpts+'</select></div>'
    // Force 2FA
    +'<div style="display:flex;align-items:center;gap:8px;margin:12px 0">'
    +'<input type="checkbox" id="editUserForce2FA"'+(u.force2FA?' checked':'')+'>'
    +'<label for="editUserForce2FA" style="font-size:13px;font-weight:500;cursor:pointer">'+CL('force_2fa')+'</label>'
    +'</div>'
    // Session timeout override
    +'<div class="admin-field"><label>'+CL('session_timeout')+' (0 = '+CL('session_timeout_desc').split('.')[0]+')</label><input type="number" id="editUserTimeout" value="'+(u.sessionTimeout||0)+'" min="0" max="480"/></div>'
    // Buttons
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
    var grpVal = document.getElementById('editUserGroup').value;
    var newPass = document.getElementById('editUserPass').value;
    var newPassConfirm = document.getElementById('editUserPassConfirm').value;
    var msg = document.getElementById('editUserMsg');
    var usr = getCmsUsers();
    if(!usr[idx]){msg.textContent=CL('user_not_found');return;}
    // Password validation
    if(newPass){
      if(newPass.length<6){msg.style.color='#dc3545';msg.textContent=CL('pwd_min6');return;}
      if(newPass!==newPassConfirm){msg.style.color='#dc3545';msg.textContent=CL('pwd_mismatch');return;}
    }
    // Group / custom perms
    if(grpVal==='__custom__'){
      usr[idx].groupId=null;
      usr[idx].perms=_cmsReadPermGrid('eup');
    } else {
      usr[idx].groupId=grpVal;
      usr[idx].perms=null;
    }
    usr[idx].timezone = document.getElementById('editUserTz').value;
    usr[idx].force2FA = document.getElementById('editUserForce2FA').checked;
    usr[idx].sessionTimeout = parseInt(document.getElementById('editUserTimeout').value)||0;
    function _finish(){
      saveCmsUsers(usr);
      // BUGFIX: Clear lockout when password is reset so user can log in immediately
      if(newPass){ try{ clearLoginAttempts(u.username); }catch(e){} }
      addAuditLog('user_edited', u.username+(newPass?', password reset':''));
      showToast(CL('user_updated')+u.username);
      div.remove();
      window._cmsUserMgmtView('users');
    }
    if(newPass){
      sha256hex(newPass).then(function(hash){ usr[idx].hash=hash; _finish(); });
    } else { _finish(); }
  });
};

window._cmsChangePassword = function(){
  var cur = document.getElementById("pwdCurrent").value;
  var nw = document.getElementById("pwdNew").value;
  var cf = document.getElementById("pwdConfirm").value;
  var msg = document.getElementById("pwdMsg");
  if(nw.length < 8){ msg.style.color="#dc3545"; msg.textContent=CL('pwd_min8'); return; }
  var _cpxErrs2 = validatePasswordComplexity(nw);
  if(_cpxErrs2.length){ msg.style.color="#dc3545"; msg.innerHTML=CL('pwd_complexity')+'<br>'+_cpxErrs2.join('<br>'); return; }
  if(nw !== cf){ msg.style.color="#dc3545"; msg.textContent=CL('pwd_mismatch'); return; }
  var currentUser = sessionStorage.getItem("ecap_admin_user") || "admin";
  checkAdminLogin(currentUser, cur).then(function(ok){
    // BUGFIX: checkAdminLogin returns {error:'...'} on failure (truthy), so check for error explicitly
    if(!ok || ok.error){ msg.style.color="#dc3545"; msg.textContent=CL('pwd_incorrect'); return; }
    sha256hex(nw).then(function(hash){
      var users = getCmsUsers();
      if(users.length === 0){
        // Move from default to custom user list
        users = [{username:"admin", hash:hash, role:"admin", enabled:true}];
      } else {
        var found = false;
        users.forEach(function(u){ if(u.username===currentUser){ u.hash=hash; found=true; } });
        if(!found) users.push({username:currentUser, hash:hash, role:"admin", enabled:true});
      }
      saveCmsUsers(users);
      msg.style.color="#28a745"; msg.textContent=CL('pwd_updated');
      document.getElementById("pwdCurrent").value="";
      document.getElementById("pwdNew").value="";
      document.getElementById("pwdConfirm").value="";
    });
  });
};

window._cmsSaveMyTimezone = function(){
  var sel = document.getElementById('acctTimezone');
  var tz = sel.value;
  var tzLabel = sel.options[sel.selectedIndex].text;
  var currentUser = sessionStorage.getItem('ecap_admin_user')||'admin';
  var users = getCmsUsers();
  var found = false;
  users.forEach(function(u){ if(u.username===currentUser){ u.timezone=tz; found=true; } });
  if(found){ saveCmsUsers(users); showToast(CL('timezone')+': '+tzLabel); }
  else { showToast(CL('timezone')+': '+tzLabel); }
};

window._cmsUserAdd = function(){
  var uname = document.getElementById("newUsername").value.trim();
  var pass = document.getElementById("newUserGenPwd").value;
  var msg = document.getElementById("addUserMsg");
  if(!uname){ msg.style.color="#dc3545"; msg.textContent=CL('enter_username'); return; }
  if(!pass){ msg.style.color="#dc3545"; msg.textContent=CL('auto_gen_pwd'); return; }
  if(pass.length<6){ msg.style.color="#dc3545"; msg.textContent='Password must be at least 6 characters'; return; }
  if(getCmsUsers().some(function(u){return u.username===uname;})){ msg.style.color="#dc3545"; msg.textContent=CL('username_exists'); return; }
  var grpEl = document.getElementById("newUserGroup");
  var groupId = grpEl ? grpEl.value : (getCmsGroups()[0]||{}).id||null;
  var force2FA = document.getElementById("newUserForce2FA") ? document.getElementById("newUserForce2FA").checked : false;
  var mustChangePwd = document.getElementById("newUserMustChangePwd") ? document.getElementById("newUserMustChangePwd").checked : false;
  sha256hex(pass).then(function(hash){
    // Re-read users fresh inside the async callback to avoid stale data
    var users = getCmsUsers();
    if(users.some(function(u){return u.username===uname;})){ msg.style.color="#dc3545"; msg.textContent=CL('username_exists'); return; }
    var grp = groupId ? getCmsGroups().find(function(g){return g.id===groupId;}) : null;
    var role = grp ? (grp.role||'editor') : 'editor';
    users.push({username:uname, hash:hash, role:role, groupId:groupId, perms:null, enabled:true, force2FA:force2FA, mustChangePassword:mustChangePwd, sessionTimeout:0, ipWhitelist:[], timezone:'Asia/Hong_Kong', lastLogin:null});
    saveCmsUsers(users);
    // BUGFIX: Clear any prior failed-login lockout for this username so the new user can log in immediately
    try{ clearLoginAttempts(uname); }catch(e){}
    console.log('[CMS] User created:', uname, 'hash:', hash, 'users now:', users.length);
    var grpName = groupId ? (getCmsGroups().find(function(g){return g.id===groupId;})||{}).name||groupId : CL('custom_perms');
    addAuditLog('user_added', 'User: '+uname+', group: '+grpName);
    msg.style.color="#28a745"; msg.textContent=CL('user_added')+uname+CL('user_as')+grpName;
    // Show credentials confirmation modal so admin can record/share the password
    try{ _cmsShowNewUserCredentials(uname, pass, force2FA, mustChangePwd); }catch(e){ console.error(e); }
    document.getElementById("newUsername").value="";
    document.getElementById("newUserGenPwd").value="";
    window._cmsUserMgmtView('users');
  }).catch(function(err){
    console.error('[CMS] User creation error:', err);
    msg.style.color="#dc3545"; msg.textContent='Error creating user: '+(err&&err.message||String(err));
  });
};

// Display new-user credentials in a modal so admin sees the exact password to share
function _cmsShowNewUserCredentials(uname, pass, force2FA, mustChangePwd){
  var div = document.createElement('div');
  div.style.cssText='position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center';
  var notes='';
  if(mustChangePwd) notes += '<li>User will be required to change password on first login.</li>';
  if(force2FA) notes += '<li>User will be required to set up 2FA (Google Authenticator) on first login.</li>';
  if(!notes) notes = '<li>User can log in directly with these credentials.</li>';
  div.innerHTML = '<div style="background:#fff;border-radius:12px;padding:28px;max-width:460px;width:90%;box-shadow:0 12px 40px rgba(0,0,0,.25)">'
    +'<h3 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#16a34a">&#10004; User Created</h3>'
    +'<p style="font-size:13px;color:#374151;margin-bottom:16px">Share these credentials with the user. <b>This password will not be shown again.</b></p>'
    +'<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:14px">'
    +'<div style="font-size:12px;color:#6b7280;margin-bottom:4px">Username</div>'
    +'<div style="font-family:monospace;font-size:15px;font-weight:600;margin-bottom:10px;word-break:break-all">'+esc(uname)+'</div>'
    +'<div style="font-size:12px;color:#6b7280;margin-bottom:4px">Password</div>'
    +'<div style="font-family:monospace;font-size:15px;font-weight:600;word-break:break-all">'+esc(pass)+'</div>'
    +'</div>'
    +'<ul style="font-size:12px;color:#374151;padding-left:18px;margin:0 0 16px">'+notes+'</ul>'
    +'<div style="display:flex;gap:8px;justify-content:flex-end">'
    +'<button id="_newCredCopy" class="admin-btn secondary" style="padding:8px 16px">Copy Password</button>'
    +'<button id="_newCredClose" class="admin-btn primary" style="padding:8px 16px">Close</button>'
    +'</div></div>';
  document.body.appendChild(div);
  document.getElementById('_newCredClose').addEventListener('click', function(){ div.remove(); });
  document.getElementById('_newCredCopy').addEventListener('click', function(){
    var txt = 'Username: '+uname+'\nPassword: '+pass;
    function _ok(){ showToast('Credentials copied'); }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(_ok).catch(function(){
        var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');_ok();}catch(e){}ta.remove();
      });
    } else {
      var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');_ok();}catch(e){}ta.remove();
    }
  });
}
// ————————— 2FA Management —————————
window._cmsReset2FA = function(username){
  if(!confirm(CL('reset_2fa_q').replace('{0}',username))) return;
  var cfg = get2FAConfig();
  delete cfg[username];
  save2FAConfig(cfg);
  showToast(CL('twofa_reset').replace('{0}',username));
  window._cmsUsersView('users');
};
window._cms2FASetup = function(username){
  var cfg = get2FAConfig();
  if(cfg[username]){
    if(!confirm(CL('twofa_already').replace('{0}',username))) return;
    delete cfg[username];
    save2FAConfig(cfg);
    showToast(CL('twofa_disabled').replace('{0}',username));
    window._cmsUsersView('users');
    return;
  }
  var secret = generateSecret();
  var issuer = 'e-Capital CMS';
  var otpUrl = 'otpauth://totp/'+encodeURIComponent(issuer+':'+username)+'?secret='+secret+'&issuer='+encodeURIComponent(issuer);
  var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(otpUrl);
  var div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center';
  div.innerHTML = '<div style="background:var(--white);border-radius:12px;padding:32px;max-width:400px;width:90%;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.2)">'
    +'<h3 style="margin:0 0 8px;font-size:18px">'+CL('setup_2fa_for').replace('{0}',esc(username))+'</h3>'
    +'<p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">'+CL('scan_qr')+'</p>'
    +'<img src="'+qrUrl+'" alt="QR" style="width:200px;height:200px;border:1px solid var(--border);border-radius:8px;margin-bottom:12px"/>'
    +'<div style="font-family:monospace;font-size:14px;letter-spacing:2px;background:var(--bg-box);padding:8px 12px;border-radius:6px;margin-bottom:16px;word-break:break-all">'+secret+'</div>'
    +'<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">'+CL('enter_code_verify')+'</p>'
    +'<input type="text" id="verify2FA" maxlength="6" placeholder="\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7" style="width:120px;text-align:center;font-size:20px;letter-spacing:6px;padding:8px;border:1.5px solid var(--border);border-radius:8px;margin-bottom:12px" inputmode="numeric"/>'
    +'<div style="display:flex;gap:8px;justify-content:center">'
    +'<button class="admin-btn primary" id="verify2FABtn" style="min-width:100px">'+CL('verify_enable')+'</button>'
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
    if(code.length!==6){document.getElementById('verify2FAErr').textContent=CL('enter_6digit');return;}
    verifyTOTP(secret, code).then(function(ok){
      if(ok){
        var c=get2FAConfig();
        c[username]=secret;
        save2FAConfig(c);
        showToast(CL('twofa_enabled').replace('{0}',username));
        div.remove();
        window._cmsUsersView('users');
      } else {
        document.getElementById('verify2FAErr').textContent=CL('invalid_code_retry');
      }
    });
  });
};


window._cmsUserDelete = function(idx){
  var users = getCmsUsers();
  var username = (users[idx]||{}).username;
  if(!username) return;
  if(!confirm(CL('remove_user_q').replace('{0}',username))) return;
  users.splice(idx,1);
  saveCmsUsers(users);
  showToast(CL('removed_user').replace('{0}',username));
  window._cmsUsersView('users');
};


// ————————————————————— FILE PICKER FOR EDITOR —————————————————————
window._cmsShowFilePicker = function(btn){
  var existingPicker = document.getElementById('cmsFilePicker');
  if(existingPicker){ existingPicker.remove(); return; }
  // Support both data-slug/data-lang pattern and direct data-ta-id
  var textareaId = btn.getAttribute('data-ta-id');
  if(!textareaId){
    var slug = btn.getAttribute('data-slug');
    var lang = btn.getAttribute('data-lang');
    textareaId = 'cms_b_'+slug+'_'+lang;
  }
  var files = getCmsFiles();

  var div = document.createElement('div');
  div.id = 'cmsFilePicker';
  div.className = 'cms-file-picker';

  var inner = '';
  if(files.length === 0){
    inner += '<div class="cfp-title">'+CL('insert_dl_title')+'</div>'
      +'<div class="cfp-empty">'+CL('no_files_dl')+'</div>';
  } else {
    inner += '<div class="cfp-title">'+CL('select_file')+'</div>';
    files.forEach(function(f, i){
      var isImg = /\.(jpe?g|png|gif|webp|svg)$/i.test(f.name) || /^image\//i.test(f.type||'');
      var isExt = f.type === 'external';
      var icon = isImg && f.url
        ? '<img src="'+f.url+'" style="width:40px;height:28px;object-fit:cover;border-radius:4px;flex-shrink:0;background:#f3f4f6">'
        : isImg
        ? '<span style="font-size:15px">🖼</span>'
        : isExt
        ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
        : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
      var badge = isImg ? '<span style="font-size:9px;padding:1px 5px;background:rgba(0,128,0,.1);color:green;border-radius:4px;margin-left:4px">IMG</span>'
        : isExt ? '<span style="font-size:9px;padding:1px 5px;background:rgba(0,0,200,.1);color:#339;border-radius:4px;margin-left:4px">URL</span>'
        : '<span style="font-size:9px;padding:1px 5px;background:rgba(180,21,64,.1);color:var(--brand);border-radius:4px;margin-left:4px">DL</span>';
      inner += '<div class="cfp-item" data-file-idx="'+i+'" data-ta-id="'+textareaId+'">'+icon+'<span>'+esc(f.name)+'</span>'+badge+'</div>';
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

  // Position picker below the button (position:fixed uses viewport coords, no scrollY)
  var rect = btn.getBoundingClientRect();
  document.body.appendChild(div);
  var pw = div.offsetWidth;
  var ph = div.offsetHeight;
  var left = Math.max(8, Math.min(rect.right - pw, window.innerWidth - pw - 8));
  var top = rect.bottom + 6;
  // If picker would overflow below viewport, flip above button
  if(top + ph > window.innerHeight - 8){
    top = Math.max(8, rect.top - ph - 6);
  }
  div.style.top = top+'px';
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
  // Detect image files — insert as <img> tag
  var isImg = /\.(jpe?g|png|gif|webp|svg)$/i.test(f.name) || /^image\//i.test(f.type||'');
  var snippet;
  if(isImg){
    var src = f.url || f.data || '';
    snippet = '<img src="'+src+'" alt="'+f.name.replace(/"/g,'&quot;').replace(/\.[^.]+$/,'')+'" style="max-width:100%;height:auto"/>';
  } else if(f.type === 'external'){
    snippet = '<a href="'+f.url+'" target="_blank" rel="noopener">'+f.name+'</a>';
  } else {
    snippet = '<a href="'+f.url+'" download="'+f.name.replace(/"/g,'&quot;')+'">'+f.name+'</a>';
  }
  // Insert into CKEditor if available
  var editor = _cmsEditors[textareaId];
  if(editor){
    var viewFragment = editor.data.processor.toView(snippet);
    var modelFragment = editor.data.toModel(viewFragment);
    editor.model.insertContent(modelFragment);
    showToast(CL('inserted_file')+f.name);
    return;
  }
  // Fallback: insert into textarea
  var ta = document.getElementById(textareaId);
  if(!ta){ showToast(CL('textarea_err')); return; }
  var s = ta.selectionStart, en = ta.selectionEnd;
  ta.value = ta.value.substring(0,s) + snippet + ta.value.substring(en);
  ta.selectionStart = ta.selectionEnd = s + snippet.length;
  ta.focus();
  showToast(CL('inserted_file')+f.name);
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

// Toggle between CKEditor (WYSIWYG) and raw HTML source textarea
window._cmsToggleSource = function(taId){
  var editor = _cmsEditors[taId];
  var wrap = document.getElementById(taId+'_wrap');
  if(!wrap) return;
  var existing = wrap.querySelector('textarea.cms-source-ta');
  if(existing){
    // Switch back to WYSIWYG — push source textarea content into CKEditor
    if(editor) editor.setData(existing.value);
    existing.remove();
    if(editor) editor.ui.view.element.style.display = '';
  } else {
    // Switch to source — show raw HTML textarea
    var html = editor ? editor.getData() : '';
    if(editor) editor.ui.view.element.style.display = 'none';
    var ta = document.createElement('textarea');
    ta.className = 'cms-source-ta';
    ta.style.cssText = 'width:100%;min-height:300px;font-family:monospace;font-size:13px;padding:12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);box-sizing:border-box';
    ta.value = html;
    wrap.appendChild(ta);
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
  // Destroy any existing CKEditor instances
  Object.keys(_cmsEditors).forEach(function(k){ try{ _cmsEditors[k].destroy(); }catch(e){} });
  _cmsEditors = {};

  var articles = _getBlogArticles();
  var _canEdit = _cmsHasPermission("editPage");

  // Update header bar actions
  window._cmsUpdateHeaderActions(
    '<button class="admin-btn secondary" style="font-size:12px;padding:5px 10px" onclick="window._cmsCkHelp()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> '+CL('ck_help')+'</button>'
  );

  var rows = articles.length ? articles.map(function(a,i){
    var title = a.title_hant || a.title_en || 'Untitled';
    return '<div class="cms-item-card" draggable="true">'
      +'<span class="dnd-handle" title="Drag to reorder">&#x2807;</span>'
      +'<img class="cms-item-thumb" src="'+escAttr(a.img||'')+'" onerror="this.style.background=\'#eee\'"/>'
      +'<div class="cms-item-info">'
      +'<div class="cms-item-title">'+esc(title)+'</div>'
      +'<div class="cms-item-meta">'+esc(a.date||'')+' &middot; '+esc(a.tag_hant||a.tag_en||'')+'</div>'
      +'<div class="cms-item-meta">slug: '+esc(a.slug||'')+'</div>'
      +'</div>'
      +'<div class="cms-item-actions" style="display:flex;gap:4px;align-items:center">'
      +'<button class="admin-btn secondary" title="'+CL('btn_preview')+'" style="font-size:11px;padding:4px 10px" onclick="window._cmsBlogPreview('+i+')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> '+CL('btn_preview')+'</button>'
      +(_canEdit?'<button class="admin-btn primary" style="font-size:11px;padding:4px 10px" onclick="window._cmsBlogEdit('+i+')">'+CL('edit')+'</button>':'')
      +(_canEdit?'<button class="admin-btn danger" style="font-size:11px;padding:4px 8px" onclick="window._cmsBlogDelete('+i+')">'+CL('del_short')+'</button>':'')
      +'</div></div>';
  }).join("") : '<div class="cms-item-meta" style="padding:12px 0">'+CL('no_articles')+'</div>';

  document.getElementById("cmsEditor").innerHTML =
    '<div class="cms-panel">'
    +'<div class="cms-panel-header"><h3>'+CL('blog_title')+'</h3>'
    +'<p>'+CL('blog_desc')+'<br>'+CL('blog_img_hint')+'</p></div>'
    +(articles.length > 1 ? '<p style="font-size:11px;color:var(--text-muted);margin:0 0 8px;display:flex;align-items:center;gap:4px"><span class="dnd-handle" style="font-size:14px;padding:0">&#x2807;</span>'+CL('dnd_hint')+'</p>' : '')
    +'<div id="cmsBlogList">' + rows + '</div>'
    +(_canEdit?'<button class="admin-btn primary" style="margin-top:12px" onclick="window._cmsBlogEdit(-1)">'+CL('new_article')+'</button>':'')
    +'</div>';
  var listEl = document.getElementById('cmsBlogList');
  if(listEl) _cmsDndInit(listEl, function(from, to){ window._cmsBlogMove(from, to); });
};

window._cmsBlogEdit = function(idx){
  // Destroy any existing CKEditor instances
  Object.keys(_cmsEditors).forEach(function(k){ try{ _cmsEditors[k].destroy(); }catch(e){} });
  _cmsEditors = {};

  var articles = _getBlogArticles();
  _cmsBlogEditIdx = idx;
  var a = idx >= 0 ? articles[idx] : {slug:'hk-news-',title_en:'',title_hans:'',title_hant:'',tag_en:'',tag_hans:'',tag_hant:'',date:new Date().toISOString().slice(0,10),img:'',body_en:'',body_hans:'',body_hant:''};
  var hasCK = typeof ClassicEditor !== 'undefined';

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
    +'<div id="blogBodyHant_wrap"><textarea id="blogBodyHant" class="admin-field" style="min-height:300px;font-family:monospace;font-size:13px">'+escHtml(a.body_hant||'')+'</textarea></div>'
    +'<div id="blogBodyHans_wrap" style="display:none"><textarea id="blogBodyHans" class="admin-field" style="min-height:300px;font-family:monospace;font-size:13px">'+escHtml(a.body_hans||'')+'</textarea></div>'
    +'<div id="blogBodyEn_wrap" style="display:none"><textarea id="blogBodyEn" class="admin-field" style="min-height:300px;font-family:monospace;font-size:13px">'+escHtml(a.body_en||'')+'</textarea></div>'
    +'</div>'
    // Save
    +'<div class="cms-form-row">'
    +'<button class="admin-btn primary" onclick="window._cmsBlogSave()">'+CL('save_article')+'</button>'
    +'<button class="admin-btn secondary" onclick="window._cmsBlogView()">'+CL('cancel')+'</button>'
    +'</div>'
    +'</div>';

  document.getElementById("cmsEditor").innerHTML = h;

  // Initialize CKEditor on each body textarea
  if(hasCK){
    var blogTas = [
      {id:'blogBodyHant', lang:'zh-cn'},
      {id:'blogBodyHans', lang:'zh-cn'},
      {id:'blogBodyEn', lang:'en'}
    ];
    blogTas.forEach(function(cfg){
      var ta = document.getElementById(cfg.id);
      if(!ta) return;
      ClassicEditor.create(ta, {
        extraPlugins: [_cmsCkUploadPlugin],
        toolbar: {items:['heading','|','bold','italic','underline','strikethrough','|','link','imageUpload','blockQuote','insertTable','horizontalLine','|','bulletedList','numberedList','|','outdent','indent','|','fontColor','fontBackgroundColor','removeFormat','|','undo','redo'],shouldNotGroupWhenFull:false},
        heading: { options: [
          { model:'paragraph', title:'Paragraph', class:'ck-heading_paragraph' },
          { model:'heading2', view:'h2', title:'Heading 2', class:'ck-heading_heading2' },
          { model:'heading3', view:'h3', title:'Heading 3', class:'ck-heading_heading3' },
          { model:'heading4', view:'h4', title:'Heading 4', class:'ck-heading_heading4' }
        ]},
        language: cfg.lang
      }).then(function(editor){
        _cmsEditors[cfg.id] = editor;
        // Inject file buttons into CKEditor toolbar
        var wrapDiv = document.getElementById(cfg.id+'_wrap');
        if(wrapDiv){
          var ckToolbar = wrapDiv.querySelector('.ck-toolbar__items');
          if(ckToolbar){
            var sep = document.createElement('span');
            sep.className = 'ck ck-toolbar__separator';
            ckToolbar.appendChild(sep);
            var libBtn = document.createElement('button');
            libBtn.type = 'button';
            libBtn.className = 'ck ck-button cms-ck-tb-btn';
            libBtn.setAttribute('data-ta-id', cfg.id);
            libBtn.title = CL('insert_dl');
            libBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg><span class="cms-ck-tb-label"> '+CL('insert_dl')+'</span>';
            libBtn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); window._cmsShowFilePicker(this); };
            ckToolbar.appendChild(libBtn);
            var upBtn = document.createElement('button');
            upBtn.type = 'button';
            upBtn.className = 'ck ck-button cms-ck-tb-btn';
            upBtn.setAttribute('data-ta-id', cfg.id);
            upBtn.title = CL('upload_insert');
            upBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span class="cms-ck-tb-label"> '+CL('upload_insert')+'</span>';
            var fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.zip';
            fileInput.style.display = 'none';
            fileInput.id = 'cmsCkFile_'+cfg.id;
            fileInput.onchange = function(){ window._cmsCkFileUpload(this, cfg.id); };
            upBtn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); fileInput.click(); };
            ckToolbar.appendChild(upBtn);
            ckToolbar.appendChild(fileInput);
          }
        }
      })['catch'](function(err){ console.warn('Blog CKEditor init failed for '+cfg.id, err); });
    });
  }
};

window._cmsBlogBodyTab = function(lang){
  ['hant','hans','en'].forEach(function(l){
    var wrap = document.getElementById('blogBody'+l.charAt(0).toUpperCase()+l.slice(1)+'_wrap');
    var btn = document.getElementById('blogBodyTab'+l.charAt(0).toUpperCase()+l.slice(1));
    if(wrap) wrap.style.display = l===lang ? '' : 'none';
    if(btn) btn.classList.toggle('active', l===lang);
  });
};

window._cmsBlogImgUpload = function(e){
  var file = e.target.files[0];
  if(!file) return;
  if(file.size > 5*1024*1024){ showToast(CL('img_too_large')); return; }
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
      showToast(CL('img_resized'));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
};

window._cmsBlogSave = function(){
  var slug = document.getElementById('blogSlug').value.trim();
  if(!slug || slug.indexOf('hk-news-')!==0){ showToast(CL('slug_prefix')); return; }
  var titleHant = document.getElementById('blogTitleHant').value.trim();
  if(!titleHant){ showToast(CL('enter_title_hant')); return; }

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
    body_hant: _cmsEditors['blogBodyHant'] ? _cmsEditors['blogBodyHant'].getData() : document.getElementById('blogBodyHant').value,
    body_hans: _cmsEditors['blogBodyHans'] ? _cmsEditors['blogBodyHans'].getData() : document.getElementById('blogBodyHans').value,
    body_en: _cmsEditors['blogBodyEn'] ? _cmsEditors['blogBodyEn'].getData() : document.getElementById('blogBodyEn').value
  };

  var articles = _getBlogArticles();
  if(_cmsBlogEditIdx >= 0){
    articles[_cmsBlogEditIdx] = article;
  } else {
    // Check slug uniqueness
    for(var i=0;i<articles.length;i++){
      if(articles[i].slug === slug){ showToast(CL('slug_exists')); return; }
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

window._cmsBlogMove = function(from, to){
  var articles = _getBlogArticles();
  if(from < 0 || to < 0 || from >= articles.length || to >= articles.length || from === to) return;
  var item = articles.splice(from, 1)[0];
  articles.splice(to, 0, item);
  saveCmsBlog(articles);
  window._cmsBlogView();
};

// ————————————————————— CMS HOMEPAGE EDITOR —————————————————————
// Helper: get footer CMS data
function getCmsFooter(){ try{ return JSON.parse(localStorage.getItem('ecap_cms_footer'))||{}; }catch(e){ return {}; } }
function saveCmsFooter(d){ localStorage.setItem('ecap_cms_footer', JSON.stringify(d)); }
window.getCmsFooter = getCmsFooter;
window.saveCmsFooter = saveCmsFooter;
// Helper: get nav CMS data
function getCmsNav(){ try{ return JSON.parse(localStorage.getItem('ecap_cms_nav'))||{}; }catch(e){ return {}; } }
function saveCmsNav(d){ localStorage.setItem('ecap_cms_nav', JSON.stringify(d)); }
window.getCmsNav = getCmsNav;
window.saveCmsNav = saveCmsNav;

window._cmsHomeView = function(){
  _cmsSection = 'home';
  window._cmsSection = 'home';
  window._cmsCurrentSlug = '__home__';
  // Destroy any existing CKEditor instances from previous render
  Object.keys(_cmsEditors).forEach(function(k){ try{ _cmsEditors[k].destroy(); }catch(e){} });
  _cmsEditors = {};

  // Highlight homepage item in sidebar
  document.querySelectorAll('.cms-page-item').forEach(function(el){ el.classList.remove('active'); });
  var homeItem = document.querySelector('.cms-page-home');
  if(homeItem) homeItem.classList.add('active');

  var langs = ["zh-Hant","zh-Hans","en"];
  var langNames = {"zh-Hant":"繁體中文","zh-Hans":"简体中文","en":"English"};
  var ch = window.getCmsHome ? window.getCmsHome() : {};
  var hasCK = typeof ClassicEditor !== 'undefined';

  // Default values per language
  var defaults = {
    hero: {
      "zh-Hant": { badge:'香港證監會持牌', title:'您的專業<br>證券及期貨交易夥伴', subtitle:'逾三十年香港金融市場經驗，提供證券、期貨、期權交易及滬港通服務。', cta1_text:'開立帳戶', cta1_link:'#/page/stock-account-opening', cta2_text:'立即交易', cta2_link:'https://itrade.e-capital.com.hk:8888/' },
      "zh-Hans": { badge:'香港证监会持牌', title:'您的专业<br>证券及期货交易伙伴', subtitle:'逾三十年香港金融市场经验，提供证券、期货、期权交易及沪港通服务。', cta1_text:'开立帐户', cta1_link:'#/page/stock-account-opening', cta2_text:'立即交易', cta2_link:'https://itrade.e-capital.com.hk:8888/' },
      "en": { badge:'SFC Licensed', title:'Your Professional<br>Securities & Futures Partner', subtitle:'Over 30 years of experience in Hong Kong financial markets.', cta1_text:'Open Account', cta1_link:'#/page/stock-account-opening', cta2_text:'Trade Now', cta2_link:'https://itrade.e-capital.com.hk:8888/' }
    },
    svc1: {
      "zh-Hant": { label:'股票交易', title:'港股及環球股票交易服務', desc:'透過專業 iTrader 交易平台，輕鬆買賣港股、A股及環球主要市場的股票。', img:'images/ecap-svc-securities.png' },
      "zh-Hans": { label:'股票交易', title:'港股及环球股票交易服务', desc:'透过专业 iTrader 交易平台，轻松买卖港股、A股及环球主要市场的股票。', img:'images/ecap-svc-securities.png' },
      "en": { label:'Securities Trading', title:'Hong Kong & Global Equities Trading', desc:'Trade stocks listed on Hong Kong, Shanghai, and other major global exchanges.', img:'images/ecap-svc-securities.png' }
    },
    svc2: {
      "zh-Hant": { label:'滬港通', title:'滬港通交易服務', desc:'透過全面的滬港通服務進入A股市場。', img:'images/ecap-svc-connect.png' },
      "zh-Hans": { label:'沪港通', title:'沪港通交易服务', desc:'透过全面的沪港通服务进入A股市场。', img:'images/ecap-svc-connect.png' },
      "en": { label:'SH-HK Stock Connect', title:'Shanghai-Hong Kong Stock Connect', desc:'Access A-share market through our comprehensive Stock Connect service.', img:'images/ecap-svc-connect.png' }
    },
    svc3: {
      "zh-Hant": { label:'期貨及期權', title:'期貨及期權交易服務', desc:'透過專業 Sharp Point 交易平台，交易主要交易所的期貨及期權。', img:'images/ecap-svc-futures.png' },
      "zh-Hans": { label:'期货及期权', title:'期货及期权交易服务', desc:'透过专业 Sharp Point 交易平台，交易主要交易所的期货及期权。', img:'images/ecap-svc-futures.png' },
      "en": { label:'Futures & Options', title:'Futures & Options Trading', desc:'Trade futures and options on major exchanges.', img:'images/ecap-svc-futures.png' }
    },
    cta: {
      "zh-Hant": { title:'立即開戶 把握投資先機', desc:'群益證券為您提供港股、A股及環球市場交易服務。', btn1_text:'開立帳戶', btn1_link:'#/page/stock-account-opening', btn2_text:'查看收費', btn2_link:'#/page/stock-fee', steps:JSON.stringify(['下載\n開戶合約','提交\n所需文件','帳戶\n審批通過','開始\n交易']) },
      "zh-Hans": { title:'立即开户 把握投资先机', desc:'群益证券为您提供港股、A股及环球市场交易服务。', btn1_text:'开立帐户', btn1_link:'#/page/stock-account-opening', btn2_text:'查看收费', btn2_link:'#/page/stock-fee', steps:JSON.stringify(['下载\n开户合约','提交\n所需文件','帐户\n审批通过','开始\n交易']) },
      "en": { title:'Open Your Account Today', desc:'Start trading in Hong Kong, Shanghai and global markets with Capital Securities.', btn1_text:'Open Account', btn1_link:'#/page/stock-account-opening', btn2_text:'View Fees', btn2_link:'#/page/stock-fee', steps:JSON.stringify(['Download\nAgreement','Submit\nDocuments','Account\nApproved','Start\nTrading']) }
    },
    stats: {
      "zh-Hant": { items:JSON.stringify([{num:'30+',label:'年金融服務經驗'},{num:'SFC',label:'香港證監會持牌'},{num:'24/7',label:'全天候客戶服務'},{num:'多元',label:'市場覆蓋'}]) },
      "zh-Hans": { items:JSON.stringify([{num:'30+',label:'年金融服务经验'},{num:'SFC',label:'香港证监会持牌'},{num:'24/7',label:'全天候客户服务'},{num:'多元',label:'市场覆盖'}]) },
      "en": { items:JSON.stringify([{num:'30+',label:'Years of Experience'},{num:'SFC',label:'Hong Kong SFC Regulated'},{num:'24/7',label:'Customer Support'},{num:'Multi',label:'Market Access'}]) }
    },
    marquee: {
      "zh-Hant": { title:'群益金融集團', groups:JSON.stringify([{name:'群益金鼎證券'},{name:'群益證券(香港)'},{name:'群益期貨(香港)'},{name:'群益投信'},{name:'群益期貨'},{name:'群益金融集團'},{name:'群益投顧'}]) },
      "zh-Hans": { title:'群益金融集团', groups:JSON.stringify([{name:'群益金鼎证券'},{name:'群益证券(香港)'},{name:'群益期货(香港)'},{name:'群益投信'},{name:'群益期货'},{name:'群益金融集团'},{name:'群益投顾'}]) },
      "en": { title:'Capital Group', groups:JSON.stringify([{name:'Capital Securities Corp.'},{name:'Capital Securities (HK)'},{name:'Capital Futures (HK)'},{name:'Capital Investment Trust'},{name:'Capital Futures Corp.'},{name:'Capital Securities Group'},{name:'Capital Asset Management'}]) }
    },
    footer: {
      "zh-Hant": { brand_name:'群益證券(香港)有限公司', address:'香港灣仔告士打道151號資本中心21樓全層', tel:'(852) 2530-9966', fax:'(852) 2530-9424',
        columns:[{title:'產品服務',links:[{text:'證券交易',href:'#/page/stock-ipo'},{text:'滬港通',href:'#/page/shh-hk'}]},{title:'探索',links:[{text:'新聞',href:'#/page/news'}]},{title:'帳戶',links:[{text:'開戶程序',href:'#/page/stock-account-opening'}]},{title:'法律資訊',links:[{text:'個人私隱政策',href:'#/page/privacy'}]}] },
      "zh-Hans": { brand_name:'群益证券(香港)有限公司', address:'香港湾仔告士打道151号资本中心21楼全层', tel:'(852) 2530-9966', fax:'(852) 2530-9424',
        columns:[{title:'产品服务',links:[{text:'证券交易',href:'#/page/stock-ipo'},{text:'沪港通',href:'#/page/shh-hk'}]},{title:'探索',links:[{text:'新闻',href:'#/page/news'}]},{title:'账户',links:[{text:'开户程序',href:'#/page/stock-account-opening'}]},{title:'法律信息',links:[{text:'个人隐私政策',href:'#/page/privacy'}]}] },
      "en": { brand_name:'Capital Securities (Hong Kong) Limited', address:'21/F, Capital Centre, 151 Gloucester Road, Wan Chai, Hong Kong', tel:'(852) 2530-9966', fax:'(852) 2530-9424',
        columns:[{title:'Products',links:[{text:'Securities',href:'#/page/stock-ipo'},{text:'Stock Connect',href:'#/page/shh-hk'}]},{title:'Discover',links:[{text:'News',href:'#/page/news'}]},{title:'Account',links:[{text:'Open Account',href:'#/page/stock-account-opening'}]},{title:'Legal',links:[{text:'Privacy Policy',href:'#/page/privacy'}]}] }
    }
  };

  function gv(sec, field, lang){ return (ch[sec] && ch[sec][lang] && ch[sec][lang][field]) || (defaults[sec] && defaults[sec][lang] && defaults[sec][lang][field]) || ''; }

  function sectionAccordion(id, titleKey, bodyHtml){
    return '<div class="cms-home-sec">'
      +'<div class="cms-home-sec-hdr" onclick="this.parentNode.classList.toggle(\'open\')">'
      +'<span>'+CL(titleKey)+'</span>'
      +'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transition:transform .2s"><polyline points="6 9 12 15 18 9"/></svg>'
      +'</div>'
      +'<div class="cms-home-sec-body">'+bodyHtml+'</div>'
      +'</div>';
  }

  // Plain text input
  function plainField(id, labelKey, val){
    var esc_v = (val||'').replace(/"/g,'&quot;').replace(/</g,'&lt;');
    return '<div class="admin-field"><label>'+CL(labelKey)+'</label>'
      +'<input type="text" id="'+id+'" value="'+esc_v+'"/></div>';
  }

  // Rich text field — CKEditor will attach to the textarea
  function richField(id, labelKey, val){
    var esc_v = escHtml(val||'');
    return '<div class="admin-field">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
      +'<label style="margin:0">'+CL(labelKey)+'</label>'
      +(hasCK ? '<button type="button" class="cms-tb-btn" style="font-size:11px;padding:2px 8px" onclick="window._cmsToggleSource(\''+id+'\')">&#60;/&#62; Source</button>' : '')
      +'</div>'
      +'<div id="'+id+'_wrap">'
      +'<textarea id="'+id+'" class="cms-home-ck" style="min-height:120px;font-size:13px">'+esc_v+'</textarea>'
      +'</div></div>';
  }

  // Escape for safe embedding in onclick attribute strings
  function escQ(s){ return s.replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

  // Build HTML — only editor help in header
  window._cmsUpdateHeaderActions(
    '<button class="admin-btn secondary" style="font-size:12px;padding:5px 10px" onclick="window._cmsCkHelp()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> '+CL('ck_help')+'</button>'
  );

  var html = '<div class="cms-panel" style="max-width:none">'
    +'<div style="padding:8px 0 10px;display:flex;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px solid var(--border-light);margin-bottom:12px">'
    +'<h3 style="font-size:17px;font-weight:700;margin:0;white-space:nowrap">'+CL('tab_home')+'</h3>'
    +'<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">'
    +'<button class="admin-btn secondary" style="font-size:12px;padding:5px 12px" onclick="document.querySelectorAll(\'.cms-home-sec\').forEach(function(s){s.classList.add(\'open\')})">'+CL('expand_all')+'</button>'
    +'<button class="admin-btn secondary" style="font-size:12px;padding:5px 12px" onclick="document.querySelectorAll(\'.cms-home-sec\').forEach(function(s){s.classList.remove(\'open\')})">'+CL('collapse_all')+'</button>'
    +'<button class="admin-btn primary" style="font-size:13px" onclick="window._cmsHomeSave()">'+CL('save_changes')+'</button>'
    +'<a href="#/" target="_blank" class="admin-btn secondary" style="text-decoration:none;display:inline-flex;align-items:center;font-size:13px">'+CL('view_page')+'</a>'
    +'</div></div>';

  // ========== Section Order (not language-dependent) ==========
  var defaultOrder = ['hero','banners','marquee','svc1','svc2','svc3','stats','news','cta'];
  var sectionOrder = (ch.order && ch.order.length) ? ch.order : defaultOrder;
  var secNames = {hero:'section_hero',banners:'section_banners',marquee:'section_marquee',svc1:'section_svc1',svc2:'section_svc2',svc3:'section_svc3',stats:'section_stats',news:'section_news',cta:'section_cta'};
  var orderHtml = '<p style="font-size:11px;color:var(--text-muted);margin:0 0 8px;display:flex;align-items:center;gap:4px"><span class="dnd-handle" style="font-size:14px;padding:0">&#x2807;</span>'+CL('dnd_hint')+'</p><div id="cmsOrderList">';
  sectionOrder.forEach(function(sid, i){
    orderHtml += '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg-light);border-radius:8px;margin-bottom:4px" draggable="true">'
      +'<span class="dnd-handle" title="Drag to reorder">&#x2807;</span>'
      +'<span style="font-weight:600;font-size:13px;flex:1">'+CL(secNames[sid]||sid)+'</span>'
      +'</div>';
  });
  orderHtml += '</div>';
  html += sectionAccordion('order', 'home_order', orderHtml);

  // ========== 1. Hero (all 3 languages) ==========
  var heroBody = '';
  langs.forEach(function(lang){
    heroBody += '<div class="cms-field-group"><h4>'+escHtml(langNames[lang])+' ('+lang+')</h4>'
      +plainField('cms_h_hero_badge_'+lang,'home_badge', gv('hero','badge',lang))
      +richField('cms_h_hero_title_'+lang,'home_title', gv('hero','title',lang))
      +richField('cms_h_hero_subtitle_'+lang,'home_subtitle', gv('hero','subtitle',lang))
      +'<div class="cms-form-row">'
      +plainField('cms_h_hero_cta1_text_'+lang,'home_cta1_text', gv('hero','cta1_text',lang))
      +plainField('cms_h_hero_cta1_link_'+lang,'home_cta1_link', gv('hero','cta1_link',lang))
      +'</div>'
      +'<div class="cms-form-row">'
      +plainField('cms_h_hero_cta2_text_'+lang,'home_cta2_text', gv('hero','cta2_text',lang))
      +plainField('cms_h_hero_cta2_link_'+lang,'home_cta2_link', gv('hero','cta2_link',lang))
      +'</div></div>';
  });
  html += sectionAccordion('hero', 'home_hero', heroBody);

  // ========== 2. Banners (not language-dependent) ==========
  html += sectionAccordion('banners', 'home_banners',
    '<div id="cmsHomeBanners"></div>');

  // ========== 3. Marquee (all 3 languages) ==========
  var mqBody = '';
  langs.forEach(function(lang){
    var mq = (ch.marquee && ch.marquee[lang]) || {};
    var mqDef = (defaults.marquee && defaults.marquee[lang]) || {};
    var mqTitle = mq.title || mqDef.title || '';
    var mqLogos = [];
    try{ mqLogos = JSON.parse(mq.logos||'[]'); }catch(e){}
    if(!mqLogos.length) mqLogos = [
      {name:'Capital Securities Corp.', img:'https://www.e-capital.com.hk/images/fortisinvestments.png'},
      {name:'Fidelity', img:'https://www.e-capital.com.hk/images/fidelity.png'},
      {name:'First State', img:'https://www.e-capital.com.hk/images/Firststate.png'},
      {name:'Man Investments', img:'https://www.e-capital.com.hk/images/ManInvestments.png'}
    ];
    var mqGroups = [];
    try{ mqGroups = JSON.parse(mq.groups || mqDef.groups || '[]'); }catch(e){}

    mqBody += '<div class="cms-field-group"><h4>'+escHtml(langNames[lang])+' ('+lang+')</h4>'
      +plainField('cms_h_mq_title_'+lang,'home_marquee_title', mqTitle);
    mqBody += '<label style="font-size:12px;font-weight:600;color:var(--text-sec);margin:12px 0 6px;display:block;text-transform:uppercase;letter-spacing:.5px">'+CL('home_logos')+'</label>';
    mqBody += '<div id="cmsLogoList_'+lang+'">';
    mqLogos.forEach(function(l,i){
      mqBody += '<div class="cms-form-row" style="align-items:end">'
        +'<div class="admin-field" style="flex:1;margin:0"><input type="text" id="cmsLN_'+lang+'_'+i+'" value="'+escAttr(l.name)+'" placeholder="'+CL('home_logo_name')+'"/></div>'
        +'<div class="admin-field" style="flex:2;margin:0"><input type="text" id="cmsLI_'+lang+'_'+i+'" value="'+escAttr(l.img)+'" placeholder="'+CL('home_logo_img')+'"/></div>'
        +'<button class="admin-btn danger" style="padding:6px 10px;font-size:11px;height:42px" onclick="window._cmsRemoveRepeater(\'logo\','+i+',\''+escQ(lang)+'\')">'+CL('home_remove')+'</button>'
        +'</div>';
    });
    mqBody += '</div>';
    mqBody += '<button class="admin-btn secondary" style="font-size:12px;margin-top:4px" onclick="window._cmsAddRepeater(\'logo\',\''+escQ(lang)+'\')">'+CL('home_add_item')+'</button>';
    mqBody += '<label style="font-size:12px;font-weight:600;color:var(--text-sec);margin:16px 0 6px;display:block;text-transform:uppercase;letter-spacing:.5px">'+CL('home_groups')+'</label>';
    mqBody += '<div id="cmsGroupList_'+lang+'">';
    mqGroups.forEach(function(g,i){
      mqBody += '<div class="cms-form-row" style="align-items:end">'
        +'<div class="admin-field" style="flex:1;margin:0"><input type="text" id="cmsGN_'+lang+'_'+i+'" value="'+escAttr(g.name)+'" placeholder="'+CL('home_group_name')+'"/></div>'
        +'<button class="admin-btn danger" style="padding:6px 10px;font-size:11px;height:42px" onclick="window._cmsRemoveRepeater(\'group\','+i+',\''+escQ(lang)+'\')">'+CL('home_remove')+'</button>'
        +'</div>';
    });
    mqBody += '</div>';
    mqBody += '<button class="admin-btn secondary" style="font-size:12px;margin-top:4px" onclick="window._cmsAddRepeater(\'group\',\''+escQ(lang)+'\')">'+CL('home_add_item')+'</button>';
    mqBody += '</div>';
  });
  html += sectionAccordion('marquee', 'home_marquee', mqBody);

  // ========== 3-5. Services (with sub-features, all 3 languages) ==========
  ['svc1','svc2','svc3'].forEach(function(svc){
    var svcBody = '';
    langs.forEach(function(lang){
      var feats = [];
      try{ feats = JSON.parse(gv(svc,'features',lang)||'[]'); }catch(e){}
      var featHtml = '';
      if(feats.length){
        featHtml += '<label style="font-size:12px;font-weight:600;color:var(--text-sec);margin:12px 0 6px;display:block;text-transform:uppercase;letter-spacing:.5px">'+CL('home_features')+'</label>';
        featHtml += '<div id="cmsFeat_'+svc+'_'+lang+'">';
        feats.forEach(function(f,i){
          featHtml += '<div class="cms-form-row" style="align-items:end">'
            +'<div class="admin-field" style="flex:1;margin:0"><input type="text" id="cmsFT_'+svc+'_'+lang+'_'+i+'" value="'+escAttr(f.title||'')+'" placeholder="'+CL('home_feat_title')+'"/></div>'
            +'<div class="admin-field" style="flex:2;margin:0"><input type="text" id="cmsFD_'+svc+'_'+lang+'_'+i+'" value="'+escAttr(f.desc||'')+'" placeholder="'+CL('home_feat_desc')+'"/></div>'
            +'<button class="admin-btn danger" style="padding:6px 10px;font-size:11px;height:42px" onclick="window._cmsRemoveRepeater(\'feat_'+svc+'\','+i+',\''+escQ(lang)+'\')">'+CL('home_remove')+'</button>'
            +'</div>';
        });
        featHtml += '</div>';
      } else {
        featHtml += '<label style="font-size:12px;font-weight:600;color:var(--text-sec);margin:12px 0 6px;display:block;text-transform:uppercase;letter-spacing:.5px">'+CL('home_features')+' <span style="font-weight:400;text-transform:none;letter-spacing:0">(using defaults)</span></label>';
        featHtml += '<div id="cmsFeat_'+svc+'_'+lang+'"></div>';
      }
      featHtml += '<button class="admin-btn secondary" style="font-size:12px;margin-top:4px" onclick="window._cmsAddRepeater(\'feat_'+svc+'\',\''+escQ(lang)+'\')">'+CL('home_add_item')+'</button>';

      svcBody += '<div class="cms-field-group"><h4>'+escHtml(langNames[lang])+' ('+lang+')</h4>'
        +plainField('cms_h_'+svc+'_label_'+lang,'home_label', gv(svc,'label',lang))
        +richField('cms_h_'+svc+'_title_'+lang,'home_title', gv(svc,'title',lang))
        +richField('cms_h_'+svc+'_desc_'+lang,'home_desc', gv(svc,'desc',lang))
        +plainField('cms_h_'+svc+'_img_'+lang,'home_img', gv(svc,'img',lang))
        +featHtml
        +'</div>';
    });
    html += sectionAccordion(svc, 'home_'+svc, svcBody);
  });

  // ========== Stats (all 3 languages) ==========
  var statsBody = '';
  langs.forEach(function(lang){
    var statsData = [];
    try{ statsData = JSON.parse(gv('stats','items',lang)||'[]'); }catch(e){}
    if(!statsData.length){
      try{ statsData = JSON.parse((defaults.stats[lang]||{}).items||'[]'); }catch(e){}
    }
    statsBody += '<div class="cms-field-group"><h4>'+escHtml(langNames[lang])+' ('+lang+')</h4>';
    statsBody += '<div id="cmsStatsList_'+lang+'">';
    statsData.forEach(function(s,i){
      statsBody += '<div class="cms-form-row" style="align-items:end">'
        +'<div class="admin-field" style="flex:1;margin:0"><label>'+CL('home_stat_num')+'</label><input type="text" id="cmsSN_'+lang+'_'+i+'" value="'+escAttr(s.num)+'"/></div>'
        +'<div class="admin-field" style="flex:2;margin:0"><label>'+CL('home_stat_label')+'</label><input type="text" id="cmsSL_'+lang+'_'+i+'" value="'+escAttr(s.label)+'"/></div>'
        +'<button class="admin-btn danger" style="padding:6px 10px;font-size:11px;height:42px" onclick="window._cmsRemoveRepeater(\'stat\','+i+',\''+escQ(lang)+'\')">'+CL('home_remove')+'</button>'
        +'</div>';
    });
    statsBody += '</div>';
    statsBody += '<button class="admin-btn secondary" style="font-size:12px;margin-top:4px" onclick="window._cmsAddRepeater(\'stat\',\''+escQ(lang)+'\')">'+CL('home_add_item')+'</button>';
    statsBody += '</div>';
  });
  html += sectionAccordion('stats', 'home_stats', statsBody);

  // ========== CTA (all 3 languages) ==========
  var ctaBody = '';
  langs.forEach(function(lang){
    var ctaSteps = [];
    try{ ctaSteps = JSON.parse(gv('cta','steps',lang)||'[]'); }catch(e){}
    if(!ctaSteps.length){
      try{ ctaSteps = JSON.parse((defaults.cta[lang]||{}).steps||'[]'); }catch(e){}
    }
    ctaBody += '<div class="cms-field-group"><h4>'+escHtml(langNames[lang])+' ('+lang+')</h4>'
      +richField('cms_h_cta_title_'+lang,'home_title', gv('cta','title',lang))
      +richField('cms_h_cta_desc_'+lang,'home_desc', gv('cta','desc',lang))
      +'<label style="font-size:12px;font-weight:600;color:var(--text-sec);margin:12px 0 6px;display:block;text-transform:uppercase;letter-spacing:.5px">'+CL('home_steps')+'</label>'
      +'<div id="cmsStepsList_'+lang+'">';
    ctaSteps.forEach(function(s,i){
      ctaBody += '<div class="cms-form-row" style="align-items:end">'
        +'<div class="admin-field" style="flex:1;margin:0"><label>'+CL('home_step')+' '+(i+1)+'</label><input type="text" id="cmsStep_'+lang+'_'+i+'" value="'+escAttr(s.replace(/\n/g,'\\n'))+'"/></div>'
        +'<button class="admin-btn danger" style="padding:6px 10px;font-size:11px;height:42px" onclick="window._cmsRemoveRepeater(\'step\','+i+',\''+escQ(lang)+'\')">'+CL('home_remove')+'</button>'
        +'</div>';
    });
    ctaBody += '</div>';
    ctaBody += '<button class="admin-btn secondary" style="font-size:12px;margin-top:4px" onclick="window._cmsAddRepeater(\'step\',\''+escQ(lang)+'\')">'+CL('home_add_item')+'</button>';
    ctaBody += '<div class="cms-form-row">'
      +plainField('cms_h_cta_btn1_text_'+lang,'home_cta1_text', gv('cta','btn1_text',lang))
      +plainField('cms_h_cta_btn1_link_'+lang,'home_cta1_link', gv('cta','btn1_link',lang))
      +'</div>'
      +'<div class="cms-form-row">'
      +plainField('cms_h_cta_btn2_text_'+lang,'home_cta2_text', gv('cta','btn2_text',lang))
      +plainField('cms_h_cta_btn2_link_'+lang,'home_cta2_link', gv('cta','btn2_link',lang))
      +'</div></div>';
  });
  html += sectionAccordion('cta', 'home_cta', ctaBody);

  // ========== Footer (all 3 languages) ==========
  var ft = getCmsFooter();
  var ftBody = '';
  langs.forEach(function(lang){
    var ftL = (ft[lang]) || {};
    var ftDef = (defaults.footer && defaults.footer[lang]) || {};
    ftBody += '<div class="cms-field-group"><h4>'+escHtml(langNames[lang])+' ('+lang+')</h4>'
      +plainField('cms_ft_brand_'+lang,'footer_brand', ftL.brand_name||ftDef.brand_name||'')
      +plainField('cms_ft_addr_'+lang,'footer_address', ftL.address||ftDef.address||'')
      +'<div class="cms-form-row">'
      +plainField('cms_ft_tel_'+lang,'footer_tel', ftL.tel||ftDef.tel||'')
      +plainField('cms_ft_fax_'+lang,'footer_fax', ftL.fax||ftDef.fax||'')
      +'</div>';
    // Footer columns
    var ftCols = ftL.columns || ftDef.columns || [];
    ftBody += '<div id="cmsFooterCols_'+lang+'">';
    ftCols.forEach(function(col,ci){
      ftBody += '<div class="cms-card-box" style="margin-bottom:8px;padding:14px">'
        +'<div class="admin-field" style="margin-bottom:8px"><label>'+CL('footer_col_title')+'</label><input type="text" id="cmsFCT_'+lang+'_'+ci+'" value="'+escAttr(col.title)+'"/></div>';
      (col.links||[]).forEach(function(lnk,li){
        ftBody += '<div class="cms-form-row" style="align-items:end">'
          +'<div class="admin-field" style="flex:1;margin:0"><input type="text" id="cmsFCLT_'+lang+'_'+ci+'_'+li+'" value="'+escAttr(lnk.text)+'" placeholder="'+CL('footer_link_text')+'"/></div>'
          +'<div class="admin-field" style="flex:1;margin:0"><input type="text" id="cmsFCLH_'+lang+'_'+ci+'_'+li+'" value="'+escAttr(lnk.href)+'" placeholder="'+CL('footer_link_href')+'"/></div>'
          +'<button class="admin-btn danger" style="padding:4px 8px;font-size:11px" onclick="window._cmsRemoveRepeater(\'flink_'+ci+'\','+li+',\''+escQ(lang)+'\')">&#10005;</button>'
          +'</div>';
      });
      ftBody += '<button class="admin-btn secondary" style="font-size:11px;margin-top:4px" onclick="window._cmsAddRepeater(\'flink_'+ci+'\',\''+escQ(lang)+'\')">'+CL('footer_add_link')+'</button>'
        +'<button class="admin-btn danger" style="font-size:11px;margin-top:4px;margin-left:4px" onclick="window._cmsRemoveRepeater(\'fcol\','+ci+',\''+escQ(lang)+'\')">'+CL('home_remove')+'</button>'
        +'</div>';
    });
    ftBody += '</div>';
    ftBody += '<button class="admin-btn secondary" style="font-size:12px;margin-top:8px" onclick="window._cmsAddRepeater(\'fcol\',\''+escQ(lang)+'\')">'+CL('footer_add_col')+'</button>';
    ftBody += '</div>';
  });
  ftBody += '<div style="margin-top:12px"><button class="admin-btn primary" onclick="window._cmsFooterSave()">'+CL('save')+' '+CL('home_footer')+'</button></div>';
  html += sectionAccordion('footer', 'home_footer', ftBody);

  // ========== Navigation (all 3 languages) ==========
  var navData = getCmsNav();
  var navBody = '';
  langs.forEach(function(lang){
    var navItems = navData[lang] || (window.SITE && window.SITE.nav ? window.SITE.nav[lang] || window.SITE.nav['zh-Hant'] : []);
    navBody += '<div class="cms-field-group"><h4>'+escHtml(langNames[lang])+' ('+lang+')</h4>';
    navBody += '<div id="cmsNavTree_'+lang+'">';
    navItems.forEach(function(item, i){
      navBody += '<div class="cms-card-box" style="margin-bottom:6px;padding:10px 14px" draggable="true">'
        +'<div class="cms-form-row" style="align-items:center;margin-bottom:0">'
        +'<span class="dnd-handle" title="Drag to reorder">&#x2807;</span>'
        +'<div class="admin-field" style="flex:1;margin:0"><input type="text" id="cmsNL_'+lang+'_'+i+'" value="'+escAttr(item.label)+'" placeholder="'+CL('nav_item_label')+'"/></div>'
        +'<div class="admin-field" style="flex:1;margin:0"><input type="text" id="cmsNP_'+lang+'_'+i+'" value="'+escAttr(item.page||item.ext||'')+'" placeholder="'+CL('nav_item_page')+' / '+CL('nav_item_ext')+'"/></div>'
        +'<button class="admin-btn danger" style="padding:4px 8px;font-size:11px" onclick="window._cmsRemoveRepeater(\'nav\','+i+',\''+escQ(lang)+'\')">&#10005;</button>'
        +'</div>';
      if(item.children && item.children.length){
        item.children.forEach(function(ch2, j){
          navBody += '<div style="margin-left:24px;margin-top:4px" class="cms-form-row">'
            +'<div class="admin-field" style="flex:1;margin:0"><input type="text" id="cmsNC_'+lang+'_'+i+'_'+j+'" value="'+escAttr(ch2.label)+'" placeholder="'+CL('nav_item_label')+'"/></div>'
            +'<div class="admin-field" style="flex:1;margin:0"><input type="text" id="cmsNCP_'+lang+'_'+i+'_'+j+'" value="'+escAttr(ch2.page||ch2.ext||'')+'" placeholder="'+CL('nav_item_page')+'"/></div>'
            +'<button class="admin-btn danger" style="padding:4px 6px;font-size:10px" onclick="window._cmsRemoveRepeater(\'navch_'+i+'\','+j+',\''+escQ(lang)+'\')">&#10005;</button>'
            +'</div>';
          if(ch2.children && ch2.children.length){
            ch2.children.forEach(function(ch3, k){
              navBody += '<div style="margin-left:48px;margin-top:2px" class="cms-form-row">'
                +'<div class="admin-field" style="flex:1;margin:0"><input type="text" id="cmsNCC_'+lang+'_'+i+'_'+j+'_'+k+'" value="'+escAttr(ch3.label)+'" placeholder="'+CL('nav_item_label')+'"/></div>'
                +'<div class="admin-field" style="flex:1;margin:0"><input type="text" id="cmsNCCP_'+lang+'_'+i+'_'+j+'_'+k+'" value="'+escAttr(ch3.page||ch3.ext||'')+'" placeholder="'+CL('nav_item_page')+'"/></div>'
                +'<button class="admin-btn danger" style="padding:4px 6px;font-size:10px" onclick="window._cmsRemoveRepeater(\'navgch_'+i+'_'+j+'\','+k+',\''+escQ(lang)+'\')">&#10005;</button>'
                +'</div>';
            });
          }
          navBody += '<button class="admin-btn secondary" style="font-size:10px;margin-left:48px;margin-top:2px;padding:2px 8px" onclick="window._cmsAddRepeater(\'navgch_'+i+'_'+j+'\',\''+escQ(lang)+'\')">'+CL('nav_add_child')+'</button>';
        });
      }
      navBody += '<button class="admin-btn secondary" style="font-size:10px;margin-left:24px;margin-top:4px;padding:2px 8px" onclick="window._cmsAddRepeater(\'navch_'+i+'\',\''+escQ(lang)+'\')">'+CL('nav_add_child')+'</button>';
      navBody += '</div>';
    });
    navBody += '</div>';
    navBody += '<div style="display:flex;gap:8px;margin-top:8px">'
      +'<button class="admin-btn secondary" style="font-size:12px" onclick="window._cmsAddRepeater(\'nav\',\''+escQ(lang)+'\')">'+CL('nav_add_item')+'</button>'
      +'</div>';
    navBody += '</div>';
  });
  navBody += '<div style="display:flex;gap:8px;margin-top:12px">'
    +'<button class="admin-btn primary" onclick="window._cmsNavSave()">'+CL('save')+' '+CL('home_nav')+'</button>'
    +'<button class="admin-btn danger" onclick="if(confirm(CL(\'nav_reset_q\'))){saveCmsNav({});window._cmsHomeView();}">'+CL('nav_reset')+'</button>'
    +'</div>';
  html += sectionAccordion('nav', 'home_nav', navBody);

  html += '</div>'; // close cms-panel

  document.getElementById("cmsEditor").innerHTML = html;

  // Render full banner manager and init drag-and-drop
  setTimeout(function(){
    var bannerSlot = document.getElementById('cmsHomeBanners');
    if(bannerSlot) _cmsRenderBannersFull(bannerSlot);
    // Section order
    var orderList = document.getElementById('cmsOrderList');
    if(orderList) _cmsDndInit(orderList, function(from, to){ window._cmsOrderMove(from, to); });
    // Nav trees (per language)
    ['zh-Hant','zh-Hans','en'].forEach(function(lang){
      var navTree = document.getElementById('cmsNavTree_'+lang);
      if(navTree) _cmsDndInit(navTree, function(from, to){ window._cmsNavMove(from, to, lang); });
    });
  }, 40);

  // Auto-open first section
  var first = document.querySelector('.cms-home-sec');
  if(first) first.classList.add('open');

  // Initialize CKEditor on rich text fields
  if(hasCK){
    document.querySelectorAll('.cms-home-ck').forEach(function(ta){
      var ckLang = 'zh-cn';
      if(ta.id.indexOf('_en') === ta.id.length - 3) ckLang = 'en';
      ClassicEditor.create(ta, {
        extraPlugins: [_cmsCkUploadPlugin],
        toolbar: {items:['heading','|','bold','italic','underline','strikethrough','|','link','imageUpload','blockQuote','insertTable','horizontalLine','|','bulletedList','numberedList','|','outdent','indent','|','fontColor','fontBackgroundColor','removeFormat','|','undo','redo'],shouldNotGroupWhenFull:false},
        heading: { options: [
          { model:'paragraph', title:'Paragraph', class:'ck-heading_paragraph' },
          { model:'heading2', view:'h2', title:'Heading 2', class:'ck-heading_heading2' },
          { model:'heading3', view:'h3', title:'Heading 3', class:'ck-heading_heading3' },
          { model:'heading4', view:'h4', title:'Heading 4', class:'ck-heading_heading4' }
        ]},
        language: ckLang
      }).then(function(editor){
        _cmsEditors[ta.id] = editor;
        // Inject file buttons into CKEditor toolbar (same as page editor)
        var wrapDiv = ta.parentElement;
        if(wrapDiv){
          var ckToolbar = wrapDiv.querySelector('.ck-toolbar__items');
          if(ckToolbar){
            var _fid = 'cmsCkFile_'+ta.id.replace(/[^a-zA-Z0-9_]/g,'');
            var sep = document.createElement('span');
            sep.className = 'ck ck-toolbar__separator';
            ckToolbar.appendChild(sep);
            var libBtn = document.createElement('button');
            libBtn.type = 'button';
            libBtn.className = 'ck ck-button cms-ck-tb-btn';
            libBtn.setAttribute('data-ta-id', ta.id);
            libBtn.title = CL('insert_dl');
            libBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg><span class="cms-ck-tb-label"> '+CL('insert_dl')+'</span>';
            libBtn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); window._cmsShowFilePicker(this); };
            ckToolbar.appendChild(libBtn);
            var upBtn = document.createElement('button');
            upBtn.type = 'button';
            upBtn.className = 'ck ck-button cms-ck-tb-btn';
            upBtn.title = CL('upload_insert');
            upBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span class="cms-ck-tb-label"> '+CL('upload_insert')+'</span>';
            upBtn.onclick = function(e){ e.preventDefault(); document.getElementById(_fid).click(); };
            ckToolbar.appendChild(upBtn);
            var finput = document.createElement('input');
            finput.type = 'file';
            finput.id = _fid;
            finput.accept = '.jpg,.jpeg,.png,.webp,.gif,.svg,.pdf,.doc,.docx,.ppt,.pptx';
            finput.style.display = 'none';
            finput.onchange = function(){ window._cmsCkFileUpload(this, ta.id); };
            wrapDiv.appendChild(finput);
          }
        }
      }).catch(function(err){
        console.warn('CKEditor init failed for '+ta.id+':', err);
      });
    });
  }
};

// Save all homepage fields
window._cmsHomeSave = function(){
  var langs = ["zh-Hant","zh-Hans","en"];
  var ch = window.getCmsHome ? window.getCmsHome() : {};
  var sections = ['hero','svc1','svc2','svc3','cta'];
  var fields = {
    hero: ['badge','title','subtitle','cta1_text','cta1_link','cta2_text','cta2_link'],
    svc1: ['label','title','desc','img'],
    svc2: ['label','title','desc','img'],
    svc3: ['label','title','desc','img'],
    cta: ['title','desc','btn1_text','btn1_link','btn2_text','btn2_link']
  };
  // Read from CKEditor if available, else from input/textarea
  function getVal(id){
    if(_cmsEditors[id]) return _cmsEditors[id].getData().trim();
    var el = document.getElementById(id);
    return el ? (el.value||'').trim() : '';
  }
  langs.forEach(function(lang){
    sections.forEach(function(sec){
      if(!ch[sec]) ch[sec] = {};
      if(!ch[sec][lang]) ch[sec][lang] = {};
      fields[sec].forEach(function(f){
        var val = getVal('cms_h_'+sec+'_'+f+'_'+lang);
        if(val) ch[sec][lang][f] = val;
        else delete ch[sec][lang][f];
      });
      // Clean empty
      if(Object.keys(ch[sec][lang]).length === 0) delete ch[sec][lang];
      if(Object.keys(ch[sec]).length === 0) delete ch[sec];
    });

    // Save CTA steps
    var steps = [];
    var i = 0;
    while(document.getElementById('cmsStep_'+lang+'_'+i)){
      var sv = document.getElementById('cmsStep_'+lang+'_'+i).value.replace(/\\n/g,'\n').trim();
      if(sv) steps.push(sv);
      i++;
    }
    if(steps.length){
      if(!ch.cta) ch.cta = {};
      if(!ch.cta[lang]) ch.cta[lang] = {};
      ch.cta[lang].steps = JSON.stringify(steps);
    }

    // Save stats
    var stats = [];
    i = 0;
    while(document.getElementById('cmsSN_'+lang+'_'+i)){
      var sn = document.getElementById('cmsSN_'+lang+'_'+i).value.trim();
      var sl = document.getElementById('cmsSL_'+lang+'_'+i).value.trim();
      if(sn||sl) stats.push({num:sn, label:sl});
      i++;
    }
    if(stats.length){
      if(!ch.stats) ch.stats = {};
      if(!ch.stats[lang]) ch.stats[lang] = {};
      ch.stats[lang].items = JSON.stringify(stats);
    }

    // Save marquee
    var mqTitle = (document.getElementById('cms_h_mq_title_'+lang)||{}).value||'';
    var logos = [], groups = [];
    i = 0;
    while(document.getElementById('cmsLN_'+lang+'_'+i)){
      var ln = document.getElementById('cmsLN_'+lang+'_'+i).value.trim();
      var li = document.getElementById('cmsLI_'+lang+'_'+i).value.trim();
      if(ln||li) logos.push({name:ln, img:li});
      i++;
    }
    i = 0;
    while(document.getElementById('cmsGN_'+lang+'_'+i)){
      var gn = document.getElementById('cmsGN_'+lang+'_'+i).value.trim();
      if(gn) groups.push({name:gn});
      i++;
    }
    if(mqTitle||logos.length||groups.length){
      if(!ch.marquee) ch.marquee = {};
      if(!ch.marquee[lang]) ch.marquee[lang] = {};
      if(mqTitle) ch.marquee[lang].title = mqTitle.trim();
      if(logos.length) ch.marquee[lang].logos = JSON.stringify(logos);
      if(groups.length) ch.marquee[lang].groups = JSON.stringify(groups);
    }

    // Save feature sub-items per service
    ['svc1','svc2','svc3'].forEach(function(svc){
      var feats = [];
      var j = 0;
      while(document.getElementById('cmsFT_'+svc+'_'+lang+'_'+j)){
        var ft = document.getElementById('cmsFT_'+svc+'_'+lang+'_'+j).value.trim();
        var fd = document.getElementById('cmsFD_'+svc+'_'+lang+'_'+j).value.trim();
        if(ft||fd) feats.push({title:ft, desc:fd});
        j++;
      }
      if(feats.length){
        if(!ch[svc]) ch[svc] = {};
        if(!ch[svc][lang]) ch[svc][lang] = {};
        ch[svc][lang].features = JSON.stringify(feats);
      }
    });
  });

  // Save section order (not language-dependent)
  var orderEls = document.querySelectorAll('#cmsOrderList > div');
  if(orderEls.length){
    var defaultOrder = ['hero','banners','marquee','svc1','svc2','svc3','stats','news','cta'];
    var curOrder = (ch.order && ch.order.length) ? ch.order : defaultOrder;
    ch.order = curOrder;
  }

  window.saveCmsHome(ch);
  showToast(CL('home_saved'));
};

// Render full banner manager into a container (for homepage editor accordion)
function _cmsRenderBannersFull(container){
  var banners = getCmsBanners();
  var _cl = window.currentLang || 'zh-Hant';
  var _L = function(en,hans,hant){ return _cl==='en'?en:(_cl==='zh-Hans'?hans:hant); };
  var defaultBanners = [
    { img: 'images/ecap-banner-1.png', alt: _L('iTrader Platform', 'iTrader 交易平台', 'iTrader 交易平台'), link: '#/page/stock-ipo' },
    { img: 'images/ecap-banner-2.png', alt: _L('Stock Connect', '沪港通服务', '滬港通服務'), link: '#/page/shh-hk' },
    { img: 'images/ecap-banner-3.png', alt: _L('Open Account', '开立帐户', '開立帳戶'), link: '#/page/stock-account-opening' }
  ];
  // Persist hardcoded defaults to localStorage if none saved yet
  if(!banners.length){
    banners = defaultBanners;
    saveCmsBanners(banners);
  } else {
    // Check if defaults are missing (user uploaded only, lost defaults)
    var hasDefault = banners.some(function(b){ return b.img && b.img.indexOf('ecap-banner-')>=0; });
    if(!hasDefault){
      banners = defaultBanners.concat(banners);
      saveCmsBanners(banners);
    }
  }
  var _canUpload = _cmsHasPermission("upload");
  var _noImgSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='68'%3E%3Crect width='120' height='68' fill='%23f3f4f6'/%3E%3Ctext x='60' y='38' text-anchor='middle' fill='%23bbb' font-size='11' font-family='sans-serif'%3ENo Image%3C/text%3E%3C/svg%3E";
  var rows = banners.length ? banners.map(function(b,i){
    return '<div class="cms-item-card" id="cmsBC_'+i+'" draggable="true">'
      +'<span class="dnd-handle" title="Drag to reorder">&#x2807;</span>'
      +'<img class="cms-item-thumb" src="'+escAttr(b.img)+'" onerror="this.src=\''+_noImgSrc+'\';this.onerror=null" style="cursor:pointer;border-radius:6px" onclick="window._cmsBannerEdit('+i+')" title="'+CL('edit')+'"/>'
      +'<div class="cms-item-info">'
      +'<div class="cms-item-title">'+esc(b.alt||'Banner '+(i+1))+'</div>'
      +'<div class="cms-item-meta" style="word-break:break-all">'+esc(b.link||CL('no_link'))+'</div>'
      +'</div>'
      +'<div class="cms-item-actions">'
      +(_canUpload?'<button class="admin-btn secondary" title="'+CL('edit')+'" style="font-size:11px;padding:4px 8px" onclick="window._cmsBannerEdit('+i+')">'+CL('edit')+'</button>':'')
      +(_canUpload?'<button class="admin-btn danger" style="font-size:11px;padding:4px 8px" onclick="window._cmsBannerDelete('+i+')">'+CL('delete')+'</button>':'')
      +'</div>'
      +'<div id="cmsBE_'+i+'" style="display:none;width:100%;margin-top:10px;padding-top:10px;border-top:1px solid var(--border-light)">'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">'
      +'<div><label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:2px">'+CL('alt_title')+'</label>'
      +'<input id="cmsBEAlt_'+i+'" type="text" value="'+escAttr(b.alt||'')+'" style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:6px;font-size:13px"/></div>'
      +'<div><label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:2px">'+CL('link_opt')+'</label>'
      +'<input id="cmsBELink_'+i+'" type="text" value="'+escAttr(b.link||'')+'" placeholder="#/page/... or https://..." style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:6px;font-size:13px"/></div>'
      +'</div>'
      +'<div style="display:flex;gap:6px">'
      +'<button class="admin-btn primary" style="font-size:12px;padding:5px 14px" onclick="window._cmsBannerSave('+i+')">&#10003; '+CL('save')+'</button>'
      +'<button class="admin-btn secondary" style="font-size:12px;padding:5px 14px" onclick="window._cmsBannerEditClose('+i+')">'+CL('cancel')+'</button>'
      +'</div>'
      +'</div>'
      +'</div>';
  }).join("") : '<div class="cms-item-meta" style="padding:12px 0">'+CL('no_banner')+'</div>';

  var html = (banners.length ? '<button class="admin-btn secondary" style="margin-bottom:12px" onclick="window._cmsBannerPreview()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> '+CL('preview_carousel')+'</button>' : '')
    +(banners.length > 1 ? '<p style="font-size:11px;color:var(--text-muted);margin:0 0 8px;display:flex;align-items:center;gap:4px"><span class="dnd-handle" style="font-size:14px;padding:0">&#x2807;</span>'+CL('dnd_hint')+'</p>' : '')
    +'<div class="cms-banners-list" id="cmsBannersList">' + rows + '</div>';

  if(_canUpload){
    html += '<div class="cms-drop-zone" id="cmsBannerDropZone" style="margin-top:16px">'
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
      +'</div>';
  }

  container.innerHTML = html;
  setTimeout(function(){
    var listEl = container.querySelector('#cmsBannersList');
    if(listEl) _cmsDndInit(listEl, function(from, to){ window._cmsBannerMove(from, to); });
    window._cmsBannerInitDrop();
  }, 50);
}

// Smart refresh: if homepage editor is open, refresh embedded banners; else reload standalone view
function _cmsRefreshBanners(){
  var slot = document.getElementById('cmsHomeBanners');
  if(slot){ _cmsRenderBannersFull(slot); return; }
  window._cmsBannersView();
}

// ————————————————————— CMS BANNERS MANAGER —————————————————————
window._cmsBannersView = function(){
  // Highlight homepage item in sidebar
  document.querySelectorAll('.cms-page-item').forEach(function(el){ el.classList.remove('active'); });
  var homeItem = document.querySelector('.cms-page-home');
  if(homeItem) homeItem.classList.add('active');
  var banners = getCmsBanners();
  var _canUpload = _cmsHasPermission("upload");
  var _noImgSrc2 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='68'%3E%3Crect width='120' height='68' fill='%23f3f4f6'/%3E%3Ctext x='60' y='38' text-anchor='middle' fill='%23bbb' font-size='11' font-family='sans-serif'%3ENo Image%3C/text%3E%3C/svg%3E";
  var rows = banners.length ? banners.map(function(b,i){
    return '<div class="cms-item-card" id="cmsBC_'+i+'" draggable="true">'
      +'<span class="dnd-handle" title="Drag to reorder">&#x2807;</span>'
      +'<img class="cms-item-thumb" src="'+escAttr(b.img)+'" onerror="this.src=\''+_noImgSrc2+'\';this.onerror=null" style="cursor:pointer;border-radius:6px" onclick="window._cmsBannerEdit('+i+')" title="'+CL('edit')+'"/>'
      +'<div class="cms-item-info">'
      +'<div class="cms-item-title">'+esc(b.alt||'Banner '+(i+1))+'</div>'
      +'<div class="cms-item-meta" style="word-break:break-all">'+esc(b.link||CL('no_link'))+'</div>'
      +'</div>'
      +'<div class="cms-item-actions">'
      +(_canUpload?'<button class="admin-btn secondary" title="'+CL('edit')+'" style="font-size:11px;padding:4px 8px" onclick="window._cmsBannerEdit('+i+')">'+CL('edit')+'</button>':'')
      +(_canUpload?'<button class="admin-btn danger" style="font-size:11px;padding:4px 8px" onclick="window._cmsBannerDelete('+i+')">'+CL('delete')+'</button>':'')
      +'</div>'
      +'<div id="cmsBE_'+i+'" style="display:none;width:100%;margin-top:10px;padding-top:10px;border-top:1px solid var(--border-light)">'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">'
      +'<div><label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:2px">'+CL('alt_title')+'</label>'
      +'<input id="cmsBEAlt_'+i+'" type="text" value="'+escAttr(b.alt||'')+'" style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:6px;font-size:13px"/></div>'
      +'<div><label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:2px">'+CL('link_opt')+'</label>'
      +'<input id="cmsBELink_'+i+'" type="text" value="'+escAttr(b.link||'')+'" placeholder="#/page/... or https://..." style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:6px;font-size:13px"/></div>'
      +'</div>'
      +'<div style="display:flex;gap:6px">'
      +'<button class="admin-btn primary" style="font-size:12px;padding:5px 14px" onclick="window._cmsBannerSave('+i+')">&#10003; '+CL('save')+'</button>'
      +'<button class="admin-btn secondary" style="font-size:12px;padding:5px 14px" onclick="window._cmsBannerEditClose('+i+')">'+CL('cancel')+'</button>'
      +'</div>'
      +'</div>'
      +'</div>';
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
    : '<div style="background:#fef9c3;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;font-size:13px;margin-top:12px">'+CL('view_only_msg')+'</div>')
    +'</div>';
  setTimeout(function(){
    var listEl = document.getElementById('cmsBannersList');
    if(listEl) _cmsDndInit(listEl, function(from, to){ window._cmsBannerMove(from, to); });
    window._cmsBannerInitDrop();
  }, 50);
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
  if(!allowedTypes.includes(file.type) && !allowedExt.test(file.name)){ showToast(CL('img_only_types')+': '+file.name); return; }
  if(file.size > 5*1024*1024){ showToast(CL('img_too_large')+': '+file.name); return; }
  var reader = new FileReader();
  reader.onload = function(ev){
    // Resize banner to max 1200px wide via canvas to keep localStorage small
    var img = new Image();
    img.onload = function(){
      var MAX_W = 1200, MAX_H = 500;
      var w = img.width, h = img.height;
      if(w > MAX_W){ h = Math.round(h * MAX_W / w); w = MAX_W; }
      if(h > MAX_H){ w = Math.round(w * MAX_H / h); h = MAX_H; }
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      var dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      // Ensure existing banners are persisted (fix: defaults not saved = lost on first upload)
      var banners = getCmsBanners();
      if(!banners.length){
        // Persist the hardcoded defaults first so they're not lost
        var _cl = window.currentLang || 'zh-Hant';
        var _L = function(en,hans,hant){ return _cl==='en'?en:(_cl==='zh-Hans'?hans:hant); };
        banners = [
          { img:'images/ecap-banner-1.png', alt:_L('iTrader Platform','iTrader 交易平台','iTrader 交易平台'), link:'#/page/stock-ipo' },
          { img:'images/ecap-banner-2.png', alt:_L('Stock Connect','沪港通服务','滬港通服務'), link:'#/page/shh-hk' },
          { img:'images/ecap-banner-3.png', alt:_L('Open Account','开立帐户','開立帳戶'), link:'#/page/stock-account-opening' }
        ];
      }
      banners.push({ img:dataUrl, alt:file.name.replace(/\.[^.]+$/,''), link:'', isLocal:true });
      saveCmsBanners(banners);
      showToast(CL('added_banner')+file.name);
      _cmsRefreshBanners();
    };
    img.src = ev.target.result;
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
  if(!url){ showToast(CL('enter_img_url')); return; }
  var banners = getCmsBanners();
  if(!banners.length){
    var _cl = window.currentLang || 'zh-Hant';
    var _L = function(en,hans,hant){ return _cl==='en'?en:(_cl==='zh-Hans'?hans:hant); };
    banners = [
      { img:'images/ecap-banner-1.png', alt:_L('iTrader Platform','iTrader 交易平台','iTrader 交易平台'), link:'#/page/stock-ipo' },
      { img:'images/ecap-banner-2.png', alt:_L('Stock Connect','沪港通服务','滬港通服務'), link:'#/page/shh-hk' },
      { img:'images/ecap-banner-3.png', alt:_L('Open Account','开立帐户','開立帳戶'), link:'#/page/stock-account-opening' }
    ];
  }
  banners.push({ img:url, alt:alt||'Banner', link:link, isLocal:false });
  saveCmsBanners(banners);
  showToast(CL('added_banner_s'));
  _cmsRefreshBanners();
};

window._cmsBannerDelete = function(idx){
  if(!confirm(CL('del_banner_q'))) return;
  var banners = getCmsBanners();
  banners.splice(idx,1);
  saveCmsBanners(banners);
  _cmsRefreshBanners();
};

window._cmsBannerMove = function(from, to){
  var banners = getCmsBanners();
  if(from < 0 || to < 0 || from >= banners.length || to >= banners.length || from === to) return;
  var item = banners.splice(from, 1)[0];
  banners.splice(to, 0, item);
  saveCmsBanners(banners);
  _cmsRefreshBanners();
};

window._cmsBannerEdit = function(idx){
  var el = document.getElementById('cmsBE_'+idx);
  if(!el) return;
  var isOpen = el.style.display !== 'none';
  // Close any other open edit forms first
  document.querySelectorAll('[id^="cmsBE_"]').forEach(function(e){ e.style.display='none'; });
  el.style.display = isOpen ? 'none' : 'block';
};
window._cmsBannerEditClose = function(idx){
  var el = document.getElementById('cmsBE_'+idx);
  if(el) el.style.display = 'none';
};
window._cmsBannerSave = function(idx){
  var altEl  = document.getElementById('cmsBEAlt_'+idx);
  var linkEl = document.getElementById('cmsBELink_'+idx);
  if(!altEl) return;
  var banners = getCmsBanners();
  if(!banners[idx]) return;
  banners[idx].alt  = altEl.value.trim();
  banners[idx].link = linkEl ? linkEl.value.trim() : '';
  saveCmsBanners(banners);
  showToast('已儲存');
  _cmsRefreshBanners();
};
window._cmsBannerPreview = function(){
  var banners = getCmsBanners();
  if(!banners.length){ showToast(CL('no_banners_preview')); return; }
  var slides = banners.map(function(b){
    return '<div class="swiper-slide" style="border-radius:12px;overflow:hidden"><img src="'+escAttr(b.img)+'" style="width:100%;height:auto;display:block" alt="'+escAttr(b.alt||'')+'"/></div>';
  }).join('');
  var pw = window.open('','_blank','width=900,height=560,scrollbars=yes,resizable=yes');
  if(!pw){ showToast(CL('popup_blocked')); return; }
  pw.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+CL('banner_preview')+'</title>'
    +'<link rel="stylesheet" href="lib/swiper-bundle.min.css">'
    +'<style>body{margin:0;background:#1a1a2e;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif}'
    +'.bar{background:#f59e0b;color:#fff;font-size:12px;font-weight:600;padding:6px 20px;text-align:center;position:fixed;top:0;left:0;right:0;z-index:10}'
    +'.wrap{width:90%;max-width:820px;margin-top:40px}'
    +'.swiper-slide img{border-radius:12px}</style></head><body>'
    +'<div class="bar">'+CL('banner_preview')+' — '+banners.length+CL('slides_unit')+'</div>'
    +'<div class="wrap"><div class="swiper" id="pvSwiper"><div class="swiper-wrapper">'+slides+'</div><div class="swiper-pagination"></div></div></div>'
    +'<script src="lib/swiper-bundle.min.js"><\/script>'
    +'<script>new Swiper("#pvSwiper",{loop:true,autoplay:{delay:3000},pagination:{el:".swiper-pagination",clickable:true}});<\/script>'
    +'</body></html>');
  pw.document.close();
};

// ————— Repeater helpers (add/remove items, re-render) —————
window._cmsAddRepeater = function(type, lang){
  // Save current state then add item and re-render
  // Only save home fields if we're in the homepage editor (not standalone nav)
  if(_cmsSection !== 'nav') window._cmsHomeSave();
  var ch = window.getCmsHome ? window.getCmsHome() : {};
  if(!lang) lang = window.currentLang || 'zh-Hant';
  if(type === 'stat'){
    if(!ch.stats) ch.stats = {};
    if(!ch.stats[lang]) ch.stats[lang] = {};
    var items = []; try{ items = JSON.parse(ch.stats[lang].items||'[]'); }catch(e){}
    items.push({num:'', label:''});
    ch.stats[lang].items = JSON.stringify(items);
    window.saveCmsHome(ch);
  } else if(type === 'logo'){
    if(!ch.marquee) ch.marquee = {};
    if(!ch.marquee[lang]) ch.marquee[lang] = {};
    var logos = []; try{ logos = JSON.parse(ch.marquee[lang].logos||'[]'); }catch(e){}
    logos.push({name:'', img:''});
    ch.marquee[lang].logos = JSON.stringify(logos);
    window.saveCmsHome(ch);
  } else if(type === 'group'){
    if(!ch.marquee) ch.marquee = {};
    if(!ch.marquee[lang]) ch.marquee[lang] = {};
    var groups = []; try{ groups = JSON.parse(ch.marquee[lang].groups||'[]'); }catch(e){}
    groups.push({name:''});
    ch.marquee[lang].groups = JSON.stringify(groups);
    window.saveCmsHome(ch);
  } else if(type === 'step'){
    if(!ch.cta) ch.cta = {};
    if(!ch.cta[lang]) ch.cta[lang] = {};
    var steps = []; try{ steps = JSON.parse(ch.cta[lang].steps||'[]'); }catch(e){}
    steps.push('');
    ch.cta[lang].steps = JSON.stringify(steps);
    window.saveCmsHome(ch);
  } else if(type.indexOf('feat_') === 0){
    var svc = type.replace('feat_','');
    if(!ch[svc]) ch[svc] = {};
    if(!ch[svc][lang]) ch[svc][lang] = {};
    var feats = []; try{ feats = JSON.parse(ch[svc][lang].features||'[]'); }catch(e){}
    feats.push({title:'', desc:''});
    ch[svc][lang].features = JSON.stringify(feats);
    window.saveCmsHome(ch);
  } else if(type === 'fcol'){
    var ft = getCmsFooter();
    if(!ft[lang]) ft[lang] = {};
    if(!ft[lang].columns) ft[lang].columns = [];
    ft[lang].columns.push({title:'', links:[]});
    saveCmsFooter(ft);
  } else if(type.indexOf('flink_') === 0){
    var ci = parseInt(type.replace('flink_',''));
    var ft = getCmsFooter();
    if(ft[lang] && ft[lang].columns && ft[lang].columns[ci]){
      if(!ft[lang].columns[ci].links) ft[lang].columns[ci].links = [];
      ft[lang].columns[ci].links.push({text:'', href:'#'});
      saveCmsFooter(ft);
    }
  } else if(type === 'nav'){
    if(_cmsSection === 'nav') window._cmsNavSave();
    var nd = getCmsNav();
    if(!nd[lang]) nd[lang] = JSON.parse(JSON.stringify(window.SITE && window.SITE.nav ? window.SITE.nav[lang] || window.SITE.nav['zh-Hant'] : []));
    nd[lang].push({label:'', page:''});
    saveCmsNav(nd);
  } else if(type.indexOf('navch_') === 0){
    var ni = parseInt(type.replace('navch_',''));
    var nd = getCmsNav();
    if(!nd[lang]) nd[lang] = JSON.parse(JSON.stringify(window.SITE && window.SITE.nav ? window.SITE.nav[lang] || window.SITE.nav['zh-Hant'] : []));
    if(nd[lang][ni]){
      if(!nd[lang][ni].children) nd[lang][ni].children = [];
      nd[lang][ni].children.push({label:'', page:''});
      saveCmsNav(nd);
    }
  } else if(type.indexOf('navgch_') === 0){
    var parts = type.replace('navgch_','').split('_');
    var ni = parseInt(parts[0]), nj = parseInt(parts[1]);
    var nd = getCmsNav();
    if(!nd[lang]) nd[lang] = JSON.parse(JSON.stringify(window.SITE && window.SITE.nav ? window.SITE.nav[lang] || window.SITE.nav['zh-Hant'] : []));
    if(nd[lang][ni] && nd[lang][ni].children && nd[lang][ni].children[nj]){
      if(!nd[lang][ni].children[nj].children) nd[lang][ni].children[nj].children = [];
      nd[lang][ni].children[nj].children.push({label:'', page:''});
      saveCmsNav(nd);
    }
  }
  // Refresh correct view
  if(_cmsSection === 'nav') window._cmsNavStandaloneView();
  else window._cmsHomeView();
};

window._cmsRemoveRepeater = function(type, idx, lang){
  // Only save home fields if we're in the homepage editor (not standalone nav)
  if(_cmsSection !== 'nav') window._cmsHomeSave();
  var ch = window.getCmsHome ? window.getCmsHome() : {};
  if(!lang) lang = window.currentLang || 'zh-Hant';
  if(type === 'stat'){
    var items = []; try{ items = JSON.parse(ch.stats[lang].items||'[]'); }catch(e){}
    items.splice(idx,1);
    ch.stats[lang].items = JSON.stringify(items);
    window.saveCmsHome(ch);
  } else if(type === 'logo'){
    var logos = []; try{ logos = JSON.parse(ch.marquee[lang].logos||'[]'); }catch(e){}
    logos.splice(idx,1);
    ch.marquee[lang].logos = JSON.stringify(logos);
    window.saveCmsHome(ch);
  } else if(type === 'group'){
    var groups = []; try{ groups = JSON.parse(ch.marquee[lang].groups||'[]'); }catch(e){}
    groups.splice(idx,1);
    ch.marquee[lang].groups = JSON.stringify(groups);
    window.saveCmsHome(ch);
  } else if(type === 'step'){
    var steps = []; try{ steps = JSON.parse(ch.cta[lang].steps||'[]'); }catch(e){}
    steps.splice(idx,1);
    ch.cta[lang].steps = JSON.stringify(steps);
    window.saveCmsHome(ch);
  } else if(type.indexOf('feat_') === 0){
    var svc = type.replace('feat_','');
    var feats = []; try{ feats = JSON.parse(ch[svc][lang].features||'[]'); }catch(e){}
    feats.splice(idx,1);
    ch[svc][lang].features = JSON.stringify(feats);
    window.saveCmsHome(ch);
  } else if(type === 'fcol'){
    var ft = getCmsFooter();
    if(ft[lang] && ft[lang].columns) ft[lang].columns.splice(idx,1);
    saveCmsFooter(ft);
  } else if(type.indexOf('flink_') === 0){
    var ci = parseInt(type.replace('flink_',''));
    var ft = getCmsFooter();
    if(ft[lang] && ft[lang].columns && ft[lang].columns[ci] && ft[lang].columns[ci].links){
      ft[lang].columns[ci].links.splice(idx,1);
      saveCmsFooter(ft);
    }
  } else if(type === 'nav'){
    if(_cmsSection === 'nav') window._cmsNavSave();
    var nd = getCmsNav();
    if(!nd[lang]) nd[lang] = JSON.parse(JSON.stringify(window.SITE && window.SITE.nav ? window.SITE.nav[lang] || window.SITE.nav['zh-Hant'] : []));
    nd[lang].splice(idx,1);
    saveCmsNav(nd);
  } else if(type.indexOf('navch_') === 0){
    var ni = parseInt(type.replace('navch_',''));
    var nd = getCmsNav();
    if(nd[lang] && nd[lang][ni] && nd[lang][ni].children) nd[lang][ni].children.splice(idx,1);
    saveCmsNav(nd);
  } else if(type.indexOf('navgch_') === 0){
    var parts = type.replace('navgch_','').split('_');
    var ni = parseInt(parts[0]), nj = parseInt(parts[1]);
    var nd = getCmsNav();
    if(nd[lang] && nd[lang][ni] && nd[lang][ni].children && nd[lang][ni].children[nj] && nd[lang][ni].children[nj].children){
      nd[lang][ni].children[nj].children.splice(idx,1);
      saveCmsNav(nd);
    }
  }
  // Refresh correct view
  if(_cmsSection === 'nav') window._cmsNavStandaloneView();
  else window._cmsHomeView();
};

// Section order move
window._cmsOrderMove = function(from, to){
  var ch = window.getCmsHome ? window.getCmsHome() : {};
  var defaultOrder = ['hero','banners','marquee','svc1','svc2','svc3','stats','news','cta'];
  var order = (ch.order && ch.order.length) ? ch.order : defaultOrder.slice();
  if(from < 0 || to < 0 || from >= order.length || to >= order.length || from === to) return;
  var item = order.splice(from, 1)[0];
  order.splice(to, 0, item);
  ch.order = order;
  window.saveCmsHome(ch);
  showToast(CL('order_saved'));
  window._cmsHomeView();
};

// Nav move
window._cmsNavMove = function(from, to, lang){
  window._cmsNavSave();
  var nd = getCmsNav();
  if(!lang) lang = window.currentLang || 'zh-Hant';
  if(!nd[lang]) return;
  var items = nd[lang];
  if(from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return;
  var item = items.splice(from, 1)[0];
  items.splice(to, 0, item);
  saveCmsNav(nd);
  // Refresh whichever view is active
  if(_cmsSection === 'nav') window._cmsNavStandaloneView();
  else window._cmsHomeView();
};

// Nav save — reads all nav inputs and saves to localStorage
window._cmsNavSave = function(){
  var langs = ["zh-Hant","zh-Hans","en"];
  var nd = getCmsNav();
  langs.forEach(function(lang){
    var source = nd[lang] || (window.SITE && window.SITE.nav ? window.SITE.nav[lang] || window.SITE.nav['zh-Hant'] : []);
    var result = [];
    var i = 0;
    while(document.getElementById('cmsNL_'+lang+'_'+i)){
      var label = document.getElementById('cmsNL_'+lang+'_'+i).value.trim();
      var pageOrExt = (document.getElementById('cmsNP_'+lang+'_'+i)||{}).value||'';
      pageOrExt = pageOrExt.trim();
      var item = {label: label};
      if(pageOrExt.indexOf('http') === 0) item.ext = pageOrExt;
      else if(pageOrExt) item.page = pageOrExt;
      // Read children
      var children = [];
      var j = 0;
      while(document.getElementById('cmsNC_'+lang+'_'+i+'_'+j)){
        var clabel = document.getElementById('cmsNC_'+lang+'_'+i+'_'+j).value.trim();
        var cpage = (document.getElementById('cmsNCP_'+lang+'_'+i+'_'+j)||{}).value||'';
        cpage = cpage.trim();
        var child = {label: clabel};
        if(cpage.indexOf('http') === 0) child.ext = cpage;
        else if(cpage) child.page = cpage;
        // Read grandchildren
        var gchildren = [];
        var k = 0;
        while(document.getElementById('cmsNCC_'+lang+'_'+i+'_'+j+'_'+k)){
          var glabel = document.getElementById('cmsNCC_'+lang+'_'+i+'_'+j+'_'+k).value.trim();
          var gpage = (document.getElementById('cmsNCCP_'+lang+'_'+i+'_'+j+'_'+k)||{}).value||'';
          gpage = gpage.trim();
          var gchild = {label: glabel};
          if(gpage.indexOf('http') === 0) gchild.ext = gpage;
          else if(gpage) gchild.page = gpage;
          gchildren.push(gchild);
          k++;
        }
        if(gchildren.length) child.children = gchildren;
        children.push(child);
        j++;
      }
      if(children.length) item.children = children;
      result.push(item);
      i++;
    }
    if(result.length) nd[lang] = result;
  });
  saveCmsNav(nd);
  showToast(CL('nav_saved'));
};

// Footer save — reads all footer inputs and saves to localStorage
window._cmsFooterSave = function(){
  var langs = ["zh-Hant","zh-Hans","en"];
  var ft = getCmsFooter();
  langs.forEach(function(lang){
    if(!ft[lang]) ft[lang] = {};
    var brand = (document.getElementById('cms_ft_brand_'+lang)||{}).value;
    var addr = (document.getElementById('cms_ft_addr_'+lang)||{}).value;
    var tel = (document.getElementById('cms_ft_tel_'+lang)||{}).value;
    var fax = (document.getElementById('cms_ft_fax_'+lang)||{}).value;
    if(brand !== undefined) ft[lang].brand_name = brand || '';
    if(addr !== undefined) ft[lang].address = addr || '';
    if(tel !== undefined) ft[lang].tel = tel || '';
    if(fax !== undefined) ft[lang].fax = fax || '';
    // Columns
    var cols = [];
    var ci = 0;
    while(document.getElementById('cmsFCT_'+lang+'_'+ci)){
      var colTitle = document.getElementById('cmsFCT_'+lang+'_'+ci).value.trim();
      var links = [];
      var li = 0;
      while(document.getElementById('cmsFCLT_'+lang+'_'+ci+'_'+li)){
        var lt = document.getElementById('cmsFCLT_'+lang+'_'+ci+'_'+li).value.trim();
        var lh = document.getElementById('cmsFCLH_'+lang+'_'+ci+'_'+li).value.trim();
        links.push({text:lt, href:lh||'#'});
        li++;
      }
      cols.push({title:colTitle, links:links});
      ci++;
    }
    if(cols.length) ft[lang].columns = cols;
  });
  saveCmsFooter(ft);
  showToast(CL('footer_saved'));
};

// Blog article preview in popup
window._cmsBlogPreview = function(idx){
  var articles = _getBlogArticles();
  var a = articles[idx];
  if(!a){ showToast(CL('article_not_found')); return; }
  var lang = window.currentLang || 'zh-Hant';
  var title = lang==='en' ? (a.title_en||a.title_hant) : (lang==='zh-Hans' ? (a.title_hans||a.title_hant) : a.title_hant);
  var body = lang==='en' ? (a.body_en||a.body_hant) : (lang==='zh-Hans' ? (a.body_hans||a.body_hant) : a.body_hant);
  var tag = lang==='en' ? (a.tag_en||a.tag_hant) : (lang==='zh-Hans' ? (a.tag_hans||a.tag_hant) : a.tag_hant);
  var pw = window.open('','_blank','width=960,height=720,scrollbars=yes,resizable=yes');
  if(!pw){ showToast(CL('popup_blocked')); return; }
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
    +'<div class="bar">'+CL('article_preview')+' — '+esc(lang)+'</div>'
    +'<div class="hero"><img src="'+escAttr(a.img)+'" alt=""></div>'
    +'<div class="content">'
    +'<span class="tag">'+esc(tag)+'</span>'
    +'<h1>'+esc(title)+'</h1>'
    +'<div class="date">'+esc(a.date)+'</div>'
    +'<div class="body">'+body+'</div>'
    +'</div></body></html>');
  pw.document.close();
};

// ————————————————————— CKEDITOR HELP MODAL —————————————————————
window._cmsCkHelp = function(){
  var existing = document.getElementById('cmsCkHelpModal');
  if(existing){ existing.remove(); return; }
  var lang = window.currentLang || 'zh-Hant';
  // SVG icon snippets matching the CKEditor toolbar
  var ic = {
    bold: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>',
    italic: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>',
    link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
    img: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    ul: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    ol: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>',
    table: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
    heading: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/></svg>',
    upload: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    source: '<span style="font-family:monospace;font-weight:700;font-size:12px;border:1px solid var(--border);border-radius:3px;padding:0 4px">&lt;/&gt;</span>',
    undo: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>',
    redo: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>'
  };
  function badge(icon){ return '<span style="display:inline-flex;align-items:center;gap:3px;background:var(--bg-light);border:1px solid var(--border);border-radius:4px;padding:2px 6px;font-size:12px;vertical-align:middle">'+icon+'</span>'; }
  var content = {
    'zh-Hant': {
      title: '編輯器説明',
      sections: [
        {h:'基本格式',items:[badge(ic.bold)+' <b>粗體</b> — 選取文字後點擊或按 Ctrl+B',badge(ic.italic)+' <i>斜體</i> — 選取文字後點擊或按 Ctrl+I',badge(ic.heading)+' 標題 — 使用「Heading」下拉選單選擇 H2 / H3 / H4']},
        {h:'插入連結',items:[badge(ic.link)+' 選取文字 → 點擊連結圖示','輸入網址（如 https://... 或 #/page/slug）','按 Enter 確認']},
        {h:'插入圖片',items:[badge(ic.img)+' 點擊「圖片上傳」圖示，選擇圖片檔案','直接將圖片拖放到編輯區域','複製圖片後在編輯區按 Ctrl+V 貼上','圖片會自動上傳並保存到檔案庫']},
        {h:'插入文件（PDF / DOC / PPT）',items:[badge(ic.upload)+' 點擊「上傳並插入」按鈕','選擇文件（支援 PDF、DOC、DOCX、PPT、PPTX）','文件會以下載連結形式插入到內容中']},
        {h:'從檔案庫插入',items:['點擊「從檔案庫插入」按鈕','從已上傳的檔案中選擇','圖片會以 &lt;img&gt; 標籤插入，文件會以下載連結插入']},
        {h:'清單與表格',items:[badge(ic.ul)+' 項目符號清單',badge(ic.ol)+' 編號清單',badge(ic.table)+' 表格 — 點擊「插入表格」選擇行列數']},
        {h:'原始碼模式',items:[badge(ic.source)+' 點擊編輯區上方的「Source」按鈕可切換原始碼模式','可直接編輯 HTML 原始碼','再次點擊切換回視覺編輯模式']},
        {h:'快捷鍵',items:['<kbd>Ctrl+B</kbd> — 粗體','<kbd>Ctrl+I</kbd> — 斜體','<kbd>Ctrl+Z</kbd> — '+badge(ic.undo)+' 復原','<kbd>Ctrl+Y</kbd> — '+badge(ic.redo)+' 重做','<kbd>Ctrl+K</kbd> — '+badge(ic.link)+' 插入連結']}
      ]
    },
    'zh-Hans': {
      title: '编辑器说明',
      sections: [
        {h:'基本格式',items:[badge(ic.bold)+' <b>粗体</b> — 选取文字后点击或按 Ctrl+B',badge(ic.italic)+' <i>斜体</i> — 选取文字后点击或按 Ctrl+I',badge(ic.heading)+' 标题 — 使用「Heading」下拉菜单选择 H2 / H3 / H4']},
        {h:'插入链接',items:[badge(ic.link)+' 选取文字 → 点击链接图标','输入网址（如 https://... 或 #/page/slug）','按 Enter 确认']},
        {h:'插入图片',items:[badge(ic.img)+' 点击「图片上传」图标，选择图片文件','直接将图片拖放到编辑区域','复制图片后在编辑区按 Ctrl+V 粘贴','图片会自动上传并保存到文件库']},
        {h:'插入文件（PDF / DOC / PPT）',items:[badge(ic.upload)+' 点击「上传并插入」按钮','选择文件（支持 PDF、DOC、DOCX、PPT、PPTX）','文件会以下载链接形式插入到内容中']},
        {h:'从文件库插入',items:['点击「从文件库插入」按钮','从已上传的文件中选择','图片会以 &lt;img&gt; 标签插入，文件会以下载链接插入']},
        {h:'列表与表格',items:[badge(ic.ul)+' 项目符号列表',badge(ic.ol)+' 编号列表',badge(ic.table)+' 表格 — 点击「插入表格」选择行列数']},
        {h:'源代码模式',items:[badge(ic.source)+' 点击编辑区上方的「Source」按钮可切换源代码模式','可直接编辑 HTML 源代码','再次点击切换回视觉编辑模式']},
        {h:'快捷键',items:['<kbd>Ctrl+B</kbd> — 粗体','<kbd>Ctrl+I</kbd> — 斜体','<kbd>Ctrl+Z</kbd> — '+badge(ic.undo)+' 撤销','<kbd>Ctrl+Y</kbd> — '+badge(ic.redo)+' 重做','<kbd>Ctrl+K</kbd> — '+badge(ic.link)+' 插入链接']}
      ]
    },
    'en': {
      title: 'Editor Guide',
      sections: [
        {h:'Basic Formatting',items:[badge(ic.bold)+' <b>Bold</b> — Select text and click or press Ctrl+B',badge(ic.italic)+' <i>Italic</i> — Select text and click or press Ctrl+I',badge(ic.heading)+' Headings — Use the "Heading" dropdown to select H2 / H3 / H4']},
        {h:'Insert Links',items:[badge(ic.link)+' Select text → Click the link icon','Enter URL (e.g. https://... or #/page/slug)','Press Enter to confirm']},
        {h:'Insert Images',items:[badge(ic.img)+' Click the "Image Upload" icon, select an image file','Drag and drop an image directly into the editor','Copy an image and press Ctrl+V to paste','Images are automatically uploaded and saved to the file library']},
        {h:'Insert Documents (PDF / DOC / PPT)',items:[badge(ic.upload)+' Click the "Upload & Insert" button','Select a file (supports PDF, DOC, DOCX, PPT, PPTX)','The file will be inserted as a download link']},
        {h:'Insert from Library',items:['Click the "Insert from Library" button','Choose from previously uploaded files','Images are inserted as &lt;img&gt; tags, documents as download links']},
        {h:'Lists & Tables',items:[badge(ic.ul)+' Bullet list',badge(ic.ol)+' Numbered list',badge(ic.table)+' Table — Click "Insert Table" and choose rows/columns']},
        {h:'Source Code Mode',items:[badge(ic.source)+' Click the "Source" button above the editor to toggle source mode','You can edit HTML source code directly','Click again to switch back to visual editing mode']},
        {h:'Keyboard Shortcuts',items:['<kbd>Ctrl+B</kbd> — Bold','<kbd>Ctrl+I</kbd> — Italic','<kbd>Ctrl+Z</kbd> — '+badge(ic.undo)+' Undo','<kbd>Ctrl+Y</kbd> — '+badge(ic.redo)+' Redo','<kbd>Ctrl+K</kbd> — '+badge(ic.link)+' Insert link']}
      ]
    }
  };
  var c = content[lang] || content['en'];
  var bodyHtml = '';
  c.sections.forEach(function(s){
    bodyHtml += '<h3 style="font-size:15px;font-weight:700;margin:18px 0 8px;color:var(--brand)">'+s.h+'</h3><ul style="margin:0 0 8px;padding-left:20px">';
    s.items.forEach(function(item){ bodyHtml += '<li style="margin-bottom:5px;font-size:13px;line-height:1.8">'+item+'</li>'; });
    bodyHtml += '</ul>';
  });
  var overlay = document.createElement('div');
  overlay.id = 'cmsCkHelpModal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = '<div style="background:var(--white);border-radius:12px;max-width:640px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25)">'
    +'<div style="position:sticky;top:0;background:var(--white);padding:20px 24px 12px;border-bottom:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0">'
    +'<h2 style="font-size:18px;font-weight:700;margin:0">'+c.title+'</h2>'
    +'<button onclick="document.getElementById(\'cmsCkHelpModal\').remove()" style="border:none;background:none;font-size:22px;cursor:pointer;color:var(--text-muted);padding:0 4px">&times;</button>'
    +'</div>'
    +'<div style="padding:8px 24px 24px">'+bodyHtml+'</div>'
    +'</div>';
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
};

// ————————————————————— STANDALONE NAV VIEW —————————————————————
window._cmsNavStandaloneView = function(){
  Object.keys(_cmsEditors).forEach(function(k){ try{ _cmsEditors[k].destroy(); }catch(e){} });
  _cmsEditors = {};

  var langs = ["zh-Hant","zh-Hans","en"];
  var langNames = {"zh-Hant":"繁體中文","zh-Hans":"简体中文","en":"English"};
  var navData = getCmsNav();

  function escQ(s){ return s.replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

  // Clear header actions
  window._cmsUpdateHeaderActions('');

  var html = '<div class="cms-panel" style="max-width:none">'
    +'<div style="padding:8px 0 10px;display:flex;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px solid rgba(0,0,0,.06);margin-bottom:16px">'
    +'<div><h3 style="font-size:20px;font-weight:700;margin:0">'+CL('home_nav')+'</h3>'
    +'<span style="font-size:12px;color:var(--text-muted)">'+CL('nav_menu_desc')+'</span></div>'
    +'<div style="display:flex;gap:6px;align-items:center">'
    +'<button class="admin-btn primary" onclick="window._cmsNavSave();showToast(CL(\'saved\')+\' \'+CL(\'home_nav\'))">'+CL('save_changes')+'</button>'
    +'<button class="admin-btn danger" style="font-size:12px" onclick="if(confirm(CL(\'nav_reset_q\'))){saveCmsNav({});window._cmsNavStandaloneView();}">'+CL('nav_reset')+'</button>'
    +'</div></div>';

  langs.forEach(function(lang){
    var navItems = navData[lang] || (window.SITE && window.SITE.nav ? window.SITE.nav[lang] || window.SITE.nav['zh-Hant'] : []);
    html += '<div class="cms-field-group"><h4>'+escHtml(langNames[lang])+' ('+lang+')</h4>';
    html += '<div id="cmsNavTree_'+lang+'">';
    navItems.forEach(function(item, i){
      var hasChildren = item.children && item.children.length;
      html += '<div class="cms-item-card" style="flex-direction:column;align-items:stretch;padding:12px 16px" draggable="true">'
        +'<div style="display:flex;align-items:center;gap:10px;cursor:pointer" onclick="var el=document.getElementById(\'cmsNE_'+lang+'_'+i+'\');el.style.display=el.style.display===\'none\'?\'block\':\'none\'">'
        +'<span class="dnd-handle" title="Drag to reorder" onclick="event.stopPropagation()">&#x2807;</span>'
        +'<span style="font-weight:700;font-size:14px;flex:1;color:var(--text)">'+esc(item.label)+'</span>'
        +'<span style="font-size:11px;color:var(--text-muted);font-family:monospace">'+esc(item.page||item.ext||'')+'</span>'
        +(hasChildren ? '<span style="font-size:10px;color:var(--brand);background:rgba(180,21,64,.08);padding:2px 8px;border-radius:100px;font-weight:600">'+item.children.length+' sub</span>' : '')
        +'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
        +'<button class="admin-btn danger" style="padding:4px 8px;font-size:11px" onclick="event.stopPropagation();window._cmsRemoveRepeater(\'nav\','+i+',\''+escQ(lang)+'\')">&#10005;</button>'
        +'</div>';
      // Collapsible edit form
      html += '<div id="cmsNE_'+lang+'_'+i+'" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid var(--border-light)">'
        +'<div class="cms-form-row">'
        +'<div class="admin-field" style="flex:1;margin:0"><label style="font-size:11px">'+CL('nav_item_label')+'</label><input type="text" id="cmsNL_'+lang+'_'+i+'" value="'+escAttr(item.label)+'" placeholder="'+CL('nav_item_label')+'"/></div>'
        +'<div class="admin-field" style="flex:1;margin:0"><label style="font-size:11px">'+CL('nav_item_page')+' / '+CL('nav_item_ext')+'</label><input type="text" id="cmsNP_'+lang+'_'+i+'" value="'+escAttr(item.page||item.ext||'')+'" placeholder="slug or https://..."/></div>'
        +'</div>';
      // Sub-items
      if(hasChildren){
        item.children.forEach(function(ch2, j){
          html += '<div style="margin-left:20px;margin-top:6px;padding:8px 12px;background:var(--bg-light);border-radius:8px;border:1px solid rgba(0,0,0,.04)">'
            +'<div class="cms-form-row" style="margin-bottom:0;align-items:center">'
            +'<div class="admin-field" style="flex:1;margin:0"><input type="text" id="cmsNC_'+lang+'_'+i+'_'+j+'" value="'+escAttr(ch2.label)+'" placeholder="'+CL('nav_item_label')+'" style="font-size:12px;padding:6px 10px"/></div>'
            +'<div class="admin-field" style="flex:1;margin:0"><input type="text" id="cmsNCP_'+lang+'_'+i+'_'+j+'" value="'+escAttr(ch2.page||ch2.ext||'')+'" placeholder="'+CL('nav_item_page')+'" style="font-size:12px;padding:6px 10px"/></div>'
            +'<button class="admin-btn danger" style="padding:3px 6px;font-size:10px" onclick="window._cmsRemoveRepeater(\'navch_'+i+'\','+j+',\''+escQ(lang)+'\')">&#10005;</button>'
            +'</div>';
          if(ch2.children && ch2.children.length){
            ch2.children.forEach(function(ch3, k){
              html += '<div class="cms-form-row" style="margin-left:20px;margin-top:4px;margin-bottom:0">'
                +'<div class="admin-field" style="flex:1;margin:0"><input type="text" id="cmsNCC_'+lang+'_'+i+'_'+j+'_'+k+'" value="'+escAttr(ch3.label)+'" placeholder="'+CL('nav_item_label')+'" style="font-size:11px;padding:5px 8px"/></div>'
                +'<div class="admin-field" style="flex:1;margin:0"><input type="text" id="cmsNCCP_'+lang+'_'+i+'_'+j+'_'+k+'" value="'+escAttr(ch3.page||ch3.ext||'')+'" placeholder="'+CL('nav_item_page')+'" style="font-size:11px;padding:5px 8px"/></div>'
                +'<button class="admin-btn danger" style="padding:2px 5px;font-size:9px" onclick="window._cmsRemoveRepeater(\'navgch_'+i+'_'+j+'\','+k+',\''+escQ(lang)+'\')">&#10005;</button>'
                +'</div>';
            });
          }
          html += '<button class="admin-btn secondary" style="font-size:10px;margin-left:20px;margin-top:4px;padding:2px 8px" onclick="window._cmsAddRepeater(\'navgch_'+i+'_'+j+'\',\''+escQ(lang)+'\')">'+CL('nav_add_child')+'</button>';
          html += '</div>';
        });
      }
      html += '<button class="admin-btn secondary" style="font-size:10px;margin-left:20px;margin-top:6px;padding:2px 8px" onclick="window._cmsAddRepeater(\'navch_'+i+'\',\''+escQ(lang)+'\')">'+CL('nav_add_child')+'</button>';
      html += '</div>'; // close edit form
      html += '</div>'; // close card
    });
    html += '</div>';
    html += '<div style="display:flex;gap:8px;margin-top:8px">'
      +'<button class="admin-btn secondary" style="font-size:12px" onclick="window._cmsAddRepeater(\'nav\',\''+escQ(lang)+'\')">'+CL('nav_add_item')+'</button>'
      +'</div>';
    html += '</div>';
  });

  html += '</div>';
  document.getElementById("cmsEditor").innerHTML = html;

  // Init DnD for nav trees
  setTimeout(function(){
    ['zh-Hant','zh-Hans','en'].forEach(function(lang){
      var navTree = document.getElementById('cmsNavTree_'+lang);
      if(navTree) _cmsDndInit(navTree, function(from, to){ window._cmsNavMove(from, to, lang); });
    });
  }, 40);

  // Deselect sidebar items
  document.querySelectorAll('.cms-page-item').forEach(function(el){ el.classList.remove('active'); });
};

// CMS initialization
_adminCurrentUser = sessionStorage.getItem("ecap_admin_user");
