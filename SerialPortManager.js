const SerialPort = require('serialport');

class SerialPortManager {
    constructor() {
        this.serialPort = null;
        this.isReading = false;
        this.buffer = '';
        this.initializationPromise = null;
        this.io = null;
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
                    console.log('Port szeregowy otwarty pomyślnie');
                    this.setupDataHandler();
                    this.setupErrorHandler();
                    setTimeout(() => resolve(), 2000);
                });

                this.serialPort.on('error', (error) => {
                    console.error('Błąd otwierania portu:', error);
                    this.cleanup();
                    reject(error);
                });
            });
        } catch (error) {
            console.error('Błąd w initializePort:', error);
            this.cleanup();
            throw error;
        }
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
                            console.log('Otrzymano dane:', parsedData);
                            
                            if (parsedData.type === 'sensor_data' && this.io) {
                                this.io.emit('sensorData', parsedData);
                            } else if (parsedData.type === 'command_response') {
                                this.handleCommandResponse(parsedData);
                            }
                        } catch (parseError) {
                            console.error('Błąd parsowania JSON:', parseError, 'Linia:', line);
                        }
                    }
                }
            } catch (error) {
                console.error('Błąd przetwarzania danych:', error);
            }
        });
    }

    setupErrorHandler() {
        if (!this.serialPort) return;

        this.serialPort.on('error', (error) => {
            console.error('Błąd portu szeregowego:', error);
            this.cleanup();
        });
    }

    cleanup() {
        this.serialPort = null;
        this.initializationPromise = null;
        this.isReading = false;
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

            return this.writeToPort(commandWithId);
        } catch (error) {
            console.error('Błąd wykonywania komendy:', error);
            throw error;
        }
    }

    async writeToPort(data) {
        try {
            await this.ensureInitialized();

            return new Promise((resolve, reject) => {
                const dataToSend = JSON.stringify(data) + '\n';
                console.log('Wysyłanie danych:', dataToSend);
                
                this.serialPort.write(dataToSend, (err) => {
                    if (err) {
                        console.error('Błąd wysyłania:', err);
                        reject(err);
                    } else {
                        this.serialPort.drain(() => {
                            console.log('Dane wysłane i zbuforowane');
                            resolve();
                        });
                    }
                });
            });
        } catch (error) {
            console.error('Błąd w writeToPort:', error);
            throw error;
        }
    }

    handleCommandResponse(response) {
        // Debugowanie odpowiedzi z arduino
        //console.log('Odpowiedź na komendę:', response);
    }

    async startSensorReading(io) {
        try {
            await this.ensureInitialized();
            this.isReading = true;
            this.io = io;
            return this.executeCommand({ instruction: "start-app" });
        } catch (error) {
            console.error('Błąd rozpoczynania odczytu czujników:', error);
            throw error;
        }
    }
}

module.exports = new SerialPortManager();