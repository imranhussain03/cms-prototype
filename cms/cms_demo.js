/**
 * Innomick Technologies - CMS Prototype
 * Demo quick-fill: every field starts blank, and clicking into an empty field fills just that
 * field with sample data. Filling a vendor also selects it as the recommended vendor.
 */
(function () {
  const AR = /[؀-ۿ]/;
  const SKIP_TYPES = ['hidden', 'file', 'checkbox', 'radio', 'button', 'submit', 'reset', 'search', 'range', 'color', 'image'];
  const VENDORS = ['Delta Engineering', 'Orbit Networks', 'Zenith Facility Services', 'Gulf Office Supplies', 'Alpha Tech'];
  let filling = false;

  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => ymd(new Date());
  const inAYear = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1); return ymd(d); };
  const shortId = () => String(Date.now()).slice(-5);

  function labelOf(el) {
    if (el.id) {
      const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (l) return l.textContent;
    }
    const prev = el.previousElementSibling;
    if (prev && prev.tagName === 'LABEL') return prev.textContent;
    let p = el.parentElement;
    for (let i = 0; i < 3 && p; i++) {
      const sib = p.previousElementSibling;
      if (sib && sib.tagName === 'LABEL') return sib.textContent;
      const own = [...p.children].find(c => c.tagName === 'LABEL' && !c.contains(el));
      if (own) return own.textContent;
      p = p.parentElement;
    }
    const th = el.closest('td') && el.closest('table') && el.closest('table').querySelectorAll('th')[el.closest('td').cellIndex];
    return th ? th.textContent : '';
  }

  function hintOf(el) {
    return [el.id, el.name, el.className, el.placeholder, el.getAttribute('aria-label'), labelOf(el)].join(' ').toLowerCase();
  }

  function excluded(el) {
    if (el.disabled || el.readOnly) return true;
    if (el.tagName === 'INPUT' && SKIP_TYPES.includes((el.type || '').toLowerCase())) return true;
    // A styled dropdown hides its <select> and shows a button next to it
    const shown = el.dataset.uiEnhanced && el.nextSibling && el.nextSibling.classList ? el.nextSibling : el;
    if (!shown.getClientRects().length) return true;
    const own = [el.id, el.className, el.placeholder].join(' ').toLowerCase();
    if (/search|filter|sort|go to page/.test(own)) return true;
    return !!el.closest('thead, .approvals-pagination-bar, .page-direct, [class*="filter"], [id*="Filter"], .sp-account, .m365-topbar, .global-search-box');
  }

  // A sample value that fits the field, worked out from its id, placeholder and label
  function sampleText(el, h, state) {
    const rtl = el.dir === 'rtl' || AR.test(h);
    if (rtl) {
      if (/تاريخ/.test(h)) return today();
      return /اسم|المورد|شركه/.test(h) ? 'شركة إنوميك للتقنيات' : 'نص تجريبي للعرض';
    }
    if (el.id === 'tplNfLabel') {
      const n = document.getElementById('tplNfName');
      return n ? n.value.replace(/_/g, ' ') : 'Demo Field';
    }
    if (/justif|description|remark|comment|reason|scope|revision|summary|note|terms|clause/.test(h)) {
      return /recommend/.test(h) ? 'Best price and delivery time among the quotations received.'
        : /vendor/.test(h) ? 'Three vendors were invited to quote; all met the technical requirements.'
        : 'Annual service covering installation, support and maintenance as per the agreed scope.';
    }
    if (/vendor|supplier/.test(h)) return VENDORS[state.vendor++ % VENDORS.length];
    if (/email/.test(h)) return 'demo.user@innomicktechnologies.com';
    if (/phone|mobile/.test(h)) return '96550012345';
    if (/\bref|reference/.test(h)) return `INM-DEMO-${shortId()}`;
    if (/budget/.test(h)) return 'BUD-2026-014';
    if (/addendum/.test(h)) return 'Addendum 1';
    if (/template ?name|tpleditorname|wftemplatename/.test(h)) return `Demo Template ${shortId().slice(-3)}`;
    if (/step/.test(h)) return 'Manager Approval';
    if (/ceo|approver|manager|contracter|contractor|signator|represent/.test(h)) return 'Daniel Mathew';
    if (/branch/.test(h)) return 'Innomick';
    if (/department/.test(h)) return 'Information Technology';
    if (/company/.test(h)) return 'Innomick Technologies';
    if (/address|location/.test(h)) return 'Kuwait City, Block 1, Building 10';
    if (/license|licence|civil|paci|registration|crn|quote|invoice|code|number|\bno\b|\bid\b/.test(h)) return String(100200 + (state.num++));
    if (/name|title/.test(h)) return 'Office Network Upgrade';
    return 'Demo value';
  }

  function sampleNumber(h, state) {
    if (/price|value|amount|cost|fee|total/.test(h)) return String(12000 + 500 * (state.price++));
    if (/notice/.test(h)) return '2';
    if (/due/.test(h)) return '2';
    if (/qty|quantity|users|count/.test(h)) return '10';
    return String(100 + (state.num++));
  }

  function setValue(el, v) {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.classList.remove('nc-invalid');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    if (el.tagName === 'SELECT' && typeof uiSyncSelect === 'function') uiSyncSelect(el);
  }

  // Fills the one field that was clicked
  function fillField(el) {
    if (filling || el.value || excluded(el)) return;
    filling = true;
    try {
      // A table row (a vendor) gets its own sample, so each row differs
      const row = el.closest('tr');
      const n = row && row.parentElement ? [...row.parentElement.children].indexOf(row) : 0;
      const state = { vendor: n, price: n, num: n };
      if (el.tagName === 'SELECT') {
        const opt = [...el.options].find(o => o.value && !o.disabled);
        if (opt) setValue(el, opt.value);
      } else {
        const h = hintOf(el);
        const type = (el.type || '').toLowerCase();
        setValue(el, type === 'date' ? (/end|expir|completion|to date|enddate/.test(h) ? inAYear() : today())
          : type === 'number' ? sampleNumber(h, state)
          : type === 'email' ? 'demo.user@innomicktechnologies.com'
          : sampleText(el, h, state));
      }
      // Filling a vendor also selects it as the recommended vendor, if none is chosen yet
      const radio = row && row.querySelector('input[type=radio]');
      if (radio && !radio.disabled) {
        const group = radio.name ? [...document.getElementsByName(radio.name)] : [radio];
        if (!group.some(r => r.checked)) radio.click();
      }
    } finally {
      filling = false;
    }
  }

  document.addEventListener('focusin', e => {
    const el = e.target;
    if (filling || !(el instanceof HTMLElement) || !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    if (!el.closest('.modal-box, .cms-view-section')) return;
    // Let the click land first, then fill the field
    setTimeout(() => fillField(el), 0);
  });

  // Clicking a styled dropdown that is still empty picks its first option
  document.addEventListener('click', e => {
    const trigger = e.target instanceof Element && e.target.closest('.ui-dd-trigger');
    if (filling || !trigger) return;
    const sel = trigger.parentElement && trigger.parentElement.previousSibling;
    if (!sel || sel.tagName !== 'SELECT' || !sel.closest('.modal-box, .cms-view-section')) return;
    setTimeout(() => fillField(sel), 0);
  }, true);

  window.cmsDemoFill = fillField;
})();
