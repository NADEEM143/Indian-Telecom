// api/products.js - Production Cloud Key Scan Filter Engine
const { createClient } = require('@vercel/kv');

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        // Fetch all product keys cleanly from your active database pool
        const keys = await kv.keys('telecom_item:*');

        if (!keys || keys.length === 0) return res.status(200).json([]);

        // Pull all individual product data simultaneously
        const pipelineResult = await Promise.all(keys.map(key => kv.get(key)));
        
        // Sanitize the product object data structure
        const sanitizedProducts = pipelineResult.filter(Boolean).map(item => {
            return {
                id: item.id,
                title: item.title,
                tag: item.tag,
                // Ensure category strings are uniformly trimmed to match your tab identifiers perfectly
                category: String(item.category || '').trim(), 
                badge: item.badge,
                currentPrice: item.currentPrice,
                strikePrice: item.strikePrice,
                imageUrl: item.imageUrl
            };
        });

        // Sort items so your newest catalog updates show up first
        const sortedProducts = sanitizedProducts.sort((a, b) => {
            const idA = parseInt(a.id?.replace('prod_', '')) || 0;
            const idB = parseInt(b.id?.replace('prod_', '')) || 0;
            return idB - idA;
        });

        return res.status(200).json(sortedProducts);
    } catch (err) {
        return res.status(500).json([]);
    }
};
