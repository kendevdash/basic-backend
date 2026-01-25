import swaggerJsdoc from "swagger-jsdoc";

const port = process.env.PORT || 5000;
const options = {
	definition: {
		openapi: "3.0.3",
		info: {
			title: "Basic Backend Auth API",
			description: "Authentication endpoints with JWT access/refresh tokens and role-based access.",
			version: "1.0.0"
		},
		servers: [
			{
				url: process.env.SERVER_URL || `http://localhost:${port}`,
				description: "Local"
			}
		],
		components: {
			schemas: {
				AuthUser: {
					type: "object",
					properties: {
						id: { type: "string" },
						fullName: { type: "string" },
						email: { type: "string", format: "email" },
						role: { type: "string", enum: ["Admin", "Student", "Teacher"] },
						isPaid: { type: "boolean" }
					}
				},
				RegisterRequest: {
					type: "object",
					required: ["fullName", "email", "password"],
					properties: {
						fullName: { type: "string", example: "Jane Doe" },
						email: { type: "string", example: "jane@example.com" },
						password: { type: "string", example: "StrongP@ssw0rd" },
						role: { type: "string", enum: ["Admin", "Student", "Teacher"], example: "Student" },
						isPaid: { type: "boolean", example: false }
					}
				},
				LoginRequest: {
					type: "object",
					required: ["email", "password"],
					properties: {
						email: { type: "string", example: "jane@example.com" },
						password: { type: "string", example: "StrongP@ssw0rd" }
					}
				},
				AuthResponse: {
					type: "object",
					properties: {
						message: { type: "string" },
						user: { $ref: "#/components/schemas/AuthUser" },
						accessToken: { type: "string", description: "JWT access token" }
					}
				}
			},
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT"
				}
			}
		},
		security: [
			{
				bearerAuth: []
			}
		]
	},
	apis: ["./src/routes/auth.routes.js"]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
