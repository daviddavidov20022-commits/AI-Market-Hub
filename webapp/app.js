/* ═══════════════════════════════════════════════════
   AI Print Studio — App Logic
   ═══════════════════════════════════════════════════ */

// ── Telegram WebApp init ──────────────────────────────────────────────────
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

// ── State ─────────────────────────────────────────────────────────────────
const state = {
  product: 'sticker',   // sticker | mug | canvas
  prompt: '',
  generatedImageUrl: null,
  // canvas drag/zoom
  imgX: 0, imgY: 0, imgScale: 1,
  isDragging: false,
  dragStartX: 0, dragStartY: 0,
  imgStartX: 0, imgStartY: 0,
};

let render3dInterval = null;

// ── Product config ─────────────────────────────────────────────────────────
const PRODUCTS = {
  sticker: {
    label: 'Стикер с принтом',
    emoji: '🏷️',
    price: 390,
    details: 'Виниловый стикер 10×10 см · Водостойкий',
    margin: '74%',
    color: '#1a1a24',
  },
  mug: {
    label: 'Кружка с принтом',
    emoji: '☕',
    price: 990,
    details: 'Керамическая кружка 330 мл · Сублимация',
    margin: '57%',
    color: '#1e1a2e',
  },
  canvas: {
    label: 'Холст 30×40 см',
    emoji: '🖼️',
    price: 1990,
    details: 'Печать на холсте · Подрамник в комплекте',
    margin: '59%',
    color: '#1a1e1a',
  },
};

// ── Screen navigation ─────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Product tabs ──────────────────────────────────────────────────────────
document.querySelectorAll('.product-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.product-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.product = btn.dataset.product;
  });
});

// ── Prompt textarea ───────────────────────────────────────────────────────
const promptInput = document.getElementById('prompt-input');
const charCount   = document.getElementById('char-count');
promptInput.addEventListener('input', () => {
  charCount.textContent = promptInput.value.length;
  state.prompt = promptInput.value;
});

// Style chips
document.querySelectorAll('.style-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const style = chip.dataset.style;
    const cur = promptInput.value.trimEnd();
    if (!cur.includes(style)) {
      promptInput.value = cur ? `${cur}, ${style}` : style;
      promptInput.dispatchEvent(new Event('input'));
    }
    document.querySelectorAll('.style-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });
});

// Example chips
document.querySelectorAll('.example-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    promptInput.value = chip.dataset.prompt;
    promptInput.dispatchEvent(new Event('input'));
    promptInput.focus();
  });
});

// ── Generate ──────────────────────────────────────────────────────────────
document.getElementById('btn-generate').addEventListener('click', () => {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    promptInput.focus();
    promptInput.style.borderColor = '#f87171';
    setTimeout(() => promptInput.style.borderColor = '', 1200);
    return;
  }
  state.prompt = prompt;
  runGeneration();
});

function runGeneration() {
  showScreen('screen-loading');
  const preview = document.getElementById('loading-product-preview');
  preview.textContent = PRODUCTS[state.product].emoji;

  // Animate progress
  const bar = document.getElementById('progress-bar');
  const statusEl = document.getElementById('loading-status');
  const steps = [
    [10, 'Анализирую описание...'],
    [30, 'Подбираю стиль...'],
    [55, 'Создаю изображение...'],
    [80, 'Накладываю на товар...'],
    [100, 'Готово! 🎉'],
  ];
  let i = 0;
  bar.style.width = '0%';

  const interval = setInterval(() => {
    if (i >= steps.length) {
      clearInterval(interval);
      setTimeout(onGenerationComplete, 400);
      return;
    }
    bar.style.width = steps[i][0] + '%';
    statusEl.textContent = steps[i][1];
    i++;
  }, 500);
}

function onGenerationComplete() {
  // Generate a gradient image as a demo (replace with real API call)
  state.generatedImageUrl = generateDemoImage(state.prompt);
  state.imgX = 0; state.imgY = 0; state.imgScale = 1;
  updateProductInfoUI();
  showScreen('screen-preview');
  renderMockup('mockup-canvas');
}

// ── Demo image generator (canvas gradient based on prompt) ────────────────
function generateDemoImage(prompt) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');

  // Hash prompt → colors
  const h1 = hashColor(prompt, 0);
  const h2 = hashColor(prompt, 60);
  const h3 = hashColor(prompt, 130);

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, h1);
  grad.addColorStop(0.5, h2);
  grad.addColorStop(1, h3);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Decorative circles
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(
      80 + i * 70, 256 + Math.sin(i) * 120,
      40 + i * 15,
      0, Math.PI * 2
    );
    ctx.fillStyle = `rgba(255,255,255,${0.05 + i * 0.04})`;
    ctx.fill();
  }

  // Prompt text
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 22px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = prompt.split(' ').slice(0, 4).join(' ');
  ctx.fillText(words, 256, 256);

  return c.toDataURL('image/png');
}

function hashColor(str, offset) {
  let hash = offset;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) & 0xffffff;
  const h = (hash % 360 + 360) % 360;
  return `hsl(${h},65%,55%)`;
}

// ── Product info UI ───────────────────────────────────────────────────────
function updateProductInfoUI() {
  const p = PRODUCTS[state.product];
  document.getElementById('preview-product-name').textContent = p.label;
  document.getElementById('info-product-name').textContent = p.label;
  document.getElementById('info-product-price').textContent = p.price + '₽';
  document.getElementById('info-product-details').textContent = p.details;
  document.getElementById('info-margin').textContent = `💰 Маржа ${p.margin}`;
  document.getElementById('order-product-name').textContent = p.label;
  document.getElementById('order-product-price').textContent = p.price + '₽';
  document.getElementById('order-total-price').textContent = p.price + '₽';
}

// ── Mockup Renderer ───────────────────────────────────────────────────────
function renderMockup(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const isSmall = canvasId === 'order-preview-canvas';
  const W = isSmall ? 72 : Math.min(window.innerWidth - 32, 400);
  const H = isSmall ? 72 : Math.round(W * 0.75);

  const container3d = document.getElementById('mockup-3d-container');
  const controls2d = document.getElementById('mockup-controls-2d');
  const controls3dUI = document.getElementById('mockup-controls-3d');

  if (render3dInterval) {
    cancelAnimationFrame(render3dInterval);
    render3dInterval = null;
  }

  if (!isSmall && state.product === 'mug') {
    canvas.style.display = 'none';
    if (controls2d) controls2d.style.display = 'none';
    if (controls3dUI) controls3dUI.style.display = 'block';
    if (container3d) {
      container3d.style.display = 'block';
      renderMug3D(state.generatedImageUrl, 'mockup-3d-container', W, H);
    }
    return;
  } else {
    canvas.style.display = 'block';
    if (!isSmall && controls2d) controls2d.style.display = 'flex';
    if (!isSmall && controls3dUI) controls3dUI.style.display = 'none';
    if (container3d) container3d.style.display = 'none';
  }

  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, W, H);
    if (state.product === 'sticker') drawStickerMockup(ctx, img, W, H, isSmall);
    else if (state.product === 'mug')  drawMugMockup(ctx, img, W, H, isSmall); // For small order preview
    else                               drawCanvasMockup(ctx, img, W, H, isSmall);
  };
  img.src = state.generatedImageUrl;
}

// ── 3D Mug Renderer ───────────────────────────────────────────────────────
function renderMug3D(imageUrl, containerId, W, H) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1a1a24');

  const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 100);
  camera.position.set(0, 18, 35);
  
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(10, 15, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.2);
  fillLight.position.set(-10, 5, -10);
  scene.add(fillLight);

  const mugGroup = new THREE.Group();
  scene.add(mugGroup);

  const loader = new THREE.TextureLoader();
  loader.load(imageUrl, (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    const outsideMat = new THREE.MeshStandardMaterial({ 
      map: texture, roughness: 0.2, metalness: 0.1 
    });
    const whiteMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, roughness: 0.2, metalness: 0.1 
    });

    const r = 4;
    const h = 9;
    const seg = 64;

    const outGeo = new THREE.CylinderGeometry(r, r, h, seg, 1, true);
    const outMesh = new THREE.Mesh(outGeo, outsideMat);
    outMesh.castShadow = true;
    outMesh.receiveShadow = true;
    mugGroup.add(outMesh);

    const inGeo = new THREE.CylinderGeometry(r - 0.3, r - 0.3, h, seg, 1, true);
    const inMesh = new THREE.Mesh(inGeo, whiteMat);
    inMesh.material.side = THREE.BackSide;
    mugGroup.add(inMesh);

    const rimGeo = new THREE.RingGeometry(r - 0.3, r, seg);
    const rimMesh = new THREE.Mesh(rimGeo, whiteMat);
    rimMesh.rotation.x = -Math.PI / 2;
    rimMesh.position.y = h / 2;
    mugGroup.add(rimMesh);

    const botGeo = new THREE.CircleGeometry(r, seg);
    const botMesh = new THREE.Mesh(botGeo, whiteMat);
    botMesh.rotation.x = Math.PI / 2;
    botMesh.position.y = -h / 2;
    mugGroup.add(botMesh);

    const inBotGeo = new THREE.CircleGeometry(r - 0.3, seg);
    const inBotMesh = new THREE.Mesh(inBotGeo, whiteMat);
    inBotMesh.rotation.x = -Math.PI / 2;
    inBotMesh.position.y = -h / 2 + 0.3;
    mugGroup.add(inBotMesh);

    const handleGeo = new THREE.TorusGeometry(2.5, 0.5, 16, 32);
    const handleMesh = new THREE.Mesh(handleGeo, whiteMat);
    handleMesh.position.set(r + 0.3, 0, 0);
    handleMesh.castShadow = true;
    handleMesh.receiveShadow = true;
    mugGroup.add(handleMesh);

    mugGroup.rotation.y = -Math.PI / 4; 

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 15;
    controls.maxDistance = 50;

    function animate() {
      render3dInterval = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
  });
}

// ── Sticker mockup ────────────────────────────────────────────────────────
function drawStickerMockup(ctx, img, W, H, small) {
  if (small) { ctx.drawImage(img, 0, 0, W, H); return; }

  // Background
  ctx.fillStyle = '#16161e';
  ctx.fillRect(0, 0, W, H);

  // Grid dots
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let x = 0; x < W; x += 20)
    for (let y = 0; y < H; y += 20)
      ctx.fillRect(x, y, 2, 2);

  // Sticker shape: rounded square with white border
  const sz = Math.min(W, H) * 0.58;
  const cx = W / 2 + state.imgX, cy = H / 2 + state.imgY;
  const sc = state.imgScale;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(sc, sc);

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;

  // White border
  roundRect(ctx, -sz / 2 - 6, -sz / 2 - 6, sz + 12, sz + 12, 22);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // Clip to sticker area and draw image
  ctx.save();
  roundRect(ctx, -sz / 2, -sz / 2, sz, sz, 16);
  ctx.clip();
  ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz);
  ctx.restore();

  ctx.restore();

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Стикер 10×10 см', W / 2, H - 10);
}

// ── Mug mockup ────────────────────────────────────────────────────────────
function drawMugMockup(ctx, img, W, H, small) {
  if (small) { ctx.drawImage(img, 0, 0, W, H); return; }

  ctx.fillStyle = '#1a1220';
  ctx.fillRect(0, 0, W, H);

  const mW = W * 0.7, mH = H * 0.78;
  const mx = (W - mW) / 2, my = (H - mH) / 2;

  // Mug body shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 10;
  roundRect(ctx, mx, my, mW, mH, 14);
  ctx.fillStyle = '#2a2a3a';
  ctx.fill();
  ctx.restore();

  // Image wrap area (clip)
  const wrapX = mx + mW * 0.08 + state.imgX;
  const wrapW = mW * 0.78;
  const wrapH = mH * 0.72;
  const wrapY = my + mH * 0.14 + state.imgY;

  ctx.save();
  roundRect(ctx, mx + mW * 0.08, my + mH * 0.14, wrapW, wrapH, 6);
  ctx.clip();

  // Subtle perspective transform via scaling
  ctx.save();
  ctx.translate(mx + mW / 2, my + mH / 2);
  ctx.scale(state.imgScale, state.imgScale * 0.92);
  ctx.drawImage(img, -wrapW / 2 + (wrapX - mx - mW * 0.08 - wrapW / 2 + wrapW / 2), -wrapH / 2, wrapW, wrapH);
  ctx.restore();
  ctx.restore();

  // Mug rim (top oval)
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(W / 2, my + 14, mW / 2 - 2, 14, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3a3a4a';
  ctx.fill();
  ctx.restore();

  // Handle
  ctx.save();
  ctx.beginPath();
  ctx.arc(mx + mW + 18, my + mH * 0.45, mH * 0.2, -0.9, 0.9);
  ctx.strokeStyle = '#3a3a4a';
  ctx.lineWidth = 14;
  ctx.stroke();
  ctx.restore();

  // Highlight
  ctx.save();
  const hl = ctx.createLinearGradient(mx, 0, mx + mW * 0.3, 0);
  hl.addColorStop(0, 'rgba(255,255,255,0.12)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  roundRect(ctx, mx, my, mW * 0.3, mH, [14, 0, 0, 14]);
  ctx.fillStyle = hl;
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Кружка 330 мл', W / 2, H - 8);
}

// ── Canvas/painting mockup ────────────────────────────────────────────────
function drawCanvasMockup(ctx, img, W, H, small) {
  if (small) { ctx.drawImage(img, 0, 0, W, H); return; }

  ctx.fillStyle = '#101810';
  ctx.fillRect(0, 0, W, H);

  const cW = W * 0.72, cH = H * 0.85;
  const cx = (W - cW) / 2, cy = (H - cH) / 2;

  // Canvas shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#2a2418';
  ctx.fillRect(cx, cy, cW, cH);
  ctx.restore();

  // Wooden frame
  const fw = 14; // frame width
  const frameColors = ['#6b4f2a', '#8b6a3a', '#6b4f2a', '#5a4020'];
  // top, right, bottom, left
  const sides = [
    [cx - fw, cy - fw, cW + fw * 2, fw, 0],
    [cx + cW, cy - fw, fw, cH + fw * 2, 1],
    [cx - fw, cy + cH, cW + fw * 2, fw, 2],
    [cx - fw, cy - fw, fw, cH + fw * 2, 3],
  ];
  sides.forEach(([x, y, w, h, i]) => {
    ctx.fillStyle = frameColors[i];
    ctx.fillRect(x, y, w, h);
  });

  // Frame inner shadow
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 3;
  ctx.strokeRect(cx, cy, cW, cH);
  ctx.restore();

  // Image on canvas
  ctx.save();
  ctx.translate(W / 2 + state.imgX, H / 2 + state.imgY);
  ctx.scale(state.imgScale, state.imgScale);
  ctx.drawImage(img, -cW / 2, -cH / 2, cW, cH);
  ctx.restore();

  // Canvas texture overlay
  ctx.save();
  ctx.globalAlpha = 0.06;
  for (let x = cx; x < cx + cW; x += 4) {
    ctx.fillStyle = x % 8 === 0 ? '#fff' : '#000';
    ctx.fillRect(x, cy, 1, cH);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Холст 30×40 см на подрамнике', W / 2, H - 6);
}

// ── Helper: rounded rect path ─────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  const radii = Array.isArray(r) ? r : [r, r, r, r];
  ctx.beginPath();
  ctx.moveTo(x + radii[0], y);
  ctx.lineTo(x + w - radii[1], y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radii[1]);
  ctx.lineTo(x + w, y + h - radii[2]);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radii[2], y + h);
  ctx.lineTo(x + radii[3], y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radii[3]);
  ctx.lineTo(x, y + radii[0]);
  ctx.quadraticCurveTo(x, y, x + radii[0], y);
  ctx.closePath();
}

// ── Canvas drag & zoom ────────────────────────────────────────────────────
const mockupCanvas = document.getElementById('mockup-canvas');
let lastTouchDist = null;

mockupCanvas.addEventListener('mousedown', e => {
  state.isDragging = true;
  state.dragStartX = e.clientX;
  state.dragStartY = e.clientY;
  state.imgStartX = state.imgX;
  state.imgStartY = state.imgY;
});
window.addEventListener('mousemove', e => {
  if (!state.isDragging) return;
  state.imgX = state.imgStartX + (e.clientX - state.dragStartX);
  state.imgY = state.imgStartY + (e.clientY - state.dragStartY);
  renderMockup('mockup-canvas');
});
window.addEventListener('mouseup', () => { state.isDragging = false; });

mockupCanvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    state.isDragging = true;
    state.dragStartX = e.touches[0].clientX;
    state.dragStartY = e.touches[0].clientY;
    state.imgStartX = state.imgX;
    state.imgStartY = state.imgY;
  } else if (e.touches.length === 2) {
    lastTouchDist = getTouchDist(e.touches);
  }
}, { passive: true });

mockupCanvas.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && state.isDragging) {
    state.imgX = state.imgStartX + (e.touches[0].clientX - state.dragStartX);
    state.imgY = state.imgStartY + (e.touches[0].clientY - state.dragStartY);
    renderMockup('mockup-canvas');
  } else if (e.touches.length === 2 && lastTouchDist) {
    const dist = getTouchDist(e.touches);
    state.imgScale = Math.min(3, Math.max(0.3, state.imgScale * (dist / lastTouchDist)));
    lastTouchDist = dist;
    renderMockup('mockup-canvas');
  }
}, { passive: true });

mockupCanvas.addEventListener('touchend', () => {
  state.isDragging = false;
  lastTouchDist = null;
});

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

// Zoom buttons
document.getElementById('btn-zoom-in').addEventListener('click', () => {
  state.imgScale = Math.min(3, state.imgScale + 0.2);
  renderMockup('mockup-canvas');
});
document.getElementById('btn-zoom-out').addEventListener('click', () => {
  state.imgScale = Math.max(0.3, state.imgScale - 0.2);
  renderMockup('mockup-canvas');
});
document.getElementById('btn-reset-pos').addEventListener('click', () => {
  state.imgX = 0; state.imgY = 0; state.imgScale = 1;
  renderMockup('mockup-canvas');
});

// ── Preview → Generate back ───────────────────────────────────────────────
document.getElementById('btn-back-to-generate').addEventListener('click', () => {
  showScreen('screen-generate');
});

// ── Regenerate ────────────────────────────────────────────────────────────
document.getElementById('btn-regenerate').addEventListener('click', () => {
  runGeneration();
});

// ── Order ─────────────────────────────────────────────────────────────────
document.getElementById('btn-order').addEventListener('click', () => {
  updateProductInfoUI();
  renderMockup('order-preview-canvas');
  showScreen('screen-order');
  // Pre-fill name from Telegram
  if (tg?.initDataUnsafe?.user) {
    const u = tg.initDataUnsafe.user;
    const nameField = document.getElementById('field-name');
    if (!nameField.value) nameField.value = [u.first_name, u.last_name].filter(Boolean).join(' ');
  }
});

document.getElementById('btn-back-to-preview').addEventListener('click', () => {
  showScreen('screen-preview');
});

// ── Confirm order ─────────────────────────────────────────────────────────
document.getElementById('btn-confirm-order').addEventListener('click', () => {
  const name    = document.getElementById('field-name').value.trim();
  const phone   = document.getElementById('field-phone').value.trim();
  const address = document.getElementById('field-address').value.trim();

  if (!name || !phone || !address) {
    ['field-name', 'field-phone', 'field-address'].forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.style.borderColor = '#f87171';
        setTimeout(() => el.style.borderColor = '', 1500);
      }
    });
    return;
  }

  const p = PRODUCTS[state.product];
  const orderId = '#' + Math.floor(100000 + Math.random() * 900000);

  const orderData = {
    action: 'order',
    product: state.product,
    product_label: p.label,
    price: p.price,
    prompt: state.prompt,
    name, phone, address,
    comment: document.getElementById('field-comment').value.trim(),
    order_id: orderId,
    timestamp: new Date().toISOString(),
  };

  // Send to bot via Telegram WebApp
  if (tg?.sendData) {
    tg.sendData(JSON.stringify(orderData));
  }

  document.getElementById('success-order-id').textContent = orderId;
  showScreen('screen-success');
});

// ── New order ─────────────────────────────────────────────────────────────
document.getElementById('btn-new-order').addEventListener('click', () => {
  // Reset state
  state.generatedImageUrl = null;
  state.imgX = 0; state.imgY = 0; state.imgScale = 1;
  promptInput.value = '';
  charCount.textContent = '0';
  document.getElementById('field-name').value = '';
  document.getElementById('field-phone').value = '';
  document.getElementById('field-address').value = '';
  document.getElementById('field-comment').value = '';
  document.querySelectorAll('.product-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-sticker').classList.add('active');
  state.product = 'sticker';
  showScreen('screen-generate');
});

// ── Telegram MainButton ───────────────────────────────────────────────────
if (tg) {
  tg.MainButton.hide();
}
