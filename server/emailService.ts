import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface MatchNotificationData {
  companyName: string;
  investorName: string;
  investorEmail: string;
  matchScore: number;
  sectorScore: number;
  stageScore: number;
  geoScore: number;
  tractionScore: number;
  checkSizeScore: number;
  thesisScore: number;
  matchReasons: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      SMTP_FROM,
    } = process.env;

    // Check if SMTP is configured
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn('[EmailService] SMTP not configured. Email notifications disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587'),
        secure: SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      this.isConfigured = true;
      console.log('[EmailService] Email service initialized successfully');
    } catch (error) {
      console.error('[EmailService] Failed to initialize:', error);
    }
  }

  async sendMatchNotification(data: MatchNotificationData): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.warn('[EmailService] Cannot send email - service not configured');
      return false;
    }

    try {
      const html = this.generateMatchEmailHTML(data);
      const subject = `🎯 High-Quality Match Found: ${data.investorName} (${data.matchScore}% match)`;

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER,
        subject,
        html,
      });

      console.log(`[EmailService] Match notification sent for ${data.companyName} <> ${data.investorName}`);
      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error);
      return false;
    }
  }

  private generateMatchEmailHTML(data: MatchNotificationData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Match Found</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .match-score {
      font-size: 48px;
      font-weight: bold;
      color: #10b981;
      margin: 20px 0;
    }
    .score-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .score-item {
      background: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .score-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .score-value {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
    }
    .info-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 15px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 30px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 28px;">🎯 High-Quality Match Found!</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">A new investor match has been identified</p>
  </div>
  
  <div class="content">
    <div class="match-score">${data.matchScore}%</div>
    <p style="text-align: center; color: #6b7280; margin-top: -10px;">Overall Match Score</p>
    
    <div class="info-section">
      <div class="info-label">Company</div>
      <div class="info-value">${data.companyName}</div>
      
      <div class="info-label">Investor</div>
      <div class="info-value">${data.investorName}</div>
      
      <div class="info-label">Contact</div>
      <div class="info-value">${data.investorEmail}</div>
    </div>
    
    <div class="score-grid">
      <div class="score-item">
        <div class="score-label">Sector</div>
        <div class="score-value">${data.sectorScore}%</div>
      </div>
      <div class="score-item">
        <div class="score-label">Stage</div>
        <div class="score-value">${data.stageScore}%</div>
      </div>
      <div class="score-item">
        <div class="score-label">Geography</div>
        <div class="score-value">${data.geoScore}%</div>
      </div>
      <div class="score-item">
        <div class="score-label">Traction</div>
        <div class="score-value">${data.tractionScore}%</div>
      </div>
      <div class="score-item">
        <div class="score-label">Check Size</div>
        <div class="score-value">${data.checkSizeScore}%</div>
      </div>
      <div class="score-item">
        <div class="score-label">Thesis</div>
        <div class="score-value">${data.thesisScore}%</div>
      </div>
    </div>
    
    <div class="info-section">
      <div class="info-label">Why this is a good match</div>
      <p style="margin: 10px 0 0 0; color: #4b5563;">${data.matchReasons}</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${process.env.APP_URL || 'http://localhost:3000'}/matches" class="cta-button">
        View Match Details
      </a>
    </div>
  </div>
  
  <div class="footer">
    <p>This is an automated notification from Sprintly AI</p>
    <p>© ${new Date().getFullYear()} Sprintly AI. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('[EmailService] Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
