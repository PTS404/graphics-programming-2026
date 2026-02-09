#version 330 core

out vec4 FragColor;

// (todo) 02.5: Add Color input variable here


void main()
{
	// 2.3: Compute alpha using the built-in variable gl_PointCoord
    vec2 coord = gl_PointCoord * 2 - 1; // remap to (-1, 1)
	float alpha = 1 - length(coord);

	FragColor = vec4(1, 1, 1, alpha);
}
