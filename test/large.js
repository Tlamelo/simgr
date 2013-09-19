describe('LARGE', function () {
  var metadata = {
    name: 'natalie' + rand,
    path: path.join(__dirname, 'images', 'natalie.jpg')
  }

  describe('PUT', function () {
    it('should identify', function (done) {
      simgr.identifyImage(metadata, done)
    })

    it('should upload', function (done) {
      simgr.uploadImage(metadata, done)
    })
  })

  describe('GET WEBP', function () {
    it('should work', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'a',
        format: 'webp'
      }, done)
    })
  })
})