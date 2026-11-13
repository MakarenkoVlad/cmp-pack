#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The adderall look of CMP, new (docs/design/addictives-fx-design.md, 3.1 S3; cmpfixes/ADDICTIVES.md, "FX calm looks").
// Our own work for the CMP pack.
// Focus: the middle of the view sharpened by 30% and a touch more contrast, clean and cool; the outer part of the view
// greyer and soft, the line between them in dithered pixel steps (a tunnel of attention). The crash (its comedown) turns
// it grey and heavy: the colour drains, the soft edge closes in and the picture dims.
// Reads: the picture five times (one sharpen and soften from the same four reads).

uniform sampler2D DiffuseSampler;

in vec2 texCoord;

out vec4 fragColor;

void main() {
    float s = clamp(fxS(), 0.0, 1.15);
    float back = CmpPhase.y;
    vec3 clean = texture(DiffuseSampler, texCoord).rgb;
    vec2 q = texCoord - 0.5;
    q.x *= OutSize.x / max(OutSize.y, 1.0);
    float r2 = dot(q, q);

    // The tunnel of attention: the focus closes in during the crash. Its edge is in dithered steps.
    float inner = mix(0.16, 0.06, back);
    float outside = smoothstep(inner, inner + 0.42, r2);
    float stepped = clamp(floor(outside * 4.0 + fxBayer(floor(gl_FragCoord.xy / max(CmpComfort.z, 1.0)))) / 4.0, 0.0, 1.0);

    // Four reads round the point: close in the middle (to sharpen), wider outside (to soften).
    vec2 reach = fxPix() * mix(0.5, 1.8, outside);
    vec3 around = texture(DiffuseSampler, texCoord + vec2(reach.x, reach.y)).rgb + texture(DiffuseSampler, texCoord - vec2(reach.x, reach.y)).rgb
            + texture(DiffuseSampler, texCoord + vec2(reach.x, -reach.y)).rgb + texture(DiffuseSampler, texCoord - vec2(reach.x, -reach.y)).rgb;
    around *= 0.25;
    vec3 sharp = clean + (clean - around) * 1.1;
    sharp = (sharp - 0.5) * 1.16 + 0.5;
    sharp = mix(vec3(fxLuma(sharp)), sharp, 1.12) * vec3(0.98, 1.0, 1.03);
    vec3 soft = mix(clean, around, 0.8);
    soft = mix(vec3(fxLuma(soft)), soft, 0.22) * vec3(0.8, 0.84, 0.92);
    vec3 c = mix(sharp, soft, stepped);

    // The crash: grey and heavy.
    c = mix(c, vec3(fxLuma(c)) * vec3(0.92, 0.94, 0.98), 0.55 * back);
    c *= 1.0 - 0.25 * back * (0.5 + 0.5 * outside);

    fragColor = fxFinish(clean, c);
}
