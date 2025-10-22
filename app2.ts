// const root = document.getElementById("root")!;
// root.innerHTML = `
//     <canvas id="shader-canvas" width="500" height="500" class="border border-gray-400 rounded shadow"></canvas>
// `;

// const canvas = document.getElementById("shader-canvas") as HTMLCanvasElement;
// const ctx = canvas.getContext("2d")!;

// type Color = { r: number; g: number; b: number };
// type Shader = (
//   get: (x: number, y: number) => Color,
//   x: number,
//   y: number,
// ) => Color;

// // Generate checkerboard as Color[][]
// function makeCheckerboard(size: number, squares: number): Color[][] {
//   const arr: Color[][] = [];
//   for (let y = 0; y < size; ++y) {
//     arr[y] = [];
//     for (let x = 0; x < size; ++x) {
//       const sx = Math.floor(x / (size / squares));
//       const sy = Math.floor(y / (size / squares));
//       const v = (sx + sy) % 2 === 0 ? 1 : 0.13;
//       arr[y][x] = { r: v * 255, g: v * 255, b: v * 255 };
//     }
//   }
//   return arr;
// }

// const SIZE = 500;
// const checkerboard = makeCheckerboard(SIZE, 10);

// function createSlider(key: string) {
//   const existing = document.getElementById(key);
//   if (existing !== null) {
//     const typed = existing as HTMLInputElement;
//     typed.oninput = () => renderShader();
//     return () => Number(typed.value) / 1000;
//   }
//   const slider = document.createElement("input");
//   slider.id = key;
//   slider.type = "range";
//   slider.min = "0";
//   slider.max = "1000";
//   document.body.appendChild(slider);
//   slider.oninput = () => renderShader();
//   return () => Number(slider.value) / 1000;
// }

// const s1 = createSlider("slider0");

// const makeShader = (CX, CY, RADIUS) => {
//   const shader: Shader = (get, x, y) => {
//     const xp = x - CX;
//     const yp = y - CY;
//     const r = Math.sqrt(xp ** 2 + yp ** 2);
//     if (r <= RADIUS) {
//       const THETA = ((-90 * Math.PI) / 180) * s1() * (r / RADIUS) ** 2;
//       const rx = CX + xp * Math.cos(THETA) - yp * Math.sin(THETA);
//       const ry = CY + xp * Math.sin(THETA) + yp * Math.cos(THETA);
//       return get(Math.round(rx), Math.round(ry));
//     } else {
//       return get(x, y);
//     }
//   };
//   return shader;
// };

// // idk the AI autocompleted these gaussian blurs and I ain't arguing lol
// const gb1: Shader = (get, x, y) => {
//   // vertical Gaussian blur
//   const radius = 30;
//   const weight = 1 / (Math.sqrt(2 * Math.PI) * radius);
//   const kernel = Array.from({ length: 2 * radius + 1 }, (_, i) =>
//     weight * Math.exp(-((i - radius) ** 2) / (2 * radius ** 2))
//   );
//   let sum = 0;
//   for (let i = 0; i < kernel.length; ++i) sum += kernel[i];
//   const norm = 1 / sum;
//   let r = 0;
//   let g = 0;
//   let b = 0;
//   for (let i = 0; i < kernel.length; ++i) {
//     const dx = i - radius;
//     const dy = 0;
//     const weight = kernel[i] * norm;
//     const color = get(x + dx, y + dy);
//     r += color.r * weight;
//     g += color.g * weight;
//     b += color.b * weight;
//   }
//   return { r, g, b };
// }

// const gb2: Shader = (get, x, y) => {
//   // vertical Gaussian blur
//   const radius = 30;
//   const weight = 1 / (Math.sqrt(2 * Math.PI) * radius);
//   const kernel = Array.from({ length: 2 * radius + 1 }, (_, i) =>
//     weight * Math.exp(-((i - radius) ** 2) / (2 * radius ** 2))
//   );
//   let sum = 0;
//   for (let i = 0; i < kernel.length; ++i) sum += kernel[i];
//   const norm = 1 / sum;
//   let r = 0;
//   let g = 0;
//   let b = 0;
//   for (let i = 0; i < kernel.length; ++i) {
//     const dx = 0;
//     const dy = i - radius;
//     const weight = kernel[i] * norm;
//     const color = get(x + dx, y + dy);
//     r += color.r * weight;
//     g += color.g * weight;
//     b += color.b * weight;
//   }
//   return { r, g, b };
// }

// let shaders: Shader[] = [];
// for (var i = 0; i < 20; i++) {
//   shaders.push(makeShader(Math.random() * 500, Math.random() * 500, Math.random() * 100 + 100))
// }
// // shaders = shaders.concat([gb1, gb2])
// function renderShader() {
//   const imageData = ctx.createImageData(SIZE, SIZE);
//   const data = imageData.data;

//   // initialize imageData from checkerboard
//   for (let y = 0; y < SIZE; ++y) {
//     for (let x = 0; x < SIZE; ++x) {
//       const i = (y * SIZE + x) * 4;
//       const c = checkerboard[y][x];
//       data[i] = c.r;
//       data[i + 1] = c.g;
//       data[i + 2] = c.b;
//       data[i + 3] = 255;
//     }
//   }

//   // create a copy to use as the read buffer
//   let src = new Uint8ClampedArray(data); // copies initial pixels
//   let dst = new Uint8ClampedArray(src.length);

//   const clamp = (v: number, min: number, max: number) =>
//     v < min ? min : v > max ? max : v;

//   for (const shader of shaders) {
//     // getColor reads from src (the previous pass)
//     const getColor = (x: number, y: number): Color => {
//       // clamp coordinates to edge to avoid bright sentinel color
//       const cx = clamp(x, 0, SIZE - 1);
//       const cy = clamp(y, 0, SIZE - 1);
//       const i = (cy * SIZE + cx) * 4;
//       return {
//         r: src[i],
//         g: src[i + 1],
//         b: src[i + 2],
//       };
//     };

//     // apply shader into dst
//     for (let y = 0; y < SIZE; ++y) {
//       for (let x = 0; x < SIZE; ++x) {
//         const c = shader(getColor, x, y);
//         const i = (y * SIZE + x) * 4;
//         dst[i] = c.r;
//         dst[i + 1] = c.g;
//         dst[i + 2] = c.b;
//         dst[i + 3] = 255;
//       }
//     }

//     // swap buffers for next pass
//     const tmp = src;
//     src = dst;
//     dst = tmp;
//   }

//   // write final buffer to imageData and paint once
//   imageData.data.set(src);
//   ctx.putImageData(imageData, 0, 0);
// }

// renderShader();
