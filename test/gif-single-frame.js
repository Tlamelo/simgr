describe('GIF SINGLE', function () {
  var sunflower = path.join(__dirname, 'images', 'sunflower.gif')

  var metadata = {
    name: 'sunflower' + rand,
    path: sunflower
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
      metadata.originalPath.should.equal(sunflower)
    })

    // Not necessarily true.
    // I don't know enough about signatures.
    // it('should have one signature', function () {
    //   metadata.signatures.length.should.equal(1)
    // })
  })
})