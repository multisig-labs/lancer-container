import { Database } from "./types.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1?target=deno";
import Docker from "https://deno.land/x/docker_deno@v0.3.3/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_KEY");

const network = Deno.env.get("NETWORK") || "fuji";

// Path Constants
const CONFIG_PATH = "/avalanche/configs/node.json";
const PLUGINS_DIR = "/avalanche/plugins";
const SUBNET_EVM_SOURCE = "/avalanche/vms/subnet-evm";

// Docker Socket Path
const DOCKER_SOCKET_PATH = "/var/run/docker.sock";

const docker = new Docker(DOCKER_SOCKET_PATH);

type Config = {
  "track-subnets": string;
  "public-ip": string;
  "http-host": string;
  "http-allowed-hosts": string;
};

// Define the Subnet type based on your database schema
type Subnet = {
  subnet_id: string;
  vm_id: string;
  // Add other relevant fields if necessary
};

if (!supabaseUrl || !serviceKey) {
  throw new Error("Please provide SUPABASE_URL and SUPABASE_SERVICE_KEY");
}

const supabase = createClient<Database>(supabaseUrl, serviceKey);

/**
 * Fetch all subnets from the database.
 * @returns Promise resolving to an array of Subnet objects.
 */
const getAllSubnets = async (): Promise<Subnet[]> => {
  const { data, error } = await supabase.from("blockchains_lancer").select("*").order('id', { ascending: false }).eq('network', network);
  if (error) {
    console.error("Error fetching subnets:", error);
    return [];
  }
  return data as Subnet[];
};

/**
 * Handle changes in subnets.
 * @param subnets - The complete list of current subnets.
 */
const onChange = async (subnets: Subnet[]) => {
  console.log("Detected change in subnets");

  // Extract unique subnet IDs
  const uniqueSubnets = Array.from(new Set(subnets.map((subnet) => subnet.subnet_id)));

  // Initialize config with updated subnets
  const config: Config = {
    "track-subnets": uniqueSubnets.join(","),
    "public-ip": "",
    "http-host": "",
    "http-allowed-hosts": "",
  };

  // Read the existing config and include all existing attributes
  try {
    const existingConfigText = await Deno.readTextFile(CONFIG_PATH);
    const existingConfig: Config = JSON.parse(existingConfigText);
    console.log("Existing config:", existingConfig);
    config["public-ip"] = existingConfig["public-ip"];
    config["http-host"] = existingConfig["http-host"];
    config["http-allowed-hosts"] = existingConfig["http-allowed-hosts"];
    console.log("New config:", config);
  } catch (e) {
    // Handle the error if the file does not exist or is invalid
    console.error("Error reading existing config:", e);
  }

  // Overwrite the config at CONFIG_PATH
  try {
    await Deno.writeTextFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log("Configuration updated successfully.");
  } catch (e) {
    console.error("Error writing config file:", e);
    return;
  }

  // Ensure all the subnet VMs are in the plugins folder
  const vmIDs = subnets.map((subnet) => subnet.vm_id);
  let files: Deno.DirEntry[] = [];
  try {
    files = Array.from(Deno.readDirSync(PLUGINS_DIR));
  } catch (e) {
    console.error("Error reading plugins directory:", e);
    return;
  }

  for (const vmID of vmIDs) {
    const fileExists = files.some((file) => file.name === vmID);
    if (!fileExists) {
      try {
        await Deno.copyFile(SUBNET_EVM_SOURCE, `${PLUGINS_DIR}/${vmID}`);
        console.log(`Copied subnet-evm to ${PLUGINS_DIR}/${vmID}`);
      } catch (e) {
        console.error(`Error copying subnet-evm for VM ID ${vmID}:`, e);
      }
    }
  }

  // Remove any extra files in the plugins folder that are not in the current VM IDs
  for (const file of files) {
    if (!vmIDs.includes(file.name)) {
      try {
        await Deno.remove(`${PLUGINS_DIR}/${file.name}`);
        console.log(`Removed extra plugin: ${PLUGINS_DIR}/${file.name}`);
      } catch (e) {
        console.error(`Error removing plugin ${file.name}:`, e);
      }
    }
  }

  // List all Docker containers
  // @ts-ignore this works not gonna touch it
  let containers: Docker.ContainerInfo[];
  try {
    containers = await docker.containers.list();
    // console.log("Containers:", containers);
  } catch (e) {
    console.error("Error listing Docker containers:", e);
    return;
  }

  // Find the container with a name that includes "avalanche"
  const container = containers.find((container) =>
    container.Names?.some((name: string) => name.includes("avalanche"))
  );

  if (container) {
    try {
      await docker.containers.restart(container.Id!);
      console.log(`Restarted container ${container.Id}`);
    } catch (e) {
      console.error(`Error restarting container ${container.Id}:`, e);
    }
  } else {
    console.error("Container with name including 'avalanche' not found.");
  }
};

/**
 * Handle graceful shutdown by clearing the polling interval and exiting.
 * @param pollInterval - The interval ID to clear.
 */
const handleShutdown = (pollInterval: number) => {
  console.log("Received kill signal, unsubscribing and exiting...");
  clearInterval(pollInterval);
  Deno.exit();
};

// Add signal listeners for SIGINT and SIGTERM
const addShutdownListeners = (pollInterval: number) => {
  const signals: Deno.Signal[] = ["SIGINT", "SIGTERM"];
  for (const signal of signals) {
    Deno.addSignalListener(signal, () => handleShutdown(pollInterval));
  }
};

// Initialize previous subnets to detect changes
let previousSubnetIDs: Set<string> = new Set();

// Function to poll the database for changes
const pollDatabase = async () => {
  try {
    const subnets = await getAllSubnets();
    const currentSubnetIDs = new Set(subnets.map((subnet) => subnet.subnet_id));

    // Compare current subnet IDs with previous ones
    const isDifferent =
      currentSubnetIDs.size !== previousSubnetIDs.size ||
      [...currentSubnetIDs].some((id) => !previousSubnetIDs.has(id));

    if (isDifferent) {
      await onChange(subnets);
      previousSubnetIDs = currentSubnetIDs;
    }
  } catch (e) {
    console.error("Error during polling:", e);
  }
};

// Main Execution Flow
const main = async () => {
  // Fetch the initial list of subnets
  const initialSubnets = await getAllSubnets();
  previousSubnetIDs = new Set(initialSubnets.map((subnet) => subnet.subnet_id));

  console.log("Starting with", initialSubnets.length, "subnets.");
  // Run the initial onChange to set up the environment
  await onChange(initialSubnets);

  console.log("Polling started. Press Ctrl+C to exit.");

  // Start polling every second (1000 milliseconds)
  const pollInterval = setInterval(pollDatabase, 1000);

  // Add shutdown listeners
  addShutdownListeners(pollInterval);

  // Prevent the script from exiting
  await new Promise<void>(() => { });
};

// Execute the main function
await main();
