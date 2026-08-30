// ==== Configuration: edit these to customize the invitation ====
const CONFIG = {
  weddingDate: '2026-10-17T10:00:00', // used by countdown
};

// ==== Envelope opening intro ====
document.documentElement.classList.add('intro-active');

const envelopeBtn = document.getElementById('envelopeBtn');
const envelopeIntro = document.getElementById('envelopeIntro');
const tapHint = document.getElementById('tapHint');

envelopeBtn.addEventListener('click', () => {
  if (envelopeBtn.classList.contains('open')) return;
  envelopeBtn.classList.add('open');
  tapHint.classList.add('fade-out');
  startBackgroundMusic();

  setTimeout(() => {
    envelopeIntro.classList.add('hidden');
    document.documentElement.classList.remove('intro-active');
  }, 1400);
});

// ==== Background music ====
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');

function setMusicState(playing) {
  musicToggle.classList.toggle('playing', playing);
  musicToggle.setAttribute('aria-pressed', String(playing));
}

function startBackgroundMusic() {
  bgMusic.volume = 0.5;
  bgMusic.play()
    .then(() => setMusicState(true))
    .catch(() => setMusicState(false)); // autoplay blocked; user can start it via the toggle
}

musicToggle.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play().then(() => setMusicState(true)).catch(() => {});
  } else {
    bgMusic.pause();
    setMusicState(false);
  }
});

// ==== Scroll reveal ====
const sections = document.querySelectorAll('.section');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });
sections.forEach((s) => revealObserver.observe(s));

// ==== Dot nav active state ====
const dots = document.querySelectorAll('#dotNav .dot');
const dotObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      dots.forEach((d) => d.classList.toggle('active', d.getAttribute('href') === `#${id}`));
    }
  });
}, { threshold: 0.5 });
sections.forEach((s) => dotObserver.observe(s));

// ==== Parallax background drift ====
let latestScrollY = window.scrollY;
let parallaxTicking = false;
window.addEventListener('scroll', () => {
  latestScrollY = window.scrollY;
  if (!parallaxTicking) {
    requestAnimationFrame(() => {
      document.body.style.setProperty('--parallax-offset', `${latestScrollY * 0.12}px`);
      parallaxTicking = false;
    });
    parallaxTicking = true;
  }
});

// ==== Countdown ====
function setDigit(el, value) {
  const formatted = String(value).padStart(2, '0');
  if (el.textContent !== formatted) {
    el.textContent = formatted;
    el.classList.remove('pulse');
    // force reflow so the animation restarts on rapid updates
    void el.offsetWidth;
    el.classList.add('pulse');
  }
}

function updateCountdown() {
  const target = new Date(CONFIG.weddingDate).getTime();
  const now = Date.now();
  const diff = Math.max(target - now, 0);

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  setDigit(document.getElementById('cd-days'), days);
  setDigit(document.getElementById('cd-hours'), hours);
  setDigit(document.getElementById('cd-mins'), mins);
  setDigit(document.getElementById('cd-secs'), secs);
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ==== Scratch to reveal ====
(function initScratchCard() {
  const canvas = document.getElementById('scratchCanvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const wrap = document.querySelector('.scratch-wrap');
  const AUTO_COMPLETE_THRESHOLD = 0.2; // auto-finish once 20% is scratched
  let isDrawing = false;
  let revealed = false;

  function paintOverlay() {
    ctx.globalCompositeOperation = 'source-over';
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#d4af37');
    gradient.addColorStop(1, '#8a6d1c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4a0e1e';
    ctx.font = '600 18px "Playfair Display", serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scratch Here', canvas.width / 2, canvas.height / 2);
    ctx.globalCompositeOperation = 'destination-out';
  }
  paintOverlay();

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function getScratchedRatio() {
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let cleared = 0;
    let sampled = 0;
    for (let i = 3; i < data.length; i += 4 * 8) { // sample every 8th pixel's alpha channel
      sampled += 1;
      if (data[i] === 0) cleared += 1;
    }
    return sampled ? cleared / sampled : 0;
  }

  function spawnConfetti() {
    const colors = ['#d4af37', '#f3e3a3', '#fdf6e9'];
    for (let i = 0; i < 26; i += 1) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      const angle = Math.random() * Math.PI * 2;
      const distance = 90 + Math.random() * 90;
      piece.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
      piece.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
      piece.style.setProperty('--rot', `${Math.random() * 360}deg`);
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * 0.15}s`;
      wrap.appendChild(piece);
      piece.addEventListener('animationend', () => piece.remove());
    }
  }

  function autoCompleteReveal() {
    revealed = true;
    canvas.removeEventListener('mousedown', start);
    canvas.removeEventListener('mousemove', move);
    canvas.removeEventListener('touchstart', start);
    canvas.removeEventListener('touchmove', move);
    spawnConfetti();

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxRadius = Math.hypot(canvas.width, canvas.height) / 2 + 30;
    let radius = 30;

    function wipeStep() {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      radius += 28;
      if (radius < maxRadius) {
        requestAnimationFrame(wipeStep);
      } else {
        canvas.classList.add('cleared');
      }
    }
    requestAnimationFrame(wipeStep);
  }

  function scratch(e) {
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    if (!revealed && getScratchedRatio() >= AUTO_COMPLETE_THRESHOLD) {
      autoCompleteReveal();
    }
  }

  function start(e) { isDrawing = true; scratch(e); }
  function move(e) { if (isDrawing) { e.preventDefault(); scratch(e); } }
  function end() { isDrawing = false; }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);

  canvas.addEventListener('touchstart', start, { passive: true });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);
})();

