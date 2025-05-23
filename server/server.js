import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { networkInterfaces } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for all origins (needed for Tailscale access)
app.use(cors());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Handle all routes by serving index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Function to find an available port
const findAvailablePort = () => {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
};

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

// Start server with random port
const startServer = async () => {
  const port = await findAvailablePort();
  const ips = getLocalIPs();
  
  app.listen(port, '0.0.0.0', () => {
    console.log('🎮 Retro Game Toolbox Server Started!');
    console.log('=' .repeat(50));
    console.log(`🌐 Local: http://localhost:${port}`);
    
    if (ips.length > 0) {
      console.log(`🔗 Network: http://${ips[0]}:${port}`);
    }
    
    console.log(`📱 Tailscale: Use your Tailscale IP with port ${port}`);
    console.log('=' .repeat(50));
    console.log('Press Ctrl+C to stop the server');
  });
};

startServer().catch(console.error);