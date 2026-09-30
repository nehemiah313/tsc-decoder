/* TSC Criteria Decoder app logic.
   Core data functions are DOM-free so they can be verified under node.
*/
"use strict";

var SERIES_WHY = {
  CC1: "Tone at the top: if leadership does not live the controls, nothing below them holds up under audit.",
  CC2: "Controls only work when people know about them: who must be told what, inside and outside the company.",
  CC3: "You cannot control risks you never identified: this is the risk assessment discipline behind everything else.",
  CC4: "Controls decay without monitoring: someone has to check the checkers and track fixes to completion.",
  CC5: "Policies have to become procedures with owners, or they are shelfware an auditor will ignore.",
  CC6: "The technical heart of most audits: who can touch the system, and what stops the wrong hands.",
  CC7: "Day-to-day operations: finding weaknesses, watching for trouble, and responding when something hits.",
  CC8: "Most breaches trace to a bad change: this keeps changes intentional, tested, approved, and reviewed.",
  CC9: "The business does not stop for a disruption: continuity planning plus real vendor risk management.",
  A1: "If you promise uptime, you have to prove you can keep it: capacity planning, backups, and tested recovery.",
  PI1: "When customers rely on your processing being correct, you have to prove completeness, accuracy, and authorization at every step.",
  C1: "Customer secrets stay secret: identify confidential data, protect it while you hold it, destroy it when done.",
  P: "Personal information handled by the rules: notice, consent, purpose limits, individual rights, and breach accountability."
};

/* Pure: search criteria against a query. Returns matching criterion objects. */
function searchCriteria(criteria, query) {
  var q = (query || "").trim().toLowerCase();
  if (!q) return criteria.slice();
  return criteria.filter(function (c) {
    var hay = [c.id, c.title, c.summary, c.series_name, c.category,
      (c.typical_evidence || []).join(" ")].join(" ").toLowerCase();
    return hay.indexOf(q) !== -1;
  });
}

/* Pure: filter criteria by category, series, priority. */
function filterCriteria(criteria, category, series, priority) {
  return criteria.filter(function (c) {
    if (category && c.category !== category) return false;
    if (series && c.series !== series) return false;
    if (priority && c.priority !== priority) return false;
    return true;
  });
}

/* Pure: recommend in-scope categories from quiz answers.
   answers: {q1..q6} each "yes" | "no". Returns {categories: [...], reasoning: [...]} */
function recommendScope(answers) {
  var recs = [{ id: "Security", inScope: true,
    reason: "Always in scope. The Common Criteria (CC1 through CC9, 33 criteria) apply to every SOC 2 engagement." }];
  var reasoning = [];
  function add(cat, on, reason) {
    recs.push({ id: cat, inScope: on, reason: reason });
  }
  if (answers.q1 === "yes") {
    add("Availability", true, "You make uptime or availability commitments to customers, contracts, or SLAs, so auditors will test whether you can keep them.");
    reasoning.push("Availability is usually the first optional category SaaS and hosting companies add.");
  } else {
    add("Availability", false, "No uptime or availability commitments were indicated, so this category can likely stay out of scope.");
  }
  if (answers.q2 === "yes") {
    add("Processing Integrity", true, "Customers rely on your transactions, calculations, or reports being correct, so completeness, accuracy, and authorization must be proven.");
  } else {
    add("Processing Integrity", false, "Customers do not rely on your processing being correct, so this category can likely stay out of scope.");
  }
  if (answers.q3 === "yes") {
    add("Confidentiality", true, "You handle data customers call confidential, which must be identified, protected while held, and destroyed when done.");
  } else {
    add("Confidentiality", false, "No customer-confidential data handling was indicated, so this category can likely stay out of scope.");
  }
  if (answers.q4 === "yes") {
    add("Privacy", true, "You handle personal information about individuals, which triggers notice, consent, purpose-limitation, and breach-notification criteria (18 criteria).");
    reasoning.push("Privacy is the largest optional category at 18 criteria, so confirm with your CPA firm that the effort matches the business need.");
  } else {
    add("Privacy", false, "No personal information handling was indicated, so this category can likely stay out of scope.");
  }
  if (answers.q5 === "yes") {
    reasoning.push("As a SaaS or hosted provider, customers generally expect availability and confidentiality coverage even when it is not written into a contract yet.");
  }
  if (answers.q6 === "yes") {
    reasoning.push("Enterprise buyers and RFPs asking for SOC 2 usually accept Security-only reports to start; add optional categories as customer pressure grows.");
  } else {
    reasoning.push("With no current customer demand for SOC 2, consider whether a readiness effort now is the best use of budget, or wait for a contract to require it.");
  }
  return { categories: recs, reasoning: reasoning };
}

/* Export for node verification */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { searchCriteria: searchCriteria, filterCriteria: filterCriteria, recommendScope: recommendScope, SERIES_WHY: SERIES_WHY };
}

/* ---- Browser UI ---- */
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    fetch("data/tsc.json").then(function (r) { return r.json(); }).then(function (data) {
      init(data);
    });
  });

  function init(data) {
    var criteria = data.criteria;
    var categories = data.categories;

    /* Tabs */
    var tabs = document.querySelectorAll(".tab");
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
        document.getElementById("tab-" + t.getAttribute("data-tab")).classList.add("active");
      });
    });

    /* Series filter options */
    var seriesSel = document.getElementById("filter-series");
    Object.keys(data.series).forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s + " - " + data.series[s];
      seriesSel.appendChild(opt);
    });

    /* Explorer render */
    var searchEl = document.getElementById("search");
    var catSel = document.getElementById("filter-category");
    var priSel = document.getElementById("filter-priority");
    var resultsEl = document.getElementById("results");
    var countEl = document.getElementById("count");

    function currentList() {
      var list = filterCriteria(criteria, catSel.value, seriesSel.value, priSel.value);
      return searchCriteria(list, searchEl.value);
    }

    function render() {
      var list = currentList();
      countEl.textContent = "Showing " + list.length + " of " + criteria.length + " criteria.";
      resultsEl.innerHTML = "";
      list.forEach(function (c) {
        var card = document.createElement("div");
        card.className = "card";
        var reqBadge = categories[c.category].required
          ? '<span class="badge required">Required</span>'
          : '<span class="badge optional">Optional</span>';
        card.innerHTML =
          '<div class="cid">' + escapeHtml(c.id) + '</div>' +
          '<h3>' + escapeHtml(c.title) + '</h3>' +
          '<div class="meta"><span>' + escapeHtml(c.category) + '</span>' +
          '<span>' + escapeHtml(c.series + " - " + c.series_name) + '</span>' +
          '<span class="badge ' + c.priority + '">' + c.priority + '</span>' + reqBadge + '</div>' +
          '<div class="detail" hidden>' +
          '<dt>Plain English</dt><dd>' + escapeHtml(c.summary) + '</dd>' +
          '<dt>Why this series matters</dt><dd>' + escapeHtml(SERIES_WHY[c.series] || "") + '</dd>' +
          '<dt>Typical evidence</dt><dd><ul>' +
          c.typical_evidence.map(function (e) { return "<li>" + escapeHtml(e) + "</li>"; }).join("") +
          '</ul></dd>' +
          '</div>';
        card.addEventListener("click", function () {
          var d = card.querySelector(".detail");
          d.hidden = !d.hidden;
        });
        resultsEl.appendChild(card);
      });
    }
    [searchEl, catSel, seriesSel, priSel].forEach(function (el) {
      el.addEventListener("input", render);
    });
    render();

    /* Quiz */
    var form = document.getElementById("quiz-form");
    var resultEl = document.getElementById("quiz-result");
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem("tscdecoder") || "null"); } catch (e) {}
    if (saved && saved.answers) {
      Object.keys(saved.answers).forEach(function (k) {
        var r = form.querySelector('input[name="' + k + '"][value="' + saved.answers[k] + '"]');
        if (r) r.checked = true;
      });
    }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var answers = {};
      var ok = true;
      ["q1","q2","q3","q4","q5","q6"].forEach(function (k) {
        var r = form.querySelector('input[name="' + k + '"]:checked');
        if (!r) ok = false; else answers[k] = r.value;
      });
      if (!ok) {
        resultEl.hidden = false;
        resultEl.innerHTML = "<h3>Answer all six questions</h3><p>Every question needs a yes or no before the decoder can recommend a scope.</p>";
        return;
      }
      try { localStorage.setItem("tscdecoder", JSON.stringify({ answers: answers })); } catch (e) {}
      var rec = recommendScope(answers);
      var html = "<h3>Your recommended scope</h3><ul>";
      rec.categories.forEach(function (r) {
        html += '<li><span class="' + (r.inScope ? "rec-in" : "rec-out") + '">' +
          (r.inScope ? "IN SCOPE" : "Likely out") + "</span> <strong>" +
          escapeHtml(r.id) + "</strong>: " + escapeHtml(r.reason) + "</li>";
      });
      html += "</ul><h3>Notes</h3><ul>";
      rec.reasoning.forEach(function (n) { html += "<li>" + escapeHtml(n) + "</li>"; });
      html += "</ul><p><em>This is guidance, not a scoping decision. Confirm your engagement scope with a licensed CPA firm.</em></p>";
      resultEl.innerHTML = html;
      resultEl.hidden = false;
    });

    /* Compare view */
    var comp = document.getElementById("compare");
    var byCat = {};
    criteria.forEach(function (c) { byCat[c.category] = (byCat[c.category] || 0) + 1; });
    var max = Math.max.apply(null, Object.keys(byCat).map(function (k) { return byCat[k]; }));
    var rows = Object.keys(byCat).map(function (k) {
      var w = Math.round((byCat[k] / max) * 100);
      return "<tr><td>" + escapeHtml(k) + "</td><td>" + byCat[k] + "</td>" +
        '<td><div class="bar" style="width:' + w + '%"></div></td>' +
        "<td>" + (categories[k].required ? "Required" : "Optional") + "</td></tr>";
    }).join("");
    var seriesRows = Object.keys(data.series).map(function (s) {
      var n = criteria.filter(function (c) { return c.series === s; }).length;
      return "<tr><td>" + escapeHtml(s) + " - " + escapeHtml(data.series[s]) + "</td><td>" + n + "</td></tr>";
    }).join("");
    comp.innerHTML =
      "<h3>By category</h3><table><tr><th>Category</th><th>Criteria</th><th></th><th>Status</th></tr>" + rows + "</table>" +
      "<h3>By series</h3><table><tr><th>Series</th><th>Criteria</th></tr>" + seriesRows + "</table>";
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }
}
