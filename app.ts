import { generateKernel } from "./utils";
export {};

// constants
const ID = "canvas";
const WIDTH = 700;
const HEIGHT = 700;
const NUMBER_THINGS = 10;
const KERNEL_SIZE = 5;

// get image & canvas set up
const image = new Image();
image.crossOrigin = "anonymous";
image.src = //"https://media.istockphoto.com/id/182177931/photo/picture-frame-isolated-on-white.jpg?s=612x612&w=0&k=20&c=xJDz9mhFhEccRSnaYZCx6-HnP1LwIk3G6oyMW7LAF8E=";
  "https://upload.wikimedia.org/wikipedia/en/5/5a/Twenty_One_Pilots_-_Breach.png";

await new Promise((resolve) => {
  image.onload = resolve;
});

const canvas =
  (document.getElementById(ID) as HTMLCanvasElement) ??
  document.createElement("canvas");
canvas.id = ID;
canvas.style.width = `${WIDTH}px`;
canvas.style.height = `${HEIGHT}px`;

const gl = canvas.getContext("webgl2")!;

// shaders
const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
gl.shaderSource(
  vertexShader,
  `
  attribute vec2 a_texCoord;

  varying vec2 v_texCoord;

  void main() {
      vec2 adjusted = a_texCoord * vec2(${500 / gl.canvas.width}, ${500 / gl.canvas.height});
      gl_Position = vec4((adjusted - 0.5) * vec2(2.0, -2.0), 0, 1);
      // pass the texCoord to the fragment shader
      // the GPU will interpolate this value between points.
      v_texCoord = adjusted;
  }
`,
);
gl.compileShader(vertexShader);
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
gl.shaderSource(
  fragmentShader,
  `
  precision mediump float;

  // our texture
  uniform sampler2D u_image;


  // the texCoords passed in from the vertex shader.
  varying vec2 v_texCoord;

  uniform vec2 u_textureSize;

  float kernel[9];

  const float PI = 3.1415926535897932384626433832795;

  uniform vec3 u_things[${NUMBER_THINGS}];

  void main() {
    float w = float(u_textureSize.x);
    float h = float(u_textureSize.y);
    gl_FragColor = texture2D(u_image, v_texCoord);
    float n = 1.0;
    for (int i = 0; i < ${NUMBER_THINGS}; i++) {
      float cx = u_things[i].x;
      float cy = u_things[i].y;
      float theta = u_things[i].z;
      float xp = (v_texCoord.x - cx) * 1.5;
      float yp = (v_texCoord.y - cy) * 1.5;
      float x = cx + xp * cos(theta) - yp * sin(theta);
      float y = cy + xp * sin(theta) + yp * cos(theta);
      if (x >= 0.0 && x < 1.0 && y >= 0.0 && y < 1.0) {
        vec4 color = texture2D(u_image, vec2(x, y));
        gl_FragColor = color;
      }
    }
  }
`,
);
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.useProgram(program);

// set up image
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

// set up texcoord
const texcoordBuffer = gl.createBuffer();
const texcoordLocation = gl.getAttribLocation(program, "a_texCoord");
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
  ]),
  gl.STATIC_DRAW,
);
gl.enableVertexAttribArray(texcoordLocation); // b/c gpu stubid
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0); // configure data

// set up size
const textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
gl.uniform2f(textureSizeLocation, image.width, image.height);
console.log(image.width, image.height);

type Thing = {
  x: number;
  y: number;
  theta: number;
  vt: number;
  // timeline is 0 thru 500
  // 0-100: fading in
  // 400-500: fading out
};
const update = (thing: Thing): Thing => {
  let vt = thing.vt;
  if (Math.random() < 0.001) {
    vt *= -1;
  }
  let theta = thing.theta + vt;
  let x = thing.x + Math.sin(theta) * 0.00001;
  let y = thing.y + Math.cos(theta) * 0.00001;
  return { vt, x, y, theta };
};
const newThing = (): Thing => ({
  x: Math.random(),
  y: Math.random(),
  theta: Math.random() * Math.PI * 2,
  vt: 0.001,
});

const thingsLocation = gl.getUniformLocation(program, "u_things");

let things = Array.from({ length: NUMBER_THINGS }, () => newThing());
function run() {
  things = things.map(update);
  let values: number[] = [];
  for (var i = 0; i < things.length; i++) {
    let thing = things[i];
    if (thing.x < -0.5 || thing.y < -0.5 || thing.x > 1.5 || thing.y > 1.5) {
      let otherThing = things[0];
      thing.x = Math.random();
      thing.y = Math.random();
      things[0] = thing;
      things[i] = otherThing;
    }
    // }
    // for (const thing of things) {
    values.push(thing.x, thing.y, thing.theta);
  }
  console.log(values.length);
  gl.uniform3fv(thingsLocation, values);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(run);
}

// // document.getElementById("angle-slider")!.addEventListener("input", (event) => {
// //   const angle = parseFloat((event.target as HTMLInputElement).value);
// //   gl.uniform1f(thetaLocation, -angle);
// //   gl.uniform3fv
// //   gl.drawArrays(gl.TRIANGLES, 0, 6);
// // });

// // draw
// gl.drawArrays(gl.TRIANGLES, 0, 6);
document.getElementById("root")!.appendChild(canvas);
run();
