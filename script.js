// The Sweet Escape
// Owner settings: replace the placeholder number with the real WhatsApp number
// (country code + number, digits only, e.g. 919876543210).
const WHATSAPP_NUMBER = "919000000000"; // PLACEHOLDER
const OPEN_HOUR = 14;  // 2 PM, India time
const CLOSE_HOUR = 24; // midnight

const waLink = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

// WhatsApp links
document.querySelectorAll("[data-wa]").forEach((a) => {
  a.href = waLink(a.dataset.wa);
  a.target = "_blank";
  a.rel = "noopener";
});

// Header turns solid once the hero is out of view
const topBar = document.querySelector("[data-top]");
const hero = document.querySelector("[data-hero]");
if (topBar && hero && "IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    topBar.classList.toggle("is-solid", !entry.isIntersecting);
  }, { rootMargin: "-64px 0px 0px 0px" }).observe(hero);
} else if (topBar) {
  topBar.classList.add("is-solid");
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
    text.textContent = open ? (minsLeft <= 60 ? "Closing soon" : "Open now") : "Opens 2 PM";
  }
  const branch = document.querySelector('[data-branch-status="thoppumpady"]');
  if (branch) {
    branch.textContent = open ? "Open now, till midnight" : "Closed now. Opens at 2 PM";
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

// Menu chips follow the shelf in view
const chips = [...document.querySelectorAll("[data-chip]")];
const chipBar = document.querySelector("[data-chips]");
function setChip(id) {
  chips.forEach((c) => {
    const on = c.dataset.chip === id;
    c.classList.toggle("is-on", on);
    if (on) {
      c.setAttribute("aria-current", "true");
      if (chipBar) {
        const left = c.offsetLeft - chipBar.clientWidth / 2 + c.clientWidth / 2;
        chipBar.scrollTo({ left, behavior: "smooth" });
      }
    } else {
      c.removeAttribute("aria-current");
    }
  });
}
if ("IntersectionObserver" in window) {
  const shelfObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setChip(e.target.id); });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("[data-shelf]").forEach((s) => shelfObserver.observe(s));
}

// Branch tabs
const tabs = [...document.querySelectorAll("[data-tab]")];
function selectTab(tab, focus) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.classList.toggle("is-on", on);
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute("aria-controls"));
    if (!panel) return;
    panel.hidden = !on;
    if (on) {
      const frame = panel.querySelector("iframe[data-src]");
      if (frame) { frame.src = frame.dataset.src; frame.removeAttribute("data-src"); }
    }
  });
  if (focus) tab.focus();
}
tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    selectTab(next, true);
  });
});

// Cake / hamper sheet
const sheet = document.querySelector("[data-sheet]");
document.querySelectorAll("[data-open-sheet]").forEach((b) =>
  b.addEventListener("click", () => sheet && sheet.showModal())
);
document.querySelectorAll("[data-close-sheet]").forEach((b) =>
  b.addEventListener("click", () => sheet && sheet.close())
);
if (sheet) {
  // tap on the backdrop closes the sheet
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
