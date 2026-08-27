// api/fulfill-order.js - Automated Stock Management and Order Fulfillment Controller
const { createClient } = require('@vercel/kv');

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const { orderId } = req.body;
        let currentOrders = await kv.get('telecom_orders_log');
        if (!currentOrders) return res.status(404).json({ success: false, message: 'No orders log data found.' });

        const targetOrder = currentOrders.find(o => o.orderId === orderId);
        if (!targetOrder) return res.status(404).json({ success: false, message: 'Order reference code mismatch.' });
        if (targetOrder.status === 'FULFILLED') return res.status(400).json({ success: false, message: 'This transaction is already processed.' });

        // 🌟 AUTOMATED COUNTDOWN ENGINE: Loop through items inside the order payload
        for (const item of targetOrder.items) {
            // Find product item key matching the unique catalog reference ID
            const itemKey = `telecom_item:${item.id}`;
            const targetProduct = await kv.get(itemKey);

            if (targetProduct) {
                // Calculate stock deduction
                let structuralNewStockCount = (parseInt(targetProduct.stockCount) || 0) - (parseInt(item.qty) || 1);
                if (structuralNewStockCount < 0) structuralNewStockCount = 0;

                targetProduct.stockCount = structuralNewStockCount;
                targetProduct.stockStatus = structuralNewStockCount > 0 ? 'INSTOCK' : 'OUTOFSTOCK';

                // Save revised countdown metric array values back onto the cloud nodes
                await kv.set(itemKey, targetProduct);
            }
        }

        // Advance current order ticket item parameters status to FULFILLED
        targetOrder.status = 'FULFILLED';
        await kv.set('telecom_orders_log', currentOrders);

        return res.status(200).json({ success: true, message: 'Order systematically processed and stock quantities updated!' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
