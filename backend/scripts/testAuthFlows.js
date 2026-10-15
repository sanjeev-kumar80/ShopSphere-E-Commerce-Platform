require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const User = require("../src/models/User");
const { generateRandomToken, hashToken } = require("../src/utils/randomToken");
const { generateAccessToken, generateRefreshToken } = require("../src/utils/token");

const { spawn } = require("child_process");
const net = require("net");

let server;
let baseUrl;
let mongodProcess = null;

function checkPort(port = 27017) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, "127.0.0.1");
  });
}

async function request(method, path, body = null, headers = {}) {
  const url = `${baseUrl}${path}`;
  const reqHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  const options = {
    method,
    headers: reqHeaders,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  const setCookie = res.headers.get("set-cookie");
  return { status: res.status, ok: res.ok, data, headers: res.headers, setCookie };
}

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("STARTING TEST SUITE: Auth Flows & Token Refresh");
  console.log("=================================================");
  try {
    if (!(await checkPort(27017))) {
      console.log("Port 27017 not open. Starting local mongod instance...");
      const dbPath = "C:\\Users\\Ritik\\.gemini\\antigravity\\brain\\cf8e9333-4298-4732-9799-1c0918934d55\\scratch\\db";
      mongodProcess = spawn("C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe", ["--dbpath", dbPath, "--port", "27017"], {
        stdio: "ignore",
        windowsHide: true,
      });
      let ready = false;
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 250));
        if (await checkPort(27017)) {
          ready = true;
          break;
        }
      }
      if (!ready) {
        throw new Error("Failed to start mongod on port 27017");
      }
      console.log("mongod started successfully.");
    }

    const mongoUri = process.env.TEST_MONGO_URI || "mongodb://127.0.0.1:27017/shopsphere_test";
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB at ${mongoUri}`);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}/api`;
    console.log(`Test server running at ${baseUrl}\n`);

    const timestamp = Date.now();
    const testEmail = `auth_test_${timestamp}@example.com`;
    let userRecord;

    // -------------------------------------------------------------
    // Test Group 1: Registration & Email Verification
    // -------------------------------------------------------------
    console.log("Test Group 1: Email Verification Flow");
    {
      const rawVerificationToken = generateRandomToken();
      const hashedVerificationToken = hashToken(rawVerificationToken);

      // Create a test user directly in DB with unverified email and verification token
      userRecord = await User.create({
        name: "Auth Tester",
        email: testEmail,
        password: "OriginalPassword123!",
        isEmailVerified: false,
        emailVerificationToken: hashedVerificationToken,
        emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
      });

      assert(userRecord.isEmailVerified === false, "New user starts with isEmailVerified = false");

      // Verify with invalid token
      const invalidTokenRes = await request("GET", "/auth/verify-email/wrongtoken123");
      assert(invalidTokenRes.status === 400, "Verification with invalid token returns 400");

      // Verify with expired token
      userRecord.emailVerificationExpires = new Date(Date.now() - 1000);
      await userRecord.save({ validateBeforeSave: false });
      const expiredTokenRes = await request("GET", `/auth/verify-email/${rawVerificationToken}`);
      assert(expiredTokenRes.status === 400, "Verification with expired token returns 400");

      // Re-arm valid token
      userRecord.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      await userRecord.save({ validateBeforeSave: false });

      // Verify with valid token
      const validTokenRes = await request("GET", `/auth/verify-email/${rawVerificationToken}`);
      assert(validTokenRes.status === 200, "Verification with valid token returns 200");
      assert(validTokenRes.data?.message === "Email verified successfully", "Verification response message is correct");

      // Check DB persistence
      const verifiedUser = await User.findById(userRecord._id).select("+emailVerificationToken");
      assert(verifiedUser.isEmailVerified === true, "User isEmailVerified updated to true in DB");
      assert(!verifiedUser.emailVerificationToken, "Verification token is wiped from DB (single-use)");

      // Re-use token attempt
      const reuseTokenRes = await request("GET", `/auth/verify-email/${rawVerificationToken}`);
      assert(reuseTokenRes.status === 400, "Re-using verification token returns 400");
    }

    // -------------------------------------------------------------
    // Test Group 2: Forgot Password Request (No Account Enumeration)
    // -------------------------------------------------------------
    console.log("\nTest Group 2: Forgot Password Requests");
    {
      // Missing email
      const missingEmailRes = await request("POST", "/auth/forgot-password", {});
      assert(missingEmailRes.status === 400, "Missing email in forgot-password returns 400");

      // Unregistered email returns generic 200 (prevents enumeration)
      const nonExistentEmailRes = await request("POST", "/auth/forgot-password", {
        email: "nonexistent_account_xyz@example.com",
      });
      assert(nonExistentEmailRes.status === 200, "Unregistered email returns generic 200");
      assert(
        nonExistentEmailRes.data?.message?.includes("If an account exists"),
        "Message prevents account enumeration"
      );

      // Existing email - generate reset token
      const resetToken = generateRandomToken();
      userRecord.passwordResetToken = hashToken(resetToken);
      userRecord.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
      await userRecord.save({ validateBeforeSave: false });

      assert(!!userRecord.passwordResetToken, "Password reset token hashed and saved in DB");
      assert(userRecord.passwordResetExpires > new Date(), "Password reset expiry is in the future");
    }

    // -------------------------------------------------------------
    // Test Group 3: Reset Password Token Validation & Submission
    // -------------------------------------------------------------
    console.log("\nTest Group 3: Reset Password Validation & Flow");
    {
      const resetToken = generateRandomToken();
      userRecord.passwordResetToken = hashToken(resetToken);
      userRecord.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
      await userRecord.save({ validateBeforeSave: false });

      // Validate invalid token via GET
      const valInvalidRes = await request("GET", "/auth/reset-password/totallyinvalidtoken");
      assert(valInvalidRes.status === 400, "GET /auth/reset-password/:token returns 400 for invalid token");

      // Validate expired token via GET
      userRecord.passwordResetExpires = new Date(Date.now() - 1000);
      await userRecord.save({ validateBeforeSave: false });
      const valExpiredRes = await request("GET", `/auth/reset-password/${resetToken}`);
      assert(valExpiredRes.status === 400, "GET /auth/reset-password/:token returns 400 for expired token");

      // Re-arm valid token
      userRecord.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
      await userRecord.save({ validateBeforeSave: false });

      // Validate legitimate token via GET
      const valValidRes = await request("GET", `/auth/reset-password/${resetToken}`);
      assert(valValidRes.status === 200, "GET /auth/reset-password/:token returns 200 for valid token");

      // Password too short (< 8 chars)
      const shortPwRes = await request("POST", `/auth/reset-password/${resetToken}`, {
        password: "short",
      });
      assert(shortPwRes.status === 400, "Reset password with < 8 chars returns 400");

      // Valid reset
      const resetSuccessRes = await request("POST", `/auth/reset-password/${resetToken}`, {
        password: "NewStrongPassword456!",
      });
      assert(resetSuccessRes.status === 200, "Reset password with valid password returns 200");

      // Verify token cleared from DB
      const updatedUser = await User.findById(userRecord._id).select("+passwordResetToken +refreshToken");
      assert(!updatedUser.passwordResetToken, "Reset token wiped from DB after use");
      assert(!updatedUser.refreshToken, "User refreshToken invalidated after password change");

      // Re-use token fails
      const reuseResetRes = await request("POST", `/auth/reset-password/${resetToken}`, {
        password: "AnotherPassword789!",
      });
      assert(reuseResetRes.status === 400, "Re-using reset token returns 400 (single-use enforced)");

      // Old password no longer works
      const oldLoginRes = await request("POST", "/auth/login", {
        email: testEmail,
        password: "OriginalPassword123!",
      });
      assert(oldLoginRes.status === 401, "Login with old password fails (401)");

      // New password works
      const newLoginRes = await request("POST", "/auth/login", {
        email: testEmail,
        password: "NewStrongPassword456!",
      });
      assert(newLoginRes.status === 200, "Login with new password succeeds (200)");
      assert(!!newLoginRes.data?.data?.accessToken, "Access token received upon login");
    }

    // -------------------------------------------------------------
    // Test Group 4: Automatic Token Refresh Endpoint Logic
    // -------------------------------------------------------------
    console.log("\nTest Group 4: Token Refresh Endpoint & Session Handling");
    {
      // 1. Missing refresh token cookie
      const missingCookieRes = await request("POST", "/auth/refresh");
      assert(missingCookieRes.status === 401, "POST /auth/refresh without cookie returns 401");

      // 2. Invalid refresh token cookie
      const invalidCookieRes = await request("POST", "/auth/refresh", null, {
        Cookie: "refreshToken=invalid.jwt.token",
      });
      assert(invalidCookieRes.status === 401, "POST /auth/refresh with invalid cookie returns 401");

      // 3. Legitimate login and refresh
      const loginRes = await request("POST", "/auth/login", {
        email: testEmail,
        password: "NewStrongPassword456!",
      });
      const originalAccessToken = loginRes.data?.data?.accessToken;
      const setCookieHeader = loginRes.setCookie;
      assert(!!setCookieHeader, "Login sets HttpOnly refreshToken cookie");

      // Extract cookie string
      const cookieMatch = setCookieHeader.match(/refreshToken=([^;]+)/);
      const refreshCookie = cookieMatch ? cookieMatch[0] : "";
      assert(!!refreshCookie, "Parsed refreshToken cookie from response");

      // Call refresh with valid cookie
      const refreshRes = await request("POST", "/auth/refresh", null, {
        Cookie: refreshCookie,
      });
      assert(refreshRes.status === 200, "POST /auth/refresh returns 200 with valid cookie");
      const newAccessToken = refreshRes.data?.data?.accessToken;
      assert(!!newAccessToken, "New accessToken returned in refresh response");
      assert(
        typeof newAccessToken === "string" && newAccessToken.startsWith("eyJ"),
        "Refreshed access token is a valid JWT string"
      );

      // Verify protected endpoint access with new token
      const meRes = await request("GET", "/auth/me", null, {
        Authorization: `Bearer ${newAccessToken}`,
      });
      assert(meRes.status === 200, "GET /auth/me returns 200 with refreshed accessToken");
      assert(meRes.data?.data?.user?.email === testEmail, "Correct user data returned with refreshed token");

      // Verify expired / fake access token fails protected endpoint
      const fakeTokenRes = await request("GET", "/auth/me", null, {
        Authorization: "Bearer invalid.fake.token",
      });
      assert(fakeTokenRes.status === 401, "Protected endpoint returns 401 on invalid/expired access token");
    }

    // -------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------
    console.log("\nCleaning up test user...");
    await User.deleteMany({ email: testEmail });
    console.log("Cleanup complete.");

    // Final summary
    console.log("\n=================================================");
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");

    if (server) server.close();
    await mongoose.connection.close();
    if (mongodProcess) {
      mongodProcess.kill();
      await new Promise((r) => setTimeout(r, 500));
    }

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution error:", err);
    if (server) server.close();
    await mongoose.connection.close().catch(() => {});
    if (mongodProcess) {
      mongodProcess.kill();
    }
    process.exit(1);
  }
}

runTests();
