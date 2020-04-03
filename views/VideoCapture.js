import React, { Component, Fragment } from 'react'
import { View, StatusBar, Modal, Text, Image } from 'react-native'
import { Appbar, Menu, Divider, ActivityIndicator, Colors } from 'react-native-paper'
import { Camera } from 'expo-camera';
import * as Permissions from 'expo-permissions';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { Video } from 'expo-av';
import Toolbar from '../component/Toolbar';
import styles from '../styles';
import App from '../App';

export default class VideoCapture extends React.Component {

    state = {
        hasAudioPermission: false,
        hasCameraPermission: false,
        cameraType: Camera.Constants.Type.back,
        flashMode: Camera.Constants.FlashMode.off,
        modalVisible: false,
        capturedImage: null,
        capturing: false,
        menuVisible: false,
        savingImage: false,
    }

    setCameraPermission = hasCameraPermission => this.setState({ hasCameraPermission })

    setAudioPermission = hasAudioPermission => this.setState({ hasAudioPermission })
    
    setFlashMode = flashMode => this.setState({ flashMode })

    setCameraType = cameraType => this.setState({ cameraType })

    handleLongCapture = async () => {
        await this.captureImage()
        
    }

    handleCaptureIn = () => {
        this.setState({ capturing: true })
    };
  
    handleCaptureOut = () => {
        console.log('hello world')
        if (this.state.capturing)
            this.camera.stopRecording();
    };

    handleShortCapture = async () => {
        // await this.captureImage()
    }

    onPlaybackStatusUpdate = async (data) => {
        // console.log(data)
    }

    captureImage = async (resolve) => {
        try{
            var photoData = await this.camera.recordAsync({
                quality: Camera.Constants.VideoQuality['720p']
            });

            var savedPhoto = await MediaLibrary.createAssetAsync(photoData.uri)
    
            // var album = await MediaLibrary.createAlbumAsync('ColorIdentifier', savedPhoto, false);

            // var movedAsset = await MediaLibrary.getAssetInfoAsync(savedPhoto);

            // console.log(movedAsset)

            this.setState({ 
                capturing: false, 
                capturedImage: savedPhoto,
            })

            this.setState({
                modalVisible: true,
            })
          }catch(e){
            console.log(e)
          }
    }

    saveImage = async (photo) => {
        try{
            var { getIpAddress } = this.props.route.params;

            this.setState({ savingImage : true })

            const data = new FormData();
        
            data.append("video", {
                uri: photo.uri,
                name: 'sample',
                type: 'video/mp4'
            });

            var response = await fetch("http://" + getIpAddress() + "/video", {
                method: "POST",
                body: data,
            })

            var file = await FileSystem.downloadAsync(
                "http://" + getIpAddress() + "/video",
                FileSystem.documentDirectory + 'ColorIdentifier/IdentifiedColor/sample3.mp4'
            )

            console.log(file)

            alert("Colors Identification Success!");

            this.setState({ capturedImage: file , savingImage : false, modalVisible: true })
            
            // response = await fetch("http://" + getIpAddress() + "/vidpredict", {
            //     method: "POST",
            //     body: data,
            // })

            // var json = await response.json();

            // console.log(json)

        }catch(error){
            console.log(error)
            alert("Colors Identification Failed!");

            this.setState({ savingImage : false, modalVisible: false })

        }
        


    }

    componentDidMount = async () => {

        const cameraPermission = await Permissions.askAsync(Permissions.CAMERA)

        const audioPermission = await Permissions.askAsync(Permissions.AUDIO_RECORDING)

        const hasCameraPermission = (cameraPermission.status === 'granted')

        const hasAudioPermission = (audioPermission.status === 'granted')

        this.setCameraPermission(hasCameraPermission)

        this.setAudioPermission(hasAudioPermission)
    }

    render(){
        var { cameraType, flashMode, capturedImage, menuVisible } = this.state;

        return(
            <Fragment>
                <StatusBar barStyle="light-content" />
                
                <View style={{ flex: 1}}>
                    <Camera 
                        type={cameraType}
                        flashMode={flashMode}
                        style={styles.cameraPreview}
                        ratio="16:9"
                        ref={(camera) => this.camera = camera}
                    />
                </View>

                <Modal
                    style={styles.imageModal}
                    animationType="fade"
                    visible={this.state.modalVisible}
                    onRequestClose={() => this.setState({modalVisible : false})}
                    >
                    <View style={styles.imageModal}>

                        <Appbar dark={true} style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            flex:1,
                            justifyContent: 'flex-end',
                            backgroundColor: 'rgba(0,0,0,0)'
                        }}>
                            <Appbar.BackAction
                            onPress={() => this.setState({modalVisible : false}) }
                            />
                            <Appbar.Content
                                title="Captured Image"
                                subtitle="Raw Image"
                            />
                            {this.state.savingImage ? <ActivityIndicator animating={true} color={Colors.white} /> : <Appbar.Action icon="magnify" color={'#fff'} onPress={() => { this.saveImage(capturedImage) }} />}
                            
                        </Appbar>

                        <View style={styles.imageModalContainer} >
                        {this.state.capturedImage ? <Video
                            source={{ uri: this.state.capturedImage.uri }}
                            useNativeControls={true}
                            rate={1.0}
                            volume={1.0}
                            isMuted={false}
                            resizeMode={Video.RESIZE_MODE_CONTAIN}
                            onPlaybackStatusUpdate={this.onPlaybackStatusUpdate}
                            shouldPlay={true}
                            isLooping={true}
                            
                            onReadyForDisplay={this.onReadyForDisplay}
                            style={styles.imageFullsize}
                            /> : <Text>No Image Selected</Text>}
                    </View>
                    </View>
                </Modal>

                <Toolbar
                    capturing={false}
                    flashMode={flashMode}
                    cameraType={cameraType}
                    setFlashMode={this.setFlashMode}
                    setCameraType={this.setCameraType}
                    onCaptureIn={this.handleCaptureIn}
                    onCaptureOut={this.handleCaptureOut}
                    onLongCapture={this.handleLongCapture}
                    onShortCapture={this.handleShortCapture}
                    setCaptureMode={this.setCaptureMode}
                />
            </Fragment>
        )
    }

}