// api/admin.js
import { Redis } from '@upstash/redis';
import { v2 as cloudinary } from 'cloudinary';

// 1. Initialize structural connection parameters straight to Upstash Redis Node
const upstash = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 2. Configure media storage layer for gallery assets uploaded from admin portal
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Base configuration master handler router
export default async function handler(req, res) {
  const { method } = req;
  const { action, id } = req.query;

  try {
    // Pipeline routing rules proceed below...
    // ---------------------------------------------------------
    // 1. PUBLIC STOREFRONT FEED: PULL CATALOG FROM UPSTASH
    // ---------------------------------------------------------
    if (method === 'GET' && !action) {
      // Fetch all unique product tokens recorded under the master tracker index
      const activeSkus = await upstash.smembers('telecom:master_skus');
      if (!activeSkus || activeSkus.length === 0) return res.status(200).json([]);

      // Batch query every product hash concurrently using an atomic database pipeline
      const pipeline = upstash.pipeline();
      activeSkus.forEach(sku => {
        pipeline.hgetall(`telecom:catalog:${sku}`);
      });
      
      const rawCatalog = await pipeline.exec();
      const filteredCatalog = rawCatalog.filter(Boolean); // Filter empty data blocks safely
      return res.status(200).json(filteredCatalog);
    }

    // ---------------------------------------------------------
    // 2. ADMINISTRATIVE OVERHEAD: PERMANENT PRODUCT PURGE
    // ---------------------------------------------------------
    if (method === 'DELETE' && action === 'purge-product') {
      if (!id) return res.status(400).json({ error: 'Missing critical SKU token reference.' });
      
      // Wipe the product hash map and clear its index identifier from the tracking set
      await upstash.del(`telecom:catalog:${id}`);
      await upstash.srem('telecom:master_skus', id);
      
      return res.status(200).json({ success: true, message: 'Asset wiped cleanly from global state maps' });
    }
    // ---------------------------------------------------------
    // 3. PRODUCT UPSERT ENGINE: PROCESS INCOMING MULTIMEDIA
    // ---------------------------------------------------------
    if (method === 'POST' && action === 'upsert-product') {
      const { title, tag, category, currentPrice, strikePrice, stock, badge, imageUrl } = req.body;
      const itemId = req.body.id || `sku_${Date.now()}`;

      let dynamicGalleryUrls = [];

      // Parse and decode incoming Base64 media files from the gallery upload
      if (imageUrl) {
        try {
          const rawImagesArray = imageUrl.startsWith('[') ? JSON.parse(imageUrl) : [imageUrl];
          
          for (const base64Asset of rawImagesArray) {
            if (base64Asset.startsWith('data:image')) {
              const cloudAsset = await cloudinary.uploader.upload(base64Asset, {
                folder: 'indian_telecom_store',
              });
              dynamicGalleryUrls.push(cloudAsset.secure_url);
            } else {
              dynamicGalleryUrls.push(base64Asset);
            }
          }
        } catch (parseError) {
          console.error("Gallery asset decoding interrupted:", parseError);
        }
      }

      // Fallback placeholder image configuration rule
      const validatedThumbnail = dynamicGalleryUrls.length > 0 
        ? dynamicGalleryUrls[0] 
        : 'https://unsplash.com';

      const structuredPayload = {
        id: itemId,
        title,
        tag: tag || '',
        category: category.toLowerCase(),
        currentPrice: parseFloat(currentPrice) || 0,
        strikePrice: strikePrice ? parseFloat(strikePrice) : '',
        stock: parseInt(stock) || 0,
        badge: badge || '',
        imageUrl: validatedThumbnail,
        galleryUrls: JSON.stringify(dynamicGalleryUrls),
        updatedAt: new Date().toISOString()
      };

      // Write parameters directly into Upstash Redis Hashes
      await upstash.hset(`telecom:catalog:${itemId}`, structuredPayload);
      await upstash.sadd('telecom:master_skus', itemId);

      return res.status(200).json({ success: true, id: itemId });
    }
    // ---------------------------------------------------------
    // 4. CHECKOUT PIPELINE LOG OPERATION: RECEIVE CUSTOMER DATA
    // ---------------------------------------------------------
    if (method === 'POST' && action === 'log-order') {
      const { customer, paymentMode, totalPayable, items } = req.body;
      const orderId = `IT_ORD_${Date.now()}`;
      
      const formalizedOrderPacket = {
        id: orderId,
        customer,
        paymentMode,
        totalPayable: parseFloat(totalPayable) || 0,
        items, // Matrix format array containing specific product rows [ {id, name, qty} ]
        status: 'PENDING',
        timestamp: new Date().toISOString()
      };

      // Push transactional packet straight onto the Upstash orders queue list
      await upstash.rpush('telecom:orders_ledger', JSON.stringify(formalizedOrderPacket));

      // Loop through items inside the pipeline to decrement inventory stock parameters
      for (const orderedItem of items) {
        if (orderedItem.id && orderedItem.id !== 'prod_unknown') {
          const currentStock = await upstash.hget(`telecom:catalog:${orderedItem.id}`, 'stock');
          if (currentStock !== null) {
            const updatedStock = Math.max(0, parseInt(currentStock) - parseInt(orderedItem.qty));
            await upstash.hset(`telecom:catalog:${orderedItem.id}`, { stock: updatedStock });
          }
        }
      }

      return res.status(200).json({ success: true, orderId });
    }

    // ---------------------------------------------------------
    // 5. ADMINISTRATIVE AUDITING MODULE: EXTRACT LIVE CHECKOUTS
    // ---------------------------------------------------------
    if (method === 'GET' && action === 'get-orders') {
      // Pull back list elements sequence mapping from the tracking log matrix
      const rawOrdersArray = await upstash.lrange('telecom:orders_ledger', 0, -1);
      
      // Parse individual element blocks cleanly before updating admin graphs
      const parsedOrders = rawOrdersArray.map(order => 
        typeof order === 'string' ? JSON.parse(order) : order
      );
      
      return res.status(200).json(parsedOrders);
    }

    // Fallback block handler rule for unsupported system routings
    return res.status(405).json({ error: 'System architecture routing mismatch rule triggered' });

  } catch (globalCatchError) {
    console.error("Critical Back-End Internal Error Trace:", globalCatchError);
    return res.status(500).json({ success: false, error: globalCatchError.message });
  }
}
