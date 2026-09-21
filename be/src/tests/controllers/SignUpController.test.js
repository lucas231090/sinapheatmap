const SignUpController = require("../../app/controllers/SignUpController");
const SignUpUseCase = require("../../app/useCases/usersCases/SignUpUseCase");
const AccountAlreadyExists = require("../../app/errors/AccountAlreadyExists");

// Mocking the UseCase
jest.mock("../../app/useCases/usersCases/SignUpUseCase");

describe("SignUpController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 201 when account is created successfully", async () => {
    const request = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      },
    };

    const mockedUser = { id: "123", name: "John Doe", email: "john@example.com" };
    SignUpUseCase.execute.mockResolvedValue(mockedUser);

    const response = await SignUpController.handle(request);

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      message: "Conta criada com sucesso.",
      user: mockedUser,
    });
    expect(SignUpUseCase.execute).toHaveBeenCalledWith(request.body);
  });

  it("should return 400 when validation fails (missing fields)", async () => {
    const request = {
      body: {
        email: "john@example.com",
      },
    };

    const response = await SignUpController.handle(request);

    expect(response.statusCode).toBe(400);
    // Should have validation errors for name and password
    expect(response.body).toBeInstanceOf(Array);
    expect(SignUpUseCase.execute).not.toHaveBeenCalled();
  });

  it("should return 400 when validation fails (invalid email)", async () => {
    const request = {
      body: {
        name: "John Doe",
        email: "invalid-email",
        password: "password123",
      },
    };

    const response = await SignUpController.handle(request);

    expect(response.statusCode).toBe(400);
    expect(SignUpUseCase.execute).not.toHaveBeenCalled();
  });

  it("should return 409 when account already exists", async () => {
    const request = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      },
    };

    SignUpUseCase.execute.mockRejectedValue(new AccountAlreadyExists());

    const response = await SignUpController.handle(request);

    expect(response.statusCode).toBe(409);
    expect(response.body).toEqual({ error: "This email is already in use." });
  });

  it("should throw error when an unknown error occurs", async () => {
    const request = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      },
    };

    const unknownError = new Error("Unknown error");
    SignUpUseCase.execute.mockRejectedValue(unknownError);

    await expect(SignUpController.handle(request)).rejects.toThrow(unknownError);
  });
});
