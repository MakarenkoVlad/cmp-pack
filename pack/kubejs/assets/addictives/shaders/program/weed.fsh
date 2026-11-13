#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The weed look of CMP (docs/design/addictives-fx-design.md, 3.1 S3; cmpfixes/ADDICTIVES.md, "FX calm looks"). Our own
// work for the CMP pack, at the mod's path so its own slot shows it too when the screen framework is off.
// Warmth creeps in: a soft, hazy focus that leaves the middle readable, a warm halo round bright things, greener shadows,
// colour that breathes over 12 s, a slow drift of the picture (21 s and 35 s), and the top and bottom of the view darker
// in dithered pixel steps. In the comedown the warmth drains and the focus comes back.
// Reads: the picture, its half-size copy (SoftSampler) and a wide glow at a quarter of the size (GlowSampler).

uniform sampler2D DiffuseSampler;
uniform sampler2D SoftSampler;
uniform sampler2D GlowSampler;

in vec2 texCoord;

out vec4 fragColor;

// v (0 to 1) in n steps, the steps dithered at the effect pixel: pixel-art gradients.
float stepped(float v, float n) {
    float b = fxBayer(floor(gl_FragCoord.xy / max(CmpComfort.z, 1.0)));
    return clamp(floor(v * n + b) / n, 0.0, 1.0);
}

void main() {
    float s = clamp(fxS(), 0.0, 1.15);
    float m = fxM();
    float back = CmpPhase.y;
    vec3 clean = texture(DiffuseSampler, texCoord).rgb;

    // The picture floats a little (R-1: times the motion).
    vec2 drift = vec2(fxWave(21.0), fxWave(35.0)) * vec2(0.003, 0.002) * m;
    vec2 uv = texCoord + drift;
    vec3 sharp = texture(DiffuseSampler, uv).rgb;
    vec3 soft = texture(SoftSampler, uv).rgb;
    vec3 glow = texture(GlowSampler, uv).rgb;

    vec2 q = texCoord - 0.5;
    q.x *= OutSize.x / max(OutSize.y, 1.0);
    float r2 = dot(q, q);

    // Soft focus: light in the middle, dreamy at the edges; it lifts again in the comedown.
    float focus = (0.42 + 0.45 * smoothstep(0.03, 0.75, r2)) * (1.0 - 0.65 * back);
    vec3 c = mix(sharp, mix(soft, glow, 0.45), focus);

    // A warm halo round bright things (lanterns, lava, the glowstone, the brightest sky), screened over the picture.
    float bright = smoothstep(0.6, 1.0, fxLuma(glow));
    vec3 halo = mix(glow, vec3(1.0, 0.8, 0.45), 0.55) * bright * 0.55 * (1.0 - 0.7 * back);
    c = 1.0 - (1.0 - c) * (1.0 - halo);

    // The grade, split: green-teal shadows, honey-warm light, greens greener; a green-gold haze lifting the blacks.
    float l = fxLuma(c);
    float shade = 1.0 - smoothstep(0.05, 0.55, l);
    float light = smoothstep(0.45, 1.0, l);
    c *= mix(vec3(1.0), vec3(0.86, 1.06, 0.9), shade);
    c *= mix(vec3(1.0), vec3(1.07, 1.02, 0.86), light * (1.0 - 0.6 * back));
    float green = clamp((c.g - max(c.r, c.b)) * 4.0, 0.0, 1.0);
    c = mix(c, c * vec3(0.9, 1.12, 0.82), green * 0.6);
    c = mix(c, vec3(0.3, 0.36, 0.14), 0.08);
    // Colour that breathes: saturation 1.24 +- 6% over 12 s (held still in the mod's own slot, the fallback, whose clock
    // restarts every second).
    float driven = step(0.0, CmpStrength);
    float sat = 1.24 + 0.06 * fxWave(12.0) * driven;
    c = mix(vec3(fxLuma(c)), c, sat);

    // The top and bottom of the view darker, in dithered steps (the eyes half shut against the light).
    float band = smoothstep(0.3, 0.5, abs(texCoord.y - 0.5));
    float corner = smoothstep(0.3, 1.1, r2);
    float dark = stepped(max(band, corner * 0.85), 4.0);
    c *= 1.0 - 0.36 * dark;
    c = mix(c, c * vec3(0.9, 1.0, 0.8), dark);

    fragColor = fxFinish(clean, c);
}
