export async function exportHighResPng({ renderer, scene, camera, scale = 2, filename = 'disks.png', transparent = false, toast }) {
  const canvas = renderer.domElement;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  const prevPixelRatio = renderer.getPixelRatio();
  const prevClearAlpha = renderer.getClearAlpha();

  renderer.setPixelRatio(1);
  renderer.setSize(Math.max(1, Math.floor(w * scale)), Math.max(1, Math.floor(h * scale)), false);
  renderer.setClearAlpha(transparent ? 0 : 1);

  renderer.render(scene, camera);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) {
    toast?.('Falha ao exportar PNG (toBlob retornou null).');
    // restore
    renderer.setClearAlpha(prevClearAlpha);
    renderer.setPixelRatio(prevPixelRatio);
    renderer.setSize(w, h, false);
    return false;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  // restore
  renderer.setClearAlpha(prevClearAlpha);
  renderer.setPixelRatio(prevPixelRatio);
  renderer.setSize(w, h, false);

  toast?.(`Exportado: ${filename} (${scale}x)`);
  return true;
}

