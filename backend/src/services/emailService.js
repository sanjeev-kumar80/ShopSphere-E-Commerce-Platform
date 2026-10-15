const nodemailer = require("nodemailer");

let _transporter = null;

const getTransporter = () => {
    if (!_transporter) {
        const host = process.env.SMTP_HOST || "smtp.gmail.com";
        const port = Number(process.env.SMTP_PORT) || 587;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASSWORD;

        if (!user || !pass) {
            console.warn("⚠️ [EmailService] SMTP credentials missing in .env. Emails will not be sent.");
            return null;
        }

        _transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
            tls: {
                rejectUnauthorized: false
            }
        });
    }
    return _transporter;
};

// Base email layout wrapper with modern ShopSphere styling
const wrapEmailLayout = ({ title, preheader, content }) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                background-color: #f8fafc;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                color: #1e293b;
                -webkit-font-smoothing: antialiased;
            }
            .wrapper {
                width: 100%;
                background-color: #f8fafc;
                padding: 32px 16px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                border: 1px solid #e2e8f0;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }
            .header {
                background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                padding: 28px 32px;
                text-align: center;
            }
            .brand {
                color: #ffffff;
                font-size: 26px;
                font-weight: 800;
                letter-spacing: -0.5px;
                text-decoration: none;
                display: inline-block;
            }
            .brand span {
                color: #a5b4fc;
            }
            .content {
                padding: 36px 32px;
            }
            .btn {
                display: inline-block;
                background-color: #4f46e5;
                color: #ffffff !important;
                padding: 14px 28px;
                font-size: 14px;
                font-weight: 600;
                text-decoration: none;
                border-radius: 10px;
                margin: 20px 0;
                text-align: center;
            }
            .btn:hover {
                background-color: #4338ca;
            }
            .card {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
            }
            .footer {
                padding: 24px 32px;
                background-color: #f1f5f9;
                border-top: 1px solid #e2e8f0;
                text-align: center;
                font-size: 12px;
                color: #64748b;
                line-height: 1.6;
            }
            .footer a {
                color: #4f46e5;
                text-decoration: none;
            }
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th, td {
                padding: 10px;
                text-align: left;
                font-size: 13px;
            }
            th {
                color: #64748b;
                font-weight: 600;
                border-bottom: 1px solid #e2e8f0;
            }
            td {
                border-bottom: 1px solid #f1f5f9;
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="container">
                <div class="header">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="brand">Shop<span>Sphere</span></a>
                </div>
                <div class="content">
                    ${content}
                </div>
                <div class="footer">
                    <p style="margin: 0 0 8px 0;">This email was sent by <strong>ShopSphere E-Commerce Platform</strong>.</p>
                    <p style="margin: 0;">If you have any questions, reach out to our team at <a href="mailto:${process.env.SMTP_USER || 'support@shopsphere.com'}">${process.env.SMTP_USER || 'support@shopsphere.com'}</a>.</p>
                    <p style="margin: 8px 0 0 0; color: #94a3b8;">&copy; ${new Date().getFullYear()} ShopSphere. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Generic email sender with safe error catching
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const transporter = getTransporter();
        if (!transporter) {
            console.warn(`[EmailService] SMTP not ready. Email to ${to} skipped: "${subject}"`);
            return false;
        }

        const sender = process.env.SMTP_USER;
        const mailOptions = {
            from: `"ShopSphere" <${sender}>`,
            to,
            subject,
            html,
            text: text || "Please open this email in an HTML-compatible client."
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ [EmailService] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`❌ [EmailService] Failed to send email to ${to}:`, error.message);
        return false;
    }
};

// 1. Account Verification Email
const sendVerificationEmail = async ({ to, name, verificationUrl }) => {
    const content = `
        <h2 style="margin-top: 0; color: #1e293b; font-size: 22px;">Verify your ShopSphere account 🚀</h2>
        <p style="font-size: 15px; color: #475569; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6;">
            Welcome to ShopSphere! To complete your registration and activate your account, please verify your email address by clicking the button below.
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" class="btn" style="color: #ffffff;">Verify My Account</a>
        </div>
        <div class="card" style="margin-top: 24px;">
            <p style="margin: 0; font-size: 13px; color: #64748b;">
                ⏰ <strong>Note:</strong> This verification link is valid for <strong>15 minutes</strong>.<br/>
                If the button above does not work, copy and paste this URL into your browser:<br/>
                <a href="${verificationUrl}" style="color: #4f46e5; word-break: break-all; font-size: 12px;">${verificationUrl}</a>
            </p>
        </div>
        <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
            If you did not create an account on ShopSphere, you can safely ignore this email.
        </p>
    `;

    return sendEmail({
        to,
        subject: "Verify your ShopSphere account",
        html: wrapEmailLayout({
            title: "Verify your ShopSphere account",
            content
        })
    });
};

// 2. Login Notification Alert
const sendLoginAlertEmail = async ({ to, name, time, ipAddress, userAgent }) => {
    const formattedDate = new Date(time || Date.now()).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
    });

    const content = `
        <h2 style="margin-top: 0; color: #1e293b; font-size: 22px;">Security Alert: New Sign-in Detected 🔐</h2>
        <p style="font-size: 15px; color: #475569; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6;">
            We noticed a successful login to your ShopSphere account. Here are the details of this activity:
        </p>
        
        <div class="card">
            <table style="width: 100%;">
                <tr>
                    <td style="font-weight: 600; color: #64748b; width: 35%;">Date & Time</td>
                    <td style="color: #1e293b; font-weight: 500;">${formattedDate}</td>
                </tr>
                <tr>
                    <td style="font-weight: 600; color: #64748b;">IP Address</td>
                    <td style="color: #1e293b; font-family: monospace;">${ipAddress || "Unknown"}</td>
                </tr>
                <tr>
                    <td style="font-weight: 600; color: #64748b;">Client / Browser</td>
                    <td style="color: #1e293b; font-size: 12px; word-break: break-all;">${userAgent || "Web Browser"}</td>
                </tr>
            </table>
        </div>

        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            <strong>Was this you?</strong> If yes, no action is needed. You can continue shopping safely.
        </p>
        <p style="font-size: 14px; color: #dc2626; line-height: 1.6;">
            <strong>Didn't sign in?</strong> If you suspect someone else accessed your account, please reset your password immediately to protect your information.
        </p>

        <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn" style="background-color: #0f172a; color: #ffffff;">Go to ShopSphere</a>
        </div>
    `;

    return sendEmail({
        to,
        subject: "Security Alert: New sign-in to your ShopSphere account",
        html: wrapEmailLayout({
            title: "Security Alert: New sign-in",
            content
        })
    });
};

// 3. Order Confirmation Email
const sendOrderConfirmationEmail = async ({ to, name, order }) => {
    const orderNumber = order._id.toString().slice(-8).toUpperCase();
    const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });

    const itemsRows = order.items.map((item) => `
        <tr>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9;">
                <strong style="color: #1e293b; font-size: 14px;">${item.productName}</strong>
                ${item.sku ? `<br/><span style="font-size: 11px; color: #94a3b8;">SKU: ${item.sku}</span>` : ""}
            </td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #475569;">
                ${item.quantity}
            </td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #1e293b; font-weight: 600;">
                ₹${item.subtotal || (item.price * item.quantity)}
            </td>
        </tr>
    `).join("");

    const address = order.shippingAddress || {};
    const addressStr = [
        address.fullName,
        address.addressLine,
        address.landmark,
        address.city,
        address.state,
        address.pincode,
        address.phone ? `Phone: ${address.phone}` : ""
    ].filter(Boolean).join(", ");

    const content = `
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #ecfdf5; color: #059669; padding: 6px 16px; border-radius: 9999px; font-weight: 700; font-size: 12px; letter-spacing: 0.5px;">
                ORDER CONFIRMED
            </div>
            <h2 style="margin: 12px 0 6px 0; color: #1e293b; font-size: 24px;">Thank you for your purchase! 🎉</h2>
            <p style="margin: 0; color: #64748b; font-size: 14px;">Order #${orderNumber} &bull; Placed on ${formattedDate}</p>
        </div>

        <p style="font-size: 15px; color: #475569; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6;">
            We've received your order and our fulfillment team is preparing it for shipment. Below is a summary of your order.
        </p>

        <!-- Order Items Table -->
        <div style="margin: 24px 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f8fafc;">
                        <th style="padding: 12px 10px; text-align: left; font-size: 12px; color: #64748b;">ITEM</th>
                        <th style="padding: 12px 10px; text-align: center; font-size: 12px; color: #64748b;">QTY</th>
                        <th style="padding: 12px 10px; text-align: right; font-size: 12px; color: #64748b;">PRICE</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
            </table>

            <!-- Summary Totals -->
            <div style="padding: 16px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                <table style="width: 100%;">
                    <tr>
                        <td style="color: #64748b; padding: 4px 0; border: none;">Subtotal</td>
                        <td style="text-align: right; color: #1e293b; font-weight: 500; padding: 4px 0; border: none;">₹${order.subtotal}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; padding: 4px 0; border: none;">Shipping Fee</td>
                        <td style="text-align: right; color: ${order.shippingFee === 0 ? '#059669' : '#1e293b'}; font-weight: 500; padding: 4px 0; border: none;">
                            ${order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee}`}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: 700; color: #1e293b; border-top: 1px solid #e2e8f0;">Total Amount</td>
                        <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: 800; color: #4f46e5; border-top: 1px solid #e2e8f0;">₹${order.total}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Details Grid -->
        <div class="card" style="margin-top: 20px;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 50%; vertical-align: top; padding: 6px; border: none;">
                        <span style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Address</span>
                        <p style="margin: 6px 0 0 0; font-size: 13px; color: #1e293b; line-height: 1.5;">${addressStr || "Address provided during checkout"}</p>
                    </td>
                    <td style="width: 50%; vertical-align: top; padding: 6px; border: none;">
                        <span style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Payment Details</span>
                        <p style="margin: 6px 0 0 0; font-size: 13px; color: #1e293b; line-height: 1.5;">
                            Method: <strong>${order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment (Razorpay)'}</strong><br/>
                            Status: <strong style="color: ${order.paymentStatus === 'PAID' ? '#059669' : '#d97706'};">${order.paymentStatus}</strong>
                        </p>
                    </td>
                </tr>
            </table>
        </div>

        <div style="text-align: center; margin: 32px 0 16px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order._id}" class="btn" style="color: #ffffff;">
                View Order Details
            </a>
        </div>
    `;

    return sendEmail({
        to,
        subject: `Order Confirmed: #${orderNumber} - ShopSphere`,
        html: wrapEmailLayout({
            title: `Order Confirmed: #${orderNumber}`,
            content
        })
    });
};

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendLoginAlertEmail,
    sendOrderConfirmationEmail
};