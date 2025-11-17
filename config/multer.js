import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ✅ Create uploads directories if they don't exist
const uploadDir = './uploads';
const certificatesDir = './uploads/certificates';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir, { recursive: true });
  console.log('✅ Created uploads/certificates directory');
}

// ========== STORAGE FOR PROFILE IMAGES ==========
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const imageFileFilter = (req, file, cb) => {
  console.log('📸 Multer received file:', file.originalname);
  console.log('   MIME type:', file.mimetype);
  
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// ========== STORAGE FOR CERTIFICATES (PDFs + Images) ==========
const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, certificatesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

const certificateFileFilter = (req, file, cb) => {
  console.log('📄 Certificate upload - file:', file.originalname);
  console.log('   MIME type:', file.mimetype);
  
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed for certificates'));
  }
};

// ========== EXPORT MULTER INSTANCES ==========

// For profile images
export const upload = multer({
  storage: imageStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: imageFileFilter
});

// For certificates
export const uploadCertificateFile = multer({
  storage: certificateStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: certificateFileFilter
});