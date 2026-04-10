import './style.css';
import Chart from 'chart.js/auto';
import { companyData as _defaultData, getUniqueTeams, parseCSV } from './data.js';
import { analyzeResources } from './optimizer.js';
import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Live mutable reference to companyData (can be replaced by CSV upload)
let companyData = [..._defaultData];

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
  if (icon) icon.innerHTML = state.theme === 'dark' ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = state.theme === 'dark' ? 'Dark Mode' : 'Light Mode';

  // Re-render charts with new theme colors
  renderAllCharts();
  lucide.createIcons();
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
      !state.disabledInstances.includes(d.employee)
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
  deltaEl.innerHTML = idleCount > 0 ? `<i data-lucide="alert-triangle" style="width:14px; vertical-align:middle;"></i> ${idleCount} idle detected` : `<i data-lucide="check-circle" style="width:14px; vertical-align:middle;"></i> All instances active`;
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
  lucide.createIcons();
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

  const filtered = getFilteredData();
  const teams = getUniqueTeams(filtered);
  const colors = getThemeColors();

  const teamAvgCpu = teams.map(team => {
    const teamData = filtered.filter(d => d.team === team);
    return teamData.length > 0
      ? teamData.reduce((s, d) => s + d.cpu_usage, 0) / teamData.length
      : 0;
  });

  if (teamChart) {
    teamChart.data.labels = teams;
    teamChart.data.datasets[0].data = teamAvgCpu;
    teamChart.update();
    return;
  }

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

  const filtered = getFilteredData();
  const colors = getThemeColors();

  if (filtered.length === 0) {
    ctx.parentElement.innerHTML = '<div class="no-data-msg">No active resources to display.</div>';
    return;
  }

  const teams = getUniqueTeams(filtered);
  const employees = [...new Set(filtered.map(d => d.employee))];

  // Build matrix-like data as grouped bars (simulated heatmap)
  const datasets = teams.map((team, ti) => {
    const data = employees.map(emp => {
      const match = filtered.find(d => d.employee === emp && d.team === team);
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

  if (heatmapChart) {
    heatmapChart.data.labels = employees.map(e => e.replace(/_/g, ' '));
    heatmapChart.data.datasets = datasets;
    heatmapChart.update();
    return;
  }

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

  const m = computeMetrics();
  const colors = getThemeColors();

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Projection'];
  const currentTrend = [0, 1, 2, 3, 4].map(i => m.currentCost * (1 + i * 0.02));
  currentTrend.push(m.currentCost * 1.05);
  const optimizedTrend = [0, 1, 2, 3, 4].map(i => m.currentCost * (1 + i * 0.02));
  optimizedTrend.push(m.currentCost - m.savings);

  if (forecastChart) {
    forecastChart.data.datasets[0].data = currentTrend;
    forecastChart.data.datasets[1].data = optimizedTrend;
    forecastChart.update();
    return;
  }

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
      const teamEmps = companyData.filter(d => d.team === team);
      const activeCount = teamEmps.filter(d =>
        !state.disabledInstances.includes(d.employee) &&
        !state.disabledTeams.includes(d.team)
      ).length;
      const teamCost = results.team_costs[team]
        ? `$${Math.round(results.team_costs[team]).toLocaleString()}`
        : '$0';
      return `
      <div class="team-card">
        <span class="team-card-name">${team}</span>
        <div class="team-card-meta" style="font-size:0.75rem;opacity:0.7;margin:4px 0;">
          ${activeCount}/${teamEmps.length} active &nbsp;·&nbsp; ${teamCost}/mo
        </div>
        <div class="team-status">
          <span class="status-indicator ${isTeamActive ? 'active' : 'stopped'}"></span>
          ${isTeamActive ? 'Active' : 'Stopped'}
        </div>
        <button class="team-toggle-btn ${isTeamActive ? 'stop' : 'start'}" data-team="${team}">
          ${isTeamActive ? '<i data-lucide="square"></i> Stop All' : '<i data-lucide="play"></i> Start All'}
        </button>
      </div>
    `;
    })
    .join('');

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
  lucide.createIcons();
}

function renderEmployeeList() {
  const container = document.getElementById('employeesList');
  if (!container) return;

  const filtered = getFilteredData();
  const results = analyzeResources(filtered);

  const banner = document.getElementById('recommendationsBanner');
  if (banner) {
    const idleCount = results.instances_to_stop.length;
    const savingsAmount = results.current_cost - results.optimized_cost;
    if (idleCount > 0) {
      banner.style.display = 'block';
      banner.style.background = 'rgba(243, 156, 18, 0.1)';
      banner.style.borderColor = 'rgba(243,156,18,0.4)';
      banner.innerHTML = `<i data-lucide="alert-triangle" style="display:inline; width:16px; vertical-align:middle; margin-right:4px;"></i> <strong>${idleCount} employees</strong> are using very low CPU (&lt;15%). Consider suspending to save <strong>$${savingsAmount.toLocaleString()}/mo</strong>.`;
    } else {
      banner.style.display = 'block';
      banner.style.background = 'rgba(0,184,148,0.1)';
      banner.style.borderColor = '#00b894';
      banner.innerHTML = `<i data-lucide="check-circle" style="display:inline; width:16px; vertical-align:middle; margin-right:4px;"></i> ✅ All employees are utilizing their resources well.`;
    }
  }

  const allTeams = getUniqueTeams(companyData);

  container.innerHTML = allTeams
    .filter(team => !state.disabledTeams.includes(team))
    .map(team => {
      const employees = companyData.filter(d => d.team === team);
      const rows = employees.map(emp => {
        const isActive = !state.disabledInstances.includes(emp.employee);
        const isIdle = results.instances_to_stop.includes(emp.employee);
        const statusLabel = !isActive ? '<i data-lucide="x-circle"></i> Suspended'
          : isIdle ? '<i data-lucide="alert-circle"></i> Low Usage'
          : '<i data-lucide="check-circle"></i> Active';
        const statusClass = isActive ? 'active' : 'idle';

        return `
          <div class="emp-row">
            <span class="emp-name"><i data-lucide="user"></i> ${emp.employee}</span>
            <span class="emp-meta">${emp.instance_type} &middot; $${emp.monthly_cost}/mo</span>
            <span class="emp-cpu">CPU: ${emp.cpu_usage}%</span>
            <span class="emp-status ${statusClass}">${statusLabel}</span>
            <button class="emp-action-btn ${isActive ? 'suspend' : 'resume'}" data-employee="${emp.employee}">
              ${isActive ? 'Suspend' : 'Resume'}
            </button>
          </div>
        `;
      }).join('');

      return `
        <div class="team-group">
          <div class="team-group-header">
            <span class="team-group-title"><i data-lucide="building"></i> ${team} (${employees.length})</span>
            <span class="team-group-chevron"><i data-lucide="chevron-down"></i></span>
          </div>
          <div class="team-group-body">${rows}</div>
        </div>
      `;
    })
    .join('');

  // Expander
  container.querySelectorAll('.team-group-header').forEach(h => {
    h.addEventListener('click', () => h.parentElement.classList.toggle('open'));
  });

  // Suspend/Resume buttons
  container.querySelectorAll('.emp-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const emp = btn.dataset.employee;
      if (state.disabledInstances.includes(emp)) {
        state.disabledInstances = state.disabledInstances.filter(e => e !== emp);
      } else {
        state.disabledInstances.push(emp);
      }
      refreshAll();
    });
  });
  lucide.createIcons();
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
  
  let prefix = '';
  if (!message.includes('<i')) {
    prefix = message.includes('Error') ? '<i data-lucide="x-circle" style="color:var(--danger)"></i> ' : '<i data-lucide="check-circle" style="color:var(--success)"></i> ';
  }
  
  toast.innerHTML = `<div style="display:flex;align-items:center;gap:8px;">${prefix}${message}</div>`;
  document.body.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => toast.remove(), 3200);
}

function refreshAll() {
  updateMetrics();
  renderAllCharts();
  renderTeamCards();
  renderEmployeeList();
}

// ================================================
// LIVE TRAFFIC SIMULATION
// ================================================
let autopilotEnabled = false;

function simulateLiveTraffic() {
  let changed = false;
  companyData.forEach(emp => {
    // Only active instances fluctuate
    if (!state.disabledInstances.includes(emp.employee)) {
      const fluctuation = Math.floor(Math.random() * 9) - 4; // -4% to +4%
      const oldVal = emp.cpu_usage;
      emp.cpu_usage = Math.max(1, Math.min(100, emp.cpu_usage + fluctuation));
      if (oldVal !== emp.cpu_usage) changed = true;
    }
  });

  if (changed) {
    if (autopilotEnabled) {
      const m = computeMetrics();
      if (m.instances_to_stop.length > 0) {
        const originalLen = state.disabledInstances.length;
        const newDisabled = [...new Set([...state.disabledInstances, ...m.instances_to_stop])];
        if (newDisabled.length > originalLen) {
          state.disabledInstances = newDisabled;
          const stoppedCount = newDisabled.length - originalLen;
          showToast(`<i data-lucide="bot" style="display:inline; width:20px; vertical-align:middle; margin-right:4px;"></i> Auto-Pilot suspended ${stoppedCount} idle instances.`);
          renderTeamCards();
          renderEmployeeList();
        }
      }
    }
    // We only update charts and top metrics to avoid interrupting user interactions in lists
    updateMetrics();
    renderAllCharts();
  }
}

// Start simulation immediately so it's running when page loads
setInterval(simulateLiveTraffic, 4500);

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
      const instancesToDisable = sortedData.slice(0, numToDisable).map(d => d.employee);
      
      state.disabledInstances = instancesToDisable;
      state.disabledTeams = [];
      refreshAll();
    });
  }

  // Reset button
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.disabledTeams = [];
      state.disabledInstances = [];
      companyData = [..._defaultData];
      refreshAll();
      showToast('Environment reset to defaults!');
    });
  }

  // CSV Upload
  const csvInput = document.getElementById('csvFileInput');
  const csvStatus = document.getElementById('csvStatus');
  if (csvInput) {
    csvInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = parseCSV(ev.target.result);
          if (parsed.length === 0) throw new Error('No valid rows found.');
          companyData = parsed;
          state.disabledTeams = [];
          state.disabledInstances = [];
          // Update slider max
          const slider = document.getElementById('instanceSlider');
          const sliderMax = document.getElementById('sliderMax');
          if (slider) { slider.max = companyData.length; slider.value = companyData.length; }
          if (sliderMax) sliderMax.textContent = companyData.length;
          refreshAll();
          if (csvStatus) {
            csvStatus.style.display = 'block';
            csvStatus.style.color = '#00b894';
            csvStatus.textContent = `✅ Loaded ${parsed.length} employees from ${file.name}`;
          }
          showToast(`Real data loaded: ${parsed.length} employees from ${file.name}`);
        } catch (err) {
          if (csvStatus) {
            csvStatus.style.display = 'block';
            csvStatus.style.color = '#e55039';
            csvStatus.textContent = `❌ Error: ${err.message}`;
          }
        }
      };
      reader.readAsText(file);
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

  // Autonomous Auto-Pilot Toggle
  const autopilotToggle = document.getElementById('autopilotToggle');
  if (autopilotToggle) {
    autopilotToggle.addEventListener('change', (e) => {
      autopilotEnabled = e.target.checked;
      if (autopilotEnabled) {
        showToast('<i data-lucide="bot" style="display:inline; width:20px; vertical-align:middle; margin-right:4px;"></i> Autonomous Auto-Pilot Engaged. Scanning infrastructure 24/7...');
      } else {
        showToast('Auto-Pilot Disengaged. Resuming manual monitoring.');
      }
    });
  }

  // Export Executive Report Logic
  const exportReportBtn = document.getElementById('exportReportBtn');
  if (exportReportBtn) {
    exportReportBtn.addEventListener('click', () => {
      const activeData = getFilteredData();
      if (activeData.length === 0) {
        return showToast('No active data to export!');
      }
      
      const csvRows = ['Team,Employee,Instance Type,Monthly Cost,CPU %,RAM %'];
      activeData.forEach(d => {
        csvRows.push(`${d.team},${d.employee},${d.instance_type},$${d.monthly_cost},${d.cpu_usage}%,${d.ram_usage}%`);
      });
      
      const csvStr = csvRows.join('\n');
      const blob = new Blob([csvStr], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `CloudSense_Executive_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('Executive Report Downloaded Successfully!');
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

  // Metric Card Modals
  const cardRunning = document.getElementById('cardRunning');
  const cardRequired = document.getElementById('cardRequired');
  const cardCost = document.getElementById('cardCost');
  const cardSavings = document.getElementById('cardSavings');

  if (cardRunning)  cardRunning.addEventListener('click', () => openMetricModal('running'));
  if (cardRequired) cardRequired.addEventListener('click', () => openMetricModal('shutdown'));
  if (cardCost)     cardCost.addEventListener('click', () => openMetricModal('cost'));
  if (cardSavings)  cardSavings.addEventListener('click', () => openMetricModal('savings'));

  const metricModal = document.getElementById('metricModal');
  const metricModalBackdrop = document.getElementById('metricModalBackdrop');
  const metricModalClose = document.getElementById('metricModalClose');

  function closeMetricModal() {
    metricModal?.classList.remove('open');
    metricModalBackdrop?.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (metricModalClose) metricModalClose.addEventListener('click', closeMetricModal);
  if (metricModalBackdrop) metricModalBackdrop.addEventListener('click', closeMetricModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMetricModal(); });

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

// ================================================
// METRIC MODAL LOGIC
// ================================================
function openMetricModal(type) {
  const modal = document.getElementById('metricModal');
  const backdrop = document.getElementById('metricModalBackdrop');
  const titleEl = document.getElementById('metricModalTitle');
  const bodyEl = document.getElementById('metricModalBody');
  if (!modal || !backdrop) return;

  const m = computeMetrics();
  let items = [];
  let title = '';
  
  if (type === 'running') {
    title = 'Active Instances Overview';
    // All unfiltered instances sorted by CPU descending
    items = [...m.filtered].sort((a, b) => b.cpu_usage - a.cpu_usage).map(d => ({
      name: d.employee, team: d.team, meta: d.instance_type, details: `CPU: ${d.cpu_usage}%`
    }));
  } else if (type === 'shutdown') {
    title = 'Recommended Shutdown Details';
    // Priority to shutdown: sort idle ones with lowest CPU first
    const idleList = m.filtered.filter(d => m.instances_to_stop.includes(d.employee));
    items = idleList.sort((a, b) => a.cpu_usage - b.cpu_usage).map(d => ({
      name: d.employee, team: d.team, meta: `Current Cost: $${d.monthly_cost}/mo`, details: `CPU: ${d.cpu_usage}% (Idle)`
    }));
  } else if (type === 'cost') {
    title = 'Monthly Cost Breakdown';
    // Sort all instances by cost descending
    items = [...m.filtered].sort((a, b) => b.monthly_cost - a.monthly_cost).map(d => ({
      name: d.employee, team: d.team, meta: d.instance_type, details: `$${d.monthly_cost}/mo`
    }));
  } else if (type === 'savings') {
    title = 'Potential Savings Details';
    // Only items that can be optimized
    items = m.recommendations.sort((a, b) => b.savings - a.savings).map(r => ({
      name: r.employee, team: 'Optimization', meta: r.action, details: `Save $${r.savings}/mo`
    }));
  }

  // Build Table HTML
  let tableHtml = '<div style="padding:10px;text-align:center;color:var(--text-secondary);">No data matches the selected criteria.</div>';
  
  if (items.length > 0) {
    tableHtml = `
      <table class="modal-table">
        <thead>
          <tr>
            <th>Name (Employee)</th>
            <th>Team</th>
            <th>Type/Role</th>
            <th style="text-align:right;">Data / Details</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(i => `
            <tr>
              <td><strong>${i.name}</strong></td>
              <td>${i.team}</td>
              <td style="opacity:0.8;">${i.meta}</td>
              <td style="text-align:right; font-weight:600; color:var(--accent1);">${i.details}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  titleEl.textContent = title;
  bodyEl.innerHTML = tableHtml;

  // Show
  document.body.style.overflow = 'hidden';
  modal.classList.add('open');
  backdrop.classList.add('open');
}

// Start!
document.addEventListener('DOMContentLoaded', init);
