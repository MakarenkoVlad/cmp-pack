#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The LSD look of CMP (S3; docs/design/addictives-fx-design.md 3.1; cmpfixes/ADDICTIVES.md, "FX intense looks"), our own
// work at the mod's path, so its own slot runs it too. Over a 20-s come-up the colours turn first, then the world starts to
// breathe (42 s) and flow, most round the outlines of things, in chunky effect pixels; the outlines take rainbow edges in
// 8 stepped hues that travel across the screen, with a soft rainbow aura round them; a rainbow sheen drifts over
// everything and the hue wheel swings back and forth (84 s); bright things leave trails. From the second dose (amplifier
// 1) a soft hex shimmer of iridescent cells lies in the aura. The flow, the outlines and the aura come from the
// quarter-size layer cmpfixes:drugfx_lsd_flow. A spot round the crosshair stays clear (the owner's answer 8). In the
// comedown the outlines go first, then the flow, and the colours drain (fxFinish).

uniform sampler2D DiffuseSampler;
uniform sampler2D FlowSampler;
uniform sampler2D PrevSampler;

in vec2 texCoord;

out vec4 fragColor;

const vec3 RAINBOW[8] = vec3[8](
    vec3(1.00, 0.18, 0.22),
    vec3(1.00, 0.55, 0.10),
    vec3(1.00, 0.92, 0.18),
    vec3(0.45, 1.00, 0.20),
    vec3(0.10, 0.95, 0.75),
    vec3(0.20, 0.55, 1.00),
    vec3(0.62, 0.30, 1.00),
    vec3(1.00, 0.30, 0.85)
);
const mat3 TO_YIQ = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
const mat3 TO_RGB = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);

// A layer's data as it was before its fxFinish: the drain and the kick of this frame are known here.
vec3 undoFinish(vec3 c) {
    float t = clamp(0.35 * CmpPhase.y * min(clamp(fxS(), 0.0, 1.15), 1.0), 0.0, 1.0);
    vec3 v = c / (1.0 + 0.04 * fxKick());
    float k = 1.0 - 0.3 * t;
    return (v / k - t * fxLuma(v) / k) / max(1.0 - t, 0.01);
}

vec3 hueShift(vec3 c, float turns) {
    vec3 yiq = TO_YIQ * c;
    float a = turns * FX_TAU;
    yiq.yz = mat2(cos(a), sin(a), -sin(a), cos(a)) * yiq.yz;
    return TO_RGB * yiq;
}

// The tint's hue at the world's brightness.
vec3 tinted(vec3 world, vec3 tint) {
    vec3 w = TO_YIQ * world;
    vec3 t = TO_YIQ * tint;
    return TO_RGB * vec3(w.x, t.yz / max(length(t.yz), 1e-4) * (0.18 + 0.2 * (1.0 - abs(2.0 * w.x - 1.0))));
}

vec2 hexOffset(vec2 h) {
    vec2 grid = vec2(1.0, 1.7320508);
    vec2 a = mod(h, grid) - 0.5 * grid;
    vec2 b = mod(h - 0.5 * grid, grid) - 0.5 * grid;
    vec2 g = b;
    if (dot(a, a) < dot(b, b)) g = a;
    return g;
}

// The aura from the layer's packed outline-and-aura value (0.6 + 0.4 x aura on an outline, 0.55 x aura elsewhere).
float auraOf(float packed) {
    if (packed > 0.575) return (packed - 0.6) / 0.4;
    return packed / 0.55;
}

// A smooth rainbow: hue 0 to 1.
vec3 rainbowOf(float h) {
    return clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
}

void main() {
    float m = fxM();
    float spot = fxCentre(texCoord);
    float up = CmpPhase.x;
    float down = CmpPhase.y;
    float aspect = OutSize.x / max(OutSize.y, 1.0);
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);
    float bayer = fxBayer(floor(gl_FragCoord.xy / max(CmpComfort.z, 1.0)));

    // Motion: the world breathes (42 s) and flows, most round the outlines (they swim); the flow field and the aura come
    // from the quarter-size layer cmpfixes:drugfx_lsd_flow, read at the effect pixel (R-8).
    vec3 field = undoFinish(texture(FlowSampler, fxSnap(texCoord)).rgb);
    float breath = 1.0 + 0.03 * m * spot * fxWave(42.0);
    vec2 flow = (field.rg - 0.5) * 2.0;
    float swim = 0.6 + 0.8 * smoothstep(0.1, 0.5, auraOf(field.b));
    vec2 offset = flow * 0.022 * swim * m * spot * smoothstep(0.2, 0.7, up) * (1.0 - 0.5 * down);
    vec2 uv = 0.5 + (texCoord - 0.5) / breath + offset / vec2(aspect, 1.0);
    vec3 base = texture(DiffuseSampler, uv).rgb;

    // Colour: the hue wheel swings back and forth (84 s), saturation well up, a rainbow sheen drifting over everything (hue
    // only, 21 s), warm highlights.
    vec3 c = hueShift(base, 0.08 * fxWave(84.0) + 0.06 * sin(FX_TAU * (p.x * 0.6 + p.y * 0.9) + 2.0 * fxWave(42.0)));
    float luma = fxLuma(c);
    c = mix(vec3(luma), c, 1.75) + vec3(0.06, 0.03, -0.02) * smoothstep(0.55, 1.0, luma);
    c = mix(c, tinted(c, rainbowOf(0.35 * p.x + 0.5 * p.y + 0.6 * luma + fract(Time / 21.0))), 0.3);

    // Rainbow outlines on the outlines of the flowing world, in 8 stepped hues that travel (21 s), with a soft rainbow aura
    // round them that breathes (42 s); at most half way (R-6).
    float packed = undoFinish(texture(FlowSampler, fxSnap(uv)).rgb).b;
    float near = auraOf(packed);
    float allowed = fxPatterns() * spot;
    float stage = smoothstep(0.2, 0.7, up) * (1.0 - 0.75 * smoothstep(0.0, 1.0, down));
    float core = step(0.575, packed);
    float band = fract(1.4 * p.y + 0.8 * p.x + fract(Time / 21.0));
    vec3 rainbow = RAINBOW[int(floor(band * 8.0))];
    vec3 aura = rainbowOf(band + 0.5 * near);
    float glow = smoothstep(0.05, 0.4, near) * (0.75 + 0.25 * fxWave(42.0)) * (1.0 - core);
    c = mix(c, tinted(c, aura) * 1.1, glow * 0.55 * allowed * stage);
    c = mix(c, min(rainbow * 1.15 + 0.08, vec3(1.0)), core * 0.5 * allowed * stage);

    // The hex shimmer (amplifier 1 and up): a fine lattice of light in the aura round the outlines, its cells iridescent,
    // crawling.
    float dose = smoothstep(0.1, 0.4, fxDose()) * smoothstep(0.45, 0.95, up) * (1.0 - 0.8 * smoothstep(0.0, 1.0, down));
    vec2 h = fxSnap(uv) * vec2(aspect, 1.0) * 40.0 + m * vec2(0.8 * fxWave(30.0), 0.6 * fxWave(42.0));
    vec2 g = hexOffset(h);
    float border = 1.0 - step(0.08, 0.5 - max(abs(g.x), dot(abs(g), vec2(0.5, 0.8660254))));
    vec3 iris = RAINBOW[int(floor(fract(fxHash(floor((h - g) * 2.0 + 0.5)) + fract(Time / 30.0)) * 8.0))];
    float zone = smoothstep(0.1, 0.45, near) * dose * allowed;
    c = mix(c, tinted(c, iris), zone * 0.3);
    c += (iris * 0.5 + 0.5) * border * zone * 0.22;

    // Trails: the brighter of now and the last frame, fading (R-7).
    vec3 last = fxPrev(PrevSampler, texCoord, vec4(c, 1.0)).rgb;
    c = max(c, last * fxKeep(0.02) * spot);

    fragColor = fxFinish(base, mix(base, c, spot));
}
