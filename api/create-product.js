// api/products.js - Dynamic Cloud Pattern Scanning Engine
const { createClient } = require('@vercel/kv');

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        // 🌟 FIX: Scan the cloud database for all keys starting with 'telecom_item:'
        let keys = [];
        let cursor = '0';
        
        do {
            const reply = await kv.scan(cursor, { match: 'telecom_item:*', count: 100 });
            cursor = reply[0];
            keys = keys.concat(reply[1]);
        } while (cursor !== '0');

        if (keys.length === 0) return res.status(200).json([]);

        // Pull all individual product payloads together simultaneously
        const pipelineResult = await Promise.all(keys.map(key => kv.get(key)));
        
        // Sort items so the newest uploaded accessories show up first
        const sortedProducts = pipelineResult.filter(Boolean).sort((a, b) => {
            return b.id.replace('prod_', '') - a.id.replace('prod_', '');
        });

        return res.status(200).json(sortedProducts);
    } catch (err) {
        return res.status(500).json([]);
    }
};
