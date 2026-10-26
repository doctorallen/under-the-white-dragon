'use strict';
// ---------------------------------------------------------------------------
// The last stage of a frame, on the GPU (WebGL2). The 2D canvases make the
// lit picture (View.low) and what glows (View.gl), each at the view's own
// small size; here they're uploaded and put together:
//
//   glow → half size (each pixel the average of four) → blurred both ways
//        → quarter size → blurred wider: two bloom layers
//   picture + glow + bloom, the wet ground's reflections, the fade, scaled
//   up to the screen by whole pixels
//
// Halving by averaging keeps a glow's total light the same wherever it lands
// on the grid, so the bloom holds steady as the camera moves (the 2D canvas
// downscale skips pixels instead, and its bloom flickered). Without WebGL2
// render.js finishes the frame in 2D.
// ---------------------------------------------------------------------------
const GL = {
  ok: false, g: null,
  init(cv) {
    if (/[?&]nogl\b/.test(location.search)) return null;
    const g = cv.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
    if (!g) return null;
    this.g = g;
    try { this.build(); } catch (e) { console.warn('WebGL2 setup failed, drawing in 2D', e); this.g = null; return null; }
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.ok = false; });
    cv.addEventListener('webglcontextrestored', () => { try { this.build(); this.size(this.w, this.h); } catch (e) { this.ok = false; } });
    this.ok = true;
    return g;
  },
  build() {
    const g = this.g;
    const VS = '#version 300 es\nvoid main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }';
    const prog = (fs) => {
      const p = g.createProgram();
      for (const [type, src] of [[g.VERTEX_SHADER, VS], [g.FRAGMENT_SHADER, '#version 300 es\nprecision highp float;\n' + fs]]) {
        const s = g.createShader(type); g.shaderSource(s, src); g.compileShader(s);
        if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s));
        g.attachShader(p, s);
      }
      g.linkProgram(p); if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p));
      const u = {}; const n = g.getProgramParameter(p, g.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const info = g.getActiveUniform(p, i), name = info.name.replace(/\[0\]$/, ''); u[name] = g.getUniformLocation(p, info.name); }
      return { p, u };
    };
    // halve: one filtered sample in the middle of each 2 x 2 block averages it
    this.down = prog('uniform sampler2D src; uniform vec2 size; out vec4 o; void main(){ o = vec4(texture(src, gl_FragCoord.xy / size).rgb, 1.0); }');
    // a 9-tap gaussian in five filtered samples, along one direction
    this.blur = prog(`uniform sampler2D src; uniform vec2 size; uniform vec2 dir; out vec4 o;
      void main(){ vec2 uv = gl_FragCoord.xy / size, d = dir / size;
        vec3 c = texture(src, uv).rgb * 0.227027;
        c += (texture(src, uv + d * 1.384615).rgb + texture(src, uv - d * 1.384615).rgb) * 0.316216;
        c += (texture(src, uv + d * 3.230769).rgb + texture(src, uv - d * 3.230769).rgb) * 0.070270;
        o = vec4(c, 1.0); }`);
    // the picture, its glow and bloom, the reflections, the fade
    this.comp = prog(`uniform sampler2D scene, glow, b1, b2; uniform vec2 low, b1s, b2s; uniform float scale, screenH, fade, time;
      uniform vec4 wet[4]; uniform vec2 wetk[4]; uniform int nwet; out vec4 o;
      vec3 at(vec2 p) {
        vec2 uv = (floor(p) + 0.5) / low;
        vec3 c = texture(scene, uv).rgb + texture(glow, uv).rgb;
        c += texture(b1, p / (b1s * 2.0)).rgb * 0.8 + texture(b2, p / (b2s * 4.0)).rgb * 0.55;
        return c;
      }
      void main() {
        vec2 p = vec2(gl_FragCoord.x, screenH - gl_FragCoord.y) / scale;
        vec3 c = at(p);
        for (int i = 0; i < 4; i++) {
          if (i >= nwet) break;
          vec4 w = wet[i]; float k = floor(p.y) - w.y;
          if (p.x >= w.x && p.x < w.z && k >= 0.0 && k < w.w && w.y - 1.0 - k >= 0.0) {
            float off = k > 2.0 ? floor(sin(k * 0.9 + time * 2.0 + k * k * 0.05) + 0.5) : 0.0;
            float a = wetk[i].x * (1.0 - k / wetk[i].y) * (mod(k, 2.0) > 0.5 ? 0.8 : 1.0);
            c += at(vec2(floor(p.x) + off + 0.5, w.y - 1.0 - k + 0.5)) * a;
          }
        }
        o = vec4(mix(min(c, vec3(1.0)), vec3(0.0), fade), 1.0);
      }`);
    this.vao = g.createVertexArray();
    const tex = (filter) => { const t = g.createTexture(); g.bindTexture(g.TEXTURE_2D, t); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, filter); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, filter); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE); return t; };
    this.tScene = tex(g.NEAREST); this.tGlow = tex(g.LINEAR);
    this.fb = []; for (let i = 0; i < 4; i++) { const t = tex(g.LINEAR), f = g.createFramebuffer(); this.fb.push({ t, f, w: 0, h: 0 }); }
    this.w = 0; this.h = 0;
  },
  // the view's size: the bloom targets follow it
  size(w, h) {
    const g = this.g; this.w = w; this.h = h;
    const half = [Math.ceil(w / 2), Math.ceil(h / 2)], quarter = [Math.ceil(w / 4), Math.ceil(h / 4)];
    [half, half, quarter, quarter].forEach(([fw, fh], i) => {
      const F = this.fb[i]; F.w = fw; F.h = fh;
      g.bindTexture(g.TEXTURE_2D, F.t); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, fw, fh, 0, g.RGBA, g.UNSIGNED_BYTE, null);
      g.bindFramebuffer(g.FRAMEBUFFER, F.f); g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, F.t, 0);
    });
    g.bindFramebuffer(g.FRAMEBUFFER, null);
  },
  pass(P, target, src, uniforms) {
    const g = this.g;
    g.useProgram(P.p); g.bindFramebuffer(g.FRAMEBUFFER, target ? target.f : null);
    if (target) g.viewport(0, 0, target.w, target.h); else g.viewport(0, 0, g.drawingBufferWidth, g.drawingBufferHeight);
    g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, src); g.uniform1i(P.u.src, 0);
    if (target) g.uniform2f(P.u.size, target.w, target.h);
    if (uniforms) uniforms(P.u);
    g.drawArrays(g.TRIANGLES, 0, 3);
  },
  // a frame: the picture and glow canvases, the wet strips (view px), the fade
  frame(scene, glow, wets, fade) {
    const g = this.g, V = View;
    if (this.w !== V.w || this.h !== V.h) this.size(V.w, V.h);
    g.bindVertexArray(this.vao);
    g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false); g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    g.bindTexture(g.TEXTURE_2D, this.tScene); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, g.RGBA, g.UNSIGNED_BYTE, scene);
    g.bindTexture(g.TEXTURE_2D, this.tGlow); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, g.RGBA, g.UNSIGNED_BYTE, glow);
    const [A, B, C, D] = this.fb;
    this.pass(this.down, A, this.tGlow);
    this.pass(this.blur, B, A.t, (u) => g.uniform2f(u.dir, 1, 0));
    this.pass(this.blur, A, B.t, (u) => g.uniform2f(u.dir, 0, 1));
    this.pass(this.down, C, A.t);
    this.pass(this.blur, D, C.t, (u) => g.uniform2f(u.dir, 1.6, 0));
    this.pass(this.blur, C, D.t, (u) => g.uniform2f(u.dir, 0, 1.6));
    const P = this.comp;
    g.useProgram(P.p); g.bindFramebuffer(g.FRAMEBUFFER, null); g.viewport(0, 0, g.drawingBufferWidth, g.drawingBufferHeight);
    [[this.tScene, 'scene'], [this.tGlow, 'glow'], [A.t, 'b1'], [C.t, 'b2']].forEach(([t, name], i) => { g.activeTexture(g.TEXTURE0 + i); g.bindTexture(g.TEXTURE_2D, t); g.uniform1i(P.u[name], i); });
    g.uniform2f(P.u.low, V.w, V.h); g.uniform2f(P.u.b1s, A.w, A.h); g.uniform2f(P.u.b2s, C.w, C.h);
    g.uniform1f(P.u.scale, V.out); g.uniform1f(P.u.screenH, g.drawingBufferHeight); g.uniform1f(P.u.fade, clamp(fade, 0, 1)); g.uniform1f(P.u.time, Game.t);
    const wv = new Float32Array(16), wk = new Float32Array(8); wets.slice(0, 4).forEach((w, i) => { wv.set([w.x0, w.y0, w.x1, w.depth], i * 4); wk.set([w.k, w.depth], i * 2); });
    g.uniform4fv(P.u.wet, wv); g.uniform2fv(P.u.wetk, wk); g.uniform1i(P.u.nwet, Math.min(4, wets.length));
    g.drawArrays(g.TRIANGLES, 0, 3);
    g.activeTexture(g.TEXTURE0);
  },
};
