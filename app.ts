export {};

const image = new Image();
image.src =
  "https://upload.wikimedia.org/wikipedia/en/5/5a/Twenty_One_Pilots_-_Breach.png";

await new Promise((resolve) => {
  image.onload = resolve;
});

const canvas = document.createElement("canvas");
canvas.style.width = "500px";
canvas.style.height = "500px";

const existingCanvas = document.getElementById(canvas.id);
if (existingCanvas && existingCanvas.parentElement) {
  existingCanvas.parentElement.removeChild(existingCanvas);
}

const gl = canvas.getContext("webgl")!;

const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
gl.shaderSource(
  vertexShader,
  `
  attribute vec2 a_position;

  uniform vec2 u_resolution;

  void main() {
     // convert the rectangle from pixels to 0.0 to 1.0
     vec2 zeroToOne = a_position / u_resolution;

     // convert from 0->1 to 0->2
     vec2 zeroToTwo = zeroToOne * 2.0;

     // convert from 0->2 to -1->+1 (clipspace)
     vec2 clipSpace = zeroToTwo - 1.0;

     gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`,
);
gl.compileShader(vertexShader);
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
gl.shaderSource(
  fragmentShader,
  `
  precision mediump float;

  uniform vec4 u_color;

  void main() {
     gl_FragColor = u_color;
  }
`,
);
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.useProgram(program);

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
const colorUniformLocation = gl.getUniformLocation(program, "u_color");


gl.enableVertexAttribArray(positionAttributeLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const size = 2;          // 2 components per iteration
const type = gl.FLOAT;   // the data is 32bit floats
const normalize = false; // don't normalize the data
const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
const offset = 0;        // start at the beginning of the buffer
gl.vertexAttribPointer(
    positionAttributeLocation, size, type, normalize, stride, offset);


gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);


// initial render
let x1 = 0, x2 = 200, y1 = 0, y2 = 500;
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2,
  ]), gl.STATIC_DRAW);
gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);
gl.drawArrays(gl.TRIANGLES, 0, 6);

document.getElementById("root")!.appendChild(canvas);
