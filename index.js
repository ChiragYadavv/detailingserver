const { MongoClient, ObjectId } = require('mongodb');
const express = require('express')
const jwt = require('jsonwebtoken')
const cors = require("cors");  //Request appove
const crypto = require('crypto');

const jwtPass = 'urbandetailing.in'

const app = express();
app.use(express.json())
app.use(cors());
// Connection URL. Replace <username>, <password>, and <your-cluster-url> with your MongoDB credentials
const uri = "mongodb+srv://chirgq:jgQIZXHNhv6TSxAr@cluster0.4pochyr.mongodb.net/?retryWrites=true&w=majority";

// Create a new MongoClient
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
async function start(){
    await client.connect();
    console.log("Connected successfully to MongoDB");
}
const db = client.db('urbandetailing')
const collection = db.collection('Queries');
const userCollection = db.collection('Users')


function authentication(req, res, next) {
    const authToken = req.body.authtoken;
    const authData = authCheck(authToken);
    if (authData) {
      next();
    } else {
      res.status(401).json("Unauthorized Access")
    }
}

function authCheck(authToken) {
    try {
      const data = jwt.verify(authToken, jwtPass);
      return true;
    } catch (error) {
      return false;
    }
}

app.post('/form',async (req,res)=>{
    console.log("Form received");
    const nameField = req.body.name;
    const emailField = req.body.email;
    const mobileField = req.body.mobile;
    const messageField = req.body.message;
    try{
        await collection.insertOne({name:nameField,email:emailField,mobile:mobileField,message:messageField});
        console.log("Form Saved");
        res.status(200).json({msg:`Query Submitted Successfully`})
    }catch(e){
        console.error("Some Error Occured\n"+e);
        res.status(500).json({msg:`Internal Server Error`})
    }
});

app.post('/login', async (req,res)=>{
    console.log("Login Request Received");
    const username = req.body.username;
    const password = jwtPass + req.body.password;
    const hashPassword = crypto.createHash('sha1').update(password).digest('hex');
    const time = new Date()

    const users = await userCollection.find().toArray();
    let found = false;
    users.forEach(user => {
        if(user.username == username ){
            found = true;
            if (user.password == hashPassword) {
                const tokenData = {
                  username: username,
                  time: time
                };
                const authToken = jwt.sign(tokenData, jwtPass);
                console.log("Login Succeeded");
                res.status(200).json({ authtoken: authToken, msg: "Login Succeeded" });
              } else {
                console.log("Password Was Wrong");
                res.status(401).json({ msg: "Wrong Password" })
              }
        } 
    });
    if(!found){
        console.log("User Was not found");
        res.status(404).json({ msg: "User Was not found" })
    }
});

app.use(authentication)
app.post('/signup', async (req,res)=>{
    if(req.body.username && req.body.password){

        const username = req.body.username
        const password = jwtPass + req.body.password

        const hashPassword = crypto.createHash('sha1').update(password).digest('hex');

        try{
            await userCollection.insertOne({username:username, password:hashPassword})
            console.log("Created User");
            res.status(200).json({msg:"Created The User, You May login now"})
        }catch(e){
            console.error("Some Error Occured\n",e);
            res.status(500).json({msg:"Internal Server Error"})
        }
    } else {
        res.status(400).json({msg:"Reqest Parameters Incomplete"})
    }
})

app.post('/queries', async (req,res)=>{
    console.log("Retreiving All Queries");
    try{
        const queries = await collection.find().toArray();
        console.log("All Queries Sent");
        res.status(200).json(queries);
    }catch(e){
        console.error("Some Error Occured\n"+e);
        res.status(500).json({msg:"Internal Server Error"});
    }

});

app.post('/query', async (req,res)=>{
    console.log("Delete Request Received"+ req.body.id);
    if(req.body.id){
        try{
            await collection.deleteOne({ _id: new ObjectId(req.body.id) });
            console.log("Deleted the Query");
            res.status(200).json({msg:"Deleted Successfully"});
        }catch(e){
            console.error("Some Error Occured\n"+e);
            res.status(500).json({msg:"Internal Server Error"});
        }
    }else{
        res.status(400).json({msg:"Request Did not contain id parameter"})
    }
});

app.listen(3000, async ()=>{
    await start();
    console.log('Server started');
})