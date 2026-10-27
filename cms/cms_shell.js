/**
 * Innomick Technologies - CMS Prototype
 * SharePoint chrome behaviour: app launcher, feedback, settings, help and account panels.
 */

const SP_APPS = ['Copilot', 'Outlook', 'OneDrive', 'Word', 'Excel', 'PowerPoint', 'OneNote', 'SharePoint', 'Teams', 'Viva', 'Engage', 'Power Automate', 'More apps'];
const SP_APP_COLORS = ['#7b61ff', '#0f6cbd', '#0364b8', '#185abd', '#107c41', '#c43e1c', '#7719aa', '#038387', '#4b53bc', '#0f766e', '#5c2e91', '#0066ff', '#475569'];

function spPanelHtml(kind) {
  const user = InnomickCMSData.currentUser;
  if (kind === 'feedback') {
    return `
      <h3>Submit feedback to Microsoft</h3>
      <p class="sp-muted">Classify your feedback</p>
      <button class="sp-choice">&#9786; Give a compliment</button>
      <button class="sp-choice">&#9888; Report a problem</button>
      <button class="sp-choice">&#128161; Make a suggestion &#8599;</button>
      <p class="sp-muted" style="margin-top: 14px;">Microsoft will use your feedback to improve its products.</p>
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
      <input class="cms-input sp-search" placeholder="Search help">
      ${['Get started', 'Sharing & permissions', 'Documents & libraries', 'Lists', 'Pages', 'Sites', 'Troubleshooting']
        .map(l => `<a href="javascript:void(0)" class="sp-link sp-help-link">${l} <span>&#8250;</span></a>`).join('')}
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
