# Arduino Smart Home Backend

A powerful Node.js backend application for managing Arduino-based smart home systems with real-time communication, AI assistance, and comprehensive device management.

## 🎥 Demo

Check out this project in action: **[YouTube Demo](https://www.youtube.com/shorts/l88tk7wHQCE)**

## ✨ Features

- **🔌 Arduino Serial Communication**: Direct communication with Arduino devices via serial port
- **🔄 Real-time Updates**: WebSocket integration using Socket.IO for instant device state changes
- **🧠 AI Assistant**: Google Gemini AI integration for smart home queries and commands
- **📊 Device Management**: Complete CRUD operations for devices, scenarios, and configurations
- **🔐 Authentication**: Secure JWT-based authentication system
- **📷 Camera Integration**: Camera URL management and streaming support
- **⚠️ Alarm System**: Configurable alarm settings with history tracking
- **📈 History Tracking**: Comprehensive logging of device states and user actions
- **🏠 Multi-Home Support**: Manage multiple homes with isolated configurations

## 🛠️ Technologies Used

- **Backend Framework**: Express.js
- **Database**: MongoDB (via Mongoose) + MySQL
- **Real-time Communication**: Socket.IO
- **Serial Communication**: SerialPort library
- **AI Integration**: Google Generative AI (Gemini)
- **Authentication**: JSON Web Tokens (JWT)
- **Password Security**: bcrypt
- **Testing**: Jest with MongoDB Memory Server

## 📦 Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- MySQL
- Arduino IDE (for device programming)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Seveneqqq/backend-arduino.git
   cd backend-arduino
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your configuration:
   ```env
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. **Database Setup**

   **MongoDB**: Ensure MongoDB is running on your system

   **MySQL**: Create database and users table:
   ```sql
   CREATE DATABASE arduino_home;
   USE arduino_home;
   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     login VARCHAR(255) UNIQUE,
     email VARCHAR(255) UNIQUE,
     password VARCHAR(255)
   );
   ```

## 🚀 Usage

### Start the Server

```bash
# Development mode with auto-restart
npm start

# Production mode
node app.js
```

The server will start on `http://localhost:4000`

### Frontend Integration

The backend is configured to work with a frontend running on `http://localhost:3000` with CORS enabled.

## 📡 API Endpoints

### Authentication

- `POST /api/login` - User login
- `POST /api/register` - User registration

### Device Management (Requires Authentication)

- `GET /api/mongodb/` - Get all scenarios
- `POST /api/mongodb/scenario` - Create new scenario
- `DELETE /api/mongodb/scenario/:id` - Delete scenario

### Camera Management

- `POST /api/mongodb/camera` - Add/update camera configuration
- `GET /api/mongodb/camera/:home_id` - Get camera by home ID

### Alarm System

- `POST /api/mongodb/alarm` - Configure alarm settings
- `GET /api/mongodb/alarm/:home_id` - Get alarm configuration
- `GET /api/mongodb/alarm-history/:home_id` - Get alarm history

### Device History

- `POST /api/mongodb/device-history` - Add device history entry
- `GET /api/mongodb/device-history/:home_id` - Get device history

### AI Assistant

- `POST /api/assistant/chat` - Send query to AI assistant

## 🔌 Arduino Integration

### Serial Communication

The `SerialPortManager` class handles communication with Arduino devices:

```javascript
// Example: Sending command to Arduino
const serialManager = new SerialPortManager();
await serialManager.ensureInitialized();
await serialManager.sendCommand('LED_ON');
```

### Device Protocols

Support for various device types:
- Light controls
- Temperature sensors
- Motion detectors
- Door/window sensors
- Camera systems

## 🌐 WebSocket Events

### Client Events

```javascript
// Join home room for real-time updates
socket.emit('joinHome', homeId);

// Send device command
socket.emit('sendDeviceCommand', { device: 'LED', action: 'ON' });
```

### Server Events

```javascript
// Device state changes
socket.on('deviceStateChanged', (data) => {
  // Handle device state update
});

// Serial data received
socket.on('serialDataReceived', (data) => {
  // Handle Arduino data
});
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔧 Development

### Project Structure

```
├── api/
│   ├── mongodb/          # MongoDB routes and schemas
│   └── assistant/        # AI assistant routes
├── tests/
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── SerialPortManager.js  # Arduino communication
├── app.js               # Main application file
└── package.json         # Dependencies and scripts
```

### Serial Port Configuration

The application automatically detects and connects to Arduino devices. Ensure your Arduino is:
1. Connected via USB
2. Running compatible firmware
3. Using the correct baud rate (default: 9600)

## 👤 Author

**Paweł Boroń**
- Email: pawel.boron01@interia.pl
- Project: Bachelor's Engineering Thesis - Smart Home System
  
## 🐛 Known Issues

- Tests require internet connection for MongoDB Memory Server
- Serial port permissions may need adjustment on some systems
- Ensure proper Arduino firmware for device communication

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

*Made with ❤️ for the Arduino and IoT community*
