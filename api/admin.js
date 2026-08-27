// api/admin.js - Pure Data Router API Node (100% Crash Proof)
const { createClient } = require('@vercel/kv');

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
    try {
        const keys = await kv.keys('telecom_item:*');
        let products = [];
        if (keys && keys.length > 0) {
            const pipelineResult = await Promise.all(keys.map(key => kv.get(key)));
            products = pipelineResult.filter(Boolean);
        }
        const orders = (await kv.get('telecom_orders_log')) || [];
        
        // Directly returns a pure JSON object stream back to the dashboard layout page
        return res.status(200).json({ success: true, products, orders });
    } catch (err) {
        return res.status(500).json({ success: false, products: [], orders: [] });
    }
};
