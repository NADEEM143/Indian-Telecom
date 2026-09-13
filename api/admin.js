import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Enable CORS boundaries seamlessly for testing across all interface views
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const dataType = url.searchParams.get('type');

        if (!dataType) {
            return res.status(400).json({ error: "Query type selection parameter mapping is missing." });
        }

        // =========================================================================
        // 🚀 UNIFIED FULL-STACK DATABASE DATATYPE ROUTER CHANNELS
        // =========================================================================
        switch (dataType) {
            
            case 'products':
                if (req.method === 'GET') {
                    const products = await kv.get('it_products') || [];
                    return res.status(200).json(products);
                }
                if (req.method === 'POST') {
                    await kv.set('it_products', req.body);
                    return res.status(200).json({ success: true });
                }
                break;

                        // 🟢 PASTED HERE: INSIDE YOUR FULL-STACK ENDPOINT SWITCH BLOCK IN ADMIN.JS
            case 'orders':
                if (req.method === 'GET') {
                    const orders = await kv.get('it_orders') || [];
                    return res.status(200).json(orders);
                }
                if (req.method === 'POST') {
                    // 🟢 FIXED: Fallback array parsing checks prevent backend array pushing crash loops
                    let currentOrders = await kv.get('it_orders');
                    if (!Array.isArray(currentOrders)) {
                        currentOrders = [];
                    }

                    if (Array.isArray(req.body)) {
                        currentOrders = req.body;
                    } else if (req.body && typeof req.body === 'object') {
                        currentOrders.push(req.body);
                    }

                    await kv.set('it_orders', currentOrders);
                    return res.status(200).json({ success: true });
                }
                break;

                                    case 'users':
                if (req.method === 'GET') {
                    // 1. Download the master user array list from your storage pool
                    let currentUsers = await kv.get('it_users') || [];
                    let databaseHasChanged = false;

                    // 2. GLOBAL RECOVERY CORE: Sweeps through EVERY customer record automatically.
                    // If any user deleted their account, it resets their status back to ACTIVE 
                    // so they NEVER disappear from your admin panel grid and can log in normally.
                    currentUsers = currentUsers.map(user => {
                        if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED' || !user.status) {
                            user.status = 'ACTIVE';
                            databaseHasChanged = true;
                        }
                        return user;
                    });

                    // 3. Save the restored state back to Vercel KV if any hidden records were fixed
                    if (databaseHasChanged) {
                        await kv.set('it_users', currentUsers);
                    }

                    return res.status(200).json(currentUsers);
                }
                if (req.method === 'POST') {
                    let currentUsers = await kv.get('it_users');
                    if (!Array.isArray(currentUsers)) {
                        currentUsers = [];
                    }

                    if (Array.isArray(req.body)) {
                        currentUsers = req.body;
                    } else if (req.body && typeof req.body === 'object') {
                        currentUsers.push(req.body);
                    }

                    await kv.set('it_users', currentUsers);
                    return res.status(200).json({ success: true });
                }
                break;
            case 'recover_accounts':
                if (req.method === 'GET') {
                    let currentUsers = await kv.get('it_users');
                    if (!Array.isArray(currentUsers)) {
                        currentUsers = [];
                    }

                    const targetNumber = '9718439786';
                    
                    // 1. Check if the profile object already exists inside the database collection array
                    const existingUserIndex = currentUsers.findIndex(u => 
                        String(u.phone || '').replace(/\D/g, '').trim() === targetNumber
                    );

                    if (existingUserIndex !== -1) {
                        // Profile found: Force update all properties back onto functional states instantly
                        currentUsers[existingUserIndex].status = 'ACTIVE';
                        currentUsers[existingUserIndex].name = 'Md Fakhre Alam';
                        currentUsers[existingUserIndex].password = '123456'; // 🔐 Set to a temporary clean password
                    } else {
                        // Profile missing: Force inject a clean new database row record object natively
                        const freshProfileRecord = {
                            id: "U_FORCED_" + Date.now(),
                            name: "Md Fakhre Alam",
                            phone: targetNumber,
                            password: "123456", // 🔐 Set to a temporary clean password
                            status: "ACTIVE"
                        };
                        currentUsers.push(freshProfileRecord);
                    }

                    // 2. Also ensure your secondary testing user is active to prevent regression errors
                    const testUserIndex = currentUsers.findIndex(u => String(u.phone || '').replace(/\D/g, '').trim() === '9330301096');
                    if (testUserIndex !== -1) {
                        currentUsers[testUserIndex].status = 'ACTIVE';
                        currentUsers[testUserIndex].password = 'mdkamrealam';
                        currentUsers[testUserIndex].name = 'Md kamre alam';
                    }

                    await kv.set('it_users', currentUsers);
                    return res.status(200).json({ 
                        success: true, 
                        message: "DATABASE FORCED INJECTION COMPLETED: Account 9718439786 has been successfully force-injected or updated to ACTIVE status!" 
                    });
                }
                break;
            // =========================================================================

            // =========================================================================
            // =========================================================================

            case 'history':
                if (req.method === 'GET') {
                    const history = await kv.get('it_order_history') || [];
                    return res.status(200).json(history);
                }
                if (req.method === 'POST') {
                    await kv.set('it_order_history', req.body);
                    return res.status(200).json({ success: true });
                }
                break;

                        case 'banner_msg':
                if (req.method === 'GET') {
                    const bannerData = await kv.get('it_live_banner_msg') || { message: "MEGA OFFER: FLAT 30% OFF ON PREMIUM CHARGERS & COVERS! LIMITED STOCK!" };
                    return res.status(200).json(bannerData);
                }
                if (req.method === 'POST') {
                    await kv.set('it_live_banner_msg', req.body);
                    return res.status(200).json({ success: true });
                }
                break;

            case 'abandoned_carts':
                if (req.method === 'GET') {
                    const cartsMap = await kv.get('it_abandoned_carts_registry') || {};
                    return res.status(200).json(Object.values(cartsMap));
                }
                if (req.method === 'POST') {
                    const clientPhoneId = url.searchParams.get('phone');
                    if (!clientPhoneId) return res.status(400).json({ error: "Missing identity token." });
                    
                    let cartsMap = await kv.get('it_abandoned_carts_registry') || {};
                    cartsMap[clientPhoneId] = req.body; // Map user phone to their active item array
                    
                    await kv.set('it_abandoned_carts_registry', cartsMap);
                    return res.status(200).json({ success: true });
                }
                if (req.method === 'DELETE') {
                    const clientPhoneId = url.searchParams.get('phone');
                    let cartsMap = await kv.get('it_abandoned_carts_registry') || {};
                    delete cartsMap[clientPhoneId]; // Drop bag profile record upon conversion to order success
                    
                    await kv.set('it_abandoned_carts_registry', cartsMap);
                    return res.status(200).json({ success: true });
                }
                break;
                            // 🔒 SECURE CUSTOMER SIDE PROFILE AND ACCOUNT SECURITY MODIFIERS ENGINE
            case 'update_profile':
                if (req.method === 'POST') {
                    const { phone, name, password, address, action } = req.body;
                    
                    if (!phone) {
                        return res.status(400).json({ error: "Missing customer identification phone token." });
                    }

                    let currentUsers = await kv.get('it_users');
                    if (!Array.isArray(currentUsers)) {
                        currentUsers = [];
                    }

                                        const userIndex = currentUsers.findIndex(u => String(u.phone).replace(/\D/g, '') === String(phone).replace(/\D/g, ''));
                    if (userIndex === -1) {
                        return res.status(404).json({ error: "Account profile record registry not found." });
                    }

                    // Action Parameter Rule A: Handle request to wipe/reset profile information fields cleanly without hiding records
                    if (action === 'DELETE_ACCOUNT') {
                        // 🟢 FIXED: Soft resets sensitive data fields so the user row stays fully visible in your Admin Dashboard list!
                        currentUsers[userIndex].password = "WIPED_" + Math.floor(1000 + Math.random() * 9000);
                        currentUsers[userIndex].name = "Deactivated Account";
                        currentUsers[userIndex].defaultAddress = "";
                        currentUsers[userIndex].status = 'DEACTIVATED'; 
                        
                        await kv.set('it_users', currentUsers);
                        return res.status(200).json({ success: true, message: "Account profile records cleared safely." });
                    }

                    // Action Parameter Rule B: Standard text updates mapping name, password mutations, and saved locations
                                       if (name) currentUsers[userIndex].name = name;
                    if (password) currentUsers[userIndex].password = password;
                    if (address !== undefined) currentUsers[userIndex].defaultAddress = address;

                    await kv.set('it_users', currentUsers);
                    return res.status(200).json({ success: true, updatedUser: currentUsers[userIndex] });
                }
                break;

            // =========================================================================
            // 🚀 INTEGRATED DATABASE RECOVERY SEGMENT (REPAIRS SUSPENDED RECORDS)
            // =========================================================================
            case 'restore_users':
                if (req.method === 'GET') {
                    let currentUsers = await kv.get('it_users');
                    if (!Array.isArray(currentUsers)) {
                        currentUsers = [];
                    }
                    let modifiedCount = 0;

                    // Force convert any 'SUSPENDED' or hidden status flags back to active parameters
                    currentUsers = currentUsers.map(user => {
                        if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED' || !user.status) {
                            user.status = 'ACTIVE';
                            
                            // Explicit recovery rule targets for your custom profile records choice checks
                            if (String(user.phone).trim() === '9330301096') {
                                user.password = 'mdkamrealam';
                                user.name = 'Md kamre alam';
                            }
                            modifiedCount++;
                        }
                        return user;
                    });

                    await kv.set('it_users', currentUsers);
                    return res.status(200).json({ 
                        success: true, 
                        message: `Fixed ${modifiedCount} database account rows! Your records are now fully active and visible in the Admin Panel.` 
                    });
                }
                break;

            case 'export_products':
                if (req.method === 'GET') {
                    // Downloads the raw data array bypassing Upstash layout restrictions
                    const databaseProducts = await kv.get('it_products') || [];
                    
                    // Returns a clean, readable text structure to your browser window
                    return res.status(200).json({
                        totalItemsFound: databaseProducts.length,
                        products: databaseProducts
                    });
                }
                break;

            default:
                return res.status(400).json({ error: `Invalid datatype target mapping '${dataType}' specified.` });
        }

    } catch (error) {
        return res.status(500).json({ error: "Vercel KV Cloud Server Framework Exception", details: error.message });
    }
}
