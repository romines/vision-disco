module.exports = {
  requests: [
    {
      features: [
        { type: 'WEB_DETECTION'}
      ],
      image: {
        source: {
          gcsImageUri: ''
        }
      },
      imageContext: {
        webDetectionParams: {
          includeGeoResults: false
        }
      }
    }
  ]
};