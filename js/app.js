// ============================================
// APP.JS — Core SPA: Router, Views, Navigation
// ============================================
(function(){
"use strict";

// ---------- Combine data from separate files ----------
var SITE = { nav: SITE_NAV, ui: SITE_UI, pages: SITE_PAGES };

// ---------- State ----------
var currentLang = localStorage.getItem("ecap_lang") || "zh-Hant";
window.currentLang = currentLang;

// ---------- CMS Data Accessors ----------
var CMS_KEY = "ecap_cms_pages";
function getCmsPages(){ try{ var d=JSON.parse(localStorage.getItem(CMS_KEY)); return d||{}; }catch(e){ return {}; } }
function saveCmsPages(d){ localStorage.setItem(CMS_KEY, JSON.stringify(d)); }
function getPage(slug, lang){
  var cms = getCmsPages();
  if(cms[slug] && cms[slug][lang]) return cms[slug][lang];
  if(SITE.pages[slug]){
    if(SITE.pages[slug][lang]) return SITE.pages[slug][lang];
    if(SITE.pages[slug]["zh-Hant"]) return SITE.pages[slug]["zh-Hant"];
  }
  return null;
}
// Expose for CMS
window.getCmsPages = getCmsPages;
window.saveCmsPages = saveCmsPages;
window.getPage = getPage;
window.SITE = SITE;

// ---------- i18n ----------
function T(key){
  var u = SITE.ui[currentLang] || SITE.ui["zh-Hant"];
  return u[key] || key;
}
// Tri-lingual helper: L(en, hans, hant)
function L(en, hans, hant){
  return currentLang==='en' ? en : (currentLang==='zh-Hans' ? hans : hant);
}
window.T = T;

function setLang(lang){
  currentLang = lang;
  window.currentLang = lang;
  localStorage.setItem("ecap_lang", lang);
  // Update html lang attribute for proper CJK rendering
  var htmlLangs = {"zh-Hant":"zh-Hant","zh-Hans":"zh-Hans","en":"en"};
  document.documentElement.lang = htmlLangs[lang] || "zh-Hant";
  // Swap font priority: SC first for simplified, TC first for traditional
  document.documentElement.style.fontFamily = lang === 'zh-Hans'
    ? '"Be Vietnam Pro","Noto Sans SC","Noto Sans TC",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'
    : '';
  // Animate page transition on language switch
  var app = document.getElementById('app');
  if(app){
    app.classList.add('lang-switching');
    setTimeout(function(){
      route();
      requestAnimationFrame(function(){
        app.classList.remove('lang-switching');
      });
    }, 250);
  } else {
    route();
  }
}
window.setLang = setLang;

// ---------- Utils ----------
function esc(s){ if(s==null) return ''; var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function escAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
window.esc = esc;
window.escAttr = escAttr;
window.escHtml = escHtml;

function showToast(msg){
  var t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(function(){ t.classList.remove('show'); }, 3000);
}
window.showToast = showToast;

// ---------- SVG Icons ----------
var ICONS = {
  chevron: '<svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 010 20 15 15 0 010-20z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  trending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  dollar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
  award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
};

// ---------- Navigation ----------
function buildNav(){
  var items = SITE.nav[currentLang] || SITE.nav["zh-Hant"];
  var html = '';
  items.forEach(function(item){
    if(item.children){
      html += '<li class="nav-item">';
      html += '<span class="nav-label">' + esc(item.label) + ' ' + ICONS.chevron + '</span>';
      html += '<div class="nav-dropdown"><div class="nav-dropdown-inner">';
      // Separate flat items from groups
      var flatItems = [];
      var groups = [];
      item.children.forEach(function(ch){
        if(ch.children) groups.push(ch);
        else flatItems.push(ch);
      });

      if(groups.length > 0){
        // Layout: columns for each group + one column for flat items
        html += '<div class="nav-dropdown-cols">';
        // Flat items column
        if(flatItems.length > 0){
          html += '<div class="nav-dd-col">';
          flatItems.forEach(function(fi){ html += buildDdItem(fi); });
          html += '</div>';
        }
        // Group columns
        groups.forEach(function(g){
          html += '<div class="nav-dd-col">';
          html += '<div class="nav-dd-group-title">' + esc(g.label) + '</div>';
          g.children.forEach(function(sub){ html += buildDdItem(sub); });
          html += '</div>';
        });
        html += '</div>';
      } else {
        // Simple flat list
        flatItems.forEach(function(fi){ html += buildDdItem(fi); });
      }
      html += '</div></div></li>';
    } else {
      var href = item.page ? '#/page/' + item.page : (item.ext || '#/');
      var target = item.ext ? ' target="_blank" rel="noopener"' : ' data-spa';
      html += '<li class="nav-item"><a href="' + escAttr(href) + '"' + target + '>' + esc(item.label) + '</a></li>';
    }
  });

  var el = document.getElementById('navLinks');
  if(el) el.innerHTML = html;

  // Update language buttons
  document.querySelectorAll('.utility-lang a, .mm-lang a').forEach(function(a){
    a.classList.toggle('active', a.getAttribute('data-lang') === currentLang);
  });

  // Update nav brand text
  var brandText = document.querySelector('.nav-logo-text');
  if(brandText){
    var names = {"zh-Hant":"群益證券(香港)", "zh-Hans":"群益证券(香港)", "en":"Capital Securities (HK)"};
    brandText.textContent = names[currentLang] || names["zh-Hant"];
  }

  // Update nav CTA buttons text
  var ctaLogin = document.getElementById('navCtaLogin');
  var ctaOpen = document.getElementById('navCtaOpen');
  if(ctaLogin) ctaLogin.textContent = T("nav_login");
  if(ctaOpen) ctaOpen.textContent = T("nav_open");

  // Build mobile menu
  buildMobileMenu(items);
}

var DD_ARROW = '<svg class="dd-arrow" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>';
function buildDdItem(item){
  if(item.page){
    return '<a class="nav-dd-item" href="#/page/' + escAttr(item.page) + '" data-spa><span>' + esc(item.label) + '</span>' + DD_ARROW + '</a>';
  } else if(item.ext){
    return '<a class="nav-dd-item" href="' + escAttr(item.ext) + '" target="_blank" rel="noopener"><span>' + esc(item.label) + '</span>' + DD_ARROW + '</a>';
  }
  return '';
}

function buildMobileMenu(items){
  var el = document.getElementById('mobileMenu');
  if(!el) return;
  var html = '';
  items.forEach(function(item, i){
    if(item.children){
      html += '<div class="mm-item">';
      html += '<div class="mm-label" onclick="window._mmToggle(this)">' + esc(item.label) + ' ' + ICONS.chevron + '</div>';
      html += '<div class="mm-sub">';
      item.children.forEach(function(ch){
        if(ch.children){
          html += '<div class="mm-sub-title">' + esc(ch.label) + '</div>';
          ch.children.forEach(function(sub){
            var href = sub.page ? '#/page/' + sub.page : (sub.ext || '#');
            var target = sub.ext ? ' target="_blank"' : ' data-spa';
            html += '<a href="' + escAttr(href) + '"' + target + ' onclick="window._mmClose()">' + esc(sub.label) + '</a>';
          });
        } else {
          var href = ch.page ? '#/page/' + ch.page : (ch.ext || '#');
          var target = ch.ext ? ' target="_blank"' : ' data-spa';
          html += '<a href="' + escAttr(href) + '"' + target + ' onclick="window._mmClose()">' + esc(ch.label) + '</a>';
        }
      });
      html += '</div></div>';
    } else {
      var href = item.page ? '#/page/' + item.page : (item.ext || '#');
      var target = item.ext ? ' target="_blank"' : ' data-spa';
      html += '<div class="mm-item"><a href="' + escAttr(href) + '"' + target + ' onclick="window._mmClose()">' + esc(item.label) + '</a></div>';
    }
  });
  // CTA buttons
  html += '<div class="mm-cta">';
  html += '<a class="btn btn-gradient" href="#/page/stock-account-opening" data-spa onclick="window._mmClose()">' + esc(T("nav_open")) + '</a>';
  html += '<a class="btn btn-outline" href="https://itrade.e-capital.com.hk:8888/" target="_blank">' + esc(T("nav_login")) + '</a>';
  html += '</div>';
  // Language switcher
  html += '<div class="mm-lang" style="display:flex;gap:8px;justify-content:center;margin-top:20px">';
  html += '<a href="#" data-lang="zh-Hant" class="' + (currentLang==='zh-Hant'?'active':'') + '" style="padding:6px 14px;border-radius:99px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid var(--border)">繁體</a>';
  html += '<a href="#" data-lang="zh-Hans" class="' + (currentLang==='zh-Hans'?'active':'') + '" style="padding:6px 14px;border-radius:99px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid var(--border)">简体</a>';
  html += '<a href="#" data-lang="en" class="' + (currentLang==='en'?'active':'') + '" style="padding:6px 14px;border-radius:99px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid var(--border)">EN</a>';
  html += '</div>';
  el.innerHTML = html;
}

window._mmToggle = function(el){
  el.classList.toggle('open');
  var sub = el.nextElementSibling;
  if(sub) sub.classList.toggle('open');
};
window._mmClose = function(){
  var mm = document.getElementById('mobileMenu');
  var ham = document.getElementById('navHam');
  if(mm) mm.classList.remove('open');
  if(ham) ham.classList.remove('open');
  document.body.style.overflow = '';
};

// ---------- HOME VIEW ----------
function homeView(){
  var u = SITE.ui[currentLang] || SITE.ui["zh-Hant"];
  var html = '';

  // Hero
  html += heroSection(u);
  // Banner Carousel
  html += bannerSection(u);
  // Group Marquee
  html += marqueeSection(u);
  // Feature: Securities
  html += featureSection({
    id: 'svc-securities',
    label: u.svc1_label || L('Securities Trading', '股票交易', '股票交易'),
    title: u.svc1_title || L('Hong Kong & Global<br>Equities Trading', '港股及环球<br>股票交易服务', '港股及環球<br>股票交易服務'),
    desc: u.svc1_desc || L('Trade stocks listed on Hong Kong, Shanghai, and other major global exchanges through our professional iTrader platform.', '透过专业 iTrader 交易平台，轻松买卖港股、A股及环球主要市场的股票。', '透過專業 iTrader 交易平台，輕鬆買賣港股、A股及環球主要市場的股票。'),
    img: 'images/ecap-svc-securities.png',
    features: [
      { icon: ICONS.monitor, title: u.svc1_f1 || L('iTrader Platform', 'iTrader 交易平台', 'iTrader 交易平台'), desc: u.svc1_f1s || L('Award-winning online trading platform with real-time quotes.', '屡获殊荣的网上交易平台，提供即时报价。', '屢獲殊榮的網上交易平台，提供即時報價。') },
      { icon: ICONS.dollar, title: u.svc1_f2 || L('Competitive Commission', '具竞争力佣金', '具競爭力佣金'), desc: u.svc1_f2s || L('Industry-leading commission rates for all markets.', '全市场领先的佣金费率。', '全市場領先的佣金費率。') },
      { icon: ICONS.trending, title: u.svc1_f3 || L('IPO Subscription', 'IPO 新股认购', 'IPO 新股認購'), desc: u.svc1_f3s || L('Easy online IPO application via iTrader.', '透过 iTrader 轻松申请认购新股。', '透過 iTrader 輕鬆申請認購新股。') },
      { icon: ICONS.globe, title: u.svc1_f4 || L('Multi-Market Access', '多市场覆盖', '多市場覆蓋'), desc: u.svc1_f4s || L('Access Hong Kong, Shanghai, Shenzhen and more.', '涵盖港股、沪股、深股等主要市场。', '涵蓋港股、滬股、深股等主要市場。') }
    ]
  });
  // Feature: SH-HK Connect
  html += featureSection({
    id: 'svc-connect',
    label: u.svc2_label || L('SH-HK Stock Connect', '沪港通', '滬港通'),
    title: u.svc2_title || L('Shanghai-Hong Kong<br>Stock Connect', '沪港通<br>交易服务', '滬港通<br>交易服務'),
    desc: u.svc2_desc || L('Access A-share market through our comprehensive Stock Connect service with professional research support.', '透过全面的沪港通服务进入A股市场，配合专业研究报告支援。', '透過全面的滬港通服務進入A股市場，配合專業研究報告支援。'),
    img: 'images/ecap-svc-connect.png',
    features: [
      { icon: ICONS.zap, title: u.svc2_f1 || L('Direct A-Share Access', '直接买卖A股', '直接買賣A股'), desc: u.svc2_f1s || L('Trade Shanghai and Shenzhen listed A-shares directly.', '直接交易沪深两市上市A股。', '直接交易滬深兩市上市A股。') },
      { icon: ICONS.chart, title: u.svc2_f2 || L('Research Reports', '研究报告', '研究報告'), desc: u.svc2_f2s || L('Regular A-share research and market insights.', '定期A股研究报告及市场分析。', '定期A股研究報告及市場分析。') },
      { icon: ICONS.award, title: u.svc2_f3 || L('Monthly Publication', '沪港通月刊', '滬港通月刊'), desc: u.svc2_f3s || L('Monthly updates on Stock Connect developments.', '每月沪港通最新动态。', '每月滬港通最新動態。') }
    ]
  });
  // Feature: Futures
  html += featureSection({
    id: 'svc-futures',
    label: u.svc3_label || L('Futures & Options', '期货及期权', '期貨及期權'),
    title: u.svc3_title || L('Futures &<br>Options Trading', '期货及<br>期权交易服务', '期貨及<br>期權交易服務'),
    desc: u.svc3_desc || L('Trade futures and options on major exchanges with our professional Sharp Point platform.', '透过专业 Sharp Point 交易平台，交易主要交易所的期货及期权。', '透過專業 Sharp Point 交易平台，交易主要交易所的期貨及期權。'),
    img: 'images/ecap-svc-futures.png',
    features: [
      { icon: ICONS.monitor, title: u.svc3_f1 || L('Sharp Point Platform', 'Sharp Point 平台', 'Sharp Point 平台'), desc: u.svc3_f1s || L('Professional futures trading platform with advanced tools.', '专业期货交易平台，配备先进工具。', '專業期貨交易平台，配備先進工具。') },
      { icon: ICONS.clock, title: u.svc3_f2 || L('Extended Hours', '延长交易时段', '延長交易時段'), desc: u.svc3_f2s || L('Trade during day and after-hours sessions.', '日间及夜间交易时段均可进行交易。', '日間及夜間交易時段均可進行交易。') },
      { icon: ICONS.shield, title: u.svc3_f3 || L('Risk Management', '风险管理', '風險管理'), desc: u.svc3_f3s || L('Comprehensive risk management tools and alerts.', '完善的风险管理工具及提示系统。', '完善的風險管理工具及提示系統。') }
    ]
  });
  // Stats
  html += statsSection(u);
  // News
  html += newsSection(u);
  // CTA
  html += ctaSection(u);
  return html;
}

// ---------- HERO SECTION ----------
function heroSection(u){
  var h = '';
  h += '<section class="hero">';
  h += '<div class="hero-deco hero-deco-circle"></div>';
  h += '<div class="hero-deco hero-deco-circle-2"></div>';
  h += '<div class="hero-deco hero-deco-circle-3"></div>';
  h += '<div class="hero-content anim-fade-up">';
  h += '<div class="hero-badge">' + ICONS.shield + ' ' + esc(currentLang==='en' ? 'SFC Licensed' : (currentLang==='zh-Hans' ? '香港证监会持牌' : '香港證監會持牌')) + '</div>';
  h += '<h1 class="hero-title">' + (currentLang==='en' ? 'Your Professional<br>Securities & Futures Partner' : (currentLang==='zh-Hans' ? '您的专业<br>证券及期货交易伙伴' : '您的專業<br>證券及期貨交易夥伴')) + '</h1>';
  h += '<p class="hero-subtitle">' + esc(currentLang==='en' ? 'Over 30 years of experience in Hong Kong financial markets. Trade equities, futures, options and access Shanghai-HK Stock Connect.' : (currentLang==='zh-Hans' ? '逾三十年香港金融市场经验，提供证券、期货、期权交易及沪港通服务。' : '逾三十年香港金融市場經驗，提供證券、期貨、期權交易及滬港通服務。')) + '</p>';
  h += '<div class="hero-ctas">';
  h += '<a class="btn btn-gradient" href="#/page/stock-account-opening" data-spa>' + esc(currentLang==='en' ? 'Open Account' : (currentLang==='zh-Hans' ? '开立帐户' : '開立帳戶')) + '</a>';
  h += '<a class="btn btn-white" href="https://itrade.e-capital.com.hk:8888/" target="_blank">' + esc(currentLang==='en' ? 'Trade Now' : (currentLang==='zh-Hans' ? '立即交易' : '立即交易')) + '</a>';
  h += '</div>';
  h += '</div>';
  h += '</section>';
  return h;
}

// ---------- BANNER CAROUSEL ----------
function bannerSection(u){
  // Read banners from CMS (localStorage) or use defaults
  var cmsBanners = null;
  try { cmsBanners = JSON.parse(localStorage.getItem('ecap_cms_banners')); } catch(e){}
  var banners = (cmsBanners && cmsBanners.length > 0) ? cmsBanners : [
    { img: 'images/ecap-banner-1.png', alt: L('iTrader Platform', 'iTrader 交易平台', 'iTrader 交易平台'), link: '#/page/stock-ipo' },
    { img: 'images/ecap-banner-2.png', alt: L('Stock Connect', '沪港通服务', '滬港通服務'), link: '#/page/shh-hk' },
    { img: 'images/ecap-banner-3.png', alt: L('Open Account', '开立帐户', '開立帳戶'), link: '#/page/stock-account-opening' }
  ];
  var h = '<section class="banner-sec anim-fade-up">';
  h += '<div class="mw-xl">';
  h += '<div class="swiper banner-swiper">';
  h += '<div class="swiper-wrapper">';
  banners.forEach(function(b){
    h += '<div class="swiper-slide banner-slide">';
    if(b.link){
      h += '<a href="' + escAttr(b.link) + '"' + (b.link.indexOf('http') === 0 ? ' target="_blank" rel="noopener"' : ' data-spa') + '>';
    }
    h += '<img src="' + escAttr(b.img) + '" alt="' + escAttr(b.alt || '') + '" loading="lazy">';
    if(b.link) h += '</a>';
    h += '<div class="banner-slide-shadow"><img src="' + escAttr(b.img) + '" alt="" aria-hidden="true"></div>';
    h += '</div>';
  });
  h += '</div>';
  h += '<div class="swiper-pagination banner-pagination"></div>';
  h += '</div></div></section>';
  return h;
}

// ---------- MARQUEE ----------
function marqueeSection(u){
  var logos = [
    {name: 'Capital Securities Corp.', img: 'https://www.e-capital.com.hk/images/fortisinvestments.png'},
    {name: 'Fidelity', img: 'https://www.e-capital.com.hk/images/fidelity.png'},
    {name: 'First State', img: 'https://www.e-capital.com.hk/images/Firststate.png'},
    {name: 'Man Investments', img: 'https://www.e-capital.com.hk/images/ManInvestments.png'}
  ];
  var groups = [
    {name: L('Capital Securities Corp.', '群益金鼎证券', '群益金鼎證券')},
    {name: L('Capital Securities (HK)', '群益证券(香港)', '群益證券(香港)')},
    {name: L('Capital Futures (HK)', '群益期货(香港)', '群益期貨(香港)')},
    {name: L('Capital Investment Trust', '群益投信', '群益投信')},
    {name: L('Capital Futures Corp.', '群益期货', '群益期貨')},
    {name: L('Capital Securities Group', '群益金融集团', '群益金融集團')},
    {name: L('Capital Asset Management', '群益投顾', '群益投顧')}
  ];
  var row1 = '', row2 = '';
  // Row 1: logo images
  for(var r = 0; r < 4; r++){
    logos.forEach(function(l){
      row1 += '<div class="marquee-item marquee-logo"><img src="' + escAttr(l.img) + '" alt="' + escAttr(l.name) + '"></div>';
    });
  }
  // Row 2: text names
  for(var r2 = 0; r2 < 2; r2++){
    groups.forEach(function(g){
      row2 += '<div class="marquee-item"><span>' + esc(g.name) + '</span></div>';
    });
  }
  var h = '<section class="marquee-sec">';
  h += '<div class="marquee-title">' + esc(L('Capital Group', '群益金融集团', '群益金融集團')) + '</div>';
  h += '<div class="marquee-row marquee-row-1"><div class="marquee-track">' + row1 + '</div></div>';
  h += '<div class="marquee-row marquee-row-2"><div class="marquee-track">' + row2 + '</div></div>';
  h += '</section>';
  return h;
}

// ---------- FEATURE SECTION ----------
function featureSection(opts){
  var h = '<section class="feature-block section" id="' + escAttr(opts.id) + '">';
  h += '<div class="mw"><div class="feature-inner">';
  // Image
  h += '<div class="feature-img anim-fade-left">';
  h += '<img src="' + escAttr(opts.img) + '" alt="' + escAttr(opts.label) + '" loading="lazy">';
  h += '<div class="feature-deco"><div class="feature-deco-circle"></div></div>';
  h += '</div>';
  // Text
  h += '<div class="feature-text anim-fade-right">';
  h += '<div class="feature-label gradient-text">' + esc(opts.label) + '</div>';
  h += '<h2 class="feature-title">' + opts.title + '</h2>';
  h += '<p class="feature-desc">' + esc(opts.desc) + '</p>';
  h += '<div class="feature-list">';
  opts.features.forEach(function(f, i){
    h += '<div class="feature-list-item anim-fade-up anim-delay-' + (i+1) + '">';
    h += '<div class="feature-list-icon">' + f.icon + '</div>';
    h += '<div><div class="feature-list-title">' + esc(f.title) + '</div>';
    h += '<div class="feature-list-desc">' + esc(f.desc) + '</div></div>';
    h += '</div>';
  });
  h += '</div></div>';
  h += '</div></div></section>';
  return h;
}

// ---------- STATS ----------
function statsSection(u){
  var stats = [
    { num: '30+', label: L('Years of Experience', '年金融服务经验', '年金融服務經驗') },
    { num: 'SFC', label: L('Hong Kong SFC Regulated', '香港证监会持牌', '香港證監會持牌') },
    { num: '24/7', label: L('Customer Support', '全天候客户服务', '全天候客戶服務') },
    { num: L('Multi', '多元', '多元'), label: L('Market Access', '市场覆盖', '市場覆蓋') }
  ];
  var h = '<section class="stats-sec">';
  h += '<div class="mw"><div class="stats-grid">';
  stats.forEach(function(s, i){
    h += '<div class="stat-item anim-scale anim-delay-' + (i+1) + '">';
    h += '<div class="stat-num">' + esc(s.num) + '</div>';
    h += '<div class="stat-label">' + esc(s.label) + '</div>';
    h += '</div>';
  });
  h += '</div></div></section>';
  return h;
}

// ---------- NEWS ----------
function newsSection(u){
  var news = [
    { img: 'images/ecap-news-1.png', date: '2026-04-01', title: L('Daily Market Commentary', '每日市场评论', '每日市場評論'), excerpt: L('Latest analysis on Hong Kong and A-share markets with investment insights.', '最新港股及A股市场分析与投资洞见。', '最新港股及A股市場分析與投資洞見。'), page: 'report-daily' },
    { img: 'images/ecap-news-2.png', date: '2026-03-28', title: L('Stock Pick Recommendations', '个股推荐报告', '個股推薦報告'), excerpt: L('Our research team\'s latest individual stock recommendations.', '研究团队最新个股推荐分析。', '研究團隊最新個股推薦分析。'), page: 'report-stock' },
    { img: 'images/ecap-news-3.png', date: '2026-03-25', title: L('IPO Market Update', '新股市场动态', '新股市場動態'), excerpt: L('Recent IPO listings and upcoming subscription opportunities.', '近期新股上市资讯及最新招股资讯。', '近期新股上市資訊及最新招股資訊。'), page: 'report-ipo' }
  ];
  var h = '<section class="news-sec section">';
  h += '<div class="mw">';
  h += '<div class="news-header anim-fade-up"><div class="sec-label gradient-text">' + esc(L('Latest Updates', '最新动态', '最新動態')) + '</div>';
  h += '<h2 class="sec-title">' + esc(L("What's New", '新闻与研究', '新聞與研究')) + '</h2></div>';
  // Desktop grid
  h += '<div class="news-grid">';
  news.forEach(function(n, i){
    h += '<a class="news-card anim-fade-up anim-delay-' + (i+1) + '" href="#/page/' + escAttr(n.page) + '" data-spa>';
    h += '<div class="news-card-img"><img src="' + escAttr(n.img) + '" alt="' + escAttr(n.title) + '" loading="lazy"></div>';
    h += '<div class="news-card-body">';
    h += '<div class="news-card-date">' + esc(n.date) + '</div>';
    h += '<h3 class="news-card-title">' + esc(n.title) + '</h3>';
    h += '<p class="news-card-excerpt">' + esc(n.excerpt) + '</p>';
    h += '</div></a>';
  });
  h += '</div>';
  // Mobile swiper
  h += '<div class="swiper news-swiper"><div class="swiper-wrapper">';
  news.forEach(function(n){
    h += '<div class="swiper-slide">';
    h += '<a class="news-card" href="#/page/' + escAttr(n.page) + '" data-spa>';
    h += '<div class="news-card-img"><img src="' + escAttr(n.img) + '" alt="' + escAttr(n.title) + '" loading="lazy"></div>';
    h += '<div class="news-card-body">';
    h += '<div class="news-card-date">' + esc(n.date) + '</div>';
    h += '<h3 class="news-card-title">' + esc(n.title) + '</h3>';
    h += '<p class="news-card-excerpt">' + esc(n.excerpt) + '</p>';
    h += '</div></a></div>';
  });
  h += '</div></div>';
  h += '</div></section>';
  return h;
}

// ---------- CTA ----------
function ctaSection(u){
  var steps = currentLang==='en'
    ? ['Download\nAgreement','Submit\nDocuments','Account\nApproved','Start\nTrading']
    : (currentLang==='zh-Hans'
      ? ['下载\n开户合约','提交\n所需文件','帐户\n审批通过','开始\n交易']
      : ['下載\n開戶合約','提交\n所需文件','帳戶\n審批通過','開始\n交易']);
  var h = '<section class="cta-sec">';
  h += '<div class="mw"><div class="cta-card anim-fade-up">';
  h += '<h2 class="cta-title">' + esc(L('Open Your Account Today', '立即开户 把握投资先机', '立即開戶 把握投資先機')) + '</h2>';
  h += '<p class="cta-desc">' + esc(L('Start trading in Hong Kong, Shanghai and global markets with Capital Securities. Simple account opening process.', '群益证券为您提供港股、A股及环球市场交易服务。简单开户流程，快速开始投资。', '群益證券為您提供港股、A股及環球市場交易服務。簡單開戶流程，快速開始投資。')) + '</p>';
  h += '<div class="cta-steps">';
  steps.forEach(function(s, i){
    h += '<div class="cta-step"><div class="cta-step-num">' + (i+1) + '</div>';
    h += '<div class="cta-step-label">' + esc(s).replace(/\n/g,'<br>') + '</div></div>';
  });
  h += '</div>';
  h += '<div class="cta-btns">';
  h += '<a class="btn btn-white" href="#/page/stock-account-opening" data-spa>' + esc(L('Open Account', '开立帐户', '開立帳戶')) + '</a>';
  h += '<a class="btn btn-outline" style="color:white;border-color:rgba(255,255,255,.4)" href="#/page/stock-fee" data-spa>' + esc(L('View Fees', '查看收费', '查看收費')) + '</a>';
  h += '</div>';
  h += '</div></div></section>';
  return h;
}

// ---------- NEWS HUB (rd.group newsroom style) ----------
function newsHubContent(){
  var categories = [
    { icon: ICONS.chart, title: L('Daily Market Commentary','每日市场评论','每日市場評論'), desc: L('Daily analysis on Hong Kong and A-share markets.','每日港股及A股市场分析报告。','每日港股及A股市場分析報告。'), page:'report-daily' },
    { icon: ICONS.trending, title: L('IPO Reports','新股上市分析','新股上市分析'), desc: L('Latest IPO listings and subscription analysis.','最新新股上市分析及认购资讯。','最新新股上市分析及認購資訊。'), page:'report-ipo' },
    { icon: ICONS.award, title: L('Stock Recommendations','个股推荐报告','個股推薦報告'), desc: L('Individual stock research and recommendations.','精选个股研究推荐报告。','精選個股研究推薦報告。'), page:'report-stock' },
    { icon: ICONS.monitor, title: L("CSC's View",'群益观点','群益觀點'), desc: L('Our expert views on market trends.','群益专家对市况走势的独到见解。','群益專家對市況走勢的獨到見解。'), page:'report-view' },
    { icon: ICONS.globe, title: L('Stock Connect Magazine','沪港通月刊','滬港通月刊'), desc: L('Monthly updates on Shanghai-HK Stock Connect.','每月沪港通最新动态。','每月滬港通最新動態。'), page:'shh-hk-mag' },
    { icon: ICONS.zap, title: L('A-Share Research','A股研究报告','A股研究報告'), desc: L('Research reports on A-share market.','A股市场研究报告。','A股市場研究報告。'), page:'shh-hk-report' }
  ];
  var h = '<div class="news-hub-grid">';
  categories.forEach(function(cat,i){
    h += '<a href="#/page/' + escAttr(cat.page) + '" class="news-hub-card" data-spa style="animation-delay:' + (i*0.06+0.05).toFixed(2) + 's">';
    h += '<div class="news-hub-card-icon">' + cat.icon + '</div>';
    h += '<div class="news-hub-card-body">';
    h += '<h3 class="news-hub-card-title">' + esc(cat.title) + '</h3>';
    h += '<p class="news-hub-card-desc">' + esc(cat.desc) + '</p>';
    h += '</div>';
    h += '<svg class="news-hub-arrow" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>';
    h += '</a>';
  });
  h += '</div>';
  return h;
}

// ---------- BLOG PAGE (rd.group-style image cards) ----------
// Blog article data — shared between listing and detail views
var BLOG_ARTICLES = [
  { slug:'hk-news-market', title_en:'Market Analysis: Hong Kong Stocks Q1 2026', title_hans:'市场分析：2026年第一季度港股回顾', title_hant:'市場分析：2026年第一季度港股回顧', date:'2026-03-28', img:'images/ecap-blog-market.png', tag_en:'Market', tag_hans:'市场', tag_hant:'市場',
    body_en:'<p>The Hong Kong stock market experienced significant movements in Q1 2026, with the Hang Seng Index showing resilience amid global uncertainties. Key sectors including technology and financial services led market gains.</p><p>Our analysts note that the favorable monetary policy environment and strong corporate earnings contributed to a positive quarter. The continued development of the Greater Bay Area economic zone remains a key driver for regional growth.</p><h3>Key Highlights</h3><ul><li>Hang Seng Index gained 8.2% over Q1</li><li>Technology sector outperformed with 12% gains</li><li>Mainland China capital inflow increased 15% via Stock Connect</li><li>IPO market remained active with 23 new listings</li></ul><p>Looking ahead, we expect continued momentum supported by favorable policy measures and improving economic fundamentals.</p>',
    body_hans:'<p>2026年第一季度，香港股市在全球不确定性中表现出韧性，恒生指数出现显著走势。科技和金融服务等关键行业引领市场涨幅。</p><p>我们的分析师指出，有利的货币政策环境和强劲的企业盈利为积极的一季度做出了贡献。大湾区经济区的持续发展仍然是区域增长的关键驱动力。</p><h3>重点摘要</h3><ul><li>恒生指数一季度上涨8.2%</li><li>科技行业表现优异，涨幅达12%</li><li>通过沪港通的内地资金流入增加15%</li><li>IPO市场保持活跃，新增23宗上市</li></ul><p>展望未来，我们预计在有利政策措施和改善的经济基本面支持下，市场将继续保持动力。</p>',
    body_hant:'<p>2026年第一季度，香港股市在全球不確定性中表現出韌性，恒生指數出現顯著走勢。科技和金融服務等關鍵行業引領市場漲幅。</p><p>我們的分析師指出，有利的貨幣政策環境和強勁的企業盈利為積極的一季度做出了貢獻。大灣區經濟區的持續發展仍然是區域增長的關鍵驅動力。</p><h3>重點摘要</h3><ul><li>恒生指數一季度上漲8.2%</li><li>科技行業表現優異，漲幅達12%</li><li>通過滬港通的內地資金流入增加15%</li><li>IPO市場保持活躍，新增23宗上市</li></ul><p>展望未來，我們預計在有利政策措施和改善的經濟基本面支持下，市場將繼續保持動力。</p>' },
  { slug:'hk-news-connect', title_en:'Stock Connect Monthly Update — March 2026', title_hans:'沪港通月度动态 — 2026年3月', title_hant:'滬港通月度動態 — 2026年3月', date:'2026-03-15', img:'images/ecap-blog-connect.png', tag_en:'Stock Connect', tag_hans:'沪港通', tag_hant:'滬港通',
    body_en:'<p>March 2026 saw record-breaking activity through the Shanghai-Hong Kong Stock Connect program, with daily average turnover reaching new highs.</p><h3>Monthly Highlights</h3><ul><li>Northbound daily average turnover: HK$128 billion</li><li>Southbound daily average turnover: RMB 85 billion</li><li>New eligible stocks added to Stock Connect lists</li><li>Enhanced settlement mechanisms improved trading efficiency</li></ul><p>The expansion of eligible stocks and the introduction of improved settlement processes have been well received by international investors.</p>',
    body_hans:'<p>2026年3月，沪港通录得创纪录的交易活动，日均成交额创下新高。</p><h3>月度亮点</h3><ul><li>北向日均成交额：1,280亿港元</li><li>南向日均成交额：850亿人民币</li><li>新增股票纳入沪港通名单</li><li>优化结算机制提升交易效率</li></ul><p>合资格股票范围的扩大及改善的结算流程获得国际投资者的好评。</p>',
    body_hant:'<p>2026年3月，滬港通錄得創紀錄的交易活動，日均成交額創下新高。</p><h3>月度亮點</h3><ul><li>北向日均成交額：1,280億港元</li><li>南向日均成交額：850億人民幣</li><li>新增股票納入滬港通名單</li><li>優化結算機制提升交易效率</li></ul><p>合資格股票範圍的擴大及改善的結算流程獲得國際投資者的好評。</p>' },
  { slug:'hk-news-ipo', title_en:'New IPO Subscription Guide: Spring 2026', title_hans:'新股认购指南：2026年春季', title_hant:'新股認購指南：2026年春季', date:'2026-03-01', img:'images/ecap-blog-ipo.png', tag_en:'IPO', tag_hans:'新股', tag_hant:'新股',
    body_en:'<p>Spring 2026 brings an exciting lineup of IPO listings on the Hong Kong Stock Exchange. Here is our comprehensive guide to upcoming subscription opportunities.</p><h3>How to Subscribe via iTrader</h3><ul><li>Login to your iTrader account</li><li>Navigate to IPO Subscription section</li><li>Select the IPO you wish to subscribe</li><li>Enter the number of shares and confirm</li></ul><p>Capital Securities offers competitive financing rates for IPO subscriptions, helping you maximize your investment opportunities.</p>',
    body_hans:'<p>2026年春季，香港交易所迎来一系列令人期待的IPO上市。以下是我们的新股认购综合指南。</p><h3>通过iTrader认购方法</h3><ul><li>登录您的iTrader帐户</li><li>前往新股认购专区</li><li>选择您想认购的新股</li><li>输入股数并确认</li></ul><p>群益证券提供具竞争力的新股融资利率，帮助您把握投资机遇。</p>',
    body_hant:'<p>2026年春季，香港交易所迎來一系列令人期待的IPO上市。以下是我們的新股認購綜合指南。</p><h3>通過iTrader認購方法</h3><ul><li>登入您的iTrader帳戶</li><li>前往新股認購專區</li><li>選擇您想認購的新股</li><li>輸入股數並確認</li></ul><p>群益證券提供具競爭力的新股融資利率，幫助您把握投資機遇。</p>' },
  { slug:'hk-news-global', title_en:'Global Markets Weekly Wrap — February', title_hans:'环球市场每周回顾 — 2月', title_hant:'環球市場每周回顧 — 2月', date:'2026-02-28', img:'images/ecap-blog-global.png', tag_en:'Global', tag_hans:'环球', tag_hant:'環球',
    body_en:'<p>Global markets ended February on a positive note, with major indices posting gains across most regions. US markets rallied on strong earnings reports, while European markets benefited from improving economic data.</p><h3>Regional Highlights</h3><ul><li>S&P 500: +3.1% for the month</li><li>Nikkei 225: +2.8%</li><li>Euro Stoxx 50: +4.2%</li><li>Hang Seng: +5.6%</li></ul><p>Our global macro team remains cautiously optimistic about the outlook for Q2 2026.</p>',
    body_hans:'<p>全球市场在2月底收于积极态势，主要指数大部分地区录得涨幅。美国市场受强劲盈利报告推动上涨，而欧洲市场则受益于改善的经济数据。</p><h3>各地区亮点</h3><ul><li>标普500：本月+3.1%</li><li>日经225：+2.8%</li><li>欧洲斯托克50：+4.2%</li><li>恒生指数：+5.6%</li></ul><p>我们的全球宏观团队对2026年第二季度展望保持谨慎乐观。</p>',
    body_hant:'<p>全球市場在2月底收於積極態勢，主要指數大部分地區錄得漲幅。美國市場受強勁盈利報告推動上漲，而歐洲市場則受益於改善的經濟數據。</p><h3>各地區亮點</h3><ul><li>標普500：本月+3.1%</li><li>日經225：+2.8%</li><li>歐洲斯托克50：+4.2%</li><li>恒生指數：+5.6%</li></ul><p>我們的全球宏觀團隊對2026年第二季度展望保持謹慎樂觀。</p>' },
  { slug:'hk-news-ashare', title_en:'A-Share Market Outlook 2026', title_hans:'A股市场2026年展望', title_hant:'A股市場2026年展望', date:'2026-02-15', img:'images/ecap-blog-ashare.png', tag_en:'Research', tag_hans:'研究', tag_hant:'研究',
    body_en:'<p>Our research team presents the A-share market outlook for 2026, highlighting key themes and sectors to watch.</p><h3>Key Themes for 2026</h3><ul><li>Technology self-sufficiency driving semiconductor sector</li><li>Green energy transition accelerating</li><li>Consumer spending recovery</li><li>New infrastructure investment</li></ul><p>We recommend selective positioning in quality growth stocks with strong fundamentals and sector leadership.</p>',
    body_hans:'<p>我们的研究团队发布A股市场2026年展望，重点介绍值得关注的主要主题和行业。</p><h3>2026年关键主题</h3><ul><li>科技自主推动半导体行业</li><li>绿色能源转型加速</li><li>消费支出持续复苏</li><li>新基建投资加码</li></ul><p>我们建议精选具有强劲基本面和行业领先地位的优质成长型股票。</p>',
    body_hant:'<p>我們的研究團隊發佈A股市場2026年展望，重點介紹值得關注的主要主題和行業。</p><h3>2026年關鍵主題</h3><ul><li>科技自主推動半導體行業</li><li>綠色能源轉型加速</li><li>消費支出持續復甦</li><li>新基建投資加碼</li></ul><p>我們建議精選具有強勁基本面和行業領先地位的優質成長型股票。</p>' },
  { slug:'hk-news-awards', title_en:'Capital Securities Annual Awards Ceremony', title_hans:'群益证券年度颁奖典礼', title_hant:'群益證券年度頒獎典禮', date:'2026-01-20', img:'images/ecap-blog-awards.png', tag_en:'Company', tag_hans:'公司', tag_hant:'公司',
    body_en:'<p>Capital Securities (Hong Kong) held its Annual Awards Ceremony to celebrate outstanding achievements and recognize contributions from our dedicated team members.</p><h3>Award Categories</h3><ul><li>Best Sales Performance</li><li>Outstanding Client Service</li><li>Innovation Award</li><li>Long Service Recognition</li></ul><p>We extend our heartfelt congratulations to all award recipients and thank our entire team for their exceptional dedication throughout the year.</p>',
    body_hans:'<p>群益证券（香港）举办年度颁奖典礼，表彰杰出成就，感谢团队成员的卓越贡献。</p><h3>奖项类别</h3><ul><li>最佳销售业绩奖</li><li>杰出客户服务奖</li><li>创新奖</li><li>长期服务奖</li></ul><p>我们向所有获奖者致以衷心祝贺，并感谢全体团队一年来的杰出贡献。</p>',
    body_hant:'<p>群益證券（香港）舉辦年度頒獎典禮，表彰傑出成就，感謝團隊成員的卓越貢獻。</p><h3>獎項類別</h3><ul><li>最佳銷售業績獎</li><li>傑出客戶服務獎</li><li>創新獎</li><li>長期服務獎</li></ul><p>我們向所有獲獎者致以衷心祝賀，並感謝全體團隊一年來的傑出貢獻。</p>' }
];
window.BLOG_ARTICLES = BLOG_ARTICLES;

// Get blog articles: CMS overrides take priority over defaults
function getActiveBlogArticles(){
  if(typeof getCmsBlog === 'function'){
    var cms = getCmsBlog();
    if(cms && cms.length) return cms;
  }
  return BLOG_ARTICLES;
}

function blogContent(){
  var articles = getActiveBlogArticles();
  var h = '<div class="blog-grid">';
  articles.forEach(function(a, i){
    var title = L(a.title_en, a.title_hans, a.title_hant);
    var tag = L(a.tag_en, a.tag_hans, a.tag_hant);
    h += '<a class="blog-card" href="#/page/' + escAttr(a.slug) + '" data-spa style="animation-delay:' + (i*0.08).toFixed(2) + 's">';
    h += '<div class="blog-card-img"><img src="' + escAttr(a.img) + '" alt="' + escAttr(title) + '"></div>';
    h += '<div class="blog-card-body">';
    h += '<span class="blog-card-tag">' + esc(tag) + '</span>';
    h += '<h3 class="blog-card-title">' + esc(title) + '</h3>';
    h += '<time class="blog-card-date">' + esc(a.date) + '</time>';
    h += '</div></a>';
  });
  h += '</div>';
  return h;
}

// ---------- BLOG ARTICLE DETAIL VIEW ----------
function blogArticleView(slug){
  var article = null;
  var articles = getActiveBlogArticles();
  articles.forEach(function(a){ if(a.slug === slug) article = a; });
  if(!article) return null;
  var title = L(article.title_en, article.title_hans, article.title_hant);
  var tag = L(article.tag_en, article.tag_hans, article.tag_hant);
  var body = L(article.body_en, article.body_hans, article.body_hant);

  var h = '<section class="subpage">';
  // Hero image with title overlay below (rd.group style)
  h += '<div class="article-hero-wrap">';
  h += '<div class="article-hero">';
  h += '<img src="' + escAttr(article.img) + '" alt="' + escAttr(title) + '">';
  h += '</div>';
  h += '<div class="article-hero-caption"><div class="mw">';
  h += '<time class="article-hero-date">' + esc(article.date) + '</time>';
  h += '<h1 class="article-hero-title">' + esc(title) + '</h1>';
  h += '</div></div>';
  h += '</div>';
  // Article content
  h += '<div class="subpage-content"><div class="mw">';
  h += '<div class="article-header">';
  h += '<a href="#/page/hk-news" data-spa class="article-back">&larr; ' + esc(L('Back to News','返回新闻','返回新聞')) + '</a>';
  h += '<span class="blog-card-tag" style="font-size:0.9375rem">' + esc(tag) + '</span>';
  h += '</div>';
  h += '<div class="article-body">' + body + '</div>';
  h += '</div></div>';
  h += '</section>';
  return h;
}

// ---------- PAGE VIEW (rd.group-style) ----------
function findSiblingPages(slug){
  var items = SITE.nav[currentLang] || SITE.nav["zh-Hant"];
  for(var i=0;i<items.length;i++){
    var top = items[i];
    if(top.children){
      // Check flat children
      for(var j=0;j<top.children.length;j++){
        var ch = top.children[j];
        if(ch.page === slug) return { parent: top.label, siblings: top.children, current: slug };
        if(ch.children){
          for(var k=0;k<ch.children.length;k++){
            if(ch.children[k].page === slug) return { parent: ch.label, siblings: ch.children, current: slug };
          }
        }
      }
    }
  }
  return null;
}

function pageView(slug){
  // Blog article detail pages — intercept hk-news-* slugs
  if(slug.indexOf('hk-news-') === 0){
    var articleHtml = blogArticleView(slug);
    if(articleHtml) return articleHtml;
  }

  var pg = getPage(slug, currentLang);
  if(!pg){
    return '<section class="subpage"><div class="mw">'
      +'<div class="subpage-header"><h1>' + esc(L('Page Not Found', '找不到页面', '找不到頁面')) + '</h1></div>'
      +'<div class="subpage-body"><p>' + esc(L('The requested page does not exist.', '您所請求的頁面不存在。', '您所請求的頁面不存在。')) + '</p>'
      +'<p><a href="#/" data-spa style="color:var(--brand)">' + esc(T("home")) + '</a></p></div>'
      +'</div></section>';
  }

  var sibs = findSiblingPages(slug);
  var h = '<section class="subpage">';

  // rd.group-style page header
  h += '<div class="subpage-hero">';
  h += '<div class="mw">';
  h += '<div class="breadcrumb"><a href="#/" data-spa>' + esc(T("home")) + '</a>';
  if(sibs) h += ' / <span>' + esc(sibs.parent) + '</span>';
  h += '</div>';
  h += '<h1 class="subpage-title gradient-text">' + esc(pg.title) + '</h1>';

  // Sibling tabs (rd.group style)
  if(sibs && sibs.siblings && sibs.siblings.length > 1){
    h += '<div class="subpage-tabs">';
    sibs.siblings.forEach(function(sib){
      if(sib.page){
        var active = sib.page === slug ? ' active' : '';
        h += '<a href="#/page/' + escAttr(sib.page) + '" class="subpage-tab' + active + '" data-spa>' + esc(sib.label) + '</a>';
      }
    });
    h += '</div>';
  }
  h += '</div></div>';

  // Content area
  h += '<div class="subpage-content"><div class="mw">';
  h += '<div class="subpage-card">';

  // Report listing pages get card-style table treatment
  var reportPages = ['report-daily','report-ipo','report-stock','report-view','shh-hk-report','shh-hk-mag'];
  var bodyClass = 'subpage-body';
  if(reportPages.indexOf(slug) !== -1) bodyClass += ' report-listing';

  if(slug === 'news'){
    h += '<div class="' + bodyClass + '">' + newsHubContent() + '</div>';
  } else if(slug === 'hk-news'){
    h += '<div class="' + bodyClass + '">' + blogContent() + '</div>';
  } else {
    h += '<div class="' + bodyClass + '">' + pg.body + '</div>';
  }
  h += '</div>';
  h += '</div></div>';

  h += '</section>';
  return h;
}

// ---------- FOOTER ----------
function footerView(){
  var isEn = currentLang === 'en';
  var isHans = currentLang === 'zh-Hans';
  var h = '<footer class="footer">';
  h += '<div class="mw footer-main">';
  h += '<div class="footer-grid">';

  // Brand column
  h += '<div class="footer-brand">';
  h += '<div class="footer-brand-name">' + esc(isEn ? 'Capital Securities (Hong Kong) Limited' : (isHans ? '群益证券(香港)有限公司' : '群益證券(香港)有限公司')) + '</div>';
  h += '<div class="footer-brand-addr">';
  h += esc(isEn ? '21/F, Capital Centre, 151 Gloucester Road, Wan Chai, Hong Kong' : (isHans ? '香港湾仔告士打道151号资本中心21楼全层' : '香港灣仔告士打道151號資本中心21樓全層')) + '<br>';
  h += esc(isEn ? 'Tel' : (isHans ? '电话' : '電話')) + ': (852) 2530-9966<br>';
  h += esc(isEn ? 'Fax' : (isHans ? '传真' : '傳真')) + ': (852) 2530-9424';
  h += '</div></div>';

  // Products column
  h += '<div class="footer-col"><div class="footer-col-title">' + esc(isEn ? 'Products' : (isHans ? '产品服务' : '產品服務')) + '</div>';
  h += '<a href="#/page/stock-ipo" data-spa>' + esc(isEn ? 'Securities' : (isHans ? '证券交易' : '證券交易')) + '</a>';
  h += '<a href="#/page/shh-hk" data-spa>' + esc(isEn ? 'Stock Connect' : (isHans ? '沪港通' : '滬港通')) + '</a>';
  h += '<a href="http://futures.e-capital.com.hk/" target="_blank">' + esc(isEn ? 'Futures & Options' : (isHans ? '期货及期权' : '期貨及期權')) + '</a>';
  h += '<a href="#/page/fund" data-spa>' + esc(isEn ? 'Funds' : '基金') + '</a>';
  h += '</div>';

  // Discover column
  h += '<div class="footer-col"><div class="footer-col-title">' + esc(isEn ? 'Discover' : (isHans ? '探索' : '探索')) + '</div>';
  h += '<a href="#/page/news" data-spa>' + esc(isEn ? 'News' : (isHans ? '新闻' : '新聞')) + '</a>';
  h += '<a href="#/page/report-daily" data-spa>' + esc(isEn ? 'Daily Commentary' : (isHans ? '每日评论' : '每日評論')) + '</a>';
  h += '<a href="#/page/report-stock" data-spa>' + esc(isEn ? 'Stock Reports' : (isHans ? '个股推荐' : '個股推薦')) + '</a>';
  h += '<a href="#/page/shh-hk-mag" data-spa>' + esc(isEn ? 'Monthly Magazine' : (isHans ? '沪港通月刊' : '滬港通月刊')) + '</a>';
  h += '</div>';

  // Account column
  h += '<div class="footer-col"><div class="footer-col-title">' + esc(isEn ? 'Account' : (isHans ? '账户' : '帳戶')) + '</div>';
  h += '<a href="#/page/stock-account-opening" data-spa>' + esc(isEn ? 'Open Account' : (isHans ? '开户程序' : '開戶程序')) + '</a>';
  h += '<a href="#/page/stock-fee" data-spa>' + esc(isEn ? 'Fee Schedule' : (isHans ? '佣金及收费' : '佣金及收費')) + '</a>';
  h += '<a href="#/page/fund-deposit" data-spa>' + esc(isEn ? 'Funds Deposit' : (isHans ? '款项提存' : '款項提存')) + '</a>';
  h += '<a href="#/page/forms-download" data-spa>' + esc(isEn ? 'Forms' : (isHans ? '下载表格' : '下載表格')) + '</a>';
  h += '</div>';

  // Legal column
  h += '<div class="footer-col"><div class="footer-col-title">' + esc(isEn ? 'Legal' : (isHans ? '法律信息' : '法律資訊')) + '</div>';
  h += '<a href="#/page/trade-statement" data-spa>' + esc(isEn ? 'Trading Declaration' : (isHans ? '网上交易声明' : '網上交易聲明')) + '</a>';
  h += '<a href="#/page/risk-disclosure" data-spa>' + esc(isEn ? 'Risk Disclosure' : (isHans ? '风险披露' : '風險披露')) + '</a>';
  h += '<a href="#/page/privacy" data-spa>' + esc(isEn ? 'Privacy Policy' : (isHans ? '个人隐私政策' : '個人私隱政策')) + '</a>';
  h += '<a href="#/page/contact" data-spa>' + esc(isEn ? 'Contact Us' : (isHans ? '联络我们' : '聯絡我們')) + '</a>';
  h += '</div>';

  h += '</div>'; // footer-grid

  // Bottom
  h += '<div class="footer-btm">';
  h += '<div class="footer-copy">&copy; ' + new Date().getFullYear() + ' ' + esc(isEn ? 'Capital Securities (Hong Kong) Limited. All rights reserved.' : (isHans ? '群益证券(香港)有限公司 版权所有' : '群益證券(香港)有限公司 版權所有'));
  h += ' &middot; <a href="#/admin">CMS</a></div>';
  h += '</div>';
  h += '</div></footer>';
  return h;
}

// ---------- ROUTER ----------
function route(){
  var hash = location.hash || "#/";
  var app = document.getElementById("app");
  if(!app) return;

  // Remove CMS body class for non-admin routes
  if(hash !== "#/admin") document.body.classList.remove('cms-active');

  buildNav();

  if(hash === "#/" || hash === "#" || hash === ""){
    app.innerHTML = homeView() + footerView();
    window.scrollTo(0,0);
    if(typeof window.initHomeAnimations === 'function') requestAnimationFrame(function(){ setTimeout(window.initHomeAnimations, 10); });
  } else if(hash.indexOf("#/page/") === 0){
    var slug = hash.replace("#/page/","").split("?")[0];
    app.innerHTML = pageView(slug) + footerView();
    // Disable legacy forms and ASPX links
    app.querySelectorAll('form').forEach(function(f){ f.addEventListener('submit', function(e){ e.preventDefault(); }); });
    app.querySelectorAll('a[href^="javascript:"]').forEach(function(a){ a.setAttribute('href','#'); });
    app.querySelectorAll('a[href*=".aspx"]').forEach(function(a){ a.setAttribute('href','#'); a.style.pointerEvents='none'; a.style.opacity='.4'; });
    window.scrollTo(0,0);
  } else if(hash === "#/admin"){
    document.body.classList.add('cms-active');
    if(typeof window.adminView === 'function'){
      app.innerHTML = window.adminView();
    } else {
      app.innerHTML = '<div style="padding:200px 24px;text-align:center"><h2>CMS Loading...</h2></div>';
    }
    window.scrollTo(0,0);
  } else {
    app.innerHTML = pageView('__404__') + footerView();
    window.scrollTo(0,0);
  }
}
window.route = route;

// ---------- EVENT LISTENERS ----------

// Hash change
window.addEventListener('hashchange', route);

// SPA link delegation
document.addEventListener('click', function(e){
  var a = e.target.closest('a[data-spa]');
  if(a){
    e.preventDefault();
    var href = a.getAttribute('href');
    if(href && href !== location.hash){
      location.hash = href;
    } else {
      route();
    }
  }
});

// Language switch
document.addEventListener('click', function(e){
  var a = e.target.closest('[data-lang]');
  if(a){
    e.preventDefault();
    setLang(a.getAttribute('data-lang'));
  }
});

// Nav scroll effect
var lastScroll = 0;
window.addEventListener('scroll', function(){
  var nav = document.getElementById('mainNav');
  var utilBar = document.getElementById('utilityBar');
  var y = window.pageYOffset;
  if(nav){
    nav.classList.toggle('scrolled', y > 40);
  }
  if(utilBar){
    utilBar.classList.toggle('hidden', y > 60);
  }
  lastScroll = y;
}, {passive: true});

// Hamburger toggle
document.addEventListener('click', function(e){
  if(e.target.closest('#navHam')){
    var ham = document.getElementById('navHam');
    var mm = document.getElementById('mobileMenu');
    ham.classList.toggle('open');
    mm.classList.toggle('open');
    document.body.style.overflow = mm.classList.contains('open') ? 'hidden' : '';
  }
});

// ---------- INIT ----------
// Defer initial route to ensure cms.js and other scripts are loaded
if(document.readyState === 'complete'){
  route();
} else {
  window.addEventListener('load', route);
}

})();
