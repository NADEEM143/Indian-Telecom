// =========================================================================
// MODULE 1: GLOBAL CONSTANTS & API CLOUD STORAGE BRIDGE INTERFACE LAYER
// =========================================================================
const API_BASE_ENDPOINT = '/api';
let liveInventoryState = [];
let liveOrdersState = [];
let temporaryImageBase64 = "";

/**
 * Robust asynchronous coordinator pulling production matrices from backend KV layers 
 */
async function pullMasterDatabaseArrays() {
    try {
        // Fetch active live products inventory list from unified API endpoints
        const productResponse = await fetch(`${API_BASE_ENDPOINT}/products`);
        if (productResponse.ok) {
            liveInventoryState = await productResponse.json();
        }

        // Fetch pending customer checkout order logs queue tracking hashes
        const orderResponse = await fetch(`${API_BASE_ENDPOINT}/orders`);
        if (orderResponse.ok) {
            liveOrdersState = await orderResponse.json();
        }

        // Process data state layers dynamically across visible admin viewport DOMs
        renderAdminInventory();
        renderAdminOrders();

    } catch (networkError) {
        console.error("Critical Cloud State Pull Synchronization Pipeline Interrupted:", networkError.message);
    }
}

/**
 * Pushes local state updates back to your secure Vercel database instance 
 */
async function pushInventoryStateToCloud() {
    try {
        const response = await fetch(`${API_BASE_ENDPOINT}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(liveInventoryState)
        });
        if (!response.ok) throw new Error("Cloud write operations failed.");
    } catch (networkError) {
        alert("Warning: Synchronization failed. Review dashboard parameters.");
    }
}
// =========================================================================
// MODULE 2: PREMIUM HIGH-SCALE HARDWARE DEVICE MEDIA ASSET INGESTION CORE
// =========================================================================

/**
 * Processes physical files selected on the client phone/laptop to convert into base64 storage blocks
 * @param {HTMLInputElement} inputElement - Native HTML image upload selector matrix tracking
 */
function generateImagePreview(inputElement) {
    const preview = document.getElementById("upload-preview");
    
    if (inputElement.files && inputElement.files[0]) {
        const fileReaderEngine = new FileReader();
        
        fileReaderEngine.onload = function (eventResult) {
            // Assign complete string stream to network configuration data block cache
            temporaryImageBase64 = eventResult.target.result;
            
            if (preview) {
                preview.src = temporaryImageBase64;
                preview.style.display = "block";
            }
        };
        
        // Execute conversion algorithm matching local storage configurations
        fileReaderEngine.readAsDataURL(inputElement.files[0]);
    }
}
// =========================================================================
// MODULE 4: OPERATIONS CONSOLE AND USER LIFECYCLE EVENT CONTROLLERS
// =========================================================================

/**
 * Intercepts submission events to append new products and pushes data out to Vercel KV
 */
async function processNewProduct(event) {
    event.preventDefault();
    
    const name = document.getElementById("prod-name").value;
    const cat = document.getElementById("prod-cat").value;
    const price = parseInt(document.getElementById("prod-price").value);
    const discount = parseInt(document.getElementById("prod-disc").value);

    if (!temporaryImageBase64) {
        alert("Please browse and attach a premium product media asset file first.");
        return;
    }

    const newProductItem = {
        id: "p_" + Date.now(),
        name: name,
        category: cat,
        price: price,
        discountPrice: discount,
        isLive: true,
        mediaType: 'image',
        asset: temporaryImageBase64
    };

    liveInventoryState.push(newProductItem);
    
    // Core cloud write pipeline block executions
    await pushInventoryStateToCloud();
    renderAdminInventory();
    
    alert(`SUCCESS:\n"${name}" compiled and initialized on live storefront metrics layouts successfully.`);
    document.getElementById("product-upload-form").reset();
    document.getElementById("upload-preview").style.display = "none";
    temporaryImageBase64 = "";
}

/**
 * Compiles current customer orders and tracks verified banking reference strings
 */
function renderAdminOrders() {
    const targetTableBody = document.getElementById("orders-log-target");
    if (!targetTableBody) return;
    
    if (liveOrdersState.length === 0) {
        targetTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:30px;">All incoming transaction pipelines complete. Outstanding queues clear!</td></tr>`;
        return;
    }
    
    targetTableBody.innerHTML = liveOrdersState.map((order, index) => `
        <tr>
            <td style="font-weight: 700; color: #3b82f6;">#${order.id || 'IT-ORD'}</td>
            <td>
                <div style="font-weight: 700; color:#ffffff;">${order.name}</div>
                <div style="font-size: 12px; color: #94a3b8;">${order.phone}</div>
            </td>
            <td style="max-width: 220px; font-size: 13px; color: #cbd5e1;">${order.address}</td>
            <td><span class="badge ${order.mop === 'ONLINE' ? 'badge-success' : 'badge-warning'}">${order.mop}</span></td>
            <td style="font-family: monospace; font-weight: 700; color: #f59e0b; letter-spacing: 0.5px; font-size:13px;">${order.utr || 'N/A'}</td>
            <td><button class="action-icon-btn" style="color:#10b981; font-weight:bold;" onclick="fulfillOrder(${index})">✅ Ship</button></td>
        </tr>
    `).join('');
}

async function toggleProductVisibility(index) {
    liveInventoryState[index].isLive = !liveInventoryState[index].isLive;
    await pushInventoryStateToCloud();
}

async function deleteInventoryItem(index) {
    if (confirm("Confirm security pipeline action: Unlist and remove this component from active storefront matrices?")) {
        liveInventoryState.splice(index, 1);
        await pushInventoryStateToCloud();
        renderAdminInventory();
    }
}

async function fulfillOrder(index) {
    alert("Order shipment logs synchronized. Generating digital invoicing tokens.");
    liveOrdersState.splice(index, 1);
    
    try {
        await fetch(`${API_BASE_ENDPOINT}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(liveOrdersState)
        });
    } catch (e) {
        console.error("Order sync logging operational failure:", e);
    }
    renderAdminOrders();
}

// AUTO-INITIALIZE ADMINISTRATIVE SYSTEM LAYERS ON DOCUMENT RENDERING BOUNDS
window.onload = function() {
    pullMasterDatabaseArrays();
    
    const formElement = document.getElementById("product-upload-form");
    if (formElement) formElement.addEventListener("submit", processNewProduct);
};
