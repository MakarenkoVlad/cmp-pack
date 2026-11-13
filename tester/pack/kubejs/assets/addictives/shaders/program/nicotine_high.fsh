#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The nicotine look of CMP (cigarettes, spliffs, snus and nicotine vapes; docs/design/addictives-fx-design.md, 3.1 S3;
// cmpfixes/ADDICTIVES.md, "FX calm looks"). Our own work for the CMP pack, at the mod's path so its own slot shows it too
// when the screen framework is off.
// A head rush: colour 40% richer, a little brighter and crisper in the middle, a light-headed pressure at the edges in
// dithered pixel steps that swells a little on each heartbeat, and a short afterimage of what moves. The curve eases it
// in over 1.5 s, holds it, then lets it down to its floor (the rush): it never pops on or off.
// Reads: the picture three times (a light sharpen) and the last frame (PrevSampler).

uniform sampler2D DiffuseSampler;
uniform sampler2D PrevSampler;

in vec2 texCoord;

out vec4 fragColor;

float stepped(float v, float n) {
    float b = fxBayer(floor(gl_FragCoord.xy / max(CmpComfort.z, 1.0)));
    return clamp(floor(v * n + b) / n, 0.0, 1.0);
}

void main() {
    float s = clamp(fxS(), 0.0, 1.15);
    float back = CmpPhase.y;
    vec3 clean = texture(DiffuseSampler, texCoord).rgb;
    vec2 q = texCoord - 0.5;
    q.x *= OutSize.x / max(OutSize.y, 1.0);
    float r2 = dot(q, q);

    // Crisper in the middle: a light sharpen from two diagonal reads.
    vec2 px = fxPix() * 0.5;
    vec3 blur = 0.5 * (texture(DiffuseSampler, texCoord + px).rgb + texture(DiffuseSampler, texCoord - px).rgb);
    vec3 c = clean + (clean - blur) * 0.45 * (1.0 - smoothstep(0.1, 0.6, r2));

    // The rush: colour 40% richer, 4% brighter, a warm gold in the light.
    c = mix(vec3(fxLuma(c)), c, 1.45);
    c *= 1.05;
    c = mix(c, c * vec3(1.05, 1.0, 0.9), smoothstep(0.5, 1.0, fxLuma(c)));

    // Light-headed pressure at the edges: a dark ring in dithered steps, pulled in a little on each heartbeat.
    float beat = fxPulse(0.3);
    float ring = smoothstep(0.12 - 0.04 * beat, 0.85, r2);
    float edge = stepped(ring, 5.0);
    c = mix(c, c * vec3(0.46, 0.42, 0.58), edge * 0.8 * (1.0 - 0.5 * back));
    // A light-headed brightening round the middle, the other side of the rush.
    c += vec3(0.06, 0.055, 0.04) * (1.0 - smoothstep(0.0, 0.3, r2)) * (0.6 + 0.4 * beat);

    // A short afterimage: the brighter of now and the last frame, fading fast (the same length at any frame rate).
    vec3 last = fxPrev(PrevSampler, texCoord, vec4(c, 1.0)).rgb;
    c = max(c, last * fxKeep(0.00000003) * vec3(0.96, 0.93, 0.97));

    fragColor = fxFinish(clean, c);
}
