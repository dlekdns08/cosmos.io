import type { Score } from '../game/score.js';

export function buildShareCard(score: Score, npGained: number): string {
  const w = 1080;
  const h = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('canvas ctx');

  const bg = c.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, h);
  bg.addColorStop(0, '#11142e');
  bg.addColorStop(1, '#03040e');
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);

  for (let i = 0; i < 200; i++) {
    const sx = Math.random() * w;
    const sy = Math.random() * h;
    const sr = Math.random() * 2 + 0.3;
    c.fillStyle = `rgba(255,255,255,${Math.random() * 0.6 + 0.2})`;
    c.beginPath();
    c.arc(sx, sy, sr, 0, Math.PI * 2);
    c.fill();
  }

  c.fillStyle = '#fff';
  c.textAlign = 'center';
  c.font = 'bold 80px -apple-system, sans-serif';
  const grad = c.createLinearGradient(0, 200, w, 280);
  grad.addColorStop(0, '#7f4dff');
  grad.addColorStop(1, '#ff4d6d');
  c.fillStyle = grad;
  c.fillText('COSMOS', w / 2, 260);

  c.fillStyle = '#8c93b8';
  c.font = '28px -apple-system, sans-serif';
  c.fillText('우주의 진화를 손바닥 안에서', w / 2, 320);

  c.fillStyle = '#fff';
  c.font = 'bold 200px -apple-system, sans-serif';
  c.fillText(score.value.toLocaleString(), w / 2, 600);

  c.fillStyle = '#8c93b8';
  c.font = '32px -apple-system, sans-serif';
  c.fillText('SCORE', w / 2, 660);

  const stats = [
    { label: 'BEST', value: score.best.toLocaleString() },
    { label: 'NP', value: `+${npGained.toLocaleString()}` },
  ];
  stats.forEach((s, i) => {
    const x = w / 2 + (i === 0 ? -180 : 180);
    c.fillStyle = '#fff';
    c.font = 'bold 64px -apple-system, sans-serif';
    c.fillText(s.value, x, 820);
    c.fillStyle = '#8c93b8';
    c.font = '24px -apple-system, sans-serif';
    c.fillText(s.label, x, 860);
  });

  c.fillStyle = '#7f4dff';
  c.font = '24px -apple-system, sans-serif';
  c.fillText('COSMOS — physics merge', w / 2, h - 80);

  return canvas.toDataURL('image/png');
}

export function downloadShareCard(score: Score, npGained: number): void {
  const dataUrl = buildShareCard(score, npGained);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `cosmos-${score.value}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
