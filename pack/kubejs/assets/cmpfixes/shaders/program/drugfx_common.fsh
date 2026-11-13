#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The common pass of the Create: Addictives drug looks of CMP (docs/design/addictives-fx-design.md, 2.1, 2.9): after the
// looks of a frame, once, and only when it has work. Our own work for the CMP pack.
//   CmpCommon.x  a blur moment (S4: weed and lean every 25-40 s, Benadryl, the opioids' lifting eyelids), 0 to 1, times
//                the comfort strength; 9 reads while it lasts
//   CmpCommon.y  the withdrawal drain after a high (2.7), 0 to 0.35, times the comfort strength
//   CmpCommon.z  the flash the flash floor admitted (FlashBudget: at most 3 starts in any second, each at most 200 ms),
//                signed: above 0 brightens toward white, below 0 darkens toward black; whoever asked for it (a look's
//                flash, the overdose's blackout, the set piece's white-out)

uniform sampler2D DiffuseSampler;
uniform vec4 CmpCommon;

in vec2 texCoord;

out vec4 fragColor;

void main() {
    vec3 clean = texture(DiffuseSampler, texCoord).rgb;
    vec3 c = clean;
    float blur = clamp(CmpCommon.x, 0.0, 1.0);
    if (blur > 0.002) {
        // A 3 x 3 tent, its reach one to four effect pixels as the moment swells.
        vec2 reach = fxPix() * (1.0 + 3.0 * blur);
        vec3 sum = clean * 4.0;
        sum += texture(DiffuseSampler, texCoord + vec2(reach.x, 0.0)).rgb * 2.0;
        sum += texture(DiffuseSampler, texCoord - vec2(reach.x, 0.0)).rgb * 2.0;
        sum += texture(DiffuseSampler, texCoord + vec2(0.0, reach.y)).rgb * 2.0;
        sum += texture(DiffuseSampler, texCoord - vec2(0.0, reach.y)).rgb * 2.0;
        sum += texture(DiffuseSampler, texCoord + reach).rgb;
        sum += texture(DiffuseSampler, texCoord - reach).rgb;
        sum += texture(DiffuseSampler, texCoord + vec2(reach.x, -reach.y)).rgb;
        sum += texture(DiffuseSampler, texCoord + vec2(-reach.x, reach.y)).rgb;
        c = mix(c, sum / 16.0, blur);
    }
    c = fxDrain(c, clamp(CmpCommon.y, 0.0, 0.35));
    float flash = clamp(CmpCommon.z, -1.0, 1.0);
    vec3 white = c + (vec3(1.0) - c) * max(flash, 0.0);
    c = white * (1.0 - max(-flash, 0.0));
    fragColor = fxFinish(clean, c);
}
