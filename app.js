
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');

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
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(bodyParser.json());

app.post('/api/login', (req, res) => {

  const { login,password } = req.body;

    conn.query(`select * from users where (login = '${login}' or email = '${login}') and password = '${password}'`, function(err,result,fields){
      
      if(result.length == 1){
        return res.send({ success: `Hello ${login}`});
      }
      else{
        return res.send({ error: 'User does not exist or password is incorrect'});
      }
    });

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
        res.send({ success: 'Success, user created' });
      });
    }
    catch (error) {

      console.log("Error : " +error);
      res.send({'error': error});
    }

});





app.post('/api/command', (req, res) => {

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