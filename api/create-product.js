// api/create-product.js - High-Performance Individual Key Cloud Endpoint
const { createClient } = require('@vercel/kv');

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const productId = 'prod_' + Date.now();
        const newProduct = {
            id: productId,
            title: req.body.title,
            tag: req.body.tag,
            category: req.body.category,
            badge: req.body.badge,
            currentPrice: req.body.currentPrice,
            strikePrice: req.body.strikePrice,
            imageUrl: req.body.imageUrl // Direct separate string payload execution
        };

        // 🌟 FIX: Save this specific product as its own lightweight dataset key string
        await kv.set(`telecom_item:${productId}`, newProduct);

        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };
