describe('WEBP', function () {
  var image = path.join(__dirname, 'images', 'selena.webp')

  var metadata = {
    name: 'selena' + rand,
    path: image
  }

  describe('PUT', function () {
    it('should identify', function (done) {
      simgr.identifyImage(metadata, done)
    })

    it('should be PNG', function () {
      metadata.format.should.equal('png')
      metadata.Format.should.equal('PNG')
    })

    it('should have the original', function () {
      metadata.originalPath.should.equal(image)
    })

    it('should have four signatures', function () {
      metadata.signatures.length.should.equal(4)
    })
  })
})