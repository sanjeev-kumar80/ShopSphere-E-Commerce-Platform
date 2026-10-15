require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("../src/app");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const Address = require("../src/models/Address");
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

async function request(method, path, body = null, token = null) {
  const url = `${baseUrl}${path}`;
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
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
  console.log("STARTING TEST SUITE: Customer Profile & Address Book");
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

    // Unique emails for test runs
    const timestamp = Date.now();
    const customerAEmail = `customer_a_${timestamp}@test.com`;
    const customerBEmail = `customer_b_${timestamp}@test.com`;

    // -----------------------------------------------------------------
    // 1. Unauthenticated Access Protection
    // -----------------------------------------------------------------
    console.log("Test Group 1: Protection of Private Endpoints");
    {
      const resProfile = await request("GET", "/users/profile");
      assert(resProfile.status === 401, "Unauthenticated GET /users/profile returns 401");

      const resAddresses = await request("GET", "/users/addresses");
      assert(resAddresses.status === 401, "Unauthenticated GET /users/addresses returns 401");

      const resAddAddr = await request("POST", "/users/addresses", { fullName: "Test" });
      assert(resAddAddr.status === 401, "Unauthenticated POST /users/addresses returns 401");
    }

    // -----------------------------------------------------------------
    // 2. Setup Test Customer A & Login
    // -----------------------------------------------------------------
    console.log("\nTest Group 2: Customer A Signup, Login & Profile Retrieval");
    let tokenA;
    let userAId;
    {
      const regRes = await request("POST", "/auth/register", {
        name: "Customer Alpha",
        email: customerAEmail,
        password: "Password123!",
      });
      assert(regRes.status === 201 || regRes.status === 200, "Customer A registers successfully");
      tokenA = regRes.data?.data?.accessToken;
      userAId = regRes.data?.data?.user?.id || regRes.data?.data?.user?._id;

      if (!tokenA) {
        // Fallback to login
        const loginRes = await request("POST", "/auth/login", {
          email: customerAEmail,
          password: "Password123!",
        });
        tokenA = loginRes.data?.data?.accessToken;
        userAId = loginRes.data?.data?.user?.id || loginRes.data?.data?.user?._id;
      }
      assert(!!tokenA, "Customer A has valid JWT token");

      // Test GET /users/profile and GET /auth/profile
      const profRes = await request("GET", "/users/profile", null, tokenA);
      assert(profRes.status === 200, "GET /users/profile returns 200");
      assert(profRes.data?.data?.user?.name === "Customer Alpha", "Profile name matches Customer Alpha");
      assert(profRes.data?.data?.user?.email === customerAEmail, "Profile email matches");

      const authProfRes = await request("GET", "/auth/profile", null, tokenA);
      assert(authProfRes.status === 200, "GET /auth/profile returns 200");
    }

    // -----------------------------------------------------------------
    // 3. Update Customer A Profile
    // -----------------------------------------------------------------
    console.log("\nTest Group 3: Profile Update & Validation");
    {
      // Valid update
      const updateRes = await request(
        "PUT",
        "/users/profile",
        {
          name: "Alpha Updated",
          email: customerAEmail,
          phone: "9876543210",
        },
        tokenA
      );
      assert(updateRes.status === 200, "PUT /users/profile returns 200 on valid update");
      assert(updateRes.data?.data?.user?.name === "Alpha Updated", "Updated name reflected in response");
      assert(updateRes.data?.data?.user?.phone === "9876543210", "Updated phone reflected in response");

      // Verify DB persistence
      const verifyProf = await request("GET", "/users/profile", null, tokenA);
      assert(verifyProf.data?.data?.user?.phone === "9876543210", "Phone persisted in DB");

      // Invalid name (< 2 chars)
      const invalidNameRes = await request(
        "PUT",
        "/users/profile",
        { name: "A" },
        tokenA
      );
      assert(invalidNameRes.status === 400, "PUT /users/profile with short name returns 400");

      // Invalid email
      const invalidEmailRes = await request(
        "PUT",
        "/users/profile",
        { email: "not-an-email" },
        tokenA
      );
      assert(invalidEmailRes.status === 400, "PUT /users/profile with invalid email returns 400");

      // Invalid phone
      const invalidPhoneRes = await request(
        "PUT",
        "/users/profile",
        { phone: "abc12" },
        tokenA
      );
      assert(invalidPhoneRes.status === 400, "PUT /users/profile with invalid phone returns 400");
    }

    // -----------------------------------------------------------------
    // 4. Address Book CRUD & Single Default Logic
    // -----------------------------------------------------------------
    console.log("\nTest Group 4: Address Book Management & Single Default Guarantee");
    let address1Id;
    let address2Id;
    {
      // Add Address 1 (should automatically become default since it is the first address)
      const add1 = await request(
        "POST",
        "/users/addresses",
        {
          fullName: "Alpha Receiver 1",
          phone: "9876543210",
          addressLine: "101 Marine Drive",
          landmark: "Near Gateway",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          addressType: "HOME",
        },
        tokenA
      );
      assert(add1.status === 201, "POST /users/addresses creates Address 1 (status 201)");
      assert(add1.data?.data?.isDefault === true, "Address 1 automatically set to isDefault = true (first address)");
      address1Id = add1.data?.data?._id;

      // Add Address 2 (without isDefault, should not be default)
      const add2 = await request(
        "POST",
        "/users/addresses",
        {
          fullName: "Alpha Receiver 2",
          phone: "9876543211",
          addressLine: "202 Bandra West",
          landmark: "Linking Road",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400050",
          addressType: "WORK",
          isDefault: false,
        },
        tokenA
      );
      assert(add2.status === 201, "POST /users/addresses creates Address 2");
      assert(add2.data?.data?.isDefault === false, "Address 2 has isDefault = false");
      address2Id = add2.data?.data?._id;

      // Verify list of addresses
      const listRes = await request("GET", "/users/addresses", null, tokenA);
      assert(listRes.status === 200, "GET /users/addresses returns 200");
      assert(listRes.data?.data?.length === 2, "Address list contains exactly 2 addresses");

      // Verify only Address 1 is default
      const defaultAddrs = listRes.data?.data?.filter((a) => a.isDefault);
      assert(defaultAddrs.length === 1 && defaultAddrs[0]._id === address1Id, "Exactly one address is default (Address 1)");

      // Edit Address 2
      const edit2 = await request(
        "PUT",
        `/users/addresses/${address2Id}`,
        {
          fullName: "Alpha Receiver 2 Updated",
          city: "Pune",
          pincode: "411001",
        },
        tokenA
      );
      assert(edit2.status === 200, "PUT /users/addresses/:id updates Address 2");
      assert(edit2.data?.data?.fullName === "Alpha Receiver 2 Updated", "Address 2 updated fullName persisted");
      assert(edit2.data?.data?.city === "Pune", "Address 2 updated city persisted");

      // Set Address 2 as Default
      const setDefaultRes = await request(
        "PATCH",
        `/users/addresses/${address2Id}/default`,
        null,
        tokenA
      );
      assert(setDefaultRes.status === 200, "PATCH /users/addresses/:id/default returns 200");
      assert(setDefaultRes.data?.data?.isDefault === true, "Address 2 is now default");

      // Verify that Address 1 is no longer default
      const listAfterDefault = await request("GET", "/users/addresses", null, tokenA);
      const defaultsAfter = listAfterDefault.data?.data?.filter((a) => a.isDefault);
      assert(defaultsAfter.length === 1, "Still exactly one address marked default");
      assert(defaultsAfter[0]._id === address2Id, "Address 2 is the sole default address");
      const addr1After = listAfterDefault.data?.data?.find((a) => a._id === address1Id);
      assert(addr1After.isDefault === false, "Address 1 default status was successfully removed");
    }

    // -----------------------------------------------------------------
    // 5. Multi-tenant Isolation (Customer B Isolation)
    // -----------------------------------------------------------------
    console.log("\nTest Group 5: Customer Cross-Access & Conflict Prevention");
    let tokenB;
    {
      const regB = await request("POST", "/auth/register", {
        name: "Customer Beta",
        email: customerBEmail,
        password: "Password123!",
      });
      tokenB = regB.data?.data?.accessToken;
      if (!tokenB) {
        const loginB = await request("POST", "/auth/login", {
          email: customerBEmail,
          password: "Password123!",
        });
        tokenB = loginB.data?.data?.accessToken;
      }
      assert(!!tokenB, "Customer B registered and logged in");

      // Customer B attempts to edit Customer A's address
      const crossEdit = await request(
        "PUT",
        `/users/addresses/${address1Id}`,
        { fullName: "Hacked by B" },
        tokenB
      );
      assert(crossEdit.status === 404, "Customer B cannot edit Customer A's address (returns 404)");

      // Customer B attempts to set default on Customer A's address
      const crossDefault = await request(
        "PATCH",
        `/users/addresses/${address1Id}/default`,
        null,
        tokenB
      );
      assert(crossDefault.status === 404, "Customer B cannot set default on Customer A's address (returns 404)");

      // Customer B attempts to delete Customer A's address
      const crossDelete = await request(
        "DELETE",
        `/users/addresses/${address1Id}`,
        null,
        tokenB
      );
      assert(crossDelete.status === 404, "Customer B cannot delete Customer A's address (returns 404)");

      // Customer B cannot take Customer A's email
      const emailCollision = await request(
        "PUT",
        "/users/profile",
        { email: customerAEmail },
        tokenB
      );
      assert(emailCollision.status === 409, "Customer B cannot change email to Customer A's email (returns 409 Conflict)");
    }

    // -----------------------------------------------------------------
    // 6. Address Deletion & Default Fallback Logic
    // -----------------------------------------------------------------
    console.log("\nTest Group 6: Address Deletion & Fallback Default Promotion");
    {
      // Customer A deletes Address 2 (which is currently default)
      const deleteRes = await request(
        "DELETE",
        `/users/addresses/${address2Id}`,
        null,
        tokenA
      );
      assert(deleteRes.status === 200, "DELETE /users/addresses/:id deletes default Address 2");

      // Remaining Address 1 should now be promoted to default
      const listAfterDelete = await request("GET", "/users/addresses", null, tokenA);
      assert(listAfterDelete.data?.data?.length === 1, "Only 1 address remains");
      assert(listAfterDelete.data?.data?.[0]?.isDefault === true, "Remaining Address 1 promoted to default");

      // Clean up Address 1
      await request("DELETE", `/users/addresses/${address1Id}`, null, tokenA);
    }

    // -----------------------------------------------------------------
    // Cleanup Test Users from DB
    // -----------------------------------------------------------------
    console.log("\nCleaning up test users and addresses...");
    await User.deleteMany({ email: { $in: [customerAEmail, customerBEmail] } });
    await Address.deleteMany({ fullName: { $regex: /Alpha/i } });
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
