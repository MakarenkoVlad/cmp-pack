#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The fentanyl look of CMP (docs/design/addictives-fx-design.md, 3.1 S3; cmpfixes/ADDICTIVES.md, "FX calm looks"). Our own
// work for the CMP pack, at the mod's path so its own slot shows it too when the screen framework is off.
// Cold and heavy: blue-grey colour with a cyanotic violet at the edges, a heavy blur, the world doubled (two copies drift
// apart by up to 1.2% and back over 14 s), darkened to 65%. The eyelids are heavier than heroin's: they never quite open
// (a fifth shut at rest), and on a 42-s cycle they droop over 6.3 s until the view is almost shut, hang there for 7 s,
// lift over 1.3 s, then droop half way once more. The lids are pixel art, cold dark skin, their rim dithered.
// Reads: the picture twice (the double vision), its half-size copy (SoftSampler) and a wide blur at a quarter of the size
// (BlurSampler).

uniform sampler2D DiffuseSampler;
uniform sampler2D SoftSampler;
uniform sampler2D BlurSampler;

in vec2 texCoord;

out vec4 fragColor;

// How far the lids are shut over the 42-s cycle (0 open, 1 at the full droop): a fifth shut at rest, the long droop, a
// long hang, a lift over 1.3 s (never faster: a fast lift over the whole view would be a flash), then a half droop.
float nod(float t) {
    float rest = 0.2;
    float droop = smoothstep(0.28, 0.43, t) * (1.0 - smoothstep(0.6, 0.631, t));
    float again = smoothstep(0.76, 0.84, t) * (1.0 - smoothstep(0.88, 0.92, t)) * 0.65;
    return max(rest, max(droop, again));
}

// The eyelids for lids shut by `shut` (0 to 1): x 1 in a lid and 0 in the open eye, the rim dithered at the effect pixel;
// y 1 on a lash; z how near the lid's rim this point is (1 at the rim, falling to 0 deeper in the lid: the skin's shading). The opening is almond-shaped (the lids meet sooner at the sides) and the top lid comes down further than
// the bottom one rises (`reach`). Lashes hang from the top lid's rim (and stand on the bottom one's) in a comb of pixel
// strands of 1 to 4 effect pixels, irregular like real ones.
vec3 lids(vec2 uv, float shut, vec2 reach) {
    float x = uv.x * 2.0 - 1.0;
    float shape = 0.6 + 0.4 * x * x;
    float rim = 0.03;
    float topEdge = 1.0 + rim - shut * (reach.x + rim) * shape;
    float bottomEdge = -rim + shut * (reach.y + rim) * shape;
    float top = smoothstep(topEdge - rim, topEdge + rim, uv.y);
    float bottom = 1.0 - smoothstep(bottomEdge - rim, bottomEdge + rim, uv.y);
    float lid = fxDither(gl_FragCoord.xy, max(top, bottom));
    float px = max(CmpComfort.z, 1.0);
    vec2 cell = floor(gl_FragCoord.xy / px);
    float below = (topEdge - 0.35 * rim) * OutSize.y / px - cell.y;
    float above = cell.y - (bottomEdge + 0.35 * rim) * OutSize.y / px;
    float h = fxHash(vec2(cell.x, 61.0));
    float topLash = step(0.0, below) * step(below, floor(h * 7.0) + 2.0) * step(0.25, fxHash(vec2(cell.x, 67.0)));
    float bottomLash = step(0.0, above) * step(above, floor(h * 3.0) + 0.5) * step(0.55, fxHash(vec2(cell.x, 71.0)));
    float lash = max(topLash, bottomLash) * step(0.12, shut);
    float near = exp(-max(0.0, max(-below, -above)) * 0.08);
    return vec3(lid, lash, near);
}

void main() {
    float s = clamp(fxS(), 0.0, 1.15);
    float mixed = min(s, 1.0);
    float m = fxM();
    float back = CmpPhase.y;
    vec3 clean = texture(DiffuseSampler, texCoord).rgb;

    float shut = nod(fract(Time / 42.0)) * min(1.0, s * 1.18) * (0.92 + 0.08 * fxDose());
    vec2 uv = texCoord + vec2(0.0, 0.012 * shut * m);

    // Double vision: two copies of the world drifting apart and back (14 s).
    vec2 split = vec2(0.012, 0.0025) * (0.6 + 0.4 * fxWave(14.0)) * m;
    vec3 sharp = mix(texture(DiffuseSampler, uv - split).rgb, texture(DiffuseSampler, uv + split).rgb, 0.5);
    vec3 soft = texture(SoftSampler, uv).rgb;
    vec3 blur = texture(BlurSampler, uv).rgb;
    vec2 q = texCoord - 0.5;
    q.x *= OutSize.x / max(OutSize.y, 1.0);
    float r2 = dot(q, q);
    float edge = smoothstep(0.06, 0.85, r2);

    // The heavy blur.
    vec3 c = mix(sharp, soft, 0.45);
    c = mix(c, blur, 0.3 + 0.55 * edge);

    // Cold blue-grey, a cyanotic violet at the edges, darkened to 65%.
    c = mix(vec3(fxLuma(c)), c, 0.4);
    c *= vec3(0.84, 0.92, 1.1);
    c = mix(c, c * vec3(0.55, 0.6, 1.05) + vec3(0.02, 0.0, 0.06), smoothstep(0.25, 1.0, r2) * 0.8);
    c = (c - 0.5) * 0.85 + 0.5;
    c *= 0.65 + 0.12 * (1.0 - edge);

    // The eyelids, at full cover whatever the strength (see heroin.fsh).
    vec3 eye = lids(texCoord, shut, vec2(0.66, 0.42)) * step(0.001, shut);
    vec3 skin = mix(vec3(0.012, 0.012, 0.02), vec3(0.075, 0.06, 0.1), eye.z);
    vec3 shown = mix(mix(clean, c, mixed), skin, eye.x);
    shown = mix(shown, vec3(0.012, 0.012, 0.02) * 0.5, eye.y);
    c = clean + (shown - clean) / max(mixed, 0.001);

    fragColor = fxFinish(clean, c);
}
