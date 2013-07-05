var execFile = require('child_process').execFile
var cwebp = require('webp-bin').path
var debug = require('debug')('simgr')

var Simgr = require('./Simgr')

// callback(function (err, filename))
Simgr.prototype.getVariant = function (metadata, options, callback) {
  if (!metadata)
    throw new Error('Metadata required.')

  options = options || {}

  try {
    this.checkVariant(metadata, options)
  } catch (err) {
    return callback(err)
  }

  this.getImageFromS3(metadata, function (err) {
    if (err)
      return callback(err)

    this.resizeImage(metadata, options, callback)
  })

  return this
}

// callback(function (err, signature))
Simgr.prototype.getSignature = function (filename, callback) {
  debug('identifying signature of ' + filename)

  execFile('identify', [
    '-format',
    '%#',
    filename
  ], function (err, stdout, stderr) {
    if (err)
      return callback(err)

    if (stderr) {
      debug('error identifying signature of ' + filename)
      callback(new Error(stderr.toString()))
      return
    }

    debug('identified signature of ' + filename)
    callback(null, stdout.toString().trim())
  })

  return this
}

// Private, throws if error
Simgr.prototype.checkVariant = function (metadata, options) {
  var slug = options.slug = options.slug
    || metadata.slug
    || 'o'

  var variant =
  options.variant = this.variant[slug]
  if (!variant)
    throw this.error('undefinedVariant')

  var format =
  options.format = this.supportedOutputFormat(options.format
    || metadata.identity.format
    || 'jpg'
  )
  if (!format)
    throw this.error('unsupportedOutputFormat')

  return variant
}

// Private
// callback(function (err, filename))
Simgr.prototype.resizeImage = function (metadata, options) {
  if (options.format === 'webp')
    return this.resizeWebp.apply(this, arguments)
  else
    return this.resizeImagemagick.apply(this, arguments)
}

// Private
Simgr.prototype.resizeImagemagick = function (metadata, options, callback) {
  var that = this
  var format = options.format
  var slug = options.slug
  var variant = options.variant
  var filename = metadata.path

  var args = [
    filename,
    '-interlace', 'Plane',
    '-auto-orient',
    '-strip'
  ]

  if (variant.resize)
    args.push('-resize', variant.resize)

  if (format === 'jpg') {
    var currentquality = parseInt(metadata.identity.Quality, 10)
    var quality = variant.quality
    if (!currentquality || currentquality > quality)
      args.push('-quality', quality)
  }

  var output = [filename, slug, format].join('.')

  debug('saving variant to ' + output)

  execFile('convert', args.concat(output), function (err, stdout, stderr) {
    that.deleteFile(filename)

    if (err)
      return callback(err)

    if (stderr)
      return callback(new Error(stderr.toString()))

    callback(null, output)
  })

  return this
}

// Private
Simgr.prototype.resizeWebp = function (metadata, options, callback) {
  var that = this
  var filename = metadata.path
  var slug = options.slug
  var variant = options.variant

  var args = [
    '-quiet',
    '-q', variant.quality,
    '-m', '0',
    '-low_memory'
  ]

  var resize = variant.size
  if (resize) {
    var size = metadata.identity.size
    if (size.width > resize.width && size.height > resize.height) {
      // do nothing
    } else if (size.width > resize.width && size.height < resize.height) {
      args.push('-resize', resize.width, Math.round(resize.width / size.width * size.height))
    } else if (size.width < resize.width && size.height > resize.height) {
      args.push('-resize', Math.round(resize.height / size.height * size.width), resize.height)
    } else if (size.width / resize.width > size.height / resize.height) {
      args.push('-resize', resize.width, Math.round(resize.width / size.width * size.height))
    } else {
      args.push('-resize', Math.round(resize.height / size.height * size.width), resize.height)
    }
  }

  var output = [filename, slug, 'webp'].join('.')

  debug('saving variant to ' + output)

  execFile(cwebp, args.concat(metadata.path, '-o', output), function (err, stdout, stderr) {
    that.deleteFile(filename)

    if (err)
      return callback(err)

    if (stderr)
      return callback(new Error(stderr.toString()))

    callback(null, output)
  })
}

// Private
// callback(function (err, filename))
Simgr.prototype.getImageFromS3 = function (metadata, callback) {
  if (!metadata)
    throw new Error('Metadata required.')

  var that = this

  var name = metadata.name
  if (!name)
    throw new Error('Need a name to get from S3!')

  this.checkAWSClient()

  this.awsClient.getFile(name, function (err, res) {
    if (err)
      return callback.call(that, err)

    var statusCode = res.statusCode

    debug('got statusCode ' + statusCode + ' for file ' + name)

    if (statusCode !== 200)
      return callback.call(that, that.error('imageNotFound'))

    that.saveFile(res, function (err, filename) {
      if (err)
        return callback.call(that, err)

      metadata.path = filename
      callback.call(that)
    })
  })

  return this
}