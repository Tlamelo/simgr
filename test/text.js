// Check to make sure it knows when a file isn't an image.

describe('TEXT', function () {
  var metadata = {
    name: 'klajsdfklajsdf',
    path: __filename
  }

  it('should error on identify', function (done) {
    simgr.identifyImage(metadata, function (err) {
      err.key.should.equal('file-not-an-image')
      done()
    })
  })
})