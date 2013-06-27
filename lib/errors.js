exports = module.exports = function (key) {
  var err = new Error(exports[key])
  err.client = true
  err.key = key
  return err
}

exports.imageSizeTooLarge = 'Image file size is too large.'
exports.imageAreaTooLarge = 'Image pixel area is too large.'
exports.unsupportedInputFormat = 'Unsupported input image format.'
exports.unsupportedOutputFormat = 'Unsupported output image format.'
exports.undefinedVariant = 'Undefined variant.'