import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { loadAsStl } from "@/lib/threemf";

export function Model3DViewer({
  file,
  fileType,
  onBbox,
}: {
  file: Blob;
  fileType: "stl" | "3mf";
  onBbox?: (b: { x: number; y: number; z: number }) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<() => void>(() => {});
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const mount = mountRef.current;
    if (!mount) return;

    const w = Math.max(1, mount.clientWidth || 1);
    const h = Math.max(1, mount.clientHeight || 1);

    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let mesh: THREE.Mesh | null = null;
    let raf = 0;
    let ro: ResizeObserver | null = null;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a12);

      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 5000);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h);
      mount.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const dir = new THREE.DirectionalLight(0xffffff, 1.0);
      dir.position.set(1, 2, 1);
      scene.add(dir);
      const rim = new THREE.DirectionalLight(0x66aaff, 0.5);
      rim.position.set(-1, 1, -1);
      scene.add(rim);

      const grid = new THREE.GridHelper(200, 20, 0x444466, 0x222233);
      scene.add(grid);
      const axes = new THREE.AxesHelper(50);
      scene.add(axes);

      let initialPos = new THREE.Vector3();

      (async () => {
        try {
          const stl = await loadAsStl(file, fileType);
          if (!alive) return;
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
          onBbox?.({ x: dims.x, y: dims.y, z: dims.z });

          const mat = new THREE.MeshStandardMaterial({
            color: 0xf2f5ff,
            metalness: 0.1,
            roughness: 0.6,
          });
          mesh = new THREE.Mesh(geom, mat);
          mesh.rotation.x = -Math.PI / 2;
          scene.add(mesh);

          const maxDim = Math.max(dims.x, dims.y, dims.z) || 1;
          const d = maxDim * 2;
          camera.position.set(d, d * 0.8, d);
          initialPos = camera.position.clone();
          controls?.target.set(0, 0, 0);
          controls?.update();

          grid.scale.setScalar(Math.max(1, maxDim / 50));
          axes.scale.setScalar(Math.max(1, maxDim / 50));

          resetRef.current = () => {
            camera.position.copy(initialPos);
            controls?.target.set(0, 0, 0);
            controls?.update();
          };
        } catch (e: any) {
          setErr(e?.message ?? "Falha ao carregar modelo");
        }
      })();

      const animate = () => {
        raf = requestAnimationFrame(animate);
        controls?.update();
        renderer?.render(scene, camera);
      };
      animate();

      const onResize = () => {
        const nw = Math.max(1, mount.clientWidth || 1);
        const nh = Math.max(1, mount.clientHeight || 1);
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer?.setSize(nw, nh);
      };
      ro = new ResizeObserver(onResize);
      ro.observe(mount);
    } catch (e: any) {
      setErr(e?.message ?? "Falha ao iniciar visualizador 3D");
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      controls?.dispose();
      renderer?.dispose();
      if (mesh) {
        (mesh.material as THREE.Material).dispose();
        mesh.geometry.dispose();
      }
      if (renderer?.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [file, fileType, onBbox]);

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="h-full w-full" />
      {err && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-red-300 text-sm">
          {err}
        </div>
      )}
      <button
        onClick={() => resetRef.current()}
        className="absolute bottom-3 right-3 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80 backdrop-blur hover:bg-white/20"
      >
        Resetar câmera
      </button>
    </div>
  );
}
