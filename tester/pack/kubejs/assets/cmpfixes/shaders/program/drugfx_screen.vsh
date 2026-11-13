#version 150

// The vertex shader of every Create: Addictives look program of CMP (docs/design/addictives-fx-design.md, 2.2): a pass
// draws a quad from (0, 0) to its out target's size, so the quad's corners divided by OutSize fill the target whatever
// its size (half and quarter targets too); ProjMat, which vanilla builds for the screen, is not used.

in vec4 Position;

uniform vec2 OutSize;

out vec2 texCoord;

void main() {
    vec2 uv = Position.xy / OutSize;
    gl_Position = vec4(uv * 2.0 - 1.0, 0.2, 1.0);
    texCoord = uv;
}
