import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mulberry32 } from "@/lib/random";
import { makeBrain } from "../three/brainGen";
import type { ArId } from "./arCatalog";

/*
 * Real-world versions of the site's holograms, for AR. The on-screen ones are
 * points, lines and glow, which phone AR viewers can't draw, so each is
 * rebuilt from solid geometry with emissive materials, at table-top scale
 * (units are metres, base sitting on y = 0).
 */

const CYAN = "#4fe3ff";
const AMBER = "#ffb547";

// lit body plus a softer glow, so the models keep their shading in a real room
const emissive = (c: string, i = 1) =>
  new THREE.MeshStandardMaterial({ color: new THREE.Color(c).multiplyScalar(0.4), emissive: new THREE.Color(c), emissiveIntensity: i * 0.72, roughness: 0.5, metalness: 0 });

const glass = () => new THREE.MeshPhysicalMaterial({ color: "#9ef3ff", transparent: true, opacity: 0.16, roughness: 0.15, metalness: 0, side: THREE.DoubleSide });

/** Merge many small geometries into one mesh (keeps the file and draw calls small). */
function merged(geos: THREE.BufferGeometry[], mat: THREE.Material, name: string) {
  const indexed = geos.every((g) => g.index);
  const flat = geos.map((g) => {
    const n = indexed || !g.index ? g : g.toNonIndexed();
    if (n.getAttribute("uv")) n.deleteAttribute("uv");
    return n;
  });
  const m = new THREE.Mesh(mergeGeometries(flat), mat);
  m.name = name;
  return m;
}

const at = (g: THREE.BufferGeometry, x: number, y: number, z: number) => g.clone().translate(x, y, z);

/** A tiny indexed dot (an octahedron with shared vertices: 6 instead of 24). */
function dotGeometry(r: number) {
  const g = new THREE.OctahedronGeometry(r, 0);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  const m = mergeVertices(g);
  m.computeVertexNormals();
  return m;
}

/** A thin rod between two points. */
function rod(a: THREE.Vector3, b: THREE.Vector3, r: number) {
  const dir = b.clone().sub(a);
  const g = new THREE.CylinderGeometry(r, r, dir.length(), 6, 1);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  const mid = a.clone().add(b).multiplyScalar(0.5);
  return g.translate(mid.x, mid.y, mid.z);
}

const ring = (r: number, tube: number, y = 0) => new THREE.TorusGeometry(r, tube, 6, 96).rotateX(Math.PI / 2).translate(0, y, 0);

function projectorBase(group: THREE.Group, radius: number) {
  // an unlit dark plate: a lit one catches the viewer's studio light at this
  // grazing angle and turns grey; the rings carry the light instead
  const plate = new THREE.MeshBasicMaterial({ color: "#07222b" });
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.04, 0.008, 64).translate(0, 0.004, 0), plate));
  group.add(merged([ring(radius * 1.02, 0.0016, 0.009), ring(radius * 0.62, 0.0012, 0.009)], emissive(CYAN), "base-rings"));
  group.add(merged([ring(radius * 0.82, 0.001, 0.009)], emissive(AMBER), "base-accent"));
}

function core() {
  const g = new THREE.Group();
  const b = makeBrain(3400);
  const S = 0.15, lift = 0.205;
  const dot = dotGeometry(0.0032);
  const cyan: THREE.BufferGeometry[] = [];
  const amber: THREE.BufferGeometry[] = [];
  const r = mulberry32(5);
  for (let i = 0; i < b.surfaceCount; i++) {
    const p = at(dot, b.pos[i * 3] * S, b.pos[i * 3 + 1] * S + lift, b.pos[i * 3 + 2] * S);
    (r() < 0.07 ? amber : cyan).push(p);
  }
  const brain = new THREE.Group();
  brain.add(merged(cyan, emissive(CYAN), "neurons"));
  brain.add(merged(amber, emissive(AMBER), "firing"));
  // the same three-quarter view as the hero
  brain.rotation.y = -Math.PI / 2 + 0.42;
  g.add(brain);
  projectorBase(g, 0.13);
  return g;
}

function pss() {
  const g = new THREE.Group();
  const W = 0.3, D = 0.18, floors = [0.03, 0.11, 0.19];
  const edges: THREE.BufferGeometry[] = [];
  const lit: THREE.BufferGeometry[] = [];
  const dark: THREE.BufferGeometry[] = [];
  const r = mulberry32(3);
  const desk = new THREE.BoxGeometry(0.022, 0.012, 0.016);
  for (const y of floors) {
    g.add(new THREE.Mesh(new THREE.BoxGeometry(W, 0.004, D).translate(0, y, 0), glass()));
    const c = [new THREE.Vector3(-W / 2, y, -D / 2), new THREE.Vector3(W / 2, y, -D / 2), new THREE.Vector3(W / 2, y, D / 2), new THREE.Vector3(-W / 2, y, D / 2)];
    for (let k = 0; k < 4; k++) edges.push(rod(c[k], c[(k + 1) % 4], 0.0012));
    for (let cx = 0; cx < 6; cx++)
      for (let cz = 0; cz < 3; cz++) (r() < 0.45 ? lit : dark).push(at(desk, -0.11 + cx * 0.044, y + 0.009, -0.05 + cz * 0.05));
  }
  for (const [x, z] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]]) edges.push(rod(new THREE.Vector3(x, 0, z), new THREE.Vector3(x, 0.24, z), 0.001));
  g.add(merged(edges, emissive(CYAN), "frame"));
  g.add(merged(lit, emissive(AMBER), "desks-lit"));
  g.add(merged(dark, emissive("#1b6c80", 0.7), "desks"));
  return g;
}

function bites() {
  const g = new THREE.Group();
  const W = 0.18, y = 0.006;
  const grid: THREE.BufferGeometry[] = [];
  for (let k = -4; k <= 4; k++) {
    const v = (k / 4) * W;
    grid.push(rod(new THREE.Vector3(-W, y, v), new THREE.Vector3(W, y, v), 0.0007), rod(new THREE.Vector3(v, y, -W), new THREE.Vector3(v, y, W), 0.0007));
  }
  g.add(new THREE.Mesh(new THREE.BoxGeometry(W * 2, 0.004, W * 2).translate(0, 0.002, 0), emissive("#06141c", 0.4)));
  g.add(merged(grid, emissive("#1f7f96", 0.8), "streets"));
  g.add(merged([ring(0.12, 0.0016, 0.008)], emissive(AMBER), "radius-2km"));
  const r = mulberry32(42);
  const stems: THREE.BufferGeometry[] = [];
  const ok: THREE.BufferGeometry[] = [];
  const pending: THREE.BufferGeometry[] = [];
  const head = dotGeometry(0.007);
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2, d = 0.03 + Math.sqrt(r()) * 0.14;
    const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.85, h = 0.03 + r() * 0.05;
    stems.push(rod(new THREE.Vector3(x, y, z), new THREE.Vector3(x, h, z), 0.0011));
    (i % 3 === 0 ? pending : ok).push(at(head, x, h + 0.006, z));
  }
  g.add(merged(stems, emissive("#9ef3ff", 0.7), "pins"));
  g.add(merged(ok, emissive(AMBER), "approved"));
  g.add(merged(pending, emissive(CYAN), "in-review"));
  g.add(new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.02, 4).translate(0, 0.016, 0), emissive(AMBER)));
  return g;
}

function ourglass() {
  const g = new THREE.Group();
  const H = 0.3, NECK = H / 2, MAX = 0.085;
  const radius = (y: number) => 0.006 + (MAX - 0.006) * Math.pow(Math.sin((Math.min(1, Math.abs(y - NECK) / NECK) * Math.PI) / 2), 0.9);
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 48; i++) {
    const yy = 0.012 + (i / 48) * (H - 0.024);
    prof.push(new THREE.Vector2(radius(yy), yy));
  }
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 48), glass()));
  const frame: THREE.BufferGeometry[] = [ring(0.098, 0.0025, 0.006), ring(0.098, 0.0025, H - 0.006)];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.5;
    frame.push(rod(new THREE.Vector3(Math.cos(a) * 0.098, 0, Math.sin(a) * 0.098), new THREE.Vector3(Math.cos(a) * 0.098, H, Math.sin(a) * 0.098), 0.002));
  }
  frame.push(new THREE.CylinderGeometry(0.1, 0.1, 0.006, 48).translate(0, 0.003, 0), new THREE.CylinderGeometry(0.1, 0.1, 0.006, 48).translate(0, H - 0.003, 0));
  g.add(merged(frame, emissive(CYAN, 0.9), "frame"));
  // loose conversation (top) falls through the neck and settles as structure (bottom)
  g.add(new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.07, 48).rotateX(Math.PI).translate(0, NECK + 0.06, 0), emissive(CYAN, 0.8)));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, NECK - 0.03, 8).translate(0, NECK / 2 + 0.015, 0), emissive(AMBER)));
  g.add(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.05, 48).translate(0, 0.037, 0), emissive(AMBER)));
  // four "cards" (commitments, people, projects, reminders) orbiting it
  const cards: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2;
    cards.push(new THREE.BoxGeometry(0.05, 0.03, 0.002).rotateY(-a + Math.PI / 2).translate(Math.cos(a) * 0.15, 0.08 + k * 0.05, Math.sin(a) * 0.15));
  }
  g.add(merged(cards, emissive(AMBER, 0.8), "cards"));
  return g;
}

function alpenglow() {
  const g = new THREE.Group();
  const R = 0.11, C = 0.17;
  const latLon = (lat: number, lon: number, r = R) => {
    const phi = ((90 - lat) * Math.PI) / 180, th = ((lon + 180) * Math.PI) / 180;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi) + C, r * Math.sin(phi) * Math.sin(th));
  };
  g.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.99, 48, 32).translate(0, C, 0), glass()));
  const wire: THREE.BufferGeometry[] = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    const rr = R * Math.cos((lat * Math.PI) / 180);
    wire.push(new THREE.TorusGeometry(rr, 0.0008, 4, 96).rotateX(Math.PI / 2).translate(0, C + R * Math.sin((lat * Math.PI) / 180), 0));
  }
  for (let lon = 0; lon < 180; lon += 30) wire.push(new THREE.TorusGeometry(R, 0.0008, 4, 96).rotateY((lon * Math.PI) / 180).translate(0, C, 0));
  g.add(merged(wire, emissive("#1f7f96", 0.8), "globe"));
  const home = latLon(11.0, 76.96);
  const arcs: THREE.BufferGeometry[] = [];
  for (const [la, lo] of [[25.2, 55.3], [48.86, 2.35], [1.35, 103.8], [47.37, 8.54], [35.68, 139.7], [-33.87, 151.2], [40.71, -74.0], [51.5, -0.12]]) {
    const a = latLon(la, lo);
    const mid = a.clone().add(home).multiplyScalar(0.5).sub(new THREE.Vector3(0, C, 0)).normalize().multiplyScalar(R * 1.45).add(new THREE.Vector3(0, C, 0));
    arcs.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, home), 32, 0.0012, 5, false));
  }
  g.add(merged(arcs, emissive(AMBER), "leads"));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.006, 16, 12).translate(home.x, home.y, home.z), emissive(AMBER)));
  projectorBase(g, 0.1);
  return g;
}

const BUILDERS: Record<ArId, () => THREE.Group> = { core, pss, bites, ourglass, alpenglow };

/** Builds the model and returns it as binary glTF. */
export async function exportArGlb(id: ArId): Promise<ArrayBuffer> {
  const scene = new THREE.Scene();
  const model = BUILDERS[id]();
  model.name = id;
  scene.add(model);
  const out = await new GLTFExporter().parseAsync(scene, { binary: true });
  return out as ArrayBuffer;
}
