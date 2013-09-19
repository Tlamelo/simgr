describe('Grayscale', function () {
  var metadata = {
    name: 'justin' + rand,
    path: path.join(__dirname, 'images', 'justin.jpg')
  }

  describe('PUT', function (done) {
    it('should work', function (done) {
      simgr.identifyImage(metadata, function (err) {
        if (err)
          throw err

        metadata.colorspace.should.equal('Gray')

        simgr.uploadImage(metadata, done)
      })
    })
  })

  describe('GET', function (done) {
    var filename

    it('should work', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'l',
        format: 'jpg'
      }, function (err, _filename) {
        if (err)
          throw err

        filename = _filename

        done()
      })
    })

    it('should still be grayscale', function (done) {
      gm(filename).identify(function (err, identity) {
        if (err)
          throw err

        identity.Colorspace.should.equal('Gray')

        done()
      })
    })
  })
})