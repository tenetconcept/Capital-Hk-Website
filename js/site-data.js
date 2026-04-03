// ============================================
// SITE DATA — Navigation + UI strings
// ============================================

var SITE_NAV = {
  "zh-Hant": [
    {label:"產品服務", children:[
      {label:"證券交易", children:[
        {label:"港股及環球股票", page:"stock-ipo"},
        {label:"開戶程序", page:"stock-account-opening"},
        {label:"佣金及收費", page:"stock-fee"},
        {label:"iTrader 交易平台", ext:"https://itrade.e-capital.com.hk:8888/"},
        {label:"IPO 新股申購", page:"stock-ipo-know"}
      ]},
      {label:"滬港通服務", children:[
        {label:"滬港通通識", page:"shh-hk"},
        {label:"滬港通月刊", page:"shh-hk-mag"},
        {label:"A股研究報告", page:"shh-hk-report"}
      ]},
      {label:"期貨及期權", children:[
        {label:"期貨交易平台", ext:"http://futures.e-capital.com.hk/"},
        {label:"開戶程序", page:"futures-account"},
        {label:"佣金及收費", page:"futures-fee"}
      ]},
      {label:"基金", page:"fund"}
    ]},
    {label:"關於群益", children:[
      {label:"公司簡介", page:"about"},
      {label:"開戶指南", children:[
        {label:"股票開戶", page:"stock-account-opening"},
        {label:"期貨開戶", page:"futures-account"},
        {label:"核對清單(股票)", page:"stock-checklist"},
        {label:"核對清單(期貨)", page:"futures-checklist"},
        {label:"下載合約(股票)", page:"stock-download"},
        {label:"下載合約(期貨)", page:"futures-download"}
      ]},
      {label:"款項提存方法", page:"fund-deposit"},
      {label:"交易時間表", page:"trade-hours"},
      {label:"下載其他表格", page:"forms-download"}
    ]},
    {label:"探索", children:[
      {label:"香港新聞", page:"hk-news"},
      {label:"研究報告", children:[
        {label:"每日評論", page:"report-daily"},
        {label:"新股上市", page:"report-ipo"},
        {label:"個股推薦", page:"report-stock"},
        {label:"群益觀點", page:"report-view"}
      ]},
      {label:"滬港通月刊", page:"shh-hk-mag"},
      {label:"常見問題", children:[
        {label:"股票常見問題", page:"stock-faq"},
        {label:"期貨常見問題", page:"futures-faq"}
      ]}
    ]},
    {label:"聯絡我們", page:"contact"}
  ],
  "zh-Hans": [
    {label:"产品服务", children:[
      {label:"证券交易", children:[
        {label:"港股及环球股票", page:"stock-ipo"},
        {label:"开户程序", page:"stock-account-opening"},
        {label:"佣金及收费", page:"stock-fee"},
        {label:"iTrader 交易平台", ext:"https://itrade.e-capital.com.hk:8888/"},
        {label:"IPO 新股申购", page:"stock-ipo-know"}
      ]},
      {label:"沪港通服务", children:[
        {label:"沪港通通识", page:"shh-hk"},
        {label:"沪港通月刊", page:"shh-hk-mag"},
        {label:"A股研究报告", page:"shh-hk-report"}
      ]},
      {label:"期货及期权", children:[
        {label:"期货交易平台", ext:"http://futures.e-capital.com.hk/cn/"},
        {label:"开户程序", page:"futures-account"},
        {label:"佣金及收费", page:"futures-fee"}
      ]},
      {label:"基金", page:"fund"}
    ]},
    {label:"关于群益", children:[
      {label:"公司简介", page:"about"},
      {label:"开户指南", children:[
        {label:"股票开户", page:"stock-account-opening"},
        {label:"期货开户", page:"futures-account"},
        {label:"核对清单(股票)", page:"stock-checklist"},
        {label:"核对清单(期货)", page:"futures-checklist"},
        {label:"下载合约(股票)", page:"stock-download"},
        {label:"下载合约(期货)", page:"futures-download"}
      ]},
      {label:"款项提存方法", page:"fund-deposit"},
      {label:"交易时间表", page:"trade-hours"},
      {label:"下载其他表格", page:"forms-download"}
    ]},
    {label:"探索", children:[
      {label:"香港新闻", page:"hk-news"},
      {label:"研究报告", children:[
        {label:"每日评论", page:"report-daily"},
        {label:"新股上市", page:"report-ipo"},
        {label:"个股推荐", page:"report-stock"},
        {label:"群益观点", page:"report-view"}
      ]},
      {label:"沪港通月刊", page:"shh-hk-mag"},
      {label:"常见问题", children:[
        {label:"股票常见问题", page:"stock-faq"},
        {label:"期货常见问题", page:"futures-faq"}
      ]}
    ]},
    {label:"联络我们", page:"contact"}
  ],
  "en": [
    {label:"Products", children:[
      {label:"Securities", children:[
        {label:"HK & Global Equities", page:"stock-ipo"},
        {label:"Account Opening", page:"stock-account-opening"},
        {label:"Fee Schedule", page:"stock-fee"},
        {label:"iTrader Platform", ext:"https://itrade.e-capital.com.hk:8888/"},
        {label:"IPO Subscription", page:"stock-ipo-know"}
      ]},
      {label:"SH-HK Stock Connect", children:[
        {label:"Connect Guide", page:"shh-hk"},
        {label:"Monthly Publication", page:"shh-hk-mag"},
        {label:"A-Share Research", page:"shh-hk-report"}
      ]},
      {label:"Futures & Options", children:[
        {label:"Trading Platform", ext:"http://futures.e-capital.com.hk/en/"},
        {label:"Account Opening", page:"futures-account"},
        {label:"Fee Schedule", page:"futures-fee"}
      ]},
      {label:"Funds", page:"fund"}
    ]},
    {label:"Company", children:[
      {label:"About Us", page:"about"},
      {label:"Account Opening Guide", children:[
        {label:"Securities Account", page:"stock-account-opening"},
        {label:"Futures Account", page:"futures-account"},
        {label:"Checklist (Securities)", page:"stock-checklist"},
        {label:"Checklist (Futures)", page:"futures-checklist"},
        {label:"Document Download (Securities)", page:"stock-download"},
        {label:"Document Download (Futures)", page:"futures-download"}
      ]},
      {label:"Funds Deposit/Withdrawal", page:"fund-deposit"},
      {label:"Trade Hours", page:"trade-hours"},
      {label:"Forms Download", page:"forms-download"}
    ]},
    {label:"Discover", children:[
      {label:"News", page:"hk-news"},
      {label:"Research Reports", children:[
        {label:"Daily Market Update", page:"report-daily"},
        {label:"IPO Summary", page:"report-ipo"},
        {label:"Individual Stock Report", page:"report-stock"},
        {label:"CSC's View", page:"report-view"}
      ]},
      {label:"Monthly Publication", page:"shh-hk-mag"},
      {label:"FAQ", children:[
        {label:"Securities FAQ", page:"stock-faq"},
        {label:"Futures FAQ", page:"futures-faq"}
      ]}
    ]},
    {label:"Contact Us", page:"contact"}
  ]
};

var SITE_UI = {
    "zh-Hant": {
      nav_login:"登入交易", nav_open:"開立帳戶", home:"首頁",
      hero_badge:"香港持牌證券商 \u00b7 SFC 受監管",
      hero_h1_1:"您的", hero_h1_gt:"專業證券", hero_h1_2:"及期貨交易夥伴",
      hero_sub:"群益證券(香港)提供股票、期貨、期權及滬港通等全方位交易服務，配備專業研究團隊及先進交易平台，助您把握每個投資機遇。",
      hero_cta1:"開立帳戶", hero_cta2:"立即交易",
      hero_card_t:"iTrader 交易平台", hero_card_s:"股票 \u00b7 期貨 \u00b7 期權 \u00b7 滬股通",
      hero_float:"全球市場", hero_float_s:"股票、期貨及期權交易",
      marquee_label:"群益金融集團",
      marquee_items:["群益金融網","群益期貨","群益投信","群益保代","群益股代","群益上海","群益證券(香港)"],
      svc_label:"服務項目", svc_title:"全方位交易服務",
      svc_desc:"為個人及機構投資者提供多元化的金融產品和專業服務，覆蓋港股、A股、期貨及期權市場。",
      svc1_label:"股票交易", svc1_title:"港股及環球股票<br/>交易服務",
      svc1_desc:"透過 iTrader 網上交易平台，輕鬆買賣港股及環球股票，享受快速執行及具競爭力的佣金收費。",
      svc1_f1:"iTrader 交易平台", svc1_f1s:"快速下單、即時報價",
      svc1_f2:"具競爭力佣金", svc1_f2s:"低至 0.15% 交易佣金",
      svc1_f3:"IPO 新股申購", svc1_f3s:"輕鬆參與新股招股",
      svc1_f4:"環球市場", svc1_f4s:"港股及海外市場",
      svc1_vis:"股票交易", svc1_vis_s:"港股 \u00b7 美股 \u00b7 IPO",
      svc2_label:"滬港通", svc2_title:"滬港通<br/>互聯互通交易",
      svc2_desc:"透過滬港通機制直接買賣上海A股，獲取群益專業A股研究報告及市場月刊，掌握內地市場脈搏。",
      svc2_f1:"直接買賣A股", svc2_f1s:"透過滬港通機制",
      svc2_f2:"A股研究報告", svc2_f2s:"專業分析及推薦",
      svc2_f3:"滬港通月刊", svc2_f3s:"定期市場資訊",
      svc2_f4:"滬港通通識", svc2_f4s:"制度規則詳解",
      svc2_vis:"滬港通", svc2_vis_s:"直接買賣上海 A 股",
      svc3_label:"期貨及期權", svc3_title:"期貨及期權<br/>交易服務",
      svc3_desc:"透過 Sharp Point 專業期貨交易平台，買賣恆生指數期貨、期權及環球期貨商品，配備即時行情及風控工具。",
      svc3_f1:"Sharp Point 平台", svc3_f1s:"專業期貨交易系統",
      svc3_f2:"風險管理工具", svc3_f2s:"即時監控及止損",
      svc3_f3:"夜市交易", svc3_f3s:"24 小時交易機會",
      svc3_f4:"環球期貨", svc3_f4s:"指數、商品及外匯",
      svc3_vis:"期貨及期權", svc3_vis_s:"恆指期貨 \u00b7 環球商品",
      stat1:"30+", stat1l:"年金融服務經驗", stat2:"SFC", stat2l:"香港證監會監管",
      stat3:"24/7", stat3l:"全天候客戶服務", stat4:"多市場", stat4l:"港股、A股、期貨",
      news_label:"最新動態", news_title:"新聞與評論", news_all:"查看全部",
      cta_h:"立即開戶<br/>把握投資先機",
      cta_p:"只需簡單幾步，即可開立群益證券帳戶，享受專業交易服務、每日研究報告及具競爭力的佣金收費。",
      cta_btn1:"股票開戶", cta_btn2:"期貨開戶",
      cta_s1:"下載開戶合約", cta_s2:"填寫及提交文件", cta_s3:"帳戶審批完成", cta_s4:"登入交易平台",
      ft_svc:"交易服務", ft_news:"新聞與研究", ft_acct:"開戶與支援", ft_legal:"法律聲明",
      ft_addr:"群益證券(香港)有限公司<br/>香港德輔道中308號富衞金融中心3樓<br/>TEL：(852) 2530-9966<br/>FAX：(852) 2104-6006",
      ft_copy:"\u00a9 群益金融集團 The Capital Group. All Rights Reserved.",
      admin_title:"CMS 內容管理", admin_save:"儲存", admin_export:"匯出 JSON", admin_import:"匯入 JSON", admin_reset:"重設預設"
    },
    "zh-Hans": {
      nav_login:"登入交易", nav_open:"开立帐户", home:"首页",
      hero_badge:"香港持牌证券商 \u00b7 SFC 受监管",
      hero_h1_1:"您的", hero_h1_gt:"专业证券", hero_h1_2:"及期货交易伙伴",
      hero_sub:"群益证券(香港)提供股票、期货、期权及沪港通等全方位交易服务，配备专业研究团队及先进交易平台，助您把握每个投资机遇。",
      hero_cta1:"开立帐户", hero_cta2:"立即交易",
      hero_card_t:"iTrader 交易平台", hero_card_s:"股票 \u00b7 期货 \u00b7 期权 \u00b7 沪股通",
      hero_float:"全球市场", hero_float_s:"股票、期货及期权交易",
      marquee_label:"群益金融集团",
      marquee_items:["群益金融网","群益期货","群益投信","群益保代","群益股代","群益上海","群益证券(香港)"],
      svc_label:"服务项目", svc_title:"全方位交易服务",
      svc_desc:"为个人及机构投资者提供多元化的金融产品和专业服务，覆盖港股、A股、期货及期权市场。",
      svc1_label:"股票交易", svc1_title:"港股及环球股票<br/>交易服务",
      svc1_desc:"透过 iTrader 网上交易平台，轻松买卖港股及环球股票，享受快速执行及具竞争力的佣金收费。",
      svc1_f1:"iTrader 交易平台", svc1_f1s:"快速下单、即时报价",
      svc1_f2:"具竞争力佣金", svc1_f2s:"低至 0.15% 交易佣金",
      svc1_f3:"IPO 新股申购", svc1_f3s:"轻松参与新股招股",
      svc1_f4:"环球市场", svc1_f4s:"港股及海外市场",
      svc1_vis:"股票交易", svc1_vis_s:"港股 \u00b7 美股 \u00b7 IPO",
      svc2_label:"沪港通", svc2_title:"沪港通<br/>互联互通交易",
      svc2_desc:"透过沪港通机制直接买卖上海A股，获取群益专业A股研究报告及市场月刊，掌握内地市场脉搏。",
      svc2_f1:"直接买卖A股", svc2_f1s:"透过沪港通机制",
      svc2_f2:"A股研究报告", svc2_f2s:"专业分析及推荐",
      svc2_f3:"沪港通月刊", svc2_f3s:"定期市场资讯",
      svc2_f4:"沪港通通识", svc2_f4s:"制度规则详解",
      svc2_vis:"沪港通", svc2_vis_s:"直接买卖上海 A 股",
      svc3_label:"期货及期权", svc3_title:"期货及期权<br/>交易服务",
      svc3_desc:"透过 Sharp Point 专业期货交易平台，买卖恒生指数期货、期权及环球期货商品，配备即时行情及风控工具。",
      svc3_f1:"Sharp Point 平台", svc3_f1s:"专业期货交易系统",
      svc3_f2:"风险管理工具", svc3_f2s:"即时监控及止损",
      svc3_f3:"夜市交易", svc3_f3s:"24 小时交易机会",
      svc3_f4:"环球期货", svc3_f4s:"指数、商品及外汇",
      svc3_vis:"期货及期权", svc3_vis_s:"恒指期货 \u00b7 环球商品",
      stat1:"30+", stat1l:"年金融服务经验", stat2:"SFC", stat2l:"香港证监会监管",
      stat3:"24/7", stat3l:"全天候客户服务", stat4:"多市场", stat4l:"港股、A股、期货",
      news_label:"最新动态", news_title:"新闻与评论", news_all:"查看全部",
      cta_h:"立即开户<br/>把握投资先机",
      cta_p:"只需简单几步，即可开立群益证券帐户，享受专业交易服务、每日研究报告及具竞争力的佣金收费。",
      cta_btn1:"股票开户", cta_btn2:"期货开户",
      cta_s1:"下载开户合约", cta_s2:"填写及提交文件", cta_s3:"帐户审批完成", cta_s4:"登入交易平台",
      ft_svc:"交易服务", ft_news:"新闻与研究", ft_acct:"开户与支援", ft_legal:"法律声明",
      ft_addr:"群益证券(香港)有限公司<br/>香港德辅道中308号富卫金融中心3楼<br/>TEL：(852) 2530-9966<br/>FAX：(852) 2104-6006",
      ft_copy:"\u00a9 群益金融集团 The Capital Group. All Rights Reserved.",
      admin_title:"CMS 内容管理", admin_save:"储存", admin_export:"导出 JSON", admin_import:"导入 JSON", admin_reset:"重设预设"
    },
    "en": {
      nav_login:"Login", nav_open:"Open Account", home:"Home",
      hero_badge:"SFC Licensed Securities Dealer \u00b7 Regulated",
      hero_h1_1:"Your ", hero_h1_gt:"Professional", hero_h1_2:" Securities & Futures Partner",
      hero_sub:"Capital Securities (HK) provides comprehensive trading services for equities, futures, options and Shanghai-Hong Kong Stock Connect, powered by professional research and advanced trading platforms.",
      hero_cta1:"Open Account", hero_cta2:"Trade Now",
      hero_card_t:"iTrader Platform", hero_card_s:"Stocks \u00b7 Futures \u00b7 Options \u00b7 SH-HK Connect",
      hero_float:"Global Markets", hero_float_s:"Equities, Futures & Options",
      marquee_label:"The Capital Group",
      marquee_items:["Capital Securities","Capital Futures","Capital Fund","Capital Agency","Capital Shanghai","Capital HK"],
      svc_label:"Services", svc_title:"Comprehensive Trading Services",
      svc_desc:"Diversified financial products and professional services for individual and institutional investors, covering HK stocks, A-shares, futures and options.",
      svc1_label:"Securities", svc1_title:"HK & Global Equities<br/>Trading",
      svc1_desc:"Trade HK and global equities easily via iTrader platform, with fast execution and competitive commission rates.",
      svc1_f1:"iTrader Platform", svc1_f1s:"Fast order execution & real-time quotes",
      svc1_f2:"Competitive Commission", svc1_f2s:"As low as 0.15% commission",
      svc1_f3:"IPO Subscription", svc1_f3s:"Participate in new listings",
      svc1_f4:"Global Markets", svc1_f4s:"HK stocks & overseas markets",
      svc1_vis:"Securities", svc1_vis_s:"HK \u00b7 US \u00b7 IPO",
      svc2_label:"SH-HK Connect", svc2_title:"Shanghai-HK<br/>Stock Connect",
      svc2_desc:"Trade Shanghai A-shares directly via Stock Connect. Access professional A-share research reports and market publications.",
      svc2_f1:"Trade A-Shares", svc2_f1s:"Via Stock Connect",
      svc2_f2:"Research Reports", svc2_f2s:"Professional analysis",
      svc2_f3:"Monthly Publication", svc2_f3s:"Regular market updates",
      svc2_f4:"Connect Guide", svc2_f4s:"System rules explained",
      svc2_vis:"SH-HK Connect", svc2_vis_s:"Trade Shanghai A-Shares",
      svc3_label:"Futures & Options", svc3_title:"Futures & Options<br/>Trading",
      svc3_desc:"Trade HSI futures, options and global commodities via Sharp Point professional platform, with real-time data and risk management tools.",
      svc3_f1:"Sharp Point", svc3_f1s:"Professional futures platform",
      svc3_f2:"Risk Management", svc3_f2s:"Real-time monitoring",
      svc3_f3:"After-Hours Trading", svc3_f3s:"24-hour opportunities",
      svc3_f4:"Global Futures", svc3_f4s:"Indices, commodities & FX",
      svc3_vis:"Futures & Options", svc3_vis_s:"HSI Futures \u00b7 Commodities",
      stat1:"30+", stat1l:"Years in Financial Services", stat2:"SFC", stat2l:"Regulated by SFC",
      stat3:"24/7", stat3l:"Customer Support", stat4:"Multi-Market", stat4l:"HK, A-Shares, Futures",
      news_label:"What's New", news_title:"News & Research", news_all:"View All",
      cta_h:"Open an Account<br/>Seize Opportunities",
      cta_p:"Open a Capital Securities account in just a few simple steps. Enjoy professional trading services, daily research reports and competitive commission rates.",
      cta_btn1:"Securities Account", cta_btn2:"Futures Account",
      cta_s1:"Download Agreement", cta_s2:"Submit Documents", cta_s3:"Account Approved", cta_s4:"Start Trading",
      ft_svc:"Trading Services", ft_news:"News & Research", ft_acct:"Account & Support", ft_legal:"Legal",
      ft_addr:"Capital Securities (HK) Limited<br/>3/F, FWD Financial Centre, 308 Des Voeux Road Central, HK<br/>TEL: (852) 2530-9966<br/>FAX: (852) 2104-6006",
      ft_copy:"\u00a9 The Capital Group. All Rights Reserved.",
      admin_title:"CMS Admin", admin_save:"Save", admin_export:"Export JSON", admin_import:"Import JSON", admin_reset:"Reset Default"
    }
  };
