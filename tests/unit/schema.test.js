const {
  Scenario,
  DeviceProtocol,
  Alarm,
  AlarmHistory,
  DeviceHistory,
  ScenarioHistory,
  UserHistory,
  Camera,
} = require("../../api/mongodb/schema");

describe("Schema Tests", () => {
  describe("Scenario Model", () => {
    it("should validate a valid scenario", () => {
      const validScenario = {
        name: "Test Scenario",
        home_id: 1,
        scenarioTurnOn: "turn on lights",
        scenarioTurnOff: "turn off lights",
        devices: [
          {
            device_id: 1,
            name: "Test Device",
            label: "Living Room Light",
            room_id: 1,
            category: "Light",
            command_on: "turn on",
            command_off: "turn off",
            status: "active",
            actions: { state: 1, brightness: 100 },
          },
        ],
      };

      const scenario = new Scenario(validScenario);
      const err = scenario.validateSync();
      expect(err).toBeUndefined();
    });

    it("should fail without required fields", () => {
      const invalidScenario = new Scenario({});
      const err = invalidScenario.validateSync();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.home_id).toBeDefined();
    });
  });

  describe("DeviceProtocol Model", () => {
    it("should validate wifi protocol", () => {
      const validProtocol = {
        device_id: 1,
        protocol_type: "Wifi",
        wifi: {
          ipAddress: "192.168.1.1",
          macAddress: "00:11:22:33:44:55",
          ssid: "TestNetwork",
          password: "password123",
        },
      };

      const protocol = new DeviceProtocol(validProtocol);
      const err = protocol.validateSync();
      expect(err).toBeUndefined();
    });

    it("should fail with invalid protocol type", () => {
      const invalidProtocol = {
        device_id: 1,
        protocol_type: "InvalidProtocol",
      };

      const protocol = new DeviceProtocol(invalidProtocol);
      const err = protocol.validateSync();
      expect(err.errors["protocol_type"]).toBeDefined();
    });
  });

  describe("Alarm Model", () => {
    it("should validate with default ranges", () => {
      const validAlarm = {
        home_id: 1,
      };

      const alarm = new Alarm(validAlarm);
      const err = alarm.validateSync();
      expect(err).toBeUndefined();
      expect(alarm.temperatureRange).toEqual([19, 24]);
      expect(alarm.humidityRange).toEqual([40, 60]);
    });

    it("should validate with custom ranges", () => {
      const validAlarm = {
        home_id: 1,
        temperatureRange: [20, 25],
        humidityRange: [45, 65],
      };

      const alarm = new Alarm(validAlarm);
      const err = alarm.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe("History Models", () => {
    it("should validate device history", () => {
      const validDeviceHistory = {
        home_id: 1,
        user_id: 1,
        action: "added",
        device_name: "Test Device",
        device_status: "active",
        room: "Living Room",
        category: "Light",
        timestamp: new Date(),
      };

      const deviceHistory = new DeviceHistory(validDeviceHistory);
      const err = deviceHistory.validateSync();
      expect(err).toBeUndefined();
    });

    it("should validate alarm history", () => {
      const validAlarmHistory = {
        home_id: 1,
        type: "temperature",
        status: "alert",
        value: 26,
        range: [20, 25],
        timestamp: new Date(),
      };

      const alarmHistory = new AlarmHistory(validAlarmHistory);
      const err = alarmHistory.validateSync();
      expect(err).toBeUndefined();
    });

    it("should validate scenario history", () => {
      const validScenarioHistory = {
        home_id: 1,
        user_id: 1,
        action: "added",
        scenario_name: "Test Scenario",
        timestamp: new Date(),
      };

      const scenarioHistory = new ScenarioHistory(validScenarioHistory);
      const err = scenarioHistory.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe("Camera Model", () => {
    it("should validate camera configuration", () => {
      const validCamera = {
        home_id: 1,
        camera_url: "http://192.168.1.100:8080/stream",
      };

      const camera = new Camera(validCamera);
      const err = camera.validateSync();
      expect(err).toBeUndefined();
    });

    it("should fail without required url", () => {
      const invalidCamera = new Camera({
        home_id: 1,
      });

      const err = invalidCamera.validateSync();
      expect(err.errors.camera_url).toBeDefined();
    });
  });
});
