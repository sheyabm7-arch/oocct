package com.oct.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    public void sendOtpEmail(String to, String otp) throws MessagingException, java.io.UnsupportedEncodingException {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");

        helper.setFrom(from, "OCT Analysis Platform");
        helper.setTo(to);
        helper.setReplyTo(from);
        helper.setSubject("Your Password Reset Code: " + otp);
        helper.setText(buildPlainText(otp), buildHtml(otp));

        mailSender.send(msg);
    }

    private String buildPlainText(String otp) {
        return "OCT Analysis Platform - Password Reset\n\n"
             + "Your verification code is: " + otp + "\n\n"
             + "This code is valid for 60 seconds only.\n"
             + "If you did not request this, please ignore this email.\n\n"
             + "Jordan University of Science and Technology";
    }

    private String buildHtml(String otp) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
                <tr><td align="center">
                  <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:32px;text-align:center;">
                        <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:50%%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
                          <span style="font-size:24px;">👁</span>
                        </div>
                        <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0;">OCT Analysis Platform</h1>
                        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">Medical Imaging Intelligence</p>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:36px 40px;">
                        <h2 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 8px;">Password Reset Request</h2>
                        <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px;">
                          Hello, we received a request to reset your password. Use the verification code below to continue.
                        </p>

                        <!-- OTP Box -->
                        <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
                          <p style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Your Verification Code</p>
                          <div style="font-size:42px;font-weight:800;letter-spacing:10px;color:#1e293b;font-family:monospace;">%s</div>
                          <p style="color:#94a3b8;font-size:13px;margin:12px 0 0;">Valid for <strong style="color:#ef4444;">60 seconds</strong> only</p>
                        </div>

                        <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;padding:14px 16px;margin-bottom:24px;">
                          <p style="color:#92400e;font-size:13px;margin:0;">
                            ⚠ If you did not request this password reset, please ignore this email. Your account remains secure.
                          </p>
                        </div>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                        <p style="color:#9ca3af;font-size:12px;margin:0;">© 2026 OCT Analysis Platform · Jordan University of Science and Technology</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(otp);
    }
}
