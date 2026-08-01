// Supported languages. Add a new entry here (with a matching I18N block below)
// to make it selectable in the UI — e.g. { id: "es", label: "Español" }.
const LANGUAGES = [
  { id: "ja", label: "日本語" },
  { id: "en", label: "English" },
];

const DEFAULT_LANG = "ja";

const I18N = {
  en: {
    tagline: "Global workplace news, every day, in three lines.",
    heroTitle: "Global Workplace News",
    heroSubtitle: "Daily 3-line briefings on offices, hybrid work, real estate, and company culture — from around the world.",
    categories: "Categories",
    save: "Save",
    saved: "Saved",
    readOriginal: "Read original →",
    noArticles: "No news for this region yet.",
    loading: "Loading the latest news…",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    footer: "OfficeWire — Global workplace news, every day.",
    regions: { all: "All", global: "Global", na: "North America", eu: "Europe", asia: "Asia" },
    categoryLabels: {
      design: "Office Design",
      work: "Way of Work",
      estate: "Real Estate",
      culture: "Culture",
    },
    categoryDescriptions: {
      design: "Global office space trends",
      work: "Remote & hybrid work shifts",
      estate: "Office rent & vacancy trends",
      culture: "HR & organizational news",
    },
    cities: { tokyo: "Tokyo", london: "London", newyork: "New York", singapore: "Singapore" },
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  ja: {
    tagline: "世界のオフィスニュースを毎日3行で。",
    heroTitle: "世界のオフィスニュース",
    heroSubtitle: "世界中のワークプレイス動向を毎日3行要約でお届け。オフィスデザイン、働き方、不動産、企業文化のいま。",
    categories: "カテゴリー",
    save: "保存",
    saved: "保存済み",
    readOriginal: "原文を見る →",
    noArticles: "この地域のニュースはまだありません。",
    loading: "最新ニュースを読み込み中…",
    darkMode: "ダークモード",
    lightMode: "ライトモード",
    footer: "OfficeWire — 世界のオフィス・ワークプレイスニュースを毎日配信",
    regions: { all: "すべて", global: "グローバル", na: "北米", eu: "欧州", asia: "アジア" },
    categoryLabels: {
      design: "オフィスデザイン",
      work: "働き方",
      estate: "不動産",
      culture: "企業文化",
    },
    categoryDescriptions: {
      design: "世界のオフィス空間トレンド",
      work: "リモート・ハイブリッド動向",
      estate: "オフィス賃料・空室率",
      culture: "HR・組織づくりニュース",
    },
    cities: { tokyo: "東京", london: "ロンドン", newyork: "ニューヨーク", singapore: "シンガポール" },
    days: ["日", "月", "火", "水", "木", "金", "土"],
  },
  es: {
    tagline: "Noticias globales de oficinas, cada día, en tres líneas.",
    heroTitle: "Noticias Globales de Oficinas",
    heroSubtitle: "Resúmenes diarios de 3 líneas sobre oficinas, trabajo híbrido, bienes raíces y cultura empresarial de todo el mundo.",
    categories: "Categorías",
    save: "Guardar",
    saved: "Guardado",
    readOriginal: "Leer original →",
    noArticles: "Todavía no hay noticias para esta región.",
    darkMode: "Modo oscuro",
    lightMode: "Modo claro",
    footer: "OfficeWire — Noticias globales de oficinas, cada día.",
    regions: { all: "Todos", na: "Norteamérica", eu: "Europa", asia: "Asia" },
    categoryLabels: {
      design: "Diseño de oficinas",
      work: "Formas de trabajo",
      estate: "Bienes raíces",
      culture: "Cultura",
    },
    categoryDescriptions: {
      design: "Tendencias globales de espacios",
      work: "Cambios en trabajo remoto/híbrido",
      estate: "Renta y vacancia de oficinas",
      culture: "Noticias de RRHH y organización",
    },
    cities: { tokyo: "Tokio", london: "Londres", newyork: "Nueva York", singapore: "Singapur" },
    days: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  },
  zh: {
    tagline: "每日三行，速览全球办公室新闻。",
    heroTitle: "全球办公室新闻",
    heroSubtitle: "每日三行简报，涵盖全球办公室设计、混合办公、房地产与企业文化动态。",
    categories: "分类",
    save: "收藏",
    saved: "已收藏",
    readOriginal: "查看原文 →",
    noArticles: "该地区暂无新闻。",
    darkMode: "深色模式",
    lightMode: "浅色模式",
    footer: "OfficeWire — 每日推送全球办公室新闻。",
    regions: { all: "全部", na: "北美", eu: "欧洲", asia: "亚洲" },
    categoryLabels: {
      design: "办公室设计",
      work: "工作方式",
      estate: "房地产",
      culture: "企业文化",
    },
    categoryDescriptions: {
      design: "全球办公空间趋势",
      work: "远程与混合办公动态",
      estate: "办公室租金与空置率",
      culture: "人力资源与组织动态",
    },
    cities: { tokyo: "东京", london: "伦敦", newyork: "纽约", singapore: "新加坡" },
    days: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
  },
};

function t(lang, key) {
  const dict = I18N[lang] || I18N[DEFAULT_LANG];
  return dict[key] !== undefined ? dict[key] : I18N[DEFAULT_LANG][key];
}
