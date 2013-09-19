describe('TIFF', function () {
  var image = path.join(__dirname, 'images', 'tiff.tiff')

  var metadata = {
    name: 'tiff' + rand,
    path: image
  }

  describe('PUT', function (done) {
    it('should identify', function (done) {
      simgr.identifyImage(metadata, done)
    })

    it('should upload', function (done) {
      simgr.uploadImage(metadata, done)
    })

    it('should be tiff', function () {
      metadata.format.should.equal('tiff')
    })
  })

  describe('GET TIFF', function () {
    it('should return a png', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'l',
        format: 'tiff'
      }, function (err, filename) {
        assert.ifError(err)

        gm(filename).format(function (err, format) {
          assert.ifError(err)

          format.should.equal('PNG')
          done()
        })
      })
    })
  })

  describe('GET PNG', function () {
    it('should work', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'l',
        format: 'png'
      }, done)
    })

    it('should get PNG by default', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'l'
      }, function (err, filename) {
        assert.ifError(err)

        gm(filename).format(function (err, format) {
          assert.ifError(err)

          format.should.equal('PNG')
          done()
        })
      })
    })
  })
})