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
    categoryLabels: { design: "Office Design", work: "Way of Work", estate: "Real Estate", culture: "Culture" },
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
    categoryLabels: { design: "オフィスデザイン", work: "働き方", estate: "不動産", culture: "企業文化" },
    categoryDescriptions: {
      design: "世界のオフィス空間トレンド",
      work: "リモート・ハイブリッド動向",
      estate: "オフィス賃料・空室率",
      culture: "HR・組織づくりニュース",
    },
    cities: { tokyo: "東京", london: "ロンドン", newyork: "ニューヨーク", singapore: "シンガポール" },
    days: ["日", "月", "火", "水", "木", "金", "土"],
  },
};

function t(lang, key) {
  const dict = I18N[lang] || I18N[DEFAULT_LANG];
  return dict[key] !== undefined ? dict[key] : I18N[DEFAULT_LANG][key];
}
