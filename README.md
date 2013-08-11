# simgr - Simple Image Resizer [![Build Status](https://travis-ci.org/funraiseme/simgr.png)](https://travis-ci.org/funraiseme/simgr)

Simgr is a helper for your app to manage different variants of your images (basically different sizes).
However, instead of the usual batch resizing,
Simgr creates each variant on demand.
Empirically, this works better on low memory platforms.

Simgr currently works on an Heroku instance (512MB) with up to 25MP images with S3 and behind CloudFront.

## Features, Support, and Limitations

- Image validation for HTTP streams
- Designed for low-memory platforms such as Heroku
- WebP output support
- Convert GIFs to WebM and MP4 - significantly reduces the size of the GIF and increases performance on all modern browsers
- Colorspace correction when resizing - Only supports sRGB and Grayscale colorspaces
- Requires ImageMagick v6.7.5+
  - `apt`'s version is out of date.
  - GraphicsMagick is not supported
- Requires UNIX 64-bit platforms - Windows is unsupported.

## Supported Image Conversions

Input images:

- JPEG
- PNG
- GIF
- TIFF (if supported by the platform)

Output images:

- JPEG
- PNG
- GIF (only if GIF source)
- WebP (if supported by the platform)

Output videos (only if animated GIF is the source):

- WebM (vpx)
- MP4 (x264)

Theora is not supported as WebM, but adding support is trivial.

## Options

View the [defaults](https://github.com/funraiseme/simgr/blob/master/lib/defaults.js) for more information.

- `s3{}` - AWS S3 key/secret/bucket for storing the original image.
- `cache{}` - Optional AWS S3 key/secret/bucket for storing image variants.
- `variants{}` - Image variants.
  - `slug` - The name of the variant.
  - `size` - Either a value from the maximum size in pixels, or `{width: x, height: y}`.
  - `quality` - Image quality, `options.quality` by default.
- `quality` - Image quality, `0-100`, `80` by default.
- `maxsize` - Maximum image file size in MB, default 25MB.
- `maxarea` - Maximum megapixels, default 25MP.
- `compressionmethod` - WebP compression method, the `-m` option.
  By default, `0`, the fastest but lowest quality.
- `lowmemory` - WebP `-low_memory` option, `true` by default.

To reduce memory usage, you may be interested in looking at [ImageMagick's -limit option](http://www.imagemagick.org/script/command-line-options.php#limit).

## API

This API is a little out of date.

### metadata

Most APIs use a `metadata` object as an input.
The following attributes must be defined by you, the developer:

- `path` - Path to image file.
  If you have an image stream (such as an HTTP request/response),
  you can save it to a file first with `simgr.saveFile()`.
- `name` - Name to save the image file as on S3.
  You should set this as some ID to store in your database.
  It only has to be set immediately prior to `simgr.uploadImage()`.

The following attributes are defined by `simgr.identifyImage()`.
These attributes are also assumed to be present for `simgr.getVariant()`:

- `Format` - Format as the canonical abbreviation of the type, ie `PNG` or `JPEG`.
- `format` - Format as an extension, ie `png` or `jpg`.
- `signature` - Image hash for etags and comparing images.
- `length`- Image file size in bytes.
- `quality` - Image compression quality, `0` - `100`.
  `0` for PNGs.
- `colorspace`
- `width`
- `height`
- `pixels` - `width x height`

### var simgr = Simgr(options)

```js
var Simgr = require('simgr')

var simgr = Simgr(options)
```

Creates a new `Simgr` instance with some options.

### PUT

This section is for saving a file to later create variants from.

#### simgr.identifyImage(metadata, callback(err))

Validates an image file and populates `metadata` with image attributes.

```js
var metadata = {
  path: '/tmp/someimage.jpg'
}

simgr.identifyImage(metadata, function (err) {
  if (err)
    return callback(err)

  // continue
})
```

#### simgr.uploadImage(metadata, callback(err))

Uploads the image to S3 as `metadata.name`.

#### simgr.checkHTTPHeaders(request || response)

Validate an HTTP request or response for headers.
Throws, so use try/catch statements.
Example Connect/Express usage when uploading an image file directly to the server (no multipart):

```js
app.post('/images', function (req, res, next) {
  try {
    simgr.checkHTTPHeaders(req)
  } catch (err) {
    return next(err)
  }

  // continue
})
```

This only checks the headers,
not the actual content of the stream,
so it's only an artificial form of security.

#### Full example

```js
app.post('/images', function (req, res, next) {
  try {
    simgr.checkHTTPHeaders(req)
  } catch (err) {
    // Invalid headers
    return next(err)
  }

  simgr.saveFile(req, function (err, path) {
    if (err)
      return next(err)

    var metadata = {
      path: path,
      name: 'somename'
    }

    simgr.identifyImage(metadata, function (err) {
      if (err)
        // Invalid image or file
        return next(err)

      simgr.uploadImage(metadata, function (err) {
        if (err)
          // Failed to upload to S3
          return next(err)

        res.json({
          message: 'ok'
        })
      })
    })
  })
})
```

### GET

These methods are for getting a variant.

#### simgr.getVariant(metadata, options, callback(err, filename))

Returns the location of the image file.

- `metadata` - metadata file defined by `PUT`.
  If `metadata` is stored in a database,
  you only have to create a new object with `name` and `identity` properties.
- `options`
  - `slug` - Variant slug
  - `format` - Output image format

```js
simgr.getVariant(metadata, {
  slug: 'original',
  format: 'webp'
}, function (err, filename) {

})
```

### Utilities

#### simgr.getSignature(filename, callback(err, signature))

Get the signature of an image.
Good for ETags and checking for exact duplicates.

#### simgr.supportedInputFormat(type)

`type` can either be a mime type or an extension name.

#### simgr.supportedOutputFormat(type)

`type` can either be a mime type or an extension name.

#### simgr.tmpdir

Temporary file where images are stored.

#### simgr.createFilename()

Creates a random filename in the `simgr.tmpdir` directory.

#### simgr.saveFile(stream, callback(err, filename))

Save a stream to `filename` created from `simgr.createFilename()`.

#### simgr.deleteFile(filename)

Delete a file without any error checking.

#### simgr.webp

If `simgr.webp === true`, WebP is supported on this platform.

### Errors

See all [errors here](https://github.com/funraiseme/simgr/blob/master/lib/errors.js). Simgr returns special errors, specifically when they are client errors.

- `err.client` - If true, it's a client error and you can safely pass the message to the client if you'd like.
- `err.key` - String for the error name in the specified folder.
- `err.status` - Specific status code for the error which can be safely passed to Express.

### Temporary files

Temporary files are stored in their own folder.
You can clean up these files yourself using `simgr.deleteFile()` or a utility such as [visionmedia/reap](https://github.com/visionmedia/reap).

## License

The MIT License (MIT)

Copyright (c) 2013 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.