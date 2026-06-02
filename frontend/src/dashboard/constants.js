export const DEFAULT_GROUPS = [
  { id: 'g_google',    name: 'Google',    color: '#5b7fff' },
  { id: 'g_microsoft', name: 'Microsoft', color: '#38bdf8' },
  { id: 'g_tools',     name: 'Tools',     color: '#a78bfa' },
]

export const DEFAULT_APPS = [
  // Google — real gstatic brand icons
  { id:'gmail',     name:'Gmail',           url:'https://mail.google.com',      groupId:'g_google',    emoji:null, favicon:'https://www.gstatic.com/images/branding/product/1x/gmail_48dp.png',              shortcut:'' },
  { id:'gdocs',     name:'Google Docs',     url:'https://docs.google.com',      groupId:'g_google',    emoji:null, favicon:'https://www.gstatic.com/images/branding/product/1x/docs_48dp.png',              shortcut:'' },
  { id:'gdrive',    name:'Google Drive',    url:'https://drive.google.com',     groupId:'g_google',    emoji:null, favicon:'https://www.gstatic.com/images/branding/product/1x/drive_48dp.png',             shortcut:'' },
  { id:'gkeep',     name:'Google Keep',     url:'https://keep.google.com',      groupId:'g_google',    emoji:null, favicon:'https://www.gstatic.com/images/branding/product/1x/keep_48dp.png',              shortcut:'' },
  { id:'gcal',      name:'Google Calendar', url:'https://calendar.google.com',  groupId:'g_google',    emoji:null, favicon:'https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png',          shortcut:'' },
  // Microsoft
  { id:'outlook',   name:'Outlook',         url:'https://outlook.live.com',     groupId:'g_microsoft', emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=outlook.live.com',              shortcut:'' },
  { id:'m365',      name:'Microsoft 365',   url:'https://www.microsoft365.com', groupId:'g_microsoft', emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=microsoft365.com',              shortcut:'' },
  { id:'onedrive',  name:'OneDrive',        url:'https://onedrive.live.com',    groupId:'g_microsoft', emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=onedrive.live.com',             shortcut:'' },
  // Tools
  { id:'notion',    name:'Notion',          url:'https://www.notion.so',        groupId:'g_tools',     emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=notion.so',                    shortcut:'' },
  { id:'trello',    name:'Trello',          url:'https://trello.com',           groupId:'g_tools',     emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=trello.com',                   shortcut:'' },
  { id:'slack',     name:'Slack',           url:'https://app.slack.com',        groupId:'g_tools',     emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=slack.com',                    shortcut:'' },
  { id:'chatgpt',   name:'ChatGPT',         url:'https://chat.openai.com',      groupId:'g_tools',     emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=openai.com',                   shortcut:'' },
]

export const GROUP_COLORS = ['#5b7fff','#a78bfa','#3ddcaa','#f5a623','#ff5b6e','#f472b6','#38bdf8','#fb923c','#a3e635','#e2e8f0']

export const EMOJI_LIST = ['📧','📅','📁','📝','🗒️','📊','📈','💬','🔔','⭐','🚀','💡','🔧','🎯','📌','🏠','🌐','🔍','💼','🎨','🛠️','📦','🔒','⚡','🧩','🤖','📱','🖥️','🗂️','✅','🔖','💎','🌟','🎪','🧠','🦊','🐙','🌈','🔥','❄️','🎵','🎬','🏆','💰','🌍','🧪','🎮','🛡️','🏗️','🧬','🎓','🛒','📡','🔭','🧲','🪄','🧩','💻','🗺️','🧭']

export const CATEGORY_COLORS = {
  general: '#5b7fff', sports: '#3ddcaa', tech: '#a78bfa',
  business: '#f5a623', science: '#38bdf8', entertainment: '#f472b6',
}

export const DEFAULT_NEWS_SOURCES = [
  { id:'bbc',       name:'BBC News',    url:'https://feeds.bbci.co.uk/news/rss.xml',                             category:'general', color:'#5b7fff', enabled:true },
  { id:'guardian',  name:'The Guardian',url:'https://www.theguardian.com/world/rss',                             category:'general', color:'#ff5b6e', enabled:true },
  { id:'aljazeera', name:'Al Jazeera',  url:'https://www.aljazeera.com/xml/rss/all.xml',                        category:'general', color:'#f5a623', enabled:true },
  { id:'techcrunch',name:'TechCrunch',  url:'https://techcrunch.com/feed/',                                      category:'tech',    color:'#a78bfa', enabled:true },
  { id:'hn',        name:'Hacker News', url:'https://news.ycombinator.com/rss',                                  category:'tech',    color:'#38bdf8', enabled:true },
  { id:'nyt',       name:'NY Times',    url:'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',         category:'general', color:'#3ddcaa', enabled:true },
]

export const RSS_PRESETS = [
  // ── World News ────────────────────────────────────────────────────────────
  { group:'World News',     name:'BBC News',         url:'https://feeds.bbci.co.uk/news/rss.xml',                                       category:'general' },
  { group:'World News',     name:'Reuters',          url:'https://feeds.reuters.com/reuters/topNews',                                   category:'general' },
  { group:'World News',     name:'AP News',          url:'https://rsshub.app/apnews/topics/apf-topnews',                               category:'general' },
  { group:'World News',     name:'Al Jazeera',       url:'https://www.aljazeera.com/xml/rss/all.xml',                                  category:'general' },
  { group:'World News',     name:'The Guardian',     url:'https://www.theguardian.com/world/rss',                                      category:'general' },
  { group:'World News',     name:'DW News',          url:'https://rss.dw.com/rdf/rss-en-all',                                          category:'general' },
  { group:'World News',     name:'France 24',        url:'https://www.france24.com/en/rss',                                            category:'general' },
  { group:'World News',     name:'Euronews',         url:'https://feeds.feedburner.com/euronews/en/home/',                             category:'general' },

  // ── Newspapers ───────────────────────────────────────────────────────────
  { group:'Newspapers',     name:'NY Times',         url:'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',                  category:'general' },
  { group:'Newspapers',     name:'Washington Post',  url:'https://feeds.washingtonpost.com/rss/world',                                 category:'general' },
  { group:'Newspapers',     name:'The Independent',  url:'https://www.independent.co.uk/news/rss',                                     category:'general' },
  { group:'Newspapers',     name:'The Telegraph',    url:'https://www.telegraph.co.uk/news/rss.xml',                                   category:'general' },
  { group:'Newspapers',     name:'Le Monde',         url:'https://www.lemonde.fr/rss/une.xml',                                         category:'general' },
  { group:'Newspapers',     name:'El País',          url:'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada',           category:'general' },
  { group:'Newspapers',     name:'Der Spiegel',      url:'https://www.spiegel.de/international/index.rss',                             category:'general' },
  { group:'Newspapers',     name:'The Times',        url:'https://www.thetimes.co.uk/rss/world',                                       category:'general' },

  // ── Tech News ────────────────────────────────────────────────────────────
  { group:'Tech News',      name:'TechCrunch',       url:'https://techcrunch.com/feed/',                                               category:'tech'    },
  { group:'Tech News',      name:'Hacker News',      url:'https://news.ycombinator.com/rss',                                          category:'tech'    },
  { group:'Tech News',      name:'The Verge',        url:'https://www.theverge.com/rss/index.xml',                                     category:'tech'    },
  { group:'Tech News',      name:'Ars Technica',     url:'https://feeds.arstechnica.com/arstechnica/index',                            category:'tech'    },
  { group:'Tech News',      name:'Engadget',         url:'https://www.engadget.com/rss.xml',                                           category:'tech'    },
  { group:'Tech News',      name:'WIRED',            url:'https://www.wired.com/feed/rss',                                             category:'tech'    },
  { group:'Tech News',      name:'MIT Tech Review',  url:'https://www.technologyreview.com/topnews.rss',                               category:'tech'    },
  { group:'Tech News',      name:'ZDNet',            url:'https://www.zdnet.com/news/rss.xml',                                         category:'tech'    },
  { group:'Tech News',      name:'9to5Mac',          url:'https://9to5mac.com/feed/',                                                  category:'tech'    },
  { group:'Tech News',      name:'Android Authority',url:'https://www.androidauthority.com/feed/',                                     category:'tech'    },

  // ── Tech Magazines ───────────────────────────────────────────────────────
  { group:'Tech Magazines', name:'IEEE Spectrum',    url:'https://spectrum.ieee.org/rss/fulltext',                                     category:'tech'    },
  { group:'Tech Magazines', name:'Slashdot',         url:'http://rss.slashdot.org/Slashdot/slashdotMain',                             category:'tech'    },
  { group:'Tech Magazines', name:'InfoQ',            url:'https://feed.infoq.com/',                                                    category:'tech'    },
  { group:'Tech Magazines', name:'Dev.to',           url:'https://dev.to/feed',                                                        category:'tech'    },
  { group:'Tech Magazines', name:'Smashing Magazine',url:'https://www.smashingmagazine.com/feed/',                                    category:'tech'    },
  { group:'Tech Magazines', name:'CSS-Tricks',       url:'https://css-tricks.com/feed/',                                               category:'tech'    },
  { group:'Tech Magazines', name:'A List Apart',     url:'https://alistapart.com/main/feed/',                                          category:'tech'    },
  { group:'Tech Magazines', name:'GitHub Blog',      url:'https://github.blog/feed/',                                                  category:'tech'    },

  // ── Business & Finance ───────────────────────────────────────────────────
  { group:'Business',       name:'Bloomberg',        url:'https://feeds.bloomberg.com/markets/news.rss',                               category:'business'},
  { group:'Business',       name:'Financial Times',  url:'https://www.ft.com/?format=rss',                                             category:'business'},
  { group:'Business',       name:'Forbes',           url:'https://www.forbes.com/real-time/feed2/',                                    category:'business'},
  { group:'Business',       name:'Business Insider', url:'https://feeds.businessinsider.com/custom/all',                               category:'business'},
  { group:'Business',       name:'Economist',        url:'https://www.economist.com/business/rss.xml',                                 category:'business'},
  { group:'Business',       name:'CNBC',             url:'https://www.cnbc.com/id/100003114/device/rss/rss.html',                      category:'business'},

  // ── Science ──────────────────────────────────────────────────────────────
  { group:'Science',        name:'NASA',             url:'https://www.nasa.gov/rss/dyn/breaking_news.rss',                             category:'science' },
  { group:'Science',        name:'Science Daily',    url:'https://www.sciencedaily.com/rss/all.xml',                                   category:'science' },
  { group:'Science',        name:'New Scientist',    url:'https://www.newscientist.com/feed/home/',                                    category:'science' },
  { group:'Science',        name:'Nature',           url:'https://www.nature.com/nature.rss',                                          category:'science' },
  { group:'Science',        name:'Scientific American',url:'http://rss.sciam.com/ScientificAmerican-Global',                           category:'science' },

  // ── World Soccer ─────────────────────────────────────────────────────────
  { group:'World Soccer',   name:'BBC Sport Football',url:'https://feeds.bbci.co.uk/sport/football/rss.xml',                          category:'sports'  },
  { group:'World Soccer',   name:'Sky Sports Football',url:'https://www.skysports.com/rss/12040',                                     category:'sports'  },
  { group:'World Soccer',   name:'UEFA',              url:'https://www.uefa.com/rssfeed/index/type/1/id/52.rss',                       category:'sports'  },
  { group:'World Soccer',   name:'ESPN FC',           url:'https://www.espn.com/espn/rss/soccer/news',                                 category:'sports'  },
  { group:'World Soccer',   name:'The Athletic',      url:'https://theathletic.com/rss-feed/',                                         category:'sports'  },
  { group:'World Soccer',   name:'90min',             url:'https://www.90min.com/feed',                                                category:'sports'  },
  { group:'World Soccer',   name:"L'Équipe",          url:'https://www.lequipe.fr/rss/actu_rss.xml',                                   category:'sports'  },
  { group:'World Soccer',   name:'Marca',             url:'https://www.marca.com/rss/portada.xml',                                     category:'sports'  },
  { group:'World Soccer',   name:'AS',                url:'https://as.com/rss/tags/soccer.xml',                                        category:'sports'  },
  { group:'World Soccer',   name:'Goal.com',          url:'https://www.goal.com/feeds/en/news',                                        category:'sports'  },

  // ── Entertainment ────────────────────────────────────────────────────────
  { group:'Entertainment',  name:'Variety',          url:'https://variety.com/feed/',                                                  category:'entertainment'},
  { group:'Entertainment',  name:'Hollywood Reporter',url:'https://www.hollywoodreporter.com/feed/',                                  category:'entertainment'},
  { group:'Entertainment',  name:'Rolling Stone',    url:'https://www.rollingstone.com/feed/',                                        category:'entertainment'},
]
