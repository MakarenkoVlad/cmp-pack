#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The MDMA look of CMP (docs/design/addictives-fx-design.md, 3.1 S3; cmpfixes/ADDICTIVES.md, "FX calm looks"). Our own
// work for the CMP pack, at the mod's path so its own slot shows it too when the screen framework is off.
// Pink warmth that breathes over 6 s, colour 30% richer, a soft warp, a warm bloom round bright things that swells on
// the heartbeat and blooms out on a new dose (the kick), and four-point pixel stars on the highlights that twinkle in
// steps; a pink-violet vignette in dithered pixel steps.
// Reads: the picture once, the bloom eight times, one read for the star of this cell.

uniform sampler2D DiffuseSampler;

in vec2 texCoord;

out vec4 fragColor;

// A star cell is 12 effect pixels square; the star sits away from its edges, so its arms never cross into the next cell.
const float CELL = 16.0;

float stepped(float v, float n) {
    float b = fxBayer(floor(gl_FragCoord.xy / max(CmpComfort.z, 1.0)));
    return clamp(floor(v * n + b) / n, 0.0, 1.0);
}

// The star of this effect pixel's cell: its brightness here (0 off the star).
float star(vec2 uvWarp) {
    float px = max(CmpComfort.z, 1.0);
    vec2 p = floor(gl_FragCoord.xy / px);
    vec2 cell = floor(p / CELL);
    vec2 centre = cell * CELL + 4.0 + floor(vec2(fxHash(cell), fxHash(cell + vec2(31.0, 7.0))) * (CELL - 8.0));
    vec2 d = abs(p - centre);
    float h = fxHash(cell + vec2(7.0, 3.0));
    // Each star twinkles once a cycle (1.5 s or 2.1 s) from its own offset, in eight steps: off, a dot, a small cross, the
    // full star with its sparkle, then back.
    float slow = step(0.5, fxHash(cell + vec2(11.0, 13.0)));
    float phase = mix(fract(fract(Time / 1.5) + h), fract(fract(Time / 2.1) + h), slow);
    // In the mod's own slot (the fallback), whose clock restarts every second, the stars stand still at full size.
    phase = mix(0.4, phase, step(0.0, CmpStrength));
    float frame = floor(phase * 8.0);
    float size = max(0.0, 3.0 - abs(frame - 3.0));
    if (size < 0.5) return 0.0;
    float onArm = 0.0;
    if (d.x < 0.5 && d.y <= size) onArm = 1.0 - d.y / (size + 1.0);
    if (d.y < 0.5 && d.x <= size) onArm = max(onArm, 1.0 - d.x / (size + 1.0));
    if (size > 2.5 && d.x > 0.5 && d.x < 1.5 && d.y > 0.5 && d.y < 1.5) onArm = max(onArm, 0.45);
    if (onArm <= 0.0) return 0.0;
    // Only where the picture under the star's middle is bright (sky, lanterns, lava, glowstone).
    vec2 centreUv = (centre + 0.5) * px / max(OutSize, vec2(1.0));
    float bright = smoothstep(0.6, 0.9, fxLuma(texture(DiffuseSampler, centreUv + (uvWarp - texCoord)).rgb));
    float chance = step(0.62, fxHash(cell + vec2(23.0, 5.0)));
    return onArm * bright * chance;
}

void main() {
    float s = clamp(fxS(), 0.0, 1.15);
    float m = fxM();
    float back = CmpPhase.y;
    vec3 clean = texture(DiffuseSampler, texCoord).rgb;

    // A soft warp: slow waves through the picture (14 s and 21 s), held per effect pixel.
    vec2 at = fxSnap(texCoord);
    float a = FX_TAU * fract(Time / 14.0);
    float b = FX_TAU * fract(Time / 21.0);
    vec2 warp = vec2(sin(at.y * 6.0 + a) * sin(at.x * 2.5 - b), sin(at.x * 5.0 + b) * sin(at.y * 3.0 + a)) * 0.005 * m;
    vec2 uv = texCoord + warp;
    vec3 c = texture(DiffuseSampler, uv).rgb;

    // The bloom: eight reads on a ring, only the brightest light; it swells on the heartbeat and on the kick of a new
    // dose, screened over the picture.
    vec2 ring = vec2(OutSize.y / max(OutSize.x, 1.0), 1.0) * 0.012;
    vec3 bloom = vec3(0.0);
    for (int i = 0; i < 8; i++) {
        float angle = float(i) * 0.785398 + 0.39;
        vec3 t = texture(DiffuseSampler, uv + vec2(cos(angle), sin(angle)) * ring * (1.0 + 0.6 * float(i & 1))).rgb;
        bloom += max(t - 0.78, 0.0);
    }
    bloom = bloom * (0.125 / 0.22);
    float swell = 0.3 + 0.12 * fxPulse(0.35) + 0.8 * fxKick();
    c = 1.0 - (1.0 - c) * (1.0 - clamp(bloom * vec3(1.0, 0.66, 0.78) * swell, 0.0, 1.0));

    // Richer colour; pink warmth in the light and a rosy lift in the shadows, breathing over 6 s; a softer gamma.
    c = mix(vec3(fxLuma(c)), c, 1.32);
    float breathe = 1.0 + 0.3 * fxWave(6.0) * step(0.0, CmpStrength);
    float l = fxLuma(c);
    float warmth = (1.0 - 0.5 * back) * breathe;
    c *= mix(vec3(1.0), vec3(1.06, 0.8, 0.94), smoothstep(0.35, 1.0, l) * 0.85 * warmth);
    c += vec3(0.07, 0.0, 0.045) * (1.0 - l) * warmth;
    c = pow(max(c, 0.0), vec3(0.93));

    // Pixel stars on the highlights (patterns: times fxPatterns, R-6): a white middle, hot pink arms.
    float twinkle = clamp(star(uv) * fxPatterns() * (1.0 - 0.7 * back), 0.0, 1.0);
    c = mix(c, mix(vec3(1.0, 0.36, 0.74), vec3(1.0, 0.97, 0.99), smoothstep(0.55, 0.95, twinkle)), smoothstep(0.0, 0.25, twinkle) * 0.95);

    // A pink-violet vignette in dithered steps.
    vec2 q = texCoord - 0.5;
    q.x *= OutSize.x / max(OutSize.y, 1.0);
    float edge = stepped(smoothstep(0.3, 1.1, dot(q, q)), 4.0);
    c = mix(c, c * vec3(0.78, 0.5, 0.82), 0.55 * edge);

    fragColor = fxFinish(clean, c);
}
