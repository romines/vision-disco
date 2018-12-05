import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera, Icon, Permissions, WebBrowser } from 'expo';
import firebase from 'firebase';
import uuid from 'uuid';

const config = {
  apiKey: 'AIzaSyCL6HAQVcCbSdfDo4U5wTOyoc_CnCLoPlk',
  authDomain: 'vision-testing-disco.firebaseapp.com',
  databaseURL: 'https://vision-testing-disco.firebaseio.com',
  projectId: 'vision-testing-disco',
  storageBucket: 'vision-testing-disco.appspot.com',
  messagingSenderId: '361274099036',
};
firebase.initializeApp(config);

export default class HomeScreen extends React.Component {
  state = {
    hasCameraPermission: null,
    showCamera: false,
  };
  static navigationOptions = {
    header: null,
  };

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  }

  render() {
    const { showCamera } = this.state;
    const content = showCamera ? this.renderCamera() : this.renderWelcome();
    return <View style={styles.container}>{content}</View>;
  }

  renderWelcome() {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.welcomeContainer}>
          <TouchableOpacity
            onPress={this._handleCameraToggle}
            style={styles.launchCameraButton}
          >
            <Icon.Ionicons
              name={Platform.OS === 'ios' ? `ios-camera` : 'md-camera'}
              size={60}
            />
          </TouchableOpacity>
          <Text style={styles.releasePageLinkText}>
            Search Release by Album Cover.z
          </Text>
        </View>
      </ScrollView>
    );
  }

  renderCamera() {
    const { hasCameraPermission } = this.state;
    if (hasCameraPermission === null) {
      return <View />;
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    } else {
      return (
        <View style={styles.cameraContainer}>
          <View style={styles.cameraAndButton}>
            <TouchableOpacity onPress={this._handleCameraToggle} style={{}}>
              <Icon.Ionicons
                name={
                  Platform.OS === 'ios' ? `ios-arrow-back` : 'md-arrow-back'
                }
                size={60}
              />
            </TouchableOpacity>
            <Camera
              ref={ref => {
                this.camera = ref;
              }}
              style={styles.camera}
              type={Camera.Constants.Type.back}
              ratio="1:1"
            >
              <View style={styles.innerCameraContainer} />
            </Camera>
            <TouchableOpacity
              onPress={this._handleSnap}
              style={styles.snapButton}
            >
              <Icon.Ionicons
                name={Platform.OS === 'ios' ? `ios-camera` : 'md-camera'}
                size={60}
              />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }

  _handleCameraToggle = () => {
    this.setState(state => ({
      showCamera: !state.showCamera,
    }));
  };

  _handleSnap = async () => {
    if (this.camera) {
      try {
        // console.log('inside try');
        const photo = await this.camera.takePictureAsync();
        const fetched = await fetch(photo.uri);
        const blob = await fetched.blob();
        const filename = `${uuid.v4()}.jpg`;
        const ref = firebase
          .storage()
          .ref()
          .child(filename);
        const { metadata } = await ref.put(blob);
        // const metadata = {
        //   fullPath: 'db664d86-0913-4bde-8088-2ea6a826f931.jpg',
        // };
        const stdLibResponse = await fetch(
          `https://romines.lib.id/vision-disco@dev?fileName=${
            metadata.fullPath
          }`
        );
        const json = await stdLibResponse.json();
        // console.log(json);
        this.setState({ showCamera: false });
        //
        WebBrowser.openBrowserAsync(`https://www.discogs.com${json.discogsResults[0].uri}`);
      } catch (e) {
        const error = `${e}`;
        alert(error.substr(0, 240));
      }
    }
  };

  _handleLaunchBrowserPress = () => {
    WebBrowser.openBrowserAsync(
      'https://www.discogs.com//The-Johnny-Otis-Show-The-Johnny-Otis-Show-Live-At-Monterey/master/295307'
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  launchCameraButton: {
    marginBottom: 10,
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  releasePageLink: {
    paddingVertical: 15,
  },
  releasePageLinkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
  cameraContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: 'blue',
  },
  cameraAndButton: {
    flexDirection: 'column',
    flex: 1,
  },
  camera: {
    borderWidth: 2,
    borderColor: 'red',
    aspectRatio: 1,
    // flex: 7,
  },
  snapButton: {
    alignItems: 'center',
  },
  // innerCameraContainer: {
  //   // flexDirection: 'column',
  //   alignItems: 'center',
  //   justifyContent: 'flex-end',
  //   flex: 1,
  // },
});
