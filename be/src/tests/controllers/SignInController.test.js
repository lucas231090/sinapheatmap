const SignInController = require("../../app/controllers/SignInController");
const SignInUseCase = require("../../app/useCases/usersCases/SignInUseCase");
const InvalidCredentials = require("../../app/errors/InvalidCredentials");

jest.mock("../../app/useCases/usersCases/SignInUseCase");
jest.mock("../../app/configs/logger", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

describe("SignInController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 and token when credentials are valid", async () => {
    const request = {
      body: {
        email: "test@example.com",
        password: "password123",
      },
    };

    const mockResult = { token: "fake-jwt-token", user: { id: "1", name: "Test" } };
    SignInUseCase.execute.mockResolvedValue(mockResult);

    const response = await SignInController.handle(request);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockResult);
    expect(SignInUseCase.execute).toHaveBeenCalledWith(request.body);
  });

  it("should return 400 when validation fails (missing email)", async () => {
    const request = {
      body: {
        password: "password123",
      },
    };

    const response = await SignInController.handle(request);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBeInstanceOf(Array);
    expect(SignInUseCase.execute).not.toHaveBeenCalled();
  });

  it("should return 401 when credentials are invalid", async () => {
    const request = {
      body: {
        email: "test@example.com",
        password: "wrongpassword",
      },
    };

    SignInUseCase.execute.mockRejectedValue(new InvalidCredentials());

    const response = await SignInController.handle(request);

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: "Invalid credentials." });
  });

  it("should throw error when an unknown error occurs", async () => {
    const request = {
      body: {
        email: "test@example.com",
        password: "password123",
      },
    };

    const unknownError = new Error("Unknown database error");
    SignInUseCase.execute.mockRejectedValue(unknownError);

    await expect(SignInController.handle(request)).rejects.toThrow(unknownError);
  });
});
