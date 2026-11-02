/**
 * Innomick Technologies - CMS Prototype
 * Behaviour that mirrors the live system for: approval templates (create / filter),
 * approval history, list filters, statistics filters and trend chart, account menu,
 * manual import approval prompt, Excel contract import, amendment comparison and
 * keeping the prototype's data across page refreshes. Loaded after every other script.
 */

(function () {
  const D = InnomickCMSData;
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const uniq = arr => [...new Set(arr.filter(Boolean))];

  // ===========================================================================
  // 0. Persistence: data survives a page refresh (bug 26)
  // ===========================================================================
  const STORE_KEY = 'innomick-cms-prototype-v1';
  const FILTER_IDS = ['reqFilterBranch', 'reqFilterDept', 'reqFilterVendor', 'reqFilterCategory', 'cntFilterBranch', 'cntFilterDept',
    'cntFilterVendor', 'cntFilterCategory', 'statsFilterBranch', 'statsFilterDept'];

  function saveState() {
    try {
      const filters = {};
      FILTER_IDS.forEach(id => { const el = document.getElementById(id); if (el) filters[id] = el.value; });
      localStorage.setItem(STORE_KEY, JSON.stringify({ data: D, records: NCState.records, filters, saved: Date.now() }));
    } catch (e) { /* storage full or blocked: the prototype still works for this session */ }
  }
  window.cmsSaveState = saveState;
  window.cmsResetData = () => { try { localStorage.removeItem(STORE_KEY); } catch (e) {} location.reload(); };

  let restoredFilters = null;
  try {
    // Used once, then dropped from the address so that a refresh keeps the data
    if (/[?&]reset/.test(location.search)) {
      localStorage.removeItem(STORE_KEY);
      history.replaceState(null, '', location.pathname + location.hash);
    }
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved && saved.data) {
      Object.keys(saved.data).forEach(k => { D[k] = saved.data[k]; });
      Object.assign(NCState.records, saved.records || {});
      restoredFilters = saved.filters || null;
    }
  } catch (e) { /* ignore corrupt storage */ }
  window.addEventListener('beforeunload', saveState);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveState(); });
  setInterval(saveState, 4000);

  // ===========================================================================
  // 1. Approval templates: data, Create Workflow (Sequential / Parallel), filters (bugs 1-4)
  // ===========================================================================
  const STEP_LIB = [
    { title: 'Department Approval', approver: 'Sara Thomas' },
    { title: 'Finance Approval', approver: 'Priya Nair' },
    { title: 'Legal Approval', approver: 'Omar Siddiqui' },
    { title: 'CEO Approval', approver: 'Daniel Mathew' }
  ];
  if (!D.approvalTemplates) {
    const seed = [['Vendor Review', 'Sequential', 2], ['Dept Approvals', 'Parallel', 3], ['Customer Services Approval', 'Sequential', 2],
      ['CEO + Vendor App', 'Sequential', 2], ['Procurement Review', 'Parallel', 2], ['Dept Approval', 'Sequential', 1],
      ['Vendor Compliance', 'Sequential', 2], ['Quick Approval', 'Sequential', 1], ['Standard Approval', 'Sequential', 2],
      ['Executive Approval', 'Sequential', 3], ['4 Approvals', 'Parallel', 4], ['Internal Two-Step', 'Sequential', 2],
      ['Regional Approval', 'Sequential', 2], ['Three-Step Approval', 'Sequential', 3], ['Manager Approval', 'Sequential', 1],
      ['Parallel Group Review', 'Parallel', 3], ['External Legal Review', 'Sequential', 2], ['Finance Dashboard Approval', 'Sequential', 2],
      ['Human Resources Approval', 'Sequential', 2], ['CEO Office Approval', 'Sequential', 1]];
    const depts = ['Information Technology', 'Medical Insurance', 'Facilities Management'];
    D.approvalTemplates = seed.map(([name, type, n], i) => ({
      id: `AT-${i + 1}`, name, type,
      branch: i % 5 === 4 ? D.branches[1 + (i % (D.branches.length - 1))] : D.branches[0],
      department: depts[i % 3], dueDays: 2,
      steps: STEP_LIB.slice(0, n).map(s => ({ ...s, action: 'Review & Approve', internal: true }))
    }));
  }

  // The approval picker on a request offers only templates for that request's branch + department
  function eligibleTemplates(type) {
    const rec = NCState.current;
    const all = D.approvalTemplates.filter(t => t.type === type);
    if (!rec) return all;
    const exact = all.filter(t => t.branch === rec.branch && t.department === rec.department);
    return exact.length ? exact : all.filter(t => t.department === rec.department).length ? all.filter(t => t.department === rec.department) : all;
  }
  ['Sequential', 'Parallel'].forEach(type => {
    Object.defineProperty(NC_WORKFLOWS, type, { get: () => eligibleTemplates(type), configurable: true });
  });

  CMSState.at = CMSState.at || { type: 'all', branch: 'all', dept: 'all' };

  function renderTemplatesTab(container) {
    const st = CMSState.at;
    const list = D.approvalTemplates.filter(t => (st.type === 'all' || t.type === st.type)
      && (st.branch === 'all' || t.branch === st.branch) && (st.dept === 'all' || t.department === st.dept));
    const opt = (vals, cur) => vals.map(v => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(v)}</option>`).join('');
    container.innerHTML = `
      <div class="at-bar">
        <div class="at-tabs">
          ${['all', 'Parallel', 'Sequential'].map(t => `<button class="${st.type === t ? 'active' : ''}" onclick="CMSState.at.type='${t}'; renderApprovals()">${t === 'all' ? 'All' : t}</button>`).join('')}
        </div>
        <div class="at-filters">
          <label>Branch<select onchange="CMSState.at.branch=this.value; renderApprovals()"><option value="all">All Branches</option>${opt(D.branches, st.branch)}</select></label>
          <label>Department<select onchange="CMSState.at.dept=this.value; renderApprovals()"><option value="all">All Departments</option>${opt(D.departments, st.dept)}</select></label>
        </div>
      </div>
      ${list.length ? `<div class="at-grid">${list.map(t => `
        <div class="at-card" onclick="atOpenBuilder('${t.type.toLowerCase()}', '${t.id}')" title="${esc(t.name)}">
          <span class="at-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M12 7.5v4M12 11.5l-6 5M12 11.5l6 5"/></svg></span>
          <div class="at-card-text"><b>${esc(t.name)}</b></div>
        </div>`).join('')}</div>` : '<div class="nc-history-empty">No templates Available. Please contact your IT Admin.</div>'}`;
  }

  // Workflow builder (UAT: "Individual Workflow" for Sequential, "Group Workflow" for Parallel)
  const AT_GROUPS = [
    { name: 'CRM', members: ['Innomick Technologies'] },
    { name: 'HSE Committee', members: ['Aisha Rahman', 'Priya Nair'] },
    { name: 'Finance Team', members: ['Priya Nair', 'Daniel Mathew'] },
    { name: 'Legal Panel', members: ['Omar Siddiqui', 'Sara Thomas'] },
    { name: 'Management Board', members: ['Daniel Mathew', 'Kevin Brooks', 'Leo Fernandes'] }
  ];
  const atEmail = n => {
    const p = Object.values(D.userProfiles).find(x => x.name === n);
    if (p) return p.email;
    return n ? n.toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.') + '@innomicktechnologies.com' : '';
  };
  const atRow = (label, ctrl) => `<div class="at-row"><label>${label}</label><div>${ctrl}</div></div>`;
  const atRO = v => `<input class="cms-input" readonly value="${esc(v)}">`;
  const blankStep = () => ({ title: '', approver: '', email: '', action: 'Review & Approve', internal: true, mode: 'name', apBranch: '', apDept: '', apRole: '' });
  const atUniq = list => [...new Set(list)];
  function atRestoreRole(s) {
    const p = s.mode === 'role' && !s.apRole && NC_DIRECTORY.find(x => x.name === s.approver);
    return p ? { ...s, apBranch: p.branch, apDept: p.department, apRole: p.role } : s;
  }

  window.atOpenBuilder = function (type, id) {
    closeModal('createWorkflowChoiceModal');
    const tpl = id ? D.approvalTemplates.find(t => t.id === id) : null;
    const t = tpl ? tpl.type.toLowerCase() : type;
    const steps = tpl ? tpl.steps.map(s => atRestoreRole({ ...blankStep(), ...s })) : [];
    CMSState.atEdit = { type: t, id: tpl ? tpl.id : null, name: tpl ? tpl.name : '', branch: tpl ? tpl.branch : '', department: tpl ? tpl.department : '', dueDays: tpl ? tpl.dueDays : 2,
      group: tpl ? tpl.group || '' : '', members: tpl ? [...(tpl.members || [])] : [] };
    if (t === 'parallel') {
      const fromGroup = s => s.group && CMSState.atEdit.members.includes(s.approver);
      CMSState.atInside = steps.filter(s => s.internal !== false && !fromGroup(s));
      CMSState.atOutside = steps.filter(s => s.internal === false);
    } else CMSState.atSteps = steps.length ? steps : [blankStep()];
    CMSState.atStepIdx = 0;
    const modal = document.getElementById('individualWorkflowModal');
    modal.querySelector('.modal-title').textContent = `${tpl ? 'Edit ' : ''}${t === 'parallel' ? 'Group' : 'Individual'} Workflow`;
    atDraw();
    openModal('individualWorkflowModal');
  };
  window.openSequentialWorkflowBuilder = (type = 'sequential', existingName = null) => {
    const tpl = existingName ? D.approvalTemplates.find(t => t.name === existingName) : null;
    atOpenBuilder(type, tpl ? tpl.id : null);
  };

  function atCollect() {
    const e = CMSState.atEdit;
    if (!document.getElementById('wfTemplateName')) return;
    const v = id => document.getElementById(id).value;
    e.name = v('wfTemplateName').trim(); e.branch = v('wfBranchSelect'); e.department = v('wfDeptSelect'); e.dueDays = v('wfDueDays');
    const read = (sel, list) => document.querySelectorAll(sel).forEach((el, i) => {
      const s = list[i], q = c => el.querySelector(c);
      if (!s) return;
      if (q('.at-step-name')) s.title = q('.at-step-name').value.trim();
      if (q('.at-step-mode')) s.mode = q('.at-step-mode').value;
      if (q('.at-step-approver')) s.approver = q('.at-step-approver').value.trim();
      if (q('.at-step-email')) s.email = q('.at-step-email').value.trim();
      if (q('.at-step-branch')) { s.apBranch = q('.at-step-branch').value; s.apDept = q('.at-step-dept').value; s.apRole = q('.at-step-role').value; }
      if (s.internal !== false && s.mode === 'role') {
        const p = NC_DIRECTORY.find(x => x.branch === s.apBranch && x.department === s.apDept && x.role === s.apRole);
        s.approver = p ? p.name : '';
      }
    });
    if (e.type === 'parallel') { read('#atInside .at-step', CMSState.atInside); read('#atOutside .at-step', CMSState.atOutside); }
    else read('#atStepsWrap .at-step', CMSState.atSteps.slice(CMSState.atStepIdx));
  }
  // Internal approver: Selection Mode + approver select; external: free name + email
  function atModeSelect(s) {
    const byRole = s.mode === 'role';
    return `<select class="cms-select at-step-mode" onchange="atRedraw()"><option value="name" ${byRole ? '' : 'selected'}>Search by Name</option><option value="role" ${byRole ? 'selected' : ''}>Select by Role / Designation</option></select>`;
  }
  const atUsedBefore = s => (CMSState.atSteps || []).slice(0, Math.max(0, (CMSState.atSteps || []).indexOf(s))).filter(x => x.internal !== false).map(x => x.approver);
  function atApproverSelect(s) {
    const used = atUsedBefore(s);
    return `<select class="cms-select at-step-approver" onchange="atRedraw()"><option value="">Select Approver Name</option>${NC_DIRECTORY.map(p => `<option value="${esc(p.name)}" ${p.name === s.approver ? 'selected' : ''} ${used.includes(p.name) ? 'disabled' : ''}>${esc(p.name)}</option>`).join('')}</select>`;
  }
  // Select by Role: Branch > Department > Role unlock in turn, then the approver is auto-selected
  function atRoleRows(s, n = '') {
    const inBranch = NC_DIRECTORY.filter(p => p.branch === s.apBranch);
    const inDept = inBranch.filter(p => p.department === s.apDept);
    const used = atUsedBefore(s);
    const takenRoles = inDept.filter(p => used.includes(p.name)).map(p => p.role);
    const sel = (cls, ph, values, cur, off = []) => `<select class="cms-select ${cls}" onchange="atCascade(this)" ${values.length ? '' : 'disabled'}><option value="">${ph}</option>${values.map(v => `<option ${v === cur ? 'selected' : ''} ${off.includes(v) ? 'disabled' : ''}>${esc(v)}</option>`).join('')}</select>`;
    return atRow(`Approver Branch ${n}`, sel('at-step-branch', 'Select Branch', atUniq(NC_DIRECTORY.map(p => p.branch)), s.apBranch))
      + atRow(`Approver Department ${n}`, sel('at-step-dept', 'Select Department', atUniq(inBranch.map(p => p.department)), s.apDept))
      + atRow(`Role / Designation ${n}`, sel('at-step-role', 'Select Role', atUniq(inDept.map(p => p.role)), s.apRole, takenRoles))
      + atRow(`Approver ${n}`, `<select class="cms-select" disabled><option>${esc(s.approver || 'Approver will be auto-selected')}</option></select>`);
  }
  const atNameInput = s => `<input class="cms-input at-step-approver" placeholder="Enter Approver Name" value="${esc(s.approver)}">`;
  const atEmailInput = s => `<input class="cms-input at-step-email" placeholder="Enter Approver Email" value="${esc(s.email || '')}">`;

  function atDraw() {
    const e = CMSState.atEdit, par = e.type === 'parallel';
    const modal = document.getElementById('individualWorkflowModal');
    let html = `
      ${atRow('Template Name', `<input class="cms-input" id="wfTemplateName" placeholder="Enter Template Name" value="${esc(e.name)}">`)}
      ${atRow('Requestor Branch', `<select class="cms-select" id="wfBranchSelect" onchange="atRedraw()"><option value="">Please Select Branch</option>${D.branches.map(b => `<option ${e.branch === b ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>`)}
      ${atRow('Requestor Department', `<select class="cms-select" id="wfDeptSelect" ${e.branch ? '' : 'disabled'}><option value="">Please Select Department</option>${D.departments.map(d => `<option ${e.department === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select>`)}
      ${atRow(`Due Days<br><small>(For ${par ? 'All Persons' : 'Each Person'})</small>`, `<input type="number" class="cms-input" id="wfDueDays" min="1" value="${esc(e.dueDays)}">`)}
      <hr class="at-sep">`;
    if (!par) {
      const i = CMSState.atStepIdx, s = CMSState.atSteps[i], total = CMSState.atSteps.length;
      html += `<div id="atStepsWrap">
        <div class="at-step">
          <div class="at-step-head"><span class="at-step-nav">${i > 0 ? `<button class="at-nav" title="Previous step" onclick="atGoStep(${i - 1})">&lsaquo;</button>` : ''}<b>Step ${i + 1}</b>${i < total - 1 ? `<button class="at-nav" title="Next step" onclick="atGoStep(${i + 1})">&rsaquo;</button>` : ''}</span>${total > 1 ? `<button class="btn-icon-subtle" title="Remove" onclick="atRemoveStep(${i})">&times;</button>` : ''}</div>
          ${atRow('Step Name', `<input class="cms-input at-step-name" placeholder="Enter Step Name" value="${esc(s.title)}">`)}
          ${atRow('Internal Organization Approver', `<input type="checkbox" class="nc-toggle" ${s.internal !== false ? 'checked' : ''} onchange="atToggleInternal(${i}, this.checked)">`)}
          ${s.internal === false
            ? atRow('Approver Name', atNameInput(s)) + atRow('Approver Email', atEmailInput(s))
            : atRow('Selection Mode', atModeSelect(s)) + (s.mode === 'role' ? atRoleRows(s) : atRow('Approver', atApproverSelect(s))) + atRow('Approver Email', atRO(s.approver ? atEmail(s.approver) : 'Please Select Approver'))}
          ${atRow('Action', atRO('Review & Approve'))}
        </div></div>`;
    } else {
      const list = key => CMSState[key].map((s, i) => {
        const rm = `<button class="btn-icon-subtle" title="Remove" onclick="atRemoveGroupApprover('${key}', ${i})">&times;</button>`;
        return `<div class="at-step at-flat">${s.internal === false
          ? atRow(`Approver Name ${i + 1}`, `<div class="at-inline">${atNameInput(s)}${rm}</div>`) + atRow(`Approver Email ${i + 1}`, atEmailInput(s))
          : atRow(`Selection Mode ${i + 1}`, `<div class="at-inline">${atModeSelect(s)}${rm}</div>`) + (s.mode === 'role' ? atRoleRows(s, i + 1) : atRow(`Add Approver ${i + 1}`, atApproverSelect(s)))}</div>`;
      }).join('') + `<button type="button" class="at-link" onclick="atAddGroupApprover('${key}')">+ Add Approver</button>`;
      html += `
        ${atRow('Group', `<select class="cms-select" id="wfGroupSelect" onchange="atPickGroup(this.value)"><option value="">Enter Group Name</option>${AT_GROUPS.map(g => `<option ${g.name === e.group ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select>`)}
        ${atRow('Group Members', e.members.length ? `<div class="at-chips">${e.members.map((m, i) => `<span class="at-chip">${esc(m)}<button title="Remove" onclick="atRemoveMember(${i})">&times;</button></span>`).join('')}</div>` : atRO('No group selected or no members in this group.'))}
        ${atRow('Add Approvers Inside Organization', `<input type="checkbox" class="nc-toggle" ${CMSState.atInside.length ? 'checked' : ''} onchange="atGroupToggle('atInside', this.checked)">`)}
        <div id="atInside" class="at-form">${CMSState.atInside.length ? list('atInside') : ''}</div>
        ${atRow('Add Approvers Outside Organization', `<input type="checkbox" class="nc-toggle" ${CMSState.atOutside.length ? 'checked' : ''} onchange="atGroupToggle('atOutside', this.checked)">`)}
        <div id="atOutside" class="at-form">${CMSState.atOutside.length ? list('atOutside') : ''}</div>
        ${atRow('Action', atRO('Review & Approve'))}`;
    }
    const body = modal.querySelector('.modal-body');
    const top = body.scrollTop;
    body.innerHTML = `<div class="at-form">${html}</div>`;
    body.scrollTop = top;
    const onLast = par || CMSState.atStepIdx === CMSState.atSteps.length - 1;
    modal.querySelector('.modal-footer').innerHTML = `
      <button class="btn-outline-teal" onclick="closeModal('individualWorkflowModal')">Cancel</button>
      ${!par && onLast ? '<button class="btn-outline-teal" onclick="atAddStep()">Add Step +</button>' : ''}
      ${onLast ? `<button class="btn-teal-primary" onclick="atSaveWorkflow()">${e.id ? 'Save' : 'Submit'}</button>` : ''}`;
  }
  window.atRedraw = () => { atCollect(); atDraw(); };
  // Changing one level clears the levels below it
  window.atCascade = el => {
    const levels = [...el.closest('.at-step').querySelectorAll('.at-step-branch, .at-step-dept, .at-step-role')];
    levels.slice(levels.indexOf(el) + 1).forEach(x => { x.value = ''; });
    atRedraw();
  };
  window.atToggleInternal = (i, on) => { atCollect(); Object.assign(CMSState.atSteps[i], { internal: on, approver: '', email: '' }); atDraw(); };
  window.atAddStep = () => { atCollect(); CMSState.atSteps.push(blankStep()); CMSState.atStepIdx = CMSState.atSteps.length - 1; atDraw(); };
  window.atRemoveStep = i => { atCollect(); CMSState.atSteps.splice(i, 1); CMSState.atStepIdx = Math.min(i, CMSState.atSteps.length - 1); atDraw(); };
  window.atGoStep = i => { atCollect(); CMSState.atStepIdx = i; atDraw(); };
  window.atPickGroup = name => { atCollect(); const g = AT_GROUPS.find(x => x.name === name); CMSState.atEdit.group = name; CMSState.atEdit.members = g ? [...g.members] : []; atDraw(); };
  window.atRemoveMember = i => { atCollect(); CMSState.atEdit.members.splice(i, 1); atDraw(); };
  window.atGroupToggle = (key, on) => { atCollect(); CMSState[key] = on ? [{ ...blankStep(), internal: key === 'atInside' }] : []; atDraw(); };
  window.atAddGroupApprover = key => { atCollect(); CMSState[key].push({ ...blankStep(), internal: key === 'atInside' }); atDraw(); };
  window.atRemoveGroupApprover = (key, i) => { atCollect(); CMSState[key].splice(i, 1); atDraw(); };
  window.atSaveWorkflow = () => {
    atCollect();
    const e = CMSState.atEdit, par = e.type === 'parallel';
    const dueDays = Math.max(1, parseInt(e.dueDays, 10) || 1);
    const steps = par
      ? e.members.map(m => ({ ...blankStep(), title: m, approver: m, group: e.group }))
        .concat(CMSState.atInside.concat(CMSState.atOutside).map(s => ({ ...s, title: s.approver })))
      : CMSState.atSteps.map(s => ({ ...s }));
    const bad = steps.some(s => !s.approver || !s.title || (s.internal === false && !/^\S+@\S+\.\S+$/.test(s.email || '')));
    if (!e.name || !e.branch || !e.department || !steps.length || bad) {
      showToast('Please fill all mandatory fields', 'info');
      return;
    }
    steps.forEach(s => { if (s.internal !== false) s.email = atEmail(s.approver); });
    const data = { name: e.name, type: par ? 'Parallel' : 'Sequential', branch: e.branch, department: e.department, dueDays, steps, group: e.group, members: [...e.members] };
    if (e.id) Object.assign(D.approvalTemplates.find(t => t.id === e.id), data);
    else D.approvalTemplates.unshift({ id: `AT-${Date.now()}`, ...data });
    closeModal('individualWorkflowModal');
    if (e.id) showToast(`Workflow "${e.name}" updated`, 'success');
    else ncShowInfo('Successfully submitted !', true);
    if (CMSState.currentRoute === 'approvals') switchApprovalTab('templates');
    saveState();
  };
  window.submitIndividualWorkflow = window.atSaveWorkflow;
  window.openCreateApprovalTemplateModal = () => openModal('createWorkflowChoiceModal');

  // ===========================================================================
  // 2. Approval history: Inbox History / Outbox History (bugs 12, 13)
  // ===========================================================================
  CMSState.histTab = CMSState.histTab || 'inbox';
  const STATIC_INBOX_HISTORY = [
    { name: 'INM-MID-SVC-2622-2026 Cancellation Request Letter 1790150615710.docx', approvalType: 'Sequential', status: 'Approved', progress: 'Step 2 of 2', progressPct: 100, requestedBy: 'Arjun Mehta', requestedOn: '2026-09-23' },
    { name: 'INM-MID-SVC-2622-2026 Renewal Request Letter 1790150393302.docx', approvalType: 'Sequential', status: 'Approved', progress: 'Step 2 of 2', progressPct: 100, requestedBy: 'Arjun Mehta', requestedOn: '2026-09-23' },
    { name: 'INM-MID-SVC-2608-2026 Amendment Request Letter 1790071021384.docx', approvalType: 'Sequential', status: 'Approved', progress: 'Step 2 of 2', progressPct: 100, requestedBy: 'Arjun Mehta', requestedOn: '2026-09-22' },
    { name: 'INM-ITD-SVC-2598-2026 Amendment Draft 1789834967848.docx', approvalType: 'Parallel', status: 'Request for Change', progress: 'Step 2 of 2', progressPct: 100, requestedBy: 'Omar Siddiqui', requestedOn: '2026-09-21' }
  ];
  const STATIC_OUTBOX_HISTORY = [
    { title: 'INM-ITD-SVC-2590-2026 Request Letter 1789710023311.docx', approvalType: 'Sequential', status: 'Approved', approvedCount: 2, totalSteps: 2, requestedOn: '2026-09-18' },
    { title: 'INM-MID-SVC-2575-2026 Draft 1789512234410.docx', approvalType: 'Parallel', status: 'Rejected', approvedCount: 1, totalSteps: 3, requestedOn: '2026-09-11' }
  ];

  function renderHistoryTab(container) {
    const inbox = CMSState.histTab === 'inbox';
    const me = D.currentUser.name;
    // History belongs to whoever acted on the step, or raised the request
    const rows = (inbox ? (D.approvals.inboxHistory || []).filter(r => (r.actedBy || r.approver || CMS_DEFAULT_USER) === me)
      : (D.approvals.outboxHistory || []).filter(r => (r.requestedBy || CMS_DEFAULT_USER) === me))
      .concat(me === CMS_DEFAULT_USER ? (inbox ? STATIC_INBOX_HISTORY : STATIC_OUTBOX_HISTORY) : []);
    const open = r => r.mgId ? `mgOpen('${r.mgId}', 'approvals')` : r.ncRequestId ? `ncOpenApprovalView('NCAPP-${r.ncRequestId}-${r.ncDoc}')` : `CMSState.reviewReadOnly = true; switchRoute('approval_review', 'APP-F01')`;
    const statusColor = st => /Reject|Change/.test(st) ? '#dc2626' : '#15803d';
    container.innerHTML = `
      <div class="hist-subtabs">
        <button class="${inbox ? 'active' : ''}" onclick="CMSState.histTab='inbox'; renderApprovals()">Inbox History</button>
        <button class="${inbox ? '' : 'active'}" onclick="CMSState.histTab='outbox'; renderApprovals()">Outbox History</button>
      </div>
      ${rows.length ? `
      <div class="approvals-table-container">
        <table class="approvals-sp-table">
          <thead><tr><th>Name</th><th>Approval Type</th><th>Status</th><th>Progress</th>${inbox ? '<th>Requested By</th>' : ''}<th>Requested on</th></tr></thead>
          <tbody>
            ${rows.map(r => {
              const pct = r.progressPct != null ? r.progressPct : Math.round(((r.approvedCount || 0) / (r.totalSteps || 1)) * 100);
              const prog = r.progress || `Approved ${r.approvedCount || 0} of ${r.totalSteps || 1}`;
              return `<tr style="cursor: pointer;" onclick="${open(r)}">
                <td><span style="color: #008272;">&#8599;</span> <b>${esc(r.name || r.title)}</b></td>
                <td><span class="${r.approvalType === 'Parallel' ? 'badge-parallel' : 'badge-sequential'}">${r.approvalType}</span></td>
                <td><span style="font-weight: 600; color: ${statusColor(r.status)};">${esc(r.status)}</span></td>
                <td><div class="approval-progress-wrap"><div class="approval-progress-bar-bg"><div class="approval-progress-bar-fill" style="width: ${pct}%;"></div></div><span class="approval-progress-label">${prog}</span></div></td>
                ${inbox ? `<td>${esc(r.requestedBy)}</td>` : ''}<td>${esc(r.requestedOn)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>` : `<div class="nc-history-empty">You don't have any data in ${inbox ? 'inbox' : 'outbox'} history.</div>`}`;
  }

  const origRenderApprovals = window.renderApprovals;
  // Approval review: decision buttons only when opened from the Inbox
  const origOpenApprovalDetail = window.openApprovalDetail;
  window.openApprovalDetail = id => { CMSState.reviewReadOnly = false; origOpenApprovalDetail(id); };
  const origOpenApprovalReview = window.openApprovalReview;
  window.openApprovalReview = function (id) {
    origOpenApprovalReview(id);
    const ro = !!CMSState.reviewReadOnly;
    document.querySelectorAll('#view-approval-review .review-header-actions .btn-outline-red, #view-approval-review .review-header-actions .btn-outline-orange, #view-approval-review .review-header-actions .btn-teal-primary')
      .forEach(b => { b.style.display = ro ? 'none' : ''; });
    CMSState.reviewReadOnly = false;
  };
  window.renderApprovals = function () {
    const container = document.getElementById('approvalsTabContent');
    if (container && CMSState.approvalTab === 'templates') return renderTemplatesTab(container);
    if (container && CMSState.approvalTab === 'history') return renderHistoryTab(container);
    origRenderApprovals();
    // Outbox rows open the approval details read-only: no Approve / Reject for the requester (bug 11)
    if (container && CMSState.approvalTab === 'outbox') {
      container.querySelectorAll(`tr[onclick^="switchRoute('approval_review'"]`).forEach(tr => tr.setAttribute('onclick', 'CMSState.reviewReadOnly = true; ' + tr.getAttribute('onclick')));
      container.querySelectorAll('tr[onclick^="openRequestDetails"]').forEach(tr => {
        const id = tr.getAttribute('onclick').match(/'([^']+)'/)[1];
        const o = D.approvals.outbox.find(x => x.ncRequestId === id);
        if (o) {
          tr.setAttribute('onclick', o.mgId ? `mgOpen('${o.mgId}', 'approvals')` : `ncOpenApprovalView('NCAPP-${o.ncRequestId}-${o.ncDoc || 'draft'}')`);
          const lbl = tr.querySelector('.approval-progress-label');
          const bar = tr.querySelector('.approval-progress-bar-fill');
          if (lbl) lbl.textContent = `Approved ${o.approvedCount || 0} of ${o.totalSteps}`;
          if (bar) bar.style.width = `${Math.round(((o.approvedCount || 0) / o.totalSteps) * 100)}%`;
        }
      });
    }
  };

  // ===========================================================================
  // 3. List filters: options from the data; branch / vendor / ownership (bug 17)
  // ===========================================================================
  function fillOptions(id, allLabel, values) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = `<option value="all">${allLabel}</option>` + values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    sel.value = values.includes(cur) || cur === 'all' ? cur : 'all';
  }
  function refreshFilterOptions() {
    const cb = uniq(D.contracts.map(c => c.branch)).sort();
    fillOptions('cntFilterBranch', 'All Branches', cb);
    fillOptions('cntFilterVendor', 'All Vendors', uniq(D.contracts.map(c => c.vendor || c.vendorName)).sort());
    fillOptions('reqFilterBranch', 'All Branches', uniq(D.requests.map(r => r.branch).concat(cb)).sort());
    fillOptions('reqFilterVendor', 'All Vendors', uniq(D.requests.map(r => r.vendorName)).sort());
    fillOptions('statsFilterBranch', 'All Branches', uniq(D.branches.concat(cb)));
    ['reqFilterCategory', 'cntFilterCategory', 'csFilterCategory'].forEach(id => {
      const sel = document.getElementById(id);
      if (sel && ![...sel.options].some(o => o.value === 'all')) {
        const cur = id === 'cntFilterCategory' ? (sel.value || 'Service') : 'all';
        fillOptions(id, 'All Categories', D.categories);
        sel.value = cur;
      }
    });
  }
  const origFilterContracts = window.filterContracts;
  window.filterContracts = function () { refreshFilterOptions(); origFilterContracts(); };

  // ===========================================================================
  // 4. Statistics: Branch / Department filters drive every number (bug 24)
  // ===========================================================================
  function statFilter(item) {
    const b = (document.getElementById('statsFilterBranch') || {}).value || 'all';
    const d = (document.getElementById('statsFilterDept') || {}).value || 'all';
    return (b === 'all' || (item.branch || 'Innomick') === b) && (d === 'all' || item.department === d);
  }
  const origRenderStatistics = window.renderStatistics;
  window.renderStatistics = function () {
    const keep = { p: D.pendingApprovalsList, s: D.stuckApprovalsList, d: D.draftsAgingList };
    const deptEl = document.getElementById('statsFilterDept');
    const deptVal = deptEl ? deptEl.value : 'all';
    D.pendingApprovalsList = keep.p.filter(statFilter);
    D.stuckApprovalsList = keep.s.filter(statFilter);
    D.draftsAgingList = keep.d.filter(statFilter);
    if (deptEl) deptEl.value = 'all';            // the original applies its own (partial) dept filter
    try { origRenderStatistics(); } finally {
      if (deptEl) deptEl.value = deptVal;
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      const expiring = D.contracts.filter(c => c.status === 'Expiring Soon' && statFilter(c)).length;
      const notice = D.contracts.filter(c => c.status === 'Notice Period' && statFilter(c)).length;
      set('kpiPendingCount', D.pendingApprovalsList.length);
      set('pendingApprovalsSubCount', D.pendingApprovalsList.length);
      set('kpiStuckCount', D.stuckApprovalsList.length);
      set('stuckApprovalsCount', D.stuckApprovalsList.length);
      set('kpiDraftsCount', D.draftsAgingList.length);
      set('draftsAgingTotalBadge', D.draftsAgingList.length);
      set('kpiExpiringCount', expiring);
      set('noticePeriodCount', notice);
      D.pendingApprovalsList = keep.p; D.stuckApprovalsList = keep.s; D.draftsAgingList = keep.d;
      renderTrendChart();
    }
  };
  window.filterDashboardData = () => renderStatistics();

  // ===========================================================================
  // 5. Contract Activity Trend: smooth New vs Renewal lines with hover tooltip (bug 25)
  // ===========================================================================
  function trendPoints() {
    const seen = new Set();
    const buckets = {};
    D.contracts.concat(D.requests).forEach(c => {
      const key = c.refNo || c.code;
      if (!key || seen.has(key) || !c.durationDates) return;
      if (!statFilter(c)) return;
      seen.add(key);
      const [start] = ncParseRange(c.durationDates);
      if (!start) return;
      const m = start.slice(0, 7);
      const isRenewal = /renew/i.test(c.requestType || '') || (c.periods && c.periods[0] && c.periods[0].type === 'Renewal');
      buckets[m] = buckets[m] || { n: 0, r: 0 };
      if (isRenewal) buckets[m].r++; else buckets[m].n++;
    });
    return Object.keys(buckets).sort().map(m => ({ m, ...buckets[m] }));
  }
  function smoothPath(pts) {
    if (pts.length < 2) return pts.length ? `M ${pts[0][0]},${pts[0][1]}` : '';
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C ${c1[0].toFixed(1)},${Math.min(c1[1], 200).toFixed(1)} ${c2[0].toFixed(1)},${Math.min(c2[1], 200).toFixed(1)} ${p2[0]},${p2[1]}`;
    }
    return d;
  }
  function renderTrendChart() {
    const host = document.querySelector('#view-statistics .trend-chart-viewport');
    if (!host) return;
    const data = trendPoints();
    if (!data.length) { host.innerHTML = '<div class="nc-history-empty">No Data Found</div>'; return; }
    // Drawn at the card's real width so the chart fills it; axis steps are whole contracts
    const W = host.clientWidth || 1100, H = 230, L = 40, R = 20, T = 20, B = 200;
    const max = Math.max(1, ...data.map(d => Math.max(d.n, d.r)));
    const top = Math.ceil(max / 4) * 4;
    const x = i => data.length === 1 ? (L + W - R) / 2 : L + (i * (W - R - L)) / (data.length - 1);
    const y = v => B - (v / top) * (B - T);
    const nPts = data.map((d, i) => [Math.round(x(i)), Math.round(y(d.n))]);
    const rPts = data.map((d, i) => [Math.round(x(i)), Math.round(y(d.r))]);
    const label = m => { const [yy, mm] = m.split('-'); return `${new Date(+yy, +mm - 1, 1).toLocaleString('en-US', { month: 'short' })} '${yy.slice(2)}`; };
    const ticks = [0, 1, 2, 3, 4].map(i => (top / 4) * i);
    const nPath = smoothPath(nPts), rPath = smoothPath(rPts);
    host.innerHTML = `
      <div class="trend-wrap">
        <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" class="trend-svg">
          <defs>
            <linearGradient id="trendNavyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e293b" stop-opacity="0.18"/><stop offset="100%" stop-color="#1e293b" stop-opacity="0"/></linearGradient>
            <linearGradient id="trendTealFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0f9488" stop-opacity="0.18"/><stop offset="100%" stop-color="#0f9488" stop-opacity="0"/></linearGradient>
          </defs>
          ${ticks.map(t => `<line x1="${L}" y1="${y(t)}" x2="${W - R}" y2="${y(t)}" stroke="#eef2f7"/><text x="${L - 12}" y="${y(t) + 4}" text-anchor="end" class="trend-axis">${t}</text>`).join('')}
          <path d="${nPath} L ${nPts[nPts.length - 1][0]},${B} L ${nPts[0][0]},${B} Z" fill="url(#trendNavyFill)"/>
          <path d="${rPath} L ${rPts[rPts.length - 1][0]},${B} L ${rPts[0][0]},${B} Z" fill="url(#trendTealFill)"/>
          <path d="${nPath}" fill="none" stroke="#1e293b" stroke-width="2.2"/>
          <path d="${rPath}" fill="none" stroke="#0f9488" stroke-width="2.2"/>
          ${data.map((d, i) => `<text x="${x(i)}" y="${B + 22}" text-anchor="middle" class="trend-axis">${label(d.m)}</text>`).join('')}
          <line class="trend-guide" x1="0" y1="${T}" x2="0" y2="${B}" stroke="#94a3b8" stroke-dasharray="3,3" style="display:none"/>
          <circle class="trend-dot-n" r="4" fill="#1e293b" style="display:none"/>
          <circle class="trend-dot-r" r="4" fill="#0f9488" style="display:none"/>
          ${data.map((d, i) => `<rect x="${x(i) - (W - L - R) / Math.max(data.length - 1, 1) / 2}" y="${T}" width="${(W - L - R) / Math.max(data.length - 1, 1)}" height="${B - T}" fill="transparent" onmousemove="trendHover(${i})" onmouseleave="trendHover(-1)"/>`).join('')}
        </svg>
        <div class="trend-tip" style="display:none"></div>
        <div class="trend-legend-row"><span class="legend-indicator"><span style="color:#1e293b">&#8212;&#9679;&#8212;</span> New Contracts</span><span class="legend-indicator"><span style="color:#0f9488">&#8212;&#9679;&#8212;</span> Renewals</span></div>
      </div>`;
    window.trendHover = i => {
      const svg = host.querySelector('svg'), tip = host.querySelector('.trend-tip');
      const guide = svg.querySelector('.trend-guide'), dn = svg.querySelector('.trend-dot-n'), dr = svg.querySelector('.trend-dot-r');
      if (i < 0) { [guide, dn, dr].forEach(e => { e.style.display = 'none'; }); tip.style.display = 'none'; return; }
      guide.setAttribute('x1', x(i)); guide.setAttribute('x2', x(i));
      dn.setAttribute('cx', nPts[i][0]); dn.setAttribute('cy', nPts[i][1]);
      dr.setAttribute('cx', rPts[i][0]); dr.setAttribute('cy', rPts[i][1]);
      [guide, dn, dr].forEach(e => { e.style.display = ''; });
      tip.innerHTML = `<b>${label(data[i].m)}</b><div>New Contracts: ${data[i].n}</div><div class="r">Renewals: ${data[i].r}</div>`;
      tip.style.display = 'block';
      tip.style.left = `${(x(i) / W) * 100}%`;
      tip.style.top = `${(Math.min(nPts[i][1], rPts[i][1]) / H) * 100}%`;
    };
  }
  window.addEventListener('resize', () => { if (CMSState.currentRoute === 'statistics') renderTrendChart(); });

  // ===========================================================================
  // 6. Account menu + switching demo user goes to the Home page (bugs 20, 22)
  // ===========================================================================
  window.spToggleAccount = function (e) {
    e.stopPropagation();
    const el = document.getElementById('spAccountCard');
    const open = el.classList.contains('open');
    spCloseMenus();
    spClosePanel();
    if (open) return;
    const u = D.currentUser;
    const ini = n => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const profiles = D.userProfiles || {};
    el.innerHTML = `
      <div class="acc-top"><span>Innomick Technologies</span><a href="javascript:void(0)" onclick="showToast('Sign out is disabled in the prototype', 'info')">Sign out</a></div>
      <div class="acc-me">
        <span class="acc-avatar acc-avatar-lg">${ini(u.name)}</span>
        <div class="acc-me-text">
          <strong>${esc(u.name)}</strong>
          <span>${esc(u.email)}</span>
          <a href="javascript:void(0)" onclick="showToast('View account', 'info')">View account</a>
          <a href="javascript:void(0)" onclick="showToast('My Microsoft 365 profile', 'info')">My Microsoft 365 profile</a>
        </div>
      </div>
      <div class="acc-section-title">Switch demo user</div>
      <div class="acc-users">
        ${Object.keys(profiles).map(k => {
          const p = profiles[k];
          const active = k === D.activeProfileKey;
          const waiting = cmsMyInbox(p.name).length;
          return `<button class="acc-user ${active ? 'active' : ''}" onclick="switchUserProfile('${k}')">
            <span class="acc-avatar">${ini(p.name)}</span>
            <span class="acc-user-text"><b>${esc(p.name)}</b><small>${esc(p.role || p.title || '')}</small></span>
            ${waiting ? `<span class="acc-count" title="${waiting} waiting for approval">${waiting}</span>` : ''}
            ${active ? '<span class="acc-check">&#10003;</span>' : ''}
          </button>`;
        }).join('')}
      </div>
      <button class="acc-other">${SP_ICONS.signin} Sign in with a different account</button>`;
    el.classList.add('open');
  };
  const origSwitchUser = window.switchUserProfile;
  window.switchUserProfile = function (key) {
    origSwitchUser(key);
    const av = document.querySelector('#userProfileBtn');
    if (av && D.currentUser.name) {
      const t = av.querySelector('span, div') || av;
      if (t && t.textContent.trim().length <= 3) t.textContent = D.currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    }
    spCloseMenus();
    switchRoute('statistics');
    saveState();
  };

  // ===========================================================================
  // 8. Excel contract import: real .xlsx template, parsing, validation, preview, docs, import (bug 23)
  // ===========================================================================
  // Same columns, sheets and rules as the live template (one row per contract version)
  const XL_COLS = ['ContractReferenceNo', 'Order', 'VersionType', 'AddendumNumber', 'ContractName', 'ContractType', 'ContractValue', 'StartDate', 'EndDate',
    'NoticePeriodInMonths', 'NewEffectiveDate', 'NewEndDate', 'ActualStartDate', 'ActualEndDate', 'Budgeted', 'BudgetCode', 'Renewable', 'Extendable',
    'ContractDescription', 'ProcurementMode', 'VendorJustification', 'Vendor1Name', 'Vendor1Price', 'Vendor2Name', 'Vendor2Price', 'Vendor3Name', 'Vendor3Price',
    'RecommendedVendor', 'RecommendationJustification'];
  const XL_REQUIRED = ['ContractReferenceNo', 'Order', 'VersionType', 'ContractType', 'ProcurementMode', 'Budgeted', 'Renewable', 'Extendable', 'ActualStartDate', 'ActualEndDate'];
  const XL_DATES = ['StartDate', 'EndDate', 'NewEffectiveDate', 'NewEndDate', 'ActualStartDate', 'ActualEndDate'];
  const XL_VALUES = {
    VersionType: ['New', 'Amendment', 'Renewal', 'Extension', 'Completion', 'Cancellation'],
    ContractType: ['Service', 'Purchase', 'Construction'],
    ProcurementMode: ['Competitive Bidding', 'Single Source'],
    Budgeted: ['Budgeted', 'Non-Budgeted'],
    Renewable: ['Yes', 'No'],
    Extendable: ['Yes', 'No']
  };
  const XL_MASTER = [
    ['ContractReferenceNo', 'Yes', 'Unique Contract Reference'],
    ['Order', 'Yes', '1,2,3... Sequential'],
    ['VersionType', 'Yes', 'New, Amendment, Renewal, Extension, Completion'],
    ['AddendumNumber', 'Conditional', 'Required when VersionType = Amendment'],
    ['ContractType', 'Yes', 'Service, Purchase, Construction'],
    ['ProcurementMode', 'Yes', 'Competitive Bidding, Single Source'],
    ['Budgeted', 'Yes', 'Budgeted, Non-Budgeted'],
    ['Renewable', 'Yes', 'Yes, No'],
    ['Extendable', 'Yes', 'Yes, No'],
    ['StartDate', 'No', 'DD-MMM-YYYY. Optional (informational).'],
    ['EndDate', 'No', 'DD-MMM-YYYY. Optional (informational).'],
    ['NoticePeriodInMonths', 'No', 'Whole months (e.g. 1, 2, 3).'],
    ['NewEffectiveDate', 'No', 'DD-MMM-YYYY. Optional (informational).'],
    ['NewEndDate', 'No', 'DD-MMM-YYYY. Optional (informational).'],
    ['ActualStartDate', 'Yes', 'DD-MMM-YYYY. Mandatory for every version.'],
    ['ActualEndDate', 'Yes', 'DD-MMM-YYYY. Mandatory for every version.'],
    ['BudgetCode', 'Conditional', 'Required when Budgeted = Budgeted'],
    ['VendorJustification', 'Conditional', 'Required when ProcurementMode = Single Source'],
    ['RecommendedVendor', 'Conditional', 'Required when ProcurementMode = Competitive Bidding']
  ];
  const xlRow = o => XL_COLS.map(c => o[c] == null ? '' : o[c]);
  const XL_EXAMPLE = [
    xlRow({ ContractReferenceNo: 'CON-DEMO-001', Order: 1, VersionType: 'New', ContractName: 'IT Support Services', ContractType: 'Service', ContractValue: 25000, StartDate: '01-Jan-2024', EndDate: '31-Dec-2024', NoticePeriodInMonths: 2, ActualStartDate: '01-Jan-2024', ActualEndDate: '31-Dec-2024', Budgeted: 'Budgeted', BudgetCode: 'BG-2024-01', Renewable: 'Yes', Extendable: 'Yes', ContractDescription: 'Annual IT support and maintenance', ProcurementMode: 'Competitive Bidding', Vendor1Name: 'Alpha Tech', Vendor1Price: 25000, Vendor2Name: 'Beta Solutions', Vendor2Price: 26500, RecommendedVendor: 'Vendor1', RecommendationJustification: 'Lowest compliant technical offer' }),
    xlRow({ ContractReferenceNo: 'CON-DEMO-001', Order: 2, VersionType: 'Amendment', AddendumNumber: 'A1', ContractName: 'IT Support Services', ContractType: 'Service', ContractValue: 30000, StartDate: '01-Jan-2024', EndDate: '31-Dec-2024', NoticePeriodInMonths: 2, NewEffectiveDate: '01-Jul-2024', NewEndDate: '31-Dec-2024', ActualStartDate: '01-Jul-2024', ActualEndDate: '31-Dec-2024', Budgeted: 'Budgeted', BudgetCode: 'BG-2024-01', Renewable: 'Yes', Extendable: 'Yes', ContractDescription: 'Scope increased', ProcurementMode: 'Single Source', VendorJustification: 'Continuation with the current vendor', Vendor1Name: 'Alpha Tech', Vendor1Price: 30000, RecommendationJustification: 'Incumbent vendor already onboarded' }),
    xlRow({ ContractReferenceNo: 'CON-DEMO-001', Order: 3, VersionType: 'Renewal', ContractName: 'IT Support Services', ContractType: 'Service', StartDate: '01-Jan-2024', EndDate: '31-Dec-2024', NoticePeriodInMonths: 2, NewEffectiveDate: '01-Jan-2025', NewEndDate: '31-Dec-2025', ActualStartDate: '01-Jan-2025', ActualEndDate: '31-Dec-2025', Budgeted: 'Budgeted', BudgetCode: 'BG-2025-01', Renewable: 'Yes', Extendable: 'Yes', ContractDescription: 'Renewed for a further year', ProcurementMode: 'Single Source', VendorJustification: 'Renewal with the current vendor', Vendor1Name: 'Alpha Tech', Vendor1Price: 30000, RecommendationJustification: 'Renewed with existing terms' })
  ];
  window.xlExampleRows = XL_EXAMPLE;
  const XL_EMPTY = () => ({ step: 1, file: null, rows: [], errors: [], contracts: [], dept: {}, vdocs: {}, importedRows: [], importedVersions: 0 });
  const XL = XL_EMPTY();

  // CRC32 for the zip container of the .xlsx
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zipStore(files) {
    const enc = new TextEncoder();
    const parts = [], central = [];
    let offset = 0;
    files.forEach(([name, text]) => {
      const nb = enc.encode(name), data = enc.encode(text), crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint32(14, crc, true);
      lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, nb.length, true);
      parts.push(new Uint8Array(lh.buffer), nb, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint32(16, crc, true);
      ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, nb.length, true); ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), nb);
      offset += 30 + nb.length + data.length;
    });
    const csize = central.reduce((a, p) => a + p.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, csize, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function xlCol(i) { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function buildTemplateXlsx(dataRows = []) {
    const sheetXml = (rows, boldRow) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${
      rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => v === '' ? '' : typeof v === 'number'
        ? `<c r="${xlCol(ci)}${ri + 1}"><v>${v}</v></c>`
        : `<c r="${xlCol(ci)}${ri + 1}" t="inlineStr"${ri === boldRow ? ' s="1"' : ''}><is><t>${esc(v)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`;
    const sheets = [
      ['Sample Data', sheetXml([XL_COLS].concat(dataRows), 0)],
      ['Example Rows', sheetXml([['Example rows — for reference only. Do NOT upload this sheet; enter your data on the "Sample Data" sheet.'], XL_COLS].concat(XL_EXAMPLE), 1)],
      ['Master Sheet', sheetXml([['Column Name', 'Required', 'Accepted Values / Notes']].concat(XL_MASTER, [[''], ['Date Format'], ['DD-MMM-YYYY'], ['Example: 01-Jan-2024']]), 0)],
      ['Lists', sheetXml(XL_VALUES.ContractType.map(v => [v]), -1)]
    ];
    return zipStore([
      ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((x, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map(([n], i) => `<sheet name="${n}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`],
      ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((x, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      ['xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" applyFont="1"/></cellXfs></styleSheet>'],
      ...sheets.map(([, xml], i) => [`xl/worksheets/sheet${i + 1}.xml`, xml])
    ]);
  }
  window.downloadImportTemplate = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(buildTemplateXlsx());
    a.download = 'CMS_Contract_Import_Template.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    showToast('Template downloaded', 'success');
  };
  window.xlBuildTemplateBlob = buildTemplateXlsx;

  async function unzipEntries(buf) {
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let eocd = -1;
    for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('This file is not a valid .xlsx workbook');
    const out = {};
    let ptr = view.getUint32(eocd + 16, true);
    for (let n = 0, cnt = view.getUint16(eocd + 10, true); n < cnt; n++) {
      const method = view.getUint16(ptr + 10, true), csize = view.getUint32(ptr + 20, true);
      const nl = view.getUint16(ptr + 28, true), el = view.getUint16(ptr + 30, true), cl = view.getUint16(ptr + 32, true), lo = view.getUint32(ptr + 42, true);
      const name = new TextDecoder().decode(buf.subarray(ptr + 46, ptr + 46 + nl));
      if (/^xl\/(sharedStrings|worksheets\/sheet1)\.xml$/.test(name)) {
        const start = lo + 30 + view.getUint16(lo + 26, true) + view.getUint16(lo + 28, true);
        const data = buf.subarray(start, start + csize);
        out[name] = method === 0 ? new TextDecoder().decode(data) : await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
      }
      ptr += 46 + nl + el + cl;
    }
    return out;
  }
  async function readXlsx(file) {
    const files = await unzipEntries(new Uint8Array(await file.arrayBuffer()));
    if (!files['xl/worksheets/sheet1.xml']) throw new Error('No worksheet found in the workbook');
    const P = s => new DOMParser().parseFromString(s, 'application/xml');
    const shared = files['xl/sharedStrings.xml'] ? [...P(files['xl/sharedStrings.xml']).getElementsByTagName('si')].map(si => si.textContent) : [];
    const rows = [];
    [...P(files['xl/worksheets/sheet1.xml']).getElementsByTagName('row')].forEach(r => {
      const row = [];
      [...r.getElementsByTagName('c')].forEach(c => {
        const ref = c.getAttribute('r') || '';
        const col = ref.replace(/\d+/g, '').split('').reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
        const t = c.getAttribute('t');
        const v = c.getElementsByTagName('v')[0];
        let val = t === 's' ? shared[+v.textContent] : t === 'inlineStr' ? c.textContent : v ? v.textContent : '';
        row[col >= 0 ? col : row.length] = val;
      });
      rows.push(row);
    });
    return rows;
  }
  function xlDate(v) {
    if (v == null || v === '') return '';
    if (/^\d+(\.\d+)?$/.test(String(v)) && +v > 20000) {           // Excel serial date
      const d = new Date(Math.round((+v - 25569) * 86400000));
      return d.toISOString().slice(0, 10);
    }
    const d = new Date(v);
    return isNaN(d) ? 'INVALID' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function xlValidate(raw) {
    const header = (raw[0] || []).map(h => String(h || '').trim());
    const errors = [];
    const missingCols = XL_REQUIRED.filter(c => !header.includes(c));
    if (missingCols.length) return { rows: [], errors: [{ row: 1, col: missingCols.join(', '), msg: 'Required column missing from header' }] };
    const idx = c => header.indexOf(c);
    const rows = raw.slice(1).filter(r => r && r.some(v => String(v || '').trim())).map((r, i) => {
      const o = { _row: i + 2 };
      XL_COLS.forEach(c => { o[c] = idx(c) >= 0 ? String(r[idx(c)] == null ? '' : r[idx(c)]).trim() : ''; });
      return o;
    });
    if (!rows.length) errors.push({ row: 2, col: '-', msg: 'The sheet has no contract rows' });
    const need = (o, c, when) => { if (!o[c]) errors.push({ row: o._row, col: c, msg: `Required when ${when}` }); };
    rows.forEach(o => {
      XL_REQUIRED.forEach(c => { if (!o[c]) errors.push({ row: o._row, col: c, msg: `${c} is required.` }); });
      Object.entries(XL_VALUES).forEach(([c, list]) => { if (o[c] && !list.includes(o[c])) errors.push({ row: o._row, col: c, msg: c === 'ContractType' ? 'ContractType does not exist in SharePoint Contract Type list.' : `${c} must be ${list.join(' or ')}.` }); });
      if (o.VersionType === 'Amendment') need(o, 'AddendumNumber', 'VersionType = Amendment');
      if (o.Budgeted === 'Budgeted') need(o, 'BudgetCode', 'Budgeted = Budgeted');
      if (o.ProcurementMode === 'Single Source') need(o, 'VendorJustification', 'ProcurementMode = Single Source');
      if (o.ProcurementMode === 'Competitive Bidding') need(o, 'RecommendedVendor', 'ProcurementMode = Competitive Bidding');
      if (o.Order && !/^\d+$/.test(o.Order)) errors.push({ row: o._row, col: 'Order', msg: 'Must be 1,2,3... sequential' });
      if (o.ContractValue && isNaN(Number(String(o.ContractValue).replace(/,/g, '')))) errors.push({ row: o._row, col: 'ContractValue', msg: 'Must be a number' });
      XL_DATES.forEach(c => { o[c] = xlDate(o[c]); if (o[c] === 'INVALID') errors.push({ row: o._row, col: c, msg: 'Invalid date (use DD-MMM-YYYY)' }); });
      if (o.ActualStartDate && o.ActualEndDate && o.ActualStartDate !== 'INVALID' && o.ActualEndDate !== 'INVALID' && o.ActualEndDate < o.ActualStartDate) errors.push({ row: o._row, col: 'ActualEndDate', msg: 'ActualEndDate is before ActualStartDate' });
      if (o.Order === '1' && impRefTaken(o.ContractReferenceNo)) errors.push({ row: o._row, col: 'ContractReferenceNo', msg: 'A contract with this reference already exists' });
    });
    xlGroup(rows).forEach(c => c.versions.forEach((v, i) => { if (v.Order && String(i + 1) !== v.Order) errors.push({ row: v._row, col: 'Order', msg: 'Must be 1,2,3... sequential' }); }));
    return { rows, errors };
  }
  function xlGroup(rows) {
    const map = {};
    rows.forEach(r => { (map[r.ContractReferenceNo] = map[r.ContractReferenceNo] || []).push(r); });
    return Object.entries(map).map(([ref, list]) => {
      const versions = list.slice().sort((a, b) => a.Order - b.Order);
      const latest = versions[versions.length - 1];
      // Optional cells carry forward from the previous version
      const carry = c => (versions.slice().reverse().find(v => v[c]) || {})[c] || '';
      const pick = (latest.RecommendedVendor.match(/^Vendor([123])$/) || [])[1];
      return { ref, versions, latest, first: versions[0], name: carry('ContractName'), type: carry('ContractType'),
        vendor: pick ? latest[`Vendor${pick}Name`] : latest.RecommendedVendor || latest.Vendor1Name,
        value: Number(String(carry('ContractValue')).replace(/,/g, '')) || 0 };
    });
  }

  function xlRender() {
    for (let i = 1; i <= 6; i++) {
      const pill = document.getElementById(`importStep${i}`);
      if (pill) { pill.classList.remove('active', 'completed'); if (i === XL.step) pill.classList.add('active'); else if (i < XL.step) pill.classList.add('completed'); }
    }
    const card = document.querySelector('#view-excel-import .detail-view-main-card');
    if (!card) return;
    let body = '', next = '', back = XL.step > 2 && XL.step < 6 ? `<button class="btn-outline-teal" onclick="xlGo(${XL.step - 1})">Back</button>` : '';
    const versionsCount = XL.contracts.reduce((n, c) => n + c.versions.length, 0);
    const verLabel = v => v.VersionType === 'New' ? 'Initial Contract' : v.VersionType;
    const xlDash = iso => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    if (XL.step === 1) {
      body = `<h3 class="xl-h">Excel Contract Import</h3><p class="xl-sub">Upload a populated ".xlsx" file</p>
        <label class="file-drop-zone xl-drop" id="xlDrop">
          <div style="font-size: 26px; color: #0f766e;">&#8679;</div>
          <div style="font-size: 15px; font-weight: 700; color: #1e293b;">Drag &amp; Drop Excel Here</div>
          <div style="font-size: 12px; color: #64748b;">OR</div>
          <span class="btn-teal-primary" style="padding: 8px 18px;">Browse File</span>
          <div style="font-size: 11px; color: #94a3b8;">Supported format: .xlsx only</div>
          <input type="file" accept=".xlsx" style="display:none" onchange="xlPick(this.files[0])">
        </label>
        ${XL.file ? `<div class="xl-file">&#10003; <b>FILE UPLOADED</b> ${esc(XL.file.name)} <span>${(XL.file.size / 1024).toFixed(2)} KB</span></div>` : ''}`;
      next = `<button class="btn-filter-reset" onclick="switchRoute('import')">Cancel</button><button class="btn-teal-primary" ${XL.file ? '' : 'disabled'} onclick="xlGo(XL_ERRORS() ? 2 : 3)">Upload Excel</button>`;
    } else if (XL.step === 2) {
      body = `<div class="xl-head-row"><div><h3 class="xl-h">Validation Report</h3><p class="xl-sub">Fix the errors below and upload a corrected workbook before continuing.</p></div>
          <button class="btn-teal-primary" onclick="xlErrorReport()">Download Error Report</button></div>
        <div class="xl-hint"><b>Review validation issues before proceeding</b><span>Download the error report, correct the workbook, then upload the updated file to continue.</span></div>
        <table class="cms-table xl-table"><thead><tr><th>Row Number</th><th>Column Name</th><th>Error Message</th></tr></thead><tbody>
        ${XL.errors.map(e => `<tr><td>${e.row}</td><td>${esc(e.col)}</td><td>${esc(e.msg)}</td></tr>`).join('')}</tbody></table>
        <p class="xl-sub" style="margin-top: 14px;">Correct the listed issues to enable preview.</p>`;
      next = `<button class="btn-outline-teal" onclick="xlGo(1)">Upload Corrected Excel</button>`;
    } else if (XL.step === 3) {
      body = `<h3 class="xl-h">Preview Contracts</h3><p class="xl-sub">Review the grouped contracts and version chain before document upload.</p>
        ${XL.contracts.map(c => `<div class="xl-card">
          <div class="xl-card-head"><b>&#8964; ${esc(c.ref)}</b><span>${c.versions.length} versions</span></div>
          ${c.versions.map(v => `<div class="xl-ver">
            <div class="xl-ver-head"><span><span class="nc-period-tag ${v.VersionType === 'New' ? 'new' : v.VersionType.toLowerCase()}" style="margin-left: 0;">${esc(verLabel(v).toUpperCase())}</span> <b>${esc(v.ContractName || c.name)}</b></span><b class="xl-ver-value">${(Number(String(v.ContractValue).replace(/,/g, '')) || c.value).toLocaleString()} KWD</b></div>
            <div class="xl-ver-grid">
              ${[['CONTRACT REFERENCE NO.', c.ref], ['CONTRACT TYPE', v.ContractType || c.type], ['VENDOR NAME', c.vendor], ['ACTUAL START DATE', xlDash(v.ActualStartDate)], ['ACTUAL END DATE', xlDash(v.ActualEndDate)]].map(([l, x]) => `<div><label>${l}</label>${esc(x)}</div>`).join('')}
            </div></div>`).join('')}
        </div>`).join('')}`;
      next = `<button class="btn-teal-primary" onclick="xlGo(4)">Continue to Documents</button>`;
    } else if (XL.step === 4) {
      const depts = [...new Set(D.departments.concat(['Facilities Management']))];
      body = `<h3 class="xl-h">Upload Documents</h3><p class="xl-sub">Documents are attached per version. Required uploads must be completed before import.</p>
        ${XL.contracts.map((c, i) => `<div class="xl-card">
          <div class="xl-card-head"><b>&#8964; ${esc(c.ref)}</b><span>${c.versions.length} versions</span></div>
          <div class="imp-grid">
            <div class="imp-field"><label>BRANCH <span class="imp-req">*</span></label><select class="cms-select" disabled><option>${esc(D.branches[0])}</option></select></div>
            <div class="imp-field"><label>DEPARTMENT <span class="imp-req">*</span></label><select class="cms-select" id="xlDept${i}" onchange="XL_SET_DEPT('${esc(c.ref)}', this.value)"><option value="">Select Department</option>${depts.map(d => `<option ${XL.dept[c.ref] === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></div>
          </div>
          ${c.versions.map((v, vi) => {
            const prefix = v.VersionType === 'New' ? '' : `${v.VersionType} `;
            const keys = IMP_VERSION_TYPES[v.VersionType].docs;
            const got = (XL.vdocs[c.ref] || {})[vi] || {};
            return `<div class="xl-ver">
              <b>${esc(verLabel(v))}</b><small class="xl-ver-sub">${esc(verLabel(v))} &middot; ${esc(v.ContractName || c.name)} &middot; ${(Number(String(v.ContractValue).replace(/,/g, '')) || c.value).toLocaleString()}</small>
              <div class="xl-slots">${keys.map(k => `<div class="xl-slot"><b>${k === 'signedContract' ? 'Legal Signed Draft' : mgDocName(k, prefix)}</b>
                <label class="btn-outline-teal nc-doc-btn">${got[k] ? esc(got[k]) : 'Select File'}<input type="file" style="display:none" onchange="xlPickDoc('${esc(c.ref)}', ${vi}, '${k}', this.files[0])"></label></div>`).join('')}</div>
              <div class="imp-divider"><span>SUPPORTING DOCUMENTS</span></div>
              <label class="imp-doc-drop imp-doc-drop-wide">${got.supporting ? `<span>&#128206; ${esc(got.supporting)}</span>` : '<span>Drag &amp; drop files here, or click to browse</span><span class="imp-doc-sub">Supports: Docx, Pdf, Xlsx, Ppt, etc. (Max 50MB)</span>'}
                <input type="file" style="display:none" onchange="xlPickDoc('${esc(c.ref)}', ${vi}, 'supporting', this.files[0])"></label>
            </div>`;
          }).join('')}
        </div>`).join('')}`;
      next = `<button class="btn-teal-primary" onclick="xlToImport()">Continue to Import</button>`;
    } else if (XL.step === 5) {
      body = `<h3 class="xl-h">Ready to Import</h3><p class="xl-sub">This will create ${XL.contracts.length} contracts and ${versionsCount} version records using the existing migrated import logic.</p>
        <div class="xl-stats"><div><b>${XL.contracts.length}</b><span>CONTRACTS</span></div><div><b>${versionsCount}</b><span>VERSIONS</span></div></div>`;
      next = `<button class="btn-teal-primary" onclick="xlImport()">Import Contracts</button>`;
    } else {
      body = `<div class="xl-done"><h3>Import Complete</h3><p>Contracts Imported: ${XL.importedRows.length}</p><p>Versions Imported: ${XL.importedVersions}</p>
          <div class="xl-done-actions"><button class="btn-outline-teal" onclick="initExcelWizard()">Upload New Excel</button><button class="btn-teal-primary" onclick="switchRoute('import')">View Imported Contracts</button></div></div>
        <h3 class="xl-h" style="font-size: 14px;">Imported Contracts</h3><p class="xl-sub">Start the approval for each contract to continue the workflow.</p>
        <table class="cms-table xl-table"><thead><tr><th>Contract Reference No</th><th>Contract Name</th><th>Vendor Name</th><th>Contract Value</th><th>Action</th></tr></thead><tbody>
        ${XL.importedRows.map(c => `<tr><td>${esc(c.code)}</td><td>${esc(c.name)}</td><td>${esc(c.vendor)}</td><td>${esc(c.contractValue)} KWD</td><td><button class="btn-teal-primary nc-doc-btn" onclick="mgOpen('${c.id}', 'import')">Start Approval</button></td></tr>`).join('')}</tbody></table>`;
    }
    card.innerHTML = `${body}<div class="xl-actions">${back}${next}</div>`;
    const drop = document.getElementById('xlDrop');
    if (drop) {
      drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('dragging'); });
      drop.addEventListener('dragleave', () => drop.classList.remove('dragging'));
      drop.addEventListener('drop', e => { e.preventDefault(); xlPick(e.dataTransfer.files[0]); });
    }
  }
  window.xlPick = async file => {
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name)) { showToast('Only .xlsx files are supported', 'info'); return; }
    try {
      const raw = await readXlsx(file);
      const v = xlValidate(raw);
      Object.assign(XL, { file, rows: v.rows, errors: v.errors, contracts: xlGroup(v.rows), dept: {}, vdocs: {} });
      xlRender();
    } catch (e) { showToast(e.message, 'info'); }
  };
  window.xlReset = () => { Object.assign(XL, XL_EMPTY()); xlRender(); };
  window.xlGo = step => { XL.step = step; xlRender(); };
  window.XL_ERRORS = () => XL.errors.length;
  window.XL_SET_DEPT = (ref, dept) => { XL.dept[ref] = dept; };
  window.xlPickDoc = (ref, vi, key, file) => {
    if (!file) return;
    const byVersion = XL.vdocs[ref] = XL.vdocs[ref] || {};
    byVersion[vi] = byVersion[vi] || {};
    byVersion[vi][key] = file.name;
    xlRender();
  };
  window.xlToImport = () => {
    const missing = XL.contracts.findIndex(c => !XL.dept[c.ref]);
    if (missing >= 0) {
      const el = document.getElementById(`xlDept${missing}`);
      if (el) { el.classList.add('nc-invalid'); el.scrollIntoView({ block: 'center' }); }
      showToast('Please select a Department', 'info');
      return;
    }
    xlGo(5);
  };
  window.xlErrorReport = () => {
    const csv = ['Row Number,Column Name,Error Message'].concat(XL.errors.map(e => `${e.row},${e.col},"${e.msg}"`)).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'CMS_Contract_Import_Errors.csv';
    a.click();
  };
  window.xlImport = () => {
    XL.importedRows = [];
    XL.importedVersions = 0;
    XL.contracts.forEach(c => {
      const rows = c.versions;
      const docs = XL.vdocs[c.ref] || {};
      // Newest version first; each row of the file is one version
      const versions = rows.slice().reverse().map(v => ({
        type: v.VersionType,
        docs: { ...(docs[rows.indexOf(v)] || {}) },
        values: {
          name: v.ContractName, type: v.ContractType, value: v.ContractValue, start: v.StartDate, end: v.EndDate, actualStart: v.ActualStartDate, actualEnd: v.ActualEndDate,
          effective: v.NewEffectiveDate, newEnd: v.NewEndDate,
          notice: v.NoticePeriodInMonths || '1', description: v.ContractDescription, budget: v.Budgeted, budgetCode: v.BudgetCode, renewable: v.Renewable, extendable: v.Extendable,
          singleSource: v.ProcurementMode === 'Single Source', addendum: v.AddendumNumber, recJustification: v.RecommendationJustification,
          vendors: [1, 2, 3].filter(n => v[`Vendor${n}Name`]).map(n => ({ name: v[`Vendor${n}Name`], price: v[`Vendor${n}Price`] })),
          selectedVendor: Math.max(0, [1, 2, 3].filter(n => v[`Vendor${n}Name`]).findIndex(n => `Vendor${n}` === v.RecommendedVendor || v[`Vendor${n}Name`] === v.RecommendedVendor))
        }
      }));
      XL.importedRows.push(mgAdd({ id: `CNT-XL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, code: c.ref, department: XL.dept[c.ref], branch: D.branches[0], versions }));
      XL.importedVersions += versions.length;
    });
    XL.step = 6;
    xlRender();
    saveState();
  };
  window.initExcelWizard = () => { Object.assign(XL, XL_EMPTY()); xlRender(); };
  window.advanceExcelWizard = () => xlGo(Math.min(XL.step + 1, 6));
  window.simulateExcelUpload = () => {};

  // ===========================================================================
  // 9. Amendment: the draft editor shows previous versions and a comparison (bug 28)
  // ===========================================================================
  const origLoadDocEditor = window.ncLoadDocEditor;
  window.ncLoadDocEditor = function () {
    origLoadDocEditor();
    const shell = document.querySelector('#view-nc-doc-editor .nc-word-shell');
    const old = document.getElementById('amVersions');
    if (old) old.remove();
    const rec = NCState.current;
    if (!rec || rec.mode !== 'amend' || NCState.editorDocKey !== 'draft') return;
    const doc = rec.docs.draft;
    if (doc && !doc.baseHtml) doc.baseHtml = ncDocHtml('draft');
    const c = rec.sourceContract || {};
    const periods = (c.periods && c.periods.length ? c.periods : [{ type: 'New', start: rec.form.startDate, end: rec.form.endDate }]).slice().reverse();
    shell.insertAdjacentHTML('afterbegin', `
      <div id="amVersions" class="am-versions">
        <b>Contract versions</b>
        ${periods.map((p, i) => `<div class="am-v"><span class="nc-period-tag ${p.type.toLowerCase()}">${p.type === 'New' ? 'Initial Contract' : p.label || p.type}</span><small>${ncLongDate(p.start)} → ${ncLongDate(p.end)}</small></div>`).join('')}
        <div class="am-v am-current"><span class="nc-period-tag amendment">${esc(rec.modeValues.addendumNo || 'Amendment')}</span><small>Being edited</small></div>
        <button class="btn-outline-teal nc-doc-btn" onclick="amCompare()">&#8644; Compare with previous version</button>
      </div>`);
  };
  window.amCompare = function () {
    const rec = NCState.current;
    const before = (rec.docs.draft && rec.docs.draft.baseHtml) || '';
    const after = document.getElementById('ncWordPage').innerHTML;
    const words = h => { const t = document.createElement('div'); t.innerHTML = h; return (t.innerText || '').split(/(\s+)/).filter(Boolean); };
    const a = words(before), b = words(after);
    // word-level LCS diff
    const n = a.length, m = b.length;
    const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    let i = 0, j = 0, out = '';
    while (i < n && j < m) {
      if (a[i] === b[j]) { out += esc(a[i]); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) { out += `<del>${esc(a[i++])}</del>`; }
      else { out += `<ins>${esc(b[j++])}</ins>`; }
    }
    while (i < n) out += `<del>${esc(a[i++])}</del>`;
    while (j < m) out += `<ins>${esc(b[j++])}</ins>`;
    document.getElementById('ncDocPreviewTitle').textContent = 'Comparison with previous version';
    document.getElementById('ncDocPreviewFile').textContent = 'Comparison';
    document.getElementById('ncDocPreviewPage').innerHTML = `<div class="am-diff">${out.replace(/\n/g, '<br>')}</div>`;
    openModal('ncDocPreviewModal');
  };

  // ===========================================================================
  // Start-up: rebuild options, restore filters, re-render with restored data
  // ===========================================================================
  function startup() {
    refreshFilterOptions();
    if (restoredFilters) Object.entries(restoredFilters).forEach(([id, v]) => {
      const el = document.getElementById(id);
      if (el && [...el.options].some(o => o.value === v)) el.value = v;
    });
    try {
      filterRequests(); filterContracts(); renderStatistics(); renderImportBatches();
      if (CMSState.currentRoute === 'approvals') renderApprovals();
    } catch (e) { /* views not mounted yet */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(startup, 0));
  else setTimeout(startup, 0);
})();

// Edit Draft Content: saving without changes keeps the current version (as in UAT)
(function () {
  const origLoad = window.ncLoadDocEditor, origSave = window.ncSaveDocEditor;
  window.ncLoadDocEditor = function () {
    origLoad();
    const page = document.getElementById('ncWordPage');
    if (page) NCState.editorOriginal = page.innerHTML;
  };
  window.ncSaveDocEditor = function () {
    const page = document.getElementById('ncWordPage');
    if (page && page.innerHTML === NCState.editorOriginal) {
      showToast('Document saved', 'success');
      ncCloseDocEditor();
      return;
    }
    origSave();
  };
})();

// ===========================================================================
// UAT parity: approved documents, approval history panel, certificate
// ===========================================================================
(function () {
  const D = InnomickCMSData;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const longDate = v => { const d = new Date(v); return isNaN(d) ? (v || '') : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
  const badge = st => st === 'Approved' ? '<span class="uah-badge ok">Approved</span>'
    : /Change/.test(st) ? '<span class="uah-badge warn">Change Requested</span>'
    : /Reject/.test(st) ? '<span class="uah-badge bad">Rejected</span>'
    : `<span class="uah-badge">${esc(st)}</span>`;

  // Approver cards (newest first) for one document; skipCurrent leaves out the open cycle
  function approverCards(rec, key, skipCurrent) {
    const title = NC_DOC_META[key].title;
    const doc = rec.docs[key];
    const cycles = rec.history.filter(h => h.doc === title && !(skipCurrent && doc && doc.cycle && h.id === doc.cycle.id));
    const steps = [];
    cycles.forEach(h => h.steps.filter(st => st.actedOn).forEach(st => steps.push({ ...st, version: h.version || '1.0' })));
    if (!steps.length) return '<div class="nc-history-empty">No previous approvals found.</div>';
    return steps.map((st, i) => `
      <div class="uah-card">
        <div class="uah-top">
          <span class="uah-icon ${st.state === 'Approved' ? 'ok' : ''}">${st.state === 'Approved' ? '&#10003;' : steps.length - i}</span>
          <div class="uah-who"><b>${esc(st.approver)}</b>
            <small>Assigned on ${esc(st.assignedOn || '')}</small>
            <small>Action taken on ${esc(st.actedOn)}</small></div>
          <div class="uah-right">${badge(st.state)}<span class="uah-ver">${esc(st.version)}</span></div>
        </div>
        <div class="uah-comments"><span>COMMENTS</span><div>${esc(st.remarks || '-')}</div></div>
      </div>`).join('');
  }

  window.ncToggleApprovalPanel = key => {
    NCState.openApprovalPanel = NCState.openApprovalPanel === key ? null : key;
    ncRenderPrimaryDocs();
  };

  window.ncApprovedDocCard = function (rec, key, doc, icon, versionsOpen) {
    const histOpen = NCState.openApprovalPanel === key;
    return `
      <div class="nc-doc-card">
        <div class="nc-doc-card-head">
          <span class="nc-doc-card-title">${icon} ${ncDocTitle(rec, key)}</span>
          <span class="nc-doc-head-right"><span class="badge-approved nc-doc-pill">Approved</span>
          <button class="nc-doc-chevron" title="Collapse" onclick="this.closest('.nc-doc-card').classList.toggle('collapsed')">&#8964;</button></span>
        </div>
        <div class="nc-doc-card-body">
          <div class="nc-doc-meta">ID: ${rec.refNo} &nbsp;&nbsp; Submitted: ${longDate(doc.submitted)} &nbsp;&nbsp; Approved: ${esc(doc.approvedOn || '')}</div>
          <div class="nc-doc-actions">
            <button class="btn-outline-teal nc-doc-btn" onclick="ncToggleApprovalPanel('${key}')">&#9745; Approval History</button>
            <button class="btn-outline-teal nc-doc-btn" onclick="ncToggleVersions('${key}')">&#8635; Version History</button>
            <div class="nc-view-menu-wrap">
              <button class="btn-outline-teal nc-doc-btn" onclick="ncToggleViewMenu(event, '${key}')">&#128065; View</button>
              <div class="nc-view-menu" id="ncViewMenu_${key}">
                <button onclick="ncPreviewDoc('${key}')">Open in Browser</button>
                <button onclick="ncDownloadDoc('${key}', true)">Open in Desktop App</button>
              </div>
            </div>
          </div>
        </div>
        ${histOpen ? `
          <div class="nc-version-panel">
            <div class="nc-version-head"><span>&#9745; APPROVAL HISTORY</span><button class="btn-close-modal" style="font-size: 18px;" onclick="ncToggleApprovalPanel('${key}')">&times;</button></div>
            <div class="uah-list">${approverCards(rec, key, false)}</div>
          </div>` : ''}
        ${versionsOpen ? ncVersionPanelHtml(key, doc) : ''}
      </div>`;
  };

  // Certificate (same content in the Certificate tab and the approval-page popup)
  window.ncCertHtml = function (rec, key) {
    const f = rec.form;
    const doc = rec.docs[key];
    const reqType = rec.mode ? NC_MODES[rec.mode].requestType : 'New';
    const cyc = doc && doc.cycle;
    const acted = cyc ? cyc.steps.filter(s => s.state === 'Approved') : [];
    const fmt = v => { const d = new Date(v); return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); };
    const cell = (l, v) => `<div class="ucert-cell"><span>${l}</span><b>${esc(v)}</b></div>`;
    const logo = document.querySelector('.cms-logo-img, .header-logo img, img[alt*="nnomick" i]');
    return `
      <div class="ucert-page">
        <div class="ucert-brand">${logo ? `<img src="${logo.src}" alt="">` : ''}<div>INNOMICK GROUP</div></div>
        <h3>${key === 'letter' ? 'Request Letter' : 'Contract Draft'} Document Approval Certificate</h3>
        <div class="ucert-ref">Certificate Ref: ${esc(rec.refNo)}-${reqType.toUpperCase()}</div>
        <div class="ucert-sec">DOCUMENT OVERVIEW</div>
        <div class="ucert-grid">
          ${cell('CONTRACT REFERENCE NUMBER', rec.refNo)}${cell('CONTRACT NAME', f.name)}
          ${cell('CONTRACT TYPE', rec.contractType)}${cell('REQUEST TYPE', reqType)}
          ${cell('VENDOR NAME', (f.vendors[f.selectedVendor] || {}).name || '')}${cell('CONTRACT VALUE', `${Number(f.value || 0).toLocaleString()} KWD`)}
          ${cell('DEPARTMENT', rec.department)}${cell('BRANCH', rec.branch || D.currentUser.branch || 'Innomick')}
          ${cell('START DATE', fmt(f.startDate))}${cell('END DATE', fmt(f.endDate))}
        </div>
        <div class="ucert-sec">DIGITAL APPROVAL CHAIN</div>
        ${acted.length ? acted.map(s => `
          <div class="ucert-step">
            <div class="ucert-step-top"><span class="uah-icon ok">&#10003;</span><div class="uah-who"><b>${esc(s.title)}</b><small>${esc(s.approver)}</small></div>
              <span class="ucert-ver">Version ${esc((doc.versions[0] || {}).version || '1.0')}</span>
              <div class="ucert-when"><span class="uah-badge ok">Approved</span><small>Approved on ${esc(s.actedOn)}</small></div></div>
            <div class="uah-comments"><span>COMMENTS</span><div>${esc(s.remarks || '-')}</div></div>
          </div>`).join('') : '<div class="ucert-empty">No approval actions recorded.</div>'}
        <div class="ucert-gen">Generated: ${fmt(new Date())}</div>
      </div>`;
  };

  function certModal(rec, key) {
    let m = document.getElementById('ucertModal');
    if (!m) {
      m = document.createElement('div');
      m.className = 'modal-overlay';
      m.id = 'ucertModal';
      document.body.appendChild(m);
    }
    m.innerHTML = `
      <div class="modal-box ucert-modal">
        <div class="ucert-head"><b>Approval Certificate &middot; ${esc(rec.refNo)}</b>
          <span><button class="btn-outline-teal" onclick="window.print()">&#8615; Download PDF</button>
          <button class="btn-teal-primary" onclick="closeModal('ucertModal')">&times; Close</button></span></div>
        <div class="ucert-scroll">${ncCertHtml(rec, key)}</div>
      </div>`;
    openModal('ucertModal');
  }
  window.ncViewCertificate = key => certModal(NCState.current, key);

  // Certificate tab: shown once a document has its final approval
  function ensureCertTab() {
    const hist = document.getElementById('ncTabBtnHistory');
    if (!hist || document.getElementById('ncTabBtnCertificate')) return;
    const btn = document.createElement('button');
    btn.className = 'detail-subtab-btn';
    btn.id = 'ncTabBtnCertificate';
    btn.style.display = 'none';
    btn.innerHTML = '&#128737; Certificate';
    btn.onclick = () => ncSwitchTab('certificate');
    hist.after(btn);
    const histPanel = document.getElementById('ncPanelHistory');
    const panel = document.createElement('div');
    panel.id = 'ncPanelCertificate';
    panel.style.display = 'none';
    histPanel.after(panel);
  }
  const origSwitch = window.ncSwitchTab;
  window.ncSwitchTab = function (tab) {
    origSwitch(tab);
    ensureCertTab();
    const btn = document.getElementById('ncTabBtnCertificate');
    const panel = document.getElementById('ncPanelCertificate');
    if (!btn) return;
    btn.classList.toggle('active', tab === 'certificate');
    panel.style.display = tab === 'certificate' ? 'block' : 'none';
    if (tab === 'certificate') {
      const rec = NCState.current;
      const keys = ncDocKeys(rec).filter(k => rec.docs[k] && rec.docs[k].finalApproved);
      panel.innerHTML = keys.map(k => `
        <div class="ucert-tabwrap">
          <div class="ucert-head"><b>Approval Certificate &middot; ${esc(rec.refNo)}</b><button class="btn-outline-teal" onclick="window.print()">&#8615; Download PDF</button></div>
          <div class="ucert-scroll">${ncCertHtml(rec, k)}</div>
        </div>`).join('');
    }
  };
  const origRenderDocs = window.ncRenderPrimaryDocs;
  window.ncRenderPrimaryDocs = function () {
    origRenderDocs();
    ensureCertTab();
    const rec = NCState.current;
    const btn = document.getElementById('ncTabBtnCertificate');
    if (btn && rec) btn.style.display = ncDocKeys(rec).some(k => rec.docs[k] && rec.docs[k].finalApproved) ? '' : 'none';
  };

  // Approval page: certificate only for a Final Approval cycle; previous approvals = earlier cycles
  const origApprovePage = window.ncRenderApprovePage;
  window.ncRenderApprovePage = function (id) {
    origApprovePage(id);
    const ctx = ncApproveContext(id);
    if (!ctx) return;
    const certBtn = [...document.querySelectorAll('#ncApproveRoot .ap-header-actions button')].find(b => /Certificate/.test(b.textContent));
    if (certBtn && !ctx.doc.finalApproval) certBtn.style.display = 'none';
  };
  window.ncApprovePrevious = function () {
    const ctx = ncApproveContext(NCApprove.item.id);
    const m = document.getElementById('approvalHistoryModal');
    const head = m.querySelector('.modal-box > div:first-child');
    const title = head && [...head.querySelectorAll('*')].find(el => !el.children.length && /History|Approvals/.test(el.textContent));
    if (title) title.textContent = 'Previous Approvals';
    m.querySelector('.modal-box > div:nth-child(2)').innerHTML =
      `<div class="uah-label">APPROVAL HISTORY</div><div class="uah-list">${approverCards(ctx.rec, ctx.item.ncDoc, true)}</div>`;
    openModal('approvalHistoryModal');
  };
})();

// Notifications (UAT): one entry per approval step waiting on the current user, oldest first
(function () {
  const D = InnomickCMSData;
  function stepNo(item) {
    if (!item.stepNo) {
      D.nextStepNo = D.nextStepNo || 5371;
      item.stepNo = D.nextStepNo++;
    }
    return item.stepNo;
  }
  function pending() {
    const list = cmsMyInbox();
    list.forEach(stepNo);
    return list.sort((a, b) => a.stepNo - b.stepNo);
  }
  window.cmsUpdateNotifBadge = function () {
    const n = cmsMyInbox().length;
    const b = document.getElementById('sidebarNotifBadge');
    if (b) b.textContent = n;
    const p = document.querySelector('.profile-menu-badge');
    if (p) p.textContent = `${n} Pending`;
  };
  window.renderNotifications = function () {
    const container = document.getElementById('notificationsListContainer');
    if (!container) return;
    const list = pending();
    const expiring = D.contracts.filter(c => c.status === 'Notice Period');
    const expiryDate = c => (c.durationDates || '').split(' - ')[1].replace(/(\d\d)$/, '20$1');
    cmsUpdateNotifBadge();
    container.className = 'notifications-sp-list';
    container.innerHTML = list.length || expiring.length ? list.map(i => `
      <div class="notification-sp-row unotif-row">
        <div class="notification-sp-msg"><b class="unotif-step">#STEP${i.stepNo}</b> <span>A contract request document has been submitted for your approval</span></div>
        <button class="btn-take-action" onclick="openApprovalDetail('${i.id}')">Take Action</button>
      </div>`).join('') + expiring.map(c => `
      <div class="notification-sp-row">
        <div class="notification-sp-msg"><b class="unotif-step">${mgEsc(c.code)}</b> <span>Contract ${mgEsc(c.code)} is going to expire on ${mgEsc(expiryDate(c))}</span></div>
        <button class="btn-take-action" onclick="openContractDetailsById('${c.id}')">Take Action</button>
      </div>`).join('') : '<div class="empty-table-state">No notifications available.</div>';
  };
  const origSwitch = window.switchRoute;
  window.switchRoute = function () {
    const r = origSwitch.apply(this, arguments);
    try { cmsUpdateNotifBadge(); } catch (e) {}
    return r;
  };
  setTimeout(cmsUpdateNotifBadge, 0);
})();

// Contract selection pages (Renew / Cancel / Amend / Extend / Complete): Vendor and Category start at "Select..." like UAT
(function () {
  const orig = window.switchRoute;
  window.switchRoute = function (route) {
    const r = orig.apply(this, arguments);
    if (route === 'contract_selection') {
      ['csFilterVendor', 'csFilterCategory'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        let o = [...sel.options].find(x => x.value === 'all');
        if (!o) { o = new Option('Select...', 'all'); sel.insertBefore(o, sel.firstChild); }
        o.textContent = 'Select...';
      });
      const c = document.getElementById('csFilterCategory');
      if (c && c.value !== 'all') { c.value = 'all'; if (window.applyCSFilters) applyCSFilters(); }
    }
    return r;
  };
})();

// ===========================================================================
// UAT parity: reject confirmation, Approved > actual dates > Active, signed documents,
// parent contract archived by a new request, Pending Execution card
// ===========================================================================
(function () {
  const D = InnomickCMSData;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const isLive = rec => ['Approved', 'Active'].includes(rec.status) && !['cancel', 'completion'].includes(rec.mode);
  const liveContract = rec => D.contracts.find(c => c.id === (rec.sourceContract ? rec.sourceContract.id : `CNT-${rec.id}`));

  function confirmBox(title, msg, noLabel, yesLabel, onYes) {
    let m = document.getElementById('uConfirmModal');
    if (!m) {
      m = document.createElement('div');
      m.className = 'modal-overlay';
      m.id = 'uConfirmModal';
      document.body.appendChild(m);
    }
    m.innerHTML = `
      <div class="modal-box uconfirm-box">
        <div class="uconfirm-head"><b>${title}</b><button class="btn-close-modal" onclick="closeModal('uConfirmModal')">&times;</button></div>
        <div class="uconfirm-msg">${msg}</div>
        <div class="uconfirm-foot"><button class="btn-outline-teal" onclick="closeModal('uConfirmModal')">${noLabel}</button><button class="btn-teal-primary" id="uConfirmYes">${yesLabel}</button></div>
      </div>`;
    m.querySelector('#uConfirmYes').onclick = () => { closeModal('uConfirmModal'); onYes(); };
    openModal('uConfirmModal');
  }

  // Reject asks once more before it is applied
  const origRemarks = window.ncRemarksSubmit;
  window.ncRemarksSubmit = function () {
    if (NCApprove.action !== 'Reject' || !document.getElementById('ncRemarksText').value.trim()) return origRemarks();
    confirmBox('Reject', 'Are you sure you want to reject this request?', 'Back', '&#10005; Confirm', origRemarks);
  };

  // Approved request: form locked, Actual Start / End Date, saved once and then Active
  function actualRow(rec) {
    let row = document.getElementById('ncActualRow');
    if (!row) {
      row = document.createElement('div');
      row.id = 'ncActualRow';
      row.className = 'nc-actual-row';
      document.getElementById('ncNotice').closest('.detail-field-box').parentElement.after(row);
    }
    const active = rec.status === 'Active';
    row.style.display = isLive(rec) ? 'flex' : 'none';
    if (!isLive(rec)) return;
    row.innerHTML = `
      <label class="detail-field-label">Actual Start Date</label><input type="date" class="detail-field-input" id="ncActualStart" value="${rec.actualStart || ''}" ${active ? 'disabled' : ''}>
      <label class="detail-field-label">Actual End Date</label><input type="date" class="detail-field-input" id="ncActualEnd" value="${rec.actualEnd || rec.form.endDate || ''}" ${active ? 'disabled' : ''}>
      ${active ? '' : '<button class="btn-teal-primary" onclick="ncActualSave()">Save</button>'}`;
  }
  window.ncActualSave = function () {
    const rec = NCState.current;
    const start = document.getElementById('ncActualStart').value;
    const end = document.getElementById('ncActualEnd').value;
    if (!start || !end) { showToast('Please select Actual Start Date and Actual End Date', 'info'); return; }
    if (end < start) { showToast('Actual End Date cannot be before Actual Start Date', 'info'); return; }
    confirmBox('Info', 'Actual Start Date can be updated only once.<br>Are you sure you want to update?', 'Cancel', 'Yes', () => {
      Object.assign(rec, { status: 'Active', actualStart: start, actualEnd: end });
      const row = D.requests.find(r => r.id === rec.id);
      const dates = `${ncShortDate(start)} - ${ncShortDate(end)}`;
      if (row) Object.assign(row, { status: 'Active', isPendingActivation: false, durationDates: dates });
      const c = liveContract(rec);
      if (c) Object.assign(c, { status: 'Active', durationDates: dates, durationMonths: ncMonthsBetween(start, end) });
      cmsSaveState();
      ncOpenDetails(rec.id);
      ncSwitchTab('primary');
    });
  };

  const origOpen = window.ncOpenDetails;
  window.ncOpenDetails = function (id) {
    origOpen(id);
    const rec = NCState.current;
    if (!rec) return;
    actualRow(rec);
    if (isLive(rec)) {
      ['ncName', 'ncValue', 'ncStartDate', 'ncEndDate', 'ncNotice'].forEach(x => { document.getElementById(x).disabled = true; });
      document.querySelectorAll('#ncPanelDetail input, #ncPanelDetail textarea, #ncPanelDetail select').forEach(el => { el.disabled = true; });
    }
  };

  // Approved / Active: optional signed copies above the document cards
  const origDocs = window.ncRenderPrimaryDocs;
  window.ncRenderPrimaryDocs = function () {
    origDocs();
    const rec = NCState.current;
    const wrap = document.getElementById('ncPrimaryDocs');
    if (!rec || !wrap || !isLive(rec)) return;
    const signed = rec.signed || {};
    const card = (key, title, sub) => `
      <div class="nc-signed-card"><h4>${title}</h4><p>${sub}</p>
        ${signed[key] ? `<div class="nc-signed-file">&#128206; ${esc(signed[key])}</div>` : ''}
        <label class="btn-outline-teal nc-doc-btn">&#8679; Select File<input type="file" style="display:none" onchange="ncSignedPick('${key}', this.files[0])"></label>
      </div>`;
    wrap.insertAdjacentHTML('afterbegin', `<div class="nc-signed-grid">
      ${card('letter', 'Signed Contract Request Letter', 'Optional — signed Contract Request Letter')}
      ${card('contract', 'Legal Signed Contract', 'Optional — signed contract')}</div>`);
  };
  window.ncSignedPick = function (key, file) {
    if (!file) return;
    const rec = NCState.current;
    rec.signed = { ...(rec.signed || {}), [key]: file.name };
    cmsSaveState();
    ncRenderPrimaryDocs();
  };

  // A new request on a contract archives that contract straight away
  const origFrom = window.ncCreateFromContract;
  window.ncCreateFromContract = function (contract, action) {
    const r = origFrom(contract, action);
    const live = D.contracts.find(c => c.id === contract.id) || contract;
    live.status = 'Archived';
    return r;
  };

  // Everyone in the approver directory is an account, so any workflow step can be approved.
  // Done after the saved data loads, because that replaces the profile list.
  NC_DIRECTORY.forEach(p => {
    const known = Object.values(D.userProfiles).some(x => x.name === p.name);
    if (known) return;
    const key = p.name.toLowerCase().replace(/[^a-z]/g, '');
    D.userProfiles[key] = {
      key, name: p.name, initials: p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      title: `${p.role} · ${p.department}`, email: `${p.name.toLowerCase().replace(/\s+/g, '.')}@innomicktechnologies.com`
    };
  });

  // The signed-in user drives the top icon and the demo-user tick, so all three always agree
  function syncCurrentUser() {
    const profiles = D.userProfiles || {};
    const key = Object.keys(profiles).find(k => profiles[k].name === D.currentUser.name);
    if (key) D.activeProfileKey = key;
    const ini = D.currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    D.currentUser.avatar = ini;
    document.querySelectorAll('#topbarUserAvatar, .wv-avatar').forEach(el => { el.textContent = ini; });
    const btn = document.getElementById('userProfileBtn');
    if (btn) btn.title = `${D.currentUser.name} (Click to switch user)`;
  }
  const origUser = window.switchUserProfile;
  window.switchUserProfile = function (key) {
    origUser(key);
    syncCurrentUser();
  };
  syncCurrentUser();

  // Statistics: Pending Execution = approved contracts without actual dates
  function pendingExecution() {
    const count = document.querySelector('.header-count-large.blue-text');
    if (!count) return;
    const list = D.contracts.filter(c => c.status === 'Approved' && !c.imported);
    count.textContent = list.length;
    const body = count.parentElement.nextElementSibling;
    body.classList.toggle('centered-empty-body', !list.length);
    body.innerHTML = list.length ? list.map(c => `
      <div class="pe-row"><b>${esc(c.name)}</b><small>${esc(c.code)}</small><span>${esc(c.category)} &middot; ${esc(c.department)} &middot; ${esc(c.contractValue)} KWD</span></div>`).join('')
      : '<div class="no-data-found-msg">No Data Found</div>';
  }
  const origSwitch = window.switchRoute;
  window.switchRoute = function (route) {
    const r = origSwitch.apply(this, arguments);
    if (route === 'statistics') pendingExecution();
    return r;
  };
})();
