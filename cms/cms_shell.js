/**
 * Innomick Technologies - CMS Prototype
 * SharePoint chrome behaviour: app launcher, feedback, settings, help and account panels.
 */

const SP_APPS = ['Copilot', 'Outlook', 'OneDrive', 'Word', 'Excel', 'PowerPoint', 'OneNote', 'SharePoint', 'Teams', 'Viva', 'Engage', 'Power Automate', 'More apps'];
const SP_APP_COLORS = ['#7b61ff', '#0f6cbd', '#0364b8', '#185abd', '#107c41', '#c43e1c', '#7719aa', '#038387', '#4b53bc', '#0f766e', '#5c2e91', '#0066ff', '#475569'];

const spSvg = d => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const SP_ICONS = {
  search: spSvg('<circle cx="8.5" cy="8.5" r="5.5"/><path d="M12.6 12.6 17 17"/>'),
  check: spSvg('<path d="m4 10.5 4 4 8-9"/>'),
  share: spSvg('<circle cx="8" cy="6.5" r="3.5"/><path d="M2.5 17v-1a5 5 0 0 1 8-4M15 11v6M12 14h6"/>'),
  docs: spSvg('<path d="M7 2.5h5.5L16 6v9.5H7zM12.5 2.5V6H16M7 6H4v11.5h9v-2"/>'),
  list: spSvg('<path d="M3 5h14M3 8.3h14M3 11.7h14M3 15h14"/>'),
  page: spSvg('<rect x="2.5" y="4" width="15" height="12"/><path d="M2.5 7.5h15"/>'),
  gear: spSvg('<circle cx="10" cy="10" r="2.6"/><path d="M8.6 2.5h2.8l.4 2 1.7 1 1.9-.7 1.4 2.4-1.5 1.3v2l1.5 1.3-1.4 2.4-1.9-.7-1.7 1-.4 2H8.6l-.4-2-1.7-1-1.9.7-1.4-2.4 1.5-1.3v-2L3.2 7.2l1.4-2.4 1.9.7 1.7-1z"/>'),
  wrench: spSvg('<path d="M17 5.5a4 4 0 0 1-5.4 4.3l-6.4 6.5a1.5 1.5 0 0 1-2.1-2.1l6.5-6.4A4 4 0 0 1 14 3l-2.3 2.3.8 2 2 .8z"/>'),
  heart: spSvg('<path d="M10 16.5S3 12.4 3 7.7A3.7 3.7 0 0 1 10 6a3.7 3.7 0 0 1 7 1.7c0 4.7-7 8.8-7 8.8z"/>'),
  report: spSvg('<path d="M12 17H4.5V3h9v7M7 7h4M7 10h4M7 13h2"/><path d="m15 11.5 3 5.5h-6zM15 13.7v1.2"/>'),
  idea: spSvg('<path d="M4 17V9.5l3.5-3 2.5 2 2.5-2 3.5 3V17zM4 11h12M7.5 6.5 10 3l2.5 3.5"/>'),
  external: spSvg('<rect x="3.5" y="5.5" width="11" height="11" rx="2"/><path d="M10 3.5h6.5V10M16.5 3.5 10 10"/>'),
  chevron: spSvg('<path d="m5 7.5 5 5 5-5"/>'),
  signin: spSvg('<circle cx="10" cy="10" r="8.5"/><circle cx="10" cy="8" r="2.6"/><path d="M5.2 15.8a5 5 0 0 1 9.6 0"/>')
};
const SP_HELP_LINKS = [['Get started', 'check'], ['Sharing & permissions', 'share'], ['Documents & libraries', 'docs'], ['Data & lists', 'list'], ['Pages', 'page'], ['Sites', 'gear'], ['Troubleshoot', 'wrench']];

function spPanelHtml(kind) {
  const user = InnomickCMSData.currentUser;
  if (kind === 'feedback') {
    return `
      <h3>Submit feedback to Microsoft</h3>
      <p class="sp-muted">Classify your feedback</p>
      <button class="sp-choice">${SP_ICONS.heart} Give a compliment</button>
      <button class="sp-choice">${SP_ICONS.report} Report a problem</button>
      <button class="sp-choice">${SP_ICONS.idea} Make a suggestion <span class="sp-ext">${SP_ICONS.external}</span></button>
      <div class="sp-muted sp-learn"><span>Learn about: data use, your rights, contacting you</span><span style="width:14px;flex-shrink:0;">${SP_ICONS.chevron}</span></div>
      <div class="sp-actions"><button class="btn-teal-primary" disabled>Submit</button><button class="btn-outline-teal" onclick="spClosePanel()">Cancel</button></div>`;
  }
  if (kind === 'settings') {
    return `
      <h3>Settings</h3>
      <h4>SharePoint</h4>
      ${['Add a page', 'Add an app', 'Site contents', 'Site settings', 'Site permissions', 'Site usage', 'Site reviews', 'Site performance', 'Manage dashboard']
        .map(l => `<a href="javascript:void(0)" class="sp-link" onclick="showToast('${l} opens in SharePoint', 'info')">${l}</a>`).join('')}
      <hr>
      <h4>Microsoft 365</h4>
      <a href="javascript:void(0)" class="sp-link" onclick="showToast('Microsoft 365 settings', 'info')">View all</a>`;
  }
  if (kind === 'help') {
    return `
      <h3>Help</h3>
      <div class="sp-help-search">${SP_ICONS.search}<input class="cms-input" placeholder="Search help"></div>
      <div class="sp-help-box">
        ${SP_HELP_LINKS.map(([l, i]) => `<a href="javascript:void(0)" class="sp-link sp-help-link">${SP_ICONS[i]}${l}</a>`).join('')}
      </div>
      <div class="sp-card">
        <strong>Explore SharePoint</strong>
        <div class="sp-card-img"></div>
        <p class="sp-muted">These features are rolling out and might still be coming to your organization.</p>
        <a href="javascript:void(0)" class="sp-link">Start exploring SharePoint</a>
      </div>`;
  }
  return '';
}

function spOpenPanel(kind) {
  const panel = document.getElementById('spSidePanel');
  if (panel.dataset.kind === kind && panel.classList.contains('open')) { spClosePanel(); return; }
  spCloseMenus();
  panel.dataset.kind = kind;
  document.getElementById('spSidePanelBody').innerHTML = spPanelHtml(kind);
  panel.classList.add('open');
}

function spClosePanel() {
  document.getElementById('spSidePanel').classList.remove('open');
}

function spToggleLauncher(e) {
  e.stopPropagation();
  const el = document.getElementById('spAppLauncher');
  const open = el.classList.contains('open');
  spCloseMenus();
  if (!open) {
    el.innerHTML = `
      <input class="cms-input sp-search" placeholder="Find Microsoft 365 apps">
      <div class="sp-app-grid">
        ${SP_APPS.map((a, i) => `<div class="sp-app"><span style="background:${SP_APP_COLORS[i]}">${a[0]}</span>${a}</div>`).join('')}
      </div>
      <hr>
      <div class="sp-app-grid sp-create">
        ${['Document', 'Workbook', 'Presentation', 'Survey', 'Create more'].map(a => `<div class="sp-app"><span class="sp-doc"></span>${a}</div>`).join('')}
      </div>`;
    el.classList.add('open');
  }
}

function spToggleAccount(e) {
  e.stopPropagation();
  const el = document.getElementById('spAccountCard');
  const open = el.classList.contains('open');
  spCloseMenus();
  if (!open) {
    const u = InnomickCMSData.currentUser;
    const initials = u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    el.innerHTML = `
      <div class="sp-acc-top"><span>Innomick Technologies</span><a href="javascript:void(0)" onclick="showToast('Sign out is disabled in the prototype', 'info')">Sign out</a></div>
      <div class="sp-acc-main">
        <span class="sp-acc-avatar">${initials}</span>
        <div><strong>${u.name}</strong><div class="sp-muted">${u.email}</div>
          <a href="javascript:void(0)" class="sp-link">View account</a>
          <a href="javascript:void(0)" class="sp-link">My Microsoft 365 profile</a></div>
      </div>
      <div class="sp-acc-switch">
        <div class="sp-muted" style="margin-bottom: 4px;">Switch demo user</div>
        ${['arjun', 'sara', 'imran'].map(k => {
          const p = InnomickCMSData.userProfiles && InnomickCMSData.userProfiles[k];
          return p ? `<a href="javascript:void(0)" class="sp-link" onclick="switchUserProfile('${k}'); spCloseMenus();">${p.name}</a>` : '';
        }).join('')}
      </div>
      <div class="sp-acc-other">&#128100; Sign in with a different account</div>`;
    el.classList.add('open');
  }
}

function spCloseMenus() {
  ['spAppLauncher', 'spAccountCard'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('open'); });
}

document.addEventListener('click', e => {
  if (!e.target.closest('#spAppLauncher, #spAccountCard')) spCloseMenus();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { spCloseMenus(); spClosePanel(); }
});
