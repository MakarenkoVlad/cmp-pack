#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The overdose look of CMP, new (O1's look part; docs/design/addictives-fx-design.md, 3.1 S3 and 3.5 O1;
// cmpfixes/ADDICTIVES.md, "FX calm looks"). Our own work for the CMP pack.
// Going under: the colour drains to a cold blue-grey, the skin-blue of cyanosis creeps in from the edges, the world blurs
// and doubles. It grows through stage I (the strength rises from 0.45 to 0.8 over 8 s) and gets worse in stage II (the
// amplifier: double vision twice as wide, the blur and the drain deeper). On each slow heartbeat the two copies of the
// world pull together and the blur eases for a moment, then they drift apart again. The tunnel, the blackouts on the beat
// and the dark edge that stays at strength 0 are the HUD's (fxview).
// Reads: the picture twice (the double vision), its half-size copy (SoftSampler) and a wide blur at a quarter of the size
// (BlurSampler).

uniform sampler2D DiffuseSampler;
uniform sampler2D SoftSampler;
uniform sampler2D BlurSampler;

in vec2 texCoord;

out vec4 fragColor;

void main() {
    float s = clamp(fxS(), 0.0, 1.15);
    float m = fxM();
    float stageTwo = step(0.2, fxDose());
    float deep = clamp((s - 0.45) / 0.55, 0.0, 1.0) * 0.6 + 0.4 * stageTwo;
    vec3 clean = texture(DiffuseSampler, texCoord).rgb;

    // The heartbeat: the copies pull together for a moment on each beat.
    float beat = fxPulse(0.3);

    // Double vision: two copies drifting apart (10.5 s), twice as wide in stage II.
    vec2 split = vec2(0.006 + 0.012 * stageTwo, 0.002 + 0.002 * stageTwo) * (0.65 + 0.35 * fxWave(10.5)) * (1.0 - 0.6 * beat) * m;
    vec3 sharp = mix(texture(DiffuseSampler, texCoord - split).rgb, texture(DiffuseSampler, texCoord + split).rgb, 0.5);
    vec3 soft = texture(SoftSampler, texCoord).rgb;
    vec3 blur = texture(BlurSampler, texCoord).rgb;
    vec2 q = texCoord - 0.5;
    q.x *= OutSize.x / max(OutSize.y, 1.0);
    float r2 = dot(q, q);
    float edge = smoothstep(0.05, 0.85, r2);

    // The blur, deeper with the stage, easing on the beat.
    vec3 c = mix(sharp, soft, 0.3 + 0.3 * deep);
    c = mix(c, blur, (0.15 + 0.45 * edge + 0.25 * deep) * (1.0 - 0.35 * beat));

    // The colour drains to a cold blue-grey; cyanosis (a deep violet-blue) creeps in from the edges.
    float l = fxLuma(c);
    c = mix(c, vec3(l) * vec3(0.8, 0.88, 1.06), 0.7 + 0.25 * deep);
    float creep = smoothstep(0.55 - 0.3 * deep, 1.25, r2);
    float stepsOut = clamp(floor(creep * 4.0 + fxBayer(floor(gl_FragCoord.xy / max(CmpComfort.z, 1.0)))) / 4.0, 0.0, 1.0);
    c = mix(c, c * vec3(0.42, 0.48, 0.95) + vec3(0.01, 0.0, 0.05), stepsOut * 0.85);
    c = (c - 0.5) * (0.88 - 0.1 * deep) + 0.5;
    c *= 0.9 - 0.15 * deep;

    fragColor = fxFinish(clean, c);
}
