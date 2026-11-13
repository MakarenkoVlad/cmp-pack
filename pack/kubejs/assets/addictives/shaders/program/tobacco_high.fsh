#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The cigar look of CMP (the cigar high; docs/design/addictives-fx-design.md, 3.1 S3; cmpfixes/ADDICTIVES.md, "FX calm
// looks"). Our own work for the CMP pack, at the mod's path so its own slot shows it too when the screen framework is off.
// A slower, deeper rush than a cigarette's: a cedar grade (warm wood browns, cream light, 15% less colour, the blacks
// lifted into brown), a slow sway, and pixel smoke curling up from the bottom of the view: chunky two-effect-pixel cells in
// three shades, rising one cell every three ticks, on a field that repeats every 63 s so it never jumps.
// Reads: the picture once.

uniform sampler2D DiffuseSampler;

in vec2 texCoord;

out vec4 fragColor;

// The smoke field repeats every 28 noise cells upward: 420 rises of 1/15 of a cell in the 63-s cycle.
const float RISE_STEPS = 420.0;
const float SCALE = 1.0 / 15.0;
const float PERIOD = 28.0;

// Value noise that repeats every PERIOD cells in y (the smoke's rise wraps with the clock).
float tiled(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float y0 = mod(i.y, PERIOD);
    float y1 = mod(i.y + 1.0, PERIOD);
    float a = fxHash(vec2(i.x, y0));
    float b = fxHash(vec2(i.x + 1.0, y0));
    float c = fxHash(vec2(i.x, y1));
    float d = fxHash(vec2(i.x + 1.0, y1));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
    float s = clamp(fxS(), 0.0, 1.15);
    float m = fxM();
    float back = CmpPhase.y;
    vec3 clean = texture(DiffuseSampler, texCoord).rgb;

    // A slow sway (18 s, 42 s).
    vec2 uv = texCoord + vec2(fxWave(18.0), 0.4 * fxWave(42.0)) * 0.002 * m;
    vec3 c = texture(DiffuseSampler, uv).rgb;

    // The cedar grade.
    c = mix(vec3(fxLuma(c)), c, 0.85);
    float l = fxLuma(c);
    vec3 cedar = l * mix(vec3(1.18, 0.86, 0.56), vec3(1.08, 0.98, 0.84), smoothstep(0.3, 0.95, l));
    c = mix(c, cedar, 0.42);
    c *= mix(vec3(1.06, 0.95, 0.8), vec3(1.03, 0.99, 0.92), smoothstep(0.3, 0.95, l));
    c = mix(c, vec3(0.3, 0.16, 0.07), 0.12 * (1.0 - l));
    c = (c - 0.5) * 0.94 + 0.5;

    // Pixel smoke from the bottom: five curling plumes of cells two effect pixels wide, in three shades. The plumes' curls
    // and the breakup inside them rise a step every three ticks, on a cycle of 63 s that comes round seamlessly; held still
    // without motion.
    float cellPx = max(CmpComfort.z, 1.0) * 2.0;
    vec2 cell = floor(gl_FragCoord.xy / cellPx);
    vec2 grid = max(floor(OutSize / cellPx), vec2(1.0));
    vec2 at = (cell + 0.5) / grid;
    float moving = step(0.5, CmpComfort.x);
    float step63 = floor(fract(Time / 63.0) * RISE_STEPS) * moving;
    float turn = FX_TAU * step63 / RISE_STEPS;
    float aspect = OutSize.x / max(OutSize.y, 1.0);
    float density = 0.0;
    for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float base = 0.1 + 0.2 * fi + 0.06 * (fxHash(vec2(fi, 3.0)) - 0.5);
        float h = at.y;
        float top = 0.3 + 0.16 * fxHash(vec2(fi, 8.0));
        // The curl: the column leans and waves more the higher it goes; whole turns of the cycle keep it seamless.
        float wave = sin(h * 13.0 - turn * (2.0 + fi) + fi * 1.7) * (0.012 + 0.05 * h) + 0.03 * h * (fxHash(vec2(fi, 5.0)) - 0.5);
        float width = (0.012 + 0.085 * h) / aspect + 0.004;
        float dx = (at.x - base - wave) / width;
        density += exp(-dx * dx) * (1.0 - smoothstep(top * 0.45, top, h)) * smoothstep(0.0, 0.03, h + 0.02);
    }
    // Break the plumes up with noise that rises with them.
    vec2 p = vec2(cell.x, cell.y - step63);
    float breakup = tiled(vec2(p.x * SCALE * 2.0, p.y * SCALE));
    density = clamp(density * (0.35 + 0.95 * breakup), 0.0, 1.0);
    float b = fxBayer(cell);
    float shade = floor(density * 3.0 + b - 0.25) / 3.0;
    shade = clamp(shade, 0.0, 1.0);
    vec3 smoke = mix(vec3(0.56, 0.55, 0.58), vec3(0.88, 0.86, 0.84), shade);
    c = mix(c, smoke, shade * 0.7 * (1.0 - 0.6 * back));

    // A warm, dim vignette in dithered steps.
    vec2 q = texCoord - 0.5;
    q.x *= OutSize.x / max(OutSize.y, 1.0);
    float edge = clamp(floor(smoothstep(0.3, 1.1, dot(q, q)) * 4.0 + fxBayer(floor(gl_FragCoord.xy / max(CmpComfort.z, 1.0)))) / 4.0, 0.0, 1.0);
    c = mix(c, c * vec3(0.62, 0.5, 0.4), 0.55 * edge);

    fragColor = fxFinish(clean, c);
}
