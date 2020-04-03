import 'react-native-gesture-handler';
import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import VideoGallery from '../views/VideoGallery'
import VideoCapture from '../views/VideoCapture'

export default class VideoGalleryNavigator extends React.Component { 
    render(){
        const Stack = createStackNavigator();

        return(
            <Stack.Navigator initialRouteName="VideoGalleryHome">
                <Stack.Screen 
                    name="VideoGalleryHome" 
                    component={VideoGallery} 
                    options={{
                        title:"Video Gallery",
                        headerShown: false,
                    }}
                    initialParams={this.props.route.params}
                />
                <Stack.Screen 
                    name="VideoCapture" 
                    component={VideoCapture} 
                    options={{
                        title:"Video Capture",
                        headerShown: false,
                    }}
                    initialParams={this.props.route.params}
                />
            </Stack.Navigator>
        )
    }
}