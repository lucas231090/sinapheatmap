const { ZodError, z } = require("zod");
const InvalidCredentials = require("../errors/InvalidCredentials");
const SignInUseCase = require("../useCases/usersCases/SignInUseCase");

const schema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(8),
});

class SignInController {
  async handle({ body }) {
    try {
      const { email, password } = schema.parse(body);

      const { accessToken } = await SignInUseCase.execute({ email, password });

      return {
        statusCode: 200,
        body: {
          accessToken,
        },
      };
    } catch (error) {
      console.error(error);
      if (error instanceof ZodError) {
        return {
          statusCode: 400,
          body: error.issues,
        };
      }

      if (error instanceof InvalidCredentials) {
        return {
          statusCode: 401,
          body: {
            error: "Invalid credentials.",
          },
        };
      }

      throw error;
    }
  }
}

module.exports = new SignInController();
