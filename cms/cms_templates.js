/**
 * Innomick Technologies - CMS Prototype
 * Contract template editor: "Create Contract Template" (after picking a contract type)
 * and "Edit Contract Template". Uploading a .docx reads its placeholders (bookmarks or
 * {placeholder} text) in the browser; each is auto-mapped to a known field or a new field
 * is created for it, like the live system. The document itself is kept as the template design.
 */

const TplState = {
  mode: 'edit',      // 'create' | 'edit'
  contractType: '',
  template: null,
  fileName: '',
  fileSize: 0,
  designHtml: '',
  placeholders: []   // [{ name, field: {name,label,type,required,arabic,choices} | null, auto }]
};

// Every field already defined in the system (live template fields + fields created here)
function tplFieldLibrary() {
  const lib = {};
  const add = f => { if (f && f.name && !lib[f.name.toLowerCase()]) lib[f.name.toLowerCase()] = f; };
  (InnomickCMSData.customFields || []).forEach(add);
  if (window.UAT_TEMPLATES) UAT_TEMPLATES.list.forEach(t => t.fields.forEach(add));
  return lib;
}

function tplMapPlaceholder(name) {
  const f = tplFieldLibrary()[name.toLowerCase()];
  return { name, field: f ? { ...f, name } : null, auto: !!f };
}

function tplRenderEditor(param) {
  const p = String(param || '');
  if (p.startsWith('new:')) {
    Object.assign(TplState, { mode: 'create', contractType: p.slice(4) || 'Service', template: null, fileName: '', fileSize: 0, designHtml: '', placeholders: [] });
  } else {
    const tpl = InnomickCMSData.templates.find(t => t.id === p) || InnomickCMSData.templates[0];
    Object.assign(TplState, {
      mode: 'edit', template: tpl, contractType: tpl.contractType || 'Service',
      fileName: tpl.fileName || `${tpl.name}.docx`, fileSize: tpl.fileSize || 0, designHtml: tpl.designHtml || '',
      placeholders: (tpl.fields || []).map(f => ({ name: f.name, field: f, auto: true }))
    });
  }
  tplDraw();
}

function tplDraw() {
  const root = document.getElementById('tplEditorRoot');
  if (!root) return;
  const isCreate = TplState.mode === 'create';
  const nameVal = (document.getElementById('tplEditorName') || {}).value;
  const name = nameVal !== undefined ? nameVal : (TplState.template ? TplState.template.name : '');
  const kb = TplState.fileSize ? ` (${(TplState.fileSize / 1024).toFixed(2)} KB)` : '';

  root.innerHTML = `
    <div class="tpl-ed">
      <div class="tpl-ed-head">
        <button class="tpl-ed-back" title="Back" onclick="switchRoute('templates')">&#8249;</button>
        <h2>${isCreate ? 'Create' : 'Edit'} Contract Template</h2>
        <button class="btn-teal-primary" onclick="tplSave()">+ ${isCreate ? 'Save' : 'Update'} Template</button>
      </div>
      ${isCreate ? `<div class="tpl-type-caption">Create Template for Contract Type - ${TplState.contractType}</div>` : ''}
      <div class="tpl-ed-card">
        <div class="tpl-form-row">
          <label>Template Name</label>
          <input type="text" class="detail-field-input" id="tplEditorName" placeholder="Enter Template Name" value="${(name || '').replace(/"/g, '&quot;')}">
        </div>
        <div class="tpl-form-row tpl-form-row-top">
          <label>${TplState.fileName ? 'Uploaded' : 'Upload'} Contract Template</label>
          <div>
            ${TplState.fileName ? `
              <div class="tpl-file-chip">
                <span>&#128196; <strong>${TplState.fileName}</strong><em>${kb || (isCreate ? ' (New file)' : ' (Existing file)')}</em></span>
                <button class="tpl-file-remove" title="Remove file" onclick="tplRemoveFile()">&#10005;</button>
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
      </div>

      ${TplState.placeholders.length ? `
        <div class="tpl-ed-card">
          <table class="tpl-map">
            <thead><tr><th>Placeholder Detected</th><th>Mapped with</th><th>Action</th></tr></thead>
            <tbody>
              ${TplState.placeholders.map((ph, i) => `
                <tr>
                  <td ${/[؀-ۿ]/.test(ph.name) ? 'dir="rtl" style="text-align:left;"' : ''}>${ph.name}</td>
                  <td>${ph.field ? `<input class="tpl-map-field" disabled value="${ph.field.label.replace(/"/g, '&quot;')}">` : 'N/A'}</td>
                  <td>${ph.field
                    ? `<label class="tpl-map-ok"><input type="checkbox" checked onclick="return false"> ${ph.auto ? 'Auto-Mapped' : 'Mapped'}</label>`
                    : `<button class="btn-teal-primary tpl-new-field" onclick="tplOpenNewField(${i})">+ Create New Field</button>`}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : TplState.fileName && isCreate ? '<div class="tpl-ed-card ap-empty">No placeholders were found in this document.</div>' : ''}
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
  let parsed = { names: [], html: '' };
  try {
    parsed = await tplReadDocx(file);
  } catch (err) {
    showToast('Could not read this document', 'info');
    return;
  }
  TplState.fileName = file.name;
  TplState.fileSize = file.size;
  TplState.designHtml = parsed.html;
  TplState.placeholders = parsed.names.map(tplMapPlaceholder);
  tplDraw();
  showToast(`${parsed.names.length} placeholder(s) detected in ${file.name}`, parsed.names.length ? 'success' : 'info');
}

function tplRemoveFile() {
  Object.assign(TplState, { fileName: '', fileSize: 0, designHtml: '', placeholders: [] });
  tplDraw();
}

// ---- Create New Field (for a placeholder with no matching field) ----
function tplOpenNewField(i) {
  const ph = TplState.placeholders[i];
  TplState.newFieldIndex = i;
  document.getElementById('tplNewFieldTitle').textContent = `Create New Field - ${ph.name}`;
  document.getElementById('tplNfName').value = ph.name;
  document.getElementById('tplNfLabel').value = '';
  document.getElementById('tplNfType').value = '';
  document.getElementById('tplNfChoices').value = '';
  document.getElementById('tplNfChoicesRow').style.display = 'none';
  document.getElementById('tplNfRequired').checked = false;
  openModal('tplNewFieldModal');
}

function tplNewFieldTypeChanged() {
  document.getElementById('tplNfChoicesRow').style.display = document.getElementById('tplNfType').value === 'choice' ? '' : 'none';
}

function tplSubmitNewField() {
  const label = document.getElementById('tplNfLabel').value.trim();
  const type = document.getElementById('tplNfType').value;
  const choices = document.getElementById('tplNfChoices').value.split(',').map(x => x.trim()).filter(Boolean).join(',');
  if (!label || !type) { showToast('Please enter Display Name and select Field Type', 'info'); return; }
  if (type === 'choice' && !choices) { showToast('Please enter the dropdown options', 'info'); return; }
  const ph = TplState.placeholders[TplState.newFieldIndex];
  const field = { name: ph.name, label, type, required: document.getElementById('tplNfRequired').checked, arabic: /[؀-ۿ]/.test(ph.name + label), choices };
  InnomickCMSData.customFields = (InnomickCMSData.customFields || []).concat([field]);
  ph.field = field;
  ph.auto = false;
  closeModal('tplNewFieldModal');
  tplDraw();
  showToast(`Field "${label}" created`, 'success');
}

function tplSave() {
  const nameEl = document.getElementById('tplEditorName');
  const name = nameEl.value.trim();
  if (!name) {
    showToast('Please enter a Template Name', 'info');
    nameEl.classList.add('nc-invalid');
    return;
  }
  if (!TplState.fileName) { showToast('Please upload the contract template document', 'info'); return; }
  if (TplState.placeholders.some(p => !p.field)) {
    showToast('Create a field for every unmapped placeholder before saving', 'info');
    return;
  }
  const fields = TplState.placeholders.map(p => ({ ...p.field, name: p.name }));
  if (TplState.mode === 'create') {
    InnomickCMSData.templates.unshift({
      id: `TPL-${Date.now()}`, name, type: TplState.contractType, contractType: TplState.contractType,
      category: TplState.contractType, updated: 'Today', createdAt: Date.now(), author: InnomickCMSData.currentUser.name,
      fileName: TplState.fileName, fileSize: TplState.fileSize, designHtml: TplState.designHtml, fields
    });
    showToast(`Template "${name}" created`, 'success');
  } else {
    Object.assign(TplState.template, { name, fileName: TplState.fileName, fields, updated: 'Today' });
    if (TplState.designHtml) TplState.template.designHtml = TplState.designHtml;
    showToast(`Template "${name}" updated`, 'success');
  }
  switchRoute('templates');
}

// The document a template renders: an uploaded design, or the live template's design
function tplDesignHtml(tpl) {
  if (!tpl) return '';
  if (tpl.designHtml) return tpl.designHtml;
  return tpl.design && window.UAT_TEMPLATES ? (UAT_TEMPLATES.designs[tpl.design] || '') : '';
}

// ---- .docx reading: placeholders + an HTML copy of the document ----
async function tplDocxXml(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(buf.buffer);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a docx');
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
      const start = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
      const data = buf.subarray(start, start + compSize);
      if (method === 0) return new TextDecoder().decode(data);
      return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    }
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error('no document.xml');
}

// Bookmark names like FIELD_CEOName -> CEOName (the prefix is only a marker)
function tplCleanName(n) { return n.replace(/^FIELD_/i, '').trim(); }

async function tplReadDocx(file) {
  const xml = await tplDocxXml(file);
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const d = new DOMParser().parseFromString(xml, 'application/xml');
  const names = [];
  const seen = new Set();
  const note = n => { const c = tplCleanName(n); if (c && !seen.has(c.toLowerCase())) { seen.add(c.toLowerCase()); names.push(c); } };
  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kids = (el, n) => [...el.childNodes].filter(c => c.localName === n);
  const openMarks = {};  // bookmark id -> true while its text is replaced by the placeholder

  function run(r) {
    if (Object.keys(openMarks).length) return '';
    const pr = kids(r, 'rPr')[0];
    let t = '';
    for (const c of r.childNodes) {
      if (c.localName === 't') t += esc(c.textContent);
      else if (c.localName === 'tab') t += '&emsp;';
      else if (c.localName === 'br') t += '<br>';
    }
    if (!t) return '';
    const on = n => { const x = pr && kids(pr, n)[0]; if (!x) return false; const v = x.getAttributeNS(W, 'val'); return !v || (v !== '0' && v !== 'false' && v !== 'none'); };
    if (on('b')) t = `<b>${t}</b>`;
    if (on('u')) t = `<u>${t}</u>`;
    if (on('i')) t = `<i>${t}</i>`;
    return t;
  }
  function inline(el) {
    let h = '';
    for (const c of el.childNodes) {
      if (c.localName === 'r') h += run(c);
      else if (c.localName === 'bookmarkStart') {
        const nm = c.getAttributeNS(W, 'name') || '';
        if (nm && !nm.startsWith('_')) { note(nm); h += `{${tplCleanName(nm)}}`; openMarks[c.getAttributeNS(W, 'id')] = true; }
      } else if (c.localName === 'bookmarkEnd') delete openMarks[c.getAttributeNS(W, 'id')];
      else if (['hyperlink', 'ins', 'smartTag', 'fldSimple', 'sdt', 'sdtContent'].includes(c.localName)) h += inline(c);
    }
    return h;
  }
  function para(p) {
    const pr = kids(p, 'pPr')[0];
    const jc = pr && kids(pr, 'jc')[0] ? kids(pr, 'jc')[0].getAttributeNS(W, 'val') : '';
    const rtl = pr && kids(pr, 'bidi').length;
    const al = { center: 'center', right: 'right', end: 'right', both: 'justify' }[jc] || '';
    return `<p${rtl ? ' dir="rtl"' : ''}${al ? ` style="text-align:${al}"` : ''}>${inline(p) || '&nbsp;'}</p>`;
  }
  function tbl(t) {
    return '<table>' + kids(t, 'tr').map(tr => '<tr>' + kids(tr, 'tc').map(tc => {
      const pr = kids(tc, 'tcPr')[0];
      const sp = pr && kids(pr, 'gridSpan')[0] ? kids(pr, 'gridSpan')[0].getAttributeNS(W, 'val') : '';
      return `<td${sp ? ` colspan="${sp}"` : ''}>${block(tc)}</td>`;
    }).join('') + '</tr>').join('') + '</table>';
  }
  function block(el) {
    return [...el.childNodes].map(c => c.localName === 'p' ? para(c) : c.localName === 'tbl' ? tbl(c)
      : c.localName === 'sdt' ? block(kids(c, 'sdtContent')[0] || c) : '').join('');
  }
  const body = d.getElementsByTagNameNS(W, 'body')[0];
  let html = body ? block(body) : '';
  // Text placeholders: {{Name}}, {Name}, «Name»
  const text = html.replace(/<[^>]+>/g, '');
  [/\{\{\s*([^{}<>]{1,60}?)\s*\}\}/g, /\{([^{}<>]{1,60})\}/g, /«\s*([^«»<>]{1,60}?)\s*»/g].forEach(re => {
    let m;
    while ((m = re.exec(text))) note(m[1]);
  });
  html = html.replace(/\{\{\s*([^{}<>]{1,60}?)\s*\}\}/g, '{$1}').replace(/«\s*([^«»<>]{1,60}?)\s*»/g, '{$1}')
    .replace(/\{FIELD_([^{}<>]+)\}/gi, '{$1}');
  return { names, html };
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
          ${tplDesignHtml(tpl) ? tplDesignHtml(tpl) : `
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
