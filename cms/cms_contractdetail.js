/**
 * Innomick Technologies - CMS Prototype
 * Contract Details page (#/contract-detail/:id), mirroring the live layout:
 * header actions, approval chain, overview sidebar, version tabs,
 * read-only details, editable dates, manager details, documents, approver comments.
 */

const CDState = {
  contract: null,
  versionIndex: 0
};

// Builds the version list for a contract: newest first, the first one marked Current
function cdVersions(cnt) {
  if (cnt.periods && cnt.periods.length) return cnt.periods;
  const [start, end] = ncParseRange(cnt.durationDates);
  return [{ type: 'New', label: 'Initial Contract', start, end }];
}

function cdApprovalChain(cnt) {
  return [
    { title: 'Submitted by', person: cnt.owner || InnomickCMSData.currentUser.name, note: cnt.submittedOn || '22 September 2026', isSubmit: true },
    { title: 'Step 1', person: 'Sara Thomas', note: 'Approved', assigned: '22 September 2026, 2:56 pm', acted: '22 September 2026, 2:58 pm' },
    { title: 'Step 2', person: 'Daniel Mathew', note: 'Approved', assigned: '22 September 2026, 2:58 pm', acted: '22 September 2026, 2:59 pm' }
  ];
}

function cdRender(contractId) {
  const cnt = InnomickCMSData.contracts.find(c => c.id === contractId || c.code === contractId || c.refNo === contractId)
    || InnomickCMSData.contracts[0];
  const root = document.getElementById('cdRoot');
  if (!cnt || !root) return;
  if (CDState.contract !== cnt) CDState.versionIndex = 0;
  CDState.contract = cnt;

  const versions = cdVersions(cnt);
  const v = versions[CDState.versionIndex] || versions[0];
  const chain = cdApprovalChain(cnt);
  const title = cnt.hasIcon ? 'Migrated Contract Details' : 'Contract Details';
  const statusCls = cnt.status === 'Active' ? 'badge-approved' : cnt.status === 'In Approval' ? 'badge-in-approval' : 'badge-draft';
  const vendor = cnt.vendor || cnt.vendorName || '';
  const value = Number(cnt.value || 0).toLocaleString();
  const ro = (label, val) => `<div class="cd-ro-field"><label>${label}</label><div>${val === undefined || val === '' ? '—' : val}</div></div>`;

  root.innerHTML = `
    <div class="cd-header">
      <div class="cd-header-left">
        <button class="btn-back-nav" onclick="switchRoute('contracts')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Back
        </button>
        <div>
          <div class="cd-title">${title}</div>
          <div class="cd-subtitle">${cnt.code} &middot; ${cnt.name} &middot; ${cnt.category || 'Service'}</div>
        </div>
      </div>
      <div class="cd-header-actions">
        <span class="${statusCls}" style="padding: 6px 18px;">${cnt.status}</span>
        <button class="btn-outline-teal nc-doc-btn" onclick="cdOpenApprovalHistory()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          Approval History
        </button>
        <button class="btn-outline-teal nc-doc-btn" onclick="cdOpenCertificate()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          View Certificate
        </button>
        <button class="btn-outline-teal nc-doc-btn" onclick="cdRender('${cnt.id}'); showToast('Contract refreshed', 'info')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
          Refresh
        </button>
      </div>
    </div>

    <div class="cd-chain">
      <div class="cd-chain-label">APPROVAL CHAIN</div>
      <div class="cd-chain-track">
        ${chain.map((s, i) => `
          <div class="cd-chain-step">
            <span class="cd-chain-dot">&#10003;</span>
            <div class="cd-chain-title">${s.title}</div>
            <div class="cd-chain-person">${s.person}</div>
            <div class="cd-chain-note">${s.note}</div>
          </div>
          ${i < chain.length - 1 ? '<div class="cd-chain-line"></div>' : ''}`).join('')}
      </div>
    </div>

    <div class="cd-body">
      <aside class="cd-overview">
        <div class="cd-panel-title">CONTRACT OVERVIEW</div>
        ${[['Reference No.', cnt.code], ['Contract Name', cnt.name], ['Contract Type', cnt.category || 'Service'], ['Vendor Name', vendor], ['Branch', cnt.branch]]
          .map(([l, val]) => `<div class="cd-ov-item"><label>${l}</label><div>${val}</div></div>`).join('')}
        <div class="cd-ov-item"><label>Department</label><div class="cd-ov-pill">${cnt.department}</div></div>
      </aside>

      <main class="cd-main">
        <div class="cd-version-tabs">
          ${versions.map((ver, i) => `
            <button class="cd-version-tab ${i === CDState.versionIndex ? 'active' : ''}" onclick="CDState.versionIndex = ${i}; cdRender('${cnt.id}')">
              <span class="nc-period-tag ${ver.type.toLowerCase()}" style="margin-left: 0;">${ver.type.toUpperCase()}</span>
              ${i === 0 ? '<span class="nc-ch-current">CURRENT</span>' : `<span class="cd-version-label">${ver.label || ''}</span>`}
              <div class="cd-version-dates">${ncLongDate(ver.start)} &rarr; ${ncLongDate(ver.end)}</div>
            </button>`).join('')}
        </div>

        <div class="cd-scroll">
          <div class="cd-section-title cd-section-main">${v.type === 'New' ? 'CONTRACT' : v.type.toUpperCase()} DETAILS</div>

          <div class="cd-section-title">CONTRACT INFORMATION — READ ONLY</div>
          <div class="cd-ro-grid">
            ${ro('Contract Name', cnt.name)}
            ${ro('Contract Type', cnt.category || 'Service')}
            ${ro('Contract Value', `${value} KWD`)}
            <div></div>
            ${ro('Start Date', ncLongDate(v.start))}
            ${ro('End Date', ncLongDate(v.end))}
            ${ro('Budget Status', cnt.budgetStatus || 'Yes')}
            ${ro('Budget Code', cnt.budgetStatus === 'No' ? '' : (cnt.budgetCode || 'BC-1024'))}
            ${ro('Renewable', cnt.renewable || 'Yes')}
            ${ro('Extendable', cnt.extendable || 'Yes')}
            ${ro('Auto Renewal', cnt.autoRenewal ? 'On' : 'Off')}
            ${ro('Procurement Mode', cnt.procurementMode || 'Single Source')}
          </div>
          ${ro('Recommended Vendor', vendor)}
          ${ro('Description', cnt.description)}

          <div class="cd-section-title">VENDOR DETAILS — READ ONLY</div>
          <table class="cms-table cd-vendor-table">
            <thead><tr><th>No.</th><th>Vendor Name</th><th>Price (KWD)</th><th>Selected</th></tr></thead>
            <tbody><tr><td>1</td><td>${vendor}</td><td>${value}</td><td><span class="cd-selected-dot">&#10003;</span></td></tr></tbody>
          </table>
          ${ro('Vendor Justification', cnt.vendorJustification || 'Existing contracted vendor with proven delivery.')}
          ${ro('Recommendation Justification', cnt.recJustification || 'Best value and service continuity.')}

          <div class="cd-section-title">EDITABLE FIELDS</div>
          <div class="cd-ro-grid">
            ${ro('New Effective Date', v.type === 'New' ? '' : ncLongDate(v.start))}
            ${ro('New End Date', v.type === 'New' ? '' : ncLongDate(v.end))}
            ${ro('Actual Start Date', ncLongDate(v.start))}
            ${ro('Actual End Date', ncLongDate(v.end))}
            ${ro('Notice Period (Months)', cnt.noticePeriod || '1')}
          </div>

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
              <div class="nc-manager-saved" id="cdMgrSaved">${cnt.manager ? `Notifications will be sent to <strong>${cnt.manager}</strong>` : ''}</div>
            </div>
          </div>

          <div class="cd-section-title">PRIMARY DOCUMENTS</div>
          ${['Signed', ''].map(prefix => {
            const docName = `${prefix ? prefix + ' ' : ''}${v.type === 'New' ? '' : v.type + ' '}Contract Request Letter`;
            return `
              <div class="cd-doc-row">
                <span class="cd-doc-icon">&#128196;</span>
                <div><div class="cd-doc-name">${docName} <span>(Optional)</span></div><div class="cd-doc-sub">${cnt.hasIcon ? 'Not uploaded' : 'Uploaded · Version 1.0'}</div></div>
                ${cnt.hasIcon ? '' : '<button class="btn-outline-teal nc-doc-btn" style="margin-left:auto;" onclick="cdPreviewDoc()">View</button>'}
              </div>`;
          }).join('')}

          <div class="cd-section-title">SUPPORTING DOCUMENTS</div>
          ${(cnt.supportingDocs || ['Vendor_Quotation.pdf', 'Scope_of_Work.docx']).map(name => `
            <div class="cd-doc-row">
              <span class="cd-doc-icon">&#128206;</span>
              <div class="cd-doc-name">${name}</div>
              <button class="btn-outline-teal nc-doc-btn" style="margin-left:auto;" onclick="showToast('Opening ${name}', 'info')">View</button>
            </div>`).join('')}
        </div>
      </main>

      <aside class="cd-comments">
        <div class="cd-panel-title">APPROVER COMMENTS</div>
        <p class="cd-comments-sub">Comments left by approvers on the ${v.type} version during review.</p>
        <p class="cd-comments-empty">No approver comments yet for this version.</p>
      </aside>
    </div>`;
}

function cdManagerCascade() {
  const branch = document.getElementById('cdMgrBranch').value;
  const dept = document.getElementById('cdMgrDept');
  const role = document.getElementById('cdMgrRole');
  const user = document.getElementById('cdMgrUser');
  const fill = (sel, ph, vals, keep) => {
    const cur = sel.value;
    sel.innerHTML = `<option value="">${ph}</option>` + vals.map(v => `<option>${v}</option>`).join('');
    sel.disabled = !vals.length;
    if (keep && vals.includes(cur)) sel.value = cur;
  };
  fill(dept, 'Select Department', branch ? [...new Set(NC_DIRECTORY.map(p => p.department))] : [], true);
  const people = NC_DIRECTORY.filter(p => p.department === dept.value);
  fill(role, 'Select Role', dept.value ? [...new Set(people.map(p => p.role))] : [], true);
  fill(user, 'Select Manager', role.value ? people.filter(p => p.role === role.value).map(p => p.name) : [], true);
}

function cdSaveManager() {
  const name = document.getElementById('cdMgrUser').value;
  if (!name) {
    showToast('Select Branch, Department, Role and Manager before saving', 'info');
    return;
  }
  CDState.contract.manager = name;
  document.getElementById('cdMgrSaved').innerHTML = `Notifications will be sent to <strong>${name}</strong>`;
  showToast(`Manager ${name} saved`, 'success');
}

function cdOpenApprovalHistory() {
  const steps = cdApprovalChain(CDState.contract).filter(s => !s.isSubmit).reverse();
  const body = document.querySelector('#approvalHistoryModal .modal-box > div:nth-child(2)');
  body.innerHTML = `
    <div style="font-size: 11px; font-weight: 700; color: #008272; letter-spacing: 0.5px; margin-bottom: 12px;">APPROVAL HISTORY</div>
    ${steps.map(s => `
      <div class="cd-ah-card">
        <div class="cd-ah-head">
          <span class="cd-chain-dot" style="position: static;">&#10003;</span>
          <div>
            <div style="font-weight: 700;">${s.person}</div>
            <div class="cd-ah-meta">Assigned on ${s.assigned}<br>Action taken on ${s.acted}</div>
          </div>
          <span class="badge-approved" style="margin-left: auto;">Approved</span>
        </div>
        <div class="cd-ah-comments"><div>COMMENTS</div><em>No comments</em></div>
      </div>`).join('')}`;
  openModal('approvalHistoryModal');
}

function cdOpenCertificate() {
  const c = CDState.contract;
  // The certificate modal reads from the approval being reviewed; point it at this contract
  currentReviewItem = {
    contractCode: c.code, name: c.name, type: c.category || 'Service', vendor: c.vendor,
    requestType: cdVersions(c)[CDState.versionIndex].type,
    amount: `${Number(c.value || 0).toLocaleString()} KWD`, department: c.department
  };
  openApprovalCertificateModal();
}

function cdPreviewDoc() {
  const c = CDState.contract;
  document.getElementById('ncDocPreviewTitle').textContent = `Contract Request Letter · ${c.code}`;
  document.getElementById('ncDocPreviewPage').innerHTML = `
    <div class="nc-letter-brand">INNOMICK TECHNOLOGIES</div>
    <p><strong>Ref:</strong> ${c.code}</p>
    <h3 style="text-align:center; text-decoration: underline;">Contract Request Letter</h3>
    <table class="nc-doc-table">
      <tr><th>Contract Name</th><td>${c.name}</td></tr>
      <tr><th>Vendor</th><td>${c.vendor}</td></tr>
      <tr><th>Department</th><td>${c.department}</td></tr>
      <tr><th>Contract Value</th><td>${Number(c.value || 0).toLocaleString()} KWD</td></tr>
      <tr><th>Duration</th><td>${c.durationDates || ''}</td></tr>
    </table>
    <p>${c.description || ''}</p>`;
  openModal('ncDocPreviewModal');
}
