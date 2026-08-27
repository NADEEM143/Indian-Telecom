// api/place-order.js - Serverless Live Order Log Receiver Endpoint
const { createClient } = require('@vercel/kv');

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        let currentOrders = await kv.get('telecom_orders_log');
        if (!currentOrders) currentOrders = [];

        const newOrderRecord = {
            orderId: 'ORD_' + Date.now(),
            customerName: req.body.name,
            customerMobile: req.body.mobile,
            customerAddress: req.body.address,
            paymentMode: req.body.mode,
            items: req.body.items, // Array containing ordered names, raw item IDs, and counts
            totalBill: req.body.total,
            orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            status: 'PENDING' // Default operational status state
        };

        currentOrders.unshift(newOrderRecord);
        await kv.set('telecom_orders_log', currentOrders);

        return res.status(200).json({ success: true, orderId: newOrderRecord.orderId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
