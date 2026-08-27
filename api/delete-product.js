// api/delete-product.js - Serverless Removal Endpoint Engine
const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(process.cwd(), 'data', 'products.json');

module.exports = async (req, res) => {
    if (req.method !== 'DELETE') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const { id } = req.query;
        if (!fs.existsSync(DB_PATH)) return res.status(404).json({ message: 'No Database Array Found' });

        let products = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        products = products.filter(p => p.id !== id);
        
        fs.writeFileSync(DB_PATH, JSON.stringify(products, null, 2));
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
