"use client";

import { useEffect, useRef, useState } from "react";

// The ambient layer: pale currents folding into one another (domain-warped noise), with thin
// filaments of light riding them. The pointer stirs a soft vortex into the flow, with no edge.
// Reduced motion renders one still frame; no WebGL falls back to a soft static wash.

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 res;
uniform float unit;
uniform float time;
uniform vec2 pointer;
uniform float calm;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / unit;

  // the pointer stirs the water: a soft vortex that twists the flow, no visible edge
  vec2 pp = pointer * res / unit;
  vec2 dv = uv - pp;
  float tw = calm * 0.7 * exp(-dot(dv, dv) * 3.0);
  float s = sin(tw), c = cos(tw);
  uv = pp + mat2(c, -s, s, c) * dv;

  // domain-warped flow: currents folding into one another
  float t = time * 0.006;
  vec2 p = uv * 0.85;
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t * 0.7));
  vec2 r = vec2(fbm(p + 2.2 * q + vec2(1.7, 9.2) + t),
                fbm(p + 2.2 * q + vec2(8.3, 2.8) - t * 0.8));
  float f = fbm(p + 2.0 * r);

  // thin bright filaments riding the currents
  float band = abs(sin(f * 7.0 + length(r) * 2.0 - time * 0.006));
  float fil = pow(1.0 - band, 5.0);
  float sheen = smoothstep(0.45, 0.95, f);

  vec3 deep  = vec3(0.702, 0.816, 0.910);  // #b3d0e8
  vec3 floor_ = vec3(0.835, 0.902, 0.957); // #d5e6f4
  vec3 pale  = vec3(0.933, 0.961, 0.984);  // #eef5fb
  vec3 col = mix(floor_, deep, smoothstep(0.25, 0.75, length(q)) * 0.55);
  col = mix(col, pale, sheen * 0.6);
  col = mix(col, vec3(1.0), fil * 0.38);

  vec2 e = frag / res;
  float vig = smoothstep(0.0, 0.32, e.y) * smoothstep(1.0, 0.7, e.y);
  col = mix(vec3(0.957, 0.973, 0.984), col, 0.45 + 0.55 * vig);
  gl_FragColor = vec4(col, 1.0);
}`;

export function StillWater({ className = "" }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) {
      setFailed(true);
      return;
    }
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "res");
    const uTime = gl.getUniformLocation(prog, "time");
    const uPointer = gl.getUniformLocation(prog, "pointer");
    const uCalm = gl.getUniformLocation(prog, "calm");
    const uUnit = gl.getUniformLocation(prog, "unit");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Render below device resolution: the light is soft, and phones stay cool.
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
    const resize = () => {
      const w = Math.max(1, Math.floor(el.clientWidth * scale));
      const h = Math.max(1, Math.floor(el.clientHeight * scale));
      if (el.width !== w || el.height !== h) {
        el.width = w;
        el.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const target = { x: 0.5, y: 0.6, calm: 0 };
    const cur = { x: 0.5, y: 0.6, calm: 0 };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = 1 - (e.clientY - r.top) / r.height;
      target.calm = e.pointerType === "mouse" ? 1 : 0.6;
    };
    const onLeave = () => (target.calm = 0);

    let raf = 0;
    let visible = true;
    const start = performance.now() - 40_000;
    const frame = (now: number) => {
      raf = 0;
      resize();
      cur.x += (target.x - cur.x) * 0.02;
      cur.y += (target.y - cur.y) * 0.02;
      cur.calm += (target.calm - cur.calm) * 0.015;
      gl.uniform2f(uRes, el.width, el.height);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uPointer, cur.x, cur.y);
      gl.uniform1f(uCalm, cur.calm);
      // One caustic cell spans at most ~460 CSS px, and about half the width on phones.
      gl.uniform1f(uUnit, Math.min(460, el.clientWidth * 0.5) * scale);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce && visible) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !document.hidden;
      if (visible && !raf && !reduce) raf = requestAnimationFrame(frame);
    });
    io.observe(el);
    const onVis = () => {
      visible = !document.hidden;
      if (visible && !raf && !reduce) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    const ro = new ResizeObserver(() => reduce && requestAnimationFrame(frame));
    ro.observe(el);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div aria-hidden className={`pointer-events-none overflow-hidden ${className}`}>
      {failed ? <div className="water-fallback absolute inset-0" /> : <canvas ref={canvas} className="absolute inset-0 h-full w-full" />}
    </div>
  );
}
