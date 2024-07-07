
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');``


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); 
  res.setHeader("Content-Security-Policy", "connect-src 'self' http://localhost");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(bodyParser.json());


app.get('/api/getdata', (req, res) => {
  res.json({ message: 'Dane z serwera' });
});

app.get('/api/sendtext', (req, res) => {
    const receivedText = req.body.text; 
    console.log('Odebrany tekst:', receivedText);
    if(receivedText === "cos"){
      res.json({ message: 'Test dziala'});
    }
    else{
      res.json({ message: 'Tekst został odebrany przez serwer. Rozny od "cos"' });
    }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`Username or email: ${username}`);
  console.log(`Password: ${password}`);
  res.send({ success: true });
});



app.post('/api/register', (req, res) => {

  const {email,username,password,repeatPassword} = req.body;

  console.log(`Email: ${email}`);
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
  console.log(`Repeat Password: ${repeatPassword}`);

  res.send({ success: true });

});


// Uruchomienie serwera
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Serwer nasłuchuje na porcie ${PORT}`);
});



















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