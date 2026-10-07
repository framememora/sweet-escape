// The Sweet Escape
// Owner settings: replace the placeholder number with the real WhatsApp number
// (country code + number, digits only, e.g. 919876543210).
const WHATSAPP_NUMBER = "919000000000"; // PLACEHOLDER
const OPEN_HOUR = 14;  // 2 PM, India time
const CLOSE_HOUR = 24; // midnight

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const waLink = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

// WhatsApp + phone links
document.querySelectorAll("[data-wa]").forEach((a) => {
  a.href = waLink(a.dataset.wa);
  a.target = "_blank";
  a.rel = "noopener";
});
document.querySelectorAll("[data-tel]").forEach((a) => { a.href = `tel:+${WHATSAPP_NUMBER}`; });

// Nav gets a backdrop once the page scrolls
const nav = document.querySelector("[data-nav]");
const hero = document.querySelector(".hero");
if (nav && hero && "IntersectionObserver" in window) {
  const sentinel = document.createElement("div");
  sentinel.style.cssText = "position:absolute;top:0;height:40px;width:1px;pointer-events:none";
  hero.prepend(sentinel);
  new IntersectionObserver(([e]) => nav.classList.toggle("is-scrolled", !e.isIntersecting)).observe(sentinel);
}

// Menu panel
const menuBtn = document.querySelector("[data-menu-btn]");
const menuPanel = document.querySelector("[data-menu-panel]");
function setMenu(open) {
  if (!menuBtn || !menuPanel) return;
  menuPanel.hidden = !open;
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  menuBtn.querySelector("i").className = open ? "ph ph-x" : "ph ph-list";
}
if (menuBtn && menuPanel) {
  menuBtn.addEventListener("click", () => setMenu(menuPanel.hidden));
  menuPanel.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("click", (e) => {
    if (!menuPanel.hidden && !e.target.closest("[data-menu-panel],[data-menu-btn]")) setMenu(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
}

// Open / closed, in Kochi time
function kochiNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return { h: get("hour"), m: get("minute") };
}
function updateStatus() {
  const { h, m } = kochiNow();
  const open = h >= OPEN_HOUR && h < CLOSE_HOUR;
  const minsLeft = (CLOSE_HOUR - h) * 60 - m;
  const status = document.querySelector("[data-status]");
  const text = document.querySelector("[data-status-text]");
  if (status && text) {
    status.classList.toggle("is-open", open);
    status.classList.toggle("is-closed", !open);
    text.textContent = open
      ? (minsLeft <= 60 ? "Open now, closing at midnight" : "Open now, till midnight")
      : "Closed now, opens at 2 PM";
  }
  const branch = document.querySelector('[data-branch-status="thoppumpady"]');
  if (branch) {
    branch.textContent = open ? "Open now, till midnight" : "Closed now, opens at 2 PM";
    branch.classList.toggle("is-open-text", open);
    branch.classList.toggle("is-closed-text", !open);
  }
}
updateStatus();
setInterval(updateStatus, 60_000);

// Photos: skeleton until loaded
document.querySelectorAll("[data-photo]").forEach((box) => {
  const img = box.querySelector("img");
  if (!img) return;
  const done = () => box.classList.add("is-loaded");
  const fail = () => box.classList.add("is-missing");
  if (img.complete) {
    img.naturalWidth ? done() : fail();
  } else {
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", fail, { once: true });
  }
});

// Menu filter
const chips = [...document.querySelectorAll("[data-filter]")];
const items = [...document.querySelectorAll("[data-grid] li")];
chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const cat = chip.dataset.filter;
    chips.forEach((c) => {
      const on = c === chip;
      c.classList.toggle("is-on", on);
      c.setAttribute("aria-pressed", String(on));
    });
    items.forEach((li) => {
      const show = cat === "all" || li.dataset.cat === cat;
      li.hidden = !show;
      if (show && !reduceMotion) {
        li.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }],
          { duration: 380, easing: "cubic-bezier(.16,1,.3,1)" });
      }
    });
  });
});

// Reveal sections as they arrive
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-in"));
}

// "What are you in the mood for?": dessert photos trail the cursor or finger
const trail = document.querySelector("[data-trail]");
if (trail && !reduceMotion) {
  const srcs = ["truffles", "gelato", "brownie", "waffle", "tart", "mousse", "custom-cake", "fudge", "chocolate-cake", "pie"]
    .map((n) => `images/${n}.jpg`);
  srcs.forEach((s) => { const i = new Image(); i.src = s; });
  let last = null;
  let n = 0;
  const spawn = (clientX, clientY) => {
    const r = trail.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    if (last && Math.hypot(x - last.x, y - last.y) < 80) return;
    last = { x, y };
    const img = document.createElement("img");
    img.className = "trail-img";
    img.src = srcs[n++ % srcs.length];
    img.alt = "";
    trail.appendChild(img);
    const w = img.offsetWidth || 120;
    const h = w * 1.25;
    img.style.left = `${x - w / 2}px`;
    img.style.top = `${y - h / 2}px`;
    const rot = (Math.random() * 16 - 8).toFixed(1);
    img.animate([
      { opacity: 0, transform: `scale(.6) rotate(${rot}deg)` },
      { opacity: 1, transform: `scale(1) rotate(${rot}deg)`, offset: .2 },
      { opacity: 1, transform: `scale(1) rotate(${rot}deg)`, offset: .7 },
      { opacity: 0, transform: `scale(.85) rotate(${rot}deg)` },
    ], { duration: 1400, easing: "cubic-bezier(.16,1,.3,1)" }).onfinish = () => img.remove();
  };
  trail.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") spawn(e.clientX, e.clientY); });
  trail.addEventListener("touchmove", (e) => { const t = e.touches[0]; if (t) spawn(t.clientX, t.clientY); }, { passive: true });
  trail.addEventListener("touchstart", (e) => { const t = e.touches[0]; if (t) { last = null; spawn(t.clientX, t.clientY); } }, { passive: true });
}

// Order sheet
const sheet = document.querySelector("[data-sheet]");
document.querySelectorAll("[data-open-sheet]").forEach((b) =>
  b.addEventListener("click", () => sheet && sheet.showModal())
);
document.querySelectorAll("[data-close-sheet]").forEach((b) =>
  b.addEventListener("click", () => sheet && sheet.close())
);
if (sheet) {
  sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.close(); });
}

// Order form → WhatsApp
const slip = document.querySelector("[data-slip]");
if (slip) {
  const dateInput = slip.querySelector("[data-date]");
  const today = new Date();
  const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  if (dateInput) dateInput.min = iso;
  const error = slip.querySelector("[data-slip-error]");

  slip.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(slip);
    const date = data.get("date");
    if (date && date < iso) {
      error.textContent = "That date has already passed. Pick today or a later day.";
      error.hidden = false;
      dateInput.focus();
      return;
    }
    error.hidden = true;
    const lines = [`Hi Sweet Escape! I'd like to order ${data.get("kind")}.`];
    if (data.get("occasion")) lines.push(`Occasion: ${data.get("occasion").trim()}`);
    if (date) {
      const pretty = new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" });
      lines.push(`Needed on: ${pretty}`);
    }
    if (data.get("notes")) lines.push(`Details: ${data.get("notes").trim()}`);
    window.open(waLink(lines.join("\n")), "_blank", "noopener");
  });
}

// Year
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
