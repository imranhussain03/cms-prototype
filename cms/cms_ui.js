/**
 * Innomick Technologies - CMS Prototype
 * Shared UI behaviour that mirrors the live system:
 *  1. Custom dropdowns for filter selects (selected row highlighted, optional search + tick)
 *  2. List tables: per-column search boxes under each header and 10/20-row pagination
 * Both re-apply automatically whenever a page re-renders its markup.
 */

// ---------------------------------------------------------------------------
// 1. Custom dropdowns
// ---------------------------------------------------------------------------
// select id -> { search, check }
const UI_SELECTS = {
  reqFilterBranch: {}, reqFilterDept: {}, reqFilterVendor: {}, reqFilterCategory: {},
  cntFilterBranch: {}, cntFilterDept: {}, cntFilterVendor: {}, cntFilterCategory: {},
  csFilterBranch: {}, csFilterDept: {}, csFilterVendor: {}, csFilterCategory: {},
  cvFilterBranch: { check: true }, cvFilterDept: { search: true, check: true }, cvFilterService: { check: true },
  modalBranchSelect: {}, modalDeptSelect: {}, modalTypeSelect: {}, impDeptSelect: {}, modalTemplateTypeSelect: {}
};

function uiEnhanceSelect(sel, opts) {
  if (sel.dataset.uiEnhanced) return;
  sel.dataset.uiEnhanced = '1';

  const wrap = document.createElement('div');
  wrap.className = 'ui-dd' + (opts.check ? ' ui-dd-check' : '');
  wrap.innerHTML = `
    <button type="button" class="ui-dd-trigger"><span class="ui-dd-label"></span><span class="ui-dd-sep"></span><span class="ui-dd-chevron">&#8964;</span></button>
    <div class="ui-dd-menu">
      ${opts.search ? '<input type="text" class="ui-dd-search" placeholder="Search...">' : ''}
      <div class="ui-dd-options"></div>
    </div>`;
  sel.style.display = 'none';
  sel.parentNode.insertBefore(wrap, sel.nextSibling);

  const trigger = wrap.querySelector('.ui-dd-trigger');
  const list = wrap.querySelector('.ui-dd-options');
  const search = wrap.querySelector('.ui-dd-search');

  const draw = () => {
    const q = search ? search.value.toLowerCase() : '';
    const options = [...sel.options].filter(o => o.text.toLowerCase().includes(q));
    list.innerHTML = options.length
      ? options.map(o => `<div class="ui-dd-option ${o.value === sel.value ? 'selected' : ''}" data-value="${o.value.replace(/"/g, '&quot;')}">${opts.check && o.value === sel.value ? '&#10003;' : ''}${o.text}</div>`).join('')
      : '<div class="ui-dd-empty">No options</div>';
  };

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    if (sel.disabled) return;
    const open = wrap.classList.contains('open');
    document.querySelectorAll('.ui-dd.open').forEach(d => d.classList.remove('open'));
    if (!open) {
      if (search) search.value = '';
      draw();
      wrap.classList.add('open');
      if (search) search.focus();
    }
  });
  if (search) {
    search.addEventListener('input', draw);
    search.addEventListener('click', e => e.stopPropagation());
  }
  list.addEventListener('click', e => {
    const opt = e.target.closest('.ui-dd-option');
    if (!opt) return;
    e.stopPropagation();
    sel.value = opt.dataset.value;
    wrap.classList.remove('open');
    uiSyncSelect(sel);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  uiSyncSelect(sel);
}

// Keeps the visible label in step with the hidden select (resets, programmatic changes)
function uiSyncSelect(sel) {
  const wrap = sel.nextSibling;
  if (!wrap || !wrap.classList || !wrap.classList.contains('ui-dd')) return;
  const opt = sel.options[sel.selectedIndex];
  const label = wrap.querySelector('.ui-dd-label');
  const text = opt ? opt.text : '';
  if (label.textContent !== text) label.textContent = text;
  if (wrap.classList.contains('disabled') !== sel.disabled) wrap.classList.toggle('disabled', sel.disabled);
}

document.addEventListener('click', () => {
  document.querySelectorAll('.ui-dd.open').forEach(d => d.classList.remove('open'));
});

// ---------------------------------------------------------------------------
// 2. List tables: column search + pagination
// ---------------------------------------------------------------------------
const UI_TABLE_SCOPES = ['#view-requests', '#view-contracts', '#view-contract-selection', '#view-import', '#view-approvals'];
const UITableState = new WeakMap();   // table -> { page, size, filters: [] }

function uiSearchableColumn(text, inApprovals) {
  if (!text || /duration|progress|actions/i.test(text)) return false;
  if (inApprovals && /^status$/i.test(text)) return false;
  return true;
}

function uiEnhanceTable(table) {
  const headRow = table.tHead && table.tHead.rows[0];
  if (!headRow || !table.tBodies[0]) return;
  const inApprovals = !!table.closest('#view-approvals');

  if (!UITableState.has(table)) {
    UITableState.set(table, { page: 1, size: 10, filters: [] });
    table.classList.add('ui-list-table');
    [...headRow.cells].forEach((th, i) => {
      th.querySelectorAll('.th-search-icon').forEach(svg => svg.remove());
      const label = th.textContent.trim();
      th.innerHTML = `<div class="ui-th-title">${th.innerHTML.trim()}</div>`;
      if (uiSearchableColumn(label, inApprovals)) {
        const box = document.createElement('div');
        box.className = 'ui-th-search';
        box.innerHTML = '<span>&#9906;</span><input type="text" aria-label="Search ' + label + '">';
        const input = box.querySelector('input');
        input.addEventListener('input', () => {
          const st = UITableState.get(table);
          st.filters[i] = input.value.toLowerCase();
          st.page = 1;
          uiApplyTable(table);
        });
        input.addEventListener('click', e => e.stopPropagation());
        th.appendChild(box);
      }
    });

    const pager = document.createElement('div');
    pager.className = 'ui-pager';
    pager.innerHTML = `
      <div class="ui-pager-goto">Go to page: <input type="number" min="1" value="1"></div>
      <div class="ui-pager-nav">
        <button data-nav="first">&lt;&lt;</button><button data-nav="prev">&lt;</button>
        <span class="ui-pager-info"></span>
        <button data-nav="next">&gt;</button><button data-nav="last">&gt;&gt;</button>
      </div>
      <div class="ui-pager-size"><select><option>10</option><option>20</option></select> Items per page</div>`;
    const anchor = table.closest('.cms-table-wrapper, .approvals-table-container, .cs-contracts-table-card') || table;
    anchor.insertAdjacentElement('afterend', pager);
    table._uiPager = pager;

    pager.querySelector('.ui-pager-nav').addEventListener('click', e => {
      const nav = e.target.dataset.nav;
      if (!nav) return;
      const st = UITableState.get(table);
      const pages = table._uiPages || 1;
      st.page = nav === 'first' ? 1 : nav === 'last' ? pages : nav === 'prev' ? Math.max(1, st.page - 1) : Math.min(pages, st.page + 1);
      uiApplyTable(table);
    });
    pager.querySelector('.ui-pager-goto input').addEventListener('change', e => {
      const st = UITableState.get(table);
      st.page = Math.min(Math.max(1, parseInt(e.target.value, 10) || 1), table._uiPages || 1);
      uiApplyTable(table);
    });
    pager.querySelector('.ui-pager-size select').addEventListener('change', e => {
      const st = UITableState.get(table);
      st.size = parseInt(e.target.value, 10);
      st.page = 1;
      uiApplyTable(table);
    });
  }
  uiApplyTable(table);
}

function uiApplyTable(table) {
  const st = UITableState.get(table);
  const rows = [...table.tBodies[0].rows];
  const dataRows = rows.filter(r => !r.querySelector('td[colspan]'));

  const matches = dataRows.filter(r => st.filters.every((q, i) => !q || (r.cells[i] && r.cells[i].textContent.toLowerCase().includes(q))));
  const pages = Math.max(1, Math.ceil(matches.length / st.size));
  st.page = Math.min(st.page, pages);
  table._uiPages = pages;

  const start = (st.page - 1) * st.size;
  const visible = new Set(matches.slice(start, start + st.size));
  dataRows.forEach(r => { r.style.display = visible.has(r) ? '' : 'none'; });

  const pager = table._uiPager;
  if (!pager) return;
  pager.style.display = dataRows.length ? '' : 'none';
  pager.querySelector('.ui-pager-info').textContent = `${st.page} / ${pages} page${pages > 1 ? 's' : ''}`;
  pager.querySelector('.ui-pager-goto input').value = st.page;
  pager.querySelector('.ui-pager-goto input').max = pages;
  pager.querySelector('.ui-pager-size select').value = String(st.size);
  pager.querySelectorAll('[data-nav="first"], [data-nav="prev"]').forEach(b => { b.disabled = st.page === 1; });
  pager.querySelectorAll('[data-nav="next"], [data-nav="last"]').forEach(b => { b.disabled = st.page === pages; });
}

// ---------------------------------------------------------------------------
// Re-apply after any re-render
// ---------------------------------------------------------------------------
let uiScheduled = false;
function uiRefresh() {
  uiScheduled = false;
  Object.entries(UI_SELECTS).forEach(([id, opts]) => {
    const sel = document.getElementById(id);
    if (sel) {
      uiEnhanceSelect(sel, opts);
      uiSyncSelect(sel);
    }
  });
  UI_TABLE_SCOPES.forEach(scope => {
    document.querySelectorAll(`${scope} table`).forEach(t => {
      // Tables whose rows were re-rendered keep their header; re-run filtering + paging
      if (UITableState.has(t)) {
        if (t._uiRowsSig !== t.tBodies[0].innerHTML.length) {
          t._uiRowsSig = t.tBodies[0].innerHTML.length;
          UITableState.get(t).page = 1;
          uiApplyTable(t);
        }
      } else {
        uiEnhanceTable(t);
        t._uiRowsSig = t.tBodies[0] ? t.tBodies[0].innerHTML.length : 0;
      }
    });
  });
  // Pagers whose table was replaced are orphaned; remove them
  document.querySelectorAll('.ui-pager').forEach(p => {
    const prev = p.previousElementSibling;
    if (!prev || !(prev.matches('table') || prev.querySelector('table'))) p.remove();
  });
}

new MutationObserver(muts => {
  if (uiScheduled) return;
  // Ignore our own row show/hide changes
  if (muts.every(m => m.type === 'attributes')) return;
  uiScheduled = true;
  requestAnimationFrame(uiRefresh);
}).observe(document.body, { childList: true, subtree: true });

document.addEventListener('change', e => {
  if (e.target.tagName === 'SELECT' && e.target.dataset.uiEnhanced) uiSyncSelect(e.target);
});
// Programmatic resets (e.g. "Reset" buttons) set .value without events; resync after clicks
document.addEventListener('click', () => setTimeout(() => {
  Object.keys(UI_SELECTS).forEach(id => { const s = document.getElementById(id); if (s) uiSyncSelect(s); });
}, 0));

document.addEventListener('DOMContentLoaded', uiRefresh);
