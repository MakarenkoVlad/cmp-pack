#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The shrooms look of CMP (S3; docs/design/addictives-fx-design.md 3.1; cmpfixes/ADDICTIVES.md, "FX intense looks"), our
// own work at the mod's path, so its own slot runs it too. The walls breathe (12 s) and the world melts in a heavy, chunky
// warp; every 6 s a ripple runs out from the centre; colours run rich and green in the shadows while bands of hue drift
// across (35 s); marbled swirls of colour with thin glowing veins flow over everything; the picture leaves melting trails
// that sink. The warp field and the marbling come from the quarter-size layer cmpfixes:drugfx_shrooms_melt, read with
// linear filtering (this pass has use_linear_filter), so the veins are smooth lines. A spot round the crosshair stays
// clear (the owner's answer 8). In the comedown the veins go first, then the warp, and the colours drain (fxFinish).

uniform sampler2D DiffuseSampler;
uniform sampler2D WarpSampler;
uniform sampler2D PrevSampler;

in vec2 texCoord;

out vec4 fragColor;

const mat3 TO_YIQ = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
const mat3 TO_RGB = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);

// A layer's data as it was before its fxFinish: the drain and the kick of this frame are known here.
vec3 undoFinish(vec3 c) {
    float t = clamp(0.35 * CmpPhase.y * min(clamp(fxS(), 0.0, 1.15), 1.0), 0.0, 1.0);
    vec3 v = c / (1.0 + 0.04 * fxKick());
    float k = 1.0 - 0.3 * t;
    return (v / k - t * fxLuma(v) / k) / max(1.0 - t, 0.01);
}

vec3 hueShift(vec3 c, float turns) {
    vec3 yiq = TO_YIQ * c;
    float a = turns * FX_TAU;
    yiq.yz = mat2(cos(a), sin(a), -sin(a), cos(a)) * yiq.yz;
    return TO_RGB * yiq;
}

vec3 rainbowOf(float h) {
    return clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
}

// The tint's hue at the world's brightness.
vec3 tinted(vec3 world, vec3 tint) {
    vec3 w = TO_YIQ * world;
    vec3 t = TO_YIQ * tint;
    return TO_RGB * vec3(w.x, t.yz / max(length(t.yz), 1e-4) * (0.18 + 0.2 * (1.0 - abs(2.0 * w.x - 1.0))));
}

void main() {
    float m = fxM();
    float spot = fxCentre(texCoord);
    float up = CmpPhase.x;
    float down = CmpPhase.y;
    float aspect = OutSize.x / max(OutSize.y, 1.0);
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);
    float r = length(p);

    // Motion (R-1, R-8): the warp field of the quarter-size layer (the melt, the breathing walls, the ripple), read at the
    // effect pixel; here only scaled.
    vec3 field = undoFinish(texture(WarpSampler, fxSnap(texCoord)).rgb);
    float amount = m * spot * smoothstep(0.1, 0.8, up) * (1.0 - 0.6 * down);
    vec2 offset = (field.rg - 0.5) / 5.0 * amount;
    float breath = 1.0 + 0.03 * fxWave(12.0) * amount;
    float wave = fract(Time / 6.0);
    float ring = exp(-pow((r - wave * 1.15) / 0.06, 2.0)) * sin(FX_TAU * wave * 0.5);
    vec2 uv = 0.5 + (texCoord - 0.5) / breath + offset / vec2(aspect, 1.0);
    vec3 base = texture(DiffuseSampler, uv).rgb;

    // Colour: rich (x1.5), green in the shadows, warm in the lights, bands of hue drifting across (35 s), and a faint
    // light on the ripple's crest.
    float drift = 0.11 * sin(FX_TAU * (0.6 * p.x + 0.35 * p.y) - FX_TAU * fract(Time / 35.0));
    vec3 c = hueShift(base, drift + 0.05 * fxWave(70.0));
    float luma = fxLuma(c);
    c = mix(vec3(luma), c, 1.5);
    c += vec3(-0.02, 0.07, 0.01) * (1.0 - smoothstep(0.0, 0.5, luma)) + vec3(0.05, 0.02, -0.03) * smoothstep(0.5, 1.0, luma);
    c *= 1.0 + 0.06 * max(ring, 0.0) * spot;

    // The marbling: swirls of colour that drift through the hues (35 s), hue only, and its glowing veins (thin lines where
    // the marbling crosses its middle, fainter ones at two other levels, a dithered glow beside them), at most half way
    // (R-6).
    float marble = undoFinish(texture(WarpSampler, fxSnap(uv)).rgb).b;
    float off = abs(marble - 0.5);
    float veins = max(1.0 - smoothstep(0.006, 0.016, off), (1.0 - smoothstep(0.004, 0.01, abs(off - 0.16))) * 0.6);
    float bayer = fxBayer(floor(gl_FragCoord.xy / max(CmpComfort.z, 1.0)));
    veins = max(veins, step(bayer, (1.0 - smoothstep(0.0, 0.06, off)) * 0.5) * 0.4);
    float allowed = fxPatterns() * spot;
    float stage = smoothstep(0.15, 0.75, up) * (1.0 - 0.7 * smoothstep(0.0, 1.0, down));
    vec3 swirl = rainbowOf(marble * 1.6 + fract(Time / 35.0));
    c = mix(c, tinted(c, swirl), 0.38 * allowed * stage);
    vec3 glowColour = mix(rainbowOf(marble * 1.6 + 0.5 + fract(Time / 35.0)), vec3(1.0), 0.3);
    c = mix(c, glowColour, clamp(veins, 0.0, 1.0) * 0.45 * allowed * stage);

    // Trails: the last frame, drawn a little lower each frame (the picture melts down), mixed in (R-7).
    vec2 sink = texCoord + vec2(0.0, 0.04 * fxFrameSeconds() * m * spot);
    vec3 last = fxPrev(PrevSampler, sink, vec4(c, 1.0)).rgb;
    c = mix(c, last, fxKeep(0.1) * 0.75 * spot);

    fragColor = fxFinish(base, mix(base, c, spot));
}
