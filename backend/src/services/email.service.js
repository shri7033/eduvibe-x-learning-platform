const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        this.from = `EDUVIBE-X <${process.env.SMTP_FROM_EMAIL}>`;
    }

    /**
     * Send email
     * @param {string} to - Recipient email
     * @param {string} subject - Email subject
     * @param {string} html - Email HTML content
     * @returns {Promise<Object>} Email response
     */
    async sendEmail(to, subject, html) {
        try {
            const mailOptions = {
                from: this.from,
                to,
                subject,
                html
            };

            const info = await this.transporter.sendMail(mailOptions);

            logger.info(`Email sent successfully to ${to}`, {
                messageId: info.messageId
            });

            return {
                success: true,
                messageId: info.messageId
            };
        } catch (error) {
            logger.error('Email sending failed:', error);
            throw new ApiError(500, 'Failed to send email');
        }
    }

    /**
     * Send OTP email
     * @param {string} to - Recipient email
     * @param {string} otp - OTP code
     * @returns {Promise<Object>} Email response
     */
    async sendOTP(to, otp) {
        const subject = 'EDUVIBE-X Verification Code';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Verify Your Email</h2>
                <p>Your verification code is:</p>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
                    <strong>${otp}</strong>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p style="color: #666; font-size: 12px;">
                    If you didn't request this code, please ignore this email.
                </p>
            </div>
        `;

        return this.sendEmail(to, subject, html);
    }

    /**
     * Send welcome email
     * @param {string} to - Recipient email
     * @param {string} name - User's name
     * @returns {Promise<Object>} Email response
     */
    async sendWelcome(to, name) {
        const subject = 'Welcome to EDUVIBE-X!';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to EDUVIBE-X!</h2>
                <p>Dear ${name},</p>
                <p>
                    Thank you for joining EDUVIBE-X! We're excited to have you on board.
                    Get ready to embark on your learning journey with us.
                </p>
                <div style="margin: 20px 0;">
                    <p>Here's what you can do next:</p>
                    <ul>
                        <li>Complete your profile</li>
                        <li>Browse our courses</li>
                        <li>Join live classes</li>
                        <li>Take practice tests</li>
                    </ul>
                </div>
                <p>
                    If you have any questions, feel free to reach out to our support team.
                </p>
            </div>
        `;

        return this.sendEmail(to, subject, html);
    }

    /**
     * Send test result email
     * @param {string} to - Parent's email
     * @param {Object} testResult - Test result details
     * @returns {Promise<Object>} Email response
     */
    async sendTestResult(to, testResult) {
        const { studentName, testName, score, totalMarks, percentage, details } = testResult;
        
        const subject = `${studentName}'s Test Result - ${testName}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Test Result Update</h2>
                <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0;">
                    <p><strong>Student:</strong> ${studentName}</p>
                    <p><strong>Test:</strong> ${testName}</p>
                    <p><strong>Score:</strong> ${score}/${totalMarks}</p>
                    <p><strong>Percentage:</strong> ${percentage}%</p>
                </div>
                ${details ? `
                    <div style="margin-top: 20px;">
                        <h3>Detailed Analysis</h3>
                        <p>${details}</p>
                    </div>
                ` : ''}
                <p style="margin-top: 20px;">
                    Login to your parent portal to view detailed performance analytics.
                </p>
            </div>
        `;

        return this.sendEmail(to, subject, html);
    }

    /**
     * Send class schedule notification
     * @param {string} to - Student's email
     * @param {Object} schedule - Class schedule details
     * @returns {Promise<Object>} Email response
     */
    async sendClassSchedule(to, schedule) {
        const { subject, date, time, teacherName, meetingLink } = schedule;
        
        const subject_line = `Class Reminder: ${subject}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Upcoming Class Reminder</h2>
                <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0;">
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    <p><strong>Teacher:</strong> ${teacherName}</p>
                </div>
                ${meetingLink ? `
                    <div style="margin: 20px 0;">
                        <a href="${meetingLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Join Class
                        </a>
                    </div>
                ` : ''}
            </div>
        `;

        return this.sendEmail(to, subject_line, html);
    }

    /**
     * Send payment confirmation
     * @param {string} to - User's email
     * @param {Object} payment - Payment details
     * @returns {Promise<Object>} Email response
     */
    async sendPaymentConfirmation(to, payment) {
        const { amount, orderId, courseName, date } = payment;
        
        const subject = 'Payment Confirmation - EDUVIBE-X';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Payment Confirmation</h2>
                <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0;">
                    <p><strong>Amount:</strong> ₹${amount}</p>
                    <p><strong>Course:</strong> ${courseName}</p>
                    <p><strong>Order ID:</strong> ${orderId}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Status:</strong> Success</p>
                </div>
                <p>
                    Thank you for your payment. You can now access your course materials.
                </p>
            </div>
        `;

        return this.sendEmail(to, subject, html);
    }

    /**
     * Send bulk emails
     * @param {Array<{to: string, subject: string, html: string}>} emails - Array of emails
     * @returns {Promise<Array>} Array of responses
     */
    async sendBulkEmails(emails) {
        try {
            const promises = emails.map(({ to, subject, html }) => 
                this.sendEmail(to, subject, html)
            );

            const responses = await Promise.allSettled(promises);

            // Log results
            const successful = responses.filter(r => r.status === 'fulfilled').length;
            const failed = responses.filter(r => r.status === 'rejected').length;

            logger.info(`Bulk emails sent: ${successful} successful, ${failed} failed`);

            return responses;
        } catch (error) {
            logger.error('Bulk email sending failed:', error);
            throw new ApiError(500, 'Failed to send bulk emails');
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
