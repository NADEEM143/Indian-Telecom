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
            title: req.body.title,
            tag: req.body.tag,
            category: req.body.category,
            badge: req.body.badge,
            currentPrice: req.body.currentPrice,
            strikePrice: req.body.strikePrice,
            imageUrl: req.body.imageUrl // Holds the Base64 image payload string safely
        };

        products.unshift(newProduct);
        fs.writeFileSync(DB_PATH, JSON.stringify(products, null, 2));

        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// CRITICAL CONFIGURATION: Extends serverless processing limits to receive text image payloads safely
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4.5mb' // Vercel's absolute serverless function limit ceiling
        }
    }
};
