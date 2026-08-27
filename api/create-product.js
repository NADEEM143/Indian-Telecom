// api/create-product.js - Cloud Serverless Database Sync Endpoint
const { createClient } = require('@vercel/kv');

// Automatically connects with your live Upstash Redis database
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        // Fetch existing inventory list array directly from your active cloud storage pool
        let products = await kv.get('telecom_inventory_store');
        if (!products) products = [];

        const newProduct = {
            id: 'prod_' + Date.now(),
            title: req.body.title,
            tag: req.body.tag,
            category: req.body.category,
            badge: req.body.badge,
            currentPrice: req.body.currentPrice,
            strikePrice: req.body.strikePrice,
            imageUrl: req.body.imageUrl // High quality compressed image text string
        };

        products.unshift(newProduct);
        
        // Push the updated product listing array block back up live to the cloud
        await kv.set('telecom_inventory_store', products);

        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };
