const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            error: 'Access denied. No token provided.',
            message: 'Please login first'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role
        };
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ 
                error: 'Token expired. Please login again.' 
            });
        }
        return res.status(403).json({ 
            error: 'Invalid token.' 
        });
    }
};

const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Admin access required.',
            message: 'You do not have permission to access this resource'
        });
    }
    next();
};

module.exports = { authenticateToken, isAdmin };