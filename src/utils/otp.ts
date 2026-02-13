import { config } from '../config';

export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (phone: string, otp: string): Promise<void> => {
    // For demo purposes, log OTP to console instead of sending SMS
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║          🔐 OTP GENERATED             ║');
    console.log('╠════════════════════════════════════════╣');
    console.log('║  Phone:', phone.padEnd(26), '║');
    console.log('║  OTP Code:', otp.padEnd(23), '║');
    console.log('║  Expires in:', config.otpExpiryMinutes, 'minutes'.padEnd(17), '║');
    console.log('╚════════════════════════════════════════╝\n');

    // In production, integrate with SMS service like Twilio, AWS SNS, etc.
    // Example:
    // await twilioClient.messages.create({
    //   body: `Your OTP is: ${otp}. Valid for ${config.otpExpiryMinutes} minutes.`,
    //   to: phone,
    //   from: TWILIO_PHONE_NUMBER,
    // });
};
