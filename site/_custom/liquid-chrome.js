import { Renderer, Program, Mesh, Triangle } from "https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm";

/**
 * Vanilla port of React Bits LiquidChrome (ogl + WebGL).
 * @returns {() => void} cleanup
 */
export function initLiquidChrome(container, options) {
  if (!container) return function () {};

  var opts = options || {};
  var baseColor = opts.baseColor || [0.1, 0.1, 0.1];
  var speed = opts.speed != null ? opts.speed : 1;
  var amplitude = opts.amplitude != null ? opts.amplitude : 0.6;
  var frequencyX = opts.frequencyX != null ? opts.frequencyX : 2.5;
  var frequencyY = opts.frequencyY != null ? opts.frequencyY : 1.5;
  var interactive = opts.interactive !== false;

  var renderer = new Renderer({ antialias: true, alpha: true });
  var gl = renderer.gl;
  gl.clearColor(1, 1, 1, 1);

  var vertexShader =
    "attribute vec2 position;\n" +
    "attribute vec2 uv;\n" +
    "varying vec2 vUv;\n" +
    "void main() {\n" +
    "  vUv = uv;\n" +
    "  gl_Position = vec4(position, 0.0, 1.0);\n" +
    "}";

  var fragmentShader =
    "precision highp float;\n" +
    "uniform float uTime;\n" +
    "uniform vec3 uResolution;\n" +
    "uniform vec3 uBaseColor;\n" +
    "uniform float uAmplitude;\n" +
    "uniform float uFrequencyX;\n" +
    "uniform float uFrequencyY;\n" +
    "uniform vec2 uMouse;\n" +
    "varying vec2 vUv;\n" +
    "vec4 renderImage(vec2 uvCoord) {\n" +
    "  vec2 fragCoord = uvCoord * uResolution.xy;\n" +
    "  vec2 uv = (2.0 * fragCoord - uResolution.xy) / min(uResolution.x, uResolution.y);\n" +
    "  for (float i = 1.0; i < 10.0; i++){\n" +
    "    uv.x += uAmplitude / i * cos(i * uFrequencyX * uv.y + uTime + uMouse.x * 3.14159);\n" +
    "    uv.y += uAmplitude / i * cos(i * uFrequencyY * uv.x + uTime + uMouse.y * 3.14159);\n" +
    "  }\n" +
    "  vec2 diff = (uvCoord - uMouse);\n" +
    "  float dist = length(diff);\n" +
    "  float falloff = exp(-dist * 20.0);\n" +
    "  float ripple = sin(10.0 * dist - uTime * 2.0) * 0.03;\n" +
    "  uv += (diff / (dist + 0.0001)) * ripple * falloff;\n" +
    "  vec3 color = uBaseColor / abs(sin(uTime - uv.y - uv.x));\n" +
    "  return vec4(color, 1.0);\n" +
    "}\n" +
    "void main() {\n" +
    "  vec4 col = vec4(0.0);\n" +
    "  int samples = 0;\n" +
    "  for (int i = -1; i <= 1; i++){\n" +
    "    for (int j = -1; j <= 1; j++){\n" +
    "      vec2 offset = vec2(float(i), float(j)) * (1.0 / min(uResolution.x, uResolution.y));\n" +
    "      col += renderImage(vUv + offset);\n" +
    "      samples++;\n" +
    "    }\n" +
    "  }\n" +
    "  gl_FragColor = col / float(samples);\n" +
    "}";

  var geometry = new Triangle(gl);
  var program = new Program(gl, {
    vertex: vertexShader,
    fragment: fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uResolution: {
        value: new Float32Array([
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / gl.canvas.height,
        ]),
      },
      uBaseColor: { value: new Float32Array(baseColor) },
      uAmplitude: { value: amplitude },
      uFrequencyX: { value: frequencyX },
      uFrequencyY: { value: frequencyY },
      uMouse: { value: new Float32Array([0.5, 0.5]) },
    },
  });
  var mesh = new Mesh(gl, { geometry, program });

  function resize() {
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    var resUniform = program.uniforms.uResolution.value;
    resUniform[0] = gl.canvas.width;
    resUniform[1] = gl.canvas.height;
    resUniform[2] = gl.canvas.width / gl.canvas.height;
  }

  function setMouse(x, y) {
    var mouseUniform = program.uniforms.uMouse.value;
    mouseUniform[0] = x;
    mouseUniform[1] = y;
  }

  function handleMouseMove(event) {
    var rect = container.getBoundingClientRect();
    setMouse(
      (event.clientX - rect.left) / rect.width,
      1 - (event.clientY - rect.top) / rect.height
    );
  }

  function handleTouchMove(event) {
    if (!event.touches.length) return;
    var touch = event.touches[0];
    var rect = container.getBoundingClientRect();
    setMouse(
      (touch.clientX - rect.left) / rect.width,
      1 - (touch.clientY - rect.top) / rect.height
    );
  }

  window.addEventListener("resize", resize);
  if (interactive) {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
  }

  container.appendChild(gl.canvas);
  resize();

  var animationId = 0;
  function update(t) {
    animationId = requestAnimationFrame(update);
    program.uniforms.uTime.value = t * 0.001 * speed;
    renderer.render({ scene: mesh });
  }
  animationId = requestAnimationFrame(update);

  return function destroy() {
    cancelAnimationFrame(animationId);
    window.removeEventListener("resize", resize);
    if (interactive) {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    }
    if (gl.canvas.parentElement === container) {
      container.removeChild(gl.canvas);
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}

export default initLiquidChrome;
