import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function createUnitDiscGeometry(segments = 48) {
  const radialSegments = Math.max(6, Math.floor(segments));
  const geo = new THREE.CylinderGeometry(0.5, 0.5, 1, radialSegments, 1, false);
  // Keep it crisp: flat shading-esque look (no realistic materials anyway)
  geo.computeVertexNormals();
  return geo;
}

/**
 * Unit card geometry centered at origin, with size 1×1×1.
 * - X: width
 * - Y: thickness
 * - Z: height
 * Corner radius is in unit space; scale will scale the radius too.
 */
export function createUnitCardGeometry(cornerRadiusUnit = 0.06, segments = 6) {
  const seg = Math.max(1, Math.floor(segments));
  const r = Math.max(0, Math.min(0.49, cornerRadiusUnit));
  const geo = new RoundedBoxGeometry(1, 1, 1, seg, r);
  geo.computeVertexNormals();
  return geo;
}

