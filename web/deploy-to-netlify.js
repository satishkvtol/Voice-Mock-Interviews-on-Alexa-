import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const token = 'nfp_QFVRS6iAhmrBKoVxhgZHqUhNn3hNFwZbfbd2';

async function deployToNetlify() {
  console.log('🚀 Starting Automated Netlify Deployment...');

  try {
    // 1. Create a new site on Netlify
    console.log('🔹 1. Registering new site on Netlify API...');
    const siteRes = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `interview-dojo-voice-${Date.now().toString().slice(-6)}`,
      }),
    });

    const siteData = await siteRes.json();
    if (!siteRes.ok) {
      throw new Error(siteData.message || 'Failed to create site on Netlify');
    }

    console.log(`✅ Site Created! Name: ${siteData.name}`);
    console.log(`🌐 Live URL: ${siteData.ssl_url || siteData.url}`);

    // 2. Deploy dist folder files via Netlify CLI
    console.log('\n🔹 2. Deploying dist assets to production...');
  } catch (err) {
    console.error('❌ Deployment error:', err.message);
  }
}

deployToNetlify();
