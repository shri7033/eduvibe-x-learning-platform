const twilio = require('twilio');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');

class SMSService {
    constructor() {
        this.client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
        this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    }

    /**
     * Send SMS
     * @param {string} to - Recipient phone number
     * @param {string} message - Message content
     * @returns {Promise<Object>} SMS response
     */
    async sendSMS(to, message) {
        try {
            // Format phone number
            const formattedNumber = this.formatPhoneNumber(to);

            // Send SMS
            const response = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: formattedNumber
            });

            logger.info(`SMS sent successfully to ${to}`, {
                messageId: response.sid,
                status: response.status
            });

            return {
                success: true,
                messageId: response.sid,
                status: response.status
            };
        } catch (error) {
            logger.error('SMS sending failed:', error);
            throw new ApiError(500, 'Failed to send SMS');
        }
    }

    /**
     * Send OTP via SMS
     * @param {string} to - Recipient phone number
     * @param {string} otp - OTP code
     * @returns {Promise<Object>} SMS response
     */
    async sendOTP(to, otp) {
        const message = `Your EDUVIBE-X verification code is: ${otp}. Valid for 10 minutes.`;
        return this.sendSMS(to, message);
    }

    /**
     * Send bulk SMS
     * @param {Array<{to: string, message: string}>} messages - Array of messages
     * @returns {Promise<Array>} Array of responses
     */
    async sendBulkSMS(messages) {
        try {
            const promises = messages.map(({ to, message }) => 
                this.sendSMS(to, message)
            );

            const responses = await Promise.allSettled(promises);

            // Log results
            const successful = responses.filter(r => r.status === 'fulfilled').length;
            const failed = responses.filter(r => r.status === 'rejected').length;

            logger.info(`Bulk SMS sent: ${successful} successful, ${failed} failed`);

            return responses;
        } catch (error) {
            logger.error('Bulk SMS sending failed:', error);
            throw new ApiError(500, 'Failed to send bulk SMS');
        }
    }

    /**
     * Format phone number
     * @param {string} number - Phone number to format
     * @returns {string} Formatted phone number
     */
    formatPhoneNumber(number) {
        // Remove any non-digit characters
        const cleaned = number.replace(/\D/g, '');

        // Add country code if not present
        if (!cleaned.startsWith('91')) {
            return `+91${cleaned}`;
        }

        return `+${cleaned}`;
    }

    /**
     * Validate phone number
     * @param {string} number - Phone number to validate
     * @returns {boolean} Whether number is valid
     */
    validatePhoneNumber(number) {
        const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
        return phoneRegex.test(number);
    }

    /**
     * Send test result notification
     * @param {string} to - Parent's phone number
     * @param {Object} testResult - Test result details
     * @returns {Promise<Object>} SMS response
     */
    async sendTestResult(to, testResult) {
        const { studentName, testName, score, totalMarks, percentage } = testResult;
        
        const message = 
            `EDUVIBE-X Test Result Update\n\n` +
            `Student: ${studentName}\n` +
            `Test: ${testName}\n` +
            `Score: ${score}/${totalMarks}\n` +
            `Percentage: ${percentage}%`;

        return this.sendSMS(to, message);
    }

    /**
     * Send class schedule notification
     * @param {string} to - Student's phone number
     * @param {Object} schedule - Class schedule details
     * @returns {Promise<Object>} SMS response
     */
    async sendClassSchedule(to, schedule) {
        const { subject, date, time, teacherName } = schedule;
        
        const message = 
            `EDUVIBE-X Class Reminder\n\n` +
            `Subject: ${subject}\n` +
            `Date: ${date}\n` +
            `Time: ${time}\n` +
            `Teacher: ${teacherName}`;

        return this.sendSMS(to, message);
    }

    /**
     * Send payment confirmation
     * @param {string} to - User's phone number
     * @param {Object} payment - Payment details
     * @returns {Promise<Object>} SMS response
     */
    async sendPaymentConfirmation(to, payment) {
        const { amount, orderId, courseName } = payment;
        
        const message = 
            `EDUVIBE-X Payment Confirmation\n\n` +
            `Amount: ₹${amount}\n` +
            `Course: ${courseName}\n` +
            `Order ID: ${orderId}\n` +
            `Status: Success`;

        return this.sendSMS(to, message);
    }
}

// Create singleton instance
const smsService = new SMSService();

module.exports = smsService;
