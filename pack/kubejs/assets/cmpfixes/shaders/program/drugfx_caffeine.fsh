#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The caffeine look of CMP, new (docs/design/addictives-fx-design.md, 3.1 S3; cmpfixes/ADDICTIVES.md, "FX calm looks").
// Our own work for the CMP pack.
// Awake: a light sharpen (15%), slightly warmer colour (a coffee warmth in the mids), the light a little brighter, a faint
// buzz at the very edges in dithered steps; on a new dose (the kick) the view zooms in a little and springs back.
// Reads: the picture three times.

uniform sampler2D DiffuseSampler;

in vec2 texCoord;

out vec4 fragColor;

void main() {
    float s = clamp(fxS(), 0.0, 1.15);
    float m = fxM();
    float back = CmpPhase.y;
    vec3 clean = texture(DiffuseSampler, texCoord).rgb;

    // The kick: a small zoom toward the middle (R-1: times the motion).
    vec2 uv = 0.5 + (texCoord - 0.5) * (1.0 - 0.018 * fxKick() * m);
    vec3 c = texture(DiffuseSampler, uv).rgb;
    vec2 px = fxPix() * 0.6;
    vec3 around = 0.5 * (texture(DiffuseSampler, uv + px).rgb + texture(DiffuseSampler, uv - px).rgb);
    c = c + (c - around) * 0.8;

    // Warmer, a coffee brown in the mids, the light a little brighter.
    float l = fxLuma(c);
    c *= mix(vec3(1.08, 0.98, 0.86), vec3(1.1, 1.05, 0.94), smoothstep(0.4, 1.0, l));
    c = mix(c, c * vec3(1.1, 0.94, 0.76), 4.0 * l * (1.0 - l) * 0.7);
    c = mix(vec3(fxLuma(c)), c, 1.18);

    // A faint buzz at the very edges, in dithered steps.
    vec2 q = texCoord - 0.5;
    q.x *= OutSize.x / max(OutSize.y, 1.0);
    float edge = clamp(floor(smoothstep(0.3, 1.1, dot(q, q)) * 4.0 + fxBayer(floor(gl_FragCoord.xy / max(CmpComfort.z, 1.0)))) / 4.0, 0.0, 1.0);
    c = mix(c, c * vec3(0.72, 0.58, 0.44), 0.6 * edge * (1.0 - 0.5 * back));

    fragColor = fxFinish(clean, c);
}
