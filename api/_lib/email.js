import nodemailer from 'nodemailer';

export function checkEmailHealth() {
  if (process.env.RESEND_API_KEY) {
    return { configured: true, provider: 'resend' };
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return { configured: true, provider: 'smtp' };
  }
  if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_AUTH === 'true') {
    return { configured: true, provider: 'dev_console' };
  }
  return { configured: false, provider: 'none' };
}

export async function sendVerificationEmail(email, code) {
  const health = checkEmailHealth();
  if (!health.configured) {
    throw new Error('Email delivery is not configured. Please set RESEND_API_KEY or SMTP credentials.');
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tower Defence Authorization</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f1f5f9;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #070b14; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background: linear-gradient(180deg, #101c2e 0%, #091220 100%); border: 1px solid #1e3352; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
          <tr>
            <td align="center">
              <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px;">
                TACTICAL COMMAND SYSTEM
              </div>
              <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px;">
                CLOUD SAVE AUTHORIZATION
              </h1>
              <p style="margin: 0 0 28px 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                Use the one-time tactical passcode below to verify your email and synchronize your Tower Defence campaign progress across your devices.
              </p>
              
              <!-- Code Card -->
              <div style="background: rgba(15, 23, 42, 0.9); border: 2px solid #38bdf8; border-radius: 10px; padding: 20px; margin: 0 0 28px 0; box-shadow: 0 0 20px rgba(56, 189, 248, 0.25);">
                <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #fbbf24; font-family: 'Courier New', Courier, monospace; display: block;">
                  ${code}
                </span>
                <span style="font-size: 11px; font-weight: 700; color: #7dd3fc; text-transform: uppercase; letter-spacing: 1px; display: block; margin-top: 8px;">
                  ⏳ Valid for 10 minutes
                </span>
              </div>

              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                If you did not request this authorization code, you can safely disregard this transmission. No action has been taken on your garrison.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  // 1. Resend API
  if (health.provider === 'resend') {
    const from = process.env.EMAIL_FROM || 'Tower Defence <onboarding@resend.dev>';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Your Tower Defence Verification Code: ${code}`,
        html: htmlContent
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Resend API failed with status ${res.status}`);
    }
    return { success: true, provider: 'resend' };
  }

  // 2. SMTP
  if (health.provider === 'smtp') {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: `Your Tower Defence Verification Code: ${code}`,
      html: htmlContent
    });
    return { success: true, provider: 'smtp' };
  }

  // 3. Dev console fallback
  if (health.provider === 'dev_console') {
    console.log(`\n========================================`);
    console.log(`[DEV OTP EMAIL] Target: ${email}`);
    console.log(`[DEV OTP CODE]  >>> ${code} <<<`);
    console.log(`========================================\n`);
    return { success: true, provider: 'dev_console' };
  }
}
