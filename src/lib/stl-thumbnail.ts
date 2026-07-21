import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

export type ThumbResult = { dataUrl: string; bbox: { x: number; y: number; z: number } };

/**
 * Render an STL Blob to a 512x512 PNG data URL via offscreen WebGL.
 */
export async function renderStlThumbnail(stl: Blob, size = 512): Promise<ThumbResult> {
  const buf = await stl.arrayBuffer();
  const geom = new STLLoader().parse(buf);
  geom.computeVertexNormals();
  geom.computeBoundingBox();
  const bb = geom.boundingBox!;
  const center = new THREE.Vector3();
  bb.getCenter(center);
  geom.translate(-center.x, -center.y, -center.z);
  const dims = new THREE.Vector3();
  bb.getSize(dims);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(size, size, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  const mat = new THREE.MeshStandardMaterial({ color: 0xf2f5ff, metalness: 0.15, roughness: 0.55 });
  const mesh = new THREE.Mesh(geom, mat);
  scene.add(mesh);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(1, 1.5, 1);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x66aaff, 0.6);
  rim.position.set(-1, 0.5, -1);
  scene.add(rim);

  const maxDim = Math.max(dims.x, dims.y, dims.z) || 1;
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, maxDim * 100);
  const d = maxDim * 1.8;
  camera.position.set(d, d * 0.8, d);
  camera.lookAt(0, 0, 0);

  // rotate slightly for nicer angle
  mesh.rotation.x = -Math.PI / 2;

  renderer.render(scene, camera);
  const dataUrl = canvas.toDataURL("image/png");

  // cleanup
  geom.dispose();
  mat.dispose();
  renderer.dispose();

  return { dataUrl, bbox: { x: dims.x, y: dims.y, z: dims.z } };
}
