export const validateLoginInput = (req, res, next) => {
    const { email, password, tenantId } = req.body;
    if (!email || !password || !tenantId) {
        return res.status(400).json({
            message: 'Email, password, and tenant ID are required'
        });
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            message: 'Invalid email format'
        });
    }
    next();
};
