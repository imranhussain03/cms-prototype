/**
 * Account scope: which branches and departments the signed-in account works in.
 *
 * As on the live site, an account that belongs to a single branch / department (for example an
 * IT approver) sees that branch and department already selected and locked in every Branch and
 * Department picker: Statistics (Overview and Contract Value), Requests and Contracts filters,
 * the New Contract popup and Contract Import. Its lists and numbers only cover that department.
 * Accounts that look after several departments keep "All Departments" and can choose.
 */
(function () {
  const D = InnomickCMSData;

  // Accounts that are not limited to the one department they sit in.
  // 'all' = every branch / department; a list = only those.
  const WIDE_ACCESS = {
    'Zubair': { branches: 'all', departments: 'all' },
    'Daniel Mathew': { branches: 'all', departments: 'all' },
    'Priya Nair': { branches: ['Innomick'], departments: ['Information Technology', 'Facilities Management'] },
    'Thomas George': { branches: ['Innomick Kuwait Tech Hub'], departments: ['Medical Insurance', 'Facilities Management'] }
  };

  window.cmsUserScope = function (name) {
    name = name || D.currentUser.name;
    if (WIDE_ACCESS[name]) return WIDE_ACCESS[name];
    const p = (typeof NC_DIRECTORY !== 'undefined' ? NC_DIRECTORY : []).find(x => x.name === name);
    if (!p) return { branches: 'all', departments: 'all' };
    return { branches: [p.branch], departments: [p.department] };
  };

  const BRANCH_IDS = ['statsFilterBranch', 'cvFilterBranch', 'reqFilterBranch', 'cntFilterBranch', 'csFilterBranch', 'modalBranchSelect', 'impBranchSelect'];
  const DEPT_IDS = ['statsFilterDept', 'cvFilterDept', 'reqFilterDept', 'cntFilterDept', 'csFilterDept', 'modalDeptSelect', 'impDeptSelect'];

  // Limit one <select> to the allowed values; a single value is pre-selected and locked
  function scopeSelect(sel, allowed) {
    if (!sel) return;
    const isPh = o => o.value === 'all' || o.value === '';
    if (allowed === 'all') {
      if (sel.dataset.scopeFull) {
        sel.innerHTML = sel.dataset.scopeFull;
        delete sel.dataset.scopeFull;
        // the previous account's locked value was not this account's choice: back to All / Select
        const ph = [...sel.options].find(o => o.value === 'all' || o.value === '');
        if (ph) sel.value = ph.value;
      }
      if (sel.dataset.scopeLocked) { sel.disabled = false; delete sel.dataset.scopeLocked; }
    } else {
      // keep a copy of the full list (taken before any account narrowed it) for an account with wider access;
      // a list the app rebuilt in full replaces the copy
      const opts = [...sel.options];
      if (!sel.dataset.scopeFull || opts.filter(o => !isPh(o)).length > allowed.length) sel.dataset.scopeFull = sel.innerHTML;
      const full = document.createElement('select');
      full.innerHTML = sel.dataset.scopeFull;
      const placeholder = [...full.options].find(isPh);
      const cur = sel.value;
      const single = allowed.length === 1;
      // "Select Department" stays in the popups; "All Departments" would show other departments' data, so it goes
      const keepPh = !single && placeholder && placeholder.value === '';
      sel.innerHTML = (keepPh ? placeholder.outerHTML : '') +
        allowed.map(v => `<option value="${v.replace(/"/g, '&quot;')}">${v}</option>`).join('');
      sel.value = single ? allowed[0] : (allowed.includes(cur) ? cur : (keepPh ? '' : allowed[0]));
      if (single && !sel.disabled) { sel.disabled = true; sel.dataset.scopeLocked = '1'; }
      if (!single && sel.dataset.scopeLocked) { sel.disabled = false; delete sel.dataset.scopeLocked; }
    }
    if (typeof uiSyncSelect === 'function') uiSyncSelect(sel);
  }

  window.cmsApplyScope = function () {
    const s = cmsUserScope();
    BRANCH_IDS.forEach(id => scopeSelect(document.getElementById(id), s.branches));
    DEPT_IDS.forEach(id => scopeSelect(document.getElementById(id), s.departments));
  };

  // Every place that (re)builds or reads those pickers applies the scope first
  const wrapBefore = name => {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () { cmsApplyScope(); return orig.apply(this, arguments); };
  };
  const wrapAfter = name => {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () { const r = orig.apply(this, arguments); cmsApplyScope(); return r; };
  };
  ['filterRequests', 'filterContracts', 'renderStatistics', 'applyCSFilters', 'renderContractSelection'].forEach(wrapBefore);

  // Opening / refreshing Requests draws the list through the filters, so a locked department applies at once
  const origReqTable = window.renderRequestsTable;
  window.renderRequestsTable = function (list) {
    if (list === undefined) return filterRequests();
    return origReqTable.apply(this, arguments);
  };
  ['openNewContractModal', 'impOpenManualModal'].forEach(wrapAfter);

  // Clear / Reset never clears a locked branch or department
  ['resetRequestFilters', 'resetContractFilters', 'resetContractValueFilters', 'resetCSFilters'].forEach(name => {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      const r = orig.apply(this, arguments);
      cmsApplyScope();
      if (name === 'resetRequestFilters') filterRequests();
      if (name === 'resetContractFilters') filterContracts();
      if (name === 'resetContractValueFilters') renderContractValueView();
      return r;
    };
  });

  // Contract Value: once a department / type is chosen (or the account is limited),
  // every number, the chart and the vendor list come from the matching contracts
  const origCV = window.renderContractValueView;
  window.renderContractValueView = function () {
    cmsApplyScope();
    const val = id => (document.getElementById(id) || {}).value || 'all';
    const b = val('cvFilterBranch'), d = val('cvFilterDept'), t = val('cvFilterService');
    const s = cmsUserScope();
    const limited = s.branches !== 'all' || s.departments !== 'all';
    if (!limited && d === 'all' && t === 'all') return origCV.apply(this, arguments);

    const vendorSel = CMSState.cvFilterVendor || 'All Vendors';
    const inScope = D.contracts.filter(c =>
      (!limited || b === 'all' || (c.branch || 'Innomick') === b) &&
      (d === 'all' || c.department === d) &&
      (t === 'all' || (c.category || c.type) === t));
    const list = inScope.filter(c => vendorSel === 'All Vendors' || (c.vendor || c.vendorName) === vendorSel);
    const all = D.contracts;
    D.contracts = inScope;
    try { origCV.apply(this, arguments); } finally { D.contracts = all; }

    const amount = c => Math.abs(parseFloat(String(c.value || c.amount || 0).replace(/[^0-9.\-]/g, '')) || 0);
    const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(Math.round(n));
    const total = list.reduce((a, c) => a + amount(c), 0);
    const byVendor = {};
    inScope.forEach(c => { const v = c.vendor || c.vendorName || 'Unknown Vendor'; byVendor[v] = (byVendor[v] || 0) + 1; });
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('cvKpiTotalValue', fmt(total));
    set('cvKpiTotalContracts', list.length);
    set('cvKpiAvgContract', fmt(list.length ? total / list.length : 0));
    set('cvKpiUniqueVendors', Object.keys(byVendor).length);
    set('cvDistSubtitle', `All contracts · ${list.length} contracts`);
    set('cvVendorConcSubtitle', `All · ${Object.keys(byVendor).length} vendors`);
    set('cvVendorTotalFooter', `${fmt(total)} KWD`);
    const box = document.getElementById('cvVendorListContainer');
    if (box) {
      const rows = Object.entries(byVendor).sort((a, b2) => b2[1] - a[1]);
      box.innerHTML = rows.length ? rows.map(([name, n], i) => {
        const pct = (n / inScope.length * 100).toFixed(1) + '%';
        return `<div class="cv-vendor-row" onclick="selectContractValueVendor('${name.replace(/'/g, "\\'")}')" style="cursor: pointer;" title="Filter by ${name}">
          <div class="cv-vendor-info-line"><span class="cv-vendor-name">${name}</span>
          <span class="cv-vendor-stats">${n} contracts · <strong>${pct}</strong></span></div>
          <div class="cv-vendor-progress-track"><div class="cv-vendor-progress-fill" style="width: ${pct}; background-color: ${i === 0 ? '#f59e0b' : '#008272'};"></div></div>
        </div>`;
      }).join('') : '<div class="no-data-found-msg" style="padding: 30px 0;">No Data Found</div>';
    }
  };

  // Switching account re-scopes every picker and redraws the lists for that account
  const origSwitch = window.switchUserProfile;
  window.switchUserProfile = function (key) {
    origSwitch.apply(this, arguments);
    cmsApplyScope();
    try { filterRequests(); filterContracts(); renderStatistics(); if (CMSState.statsTab === 'value') renderContractValueView(); } catch (e) { /* view not mounted */ }
  };

  const start = () => setTimeout(() => {
    cmsApplyScope();
    try { filterRequests(); filterContracts(); renderStatistics(); } catch (e) { /* view not mounted */ }
  }, 0);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
