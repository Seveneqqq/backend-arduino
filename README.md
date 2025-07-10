<h1 align="center">
  🏠 Arduino Smart Home Backend
</h1>

<p align="center">
  A powerful Node.js backend application for managing Arduino-based smart home systems with real-time communication, AI assistance, and comprehensive device management.
</p>

<p align="center">
  <a href="https://www.youtube.com/shorts/l88tk7wHQCE">
    <img src="https://img.shields.io/badge/Demo-YouTube%20Shorts-red" alt="Demo" />
  </a>
  <img src="https://img.shields.io/badge/Node.js-20+-green" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-4.18.3-blue" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-Latest-green" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.IO-4.8.1-black" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Arduino-Compatible-teal" alt="Arduino" />
  <img src="https://img.shields.io/badge/License-ISC-blue" alt="License" />
</p>

<p align="center">
  <strong>Bachelor's Engineering Thesis Project</strong><br>
  "Implementation of a Smart Home System"
</p>

<br>

## 📋 Table of Contents

- [Demo](#-demo)
- [Features](#-features)
- [Technologies Used](#️-technologies-used)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Endpoints](#-api-endpoints)
- [Arduino Integration](#-arduino-integration)
- [WebSocket Events](#-websocket-events)
- [Testing](#-testing)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [Author](#-author)
- [Known Issues](#-known-issues)
- [Support](#-support)

## 🎥 Demo

Check out this project in action: **[YouTube Demo](https://www.youtube.com/shorts/l88tk7wHQCE)**

## ✨ Features

### 🔌 Hardware Integration
- **Arduino Serial Communication** - Direct communication with Arduino devices via serial port
- **Real-time Device Control** - Instant command execution and status updates
- **Multi-Protocol Support** - WiFi, Zigbee, Bluetooth, Z-Wave, and MQTT protocols

### 🔄 Real-time Communication
- **WebSocket Integration** - Socket.IO for instant device state synchronization
- **Live Sensor Data** - Real-time environmental monitoring and alerts
- **Instant Notifications** - Immediate status updates across all connected clients

### 🧠 AI & Intelligence
- **Google Gemini AI Integration** - Smart home queries and natural language commands
- **Automated Scenarios** - Intelligent automation based on conditions and triggers
- **Predictive Analytics** - Usage patterns and optimization suggestions

### 📊 Device & Home Management
- **Complete Device CRUD** - Add, configure, monitor, and remove smart devices
- **Multi-Home Support** - Manage multiple properties with isolated configurations
- **Room Organization** - Organize devices by rooms and categories
- **Device History** - Comprehensive logging of all device interactions

### 🔐 Security & Authentication
- **JWT-based Authentication** - Secure user sessions with token-based auth
- **Role-based Access** - Owner and member permissions for shared homes
- **Session Management** - Automatic timeout and security monitoring
- **Password Encryption** - bcrypt hashing for secure credential storage

### 📷 Monitoring & Surveillance
- **Camera Integration** - Live video streaming and camera management
- **Security Alerts** - Configurable alarm system with history tracking
- **Activity Logging** - Detailed audit trail of all system activities

### 🏗️ Advanced Features
- **Task Management** - Scheduled operations and todo lists
- **Home Sharing** - Invite users to join homes with invite codes
- **Statistics Dashboard** - Usage analytics and system performance metrics
- **RESTful API** - Complete API for frontend and third-party integrations

## 🛠️ Technologies Used

### 🚀 Backend Framework & Runtime
- **Node.js** (v14+) - JavaScript runtime environment
- **Express.js** (v4.18.3) - Fast, minimalist web framework
- **Nodemon** (v3.1.4) - Development auto-restart utility

### 💾 Databases & Storage
- **MongoDB** - Document database via Mongoose ODM (v8.8.1)
- **MySQL** (v2.18.1) - Relational database for user management
- **File System** - Local storage for uploads and configurations

### 🔄 Real-time & Communication
- **Socket.IO** (v4.8.1) - WebSocket library for real-time communication
- **SerialPort** (v12.0.0) - Hardware communication with Arduino devices
- **CORS** (v2.8.5) - Cross-origin resource sharing

### 🧠 AI & Intelligence
- **Google Generative AI** (v0.21.0) - Gemini AI integration for smart queries
- **Natural Language Processing** - Command interpretation and responses

### 🔐 Security & Authentication
- **JSON Web Tokens** (v9.0.2) - Secure authentication tokens
- **bcrypt** (v5.1.1) - Password hashing and encryption
- **Environment Variables** - Secure configuration via dotenv (v16.4.5)

### 🧪 Testing & Development
- **Jest** (v29.7.0) - JavaScript testing framework
- **MongoDB Memory Server** (v10.1.2) - In-memory database for testing
- **Supertest** (v7.0.0) - HTTP assertion testing
- **Socket.IO Client** (v4.8.1) - WebSocket testing utilities

### 📡 API & Integration
- **Body Parser** (v1.20.2) - Request body parsing middleware
- **RESTful Architecture** - Clean API design patterns
- **WebSocket Events** - Real-time bidirectional communication

## 📦 Installation

### ⚡ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** - [Installation guide](https://docs.mongodb.com/manual/installation/)
- **MySQL** - [Download here](https://dev.mysql.com/downloads/)
- **Arduino IDE** (for device programming) - [Download here](https://www.arduino.cc/en/software)

### 🚀 Quick Start

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
   JWT_SECRET=your_jwt_secret_key_here
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

4. **Database Setup**

   **MongoDB Setup:**
   ```bash
   # Ensure MongoDB is running on your system
   mongosh # Test connection
   ```

   **MySQL Setup:**
   ```sql
   CREATE DATABASE arduino_home;
   USE arduino_home;
   
   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     login VARCHAR(255) UNIQUE NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL
   );
   
   CREATE TABLE home (
     home_id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     owner_id INT,
     home_invite_code VARCHAR(255),
     FOREIGN KEY (owner_id) REFERENCES users(id)
   );
   
   CREATE TABLE users_home (
     id INT AUTO_INCREMENT PRIMARY KEY,
     user_id INT,
     home_id INT,
     FOREIGN KEY (user_id) REFERENCES users(id),
     FOREIGN KEY (home_id) REFERENCES home(home_id)
   );
   
   CREATE TABLE devices (
     device_id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255),
     home_id INT,
     room_id INT,
     label VARCHAR(255),
     command_on VARCHAR(255),
     command_off VARCHAR(255),
     status ENUM('active', 'not-active'),
     category VARCHAR(100),
     FOREIGN KEY (home_id) REFERENCES home(home_id)
   );
   
   CREATE TABLE tasks (
     id INT AUTO_INCREMENT PRIMARY KEY,
     home_id INT,
     user_id INT,
     topic VARCHAR(255),
     content TEXT,
     isCompleted BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (home_id) REFERENCES home(home_id),
     FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

5. **Start the application**
   ```bash
   # Development mode with auto-restart
   npm start
   
   # Production mode
   node app.js
   ```

6. **Verify installation**
   Open your browser and navigate to `http://localhost:4000`
   
   You should see the server running successfully!

## 🚀 Usage

### 🎯 Starting the Server

```bash
# Development mode with auto-restart
npm start

# Production mode  
node app.js
```

The server will start on `http://localhost:4000`

### 🌐 Frontend Integration

The backend is configured to work with a frontend running on `http://localhost:3000` with CORS enabled.

### 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📡 API Endpoints

### 🔐 Authentication
```http
POST /api/login          # User login
POST /api/register       # User registration
```

### 🏠 Home Management (Requires Authentication)
```http
POST /api/new-home               # Create new home
POST /api/join-to-home          # Join home with invite code  
POST /api/user-homes            # Get user's homes
GET  /api/home/home-info/:home_id # Get home details
POST /api/home/change-name      # Change home name
DELETE /api/home/:home_id       # Delete home
POST /api/account/leave-home    # Leave home
```

### 📱 Device Management (Requires Authentication)
```http
GET    /api/home/get-devices    # Get all devices for home
POST   /api/find-devices        # Discover Arduino devices
POST   /api/add-new-devices     # Add multiple devices
PUT    /api/devices/:device_id  # Update device
DELETE /api/devices/:device_id  # Remove device
POST   /api/home/do            # Execute device command
```

### 🎬 Scenario & Automation (Requires Authentication)
```http
GET    /api/mongodb/            # Get all scenarios
POST   /api/mongodb/scenario    # Create new scenario  
DELETE /api/mongodb/scenario/:id # Delete scenario
POST   /api/automation/toggle   # Toggle automation scenario
```

### 📷 Camera Management (Requires Authentication)
```http
POST /api/mongodb/camera          # Add/update camera configuration
GET  /api/mongodb/camera/:home_id # Get camera by home ID
```

### ⚠️ Alarm System (Requires Authentication)
```http
POST /api/mongodb/alarm               # Configure alarm settings
GET  /api/mongodb/alarm/:home_id      # Get alarm configuration  
GET  /api/mongodb/alarm-history/:home_id # Get alarm history
```

### 📊 Analytics & History (Requires Authentication)
```http
POST /api/mongodb/device-history     # Add device history entry
GET  /api/mongodb/device-history/:home_id # Get device history
GET  /api/home/statistics/:home_id   # Get home statistics
```

### ✅ Task Management (Requires Authentication)
```http
POST   /api/tasks/add            # Add new task
GET    /api/tasks/:home_id       # Get tasks for home
POST   /api/tasks/:task_id/complete # Mark task as completed
DELETE /api/tasks/:task_id       # Delete task
```

### 👤 Account Management (Requires Authentication)
```http
GET  /api/account/:user_id       # Get user account details
POST /api/account/change-password # Change user password
```

### 🧠 AI Assistant (Requires Authentication)
```http
POST /api/assistant/chat         # Send query to AI assistant
```

### 🔧 System Control
```http
GET /api/home/app-start          # Start sensor reading
GET /api/devices-list            # Get available device types
```

## 🔌 Arduino Integration

### ⚡ Serial Communication

The `SerialPortManager` class handles all communication with Arduino devices:

```javascript
// Example: Initialize and send commands
const serialManager = new SerialPortManager();
await serialManager.ensureInitialized();

// Send simple command
await serialManager.sendCommand('LED_ON');

// Send complex device control
const command = {
    instruction: "device-control",
    device: "livingroom_light",
    actions: {
        state: true,
        brightness: 75,
        temperature: 3000
    }
};
await serialManager.executeCommand(command);
```

### 📡 Supported Device Protocols

The system supports multiple communication protocols:

#### Direct Serial (Arduino USB)
- **Baud Rate**: 9600 (default)
- **Data Format**: JSON commands over serial
- **Real-time**: Instant command execution

#### Network Protocols
- **WiFi** - IP address and MAC address configuration
- **Zigbee** - Channel, Group ID, and Hub management  
- **Bluetooth LE** - UUID and connection management
- **Z-Wave** - Device ID and network key management
- **MQTT** - Broker URL and topic configuration

### 🏗️ Device Categories

Support for various smart home device types:

- **💡 Lighting Controls** - LED strips, smart bulbs, dimmer switches
- **🌡️ Environmental Sensors** - Temperature, humidity, air quality
- **🚪 Security Devices** - Motion detectors, door/window sensors
- **📷 Camera Systems** - IP cameras, security monitoring
- **🔌 Smart Outlets** - Power control and monitoring
- **🏠 HVAC Systems** - Heating, cooling, and ventilation

### 📊 Command Structure

#### Device Discovery
```json
{
  "instruction": "send-devices-list"
}
```

#### Device Control
```json
{
  "instruction": "device-control", 
  "device": "device_name",
  "actions": {
    "state": true,
    "brightness": 80,
    "temperature": 2700
  }
}
```

#### Scenario Execution
```json
{
  "instruction": "scenario",
  "state": "activate",
  "devices": [
    {
      "name": "bedroom_light",
      "actions": {"state": false}
    }
  ]
}
```

## 🌐 WebSocket Events

### Client Events

## 🌐 WebSocket Events

### 📤 Client to Server Events

```javascript
// Join a home room for real-time updates
socket.emit('joinHome', homeId);

// Send device commands through WebSocket
socket.emit('sendDeviceCommand', { 
  device: 'living_room_light', 
  action: 'toggle',
  brightness: 75 
});

// Leave home room
socket.emit('leaveHome', homeId);
```

### 📥 Server to Client Events

```javascript
// Listen for device state changes
socket.on('deviceStateChanged', (data) => {
  console.log('Device updated:', data.device, data.newState);
  // Update UI with new device state
});

// Listen for Arduino serial data
socket.on('serialDataReceived', (data) => {
  console.log('Sensor data:', data);
  // Process real-time sensor readings
});

// Listen for sensor data updates
socket.on('sensorData', (data) => {
  console.log('Environmental data:', data);
  // Update dashboard with sensor readings
});

// Connection status events  
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

### 🔄 Real-time Features

- **Instant Device Updates** - All connected clients receive immediate device state changes
- **Live Sensor Data** - Environmental monitoring with real-time charts
- **Home Isolation** - Users only receive updates for their connected homes
- **Connection Management** - Automatic reconnection and error handling

## 🧪 Testing

### 🎯 Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### 🧰 Testing Framework

- **Jest** - JavaScript testing framework
- **MongoDB Memory Server** - In-memory database for testing
- **Supertest** - HTTP assertion testing
- **Socket.IO Client** - WebSocket testing utilities

### 📊 Test Coverage

The test suite includes:
- **Unit Tests** - Individual component testing
- **Integration Tests** - API endpoint testing
- **Database Tests** - MongoDB and MySQL operations
- **WebSocket Tests** - Real-time communication testing

## 🔧 Development

### 📁 Project Structure

```
backend-arduino/
├── 📁 api/
│   ├── 📁 mongodb/              # MongoDB routes and schemas
│   │   ├── route.js            # Database API routes
│   │   └── schemas/            # Mongoose models
│   └── 📁 assistant/           # AI assistant integration
│       └── route.js            # Gemini AI routes
├── 📁 tests/
│   ├── 📁 unit/               # Unit tests
│   ├── 📁 integration/        # Integration tests
│   └── setup.js              # Test configuration
├── 📄 SerialPortManager.js     # Arduino communication handler
├── 📄 app.js                  # Main Express application
├── 📄 package.json            # Dependencies and scripts
├── 📄 jest.config.js          # Jest testing configuration
├── 📄 .env.example           # Environment variables template
└── 📄 .gitignore             # Git ignore rules
```

### ⚙️ Development Setup

1. **Install development dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm start  # Uses nodemon for auto-restart
   ```

3. **Code structure guidelines**
   - RESTful API design patterns
   - Middleware for authentication
   - Error handling with try-catch blocks
   - Environment-based configuration

### 🔌 Arduino Configuration

The application automatically detects and connects to Arduino devices. Ensure your Arduino:

1. **Hardware Setup**
   - Connected via USB cable
   - Proper drivers installed
   - Power indicator LED on

2. **Firmware Requirements**
   - Compatible Arduino sketch uploaded
   - JSON communication protocol implemented
   - Correct baud rate configured (default: 9600)

3. **Serial Port Settings**
   - Data bits: 8
   - Parity: None  
   - Stop bits: 1
   - Flow control: None

### 🔄 Development Workflow

```bash
# 1. Start databases
mongod                    # Start MongoDB
mysql.server start       # Start MySQL

# 2. Start development server
npm start                # Backend with auto-restart

# 3. Run tests during development
npm run test:watch       # Continuous testing

# 4. Check code quality
npm run test:coverage    # Coverage report
```

## 👤 Author

**Paweł Boroń**
- Email: pawel.boron01@interia.pl
## 👤 Author

<div align="center">

**Paweł Boroń**

📧 [pawel.boron01@interia.pl](mailto:pawel.boron01@interia.pl)

🎓 **Bachelor's Engineering Thesis Project**  
*"Implementation of a Smart Home System"*

</div>

## 🚨 Known Issues & Troubleshooting

### ⚠️ Common Issues

- **MongoDB Memory Server** - Tests require internet connection for download
- **Serial Port Permissions** - May need adjustment on Linux/macOS systems
- **Arduino Firmware** - Ensure compatible sketch is uploaded to device
- **Port Conflicts** - Check if ports 4000 (backend) and 27017 (MongoDB) are available

### 🔧 Troubleshooting

#### Serial Port Issues
```bash
# Linux/macOS: Add user to dialout group
sudo usermod -a -G dialout $USER

# Check available ports
ls /dev/tty*
```

#### Database Connection
```bash
# Test MongoDB connection
mongosh

# Test MySQL connection  
mysql -u root -p
```

#### Jest Test Issues
```bash
# Install jest globally if needed
npm install -g jest

# Clear Jest cache
npx jest --clearCache
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- **[Frontend-Arduino](https://github.com/Seveneqqq/frontend-arduino)** - React frontend for this system
- **[Arduino Smart Home Code](https://github.com/Seveneqqq/smarthome-code-arduino)** - Arduino firmware
- **[3D Models](https://github.com/Seveneqqq/3d-models-arduino)** - 3D printable enclosures

## 📞 Support

For support and questions:

- 📧 Email: [pawel.boron01@interia.pl](mailto:pawel.boron01@interia.pl)
- 🐛 Issues: [GitHub Issues](https://github.com/Seveneqqq/backend-arduino/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Seveneqqq/backend-arduino/discussions)

---

<div align="center">

### 🌟 If this project helped you, please consider giving it a star! ⭐

*Made with ❤️ for the Arduino and IoT community*

**[⬆ Back to Top](#arduino-smart-home-backend)**

</div>
