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

// ── Theme Management ───────────────────────────────────────────────────────
const themeBtn = document.getElementById('empThemeBtn');
function applyTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeBtn.innerHTML = savedTheme === 'dark' ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
  lucide.createIcons();
}
applyTheme();
themeBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  themeBtn.innerHTML = next === 'dark' ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
  lucide.createIcons();
});

// ── Auth elements ──────────────────────────────────────────────────────────
const authGate     = document.getElementById('authGate');
const loginPrompt  = document.getElementById('loginPrompt');
const empPortal    = document.getElementById('empPortal');
const empGoogleBtn = document.getElementById('empGoogleBtn');
const empSignoutBtn= document.getElementById('empSignoutBtn');
const loginError   = document.getElementById('empLoginError');

empGoogleBtn?.addEventListener('click', async () => {
  try {
    loginError.style.display = 'none';
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    loginError.style.display = 'block';
    loginError.textContent = `Sign-in failed: ${err.message}`;
  }
});

empSignoutBtn?.addEventListener('click', async () => {
  await signOut(auth);
});

// ── Auth state handler ─────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  authGate.style.display = 'none';
  if (!user) {
    loginPrompt.style.display = 'flex';
    empPortal.style.display = 'none';
  } else {
    loginPrompt.style.display = 'none';
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
  
  const badge = document.getElementById('empTopBadge');
  const statusIconWrap   = document.getElementById('statusIconWrap');
  const statusText       = document.getElementById('statusText');
  const statusLucide     = document.getElementById('statusLucide');
  const metricStatusText = document.getElementById('metricStatusText');

  badge.className = 'emp-status-badge';
  metricStatusText.innerHTML = '';
  
  if (emp.isSuspended) {
    statusIconWrap.style.background = 'rgba(225,112,85,0.1)';
    statusIconWrap.style.color      = 'var(--danger)';
    statusLucide.setAttribute('data-lucide', 'x-circle');
    
    metricStatusText.innerHTML = '<span style="color:var(--danger);display:flex;align-items:center;gap:6px;">Suspended</span>';
    badge.classList.add('badge-danger');
    badge.innerHTML  = '<span style="display:flex;align-items:center;gap:6px;"><i data-lucide="pause-circle" style="width:16px;"></i> Offline</span>';
  } else {
    if (emp.cpu_usage < 15) {
      statusIconWrap.style.background = 'rgba(253,203,110,0.1)';
      statusIconWrap.style.color      = 'var(--warning)';
      statusLucide.setAttribute('data-lucide', 'alert-circle');

      metricStatusText.innerHTML = '<span style="color:var(--warning);display:flex;align-items:center;gap:6px;">Idle</span>';
      badge.classList.add('badge-warning');
      badge.innerHTML  = '<span style="display:flex;align-items:center;gap:6px;"><i data-lucide="alert-triangle" style="width:16px;"></i> Low Usage</span>';
    } else if (emp.cpu_usage > 85) {
      statusIconWrap.style.background = 'rgba(225,112,85,0.1)';
      statusIconWrap.style.color      = 'var(--danger)';
      statusLucide.setAttribute('data-lucide', 'flame');

      metricStatusText.innerHTML = '<span style="color:var(--danger);display:flex;align-items:center;gap:6px;">High Load</span>';
      badge.classList.add('badge-danger');
      badge.innerHTML  = '<span style="display:flex;align-items:center;gap:6px;"><i data-lucide="flame" style="width:16px;"></i> High Load</span>';
    } else {
      statusIconWrap.style.background = 'rgba(0,184,148,0.1)';
      statusIconWrap.style.color      = 'var(--success)';
      statusLucide.setAttribute('data-lucide', 'check-circle');

      metricStatusText.innerHTML = '<span style="color:var(--success);display:flex;align-items:center;gap:6px;">Active</span>';
      badge.classList.add('badge-success');
      badge.innerHTML  = '<span style="display:flex;align-items:center;gap:6px;"><i data-lucide="check-circle" style="width:16px;"></i> Healthy</span>';
    }
  };

  // Welcome banner
  const firstName = emp.employee.split(' ')[0].replace('Dr.', '').trim();
  document.getElementById('empGreeting').textContent  = `Welcome back, ${firstName}!`;

  // Stat cards
  document.getElementById('statCpu').textContent      = `${emp.cpu_usage}%`;
  document.getElementById('statRam').textContent      = `${emp.ram_usage}%`;
  document.getElementById('statCost').textContent     = `$${emp.monthly_cost}/mo`;
  document.getElementById('statInstance').textContent = emp.instance_type;

  // CPU Gauge
  const gaugeCircle = document.getElementById('empGaugeProgress');
  const r = 80;
  const circumference = 2 * Math.PI * r;
  const efficiencyScore = emp.isSuspended ? 0 : emp.cpu_usage;
  const gaugePercent = Math.min(100, Math.max(0, efficiencyScore));
  const dashArray = 2 * Math.PI * 45;
  const dashOffset = dashArray * ((100 - gaugePercent) / 100);
  
  document.getElementById('empGaugeProgress').style.strokeDashoffset = dashOffset;
  document.getElementById('empGaugeValue').textContent = Math.round(gaugePercent);
  
  const gaugeNote = document.getElementById('empGaugeNote');
  gaugeNote.className = 'emp-gauge-note';
  if (emp.isSuspended) {
    gaugeNote.classList.add('note-danger');
    gaugeNote.innerHTML = '<i data-lucide="pause-circle" style="display:inline; width:16px;"></i> Instance suspended. No resources actively consumed.';
  } else if (gaugePercent < 15) {
    gaugeNote.classList.add('note-warning');
    gaugeNote.innerHTML = '<i data-lucide="alert-triangle" style="display:inline; width:16px;"></i> Your server is running at very low CPU. Consider discussing workload redistribution with your team lead.';
  } else if (gaugePercent > 85) {
    gaugeNote.classList.add('note-danger');
    gaugeNote.innerHTML = '<i data-lucide="flame" style="display:inline; width:16px;"></i> High CPU usage detected! Your server is under heavy load. Consider optimizing your processes.';
  } else {
    gaugeNote.classList.add('note-success');
    gaugeNote.innerHTML = '<i data-lucide="check-circle" style="display:inline; width:16px;"></i> Your server is performing efficiently. Keep it up!';
  }

  // Team overview
  const teamData = companyData.filter(d => d.team === emp.team);
  document.getElementById('teamName').textContent = emp.team;
  
  const teamAvg = teamData.reduce((s, d) => s + d.cpu_usage, 0) / teamData.length;
  const teamTotalCost = teamData.reduce((s, d) => s + d.monthly_cost, 0);
  const teamIdleMembers = teamData.filter(d => !d.isSuspended && d.cpu_usage < 15);

  const sorted = [...teamData].sort((a, b) => b.cpu_usage - a.cpu_usage);
  const myRank  = sorted.findIndex(d => d.employee === emp.employee) + 1;
  const topPerformer = sorted[0].employee;

  document.getElementById('teamAvgCpu').textContent     = `${teamAvg.toFixed(1)}%`;
  document.getElementById('teamCost').textContent       = `$${teamTotalCost.toLocaleString()}/mo`;
  document.getElementById('teamActive').textContent     = `${teamData.length - teamIdleMembers.length} / ${teamData.length}`;
  document.getElementById('teamIdle').textContent       = `${teamIdleMembers.length}`;
  document.getElementById('teamTopPerformer').textContent = topPerformer === emp.employee ? `${topPerformer} (You!)` : topPerformer;
  document.getElementById('teamMyRank').textContent     = `#${myRank} of ${teamData.length}`;

  // Team members table
  const tbody = document.getElementById('empTeamTbody');
  tbody.innerHTML = '';
  
  teamData.forEach(d => {
    const isMe = d.employee === emp.employee;
    const rowClass = isMe ? 'emp-my-row' : '';
    const youTag = isMe ? '<span class="you-tag">You</span>' : '';
    
    const rowIdle = !d.isSuspended && d.cpu_usage < 15;
    const statusLabel = d.isSuspended ? '<span class="badge-danger-inline" style="color:var(--danger);font-size:0.85rem;display:flex;align-items:center;gap:4px;"><i data-lucide="pause-circle" style="width:14px;"></i> Off</span>' : 
                        (rowIdle ? '<span class="badge-warning-inline" style="display:flex;align-items:center;gap:4px;"><i data-lucide="alert-triangle" style="width:14px;"></i> Low</span>' : '<span class="badge-success-inline" style="display:flex;align-items:center;gap:4px;"><i data-lucide="check-circle" style="width:14px;"></i> Active</span>');
    const cpuVal = d.isSuspended ? 0 : d.cpu_usage;
    
    tbody.innerHTML += `
      <tr class="${rowClass}">
        <td>${d.employee} ${youTag}</td>
        <td>${d.instance_type}</td>
        <td>${statusLabel}</td>
        <td>$${d.monthly_cost}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="flex:1; height:4px; background:var(--border); border-radius:2px;"><div style="height:100%; width:${cpuVal}%; background:var(--accent-1); border-radius:2px;"></div></div>
            <span style="font-size:0.8rem; width:30px;">${Math.round(cpuVal)}%</span>
          </div>
        </td>
      </tr>
    `;
  });

  lucide.createIcons();
}
