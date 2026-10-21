import { test, describe } from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { register, login, GemniApi } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleWare.js";

describe("Backend Auth Controller Unit Tests", () => {
  test("bcrypt hashing produces a valid salted hash and verifies correctly", async () => {
    const rawPassword = "SecurePassword123!";
    const hash = await bcrypt.hash(rawPassword, 10);
    assert.notEqual(hash, rawPassword);
    const matches = await bcrypt.compare(rawPassword, hash);
    assert.equal(matches, true);
    const wrongMatches = await bcrypt.compare("WrongPassword", hash);
    assert.equal(wrongMatches, false);
  });

  test("JWT signing and verification works with userId payload", () => {
    const secret = "TEST_SECRET_KEY";
    const payload = { userId: "6507f1f77b1b3a2a8b999999" };
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });
    assert.ok(token);

    const decoded = jwt.verify(token, secret);
    assert.equal(decoded.userId, payload.userId);

    assert.throws(() => {
      jwt.verify(token, "WRONG_SECRET");
    });
  });

  test("register returns 400 when required fields are missing", async () => {
    const req = { body: { name: "Test User", email: "" } };
    let statusSent = null;
    let jsonSent = null;

    const res = {
      status(code) {
        statusSent = code;
        return this;
      },
      json(data) {
        jsonSent = data;
        return this;
      },
    };

    await register(req, res);
    assert.equal(statusSent, 400);
    assert.equal(jsonSent.success, false);
    assert.equal(jsonSent.message, "All fields are required");
  });

  test("login returns 400 when email or password is missing", async () => {
    const req = { body: { email: "test@example.com", password: "" } };
    let statusSent = null;
    let jsonSent = null;

    const res = {
      status(code) {
        statusSent = code;
        return this;
      },
      json(data) {
        jsonSent = data;
        return this;
      },
    };

    await login(req, res);
    assert.equal(statusSent, 400);
    assert.equal(jsonSent.success, false);
    assert.equal(jsonSent.message, "All fields are required");
  });

  test("GemniApi returns 400 when data and query are both missing", async () => {
    const req = { body: {} };
    let statusSent = null;
    let jsonSent = null;

    const res = {
      status(code) {
        statusSent = code;
        return this;
      },
      json(data) {
        jsonSent = data;
        return this;
      },
    };

    await GemniApi(req, res);
    assert.equal(statusSent, 400);
    assert.ok(jsonSent.error);
  });

  test("GemniApi returns 500 when API key is not configured", async () => {
    const origKey = process.env.GEMNI_AI_API;
    const origGenKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMNI_AI_API;
    delete process.env.GEMINI_API_KEY;

    const req = { body: { data: [{ x: 1, y: 2 }], query: "Summarize" } };
    let statusSent = null;
    let jsonSent = null;

    const res = {
      status(code) {
        statusSent = code;
        return this;
      },
      json(data) {
        jsonSent = data;
        return this;
      },
    };

    try {
      await GemniApi(req, res);
      assert.equal(statusSent, 500);
      assert.match(jsonSent.error, /not configured/);
    } finally {
      if (origKey) process.env.GEMNI_AI_API = origKey;
      if (origGenKey) process.env.GEMINI_API_KEY = origGenKey;
    }
  });

  test("GemniApi successfully generates analysis with gemini-3.8-flash and valid key", async () => {
    if (!process.env.GEMNI_AI_API && !process.env.GEMINI_API_KEY) {
      // Skip if no live key in env
      return;
    }
    const req = {
      body: {
        data: [{ Quarter: "Q1", Revenue: 10000 }, { Quarter: "Q2", Revenue: 15000 }],
        query: "Provide a one-sentence trend summary",
      },
    };
    let statusSent = null;
    let jsonSent = null;

    const res = {
      status(code) {
        statusSent = code;
        return this;
      },
      json(data) {
        jsonSent = data;
        return this;
      },
    };

    await GemniApi(req, res);
    assert.equal(statusSent, 200);
    assert.ok(jsonSent.reply);
    assert.ok(typeof jsonSent.reply === "string" && jsonSent.reply.length > 0);
  });

  test("authMiddleware blocks requests without a token with 401", async () => {
    const req = { cookies: {}, headers: {} };
    let statusSent = null;
    let jsonSent = null;

    const res = {
      status(code) {
        statusSent = code;
        return this;
      },
      json(data) {
        jsonSent = data;
        return this;
      },
    };

    let nextCalled = false;
    await authMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(statusSent, 401);
    assert.equal(jsonSent.success, false);
    assert.equal(nextCalled, false);
  });

  test("authMiddleware blocks requests with invalid token with 401", async () => {
    process.env.SECRET_KEY = "TEST_SECRET_KEY";
    const req = { cookies: { token: "invalid.token.here" }, headers: {} };
    let statusSent = null;
    let jsonSent = null;

    const res = {
      status(code) {
        statusSent = code;
        return this;
      },
      json(data) {
        jsonSent = data;
        return this;
      },
    };

    let nextCalled = false;
    await authMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(statusSent, 401);
    assert.equal(jsonSent.success, false);
    assert.equal(nextCalled, false);
  });
});
