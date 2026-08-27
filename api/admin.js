// api/admin.js - Vercel Serverless KV Database Admin Panel with Edit/Delete Actions
const { createClient } = require('@vercel/kv');

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
    let products = [];
    try {
        const keys = await kv.keys('telecom_item:*');
        if (keys && keys.length > 0) {
            const pipelineResult = await Promise.all(keys.map(key => kv.get(key)));
            products = pipelineResult.filter(Boolean).sort((a, b) => {
                const idA = parseInt(a.id?.replace('prod_', '')) || 0;
                const idB = parseInt(b.id?.replace('prod_', '')) || 0;
                return idB - idA;
            });
        }
    } catch (e) {
        products = [];
    }

    // 🌟 FIXED ROW LOGIC: Houses both Edit and Delete buttons cleanly side by side
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
                <div style="display: flex; gap: 8px; justify-content: center; min-width: 140px;">
                    <button onclick='initiateEdit(${JSON.stringify(p).replace(/'/g, "&apos;")})' style="background:#2563eb; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:700; display:inline-flex; align-items:center; gap:4px;" title="Edit Product">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="purgeItem('${p.id}')" style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:700; display:inline-flex; align-items:center; gap:4px;" title="Delete Product">
                        <i class="fas fa-trash-alt"></i> Del
                    </button>
                </div>
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
            @media (min-width: 1100px) { .master-layout { grid-template-columns: 440px 1fr; } }
            .control-panel { background: white; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; height: max-content; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
            .form-group { margin-bottom: 18px; }
            label { display: block; font-weight: 700; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: #475569; }
            .input-box { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px; box-sizing: border-box; font-size: 14px; }
            .dropzone-box { border: 2px dashed #94a3b8; border-radius: 12px; padding: 24px; text-align: center; cursor: pointer; background: #f8fafc; transition: 0.2s; }
            .dropzone-box:hover { border-color: var(--dark); background: #f1f5f9; }
            .preview-thumbnail { max-width: 100%; max-height: 120px; object-fit: contain; margin-top: 12px; display: none; border-radius: 6px; margin-left: auto; margin-right: auto; }
            .submit-trigger { background: var(--dark); color: white; width: 100%; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 8px; }
            .table-card { background: white; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow-x: auto; }
            table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 650px; }
            th { text-align: left; padding: 12px; background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #e2e8f0; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        </style>
    </head>
    <body>
    <div style="max-width:1300px; margin:0 auto 24px auto;">
        <h1 style="margin:0; font-size:26px; font-weight:900; letter-spacing:-0.5px;">Master System Control Terminal</h1>
        <p style="margin:4px 0 0 0; color:#64748b; font-size:14px;">Operational Matrix for Indian Telecom Storefront</p>
    </div>
    <div class="master-layout">
        <div class="control-panel">
            <h3 id="panel-title" style="margin-top:0; text-transform:uppercase; font-size:14px; color:#2563eb;">Inject Dynamic Inventory</h3>
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
        <div class="table-card">
            <h3 style="margin-top:0; text-transform:uppercase; font-size:14px;">Live Inventory Array Monitor</h3>
            <table>
                <thead>
                    <tr><th>Asset</th><th>Product Context</th><th>Target Tab</th><th>Price Vector</th><th style="text-align:center;">Action Options</th></tr>
                </thead>
                <tbody>${products.length > 0 ? dataRows : fallbackEmptyState}</tbody>
            </table>
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
                        base64ImagePayload = canvas.toDataURL('image/jpeg', 0.6);
                        const pv = document.getElementById('imagePreview');
                        pv.src = base64ImagePayload;
                        pv.style.display = 'block';
                        document.getElementById('upload-prompt').innerText = "Image Loaded Successfully!";
                    };
                };
                reader.readAsDataURL(file);
            }
        };

        // 🌟 LIVE EDIT ENGINE: Auto-fills your fields instantly when 'Edit' is pressed
        function initiateEdit(product) {
            document.getElementById('edit-id').value = product.id.replace('prod_', '');
            document.getElementById('title').value = product.title;
            document.getElementById('tag').value = product.tag;
            document.getElementById('category').value = product.category;
            document.getElementById('badge').value = product.badge || "";
            document.getElementById('currentPrice').value = product.currentPrice;
            document.getElementById('strikePrice').value = product.strikePrice || "";
            
            base64ImagePayload = product.imageUrl;
            const pv = document.getElementById('imagePreview');
            pv.src = product.imageUrl;
            pv.style.display = 'block';
            
            document.getElementById('panel-title').innerText = "Modify Existing Product";
            document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Save Changes';
            document.getElementById('cancel-edit-btn').style.display = "block";
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function resetFormState() {
            document.getElementById('itemDeployForm').reset();
            document.getElementById('edit-id').value = "";
            base64ImagePayload = "";
            document.getElementById('imagePreview').style.display = 'none';
            document.getElementById('panel-title').innerText = "Inject Dynamic Inventory";
            document.getElementById('submit-btn').innerHTML = '<i class="fas fa-plus"></i> Synchronize Item';
            document.getElementById('cancel-edit-btn').style.display = "none";
            document.getElementById('upload-prompt').innerText = "Click to upload product image file";
        }

        document.getElementById('itemDeployForm').onsubmit = async function(e) {
            e.preventDefault();
            if(!base64ImagePayload) { alert("Please attach a product image asset."); return; }

            const editId = document.getElementById('edit-id').value;
            const payload = {
                title: document.getElementById('title').value,
                tag: document.getElementById('tag').value,
                category: document.getElementById('category').value,
                badge: document.getElementById('badge').value,
                currentPrice: document.getElementById('currentPrice').value,
                strikePrice: document.getElementById('strikePrice').value,
                imageUrl: base64ImagePayload
            };

            if(editId) { payload.customEditId = editId; }
            
            try {
                const res = await fetch('/api/create-product', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if(data.success) { 
                    alert(editId ? 'Product Updated Successfully!' : 'Item synchronized successfully!'); 
                    resetFormState();
                    window.location.reload(); 
                }
            } catch (err) {
                alert('Connection mapping error.');
            }
        };

        async function purgeItem(id) {
            if(!confirm('Are you sure you want to permanently delete this product?')) return;
            await fetch('/api/delete-product?id=' + id, { method: 'DELETE' });
            window.location.reload();
        }
    </script>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(standaloneAdminHtmlOutput);
};
