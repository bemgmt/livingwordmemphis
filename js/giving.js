/**
 * Giving flow: optional personal notes (browser-only until Supabase profile exists).
 * Official giving records: church office / Tithe.ly — not this list.
 */
(function () {
  var STORAGE_KEY = "lwm_personal_giving_log";
  var TITHELY_URL =
    "https://tithe.ly/give_new/www/#/tithely/give-one-time/6059493";

  var modal = document.getElementById("giving-modal");
  var amountInput = document.getElementById("giving-amount");
  var categorySelect = document.getElementById("giving-category");
  var categoryOther = document.getElementById("giving-category-other");
  var otherWrap = document.getElementById("giving-other-wrap");
  var logContainer = document.getElementById("giving-personal-log");

  function readLog() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeLog(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function openTithely() {
    window.open(TITHELY_URL, "_blank", "noopener,noreferrer");
  }

  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("giving-modal-open");
    if (amountInput) amountInput.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("giving-modal-open");
    if (amountInput) amountInput.value = "";
    if (categorySelect) categorySelect.value = "tithe";
    if (categoryOther) categoryOther.value = "";
    if (otherWrap) otherWrap.hidden = true;
  }

  function categoryLabel(value, otherText) {
    if (value === "other" && otherText) return "Other: " + otherText.trim();
    var labels = {
      tithe: "Tithe",
      offering: "Offering",
      missions: "Missions",
      building: "Building / facilities",
      other: "Other",
    };
    return labels[value] || value;
  }

  function saveEntryAndGo() {
    if (amountInput && typeof amountInput.reportValidity === "function") {
      if (!amountInput.reportValidity()) return;
    }
    var amount = amountInput ? parseFloat(amountInput.value, 10) : NaN;
    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      if (amountInput) amountInput.focus();
      return;
    }
    var cat = categorySelect ? categorySelect.value : "tithe";
    var other = categoryOther ? categoryOther.value.trim() : "";
    if (cat === "other" && !other) {
      if (categoryOther) categoryOther.focus();
      return;
    }

    var entries = readLog();
    entries.unshift({
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()),
      amount: amount,
      category: cat,
      categoryDetail: cat === "other" ? other : null,
      createdAt: new Date().toISOString(),
    });
    writeLog(entries);
    renderLog();
    closeModal();
    openTithely();
  }

  function removeEntry(id) {
    var entries = readLog().filter(function (e) {
      return e.id !== id;
    });
    writeLog(entries);
    renderLog();
  }

  function formatMoney(n) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch (e) {
      return iso;
    }
  }

  function renderLog() {
    if (!logContainer) return;
    var entries = readLog();
    if (entries.length === 0) {
      logContainer.innerHTML =
        '<p class="giving-log-empty">No personal notes saved on this device yet.</p>';
      return;
    }
    var html =
      '<ul class="giving-log-list" role="list">' +
      entries
        .map(function (e) {
          var label = categoryLabel(e.category, e.categoryDetail || "");
          return (
            "<li>" +
            '<span class="giving-log-meta">' +
            formatDate(e.createdAt) +
            "</span>" +
            '<span class="giving-log-amount">' +
            formatMoney(e.amount) +
            "</span>" +
            '<span class="giving-log-cat">' +
            escapeHtml(label) +
            "</span>" +
            '<button type="button" class="giving-log-remove" data-id="' +
            escapeAttr(e.id) +
            '" aria-label="Remove this note">Remove</button>' +
            "</li>"
          );
        })
        .join("") +
      "</ul>";
    logContainer.innerHTML = html;
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, "&quot;");
  }

  document.getElementById("giving-btn-yes-note")?.addEventListener("click", function () {
    openModal();
  });

  document.getElementById("giving-btn-no-tithely")?.addEventListener("click", function () {
    openTithely();
  });

  document.getElementById("giving-modal-cancel")?.addEventListener("click", function () {
    closeModal();
  });

  document.getElementById("giving-modal-proceed")?.addEventListener("click", function () {
    saveEntryAndGo();
  });

  categorySelect?.addEventListener("change", function () {
    if (otherWrap) otherWrap.hidden = categorySelect.value !== "other";
  });

  modal?.addEventListener("click", function (ev) {
    if (ev.target === modal) closeModal();
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && modal && !modal.hidden) closeModal();
  });

  logContainer?.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".giving-log-remove");
    if (btn && btn.dataset.id) removeEntry(btn.dataset.id);
  });

  renderLog();
})();