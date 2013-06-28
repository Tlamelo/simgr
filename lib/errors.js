exports = module.exports = function (key) {
  var opts = exports[key]

  var err = new Error(opts.message)
  err.status = opts.status || 400
  err.client = true
  err.key = key
  return err
}

exports.imageSizeTooLarge = {
  message: 'Image file size is too large.',
  status: 413
}

exports.imageAreaTooLarge = {
  message: 'Image pixel area is too large.'
}

exports.unsupportedInputFormat = {
  message: 'Unsupported input image format.',
  status: 415
}

exports.unsupportedOutputFormat = {
  message: 'Unsupported output image format.',
  status: 406
}

exports.undefinedVariant = {
  message: 'Undefined variant.'
}

exports.imageNotFound = {
  message: 'Image not found in S3.',
  status: 404
}

exports.notAnImage = {
  message: 'File is not an image.',
  status: 415
}

exports.contentLengthRequired = {
  message: 'Content length required.',
  status: 411
}