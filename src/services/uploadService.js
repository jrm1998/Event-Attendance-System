'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../config/environment');
const { ApiError } = require('../utils/errors');

fs.mkdirSync(config.uploadsDir, { recursive: true });

const IMAGE_MIMES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAGIC_BYTES = [
  { bytes: [0xff, 0xd8, 0xff], mime: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], mime: 'image/png' },
  {
    bytes: [0x52, 0x49, 0x46, 0x46],
    offset: 8,
    check: [0x57, 0x45, 0x42, 0x50],
    mime: 'image/webp',
  },
];

function imageFileFilter(req, file, cb) {
  if (!IMAGE_MIMES[file.mimetype]) {
    return cb(ApiError.badRequest('Only JPEG, PNG, or WebP images are allowed.'));
  }
  cb(null, true);
}

function makeImageUpload(fieldName, sizeLimitMb = 5) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, config.uploadsDir),
    filename: (req, file, cb) => {
      const ext = IMAGE_MIMES[file.mimetype] || '.bin';
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  });
  return multer({
    storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: sizeLimitMb * 1024 * 1024, files: 1 },
  });
}

/**
 * Verifies uploaded content by magic bytes — defends against a renamed
 * executable or HTML smuggled with an image Content-Type.
 */
function verifyImageMagic(filePath) {
  return new Promise((resolve, reject) => {
    const fd = fs.openSync(filePath, 'r');
    try {
      const buffer = Buffer.alloc(16);
      const read = fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);
      const head = buffer.subarray(0, read);
      for (const sig of MAGIC_BYTES) {
        const offset = sig.offset || 0;
        const prefix = head.subarray(offset, offset + sig.bytes.length);
        const prefixOk =
          prefix.length === sig.bytes.length && prefix.every((b, i) => b === sig.bytes[i]);
        if (prefixOk && (!sig.check || head.subarray(sig.check.length ? 8 : 0).length === 0)) {
          if (sig.check) {
            const check = head.subarray(8, 12);
            if (check.every((b, i) => b === sig.check[i])) return resolve(sig.mime);
          } else {
            return resolve(sig.mime);
          }
        }
      }
      reject(ApiError.badRequest('File content is not a valid image.'));
    } catch (err) {
      try {
        fs.closeSync(fd);
      } catch {
        /* already closed */
      }
      reject(err);
    }
  });
}

function deleteQuietly(filePath) {
  if (!filePath) return;
  const full = filePath.startsWith('/') ? filePath : path.join(config.uploadsDir, path.basename(filePath));
  fs.promises.unlink(full).catch(() => {});
}

/** Public web path for a stored upload filename. */
function publicPath(filename) {
  return `/uploads/${path.basename(filename)}`;
}

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    const ok = ['.csv', '.xlsx'].includes(path.extname(file.originalname || '').toLowerCase());
    if (!ok) return cb(ApiError.badRequest('Upload a .csv or .xlsx file.'));
    cb(null, true);
  },
});

module.exports = { makeImageUpload, verifyImageMagic, deleteQuietly, publicPath, importUpload };
