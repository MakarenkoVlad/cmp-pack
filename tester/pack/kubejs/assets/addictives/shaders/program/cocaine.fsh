#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The cocaine look of CMP (S3; docs/design/addictives-fx-design.md 3.1; cmpfixes/ADDICTIVES.md, "FX intense looks"), our
// own work at the mod's path, so its own slot runs it too (calm there: no motion). Cold and sharp: every edge crisp (an
// unsharp mask), contrast up, the highlights blue-white, and frost growing in from the corners in pixel crystals. On each
// heartbeat (128 a minute) the picture snaps in a little and a red and blue split swells; a fine jitter changes each
// tick. The crash (the mod's last 600 ticks, the comedown): the colour drains cold and the frost creeps further in (the
// HUD's tunnel closes too, fxview).

uniform sampler2D DiffuseSampler;

in vec2 texCoord;

out vec4 fragColor;

mat2 turn(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

void main() {
    float s = min(fxS(), 1.0);
    float m = fxM();
    float crash = CmpPhase.y;
    float aspect = OutSize.x / max(OutSize.y, 1.0);
    float px = max(CmpComfort.z, 1.0);
    vec2 pixUv = vec2(px) / max(OutSize, vec2(1.0));
    vec2 cell = floor(gl_FragCoord.xy / px);
    float bayer = fxBayer(cell);

    // Motion: a snap in on each beat (0.8%), a jitter of a few hundredths of a percent, new each tick.
    float beat = fxPulse(0.3);
    vec2 jitter = (vec2(fxTickNoise(vec2(3.0, 7.0)), fxTickNoise(vec2(11.0, 5.0))) - 0.5) * 0.0012;
    vec2 uv = 0.5 + (texCoord - 0.5) * (1.0 - 0.008 * beat * m) + jitter * m;

    // Crisp: an unsharp mask at one effect pixel (+60%), the red and blue split swelling on the beat.
    vec3 base = texture(DiffuseSampler, uv).rgb;
    vec3 around = texture(DiffuseSampler, uv + vec2(pixUv.x, 0.0)).rgb + texture(DiffuseSampler, uv - vec2(pixUv.x, 0.0)).rgb
            + texture(DiffuseSampler, uv + vec2(0.0, pixUv.y)).rgb + texture(DiffuseSampler, uv - vec2(0.0, pixUv.y)).rgb;
    vec3 c = base + (base - around * 0.25) * 0.6;
    vec2 spread = (uv - 0.5) * (0.003 + 0.007 * beat) * s;
    c.r += texture(DiffuseSampler, uv + spread).r - base.r;
    c.b += texture(DiffuseSampler, uv - spread).b - base.b;

    // Cold: contrast +15%, highlights toward blue-white, shadows toward deep blue, warm colours cooled a little.
    c = (c - 0.5) * 1.15 + 0.5;
    float luma = fxLuma(c);
    c = mix(c, vec3(0.86, 0.95, 1.0) * max(luma, 0.0) * 1.08, smoothstep(0.55, 1.0, luma) * 0.55);
    c = mix(c, c * vec3(0.72, 0.88, 1.2), (1.0 - smoothstep(0.05, 0.55, luma)) * 0.65);
    c = mix(vec3(fxLuma(c)), c, 1.1 - 0.75 * crash) * mix(vec3(1.0), vec3(0.88, 0.96, 1.1), crash);

    // Frost from the edges: feathery crystals in pixel lines (ridges of stretched noise in three directions, coarse and
    // fine, per effect pixel) over a cold haze, crowding at the edges and corners and thinning inward; deeper in the
    // crash, a crackle further on each beat.
    vec2 cellUv = (cell + 0.5) * pixUv;
    vec2 edge = min(cellUv, 1.0 - cellUv) * vec2(aspect, 1.0);
    float reach = (0.13 + 0.09 * crash + 0.006 * beat) * s;
    // Only near the edges (the noise is the look's cost; the middle never has frost).
    if (min(edge.x, edge.y) < reach + 0.08) {
        vec2 q = (cellUv - 0.5) * vec2(aspect, 1.0);
        float coarse = 0.0;
        float fine = 0.0;
        for (int k = 0; k < 3; k++) {
            vec2 a = turn(1.047 * float(k) + 0.3) * q;
            coarse = max(coarse, 1.0 - abs(2.0 * fxValueNoise(a * vec2(16.0, 2.5) + vec2(float(k) * 7.0, 3.0)) - 1.0));
            fine = max(fine, 1.0 - abs(2.0 * fxValueNoise(a * vec2(55.0, 7.0) + vec2(3.0, float(k) * 5.0)) - 1.0));
        }
        float nearEdge = min(edge.x, edge.y) - 0.35 * max(0.12 - max(edge.x, edge.y), 0.0) - 0.06 * (coarse - 0.5);
        float density = 1.0 - smoothstep(0.0, max(reach, 0.001), nearEdge);
        float ice = max(step(1.0 - 0.32 * density, coarse), step(1.0 - 0.2 * density, fine) * 0.75) * step(0.02, density);
        // On bright sky the frost shows blue-grey, elsewhere white.
        float onBright = smoothstep(0.65, 0.95, fxLuma(c));
        c = mix(c, mix(vec3(0.74, 0.86, 0.98), vec3(0.55, 0.7, 0.88), onBright), density * density * 0.4);
        c = mix(c, vec3(0.6, 0.78, 1.0), step(bayer, density * 0.45) * 0.18);
        c = mix(c, mix(vec3(0.94, 0.98, 1.0), vec3(0.62, 0.78, 0.95), onBright), ice * 0.85);
    }

    // Glints: a few bright pixels on the brightest things, new each tick (small, under 10% of any region, R-4).
    if (fxLuma(c) > 0.7) {
        float glint = step(0.985, fxTickNoise(cell + vec2(41.0, 13.0))) * smoothstep(0.7, 0.9, fxLuma(c));
        c += vec3(0.25, 0.3, 0.35) * glint;
    }

    fragColor = fxFinish(base, c);
}
