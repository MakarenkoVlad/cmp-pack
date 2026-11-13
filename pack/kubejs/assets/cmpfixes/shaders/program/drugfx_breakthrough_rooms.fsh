#version 150
#moj_import <cmpfixes_drugfx.glsl>
#moj_import <cmpfixes:drugfx_breakthrough.glsl>

// The DMT breakthrough set piece (S7 of docs/design/addictives-fx-design.md; cmpfixes/ADDICTIVES.md, "FX DMT set piece"),
// its rooms at half size (R-10). Our own work for the CMP pack. The folds and lines are snapped to the effect pixel of the
// full-size picture (InSize is its size), so every effect pixel is one sample however large the screen: at half size
// that is the same picture for a quarter of the work. drugfx_breakthrough then puts the rooms in place, effect pixel by
// effect pixel, over the full-size frame. Out (rgb):
//   rise        the pulled world streaking toward the centre (a zoom blur, its bright parts most), the composite mixes it in
//   hex hall    a corridor toward the centre whose walls are hexagon cells, each the world (the wall of colours, what
//               stands before it) folded twelve ways; amber and violet, dark violet cell edges and the hall's corners,
//               amber halos, the end of the hall a warm light; the hall moves past (times the motion)
//   spiral      the world in log-polar tiles, six teal arms and magenta rings twisting into a light, flowing in
//   temple      the world folded 24 ways round the centre, the flower of life in gold over a darker medallion, white
//               petals; at the end it falls into the centre, smaller and turning faster, with a bright rim
// Colours are a three-colour gradient map in six dithered steps with 30% of the world's own (pixel art); lines stay under
// 0.48 of contrast, times fxPatterns, a little brighter on each heartbeat; motion (the pull, the turning, the flow) is
// times fxM.
//   CmpScene.x  seconds since the breakthrough's window opened (0 to 17)

uniform sampler2D DiffuseSampler;
uniform vec4 CmpScene;

in vec2 texCoord;

out vec4 fragColor;

// The world through a fold: a point in centred coordinates, mirrored at the screen's edges.
vec3 world(vec2 at) {
    return texture(DiffuseSampler, btMirror(btUv(at))).rgb;
}

// A gradient map of the luminance onto three colours in six dithered steps (pixel art), with keep of the world's own.
vec3 grade(vec3 c, vec3 dark, vec3 mid, vec3 light, float bayer, float keep) {
    float l = clamp(fxLuma(c) * 1.15, 0.0, 1.0);
    float q = clamp(floor(l * 6.0 + bayer) / 6.0, 0.0, 1.0);
    vec3 low = mix(dark, mid, clamp(q * 2.0, 0.0, 1.0));
    vec3 g = mix(low, light, clamp(q * 2.0 - 1.0, 0.0, 1.0));
    return mix(g, c, keep);
}

void main() {
    float t = CmpScene.x;
    float m = fxM();
    float pat = fxPatterns();
    // The full-size picture's effect pixel this texel lies in: its centre, and its Bayer threshold.
    vec2 effect = vec2(max(CmpComfort.z, 1.0));
    vec2 cell = floor(texCoord * InSize / effect);
    float bayer = fxBayer(cell);
    vec2 p = btP((cell + 0.5) * effect / InSize);
    vec2 soft = btP(texCoord);
    float rn = btOut(p);
    float room = btRoom(t, rn, bayer);
    vec3 c = vec3(0.0);
    float lines = 0.0;
    vec3 lineColour = vec3(1.0);
    if (room < 0.5) {
        // The rise: the pulled world streaks toward the centre (a zoom blur along the pull, times the motion).
        float pull = btPull(t);
        vec2 from = btUv(btPulled(soft, t, m));
        vec2 toCentre = vec2(0.5) - from;
        vec3 sum = vec3(0.0);
        vec3 rays = vec3(0.0);
        float weights = 0.0;
        // Each texel starts its samples a Bayer step apart: the streak dithers instead of showing eight copies.
        float jitter = fxBayer(floor(gl_FragCoord.xy)) - 0.5;
        for (int i = 0; i < 8; i++) {
            float k = clamp((float(i) + jitter) / 7.0, 0.0, 1.0);
            vec3 s = texture(DiffuseSampler, btMirror(from + toCentre * k * (0.02 + 0.3 * pull * m))).rgb;
            float w = 1.0 - 0.6 * k;
            sum += s * w;
            rays += max(s - vec3(0.72), vec3(0.0)) * w;
            weights += w;
        }
        c = sum / weights + rays * 0.3 * pull * vec3(1.0, 0.86, 1.08);
    } else if (room < 1.5) {
        // The hex hall.
        vec2 id;
        vec4 h = btHall(p, t, m, id);
        float spin = 0.25 * t * m + fxHash(id) * BT_TAU;
        vec2 at = btFold(h.xy, 6.0, spin) * 0.62 + vec2(-0.22, -0.05) + 0.04 * m * vec2(sin(t * 0.7), cos(t * 0.5));
        c = grade(world(at), vec3(0.07, 0.01, 0.16), vec3(0.52, 0.12, 0.7), vec3(1.0, 0.7, 0.22), bayer, 0.3);
        float fog = btSmooth(2.6, 9.0, h.z);
        c = mix(c, vec3(1.0, 0.86, 0.62), fog * 0.8);
        float edge = btLine(max(h.w, 0.0), 0.06) * (1.0 - fog);
        float corner = btLine(btHallCorner(p), 0.025) * (1.0 - fog);
        lines = max(edge, corner * 0.8);
        lineColour = vec3(0.24, 0.05, 0.4);
        c += vec3(1.0, 0.52, 0.14) * exp(-max(h.w, 0.0) * 16.0) * (1.0 - fog) * 0.16 * pat;
        c += vec3(1.0, 0.8, 0.52) * exp(-length(soft) * 9.0) * 0.3;
    } else if (room < 2.5) {
        // The spiral corridor.
        vec3 sp = btSpiral(p, t, m);
        vec2 at = (btMirror(sp.xy) - 0.5) * vec2(0.95, 0.5) + vec2(0.05, -0.08);
        c = grade(world(at), vec3(0.05, 0.02, 0.1), vec3(0.72, 0.1, 0.56), vec3(0.3, 0.92, 0.85), bayer, 0.3);
        float fog = btSmooth(0.17, 0.03, sp.z);
        c = mix(c, vec3(0.75, 1.0, 0.95), fog * 0.8);
        float armDistance = abs(fract(sp.x + 0.5) - 0.5);
        float arm = btLine(armDistance, 0.06);
        float ring = btLine(abs(fract(sp.y + 0.5) - 0.5), 0.05);
        lines = max(arm, ring * 0.6) * (1.0 - fog);
        lineColour = mix(vec3(0.95, 0.25, 0.75), vec3(0.3, 1.0, 0.9), arm);
        c += vec3(0.12, 0.9, 0.8) * exp(-armDistance * 13.0) * 0.17 * pat * btSmooth(0.03, 0.2, sp.z);
        c += vec3(0.62, 1.0, 0.95) * exp(-sp.z * 9.0) * 0.42;
    } else if (room < 3.5) {
        // The flower temple, falling into the centre at the end: smaller and turning faster.
        float fall = btFall(t);
        float spin = 0.12 * t * m + 2.5 * fall * fall * m;
        vec2 q = p * (1.0 + 3.0 * fall * fall);
        vec2 at = btFold(q, 12.0, spin) * 0.8 + vec2(0.0, -0.15);
        c = grade(world(at), vec3(0.18, 0.09, 0.02), vec3(0.92, 0.62, 0.15), vec3(1.0, 0.97, 0.88), bayer, 0.3);
        vec2 fl = btFlower(btRot(q, -0.06 * t * m) / BT_PETAL);
        float inside = 1.0 - smoothstep(BT_MEDALLION - 0.01, BT_MEDALLION + 0.01, length(q));
        float petals = step(1.5, fl.y) * inside;
        // Inside the medallion the ground is a little darker, so the gold lines stand out; the petals are lighter.
        c *= 1.0 - 0.25 * inside;
        c = mix(c, c * 0.6 + vec3(0.42, 0.38, 0.3), petals * 0.3 * pat);
        float flower = btLine(fl.x, 0.05) * mix(0.35, 1.0, inside);
        float rim = btLine(abs(length(q) - BT_MEDALLION), 0.01);
        lines = max(flower, rim);
        lineColour = mix(vec3(1.0, 0.82, 0.36), vec3(1.0, 0.97, 0.9), petals);
        c += vec3(1.0, 0.74, 0.28) * exp(-fl.x * 8.0) * 0.15 * pat * mix(0.3, 1.0, inside);
        c += vec3(1.0, 0.95, 0.8) * exp(-length(q) * 9.0) * 0.18;
        float radius = mix(1.25, -0.15, fall);
        c += vec3(1.0, 0.92, 0.75) * exp(-abs(rn - radius) * 70.0) * 1.6 * fall * (1.0 - fall);
    }
    // The lines (R-6: under 0.5 of contrast, times fxPatterns), a little brighter on each heartbeat.
    float lineAlpha = min(clamp(lines, 0.0, 1.0) * 0.4 * pat * (1.0 + 0.15 * fxPulse(0.35)), 0.48);
    c = mix(c, lineColour, lineAlpha);
    // Not mixed by the strength here: the composite's fxFinish does that once.
    fragColor = fxFinish(c, c);
}
