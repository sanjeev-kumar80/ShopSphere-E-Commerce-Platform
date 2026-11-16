const mongoose = require("mongoose");
const User = require("../models/User");
const Seller = require("../models/Seller");
const Product = require("../models/Product");
const Order = require("../models/Order");
const slugify = require("../utils/slug");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");

// =====================================================
// 1. SELLER AUTHENTICATION & REGISTRATION
// =====================================================

const registerSeller = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            storeName,
            phone,
            businessAddress,
            businessDescription,
            businessCategory,
            gstin
        } = req.body;

        if (!name || !email || !password || !storeName) {
            return res.status(400).json({
                success: false,
                message: "Full name, email, password, and store name are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check user existence
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        // Check store name uniqueness
        const existingStore = await Seller.findOne({
            storeName: { $regex: new RegExp(`^${storeName.trim()}$`, "i") }
        });
        if (existingStore) {
            return res.status(409).json({
                success: false,
                message: "Store name is already taken. Please choose another."
            });
        }

        // Create User account with role "SELLER"
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            phone: phone || "",
            role: "SELLER",
            isEmailVerified: true,
            isActive: true
        });

        // Parse business address if provided as string or object
        let parsedAddress = {
            street: "",
            city: "",
            state: "",
            country: "India",
            pincode: ""
        };

        if (typeof businessAddress === "object" && businessAddress !== null) {
            parsedAddress = { ...parsedAddress, ...businessAddress };
        } else if (typeof businessAddress === "string" && businessAddress.trim()) {
            parsedAddress.street = businessAddress.trim();
        }

        // Create Seller Profile
        const seller = await Seller.create({
            user: user._id,
            storeName: storeName.trim(),
            phone: phone || "",
            businessAddress: parsedAddress,
            businessDescription: businessDescription || "",
            businessCategory: businessCategory || "General Retail",
            gstin: gstin ? gstin.trim().toUpperCase() : "",
            status: "PENDING"
        });

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            success: true,
            message: "Seller registration successful. Your application is under review.",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                seller: {
                    id: seller._id,
                    storeName: seller.storeName,
                    status: seller.status,
                    businessCategory: seller.businessCategory
                },
                accessToken
            }
        });
    } catch (error) {
        console.error("Seller registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to register seller",
            error: error.message
        });
    }
};

// =====================================================
// 2. SELLER PROFILE & SETTINGS
// =====================================================

const getSellerProfile = async (req, res) => {
    try {
        const seller = await Seller.findOne({ user: req.user._id }).populate("user", "name email phone");
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller profile not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: { seller }
        });
    } catch (error) {
        console.error("Get seller profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load seller profile"
        });
    }
};

const updateSellerProfile = async (req, res) => {
    try {
        const {
            storeName,
            phone,
            businessAddress,
            businessDescription,
            businessCategory,
            gstin,
            logo,
            banner
        } = req.body;

        const seller = req.seller;

        if (storeName && storeName.trim() !== seller.storeName) {
            const conflict = await Seller.findOne({
                _id: { $ne: seller._id },
                storeName: { $regex: new RegExp(`^${storeName.trim()}$`, "i") }
            });
            if (conflict) {
                return res.status(409).json({
                    success: false,
                    message: "A store with this name already exists"
                });
            }
            seller.storeName = storeName.trim();
        }

        if (phone !== undefined) seller.phone = phone.trim();
        if (businessDescription !== undefined) seller.businessDescription = businessDescription.trim();
        if (businessCategory !== undefined) seller.businessCategory = businessCategory.trim();
        if (gstin !== undefined) seller.gstin = gstin.trim().toUpperCase();

        if (businessAddress && typeof businessAddress === "object") {
            seller.businessAddress = {
                ...seller.businessAddress,
                ...businessAddress
            };
        }

        if (logo) seller.logo = logo;
        if (banner) seller.banner = banner;

        await seller.save();

        return res.status(200).json({
            success: true,
            message: "Store profile updated successfully",
            data: { seller }
        });
    } catch (error) {
        console.error("Update seller profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: error.message
        });
    }
};

// =====================================================
// 3. SELLER DASHBOARD OVERVIEW & ANALYTICS
// =====================================================

const getSellerDashboard = async (req, res) => {
    try {
        const sellerId = req.seller._id;

        // Products stats
        const [totalProducts, activeProducts, pendingProducts, rejectedProducts] = await Promise.all([
            Product.countDocuments({ seller: sellerId }),
            Product.countDocuments({ seller: sellerId, isActive: true, approvalStatus: "APPROVED" }),
            Product.countDocuments({ seller: sellerId, approvalStatus: "PENDING" }),
            Product.countDocuments({ seller: sellerId, approvalStatus: "REJECTED" })
        ]);

        // Orders stats: filter orders containing items from this seller
        const orders = await Order.find({ "items.seller": sellerId })
            .sort({ createdAt: -1 })
            .select("items shippingAddress total paymentStatus orderStatus createdAt user")
            .populate("user", "name email");

        let totalOrders = 0;
        let pendingOrders = 0;
        let totalSalesRevenue = 0;
        const recentOrders = [];
        const productSalesMap = {};

        orders.forEach((order) => {
            const sellerItems = order.items.filter(
                (item) => item.seller && item.seller.toString() === sellerId.toString()
            );

            if (sellerItems.length > 0) {
                totalOrders++;

                const isItemPending = sellerItems.some((i) =>
                    ["PLACED", "CONFIRMED", "PROCESSING"].includes(i.status || order.orderStatus)
                );
                if (isItemPending) pendingOrders++;

                sellerItems.forEach((item) => {
                    // Calculate revenue using item subtotal for eligible (non-cancelled) statuses
                    const itemStatus = item.status || order.orderStatus;
                    if (itemStatus !== "CANCELLED") {
                        totalSalesRevenue += Number(item.subtotal || 0);
                    }

                    // Best selling product aggregation
                    const pKey = item.product?.toString() || item.productName;
                    if (!productSalesMap[pKey]) {
                        productSalesMap[pKey] = {
                            productId: item.product,
                            productName: item.productName,
                            sku: item.sku,
                            unitsSold: 0,
                            revenue: 0
                        };
                    }
                    if (itemStatus !== "CANCELLED") {
                        productSalesMap[pKey].unitsSold += item.quantity || 0;
                        productSalesMap[pKey].revenue += Number(item.subtotal || 0);
                    }
                });

                if (recentOrders.length < 5) {
                    recentOrders.push({
                        _id: order._id,
                        customerName: order.shippingAddress?.fullName || order.user?.name || "Customer",
                        itemsCount: sellerItems.length,
                        sellerItemsSubtotal: sellerItems.reduce((acc, curr) => acc + curr.subtotal, 0),
                        status: sellerItems[0]?.status || order.orderStatus,
                        createdAt: order.createdAt
                    });
                }
            }
        });

        // Top 5 best selling products
        const bestSellingProducts = Object.values(productSalesMap)
            .sort((a, b) => b.unitsSold - a.unitsSold)
            .slice(0, 5);

        // Compute 7-day revenue chart
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            last7Days.push({ date: dateStr, label: d.toLocaleDateString("en-US", { weekday: "short" }), revenue: 0, orders: 0 });
        }

        orders.forEach((order) => {
            const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
            const dayEntry = last7Days.find((day) => day.date === orderDate);
            if (dayEntry) {
                const sellerItems = order.items.filter(
                    (item) => item.seller && item.seller.toString() === sellerId.toString()
                );
                const daySubtotal = sellerItems.reduce((sum, item) => {
                    return (item.status || order.orderStatus) !== "CANCELLED" ? sum + (item.subtotal || 0) : sum;
                }, 0);
                dayEntry.revenue += daySubtotal;
                dayEntry.orders += 1;
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                seller: {
                    id: req.seller._id,
                    storeName: req.seller.storeName,
                    status: req.seller.status,
                    rejectionReason: req.seller.rejectionReason,
                    rating: req.seller.rating
                },
                overview: {
                    totalProducts,
                    activeProducts,
                    pendingProducts,
                    rejectedProducts,
                    totalOrders,
                    pendingOrders,
                    totalSalesRevenue
                },
                recentOrders,
                bestSellingProducts,
                salesChart: last7Days
            }
        });
    } catch (error) {
        console.error("Seller dashboard stats error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load dashboard overview",
            error: error.message
        });
    }
};

// =====================================================
// 4. SELLER PRODUCT MANAGEMENT
// =====================================================

const getSellerProducts = async (req, res) => {
    try {
        const sellerId = req.seller._id;
        const { search, category, approvalStatus, inStock, sort = "newest", page = 1, limit = 20 } = req.query;

        const filter = { seller: sellerId };

        if (search && search.trim()) {
            filter.$or = [
                { name: { $regex: search.trim(), $options: "i" } },
                { description: { $regex: search.trim(), $options: "i" } },
                { "variants.sku": { $regex: search.trim(), $options: "i" } }
            ];
        }

        if (category && mongoose.Types.ObjectId.isValid(category)) {
            filter.category = category;
        }

        if (approvalStatus && ["PENDING", "APPROVED", "REJECTED"].includes(approvalStatus)) {
            filter.approvalStatus = approvalStatus;
        }

        if (inStock === "true") {
            filter["variants.stock"] = { $gt: 0 };
        } else if (inStock === "false") {
            filter["variants.stock"] = { $lte: 0 };
        }

        let sortOption = { createdAt: -1 };
        if (sort === "oldest") sortOption = { createdAt: 1 };
        if (sort === "name_asc") sortOption = { name: 1 };
        if (sort === "name_desc") sortOption = { name: -1 };

        const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

        const [products, totalCount] = await Promise.all([
            Product.find(filter)
                .populate("category", "name slug")
                .populate("brand", "name slug")
                .sort(sortOption)
                .skip(skip)
                .limit(Number(limit)),
            Product.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: {
                products,
                pagination: {
                    total: totalCount,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(totalCount / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error("Get seller products error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message
        });
    }
};

const createSellerProduct = async (req, res) => {
    try {
        const sellerId = req.seller._id;
        const {
            name,
            description,
            shortDescription,
            category,
            brand,
            images,
            variants,
            tags,
            seo
        } = req.body;

        if (!name || !description || !category || !variants || variants.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Name, description, category, and at least one variant are required"
            });
        }

        // Validate variants
        const skuSet = new Set();
        for (const v of variants) {
            if (!v.sku || v.price === undefined || v.price === null) {
                return res.status(400).json({
                    success: false,
                    message: "Each variant must have an SKU and a price"
                });
            }
            const cleanSku = v.sku.trim().toUpperCase();
            if (skuSet.has(cleanSku)) {
                return res.status(400).json({
                    success: false,
                    message: `Duplicate SKU: ${cleanSku}`
                });
            }
            skuSet.add(cleanSku);
        }

        // Generate unique slug
        const baseSlug = slugify(name);
        let slug = baseSlug;
        let counter = 1;
        while (await Product.exists({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const product = await Product.create({
            name: name.trim(),
            slug,
            description,
            shortDescription: shortDescription || "",
            category,
            brand: brand || null,
            images: images || [],
            variants,
            tags: tags || [],
            seller: sellerId,
            approvalStatus: "PENDING", // Newly created products require admin approval
            isActive: true,
            seo: seo || {}
        });

        const populated = await Product.findById(product._id)
            .populate("category", "name slug")
            .populate("brand", "name slug");

        return res.status(201).json({
            success: true,
            message: "Product submitted successfully. It will be reviewed by admin.",
            data: populated
        });
    } catch (error) {
        console.error("Create seller product error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create product",
            error: error.message
        });
    }
};

const updateSellerProduct = async (req, res) => {
    try {
        const sellerId = req.seller._id;
        const productId = req.params.id;

        const product = await Product.findOne({ _id: productId, seller: sellerId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found or does not belong to your store"
            });
        }

        const {
            name,
            description,
            shortDescription,
            category,
            brand,
            images,
            variants,
            tags,
            isActive,
            seo
        } = req.body;

        if (name && name.trim() !== product.name) {
            product.name = name.trim();
        }
        if (description !== undefined) product.description = description;
        if (shortDescription !== undefined) product.shortDescription = shortDescription;
        if (category !== undefined) product.category = category;
        if (brand !== undefined) product.brand = brand || null;
        if (images !== undefined) product.images = images;
        if (tags !== undefined) product.tags = tags;
        if (isActive !== undefined) product.isActive = Boolean(isActive);
        if (seo !== undefined) product.seo = seo;

        if (variants && Array.isArray(variants) && variants.length > 0) {
            product.variants = variants;
        }

        // If product was rejected and seller edits it, reset to PENDING for re-review
        if (product.approvalStatus === "REJECTED") {
            product.approvalStatus = "PENDING";
            product.rejectionReason = "";
        }

        await product.save();

        const populated = await Product.findById(product._id)
            .populate("category", "name slug")
            .populate("brand", "name slug");

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: populated
        });
    } catch (error) {
        console.error("Update seller product error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update product",
            error: error.message
        });
    }
};

const deleteSellerProduct = async (req, res) => {
    try {
        const sellerId = req.seller._id;
        const productId = req.params.id;

        const product = await Product.findOne({ _id: productId, seller: sellerId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found or not owned by you"
            });
        }

        await Product.deleteOne({ _id: productId });

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error("Delete seller product error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete product",
            error: error.message
        });
    }
};

const updateInventoryStock = async (req, res) => {
    try {
        const sellerId = req.seller._id;
        const productId = req.params.id;
        const { variantId, stock } = req.body;

        if (stock === undefined || stock === null || Number(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: "Valid non-negative stock number is required"
            });
        }

        const product = await Product.findOne({ _id: productId, seller: sellerId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const variant = product.variants.id(variantId);
        if (!variant) {
            return res.status(404).json({
                success: false,
                message: "Variant not found"
            });
        }

        variant.stock = Number(stock);
        await product.save();

        return res.status(200).json({
            success: true,
            message: "Stock updated successfully",
            data: { productId: product._id, variantId, stock: variant.stock }
        });
    } catch (error) {
        console.error("Update stock error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update stock",
            error: error.message
        });
    }
};

// =====================================================
// 5. SELLER ORDER MANAGEMENT (ISOLATED TO SELLER ITEMS)
// =====================================================

const getSellerOrders = async (req, res) => {
    try {
        const sellerId = req.seller._id;
        const { status, search, startDate, endDate, page = 1, limit = 20 } = req.query;

        // Query orders that contain at least one item from this seller
        const filter = { "items.seller": sellerId };

        if (status && status !== "ALL") {
            filter["items"] = {
                $elemMatch: {
                    seller: sellerId,
                    status: status
                }
            };
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const allOrders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .select("items shippingAddress paymentMethod paymentStatus orderStatus createdAt user")
            .populate("user", "name email phone");

        // Filter out items that do NOT belong to this seller for strict isolation
        const sanitizedOrders = allOrders
            .map((order) => {
                const myItems = order.items.filter(
                    (item) => item.seller && item.seller.toString() === sellerId.toString()
                );

                if (myItems.length === 0) return null;

                const mySubtotal = myItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);

                return {
                    _id: order._id,
                    createdAt: order.createdAt,
                    customer: {
                        name: order.shippingAddress?.fullName || order.user?.name || "Customer",
                        phone: order.shippingAddress?.phone || order.user?.phone || "",
                        city: order.shippingAddress?.city || "",
                        state: order.shippingAddress?.state || "",
                        pincode: order.shippingAddress?.pincode || "",
                        addressLine: order.shippingAddress?.addressLine || ""
                    },
                    paymentMethod: order.paymentMethod,
                    paymentStatus: order.paymentStatus,
                    overallOrderStatus: order.orderStatus,
                    items: myItems,
                    sellerSubtotal: mySubtotal
                };
            })
            .filter(Boolean);

        // Client-side text search within sanitized orders if needed
        let finalOrders = sanitizedOrders;
        if (search && search.trim()) {
            const query = search.trim().toLowerCase();
            finalOrders = sanitizedOrders.filter(
                (o) =>
                    o._id.toString().includes(query) ||
                    o.customer.name.toLowerCase().includes(query) ||
                    o.items.some((i) => i.productName.toLowerCase().includes(query) || i.sku.toLowerCase().includes(query))
            );
        }

        const total = finalOrders.length;
        const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
        const paginatedOrders = finalOrders.slice(skip, skip + Number(limit));

        return res.status(200).json({
            success: true,
            data: {
                orders: paginatedOrders,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error("Get seller orders error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
            error: error.message
        });
    }
};

const updateSellerOrderItemStatus = async (req, res) => {
    try {
        const sellerId = req.seller._id;
        const orderId = req.params.orderId;
        const { itemId, status } = req.body;

        const validStatuses = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(", ")}`
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const targetItem = order.items.find(
            (i) => i._id.toString() === itemId && i.seller && i.seller.toString() === sellerId.toString()
        );

        if (!targetItem) {
            return res.status(403).json({
                success: false,
                message: "Item not found in order or does not belong to your store"
            });
        }

        // Prevent unauthorized status overrides if parent order is cancelled
        if (order.orderStatus === "CANCELLED") {
            return res.status(400).json({
                success: false,
                message: "Cannot modify items in a cancelled order"
            });
        }

        targetItem.status = status;

        // If all items in this order are DELIVERED, synchronize the parent orderStatus
        const allDelivered = order.items.every((i) => (i.status || order.orderStatus) === "DELIVERED");
        if (allDelivered) {
            order.orderStatus = "DELIVERED";
        } else if (status === "SHIPPED") {
            order.orderStatus = "SHIPPED";
        }

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Item fulfillment status updated successfully",
            data: {
                orderId: order._id,
                itemId: targetItem._id,
                status: targetItem.status,
                overallOrderStatus: order.orderStatus
            }
        });
    } catch (error) {
        console.error("Update item status error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update item status",
            error: error.message
        });
    }
};

// =====================================================
// 6. DETAILED SALES ANALYTICS
// =====================================================

const getSellerSalesAnalytics = async (req, res) => {
    try {
        const sellerId = req.seller._id;
        const orders = await Order.find({ "items.seller": sellerId });

        let totalRevenue = 0;
        let totalItemsSold = 0;
        let completedOrdersCount = 0;

        const productSales = {};
        const dailyRevenue = {};
        const monthlyRevenue = {};

        orders.forEach((order) => {
            const sellerItems = order.items.filter(
                (item) => item.seller && item.seller.toString() === sellerId.toString()
            );

            let orderContributed = false;

            sellerItems.forEach((item) => {
                const itemStatus = item.status || order.orderStatus;
                if (itemStatus !== "CANCELLED") {
                    const amount = Number(item.subtotal || 0);
                    totalRevenue += amount;
                    totalItemsSold += item.quantity || 0;
                    orderContributed = true;

                    // Group by date
                    const dateKey = new Date(order.createdAt).toISOString().split("T")[0];
                    dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + amount;

                    // Group by month
                    const monthKey = dateKey.substring(0, 7); // "YYYY-MM"
                    monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + amount;

                    // Group by product
                    const pKey = item.product?.toString() || item.productName;
                    if (!productSales[pKey]) {
                        productSales[pKey] = {
                            productId: item.product,
                            productName: item.productName,
                            sku: item.sku,
                            unitsSold: 0,
                            revenue: 0
                        };
                    }
                    productSales[pKey].unitsSold += item.quantity || 0;
                    productSales[pKey].revenue += amount;
                }
            });

            if (orderContributed) completedOrdersCount++;
        });

        const sortedProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);

        return res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                totalItemsSold,
                totalOrders: completedOrdersCount,
                averageOrderValue: completedOrdersCount > 0 ? Math.round(totalRevenue / completedOrdersCount) : 0,
                dailyRevenue,
                monthlyRevenue,
                productWiseSales: sortedProducts
            }
        });
    } catch (error) {
        console.error("Seller analytics error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate sales analytics",
            error: error.message
        });
    }
};

module.exports = {
    registerSeller,
    getSellerProfile,
    updateSellerProfile,
    getSellerDashboard,
    getSellerProducts,
    createSellerProduct,
    updateSellerProduct,
    deleteSellerProduct,
    updateInventoryStock,
    getSellerOrders,
    updateSellerOrderItemStatus,
    getSellerSalesAnalytics
};
