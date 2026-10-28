import { test, describe } from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { register, login, logout, GemniApi } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleWare.js";
import { User } from "../models/User.js";
import { buildGeminiPrompt } from "../lib/geminiPrompt.js";

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

  test("GemniApi returns 400 when spreadsheet data is missing", async () => {
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

  test("GemniApi returns 400 for empty spreadsheet data", async () => {
    const req = { body: { data: [] } };
    let statusSent;
    let jsonSent;
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
    assert.match(jsonSent.error, /non-empty/);
  });

  test("Gemini prompt includes headers, sampling limits, and evidence-only instructions", () => {
    const prompt = buildGeminiPrompt(
      [["Region", "Revenue_INR"], ["West", 100], ["East", 200]],
      "Which region has the most revenue?",
      { totalRows: 40, truncated: true }
    );

    assert.match(prompt, /Region.*Revenue_INR/);
    assert.match(prompt, /2 data rows/);
    assert.match(prompt, /40 data rows/);
    assert.match(prompt, /only a sample/);
    assert.match(prompt, /Never invent values or trends/);
    assert.match(prompt, /Which region has the most revenue/);
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

  test("GemniApi successfully generates analysis with gemini-2.5-flash and valid key", async (t) => {
    if (process.env.RUN_LIVE_AI_TESTS !== "true") {
      t.skip("Set RUN_LIVE_AI_TESTS=true to call the external Gemini API.");
      return;
    }
    if (!process.env.GEMNI_AI_API && !process.env.GEMINI_API_KEY) {
      t.skip("A Gemini API key is required for the live integration test.");
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

  test("authMiddleware treats expired JWTs as unauthorized", async () => {
    const previousSecret = process.env.SECRET_KEY;
    process.env.SECRET_KEY = "TEST_SECRET_KEY";
    const req = {
      cookies: { token: jwt.sign({ userId: "6507f1f77b1b3a2a8b999999" }, process.env.SECRET_KEY, { expiresIn: -1 }) },
      headers: {},
    };
    let statusSent = null;
    const res = {
      status(code) {
        statusSent = code;
        return this;
      },
      json() {
        return this;
      },
    };

    try {
      await authMiddleware(req, res, () => {});
      assert.equal(statusSent, 401);
    } finally {
      if (previousSecret === undefined) delete process.env.SECRET_KEY;
      else process.env.SECRET_KEY = previousSecret;
    }
  });

  test("authMiddleware forwards database failures instead of logging out the user", async () => {
    const previousSecret = process.env.SECRET_KEY;
    const previousFindById = User.findById;
    process.env.SECRET_KEY = "TEST_SECRET_KEY";
    User.findById = () => {
      throw new Error("test database outage");
    };
    const req = {
      cookies: { token: jwt.sign({ userId: "6507f1f77b1b3a2a8b999999" }, process.env.SECRET_KEY) },
      headers: {},
    };
    let forwardedError = null;

    try {
      await authMiddleware(req, {}, (error) => {
        forwardedError = error;
      });
      assert.equal(forwardedError?.message, "test database outage");
    } finally {
      User.findById = previousFindById;
      if (previousSecret === undefined) delete process.env.SECRET_KEY;
      else process.env.SECRET_KEY = previousSecret;
    }
  });

  test("production login and logout use matching cross-site cookie options", async () => {
    const previousSecret = process.env.SECRET_KEY;
    const previousNodeEnv = process.env.NODE_ENV;
    const previousFindOne = User.findOne;
    const password = "TestPassword123!";
    const passwordHash = await bcrypt.hash(password, 10);
    process.env.SECRET_KEY = "TEST_SECRET_KEY";
    process.env.NODE_ENV = "production";
    User.findOne = async () => ({
      _id: "6507f1f77b1b3a2a8b999999",
      name: "Test User",
      email: "test@example.com",
      password: passwordHash,
    });

    let loginCookie;
    const loginResponse = {
      cookie(name, value, options) {
        loginCookie = { name, value, options };
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      },
    };
    let clearedCookie;
    const logoutResponse = {
      status() {
        return this;
      },
      clearCookie(name, options) {
        clearedCookie = { name, options };
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      },
    };

    try {
      await login({ body: { email: "test@example.com", password } }, loginResponse);
      await logout({}, logoutResponse);

      assert.equal(loginCookie.name, "token");
      assert.equal(loginCookie.options.httpOnly, true);
      assert.equal(loginCookie.options.secure, true);
      assert.equal(loginCookie.options.sameSite, "none");
      assert.equal(loginCookie.options.path, "/");
      assert.deepEqual(clearedCookie.options, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });
    } finally {
      User.findOne = previousFindOne;
      if (previousSecret === undefined) delete process.env.SECRET_KEY;
      else process.env.SECRET_KEY = previousSecret;
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
    }
  });
});
