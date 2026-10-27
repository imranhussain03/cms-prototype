/**
 * Innomick Technologies - CMS Prototype
 * Manual Contract Import: Branch / Department modal, then the Contract Import Builder
 * where the initial contract and any later versions (Renewal, Amendment, Cancellation,
 * Extension, Completion) are entered with their documents and imported in one go.
 */

const IMP_VERSION_TYPES = {
  New: { title: 'Initial Contract Details', color: 'new' },
  Renewal: {
    title: 'Renewal Details', color: 'renewal',
    fields: [
      { key: 'start', label: 'New Effective Date', type: 'date', required: true },
      { key: 'end', label: 'New End Date', type: 'date', required: true },
      { key: 'value', label: 'Contract Value', type: 'number', required: true },
      { key: 'justification', label: 'Renewal Justification', type: 'textarea', required: true }
    ]
  },
  Amendment: {
    title: 'Amendment Details', color: 'amendment',
    fields: [
      { key: 'addendum', label: 'Addendum Number', type: 'text', required: true },
      { key: 'start', label: 'New Effective Date', type: 'date', required: true },
      { key: 'end', label: 'New End Date', type: 'date', required: true },
      { key: 'value', label: 'Contract Value', type: 'number' },
      { key: 'justification', label: 'Amendment Justification', type: 'textarea', required: true }
    ]
  },
  Cancellation: {
    title: 'Cancellation Details', color: 'cancellation',
    fields: [
      { key: 'end', label: 'Cancellation Date', type: 'date', required: true },
      { key: 'justification', label: 'Cancellation Justification', type: 'textarea', required: true }
    ]
  },
  Extension: {
    title: 'Extension Details', color: 'extension',
    fields: [
      { key: 'end', label: 'Extended End Date', type: 'date', required: true },
      { key: 'justification', label: 'Extension Justification', type: 'textarea', required: true }
    ]
  },
  Completion: {
    title: 'Completion Details', color: 'completion',
    fields: [
      { key: 'end', label: 'Completion Date', type: 'date', required: true },
      { key: 'justification', label: 'Completion Remarks', type: 'textarea', required: true }
    ]
  }
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
  ImpState.versions = [{ type: 'New', values: { notice: '1', budget: 'Non-Budgeted', renewable: 'No', extendable: 'No', singleSource: false }, open: true, docs: {} }];
  ImpState.vendors = [{ name: '', price: '' }, { name: '', price: '' }, { name: '', price: '' }];
  ImpState.selectedVendor = null;
  closeModal('impManualModal');
  switchRoute('import_builder');
}

function impField(vi, f, val) {
  const id = `imp_${vi}_${f.key}`;
  const req = f.required ? ' <span class="imp-req">*</span>' : '';
  let input;
  if (f.type === 'select') {
    input = `<select class="cms-select" id="${id}" onchange="impSet(${vi}, '${f.key}', this.value)">
      <option value="">Select ${f.label}</option>${f.options.map(o => `<option ${o === val ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  } else if (f.type === 'textarea') {
    input = `<textarea class="cms-input" id="${id}" rows="3" placeholder="Type here..." oninput="impSet(${vi}, '${f.key}', this.value)">${val || ''}</textarea>`;
  } else {
    input = `<input class="cms-input" type="${f.type}" id="${id}" value="${val || ''}" placeholder="${f.placeholder || ''}" oninput="impSet(${vi}, '${f.key}', this.value)">`;
  }
  return `<div class="imp-field ${f.type === 'textarea' ? 'imp-field-wide' : ''}"><label for="${id}">${f.label.toUpperCase()}${req}</label>${input}</div>`;
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
      const vals = v.values;
      return `
        <div class="imp-version ${v.open ? 'open' : ''}">
          <div class="imp-version-head" onclick="impToggle(${vi})">
            <strong>${cfg.title}</strong> &middot; <span class="nc-period-tag ${cfg.color}">${v.type.toUpperCase()}</span>
            ${vi > 0 ? `<button class="imp-remove" title="Remove version" onclick="event.stopPropagation(); impRemoveVersion(${vi})">&#10005;</button>` : ''}
            <span class="imp-caret">&#8964;</span>
          </div>
          <div class="imp-version-body">
            ${vi === 0 ? `
              <div class="imp-section-label">CONTRACT INFORMATION</div>
              <div class="imp-grid">
                ${IMP_INITIAL_FIELDS.map(f => impField(vi, f, vals[f.key])).join('')}
                ${impField(vi, { key: 'description', label: 'Description', type: 'textarea' }, vals.description)}
              </div>
              <div class="imp-grid">
                <div class="imp-field"><label>BUDGET STATUS</label>
                  <div class="nc-radio-group">
                    ${['Budgeted', 'Non-Budgeted'].map(o => `<label><input type="radio" name="impBudget" ${vals.budget === o ? 'checked' : ''} onchange="impSet(0, 'budget', '${o}'); impRenderBuilder()"> ${o}</label>`).join('')}
                  </div>
                </div>
                ${vals.budget === 'Budgeted' ? impField(vi, { key: 'budgetCode', label: 'Budget Code', type: 'text', required: true, placeholder: 'Enter budget code' }, vals.budgetCode) : '<div></div>'}
                ${['renewable', 'extendable'].map(k => `
                  <div class="imp-field"><label>${k.toUpperCase()}</label>
                    <div class="nc-radio-group">
                      ${['Yes', 'No'].map(o => `<label><input type="radio" name="imp_${k}" ${vals[k] === o ? 'checked' : ''} onchange="impSet(0, '${k}', '${o}')"> ${o}</label>`).join('')}
                    </div>
                  </div>`).join('')}
              </div>
              <div class="imp-field"><label>COMPETITIVE BIDDING</label>
                <div class="nc-radio-group"><label><input type="checkbox" ${vals.singleSource ? 'checked' : ''} onchange="impSet(0, 'singleSource', this.checked); impRenderBuilder()"> Single Source</label></div>
              </div>
              <table class="cms-table" style="margin-top: 8px;">
                <thead><tr><th style="width: 90px;">SERIAL NUMBER</th><th>VENDOR NAME</th><th style="width: 140px;">PRICE (KWD)</th><th style="width: 90px;">SELECT VENDOR</th></tr></thead>
                <tbody>
                  ${(vals.singleSource ? ImpState.vendors.slice(0, 1) : ImpState.vendors).map((vd, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td><input class="nc-inline-input" id="imp_vendor_${i}" placeholder="Enter Vendor" value="${vd.name}" oninput="ImpState.vendors[${i}].name = this.value"></td>
                      <td><input class="nc-inline-input" type="number" id="imp_price_${i}" placeholder="Price" value="${vd.price}" oninput="ImpState.vendors[${i}].price = this.value"></td>
                      <td style="text-align: center;"><input type="radio" name="impVendorPick" ${ImpState.selectedVendor === i ? 'checked' : ''} onchange="ImpState.selectedVendor = ${i}; impRenderBuilder()" style="accent-color: #008272;"></td>
                    </tr>`).join('')}
                </tbody>
              </table>
              <div style="font-size: 11px; color: #64748b; margin: 6px 0 12px;">* Vendor details are mandatory.</div>
              <div class="imp-field"><label>FINAL RECOMMENDED VENDOR <span class="imp-req">*</span></label>
                <div class="nc-recommended-value">${ImpState.selectedVendor !== null ? (ImpState.vendors[ImpState.selectedVendor].name || '—') : '—'}</div>
              </div>
              ${impField(vi, { key: 'recJustification', label: 'Recommendation Justification', type: 'textarea', required: true }, vals.recJustification)}
            ` : `
              <div class="imp-grid">
                ${cfg.fields.map(f => impField(vi, f, vals[f.key])).join('')}
              </div>
            `}

            <div class="imp-divider"><span>LEGAL SIGNED DOCUMENTS</span></div>
            <div class="imp-doc-grid">
              ${impDocSlot(vi, 'signedLetter', `Signed ${vi ? v.type + ' ' : ''}Contract Request Letter`, 'Optional — signed Contract Request Letter')}
              ${impDocSlot(vi, 'signedContract', 'Legal Signed Contract', 'Optional — signed contract')}
            </div>
            <div class="imp-divider"><span>DRAFT DOCUMENTS</span></div>
            <div class="imp-doc-grid">
              ${impDocSlot(vi, 'letter', `${vi ? v.type + ' ' : ''}Contract Request Letter`, 'Optional — Contract Request Letter')}
              ${impDocSlot(vi, 'draft', 'Contract Draft', 'Optional — latest signed draft contract')}
            </div>
            <div class="imp-divider"><span>SUPPORTING DOCUMENTS</span></div>
            <label class="imp-doc-drop imp-doc-drop-wide">
              ${v.docs.supporting ? `<span>&#128206; ${v.docs.supporting}</span>` : '<span>&#8679;</span><span>Drag &amp; drop files here, or click to browse</span><span class="imp-doc-sub">Supports: Docx, Pdf, Xlsx, Ppt, etc. (Max 50MB)</span>'}
              <input type="file" multiple style="display: none;" onchange="impSetDoc(${vi}, 'supporting', this.files.length > 1 ? { name: this.files.length + ' files' } : this.files[0])">
            </label>
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
    </div>`;
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
  ImpState.versions.splice(vi, 1);
  impRenderBuilder();
}

// Returns the ids of required inputs that are empty in a version
function impMissing(vi) {
  const v = ImpState.versions[vi];
  const missing = [];
  if (vi === 0) {
    IMP_INITIAL_FIELDS.filter(f => f.required && !String(v.values[f.key] || '').trim()).forEach(f => missing.push(`imp_0_${f.key}`));
    if (!String(v.values.recJustification || '').trim()) missing.push('imp_0_recJustification');
    if (v.values.budget === 'Budgeted' && !String(v.values.budgetCode || '').trim()) missing.push('imp_0_budgetCode');
    const rows = v.values.singleSource ? ImpState.vendors.slice(0, 1) : ImpState.vendors;
    rows.forEach((r, i) => {
      if (!r.name.trim()) missing.push(`imp_vendor_${i}`);
      if (!r.price) missing.push(`imp_price_${i}`);
    });
    if (ImpState.selectedVendor === null) missing.push('vendor-pick');
  } else {
    IMP_VERSION_TYPES[v.type].fields.filter(f => f.required && !String(v.values[f.key] || '').trim())
      .forEach(f => missing.push(`imp_${vi}_${f.key}`));
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

function impAddVersion(type) {
  const last = ImpState.versions.length - 1;
  const missing = impMissing(last);
  if (missing.length) {
    ImpState.versions[last].open = true;
    impRenderBuilder();
    impHighlight(missing);
    showToast('Please complete the required details in the current contract before adding another version.', 'info');
    return;
  }
  const lastType = ImpState.versions[last].type;
  if (lastType === 'Cancellation' || lastType === 'Completion') {
    showToast(`No further versions can follow a ${lastType}.`, 'info');
    return;
  }
  ImpState.versions.forEach(v => { v.open = false; });
  ImpState.versions.push({ type, values: {}, open: true, docs: {} });
  impRenderBuilder();
}

function impImport() {
  for (let vi = 0; vi < ImpState.versions.length; vi++) {
    const missing = impMissing(vi);
    if (missing.length) {
      ImpState.versions[vi].open = true;
      impRenderBuilder();
      impHighlight(missing);
      showToast('Please fill all mandatory fields', 'info');
      return;
    }
  }

  const base = ImpState.versions[0].values;
  // Each version runs from its own start (or the previous end) to its end date
  const periods = [];
  ImpState.versions.forEach((v, i) => {
    const prev = periods[0];
    const start = i === 0 ? base.actualStart : (v.values.start || (prev && prev.start) || base.actualStart);
    const end = i === 0 ? base.actualEnd : v.values.end;
    periods.unshift({ type: v.type, label: i === 0 ? 'Initial Contract' : '', start, end });
  });
  const current = periods[0];
  const latestValue = [...ImpState.versions].reverse().map(v => v.values.value).find(Boolean) || base.value;
  const closed = ['Cancellation', 'Completion'].includes(current.type);
  const expired = new Date(current.end) < new Date();
  const vendor = ImpState.vendors[ImpState.selectedVendor] || { name: '' };

  InnomickCMSData.contracts.unshift({
    id: `CNT-IMP-${Date.now()}`,
    refNo: base.ref, code: base.ref, contractName: base.name, name: base.name,
    hasIcon: true,
    status: closed ? 'Archived' : expired ? 'Expired' : 'Active',
    requestType: current.type,
    vendorName: vendor.name, vendor: vendor.name,
    department: ImpState.department, branch: ImpState.branch,
    durationMonths: ncMonthsBetween(current.start, current.end),
    durationDates: `${ncShortDate(current.start)} - ${ncShortDate(current.end)}`,
    durationProgress: expired ? 100 : 0,
    contractValue: Number(latestValue).toLocaleString(), value: Number(latestValue),
    currency: 'KWD', category: base.type, type: `${base.type} Agreement`,
    owner: InnomickCMSData.currentUser.name,
    description: base.description || '',
    budgetStatus: base.budget === 'Budgeted' ? 'Yes' : 'No', budgetCode: base.budgetCode || '',
    renewable: base.renewable, extendable: base.extendable,
    procurementMode: base.singleSource ? 'Single Source' : 'Competitive Bidding',
    recJustification: base.recJustification,
    periods,
    supportingDocs: ImpState.versions.map(v => v.docs.supporting).filter(Boolean)
  });

  showToast(`Contract ${base.ref} imported with ${ImpState.versions.length} version(s)`, 'success');
  ImpState.department = '';
  switchRoute('import');
}
