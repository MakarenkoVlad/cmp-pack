#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The Benadryl look of CMP, new (docs/design/addictives-fx-design.md, 3.1 S3; cmpfixes/ADDICTIVES.md, "FX calm looks").
// Our own work for the CMP pack.
// Delirium: the world dim (a fifth darker) and green-grey, blurred toward the edges, and dark smoky figures at the edges of
// the view: a hat man, a thin tall man, a hooded one and one that reaches in, our own 16 x 32 pixel art
// (cmpfixes:textures/effect/drugfx/benadryl_figures.png). Each comes at the left or right edge on its own cycle (21, 30, 35
// or 42 s), fades in over a second in dithered steps, stands 2 to 3 s drifting a little toward the middle, its legs
// trailing into smoke, then dissolves in chunky pixels before it gets near the middle. Usually one at a time. A figure
// is as dark at the come-up as at the peak once it is there (fainter only very early and in the comedown).
// Reads: the picture five times (the edge blur) and the figure sheet once per figure near this point.

uniform sampler2D DiffuseSampler;
uniform sampler2D FigureSampler;

in vec2 texCoord;

out vec4 fragColor;

const vec3 SHADOW = vec3(0.03, 0.04, 0.035);

// One figure: its colour (rgb) and cover (a) at this point. `phase` runs 0 to 1 over the figure's cycle, `window` is the
// share of the cycle it shows, `left` 1 at the left edge and 0 at the right one (the sprite is mirrored there, so the
// reaching arm reaches in), `inset` how far in from that edge it stands, `tall` its height in screen heights, `feet` where
// its feet are, `index` which of the four figures.
vec4 figure(vec2 uv, float phase, float window, float left, float inset, float tall, float feet, float index, float m) {
    float t = phase / window;
    if (t >= 1.0) return vec4(0.0);
    float come = smoothstep(0.0, 0.28, t);
    float go = 1.0 - smoothstep(0.62, 1.0, t);
    float aspect = OutSize.y / max(OutSize.x, 1.0);
    float wide = tall * 0.5 * aspect;
    float drift = 0.045 * t * m;
    float x0 = mix(1.0 - inset - wide - drift, inset + drift, left);
    vec2 f = vec2((uv.x - x0) / wide, (uv.y - feet) / tall);
    if (f.x < 0.0 || f.x >= 1.0 || f.y < 0.0 || f.y >= 1.0) return vec4(0.0);
    float fx = mix(1.0 - f.x, f.x, left);
    vec2 texel = floor(vec2(fx * 16.0, (1.0 - f.y) * 32.0));
    vec4 ink = texture(FigureSampler, (vec2(index * 16.0, 0.0) + texel + 0.5) / vec2(64.0, 32.0));
    // Smoke: the legs fade into it, and the figure's pixels come and go in chunky steps as it fades in and dissolves.
    float smoke = smoothstep(0.0, 0.3, f.y + 0.12 * (fxHash(texel + vec2(index * 31.0, 3.0)) - 0.5));
    float grain = fxHash(texel + vec2(index * 17.0, 9.0));
    float shown = step(grain, come * 1.05) * step(grain, go * 1.05);
    float cover = ink.a * smoke * shown;
    // Fine dither at the effect pixel inside the big sprite pixels: a smoky edge.
    cover *= fxDither(gl_FragCoord.xy, clamp(cover * (0.55 + 0.45 * min(come, go)) * 1.4, 0.0, 1.0));
    return vec4(mix(SHADOW, ink.rgb, 0.7), cover * 0.92);
}

void main() {
    float s = clamp(fxS(), 0.0, 1.15);
    float m = fxM();
    float back = CmpPhase.y;
    vec3 clean = texture(DiffuseSampler, texCoord).rgb;

    // Blur toward the edges: four reads round the point, reaching further from the middle.
    vec2 q = texCoord - 0.5;
    q.x *= OutSize.x / max(OutSize.y, 1.0);
    float r2 = dot(q, q);
    float edge = smoothstep(0.1, 0.9, r2);
    vec2 reach = fxPix() * (0.6 + 3.0 * edge);
    vec3 around = texture(DiffuseSampler, texCoord + vec2(reach.x, reach.y * 0.5)).rgb + texture(DiffuseSampler, texCoord - vec2(reach.x, reach.y * 0.5)).rgb
            + texture(DiffuseSampler, texCoord + vec2(-reach.x * 0.5, reach.y)).rgb + texture(DiffuseSampler, texCoord - vec2(-reach.x * 0.5, reach.y)).rgb;
    vec3 c = mix(clean, around * 0.25, 0.2 + 0.6 * edge);

    // Dim and green-grey, a sickly yellow-green in the light, darker toward the edges in dithered steps.
    c = mix(vec3(fxLuma(c)), c, 0.45);
    c *= mix(vec3(0.84, 0.95, 0.8), vec3(1.0, 1.04, 0.82), smoothstep(0.4, 1.0, fxLuma(c)));
    c *= 0.8;
    float steps = clamp(floor(smoothstep(0.25, 1.1, r2) * 4.0 + fxBayer(floor(gl_FragCoord.xy / max(CmpComfort.z, 1.0)))) / 4.0, 0.0, 1.0);
    c *= 1.0 - 0.4 * steps;

    // The figures: once there they stand at full cover whatever the look's strength (fxFinish mixes the look in by the
    // strength, so their part is divided back out, as the opioids' eyelids); fainter early in the come-up and in the
    // comedown.
    float mixed = min(s, 1.0);
    float present = (1.0 - 0.4 * back) * smoothstep(0.12, 0.5, s);
    vec4 f0 = figure(texCoord, fract(Time / 21.0), 3.6 / 21.0, 1.0, 0.03, 0.5, 0.17, 0.0, m);
    vec4 f1 = figure(texCoord, fract(fract(Time / 30.0) + 0.55), 3.2 / 30.0, 0.0, 0.035, 0.56, 0.12, 1.0, m);
    vec4 f2 = figure(texCoord, fract(fract(Time / 35.0) + 0.3), 2.8 / 35.0, 1.0, 0.13, 0.42, 0.21, 2.0, m);
    vec4 f3 = figure(texCoord, fract(fract(Time / 42.0) + 0.8), 3.8 / 42.0, 0.0, 0.11, 0.47, 0.16, 3.0, m);
    vec3 shown = mix(clean, c, mixed);
    shown = mix(shown, f0.rgb, f0.a * present);
    shown = mix(shown, f1.rgb, f1.a * present);
    shown = mix(shown, f2.rgb, f2.a * present);
    shown = mix(shown, f3.rgb, f3.a * present);
    c = clean + (shown - clean) / max(mixed, 0.001);

    fragColor = fxFinish(clean, c);
}
