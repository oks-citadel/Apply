/**
 * Auth Service E2E Tests
 * Tests authentication flows including registration, login, logout, and token refresh
 */

import { authClient, config, testState } from "./setup";
import { createTestUser } from "./fixtures";

describe("Auth Service E2E", () => {
  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const testUser = createTestUser();

      const response = await authClient.post("/auth/register", testUser);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty("accessToken");
      expect(response.data).toHaveProperty("refreshToken");
      expect(response.data).toHaveProperty("user");
      expect(response.data.user.email).toBe(testUser.email);
      expect(response.data.user.firstName).toBe(testUser.firstName);
      expect(response.data.user.lastName).toBe(testUser.lastName);
      expect(response.data.user).not.toHaveProperty("password");
    });

    it("should reject duplicate email registration", async () => {
      const testUser = createTestUser();

      // First registration should succeed
      await authClient.post("/auth/register", testUser);

      // Second registration with same email should fail
      try {
        await authClient.post("/auth/register", testUser);
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(409);
        expect(error.response.data).toHaveProperty("message");
      }
    });

    it("should reject invalid email format", async () => {
      const testUser = createTestUser({ email: "invalid-email" });

      try {
        await authClient.post("/auth/register", testUser);
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it("should reject weak password", async () => {
      const testUser = createTestUser({ password: "123" });

      try {
        await authClient.post("/auth/register", testUser);
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it("should reject missing required fields", async () => {
      try {
        await authClient.post("/auth/register", {
          email: "test@example.com",
        });
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe("POST /auth/login", () => {
    it("should login with valid credentials", async () => {
      const testUser = createTestUser();

      // Register user first
      await authClient.post("/auth/register", testUser);

      // Login with registered credentials
      const response = await authClient.post("/auth/login", {
        email: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("accessToken");
      expect(response.data).toHaveProperty("refreshToken");
      expect(response.data).toHaveProperty("expiresIn");
      expect(response.data).toHaveProperty("user");
      expect(response.data.user.email).toBe(testUser.email);
    });

    it("should login with pre-configured test user", async () => {
      const response = await authClient.post("/auth/login", {
        email: config.testEmail,
        password: config.testPassword,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("accessToken");
    });

    it("should reject non-existent user", async () => {
      try {
        await authClient.post("/auth/login", {
          email: "nonexistent@example.com",
          password: "AnyPassword123!",
        });
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it("should reject missing credentials", async () => {
      try {
        await authClient.post("/auth/login", {});
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe("GET /auth/me", () => {
    it("should return current user with valid token", async () => {
      const testUser = createTestUser();

      // Register and get token
      const registerResponse = await authClient.post("/auth/register", testUser);
      const accessToken = registerResponse.data.accessToken;

      // Get current user
      const response = await authClient.get("/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("id");
      expect(response.data).toHaveProperty("email");
      expect(response.data.email).toBe(testUser.email);
    });

    it("should reject request without token", async () => {
      try {
        await authClient.get("/auth/me");
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it("should reject request with invalid token", async () => {
      try {
        await authClient.get("/auth/me", {
          headers: { Authorization: "Bearer invalid-token" },
        });
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe("POST /auth/refresh", () => {
    it("should refresh access token with valid refresh token", async () => {
      const testUser = createTestUser();

      // Register and get tokens
      const registerResponse = await authClient.post("/auth/register", testUser);
      const refreshToken = registerResponse.data.refreshToken;

      // Refresh token
      const response = await authClient.post("/auth/refresh", {
        refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("accessToken");
      expect(response.data).toHaveProperty("expiresIn");
    });

    it("should reject invalid refresh token", async () => {
      try {
        await authClient.post("/auth/refresh", {
          refreshToken: "invalid-refresh-token",
        });
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe("POST /auth/forgot-password", () => {
    it("should accept valid email for password reset", async () => {
      const testUser = createTestUser();

      // Register user first
      await authClient.post("/auth/register", testUser);

      const response = await authClient.post("/auth/forgot-password", {
        email: testUser.email,
      });

      // Should always return 200 for security (don't reveal if email exists)
      expect(response.status).toBe(200);
    });

    it("should accept non-existent email gracefully", async () => {
      const response = await authClient.post("/auth/forgot-password", {
        email: "nonexistent@example.com",
      });

      // Should still return 200 for security
      expect(response.status).toBe(200);
    });
  });

  describe("PATCH /auth/change-password", () => {
    it("should change password with valid current password", async () => {
      const testUser = createTestUser();
      const newPassword = "NewPassword456!";

      // Register and get token
      const registerResponse = await authClient.post("/auth/register", testUser);
      const accessToken = registerResponse.data.accessToken;

      // Change password
      const response = await authClient.patch(
        "/auth/change-password",
        {
          currentPassword: testUser.password,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(response.status).toBe(200);
    });

    it("should reject change password without token", async () => {
      try {
        await authClient.patch("/auth/change-password", {
          currentPassword: "OldPassword123!",
          newPassword: "NewPassword456!",
        });
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe("POST /auth/logout", () => {
    it("should logout successfully", async () => {
      const testUser = createTestUser();

      // Register and get token
      const registerResponse = await authClient.post("/auth/register", testUser);
      const accessToken = registerResponse.data.accessToken;

      // Logout
      const response = await authClient.post(
        "/auth/logout",
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(response.status).toBe(204);
    });
  });

  describe("Health Checks", () => {
    it("should return healthy status", async () => {
      const response = await authClient.get("/health");
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("status", "ok");
    });

    it("should pass readiness check", async () => {
      const response = await authClient.get("/health/ready");
      expect(response.status).toBe(200);
    });

    it("should pass liveness check", async () => {
      const response = await authClient.get("/health/live");
      expect(response.status).toBe(200);
    });
  });
});
