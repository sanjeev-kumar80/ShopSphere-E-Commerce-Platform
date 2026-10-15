const Razorpay = require("razorpay");

// Lazily initialise so the server doesn't crash when keys are not yet set.
let _instance = null;

const getRazorpay = () => {
    if (!_instance) {
        _instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    return _instance;
};

module.exports = getRazorpay;