const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const SerialPort = require('serialport');
const mongoDatabaseRoutes = require('./api/mongodb/route');
const assistantRoutes = require('./api/assistant/route');
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

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected');
  activeSocket = socket;

  socket.on('joinHome', (homeId) => {
      socket.join(homeId);
      console.log(`Client joined home room: ${homeId}`);
  });

  socket.on('disconnect', () => {
      console.log('Client disconnected');
      if (activeSocket === socket) {
          activeSocket = null;
      }
  });
});

let activeSocket = null;
let serialPort = null;
let thisHomeDevices

const serialPortManager = require('./SerialPortManager');

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


app.use('/api/mongodb', authenticateToken, mongoDatabaseRoutes); 
app.use('/api/assistant', authenticateToken, assistantRoutes); 

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

        const token = jwt.sign({ id: result.insertId, login: email }, secretKey, { expiresIn: '1h' });
        res.status(200).json({ success: 'Success, user created', token: token, user: result.insertId });
      });
    }

    catch (error) {

      console.log("Error : " +error);
      res.send({'error': error});
    }

});

app.post('/api/tasks/add', authenticateToken, async (req, res) => {

    const { home_id, user_id, topic, content } = req.body;

    try {
        const query = `
            INSERT INTO tasks (home_id, user_id, topic, content, isCompleted) 
            VALUES (?, ?, ?, ?, false)
        `;

        conn.query(query, [home_id, user_id, topic, content], (err, result) => {
            if (err) {
                console.error('Error adding task:', err);
                return res.status(500).json({ error: 'Failed to add task' });
            }
            res.status(200).json({ 
                success: true, 
                task_id: result.insertId,
                message: 'Task added successfully' 
            });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/tasks/:home_id', authenticateToken, (req, res) => {

    const home_id = req.params.home_id;

    const query = `
        SELECT t.*, u.email as user_email 
        FROM tasks t
        JOIN users u ON t.user_id = u.id
        WHERE t.home_id = ?
        ORDER BY t.id DESC
    `;

    conn.query(query, [home_id], (err, results) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            return res.status(500).json({ error: 'Failed to fetch tasks' });
        }
        res.json(results);
    });
});

app.post('/api/tasks/:task_id/complete', authenticateToken, (req, res) => {

    const task_id = req.params.task_id;

    const query = `
        UPDATE tasks 
        SET isCompleted = true 
        WHERE id = ?
    `;

    conn.query(query, [task_id], (err, result) => {
        if (err) {
            console.error('Error completing task:', err);
            return res.status(500).json({ error: 'Failed to complete task' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ success: true, message: 'Task marked as completed' });
    });
});

app.delete('/api/tasks/:task_id', authenticateToken, (req, res) => {
  
   const task_id = req.params.task_id;
   
   const deleteQuery = `DELETE FROM tasks WHERE id = ?`;
   conn.query(deleteQuery, [task_id], (err, result) => {
       if (err) {
           console.error('Error deleting task:', err);
           return res.status(500).json({ error: 'Failed to delete task' });
       }
       
       res.json({ success: true, message: 'Task deleted successfully' });
   });
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
              res.send({ success: 'ok', home_name: home_name, home_id: home_id });
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

app.post('/api/find-devices', authenticateToken, async (req,res) => {
  try {
      const connection = await testConnection();
      
      if(connection) {
          return new Promise((resolve) => {
              const deviceDataHandler = (data) => {
                  if (data && data.devices) {
                      serialPortManager.removeDataHandler(deviceDataHandler);
                      resolve(res.send({
                          "connection": true,
                          "devices": data.devices
                      }));
                  }
              };

              serialPortManager.addDataHandler(deviceDataHandler);

              serialPortManager.executeCommand({ 
                  instruction: "send-devices-list" 
              });
          });
      } else {
          res.send({"connection": false});
      }
  } catch (error) {
      console.error('Failed:', error);
      res.send({error: error.message || 'Unknown error'});
  }
});

async function tryToConnect() {
  try {
      const command = {
          instruction: "check-connection"
      };

      await serialPortManager.executeCommand(command);
      return true;
  } catch (error) {
      console.error('Connection test failed:', error);
      return false;
  }
}

async function testConnection() {
  try {
      const result = await tryToConnect();
      console.log('Connection test result:', result);
      return result;
  } catch (error) {
      console.error('Connection test error:', error);
      return false;
  }
}

async function getDevices() {
  try {
      const command = {
          instruction: "send-devices-list"
      };

      const response = await serialPortManager.executeCommand(command);
      if (response && response.devices) {
          return response.devices;
      }
      throw new Error('No devices data received');
  } catch (error) {
      console.error('Failed to get devices:', error);
      throw error;
  }
}










app.post("/api/home/do", async (req, res) => {
  try {
      const { device, actions } = req.body;

      if (device.status === "active") {
          const command = {
              instruction: "device-control",
              device: device.deviceName,
              actions: actions
          };

          await serialPortManager.executeCommand(command);
          res.send(req.body);
      } else {
          // Handle other types of devices (HTTP, Zigbee, etc.)
          res.send(req.body);
      }
  } catch (err) {
      console.error("Error occurred:", err);
      res.status(500).send({ error: "An error occurred" });
  }
});

process.on('SIGINT', async () => {
  try {
      await serialPortManager.closePort();
      process.exit(0);
  } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
  }
});


app.post('/api/add-new-devices', authenticateToken, async (req,res) => {
 console.log('Dodawanie urzadzen');
 const home_id = req.body.homeId;
 const user_id = req.user.id;
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

             const historyData = {
               home_id: home_id,
               user_id: user_id,
               action: "added",
               device_name: el.name,
               device_status: el.status,
               room: el.selectedRoom,
               category: el.category,
               timestamp: new Date().toISOString()
             };

             const historyResponse = await fetch('http://localhost:4000/api/mongodb/devices/history', {
               method: 'POST',  
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': req.headers.authorization
               },
               body: JSON.stringify(historyData)
             });

             if (!historyResponse.ok) {
                 const errorText = await historyResponse.text();
                 console.error('Failed to save device history:', historyResponse.status, errorText);
             }

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
                         'Authorization': req.headers.authorization
                     },
                     body: JSON.stringify(protocolData)
                 });

                 if (!response.ok) {
                     const errorText = await response.text();
                     console.error('Protocol save error:', response.status, errorText);
                     throw new Error(`Failed to save protocol data: ${errorText}`);
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


app.get('/api/home/home-info/:home_id', authenticateToken, async (req, res) => {
  
  const home_id = req.params.home_id;
  
  try {
    const homeQuery = `
      SELECT 
        h.*,
        o.login as owner_login,
        o.email as owner_email,
        o.id as owner_id
      FROM home h
      LEFT JOIN users o ON h.owner_id = o.id
      WHERE h.home_id = ?
    `;

    const usersQuery = `
      SELECT 
        u.id,
        u.login,
        u.email
      FROM users u
      INNER JOIN users_home uh ON u.id = uh.user_id
      WHERE uh.home_id = ?
    `;

    const [homeResult, usersResult] = await Promise.all([
      new Promise((resolve, reject) => {
        conn.query(homeQuery, [home_id], (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      }),
      new Promise((resolve, reject) => {
        conn.query(usersQuery, [home_id], (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      })
    ]);

    if (!homeResult || homeResult.length === 0) {
      return res.status(404).json({ error: 'Home not found' });
    }

    const response = [
      {
        type: 'home_info',
        data: {
          home_id: homeResult[0].home_id,
          name: homeResult[0].name,
          home_invite_code: homeResult[0].home_invite_code
        }
      },
      {
        type: 'owner',
        data: {
          id: homeResult[0].owner_id,
          login: homeResult[0].owner_login,
          email: homeResult[0].owner_email
        }
      },
      {
        type: 'users',
        data: usersResult.map(user => ({
          id: user.id,
          login: user.login,
          email: user.email
        }))
      }
    ];

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post(`/api/account/change-password`, authenticateToken, async (req, res) => {
  
  const user_id = req.user.id;
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;

  try {

      const verifyQuery = `
          SELECT password 
          FROM users 
          WHERE id = ? 
          LIMIT 1
      `;

      conn.query(verifyQuery, [user_id], async (err, results) => {
          if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Internal server error' });
          }

          if (results.length === 0) {
              return res.status(404).json({ error: 'User not found' });
          }

          if (results[0].password !== currentPassword) {
              return res.status(401).json({ error: 'Current password is incorrect' });
          }

          const updateQuery = `
              UPDATE users 
              SET password = ? 
              WHERE id = ?
          `;

          conn.query(updateQuery, [newPassword, user_id], (updateErr, updateResult) => {
              if (updateErr) {
                  console.error('Database error:', updateErr);
                  return res.status(500).json({ error: 'Failed to update password' });
              }

              if (updateResult.affectedRows === 0) {
                  return res.status(404).json({ error: 'User not found' });
              }

              res.status(200).json({ message: 'Password updated successfully' });
          });
      });

  } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.get(`/api/account/:user_id`, authenticateToken, async(req,res) => { 
  const user_id = req.params.user_id;

  try {
      const query1 = `
          SELECT login, email 
          FROM users 
          WHERE id = ? 
          LIMIT 1
      `;

      const query2 = `
          SELECT home.* 
          FROM home, users_home 
          WHERE users_home.user_id = ? 
          AND users_home.home_id = home.home_id
      `;

      const getUserData = () => {
          return new Promise((resolve, reject) => {
              conn.query(query1, user_id, (err, userData) => {
                  if (err) reject(err);
                  resolve(userData[0]);
              });
          });
      };

      const getHomeData = () => {
          return new Promise((resolve, reject) => {
              conn.query(query2, user_id, (err, homeData) => {
                  if (err) reject(err);
                  resolve(homeData);
              });
          });
      };

      Promise.all([getUserData(), getHomeData()])
          .then(([userData, homeData]) => {
              const combinedData = {
                  ...userData,
                  homes: homeData
              };
              res.status(200).json(combinedData);
          })
          .catch(error => {
              console.error(error);
              res.status(500).json({ error: 'Failed to get user data' });
          });

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/home/change-name', authenticateToken, async (req, res) => {

  try {

    const {home_id, name} = req.body;
  
    const query = `
      UPDATE home
      SET name =?
      WHERE home_id =?
    `;

    conn.query(query,[name, home_id],(err, result) => {
      if(err){
        console.log(err);
        res.status(500).json({ error: 'Failed to update home name' });
      }else{
        res.status(200).json({ message: 'Home name updated successfully' });
      }
    })

  }catch(error){

    console.log(error);
    res.status(500).json({ error: 'Internal server error' });

  }
})





app.post('/api/automation/toggle', authenticateToken, async (req, res) => {
  const { scenario_id, state, devices } = req.body;

  try {
      const activeDevices = devices
          .filter(device => device.status === 'active')
          .map(device => ({
              name: device.name,
              actions: {
                  state: device.actions.state ? 1 : 0,
                  brightness: device.actions.brightness || 100
              }
          }));

      const command = {
          instruction: 'scenario',
          state: state,
          devices: activeDevices
      };

      await serialPortManager.executeCommand(command);
      res.status(200).json({ message: 'Scenario toggled successfully' });
  } catch (error) {
      console.error('Error in toggle automation:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});







app.post('/api/account/leave-home', authenticateToken, async (req, res) => {

  const {home_id, user_id} = req.body;

  try {
      
      const checkOwnerQuery = `
          SELECT owner_id 
          FROM home 
          WHERE home_id = ?
      `;

      conn.query(checkOwnerQuery, [home_id], (error, ownerResults) => {
          if (error) {
              console.error('Database error:', error);
              return res.status(500).json({ error: 'Internal server error' });
          }

          if (ownerResults.length === 0) {
              return res.status(404).json({ error: 'Home not found' });
          }

          if (ownerResults[0].owner_id === parseInt(user_id)) {
              return res.status(403).json({ error: 'Owner cannot leave their home' });
          }

          const deleteQuery = `
              DELETE FROM users_home 
              WHERE home_id = ? AND user_id = ?
          `;

          conn.query(deleteQuery, [home_id, user_id], (deleteError, deleteResult) => {
              if (deleteError) {
                  console.error('Database error:', deleteError);
                  return res.status(500).json({ error: 'Failed to remove user from home' });
              }

              if (deleteResult.affectedRows === 0) {
                  return res.status(404).json({ error: 'User is not a member of this home' });
              }

              res.status(200).json({ message: 'Successfully left the home' });
          });
      });

  } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/home/app-start', async (req, res) => {
  try {
      await serialPortManager.startSensorReading(io);
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