// drugfx_breakthrough.glsl: the scene of the DMT breakthrough set piece (S7 of docs/design/addictives-fx-design.md;
// cmpfixes/ADDICTIVES.md, "FX DMT set piece"), shared by its two programs, drugfx_breakthrough_rooms (half size) and
// drugfx_breakthrough. Our own work for the CMP pack. Import it after cmpfixes_drugfx.glsl:
//
//     #moj_import <cmpfixes_drugfx.glsl>
//     #moj_import <cmpfixes:drugfx_breakthrough.glsl>
//
// Plain functions of a point and the set piece's time t (CmpScene.x, seconds since the window opened; it runs 0 to 17
// and never wraps), so both programs see the same rooms. It reads OutSize and CmpComfort through the include's helpers
// and declares no uniform. The times are SetPieceTimeline's:
//   rise 0-3 s: the world pulls into a tunnel of light, the hall's folds grow in from the edges
//   rooms 3-14 s: hex hall (amber, violet), spiral corridor (teal, magenta), flower-of-life temple (gold, white), 3.67 s
//                 each, joined by 0.8-s dithered wipes that open from the centre
//   return 14-17 s: the temple falls into the centre (14-15 s) and the world is back (the white-out is CmpScene.y)

const float BT_TAU = 6.28318530718;
const float BT_RISE = 3.0;
const float BT_ROOMS_END = 14.0;
const float BT_ROOM = 3.6666667;
const float BT_WIPE = 0.8;
const float BT_FALL_END = 15.0;

// Centred, aspect-true coordinates (y from -0.5 to 0.5), and back.
vec2 btAspect() {
    return vec2(max(OutSize.x, 1.0) / max(OutSize.y, 1.0), 1.0);
}

vec2 btP(vec2 uv) {
    return (uv - 0.5) * btAspect();
}

vec2 btUv(vec2 p) {
    return p / btAspect() + 0.5;
}

// How far out a point is: 0 at the centre, 1 at a corner.
float btOut(vec2 p) {
    return length(p) / length(btAspect() * 0.5);
}

vec2 btRot(vec2 v, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}

// Mirror repeat: 0 to 1 and back every 2, so tiles of the world meet without a seam.
vec2 btMirror(vec2 x) {
    return 1.0 - abs(1.0 - mod(x, 2.0));
}

float btSmooth(float a, float b, float x) {
    return smoothstep(a, b, x);
}

// The nearest centre of a hexagon grid whose centres are 1 apart: the point relative to it (xy) and the centre (zw).
vec4 btHexCell(vec2 p) {
    const vec2 s = vec2(1.0, 1.7320508);
    vec2 a = mod(p, s) - s * 0.5;
    vec2 b = mod(p - s * 0.5, s) - s * 0.5;
    float useA = step(dot(a, a), dot(b, b));
    vec2 local = mix(b, a, useA);
    return vec4(local, p - local);
}

// A hexagon's own radius of a point of its cell: 0.5 on the edge.
float btHexRadius(vec2 q) {
    vec2 a = abs(q);
    return max(a.x, dot(a, vec2(0.5, 0.8660254)));
}

// Folds a point into one of n mirrored sectors (2n copies round the centre), turned by spin.
vec2 btFold(vec2 q, float n, float spin) {
    float r = length(q);
    float sector = BT_TAU / n;
    float a = mod(atan(q.y, q.x) + spin, sector);
    a = abs(a - sector * 0.5);
    return r * vec2(cos(a), sin(a));
}

// Which room a pixel shows at time t: 0 the rise's pulled world, 1 the hex hall, 2 the spiral corridor, 3 the flower
// temple, 4 the world back. Each change is a front of pixels: one goes over when its Bayer threshold (bayer, 0 to 1)
// is under the front there, a pixel-art dissolve with no flash. rn is btOut of the point.
float btRoom(float t, float rn, float bayer) {
    // The rise: the hall's folds come in from the edges, 0.6 s to 3 s.
    float rise = btSmooth(0.6, BT_RISE, t);
    float edge = mix(1.15, -0.2, rise);
    float room = step(edge, rn + (bayer - 0.5) * 0.14);
    // The wipes open from the centre.
    float b1 = BT_RISE + BT_ROOM;
    float b2 = BT_RISE + 2.0 * BT_ROOM;
    float w1 = clamp((t - (b1 - BT_WIPE * 0.5)) / BT_WIPE, 0.0, 1.0);
    float w2 = clamp((t - (b2 - BT_WIPE * 0.5)) / BT_WIPE, 0.0, 1.0);
    room += step(bayer, w1 * 1.35 - rn * 0.35);
    room += step(bayer, w2 * 1.35 - rn * 0.35);
    // The return: the temple shrinks into the centre; outside it the world is back.
    float radius = mix(1.25, -0.15, btSmooth(BT_ROOMS_END, BT_FALL_END, t));
    room += step(radius, rn + (bayer - 0.5) * 0.1);
    return room;
}

// How far the temple has fallen into the centre, 0 to 1.
float btFall(float t) {
    return btSmooth(BT_ROOMS_END, BT_FALL_END, t);
}

// The rise's pull, 0 to 1 over its first 1.8 s.
float btPull(float t) {
    return btSmooth(0.0, 1.8, t);
}

// Where the rise's pulled world is seen at a point: drawn in toward the centre and turned a little (motion m).
vec2 btPulled(vec2 p, float t, float m) {
    float pull = btPull(t);
    float rn = btOut(p);
    return btRot(p * (1.0 - 0.3 * pull * m), 0.3 * pull * pull * m * (1.0 - min(rn, 1.0)));
}

// The hex hall: a corridor toward the centre whose walls are tiled with hexagons. Returns the point in its cell (xy),
// the depth along the hall (z: 1 at the screen's top edge, growing toward the centre) and the distance to the cell's
// edge (w, cell units); id is the cell's centre. m is the motion (fxM): the hall moves past only with it.
vec4 btHall(vec2 p, float t, float m, out vec2 id) {
    vec2 a = abs(p);
    float wall = max(a.x / 1.7, a.y);
    float z = 0.5 / max(wall, 0.004);
    float onFloor = step(a.x / 1.7, a.y);
    float across = mix(p.y / max(wall, 0.004) * 1.7, p.x / max(wall, 0.004), onFloor);
    // The four walls get cells of their own (an offset per wall), so they do not mirror each other.
    float side = onFloor * step(0.0, p.y) + (1.0 - onFloor) * (2.0 + step(0.0, p.x));
    vec2 hp = vec2(across * 1.25 + side * 7.31, z * 1.25 + t * 0.85 * m);
    vec4 cell = btHexCell(hp);
    id = cell.zw;
    return vec4(cell.xy, z, 0.5 - btHexRadius(cell.xy));
}

// The hall's four corners, where its walls meet: 0 on a corner line, growing away from it.
float btHallCorner(vec2 p) {
    vec2 a = abs(p);
    float wall = max(a.x / 1.7, a.y);
    return abs(a.x / 1.7 - a.y) / max(wall, 0.004);
}

// The spiral corridor: log-polar tiles, six arms twisting into the centre; with motion they flow in. Returns the tile
// coordinates (xy: arms across x, rings along y) and the distance from the centre (z).
vec3 btSpiral(vec2 p, float t, float m) {
    float r = max(length(p), 0.0005);
    float lr = log(r);
    float ang = atan(p.y, p.x) / BT_TAU;
    return vec3(ang * 6.0 + lr * 0.9, lr * 1.5 + t * 0.55 * m, r);
}

// The flower of life: circles of radius 1 on the hexagon grid's centres (each through its six neighbours' centres).
// Returns the distance to the nearest circle (x) and how many circles hold the point (y; the petals are where two do).
vec2 btFlower(vec2 q) {
    vec2 c = btHexCell(q).xy;
    float d = abs(length(c) - 1.0);
    float inside = step(length(c), 1.0);
    for (int i = 0; i < 6; i++) {
        float a = float(i) * BT_TAU / 6.0;
        float l = length(c - vec2(cos(a), sin(a)));
        d = min(d, abs(l - 1.0));
        inside += step(l, 1.0);
    }
    return vec2(d, inside);
}

// The temple's size: the flower's circle radius in screen heights, and the medallion's radius.
const float BT_PETAL = 0.125;
const float BT_MEDALLION = 0.375;

// A thin line of a distance field: 1 on it, 0 from w away (soft by an effect pixel's share).
float btLine(float d, float w) {
    return 1.0 - smoothstep(w * 0.5, w, d);
}
