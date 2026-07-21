import { unzipSync, strFromU8 } from "fflate";

/**
 * Extract first 3D mesh from a .3mf archive and return it as binary STL.
 * 3MF stores a 3dmodel.model XML (per OPC). We parse <mesh><vertices/><triangles/></mesh>.
 */
export async function threemfToStl(file: Blob): Promise<Blob> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const entries = unzipSync(buf);
  const modelKey = Object.keys(entries).find((k) => k.toLowerCase().endsWith(".model"));
  if (!modelKey) throw new Error("3MF inválido: 3dmodel.model não encontrado");
  const xml = strFromU8(entries[modelKey]);

  const verts: [number, number, number][] = [];
  const tris: [number, number, number][] = [];

  const vRe = /<vertex\s+x="([-\d.eE+]+)"\s+y="([-\d.eE+]+)"\s+z="([-\d.eE+]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = vRe.exec(xml))) {
    verts.push([parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])]);
  }
  const tRe = /<triangle\s+v1="(\d+)"\s+v2="(\d+)"\s+v3="(\d+)"/g;
  while ((m = tRe.exec(xml))) {
    tris.push([parseInt(m[1]), parseInt(m[2]), parseInt(m[3])]);
  }
  if (!verts.length || !tris.length) throw new Error("3MF sem geometria");

  // Build binary STL
  const out = new ArrayBuffer(84 + tris.length * 50);
  const dv = new DataView(out);
  dv.setUint32(80, tris.length, true);
  let o = 84;
  for (const [a, b, c] of tris) {
    const va = verts[a],
      vb = verts[b],
      vc = verts[c];
    // normal (cross product)
    const ux = vb[0] - va[0],
      uy = vb[1] - va[1],
      uz = vb[2] - va[2];
    const vx = vc[0] - va[0],
      vy = vc[1] - va[1],
      vz = vc[2] - va[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    dv.setFloat32(o, nx, true);
    dv.setFloat32(o + 4, ny, true);
    dv.setFloat32(o + 8, nz, true);
    dv.setFloat32(o + 12, va[0], true);
    dv.setFloat32(o + 16, va[1], true);
    dv.setFloat32(o + 20, va[2], true);
    dv.setFloat32(o + 24, vb[0], true);
    dv.setFloat32(o + 28, vb[1], true);
    dv.setFloat32(o + 32, vb[2], true);
    dv.setFloat32(o + 36, vc[0], true);
    dv.setFloat32(o + 40, vc[1], true);
    dv.setFloat32(o + 44, vc[2], true);
    dv.setUint16(o + 48, 0, true);
    o += 50;
  }
  return new Blob([out], { type: "model/stl" });
}

export async function loadAsStl(file: Blob, type: "stl" | "3mf"): Promise<Blob> {
  return type === "3mf" ? threemfToStl(file) : file;
}
