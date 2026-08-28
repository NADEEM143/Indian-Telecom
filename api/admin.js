<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>INDIAN TELECOM - Master System Control Room</title>
    <link rel="stylesheet" href="https://cloudflare.com">
    <style>
        :root {
            --primary: #2563eb;
            --primary-hover: #1d4ed8;
            --dark: #090d16;
            --text-muted: #64748b;
            --card-border: #e2e8f0;
            --bg-light: #f8fafc;
            --success: #10b981;
            --danger: #ef4444;
            --border: #cbd5e1;
        }
        body { font-family: system-ui, -apple-system, sans-serif; background-color: var(--bg-light); margin: 0; padding: 40px 20px; color: var(--dark); }
        .dashboard-container { max-width: 1450px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 40px; }
        @media (min-width: 1150px) { .dashboard-container { grid-template-columns: 420px 1fr; } }
        .control-panel, .table-card { background: white; padding: 32px; border-radius: 16px; border: 1px solid var(--card-border); box-shadow: 0 4px 12px rgba(9,13,22,0.02); height: max-content; }
        .form-group { margin-bottom: 18px; }
        label { display: block; font-weight: 700; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: #475569; letter-spacing: 0.5px; }
        .input-box { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px; box-sizing: border-box; font-size: 14px; }
        .input-box:focus { outline: none; border-color: var(--primary); }
        
        /* 📸 MULTI-GALLERY PREVIEW GRID OVERRIDES */
        .dropzone-box { border: 2px dashed #94a3b8; border-radius: 12px; padding: 24px; text-align: center; cursor: pointer; background: var(--bg-light); transition: border-color 0.2s; }
        .dropzone-box:hover { border-color: var(--primary); }
        .gallery-preview-strip { display: flex !important; gap: 8px !important; flex-wrap: wrap !important; margin-top: 12px !important; justify-content: center !important; width: 100% !important; box-sizing: border-box !important; }
        .preview-thumbnail-container { width: 72px !important; height: 72px !important; position: relative !important; border: 1px solid var(--card-border) !important; border-radius: 8px !important; background: white !important; overflow: hidden !important; display: inline-block !important; }
        .preview-thumbnail { width: 100% !important; height: 100% !important; object-fit: contain !important; display: block !important; }
        .remove-asset-node { position: absolute !important; top: 2px !important; right: 2px !important; background: var(--danger) !important; color: white !important; border: none !important; border-radius: 50% !important; width: 16px !important; height: 16px !important; font-size: 9px !important; cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important; font-weight: 900 !important; padding: 0 !important; z-index: 10 !important; }
        
        .submit-trigger { background: var(--dark); color: white; width: 100%; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; }
        .submit-trigger:hover { background: var(--primary); }
        .table-card { overflow-x: auto; margin-bottom: 32px; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 850px; }
        th { text-align: left; padding: 12px; background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1px solid var(--card-border); }
        td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    </style>
</head>
<body>
<div style="max-width:1450px; margin:0 auto 28px auto; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
    <div>
        <h1 style="margin:0; font-size:26px; font-weight:900;">Master System Control Terminal</h1>
        <p style="margin:4px 0 0 0; color:#64748b; font-size:14px;">Operational Enterprise Matrix for Indian Telecom Hub</p>
    </div>
    <div style="font-weight: 700; font-size: 13px; color: var(--success);"><i class="fas fa-circle"></i> Pipeline Live Connected</div>
</div>

<div class="dashboard-container">
    <div class="control-panel">
        <h3 id="panel-title" style="margin-top:0; text-transform:uppercase; font-size:13px; color:var(--primary); letter-spacing:0.5px;">Inject Dynamic Inventory</h3>
        <form id="standaloneForm">
            <input type="hidden" id="edit-id" value="">
            <div class="form-group">
                <label>Product Display Title</label>
                <input type="text" id="title" class="input-box" required placeholder="e.g., OnePlus Nord 4 Silicone Case">
            </div>
            <div class="form-group">
                <label>Mini Content Tag</label>
                <input type="text" id="tag" class="input-box" required placeholder="e.g., SLIM FIT">
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
                <input type="text" id="badge" class="input-box" placeholder="e.g., 20% OFF (Optional)">
            </div>
            <div style="display:flex; gap:16px;">
                <div class="form-group" style="flex:1;">
                    <label>Selling Price (₹)</label>
                    <input type="number" id="currentPrice" class="input-box" required placeholder="499">
                </div>
                <div class="form-group" style="flex:1;">
                    <label>Strike Price (₹)</label>
                    <input type="number" id="strikePrice" class="input-box" placeholder="999">
                </div>
            </div>
            <div class="form-group">
                <label>Initial Available Stock Quantity</label>
                <input type="number" id="stockCount" class="input-box" value="50" min="0" required>
            </div>
            
            <div class="form-group">
                <label>Product Image Asset Gallery</label>
                <!-- Input field is safely isolated outside the dropzone box to prevent infinite clicking loops -->
                <input type="file" id="galleryFileInput" style="display:none;" accept="image/*" multiple>
                <div class="dropzone-box" onclick="document.getElementById('galleryFileInput').click()">
                    <i class="fas fa-images" style="font-size:24px; color:#64748b; margin-bottom:6px;"></i>
                    <p id="upload-prompt" style="margin:0; font-size:12px; color:#64748b;">Click to upload product image files</p>
                    <div id="gallery-preview-strip" class="gallery-preview-strip" onclick="event.stopPropagation();"></div>
                </div>
            </div>
            
            <button type="submit" id="submit-btn" class="submit-trigger"><i class="fas fa-plus"></i> Synchronize Item</button>
            <button type="button" id="cancel-edit-btn" onclick="resetPortalForm()" style="display:none; width:100%; margin-top:8px; padding:12px; background:#64748b; color:white; border:none; border-radius:12px; font-weight:700; cursor:pointer; text-transform:uppercase; font-size:13px;">Cancel Edit</button>
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
                    <tr><td colspan="6" style="text-align:center; padding:30px; color:#64748b;">Loading active database streams...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<script>
    // ⚙️ UPSTASH REST CONFIGURATION: Insert your credentials from the Upstash Console Redis tab here
    const UPSTASH_REST_URL = "https://upstash.io";
    const UPSTASH_REST_TOKEN = "your_secure_rest_token_here";

    let localProductCache = [];
    let compiledBase64Payload = "";
    let temporaryGalleryStorage = [];

    // Asynchronous Upstash Execution Wrapper Interface Pipeline
    async function executeUpstashCommand(commandArray) {
        const response = await fetch(`${UPSTASH_REST_URL}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${UPSTASH_REST_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(commandArray)
        });
        const resultData = await response.json();
        return resultData.result;
    }
    async function loadPortalData() {
        try {
            const masterKeys = await executeUpstashCommand(["KEYS", "telecom_item:*"]);
            const tbody = document.getElementById('products-table-body');
            
            if(!masterKeys || masterKeys.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#64748b;">No active database records found.</td></tr>';
                return;
            }

            localProductCache = [];
            tbody.innerHTML = '';

            for(const key of masterKeys) {
                const rawItem = await executeUpstashCommand(["GET", key]);
                if(!rawItem) continue;
                
                const item = typeof rawItem === 'string' ? JSON.parse(rawItem) : rawItem;
                localProductCache.push(item);

                let imageSource = item.imageUrl || "";
                let displayThumb = imageSource.includes('|||') ? imageSource.split('|||')[0] : imageSource;

                tbody.innerHTML += `
                    <tr>
                        <td><img src="${displayThumb}" style="width:44px; height:44px; object-fit:contain; border-radius:6px; border:1px solid #e2e8f0; background:#fafafa;"></td>
                        <td><strong style="display:block;">${item.title}</strong><span style="font-size:11px; color:#64748b;">${item.tag || ''}</span></td>
                        <td><span style="background:#e2e8f0; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:700; text-transform:uppercase;">${item.category}</span></td>
                        <td><strong>₹${item.currentPrice}</strong></td>
                        <td><span style="font-weight:800; color:${item.stockCount > 0 ? '#10b981' : '#ef4444'}">${item.stockCount} Pcs</span></td>
                        <td style="text-align:center;">
                            <button onclick="editProductField('${item.id}')" style="background:#2563eb; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:700; font-size:12px; margin-right:4px;"><i class="fas fa-edit"></i> Edit</button>
                            <button onclick="purgeProductField('${item.id}')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:700; font-size:12px;"><i class="fas fa-trash"></i> Del</button>
                        </td>
                    </tr>`;
            }
        } catch(err) {
            console.error("Upstash Fetch Trace Crash:", err);
        }
    }

    // 🌟 MULTI-IMAGE CONCURRENT CANVAS COMPRESSION GENERATOR
    document.getElementById('galleryFileInput').addEventListener('change', function(event) {
        if (!this.files || this.files.length === 0) return;
        
        const filesList = Array.from(this.files);
        let completedFilesCount = 0;
        
        const previewStrip = document.getElementById('gallery-preview-strip');
        const uploadPrompt = document.getElementById('upload-prompt');
        
        previewStrip.innerHTML = '';
        temporaryGalleryStorage = [];
        compiledBase64Payload = "";

        filesList.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imgNode = new Image();
                imgNode.src = e.target.result;
                imgNode.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let width = imgNode.width; 
                    let height = imgNode.height;
                    
                    if (width > 800) { height *= 800 / width; width = 800; }
                    canvas.width = width; canvas.height = height;
                    ctx.drawImage(imgNode, 0, 0, width, height);
                    
                    const singleBase64Str = canvas.toDataURL('image/jpeg', 0.6);
                    temporaryGalleryStorage.push(singleBase64Str);
                    
                    const currentIndex = temporaryGalleryStorage.length - 1;
                    
                    previewStrip.innerHTML += `
                        <div class="preview-thumbnail-container" id="node-asset-${currentIndex}">
                            <img src="${singleBase64Str}" class="preview-thumbnail">
                            <button type="button" class="remove-asset-node" onclick="removeNodeFromUploader(${currentIndex}); event.stopPropagation();">✕</button>
                        </div>`;
                    
                    completedFilesCount++;
                    if(completedFilesCount === filesList.length) {
                        compiledBase64Payload = temporaryGalleryStorage.filter(Boolean).join('|||');
                        uploadPrompt.innerText = filesList.length + " Gallery Images Selected!";
                    }
                };
            };
            reader.readAsDataURL(file);
        });
        uploadPrompt.style.display = 'none';
    });

    function removeNodeFromUploader(index) {
        const targetElement = document.getElementById(`node-asset-${index}`);
        if(targetElement) targetElement.remove();
        
        temporaryGalleryStorage[index] = null;
        compiledBase64Payload = temporaryGalleryStorage.filter(Boolean).join('|||');
        
        if(temporaryGalleryStorage.filter(Boolean).length === 0) {
            document.getElementById('upload-prompt').style.display = 'block';
            document.getElementById('upload-prompt').innerText = "Click to upload product image files";
        }
    }
    // 🌟 ANTI-REFRESH SUBMIT HANDLER: Prevents form reload bugs completely
    document.getElementById('standaloneForm').addEventListener('submit', async function(e) {
        // Halt native form web browser page refresh loops instantly
        e.preventDefault(); 

        if(!compiledBase64Payload) {
            alert("Please pick product images from your system gallery.");
            return;
        }

        const editId = document.getElementById('edit-id').value;
        const finalizedId = editId ? editId : 'item_' + Date.now();
        const upstashKey = `telecom_item:${finalizedId}`;
        
        const payload = {
            id: finalizedId,
            title: document.getElementById('title').value.trim(),
            tag: document.getElementById('tag').value.trim(),
            category: document.getElementById('category').value,
            badge: document.getElementById('badge').value.trim() || null,
            currentPrice: parseInt(document.getElementById('currentPrice').value) || 0,
            strikePrice: document.getElementById('strikePrice').value ? parseInt(document.getElementById('strikePrice').value) : null,
            stockCount: document.getElementById('stockCount').value || 0,
            imageUrl: compiledBase64Payload,
            updatedAt: new Date().toISOString()
        };

        const actionBtn = document.getElementById('submit-btn');
        actionBtn.disabled = true;
        actionBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Syncing to Upstash Redis...`;

        try {
            // Write payload strings directly into your Upstash Redis database hash maps
            await executeUpstashCommand(["SET", upstashKey, JSON.stringify(payload)]);
            alert("Database synchronized perfectly across active server clusters!");
            resetPortalForm();
            loadPortalData();
        } catch(error) {
            alert("Network pipeline exception intercepted: " + error.message);
        } finally {
            actionBtn.disabled = false;
            actionBtn.innerHTML = `<i class="fas fa-plus"></i> Synchronize Item`;
        }
    });

    function editProductField(id) {
        const item = localProductCache.find(p => p.id === id);
        if(!item) return;

        document.getElementById('edit-id').value = item.id;
        document.getElementById('title').value = item.title;
        document.getElementById('tag').value = item.tag;
        document.getElementById('category').value = item.category;
        document.getElementById('badge').value = item.badge || "";
        document.getElementById('currentPrice').value = item.currentPrice;
        document.getElementById('strikePrice').value = item.strikePrice || "";
        document.getElementById('stockCount').value = item.stockCount || 0;

        compiledBase64Payload = item.imageUrl || "";
        const previewStrip = document.getElementById('gallery-preview-strip');
        previewStrip.innerHTML = '';
        temporaryGalleryStorage = compiledBase64Payload.includes('|||') ? compiledBase64Payload.split('|||') : [compiledBase64Payload];

        if(compiledBase64Payload) {
            temporaryGalleryStorage.forEach((src, idx) => {
                if(!src) return;
                previewStrip.innerHTML += `
                    <div class="preview-thumbnail-container" id="node-asset-${idx}">
                        <img src="${src}" class="preview-thumbnail">
                        <button type="button" class="remove-asset-node" onclick="removeNodeFromUploader(${idx}); event.stopPropagation();">✕</button>
                    </div>`;
            });
            document.getElementById('upload-prompt').style.display = 'none';
        }

        document.getElementById('panel-title').innerText = "Modify Existing Listing Fields";
        document.getElementById('submit-btn').innerHTML = `<i class="fas fa-save"></i> Save Changes`;
        document.getElementById('cancel-edit-btn').style.display = "block";
    }

    async function purgeProductField(id) {
        if(confirm("Permanently remove this accessory from active catalog index streams?")) {
            await executeUpstashCommand(["DEL", `telecom_item:${id}`]);
            loadPortalData();
        }
    }

    function resetPortalForm() {
        document.getElementById('standaloneForm').reset();
        document.getElementById('edit-id').value = "";
        document.getElementById('gallery-preview-strip').innerHTML = '';
        document.getElementById('upload-prompt').style.display = 'block';
        document.getElementById('upload-prompt').innerText = "Click to upload product image files";
        document.getElementById('panel-title').innerText = "Inject Dynamic Inventory";
        document.getElementById('submit-btn').innerHTML = `<i class="fas fa-plus"></i> Synchronize Item`;
        document.getElementById('cancel-edit-btn').style.display = "none";
        compiledBase64Payload = "";
        temporaryGalleryStorage = [];
    }

    window.onload = loadPortalData;
</script>
</body>
</html>
