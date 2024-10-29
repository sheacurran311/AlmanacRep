import { TenantManager } from '../../services/tenantManager.js';
export const validateTenantApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({ message: 'API key is required' });
        }
        const tenant = await TenantManager.validateTenantAccess(apiKey);
        req.headers['x-tenant-id'] = tenant.id.toString();
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid API key' });
    }
};
export const requireTenantAccess = async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            return res.status(401).json({ message: 'Tenant access required' });
        }
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Tenant access denied' });
    }
};
