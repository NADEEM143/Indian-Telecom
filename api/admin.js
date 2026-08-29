import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Standard CORS configuration protocols
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const dataType = searchParams.get('type'); // Reads 'products' or 'orders'

    try {
        // ==========================================
        // 📦 PRODUCT INVENTORY ENDPOINTS
        // ==========================================
               if (dataType === 'products') {
            if (req.method === 'GET') {
                const products = await kv.get('it_products') || [];
                return res.status(200).json(products);
            }
            if (req.method === 'POST') {
                await kv.set('it_products', req.body);
                return res.status(200).json({ success: true });
            }
        }

        // ==========================================
        // 📥 CUSTOMER ORDER ENDPOINTS
        // ==========================================
               if (dataType === 'orders') {
            if (req.method === 'GET') {
                const orders = await kv.get('it_orders') || [];
                return res.status(200).json(orders);
            }
            if (req.method === 'POST') {
                await kv.set('it_orders', req.body);
                return res.status(200).json({ success: true });
            }
        }

        // ==========================================
        // 👥 NPCI COMPLIANT REGISTERED CUSTOMERS ENDPOINT
        // ==========================================
        if (dataType === 'users') {
            if (req.method === 'GET') {
                const users = await kv.get('it_users') || [];
                return res.status(200).json(users);
            }
            if (req.method === 'POST') {
                await kv.set('it_users', req.body);
                return res.status(200).json({ success: true });
            }
        }

        // ==========================================
        // 📦 PERMANENT SHIPPED ORDER HISTORY ENDPOINTS
        // ==========================================
        if (dataType === 'history') {
            if (req.method === 'GET') {
                const history = await kv.get('it_order_history') || [];
                return res.status(200).json(history);
            }
            if (req.method === 'POST') {
                await kv.set('it_order_history', req.body);
                return res.status(200).json({ success: true });
            }
        }

        return res.status(400).json({ error: "Invalid parameters map selection specified." });

    } catch (error) {
        return res.status(500).json({ error: "Vercel KV Server Error", details: error.message });
    }
}
