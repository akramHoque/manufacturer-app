const express = require('express')
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion,ObjectId} = require('mongodb');

app.use(cors());
app.use(express.json());

//jwt-token-to-backend-for-Verification
const verifyJwt = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g6r3dap.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
  try{
 await client.connect();
 const partsCollection = client.db("fish-zone").collection("equitments");
 const orderCollection = client.db("fish-zone").collection("orders");
 const reviewCollection = client.db("fish-zone").collection("reviews");
 const userCollection = client.db("fish-zone").collection("users");
 const profileCollection = client.db("fish-zone").collection("profiles");


 const verifyAdmin = async(req, res, next)=>{
  const requester = req.decoded.email;
  const query = {email: requester}
  const requesterAccount = await userCollection.findOne(query);
  if(requesterAccount.role === "admin"){
    next();
  }
  else{
    res.status(403).send({message: "forbidden"});
  }
}


//GET DATA myOWN Inserted DATA
app.get('/equitment', async (req, res) => {
  const query = {};
  const cursor = partsCollection.find(query);
  const equitments = await cursor.toArray();
  res.send(equitments);
});




app.get("/equitment/:id", verifyJwt, async (req, res) => {
  const id = req.params.id;
  const filter = { _id: ObjectId(id) };
  const product = await partsCollection.findOne(filter);
  res.send(product);
});



// add order api
app.post("/order", verifyJwt, async (req, res) => {
  const order = req.body;
  const result = await orderCollection.insertOne(order);
  res.send(result);
});

 // get specific user order
 app.get("/order/:email", async (req, res) => {
  const email = req.params.email;
  const query = {customerEmail: email};
  const orders = (await orderCollection.find(query).toArray()).reverse();
  res.send(orders);
});

  // delete order api
  app.delete("/order/:id", async (req, res) => {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await orderCollection.deleteOne(filter);
    res.send(result);
  });

// add review api
app.post("/review", async (req, res) => {
  const review = req.body;
  const result = await reviewCollection.insertOne(review);
  res.send(result);
});

app.get("/reviews", async (req, res) => {
  const review = (await reviewCollection.find({}).toArray()).reverse();
  res.send(review);
});


//Profile data stored
app.post('/profile', async (req, res) => {
  const profileInfo = req.body;
  const result = await profileCollection.insertOne(profileInfo);
  res.send(result);
});

 // get all users api
 app.get('/user', verifyJwt, verifyAdmin , async(req, res)=>{
  const users = await userCollection.find({}).toArray();
  res.send(users)
})

// make admin api
app.put('/user/admin/:email', verifyJwt, verifyAdmin, async(req, res)=>{
  const email = req.params.email;
  const filter = {email: email};
  const updatedDoc = {
    $set: {
      role: "admin"
    },
  };
  const result = await userCollection.updateOne(filter, updatedDoc);
  res.send(result);
})



    // useAdmin hooks api
    app.get("/admin/:email", verifyJwt, async(req, res)=>{
      const email = req.params.email;
      const filter = {email: email};
      const user = await userCollection.findOne(filter);
      const isAdmin = user.role === "admin";
      res.send({admin: isAdmin});
    })
   



app.get("/user/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const user = await userCollection.findOne(query);
  res.send(user);
});

app.put("/updateUser/:email", verifyJwt, async (req, res) => {
  const updateUser = req.body;
  const { education, address, phone, linkedIn } = updateUser;
  const email = req.params.email;
  const filter = { email: email };
  const options = { upsert: true };
  const updatedDoc = {
    $set: {
      education: education,
      address: address,
      phone: phone,
      linkedIn: linkedIn,
    },
  };
  const result = await userCollection.updateOne(
    filter,
    updatedDoc,
    options
  );
  res.send(result);
});
  app.put("/user/:email", async (req, res) => {
    const email = req.params.email;
    const user = req.body;
    const filter = { email: email };
    const options = { upsert: true };
    const updatedDoc = {
      $set: user,
    };
    const result = await userCollection.updateOne(
      filter,
      updatedDoc,
      options
    );
    const token = jwt.sign(
      { email: email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );
    res.send({ result, token });
  });
 

  }
  finally{

  }
}
run().catch(console.dir)


app.get('/', (req, res) => {
  res.send('Hello World from Huntor Fishzone developing server')
})

app.listen(port, () => {
  console.log(`Doctor app listening on port ${port}`)
})