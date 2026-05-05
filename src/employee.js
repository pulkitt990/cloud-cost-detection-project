import { companyData, getUniqueTeams } from './data.js';
import { analyzeResources } from './optimizer.js';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// ── Firebase config (same project as admin portal) ────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyChGIzwJAHnSWLQRsd4m8_mtwj903IRwmg",
  authDomain: "cloud-cost-control-fc86e.firebaseapp.com",
  projectId: "cloud-cost-control-fc86e",
  storageBucket: "cloud-cost-control-fc86e.firebasestorage.app",
  messagingSenderId: "999151125411",
  appId: "1:999151125411:web:62dc2ff8b4822485a1d016",
};

const app = initializeApp(firebaseConfig, 'employee-portal');
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ── Theme ─────────────────────────────────────────────────────────────────
const savedTheme = localStorage.getItem('cloudsense-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

const themeBtn = document.getElementById('empThemeBtn');
if (themeBtn) {
  themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  themeBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cloudsense-theme', next);
    themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
  });
}

// ── Auth elements ──────────────────────────────────────────────────────────
const authGate     = document.getElementById('authGate');
const empPortal    = document.getElementById('empPortal');
const empSignoutBtn= document.getElementById('empSignoutBtn');

empSignoutBtn?.addEventListener('click', async () => {
  await signOut(auth);
});

// ── Auth state handler ─────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  authGate.style.display = 'none';
  if (!user) {
    window.location.href = '/login.html';
  } else {
    empPortal.style.display = 'flex';
    initPortal(user);
  }
});

// ── Portal initialization ──────────────────────────────────────────────────
function initPortal(user) {
  const profileSelect = document.getElementById('profileSelect');
  const welcomeDiv    = document.getElementById('empWelcome');
  const selectPrompt  = document.getElementById('empSelectPrompt');
  const empContent    = document.getElementById('empContent');

  // Populate profile dropdown grouped by team
  profileSelect.innerHTML = '<option value="">— Select your name —</option>';
  
  const teams = [...new Set(companyData.map(d => d.team))].sort();
  
  teams.forEach(team => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = team + " Team";
    
    const teamEmployees = companyData
      .filter(d => d.team === team)
      .map(d => d.employee)
      .sort();
      
    teamEmployees.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      optgroup.appendChild(opt);
    });
    
    profileSelect.appendChild(optgroup);
  });

  // Try to restore previously selected profile
  const allEmployees = companyData.map(d => d.employee);
  const lastProfile = localStorage.getItem('emp-portal-profile');
  if (lastProfile && allEmployees.includes(lastProfile)) {
    profileSelect.value = lastProfile;
    showPinPrompt(lastProfile, welcomeDiv, selectPrompt, empContent);
  }

  profileSelect.addEventListener('change', () => {
    const selected = profileSelect.value;
    if (selected) {
      showPinPrompt(selected, welcomeDiv, selectPrompt, empContent);
    } else {
      welcomeDiv.style.display = 'none';
      selectPrompt.style.display = 'flex';
      empContent.style.display = 'none';
      document.getElementById('empPinPrompt').style.display = 'none';
      localStorage.removeItem('emp-portal-profile');
    }
  });
}

// ── PIN Auth Flow ────────────────────────────────────────────────────────
let currentAuthEmp = null;

function showPinPrompt(employeeName, welcomeDiv, selectPrompt, empContent) {
  const emp = companyData.find(d => d.employee === employeeName);
  if (!emp) return;

  // Hide dashboard elements
  welcomeDiv.style.display = 'none';
  selectPrompt.style.display = 'none';
  empContent.style.display = 'none';

  // Show PIN prompt
  const pinPrompt = document.getElementById('empPinPrompt');
  pinPrompt.style.display = 'flex';
  document.getElementById('pinInput').value = '';
  document.getElementById('pinError').style.display = 'none';
  
  const firstName = emp.employee.split(' ')[0].replace('Dr.', '').trim();
  document.getElementById('pinGreeting').textContent = `Welcome, ${firstName}`;

  currentAuthEmp = emp;
}

document.getElementById('pinSubmit')?.addEventListener('click', () => {
  if (!currentAuthEmp) return;
  const inputVal = document.getElementById('pinInput').value.trim().toLowerCase();
  
  if (inputVal === currentAuthEmp.pin) {
    // Unlock successful
    document.getElementById('empPinPrompt').style.display = 'none';
    localStorage.setItem('emp-portal-profile', currentAuthEmp.employee);
    
    // Resume render
    const welcomeDiv = document.getElementById('empWelcome');
    const selectPrompt = document.getElementById('empSelectPrompt');
    const empContent = document.getElementById('empContent');
    renderProfile(currentAuthEmp.employee, welcomeDiv, selectPrompt, empContent);
  } else {
    // Unlock failed
    document.getElementById('pinError').style.display = 'block';
  }
});

// Optionally support pressing Enter in the PIN input
document.getElementById('pinInput')?.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('pinSubmit').click();
  }
});

// Password visibility toggle
const pinToggleBtn = document.getElementById('pinToggleBtn');
const pinInput = document.getElementById('pinInput');
const eyeShow = document.getElementById('eyeIconShow');
const eyeHide = document.getElementById('eyeIconHide');

if (pinToggleBtn && pinInput) {
  pinToggleBtn.addEventListener('click', () => {
    if (pinInput.type === 'password') {
      pinInput.type = 'text';
      eyeShow.style.display = 'none';
      eyeHide.style.display = 'block';
    } else {
      pinInput.type = 'password';
      eyeShow.style.display = 'block';
      eyeHide.style.display = 'none';
    }
  });
}

// ── Render personal + team dashboard ──────────────────────────────────────
function renderProfile(employeeName, welcomeDiv, selectPrompt, empContent) {
  const emp = companyData.find(d => d.employee === employeeName);
  if (!emp) return;

  // Hide select prompt, show content
  selectPrompt.style.display = 'none';
  welcomeDiv.style.display = 'flex';
  empContent.style.display = 'block';

  const results = analyzeResources(companyData);
  const isIdle  = results.instances_to_stop.includes(emp.employee);

  // Welcome banner
  const firstName = emp.employee.split(' ')[0].replace('Dr.', '').trim();
  document.getElementById('empGreeting').textContent  = `Welcome back, ${firstName}! 👋`;
  document.getElementById('empSubtitle').textContent  = `${emp.team} Team · ${emp.instance_type}`;

  // Status badge
  const badge = document.getElementById('empStatusBadge');
  if (isIdle) {
    badge.textContent  = '⚠️ Low Usage';
    badge.className    = 'emp-status-badge badge-warning';
  } else if (emp.cpu_usage >= 70) {
    badge.textContent  = '🔥 High Load';
    badge.className    = 'emp-status-badge badge-danger';
  } else {
    badge.textContent  = '✅ Healthy';
    badge.className    = 'emp-status-badge badge-success';
  }

  // Stat cards
  document.getElementById('statCpu').textContent      = `${emp.cpu_usage}%`;
  document.getElementById('statRam').textContent      = `${emp.ram_usage}%`;
  document.getElementById('statCost').textContent     = `$${emp.monthly_cost}/mo`;
  document.getElementById('statInstance').textContent = emp.instance_type;
  document.getElementById('statStatus').textContent   = isIdle ? '🟡 Low Usage' : '🟢 Active';

  // Progress bars
  const cpuBar = document.getElementById('cpuBar');
  cpuBar.style.width = `${emp.cpu_usage}%`;
  cpuBar.style.background = emp.cpu_usage > 80 ? 'var(--danger)' 
    : emp.cpu_usage > 50 ? 'var(--accent-1)' 
    : emp.cpu_usage < 15 ? 'var(--warning)' 
    : 'var(--success)';

  document.getElementById('ramBar').style.width = `${emp.ram_usage}%`;

  // CPU Gauge
  const gaugeCircle = document.getElementById('empGaugeProgress');
  const r = 80;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (emp.cpu_usage / 100) * circumference;
  gaugeCircle.style.strokeDasharray  = circumference;
  gaugeCircle.style.strokeDashoffset = offset;
  gaugeCircle.style.stroke = emp.cpu_usage > 80 ? '#e17055'
    : emp.cpu_usage > 50 ? '#6c6cff'
    : emp.cpu_usage < 15 ? '#fdcb6e'
    : '#00b894';

  document.getElementById('empGaugeValue').textContent = emp.cpu_usage;

  const gaugeNote = document.getElementById('empGaugeNote');
  if (isIdle) {
    gaugeNote.textContent = '⚠️ Your server is running at very low CPU. Consider discussing workload redistribution with your team lead.';
    gaugeNote.className = 'emp-gauge-note note-warning';
  } else if (emp.cpu_usage >= 80) {
    gaugeNote.textContent = '🔥 High CPU usage detected! Your server is under heavy load. Consider optimizing your processes.';
    gaugeNote.className = 'emp-gauge-note note-danger';
  } else {
    gaugeNote.textContent = '✅ Your server is performing efficiently. Keep it up!';
    gaugeNote.className = 'emp-gauge-note note-success';
  }

  // Team overview
  const teamMembers = companyData.filter(d => d.team === emp.team);

  document.getElementById('teamName').textContent = emp.team;
  const teamAvg = teamMembers.reduce((s, d) => s + d.cpu_usage, 0) / teamMembers.length;
  const teamTotalCost = teamMembers.reduce((s, d) => s + d.monthly_cost, 0);
  const teamIdleMembers = teamMembers.filter(d => results.instances_to_stop.includes(d.employee));

  // Rank by CPU descending (most active = rank 1)
  const sorted = [...teamMembers].sort((a, b) => b.cpu_usage - a.cpu_usage);
  const myRank  = sorted.findIndex(d => d.employee === emp.employee) + 1;
  const topPerformer = sorted[0].employee;

  document.getElementById('teamAvgCpu').textContent     = `${teamAvg.toFixed(1)}%`;
  document.getElementById('teamCost').textContent       = `$${teamTotalCost.toLocaleString()}/mo`;
  document.getElementById('teamActive').textContent     = `${teamMembers.length - teamIdleMembers.length} / ${teamMembers.length}`;
  document.getElementById('teamIdle').textContent       = `${teamIdleMembers.length}`;
  document.getElementById('teamTopPerformer').textContent = topPerformer === emp.employee ? `${topPerformer} (You!)` : topPerformer;
  document.getElementById('teamMyRank').textContent     = `#${myRank} of ${teamMembers.length}`;

  // Team members table
  const tbody = document.getElementById('teamMembersBody');
  tbody.innerHTML = sorted.map(m => {
    const isMe   = m.employee === emp.employee;
    const rowIdle= results.instances_to_stop.includes(m.employee);
    const statusLabel = rowIdle ? '<span class="badge-warning-inline">⚠️ Low</span>' : '<span class="badge-success-inline">🟢 Active</span>';
    return `
      <tr class="${isMe ? 'emp-my-row' : ''}">
        <td><strong>${m.employee}</strong>${isMe ? ' <span class="you-tag">YOU</span>' : ''}</td>
        <td>${m.instance_type}</td>
        <td>${m.cpu_usage}%</td>
        <td>${m.ram_usage}%</td>
        <td>$${m.monthly_cost}/mo</td>
        <td>${statusLabel}</td>
      </tr>
    `;
  }).join('');
}
