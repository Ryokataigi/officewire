let activeRegion = "all";
let currentLang = localStorage.getItem("officewire_lang") || detectBrowserLang();
let favorites = JSON.parse(localStorage.getItem("officewire_favs") || "[]");

function detectBrowserLang() {
  const nav = (navigator.language || DEFAULT_LANG).slice(0, 2);
  return LANGUAGES.some((l) => l.id === nav) ? nav : DEFAULT_LANG;
}

// Returns the article's title/bullets in currentLang, falling back to English
// if that language hasn't been translated for this article yet.
function getLocalized(article) {
  return article.i18n[currentLang] || article.i18n[DEFAULT_LANG];
}

function categoryMeta(id) {
  return CATEGORIES.find((c) => c.id === id);
}

function groupByDate(articles) {
  const groups = {};
  articles.forEach((a) => {
    if (!groups[a.date]) groups[a.date] = [];
    groups[a.date].push(a);
  });
  return Object.entries(groups).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const days = t(currentLang, "days");
  return currentLang === "ja"
    ? `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`
    : currentLang === "zh"
    ? `${d.getMonth() + 1}月${d.getDate()}日 ${days[d.getDay()]}`
    : `${days[d.getDay()]}, ${d.toLocaleString(currentLang, { month: "short" })} ${d.getDate()}`;
}

function renderStaticText() {
  document.getElementById("hero-title").textContent = t(currentLang, "heroTitle");
  document.getElementById("hero-subtitle").textContent = t(currentLang, "heroSubtitle");
  document.getElementById("categories-heading").textContent = t(currentLang, "categories");
  document.getElementById("footer-text").textContent = t(currentLang, "footer");
  document.getElementById("mode-toggle").textContent =
    document.documentElement.dataset.mode === "dark" ? t(currentLang, "lightMode") : t(currentLang, "darkMode");
  document.documentElement.lang = currentLang;
}

function renderLangSwitcher() {
  const el = document.getElementById("lang-switcher");
  el.innerHTML = LANGUAGES.map(
    (l) => `<option value="${l.id}" ${l.id === currentLang ? "selected" : ""}>${l.label}</option>`
  ).join("");
  el.addEventListener("change", () => {
    currentLang = el.value;
    localStorage.setItem("officewire_lang", currentLang);
    renderAll();
  });
}

function renderTabs() {
  const el = document.getElementById("tabs");
  const regionLabels = t(currentLang, "regions");
  el.innerHTML = REGIONS.map(
    (r) => `<button class="tab ${r === activeRegion ? "active" : ""}" data-region="${r}">${regionLabels[r]}</button>`
  ).join("");
  el.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeRegion = btn.dataset.region;
      renderTabs();
      renderFeed();
    });
  });
}

function renderFeed() {
  const feed = document.getElementById("feed");
  const filtered = ARTICLES.filter((a) => activeRegion === "all" || a.region === activeRegion);
  const grouped = groupByDate(filtered);
  const categoryLabels = t(currentLang, "categoryLabels");

  if (grouped.length === 0) {
    feed.innerHTML = `<p style="color:var(--ink-faint);font-size:14px;">${t(currentLang, "noArticles")}</p>`;
    return;
  }

  feed.innerHTML = grouped
    .map(([date, articles]) => {
      const items = articles
        .map((a) => {
          const cat = categoryMeta(a.category);
          const isFav = favorites.includes(a.id);
          const localized = getLocalized(a);
          return `
          <div class="article">
            <div class="article-meta">
              <span class="tag ${cat.color}">${categoryLabels[a.category]}</span>
              <span class="source">${a.source}</span>
            </div>
            <h3><a href="${a.url}" target="_blank" rel="noopener">${localized.title}</a></h3>
            <ul>${localized.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
            <div class="article-actions">
              <button data-fav="${a.id}" class="${isFav ? "active" : ""}">
                ${isFav ? "★ " + t(currentLang, "saved") : "☆ " + t(currentLang, "save")}
              </button>
              <a href="${a.url}" target="_blank" rel="noopener">${t(currentLang, "readOriginal")}</a>
            </div>
          </div>`;
        })
        .join("");
      return `
        <div class="day-group">
          <div class="day-label">${formatDateLabel(date)}</div>
          ${items}
        </div>`;
    })
    .join("");

  feed.querySelectorAll("[data-fav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.fav;
      if (favorites.includes(id)) {
        favorites = favorites.filter((f) => f !== id);
      } else {
        favorites.push(id);
      }
      localStorage.setItem("officewire_favs", JSON.stringify(favorites));
      renderFeed();
    });
  });
}

function renderCategories() {
  const el = document.getElementById("category-list");
  const labels = t(currentLang, "categoryLabels");
  const descriptions = t(currentLang, "categoryDescriptions");
  el.innerHTML = CATEGORIES.map(
    (c) => `
    <div class="category-item">
      <span class="tag ${c.color}">${labels[c.id]}</span>
      <p>${descriptions[c.id]}</p>
    </div>`
  ).join("");
}

function updateClocks() {
  const cities = t(currentLang, "cities");
  const zones = [
    { id: "tokyo", tz: "Asia/Tokyo" },
    { id: "london", tz: "Europe/London" },
    { id: "newyork", tz: "America/New_York" },
    { id: "singapore", tz: "Asia/Singapore" },
  ];
  const el = document.getElementById("clock-strip");
  el.innerHTML = zones
    .map((z) => {
      const time = new Intl.DateTimeFormat(currentLang, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: z.tz,
      }).format(new Date());
      return `<div class="clock-item"><div class="city">${cities[z.id]}</div><div class="time">${time}</div></div>`;
    })
    .join("");
}

function initDarkMode() {
  const btn = document.getElementById("mode-toggle");
  const stored = localStorage.getItem("officewire_mode");
  if (stored === "dark") document.documentElement.dataset.mode = "dark";
  btn.addEventListener("click", () => {
    const isDark = document.documentElement.dataset.mode === "dark";
    document.documentElement.dataset.mode = isDark ? "light" : "dark";
    localStorage.setItem("officewire_mode", isDark ? "light" : "dark");
    renderStaticText();
  });
}

function renderToday() {
  const days = t(currentLang, "days");
  const now = new Date();
  document.getElementById("today").textContent =
    currentLang === "ja" || currentLang === "zh"
      ? `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()} (${days[now.getDay()]})`
      : `${days[now.getDay()]}, ${now.toLocaleString(currentLang, { month: "short" })} ${now.getDate()}, ${now.getFullYear()}`;
}

function renderAll() {
  renderStaticText();
  renderToday();
  renderTabs();
  renderFeed();
  renderCategories();
  updateClocks();
}

renderLangSwitcher();
renderAll();
setInterval(updateClocks, 30000);
initDarkMode();
