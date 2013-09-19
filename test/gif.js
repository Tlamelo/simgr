describe('GIF', function () {
  var image = path.join(__dirname, 'images', 'crazy-laugh.gif')

  var metadata = {
    name: 'crazy-laugh' + rand,
    path: image
  }

  describe('PUT', function () {
    it('should identify', function (done) {
      simgr.identifyImage(metadata, done)
    })

    it('should have the correct frames', function () {
      metadata.frames.should.equal(119)
    })

    it('should have the correct dimensions', function () {
      metadata.width.should.equal(230)
      metadata.height.should.equal(175)
    })

    it('should have a different signature than the first frame', function (done) {
      gm(metadata.path).identify('%# ', function (err, signatures) {
        if (err)
          throw err

        var signature = signatures.split(' ').shift()

        metadata.signatures[0].should.not.equal(signature)
        metadata.signatures.length.should.equal(1)
        done()
      })
    })

    it('should upload', function (done) {
      simgr.uploadImage(metadata, done)
    })
  })

  describe('GET JPEG', function () {
    var filename, headers, signatures

    it('should create a variant', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'a',
        format: 'jpg'
      }, function (err, _filename, _headers, _signatures) {
        if (err)
          throw err

        filename = _filename
        headers = _headers
        signatures = _signatures
        done()
      })
    })

    it('should have correct headers', function () {
      headers['content-length'].should.be.ok
      headers['content-type'].should.equal('image/jpeg')
      headers['etag'].should.be.ok
      headers['last-modified'].should.be.ok
    })

    it('should be JPEG', function (done) {
      gm(filename).format(function (err, format) {
        if (err)
          throw err

        format.should.equal('JPEG')

        done()
      })
    })

    it('should have 1 frame', function (done) {
      gm(filename).identify('%n ', function (err, frames) {
        if (err)
          throw err

        frames.trim().should.equal('1')
        done()
      })
    })
  })

  describe('GET WEBP', function () {
    var headers

    it('should create a variant', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'a',
        format: 'webp'
      }, function (err, _filename, _headers, _signatures) {
        if (err)
          throw err

        headers = _headers
        done()
      })
    })

    it('should have the correct headers', function () {
      headers['content-length'].should.be.ok
      headers['content-type'].should.equal('image/webp')
      headers['etag'].should.be.ok
      headers['last-modified'].should.be.ok
    })
  })

  describe('GET GIF', function () {
    var filename

    it('should create a variant', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'o',
        format: 'gif'
      }, function (err, _filename) {
        if (err)
          throw err

        filename = _filename
        done()
      })
    })

    it('should be the same image', function (done) {
      simgr.getHash(image, function (err, hash) {
        if (err)
          throw err

        simgr.getHash(filename, function (err, hash2) {
          if (err)
            throw err

          hash.should.equal(hash2)
          done()
        })
      })
    })

    it('should not allow gif resizes', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'a',
        format: 'gif'
      }, function (err) {
        if (!err)
          throw new Error()

        done()
      })
    })
  })

  describe('GET WEBM', function () {
    var filename

    it('should create a variant', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'o',
        format: 'webm'
      }, function (err, _filename) {
        if (err)
          throw err

        filename = _filename
        done()
      })
    })

    it('should have vp8 encoding', function (done) {
      ffmeta(filename, function (metadata, err) {
        if (err)
          throw err

        metadata.video.codec.should.equal('vp8')
        done()
      })
    })
  })

  describe('GET MP4', function () {
    var filename

    it('should create a variant', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'o',
        format: 'mp4'
      }, function (err, _filename) {
        if (err)
          throw err

        filename = _filename
        done()
      })
    })

    it('should have h264 encoding', function (done) {
      ffmeta(filename, function (metadata, err) {
        if (err)
          throw err

        metadata.video.codec.should.equal('h264')
        done()
      })
    })
  })
})