// api/create-product.js - Production Sync, Edit Overrider, and Stock Initializer Endpoint
const { createClient } = require('@vercel/kv');

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const isEditing = req.body.customEditId ? true : false;
        
        // 🌟 FIX: If editing, keep the exact same original ID instead of generating a new timestamp
        const finalProductId = isEditing ? req.body.customEditId : 'prod_' + Date.now();
        
        const stockInitial = parseInt(req.body.stockCount) || 0;

        const productPayload = {
            id: finalProductId,
            title: req.body.title,
            tag: req.body.tag,
            category: req.body.category,
            badge: req.body.badge || null,
            currentPrice: parseInt(req.body.currentPrice),
            strikePrice: req.body.strikePrice ? parseInt(req.body.strikePrice) : null,
            imageUrl: req.body.imageUrl,
            // 🌟 NEW: Inventory Control parameters
            stockCount: stockInitial,
            stockStatus: stockInitial > 0 ? 'INSTOCK' : 'OUTOFSTOCK'
        };

        // Writes or cleanly overwrites the matching cloud key, eliminating duplication
        await kv.set(`telecom_item:${finalProductId}`, productPayload);

        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };
