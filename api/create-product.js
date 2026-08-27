// api/create-product.js - Serverless Form Data Sync Endpoint
const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(process.cwd(), 'data', 'products.json');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
        
        let products = [];
        if (fs.existsSync(DB_PATH)) products = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

        const newProduct = {
            id: 'prod_' + Date.now(),
            ...req.body
        };

        products.unshift(newProduct);
        fs.writeFileSync(DB_PATH, JSON.stringify(products, null, 2));

        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
