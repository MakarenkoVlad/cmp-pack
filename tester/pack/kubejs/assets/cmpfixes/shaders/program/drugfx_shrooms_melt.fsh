#version 150
#moj_import <cmpfixes_drugfx.glsl>

// The shrooms look's quarter-size layer (S3), which the look's composite (addictives:shrooms) reads with linear filtering:
// the warp field (a heavy melt of two slow noise layers swaying, walls that breathe in and out over 12 s, a ripple that
// runs out from the centre every 6 s) and the marbling (a noise folded through itself twice, so colour flows in swirls
// like oil on water; the composite draws its veins). Worked out once per sixteen screen pixels. Our own work for the CMP
// pack (docs/design/addictives-fx-design.md, 3.1 S3; cmpfixes/ADDICTIVES.md, "FX intense looks").
//
// Output (data, not colour): rg = 0.5 + the offset in screen heights x 5, at full motion; b = the marbling (0 to 1). The
// composite undoes what fxFinish did to it and scales the offset by fxM(), the stage and the crosshair's clear spot
// (R-1). The swirls drift by oscillations times fxM() too.

in vec2 texCoord;

out vec4 fragColor;

float fbm(vec2 q) {
    float v = 0.5 * fxValueNoise(q);
    v += 0.25 * fxValueNoise(q * 2.03 + vec2(17.0, 9.0));
    v += 0.125 * fxValueNoise(q * 4.07 + vec2(5.0, 31.0));
    return v / 0.875;
}

void main() {
    float aspect = OutSize.x / max(OutSize.y, 1.0);
    vec2 q = texCoord * vec2(aspect, 1.0);
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);
    float r = length(p);
    vec2 sway = vec2(fxWave(30.0), fxWave(42.0)) * 1.2;
    vec2 melt = vec2(fxValueNoise(q * 2.2 + sway), fxValueNoise(q * 2.2 + vec2(4.7, 9.1) - sway)) - 0.5;
    melt += 0.45 * (vec2(fxValueNoise(q * 5.0 - sway.yx), fxValueNoise(q * 5.0 + vec2(1.9, 6.3) + sway)) - 0.5);
    vec2 bulge = (vec2(fxValueNoise(q * 1.4 + vec2(3.3, 0.7)), fxValueNoise(q * 1.4 + vec2(8.2, 5.5))) - 0.5) * fxWave(12.0);
    float wave = fract(Time / 6.0);
    float ring = exp(-pow((r - wave * 1.15) / 0.06, 2.0)) * sin(FX_TAU * wave * 0.5);
    vec2 offset = melt * 0.05 + bulge * 0.06 + p / max(r, 1e-4) * ring * 0.012;
    // The marbling: twice folded noise; the folds sway (motion), so the swirls curl and uncurl.
    vec2 m = p * 3.2;
    vec2 curl = fxM() * vec2(fxWave(35.0), fxWave(21.0)) * 0.9;
    vec2 a = vec2(fbm(m + curl), fbm(m + vec2(5.2, 1.3) - curl));
    vec2 b = vec2(fbm(m + 3.0 * a + vec2(1.7, 9.2) + curl.yx * 0.6), fbm(m + 3.0 * a + vec2(8.3, 2.8)));
    float marble = fbm(m + 3.2 * b);
    vec3 data = vec3(clamp(0.5 + offset * 5.0, 0.0, 1.0), clamp(marble, 0.0, 1.0));
    fragColor = fxFinish(data, data);
}
