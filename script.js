let activeRegion = "all";
let activeCategory = "all";
let currentLang = localStorage.getItem("officewire_lang") || detectBrowserLang();
let favorites = JSON.parse(localStorage.getItem("officewire_favs") || "[]");
let ARTICLES = null;

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
  if (currentLang === "ja") return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
  if (currentLang === "zh") return `${d.getMonth() + 1}月${d.getDate()}日 ${days[d.getDay()]}`;
  if (currentLang === "ko") return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  return `${days[d.getDay()]}, ${d.toLocaleString(currentLang, { month: "short" })} ${d.getDate()}`;
}

function renderStaticText() {
  document.getElementById("header-tagline").textContent = t(currentLang, "headerTagline");
  document.getElementById("categories-heading").textContent = t(currentLang, "categories");
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

function renderCategoryTabs() {
  const el = document.getElementById("category-tabs");
  const categoryLabels = t(currentLang, "categoryLabels");
  const allLabel = t(currentLang, "regions").all;
  const options = [{ id: "all", label: allLabel }, ...CATEGORIES.map((c) => ({ id: c.id, label: categoryLabels[c.id] }))];
  el.innerHTML = options
    .map(
      (o) =>
        `<button class="tab ${o.id === activeCategory ? "active" : ""}" data-category="${o.id}">${o.label}</button>`
    )
    .join("");
  el.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category;
      renderCategoryTabs();
      renderFeed();
    });
  });
}

function renderFeed() {
  const feed = document.getElementById("feed");

  if (ARTICLES === null) {
    feed.innerHTML = `<p style="color:var(--ink-faint);font-size:14px;">${t(currentLang, "loading")}</p>`;
    return;
  }

  const filtered = ARTICLES.filter(
    (a) =>
      (activeRegion === "all" || a.region === activeRegion) &&
      (activeCategory === "all" || a.category === activeCategory)
  );
  const grouped = groupByDate(filtered);
  const categoryLabels = t(currentLang, "categoryLabels");

  if (grouped.length === 0) {
    feed.innerHTML = `<p style="color:var(--ink-faint);font-size:14px;">${t(currentLang, "noArticles")}</p>`;
    return;
  }

  let articleIndex = -1;
  feed.innerHTML = grouped
    .map(([date, articles]) => {
      const items = articles
        .map((a) => {
          articleIndex += 1;
          const isFeatured = articleIndex === 0;
          const cat = categoryMeta(a.category);
          const isFav = favorites.includes(a.id);
          const localized = getLocalized(a);
          return `
          <div class="article ${isFeatured ? "featured" : ""}">
            ${a.image ? `<img class="article-thumb" src="${a.image}" alt="" loading="lazy" onerror="this.remove()">` : ""}
            <div class="article-meta">
              <span class="tag ${cat.color}">${categoryLabels[a.category]}</span>
              ${a.caseStudy ? `<span class="tag case-study-tag">${t(currentLang, "caseStudy")}</span>` : ""}
              <span class="source">${a.source}</span>
            </div>
            <h3><a href="${a.url}" target="_blank" rel="noopener">${localized.title}</a></h3>
            <ul>${localized.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
            ${localized.insight ? `<div class="insight"><span class="insight-label">${t(currentLang, "insightLabel")}</span>${localized.insight}</div>` : ""}
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

function renderTicker() {
  const el = document.getElementById("ticker-strip");
  if (!ARTICLES || ARTICLES.length === 0) {
    el.innerHTML = "";
    return;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recent = ARTICLES.filter((a) => new Date(a.date) >= sevenDaysAgo);

  const todayCount = ARTICLES.filter((a) => a.date === todayStr).length;
  const weekCount = recent.length;

  const countBy = (list, key) => {
    const counts = {};
    list.forEach((a) => {
      counts[a[key]] = (counts[a[key]] || 0) + 1;
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : null;
  };

  const topCategory = countBy(recent, "category");
  const topRegion = countBy(recent, "region");
  const categoryLabels = t(currentLang, "categoryLabels");
  const regionLabels = t(currentLang, "regions");

  const items = [
    { label: t(currentLang, "tickerToday"), value: `${todayCount}` },
    { label: t(currentLang, "ticker7d"), value: `${weekCount}` },
    { label: t(currentLang, "tickerTopCategory"), value: topCategory ? categoryLabels[topCategory] : "—" },
    { label: t(currentLang, "tickerTopRegion"), value: topRegion ? regionLabels[topRegion] : "—" },
  ];

  el.innerHTML = items
    .map((i) => `<div class="ticker-item"><div class="ticker-label">${i.label}</div><div class="ticker-value">${i.value}</div></div>`)
    .join("");
}

function renderFooter() {
  document.getElementById("footer-tagline").textContent = t(currentLang, "tagline");
  document.getElementById("footer-sources-heading").textContent = t(currentLang, "footerSourcesHeading");
  document.getElementById("footer-about-heading").textContent = t(currentLang, "footerAboutHeading");
  document.getElementById("footer-about-text").textContent = t(currentLang, "footerAboutText");
  document.getElementById("footer-copyright").textContent = t(currentLang, "footerCopyright").replace(
    "{year}",
    new Date().getFullYear()
  );

  const sourcesEl = document.getElementById("footer-sources");
  if (!ARTICLES || ARTICLES.length === 0) {
    sourcesEl.innerHTML = "";
    return;
  }
  const sources = [...new Set(ARTICLES.map((a) => a.source))].sort();
  sourcesEl.innerHTML = sources.map((s) => `<span class="footer-source-tag">${s}</span>`).join("");
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
      : currentLang === "ko"
      ? `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. (${days[now.getDay()]})`
      : `${days[now.getDay()]}, ${now.toLocaleString(currentLang, { month: "short" })} ${now.getDate()}, ${now.getFullYear()}`;
}

function renderAll() {
  renderStaticText();
  renderToday();
  renderTabs();
  renderCategoryTabs();
  renderFeed();
  renderCategories();
  renderTicker();
  renderFooter();
}

async function loadArticles() {
  try {
    const res = await fetch(ARTICLES_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    ARTICLES = await res.json();
  } catch (err) {
    console.error("Failed to load articles.json:", err);
    ARTICLES = [];
  }
  renderFeed();
  renderTicker();
  renderFooter();
}

renderLangSwitcher();
renderStaticText();
renderToday();
renderTabs();
renderCategoryTabs();
renderCategories();
renderFeed(); // shows the loading state immediately
renderFooter();
loadArticles(); // then fetches real data and re-renders the feed
initDarkMode();
