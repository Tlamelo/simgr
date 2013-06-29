var env = process.env

exports.s3 = {
  key: env.S3_KEY || '',
  secret: env.S3_SECRET || '',
  bucket: env.S3_BUCKET || ''
}

// True by default as more simgrs use IM
exports.imageMagick = true

exports.variants = [{
  slug: 'o'
}, {
  slug: 'l',
  size: 1440
}, {
  slug: 'm',
  size: 720
}, {
  slug: 's',
  size: 360
}, {
  slug: 't',
  size: 240
}, {
  slug: 'a',
  size: 120
}]

exports.quality = 85
exports.maxsize = 25 * 1024 * 1024
exports.maxarea = 5000 * 5000