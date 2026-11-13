#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The heroin look of CMP (docs/design/addictives-fx-design.md, 3.1 S3; cmpfixes/ADDICTIVES.md, "FX calm looks"). Our own
// work for the CMP pack, at the mod's path so its own slot shows it too when the screen framework is off.
// A warm golden haze: the picture soft and blurred toward the edges, a gold glow on the light, a quarter of the colour
// gone. And the nod: on a 45-s cycle the eyelids sag a little, open, then droop over 6 s until only a slit is left (70% of
// the view shut), hang there, and lift again over 1.2 s, the picture sinking 1.2% with them. The lids are pixel art: dark
// skin with the light glowing red through it, their rim dithered at the effect pixel.
// Reads: the picture once (moved by the sink), its half-size copy (SoftSampler) and a wide blur at a quarter of the size
// (BlurSampler).

uniform sampler2D DiffuseSampler;
uniform sampler2D SoftSampler;
uniform sampler2D BlurSampler;

in vec2 texCoord;

out vec4 fragColor;

// How far the lids are shut over the nod (0 open, 1 at the full droop): a light sag early in the cycle, then the long
// droop over 6 s, a hold, and a lift over 1.2 s (never faster: a fast lift over the whole view would be a flash).
float nod(float t) {
    float sag = smoothstep(0.12, 0.2, t) * (1.0 - smoothstep(0.24, 0.29, t)) * 0.4;
    float droop = smoothstep(0.5, 0.633, t) * (1.0 - smoothstep(0.7, 0.727, t));
    return max(sag, droop);
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

    // The nod: deeper with the strength, held still without the clock (the mod's own slot keeps the lids open then).
    float shut = nod(fract(Time / 45.0)) * min(1.0, s * 1.18) * (0.92 + 0.08 * fxDose());
    vec2 uv = texCoord + vec2(0.0, 0.012 * shut * m);

    vec3 sharp = texture(DiffuseSampler, uv).rgb;
    vec3 soft = texture(SoftSampler, uv).rgb;
    vec3 blur = texture(BlurSampler, uv).rgb;
    vec2 q = texCoord - 0.5;
    q.x *= OutSize.x / max(OutSize.y, 1.0);
    float r2 = dot(q, q);
    float edge = smoothstep(0.08, 0.9, r2);

    // The haze: soft in the middle, blurred toward the edges, more so while the lids are heavy.
    vec3 c = mix(sharp, soft, 0.4 + 0.2 * shut);
    c = mix(c, blur, 0.2 + 0.5 * edge + 0.15 * shut);

    // A gold glow on the light.
    float light = smoothstep(0.55, 1.0, fxLuma(blur));
    c = 1.0 - (1.0 - c) * (1.0 - vec3(1.0, 0.78, 0.42) * light * 0.45);

    // The golden grade: a quarter of the colour gone, brown shadows, honey light, softer contrast.
    c = mix(vec3(fxLuma(c)), c, 0.75);
    float l = fxLuma(c);
    c *= mix(vec3(0.96, 0.8, 0.62), vec3(1.1, 0.98, 0.8), smoothstep(0.15, 0.9, l));
    c = (c - 0.5) * 0.86 + 0.5;
    c *= 1.0 - 0.3 * edge;

    // The eyelids, shut at full cover whatever the strength: fxFinish mixes the look in by the strength, so their part is
    // given divided back out.
    vec3 eye = lids(texCoord, shut, vec2(0.6, 0.36)) * step(0.001, shut);
    vec3 skin = mix(vec3(0.07, 0.022, 0.014), vec3(0.26, 0.08, 0.045), eye.z);
    vec3 shown = mix(mix(clean, c, mixed), skin, eye.x);
    shown = mix(shown, vec3(0.07, 0.022, 0.014) * 0.4, eye.y);
    c = clean + (shown - clean) / max(mixed, 0.001);

    fragColor = fxFinish(clean, c);
}
