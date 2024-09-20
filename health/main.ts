import Docker from "https://deno.land/x/docker_deno@v0.3.3/mod.ts";
import fetchWithTimeout from "https://gist.githubusercontent.com/chand1012/43c187e650cc1fc3775f296817053f97/raw/8ae560a97f67d82daeb4f2cb37aaacd501dfc08e/fetchWithTimeout.ts";
import ms from "npm:ms@2.1.3";

const docker = new Docker("/var/run/docker.sock");

// make sure that we can access avalanche:9650/ext/health. Doesn't matter the response, just need a response before timeout (which should be low. Like 5 seconds max)
// we just want the promise to resolve successfully if the node is healthy
const checkNodeHealth = async () => {
  const res = await fetchWithTimeout("http://avalanche:9650/ext/health", {
    method: "GET",
  }, 5000);
  if (!res.ok) {
    // log the response
    const body = await res.text();
    console.error(body);
    throw new Error("Node is not healthy");
  }
};

// this is just a polling daemon, so we need to check how long its been running and if it hasn't been running for more than a few seconds at a time, throw an error
const checkWatchdogHealth = async () => {
  const containers = await docker.containers.list();
  const watchdogContainer = containers.find((container) =>
    container?.Names?.find((name) => name.includes("watchdog"))
  );
  if (!watchdogContainer) {
    throw new Error("Watchdog container not found");
  }

  const running = watchdogContainer.State?.includes("running") ||
    watchdogContainer.State?.includes("created");

  const runningTime: number = ms(watchdogContainer.Status?.replace("Up ", ""));
  // if its not been running more than 5 seconds or its not running at all, throw an error
  if (!running || runningTime < 5000) {
    console.log(watchdogContainer);
    throw new Error("Watchdog is not healthy");
  }
};

Deno.serve(async (_) => {
  try {
    await Promise.all([checkNodeHealth(), checkWatchdogHealth()]);
    return new Response("OK", {
      status: 200,
    });
  } catch (e) {
    return new Response(e.message, {
      status: 500,
    });
  }
})
