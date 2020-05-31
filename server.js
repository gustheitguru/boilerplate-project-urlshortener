'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var dotEnv = require('dotenv').config(); // allows your to read '.env' noted files
var shortId = require('shortid');
var validUrl = require('valid-url');
var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);
app.use(bodyParser.urlencoded({
	extended: false
}))
app.use(cors());
app.use(express.json());

var uri = process.env.MONGO_URI;
// console.log(uri);
mongoose.createConnection(uri, {
 useNewUrlParser: true,
 useUnifiedTopology: true,
 serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
});

const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
 console.log("MongoDB database connection established successfully");
})
// creating schema
const Schema = mongoose.Schema;
const urlSchema = new Schema({
 original_url: String,
 short_url: String
})
const URL = mongoose.model("URL", urlSchema);

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});
app.get('/api/shorturl/:short_url?', async function (req, res) {
 try {
 const urlParams = await URL.findOne({
 short_url: req.params.short_url
 })
 if (urlParams) {
 return res.redirect(urlParams.original_url)
 } else {
 return res.status(404).json('No URL found')
 }
 } catch (err) {
 console.log(err)
 res.status(500).json('Server error')
 }
});

app.post('/api/shorturl/new', async function (req, res) {
const url = req.body.url_input

 const urlCode = shortId.generate();
// check if the url is valid or not
 if (!validUrl.isWebUri(url)) { 
 res.status(401).json({
 error: 'invalid URL'
 })
 } else {
 try {
 // check if its already in the database
 let findOne = await URL.findOne({
 original_url: url
 })
 if (findOne) {
 res.json({
 original_url: findOne.original_url,
 short_url: findOne.short_url
 })
 } else {
 // if its not exist yet then create new one and response with the result
 findOne = new URL({
 original_url: url,
 short_url: urlCode
 })
 await findOne.save()
 res.json({
 original_url: findOne.original_url,
 short_url: findOne.short_url
 })
 }
 } catch (err) {
 console.error(err)
 res.status(500).json('Server erorr…')
 }
 }
});



app.listen(port, function () {
  console.log('Node.js listening ...');
});