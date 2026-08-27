// api/delete-product.js - Cloud Serverless Key-Based Removal Endpoint
const { createClient } = require('@vercel/kv');

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
    if (req.method !== 'DELETE') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ success: false, message: 'Missing product ID parameter.' });

        // 🌟 FIX: Directly targets and deletes the single individual product key in your cloud database
        await kv.del(`telecom_item:${id}`);
        
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
