/**
 * Innomick Technologies - CMS Prototype
 * Manual Contract Import: Branch / Department modal, then the Contract Import Builder
 * where the initial contract and any later versions (Renewal, Amendment, Cancellation,
 * Extension, Completion) are entered with their documents and imported in one go.
 */

// "Revision details" of a later version, in the live order
const IMP_REVISION = [
  { key: 'actualStart', label: 'Actual Start Date', type: 'date', required: true },
  { key: 'actualEnd', label: 'Actual End Date', type: 'date', required: true },
  { key: 'effective', label: 'New Effective Date', type: 'date' },
  { key: 'newEnd', label: 'New End Date', type: 'date' },
  { key: 'value', label: 'Contract Value', type: 'number', required: true, placeholder: 'Enter contract value' },
  { key: 'notice', label: 'Notice Period (Months)', type: 'number', required: true }
];
const IMP_ALL_DOCS = ['signedLetter', 'signedContract', 'letter', 'draft'];
const IMP_VERSION_TYPES = {
  New: { title: 'Initial Contract Details', color: 'new', docs: IMP_ALL_DOCS },
  Renewal: { title: 'Renewal Details', color: 'renewal', fields: IMP_REVISION, docs: ['signedLetter', 'letter'] },
  Amendment: { title: 'Amendment Details', color: 'amendment', full: true, docs: IMP_ALL_DOCS },
  Cancellation: { title: 'Cancellation Details', color: 'cancellation', fields: IMP_REVISION.filter(f => !['effective', 'newEnd'].includes(f.key)), docs: ['signedLetter', 'letter'] },
  Extension: { title: 'Extension Details', color: 'extension', fields: IMP_REVISION, docs: ['signedLetter', 'signedContract'] },
  Completion: { title: 'Completion Details', color: 'completion', fields: IMP_REVISION, docs: ['signedLetter', 'signedContract'] }
};

// Fields of the initial contract section, in the live order
const IMP_INITIAL_FIELDS = [
  { key: 'ref', label: 'Contract Reference ID', type: 'text', required: true, placeholder: 'Enter contract reference ID' },
  { key: 'name', label: 'Contract Name', type: 'text', required: true, placeholder: 'Enter contract name' },
  { key: 'type', label: 'Contract Type', type: 'select', required: true, options: ['Service', 'Purchase', 'Construction'] },
  { key: 'value', label: 'Contract Value', type: 'number', required: true, placeholder: 'Enter contract value' },
  { key: 'actualStart', label: 'Actual Start Date', type: 'date', required: true },
  { key: 'actualEnd', label: 'Actual End Date', type: 'date', required: true },
  { key: 'start', label: 'Start Date', type: 'date' },
  { key: 'end', label: 'End Date', type: 'date' },
  { key: 'notice', label: 'Notice Period (Months)', type: 'number', required: true, value: '1' }
];

const ImpState = {
  branch: '',
  department: '',
  versions: [],   // [{ type, values: {}, open: true, docs: {} }]
  vendors: [{ name: '', price: '' }, { name: '', price: '' }, { name: '', price: '' }],
  selectedVendor: null
};

function impOpenManualModal() {
  const branchSel = document.getElementById('impBranchSelect');
  const deptSel = document.getElementById('impDeptSelect');
  branchSel.innerHTML = InnomickCMSData.branches.map(b => `<option>${b}</option>`).join('');
  const depts = [...new Set(InnomickCMSData.departments.concat(['Facilities Management']))];
  deptSel.innerHTML = '<option value="">Select Department</option>' + depts.map(d => `<option>${d}</option>`).join('');
  openModal('impManualModal');
}

function impContinue() {
  const dept = document.getElementById('impDeptSelect').value;
  if (!dept) {
    showToast('Please select a Department', 'info');
    return;
  }
  ImpState.branch = document.getElementById('impBranchSelect').value;
  ImpState.department = dept;
  ImpState.versions = [{ type: 'New', values: { notice: '1', budget: 'Budgeted', renewable: 'No', extendable: 'No', singleSource: false }, open: true, docs: {} }];
  ImpState.vendors = [{ name: '', price: '' }, { name: '', price: '' }, { name: '', price: '' }];
  ImpState.selectedVendor = null;
  ImpState.notice = '';
  closeModal('impManualModal');
  switchRoute('import_builder');
}

function impField(vi, f, val) {
  const id = `imp_${vi}_${f.key}`;
  const req = f.required ? ' <span class="imp-req">*</span>' : '';
  let input;
  if (f.type === 'select') {
    input = `<select class="cms-select" id="${id}" ${f.locked ? 'disabled' : ''} onchange="impSet(${vi}, '${f.key}', this.value)">
      <option value="">Select ${f.label}</option>${f.options.map(o => `<option ${o === val ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  } else if (f.type === 'textarea') {
    input = `<textarea class="cms-input" id="${id}" rows="3" placeholder="Type here..." oninput="impSet(${vi}, '${f.key}', this.value)">${val || ''}</textarea>`;
  } else {
    const isRef = f.key === 'ref';
    const taken = isRef && !f.locked && impRefTaken(val);
    input = `<input class="cms-input ${taken ? 'nc-invalid' : ''}" type="${f.type}" id="${id}" value="${val || ''}" placeholder="${f.placeholder || ''}" ${f.locked ? 'disabled' : ''} oninput="impSet(${vi}, '${f.key}', this.value)" ${isRef && !f.locked ? 'onblur="impCheckRef()"' : ''}>
      ${isRef && !f.locked ? `<div class="imp-field-error" id="impRefError" ${taken ? '' : 'style="display: none;"'}>This Contract Reference ID already exists in the system.</div>` : ''}`;
  }
  return `<div class="imp-field ${f.type === 'textarea' ? 'imp-field-wide' : ''}"><label for="${id}">${f.label.toUpperCase()}${req}</label>${input}</div>`;
}

// Whole reference, ignoring case and outer spaces, as UAT
function impRefTaken(ref) {
  const norm = v => String(v || '').trim().toLowerCase();
  const wanted = norm(ref);
  if (!wanted) return false;
  const { contracts, requests } = InnomickCMSData;
  return contracts.some(c => norm(c.code) === wanted || norm(c.refNo) === wanted) || requests.some(r => norm(r.refNo) === wanted);
}

// Checked on leaving the field; no re-render, so the next click is not lost
function impCheckRef() {
  const input = document.getElementById('imp_0_ref');
  const taken = impRefTaken(input.value);
  input.classList.toggle('nc-invalid', taken);
  document.getElementById('impRefError').style.display = taken ? '' : 'none';
}

function impDocSlot(vi, key, title, hint) {
  const file = ImpState.versions[vi].docs[key];
  return `
    <div class="imp-doc-slot">
      <div class="imp-doc-title">${title}</div>
      <div class="imp-doc-hint">${hint}</div>
      <label class="imp-doc-drop">
        ${file ? `<span>&#128196; ${file}</span>` : '<span>&#8679;</span><span>Click to browse</span><span class="imp-doc-sub">Supports: Docx, Pdf (Max 50MB)</span>'}
        <input type="file" accept=".doc,.docx,.pdf" style="display: none;" onchange="impSetDoc(${vi}, '${key}', this.files[0])">
      </label>
    </div>`;
}

function impRenderBuilder() {
  const root = document.getElementById('impBuilderRoot');
  if (!root) return;
  if (!ImpState.department) { switchRoute('import'); return; }

  root.innerHTML = `
    <div class="imp-head">
      <div class="imp-title">Contract Import Builder</div>
      <div class="imp-sub"><span>BRANCH</span> ${ImpState.branch} &nbsp; <span>DEPARTMENT</span> ${ImpState.department}</div>
    </div>

    ${ImpState.versions.map((v, vi) => {
      const cfg = IMP_VERSION_TYPES[v.type];
      return `
        <div class="imp-version ${v.open ? 'open' : ''}">
          <div class="imp-version-head" onclick="impToggle(${vi})">
            ${vi === 0 ? `<strong>${cfg.title}</strong>` : ''} &middot; <span class="nc-period-tag ${cfg.color}">${v.type.toUpperCase()}</span>
            ${vi > 0 ? `<button class="imp-remove" onclick="event.stopPropagation(); impRemoveVersion(${vi})">Remove</button>` : ''}
            <span class="imp-caret">&#8964;</span>
          </div>
          <div class="imp-version-body">
            ${vi === 0 || cfg.full ? impFullForm(vi) : impRevisionForm(vi)}
            ${impVersionDocs(vi)}
          </div>
        </div>`;
    }).join('')}

    <div class="imp-add-row">
      ${['Renewal', 'Amendment', 'Cancellation', 'Extension', 'Completion'].map(t =>
        `<button class="imp-add-btn ${IMP_VERSION_TYPES[t].color}" onclick="impAddVersion('${t}')">+ Add ${t}</button>`).join('')}
    </div>

    <div class="imp-actions">
      <button class="btn-outline-teal" onclick="switchRoute('import')">Cancel</button>
      <button class="btn-teal-primary" onclick="impImport()">&#8679; Import Contract</button>
    </div>
    ${ImpState.notice ? `<div class="imp-notice">${ImpState.notice}</div>` : ''}`;
}

const impVendors = vi => vi ? ImpState.versions[vi].values.vendors : ImpState.vendors;
const impPicked = vi => vi ? ImpState.versions[vi].values.selectedVendor : ImpState.selectedVendor;

function impPickVendor(vi, i) {
  if (vi) ImpState.versions[vi].values.selectedVendor = i;
  else ImpState.selectedVendor = i;
  impRenderBuilder();
}

// The initial contract, and an Amendment with the inherited fields locked
function impFullForm(vi) {
  const vals = ImpState.versions[vi].values;
  const base = ImpState.versions[0].values;
  const inherited = f => ['ref', 'name', 'type', 'start', 'end'].includes(f.key);
  const fields = vi === 0 ? IMP_INITIAL_FIELDS : IMP_INITIAL_FIELDS.flatMap(f => f.key !== 'notice'
    ? [{ ...f, locked: inherited(f) }]
    : [{ key: 'addendum', label: 'Addendum Number', type: 'text', required: true, placeholder: 'e.g. ADDENDUM1' }, IMP_REVISION[2], IMP_REVISION[3], f]);
  const value = f => f.locked ? base[f.key] : vals[f.key];
  const vendors = impVendors(vi);
  const shown = vals.singleSource ? vendors.slice(0, 1) : vendors;
  const picked = impPicked(vi);
  return `
    <div class="imp-section-label">CONTRACT INFORMATION</div>
    <div class="imp-grid">
      ${fields.map(f => impField(vi, f, value(f))).join('')}
      ${impField(vi, { key: 'description', label: 'Description', type: 'textarea' }, vals.description)}
    </div>
    <div class="imp-grid">
      <div class="imp-field"><label>BUDGET STATUS</label>
        <div class="nc-radio-group">
          ${['Budgeted', 'Non-Budgeted'].map(o => `<label><input type="radio" name="impBudget${vi}" ${vals.budget === o ? 'checked' : ''} onchange="impSet(${vi}, 'budget', '${o}'); impRenderBuilder()"> ${o}</label>`).join('')}
        </div>
      </div>
      ${vals.budget === 'Budgeted' ? impField(vi, { key: 'budgetCode', label: 'Budget Code', type: 'text', required: true, placeholder: 'Enter budget code' }, vals.budgetCode) : '<div></div>'}
      ${['renewable', 'extendable'].map(k => `
        <div class="imp-field"><label>${k.toUpperCase()}</label>
          <div class="nc-radio-group">
            ${['Yes', 'No'].map(o => `<label><input type="radio" name="imp_${k}${vi}" ${vals[k] === o ? 'checked' : ''} onchange="impSet(${vi}, '${k}', '${o}')"> ${o}</label>`).join('')}
          </div>
        </div>`).join('')}
    </div>
    <div class="imp-field"><label>COMPETITIVE BIDDING</label>
      <div class="nc-radio-group"><label><input type="checkbox" ${vals.singleSource ? 'checked' : ''} onchange="impSet(${vi}, 'singleSource', this.checked); impRenderBuilder()"> Single Source</label></div>
    </div>
    <table class="cms-table" style="margin-top: 8px;">
      <thead><tr><th style="width: 90px;">SERIAL NUMBER</th><th>VENDOR NAME</th><th style="width: 140px;">PRICE (KWD)</th><th style="width: 90px;">SELECT VENDOR</th></tr></thead>
      <tbody>
        ${shown.map((vd, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><input class="nc-inline-input" id="imp_vendor_${vi}_${i}" placeholder="Enter Vendor" value="${vd.name}" oninput="impVendors(${vi})[${i}].name = this.value"></td>
            <td><input class="nc-inline-input" type="number" id="imp_price_${vi}_${i}" placeholder="Price" value="${vd.price}" oninput="impVendors(${vi})[${i}].price = this.value"></td>
            <td style="text-align: center;"><input type="radio" name="impVendorPick${vi}" ${picked === i ? 'checked' : ''} onchange="impPickVendor(${vi}, ${i})" style="accent-color: #008272;"></td>
          </tr>`).join('')}
      </tbody>
    </table>
    <div style="font-size: 11px; color: #64748b; margin: 6px 0 12px;">* Vendor details are mandatory.</div>
    <div class="imp-field"><label>FINAL RECOMMENDED VENDOR <span class="imp-req">*</span></label>
      <div class="nc-recommended-value">${picked !== null && picked !== undefined ? (vendors[picked].name || '—') : '—'}</div>
    </div>
    ${impField(vi, { key: 'recJustification', label: 'Recommendation Justification', type: 'textarea', required: true }, vals.recJustification)}`;
}

// Renewal, Cancellation, Extension and Completion: read-only summary, then the revision details
function impRevisionForm(vi) {
  const v = ImpState.versions[vi];
  const base = ImpState.versions[0].values;
  const vendor = (ImpState.vendors[ImpState.selectedVendor] || {}).name;
  return `
    <div class="imp-summary">
      ${[['REFERENCE ID', base.ref], ['CONTRACT NAME', base.name], ['TYPE', base.type], ['VENDOR NAME', vendor]].map(([l, x]) => `<div><label>${l}</label><b>${x || '—'}</b></div>`).join('')}
    </div>
    <div class="imp-section-label">REVISION DETAILS</div>
    <div class="imp-grid">${IMP_VERSION_TYPES[v.type].fields.map(f => impField(vi, f, v.values[f.key])).join('')}</div>`;
}

function impVersionDocs(vi) {
  const v = ImpState.versions[vi];
  const prefix = vi ? `${v.type} ` : '';
  const slots = keys => keys.filter(k => IMP_VERSION_TYPES[v.type].docs.includes(k));
  const hint = { signedLetter: 'Optional — signed Contract Request Letter', signedContract: 'Optional — signed contract', letter: 'Optional — signed Contract Request Letter', draft: 'Optional — latest signed draft contract' };
  const group = (title, keys) => slots(keys).length ? `
    <div class="imp-divider"><span>${title}</span></div>
    <div class="imp-doc-grid">${slots(keys).map(k => impDocSlot(vi, k, mgDocName(k, prefix), hint[k])).join('')}</div>` : '';
  return `
    ${group('LEGAL SIGNED DOCUMENTS', ['signedLetter', 'signedContract'])}
    ${group('DRAFT DOCUMENTS', ['letter', 'draft'])}
    <div class="imp-divider"><span>SUPPORTING DOCUMENTS</span></div>
    <label class="imp-doc-drop imp-doc-drop-wide">
      ${v.docs.supporting ? `<span>&#128206; ${v.docs.supporting}</span>` : '<span>&#8679;</span><span>Drag &amp; drop files here, or click to browse</span><span class="imp-doc-sub">Supports: Docx, Pdf, Xlsx, Ppt, etc. (Max 50MB)</span>'}
      <input type="file" multiple style="display: none;" onchange="impSetDoc(${vi}, 'supporting', this.files.length > 1 ? { name: this.files.length + ' files' } : this.files[0])">
    </label>`;
}

function impSet(vi, key, value) {
  ImpState.versions[vi].values[key] = value;
}

function impSetDoc(vi, key, file) {
  if (!file) return;
  ImpState.versions[vi].docs[key] = file.name;
  impRenderBuilder();
}

function impToggle(vi) {
  ImpState.versions[vi].open = !ImpState.versions[vi].open;
  impRenderBuilder();
}

function impRemoveVersion(vi) {
  mgConfirm('Remove Record', 'Are you sure you want to remove this record? This action cannot be undone.', 'Yes, Remove', () => {
    ImpState.versions.splice(vi, 1);
    ImpState.notice = '';
    impRenderBuilder();
  });
}

// Returns the ids of required inputs that are empty in a version
function impMissing(vi) {
  const v = ImpState.versions[vi];
  const cfg = IMP_VERSION_TYPES[v.type];
  const empty = key => !String(v.values[key] || '').trim();
  const missing = [];
  if (vi === 0 || cfg.full) {
    const inherited = ['ref', 'name', 'type'];
    IMP_INITIAL_FIELDS.filter(f => f.required && (vi === 0 || !inherited.includes(f.key)) && empty(f.key)).forEach(f => missing.push(`imp_${vi}_${f.key}`));
    if (vi === 0 && impRefTaken(v.values.ref)) missing.push('imp_0_ref');
    if (vi > 0 && empty('addendum')) missing.push(`imp_${vi}_addendum`);
    if (empty('recJustification')) missing.push(`imp_${vi}_recJustification`);
    if (v.values.budget === 'Budgeted' && empty('budgetCode')) missing.push(`imp_${vi}_budgetCode`);
    const vendors = impVendors(vi);
    (v.values.singleSource ? vendors.slice(0, 1) : vendors).forEach((r, i) => {
      if (!r.name.trim()) missing.push(`imp_vendor_${vi}_${i}`);
      if (!r.price) missing.push(`imp_price_${vi}_${i}`);
    });
    if (impPicked(vi) === null || impPicked(vi) === undefined) missing.push('vendor-pick');
  } else {
    cfg.fields.filter(f => f.required && empty(f.key)).forEach(f => missing.push(`imp_${vi}_${f.key}`));
  }
  return missing;
}

function impHighlight(ids) {
  document.querySelectorAll('#impBuilderRoot .nc-invalid').forEach(el => el.classList.remove('nc-invalid'));
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('nc-invalid');
  });
  const first = ids.map(id => document.getElementById(id)).find(Boolean);
  if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// The newest version that states a value, as a later version inherits it
function impLatest(key) {
  const v = ImpState.versions.slice().reverse().find(x => x.values[key] !== undefined);
  return v ? v.values[key] : undefined;
}

function impAddVersion(type) {
  const last = ImpState.versions.length - 1;
  const missing = impMissing(last);
  if (missing.length) {
    ImpState.versions[last].open = true;
    ImpState.notice = 'Please complete the required details in the current contract before adding another version.';
    impRenderBuilder();
    impHighlight(missing);
    return;
  }
  if (type === 'Extension' && impLatest('extendable') !== 'Yes') {
    ImpState.notice = 'This contract is not marked Extendable, so an Extension version cannot be added. Set Extendable to Yes first.';
    impRenderBuilder();
    return;
  }
  const lastType = ImpState.versions[last].type;
  if (lastType === 'Cancellation' || lastType === 'Completion') {
    showToast(`No further versions can follow a ${lastType}.`, 'info');
    return;
  }
  ImpState.notice = '';
  ImpState.versions.forEach(v => { v.open = false; });
  const values = { notice: '1' };
  if (IMP_VERSION_TYPES[type].full) {
    ['budget', 'budgetCode', 'renewable', 'extendable', 'singleSource', 'description', 'recJustification'].forEach(k => { values[k] = impLatest(k); });
    values.vendors = impVendors(last) ? impVendors(last).map(v => ({ ...v })) : ImpState.vendors.map(v => ({ ...v }));
    values.selectedVendor = impPicked(last) === undefined ? ImpState.selectedVendor : impPicked(last);
  }
  ImpState.versions.push({ type, values, open: true, docs: {} });
  impRenderBuilder();
}

function impImport() {
  for (let vi = 0; vi < ImpState.versions.length; vi++) {
    const missing = impMissing(vi);
    if (missing.length) {
      ImpState.versions[vi].open = true;
      impRenderBuilder();
      impHighlight(missing);
      showToast(missing.length === 1 && missing[0] === 'imp_0_ref' ? 'This Contract Reference ID already exists in the system.' : 'Please fill all mandatory fields', 'info');
      return;
    }
  }

  const base = ImpState.versions[0].values;
  // Newest version first; the vendors belong to the initial contract
  const versions = ImpState.versions.slice().reverse().map(v => ({ type: v.type, values: { ...v.values }, docs: { ...v.docs } }));
  const initial = versions[versions.length - 1].values;
  initial.vendors = (base.singleSource ? ImpState.vendors.slice(0, 1) : ImpState.vendors).map(v => ({ ...v }));
  initial.selectedVendor = ImpState.selectedVendor;
  const contract = mgAdd({
    id: `CNT-IMP-${Date.now()}`, code: base.ref.trim(), department: ImpState.department, branch: ImpState.branch, versions
  });

  ImpState.department = '';
  CMSState.mgFrom = 'import';
  mgOpen(contract.id, 'import');
  cmsSaveState();
}
