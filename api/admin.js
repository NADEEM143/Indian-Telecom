// api/admin.js
// 🌟 PRODUCTION FIXED IMPORT: Auto-resolves package constructor issues under Vercel runtimes
const UpstashPackage = require('@upstash/redis');
const Redis = UpstashPackage.Redis || UpstashPackage.default?.Redis;

if (!Redis) {
    throw new Error("Critical System Error: Upstash Redis constructor mapping layer failed.");
}

// Initialize structural connection parameters straight to Upstash Redis REST Node
const upstash = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
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
    
    // Rest of your Piece 2 code continues exactly the same way here...

    try {
        // =========================================================================
        // 🧩 PIECE 3 OF 8: ENDPOINT ?action=loadData (UNIFIED API MATRIX)
        // =========================================================================
        if (method === 'GET' && query.action === 'loadData') {
            const keys = await upstash.keys('telecom_item:*');
            let products = [];
            
            if (keys && keys.length > 0) {
                // High-speed atomic batch execution pipeline
                const pipeline = upstash.pipeline();
                keys.forEach(key => pipeline.get(key));
                const pipelineResult = await pipeline.exec();
                products = pipelineResult.filter(Boolean);
            }
            
            const orders = (await upstash.get('telecom_orders_log')) || [];
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
                imageAsset: imageUrl || "", // Backend schema alignment fallback preserved intact
                stockCount: stockInitial,
                stockStatus: stockInitial > 0 ? 'INSTOCK' : 'OUTOFSTOCK',
                updatedAt: new Date().toISOString()
            };

            await upstash.set(targetKey, productPayload);
            return res.status(200).json({ success: true, item: productPayload });
        }
        // =========================================================================
        // 🧩 PIECE 5 OF 8: ENDPOINTS ?action=delete-product & ?action=fulfill-order
        // =========================================================================
        if (method === 'DELETE' && query.action === 'delete-product') {
            const { id } = query;
            if (!id) return res.status(400).json({ success: false, message: 'Missing product identifier key.' });
            
            const targetKey = id.startsWith('telecom_item:') ? id : `telecom_item:${id}`;
            await upstash.del(targetKey);
            return res.status(200).json({ success: true, message: 'Product record permanently purged.' });
        }

        if (method === 'POST' && query.action === 'fulfill-order') {
            const { orderId } = body;
            let currentOrders = await upstash.get('telecom_orders_log');
            if (!currentOrders) return res.status(404).json({ success: false, message: 'No orders log data found.' });

            const targetOrder = currentOrders.find(o => o.orderId === orderId);
            if (!targetOrder) return res.status(404).json({ success: false, message: 'Order reference mismatch.' });
            if (targetOrder.status === 'FULFILLED') return res.status(400).json({ success: false, message: 'Transaction already completed.' });

            // Fetch product lookup maps to protect against blank or unmapped frontend IDs
            const allProductKeys = await upstash.keys('telecom_item:*');
            let dynamicProductCache = [];
            if (allProductKeys && allProductKeys.length > 0) {
                const pipeline = upstash.pipeline();
                allProductKeys.forEach(key => pipeline.get(key));
                dynamicProductCache = (await pipeline.exec()).filter(Boolean);
            }

            for (const item of targetOrder.items) {
                let targetProduct = null;
                let targetKey = null;

                if (item.id && item.id !== 'prod_unknown') {
                    targetKey = item.id.startsWith('telecom_item:') ? item.id : `telecom_item:${item.id}`;
                    targetProduct = await upstash.get(targetKey);
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
                    await upstash.set(targetKey, targetProduct);
                }
            }

            targetOrder.status = 'FULFILLED';
            await upstash.set('telecom_orders_log', currentOrders);
            return res.status(200).json({ success: true, message: 'Order systems marked FULFILLED and stock structural balances updated!' });
        }

        // =========================================================================
        // 🧩 PIECE 6 OF 8: ENDPOINTS ?action=place-order & ?action=public-products
        // =========================================================================
        if (method === 'POST' && query.action === 'place-order') {
            const { name, mobile, address, mode, total, totalBill, items } = body;
            let currentOrders = (await upstash.get('telecom_orders_log')) || [];

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
            await upstash.set('telecom_orders_log', currentOrders);
            return res.status(200).json({ success: true, orderId: newOrderRecord.orderId });
        }

        if (method === 'GET' && query.action === 'public-products') {
            const keys = await upstash.keys('telecom_item:*');
            let sortedProducts = [];
            
            if (keys && keys.length > 0) {
                const pipeline = upstash.pipeline();
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
        .dropzone-box { border: 2px dashed #94a3b8; border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; background: #f8fafc; position: relative; }
        
        /* Multi-Image Gallery Asset Render Strip Palette Grid Layout */
        .gallery-preview-strip { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; justify-content: center; }
        .preview-thumbnail-container { width: 72px; height: 72px; position: relative; border: 1px solid var(--border); border-radius: 8px; background: white; overflow: hidden; }
        .preview-thumbnail { width: 100%; height: 100%; object-fit: contain; }
        .remove-asset-node { position: absolute; top: 2px; right: 2px; background: var(--danger); color: white; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 9px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 900; }
        
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
                    <input type="file" id="fileInp" style="display:none;" accept="image/*" multiple>
                    
                    <!-- Fixed Multi-Image Preview Container Zone Grid Allocation -->
                    <div id="gallery-preview-strip" class="gallery-preview-strip"></div>
                </div>
            </div>
            <button type="submit" id="submit-btn" class="submit-trigger"><i class="fas fa-plus"></i> Synchronize Item</button>
            <button type="button" id="cancel-edit-btn" onclick="resetFormState()" style="display:none; width:100%; margin-top:8px; padding:12px; background:#64748b; color:white; border:none; border-radius:12px; font-weight:700; cursor:pointer; text-transform:uppercase; font-size:13px;">Cancel Edit</button>
        </form>
    </div>
<script>
    <script>
    let localProductCacheMemory = [];
    let base64ImagePayload = "";
    let trackingGalleryArray = [];

    const TARGET_GATEWAY_URL = window.location.origin + window.location.pathname;

    async function loadDashboardData() {
        try {
            const response = await fetch(TARGET_GATEWAY_URL + "?action=loadData");
            const data = await response.json();
            if(data.success) {
                localProductCacheMemory = data.products || [];
                renderProductsTable(localProductCacheMemory);
                renderOrdersTable(data.orders || []);
            }
        } catch(e) {
            console.error("Data tracking pipeline broken:", e);
        }
    }

    // 🌟 FULLY ESCAPED MULTI-FILE CANVAS COMPRESSION: Process multiple gallery assets concurrently
    document.getElementById('fileInp').onchange = function() {
        if (!this.files || this.files.length === 0) return;
        
        const files = Array.from(this.files);
        let countProcessed = 0;
        
        const previewStrip = document.getElementById('gallery-preview-strip');
        const promptText = document.getElementById('upload-prompt');
        
        // Clear previous selections safely
        previewStrip.innerHTML = '';
        trackingGalleryArray = [];

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.src = e.target.result;
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let width = img.width; 
                    let height = img.height;
                    
                    if (width > 800) { height *= 800 / width; width = 800; }
                    canvas.width = width; canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const singleBase64 = canvas.toDataURL('image/jpeg', 0.6);
                    trackingGalleryArray.push(singleBase64);
                    
                    const itemIndex = trackingGalleryArray.length - 1;
                    
                    // 🔒 ESCAPED STRINGS: Properly bypassed backticks to protect Vercel engine compilation loops
                    const nodePreviewHtml = 
                        '<div class="preview-thumbnail-container" id="gallery-node-' + itemIndex + '">' +
                            '<img src="' + singleBase64 + '" class="preview-thumbnail" style="display:block;">' +
                            '<button type="button" class="remove-asset-node" onclick="removeNodeFromUpload(' + itemIndex + ')">✕</button>' +
                        '</div>';
                        
                    previewStrip.insertAdjacentHTML('beforeend', nodePreviewHtml);
                    
                    countProcessed++;
                    if(countProcessed === files.length) {
                        base64ImagePayload = trackingGalleryArray.filter(Boolean).join('|||');
                        promptText.innerText = files.length + " Gallery Assets Uploaded!";
                    }
                };
            };
            reader.readAsDataURL(file);
        });
        promptText.style.display = 'none';
    };

    function removeNodeFromUpload(index) {
        const node = document.getElementById('gallery-node-' + index);
        if(node) node.remove();
        trackingGalleryArray[index] = null;
        
        base64ImagePayload = trackingGalleryArray.filter(Boolean).join('|||');
        if(trackingGalleryArray.filter(Boolean).length === 0) {
            document.getElementById('upload-prompt').style.display = 'block';
            document.getElementById('upload-prompt').innerText = "Click to upload product image file";
        }
    }

        function renderProductsTable(products) {
        const tbody = document.getElementById('products-table-body');
        if(!products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#64748b;">No inventory data records active.</td></tr>';
            return;
        }
        tbody.innerHTML = products.map(p => {
            const count = p.stockCount || 0;
            const status = p.stockStatus || 'OUTOFSTOCK';
            let path = p.imageUrl || p.imageAsset || '';
            let finalThumb = path.includes('|||') ? path.split('|||')[0] : path;

            return '<tr>' +
                '<td><img src="' + finalThumb + '" style="width:44px; height:44px; object-fit:contain; border-radius:6px; border:1px solid #e2e8f0; background:#fafafa;"></td>' +
                '<td><strong style="display:block;">' + p.title + '</strong><span style="font-size:11px; color:#64748b;">' + (p.tag || '') + '</span></td>' +
                '<td><span style="background:#e2e8f0; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:700; text-transform:uppercase;">' + p.category + '</span></td>' +
                '<td><strong>₹' + p.currentPrice + '</strong></td>' +
                '<td><span style="font-weight:800; color:' + (count > 0 ? '#10b981' : '#ef4444') + '; background:' + (count > 0 ? '#ecfdf5' : '#fef2f2') + '; padding:4px 8px; border-radius:8px; font-size:12px;">' + count + ' Pcs (' + status + ')</span></td>' +
                '<td>' +
                    '<div style="display:flex; gap:6px; justify-content:center;">' +
                        '<button onclick="triggerLocalEdit(\'' + p.id + '\')" style="background:#2563eb; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:700; font-size:12px;"><i class="fas fa-edit"></i> Edit</button>' +
                        '<button onclick="purgeItem(\'' + p.id + '\')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:700; font-size:12px;"><i class="fas fa-trash-alt"></i> Del</button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function renderOrdersTable(orders) {
        const tbody = document.getElementById('orders-table-body');
        if(!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#64748b;">No customer shopping logs recorded yet.</td></tr>';
            return;
        }
        tbody.innerHTML = orders.map(o => {
            const itemsStr = Array.isArray(o.items) ? o.items.map(i => i.name + ' (x' + i.qty + ')').join(', ') : '';
            const isFulfilled = o.status === 'FULFILLED';
            return '<tr style="background: ' + (isFulfilled ? '#f8fafc' : '#ffffff') + ';">' +
                '<td><strong style="color:#2563eb; font-size:12px;">' + o.orderId + '</strong><br><span style="font-size:11px; color:#64748b;">' + (o.orderDate || '') + '</span></td>' +
                '<td><strong style="display:block;">' + o.customerName + '</strong><span style="font-size:12px; color:#475569;"><i class="fas fa-phone"></i> ' + o.customerMobile + '</span><br><span style="font-size:11px; color:#64748b;"><i class="fas fa-map-marker-alt"></i> ' + o.customerAddress + '</span></td>' +
                '<td style="font-size:13px; color:#334155;">' + itemsStr + '</td>' +
                '<td><strong style="color:#10b981; font-size:15px;">₹' + (o.totalBill || o.total || 0) + '</strong><br><span style="font-size:10px; font-weight:700; color:#64748b;">' + (o.paymentMode || 'COD') + '</span></td>' +
                '<td><span style="font-weight:800; font-size:11px; padding:4px 8px; border-radius:12px; text-transform:uppercase; background:' + (isFulfilled ? '#d1fae5' : '#fef3c7') + '; color:' + (isFulfilled ? '#065f46' : '#92400e') + ';">' + o.status + '</span></td>' +
                '<td style="text-align:center;">' + (isFulfilled ? '<span style="color:#10b981; font-weight:700;"><i class="fas fa-check-circle"></i> Fulfilling Done</span>' : '<button onclick="processFulfillment(\'' + o.orderId + '\')" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:800; font-size:12px;"><i class="fas fa-shipping-fast"></i> Fulfill</button>') + '</td>' +
            '</tr>';
        }).join('');
    }

    function triggerLocalEdit(targetId) {
        const product = localProductCacheMemory.find(item => item.id === targetId);
        if(!product) return;

        document.getElementById('edit-id').value = product.id;
        document.getElementById('title').value = product.title;
        document.getElementById('tag').value = product.tag;
        document.getElementById('category').value = product.category;
        document.getElementById('badge').value = product.badge || "";
        document.getElementById('currentPrice').value = product.currentPrice;
        document.getElementById('strikePrice').value = product.strikePrice || "";
        document.getElementById('stockCount').value = product.stockCount || 0;
        
        base64ImagePayload = product.imageUrl || product.imageAsset || "";
        
        const previewStrip = document.getElementById('gallery-preview-strip');
        previewStrip.innerHTML = '';
        trackingGalleryArray = base64ImagePayload.includes('|||') ? base64ImagePayload.split('|||') : [base64ImagePayload];

        if(base64ImagePayload) {
            trackingGalleryArray.forEach((src, idx) => {
                if(!src) return;
                previewStrip.innerHTML += 
                    '<div class="preview-thumbnail-container" id="gallery-node-' + idx + '">' +
                        '<img src="' + src + '" class="preview-thumbnail" style="display:block;">' +
                        '<button type="button" class="remove-asset-node" onclick="removeNodeFromUpload(' + idx + ')">✕</button>' +
                    '</div>';
            });
            document.getElementById('upload-prompt').style.display = 'none';
        } else {
            document.getElementById('upload-prompt').style.display = 'block';
            document.getElementById('upload-prompt').innerText = "Click to upload product image file";
        }
        
        document.getElementById('panel-title').innerText = "Modify Existing Product";
        document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Save Changes';
        document.getElementById('cancel-edit-btn').style.display = "block";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function resetFormState() {
        document.getElementById('itemDeployForm').reset();
        document.getElementById('edit-id').value = "";
        base64ImagePayload = "";
        trackingGalleryArray = [];
        document.getElementById('gallery-preview-strip').innerHTML = '';
        document.getElementById('upload-prompt').style.display = "block";
        document.getElementById('upload-prompt').innerText = "Click to upload product image file";
        document.getElementById('panel-title').innerText = "Inject Dynamic Inventory";
        document.getElementById('submit-btn').innerHTML = "<i class='fas fa-plus'></i> Synchronize Item";
        document.getElementById('cancel-edit-btn').style.display = "none";
    }

    document.getElementById('itemDeployForm').onsubmit = async function(e) {
        e.preventDefault();
        if(!base64ImagePayload) { alert("Attach image gallery files."); return; }
        const editId = document.getElementById('edit-id').value;
        
        const payload = {
            title: document.getElementById('title').value,
            tag: document.getElementById('tag').value,
            category: document.getElementById('category').value,
            badge: document.getElementById('badge').value,
            currentPrice: document.getElementById('currentPrice').value,
            strikePrice: document.getElementById('strikePrice').value,
            stockCount: document.getElementById('stockCount').value,
            imageUrl: base64ImagePayload
        };
        if(editId) payload.customEditId = editId;

        const res = await fetch(TARGET_GATEWAY_URL + '?action=create-product', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        const data = await res.json();
        if(data.success) { alert('Done!'); resetFormState(); loadDashboardData(); }
    };

    async function processFulfillment(orderId) {
        if(!confirm('Fulfill order?')) return;
        const res = await fetch(TARGET_GATEWAY_URL + '?action=fulfill-order', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ orderId: orderId }) 
        });
        const data = await res.json();
        if(data.success) { alert(data.message); loadDashboardData(); }
    }

    function downloadInventoryCSV() {
        let csv = "ID,Title,Category,Price,Stock\r\n";
        const items = localProductCacheMemory || [];
        items.forEach(p => csv += p.id + ',' + p.title.replace(/,/g,'') + ',' + p.category + ',' + p.currentPrice + ',' + p.stockCount + '\r\n');
        triggerDownload(csv, "Products_Report.csv");
    }

    function downloadOrdersCSV() {
        let csv = "OrderID,Total,Status\r\n";
        const rows = document.querySelectorAll("#orders-table-body tr");
        rows.forEach(row => {
            if(row.querySelector("td") && row.querySelector("td strong")) {
                csv += row.querySelector("td strong").innerText + ',' + row.querySelector("td:nth-child(4) strong").innerText.replace('₹','').replace(/,/g,'') + ',' + row.querySelector("td:nth-child(5) span").innerText + '\r\n';
            }
        });
        triggerDownload(csv, "Orders_Report.csv");
    }

    function triggerDownload(content, file) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", file);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }

    async function purgeItem(id) {
        if(!confirm('Delete?')) return;
        const res = await fetch(TARGET_GATEWAY_URL + '?action=delete-product&id=' + id, { method: 'DELETE' });
        const data = await res.json();
        if(data.success) { loadDashboardData(); }
    }

    loadDashboardData();
</script>
</body>
</html>`);
        }

        return res.status(404).json({ success: false, message: 'Resource matching route path not found.' });

    } catch (globalError) {
        console.error("Monolithic Core Crash Log:", globalError);
        return res.status(500).json({ success: false, message: "Internal application handling crash error." });
    }
};
