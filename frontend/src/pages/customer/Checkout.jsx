
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

const initialAddress = {
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  addressType: "HOME",
  isDefault: false,
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), {
        once: true,
      });
      existingScript.addEventListener("error", () => resolve(false), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState({ items: [], total: 0 });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [addressForm, setAddressForm] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const subtotal = Number(cart.total || 0);
  const shippingFee = subtotal >= 1000 ? 0 : 50;
  const total = subtotal + shippingFee;

  const loadCheckout = async () => {
    try {
      setLoading(true);
      setError("");

      const [cartResponse, addressResponse] = await Promise.all([
        api.get("/cart"),
        api.get("/users/addresses"),
      ]);

      const cartData = cartResponse.data.data || {
        items: [],
        total: 0,
      };

      const addressData = addressResponse.data.data || [];

      setCart(cartData);
      setAddresses(addressData);

      const defaultAddress = addressData.find((a) => a.isDefault);

      setSelectedAddress(
        defaultAddress?._id || addressData[0]?._id || ""
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Checkout load nahi hua. Login karke dobara try karo."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckout();
  }, []);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;

    setAddressForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await api.post("/users/addresses", {
        ...addressForm,
        addressType: addressForm.addressType.toUpperCase(),
      });

      const newAddress = response.data.data;

      setAddresses((previous) => [
        ...previous.map((address) => ({
          ...address,
          isDefault: newAddress.isDefault
            ? false
            : address.isDefault,
        })),
        newAddress,
      ]);

      setSelectedAddress(newAddress._id);
      setAddressForm(initialAddress);
      setShowAddressForm(false);
      setMessage("Delivery address save ho gaya!");
    } catch (err) {
      setError(
        err.response?.data?.message || "Address save nahi hua."
      );
    }
  };

  const openRazorpay = async (order) => {
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      throw new Error(
        "Razorpay checkout load nahi hua. Internet check karke retry karo."
      );
    }

    // Existing backend order ke liye Razorpay order create/reuse hoga.
    const paymentResponse = await api.post(
      "/payments/create-order",
      {
        orderId: order._id,
      }
    );

    const paymentData = paymentResponse.data.data;

    // Failed payment par popup close karte waqt
    // failure message ko cancel message se overwrite nahi karna.
    let paymentFailed = false;

    const options = {
      key: paymentData.keyId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      name: "ShopSphere",
      description: "E-commerce order payment",
      order_id: paymentData.razorpayOrderId,

      handler: async (paymentResult) => {
        try {
          setPlacingOrder(true);
          setError("");
          setMessage("Payment verify ho rahi hai...");

          const verifyResponse = await api.post(
            "/payments/verify",
            {
              orderId: order._id,
              razorpayOrderId:
                paymentResult.razorpay_order_id,
              razorpayPaymentId:
                paymentResult.razorpay_payment_id,
              razorpaySignature:
                paymentResult.razorpay_signature,
            }
          );

          if (!verifyResponse.data.success) {
            throw new Error(
              "Payment verification complete nahi hui."
            );
          }

          const confirmedOrder = {
            ...order,
            ...verifyResponse.data.data,
            _id: order._id,
            total: order.total,
            paymentMethod: "RAZORPAY",
          };

          setPendingOrder(null);
          setMessage("");
          setError("");

          navigate("/order-success", {
            replace: true,
            state: {
              order: confirmedOrder,
              message:
                "Payment successful! Your order is confirmed.",
            },
          });
        } catch (err) {
          // Pending order ko preserve karo.
          // User manually Retry Online Payment kar sakta hai.
          setPendingOrder(order);
          setMessage("");

          setError(
            err.response?.data?.message ||
              err.message ||
              "Payment verify nahi hui. Payment status check karke retry karo."
          );
        } finally {
          setPlacingOrder(false);
        }
      },

      modal: {
        ondismiss: () => {
          setMessage("");
          setPendingOrder(order);

          if (!paymentFailed) {
            setError(
              "Payment cancel ho gayi. Dobara try karne ke liye Retry Online Payment dabao."
            );
          }
        },
      },

      theme: {
        color: "#2563eb",
      },
    };

    const checkout = new window.Razorpay(options);

    checkout.on("payment.failed", (paymentResult) => {
      paymentFailed = true;

      setPendingOrder(order);
      setMessage("");
      setError(
        paymentResult.error?.description ||
          "Payment fail hui. Retry Online Payment button dabakar dobara try karo."
      );

      // Failed payment ke baad popup band karo.
      // Payment popup automatically dobara open nahi hoga.
      checkout.close();
    });

    checkout.open();
  };

  const handlePlaceOrder = async () => {
    if (placingOrder) return;

    setError("");
    setMessage("");

    // RETRY: existing order reuse karo.
    // Is branch mein /orders API call nahi hogi.
    if (pendingOrder) {
      try {
        setPlacingOrder(true);
        await openRazorpay(pendingOrder);
      } catch (err) {
        setPendingOrder(pendingOrder);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Payment start nahi hui. Dobara try karo."
        );
      } finally {
        setPlacingOrder(false);
      }

      return;
    }

    if (!cart.items?.length) {
      setError("Tumhara cart empty hai.");
      return;
    }

    if (!selectedAddress) {
      setError("Pehle delivery address select karo.");
      return;
    }

    try {
      setPlacingOrder(true);

      const response = await api.post("/orders", {
        addressId: selectedAddress,
        paymentMethod,
      });

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Order place nahi hua."
        );
      }

      const order = response.data.data;

      if (paymentMethod === "COD") {
        navigate("/order-success", {
          replace: true,
          state: {
            order,
            message:
              "Your order has been placed successfully!",
          },
        });

        return;
      }

      // Payment ke liye order ek hi baar create karo.
      // Retry ke liye isi order ko state mein rakho.
      setPendingOrder(order);
      setCart({ items: [], total: 0 });
      setMessage(
        "Order create ho gaya. Payment complete karo ya baad mein retry karo."
      );

      await openRazorpay(order);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Order/payment start nahi hui. Dobara try karo."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        Loading checkout...
      </div>
    );
  }

  const hasCart = cart.items?.length > 0;
  const canRetry = Boolean(pendingOrder);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Checkout
          </h1>

          {!canRetry && (
            <Link
              to="/cart"
              className="font-medium text-blue-600 hover:underline"
            >
              Back to Cart
            </Link>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg bg-red-100 p-3 text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-5 rounded-lg bg-green-100 p-3 text-green-700"
          >
            {message}
          </div>
        )}

        {!hasCart && !canRetry ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">
              Your cart is empty
            </h2>

            <Link
              to="/shop"
              className="inline-block rounded-lg bg-blue-600 px-5 py-3 text-white"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-6 md:col-span-2">
              {hasCart && (
                <>
                  <section className="rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold">
                      1. Delivery Address
                    </h2>

                    {addresses.length === 0 &&
                      !showAddressForm && (
                        <p className="mb-4 text-gray-600">
                          Checkout ke liye ek delivery address
                          add karo.
                        </p>
                      )}

                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <label
                          key={address._id}
                          className={`block cursor-pointer rounded-lg border p-4 ${
                            selectedAddress === address._id
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="deliveryAddress"
                              checked={
                                selectedAddress === address._id
                              }
                              onChange={() =>
                                setSelectedAddress(address._id)
                              }
                              className="mt-1"
                            />

                            <div>
                              <p className="font-semibold">
                                {address.fullName} (
                                {address.addressType || "Address"})
                                {address.isDefault && (
                                  <span className="ml-2 text-xs text-green-700">
                                    Default
                                  </span>
                                )}
                              </p>

                              <p className="text-sm text-gray-600">
                                {address.addressLine}
                                {address.landmark
                                  ? `, ${address.landmark}`
                                  : ""}
                              </p>

                              <p className="text-sm text-gray-600">
                                {address.city}, {address.state} -{" "}
                                {address.pincode}
                              </p>

                              <p className="text-sm text-gray-600">
                                Phone: {address.phone}
                              </p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowAddressForm(!showAddressForm)
                      }
                      className="mt-4 font-medium text-blue-600 hover:underline"
                    >
                      {showAddressForm
                        ? "Cancel"
                        : "+ Add New Address"}
                    </button>

                    {showAddressForm && (
                      <form
                        onSubmit={handleAddAddress}
                        className="mt-5 grid gap-4 sm:grid-cols-2"
                      >
                        {[
                          ["fullName", "Full Name"],
                          ["phone", "Phone Number"],
                          [
                            "addressLine",
                            "House / Street Address",
                          ],
                          ["city", "City"],
                          ["state", "State"],
                          ["pincode", "PIN Code"],
                          ["landmark", "Landmark (Optional)"],
                        ].map(([name, label]) => (
                          <div
                            key={name}
                            className={
                              name === "addressLine"
                                ? "sm:col-span-2"
                                : ""
                            }
                          >
                            <label
                              htmlFor={name}
                              className="mb-1 block text-sm font-medium"
                            >
                              {label}
                            </label>

                            <input
                              id={name}
                              name={name}
                              value={addressForm[name]}
                              onChange={handleAddressChange}
                              required={name !== "landmark"}
                              type={
                                name === "phone" ||
                                name === "pincode"
                                  ? "tel"
                                  : "text"
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                            />
                          </div>
                        ))}

                        <div className="sm:col-span-2">
                          <label
                            htmlFor="addressType"
                            className="mb-1 block text-sm font-medium"
                          >
                            Address Type
                          </label>

                          <select
                            id="addressType"
                            name="addressType"
                            value={addressForm.addressType}
                            onChange={handleAddressChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          >
                            <option value="HOME">Home</option>
                            <option value="WORK">Work</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="rounded-lg bg-gray-900 px-4 py-3 text-white hover:bg-gray-700 sm:col-span-2"
                        >
                          Save Address
                        </button>
                      </form>
                    )}
                  </section>

                  <section className="rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-3 text-xl font-semibold">
                      2. Payment Method
                    </h2>

                    <div className="space-y-3">
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 ${
                          paymentMethod === "COD"
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="COD"
                          checked={paymentMethod === "COD"}
                          onChange={() => setPaymentMethod("COD")}
                        />

                        <div>
                          <p className="font-medium">
                            Cash on Delivery (COD)
                          </p>
                          <p className="text-sm text-gray-500">
                            Delivery ke time payment karo.
                          </p>
                        </div>
                      </label>

                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 ${
                          paymentMethod === "RAZORPAY"
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="RAZORPAY"
                          checked={paymentMethod === "RAZORPAY"}
                          onChange={() =>
                            setPaymentMethod("RAZORPAY")
                          }
                        />

                        <div>
                          <p className="font-medium">
                            Pay Online (Razorpay Test Mode)
                          </p>
                          <p className="text-sm text-gray-500">
                            Test checkout se online payment try karo.
                          </p>
                        </div>
                      </label>
                    </div>
                  </section>
                </>
              )}

              {canRetry && !hasCart && (
                <section className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="mb-2 text-xl font-semibold">
                    Payment Pending
                  </h2>

                  <p className="break-all text-gray-600">
                    Order #{pendingOrder._id} create ho gaya hai,
                    lekin payment abhi complete nahi hui. Retry
                    button se isi order ki payment dobara try karo.
                  </p>

                  <p className="mt-3 text-sm text-gray-500">
                    Naya order create nahi hoga.
                  </p>
                </section>
              )}
            </div>

            <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold">
                Order Summary
              </h2>

              {hasCart && (
                <div className="mb-4 space-y-4">
                  {cart.items.map((item) => (
                    <div
                      key={item._id}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {item.product?.name || "Product"}
                        </p>
                        <p className="text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>

                      <p className="font-medium">
                        ₹
                        {(
                          Number(item.price) * item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <hr className="my-4" />

              {canRetry ? (
                <div className="flex justify-between text-lg font-bold">
                  <span>Order Total</span>
                  <span>
                    ₹{Number(pendingOrder.total || 0).toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {shippingFee === 0
                        ? "FREE"
                        : `₹${shippingFee.toFixed(2)}`}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">
                    ₹1000 ya usse zyada ke order par free shipping.
                  </p>

                  <hr />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={
                  placingOrder ||
                  (hasCart && !selectedAddress) ||
                  (!hasCart && !canRetry)
                }
                className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {placingOrder
                  ? "Please wait..."
                  : canRetry
                    ? "Retry Online Payment"
                    : paymentMethod === "RAZORPAY"
                      ? "Proceed to Payment"
                      : "Place COD Order"}
              </button>

              <p className="mt-3 text-center text-xs text-gray-500">
                Payment method:{" "}
                {canRetry
                  ? "Razorpay"
                  : paymentMethod === "COD"
                    ? "Cash on Delivery"
                    : "Razorpay"}
              </p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}