// 1. GLOBAL STATE MATRIX CONFIGURATION
let liveInventoryState = JSON.parse(localStorage.getItem('IT_INVENTORY')) || [
    { id: "p1", name: "Premium Carbon MagSafe Shield", category: "Cases", price: 1899, discountPrice: 1199, isLive: true, mediaType: 'icon', asset: "📱" },
    { id: "p2", name: "65W GaN Super Fast Charger", category: "Chargers", price: 2499, discountPrice: 1649, isLive: true, mediaType: 'icon', asset: "🔌" }
];

let liveOrdersState = JSON.parse(localStorage.getItem('IT_ORDERS')) || [
    { id: "IT-8842", name: "Aman Verma", phone: "9810452391", address: "H-42, Pocket 3, Sector 15, Rohini, New Delhi", mop: "ONLINE", utr: "349102847561" },
    { id: "IT-8843", name: "Rahul Sharma", phone: "8800124956", address: "Flat 204, Royal Apartments, Indirapuram, Ghaziabad", mop: "COD", utr: "N/A" }
];

let temporaryImageBase64 = "";

// 2. STATE PERSISTENCE HARDENING HASH
function commitStateToStorage() {
    localStorage.setItem('IT_INVENTORY', JSON.stringify(liveInventoryState));
    localStorage.setItem('IT_ORDERS', JSON.stringify(liveOrdersState));
}
// 3. SECURE LOCAL DEVICE FILE READER STREAM
function generateImagePreview(inputElement) {
    const preview = document.getElementById("upload-preview");
    if (inputElement.files && inputElement.files[0]) {
        const fileReaderEngine = new FileReader();
        
        fileReaderEngine.onload = function (eventResult) {
            temporaryImageBase64 = eventResult.target.result;
            if (preview) {
                preview.src = temporaryImageBase64;
                preview.style.display = "block";
            }
        };
        fileReaderEngine.readAsDataURL(inputElement.files[0]);
    }
}

// 4. INVENTORY RENDER DOM MATRIX
function renderAdminInventory() {
    const targetTableBody = document.getElementById("inventory-list-target");
    if (!targetTableBody) return;
    
    targetTableBody.innerHTML = liveInventoryState.map((item, index) => `
        <tr>
            <td>
                <div class="row-item-meta">
                    <div class="row-thumb">${item.mediaType === 'icon' ? item.asset : `<img src="${item.asset}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">`}</div>
                    <div style="font-weight: 700;">${item.name}</div>
                </div>
            </td>
            <td>${item.category}</td>
            <td><strong>₹${item.discountPrice}</strong> <span style="font-size:12px; color:#64748b; text-decoration:line-through;">₹${item.price}</span></td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" ${item.isLive ? 'checked' : ''} onchange="toggleProductVisibility(${index})">
                    <span class="slider"></span>
                </label>
            </td>
            <td><button class="action-icon-btn" onclick="deleteInventoryItem(${index})">🗑️</button></td>
        </tr>
    `).join('');
}
// 5. PRODUCT PACKAGING AND INJECTION MANAGEMENT
function processNewProduct(event) {
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
    commitStateToStorage();
    renderAdminInventory();
    
    alert(`SUCCESS:\n"${name}" compiled and initialized on live storefront metrics layout configuration successfully.`);
    document.getElementById("product-upload-form").reset();
    document.getElementById("upload-preview").style.display = "none";
    temporaryImageBase64 = "";
}

// 6. ORDER QUEUE COMPILER MATRIX
function renderAdminOrders() {
    const targetTableBody = document.getElementById("orders-log-target");
    if (!targetTableBody) return;
    
    targetTableBody.innerHTML = liveOrdersState.map((order, index) => `
        <tr>
            <td style="font-weight: 700; color: #3b82f6;">#${order.id}</td>
            <td>
                <div style="font-weight: 700;">${order.name}</div>
                <div style="font-size: 12px; color: #94a3b8;">${order.phone}</div>
            </td>
            <td style="max-width: 220px; font-size: 13px; color: #cbd5e1;">${order.address}</td>
            <td><span class="badge ${order.mop === 'ONLINE' ? 'badge-success' : 'badge-warning'}">${order.mop}</span></td>
            <td style="font-family: monospace; font-weight: 700; color: #f59e0b; letter-spacing: 0.5px;">${order.utr}</td>
            <td><button class="action-icon-btn" onclick="fulfillOrder(${index})">✅ Ship</button></td>
        </tr>
    `).join('');
}

// 7. INTERACTIVE SWITCH OPERATIONS LIFECYCLE
function toggleProductVisibility(index) {
    liveInventoryState[index].isLive = !liveInventoryState[index].isLive;
    commitStateToStorage();
}

function deleteInventoryItem(index) {
    if (confirm("Confirm security pipeline action: Unlist and remove this component from active storefront matrices?")) {
        liveInventoryState.splice(index, 1);
        commitStateToStorage();
        renderAdminInventory();
    }
}

function fulfillOrder(index) {
    alert("Order shipment logs synchronized. Generating digital invoicing tokens.");
    liveOrdersState.splice(index, 1);
    commitStateToStorage();
    renderAdminOrders();
}

// 8. AUTO-INITIALIZE ADMINISTRATIVE SYSTEM LAYERS
window.onload = function() {
    renderAdminInventory();
    renderAdminOrders();
    
    const formElement = document.getElementById("product-upload-form");
    if (formElement) formElement.addEventListener("submit", processNewProduct);
};
