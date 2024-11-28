const { ZodError, z } = require("zod");
const AccountAlreadyExists = require("../errors/AccountAlreadyExists");
const SignUpUseCase = require("../useCases/usersCases/SignUpUseCase");

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email().min(1),
  password: z.string().min(8),
});

class SignUpController {
  async handle({ body }) {
    try {
      const { email, name, password } = schema.parse(body);

      await SignUpUseCase.execute({ email, name, password });

      return {
        statusCode: 204,
        body: null,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          statusCode: 400,
          body: error.issues,
        };
      }

      if (error instanceof AccountAlreadyExists) {
        return {
          statusCode: 409,
          body: {
            error: "This email is already in use.",
          },
        };
      }

      throw error;
    }
  }
}

module.exports = new SignUpController();
