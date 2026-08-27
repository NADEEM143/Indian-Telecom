// api/admin.js - Complete Indian Telecom Enterprise Control Center Panel
const { createClient } = require('@vercel/kv');

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
    let products = [];
    let orders = [];
    try {
        // Pull all dynamic item keys and active sales logs from Upstash Redis nodes simultaneously
        const keys = await kv.keys('telecom_item:*');
        if (keys && keys.length > 0) {
            const pipelineResult = await Promise.all(keys.map(key => kv.get(key)));
            products = pipelineResult.filter(Boolean).sort((a, b) => {
                const idA = parseInt(a.id?.replace('prod_', '')) || 0;
                const idB = parseInt(b.id?.replace('prod_', '')) || 0;
                return idB - idA;
            });
        }
        orders = (await kv.get('telecom_orders_log')) || [];
    } catch (e) {
        products = [];
        orders = [];
    }

    // Dynamic Inventory Grid Builder Engine
    const dataRows = products.map(p => `
        <tr id="item-row-${p.id}">
            <td><img src="${p.imageUrl}" style="width:44px; height:44px; object-fit:contain; border-radius:6px; background:#fafafa; border:1px solid #e2e8f0;"></td>
            <td>
                <strong style="display:block; color:#090d16;">${p.title}</strong>
                <span style="font-size:11px; color:#64748b;">${p.tag}</span>
            </td>
            <td><span style="background:#e2e8f0; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:700; text-transform:uppercase;">${p.category}</span></td>
            <td><strong>₹${p.currentPrice}</strong></td>
            <td>
                <span style="font-weight: 800; color: ${p.stockCount > 0 ? '#10b981' : '#ef4444'}; background: ${p.stockCount > 0 ? '#ecfdf5' : '#fef2f2'}; padding: 4px 8px; border-radius: 8px; font-size: 12px;">
                    ${p.stockCount} Pcs (${p.stockStatus})
                </span>
            </td>
            <td>
                <div style="display: flex; gap: 6px; justify-content: center; min-width: 140px;">
                    <button onclick='initiateEdit(${JSON.stringify(p).replace(/'/g, "&apos;")})' style="background:#2563eb; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:700; display:inline-flex; align-items:center; gap:4px;" title="Edit Product"><i class="fas fa-edit"></i> Edit</button>
                    <button onclick="purgeItem('${p.id}')" style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:700; display:inline-flex; align-items:center; gap:4px;" title="Delete Product"><i class="fas fa-trash-alt"></i> Del</button>
                </div>
            </td>
        </tr>
    `).join('');

    // Dynamic Sales Order Log Row Builder Engine
    const orderRows = orders.map(o => {
        const itemDetailsString = o.items.map(i => `${i.name} (x${i.qty})`).join(', ');
        const isFulfilled = o.status === 'FULFILLED';
        return `
            <tr id="order-row-${o.orderId}" style="background: ${isFulfilled ? '#f8fafc' : '#ffffff'};">
                <td><strong style="color:#2563eb; font-size:12px;">${o.orderId}</strong><br><span style="font-size:11px; color:#64748b;">${o.orderDate}</span></td>
                <td>
                    <strong style="display:block; color:#090d16;">${o.customerName}</strong>
                    <span style="font-size:12px; color:#475569;"><i class="fas fa-phone"></i> ${o.customerMobile}</span><br>
                    <span style="font-size:11px; color:#64748b;"><i class="fas fa-map-marker-alt"></i> ${o.customerAddress}</span>
                </td>
                <td style="font-size:13px; font-weight:500; color:#334155;">${itemDetailsString}</td>
                <td><strong style="color:#10b981; font-size:15px;">₹${o.totalBill}</strong><br><span style="font-size:10px; font-weight:700; color:#64748b;">${o.paymentMode}</span></td>
                <td>
                    <span style="font-weight:800; font-size:11px; padding:4px 8px; border-radius:12px; text-transform:uppercase; background:${isFulfilled ? '#d1fae5' : '#fef3c7'}; color:${isFulfilled ? '#065f46' : '#92400e'};">
                        ${o.status}
                    </span>
                </td>
                <td style="text-align:center;">
                    ${isFulfilled ? 
                        `<span style="color:#10b981; font-weight:700; font-size:13px;"><i class="fas fa-check-circle"></i> Stock Deducted</span>` : 
                        `<button onclick="processFulfillment('${o.orderId}')" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:800; display:inline-flex; align-items:center; gap:4px;"><i class="fas fa-shipping-fast"></i> Fulfill & Countdown</button>`
                    }
                </td>
            </tr>
        `;
    }).join('');

    const fallbackEmptyState = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#64748b;">No inventory data records active.</td></tr>`;
    const fallbackOrdersEmptyState = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#64748b;">No customer shopping logs recorded yet.</td></tr>`;
    const standaloneAdminHtmlOutput = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Indian Telecom - Corporate Administration Grid</title>
        <link rel="stylesheet" href="https://cloudflare.com">
        <style>
            :root { --dark: #090d16; --border: #cbd5e1; --danger: #ef4444; --primary: #2563eb; }
            body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; padding: 40px 20px; margin: 0; color: var(--dark); }
            .master-layout { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 40px; }
            @media (min-width: 1100px) { .master-layout { grid-template-columns: 420px 1fr; } }
            .control-panel { background: white; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; height: max-content; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); }
            .form-group { margin-bottom: 18px; }
            label { display: block; font-weight: 700; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: #475569; letter-spacing: 0.5px; }
            .input-box { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px; box-sizing: border-box; font-size: 14px; }
            .dropzone-box { border: 2px dashed #94a3b8; border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; background: #f8fafc; }
            .preview-thumbnail { max-width: 100%; max-height: 100px; object-fit: contain; margin-top: 12px; display: none; border-radius: 6px; margin-left: auto; margin-right: auto; }
            .submit-trigger { background: var(--dark); color: white; width: 100%; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; }
            .table-card { background: white; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); overflow-x: auto; margin-bottom: 32px; }
            table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 800px; }
            th { text-align: left; padding: 12px; background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #e2e8f0; }
            td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
            .export-btn { background: #065f46; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; text-transform: uppercase; }
            .export-btn:hover { background: #047857; }
        </style>
    </head>
    <body>
    
    <div style="max-width:1400px; margin:0 auto 28px auto; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
            <h1 style="margin:0; font-size:26px; font-weight:900; letter-spacing:-0.5px;">Master System Control Terminal</h1>
            <p style="margin:4px 0 0 0; color:#64748b; font-size:14px;">Operational Enterprise Matrix for Indian Telecom Hub</p>
        </div>
        <div style="display:flex; gap:12px;">
            <!-- 🌟 EXPORT DATA DOWNLOAD SWITCHES -->
            <button onclick="downloadInventoryCSV()" class="export-btn"><i class="fas fa-file-excel"></i> Download Products CSV</button>
            <button onclick="downloadOrdersCSV()" class="export-btn" style="background:#1e3a8a;"><i class="fas fa-download"></i> Download Orders CSV</button>
        </div>
    </div>

    <div class="master-layout">
        <!-- FORM PANEL CONTROLLER -->
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
                
                <!-- 🌟 AVAILABLE STOCK QUANTITY VALUE INPUT NODES -->
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

        <div style="display:flex; flex-direction:column;">
            <!-- INVENTORY REPLICA TABLE MONITOR -->
            <div class="table-card">
                <h3 style="margin-top:0; text-transform:uppercase; font-size:13px; color:#475569; letter-spacing:0.5px;">Live Catalog Inventory Array</h3>
                <table>
                    <thead>
                        <tr><th>Asset</th><th>Product Context</th><th>Target Tab</th><th>Price Vector</th><th>Stock Matrix</th><th style="text-align:center;">Action Options</th></tr>
                    </thead>
                    <tbody>${products.length > 0 ? dataRows : fallbackEmptyState}</tbody>
                </table>
            </div>

            <!-- 🌟 CLIENTS REAL-TIME ORDER TRANSACTIONS LOGS TABLE MONITOR -->
            <div class="table-card">
                <h3 style="margin-top:0; text-transform:uppercase; font-size:13px; color:#1e3a8a; letter-spacing:0.5px;">Live Sales Verification Order Book</h3>
                <table>
                    <thead>
                        <tr><th>Order Code</th><th>Customer Shipping Particulars</th><th>Items Staged</th><th>Total Payable</th><th>Status</th><th style="text-align:center;">Fulfillment Switch</th></tr>
                    </thead>
                    <tbody>${orders.length > 0 ? orderRows : fallbackOrdersEmptyState}</tbody>
                </table>
            </div>
        </div>
    </div>
    <script>
        let base64ImagePayload = "";

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
                        const max_size = 800;
                        if (width > height) {
                            if (width > max_size) { height *= max_size / width; width = max_size; }
                        } else {
                            if (height > max_size) { width *= max_size / height; height = max_size; }
                        }
                        canvas.width = width; canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        base64ImagePayload = canvas.toDataURL('image/jpeg', 0.6);
                        const pv = document.getElementById('imagePreview');
                        pv.src = base64ImagePayload; pv.style.display = 'block';
                        document.getElementById('upload-prompt').innerText = "Image Compressed & Loaded!";
                    };
                };
                reader.readAsDataURL(file);
            }
        };

        function initiateEdit(product) {
            document.getElementById('edit-id').value = product.id.replace('prod_', '');
            document.getElementById('title').value = product.title;
            document.getElementById('tag').value = product.tag;
            document.getElementById('category').value = product.category;
            document.getElementById('badge').value = product.badge || "";
            document.getElementById('currentPrice').value = product.currentPrice;
            document.getElementById('strikePrice').value = product.strikePrice || "";
            document.getElementById('stockCount').value = product.stockCount || 0;
            
            base64ImagePayload = product.imageUrl;
            const pv = document.getElementById('imagePreview');
            pv.src = product.imageUrl; pv.style.display = 'block';
            
            document.getElementById('panel-title').innerText = "Modify Existing Product";
            document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Save Changes';
            document.getElementById('cancel-edit-btn').style.display = "block";
        }

        function resetFormState() {
            document.getElementById('itemDeployForm').reset();
            document.getElementById('edit-id').value = "";
            base64ImagePayload = "";
            document.getElementById('imagePreview').style.display = 'none';
            document.getElementById('panel-title').innerText = "Inject Dynamic Inventory";
            document.getElementById('submit-btn').innerHTML = '<i class="fas fa-plus"></i> Synchronize Item';
            document.getElementById('cancel-edit-btn').style.display = "none";
        }

        document.getElementById('itemDeployForm').onsubmit = async function(e) {
            e.preventDefault();
            if(!base64ImagePayload) { alert("Please attach a product image file."); return; }

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
            if(editId) { payload.customEditId = editId; }
            
            const res = await fetch('/api/create-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if(data.success) { alert('Operation Complete!'); resetFormState(); window.location.reload(); }
        };

        // 🌟 LIVE STOCK ORDER FULFILLMENT INTERFACE TRIGGER
        async function processFulfillment(orderId) {
            if(!confirm('Fulfill order? This action will automatically subtract item balances from live stock quantities.')) return;
            const res = await fetch('/api/fulfill-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });
            const data = await res.json();
            if(data.success) { alert(data.message); window.location.reload(); }
            else { alert('Fulfillment Warning: ' + data.message); }
        }

        // 🌟 AUTOMATED SYSTEM BUSINESS METRICS CSV DATA GENERATORS
        function downloadInventoryCSV() {
            let csvContent = "data:text/csv;charset=utf-8,ID,Title,Category,Tag,Price,Stock\\n";
            const tableRows = document.querySelectorAll("table:nth-of-type(1) tbody tr");
            tableRows.forEach(row => {
                if(row.querySelector("td:nth-child(2)")) {
                    const id = row.id.replace('item-row-', '');
                    const title = row.querySelector("td:nth-child(2) strong").innerText.replace(/,/g, '');
                    const cat = row.querySelector("td:nth-child(3)").innerText;
                    const tag = row.querySelector("td:nth-child(2) span").innerText;
                    const price = row.querySelector("td:nth-child(4) strong").innerText.replace('₹', '');
                    const stock = row.querySelector("td:nth-child(5) span").innerText.split(' ')[0];
                    csvContent += `${id},${title},${cat},${tag},${price},${stock}\\n`;
                }
            });
            triggerDownload(csvContent, "Telecom_Inventory_Report.csv");
        }

        function downloadOrdersCSV() {
            let csvContent = "data:text/csv;charset=utf-8,OrderID,Date,Name,Mobile,Address,Items,Total,Status\\n";
            const tableRows = document.querySelectorAll("table:nth-of-type(2) tbody tr");
            tableRows.forEach(row => {
                if(row.querySelector("td:nth-child(2)")) {
                    const id = row.querySelector("td:nth-child(1) strong").innerText;
                    const date = row.querySelector("td:nth-child(1) span").innerText;
                    const name = row.querySelector("td:nth-child(2) strong").innerText.replace(/,/g, '');
                    const mobile = row.querySelector("td:nth-child(2) span").innerText.replace(/[^0-9]/g, '');
                    const address = row.querySelector("td:nth-child(2) span:nth-of-type(2)").innerText.replace(/,/g, '-');
                    const items = row.querySelector("td:nth-child(3)").innerText.replace(/,/g, '|');
                    const total = row.querySelector("td:nth-child(4) strong").innerText.replace('₹', '').replace(/,/g, '');
                    const status = row.querySelector("td:nth-child(5) span").innerText;
                    csvContent += `${id},${date},${name},${mobile},${address},${items},${total},${status}\\n`;
                }
            });
            triggerDownload(csvContent, "Telecom_Sales_Orders_Log.csv");
        }

        function triggerDownload(content, filename) {
            const encodedUri = encodeURI(content);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        async function purgeItem(id) {
            if(!confirm('Purge item?')) return;
            await fetch('/api/delete-product?id=' + id, { method: 'DELETE' });
            window.location.reload();
        }
    </script>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(standaloneAdminHtmlOutput);
};
