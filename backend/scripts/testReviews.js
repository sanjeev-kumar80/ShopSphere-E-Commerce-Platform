require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Category = require("../src/models/Category");
const Order = require("../src/models/Order");
const Review = require("../src/models/Review");
const { generateAccessToken } = require("../src/utils/token");

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
  console.log("STARTING TEST SUITE: Product Reviews & Ratings System");
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

    // -------------------------------------------------------------
    // Setup Test Data (Category, Product, Users, Order)
    // -------------------------------------------------------------
    console.log("Setting up test data...");

    const testCategory = await Category.create({
      name: `Review Cat ${timestamp}`,
      slug: `review-cat-${timestamp}`,
      isActive: true,
    });

    const testProduct = await Product.create({
      name: `Review Test Product ${timestamp}`,
      slug: `review-test-product-${timestamp}`,
      description: "A high quality product for review testing.",
      category: testCategory._id,
      rating: 0,
      reviewCount: 0,
      variants: [
        {
          sku: `SKU-REV-${timestamp}`,
          price: 999,
          stock: 50,
          isActive: true,
        },
      ],
      isActive: true,
    });

    const userA = await User.create({
      name: "Reviewer Alice",
      email: `alice_${timestamp}@example.com`,
      password: "Password123!",
      role: "USER",
      isActive: true,
      isEmailVerified: true,
    });
    const tokenA = generateAccessToken(userA._id);

    const userB = await User.create({
      name: "Reviewer Bob",
      email: `bob_${timestamp}@example.com`,
      password: "Password123!",
      role: "USER",
      isActive: true,
      isEmailVerified: true,
    });
    const tokenB = generateAccessToken(userB._id);

    // Create an Order for User A to qualify Alice for "Verified Purchase"
    const orderA = await Order.create({
      user: userA._id,
      items: [
        {
          product: testProduct._id,
          variantId: testProduct.variants[0]._id,
          productName: testProduct.name,
          sku: testProduct.variants[0].sku,
          quantity: 1,
          price: 999,
          subtotal: 999,
        },
      ],
      shippingAddress: {
        fullName: "Reviewer Alice",
        phone: "9876543210",
        addressLine: "123 Main St",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
      subtotal: 999,
      total: 999,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      orderStatus: "DELIVERED",
    });

    console.log("Test data setup complete.\n");

    let aliceReviewId;
    let bobReviewId;

    // -------------------------------------------------------------
    // Test Group 1: Endpoint Security & Authentication
    // -------------------------------------------------------------
    console.log("Test Group 1: Review Endpoint Protection");
    {
      const unauthPost = await request("POST", `/reviews`, {
        productId: testProduct._id,
        rating: 5,
        title: "Unauth Title",
        comment: "Unauth Comment",
      });
      assert(unauthPost.status === 401, "POST /reviews without token returns 401");

      const unauthPut = await request("PUT", `/reviews/${new mongoose.Types.ObjectId()}`, {
        rating: 4,
      });
      assert(unauthPut.status === 401, "PUT /reviews/:id without token returns 401");

      const unauthDelete = await request("DELETE", `/reviews/${new mongoose.Types.ObjectId()}`);
      assert(unauthDelete.status === 401, "DELETE /reviews/:id without token returns 401");

      const unauthMyReview = await request("GET", `/reviews/product/${testProduct._id}/my-review`);
      assert(unauthMyReview.status === 401, "GET /reviews/product/:id/my-review without token returns 401");
    }

    // -------------------------------------------------------------
    // Test Group 2: Input Validation
    // -------------------------------------------------------------
    console.log("\nTest Group 2: Review Input Validation");
    {
      // Missing title
      const missingTitleRes = await request("POST", `/reviews`, {
        productId: testProduct._id,
        rating: 5,
        comment: "Great product without title",
      }, tokenA);
      assert(missingTitleRes.status === 400, "Missing review title returns 400");

      // Missing comment
      const missingCommentRes = await request("POST", `/reviews`, {
        productId: testProduct._id,
        rating: 5,
        title: "Great Title",
      }, tokenA);
      assert(missingCommentRes.status === 400, "Missing review comment returns 400");

      // Rating < 1
      const lowRatingRes = await request("POST", `/reviews`, {
        productId: testProduct._id,
        rating: 0,
        title: "Bad Rating",
        comment: "Rating zero",
      }, tokenA);
      assert(lowRatingRes.status === 400, "Rating < 1 returns 400");

      // Rating > 5
      const highRatingRes = await request("POST", `/reviews`, {
        productId: testProduct._id,
        rating: 6,
        title: "Over the top",
        comment: "Rating six",
      }, tokenA);
      assert(highRatingRes.status === 400, "Rating > 5 returns 400");

      // Invalid Product ID
      const fakeProductRes = await request("POST", `/reviews`, {
        productId: new mongoose.Types.ObjectId(),
        rating: 5,
        title: "Valid Title",
        comment: "Valid Comment",
      }, tokenA);
      assert(fakeProductRes.status === 404, "Non-existent product ID returns 404");
    }

    // -------------------------------------------------------------
    // Test Group 3: Creation & Verified Purchase Detection
    // -------------------------------------------------------------
    console.log("\nTest Group 3: Review Creation & Verified Purchase Detection");
    {
      // Alice creates review (5 stars with optional photos)
      const aliceCreateRes = await request("POST", `/reviews`, {
        productId: testProduct._id,
        rating: 5,
        title: "Absolutely outstanding quality!",
        comment: "I have used this daily and it exceeded all expectations. Fast shipping too.",
        images: [
          { url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500" },
          { url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500" },
        ],
      }, tokenA);

      assert(aliceCreateRes.status === 201, "Alice submits review successfully (201)");
      assert(aliceCreateRes.data?.data?.review?.rating === 5, "Review rating is 5");
      assert(aliceCreateRes.data?.data?.review?.title === "Absolutely outstanding quality!", "Review title matches");
      assert(aliceCreateRes.data?.data?.review?.images?.length === 2, "Alice review saved with 2 optional photos");
      assert(
        aliceCreateRes.data?.data?.review?.isVerifiedPurchase === true,
        "Alice review marked isVerifiedPurchase = true because of past delivered order"
      );
      aliceReviewId = aliceCreateRes.data?.data?.review?._id;

      // Check product rating and review count
      const updatedProd1 = await Product.findById(testProduct._id);
      assert(updatedProd1.rating === 5, "Product rating updated to 5.0 in DB");
      assert(updatedProd1.reviewCount === 1, "Product reviewCount updated to 1 in DB");

      // Alice attempts duplicate review
      const duplicateRes = await request("POST", `/reviews`, {
        productId: testProduct._id,
        rating: 4,
        title: "Trying again",
        comment: "Duplicate review attempt",
      }, tokenA);
      assert(duplicateRes.status === 400, "Duplicate review by same user for same product is rejected (400)");

      // Check User A my-review endpoint
      const myReviewRes = await request("GET", `/reviews/product/${testProduct._id}/my-review`, null, tokenA);
      assert(myReviewRes.status === 200, "GET /reviews/product/:id/my-review returns 200");
      assert(myReviewRes.data?.data?.hasReviewed === true, "hasReviewed is true for Alice");
      assert(myReviewRes.data?.data?.review?._id === aliceReviewId, "my-review returns Alice's review object");
    }

    // -------------------------------------------------------------
    // Test Group 4: Multiple Reviews & Average Rating Calculation
    // -------------------------------------------------------------
    console.log("\nTest Group 4: Multiple Reviews & Rating Recalculation");
    {
      // Bob has NO order for this product
      const bobMyReview = await request("GET", `/reviews/product/${testProduct._id}/my-review`, null, tokenB);
      assert(bobMyReview.data?.data?.hasReviewed === false, "Bob hasReviewed is false initially");
      assert(bobMyReview.data?.data?.isVerifiedPurchase === false, "Bob isVerifiedPurchase is false");

      // Bob submits review with rating 3 via nested route /api/products/:productId/reviews
      const bobCreateRes = await request("POST", `/products/${testProduct._id}/reviews`, {
        rating: 3,
        title: "Decent product, average experience",
        comment: "Works fine, but nothing extraordinary. Standard packaging.",
      }, tokenB);

      assert(bobCreateRes.status === 201, "Bob submits review via nested route (201)");
      assert(
        bobCreateRes.data?.data?.review?.isVerifiedPurchase === false,
        "Bob review is NOT marked as verified purchase (isVerifiedPurchase = false)"
      );
      assert(
        Array.isArray(bobCreateRes.data?.data?.review?.images) &&
          bobCreateRes.data?.data?.review?.images.length === 0,
        "Bob review without photos defaults to empty images array (photos are optional)"
      );
      bobReviewId = bobCreateRes.data?.data?.review?._id;

      // Product rating calculation: (5 + 3) / 2 = 4.0
      const updatedProd2 = await Product.findById(testProduct._id);
      assert(updatedProd2.rating === 4.0, "Product rating recalculated correctly to 4.0 ((5 + 3) / 2)");
      assert(updatedProd2.reviewCount === 2, "Product reviewCount updated to 2");
    }

    // -------------------------------------------------------------
    // Test Group 5: Authorization & Anti-Tampering (Ownership)
    // -------------------------------------------------------------
    console.log("\nTest Group 5: Review Ownership & Cross-User Security");
    {
      // Bob tries to edit Alice's review
      const bobEditAlice = await request("PUT", `/reviews/${aliceReviewId}`, {
        rating: 1,
        title: "Hacked title",
      }, tokenB);
      assert(bobEditAlice.status === 403, "Bob cannot edit Alice's review (403 Forbidden)");

      // Bob tries to delete Alice's review
      const bobDeleteAlice = await request("DELETE", `/reviews/${aliceReviewId}`, null, tokenB);
      assert(bobDeleteAlice.status === 403, "Bob cannot delete Alice's review (403 Forbidden)");
    }

    // -------------------------------------------------------------
    // Test Group 6: Review Editing & Average Recalculation
    // -------------------------------------------------------------
    console.log("\nTest Group 6: Review Update & Rating Recalculation");
    {
      // Alice updates her review rating from 5 to 4
      const aliceUpdateRes = await request("PUT", `/reviews/${aliceReviewId}`, {
        rating: 4,
        title: "Updated: Solid 4 stars after 2 weeks",
        comment: "Still very good, but battery life is slightly lower than advertised.",
      }, tokenA);

      assert(aliceUpdateRes.status === 200, "Alice successfully updates her review (200)");
      assert(aliceUpdateRes.data?.data?.review?.rating === 4, "Updated rating is 4");
      assert(aliceUpdateRes.data?.data?.review?.title === "Updated: Solid 4 stars after 2 weeks", "Updated title persisted");

      // Product rating calculation: (4 + 3) / 2 = 3.5
      const updatedProd3 = await Product.findById(testProduct._id);
      assert(updatedProd3.rating === 3.5, "Product rating recalculated correctly to 3.5 ((4 + 3) / 2)");
      assert(updatedProd3.reviewCount === 2, "Product reviewCount remains 2");
    }

    // -------------------------------------------------------------
    // Test Group 7: Public Review Listing, Sorting & Breakdown
    // -------------------------------------------------------------
    console.log("\nTest Group 7: Public Reviews List & Rating Breakdown");
    {
      // Public fetch via /api/reviews/product/:id
      const publicReviewsRes = await request("GET", `/reviews/product/${testProduct._id}`);
      assert(publicReviewsRes.status === 200, "GET /reviews/product/:id returns 200 without auth");
      assert(publicReviewsRes.data?.data?.reviews?.length === 2, "Returns 2 reviews");
      assert(publicReviewsRes.data?.data?.stats?.averageRating === 3.5, "Stats averageRating is 3.5");
      assert(publicReviewsRes.data?.data?.stats?.totalReviews === 2, "Stats totalReviews is 2");

      const breakdown = publicReviewsRes.data?.data?.stats?.breakdown;
      assert(Array.isArray(breakdown) && breakdown.length === 5, "Stats breakdown contains 5 star tiers");

      const fourStar = breakdown.find((b) => b.stars === 4);
      const threeStar = breakdown.find((b) => b.stars === 3);
      assert(fourStar?.count === 1 && fourStar?.percentage === 50, "4-star has count: 1 (50%)");
      assert(threeStar?.count === 1 && threeStar?.percentage === 50, "3-star has count: 1 (50%)");

      // Filter by rating = 4
      const filterRes = await request("GET", `/reviews/product/${testProduct._id}?rating=4`);
      assert(filterRes.data?.data?.reviews?.length === 1, "Filter by rating=4 returns only 1 review");
      assert(filterRes.data?.data?.reviews[0]?.rating === 4, "Filtered review has rating 4");

      // Filter by verified = true
      const verifiedFilterRes = await request("GET", `/reviews/product/${testProduct._id}?verified=true`);
      assert(verifiedFilterRes.data?.data?.reviews?.length === 1, "Filter by verified=true returns only 1 verified review");
      assert(verifiedFilterRes.data?.data?.reviews[0]?.user?.name === "Reviewer Alice", "Verified review belongs to Alice");

      // Nested product route test: GET /api/products/:productId/reviews
      const nestedRouteRes = await request("GET", `/products/${testProduct._id}/reviews`);
      assert(nestedRouteRes.status === 200, "Nested route GET /products/:productId/reviews returns 200");
      assert(nestedRouteRes.data?.data?.reviews?.length === 2, "Nested route returns same 2 reviews");
    }

    // -------------------------------------------------------------
    // Test Group 8: Review Deletion & Zero Reset
    // -------------------------------------------------------------
    console.log("\nTest Group 8: Review Deletion & Fallback Ratings");
    {
      // Bob deletes his review
      const bobDeleteRes = await request("DELETE", `/reviews/${bobReviewId}`, null, tokenB);
      assert(bobDeleteRes.status === 200, "Bob deletes his review (200)");

      // Rating with only Alice's 4-star review remaining
      const updatedProd4 = await Product.findById(testProduct._id);
      assert(updatedProd4.rating === 4.0, "Product rating is now 4.0 after Bob's deletion");
      assert(updatedProd4.reviewCount === 1, "Product reviewCount is now 1");

      // Alice deletes her review
      const aliceDeleteRes = await request("DELETE", `/reviews/${aliceReviewId}`, null, tokenA);
      assert(aliceDeleteRes.status === 200, "Alice deletes her review (200)");

      // Rating resets to 0 when all reviews are removed
      const updatedProd5 = await Product.findById(testProduct._id);
      assert(updatedProd5.rating === 0, "Product rating correctly resets to 0 when all reviews deleted");
      assert(updatedProd5.reviewCount === 0, "Product reviewCount correctly resets to 0");
    }

    // -------------------------------------------------------------
    // Test Group 9: Existing Product Endpoints Regression Check
    // -------------------------------------------------------------
    console.log("\nTest Group 9: Existing Product Endpoints Regression Check");
    {
      const prodByIdRes = await request("GET", `/products/${testProduct._id}`);
      assert(prodByIdRes.status === 200, "GET /products/:id returns 200");
      assert(prodByIdRes.data?.data?.product?.name === testProduct.name, "Product details match");
      assert(prodByIdRes.data?.data?.product?.rating === 0, "Product rating returned in response");

      const prodBySlugRes = await request("GET", `/products/slug/${testProduct.slug}`);
      assert(prodBySlugRes.status === 200, "GET /products/slug/:slug returns 200");
    }

    // -------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------
    console.log("\nCleaning up test records...");
    await Review.deleteMany({ product: testProduct._id });
    await Order.deleteMany({ _id: orderA._id });
    await Product.deleteMany({ _id: testProduct._id });
    await Category.deleteMany({ _id: testCategory._id });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
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
