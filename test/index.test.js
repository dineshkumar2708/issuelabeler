const {
  Probot,
  ProbotOctokit,
} = require("@probot/adapter-aws-lambda-serverless");

const nock = require("nock");
nock.disableNetConnect();

const handler = require("../src/handler");
const app = require("../src/app");

const event_opened = require("./fixtures/event_opened");
const event_edited = require("./fixtures/event_edited");
const payload = require("./fixtures/payload");

describe("issuelabeler", () => {
  let probot;

  beforeAll(() => {
    probot = new Probot({
      // simple authentication as alternative to appId/privateKey
      githubToken: "test",
      // disable logs
      logLevel: "warn",
      // disable request throttling and retries
      Octokit: ProbotOctokit.defaults({
        throttle: { enabled: false },
        retry: { enabled: false },
      }),
    });
    probot.load(app);
  });

  test("that labels are applied to an issue when opened", async () => {
    const mock = nock("https://api.github.com")
      .get("/repos/issuebot/test/contents/.github%2Flabeler.yml")
      .reply(200, Buffer.from(`excludeLabels:\n  - hey`).toString())
      .get("/repos/issuebot/test/labels?issue_number=2&per_page=100")
      .reply(200, [
        {
          id: 889466157,
          url: "https://api.octokit.com/repos/issuebot/test/labels/hey",
          name: "hey",
          color: "f5fc92",
          default: false,
        },
        {
          id: 889466158,
          url: "https://api.octokit.com/repos/issuebot/test/labels/test",
          name: "test",
          color: "f5fc93",
          default: false,
        },
        {
          id: 889466159,
          url: "https://api.octokit.com/repos/issuebot/test/labels/a-feature",
          name: "A-Feature",
          color: "f5fc93",
          default: false,
        },
      ])
      .get("/repos/issuebot/test/issues/2")
      .reply(200, payload)
      .post("/repos/issuebot/test/issues/2/labels", (requestBody) => {
        expect(requestBody).toEqual(["test", "A-Feature"]);
        return true;
      })
      .reply(200, []);

    await probot.receive(event_opened);
    expect(mock.activeMocks()).toEqual([]);
  });

  test("that labels are applied to an issue when edited", async () => {
    const mock = nock("https://api.github.com")
      .get("/repos/issuebot/test/contents/.github%2Flabeler.yml")
      .reply(200, Buffer.from(`excludeLabels:\n  - hey`).toString())
      .get("/repos/issuebot/test/labels?issue_number=2&per_page=100")
      .reply(200, [
        {
          id: 889466157,
          url: "https://api.octokit.com/repos/issuebot/test/labels/hey",
          name: "hey",
          color: "f5fc92",
          default: false,
        },
        {
          id: 889466158,
          url: "https://api.octokit.com/repos/issuebot/test/labels/test",
          name: "test",
          color: "f5fc93",
          default: false,
        },
        {
          id: 889466159,
          url: "https://api.octokit.com/repos/issuebot/test/labels/a-feature",
          name: "A-Feature",
          color: "f5fc93",
          default: false,
        },
      ])
      .get("/repos/issuebot/test/issues/2")
      .reply(200, payload)
      .post("/repos/issuebot/test/issues/2/labels", (requestBody) => {
        expect(requestBody).toEqual(["test", "A-Feature"]);
        return true;
      })
      .reply(200, []);

    await probot.receive(event_edited);
    expect(mock.activeMocks()).toEqual([]);
  });
});
