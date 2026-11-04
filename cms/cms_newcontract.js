/**
 * Innomick Technologies - CMS Prototype
 * New Contract flow (mirrors the live workflow):
 *   1. New Contract modal (Branch / Department / Contract Type)
 *   2. Select Contract Template
 *   3. Contract Request Details form -> Submit generates primary documents
 *   4. Primary Documents: Start Approval, Select Approvals (Sequential / Parallel),
 *      Version History, View (browser / desktop) and Edit Draft Content
 */

const NC_CONTRACT_TYPES = ['Service', 'Purchase', 'Construction'];
const NC_TYPE_CODES = { Service: 'SVC', Purchase: 'PUR', Construction: 'CON' };
const NC_DEPT_CODES = {
  'Information Technology': 'ITD',
  'Medical Insurance': 'MID',
  'Facilities Management': 'FMD'
};

// Dummy approver directory used by the approval chain and manager picker
const NC_DIRECTORY = [
  { name: 'Sara Thomas', role: 'Department Manager', branch: 'Innomick', department: 'Information Technology' },
  { name: 'Daniel Mathew', role: 'Chief Executive Officer', branch: 'Innomick', department: 'Information Technology' },
  { name: 'Priya Nair', role: 'Finance Controller', branch: 'Innomick', department: 'Facilities Management' },
  { name: 'Omar Siddiqui', role: 'Legal Counsel', branch: 'Innomick', department: 'Facilities Management' },
  { name: 'Kevin Brooks', role: 'Department Manager', branch: 'Innomick', department: 'Medical Insurance' },
  { name: 'Aisha Rahman', role: 'Department Manager', branch: 'Innomick', department: 'Facilities Management' },
  { name: 'Leo Fernandes', role: 'Procurement Lead', branch: 'Innomick Dubai HQ (UAE)', department: 'Information Technology' },
  { name: 'Arjun Mehta', role: 'Medical & Corporate Approver', branch: 'Innomick', department: 'Medical Insurance' },
  { name: 'Imran Hussain', role: 'Lead Cloud Solutions Consultant', branch: 'Innomick', department: 'Information Technology' },
  { name: 'Nisha Kapoor', role: 'Department Manager', branch: 'Innomick Dubai HQ (UAE)', department: 'Medical Insurance' },
  { name: 'Rahul Verma', role: 'Department Manager', branch: 'Innomick Dubai HQ (UAE)', department: 'Facilities Management' },
  { name: 'Fatima Noor', role: 'Department Manager', branch: 'Innomick Kuwait Tech Hub', department: 'Information Technology' },
  { name: 'Thomas George', role: 'Finance Controller', branch: 'Innomick Kuwait Tech Hub', department: 'Medical Insurance' },
  { name: 'Meera Iyer', role: 'Procurement Lead', branch: 'Innomick Kuwait Tech Hub', department: 'Facilities Management' },
  { name: 'Yusuf Khan', role: 'Legal Counsel', branch: 'Innomick Riyadh Regional Office (KSA)', department: 'Information Technology' },
  { name: 'Anita Joseph', role: 'Department Manager', branch: 'Innomick Riyadh Regional Office (KSA)', department: 'Medical Insurance' },
  { name: 'Vikram Shah', role: 'Department Manager', branch: 'Innomick Riyadh Regional Office (KSA)', department: 'Facilities Management' },
  { name: 'Grace Tan', role: 'Department Manager', branch: 'Innomick Singapore APAC Center', department: 'Information Technology' },
  { name: 'Ethan Lim', role: 'Legal Counsel', branch: 'Innomick Singapore APAC Center', department: 'Medical Insurance' },
  { name: 'Rina Das', role: 'Finance Controller', branch: 'Innomick Singapore APAC Center', department: 'Facilities Management' }
];

const NC_DEFAULT_CHAIN = [
  { title: 'Manager Approval', approver: 'Sara Thomas', action: 'Review & Approve' },
  { title: 'CEO Approval', approver: 'Daniel Mathew', action: 'Review & Approve' }
];

const NC_WORKFLOWS = {
  Sequential: [
    { name: 'Vendor Review', steps: [{ title: 'Vendor Review', approver: 'Leo Fernandes', action: 'Review & Approve' }] },
    { name: 'CEO + Vendor App', steps: [
      { title: 'CEO Approval', approver: 'Daniel Mathew', action: 'Review & Approve' },
      { title: 'Vendor Approval', approver: 'Leo Fernandes', action: 'Review & Sign' }
    ] },
    { name: 'Dept Approval', steps: [{ title: 'Department Approval', approver: 'Sara Thomas', action: 'Review & Approve' }] },
    { name: 'Finance + Legal', steps: [
      { title: 'Finance Approval', approver: 'Priya Nair', action: 'Review & Approve' },
      { title: 'Legal Approval', approver: 'Omar Siddiqui', action: 'Review & Approve' }
    ] }
  ],
  Parallel: [
    { name: 'Dept Approvals', steps: [
      { title: 'IT Department', approver: 'Sara Thomas', action: 'Review & Approve' },
      { title: 'Finance Department', approver: 'Priya Nair', action: 'Review & Approve' }
    ] }
  ]
};

// Template-specific fields shown under "Contract Draft Details"
const NC_TEMPLATE_FIELDS = [
  { key: 'currentDate', label: 'Current Date', type: 'date' },
  { key: 'draftBranch', label: 'Branch', type: 'select', options: () => InnomickCMSData.branches },
  { key: 'crNumber', label: 'Commercial Registration No.', type: 'text', placeholder: 'Enter Registration Number' },
  { key: 'signatory', label: 'Authorized Signatory Name', type: 'text', placeholder: 'Enter Signatory Name' }
];

const NCState = {
  records: {},        // keyed by request id
  current: null,      // record being edited
  pending: null,      // {branch, dept, type} between modal and template pick
  approvalTarget: null,
  approvalMode: null, // 'Sequential' | 'Parallel'
  selectedWorkflow: null,
  openVersionPanel: null,
  editorDocKey: null
};

// ---------------------------------------------------------------------------
// Step 1: Modal
// ---------------------------------------------------------------------------
function ncConfigureModal(isNewContract) {
  const extra = document.getElementById('modalExtraFields');
  const typeSel = document.getElementById('modalTypeSelect');
  const branchSel = document.getElementById('modalBranchSelect');
  if (extra) extra.style.display = isNewContract ? 'none' : '';
  if (branchSel) {
    branchSel.disabled = isNewContract;
    if (isNewContract) branchSel.value = InnomickCMSData.branches[0];
  }
  if (!typeSel) return;

  if (!typeSel.dataset.defaultOptions) typeSel.dataset.defaultOptions = typeSel.innerHTML;
  typeSel.innerHTML = isNewContract
    ? '<option value="">Select Contract Type</option>' + NC_CONTRACT_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')
    : typeSel.dataset.defaultOptions;
  const deptSel = document.getElementById('modalDeptSelect');
  if (deptSel) {
    deptSel.disabled = false;
    if (isNewContract) deptSel.value = '';
  }
}

function ncCreateFromModal() {
  const branch = document.getElementById('modalBranchSelect').value || InnomickCMSData.branches[0];
  const dept = document.getElementById('modalDeptSelect').value;
  const type = document.getElementById('modalTypeSelect').value;

  if (!dept || !type) {
    showToast('Please select Department and Contract Type', 'info');
    return;
  }

  const seq = 2600 + InnomickCMSData.requests.length + Object.keys(NCState.records).length;
  const deptCode = NC_DEPT_CODES[dept] || dept.split(/\s|&/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) + 'D';
  const refNo = `INM/${deptCode}/${NC_TYPE_CODES[type]}/${seq}/2026`;
  const id = `REQ-NC-${seq}`;

  const record = {
    id, refNo, branch, department: dept, contractType: type,
    template: null, status: 'Draft', submitted: false,
    form: { name: '', value: '', startDate: '', endDate: '', notice: '1', description: '',
      renewable: 'No', extendable: 'No', singleSource: false,
      vendors: [{ name: '', price: '' }, { name: '', price: '' }, { name: '', price: '' }],
      selectedVendor: null, vendorJustification: '', recJustification: '', budget: 'Non-Budgeted',
      manager: null, templateValues: {} },
    docs: {},
    supporting: [],
    history: []
  };
  NCState.records[id] = record;

  // A draft row appears in Contract Requests immediately, like the live system
  InnomickCMSData.requests.unshift({
    id, refNo, hasIcon: false, contractName: '', requestType: 'New', status: 'Draft',
    vendorName: '', department: dept, isPendingActivation: true, contractValue: '',
    category: type, branch, submittedBy: InnomickCMSData.currentUser.name, ncRecord: true
  });

  closeModal('newContractModal');
  NCState.current = record;
  switchRoute('nc_template_select', id);
}

// ---------------------------------------------------------------------------
// Requests on an existing contract (Renew / Cancel / Amend / Extend / Complete)
// ---------------------------------------------------------------------------
// Renewal and Cancellation mirror the live forms; Amendment, Extension and
// Completion follow the same pattern (no eligible contracts existed in UAT to compare).
const NC_MODES = {
  renew: {
    requestType: 'Renewal', valueEditable: true, autoRenewal: true,
    fields: [
      { key: 'newEffective', label: 'New Effective Date', type: 'date' },
      { key: 'newEnd', label: 'New End Date', type: 'date', dependsOn: 'newEffective' }
    ],
    justification: 'Renewal Justification'
  },
  cancel: {
    requestType: 'Cancellation', valueEditable: false,
    fields: [],
    justification: 'Cancellation Justification'
  },
  amend: {
    requestType: 'Amendment', valueEditable: true,
    fields: [
      { key: 'addendumNo', label: 'Addendum Number', type: 'text' },
      { key: 'newEffective', label: 'New Effective Date', type: 'date' },
      { key: 'newEnd', label: 'New End Date', type: 'date' }
    ],
    justification: 'Amendment Justification'
  },
  extension: {
    requestType: 'Extension', valueEditable: false,
    fields: [{ key: 'newEnd', label: 'Extended End Date', type: 'date' }],
    justification: 'Extension Justification'
  },
  completion: {
    requestType: 'Completion', valueEditable: false,
    fields: [{ key: 'completionDate', label: 'Completion Date', type: 'date' }],
    justification: 'Completion Remarks'
  }
};

// "23 May 23 - 22 Mar 24" -> ['2023-05-23', '2024-03-22']
function ncParseRange(range) {
  if (!range) return ['', ''];
  return range.split(' - ').map(part => {
    const [d, m, y] = part.trim().split(/\s+/);
    if (!y) return '';
    const dt = new Date(`${d} ${m.slice(0, 3)} ${y.length === 2 ? '20' + y : y}`);
    return isNaN(dt) ? '' : `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  });
}

function ncCreateFromContract(contract, action) {
  const mode = NC_MODES[action] ? action : 'renew';
  const [start, end] = contract.startDate && contract.endDate
    ? [ncParseRange(`${contract.startDate} - x`)[0], ncParseRange(`${contract.endDate} - x`)[0]]
    : ncParseRange(contract.durationDates);
  const seq = 2700 + Object.keys(NCState.records).length;
  const id = `REQ-NC-${seq}`;
  const vendor = contract.vendor || contract.vendorName || '';

  const record = {
    id, refNo: contract.code || contract.refNo, branch: contract.branch || InnomickCMSData.branches[0],
    department: contract.department, contractType: contract.category || 'Service',
    mode, sourceContract: contract,
    template: { name: contract.type || 'Contract Details' },
    status: 'Draft', submitted: false, createdOn: ncFormatDateTime(new Date()),
    modeValues: mode === 'amend'
      ? { addendumNo: `${contract.code || contract.refNo}/ADDENDUM${(contract.periods || []).filter(p => p.type === 'Amendment').length + 1}` }
      : {},
    form: { name: contract.name, value: String(contract.value || ''), startDate: start, endDate: end, notice: '1',
      description: contract.description || '', renewable: 'Yes', extendable: 'Yes', autoRenewal: false,
      singleSource: true, vendors: [{ name: vendor, price: String(contract.value || '') }, { name: '', price: '' }, { name: '', price: '' }],
      selectedVendor: 0, vendorJustification: 'Existing contracted vendor', recJustification: 'Continuity of service with the current vendor',
      budget: 'Budgeted', budgetCode: 'BC-1024', manager: null,
      templateValues: { currentDate: start, draftBranch: contract.branch || InnomickCMSData.branches[0], crNumber: 'CR-55021', signatory: 'Daniel Mathew' } },
    docs: {}, supporting: [], history: []
  };
  NCState.records[id] = record;

  InnomickCMSData.requests.unshift({
    id, refNo: record.refNo, hasIcon: !!contract.hasIcon, contractName: contract.name,
    requestType: NC_MODES[mode].requestType, status: 'Draft', vendorName: vendor,
    department: contract.department, durationMonths: contract.durationMonths, durationDates: contract.durationDates,
    durationProgress: 0, contractValue: contract.contractValue || String(contract.value),
    category: record.contractType, branch: record.branch, submittedBy: InnomickCMSData.currentUser.name, ncRecord: true
  });

  NCState.current = record;
  if (mode === 'amend') {
    record.template = null;
    switchRoute('nc_template_select', id);
  } else {
    switchRoute('nc_details', id);
  }
}

// Amendment only: keep the previous contract text and edit it directly
function ncContinueWithoutTemplate() {
  const rec = NCState.current;
  rec.template = { name: 'Without Template', noTemplate: true, fields: [] };
  switchRoute('nc_details', rec.id);
}

function ncRenderModeBlock() {
  const rec = NCState.current;
  const block = document.getElementById('ncModeBlock');
  if (!block) return;
  const cfg = rec.mode && NC_MODES[rec.mode];
  if (!cfg) { block.innerHTML = ''; return; }

  const f = rec.form;
  const mv = rec.modeValues;
  const periods = ncContractPeriods(rec);
  const latest = periods[0];

  block.innerHTML = `
    <div class="nc-period-banner">
      <div class="nc-period-head" onclick="this.parentElement.classList.toggle('open')">
        <span class="nc-period-caret">&#9656;</span>
        Previously effective: <strong>${ncLongDate(latest.start)} – ${ncLongDate(latest.end)}</strong>
        <span class="nc-period-link">View period history</span>
      </div>
      <div class="nc-period-list">
        ${periods.map(p => `<div class="nc-period-row"><span class="nc-period-tag ${p.type.toLowerCase()}">${p.type}</span> ${ncLongDate(p.start)} &rarr; ${ncLongDate(p.end)}</div>`).join('')}
      </div>
    </div>
    ${cfg.fields.length ? `<div class="detail-form-grid-3col" style="margin-top: 16px;">
      ${cfg.fields.map(fd => `
        <div class="detail-field-box">
          <label class="detail-field-label">${fd.label} *</label>
          <input type="${fd.type}" class="detail-field-input nc-field" id="ncMode_${fd.key}" value="${mv[fd.key] || ''}" data-required="true"
            ${fd.dependsOn && !mv[fd.dependsOn] ? 'disabled' : ''} onchange="ncModeFieldChanged()">
        </div>`).join('')}
    </div>` : ''}
    <div style="margin-top: 16px;">
      <label class="detail-field-label" style="display:block; margin-bottom: 6px;">${cfg.justification} *</label>
      <textarea class="cms-input nc-field" id="ncModeJustification" rows="3" style="width: 100%;" placeholder="Type Justification here..." data-required="true">${mv.justification || ''}</textarea>
    </div>`;

  // Original contract details are locked; only the request-specific fields change
  ['ncName', 'ncStartDate', 'ncEndDate'].forEach(idName => { document.getElementById(idName).disabled = true; });
  document.getElementById('ncValue').disabled = !cfg.valueEditable;
  ncRenewableChanged();
  document.getElementById('ncAutoRenewal').checked = !!f.autoRenewal;
  document.querySelectorAll('#ncPanelDetail textarea, #ncPanelDetail input[name="ncRenewable"], #ncPanelDetail input[name="ncExtendable"], #ncSingleSource, #ncVendorRows input, input[name="ncBudget"], #ncBudgetCode' + (rec.mode === 'amend' ? '' : ', #ncTemplateFields input, #ncTemplateFields select'))
    .forEach(el => { el.disabled = true; });
}

// The Auto Renewal toggle is only offered for renewable contracts
function ncRenewableChanged() {
  const yes = document.querySelector('input[name="ncRenewable"]:checked').value === 'Yes';
  document.getElementById('ncAutoRenewalGroup').style.display = yes ? 'flex' : 'none';
  if (!yes) document.getElementById('ncAutoRenewal').checked = false;
}

function ncModeFieldChanged() {
  const rec = NCState.current;
  const eff = document.getElementById('ncMode_newEffective');
  const end = document.getElementById('ncMode_newEnd');
  if (rec.mode === 'renew' && eff && end) {
    end.disabled = !eff.value;
    end.min = eff.value;
    // Default the new term to the same length as the previous one
    if (eff.value && !end.value && rec.form.startDate && rec.form.endDate) {
      const len = new Date(rec.form.endDate) - new Date(rec.form.startDate);
      end.value = new Date(new Date(eff.value).getTime() + len).toISOString().slice(0, 10);
    }
  }
}

function ncContractPeriods(rec) {
  const f = rec.form;
  const periods = (rec.sourceContract && rec.sourceContract.periods) || [];
  return periods.length ? periods : [{ type: 'New', start: f.startDate, end: f.endDate }];
}

function ncRenderContractHistory() {
  const rec = NCState.current;
  const wrap = document.getElementById('ncContractHistoryList');
  if (!wrap || !rec.mode) return;
  const f = rec.form;
  const vendor = (f.vendors[0] || {}).name || '';
  const cards = [{ type: NC_MODES[rec.mode].requestType, current: true, created: rec.createdOn, start: '', end: '' }]
    .concat(ncContractPeriods(rec).map(p => ({ type: p.type, created: ncLongDate(p.start), start: p.start, end: p.end })));

  wrap.innerHTML = `<div class="nc-ch-timeline">${cards.map(c => `
    <div class="nc-ch-item">
      <span class="nc-ch-dot">&#10003;</span>
      <div class="nc-ch-card ${c.current ? 'current' : ''}">
        <div class="nc-ch-head">
          <div>Reference ID: <strong>${rec.refNo}</strong>
            <span class="nc-period-tag ${c.type.toLowerCase()}">${c.type}</span>
            ${c.current ? '<span class="nc-ch-current">Current</span>' : ''}</div>
          <div class="nc-ch-actions">
            <span class="nc-ch-created">Created ${c.created}</span>
            <button class="btn-outline-teal nc-doc-btn" onclick="openApprovalCertificateModal()">View Certificate</button>
            ${c.current ? '<button class="btn-outline-teal nc-doc-btn" disabled>&#10003; Current</button>' : `<button class="btn-outline-teal nc-doc-btn" onclick="openContractDetailsById('${rec.sourceContract.id}')">Open</button>`}
          </div>
        </div>
        <div class="nc-ch-grid">
          <div><span>Contract Name:</span> ${f.name}</div>
          <div><span>Vendor:</span> ${vendor}</div>
          <div><span>Contract Value:</span> ${Number(f.value || 0).toLocaleString()} KWD</div>
          <div><span>Actual Start Date:</span> ${c.start ? ncLongDate(c.start) : '—'}</div>
          <div><span>Actual End Date:</span> ${c.end ? ncLongDate(c.end) : '—'}</div>
        </div>
      </div>
    </div>`).join('')}</div>`;
}

function ncToggleBudgetCode() {
  const budgeted = document.querySelector('input[name="ncBudget"]:checked').value === 'Budgeted';
  document.getElementById('ncBudgetCodeBox').style.display = budgeted ? 'flex' : 'none';
}

function ncLongDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Step 2: Template picker
// ---------------------------------------------------------------------------
function ncOpenTemplatePicker(id) {
  const rec = NCState.records[id] || NCState.current;
  if (!rec) { switchRoute('requests'); return; }
  NCState.current = rec;
  const refEl = document.getElementById('ncTplSelectRef');
  if (refEl) refEl.textContent = rec.mode === 'amend' ? rec.modeValues.addendumNo : rec.refNo;
  const noTpl = document.getElementById('ncNoTemplateBtn');
  if (noTpl) noTpl.style.display = rec.mode === 'amend' ? '' : 'none';
  const search = document.getElementById('ncTplSearchInput');
  if (search) search.value = '';
  ncRenderTemplatePicker();
}

function ncRenderTemplatePicker() {
  const grid = document.getElementById('ncTplPickerGrid');
  if (!grid) return;
  const q = (document.getElementById('ncTplSearchInput')?.value || '').toLowerCase();
  const sort = document.getElementById('ncTplSortSelect')?.value || 'name_asc';

  const type = NCState.current ? NCState.current.contractType : '';
  const list = sortTemplateList(InnomickCMSData.templates.filter(t =>
    t.name.toLowerCase().includes(q) && (!type || templateContractType(t) === type)), sort);

  if (!list.length) {
    grid.innerHTML = '<div class="empty-table-state" style="grid-column: 1 / -1;">No contract templates found.</div>';
    return;
  }

  grid.innerHTML = list.map(tpl => `
    <div class="template-pill-card" onclick="ncSelectTemplate('${tpl.id}')" title="${tpl.name}">
      <div class="template-pill-left">
        <svg class="template-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M8 15s1.5 2 4 2 4-2 4-2"/>
        </svg>
        <span class="template-pill-title">${tpl.name}</span>
      </div>
      <span class="template-pill-edit-btn" title="Use this template">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
        </svg>
      </span>
    </div>
  `).join('');
}

function ncSelectTemplate(tplId) {
  const rec = NCState.current;
  if (!rec) return;
  rec.template = InnomickCMSData.templates.find(t => t.id === tplId) || null;
  switchRoute('nc_details', rec.id);
}

// ---------------------------------------------------------------------------
// Step 3: Contract Request Details form
// ---------------------------------------------------------------------------
function ncOpenDetails(id) {
  const rec = NCState.records[id] || NCState.current;
  if (!rec) { switchRoute('requests'); return; }
  NCState.current = rec;
  const f = rec.form;

  document.getElementById('ncRefNo').textContent = rec.refNo;
  document.getElementById('ncContractType').textContent = rec.contractType;
  document.getElementById('ncName').value = f.name;
  document.getElementById('ncValue').value = f.value;
  document.getElementById('ncStartDate').value = f.startDate;
  document.getElementById('ncEndDate').value = f.endDate;
  document.getElementById('ncNotice').value = f.notice;
  document.getElementById('ncDescription').value = f.description;
  document.getElementById('ncVendorJustification').value = f.vendorJustification;
  document.getElementById('ncRecJustification').value = f.recJustification;
  document.getElementById('ncSingleSource').checked = f.singleSource;
  document.getElementById('ncBranchText').textContent = rec.branch;
  document.getElementById('ncDeptText').textContent = rec.department;
  document.querySelector(`input[name="ncRenewable"][value="${f.renewable}"]`).checked = true;
  document.querySelector(`input[name="ncExtendable"][value="${f.extendable}"]`).checked = true;
  document.querySelector(`input[name="ncBudget"][value="${f.budget}"]`).checked = true;
  document.getElementById('ncBudgetCode').value = f.budgetCode || '';
  ncToggleBudgetCode();

  // Reset locks from a previous Renew/Cancel form, then apply this record's mode
  document.querySelectorAll('#view-nc-details input, #view-nc-details textarea, #view-nc-details select').forEach(el => { el.disabled = false; });
  ncRenewableChanged();
  document.getElementById('ncAutoRenewal').checked = !!f.autoRenewal;
  document.getElementById('ncTabBtnContractHistory').style.display = rec.mode ? '' : 'none';

  const badge = document.getElementById('ncStatusBadge');
  badge.textContent = rec.status;
  badge.className = rec.status === 'In Approval' ? 'badge-in-approval' : rec.status === 'Rejected' ? 'badge-rejected' : ['Approved', 'Active'].includes(rec.status) ? 'badge-approved' : 'badge-draft';
  ncShowSubmitButtons();

  document.querySelectorAll('#view-nc-details .nc-invalid').forEach(el => el.classList.remove('nc-invalid'));
  ncRenderVendorRows();
  ncToggleSingleSource(true);
  ncInitManagerPicker();
  ncRenderTemplateFields();
  ncRenderModeBlock();
  ncRenderContractHistory();
  ncRenderPrimaryDocs();
  ncRenderSupporting();
  ncRenderHistory();
  ncRenderApproverComments();
  ncSwitchTab('detail');
}

function ncSwitchTab(tab) {
  const map = { detail: 'Detail', primary: 'Primary', supporting: 'Supporting', contractHistory: 'ContractHistory', history: 'History' };
  Object.entries(map).forEach(([key, suffix]) => {
    const btn = document.getElementById(`ncTabBtn${suffix}`);
    const panel = document.getElementById(`ncPanel${suffix}`);
    if (btn) btn.classList.toggle('active', key === tab);
    if (panel) panel.style.display = key === tab ? 'block' : 'none';
  });
}

// Copies every input on the form back into the record so tab switches keep values
function ncCollectForm() {
  const rec = NCState.current;
  if (!rec) return;
  const f = rec.form;
  f.name = document.getElementById('ncName').value.trim();
  f.value = document.getElementById('ncValue').value;
  f.startDate = document.getElementById('ncStartDate').value;
  f.endDate = document.getElementById('ncEndDate').value;
  f.notice = document.getElementById('ncNotice').value;
  f.description = document.getElementById('ncDescription').value;
  f.renewable = document.querySelector('input[name="ncRenewable"]:checked').value;
  f.extendable = document.querySelector('input[name="ncExtendable"]:checked').value;
  f.budget = document.querySelector('input[name="ncBudget"]:checked').value;
  f.singleSource = document.getElementById('ncSingleSource').checked;
  f.vendorJustification = document.getElementById('ncVendorJustification').value;
  f.recJustification = document.getElementById('ncRecJustification').value;
  f.budgetCode = document.getElementById('ncBudgetCode').value;
  f.autoRenewal = document.getElementById('ncAutoRenewal').checked;

  if (rec.mode) {
    NC_MODES[rec.mode].fields.forEach(fd => {
      const el = document.getElementById(`ncMode_${fd.key}`);
      if (el) rec.modeValues[fd.key] = el.value;
    });
    const j = document.getElementById('ncModeJustification');
    if (j) rec.modeValues.justification = j.value;
  }

  document.querySelectorAll('#ncVendorRows tr').forEach((tr, i) => {
    if (!f.vendors[i]) return;
    f.vendors[i].name = tr.querySelector('.nc-vendor-name').value.trim();
    f.vendors[i].price = tr.querySelector('.nc-vendor-price').value;
  });

  ncTemplateFieldDefs(rec).forEach((fd, i) => {
    const el = document.getElementById(`ncTpl_${i}`);
    if (el) f.templateValues[fd.name] = el.value;
  });
}

function ncRenderVendorRows() {
  const rec = NCState.current;
  const tbody = document.getElementById('ncVendorRows');
  if (!rec || !tbody) return;
  const f = rec.form;
  const rows = f.singleSource ? f.vendors.slice(0, 1) : f.vendors;

  tbody.innerHTML = rows.map((v, i) => `
    <tr>
      <td style="font-weight: 600;">${i + 1}</td>
      <td><input type="text" class="nc-vendor-name nc-inline-input" placeholder="Enter Vendor" value="${v.name}" oninput="ncVendorChanged()"></td>
      <td><input type="number" class="nc-vendor-price nc-inline-input" placeholder="Price" value="${v.price}" oninput="ncVendorChanged()"></td>
      <td style="text-align: center;"><input type="radio" name="ncSelectedVendor" value="${i}" ${f.selectedVendor === i ? 'checked' : ''} ${v.name ? '' : 'disabled'} onchange="ncSelectVendor(${i})" style="accent-color: #008272; width: 16px; height: 16px;"></td>
    </tr>
  `).join('');
  ncUpdateRecommended();
}

function ncVendorChanged() {
  ncCollectForm();
  document.querySelectorAll('#ncVendorRows tr').forEach((tr, i) => {
    const radio = tr.querySelector('input[type="radio"]');
    const hasName = !!NCState.current.form.vendors[i].name;
    radio.disabled = !hasName;
    if (!hasName && NCState.current.form.selectedVendor === i) {
      NCState.current.form.selectedVendor = null;
      radio.checked = false;
    }
  });
  ncUpdateRecommended();
}

function ncSelectVendor(i) {
  NCState.current.form.selectedVendor = i;
  ncUpdateRecommended();
}

function ncUpdateRecommended() {
  const f = NCState.current.form;
  const el = document.getElementById('ncRecommendedVendor');
  const label = document.getElementById('ncRecommendedLabel');
  const v = f.selectedVendor !== null ? f.vendors[f.selectedVendor] : null;
  if (el) el.textContent = v && v.name ? v.name : '';
  if (label) label.textContent = f.singleSource ? 'Recommended Vendor' : 'Final Recommended Vendor *';
}

function ncToggleSingleSource(skipCollect) {
  if (!skipCollect) ncCollectForm();
  const f = NCState.current.form;
  f.singleSource = document.getElementById('ncSingleSource').checked;
  if (f.singleSource && f.selectedVendor !== null && f.selectedVendor > 0) f.selectedVendor = null;
  document.getElementById('ncVendorJustificationBox').style.display = f.singleSource ? 'block' : 'none';
  if (!skipCollect) ncRenderVendorRows();
  else ncUpdateRecommended();
}

// Manager Details: Branch -> Department -> Role -> Manager cascade
function ncInitManagerPicker() {
  const branchSel = document.getElementById('ncMgrBranch');
  branchSel.innerHTML = '<option value="">Select Branch</option>' +
    InnomickCMSData.branches.map(b => `<option value="${b}">${b}</option>`).join('');
  ['ncMgrDept', 'ncMgrRole', 'ncMgrUser'].forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML = `<option value="">${el.options[0].text}</option>`;
    el.disabled = true;
  });
  const m = NCState.current.form.manager;
  document.getElementById('ncManagerSaved').innerHTML = m
    ? `Notifications will be sent to <strong>${m.name}</strong> (${m.role}, ${m.department})`
    : '';
}

function ncManagerCascade(level) {
  const branch = document.getElementById('ncMgrBranch').value;
  const deptSel = document.getElementById('ncMgrDept');
  const roleSel = document.getElementById('ncMgrRole');
  const userSel = document.getElementById('ncMgrUser');
  const fill = (sel, placeholder, values) => {
    sel.innerHTML = `<option value="">${placeholder}</option>` + values.map(v => `<option value="${v}">${v}</option>`).join('');
    sel.disabled = values.length === 0;
  };
  const uniq = arr => [...new Set(arr)];

  if (level === 'branch') {
    fill(deptSel, 'Select Department', branch ? InnomickCMSData.departments.concat(['Facilities Management']).filter((d, i, a) => a.indexOf(d) === i) : []);
    fill(roleSel, 'Select Role', []);
    fill(userSel, 'Select Manager', []);
  } else if (level === 'dept') {
    const dept = deptSel.value;
    const people = NC_DIRECTORY.filter(p => p.department === dept);
    fill(roleSel, 'Select Role', dept ? uniq((people.length ? people : NC_DIRECTORY).map(p => p.role)) : []);
    fill(userSel, 'Select Manager', []);
  } else if (level === 'role') {
    const dept = deptSel.value;
    const role = roleSel.value;
    let people = NC_DIRECTORY.filter(p => p.role === role && p.department === dept);
    if (!people.length) people = NC_DIRECTORY.filter(p => p.role === role);
    fill(userSel, 'Select Manager', role ? people.map(p => p.name) : []);
  }
}

function ncSaveManager() {
  const name = document.getElementById('ncMgrUser').value;
  if (!name) {
    showToast('Select Branch, Department, Role and Manager before saving', 'info');
    return;
  }
  NCState.current.form.manager = {
    name,
    role: document.getElementById('ncMgrRole').value,
    department: document.getElementById('ncMgrDept').value,
    branch: document.getElementById('ncMgrBranch').value
  };
  ncInitManagerPicker();
  showToast(`Manager ${name} saved for contract notifications`, 'success');
}

// Fields of the chosen template (from the live template list); older records use the default set
function ncTemplateFieldDefs(rec) {
  if (rec.template && rec.template.fields) return rec.template.fields;
  return NC_TEMPLATE_FIELDS.map(fd => ({
    name: fd.key, label: fd.label, type: fd.type === 'select' ? 'choice' : fd.type,
    required: true, arabic: false, choices: fd.options ? fd.options().join(',') : ''
  }));
}

function ncTemplateInput(fd, i, v) {
  const id = `ncTpl_${i}`;
  const req = fd.required ? 'data-required="true"' : '';
  const ar = fd.arabic;
  if (fd.type === 'choice') {
    const opts = (fd.choices || '').split(',').map(o => o.trim()).filter(Boolean);
    return `<select class="cms-select nc-field" id="${id}" ${req} ${ar ? 'dir="rtl"' : ''}>
      <option value="">${ar ? 'اختر' : 'Select ' + fd.label}</option>
      ${opts.map(o => `<option value="${o}" ${o === v ? 'selected' : ''}>${o}</option>`).join('')}
    </select>`;
  }
  const type = fd.type === 'date' ? 'date' : fd.type === 'number' ? 'number' : 'text';
  const ph = type === 'date' ? '' : ar ? 'أدخل القيمة' : `Enter ${fd.label}`;
  return `<input type="${type}" class="cms-input nc-field" id="${id}" value="${v || ''}" placeholder="${ph}" ${req} ${ar ? 'dir="rtl"' : ''}>`;
}

function ncRenderTemplateFields() {
  const rec = NCState.current;
  const wrap = document.getElementById('ncTemplateFields');
  const title = document.getElementById('ncTemplateFieldsTitle');
  if (!wrap) return;
  if (title) title.textContent = rec.mode ? 'Contract Details' : 'Contract Draft Details';
  const vals = rec.form.templateValues;
  const defs = ncTemplateFieldDefs(rec).map((fd, i) => ({ fd, i }));
  const label = fd => `${fd.label}${fd.required ? ' *' : ''}`;

  const english = defs.filter(d => !d.fd.arabic);
  const arabic = defs.filter(d => d.fd.arabic);
  wrap.innerHTML = english.map(({ fd, i }) =>
    `<label class="nc-template-field-label" for="ncTpl_${i}">${label(fd)}</label>${ncTemplateInput(fd, i, vals[fd.name])}`).join('')
    + (arabic.length ? `<div class="nc-template-ar-divider"></div><div class="nc-template-ar-grid">` + arabic.map(({ fd, i }) =>
      `${ncTemplateInput(fd, i, vals[fd.name])}<label class="nc-template-field-label nc-template-ar-label" for="ncTpl_${i}" dir="rtl">${fd.required ? '* ' : ''}${fd.label}</label>`).join('') + '</div>' : '')
    + (!defs.length ? '<div class="nc-template-field-label" style="grid-column: 1 / -1; color: #94a3b8;">This template has no draft fields.</div>' : '');
}

// ---------------------------------------------------------------------------
// Validation + Submit
// ---------------------------------------------------------------------------
function ncValidate() {
  const rec = NCState.current;
  const f = rec.form;
  const invalid = [];
  document.querySelectorAll('#view-nc-details .nc-invalid').forEach(el => el.classList.remove('nc-invalid'));

  document.querySelectorAll('#view-nc-details [data-required="true"]').forEach(el => {
    if (!String(el.value).trim()) invalid.push(el);
  });

  if (f.startDate && f.endDate && f.endDate < f.startDate) {
    invalid.push(document.getElementById('ncEndDate'));
    showToast('Contract End Date must be after Start Date', 'info');
  }

  const rows = document.querySelectorAll('#ncVendorRows tr');
  let vendorProblem = false;
  rows.forEach(tr => {
    const n = tr.querySelector('.nc-vendor-name');
    const p = tr.querySelector('.nc-vendor-price');
    if (!n.value.trim()) { invalid.push(n); vendorProblem = true; }
    if (!p.value) { invalid.push(p); vendorProblem = true; }
  });
  if (vendorProblem || f.selectedVendor === null) {
    document.getElementById('ncVendorTableWrap').classList.add('nc-invalid');
    if (!vendorProblem) invalid.push(document.getElementById('ncVendorTableWrap'));
  }

  if (f.singleSource && !f.vendorJustification.trim()) invalid.push(document.getElementById('ncVendorJustification'));

  invalid.forEach(el => el.classList.add('nc-invalid'));
  if (invalid.length) {
    invalid[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('Please fill all mandatory fields', 'info');
  }
  return invalid.length === 0;
}

// which: undefined = first submit (both documents), 'letter' / 'draft' = update one document
function ncSubmit(which) {
  ncCollectForm();
  if (!ncValidate()) return;

  const rec = NCState.current;
  const f = rec.form;
  const firstTime = !rec.submitted;
  if (!ncDocKeys(rec).length) { ncSubmitDirect(rec); return; }
  rec.submitted = true;

  const now = new Date();
  const stamp = now.toISOString().slice(0, 10);
  (which ? [which] : ncDocKeys(rec)).forEach(key => {
    if (!rec.docs[key]) {
      rec.docs[key] = {
        status: 'Draft', submitted: stamp, customHtml: null,
        versions: [{ version: '1.0', by: InnomickCMSData.currentUser.name, on: ncFormatDateTime(now), description: 'Document Creation' }]
      };
    } else {
      const d = rec.docs[key];
      const next = (parseFloat(d.versions[0].version) + 0.1).toFixed(1);
      d.versions.unshift({ version: next, by: InnomickCMSData.currentUser.name, on: ncFormatDateTime(now), description: 'Details Updated' });
    }
  });

  // Keep the Contract Requests row in sync with the form
  const row = InnomickCMSData.requests.find(r => r.id === rec.id);
  if (row) {
    const vendor = f.vendors[f.selectedVendor] || {};
    row.contractName = f.name;
    row.vendorName = vendor.name || '';
    row.contractValue = Number(f.value).toLocaleString();
    row.isPendingActivation = false;
    // Renewal / amendment / extension requests show the proposed new term
    const mv = rec.modeValues || {};
    const start = mv.newEffective || f.startDate;
    const end = mv.newEnd || mv.completionDate || f.endDate;
    row.durationMonths = ncMonthsBetween(start, end);
    row.durationDates = `${ncShortDate(start)} - ${ncShortDate(end)}`;
    row.durationProgress = 0;
  }

  ncShowSubmitButtons();
  ncRenderPrimaryDocs();
  ncRenderHistory();
  document.getElementById('ncInfoMessage').textContent = firstTime
    ? 'Contract Submitted and Documents Generated!'
    : `${which === 'letter' ? 'Request Letter' : 'Contract Draft'} Updated Successfully!`;
  ncShowInfo(document.getElementById('ncInfoMessage').textContent, false);
  // The popup closes itself after a second and moves on to Primary Documents
  clearTimeout(NCState.infoTimer);
  NCState.infoTimer = setTimeout(() => {
    if (document.getElementById('ncInfoModal').classList.contains('active')) ncCloseInfo();
  }, 1000);
}

function ncCloseInfo() {
  closeModal('ncInfoModal');
  if (NCState.afterInfo) {
    const next = NCState.afterInfo;
    NCState.afterInfo = null;
    next();
    return;
  }
  ncSwitchTab('primary');
}

// Before submit: one Submit button. After: Update Request Letter + Update Contract Draft
function ncShowSubmitButtons() {
  const submitted = NCState.current && NCState.current.submitted;
  document.getElementById('ncSubmitBtn').style.display = submitted ? 'none' : '';
  document.getElementById('ncUpdateLetterBtn').style.display = submitted ? '' : 'none';
  document.getElementById('ncUpdateDraftBtn').style.display = submitted ? '' : 'none';
}

// ---------------------------------------------------------------------------
// Primary Documents
// ---------------------------------------------------------------------------
// Which generated documents each request type has (from the live document metadata)
const NC_MODE_DOCS = { new: ['letter', 'draft'], renew: ['letter'], cancel: ['letter'], amend: ['letter', 'draft'], extension: [], completion: [] };
function ncDocKeys(rec) { return NC_MODE_DOCS[rec.mode || 'new'] || ['letter', 'draft']; }
function ncDocTitle(rec, key) {
  const t = rec.mode ? NC_MODES[rec.mode].requestType.toUpperCase() + ' ' : '';
  if (key === 'letter') return `${t}CONTRACT REQUEST LETTER`;
  return rec.mode === 'amend' ? 'AMENDMENT CONTRACT' : 'CONTRACT DRAFT';
}

const NC_DOC_META = {
  letter: { title: 'CONTRACT REQUEST LETTER', empty: 'No Contract Request Letter has been generated yet', emptySub: 'Fill in the contract details and submit the form to generate the Contract Request Letter.' },
  draft: { title: 'CONTRACT DRAFT', empty: 'No Contract Draft has been generated yet', emptySub: 'Fill in the contract details and submit the form to generate the Contract Draft.' }
};

function ncRenderPrimaryDocs() {
  const rec = NCState.current;
  const wrap = document.getElementById('ncPrimaryDocs');
  if (!wrap || !rec) return;

  wrap.innerHTML = ncDocKeys(rec).map(key => {
    const meta = NC_DOC_META[key];
    const doc = rec.docs[key];
    const icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;

    if (!doc) {
      return `
        <div class="nc-doc-card">
          <div class="nc-doc-card-head"><span class="nc-doc-card-title">${icon} ${ncDocTitle(rec, key)}</span></div>
          <div class="nc-doc-empty">
            <div class="nc-doc-empty-title">${meta.empty}</div>
            <div class="nc-doc-empty-sub">${meta.emptySub}</div>
          </div>
        </div>`;
    }

    const inApproval = doc.status === 'In Approval' || doc.finalApproved;
    const statusClass = doc.status === 'Approved' ? 'badge-approved' : doc.status === 'In Approval' || doc.status === 'Request for Change' ? 'badge-in-approval' : doc.status === 'Rejected' ? 'badge-rejected' : 'badge-draft';
    // UAT: after Request for Change the document can be re-sent, and its last cycle stays viewable
    const detailsBtn = doc.cycle ? `<button class="btn-outline-teal nc-doc-btn" onclick="ncOpenApprovalView('NCAPP-${rec.id}-${key}')">Approval Details &#8599;</button>` : '';
    const approvalBtn = inApproval || rec.status === 'Rejected'
      ? detailsBtn
      : (key === 'letter'
        ? `<button class="btn-teal-primary nc-doc-btn" onclick="ncOpenStartApproval('${key}')">Start Approval</button>`
        : `<button class="btn-teal-primary nc-doc-btn" onclick="ncOpenSelectApproval('${key}')">Select Approvals</button>`) + detailsBtn;

    const versionsOpen = NCState.openVersionPanel === key;
    if (doc.finalApproved) return ncApprovedDocCard(rec, key, doc, icon, versionsOpen);
    return `
      <div class="nc-doc-card">
        <div class="nc-doc-card-head">
          <span class="nc-doc-card-title">${icon} ${ncDocTitle(rec, key)}</span>
          <span class="nc-doc-head-right"><span class="${statusClass} nc-doc-pill">${doc.status}</span>
          <button class="nc-doc-chevron" title="Collapse" onclick="this.closest('.nc-doc-card').classList.toggle('collapsed')">&#8964;</button></span>
        </div>
        <div class="nc-doc-card-body">
          <div>
            <div class="nc-doc-meta">ID: ${rec.refNo} &nbsp;&nbsp; Submitted: ${doc.submitted}</div>
            ${key === 'draft' && !inApproval ? `<a href="javascript:void(0)" class="nc-doc-edit-link" onclick="ncOpenDocEditor('draft')">Edit Draft Content</a>` : ''}
          </div>
          <div class="nc-doc-actions">
            <button class="btn-outline-teal nc-doc-btn" onclick="ncToggleVersions('${key}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 9v3a6 6 0 0 0 6 6h3"/></svg>
              Version History
            </button>
            ${approvalBtn}
            <div class="nc-view-menu-wrap">
              <button class="btn-outline-teal nc-doc-btn" onclick="ncToggleViewMenu(event, '${key}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                View
              </button>
              <div class="nc-view-menu" id="ncViewMenu_${key}">
                <button onclick="ncPreviewDoc('${key}')">Open in Browser</button>
                <button onclick="ncDownloadDoc('${key}', true)">Open in Desktop App</button>
              </div>
            </div>
          </div>
        </div>
        ${doc.cycle ? ncApprovalChainHtml(doc) : ''}
        ${versionsOpen ? ncVersionPanelHtml(key, doc) : ''}
      </div>`;
  }).join('');
}

function ncVersionPanelHtml(key, doc) {
  return `
    <div class="nc-version-panel">
      <div class="nc-version-head">
        <span>VERSION HISTORY</span>
        <button class="btn-close-modal" style="font-size: 18px;" onclick="ncToggleVersions('${key}')">&times;</button>
      </div>
      <table class="cms-table nc-version-table">
        <thead><tr><th>Version(s)</th><th>Modified By</th><th>Modified On</th><th>Description</th><th>Download</th><th>View</th></tr></thead>
        <tbody>
          ${doc.versions.map((v, i) => `
            <tr>
              <td>${v.version} ${i === 0 ? '<span class="nc-current-pill">Current</span>' : ''}</td>
              <td>${v.by}</td>
              <td>${v.on}</td>
              <td>${v.description}</td>
              <td><button class="nc-version-icon-btn" title="Download" onclick="ncDownloadDoc('${key}')">&#8681;</button></td>
              <td><button class="nc-version-icon-btn" title="View" onclick="ncPreviewDoc('${key}')">&#128065;</button></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function ncToggleVersions(key) {
  NCState.openVersionPanel = NCState.openVersionPanel === key ? null : key;
  ncRenderPrimaryDocs();
}

function ncToggleViewMenu(e, key) {
  e.stopPropagation();
  const menu = document.getElementById(`ncViewMenu_${key}`);
  const wasOpen = menu.classList.contains('open');
  document.querySelectorAll('.nc-view-menu.open').forEach(m => m.classList.remove('open'));
  if (!wasOpen) menu.classList.add('open');
}
document.addEventListener('click', () => {
  document.querySelectorAll('.nc-view-menu.open').forEach(m => m.classList.remove('open'));
});

// Clear the red validation border as soon as the user fixes a field
['input', 'change'].forEach(evt => document.addEventListener(evt, e => {
  if (!e.target.closest || !e.target.closest('#view-nc-details')) return;
  if (String(e.target.value).trim()) e.target.classList.remove('nc-invalid');
  const wrap = document.getElementById('ncVendorTableWrap');
  const f = NCState.current && NCState.current.form;
  if (wrap && f && e.target.closest('#ncVendorRows') && f.selectedVendor !== null &&
      ![...wrap.querySelectorAll('.nc-vendor-name, .nc-vendor-price')].some(el => !el.value.trim())) {
    wrap.classList.remove('nc-invalid');
  }
}));

// ---------------------------------------------------------------------------
// Generated document content
// ---------------------------------------------------------------------------
function ncDocHtml(key) {
  const rec = NCState.current;
  const doc = rec.docs[key];
  if (doc && doc.customHtml) return doc.customHtml;

  if (key === 'draft' && rec.template && rec.template.noTemplate) {
    const prev = rec.sourceContract || {};
    return `<div class="nc-letter-brand">INNOMICK TECHNOLOGIES</div>
      <h3 style="text-align:center;">${rec.modeValues.addendumNo || 'Addendum'}</h3>
      <p><strong>Ref:</strong> ${rec.refNo} &nbsp;|&nbsp; <strong>Contract:</strong> ${prev.name || rec.form.name}</p>
      <p>This addendum amends the contract between Innomick Technologies and ${prev.vendor || ''}. All clauses of the previous version remain in force except as amended below.</p>
      <h4>Previous version (${(rec.sourceContract && rec.sourceContract.durationDates) || ''})</h4>
      <p>${prev.description || 'Contract clauses of the previous version.'}</p>
      <h4>Amended clauses</h4>
      <p>New effective date: ${ncShortDate(rec.modeValues.newEffective)} &nbsp; New end date: ${ncShortDate(rec.modeValues.newEnd)}</p>
      <p>${rec.modeValues.justification || ''}</p>`;
  }

  const design = key === 'draft' ? tplDesignHtml(rec.template) : null;
  if (design) {
    const vals = rec.form.templateValues;
    const byName = Object.fromEntries(ncTemplateFieldDefs(rec).map(fd => [fd.name, fd]));
    return `<div class="tpl-doc-page">${design.replace(/\{([^{}<>]{1,60})\}/g, (m, name) => {
      // {Contract_Title} in a document fills the "Contract Title" field
      const key = name in byName ? name : name.replace(/_/g, ' ');
      const v = vals[key];
      return v ? String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;') : '';
    })}</div>`;
  }

  const f = rec.form;
  const t = f.templateValues;
  const vendor = f.vendors[f.selectedVendor] || { name: '-', price: '' };
  const value = Number(f.value || 0).toLocaleString();

  if (key === 'letter') {
    const type = rec.mode ? NC_MODES[rec.mode].requestType : 'New';
    const tick = t => (t === type || (t === 'Renew' && type === 'Renewal') || (t === 'Amendment' && type === 'Amendment')) ? '&#10003;' : '';
    const mv = rec.modeValues || {};
    const quotes = (f.singleSource ? f.vendors.slice(0, 1) : f.vendors).filter(v => v.name);
    const iso = d => d || '';
    return `
      <h2 class="rl-title">Request Letter for Contracts</h2>
      <table class="rl-table rl-types"><tr>
        <td class="rl-tick">${tick('New')}</td><td>New</td><td class="rl-tick">${tick('Renew')}</td><td>Renew</td>
        <td class="rl-tick">${tick('Amendment')}</td><td>Amendment</td><td class="rl-tick">${tick('Cancellation')}</td><td>Cancellation</td>
      </tr></table>
      <table class="rl-table">
        <tr><td>Date:&nbsp; ${new Date().toISOString().slice(0, 10)}</td><td>Branch: ${rec.branch}</td><td colspan="2">Department: ${rec.department}</td></tr>
        <tr><td colspan="4">Contract Internal Reference: ${rec.refNo}</td></tr>
        <tr><td colspan="4">Duration of the Contract: ${ncDurationText(mv.newEffective || f.startDate, mv.newEnd || f.endDate)}</td></tr>
        <tr><td colspan="4">Notice Period: ${f.notice} Month${f.notice > 1 ? 's' : ''}</td></tr>
        <tr><td colspan="2">Effective Date: ${iso(f.startDate)}</td><td colspan="2">End Date: ${iso(f.endDate)}</td></tr>
        <tr><td colspan="2">New Effective Date (if applicable): ${iso(mv.newEffective)}</td><td colspan="2">New End Date (if applicable): ${iso(mv.newEnd)}</td></tr>
        <tr><td colspan="2" rowspan="2">Total Value of the contract: ${Number(f.value || 0).toLocaleString()}</td>
          <td colspan="2" class="rl-inner"><table class="rl-table rl-nested"><tr>
            <td class="rl-tick">${f.budget === 'Budgeted' ? '&#10003;' : ''}</td><td>Budgeted</td><td class="rl-tick">${f.budget !== 'Budgeted' ? '&#10003;' : ''}</td><td>Not Budgeted</td></tr></table></td></tr>
        <tr><td colspan="2">If Budgeted, Enter Budget Code: ${f.budget === 'Budgeted' ? (f.budgetCode || '') : ''}</td></tr>
        <tr><td colspan="2" class="rl-inner"><table class="rl-table rl-nested"><tr><td class="rl-tick">${f.singleSource ? '&#10003;' : ''}</td><td>Single Source</td></tr></table></td>
          <td colspan="2" class="rl-inner"><table class="rl-table rl-nested"><tr><td class="rl-tick">${f.singleSource ? '' : '&#10003;'}</td><td>Competitive Bidding</td></tr></table></td></tr>
        <tr><td colspan="4" style="height: 34px; vertical-align: top;">If Single Source, Give Appropriate Justification: ${f.singleSource ? f.vendorJustification : ''}</td></tr>
        <tr><td colspan="4">If Competitive Bidding, fill the below:</td></tr>
        <tr><td colspan="4" class="rl-inner"><table class="rl-table rl-nested">
          <tr><td class="rl-sl">SL#</td><td style="text-align:center;">Vendor Name</td><td style="text-align:center;">Price (KWD)</td></tr>
          ${[0, 1, 2].map(i => { const q = quotes[i] || {}; return `<tr><td class="rl-sl">${i + 1}</td><td>${q.name || ''}</td><td>${q.price ? Number(q.price).toLocaleString() : ''}</td></tr>`; }).join('')}
        </table></td></tr>
        <tr><td>Recommended Vendor Name:</td><td colspan="3">${vendor.name || ''}</td></tr>
        <tr><td style="text-align:center;">Recommendation Justification</td><td colspan="3" style="height: 30px; vertical-align: top;">${f.recJustification || ''}</td></tr>
      </table>
      <div class="rl-sign">
        <div class="rl-line"></div>
        <div class="rl-sign-row"><span>Department Manager</span><span>Department Chief</span></div>
        <div class="rl-sign-row"><u>Renewals and Cancellation:</u><u>Legal Manager</u><u>Chief Finance Officer</u></div>
        <div class="rl-sign-row rl-center"><span>Chief Executive Officer</span></div>
      </div>`;
  }


  return `
    <div class="nc-letter-brand">INNOMICK TECHNOLOGIES</div>
    <h3 style="text-align:center; text-decoration: underline;">${rec.contractType} Contract${rec.template ? ` – ${rec.template.name}` : ''}</h3>
    <p><strong>Ref:</strong> ${rec.refNo} &nbsp; | &nbsp; <strong>Date:</strong> ${ncShortDate(t.currentDate)}</p>
    <p><strong>Innomick Technologies</strong>, a company registered under Commercial Registration No. <strong>${t.crNumber || '#####'}</strong>,
      located at ${t.draftBranch || rec.branch}, represented by <strong>${t.signatory || '#####'}</strong> in their capacity as the Authorized Signatory
      (hereinafter referred to as the "Company" or "First Party").</p>
    <p><strong>${vendor.name}</strong>, a company duly registered with its address as stated in its registration documents,
      represented by its Authorized Signatory (hereinafter referred to as the "Supplier" or "Second Party").</p>
    <h4>Preamble</h4>
    <p>The First Party wishes to obtain ${rec.contractType.toLowerCase()} services and the Second Party has expressed its willingness and capacity to provide them.
      Both parties have therefore agreed to conclude this contract under the following terms.</p>
    <h4>1. Scope</h4>
    <p>${f.description || 'Scope of work to be described here.'}</p>
    <h4>2. Contract Value</h4>
    <p>The total contract value is <strong>${value} KWD</strong>, payable as agreed between the parties.</p>
    <h4>3. Duration</h4>
    <p>This contract is valid from <strong>${ncShortDate(f.startDate)}</strong> until <strong>${ncShortDate(f.endDate)}</strong>.
      ${f.renewable === 'Yes' ? 'It may be renewed by mutual agreement.' : 'It is not renewable.'}
      ${f.extendable === 'Yes' ? 'It may be extended upon written request.' : ''}</p>
    <h4>4. Notice Period</h4>
    <p>Either party may terminate this contract with ${f.notice} month(s) written notice.</p>
    <table class="nc-doc-table" style="margin-top: 40px;">
      <tr><th style="width:50%;">First Party</th><th>Second Party</th></tr>
      <tr><td style="height: 60px;">${t.signatory || ''}<br>Innomick Technologies</td><td>${vendor.name}</td></tr>
    </table>`;
}

// Word Online style viewer: "<REF> Request Letter <stamp>.docx"
// A request's letter or draft opens in a pop-up over the page (Word in Review mode), like the live site,
// so Back never lands somewhere unexpected
function ncPreviewDoc(key) {
  document.querySelectorAll('.nc-view-menu.open').forEach(m => m.classList.remove('open'));
  const rec = NCState.current;
  const doc = rec.docs[key] || {};
  doc.stamp = doc.stamp || String(Date.now());
  const file = `${rec.refNo.replace(/\//g, '-')} ${key === 'letter' ? 'Request Letter' : 'Draft'} ${doc.stamp}`;
  document.getElementById('ncDocPreviewTitle').textContent = `${file}.docx`;
  document.getElementById('ncDocPreviewFile').textContent = file;
  const page = document.getElementById('ncDocPreviewPage');
  page.innerHTML = ncDocHtml(key);
  const words = (page.textContent.match(/\S+/g) || []).length;
  document.getElementById('ncDocPreviewWords').textContent = `Page 1 of ${Math.max(1, Math.ceil(words / 450))}   ${words} words   English (U.S.)   Text Predictions: Off   Editor Suggestions: Showing`;
  const avatar = document.querySelector('#ncDocPreviewModal .wv-avatar');
  if (avatar) avatar.textContent = InnomickCMSData.currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const note = document.getElementById('ncDocReviewNote');
  if (note) note.style.display = '';
  openModal('ncDocPreviewModal');
}

// "1 year 1 day", "3 months 2 days" ... as written on the live request letter
function ncDurationText(a, b) {
  if (!a || !b) return '';
  const s = new Date(a), e = new Date(b);
  let y = e.getFullYear() - s.getFullYear(), m = e.getMonth() - s.getMonth(), d = e.getDate() - s.getDate();
  if (d < 0) { m--; d += new Date(e.getFullYear(), e.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  const part = (n, w) => n ? `${n} ${w}${n > 1 ? 's' : ''}` : '';
  return [part(y, 'year'), part(m, 'month'), part(d, 'day')].filter(Boolean).join(' ') || '0 days';
}

// Downloads the document as a Word-compatible .doc so it opens in the desktop app
function ncDownloadDoc(key, desktop) {
  document.querySelectorAll('.nc-view-menu.open').forEach(m => m.classList.remove('open'));
  const rec = NCState.current;
  const html = `<html><head><meta charset="utf-8"><title>${rec.refNo}</title></head><body style="font-family: Calibri, Arial; font-size: 11pt;">${ncDocHtml(key)}</body></html>`;
  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${rec.refNo.replace(/\//g, '_')}_${key === 'letter' ? 'Request_Letter' : 'Contract_Draft'}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast(desktop ? 'Document downloaded - open it in Microsoft Word' : 'Document downloaded', 'success');
}

// ---------------------------------------------------------------------------
// Edit Draft Content (Word-style editor)
// ---------------------------------------------------------------------------
function ncOpenDocEditor(key) {
  NCState.editorDocKey = key;
  switchRoute('nc_doc_editor', NCState.current.id);
}

function ncLoadDocEditor() {
  if (!NCState.current || !NCState.editorDocKey) { switchRoute('requests'); return; }
  document.getElementById('ncWordPage').innerHTML = ncDocHtml(NCState.editorDocKey);
  document.getElementById('ncWordStatus').textContent = `Editing · ${NC_DOC_META[NCState.editorDocKey].title} · ${NCState.current.refNo}`;
}

function ncSaveDocEditor() {
  const rec = NCState.current;
  const doc = rec.docs[NCState.editorDocKey];
  doc.customHtml = document.getElementById('ncWordPage').innerHTML;
  const next = (parseFloat(doc.versions[0].version) + 0.1).toFixed(1);
  doc.versions.unshift({ version: next, by: InnomickCMSData.currentUser.name, on: ncFormatDateTime(new Date()), description: 'Draft Content Edited' });
  showToast(`Draft saved as version ${next}`, 'success');
  ncCloseDocEditor();
}

function ncCloseDocEditor() {
  switchRoute('nc_details', NCState.current.id);
  ncSwitchTab('primary');
}

// ---------------------------------------------------------------------------
// Approvals: Start Approval (letter) / Select Approvals (draft)
// ---------------------------------------------------------------------------
function ncOpenStartApproval(key) {
  NCState.approvalTarget = key;
  NCState.selectedWorkflow = { name: 'Default Approval', type: 'Sequential', steps: NC_DEFAULT_CHAIN };
  ncRenderApprovalChain(false);
  const toggle = document.getElementById('ncFinalApprovalToggle');
  toggle.checked = true;
  toggle.disabled = true;
  document.getElementById('ncStartApprovalBtn').textContent = 'Start Now';
  openModal('ncStartApprovalModal');
}

function ncRenderApprovalChain(withToggles) {
  const wf = NCState.selectedWorkflow;
  const due = new Date();
  due.setDate(due.getDate() + 2);
  const dueStr = due.toLocaleDateString('en-GB').replace(/\//g, '-');
  const isParallel = wf.type === 'Parallel';

  document.getElementById('ncStartApprovalTitle').innerHTML = withToggles
    ? `<a href="javascript:void(0)" onclick="ncBackToWorkflowList()" class="nc-back-link">&#8249;</a> View Approval`
    : 'View Approval';

  document.getElementById('ncStartApprovalBody').innerHTML = wf.steps.map((s, i) => `
    <div class="nc-chain-step">
      <div class="nc-chain-step-title">${s.title}</div>
      <div class="nc-chain-row"><span>Approver</span><div>${s.approver}</div></div>
      <div class="nc-chain-row"><span>Action</span><div>${s.action}</div></div>
      <div class="nc-chain-row"><span>Due Date</span><div>${i === 0 || isParallel ? dueStr : 'Will be set after previous approval'}</div></div>
    </div>
    ${i < wf.steps.length - 1 ? `<div class="nc-chain-arrow">${isParallel ? '+' : '&#8964;'}</div>` : ''}
  `).join('') + (withToggles ? `
    <div class="nc-toggle-row"><span>Trigger Mail to the Approver</span><input type="checkbox" class="nc-toggle" checked></div>
    <div class="nc-toggle-row"><span>User inside Organization</span><input type="checkbox" class="nc-toggle" checked disabled></div>
  ` : '');
}

function ncOpenSelectApproval(key) {
  NCState.approvalTarget = key;
  NCState.approvalMode = null;
  document.getElementById('ncSelectApprovalTitle').textContent = 'Select Approval';
  document.getElementById('ncSelectApprovalBody').innerHTML = `
    <div class="nc-wf-grid">
      ${['Sequential', 'Parallel'].map(mode => `
        <div class="nc-wf-card" onclick="ncPickApprovalMode('${mode}')">
          <span class="nc-wf-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M12 7.5v4M12 11.5l-6 5M12 11.5l6 5"/></svg></span>
          ${mode} Approval
        </div>`).join('')}
    </div>`;
  document.getElementById('ncSelectApprovalFooter').innerHTML =
    `<button class="btn-outline-teal" onclick="closeModal('ncSelectApprovalModal')">Cancel</button>`;
  openModal('ncSelectApprovalModal');
}

function ncPickApprovalMode(mode) {
  NCState.approvalMode = mode;
  NCState.selectedWorkflow = null;
  document.getElementById('ncSelectApprovalTitle').innerHTML =
    `<a href="javascript:void(0)" onclick="ncOpenSelectApproval(NCState.approvalTarget)" class="nc-back-link">&#8249;</a> Select ${mode} Approval`;
  document.getElementById('ncSelectApprovalBody').innerHTML = `
    <div class="nc-wf-grid nc-wf-grid-3">
      ${NC_WORKFLOWS[mode].map((wf, i) => `
        <div class="nc-wf-card" id="ncWfCard_${i}" onclick="ncPickWorkflow(${i})">
          <span class="nc-wf-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M12 7.5v4M12 11.5l-6 5M12 11.5l6 5"/></svg></span>
          ${wf.name}
        </div>`).join('')}
    </div>`;
  document.getElementById('ncSelectApprovalFooter').innerHTML =
    `<button class="btn-teal-primary" id="ncWfViewBtn" disabled onclick="ncViewWorkflow()">View</button>`;
}

function ncPickWorkflow(i) {
  NCState.selectedWorkflow = { ...NC_WORKFLOWS[NCState.approvalMode][i], type: NCState.approvalMode };
  document.querySelectorAll('.nc-wf-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(`ncWfCard_${i}`).classList.add('selected');
  document.getElementById('ncWfViewBtn').disabled = false;
}

function ncViewWorkflow() {
  closeModal('ncSelectApprovalModal');
  ncRenderApprovalChain(true);
  const toggle = document.getElementById('ncFinalApprovalToggle');
  toggle.checked = false;
  toggle.disabled = false;
  document.getElementById('ncStartApprovalBtn').textContent = 'Start Approval';
  openModal('ncStartApprovalModal');
}

function ncBackToWorkflowList() {
  closeModal('ncStartApprovalModal');
  openModal('ncSelectApprovalModal');
}

function ncConfirmStartApproval() {
  const rec = NCState.current;
  const key = NCState.approvalTarget;
  const wf = NCState.selectedWorkflow;
  const doc = rec.docs[key];
  if (!doc) return;

  doc.status = 'In Approval';
  doc.workflow = wf;
  doc.finalApproval = document.getElementById('ncFinalApprovalToggle').checked;
  rec.status = 'In Approval';

  const now = ncFormatDateTime(new Date());
  const cycleId = `CY-${Date.now()}`;
  rec.history.unshift({
    id: cycleId, doc: NC_DOC_META[key].title, workflow: `${wf.name} (${wf.type})`, on: now, version: (doc.versions[0] || {}).version || '1.0',
    steps: wf.steps.map((s, i) => ({ ...s, state: i === 0 || wf.type === 'Parallel' ? 'Pending' : 'Waiting', assignedOn: i === 0 || wf.type === 'Parallel' ? now : '' }))
  });

  const row = InnomickCMSData.requests.find(r => r.id === rec.id);
  if (row) row.status = 'In Approval';

  InnomickCMSData.approvals.outbox = InnomickCMSData.approvals.outbox.filter(o => o.id !== `OUT-${rec.id}-${key}`);
  InnomickCMSData.approvals.outbox.unshift({
    id: `OUT-${rec.id}-${key}`,
    requestedBy: InnomickCMSData.currentUser.name,
    contractCode: rec.refNo,
    title: `${rec.form.name} · ${key === 'letter' ? 'Request Letter' : 'Contract Draft'}`,
    vendor: (rec.form.vendors[rec.form.selectedVendor] || {}).name || '',
    approver: wf.steps.map(s => s.approver).join(wf.type === 'Parallel' ? ' + ' : ' → '),
    amount: `${Number(rec.form.value).toLocaleString()} KWD`,
    submittedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: wf.type === 'Parallel' ? `${wf.steps.length} Approvals Pending` : wf.steps[0].title,
    ncRequestId: rec.id,
    ncDoc: key,
    cycleId,
    approvalType: wf.type,
    totalSteps: wf.steps.length,
    requestedOn: new Date().toISOString().slice(0, 10)
  });

  doc.cycle = { id: cycleId, name: wf.name, steps: wf.steps.map(s => ({ ...s, state: 'Pending', assignedOn: now })), done: 0, type: wf.type, started: new Date().toISOString() };
  if (wf.type === 'Sequential') doc.cycle.steps.forEach((st, i) => { if (i > 0) { st.state = 'Waiting'; st.assignedOn = ''; } });
  const inboxId = `NCAPP-${rec.id}-${key}`;
  InnomickCMSData.approvals.inbox = InnomickCMSData.approvals.inbox.filter(i => i.id !== inboxId);
  InnomickCMSData.approvals.inbox.unshift({
    id: inboxId, ncRequestId: rec.id, ncDoc: key,
    name: `${rec.refNo.replace(/\//g, '-')} ${key === 'letter' ? 'Request Letter' : 'Draft'}.docx`,
    approvalType: wf.type,
    status: wf.type === 'Parallel' ? `${wf.steps.length} Approvals Pending` : wf.steps[0].title,
    approvedCount: 0, totalCount: wf.steps.length,
    requestedBy: InnomickCMSData.currentUser.name,
    requestedOn: new Date().toISOString().slice(0, 10)
  });

  closeModal('ncStartApprovalModal');
  ncOpenDetails(rec.id);
  ncSwitchTab('primary');
  ncShowInfo('Successfully submitted !', true);
}

// ---------------------------------------------------------------------------
// Supporting documents, history and comments
// ---------------------------------------------------------------------------
function ncAddSupportingFiles(fileList) {
  const rec = NCState.current;
  [...fileList].forEach(file => {
    if (file.size > 50 * 1024 * 1024) {
      showToast(`${file.name} exceeds the 50MB limit`, 'info');
      return;
    }
    rec.supporting.push({
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
      by: InnomickCMSData.currentUser.name,
      on: ncFormatDateTime(new Date())
    });
  });
  ncRenderSupporting();
  showToast('Supporting document uploaded', 'success');
}

function ncRemoveSupporting(i) {
  const rec = NCState.current;
  const [removed] = rec.supporting.splice(i, 1);
  if (removed) URL.revokeObjectURL(removed.url);
  ncRenderSupporting();
}

function ncRenderSupporting() {
  const rec = NCState.current;
  const list = document.getElementById('ncSupportingList');
  if (!list || !rec) return;
  const fmtSize = b => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
  list.innerHTML = rec.supporting.length ? `
    <table class="cms-table" style="margin-top: 16px;">
      <thead><tr><th>File Name</th><th>Size</th><th>Uploaded By</th><th>Uploaded On</th><th style="text-align:right;">Actions</th></tr></thead>
      <tbody>
        ${rec.supporting.map((s, i) => `
          <tr>
            <td style="font-weight: 600;">${s.name}</td>
            <td>${fmtSize(s.size)}</td>
            <td>${s.by}</td>
            <td>${s.on}</td>
            <td style="text-align:right; white-space: nowrap;">
              <a class="btn-outline-teal nc-doc-btn" href="${s.url}" target="_blank" rel="noopener">View</a>
              <button class="btn-outline-teal nc-doc-btn" onclick="ncRemoveSupporting(${i})">Remove</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>` : '';

  const zone = document.getElementById('ncDropZone');
  if (zone && !zone.dataset.bound) {
    zone.dataset.bound = '1';
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragging'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('dragging');
      ncAddSupportingFiles(e.dataTransfer.files);
    });
  }
}

function ncRenderHistory() {
  const rec = NCState.current;
  const wrap = document.getElementById('ncHistoryList');
  if (!wrap || !rec) return;
  // Once documents exist, history is split per document like the live page
  const which = NCState.historyDoc || 'draft';
  const tabs = rec.submitted ? `
    <div class="nc-history-tabs">
      <button class="${which === 'letter' ? 'active' : ''}" onclick="NCState.historyDoc = 'letter'; ncRenderHistory()">Request Letter History</button>
      <button class="${which === 'draft' ? 'active' : ''}" onclick="NCState.historyDoc = 'draft'; ncRenderHistory()">Contract Draft History</button>
    </div>` : '';
  const items = rec.submitted ? rec.history.filter(h => h.doc === NC_DOC_META[which].title) : rec.history;
  if (!items.length) {
    wrap.innerHTML = tabs + '<div class="nc-history-empty">No history found</div>';
    return;
  }
  wrap.innerHTML = tabs + items.map(h => `
    <div class="nc-history-card">
      <div class="nc-history-head">
        <strong>${h.doc}</strong>
        <span>${h.workflow} · Started ${h.on}</span>
      </div>
      ${h.steps.map(s => `
        <div class="nc-history-step">
          <span class="nc-history-dot ${s.state === 'Pending' ? 'pending' : ''}"></span>
          <div><div style="font-weight: 600;">${s.title}</div><div style="color:#64748b; font-size: 12px;">${s.approver} · ${s.action}</div></div>
          <span class="nc-history-state">${s.state}</span>
        </div>`).join('')}
    </div>`).join('');
}

function ncRenderApproverComments() {
  const rec = NCState.current;
  const el = document.getElementById('ncApproverComments');
  if (!el) return;
  if (rec.comments && rec.comments.length) {
    el.innerHTML = rec.comments.map(c => `<div class="nc-comment"><strong>${c.by}</strong><div>${c.text}</div><small>${c.on}</small></div>`).join('');
    return;
  }
  el.innerHTML = rec.status === 'In Approval'
    ? 'Waiting for approvers. Comments will appear here once an approver reviews the document.'
    : 'This section becomes available once the contract is submitted for approval. Approver comments will appear here during review.';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function ncFormatDateTime(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
}

function ncShortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function ncMonthsBetween(a, b) {
  if (!a || !b) return '';
  const s = new Date(a), e = new Date(b);
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (months >= 12 && months % 12 === 0) return `${months / 12} Year${months > 12 ? 's' : ''}`;
  return `${Math.max(months, 0)} Month${months === 1 ? '' : 's'}`;
}


// ---------------------------------------------------------------------------
// Approver side: review an approval from the Inbox (Approve / Request Change / Reject)
// ---------------------------------------------------------------------------
function ncOpenApproverReview(inboxId) {
  const item = InnomickCMSData.approvals.inbox.find(i => i.id === inboxId);
  if (!item) return;
  const rec = NCState.records[item.ncRequestId];
  NCState.current = rec;
  NCState.reviewing = item;
  const doc = rec.docs[item.ncDoc];
  const step = cmsMyStep(doc.cycle.steps);
  const f = rec.form;
  const vendor = (f.vendors[f.selectedVendor] || {}).name || '';
  const row = (l, v) => `<div class="nc-chain-row"><span>${l}</span><div>${v || '—'}</div></div>`;

  document.getElementById('ncApproverBody').innerHTML = `
    <div class="nc-chain-step">
      <div class="nc-chain-step-title">${item.name}</div>
      ${row('Owner', ncRequester(rec))}
      ${row('Contract ID', rec.refNo)}
      ${row('Contract Name', f.name)}
      ${row('Contract Type', rec.contractType)}
      ${row('Vendor', vendor)}
      ${row('Value', `${Number(f.value || 0).toLocaleString()} KWD`)}
      ${row('Start / End', `${ncShortDate(f.startDate)} – ${ncShortDate(f.endDate)}`)}
      ${row('Current Step', step ? `${step.title} · ${step.approver}` : 'Completed')}
    </div>
    <button class="btn-outline-teal nc-doc-btn" style="margin: 12px 0;" onclick="ncPreviewDoc('${item.ncDoc}')">Preview Document</button>
    <label class="detail-field-label" style="display:block; margin-bottom: 6px;">Comments</label>
    <textarea class="cms-input" id="ncApproverComment" rows="3" style="width: 100%;" placeholder="Add your comment..."></textarea>`;
  openModal('ncApproverModal');
}

function ncApproverAction(action) {
  const item = NCState.reviewing;
  const rec = NCState.records[item.ncRequestId];
  const doc = rec.docs[item.ncDoc];
  const comment = document.getElementById('ncApproverComment').value.trim();
  const cycle = doc.cycle;
  const step = cmsMyStep(cycle.steps);
  if (!step) return;
  if (action !== 'Approve' && !comment) {
    showToast('Please add a comment', 'info');
    return;
  }
  const now = ncFormatDateTime(new Date());
  rec.comments = rec.comments || [];
  // Decision remarks stay on the approval step; only Add Comment entries appear under Approver Comments (UAT)

  const hist = rec.history.find(h => h.id === cycle.id);
  const histStep = st => hist && hist.steps.find(x => x.title === st.title && x.approver === st.approver);
  const setState = (st, state) => { st.state = state; const h = histStep(st); if (h) { h.state = state; h.actedOn = st.actedOn; h.remarks = st.remarks; h.assignedOn = st.assignedOn || h.assignedOn; } };

  step.actedOn = now;
  step.remarks = comment && comment !== '-' ? comment : '';
  if (action === 'Approve') {
    setState(step, 'Approved');
    cycle.done++;
    const next = cycle.steps.find(s => s.state === 'Waiting' || s.state === 'Pending');
    if (next && next.state === 'Waiting') { next.assignedOn = now; setState(next, 'Pending'); }
    if (!cycle.steps.some(s => s.state === 'Pending')) {
      doc.status = 'Approved';
      doc.approvedOn = now;
      if (doc.finalApproval) doc.finalApproved = true;
    }
  } else {
    setState(step, action === 'Reject' ? 'Rejected' : 'Request for Change');
    cycle.steps.filter(s => s.state === 'Waiting' || s.state === 'Pending').forEach(s => setState(s, 'Cancelled'));
    doc.status = action === 'Reject' ? 'Rejected' : 'Request for Change';
  }

  // Inbox: keep only open steps; the decision moves to Inbox History
  const finished = doc.status !== 'In Approval';
  const inboxItem = InnomickCMSData.approvals.inbox.find(i => i.id === item.id);
  if (inboxItem) {
    inboxItem.approvedCount = cycle.done;
    const pend = cycle.steps.filter(s => s.state === 'Pending');
    inboxItem.status = cycle.type === 'Parallel' ? `${pend.length} Approvals Pending` : (pend[0] || {}).title;
  }
  if (finished) InnomickCMSData.approvals.inbox = InnomickCMSData.approvals.inbox.filter(i => i.id !== item.id);
  const ah = InnomickCMSData.approvals;
  ah.inboxHistory = ah.inboxHistory || [];
  ah.inboxHistory.unshift({
    id: item.id, ncRequestId: rec.id, ncDoc: item.ncDoc, name: item.name, approvalType: cycle.type,
    status: action === 'Approve' ? 'Approved' : doc.status, step: step.title, approver: step.approver,
    progress: `Step ${cycle.steps.indexOf(step) + 1} of ${cycle.steps.length}`, progressPct: Math.round((cycle.done / cycle.steps.length) * 100),
    requestedBy: item.requestedBy || ncRequester(rec), requestedOn: item.requestedOn, actedOn: now, actedBy: InnomickCMSData.currentUser.name
  });
  const out = ah.outbox.find(o => o.id === `OUT-${rec.id}-${item.ncDoc}`);
  if (out) {
    out.status = finished ? doc.status : (inboxItem ? inboxItem.status : out.status);
    out.approvedCount = cycle.done;
    if (finished) {
      ah.outbox = ah.outbox.filter(o => o !== out);
      ah.outboxHistory = ah.outboxHistory || [];
      ah.outboxHistory.unshift({ ...out, completedOn: now });
    }
  }

  ncUpdateRequestStatus(rec);
  closeModal('ncApproverModal');
  renderApprovals();
}

// The request is Approved only when every generated document has its final approval
function ncUpdateRequestStatus(rec) {
  const docs = ncDocKeys(rec).map(k => rec.docs[k]).filter(Boolean);
  const allFinal = docs.length === ncDocKeys(rec).length && docs.every(d => d.finalApproved);
  const reqRow = InnomickCMSData.requests.find(r => r.id === rec.id);
  if (allFinal) {
    if (rec.status !== 'Approved') ncActivateContract(rec);
    return;
  }
  const anyOpen = docs.some(d => d.status === 'In Approval');
  const anyChange = docs.some(d => d.status === 'Request for Change');
  const anyReject = docs.some(d => d.status === 'Rejected');
  // UAT keeps the request "In Approval" once any document has been sent for approval; a rejection ends it
  const started = docs.some(d => d.cycle);
  rec.status = anyReject ? 'Rejected' : anyOpen || started ? 'In Approval' : anyChange ? 'Request for Change' : 'Draft';
  if (reqRow) reqRow.status = rec.status;
}

// Extension / Completion: no documents or approvals in the live system - applied on submit
function ncSubmitDirect(rec) {
  const f = rec.form;
  const mv = rec.modeValues || {};
  const c = rec.sourceContract;
  rec.submitted = true;
  rec.status = 'Completed';
  if (c) {
    const live = InnomickCMSData.contracts.find(x => x.id === c.id) || c;
    const [start] = ncParseRange(live.durationDates);
    if (rec.mode === 'extension') {
      live.durationDates = `${ncShortDate(start || f.startDate)} - ${ncShortDate(mv.newEnd)}`;
      live.durationMonths = ncMonthsBetween(start || f.startDate, mv.newEnd);
      live.periods = [{ type: 'Extension', start: f.endDate, end: mv.newEnd }].concat(live.periods || [{ type: 'New', start: start || f.startDate, end: f.endDate }]);
      live.status = 'Active';
    } else {
      live.status = 'Archived';
      live.periods = [{ type: 'Completion', start: start || f.startDate, end: mv.completionDate }].concat(live.periods || [{ type: 'New', start: start || f.startDate, end: f.endDate }]);
      live.durationDates = `${ncShortDate(start || f.startDate)} - ${ncShortDate(mv.completionDate)}`;
    }
  }
  const row = InnomickCMSData.requests.find(r => r.id === rec.id);
  if (row) row.status = 'Completed';
  NCState.afterInfo = () => switchRoute('requests');
  ncShowInfo(`Contract ${rec.mode === 'extension' ? 'Extension' : 'Completion'} Submitted Successfully!`, true);
}

// Final approval of the contract draft: the request becomes a live contract
function ncActivateContract(rec) {
  const f = rec.form;
  const mv = rec.modeValues || {};
  const start = mv.newEffective || f.startDate;
  const end = mv.newEnd || mv.completionDate || f.endDate;
  const closing = rec.mode === 'cancel' || rec.mode === 'completion';
  rec.status = 'Approved';
  const reqRow = InnomickCMSData.requests.find(r => r.id === rec.id);
  if (reqRow) { reqRow.status = 'Approved'; reqRow.isPendingActivation = !closing; }
  const vendor = (f.vendors[f.selectedVendor] || {}).name || '';
  const existing = rec.sourceContract;
  const contract = {
    id: existing ? existing.id : `CNT-${rec.id}`,
    refNo: rec.refNo, code: rec.refNo, contractName: f.name, name: f.name, hasIcon: false,
    status: closing ? 'Archived' : 'Approved',
    vendorName: vendor, vendor, department: rec.department, branch: rec.branch,
    durationMonths: ncMonthsBetween(start, end), durationDates: `${ncShortDate(start)} - ${ncShortDate(end)}`, durationProgress: 0,
    contractValue: Number(f.value || 0).toLocaleString(), value: Number(f.value || 0), currency: 'KWD',
    category: rec.contractType, type: `${rec.contractType} Agreement`, owner: ncRequester(rec),
    description: f.description, renewable: f.renewable, extendable: f.extendable, autoRenewal: f.autoRenewal,
    budgetStatus: f.budget === 'Budgeted' ? 'Yes' : 'No', budgetCode: f.budgetCode,
    periods: [{ type: rec.mode ? NC_MODES[rec.mode].requestType : 'New', start, end, label: rec.mode === 'amend' ? mv.addendumNo : '' }].concat(existing && existing.periods ? existing.periods : [])
  };
  InnomickCMSData.contracts = InnomickCMSData.contracts.filter(c => c.id !== contract.id);
  InnomickCMSData.contracts.unshift(contract);
}


// The person who raised the request stays the owner after switching to an approver's account
function ncRequester(rec) {
  const row = rec && InnomickCMSData.requests.find(r => r.id === rec.id);
  return (row && row.submittedBy) || InnomickCMSData.currentUser.name;
}

// Info popup: plain message (auto-closes after submit) or a confirmation with tick and Close
function ncShowInfo(message, confirm) {
  document.getElementById('ncInfoMessage').innerHTML = confirm
    ? `<span>${message}</span><span class="nc-info-tick">&#10003;</span>` : message;
  document.getElementById('ncInfoMessage').classList.toggle('nc-info-confirm', !!confirm);
  document.getElementById('ncInfoFooter').style.display = confirm ? 'flex' : 'none';
  openModal('ncInfoModal');
}

// Approval chain shown inside the document card while a cycle runs
function ncApprovalChainHtml(doc) {
  const c = doc.cycle;
  const due = new Date(c.started);
  due.setDate(due.getDate() + 2);
  const dueStr = due.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const nodes = [{ title: 'Submitted by', person: ncRequester(NCState.current), note: ncFormatDateTime(new Date(c.started)), done: true }]
    .concat(c.steps.map((st, i) => ({ title: st.title, person: st.approver, note: st.state === 'Pending' ? `Due: ${dueStr}` : st.state === 'Waiting' ? 'After prev. approval' : st.actedOn ? `Updated: ${st.actedOn}` : st.state,
      done: st.state === 'Approved', n: i + 1, bad: /Reject/.test(st.state), change: /Change/.test(st.state) })));
  return `
    <div class="nc-chain-inline">
      <div class="nc-chain-inline-label">APPROVAL CHAIN</div>
      <div class="nc-chain-inline-track">
        ${nodes.map((n, i) => `
          <div class="nc-chain-inline-node">
            <span class="nc-chain-inline-dot ${n.done ? 'done' : ''} ${n.bad ? 'bad' : ''} ${n.change ? 'change' : ''}">${n.done ? '&#10003;' : n.change ? '&#8635;' : n.bad ? '&#10005;' : n.n}</span>
            <div class="nc-chain-inline-title">${n.title}</div>
            <div class="nc-chain-inline-sub">${n.person}</div>
            <div class="nc-chain-inline-sub">${n.note}</div>
          </div>${i < nodes.length - 1 ? '<div class="nc-chain-inline-line"></div>' : ''}`).join('')}
      </div>
    </div>`;
}

function ncViewCertificate(key) {
  const rec = NCState.current;
  const f = rec.form;
  currentReviewItem = {
    contractCode: rec.refNo, name: f.name, type: rec.contractType,
    vendor: (f.vendors[f.selectedVendor] || {}).name || '', amount: `${Number(f.value || 0).toLocaleString()} KWD`,
    department: rec.department, requestType: rec.mode ? NC_MODES[rec.mode].requestType : 'New'
  };
  openApprovalCertificateModal();
}
