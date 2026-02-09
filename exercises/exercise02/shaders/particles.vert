#version 330 core

layout (location = 0) in vec2 ParticlePosition;
// (todo) 02.X: Add more vertex attributes
layout (location = 1) in float ParticleSize;

layout (location = 2) in float ParticleBirth;
layout (location = 3) in float ParticleDuration;
uniform float CurrentTime;

// 02.5: Add Color output variable here
layout (location = 4) in vec4 ParticleColorIn;
out vec4 ParticleColor;

// (todo) 02.X: Add uniforms


void main()
{
	float Age = (CurrentTime - ParticleBirth);

	gl_Position = vec4(ParticlePosition, 0.0, 1.0);
	if (Age > ParticleDuration)
	{
		gl_PointSize = 0.0;
	}
	else
	{
		gl_PointSize = ParticleSize;
	}

	ParticleColor = ParticleColorIn;
}
