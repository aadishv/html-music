import { generateKernel } from "./utils";
export {};

// random things
function log<T>(v: T) {
  console.log(v);
  return v;
}

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
  let x = thing.x + Math.sin(theta) * 0.0001;
  let y = thing.y + Math.cos(theta) * 0.0001;
  return { vt, x, y, theta };
};
const newThing = (): Thing => ({
  x: Math.random(),
  y: Math.random(),
  theta: Math.random() * Math.PI * 2,
  vt: 0.001,
});

// constants
const ID = "canvas";
const WIDTH = 700;
const HEIGHT = 700;
const NUMBER_THINGS = 20;
const KERNEL = generateKernel(101, 20, 1000);
// get image & canvas set up
const image = new Image();
image.crossOrigin = "anonymous";
image.src = //"https://media.istockphoto.com/id/182177931/photo/picture-frame-isolated-on-white.jpg?s=612x612&w=0&k=20&c=xJDz9mhFhEccRSnaYZCx6-HnP1LwIk3G6oyMW7LAF8E=";
  // "http://localhost:8000/test.jpg";
  "http://localhost:8000/breach.jpg";

await new Promise((resolve) => {
  image.onload = resolve;
});

const canvas =
  (document.getElementById(ID) as HTMLCanvasElement) ??
  document.createElement("canvas");
canvas.id = ID;
canvas.width = WIDTH;
canvas.height = HEIGHT;

const gl = canvas.getContext("webgl2")!;
// shaders
const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
gl.shaderSource(
  vertexShader,
  `
  attribute vec2 a_texCoord;

  varying vec2 v_texCoord;

  void main() {
      vec2 adjusted = a_texCoord * vec2(${WIDTH / gl.canvas.width}, ${HEIGHT / gl.canvas.height});
      gl_Position = vec4((adjusted - 0.5) * vec2(2.0, -2.0), 0, 1);
      // pass the texCoord to the fragment shader
      // the GPU will interpolate this value between points.
      v_texCoord = adjusted;
  }
`,
);
gl.compileShader(vertexShader);
const movementShader = gl.createShader(gl.FRAGMENT_SHADER)!;
gl.shaderSource(
  movementShader,
  `
  precision mediump float;

  // our texture
  uniform sampler2D u_image;


  // the texCoords passed in from the vertex shader.
  varying vec2 v_texCoord;

  uniform vec2 u_textureSize;

  const float PI = 3.1415926535897932384626433832795;

  uniform vec3 u_things[${NUMBER_THINGS}];

  void main() {
    float w = float(u_textureSize.x);
    float h = float(u_textureSize.y);
    vec2 coord = v_texCoord;
    coord.y *= -1.0;
    gl_FragColor = texture2D(u_image, coord);
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
gl.compileShader(movementShader);
const yBlurShader = gl.createShader(gl.FRAGMENT_SHADER)!;
gl.shaderSource(
  yBlurShader,
  `
  precision mediump float;
  uniform sampler2D u_image;
  varying vec2 v_texCoord;
  uniform vec2 u_textureSize;
  void main() {
    vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
      vec2 offset = vec2(0.0);
      vec4 color;
      ${KERNEL.kernel
        .map(
          ({ x, value }) =>
            `
        color = texture2D(u_image, v_texCoord + vec2(0.0, ${x.toFixed(1)}) * onePixel);
        gl_FragColor += color * ${(value / KERNEL.sum).toFixed(5)};
        `,
        )
        .join("\n")}
  }
`,
);
gl.compileShader(yBlurShader);
const xBlurShader = gl.createShader(gl.FRAGMENT_SHADER)!;
gl.shaderSource(
  xBlurShader,
  `
  precision mediump float;
  uniform sampler2D u_image;
  varying vec2 v_texCoord;
  uniform vec2 u_textureSize;
  void main() {
      vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
      vec2 offset = vec2(0.0);
      vec4 color;
      ${KERNEL.kernel
        .map(
          ({ x, value }) =>
            `
        color = texture2D(u_image, v_texCoord + vec2(${x.toFixed(1)}, 0.0) * onePixel);
        gl_FragColor += color * ${(value / KERNEL.sum).toFixed(5)};
        `,
        )
        .join("\n")}
  }
`,
);
gl.compileShader(xBlurShader);
// create movement program
const overlayProgram = gl.createProgram();
gl.attachShader(overlayProgram, vertexShader);
gl.attachShader(overlayProgram, movementShader);
gl.linkProgram(overlayProgram);
// create vertical blur program
const yBlurProgram = gl.createProgram();
gl.attachShader(yBlurProgram, vertexShader);
gl.attachShader(yBlurProgram, yBlurShader);
gl.linkProgram(yBlurProgram);
// create horizontal blur program
const xBlurProgram = gl.createProgram();
gl.attachShader(xBlurProgram, vertexShader);
gl.attachShader(xBlurProgram, xBlurShader);
gl.linkProgram(xBlurProgram);
//
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);



// set up image
const imageTexture = gl.createTexture();
{
  gl.bindTexture(gl.TEXTURE_2D, imageTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}

// set up overlay texture & framebuffer
const overlayTexture = gl.createTexture();
const overlayFramebuffer = gl.createFramebuffer();
{
  gl.bindTexture(gl.TEXTURE_2D, overlayTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.canvas.width,
    gl.canvas.height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, overlayFramebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    overlayTexture,
    0,
  );
}

// set up blurY texture & framebuffer
const yBlurTexture = gl.createTexture();
const yBlurFramebuffer = gl.createFramebuffer();
{
  gl.bindTexture(gl.TEXTURE_2D, yBlurTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.canvas.width,
    gl.canvas.height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, yBlurFramebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    yBlurTexture,
    0,
  );
}


// state
let things = Array.from({ length: NUMBER_THINGS }, () => newThing());

// MARK: - program 1 specific code
function pass1() {
  things = things.map(update);

  gl.useProgram(overlayProgram);
  gl.bindTexture(gl.TEXTURE_2D, imageTexture); // TODO!: check if moving this
  gl.bindFramebuffer(gl.FRAMEBUFFER, overlayFramebuffer);

  // set up texcoord buffer
  const texcoordBuffer = gl.createBuffer();
  const texcoordLocation = gl.getAttribLocation(overlayProgram, "a_texCoord");
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
  const textureSizeLocation = gl.getUniformLocation(
    overlayProgram,
    "u_textureSize",
  );
  gl.uniform2f(textureSizeLocation, image.width, image.height);

  // update things
  const thingsLocation = gl.getUniformLocation(overlayProgram, "u_things");
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
    values.push(thing.x, thing.y, thing.theta);
  }
  gl.uniform3fv(thingsLocation, values);

  // draw
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
function pass2() {
  gl.useProgram(yBlurProgram);
  gl.bindTexture(gl.TEXTURE_2D, overlayTexture);
  gl.bindFramebuffer(gl.FRAMEBUFFER, yBlurFramebuffer);

  // set size
  const textureSizeLocation = gl.getUniformLocation(
    yBlurProgram,
    "u_textureSize",
  );
  gl.uniform2f(textureSizeLocation, gl.canvas.width, gl.canvas.height);

  // draw
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
function pass3() {
  gl.useProgram(xBlurProgram);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, yBlurTexture);

  // set size
  const textureSizeLocation = gl.getUniformLocation(
    xBlurProgram,
    "u_textureSize",
  );
  gl.uniform2f(textureSizeLocation, gl.canvas.width, gl.canvas.height);

  // draw
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// let things = Array.from({ length: NUMBER_THINGS }, () => newThing());
function run() {
  pass1();
  pass2();
  pass3();
  requestAnimationFrame(run);
}

document.getElementById("root")!.appendChild(canvas);
run();
