const REGIONS = ["all", "na", "eu", "asia"];

const CATEGORIES = [
  { id: "design", color: "teal" },
  { id: "work", color: "amber" },
  { id: "estate", color: "blue" },
  { id: "culture", color: "coral" },
];

// Each article stores title/bullets per language. If a language is missing,
// the UI automatically falls back to English (see getLocalized() in script.js).
const ARTICLES = [
  {
    id: "a1",
    date: "2026-08-01",
    region: "na",
    category: "estate",
    source: "WeWork News",
    url: "#",
    i18n: {
      en: {
        title: "Office return-to-work hits record occupancy in major cities",
        bullets: [
          "Office occupancy in New York, Chicago and other hubs reaches its highest level since the pandemic",
          "More companies now require 4+ days in office per week",
          "Demand for flexible office space is growing at the same time",
        ],
      },
      ja: {
        title: "オフィス出社回帰、主要都市で稼働率が過去最高に",
        bullets: [
          "ニューヨーク・シカゴなどでオフィス稼働率がパンデミック後最高水準に到達",
          "週4日以上の出社を義務化する企業が増加傾向",
          "フレックス型オフィス需要も同時に拡大中",
        ],
      },
    },
  },
  {
    id: "a2",
    date: "2026-08-01",
    region: "asia",
    category: "estate",
    source: "JLL Japan",
    url: "#",
    i18n: {
      en: {
        title: "Tokyo office vacancy rate hits three-year low",
        bullets: [
          "Vacancy in central Tokyo's five wards falls into the low-3% range",
          "Demand for large-scale relocations remains strong",
          "Rents continue a gradual upward trend",
        ],
      },
      ja: {
        title: "東京オフィス空室率が3年ぶり低水準に",
        bullets: [
          "都心5区の空室率が3%台前半まで低下",
          "大型移転需要が引き続き堅調",
          "賃料は緩やかな上昇基調が継続",
        ],
      },
    },
  },
  {
    id: "a3",
    date: "2026-08-01",
    region: "eu",
    category: "work",
    source: "Fast Company",
    url: "#",
    i18n: {
      en: {
        title: "London mid-size firm rolls out permanent four-day week",
        bullets: [
          "A one-year trial confirmed productivity held steady",
          "Employee turnover improved sharply year over year",
          "Other industries are now watching closely",
        ],
      },
      ja: {
        title: "4日勤務制トライアル、ロンドンの中堅企業で本格導入へ",
        bullets: [
          "1年間の試験導入を経て生産性維持を確認",
          "離職率が前年比で大きく改善",
          "他業種への波及も注目されている",
        ],
      },
    },
  },
  {
    id: "a4",
    date: "2026-07-31",
    region: "na",
    category: "design",
    source: "Dezeen",
    url: "#",
    i18n: {
      en: {
        title: "Silicon Valley firms redesign offices around \"focus zones\"",
        bullets: [
          "Open-plan floors are giving way to semi-enclosed work pods",
          "Spending on acoustic design is up sharply year over year",
          "More companies treat space investment as a recruiting tool",
        ],
      },
      ja: {
        title: "シリコンバレー企業、オフィス再設計で「集中ゾーン」重視へ",
        bullets: [
          "オープンフロアから半個室スペースへの回帰が加速",
          "音響設計への投資が前年比で大幅増",
          "採用競争力の一環として空間投資を位置づける企業が増加",
        ],
      },
    },
  },
  {
    id: "a5",
    date: "2026-07-31",
    region: "asia",
    category: "culture",
    source: "Nikkei Asia",
    url: "#",
    i18n: {
      en: {
        title: "Singapore firms formalize a company-wide \"no meeting day\"",
        bullets: [
          "Policy adopted company-wide to protect focused work time",
          "Employee satisfaction surveys show strong approval",
          "Other major Asian business hubs are following suit",
        ],
      },
      ja: {
        title: "シンガポール企業、週1日の「ノー会議デー」を制度化",
        bullets: [
          "集中作業時間の確保を目的に制度を全社導入",
          "導入企業の従業員満足度調査で高評価",
          "他のアジア主要都市の企業も追随する動き",
        ],
      },
    },
  },
  {
    id: "a6",
    date: "2026-07-31",
    region: "eu",
    category: "estate",
    source: "CBRE Europe",
    url: "#",
    i18n: {
      en: {
        title: "Paris green-certified offices command a widening rent premium",
        bullets: [
          "Certified green buildings rent for 15% more than uncertified stock",
          "Demand is led by tenants with ESG mandates",
          "Retrofit demand for older buildings is rising in parallel",
        ],
      },
      ja: {
        title: "パリ、グリーンビルディング認証オフィスの賃料プレミアムが拡大",
        bullets: [
          "環境認証取得オフィスの賃料が非認証比で15%高",
          "ESG方針を持つテナントの移転需要が牽引",
          "旧世代ビルの改修需要も同時に増加",
        ],
      },
    },
  },
];
