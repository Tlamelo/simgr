# simgr - Simple Image Resizer [![Build Status](https://travis-ci.org/funraiseme/simgr.png)](https://travis-ci.org/funraiseme/simgr)

Instead of creating multple sizes of an image, 
simgr works by uploading that image to S3, 
then resizing the image on demand.
This is better for low-memory platforms as batch resizing kills memory and CPU. 
Simgr is designed to work on low-memory platforms.

Simgr works with image files, not images in node streams or buffers. 
Empirically, resizing images using node's streams and buffers drastically increases memory usage as well as decreases performance. Most image libraries use temporary files anyways, so avoiding disk usage is futile.

## Features and Support

- Image validation
- WebP output support
- Designed for low-memory platforms
- Uses ImageMagick only - does not support GraphicsMagick
- Supports UNIX platforms only

## Supported Images

Input images:

- JPEG
- PNG

Output images:

- JPEG
- PNG
- WebP (if supported by the platform)

## Options

View the [defaults](https://github.com/funraiseme/simgr/blob/master/lib/defaults.js) for more information.

- `s3{}` - AWS S3 key/secret/bucket for storing the original image.
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

### metadata

Most APIs use a `metadata` object as an input. 

- `path` - Path to image file.
  If you have an image stream (such as an HTTP request/response), 
  you can save it to a file first with `simgr.saveFile()`.
- `name` - Name to save the image file as on S3.
  You should set this as some ID to store in your database.
  It only has to be set immediately priort to `simgr.uploadImage()`.
- `identity` - ImageMagick's `identify` data. Set by `simgr.identifyImage()`.
- `format` - Image input format, set by `simgr.validateImage()`.
- `length` - Image file size in bytes, set by `simgr.validateImage()`.
- `size{}` - Image dimensions, set by `simgr.validateImage()`.

Only `path` and `name` are required to `PUT` an image into S3. `identity` and `format` are assumed to be present when `GET`ting a variant.

### var simgr = Simgr(options)

```js
var Simgr = require('simgr')

var simgr = Simgr(options)
```

Creates a new `Simgr` instance with some options.

### PUT

This section is for saving a file to later create variants from.

#### simgr.validateImage(metadata, callback(err))

Validates an image file. Checks for file size, pixel area, and format.

```js
var metadata = {
  path: '/tmp/someimage.jpg'
}

simgr.validateImage(metadata, function (err) {
  if (err)
    return callback(err)

  // continue
})
```

Populates `metadata` with `metadata.format`, `metadata.length`, and `metadata.size`.

#### simgr.identifyImage(metadata, callback(err))

Populates `metadata` with `metadata.identity` from a `identify -verbose image.jpg` dump.

#### simgr.checkHTTPHeaders(request || response)

Validate an HTTP request or response for headers. 
Uses try/catch.
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
so it's not good enough for security.

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

#### simgr.getFilesize(filename, callback(err, length))

Get the filesize of an image.

#### simgr.getDimensions(filename, callback(err, dimensions))

Get the dimensions of an image.

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

#### simgr.cwebp

If `!!simgr.cwebp`, WebP is supported on this platform.

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