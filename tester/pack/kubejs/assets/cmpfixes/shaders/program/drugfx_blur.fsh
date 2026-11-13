#version 150
#moj_import <cmpfixes_drugfx.glsl>

// A helper pass of the calm drug looks of CMP (cmpfixes/ADDICTIVES.md, "FX calm looks"): a 3 x 3 tent blur of a small
// target, its reach BlurReach texels of the input (the chain sets it per pass); with linear reads two of them in a row
// give a wide, smooth blur for a few reads a pixel (R-10). It writes a half* or quarter* target only. Our own work for the
// CMP pack.

uniform sampler2D DiffuseSampler;
uniform float BlurReach;

in vec2 texCoord;

out vec4 fragColor;

void main() {
    vec2 r = BlurReach / max(InSize, vec2(1.0));
    vec3 c = texture(DiffuseSampler, texCoord).rgb * 4.0;
    c += texture(DiffuseSampler, texCoord + vec2(r.x, 0.0)).rgb * 2.0;
    c += texture(DiffuseSampler, texCoord - vec2(r.x, 0.0)).rgb * 2.0;
    c += texture(DiffuseSampler, texCoord + vec2(0.0, r.y)).rgb * 2.0;
    c += texture(DiffuseSampler, texCoord - vec2(0.0, r.y)).rgb * 2.0;
    c += texture(DiffuseSampler, texCoord + r).rgb;
    c += texture(DiffuseSampler, texCoord - r).rgb;
    c += texture(DiffuseSampler, texCoord + vec2(r.x, -r.y)).rgb;
    c += texture(DiffuseSampler, texCoord + vec2(-r.x, r.y)).rgb;
    fragColor = vec4(c / 16.0, 1.0);
}
