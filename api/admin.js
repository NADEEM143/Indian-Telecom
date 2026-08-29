import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Enable CORS boundaries seamlessly for testing across all interface views
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const dataType = url.searchParams.get('type');

        if (!dataType) {
            return res.status(400).json({ error: "Query type selection parameter mapping is missing." });
        }

        // =========================================================================
        // 🚀 UNIFIED FULL-STACK DATABASE DATATYPE ROUTER CHANNELS
        // =========================================================================
        switch (dataType) {
            
            case 'products':
                if (req.method === 'GET') {
                    const products = await kv.get('it_products') || [];
                    return res.status(200).json(products);
                }
                if (req.method === 'POST') {
                    await kv.set('it_products', req.body);
                    return res.status(200).json({ success: true });
                }
                break;

            case 'orders':
                if (req.method === 'GET') {
                    const orders = await kv.get('it_orders') || [];
                    return res.status(200).json(orders);
                }
                if (req.method === 'POST') {
                    await kv.set('it_orders', req.body);
                    return res.status(200).json({ success: true });
                }
                break;

            case 'users':
                if (req.method === 'GET') {
                    const users = await kv.get('it_users') || [];
                    return res.status(200).json(users);
                }
                if (req.method === 'POST') {
                    await kv.set('it_users', req.body);
                    return res.status(200).json({ success: true });
                }
                break;

            case 'history':
                if (req.method === 'GET') {
                    const history = await kv.get('it_order_history') || [];
                    return res.status(200).json(history);
                }
                if (req.method === 'POST') {
                    await kv.set('it_order_history', req.body);
                    return res.status(200).json({ success: true });
                }
                break;

            case 'banner_msg':
                if (req.method === 'GET') {
                    const bannerData = await kv.get('it_live_banner_msg') || { message: "MEGA OFFER: FLAT 30% OFF ON PREMIUM CHARGERS & COVERS! LIMITED STOCK!" };
                    return res.status(200).json(bannerData);
                }
                if (req.method === 'POST') {
                    await kv.set('it_live_banner_msg', req.body);
                    return res.status(200).json({ success: true });
                }
                break;

            default:
                return res.status(400).json({ error: `Invalid datatype target mapping '${dataType}' specified.` });
        }

    } catch (error) {
        return res.status(500).json({ error: "Vercel KV Cloud Server Framework Exception", details: error.message });
    }
}
