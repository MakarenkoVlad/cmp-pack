#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The crack look of CMP (S3 and M9; docs/design/addictives-fx-design.md 3.1; cmpfixes/ADDICTIVES.md, "FX intense looks"),
// our own work at the mod's path, so its own slot runs it too (calm there: no glitches, no motion). A hot, burnt-out
// picture: lifted and contrasty, highlights blown toward a warm white, shadows going violet; still scanlines one effect
// pixel apart with a soft band rolling down every 2 s, a steady red and blue split, grain that changes each tick, and
// shadows creeping in from the edges in dithered steps. The tears come only with a glitch the flash floor admits
// (CmpEvent.y and .z: never more than 3 flashes and glitches in any second, M9): 6 to 12% of 64 bands (more with the
// dose) jump sideways by up to 4% in whole effect pixels, their channels swapped and posterised, for the glitch's 160 ms;
// from amplifier 2 the torn bands smear sideways as the glitch fades (its last 120 ms). The rare white flash is the look
// file's (the common pass draws it). Its heart beats at 150 a minute: a slight squeeze of the picture on each beat.

uniform sampler2D DiffuseSampler;

in vec2 texCoord;

out vec4 fragColor;

void main() {
    float s = min(fxS(), 1.0);
    float m = fxM();
    float aspect = OutSize.x / max(OutSize.y, 1.0);
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);
    float r = length(p);
    float px = max(CmpComfort.z, 1.0);
    vec2 pixUv = vec2(px) / max(OutSize, vec2(1.0));
    vec2 cell = floor(gl_FragCoord.xy / px);
    float bayer = fxBayer(cell);

    // The tear of an admitted glitch: bands of whole effect pixels (64 of them), offsets in whole effect pixels (R-3, R-8).
    float glitch = fxGlitch();
    float seed = fxGlitchSeed();
    float rows = max(1.0, floor(OutSize.y / px / 64.0));
    float band = floor(cell.y / rows);
    float torn = step(1.0 - (0.06 + 0.06 * smoothstep(0.25, 1.0, fxDose())), fxHash(vec2(band, seed)));
    float tear = (fxHash(vec2(band + 31.0, seed + 7.0)) * 2.0 - 1.0) * 0.04;
    float live = torn * step(0.05, glitch);
    vec2 uv = texCoord + vec2(floor(tear * live * m / pixUv.x + 0.5) * pixUv.x, 0.0);

    // A slight squeeze on each heartbeat (motion).
    uv = 0.5 + (uv - 0.5) * (1.0 - 0.003 * fxPulse(0.25) * m);

    // A steady red and blue split, wider in a live tear and on a new dose.
    float split = (0.004 + 0.012 * live + 0.004 * fxKick()) * s;
    vec3 base = texture(DiffuseSampler, uv).rgb;
    // From amplifier 2 a torn band smears sideways while the glitch fades (only torn bands read the three extra samples).
    float smear = live * step(0.5, fxDose()) * (1.0 - glitch);
    if (smear > 0.0) {
        vec2 reach = vec2(-sign(tear) * 0.03 * smear * m, 0.0);
        base = mix(base, (texture(DiffuseSampler, uv + reach * 0.33).rgb + texture(DiffuseSampler, uv + reach * 0.66).rgb
                + texture(DiffuseSampler, uv + reach).rgb) / 3.0, 0.7);
    }
    vec3 c = vec3(texture(DiffuseSampler, uv + vec2(split, 0.0)).r, base.g, texture(DiffuseSampler, uv - vec2(split, 0.0)).b);

    // Hot and burnt out: lifted, contrasty, the mid tones amber, highlights blown toward a warm white, shadows going
    // violet, colours up.
    c = (pow(max(c, 0.0), vec3(0.8)) - 0.45) * 1.4 + 0.5;
    float luma = fxLuma(c);
    c *= mix(vec3(1.0), vec3(1.12, 0.98, 0.78), smoothstep(0.15, 0.6, luma) * (1.0 - smoothstep(0.6, 0.95, luma)));
    c = mix(c, vec3(1.0, 0.9, 0.72), smoothstep(0.72, 1.05, luma) * 0.6);
    c = mix(c, c * vec3(0.9, 0.62, 1.15), (1.0 - smoothstep(0.08, 0.45, luma)) * 0.7);
    c = mix(vec3(fxLuma(c)), c, 1.3);

    // A torn band is a broken signal while it lasts: its channels swapped and posterised, a little brighter (a thin band
    // of the screen, inside the admitted glitch).
    vec3 broken = floor(clamp(c.gbr * 1.2 + 0.05, 0.0, 1.0) * 4.0 + 0.5) / 4.0;
    c = mix(c, broken, 0.75 * live);

    // Still scanlines one effect pixel apart (5%), and a soft band 3% brighter rolling down every 2 s (R-4).
    float roll = fract(texCoord.y + fract(Time / 2.0));
    c *= (1.0 - 0.05 * mod(cell.y, 2.0)) * (1.0 + 0.03 * smoothstep(0.82, 1.0, roll) * (1.0 - smoothstep(0.98, 1.0, roll)));

    // Grain: plus or minus 4%, a new pattern each tick, never each frame (R-4).
    c += (fxTickNoise(cell) - 0.5) * 0.08;

    // Shadows creep in from the edges: a dithered dark border whose inner edge crawls in tendrils (motion: the crawl).
    vec2 dir = p / max(r, 1e-4);
    vec2 crawl = m * vec2(fxWave(14.0), fxWave(21.0)) * 0.8;
    float tendril = fxValueNoise(dir * 2.5 + crawl) - 0.5 + 0.35 * (fxValueNoise(p * 7.0 - crawl) - 0.5);
    float creep = smoothstep(0.52, 0.92, r + 0.28 * tendril);
    c *= 1.0 - 0.82 * max(step(0.75, creep), step(bayer, creep * 1.3));

    fragColor = fxFinish(base, c);
}
