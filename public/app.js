'use strict';

const gate = document.querySelector('#gate');
const app = document.querySelector('#app');
const loginForm = document.querySelector('#login-form');
const passwordInput = document.querySelector('#password');
const loginError = document.querySelector('#login-error');
const envelopeGrid = document.querySelector('#envelope-grid');
const wishModal = document.querySelector('#wish-modal');
const storageKey = 'alabi-joy-sweet-sixteen-opened-v1';
let content = null;
let opened = new Set();
let activeEnvelope = -1;
let installPrompt = null;

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) opened = new Set(saved.filter(n => Number.isInteger(n) && n >= 0 && n < 25));
} catch (_) {
  opened = new Set();
}

function setGateMessage(message) {
  loginError.textContent = message || '';
}

async function fetchContent() {
  const response = await fetch('/api/birthday-content', { credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) throw new Error(response.status === 401 ? 'Your session has expired. Please enter the password again.' : 'The birthday surprise could not be loaded. Please try again.');
  return response.json();
}

async function checkStatus() {
  try {
    const response = await fetch('/api/status', { credentials: 'same-origin', cache: 'no-store' });
    const status = await response.json();
    if (status.unlocked) {
      content = await fetchContent();
      showApp();
    }
  } catch (_) {
    setGateMessage('You appear to be offline. Reconnect to unlock the birthday surprise.');
  }
}

function showApp() {
  if (!content) return;
  gate.classList.add('hidden');
  app.classList.remove('hidden');
  renderLetter();
  renderNotes();
  renderGifts();
  renderEnvelopes();
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  setGateMessage('');
  const submit = loginForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = 'Checking…';
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput.value })
    });
    const result = await response.json();
    if (!response.ok) {
      setGateMessage(result.error || 'That password does not match. Please try again.');
      passwordInput.select();
      return;
    }
    content = await fetchContent();
    passwordInput.value = '';
    showApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    setGateMessage(error.message || 'Connection problem. Please try again.');
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Unlock <span aria-hidden="true">✦</span>';
  }
});

function makeTextElement(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function renderLetter() {
  const body = document.querySelector('#letter-body');
  body.replaceChildren();
  content.letter.forEach((paragraph, index) => {
    const p = makeTextElement('p', paragraph);
    if (index === content.letter.length - 1) p.classList.add('last-letter-line');
    body.appendChild(p);
  });
}

function renderNotes() {
  const grid = document.querySelector('#notes-grid');
  grid.replaceChildren();
  content.notes.forEach((note, index) => {
    const card = document.createElement('article');
    card.className = 'note-card';
    card.appendChild(makeTextElement('span', `0${index + 1}`, 'note-number'));
    card.appendChild(makeTextElement('h3', note[0]));
    card.appendChild(makeTextElement('p', note[1]));
    grid.appendChild(card);
  });
}

function renderGifts() {
  const grid = document.querySelector('#gift-grid');
  grid.replaceChildren();
  content.gifts.forEach((gift, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `gift-tile gift-tone-${index + 1}`;
    button.appendChild(makeTextElement('span', '🎁', 'tile-gift'));
    button.appendChild(makeTextElement('b', gift[0]));
    button.appendChild(makeTextElement('small', 'Tap to open'));
    button.addEventListener('click', () => {
      const box = document.querySelector('#gift-message');
      box.textContent = gift[1];
      box.classList.remove('hidden');
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    grid.appendChild(button);
  });
}

function saveProgress() {
  try { localStorage.setItem(storageKey, JSON.stringify([...opened].sort((a, b) => a - b))); }
  catch (_) { showToast('Your browser could not save progress on this device.'); }
}

function renderEnvelopes() {
  envelopeGrid.replaceChildren();
  content.envelopes.forEach((wish, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `envelope-card${opened.has(index) ? ' opened' : ''}`;
    button.setAttribute('aria-label', `Envelope ${index + 1}: ${opened.has(index) ? 'already opened' : 'open wish'}`);
    button.appendChild(makeTextElement('span', String(index + 1).padStart(2, '0'), 'envelope-number'));
    button.appendChild(makeTextElement('span', opened.has(index) ? '✓' : '✉', 'envelope-symbol'));
    button.appendChild(makeTextElement('span', opened.has(index) ? 'Opened' : 'Open envelope', 'envelope-caption'));
    button.addEventListener('click', () => openEnvelope(index));
    envelopeGrid.appendChild(button);
  });
  const count = opened.size;
  document.querySelector('#progress-count').textContent = `${count} / 25`;
  document.querySelector('#progress-percent').textContent = `${Math.round(count / 25 * 100)}%`;
  document.querySelector('#progress-bar').style.width = `${count / 25 * 100}%`;
  document.querySelector('#all-opened').classList.toggle('hidden', count !== 25);
}

function openEnvelope(index) {
  const wish = content.envelopes[index];
  if (!wish) return;
  activeEnvelope = index;
  opened.add(index);
  saveProgress();
  renderEnvelopes();
  document.querySelector('#modal-number').textContent = String(index + 1).padStart(2, '0');
  document.querySelector('#modal-title').textContent = wish[0];
  document.querySelector('#modal-text').textContent = wish[1];
  wishModal.classList.remove('hidden');
  document.querySelector('#modal-done').focus();
  if (opened.size === 25) {
    window.setTimeout(() => {
      if (opened.size === 25) celebrate();
    }, 450);
  }
}

function closeModal() {
  wishModal.classList.add('hidden');
  if (activeEnvelope >= 0) {
    const cards = envelopeGrid.querySelectorAll('button');
    cards[activeEnvelope]?.focus();
  }
}

document.querySelector('#modal-close').addEventListener('click', closeModal);
document.querySelector('#modal-done').addEventListener('click', closeModal);
 wishModal.addEventListener('click', event => { if (event.target === wishModal) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !wishModal.classList.contains('hidden')) closeModal(); });

document.querySelector('#random-btn').addEventListener('click', () => {
  const unopened = content.envelopes.map((_, index) => index).filter(index => !opened.has(index));
  const pool = unopened.length ? unopened : content.envelopes.map((_, index) => index);
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  openEnvelope(chosen);
});

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.add('hidden'), 2800);
}

function celebrate() {
  const symbols = ['✦', '✿', '♥', '✧'];
  const palette = ['#ff7eac', '#9bd9a4', '#ffe5f0', '#d8f2d9'];
  for (let index = 0; index < 55; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.color = palette[index % palette.length];
    piece.style.setProperty('--drift', `${Math.random() * 150 - 75}px`);
    piece.style.animationDelay = `${Math.random() * 0.55}s`;
    document.body.appendChild(piece);
    window.setTimeout(() => piece.remove(), 3500);
  }
}

document.querySelector('#celebrate-btn').addEventListener('click', () => {
  celebrate();
  showToast('A little more birthday joy, just for you!');
});

document.querySelector('#logout-btn').addEventListener('click', async () => {
  try { await fetch('/api/logout', { method: 'POST', credentials: 'same-origin', cache: 'no-store' }); }
  catch (_) { /* Clear the visible app even if the network is unavailable. */ }
  content = null;
  app.classList.add('hidden');
  gate.classList.remove('hidden');
  setGateMessage('The surprise is locked. Enter the password to open it again.');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  document.querySelector('#install-btn').classList.remove('hidden');
});
document.querySelector('#install-btn').addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  document.querySelector('#install-btn').classList.add('hidden');
});
window.addEventListener('appinstalled', () => {
  document.querySelector('#install-btn').classList.add('hidden');
  showToast('Joy’s birthday app is installed on this device.');
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

checkStatus();
