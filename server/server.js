import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { networkInterfaces } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevelopment = NODE_ENV === 'development';

// Configure allowed origins based on environment
const getAllowedOrigins = () => {
  const origins = [];
  
  // Always allow localhost in development
  if (isDevelopment) {
    origins.push(
      'http://localhost:3004',
      'http://127.0.0.1:3004',
      'http://localhost:5173', // Vite dev server
      'http://127.0.0.1:5173'
    );
  }
  
  // Add production domains from environment variables
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(...process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()));
  }
  
  // Add Tailscale IPs if provided
  if (process.env.TAILSCALE_IPS) {
    const tailscaleIps = process.env.TAILSCALE_IPS.split(',').map(ip => ip.trim());
    tailscaleIps.forEach(ip => {
      origins.push(`http://${ip}:3004`);
      origins.push(`https://${ip}:3004`);
    });
  }
  
  return origins;
};

// Configure CORS with security restrictions
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (e.g., mobile apps, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.length === 0 && isDevelopment) {
      // In development with no specific origins, allow all
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log rejected origins for debugging
    console.warn(`CORS: Rejected origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // Cache preflight requests for 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Configure Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts and eval for dev
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket connections
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: !isDevelopment, // Disable in development for easier debugging
}));

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for static assets
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'];
    return staticExtensions.some(ext => req.path.endsWith(ext));
  }
});

// Apply rate limiting to all routes
app.use(limiter);

// Additional security headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Handle all routes by serving index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Fixed port configuration as per CLAUDE.md
const PORT = process.env.PORT || 3004;

// Get local IP addresses for Tailscale
const getLocalIPs = () => {
  const nets = networkInterfaces();
  const results = [];
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
      if (net.family === familyV4Value && !net.internal) {
        results.push(net.address);
      }
    }
  }
  return results;
};

// Start server on fixed port
const startServer = () => {
  const ips = getLocalIPs();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log('🎮 Retro Game Toolbox Server Started!');
    console.log('=' .repeat(50));
    console.log(`🌐 Local: http://localhost:${PORT}`);
    
    if (ips.length > 0) {
      console.log(`🔗 Network: http://${ips[0]}:${PORT}`);
    }
    
    console.log(`📱 Tailscale: Use your Tailscale IP with port ${PORT}`);
    console.log('=' .repeat(50));
    console.log(`🔒 Security: CORS ${isDevelopment ? 'relaxed (dev)' : 'restricted'}, Rate limiting enabled`);
    console.log(`🛡️  Environment: ${NODE_ENV}`);
    
    if (isDevelopment) {
      console.log('⚠️  Development mode: Security restrictions relaxed');
    } else {
      const allowedOrigins = getAllowedOrigins();
      if (allowedOrigins.length > 0) {
        console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
      }
    }
    
    console.log('=' .repeat(50));
    console.log('Press Ctrl+C to stop the server');
  });
};

// Handle server errors
app.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      console.error(`Port ${PORT} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Port ${PORT} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

startServer();