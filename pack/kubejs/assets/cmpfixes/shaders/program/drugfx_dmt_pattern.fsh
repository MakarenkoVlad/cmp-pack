#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The DMT look's pattern layer (S3), drawn into a half-size target that the look's composite (addictives:dmt) lays over
// the world: six scenes in turn, 7 s each in a 42-s cycle (polygons, rings, rays, hex cells, spiral, flower of life), the
// next one opening from the centre in a dithered ring over the last 2.1 s of each. Each scene splits the screen into
// regions of an 8-step palette (the composite tints the world with them, keeping its brightness: stained glass) and draws
// their borders as lines one effect pixel wide with a dithered halo. Our own work for the CMP pack
// (docs/design/addictives-fx-design.md, 3.1 S3; cmpfixes/ADDICTIVES.md, "FX intense looks").
//
// Output (data, not colour): r = (palette index + 0.5) / 8, g = how much the region tints, b = the line's cover. The
// composite undoes what fxFinish did to it (the comedown drain and the kick are known there). Every phase of motion is an
// oscillation times fxM() (R-1, R-5); the scene clock and the palette steps use fract(Time / 42) and are colour, not
// motion. The pattern is computed once per effect pixel (R-8): this pass is half size, so the effect pixel comes from
// InSize, the screen's size.

uniform sampler2D DiffuseSampler;

in vec2 texCoord;

out vec4 fragColor;

const float SIDES[9] = float[9](6.0, 3.0, 6.0, 4.0, 8.0, 6.0, 3.0, 12.0, 6.0);

mat2 turn(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

float angleOf(vec2 p) {
    float x = p.x;
    if (abs(x) < 1e-6) x = 1e-6;
    return atan(p.y, x);
}

// p folded into one mirrored wedge of n round the centre: a kaleidoscope's symmetry.
vec2 fold(vec2 p, float n) {
    float seg = FX_TAU / n;
    float a = abs(mod(angleOf(p) + 0.5 * seg, seg) - 0.5 * seg);
    return vec2(cos(a), sin(a)) * length(p);
}

// The offset of h from its nearest point of a hexagonal lattice of spacing 1.
vec2 hexOffset(vec2 h) {
    vec2 grid = vec2(1.0, 1.7320508);
    vec2 a = mod(h, grid) - 0.5 * grid;
    vec2 b = mod(h - 0.5 * grid, grid) - 0.5 * grid;
    vec2 g = b;
    if (dot(a, a) < dot(b, b)) g = a;
    return g;
}

// Each scene gives x: the distance (screen heights) to its nearest line, y: the region's palette index, z: how much the
// region tints (some regions stay plain, so the world shows through).

// 0: nine polygons turning their own ways; a region's colour is how many of them hold it (stars where they cross).
vec3 polygons(vec2 p, float m, float breathe) {
    float r = length(p);
    float a = angleOf(p);
    float best = 1e3;
    float inside = 0.0;
    for (int k = 0; k < 9; k++) {
        float fk = float(k);
        float seg = FX_TAU / SIDES[k];
        float dir = 1.0 - 2.0 * mod(fk, 2.0);
        float spin = dir * m * (0.5 + 0.2 * fk) * fxWave(21.0) + 0.45 * fk;
        float radius = (0.08 + 0.1 * fk) * (1.0 + 0.05 * breathe * (1.0 + 0.4 * fk));
        float edge = r * cos(mod(a + spin, seg) - 0.5 * seg) - radius;
        best = min(best, abs(edge));
        inside += step(edge, 0.0);
    }
    return vec3(best, 9.0 - inside, mod(inside, 2.0) * 0.5 + 0.5);
}

// 1: a tunnel of bands (log-spaced, crowding toward the centre), wobbling, swelling out and back.
vec3 rings(vec2 p, float m) {
    float r = max(length(p), 1e-4);
    float a = angleOf(p);
    float flow = m * (1.6 * fxWave(21.0) + 0.6 * fxWave(10.5));
    float wobble = 0.22 * sin(a * 6.0 + 2.0 * m * fxWave(14.0)) * smoothstep(0.05, 0.4, r);
    float u = log(r) * 4.0 + flow + wobble;
    float band = floor(u);
    float d = min(fract(u), 1.0 - fract(u)) * r / 4.0;
    return vec3(d, band, 0.55 + 0.45 * mod(band, 2.0));
}

// 2: sixteen wedges round a crown ring just outside the crosshair's clear spot.
vec3 rays(vec2 p, float m) {
    float r = length(p);
    float n = 16.0;
    float u = (angleOf(p) + m * 0.8 * fxWave(28.0)) / FX_TAU * n;
    float wedge = floor(u);
    float d = min(fract(u), 1.0 - fract(u)) * FX_TAU / n * r + step(r, 0.085);
    float crown = abs(r - 0.064);
    return vec3(min(d, crown), wedge, step(0.085, r) * (0.5 + 0.5 * mod(wedge, 2.0)));
}

// 3: a hexagonal hall of cells with a ring in each, folded six ways, drifting.
vec3 hexCells(vec2 p, float m) {
    vec2 q = fold(turn(m * 0.4 * fxWave(42.0)) * p, 6.0);
    float scale = 6.0;
    vec2 h = q * scale + m * vec2(0.8 * fxWave(14.0), 0.5 * fxWave(21.0));
    vec2 g = hexOffset(h);
    vec2 id = floor((h - g) * 2.0 + 0.5);
    float hexEdge = 0.5 - max(abs(g.x), dot(abs(g), vec2(0.5, 0.8660254)));
    float ring = abs(length(g) - 0.3);
    float colour = floor(fxHash(id + vec2(7.0, 3.0)) * 8.0);
    float inRing = step(length(g), 0.3);
    return vec3(min(hexEdge, ring) / scale, colour + 4.0 * (1.0 - inRing), 0.45 + 0.55 * inRing);
}

// 4: an eight-armed spiral that winds and unwinds.
vec3 spiral(vec2 p, float m) {
    float r = max(length(p), 1e-4);
    float arms = 8.0;
    float tight = 3.6;
    float u = angleOf(p) / FX_TAU * arms + log(r) * tight + m * (1.4 * fxWave(21.0) + 0.5 * fxWave(7.0));
    float arm = floor(u);
    float grad = length(vec2(arms / (FX_TAU * r), tight / r));
    float d = min(fract(u), 1.0 - fract(u)) / grad;
    float k = mod(arm, arms);
    return vec3(d, k, 0.5 + 0.5 * mod(k, 2.0));
}

// 5: the flower of life: circles as wide as the lattice round every point of a hexagonal lattice, folded six ways; a
// region's colour is how many circles hold it (petals and centres).
vec3 flower(vec2 p, float m) {
    vec2 q = fold(turn(m * 0.35 * fxWave(42.0)) * p, 6.0);
    float scale = 5.0 * (1.0 + 0.04 * m * fxWave(10.5));
    vec2 g = hexOffset(q * scale);
    float best = abs(length(g) - 1.0);
    float inside = step(length(g), 1.0);
    for (int k = 0; k < 12; k++) {
        float fk = float(k);
        float ring = step(5.5, fk);
        float ang = FX_TAU * (fk / 6.0 + ring * 0.5 / 6.0);
        vec2 o = vec2(cos(ang), sin(ang)) * mix(1.0, 1.7320508, ring);
        float l = length(g - o);
        best = min(best, abs(l - 1.0));
        inside += step(l, 1.0);
    }
    return vec3(best / scale, inside, 0.5 + 0.5 * mod(inside, 2.0));
}

vec3 sceneOf(float which, vec2 p, float m, float breathe) {
    if (which < 0.5) return polygons(p, m, breathe);
    if (which < 1.5) return rings(p, m);
    if (which < 2.5) return rays(p, m);
    if (which < 3.5) return hexCells(p, m);
    if (which < 4.5) return spiral(p, m);
    return flower(p, m);
}

void main() {
    float cellPx = max(CmpComfort.z, 1.0);
    vec2 pix = vec2(cellPx) / max(InSize, vec2(1.0));
    vec2 cell = floor(texCoord / pix);
    vec2 uv = (cell + 0.5) * pix;
    float aspect = InSize.x / max(InSize.y, 1.0);
    float px = cellPx / max(InSize.y, 1.0);
    float m = fxM();
    float bayer = fxBayer(cell);

    // The whole field turns and breathes a little (motion).
    float breathe = m * fxWave(10.5);
    vec2 p = turn(m * 0.25 * fxWave(84.0)) * ((uv - 0.5) * vec2(aspect, 1.0)) * (1.0 + 0.03 * breathe);
    float r = length(p);

    // The scene clock: six scenes of 7 s; the next opens from the centre in a dithered ring over the last 2.1 s.
    float clock = fract(Time / 42.0) * 6.0;
    float open = smoothstep(0.7, 1.0, fract(clock)) * 1.15;
    float next = step(r + (bayer - 0.5) * 0.14, open) * step(0.001, open);
    vec3 hit = sceneOf(mod(floor(clock) + next, 6.0), p, m, breathe);

    // A line one effect pixel wide (wider on a heartbeat) and a dithered halo round it.
    float width = px * (1.2 + 0.6 * fxPulse(0.3));
    float line = max(1.0 - step(width, hit.x), step(bayer, exp(-hit.x / (px * 3.0)) * 0.7) * 0.45);
    // None round the crosshair (the composite keeps that spot clear anyway), lines a little less on bright sky.
    float luma = fxLuma(texture(DiffuseSampler, uv).rgb);
    float around = smoothstep(0.03, 0.08, r);
    line *= around * (1.1 - 0.35 * luma);
    float fill = hit.z * around;
    // Come-up: the colours come first, the lines in its second half; comedown: the lines go first.
    fill *= smoothstep(0.05, 0.6, CmpPhase.x) * (1.0 - 0.6 * smoothstep(0.0, 1.0, CmpPhase.y));
    line *= smoothstep(0.25, 0.8, CmpPhase.x) * (1.0 - 0.85 * smoothstep(0.0, 1.0, CmpPhase.y));
    // The palette steps every 2.6 s, each region a quarter step after the one inside it: colours travel outward.
    float index = mod(floor(hit.y + floor(fract(Time / 42.0) * 16.0 - hit.y * 0.25)), 8.0);
    vec3 data = vec3((index + 0.5) / 8.0, clamp(fill, 0.0, 1.0), clamp(line, 0.0, 1.0));
    fragColor = fxFinish(data, data);
}
