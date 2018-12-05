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
  const imagePath = `gs://${bucketName}/${fileName}`;

  const webDetectionResults = await client.webDetection(imagePath);
  const webDetection = webDetectionResults[0].webDetection;
  const results = {
    bestGuess: null,
    discogPages: null,
  };

  if (webDetection.bestGuessLabels.length) {
    console.log(
      `Best guess labels found: ${webDetection.bestGuessLabels.length}`
    );
    results.bestGuess = webDetection.bestGuessLabels
      .filter(label => label.label !== 'album cover')
      .map(label => ({
        text: label.label,
        searchString: getSearchString(label.label),
      }));
  }
  if (webDetection.pagesWithMatchingImages.length) {
    results.discogPages = webDetection.pagesWithMatchingImages
      .filter(page => page.url.includes('discogs.com'))
      .map(page => page.url);
  }
  // if (!results.bestGuess.length && !results.discogPages.length) {
  //   // do text detection
  //   // const textDetection = await client.textDetection();
  // }

  const discogsResults = await getDiscogsResultsByString(
    results.bestGuess[0].text
  );
  return { discogsResults };
};

async function getDiscogsResultsByString(str) {
  try {
    console.log('try getDiscogsResultsByString');
    const discogsResults = await axios({
      url: `https://api.discogs.com/database/search?q=${getSearchString(
        str
      )}&type=master&key=${discogs.key}&secret=${discogs.secret}`,
      headers: {
        'User-Agent': 'request',
      },
    });

    return discogsResults.data.results;
  } catch (e) {
    console.error(e);
    return e;
  }
}

function getSearchString(str) {
  return str.replace(/ /g, '+');
}
