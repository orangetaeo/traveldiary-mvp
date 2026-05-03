import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/health/route";

const SAVED = {
  sha: process.env.RAILWAY_GIT_COMMIT_SHA,
  dep: process.env.RAILWAY_DEPLOYMENT_ID,
  branch: process.env.RAILWAY_GIT_BRANCH,
};

describe("health endpoint deployment meta", () => {
  beforeEach(() => {
    delete process.env.RAILWAY_GIT_COMMIT_SHA;
    delete process.env.RAILWAY_DEPLOYMENT_ID;
    delete process.env.RAILWAY_GIT_BRANCH;
  });

  afterEach(() => {
    if (SAVED.sha === undefined) delete process.env.RAILWAY_GIT_COMMIT_SHA;
    else process.env.RAILWAY_GIT_COMMIT_SHA = SAVED.sha;
    if (SAVED.dep === undefined) delete process.env.RAILWAY_DEPLOYMENT_ID;
    else process.env.RAILWAY_DEPLOYMENT_ID = SAVED.dep;
    if (SAVED.branch === undefined) delete process.env.RAILWAY_GIT_BRANCH;
    else process.env.RAILWAY_GIT_BRANCH = SAVED.branch;
  });

  it("commit falls back to 'local' when RAILWAY_GIT_COMMIT_SHA is unset", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.commit).toBe("local");
    expect(body.commitFull).toBeNull();
    expect(body.deploymentId).toBeNull();
    expect(body.branch).toBeNull();
  });

  it("commit returns first 7 chars when RAILWAY_GIT_COMMIT_SHA is set", async () => {
    process.env.RAILWAY_GIT_COMMIT_SHA = "067fe61abcdef1234567890";
    process.env.RAILWAY_DEPLOYMENT_ID = "deploy-xyz";
    process.env.RAILWAY_GIT_BRANCH = "main";
    const res = await GET();
    const body = await res.json();
    expect(body.commit).toBe("067fe61");
    expect(body.commitFull).toBe("067fe61abcdef1234567890");
    expect(body.deploymentId).toBe("deploy-xyz");
    expect(body.branch).toBe("main");
  });

  it("does not expose deprecated 'cycle' hardcoded field", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.cycle).toBeUndefined();
  });

  it("includes app and timestamp", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.app).toBe("traveldiary-mvp");
    expect(typeof body.timestamp).toBe("string");
  });
});
