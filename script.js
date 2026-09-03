// =====================================================
// FinTrack v17.7 - script.js
// =====================================================

// =====================================================
// DATA & STATE
// =====================================================

/** @type {Array<{id:number, desc:string, amount:number, date:string, cat:string}>} */
let expenses = JSON.parse(localStorage.getItem("ft_expenses") || "[]");

let activeFilter = "all";
let activeSort = "date-desc";
let activeCategory = "food";
let activePeriod = 7;
let activeTabIndex = 0;

/** Chart.js instances (kept so we can update instead of rebuild) */
let chartTrend = null,
  chartCategory = null,
  chartWeekly = null;

// =====================================================
// CATEGORY METADATA
// =====================================================

const CAT = {
  food: { icon: "fa-solid fa-carrot", label: "Food & Dining" },
  travel: { icon: "fa-solid fa-car", label: "Travel" },
  shopping: { icon: "fa-solid fa-bag-shopping", label: "Shopping" },
  health: { icon: "fa-solid fa-heart-pulse", label: "Health" },
  entertainment: { icon: "fa-solid fa-gamepad", label: "Entertainment" },
  bills: { icon: "fa-solid fa-receipt", label: "Bills" },
  education: { icon: "fa-solid fa-book", label: "Education" },
  other: { icon: "fa-solid fa-border-all", label: "Other" },
};

const CAT_COLORS = {
  food: "#ff8f00",
  travel: "#1976d2",
  shopping: "#8e24aa",
  health: "#2e7d32",
  entertainment: "#c62828",
  bills: "#00695c",
  education: "#283593",
  other: "#616161",
};

const CAT_COLORS_DARK = {
  food: "#ffb74d",
  travel: "#64b5f6",
  shopping: "#ce93d8",
  health: "#81c784",
  entertainment: "#ef9a9a",
  bills: "#4db6ac",
  education: "#9fa8da",
  other: "#bdbdbd",
};

// =====================================================
// THEME SYSTEM
// =====================================================

let activeTheme = localStorage.getItem("ft_theme") || "light";

function applyTheme(mode) {
  if (mode !== "light" && mode !== "dark") mode = "light";
  activeTheme = mode;
  localStorage.setItem("ft_theme", mode);
  document.documentElement.setAttribute("data-theme", mode);

  const toggle = document.getElementById("theme-toggle");
  const btns = toggle.querySelectorAll(".theme-btn");
  const idx = mode === "dark" ? 1 : 0;

  btns.forEach((b, i) => b.classList.toggle("active", i === idx));
  toggle.setAttribute("data-active", idx + 1);

  // Refresh charts if visible
  if (document.getElementById("tab-charts").style.display !== "none") {
    renderCharts();
  }
}

function initThemeToggle() {
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyTheme(btn.dataset.mode));
  });
  const stored = localStorage.getItem("ft_theme") || "light";
  applyTheme(stored === "system" ? "light" : stored);
}

function isDark() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

function getChartColors() {
  return isDark() ? CAT_COLORS_DARK : CAT_COLORS;
}

// =====================================================
// INACTIVITY TIMER
// =====================================================

let AUTO_LOCK = parseInt(localStorage.getItem("ft_autolock") || "30000", 10);

/** Reposition the sliding pill behind the active timer segment */
function updateTimerPill() {
  const segsEl = document.getElementById("timer-segments");
  const activeBtn = segsEl?.querySelector(".timer-seg.active");
  if (!segsEl || !activeBtn) return;
  const sr = segsEl.getBoundingClientRect();
  const br = activeBtn.getBoundingClientRect();
  segsEl.style.setProperty("--timer-pill-left", br.left - sr.left + 3 + "px");
  segsEl.style.setProperty("--timer-pill-width", br.width - 2 + "px");
}

function initTimerSegments() {
  const segs = document.querySelectorAll(".timer-seg");
  segs.forEach((seg) => {
    const ms = parseInt(seg.dataset.ms, 10);
    seg.classList.toggle("active", ms === AUTO_LOCK);
    seg.addEventListener("click", () => {
      AUTO_LOCK = ms;
      localStorage.setItem("ft_autolock", ms);
      segs.forEach((s) =>
        s.classList.toggle("active", parseInt(s.dataset.ms, 10) === ms),
      );
      updateTimerPill();
      resetIdle();
      showToast(
        ms === 0
          ? "Auto-lock disabled."
          : `Auto-lock set to ${seg.textContent.trim()}.`,
        ms === 0 ? "info" : "success",
      );
    });
  });
  setTimeout(updateTimerPill, 50);
}

// =====================================================
// DESCRIPTION COUNTER + INPUT VALIDATION
// =====================================================

const DESC_MAX = 60;

function initInputEnhancements() {
  const descInput = document.getElementById("exp-desc");
  const counter = document.getElementById("desc-counter");
  const amountInput = document.getElementById("exp-amount");

  descInput.setAttribute("maxlength", DESC_MAX);

  descInput.addEventListener("input", () => {
    const len = descInput.value.length;
    const remaining = DESC_MAX - len;
    counter.textContent = len > 0 ? `${len}/${DESC_MAX}` : "";
    counter.className =
      "desc-counter" +
      (remaining <= 5 ? " at-limit" : remaining <= 15 ? " near-limit" : "");
  });

  amountInput.addEventListener("input", () => {
    const val = parseFloat(amountInput.value);
    amountInput.classList.toggle("input-valid", !isNaN(val) && val > 0);
  });

  amountInput.addEventListener("blur", () => {
    if (!amountInput.value) amountInput.classList.remove("input-valid");
  });
}

// =====================================================
// SKELETON LOADER
// =====================================================

function showSkeleton(count = 3) {
  const list = document.getElementById("expense-list");
  const empty = document.getElementById("empty-state");
  empty.style.display = "none";
  list.innerHTML = Array.from(
    { length: count },
    () => `
    <li class="skeleton-item">
      <div class="skeleton-block skeleton-icon"></div>
      <div class="skeleton-body">
        <div class="skeleton-block skeleton-line-a"></div>
        <div class="skeleton-block skeleton-line-b"></div>
      </div>
      <div class="skeleton-block skeleton-amount"></div>
    </li>`,
  ).join("");
}

// =====================================================
// SCROLL-REVEAL
// =====================================================

let revealObserver = null;

function initScrollReveal() {
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("reveal-hidden");
          entry.target.classList.add("reveal-visible");
          revealObserver.unobserve(entry.target);
        }
      }),
    { threshold: 0.1, rootMargin: "0px 0px -20px 0px" },
  );
}

/** Apply reveal animation to items beyond index 5 (off-screen on load) */
function observeExpenseItems() {
  if (!revealObserver) return;
  document.querySelectorAll(".expense-item").forEach((item, i) => {
    if (i >= 6) {
      item.classList.add("reveal-hidden");
      revealObserver.observe(item);
    }
  });
}

// =====================================================
// TAB-NAV ELEVATION ON SCROLL
// =====================================================

function initTabNavElevation() {
  const tabNav = document.querySelector(".tab-nav");
  const wrapper = document.querySelector(".tab-panels-wrapper");
  const update = () => {
    const scrollY = wrapper.scrollTop || window.scrollY;
    tabNav.classList.toggle("elevated", scrollY > 20);
  };
  wrapper.addEventListener("scroll", update, { passive: true });
  window.addEventListener("scroll", update, { passive: true });
}

// =====================================================
// FORMATTING HELPERS
// =====================================================

function fmt(n) {
  return Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtCompact(n) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + fmt(n);
}

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function saveExpenses() {
  localStorage.setItem("ft_expenses", JSON.stringify(expenses));
}

/** Returns expenses within the last `period` days (0 = all) */
function getFiltered(period = activePeriod) {
  if (!period) return [...expenses];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - period);
  return expenses.filter((e) => new Date(e.date + "T00:00:00") >= cutoff);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// =====================================================
// RIPPLE EFFECT
// =====================================================

function addRipple(e) {
  const btn = e.currentTarget;
  const target = btn.classList.contains("tab-btn")
    ? btn.querySelector(".tab-btn-icon-wrap")
    : btn;
  if (!target) return;

  target.querySelector(".ripple-wave")?.remove();

  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2.2;
  const x = (e.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
  const y = (e.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;

  const ripple = document.createElement("span");
  ripple.className = "ripple-wave";
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;position:absolute;`;
  target.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), {
    once: true,
  });
}

function attachRipples() {
  const sel =
    ".btn-record, .cat-btn, .period-btn, .mbtn, .pin-key, .sort-btn[data-sort], .timer-seg, .tab-btn";
  document
    .querySelectorAll(sel)
    .forEach((el) => el.addEventListener("click", addRipple));
}

// =====================================================
// ANIMATED NUMBER COUNTER
// =====================================================

function animateNumber(el, target, decimals = 2, duration = 500) {
  const start = parseFloat(el.textContent.replace(/,/g, "")) || 0;
  const diff = target - start;
  if (Math.abs(diff) < 0.01) return;

  const startTime = performance.now();

  // Trigger CSS pop class on the parent .stat-value
  const valEl = el.closest(".stat-value") || el.parentElement;
  valEl?.classList.remove("num-updated");
  requestAnimationFrame(() =>
    requestAnimationFrame(() => valEl?.classList.add("num-updated")),
  );
  setTimeout(() => valEl?.classList.remove("num-updated"), 450);

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4); // ease-out quart
    el.textContent = Number(start + diff * eased).toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// =====================================================
// TOAST NOTIFICATIONS
// =====================================================

function showToast(msg, type = "info") {
  const icons = {
    success: "fa-solid fa-circle-check",
    error: "fa-solid fa-circle-xmark",
    info: "fa-solid fa-circle-info",
    warning: "fa-solid fa-circle-exclamation",
  };

  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="${icons[type] ?? icons.info}"></i><span>${msg}</span><div class="toast-progress"></div>`;
  document.getElementById("toast-container").appendChild(t);

  setTimeout(() => {
    t.classList.add("hiding");
    t.addEventListener("animationend", () => t.remove(), { once: true });
  }, 3400);
}

/**
 * Toast with an inline "Undo" action. The timer runs for `duration` ms;
 * clicking Undo cancels the timer and fires `onUndo` before the toast closes.
 */
function showUndoToast(msg, onUndo, duration = 5000) {
  const t = document.createElement("div");
  t.className = "toast info toast-undo";
  t.innerHTML = `
    <i class="fa-solid fa-trash"></i>
    <span>${msg}</span>
    <button type="button" class="toast-undo-btn">Undo</button>
    <div class="toast-progress" style="animation-duration:${duration}ms;"></div>`;
  document.getElementById("toast-container").appendChild(t);

  let settled = false;
  const closeToast = () => {
    if (t.classList.contains("hiding")) return;
    t.classList.add("hiding");
    t.addEventListener("animationend", () => t.remove(), { once: true });
  };

  const timer = setTimeout(() => {
    if (!settled) {
      settled = true;
      closeToast();
    }
  }, duration);

  t.querySelector(".toast-undo-btn").addEventListener("click", () => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    onUndo?.();
    closeToast();
  });
}

// =====================================================
// TAB NAV - sliding pill position
// =====================================================

function updateTabPill() {
  const nav = document.querySelector(".tab-nav");
  const activeBtn = nav?.querySelector(".tab-btn.active");
  if (!nav || !activeBtn) return;
  const nr = nav.getBoundingClientRect();
  const br = activeBtn.getBoundingClientRect();
  nav.style.setProperty("--tab-pill-left", br.left - nr.left + "px");
  nav.style.setProperty("--tab-pill-width", br.width + "px");
}

// =====================================================
// TAB NAVIGATION
// =====================================================

const TAB_ORDER = ["home", "insights", "charts", "settings"];

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    const newIndex = TAB_ORDER.indexOf(tab);
    if (newIndex === activeTabIndex) return; // already active

    const direction = newIndex > activeTabIndex ? "right" : "left";

    // Update button states
    document.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");

    // Slide out current panel
    const currentPanel =
      document.querySelector(".tab-panel[style*='block']") ||
      document.querySelector(".tab-panel.active");
    if (currentPanel) {
      currentPanel.classList.add(
        direction === "right" ? "tab-slide-out-left" : "tab-slide-out-right",
      );
    }

    setTimeout(() => {
      // Hide all panels and clear animation classes
      document.querySelectorAll(".tab-panel").forEach((p) => {
        p.style.display = "none";
        p.className = "tab-panel";
      });

      const panel = document.getElementById("tab-" + tab);
      panel.style.display = "block";
      panel.scrollTop = 0;
      document.querySelector(".tab-panels-wrapper").scrollTop = 0;
      window.scrollTo(0, 0);

      // Force reflow before adding entrance class
      panel.getBoundingClientRect();
      panel.classList.add(
        direction === "right" ? "tab-slide-in-right" : "tab-slide-in-left",
      );

      activeTabIndex = newIndex;
      updateTabPill();

      if (tab === "insights") renderInsights();
      if (tab === "charts") {
        renderCharts();
        setTimeout(updatePeriodPill, 50);
      }
      if (tab === "settings") {
        updateStorageStats();
        setTimeout(updateTimerPill, 50);
      }
    }, 150);
  });
});

// =====================================================
// CATEGORY PICKER
// =====================================================

document.querySelectorAll(".cat-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".cat-btn")
      .forEach((b) => b.classList.remove("active", "just-selected"));
    btn.classList.add("active", "just-selected");
    activeCategory = btn.dataset.cat;
    btn.addEventListener(
      "animationend",
      () => btn.classList.remove("just-selected"),
      { once: true },
    );
  });
});

// =====================================================
// ADD / EDIT EXPENSE - form submit handler
// =====================================================

document.getElementById("expense-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const desc = document.getElementById("exp-desc").value.trim();
  const amount = parseFloat(document.getElementById("exp-amount").value);
  const date = document.getElementById("exp-date").value;

  if (!desc) {
    showToast("Description is required.", "warning");
    return;
  }
  if (!amount || amount <= 0) {
    showToast("Enter a valid amount.", "warning");
    return;
  }
  if (!date) {
    showToast("Select a date.", "warning");
    return;
  }

  if (editingId) {
    // Update existing entry in-place
    const idx = expenses.findIndex((ex) => ex.id === editingId);
    if (idx !== -1)
      expenses[idx] = {
        id: editingId,
        desc,
        amount,
        date,
        cat: activeCategory,
      };
    cancelEdit();
    saveExpenses();
    renderExpenseList();
    updateStats();
    showToast("Expense updated!", "success");
  } else {
    // New entry
    const expense = { id: Date.now(), desc, amount, date, cat: activeCategory };
    expenses.push(expense);
    saveExpenses();

    renderExpenseList();
    updateStats();

    // Flash the new item with a border glow
    setTimeout(() => {
      const newItem = document.querySelector(
        `.expense-item[data-id="${expense.id}"]`,
      );
      if (newItem) {
        newItem.classList.add("new-flash");
        newItem.addEventListener(
          "animationend",
          () => newItem.classList.remove("new-flash"),
          { once: true },
        );
      }
    }, 50);

    showToast("Expense recorded!", "success");
  }

  // Reset form fields
  document.getElementById("exp-desc").value = "";
  document.getElementById("exp-amount").value = "";
  document.getElementById("exp-date").value = today();
  document.getElementById("desc-counter").textContent = "";

  // Reset category picker to Food
  document
    .querySelectorAll(".cat-btn")
    .forEach((b) => b.classList.remove("active", "just-selected"));
  document.querySelector('.cat-btn[data-cat="food"]').classList.add("active");
  activeCategory = "food";
});

// =====================================================
// EDIT EXPENSE
// =====================================================

let editingId = null;

function editExpense(id) {
  const exp = expenses.find((e) => e.id === id);
  if (!exp) return;

  cancelEdit(); // clear any prior editing state

  editingId = id;
  document.getElementById("exp-desc").value = exp.desc;
  document.getElementById("exp-amount").value = exp.amount;
  document.getElementById("exp-date").value = exp.date;

  // Sync category picker
  document.querySelectorAll(".cat-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.cat === exp.cat);
  });
  activeCategory = exp.cat;

  // Visual editing indicator on form
  document.querySelector(".form-card").classList.add("editing-mode");
  document.querySelector(".btn-record").innerHTML =
    '<i class="fa-solid fa-floppy-disk"></i> Update Expense';

  // Dim the item being edited
  document.querySelectorAll(".expense-item").forEach((el) => {
    el.classList.toggle("being-edited", parseInt(el.dataset.id) === id);
  });

  document
    .querySelector(".form-card")
    .scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("exp-desc").focus();
  showToast("Editing - make changes and save.", "info");
}

function cancelEdit() {
  if (!editingId) return;
  editingId = null;
  document.querySelector(".form-card").classList.remove("editing-mode");
  document.querySelector(".btn-record").innerHTML =
    '<i class="fa-solid fa-plus"></i> Record Expense';
  document
    .querySelectorAll(".expense-item")
    .forEach((el) => el.classList.remove("being-edited"));
}

// =====================================================
// DELETE EXPENSE
// =====================================================

function deleteExpense(id) {
  const idx = expenses.findIndex((e) => e.id === id);
  if (idx === -1) return;

  // Keep a copy so we can restore it if the user hits Undo
  const removedExpense = expenses[idx];
  const wasEditingThis = editingId === id;
  if (wasEditingThis) cancelEdit();

  const finalizeRemoval = () => {
    expenses = expenses.filter((e) => e.id !== id);
    saveExpenses();
    renderExpenseList();
    updateStats();
  };

  const item = document.querySelector(`.expense-item[data-id="${id}"]`);
  if (item) {
    item.classList.add("removing");
    setTimeout(finalizeRemoval, 310);
  } else {
    finalizeRemoval();
  }

  showUndoToast(
    `Deleted "${escapeHtml(removedExpense.desc)}"`,
    () => {
      // Only restore if it hasn't already been re-added some other way
      if (!expenses.some((e) => e.id === removedExpense.id)) {
        expenses.push(removedExpense);
        saveExpenses();
        renderExpenseList();
        updateStats();
        showToast("Expense restored.", "success");
      }
    },
    5000,
  );
}

// =====================================================
// RENDER EXPENSE LIST - keyed diffing for smooth updates
// =====================================================

function renderExpenseList() {
  const list = document.getElementById("expense-list");
  const empty = document.getElementById("empty-state");
  const query = (document.getElementById("search-input").value || "")
    .toLowerCase()
    .trim();

  // Sort
  let items = [...expenses];
  if (activeSort === "amount-desc")
    items.sort((a, b) => b.amount - a.amount || b.id - a.id);
  else if (activeSort === "amount-asc")
    items.sort((a, b) => a.amount - b.amount || a.id - b.id);
  else if (activeSort === "date-asc")
    items.sort((a, b) => new Date(a.date) - new Date(b.date) || a.id - b.id);
  else items.sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);

  // Category filter
  if (activeFilter !== "all")
    items = items.filter((e) => e.cat === activeFilter);

  // Search filter (all query words must appear)
  if (query) {
    items = items.filter((e) => {
      const text =
        `${e.desc} ${e.amount} ${formatDate(e.date)} ${e.cat}`.toLowerCase();
      return query.split(" ").every((w) => text.includes(w));
    });
  }

  if (!items.length) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  const newIds = new Set(items.map((e) => e.id));

  // Remove stale items
  list.querySelectorAll(".expense-item").forEach((el) => {
    if (!newIds.has(parseInt(el.dataset.id))) {
      el.classList.add("removing");
      setTimeout(() => el.remove(), 310);
    }
  });

  // Insert or update items in order
  items.forEach((e, i) => {
    const cat = CAT[e.cat] || CAT.other;
    const html = `
      <div class="exp-icon cat-${e.cat}"><i class="${cat.icon}"></i></div>
      <div class="exp-body">
        <div class="exp-desc">${escapeHtml(e.desc)}</div>
        <div class="exp-meta">
          <span>${formatDate(e.date)}</span>
          <span class="exp-cat-badge badge-${e.cat}">${cat.label}</span>
        </div>
      </div>
      <div class="exp-right">
        <span class="exp-amount">−₹${fmt(e.amount)}</span>
        <div class="exp-actions">
          <button class="exp-edit"   onclick="editExpense(${e.id})"   title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="exp-delete" onclick="deleteExpense(${e.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;

    let el = list.querySelector(`.expense-item[data-id="${e.id}"]`);
    if (!el) {
      el = document.createElement("li");
      el.setAttribute("role", "listitem");
      el.className = "expense-item";
      el.dataset.id = e.id;
      el.innerHTML = html;
      list.insertBefore(el, list.children[i] ?? null);
    } else {
      el.innerHTML = html;
      const ref = list.children[i] ?? null;
      if (el !== ref) list.insertBefore(el, ref);
    }

    el.classList.toggle("being-edited", e.id === editingId);
  });

  observeExpenseItems();
}

// =====================================================
// STATS - single-pass computation
// =====================================================

function updateStats() {
  const todayStr = today();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let total = 0,
    todayAmt = 0,
    todayCount = 0,
    monthTotal = 0;
  const dateSet = new Set();
  const allMs = [];

  for (const e of expenses) {
    total += e.amount;
    dateSet.add(e.date);
    allMs.push(new Date(e.date + "T00:00:00").getTime());

    if (e.date === todayStr) {
      todayAmt += e.amount;
      todayCount++;
    }

    const d = new Date(e.date + "T00:00:00");
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      monthTotal += e.amount;
    }
  }

  // Daily average: use span of dates, capped at 90 days
  let spanDays = dateSet.size;
  if (expenses.length > 1 && allMs.length > 1) {
    const fullSpan =
      Math.round((Math.max(...allMs) - Math.min(...allMs)) / 86400000) + 1;
    spanDays = Math.min(fullSpan, 90);
  }
  const avg = spanDays > 0 ? total / spanDays : 0;

  // DOM updates
  animateNumber(document.getElementById("stat-total"), total);
  animateNumber(document.getElementById("stat-today"), todayAmt);
  animateNumber(document.getElementById("stat-avg"), avg);
  animateNumber(document.getElementById("header-month-total"), monthTotal);

  document.getElementById("stat-total-count").textContent =
    `${expenses.length} Expense${expenses.length !== 1 ? "s" : ""}`;
  document.getElementById("stat-today-count").textContent =
    `${todayCount} Transaction${todayCount !== 1 ? "s" : ""}`;
  document.getElementById("stat-avg-days").textContent =
    `Across ${spanDays} day${spanDays !== 1 ? "s" : ""}`;

  updateBudgetBar(monthTotal);

  // Flash header chip
  const chip = document.querySelector(".header-chip");
  chip?.classList.remove("updated");
  requestAnimationFrame(() =>
    requestAnimationFrame(() => chip?.classList.add("updated")),
  );
}

// =====================================================
// BUDGET BAR
// =====================================================

function updateBudgetBar(monthTotal) {
  const budget = parseFloat(localStorage.getItem("ft_budget") || "0");
  const bar = document.getElementById("budget-bar-wrap");
  if (!bar) return;

  if (!budget || budget <= 0) {
    bar.style.display = "none";
    return;
  }

  bar.style.display = "block";
  const pct = Math.min((monthTotal / budget) * 100, 100);
  const fill = document.getElementById("budget-bar-fill");
  const lbl = document.getElementById("budget-bar-label");

  fill.style.width = pct + "%";
  fill.className =
    "budget-fill" +
    (pct >= 100 ? " budget-over" : pct >= 80 ? " budget-warn" : "");

  const remaining = budget - monthTotal;
  if (remaining <= 0) {
    lbl.textContent = `Over budget by ₹${fmt(Math.abs(remaining))}`;
    lbl.className = "budget-label budget-label-over";
  } else {
    lbl.textContent = `₹${fmt(remaining)} left of ₹${fmt(budget)} budget`;
    lbl.className = "budget-label" + (pct >= 80 ? " budget-label-warn" : "");
  }
}

// =====================================================
// SHARE MONTHLY SUMMARY
// =====================================================

function shareMonthlySummary() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date + "T00:00:00");
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  if (!monthExpenses.length) {
    showToast("No expenses this month to share.", "warning");
    return;
  }

  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const uniqueDays = new Set(monthExpenses.map((e) => e.date)).size;
  const dailyAvg = uniqueDays > 0 ? monthTotal / uniqueDays : 0;
  const txCount = monthExpenses.length;

  // Top 3 categories
  const catTotals = {};
  monthExpenses.forEach((e) => {
    catTotals[e.cat] = (catTotals[e.cat] || 0) + e.amount;
  });
  const topCats = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Biggest expense
  const biggest = monthExpenses.reduce(
    (m, e) => (e.amount > m.amount ? e : m),
    monthExpenses[0],
  );

  // vs last month
  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const lastTotal = expenses
    .filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      return (
        d.getMonth() === lastMonthDate.getMonth() &&
        d.getFullYear() === lastMonthDate.getFullYear()
      );
    })
    .reduce((s, e) => s + e.amount, 0);

  const vsLastLine =
    lastTotal > 0
      ? (() => {
          const diff = monthTotal - lastTotal;
          const pct = Math.abs((diff / lastTotal) * 100).toFixed(0);
          return `Trend          ${diff > 0 ? "+" : "-"}${pct}% vs last month (${diff > 0 ? "+" : "-"}₹${fmt(Math.abs(diff))})`;
        })()
      : null;

  const budget = parseFloat(localStorage.getItem("ft_budget") || "0");
  const budgetLine =
    budget > 0
      ? `Budget         ₹${fmt(budget)}  |  ${Math.round((monthTotal / budget) * 100)}% used  |  ₹${fmt(Math.max(budget - monthTotal, 0))} left`
      : null;

  const medals = ["🥇", "🥈", "🥉"];
  const catEmoji = {
    food: "🍽",
    travel: "🚗",
    shopping: "🛍",
    health: "💊",
    entertainment: "🎮",
    bills: "🧾",
    education: "📚",
    other: "📦",
  };
  const catLines = topCats
    .map(([cat, amt], i) => {
      const label = (CAT[cat] || CAT.other).label;
      const pct = ((amt / monthTotal) * 100).toFixed(0);
      return `${medals[i]} ${catEmoji[cat] || "•"} ${label.padEnd(14)} ₹${fmt(amt)} (${pct}%)`;
    })
    .join("\n");

  const monthName = now.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const div = "─".repeat(30);

  const lines = [
    `📊 FinTrack - ${monthName}`,
    div,
    `💸 Total Spent    ₹${fmt(monthTotal)}`,
    `📝 Transactions   ${txCount}`,
    `📅 Daily Average  ₹${fmt(dailyAvg)}`,
    vsLastLine ? `📈 ${vsLastLine}` : null,
    budgetLine ? `💰 ${budgetLine}` : null,
    div,
    `🏆 Top Categories`,
    catLines,
    div,
    `⚡ Biggest Expense`,
    `   ₹${fmt(biggest.amount)} - ${biggest.desc}`,
    `   ${formatDate(biggest.date)}`,
    div,
    `Tracked with FinTrack`,
  ]
    .filter(Boolean)
    .join("\n");

  if (navigator.share) {
    navigator
      .share({ title: `FinTrack - ${monthName}`, text: lines })
      .catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard
      .writeText(lines)
      .then(() => showToast("Summary copied to clipboard!", "success"))
      .catch(() => showToast("Could not copy.", "error"));
  } else {
    showToast("Sharing not supported.", "error");
  }
}

// =====================================================
// SORT BUTTONS
// =====================================================

document.querySelectorAll(".sort-btn[data-sort]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const newSort = btn.dataset.sort;

    // Toggle direction if clicking the active sort again
    if (activeSort === newSort) {
      activeSort =
        newSort === "date-desc"
          ? "date-asc"
          : newSort === "date-asc"
            ? "date-desc"
            : newSort === "amount-desc"
              ? "amount-asc"
              : "amount-desc";
    } else {
      activeSort = newSort;
    }

    document.querySelectorAll(".sort-btn[data-sort]").forEach((b) => {
      b.classList.remove("active");
      const icon = b.querySelector(".sort-icon");
      if (icon) {
        const isDate = b.dataset.sort.startsWith("date");
        const isAsc =
          (isDate && activeSort === "date-asc") ||
          (!isDate && activeSort === "amount-asc");
        icon.className =
          "fa-solid sort-icon " +
          (isDate
            ? isAsc
              ? "fa-arrow-up-short-wide"
              : "fa-arrow-down-short-wide"
            : isAsc
              ? "fa-arrow-up-wide-short"
              : "fa-arrow-down-wide-short");
      }
    });

    btn.classList.add("active");
    btn.dataset.sort = activeSort;
    renderExpenseList();
  });
});

// =====================================================
// CATEGORY DROPDOWN FILTER
// =====================================================

const catFilterBtn = document.getElementById("cat-filter-btn");
const catDropdown = document.getElementById("cat-dropdown");
const catChevron = document.getElementById("cat-chevron");

catFilterBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = catDropdown.style.display !== "none";
  catDropdown.style.display = isOpen ? "none" : "block";
  catChevron.style.transform = isOpen ? "" : "rotate(180deg)";
});

document.addEventListener("click", () => {
  catDropdown.style.display = "none";
  catChevron.style.transform = "";
});

catDropdown.addEventListener("click", (e) => e.stopPropagation());

document.querySelectorAll(".cat-drop-item").forEach((item) => {
  item.addEventListener("click", () => {
    activeFilter = item.dataset.filter;
    document
      .querySelectorAll(".cat-drop-item")
      .forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    document.getElementById("cat-filter-label").textContent =
      activeFilter === "all" ? "Category" : item.textContent.trim();
    catDropdown.style.display = "none";
    catChevron.style.transform = "";
    catFilterBtn.classList.toggle("active", activeFilter !== "all");
    renderExpenseList();
  });
});

// =====================================================
// SEARCH - debounced for performance
// =====================================================

let _searchDebounce = null;
document.getElementById("search-input").addEventListener("input", () => {
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(renderExpenseList, 200);
});

// =====================================================
// INSIGHTS - expandable detail cards
// =====================================================

function renderInsights() {
  const container = document.getElementById("insights-container");

  if (!expenses.length) {
    container.innerHTML = `
      <div class="insight-card">
        <div class="ins-icon" style="background:var(--primary-light);">
          <i class="fa-solid fa-lightbulb" style="color:var(--primary);"></i>
        </div>
        <div class="ins-body">
          <div class="ins-title">No data yet</div>
          <div class="ins-text">Start adding expenses to get useful insights about your spending.</div>
        </div>
      </div>`;
    return;
  }

  const now = new Date();
  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const cards = [];

  // ── Card 1: This Month ──────────────────────────────
  const thisMonthExp = expenses.filter((e) => {
    const d = new Date(e.date + "T00:00:00");
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const monthTotal = thisMonthExp.reduce((s, e) => s + e.amount, 0);
  const monthCount = thisMonthExp.length;
  const monthDays = new Set(thisMonthExp.map((e) => e.date)).size;
  const monthAvg = monthDays > 0 ? monthTotal / monthDays : 0;
  const monthCatTotals = {};
  thisMonthExp.forEach((e) => {
    monthCatTotals[e.cat] = (monthCatTotals[e.cat] || 0) + e.amount;
  });
  const monthTopCats = Object.entries(monthCatTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const monthMax = thisMonthExp.length
    ? thisMonthExp.reduce(
        (m, e) => (e.amount > m.amount ? e : m),
        thisMonthExp[0],
      )
    : null;

  cards.push({
    id: "month",
    icon: `<i class="fa-solid fa-calendar" style="color:#1565c0;"></i>`,
    iconBg: isDark() ? "#1e2f45" : "#e3f0fb",
    title: "This Month",
    text: `You logged <b>${monthCount}</b> expense${monthCount !== 1 ? "s" : ""} this month, totaling <b>₹${fmt(monthTotal)}</b>.`,
    tip:
      monthTotal > 10000
        ? "Over ₹10K this month - consider reviewing your spending."
        : "Spending looks balanced. Keep it up!",
    detail: () => {
      const rows = monthTopCats
        .map(([cat, amt]) => {
          const info = CAT[cat] || CAT.other;
          const pct =
            monthTotal > 0 ? ((amt / monthTotal) * 100).toFixed(1) : 0;
          return `<div class="ins-detail-row">
          <span class="ins-detail-label"><i class="${info.icon}"></i> ${info.label}</span>
          <div class="ins-detail-bar-wrap"><div class="ins-detail-bar" style="width:${pct}%"></div></div>
          <span class="ins-detail-val">₹${fmt(amt)} <span class="ins-detail-pct">${pct}%</span></span>
        </div>`;
        })
        .join("");
      const maxRow = monthMax
        ? `<div class="ins-detail-stat-row"><span>Biggest expense</span><span><b>₹${fmt(monthMax.amount)}</b> on ${escapeHtml(monthMax.desc)}</span></div>`
        : "";
      return `
        <div class="ins-detail-stats">
          <div class="ins-detail-stat-pill"><span class="idsp-label">Total</span><span class="idsp-val">₹${fmt(monthTotal)}</span></div>
          <div class="ins-detail-stat-pill"><span class="idsp-label">Expenses</span><span class="idsp-val">${monthCount}</span></div>
          <div class="ins-detail-stat-pill"><span class="idsp-label">Daily avg</span><span class="idsp-val">₹${fmt(monthAvg)}</span></div>
          <div class="ins-detail-stat-pill"><span class="idsp-label">Active days</span><span class="idsp-val">${monthDays}</span></div>
        </div>
        <div class="ins-detail-section-title">Top categories this month</div>
        <div class="ins-detail-rows">${rows || '<p class="ins-detail-empty">No category data</p>'}</div>
        ${maxRow ? `<div class="ins-detail-section-title" style="margin-top:12px;">Highlight</div><div class="ins-detail-rows">${maxRow}</div>` : ""}`;
    },
  });

  // ── Card 2: Top Category ────────────────────────────
  const catTotals = {};
  expenses.forEach((e) => {
    catTotals[e.cat] = (catTotals[e.cat] || 0) + e.amount;
  });
  const topCatEntry = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  if (topCatEntry) {
    const pct = ((topCatEntry[1] / grandTotal) * 100).toFixed(1);
    const catInfo = CAT[topCatEntry[0]] || CAT.other;
    const col =
      (isDark() ? CAT_COLORS_DARK : CAT_COLORS)[topCatEntry[0]] || "#616161";
    const iconBg = isDark()
      ? `color-mix(in srgb, ${col} 20%, var(--surface2))`
      : `${CAT_COLORS[topCatEntry[0]] || "#616161"}22`;

    const allCatsSorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const topCatItems = expenses
      .filter((e) => e.cat === topCatEntry[0])
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    cards.push({
      id: "topcat",
      icon: `<i class="${catInfo.icon}" style="color:${col};"></i>`,
      iconBg,
      title: "Top Spending Category",
      text: `Most of your money went into <b>${catInfo.label}</b> - about <b>${pct}%</b> of total spend.`,
      tip: `Check your ${catInfo.label} expenses - can you cut back?`,
      detail: () => {
        const catRows = allCatsSorted
          .map(([cat, amt]) => {
            const info = CAT[cat] || CAT.other;
            const p =
              grandTotal > 0 ? ((amt / grandTotal) * 100).toFixed(1) : 0;
            const isTop = cat === topCatEntry[0];
            const barCol =
              (isDark() ? CAT_COLORS_DARK : CAT_COLORS)[cat] || "#616161";
            return `<div class="ins-detail-row${isTop ? " ins-detail-row-highlight" : ""}">
            <span class="ins-detail-label"><i class="${info.icon}"></i> ${info.label}</span>
            <div class="ins-detail-bar-wrap"><div class="ins-detail-bar" style="width:${p}%;background:${barCol}"></div></div>
            <span class="ins-detail-val">₹${fmt(amt)} <span class="ins-detail-pct">${p}%</span></span>
          </div>`;
          })
          .join("");
        const recentRows = topCatItems
          .map(
            (e) =>
              `<div class="ins-detail-stat-row"><span>${escapeHtml(e.desc)} <small>${formatDate(e.date)}</small></span><span><b>₹${fmt(e.amount)}</b></span></div>`,
          )
          .join("");
        return `
          <div class="ins-detail-section-title">All categories breakdown</div>
          <div class="ins-detail-rows">${catRows}</div>
          <div class="ins-detail-section-title" style="margin-top:12px;">Top ${catInfo.label} expenses</div>
          <div class="ins-detail-rows">${recentRows || '<p class="ins-detail-empty">None yet</p>'}</div>`;
      },
    });
  }

  // ── Card 3: Weekly Trend ────────────────────────────
  const sevenAgo = new Date(now);
  sevenAgo.setDate(now.getDate() - 7);
  const fourteenAgo = new Date(now);
  fourteenAgo.setDate(now.getDate() - 14);
  const thisWeekItems = expenses.filter(
    (e) => new Date(e.date + "T00:00:00") >= sevenAgo,
  );
  const lastWeekItems = expenses.filter((e) => {
    const d = new Date(e.date + "T00:00:00");
    return d >= fourteenAgo && d < sevenAgo;
  });
  const thisWeek = thisWeekItems.reduce((s, e) => s + e.amount, 0);
  const lastWeek = lastWeekItems.reduce((s, e) => s + e.amount, 0);
  const weekDiff = thisWeek - lastWeek;

  if (thisWeek || lastWeek) {
    const increased = weekDiff > 0;
    const weekPct =
      lastWeek > 0 ? Math.abs((weekDiff / lastWeek) * 100).toFixed(0) : null;
    const dayMap = {};
    thisWeekItems.forEach((e) => {
      dayMap[e.date] = (dayMap[e.date] || 0) + e.amount;
    });
    const maxDay = Math.max(...Object.values(dayMap), 1);

    cards.push({
      id: "weekly",
      icon: increased
        ? `<i class="fa-solid fa-arrow-trend-up"   style="color:#c62828;"></i>`
        : `<i class="fa-solid fa-arrow-trend-down" style="color:#2e7d32;"></i>`,
      iconBg: increased
        ? isDark()
          ? "#2c0a0a"
          : "#ffebee"
        : isDark()
          ? "#0a1f0d"
          : "#e8f5e9",
      title: increased
        ? "Spending Increased"
        : weekDiff < 0
          ? "Spending Decreased"
          : "Spending Consistent",
      text:
        weekDiff === 0
          ? `Your spending stayed about the same this week at <b>₹${fmt(thisWeek)}</b>.`
          : increased
            ? `You spent <b>₹${fmt(thisWeek)}</b> this week, up from <b>₹${fmt(lastWeek)}</b> last week${weekPct ? ` <b>(+${weekPct}%)</b>` : ""}.`
            : `You reduced spending to <b>₹${fmt(thisWeek)}</b> from <b>₹${fmt(lastWeek)}</b> last week${weekPct ? ` <b>(−${weekPct}%)</b>` : ""}.`,
      tip: increased
        ? "Spending is up - try to cut back this week."
        : "Great work - spending is down!",
      detail: () => {
        const thisAvg =
          thisWeekItems.length > 0
            ? thisWeek /
              Math.max(new Set(thisWeekItems.map((e) => e.date)).size, 1)
            : 0;
        const dayRows = Object.entries(dayMap)
          .sort()
          .map(([date, amt]) => {
            const d = new Date(date + "T00:00:00");
            const dayLbl = d.toLocaleDateString("en-US", {
              weekday: "short",
              day: "numeric",
            });
            const pct = ((amt / maxDay) * 100).toFixed(0);
            return `<div class="ins-detail-row">
            <span class="ins-detail-label" style="min-width:80px;">${dayLbl}</span>
            <div class="ins-detail-bar-wrap"><div class="ins-detail-bar" style="width:${pct}%"></div></div>
            <span class="ins-detail-val">₹${fmt(amt)}</span>
          </div>`;
          })
          .join("");
        return `
          <div class="ins-detail-stats">
            <div class="ins-detail-stat-pill"><span class="idsp-label">This week</span><span class="idsp-val">₹${fmt(thisWeek)}</span></div>
            <div class="ins-detail-stat-pill"><span class="idsp-label">Last week</span><span class="idsp-val">₹${fmt(lastWeek)}</span></div>
            <div class="ins-detail-stat-pill"><span class="idsp-label">Change</span><span class="idsp-val" style="color:${weekDiff > 0 ? "var(--danger)" : "var(--success)"}">${weekDiff > 0 ? "+" : ""}${weekPct !== null ? weekPct + "%" : "-"}</span></div>
            <div class="ins-detail-stat-pill"><span class="idsp-label">Daily avg</span><span class="idsp-val">₹${fmt(thisAvg)}</span></div>
          </div>
          <div class="ins-detail-section-title">This week - day by day</div>
          <div class="ins-detail-rows">${dayRows || '<p class="ins-detail-empty">No spending this week</p>'}</div>`;
      },
    });
  }

  // ── Card 4: Largest Expense ─────────────────────────
  if (expenses.length) {
    const sorted = [...expenses].sort((a, b) => b.amount - a.amount);
    const max = sorted[0];
    const top5 = sorted.slice(0, 5);

    cards.push({
      id: "largest",
      icon: `<i class="fa-solid fa-sack-dollar" style="color:#e65100;"></i>`,
      iconBg: isDark() ? "#2b1d0a" : "#fff3e0",
      title: "Largest Expense",
      text: `Your biggest expense was <b>₹${fmt(max.amount)}</b> on <b>${escapeHtml(max.desc)}</b> on <b>${formatDate(max.date)}</b>.`,
      tip: "Plan ahead for big-ticket expenses.",
      detail: () => {
        const maxAmt = top5[0].amount;
        const totalPct =
          grandTotal > 0 ? ((max.amount / grandTotal) * 100).toFixed(1) : 0;
        const rows = top5
          .map((e, i) => {
            const info = CAT[e.cat] || CAT.other;
            const pct = ((e.amount / maxAmt) * 100).toFixed(0);
            return `<div class="ins-detail-row${i === 0 ? " ins-detail-row-highlight" : ""}">
            <span class="ins-detail-label"><i class="${info.icon}"></i> ${escapeHtml(e.desc)}</span>
            <div class="ins-detail-bar-wrap"><div class="ins-detail-bar" style="width:${pct}%"></div></div>
            <span class="ins-detail-val">₹${fmt(e.amount)}</span>
          </div>`;
          })
          .join("");
        return `
          <div class="ins-detail-stats">
            <div class="ins-detail-stat-pill"><span class="idsp-label">Amount</span><span class="idsp-val">₹${fmt(max.amount)}</span></div>
            <div class="ins-detail-stat-pill"><span class="idsp-label">Date</span><span class="idsp-val">${formatDate(max.date)}</span></div>
            <div class="ins-detail-stat-pill"><span class="idsp-label">Category</span><span class="idsp-val">${(CAT[max.cat] || CAT.other).label}</span></div>
            <div class="ins-detail-stat-pill"><span class="idsp-label">% of total</span><span class="idsp-val">${totalPct}%</span></div>
          </div>
          <div class="ins-detail-section-title">Top 5 biggest expenses</div>
          <div class="ins-detail-rows">${rows}</div>`;
      },
    });
  }

  // ── Card 5: 30-Day Daily Average ────────────────────
  const thirtyAgo = new Date(now);
  thirtyAgo.setDate(now.getDate() - 30);
  const last30 = expenses.filter(
    (e) => new Date(e.date + "T00:00:00") >= thirtyAgo,
  );

  if (last30.length) {
    const l30total = last30.reduce((s, e) => s + e.amount, 0);
    const l30days = new Set(last30.map((e) => e.date)).size;
    const l30avg = l30total / (l30days || 1);
    const weekBuckets = { "Week 1": 0, "Week 2": 0, "Week 3": 0, "Week 4": 0 };
    last30.forEach((e) => {
      const daysAgo = Math.floor(
        (now - new Date(e.date + "T00:00:00")) / 86400000,
      );
      if (daysAgo < 7) weekBuckets["Week 4"] += e.amount;
      else if (daysAgo < 14) weekBuckets["Week 3"] += e.amount;
      else if (daysAgo < 21) weekBuckets["Week 2"] += e.amount;
      else weekBuckets["Week 1"] += e.amount;
    });
    const maxWk = Math.max(...Object.values(weekBuckets), 1);

    cards.push({
      id: "avg",
      icon: `<i class="fa-solid fa-chart-column" style="color:#283593;"></i>`,
      iconBg: isDark() ? "#0a0d20" : "#e8eaf6",
      title: "30-Day Daily Average",
      text: `On average, you spent <b>₹${fmt(l30avg)}</b> per day over the last 30 days.`,
      tip:
        l30avg > 500
          ? "Daily spending is high - track small costs too."
          : "Daily spending looks under control.",
      detail: () => {
        const projMonth = l30avg * 30;
        const wkRows = Object.entries(weekBuckets)
          .map(([label, amt]) => {
            const pct = ((amt / maxWk) * 100).toFixed(0);
            const weekAvg = amt / 7;
            return `<div class="ins-detail-row">
            <span class="ins-detail-label">${label}</span>
            <div class="ins-detail-bar-wrap"><div class="ins-detail-bar" style="width:${pct}%"></div></div>
            <span class="ins-detail-val">₹${fmt(amt)} <span class="ins-detail-pct">avg ₹${fmt(weekAvg)}/d</span></span>
          </div>`;
          })
          .join("");
        return `
          <div class="ins-detail-stats">
            <div class="ins-detail-stat-pill"><span class="idsp-label">Daily avg</span><span class="idsp-val">₹${fmt(l30avg)}</span></div>
            <div class="ins-detail-stat-pill"><span class="idsp-label">30-day total</span><span class="idsp-val">₹${fmt(l30total)}</span></div>
            <div class="ins-detail-stat-pill"><span class="idsp-label">Active days</span><span class="idsp-val">${l30days}</span></div>
            <div class="ins-detail-stat-pill"><span class="idsp-label">Projected/mo</span><span class="idsp-val">₹${fmt(projMonth)}</span></div>
          </div>
          <div class="ins-detail-section-title">Weekly spending (last 30 days)</div>
          <div class="ins-detail-rows">${wkRows}</div>`;
      },
    });
  }

  // ── Card 6: Recurring Expenses ──────────────────────
  const descCount = {};
  expenses.forEach((e) => {
    const k = e.desc.toLowerCase().trim();
    descCount[k] = (descCount[k] || 0) + 1;
  });
  const recurring = Object.entries(descCount)
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])[0];

  if (recurring) {
    const recItems = expenses
      .filter((e) => e.desc.toLowerCase().trim() === recurring[0])
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const recAmt = recItems.reduce((s, e) => s + e.amount, 0);
    const recAvg = recAmt / recItems.length;
    const allRecurring = Object.entries(descCount)
      .filter(([, c]) => c >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    cards.push({
      id: "recurring",
      icon: `<i class="fa-solid fa-rotate" style="color:#6a1b9a;"></i>`,
      iconBg: isDark() ? "#200a2e" : "#f3e5f5",
      title: "Recurring Expense",
      text: `You spent on <b>"${escapeHtml(recurring[0])}"</b> ${recurring[1]} times, totaling <b>₹${fmt(recAmt)}</b>.`,
      tip: "Review this recurring expense - is it still necessary?",
      detail: () => {
        const recentRows = recItems
          .slice(0, 5)
          .map(
            (e) =>
              `<div class="ins-detail-stat-row"><span>${formatDate(e.date)}</span><span><b>₹${fmt(e.amount)}</b></span></div>`,
          )
          .join("");
        const allRecRows = allRecurring
          .map(([desc, count]) => {
            const total = expenses
              .filter((e) => e.desc.toLowerCase().trim() === desc)
              .reduce((s, e) => s + e.amount, 0);
            return `<div class="ins-detail-stat-row"><span><b>${escapeHtml(desc)}</b> <small>×${count}</small></span><span>₹${fmt(total)}</span></div>`;
          })
          .join("");
        return `
          <div class="ins-detail-stats">
            <div class="ins-detail-stat-pill"><span class="idsp-label">Occurrences</span><span class="idsp-val">${recItems.length}×</span></div>
            <div class="ins-detail-stat-pill"><span class="idsp-label">Total spent</span><span class="idsp-val">₹${fmt(recAmt)}</span></div>
            <div class="ins-detail-stat-pill"><span class="idsp-label">Avg per time</span><span class="idsp-val">₹${fmt(recAvg)}</span></div>
            <div class="ins-detail-stat-pill"><span class="idsp-label">Yearly est.</span><span class="idsp-val">₹${fmt(recAvg * 12)}</span></div>
          </div>
          <div class="ins-detail-section-title">Recent - "${escapeHtml(recurring[0])}"</div>
          <div class="ins-detail-rows">${recentRows}</div>
          <div class="ins-detail-section-title" style="margin-top:12px;">All recurring expenses</div>
          <div class="ins-detail-rows">${allRecRows}</div>`;
      },
    });
  }

  // ── Render all cards ────────────────────────────────
  container.innerHTML = cards
    .map(
      (c, i) => `
    <div class="insight-card ins-expandable" data-ins-id="${c.id}"
         style="animation-delay:${i * 0.06}s"
         role="button" tabindex="0" aria-expanded="false">
      <div class="ins-card-main">
        <div class="ins-icon" style="background:${c.iconBg};">${c.icon}</div>
        <div class="ins-body">
          <div class="ins-title-row">
            <div class="ins-title">${c.title}</div>
            <i class="fa-solid fa-chevron-down ins-chevron"></i>
          </div>
          <div class="ins-text">${c.text}</div>
          <div class="ins-tip">${c.tip}</div>
        </div>
      </div>
      <div class="ins-detail-panel">
        <div class="ins-detail-inner">${c.detail()}</div>
      </div>
    </div>`,
    )
    .join("");

  // Expand / collapse handlers
  container.querySelectorAll(".ins-expandable").forEach((card) => {
    const toggle = (e) => {
      if (e.target.closest("a")) return;
      const isOpen = card.classList.contains("ins-open");
      // Close all others first
      container
        .querySelectorAll(".ins-expandable.ins-open")
        .forEach((other) => {
          if (other !== card) {
            other.classList.remove("ins-open");
            other.setAttribute("aria-expanded", "false");
          }
        });
      card.classList.toggle("ins-open", !isOpen);
      card.setAttribute("aria-expanded", String(!isOpen));
      if (!isOpen)
        setTimeout(
          () => card.scrollIntoView({ behavior: "smooth", block: "nearest" }),
          80,
        );
    };
    card.addEventListener("click", toggle);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(e);
      }
    });
  });
}

// =====================================================
// CHARTS
// =====================================================

/** Reposition the sliding pill in the period switcher */
function updatePeriodPill() {
  const switcher = document.querySelector(".period-switcher");
  const activeBtn = switcher?.querySelector(".period-btn.active");
  if (!switcher || !activeBtn) return;
  const sr = switcher.getBoundingClientRect();
  const br = activeBtn.getBoundingClientRect();
  switcher.style.setProperty("--pill-left", br.left - sr.left + 4 + "px");
  switcher.style.setProperty("--pill-width", br.width - 8 + "px");
}

document.querySelectorAll(".period-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".period-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activePeriod = parseInt(btn.dataset.period);
    updatePeriodPill();
    renderCharts();
  });
});

function renderCharts() {
  renderTrendChart();
  renderCategoryChart();
  renderWeeklyChart();
}

/** Returns common Chart.js style defaults based on current theme */
function getChartDefaults() {
  const dark = isDark();
  return {
    gridColor: dark ? "rgba(255,255,255,0.04)" : "rgba(21,101,192,0.06)",
    tickColor: dark ? "#586779" : "#8899a8",
    tooltipBg: dark ? "#1c2230" : "#ffffff",
    tooltipBorder: dark ? "#2a3549" : "#e0e8f5",
    tooltipTitle: dark ? "#e6edf5" : "#0f1923",
    tooltipBody: dark ? "#99aabb" : "#4a5568",
    lineColor: dark ? "#4d9fec" : "#1565c0",
    lineGrad0: dark ? "rgba(77,159,236,0.28)" : "rgba(21,101,192,0.22)",
    lineGrad1: dark ? "rgba(77,159,236,0.00)" : "rgba(21,101,192,0.00)",
  };
}

function renderTrendChart() {
  const data = getFiltered(activePeriod);
  const dailyMap = {};
  data.forEach((e) => {
    dailyMap[e.date] = (dailyMap[e.date] || 0) + e.amount;
  });

  const dates = Object.keys(dailyMap).sort();
  const amounts = dates.map((d) => dailyMap[d]);
  const labels = dates.map((d) => {
    const dt = new Date(d + "T00:00:00");
    return `${dt.getDate()} ${dt.toLocaleString("en-US", { month: "short" })}`;
  });

  const canvas = document.getElementById("trendChart");
  const emptyEl = document.getElementById("trendChart-empty");

  if (!dates.length) {
    // Nothing to plot for this period - destroy any existing chart and
    // show a clean empty state instead of an empty/broken canvas.
    chartTrend?.destroy();
    chartTrend = null;
    canvas.style.display = "none";
    if (emptyEl) emptyEl.style.display = "flex";
    return;
  }
  canvas.style.display = "block";
  if (emptyEl) emptyEl.style.display = "none";

  const ctx = canvas.getContext("2d");
  const defs = getChartDefaults();
  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, defs.lineGrad0);
  grad.addColorStop(1, defs.lineGrad1);

  if (chartTrend) {
    chartTrend.data.labels = labels;
    chartTrend.data.datasets[0].data = amounts;
    chartTrend.data.datasets[0].borderColor = defs.lineColor;
    chartTrend.data.datasets[0].backgroundColor = grad;
    chartTrend.data.datasets[0].pointBackgroundColor = defs.lineColor;
    chartTrend.data.datasets[0].pointRadius = amounts.length > 20 ? 2 : 4;
    chartTrend.options.scales.x.ticks.color = defs.tickColor;
    chartTrend.options.scales.y.ticks.color = defs.tickColor;
    chartTrend.options.scales.y.grid.color = defs.gridColor;
    chartTrend.options.plugins.tooltip.backgroundColor = defs.tooltipBg;
    chartTrend.options.plugins.tooltip.borderColor = defs.tooltipBorder;
    chartTrend.options.plugins.tooltip.titleColor = defs.tooltipTitle;
    chartTrend.options.plugins.tooltip.bodyColor = defs.tooltipBody;
    chartTrend.update();
    return;
  }

  chartTrend = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Spent (₹)",
          data: amounts,
          borderColor: defs.lineColor,
          backgroundColor: grad,
          fill: true,
          tension: 0.42,
          pointRadius: amounts.length > 20 ? 2 : 4,
          pointHoverRadius: 7,
          pointBackgroundColor: defs.lineColor,
          borderWidth: 2.5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: defs.tooltipBg,
          borderColor: defs.tooltipBorder,
          borderWidth: 1,
          titleColor: defs.tooltipTitle,
          bodyColor: defs.tooltipBody,
          padding: 12,
          cornerRadius: 12,
          displayColors: false,
          titleFont: { family: "SUSE", weight: "800", size: 12 },
          bodyFont: { family: "SUSE", size: 13 },
          callbacks: {
            title: (items) => items[0].label,
            label: (i) => `  Spent: ₹${fmt(i.raw)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10, family: "SUSE" },
            color: defs.tickColor,
            maxTicksLimit: 8,
          },
          border: { display: false },
        },
        y: {
          grid: { color: defs.gridColor },
          ticks: {
            font: { size: 10, family: "SUSE" },
            color: defs.tickColor,
            callback: (v) => `₹${v >= 1000 ? (v / 1000).toFixed(1) + "K" : v}`,
          },
          border: { display: false },
          beginAtZero: true,
        },
      },
    },
  });
}

function renderCategoryChart() {
  const data = getFiltered(activePeriod);
  const catMap = {};
  data.forEach((e) => {
    catMap[e.cat] = (catMap[e.cat] || 0) + e.amount;
  });

  const cats = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a]);
  const amounts = cats.map((c) => catMap[c]);
  const colors = cats.map((c) => getChartColors()[c] || "#616161");
  const labels = cats.map((c) => CAT[c]?.label || c);

  const canvas = document.getElementById("categoryChart");
  const emptyEl = document.getElementById("categoryChart-empty");

  if (!cats.length) {
    document.getElementById("category-legend").innerHTML = "";
    chartCategory?.destroy();
    chartCategory = null;
    canvas.style.display = "none";
    if (emptyEl) emptyEl.style.display = "flex";
    return;
  }
  canvas.style.display = "block";
  if (emptyEl) emptyEl.style.display = "none";

  const defs = getChartDefaults();
  const ctx = canvas.getContext("2d");
  const borderCol = isDark() ? "#1c2230" : "#fff";

  if (chartCategory) {
    chartCategory.data.labels = labels;
    chartCategory.data.datasets[0].data = amounts;
    chartCategory.data.datasets[0].backgroundColor = colors;
    chartCategory.data.datasets[0].borderColor = borderCol;
    chartCategory.options.plugins.tooltip.backgroundColor = defs.tooltipBg;
    chartCategory.options.plugins.tooltip.borderColor = defs.tooltipBorder;
    chartCategory.options.plugins.tooltip.titleColor = defs.tooltipTitle;
    chartCategory.options.plugins.tooltip.bodyColor = defs.tooltipBody;
    chartCategory.update();
  } else {
    chartCategory = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: amounts,
            backgroundColor: colors,
            borderWidth: 3,
            borderColor: borderCol,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: defs.tooltipBg,
            borderColor: defs.tooltipBorder,
            borderWidth: 1,
            titleColor: defs.tooltipTitle,
            bodyColor: defs.tooltipBody,
            padding: 12,
            cornerRadius: 12,
            displayColors: true,
            boxWidth: 10,
            boxHeight: 10,
            boxPadding: 4,
            titleFont: { family: "SUSE", weight: "800", size: 12 },
            bodyFont: { family: "SUSE", size: 13 },
            callbacks: {
              label: (i) => {
                const total = amounts.reduce((a, b) => a + b, 0);
                const pct = total ? ((i.raw / total) * 100).toFixed(1) : 0;
                return `  ₹${fmt(i.raw)}  (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  // Rebuild legend
  document.getElementById("category-legend").innerHTML = cats
    .map(
      (c, i) => `
    <div class="cat-legend-item">
      <div class="cat-legend-dot" style="background:${colors[i]};"></div>
      <span>${labels[i]}</span>
    </div>`,
    )
    .join("");
}

function renderWeeklyChart() {
  const now = new Date();

  // Find the Monday of the current calendar week
  const daysFromMonday = (now.getDay() + 6) % 7;
  const thisMonday = new Date(now);
  thisMonday.setHours(0, 0, 0, 0);
  thisMonday.setDate(now.getDate() - daysFromMonday);

  // Build 8 Mon-Sun calendar weeks, oldest first
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(thisMonday);
    weekStart.setDate(thisMonday.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const mo = weekStart.toLocaleString("en-US", { month: "short" });
    const label = `${weekStart.getDate()} ${mo}`;

    const weekItems = expenses.filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      return d >= weekStart && d <= weekEnd;
    });
    weeks.push({
      label,
      total: weekItems.reduce((s, e) => s + e.amount, 0),
      count: weekItems.length,
    });
  }

  const currentWeek = weeks[weeks.length - 1];
  const prevWeek = weeks[weeks.length - 2];
  const weekDiff = currentWeek.total - prevWeek.total;
  const weekDiffPct =
    prevWeek.total > 0 ? ((weekDiff / prevWeek.total) * 100).toFixed(0) : null;

  document.getElementById("weekly-summary").innerHTML = `
    <div class="weekly-stat-pill">
      <span class="pill-label">This Week</span>
      <span class="pill-val">${fmtCompact(currentWeek.total)}</span>
    </div>
    <div class="weekly-stat-pill">
      <span class="pill-label">Last Week</span>
      <span class="pill-val">${fmtCompact(prevWeek.total)}</span>
    </div>
    <div class="weekly-stat-pill ${weekDiff > 0 ? "pill-up" : weekDiff < 0 ? "pill-down" : ""}">
      <span class="pill-label">Change</span>
      <span class="pill-val">${weekDiff > 0 ? "+" : ""}${weekDiffPct !== null ? weekDiffPct + "%" : "-"}</span>
    </div>
    <div class="weekly-stat-pill">
      <span class="pill-label">Records</span>
      <span class="pill-val">${currentWeek.count}</span>
    </div>`;

  const maxVal = Math.max(...weeks.map((w) => w.total));
  const canvas = document.getElementById("weeklyChart");
  const emptyEl = document.getElementById("weeklyChart-empty");

  if (maxVal === 0) {
    // No expenses at all across the last 8 weeks - show empty state instead
    // of a flat, all-zero bar chart.
    chartWeekly?.destroy();
    chartWeekly = null;
    canvas.style.display = "none";
    if (emptyEl) emptyEl.style.display = "flex";
    return;
  }
  canvas.style.display = "block";
  if (emptyEl) emptyEl.style.display = "none";

  const defs = getChartDefaults();
  const ctx = canvas.getContext("2d");
  const primary = isDark() ? "#4d9fec" : "#1565c0";
  const muted = isDark() ? "#2a3f5e" : "#c0d6f0";

  const barColors = weeks.map((w, i) => {
    if (i === weeks.length - 1) return primary; // current week
    if (w.total === maxVal && maxVal > 0)
      return isDark() ? "#f07070" : "#e57373"; // highest
    return muted;
  });

  if (chartWeekly) {
    chartWeekly.data.labels = weeks.map((w) => w.label);
    chartWeekly.data.datasets[0].data = weeks.map((w) => w.total);
    chartWeekly.data.datasets[0].backgroundColor = barColors;
    chartWeekly.options.scales.x.ticks.color = defs.tickColor;
    chartWeekly.options.scales.y.ticks.color = defs.tickColor;
    chartWeekly.options.scales.y.grid.color = defs.gridColor;
    chartWeekly.options.plugins.tooltip.backgroundColor = defs.tooltipBg;
    chartWeekly.options.plugins.tooltip.borderColor = defs.tooltipBorder;
    chartWeekly.options.plugins.tooltip.titleColor = defs.tooltipTitle;
    chartWeekly.options.plugins.tooltip.bodyColor = defs.tooltipBody;
    chartWeekly.update();
    return;
  }

  chartWeekly = new Chart(ctx, {
    type: "bar",
    data: {
      labels: weeks.map((w) => w.label),
      datasets: [
        {
          label: "Weekly Spend (₹)",
          data: weeks.map((w) => w.total),
          backgroundColor: barColors,
          borderRadius: 8,
          borderSkipped: false,
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: defs.tooltipBg,
          borderColor: defs.tooltipBorder,
          borderWidth: 1,
          titleColor: defs.tooltipTitle,
          bodyColor: defs.tooltipBody,
          padding: 12,
          cornerRadius: 12,
          displayColors: false,
          titleFont: { family: "SUSE", weight: "800", size: 12 },
          bodyFont: { family: "SUSE", size: 13 },
          callbacks: {
            title: (items) =>
              weeks[items[0].dataIndex]?.label + " (Mon–Sun)" ?? "",
            label: (i) => `  Total: ₹${fmt(i.raw)}`,
            afterLabel: (i) =>
              `  ${weeks[i.dataIndex].count} transaction${weeks[i.dataIndex].count !== 1 ? "s" : ""}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, family: "SUSE" }, color: defs.tickColor },
          border: { display: false },
        },
        y: {
          grid: { color: defs.gridColor },
          ticks: {
            font: { size: 10, family: "SUSE" },
            color: defs.tickColor,
            callback: (v) => `₹${v >= 1000 ? (v / 1000).toFixed(1) + "K" : v}`,
          },
          border: { display: false },
          beginAtZero: true,
        },
      },
      animation: { duration: 550, easing: "easeOutQuart" },
    },
  });
}

// Chart export buttons
document.getElementById("export-trend-chart").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = document.getElementById("trendChart").toDataURL("image/png");
  a.download = "FinTrack_Trend.png";
  a.click();
  showToast("Chart exported!", "info");
});

document.getElementById("export-donut-chart").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = document.getElementById("categoryChart").toDataURL("image/png");
  a.download = "FinTrack_Categories.png";
  a.click();
  showToast("Chart exported!", "info");
});

document.getElementById("export-weekly-chart").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = document.getElementById("weeklyChart").toDataURL("image/png");
  a.download = "FinTrack_Weekly.png";
  a.click();
  showToast("Chart exported!", "info");
});

// =====================================================
// STORAGE STATS
// =====================================================

function updateStorageStats() {
  const dataStr = localStorage.getItem("ft_expenses") || "[]";
  document.getElementById("usage-count").textContent = expenses.length;
  document.getElementById("usage-size").textContent =
    (new Blob([dataStr]).size / 1024).toFixed(2) + " KB";

  let lsSize = 0;
  for (const k in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, k)) {
      lsSize += k.length + (localStorage.getItem(k) || "").length;
    }
  }
  document.getElementById("usage-ls").textContent =
    (lsSize / 1024).toFixed(2) + " KB";

  // Load saved budget value into field
  document.getElementById("budget-input").value =
    localStorage.getItem("ft_budget") || "";
}

// =====================================================
// ORIGINAL EXPORT PDF & JSON (All Time)
// =====================================================

document.getElementById("export-pdf").addEventListener("click", () => {
  if (!expenses.length) {
    showToast("No expenses to export.", "warning");
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const ml = 14,
      mr = 14,
      uw = pw - ml - mr;
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const now = new Date();

    const fmtR = (n) => `Rs. ${fmt(n)}`;
    const safeStr = (s) => s.replace(/[^\x00-\xFF]/g, "");

    const BLUE = [21, 101, 192],
      LGRAY = [245, 248, 255],
      LINE = [220, 220, 220];

    // Header
    doc
      .setFont("helvetica", "bold")
      .setFontSize(22)
      .setTextColor(...BLUE);
    doc.text("FinTrack", pw / 2, 18, { align: "center" });
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(120);
    doc.text("Expense Report", pw / 2, 25, { align: "center" });
    doc.setFontSize(9).setTextColor(140);
    doc.text(
      `Exported: ${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
      ml,
      32,
    );
    doc.setDrawColor(...LINE);
    doc.line(ml, 35, pw - mr, 35);

    // Stats computation
    const catTotalsP = {},
      dayTotalsP = {};
    expenses.forEach((e) => {
      catTotalsP[e.cat] = (catTotalsP[e.cat] || 0) + e.amount;
      dayTotalsP[e.date] = (dayTotalsP[e.date] || 0) + e.amount;
    });

    const topCatP = Object.entries(catTotalsP).sort((a, b) => b[1] - a[1])[0];
    const topDayP = Object.entries(dayTotalsP).sort((a, b) => b[1] - a[1])[0];
    const topCatLbl = topCatP
      ? `${(CAT[topCatP[0]] || CAT.other).label} (${fmtR(topCatP[1])})`
      : "-";
    const topDayLbl = topDayP
      ? `${formatDate(topDayP[0])} (${fmtR(topDayP[1])})`
      : "-";

    const avgDaily = (() => {
      if (expenses.length < 2) return total;
      const allMs = expenses.map((e) =>
        new Date(e.date + "T00:00:00").getTime(),
      );
      const span = Math.min(
        Math.round((Math.max(...allMs) - Math.min(...allMs)) / 86400000) + 1,
        90,
      );
      return total / (span || 1);
    })();

    const stats = [
      { label: "TOTAL EXPENSES", value: String(expenses.length) },
      { label: "TOTAL AMOUNT SPENT", value: fmtR(total) },
      { label: "DAILY AVERAGE (90 DAYS)", value: fmtR(avgDaily) },
      { label: "HIGHEST SPEND CATEGORY", value: topCatLbl },
      { label: "HIGHEST SPEND DAY", value: topDayLbl },
    ];

    const cardGap = 5,
      cardW = (uw - cardGap) / 2,
      cardH = 20,
      rowGap = 4;
    const startY = 40;

    stats.forEach((s, i) => {
      const col = i % 2,
        row = Math.floor(i / 2);
      const cx = ml + col * (cardW + cardGap);
      const cy = startY + row * (cardH + rowGap);

      doc.setFillColor(255, 255, 255).setDrawColor(210, 220, 235);
      doc.roundedRect(cx, cy, cardW, cardH, 2, 2, "FD");
      doc.setFillColor(...BLUE).rect(cx, cy, 3, cardH, "F");

      const textX = cx + 3 + 4;
      const maxVW = cardW - 3 - 8;

      doc
        .setFont("helvetica", "normal")
        .setFontSize(6.8)
        .setTextColor(110, 130, 155);
      doc.text(s.label, textX, cy + 7);

      doc
        .setFont("helvetica", "bold")
        .setFontSize(10.5)
        .setTextColor(15, 25, 50);
      let vLines = doc.splitTextToSize(s.value, maxVW);
      if (vLines.length > 2) vLines = [vLines[0], vLines[1] + "…"];
      vLines.forEach((line, idx) =>
        doc.text(line, textX, cy + 10 + 3 + idx * 4),
      );
    });

    const tableStartY =
      startY + Math.ceil(stats.length / 2) * (cardH + rowGap) + 4;
    doc
      .setFont("helvetica", "bold")
      .setFontSize(9)
      .setTextColor(...BLUE);
    doc.text("TRANSACTION HISTORY", ml, tableStartY);
    doc
      .setDrawColor(...BLUE)
      .setLineWidth(0.6)
      .line(ml, tableStartY + 2, pw - mr, tableStartY + 2)
      .setLineWidth(0.2);

    const rows = [...expenses]
      .sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id,
      )
      .map((e) => [
        formatDate(e.date),
        safeStr(e.desc),
        (CAT[e.cat] || CAT.other).label,
        fmtR(e.amount),
      ]);

    doc.autoTable({
      startY: tableStartY + 6,
      head: [["Date", "Description", "Category", "Amount (INR)"]],
      body: rows,
      headStyles: {
        fillColor: BLUE,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      },
      alternateRowStyles: { fillColor: LGRAY },
      columnStyles: {
        0: { cellWidth: 26, halign: "center" },
        1: { cellWidth: "auto", halign: "center" },
        2: { cellWidth: 38, halign: "center" },
        3: { cellWidth: 38, halign: "center", fontStyle: "bold" },
      },
      styles: { overflow: "linebreak", lineColor: LINE, lineWidth: 0.15 },
      margin: { left: ml, right: mr, bottom: 32 },
    });

    // Footer on every page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(...LINE).line(ml, ph - 24, pw - mr, ph - 24);
      doc
        .setFontSize(9)
        .setTextColor(130)
        .text("FinTrack - by AR.dev", ml, ph - 14);
      doc.text(`Page ${i} of ${pageCount}`, pw / 2, ph - 14, {
        align: "center",
      });
      doc.setTextColor(...BLUE).textWithLink("AR.dev", pw - mr, ph - 14, {
        url: "https://ayushrathour.netlify.app",
        align: "right",
      });
    }

    doc.save("FinTrack_Expenses.pdf");
    showToast("PDF exported!", "info");
  } catch (err) {
    console.error(err);
    showToast("PDF export failed.", "error");
  }
});

document.getElementById("export-json").addEventListener("click", () => {
  if (!expenses.length) {
    showToast("No expenses to export.", "warning");
    return;
  }
  const blob = new Blob([JSON.stringify(expenses, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "FinTrack_Expenses.json";
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("JSON exported!", "info");
});

// =====================================================
// CUSTOM EXPORT MODAL & FILTERING LOGIC
// =====================================================

const exportModal = document.getElementById("export-modal");
const exportPeriodSelect = document.getElementById("export-period-select");
const exportCustomDatesWrap = document.getElementById(
  "export-custom-dates-wrap",
);
const exportStartDate = document.getElementById("export-start-date");
const exportEndDate = document.getElementById("export-end-date");
const exportCatSelect = document.getElementById("export-cat-select");
const exportPreviewCount = document.getElementById("export-preview-count");

function getFilteredExportData() {
  const period = exportPeriodSelect.value;
  const cat = exportCatSelect.value;
  const now = new Date();

  let filtered = [...expenses];

  if (period === "this-month") {
    filtered = filtered.filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });
  } else if (period === "last-month") {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    filtered = filtered.filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      return (
        d.getMonth() === lastMonth.getMonth() &&
        d.getFullYear() === lastMonth.getFullYear()
      );
    });
  } else if (period === "last-3-months") {
    // Calendar-aligned: from the 1st of the month 2 months back through today
    // (e.g. run in September -> Jul 1 - Sep 30), not a rolling "last 90 days".
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    filtered = filtered.filter((e) => new Date(e.date + "T00:00:00") >= cutoff);
  } else if (period === "this-year") {
    filtered = filtered.filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      return d.getFullYear() === now.getFullYear();
    });
  } else if (period === "last-year") {
    filtered = filtered.filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      return d.getFullYear() === now.getFullYear() - 1;
    });
  } else if (period === "custom") {
    const start = exportStartDate.value;
    const end = exportEndDate.value;
    if (start) {
      filtered = filtered.filter((e) => e.date >= start);
    }
    if (end) {
      filtered = filtered.filter((e) => e.date <= end);
    }
  }

  if (cat !== "all") {
    filtered = filtered.filter((e) => e.cat === cat);
  }

  return filtered;
}

function updateExportPreview() {
  const count = getFilteredExportData().length;
  exportPreviewCount.textContent = `Matching transactions: ${count}`;
}

exportPeriodSelect.addEventListener("change", () => {
  const isCustom = exportPeriodSelect.value === "custom";
  exportCustomDatesWrap.style.display = isCustom ? "grid" : "none";
  if (isCustom && !exportEndDate.value) {
    exportEndDate.value = today();
  }
  updateExportPreview();
});

exportStartDate.addEventListener("input", updateExportPreview);
exportEndDate.addEventListener("input", updateExportPreview);
exportCatSelect.addEventListener("change", updateExportPreview);

document.getElementById("custom-export").addEventListener("click", () => {
  if (!expenses.length) {
    showToast("No expenses to export.", "warning");
    return;
  }
  exportPeriodSelect.value = "this-month";
  exportCatSelect.value = "all";
  exportCustomDatesWrap.style.display = "none";
  exportStartDate.value = "";
  exportEndDate.value = "";
  updateExportPreview();
  exportModal.style.display = "flex";
});

document.getElementById("cancel-export").addEventListener("click", () => {
  exportModal.style.display = "none";
});

document.getElementById("confirm-export-pdf").addEventListener("click", () => {
  const filteredData = getFilteredExportData();
  if (!filteredData.length) {
    showToast("No expenses match the selected filters.", "warning");
    return;
  }
  exportModal.style.display = "none";
  generateCustomPDFReport(filteredData);
});

document.getElementById("confirm-export-json").addEventListener("click", () => {
  const filteredData = getFilteredExportData();
  if (!filteredData.length) {
    showToast("No expenses match the selected filters.", "warning");
    return;
  }
  exportModal.style.display = "none";

  const blob = new Blob([JSON.stringify(filteredData, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `FinTrack_Expenses_${exportPeriodSelect.value}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("Filtered JSON exported!", "info");
});

function generateCustomPDFReport(dataset) {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const ml = 14,
      mr = 14,
      uw = pw - ml - mr;
    const total = dataset.reduce((s, e) => s + e.amount, 0);
    const now = new Date();

    const fmtR = (n) => `Rs. ${fmt(n)}`;
    const safeStr = (s) => s.replace(/[^\x00-\xFF]/g, "");

    const BLUE = [21, 101, 192],
      LGRAY = [245, 248, 255],
      LINE = [220, 220, 220];

    doc
      .setFont("helvetica", "bold")
      .setFontSize(22)
      .setTextColor(...BLUE);
    doc.text("FinTrack", pw / 2, 18, { align: "center" });
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(120);
    doc.text("Custom Expense Report", pw / 2, 25, { align: "center" });
    doc.setFontSize(9).setTextColor(140);
    doc.text(
      `Exported: ${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
      ml,
      32,
    );
    doc.setDrawColor(...LINE);
    doc.line(ml, 35, pw - mr, 35);

    const catTotalsP = {},
      dayTotalsP = {};
    dataset.forEach((e) => {
      catTotalsP[e.cat] = (catTotalsP[e.cat] || 0) + e.amount;
      dayTotalsP[e.date] = (dayTotalsP[e.date] || 0) + e.amount;
    });

    const topCatP = Object.entries(catTotalsP).sort((a, b) => b[1] - a[1])[0];
    const topDayP = Object.entries(dayTotalsP).sort((a, b) => b[1] - a[1])[0];
    const topCatLbl = topCatP
      ? `${(CAT[topCatP[0]] || CAT.other).label} (${fmtR(topCatP[1])})`
      : "-";
    const topDayLbl = topDayP
      ? `${formatDate(topDayP[0])} (${fmtR(topDayP[1])})`
      : "-";

    const avgDaily = (() => {
      if (dataset.length < 2) return total;
      const allMs = dataset.map((e) =>
        new Date(e.date + "T00:00:00").getTime(),
      );
      const span = Math.min(
        Math.round((Math.max(...allMs) - Math.min(...allMs)) / 86400000) + 1,
        90,
      );
      return total / (span || 1);
    })();

    const stats = [
      { label: "MATCHING EXPENSES", value: String(dataset.length) },
      { label: "TOTAL AMOUNT SPENT", value: fmtR(total) },
      { label: "DAILY AVERAGE", value: fmtR(avgDaily) },
      { label: "TOP CATEGORY", value: topCatLbl },
      { label: "TOP SPEND DAY", value: topDayLbl },
    ];

    const cardGap = 5,
      cardW = (uw - cardGap) / 2,
      cardH = 20,
      rowGap = 4;
    const startY = 40;

    stats.forEach((s, i) => {
      const col = i % 2,
        row = Math.floor(i / 2);
      const cx = ml + col * (cardW + cardGap);
      const cy = startY + row * (cardH + rowGap);

      doc.setFillColor(255, 255, 255).setDrawColor(210, 220, 235);
      doc.roundedRect(cx, cy, cardW, cardH, 2, 2, "FD");
      doc.setFillColor(...BLUE).rect(cx, cy, 3, cardH, "F");

      const textX = cx + 3 + 4;
      const maxVW = cardW - 3 - 8;

      doc
        .setFont("helvetica", "normal")
        .setFontSize(6.8)
        .setTextColor(110, 130, 155);
      doc.text(s.label, textX, cy + 7);

      doc
        .setFont("helvetica", "bold")
        .setFontSize(10.5)
        .setTextColor(15, 25, 50);
      let vLines = doc.splitTextToSize(s.value, maxVW);
      if (vLines.length > 2) vLines = [vLines[0], vLines[1] + "…"];
      vLines.forEach((line, idx) =>
        doc.text(line, textX, cy + 10 + 3 + idx * 4),
      );
    });

    const tableStartY =
      startY + Math.ceil(stats.length / 2) * (cardH + rowGap) + 4;
    doc
      .setFont("helvetica", "bold")
      .setFontSize(9)
      .setTextColor(...BLUE);
    doc.text("TRANSACTION HISTORY", ml, tableStartY);
    doc
      .setDrawColor(...BLUE)
      .setLineWidth(0.6)
      .line(ml, tableStartY + 2, pw - mr, tableStartY + 2)
      .setLineWidth(0.2);

    const rows = [...dataset]
      .sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id,
      )
      .map((e) => [
        formatDate(e.date),
        safeStr(e.desc),
        (CAT[e.cat] || CAT.other).label,
        fmtR(e.amount),
      ]);

    doc.autoTable({
      startY: tableStartY + 6,
      head: [["Date", "Description", "Category", "Amount (INR)"]],
      body: rows,
      headStyles: {
        fillColor: BLUE,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      },
      alternateRowStyles: { fillColor: LGRAY },
      columnStyles: {
        0: { cellWidth: 26, halign: "center" },
        1: { cellWidth: "auto", halign: "center" },
        2: { cellWidth: 38, halign: "center" },
        3: { cellWidth: 38, halign: "center", fontStyle: "bold" },
      },
      styles: { overflow: "linebreak", lineColor: LINE, lineWidth: 0.15 },
      margin: { left: ml, right: mr, bottom: 32 },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(...LINE).line(ml, ph - 24, pw - mr, ph - 24);
      doc
        .setFontSize(9)
        .setTextColor(130)
        .text("FinTrack - by AR.dev", ml, ph - 14);
      doc.text(`Page ${i} of ${pageCount}`, pw / 2, ph - 14, {
        align: "center",
      });
      doc
        .setTextColor(...BLUE)
        .textWithLink("AR.dev", pw - mr, ph - 14, {
          url: "https://ayushrathour.netlify.app",
          align: "right",
        });
    }

    doc.save("FinTrack_Expenses_Filtered.pdf");
    showToast("Filtered PDF exported!", "info");
  } catch (err) {
    console.error(err);
    showToast("PDF export failed.", "error");
  }
}

// =====================================================
// IMPORT DATA
// =====================================================

const importFile = document.getElementById("import-file");
const importModal = document.getElementById("import-modal");
let pendingImports = [];

document.getElementById("import-data").addEventListener("click", () => {
  importFile.value = "";
  importFile.click();
});

/** Minimal RFC 4180-compliant CSV line parser */
function parseCSVLine(line) {
  const result = [];
  let cur = "",
    inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && line[i + 1] === '"') {
      cur += '"';
      i++;
    } else if (c === '"') {
      inQ = !inQ;
    } else if (c === "," && !inQ) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const ext = file.name.split(".").pop().toLowerCase();
  const reader = new FileReader();

  reader.onload = (ev) => {
    try {
      let imported = [];

      if (ext === "json") {
        imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) {
          showToast("Invalid JSON format.", "error");
          return;
        }
        imported = imported
          .map((x) => ({
            id: x.id || Date.now() + Math.random(),
            desc: x.desc || x.description || "",
            amount: Math.abs(parseFloat(x.amount) || 0),
            date: x.date || today(),
            cat: x.cat || "other",
          }))
          .filter((x) => x.desc && x.amount > 0);
      } else if (ext === "csv") {
        const rows = ev.target.result
          .split(/\r?\n/)
          .map((r) => r.trim())
          .filter((r) => r);
        if (rows.length <= 1) {
          showToast("CSV appears empty.", "error");
          return;
        }
        imported = rows
          .slice(1)
          .map((row) => {
            const [date, desc, amount, cat] = parseCSVLine(row);
            if (!date || !desc || !amount) return null;
            const amt = Math.abs(parseFloat(amount.replace(/[^0-9.\-]/g, "")));
            if (isNaN(amt) || amt <= 0) return null;
            return {
              id: Date.now() + Math.random(),
              date: new Date(date.trim()).toISOString().split("T")[0],
              desc: desc.replace(/(^"|"$)/g, "").trim(),
              amount: amt,
              cat: cat?.trim() || "other",
            };
          })
          .filter(Boolean);
      } else {
        showToast("Use .json or .csv files.", "error");
        return;
      }

      if (!imported.length) {
        showToast("No valid expenses found.", "warning");
        return;
      }

      pendingImports = imported;
      document.getElementById("import-summary").textContent =
        `${imported.length} expense${imported.length !== 1 ? "s" : ""} detected. Choose merge or replace.`;
      importModal.style.display = "flex";
    } catch (err) {
      console.error(err);
      showToast("Import failed.", "error");
    }
  };
  reader.readAsText(file);
});

document.getElementById("cancel-import").addEventListener("click", () => {
  importModal.style.display = "none";
  pendingImports = [];
});

document.getElementById("replace-data").addEventListener("click", () => {
  expenses = pendingImports;
  saveExpenses();
  importModal.style.display = "none";
  renderExpenseList();
  updateStats();
  showToast("Data replaced!", "success");
  pendingImports = [];
});

document.getElementById("merge-data").addEventListener("click", () => {
  let added = 0,
    skipped = 0;
  pendingImports.forEach((t) => {
    const dup = expenses.some(
      (x) =>
        x.date === t.date &&
        x.desc.toLowerCase() === t.desc.toLowerCase() &&
        x.amount === t.amount,
    );
    if (dup) skipped++;
    else {
      expenses.push(t);
      added++;
    }
  });
  saveExpenses();
  importModal.style.display = "none";
  renderExpenseList();
  updateStats();
  showToast(
    `${added} added, ${skipped} skipped.`,
    skipped > 0 ? "info" : "success",
  );
  pendingImports = [];
});

// =====================================================
// CONFIRM MODAL (promise-based)
// =====================================================

function openConfirm(title, msg) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirm-modal");
    document.getElementById("confirm-title").textContent = title;
    document.getElementById("confirm-msg").textContent = msg;
    modal.style.display = "flex";

    const ok = document.getElementById("confirm-ok-btn");
    const cancel = document.getElementById("confirm-cancel-btn");
    const close = (result) => {
      modal.style.display = "none";
      ok.removeEventListener("click", yes);
      cancel.removeEventListener("click", no);
      resolve(result);
    };
    const yes = () => close(true),
      no = () => close(false);
    ok.addEventListener("click", yes);
    cancel.addEventListener("click", no);
  });
}

// =====================================================
// CLEAR DATA
// =====================================================

document.getElementById("clear-data").addEventListener("click", async () => {
  const ok = await openConfirm(
    "Clear All Data",
    "This will permanently delete all recorded expenses and your PIN. This cannot be undone.",
  );
  if (ok) {
    localStorage.clear();
    showToast("App reset. All data cleared.", "warning");
    setTimeout(() => location.reload(), 800);
  }
});

// =====================================================
// BUDGET INPUT
// =====================================================

document.getElementById("budget-input").addEventListener("input", (e) => {
  const val = parseFloat(e.target.value);
  if (!isNaN(val) && val >= 0) localStorage.setItem("ft_budget", val);
  else localStorage.removeItem("ft_budget");

  // Re-compute bar with current month total
  const now = new Date();
  const monthTotal = expenses
    .filter((ex) => {
      const d = new Date(ex.date + "T00:00:00");
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((s, ex) => s + ex.amount, 0);
  updateBudgetBar(monthTotal);
  if (!isNaN(val) && val > 0) showToast("Budget updated!", "success");
});

// =====================================================
// SHARE SUMMARY
// =====================================================

document
  .getElementById("share-summary")
  .addEventListener("click", shareMonthlySummary);

// =====================================================
// PIN SYSTEM
// =====================================================

const PIN_LENGTH = 4;
let enteredPIN = "",
  pinMode = "unlock",
  setTempPIN = "";
let attempts = parseInt(localStorage.getItem("pinAttempts") || "0", 10);
let lockUntil = parseInt(localStorage.getItem("pinLockUntil") || "0", 10);

/** Returns or generates a persistent salt for PIN hashing */
function getPINSalt() {
  let salt = localStorage.getItem("ft_pin_salt");
  if (!salt) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    salt = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    localStorage.setItem("ft_pin_salt", salt);
  }
  return salt;
}

async function hashPIN(pin) {
  const salted = getPINSalt() + pin;
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(salted),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const savePIN = (hash) => localStorage.setItem("userPIN", hash);
const getPIN = () => localStorage.getItem("userPIN");
const removePIN = () => localStorage.removeItem("userPIN");
const persistLock = () => {
  localStorage.setItem("pinAttempts", attempts);
  localStorage.setItem("pinLockUntil", lockUntil || 0);
};
const clearLock = () => {
  attempts = 0;
  lockUntil = 0;
  localStorage.removeItem("pinAttempts");
  localStorage.removeItem("pinLockUntil");
};
const isLocked = () => lockUntil && Date.now() < lockUntil;

function openPinOverlay(mode = "unlock", hint = "") {
  pinMode = mode;
  setTempPIN = "";
  enteredPIN = "";
  updatePinDots();

  const titles = {
    unlock: "Secure Access",
    set: "Set New PIN",
    confirm_set: "Confirm PIN",
    change_verify: "Verify Current PIN",
    remove_verify: "Confirm Remove PIN",
  };
  const subs = {
    unlock: hint || "Enter your PIN to continue",
    set: "Enter a new 4-digit PIN",
    confirm_set: "Re-enter the new PIN to confirm",
    change_verify: "Enter your current PIN to change it",
    remove_verify: "Enter your current PIN to remove it",
  };

  document.getElementById("pin-title").textContent = titles[mode] || "PIN";
  document.getElementById("pin-subtitle").textContent = subs[mode] || hint;
  document.getElementById("pin-overlay").style.display = "flex";
  showPinMsg("");
}

function hidePinOverlay() {
  document.getElementById("pin-overlay").style.display = "none";
  enteredPIN = "";
  setTempPIN = "";
  updatePinDots();
}

function showPinMsg(msg) {
  const el = document.getElementById("pin-msg");
  el.innerHTML = msg;
  el.style.display = msg ? "block" : "none";
}

function updatePinDots() {
  document
    .querySelectorAll("#pin-dots span")
    .forEach((s, i) => s.classList.toggle("filled", i < enteredPIN.length));
}

function shakePin() {
  const b = document.querySelector(".pin-box");
  b.classList.add("shake");
  setTimeout(() => b.classList.remove("shake"), 380);
}

function startLockout() {
  lockUntil = Date.now() + 30000;
  persistLock();
  const r = document.getElementById("pin-retry-msg");
  r.style.display = "block";
  const iv = setInterval(() => {
    const rem = Math.ceil((lockUntil - Date.now()) / 1000);
    if (rem <= 0) {
      r.style.display = "none";
      clearInterval(iv);
      clearLock();
    } else r.textContent = `Locked. Try again in ${rem}s`;
  }, 1000);
}

function handleKeyInput(key) {
  if (isLocked()) return;
  if (/^\d$/.test(key)) {
    if (enteredPIN.length < PIN_LENGTH) {
      enteredPIN += key;
      updatePinDots();
      if (enteredPIN.length === PIN_LENGTH) setTimeout(processPIN, 180);
    }
  } else if (key === "clear") {
    enteredPIN = enteredPIN.slice(0, -1);
    updatePinDots();
  } else if (key === "submit") {
    if (enteredPIN.length === PIN_LENGTH) processPIN();
    else showPinMsg(`Enter ${PIN_LENGTH} digits`);
  }
}

async function processPIN() {
  if (isLocked()) return;
  const stored = getPIN();

  // Step 1 of set: capture new PIN
  if (pinMode === "set") {
    if (!/^\d{4}$/.test(enteredPIN)) {
      showPinMsg("PIN must be 4 digits");
      enteredPIN = "";
      updatePinDots();
      return;
    }
    setTempPIN = enteredPIN;
    enteredPIN = "";
    updatePinDots();
    pinMode = "confirm_set";
    document.getElementById("pin-title").textContent = "Confirm PIN";
    document.getElementById("pin-subtitle").textContent =
      "Re-enter new PIN to confirm";
    showPinMsg("");
    return;
  }

  // Step 2 of set: confirm new PIN
  if (pinMode === "confirm_set") {
    if (enteredPIN === setTempPIN) {
      savePIN(await hashPIN(enteredPIN));
      clearLock();
      showToast("PIN set!", "success");
      hidePinOverlay();
    } else {
      shakePin();
      showPinMsg("PINs did not match. Try again.");
      enteredPIN = "";
      setTempPIN = "";
      updatePinDots();
      pinMode = "set";
      document.getElementById("pin-title").textContent = "Set New PIN";
      document.getElementById("pin-subtitle").textContent =
        "Enter a new 4-digit PIN";
    }
    return;
  }

  // Verify current PIN for change / remove flows
  const hashed = await hashPIN(enteredPIN);

  if (pinMode === "change_verify") {
    if (!stored) {
      hidePinOverlay();
      return;
    }
    if (hashed === stored) {
      enteredPIN = "";
      updatePinDots();
      pinMode = "set";
      document.getElementById("pin-title").textContent = "Set New PIN";
      document.getElementById("pin-subtitle").textContent =
        "Enter a new 4-digit PIN";
      showPinMsg("");
    } else {
      attempts++;
      persistLock();
      shakePin();
      if (attempts >= 3) {
        startLockout();
        showToast("Locked for 30s.", "warning");
      } else showPinMsg("Wrong PIN");
      enteredPIN = "";
      updatePinDots();
    }
    return;
  }

  if (pinMode === "remove_verify") {
    if (!stored) {
      hidePinOverlay();
      return;
    }
    if (hashed === stored) {
      removePIN();
      clearLock();
      showToast("PIN removed.", "success");
      hidePinOverlay();
    } else {
      attempts++;
      persistLock();
      shakePin();
      if (attempts >= 3) {
        startLockout();
        showToast("Locked for 30s.", "warning");
      } else showPinMsg("Wrong PIN");
      enteredPIN = "";
      updatePinDots();
    }
    return;
  }

  // Default: unlock
  if (!stored) {
    hidePinOverlay();
    return;
  }
  if (hashed === stored) {
    clearLock();
    document.querySelector(".pin-box").classList.add("success-flash");
    setTimeout(hidePinOverlay, 280);
    showToast("Unlocked!", "success");
  } else {
    attempts++;
    persistLock();
    shakePin();
    if (attempts >= 3) {
      startLockout();
      showToast("Locked for 30s.", "warning");
    } else showPinMsg("Wrong PIN");
    enteredPIN = "";
    updatePinDots();
  }
}

// PIN keypad - handle both click and touchend for reliability on iOS
document.querySelectorAll(".pin-key").forEach((btn) => {
  const handler = (e) => {
    e.preventDefault();
    const k = btn.dataset.key || btn.dataset.action;
    if (k) handleKeyInput(k);
  };
  btn.addEventListener("click", handler);
  btn.addEventListener("touchend", handler, { passive: false });
});

// Physical keyboard support when overlay is visible
window.addEventListener("keydown", (e) => {
  if (document.getElementById("pin-overlay").style.display === "none") return;
  if (e.key >= "0" && e.key <= "9") handleKeyInput(e.key);
  else if (e.key === "Backspace" || e.key === "Delete") handleKeyInput("clear");
  else if (e.key === "Enter") handleKeyInput("submit");
});

// PIN settings buttons
document.getElementById("set-pin").addEventListener("click", () => {
  openPinOverlay(getPIN() ? "change_verify" : "set");
});

document.getElementById("remove-pin").addEventListener("click", () => {
  if (!getPIN()) {
    showToast("No PIN set.", "info");
    return;
  }
  openPinOverlay("remove_verify");
});

// =====================================================
// AUTO-LOCK (Inactivity Timer)
// =====================================================

let idleTimer;

function resetIdle() {
  clearTimeout(idleTimer);
  if (AUTO_LOCK === 0) return;
  idleTimer = setTimeout(() => {
    if (
      getPIN() &&
      document.getElementById("pin-overlay").style.display === "none"
    ) {
      openPinOverlay("unlock", "⚠ App locked due to inactivity");
    }
  }, AUTO_LOCK);
}

["mousemove", "keydown", "touchstart", "click", "scroll"].forEach((ev) =>
  window.addEventListener(ev, resetIdle, { passive: true }),
);
resetIdle();

// =====================================================
// RESPONSIVE PILL POSITIONS - recalculate on resize
// =====================================================

window.addEventListener(
  "resize",
  () => {
    updatePeriodPill();
    updateTimerPill();
    updateTabPill();
  },
  { passive: true },
);

// =====================================================
// INITIALISATION
// =====================================================

window.addEventListener("load", () => {
  // Set today's date as default
  document.getElementById("exp-date").value = today();

  // Init subsystems
  initThemeToggle();
  initTimerSegments();
  initInputEnhancements();
  initScrollReveal();
  initTabNavElevation();
  attachRipples();

  // Init sliding pill positions after layout is ready
  setTimeout(() => {
    updatePeriodPill();
    updateTimerPill();
    updateTabPill();
  }, 100);

  // Initial render
  renderExpenseList();
  updateStats();

  // Show PIN overlay if one is set
  if (getPIN()) openPinOverlay("unlock");
  if (isLocked()) startLockout();
});