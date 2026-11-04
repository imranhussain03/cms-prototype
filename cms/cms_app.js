/**
 * Innomick Technologies - Contract Management System (CMS) Application Logic
 * Interactive client-side router, filter engine, modal handlers, and state management.
 */

// Application State
const CMSState = {
  currentRoute: 'statistics',
  currentActionType: 'renew',
  selectedContractId: null,
  statsTab: 'overview',
  approvalTab: 'inbox',
  isFavorited: false,
  filters: {
    requests: {
      branch: 'all',
      dept: 'all',
      vendor: 'all',
      category: 'all',
      minPrice: null,
      maxPrice: null,
      createdByMe: false
    },
    contracts: {
      branch: 'all',
      dept: 'all',
      vendor: 'all',
      category: 'all',
      status: 'all',
      createdByMe: false
    },
    templates: {
      search: '',
      sort: 'name_asc'
    }
  }
};

// ============================================================================
// 1. INITIALIZATION & ROUTING
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  populateDropdownOptions();
  initializeRouter();
  renderAllViews();
});

function initializeRouter() {
  window.addEventListener('hashchange', handleHashChange);
  const rawHash = window.location.hash.replace(/^#\/?/, '') || 'statistics';
  parseAndSwitchRoute(rawHash);
}

function handleHashChange() {
  // Ignore hash updates made by switchRoute itself; the view is already rendered
  if (window.location.hash === CMSState.renderedHash) return;
  const rawHash = window.location.hash.replace(/^#\/?/, '') || 'statistics';
  parseAndSwitchRoute(rawHash);
}

function parseAndSwitchRoute(rawHash) {
  let clean = decodeURIComponent(rawHash).trim();
  clean = clean.replace(/^[#/]+/, '');

  if (clean.startsWith('approval-review') || clean.startsWith('approval_review')) {
    const parts = clean.split('/');
    switchRoute('approval_review', parts[1] || 'APP-F01', false);
    return;
  }

  if (clean.startsWith('request-detail') || clean.startsWith('request_detail')) {
    const parts = clean.split('/');
    switchRoute('request_detail', parts[1] || 'REQ-01', false);
    return;
  }

  if (clean.startsWith('contract-detail') || clean.startsWith('contract_detail')) {
    const parts = clean.split('/');
    switchRoute('contract_detail', parts[1] || 'CON-01', false);
    return;
  }

  if (clean.startsWith('existing-contract-details')) {
    switchRoute('mg_detail', clean.split('/')[1], false);
    return;
  }

  if (clean.startsWith('approve-migrated')) {
    switchRoute('mg_review', clean.split('/')[1], false);
    return;
  }

  if (clean.startsWith('template-editor') || clean.startsWith('template_editor')) {
    const parts = clean.split('/');
    switchRoute('template_editor', parts[1] || 'TPL-01', false);
    return;
  }

  if (clean.startsWith('new-contract-details')) {
    switchRoute('nc_details', clean.split('/')[1], false);
    return;
  }

  if (clean.startsWith('select-template')) {
    switchRoute('nc_template_select', clean.split('/')[1], false);
    return;
  }

  if (clean.startsWith('edit-document')) {
    switchRoute('nc_doc_editor', clean.split('/')[1], false);
    return;
  }

  if (clean.startsWith('approve/NCAPP-')) {
    switchRoute('nc_approve', clean.split('/')[1], false);
    return;
  }

  if (clean.startsWith('view-document')) {
    switchRoute('template_view', clean.split('/')[1], false);
    return;
  }

  if (clean.startsWith('contract-import-builder')) {
    switchRoute(typeof ImpState !== 'undefined' && ImpState.department ? 'import_builder' : 'import', null, false);
    return;
  }

  if (clean.startsWith('excel-import') || clean.startsWith('excel_import')) {
    switchRoute('excel_import', null, false);
    return;
  }

  if (clean.startsWith('contract selection') || clean.startsWith('contract_selection') || clean.startsWith('contract-selection')) {
    const parts = clean.split('/');
    let actionParam = 'renew';
    if (parts.length > 1) {
      const p = parts[1].trim();
      if (p === 'cmVuZXc-' || p === 'renew') actionParam = 'renew';
      else if (p === 'cancel' || p === 'cancellation') actionParam = 'cancel';
      else if (p === 'amend' || p === 'amendment') actionParam = 'amend';
      else if (p === 'extension' || p === 'extend') actionParam = 'extension';
      else if (p === 'completion' || p === 'complete') actionParam = 'completion';
      else actionParam = p;
    }
    switchRoute('contract_selection', actionParam, false);
    return;
  }

  let mainRoute = clean.split('/')[0] || 'statistics';
  if (mainRoute === 'mycontracts' || mainRoute === 'my-contracts') mainRoute = 'contracts';
  if (mainRoute === 'contract-requests' || mainRoute === 'contractrequests') mainRoute = 'requests';
  if (mainRoute === 'contract-templates' || mainRoute === 'contracttemplates') mainRoute = 'templates';
  if (mainRoute === 'contract-import' || mainRoute === 'contractimport') mainRoute = 'import';
  switchRoute(mainRoute, null, false);
}

function switchRoute(route, param = null, updateHash = true) {
  if (route === 'mycontracts' || route === 'my-contracts') route = 'contracts';
  if (route === 'contract-requests' || route === 'contractrequests') route = 'requests';
  if (route === 'contract-templates' || route === 'contracttemplates') route = 'templates';
  if (route === 'contract-import' || route === 'contractimport') route = 'import';
  
  const validRoutes = [
    'statistics', 'requests', 'contracts', 'approvals', 'templates', 
    'notifications', 'import', 'contract_selection',
    'approval_review', 'request_detail', 'contract_detail', 'template_editor', 'excel_import',
    'nc_template_select', 'nc_details', 'nc_doc_editor', 'import_builder', 'template_view', 'nc_approve', 'mg_detail', 'mg_review'
  ];
  if (!validRoutes.includes(route)) {
    route = 'statistics';
  }

  if (CMSState.currentRoute !== route) CMSState.prevRoute = CMSState.currentRoute;
  CMSState.currentRoute = route;

  if (route === 'contract_selection') {
    if (param) CMSState.currentActionType = param;
    const hashParam = CMSState.currentActionType === 'renew' ? 'cmVuZXc-' : CMSState.currentActionType;
    if (updateHash) {
      window.location.hash = `/contract selection/${hashParam}`;
    }
  } else if (route === 'approval_review') {
    if (updateHash) window.location.hash = `/approval-review/${param || 'APP-F01'}`;
  } else if (route === 'request_detail') {
    if (updateHash) window.location.hash = `/request-detail/${param || 'REQ-01'}`;
  } else if (route === 'contract_detail') {
    if (updateHash) window.location.hash = `/contract-detail/${param || 'CON-01'}`;
  } else if (route === 'template_editor') {
    if (updateHash) window.location.hash = `/template-editor/${param || 'TPL-01'}`;
  } else if (route === 'excel_import') {
    if (updateHash) window.location.hash = `/excel-import`;
  } else if (route === 'nc_template_select') {
    if (updateHash) window.location.hash = `/select-template/${param}`;
  } else if (route === 'nc_details') {
    // Coming from the template picker, the picker is replaced so Back does not return to it
    if (updateHash && window.location.hash.startsWith('#/select-template/')) window.location.replace(`#/new-contract-details/${param}`);
    else if (updateHash) window.location.hash = `/new-contract-details/${param}`;
  } else if (route === 'nc_doc_editor') {
    if (updateHash) window.location.hash = `/edit-document/${param}`;
  } else if (route === 'import_builder') {
    if (updateHash) window.location.hash = `/contract-import-builder`;
  } else if (route === 'template_view') {
    if (updateHash) window.location.hash = `/view-document/${param}`;
  } else if (route === 'nc_approve') {
    if (updateHash) window.location.hash = `/approve/${param}`;
  } else if (route === 'mg_detail') {
    if (updateHash) window.location.hash = `/existing-contract-details/${param}`;
  } else if (route === 'mg_review') {
    if (updateHash) window.location.hash = `/approve-migrated/${param}`;
  } else {
    if (updateHash) {
      window.location.hash = route;
    }
  }

  CMSState.renderedHash = window.location.hash;

  // Update Sidebar active state
  document.querySelectorAll('.cms-nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  let navId = `nav-${route}`;
  if (route === 'contract_selection' || route === 'request_detail' || route === 'nc_details' || route === 'nc_doc_editor') navId = 'nav-requests';
  else if (route === 'nc_template_select' || route === 'template_view') navId = 'nav-templates';
  else if (route === 'contract_detail') navId = 'nav-contracts';
  else if (route === 'approval_review') navId = 'nav-approvals';
  else if (route === 'template_editor') navId = 'nav-templates';
  else if (route === 'excel_import' || route === 'import_builder') navId = 'nav-import';
  else if (route === 'nc_approve' || route === 'mg_review') navId = 'nav-approvals';
  else if (route === 'mg_detail') navId = 'nav-import';
  
  const activeNavItem = document.getElementById(navId);
  if (activeNavItem) {
    activeNavItem.classList.add('active');
  }

  // Hide all view sections
  document.querySelectorAll('.cms-view-section').forEach(sec => {
    sec.style.display = 'none';
  });

  // Show target section
  let targetId = `view-${route}`;
  if (route === 'contract_selection') targetId = 'view-contract-selection';
  else if (route === 'approval_review') targetId = 'view-approval-review';
  else if (route === 'request_detail') targetId = 'view-request-detail';
  else if (route === 'contract_detail') targetId = 'view-contract-detail';
  else if (route === 'template_editor') targetId = 'view-template-editor';
  else if (route === 'excel_import') targetId = 'view-excel-import';
  else if (route === 'nc_template_select') targetId = 'view-nc-template-select';
  else if (route === 'nc_details') targetId = 'view-nc-details';
  else if (route === 'nc_doc_editor') targetId = 'view-nc-doc-editor';
  else if (route === 'import_builder') targetId = 'view-import-builder';
  else if (route === 'template_view') targetId = 'view-template-viewer';
  else if (route === 'nc_approve') targetId = 'view-nc-approve';
  else if (route === 'mg_detail' || route === 'mg_review') targetId = 'view-contract-detail';
  // The approver and migrated contract pages use the full width (no CMS sidebar), like the live pages
  document.body.classList.toggle('nc-approve-mode', ['nc_approve', 'mg_detail', 'mg_review'].includes(route));

  const targetSection = document.getElementById(targetId);
  if (targetSection) {
    targetSection.style.display = 'block';
  }

  // Trigger route-specific refreshes
  if (route === 'statistics') renderStatistics();
  else if (route === 'requests') renderRequestsTable();
  else if (route === 'contracts') filterContracts();
  else if (route === 'approvals') renderApprovals();
  else if (route === 'templates') applyTemplateView();
  else if (route === 'notifications') renderNotifications();
  else if (route === 'import') renderImportBatches();
  else if (route === 'contract_selection') renderContractSelection();
  else if (route === 'approval_review') openApprovalReview(param);
  else if (route === 'request_detail') openRequestDetailsView(param);
  else if (route === 'contract_detail') openContractDetailsView(param);
  else if (route === 'template_editor') openTemplateEditorView(param);
  else if (route === 'excel_import') initExcelWizard();
  else if (route === 'nc_template_select') ncOpenTemplatePicker(param);
  else if (route === 'nc_details') ncOpenDetails(param);
  else if (route === 'nc_doc_editor') ncLoadDocEditor();
  else if (route === 'import_builder') impRenderBuilder();
  else if (route === 'template_view') tplRenderViewer(param);
  else if (route === 'nc_approve') ncRenderApprovePage(param);
  else if (route === 'mg_detail') mgRenderDetail(param);
  else if (route === 'mg_review') mgRenderReview(param);
}

// ============================================================================
// 2. DROPDOWN POPULATION
// ============================================================================
function populateDropdownOptions() {
  const addOptIfNotExists = (el, val, text) => {
    if (!el) return;
    for (let i = 0; i < el.options.length; i++) {
      if (el.options[i].value === val) return;
    }
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = text || val;
    el.appendChild(opt);
  };

  // 1. Branches
  const branchDropdowns = ['statsBranchFilter', 'reqFilterBranch', 'cntFilterBranch', 'modalBranchSelect', 'csFilterBranch', 'cvFilterBranch'];
  branchDropdowns.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    InnomickCMSData.branches.forEach(branch => {
      addOptIfNotExists(el, branch, branch);
    });
  });

  // 2. Departments
  const deptDropdowns = ['statsDeptFilter', 'reqFilterDept', 'cntFilterDept', 'modalDeptSelect', 'csFilterDept'];
  deptDropdowns.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    InnomickCMSData.departments.forEach(dept => {
      addOptIfNotExists(el, dept, dept);
    });
  });

  // 3. Vendors
  const vendorDropdowns = ['reqFilterVendor', 'cntFilterVendor', 'modalVendorSelect', 'csFilterVendor'];
  vendorDropdowns.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    InnomickCMSData.vendors.forEach(vendor => {
      addOptIfNotExists(el, vendor, vendor);
    });
  });

  // 4. Categories
  const catDropdowns = ['reqFilterCategory', 'cntFilterCategory', 'csFilterCategory'];
  catDropdowns.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    InnomickCMSData.categories.forEach(cat => {
      addOptIfNotExists(el, cat, cat);
    });
  });

  // 5. Contract Types
  const typeDropdowns = ['modalTypeSelect'];
  typeDropdowns.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    InnomickCMSData.contractTypes.forEach(type => {
      addOptIfNotExists(el, type, type);
    });
  });
}

function renderAllViews() {
  renderStatistics();
  renderRequestsTable();
  filterContracts();
  renderApprovals();
  applyTemplateView();
  renderNotifications();
  renderImportBatches();
  renderContractSelection();
}

// ============================================================================
// 3. STATISTICS VIEW LOGIC (Matching Screenshots 01-04)
// ============================================================================
function renderStatistics() {
  const setElText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  // Update KPI counters safely
  setElText('kpiPendingCount', InnomickCMSData.statistics.pendingApprovals);
  setElText('kpiExpiringCount', InnomickCMSData.statistics.expiringSoon);
  setElText('kpiStuckCount', InnomickCMSData.statistics.stuckApprovals);
  setElText('kpiDraftsCount', InnomickCMSData.statistics.draftsAging);
  setElText('pendingApprovalsSubCount', InnomickCMSData.statistics.pendingApprovals);
  setElText('stuckApprovalsCount', InnomickCMSData.statistics.stuckApprovals);
  setElText('noticePeriodCount', InnomickCMSData.statistics.noticePeriod || 0);
  setElText('draftsAgingTotalBadge', InnomickCMSData.statistics.draftsAging);

  const sidebarNotif = document.getElementById('sidebarNotifBadge');
  if (sidebarNotif) {
    // UAT: the badge counts approval steps waiting on the current user
    const badge = cmsMyInbox().length;
    sidebarNotif.textContent = badge > 99 ? '99+' : badge;
  }

  // 1. Render Pending For Your Approvals (Count: 115)
  const pendingContainer = document.getElementById('pendingApprovalsListContainer');
  if (pendingContainer && InnomickCMSData.pendingApprovalsList) {
    const deptSelect = document.getElementById('statsFilterDept');
    const deptFilter = deptSelect ? deptSelect.value : 'all';

    const items = InnomickCMSData.pendingApprovalsList.filter(item => {
      if (deptFilter !== 'all' && deptFilter !== 'Information Technology' && item.department !== deptFilter) {
        return false;
      }
      return true;
    });

    pendingContainer.innerHTML = items.map(item => `
      <div class="pending-item-card" onclick="openContractQuickView('${item.title}', '${item.code}', '${item.amount}', '${item.department}', '${item.vendor}')">
        <div class="item-top-row">
          <div class="item-title">${item.title}</div>
          <div class="item-days-link">${item.daysAgo}</div>
        </div>
        <div class="item-code-text">${item.code}</div>
        <div class="item-tags-row">
          <span class="type-pill-tag">${item.type}</span>
          <span class="dot-separator">•</span>
          <span>${item.department}</span>
          <span class="dot-separator">•</span>
          <span>${item.vendor}</span>
        </div>
        <div class="item-amount-row">
          <span class="item-amount-bold">-${item.amount}</span>
        </div>
      </div>
    `).join('');
  }

  // 2. Render Stuck Approvals (Count: 112)
  const stuckContainer = document.getElementById('stuckApprovalsListContainer');
  if (stuckContainer && InnomickCMSData.stuckApprovalsList) {
    const deptSelect = document.getElementById('statsFilterDept');
    const deptFilter = deptSelect ? deptSelect.value : 'all';

    const items = InnomickCMSData.stuckApprovalsList.filter(item => {
      if (deptFilter !== 'all' && deptFilter !== 'Information Technology' && item.department !== deptFilter) {
        return false;
      }
      return true;
    });

    stuckContainer.innerHTML = items.map(item => `
      <div class="stuck-item-card" onclick="openStuckQuickView('${item.title}', '${item.step}', '${item.approver}', '${item.amount}', '${item.department}', '${item.vendor}')">
        <div class="stuck-top-row">
          <div class="stuck-title-left">${item.title}</div>
          <div class="stuck-days-link">${item.daysAgo}</div>
        </div>
        <div class="stuck-tags-row">
          <span class="type-pill-tag">${item.type}</span>
          <span class="dot-separator">•</span>
          <span>${item.department}</span>
          <span class="dot-separator">•</span>
        </div>
        <div class="stuck-meta-row">
          <span>${item.vendor}</span>
          <span class="dot-separator">•</span>
          <span class="stuck-amount-bold">${item.amount}</span>
        </div>
        <div class="stuck-footer-row">
          <span class="stuck-step-name">${item.step}</span>
          <span class="stuck-approver-name">${item.approver}</span>
        </div>
      </div>
    `).join('');
  }

  // 3. Render Drafts Aging (Count: 13)
  const draftsContainer = document.getElementById('draftsAgingListContainer');
  if (draftsContainer && InnomickCMSData.draftsAgingList) {
    draftsContainer.innerHTML = InnomickCMSData.draftsAgingList.map(item => {
      const vendorAmountPart = item.vendor ? `${item.vendor} - ${item.department} - ${item.amount}` : `${item.department} •`;
      return `
        <div class="draft-item-card" onclick="showToast('Opening draft: ${item.title}', 'info')">
          <div class="draft-main-info">
            <div class="draft-title">${item.title}</div>
            <div class="draft-tags-row">
              <span class="type-pill-tag">${item.type}</span>
              <span class="dot-separator">•</span>
              <span>${vendorAmountPart}</span>
            </div>
          </div>
          <div class="draft-days-link">${item.daysAgo}</div>
        </div>
      `;
    }).join('');
  }
}

function filterDashboardData() {
  renderStatistics();
  const branch = document.getElementById('statsFilterBranch') ? document.getElementById('statsFilterBranch').value : 'Innomick';
  const dept = document.getElementById('statsFilterDept') ? document.getElementById('statsFilterDept').value : 'All';
  showToast(`Dashboard filtered: ${branch} • ${dept}`, 'info');
}

function switchStatsTab(tab) {
  CMSState.statsTab = tab;
  const overviewBtn = document.getElementById('statsTabOverview');
  const valueBtn = document.getElementById('statsTabContractValue');
  const overviewDiv = document.getElementById('statsOverviewContainer');
  const valueDiv = document.getElementById('statsValueContainer');

  if (tab === 'overview') {
    if (overviewBtn) overviewBtn.classList.add('active');
    if (valueBtn) valueBtn.classList.remove('active');
    if (overviewDiv) overviewDiv.style.display = 'block';
    if (valueDiv) valueDiv.style.display = 'none';
  } else {
    if (overviewBtn) overviewBtn.classList.remove('active');
    if (valueBtn) valueBtn.classList.add('active');
    if (overviewDiv) overviewDiv.style.display = 'none';
    if (valueDiv) valueDiv.style.display = 'block';
    populateContractValueVendors();
    renderContractValueView();
  }
}

// ============================================================================
// CONTRACT VALUE INTELLIGENCE LOGIC (Screenshots 01-04)
// ============================================================================
function populateContractValueVendors(filterQuery = '') {
  const container = document.getElementById('cvVendorOptionsList');
  if (!container || !InnomickCMSData.contractValueVendors) return;

  const current = CMSState.cvFilterVendor || 'All Vendors';
  const query = (filterQuery || '').toLowerCase().trim();

  const filtered = InnomickCMSData.contractValueVendors.filter(v => {
    if (!query) return true;
    return v.toLowerCase().includes(query);
  });

  container.innerHTML = filtered.map(v => {
    const isSelected = v === current;
    return `
      <div class="cv-vendor-option-item ${isSelected ? 'selected' : ''}" onclick="selectContractValueVendor('${v}')">
        <span class="cv-option-check">${isSelected ? '✓' : ''}</span>
        <span>${v}</span>
      </div>
    `;
  }).join('');
}

function toggleVendorDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('cvVendorDropdownMenu');
  const trigger = document.getElementById('cvVendorDropdownTrigger');
  if (!menu) return;

  const isOpen = menu.classList.contains('open');
  if (isOpen) {
    menu.classList.remove('open');
    if (trigger) trigger.classList.remove('open');
  } else {
    menu.classList.add('open');
    if (trigger) trigger.classList.add('open');
    populateContractValueVendors();
    const searchInput = document.getElementById('cvVendorSearchInput');
    if (searchInput) {
      searchInput.value = '';
      setTimeout(() => searchInput.focus(), 60);
    }
  }
}

function filterVendorList(query) {
  populateContractValueVendors(query);
}

function selectContractValueVendor(vendorName) {
  CMSState.cvFilterVendor = vendorName;
  const triggerText = document.getElementById('cvSelectedVendorText');
  if (triggerText) triggerText.textContent = vendorName;

  const menu = document.getElementById('cvVendorDropdownMenu');
  const trigger = document.getElementById('cvVendorDropdownTrigger');
  if (menu) menu.classList.remove('open');
  if (trigger) trigger.classList.remove('open');

  renderContractValueView();
  showToast(`Filtered Contract Value by Vendor: ${vendorName}`, 'info');
}

function renderContractValueView() {
  const vendorName = CMSState.cvFilterVendor || 'All Vendors';
  const data = InnomickCMSData.contractValueData[vendorName] || InnomickCMSData.contractValueData['All Vendors'];
  if (!data) return;

  // 1. KPI cards
  const elTotalVal = document.getElementById('cvKpiTotalValue');
  const elTotalCnt = document.getElementById('cvKpiTotalContracts');
  const elAvgCnt = document.getElementById('cvKpiAvgContract');
  const elUniqVendors = document.getElementById('cvKpiUniqueVendors');

  if (elTotalVal) elTotalVal.textContent = data.totalValue;
  if (elTotalCnt) elTotalCnt.textContent = data.totalContracts;
  if (elAvgCnt) elAvgCnt.textContent = data.avgPerContract;
  if (elUniqVendors) elUniqVendors.textContent = data.uniqueVendors;

  // 2. Subtitles
  const elDistSub = document.getElementById('cvDistSubtitle');
  if (elDistSub) elDistSub.textContent = `All contracts · ${data.totalContracts} contracts`;

  const elConcSub = document.getElementById('cvVendorConcSubtitle');
  if (elConcSub) elConcSub.textContent = `All · ${data.uniqueVendors} vendors`;

  // 3. Distribution Bar Chart
  renderDistributionChart();

  // 4. Vendor Concentration List
  const elVendorList = document.getElementById('cvVendorListContainer');
  if (elVendorList && data.vendors) {
    elVendorList.innerHTML = data.vendors.map(v => `
      <div class="cv-vendor-row" onclick="selectContractValueVendor('${v.name}')" style="cursor: pointer;" title="Filter by ${v.name}">
        <div class="cv-vendor-info-line">
          <span class="cv-vendor-name">${v.name}</span>
          <span class="cv-vendor-stats">${v.contracts} contracts · <strong>${v.percent}</strong></span>
        </div>
        <div class="cv-vendor-progress-track">
          <div class="cv-vendor-progress-fill" style="width: ${v.percent}; background-color: ${v.barColor || '#008272'};"></div>
        </div>
      </div>
    `).join('');
  }

  // 5. Concentration Footer
  const elFooter = document.getElementById('cvVendorTotalFooter');
  if (elFooter) elFooter.textContent = `${data.totalValue} KWD`;
}

function switchDistPill(pill) {
  CMSState.cvDistPill = pill;
  ['dept', 'vendor', 'branch', 'type'].forEach(p => {
    const btn = document.getElementById(`cvPill${p.charAt(0).toUpperCase() + p.slice(1)}`);
    if (btn) btn.classList.toggle('active', p === pill);
  });

  renderDistributionChart();
}

// Groups contracts by the active pill and draws one horizontal bar per group
function renderDistributionChart() {
  const rowsEl = document.getElementById('cvChartRows');
  const axisEl = document.getElementById('cvChartAxisRow');
  if (!rowsEl) return;

  const keyByPill = { dept: 'department', vendor: 'vendor', branch: 'branch', type: 'type' };
  const key = keyByPill[CMSState.cvDistPill || 'dept'];
  const vendorFilter = CMSState.cvFilterVendor || 'All Vendors';

  const totals = {};
  (InnomickCMSData.contracts || []).forEach(c => {
    if (vendorFilter !== 'All Vendors' && c.vendor !== vendorFilter) return;
    const label = c[key] || 'Unknown';
    const amount = parseFloat(String(c.amount || c.value || 0).replace(/[^0-9.\-]/g, '')) || 0;
    totals[label] = (totals[label] || 0) + Math.abs(amount);
  });

  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!entries.length) {
    rowsEl.innerHTML = '<div class="no-data-found-msg" style="padding: 30px 0;">No Data Found</div>';
    if (axisEl) axisEl.innerHTML = '';
    return;
  }

  // Round the axis max up to a clean step so tick labels stay readable
  const maxVal = entries[0][1] || 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const step = Math.ceil(maxVal / 4 / magnitude) * magnitude;
  const axisMax = step * 4;
  const fmt = v => v >= 1e6 ? `${+(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${+(v / 1e3).toFixed(1)}K` : `${v}`;

  rowsEl.innerHTML = entries.map(([label, val]) => `
    <div class="cv-chart-row" title="${label}: ${val.toLocaleString()} KWD">
      <div class="cv-chart-row-label">${label}</div>
      <div class="cv-chart-track-container">
        <div class="cv-chart-bar-fill" style="width: ${Math.max((val / axisMax) * 100, 0.8)}%;"></div>
      </div>
    </div>
  `).join('');

  if (axisEl) axisEl.innerHTML = [0, 1, 2, 3, 4].map(i => `<span>${fmt(step * i)}</span>`).join('');
}

function applyContractValueFilters() {
  renderContractValueView();
  const b = document.getElementById('cvFilterBranch') ? document.getElementById('cvFilterBranch').value : 'Innomick';
  const d = document.getElementById('cvFilterDept') ? document.getElementById('cvFilterDept').value : 'IT';
  showToast(`Contract Value filter applied: ${b} • ${d}`, 'info');
}

function resetContractValueFilters() {
  const branchSel = document.getElementById('cvFilterBranch');
  const deptSel = document.getElementById('cvFilterDept');
  const srvSel = document.getElementById('cvFilterService');
  if (branchSel) branchSel.value = 'Innomick';
  if (deptSel) deptSel.value = 'all';
  if (srvSel) srvSel.value = 'all';

  CMSState.cvFilterVendor = 'All Vendors';
  const triggerText = document.getElementById('cvSelectedVendorText');
  if (triggerText) triggerText.textContent = 'All Vendors';

  renderContractValueView();
  showToast('Contract Value filters cleared to default', 'info');
}

// Global click listener to close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('cvVendorDropdownWrapper');
  const menu = document.getElementById('cvVendorDropdownMenu');
  const trigger = document.getElementById('cvVendorDropdownTrigger');
  if (wrapper && !wrapper.contains(e.target)) {
    if (menu) menu.classList.remove('open');
    if (trigger) trigger.classList.remove('open');
  }
});

function refreshDashboardData() {
  const btn = document.getElementById('dashboardRefreshBtn');
  if (btn) btn.classList.add('refreshing');
  showToast('Refreshing Innomick CMS contract intelligence...', 'info');
  setTimeout(() => {
    if (btn) btn.classList.remove('refreshing');
    renderStatistics();
    if (CMSState.statsTab === 'value') {
      renderContractValueView();
    }
    showToast('Dashboard metrics updated successfully', 'success');
  }, 500);
}

function openContractQuickView(title, code, amount, dept, vendor) {
  showToast(`Approval Request: ${title} (${code}) | ${amount} | ${dept}`, 'info');
}

function openStuckQuickView(title, step, approver, amount, dept, vendor) {
  showToast(`Stuck Approval: ${title} awaiting ${step} by ${approver} (${amount})`, 'warning');
}

// ============================================================================
// 4. REQUESTS VIEW LOGIC (6 Workflow Actions & Filters Matching Screenshot 01)
// ============================================================================
function filterRequests() {
  const branch = document.getElementById('reqFilterBranch') ? document.getElementById('reqFilterBranch').value : 'all';
  const dept = document.getElementById('reqFilterDept') ? document.getElementById('reqFilterDept').value : 'all';
  const vendor = document.getElementById('reqFilterVendor') ? document.getElementById('reqFilterVendor').value : 'all';
  const category = document.getElementById('reqFilterCategory') ? document.getElementById('reqFilterCategory').value : 'all';
  const minPrice = parseFloat(document.getElementById('reqPriceMin') ? document.getElementById('reqPriceMin').value : '') || 0;
  const maxPrice = parseFloat(document.getElementById('reqPriceMax') ? document.getElementById('reqPriceMax').value : '') || Infinity;
  const createdByMe = document.getElementById('reqCreatedByMeToggle') ? document.getElementById('reqCreatedByMeToggle').checked : false;

  const filtered = InnomickCMSData.requests.filter(req => {
    if (branch !== 'all' && req.branch && !req.branch.includes(branch) && !branch.includes(req.branch)) return false;
    if (dept !== 'all' && req.department !== dept) return false;
    if (vendor !== 'all' && req.vendorName !== vendor) return false;
    if (category !== 'all' && req.category !== category) return false;
    if (createdByMe && req.submittedBy !== InnomickCMSData.currentUser.name) return false;
    
    // Numeric price filter
    if (req.contractValue) {
      const rawPrice = parseFloat(req.contractValue.replace(/[^0-9.]/g, '')) || 0;
      if (rawPrice < minPrice) return false;
      if (maxPrice !== Infinity && rawPrice > maxPrice) return false;
    }

    return true;
  });

  renderRequestsTable(filtered);
  const countEl = document.getElementById('reqRecordCountText');
  if (countEl) countEl.textContent = `${filtered.length} records shown`;
}

function resetRequestFilters() {
  if (document.getElementById('reqFilterBranch')) document.getElementById('reqFilterBranch').value = 'Innomick';
  if (document.getElementById('reqFilterDept')) document.getElementById('reqFilterDept').value = 'all';
  if (document.getElementById('reqFilterVendor')) document.getElementById('reqFilterVendor').value = 'all';
  if (document.getElementById('reqFilterCategory')) document.getElementById('reqFilterCategory').value = 'Service';
  if (document.getElementById('reqPriceMin')) document.getElementById('reqPriceMin').value = '';
  if (document.getElementById('reqPriceMax')) document.getElementById('reqPriceMax').value = '';
  if (document.getElementById('reqCreatedByMeToggle')) document.getElementById('reqCreatedByMeToggle').checked = false;
  filterRequests();
  showToast('Request filters reset to default', 'info');
}

function renderRequestsTable(dataList = InnomickCMSData.requests) {
  const tbody = document.getElementById('requestsTableBody');
  if (!tbody) return;

  if (dataList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-table-state" style="text-align: center; padding: 40px; color: #64748b;">
          No contract requests match your selected filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = dataList.map(req => {
    let statusBadge = '';
    if (req.status === 'In Approval') {
      statusBadge = `<span class="badge-in-approval">In Approval</span>`;
    } else if (req.status === 'Approved') {
      statusBadge = `<span class="badge-approved">Approved</span>`;
    } else if (req.status === 'Active') {
      statusBadge = `<span class="badge-approved">Active</span>`;
    } else if (req.status === 'Rejected') {
      statusBadge = `<span class="badge-rejected">Rejected</span>`;
    } else if (req.migratedId) {
      statusBadge = req.status === 'Request for Change' ? `<span class="badge-in-approval">${req.status}</span>` : `<span class="badge-draft">${req.status}</span>`;
    } else {
      statusBadge = `<span class="badge-draft">Draft</span>`;
    }

    let durationMarkup = '';
    if (req.isPendingActivation) {
      durationMarkup = `
        <div class="duration-cell pending">
          <div class="duration-header">
            <span class="duration-pending"><span class="rotate-icon">🔄</span> Pending activation</span>
            <span class="duration-dates-muted">Actual dates not set</span>
          </div>
        </div>
      `;
    } else if (req.durationMonths || req.durationDates) {
      durationMarkup = `
        <div class="duration-cell">
          <div class="duration-header">
            <span class="duration-length">${req.durationMonths}</span>
            <span class="duration-dates">${req.durationDates}</span>
          </div>
          <div class="duration-progress-track">
            <div class="duration-progress-bar" style="width: ${req.durationProgress || 50}%;"></div>
          </div>
        </div>
      `;
    }

    let iconCircle = req.hasIcon ? `<span class="ref-icon-circle" title="Verified Contract">M</span>` : '';

    return `
      <tr>
        <td>
          <div class="ref-link-group">
            <a href="javascript:void(0)" onclick="openRequestDetails('${req.id}')" class="req-ref-link">
              ${req.refNo}
            </a>
            ${iconCircle}
          </div>
        </td>
        <td>
          <span class="req-contract-name">${req.contractName || ''}</span>
        </td>
        <td>
          <span class="req-type-text">${req.requestType}</span>
        </td>
        <td>
          ${statusBadge}
        </td>
        <td>
          <span class="req-vendor-name">${req.vendorName || ''}</span>
        </td>
        <td>
          <span class="req-dept-name">${req.department || ''}</span>
        </td>
        <td>
          ${durationMarkup}
        </td>
        <td>
          <span class="req-value-text">${req.contractValue || ''}</span>
        </td>
        <td>
          <span class="req-category-name">${req.category || 'Service'}</span>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// 5. CONTRACTS VIEW LOGIC (Matching Screenshot 01)
// ============================================================================
function filterContracts() {
  const branchEl = document.getElementById('cntFilterBranch');
  const deptEl = document.getElementById('cntFilterDept');
  const vendorEl = document.getElementById('cntFilterVendor');
  const catEl = document.getElementById('cntFilterCategory');
  const minEl = document.getElementById('cntPriceMin');
  const maxEl = document.getElementById('cntPriceMax');
  const createdByMeEl = document.getElementById('cntCreatedByMeToggle');

  const branch = branchEl ? branchEl.value : 'all';
  const dept = deptEl ? deptEl.value : 'all';
  const vendor = vendorEl ? vendorEl.value : 'all';
  const category = catEl ? catEl.value : 'all';
  const minVal = minEl && minEl.value ? parseFloat(minEl.value) : null;
  const maxVal = maxEl && maxEl.value ? parseFloat(maxEl.value) : null;
  const createdByMe = createdByMeEl ? createdByMeEl.checked : false;

  const filtered = InnomickCMSData.contracts.filter(c => {
    if (branch !== 'all' && c.branch !== branch) return false;
    if (dept !== 'all' && c.department !== dept) return false;
    if (vendor !== 'all' && c.vendor !== vendor && c.vendorName !== vendor) return false;
    if (category !== 'all' && c.category !== category) return false;
    if (minVal !== null && c.value < minVal) return false;
    if (maxVal !== null && c.value > maxVal) return false;
    if (createdByMe && c.owner !== InnomickCMSData.currentUser.name) return false;
    return true;
  });

  renderContractsTable(filtered);
  const countEl = document.getElementById('contractsCountText');
  if (countEl) {
    countEl.textContent = `${filtered.length} records shown`;
  }
}

function resetContractFilters() {
  if (document.getElementById('cntFilterBranch')) document.getElementById('cntFilterBranch').value = 'Innomick';
  if (document.getElementById('cntFilterDept')) document.getElementById('cntFilterDept').value = 'all';
  if (document.getElementById('cntFilterVendor')) document.getElementById('cntFilterVendor').value = 'all';
  if (document.getElementById('cntFilterCategory')) document.getElementById('cntFilterCategory').value = 'Service';
  if (document.getElementById('cntPriceMin')) document.getElementById('cntPriceMin').value = '';
  if (document.getElementById('cntPriceMax')) document.getElementById('cntPriceMax').value = '';
  if (document.getElementById('cntCreatedByMeToggle')) document.getElementById('cntCreatedByMeToggle').checked = false;
  filterContracts();
  showToast('Contract filters reset to default', 'info');
}

function filterContractsByStatus(statusName) {
  switchRoute('contracts');
  const sel = document.getElementById('cntFilterCategory');
  filterContracts();
}

function renderContractsTable(dataList = InnomickCMSData.contracts) {
  const tbody = document.getElementById('contractsTableBody');
  if (!tbody) return;

  if (dataList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table-state" style="text-align: center; padding: 40px; color: #64748b;">
          No contracts match your selected filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = dataList.map(cnt => {
    let statusBadge = '';
    if (cnt.status === 'Expired') {
      statusBadge = `<span class="badge-expired">Expired</span>`;
    } else if (cnt.status === 'Archived') {
      statusBadge = `<span class="badge-archived">Archived</span>`;
    } else if (cnt.status === 'Active') {
      statusBadge = `<span class="badge-active">Active</span>`;
    } else if (cnt.status === 'Expiring Soon') {
      statusBadge = `<span class="badge-expiring">Expiring Soon</span>`;
    } else if (cnt.status === 'Pending Signature') {
      statusBadge = `<span class="badge-pending">Pending Signature</span>`;
    } else {
      statusBadge = `<span class="badge-draft">${cnt.status}</span>`;
    }

    let durationMarkup = '';
    if (cnt.durationMonths || cnt.durationDates) {
      durationMarkup = `
        <div class="duration-cell">
          <div class="duration-header">
            <span class="duration-length">${cnt.durationMonths || ''}</span>
            <span class="duration-dates">${cnt.durationDates || ''}</span>
          </div>
          <div class="duration-progress-track">
            <div class="duration-progress-bar" style="width: ${cnt.durationProgress || 100}%;"></div>
          </div>
        </div>
      `;
    } else {
      durationMarkup = `
        <div class="duration-cell">
          <div class="duration-header">
            <span class="duration-length">12 Months</span>
            <span class="duration-dates">${cnt.startDate || ''} - ${cnt.endDate || ''}</span>
          </div>
          <div class="duration-progress-track">
            <div class="duration-progress-bar" style="width: 80%;"></div>
          </div>
        </div>
      `;
    }

    const iconCircle = cnt.hasIcon ? `<span class="ref-icon-circle" title="SharePoint Contract">M</span>` : '';
    const formattedVal = cnt.contractValue || (cnt.value ? cnt.value.toLocaleString() : '0');

    return `
      <tr>
        <td>
          <div class="ref-link-group">
            <a href="javascript:void(0)" onclick="openContractDetailsById('${cnt.id}')" class="req-ref-link">
              ${cnt.refNo || cnt.code}
            </a>
            ${iconCircle}
          </div>
        </td>
        <td>
          <span class="req-contract-name">${cnt.contractName || cnt.name}</span>
        </td>
        <td>
          ${statusBadge}
        </td>
        <td>
          <span class="req-vendor-name">${cnt.vendorName || cnt.vendor}</span>
        </td>
        <td>
          <span class="req-dept-name">${cnt.department}</span>
        </td>
        <td>
          ${durationMarkup}
        </td>
        <td>
          <span class="req-value-text">${formattedVal}</span>
        </td>
        <td>
          <span class="req-category-name">${cnt.category || 'Service'}</span>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// 6. APPROVALS VIEW LOGIC (Inbox, Outbox, Templates, History)
// ============================================================================
function switchApprovalTab(tab) {
  CMSState.approvalTab = tab;
  ['inbox', 'outbox', 'templates', 'history'].forEach(t => {
    const btn = document.getElementById(`appTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) btn.classList.toggle('active', t === tab);
  });
  renderApprovals();
}

// Seeded approvals have no chain behind them, so they wait on the default demo user
const CMS_DEFAULT_USER = 'Zubair';

function cmsApprovalSteps(item) {
  if (item.mgId) {
    const c = mgFind(item.mgId);
    return c && c.approval ? c.approval.steps : null;
  }
  const rec = item.ncRequestId && NCState.records[item.ncRequestId];
  const doc = rec && rec.docs[item.ncDoc];
  return doc && doc.cycle ? doc.cycle.steps : null;
}

// A step whose approver has no account (external) stays open to everyone, so it can't get stuck
function cmsIsMine(item, name = InnomickCMSData.currentUser.name) {
  const steps = cmsApprovalSteps(item);
  if (!steps) return name === CMS_DEFAULT_USER;
  const open = steps.filter(s => s.state === 'Pending').map(s => s.approver);
  const accounts = Object.values(InnomickCMSData.userProfiles).map(p => p.name);
  return open.includes(name) || (open.length > 0 && !open.some(n => accounts.includes(n)));
}

function cmsMyInbox(name) {
  return (InnomickCMSData.approvals.inbox || []).filter(i => cmsIsMine(i, name));
}

function cmsMyStep(steps) {
  const open = steps.filter(s => s.state === 'Pending');
  return open.find(s => s.approver === InnomickCMSData.currentUser.name) || open[0];
}

function renderApprovals() {
  const container = document.getElementById('approvalsTabContent');
  if (!container) return;

  const tab = CMSState.approvalTab;
  const me = InnomickCMSData.currentUser.name;

  if (tab === 'inbox') {
    const myInbox = cmsMyInbox();
    if (myInbox.length === 0) {
      container.innerHTML = '<div class="empty-table-state">You don\'t have any data in inbox</div>';
      return;
    }

    container.innerHTML = `
      <div class="approvals-table-container">
        <table class="approvals-sp-table">
          <thead>
            <tr>
              <th style="min-width: 280px;">
                Name
                <svg class="th-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </th>
              <th style="min-width: 130px;">
                Approval Type
                <svg class="th-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </th>
              <th style="min-width: 160px;">Status</th>
              <th style="min-width: 160px;">Progress</th>
              <th style="min-width: 160px;">
                Requested By
                <svg class="th-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </th>
              <th style="min-width: 120px;">
                Requested on
                <svg class="th-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </th>
            </tr>
          </thead>
          <tbody>
            ${myInbox.map(item => {
              const type = item.approvalType || 'Sequential';
              const isParallel = type === 'Parallel';
              const progressPct = item.progressPercent !== undefined ? item.progressPercent : (item.totalCount ? Math.round((item.approvedCount / item.totalCount) * 100) : 0);
              const requestedBy = item.requestedBy || item.submittedBy || 'Arjun Mehta';
              const requestedOn = item.requestedOn || item.date || '2026-09-22';
              const name = item.name || item.title;

              return `
                <tr style="cursor: pointer;" onclick="openApprovalDetail('${item.id}')">
                  <td>
                    <div style="font-weight: 600; color: #1e293b;" title="${name}">
                      ${name}
                    </div>
                  </td>
                  <td>
                    <span class="${isParallel ? 'badge-parallel' : 'badge-sequential'}">${type}</span>
                  </td>
                  <td>
                    <span style="font-weight: 500; color: #334155;">${item.status || item.stage || 'Step 1'}</span>
                  </td>
                  <td>
                    <div class="approval-progress-wrap">
                      <div class="approval-progress-bar-bg">
                        <div class="approval-progress-bar-fill" style="width: ${progressPct}%;"></div>
                      </div>
                      <span class="approval-progress-label">Approved ${item.approvedCount || 0} of ${item.totalCount || 1}</span>
                    </div>
                  </td>
                  <td>${requestedBy}</td>
                  <td>${requestedOn}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div class="approvals-pagination-bar">
          <div class="page-direct">
            <span>Go to page:</span>
            <input type="number" value="1" min="1" max="10">
          </div>
          <div class="page-controls">
            <button>&lt;&lt;</button>
            <button>&lt;</button>
            <span>1 / 10 pages</span>
            <button>&gt;</button>
            <button>&gt;&gt;</button>
          </div>
          <div class="page-size-selector">
            <select>
              <option value="10">10 Items per page</option>
              <option value="25">25 Items per page</option>
              <option value="50">50 Items per page</option>
            </select>
          </div>
        </div>
      </div>
    `;
  } else if (tab === 'outbox') {
    container.innerHTML = `
      <div class="approvals-table-container" style="margin-top: 14px;">
        <table class="approvals-sp-table">
          <thead>
            <tr>
              <th style="min-width: 320px;">Name <svg class="th-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></th>
              <th style="min-width: 140px;">Approval Type <svg class="th-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></th>
              <th style="min-width: 140px;">Status</th>
              <th style="min-width: 160px;">Progress</th>
              <th style="min-width: 140px;">Requested on <svg class="th-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></th>
            </tr>
          </thead>
          <tbody>
            ${InnomickCMSData.approvals.outbox.filter(o => o.ncRequestId && (o.requestedBy || CMS_DEFAULT_USER) === me).map(item => `
              <tr style="cursor: pointer;" onclick="openRequestDetails('${item.ncRequestId}')">
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #008272; font-size: 14px;">↗</span>
                    <span style="font-weight: 600; color: #1e293b;">${item.title}</span>
                  </div>
                </td>
                <td><span class="${item.approvalType === 'Parallel' ? 'badge-parallel' : 'badge-sequential'}">${item.approvalType}</span></td>
                <td><span style="font-weight: 500; color: #334155;">${item.status}</span></td>
                <td>
                  <div class="approval-progress-wrap">
                    <div class="approval-progress-bar-bg"><div class="approval-progress-bar-fill" style="width: 0%;"></div></div>
                    <span class="approval-progress-label">Approved 0 of ${item.totalSteps}</span>
                  </div>
                </td>
                <td>${item.requestedOn}</td>
              </tr>
            `).join('')}
            ${InnomickCMSData.approvals.inbox.filter(item => !item.ncRequestId && !item.mgId && (item.requestedBy || CMS_DEFAULT_USER) === me).map(item => `
              <tr style="cursor: pointer;" onclick="switchRoute('approval_review', '${item.id}')">
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #008272; font-size: 14px;">↗</span>
                    <span style="font-weight: 600; color: #1e293b;">${item.name || item.title}</span>
                  </div>
                </td>
                <td><span class="${item.approvalType === 'Parallel' ? 'badge-parallel' : 'badge-sequential'}">${item.approvalType || 'Sequential'}</span></td>
                <td><span style="font-weight: 500; color: #334155;">${item.status || 'Step 1'}</span></td>
                <td>
                  <div class="approval-progress-wrap">
                    <div class="approval-progress-bar-bg"><div class="approval-progress-bar-fill" style="width: 50%;"></div></div>
                    <span class="approval-progress-label">Step 1 of 2</span>
                  </div>
                </td>
                <td>${item.requestedOn || '2026-09-22'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (tab === 'templates') {
    const list = InnomickCMSData.approvals.templates || [
      { name: "Vendor Review", type: "Sequential", steps: 2 },
      { name: "Dept Approvals", type: "Sequential", steps: 3 },
      { name: "Customer Services Approval", type: "Sequential", steps: 2 },
      { name: "CEO + Vendor App", type: "Sequential", steps: 2 },
      { name: "Procurement Review", type: "Parallel", steps: 2 },
      { name: "Dept Approval", type: "Sequential", steps: 3 },
      { name: "Vendor Compliance", type: "Sequential", steps: 2 },
      { name: "Quick Approval", type: "Sequential", steps: 1 },
      { name: "Standard Approval", type: "Sequential", steps: 2 },
      { name: "Executive Approval", type: "Sequential", steps: 2 },
      { name: "4 Approvals", type: "Parallel", steps: 4 },
      { name: "Internal Two-Step", type: "Sequential", steps: 2 },
      { name: "Regional Approval", type: "Sequential", steps: 2 },
      { name: "Internal - External - Internal", type: "Sequential", steps: 3 },
      { name: "Three-Step Approval", type: "Sequential", steps: 3 },
      { name: "Manager Approval", type: "Sequential", steps: 2 },
      { name: "Single Approver", type: "Sequential", steps: 1 },
      { name: "Vendor Sign-off", type: "Sequential", steps: 2 },
      { name: "Dept Approval", type: "Sequential", steps: 2 },
      { name: "Innomick Vendor Approval", type: "Sequential", steps: 2 },
      { name: "Vendor First", type: "Sequential", steps: 2 },
      { name: "Sequential Vendor Review", type: "Sequential", steps: 2 },
      { name: "Parallel Group Review", type: "Parallel", steps: 3 },
      { name: "Vendor Portal Subscription", type: "Sequential", steps: 2 },
      { name: "External Legal Review", type: "Sequential", steps: 2 },
      { name: "Individual Approval", type: "Sequential", steps: 2 },
      { name: "Parallel Department Review", type: "Parallel", steps: 3 },
      { name: "Dashboard Approval", type: "Sequential", steps: 2 },
      { name: "Finance Dashboard Approval", type: "Sequential", steps: 2 },
      { name: "Department Approval", type: "Sequential", steps: 2 },
      { name: "3 Approvals", type: "Sequential", steps: 3 },
      { name: "Human Resources Approval", type: "Sequential", steps: 2 },
      { name: "CEO Office Approval", type: "Sequential", steps: 2 },
      { name: "Branch Approval", type: "Sequential", steps: 2 },
      { name: "Standard Template", type: "Sequential", steps: 1 },
      { name: "External Approval", type: "Sequential", steps: 2 }
    ];

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; gap: 12px; align-items: center;">
          <button class="filter-tag-pill active" onclick="filterAppTemplates('all', this)">All</button>
          <button class="filter-tag-pill" onclick="filterAppTemplates('Parallel', this)">Parallel</button>
          <button class="filter-tag-pill" onclick="filterAppTemplates('Sequential', this)">Sequential</button>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b;">
            Branch:
            <select class="cms-select" style="padding: 4px 10px; font-size: 12px;">
              <option>All Branches</option>
              <option>Innomick Technologies - HQ</option>
              <option>Innomick Dubai Tech Center</option>
            </select>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b;">
            Department:
            <select class="cms-select" style="padding: 4px 10px; font-size: 12px;">
              <option>All Departments</option>
              <option>Information Technology</option>
              <option>Medical Insurance</option>
            </select>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;" id="appTemplatesGrid">
        ${list.map(t => `
          <div class="template-pill-card" style="cursor: pointer; padding: 12px 14px;" onclick="openSequentialWorkflowBuilder('sequential', '${t.name}')" title="Click to view/edit workflow">
            <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
              <div style="width: 32px; height: 32px; border-radius: 6px; background: #008272; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="18" r="3"></circle>
                  <circle cx="6" cy="6" r="3"></circle>
                  <path d="M6 21V9a9 9 0 0 0 9 9"></path>
                </svg>
              </div>
              <div style="font-size: 12.5px; font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${t.name}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (tab === 'history') {
    const historyList = [
      { name: "INM-MID-SVC-2622-2026 Cancellation Request Letter 1790150615710.docx", type: "Sequential", status: "Approved", progress: "Step 2 of 2", requestedBy: "Arjun Mehta", date: "2026-09-23" },
      { name: "INM-MID-SVC-2622-2026 Renewal Request Letter 1790150393302.docx", type: "Sequential", status: "Approved", progress: "Step 2 of 2", requestedBy: "Arjun Mehta", date: "2026-09-23" },
      { name: "INM-MID-SVC-2622-2026 Request Letter 1790150026266.docx", type: "Sequential", status: "Approved", progress: "Step 2 of 2", requestedBy: "Arjun Mehta", date: "2026-09-23" },
      { name: "INM-MID-SVC-2608-2026 Cancellation Request Letter 1790071699650.docx", type: "Sequential", status: "Approved", progress: "Step 2 of 2", requestedBy: "Arjun Mehta", date: "2026-09-22" },
      { name: "INM-MID-SVC-2608-2026 Amendment Request Letter 1790071021384.docx", type: "Sequential", status: "Approved", progress: "Step 2 of 2", requestedBy: "Arjun Mehta", date: "2026-09-22" },
      { name: "INM-MID-SVC-2608-2026 Request Letter 1790069510896.docx", type: "Sequential", status: "Approved", progress: "Step 2 of 2", requestedBy: "Arjun Mehta", date: "2026-09-22" },
      { name: "Innomick IT Contract/88555232", type: "Sequential", status: "Approved", progress: "Step 2 of 2", requestedBy: "Arjun Mehta", date: "2026-09-22" },
      { name: "INM-ITD-SVC-2598-2026 Amendment Draft 1789834967848.docx", type: "Parallel", status: "Request for Change", progress: "Step 2 of 2", requestedBy: "Omar Siddiqui", date: "2026-09-21" }
    ];

    container.innerHTML = `
      <div style="display: flex; gap: 14px; margin-top: 14px; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
        <button class="detail-subtab-btn active" style="padding: 6px 12px; font-size: 13px;">Inbox History</button>
        <button class="detail-subtab-btn" style="padding: 6px 12px; font-size: 13px;" onclick="showToast('Outbox History active', 'info')">Outbox History</button>
      </div>

      <div class="approvals-table-container">
        <table class="approvals-sp-table">
          <thead>
            <tr>
              <th style="min-width: 320px;">Name <svg class="th-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></th>
              <th style="min-width: 140px;">Approval Type <svg class="th-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></th>
              <th style="min-width: 140px;">Status</th>
              <th style="min-width: 160px;">Progress</th>
              <th style="min-width: 160px;">Requested By <svg class="th-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></th>
              <th style="min-width: 140px;">Requested on <svg class="th-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></th>
            </tr>
          </thead>
          <tbody>
            ${historyList.map(h => {
              const isRFC = h.status === 'Request for Change';
              return `
                <tr style="cursor: pointer;" onclick="switchRoute('approval_review', 'APP-F01')">
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="color: #008272; font-size: 14px;">↗</span>
                      <span style="font-weight: 600; color: #1e293b;">${h.name}</span>
                    </div>
                  </td>
                  <td><span class="${h.type === 'Parallel' ? 'badge-parallel' : 'badge-sequential'}">${h.type}</span></td>
                  <td><span style="font-weight: 600; color: ${isRFC ? '#dc2626' : '#334155'};">${h.status}</span></td>
                  <td>
                    <div class="approval-progress-wrap">
                      <div class="approval-progress-bar-bg"><div class="approval-progress-bar-fill" style="width: 100%; background: ${isRFC ? '#ea580c' : '#008272'};"></div></div>
                      <span class="approval-progress-label">${h.progress}</span>
                    </div>
                  </td>
                  <td>${h.requestedBy}</td>
                  <td>${h.date}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

function filterAppTemplates(type, btn) {
  if (btn && btn.parentElement) {
    btn.parentElement.querySelectorAll('.filter-tag-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  showToast(`Filtered templates: ${type}`, 'info');
}

function openApprovalDetail(id) {
  if (String(id).startsWith('NCAPP-')) { NCApprove.fromInbox = true; switchRoute('nc_approve', id); return; }
  if (String(id).startsWith('MGAPP-')) { CDState.versionIndex = 0; switchRoute('mg_review', id); return; }
  switchRoute('approval_review', id);
}

// Global state for active approval review
let currentReviewItem = null;

function openApprovalReview(id) {
  const item = InnomickCMSData.approvals.inbox.find(i => i.id === id) || InnomickCMSData.approvals.inbox[0];
  currentReviewItem = item;

  const titleEl = document.getElementById('reviewContractTitle');
  const subEl = document.getElementById('reviewContractSubtitle');
  const refEl = document.getElementById('reviewRefNo');
  const nameEl = document.getElementById('reviewName');
  const typeEl = document.getElementById('reviewType');
  const valEl = document.getElementById('reviewValue');
  const venEl = document.getElementById('reviewVendor');
  const branchEl = document.getElementById('reviewBranch');
  const deptEl = document.getElementById('reviewDept');

  const itemName = item.name || item.title || 'Medical TPA Services';
  const itemRef = item.contractCode || item.code || 'INM/MID/SVC/1750/2025';

  if (titleEl) titleEl.textContent = `${itemName} — Approval Review`;
  if (subEl) subEl.textContent = `${itemRef} · ${itemName} · ${item.type || 'Service'}`;
  if (refEl) refEl.textContent = itemRef;
  if (nameEl) nameEl.textContent = itemName;
  if (typeEl) typeEl.textContent = item.type || 'Service';
  if (valEl) valEl.textContent = item.amount || '4,000 KWD';
  if (venEl) venEl.textContent = item.vendor || 'Nova Trading Co.';
  if (branchEl) branchEl.textContent = 'Innomick Technologies - HQ';
  if (deptEl) deptEl.innerHTML = `<span class="table-badge" style="background:#e0f2fe; color:#0369a1;">${item.department || 'Medical Insurance'}</span>`;

  // Reset stepper to active Step 1
  const s0 = document.getElementById('stepCircle0');
  const s1 = document.getElementById('stepCircle1');
  const s2 = document.getElementById('stepCircle2');
  const l1 = document.getElementById('stepLine1');
  const l2 = document.getElementById('stepLine2');

  if (s0) { s0.className = 'stepper-circle completed'; s0.innerHTML = '✓'; }
  if (s1) { s1.className = 'stepper-circle active'; s1.innerHTML = '1'; }
  if (s2) { s2.className = 'stepper-circle pending'; s2.innerHTML = '2'; }
  if (l1) l1.className = 'stepper-line completed';
  if (l2) l2.className = 'stepper-line';

  switchReviewVersionTab('amendment');
}

function switchReviewVersionTab(versionKey) {
  const tabs = document.querySelectorAll('.version-tabs-nav .version-tab-btn');
  tabs.forEach(t => t.classList.remove('active'));

  const contentEl = document.getElementById('reviewVersionContent');
  if (!contentEl) return;

  if (versionKey === 'amendment') {
    if (tabs[0]) tabs[0].classList.add('active');
    contentEl.innerHTML = `
      <div style="font-size: 12px; font-weight: 700; color: #008272; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">AMENDMENT DETAILS</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div>
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">ADDENDUM NUMBER</div>
          <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 4px;">INM/MID/SVC/1750/2025/Addendum</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">NEW EFFECTIVE DATE</div>
          <div style="font-size: 14px; font-weight: 600; color: #64748b; margin-top: 4px;">—</div>
        </div>
      </div>

      <div style="font-size: 12px; font-weight: 700; color: #008272; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">CONTRACT INFORMATION</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
        <div>
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">CONTRACT NAME</div>
          <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 4px;">Medical TPA Services</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">CONTRACT TYPE</div>
          <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 4px;">Service</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">CONTRACT VALUE (KWD)</div>
          <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 4px;">4,000</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">START DATE / END DATE</div>
          <div style="font-size: 14px; font-weight: 600; color: #64748b; margin-top: 4px;">— to —</div>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">DESCRIPTION</div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 6px; font-size: 13px; color: #334155;">
          test agreement scope and contractual commitments under Innomick SLA framework.
        </div>
      </div>

      <div style="font-size: 12px; font-weight: 700; color: #008272; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">CONTRACT OPTIONS</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">BUDGET STATUS</div>
          <div style="font-size: 13px; font-weight: 600; color: #166534; margin-top: 4px;">Approved Budget 2026</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">BUDGET CODE</div>
          <div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 4px;">BC-INM-2026-IT4</div>
        </div>
      </div>
    `;
  } else if (versionKey === 'extension') {
    if (tabs[1]) tabs[1].classList.add('active');
    contentEl.innerHTML = `
      <div style="font-size: 12px; font-weight: 700; color: #008272; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">EXTENSION DETAILS</div>
      <div style="background: #f0fdfa; border: 1px solid #ccfbf1; padding: 14px 18px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; color: #0f766e;">
        <strong>Extension Period:</strong> 2 July 2024 to 14 November 2024 &bull; Extended SLA coverage for maintenance support.
      </div>
    `;
  } else if (versionKey === 'renewal') {
    if (tabs[2]) tabs[2].classList.add('active');
    contentEl.innerHTML = `
      <div style="font-size: 12px; font-weight: 700; color: #008272; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">RENEWAL DETAILS</div>
      <div style="background: #f0fdfa; border: 1px solid #ccfbf1; padding: 14px 18px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; color: #0f766e;">
        <strong>Renewal Cycle:</strong> 23 July 2022 to 21 June 2024 &bull; Multi-year contract renewal signed.
      </div>
    `;
  } else {
    if (tabs[3]) tabs[3].classList.add('active');
    contentEl.innerHTML = `
      <div style="font-size: 12px; font-weight: 700; color: #008272; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">INITIAL CONTRACT DETAILS</div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; color: #334155;">
        Original Executed Agreement established 22 February 2021 &bull; Base terms and compliance framework.
      </div>
    `;
  }
  contentEl.innerHTML += reviewVersionTail(versionKey);
}

// Options, vendor bid, justifications and documents shown under every version tab
function reviewVersionTail(versionKey) {
  const item = currentReviewItem || {};
  const vendor = item.vendor || 'Alpha Tech';
  const label = { amendment: 'Amendment', extension: 'Extension', renewal: 'Renewal' }[versionKey] || '';
  const sectionTitle = t => `<div class="cd-section-title">${t}</div>`;
  const field = (l, v) => `<div class="cd-ro-field"><label>${l}</label><div>${v}</div></div>`;
  const doc = (name, optional) => `
    <div class="cd-doc-row">
      <span class="cd-doc-icon">&#128196;</span>
      <div><div class="cd-doc-name">${name}${optional ? ' <span>(Optional)</span>' : ''}</div><div class="cd-doc-sub">Not uploaded</div></div>
    </div>`;

  return `
    <div class="cd-ro-grid" style="margin-top: 16px;">
      ${field('Renewable', 'Yes')}
      ${field('Auto Renewal', 'Off')}
      ${field('Extendable', 'Yes')}
      ${field('Notice Period (Months)', '1')}
    </div>
    ${sectionTitle('COMPETITIVE BIDDING')}
    ${field('Procurement Mode', 'Single Source')}
    <table class="cms-table cd-vendor-table">
      <thead><tr><th>Serial Number</th><th>Vendor Name</th><th>Price (KWD)</th><th>Selected</th></tr></thead>
      <tbody><tr><td>1</td><td>${vendor}</td><td>${item.amount ? String(item.amount).replace(/[^0-9,]/g, '') : '2,000'}</td><td><span class="cd-selected-dot">&#10003;</span></td></tr></tbody>
    </table>
    ${field('Recommended Vendor', vendor)}
    ${field('Vendor Justification', 'Existing contracted vendor with proven delivery.')}
    ${field('Recommendation Justification', 'Testing completed; recommended for approval.')}
    ${sectionTitle('PRIMARY DOCUMENTS')}
    ${doc(`Signed ${label ? label + ' ' : ''}Contract Request Letter`)}
    ${doc('Legal Signed Contract')}
    ${doc(`${label ? label + ' ' : ''}Contract Request Letter`, true)}
    ${doc('Contract Draft', true)}
    ${sectionTitle('SUPPORTING DOCUMENTS')}
    <div class="cd-doc-row">
      <span class="cd-doc-icon">&#128206;</span>
      <div class="cd-doc-name">Vendor_Quotation.pdf</div>
      <button class="btn-outline-teal nc-doc-btn" style="margin-left:auto;" onclick="showToast('Opening Vendor_Quotation.pdf', 'info')">Preview</button>
    </div>`;
}

function openApprovalHistoryModal() {
  openModal('approvalHistoryModal');
}

function openApprovalCertificateModal() {
  if (currentReviewItem) {
    const ref = currentReviewItem.contractCode || currentReviewItem.code || 'INM/MID/SVC/1750/2025';
    const name = currentReviewItem.name || currentReviewItem.title || 'Medical TPA Services';
    const headerTitle = document.getElementById('certModalHeaderTitle');
    const certRef = document.getElementById('certModalRef');
    const tableRef = document.getElementById('certTableRef');
    const tableName = document.getElementById('certTableName');
    const tableType = document.getElementById('certTableType');
    const tableVendor = document.getElementById('certTableVendor');
    const tableVal = document.getElementById('certTableValue');
    const tableDept = document.getElementById('certTableDept');

    if (headerTitle) headerTitle.textContent = `Approval Certificate - ${ref}`;
    const reqType = currentReviewItem.requestType || 'New';
    if (certRef) certRef.textContent = `Certificate Ref: ${ref}-${reqType.slice(0, 3).toUpperCase()}`;
    const reqTypeEl = document.getElementById('certTableReqType');
    if (reqTypeEl) reqTypeEl.textContent = reqType;
    if (tableRef) tableRef.textContent = ref;
    if (tableName) tableName.textContent = name;
    if (tableType) tableType.textContent = currentReviewItem.type || 'Service';
    if (tableVendor) tableVendor.textContent = currentReviewItem.vendor || 'Nova Trading Co.';
    if (tableVal) tableVal.textContent = currentReviewItem.amount || '4,000 KWD';
    if (tableDept) tableDept.textContent = currentReviewItem.department || 'Medical Insurance';
  }
  openModal('approvalCertificateModal');
}

function openApprovalRejectModal() {
  openModal('approvalRejectModal');
}

function openApprovalRequestChangeModal() {
  openModal('approvalRequestChangeModal');
}

function approveCurrentReview() {
  const s1 = document.getElementById('stepCircle1');
  const s2 = document.getElementById('stepCircle2');
  const l2 = document.getElementById('stepLine2');

  if (s1) { s1.className = 'stepper-circle completed'; s1.innerHTML = '✓'; }
  if (l2) l2.className = 'stepper-line completed';
  if (s2) { s2.className = 'stepper-circle active'; s2.innerHTML = '2'; }

  // Add approval note to comment list
  const thread = document.getElementById('reviewCommentsThread');
  if (thread) {
    const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    thread.insertAdjacentHTML('afterbegin', `
      <div class="comment-bubble" style="background: #f0fdfa; border-color: #99f6e4;">
        <div class="comment-bubble-author" style="color: #0f766e;">
          <span>Arjun Mehta (Approved Step 1)</span>
          <span style="font-weight: normal; color: #64748b;">Today, ${dateStr}</span>
        </div>
        <div style="color: #134e4a;">Document review approved and signed off. Passed to Step 2 (Sara Thomas).</div>
      </div>
    `);
  }

  // Update certificate text if opened later
  const certChain = document.getElementById('certApprovalChainText');
  if (certChain) {
    certChain.innerHTML = `
      <div style="color: #0f766e; font-weight: 600;">
        ✓ Step 1 Approved by Arjun Mehta on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">SHA256: e87b419c8d20914a2f8190772f41bb218001de9</div>
    `;
  }

  showToast('Contract step approved successfully by Arjun Mehta', 'success');
}

function submitRejectApproval() {
  const reason = document.getElementById('rejectReasonInput').value || 'Rejection confirmed';
  closeModal('approvalRejectModal');
  showToast(`Approval rejected: ${reason}`, 'info');
}

function submitRequestChange() {
  const notes = document.getElementById('requestChangeInput').value || 'Changes requested';
  closeModal('approvalRequestChangeModal');
  showToast(`Changes requested from author: ${notes}`, 'info');
}

function addReviewComment() {
  const input = document.getElementById('reviewCommentInput');
  const text = (input ? input.value : '').trim();
  if (!text) {
    showToast('Please type a comment first', 'info');
    return;
  }

  const thread = document.getElementById('reviewCommentsThread');
  if (thread) {
    const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    thread.insertAdjacentHTML('afterbegin', `
      <div class="comment-bubble">
        <div class="comment-bubble-author">
          <span>Arjun Mehta</span>
          <span style="font-weight: normal; color: #64748b;">Today, ${dateStr}</span>
        </div>
        <div style="color: #334155;">${text}</div>
      </div>
    `);
  }

  input.value = '';
  showToast('Comment added to review thread', 'success');
}

// Workflow Builder handlers
function openWorkflowChoiceModal() {
  openModal('createWorkflowChoiceModal');
}

function openSequentialWorkflowBuilder(type = 'sequential', existingName = null) {
  closeModal('createWorkflowChoiceModal');
  const nameInput = document.getElementById('wfTemplateName');
  if (nameInput) {
    nameInput.value = existingName || (type === 'parallel' ? 'Innomick Parallel Review' : 'Innomick Sequential Review');
  }
  openModal('individualWorkflowModal');
}

function addWorkflowStepItem() {
  const container = document.getElementById('workflowStepsContainer');
  if (!container) return;

  const stepCount = container.children.length + 1;
  const stepHtml = `
    <div class="workflow-step-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; position: relative;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div style="font-size: 12px; font-weight: 700; color: #008272;">Step ${stepCount}</div>
        <button class="btn-icon-subtle" style="color: #ef4444;" onclick="this.closest('.workflow-step-card').remove();">&times;</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div class="modal-field">
          <label class="modal-label">Step Name</label>
          <input type="text" class="cms-input" placeholder="Enter Step Name" value="Department Head Sign-off">
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 12px; font-weight: 600; color: #475569;">Internal Organization Approver</span>
          <input type="checkbox" checked style="accent-color: #008272; width: 18px; height: 18px;">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="modal-field">
            <label class="modal-label">Selection Mode</label>
            <select class="cms-select">
              <option selected>Search by Name</option>
              <option>Role Based</option>
            </select>
          </div>
          <div class="modal-field">
            <label class="modal-label">Approver</label>
            <select class="cms-select">
              <option>Sara Thomas</option>
              <option>Zubair</option>
              <option>Arjun Mehta</option>
            </select>
          </div>
        </div>
        <div class="modal-field">
          <label class="modal-label">Action</label>
          <input type="text" class="cms-input" readonly value="Review & Approve" style="background: #e2e8f0;">
        </div>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', stepHtml);
  showToast(`Step ${stepCount} added to workflow`, 'info');
}

function submitIndividualWorkflow() {
  const name = document.getElementById('wfTemplateName').value.trim() || 'New Innomick Workflow';
  closeModal('individualWorkflowModal');
  showToast(`Workflow Template "${name}" created successfully`, 'success');
  if (CMSState.currentRoute === 'approvals') {
    switchApprovalTab('templates');
  }
}

// Request Details View Handlers
function openRequestDetailsView(reqId) {
  const req = InnomickCMSData.requests.find(r => r.id === reqId || r.refNo === reqId) || InnomickCMSData.requests[0];
  if (!req) return;

  const refEl = document.getElementById('reqDetailRefNo');
  const typeEl = document.getElementById('reqDetailType');
  const nameEl = document.getElementById('reqDetailName');
  const valEl = document.getElementById('reqDetailValue');
  const startEl = document.getElementById('reqDetailStartDate');
  const endEl = document.getElementById('reqDetailEndDate');
  const badgeEl = document.getElementById('reqDetailBadge');

  if (refEl) refEl.textContent = req.refNo;
  if (typeEl) typeEl.textContent = req.requestType || 'Service';
  if (nameEl) nameEl.value = req.contractName || 'Enterprise Cloud Agreement';
  if (valEl) valEl.value = req.contractValue || '12,345';
  if (startEl) startEl.value = req.startDate || '16-10-2026';
  if (endEl) endEl.value = req.endDate || '31-10-2026';
  if (badgeEl) badgeEl.textContent = req.status || 'In Approval';

  switchRequestSubTab('detail');
}

function switchRequestSubTab(tab) {
  const tabs = ['detail', 'primary', 'supporting', 'history'];
  tabs.forEach(t => {
    const btn = document.getElementById(`reqTabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const panel = document.getElementById(`reqSubPanel${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) btn.classList.toggle('active', t === tab);
    if (panel) panel.style.display = (t === tab) ? 'block' : 'none';
  });
}

function addRequestComment() {
  const input = document.getElementById('reqCommentInput');
  if (!input || !input.value.trim()) return;
  showToast('Approver comment added to request audit', 'success');
  input.value = '';
}

// Contract Details View Handlers
function openContractDetailsView(contractId) {
  cdRender(contractId);
}

function switchContractSubTab(tab) {
  const tabs = ['detail', 'primary', 'supporting', 'contract_history', 'approval_history', 'certificate'];
  tabs.forEach(t => {
    const formatted = t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    const btn = document.getElementById(`conTabBtn${formatted}`);
    const panel = document.getElementById(`conSubPanel${formatted}`);
    if (btn) btn.classList.toggle('active', t === tab);
    if (panel) panel.style.display = (t === tab) ? 'block' : 'none';
  });
}

// Template Editor Handlers
function openTemplateEditorView(templateId) {
  tplRenderEditor(templateId);
}


// Excel Import Wizard Handlers
let excelWizardStep = 1;

function initExcelWizard() {
  excelWizardStep = 1;
  updateExcelWizardUI();
  const fileInfo = document.getElementById('excelUploadedInfo');
  if (fileInfo) fileInfo.style.display = 'none';
}

function simulateExcelUpload() {
  const fileInfo = document.getElementById('excelUploadedInfo');
  if (fileInfo) fileInfo.style.display = 'block';
  showToast('Innomick_Legacy_Contracts_Batch_2026.xlsx loaded', 'success');
}

function advanceExcelWizard() {
  excelWizardStep++;
  if (excelWizardStep > 6) {
    showToast('All 24 contracts successfully imported into Innomick CMS database', 'success');
    InnomickCMSData.importedContracts.unshift({
      id: `IMP-10${InnomickCMSData.importedContracts.length + 1}`,
      fileName: 'Innomick_Legacy_Contracts_Batch_2026.xlsx',
      recordsCount: 24,
      importedDate: 'Today',
      importedBy: InnomickCMSData.currentUser.name,
      status: 'Successfully Ingested'
    });
    switchRoute('import');
    return;
  }
  updateExcelWizardUI();
  if (excelWizardStep === 2) showToast('Validating schema and mandatory columns...', 'info');
  else if (excelWizardStep === 3) showToast('Contracts preview matched 24 valid rows', 'info');
  else if (excelWizardStep === 4) showToast('Supporting SLA annexures linked', 'info');
  else if (excelWizardStep === 5) showToast('Ingesting contract database records...', 'info');
  else if (excelWizardStep === 6) showToast('Import completed successfully', 'success');
}

function updateExcelWizardUI() {
  for (let i = 1; i <= 6; i++) {
    const pill = document.getElementById(`importStep${i}`);
    if (pill) {
      pill.classList.remove('active', 'completed');
      if (i === excelWizardStep) pill.classList.add('active');
      else if (i < excelWizardStep) pill.classList.add('completed');
    }
  }

  const btn = document.getElementById('btnExcelProceed');
  if (btn) {
    if (excelWizardStep === 1) btn.textContent = 'Upload Excel';
    else if (excelWizardStep === 2) btn.textContent = 'Validate Data';
    else if (excelWizardStep === 3) btn.textContent = 'Preview Records';
    else if (excelWizardStep === 4) btn.textContent = 'Attach Documents';
    else if (excelWizardStep === 5) btn.textContent = 'Execute Ingestion';
    else btn.textContent = 'Finish & Return to Batches';
  }
}

function downloadImportTemplate() {
  showToast('Downloading Innomick_Contract_Schema_Template.xlsx...', 'info');
}

// Manual Import Handlers
function openManualImportModal() {
  openModal('manualImportModal');
}

function submitManualImport() {
  closeModal('manualImportModal');
  showToast('Initiating manual single contract creation...', 'info');
  openNewContractModal('New Contract');
}

// ============================================================================
// 7. TEMPLATES VIEW LOGIC (3-Column Grid matching Screenshot 07)
// ============================================================================
function renderTemplates(dataList = InnomickCMSData.templates) {
  const container = document.getElementById('templatesGridContainer');
  if (!container) return;

  if (dataList.length === 0) {
    container.innerHTML = '<div class="empty-table-state" style="grid-column: 1 / -1;">No contract templates found.</div>';
    return;
  }

  container.className = 'templates-grid-sp';
  container.innerHTML = dataList.map(tpl => `
    <div class="template-pill-card" onclick="switchRoute('template_view', '${tpl.id}')" title="${tpl.name}">
      <div class="template-pill-left">
        <svg class="template-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M8 15s1.5 2 4 2 4-2 4-2"/>
        </svg>
        <span class="template-pill-title">${tpl.name}</span>
      </div>
      <button class="template-pill-edit-btn" title="Edit Template" onclick="event.stopPropagation(); editTemplate('${tpl.id}', '${tpl.name}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      </button>
    </div>
  `).join('');
}

function filterTemplates(query) {
  CMSState.filters.templates.search = query.toLowerCase().trim();
  applyTemplateView();
}

function sortTemplates(sortOption) {
  CMSState.filters.templates.sort = sortOption;
  applyTemplateView();
}

// Applies the current search text and sort option together
function applyTemplateView() {
  const q = CMSState.filters.templates.search || '';
  const list = InnomickCMSData.templates.filter(tpl =>
    tpl.name.toLowerCase().includes(q) || (tpl.category || '').toLowerCase().includes(q));
  renderTemplates(sortTemplateList(list, CMSState.filters.templates.sort || 'name_asc'));
}

function templateDate(tpl) {
  if (tpl.createdAt) return tpl.createdAt;
  const t = Date.parse(tpl.updated);
  return isNaN(t) ? Date.now() : t;
}

// Contract type (Service / Purchase / Construction) a template belongs to
function templateContractType(tpl) {
  if (tpl.contractType) return tpl.contractType;
  if (/construct|civil|works/i.test(tpl.name)) return 'Construction';
  if (/purchase|supply|equipment|hardware|lease|order/i.test(tpl.name)) return 'Purchase';
  return 'Service';
}

// Shared by the Templates page and the New Contract template picker
function sortTemplateList(list, option) {
  const sorted = [...list];
  if (option === 'name_desc') sorted.sort((a, b) => b.name.localeCompare(a.name));
  else if (option === 'date_desc') sorted.sort((a, b) => templateDate(b) - templateDate(a));
  else if (option === 'date_asc') sorted.sort((a, b) => templateDate(a) - templateDate(b));
  else sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
}

function editTemplate(id, name) {
  switchRoute('template_editor', id);
}


function saveTemplateEdit(id) {
  const newName = document.getElementById('tplEditName').value.trim();
  const newCat = document.getElementById('tplEditCategory').value.trim();
  const tpl = InnomickCMSData.templates.find(t => t.id === id);
  if (tpl) {
    if (newName) tpl.name = newName;
    if (newCat) tpl.category = newCat;
    tpl.updated = 'Just now';
    renderTemplates();
  }
  closeModal('templateEditorModal');
  showToast(`Template "${newName || 'Contract Template'}" saved successfully!`, 'success');
}

// ============================================================================
// 8. NOTIFICATIONS VIEW LOGIC (Matching live SharePoint Arjun Mehta view)
// ============================================================================
function renderNotifications() {
  const container = document.getElementById('notificationsListContainer');
  if (!container) return;

  if (InnomickCMSData.notifications.length === 0) {
    container.innerHTML = '<div class="empty-table-state">No notifications available.</div>';
    return;
  }

  container.className = 'notifications-sp-list';
  container.innerHTML = InnomickCMSData.notifications.map(n => `
    <div class="notification-sp-row ${n.stepCode ? 'style-blue' : ''}" onclick="markNotificationRead('${n.id}')">
      <div class="notification-sp-msg">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>${n.message || n.title}</span>
      </div>
      <button class="btn-take-action" onclick="event.stopPropagation(); handleNotificationAction('${n.id}')">
        ${n.actionText || 'Take Action'}
      </button>
    </div>
  `).join('');
}

function handleNotificationAction(id) {
  markNotificationRead(id);
  switchRoute('approvals');
  showToast('Redirected to Approvals for review', 'info');
}

function markNotificationRead(id) {
  const notif = InnomickCMSData.notifications.find(n => n.id === id);
  if (notif && notif.unread) {
    notif.unread = false;
    renderNotifications();
    const unreadCount = InnomickCMSData.notifications.filter(n => n.unread).length;
    const badge = document.getElementById('topbarNotifBadge');
    if (badge) badge.textContent = unreadCount;
  }
}

// User Profile Switching Logic
function toggleUserProfileMenu() {
  const menu = document.getElementById('userProfileMenu');
  if (menu) {
    menu.classList.toggle('open');
  }
}

function switchUserProfile(profileKey) {
  const profile = InnomickCMSData.userProfiles[profileKey];
  if (!profile) return;

  InnomickCMSData.activeProfileKey = profileKey;
  InnomickCMSData.currentUser.name = profile.name;
  InnomickCMSData.currentUser.avatar = profile.initials;
  InnomickCMSData.currentUser.email = profile.email;

  // Update Topbar avatar & info
  const avatarEl = document.getElementById('topbarUserAvatar');
  if (avatarEl) avatarEl.textContent = profile.initials;
  
  const userBtn = document.getElementById('userProfileBtn');
  if (userBtn) userBtn.title = `${profile.name} (Click to switch user)`;

  const nameEl = document.getElementById('activeProfileName');
  if (nameEl) nameEl.textContent = profile.name;

  const emailEl = document.getElementById('activeProfileEmail');
  if (emailEl) emailEl.textContent = profile.email;

  // Update active state in menu items
  ['arjun', 'sara', 'zubair'].forEach(k => {
    const item = document.getElementById('profileItem' + k.charAt(0).toUpperCase() + k.slice(1));
    if (item) {
      if (k === profileKey) item.classList.add('active');
      else item.classList.remove('active');
    }
  });

  // Update notification badge
  const sidebarNotif = document.getElementById('sidebarNotifBadge') || document.getElementById('sidebarNotifCount');
  if (sidebarNotif) sidebarNotif.textContent = cmsMyInbox().length;

  // Update Statistics KPI numbers
  if (profile.stats) {
    InnomickCMSData.statistics.pendingApprovals = profile.stats.pendingApprovals;
    InnomickCMSData.statistics.expiringSoon = profile.stats.expiringSoon;
    InnomickCMSData.statistics.stuckApprovals = profile.stats.stuckApprovals;
    InnomickCMSData.statistics.draftsAging = profile.stats.draftsAging;
    InnomickCMSData.statistics.pendingExecution = profile.stats.pendingExecution;
    InnomickCMSData.statistics.noticePeriod = profile.stats.noticePeriod;
    renderStatistics();
  }

  // Close menu
  const menu = document.getElementById('userProfileMenu');
  if (menu) menu.classList.remove('open');

  showToast(`Switched active profile to ${profile.name}`, 'info');
}

// Close user profile menu if clicked outside
document.addEventListener('click', function(e) {
  const menu = document.getElementById('userProfileMenu');
  const btn = document.getElementById('userProfileBtn');
  if (menu && menu.classList.contains('open')) {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.remove('open');
    }
  }
});


// ============================================================================
// 9. CONTRACT IMPORT VIEW LOGIC
// ============================================================================
function renderImportBatches() {
  const tbody = document.getElementById('importedBatchesTableBody');
  if (!tbody) return;

  // Imported contracts are the migrated ones (marked with the "M" badge elsewhere)
  const list = (InnomickCMSData.migrated || []).concat(InnomickCMSData.contracts.filter(c => c.hasIcon));
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-table-state">No imported contracts found</td></tr>';
    return;
  }

  const badge = st => st === 'In Approval' || st === 'Request for Change' ? `<span class="badge-in-approval">${st}</span>`
    : st === 'Active' ? '<span class="badge-approved">Active</span>'
    : ['Rejected', 'Archived', 'Notice Period'].includes(st) ? `<span class="badge-rejected">${st}</span>`
    : st === 'Approved' ? '<span class="badge-approved">Approved</span>' : `<span class="badge-draft">${st}</span>`;

  tbody.innerHTML = list.map(c => `
    <tr>
      <td><a href="javascript:void(0)" class="req-ref-link" onclick="openContractDetailsById('${c.id}')">${c.code}</a></td>
      <td>${c.name}</td>
      <td>${c.requestType || 'New'}</td>
      <td>${badge(c.status)}</td>
      <td>${c.vendor}</td>
      <td>${c.department}</td>
      <td>
        <div class="duration-cell">
          <div class="duration-header">
            <span class="duration-length">${c.durationMonths || ''}</span>
            <span class="duration-dates">${c.durationDates || ''}</span>
          </div>
          <div class="duration-progress-track"><div class="duration-progress-bar" style="width: ${c.durationProgress || 0}%;"></div></div>
        </div>
      </td>
      <td>${c.contractValue || Number(c.value || 0).toLocaleString()}</td>
      <td>${c.category}</td>
    </tr>
  `).join('');
}

function openImportModal(mode) {
  const titleEl = document.getElementById('importModalTitle');
  const bodyContent = document.getElementById('importModalBodyContent');
  const btnRun = document.getElementById('btnRunImport');

  if (mode === 'excel') {
    titleEl.textContent = 'Excel Contract Import Wizard';
    bodyContent.innerHTML = `
      <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">
        Upload your Microsoft Excel (.xlsx) file containing standardized contract records, SLA parameters, and vendor metadata.
      </p>
      <div style="border: 2px dashed #008272; border-radius: 8px; padding: 36px 20px; text-align: center; background: #f0f7f6; cursor: pointer;">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#008272" stroke-width="1.8" style="margin-bottom: 8px;">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <div style="font-size: 14px; font-weight: 600; color: #1e293b;">Click to select or drag and drop Excel spreadsheet</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Supports Innomick_Contract_Schema_v2.xlsx</div>
      </div>
    `;
    btnRun.textContent = 'Ingest Excel Data';
  } else {
    titleEl.textContent = 'Manual Contract Migration Entry';
    bodyContent.innerHTML = `
      <div class="modal-field">
        <label class="modal-label">Legacy Contract Reference</label>
        <input type="text" id="manualRefInput" class="cms-input" placeholder="e.g. LEGACY-KUW-2024-C9">
      </div>
      <div class="modal-field">
        <label class="modal-label">Vendor Organization</label>
        <input type="text" id="manualVendorInput" class="cms-input" placeholder="e.g. Dell EMC Technologies">
      </div>
      <div class="modal-field">
        <label class="modal-label">Contract Amount (USD)</label>
        <input type="number" id="manualAmountInput" class="cms-input" placeholder="e.g. 85000">
      </div>
    `;
    btnRun.textContent = 'Ingest Single Contract';
  }

  openModal('importModal');
}

function executeImport() {
  closeModal('importModal');
  showToast('Parsing and validating contract records...', 'info');

  setTimeout(() => {
    InnomickCMSData.importedContracts.unshift({
      id: `IMP-10${InnomickCMSData.importedContracts.length + 1}`,
      fileName: `Innomick_Migrated_Contracts_${Date.now().toString().slice(-4)}.xlsx`,
      recordsCount: 8,
      importedDate: 'Today',
      importedBy: InnomickCMSData.currentUser.name,
      status: 'Successfully Ingested'
    });

    renderImportBatches();
    showToast('Import batch completed: 8 contracts registered into active repository!', 'success');
  }, 600);
}

// ============================================================================
// 10. MODAL OPEN / CLOSE & HANDLERS
// ============================================================================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function openNewContractModal(workflowType = 'New Contract', selectedContract = null) {
  const titleEl = document.getElementById('newContractModalTitle');
  const btnEl = document.querySelector('#newContractModal .modal-footer button');
  
  if (titleEl) titleEl.textContent = workflowType;
  ncConfigureModal(workflowType === 'New Contract');
  if (btnEl) {
    if (workflowType.includes('Renew')) btnEl.textContent = 'Submit Renewal Request';
    else if (workflowType.includes('Cancel')) btnEl.textContent = 'Submit Cancellation Request';
    else if (workflowType.includes('Amend')) btnEl.textContent = 'Submit Contract Amendment';
    else if (workflowType.includes('Extension')) btnEl.textContent = 'Submit Extension Request';
    else if (workflowType.includes('Completion')) btnEl.textContent = 'Confirm Contract Completion';
    else btnEl.textContent = 'Create New Contract';
  }

  if (selectedContract) {
    const titleInput = document.getElementById('modalContractTitleInput');
    if (titleInput) titleInput.value = `${workflowType}: ${selectedContract.name}`;
    const vendorSelect = document.getElementById('modalVendorSelect');
    if (vendorSelect) vendorSelect.value = selectedContract.vendor;
    const deptSelect = document.getElementById('modalDeptSelect');
    if (deptSelect) deptSelect.value = selectedContract.department;
    const valInput = document.getElementById('modalAmountInput');
    if (valInput) valInput.value = selectedContract.value;
    const branchSelect = document.getElementById('modalBranchSelect');
    if (branchSelect) branchSelect.value = selectedContract.branch;
    const typeSelect = document.getElementById('modalTypeSelect');
    if (typeSelect && selectedContract.type) typeSelect.value = selectedContract.type;
  }
  
  openModal('newContractModal');
}

function submitNewContract() {
  if (document.getElementById('newContractModalTitle').textContent === 'New Contract') {
    ncCreateFromModal();
    return;
  }
  const branch = document.getElementById('modalBranchSelect').value;
  const dept = document.getElementById('modalDeptSelect').value;
  const type = document.getElementById('modalTypeSelect').value;
  const vendor = document.getElementById('modalVendorSelect').value;
  const title = document.getElementById('modalContractTitleInput').value.trim();
  const amount = document.getElementById('modalAmountInput').value;

  if (!title) {
    showToast('Please provide a Contract Title', 'info');
    return;
  }

  const newId = `REQ-90${InnomickCMSData.requests.length + 1}`;
  const formattedPrice = amount ? `$${parseFloat(amount).toLocaleString()}` : '$125,000';

  const newRequest = {
    id: newId,
    contractTitle: title,
    type: document.getElementById('newContractModalTitle').textContent || 'New Contract',
    vendor: vendor || 'Microsoft Corporation (Azure & M365)',
    branch: branch || InnomickCMSData.branches[0],
    department: dept || InnomickCMSData.departments[0],
    price: formattedPrice,
    status: 'Under Review',
    submittedBy: InnomickCMSData.currentUser.name,
    submitDate: 'Today',
    currentStage: 'Legal Evaluation'
  };

  InnomickCMSData.requests.unshift(newRequest);
  closeModal('newContractModal');
  renderRequestsTable();
  switchRoute('requests');
  showToast(`Contract request ${newId} submitted for executive review!`, 'success');
}

function openCreateApprovalTemplateModal() {
  openModal('createApprovalTemplateModal');
}

function submitCreateApprovalTemplate() {
  const nameInput = document.getElementById('modalAppTemplateNameInput');
  const name = (nameInput && nameInput.value.trim()) || 'Custom Innomick Approval Workflow';
  const typeSelect = document.getElementById('modalAppTemplateTypeSelect');
  const type = typeSelect ? typeSelect.value : 'Sequential';
  closeModal('createApprovalTemplateModal');
  showToast(`Approval Template "${name}" (${type}) created successfully!`, 'success');
}

function openCreateTemplateModal() {
  openModal('createTemplateModal');
}

function submitCreateTemplate() {
  const type = document.getElementById('modalTemplateTypeSelect').value;
  if (!type) {
    showToast('Please select a Contract Type', 'info');
    return;
  }
  closeModal('createTemplateModal');
  switchRoute('template_editor', 'new:' + type);
}

function openContractDetailsById(contractIdOrCode) {
  switchRoute('contract_detail', contractIdOrCode);
}

function openRequestDetails(reqId) {
  if (typeof NCState !== 'undefined' && NCState.records[reqId]) {
    const rec = NCState.records[reqId];
    switchRoute(rec.template ? 'nc_details' : 'nc_template_select', reqId);
    return;
  }
  switchRoute('request_detail', reqId);
}


function handleActionItem(actionId, contractId) {
  openContractDetailsById(contractId);
}

function downloadContractSummary() {
  showToast('Exporting sanitized Innomick contract summary PDF...', 'success');
  closeModal('contractDetailsModal');
}

// ============================================================================
// 11. GLOBAL SEARCH & FAVORITES
// ============================================================================
function handleGlobalSearch(query) {
  const q = query.toLowerCase().trim();
  if (!q) return;

  // Search across contracts, requests, templates
  const matchContract = InnomickCMSData.contracts.find(c => c.name.toLowerCase().includes(q) || c.vendor.toLowerCase().includes(q));
  if (matchContract) {
    switchRoute('contracts');
    showToast(`Found contract: ${matchContract.name}`, 'info');
    return;
  }

  const matchReq = InnomickCMSData.requests.find(r => r.contractTitle.toLowerCase().includes(q) || r.vendor.toLowerCase().includes(q));
  if (matchReq) {
    switchRoute('requests');
    showToast(`Found request: ${matchReq.contractTitle}`, 'info');
    return;
  }
}

function toggleFavorite() {
  CMSState.isFavorited = !CMSState.isFavorited;
  const btn = document.getElementById('favoriteToggleBtn');
  const txt = document.getElementById('favoriteBtnText');

  if (CMSState.isFavorited) {
    btn.classList.add('favorited');
    txt.textContent = 'Favorited';
    showToast('Contract Management System added to your SharePoint favorites', 'success');
  } else {
    btn.classList.remove('favorited');
    txt.textContent = 'Add to favorites';
    showToast('Removed from favorites', 'info');
  }
}

// ============================================================================
// 12. COPILOT AI INTERACTION & TOAST NOTIFICATIONS
// ============================================================================
function toggleCopilotAssistant() {
  showToast('Copilot AI: "Analyzing 42 active vendor agreements for Q4 budget compliance..."', 'info');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}


// ============================================================================
// 13. CONTRACT SELECTION VIEW LOGIC (Screenshot 02 Live SharePoint Replication)
// ============================================================================
const CSActionConfig = {
  renew: {
    title: 'Contract Renewal Request',
    btnText: 'Renew Contract',
    prompt: 'Select a contract to start Renewal request',
    emptyMsg: 'No data found on Renewal request'
  },
  cancel: {
    title: 'Contract Cancellation Request',
    btnText: 'Cancel Contract',
    prompt: 'Select a contract to start Cancellation request',
    emptyMsg: 'No data found on Cancellation request'
  },
  amend: {
    title: 'Contract Amendment Request',
    btnText: 'Amend Contract',
    prompt: 'Select a contract to start Amendment request',
    emptyMsg: 'No data found on Amendment request'
  },
  extension: {
    title: 'Contract Extension Request',
    btnText: 'Extend Contract',
    prompt: 'Select a contract to start Extension request',
    emptyMsg: 'No data found on Extension request'
  },
  completion: {
    title: 'Contract Completion Request',
    btnText: 'Complete Contract',
    prompt: 'Select a contract to start Completion request',
    emptyMsg: 'No data found on Completion request'
  }
};

function renderContractSelection() {
  const actionType = CMSState.currentActionType || 'renew';
  const config = CSActionConfig[actionType] || CSActionConfig.renew;

  const titleEl = document.getElementById('csPageTitle');
  if (titleEl) titleEl.textContent = config.title;

  const btnTextEl = document.getElementById('csActionBtnText');
  if (btnTextEl) btnTextEl.textContent = config.btnText;

  const promptEl = document.getElementById('csPromptText');
  if (promptEl) promptEl.textContent = config.prompt;

  // Read filter values
  const fBranch = document.getElementById('csFilterBranch')?.value || 'all';
  const fDept = document.getElementById('csFilterDept')?.value || 'all';
  const fVendor = document.getElementById('csFilterVendor')?.value || 'all';
  const fCat = document.getElementById('csFilterCategory')?.value || 'all';
  const fMinPrice = parseFloat(document.getElementById('csPriceMin')?.value) || 0;
  const fMaxPrice = parseFloat(document.getElementById('csPriceMax')?.value) || Infinity;
  const fCreatedByMe = document.getElementById('csCreatedByMeToggle')?.checked || false;

  // Which contracts each request type can start from
  const eligible = {
    renew: ['Active', 'Expired', 'Expiring Soon', 'Notice Period'],
    cancel: null,
    amend: ['Active', 'Expiring Soon', 'Notice Period'],
    extension: ['Expiring Soon', 'Notice Period'],
    completion: ['Active', 'Expiring Soon', 'Notice Period']
  }[actionType];

  let filtered = InnomickCMSData.contracts.filter(c => {
    if (c.status === 'Archived') return false;
    if (eligible && !eligible.includes(c.status)) return false;
    if (actionType === 'renew' && (c.renewable || 'Yes') !== 'Yes') return false;
    if (actionType === 'extension' && (c.extendable || 'Yes') !== 'Yes') return false;
    if (actionType === 'cancel' && (c.status === 'Expired' || c.requestType === 'Cancellation')) return false;
    if (fBranch !== 'all' && c.branch !== fBranch) return false;
    if (fDept !== 'all' && c.department !== fDept) return false;
    if (fVendor !== 'all' && c.vendor !== fVendor) return false;
    if (fCat !== 'all' && c.category !== fCat) return false;
    if (c.value < fMinPrice) return false;
    if (c.value > fMaxPrice) return false;
    if (fCreatedByMe && c.owner !== InnomickCMSData.currentUser.name) return false;
    return true;
  });

  const countEl = document.getElementById('csRecordCount');
  if (countEl) countEl.textContent = `${filtered.length} records shown`;

  const container = document.getElementById('csContentContainer');
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="no-data-found-teal">
        ${config.emptyMsg}
      </div>
    `;
    return;
  }

  const statusBadge = st => {
    if (st === 'In Approval') return '<span class="badge-in-approval">In Approval</span>';
    if (st === 'Active') return '<span class="badge-approved">Active</span>';
    return `<span class="badge-draft">${st}</span>`;
  };

  container.innerHTML = `
    <div class="cms-table-wrapper">
      <table class="cms-table cs-select-table">
        <thead>
          <tr>
            <th style="width: 36px;"></th>
            <th>Contract ID</th>
            <th>Contract Name</th>
            <th>Status</th>
            <th>Vendor Name</th>
            <th>Department</th>
            <th style="min-width: 220px;">Contract Duration</th>
            <th>Contract Value</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(c => `
            <tr class="${CMSState.selectedContractId === c.id ? 'cs-row-selected' : ''}" onclick="selectCSContract('${c.id}')" style="cursor: pointer;">
              <td><input type="radio" name="csContractPick" ${CMSState.selectedContractId === c.id ? 'checked' : ''} style="accent-color: #008272;"></td>
              <td>
                <div class="ref-link-group">
                  <span>${c.code}</span>
                  ${c.hasIcon ? '<span class="ref-icon-circle" title="Migrated Contract">M</span>' : ''}
                </div>
              </td>
              <td>${c.name}</td>
              <td>${statusBadge(c.status)}</td>
              <td>${c.vendor}</td>
              <td>${c.department}</td>
              <td>
                <div class="duration-cell">
                  <div class="duration-header">
                    <span class="duration-length">${c.durationMonths || ''}</span>
                    <span class="duration-dates">${c.durationDates || ''}</span>
                  </div>
                  <div class="duration-progress-track">
                    <div class="duration-progress-bar" style="width: ${c.durationProgress || 0}%;"></div>
                  </div>
                </div>
              </td>
              <td>${c.contractValue || c.value.toLocaleString()}</td>
              <td>${c.category}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function selectCSContract(id) {
  CMSState.selectedContractId = id;
  renderContractSelection();
}

function applyCSFilters() {
  renderContractSelection();
}

function resetCSFilters() {
  const b = document.getElementById('csFilterBranch'); if (b) b.value = 'all';
  const d = document.getElementById('csFilterDept'); if (d) d.value = 'all';
  const v = document.getElementById('csFilterVendor'); if (v) v.value = 'all';
  const c = document.getElementById('csFilterCategory'); if (c) c.value = 'all';
  const min = document.getElementById('csPriceMin'); if (min) min.value = '';
  const max = document.getElementById('csPriceMax'); if (max) max.value = '';
  const toggle = document.getElementById('csCreatedByMeToggle'); if (toggle) toggle.checked = false;
  renderContractSelection();
  showToast('Filters reset', 'info');
}

function executeContractAction() {
  const actionType = CMSState.currentActionType || 'renew';
  const config = CSActionConfig[actionType] || CSActionConfig.renew;

  if (!CMSState.selectedContractId) {
    showToast(`Please select a contract to start ${config.btnText}`, 'info');
    return;
  }

  const contract = InnomickCMSData.contracts.find(c => c.id === CMSState.selectedContractId);
  if (!contract) return;

  ncCreateFromContract(contract, actionType);
}
