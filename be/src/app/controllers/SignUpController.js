const { ZodError, z } = require("zod");
const AccountAlreadyExists = require("../errors/AccountAlreadyExists");
const SignUpUseCase = require("../useCases/usersCases/SignUpUseCase");

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email().min(1),
  password: z.string().min(8),
});

/**
 * Controller responsible for handling user registration (sign-up).
 */
class SignUpController {
  /**
   * Handles the sign-up request.
   * @param {Object} request - The HTTP request object.
   * @param {Object} request.body - The request body containing name, email, and password.
   * @returns {Promise<Object>} An object containing the HTTP status code and response body.
   */
  async handle({ body }) {
    try {
      const { email, name, password } = schema.parse(body);

      const user = await SignUpUseCase.execute({ email, name, password });

      return {
        statusCode: 201,
        body: {
          message: "Conta criada com sucesso.",
          user,
        },
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
