const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const SerialPort = require('serialport');
const mongoDatabaseRoutes = require('./api/mongodb/route');
const cors = require('cors');
require('dotenv').config();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(bodyParser.json());

const server = app.listen(4000, () => {
  console.log('Server is running on port 4000');
});

const io = require('socket.io')(server, {
  cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
  }
});

let activeSocket = null;
let serialPort = null;
let thisHomeDevices

io.on('connection', (socket) => {
  console.log('Client connected');
  activeSocket = socket;

  socket.on('disconnect', () => {
      console.log('Client disconnected');
      if (activeSocket === socket) {
          activeSocket = null;
      }
  });
});

function closeSerialPort() {
  return new Promise((resolve) => {
      if (serialPort && serialPort.isOpen) {
          serialPort.close(() => {
              serialPort = null;
              resolve();
          });
      } else {
          resolve();
      }
  });
}



const secretKey = process.env.JWT_SECRET;

let connected;
let port;

const Readline = require('@serialport/parser-readline');

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


app.use('/api/mongodb',  mongoDatabaseRoutes); // dodać authenticateToken,

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
  
  console.log('Tworzenie domu');

  const {userId,homeName} = req.body;

  try {

    conn.query(`INSERT INTO home (home_id, name, owner_id, home_invite_code) VALUES ('','${homeName}',${userId},'')`, function(err,result,fields){
      
        const homeId = result.insertId;

    conn.query(`INSERT INTO users_home (user_id, home_id) VALUES ('${userId}',${homeId})`); 
      
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


app.post('/api/home/get-devices', authenticateToken, async (req,res) => {
  try {
      const {home_id} = req.body;

      const devices = await new Promise((resolve, reject) => {
          conn.query(`select * from devices where home_id = ${home_id}`, (err, result) => {
              if (err) {
                  reject(err);
              }
              resolve(result);
          });
      });

      const enrichedDevices = await Promise.all(devices.map(async (device) => {
          if (device.status === 'not-active') {
              try {
                  const mongoResponse = await fetch(`http://localhost:4000/api/mongodb/device-protocol/${device.device_id}`, {
                      headers: {
                          'Authorization': 'Bearer ' + req.headers.authorization
                      }
                  });

                  if (mongoResponse.ok) {
                      const protocolData = await mongoResponse.json();
                      return {
                          ...device,
                          protocolData: protocolData
                      };
                  }
              } catch (error) {
                  console.error('Error fetching MongoDB data:', error);
              }
          }
          return device;
      }));

      const categoryCount = enrichedDevices.reduce((acc, device) => {
          if (device.category) {  
              acc[device.category] = (acc[device.category] || 0) + 1;
          }
          return acc;
      }, {});

      const categoriesArray = Object.entries(categoryCount).map(([category, count]) => ({
          category,
          count
      }));

      res.status(200).json({
          devices: enrichedDevices,
          categories: categoriesArray
      });

  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ 
          error: error.message,
          devices: [],
          categories: []
      });
  }
});


function tryToConnect() {

  return new Promise((resolve, reject) => {

    try {
      port = new SerialPort.SerialPort({
        path: 'COM3',
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: false
      });

      port.on('error', (err) => {
        console.error('Failed to connect');
        console.log(err);
        reject(false);
      });

      const jsonData = { instruction: "check-connection" };

      port.write(JSON.stringify(jsonData) + '\n', (err) => {
        if (err) {
          console.error('Error on write: ', err.message);
          reject(false); 
        }
        console.log('Data sent to arduino:', jsonData);
      });

      port.on('data', (data) => {
        try {

          console.log(`Data from arduino: ${data}`);
          let jsonData = JSON.parse(data);
          if (jsonData.connected) {

            resolve(true);

          } else {
            resolve(false); 
          }
        } catch (error) {
          console.log('failed connection');
          reject(false);
        }
      });
    } catch (error) {

      console.log('Failed');
      reject(false); 

    }
  });
}

async function testConnection() {
  try {

    const result = await tryToConnect();
    console.log(result); 
    return result;

  } catch (error) {

    console.log(error); 
    return false;

  }
} 


async function getDevices() {
  return new Promise((resolve, reject) => {
      try {
          let buffer = '';
          
          // Usuń poprzednie nasłuchiwanie
          port.removeAllListeners('data');
          port.removeAllListeners('error');
          
          port.on('error', (err) => {
              console.error('Failed to connect:', err);
              reject(false);
          });

          port.on('data', (chunk) => {
              try {
                  buffer += chunk.toString();
                  
                  // Sprawdź czy mamy kompletny JSON (kończy się znakiem nowej linii)
                  if (buffer.includes('\n')) {
                      let jsonStr = buffer.toString().trim();
                      console.log('Received data:', jsonStr);
                      
                      // Upewnij się, że mamy kompletny JSON z devices
                      if (jsonStr.includes('"devices"')) {
                          const jsonData = JSON.parse(jsonStr);
                          if (jsonData.devices) {
                              resolve(jsonData.devices);
                          }
                      }
                      buffer = ''; // Wyczyść bufor
                  }
              } catch (error) {
                  console.log('Error parsing data:', error);
                  console.log('Received buffer:', buffer);
              }
          });

          // Wyślij żądanie
          const jsonData = { instruction: "send-devices-list" };
          port.write(JSON.stringify(jsonData) + '\n', (err) => {
              if (err) {
                  console.error('Error writing to port:', err.message);
                  reject(false);
              }
              console.log('Data sent to arduino:', jsonData);
          });

          // Timeout po 5 sekundach
          setTimeout(() => {
              port.removeAllListeners('data');
              if (!buffer.includes('"devices"')) {
                  reject(false);
              }
          }, 5000);

      } catch (error) {
          console.log('Failed3:', error);
          reject(false);
      }
  });
}


app.post("/api/home/do", async (req, res) => {
  try {
      const { device, actions } = req.body;

      if (device.status === "active") {
          if (!port || !port.isOpen) {
              port = new SerialPort.SerialPort({
                  path: "COM3",
                  baudRate: 9600,
                  dataBits: 8,
                  parity: "none",
                  stopBits: 1,
                  flowControl: false,
              });

              port.on("error", (err) => {
                  console.error("Failed to connect");
              });
          }

          const jsonData = { 
              instruction: "device-control", 
              device: device.deviceName, 
              actions: actions 
          };

          await port.write(JSON.stringify(jsonData) + "\n", (err) => {
              if (err) {
                  console.error("Error on write: ", err.message);
              }
              console.log("Data sent to arduino:", jsonData);
          });

          res.send(req.body);
      } else {
          //todo: wyslanie w zaleznosci od tego co urzadzenie posiada (http, zigbee itp)
          res.send(req.body);
      }
  } catch (err) {
      console.error(err);
      res.send({ error: "An error occurred" });
  }
});



app.post('/api/find-devices', authenticateToken, async (req,res) =>{

  try {
    
    const connection = await testConnection();
      
    if(connection){

      const devicesList = await getDevices();

      console.log(devicesList);

      res.send({"connection":`${connection}`, "devices": devicesList});

      

    }
    else{
      res.send({"connection":`${connection}`});
    }


  } catch (error) {
    res.send({error: error});
    console.log('Failed');
    console.log(error);
  }finally{
    await port.close();
  }
  
});

app.post('/api/add-new-devices', authenticateToken, async (req,res) => {
  console.log('Dodawanie urzadzen');
  const home_id = req.body.homeId;
  const devices = req.body.devices;
  const rooms = [
      'Kitchen',
      'Living room', 
      'Bathroom', 
      'Garden', 
      'Childrens room', 
      'Garage',
      'Office',
  ];

  try {
      await Promise.all(devices.map(async (el) => {
          try {
              let room_id = rooms.indexOf(el.selectedRoom);

              const deviceId = await new Promise((resolve, reject) => {
                  const query = `INSERT INTO devices
                      (device_id, name, home_id, room_id, label, command_on, command_off, status, category)
                      VALUES
                      ('', '${el.name}', ${home_id}, ${room_id}, '${el.label}', '${el.command_on}', '${el.command_off}', '${el.status}', '${el.category}')`;
                  
                  conn.query(query, (error, results) => {
                      if (error) {
                          reject(error);
                      } else {
                          resolve(results.insertId);
                      }
                  });
              });
              
              console.log('Inserted device ID:', deviceId);

              if(el.protocol){
                  const protocolData = {
                      device_id: deviceId,
                      protocol_type: el.protocol
                  };

                  switch(el.protocol) {
                      case 'Wifi':
                          protocolData.ipAddress = el.protocolConfig.ipAddress;
                          protocolData.macAddress = el.protocolConfig.macAddress;
                          protocolData.ssid = el.protocolConfig.ssid;
                          protocolData.password = el.protocolConfig.password;
                          break;
                      case 'Zigbee':
                          protocolData.zigbeeId = el.protocolConfig.zigbeeId;
                          protocolData.zigbeeChannel = el.protocolConfig.zigbeeChannel;
                          protocolData.zigbeeGroupId = el.protocolConfig.zigbeeGroupId;
                          protocolData.zigbeeHub = el.protocolConfig.zigbeeHub;
                          break;
                      case 'Bluetooth':
                          protocolData.bleUuid = el.protocolConfig.bleUuid;
                          protocolData.bleConnection = el.protocolConfig.bleConnection;
                          break;
                      case 'Z-Wave':
                          protocolData.zwaveDeviceId = el.protocolConfig.zwaveDeviceId;
                          protocolData.zwaveNetworkKey = el.protocolConfig.zwaveNetworkKey;
                          protocolData.zwaveGroupId = el.protocolConfig.zwaveGroupId;
                          break;
                      case 'MQTT':
                          protocolData.mqttBrokerUrl = el.protocolConfig.mqttBrokerUrl;
                          protocolData.mqttTopicOn = el.protocolConfig.mqttTopicOn;
                          protocolData.mqttTopicOff = el.protocolConfig.mqttTopicOff;
                          protocolData.mqttDeviceId = el.protocolConfig.mqttDeviceId;
                          break;
                  }

                  const response = await fetch('http://localhost:4000/api/mongodb/add-device-protocol', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          'Authorization': 'Bearer ' + req.headers.authorization
                      },
                      body: JSON.stringify(protocolData)
                  });

                  console.log(response);

                  if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.error || 'Failed to save protocol data');
                  }
              }
              
          } catch (error) {
              console.error('Error inserting device:', error);
              throw error;
          }
      }));

      res.send({success: 'New devices added'});
      
  } catch (error) {
      console.log(error);
      res.status(500).send({error: error.message});
  }
});

app.get('/api/devices-list', authenticateToken, (req, res) => {

  try {
    conn.query('select * from devices_list', function (err, result){

      res.send({devices : result});

    });
  } catch (error) {
    res.send({error: error});
    console.log(error);
  }
  
});


app.get('/api/home/app-start', async (req, res) => {
  try {
      await closeSerialPort();
      await startApp();
      res.json({ status: 'success', message: 'Sensor reading started' });
  } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
  }
});

async function startApp() {
  

  if (serialPort) {
      await closeSerialPort();
  }

  serialPort = new SerialPort.SerialPort({
      path: 'COM3',
      baudRate: 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
      flowControl: false
  });

  const jsonData = { instruction: "start-app" };
  
  serialPort.write(JSON.stringify(jsonData) + '\n', (err) => {
      if (err) {
          console.error('Error on write: ', err.message);
          throw err;
      }
      console.log('Arduino start');
  });

  let buffer = '';
  
  serialPort.on('data', (data) => {
      buffer += data.toString();
      
      let lines = buffer.split('\n');
      
      for (let i = 0; i < lines.length - 1; i++) {
          try {
              const json = JSON.parse(lines[i]);
              console.log('Received data:', json);
              io.emit('sensorData', json);
          } catch (err) {
              console.error('Error parsing JSON: ', err.message);
          }
      }
      
      buffer = lines[lines.length - 1];
  });

  serialPort.on('error', (error) => {
      console.error('Serial port error:', error);
  });
}






































































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




mongoose.connect('mongodb://localhost:27017/home_automation')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));



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