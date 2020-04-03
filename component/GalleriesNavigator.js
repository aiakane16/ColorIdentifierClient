import 'react-native-gesture-handler';
import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import App from '../App'
import CameraView from '../views/CameraView'


export default class GalleryNavigator extends React.Component { 
    render(){
        const Stack = createStackNavigator();

        return(
            <Stack.Navigator initialRouteName="App">
                <Stack.Screen 
                    name="App" 
                    component={App} 
                    options={{
                        title:"Gallery",
                        headerShown: false,
                    }}
                    initialParams={this.props.route.params}
                />
                <Stack.Screen 
                    name="ImageCapture" 
                    component={CameraView} 
                    options={{
                        title: "Capture Image",
                        headerShown:false
                    }}
                    initialParams={this.props.route.params}
                />
            </Stack.Navigator>
        )
    }
}