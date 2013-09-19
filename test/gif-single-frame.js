describe('GIF SINGLE', function () {
  var image = path.join(__dirname, 'images', 'sunflower.gif')

  var metadata = {
    name: 'sunflower' + rand,
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
  })
})