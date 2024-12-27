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

describe("Database Integration Tests", () => {
  describe("CRUD Operations", () => {
    describe("Scenarios", () => {
      const testScenario = {
        name: "Test Scenario",
        home_id: 1,
        scenarioTurnOn: "turn on test",
        scenarioTurnOff: "turn off test",
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

      it("should perform complete CRUD operations", async () => {
        // Create
        const scenario = new Scenario(testScenario);
        await scenario.save();
        expect(scenario._id).toBeDefined();

        // Read
        const foundScenario = await Scenario.findById(scenario._id);
        expect(foundScenario.name).toBe(testScenario.name);

        // Update
        const updatedName = "Updated Scenario";
        await Scenario.findByIdAndUpdate(scenario._id, { name: updatedName });
        const updatedScenario = await Scenario.findById(scenario._id);
        expect(updatedScenario.name).toBe(updatedName);

        // Delete
        await Scenario.findByIdAndDelete(scenario._id);
        const deletedScenario = await Scenario.findById(scenario._id);
        expect(deletedScenario).toBeNull();
      });
    });

    describe("Device Protocols", () => {
      it("should handle different protocol types", async () => {
        const protocols = [
          {
            device_id: 1,
            protocol_type: "Wifi",
            wifi: {
              ipAddress: "192.168.1.100",
              macAddress: "00:11:22:33:44:55",
              ssid: "TestNetwork",
              password: "testpass",
            },
          },
          {
            device_id: 2,
            protocol_type: "Zigbee",
            zigbee: {
              zigbeeId: "ZB001",
              zigbeeChannel: "11",
              zigbeeGroupId: "G1",
              zigbeeHub: "H1",
            },
          },
        ];

        for (const protocol of protocols) {
          const savedProtocol = await new DeviceProtocol(protocol).save();
          expect(savedProtocol.protocol_type).toBe(protocol.protocol_type);
        }

        const allProtocols = await DeviceProtocol.find();
        expect(allProtocols).toHaveLength(2);
      });
    });
  });

  describe("Relationship Tests", () => {
    it("should maintain device and history relationships", async () => {
      const histories = [
        {
          home_id: 1,
          user_id: 1,
          action: "added",
          device_name: "Device 1",
          device_status: "active",
          room: "Living Room",
          category: "Light",
          timestamp: new Date(),
        },
        {
          home_id: 1,
          user_id: 1,
          action: "removed",
          device_name: "Device 1",
          device_status: "active",
          room: "Living Room",
          category: "Light",
          timestamp: new Date(Date.now() + 1000),
        },
      ];

      for (const history of histories) {
        await new DeviceHistory(history).save();
      }

      const deviceHistories = await DeviceHistory.find({
        home_id: 1,
        device_name: "Device 1",
      }).sort({ timestamp: -1 });

      expect(deviceHistories).toHaveLength(2);
      expect(deviceHistories[0].action).toBe("removed");
      expect(deviceHistories[1].action).toBe("added");
    });

    it("should handle alarm configurations and history", async () => {
      const alarm = await new Alarm({
        home_id: 1,
        temperatureRange: [20, 25],
        humidityRange: [40, 60],
      }).save();

      const alarmHistories = [
        {
          home_id: 1,
          type: "temperature",
          status: "alert",
          value: 26,
          range: alarm.temperatureRange,
          timestamp: new Date(),
        },
        {
          home_id: 1,
          type: "humidity",
          status: "alert",
          value: 65,
          range: alarm.humidityRange,
          timestamp: new Date(),
        },
      ];

      for (const history of alarmHistories) {
        await new AlarmHistory(history).save();
      }

      const histories = await AlarmHistory.find({ home_id: 1 });
      expect(histories).toHaveLength(2);
    });
  });

  describe("Performance Tests", () => {
    it("should handle bulk operations efficiently", async () => {
      const startTime = Date.now();

      const histories = Array.from({ length: 100 }, (_, i) => ({
        home_id: 1,
        user_id: 1,
        action: i % 2 === 0 ? "added" : "removed",
        device_name: `Device ${i}`,
        device_status: "active",
        room: "Living Room",
        category: "Light",
        timestamp: new Date(),
      }));

      await DeviceHistory.insertMany(histories);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);

      const allHistories = await DeviceHistory.find({ home_id: 1 });
      expect(allHistories).toHaveLength(100);
    });

    it("should handle concurrent operations", async () => {
      const operations = Array.from({ length: 10 }, async () => {
        const scenario = new Scenario({
          name: `Scenario ${Math.random()}`,
          home_id: 1,
          devices: [
            {
              device_id: 1,
              name: "Test Device",
              label: "Test Label",
              room_id: 1,
              category: "Light",
              command_on: "on",
              command_off: "off",
              status: "active",
              actions: { state: 1 },
            },
          ],
        });
        return scenario.save();
      });

      const results = await Promise.all(operations);
      expect(results).toHaveLength(10);

      const savedScenarios = await Scenario.find({ home_id: 1 });
      expect(savedScenarios).toHaveLength(10);
    });
  });

  describe("Error Handling", () => {
    it("should handle validation errors", async () => {
      const invalidScenario = new Scenario({});

      await expect(invalidScenario.save()).rejects.toThrow();
    });

    it("should handle duplicate keys", async () => {
      const protocol1 = new DeviceProtocol({
        device_id: 1,
        protocol_type: "Wifi",
      });
      await protocol1.save();

      const protocol2 = new DeviceProtocol({
        device_id: 1,
        protocol_type: "Wifi",
      });

      await expect(protocol2.save()).rejects.toThrow();
    });

    it("should handle invalid data types", async () => {
      const invalidAlarm = new Alarm({
        home_id: "invalid",
        temperatureRange: ["invalid", "range"],
        humidityRange: [40, 60],
      });

      await expect(invalidAlarm.save()).rejects.toThrow();
    });
  });
});
