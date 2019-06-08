import firebase from "firebase";
import riot from "riot";
import route from "riot-route";
import {mxFirebase} from "./mx"
import "./index.css";

import "./tags/home.tag";
import "./tags/signup.tag";
import "./tags/signin.tag";



var firebaseConfig = {
    apiKey: "AIzaSyAzASDz0d_YLoFA3Eq7en_WxQoo1y6otiA",
    authDomain: "date-picker-9c0a0.firebaseapp.com",
    databaseURL: "https://date-picker-9c0a0.firebaseio.com",
    projectId: "date-picker-9c0a0",
    storageBucket: "date-picker-9c0a0.appspot.com",
    messagingSenderId: "66527958904",
    appId: "1:66527958904:web:06a9ad54d1f85439"
  };

  firebase.initializeApp(firebaseConfig);

  const db = firebase.firestore()

function clearSignIn(){
    const signInButton = document.getElementById("signInButtonNav");
    const signUpButton = document.getElementById("signUpButtonNav");
    signInButton.remove()
    signUpButton.remove()
}

function prepareDate(date,dateName,datePhoto,dateBio){
    if (date != null){
        dateName.innerText = date.name;
        datePhoto.src = date.photoURL;
        dateBio.innerText = date.bio;
    }
    else{
        dateName.innerText = "There's no date avaiable :(";
        datePhoto.src = "";
        dateBio.innerText = "";
    }
}

async function getNewDate(dates,userId){
    console.log(userId)
    while (true){
        var date = dates.shift();
        if (date == null){
            return null;
        }
        var like;
        var nope;
        await firebase.firestore().collection("users").doc(userId).get().then((doc)=>{
            console.log(doc.data())
            like = doc.data().like.includes(date.id)
        })
        await firebase.firestore().collection("users").doc(userId).get().then((doc)=>{
            console.log(doc.data())
            nope = doc.data().nope.includes(date.id)
        })
        if (date.id == userId){
            continue;
        }
        else if(like){
            continue;
        }
        else if(nope){
            continue;
        }
        else{
            return date;
        }
    }
}

async function putFiles(file,id){
    var ref = firebase.storage().ref("users/" + id +"/" + file.name);
    var returnVal;
    await ref.put(file).then(async function (){
      await ref.getDownloadURL().then(function (url){
          returnVal = url;
      });
    });
    return returnVal;
  }

var profileButton = document.getElementById("profileButton");
var signInButton = document.getElementById("signInButtonNav");
var signUpButton = document.getElementById("signUpButtonNav");

signInButton.addEventListener('click', (e) => {
    route("/signin");
})
signUpButton.addEventListener('click', (e) =>{
    route("/signup")
})


route.base("/");

route("/",async () =>{
    riot.mount("#root","home");
    const dateName = document.getElementById("dateName");
    const datePhoto = document.getElementById('datePhoto');
    const dateBio = document.getElementById("dateBio");
    const likeButton = document.getElementById("likeButton");
    const dislikeButton = document.getElementById("dislikeButton");
    const ref = firebase.firestore().collection("users");
    var currentUser;
    await firebase.auth().onAuthStateChanged(async (user) =>{
        if (user){
            currentUser = user;
            var dates = [];
            await ref.get().then((querySnapshot)=>{
                querySnapshot.forEach((doc)=> {
                    dates.push(doc.data());
                }); 
            });
            var date = await getNewDate(dates,user.uid);
            prepareDate(date,dateName,datePhoto,dateBio);
            likeButton.addEventListener('click',async () => {
                if (date){
                    const likeRef = firebase.firestore().doc("users/" + currentUser.uid );
                    likeRef.update({
                        like: firebase.firestore.FieldValue.arrayUnion(date.id)
                    })
                    date = await getNewDate(dates,user.id);     
                    prepareDate(date,dateName,datePhoto,dateBio);
                }
            });
            dislikeButton.addEventListener('click',async () =>{
                if (date){
                    const nopeRef = firebase.firestore().doc("users/" + currentUser.uid);
                    nopeRef.update({
                        nope: firebase.firestore.FieldValue.arrayUnion(date.id)
                    });
                    date = await getNewDate(dates,user.id);
                    prepareDate(date,dateName,datePhoto,dateBio);
                }
            });
        }
        else{
            dateName.innerText = "Please sign in first."
        }
    });
});


route("/signup", () => {
    riot.mount("#root","signup");
    const signUpForm = document.getElementById("signUpForm");
    signUpForm.addEventListener('submit',async (e) => {
        e.preventDefault()
        const userName = document.getElementById("signUpName").value;
        const signUpEmail = document.getElementById("signUpEmail").value;
        const pass = document.getElementById("signUpPass").value;
        const passConfirm = document.getElementById("signUpPassConfirm").value;
        const signUpBio = document.getElementById("signUpBio").value;
        const signUpPhoto = document.getElementById("signUpPhoto").files[0];
        
        if (passConfirm == pass){
            try{
                console.log("Signing Up")
                await firebase.auth().createUserWithEmailAndPassword(signUpEmail,pass);
                console.log("Sign Up Successful")
            }
            catch(err){
                console.log(err);
            }
            console.log("Uploading user's profile")
            const userId = firebase.auth().currentUser.uid;
            const signUpPhotoURL = await putFiles(signUpPhoto,userId)

            await firebase.firestore().doc("users/" + userId).set({
                name: userName,
                email: signUpEmail,
                bio: signUpBio,
                photoURL: signUpPhotoURL,
                id: userId,
                like: [],
                nope: []
            })
            console.log("Upload Successful");
            // clearSignIn();
            route("/");
        }
    })
})

route("/signin", () => {
    riot.mount("#root","signin");
    const signInForm = document.getElementById("signInForm");
    signInForm.addEventListener('submit',async (e) => {
        e.preventDefault();
        const email = document.getElementById("signInEmail").value;
        const pass = document.getElementById("signInPassword").value;
        try {
            await firebase.auth().signInWithEmailAndPassword(email,pass);
            route("/");
            // clearSignIn();
        }
        catch(err){
            console.log(err);
        }
    })
})
route.start(true)