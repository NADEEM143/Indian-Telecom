// api/admin.js - Optimized Vercel Serverless Admin Panel Engine
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'products.json');

module.exports = async (req, res) => {
    let products = [];
    try {
        if (fs.existsSync(DB_PATH)) {
            products = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        }
    } catch (e) {
        products = [];
    }

    const dataRows = products.map(p => `
        <tr id="item-row-${p.id}">
            <td><img src="${p.imageUrl}" style="width:44px; height:44px; object-fit:contain; border-radius:6px; background:#fafafa; border:1px solid #e2e8f0;"></td>
            <td>
                <strong style="display:block; color:#090d16;">${p.title}</strong>
                <span style="font-size:11px; color:#64748b;">${p.tag}</span>
            </td>
            <td><span style="background:#e2e8f0; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:700; text-transform:uppercase;">${p.category}</span></td>
            <td><strong>₹${p.currentPrice}</strong></td>
            <td style="text-align:center;">
                <button onclick="purgeItem('${p.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:16px;"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');

    const fallbackEmptyState = `
        <tr>
            <td colspan="5" style="text-align:center; padding:40px; color:#64748b; font-weight:500;">
                <i class="fas fa-box-open" style="font-size:28px; margin-bottom:8px; display:block;"></i>
                No custom assets running on live database stream.
            </td>
        </tr>
    `;

    const standaloneAdminHtmlOutput = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Indian Telecom - Master Administration Desk</title>
        <link rel="stylesheet" href="https://cloudflare.com">
        <style>
            :root { --dark: #090d16; --border: #cbd5e1; --danger: #ef4444; }
            body { font-family: system-ui, sans-serif; background: #f8fafc; padding: 40px 20px; margin: 0; color: var(--dark); }
            .master-layout { max-width: 1300px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 40px; }
            @media (min-width: 992px) { .master-layout { grid-template-columns: 440px 1fr; } }
            .control-panel { background: white; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; height: max-content; }
            .form-group { margin-bottom: 18px; }
            label { display: block; font-weight: 700; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: #475569; }
            .input-box { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px; box-sizing: border-box; font-size: 14px; }
            .dropzone-box { border: 2px dashed #94a3b8; border-radius: 12px; padding: 24px; text-align: center; cursor: pointer; background: #f8fafc; transition: 0.2s; }
            .dropzone-box:hover { border-color: var(--dark); background: #f1f5f9; }
            .preview-thumbnail { max-width: 100%; max-height: 120px; object-fit: contain; margin-top: 12px; display: none; border-radius: 6px; margin-left: auto; margin-right: auto; }
            .submit-trigger { background: var(--dark); color: white; width: 100%; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; }
            .table-card { background: white; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; overflow-x: auto; }
            table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 500px; }
            th { text-align: left; padding: 12px; background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #e2e8f0; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        </style>
    </head>
    <body>
    <div style="max-width:1300px; margin:0 auto 24px auto;">
        <h1 style="margin:0; font-size:26px; font-weight:900;">Master System Control Terminal</h1>
        <p style="margin:4px 0 0 0; color:#64748b; font-size:14px;">Operational Matrix for Indian Telecom Storefront</p>
    </div>
    <div class="master-layout">
        <div class="control-panel">
            <h3>Inject Dynamic Inventory</h3>
            <form id="itemDeployForm">
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
                    <label>Product Image Asset</label>
                    <div class="dropzone-box" onclick="document.getElementById('fileInp').click()">
                        <i class="fas fa-images" style="font-size:24px; color:#64748b; margin-bottom:6px;"></i>
                        <p style="margin:0; font-size:12px; color:#64748b;">Click to upload product image file</p>
                        <input type="file" id="fileInp" style="display:none;" accept="image/*" required>
                        <img id="imagePreview" class="preview-thumbnail">
                    </div>
                </div>
                
                <button type="submit" class="submit-trigger"><i class="fas fa-plus"></i> Synchronize Item</button>
            </form>
        </div>
        <div class="table-card">
            <h3>Live Inventory Array Monitor</h3>
            <table>
                <thead>
                    <tr><th>Asset</th><th>Product Context</th><th>Target Tab</th><th>Price Vector</th><th style="text-align:center;">Action</th></tr>
                </thead>
                <tbody>${products.length > 0 ? dataRows : fallbackEmptyState}</tbody>
            </table>
        </div>
    </div>
    <script>
        let base64ImagePayload = "";

        // Canvas Compression Engine to shrink down large local file sizes
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
                        
                        // Limit dimensions to a max of 800px width/height to drastically reduce text payload size
                        let width = img.width;
                        let height = img.height;
                        const max_size = 800;
                        
                        if (width > height) {
                            if (width > max_size) { height *= max_size / width; width = max_size; }
                        } else {
                            if (height > max_size) { width *= max_size / height; height = max_size; }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Compress to web-optimized JPEG format with 60% quality ratio
                        base64ImagePayload = canvas.toDataURL('image/jpeg', 0.6);
                        
                        const pv = document.getElementById('imagePreview');
                        pv.src = base64ImagePayload;
                        pv.style.display = 'block';
                    };
                };
                reader.readAsDataURL(file);
            }
        };

        document.getElementById('itemDeployForm').onsubmit = async function(e) {
            e.preventDefault();
            if(!base64ImagePayload) { alert("Please attach a valid product picture asset."); return; }

            const payload = {
                title: document.getElementById('title').value,
                tag: document.getElementById('tag').value,
                category: document.getElementById('category').value,
                badge: document.getElementById('badge').value,
                currentPrice: document.getElementById('currentPrice').value,
                strikePrice: document.getElementById('strikePrice').value,
                imageUrl: base64ImagePayload
            };
            
            try {
                const res = await fetch('/api/create-product', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if(data.success) { 
                    alert('Success: Item synchronized successfully!'); 
                    window.location.reload(); 
                } else {
                    alert('Server processing error: ' + data.message);
                }
            } catch (err) {
                alert('Connection timeout error. Image size is still too large.');
            }
        };

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
