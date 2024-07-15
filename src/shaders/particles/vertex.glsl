uniform vec2 uResolution;
uniform float uSize;
uniform float uProgress;
uniform vec3 uColorA;
uniform vec3 uColorB;

attribute float aSize;

varying vec3 vColor;

#include ../includes/simplexNoise3d

void main()
{
    // Generate a random initial position based on the vertex ID
    float randX = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453) * 20.0 - 10.0;
    float randY = fract(sin(dot(position.yzx, vec3(12.9898, 78.233, 45.164))) * 43758.5453) * 20.0 - 10.0;
    float randZ = fract(sin(dot(position.zxy, vec3(12.9898, 78.233, 45.164))) * 43758.5453) * 20.0 - 10.0;
    vec3 startPosition = vec3(randX, randY, randZ); // Initial random position in a 20x20x20 cube

    // Compute mixed position based on progress
    float progress = smoothstep(-10.0, 1.0, uProgress);
    vec3 mixedPosition = mix(startPosition, position, progress);

    // Final position
    vec4 modelPosition = modelMatrix * vec4(mixedPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Point size
    gl_PointSize = aSize * uSize * uResolution.y;
    gl_PointSize *= (1.0 / -viewPosition.z);

    // Varyings
    vColor = mix(uColorA, uColorB, progress);
}
