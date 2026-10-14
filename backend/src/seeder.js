require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("./models/Category");
const Brand = require("./models/Brand");
const Product = require("./models/Product");

const seedData = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopsphere";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB for rich catalog seeding...");

        // Clear existing data
        await Product.deleteMany({});
        await Category.deleteMany({});
        await Brand.deleteMany({});
        console.log("Cleared existing Products, Categories, and Brands.");

        // 1. Seed Diverse Categories
        const categories = await Category.insertMany([
            {
                name: "Electronics",
                slug: "electronics",
                description: "Smartphones, laptops, tablets, and high-performance computing gadgets.",
                image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&auto=format&fit=crop&q=80",
                isActive: true
            },
            {
                name: "Audio & Wearables",
                slug: "audio-wearables",
                description: "Wireless earbuds, premium ANC headphones, and fitness smartwatches.",
                image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
                isActive: true
            },
            {
                name: "Fashion & Apparel",
                slug: "fashion-apparel",
                description: "Modern street style, hoodies, breathable t-shirts, and everyday denim.",
                image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop&q=80",
                isActive: true
            },
            {
                name: "Footwear",
                slug: "footwear",
                description: "Athletic sneakers, running trainers, casual loafers, and lifestyle shoes.",
                image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
                isActive: true
            },
            {
                name: "Home & Living",
                slug: "home-living",
                description: "Minimalist lighting, ergonomics, workspace desk mats, and modern home decor.",
                image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
                isActive: true
            },
            {
                name: "Sports & Fitness",
                slug: "sports-fitness",
                description: "Gym gear, training mats, insulated water flasks, and workout accessories.",
                image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
                isActive: true
            },
            {
                name: "Beauty & Grooming",
                slug: "beauty-grooming",
                description: "Daily skincare, botanical grooming, and personal care essentials.",
                image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
                isActive: true
            }
        ]);

        // Map categories by slug for easy lookup
        const catMap = {};
        categories.forEach(c => { catMap[c.slug] = c._id; });

        // 2. Seed Diverse Brands
        const brands = await Brand.insertMany([
            {
                name: "Apple",
                slug: "apple",
                description: "Pioneering consumer electronics, chips, and premium devices.",
                logo: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&auto=format&fit=crop&q=80",
                isActive: true
            },
            {
                name: "Sony",
                slug: "sony",
                description: "Legendary Japanese audio engineering, cameras, and display innovation.",
                logo: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80",
                isActive: true
            },
            {
                name: "Samsung",
                slug: "samsung",
                description: "Cutting-edge smartphones, OLED displays, and smart gadgets.",
                logo: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&auto=format&fit=crop&q=80",
                isActive: true
            },
            {
                name: "Nike",
                slug: "nike",
                description: "World leader in performance sportswear and legendary sneakers.",
                logo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80",
                isActive: true
            },
            {
                name: "Adidas",
                slug: "adidas",
                description: "Three-stripe iconic streetwear and ultraboost performance trainers.",
                logo: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=400&auto=format&fit=crop&q=80",
                isActive: true
            },
            {
                name: "Puma",
                slug: "puma",
                description: "Forever faster athletic footwear and contemporary sportswear.",
                logo: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&auto=format&fit=crop&q=80",
                isActive: true
            },
            {
                name: "boAt",
                slug: "boat",
                description: "India's favorite lifestyle audio brand with deep bass and trendy designs.",
                logo: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80",
                isActive: true
            },
            {
                name: "Zara",
                slug: "zara",
                description: "Fast-fashion trendsetters offering chic contemporary apparel.",
                logo: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&auto=format&fit=crop&q=80",
                isActive: true
            },
            {
                name: "IKEA",
                slug: "ikea",
                description: "Democratic design for modern, cozy, functional homes.",
                logo: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80",
                isActive: true
            }
        ]);

        // Map brands by slug
        const brandMap = {};
        brands.forEach(b => { brandMap[b.slug] = b._id; });

        // 3. Seed Diverse Products (Covering every price bucket, rating tier, stock status, category, brand)
        const products = [
            // ==================== ELECTRONICS ====================
            {
                name: "iPhone 15 Pro Titanium",
                slug: "iphone-15-pro-titanium",
                description: "Forged in aerospace-grade titanium, featuring the revolutionary A17 Pro chip, customizable Action button, and the most powerful iPhone camera system ever.",
                shortDescription: "Aerospace titanium design with A17 Pro chip and 48MP camera.",
                category: catMap["electronics"],
                brand: brandMap["apple"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_iphone_1",
                        alt: "iPhone 15 Pro Titanium"
                    },
                    {
                        url: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_iphone_2",
                        alt: "iPhone 15 Pro Side"
                    }
                ],
                variants: [
                    {
                        sku: "IPH15P-128-NAT",
                        price: 124999,
                        compareAtPrice: 134900,
                        stock: 12,
                        attributes: { Storage: "128GB", Color: "Natural Titanium" },
                        images: [{ url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80", publicId: "seed_ip1", alt: "Natural Titanium" }],
                        isActive: true
                    },
                    {
                        sku: "IPH15P-256-BLK",
                        price: 134999,
                        compareAtPrice: 144900,
                        stock: 6,
                        attributes: { Storage: "256GB", Color: "Black Titanium" },
                        images: [{ url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80", publicId: "seed_ip2", alt: "Black Titanium" }],
                        isActive: true
                    }
                ],
                tags: ["apple", "smartphone", "flagship", "5g", "electronics"],
                rating: 4.9,
                reviewCount: 88,
                isFeatured: true,
                isActive: true
            },
            {
                name: "Samsung Galaxy S24 Ultra",
                slug: "samsung-galaxy-s24-ultra",
                description: "Meet Galaxy S24 Ultra with Galaxy AI, a built-in S Pen, titanium exterior, and a crystal-clear 200MP quad-telephoto camera.",
                shortDescription: "Galaxy AI powered flagship phone with 200MP camera and S Pen.",
                category: catMap["electronics"],
                brand: brandMap["samsung"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_s24_1",
                        alt: "Samsung Galaxy S24 Ultra"
                    }
                ],
                variants: [
                    {
                        sku: "SAM-S24U-256-GRY",
                        price: 119999,
                        compareAtPrice: 129999,
                        stock: 8,
                        attributes: { Storage: "256GB", Color: "Titanium Gray" },
                        images: [{ url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80", publicId: "seed_s24_1", alt: "Titanium Gray" }],
                        isActive: true
                    }
                ],
                tags: ["samsung", "galaxy", "android", "5g", "camera"],
                rating: 4.8,
                reviewCount: 64,
                isFeatured: true,
                isActive: true
            },
            {
                name: "Fast Charging 65W GaN Charger",
                slug: "fast-charging-65w-gan-charger",
                description: "Compact dual USB-C and USB-A power adapter capable of charging laptops, phones, and tablets simultaneously with GaN III tech.",
                shortDescription: "Ultra-compact 65W GaN wall charger with 3 ports.",
                category: catMap["electronics"],
                brand: brandMap["sony"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_charger_1",
                        alt: "65W GaN Charger"
                    }
                ],
                variants: [
                    {
                        sku: "CHG-65W-WHT",
                        price: 899,
                        compareAtPrice: 1499,
                        stock: 50,
                        attributes: { Color: "White", Power: "65W" },
                        images: [{ url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80", publicId: "seed_chg1", alt: "White" }],
                        isActive: true
                    }
                ],
                tags: ["charger", "gadgets", "usb-c", "budget", "electronics"],
                rating: 4.4,
                reviewCount: 31,
                isFeatured: false,
                isActive: true
            },

            // ==================== AUDIO & WEARABLES ====================
            {
                name: "Sony WH-1000XM5 Wireless Headphones",
                slug: "sony-wh-1000xm5-wireless-headphones",
                description: "Industry-leading noise canceling with two processors and eight microphones for unprecedented noise cancellation and magnificent audio quality.",
                shortDescription: "Flagship wireless noise cancelling over-ear headphones.",
                category: catMap["audio-wearables"],
                brand: brandMap["sony"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_xm5_1",
                        alt: "Sony WH-1000XM5"
                    }
                ],
                variants: [
                    {
                        sku: "SONY-XM5-BLK",
                        price: 26990,
                        compareAtPrice: 34990,
                        stock: 14,
                        attributes: { Color: "Midnight Black" },
                        images: [{ url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80", publicId: "seed_xm5_1", alt: "Black" }],
                        isActive: true
                    },
                    {
                        sku: "SONY-XM5-SLV",
                        price: 26990,
                        compareAtPrice: 34990,
                        stock: 2, // Low stock demo!
                        attributes: { Color: "Platinum Silver" },
                        images: [{ url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80", publicId: "seed_xm5_1", alt: "Silver" }],
                        isActive: true
                    }
                ],
                tags: ["sony", "audio", "anc", "headphones", "wireless"],
                rating: 4.9,
                reviewCount: 112,
                isFeatured: true,
                isActive: true
            },
            {
                name: "boAt Airdopes 141 ANC",
                slug: "boat-airdopes-141-anc",
                description: "True wireless earbuds with 32dB active noise cancellation, 42 hours total playtime, ENx quad mics, and beast mode low latency.",
                shortDescription: "TWS Earbuds with 32dB ANC and 42 Hours Playback.",
                category: catMap["audio-wearables"],
                brand: brandMap["boat"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_boat_1",
                        alt: "boAt Airdopes 141"
                    }
                ],
                variants: [
                    {
                        sku: "BOAT-AD141-BLK",
                        price: 1399,
                        compareAtPrice: 3990,
                        stock: 75,
                        attributes: { Color: "Active Black" },
                        images: [{ url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80", publicId: "seed_boat_1", alt: "Active Black" }],
                        isActive: true
                    },
                    {
                        sku: "BOAT-AD141-BLU",
                        price: 1399,
                        compareAtPrice: 3990,
                        stock: 45,
                        attributes: { Color: "Cider Cyan" },
                        images: [{ url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80", publicId: "seed_boat_1", alt: "Cider Cyan" }],
                        isActive: true
                    }
                ],
                tags: ["boat", "earbuds", "tws", "budget", "bluetooth"],
                rating: 4.1,
                reviewCount: 94,
                isFeatured: false,
                isActive: true
            },
            {
                name: "Apple Watch Ultra 2",
                slug: "apple-watch-ultra-2",
                description: "The ultimate sports and adventure smartwatch with brilliant 3000-nit display, S9 SiP chip, precision GPS, and water resistance up to 100m.",
                shortDescription: "Rugged titanium smartwatch built for athletes and adventurers.",
                category: catMap["audio-wearables"],
                brand: brandMap["apple"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_watch_u2",
                        alt: "Apple Watch Ultra 2"
                    }
                ],
                variants: [
                    {
                        sku: "APL-WCH-U2-ORG",
                        price: 89900,
                        compareAtPrice: 89900,
                        stock: 5,
                        attributes: { Strap: "Orange Alpine Loop", Size: "49mm" },
                        images: [{ url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80", publicId: "seed_u2_1", alt: "Orange Alpine" }],
                        isActive: true
                    }
                ],
                tags: ["apple", "smartwatch", "fitness", "premium"],
                rating: 4.9,
                reviewCount: 47,
                isFeatured: true,
                isActive: true
            },
            {
                name: "boAt BassHeads 100 Wired Earphones",
                slug: "boat-bassheads-100-wired-earphones",
                description: "Hawk-inspired ergonomic in-ear design with super extra bass, 10mm dynamic drivers, and in-line microphone.",
                shortDescription: "Wired in-ear earphones with punchy bass under ₹500.",
                category: catMap["audio-wearables"],
                brand: brandMap["boat"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_wired_1",
                        alt: "boAt BassHeads 100"
                    }
                ],
                variants: [
                    {
                        sku: "BOAT-BH100-RED",
                        price: 399,
                        compareAtPrice: 999,
                        stock: 120,
                        attributes: { Color: "Furious Red" },
                        images: [{ url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80", publicId: "seed_wired_1", alt: "Red" }],
                        isActive: true
                    }
                ],
                tags: ["boat", "wired", "earphones", "budget", "under-1000"],
                rating: 3.8,
                reviewCount: 156,
                isFeatured: false,
                isActive: true
            },

            // ==================== FOOTWEAR ====================
            {
                name: "Nike Air Max 270 Running Shoes",
                slug: "nike-air-max-270-running-shoes",
                description: "Nike's biggest heel Air unit yet delivers an ultra-soft ride that feels as impossible as it looks. Breathable engineered mesh upper.",
                shortDescription: "Lifestyle and running sneaker with Max Air 270 unit.",
                category: catMap["footwear"],
                brand: brandMap["nike"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_nike_red",
                        alt: "Nike Air Max 270"
                    }
                ],
                variants: [
                    {
                        sku: "NIKE-AM270-RED-8",
                        price: 11495,
                        compareAtPrice: 13995,
                        stock: 20,
                        attributes: { Size: "UK 8", Color: "Chile Red / Black" },
                        images: [{ url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80", publicId: "seed_nike_red", alt: "Red UK 8" }],
                        isActive: true
                    },
                    {
                        sku: "NIKE-AM270-RED-9",
                        price: 11495,
                        compareAtPrice: 13995,
                        stock: 18,
                        attributes: { Size: "UK 9", Color: "Chile Red / Black" },
                        images: [{ url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80", publicId: "seed_nike_red", alt: "Red UK 9" }],
                        isActive: true
                    },
                    {
                        sku: "NIKE-AM270-RED-10",
                        price: 11495,
                        compareAtPrice: 13995,
                        stock: 0, // OUT OF STOCK variant demo!
                        attributes: { Size: "UK 10", Color: "Chile Red / Black" },
                        images: [{ url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80", publicId: "seed_nike_red", alt: "Red UK 10" }],
                        isActive: true
                    }
                ],
                tags: ["nike", "sneakers", "running", "airmax", "footwear"],
                rating: 4.8,
                reviewCount: 78,
                isFeatured: true,
                isActive: true
            },
            {
                name: "Adidas Ultraboost Light",
                slug: "adidas-ultraboost-light",
                description: "Experience epic energy with the new Ultraboost Light, our lightest Ultraboost ever made with 30% lighter Light BOOST material.",
                shortDescription: "Ultralight cushioned running shoes with high energy return.",
                category: catMap["footwear"],
                brand: brandMap["adidas"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_adidas_1",
                        alt: "Adidas Ultraboost Light"
                    }
                ],
                variants: [
                    {
                        sku: "ADI-UB-WHT-8",
                        price: 14999,
                        compareAtPrice: 18999,
                        stock: 15,
                        attributes: { Size: "UK 8", Color: "Cloud White" },
                        images: [{ url: "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&auto=format&fit=crop&q=80", publicId: "seed_adi1", alt: "White" }],
                        isActive: true
                    },
                    {
                        sku: "ADI-UB-WHT-9",
                        price: 14999,
                        compareAtPrice: 18999,
                        stock: 3,
                        attributes: { Size: "UK 9", Color: "Cloud White" },
                        images: [{ url: "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&auto=format&fit=crop&q=80", publicId: "seed_adi1", alt: "White" }],
                        isActive: true
                    }
                ],
                tags: ["adidas", "ultraboost", "running", "comfort", "sneakers"],
                rating: 4.7,
                reviewCount: 52,
                isFeatured: false,
                isActive: true
            },
            {
                name: "Puma Smash V2 Leather Sneakers",
                slug: "puma-smash-v2-leather-sneakers",
                description: "Tennis-inspired silhouette with clean leather upper, cushioned SoftFoam+ sockliner, and durable rubber outsole.",
                shortDescription: "Classic low-top tennis sneakers with genuine leather.",
                category: catMap["footwear"],
                brand: brandMap["puma"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_puma_1",
                        alt: "Puma Smash V2"
                    }
                ],
                variants: [
                    {
                        sku: "PUM-SMASH-WHT-8",
                        price: 2499,
                        compareAtPrice: 4499,
                        stock: 25,
                        attributes: { Size: "UK 8", Color: "Puma White" },
                        images: [{ url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80", publicId: "seed_puma_1", alt: "White" }],
                        isActive: true
                    }
                ],
                tags: ["puma", "sneakers", "leather", "casual", "budget"],
                rating: 4.2,
                reviewCount: 39,
                isFeatured: false,
                isActive: true
            },
            {
                name: "Retro High-Top Basketball Sneakers",
                slug: "retro-high-top-basketball-sneakers",
                description: "Classic court styling reborn for the streets, featuring padded collar, retro leather paneling, and heritage colorways.",
                shortDescription: "Vintage 80s court basketball sneakers.",
                category: catMap["footwear"],
                brand: brandMap["nike"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_retro_1",
                        alt: "Retro High-Top Sneakers"
                    }
                ],
                variants: [
                    {
                        sku: "RETRO-HI-BLK-9",
                        price: 8499,
                        compareAtPrice: 10999,
                        stock: 0, // Entire product out of stock test!
                        attributes: { Size: "UK 9", Color: "Black / Royal Blue" },
                        images: [{ url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80", publicId: "seed_retro_1", alt: "Royal" }],
                        isActive: true
                    }
                ],
                tags: ["nike", "basketball", "retro", "streetwear"],
                rating: 3.5,
                reviewCount: 16,
                isFeatured: false,
                isActive: true
            },

            // ==================== FASHION & APPAREL ====================
            {
                name: "Nike Sportswear Club Fleece Hoodie",
                slug: "nike-sportswear-club-fleece-hoodie",
                description: "A staple in your closet, the Nike Sportswear Club Fleece Pullover Hoodie combines classic style with soft brushed-back fleece for elevated everyday look.",
                shortDescription: "Classic cozy fleece pullover hoodie with kangaroo pocket.",
                category: catMap["fashion-apparel"],
                brand: brandMap["nike"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_hoodie_1",
                        alt: "Nike Club Fleece Hoodie"
                    }
                ],
                variants: [
                    {
                        sku: "NIKE-HD-BLK-M",
                        price: 3295,
                        compareAtPrice: 4295,
                        stock: 35,
                        attributes: { Size: "M", Color: "Black" },
                        images: [{ url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80", publicId: "seed_hd1", alt: "Black M" }],
                        isActive: true
                    },
                    {
                        sku: "NIKE-HD-BLK-L",
                        price: 3295,
                        compareAtPrice: 4295,
                        stock: 22,
                        attributes: { Size: "L", Color: "Black" },
                        images: [{ url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80", publicId: "seed_hd2", alt: "Black L" }],
                        isActive: true
                    }
                ],
                tags: ["nike", "hoodie", "fleece", "winter", "apparel"],
                rating: 4.6,
                reviewCount: 44,
                isFeatured: true,
                isActive: true
            },
            {
                name: "Zara Tailored Linen Blazer",
                slug: "zara-tailored-linen-blazer",
                description: "Regular fit blazer made of 100% breathable European linen with notch lapel collar, front flap pockets, and button fastening.",
                shortDescription: "100% European linen tailored summer blazer.",
                category: catMap["fashion-apparel"],
                brand: brandMap["zara"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_blazer_1",
                        alt: "Zara Linen Blazer"
                    }
                ],
                variants: [
                    {
                        sku: "ZARA-BLZ-BGE-40",
                        price: 6990,
                        compareAtPrice: 8990,
                        stock: 10,
                        attributes: { Size: "EU 40", Color: "Sand Beige" },
                        images: [{ url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80", publicId: "seed_blz1", alt: "Sand Beige" }],
                        isActive: true
                    }
                ],
                tags: ["zara", "blazer", "linen", "formal", "fashion"],
                rating: 4.3,
                reviewCount: 28,
                isFeatured: false,
                isActive: true
            },
            {
                name: "Zara Slim Fit Stretch Chinos",
                slug: "zara-slim-fit-stretch-chinos",
                description: "Versatile cotton twill chinos with a hint of stretch for comfort. Features coin pocket, rear welt pockets, and zip fly with button.",
                shortDescription: "Stretch cotton slim-fit chinos for smart casual styling.",
                category: catMap["fashion-apparel"],
                brand: brandMap["zara"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_chinos_1",
                        alt: "Slim Fit Chinos"
                    }
                ],
                variants: [
                    {
                        sku: "ZARA-CHIN-NVY-32",
                        price: 2990,
                        compareAtPrice: 3590,
                        stock: 40,
                        attributes: { Waist: "32", Color: "Navy Blue" },
                        images: [{ url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80", publicId: "seed_ch1", alt: "Navy 32" }],
                        isActive: true
                    }
                ],
                tags: ["zara", "pants", "chinos", "cotton", "casual"],
                rating: 4.1,
                reviewCount: 22,
                isFeatured: false,
                isActive: true
            },
            {
                name: "Organic Heavyweight Cotton Crewneck Tee",
                slug: "organic-heavyweight-cotton-crewneck-tee",
                description: "240 GSM dense organic cotton t-shirt with ribbed collar, drop shoulders, and pre-shrunk vintage wash.",
                shortDescription: "Boxy fit heavyweight premium cotton everyday tee.",
                category: catMap["fashion-apparel"],
                brand: brandMap["zara"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_tee_wht",
                        alt: "Heavyweight Cotton Tee"
                    }
                ],
                variants: [
                    {
                        sku: "TEE-HVY-WHT-M",
                        price: 999,
                        compareAtPrice: 1499,
                        stock: 60,
                        attributes: { Size: "M", Color: "Bone White" },
                        images: [{ url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80", publicId: "seed_tee_wht", alt: "White" }],
                        isActive: true
                    },
                    {
                        sku: "TEE-HVY-BLK-M",
                        price: 999,
                        compareAtPrice: 1499,
                        stock: 55,
                        attributes: { Size: "M", Color: "Faded Black" },
                        images: [{ url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80", publicId: "seed_tee_wht", alt: "Black" }],
                        isActive: true
                    }
                ],
                tags: ["tshirt", "organic", "cotton", "budget", "under-1000"],
                rating: 4.5,
                reviewCount: 63,
                isFeatured: false,
                isActive: true
            },

            // ==================== HOME & LIVING ====================
            {
                name: "IKEA Minimalist Arc Desk Lamp",
                slug: "ikea-minimalist-arc-desk-lamp",
                description: "Dimmable LED task light with adjustable neck, touch controls, 3 color temperatures, and integrated USB-C output for charging devices.",
                shortDescription: "Sleek matte black architect desk lamp with touch dimming.",
                category: catMap["home-living"],
                brand: brandMap["ikea"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_lamp_1",
                        alt: "IKEA Desk Lamp"
                    }
                ],
                variants: [
                    {
                        sku: "IKEA-LAMP-BLK",
                        price: 1899,
                        compareAtPrice: 2999,
                        stock: 28,
                        attributes: { Color: "Matte Black", Style: "Modern" },
                        images: [{ url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80", publicId: "seed_lamp_1", alt: "Black" }],
                        isActive: true
                    }
                ],
                tags: ["ikea", "lighting", "home", "desk", "decor"],
                rating: 4.7,
                reviewCount: 37,
                isFeatured: true,
                isActive: true
            },
            {
                name: "IKEA Ergonomic Memory Foam Cushion",
                slug: "ikea-ergonomic-memory-foam-cushion",
                description: "High-density pressure-relieving seat cushion engineered to support tailbone and lower back alignment for long work hours.",
                shortDescription: "Orthopedic lumbar and coccyx support cushion.",
                category: catMap["home-living"],
                brand: brandMap["ikea"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_cushion_1",
                        alt: "Memory Foam Cushion"
                    }
                ],
                variants: [
                    {
                        sku: "IKEA-CSH-GRY",
                        price: 1299,
                        compareAtPrice: 1999,
                        stock: 45,
                        attributes: { Color: "Charcoal Grey" },
                        images: [{ url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80", publicId: "seed_cushion_1", alt: "Grey" }],
                        isActive: true
                    }
                ],
                tags: ["ikea", "ergonomics", "office", "comfort", "home"],
                rating: 4.4,
                reviewCount: 19,
                isFeatured: false,
                isActive: true
            },
            {
                name: "Ceramic Aroma Diffuser & Humidifier",
                slug: "ceramic-aroma-diffuser-humidifier",
                description: "Ultrasonic cool mist essential oil diffuser with handcrafted matte ceramic stone cover, ambient warm night light, and auto shutoff.",
                shortDescription: "Quiet ultrasonic stone aromatherapy diffuser.",
                category: catMap["home-living"],
                brand: brandMap["ikea"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_diffuser_1",
                        alt: "Aroma Diffuser"
                    }
                ],
                variants: [
                    {
                        sku: "IKEA-DIFF-WHT",
                        price: 2199,
                        compareAtPrice: 3499,
                        stock: 20,
                        attributes: { Color: "Terracotta White" },
                        images: [{ url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80", publicId: "seed_diffuser_1", alt: "White" }],
                        isActive: true
                    }
                ],
                tags: ["ikea", "wellness", "aromatherapy", "home", "cozy"],
                rating: 4.6,
                reviewCount: 26,
                isFeatured: false,
                isActive: true
            },

            // ==================== SPORTS & FITNESS ====================
            {
                name: "Nike Pro Training Gym Bag 40L",
                slug: "nike-pro-training-gym-bag-40l",
                description: "Durable water-resistant duffel with ventilated wet/dry shoe compartment, padded shoulder strap, and secure zip pockets.",
                shortDescription: "40-liter all-weather duffel with separate shoe compartment.",
                category: catMap["sports-fitness"],
                brand: brandMap["nike"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_duffel_1",
                        alt: "Nike Gym Bag"
                    }
                ],
                variants: [
                    {
                        sku: "NIKE-BAG-40L-BLK",
                        price: 2795,
                        compareAtPrice: 3795,
                        stock: 30,
                        attributes: { Capacity: "40L", Color: "Black / Volt" },
                        images: [{ url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80", publicId: "seed_duffel_1", alt: "Black" }],
                        isActive: true
                    }
                ],
                tags: ["nike", "gym", "duffel", "fitness", "accessories"],
                rating: 4.8,
                reviewCount: 34,
                isFeatured: false,
                isActive: true
            },
            {
                name: "Puma Double-Wall Insulated Steel Flask 1L",
                slug: "puma-double-wall-insulated-steel-flask-1l",
                description: "Vacuum insulated food-grade 18/8 stainless steel bottle that keeps liquids cold for 24 hours or hot for 12 hours. Leakproof spout cap.",
                shortDescription: "1-liter sweat-proof stainless steel workout flask.",
                category: catMap["sports-fitness"],
                brand: brandMap["puma"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_flask_1",
                        alt: "Steel Flask"
                    }
                ],
                variants: [
                    {
                        sku: "PUM-FLASK-1L-BLK",
                        price: 799,
                        compareAtPrice: 1499,
                        stock: 65,
                        attributes: { Capacity: "1000ml", Color: "Matte Black" },
                        images: [{ url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80", publicId: "seed_flask_1", alt: "Black" }],
                        isActive: true
                    }
                ],
                tags: ["puma", "flask", "water-bottle", "budget", "under-1000"],
                rating: 4.5,
                reviewCount: 50,
                isFeatured: false,
                isActive: true
            },

            // ==================== BEAUTY & GROOMING ====================
            {
                name: "Botanical Restorative Facial Oil 50ml",
                slug: "botanical-restorative-facial-oil-50ml",
                description: "Formulated with pure cold-pressed rosehip, squalane, and vitamin E to nourish dry skin and protect barrier radiance.",
                shortDescription: "100% cold-pressed organic rosehip & squalane face elixir.",
                category: catMap["beauty-grooming"],
                brand: brandMap["zara"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1608248597359-57e3f84860d5?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_oil_1",
                        alt: "Botanical Facial Oil"
                    }
                ],
                variants: [
                    {
                        sku: "BOT-OIL-50ML",
                        price: 1450,
                        compareAtPrice: 1950,
                        stock: 35,
                        attributes: { Volume: "50ml" },
                        images: [{ url: "https://images.unsplash.com/photo-1608248597359-57e3f84860d5?w=800&auto=format&fit=crop&q=80", publicId: "seed_oil_1", alt: "50ml" }],
                        isActive: true
                    }
                ],
                tags: ["beauty", "skincare", "organic", "glow"],
                rating: 4.6,
                reviewCount: 41,
                isFeatured: false,
                isActive: true
            },
            {
                name: "Deep Cleansing Charcoal Face Scrub",
                slug: "deep-cleansing-charcoal-face-scrub",
                description: "Gentle exfoliating scrub infused with activated bamboo charcoal and tea tree oil to unclog pores and remove impurities.",
                shortDescription: "Activated bamboo charcoal exfoliating scrub 100g.",
                category: catMap["beauty-grooming"],
                brand: brandMap["zara"],
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
                        publicId: "seed_scrub_1",
                        alt: "Charcoal Face Scrub"
                    }
                ],
                variants: [
                    {
                        sku: "CHRC-SCRUB-100G",
                        price: 499,
                        compareAtPrice: 799,
                        stock: 80,
                        attributes: { Weight: "100g" },
                        images: [{ url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80", publicId: "seed_scrub_1", alt: "100g" }],
                        isActive: true
                    }
                ],
                tags: ["beauty", "grooming", "budget", "under-1000", "charcoal"],
                rating: 4.3,
                reviewCount: 29,
                isFeatured: false,
                isActive: true
            }
        ];

        await Product.create(products);
        console.log(`\n========================================`);
        console.log(`SUCCESSFULLY SEEDED:`);
        console.log(`- Categories: ${categories.length}`);
        console.log(`- Brands:     ${brands.length}`);
        console.log(`- Products:   ${products.length}`);
        console.log(`========================================\n`);

        process.exit(0);
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seedData();
