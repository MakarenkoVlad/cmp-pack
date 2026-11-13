#version 150
#moj_import <cmpfixes_drugfx.glsl>
#moj_import <cmpfixes:drugfx_breakthrough.glsl>

// The DMT breakthrough set piece (S7 of docs/design/addictives-fx-design.md; cmpfixes/ADDICTIVES.md, "FX DMT set piece"),
// full size. Our own work for the CMP pack. Seventeen seconds made from the world itself:
//   rise 0-3 s      the world pulls toward the centre and turns a little, streaks into a tunnel of light (the half-size
//                   pass), darkens at the edges with a violet cast, a light grows at the centre; the hall's folds grow in
//                   from the edges
//   rooms 3-14 s    the hex hall, the spiral corridor, the flower temple: drawn at half size by drugfx_breakthrough_rooms,
//                   one sample per effect pixel, put in place here effect pixel by effect pixel
//   return 14-17 s  the temple falls into the centre and the world is back; the white-out (CmpScene.y) lies over it
// Every change of room is a dithered front of effect pixels (no flash). The clear spot round the crosshair stays
// (fxCentre).
//   CmpScene.x  seconds since the breakthrough's window opened (0 to 17)
//   CmpScene.y  the white-out, 0 to 0.92 (0.6 s up, 0.9 s down; through the flash floor, none with flashing off)
//   CmpScene.z  the camera float's ease (unused here)

uniform sampler2D DiffuseSampler;
uniform sampler2D RoomsSampler;
uniform vec4 CmpScene;

in vec2 texCoord;

out vec4 fragColor;

void main() {
    float t = CmpScene.x;
    float m = fxM();
    vec3 clean = texture(DiffuseSampler, texCoord).rgb;
    float bayer = fxBayer(floor(gl_FragCoord.xy / max(CmpComfort.z, 1.0)));
    vec2 fine = btP(texCoord);
    vec2 snapped = fxSnap(texCoord);
    float rn = btOut(btP(snapped));
    float room = btRoom(t, rn, bayer);
    vec3 rooms = texture(RoomsSampler, snapped).rgb;
    vec3 c = clean;
    if (room < 0.5) {
        // The rise: the world pulled in at full size, the half-size streaks over it, darker edges, a violet cast, the light.
        float pull = btPull(t);
        c = texture(DiffuseSampler, btMirror(btUv(btPulled(fine, t, m)))).rgb;
        c = mix(c, rooms, 0.6 * pull);
        c *= 1.0 - 0.45 * pull * smoothstep(0.3, 1.0, rn);
        float l = fxLuma(c);
        c = mix(c, mix(vec3(0.07, 0.01, 0.16), vec3(1.0, 0.7, 0.22), l) * 0.5 + c * 0.5, 0.35 * pull);
        c += vec3(1.0, 0.9, 0.78) * exp(-length(fine) * 6.5) * 0.45 * pull * pull;
    } else if (room < 3.5) {
        c = rooms;
    }
    // The clear spot, the white-out.
    c = mix(clean, c, fxCentre(texCoord));
    c = mix(c, vec3(1.0, 0.97, 0.92), clamp(CmpScene.y, 0.0, 1.0));
    fragColor = fxFinish(clean, c);
}
