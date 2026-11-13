#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The meth look of CMP (S3 and M9; docs/design/addictives-fx-design.md 3.1; cmpfixes/ADDICTIVES.md, "FX intense looks"),
// our own work at the mod's path, so its own slot runs it too (calm there: no glitches, no motion). Colder and darker than
// crack: a cold teal picture, every channel sharpened to a hard edge, crushed shadows, and paranoia: thick shadows creep
// in from the edges in dithered tendrils that crawl, under a vignette that breathes (14 s); when a glitch comes (only
// those the flash floor admits, M9) the shadows lunge inward and 3 to 6% of 64 bands slip sideways by up to 2%, for the
// glitch's 160 ms. The rare 35% blackout is the look file's (the common pass draws it). Its heart beats at 136 a minute.

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

    // The slip of an admitted glitch: fewer and smaller than crack's, in whole effect pixels (R-3, R-8).
    float glitch = fxGlitch();
    float seed = fxGlitchSeed();
    float rows = max(1.0, floor(OutSize.y / px / 64.0));
    float band = floor(cell.y / rows);
    float torn = step(1.0 - (0.03 + 0.03 * smoothstep(0.25, 1.0, fxDose())), fxHash(vec2(band, seed + 101.0)));
    float slip = (fxHash(vec2(band + 13.0, seed + 3.0)) * 2.0 - 1.0) * 0.02;
    float live = torn * step(0.05, glitch);
    vec2 uv = texCoord + vec2(floor(slip * live * m / pixUv.x + 0.5) * pixUv.x, 0.0);

    // Every channel sharpened (an unsharp mask at one effect pixel), a thin red and blue split.
    vec3 base = texture(DiffuseSampler, uv).rgb;
    vec3 around = texture(DiffuseSampler, uv + vec2(pixUv.x, 0.0)).rgb + texture(DiffuseSampler, uv - vec2(pixUv.x, 0.0)).rgb
            + texture(DiffuseSampler, uv + vec2(0.0, pixUv.y)).rgb + texture(DiffuseSampler, uv - vec2(0.0, pixUv.y)).rgb;
    vec3 c = base + (base - around * 0.25) * 1.1;
    float split = (0.0015 + 0.006 * live) * s;
    c.r += texture(DiffuseSampler, uv + vec2(split, 0.0)).r - base.r;
    c.b += texture(DiffuseSampler, uv - vec2(split, 0.0)).b - base.b;

    // Cold and dark: crushed shadows, teal, a little desaturated, the whites icy.
    c = pow(max(c, 0.0), vec3(1.18)) * 0.92;
    c = (c - 0.5) * 1.2 + 0.5;
    float luma = fxLuma(c);
    c = mix(vec3(luma), c, 0.8) * vec3(0.84, 1.0, 1.08) + vec3(-0.02, 0.01, 0.03);

    // Grain: plus or minus 3%, a new pattern each tick (R-4).
    c += (fxTickNoise(cell + vec2(17.0, 5.0)) - 0.5) * 0.06;

    // Paranoia: thick shadows creep in from the edges in dithered tendrils that crawl (motion), under a vignette that
    // breathes (14 s), and lunge inward with a glitch.
    vec2 dir = p / max(r, 1e-4);
    vec2 crawl = m * vec2(fxWave(10.5), fxWave(15.0)) * 1.1;
    float tendril = fxValueNoise(dir * 3.0 + crawl) - 0.5 + 0.45 * (fxValueNoise(p * 8.0 - crawl * 1.3) - 0.5);
    float reach = 0.36 - 0.05 * fxWave(14.0) * s - 0.06 * glitch;
    float creep = smoothstep(reach, reach + 0.42, r + 0.34 * tendril);
    c *= 1.0 - 0.9 * max(step(0.7, creep), step(bayer, creep * 1.35));
    c *= 1.0 - 0.25 * smoothstep(0.3, 1.0, r);

    fragColor = fxFinish(base, c);
}
