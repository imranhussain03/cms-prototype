/**
 * Innomick Technologies - CMS Prototype
 * Approver page for documents sent from a contract request (#/approve/:inboxId),
 * laid out like the live "document approval" page.
 */

const NCApprove = { item: null, tab: 'reviews' };

function ncApproveContext(inboxId) {
  const item = InnomickCMSData.approvals.inbox.find(i => i.id === inboxId) || NCApprove.item;
  if (!item) return null;
  const rec = NCState.records[item.ncRequestId];
  return rec ? { item, rec, doc: rec.docs[item.ncDoc] } : null;
}

function ncRenderApprovePage(inboxId) {
  const ctx = ncApproveContext(inboxId);
  const root = document.getElementById('ncApproveRoot');
  if (!ctx) { switchRoute('approvals'); return; }
  NCApprove.item = ctx.item;
  NCState.current = ctx.rec;
  const { item, rec, doc } = ctx;
  const f = rec.form;
  const c = doc.cycle;
  const fmtLong = d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const due = new Date(c.started); due.setDate(due.getDate() + 2);
  const current = c.steps.find(s => s.state === 'Pending');
  const reqType = rec.mode ? NC_MODES[rec.mode].requestType : 'New';
  const docType = `${reqType} ${item.ncDoc === 'letter' ? 'Request Letter Draft' : 'Contract Draft'}`;
  const comments = (rec.comments || []).filter(cm => cm.doc === NC_DOC_META[item.ncDoc].title);
  const side = (label, value) => `<div class="ap-side-field"><label>${label}</label><div>${value || '—'}</div></div>`;
  const stepState = (s, i) => {
    if (s.state === 'Approved') return ['Approved', 'ap-badge-ok', 'Approved'];
    if (/Reject|Change/.test(s.state)) return [s.state, 'ap-badge-bad', s.state];
    if (s === current) return ['Current Step', 'ap-badge-cur', `Due: ${fmtLong(due)}`];
    return ['Pending', 'ap-badge-wait', c.type === 'Parallel' ? `Due: ${fmtLong(due)}` : 'After previous approval'];
  };
  const chainNodes = [{ title: 'Submitted by', who: InnomickCMSData.currentUser.name, note: new Date(c.started).toISOString().slice(0, 10), cls: 'done' }]
    .concat(c.steps.map((s, i) => ({ title: `Step ${i + 1}`, who: s.approver, note: s.state === 'Approved' ? 'Approved' : s === current ? `Due: ${fmtLong(due)}` : 'After prev. approval', cls: s.state === 'Approved' ? 'done' : s === current ? 'cur' : '', n: i + 1 })));

  root.innerHTML = `
    <div class="ap-header">
      <button class="ap-back" onclick="switchRoute('approvals')">&#8249; Back</button>
      <span class="ap-doc-icon">&#128196;</span>
      <div class="ap-header-text">
        <strong>${item.name}</strong>
        <span>${item.name} &middot; ${rec.refNo}</span>
      </div>
      <div class="ap-header-actions">
        <button class="btn-outline-teal" onclick="ncApprovePrevious()">&#9719; View Previous Approvals</button>
        <button class="btn-teal-primary" onclick="ncViewCertificate('${item.ncDoc}')">&#128737; View Certificate</button>
      </div>
    </div>

    <div class="ap-body">
      <aside class="ap-side">
        <button class="ap-preview" onclick="ncPreviewDoc('${item.ncDoc}')">&#128065; Preview Document</button>
        ${side('Owner', InnomickCMSData.currentUser.name)}
        ${side('Contract ID', rec.refNo)}
        ${side('Contract Name', f.name)}
        ${side('Contract Type', rec.contractType)}
        ${side('Request Type', reqType)}
        ${side('Document Type', docType)}
        ${side('Contract Value', Number(f.value || 0).toLocaleString())}
        <div class="ap-side-field"><label>Department</label><div><span class="ap-pill">${rec.department}</span></div></div>
        ${side('Branch', rec.branch)}
        ${side('Start Date', f.startDate ? fmtLong(f.startDate) : '')}
        ${side('End Date', f.endDate ? fmtLong(f.endDate) : '')}
      </aside>

      <main class="ap-main">
        <div class="ap-decision">
          <div><strong>Your decision</strong><span>${current ? 'You are the current approver for this document' : 'This approval cycle is complete'}</span></div>
          ${current ? `<div class="ap-decision-btns">
            <button class="ap-btn-reject" onclick="ncApproveAct('Reject')">&#10005; Reject</button>
            <button class="ap-btn-change" onclick="ncApproveAct('Request Change')">&#9998; Request Change</button>
            <button class="btn-teal-primary" onclick="ncApproveAct('Approve')">&#10003; Approve</button>
          </div>` : ''}
        </div>

        <div class="ap-scroll">
          <div class="ap-label">SUBMISSION DETAILS</div>
          <div class="ap-card ap-grid3">
            <div><label>REQUESTED BY</label><div>${InnomickCMSData.currentUser.name}</div></div>
            <div><label>DOCUMENT VERSION</label><div>${doc.versions[0].version}</div></div>
            <div><label>SUBMISSION DATE</label><div>${new Date(c.started).toISOString().slice(0, 10)}</div></div>
          </div>

          <div class="ap-card">
            <div class="ap-label" style="margin-top: 0;">APPROVAL CHAIN</div>
            <div class="ap-chain">
              ${chainNodes.map((n, i) => `
                <div class="ap-chain-node">
                  <span class="ap-dot ${n.cls}">${n.cls === 'done' ? '&#10003;' : n.n}</span>
                  <b>${n.title}</b><small>${n.who}</small><small class="ap-teal">${n.note}</small>
                </div>${i < chainNodes.length - 1 ? `<div class="ap-chain-line ${chainNodes[i + 1].cls ? 'on' : ''}"></div>` : ''}`).join('')}
            </div>
          </div>

          <div class="ap-card ap-tabs-card">
            <div class="ap-tabs">
              <button class="${NCApprove.tab === 'reviews' ? 'active' : ''}" onclick="NCApprove.tab = 'reviews'; ncRenderApprovePage('${item.id}')">Reviews</button>
              <button class="${NCApprove.tab === 'details' ? 'active' : ''}" onclick="NCApprove.tab = 'details'; ncRenderApprovePage('${item.id}')">Details</button>
            </div>
            ${NCApprove.tab === 'reviews' ? `
              <div class="ap-label">APPROVERS' REVIEWS</div>
              ${c.steps.map((s, i) => {
                const [badge, cls, sub] = stepState(s, i);
                const stepComments = comments.filter(cm => cm.by === s.approver);
                return `
                <div class="ap-review ${s === current ? 'current' : ''}">
                  <div class="ap-review-head">
                    <span class="ap-dot ${s === current ? 'ring' : s.state === 'Approved' ? 'done' : ''}">${s.state === 'Approved' ? '&#10003;' : i + 1}</span>
                    <div><b>Step ${i + 1}</b><small>${s.approver}</small>${s === current || s.state !== 'Pending' ? `<small>Assigned on ${ncFormatDateTime(new Date(c.started))}</small>` : ''}</div>
                    <div class="ap-review-right"><span class="${cls}">${badge}</span><small>${sub}</small></div>
                  </div>
                  ${s === current || stepComments.length ? `<div class="ap-review-comments"><label>COMMENTS</label>
                    ${stepComments.length ? stepComments.map(cm => `<div>${cm.text}<small> · ${cm.on}</small></div>`).join('') : '<em>No comments yet</em>'}</div>` : ''}
                </div>`;
              }).join('')}` : `
              <div class="ap-grid3 ap-details">
                <div><label>VENDOR</label><div>${(f.vendors[f.selectedVendor] || {}).name || '—'}</div></div>
                <div><label>NOTICE PERIOD</label><div>${f.notice} Month(s)</div></div>
                <div><label>BUDGET STATUS</label><div>${f.budget}</div></div>
                <div><label>RENEWABLE</label><div>${f.renewable}</div></div>
                <div><label>EXTENDABLE</label><div>${f.extendable}</div></div>
                <div><label>PROCUREMENT MODE</label><div>${f.singleSource ? 'Single Source' : 'Competitive Bidding'}</div></div>
              </div>`}
          </div>
        </div>
      </main>

      <aside class="ap-comments">
        <div class="ap-label" style="margin-top: 0;">COMMENTING ON</div>
        <div class="ap-commenting">${rec.refNo} <span class="ap-new">${reqType}</span></div>
        <textarea class="cms-input" id="ncApproveComment" rows="4" placeholder="Add your comment here..." oninput="document.getElementById('ncAddCommentBtn').disabled = !this.value.trim()"></textarea>
        <button class="btn-teal-primary ap-add" id="ncAddCommentBtn" disabled onclick="ncApproveAddComment()">Add Comment</button>
        <div class="ap-label">COMMENTS</div>
        ${comments.length ? comments.map(cm => `<div class="nc-comment"><strong>${cm.by}</strong><div>${cm.text}</div><small>${cm.on}</small></div>`).join('')
          : '<p class="ap-empty">No comments yet for this request.</p>'}
      </aside>
    </div>`;
}

function ncApproveAddComment() {
  const ctx = ncApproveContext(NCApprove.item.id);
  const box = document.getElementById('ncApproveComment');
  const step = ctx.doc.cycle.steps.find(s => s.state === 'Pending');
  ctx.rec.comments = ctx.rec.comments || [];
  ctx.rec.comments.unshift({ by: step ? step.approver : InnomickCMSData.currentUser.name, on: ncFormatDateTime(new Date()), text: box.value.trim(), doc: NC_DOC_META[ctx.item.ncDoc].title });
  ncRenderApprovePage(ctx.item.id);
  showToast('Comment added', 'success');
}

// Decision buttons open a remarks dialog (like the live page), then an Info confirmation
const NC_DECISIONS = {
  'Approve': { title: 'Approval', label: 'Approval Remarks', done: 'Request is Approved!', required: false },
  'Reject': { title: 'Reject', label: 'Rejection Remarks', done: 'Request is Rejected!', required: true },
  'Request Change': { title: 'Request Change', label: 'Change Remarks', done: 'Change is Requested!', required: true }
};

function ncApproveAct(action) {
  const cfg = NC_DECISIONS[action];
  NCApprove.action = action;
  document.getElementById('ncRemarksTitle').textContent = cfg.title;
  document.getElementById('ncRemarksLabel').textContent = cfg.label + (cfg.required ? ' *' : '');
  const box = document.getElementById('ncRemarksText');
  box.value = '';
  box.classList.remove('nc-invalid');
  openModal('ncRemarksModal');
  box.focus();
}

function ncRemarksSubmit() {
  const action = NCApprove.action;
  const cfg = NC_DECISIONS[action];
  const box = document.getElementById('ncRemarksText');
  const remarks = box.value.trim();
  if (cfg.required && !remarks) {
    box.classList.add('nc-invalid');
    showToast('Please add remarks', 'info');
    return;
  }
  const ctx = ncApproveContext(NCApprove.item.id);
  NCState.reviewing = ctx.item;
  // ncApproverAction reads the remarks from this field
  let holder = document.getElementById('ncApproverComment');
  if (!holder) {
    holder = document.createElement('textarea');
    holder.id = 'ncApproverComment';
    holder.style.display = 'none';
    document.body.appendChild(holder);
  }
  holder.value = remarks || (action === 'Approve' ? '' : '-');
  closeModal('ncRemarksModal');
  ncApproverAction(action);
  NCState.afterInfo = () => switchRoute('approvals');
  ncShowInfo(cfg.done, true);
}

function ncApprovePrevious() {
  const ctx = ncApproveContext(NCApprove.item.id);
  const past = ctx.rec.history.filter(h => h.doc === NC_DOC_META[ctx.item.ncDoc].title);
  const body = document.querySelector('#approvalHistoryModal .modal-box > div:nth-child(2)');
  body.innerHTML = `<div style="font-size: 11px; font-weight: 700; color: #008272; letter-spacing: 0.5px; margin-bottom: 12px;">PREVIOUS APPROVALS</div>` +
    (past.length ? past.map(h => `<div class="cd-ah-card"><div class="cd-ah-head"><div><b>${h.workflow}</b><div class="cd-ah-meta">Started ${h.on}</div></div></div>
      <div class="cd-ah-comments">${h.steps.map(s => `${s.title} · ${s.approver} — ${s.state}`).join('<br>')}</div></div>`).join('')
      : '<p class="ap-empty">No previous approvals.</p>');
  openModal('approvalHistoryModal');
}
