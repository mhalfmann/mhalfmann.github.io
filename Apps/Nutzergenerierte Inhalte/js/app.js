import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const API_LIST_DIRS_URL = 'api/list-dirs.php';
const API_UPLOAD_URL = 'api/upload-foto.php';
const API_THUMB_URL = 'api/thumb.php';

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v', '.ogv'];
const MODEL_EXTENSIONS = ['.glb', '.gltf', '.obj'];
const MODEL_LOADABLE_EXT = ['.glb', '.gltf', '.obj'];
function isVideoFile(name) {
  if (!name || typeof name !== 'string') return false;
  const ext = name.toLowerCase().slice(name.lastIndexOf('.'));
  return VIDEO_EXTENSIONS.includes(ext);
}
function isModelFile(name) {
  if (!name || typeof name !== 'string') return false;
  const ext = name.toLowerCase().slice(name.lastIndexOf('.'));
  return MODEL_EXTENSIONS.includes(ext);
}
function isModelUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const path = url.split('?')[0];
  const ext = path.toLowerCase().slice(path.lastIndexOf('.'));
  return MODEL_LOADABLE_EXT.includes(ext);
}

const galleryEl = document.getElementById('gallery');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const emptyEl = document.getElementById('empty');
const viewerWrap = document.getElementById('viewer-wrap');
const viewerCanvas = document.getElementById('viewer-canvas');
const viewerMessageEl = document.getElementById('viewer-message');
const viewerErrorEl = document.getElementById('viewer-error');
const btnVr = document.getElementById('btn-vr');
const btnClose = document.getElementById('btn-close');
const btnRefresh = document.getElementById('btn-refresh');
const btnUpload = document.getElementById('btn-upload');
const uploadInput = document.getElementById('upload-input');

let scene, camera, renderer, controls, mesh;
let currentTexture = null;
let currentVideoElement = null;
let currentIsStereoscopic = true;
let viewerMode = 'panorama';
let modelGroup = null;
let vrGrabbedController = null;
let vrGrabWorldQuat = null;
let vrGrabControllerWorldQuat = null;
let vrPendingGrab = false;
let xrSession = null;
let xrReferenceSpace = null;
let xrViewCounter = 0;
let vrStereoEnabled = true;
let vrButtonMesh = null;
let vrRaycaster = null;
let vrPendingSelect = false;
let vrPendingSelectSource = null;
let vrCurrentFrame = null;
let controller1 = null;
let controller2 = null;
let arModelPositionedOnce = false;

let galleryCurrentPath = '';

async function loadDir(path) {
  const url = API_LIST_DIRS_URL + '?path=' + encodeURIComponent(path);
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ordner konnte nicht geladen werden.');
  }
  return res.json();
}

function showError(msg) {
  loadingEl.style.display = 'none';
  galleryEl.innerHTML = '';
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
}

function showViewerMessage(text) {
  if (viewerMessageEl) {
    viewerMessageEl.textContent = text;
    viewerMessageEl.style.display = 'block';
  }
  if (viewerErrorEl) viewerErrorEl.style.display = 'none';
}
function hideViewerMessage() {
  if (viewerMessageEl) viewerMessageEl.style.display = 'none';
}
function showViewerError(text) {
  if (viewerErrorEl) {
    viewerErrorEl.textContent = text;
    viewerErrorEl.style.display = 'block';
  }
  if (viewerMessageEl) viewerMessageEl.style.display = 'none';
}
function hideViewerError() {
  if (viewerErrorEl) viewerErrorEl.style.display = 'none';
}

function normalizePath(p) {
  if (p == null || typeof p !== 'string') return '';
  return p.replace(/\\/g, '/').trim().replace(/\/+$/, '');
}

function renderExplorer(data) {
  loadingEl.style.display = 'none';
  const rawPath = data.path;
  const currentPath = normalizePath(rawPath);
  const folders = Array.isArray(data.folders) ? data.folders : [];
  const files = Array.isArray(data.files) ? data.files : [];
  galleryCurrentPath = currentPath;
  emptyEl.style.display = 'none';

  const breadcrumbParts = currentPath ? currentPath.split('/') : [];
  const parentPath = currentPath ? breadcrumbParts.slice(0, -1).join('/') : null;
  const parts = [];

  // Zeile mit Zurück-Pfeil (falls möglich) und Breadcrumb – immer anzeigen
  parts.push('<div class="gallery-nav-row">');
  if (parentPath !== null) {
    parts.push(`<button type="button" class="gallery-back" data-path="${escapeHtml(parentPath)}" title="Eine Ebene zurück" aria-label="Eine Ebene zurück">
      <span class="gallery-back-arrow" aria-hidden="true"></span>
    </button>`);
  }
  parts.push('<nav class="gallery-breadcrumb" aria-label="Pfad">');
  parts.push('<a href="#" class="breadcrumb-item" data-path="">Media</a>');
  let acc = '';
  for (const segment of breadcrumbParts) {
    acc += (acc ? '/' : '') + segment;
    parts.push('<span class="breadcrumb-sep" aria-hidden="true">›</span>');
    parts.push(`<a href="#" class="breadcrumb-item" data-path="${escapeHtml(acc)}">${escapeHtml(segment)}</a>`);
  }
  parts.push('</nav></div>');

  // Leerer Ordner: Hinweis unter der Navigation
  if (folders.length === 0 && files.length === 0) {
    parts.push('<p class="gallery-empty-msg">Dieser Ordner ist leer.</p>');
  }

  // Ordner (Explorer-ähnlich)
  if (folders.length) {
    parts.push('<div class="gallery-folders">');
    for (const name of folders) {
      const nextPath = currentPath ? currentPath + '/' + name : name;
      parts.push(`<button type="button" class="gallery-folder" data-path="${escapeHtml(nextPath)}" title="${escapeHtml(name)}">
        <span class="folder-icon" aria-hidden="true"></span>
        <span class="folder-name">${escapeHtml(name)}</span>
      </button>`);
    }
    parts.push('</div>');
  }

  // Medien (Fotos + Videos): Thumbnails für Bilder, Icon für Videos
  if (files.length > 0) {
    const p = (typeof currentPath === 'string' ? currentPath : '').replace(/\\/g, '/').trim().replace(/^\/+/, '');
    const pathSegments = p ? p.split('/') : [];
    const fullPathEncoded = pathSegments.map(encodeURIComponent).join('/');
    const pathRelativeToMedia = p.indexOf('Media/') === 0 ? p.slice(6) : p;
    parts.push('<div class="gallery-section"><div class="gallery-thumbs">');
    for (const file of files) {
      const fullUrl = fullPathEncoded ? fullPathEncoded + '/' + encodeURIComponent(file) : encodeURIComponent(file);
      const isVideo = isVideoFile(file);
      const isModel = isModelFile(file);
      if (isVideo) {
        parts.push(`
      <div class="thumb thumb-video" data-src="${fullUrl}" title="${escapeHtml(file)}">
        <span class="thumb-video-icon" aria-hidden="true"></span>
        <span>${escapeHtml(file)}</span>
      </div>`);
      } else if (isModel) {
        parts.push(`
      <div class="thumb thumb-model" data-src="${fullUrl}" title="${escapeHtml(file)}">
        <span class="thumb-model-icon" aria-hidden="true"></span>
        <span>${escapeHtml(file)}</span>
      </div>`);
      } else {
        const thumbPath = pathRelativeToMedia ? pathRelativeToMedia + '/' + file : file;
        const thumbUrl = API_THUMB_URL + '?path=' + encodeURIComponent(thumbPath);
        parts.push(`
      <div class="thumb" data-src="${fullUrl}" title="${escapeHtml(file)}">
        <img src="${thumbUrl}" data-fallback="${fullUrl}" alt="" loading="lazy">
        <span>${escapeHtml(file)}</span>
      </div>`);
      }
    }
    parts.push('</div></div>');
  }

  galleryEl.innerHTML = parts.join('');

  galleryEl.querySelectorAll('.gallery-back').forEach(el => {
    el.addEventListener('click', () => navigateTo(el.dataset.path));
  });
  galleryEl.querySelectorAll('.breadcrumb-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(el.dataset.path);
    });
  });
  galleryEl.querySelectorAll('.gallery-folder').forEach(el => {
    el.addEventListener('click', () => navigateTo(el.dataset.path));
  });
  galleryEl.querySelectorAll('.thumb').forEach(el => {
    el.addEventListener('click', () => openViewer(el.dataset.src));
    const img = el.querySelector('img');
    if (img && img.dataset.fallback) {
      img.addEventListener('error', () => {
        img.src = img.dataset.fallback;
        img.removeAttribute('data-fallback');
      });
    }
  });
}

async function navigateTo(path) {
  errorEl.style.display = 'none';
  loadingEl.style.display = 'block';
  loadingEl.textContent = 'Lade …';
  try {
    const data = await loadDir(path);
    renderExplorer(data);
  } catch (e) {
    showError(e.message || 'Fehler beim Laden.');
  }
  loadingEl.style.display = 'none';
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// Over/Under-Stereoskopie: Shader zeigt linkes Auge = obere Hälfte, rechtes Auge = untere Hälfte
const panoramaVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const panoramaFragmentShader = `
  #ifdef GL_OVR_multiview2
  #extension GL_OVR_multiview2 : require
  #endif
  precision highp float;
  uniform sampler2D uMap;
  uniform float uViewIndex;
  uniform float uBrightness;
  uniform float uStereoEnabled;
  uniform float uIsStereoscopic;
  varying vec2 vUv;
  void main() {
    float v = 1.0 - vUv.y;
    float texV;
    if (uIsStereoscopic < 0.5) {
      texV = v;
    } else {
      float viewID = uViewIndex;
      #ifdef GL_OVR_multiview2
      viewID = float(gl_ViewID_OVR);
      #endif
      texV = uStereoEnabled > 0.5 ? (v * 0.5 + viewID * 0.5) : (v * 0.5);
    }
    vec4 raw = texture2D(uMap, vec2(1.0 - vUv.x, texV));
    gl_FragColor = vec4(raw.rgb * uBrightness, raw.a);
  }
`;

function createPanoramaMaterial(texture, forVR = false, isStereoscopic = true) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uMap: { value: texture },
      uViewIndex: { value: 0 },
      uBrightness: { value: 1 },
      uStereoEnabled: { value: 1 },
      uIsStereoscopic: { value: isStereoscopic ? 1 : 0 }
    },
    vertexShader: panoramaVertexShader,
    fragmentShader: panoramaFragmentShader,
    extensions: forVR ? { multiview: true } : undefined
  });
  return mat;
}

function initViewer() {
  scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(2, 5, 3);
  scene.add(dirLight);
  camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2000);
  camera.position.set(0, 0, 0);
  scene.add(camera);

  const geometry = new THREE.SphereGeometry(1000, 64, 40);
  const material = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
  mesh = new THREE.Mesh(geometry, material);
  mesh.onBeforeRender = function (rend, sc, cam) {
    if (rend.xr && rend.xr.isPresenting && mesh.material.uniforms && mesh.material.uniforms.uViewIndex) {
      if (cam.parent && cam.parent.isArrayCamera) {
        mesh.material.uniforms.uViewIndex.value = cam.parent.cameras.indexOf(cam);
      } else {
        mesh.material.uniforms.uViewIndex.value = xrViewCounter % 2;
        xrViewCounter += 1;
      }
    }
  };
  scene.add(mesh);

  modelGroup = new THREE.Group();
  modelGroup.name = 'modelGroup';
  scene.add(modelGroup);

  renderer = new THREE.WebGLRenderer({ canvas: viewerCanvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x1a1a1a, 1);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local-floor');

  controller1 = renderer.xr.getController(0);
  controller2 = renderer.xr.getController(1);
  [controller1, controller2].forEach((c) => {
    c.visible = false;
    const rayGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -2.5)]);
    const rayMat = new THREE.LineBasicMaterial({ color: 0x00ff88 });
    const ray = new THREE.Line(rayGeo, rayMat);
    ray.name = 'ray';
    c.add(ray);
    const dotGeo = new THREE.SphereGeometry(0.02, 8, 6);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(0, 0, -2.5);
    dot.name = 'cursor';
    c.add(dot);
    scene.add(c);
  });

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.5;
  controls.minDistance = 0.01;
  controls.maxDistance = 0.01;
  controls.enablePan = false;
  controls.enableZoom = false;

  window.addEventListener('resize', onViewerResize);

  btnClose.addEventListener('click', closeViewer);
  btnVr.addEventListener('click', toggleVR);
  ensureVRStereoButton();
}

function onViewerResize() {
  if (!viewerWrap.classList.contains('active')) return;
  const w = viewerCanvas.clientWidth;
  const h = viewerCanvas.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

const MAX_TEXTURE_DIM = 3840;

function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const path = url.split('?')[0];
  const ext = path.toLowerCase().slice(path.lastIndexOf('.'));
  return VIDEO_EXTENSIONS.includes(ext);
}

function loadVideoTexture(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = false;
    video.playsInline = true;
    video.addEventListener('loadeddata', () => {
      const tex = new THREE.VideoTexture(video);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      currentVideoElement = video;
      video.play()
        .then(() => resolve(tex))
        .catch(() => {
          video.muted = true;
          video.play().then(() => resolve(tex)).catch(reject);
        });
    }, { once: true });
    video.addEventListener('error', () => reject(new Error('Video konnte nicht geladen werden')), { once: true });
    video.src = url;
  });
}

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(url, (tex) => {
      const img = tex.image;
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if (w <= MAX_TEXTURE_DIM && h <= MAX_TEXTURE_DIM) {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false;
        resolve(tex);
        return;
      }
      const scale = Math.min(MAX_TEXTURE_DIM / w, MAX_TEXTURE_DIM / h, 1);
      const cw = Math.max(1, Math.floor(w * scale));
      const ch = Math.max(1, Math.floor(h * scale));
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, cw, ch);
      tex.dispose();
      const scaledTex = new THREE.CanvasTexture(canvas);
      scaledTex.colorSpace = THREE.SRGBColorSpace;
      scaledTex.flipY = false;
      resolve(scaledTex);
    }, undefined, reject);
  });
}

async function openViewer(mediaUrl) {
  if (!scene) initViewer();
  viewerWrap.classList.add('active');
  onViewerResize();

  if (isModelUrl(mediaUrl)) {
    await openModelViewer(mediaUrl);
    return;
  }

  hideViewerMessage();
  hideViewerError();
  viewerMode = 'panorama';
  if (modelGroup) {
    modelGroup.remove(...modelGroup.children);
    modelGroup.visible = false;
  }
  mesh.visible = true;
  controls.enableZoom = false;
  controls.minDistance = 0.01;
  controls.maxDistance = 0.01;

  if (currentVideoElement) {
    currentVideoElement.pause();
    currentVideoElement.src = '';
    currentVideoElement = null;
  }
  if (currentTexture) {
    currentTexture.dispose();
    currentTexture = null;
  }
  try {
    if (isVideoUrl(mediaUrl)) {
      currentTexture = await loadVideoTexture(mediaUrl);
      currentIsStereoscopic = false;
    } else {
      currentTexture = await loadTexture(mediaUrl);
      currentIsStereoscopic = true;
    }
    applyPanoramaMaterial(currentTexture);
  } catch (e) {
    console.error('Medien-Fehler:', e);
  }

  controls.reset();
  const vrSupported = navigator.xr && await navigator.xr.isSessionSupported('immersive-vr');
  btnVr.disabled = !vrSupported;
  updateXRButtonLabel();
  if (renderer.xr.isPresenting) {
    renderer.xr.getSession().end();
  }
  animate();
}

function loadModel(url) {
  const path = url.split('?')[0].toLowerCase();
  if (path.endsWith('.obj')) {
    return new Promise((resolve, reject) => {
      const loader = new OBJLoader();
      loader.load(url, (group) => resolve(group), undefined, (err) => reject(err || new Error('OBJ konnte nicht geladen werden')));
    });
  }
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, (err) => reject(err || new Error('Modell konnte nicht geladen werden')));
  });
}

/** Skaliert das Modell so, dass die größte Ausdehnung (x, y oder z) maxDimensionMeters beträgt (z. B. 0.5 m). Pivot liegt im Modellzentrum. */
function fitModelInView(group, maxDimensionMeters = 0.5) {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const scale = maxDimensionMeters / maxDim;
  if (Number.isFinite(scale) && scale > 0) {
    for (let i = 0; i < group.children.length; i++) {
      group.children[i].position.sub(center);
    }
    group.scale.setScalar(scale);
  }
  group.updateMatrixWorld(true);
}

async function openModelViewer(modelUrl) {
  if (!scene) initViewer();
  viewerWrap.classList.add('active');
  onViewerResize();

  viewerMode = 'model';
  if (currentVideoElement) {
    currentVideoElement.pause();
    currentVideoElement.src = '';
    currentVideoElement = null;
  }
  if (currentTexture) {
    currentTexture.dispose();
    currentTexture = null;
  }
  mesh.visible = false;
  if (modelGroup) {
    modelGroup.remove(...modelGroup.children);
    modelGroup.position.set(0, 0, 0);
    modelGroup.quaternion.identity();
    modelGroup.scale.setScalar(1);
    modelGroup.visible = true;
  }
  controls.enableZoom = true;
  controls.minDistance = 0.3;
  controls.maxDistance = 50;
  controls.target.set(0, 0, 0);
  camera.position.set(0, 0, 4);
  controls.update();

  hideViewerError();
  try {
    showViewerMessage('Lade Modell …');
    const absoluteModelUrl = new URL(modelUrl, window.location.href).href;
    const model = await loadModel(absoluteModelUrl);
    hideViewerMessage();
    modelGroup.add(model);
    fitModelInView(modelGroup);
  } catch (e) {
    hideViewerMessage();
    console.error('Modell-Fehler:', e);
    showViewerError('Modell konnte nicht geladen werden. Prüfen Sie die Adresse und ob die Datei existiert.');
  }

  controls.reset();
  const arSupported = navigator.xr && await navigator.xr.isSessionSupported('immersive-ar');
  btnVr.disabled = !arSupported;
  updateXRButtonLabel();
  if (renderer.xr.isPresenting) {
    renderer.xr.getSession().end();
  }
  animate();
}

function updateXRButtonLabel() {
  if (!btnVr) return;
  if (viewerMode === 'model') {
    btnVr.textContent = 'AR starten';
  } else {
    btnVr.textContent = 'VR starten';
  }
}

function applyPanoramaMaterial(texture) {
  const wasVR = renderer.xr && renderer.xr.isPresenting;
  if (mesh.material.dispose) mesh.material.dispose();
  mesh.material = createPanoramaMaterial(texture, wasVR, currentIsStereoscopic);
}

function closeViewer() {
  viewerWrap.classList.remove('active');
  hideViewerMessage();
  hideViewerError();
  if (viewerMode === 'model' && modelGroup) {
    modelGroup.remove(...modelGroup.children);
    modelGroup.visible = false;
    mesh.visible = true;
    controls.enableZoom = false;
    controls.minDistance = 0.01;
    controls.maxDistance = 0.01;
    vrGrabbedController = null;
    vrGrabWorldQuat = null;
    vrGrabControllerWorldQuat = null;
    vrPendingGrab = false;
  }
  viewerMode = 'panorama';
  if (currentVideoElement) {
    currentVideoElement.pause();
    currentVideoElement.src = '';
    currentVideoElement = null;
  }
  if (renderer.xr.isPresenting) {
    renderer.xr.getSession().end();
  }
  cancelAnimation();
}

let animId = null;
function animate() {
  if (animId !== null) return;
  function loop() {
    animId = requestAnimationFrame(loop);
    if (!viewerWrap.classList.contains('active')) {
      cancelAnimation();
      return;
    }
    controls.update();
    renderer.render(scene, camera);
  }
  loop();
}

function cancelAnimation() {
  if (animId !== null) {
    cancelAnimationFrame(animId);
    animId = null;
  }
}

function createVRStereoButton() {
  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  function drawLabel(stereo) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.fillStyle = '#e4e4e7';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stereo ? '3D' : '2D', w / 2, h / 2);
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(stereo ? 'Tippen: 2D' : 'Tippen: 3D', w / 2, h - 28);
  }
  drawLabel(true);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(0.32, 0.16);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
    depthTest: true,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = false;
  mesh.position.set(0, 1.5, -1.5);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1000;
  mesh.userData = { updateLabel: drawLabel, canvasTex: tex };
  return mesh;
}

function ensureVRStereoButton() {
  if (!vrButtonMesh && scene) {
    vrButtonMesh = createVRStereoButton();
    scene.add(vrButtonMesh);
    vrRaycaster = new THREE.Raycaster();
    vrRaycaster.firstHitOnly = true;
  }
  return vrButtonMesh;
}

function updateVRButtonLabel() {
  if (vrButtonMesh && vrButtonMesh.userData.updateLabel) {
    vrButtonMesh.userData.updateLabel(vrStereoEnabled);
    if (vrButtonMesh.userData.canvasTex) vrButtonMesh.userData.canvasTex.needsUpdate = true;
  }
}

function toggleVR() {
  if (!navigator.xr || renderer.xr.isPresenting) {
    if (renderer.xr.isPresenting) renderer.xr.getSession().end();
    return;
  }
  cancelAnimation();
  const useAR = viewerMode === 'model';
  const sessionMode = useAR ? 'immersive-ar' : 'immersive-vr';
  const sessionOptions = { optionalFeatures: ['local-floor'] };
  navigator.xr.requestSession(sessionMode, sessionOptions)
    .then(session => {
      xrSession = session;
      if (useAR) {
        renderer.setClearColor(0x000000, 0);
        arModelPositionedOnce = false;
      }
      if (viewerMode === 'panorama' && currentTexture) {
        if (mesh.material.dispose) mesh.material.dispose();
        mesh.material = createPanoramaMaterial(currentTexture, true, currentIsStereoscopic);
        if (mesh.material.uniforms.uStereoEnabled) mesh.material.uniforms.uStereoEnabled.value = vrStereoEnabled ? 1 : 0;
      }
      const onSessionEnd = () => {
        session.removeEventListener('select', onSelect);
        session.removeEventListener('selectstart', onSelectStart);
        session.removeEventListener('selectend', onSelectEnd);
        session.removeEventListener('end', onSessionEnd);
        if (vrButtonMesh) vrButtonMesh.visible = false;
        if (controller1) controller1.visible = false;
        if (controller2) controller2.visible = false;
        xrSession = null;
        vrGrabbedController = null;
        vrGrabWorldQuat = null;
        vrGrabControllerWorldQuat = null;
        vrPendingGrab = false;
        arModelPositionedOnce = false;
        renderer.setClearColor(0x1a1a1a, 1);
        if (viewerMode === 'panorama' && currentTexture) {
          if (mesh.material.dispose) mesh.material.dispose();
          mesh.material = createPanoramaMaterial(currentTexture, false, currentIsStereoscopic);
        }
        renderer.xr.setAnimationLoop(null);
        animId = null;
        if (viewerWrap.classList.contains('active')) animate();
      };
      const onSelect = (e) => {
        vrPendingSelect = true;
        vrPendingSelectSource = e && e.inputSource ? e.inputSource : null;
      };
      const onSelectStart = () => {
        if (viewerMode === 'model' && modelGroup && modelGroup.visible) vrPendingGrab = true;
      };
      const onSelectEnd = () => {
        if (viewerMode === 'model' && vrGrabbedController && modelGroup) {
          const pos = new THREE.Vector3();
          const quat = new THREE.Quaternion();
          const scale = new THREE.Vector3();
          modelGroup.getWorldPosition(pos);
          modelGroup.getWorldQuaternion(quat);
          modelGroup.getWorldScale(scale);
          modelGroup.parent = scene;
          modelGroup.position.copy(pos);
          modelGroup.quaternion.copy(quat);
          modelGroup.scale.copy(scale);
          vrGrabbedController = null;
          vrGrabWorldQuat = null;
          vrGrabControllerWorldQuat = null;
        }
      };
      session.addEventListener('select', onSelect);
      session.addEventListener('selectstart', onSelectStart);
      session.addEventListener('selectend', onSelectEnd);
      session.addEventListener('end', onSessionEnd);
      renderer.xr.setSession(session);
      session.requestReferenceSpace('local-floor').then((refSpace) => {
        xrReferenceSpace = refSpace;
      }).catch(() => {});
      const btn = ensureVRStereoButton();
      if (btn) btn.visible = true;
      if (controller1) controller1.visible = true;
      if (controller2) controller2.visible = true;
      renderer.xr.setAnimationLoop((time, frame) => {
        vrCurrentFrame = frame;
        const refSpace = xrReferenceSpace || renderer.xr.getReferenceSpace();
        const pose = refSpace && frame ? frame.getViewerPose(refSpace) : null;
        if (viewerMode === 'model' && vrGrabbedController && modelGroup && vrGrabWorldQuat && vrGrabControllerWorldQuat) {
          const c = vrGrabbedController;
          const currentCQuat = c.getWorldQuaternion(new THREE.Quaternion());
          const controllerDelta = currentCQuat.clone().multiply(vrGrabControllerWorldQuat.clone().invert());
          const modelWorldQuat = vrGrabWorldQuat.clone().multiply(controllerDelta);
          modelGroup.quaternion.copy(c.getWorldQuaternion(currentCQuat).invert()).multiply(modelWorldQuat);
        }
        if (pose && viewerMode === 'model' && modelGroup && modelGroup.visible && !arModelPositionedOnce) {
          arModelPositionedOnce = true;
          const pos = pose.transform.position;
          const ori = pose.transform.orientation;
          const q = new THREE.Quaternion(ori.x, ori.y, ori.z, ori.w);
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
          const dist = 1.2;
          modelGroup.position.set(
            pos.x + forward.x * dist,
            pos.y + forward.y * dist - 0.2,
            pos.z + forward.z * dist
          );
        }
        if (pose && btn) {
          btn.visible = viewerMode === 'panorama';
          const pos = pose.transform.position;
          const ori = pose.transform.orientation;
          const q = new THREE.Quaternion(ori.x, ori.y, ori.z, ori.w);
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
          btn.position.set(pos.x + forward.x * 1.4, pos.y + forward.y * 1.4 - 0.85, pos.z + forward.z * 1.4);
          btn.lookAt(pos.x, pos.y, pos.z);
        }
        if (vrPendingSelect && frame && refSpace && vrRaycaster && btn) {
          vrPendingSelect = false;
          const sources = vrPendingSelectSource
            ? [vrPendingSelectSource]
            : (session.inputSources || []).filter(s => (s.targetRayMode === 'tracked-pointer' || s.targetRayMode === 'tracked') && s.targetRaySpace);
          vrPendingSelectSource = null;
          for (const source of sources) {
            const rayPose = frame.getPose(source.targetRaySpace, refSpace);
            if (!rayPose) continue;
            const origin = new THREE.Vector3(rayPose.transform.position.x, rayPose.transform.position.y, rayPose.transform.position.z);
            const ori = rayPose.transform.orientation;
            const q = new THREE.Quaternion(ori.x, ori.y, ori.z, ori.w);
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(q).normalize();
            vrRaycaster.set(origin, dir);
            const hits = vrRaycaster.intersectObject(btn, true);
            if (hits.length > 0) {
              vrStereoEnabled = !vrStereoEnabled;
              if (mesh.material.uniforms && mesh.material.uniforms.uStereoEnabled) {
                mesh.material.uniforms.uStereoEnabled.value = vrStereoEnabled ? 1 : 0;
              }
              updateVRButtonLabel();
              break;
            }
          }
        }
        if (vrPendingGrab && viewerMode === 'model' && modelGroup && modelGroup.visible && vrRaycaster && controller1 && controller2) {
          vrPendingGrab = false;
          for (const c of [controller1, controller2]) {
            const origin = new THREE.Vector3();
            const dir = new THREE.Vector3(0, 0, -1);
            c.getWorldPosition(origin);
            c.getWorldDirection(dir).negate();
            vrRaycaster.set(origin, dir);
            const hits = vrRaycaster.intersectObject(modelGroup, true);
            if (hits.length > 0) {
              const hit = hits[0];
              const localGrab = hit.point.clone();
              modelGroup.worldToLocal(localGrab);
              const worldQuat = modelGroup.getWorldQuaternion(new THREE.Quaternion());
              const worldScale = modelGroup.getWorldScale(new THREE.Vector3());
              modelGroup.parent = c;
              modelGroup.scale.copy(worldScale);
              vrGrabWorldQuat = worldQuat.clone();
              vrGrabControllerWorldQuat = c.getWorldQuaternion(new THREE.Quaternion()).clone();
              modelGroup.quaternion.copy(vrGrabControllerWorldQuat.clone().invert()).multiply(vrGrabWorldQuat);
              const grabOffset = localGrab.clone().multiply(modelGroup.scale).applyQuaternion(modelGroup.quaternion).negate();
              modelGroup.position.copy(grabOffset);
              vrGrabbedController = c;
              break;
            }
          }
        }
        xrViewCounter = 0;
        if (viewerMode === 'model') controls.update();
        renderer.render(scene, camera);
      });
    })
    .catch(err => {
      console.error('VR Session fehlgeschlagen:', err);
      alert('VR konnte nicht gestartet werden. Bitte VR-Brille verbinden und Seite ggf. über HTTPS aufrufen.');
    });
}

async function refreshGallery() {
  if (!btnRefresh) return;
  btnRefresh.disabled = true;
  errorEl.style.display = 'none';
  emptyEl.style.display = 'none';
  loadingEl.style.display = 'block';
  loadingEl.textContent = 'Aktualisiere …';
  try {
    await navigateTo(galleryCurrentPath);
  } catch (e) {
    showError(e.message || 'Fehler beim Aktualisieren.');
  }
  btnRefresh.disabled = false;
  loadingEl.style.display = 'none';
}

async function uploadPhoto(file) {
  const form = new FormData();
  form.append('foto', file);
  const res = await fetch(API_UPLOAD_URL, { method: 'POST', body: form });
  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch (_) {
    if (res.status === 404) throw new Error('Upload-URL nicht gefunden (404). Ist api/upload-foto.php auf dem Server?');
    if (res.status === 413) throw new Error('Datei zu groß für den Server (413).');
    if (res.status >= 500) throw new Error('Server-Fehler (' + res.status + '). PHP-Log prüfen.');
    throw new Error('Server antwortet nicht mit JSON (Status ' + res.status + ').');
  }
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Upload fehlgeschlagen.');
  }
  return data.file;
}

async function onUploadFiles(files) {
  if (!files || !files.length) return;
  if (btnUpload) {
    btnUpload.setAttribute('aria-busy', 'true');
    btnUpload.style.pointerEvents = 'none';
    btnUpload.style.opacity = '0.6';
  }
  errorEl.style.display = 'none';
  let ok = 0;
  let errMsg = null;
  for (let i = 0; i < files.length; i++) {
    try {
      await uploadPhoto(files[i]);
      ok += 1;
    } catch (e) {
      errMsg = e.message;
    }
  }
  if (btnUpload) {
    btnUpload.removeAttribute('aria-busy');
    btnUpload.style.pointerEvents = '';
    btnUpload.style.opacity = '';
  }
  if (uploadInput) uploadInput.value = '';
  if (ok > 0) await navigateTo(galleryCurrentPath || '');
  if (errMsg) showError(errMsg);
  else if (ok > 0 && ok < files.length) showError('Einige Dateien konnten nicht hochgeladen werden.');
}

async function main() {
  if (btnRefresh) btnRefresh.addEventListener('click', refreshGallery);
  if (uploadInput) {
    uploadInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files && files.length) onUploadFiles(Array.from(files));
    });
  }
  try {
    await navigateTo('');
  } catch (e) {
    showError(e.message || 'Fehler beim Laden der Galerie.');
  }
}

main();
