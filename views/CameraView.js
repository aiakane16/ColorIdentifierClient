import React, { Component, Fragment } from 'react'
import { View, StatusBar, Modal, Text, Image, StyleSheet } from 'react-native'
import { Appbar, Menu, Divider, ActivityIndicator, Colors } from 'react-native-paper'
import { RNCamera as  Camera } from 'react-native-camera';
import * as Permissions from 'expo-permissions';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import Toolbar from '../component/Toolbar';
import styles from '../styles';
import App from '../App';
import Svg, { Circle, Rect, Text as SVGText } from 'react-native-svg';

export default class CameraView extends React.Component {

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
        detectedObjects: [],
        camera: null,
    }

    setCameraPermission = hasCameraPermission => this.setState({ hasCameraPermission })

    setAudioPermission = hasAudioPermission => this.setState({ hasAudioPermission })
    
    setFlashMode = flashMode => this.setState({ flashMode })

    setCameraType = cameraType => this.setState({ cameraType })

    handleCaptureIn = () => {
        this.setState({ capturing: true })
    };
  
    handleCaptureOut = () => {
        if (this.state.capturing)
            this.camera.stopRecording();
    };

    handleShortCapture = async () => {
        await this.captureImage()
    }

    captureImage = async (resolve) => {
        try{
            var photoData = await this.camera.takePictureAsync();

            console.log(photoData)
    
            var savedPhoto = await MediaLibrary.createAssetAsync(photoData.uri)
    
            // const album = await MediaLibrary.createAlbumAsync('ColorIdentifier', savedPhoto);

            // console.log(album)
            
            var { uri , height , width } = savedPhoto;

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
        
            data.append("image", {
                uri: photo.uri,
                name: 'sample',
                type: 'image/jpg'
            });

            var response = await fetch("http://" + getIpAddress() + "/imgpredict", {
                method: "POST",
                body: data,
            })

            var json = await response.json()

            alert("Colors Identification Success!");

             this.setState({
                detectedObjects: json
            })

            this.setState({  savingImage : false, modalVisible: true })


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
                    onRequestClose={() => this.setState({modalVisible : false, detectedObjects: []})}
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
                            onPress={() => this.setState({modalVisible : false, detectedObjects: []})}
                            />
                            <Appbar.Content
                                title="Captured Image"
                                subtitle="Raw Image"
                            />
                            {this.state.savingImage ? <ActivityIndicator animating={true} color={Colors.white} /> : <Appbar.Action icon="magnify" color={'#fff'} onPress={() => { this.saveImage(capturedImage) }} />}
                            
                        </Appbar>

                        <View style={styles.imageModalContainer} >
                            {capturedImage ? <Image 
                            source={{uri: capturedImage.uri }} 
                            style={styles.imageFullsize}
                            resizeMode='contain'
                            /> : <Text>No Image Captured</Text>}
                        </View>

                        <View style={
                            [
                            StyleSheet.absoluteFill,
                            {
                                flex: 1,
                                paddingTop:100,
                                paddingBottom:100,
                                paddingLeft: 20,
                                paddingRight:20
                            }
                            ]
                        }>
                            {
                            capturedImage ?  <Svg 
                                style={{
                                flex: 1,
                                width: null,
                                height:null,
                                alignSelf: 'stretch'
                            }}
                            height="100%" width="100%" viewBox={"0 0 " + capturedImage.width + " " + capturedImage.height}>
                            
                            {this.state.detectedObjects.map((detectedObject) => {
                            return (<View>
                                
                                <SVGText
                                    fill="#fff"
                                    stroke="black"
                                    fontSize="100"
                                    fontWeight="bold"
                                    x={detectedObject.topleft.x}
                                    y={detectedObject.topleft.y - 50}
                                    textAnchor="start"
                                    >
                                    {detectedObject.color ?? 'No Color Detected'}
                                    </SVGText>
                                    
                                    <Rect
                                    x={detectedObject.topleft.x}
                                    y={detectedObject.topleft.y}
                                    width={detectedObject.bottomright.x - detectedObject.topleft.x}
                                    height={detectedObject.bottomright.y - detectedObject.topleft.y}
                                    fill="rgb(0,0,0,0)"
                                    stroke="blue"
                                    strokeWidth="50"
                                    />
                                </View>)
                                })}
                        </Svg> : null
                        }
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