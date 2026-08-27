// api/products.js - Production Key Scanning Engine
const { createClient } = require('@vercel/kv');

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        // Fetch all operational product database keys directly using clean cloud metrics
        const keys = await kv.keys('telecom_item:*');

        if (!keys || keys.length === 0) return res.status(200).json([]);

        // Pull all individual product data payloads together simultaneously
        const pipelineResult = await Promise.all(keys.map(key => kv.get(key)));
        
        // Sort items cleanly so your newest catalog updates show up first
        const sortedProducts = pipelineResult.filter(Boolean).sort((a, b) => {
            const idA = parseInt(a.id?.replace('prod_', '')) || 0;
            const idB = parseInt(b.id?.replace('prod_', '')) || 0;
            return idB - idA;
        });

        return res.status(200).json(sortedProducts);
    } catch (err) {
        return res.status(500).json([]);
    }
};
