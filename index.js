require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');

// The usual suspension buzzwords.
const SUSPENSION_KEYWORDS = [
  'suspended',
  'suspension',
  'reinstate',
  'taken down',
  'disabled',
  'appeal',
  'rejected',
  'denied',
  'escalation'
];

const THREADS_URL = 'https://support.google.com/business/threads?hl=en';

async function scrapeThreads() {
  console.log('Fetching Google Business support threads...');

  // Plain User-Agent so we get the normal HTML.
  const { data } = await axios.get(THREADS_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });

  const $ = cheerio.load(data);
  const threads = [];
  const seen = new Set();

  // Grab thread links, kill dupes.
  $('a[href*="/business/thread/"]').each((i, el) => {
    const href = $(el).attr('href');
    if (seen.has(href)) return;
    seen.add(href);

    const text = $(el).text().trim();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 1) return;

    const title = lines[0];
    const snippet = lines.slice(1).find(l => !l.includes('Recommended') && !l.includes('Replies') && !l.includes('Upvotes')) || '';
    const replyMatch = text.match(/(\d+)\s*Repl/i);
    const replies = replyMatch ? parseInt(replyMatch[1]) : 0;

    const fullText = (title + ' ' + snippet).toLowerCase();
    const isSuspensionRelated = SUSPENSION_KEYWORDS.some(kw => fullText.includes(kw));

    if (isSuspensionRelated) {
      threads.push({
        title,
        content: snippet.substring(0, 150),
        replyCount: replies,
        url: 'https://support.google.com' + href
      });
    }
  });

  // Low replies = fresh leads.
  threads.sort((a, b) => a.replyCount - b.replyCount);
  const topLeads = threads.slice(0, 3);

  console.log('Found ' + threads.length + ' suspension-related threads. Top 3 leads:');
  topLeads.forEach((lead, i) => {
    console.log((i + 1) + '. ' + lead.title + ' (' + lead.replyCount + ' replies)');
  });

  return topLeads;
}

function formatLeadsEmail(leads) {
  // Straightforward HTML email, inline styles so clients don't choke.
  const leadsHtml = leads.map((lead, i) => `
    <div style="margin: 20px 0; padding: 15px; border: 2px solid #ff4444; background: #1a1a1a; border-radius: 4px;">
      <div style="color: #ff4444; font-size: 18px; font-weight: bold; margin-bottom: 10px;">
        LEAD #${i + 1}
      </div>
      <a href="${lead.url}" style="color: #ffaa00; font-weight: bold; margin-bottom: 8px; display: block; text-decoration: none;">
        ${lead.title}
      </a>
      <div style="color: #cccccc; margin-bottom: 10px; font-size: 13px;">
        ${lead.content}
      </div>
      <div style="color: #888888; font-size: 12px;">
        ⚡ Replies: <span style="color: #00ff00;">${lead.replyCount}</span>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { background: #0a0a0a; color: #cccccc; font-family: 'Monaco', monospace; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a1a; padding: 20px; border-left: 4px solid #ff4444; margin-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; color: #ff4444; margin: 0; }
        .timestamp { color: #888888; font-size: 12px; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">🎯 GBP SUSPENSION LEADS</div>
          <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
        </div>
        <div class="content">
          ${leadsHtml}
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333333; color: #888888; font-size: 12px;">
          <p>🔗 Source: <a href="${leads[0]?.url || 'https://support.google.com/business/threads'}" style="color: #ffaa00; text-decoration: none;">Google Business Support</a></p>
          <p style="margin: 0;">Powered by example.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendEmail(leads) {
  // No creds? No email. Bail fast.
  if (!process.env.ZOHO_USER || !process.env.ZOHO_PASS) {
    console.error('Error: ZOHO_USER or ZOHO_PASS not set in environment variables');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.ZOHO_USER,
      pass: process.env.ZOHO_PASS
    }
  });

  const emailContent = formatLeadsEmail(leads);

  const mailOptions = {
    from: process.env.ZOHO_USER,
    to: process.env.ZOHO_USER,
    subject: `🎯 GBP Suspension Leads - ${new Date().toLocaleDateString()}`,
    html: emailContent
  };

  try {
    console.log('Sending email via Zoho SMTP...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
  } catch (error) {
    console.error('Error sending email:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('Starting GBP suspension lead scraper...\n');

  const leads = await scrapeThreads();

  if (leads.length === 0) {
    console.log('No suspension-related threads found.');
    process.exit(0);
  }

  await sendEmail(leads);
  console.log('\nScraper completed successfully.');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
