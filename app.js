/* =============================================
   SERENE — Task Manager
   app.js
   ============================================= */

// === STATE ===
let tasks = [];
let filter = 'all';
let idCounter = 0;

// === MOOD MESSAGES ===
const moods = [
  ["🌙", "You've got this! One task at a time."],
  ["✨", "Small steps lead to big wins, lovely."],
  ["🌸", "Let's make today amazing!"],
  ["💜", "Your future self will thank you."],
  ["🌟", "Focus mode: ON. You're unstoppable."],
  ["🦋", "Every task completed is a step forward."],
  ["🌙", "Take it easy, you're doing great."],
  ["💫", "A clear mind starts with a clear list."],
];

// === EMPTY STATE MESSAGES ===
const emptyStates = {
  all:     ['🌸', "All clear!",              "Add your first task above~"],
  pending: ['🎊', "Nothing pending!",         "You're all caught up! Amazing!"],
  done:    ['🌙', "No completed tasks",       "Check some off and celebrate!"],
  high:    ['✨', "No high priority tasks",   "Living that chill life 💜"],
  overdue: ['🦋', "Nothing overdue!",         "You're on top of it all!"],
};

// === PRIORITY LABELS ===
const priorityLabels = {
  high:   '🔥 High',
  medium: '⚡ Medium',
  low:    '🌿 Low',
};

// =============================================
// INIT
// =============================================
function init() {
  loadFromStorage();
  setMood();
  setMinDate();
  bindEvents();
  render();
}

// =============================================
// LOCAL STORAGE
// =============================================
function saveToStorage() {
  localStorage.setItem('serene-tasks', JSON.stringify(tasks));
  localStorage.setItem('serene-counter', idCounter);
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem('serene-tasks');
    const savedCounter = localStorage.getItem('serene-counter');
    if (saved) tasks = JSON.parse(saved);
    if (savedCounter) idCounter = parseInt(savedCounter);
  } catch (e) {
    console.warn('Could not load tasks from storage:', e);
    tasks = [];
  }
}

// =============================================
// TASK ACTIONS
// =============================================
function addTask() {
  const nameEl = document.getElementById('task-input');
  const name = nameEl.value.trim();

  if (!name) {
    nameEl.style.borderColor = 'var(--pink-dim)';
    nameEl.style.animation = 'shake 0.3s ease';
    nameEl.style.boxShadow = '0 0 0 4px rgba(240,98,146,0.1)';
    setTimeout(() => {
      nameEl.style.borderColor = '';
      nameEl.style.animation = '';
      nameEl.style.boxShadow = '';
    }, 600);
    showToast('✦ Please enter a task name first~');
    return;
  }

  const priority = document.getElementById('priority').value;
  const date = document.getElementById('due-date').value;

  tasks.unshift({
    id: ++idCounter,
    name,
    priority,
    date,
    done: false,
    createdAt: new Date().toISOString(),
  });

  // Reset inputs
  nameEl.value = '';
  document.getElementById('due-date').value = '';

  // Button pop animation
  const btn = document.getElementById('add-btn');
  btn.classList.add('popping');
  setTimeout(() => btn.classList.remove('popping'), 300);

  spawnParticles();
  showToast('✦ Task added to serene!');
  saveToStorage();
  render();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.done = !task.done;

  if (task.done) {
    spawnConfetti();
    showToast('🎉 Amazing! Task complete!');
    setMood();
  } else {
    showToast('↩️ Task marked as pending');
  }

  saveToStorage();
  render();
}

function deleteTask(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) {
    el.style.transition = 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.opacity = '0';
    el.style.transform = 'scale(0.95) translateX(20px)';
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      saveToStorage();
      render();
    }, 280);
  }
  showToast('🗑️ Task removed');
}

// =============================================
// FILTER
// =============================================
function setFilter(f, btn) {
  filter = f;
  document.querySelectorAll('.f-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function getFiltered() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return tasks.filter(t => {
    switch (filter) {
      case 'pending': return !t.done;
      case 'done':    return t.done;
      case 'high':    return t.priority === 'high';
      case 'overdue':
        if (!t.date || t.done) return false;
        return new Date(t.date + 'T00:00:00') < today;
      default:        return true;
    }
  });
}

// =============================================
// DATE HELPERS
// =============================================
function getDateInfo(dateStr) {
  if (!dateStr) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((due - today) / 86400000);

  if (diff < 0) return { text: `⚠️ Overdue ${Math.abs(diff)}d`, cls: 'overdue' };
  if (diff === 0) return { text: '⚡ Due today!',     cls: 'soon' };
  if (diff === 1) return { text: '⏰ Due tomorrow',   cls: 'soon' };
  return { text: `📅 ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, cls: '' };
}

function setMinDate() {
  document.getElementById('due-date').min = new Date().toISOString().split('T')[0];
}

// =============================================
// RENDER
// =============================================
function render() {
  const listEl    = document.getElementById('task-list');
  const filtered  = getFiltered();
  const doneCount = tasks.filter(t => t.done).length;
  const total     = tasks.length;

  // Update stats
  document.getElementById('s-total').textContent   = total;
  document.getElementById('s-pending').textContent = tasks.filter(t => !t.done).length;
  document.getElementById('s-done').textContent    = doneCount;
  document.getElementById('list-count').textContent = `${filtered.length} task${filtered.length !== 1 ? 's' : ''}`;

  // Progress bar
  const progressWrap = document.getElementById('progress-wrap');
  if (total > 0) {
    progressWrap.style.display = 'block';
    const pct = Math.round((doneCount / total) * 100);
    document.getElementById('prog-fill').style.width = pct + '%';
    document.getElementById('prog-pct').textContent  = pct + '%';
  } else {
    progressWrap.style.display = 'none';
  }

  // Empty state
  if (filtered.length === 0) {
    const [ico, title, sub] = emptyStates[filter] || emptyStates.all;
    listEl.innerHTML = `
      <div class="empty">
        <span class="empty-img">${ico}</span>
        <div class="empty-title">${title}</div>
        <div class="empty-sub">${sub}</div>
      </div>`;
    return;
  }

  // Task cards
  listEl.innerHTML = filtered.map((task, i) => {
    const di = getDateInfo(task.date);
    const dateHTML = di
      ? `<span class="tag-date ${di.cls}">${di.text}</span>`
      : '';

    return `
      <div class="task-card p-${task.priority} ${task.done ? 'done' : ''}"
           data-id="${task.id}"
           style="animation-delay: ${i * 0.05}s">

        <div class="check-wrap ${task.done ? 'checked' : ''}"
             onclick="toggleTask(${task.id})"></div>

        <div class="task-body">
          <div class="task-name">${escHtml(task.name)}</div>
          <div class="task-tags">
            <span class="tag tag-${task.priority}">${priorityLabels[task.priority]}</span>
            ${dateHTML}
          </div>
        </div>

        <button class="btn-del" onclick="deleteTask(${task.id})" title="Delete task">✕</button>
      </div>`;
  }).join('');
}

// =============================================
// MOOD
// =============================================
function setMood() {
  const [emoji, msg] = moods[Math.floor(Math.random() * moods.length)];
  document.getElementById('mood-bar').innerHTML = `${emoji} <span>${msg}</span>`;
}

// =============================================
// TOAST
// =============================================
let toastTimer;
function showToast(msg) {
  const toastEl = document.getElementById('toast');
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

// =============================================
// CONFETTI
// =============================================
function spawnConfetti() {
  const colors = ['#b46ef5', '#f06292', '#ffd97d', '#80ffcc', '#c4a8ff', '#fff'];
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = `
        left: ${30 + Math.random() * 40}vw;
        top: ${20 + Math.random() * 30}vh;
        width: ${6 + Math.random() * 8}px;
        height: ${6 + Math.random() * 8}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        transform: rotate(${Math.random() * 360}deg);
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1100);
    }, i * 40);
  }
}

// =============================================
// PARTICLES (on add)
// =============================================
function spawnParticles() {
  const btn = document.getElementById('add-btn');
  const rect = btn.getBoundingClientRect();
  const colors = ['#b46ef5', '#f06292', '#ffd97d'];

  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.style.cssText = `
        position: fixed;
        width: 5px; height: 5px;
        border-radius: 50%;
        background: ${colors[i % 3]};
        left: ${rect.left + rect.width / 2 + (Math.random() - 0.5) * 60}px;
        top: ${rect.top + (Math.random() - 0.5) * 20}px;
        opacity: 0;
        pointer-events: none;
        z-index: 9999;
        animation: floatUp 0.8s ease forwards;
        animation-delay: ${i * 0.07}s;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 900);
    }, i * 60);
  }
}

// =============================================
// HELPERS
// =============================================
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =============================================
// EVENT BINDINGS
// =============================================
function bindEvents() {
  // Enter key to add task
  document.getElementById('task-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });
}

// Add floatUp animation dynamically
const styleTag = document.createElement('style');
styleTag.textContent = `
  @keyframes floatUp {
    0%   { opacity: 0; transform: translateY(0) scale(0); }
    20%  { opacity: 0.8; transform: translateY(-20px) scale(1); }
    100% { opacity: 0; transform: translateY(-100px) scale(0.3); }
  }
`;
document.head.appendChild(styleTag);

// =============================================
// START
// =============================================
document.addEventListener('DOMContentLoaded', init);
