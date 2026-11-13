#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The lean look of CMP (docs/design/addictives-fx-design.md, 3.1 S3; cmpfixes/ADDICTIVES.md, "FX calm looks"). Our own
// work for the CMP pack, at the mod's path so its own slot shows it too when the screen framework is off.
// Purple syrup: the picture wobbles slowly (12.6 s and 15 s), moving things leave trails that slide in toward the middle,
// the edges blur, the grade goes violet, and syrup gathers along the top of the view and drips down near its sides, one
// effect pixel a tick, drawn as pixel art (an outline, a shine, a bead at the head).
// Reads: the picture (five reads for the wobble and the edge blur) and the last frame (PrevSampler).

uniform sampler2D DiffuseSampler;
uniform sampler2D PrevSampler;

in vec2 texCoord;

out vec4 fragColor;

const vec3 SYRUP = vec3(0.36, 0.05, 0.47);
const vec3 SYRUP_EDGE = vec3(0.15, 0.0, 0.22);
const vec3 SYRUP_SHINE = vec3(0.78, 0.48, 0.92);
// A drip slot is nine effect pixels wide: the body its five middle columns, the bead seven.
const float SLOT = 9.0;

// The near-side share of the screen at that point across (1 at the left and right edges, 0 in the middle).
float sides(float across) {
    return 1.0 - smoothstep(0.04, 0.3, min(across, 1.0 - across));
}

// The rim's depth in effect pixels at that column: a wavy band along the top, deeper toward the sides.
float rimDepth(float column, float zone) {
    return floor(3.0 + 8.0 * zone + 4.0 * fxValueNoise(vec2(column * 0.06, 4.0)));
}

// One drip slot: x 1 when it drips, y the drip's length in effect pixels below the rim now, z how much of it is left (1,
// then dissolving to 0). Each drip runs once a 21-s cycle (420 ticks) from its own offset: it grows a pixel a tick to its
// length, hangs, then dissolves in dithered steps.
vec3 drip(float slot, float zone, float age) {
    float drips = step(1.0 - (0.07 + 0.55 * zone), fxHash(vec2(slot, 5.0)));
    float tick = floor(fract(age + fxHash(vec2(slot, 17.0))) * 420.0);
    float longest = floor(mix(6.0, 200.0, zone * zone) * (0.3 + 0.7 * fxHash(vec2(slot, 29.0))));
    float left = 1.0 - smoothstep(300.0, 410.0, tick);
    return vec3(drips, min(tick, longest), left);
}

void main() {
    float s = clamp(fxS(), 0.0, 1.15);
    float m = fxM();
    float back = CmpPhase.y;
    vec3 clean = texture(DiffuseSampler, texCoord).rgb;

    // The syrup wobble: two slow waves across the picture, the field held per effect pixel (a chunky warp).
    vec2 at = fxSnap(texCoord);
    float a = FX_TAU * fract(Time / 12.6);
    float b = FX_TAU * fract(Time / 15.0);
    vec2 wobble = vec2(sin(at.y * 5.2 + a) + 0.55 * sin(at.x * 3.1 - b), sin(at.x * 4.3 + b) + 0.55 * sin(at.y * 6.4 + a)) * 0.004;
    vec2 uv = texCoord + wobble * m;

    // Blur toward the edges: four reads round the point, reaching further out from the middle.
    vec2 q = texCoord - 0.5;
    q.x *= OutSize.x / max(OutSize.y, 1.0);
    float r2 = dot(q, q);
    float edgeBlur = smoothstep(0.1, 0.9, r2);
    vec2 reach = fxPix() * (0.75 + 2.5 * edgeBlur);
    vec3 now = texture(DiffuseSampler, uv).rgb;
    vec3 around = texture(DiffuseSampler, uv + vec2(reach.x, reach.y * 0.5)).rgb + texture(DiffuseSampler, uv - vec2(reach.x, reach.y * 0.5)).rgb
            + texture(DiffuseSampler, uv + vec2(-reach.x * 0.5, reach.y)).rgb + texture(DiffuseSampler, uv - vec2(-reach.x * 0.5, reach.y)).rgb;
    vec3 c = mix(now, around * 0.25, 0.3 + 0.5 * edgeBlur);

    // The violet grade: the hue pulled to purple at the same brightness (deep violet shadows, magenta mids, lavender
    // light), a purple haze in the darks.
    float l = fxLuma(c);
    vec3 tint = mix(vec3(0.72, 0.36, 1.0), vec3(1.04, 0.86, 1.1), smoothstep(0.1, 0.9, l));
    c = mix(c, l * tint / fxLuma(tint), 0.62);
    c = mix(c, vec3(0.32, 0.1, 0.42), 0.14 * (1.0 - l));
    c = mix(vec3(fxLuma(c)), c, 1.15);

    // Trails that slide in toward the middle: the last frame is read a little further out each frame, and only what moved
    // since leaves a trail (a still picture keeps its look at any strength).
    float mixed = min(s, 1.0);
    vec2 inward = 0.5 + (texCoord - 0.5) * (1.0 + 0.12 * fxFrameSeconds() * m);
    vec3 expected = mix(clean, c, mixed);
    vec3 last = fxPrev(PrevSampler, inward, vec4(expected, 1.0)).rgb;
    c += fxKeep(0.00000004) * (last - expected);

    // Syrup along the top and down near the sides, in effect pixels; held still without motion.
    float px = max(CmpComfort.z, 1.0);
    vec2 cell = floor(gl_FragCoord.xy / px);
    float rows = floor(OutSize.y / px);
    float columns = max(floor(OutSize.x / px), 1.0);
    float down = rows - 1.0 - cell.y;
    float age = mix(0.37, fract(Time / 21.0), step(0.5, CmpComfort.x));
    float rim = rimDepth(cell.x, sides((cell.x + 0.5) / columns));
    float slot = floor(cell.x / SLOT);
    float col = cell.x - slot * SLOT;
    float slotZone = sides((slot * SLOT + 4.5) / columns);
    vec3 d = drip(slot, slotZone, age);
    float top = rimDepth(slot * SLOT + 4.0, slotZone);
    float head = top + d.y;
    float syrup = 0.0;
    vec3 colour = SYRUP;
    if (down < rim) {
        syrup = 0.92;
        if (down >= rim - 1.0) colour = SYRUP_EDGE;
        else if (down >= rim - 2.0 && down >= 1.0) colour = mix(SYRUP, SYRUP_SHINE, 0.35);
    }
    if (d.x > 0.5 && d.y > 0.5 && down >= rim - 1.0 && down < head && fxDither(gl_FragCoord.xy, d.z) > 0.5) {
        float fromHead = head - 1.0 - down;
        bool bead = d.y > 5.0 && fromHead < 4.0;
        float halfWidth = 2.0;
        if (bead && fromHead > 0.5 && fromHead < 2.5) halfWidth = 3.0;
        float off = abs(col - 4.0);
        if (off <= halfWidth) {
            syrup = 0.92;
            colour = SYRUP;
            if (off > halfWidth - 0.5 || fromHead < 0.5) colour = SYRUP_EDGE;
            if (col > 4.5 - halfWidth && col < 5.5 - halfWidth && fromHead > 0.5) colour = mix(SYRUP, SYRUP_SHINE, 0.6);
            if (bead && fromHead > 1.5 && fromHead < 2.5 && col > 1.5 && col < 2.5) colour = SYRUP_SHINE;
        }
    }
    c = mix(c, colour, syrup * (1.0 - 0.5 * back));

    fragColor = fxFinish(clean, c);
}
