import React,{Component} from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert} from 'react-native';
import db from '../config';
import firebase from 'firebase';
import MyHeader from '../components/MyHeader'

export default class itemRequestScreen extends Component{
  constructor(){
    super();
    this.state ={
      userId : firebase.auth().currentUser.email,
      itemName:"",
      reasonToRequest:"",
      IsitemRequestActive : "",
      requesteditemName: "",
      itemstatus:"",
      requestId:"",
      userDocId: '',
      docId :''
    }
  }

  createUniqueId(){
    return Math.random().toString(36).substring(7);
  }



  addRequest = async (itemName,reasonToRequest)=>{
    var userId = this.state.userId
    var randomRequestId = this.createUniqueId()
    db.collection('requested_items').add({
        "user_id": userId,
        "item_name":itemName,
        "reason_to_request":reasonToRequest,
        "request_id"  : randomRequestId,
        "item_status" : "requested",
         "date"       : firebase.firestore.FieldValue.serverTimestamp()

    })

    await  this.getitemRequest()
    db.collection('users').where("email_id","==",userId).get()
    .then()
    .then((snapshot)=>{
      snapshot.forEach((doc)=>{
        db.collection('users').doc(doc.id).update({
      IsitemRequestActive: true
      })
    })
  })

    this.setState({
        itemName :'',
        reasonToRequest : '',
        requestId: randomRequestId
    })

    return Alert.alert("item Requested Successfully")


  }

receiveditems=(itemName)=>{
  var userId = this.state.userId
  var requestId = this.state.requestId
  db.collection('received_items').add({
      "user_id": userId,
      "item_name":itemName,
      "request_id"  : requestId,
      "itemstatus"  : "received",

  })
}




getIsitemRequestActive(){
  db.collection('users')
  .where('email_id','==',this.state.userId)
  .onSnapshot(querySnapshot => {
    querySnapshot.forEach(doc => {
      this.setState({
        IsitemRequestActive:doc.data().IsitemRequestActive,
        userDocId : doc.id
      })
    })
  })
}










getitemRequest =()=>{
  // getting the requested item
var itemRequest=  db.collection('requested_items')
  .where('user_id','==',this.state.userId)
  .get()
  .then((snapshot)=>{
    snapshot.forEach((doc)=>{
      if(doc.data().item_status !== "received"){
        this.setState({
          requestId : doc.data().request_id,
          requesteditemName: doc.data().item_name,
          itemstatus:doc.data().item_status,
          docId     : doc.id
        })
      }
    })
})}



sendNotification=()=>{
  //to get the first name and last name
  db.collection('users').where('email_id','==',this.state.userId).get()
  .then((snapshot)=>{
    snapshot.forEach((doc)=>{
      var name = doc.data().first_name
      var lastName = doc.data().last_name

      // to get the donor id and item nam
      db.collection('all_notifications').where('request_id','==',this.state.requestId).get()
      .then((snapshot)=>{
        snapshot.forEach((doc) => {
          var donorId  = doc.data().donor_id
          var itemName =  doc.data().item_name

          //targert user id is the donor id to send notification to the user
          db.collection('all_notifications').add({
            "targeted_user_id" : donorId,
            "message" : name +" " + lastName + " received the item " + itemName ,
            "notification_status" : "unread",
            "item_name" : itemName
          })
        })
      })
    })
  })
}

componentDidMount(){
  this.getitemRequest()
  this.getIsitemRequestActive()

}

updateitemRequestStatus=()=>{
  //updating the item status after receiving the item
  db.collection('requested_items').doc(this.state.docId)
  .update({
    item_status : 'recieved'
  })

  //getting the  doc id to update the users doc
  db.collection('users').where('email_id','==',this.state.userId).get()
  .then((snapshot)=>{
    snapshot.forEach((doc) => {
      //updating the doc
      db.collection('users').doc(doc.id).update({
        IsitemRequestActive: false
      })
    })
  })


}


  render(){

    if(this.state.IsitemRequestActive === true){
      return(

        // Status screen

        <View style = {{flex:1,justifyContent:'center'}}>
          <View style={{borderColor:"orange",borderWidth:2,justifyContent:'center',alignItems:'center',padding:10,margin:10}}>
          <Text>item Name</Text>
          <Text>{this.state.requesteditemName}</Text>
          </View>
          <View style={{borderColor:"orange",borderWidth:2,justifyContent:'center',alignItems:'center',padding:10,margin:10}}>
          <Text> item Status </Text>

          <Text>{this.state.itemstatus}</Text>
          </View>

          <TouchableOpacity style={{borderWidth:1,borderColor:'orange',backgroundColor:"orange",width:300,alignSelf:'center',alignItems:'center',height:30,marginTop:30}}
          onPress={()=>{
            this.sendNotification()
            this.updateitemRequestStatus();
            this.receiveditems(this.state.requesteditemName)
          }}>
          <Text>I recieved the item </Text>
          </TouchableOpacity>
        </View>
      )
    }
    else
    {
    return(
      // Form screen
        <View style={{flex:1}}>
          <MyHeader title="Request item" navigation ={this.props.navigation}/>

          <ScrollView>
            <KeyboardAvoidingView style={styles.keyBoardStyle}>
              <TextInput
                style ={styles.formTextInput}
                placeholder={"enter item name"}
                onChangeText={(text)=>{
                    this.setState({
                        itemName:text
                    })
                }}
                value={this.state.itemName}
              />
              <TextInput
                style ={[styles.formTextInput,{height:300}]}
                multiline
                numberOfLines ={8}
                placeholder={"Why do you need the item"}
                onChangeText ={(text)=>{
                    this.setState({
                        reasonToRequest:text
                    })
                }}
                value ={this.state.reasonToRequest}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={()=>{ this.addRequest(this.state.itemName,this.state.reasonToRequest);
                }}
                >
                <Text>Request</Text>
              </TouchableOpacity>

            </KeyboardAvoidingView>
            </ScrollView>
        </View>
    )
  }
}
}

const styles = StyleSheet.create({
  keyBoardStyle : {
    flex:1,
    alignItems:'center',
    justifyContent:'center'
  },
  formTextInput:{
    width:"75%",
    height:35,
    alignSelf:'center',
    borderColor:'#ffab91',
    borderRadius:10,
    borderWidth:1,
    marginTop:20,
    padding:10,
  },
  button:{
    width:"75%",
    height:50,
    justifyContent:'center',
    alignItems:'center',
    borderRadius:10,
    backgroundColor:"#ff5722",
    shadowColor: "#000",
    shadowOffset: {
       width: 0,
       height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    marginTop:20
    },
  }
)