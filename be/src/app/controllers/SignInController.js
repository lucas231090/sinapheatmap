const { ZodError, z } = require("zod");
const InvalidCredentials = require("../errors/InvalidCredentials");
const SignInUseCase = require("../useCases/usersCases/SignInUseCase");
const logger = require("../configs/logger");

const schema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(8),
});

/**
 * Controller responsible for handling user authentication (sign-in).
 * Validates user credentials and provides authentication tokens upon success.
 */
class SignInController {
  /**
   * Handles the sign-in request.
   * Validates the request body against a Zod schema, then delegates the authentication
   * logic to the SignInUseCase.
   *
   * @param {Object} request - The HTTP request object.
   * @param {Object} request.body - The request body containing the user's email and password.
   * @returns {Promise<Object>} An object containing the HTTP status code (200, 400, or 401) and response body.
   */
  async handle({ body }) {
    try {
      const { email, password } = schema.parse(body);

      const result = await SignInUseCase.execute({ email, password });

      return {
        statusCode: 200,
        body: result,
      };
    } catch (error) {
      logger.error("Erro no SignIn: %s", error.message);
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
