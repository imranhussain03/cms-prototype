/**
 * Innomick Technologies - CMS Prototype
 * Contract template editor: "Create Contract Template" (after picking a contract type)
 * and "Edit Contract Template". Uploading a .docx detects its placeholders in the
 * browser and maps each to a contract field.
 */

// Fields a template placeholder can be mapped to
const TPL_FIELDS = [
  'Current Date', 'Branch', 'Commercial Registration No.', 'Authorized Signatory Name',
  'Contract Name', 'Contract Value', 'Contract Start Date', 'Contract End Date',
  'Vendor Name', 'Notice Period', 'Department', 'Contract Reference No.'
];

// Placeholder -> field guesses used for "Auto-Mapped"
const TPL_AUTO_MAP = {
  cdate: 'Current Date', date: 'Current Date', currentdate: 'Current Date',
  branch: 'Branch', dropbranch: 'Branch',
  crno: 'Commercial Registration No.', crnumber: 'Commercial Registration No.', pno: 'Commercial Registration No.',
  ceo: 'Authorized Signatory Name', signatory: 'Authorized Signatory Name',
  name: 'Contract Name', contractname: 'Contract Name',
  price: 'Contract Value', value: 'Contract Value', contractvalue: 'Contract Value',
  startdate: 'Contract Start Date', enddate: 'Contract End Date',
  vendor: 'Vendor Name', vendorname: 'Vendor Name',
  notice: 'Notice Period', noticeperiod: 'Notice Period',
  department: 'Department', ref: 'Contract Reference No.', refno: 'Contract Reference No.'
};

const TplState = {
  mode: 'edit',      // 'create' | 'edit'
  contractType: '',
  template: null,
  fileName: '',
  placeholders: []   // [{ name, field, auto }]
};

function tplRenderEditor(param) {
  const p = String(param || '');
  if (p.startsWith('new:')) {
    TplState.mode = 'create';
    TplState.contractType = p.slice(4) || 'Service';
    TplState.template = null;
    TplState.fileName = '';
    TplState.placeholders = [];
  } else {
    const tpl = InnomickCMSData.templates.find(t => t.id === p) || InnomickCMSData.templates[0];
    TplState.mode = 'edit';
    TplState.template = tpl;
    TplState.contractType = tpl.contractType || 'Service';
    TplState.fileName = tpl.fileName || `${tpl.name}.docx`;
    TplState.placeholders = tpl.placeholders
      || (tpl.fields ? tpl.fields.map(f => ({ name: f.name, field: f.label, auto: true })) : ['cDate', 'pNo', 'CEO', 'dropBranch'].map(tplMapPlaceholder));
  }
  tplDraw();
}

function tplMapPlaceholder(name) {
  const field = TPL_AUTO_MAP[name.toLowerCase().replace(/[^a-z]/g, '')] || '';
  return { name, field, auto: !!field };
}

function tplDraw() {
  const root = document.getElementById('tplEditorRoot');
  if (!root) return;
  const isCreate = TplState.mode === 'create';
  const canSave = !isCreate || (TplState.fileName && TplState.placeholders.length);

  root.innerHTML = `
    <div class="detail-view-container">
      <div class="detail-view-header">
        <div style="display: flex; align-items: center; gap: 12px;">
          <button class="btn-back-nav" onclick="switchRoute('templates')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            Back
          </button>
          <h2 style="font-size: 18px; font-weight: 700; color: #1e293b;">${isCreate ? 'Create' : 'Edit'} Contract Template</h2>
        </div>
        <button class="btn-teal-primary" id="tplSaveBtn" onclick="tplSave()" ${canSave ? '' : 'disabled'}>
          + ${isCreate ? 'Save' : 'Update'} Template
        </button>
      </div>
      ${isCreate ? `<div class="tpl-type-caption">Create Template for Contract Type - ${TplState.contractType}</div>` : ''}

      <div class="detail-view-main-card">
        <div class="tpl-form-row">
          <label>Template Name</label>
          <input type="text" class="detail-field-input" id="tplEditorName" placeholder="Enter Template Name" value="${TplState.template ? TplState.template.name : ''}">
        </div>
        <div class="tpl-form-row tpl-form-row-top">
          <label>${TplState.fileName ? 'Uploaded' : 'Upload'} Contract Template</label>
          <div>
            ${TplState.fileName ? `
              <div class="tpl-file-chip">
                <span>&#128196; <strong>${TplState.fileName}</strong> <em>${isCreate ? '(New file)' : '(Existing file)'}</em></span>
                <button class="btn-icon-subtle" style="color: #ef4444;" title="Remove file" onclick="tplRemoveFile()">&#10005;</button>
              </div>` : `
              <label class="file-drop-zone tpl-drop" id="tplDropZone">
                <span style="font-size: 20px; color: #64748b;">&#8679;</span>
                <div style="font-size: 14px; font-weight: 700; color: #334155;">Browse</div>
                <div style="font-size: 12px; color: #64748b;">Drag &amp; drop file here, or browse</div>
                <div style="font-size: 11px; color: #94a3b8;">Supports: Docx (Max 50MB)</div>
                <input type="file" accept=".docx" style="display: none;" onchange="tplHandleFile(this.files[0])">
              </label>`}
          </div>
        </div>

        ${TplState.placeholders.length ? `
          <table class="mapping-table" style="margin-top: 24px;">
            <thead><tr><th>Placeholder Detected</th><th>Mapped with</th><th>Action</th></tr></thead>
            <tbody>
              ${TplState.placeholders.map((ph, i) => `
                <tr>
                  <td><code>${ph.name}</code></td>
                  <td>
                    <select class="cms-select" style="max-width: 250px;" onchange="tplSetMapping(${i}, this.value)">
                      <option value="">Select Field</option>
                      ${TPL_FIELDS.map(f => `<option ${f === ph.field ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                  </td>
                  <td>${ph.field
                    ? `<span class="table-badge" style="background:#dcfce7; color:#15803d;">&#10003; ${ph.auto ? 'Auto-Mapped' : 'Mapped'}</span>`
                    : '<span class="table-badge" style="background:#fef3c7; color:#b45309;">Not Mapped</span>'}</td>
                </tr>`).join('')}
            </tbody>
          </table>` : ''}
      </div>
    </div>`;

  const zone = document.getElementById('tplDropZone');
  if (zone) {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragging'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
    zone.addEventListener('drop', e => { e.preventDefault(); tplHandleFile(e.dataTransfer.files[0]); });
  }
}

async function tplHandleFile(file) {
  if (!file) return;
  if (!/\.docx$/i.test(file.name)) {
    showToast('Only .docx templates are supported', 'info');
    return;
  }
  const name = document.getElementById('tplEditorName').value;
  let found = [];
  try {
    found = await tplExtractPlaceholders(file);
  } catch (err) {
    found = [];
  }
  if (!found.length) {
    // Nothing recognisable in the document: show typical placeholders so mapping can be demoed
    found = ['cDate', 'dropBranch', 'crNo', 'signatory'];
    showToast('No {{placeholders}} found in the file - showing sample placeholders', 'info');
  } else {
    showToast(`${found.length} placeholder(s) detected in ${file.name}`, 'success');
  }
  TplState.fileName = file.name;
  TplState.placeholders = found.map(tplMapPlaceholder);
  tplDraw();
  document.getElementById('tplEditorName').value = name;
}

function tplRemoveFile() {
  const name = document.getElementById('tplEditorName').value;
  TplState.fileName = '';
  TplState.placeholders = [];
  tplDraw();
  document.getElementById('tplEditorName').value = name;
}

function tplSetMapping(i, field) {
  const name = document.getElementById('tplEditorName').value;
  TplState.placeholders[i].field = field;
  TplState.placeholders[i].auto = false;
  tplDraw();
  document.getElementById('tplEditorName').value = name;
}

function tplSave() {
  const name = document.getElementById('tplEditorName').value.trim();
  if (!name) {
    showToast('Please enter a Template Name', 'info');
    document.getElementById('tplEditorName').classList.add('nc-invalid');
    return;
  }
  if (TplState.placeholders.some(p => !p.field)) {
    showToast('Map every placeholder before saving', 'info');
    return;
  }

  if (TplState.mode === 'create') {
    InnomickCMSData.templates.unshift({
      id: `TPL-${Date.now()}`,
      name,
      type: TplState.contractType,
      contractType: TplState.contractType,
      category: TplState.contractType,
      updated: 'Today',
      createdAt: Date.now(),
      author: InnomickCMSData.currentUser.name,
      fileName: TplState.fileName,
      placeholders: TplState.placeholders
    });
    showToast(`Template "${name}" created`, 'success');
  } else {
    Object.assign(TplState.template, { name, fileName: TplState.fileName, placeholders: TplState.placeholders, updated: 'Today' });
    showToast(`Template "${name}" updated`, 'success');
  }
  switchRoute('templates');
}

// Reads word/document.xml out of the .docx (a zip) and returns placeholder names
async function tplExtractPlaceholders(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(buf.buffer);

  // Locate the end-of-central-directory record, then walk the central directory
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return [];
  const entries = view.getUint16(eocd + 10, true);
  let ptr = view.getUint32(eocd + 16, true);

  for (let n = 0; n < entries; n++) {
    const method = view.getUint16(ptr + 10, true);
    const compSize = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localOffset = view.getUint32(ptr + 42, true);
    const entryName = new TextDecoder().decode(buf.subarray(ptr + 46, ptr + 46 + nameLen));

    if (entryName === 'word/document.xml') {
      const localNameLen = view.getUint16(localOffset + 26, true);
      const localExtraLen = view.getUint16(localOffset + 28, true);
      const start = localOffset + 30 + localNameLen + localExtraLen;
      const data = buf.subarray(start, start + compSize);
      let xml;
      if (method === 0) {
        xml = new TextDecoder().decode(data);
      } else {
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        xml = await new Response(stream).text();
      }
      // Word splits text into runs; strip tags so placeholders read contiguously
      const text = xml.replace(/<w:tab\/>/g, ' ').replace(/<[^>]+>/g, '');
      const names = new Set();
      const patterns = [/\{\{\s*([A-Za-z][\w ]*?)\s*\}\}/g, /«\s*([A-Za-z][\w ]*?)\s*»/g, /\[\s*([A-Za-z][\w]*)\s*\]/g];
      patterns.forEach(re => { let m; while ((m = re.exec(text))) names.add(m[1].trim()); });
      // Bookmarks are another common way templates mark fields
      const bm = /<w:bookmarkStart[^>]*w:name="([^"_][^"]*)"/g;
      let m;
      while ((m = bm.exec(xml))) names.add(m[1]);
      return [...names];
    }
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return [];
}

// ---------------------------------------------------------------------------
// Template document view (clicking a template card, not the pencil)
// ---------------------------------------------------------------------------
function tplRenderViewer(templateId) {
  const root = document.getElementById('tplViewerRoot');
  const tpl = InnomickCMSData.templates.find(t => t.id === templateId);
  if (!root) return;
  if (!tpl) { switchRoute('templates'); return; }

  const type = templateContractType(tpl);
  const code = { Service: 'SVC', Purchase: 'PUR', Construction: 'CON' }[type];
  const fileName = (tpl.fileName || `${tpl.name}.docx`).replace(/\.docx$/i, '');
  const row = (en, ar) => `<tr><td>${en}</td><td class="tpl-doc-ar" dir="rtl">${ar}</td></tr>`;

  root.innerHTML = `
    <button class="tpl-view-back" title="Back to templates" onclick="switchRoute('templates')">&#8592;</button>
    <div class="nc-word-shell tpl-view-shell">
      <div class="tpl-view-titlebar">
        <span class="tpl-view-word">W</span>
        <span class="tpl-view-file">${fileName}</span>
        <span class="tpl-view-cloud">&#9729;</span>
      </div>
      <div class="nc-word-menubar">
        <span>File</span><span class="active">Home</span><span>Insert</span><span>Layout</span><span>References</span><span>Review</span><span>View</span><span>Help</span>
        <span style="margin-left: auto; font-size: 12px; color: #64748b;">Viewing (read-only)</span>
      </div>
      <div class="nc-word-canvas">
        <div class="nc-word-page tpl-doc-page">
          ${tpl.design && window.UAT_TEMPLATES && UAT_TEMPLATES.designs[tpl.design] ? UAT_TEMPLATES.designs[tpl.design] : `
          <p><strong><u>${type} Contract type Template – ${code}:</u></strong></p>
          <table class="tpl-doc-table">
            ${row('<div style="text-align:center"><u>“Contract Short Description”</u></div>Ref: “Based on Policy” - <u>Date</u>: {Date}',
                  '<div style="text-align:center"><u>“وصف مختصر للعقد”</u></div>مرجع: “بناءً على السياسة” - التاريخ: {Date}')}
            ${row('<strong>Scope of Supply</strong><br>{Description}', '<strong>نطاق التوريد</strong><br>{Description}')}
          </table>`}
        </div>
      </div>
    </div>`;
}


// ---------------------------------------------------------------------------
// Use the live template list exported from UAT (client names already replaced)
// ---------------------------------------------------------------------------
if (window.UAT_TEMPLATES) {
  InnomickCMSData.templates = UAT_TEMPLATES.list.map((t, i) => ({
    id: `TPL-${i + 1}`,
    name: t.name,
    type: t.type,
    contractType: t.type,
    category: t.type,
    updated: new Date(t.created).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    createdAt: Date.parse(t.created),
    author: 'Contract Admin',
    fileName: `${t.name}.docx`,
    fields: t.fields,
    design: t.design
  }));
}
