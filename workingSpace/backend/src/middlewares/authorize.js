const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const userRoles = req.user.roles || [];
    
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({ 
        error: { 
          message: 'Forbidden: Insufficient permissions' 
        } 
      });
    }

    next();
  };
};

module.exports = authorize;
