const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../../app");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

async function populateData() {
  await mongoose.model("Camera").create({
    home_id: 1,
    camera_url: "http://example.com/camera1",
  });
  await mongoose.model("Alarm").create({
    home_id: 1,
    temperatureRange: [20, 25],
    humidityRange: [40, 60],
  });
  await mongoose.model("Scenario").create({
    _id: new mongoose.Types.ObjectId(),
    home_id: 1,
    name: "Test Scenario",
    scenarioTurnOn: "Turn on lights",
    scenarioTurnOff: "Turn off lights",
    devices: [],
  });
}

describe("API Integration Tests", () => {
  let authToken;

  beforeAll(() => {
    authToken = global.generateTestToken();
  });

  beforeEach(async () => {
    await populateData();
  });

  describe("Camera API Flow", () => {
    it("should add a camera configuration", async () => {
      const cameraConfig = {
        home_id: 2,
        camera_url: "http://example.com/camera2",
      };

      const response = await request(app)
        .post("/api/mongodb/camera")
        .set("Authorization", `Bearer ${authToken}`)
        .send(cameraConfig);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("home_id", cameraConfig.home_id);
      expect(response.body).toHaveProperty(
        "camera_url",
        cameraConfig.camera_url
      );
    });

    it("should fetch a camera configuration by home_id", async () => {
      const homeId = 1;

      const response = await request(app)
        .get(`/api/mongodb/camera/${homeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("home_id", homeId);
    });

    it("should delete a camera configuration by home_id", async () => {
      const homeId = 1;

      const response = await request(app)
        .delete(`/api/mongodb/camera/${homeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Camera deleted successfully"
      );
    });
  });

  describe("Alarm API Flow", () => {
    it("should update an alarm configuration", async () => {
      const homeId = 1;
      const alarmUpdate = {
        temperatureRange: [18, 22],
        humidityRange: [30, 50],
      };

      const response = await request(app)
        .put(`/api/mongodb/update-alarm/${homeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(alarmUpdate);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "temperatureRange",
        alarmUpdate.temperatureRange
      );
      expect(response.body).toHaveProperty(
        "humidityRange",
        alarmUpdate.humidityRange
      );
    });

    it("should fetch alarm configuration by home_id", async () => {
      const homeId = 1;

      const response = await request(app)
        .get(`/api/mongodb/alarms/${homeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("home_id", homeId);
    });
  });
});
