#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The LSD look's layer (S3), drawn into a quarter-size target that the look's composite (addictives:lsd) reads at the
// effect pixel: the flow field (two layers of slow noise that sway, 21 and 35 s), the outlines of things (a brightness or
// colour step between the averages two to three effect pixels to each side, so the fine detail of a block's texture does
// not count) and the aura round them (the same step six and ten effect pixels to each side, so it fades out over about ten
// effect pixels). Worked out once per sixteen screen pixels, so the outlines are chunky pixel blocks. Our own work for the
// CMP pack (docs/design/addictives-fx-design.md, 3.1 S3; cmpfixes/ADDICTIVES.md, "FX intense looks").
//
// Output (data, not colour): rg = 0.5 + the flow (-0.75 to 0.75) / 2; b = the outline and the aura in one: 0.6 + 0.4 x aura
// on an outline, 0.55 x aura elsewhere. The composite undoes what fxFinish did to it and scales the flow by fxM(), the
// stage and the crosshair's clear spot (R-1). The effect pixel comes from InSize, the screen's size. 16 reads a pixel.

uniform sampler2D DiffuseSampler;

in vec2 texCoord;

out vec4 fragColor;

vec3 at(vec2 uv) {
    return texture(DiffuseSampler, uv).rgb;
}

float diff(vec3 a, vec3 b) {
    vec3 d = abs(a - b);
    return 0.5 * (d.r + d.g + d.b) + abs(fxLuma(a) - fxLuma(b));
}

// The step across uv between the averages at near and far effect pixels to each side, the larger of the two directions.
float stepAcross(vec2 uv, vec2 dx, vec2 dy, float near, float far) {
    float across = diff(at(uv + near * dx) + at(uv + far * dx), at(uv - near * dx) + at(uv - far * dx));
    float down = diff(at(uv + near * dy) + at(uv + far * dy), at(uv - near * dy) + at(uv - far * dy));
    return max(across, down) * 0.5;
}

void main() {
    float aspect = OutSize.x / max(OutSize.y, 1.0);
    vec2 q = texCoord * vec2(aspect, 1.0) * 2.6;
    vec2 drift = vec2(fxWave(21.0), fxWave(35.0)) * 1.4;
    vec2 flow = vec2(fxValueNoise(q + drift), fxValueNoise(q + vec2(5.2, 1.3) - drift)) - 0.5;
    flow += 0.5 * (vec2(fxValueNoise(q * 2.7 + drift.yx * 1.7), fxValueNoise(q * 2.7 + vec2(2.7, 8.1) - drift)) - 0.5);
    vec2 pix = vec2(max(CmpComfort.z, 1.0)) / max(InSize, vec2(1.0));
    vec2 dx = vec2(pix.x, 0.0);
    vec2 dy = vec2(0.0, pix.y);
    float outline = step(0.3, stepAcross(texCoord, dx, dy, 2.0, 3.0) * 1.5);
    float aura = clamp(stepAcross(texCoord, dx, dy, 6.0, 10.0) * 1.4, 0.0, 1.0);
    float packed = mix(0.55 * aura, 0.6 + 0.4 * aura, outline);
    vec3 data = vec3(clamp(0.5 + flow * 0.5, 0.0, 1.0), packed);
    fragColor = fxFinish(data, data);
}
