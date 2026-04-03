import './style.css';
import Chart from 'chart.js/auto';
import { companyData, getUniqueTeams } from './data.js';
import { analyzeResources } from './optimizer.js';
import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// ================================================
// STATE
// ================================================
const state = {
  disabledTeams: [],
  disabledInstances: [],
  theme: localStorage.getItem('theme') || 'light',
};

// ================================================
// THEME
// ================================================
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('theme', state.theme);

  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (icon) icon.textContent = state.theme === 'dark' ? '🌙' : '☀️';
  if (label) label.textContent = state.theme === 'dark' ? 'Dark Mode' : 'Light Mode';

  // Re-render charts with new theme colors
  renderAllCharts();
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
}

// ================================================
// THEME COLORS HELPER
// ================================================
function getThemeColors() {
  const isDark = state.theme === 'dark';
  return {
    text: isDark ? '#eef0fa' : '#1a1a2e',
    textSecondary: isDark ? '#7c87a8' : '#6b7280',
    grid: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)',
    accent1: isDark ? '#7c6ff7' : '#6c5ce7',
    accent2: isDark ? '#00d9d4' : '#0984e3',
    success: isDark ? '#00c9a7' : '#00b894',
    warning: isDark ? '#fdd870' : '#f39c12',
    danger: isDark ? '#ff7b7b' : '#e55039',
    cardBg: isDark ? 'rgba(14, 18, 48, 0.85)' : 'rgba(255,255,255,0.75)',
    barColors: isDark
      ? ['#7c6ff7', '#b8b0ff', '#00d9d4', '#1a9bf0', '#00c9a7', '#fdd870', '#ff8f70', '#ff7b7b']
      : ['#6c5ce7', '#a29bfe', '#00cec9', '#0984e3', '#00b894', '#fdcb6e', '#e17055', '#d63031'],
    heatmapLow: isDark ? '#090c18' : '#e8ecf4',
    heatmapHigh: isDark ? '#00d9d4' : '#6c5ce7',
  };
}

// ================================================
// DATA HELPERS
// ================================================
function getFilteredData() {
  return companyData.filter(
    d =>
      !state.disabledTeams.includes(d.team) &&
      !state.disabledInstances.includes(d.instance_id)
  );
}

function computeMetrics() {
  const filtered = getFilteredData();
  const results = analyzeResources(filtered);
  const currentCost = results.current_cost;
  const savings = currentCost - results.optimized_cost;
  const efficiency =
    results.current_instances > 0
      ? (results.required_instances / results.current_instances) * 100
      : 0;

  return { ...results, currentCost, savings, efficiency, filtered };
}


// ================================================
// UPDATE METRICS UI
// ================================================
function updateMetrics() {
  const m = computeMetrics();

  document.getElementById('metricRunning').textContent = m.current_instances;
  document.getElementById('metricRequired').textContent = m.instances_to_stop.length;

  const idleCount = m.instances_to_stop.length;
  const deltaEl = document.getElementById('metricRequiredDelta');
  deltaEl.textContent = idleCount > 0 ? `⚠️ ${idleCount} idle detected` : '✅ All instances active';
  deltaEl.className = `metric-delta ${idleCount > 0 ? 'negative' : 'positive'}`;

  // Sync slider
  const slider = document.getElementById('instanceSlider');
  const sliderValue = document.getElementById('sliderValue');
  const sliderMax = document.getElementById('sliderMax');
  const totalInstances = companyData.length;
  if (slider) {
    slider.max = totalInstances;
    slider.value = m.current_instances;
  }
  if (sliderValue) sliderValue.textContent = m.current_instances;
  if (sliderMax) sliderMax.textContent = totalInstances;

  document.getElementById('metricCost').textContent = `$${m.currentCost.toLocaleString()}`;
  document.getElementById('metricSavings').textContent = `$${m.savings.toLocaleString()}`;

  const effEl = document.getElementById('metricSavingsDelta');
  const savingsPct = m.currentCost > 0 ? ((m.savings / m.currentCost) * 100).toFixed(1) : 0;
  effEl.textContent = `↑ Save ${savingsPct}% with optimization`;
  effEl.className = `metric-delta ${parseFloat(savingsPct) > 0 ? 'positive' : ''}`;

  // Update gauge
  const efficiency = m.current_instances > 0
    ? (m.required_instances / m.current_instances) * 100
    : 0;
  updateGauge(efficiency);
}

// ================================================
// GAUGE
// ================================================
function updateGauge(value) {
  const circumference = 2 * Math.PI * 85; // r=85
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const progress = document.getElementById('gaugeProgress');
  if (progress) {
    progress.style.strokeDasharray = `${circumference}`;
    progress.style.strokeDashoffset = `${offset}`;

    // Color based on value
    let color;
    if (value < 50) color = getThemeColors().danger;
    else if (value < 80) color = getThemeColors().warning;
    else color = getThemeColors().success;
    progress.style.stroke = color;
  }

  const gaugeVal = document.getElementById('gaugeValue');
  if (gaugeVal) gaugeVal.textContent = value.toFixed(1);
}

// ================================================
// CHARTS
// ================================================
let teamChart = null;
let heatmapChart = null;
let forecastChart = null;

function renderAllCharts() {
  renderTeamBarChart();
  renderHeatmapChart();
  renderForecastChart();
  const m = computeMetrics();
  updateGauge(m.efficiency);
}

function renderTeamBarChart() {
  const ctx = document.getElementById('teamBarChart');
  if (!ctx) return;

  if (teamChart) teamChart.destroy();

  const filtered = getFilteredData();
  const teams = getUniqueTeams(filtered);
  const colors = getThemeColors();

  const teamAvgCpu = teams.map(team => {
    const teamData = filtered.filter(d => d.team === team);
    return teamData.length > 0
      ? teamData.reduce((s, d) => s + d.cpu_usage, 0) / teamData.length
      : 0;
  });

  teamChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: teams,
      datasets: [
        {
          label: 'Avg CPU %',
          data: teamAvgCpu,
          backgroundColor: teams.map((_, i) => colors.barColors[i % colors.barColors.length]),
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 'flex',
          maxBarThickness: 60,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.cardBg,
          titleColor: colors.text,
          bodyColor: colors.textSecondary,
          borderColor: colors.accent1,
          borderWidth: 1,
          cornerRadius: 10,
          padding: 14,
          titleFont: { family: 'Plus Jakarta Sans', weight: '600' },
          bodyFont: { family: 'Inter' },
          callbacks: {
            label: ctx => `Avg CPU: ${ctx.parsed.y.toFixed(1)}%`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.textSecondary, font: { family: 'Inter', weight: '500' } },
        },
        y: {
          grid: { color: colors.grid },
          ticks: {
            color: colors.textSecondary,
            font: { family: 'Inter' },
            callback: v => v + '%',
          },
          beginAtZero: true,
        },
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
      },
    },
  });
}

function renderHeatmapChart() {
  const ctx = document.getElementById('heatmapChart');
  if (!ctx) return;

  if (heatmapChart) heatmapChart.destroy();

  const filtered = getFilteredData();
  const colors = getThemeColors();

  if (filtered.length === 0) {
    ctx.parentElement.innerHTML = '<div class="no-data-msg">No active resources to display.</div>';
    return;
  }

  const teams = getUniqueTeams(filtered);
  const employees = [...new Set(filtered.map(d => d.instance_id))];

  // Build matrix-like data as grouped bars (simulated heatmap)
  const datasets = teams.map((team, ti) => {
    const data = employees.map(emp => {
      const match = filtered.find(d => d.instance_id === emp && d.team === team);
      return match ? match.cpu_usage : 0;
    });
    return {
      label: team,
      data,
      backgroundColor: colors.barColors[ti % colors.barColors.length] + 'cc',
      borderRadius: 4,
      borderSkipped: false,
    };
  });

  heatmapChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: employees.map(e => e.replace(/_/g, ' ')),
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: colors.textSecondary,
            font: { family: 'Inter', size: 11 },
            boxWidth: 12,
            padding: 14,
          },
        },
        tooltip: {
          backgroundColor: colors.cardBg,
          titleColor: colors.text,
          bodyColor: colors.textSecondary,
          borderColor: colors.accent1,
          borderWidth: 1,
          cornerRadius: 10,
          padding: 14,
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { color: colors.grid },
          ticks: {
            color: colors.textSecondary,
            font: { family: 'Inter' },
            callback: v => v + '%',
          },
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: {
            color: colors.textSecondary,
            font: { family: 'Inter', size: 10 },
          },
        },
      },
      animation: { duration: 800, easing: 'easeOutQuart' },
    },
  });
}

function renderForecastChart() {
  const ctx = document.getElementById('forecastChart');
  if (!ctx) return;

  if (forecastChart) forecastChart.destroy();

  const m = computeMetrics();
  const colors = getThemeColors();

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Projection'];
  const currentTrend = [0, 1, 2, 3, 4].map(i => m.currentCost * (1 + i * 0.02));
  currentTrend.push(m.currentCost * 1.05);
  const optimizedTrend = [0, 1, 2, 3, 4].map(i => m.currentCost * (1 + i * 0.02));
  optimizedTrend.push(m.optimized_cost);

  forecastChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Current Path',
          data: currentTrend,
          borderColor: colors.danger,
          borderDash: [8, 4],
          borderWidth: 2,
          pointRadius: 5,
          pointBackgroundColor: colors.danger,
          pointBorderColor: colors.danger,
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Optimized Path',
          data: optimizedTrend,
          borderColor: colors.success,
          borderWidth: 3,
          pointRadius: 6,
          pointBackgroundColor: colors.success,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.3,
          fill: {
            target: 0,
            above: state.theme === 'dark'
              ? 'rgba(0, 184, 148, 0.08)'
              : 'rgba(0, 184, 148, 0.12)',
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: colors.textSecondary,
            font: { family: 'Inter', weight: '500' },
            boxWidth: 14,
            padding: 16,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: colors.cardBg,
          titleColor: colors.text,
          bodyColor: colors.textSecondary,
          borderColor: colors.accent1,
          borderWidth: 1,
          cornerRadius: 10,
          padding: 14,
          callbacks: {
            label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.textSecondary, font: { family: 'Inter' } },
        },
        y: {
          grid: { color: colors.grid },
          ticks: {
            color: colors.textSecondary,
            font: { family: 'Inter' },
            callback: v => '$' + (v / 1000).toFixed(0) + 'k',
          },
        },
      },
      animation: { duration: 1000, easing: 'easeOutQuart' },
    },
  });
}

// ================================================
// MANAGEMENT PANEL
// ================================================
function renderTeamCards() {
  const grid = document.getElementById('teamsGrid');
  if (!grid) return;

  const allTeams = getUniqueTeams(companyData);
  const filtered = getFilteredData();
  const results = analyzeResources(filtered);

  grid.innerHTML = allTeams
    .map(team => {
      const isTeamActive = !state.disabledTeams.includes(team);
      const teamInstances = companyData.filter(d => d.team === team);
      const activeCount = teamInstances.filter(d => !state.disabledInstances.includes(d.instance_id) && !state.disabledTeams.includes(d.team)).length;
      const teamCost = results.team_costs[team] ? `$${Math.round(results.team_costs[team]).toLocaleString()}` : '$0';
      return `
      <div class="team-card">
        <span class="team-card-name">${team}</span>
        <div class="team-card-meta" style="font-size:0.75rem;opacity:0.7;margin:4px 0;">${activeCount} / ${teamInstances.length} instances &nbsp;·&nbsp; ${teamCost}/mo</div>
        <div class="team-status">
          <span class="status-indicator ${isTeamActive ? 'active' : 'stopped'}"></span>
          ${isTeamActive ? 'Active' : 'Stopped'}
        </div>
        <button class="team-toggle-btn ${isTeamActive ? 'stop' : 'start'}" data-team="${team}">
          ${isTeamActive ? '⏹️ Stop All' : '▶️ Start All'}
        </button>
      </div>
    `;
    })
    .join('');

  // Attach events
  grid.querySelectorAll('.team-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const team = btn.dataset.team;
      if (state.disabledTeams.includes(team)) {
        state.disabledTeams = state.disabledTeams.filter(t => t !== team);
      } else {
        state.disabledTeams.push(team);
      }
      refreshAll();
    });
  });
}

function renderEmployeeList() {
  const container = document.getElementById('employeesList');
  if (!container) return;

  // Show recommendations banner
  const filtered = getFilteredData();
  const results = analyzeResources(filtered);
  const banner = document.getElementById('recommendationsBanner');
  if (banner) {
    const idleCount = results.instances_to_stop.length;
    const underCount = results.instances_to_downsize.length;
    if (idleCount > 0 || underCount > 0) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <span style="color:var(--warning,#f39c12);font-weight:600;">⚠️ Action Required:</span>&nbsp;
        ${idleCount > 0 ? `<strong>${idleCount} idle instances</strong> should be stopped.` : ''}
        ${underCount > 0 ? `<strong>${underCount} instances</strong> can be downsized.` : ''}
        Total potential savings: <strong>$${results.savings.toLocaleString()}/mo</strong>
      `;
    } else {
      banner.style.display = 'block';
      banner.style.background = 'rgba(0,184,148,0.1)';
      banner.style.borderColor = '#00b894';
      banner.innerHTML = `<span style="color:#00b894;font-weight:600;">✅ All clear!</span> No idle or underutilized instances detected.`;
    }
  }

  const allTeams = getUniqueTeams(companyData);
  container.innerHTML = allTeams
    .filter(team => !state.disabledTeams.includes(team))
    .map(team => {
      const instances = companyData.filter(d => d.team === team);
      const rows = instances
        .map(inst => {
          const isActive = !state.disabledInstances.includes(inst.instance_id);
          const isIdle = results.instances_to_stop.includes(inst.instance_id);
          const isUnder = results.instances_to_downsize.includes(inst.instance_id);
          const statusTag = !isActive ? '❌ Stopped'
            : isIdle ? '🔴 Idle'
            : isUnder ? '🟡 Underutilized'
            : '🟢 Active';
          const statusClass = !isActive ? 'idle'
            : isIdle ? 'idle'
            : 'active';
          return `
          <div class="emp-row" style="${isIdle && isActive ? 'border-left: 3px solid var(--danger, #e55039);' : isUnder && isActive ? 'border-left: 3px solid var(--warning, #f39c12);' : ''}">
            <div style="flex:1;min-width:0;">
              <div class="emp-name">🖥️ ${inst.instance_id} <small style="opacity:0.7">${inst.instance_type}</small></div>
              <div style="font-size:0.72rem;opacity:0.6;margin-top:2px;">📍 ${inst.region} &nbsp;·&nbsp; 💾 RAM ${inst.ram_usage}% &nbsp;·&nbsp; ⏱ ${inst.uptime_days}d</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
              <span style="font-size:0.75rem;font-weight:600;color:var(--accent1);">$${inst.monthly_cost}/mo</span>
              <span class="emp-status ${statusClass}">${statusTag}</span>
              <button class="emp-action-btn ${isActive ? 'suspend' : 'resume'}" data-instance="${inst.instance_id}">
                ${isActive ? 'Stop' : 'Start'}
              </button>
            </div>
          </div>
        `;
        })
        .join('');

      return `
      <div class="team-group">
        <div class="team-group-header" data-team="${team}">
          <span class="team-group-title">☁️ ${team} (${instances.length} instances)</span>
          <span class="team-group-chevron">▼</span>
        </div>
        <div class="team-group-body">${rows}</div>
      </div>
    `;
    })
    .join('');

  // Expander toggle
  container.querySelectorAll('.team-group-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('open');
    });
  });

  // Instance action buttons
  container.querySelectorAll('.emp-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const emp = btn.dataset.instance;
      if (state.disabledInstances.includes(emp)) {
        state.disabledInstances = state.disabledInstances.filter(e => e !== emp);
      } else {
        state.disabledInstances.push(emp);
      }
      refreshAll();
    });
  });
}

// ================================================
// TABS
// ================================================
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });
}

// ================================================
// TOAST
// ================================================
function showToast(message) {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `✅ ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ================================================
// REFRESH ALL
// ================================================
function refreshAll() {
  updateMetrics();
  renderAllCharts();
  renderTeamCards();
  renderEmployeeList();
}

// ================================================
// INITIALIZATION
// ================================================
function init() {
  // ── Auth guard ────────────────────────────────────────
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = '/login.html';
      return;
    }
    startDashboard();
  });
}

function startDashboard() {
  // Apply saved theme
  applyTheme();

  // Theme toggle
  const themeCard = document.getElementById('themeToggleCard');
  const themeSwitch = document.getElementById('themeSwitch');
  if (themeCard) themeCard.addEventListener('click', toggleTheme);
  if (themeSwitch) {
    themeSwitch.addEventListener('click', e => {
      e.stopPropagation();
      toggleTheme();
    });
  }

  // Infrastructure Simulation Slider (Restored)
  const slider = document.getElementById('instanceSlider');
  const sliderValue = document.getElementById('sliderValue');
  if (slider) {
    slider.addEventListener('input', e => {
      const targetInstances = parseInt(e.target.value);
      if (sliderValue) sliderValue.textContent = targetInstances;
      
      const numToDisable = companyData.length - targetInstances;
      
      // Sort instances by CPU usage (lowest first) to disable least utilized ones
      const sortedData = [...companyData].sort((a, b) => a.cpu_usage - b.cpu_usage);
      const instancesToDisable = sortedData.slice(0, numToDisable).map(d => d.instance_id);
      
      state.disabledInstances = instancesToDisable;
      state.disabledTeams = []; // Clear team filters for accurate absolute count
      refreshAll();
    });
  }

  // Reset button
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.disabledTeams = [];
      state.disabledInstances = [];
      refreshAll();
      showToast('Environment reset to defaults!');
    });
  }

  // Auto-optimize button
  const optimizeBtn = document.getElementById('optimizeBtn');
  if (optimizeBtn) {
    optimizeBtn.addEventListener('click', () => {
      const m = computeMetrics();
      if (m.instances_to_stop.length === 0) {
        showToast('All optimized! Zero waste.');
        return;
      }
      // Automatically shut down flagged instances
      const newDisabled = [...new Set([...state.disabledInstances, ...m.instances_to_stop])];
      state.disabledInstances = newDisabled;
      refreshAll();
      showToast(`Automatically stopped ${m.instances_to_stop.length} idle instances!`);
    });
  }

  // Right panel open / close
  const panelOpenBtn  = document.getElementById('panelOpenBtn');
  const panelCloseBtn = document.getElementById('panelCloseBtn');
  const rightPanel    = document.getElementById('rightPanel');
  const backdrop      = document.getElementById('panelBackdrop');

  function openPanel() {
    rightPanel?.classList.add('open');
    backdrop?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closePanel() {
    rightPanel?.classList.remove('open');
    backdrop?.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (panelOpenBtn)  panelOpenBtn.addEventListener('click', openPanel);
  if (panelCloseBtn) panelCloseBtn.addEventListener('click', closePanel);
  if (backdrop)      backdrop.addEventListener('click', closePanel);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

  // Tabs
  initTabs();

  // Add SVG gradient definition for gauge (needed for stroke gradient)
  addGaugeSvgDefs();

  // Initial render
  refreshAll();
}

function addGaugeSvgDefs() {
  const svg = document.querySelector('.gauge-svg');
  if (!svg) return;
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', 'gaugeGradient');
  gradient.innerHTML = `
    <stop offset="0%" stop-color="#6c5ce7" />
    <stop offset="100%" stop-color="#00cec9" />
  `;
  defs.appendChild(gradient);
  svg.prepend(defs);
}

// Start!
document.addEventListener('DOMContentLoaded', init);
