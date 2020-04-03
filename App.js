import React, { Component, Fragment} from 'react';
import { View, FlatList, Text, StatusBar, Image, Modal, TouchableHighlight, Alert, DrawerLayoutAndroid, StyleSheet } from 'react-native';
import { Appbar, FAB, Button, Paragraph, Menu, Divider, Provider, List, ActivityIndicator, Colors  } from 'react-native-paper';
import GalleryThumbnail from './component/GalleryThumbnail'
import * as Permissions from 'expo-permissions';
import * as MediaLibrary from 'expo-media-library';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import styles from './styles';
import Svg, { Circle, Rect, Text as SVGText } from 'react-native-svg';
import _ from 'lodash';

export default class App extends Component {

  state = {
    galleryItems : [],
    assets: null,
    modalVisible: false,
    menuVisible: false,
    chosenImage: null,
    colorModalVisible : false,
    colors: [],
    detectedObjects: [],
  }
  

  setAssets  = assets => this.setState({ assets })

  loadAssets = loadAssets => {
    var { assets, galleryItems } = this.state;

    assets = galleryItems.concat(assets.assets);
  
    this.setState({ galleryItems: assets });

    this.setAssets(loadAssets);
  }

  showColorList = async () => { 
    var response = await fetch('https://jonasjacek.github.io/colors/data.json')
    var colors = await response.json()
    this.setState({colors})
    this.setState({ colorModalVisible: true , menuVisible: false})
  }

  showCamera = () => {
    this.setState({menuVisible: false})
    this.props.navigation.navigate('ImageCapture', { viewImage: this.viewImage })
  }

  viewImage = (image) => {
    this.setState({modalVisible: true})
    this.setState({chosenImage: image})
  }

  galleryEndReach =  async () => {

    var { assets } = this.state;

    if (assets.hasNextPage) {
      var newAssets = await MediaLibrary.getAssetsAsync({
        after: assets.endCursor,
        sortBy: MediaLibrary.SortBy.default
      });

      this.loadAssets(newAssets);
    }

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

  captureImage = () => {

  }

  reloadGallery = async () => {
    this.setState({ reloading: true , galleryItems : [ ]}
      )

    var newAssets = await MediaLibrary.getAssetsAsync({
      sortBy: MediaLibrary.SortBy.default
    });
  
    this.setState({ galleryItems: newAssets.assets, reloading: false });

    this.setAssets(newAssets);

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

        // var response = await fetch("http://" + getIpAddress() + "/predict", {
        //     method: "POST",
        //     body: data,
        // })

        // var blob = await response.blob()

        // var dataURL = await new Promise((resolve,reject) => {
        //     const reader = new FileReader()
        //     reader.onloadend = () => {
        //         resolve(reader.result)
        //     }
        //     reader.onerror = reject
        //     reader.readAsDataURL(blob)
        // })

        // var capturedImage = {
        //     uri: dataURL,
        //     width: photo.width,
        //     height: photo.height
        // }

        var response = await fetch("http://" + getIpAddress() + "/imgpredict", {
          method: "POST",
          body: data,
        })

        var json = await response.json()

        console.log(json)
        
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
    const cameraRollPermission = await Permissions.askAsync(Permissions.CAMERA_ROLL)

    if(cameraRollPermission.granted){

      var { assets } = this.state;

      assets = await MediaLibrary.getAssetsAsync({
        sortBy: MediaLibrary.SortBy.default
      })
      
      this.setAssets(assets)

      this.loadAssets(assets)
    }
  }
  
  render() {
    var { galleryItems, chosenImage, menuVisible, colors } = this.state;

    return (
        <Fragment>

          <StatusBar barStyle="dark-content" />

          <Appbar style={styles.header} >
            <Appbar.Action icon="menu" color={'#fff'} onPress={() => { this.props.navigation.openDrawer(); }} />
            <Appbar.Content title="Color Identifier" subtitle="Image Gallery" />
            {this.state.reloading ? <ActivityIndicator animating={true} color={Colors.white} /> : <Appbar.Action icon="refresh" color={'#fff'} onPress={this.reloadGallery} />}

            <Menu
              visible={menuVisible}
              onDismiss={()=> this.setState({menuVisible: false}) }
              anchor={<Appbar.Action icon="dots-vertical" color={'#fff'} onPress={()=> this.setState({menuVisible: true})} />}
            >
              <Menu.Item icon="camera" onPress={this.showCamera} title="Capture" />
              <Divider />
              <Menu.Item icon="help-circle"  onPress={this.showColorList} title="About" />
            </Menu>

          </Appbar>

          <Modal
            style={styles.imageModal}
            animationType="fade"
            visible={this.state.modalVisible}
            onRequestClose={() => this.setState({modalVisible : false , detectedObjects: []})}
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
                  onPress={() => this.setState({modalVisible : false,  detectedObjects: []}) }
                  />
                  <Appbar.Content
                      title="Captured Image"
                      subtitle="Raw Image"
                  />
                  {this.state.savingImage ? <ActivityIndicator animating={true} color={Colors.white} /> : <Appbar.Action icon="magnify" color={'#fff'} onPress={() => { this.saveImage(chosenImage) }} />}
                </Appbar>

              <View style={{
                flex: 1,
                paddingTop:100,
                paddingBottom:100,
                paddingLeft: 20,
                paddingRight:20
              }} >
                {chosenImage ? <Image 
                    source={{uri: chosenImage.uri }} 
                    style={{
                      flex: 1,
                      width: null,
                      height:null,
                      alignSelf: 'stretch'
                    }}
                    resizeMode='contain'
                    /> : <Text>No Image Selected</Text>}


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
                              strokeWidth="50"
                            />
                          </View>)
                          })}
                  </Svg> : null
                  }
                  </View>
            </View>
          </Modal>

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
    );
  }
}
