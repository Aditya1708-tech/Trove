/**
 * Trove — Database Seed Script
 * Run: npm run seed
 *
 * Creates:
 * - 1 admin user
 * - 2 seller users + seller profiles
 * - 4 top-level categories + 8 sub-categories
 * - 20 sample products across all categories
 * - 3 sample coupons
 * - 3 hero banners
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User     = require('../models/User');
const Seller   = require('../models/Seller');
const Category = require('../models/Category');
const Product  = require('../models/Product');
const Coupon   = require('../models/Coupon');
const Banner   = require('../models/Banner');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trove';

// Placeholder image URLs (Unsplash — free to use)
const IMAGES = {
  electronics: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
  smartphone:  'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800',
  laptop:      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
  headphones:  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
  tablet:      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800',
  fashion:     'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
  tshirt:      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800',
  shoes:       'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
  dress:       'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800',
  watch:       'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
  home:        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
  sofa:        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
  lamp:        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
  cookware:    'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800',
  bed:         'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800',
  books:       'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
  book1:       'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800',
  book2:       'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
};

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Seller.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({}),
      Banner.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // ── Users ──────────────────────────────────────────────────────────
    const adminUser = new User({
      name:         'Trove Admin',
      email:        'admin@trove.com',
      passwordHash: 'Admin@123',
      role:         'admin',
      isVerified:   true,
    });
    await adminUser.save();

    const sellerUser1 = new User({
      name:         'TechZone India',
      email:        'seller1@trove.com',
      passwordHash: 'Seller@123',
      role:         'seller',
      isVerified:   true,
    });
    await sellerUser1.save();

    const sellerUser2 = new User({
      name:         'Fashion Hub',
      email:        'seller2@trove.com',
      passwordHash: 'Seller@123',
      role:         'seller',
      isVerified:   true,
    });
    await sellerUser2.save();

    console.log('👤 Created users');

    // ── Sellers ────────────────────────────────────────────────────────
    const seller1 = await Seller.create({
      user:         sellerUser1._id,
      businessName: 'TechZone India Pvt. Ltd.',
      displayName:  'TechZone',
      email:        'seller1@trove.com',
      phone:        '9876543210',
      gstNumber:    '29AADCB2230M1ZP',
      description:  'India\'s trusted electronics retailer since 2015',
      rating:       4.5,
      isVerified:   true,
    });

    const seller2 = await Seller.create({
      user:         sellerUser2._id,
      businessName: 'Fashion Hub LLP',
      displayName:  'FashionHub',
      email:        'seller2@trove.com',
      phone:        '9876543211',
      rating:       4.3,
      isVerified:   true,
    });

    // Link sellers to user profiles
    await User.findByIdAndUpdate(sellerUser1._id, { sellerProfile: seller1._id });
    await User.findByIdAndUpdate(sellerUser2._id, { sellerProfile: seller2._id });

    console.log('🏪 Created sellers');

    // ── Categories ─────────────────────────────────────────────────────
    const [electronics, fashion, home, books] = await Category.insertMany([
      { name: 'Electronics',    slug: 'electronics',    icon: '📱', isFeatured: true,  order: 1, level: 0, image: { url: IMAGES.electronics } },
      { name: 'Fashion',        slug: 'fashion',        icon: '👗', isFeatured: true,  order: 2, level: 0, image: { url: IMAGES.fashion } },
      { name: 'Home & Kitchen', slug: 'home-kitchen',   icon: '🏠', isFeatured: true,  order: 3, level: 0, image: { url: IMAGES.home } },
      { name: 'Books',          slug: 'books',          icon: '📚', isFeatured: false, order: 4, level: 0, image: { url: IMAGES.books } },
    ]);

    // Subcategories
    const subCats = await Category.insertMany([
      { name: 'Smartphones',  slug: 'smartphones',   parentCategory: electronics._id, level: 1, order: 1, ancestors: [{ _id: electronics._id, name: electronics.name, slug: electronics.slug }] },
      { name: 'Laptops',      slug: 'laptops',       parentCategory: electronics._id, level: 1, order: 2, ancestors: [{ _id: electronics._id, name: electronics.name, slug: electronics.slug }] },
      { name: 'Headphones',   slug: 'headphones',    parentCategory: electronics._id, level: 1, order: 3, ancestors: [{ _id: electronics._id, name: electronics.name, slug: electronics.slug }] },
      { name: "Men's Fashion", slug: 'mens-fashion',  parentCategory: fashion._id,    level: 1, order: 1, ancestors: [{ _id: fashion._id, name: fashion.name, slug: fashion.slug }] },
      { name: "Women's Fashion", slug: 'womens-fashion', parentCategory: fashion._id, level: 1, order: 2, ancestors: [{ _id: fashion._id, name: fashion.name, slug: fashion.slug }] },
      { name: 'Furniture',    slug: 'furniture',     parentCategory: home._id,       level: 1, order: 1, ancestors: [{ _id: home._id, name: home.name, slug: home.slug }] },
      { name: 'Kitchen',      slug: 'kitchen',       parentCategory: home._id,       level: 1, order: 2, ancestors: [{ _id: home._id, name: home.name, slug: home.slug }] },
      { name: 'Fiction',      slug: 'fiction',       parentCategory: books._id,      level: 1, order: 1, ancestors: [{ _id: books._id, name: books.name, slug: books.slug }] },
    ]);

    const [smartphones, laptops, headphones, mensFashion, womensFashion, furniture, kitchen, fiction] = subCats;
    console.log('📂 Created categories');

    // ── Products ───────────────────────────────────────────────────────
    const makeSlug = (name, id) =>
      `${name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}-${id.toString().slice(-6)}`;

    const products = [];

    // ELECTRONICS — Smartphones
    const p1 = new Product({
      name: 'Nova X20 Pro 5G Smartphone',
      description: 'Experience the future with Nova X20 Pro. Featuring a stunning 6.7" AMOLED display, Snapdragon 8 Gen 2 processor, 108MP triple camera, and 5000mAh battery with 67W fast charging. 5G enabled for blazing speeds.',
      shortDescription: '6.7" AMOLED | 108MP Camera | 5G | 5000mAh | 67W Charging',
      category: electronics._id, subCategory: smartphones._id, seller: seller1._id, brand: 'Nova',
      images: [{ url: IMAGES.smartphone, publicId: '', alt: 'Nova X20 Pro', isPrimary: true }],
      variants: [
        { sku: 'NVX20-128-BLK', color: 'Midnight Black', colorHex: '#1a1a1a', storage: '128GB', price: 34999, mrp: 42999, stock: 50 },
        { sku: 'NVX20-256-BLK', color: 'Midnight Black', colorHex: '#1a1a1a', storage: '256GB', price: 38999, mrp: 46999, stock: 30 },
        { sku: 'NVX20-128-SLV', color: 'Starlight Silver', colorHex: '#C0C0C0', storage: '128GB', price: 34999, mrp: 42999, stock: 20 },
      ],
      highlights: ['Snapdragon 8 Gen 2 Octa-core processor', '108MP + 12MP + 5MP Triple Camera', '6.7" 120Hz AMOLED Display', '5000mAh battery with 67W fast charging', 'IP68 water resistance'],
      specifications: [
        { key: 'Processor', value: 'Snapdragon 8 Gen 2', group: 'Performance' },
        { key: 'RAM', value: '12GB', group: 'Performance' },
        { key: 'Display', value: '6.7" 120Hz AMOLED', group: 'Display' },
        { key: 'Rear Camera', value: '108MP + 12MP + 5MP', group: 'Camera' },
        { key: 'Battery', value: '5000mAh', group: 'Battery' },
        { key: 'OS', value: 'Android 14', group: 'Software' },
      ],
      ratingsAverage: 4.5, ratingsCount: 234, discountPercent: 18, isFeatured: true, isBestSeller: true,
      tags: ['smartphone', '5g', 'android', 'nova'],
    });
    p1.slug = makeSlug(p1.name, p1._id);
    products.push(p1);

    const p2 = new Product({
      name: 'Pixel Snap 15 Ultra',
      description: 'Pure Android experience with Google Tensor G3 chip. Incredible computational photography with 64MP Zeiss optics, 7 years of OS updates, and satellite connectivity.',
      shortDescription: '64MP Zeiss | Tensor G3 | 7yr updates | Satellite SOS',
      category: electronics._id, subCategory: smartphones._id, seller: seller1._id, brand: 'Pixel',
      images: [{ url: IMAGES.smartphone, publicId: '', alt: 'Pixel Snap 15', isPrimary: true }],
      variants: [
        { sku: 'PX15-128-OBS', color: 'Obsidian', colorHex: '#2d2d2d', storage: '128GB', price: 79999, mrp: 89999, stock: 25 },
        { sku: 'PX15-256-OBS', color: 'Obsidian', colorHex: '#2d2d2d', storage: '256GB', price: 89999, mrp: 99999, stock: 15 },
      ],
      highlights: ['Google Tensor G3 chip', '64MP Zeiss camera system', 'Magic Eraser & Photo Unblur', '4950mAh battery', 'Temperature sensor'],
      specifications: [
        { key: 'Processor', value: 'Google Tensor G3', group: 'Performance' },
        { key: 'Display', value: '6.7" LTPO OLED 120Hz', group: 'Display' },
        { key: 'Rear Camera', value: '64MP + 48MP + 48MP', group: 'Camera' },
      ],
      ratingsAverage: 4.7, ratingsCount: 89, discountPercent: 11, isFeatured: true, isNewArrival: true,
      tags: ['smartphone', 'android', 'pixel', 'camera'],
    });
    p2.slug = makeSlug(p2.name, p2._id);
    products.push(p2);

    // ELECTRONICS — Laptops
    const p3 = new Product({
      name: 'SwiftBook Pro 14" Laptop',
      description: 'Ultra-thin powerhouse with Intel Core i7-13th Gen, 16GB RAM, 512GB NVMe SSD, and 14" 2.8K OLED display. 12-hour battery life. Perfect for professionals and creators.',
      shortDescription: 'Intel i7-13th Gen | 16GB RAM | 512GB SSD | 14" 2.8K OLED',
      category: electronics._id, subCategory: laptops._id, seller: seller1._id, brand: 'SwiftBook',
      images: [{ url: IMAGES.laptop, publicId: '', alt: 'SwiftBook Pro 14', isPrimary: true }],
      variants: [
        { sku: 'SBP14-I7-16-512', size: '14"', color: 'Space Grey', colorHex: '#6b6b6b', storage: '512GB', price: 79999, mrp: 99999, stock: 20 },
        { sku: 'SBP14-I7-32-1T',  size: '14"', color: 'Space Grey', colorHex: '#6b6b6b', storage: '1TB',   price: 94999, mrp: 114999, stock: 10 },
      ],
      highlights: ['Intel Core i7-1360P (13th Gen)', '14" 2.8K OLED Touch Display', '16GB LPDDR5 RAM', '512GB PCIe 4.0 NVMe SSD', '12-hour battery'],
      specifications: [
        { key: 'Processor', value: 'Intel Core i7-1360P', group: 'Performance' },
        { key: 'Display', value: '14" 2.8K OLED 120Hz', group: 'Display' },
        { key: 'RAM', value: '16GB LPDDR5', group: 'Performance' },
        { key: 'Storage', value: '512GB PCIe NVMe SSD', group: 'Storage' },
        { key: 'Weight', value: '1.3 kg', group: 'Build' },
      ],
      ratingsAverage: 4.6, ratingsCount: 67, discountPercent: 20, isFeatured: true,
      tags: ['laptop', 'intel', 'oled', 'ultrabook'],
    });
    p3.slug = makeSlug(p3.name, p3._id);
    products.push(p3);

    // ELECTRONICS — Headphones
    const p4 = new Product({
      name: 'SoundWave ANC Pro Headphones',
      description: 'Industry-leading active noise cancellation with 30-hour battery life. Hi-Res Audio certified, multipoint Bluetooth, and premium comfort for all-day wear.',
      shortDescription: 'ANC | 30hr battery | Hi-Res Audio | Multipoint BT',
      category: electronics._id, subCategory: headphones._id, seller: seller1._id, brand: 'SoundWave',
      images: [{ url: IMAGES.headphones, publicId: '', alt: 'SoundWave ANC Pro', isPrimary: true }],
      variants: [
        { sku: 'SW-ANC-BLK', color: 'Matte Black', colorHex: '#222222', price: 14999, mrp: 19999, stock: 100 },
        { sku: 'SW-ANC-WHT', color: 'Pearl White', colorHex: '#F5F5F5', price: 14999, mrp: 19999, stock: 75 },
        { sku: 'SW-ANC-NVY', color: 'Navy Blue',   colorHex: '#001F5B', price: 15499, mrp: 19999, stock: 40 },
      ],
      highlights: ['40dB Active Noise Cancellation', '30 hours playback (ANC on)', 'Hi-Res Audio + LDAC', 'Multipoint Bluetooth 5.3', '3-minute quick charge = 3 hours'],
      ratingsAverage: 4.4, ratingsCount: 312, discountPercent: 25, isBestSeller: true,
      tags: ['headphones', 'anc', 'bluetooth', 'audio'],
    });
    p4.slug = makeSlug(p4.name, p4._id);
    products.push(p4);

    const p5 = new Product({
      name: 'BassFlow True Wireless Earbuds',
      description: 'Compact TWS earbuds with 10mm dynamic drivers, 6-hour battery (30hr with case), IPX5 water resistance, and touch controls.',
      shortDescription: '10mm Drivers | 30hr Total | IPX5 | Touch Controls',
      category: electronics._id, subCategory: headphones._id, seller: seller1._id, brand: 'BassFlow',
      images: [{ url: IMAGES.headphones, publicId: '', alt: 'BassFlow TWS', isPrimary: true }],
      variants: [
        { sku: 'BF-TWS-BLK', color: 'Black', colorHex: '#000000', price: 2499, mrp: 3999, stock: 200 },
        { sku: 'BF-TWS-WHT', color: 'White', colorHex: '#FFFFFF', price: 2499, mrp: 3999, stock: 150 },
      ],
      ratingsAverage: 4.1, ratingsCount: 892, discountPercent: 37, isNewArrival: false, isBestSeller: true,
      tags: ['earbuds', 'tws', 'wireless', 'bassflow'],
    });
    p5.slug = makeSlug(p5.name, p5._id);
    products.push(p5);

    // FASHION — Men's
    const p6 = new Product({
      name: 'Urban Flex Oversized T-Shirt',
      description: '100% premium cotton oversized tee with drop shoulders. Garment washed for that lived-in feel. Ethically made in India.',
      shortDescription: '100% Cotton | Oversized Fit | Garment Washed | Unisex',
      category: fashion._id, subCategory: mensFashion._id, seller: seller2._id, brand: 'UrbanFlex',
      images: [{ url: IMAGES.tshirt, publicId: '', alt: 'Urban Flex Tee', isPrimary: true }],
      variants: [
        { sku: 'UF-TSHIRT-S-BLK', size: 'S', color: 'Black', colorHex: '#000000', price: 799, mrp: 1299, stock: 100 },
        { sku: 'UF-TSHIRT-M-BLK', size: 'M', color: 'Black', colorHex: '#000000', price: 799, mrp: 1299, stock: 150 },
        { sku: 'UF-TSHIRT-L-BLK', size: 'L', color: 'Black', colorHex: '#000000', price: 799, mrp: 1299, stock: 120 },
        { sku: 'UF-TSHIRT-XL-BLK',size: 'XL',color: 'Black', colorHex: '#000000', price: 799, mrp: 1299, stock: 80 },
        { sku: 'UF-TSHIRT-S-WHT', size: 'S', color: 'White', colorHex: '#FFFFFF', price: 799, mrp: 1299, stock: 90 },
        { sku: 'UF-TSHIRT-M-WHT', size: 'M', color: 'White', colorHex: '#FFFFFF', price: 799, mrp: 1299, stock: 130 },
      ],
      highlights: ['280GSM premium cotton', 'Drop shoulder oversized fit', 'Garment washed & pre-shrunk', 'Ribbed crew neck', 'Machine washable'],
      ratingsAverage: 4.3, ratingsCount: 1240, discountPercent: 38, isBestSeller: true,
      tags: ['tshirt', 'cotton', 'oversized', 'urban', 'mens'],
    });
    p6.slug = makeSlug(p6.name, p6._id);
    products.push(p6);

    const p7 = new Product({
      name: 'TrailBlazer Running Shoes',
      description: 'Engineered for performance with lightweight mesh upper, responsive foam midsole, and durable rubber outsole. Perfect for daily running and gym.',
      shortDescription: 'Lightweight Mesh | Responsive Foam | Anti-Slip Outsole',
      category: fashion._id, subCategory: mensFashion._id, seller: seller2._id, brand: 'TrailBlazer',
      images: [{ url: IMAGES.shoes, publicId: '', alt: 'TrailBlazer Running', isPrimary: true }],
      variants: [
        { sku: 'TB-SHOE-7-BLK', size: 'UK 7', color: 'Black/White', colorHex: '#000000', price: 2299, mrp: 3499, stock: 40 },
        { sku: 'TB-SHOE-8-BLK', size: 'UK 8', color: 'Black/White', colorHex: '#000000', price: 2299, mrp: 3499, stock: 50 },
        { sku: 'TB-SHOE-9-BLK', size: 'UK 9', color: 'Black/White', colorHex: '#000000', price: 2299, mrp: 3499, stock: 35 },
        { sku: 'TB-SHOE-10-BLK',size: 'UK 10',color: 'Black/White', colorHex: '#000000', price: 2299, mrp: 3499, stock: 20 },
        { sku: 'TB-SHOE-8-NVY', size: 'UK 8', color: 'Navy/Orange', colorHex: '#001F5B', price: 2499, mrp: 3499, stock: 30 },
      ],
      ratingsAverage: 4.2, ratingsCount: 567, discountPercent: 34, isBestSeller: false,
      tags: ['shoes', 'running', 'sports', 'trailblazer'],
    });
    p7.slug = makeSlug(p7.name, p7._id);
    products.push(p7);

    // FASHION — Women's
    const p8 = new Product({
      name: 'Floral Wrap Midi Dress',
      description: 'Elegant floral print wrap dress in flowing chiffon fabric. Perfect for summer days, brunches, and casual evenings. Adjustable wrap tie for a flattering fit.',
      shortDescription: 'Chiffon | Floral Print | Wrap Style | Midi Length',
      category: fashion._id, subCategory: womensFashion._id, seller: seller2._id, brand: 'Bloom',
      images: [{ url: IMAGES.dress, publicId: '', alt: 'Floral Wrap Dress', isPrimary: true }],
      variants: [
        { sku: 'BL-DRESS-XS-FL', size: 'XS', color: 'Floral Pink', colorHex: '#FF69B4', price: 1799, mrp: 2799, stock: 50 },
        { sku: 'BL-DRESS-S-FL',  size: 'S',  color: 'Floral Pink', colorHex: '#FF69B4', price: 1799, mrp: 2799, stock: 60 },
        { sku: 'BL-DRESS-M-FL',  size: 'M',  color: 'Floral Pink', colorHex: '#FF69B4', price: 1799, mrp: 2799, stock: 45 },
        { sku: 'BL-DRESS-L-FL',  size: 'L',  color: 'Floral Pink', colorHex: '#FF69B4', price: 1799, mrp: 2799, stock: 30 },
        { sku: 'BL-DRESS-M-BL',  size: 'M',  color: 'Blue Floral', colorHex: '#4169E1', price: 1799, mrp: 2799, stock: 25 },
      ],
      ratingsAverage: 4.5, ratingsCount: 389, discountPercent: 35, isNewArrival: true,
      tags: ['dress', 'floral', 'womens', 'summer', 'chiffon'],
    });
    p8.slug = makeSlug(p8.name, p8._id);
    products.push(p8);

    const p9 = new Product({
      name: 'Minimalist Leather Analog Watch',
      description: 'Japanese quartz movement in a slim 38mm stainless steel case. Genuine leather strap, sapphire-coated mineral crystal, and 3ATM water resistance.',
      shortDescription: 'Japanese Quartz | 38mm | Sapphire Crystal | 3ATM | Leather Strap',
      category: fashion._id, subCategory: womensFashion._id, seller: seller2._id, brand: 'Luxe Tempo',
      images: [{ url: IMAGES.watch, publicId: '', alt: 'Minimalist Watch', isPrimary: true }],
      variants: [
        { sku: 'LT-WATCH-GLD', color: 'Gold/Brown', colorHex: '#FFD700', price: 3999, mrp: 5999, stock: 40 },
        { sku: 'LT-WATCH-SLV', color: 'Silver/Black', colorHex: '#C0C0C0', price: 3999, mrp: 5999, stock: 35 },
        { sku: 'LT-WATCH-RSG', color: 'Rose Gold', colorHex: '#B76E79', price: 4499, mrp: 6499, stock: 20 },
      ],
      ratingsAverage: 4.6, ratingsCount: 156, discountPercent: 33, isFeatured: true,
      tags: ['watch', 'leather', 'analog', 'minimalist', 'womens'],
    });
    p9.slug = makeSlug(p9.name, p9._id);
    products.push(p9);

    // HOME & KITCHEN — Furniture
    const p10 = new Product({
      name: 'Scandinavian 3-Seater Sofa',
      description: 'Premium velvet upholstered sofa with solid oak legs. Sinuous spring support system for lasting comfort. Available in 4 colours. Easy assembly in 30 minutes.',
      shortDescription: 'Velvet Upholstery | Oak Legs | Spring Support | 3-Seater',
      category: home._id, subCategory: furniture._id, seller: seller1._id, brand: 'Arthaus',
      images: [{ url: IMAGES.sofa, publicId: '', alt: 'Scandinavian Sofa', isPrimary: true }],
      variants: [
        { sku: 'AH-SOFA-TL', color: 'Teal',       colorHex: '#008080', price: 28999, mrp: 42999, stock: 15 },
        { sku: 'AH-SOFA-GR', color: 'Dark Grey',   colorHex: '#555555', price: 28999, mrp: 42999, stock: 12 },
        { sku: 'AH-SOFA-BG', color: 'Beige',       colorHex: '#F5F5DC', price: 28999, mrp: 42999, stock: 10 },
        { sku: 'AH-SOFA-MG', color: 'Mustard Gold',colorHex: '#FFB100', price: 31999, mrp: 45999, stock: 8 },
      ],
      highlights: ['Premium velvet fabric upholstery', 'Solid oak wood legs', 'Sinuous spring suspension', '3-seater (220cm wide)', '5-year warranty'],
      ratingsAverage: 4.4, ratingsCount: 78, discountPercent: 32, isFeatured: true,
      tags: ['sofa', 'furniture', 'living room', 'scandinavian'],
    });
    p10.slug = makeSlug(p10.name, p10._id);
    products.push(p10);

    const p11 = new Product({
      name: 'Nordic Floor Lamp with USB Charging',
      description: 'Adjustable arc floor lamp with linen shade and 3 brightness levels. Built-in USB-A and USB-C ports. 360° rotatable head. Energy-efficient LED bulb included.',
      shortDescription: '3 Brightness | USB Charging | LED | 360° Rotatable',
      category: home._id, subCategory: furniture._id, seller: seller1._id, brand: 'LumiHome',
      images: [{ url: IMAGES.lamp, publicId: '', alt: 'Nordic Floor Lamp', isPrimary: true }],
      variants: [
        { sku: 'LH-LAMP-WHT', color: 'White Linen', colorHex: '#F5F5F5', price: 4499, mrp: 6999, stock: 60 },
        { sku: 'LH-LAMP-BLK', color: 'Black Metal', colorHex: '#1a1a1a', price: 4499, mrp: 6999, stock: 45 },
      ],
      ratingsAverage: 4.3, ratingsCount: 234, discountPercent: 35,
      tags: ['lamp', 'lighting', 'nordic', 'home decor'],
    });
    p11.slug = makeSlug(p11.name, p11._id);
    products.push(p11);

    // HOME & KITCHEN — Kitchen
    const p12 = new Product({
      name: 'ProChef 5-Layer Non-Stick Cookware Set (12 Piece)',
      description: 'Professional-grade non-stick cookware with 5-layer coating. Induction compatible, oven safe to 260°C, and dishwasher safe. Includes pots, pans, lids, and utensils.',
      shortDescription: '5-Layer Non-Stick | Induction | Oven Safe 260°C | 12pc Set',
      category: home._id, subCategory: kitchen._id, seller: seller1._id, brand: 'ProChef',
      images: [{ url: IMAGES.cookware, publicId: '', alt: 'ProChef Cookware Set', isPrimary: true }],
      variants: [
        { sku: 'PC-CW-12-BLK', color: 'Midnight Black', colorHex: '#1a1a1a', price: 7999, mrp: 12999, stock: 30 },
        { sku: 'PC-CW-12-RED', color: 'Cherry Red',     colorHex: '#DC143C', price: 7999, mrp: 12999, stock: 20 },
      ],
      highlights: ['5-layer Swiss non-stick coating', 'Works on all cooktops including induction', 'Oven safe up to 260°C', '10-year non-stick warranty', 'Includes lid lifter & spatula'],
      ratingsAverage: 4.7, ratingsCount: 567, discountPercent: 38, isBestSeller: true,
      tags: ['cookware', 'non-stick', 'kitchen', 'prochef'],
    });
    p12.slug = makeSlug(p12.name, p12._id);
    products.push(p12);

    const p13 = new Product({
      name: 'BambooLux King Size Bed with Storage',
      description: 'Solid bamboo wood king size bed with hydraulic storage mechanism. Holds up to 300kg. Modern slat design, no box spring needed.',
      shortDescription: 'Solid Bamboo | Hydraulic Storage | King Size | 300kg Capacity',
      category: home._id, subCategory: furniture._id, seller: seller1._id, brand: 'BambooLux',
      images: [{ url: IMAGES.bed, publicId: '', alt: 'BambooLux King Bed', isPrimary: true }],
      variants: [
        { sku: 'BL-BED-KING-NAT', color: 'Natural Bamboo', colorHex: '#DEB887', price: 34999, mrp: 49999, stock: 10 },
        { sku: 'BL-BED-KING-DAR', color: 'Dark Walnut',    colorHex: '#5C3317', price: 36999, mrp: 52999, stock: 8 },
      ],
      ratingsAverage: 4.5, ratingsCount: 45, discountPercent: 30, isFeatured: false,
      tags: ['bed', 'furniture', 'bedroom', 'storage', 'bamboo'],
    });
    p13.slug = makeSlug(p13.name, p13._id);
    products.push(p13);

    // BOOKS
    const p14 = new Product({
      name: 'Atomic Habits — Paperback',
      description: 'The #1 New York Times bestseller. An Easy & Proven Way to Build Good Habits & Break Bad Ones by James Clear. Transform your life through tiny changes in behaviour.',
      shortDescription: 'James Clear | 320 pages | Paperback | English',
      category: books._id, subCategory: fiction._id, seller: seller2._id, brand: 'Penguin',
      images: [{ url: IMAGES.book1, publicId: '', alt: 'Atomic Habits Book', isPrimary: true }],
      variants: [
        { sku: 'BK-ATOMIC-PB', price: 449, mrp: 699, stock: 500 },
      ],
      highlights: ['#1 International Bestseller', '5+ million copies sold', 'James Clear', 'Language: English', 'Pages: 320'],
      ratingsAverage: 4.8, ratingsCount: 12890, discountPercent: 35, isBestSeller: true, isFeatured: true,
      tags: ['books', 'self-help', 'habits', 'james clear', 'bestseller'],
    });
    p14.slug = makeSlug(p14.name, p14._id);
    products.push(p14);

    const p15 = new Product({
      name: 'The Psychology of Money — Paperback',
      description: 'Morgan Housel\'s masterpiece on how people think about money. 19 short stories exploring the strange ways people think about money and teaches you how to make better sense of one of life\'s most important topics.',
      shortDescription: 'Morgan Housel | 256 pages | Paperback | Finance & Investing',
      category: books._id, subCategory: fiction._id, seller: seller2._id, brand: 'Jaico',
      images: [{ url: IMAGES.book2, publicId: '', alt: 'Psychology of Money', isPrimary: true }],
      variants: [
        { sku: 'BK-PSYCHMONEY-PB', price: 299, mrp: 499, stock: 400 },
      ],
      ratingsAverage: 4.7, ratingsCount: 8934, discountPercent: 40, isBestSeller: true,
      tags: ['books', 'finance', 'money', 'morgan housel'],
    });
    p15.slug = makeSlug(p15.name, p15._id);
    products.push(p15);

    const p16 = new Product({
      name: 'Deep Work — Paperback',
      description: 'Rules for Focused Success in a Distracted World by Cal Newport. Learn the superpower of our times — the ability to focus intensely on cognitively demanding tasks.',
      shortDescription: 'Cal Newport | 304 pages | Productivity & Focus',
      category: books._id, subCategory: fiction._id, seller: seller2._id, brand: 'Piatkus',
      images: [{ url: IMAGES.books, publicId: '', alt: 'Deep Work', isPrimary: true }],
      variants: [{ sku: 'BK-DEEPWORK-PB', price: 349, mrp: 549, stock: 300 }],
      ratingsAverage: 4.6, ratingsCount: 4521, discountPercent: 36,
      tags: ['books', 'productivity', 'cal newport', 'focus'],
    });
    p16.slug = makeSlug(p16.name, p16._id);
    products.push(p16);

    const p17 = new Product({
      name: 'Samsung 55" 4K QLED Smart TV',
      description: 'Quantum Dot technology for brilliant colour with 100% colour volume. Neo QLED with Object Tracking Sound, Gaming Hub, and Smart Hub with 1500+ apps.',
      shortDescription: '55" 4K QLED | Neo QLED | 120Hz | Smart Hub | Gaming Mode',
      category: electronics._id, seller: seller1._id, brand: 'Samsung',
      images: [{ url: IMAGES.electronics, publicId: '', alt: 'Samsung QLED TV', isPrimary: true }],
      variants: [
        { sku: 'SS-TV-55-4K', price: 59999, mrp: 84999, stock: 20 },
      ],
      ratingsAverage: 4.5, ratingsCount: 234, discountPercent: 29, isFeatured: true, isNewArrival: true,
      tags: ['tv', 'samsung', 'qled', '4k', 'smart tv'],
    });
    p17.slug = makeSlug(p17.name, p17._id);
    products.push(p17);

    const p18 = new Product({
      name: 'NutriBullet Pro 900W Blender',
      description: 'Extract full nutrition from fruits, veggies, nuts, and seeds. 900W motor, BPA-free cups, stainless steel blades, dishwasher safe.',
      shortDescription: '900W | BPA-Free | 24oz Cup | Dishwasher Safe',
      category: home._id, subCategory: kitchen._id, seller: seller1._id, brand: 'NutriBullet',
      images: [{ url: IMAGES.cookware, publicId: '', alt: 'NutriBullet Blender', isPrimary: true }],
      variants: [
        { sku: 'NB-BLENDER-900-BLK', color: 'Black', colorHex: '#1a1a1a', price: 6499, mrp: 8999, stock: 50 },
        { sku: 'NB-BLENDER-900-SLV', color: 'Silver', colorHex: '#C0C0C0', price: 6499, mrp: 8999, stock: 40 },
      ],
      ratingsAverage: 4.4, ratingsCount: 789, discountPercent: 27, isBestSeller: true,
      tags: ['blender', 'kitchen', 'nutribullet', 'smoothie'],
    });
    p18.slug = makeSlug(p18.name, p18._id);
    products.push(p18);

    const p19 = new Product({
      name: 'Apple iPad Air 11" M2 (2024)',
      description: 'Supercharged by M2 chip. Ultra Retina display with 2360×1640 resolution, 12MP cameras, USB-C with USB 3 speeds, and all-day battery life.',
      shortDescription: 'M2 Chip | 11" Liquid Retina | 12MP | USB-C | All-day battery',
      category: electronics._id, seller: seller1._id, brand: 'Apple',
      images: [{ url: IMAGES.tablet, publicId: '', alt: 'iPad Air M2', isPrimary: true }],
      variants: [
        { sku: 'IPAD-AIR-11-64-BLU',  color: 'Blue',       colorHex: '#4169E1', storage: '128GB', price: 59900, mrp: 59900, stock: 30 },
        { sku: 'IPAD-AIR-11-256-BLU', color: 'Blue',       colorHex: '#4169E1', storage: '256GB', price: 72900, mrp: 72900, stock: 20 },
        { sku: 'IPAD-AIR-11-128-STL', color: 'Starlight',  colorHex: '#F5F5DC', storage: '128GB', price: 59900, mrp: 59900, stock: 25 },
      ],
      ratingsAverage: 4.8, ratingsCount: 1234, discountPercent: 0, isFeatured: true, isNewArrival: true,
      tags: ['ipad', 'apple', 'tablet', 'm2', 'ios'],
    });
    p19.slug = makeSlug(p19.name, p19._id);
    products.push(p19);

    const p20 = new Product({
      name: 'Classic Denim Jacket — Unisex',
      description: 'Timeless denim jacket in 100% cotton denim. Slightly oversized fit, button closure, two chest pockets, and side welt pockets. Washed for a vintage look.',
      shortDescription: '100% Cotton Denim | Oversized | Vintage Wash | Unisex',
      category: fashion._id, seller: seller2._id, brand: 'DenimCo',
      images: [{ url: IMAGES.tshirt, publicId: '', alt: 'Denim Jacket', isPrimary: true }],
      variants: [
        { sku: 'DC-DENIM-S-BLU',  size: 'S',  color: 'Classic Blue', colorHex: '#4169E1', price: 1999, mrp: 3499, stock: 60 },
        { sku: 'DC-DENIM-M-BLU',  size: 'M',  color: 'Classic Blue', colorHex: '#4169E1', price: 1999, mrp: 3499, stock: 80 },
        { sku: 'DC-DENIM-L-BLU',  size: 'L',  color: 'Classic Blue', colorHex: '#4169E1', price: 1999, mrp: 3499, stock: 70 },
        { sku: 'DC-DENIM-XL-BLU', size: 'XL', color: 'Classic Blue', colorHex: '#4169E1', price: 1999, mrp: 3499, stock: 40 },
        { sku: 'DC-DENIM-M-BLK',  size: 'M',  color: 'Black Denim',  colorHex: '#000000', price: 2199, mrp: 3499, stock: 50 },
      ],
      ratingsAverage: 4.2, ratingsCount: 678, discountPercent: 42, isNewArrival: true,
      tags: ['denim', 'jacket', 'unisex', 'fashion', 'casual'],
    });
    p20.slug = makeSlug(p20.name, p20._id);
    products.push(p20);

    // Save all products
    await Promise.all(products.map((p) => p.save()));
    console.log(`📦 Created ${products.length} products`);

    // ── Coupons ────────────────────────────────────────────────────────
    await Coupon.insertMany([
      {
        code: 'TROVE10',
        description: '10% off on your first order (max ₹500)',
        discountType: 'percent',
        discountValue: 10,
        maxDiscountAmount: 500,
        minOrderValue: 499,
        usagePerUser: 1,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id,
      },
      {
        code: 'FLAT200',
        description: 'Flat ₹200 off on orders above ₹1499',
        discountType: 'flat',
        discountValue: 200,
        minOrderValue: 1499,
        usageLimit: 1000,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id,
      },
      {
        code: 'TECH15',
        description: '15% off on Electronics (max ₹2000)',
        discountType: 'percent',
        discountValue: 15,
        maxDiscountAmount: 2000,
        minOrderValue: 9999,
        applicableCategories: [electronics._id],
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id,
      },
    ]);
    console.log('🎟️  Created coupons');

    // ── Banners ────────────────────────────────────────────────────────
    await Banner.insertMany([
      {
        title:    'The Big Billion Electronics Sale',
        subtitle: 'Up to 50% off on smartphones, laptops, and more',
        image:    { url: IMAGES.electronics },
        linkUrl:  '/category/electronics',
        linkText: 'Shop Electronics',
        position: 'hero',
        bgColor:  '#2A2A72',
        order:    1,
        createdBy: adminUser._id,
      },
      {
        title:    'Fashion Week — New Arrivals',
        subtitle: 'Trending styles from top brands',
        image:    { url: IMAGES.fashion },
        linkUrl:  '/category/fashion',
        linkText: 'Explore Fashion',
        position: 'hero',
        bgColor:  '#8B0000',
        order:    2,
        createdBy: adminUser._id,
      },
      {
        title:    'Home Makeover Sale',
        subtitle: 'Furniture & decor up to 40% off',
        image:    { url: IMAGES.home },
        linkUrl:  '/category/home-kitchen',
        linkText: 'Shop Home',
        position: 'hero',
        bgColor:  '#1B4332',
        order:    3,
        createdBy: adminUser._id,
      },
    ]);
    console.log('🖼️  Created banners');

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('Default credentials:');
    console.log('  Admin:  admin@trove.com   / Admin@123');
    console.log('  Seller: seller1@trove.com / Seller@123');
    console.log('  Seller: seller2@trove.com / Seller@123\n');

  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
