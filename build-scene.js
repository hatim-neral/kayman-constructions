/*
 * Build story: a 3D construction site, driven by scroll.
 * createScene(canvas) returns { update(p) } where p runs 0..1:
 *   0.00 survey  0.10 blueprint  0.20 permit  0.27 slab pour  0.36 walls tilt up
 *   0.50 crane sets roof trusses  0.74 sheathing, siding and roof  0.86 lights on at dusk
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const ASSETS = new URL('assets/', import.meta.url).href;
const LITE = window.innerWidth < 800 || (navigator.hardwareConcurrency || 8) <= 4; // phones: skip the heavy effects

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const ease = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

const TEX_NAMES = ['raked_dirt', 'leafy_grass', 'brushed_concrete', 'asphalt_02', 'plywood', 'coated_pine', 'weathered_plank_siding', 'grey_roof_tiles'];
export async function createScene(canvas) {
  const loader = new THREE.TextureLoader();
  const TEX = {};
  await Promise.all(TEX_NAMES.flatMap(n => ['diff', 'nor', 'rough'].map(async k => {
    const t = await loader.loadAsync(`${ASSETS}tex/${n}_${k}.jpg`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    if (k === 'diff') t.colorSpace = THREE.SRGBColorSpace;
    TEX[`${n}_${k}`] = t;
  })));
  return buildScene(canvas, TEX);
}

function buildScene(canvas, TEX) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.3, 3000);
  const DAY = new THREE.Color('#A9CBE3'), DUSK = new THREE.Color('#E59A6B'), NIGHT = new THREE.Color('#3A3550');
  scene.background = DAY.clone();
  scene.fog = new THREE.Fog(DAY.clone(), 60, 170);

  // physically based sky: real atmospheric scattering, and the sun sets for the finale
  const sky = new Sky(); sky.scale.setScalar(2500); scene.add(sky);
  Object.assign(sky.material.uniforms, {});
  sky.material.uniforms.turbidity.value = 3.2;
  sky.material.uniforms.rayleigh.value = 2.2;
  sky.material.uniforms.mieCoefficient.value = 0.004;
  sky.material.uniforms.mieDirectionalG.value = 0.82;
  const sunDir = new THREE.Vector3();
  const setSun = (elevationDeg, azimuthDeg) => {
    sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elevationDeg), THREE.MathUtils.degToRad(azimuthDeg));
    sky.material.uniforms.sunPosition.value.copy(sunDir);
  };

  /* ---------- materials and textures ---------- */

  const tex = (w, h, draw, repeat) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    if (repeat) t.repeat.set(...repeat);
    return t;
  };
  const speckle = (base, dots, n) => (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      g.fillStyle = dots[i % dots.length];
      g.globalAlpha = 0.25 + Math.random() * 0.5;
      const r = Math.random() * 2.2;
      g.fillRect(Math.random() * w, Math.random() * h, r, r);
    }
    g.globalAlpha = 1;
  };
  const dirtTex = tex(256, 256, speckle('#8C7356', ['#6E5940', '#A68C6C', '#5C4A35'], 3500), [10, 10]);
  const grassTex = tex(256, 256, speckle('#5F7F3A', ['#4C6A2C', '#77984A', '#3F5A25'], 4000), [40, 40]);
  const osbTex = tex(256, 256, (g, w, h) => {
    g.fillStyle = '#C9A46A'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = ['#B8925A', '#D9B67E', '#A9844E'][i % 3];
      g.save(); g.translate(Math.random() * w, Math.random() * h); g.rotate(Math.random() * Math.PI);
      g.fillRect(-9, -2.5, 18, 5); g.restore();
    }
  });
  const sidingTex = tex(64, 64, (g, w, h) => {
    g.fillStyle = '#EEEAE2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#CFCAC0'; g.fillRect(0, h - 5, w, 5);
    g.fillStyle = '#F7F4EE'; g.fillRect(0, 0, w, 3);
  });
  const shingleTex = tex(128, 64, (g, w, h) => {
    g.fillStyle = '#3B3D42'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 4; row++) {
      const y = row * 16, off = row % 2 ? 16 : 0;
      g.fillStyle = '#2A2C30'; g.fillRect(0, y + 14, w, 2);
      for (let x = -off; x < w; x += 32) { g.fillStyle = '#26282C'; g.fillRect(x, y, 2, 16); }
      for (let i = 0; i < 40; i++) { g.fillStyle = Math.random() > 0.5 ? '#45484E' : '#33353A'; g.fillRect(Math.random() * w, y + Math.random() * 14, 2, 2); }
    }
  });

  const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });
  const mat = {
    dirt: M('#ffffff', { map: dirtTex, roughness: 1 }),
    grass: M('#ffffff', { map: grassTex, roughness: 1 }),
    gravel: M('#9C9A94', { roughness: 1 }),
    concrete: M('#A9A7A1', { roughness: 0.95 }),
    wetConcrete: M('#6F6D69', { roughness: 0.35 }),
    lumber: M('#D8B47C', { roughness: 0.8 }),
    lumberDark: M('#B8915A', { roughness: 0.8 }),
    osb: M('#ffffff', { map: osbTex, roughness: 0.9 }),
    siding: M('#ffffff', { map: sidingTex, roughness: 0.7 }),
    trim: M('#F7F5F0', { roughness: 0.6 }),
    shingle: M('#ffffff', { map: shingleTex, roughness: 0.95 }),
    glass: M('#2B3A4A', { roughness: 0.08, metalness: 0.3, emissive: new THREE.Color('#FFB866'), emissiveIntensity: 0 }),
    door: M('#3B2A20', { roughness: 0.6 }),
    crane: M('#F2B705', { roughness: 0.55, metalness: 0.25 }),
    craneDark: M('#2B2D31', { roughness: 0.7, metalness: 0.3 }),
    steel: M('#7D8288', { roughness: 0.4, metalness: 0.8 }),
    cable: M('#1E1F22', { roughness: 0.5, metalness: 0.6 }),
    white: M('#F2F2EF', { roughness: 0.6 }),
    red: M('#D23B2A', { roughness: 0.6 }),
    beacon: M('#FF2A1A', { emissive: new THREE.Color('#FF2A1A'), emissiveIntensity: 0.3 }),
    orange: M('#FF6A13', { roughness: 0.6 }),
    blue: M('#2F64B8', { roughness: 0.6 }),
    green: M('#3E6B3A', { roughness: 0.8 }),
    skin: M('#C68E62'),
    vest: M('#C6F02C', { emissive: new THREE.Color('#5A6E10'), emissiveIntensity: 0.15 }),
    jeans: M('#3A4A63'),
    hat: M('#F2B705', { roughness: 0.4 }),
    blueprint: new THREE.LineBasicMaterial({ color: '#7FD3FF', transparent: true, opacity: 0 }),
    tree: M('#4E7034', { roughness: 1 }),
    trunk: M('#5B4330'),
  };

  // photo-scanned surfaces (Poly Haven, CC0)
  const pbr = (name, o = {}) => ({ map: TEX[name + '_diff'], normalMap: TEX[name + '_nor'], roughnessMap: TEX[name + '_rough'], ...o });
  const withRepeat = (material, rx, ry) => {
    const m = material.clone();
    for (const k of ['map', 'normalMap', 'roughnessMap']) if (m[k]) { m[k] = m[k].clone(); m[k].repeat.set(rx, ry); m[k].needsUpdate = true; }
    return m;
  };
  Object.assign(mat.dirt, pbr('raked_dirt', { color: new THREE.Color('#ffffff'), roughness: 1 }));
  mat.dirt.map = TEX.raked_dirt_diff.clone(); mat.dirt.map.repeat.set(5, 4); mat.dirt.map.needsUpdate = true;
  mat.dirt.normalMap = TEX.raked_dirt_nor.clone(); mat.dirt.normalMap.repeat.set(5, 4); mat.dirt.normalMap.needsUpdate = true;
  Object.assign(mat.concrete, pbr('brushed_concrete', { color: new THREE.Color('#d8d4cc'), roughness: 1 }));
  Object.assign(mat.wetConcrete, pbr('brushed_concrete', { color: new THREE.Color('#8a8781'), roughness: 0.45 }));
  for (const k of ['lumber', 'lumberDark']) Object.assign(mat[k], { normalMap: TEX.coated_pine_nor, roughnessMap: TEX.coated_pine_rough, color: new THREE.Color(k === 'lumber' ? '#E3C597' : '#C9A673'), roughness: 1 });
  Object.assign(mat.osb, pbr('plywood', { color: new THREE.Color('#ffffff'), roughness: 1 }));
  Object.assign(mat.siding, { map: null, normalMap: TEX.weathered_plank_siding_nor, roughnessMap: TEX.weathered_plank_siding_rough, color: new THREE.Color('#EEEBE4'), roughness: 0.9, normalScale: new THREE.Vector2(1.4, 1.4) });
  Object.assign(mat.shingle, pbr('grey_roof_tiles', { color: new THREE.Color('#c9cbd0'), roughness: 1 }));

  /* ---------- helpers ---------- */

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 8);
  const shadow = o => { o.castShadow = true; o.receiveShadow = true; return o; };
  const box = (parent, material, w, h, d, x, y, z) => {
    const m = shadow(new THREE.Mesh(unitBox, material));
    m.scale.set(w, h, d); m.position.set(x, y, z); parent.add(m); return m;
  };
  // collects many boxes/struts into one instanced mesh
  class Batch {
    constructor(geo, material) { this.geo = geo; this.material = material; this.list = []; }
    box(w, h, d, x, y, z, q = new THREE.Quaternion()) {
      this.list.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(w, h, d)));
    }
    strut(a, b, r) {
      const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
      this.list.push(new THREE.Matrix4().compose(mid, q, new THREE.Vector3(r, len, r)));
    }
    build(parent) {
      const im = shadow(new THREE.InstancedMesh(this.geo, this.material, this.list.length));
      this.list.forEach((m, i) => im.setMatrixAt(i, m));
      parent.add(im); return im;
    }
  }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  /* ---------- lights ---------- */

  const hemi = new THREE.HemisphereLight('#DCEBFF', '#6B5A44', 1.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#FFF1DC', 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 120 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const interior = new THREE.PointLight('#FFB45E', 0, 14, 1.5);
  interior.position.set(0, 1.6, 0);
  scene.add(interior);
  const porch = new THREE.PointLight('#FFC27A', 0, 8, 1.6);
  porch.position.set(0.6, 2.6, 4.6);
  scene.add(porch);

  /* ---------- ground and surroundings (kept clean) ---------- */

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSky = new Sky(); envSky.scale.setScalar(1000); envScene.add(envSky);
  for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) envSky.material.uniforms[k].value = sky.material.uniforms[k].value;
  const envGround = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshBasicMaterial({ color: '#5d6b45' }));
  envGround.rotation.x = -Math.PI / 2; envGround.position.y = -1; envScene.add(envGround);
  const envFor = (elev, az) => {
    envSky.material.uniforms.sunPosition.value.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elev), THREE.MathUtils.degToRad(az));
    return pmrem.fromScene(envScene, 0.02).texture;
  };
  const ENV_DAY = envFor(38, 200), ENV_DUSK = envFor(3, 250);
  scene.environment = ENV_DAY;
  scene.environmentIntensity = 0.7;
  hemi.intensity = 0.25;

  const lawnTex = tex(256, 256, speckle('#6E9145', ['#628640', '#7A9D50', '#5B7C3A'], 2200), [60, 60]);
  const lawnMat = withRepeat(M('#B7CC8C', pbr('leafy_grass', { roughness: 1 })), 90, 90);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), lawnMat);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(26, 22), mat.dirt);
  pad.rotation.x = -Math.PI / 2; pad.position.set(1, 0.01, 0.5); pad.receiveShadow = true; scene.add(pad);
  // the bare lot turns into finished lawn at the end
  const newLawnMat = withRepeat(M('#B7CC8C', pbr('leafy_grass', { roughness: 1, transparent: true, opacity: 0 })), 6, 5);
  const newLawn = new THREE.Mesh(new THREE.PlaneGeometry(26, 22), newLawnMat);
  newLawn.rotation.x = -Math.PI / 2; newLawn.position.set(1, 0.02, 0.5); newLawn.receiveShadow = true; scene.add(newLawn);

  const street = new THREE.Mesh(new THREE.PlaneGeometry(400, 8), withRepeat(M('#9a9a9a', pbr('asphalt_02', { roughness: 1 })), 100, 2));
  street.rotation.x = -Math.PI / 2; street.position.set(0, 0.012, 20); street.receiveShadow = true; scene.add(street);
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(400, 0.15), M('#E8E3D2'));
  lane.rotation.x = -Math.PI / 2; lane.position.set(0, 0.02, 20); scene.add(lane);
  for (const z of [15.6, 24.4]) {
    box(scene, withRepeat(mat.concrete, 200, 1), 400, 0.06, 1.6, 0, 0.03, z + (z < 20 ? -0.9 : 0.9)); // sidewalk
    box(scene, M('#B5B2AB'), 400, 0.16, 0.2, 0, 0.08, z);                                           // curb
  }
  const drive = box(scene, withRepeat(mat.concrete, 1.5, 4), 5.2, 0.05, 11.4, 8, 0.025, 9.9);

  // a few finished homes as neighbours, built properly but kept quiet
  const roofMat = M('#4B4F57', { roughness: 0.9 });
  const houseColors = ['#E9E4DA', '#D8CDBD', '#C9D0D2', '#E2D9C9'].map(c => withRepeat(M(c, { normalMap: TEX.weathered_plank_siding_nor, roughnessMap: TEX.weathered_plank_siding_rough, roughness: 0.9 }), 5, 1.5));
  const hip = (w, d, h) => {
    const g = new THREE.BufferGeometry();
    const hw = w / 2, hd = d / 2, r = Math.max(0, hw - hd);
    const v = [-hw, 0, -hd, hw, 0, -hd, hw, 0, hd, -hw, 0, hd, -r, h, 0, r, h, 0];
    const idx = [0, 4, 1, 1, 4, 5, 1, 5, 2, 2, 5, 4, 2, 4, 3, 3, 4, 0];
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  };
  const trimMat = M('#F4F2EC', { roughness: 0.6 });
  const shutterCols = ['#2E3A44', '#3B4A3A', '#5A2E2A', '#2B2D31'].map(c => M(c, { roughness: 0.6 }));
  const roofCols = ['#4B4F57', '#5A5048', '#3E4248'].map(c => M(c, { roughness: 0.9 }));
  const garageDoorMat = M('#F1EFEA', { roughness: 0.5 });
  const neighbor = (x, z, ry, ci, opts = {}) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    const H = opts.two ? 5.6 : 2.9, wallMat = houseColors[ci % houseColors.length];
    box(g, M('#A8A49C'), 10.3, 0.3, 7.3, 0, 0.15, 0);
    box(g, wallMat, 10, H, 7, 0, 0.3 + H / 2, 0);
    const rf = shadow(new THREE.Mesh(hip(11, 8, 2.3), roofCols[ci % 3])); rf.position.y = 0.3 + H; g.add(rf);
    box(g, trimMat, 10.4, 0.18, 7.4, 0, 0.3 + H, 0);
    const shut = shutterCols[(ci + 1) % 4];
    const rows = opts.two ? [1.75, 4.45] : [1.75];
    for (const wy of rows) for (const wx of [-3, 3]) {
      if (wy === 1.75 && wx === -3 && opts.bay) continue;
      box(g, trimMat, 1.5, 1.5, 0.08, wx, wy, 3.52);
      box(g, mat.glass, 1.3, 1.3, 0.06, wx, wy, 3.56);
      box(g, trimMat, 0.05, 1.3, 0.07, wx, wy, 3.58); box(g, trimMat, 1.3, 0.05, 0.07, wx, wy, 3.58);
      box(g, shut, 0.38, 1.5, 0.06, wx - 0.98, wy, 3.54); box(g, shut, 0.38, 1.5, 0.06, wx + 0.98, wy, 3.54);
    }
    if (opts.bay) { box(g, wallMat, 2.6, 1.8, 0.8, -3, 1.6, 3.9); box(g, mat.glass, 2.3, 1.3, 0.06, -3, 1.7, 4.32); box(g, roofCols[ci % 3], 2.8, 0.15, 1.0, -3, 2.55, 3.9); }
    box(g, mat.door, 1, 2.1, 0.08, 0, 1.35, 3.52);
    box(g, trimMat, 1.2, 0.12, 0.1, 0, 2.45, 3.54);
    // attached garage with a sectional door, and a driveway to the street
    const gx = opts.garageLeft ? -8.2 : 8.2;
    box(g, wallMat, 6.4, 2.8, 7, gx, 1.7, 0);
    const grf = shadow(new THREE.Mesh(hip(7, 7.6, 1.6), roofCols[ci % 3])); grf.position.set(gx, 3.1, 0); g.add(grf);
    box(g, garageDoorMat, 4.8, 2.2, 0.06, gx, 1.4, 3.52);
    for (let k = 1; k < 4; k++) box(g, M('#D9D6CF'), 4.8, 0.03, 0.08, gx, 0.3 + k * 0.55, 3.56);
    const dw = box(g, withRepeat(mat.concrete, 1.5, 3), 5.2, 0.04, 14, gx, 0.02, 10.5);
    for (const sx of [-4, -2, 2]) { const b = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), M('#3F6B35'))); b.userData.shrub = 1.2; b.position.set(sx, 0.4, 4.3); g.add(b); }
    box(g, M('#2A2B2E'), 0.08, 1.1, 0.08, gx + 3.2, 0.55, 15.6); box(g, M('#2A2B2E'), 0.24, 0.24, 0.45, gx + 3.2, 1.18, 15.6);
    return g;
  };
  // same side of the street (facing it) and across the street
  neighbor(-26, 3, 0, 0, { garageLeft: true }); neighbor(30, 3, 0, 2, { two: true });
  neighbor(-52, 3, 0, 3, { two: true, garageLeft: true }); neighbor(56, 3, 0, 1, { bay: true });
  neighbor(-40, 37, Math.PI, 1, { bay: true }); neighbor(-14, 37, Math.PI, 3, { two: true }); neighbor(12, 37, Math.PI, 0, { garageLeft: true });
  neighbor(38, 37, Math.PI, 2, { two: true, bay: true }); neighbor(64, 37, Math.PI, 3); neighbor(-66, 37, Math.PI, 0, { two: true });

  /* ---------- cars: parked along the street, two driving past ---------- */
  const carGroup = new THREE.Group(); scene.add(carGroup);
  const tireMat = M('#1A1A1B', { roughness: 0.9 }), rimMat = M('#B8BCC2', { roughness: 0.25, metalness: 0.9 });
  const carGlass = new THREE.MeshPhysicalMaterial({ color: '#1C2630', roughness: 0.05, metalness: 0.2, clearcoat: 1 });
  const headMat = M('#F4F1E6', { emissive: new THREE.Color('#FFF2D0'), emissiveIntensity: 0.2 });
  const tailMat = M('#8A1410', { emissive: new THREE.Color('#FF2010'), emissiveIntensity: 0.3 });
  function car(color, kind = 'sedan') {
    const g = new THREE.Group();
    const paint = new THREE.MeshPhysicalMaterial({ color, roughness: 0.35, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.08 });
    const L = kind === 'suv' ? 4.8 : 4.6, W = 1.85, bodyH = kind === 'suv' ? 0.9 : 0.72;
    const body = shadow(new THREE.Mesh(new RoundedBoxGeometry(L, bodyH, W, 4, 0.2), paint)); body.position.y = 0.3 + bodyH / 2; g.add(body);
    const cabL = kind === 'suv' ? 3.2 : 2.5, cabH = kind === 'suv' ? 0.72 : 0.62;
    const cab = shadow(new THREE.Mesh(new RoundedBoxGeometry(cabL, cabH, W - 0.12, 4, 0.18), carGlass)); cab.position.set(kind === 'suv' ? -0.35 : -0.15, 0.3 + bodyH + cabH / 2 - 0.04, 0); g.add(cab);
    const roofP = shadow(new THREE.Mesh(new RoundedBoxGeometry(cabL - 0.3, 0.07, W - 0.16, 3, 0.03), paint)); roofP.position.set(cab.position.x, 0.3 + bodyH + cabH - 0.06, 0); g.add(roofP);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const wx = sx * (L / 2 - 0.85), wz = sz * (W / 2 - 0.05);
      const tire = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 24), tireMat)); tire.rotation.x = Math.PI / 2; tire.position.set(wx, 0.34, wz); g.add(tire);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.25, 16), rimMat); rim.rotation.x = Math.PI / 2; rim.position.set(wx, 0.34, wz + sz * 0.005); g.add(rim);
    }
    for (const sz of [-0.62, 0.62]) {
      box(g, headMat, 0.06, 0.12, 0.34, L / 2 - 0.02, 0.3 + bodyH * 0.7, sz);
      box(g, tailMat, 0.06, 0.12, 0.38, -L / 2 + 0.02, 0.3 + bodyH * 0.7, sz);
    }
    box(g, M('#202124', { roughness: 0.6 }), 0.12, 0.2, W - 0.1, L / 2, 0.38, 0);
    box(g, M('#202124', { roughness: 0.6 }), 0.12, 0.2, W - 0.1, -L / 2, 0.38, 0);
    carGroup.add(g); return g;
  }
  const park = (x, z, ry, c, k) => { const v = car(c, k); v.position.set(x, 0, z); v.rotation.y = ry; return v; };
  // driveways (nose toward the garage) and curbside
  park(-34.2, 11.5, Math.PI / 2, '#8E1B1B', 'suv'); park(38.2, 12, -Math.PI / 2 + 0.03, '#C9CCD1'); park(64.2, 11, Math.PI / 2, '#1E2D44', 'suv');
  park(-48.2, 28.5, -Math.PI / 2, '#F2F2EF'); park(20.2, 28.7, -Math.PI / 2, '#2B2D31', 'suv'); park(46.2, 28.2, Math.PI / 2, '#5B6670');
  park(-18, 17.1, 0, '#3A4B5E'); park(26, 22.9, Math.PI, '#B9B2A6', 'suv');
  const movers = [car('#D7D9DC'), car('#152238', 'suv')];

  /* ---------- grass: individual blades over the lawns ---------- */
  const bladeGeo = new THREE.BufferGeometry();
  bladeGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.018, 0, 0, 0.018, 0, 0, 0, 1, 0.02], 3));
  bladeGeo.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0.4, 1, 0, 0.4, 1, 0, 1, 0.3], 3));
  const bladeMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, side: THREE.DoubleSide });
  const BLADES = LITE ? 40000 : 140000;
  const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, BLADES);
  blades.receiveShadow = true;
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), col = new THREE.Color();
  const onLawn = (x, z) => !(x > -12.5 && x < 14.5 && z > -10.5 && z < 11.5) && !(z > 14.6 && z < 25.4) && !(x > 5.4 && x < 10.6 && z > 4 && z < 15.6);
  for (let i = 0, n = 0; n < BLADES && i < BLADES * 3; i++) {
    const r = Math.sqrt(Math.random()) * 46, a = Math.random() * Math.PI * 2;
    const x = 1 + Math.cos(a) * r * 1.3, z = 5 + Math.sin(a) * r * 0.85;
    if (!onLawn(x, z)) continue;
    q.setFromEuler(new THREE.Euler((Math.random() - 0.5) * 0.5, Math.random() * Math.PI, (Math.random() - 0.5) * 0.5));
    const h = 0.07 + Math.random() * 0.12;
    mtx.compose(ps.set(x, 0, z), q, sc.set(1, h, 1));
    blades.setMatrixAt(n, mtx);
    blades.setColorAt(n, col.setHSL(0.22 + Math.random() * 0.06, 0.45 + Math.random() * 0.2, 0.22 + Math.random() * 0.14));
    n++;
  }
  scene.add(blades);

  // photo-scanned trees (Poly Haven, CC0), decimated for the web
  const TREE_SPOTS = [[-13, -11, 9, 0], [15, -13, 10, 1], [-24, 12, 8, 1], [26, -8, 9, 0], [-8, 27, 8, 1], [8, 28, 9, 0], [-30, -6, 9, 0], [31, 14, 8, 1]];
  const treeGroup = new THREE.Group(); scene.add(treeGroup);
  const gltf = new GLTFLoader(); gltf.setMeshoptDecoder(MeshoptDecoder);
  Promise.all(['jacaranda', 'tree_small'].map(n => gltf.loadAsync(`${ASSETS}trees/${n}.glb`))).then(models => {
    TREE_SPOTS.forEach(([x, z, h, k], i) => {
      const t = models[k].scene.clone(true);
      const bb = new THREE.Box3().setFromObject(t);
      t.scale.setScalar(h / (bb.max.y - bb.min.y));
      t.position.set(x, -bb.min.y * t.scale.y, z); t.rotation.y = i * 1.7;
      t.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material.map) o.material.map.anisotropy = 4; } });
      treeGroup.add(t);
    });
    Promise.all(['exterior_aircon_unit', 'fire_hydrant'].map(n => gltf.loadAsync(`${ASSETS}props/${n}.glb`))).then(([ac, hyd]) => {
      const fit = (obj, h) => { const bb = new THREE.Box3().setFromObject(obj); obj.scale.setScalar(h / (bb.max.y - bb.min.y)); obj.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } }); return obj; };
      const unit = fit(ac.scene, 0.85); unit.position.set(-5.9, 0, -2); unit.rotation.y = -Math.PI / 2; finish.add(unit);
      const h1 = fit(hyd.scene, 0.8); h1.position.set(-9, 0, 15.1); scene.add(h1);
      const h2 = fit(hyd.scene.clone(true), 0.8); h2.position.set(30, 0, 24.9); scene.add(h2);
      redraw();
    }).catch(() => {});
    // swap the placeholder shrub balls for small scanned plants
    const swaps = [];
    scene.traverse(o => { if (o.userData.shrub !== undefined) swaps.push(o); });
    swaps.forEach((o, i) => {
      o.visible = false;
      if (!o.userData.shrub) return;
      const sh = models[1].scene.clone(true);
      const bb = new THREE.Box3().setFromObject(sh);
      sh.scale.setScalar(o.userData.shrub / (bb.max.y - bb.min.y));
      sh.position.copy(o.position); sh.position.y = 0.02; sh.rotation.y = i * 2.3;
      sh.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      o.parent.add(sh);
    });
    if (typeof redraw === 'function') redraw();
  }).catch(() => {});

  /* ---------- workers: realistic avatars (Microsoft Rocketbox, MIT licence) ---------- */

  const workerGroup = new THREE.Group(); scene.add(workerGroup);
  const crew = []; // filled in once the models load
  let lastP = 0;
  const MODEL_DIR = new URL('models/workers/', import.meta.url).href;
  const mgr = new THREE.LoadingManager();
  mgr.setURLModifier(u => (/\.tga$/i.test(u) ? 'data:,' : u));
  const texLoader = new THREE.TextureLoader();
  const redraw = () => update(lastP);
  const SCALE = 0.0094; // model is in centimetres, ~1.85 m tall -> ~1.74 m

  const qTmp = new THREE.Quaternion(), qA = new THREE.Quaternion(), vA = new THREE.Vector3(), vB = new THREE.Vector3();
  // rotate a bone so the direction to its child points along `dir` (given in the character's own space)
  function aim(rig, bone, child, dir) {
    rig.root.updateMatrixWorld(true);
    bone.getWorldPosition(vA); child.getWorldPosition(vB);
    const cur = vB.sub(vA).normalize();
    const want = dir.clone().normalize().applyQuaternion(rig.root.getWorldQuaternion(qA));
    const delta = qTmp.setFromUnitVectors(cur, want);
    const parentQ = bone.parent.getWorldQuaternion(new THREE.Quaternion());
    const worldQ = bone.getWorldQuaternion(new THREE.Quaternion());
    bone.quaternion.copy(parentQ.invert().multiply(delta.multiply(worldQ)));
  }
  // extra rotation of a bone about an axis given in the character's own space
  function turn(rig, bone, axis, angle) {
    rig.root.updateMatrixWorld(true);
    const ax = axis.clone().applyQuaternion(rig.root.getWorldQuaternion(qA)).normalize();
    const delta = new THREE.Quaternion().setFromAxisAngle(ax, angle);
    const parentQ = bone.parent.getWorldQuaternion(new THREE.Quaternion());
    const worldQ = bone.getWorldQuaternion(new THREE.Quaternion());
    bone.quaternion.copy(parentQ.invert().multiply(delta.multiply(worldQ)));
  }

  function loadWorker(file, place, role) {
    return new Promise(res => {
      import('three/addons/loaders/FBXLoader.js').then(({ FBXLoader }) => new FBXLoader(mgr).load(MODEL_DIR + file, obj => {
        obj.scale.setScalar(SCALE);
        obj.traverse(o => {
          if (!o.isMesh) return;
          o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
          // the FBX points at .tga files; load the matching web-sized JPGs by material name
          const mats = [].concat(o.material).map(m => {
            const base = MODEL_DIR + m.name;
            const map = texLoader.load(base + '_color.jpg', redraw); map.colorSpace = THREE.SRGBColorSpace; map.flipY = true;
            const normalMap = texLoader.load(base + '_normal.jpg', redraw); normalMap.flipY = true;
            const n = new THREE.MeshStandardMaterial({ map, normalMap, roughness: /helmet/.test(m.name) ? 0.35 : 0.8, metalness: 0, name: m.name });
            n.normalScale.set(0.9, 0.9);
            return n;
          });
          o.material = Array.isArray(o.material) ? mats : mats[0];
        });
        const root = new THREE.Group(); root.add(obj); root.position.copy(place.pos); root.rotation.y = place.ry;
        workerGroup.add(root);
        const B = n => obj.getObjectByName('Bip01_' + n);
        const rig = { root, obj, role, B, bones: {} };
        for (const n of ['Pelvis', 'Spine1', 'Spine2', 'Neck', 'Head', 'L_UpperArm', 'L_Forearm', 'L_Hand', 'R_UpperArm', 'R_Forearm', 'R_Hand',
          'L_Thigh', 'L_Calf', 'L_Foot', 'R_Thigh', 'R_Calf', 'R_Foot']) rig.bones[n] = B(n);
        rig.rest = new Map();
        obj.traverse(o => { if (o.isBone) rig.rest.set(o, o.quaternion.clone()); });
        rig.base = { pos: place.pos.clone(), ry: place.ry };
        res(rig);
      }, undefined, () => res(null)));
    });
  }

  function toolsFor(rig) {
    const inv = 1 / SCALE;
    if (rig.role === 'hammer') {
      const h = new THREE.Group(); h.scale.setScalar(inv);
      const handle = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.017, 0.34, 10), M('#9C6F3A', { roughness: 0.6 }))); handle.position.y = 0.1; h.add(handle);
      const head = shadow(new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.05, 0.15, 3, 0.012), mat.steel)); head.position.y = 0.26; h.add(head);
      rig.bones.R_Hand.add(h); rig.tool = h;
    }
    if (rig.role === 'foreman') {
      const c = new THREE.Group(); c.scale.setScalar(inv);
      const board = shadow(new THREE.Mesh(new RoundedBoxGeometry(0.23, 0.31, 0.012, 2, 0.004), M('#7B5A3A', { roughness: 0.7 }))); c.add(board);
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26), M('#F4F2EC')); paper.position.z = 0.008; c.add(paper);
      rig.bones.L_Hand.add(c); rig.tool = c;
    }
    if (rig.role === 'carry') {
      // the 2x4 rides on the right shoulder (character space: +z forward, right side is -x)
      const plank = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.045, 2.6), mat.lumberDark));
      plank.position.set(-0.19, 1.49, 0.35); plank.rotation.x = -0.05; rig.root.add(plank);
    }
  }

  Promise.all([
    loadWorker('Construction_Male_08.fbx', { pos: V(-7.2, 0, 6.6), ry: 2.35 }, 'foreman'),
    loadWorker('Construction_Male_03.fbx', { pos: V(6.4, 0, 2.2), ry: -Math.PI / 2 }, 'hammer'),
    loadWorker('Construction_Male_07.fbx', { pos: V(-8, 0, 7.4), ry: Math.PI / 2 }, 'carry'),
  ]).then(list => {
    list.filter(Boolean).forEach(r => { toolsFor(r); crew.push(r); });
    update(lastP);
  });

  const X = V(1, 0, 0), Y = V(0, 1, 0), Z = V(0, 0, 1);
  function poseRig(rig, o) {
    for (const [b, q] of rig.rest) b.quaternion.copy(q);
    const b = rig.bones;
    // stand naturally: arms down at the sides, slight bend at the elbows
    aim(rig, b.L_UpperArm, b.L_Forearm, V(0.18, -1, 0.02));
    aim(rig, b.R_UpperArm, b.R_Forearm, V(-0.18, -1, 0.02));
    aim(rig, b.L_Forearm, b.L_Hand, V(0.08, -1, 0.25));
    aim(rig, b.R_Forearm, b.R_Hand, V(-0.08, -1, 0.25));
    if (o.spine) turn(rig, b.Spine1, X, o.spine);
    if (o.look) turn(rig, b.Head, Y, o.look);
    if (o.nod) turn(rig, b.Head, X, o.nod);
    if (o.lThigh) turn(rig, b.L_Thigh, X, o.lThigh);
    if (o.rThigh) turn(rig, b.R_Thigh, X, o.rThigh);
    if (o.lCalf) turn(rig, b.L_Calf, X, o.lCalf);
    if (o.rCalf) turn(rig, b.R_Calf, X, o.rCalf);
    if (o.lArm) turn(rig, b.L_UpperArm, X, o.lArm);
    if (o.rArm) turn(rig, b.R_UpperArm, X, o.rArm);
    if (o.lArmOut) turn(rig, b.L_UpperArm, Z, o.lArmOut);
    if (o.rArmOut) turn(rig, b.R_UpperArm, Z, o.rArmOut);
    if (o.lElbow) turn(rig, b.L_Forearm, X, o.lElbow);
    if (o.rElbow) turn(rig, b.R_Forearm, X, o.rElbow);
  }

  // point a held tool in a direction given in the character's own space
  const vH = new THREE.Vector3(), vF = new THREE.Vector3();
  function holdTool(rig, from, axis, dir) {
    if (!rig.tool) return;
    rig.root.updateMatrixWorld(true);
    const hand = rig.bones[from];
    const rootQ = rig.root.getWorldQuaternion(new THREE.Quaternion());
    const want = new THREE.Quaternion().setFromUnitVectors(axis, dir.clone().normalize().applyQuaternion(rootQ));
    rig.tool.quaternion.copy(hand.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(want));
    // sit the grip in the palm, ~8 cm past the wrist
    hand.getWorldPosition(vH); rig.bones[from.replace('Hand', 'Forearm')].getWorldPosition(vF);
    const palm = vH.clone().add(vH.clone().sub(vF).normalize().multiplyScalar(0.08));
    rig.tool.position.copy(hand.worldToLocal(palm));
  }
  // close a hand into a fist around whatever it holds
  function grip(rig, side, amount) {
    for (let f = 1; f <= 4; f++) for (const j of ['', '1', '2']) {
      const bone = rig.obj.getObjectByName(`Bip01_${side}_Finger${f}${j}`);
      if (bone) bone.rotation.z += amount * (j === '' ? 0.9 : 1.1);
    }
    const t = rig.obj.getObjectByName(`Bip01_${side}_Finger0`);
    if (t) t.rotation.y += amount * 0.4;
  }

  function animateWorkers(p) {
    lastP = p;
    const k = p * 220; // scroll drives the motion
    for (const rig of crew) {
      if (rig.role === 'foreman') {
        const point = Math.max(0, Math.sin(k * 0.05));
        poseRig(rig, { lArm: -0.75, lElbow: -1.25, rArm: -1.4 * point, rArmOut: 0.5 * point, look: Math.sin(k * 0.03) * 0.45, nod: 0.3 - point * 0.3 });
        grip(rig, 'L', 0.6); grip(rig, 'R', 0.35);
        holdTool(rig, 'L_Hand', Z, V(0, 0.75, -0.65));
      } else if (rig.role === 'hammer') {
        const sw = (Math.sin(k * 0.9) + 1) / 2;
        poseRig(rig, { spine: 0.15, rArm: -2.3 + sw * 1.4, rElbow: -1.4 + sw * 1.0, lArm: -0.7, lElbow: -0.9, nod: 0.25 });
        // the handle points forward out of the fist and tips down as the hammer comes through
        rig.root.updateMatrixWorld(true);
        const fa = rig.bones.R_Hand.getWorldPosition(new THREE.Vector3()).sub(rig.bones.R_Forearm.getWorldPosition(new THREE.Vector3())).normalize()
          .applyQuaternion(rig.root.getWorldQuaternion(new THREE.Quaternion()).invert());
        const handleDir = fa.clone().applyAxisAngle(X, -Math.PI / 2);
        grip(rig, 'R', 1); grip(rig, 'L', 0.35);
        holdTool(rig, 'R_Hand', Y, handleDir);
      } else {
        const lap = (k * 0.02) % 2, fwd = lap < 1, u = fwd ? lap : 2 - lap;
        rig.root.position.set(lerp(-9, 2.5, ease(u)), 0, 7.4);
        rig.root.rotation.y = fwd ? Math.PI / 2 : -Math.PI / 2;
        const st = Math.sin(k * 1.4);
        poseRig(rig, { lThigh: -st * 0.45, rThigh: st * 0.45, lCalf: Math.max(0, st) * 0.6, rCalf: Math.max(0, -st) * 0.6,
          lArm: st * 0.35, rArm: -1.25, rArmOut: 0.1, rElbow: -0.85, spine: 0.04 });
        grip(rig, 'R', 0.8); grip(rig, 'L', 0.35);
        rig.root.position.y = Math.abs(st) * 0.02;
      }
    }
  }

  /* ---------- 1. survey ---------- */

  const survey = new THREE.Group(); scene.add(survey);
  const stakeTops = [];
  for (const [x, z] of [[-5.6, -4.6], [5.6, -4.6], [5.6, 4.6], [-5.6, 4.6]]) {
    box(survey, mat.lumber, 0.06, 0.8, 0.06, x, 0.4, z);
    stakeTops.push(box(survey, mat.orange, 0.08, 0.12, 0.08, x, 0.82, z));
  }
  const stringBatch = [];
  [[-5.6, -4.6, 5.6, -4.6], [5.6, -4.6, 5.6, 4.6], [5.6, 4.6, -5.6, 4.6], [-5.6, 4.6, -5.6, -4.6]].forEach(([x1, z1, x2, z2]) => {
    const s = new THREE.Mesh(unitCyl, mat.red);
    const len = Math.hypot(x2 - x1, z2 - z1);
    s.scale.set(0.012, len, 0.012);
    s.position.set((x1 + x2) / 2, 0.6, (z1 + z2) / 2);
    s.rotation.set(0, 0, Math.PI / 2); s.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    s.rotation.order = 'YZX';
    survey.add(s); stringBatch.push({ s, len, x1, z1, x2, z2 });
  });

  /* ---------- 2. blueprint: grid paper, plan lines and a title block ---------- */

  const NAVY = new THREE.Color('#0F2C4C');
  const gridTex = tex(256, 256, (g, w, h) => {
    g.fillStyle = '#0F2C4C'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(160, 205, 255, 0.18)'; g.lineWidth = 1;
    for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); }
    g.strokeStyle = 'rgba(160, 205, 255, 0.4)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
  }, [30, 30]);
  const paperMat = new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, opacity: 1, depthWrite: false });
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), paperMat);
  paper.rotation.x = -Math.PI / 2; paper.position.y = 0.04; paper.renderOrder = 1; scene.add(paper);

  const inkMat = new THREE.MeshBasicMaterial({ color: '#EAF4FF', transparent: true, opacity: 0, depthWrite: false });
  const planBatch = new Batch(unitBox, inkMat);
  const L = (x1, z1, x2, z2, w = 0.09) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    planBatch.box(len + w, 0.02, w, (x1 + x2) / 2, 0.08, (z1 + z2) / 2, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.atan2(z2 - z1, x2 - x1), 0)));
  };
  // exterior walls (heavy), interior walls, doors and dimension lines
  L(-5, -4, 5, -4, 0.22); L(5, -4, 5, 4, 0.22); L(5, 4, -5, 4, 0.22); L(-5, 4, -5, -4, 0.22);
  L(-1, -4, -1, 1.2, 0.12); L(-5, 1.2, 1.4, 1.2, 0.12); L(1.4, 1.2, 1.4, 4, 0.12); L(2.4, -4, 2.4, -0.6, 0.12); L(2.4, -0.6, 5, -0.6, 0.12);
  for (const [cx, cz, r] of [[0.9, 4, 0.9], [-2.6, 1.2, 0.8], [3.2, -0.6, 0.8]]) for (let a = 0; a < 8; a++) {
    const a1 = a / 8 * Math.PI / 2, a2 = (a + 1) / 8 * Math.PI / 2;
    L(cx - Math.cos(a1) * r, cz - Math.sin(a1) * r, cx - Math.cos(a2) * r, cz - Math.sin(a2) * r, 0.05);
  }
  L(-5, 5.4, 5, 5.4, 0.05); L(-5, 5.1, -5, 5.7, 0.05); L(5, 5.1, 5, 5.7, 0.05);
  L(6.2, -4, 6.2, 4, 0.05); L(5.9, -4, 6.5, -4, 0.05); L(5.9, 4, 6.5, 4, 0.05);
  for (const [x1, z1, x2, z2] of [[-4.4, 4, -2.8, 4], [3.4, 4, 4.8, 4], [-4.2, -4, -2.4, -4], [1.5, -4, 3.5, -4]]) L(x1, z1 + 0.18, x2, z2 + 0.18, 0.05);
  const plan = planBatch.build(scene);
  plan.castShadow = plan.receiveShadow = false; plan.renderOrder = 2;
  const planCount = plan.count;

  const titleTex = tex(1024, 400, (g, w, h) => {
    g.strokeStyle = '#EAF4FF'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    g.beginPath(); g.moveTo(8, 150); g.lineTo(w - 8, 150); g.moveTo(8, 270); g.lineTo(w - 8, 270); g.moveTo(560, 150); g.lineTo(560, h - 8); g.stroke();
    g.fillStyle = '#EAF4FF'; g.font = 'bold 76px Arial'; g.fillText('KAYMAN CONSTRUCTIONS', 40, 110);
    g.font = '40px Arial'; g.fillText('RESIDENCE · PLAN A-101', 40, 225); g.fillText('SCALE 1/4" = 1\'-0"', 600, 225);
    g.fillText('HOUSTON, TX', 40, 345); g.fillText('SHEET 1 OF 12', 600, 345);
  });
  const titleMat = new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, opacity: 0, depthWrite: false });
  const titleBlock = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.5), titleMat);
  titleBlock.rotation.x = -Math.PI / 2; titleBlock.position.set(8.5, 0.09, 8.2); titleBlock.renderOrder = 2; scene.add(titleBlock);
  const northTex = tex(256, 256, (g, w, h) => {
    g.strokeStyle = '#EAF4FF'; g.fillStyle = '#EAF4FF'; g.lineWidth = 6;
    g.beginPath(); g.arc(128, 140, 80, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(128, 40); g.lineTo(160, 170); g.lineTo(128, 150); g.lineTo(96, 170); g.closePath(); g.fill();
    g.font = 'bold 48px Arial'; g.textAlign = 'center'; g.fillText('N', 128, 250);
  });
  const north = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: northTex, transparent: true, opacity: 0, depthWrite: false }));
  north.rotation.x = -Math.PI / 2; north.position.set(-9.5, 0.09, -7); north.renderOrder = 2; scene.add(north);

  /* ---------- 3. permit sign ---------- */

  const signTex = stamped => tex(256, 192, (g, w, h) => {
    g.fillStyle = '#F7F5EF'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1C1D1F'; g.font = 'bold 30px Arial'; g.textAlign = 'center';
    g.fillText('BUILDING', w / 2, 52); g.fillText('PERMIT', w / 2, 88);
    g.font = '16px Arial'; g.fillText('City of Houston', w / 2, 116);
    if (stamped) {
      g.save(); g.translate(w / 2, 150); g.rotate(-0.16);
      g.strokeStyle = '#C8372D'; g.lineWidth = 5; g.strokeRect(-92, -24, 184, 44);
      g.fillStyle = '#C8372D'; g.font = 'bold 30px Arial'; g.fillText('APPROVED', 0, 10);
      g.restore();
    }
  });
  const sign = new THREE.Group(); sign.position.set(-8, 0, 9.5); sign.rotation.y = 0.55; scene.add(sign);
  box(sign, mat.lumber, 0.1, 1.6, 0.1, -0.6, 0.8, 0); box(sign, mat.lumber, 0.1, 1.6, 0.1, 0.6, 0.8, 0);
  const plainMap = signTex(false);
  const boardMat = M('#ffffff', { map: plainMap, roughness: 0.7 });
  const stampedMap = signTex(true);
  const board = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.05), [mat.white, mat.white, mat.white, mat.white, boardMat, mat.white]));
  board.position.set(0, 1.85, 0.06); sign.add(board);

  /* ---------- 4a. slab and the mixer truck ---------- */

  const forms = new THREE.Group(); scene.add(forms);
  box(forms, mat.lumberDark, 10.6, 0.35, 0.05, 0, 0.17, 4.3); box(forms, mat.lumberDark, 10.6, 0.35, 0.05, 0, 0.17, -4.3);
  box(forms, mat.lumberDark, 0.05, 0.35, 8.6, 5.3, 0.17, 0); box(forms, mat.lumberDark, 0.05, 0.35, 8.6, -5.3, 0.17, 0);
  const slab = box(scene, mat.wetConcrete, 10.5, 0.3, 8.5, 0, 0.15, 0);

  const truck = new THREE.Group(); scene.add(truck);
  box(truck, mat.craneDark, 8, 0.5, 2.3, 0, 0.9, 0);
  const cab = box(truck, mat.white, 2, 2.2, 2.3, 3.4, 2.0, 0);
  box(truck, mat.glass, 0.05, 0.9, 2, 4.42, 2.5, 0);
  box(truck, mat.glass, 1.2, 0.8, 0.05, 3.4, 2.5, 1.16);
  const drum = new THREE.Group(); drum.position.set(-0.8, 2.3, 0); drum.rotation.z = -0.22; truck.add(drum);
  const drumMesh = shadow(new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.25, 4.6, 24, 1), mat.white)); drumMesh.rotation.z = Math.PI / 2; drum.add(drumMesh);
  const drumCone = shadow(new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.2, 24), mat.white)); drumCone.rotation.z = Math.PI / 2; drumCone.position.x = 2.9; drum.add(drumCone);
  const stripes = new Batch(unitBox, mat.orange);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    stripes.box(4.3, 0.18, 0.18, 0, Math.cos(a) * 1.16, Math.sin(a) * 1.16, new THREE.Quaternion().setFromEuler(new THREE.Euler(a, 0, 0.15)));
  }
  const drumStripes = stripes.build(drum);
  const chute = box(truck, mat.steel, 2.2, 0.12, 0.45, -4.6, 1.5, 0); chute.rotation.z = 0.35;
  const pour = box(truck, mat.wetConcrete, 0.35, 1.2, 0.35, -5.6, 0.9, 0);
  for (const [x, z] of [[2.9, 1.2], [2.9, -1.2], [-1.6, 1.2], [-1.6, -1.2], [-3, 1.2], [-3, -1.2]]) {
    const w = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 18), mat.craneDark)); w.rotation.x = Math.PI / 2; w.position.set(x, 0.5, z); truck.add(w);
  }
  truck.rotation.y = -Math.PI / 2; // backs in, chute toward the slab

  /* ---------- 4b. framed walls that tilt up ---------- */

  const FLOOR = 0.3, WALL_H = 2.7;
  const shutterMat = M('#2E3A44', { roughness: 0.6 }), shutterLine = M('#26313A', { roughness: 0.6 }), doorPanel = M('#4A3527', { roughness: 0.55 });
  const wallDefs = [
    { len: 10, pos: [-5, FLOOR, 4], ry: 0, open: [[1.2, 2.6, 0.9, 2.1], [4.55, 5.45, 0, 2.15], [7.4, 8.8, 0.9, 2.1]] },
    { len: 10, pos: [5, FLOOR, -4], ry: Math.PI, open: [[1.5, 3.3, 0.9, 2.1], [6.5, 8.5, 0.9, 2.1]] },
    { len: 8, pos: [-5, FLOOR, -4], ry: -Math.PI / 2, open: [[3.2, 4.8, 0.9, 2.1]] },
    { len: 8, pos: [5, FLOOR, 4], ry: Math.PI / 2, open: [[2.8, 4.4, 0.9, 2.1]] },
  ];
  const T = 0.09; // wall thickness (2x4 on edge)
  const walls = wallDefs.map(def => {
    const g = new THREE.Group(); g.position.set(...def.pos); g.rotation.y = def.ry; scene.add(g);
    const tilt = new THREE.Group(); g.add(tilt);
    const frame = new Batch(unitBox, mat.lumber);
    const stud = (x, y0, y1) => frame.box(0.045, y1 - y0, T, x, (y0 + y1) / 2, -T / 2);
    frame.box(def.len, 0.045, T, def.len / 2, 0.0225, -T / 2);
    frame.box(def.len, 0.09, T, def.len / 2, WALL_H - 0.045, -T / 2);
    const inOpen = x => def.open.find(([a, b]) => x > a - 0.05 && x < b + 0.05);
    for (let x = 0.0225; x < def.len; x += 0.406) {
      const o = inOpen(x);
      if (!o) stud(x, 0.045, WALL_H - 0.09);
      else {
        if (o[2] > 0) stud(x, 0.045, o[2] - 0.045);
        stud(x, o[3] + 0.2, WALL_H - 0.09);
      }
    }
    stud(def.len - 0.0225, 0.045, WALL_H - 0.09);
    for (const [a, b, sill, head] of def.open) {
      stud(a - 0.0225, 0.045, WALL_H - 0.09); stud(b + 0.0225, 0.045, WALL_H - 0.09);
      stud(a + 0.0225, 0.045, head); stud(b - 0.0225, 0.045, head);
      frame.box(b - a, 0.2, T, (a + b) / 2, head + 0.1, -T / 2);
      if (sill > 0) frame.box(b - a - 0.09, 0.045, T, (a + b) / 2, sill, -T / 2);
    }
    frame.build(tilt);

    // wall skins (sheathing, then siding) are built around the openings and grow upward
    const skin = (material, z, scaleTex) => {
      const s = new THREE.Group(); tilt.add(s);
      const cuts = [0, def.len, ...def.open.flatMap(o => [o[0], o[1]])].sort((a, b) => a - b);
      for (let i = 0; i < cuts.length - 1; i++) {
        const a = cuts[i], b = cuts[i + 1], w = b - a;
        if (w < 0.01) continue;
        const o = def.open.find(op => op[0] <= a + 0.001 && op[1] >= b - 0.001);
        const parts = o ? [[0, o[2]], [o[3], WALL_H]] : [[0, WALL_H]];
        for (const [y0, y1] of parts) {
          if (y1 - y0 < 0.01) continue;
          const m = withRepeat(material, w / scaleTex[0], (y1 - y0) / scaleTex[1]);
          box(s, m, w, y1 - y0, 0.015, (a + b) / 2, (y0 + y1) / 2, z);
        }
      }
      s.scale.y = 0.0001;
      return s;
    };
    const sheath = skin(mat.osb, 0.008, [2.4, 1.2]);
    const siding = skin(mat.siding, 0.024, [2, 2]);
    const extras = new THREE.Group(); tilt.add(extras);
    for (const [a, b, sill, head] of def.open) {
      const w = b - a, h = head - sill;
      if (sill > 0) {
        box(extras, mat.glass, w - 0.1, h - 0.1, 0.03, (a + b) / 2, (sill + head) / 2, -0.02);
        box(extras, mat.trim, w + 0.16, 0.1, 0.06, (a + b) / 2, head + 0.05, 0.04);
        box(extras, mat.trim, w + 0.2, 0.07, 0.1, (a + b) / 2, sill - 0.03, 0.05);
        box(extras, mat.trim, 0.08, h, 0.06, a - 0.04, (sill + head) / 2, 0.04);
        box(extras, mat.trim, 0.08, h, 0.06, b + 0.04, (sill + head) / 2, 0.04);
        box(extras, mat.trim, 0.035, h - 0.1, 0.05, (a + b) / 2, (sill + head) / 2, -0.005);
        box(extras, mat.trim, w - 0.1, 0.035, 0.05, (a + b) / 2, (sill + head) / 2, -0.005);
        for (const sx of [a - 0.26, b + 0.26]) {
          box(extras, shutterMat, 0.36, h + 0.1, 0.05, sx, (sill + head) / 2, 0.05);
          for (let k = 0; k < 6; k++) box(extras, shutterLine, 0.3, 0.012, 0.012, sx, sill + 0.1 + k * (h - 0.1) / 6, 0.08);
        }
      } else {
        box(extras, mat.door, w - 0.06, h - 0.03, 0.05, (a + b) / 2, h / 2, -0.02);
        for (const [py, ph] of [[0.55, 0.7], [1.45, 0.75]]) for (const px of [-0.2, 0.2]) box(extras, doorPanel, 0.26, ph, 0.02, (a + b) / 2 + px * (w - 0.1) / 0.9, py, 0.012);
        box(extras, mat.trim, w + 0.16, 0.1, 0.06, (a + b) / 2, head + 0.05, 0.04);
        box(extras, mat.steel, 0.04, 0.04, 0.08, (a + b) / 2 + w / 2 - 0.15, 1.05, 0.04);
      }
    }
    extras.visible = false;
    return { g, tilt, sheath, siding, extras };
  });

  /* ---------- 4c. roof trusses, roof deck, shingles ---------- */

  const PITCH_H = 2.2, SPAN = 4.4; // half span incl. overhang
  const trussShape = () => {
    const g = new THREE.Group();
    const b = new Batch(unitBox, mat.lumber);
    b.box(0.045, 0.09, SPAN * 2, 0, 0.045, 0);
    const slope = Math.atan2(PITCH_H, 4.0), len = Math.hypot(PITCH_H, 4.2);
    for (const s of [-1, 1]) {
      b.box(0.045, 0.09, len, 0, PITCH_H / 2 + 0.05, s * 2.05, new THREE.Quaternion().setFromEuler(new THREE.Euler(s * slope, 0, 0)));
    }
    b.box(0.045, PITCH_H, 0.09, 0, PITCH_H / 2, 0);
    for (const s of [-1, 1]) {
      const a = V(0, 0.09, s * 1.4), c = V(0, PITCH_H * 0.62, s * 0.55);
      const dir = c.clone().sub(a), q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.clone().normalize());
      b.box(0.045, dir.length(), 0.07, 0, (a.y + c.y) / 2, (a.z + c.z) / 2, q);
      const a2 = V(0, 0.09, s * 2.7), c2 = V(0, PITCH_H * 0.35, s * 2.4);
      const d2 = c2.clone().sub(a2), q2 = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d2.clone().normalize());
      b.box(0.045, d2.length(), 0.07, 0, (a2.y + c2.y) / 2, (a2.z + c2.z) / 2, q2);
    }
    b.build(g);
    return g;
  };
  const TRUSS_TOP = FLOOR + WALL_H;
  // the roof trusses arrive braced together as one package and go up in a single lift
  const ATTACH = V(0, PITCH_H + 2.8, 0); // where the four slings meet, above the ridge
  const STACK = V(8.6, 0.16, 9.2);
  const pkg = new THREE.Group(); scene.add(pkg);
  for (let i = 0; i < 6; i++) { const t = trussShape(); t.position.x = -4.95 + i * 1.98; pkg.add(t); }
  const brace = new Batch(unitBox, mat.lumberDark);
  for (const z of [-2.6, -1.2, 1.2, 2.6]) {
    const y = PITCH_H * (1 - Math.abs(z) / 4.2) + 0.12;
    brace.box(10.1, 0.045, 0.09, 0, y, z);
  }
  brace.box(10.1, 0.09, 0.045, 0, PITCH_H + 0.05, 0);
  brace.build(pkg);
  const trusses = [{ g: pkg, to: V(0, TRUSS_TOP, 0), from: STACK.clone() }];
  for (const x of [-3.5, 3.5]) { const b = box(scene, mat.lumberDark, 0.15, 0.15, 9, 0, 0.075, 0); b.position.set(STACK.x + x * Math.sin(0.9), 0.075, STACK.z + x * Math.cos(0.9)); b.rotation.y = 0.9 + Math.PI / 2; }
  const FLAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.9, 0)); // how it sits on the ground
  const UP = new THREE.Quaternion();
  const slingMat = M('#D9CFB4', { roughness: 0.8 });
  const slings = new THREE.Group(); scene.add(slings);
  const slingLegs = Array.from({ length: 4 }, () => { const m = shadow(new THREE.Mesh(unitCyl, slingMat)); slings.add(m); return m; });

  const roof = new THREE.Group(); scene.add(roof);
  const alpha = Math.atan2(PITCH_H, 4.0), slopeLen = 4.45 / Math.cos(alpha);
  const deckStrips = [], shingleStrips = [];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const d0 = slopeLen * (1 - (i + 1) / 4), d1 = slopeLen * (1 - i / 4), dm = (d0 + d1) / 2;
      const zc = s * dm * Math.cos(alpha), yc = TRUSS_TOP + PITCH_H + 0.1 - dm * Math.sin(alpha);
      const mk = (material, off, rep) => {
        const m = withRepeat(material, ...rep);
        const p = box(roof, m, 10.8, 0.025, slopeLen / 4, 0, yc + off, zc + s * off * Math.tan(alpha));
        p.rotation.x = s * alpha; p.scale.z = 0.0001; return p;
      };
      deckStrips.push(mk(mat.osb, 0.0, [4.5, 0.6]));
      shingleStrips.push(mk(mat.shingle, 0.04, [5.4, 0.7]));
    }
  }
  const fascia = new THREE.Group(); roof.add(fascia); fascia.visible = false;
  for (const s of [-1, 1]) {
    const f = box(fascia, mat.trim, 10.9, 0.22, 0.04, 0, TRUSS_TOP + PITCH_H + 0.1 - slopeLen * Math.sin(alpha) - 0.05, s * slopeLen * Math.cos(alpha));
  }
  box(fascia, mat.trim, 10.9, 0.08, 0.14, 0, TRUSS_TOP + PITCH_H + 0.17, 0);
  // gable ends
  const gableShape = new THREE.Shape([new THREE.Vector2(-4, 0), new THREE.Vector2(4, 0), new THREE.Vector2(0, PITCH_H)]);
  const gableGeo = new THREE.ShapeGeometry(gableShape);
  const gables = [];
  for (const s of [-1, 1]) {
    const m = withRepeat(mat.siding, 4, PITCH_H / 2); m.side = THREE.DoubleSide;
    const gm = shadow(new THREE.Mesh(gableGeo, m));
    gm.rotation.y = s * Math.PI / 2; gm.position.set(s * 5.03, TRUSS_TOP, 0); gm.scale.y = 0.0001;
    scene.add(gm); gables.push(gm);
  }
  const chimney = box(scene, M('#8E5A44', { roughness: 0.95 }), 0.8, 2.4, 0.8, 2.8, TRUSS_TOP + 1.9, -1.2); chimney.visible = false;

  /* ---------- finishing details: porch, gutters, lights, landscaping ---------- */

  const finish = new THREE.Group(); scene.add(finish);
  const EAVE_Z = slopeLen * Math.cos(alpha), EAVE_Y = TRUSS_TOP + PITCH_H + 0.1 - slopeLen * Math.sin(alpha);
  // ridge cap
  box(finish, M('#2C2E33', { roughness: 0.9 }), 10.9, 0.12, 0.34, 0, TRUSS_TOP + PITCH_H + 0.16, 0);
  // gutters and downspouts
  const gutterMat = M('#F4F3EF', { roughness: 0.5 });
  for (const s of [-1, 1]) {
    const gut = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 10.9, 12, 1, false, 0, Math.PI), gutterMat));
    gut.rotation.z = Math.PI / 2; gut.rotation.x = Math.PI; gut.position.set(0, EAVE_Y - 0.12, s * (EAVE_Z + 0.06)); finish.add(gut);
    for (const x of [-5.25, 5.25]) {
      box(finish, gutterMat, 0.09, EAVE_Y - 0.1, 0.07, x, (EAVE_Y - 0.1) / 2, s * 4.12);
      box(finish, gutterMat, 0.09, 0.07, 0.5, x, 0.1, s * 4.35);
    }
  }
  // covered front porch over the door
  const porchG = new THREE.Group(); porchG.position.set(0, 0, 4.0); finish.add(porchG);
  box(porchG, mat.concrete, 3.6, 0.3, 1.9, 0, 0.15, 0.95);
  box(porchG, mat.concrete, 1.8, 0.15, 0.4, 0, 0.075, 2.1);
  for (const x of [-1.5, 1.5]) {
    box(porchG, mat.trim, 0.26, 0.2, 0.26, x, 0.4, 1.7);
    box(porchG, mat.trim, 0.18, 2.5, 0.18, x, 1.6, 1.7);
    box(porchG, mat.trim, 0.26, 0.14, 0.26, x, 2.87, 1.7);
  }
  box(porchG, mat.trim, 3.5, 0.24, 0.2, 0, 3.05, 1.7);
  const pr = new THREE.Shape([new THREE.Vector2(-1.95, 0), new THREE.Vector2(1.95, 0), new THREE.Vector2(0, 1.0)]);
  const prGeo = new THREE.ExtrudeGeometry(pr, { depth: 2.2, bevelEnabled: false });
  const prFace = shadow(new THREE.Mesh(prGeo, [mat.siding, mat.trim])); prFace.position.set(0, 3.15, 0); porchG.add(prFace);
  for (const s of [-1, 1]) {
    const slopeL = Math.hypot(1.95, 1.0) + 0.12;
    const rp = box(porchG, M('#3B3D42', { roughness: 0.9 }), slopeL, 0.08, 2.4, s * 0.97, 3.15 + 0.53, 1.1);
    rp.rotation.z = -s * Math.atan2(1.0, 1.95);
  }
  // coach lights either side of the door
  const coachMat = M('#FFE0A8', { emissive: new THREE.Color('#FFB654'), emissiveIntensity: 0 });
  for (const x of [-0.75, 0.75]) {
    box(porchG, M('#1E1F22'), 0.16, 0.3, 0.12, x, 2.05, 0.08);
    box(porchG, coachMat, 0.11, 0.2, 0.1, x, 2.05, 0.12);
  }
  // walkway, beds and shrubs
  const walkMat = M('#D3CFC6', { roughness: 0.9 });
  for (let i = 0; i < 5; i++) box(finish, walkMat, 1.4, 0.04, 0.8, 0, 0.03, 6.6 + i * 1.0);
  const mulch = M('#5A3E2B', { roughness: 1 });
  for (const x of [-3.6, 3.6]) box(finish, mulch, 2.8, 0.05, 1.1, x, 0.03, 4.85);
  const shrubMat = M('#3F6B35', { roughness: 0.95 }), flowerMat = M('#D9A23C', { roughness: 0.8 });
  for (const x of [-4.6, -3.6, -2.6, 2.6, 3.6, 4.6]) {
    const b = shadow(new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 3), shrubMat)); b.scale.y = 0.8; b.userData.shrub = 1.0; b.position.set(x, 0.38, 4.85); finish.add(b);
    const f = shadow(new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 2), flowerMat)); f.userData.shrub = 0; f.position.set(x + 0.3, 0.68, 5.1); finish.add(f);
  }
  // mailbox at the curb
  box(finish, M('#2A2B2E'), 0.08, 1.1, 0.08, 2.2, 0.55, 15.1);
  box(finish, M('#2A2B2E'), 0.24, 0.24, 0.45, 2.2, 1.18, 15.1);
  // attached garage with a sectional door
  const gar = new THREE.Group(); gar.position.set(8.2, 0, 0.6); finish.add(gar);
  box(gar, mat.concrete, 6.4, 0.3, 7, 0, 0.15, 0);
  box(gar, withRepeat(mat.siding, 3, 1.4), 6.2, 2.8, 6.8, 0, 1.7, 0);
  const grf = shadow(new THREE.Mesh(hip(7, 7.6, 1.6), withRepeat(mat.shingle, 3, 3))); grf.position.y = 3.1; gar.add(grf);
  box(gar, mat.trim, 6.5, 0.16, 7.1, 0, 3.1, 0);
  box(gar, garageDoorMat, 4.8, 2.2, 0.06, 0, 1.4, 3.42);
  for (let k = 1; k < 4; k++) box(gar, M('#D9D6CF'), 4.8, 0.03, 0.08, 0, 0.3 + k * 0.55, 3.46);
  for (let k = 0; k < 4; k++) box(gar, mat.glass, 0.9, 0.3, 0.07, -1.8 + k * 1.2, 2.2, 3.47);
  box(gar, mat.trim, 5.0, 0.12, 0.1, 0, 2.56, 3.44);
  // path lights along the walkway, a porch ceiling light, the house number
  const pathLightMat = M('#FFE3B0', { emissive: new THREE.Color('#FFC97A'), emissiveIntensity: 0 });
  for (const zz of [7, 9, 11, 13]) for (const sx of [-0.95, 0.95]) {
    box(finish, M('#1E1F22'), 0.06, 0.45, 0.06, sx, 0.22, zz); box(finish, pathLightMat, 0.12, 0.08, 0.12, sx, 0.48, zz);
  }
  const numTex = tex(128, 64, (g2, w, h) => { g2.fillStyle = '#2B2D31'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#E8E2D0'; g2.font = 'bold 44px Arial'; g2.textAlign = 'center'; g2.fillText('1426', w / 2, 47); });
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshStandardMaterial({ map: numTex, roughness: 0.6 })); plaque.position.set(-0.8, 2.3, 4.06); finish.add(plaque);
  finish.visible = false;

  /* ---------- tower crane ---------- */

  const MAST = V(13, 0, -8), H = 17, SEC = 1.6;
  const crane = new THREE.Group(); crane.position.copy(MAST); scene.add(crane);
  box(crane, mat.concrete, 5, 0.8, 5, 0, 0.4, 0);
  for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) box(crane, mat.craneDark, 0.9, 1.2, 0.9, x, 1.1, z);
  const mast = new Batch(unitCyl, mat.crane);
  const hs = SEC / 2, corners = [[-hs, -hs], [hs, -hs], [hs, hs], [-hs, hs]];
  corners.forEach(([x, z]) => mast.strut(V(x, 0.8, z), V(x, H, z), 0.07));
  for (let y = 0.8; y < H - 0.1; y += SEC) {
    for (let k = 0; k < 4; k++) {
      const [x1, z1] = corners[k], [x2, z2] = corners[(k + 1) % 4];
      mast.strut(V(x1, y, z1), V(x2, y, z2), 0.035);
      mast.strut(V(x1, y, z1), V(x2, Math.min(y + SEC, H), z2), 0.03);
    }
  }
  mast.build(crane);
  // ladder
  const ladder = new Batch(unitCyl, mat.steel);
  for (const x of [-0.25, 0.25]) ladder.strut(V(x, 0.8, hs + 0.15), V(x, H, hs + 0.15), 0.02);
  for (let y = 1; y < H; y += 0.35) ladder.strut(V(-0.25, y, hs + 0.15), V(0.25, y, hs + 0.15), 0.012);
  ladder.build(crane);

  const slew = new THREE.Group(); slew.position.y = H; crane.add(slew);
  const ring = shadow(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.5, 24), mat.craneDark)); ring.position.y = 0.25; slew.add(ring);
  box(slew, mat.crane, 2.2, 0.4, 2.2, 0, 0.7, 0);
  // operator cab
  const cabG = new THREE.Group(); cabG.position.set(0.9, 0.2, 1.4); slew.add(cabG);
  box(cabG, mat.white, 1.4, 1.6, 1.3, 0, 0.8, 0);
  box(cabG, mat.glass, 1.42, 0.9, 1.0, 0.05, 1.05, 0.0);
  box(cabG, mat.crane, 1.5, 0.08, 1.4, 0, 1.64, 0);
  // jib (triangular lattice) along +x, counter-jib along -x
  const JIB = 22, JW = 0.6, JH = 1.3, JY = 0.9;
  const jib = new Batch(unitCyl, mat.crane);
  jib.strut(V(0, JY, -JW), V(JIB, JY, -JW), 0.06); jib.strut(V(0, JY, JW), V(JIB, JY, JW), 0.06); jib.strut(V(0, JY + JH, 0), V(JIB, JY + 0.2, 0), 0.06);
  for (let x = 0; x < JIB - 0.1; x += 1.2) {
    const x2 = Math.min(x + 1.2, JIB), top = t => JY + JH - (JH - 0.2) * (t / JIB);
    jib.strut(V(x, JY, -JW), V(x, JY, JW), 0.025);
    jib.strut(V(x, JY, -JW), V(x2, top(x2), 0), 0.025);
    jib.strut(V(x, JY, JW), V(x2, top(x2), 0), 0.025);
    jib.strut(V(x2, JY, -JW), V(x2, top(x2), 0), 0.02);
    jib.strut(V(x2, JY, JW), V(x2, top(x2), 0), 0.02);
  }
  // counter-jib
  for (const z of [-0.7, 0.7]) jib.strut(V(0, JY, z), V(-8, JY, z), 0.07);
  for (let x = 0; x > -8; x -= 1) jib.strut(V(x, JY, -0.7), V(x, JY, 0.7), 0.03);
  // tower head (apex) and pendant ties
  const APEX = V(0, JY + 5.2, 0);
  for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [0.6, 0.6], [-0.6, 0.6]]) jib.strut(V(x, JY, z), APEX, 0.06);
  jib.build(slew);
  const ties = new Batch(unitCyl, mat.cable);
  ties.strut(APEX, V(JIB * 0.55, JY + JH * 0.5, 0), 0.025); ties.strut(APEX, V(JIB - 1, JY + 0.3, 0), 0.025);
  ties.strut(APEX, V(-7.5, JY, -0.7), 0.025); ties.strut(APEX, V(-7.5, JY, 0.7), 0.025);
  ties.build(slew);
  box(slew, M('#C9C9C4', { roughness: 0.6 }), 8, 0.06, 1.3, -4, JY + 0.05, 0); // walkway
  for (let i = 0; i < 4; i++) box(slew, mat.concrete, 0.55, 1.6, 1.6, -6.1 - i * 0.58, JY - 0.85, 0);
  box(slew, mat.craneDark, 1.6, 1, 1.2, -2.5, JY + 0.55, 0); // hoist winch
  const winchDrum = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 16), mat.steel)); winchDrum.rotation.x = Math.PI / 2; winchDrum.position.set(-1.4, JY + 0.55, 0); slew.add(winchDrum);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), mat.beacon); beacon.position.copy(APEX).add(V(0, 0.2, 0)); slew.add(beacon);
  const beaconTip = beacon.clone(); beaconTip.position.set(JIB, JY + 0.4, 0); slew.add(beaconTip);
  const beaconLight = new THREE.PointLight('#FF2A1A', 0, 10, 2); beaconLight.position.copy(beacon.position); slew.add(beaconLight);
  // sign panel on the jib
  const craneSign = tex(512, 96, (g, w, h) => { g.fillStyle = '#1C1D1F'; g.fillRect(0, 0, w, h); g.fillStyle = '#F2B705'; g.font = 'bold 54px Arial'; g.textAlign = 'center'; g.fillText('KAYMAN', w / 2, 66); });
  const signPanel = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1), new THREE.MeshStandardMaterial({ map: craneSign, side: THREE.DoubleSide, roughness: 0.6 }));
  signPanel.position.set(-3.6, JY + 1.4, 0.72); slew.add(signPanel);

  // trolley, hoist cables and hook block
  const trolley = new THREE.Group(); trolley.position.y = JY; slew.add(trolley);
  box(trolley, mat.craneDark, 1.1, 0.35, 1.4, 0, -0.2, 0);
  for (const z of [-0.45, 0.45]) { const sh = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 14), mat.steel)); sh.rotation.x = Math.PI / 2; sh.position.set(0, -0.42, z); trolley.add(sh); }
  const cables = [-0.12, 0.12].flatMap(dx => [-0.45, 0.45].map(dz => { const c = new THREE.Mesh(unitCyl, mat.cable); c.userData.off = [dx, dz]; scene.add(c); return c; }));
  const hook = new THREE.Group(); scene.add(hook);
  box(hook, mat.crane, 0.5, 0.7, 0.9, 0, 0.35, 0);
  for (const z of [-0.2, 0.2]) { const sh = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16), mat.steel)); sh.rotation.x = Math.PI / 2; sh.position.set(0, 0.55, z); hook.add(sh); }
  const hookSteel = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 16, Math.PI * 1.5), mat.steel)); hookSteel.position.y = -0.18; hookSteel.rotation.z = Math.PI / 4; hook.add(hookSteel);
  box(hook, mat.steel, 0.08, 0.25, 0.08, 0, -0.05, 0);

  /* ---------- crane motion ---------- */

  const tmpV = new THREE.Vector3();
  const aimAt = (pt) => {
    const dx = pt.x - MAST.x, dz = pt.z - MAST.z;
    return { yaw: Math.atan2(-dz, dx), r: Math.hypot(dx, dz) };
  };
  const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
  const REST = { yaw: aimAt(V(2, 0, 2)).yaw, r: 12, h: 11 };
  const HOOK_CLEAR = 0.85; // gap between hook point and truss attach
  const LIFT0 = 0.5, LIFT_LEN = 0.24; // one long, unhurried lift

  function craneState(p) {
    let active = -1;
    trusses.forEach((tr, i) => {
      const t = (p - (LIFT0 + i * LIFT_LEN)) / LIFT_LEN;
      if (t < 0.3) { tr.g.position.copy(tr.from); tr.g.quaternion.copy(FLAT); }
      else { tr.g.position.copy(tr.to); tr.g.quaternion.copy(UP); }
      if (t >= 0 && t < 1) active = i;
    });
    const carryH = TRUSS_TOP + PITCH_H + 6.5;
    const dropOf = i => aimAt(trusses[i].to.clone().add(ATTACH));
    const end = LIFT0 + trusses.length * LIFT_LEN;
    if (active < 0) {
      if (p < LIFT0) return { yaw: REST.yaw, r: REST.r, h: REST.h, load: null };
      const last = dropOf(trusses.length - 1), u = ease(seg(p, end, end + 0.06));
      return { yaw: last.yaw + angDiff(last.yaw, REST.yaw) * u, r: lerp(last.r, REST.r, u), h: lerp(carryH, REST.h + 2, u), load: null };
    }
    const tr = trusses[active], t = (p - (LIFT0 + active * LIFT_LEN)) / LIFT_LEN;
    const prev = active === 0 ? { yaw: REST.yaw, r: REST.r } : dropOf(active - 1);
    const pickPt = tr.from.clone().add(ATTACH.clone().applyQuaternion(FLAT));
    const dropPt = tr.to.clone().add(ATTACH);
    const A = aimAt(pickPt), B = aimAt(dropPt);
    const k = (a, b) => ease(seg(t, a, b));
    const prevH = active === 0 ? REST.h : carryH;
    let yaw, r, h, attached = false;
    const q = FLAT.clone();
    if (t < 0.16) { const u = k(0, 0.16); yaw = prev.yaw + angDiff(prev.yaw, A.yaw) * u; r = lerp(prev.r, A.r, u); h = lerp(prevH, carryH, u); }
    else if (t < 0.3) { yaw = A.yaw; r = A.r; h = lerp(carryH, pickPt.y + HOOK_CLEAR, k(0.16, 0.3)); }
    else if (t < 0.5) { yaw = A.yaw; r = A.r; h = lerp(pickPt.y + HOOK_CLEAR, carryH, k(0.3, 0.5)); attached = true; q.slerpQuaternions(FLAT, UP, k(0.32, 0.5)); }
    else if (t < 0.74) { const u = k(0.5, 0.74); yaw = A.yaw + angDiff(A.yaw, B.yaw) * u; r = lerp(A.r, B.r, u); h = carryH; attached = true; q.copy(UP); }
    else if (t < 0.9) { yaw = B.yaw; r = B.r; h = lerp(carryH, dropPt.y + HOOK_CLEAR, k(0.74, 0.9)); attached = true; q.copy(UP); }
    else { yaw = B.yaw; r = B.r; h = lerp(dropPt.y + HOOK_CLEAR, carryH, k(0.9, 1)); q.copy(UP); }
    if (!attached) return { yaw, r, h, load: null };
    // the load sways a little while the crane slews, then settles
    const sw = seg(t, 0.5, 0.86);
    const swing = t > 0.5 && t < 0.86 ? Math.sin(sw * Math.PI * 3) * (1 - sw) * 0.12 : 0;
    q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(swing, 0, 0)));
    const hookPt = V(MAST.x + Math.cos(yaw) * r, h - HOOK_CLEAR, MAST.z - Math.sin(yaw) * r);
    tr.g.quaternion.copy(q);
    tr.g.position.copy(hookPt.sub(ATTACH.clone().applyQuaternion(q)));
    return { yaw, r, h, load: tr };
  }

  function placeCrane({ yaw, r, h, load }) {
    slew.rotation.y = yaw;
    trolley.position.x = r;
    const tx = MAST.x + Math.cos(yaw) * r, tz = MAST.z - Math.sin(yaw) * r;
    hook.position.set(tx, h, tz);
    hook.rotation.y = yaw;
    const top = H + JY - 0.42;
    for (const c of cables) {
      const [dx, dz] = c.userData.off;
      const ox = Math.cos(yaw) * dx + Math.sin(yaw) * dz, oz = -Math.sin(yaw) * dx + Math.cos(yaw) * dz;
      const len = top - (h + 0.55);
      c.scale.set(0.012, Math.max(len, 0.01), 0.012);
      c.position.set(tx + ox * 0.6, h + 0.55 + len / 2, tz + oz * 0.4);
    }
    slings.visible = !!load;
    if (load) {
      const hp = V(tx, h - 0.25, tz);
      [[-3.96, -0.6], [-3.96, 0.6], [3.96, -0.6], [3.96, 0.6]].forEach(([x, z], i) => {
        const pt = V(x, PITCH_H * (1 - Math.abs(z) / 4.2) + 0.1, z).applyQuaternion(load.g.quaternion).add(load.g.position);
        const dir = pt.clone().sub(hp), len = dir.length();
        const m = slingLegs[i];
        m.position.copy(hp).add(pt).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize());
        m.scale.set(0.025, len, 0.025);
      });
    }
  }

  /* ---------- street lamps (they matter at night) ---------- */

  const lamps = [];
  for (const x of [-24, -8, 8, 24]) {
    const g = new THREE.Group(); g.position.set(x, 0, 21); scene.add(g);
    const pole = shadow(new THREE.Mesh(unitCyl, mat.craneDark)); pole.scale.set(0.08, 5, 0.08); pole.position.y = 2.5; g.add(pole);
    const arm = box(g, mat.craneDark, 0.08, 0.08, 1.2, 0, 5, 0.5);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.3), M('#FFE2B0', { emissive: new THREE.Color('#FFC77A'), emissiveIntensity: 0 }));
    head.position.set(0, 4.9, 1); g.add(head);
    const light = new THREE.PointLight('#FFC27A', 0, 16, 1.6); light.position.set(0, 4.6, 1); g.add(light);
    lamps.push({ head, light });
  }

  /* ---------- the world rises out of the blueprint ---------- */

  const keep = new Set([ground, pad, finish, newLawn, workerGroup, paper, plan, titleBlock, north, hemi, sun, sun.target, interior, porch, survey, sign, forms, slab, truck, roof, chimney, slings, hook, ...cables, ...gables, ...walls.map(w => w.g), ...trusses.map(t => t.g)]);
  const risers = []; // the site simply appears as the blueprint dissolves (no pop-up animation)
  const backOut = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

  /* ---------- dust puffs when things land ---------- */

  const events = [];
  const STAMP_AT = 0.235;

  /* ---------- camera choreography ---------- */

  // [progress, camera position, look-at target]
  const SHOTS = [
    [0.00, V(0.4, 48, 1.2), V(0, 0, 0)],      // straight down on the blueprint
    [0.15, V(1.5, 36, 3.5), V(1, 0, 0.5)],
    [0.24, V(-17, 8, 21), V(1.5, 3.5, -1)],   // swoop down as the world rises
    [0.285, V(9, 4.8, 10), V(-1, 0.4, 3.5)],  // side-on: mixer and the slab filling
    [0.345, V(7, 3.6, 7.5), V(-0.5, 0.3, 1.5)],
    [0.365, V(0.6, 1.65, 1.6), V(0, 1.7, 7)], // standing on the slab
    [0.43, V(0.6, 1.65, 1.6), V(-4, 2.2, -6)], // walls slam up around you
    [0.48, V(-9, 6.5, 15), V(2, 4, -2)],
    [0.74, V(-9, 7, 15), V(1, 3, 0)],
    [0.86, V(-9, 7, 15), V(1, 3, 0)],         // (orbit takes over here)
    [0.885, V(0.9, 1.9, 10.5), V(0.6, 1.6, 4)], // at the front door
    [0.93, V(1.5, 3, 15), V(0.5, 2, 3)],
    [1.00, V(-26, 46, 58), V(0, 0, 2)],       // rocket up over the neighborhood
  ];
  const shotAt = p => {
    let i = 0; while (i < SHOTS.length - 2 && p > SHOTS[i + 1][0]) i++;
    const [p0, a0, l0] = SHOTS[i], [p1, a1, l1] = SHOTS[i + 1];
    const t = ease(seg(p, p0, p1));
    return { pos: a0.clone().lerp(a1, t), look: l0.clone().lerp(l1, t) };
  };
  const camPose = p => {
    let { pos, look } = shotAt(p);
    // stand on the slab and turn to face each wall as it slams up
    const onSlab = ease(seg(p, 0.35, 0.362)) * (1 - ease(seg(p, 0.47, 0.49)));
    if (onSlab > 0) {
      const T = [V(0, 1.4, 4), V(0, 1.4, -4), V(-5, 1.4, 0), V(5, 1.4, 0)];
      let lk = T[0].clone();
      for (let i = 1; i < 4; i++) lk.lerp(T[i], ease(seg(p, 0.36 + i * 0.03 - 0.014, 0.36 + i * 0.03 + 0.004)));
      pos.lerp(V(0.3, 1.65, 0.3), onSlab); look.lerp(lk, onSlab);
    }
    // ride along with the crane while it sets trusses
    const ride = ease(seg(p, 0.5, 0.53)) * (1 - ease(seg(p, 0.72, 0.745)));
    if (ride > 0) {
      const hp = hook.position;
      const toHouse = V(-hp.x, 0, -hp.z).normalize();
      const side = V(-toHouse.z, 0, toHouse.x);
      const rp = hp.clone().add(side.multiplyScalar(7)).add(toHouse.multiplyScalar(-4)).add(V(0, 1.5, 0));
      const rl = hp.clone().add(V(0, -2.2, 0));
      pos.lerp(rp, ride); look.lerp(rl, ride);
    }
    // time-lapse spin around the house while the skin goes on
    const spin = ease(seg(p, 0.74, 0.76)) * (1 - ease(seg(p, 0.855, 0.875)));
    if (spin > 0) {
      const a = 2.3 + seg(p, 0.745, 0.865) * Math.PI * 2;
      pos.lerp(V(Math.cos(a) * 17, 6.5, Math.sin(a) * 17), spin);
      look.lerp(V(0, 2.6, 0), spin);
    }
    // a camera operator's slow, slight drift (never a game-style jolt)
    pos.add(V(Math.sin(p * 37) * 0.06, Math.sin(p * 29 + 1.3) * 0.04, Math.cos(p * 23) * 0.05));
    return { pos, look };
  };

  /* ---------- update ---------- */

  const skyCol = new THREE.Color();
  function update(p) {
    p = clamp(p);
    const real = ease(seg(p, 0.17, 0.25)); // blueprint -> real world

    // sky and time of day
    const dusk = ease(seg(p, 0.84, 1));
    skyCol.copy(DAY).lerp(DUSK, ease(seg(p, 0.86, 0.94)));
    skyCol.lerp(NIGHT, ease(seg(p, 0.93, 1)) * 0.8);
    skyCol.lerp(NAVY, 1 - real);
    // the sun moves through the afternoon and sets for the finale
    const elev = lerp(48, 30, seg(p, 0.2, 0.84)) - 25 * ease(seg(p, 0.84, 1)) + 1;
    const az = lerp(160, 250, p);
    setSun(elev, az);
    sky.visible = real > 0.02;
    scene.background = real > 0.5 ? null : NAVY;
    const fogCol = new THREE.Color('#B8CBDD').lerp(new THREE.Color('#D99A74'), ease(seg(p, 0.86, 0.95))).lerp(new THREE.Color('#2C2D45'), ease(seg(p, 0.94, 1)));
    scene.fog.color.copy(fogCol);
    scene.fog.near = lerp(400, 120, real); scene.fog.far = lerp(800, 520, real);
    sun.position.copy(sunDir).multiplyScalar(70);
    sun.intensity = lerp(5.0, 1.6, dusk) * real * clamp((elev + 2) / 8);
    sun.color.set(new THREE.Color('#FFF3E2').lerp(new THREE.Color('#FF9A55'), ease(seg(p, 0.84, 0.97))));
    scene.environment = p > 0.9 ? ENV_DUSK : ENV_DAY;
    hemi.intensity = lerp(0.35, 0.15, dusk) * lerp(0.6, 1, real);
    scene.environmentIntensity = lerp(1.1, 0.7, dusk) * lerp(0.5, 1, real);
    renderer.toneMappingExposure = lerp(0.62, 0.7, dusk);

    // 1-2. blueprint paper, survey and the plan drawing themselves
    paperMat.opacity = 1 - real;
    paper.visible = paperMat.opacity > 0.01;
    const ink = 1 - ease(seg(p, 0.2, 0.3));
    inkMat.opacity = ink;
    plan.count = Math.max(0, Math.floor(planCount * ease(seg(p, 0.07, 0.16))));
    plan.visible = ink > 0.01 && plan.count > 0;
    titleMat.opacity = ease(seg(p, 0.02, 0.06)) * (1 - real);
    north.material.opacity = titleMat.opacity;
    const sv = ease(seg(p, 0.015, 0.07));
    survey.visible = p < 0.34;
    for (const st of stringBatch) {
      st.s.scale.y = st.len * sv + 0.0001;
      st.s.position.set(lerp(st.x1, (st.x1 + st.x2) / 2, sv), 0.6, lerp(st.z1, (st.z1 + st.z2) / 2, sv));
    }

    // the world rises out of the paper
    for (const r of risers) {
      const t = seg(p, 0.17 + r.delay * 0.07, 0.2 + r.delay * 0.07);
      const f = t <= 0 ? 0.0001 : t >= 1 ? 1 : Math.max(0.0001, backOut(t));
      r.o.scale.y = r.sy * f; r.o.position.y = r.y0 * f;
      r.o.visible = t > 0;
    }

    // 3. permit sign rises, then gets stamped
    sign.position.y = lerp(-3.2, 0, ease(seg(p, 0.2, 0.23)));
    const want = p > STAMP_AT ? stampedMap : plainMap;
    if (boardMat.map !== want) { boardMat.map = want; boardMat.needsUpdate = true; }

    // 4a. mixer backs in, pours, leaves
    const tin = ease(seg(p, 0.26, 0.29)), tout = ease(seg(p, 0.345, 0.37));
    truck.position.set(-1.4, 0, lerp(32, 9.2, tin) + lerp(0, 30, tout));
    truck.visible = p > 0.25 && p < 0.38;
    drum.rotation.x = p * 160;
    pour.visible = p > 0.29 && p < 0.34;
    const fill = ease(seg(p, 0.29, 0.34));
    slab.scale.set(10.5, 0.3 * fill + 0.0001, 8.5);
    slab.position.y = 0.15 * fill;
    slab.material = p > 0.42 ? mat.concrete : mat.wetConcrete;
    forms.visible = p > 0.2 && p < 0.4;
    slab.visible = fill > 0.001;

    // 4b. walls slam up
    walls.forEach((w, i) => {
      const t0 = 0.36 + i * 0.03;
      const t = seg(p, t0, t0 + 0.035);
      w.g.visible = p > 0.34 + i * 0.03;
      w.tilt.rotation.x = lerp(-Math.PI / 2, 0, ease(t));
      w.sheath.scale.y = ease(seg(p, 0.76 + i * 0.012, 0.78 + i * 0.012)) + 0.0001;
      w.siding.scale.y = ease(seg(p, 0.81 + i * 0.01, 0.83 + i * 0.01)) + 0.0001;
      w.extras.visible = p > 0.83;
    });

    // 4c. crane sets the trusses
    trusses.forEach(tr => (tr.g.visible = p > 0.2 && p < 0.84)); // hidden once the roof is closed in
    placeCrane(craneState(p));

    // 4d. roof deck and shingles, eave to ridge
    deckStrips.forEach((st, i) => { st.scale.z = slopeLen / 4 * ease(seg(p, 0.77 + (i % 4) * 0.01, 0.78 + (i % 4) * 0.01)) + 0.0001; });
    shingleStrips.forEach((st, i) => { st.scale.z = slopeLen / 4 * ease(seg(p, 0.81 + (i % 4) * 0.012, 0.82 + (i % 4) * 0.012)) + 0.0001; });
    fascia.visible = p > 0.82;
    gables.forEach(g => (g.scale.y = ease(seg(p, 0.81, 0.84)) + 0.0001));
    chimney.visible = p > 0.84;
    finish.visible = p > 0.835;
    finish.position.y = finish.visible ? -0.4 * (1 - ease(seg(p, 0.835, 0.86))) : 0;
    newLawnMat.opacity = ease(seg(p, 0.84, 0.88));
    newLawn.visible = newLawnMat.opacity > 0.01;
    coachMat.emissiveIntensity = ease(seg(p, 0.875, 0.92)) * 3;

    // dust
    for (const e of events) {
      const u = seg(p, e.t, e.t + 0.025);
      e.g.visible = u > 0 && u < 1;
      if (!e.g.visible) continue;
      e.balls.forEach(b => {
        b.position.copy(e.userDir || b.userData.dir).multiplyScalar(u * 1.8 * e.size);
        b.scale.setScalar((0.25 + u * 1.1) * e.size);
        b.material.opacity = (1 - u) * 0.55;
      });
    }

    // workers
    animateWorkers(p);
    workerGroup.visible = p > 0.2 && p < 0.835;
    const drive1 = ((p * 3.2) % 1), drive2 = ((p * 2.4 + 0.5) % 1);
    movers[0].position.set(lerp(-110, 110, drive1), 0, 18.6); movers[0].rotation.y = 0;
    movers[1].position.set(lerp(110, -110, drive2), 0, 21.4); movers[1].rotation.y = Math.PI;
    carGroup.visible = real > 0.3;
    blades.visible = real > 0.3;
    pathLightMat.emissiveIntensity = ease(seg(p, 0.875, 0.92)) * 3;
    headMat.emissiveIntensity = 0.2 + dusk * 2.5; tailMat.emissiveIntensity = 0.3 + dusk * 2;

    // 5. lights on
    const lights = ease(seg(p, 0.875, 0.92));
    mat.glass.emissiveIntensity = lights * 1.9;
    interior.intensity = lights * 70;
    porch.intensity = lights * 14;
    mat.beacon.emissiveIntensity = 0.3 + dusk * 3;
    beaconLight.intensity = dusk * 6;
    lamps.forEach(l => { l.head.material.emissiveIntensity = dusk * 3.5; l.light.intensity = dusk * 45; });

    const { pos, look } = camPose(p);
    camera.position.copy(pos); camera.lookAt(look);
    grain.uniforms.time.value = p * 100;
    composer.render();
  }

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  let gtao = null;

  const bloom = new UnrealBloomPass(new THREE.Vector2(16, 9), 0.22, 0.5, 0.92); composer.addPass(bloom);
  const grain = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, time: { value: 0 }, amount: { value: 0.035 }, vignette: { value: 0.32 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float time, amount, vignette; varying vec2 vUv;
      float rnd(vec2 c){ return fract(sin(dot(c, vec2(12.9898, 78.233)) + time) * 43758.5453); }
      void main(){
        vec4 c = texture2D(tDiffuse, vUv);
        c.rgb += (rnd(vUv * 900.0) - 0.5) * amount;
        float d = distance(vUv, vec2(0.5));
        c.rgb *= 1.0 - vignette * smoothstep(0.35, 0.85, d);
        gl_FragColor = c;
      }`,
  });
  composer.addPass(grain);
  composer.addPass(new OutputPass());

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 62 : w / h < 1.2 ? 52 : w / h < 1.5 ? 46 : 40;
    camera.updateProjectionMatrix();
  }
  resize();
  return { update, resize };
}
