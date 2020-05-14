import React, { Component, Fragment} from 'react';
import { View, FlatList, Text, StatusBar, Image, Modal, TouchableHighlight, Alert, DrawerLayoutAndroid, StyleSheet } from 'react-native';
import { Appbar, FAB, Button, Paragraph, Menu, Divider, Provider, List, ActivityIndicator, Colors  } from 'react-native-paper';
import GalleryThumbnail from '../component/GalleryThumbnail'
import * as Permissions from 'expo-permissions';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-av';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import styles from '../styles';
import _ from 'lodash';
import Svg, { Circle, Rect, Text as SVGText } from 'react-native-svg';
import RNFetchBlob from 'rn-fetch-blob';

export default class VideoGallery extends Component {

    state = {
        menuVisible : false,
        colorModalVisible : false,
        colors: [],
        galleryItems : [],
        assets: null,
        reloading: false,
        chosenImage: null ,
        videoRef: null,
        imageModal: false,
        modalVisible: false,
        detectedObjects: [],
        detectedObjectsPerFrame: [],
        frame: 0,
        x: 100,
        y: 100,
    }

    setAssets  = assets => this.setState({ assets })

    loadAssets = loadAssets => {
      var { assets, galleryItems } = this.state;
  
      assets = galleryItems.concat(assets.assets);
    
      this.setState({ galleryItems: assets });
  
      this.setAssets(loadAssets);
    }

    viewImage = (image) => {
        this.setState({modalVisible: true, chosenImage: image })
    }

    showColorList = async () => { 
        var response = await fetch('https://jonasjacek.github.io/colors/data.json')
        var colors = await response.json()
        this.setState({colors})
        this.setState({ colorModalVisible: true, menuVisible: false })
    }

    renderGalleryItem = ({index, item }) => {
        return (
          <TouchableHighlight
          onPress={() => {
            this.viewImage(item)
          }}
          >
              <View style={styles.thumbnailWrapper}
              >
                <Image 
                  source={{uri: item.uri }} 
                  style={styles.galleryThumbnail}
                   />
              </View>
          </TouchableHighlight>
          )
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
    
            // var response = await fetch("http://" + getIpAddress() + "/video", {
            //     method: "POST",
            //     body: data,
            // })

            // var file = await FileSystem.downloadAsync(
            //     "http://" + getIpAddress() + "/video",
            //     FileSystem.documentDirectory + 'ColorIdentifier/IdentifiedColor/sample3.mp4'
            // )

            var response = await fetch("http://" + getIpAddress() + "/vidpredict", {
                method: "POST",
                body: data,
            })

            var json = await response.json();

            this.setState({detectedObjectsPerFrame : json})

            this.setState({ detectedObjects : json[0]})

            alert("Colors Identification Success!");
    
            this.setState({  savingImage : false, modalVisible: true })
    
    
        }catch(error){
            console.log(error)
            alert("Colors Identification Failed!");
    
            this.setState({ savingImage : false, modalVisible: false })
    
        }
    }

    readFileStream = async(photo) => {
        var { uri } = photo
        var { getIpAddress } = this.props.route.params;

        var data = "";
        console.log('recording start')
        try{
        await new Promise((resolve,reject) => {
            const ws = new WebSocket('ws://192.168.254.158:3000');

            ws.onopen = async (event) => {
            console.log('ws opened')
            
            this.stream = await RNFetchBlob.fs.readStream(
                uri,
                "base64",
                1024 * 1024 * 100
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

    onReadyForDisplay = (videoSettings) => {
        // console.log(videoSettings)
    }

    reloadGallery = async () => {

        this.setState({ reloading: true , galleryItems : []})
    
        var newAssets = await MediaLibrary.getAssetsAsync({
            mediaType : [MediaLibrary.MediaType.video],
            sortBy: MediaLibrary.SortBy.default
        });
      
        this.setState({ galleryItems: newAssets.assets, reloading: false });
    
        this.setAssets(newAssets);
    
      }

    galleryEndReach =  async () => {

        var { assets } = this.state;

        if (assets.hasNextPage) {
            var newAssets = await MediaLibrary.getAssetsAsync({
                after: assets.endCursor,
                mediaType : [MediaLibrary.MediaType.video],
                sortBy: MediaLibrary.SortBy.default
            });

            this.loadAssets(newAssets);
        }

    }

    showCamera = () => {
        this.setState({menuVisible: false})
        this.props.navigation.navigate('VideoCapture', { viewImage: this.viewImage })
    }

    liveCamera = () => {
        this.setState({menuVisible: false})
        this.props.navigation.navigate('LiveCapture', { viewImage: this.viewImage })
    }

    componentDidMount = async () =>{
        const cameraRollPermission = await Permissions.askAsync(Permissions.CAMERA_ROLL)

        await FileSystem.makeDirectoryAsync( FileSystem.documentDirectory + 'ColorIdentifier/IdentifiedColor',{
            intermediates: true
        })

        let fileUri = FileSystem.documentDirectory + 'ColorIdentifier/IdentifiedColor/.nomedia';
        
        await FileSystem.writeAsStringAsync(fileUri, "", { encoding: FileSystem.EncodingType.UTF8 });
        
        if(cameraRollPermission.granted){
    
          var { assets } = this.state;
    
          assets = await MediaLibrary.getAssetsAsync({
            mediaType : [MediaLibrary.MediaType.video],
            sortBy: MediaLibrary.SortBy.default
          })
          
          this.setAssets(assets)
    
          this.loadAssets(assets)
        }


    }

    onPlaybackStatusUpdate = (playbackStatus) => {

        // var { frame } = this.state

        // if(this.state.frame == this.state.detectedObjectsPerFrame.length ){
        //     this.setState({ frame : 0 })
        // }
        
        // console.log(frame)

        // if(this.state.detectedObjectsPerFrame.length != 0 ){
        //     if(this.state.frame < this.state.detectedObjectsPerFrame.length - 1)
        //         this.setState({ detectedObjects: this.state.detectedObjectsPerFrame[frame] })
        //         this.setState({ frame : frame + 1 })
        // }

        // var { frame } = this.state;
        // if(playbackStatus.isPlaying){
        //     while(frame < this.state.detectedObjectsPerFrame.length){
        //         this.setState({ detectedObjects : this.state.detectedObjectsPerFrame[frame] })
        //         frame++;
        //         console.log(frame)
        //         this.setState({ frame })
        //     }

        //     // if(playbackStatus.isLooping && this.state.frame == this.state.detectedObjectsPerFrame.length){
        //     //     this.setState({ frame : 0 })
        //     // }
        // }
    }

    render(){
        var { menuVisible, colors, galleryItems, chosenImage } = this.state

        return(
            <Fragment>
                <StatusBar barStyle="dark-content" />
                <Appbar style={styles.header} >
                    <Appbar.Action icon="menu" color={'#fff'} onPress={() => { this.props.navigation.openDrawer(); }} />
                    <Appbar.Content title="Color Identifier" subtitle="Video Gallery" />
                    {this.state.reloading ? <ActivityIndicator animating={true} color={Colors.white} /> : <Appbar.Action icon="refresh" color={'#fff'} onPress={this.reloadGallery} />}

                        <Menu
                            visible={menuVisible}
                            onDismiss={()=> this.setState({menuVisible: false}) }
                            anchor={<Appbar.Action icon="dots-vertical" color={'#fff'} onPress={()=> this.setState({menuVisible: true})} />}
                        >
                        {/* <Menu.Item icon="video"  onPress={this.showCamera} title="Record" /> */}
                        {/* <Menu.Item icon="video-vintage"  onPress={this.liveCamera} title="Live" /> */}
                        <Divider />
                        <Menu.Item icon="help-circle"  onPress={this.showColorList} title="About" />
                        </Menu>
                </Appbar>

                <Modal
                    animationType="slide"
                    visible={this.state.colorModalVisible}
                    onRequestClose={() => this.setState({colorModalVisible : false})}
                >
                    <List.Section title="Registered Colors">
                        <FlatList
                            horizontal={false}
                            numColumns={1}
                            data={colors}
                            onEndReachedThreshold={0.5}
                            onEndReached={() => {}}
                            initialNumToRender={5}
                            renderItem={({ index, item }) => {
                            return (
                                <View style={{
                                flex:1,
                                alignContent: 'center',
                                justifyContent: 'center'
                                }}>
                                <List.Item title={item.name}
                                    titleStyle={{
                                    textShadowColor: '#000',
                                    textShadowOffset: {width: -1, height: 1},
                                    textShadowRadius: 10,
                                    textAlign: 'center',
                                    color: '#fff'
                                    }}
                                    style={{
                                    backgroundColor: item.hexString,
                                    }}
                                />
                                </View>
                            )
                            }}
                        />  
                    </List.Section>
                </Modal>

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
                        {this.state.savingImage ? <ActivityIndicator animating={true} color={Colors.white} /> : <Appbar.Action icon="magnify" color={'#fff'} onPress={() => { this.saveImage(chosenImage) }} />}
                        <Appbar.Action icon="save" color={'#fff'} onPress={() => { this.readFileStream(chosenImage) }} />
                        </Appbar>

                        <View style={{
                            flex:1,
                            paddingTop:100,
                            paddingBottom:100,
                            paddingLeft: 20,
                            paddingRight:20
                        }} >
                            {chosenImage ? <Video
                                source={{ uri: chosenImage.uri }}
                                useNativeControls={true}
                                rate={1.0}
                                volume={1.0}
                                isMuted={false}
                                resizeMode={Video.RESIZE_MODE_CONTAIN}
                                shouldPlay={true}
                                isLooping={true}
                                onReadyForDisplay={this.onReadyForDisplay}
                                style={styles.imageFullsize}
                                progressUpdateIntervalMillis={50}
                                onPlaybackStatusUpdate={this.onPlaybackStatusUpdate}
                                /> : <Text>No Video Selected</Text>}
                        </View>

                        {/* <View style={
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
                    chosenImage ?  <Svg 
                    style={{
                      flex: 1,
                      width: null,
                      height:null,
                      alignSelf: 'stretch'
                    }}
                    height="100%" width="100%" viewBox={"0 0 " + chosenImage.width + " " + chosenImage.height}>
                   
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
                              strokeWidth="20"
                            />
                          </View>)
                          })}
                  </Svg> : null
                  }
                  </View> */}

                        
                    </View>
                </Modal>            
                <View style={styles.gallery}>
                    <FlatList
                    horizontal={false}
                    numColumns={4}
                    data={galleryItems}
                    onEndReachedThreshold={0.5}
                    onEndReached={this.galleryEndReach}
                    initialNumToRender={10}
                    renderItem={this.renderGalleryItem}
                    />  
                </View>
            </Fragment>
        )
    }
}