// =========================================================================
// 🧩 PIECE 1 OF 8: DATABASE INITIALIZATION & GLOBAL CONFIG NODES
// =========================================================================
const { createClient } = require('@vercel/kv');

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Configure proper commonJS size limits for large base64 string buffers
module.exports.config = {
    api: {
        bodyParser: {
            sizeLimit: '4.5mb'
        }
    }
};
// =========================================================================
// 🧩 PIECE 2 OF 8: CORE SERVERLESS HANDLER & REQUEST ROUTING
// =========================================================================
module.exports = async (req, res) => {
    const { method, query, body } = req;

    try {
        // =========================================================================
        // 🧩 PIECE 3 OF 8: ENDPOINT ?action=loadData (UNIFIED API MATRIX)
        // =========================================================================
        if (method === 'GET' && query.action === 'loadData') {
            const keys = await kv.keys('telecom_item:*');
            let products = [];
            
            if (keys && keys.length > 0) {
                // High-speed atomic batch execution pipeline
                const pipeline = kv.pipeline();
                keys.forEach(key => pipeline.get(key));
                const pipelineResult = await pipeline.exec();
                products = pipelineResult.filter(Boolean);
            }
            
            const orders = (await kv.get('telecom_orders_log')) || [];
            return res.status(200).json({ success: true, products, orders });
        }
        // =========================================================================
        // 🧩 PIECE 4 OF 8: ENDPOINT ?action=create-product (PRODUCT SAVE/EDIT NODE)
        // =========================================================================
        if (method === 'POST' && query.action === 'create-product') {
            const { customEditId, title, tag, category, badge, currentPrice, strikePrice, stockCount, imageUrl } = body;
            
            // Safety: Preserves original ID if editing; creates unified item format if new
            const finalProductId = customEditId ? customEditId : 'item_' + Date.now();
            const targetKey = `telecom_item:${finalProductId}`;
            
            const stockInitial = parseInt(stockCount) || 0;

            const productPayload = {
                id: finalProductId,
                title,
                tag,
                category: String(category || '').trim(),
                badge: badge || null,
                currentPrice: parseInt(currentPrice) || 0,
                strikePrice: strikePrice ? parseInt(strikePrice) : null,
                imageUrl: imageUrl || "",
                imageAsset: imageUrl || "", // Backend schema alignment fallback
                stockCount: stockInitial,
                stockStatus: stockInitial > 0 ? 'INSTOCK' : 'OUTOFSTOCK',
                updatedAt: new Date().toISOString()
            };

            await kv.set(targetKey, productPayload);
            return res.status(200).json({ success: true, item: productPayload });
        }
        // =========================================================================
        // 🧩 PIECE 5 OF 8: ENDPOINTS ?action=delete-product & ?action=fulfill-order
        // =========================================================================
        if (method === 'DELETE' && query.action === 'delete-product') {
            const { id } = query;
            if (!id) return res.status(400).json({ success: false, message: 'Missing product identifier key.' });
            
            const targetKey = id.startsWith('telecom_item:') ? id : `telecom_item:${id}`;
            await kv.del(targetKey);
            return res.status(200).json({ success: true, message: 'Product record permanently purged.' });
        }

        if (method === 'POST' && query.action === 'fulfill-order') {
            const { orderId } = body;
            let currentOrders = await kv.get('telecom_orders_log');
            if (!currentOrders) return res.status(404).json({ success: false, message: 'No orders log data found.' });

            const targetOrder = currentOrders.find(o => o.orderId === orderId);
            if (!targetOrder) return res.status(404).json({ success: false, message: 'Order reference mismatch.' });
            if (targetOrder.status === 'FULFILLED') return res.status(400).json({ success: false, message: 'Transaction already completed.' });

            // Fetch product lookup maps to protect against blank or unmapped frontend IDs
            const allProductKeys = await kv.keys('telecom_item:*');
            let dynamicProductCache = [];
            if (allProductKeys && allProductKeys.length > 0) {
                const pipeline = kv.pipeline();
                allProductKeys.forEach(key => pipeline.get(key));
                dynamicProductCache = (await pipeline.exec()).filter(Boolean);
            }

            for (const item of targetOrder.items) {
                let targetProduct = null;
                let targetKey = null;

                if (item.id && item.id !== 'prod_unknown') {
                    targetKey = item.id.startsWith('telecom_item:') ? item.id : `telecom_item:${item.id}`;
                    targetProduct = await kv.get(targetKey);
                }

                // Fallback: If ID isn't found, track item matching by title string name
                if (!targetProduct && item.name) {
                    const matchedCacheItem = dynamicProductCache.find(p => p.title === item.name);
                    if (matchedCacheItem) {
                        targetProduct = matchedCacheItem;
                        targetKey = `telecom_item:${matchedCacheItem.id}`;
                    }
                }

                if (targetProduct && targetKey) {
                    let newStock = (parseInt(targetProduct.stockCount) || 0) - (parseInt(item.qty) || 1);
                    targetProduct.stockCount = newStock < 0 ? 0 : newStock;
                    targetProduct.stockStatus = targetProduct.stockCount > 0 ? 'INSTOCK' : 'OUTOFSTOCK';
                    await kv.set(targetKey, targetProduct);
                }
            }

            targetOrder.status = 'FULFILLED';
            await kv.set('telecom_orders_log', currentOrders);
            return res.status(200).json({ success: true, message: 'Order systems marked FULFILLED and stock structural balances updated!' });
        }
        // =========================================================================
        // 🧩 PIECE 6 OF 8: ENDPOINTS ?action=place-order & ?action=public-products
        // =========================================================================
        if (method === 'POST' && query.action === 'place-order') {
            const { name, mobile, address, mode, total, totalBill, items } = body;
            let currentOrders = (await kv.get('telecom_orders_log')) || [];

            const newOrderRecord = {
                orderId: 'ORD_' + Date.now(),
                customerName: String(name || '').trim(),
                customerMobile: String(mobile || '').trim(),
                customerAddress: String(address || 'Store Pickup Node').trim(),
                paymentMode: String(mode || 'COD').toUpperCase(),
                items: items || [],
                totalBill: Number(total || totalBill || 0),
                orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                status: 'PENDING'
            };

            currentOrders.unshift(newOrderRecord);
            await kv.set('telecom_orders_log', currentOrders);
            return res.status(200).json({ success: true, orderId: newOrderRecord.orderId });
        }

        if (method === 'GET' && query.action === 'public-products') {
            const keys = await kv.keys('telecom_item:*');
            let sortedProducts = [];
            
            if (keys && keys.length > 0) {
                const pipeline = kv.pipeline();
                keys.forEach(key => pipeline.get(key));
                const resList = await pipeline.exec();
                
                const cleanList = resList.filter(Boolean).map(item => ({
                    id: item.id,
                    title: item.title,
                    tag: item.tag,
                    category: String(item.category || '').trim(),
                    badge: item.badge,
                    currentPrice: item.currentPrice,
                    strikePrice: item.strikePrice,
                    imageUrl: item.imageUrl || item.imageAsset || ''
                }));
                
                sortedProducts = cleanList.sort((a, b) => parseInt(b.id?.split('_')[1] || 0) - parseInt(a.id?.split('_')[1] || 0));
            }
            return res.status(200).json(sortedProducts);
        }
        // =========================================================================
        // 🧩 PIECE 7 OF 8: CORE UI DOCUMENT SURFACE PRESENTATION SHELL
        // =========================================================================
        if (method === 'GET') {
            res.setHeader('Content-Type', 'text/html');
            return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Indian Telecom - Master Control Desk</title>
    <link rel="stylesheet" href="https://cloudflare.com">
    <style>
        :root { --dark: #090d16; --border: #cbd5e1; --danger: #ef4444; --primary: #2563eb; }
        body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; padding: 40px 20px; margin: 0; color: var(--dark); }
        .master-layout { max-width: 1450px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 40px; }
        @media (min-width: 1150px) { .master-layout { grid-template-columns: 420px 1fr; } }
        .control-panel { background: white; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; height: max-content; }
        .form-group { margin-bottom: 18px; }
        label { display: block; font-weight: 700; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: #475569; letter-spacing: 0.5px; }
        .input-box { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px; box-sizing: border-box; font-size: 14px; }
        .dropzone-box { border: 2px dashed #94a3b8; border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; background: #f8fafc; }
        .preview-thumbnail { max-width: 100%; max-height: 100px; object-fit: contain; margin-top: 12px; display: none; border-radius: 6px; margin-left: auto; margin-right: auto; }
        .submit-trigger { background: var(--dark); color: white; width: 100%; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; width:100%; }
        .table-card { background: white; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; overflow-x: auto; margin-bottom: 32px; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 850px; }
        th { text-align: left; padding: 12px; background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #e2e8f0; }
        td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .export-btn { background: #065f46; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; text-transform: uppercase; }
    </style>
</head>
<body>
<div style="max-width:1450px; margin:0 auto 28px auto; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
    <div>
        <h1 style="margin:0; font-size:26px; font-weight:900;">Master System Control Terminal</h1>
        <p style="margin:4px 0 0 0; color:#64748b; font-size:14px;">Operational Enterprise Matrix for Indian Telecom Hub</p>
    </div>
    <div style="display:flex; gap:12px;">
        <button onclick="downloadInventoryCSV()" class="export-btn"><i class="fas fa-file-excel"></i> Download Products CSV</button>
        <button onclick="downloadOrdersCSV()" class="export-btn" style="background:#1e3a8a;"><i class="fas fa-download"></i> Download Orders CSV</button>
    </div>
</div>
<div class="master-layout">
    <div class="control-panel">
        <h3 id="panel-title" style="margin-top:0; text-transform:uppercase; font-size:13px; color:var(--primary); letter-spacing:0.5px;">Inject Dynamic Inventory</h3>
        <form id="itemDeployForm">
            <input type="hidden" id="edit-id" value="">
            <div class="form-group">
                <label>Product Display Title</label>
                <input type="text" id="title" class="input-box" required>
            </div>
            <div class="form-group">
                <label>Mini Content Tag</label>
                <input type="text" id="tag" class="input-box" required>
            </div>
            <div class="form-group">
                <label>Active Display Target Tab</label>
                <select id="category" class="input-box" required>
                    <option value="trending">Trending Module Grid</option>
                    <option value="headphone">Headphones Target Grid</option>
                    <option value="charger">Chargers Target Grid</option>
                    <option value="repair">Repairing & Spares Target Grid</option>
                </select>
            </div>
            <div class="form-group">
                <label>Promo Ribbon Text</label>
                <input type="text" id="badge" class="input-box">
            </div>
            <div style="display:flex; gap:16px;">
                <div class="form-group" style="flex:1;">
                    <label>Selling Price (₹)</label>
                    <input type="number" id="currentPrice" class="input-box" required>
                </div>
                <div class="form-group" style="flex:1;">
                    <label>Strike Price (₹)</label>
                    <input type="number" id="strikePrice" class="input-box">
                </div>
            </div>
            <div class="form-group">
                <label>Initial Available Stock Quantity</label>
                <input type="number" id="stockCount" class="input-box" value="50" min="0" required>
            </div>
            <div class="form-group">
                <label>Product Image Asset</label>
                <div class="dropzone-box" onclick="document.getElementById('fileInp').click()">
                    <i class="fas fa-images" style="font-size:24px; color:#64748b; margin-bottom:6px;"></i>
                    <p id="upload-prompt" style="margin:0; font-size:12px; color:#64748b;">Click to upload product image file</p>
                    <input type="file" id="fileInp" style="display:none;" accept="image/*">
                    <img id="imagePreview" class="preview-thumbnail">
                </div>
            </div>
            <button type="submit" id="submit-btn" class="submit-trigger"><i class="fas fa-plus"></i> Synchronize Item</button>
            <button type="button" id="cancel-edit-btn" onclick="resetFormState()" style="display:none; width:100%; margin-top:8px; padding:12px; background:#64748b; color:white; border:none; border-radius:12px; font-weight:700; cursor:pointer; text-transform:uppercase; font-size:13px;">Cancel Edit</button>
        </form>
    </div>

    <div style="display:flex; flex-direction:column; width:100%; min-width:0;">
        <div class="table-card">
            <h3 style="margin-top:0; text-transform:uppercase; font-size:13px; color:#475569; letter-spacing:0.5px;">Live Catalog Inventory Array</h3>
            <table>
                <thead>
                    <tr><th>Asset</th><th>Product Context</th><th>Target Tab</th><th>Price Vector</th><th>Stock Matrix</th><th style="text-align:center;">Action Options</th></tr>
                </thead>
                <tbody id="products-table-body">
                    <tr><td colspan="6" style="text-align:center; padding:30px; color:#64748b;">Loading active data streams...</td></tr>
                </tbody>
            </table>
        </div>
        <div class="table-card">
            <h3 style="margin-top:0; text-transform:uppercase; font-size:13px; color:#1e3a8a; letter-spacing:0.5px;">Live Sales Verification Order Book</h3>
            <table>
                <thead>
                    <tr><th>Order Code</th><th>Customer Shipping Particulars</th><th>Items Staged</th><th>Total Payable</th><th>Status</th><th style="text-align:center;">Fulfillment Switch</th></tr>
                </thead>
                <tbody id="orders-table-body">
                    <tr><td colspan="6" style="text-align:center; padding:30px; color:#64748b;">Loading active data streams...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
`);
        }
        // =========================================================================
        // 🧩 PIECE 8a OF 8: FRONTEND TABLE LAYOUT RENDERERS & IMAGE CANVAS
        // =========================================================================
        if (method === 'GET') {
            return res.status(200).send(`
<script>
    let localProductCacheMemory = [];
    let base64ImagePayload = "";

    // Safely evaluate target workspace endpoints matching execution nodes
    const TARGET_GATEWAY_URL = window.location.origin + window.location.pathname;

    // Secure persistent storage for administration checks
    let adminPassphraseToken = localStorage.getItem('telecom_admin_token') || "";
    if (!adminPassphraseToken) {
        adminPassphraseToken = prompt("Enter Master Gateway Administration Handshake Token Key:") || "";
        if (adminPassphraseToken) {
            localStorage.setItem('telecom_admin_token', adminPassphraseToken);
        }
    }

    // Dynamic initial page configuration loop load check
    window.addEventListener('DOMContentLoaded', loadDashboardData);

    async function loadDashboardData() {
        try {
            const queryParams = new URLSearchParams({ action: 'loadData' });
            // FIXED: Passed token to GET requests to ensure structural logging clearance
            const response = await fetch(`${TARGET_GATEWAY_URL}?${queryParams.toString()}`, {
                headers: { 'X-Admin-Token': adminPassphraseToken }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    alert("Handshake authorization failed. Clearing bad key token mapping.");
                    localStorage.removeItem('telecom_admin_token');
                }
                throw new Error(`HTTP network error node status: ${response.status}`);
            }

            const data = await response.json();
            if(data.success) {
                localProductCacheMemory = data.products || [];
                renderProductsTable(localProductCacheMemory);
                renderOrdersTable(data.orders || []);
            } else {
                console.error("Endpoint data transmission rejected: ", data.message);
            }
        } catch(e) {
            console.error("Data tracking pipeline broken:", e);
            document.getElementById('products-table-body').innerHTML = 
                `<tr><td colspan="6" style="text-align:center; padding:30px; color:#ef4444; font-weight:700;"><i class="fas fa-exclamation-triangle"></i> Data Sync Broken: ${e.message}</td></tr>`;
        }
    }
    function renderProductsTable(products) {
        const tbody = document.getElementById('products-table-body');
        if(!tbody) return;
        
        if(!products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#64748b; font-weight:600;"><i class="fas fa-box-open" style="font-size:20px; display:block; margin-bottom:8px;"></i> No active item assets deployed yet.</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => {
            const count = parseInt(p.stockCount) || 0;
            const status = p.stockStatus || (count > 0 ? 'INSTOCK' : 'OUTOFSTOCK');
            const imgPath = p.imageUrl || p.imageAsset || '';
            
            return `<tr>
                <td><img src="${imgPath}" style="width:44px; height:44px; object-fit:contain; border-radius:6px; border:1px solid #e2e8f0; background:#fafafa;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://w3.org width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23cbd5e1%22 stroke-width=%222%22><rect x=%223%22 y=%223%22 width=%2218%22 height=%2218%22 rx=%222%22/><circle cx=%228.5%22 cy=%228.5%22 r=%221.5%22/><path d=%22M21 15l-5-5L5 21%22/></svg>'"></td>
                <td><strong style="display:block; color:var(--dark);">${p.title || 'Untitled item'}</strong><span style="font-size:11px; color:#64748b;">${p.tag || 'No descriptive tag'}</span></td>
                <td><span style="background:#e2e8f0; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:700; text-transform:uppercase; color:#475569;">${p.category || 'general'}</span></td>
                <td><strong style="color:var(--primary);">₹${(p.currentPrice || 0).toLocaleString('en-IN')}</strong></td>
                <td><span style="font-weight:800; color:${count > 0 ? '#10b981' : '#ef4444'}; background:${count > 0 ? '#ecfdf5' : '#fef2f2'}; padding:4px 8px; border-radius:8px; font-size:11px;">${count} Pcs (${status})</span></td>
                <td>
                    <div style="display:flex; gap:6px; justify-content:center;">
                        <button type="button" onclick="triggerLocalEdit('${p.id}')" style="background:#2563eb; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:700; font-size:12px;"><i class="fas fa-edit"></i> Edit</button>
                        <button type="button" onclick="purgeItem('${p.id}')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:700; font-size:12px;"><i class="fas fa-trash-alt"></i> Del</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    function renderOrdersTable(orders) {
        const tbody = document.getElementById('orders-table-body');
        if(!tbody) return;
        
        if(!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#64748b; font-weight:600;"><i class="fas fa-receipt" style="font-size:20px; display:block; margin-bottom:8px;"></i> No sales orders recorded yet.</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(o => {
            const itemsStr = Array.isArray(o.items) ? o.items.map(i => i.name + ' (x' + i.qty + ')').join(', ') : 'Empty manifest info';
            const isFulfilled = o.status === 'FULFILLED';
            return `<tr style="background: ${isFulfilled ? '#f8fafc' : '#ffffff'};">
                <td><strong style="color:#2563eb; font-size:12px;">${o.orderId || 'N/A'}</strong><br><span style="font-size:11px; color:#64748b;">${o.orderDate || ''}</span></td>
                <td><strong style="display:block; color:var(--dark);">${o.customerName || 'Unknown customer'}</strong><span style="font-size:12px; color:#475569;"><i class="fas fa-phone"></i> ${o.customerMobile || 'N/A'}</span><br><span style="font-size:11px; color:#64748b;"><i class="fas fa-map-marker-alt"></i> ${o.customerAddress || 'N/A'}</span></td>
                <td style="font-size:13px; color:#334155; font-weight:500;">${itemsStr}</td>
                <td><strong style="color:#10b981; font-size:15px;">₹${(o.totalBill || 0).toLocaleString('en-IN')}</strong><br><span style="font-size:10px; font-weight:700; color:#64748b; background:#f1f5f9; padding:2px 4px; border-radius:4px;">${o.paymentMode || 'COD'}</span></td>
                <td><span style="font-weight:800; font-size:11px; padding:4px 8px; border-radius:12px; text-transform:uppercase; background:${isFulfilled ? '#d1fae5' : '#fef3c7'}; color:${isFulfilled ? '#065f46' : '#92400e'};">${o.status || 'PENDING'}</span></td>
                <td style="text-align:center;">${isFulfilled ? '<span style="color:#10b981; font-weight:700; font-size:12px;"><i class="fas fa-check-circle"></i> Completed</span>' : `<button type="button" onclick="processFulfillment('${o.orderId}')" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:800; font-size:12px;"><i class="fas fa-shipping-fast"></i> Fulfill</button>`}</td>
            </tr>`;
        }).join('');
    }
    // Downsample and process large multi-megabyte canvas buffers securely
    document.getElementById('fileInp').onchange = function() {
        const [file] = this.files;
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.src = e.target.result;
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let width = img.width; let height = img.height;
                    if (width > 800) { height *= 800 / width; width = 800; }
                    canvas.width = width; canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    base64ImagePayload = canvas.toDataURL('image/jpeg', 0.6);
                    
                    const pv = document.getElementById('imagePreview');
                    pv.src = base64ImagePayload; pv.style.display = 'block';
                    document.getElementById('upload-prompt').innerText = "Image Loaded Successfully!";
                };
            };
            reader.readAsDataURL(file);
        }
    };

    function resetFormState() {
        document.getElementById('itemDeployForm').reset();
        document.getElementById('edit-id').value = "";
        base64ImagePayload = "";
        document.getElementById('imagePreview').style.display = "none";
        document.getElementById('upload-prompt').innerText = "Click to upload product image file";
        document.getElementById('panel-title').innerText = "Inject Dynamic Inventory";
        document.getElementById('submit-btn').innerHTML = "<i class='fas fa-plus'></i> Synchronize Item";
        document.getElementById('cancel-edit-btn').style.display = "none";
    }

    document.getElementById('itemDeployForm').onsubmit = async function(e) {
        e.preventDefault();
        const editId = document.getElementById('edit-id').value;
        
        // Safety Fallback constraint check
        if(!base64ImagePayload && !editId) { 
            alert("A valid product image is mandatory for initial synchronization."); 
            return; 
        }
        
        const payload = {
            title: document.getElementById('title').value.trim(),
            tag: document.getElementById('tag').value.trim(),
            category: document.getElementById('category').value,
            badge: document.getElementById('badge').value.trim() || null,
            currentPrice: parseInt(document.getElementById('currentPrice').value) || 0,
            strikePrice: document.getElementById('strikePrice').value ? parseInt(document.getElementById('strikePrice').value) : null,
            stockCount: parseInt(document.getElementById('stockCount').value) || 0,
            imageUrl: base64ImagePayload
        };
        
        if(editId) payload.customEditId = editId;

        try {
            // FIXED: Embedded the verified master auth token variables safely in headers
            const res = await fetch(TARGET_GATEWAY_URL + '?action=create-product', { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Admin-Token': adminPassphraseToken
                }, 
                body: JSON.stringify(payload) 
            });
            const data = await res.json();
            if(data.success) { 
                alert('Cloud inventory sync successful!'); 
                resetFormState(); 
                await loadDashboardData(); 
            } else {
                alert("Operation declined by database: " + data.message);
            }
        } catch(err) {
            alert("Network data routing layer timed out.");
        }
    };
    function triggerLocalEdit(targetId) {
        const product = localProductCacheMemory.find(item => item.id === targetId);
        if(!product) return;

        document.getElementById('edit-id').value = product.id;
        document.getElementById('title').value = product.title || '';
        document.getElementById('tag').value = product.tag || '';
        document.getElementById('category').value = product.category || 'trending';
        document.getElementById('badge').value = product.badge || "";
        document.getElementById('currentPrice').value = product.currentPrice || '';
        document.getElementById('strikePrice').value = product.strikePrice || "";
        document.getElementById('stockCount').value = product.stockCount || 0;
        
        base64ImagePayload = product.imageUrl || product.imageAsset || "";
        const pv = document.getElementById('imagePreview');
        if(base64ImagePayload) {
            pv.src = base64ImagePayload; pv.style.display = 'block';
            document.getElementById('upload-prompt').innerText = "Image Asset Verified!";
        } else {
            pv.style.display = 'none';
        }
        
        document.getElementById('panel-title').innerText = "Modify Existing Product Matrix";
        document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Save System Changes';
        document.getElementById('cancel-edit-btn').style.display = "block";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function processFulfillment(orderId) {
        if(!confirm('Fulfill order transaction? Stock counts will automatically subtract.')) return;
        try {
            const res = await fetch(TARGET_GATEWAY_URL + '?action=fulfill-order', { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Admin-Token': adminPassphraseToken
                }, 
                body: JSON.stringify({ orderId: orderId }) 
            });
            const data = await res.json();
            if(data.success) { 
                alert("Transaction closed out successfully."); 
                await loadDashboardData(); 
            } else {
                alert("Fulfillment error: " + data.message);
            }
        } catch(e) {
            alert("Failed to compile order fulfillment endpoint block.");
        }
    }

    async function purgeItem(id) {
        if(!confirm('Permanently delete this product record from the datastore cluster?')) return;
        try {
            const queryParams = new URLSearchParams({ action: 'delete-product', id: id });
            const res = await fetch(`${TARGET_GATEWAY_URL}?${queryParams.toString()}`, { 
                method: 'DELETE',
                headers: { 'X-Admin-Token': adminPassphraseToken }
            });
            const data = await res.json();
            if(data.success) { 
                await loadDashboardData(); 
            } else {
                alert("Deletion rejected: " + data.message);
            }
        } catch(e) {
            alert("Database connection node unreachable.");
        }
    }

    // CSV report formatting layers cleaned from break characters 
    function downloadInventoryCSV() {
        if(localProductCacheMemory.length === 0) return alert("Inventory log cache memory is currently empty.");
        let csv = "ID,Title,Category,Price,Stock\r\n";
        localProductCacheMemory.forEach(p => {
            const safetyTitle = (p.title || '').replace(/,/g, ' ');
            csv += `${p.id},${safetyTitle},${p.category || 'general'},${p.currentPrice || 0},${p.stockCount || 0}\r\n`;
        });
        triggerDownload(csv, `Products_Ledger_Dump_${Date.now()}.csv`);
    }

    function downloadOrdersCSV() {
        let csv = "OrderID,Total Bill,Status\r\n";
        const rows = document.querySelectorAll("#orders-table-body tr");
        if(rows.length === 0 || rows.innerText.includes("No customer")) return alert("No order history logs found to translate.");
        
        rows.forEach(row => {
            const orderIdNode = row.querySelector("td strong");
            const billNode = row.querySelector("td:nth-child(4) strong");
            const statusNode = row.querySelector("td:nth-child(5) span");
            
            if(orderIdNode && billNode && statusNode) {
                csv += `${orderIdNode.innerText.trim()},${billNode.innerText.replace(/[₹,]/g, '').trim()},${statusNode.innerText.trim()}\r\n`;
            }
        });
        triggerDownload(csv, `Orders_Report_Dump_${Date.now()}.csv`);
    }

    function triggerDownload(content, file) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", file);
        document.body.appendChild(link); 
        link.click(); 
        document.body.removeChild(link);
    }
</script>
</body>
</html>
