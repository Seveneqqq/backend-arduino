const SerialPort = require('serialport');

class SerialPortManager {
   constructor() {
       this.serialPort = null;
       this.isReading = false;
       this.buffer = '';
       this.initializationPromise = null;
       this.io = null;
       this._dataHandlers = new Set();
       this.responsePromises = new Map();
   }

   async ensureInitialized() {
       if (!this.serialPort || !this.serialPort.isOpen) {
           if (!this.initializationPromise) {
               this.initializationPromise = this.initializePort();
           }
           await this.initializationPromise;
       }
   }

   async initializePort() {
       try {
           if (this.serialPort && this.serialPort.isOpen) {
               await this.closePort();
           }

           return new Promise((resolve, reject) => {
               this.serialPort = new SerialPort.SerialPort({
                   path: 'COM3',
                   baudRate: 9600,
                   dataBits: 8,
                   parity: 'none',
                   stopBits: 1,
                   flowControl: false,
                   autoOpen: true
               });

               this.serialPort.on('open', () => {
                   console.log('Succesfully opened port');
                   this.setupDataHandler();
                   this.setupErrorHandler();
                   setTimeout(() => resolve(), 2000);
               });

               this.serialPort.on('error', (error) => {
                   console.error('Opening port error:', error);
                   this.cleanup();
                   reject(error);
               });
           });
       } catch (error) {
           console.error('Error in initializePort:', error);
           this.cleanup();
           throw error;
       }
   }

   addDataHandler(handler) {
       this._dataHandlers.add(handler);
   }

   removeDataHandler(handler) {
       this._dataHandlers.delete(handler);
   }

   setupDataHandler() {
       if (!this.serialPort) return;

       let buffer = '';
       this.serialPort.on('data', (data) => {
           try {
               buffer += data.toString();
               
               let lines = buffer.split('\n');
               buffer = lines.pop(); 
               
               for (const line of lines) {
                   if (line.trim()) {
                       try {
                           const parsedData = JSON.parse(line.trim());
                           console.log('Data received:', parsedData);

                           this._dataHandlers.forEach(handler => handler(parsedData));

                           if (parsedData.type === 'sensor_data' && this.io) {
                               this.io.emit('sensorData', parsedData);
                           } 
                           else if (parsedData.type === 'command_response') {
                               this.handleCommandResponse(parsedData);
                           }
                           else if (parsedData.devices) {
                               const promise = this.responsePromises.get('devices');
                               if (promise) {
                                   promise.resolve(parsedData);
                                   this.responsePromises.delete('devices');
                               }
                           }
                       } catch (parseError) {
                           console.error('Json parsing error:', parseError, 'Linia:', line);
                       }
                   }
               }
           } catch (error) {
               console.error('Data processing error:', error);
           }
       });
   }

   setupErrorHandler() {
       if (!this.serialPort) return;

       this.serialPort.on('error', (error) => {
           console.error('Serial-port error:', error);
           this.cleanup();
       });
   }

   cleanup() {
       this.serialPort = null;
       this.initializationPromise = null;
       this.isReading = false;
       this._dataHandlers.clear();
       for (const promise of this.responsePromises.values()) {
           promise.reject(new Error('Port closed'));
       }
       this.responsePromises.clear();
   }

   async closePort() {
       return new Promise((resolve) => {
           if (this.serialPort && this.serialPort.isOpen) {
               this.serialPort.close(() => {
                   console.log('Port szeregowy zamknięty');
                   this.cleanup();
                   resolve();
               });
           } else {
               resolve();
           }
       });
   }

   async executeCommand(command) {
       try {
           await this.ensureInitialized();

           const commandWithId = {
               ...command,
               id: Date.now().toString(),
               timestamp: Date.now()
           };

           if (command.instruction === "send-devices-list") {
               const responsePromise = new Promise((resolve, reject) => {
                   this.responsePromises.set('devices', { resolve, reject });
                   setTimeout(() => {
                       this.responsePromises.delete('devices');
                       reject(new Error('Device list timeout'));
                   }, 5000);
               });

               await this.writeToPort(commandWithId);
               return responsePromise;
           } else {
               return this.writeToPort(commandWithId);
           }
       } catch (error) {
           console.error('Command execution error:', error);
           throw error;
       }
   }

   async writeToPort(data) {
       try {
           await this.ensureInitialized();

           return new Promise((resolve, reject) => {
               const dataToSend = JSON.stringify(data) + '\n';
               console.log('Data sending:', dataToSend);
               
               this.serialPort.write(dataToSend, (err) => {
                   if (err) {
                       console.error('Error while sending:', err);
                       reject(err);
                   } else {
                       this.serialPort.drain(() => {
                           console.log('Data sent and buffered');
                           resolve();
                       });
                   }
               });
           });
       } catch (error) {
           console.error('Error in writeToPort:', error);
           throw error;
       }
   }

   handleCommandResponse(response) {
       console.log('Response to command:', response);
   }

   async startSensorReading(io) {
       try {
           await this.ensureInitialized();
           this.isReading = true;
           this.io = io;
           return this.executeCommand({ instruction: "start-app" });
       } catch (error) {
           console.error('Error with sensors start:', error);
           throw error;
       }
   }
}

module.exports = new SerialPortManager();