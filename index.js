import 'react-native-gesture-handler';
import * as React from 'react';
import { DrawerLayoutAndroid, View, Text, StatusBar } from 'react-native'
import { registerRootComponent } from 'expo';
import { Provider as PaperProvider, List } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import App from './App';
import Header from './component/Header';
import CameraView from './views/CameraView';
import theme from './theme';
import GalleryNavigator from './component/GalleriesNavigator';
import VideoGalleryNavigator from './component/VideoGalleryNavigator';
import Settings from './component/Settings'

const Stack = createStackNavigator();

const Drawer = createDrawerNavigator();

var settings = {
  ipAddress: '192.168.254.158:8000',
  getIpAddress: () => {
    return this.ipAddress
  },
  updateIP: (newIP ) => {
    console.log('update ip called')
    this.ipAddress = newIP
    console.log(this.ipAddress)
  }
}

function Main() {

  return (
    <NavigationContainer>
      <PaperProvider theme={theme}>
        <Drawer.Navigator initialRouteName="ImageGallery">
          <Drawer.Screen 
            name="ImageGallery" 
            component={GalleryNavigator} 
            options={{
              title:"Image Gallery",
              headerShown: false,
            }}
            initialParams={settings}
          />
          <Drawer.Screen 
            name="VideoGalleryNavigator" 
            component={VideoGalleryNavigator} 
            options={{
              title:"Video Gallery",
              headerShown: false,
            }}
            initialParams={settings}
          />
          <Drawer.Screen 
            name="Settings" 
            component={Settings} 
            options={{
              title:"Settings",
              headerShown: false,
            }}
            initialParams={settings}
          />
        </Drawer.Navigator>
      </PaperProvider>
    </NavigationContainer>
  );
}

export default registerRootComponent(Main);

