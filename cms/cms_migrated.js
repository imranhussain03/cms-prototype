/**
 * Innomick Technologies - CMS Prototype
 * Migrated (imported) contracts, mirroring the live flow:
 * - Manual and Excel imports are saved as Draft and listed under Contract Import and Requests,
 *   but reach Contracts only once their approval finishes.
 * - Migrated Contract Details: Start Approval, inline Edit, approval chain, approver comments.
 * - Migrated Contract Approval Review: comments, Reject, Request Change, Approve.
 */

const MG = { draft: null };
const MG_DOC_NAMES = { signedLetter: 'Signed {v}Contract Request Letter', signedContract: 'Legal Signed Contract', letter: '{v}Contract Request Letter', draft: 'Contract Draft' };
// Same idea as the live "Contract Request Letter Template Mapping" list: one chain per department,
// and only these two are mapped. A branch list limits a mapping to those branches.
const MG_MAPPING = [
  { department: 'Information Technology', name: 'Approval', type: 'Sequential', dueDays: 2, steps: [{ title: 'Manager Approval', approver: 'Sara Thomas' }, { title: 'CEO Approval', approver: 'Daniel Mathew' }] },
  { department: 'Medical Insurance', branches: ['Innomick'], name: 'TestCR', type: 'Sequential', dueDays: 2, steps: [{ title: 'Step 1', approver: 'Arjun Mehta' }, { title: 'Step 2', approver: 'Priya Nair', apBranch: 'Innomick', apDept: 'Information Technology', apRole: 'Application Support Specialist' }] }
];
// Renewal, Cancellation, Extension and Completion show boxed read-only fields plus the editable ones
const MG_BOXED = { Renewal: ['effective', 'newEnd'], Extension: [], Cancellation: [], Completion: [] };

const mgEsc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mgLong = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const mgToday = () => new Date().toISOString().slice(0, 10);
const mgAddDays = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const mgFind = id => (InnomickCMSData.migrated || []).concat(InnomickCMSData.contracts).find(c => c.id === id);
const mgRow = c => InnomickCMSData.requests.find(r => r.migratedId === c.id);

const mgDocName = (key, prefix) => MG_DOC_NAMES[key].replace('{v}', prefix);

// Newest version first, the same order as the tabs
function mgInitial(c) { return c.versions[c.versions.length - 1]; }

// A version inherits anything it does not state from the version before it
function mgVal(c, ver, key) {
  for (let i = c.versions.indexOf(ver); i < c.versions.length; i++) {
    const own = c.versions[i].values[key];
    if (own !== undefined && own !== '') return own;
  }
  return undefined;
}

// Keeps the list columns in step with the version values
function mgSummary(c) {
  const latest = c.versions[0];
  const vendors = mgVal(c, latest, 'vendors') || [];
  const vendor = (vendors[mgVal(c, latest, 'selectedVendor') || 0] || {}).name || '';
  const value = Number(mgVal(c, latest, 'value')) || 0;
  c.periods = c.versions.map((v, i) => ({ type: v.type, label: i === c.versions.length - 1 ? 'Initial Contract' : '', start: v.values.actualStart, end: v.values.actualEnd }));
  const cur = c.periods[0];
  Object.assign(c, {
    name: mgVal(c, latest, 'name'), contractName: mgVal(c, latest, 'name'), requestType: latest.type,
    category: mgVal(c, latest, 'type'), type: `${mgVal(c, latest, 'type')} Agreement`,
    vendor, vendorName: vendor, value, contractValue: value.toLocaleString(), currency: 'KWD',
    durationMonths: ncMonthsBetween(cur.start, cur.end), durationDates: `${ncShortDate(cur.start)} - ${ncShortDate(cur.end)}`,
    noticePeriod: mgVal(c, latest, 'notice'), description: mgVal(c, latest, 'description') || '',
    budgetStatus: mgVal(c, latest, 'budget') === 'Budgeted' ? 'Yes' : 'No', budgetCode: mgVal(c, latest, 'budgetCode') || '',
    renewable: mgVal(c, latest, 'renewable'), extendable: mgVal(c, latest, 'extendable'),
    procurementMode: mgVal(c, latest, 'singleSource') ? 'Single Source' : 'Competitive Bidding',
    recJustification: mgVal(c, latest, 'recJustification') || '',
    durationProgress: cur.end && new Date(cur.end) < new Date() ? 100 : 0
  });
  const row = mgRow(c);
  if (row) Object.assign(row, { contractName: c.name, requestType: c.requestType, status: c.status, vendorName: c.vendor, durationMonths: c.durationMonths, durationDates: c.durationDates, durationProgress: c.durationProgress, contractValue: c.contractValue, category: c.category });
}

// Saves a new import as Draft and lists it under Requests
function mgAdd(fields) {
  const c = {
    hasIcon: true, imported: true, status: 'Draft', approval: null, pastCycles: [], comments: [],
    owner: InnomickCMSData.currentUser.name, submittedOn: mgToday(), ...fields
  };
  c.refNo = c.code;
  InnomickCMSData.migrated = InnomickCMSData.migrated || [];
  InnomickCMSData.migrated.unshift(c);
  InnomickCMSData.requests.unshift({ id: `REQ-${c.id}`, migratedId: c.id, refNo: c.code, hasIcon: true, isPendingActivation: false, branch: c.branch, department: c.department, submittedBy: c.owner });
  mgSummary(c);
  return c;
}

function mgSetStatus(c, status) {
  c.status = status;
  const row = mgRow(c);
  if (row) row.status = status;
}

function mgOpen(id, from) {
  CMSState.mgFrom = from || CMSState.mgFrom || 'import';
  CMSState.mgEditing = null;
  CDState.versionIndex = 0;
  switchRoute('mg_detail', id);
}

// ---- Shared page parts ------------------------------------------------------

function mgBadge(status) {
  const cls = { 'In Approval': 'badge-in-approval', Active: 'badge-approved', Approved: 'badge-approved', Rejected: 'badge-rejected', Archived: 'badge-rejected', 'Notice Period': 'badge-rejected', 'Request for Change': 'badge-in-approval' }[status] || 'badge-draft';
  return `<span class="${cls}" style="padding: 6px 18px;">${status}</span>`;
}

function mgChain(c) {
  if (!c.approval) return '';
  const steps = c.approval.steps;
  const note = s => s.state === 'Pending' ? `Due: ${mgLong(s.due)}` : s.state === 'Waiting' || s.state === 'Cancelled' ? 'After prev. approval' : s.state;
  const look = { Approved: ['done', '&#10003;'], Pending: ['now'], Rejected: ['bad', '&#10005;'], 'Change Requested': ['chg'] };
  const cleared = i => i === 0 || steps[i - 1].state === 'Approved';
  return `
    <div class="cd-chain">
      <div class="cd-chain-label">APPROVAL CHAIN</div>
      <div class="cd-chain-track mg-chain">
        <div class="cd-chain-step">
          <span class="mg-dot done">&#10003;</span>
          <div class="cd-chain-title">Submitted by</div>
          <div class="cd-chain-person">${mgEsc(c.owner)}</div>
          <div class="cd-chain-note">${mgLong(c.approval.started)}</div>
        </div>
        ${steps.map((s, i) => {
          const [cls, mark] = look[s.state] || ['wait'];
          return `
            <div class="cd-chain-line ${cleared(i) ? '' : 'off'}"></div>
            <div class="cd-chain-step">
              <span class="mg-dot ${cls}">${mark || i + 1}</span>
              <div class="cd-chain-title">Step ${i + 1}</div>
              <div class="cd-chain-person">${mgEsc(s.approver)}</div>
              <div class="cd-chain-note mg-note-${cls}">${note(s)}</div>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

function mgOverview(c, withValue) {
  const items = [['Reference No.', c.code], ['Contract Name', c.name], ['Contract Type', c.category]];
  if (withValue) items.push(['Contract Value', `${Number(c.value).toLocaleString()} KWD`]);
  items.push(['Vendor Name', c.vendor], ['Branch', c.branch]);
  return `
    <aside class="cd-overview">
      <div class="cd-panel-title">CONTRACT OVERVIEW</div>
      ${items.map(([l, v]) => `<div class="cd-ov-item"><label>${l}</label><div>${mgEsc(v)}</div></div>`).join('')}
      <div class="cd-ov-item"><label>Department</label><div class="cd-ov-pill">${mgEsc(c.department)}</div></div>
    </aside>`;
}

function mgTabs(c, onPick) {
  return `
    <div class="cd-version-tabs">
      ${c.periods.map((p, i) => `
        <button class="cd-version-tab ${i === CDState.versionIndex ? 'active' : ''}" onclick="CDState.versionIndex = ${i}; ${onPick}">
          <span class="nc-period-tag ${p.type.toLowerCase()}" style="margin-left: 0;">${p.type.toUpperCase()}</span>
          ${p.label ? `<span class="cd-version-label">${p.label}</span>` : ''}
          ${i === 0 ? '<span class="nc-ch-current">CURRENT</span>' : ''}
          <div class="cd-version-dates">${mgLong(p.start)} &rarr; ${mgLong(p.end)}</div>
        </button>`).join('')}
    </div>`;
}

const mgRo = (label, val) => `<div class="mg-f"><label>${label}</label><div>${val === undefined || val === null || val === '' ? '&mdash;' : mgEsc(val)}</div></div>`;
const mgDate = v => v ? mgLong(v) : '';
const mgSection = t => `<div class="cd-section-title">${t}</div>`;

const mgBox = (label, val) => `<div class="mg-f mg-box"><label>${label}</label><div>${val === undefined || val === null || val === '' ? '&mdash;' : mgEsc(val)}</div></div>`;

function mgVendorTable(c, ver) {
  const vendors = mgVal(c, ver, 'vendors') || [];
  const picked = mgVal(c, ver, 'selectedVendor') || 0;
  return `
    <table class="cms-table cd-vendor-table">
      <thead><tr><th>No.</th><th>Vendor Name</th><th>Price (KWD)</th><th>Selected</th></tr></thead>
      <tbody>${vendors.map((d, i) => `<tr><td>${i + 1}</td><td><b>${mgEsc(d.name)}</b></td><td>${mgEsc(d.price)}</td><td><span class="mg-radio ${i === picked ? 'on' : ''}"></span></td></tr>`).join('')}</tbody>
    </table>`;
}

function mgRecommended(c, ver) {
  const vendors = mgVal(c, ver, 'vendors') || [];
  return (vendors[mgVal(c, ver, 'selectedVendor') || 0] || {}).name;
}

// Renewal, Extension, Cancellation, Completion
function mgBoxedDetails(c, vi, review, editing) {
  const ver = c.versions[vi];
  const v = key => mgVal(c, ver, key);
  const init = mgInitial(c).values;
  const edit = (label, key, type) => editing ? mgInput(label, key, type, ['actualStart', 'actualEnd', 'notice', 'value'].includes(key)) : mgRo(label.toUpperCase(), type === 'date' ? mgDate(ver.values[key]) : v(key));
  const own = {
    Renewal: [['New Effective Date', 'effective', 'date'], ['New End Date', 'newEnd', 'date']],
    Cancellation: [['New End Date', 'newEnd', 'date']],
    Completion: [['Completion Date', 'actualEnd', 'date']],
    Extension: []
  }[ver.type];
  return `
    ${mgSection(review ? 'CONTRACT INFORMATION' : 'CONTRACT INFORMATION &mdash; READ ONLY')}
    <div class="mg-grid">
      ${mgBox('CONTRACT NAME', v('name'))}
      ${mgBox('CONTRACT TYPE', v('type'))}
      ${editing ? mgInput('Contract Value (KWD)', 'value', 'number', true) : mgBox('CONTRACT VALUE', `${Number(v('value') || 0).toLocaleString()} KWD`)}
      ${review ? mgBox('NOTICE PERIOD (MONTHS)', v('notice')) : '<div></div>'}
      ${mgBox('START DATE', mgDate(init.start))}
      ${mgBox('END DATE', mgDate(init.end))}
      ${mgBox('BUDGET STATUS', v('budget') === 'Budgeted' ? 'Yes' : 'No')}
      ${mgBox('BUDGET CODE', v('budget') === 'Budgeted' ? v('budgetCode') : '')}
      ${mgBox('RENEWABLE', v('renewable'))}
      ${mgBox('EXTENDABLE', v('extendable'))}
      ${mgBox('AUTO RENEWAL', 'Off')}
      ${mgBox('PROCUREMENT MODE', v('singleSource') ? 'Single Source' : 'Competitive Bidding')}
      ${mgBox('RECOMMENDED VENDOR', mgRecommended(c, ver))}
    </div>
    ${v('description') ? mgBox('DESCRIPTION', v('description')) : ''}
    ${mgSection(review ? 'VENDOR DETAILS' : 'VENDOR DETAILS &mdash; READ ONLY')}
    ${mgVendorTable(c, ver)}
    ${mgRo('RECOMMENDATION JUSTIFICATION', v('recJustification'))}
    ${mgSection('EDITABLE FIELDS')}
    <div class="${editing ? 'imp-grid' : 'mg-grid'}">
      ${own.map(([l, k, t]) => edit(l, k, t)).join('')}
      ${edit('Actual Start Date', 'actualStart', 'date')}
      ${ver.type === 'Completion' ? '' : edit('Actual End Date', 'actualEnd', 'date')}
      ${edit('Notice Period (Months)', 'notice', 'number')}
      ${ver.type === 'Cancellation' && !editing ? mgRo('CANCELLATION JUSTIFICATION', v('recJustification')) : ''}
    </div>`;
}

// Read-only body of one version
function mgDetails(c, vi, review) {
  const ver = c.versions[vi];
  if (ver.type in MG_BOXED) return mgBoxedDetails(c, vi, review, false);
  const v = key => mgVal(c, ver, key);
  const init = mgInitial(c).values;
  const amend = ver.type === 'Amendment';
  return `
    ${amend ? `<div class="mg-grid">
      ${mgRo('ADDENDUM NUMBER', `${c.code}/${ver.values.addendum}`)}
      ${mgRo('NEW EFFECTIVE DATE', mgDate(ver.values.effective))}
      ${mgRo('NEW END DATE', mgDate(ver.values.newEnd))}
    </div>` : ''}
    ${mgSection('CONTRACT INFORMATION')}
    <div class="mg-grid">
      ${mgRo('CONTRACT NAME', v('name'))}
      ${mgRo('CONTRACT TYPE', v('type'))}
      ${mgRo(review ? 'CONTRACT VALUE (KWD)' : 'CONTRACT VALUE', review ? Number(v('value') || 0).toLocaleString() : `${Number(v('value') || 0).toLocaleString()} KWD`)}
      ${review ? '<div></div>' : mgRo('NOTICE PERIOD (MONTHS)', v('notice'))}
      ${mgRo('START DATE', mgDate(init.start))}
      ${mgRo('END DATE', mgDate(init.end))}
      ${review ? '' : mgRo('ACTUAL START DATE', mgDate(c.periods[vi].start))}
      ${review ? '' : mgRo('ACTUAL END DATE', mgDate(c.periods[vi].end))}
    </div>
    ${v('description') ? mgRo('DESCRIPTION', v('description')) : ''}
    ${mgSection('CONTRACT OPTIONS')}
    <div class="mg-grid">
      ${mgRo('BUDGET STATUS', v('budget'))}
      ${mgRo('BUDGET CODE', v('budget') === 'Budgeted' ? v('budgetCode') : '')}
      ${mgRo('RENEWABLE', v('renewable'))}
      ${v('renewable') === 'Yes' ? mgRo('AUTO RENEWAL', 'Off') : ''}
      ${mgRo('EXTENDABLE', v('extendable'))}
      ${review ? mgRo('NOTICE PERIOD (MONTHS)', v('notice')) : ''}
    </div>
    ${mgSection('COMPETITIVE BIDDING')}
    ${mgRo('PROCUREMENT MODE', v('singleSource') ? 'Single Source' : 'Competitive Bidding')}
    ${mgVendorTable(c, ver)}
    ${mgRo('FINAL RECOMMENDED VENDOR', mgRecommended(c, ver))}
    ${mgRo('RECOMMENDATION JUSTIFICATION', v('recJustification'))}`;
}

function mgManager(c) {
  return `
    <div class="nc-manager-card" style="margin-top: 14px;">
      <div class="nc-manager-head">MANAGER DETAILS</div>
      <div class="nc-manager-body">
        <p class="nc-manager-hint">Added manager will be notified when this contract becomes Active, enters its Notice Period, or Expires. Leave it empty to skip these notifications.</p>
        <div class="nc-manager-grid">
          <div><label class="detail-field-label">Branch</label><select class="cms-select" id="cdMgrBranch" onchange="cdManagerCascade()"><option value="">Select Branch</option>${InnomickCMSData.branches.map(b => `<option>${b}</option>`).join('')}</select></div>
          <div><label class="detail-field-label">Department</label><select class="cms-select" id="cdMgrDept" onchange="cdManagerCascade()" disabled><option value="">Select Department</option></select></div>
          <div><label class="detail-field-label">Role</label><select class="cms-select" id="cdMgrRole" onchange="cdManagerCascade()" disabled><option value="">Select Role</option></select></div>
          <div><label class="detail-field-label">Manager</label><select class="cms-select" id="cdMgrUser" disabled><option value="">Select Manager</option></select></div>
        </div>
        <button class="btn-teal-primary" style="margin-top: 12px; padding: 6px 18px;" onclick="cdSaveManager()">Save</button>
        <div class="nc-manager-saved" id="cdMgrSaved">${c.manager ? `Notifications will be sent to <strong>${mgEsc(c.manager)}</strong>` : ''}</div>
      </div>
    </div>`;
}

function mgDocuments(c, vi, editing) {
  const ver = c.versions[vi];
  const prefix = ver.type === 'New' ? '' : `${ver.type} `;
  const docs = ver.docs || {};
  const keys = (IMP_VERSION_TYPES[ver.type] || IMP_VERSION_TYPES.New).docs;
  return `
    ${mgSection('PRIMARY DOCUMENTS')}
    ${keys.map(key => `
      <div class="cd-doc-row">
        <span class="cd-doc-icon">&#128196;</span>
        <div><div class="cd-doc-name">${mgDocName(key, prefix)} <span>(Optional)</span></div><div class="cd-doc-sub">${docs[key] ? mgEsc(docs[key]) : 'Not uploaded'}</div></div>
        ${editing ? `<label class="btn-outline-teal nc-doc-btn mg-upload">Upload<input type="file" accept=".doc,.docx,.pdf" style="display: none;" onchange="mgDocPick('${c.id}', ${vi}, '${key}', this.files[0])"></label>` : ''}
        ${docs[key] && !editing ? `<button class="btn-outline-teal nc-doc-btn" style="margin-left: auto;" onclick="showToast('Opening ${mgEsc(docs[key]).replace(/'/g, '')}', 'info')">View</button>` : ''}
      </div>`).join('')}
    ${mgSection('SUPPORTING DOCUMENTS')}
    ${docs.supporting ? `<div class="cd-doc-row"><span class="cd-doc-icon">&#128206;</span><div class="cd-doc-name">${mgEsc(docs.supporting)}</div><button class="btn-outline-teal nc-doc-btn" style="margin-left: auto;" onclick="showToast('Opening ${mgEsc(docs.supporting).replace(/'/g, '')}', 'info')">View</button></div>` : '<div class="mg-empty">No supporting documents uploaded.</div>'}`;
}

function mgDocPick(id, vi, key, file) {
  if (!file) return;
  const c = mgFind(id);
  c.versions[vi].docs = c.versions[vi].docs || {};
  c.versions[vi].docs[key] = file.name;
  mgRenderDetail(id);
}

function mgVersionName(ver) { return ver.type === 'New' ? 'Initial Contract' : ver.type; }

function mgComments(c, vi) {
  const list = (c.comments || []).filter(m => m.version === vi);
  return list.length ? list.map(m => `<div class="mg-comment"><b>${mgEsc(m.by)}</b><div>${mgEsc(m.text)}</div><small>${mgEsc(m.on)}</small></div>`).join('')
    : '<p class="cd-comments-empty">No approver comments yet for this version.</p>';
}

// ---- Migrated Contract Details ----------------------------------------------

function mgRenderDetail(id) {
  const c = mgFind(id);
  const root = document.getElementById('cdRoot');
  if (!c) { switchRoute('import'); return; }
  if (!c.versions) mgUpgrade(c);
  CDState.contract = c;
  const vi = c.versions[CDState.versionIndex] ? CDState.versionIndex : 0;
  CDState.versionIndex = vi;
  const ver = c.versions[vi];
  const editing = CMSState.mgEditing === c.id;
  const canStart = ['Draft', 'Request for Change'].includes(c.status);
  const canEdit = ['Draft', 'In Approval', 'Request for Change'].includes(c.status);
  const title = ver.type === 'New' ? 'INITIAL CONTRACT DETAILS' : `${ver.type.toUpperCase()} DETAILS`;

  root.innerHTML = `
    <div class="cd-header">
      <div class="cd-header-left">
        <button class="btn-back-nav" onclick="switchRoute(CMSState.mgFrom || 'import')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Back
        </button>
        <div>
          <div class="cd-title">Migrated Contract Details</div>
          <div class="cd-subtitle">${mgEsc(c.code)} &middot; ${mgEsc(c.name)} &middot; ${mgEsc(c.category)}</div>
        </div>
      </div>
      <div class="cd-header-actions">
        ${mgBadge(c.status)}
        ${canStart ? `<button class="btn-teal-primary nc-doc-btn" onclick="mgStartApproval('${c.id}')">Start Approval</button>` : ''}
        <button class="btn-outline-teal nc-doc-btn" onclick="mgHistory('${c.id}')">Approval History</button>
        ${c.approval ? `<button class="btn-outline-teal nc-doc-btn" onclick="mgCertificate('${c.id}')">View Certificate</button>` : ''}
        <button class="btn-outline-teal nc-doc-btn" ${editing ? 'disabled' : ''} onclick="mgRenderDetail('${c.id}'); showToast('Contract refreshed', 'info')">Refresh</button>
      </div>
    </div>
    ${mgChain(c)}
    <div class="cd-body">
      ${mgOverview(c)}
      <main class="cd-main">
        ${mgTabs(c, `mgRenderDetail('${c.id}')`)}
        <div class="cd-scroll">
          <div class="mg-title-row">
            <div class="cd-section-title cd-section-main">${title}</div>
            ${editing ? `<div class="mg-edit-actions"><button class="btn-outline-teal nc-doc-btn" onclick="mgEditCancel('${c.id}')">Cancel</button><button class="btn-teal-primary nc-doc-btn" onclick="mgEditSave('${c.id}')">Save</button></div>`
              : canEdit ? `<button class="btn-outline-teal nc-doc-btn" onclick="mgEdit('${c.id}')">&#9998; Edit</button>` : ''}
          </div>
          ${editing ? (ver.type in MG_BOXED ? mgBoxedDetails(c, vi, false, true) : mgEditForm(c, ver)) : mgDetails(c, vi)}
          ${mgManager(c)}
          ${mgDocuments(c, vi, editing)}
        </div>
      </main>
      <aside class="cd-comments">
        <div class="cd-panel-title">APPROVER COMMENTS</div>
        <p class="cd-comments-sub">Comments left by approvers on the ${mgVersionName(ver)} version during review.</p>
        ${mgComments(c, vi)}
      </aside>
    </div>`;
}

// ---- Inline edit: name, type and recommended vendor stay locked ----------------

function mgEdit(id) {
  const c = mgFind(id);
  const ver = c.versions[CDState.versionIndex];
  const merged = {};
  ['name', 'type', 'value', 'notice', 'start', 'end', 'actualStart', 'actualEnd', 'description', 'budget', 'budgetCode', 'renewable', 'extendable', 'singleSource', 'recJustification', 'effective', 'newEnd', 'addendum', 'selectedVendor', 'vendors']
    .forEach(k => { merged[k] = mgVal(c, ver, k); });
  merged.actualStart = ver.values.actualStart;
  merged.actualEnd = ver.values.actualEnd;
  MG.draft = JSON.parse(JSON.stringify({ ...merged, vendors: merged.vendors || [], selectedVendor: merged.selectedVendor || 0 }));
  CMSState.mgEditing = id;
  mgRenderDetail(id);
}

function mgEditCancel(id) {
  CMSState.mgEditing = null;
  MG.draft = null;
  mgRenderDetail(id);
}

function mgInput(label, key, type, required, locked) {
  return `<div class="imp-field"><label>${label.toUpperCase()}${required ? ' <span class="imp-req">*</span>' : ''}</label>
    <input class="cms-input" id="mg_${key}" type="${type}" value="${mgEsc(MG.draft[key] === undefined ? '' : MG.draft[key])}" ${locked ? 'disabled' : ''} oninput="MG.draft.${key} = this.value"></div>`;
}

function mgRadios(label, key, options, redraw) {
  return `<div class="imp-field"><label>${label.toUpperCase()}</label><div class="nc-radio-group">
    ${options.map(o => `<label><input type="radio" name="mg_${key}" ${MG.draft[key] === o ? 'checked' : ''} onchange="MG.draft.${key} = '${o}'${redraw ? `; mgRenderDetail('${CMSState.mgEditing}')` : ''}"> ${o}</label>`).join('')}
  </div></div>`;
}

function mgEditForm(c, ver) {
  const d = MG.draft;
  const rows = d.singleSource ? d.vendors.slice(0, 1) : d.vendors;
  return `
    ${mgSection('CONTRACT INFORMATION')}
    <div class="imp-grid">
      ${mgInput('Contract Name', 'name', 'text', true, true)}
      ${mgInput('Contract Type', 'type', 'text', true, true)}
      ${mgInput('Contract Value (KWD)', 'value', 'number', true)}
      ${mgInput('Notice Period (Months)', 'notice', 'number', true)}
      ${mgInput('Start Date', 'start', 'date')}
      ${mgInput('End Date', 'end', 'date')}
      ${mgInput('Actual Start Date', 'actualStart', 'date', true)}
      ${mgInput('Actual End Date', 'actualEnd', 'date', true)}
      ${ver.type === 'Amendment' ? mgInput('Addendum Number', 'addendum', 'text', true) + mgInput('New Effective Date', 'effective', 'date') + mgInput('New End Date', 'newEnd', 'date') : ''}
    </div>
    <div class="imp-field"><label>DESCRIPTION</label><textarea class="cms-input" rows="3" placeholder="Type here..." oninput="MG.draft.description = this.value">${mgEsc(d.description)}</textarea></div>
    ${mgSection('CONTRACT OPTIONS')}
    <div class="imp-grid">
      ${mgRadios('Budget Status', 'budget', ['Budgeted', 'Non-Budgeted'], true)}
      ${d.budget === 'Budgeted' ? mgInput('Budget Code', 'budgetCode', 'text', true) : '<div></div>'}
      ${mgRadios('Renewable', 'renewable', ['Yes', 'No'])}
      ${mgRadios('Extendable', 'extendable', ['Yes', 'No'])}
    </div>
    ${mgSection('COMPETITIVE BIDDING')}
    <div class="nc-radio-group"><label><input type="checkbox" ${d.singleSource ? 'checked' : ''} onchange="MG.draft.singleSource = this.checked; mgRenderDetail('${c.id}')"> Single Source</label></div>
    <table class="cms-table cd-vendor-table">
      <thead><tr><th>No.</th><th>Vendor Name</th><th>Price (KWD)</th><th>Selected</th></tr></thead>
      <tbody>${rows.map((v, i) => `<tr>
        <td>${i + 1}</td>
        <td><input class="nc-inline-input" value="${mgEsc(v.name)}" oninput="MG.draft.vendors[${i}].name = this.value; document.getElementById('mgFinalVendor').value = MG.draft.vendors[MG.draft.selectedVendor].name"></td>
        <td><input class="nc-inline-input" type="number" value="${mgEsc(v.price)}" oninput="MG.draft.vendors[${i}].price = this.value"></td>
        <td><input type="radio" name="mgVendor" ${d.selectedVendor === i ? 'checked' : ''} onchange="MG.draft.selectedVendor = ${i}; mgRenderDetail('${c.id}')"></td>
      </tr>`).join('')}</tbody>
    </table>
    <div class="imp-field"><label>FINAL RECOMMENDED VENDOR <span class="imp-req">*</span></label><input class="cms-input" id="mgFinalVendor" value="${mgEsc((d.vendors[d.selectedVendor] || {}).name)}" disabled></div>
    <div class="imp-field"><label>RECOMMENDATION JUSTIFICATION</label><textarea class="cms-input" rows="3" oninput="MG.draft.recJustification = this.value">${mgEsc(d.recJustification)}</textarea></div>`;
}

function mgEditSave(id) {
  const c = mgFind(id);
  const ver = c.versions[CDState.versionIndex];
  const d = MG.draft;
  const boxed = ver.type in MG_BOXED;
  const needed = ['value', 'notice', 'actualStart', 'actualEnd'].concat(!boxed && d.budget === 'Budgeted' ? ['budgetCode'] : []);
  const missing = needed.filter(k => !String(d[k] || '').trim());
  document.querySelectorAll('#cdRoot .nc-invalid').forEach(el => el.classList.remove('nc-invalid'));
  missing.forEach(k => { const el = document.getElementById(`mg_${k}`); if (el) el.classList.add('nc-invalid'); });
  if (missing.length) { showToast('Please fill all mandatory fields', 'info'); return; }
  const keys = boxed ? ['value', 'notice', 'actualStart', 'actualEnd', ...MG_BOXED[ver.type]] : Object.keys(d);
  keys.forEach(k => { ver.values[k] = d[k]; });
  CMSState.mgEditing = null;
  MG.draft = null;
  mgSummary(c);
  mgRenderDetail(id);
  showToast('Contract details updated', 'success');
  cmsSaveState();
}

// ---- Approval history -------------------------------------------------------

function mgHistory(id) {
  const c = mgFind(id);
  const cycles = (c.pastCycles || []).concat(c.approval ? [c.approval] : []);
  const acted = cycles.flatMap(cy => cy.steps).filter(s => !['Pending', 'Waiting'].includes(s.state)).reverse();
  const tone = { Approved: 'badge-approved', Rejected: 'badge-rejected', 'Change Requested': 'badge-in-approval' };
  const body = document.querySelector('#approvalHistoryModal .modal-box > div:nth-child(2)');
  body.innerHTML = acted.length ? `
    <div style="font-size: 11px; font-weight: 700; color: #008272; letter-spacing: 0.5px; margin-bottom: 12px;">APPROVAL HISTORY</div>
    ${acted.map(s => `
      <div class="cd-ah-card ${s.state === 'Cancelled' ? 'mg-cancelled' : ''}">
        <div class="cd-ah-head">
          <span class="mg-avatar">${{ Approved: '&#10003;', Rejected: '&#10005;', 'Change Requested': '!' }[s.state] || ''}</span>
          <div>
            <div style="font-weight: 700;">${mgEsc(s.approver)}</div>
            <div class="cd-ah-meta">Assigned on ${mgEsc(s.assignedOn || '')}<br>${s.state === 'Cancelled' ? 'Cancelled on' : 'Action taken on'} ${mgEsc(s.actedOn)}</div>
          </div>
          <span class="${tone[s.state] || 'badge-draft'}" style="margin-left: auto;">${s.state}</span>
        </div>
        <div class="cd-ah-comments"><div>COMMENTS</div>${s.remarks ? mgEsc(s.remarks) : '<em>No comments</em>'}</div>
      </div>`).join('')}` : '<div class="mg-no-history">No history found</div>';
  openModal('approvalHistoryModal');
}

// ---- Start Contract Approval ------------------------------------------------

// The chain comes from the mapping; there is no template choice for a migrated contract
function mgTemplate(c) {
  return MG_MAPPING.find(m => m.department === c.department && (!m.branches || m.branches.includes(c.branch)));
}

function mgStartApproval(id) {
  const c = mgFind(id);
  const t = mgTemplate(c);
  const par = t && t.type === 'Parallel';
  const due = mgAddDays(t ? t.dueDays : 2).split('-').reverse().join('-');
  const row = (l, v) => `<div class="mg-start-row"><label>${l}</label><div>${mgEsc(v)}</div></div>`;
  let m = document.getElementById('mgStartModal');
  if (!m) {
    m = document.createElement('div');
    m.className = 'modal-overlay';
    m.id = 'mgStartModal';
    document.body.appendChild(m);
  }
  m.innerHTML = `
    <div class="modal-box mg-start-box">
      <div class="mg-start-head"><b>Start Contract Approval</b><button class="btn-close-modal" onclick="closeModal('mgStartModal')">&times;</button></div>
      <div class="mg-start-body">
        ${!t ? '<div class="mg-no-template">No mapped template found. Please contact your IT administrator.</div>' : t.steps.map((s, i) => `
          <div class="mg-start-band">${mgEsc(s.title)}</div>
          ${row('Approver', s.approver)}
          ${s.apRole ? row('Approver Branch', s.apBranch) + row('Approver Department', s.apDept) + row('Role / Designation', s.apRole) : ''}
          ${row('Action', 'Review & Approve')}
          ${row('Due Date', i === 0 || par ? due : 'Will be set after previous approval')}
          ${i < t.steps.length - 1 ? '<div class="mg-start-next">&#8964;</div>' : ''}`).join('')}
      </div>
      <div class="mg-start-foot"><button class="btn-outline-teal" onclick="closeModal('mgStartModal')">Cancel</button><button class="btn-teal-primary" ${t ? '' : 'disabled'} onclick="mgConfirmStart('${c.id}')">Start Now</button></div>
    </div>`;
  openModal('mgStartModal');
}

function mgConfirmStart(id) {
  const c = mgFind(id);
  const t = mgTemplate(c);
  const par = t.type === 'Parallel';
  const now = ncFormatDateTime(new Date());
  if (c.approval) c.pastCycles.push(c.approval);
  c.approval = {
    name: t.name, type: t.type, dueDays: t.dueDays || 2, started: mgToday(),
    steps: t.steps.map((s, i) => {
      const open = i === 0 || par;
      return { title: s.title, approver: s.approver, state: open ? 'Pending' : 'Waiting', assignedOn: open ? now : '', due: open ? mgAddDays(t.dueDays || 2) : '' };
    })
  };
  mgSetStatus(c, 'In Approval');
  const ap = InnomickCMSData.approvals;
  const status = par ? `${t.steps.length} Approvals Pending` : t.steps[0].title;
  ap.inbox = ap.inbox.filter(i => i.id !== `MGAPP-${c.id}`);
  ap.inbox.unshift({ id: `MGAPP-${c.id}`, mgId: c.id, name: c.code, approvalType: t.type, status, approvedCount: 0, totalCount: t.steps.length, requestedBy: InnomickCMSData.currentUser.name, requestedOn: mgToday() });
  ap.outbox = ap.outbox.filter(o => o.mgId !== c.id);
  ap.outbox.unshift({ id: `OUT-${c.id}`, mgId: c.id, ncRequestId: c.id, contractCode: c.code, title: c.code, approvalType: t.type, status, totalSteps: t.steps.length, approvedCount: 0, requestedOn: mgToday() });
  closeModal('mgStartModal');
  CMSState.mgEditing = null;
  mgRenderDetail(id);
  ncShowInfo('Approval started successfully', true);
  cmsSaveState();
}

// ---- Migrated Contract Approval Review ---------------------------------------

function mgRenderReview(inboxId) {
  const item = InnomickCMSData.approvals.inbox.find(i => i.id === inboxId);
  const c = item && mgFind(item.mgId);
  if (!c) { switchRoute('approvals'); return; }
  CDState.contract = c;
  CDState.versionIndex = c.versions[CDState.versionIndex] ? CDState.versionIndex : 0;
  const vi = CDState.versionIndex;
  const ver = c.versions[vi];
  const tag = `<span class="nc-period-tag ${ver.type.toLowerCase()}" style="margin-left: 0;">${ver.type.toUpperCase()}</span>${vi === 0 ? '<span class="nc-ch-current">CURRENT</span>' : ''}`;

  document.getElementById('cdRoot').innerHTML = `
    <div class="cd-header">
      <div class="cd-header-left">
        <button class="btn-back-nav" onclick="switchRoute('approvals')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Back
        </button>
        <div>
          <div class="cd-title">Migrated Contract &mdash; Approval Review</div>
          <div class="cd-subtitle">${mgEsc(c.code)} &middot; ${mgEsc(c.name)} &middot; ${mgEsc(c.category)}</div>
        </div>
      </div>
      <div class="cd-header-actions">
        <button class="btn-outline-teal nc-doc-btn" onclick="mgHistory('${c.id}')">Approval History</button>
        <button class="btn-outline-teal nc-doc-btn" onclick="mgCertificate('${c.id}')">View Certificate</button>
        <button class="mg-btn-reject" onclick="mgAsk('${inboxId}', 'Reject')">&#10005; Reject</button>
        <button class="mg-btn-change" onclick="mgAsk('${inboxId}', 'Change')">Request Change</button>
        <button class="btn-teal-primary nc-doc-btn" onclick="mgAsk('${inboxId}', 'Approve')">&#10003; Approve</button>
      </div>
    </div>
    ${mgChain(c)}
    <div class="cd-body">
      ${mgOverview(c, true)}
      <main class="cd-main">
        ${mgTabs(c, `mgRenderReview('${inboxId}')`)}
        <div class="cd-scroll">
          <div class="cd-section-title cd-section-main">${ver.type === 'New' ? 'INITIAL CONTRACT' : ver.type.toUpperCase()} DETAILS</div>
          ${mgDetails(c, vi, true)}
          ${mgDocuments(c, vi, false)}
        </div>
      </main>
      <aside class="cd-comments">
        <div class="cd-panel-title">COMMENTING ON</div>
        <div class="mg-commenting">${tag}</div>
        <textarea class="cms-input" id="mgCommentBox" rows="3" placeholder="Add your comment here..."></textarea>
        <button class="btn-teal-primary mg-add-comment" onclick="mgAddComment('${inboxId}')">Add Comment</button>
        <div class="cd-panel-title" style="margin-top: 18px;">COMMENTS</div>
        ${mgComments(c, vi).replace('No approver comments yet', 'No comments yet')}
      </aside>
    </div>`;
}

function mgAddComment(inboxId) {
  const box = document.getElementById('mgCommentBox');
  const text = box.value.trim();
  if (!text) { showToast('Please enter a comment', 'info'); return; }
  const c = mgFind(InnomickCMSData.approvals.inbox.find(i => i.id === inboxId).mgId);
  c.comments.push({ by: InnomickCMSData.currentUser.name, text, on: ncFormatDateTime(new Date()), version: CDState.versionIndex });
  mgRenderReview(inboxId);
  cmsSaveState();
}

function mgAsk(inboxId, action) {
  const cfg = {
    Reject: ['Confirm Reject', 'reject this contract', 'REJECTION REMARKS', 'Yes, Reject', 'Type your remarks here...', 'mg-btn-reject', true],
    Change: ['Confirm Request Change', 'request change for this contract', 'CHANGE REQUEST REMARKS', 'Yes, Request Change', 'Type your remarks here...', 'mg-btn-change', true],
    Approve: ['Confirm Approve', 'approve this contract', 'APPROVAL REMARKS', 'Yes, Approve', 'Type your remarks here...', 'btn-teal-primary', false]
  }[action];
  let m = document.getElementById('mgConfirmModal');
  if (!m) {
    m = document.createElement('div');
    m.className = 'modal-overlay';
    m.id = 'mgConfirmModal';
    document.body.appendChild(m);
  }
  m.innerHTML = `
    <div class="modal-box mg-confirm-box">
      <b>${cfg[0]}</b>
      <p>Are you sure you want to ${cfg[1]}?</p>
      <label>${cfg[2]} ${cfg[6] ? '<span class="imp-req">*</span>' : '<span class="mg-optional">(Optional)</span>'}</label>
      <textarea class="cms-input" id="mgConfirmRemarks" rows="3" placeholder="${cfg[4]}"></textarea>
      <div class="mg-confirm-foot"><button class="btn-outline-teal" onclick="closeModal('mgConfirmModal')">Cancel</button><button class="${cfg[5]}" onclick="mgConfirmDecision('${inboxId}', '${action}', ${cfg[6]})">${cfg[3]}</button></div>
    </div>`;
  openModal('mgConfirmModal');
}

function mgConfirmDecision(inboxId, action, required) {
  const box = document.getElementById('mgConfirmRemarks');
  const remarks = box.value.trim();
  if (required && !remarks) { box.classList.add('nc-invalid'); showToast('Please enter your remarks', 'info'); return; }
  closeModal('mgConfirmModal');
  mgDecide(inboxId, action, remarks);
  CMSState.approvalTab = 'inbox';
  switchRoute('approvals');
}

function mgDecide(inboxId, action, remarks) {
  const ap = InnomickCMSData.approvals;
  const item = ap.inbox.find(i => i.id === inboxId);
  const c = mgFind(item.mgId);
  const cy = c.approval;
  const now = ncFormatDateTime(new Date());
  const step = cy.steps.find(s => s.state === 'Pending');
  const ended = action !== 'Approve';
  step.actedOn = now;
  step.remarks = remarks;
  step.state = action === 'Approve' ? 'Approved' : action === 'Reject' ? 'Rejected' : 'Change Requested';
  if (ended) {
    cy.steps.filter(s => ['Pending', 'Waiting'].includes(s.state)).forEach(s => { s.state = 'Cancelled'; s.actedOn = now; });
    mgSetStatus(c, action === 'Reject' ? 'Rejected' : 'Request for Change');
  } else if (cy.type !== 'Parallel') {
    const next = cy.steps.find(s => s.state === 'Waiting');
    if (next) Object.assign(next, { state: 'Pending', assignedOn: now, due: mgAddDays(cy.dueDays) });
  }
  const done = cy.steps.filter(s => s.state === 'Approved').length;
  const pending = cy.steps.filter(s => s.state === 'Pending');
  const finished = ended || !pending.length;
  if (!ended && finished) mgFinish(c);

  const status = finished ? c.status : cy.type === 'Parallel' ? `${pending.length} Approvals Pending` : pending[0].title;
  Object.assign(item, { status, approvedCount: done });
  (ap.inboxHistory = ap.inboxHistory || []).unshift({
    id: item.id, mgId: c.id, name: item.name, approvalType: cy.type, status: finished ? c.status : 'Pending', step: step.title, approver: step.approver,
    progress: `Step ${cy.steps.indexOf(step) + 1} of ${cy.steps.length}`, progressPct: Math.round((done / cy.steps.length) * 100),
    requestedBy: item.requestedBy, requestedOn: item.requestedOn, actedOn: now
  });
  const out = ap.outbox.find(o => o.mgId === c.id);
  if (out) Object.assign(out, { status, approvedCount: done });
  if (finished) {
    ap.inbox = ap.inbox.filter(i => i !== item);
    if (out) {
      ap.outbox = ap.outbox.filter(o => o !== out);
      (ap.outboxHistory = ap.outboxHistory || []).unshift({ ...out, completedOn: now });
    }
  }
  cmsSaveState();
}

// The dates alone decide the status; a Cancellation or Completion is treated the same way
function mgFinalStatus(c) {
  const { start, end } = c.periods[0];
  const today = mgToday();
  if (end < today) return 'Expired';
  if (start > today) return 'Approved';
  const notice = new Date(end);
  notice.setMonth(notice.getMonth() - Number(c.noticePeriod || 0));
  return notice.toISOString().slice(0, 10) <= today ? 'Notice Period' : 'Active';
}

// Fully approved: the contract leaves Requests and joins Contracts
function mgFinish(c) {
  const D = InnomickCMSData;
  mgSetStatus(c, mgFinalStatus(c));
  D.requests = D.requests.filter(r => r.migratedId !== c.id);
  D.migrated = D.migrated.filter(x => x !== c);
  D.contracts.unshift(c);
}

function mgCertificate(id) {
  const c = mgFind(id);
  const ver = c.versions[0];
  const cell = (l, v) => `<div class="ucert-cell"><span>${l}</span><b>${mgEsc(v)}</b></div>`;
  const newDates = ver.type !== 'New';
  const steps = c.approval ? c.approval.steps.filter(s => s.state === 'Approved') : [];
  const logo = document.querySelector('.innomick-cms-logo');
  let m = document.getElementById('ucertModal');
  if (!m) {
    m = document.createElement('div');
    m.className = 'modal-overlay';
    m.id = 'ucertModal';
    document.body.appendChild(m);
  }
  m.innerHTML = `
    <div class="modal-box ucert-modal">
      <div class="ucert-head"><b>Approval Certificate &middot; ${mgEsc(c.code)}</b>
        <span><button class="btn-outline-teal" onclick="window.print()">&#8615; Download PDF</button>
        <button class="btn-teal-primary" onclick="closeModal('ucertModal')">&times; Close</button></span></div>
      <div class="ucert-scroll"><div class="ucert-page">
        <div class="ucert-brand">${logo ? `<img src="${logo.src}" alt="">` : ''}<div>INNOMICK GROUP</div></div>
        <h3>Contract Draft Document Approval Certificate</h3>
        <div class="ucert-ref">Certificate Ref: ${mgEsc(c.code)}-${ver.type.slice(0, 3).toUpperCase()}</div>
        <div class="ucert-sec">DOCUMENT OVERVIEW</div>
        <div class="ucert-grid">
          ${cell('CONTRACT REFERENCE NUMBER', c.code)}${cell('CONTRACT NAME', c.name)}
          ${cell('CONTRACT TYPE', c.category)}${cell('REQUEST TYPE', ver.type)}
          ${cell('VENDOR NAME', c.vendor)}${cell('CONTRACT VALUE', `${Number(c.value).toLocaleString()} KWD`)}
          ${cell('DEPARTMENT', c.department)}${cell('BRANCH', c.branch)}
          ${cell(newDates ? 'NEW START DATE' : 'START DATE', mgLong(c.periods[0].start))}${cell(newDates ? 'NEW END DATE' : 'END DATE', mgLong(c.periods[0].end))}
        </div>
        <div class="ucert-sec">DIGITAL APPROVAL CHAIN</div>
        ${steps.length ? steps.map((s, i) => `
          <div class="ucert-step">
            <div class="ucert-step-top"><span class="uah-icon ok">&#10003;</span><div class="uah-who"><b>Step ${i + 1}</b><small>${mgEsc(s.approver)}</small></div>
              <div class="ucert-when"><span class="uah-badge ok">Approved</span><small>Approved on ${mgEsc(s.actedOn)}</small></div></div>
            <div class="uah-comments"><span>COMMENTS</span><div>${mgEsc(s.remarks || 'No comments provided.')}</div></div>
          </div>`).join('') : '<div class="ucert-empty">No approval actions recorded.</div>'}
        <div class="ucert-gen">Generated: ${mgLong(new Date())}</div>
      </div></div>
    </div>`;
  openModal('ucertModal');
}

// Contracts imported before this flow existed, from an earlier saved session
function mgUpgrade(c) {
  const values = { name: c.name, type: c.category, value: c.value, notice: c.noticePeriod || '1', actualStart: (c.periods || [{}])[0].start, actualEnd: (c.periods || [{}])[0].end,
    budget: c.budgetStatus === 'No' ? 'Non-Budgeted' : 'Budgeted', budgetCode: c.budgetCode, renewable: c.renewable, extendable: c.extendable, description: c.description,
    recJustification: c.recJustification, vendors: [{ name: c.vendor, price: c.value }], selectedVendor: 0 };
  c.versions = [{ type: c.requestType || 'New', values, docs: {} }];
  c.pastCycles = c.pastCycles || [];
  c.comments = c.comments || [];
}

function mgConfirm(title, msg, yesLabel, onYes) {
  let m = document.getElementById('mgYesNoModal');
  if (!m) {
    m = document.createElement('div');
    m.className = 'modal-overlay';
    m.id = 'mgYesNoModal';
    document.body.appendChild(m);
  }
  m.innerHTML = `
    <div class="modal-box mg-confirm-box">
      <div class="mg-yesno-head"><b>${title}</b><button class="btn-close-modal" onclick="closeModal('mgYesNoModal')">&times;</button></div>
      <p>${msg}</p>
      <div class="mg-confirm-foot"><button class="btn-outline-teal" onclick="closeModal('mgYesNoModal')">Cancel</button><button class="btn-teal-primary" id="mgYesBtn">${yesLabel}</button></div>
    </div>`;
  m.querySelector('#mgYesBtn').onclick = () => { closeModal('mgYesNoModal'); onYes(); };
  openModal('mgYesNoModal');
}

// ---- Links from the lists ---------------------------------------------------

(function () {
  const D = InnomickCMSData;
  D.migrated = D.migrated || [];

  const openContract = window.openContractDetailsById;
  window.openContractDetailsById = function (id) {
    const c = mgFind(id);
    if (c && c.imported) { mgOpen(c.id, ['import', 'requests', 'notifications'].includes(CMSState.currentRoute) ? CMSState.currentRoute : 'contracts'); return; }
    openContract(id);
  };

  const openRequest = window.openRequestDetails;
  window.openRequestDetails = function (id) {
    const row = D.requests.find(r => r.id === id);
    if (row && row.migratedId) { mgOpen(row.migratedId, 'requests'); return; }
    openRequest(id);
  };
})();
