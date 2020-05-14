/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { PureComponent } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  AppRegistry,
  TextInput,
  TouchableOpacity 
} from 'react-native';

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import { RNCamera } from 'react-native-camera';
import RNFetchBlob from 'rn-fetch-blob';

class LiveCapture extends PureComponent {

  state = {
    recording: false,
    value: '192.168.254.158:8000',
    stream:  null,
  }

  onChangeText = (text) => {
    this.setState({value : text})
  }

  componentDidMount = () => {
      console.log('hello world ')
  }

  render() {
    return (
      <View style={styles.container}>
        <TextInput
          style={{ height: 40, borderColor: 'gray', borderWidth: 1 , color:'#fff'}}
          editable={true}
          onChangeText={text => this.onChangeText(text)}
          value={this.state.value}
        ></TextInput>
        
        <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.on}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          androidRecordAudioPermissionOptions={{
            title: 'Permission to use audio recording',
            message: 'We need your permission to use your audio',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          onRecordingStart={this._recordingStart}
          onRecordingEnd={this._recordingEnd}
        />
        <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center' }}>
          <TouchableOpacity onPress={this.takePicture} style={styles.capture}>
            <Text style={{ fontSize: 14 }}> SNAP </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  _recordingStart =  async ({ nativeEvent }) => {
    var { uri } = nativeEvent
    var data = "";
    console.log('recording start')
    try{
      await new Promise((resolve,reject) => {
        const ws = new WebSocket('ws://' + this.state.value);

        ws.onopen = async (event) => {
          console.log('ws opened')
          
          this.stream = await RNFetchBlob.fs.readStream(
            uri,
            "base64"
          );

          this.stream.onEnd(() => {
            console.log('stream end')
            ws.close();
            resolve(uri)
          });

          this.stream.onError(reject);

          this.stream.onData(chunk => {
            data += chunk

            var obj = {
              message : chunk
            };

            var stringobj = JSON.stringify(obj)
            ws.send(chunk);
          }); // Append the data

          this.stream.open(); // Start consuming
        }

        ws.onclose = () => {
          console.log('closed')
        }

        ws.onerror = (error ) => {
          console.log(error)
        }

        ws.onmessage = (msg) => {
          console.log(msg)
        }
      })

    }catch(e){
      console.log(e)
    }
   
  }

  _recordingEnd = () => {
    console.log(this.stream)
    if(this.stream){
      console.log('recording stop triggered')
      this.stream.stop()
    }
  }


  takePicture = async() => {

    if (this.camera) {
      if(this.state.recording){
        var data = await this.camera.stopRecording();
        this.setState({ recording: false })
      }else{
        const options = { quality: 0.5, base64: true };
        this.setState({ recording: true })
        var data = await this.camera.recordAsync();
      }
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 2,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20,
  },
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default LiveCapture;
