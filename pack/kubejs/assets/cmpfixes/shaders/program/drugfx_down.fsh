#version 150
#moj_import <cmpfixes_drugfx.glsl>

// A helper pass of the calm drug looks of CMP (cmpfixes/ADDICTIVES.md, "FX calm looks"): the picture at half the size of
// its input, each pixel the average of a 4 x 4 block (five linear reads), for the looks' soft focus, glow and blur (R-10).
// It writes a half* or quarter* target only; the look's last pass mixes it in. Our own work for the CMP pack.

uniform sampler2D DiffuseSampler;

in vec2 texCoord;

out vec4 fragColor;

void main() {
    vec2 texel = 1.0 / max(InSize, vec2(1.0));
    vec3 c = texture(DiffuseSampler, texCoord).rgb * 4.0;
    c += texture(DiffuseSampler, texCoord + texel * vec2(1.0, 1.0)).rgb;
    c += texture(DiffuseSampler, texCoord + texel * vec2(-1.0, 1.0)).rgb;
    c += texture(DiffuseSampler, texCoord + texel * vec2(1.0, -1.0)).rgb;
    c += texture(DiffuseSampler, texCoord + texel * vec2(-1.0, -1.0)).rgb;
    fragColor = vec4(c / 8.0, 1.0);
}
