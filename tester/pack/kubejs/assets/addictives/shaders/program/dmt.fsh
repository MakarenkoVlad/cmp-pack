#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The DMT look of CMP (S3; docs/design/addictives-fx-design.md 3.1; cmpfixes/ADDICTIVES.md, "FX intense looks"), our own
// work at the mod's path, so its own slot runs it too. The six scenes of the pattern layer (cmpfixes:drugfx_dmt_pattern,
// half size) cut the world into stained glass: each region takes a colour of an 8-step palette while the world keeps its
// brightness, so it stays readable; the regions' borders glow as pixel lines. Toward the edges the world folds into a
// six-way kaleidoscope that turns; colours deepen with a violet lift; echoes of the last frames stream outward. A spot
// round the crosshair stays clear (the owner's answer 8). The come-up rushes into the tunnel; in the comedown the lines go
// first, then the glass and the kaleidoscope, and the colours drain (fxFinish).

uniform sampler2D DiffuseSampler;
uniform sampler2D PatternSampler;
uniform sampler2D PrevSampler;

in vec2 texCoord;

out vec4 fragColor;

const vec3 PALETTE[8] = vec3[8](
    vec3(0.58, 0.18, 1.00),
    vec3(1.00, 0.16, 0.74),
    vec3(1.00, 0.34, 0.24),
    vec3(1.00, 0.68, 0.10),
    vec3(0.92, 1.00, 0.30),
    vec3(0.24, 1.00, 0.50),
    vec3(0.12, 0.88, 1.00),
    vec3(0.26, 0.42, 1.00)
);
const mat3 TO_YIQ = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
const mat3 TO_RGB = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);

mat2 turn(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

float angleOf(vec2 p) {
    float x = p.x;
    if (abs(x) < 1e-6) x = 1e-6;
    return atan(p.y, x);
}

vec2 fold(vec2 p, float n) {
    float seg = FX_TAU / n;
    float a = abs(mod(angleOf(p) + 0.5 * seg, seg) - 0.5 * seg);
    return vec2(cos(a), sin(a)) * length(p);
}

// The pattern layer's data as it was before its fxFinish: the drain and the kick of this frame are known here.
vec3 undoFinish(vec3 c) {
    float t = clamp(0.35 * CmpPhase.y * min(clamp(fxS(), 0.0, 1.15), 1.0), 0.0, 1.0);
    vec3 v = c / (1.0 + 0.04 * fxKick());
    float k = 1.0 - 0.3 * t;
    return (v / k - t * fxLuma(v) / k) / max(1.0 - t, 0.01);
}

// The tint's hue at the world's brightness: stained glass that keeps the picture readable.
vec3 glass(vec3 world, vec3 tint) {
    vec3 w = TO_YIQ * world;
    vec3 t = TO_YIQ * tint;
    vec2 chroma = t.yz / max(length(t.yz), 1e-4) * (0.2 + 0.22 * (1.0 - abs(2.0 * w.x - 1.0)));
    return TO_RGB * vec3(w.x - 0.18 * smoothstep(0.55, 1.0, w.x), chroma);
}

void main() {
    float m = fxM();
    float spot = fxCentre(texCoord);
    float down = CmpPhase.y;
    float aspect = OutSize.x / max(OutSize.y, 1.0);
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);
    float r = length(p);

    // Motion: a slow breath, the rush into the tunnel in the come-up and on a new dose; the clear spot keeps still.
    float rush = 4.0 * CmpPhase.x * (1.0 - CmpPhase.x);
    float zoom = 1.0 - m * spot * (0.02 * fxWave(10.5) + 0.07 * rush + 0.04 * fxKick());
    vec3 base = texture(DiffuseSampler, 0.5 + (texCoord - 0.5) * zoom).rgb;

    // The kaleidoscope: six mirrored wedges of the world, turning (motion), toward the edges only.
    float spin = m * (0.9 * fxWave(42.0) + 0.3 * fxWave(10.5));
    vec2 kq = turn(-spin) * fold(turn(spin) * p * zoom, 6.0) * 0.8;
    vec3 kal = texture(DiffuseSampler, 0.5 + kq / vec2(aspect, 1.0)).rgb;
    vec3 c = mix(base, kal, smoothstep(0.15, 0.7, r) * (0.6 - 0.4 * down));

    // Colour: saturation up and a violet lift in the shadows.
    float luma = fxLuma(c);
    c = mix(vec3(luma), c, 1.35) + vec3(0.07, 0.0, 0.12) * (1.0 - luma);

    // The stained glass and its glowing borders, at most half way for the lines (R-6), both times fxPatterns().
    vec3 raw = undoFinish(texture(PatternSampler, fxSnap(texCoord)).rgb);
    vec3 tint = PALETTE[int(clamp(floor(raw.r * 8.0), 0.0, 7.0))];
    float allowed = fxPatterns();
    c = mix(c, glass(c, tint), clamp(raw.g, 0.0, 1.0) * 0.8 * allowed);
    c = mix(c, mix(tint, vec3(1.0), 0.55), clamp(raw.b, 0.0, 1.0) * 0.5 * allowed);

    // Echoes: the last frame a little larger each frame, so bright things stream outward; the brighter of the two.
    vec2 echo = 0.5 + (texCoord - 0.5) * (1.0 - 0.3 * fxFrameSeconds() * m);
    vec3 last = fxPrev(PrevSampler, echo, vec4(c, 1.0)).rgb;
    c = max(c, last * fxKeep(0.002) * (1.0 - 0.5 * down));

    // Dithered dark corners.
    c *= 1.0 - 0.4 * step(fxBayer(floor(gl_FragCoord.xy / max(CmpComfort.z, 1.0))), smoothstep(0.6, 1.05, r) * 0.6);

    fragColor = fxFinish(base, mix(base, c, spot));
}
