const request = require("supertest");
const express = require("express");
const router = require("../../api/mongodb/route");

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/mongodb", router);
  return app;
};

describe("MongoDB Routes Tests", () => {
  let app;
  let authToken;

  beforeEach(() => {
    app = createApp();
    authToken = global.generateTestToken();
  });

  describe("Scenario Routes", () => {
    it("should create new scenario", async () => {
      const newScenario = {
        name: "Test Scenario",
        home_id: 1,
        user_id: 1,
        scenarioTurnOn: "turn on test",
        scenarioTurnOff: "turn off test",
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
            actions: { state: 1, brightness: 100 },
          },
        ],
      };

      const response = await request(app)
        .post("/api/mongodb/add-scenario")
        .set("Authorization", `Bearer ${authToken}`)
        .send(newScenario);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.name).toBe(newScenario.name);
    });

    it("should get scenarios for home", async () => {
      const response = await request(app)
        .get("/api/mongodb/scenarios/1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
    });

    it("should delete scenario", async () => {
      const scenario = {
        name: "Scenario to Delete",
        home_id: 1,
        user_id: 1,
        devices: [],
      };

      const createResponse = await request(app)
        .post("/api/mongodb/add-scenario")
        .set("Authorization", `Bearer ${authToken}`)
        .send(scenario);

      const scenarioId = createResponse.body._id;

      const response = await request(app)
        .delete(`/api/mongodb/delete-scenario/${scenarioId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ user_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Scenario deleted successfully");
    });
  });

  describe("Camera Routes", () => {
    it("should add camera", async () => {
      const cameraData = {
        home_id: 1,
        camera_url: "http://test-camera.com/stream",
      };

      const response = await request(app)
        .post("/api/mongodb/camera")
        .set("Authorization", `Bearer ${authToken}`)
        .send(cameraData);

      expect(response.status).toBe(200);
      expect(response.body.camera_url).toBe(cameraData.camera_url);
    });

    it("should get camera by home_id", async () => {
      await request(app)
        .post("/api/mongodb/camera")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          home_id: 1,
          camera_url: "http://test-camera.com/stream",
        });

      const response = await request(app)
        .get("/api/mongodb/camera/1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("camera_url");
    });
  });

  describe("Alarm Routes", () => {
    it("should add alarm settings", async () => {
      const alarmData = {
        home_id: 1,
        temperatureRange: [20, 25],
        humidityRange: [40, 60],
      };

      const response = await request(app)
        .post("/api/mongodb/add-alarm")
        .set("Authorization", `Bearer ${authToken}`)
        .send(alarmData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("temperatureRange");
      expect(response.body).toHaveProperty("humidityRange");
    });

    it("should get alarm history", async () => {
      const response = await request(app)
        .get("/api/mongodb/alarms/history/1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
    });
  });

  describe("Device Protocol Routes", () => {
    it("should add device protocol", async () => {
      const protocolData = {
        device_id: 1,
        protocol_type: "Wifi",
        ipAddress: "192.168.1.100",
        macAddress: "00:11:22:33:44:55",
        ssid: "TestNetwork",
        password: "testpass",
      };

      const response = await request(app)
        .post("/api/mongodb/add-device-protocol")
        .set("Authorization", `Bearer ${authToken}`)
        .send(protocolData);

      expect(response.status).toBe(200);
      expect(response.body.protocol_type).toBe("Wifi");
    });

    it("should get device protocol", async () => {
      await request(app)
        .post("/api/mongodb/add-device-protocol")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          device_id: 1,
          protocol_type: "Wifi",
          ipAddress: "192.168.1.100",
        });

      const response = await request(app)
        .get("/api/mongodb/device-protocol/1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("device_id");
    });
  });

  describe("History Routes", () => {
    it("should add device history", async () => {
      const historyData = {
        home_id: 1,
        user_id: 1,
        action: "added",
        device_name: "Test Device",
        device_status: "active",
        room: "Living Room",
        category: "Light",
      };

      const response = await request(app)
        .post("/api/mongodb/devices/history")
        .set("Authorization", `Bearer ${authToken}`)
        .send(historyData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("device_name");
    });

    it("should get device history", async () => {
      const response = await request(app)
        .get("/api/mongodb/devices/history/1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
    });
  });

  describe("Error Handling", () => {
    it("should handle validation errors", async () => {
      const invalidScenario = {};

      const response = await request(app)
        .post("/api/mongodb/add-scenario")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidScenario);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should handle not found errors", async () => {
      const response = await request(app)
        .get("/api/mongodb/device-protocol/999")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });
  });
});
