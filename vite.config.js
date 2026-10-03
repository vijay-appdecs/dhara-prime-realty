import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';

function whatsappApiPlugin(env) {
  return {
    name: 'whatsapp-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/send-whatsapp', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              console.log('\n======================================================');
              console.log('📲 [WHATSAPP DIRECT AUTOMATION] Outgoing Notification:');
              console.log(`To Customer Mobile: +${data.customerPhone}`);
              console.log(`Customer Name:     ${data.customerName}`);
              console.log(`Property Tour:     ${data.projectName}`);
              console.log(`Scheduled Slot:    ${data.date} at ${data.time}`);
              if (data.requirements) {
                console.log(`Requirements:      ${data.requirements}`);
              }
              console.log('------------------------------------------------------');
              console.log(data.message);
              console.log('======================================================\n');

              let dispatchedLive = false;
              let liveProvider = 'simulation';
              let liveResponse = null;

              // 1. UltraMsg Live Integration (https://ultramsg.com)
              const ultramsgInstance = (process.env.ULTRAMSG_INSTANCE_ID || env.ULTRAMSG_INSTANCE_ID || '').trim();
              const ultramsgToken = (process.env.ULTRAMSG_TOKEN || env.ULTRAMSG_TOKEN || '').trim();
              if (ultramsgInstance && ultramsgToken) {
                try {
                  console.log(`🚀 [UltraMsg] Dispatching live WhatsApp message to +${data.customerPhone}...`);
                  const params = new URLSearchParams();
                  params.append('token', ultramsgToken);
                  params.append('to', `+${data.customerPhone}`);
                  params.append('body', data.message);

                  const umRes = await fetch(`https://api.ultramsg.com/${ultramsgInstance}/messages/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params.toString()
                  });
                  const umData = await umRes.json();
                  console.log('✅ [UltraMsg API Response]:', umData);
                  dispatchedLive = true;
                  liveProvider = 'UltraMsg';
                  liveResponse = umData;
                } catch (umErr) {
                  console.error('❌ [UltraMsg Error]:', umErr.message);
                }
              }

              // 2. Green-API Live Integration (https://green-api.com)
              const greenApiId = (process.env.GREEN_API_ID_INSTANCE || env.GREEN_API_ID_INSTANCE || '').trim();
              const greenApiToken = (process.env.GREEN_API_TOKEN_INSTANCE || env.GREEN_API_TOKEN_INSTANCE || '').trim();
              if (!dispatchedLive && greenApiId && greenApiToken) {
                try {
                  console.log(`🚀 [Green-API] Dispatching live WhatsApp message to +${data.customerPhone}...`);
                  const greenRes = await fetch(`https://api.green-api.com/waInstance${greenApiId}/sendMessage/${greenApiToken}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chatId: `${data.customerPhone}@c.us`,
                      message: data.message
                    })
                  });
                  const greenData = await greenRes.json();
                  console.log('✅ [Green-API Response]:', greenData);
                  dispatchedLive = true;
                  liveProvider = 'Green-API';
                  liveResponse = greenData;
                } catch (greenErr) {
                  console.error('❌ [Green-API Error]:', greenErr.message);
                }
              }

              // 3. Webhook Integration (Zapier / Make / Pabbly)
              const webhookUrl = (process.env.WHATSAPP_WEBHOOK_URL || env.WHATSAPP_WEBHOOK_URL || '').trim();
              if (webhookUrl && webhookUrl.startsWith('http')) {
                try {
                  await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                  });
                  console.log('✅ [Webhook Forwarded]:', webhookUrl);
                  dispatchedLive = true;
                  liveProvider = liveProvider === 'simulation' ? 'Webhook' : liveProvider;
                } catch (webhookErr) {
                  console.error('⚠️ [Webhook Error]:', webhookErr.message);
                }
              }

              if (!dispatchedLive) {
                console.log('⚠️ [ACTION REQUIRED TO RECEIVE ON PHYSICAL PHONE]:');
                console.log(`Real WhatsApp message was NOT delivered to +${data.customerPhone} because your .env is empty.`);
                console.log('To make WhatsApp actually deliver to your phone:');
                console.log('👉 1. Sign up at https://ultramsg.com and scan the QR code with WhatsApp');
                console.log('👉 2. Open c:\\projects\\dhara\\.env and paste:');
                console.log('      ULTRAMSG_INSTANCE_ID=instanceXXXXX');
                console.log('      ULTRAMSG_TOKEN=your_token_here\n');
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                status: dispatchedLive ? 'delivered_live' : 'simulated_local',
                provider: liveProvider,
                recipient: data.customerPhone,
                details: liveResponse,
                message: dispatchedLive 
                  ? `Live WhatsApp notification delivered to +${data.customerPhone} via ${liveProvider}!` 
                  : `Local dev mode. Add your UltraMsg credentials in .env to deliver real messages to your phone.`,
                timestamp: new Date().toISOString()
              }));
            } catch (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      whatsappApiPlugin(env)
    ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        services: resolve(__dirname, 'services.html'),
        serviceCommercial: resolve(__dirname, 'service-commercial.html'),
        serviceAdvisory: resolve(__dirname, 'service-advisory.html'),
        serviceMarketing: resolve(__dirname, 'service-marketing.html'),
        serviceInvestments: resolve(__dirname, 'service-investments.html'),
        serviceMandates: resolve(__dirname, 'service-mandates.html'),
        serviceResidential: resolve(__dirname, 'service-residential.html'),
        serviceTransaction: resolve(__dirname, 'service-transaction.html'),
        servicePostCare: resolve(__dirname, 'service-post-care.html'),
        projects: resolve(__dirname, 'projects.html'),
        propertyDetail: resolve(__dirname, 'property-detail.html'),
        contact: resolve(__dirname, 'contact.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: false,
    watch: {
      ignored: ['**/scratch/**', '**/.tempmediaStorage/**']
    }
  },
  };
});
