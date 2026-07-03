import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "../config/logger";

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = env.SMTP_HOST || "localhost";
    const port = env.SMTP_PORT || 1025; // Standard Maildev port default
    const user = env.SMTP_USER;
    const pass = env.SMTP_PASS;

    const config: any = {
      host,
      port,
      secure: port === 465, // True for 465, false for other ports
    };

    if (user && pass) {
      config.auth = { user, pass };
    }

    this.transporter = nodemailer.createTransport(config);
    logger.info({ host, port, authEnabled: !!user }, "SMTP mailer transport initialized successfully");
    return this.transporter;
  }

  /**
   * Helper to send generic email
   */
  private static async sendMail(options: MailOptions): Promise<void> {
    try {
      const transporter = this.getTransporter();
      const from = env.SMTP_FROM || "no-reply@talentlabrms.com";

      const info = await transporter.sendMail({
        from: `"TalentLab RMS" <${from}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || "Please switch to an HTML compatible email viewer.",
      });

      logger.info({ messageId: info.messageId, to: options.to, subject: options.subject }, "Email sent successfully");
    } catch (err: any) {
      logger.error({ error: err.message, to: options.to, subject: options.subject }, "Failed to send email");
      // Don't crash the server, just log the error in production
    }
  }

  /**
   * 1. Send Password Reset instructions
   */
  static async sendPasswordResetEmail(to: string, resetUrl: string, name: string): Promise<void> {
    const subject = "Reset Your TalentLab RMS Password";
    const text = `Hi ${name},\n\nYou requested a password reset. Click the link below to set a new password:\n${resetUrl}\n\nThis link is valid for 1 hour.\n\nIf you did not request this, please ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Password Reset Request</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>We received a request to reset your password for your TalentLab RMS account. Click the button below to choose a new password:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">This link is valid for 1 hour. If you did not make this request, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">TalentLab RMS © ${new Date().getFullYear()} · Secure Recruitment Platform</p>
      </div>
    `;

    await this.sendMail({ to, subject, html, text });
  }

  /**
   * 2. Send Email Verification link
   */
  static async sendEmailVerificationEmail(to: string, verifyUrl: string, name: string): Promise<void> {
    const subject = "Verify Your TalentLab RMS Email Address";
    const text = `Hi ${name},\n\nThank you for registering. Please click the link below to verify your email address:\n${verifyUrl}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Email Verification</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Welcome to TalentLab RMS! Please verify your email address by clicking the button below:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">If the button does not work, copy and paste this link into your browser: <br/> ${verifyUrl}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">TalentLab RMS © ${new Date().getFullYear()} · 99 Placement</p>
      </div>
    `;

    await this.sendMail({ to, subject, html, text });
  }

  /**
   * 3. Send Interview Invitation
   */
  static async sendInterviewInviteEmail(
    to: string,
    details: {
      candidateName: string;
      jobTitle: string;
      scheduledAt: Date;
      interviewMode: string;
      meetingUrl?: string;
      interviewers: string[];
    }
  ): Promise<void> {
    const formattedDate = details.scheduledAt.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const subject = `Interview Scheduled: ${details.jobTitle} - TalentLab RMS`;
    const text = `Hi ${details.candidateName},\n\nAn interview has been scheduled for the role of ${details.jobTitle}.\n\nDate: ${formattedDate}\nMode: ${details.interviewMode}\n${details.meetingUrl ? `Link: ${details.meetingUrl}\n` : ""}Interviewers: ${details.interviewers.join(", ")}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #10b981; margin-bottom: 20px;">Interview Schedule Confirmation</h2>
        <p>Hi <strong>${details.candidateName}</strong>,</p>
        <p>We are pleased to confirm your upcoming interview for the <strong>${details.jobTitle}</strong> position.</p>
        
        <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: bold; color: #475569; width: 120px;">Date & Time</td>
            <td style="padding: 10px 0; color: #0f172a;">${formattedDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: bold; color: #475569;">Mode</td>
            <td style="padding: 10px 0; color: #0f172a; text-transform: capitalize;">${details.interviewMode}</td>
          </tr>
          ${
            details.meetingUrl
              ? `<tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: bold; color: #475569;">Meeting Link</td>
                  <td style="padding: 10px 0;"><a href="${details.meetingUrl}" style="color: #4f46e5; text-decoration: underline;">Join Meeting</a></td>
                </tr>`
              : ""
          }
          <tr>
            <td style="padding: 10px 0; font-weight: bold; color: #475569;">Interviewers</td>
            <td style="padding: 10px 0; color: #0f172a;">${details.interviewers.join(", ")}</td>
          </tr>
        </table>
        
        <p style="color: #64748b; font-size: 14px;">If you have any questions or need to reschedule, please notify us as soon as possible.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">TalentLab RMS · 99 Placement Partner</p>
      </div>
    `;

    await this.sendMail({ to, subject, html, text });
  }

  /**
   * 4. Send Offer Letter Dispatch
   */
  static async sendOfferLetterEmail(
    to: string,
    details: {
      candidateName: string;
      jobTitle: string;
      companyName: string;
      reviewUrl: string;
    }
  ): Promise<void> {
    const subject = `Offer Letter: ${details.jobTitle} at ${details.companyName}`;
    const text = `Hi ${details.candidateName},\n\nCongratulations! We are pleased to extend an offer for the ${details.jobTitle} position at ${details.companyName}. Review your offer letter here: ${details.reviewUrl}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Congratulations on Your Job Offer!</h2>
        <p>Hi <strong>${details.candidateName}</strong>,</p>
        <p>We are thrilled to extend a formal offer of employment for the <strong>${details.jobTitle}</strong> position at <strong>${details.companyName}</strong> on behalf of our client.</p>
        <p>Please review and sign the offer letter online by clicking the link below:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${details.reviewUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Review Offer Letter</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">TalentLab RMS · 99 Placement Partner</p>
      </div>
    `;

    await this.sendMail({ to, subject, html, text });
  }

  /**
   * 5. Send Assessment Invitation
   */
  static async sendAssessmentInviteEmail(
    to: string,
    details: {
      candidateName: string;
      testName: string;
      inviteUrl: string;
    }
  ): Promise<void> {
    const subject = `Assessment Invite: ${details.testName}`;
    const text = `Hi ${details.candidateName},\n\nYou have been invited to complete the ${details.testName} assessment. Click here to start: ${details.inviteUrl}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Skill Assessment Invitation</h2>
        <p>Hi <strong>${details.candidateName}</strong>,</p>
        <p>As part of the screening process, we invite you to complete the <strong>${details.testName}</strong> online skills assessment test.</p>
        <p>Please make sure you are in a quiet environment before starting. Click the button below to begin:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${details.inviteUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Start Assessment</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">TalentLab RMS · 99 Placement</p>
      </div>
    `;

    await this.sendMail({ to, subject, html, text });
  }

  /**
   * 6. Send Screening Reminder
   */
  static async sendScreeningReminderEmail(
    to: string,
    details: {
      candidateName: string;
      recruiterName: string;
      screeningUrl: string;
    }
  ): Promise<void> {
    const subject = `Screening Pending Review: ${details.candidateName}`;
    const text = `Hi,\n\nThis is a reminder to complete or review the screening details for candidate ${details.candidateName}. Review link: ${details.screeningUrl}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #f59e0b; margin-bottom: 20px;">Screening Pending Review</h2>
        <p>Hi <strong>${details.recruiterName}</strong>,</p>
        <p>This is a reminder to complete or review the screening details for candidate <strong>${details.candidateName}</strong>.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${details.screeningUrl}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Screening Details</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">TalentLab RMS · Internal Recruiter Notification</p>
      </div>
    `;

    await this.sendMail({ to, subject, html, text });
  }
}
