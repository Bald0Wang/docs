/**
 * @file 页面交互：目录高亮、平滑滚动、复制按钮、FAQ 折叠、新布鲁托主义小提示 Toast、主题切换。
 */

/**
 * @typedef {Object} CopyTarget
 * @property {string} text 要复制的文本
 * @property {string} label Toast 展示文案
 */

/**
 * 获取元素（强约束存在），避免到处判空。
 * @template {HTMLElement} T
 * @param {string} selector
 * @returns {T}
 */
function mustQuery(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return /** @type {T} */ (el);
}

/**
 * 轻量 Toast。
 * @param {string} message
 */
function toast(message) {
  const el = mustQuery("#toast");
  el.textContent = message;
  el.hidden = false;
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => {
    el.hidden = true;
  }, 2200);
}
/** @type {number} */
toast._t = 0;

/**
 * 复制到剪贴板（优先使用 Clipboard API）。
 * @param {CopyTarget} target
 * @returns {Promise<void>}
 */
async function copyToClipboard(target) {
  try {
    await navigator.clipboard.writeText(target.text);
    toast(`${target.label}：已复制`);
  } catch (_) {
    // 降级方案：创建临时 textarea
    const ta = document.createElement("textarea");
    ta.value = target.text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    toast(ok ? `${target.label}：已复制` : `${target.label}：复制失败（请手动复制）`);
  }
}

/**
 * 获取当前主题（light/dark）。
 * @returns {"light"|"dark"}
 */
function getTheme() {
  const v = localStorage.getItem("hacksong_theme");
  return v === "light" ? "light" : "dark";
}

/**
 * 设置主题并持久化。
 * @param {"light"|"dark"} theme
 */
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("hacksong_theme", theme);
  toast(theme === "light" ? "主题：亮色" : "主题：暗色");
}

/**
 * 初始化目录滚动高亮。
 * @returns {void}
 */
function initTocSpy() {
  const toc = mustQuery("#toc");
  const links = /** @type {HTMLAnchorElement[]} */ (Array.from(toc.querySelectorAll("a")));
  const idToLink = new Map();
  links.forEach((a) => {
    const id = (a.getAttribute("href") || "").replace("#", "").trim();
    if (id) idToLink.set(id, a);
  });

  const sections = Array.from(idToLink.keys())
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  /** @param {string} activeId */
  const setActive = (activeId) => {
    links.forEach((a) => a.classList.remove("is-active"));
    const active = idToLink.get(activeId);
    if (active) active.classList.add("is-active");
  };

  const io = new IntersectionObserver(
    (entries) => {
      // 取最接近顶部/可见度较高的 section
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
      const top = visible[0];
      if (top && top.target && top.target.id) setActive(top.target.id);
    },
    { root: null, threshold: [0.15, 0.25, 0.35, 0.5, 0.65] }
  );

  sections.forEach((s) => io.observe(/** @type {Element} */ (s)));

  // 点击目录：平滑滚动
  toc.addEventListener("click", (e) => {
    const a = /** @type {HTMLElement|null} */ (e.target instanceof HTMLElement ? e.target.closest("a") : null);
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("#")) return;
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  });
}

/**
 * 初始化 FAQ 折叠。
 * @returns {void}
 */
function initAccordion() {
  const root = document.querySelector("[data-accordion]");
  if (!root) return;
  root.addEventListener("click", (e) => {
    const btn = /** @type {HTMLButtonElement|null} */ (
      e.target instanceof HTMLElement ? e.target.closest("button.acc__item") : null
    );
    if (!btn) return;
    const panel = btn.nextElementSibling;
    if (!(panel instanceof HTMLElement)) return;
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", expanded ? "false" : "true");
    panel.hidden = expanded;
  });
}

/**
 * 绑定复制按钮。
 * @returns {void}
 */
function initCopyButtons() {
  const bind = (id, label) => {
    const btn = document.getElementById(id);
    if (!(btn instanceof HTMLButtonElement)) return;
    const text = btn.dataset.copy || "";
    btn.addEventListener("click", () => copyToClipboard({ text, label }));
  };

  bind("copySignup", "报名入口");
  bind("copyRepo", "模板仓库");
  bind("copyChecklist", "交付清单");

  const all = document.getElementById("copyAllLinks");
  if (all instanceof HTMLButtonElement) {
    all.addEventListener("click", () => {
      const lines = [
        "【报名链接占位】",
        "【项目仓库占位】",
        "【资料链接占位：赛题/规则/资源】",
        "【交流渠道占位：群/飞书/Discord】",
      ];
      copyToClipboard({ text: lines.join("\n"), label: "链接占位合集" });
    });
  }
}

/**
 * 绑定快捷滚动按钮。
 * @returns {void}
 */
function initQuickScroll() {
  const scrollFlow = document.getElementById("scrollFlow");
  if (scrollFlow instanceof HTMLButtonElement) {
    scrollFlow.addEventListener("click", () => {
      const flow = document.getElementById("flow");
      if (!flow) return;
      flow.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const backTop = document.getElementById("backTop");
  if (backTop instanceof HTMLButtonElement) {
    backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }
}

/**
 * 初始化主题切换按钮。
 * @returns {void}
 */
function initThemeToggle() {
  // 初始主题：记忆优先，否则跟随系统
  const saved = localStorage.getItem("hacksong_theme");
  if (!saved) {
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    document.documentElement.dataset.theme = prefersLight ? "light" : "dark";
  } else {
    document.documentElement.dataset.theme = getTheme();
  }

  const btn = document.getElementById("toggleTheme");
  if (!(btn instanceof HTMLButtonElement)) return;
  btn.addEventListener("click", () => {
    const next = getTheme() === "dark" ? "light" : "dark";
    setTheme(next);
  });
}

/**
 * 入口。
 * @returns {void}
 */
function main() {
  initThemeToggle();
  initTocSpy();
  initAccordion();
  initCopyButtons();
  initQuickScroll();
}

main();

