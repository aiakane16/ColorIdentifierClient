import React, { Component} from 'react';
import { View, Image, AsyncStorage } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Avatar, Button, Card, Title, Paragraph, Appbar, Colors , TextInput, ActivityIndicator } from 'react-native-paper';
import styles from '../styles';

export default class GalleryThumbnail extends Component {

    state = {
        text : null,
        saving : false,
    }

    componentDidMount = async () => {
        var { ipAddress } = this.props.route.params;

        this.setState({
            text : ipAddress
        })
        // var database = SQLite.openDatabase('ColorIdentifier')

        // database.transaction((transaction) =>{
        //     transaction.executeSql(
        //         "CREATE TABLE IF NOT EXISTS settings2 ( id INT PRIMARY KEY, key STRING NOT NULL, value STRING DEFAULT NULL)", 
        //         [] ,(transaction,result) =>{
        //             transaction.executeSql("INSERT INTO settings(`key`,`value`) VALUES ('ipaddress', NULL)",
        //             [] ,(transaction,result) =>{
        //                 console.log(result)
        //             },( error) => {

        //             })
        //         })
        // },(error) => {
        //     console.log(error)
        // },()=>{

          
        // })

     
    }

    saveIP = async () => {
        var { updateIP } = this.props.route.params;

        
        this.setState({
            saving: true
        })

        updateIP(this.state.text)
        // var database = SQLite.openDatabase('ColorIdentifier')

        // database.transaction((transaction) =>{
        //     transaction.executeSql("INSERT value FROM settings WHERE name='ipaddress'")
        // },{

        // },(result) => {
        //     console.log(results)
        // },(error)=>{

        // })
        
        // await AsyncStorage.setItem('ipaddress',this.state.text,(error) => {
        //     console.log(error)
        // })

        this.setState({
            saving: false,
        })

    }

    render(){
        const { uri } = this.props;
    
        return (
        <View style={{
            flex: 1
        }}>
            <Appbar style={styles.header} >
                <Appbar.Action icon="menu" color={'#fff'} onPress={() => { this.props.navigation.openDrawer(); }} />
                <Appbar.Content title="Color Identifier" subtitle="Settings" />
            </Appbar>
            <View style={styles.container}>
                <Card >
                    <Card.Content>
                        <Title>Server Ip Address</Title>
                        <TextInput
                            label='e.x. 192.168.254.100'
                            value={this.state.text}
                            onChangeText={text => this.setState({ text })}
                        />
                    </Card.Content>

                    <Card.Actions>
                        { this.state.saving ? <ActivityIndicator animating={true} color={Colors.black} /> : <Button onPress={this.saveIP}>Save</Button>}
                    </Card.Actions>
                </Card>
            </View>
            
        </View>
        )
    }
}