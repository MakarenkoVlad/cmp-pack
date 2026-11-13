// cmpfixes_drugfx.glsl: the uniform contract and the helpers of every Create: Addictives drug look of CMP
// (docs/design/addictives-fx-design.md, 2.4 to 2.6; cmpfixes/ADDICTIVES.md, "FX screen framework"). Our own work for the
// CMP pack; the screen framework (T1) owns it. Import it right after the version line of a look's fragment shader:
//
//     #version 150
//     #moj_import <cmpfixes_drugfx.glsl>
//
// It declares InSize, OutSize and the contract's uniforms: a program must not declare them again. Every look program's
// JSON uses the vertex shader "cmpfixes:drugfx_screen" (which reads OutSize), no ProjMat, and declares OutSize and the
// mandatory five with these defaults (the defaults make a look calm when the mod's own slot runs it, the fallback: strength
// from Intensity, no motion, no patterns, no glitches):
//
//     { "name": "OutSize",     "type": "float", "count": 2, "values": [ 1.0, 1.0 ] },
//     { "name": "Time",        "type": "float", "count": 1, "values": [ 0.0 ] },
//     { "name": "Intensity",   "type": "float", "count": 1, "values": [ 1.0 ] },
//     { "name": "CmpStrength", "type": "float", "count": 1, "values": [ -1.0 ] },
//     { "name": "CmpPhase",    "type": "float", "count": 4, "values": [ 1.0, 0.0, 0.0, 0.25 ] },
//     { "name": "CmpComfort",  "type": "float", "count": 4, "values": [ 0.0, 0.0, 4.0, 0.0 ] }
//
// and, only when it uses them:
//
//     { "name": "CmpEvent",  "type": "float", "count": 4, "values": [ 0.0, 0.0, 0.0, 0.0 ] }  fxBeat fxPulse fxGlitch
//                                                                                            fxGlitchSeed fxFrameSeconds fxKeep
//     { "name": "CmpCentre", "type": "float", "count": 1, "values": [ 0.035 ] }   fxCentre (0.0 for no spot in the fallback)
//     { "name": "InSize",    "type": "float", "count": 2, "values": [ 1.0, 1.0 ] } when the fragment reads InSize
//
// A uniform the JSON declares but the GLSL never reads makes the game warn; one the GLSL reads but the JSON does not
// declare stays 0. cmpfixes/test/drugfx_glsl_lint.py checks both ways. fxFinish, which every look calls last, reads the
// mandatory five.
//
// Who sets what, every frame, before the look's chain runs (cmpfixes' LookRunner):
//   Time         seconds 0 to 1260, running across chain loads and F5, stopping while a singleplayer game is paused (S1)
//   Intensity    the mod's own strength for its chains (parity); in the mod's own slot the mod sets it (its sign is its
//                ReduceFlashing there)
//   CmpStrength  the look's strength: curve x comfort strength x mixing, 0 to 1.15; -1 means "not driven by cmpfixes"
//   CmpPhase     x come-up progress, y comedown progress, z afterglow progress (each 0 to 1), w dose = amplifier / 4
//   CmpComfort   x the share of the strength that may move (wobble x Distortion Effects, 0 to 1), y 1 when flashes and
//                moving patterns are allowed, z the effect pixel in framebuffer pixels (one GUI pixel, at least 2),
//                w the dose kick 0 to 1
//   CmpEvent     x heart phase 0 to 1 (0 at a beat), y this look's glitch envelope 0 to 1 (only what the flash floor let
//                through), z its glitch seed (changes only at an admitted glitch), w the last frame's length in seconds,
//                or 1 when trails are off (low quality); 0 in the fallback, where fxKeep gives no trail either
//   CmpCentre    the clear spot round the crosshair, its radius in screen heights (the look file's "centre": true gives
//                0.035, a spot 7% of the screen's height across; 0 for none)
//   extras       look-specific uniforms through LookRunner.extra(look, name, values) (S7's CmpScene)
//
// Rules (2.6): motion terms times fxM(), colour terms times fxS() (R-1); brightness changes of 10% or more over a large
// area only from the flash floor, which the common pass draws (never from Time, a hash or floor(k * Time)) (R-2); big
// displacements only at an admitted glitch, fxGlitch() (R-3); fast changes under 10% luminance and stepped per game tick,
// fxTickNoise (R-4); every cycle fxWave(P) or fract(Time / P) with P dividing 1260 (R-5); moving stripes, rings and
// lattices under 0.5 contrast times fxPatterns() and fxCentre(uv) (R-6); trails through fxPrev and fxKeep (R-7); patterns
// and warp fields snapped to fxSnap, the world itself never pixelated more than one effect pixel (R-8); no depth samplers,
// at most 8 samplers, no ?: inside a bigger expression (R-9); heavy work in a half or quarter target (R-10).

uniform vec2 InSize;
uniform vec2 OutSize;
uniform float Time;
uniform float Intensity;
uniform float CmpStrength;
uniform vec4 CmpPhase;
uniform vec4 CmpComfort;
uniform vec4 CmpEvent;
uniform float CmpCentre;

const float FX_TAU = 6.28318530718;
// The clear spot of the owner's answer 8: a radius of 0.035 screen heights (7% across). Looks get it from CmpCentre.
const float FX_CENTRE_RADIUS = 0.035;

// Strength: CmpStrength when cmpfixes drives the look, else from the mod's Intensity.
float fxS() {
    if (CmpStrength >= 0.0) return CmpStrength;
    return clamp(abs(Intensity) * 0.8, 0.0, 1.0);
}

// Motion: warps, sways, zooms, rotations and drifts multiply by it (0 with wobble off).
float fxM() {
    return fxS() * CmpComfort.x;
}

// 1 when moving high-contrast patterns are allowed, else the cap of 0.2 on their contrast.
float fxPatterns() {
    if (CmpComfort.y > 0.5) return 1.0;
    return 0.2;
}

float fxDose() {
    return CmpPhase.w;
}

float fxKick() {
    return CmpComfort.w;
}

// The heart's phase: 0 at a beat, rising to 1 just before the next.
float fxBeat() {
    return CmpEvent.x;
}

// 1 at a beat, falling to 0 over that share of a beat.
float fxPulse(float width) {
    return clamp(1.0 - CmpEvent.x / max(width, 0.0001), 0.0, 1.0);
}

// The admitted glitch's envelope (0 unless the flash floor let one through for this look) and its seed.
float fxGlitch() {
    return CmpEvent.y;
}

float fxGlitchSeed() {
    return CmpEvent.z;
}

// The last frame's length in seconds (1 while trails are off).
float fxFrameSeconds() {
    return CmpEvent.w;
}

// How much of the last frame a trail keeps this frame when it keeps keepPerSecond of itself a second: the same length of
// trail at 30 and at 240 frames a second (R-7); 0 while trails are off (w 1) and in the mod's own slot (w 0, the fallback).
float fxKeep(float keepPerSecond) {
    if (CmpEvent.w <= 0.0) return 0.0;
    if (CmpEvent.w >= 0.99) return 0.0;
    return pow(clamp(keepPerSecond, 0.0, 1.0), CmpEvent.w);
}

// Relative luminance of a colour (Rec. 709 weights).
float fxLuma(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

// The effect pixel (one GUI pixel) in UV.
vec2 fxPix() {
    return vec2(max(CmpComfort.z, 1.0)) / max(OutSize, vec2(1.0));
}

// uv moved to the centre of its effect pixel: chunky warps and patterns.
vec2 fxSnap(vec2 uv) {
    vec2 p = fxPix();
    return (floor(uv / p) + 0.5) * p;
}

// A hash of a whole-numbered cell, 0 to 1 (integer mixing, the same on every GPU).
float fxHash(vec2 cell) {
    uvec2 v = uvec2(ivec2(floor(cell)));
    v = v * 1664525u + 1013904223u;
    v.x += v.y * 22695477u;
    v.y += v.x * 1103515245u;
    v ^= v >> 16u;
    v.x += v.y * 22695477u;
    v.y += v.x * 1103515245u;
    v ^= v >> 16u;
    return float(v.x ^ v.y) * (1.0 / 4294967295.0);
}

// Value noise: hashed cell corners, smoothly mixed.
float fxValueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = fxHash(i);
    float b = fxHash(i + vec2(1.0, 0.0));
    float c = fxHash(i + vec2(0.0, 1.0));
    float d = fxHash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Value noise that steps once per game tick (20 a second) at most, never per frame: grain and twinkles.
float fxTickNoise(vec2 cell) {
    float tick = floor(Time * 20.0);
    return fxValueNoise(cell + vec2(tick * 37.0, tick * 91.0));
}

// The 4x4 Bayer threshold of a cell, 1/32 to 31/32.
float fxBayer(vec2 cell) {
    ivec2 c = ivec2(mod(floor(cell), 4.0));
    int x0 = c.x & 1;
    int y0 = c.y & 1;
    int x1 = (c.x >> 1) & 1;
    int y1 = (c.y >> 1) & 1;
    int fine = 2 * (x0 ^ y0) + y0;
    int coarse = 2 * (x1 ^ y1) + y1;
    return (float(4 * fine + coarse) + 0.5) / 16.0;
}

// 1 where a (0 to 1) beats the Bayer threshold at the effect pixel, else 0: pixel-art fades and vignettes.
float fxDither(vec2 fragPx, float a) {
    return step(fxBayer(floor(fragPx / max(CmpComfort.z, 1.0))), a);
}

// A cycle that fits the clock: sin(2 pi Time / period); the period must divide 1260 s.
float fxWave(float period) {
    return sin(FX_TAU * fract(Time / period));
}

// The last frame from a history target, or now where that target was just made (alpha 0): no dim frame after F5, a
// resize or a load. History targets must be written with alpha 1 (fxFinish writes 1).
vec4 fxPrev(sampler2D prevSampler, vec2 uv, vec4 now) {
    vec4 last = texture(prevSampler, uv);
    if (last.a < 0.5) return now;
    return last;
}

// Comedown drain: desaturate and dim by k (0 to 1).
vec3 fxDrain(vec3 c, float k) {
    float t = clamp(k, 0.0, 1.0);
    float luma = fxLuma(c);
    return mix(c, vec3(luma), t) * (1.0 - 0.3 * t);
}

// The middle of the screen (the crosshair) in UV.
vec2 fxCentrePoint() {
    return vec2(0.5);
}

// 0 in the clear spot round the crosshair, 1 outside it, a soft edge between (CmpCentre is its radius in screen heights;
// 0 means no spot: 1 everywhere).
float fxCentre(vec2 uv) {
    if (CmpCentre <= 0.0) return 1.0;
    vec2 px = (uv - fxCentrePoint()) * OutSize;
    float d = length(px) / max(OutSize.y, 1.0);
    return smoothstep(CmpCentre, CmpCentre * 1.6, d);
}

// The mandatory last call: the look over the clean frame by its strength, the comedown drain and the kick, and a dither
// of a 255th that steps per tick. Writes alpha 1 (history targets rely on it).
vec4 fxFinish(vec3 clean, vec3 look) {
    float s = clamp(fxS(), 0.0, 1.15);
    float mixed = min(s, 1.0);
    vec3 c = mix(clean, look, mixed);
    c = fxDrain(c, 0.35 * CmpPhase.y * mixed);
    c = c * (1.0 + 0.04 * fxKick());
    float grain = fxTickNoise(floor(gl_FragCoord.xy / max(CmpComfort.z, 1.0))) - 0.5;
    c = c + grain / 255.0;
    return vec4(clamp(c, 0.0, 1.0), 1.0);
}
