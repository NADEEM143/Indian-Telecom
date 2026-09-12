import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    try {
        let currentUsers = await kv.get('it_users') || [];
        
        // Loop through all users and restore any suspended/hidden state records natively
        let restoredCount = 0;
        currentUsers = currentUsers.map(user => {
            if (user.status === 'SUSPENDED') {
                user.status = 'ACTIVE'; // Changes status flags back to operational
                restoredCount++;
            }
            return user;
        });

        await kv.set('it_users', currentUsers);
        return res.status(200).json({ success: true, message: `Successfully recovered ${restoredCount} account profiles back onto the store database registries!` });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
