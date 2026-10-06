const token = 'nfp_QFVRS6iAhmrBKoVxhgZHqUhNn3hNFwZbfbd2';
const siteId = 'e29a15d8-0a04-4682-9f18-761b4b56f84c';

async function disablePassword() {
  console.log('Disabling Netlify site password & team protection...');

  // 1. Delete site password
  const res1 = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/site_passwords`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('DELETE password status:', res1.status);

  // 2. Patch site settings
  const res2 = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      processing_settings: {
        html: {
          pretty_urls: true,
        },
      },
      password: null,
      sso_enabled: false,
    }),
  });

  console.log('PATCH status:', res2.status);
}

disablePassword();
