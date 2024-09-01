const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const secretKey = process.env.JWT_SECRET;

//arduino       --------------------------------------------------------------------------------------------------------------------

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const port = new SerialPort.SerialPort({
  path:'COM3', 
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  flowControl: false
});

function sendJson() {

  const jsonData = { instruction: "check-connection"}; //tutaj tresc jsona

  port.write(JSON.stringify(jsonData) + '\n', (err) => {
    if (err) {
      return console.error('Error on write: ', err.message);
    }
    console.log('Data sent to arduino:', jsonData);
  });
}

port.on('data', (data) => {
  
  console.log(`Data from arduino: ${data}`); 
  let jsonData = JSON.parse(data);
  let connected; 

    if(jsonData.connected){
      if(jsonData.connected == true){
        connected = true;
      }
      else{
        connected = false;
      }

      console.log(connected);

    }


});

//end of arduino  --------------------------------------------------------------------------------------------------------------------

setInterval(() => {
  sendJson();
}, 3000);






function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); 

  jwt.verify(token, secretKey, (err, user) => {
    
    if (err){
      console.log(token);
      return res.sendStatus(403);
    } 

    req.user = user;
    next();
  });
}

var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "arduino_home"
});

conn.connect(function(err) {
  if (err) throw err;
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); 
  res.setHeader("Content-Security-Policy", "connect-src 'self' http://localhost");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(bodyParser.json());

app.post('/api/login', (req, res) => {

  const { login,password } = req.body;

  try {
    
    conn.query(`select * from users where (login = '${login}' or email = '${login}') and password = '${password}'`, function(err,result,fields){
      
      if(result.length == 1){
        const token = jwt.sign({ id: result[0].id, login: result[0].login }, secretKey, { expiresIn: '1h' });
        
        return res.send({ success: `Hello ${login}`, token: token, user: result[0].id});
      }
      else{
        return res.send({ error: 'User does not exist or password is incorrect'});
      }
    });
  } catch (error) {
    
      console.log("Error : " +error);
      res.send({'error': error});

  }

  



});
  
app.post('/api/register', (req, res) => {

    const {email,username,password,repeatPassword} = req.body;
    const invalidCharacters = [",","'","!","&","#",";",":","|"];
    let emptyFields = false;
    let invalidValues = false;
    let passwordsDoesntMatch = false;
  
    function validate(textToValidate) {
      
      let isOk = true;
  
      invalidCharacters.forEach(charackter =>{
          if(textToValidate.includes(charackter)){
            isOk = false;
          }
      });
      
      return isOk;
  
    }
  
    // console.log(`Email: ${email}`);
    // console.log(`Username: ${username}`);
    // console.log(`Password: ${password}`);
    // console.log(`Repeat Password: ${repeatPassword}`);
  
    if(email.length == 0 || username.length == 0 || password.length == 0  || repeatPassword.length == 0){
      emptyFields = true;
    }
  
    if(!validate(email) || !validate(username) || !validate(password) || !validate(repeatPassword)){
      invalidValues = true;
    }
    
    if(password != repeatPassword){
      passwordsDoesntMatch = true;
    }
    
    if(emptyFields){
      return res.send({ error: "Fill in all fields"});
    }
    if(invalidValues){
      return res.send({ error : "Invalid characters" });
    }
    if(passwordsDoesntMatch){
      return res.send({ error: "Passwords do not match"});
    }
    
    try{
      conn.query("INSERT INTO users (login, email, password) VALUES (?,?,?)", [username,email,password], function(err,result){
          if (err){
            if (err.code === 'ER_DUP_ENTRY') {
              return res.status(409).send({ error: 'Username or email already exists' });
            } else {
              console.log("Error: ", err);
              return res.status(500).send({ error: 'Database error' });
            }
          }

        console.log(result);

        const token = jwt.sign({ id: result[0].id, login: result[0].login }, secretKey, { expiresIn: '1h' });
        res.send({ success: 'Success, user created', token: token, user: result[0].id });
      });
    }

    catch (error) {

      console.log("Error : " +error);
      res.send({'error': error});
    }

});

app.post('/api/new-home', authenticateToken, (req,res) =>{
  
  const {userId,homeName} = req.body;

  try {

    conn.query(`INSERT INTO home (home_id, name, owner_id, home_invite_code) VALUES ('','${homeName}',${userId},'')`, function(err,result,fields){
      
        const homeId = result.insertId;
        console.log(homeId);
        return res.send({ success: `New home created : ${homeName}`,home_id: homeId});

    });  
  } 
  catch (error) {
      console.error(error);
      res.send({ error: error});
  }
});

app.post('/api/join-to-home', authenticateToken, (req, res) => {

  const { user_id, home_invite_code } = req.body;

  let sql = `SELECT home_id, name FROM home WHERE home_invite_code = ?`;

  conn.query(sql, [home_invite_code], function (err, result) {
      if (err) {
          console.error('Error while querying the database:', err);
          return res.status(500).send({ error: 'Database error' });
      }

      if (result.length === 0) {
          return res.status(404).send({ error: 'Home not found' });
      }

      try {
            let home_id = result[0].home_id;
            let home_name = result[0].name;

            let sql2 = `INSERT INTO users_home (id, user_id, home_id) VALUES (null, ?, ?)`;

          conn.query(sql2, [user_id, home_id], function (err, result) {
              if (err) {
                  console.error('Error while inserting into the database:', err);
                  return res.status(500).send({ error: 'Database error' });
              }
              console.log(`Inserted id: ${result.insertId}`);
              res.send({ success: 'ok', home_name: home_name });
          });
      } catch (error) {
          console.error('Error while processing the request:', error);
          return res.status(500).send({ error: 'The user has already joined the home.' });
      }
  });
});

app.post('/api/add-new-devices', authenticateToken, (req,res) => {

  const home_id =  req.body.home_id;
  const room_id = req.body.room_id ? req.body.room_id : 'NULL';
  const devices = req.body.devices;

  try {
    
    devices.forEach(el=>{

      conn.query(`insert into devices (device_id, name, home_id, room_id) values ('','${el.name}', ${home_id},${room_id})`);

    });

    res.send({success: 'Dodano nowe urządzenia'});

  } catch (error) {
    console.log(error);
    res.send({error: error});
  }
  
}); 

app.post('/api/user-homes', authenticateToken, (req, res)=>{

  const {user_id} = req.body;

    try {
     
      conn.query(`SELECT * from users_home,home where users_home.home_id = home.home_id and users_home.user_id = ${user_id};`, function(err,result,fields){

          let homesArray = [];

          result.forEach(el=>{
            
            let home = {
              id: el.id,
              home_id: el.home_id,
              name: el.name,
              owner_id: el.owner_id,
            };

            homesArray.push(home);

          });

          res.send(homesArray);

      });  
    } 
    catch (error) {
        console.error(error);
        res.send({ error: error});
    }
});



















































app.get('/api/rooms', authenticateToken, (req,res) => {

  const home_id = req.body.home_id;
  const room_name = req.body.room_name;
  
  try {
    
    conn.query(`insert into rooms (room_id,room_name,house_id) values ('','${room_name}',${home_id})`);

  } catch (error) {
    console.log(error);
    res.send({error: error});
  }

});



app.get('/api/users', authenticateToken, (req,res) => {

  const {id_domu} = req.body;

  conn.query(`SELECT * FROM users where id_domu = ${id_domu}`, function (err,results,fields){
    
    //dokonczyc

  });
});

app.get('/api/scenarios', authenticateToken, (req,res) => {

});

app.post('/api/command', authenticateToken, (req, res) => {

  const {command,value} = req.body;

});




// Uruchomienie serwera
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Serwer nasłuchuje na porcie ${PORT}`);
});




// app.get('/api/getdata', (req, res) => {
//   res.json({ message: 'Dane z serwera' });
// });

// app.get('/api/sendtext', (req, res) => {
//     const receivedText = req.body.text; 
//     console.log('Odebrany tekst:', receivedText);
//     if(receivedText === "cos"){
//       res.json({ message: 'Test dziala'});
//     }
//     else{
//       res.json({ message: 'Tekst został odebrany przez serwer. Rozny od "cos"' });
//     }
// });

















//Kod pozwalający na odebranie danych z serwera

// const fetchData = async () => {
//     try {
//       const response = await fetch('http://127.0.0.1:4000/api/getdata'); // Dodaj protokół HTTP
//       const jsonData = await response.json();
//       console.log(jsonData.message);
//     } catch (error) {
//       console.error('Błąd:', error);
//     }
//   };



// const sendData = async (textToSend) => {
//     try {
//       const response = await fetch('http://192.168.100.6:4000/api/sendtext', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ text : textToSend }) // Tekst do wysłania w formacie JSON
//       });
      
//       const responseData = await response.json(); // Odpowiedź serwera
//       console.log('Odpowiedź serwera:', responseData);
//     } catch (error) {
//       console.error('Błąd:', error); console.log({text:textToSend});
//     }
// };