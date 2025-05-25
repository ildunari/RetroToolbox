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
const isDev = process.env.NODE_ENV !== 'production';

// Security: Rate limiting to prevent DoS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 100, // limit each IP to 100 requests per windowMs in prod, 1000 in dev
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security: Apply rate limiting to all requests
app.use(limiter);

// Security: Helmet for basic security headers
app.use(helmet({
  contentSecurityPolicy: isDev ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false // Needed for some game features
}));

// Security: CORS configuration with whitelist
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:8940',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:8940',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
];

// Add Tailscale and local network IPs to allowed origins
const localIPs = getLocalIPs();
localIPs.forEach(ip => {
  allowedOrigins.push(`http://${ip}:3000`);
  allowedOrigins.push(`http://${ip}:3001`);
  allowedOrigins.push(`http://${ip}:8940`);
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (isDev) return callback(null, true);
    
    // Check if origin is in whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Tailscale domains
    if (origin.includes('.ts.net')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Basic request validation and parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API endpoints with basic validation
app.get('/api/status', (req, res) => {
  res.json({
    server: 'Retro Game Toolbox',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist'), {
  maxAge: isDev ? 0 : '1d', // Cache static files in production
  etag: true,
  lastModified: true
}));

// Handle all routes by serving index.html (SPA)
app.get('*', (req, res) => {
  // Basic path validation to prevent directory traversal
  if (req.path.includes('..') || req.path.includes('\\')) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  
  // Don't leak error details in production
  const message = isDev ? err.message : 'Internal server error';
  
  res.status(err.status || 500).json({
    error: message,
    timestamp: new Date().toISOString()
  });
});

// Get local IP addresses for Tailscale
function getLocalIPs() {
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
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Starting graceful shutdown...');
  server.close(() => {
    console.log('✅ Server closed. Process terminating.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Starting graceful shutdown...');
  server.close(() => {
    console.log('✅ Server closed. Process terminating.');
    process.exit(0);
  });
});

// Start server
const startServer = async () => {
  const port = process.env.PORT || 3001;
  const ips = getLocalIPs();
  
  const server = app.listen(port, '0.0.0.0', () => {
    console.log('🎮 Retro Game Toolbox Server Started!');
    console.log('=' .repeat(50));
    console.log(`🌐 Local: http://localhost:${port}`);
    console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🛡️  Security: Rate limiting enabled (${isDev ? '1000' : '100'} req/15min)`);
    
    if (ips.length > 0) {
      console.log(`🔗 Network: http://${ips[0]}:${port}`);
    }
    
    console.log(`📱 Tailscale: Use your Tailscale IP with port ${port}`);
    console.log(`🩺 Health check: http://localhost:${port}/health`);
    console.log('=' .repeat(50));
    console.log('Press Ctrl+C to stop the server');
  });

  // Handle server errors
  server.on('error', (err) => {
    console.error('❌ Server error:', err.message);
    process.exit(1);
  });

  return server;
};

const server = await startServer().catch(console.error);