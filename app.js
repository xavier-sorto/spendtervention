(function () {
  "use strict";

  const STORE_KEY = "spendtervention:v1";

  const CATEGORIES = [
    { id: "food", label: "Food & takeout", emoji: "🍔" },
    { id: "nightlife", label: "Going out", emoji: "🍻" },
    { id: "clothes", label: "Clothes & shoes", emoji: "👟" },
    { id: "tech", label: "Tech & gadgets", emoji: "🎧" },
    { id: "gaming", label: "Gaming", emoji: "🎮" },
    { id: "subscriptions", label: "Subscriptions", emoji: "📺" },
    { id: "dating", label: "Dates", emoji: "🌹" },
    { id: "online", label: "Late-night online shopping", emoji: "📦" },
    { id: "hobbies", label: "Hobbies", emoji: "🎨" },
    { id: "essentials", label: "Essentials", emoji: "🧻" },
    { id: "other", label: "Other", emoji: "💸" },
  ];
  const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

  // ---------- State ----------
  const defaultState = () => ({
    profile: null,
    budget: null,
    purchases: [], // { id, item, cost, category, date (ISO), ignoredAdvice }
    savedByWalkingAway: 0,
    roastCount: 0,
  });

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
    } catch {
      return defaultState();
    }
  }
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable: app still works for this session */
    }
  }

  let state = load();
  let pendingCheck = null; // the item currently being judged

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const money = (n) =>
    "$" + (Math.round(n * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function startOfWeek(d = new Date()) {
    const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const offset = (s.getDay() + 6) % 7; // Monday = 0
    s.setDate(s.getDate() - offset);
    return s;
  }
  function startOfMonth(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  function totals() {
    const now = new Date();
    const wk = startOfWeek(now);
    const mo = startOfMonth(now);
    let week = 0, month = 0;
    const byDay = [0, 0, 0, 0, 0, 0, 0];
    for (const p of state.purchases) {
      const d = new Date(p.date);
      if (d >= mo && d.getMonth() === now.getMonth()) month += p.cost;
      if (d >= wk) {
        week += p.cost;
        byDay[(d.getDay() + 6) % 7] += p.cost;
      }
    }
    return { week, month, byDay };
  }

  function showError(form, msg) {
    const el = $(".form-error", form);
    el.textContent = msg || "";
    el.hidden = !msg;
  }

  // ---------- Views ----------
  const views = ["profile", "budget", "dashboard"];
  function show(view) {
    for (const v of views) $("#view-" + v).classList.toggle("hidden", v !== view);
    $("#settings-btn").classList.toggle("hidden", view !== "dashboard");
    if (view === "profile") fillProfileForm();
    if (view === "budget") fillBudgetForm();
    if (view === "dashboard") renderDashboard();
    window.scrollTo({ top: 0 });
  }

  // ---------- Step 1: profile ----------
  const profileForm = $("#profile-form");

  function buildWeaknessChips() {
    const wrap = $("#weakness-options");
    for (const c of CATEGORIES) {
      if (c.id === "essentials" || c.id === "other") continue;
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" name="weaknesses" value="${c.id}" /> ${c.emoji} ${c.label}`;
      wrap.appendChild(label);
    }
  }

  function fillProfileForm() {
    const p = state.profile;
    if (!p) return;
    const f = profileForm.elements;
    for (const key of ["name", "age", "relationship", "living", "work", "goal", "sore"]) f[key].value = p[key] || "";
    for (const box of profileForm.querySelectorAll('[name="weaknesses"]')) box.checked = p.weaknesses.includes(box.value);
    for (const r of profileForm.querySelectorAll('[name="intensity"]')) r.checked = r.value === String(p.intensity);
  }

  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = profileForm.elements;
    const data = {
      name: f.name.value.trim(),
      age: f.age.value,
      relationship: f.relationship.value,
      living: f.living.value,
      work: f.work.value,
      goal: f.goal.value,
      sore: f.sore.value.trim(),
      weaknesses: [...profileForm.querySelectorAll('[name="weaknesses"]:checked')].map((b) => b.value),
      intensity: Number(profileForm.querySelector('[name="intensity"]:checked').value),
    };
    if (!data.name) return showError(profileForm, "We need a name to roast.");
    if (!data.age || !data.relationship || !data.living || !data.work || !data.goal)
      return showError(profileForm, "Fill out every dropdown. No hiding.");
    showError(profileForm, "");
    state.profile = data;
    save();
    show(state.budget ? "dashboard" : "budget");
  });

  // ---------- Step 2: budget ----------
  const budgetForm = $("#budget-form");

  function fillBudgetForm() {
    if (!state.budget) return;
    budgetForm.elements.weekly.value = state.budget.weekly;
    budgetForm.elements.monthly.value = state.budget.monthly;
    updateBudgetHint();
  }

  function updateBudgetHint() {
    const w = parseFloat(budgetForm.elements.weekly.value);
    const m = parseFloat(budgetForm.elements.monthly.value);
    const hint = $("#budget-hint");
    if (w > 0 && m > 0 && w * 4 > m) {
      hint.textContent = `Heads up: ${money(w)}/week × 4 is more than ${money(m)}/month. The monthly limit will cut you off first.`;
      hint.hidden = false;
    } else if (w > 0 && m > 0 && w * 5 < m) {
      hint.textContent = `Your weekly limit is tight compared to the monthly one. Good. You need the supervision.`;
      hint.hidden = false;
    } else {
      hint.hidden = true;
    }
  }
  budgetForm.addEventListener("input", updateBudgetHint);
  $("#budget-back").addEventListener("click", () => show("profile"));

  budgetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const weekly = parseFloat(budgetForm.elements.weekly.value);
    const monthly = parseFloat(budgetForm.elements.monthly.value);
    if (!(weekly > 0) || !(monthly > 0)) return showError(budgetForm, "Both budgets need to be more than $0.");
    showError(budgetForm, "");
    state.budget = { weekly, monthly };
    save();
    show("dashboard");
  });

  // ---------- Dashboard ----------
  function fillCategorySelect(select) {
    select.innerHTML = CATEGORIES.map((c) => `<option value="${c.id}">${c.emoji} ${c.label}</option>`).join("");
  }

  function renderMeter(el, spent, budget) {
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    const fill = $(".meter-fill", el);
    fill.style.width = Math.min(pct, 100) + "%";
    fill.dataset.level = pct > 100 ? "over" : pct >= 75 ? "warn" : "ok";
    fill.toggleAttribute("data-empty", pct === 0);
    $(".meter-spent", el).textContent = `${money(spent)} of ${money(budget)}`;
    const left = $(".meter-left", el);
    const remaining = budget - spent;
    left.textContent = remaining >= 0 ? `${money(remaining)} left` : `${money(-remaining)} over`;
    left.classList.toggle("over", remaining < 0);
  }

  function renderWeekChart(byDay) {
    const chart = $("#week-chart");
    const pace = state.budget.weekly / 7;
    const max = Math.max(pace * 1.5, ...byDay) || 1;
    const todayIdx = (new Date().getDay() + 6) % 7;
    const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    chart.innerHTML =
      byDay
        .map((amt, i) => {
          const h = (amt / max) * 100;
          return `<div class="day${i === todayIdx ? " today" : ""}" title="${names[i]}: ${money(amt)}">
            ${amt > 0 ? `<span class="day-amt">${money(Math.round(amt))}</span>` : ""}
            <div class="day-bar${amt > pace ? " over" : ""}" style="height:${h}%"></div>
          </div>`;
        })
        .join("") + `<div class="pace-line" style="bottom:${(pace / max) * 100}%"></div>`;

    let labels = chart.nextElementSibling;
    if (!labels || !labels.classList.contains("day-labels")) {
      labels = document.createElement("div");
      labels.className = "day-labels";
      chart.after(labels);
    }
    labels.innerHTML = names.map((n, i) => `<span class="${i === todayIdx ? "today" : ""}">${n}</span>`).join("");
  }

  function renderHistory() {
    const list = $("#history");
    const items = [...state.purchases].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);
    $("#history-empty").hidden = items.length > 0;
    list.innerHTML = "";
    for (const p of items) {
      const c = catById[p.category] || catById.other;
      const li = document.createElement("li");
      const when = new Date(p.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      li.innerHTML = `
        <span class="h-emoji" aria-hidden="true">${c.emoji}</span>
        <div class="h-main">
          <div class="h-item"></div>
          <div class="h-meta">${c.label} · ${when}${p.ignoredAdvice ? '<span class="h-tag">IGNORED US</span>' : ""}</div>
        </div>
        <span class="h-cost">${money(p.cost)}</span>
        <button class="h-del" type="button" aria-label="Delete">✕</button>`;
      $(".h-item", li).textContent = p.item; // user text: never innerHTML
      $(".h-del", li).addEventListener("click", () => {
        state.purchases = state.purchases.filter((x) => x.id !== p.id);
        save();
        renderDashboard();
      });
      list.appendChild(li);
    }
  }

  function renderDashboard() {
    const { week, month, byDay } = totals();
    const { weekly, monthly } = state.budget;
    $("#greeting").textContent = greeting(week / weekly, month / monthly);
    renderMeter($("#week-meter"), week, weekly);
    renderMeter($("#month-meter"), month, monthly);
    renderWeekChart(byDay);

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate() + 1;
    $("#stat-daily").textContent = money(Math.max(0, Math.min((monthly - month) / daysLeft, weekly - week)));
    $("#stat-saved").textContent = money(state.savedByWalkingAway);
    $("#stat-roasts").textContent = state.roastCount;
    $("#stat-ignored").textContent = state.purchases.filter((p) => p.ignoredAdvice).length;
    renderHistory();
  }

  function greeting(weekPct, monthPct) {
    const name = state.profile.name;
    const worst = Math.max(weekPct, monthPct);
    if (worst > 1) return `${name}, you're over budget. We need to talk.`;
    if (worst >= 0.75) return `Careful, ${name}. You're running on fumes.`;
    if (worst > 0) return `Hey ${name}. So far, so... fine.`;
    return `Hey ${name}. Clean slate. Don't ruin it.`;
  }

  // ---------- The judgment ----------
  const checkForm = $("#check-form");
  const verdictEl = $("#verdict");

  function evaluate(cost, category) {
    const { week, month } = totals();
    const weekLeft = state.budget.weekly - week;
    const monthLeft = state.budget.monthly - month;
    const isEssential = category === "essentials";
    const isWeakness = state.profile.weaknesses.includes(category);
    const reasons = [];
    let over = 0;

    if (cost > monthLeft) {
      over = Math.max(over, cost - monthLeft);
      reasons.push(monthLeft <= 0
        ? `You've already blown this month's budget.`
        : `It's ${money(cost - monthLeft)} more than you have left this month (${money(monthLeft)}).`);
    }
    // Essentials only answer to the monthly budget.
    if (!isEssential && cost > weekLeft) {
      over = Math.max(over, cost - weekLeft);
      reasons.push(weekLeft <= 0
        ? `You've already blown this week's budget.`
        : `It's ${money(cost - weekLeft)} more than you have left this week (${money(weekLeft)}).`);
    }
    // Fits the budget, but it's a known weakness eating most of what's left.
    if (!reasons.length && isWeakness && cost > weekLeft * 0.5) {
      reasons.push(`It's a weakness category and would eat ${Math.round((cost / weekLeft) * 100)}% of what's left this week.`);
    }

    return { ok: reasons.length === 0, reasons, over, weekLeft, monthLeft, isWeakness };
  }

  checkForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const item = checkForm.elements.item.value.trim();
    const cost = parseFloat(checkForm.elements.cost.value);
    const category = checkForm.elements.category.value;
    if (!item) return showError(checkForm, "What are you trying to buy? Don't be shy.");
    if (!(cost > 0)) return showError(checkForm, "Enter a real price.");
    showError(checkForm, "");

    const result = evaluate(cost, category);
    pendingCheck = { item, cost, category, result };
    renderVerdict();
  });

  function renderVerdict() {
    const { item, cost, category, result } = pendingCheck;
    const head = $(".verdict-headline", verdictEl);
    const roastEl = $(".verdict-roast", verdictEl);
    const facts = $(".verdict-facts", verdictEl);
    const actions = $(".verdict-actions", verdictEl);

    verdictEl.classList.remove("hidden", "yes", "no", "shake");
    void verdictEl.offsetWidth; // restart animation
    facts.innerHTML = "";
    actions.innerHTML = "";

    if (result.ok) {
      const a = Roast.approve(state.profile);
      verdictEl.classList.add("yes");
      head.textContent = a.headline;
      roastEl.textContent = a.quip;
      roastEl.classList.remove("caps");
      addFact(`Leaves you ${money(result.weekLeft - (category === "essentials" ? 0 : cost))} this week and ${money(result.monthLeft - cost)} this month.`);
      addAction("Bought it", "btn-primary", () => commitPurchase(false));
      addAction("Never mind", "", () => walkAway(false));
    } else {
      const r = Roast.roast(state.profile, {
        item,
        cost: money(cost),
        over: result.over ? money(result.over) : "",
        categoryLabel: (catById[category] || catById.other).label,
        isWeakness: result.isWeakness,
      });
      state.roastCount++;
      save();
      $("#stat-roasts").textContent = state.roastCount;
      verdictEl.classList.add("no", "shake");
      head.textContent = r.headline;
      roastEl.textContent = r.line;
      roastEl.classList.toggle("caps", r.caps);
      result.reasons.forEach(addFact);
      addAction("You're right, I'll pass", "btn-primary", () => walkAway(true));
      addAction("Roast me again", "", () => renderVerdict());
      addAction("Buy it anyway", "btn-danger", () => commitPurchase(true));
    }

    function addFact(text) {
      const li = document.createElement("li");
      li.textContent = text;
      facts.appendChild(li);
    }
    function addAction(label, cls, fn) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn " + cls;
      b.textContent = label;
      b.addEventListener("click", fn);
      actions.appendChild(b);
    }
  }

  function commitPurchase(ignoredAdvice) {
    const { item, cost, category } = pendingCheck;
    state.purchases.push({ id: uid(), item, cost, category, date: new Date().toISOString(), ignoredAdvice });
    save();
    resetCheck();
    renderDashboard();
  }

  function walkAway(countSavings) {
    if (countSavings) state.savedByWalkingAway += pendingCheck.cost;
    save();
    resetCheck();
    renderDashboard();
  }

  function resetCheck() {
    pendingCheck = null;
    checkForm.reset();
    verdictEl.classList.add("hidden");
  }

  // ---------- Manual log ----------
  const logForm = $("#log-form");
  const logToggle = $("#log-toggle");
  logToggle.addEventListener("click", () => {
    const open = logForm.classList.toggle("hidden") === false;
    logToggle.setAttribute("aria-expanded", String(open));
    logToggle.textContent = open ? "Cancel" : "+ Log a purchase";
    if (open) logForm.elements.item.focus();
  });
  logForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const item = logForm.elements.item.value.trim();
    const cost = parseFloat(logForm.elements.cost.value);
    if (!item || !(cost > 0)) return;
    state.purchases.push({ id: uid(), item, cost, category: logForm.elements.category.value, date: new Date().toISOString(), ignoredAdvice: false });
    save();
    logForm.reset();
    logToggle.click();
    renderDashboard();
  });

  // ---------- Settings ----------
  const dialog = $("#settings-dialog");
  $("#settings-btn").addEventListener("click", () => dialog.showModal());
  dialog.addEventListener("click", (e) => {
    const action = e.target.dataset && e.target.dataset.action;
    if (e.target === dialog) return dialog.close(); // backdrop click
    if (!action) return;
    dialog.close();
    if (action === "edit-profile") show("profile");
    if (action === "edit-budget") show("budget");
    if (action === "reset" && confirm("Delete your profile, budgets and every purchase? This can't be undone.")) {
      state = defaultState();
      save();
      profileForm.reset();
      budgetForm.reset();
      show("profile");
    }
  });

  // ---------- Boot ----------
  buildWeaknessChips();
  fillCategorySelect($("#check-category"));
  fillCategorySelect($("#log-category"));
  show(!state.profile ? "profile" : !state.budget ? "budget" : "dashboard");
})();
