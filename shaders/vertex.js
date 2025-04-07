const vertex = /* glsl */`
uniform float waveFreq;
attribute float songFrequency;

varying vec3 vPosition;

void main(){
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);  
    modelPosition.y += songFrequency * waveFreq;
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;
    vPosition = position;
}`;

export default vertex;