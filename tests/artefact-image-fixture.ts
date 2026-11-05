import { PNG } from 'pngjs';

export function fakeImage(): Buffer {
  const png = new PNG({ width: 480, height: 180 });
  for (let y = 0; y < png.height; y++)
    for (let x = 0; x < png.width; x++) {
      const offset = (y * png.width + x) * 4;
      const ink = x > 24 && x < 420 && y > 35 && y < 145 && y % 24 < 9;
      png.data.set(ink ? [35, 48, 53, 255] : [248, 250, 250, 255], offset);
    }
  return PNG.sync.write(png);
}
