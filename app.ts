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
  age: number;
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
  let x = thing.x + Math.sin(theta) * 0.0005;
  let y = thing.y + Math.cos(theta) * 0.0005;
  let age = thing.age + 1;
  if (x < -2 || x > 3 || y < -2 || y > 3) {
    x = Math.random();
    y = Math.random();
    age = 0;
  }
  return { vt, x, y, theta, age };
};
const newThing = (): Thing => ({
  x: Math.random(),
  y: Math.random(),
  theta: Math.random() * Math.PI * 2,
  vt: 0.001,
  age: 0,
});

type Distortion = {
  x: number,
  y: number,
  radius: number,
  angle: number // radians
}
const newDistortion = (): Distortion => ({
  x: Math.random() * 0.75 + 0.125,
  y: Math.random() * 0.75 + 0.125,
  radius: 0.4,
  angle: Math.random() * Math.PI / 2,
})
// constants
const ID = "canvas";
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const NUMBER_THINGS = 100;
const KERNEL = generateKernel(1, 1, 179); // size UTB 63/101
const NUMBER_DISTORTIONS = 3;
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
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);

// shaders
const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
gl.shaderSource(
  vertexShader,
  `
  attribute vec2 a_texCoord;

  varying vec2 v_texCoord;

  void main() {
      vec2 adjusted = a_texCoord;
      gl_Position = vec4((adjusted - 0.5) * vec2(2.0, -2.0), 0, 1);
      v_texCoord = adjusted;
  }
`,
);
const movementShader = gl.createShader(gl.FRAGMENT_SHADER)!;
gl.shaderSource(
  movementShader,
  `
  precision mediump float;

  varying vec2 v_texCoord;

  uniform vec3 u_things[${NUMBER_THINGS}];
  uniform sampler2D u_image;

  const vec2 TEXTURE_SIZE = vec2(${gl.canvas.width.toFixed(1)}, ${gl.canvas.height.toFixed(1)});

  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord * vec2(1.0, -1.0));
    for (int i = 0; i < ${NUMBER_THINGS}; i++) {
      float cx = u_things[i].x;
      float cy = u_things[i].y;
      float theta = u_things[i].z;
      float xp = (v_texCoord.x - cx) * 0.7;
      float yp = (v_texCoord.y - cy) * 0.7;
      float x = cx + xp * cos(theta) - yp * sin(theta);
      float y = cy + xp * sin(theta) + yp * cos(theta);
      if (x >= 0.0 && x < 1.0 && y >= 0.0 && y < 1.0) {
        vec4 color = texture2D(u_image, vec2(x, y));
        gl_FragColor = color;
      }
    }

    float f = 1.0;
    bool done = false;
    for (float j = 0.0; j <= 1.0; j += 0.1) {
      if (j > v_texCoord.x) {
        done = true;
      }
      if (!done) {
        f = 1.0 - f;
      }
    }
    done = false;
    for (float k = 0.0; k <= 1.0; k += 0.1) {
      if (k > v_texCoord.y) {
        done = true;
      }
      if (!done) {
        f = 1.0 - f;
      }
    }

    // gl_FragColor = vec4(f, f, f, 1.0);
  }
`,
);
const distortionShader = gl.createShader(gl.FRAGMENT_SHADER)!;
gl.shaderSource(
  distortionShader,
  `
  precision mediump float;

  varying vec2 v_texCoord;

  uniform sampler2D u_image;
  // uniform float u_theta;
  uniform vec4 u_distortions[${NUMBER_DISTORTIONS}];

  const vec2 TEXTURE_SIZE = vec2(${gl.canvas.width.toFixed(1)}, ${gl.canvas.height.toFixed(1)});

  void main() {
     gl_FragColor = texture2D(u_image, v_texCoord);
    for (int i = 0; i < ${NUMBER_DISTORTIONS}; i++) {
      vec4 distortion = u_distortions[i];
      vec2 CENTER = vec2(distortion.x, distortion.y);
      float RADIUS = distortion.z;
      float THETA = distortion.a;

      float r = distance(v_texCoord, CENTER);
      if (r <= RADIUS) {
        float theta = THETA * (1.0 - r / RADIUS) * (1.0 - r / RADIUS);
        vec2 p = v_texCoord - CENTER;
        vec2 adjusted = CENTER + vec2(
          p.x * cos(theta) - p.y * sin(theta),
          p.x * sin(theta) + p.y * cos(theta)
        );
        gl_FragColor = texture2D(u_image, adjusted);
      }
    }
    // gl_FragColor = texture2D(u_image, v_texCoord);
  }
`,
);
const yBlurShader = gl.createShader(gl.FRAGMENT_SHADER)!;
gl.shaderSource(
  yBlurShader,
  `
  precision highp float;

  varying vec2 v_texCoord;

  uniform sampler2D u_image;

  const vec2 TEXTURE_SIZE = vec2(${gl.canvas.width.toFixed(1)}, ${gl.canvas.height.toFixed(1)});

  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
  }
`,
);
const xBlurShader = gl.createShader(gl.FRAGMENT_SHADER)!;
gl.shaderSource(
  xBlurShader,
  `
  precision highp float;

  varying vec2 v_texCoord;

  uniform sampler2D u_image;

  const vec2 TEXTURE_SIZE = vec2(${gl.canvas.width.toFixed(1)}, ${gl.canvas.height.toFixed(1)});

  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
      gl_FragColor = vec4(pow(gl_FragColor.rgb, vec3(1.5)) * vec3(1.5\), gl_FragColor.a);
  }
`,
);
gl.compileShader(vertexShader);
gl.compileShader(movementShader);
gl.compileShader(distortionShader);
gl.compileShader(yBlurShader);
gl.compileShader(xBlurShader);
// create movement program
const overlayProgram = gl.createProgram();
gl.attachShader(overlayProgram, vertexShader);
gl.attachShader(overlayProgram, movementShader);
gl.linkProgram(overlayProgram);
// create distortion program
const distortionProgram = gl.createProgram();
gl.attachShader(distortionProgram, vertexShader);
gl.attachShader(distortionProgram, distortionShader);
gl.linkProgram(distortionProgram);
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

// set up distortion texture & framebuffer
const distortedTexture = gl.createTexture();
const distortedFramebuffer = gl.createFramebuffer();
{
  gl.bindTexture(gl.TEXTURE_2D, distortedTexture);
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
  gl.bindFramebuffer(gl.FRAMEBUFFER, distortedFramebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    distortedTexture,
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
let distortions = Array.from({ length: NUMBER_DISTORTIONS }, () => newDistortion());

function pass1() {
  things = things.map(update);
  things.sort((a, b) => a.age - b.age);

  gl.useProgram(overlayProgram);
  gl.bindTexture(gl.TEXTURE_2D, imageTexture);
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

  // update things
  const thingsLocation = gl.getUniformLocation(overlayProgram, "u_things");
  let values: number[] = things.flatMap(thing => [thing.x, thing.y, thing.theta]);
  gl.uniform3fv(thingsLocation, values);

  // draw
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
function pass2() {
  gl.useProgram(distortionProgram);
  gl.bindTexture(gl.TEXTURE_2D, overlayTexture);
  gl.bindFramebuffer(gl.FRAMEBUFFER, distortedFramebuffer);

  // set theta
  // const thetaLocation = gl.getUniformLocation(distortionProgram, "u_theta");
  // const input = document.getElementById("angle-slider")! as HTMLInputElement;
  // gl.uniform1f(thetaLocation, parseFloat(input.value) * Math.PI / 180);

  // update distortions
  const distortionsLocation = gl.getUniformLocation(distortionProgram, "u_distortions");
  const values = distortions.flatMap(c => [c.x, c.y, c.radius, c.angle]);
  gl.uniform4fv(distortionsLocation, values);

  // draw
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
function pass3() {
  gl.useProgram(yBlurProgram);
  gl.bindTexture(gl.TEXTURE_2D, distortedTexture);
  gl.bindFramebuffer(gl.FRAMEBUFFER, yBlurFramebuffer);

  // draw
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
function pass4() {
  gl.useProgram(xBlurProgram);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, yBlurTexture);

  // draw
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function run() {
  pass1();
  pass2();
  pass3();
  pass4();
  requestAnimationFrame(run);
}

document.getElementById("root")!.appendChild(canvas);
run();
