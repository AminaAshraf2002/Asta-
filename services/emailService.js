import nodemailer from 'nodemailer';

// ✅ Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// ✅ SEND APPROVAL EMAIL TO STUDENT WITH LOGIN LINK
export const sendStudentApprovalEmail = async (studentEmail, studentName, admissionNumber) => {
  try {
    const loginLink = 'http://localhost:55489/student-login'; // ✅ Frontend login URL
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: studentEmail,
      subject: '✅ Your Registration is Complete - Admin Approved! - ASTAEDU',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <!-- Header -->
          <div style="background-color: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 ASTAEDU</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Student Portal</p>
          </div>
          
          <!-- Main Content -->
          <div style="background-color: white; padding: 30px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #22c55e; margin-top: 0; font-size: 24px;">✅ Registration Approved!</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.8; margin: 20px 0;">
              Hello <strong>${studentName}</strong>,
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.8; margin: 20px 0;">
              Congratulations! 🎊 Your registration with <strong>ASTAEDU</strong> has been <strong style="color: #22c55e; font-size: 18px;">APPROVED</strong> by our admin team.
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.8; margin: 20px 0;">
              Your account is now <strong>active</strong> and you can access your student dashboard!
            </p>
            
            <!-- Success Box -->
            <div style="background-color: #f0fdf4; border: 2px solid #22c55e; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #166534; font-size: 14px;">Your Admission Number:</p>
              <p style="margin: 10px 0 0 0; color: #22c55e; font-size: 24px; font-weight: bold; letter-spacing: 1px;">${admissionNumber}</p>
            </div>
            
            <!-- Login Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginLink}" 
                 style="background-color: #1e3a8a; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                🔑 Login to Your Dashboard
              </a>
            </div>
            
            <!-- Login Instructions -->
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 3px;">
              <p style="margin: 0; color: #1e40af; font-weight: bold;">📝 Login Credentials:</p>
              <ul style="margin: 10px 0 0 0; color: #1e40af; padding-left: 20px;">
                <li><strong>Admission Number:</strong> ${admissionNumber}</li>
                <li><strong>Password:</strong> The password you set during registration</li>
              </ul>
            </div>
            
            <!-- What You Can Do -->
            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 3px;">
              <p style="margin: 0; color: #1e3a8a; font-weight: bold;">📌 What You Can Do Now:</p>
              <ul style="margin: 10px 0 0 0; color: #333; padding-left: 20px;">
                <li>View your student dashboard</li>
                <li>Check exam registrations</li>
                <li>View your results and grades</li>
                <li>Check your attendance records</li>
                <li>Download certificates</li>
                <li>Update your profile</li>
              </ul>
            </div>
            
            <!-- Important Note -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 3px;">
              <p style="margin: 0; color: #92400e; font-weight: bold;">⚠️ Important:</p>
              <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">
                Keep your admission number and password safe. Do not share them with anyone.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              If you have any questions or face any issues logging in, please contact our support team.
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 15px;">
              <strong>Support Email:</strong> support@astaedu.com<br>
              <strong>Support Phone:</strong> +1-XXX-XXX-XXXX
            </p>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px; color: #666; font-size: 12px;">
            <p style="margin: 5px 0;">© 2025 ASTAEDU. All rights reserved.</p>
            <p style="margin: 5px 0;">This is an automated email. Please do not reply directly to this email.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Student approval email sent:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Error sending student approval email:', error);
    return false;
  }
};

// ✅ SEND REJECTION EMAIL TO STUDENT
export const sendStudentRejectionEmail = async (studentEmail, studentName, rejectionReason) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: studentEmail,
      subject: '❌ Registration Status Update - ASTAEDU',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">ASTAEDU</h1>
            <p style="margin: 5px 0 0 0;">Student Portal</p>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #dc2626; margin-top: 0;">Registration Status Update</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Hello ${studentName},
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Thank you for your application to ASTAEDU. We regret to inform you that your registration could not be approved at this time.
            </p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 3px;">
              <p style="margin: 0; color: #991b1b; font-weight: bold;">Reason for Rejection:</p>
              <p style="margin: 10px 0 0 0; color: #7f1d1d; font-size: 14px;">${rejectionReason || 'No reason provided'}</p>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              You can contact our admin team if you have any questions or wish to reapply with updated information.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="color: #666; font-size: 14px;">
              For more information, please contact our support team.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p style="margin: 5px 0;">© 2025 ASTAEDU. All rights reserved.</p>
            <p style="margin: 5px 0;">This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Student rejection email sent:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Error sending student rejection email:', error);
    return false;
  }
};

export default { 
  sendStudentApprovalEmail, 
  sendStudentRejectionEmail
};