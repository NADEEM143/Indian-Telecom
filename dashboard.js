const API_BASE_ENDPOINT = '/api';
let liveInventoryState = [];
let liveOrdersState = [];
let temporaryImageBase64 = "";

async function pullMasterDatabaseArrays() {
    try {
        const productResponse = await fetch(`${API_BASE_ENDPOINT}/admin?type=products`);
        if (productResponse.ok) { liveInventoryState = await productResponse.json(); }

        const orderResponse = await fetch(`${API_BASE_ENDPOINT}/admin?type=orders`);
        if (orderResponse.ok) { liveOrdersState = await orderResponse.json(); }

        renderAdminInventory();
        renderAdminOrders();
    } catch (err) {
        console.error("Cloud State Sync Error:", err.message);
    }
}

async function pushInventoryStateToCloud() {
    try {
        await fetch(`${API_BASE_ENDPOINT}/admin?type=products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(liveInventoryState)
        });
    } catch (err) {
        console.error("Cloud write failed:", err);
    }
}

function generateImagePreview(inputElement) {
    const preview = document.getElementById("upload-preview");
    if (inputElement.files && inputElement.files[0]) {
        const selectedFile = inputElement.files[0];
        const fileSizeInKB = selectedFile.size / 1024;

        // 🛑 PREVIEW TIME GUARD: Immediately reject images over 65 KB upon selecting them
        if (fileSizeInKB > 65) {
            alert(
                "❌ UPLOAD BLOCKED [FILE TOO LARGE]\n\n" +
                `The image you selected is ${fileSizeInKB.toFixed(1)} KB, which exceeds the 65 KB safety limit.\n\n` +
                "Please choose a compressed or lighter file."
            );
            inputElement.value = ""; // Reset file selection input container parameters
            if (preview) {
                preview.src = "";
                preview.style.display = "none";
            }
            temporaryImageBase64 = "";
            return;
        }

        const fileReaderEngine = new FileReader();
        fileReaderEngine.onload = function (e) {
            temporaryImageBase64 = e.target.result;
            if (preview) {
                preview.src = temporaryImageBase64;
                preview.style.display = "block";
            }
        };
        fileReaderEngine.readAsDataURL(selectedFile);
    }
}

function renderAdminInventory() {
    const targetTableBody = document.getElementById("inventory-list-target");
    if (!targetTableBody) return;
    
    if (liveInventoryState.length === 0) {
        targetTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:30px;">No items inside database inventory.</td></tr>`;
        return;
    }

    targetTableBody.innerHTML = liveInventoryState.map((item, index) => `
        <tr>
            <td>
                <div class="row-item-meta">
                    <div class="row-thumb">
                        ${item.asset ? `<img src="${item.asset}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">` : '📱'}
                    </div>
                    <div style="font-weight: 700; color:#ffffff;">${item.name}</div>
                </div>
            </td>
            <td style="color:#cbd5e1;">${item.category}</td>
            <td style="color:#ffffff;"><strong>₹${item.discountPrice}</strong> <span style="font-size:12px; color:#64748b; text-decoration:line-through; margin-left:5px;">₹${item.price}</span></td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" ${item.isLive ? 'checked' : ''} onchange="toggleProductVisibility(${index})">
                    <span class="slider"></span>
                </label>
            </td>
            <td><button class="action-icon-btn" onclick="deleteInventoryItem(${index})">🗑️ Remove</button></td>
        </tr>
    `).join('');
}
function renderAdminOrders() {
    const targetTableBody = document.getElementById("orders-log-target");
    if (!targetTableBody) return;
    
    if (liveOrdersState.length === 0) {
        targetTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:30px;">No active orders in queue!</td></tr>`;
        return;
    }
    
    targetTableBody.innerHTML = liveOrdersState.map((order, index) => `
        <tr>
            <td style="font-weight: 700; color: #3b82f6;">#${order.id || 'ORD'}</td>
            <td>
                <div style="font-weight: 700; color:#ffffff;">${order.name}</div>
                <div style="font-size: 12px; color: #94a3b8;">${order.phone}</div>
            </td>
            <td style="max-width: 220px; font-size: 13px; color: #cbd5e1;">${order.address}</td>
            <td><span class="badge ${order.mop === 'ONLINE' ? 'badge-success' : 'badge-warning'}">${order.mop}</span></td>
            <td style="font-family: monospace; font-weight: 700; color: #f59e0b; letter-spacing: 0.5px;">${order.utr || 'N/A'}</td>
            <td><button class="action-icon-btn ship-btn" onclick="fulfillOrder(${index})">✅ Ship</button></td>
        </tr>
    `).join('');
}

async function processNewProduct(event) {
    event.preventDefault();

    // 🛑 HARD SUBMIT GUARD: Absolute fallback verification check matching raw file sizes before creation pipelines run
    const fileInput = document.getElementById("prod-file");
    if (fileInput && fileInput.files && fileInput.files[0]) {
        const rawFileBytes = fileInput.files[0].size;
        const rawFileKB = rawFileBytes / 1024;
        if (rawFileKB > 65) {
            alert(
                "❌ UPLOAD BLOCKED [FILE TOO LARGE]\n\n" +
                `Operation Denied: The original image size (${rawFileKB.toFixed(1)} KB) is over the allowed 65 KB safety limit.\n\n` +
                "Please choose a lighter or compressed file asset."
            );
            fileInput.value = "";
            const preview = document.getElementById("upload-preview");
            if (preview) {
                preview.src = "";
                preview.style.display = "none";
            }
            temporaryImageBase64 = "";
            return;
        }
    }

    // 🛑 SUBMIT TIME HARD FIREWALL: Airtight secondary check validating the base64 footprint size metrics
    if (temporaryImageBase64) {
        const base64BytesFootprint = temporaryImageBase64.length * (3 / 4);
        const base64SizeInKB = base64BytesFootprint / 1024;

        if (base64SizeInKB > 65) {
            alert(
                "❌ UPLOAD BLOCKED [PAYLOAD CONSTRAINT]\n\n" +
                `Even after baseline processing, the image string payload is ${base64SizeInKB.toFixed(1)} KB, which violates constraints.\n\n` +
                "Please choose a lower resolution photo asset."
            );
            return; // ⛔ TERMINATES PIPELINE: Absolutely blocks the server save call
        }
    } else {
        alert("⚠️ ATTENTION: Please upload a product image asset under 65 KB before publishing.");
        return;
    }

    const name = document.getElementById("prod-name").value;
    const cat = document.getElementById("prod-cat").value;
    const price = parseInt(document.getElementById("prod-price").value);
    const discount = parseInt(document.getElementById("prod-disc").value);

    const newProductItem = {
        id: "p_" + Date.now(),
        name: name,
        category: cat,
        price: price,
        discountPrice: discount,
        isLive: true,
        asset: temporaryImageBase64
    };

      liveInventoryState.push(newProductItem);
    await pushInventoryStateToCloud();
    renderAdminInventory();
    
    // 🎉 DISTINCT SUCCESS ALERT LAYER - This will only execute if all 65KB validation firewalls pass successfully!
    alert(`REJECTED: "${name}" uploaded image size is too heavy! Please select a lighter image less than 65kb`);
    
    document.getElementById("product-upload-form").reset();
    const previewBox = document.getElementById("upload-preview");
    if (previewBox) previewBox.style.display = "none";
    temporaryImageBase64 = "";
}

async function toggleProductVisibility(index) {
    liveInventoryState[index].isLive = !liveInventoryState[index].isLive;
    await pushInventoryStateToCloud();
}

async function deleteInventoryItem(index) {
    if (confirm("Remove this accessory from active storefront?")) {
        liveInventoryState.splice(index, 1);
        await pushInventoryStateToCloud();
        renderAdminInventory();
    }
}

async function fulfillOrder(index) {
    alert("Fulfilling order logs.");
    liveOrdersState.splice(index, 1);
    try {
        await fetch(`${API_BASE_ENDPOINT}/admin?type=orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(liveOrdersState)
        });
    } catch (e) { console.error(e); }
    renderAdminOrders();
}

window.onload = function() {
    pullMasterDatabaseArrays();
    const formElement = document.getElementById("product-upload-form");
    if (formElement) formElement.addEventListener("submit", processNewProduct);
};
