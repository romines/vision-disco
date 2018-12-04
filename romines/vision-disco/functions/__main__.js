const vision = require('@google-cloud/vision');
const axios = require('axios');
const admin = require('firebase-admin');
// require('axios-debug')(axios);

const discogs = {
  key: process.env.discogsKey,
  secret: process.env.discogsSecret,
};

// const visionUrl = 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyBuofqT7VyNjh9wRPjWGW55B3iYWRo0uy8';

/**
 * A discogs search by album cover function
 * @param {string} fileName google cloud storage bucket file name
 * @returns {object}
 */
module.exports = async (
  fileName = 'bc07f362-a5ee-467d-adf7-96e19a5336cc.jpg',
  context
) => {
  // Creates a client
  const client = new vision.ImageAnnotatorClient();

  const bucketName = 'vision-testing-disco.appspot.com';

  return (
    client
      .webDetection(`gs://${bucketName}/${fileName}`)
      .then(results => {
        const webDetection = results[0].webDetection;
        let bestGuess, discogPages;

        if (webDetection.bestGuessLabels.length) {
          console.log(
            `Best guess labels found: ${webDetection.bestGuessLabels.length}`
          );
          bestGuess = webDetection.bestGuessLabels.map(label => ({
            text: label.label,
            searchString: getSearchString(label.label),
          }));
        }
        if (webDetection.pagesWithMatchingImages.length) {
          discogPages = webDetection.pagesWithMatchingImages
            .filter(page => page.url.includes('discogs.com'))
            .map(page => page.url);
        }
        if ((!bestGuess.length && !discogPages.length) || bestGuess[0].text === 'album cover') {
          return Promise.resolve({
            error: 'No results found'
          });
        } else {
          return Promise.resolve({
            bestGuess,
            discogPages,
          });
        }
      })
      .then(async (visionResults) => {
        if (visionResults.bestGuess && visionResults.bestGuess[0].text !== 'album cover') {
          try {
            const discogsResults = await axios({
              url: `https://api.discogs.com/database/search?q=${visionResults.bestGuess[0].searchString}&type=master&key=${
                discogs.key
              }&secret=${discogs.secret}`,
              headers: {
                'User-Agent': 'request',
              },
            });

            visionResults.discogsResults = discogsResults.data.results.length ? discogsResults.data.results : [];

          } catch (e) {
            console.error(e);
            return e;
          }
        }
        return visionResults;
      })
      .catch(err => {
        // console.error('ERROR:', err);
        return err;
      })
  );

};

function getSearchString(str) {
  return str.replace(/ /g, '+');
}
