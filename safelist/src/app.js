  // SafeList page logic. Rendering only; every decision above comes from core.js.
  const $ = (id) => document.getElementById(id);
  const stage = $("safelist");
  const views = { load: $("view-load"), review: $("view-review"), done: $("view-done") };
  const status = $("sl-status");
  const state = {
    phase: "load",
    send: null,
    supp: null,
    rules: { ...DEFAULT_RULES },
    origin: "crm",
    matchColumn: null,
    items: [],
    decisions: {},
    result: null,
    outputText: "",
    outputName: "",
    record: null
  };

  function announce(message) {
    status.textContent = "";
    window.setTimeout(() => { status.textContent = message; }, 10);
  }
  function setPhase(name) {
    Object.keys(views).forEach((key) => views[key].classList.toggle("hidden", key !== name));
    state.phase = name;
    stage.setAttribute("data-phase", name);
  }
  function baseName(name) { return String(name || "list").replace(/\.[^.]+$/, ""); }
  function plural(count, one, many) { return `${count} ${count === 1 ? one : (many || `${one}s`)}`; }
  function localStamp(date) {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* ---------- the two zones ---------- */

  const zones = {};
  ["send", "supp"].forEach((key) => {
    zones[key] = {
      el: $(`zone-${key}`),
      file: document.querySelector(`[data-file="${key}"]`),
      pasteBox: document.querySelector(`[data-paste-box="${key}"]`),
      textarea: $(`paste-${key}`),
      loadedBox: document.querySelector(`[data-loaded-box="${key}"]`),
      name: document.querySelector(`[data-name="${key}"]`),
      meta: document.querySelector(`[data-meta="${key}"]`),
      stale: document.querySelector(`[data-stale="${key}"]`),
      empty: $(`zone-${key}`).querySelector(".sl-empty-only")
    };
  });

  function loadInto(key, text, name, fileDate) {
    const list = loadList(text);
    if (!list.rows.length) { announce("That file has no rows."); return; }
    if (key === "send") {
      state.send = { name, text, fileDate, list };
      state.matchColumn = list.emailColumns.length ? list.emailColumns[0].index : null;
    } else {
      state.supp = { name, text, fileDate, list, parsed: parseSuppression(list, state.rules), stale: staleness(fileDate) };
    }
    renderZone(key);
    renderSetup();
    announce(`${name} loaded.`);
  }

  function clearZone(key) {
    state[key] = null;
    if (key === "send") state.matchColumn = null;
    renderZone(key);
    renderSetup();
  }

  function renderZone(key) {
    const zone = zones[key];
    const data = state[key];
    zone.el.setAttribute("data-loaded", data ? "true" : "false");
    zone.loadedBox.classList.toggle("hidden", !data);
    zone.pasteBox.classList.add("hidden");
    zone.empty.classList.toggle("hidden", Boolean(data));
    if (!data) return;
    zone.name.textContent = data.name;
    if (key === "send") {
      const columns = data.list.emailColumns;
      zone.meta.textContent = `${plural(data.list.rows.length, "row")} · ${plural(data.list.header.length, "column")} · ${columns.length ? `email column: ${columns[0].name}` : "no email column found"}`;
    } else {
      const parsed = data.parsed;
      zone.meta.textContent = `${plural(parsed.count, "address", "addresses")}${parsed.domainCount ? ` · ${plural(parsed.domainCount, "domain rule")}` : ""} · exported ${localStamp(data.fileDate)} (${data.stale.age})`;
      zone.stale.classList.toggle("hidden", !data.stale.blocked);
      zone.stale.textContent = data.stale.blocked
        ? `This suppression list is ${data.stale.age}. Opt-outs change every day. Request a fresh export and load that instead.`
        : "";
    }
  }

  document.querySelectorAll("[data-pick]").forEach((button) => {
    button.addEventListener("click", () => zones[button.dataset.pick].file.click());
  });
  document.querySelectorAll("[data-file]").forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      loadInto(input.dataset.file, await file.text(), file.name, new Date(file.lastModified));
      input.value = "";
    });
  });
  document.querySelectorAll("[data-paste]").forEach((button) => {
    button.addEventListener("click", () => {
      const zone = zones[button.dataset.paste];
      zone.pasteBox.classList.remove("hidden");
      zone.empty.classList.add("hidden");
      zone.textarea.focus();
    });
  });
  document.querySelectorAll("[data-paste-cancel]").forEach((button) => {
    button.addEventListener("click", () => {
      const zone = zones[button.dataset.pasteCancel];
      zone.pasteBox.classList.add("hidden");
      zone.empty.classList.remove("hidden");
    });
  });
  document.querySelectorAll("[data-paste-load]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.pasteLoad;
      const zone = zones[key];
      if (!zone.textarea.value.trim()) { zone.textarea.focus(); announce("Paste something first."); return; }
      loadInto(key, zone.textarea.value, key === "send" ? "pasted-send-list.csv" : "pasted-suppression-list.csv", new Date());
      zone.textarea.value = "";
    });
  });
  document.querySelectorAll("[data-change]").forEach((button) => {
    button.addEventListener("click", () => clearZone(button.dataset.change));
  });
  Object.keys(zones).forEach((key) => {
    const node = zones[key].el;
    ["dragenter", "dragover"].forEach((type) => node.addEventListener(type, (event) => { event.preventDefault(); node.classList.add("is-over"); }));
    ["dragleave", "drop"].forEach((type) => node.addEventListener(type, (event) => { event.preventDefault(); node.classList.remove("is-over"); }));
    node.addEventListener("drop", async (event) => {
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (!file) return;
      loadInto(key, await file.text(), file.name, new Date(file.lastModified));
    });
  });

  $("load-samples").addEventListener("click", () => {
    const now = new Date();
    loadInto("send", SAMPLES.send.text, SAMPLES.send.name, now);
    loadInto("supp", SAMPLES.supp.text, SAMPLES.supp.name, now);
  });

  /* ---------- setup rows ---------- */

  function renderSetup() {
    $("setup").classList.toggle("hidden", !state.send);
    $("check-one").classList.toggle("hidden", !state.supp);
    if (state.send) {
      const select = $("match-column");
      select.textContent = "";
      state.send.list.header.forEach((name, index) => {
        const option = el("option", null, name);
        option.value = String(index);
        select.appendChild(option);
      });
      select.value = state.matchColumn == null ? "" : String(state.matchColumn);
      renderMatchNote();
    }
    $("origin").value = state.origin;
    $("origin-aside").classList.toggle("hidden", !(state.origin === "purchased" || state.origin === "other"));
    updateCheckButton();
  }

  function renderMatchNote() {
    const note = $("match-note");
    if (!state.send || state.matchColumn == null) { note.textContent = "Pick the column that holds the email address."; return; }
    const rows = state.send.list.rows;
    let hits = 0;
    rows.forEach((cells) => { if (looksLikeEmail((cells[state.matchColumn] || "").trim())) hits += 1; });
    note.textContent = `${hits} of ${rows.length} rows look like addresses`;
  }

  $("match-column").addEventListener("change", (event) => {
    state.matchColumn = event.target.value === "" ? null : Number(event.target.value);
    renderMatchNote();
    updateCheckButton();
  });
  $("origin").addEventListener("change", (event) => {
    state.origin = event.target.value;
    $("origin-aside").classList.toggle("hidden", !(state.origin === "purchased" || state.origin === "other"));
  });
  document.querySelectorAll("[data-rule]").forEach((input) => {
    input.addEventListener("change", () => {
      state.rules[input.dataset.rule] = input.checked;
      if (state.supp) {
        state.supp.parsed = parseSuppression(state.supp.list, state.rules);
        renderZone("supp");
      }
      updateCheckButton();
    });
  });

  function matchColumns() {
    const set = new Set([state.matchColumn]);
    state.send.list.emailColumns.forEach((column) => set.add(column.index));
    return [...set];
  }

  function checkBlocker() {
    if (!state.send) return { note: "Load both lists to start.", focus: () => zones.send.el.querySelector("[data-pick]").focus() };
    if (!state.supp) return { note: "Load today's suppression list.", focus: () => zones.supp.el.querySelector("[data-pick]").focus() };
    if (state.supp.stale.blocked) return { note: "That suppression list is too old to use.", focus: () => zones.supp.el.querySelector("[data-change]").focus() };
    if (state.matchColumn == null) return { note: "Pick the column that holds the email address.", focus: () => $("match-column").focus() };
    return null;
  }
  function updateCheckButton() {
    const blocker = checkBlocker();
    $("check-button").setAttribute("aria-disabled", blocker ? "true" : "false");
    $("check-note").textContent = blocker
      ? blocker.note
      : `${plural(state.send.list.rows.length, "row")} against ${plural(state.supp.parsed.count, "address", "addresses")}${state.supp.parsed.domainCount ? ` and ${plural(state.supp.parsed.domainCount, "domain rule")}` : ""}.`;
  }
  $("check-button").addEventListener("click", () => {
    const blocker = checkBlocker();
    if (blocker) { blocker.focus(); announce(blocker.note); return; }
    runCheck();
  });

  /* ---------- check one address ---------- */

  function runCheckOne() {
    if (!state.supp) return;
    const result = checkOne($("one-address").value, state.supp.parsed, state.rules);
    const out = $("one-result");
    out.textContent = "";
    const dot = el("i", "sl-dot");
    let text;
    if (result.status === "invalid") {
      text = "That is not an email address.";
    } else if (result.status === "listed") {
      dot.classList.add(result.reason === "domain" ? "is-domain" : "is-listed");
      text = result.reason === "domain" ? `On the suppression list: domain @${result.domain}` : "On the suppression list";
    } else {
      dot.classList.add("is-clear");
      text = "Clear";
    }
    if (result.status !== "invalid") out.appendChild(dot);
    out.appendChild(document.createTextNode(text));
    announce(text);
  }
  $("one-check").addEventListener("click", runCheckOne);
  $("one-address").addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); runCheckOne(); } });

  /* ---------- review ---------- */

  function runCheck() {
    const columns = matchColumns();
    const matches = findMatches(state.send.list, columns, state.supp.parsed, state.rules);
    const duplicates = findDuplicates(state.send.list, columns, state.rules);
    state.items = reviewItems(matches, duplicates);
    state.decisions = {};
    renderReview();
    setPhase("review");
    $("review-title").focus();
  }

  function headerIndex(patterns) {
    const header = state.send.list.header;
    for (const pattern of patterns) {
      const index = header.findIndex((name) => pattern.test(name));
      if (index >= 0) return index;
    }
    return -1;
  }

  function renderReview() {
    const rows = state.send.list.rows;
    const items = state.items;
    const matched = items.filter((item) => item.kind === "match").length;
    const duplicates = items.length - matched;
    $("review-title").textContent = `${matched} of ${rows.length} contacts are on the suppression list`
      + (duplicates ? `, and ${duplicates === 1 ? "1 row is a duplicate" : `${duplicates} rows are duplicates`}` : "");
    $("review-sub").textContent = items.length
      ? "Decide each one. Nothing is removed until you finish."
      : "Nothing to decide. Finish to download the list with a record of the check.";
    const body = $("review-body");
    body.textContent = "";
    $("review-table").classList.toggle("hidden", !items.length);
    const first = headerIndex([/^first ?name$/i, /first ?name/i]);
    const last = headerIndex([/^last ?name$/i, /last ?name|surname/i]);
    const full = headerIndex([/^(full |contact )?name$/i]);
    const company = headerIndex([/company|account|organi[sz]ation|employer/i]);

    items.forEach((item) => {
      const cells = rows[item.row];
      const tr = el("tr", "sl-review-row");
      tr.dataset.row = String(item.row);

      const name = [first >= 0 ? cells[first] : "", last >= 0 ? cells[last] : ""].filter(Boolean).join(" ").trim() || (full >= 0 ? cells[full] : "");
      const contact = el("td");
      const label = el("div", "sl-contact", name || `Row ${item.row + 1}`);
      const sub = [company >= 0 ? cells[company] : "", `row ${item.row + 1}`].filter(Boolean).join(" · ");
      label.appendChild(el("span", "sl-contact-sub", sub));
      contact.appendChild(label);
      tr.appendChild(contact);

      const email = el("td");
      email.appendChild(el("span", "sl-mono", item.raw));
      tr.appendChild(email);

      const why = el("td");
      const badge = el("span", "sl-why");
      const dot = el("i", "sl-dot");
      let reason;
      if (item.kind === "duplicate") { dot.classList.add("is-dup"); reason = `Duplicate of row ${item.duplicateOf + 1}`; }
      else if (item.reason === "domain") { dot.classList.add("is-domain"); reason = `Domain suppressed: @${item.domain}`; }
      else { dot.classList.add("is-listed"); reason = "On the suppression list"; }
      badge.appendChild(dot);
      badge.appendChild(document.createTextNode(reason));
      why.appendChild(badge);
      tr.appendChild(why);

      const decision = el("td");
      const pair = el("div", "sl-pair");
      pair.setAttribute("role", "group");
      pair.setAttribute("aria-label", `Decision for ${name || `row ${item.row + 1}`}`);
      const reasonInput = el("input", "sl-reason hidden");
      reasonInput.type = "text";
      reasonInput.placeholder = "Why keep them? Goes in the record.";
      reasonInput.setAttribute("aria-label", `Reason for keeping ${name || `row ${item.row + 1}`}`);
      reasonInput.addEventListener("input", () => {
        state.decisions[item.row] = { ...(state.decisions[item.row] || { decision: "keep" }), reason: reasonInput.value };
      });
      [["keep", "Keep contact"], ["remove", "Remove contact"]].forEach(([value, text]) => {
        const button = el("button", null, text);
        button.type = "button";
        button.dataset.decision = value;
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => {
          state.decisions[item.row] = { ...(state.decisions[item.row] || {}), decision: value };
          pair.querySelectorAll("button").forEach((sibling) => sibling.setAttribute("aria-pressed", sibling === button ? "true" : "false"));
          reasonInput.classList.toggle("hidden", value !== "keep");
          if (value === "keep") reasonInput.focus();
          updateFinish();
        });
        pair.appendChild(button);
      });
      decision.appendChild(pair);
      decision.appendChild(reasonInput);
      tr.appendChild(decision);
      body.appendChild(tr);
    });
    updateFinish();
  }

  function undecided() {
    return state.items.filter((item) => !state.decisions[item.row] || !state.decisions[item.row].decision);
  }
  function updateFinish() {
    const missing = undecided();
    $("finish-button").setAttribute("aria-disabled", missing.length ? "true" : "false");
    $("finish-note").textContent = missing.length
      ? `${missing.length} of ${plural(state.items.length, "contact")} still undecided.`
      : (state.items.length ? "All decided." : "");
    $("remove-rest").classList.toggle("hidden", !missing.length);
  }
  $("remove-rest").addEventListener("click", () => {
    undecided().forEach((item) => {
      const button = $("review-body").querySelector(`tr[data-row="${item.row}"] button[data-decision="remove"]`);
      if (button) button.click();
    });
    announce("Remaining contacts marked for removal.");
  });
  $("back-button").addEventListener("click", () => { setPhase("load"); $("check-button").focus(); });
  $("finish-button").addEventListener("click", () => {
    const missing = undecided();
    if (missing.length) {
      const button = $("review-body").querySelector(`tr[data-row="${missing[0].row}"] button[data-decision="keep"]`);
      if (button) button.focus();
      announce(`Decide row ${missing[0].row + 1} first.`);
      return;
    }
    finish();
  });

  /* ---------- done ---------- */

  async function finish() {
    const result = applyDecisions(state.send.list, state.items, state.decisions);
    if (!result.ok) return;
    state.result = result;
    const header = state.send.list.header;
    state.outputText = toCSV([header, ...result.rows]);
    state.outputName = `${baseName(state.send.name)}.checked.csv`;
    state.record = await buildRecord({
      sendList: { name: state.send.name, rows: state.send.list.rows.length, columns: header, text: state.send.text },
      suppression: { name: state.supp.name, fileDate: state.supp.fileDate, count: state.supp.parsed.count, domainCount: state.supp.parsed.domainCount, text: state.supp.text },
      matchColumns: matchColumns().map((index) => header[index]),
      origin: state.origin,
      rules: state.rules,
      items: state.items,
      decisions: state.decisions,
      counts: result.counts,
      output: { name: state.outputName, rows: result.rows.length, text: state.outputText }
    });
    renderDone();
    setPhase("done");
    $("preview-title").focus();
  }

  function receiptRow(term, content) {
    const row = el("div");
    row.appendChild(el("dt", null, term));
    const dd = el("dd");
    if (typeof content === "string") dd.textContent = content; else dd.appendChild(content);
    row.appendChild(dd);
    return row;
  }
  function withHash(text, hash) {
    const span = el("span");
    span.appendChild(document.createTextNode(`${text} `));
    const mono = el("span", "sl-mono", shortHash(hash));
    mono.title = hash;
    span.appendChild(mono);
    return span;
  }

  function renderDone() {
    const counts = state.result.counts;
    const record = state.record;
    const header = state.send.list.header;
    const emailSet = new Set(matchColumns());

    $("preview-title").textContent = `${plural(counts.output, "row")} ready to send`;
    const table = $("preview-table");
    table.textContent = "";
    const thead = el("thead");
    const headRow = el("tr");
    header.forEach((name) => { const th = el("th", null, name); th.scope = "col"; headRow.appendChild(th); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = el("tbody");
    state.result.rows.forEach((cells) => {
      const tr = el("tr");
      header.forEach((_, index) => {
        const value = cells[index] == null ? "" : cells[index];
        const td = el("td", emailSet.has(index) ? "sl-mono" : null, value === "" ? "—" : value);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    $("done-title").textContent = state.outputName;
    $("done-sub").textContent = `${counts.output} of ${counts.input} rows kept. ${plural(counts.matched, "contact")} on the suppression list: ${counts.removed} removed, ${counts.keptOnList} kept.`
      + (counts.duplicates ? ` ${counts.duplicatesRemoved} of ${plural(counts.duplicates, "duplicate")} removed.` : "");

    const receipt = $("receipt");
    receipt.textContent = "";
    const supp = record.suppressionList;
    receipt.appendChild(receiptRow("Checked against", withHash(
      `${supp.name} · ${plural(supp.addresses, "address", "addresses")}${supp.domainRules ? ` · ${plural(supp.domainRules, "domain rule")}` : ""} · exported ${localStamp(supp.exportedAt)} (${state.supp.stale.age})`, supp.sha256)));
    receipt.appendChild(receiptRow("Matched on", record.matchedOn.join(", ")));
    receipt.appendChild(receiptRow("Rules", ruleSummary(record.rules)));
    receipt.appendChild(receiptRow("List came from", record.origin.label));
    receipt.appendChild(receiptRow("Send list", withHash(`${record.sendList.name} · ${plural(record.sendList.rows, "row")}`, record.sendList.sha256)));
    receipt.appendChild(receiptRow("Checked list", withHash(`${record.output.name} · ${plural(record.output.rows, "row")}`, record.output.sha256)));
    const kept = record.decisions.filter((entry) => entry.decision === "keep");
    if (kept.length) {
      const list = el("ul");
      kept.forEach((entry) => {
        const li = el("li");
        li.appendChild(el("span", "sl-mono", entry.email));
        li.appendChild(document.createTextNode(entry.keepReason ? ` — ${entry.keepReason}` : " — no reason given"));
        list.appendChild(li);
      });
      receipt.appendChild(receiptRow("Kept on purpose", list));
    }
    receipt.appendChild(receiptRow("Removed", `${plural(counts.removed + counts.duplicatesRemoved, "row")}, recorded as fingerprints only`));

    const hash = $("record-hash");
    hash.textContent = shortHash(record.recordSha256);
    hash.title = record.recordSha256;
    $("record-stamp").textContent = stamp(record.generatedAt);
  }

  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $("download-list").addEventListener("click", () => download(state.outputName, state.outputText, "text/csv"));
  $("download-record").addEventListener("click", () => download(`${baseName(state.send.name)}.safelist-record.json`, `${JSON.stringify(state.record, null, 2)}\n`, "application/json"));

  /* ---------- reset ---------- */

  function resetAll() {
    state.send = null;
    state.supp = null;
    state.matchColumn = null;
    state.items = [];
    state.decisions = {};
    state.result = null;
    state.record = null;
    state.outputText = "";
    state.outputName = "";
    state.origin = "crm";
    state.rules = { ...DEFAULT_RULES };
    document.querySelectorAll("[data-rule]").forEach((input) => { input.checked = Boolean(DEFAULT_RULES[input.dataset.rule]); });
    $("one-address").value = "";
    $("one-result").textContent = "";
    renderZone("send");
    renderZone("supp");
    renderSetup();
    setPhase("load");
  }
  $("restart-button").addEventListener("click", () => { resetAll(); zones.send.el.querySelector("[data-pick]").focus(); });
  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin && event.origin !== "null") return;
    if (event.data && event.data.toolkit === "reset") resetAll();
  });

  window.__safelist = { state, loadInto, resetAll };
  renderSetup();
