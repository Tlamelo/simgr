exports = module.exports = function (key) {
  var opts = exports[key]

  var err = new Error(opts.message)
  err.status = opts.status || 400
  err.client = true
  err.key = key
  return err
}

exports.imageSizeTooLarge = {
  message: 'This image\'s file size is too large. Try a smaller version of the image.',
  status: 413
}

exports.imageAreaTooLarge = {
  message: 'This image\'s dimensions are too large. Try a smaller version of the image.'
}

exports.unsupportedInputFormat = {
  message: 'This image\'s format is not supported. Only JPEGs and PNGs are supported right now.',
  status: 415
}

exports.unsupportedOutputFormat = {
  message: 'The requested image format is not supported. Only JPEGs, PNGs, and WebPs are supported right now.',
  status: 406
}

exports.unsupportedConversionFormat = {
  message: 'The image output format for this image is not supported.',
  status: 406
}

// Developer error
exports.undefinedVariant = {
  message: 'Undefined variant.'
}

// Developer error
exports.invalidVariant = {
  message: 'Invalid variant.'
}

exports.imageNotFound = {
  message: 'Image not found in S3. This a developer problem! Let us know this happened!',
  status: 500
}

exports.notAnImage = {
  message: 'This file is not an image!',
  status: 415
}

exports.contentLengthRequired = {
  message: 'Content length header required.',
  status: 411
}

exports.chunkedEncodingNotAllowed = {
  message: 'Chunked encoding not allowed. A content length header is required.',
  status: 411
}