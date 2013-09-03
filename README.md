# simgr - Simple Image Resizer [![Build Status](https://travis-ci.org/funraiseme/simgr.png)](https://travis-ci.org/funraiseme/simgr)

Simgr is a library for your app to manage different variants of your images (basically different sizes).
However, instead of the usual batch resizing,
Simgr creates each variant on demand.
Empirically, this works better on low memory platforms.

Simgr currently works on an Heroku instance (512MB) with up to 25MP images with S3 and behind CloudFront.

## Features, Support, and Limitations

- Image validation for HTTP streams
- Designed for low-memory platforms
- WebP output support
- Convert GIFs to WebM and MP4 - significantly reduces the size of the GIF and increases performance on all modern browsers
- Colorspace correction when resizing - Only supports sRGB and Grayscale colorspaces
- Uses imagemagick, cwebp, jpegtran, and ffmpeg libraries
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

Theora is not supported as WebM is more widely supported,
but adding support is trivial.

## Documentation

View the [wiki](https://github.com/funraiseme/simgr/wiki/_pages).

### Temporary files

Temporary files are stored in the folder `simgr.tmpdir`.
You must clean these files yourself.
A helpful utility is [visionmedia/reap](https://github.com/visionmedia/reap).

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