export const DEFAULT_GROUPS = [
  { id: 'g_google',    name: 'Google',    color: '#5b7fff' },
  { id: 'g_microsoft', name: 'Microsoft', color: '#38bdf8' },
  { id: 'g_tools',     name: 'Tools',     color: '#a78bfa' },
]

export const DEFAULT_APPS = [
  { id:'gmail',     name:'Gmail',           url:'https://mail.google.com',      groupId:'g_google',    emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=mail.google.com',     shortcut:'' },
  { id:'gdocs',     name:'Google Docs',     url:'https://docs.google.com',      groupId:'g_google',    emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=docs.google.com',     shortcut:'' },
  { id:'gdrive',    name:'Google Drive',    url:'https://drive.google.com',     groupId:'g_google',    emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=drive.google.com',    shortcut:'' },
  { id:'gkeep',     name:'Google Keep',     url:'https://keep.google.com',      groupId:'g_google',    emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=keep.google.com',     shortcut:'' },
  { id:'gcal',      name:'Google Calendar', url:'https://calendar.google.com',  groupId:'g_google',    emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=calendar.google.com', shortcut:'' },
  { id:'outlook',   name:'Outlook',         url:'https://outlook.live.com',     groupId:'g_microsoft', emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=outlook.live.com',   shortcut:'' },
  { id:'m365',      name:'Microsoft 365',   url:'https://www.microsoft365.com', groupId:'g_microsoft', emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=microsoft365.com',   shortcut:'' },
  { id:'onedrive',  name:'OneDrive',        url:'https://onedrive.live.com',    groupId:'g_microsoft', emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=onedrive.live.com',  shortcut:'' },
  { id:'notion',    name:'Notion',          url:'https://www.notion.so',        groupId:'g_tools',     emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=notion.so',          shortcut:'' },
  { id:'trello',    name:'Trello',          url:'https://trello.com',           groupId:'g_tools',     emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=trello.com',         shortcut:'' },
  { id:'slack',     name:'Slack',           url:'https://app.slack.com',        groupId:'g_tools',     emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=slack.com',          shortcut:'' },
  { id:'chatgpt',   name:'ChatGPT',         url:'https://chat.openai.com',      groupId:'g_tools',     emoji:null, favicon:'https://www.google.com/s2/favicons?sz=64&domain=openai.com',         shortcut:'' },
]

export const GROUP_COLORS = ['#5b7fff','#a78bfa','#3ddcaa','#f5a623','#ff5b6e','#f472b6','#38bdf8','#fb923c','#a3e635','#e2e8f0']

export const EMOJI_LIST = ['📧','📅','📁','📝','🗒️','📊','📈','💬','🔔','⭐','🚀','💡','🔧','🎯','📌','🏠','🌐','🔍','💼','🎨','🛠️','📦','🔒','⚡','🧩','🤖','📱','🖥️','🗂️','✅','🔖','💎','🌟','🎪','🧠','🦊','🐙','🌈','🔥','❄️','🎵','🎬','🏆','💰','🌍','🧪','🎮','🛡️','🏗️','🧬','🎓','🛒','📡','🔭','🧲','🪄','🧩','💻','🗺️','🧭']

export const CATEGORY_COLORS = {
  general: '#5b7fff', sports: '#3ddcaa', tech: '#a78bfa',
  business: '#f5a623', science: '#38bdf8', entertainment: '#f472b6',
}

export const DEFAULT_NEWS_SOURCES = [
  { id:'cnn',       name:'CNN',         url:'https://rss.cnn.com/rss/edition.rss',                        category:'general', color:'#ff5b6e', enabled:true },
  { id:'bbc',       name:'BBC News',    url:'https://feeds.bbci.co.uk/news/rss.xml',                      category:'general', color:'#5b7fff', enabled:true },
  { id:'espn',      name:'ESPN Sports', url:'https://www.espn.com/espn/rss/news',                         category:'sports',  color:'#3ddcaa', enabled:true },
  { id:'marca',     name:'Marca (ES)',  url:'https://e00-marca.uecdn.es/rss/portada.xml',                 category:'sports',  color:'#f5a623', enabled:true },
  { id:'techcrunch',name:'TechCrunch', url:'https://techcrunch.com/feed/',                                category:'tech',    color:'#a78bfa', enabled:true },
  { id:'reuters',   name:'Reuters',    url:'https://feeds.reuters.com/reuters/topNews',                   category:'general', color:'#38bdf8', enabled:true },
]

export const RSS_PRESETS = [
  { name:'Al Jazeera',    url:'https://www.aljazeera.com/xml/rss/all.xml',                            category:'general' },
  { name:'NASA',          url:'https://www.nasa.gov/rss/dyn/breaking_news.rss',                        category:'science' },
  { name:'The Verge',     url:'https://www.theverge.com/rss/index.xml',                               category:'tech'    },
  { name:'NYT Top',       url:'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',            category:'general' },
  { name:'Hacker News',   url:'https://news.ycombinator.com/rss',                                     category:'tech'    },
  { name:"L'Équipe",      url:'https://www.lequipe.fr/rss/actu_rss.xml',                              category:'sports'  },
]
