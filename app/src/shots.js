// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample photo
// loaded; ?shot=cover shows the cover alone, full-window, at its export size.
// Query params: photo (sample name), caption, subcaption, layout, grade, size.
// window.__shotReady is set once the scene is painted with fonts loaded.
export async function runShot(query, api) {
  const shot = query.get('shot');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const subcaption = query.get('subcaption') ?? 'One last job in Vice City';
  const layout = query.get('layout') ?? 'hero';
  const grade = query.get('grade') ?? 'sunset';
  const size = query.get('size') ?? 'square';
  try {
    await api.loadSample(photo);
  } catch { /* a scene without a photo still paints */ }
  api.apply({ layout, grade, size, caption, subcaption });
  await api.ready();
}
