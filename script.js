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

// Mobile nav
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");
if (toggle && nav) {
  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".nav-toggle-label").textContent = open ? "Close" : "Menu";
  };
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
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
  const { h } = kochiNow();
  const open = h >= OPEN_HOUR && h < CLOSE_HOUR;
  const status = document.querySelector("[data-status]");
  const text = document.querySelector("[data-status-text]");
  const minsLeft = (CLOSE_HOUR - h) * 60 - kochiNow().m;
  let msg;
  if (open) msg = minsLeft <= 60 ? `Open now, closing at midnight` : `Open now till midnight`;
  else msg = `Closed now. Opens at 2 PM`;
  if (status) {
    status.classList.toggle("is-open", open);
    status.classList.toggle("is-closed", !open);
    text.textContent = `${msg} · Thoppumpady`;
  }
  const branch = document.querySelector('[data-branch-status="thoppumpady"]');
  if (branch) {
    branch.textContent = open ? "Open" : "Closed, opens at 2 PM";
    branch.className = open ? "is-open-text" : "is-closed-text";
  }
}
updateStatus();
setInterval(updateStatus, 60_000);

// Photos: skeleton until loaded, labelled slot if the file isn't there yet
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
const filters = document.querySelectorAll("[data-filter]");
const segments = document.querySelectorAll(".segment");
const empty = document.querySelector("[data-empty]");
filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    const cat = btn.dataset.filter;
    filters.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    let shown = 0;
    segments.forEach((s) => {
      const show = cat === "all" || s.dataset.cat === cat;
      s.classList.toggle("is-hidden", !show);
      s.classList.remove("is-entering");
      if (show) {
        shown++;
        void s.offsetWidth; // restart the snap-in
        s.classList.add("is-entering");
      }
    });
    if (empty) empty.hidden = shown > 0;
  });
});

// Order slip → WhatsApp
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

// Guilloche rosette for the seal
const rosette = document.querySelector("[data-guilloche]");
if (rosette) {
  const NS = "http://www.w3.org/2000/svg";
  const ring = (R, amp, lobes, phase) => {
    let d = "";
    for (let i = 0; i <= 360; i++) {
      const t = (i / 360) * Math.PI * 2;
      const r = R + amp * Math.cos(lobes * t + phase);
      const x = 100 + r * Math.cos(t);
      const y = 100 + r * Math.sin(t);
      d += (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
    }
    return d + "Z";
  };
  for (let k = 0; k < 24; k++) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", ring(86, 9, 24, (k / 24) * Math.PI * 2 / 24));
    rosette.appendChild(p);
  }
  for (let k = 0; k < 16; k++) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", ring(66, 6, 16, (k / 16) * Math.PI * 2 / 16));
    rosette.appendChild(p);
  }
}

// Year
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
