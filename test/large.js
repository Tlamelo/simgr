describe('LARGE', function () {
  var image = path.join(__dirname, 'images', 'natalie.jpg')

  var metadata = {
    name: 'natalie' + rand,
    path: image
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