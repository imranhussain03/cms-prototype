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
  const add = f => { if (f && f.name && !lib[f.name]) lib[f.name] = f; };
  (InnomickCMSData.customFields || []).forEach(add);
  if (window.UAT_TEMPLATES) {
    UAT_TEMPLATES.list.forEach(t => t.fields.forEach(add));
    (UAT_TEMPLATES.fields || []).forEach(add);
  }
  return lib;
}

function tplMapPlaceholder(name) {
  // UAT only auto-maps a placeholder whose name is exactly an existing field name
  const f = tplFieldLibrary()[name];
  return { name, field: f ? { ...f, name } : null, auto: !!f };
}

function tplRenderEditor(param) {
  const p = String(param || '');
  if (p.startsWith('new:')) {
    Object.assign(TplState, { mode: 'create', contractType: p.slice(4) || 'Service', template: null, fileName: '', fileSize: 0, designHtml: '', placeholders: [] });
  } else {
    const tpl = InnomickCMSData.templates.find(t => t.id === p) || InnomickCMSData.templates[0];
    // Like the live page, the mapping table lists placeholders in the order they appear in the document
    const doc = tplDesignHtml(tpl);
    const at = f => { const i = Math.max(doc.indexOf(`{${f.name}}`), doc.indexOf(`{${f.name.replace(/ /g, '_')}}`)); return i < 0 ? Infinity : i; };
    Object.assign(TplState, {
      mode: 'edit', template: tpl, contractType: tpl.contractType || 'Service',
      fileName: tpl.fileName || `${tpl.name}.docx`, fileSize: tpl.fileSize || 0, designHtml: tpl.designHtml || '',
      placeholders: (tpl.fields || []).slice().sort((a, b) => at(a) - at(b)).map(f => ({ name: f.name, field: f, auto: true }))
    });
  }
  const root = document.getElementById('tplEditorRoot');
  if (root) root.innerHTML = '';
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
        <button class="btn-teal-primary tpl-ed-save" onclick="tplSave()"><span>+</span> ${isCreate ? 'Save' : 'Update'} Template</button>
      </div>
      <div class="tpl-ed-form">
        ${isCreate ? `<div class="tpl-type-caption">Create Template for Contract Type - ${TplState.contractType}</div>` : ''}
        <div class="tpl-ed-name-row">
          <label for="tplEditorName">Template Name</label>
          <input type="text" class="tpl-ed-name" id="tplEditorName" placeholder="Enter Template Name" value="${(name || '').replace(/"/g, '&quot;')}">
        </div>
        <div class="tpl-ed-upload-label">${TplState.fileName ? 'Uploaded' : 'Upload'} Contract Template</div>
        <div>
            ${TplState.fileName ? `
              <div class="tpl-file-chip">
                <span class="tpl-file-icon">&#128196;</span>
                <div class="tpl-file-text"><strong>${TplState.fileName}</strong><em>${kb ? kb.trim() : isCreate ? '(New file)' : '(Existing file)'}</em></div>
                <button class="tpl-file-remove" title="Remove file" onclick="tplRemoveFile()">&#10005;</button>
              </div>` : `
              <label class="file-drop-zone tpl-drop" id="tplDropZone">
                <span style="font-size: 20px; color: #64748b;">&#8679;</span>
                <div style="font-size: 14px; font-weight: 700; color: #334155;">Browse</div>
                <div style="font-size: 12px; color: #64748b;">Drag &amp; drop file here, or browse</div>
                <div style="font-size: 11px; color: #94a3b8;">Supports: Docx (Max 50MB)</div>
                <input type="file" accept=".docx,.doc,.htm,.html,.txt" style="display: none;" onchange="tplHandleFile(this.files[0])">
              </label>`}
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
                    ? `<label class="tpl-map-ok"><input type="checkbox" checked onclick="return false"> Auto-Mapped</label>`
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
  if (!/\.(docx|doc|html?|txt)$/i.test(file.name)) {
    showToast('Please upload a Word document (.docx or .doc)', 'info');
    return;
  }
  if (file.size > 50 * 1024 * 1024) {
    showToast(`${file.name} exceeds the 50MB limit`, 'info');
    return;
  }
  let parsed = { names: [], html: '' };
  try {
    parsed = await tplReadAny(file);
  } catch (err) {
    showToast(err.userMessage || 'Could not read this document', 'info');
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
    tplShowAlert('Every Fields Should be Created and Mapped.');
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

// Reads any document a person is likely to attach: a real .docx (zip), a Word file saved
// as a web page (which is what this prototype's own Download produces), or plain text
async function tplReadAny(file) {
  const head = new Uint8Array(await file.arrayBuffer());
  if (head[0] === 0x50 && head[1] === 0x4b) return tplReadDocx(file);
  if (head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0) {
    const err = new Error('binary doc');
    err.userMessage = 'This is an old Word 97-2003 file. Open it in Word, choose Save As > Word Document (.docx), then upload it.';
    throw err;
  }
  const text = new TextDecoder('utf-8').decode(head).replace(/^\uFEFF/, '');
  let html;
  if (/^\s*</.test(text)) {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    doc.querySelectorAll('script, iframe, object, embed, link, meta, title').forEach(el => el.remove());
    doc.querySelectorAll('*').forEach(el => [...el.attributes].forEach(a => { if (/^on/i.test(a.name)) el.removeAttribute(a.name); }));
    html = doc.body ? doc.body.innerHTML : '';
  } else {
    const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = text.split(/\r?\n/).filter(l => l.trim()).map(l => `<p>${esc(l)}</p>`).join('');
  }
  const names = [];
  const seen = new Set();
  html.replace(/\{([^{}<>]{1,60})\}/g, (m, n) => { const c = tplCleanName(n); if (c && !seen.has(c.toLowerCase())) { seen.add(c.toLowerCase()); names.push(c); } return m; });
  return { names, html };
}

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
  if (!root) return;
  // A request's letter or draft ("DOC:<request id>:<letter|draft>") opens in the same viewer, as on the live site
  const docRef = String(templateId || '').match(/^DOC:(.+):(letter|draft)$/);
  let tpl = null, fileName, docHtml, back = "switchRoute('templates')";
  if (docRef) {
    const rec = NCState.records[docRef[1]];
    if (!rec) { switchRoute('requests'); return; }
    NCState.current = rec;
    const d = rec.docs[docRef[2]] || {};
    d.stamp = d.stamp || String(Date.now());
    fileName = `${rec.refNo.replace(/\//g, '-')} ${docRef[2] === 'letter' ? 'Request Letter' : 'Draft'} ${d.stamp}`;
    docHtml = ncDocHtml(docRef[2]);
    back = `location.hash = '${(CMSState.docBack || '#/new-contract-details/' + rec.id).replace(/'/g, '')}'`;
  } else {
    tpl = InnomickCMSData.templates.find(t => t.id === templateId);
    if (!tpl) { switchRoute('templates'); return; }
    fileName = (tpl.fileName || `${tpl.name}.docx`).replace(/\.docx$/i, '');
  }
  const type = tpl ? templateContractType(tpl) : '';
  const code = { Service: 'SVC', Purchase: 'PUR', Construction: 'CON' }[type];
  const row = (en, ar) => `<tr><td>${en}</td><td class="tpl-doc-ar" dir="rtl">${ar}</td></tr>`;

  const user = InnomickCMSData.currentUser.name;
  const i = (d, w = 16) => `<svg width="${w}" height="${w}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const tool = (d, title, caret) => `<span class="wo-tool" title="${title}">${i(d)}${caret ? '<span class="wo-caret">&#8964;</span>' : ''}</span>`;
  root.innerHTML = `
    <button class="tpl-view-back wo-back" title="Back" onclick="${back}">&#8592;</button>
    <div class="wo-frame">
      <div class="wo-top">
        <span class="wo-waffle">${i('<circle cx="3" cy="3" r=".9"/><circle cx="8" cy="3" r=".9"/><circle cx="13" cy="3" r=".9"/><circle cx="3" cy="8" r=".9"/><circle cx="8" cy="8" r=".9"/><circle cx="13" cy="8" r=".9"/><circle cx="3" cy="13" r=".9"/><circle cx="8" cy="13" r=".9"/><circle cx="13" cy="13" r=".9"/>', 18)}</span>
        <span class="wo-word-icon">W</span>
        <span class="wo-file" title="${fileName}">${fileName}</span>
        <span class="wo-saved" title="Saved">${i('<path d="M4.5 12.5h7a3 3 0 0 0 .4-6 4 4 0 0 0-7.7 1 2.5 2.5 0 0 0 .3 5z"/><path d="M6.3 9.4l1.3 1.3 2.4-2.6"/>', 18)}</span>
        <div class="wo-search">${i('<circle cx="7" cy="7" r="4.5"/><path d="M10.3 10.3L14 14"/>', 14)}<span>Search for tools, help, and more (Alt + Q)</span></div>
        <span class="wo-gear" title="Settings">${i('<circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/>', 18)}</span>
        <span class="wo-avatar" title="${user}">${user.charAt(0)}</span>
      </div>
      <div class="wo-menu">
        <span>File</span><span class="active">Home</span><span>Insert</span><span>Layout</span><span>References</span><span>Review</span><span>View</span><span>Help</span>
        <div class="wo-menu-right">
          <span class="wo-pill">${i('<path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z"/>', 14)} Comments</span>
          <span class="wo-pill">${i('<path d="M1.5 9l3-4 3 5 3-6 4 5"/>', 14)} Catch up</span>
          <span class="wo-pill">${i('<path d="M10.5 2.5l3 3-8 8h-3v-3z"/>', 14)} Editing <span class="wo-caret">&#8964;</span></span>
          <span class="wo-share">${i('<circle cx="5" cy="6" r="2"/><path d="M1.5 13a3.5 3.5 0 0 1 7 0M10 4.5h4.5M12.2 2.3v4.4"/>', 14)} Share <span class="wo-caret">&#8964;</span></span>
        </div>
      </div>
      <div class="wo-ribbon">
        ${tool('<path d="M5 3.5L2.5 6 5 8.5"/><path d="M2.5 6H10a3.5 3.5 0 0 1 0 7H7"/>', 'Undo', true)}
        ${tool('<rect x="3" y="3" width="10" height="11" rx="1"/><path d="M6 2h4v2.5H6z"/>', 'Paste', true)}
        ${tool('<path d="M3 2.5h8v3H3zM11 4h2v3.5H7.5V10M6.5 10h2v4h-2z"/>', 'Format Painter')}
        <span class="wo-sep"></span>
        <span class="wo-box wo-font">Times New Ro... <span class="wo-caret">&#8964;</span></span>
        <span class="wo-box wo-size">12 <span class="wo-caret">&#8964;</span></span>
        <span class="wo-tool wo-txt">A<sup>&#708;</sup></span><span class="wo-tool wo-txt">A<sup>&#709;</sup></span>
        <span class="wo-sep"></span>
        <span class="wo-tool wo-txt"><b>B</b></span><span class="wo-tool wo-txt"><i>I</i></span><span class="wo-tool wo-txt"><u>U</u></span>
        ${tool('<path d="M4 10l5-7 3 2-5 7H4z"/><path d="M2 14.5h12" stroke="#f5d000" stroke-width="2"/>', 'Highlight', true)}
        <span class="wo-tool wo-txt wo-color" title="Font Color">A<span class="wo-caret">&#8964;</span></span>
        <span class="wo-tool wo-txt">&middot;&middot;&middot;</span>
        <span class="wo-sep"></span>
        ${tool('<circle cx="3" cy="4" r=".8"/><circle cx="3" cy="8" r=".8"/><circle cx="3" cy="12" r=".8"/><path d="M6 4h8M6 8h8M6 12h8"/>', 'Bullets', true)}
        ${tool('<path d="M2.5 3h1v3M2.5 9.5h1.5l-1.5 2h1.5M6 4h8M6 8h8M6 12h8"/>', 'Numbering', true)}
        ${tool('<path d="M2 3h12M6 6.5h8M6 9.5h8M2 13h12M2 6.5l2 1.5-2 1.5"/>', 'Increase Indent')}
        ${tool('<path d="M2 3h12M2 6.5h12M2 9.5h12M2 13h8"/>', 'Align', true)}
        ${tool('<rect x="2.5" y="2.5" width="11" height="11"/><path d="M2.5 8h11M8 2.5v11"/>', 'Borders', true)}
        ${tool('<path d="M3 9l5-6 5 6-5 4z"/>', 'Shading', true)}
        <span class="wo-tool wo-txt">&middot;&middot;&middot;</span>
        <span class="wo-sep"></span>
        <span class="wo-box wo-style">Normal <span class="wo-caret">&#8964;</span></span>
        <span class="wo-sep"></span>
        ${tool('<circle cx="7" cy="7" r="4.5"/><path d="M10.3 10.3L14 14"/>', 'Find', true)}
        ${tool('<rect x="6" y="1.5" width="4" height="8" rx="2"/><path d="M3.5 7.5a4.5 4.5 0 0 0 9 0M8 12v2.5"/>', 'Dictate', true)}
        <span class="wo-editor">${i('<path d="M2 13.5h12M4 11l6.5-8.5 2 1.5L6 12.5H4z"/>', 16)} Editor</span>
      </div>
      <div class="wo-canvas">
        <span class="wo-pane" title="Navigation">${i('<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M6 2.5v11"/>', 16)}</span>
        <div class="wo-page tpl-doc-page">
          ${docHtml !== undefined ? docHtml : tplDesignHtml(tpl) ? tplDesignHtml(tpl) : `
          <p><strong><u>${type} Contract type Template – ${code}:</u></strong></p>
          <table class="tpl-doc-table">
            ${row('<div style="text-align:center"><u>“Contract Short Description”</u></div>Ref: “Based on Policy” - <u>Date</u>: {Date}',
                  '<div style="text-align:center"><u>“وصف مختصر للعقد”</u></div>مرجع: “بناءً على السياسة” - التاريخ: {Date}')}
            ${row('<strong>Scope of Supply</strong><br>{Description}', '<strong>نطاق التوريد</strong><br>{Description}')}
          </table>`}
        </div>
      </div>
      <div class="wo-status">
        <span id="woPages">Page 1 of 1</span><span id="woWords">0 words</span><span>English (India)</span><span>Text Predictions: Off</span><span>Editor Suggestions: Showing</span>
        <span class="wo-status-right"><span>&minus;</span><span class="wo-zoom"><span></span></span><span>+</span><span>100%</span><span>Fit</span><span>Give Feedback to Microsoft</span></span>
      </div>
    </div>`;
  const words = (root.querySelector('.wo-page').textContent.match(/\S+/g) || []).length;
  document.getElementById('woWords').textContent = `${words} words`;
  document.getElementById('woPages').textContent = `Page 1 of ${Math.max(1, Math.ceil(words / 350))}`;
}


// ---------------------------------------------------------------------------
// The ten Innomick contract templates (bilingual, English only and Arabic only)
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
    design: t.design,
    base: 4
  }));
  window.CMS_BASE_TEMPLATES = InnomickCMSData.templates.slice();
}

// Same popup the live page shows when a template still has unmapped placeholders
function tplShowAlert(message) {
  let m = document.getElementById('tplAlertModal');
  if (!m) {
    m = document.createElement('div');
    m.className = 'modal-overlay';
    m.id = 'tplAlertModal';
    document.body.appendChild(m);
  }
  m.innerHTML = `
    <div class="modal-box tpl-alert-box">
      <div class="tpl-alert-head"><button class="tpl-alert-x" title="Close" onclick="closeModal('tplAlertModal')">&#10005;</button></div>
      <div class="tpl-alert-msg">${message}</div>
      <div class="tpl-alert-foot"><button class="tpl-alert-ok" onclick="closeModal('tplAlertModal')">Okay</button></div>
    </div>`;
  openModal('tplAlertModal');
}
