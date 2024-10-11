// Import necessary modules and types
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1?target=deno";
import Docker from "https://deno.land/x/docker_deno@v0.3.3/mod.ts";
import type { ListContainerResponse } from "https://deno.land/x/docker_deno@v0.3.3/lib/types/container/list.ts";

import type { Database } from "./types.ts";
import { getValue } from "./kv.ts"; // Import the getValue function

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_KEY");

// Docker Socket Path
const DOCKER_SOCKET_PATH = "/var/run/docker.sock";

const docker = new Docker(DOCKER_SOCKET_PATH);

// Define the Subnet type based on your database schema
type Subnet = {
  subnet_id: string;
  vm_id: string;
};

if (!supabaseUrl || !serviceKey) {
  throw new Error("Please provide SUPABASE_URL and SUPABASE_SERVICE_KEY");
}

const supabase = createClient<Database>(supabaseUrl, serviceKey);

type Config = {
  "track-subnets": string;
  "public-ip": string;
  "http-host": string;
  "http-allowed-hosts": string;
};

// Node configurations
interface NodeConfig {
  name: string;
  CONFIG_PATH: string;
  PLUGINS_DIR: string;
  SUBNET_EVM_SOURCE: string;
  healthEndpoint: string;
  containerNameIncludes: string;
}

// Configuration for Avalanche node
const avalancheNode: NodeConfig = {
  name: "avalanche",
  CONFIG_PATH: "/avalanche/configs/node.json",
  PLUGINS_DIR: "/avalanche/plugins",
  SUBNET_EVM_SOURCE: "/avalanche/vms/subnet-evm",
  healthEndpoint: "http://avalanche:9650/ext/health",
  containerNameIncludes: "avalanche",
};

// Configuration for Bvalanche node
const bvalancheNode: NodeConfig = {
  name: "bvalanche",
  CONFIG_PATH: "/bvalanche/configs/node.json",
  PLUGINS_DIR: "/bvalanche/plugins",
  SUBNET_EVM_SOURCE: "/bvalanche/vms/subnet-evm",
  healthEndpoint: "http://bvalanche:9660/ext/health", // Assuming different port
  containerNameIncludes: "bvalanche",
};

const nodes: Record<string, NodeConfig> = {
  "NodeID-86ej2PyNFbJafTCSozj7PqLdWrAcSZJbz": avalancheNode,
  "NodeID-5y7BkMmKYTdaNR6tumjTmXcEuqTLaSjqK": bvalancheNode,
};

/**
 * Fetch all subnets from the database.
 * @returns Promise resolving to an array of Subnet objects.
 */
const getAllSubnets = async (): Promise<Subnet[]> => {
  const { data, error } = await supabase.from("blockchains_lancer").select("*").order("id", { ascending: false });
  if (error) {
    console.error("Error fetching subnets:", error);
    return [];
  }
  return data as Subnet[];
};

/**
 * Update node configuration and plugins, and restart the node's container.
 * @param node - The node configuration.
 * @param subnets - The complete list of current subnets.
 */
const updateNode = async (node: NodeConfig, subnets: Subnet[]): Promise<void> => {
  try {
    await updateNodeConfig(node, subnets);
    await updatePlugins(node, subnets);
    await restartNodeContainer(node);
  } catch (e) {
    console.error(`[${node.name}] Error updating node:`, e);
    throw e;
  }
};

/**
 * Update the node's configuration file.
 * @param node - The node configuration.
 * @param subnets - The list of subnets.
 */
const updateNodeConfig = async (node: NodeConfig, subnets: Subnet[]): Promise<void> => {
  // Extract unique subnet IDs
  const uniqueSubnets = Array.from(new Set(subnets.map((subnet) => subnet.subnet_id)));

  // Initialize config with updated subnets
  const config: Config = {
    "track-subnets": uniqueSubnets.join(","),
    "public-ip": "",
    "http-host": "",
    "http-allowed-hosts": "",
  };

  // Read the existing config and preserve other attributes
  try {
    const existingConfigText = await Deno.readTextFile(node.CONFIG_PATH);
    const existingConfig: Config = JSON.parse(existingConfigText);
    console.log(`[${node.name}] Existing config:`, existingConfig);
    config["public-ip"] = existingConfig["public-ip"];
    config["http-host"] = existingConfig["http-host"];
    config["http-allowed-hosts"] = existingConfig["http-allowed-hosts"];
    console.log(`[${node.name}] New config:`, config);
  } catch (e) {
    console.error(`[${node.name}] Error reading existing config:`, e);
  }

  // Overwrite the config at CONFIG_PATH
  try {
    await Deno.writeTextFile(node.CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(`[${node.name}] Configuration updated successfully.`);
  } catch (e) {
    console.error(`[${node.name}] Error writing config file:`, e);
    throw e;
  }
};

/**
 * Update the plugins directory for the node.
 * @param node - The node configuration.
 * @param subnets - The list of subnets.
 */
const updatePlugins = async (node: NodeConfig, subnets: Subnet[]): Promise<void> => {
  const vmIDs = subnets.map((subnet) => subnet.vm_id);
  let files: Deno.DirEntry[] = [];
  try {
    files = Array.from(Deno.readDirSync(node.PLUGINS_DIR));
  } catch (e) {
    console.error(`[${node.name}] Error reading plugins directory:`, e);
    throw e;
  }

  // Ensure all required VM plugins are present
  for (const vmID of vmIDs) {
    const fileExists = files.some((file) => file.name === vmID);
    if (!fileExists) {
      try {
        await Deno.copyFile(node.SUBNET_EVM_SOURCE, `${node.PLUGINS_DIR}/${vmID}`);
        console.log(`[${node.name}] Copied subnet-evm to ${node.PLUGINS_DIR}/${vmID}`);
      } catch (e) {
        console.error(`[${node.name}] Error copying subnet-evm for VM ID ${vmID}:`, e);
      }
    }
  }

  // Remove any extra files in the plugins folder that are not in the current VM IDs
  for (const file of files) {
    if (!vmIDs.includes(file.name)) {
      try {
        await Deno.remove(`${node.PLUGINS_DIR}/${file.name}`);
        console.log(`[${node.name}] Removed extra plugin: ${node.PLUGINS_DIR}/${file.name}`);
      } catch (e) {
        console.error(`[${node.name}] Error removing plugin ${file.name}:`, e);
      }
    }
  }
};

/**
 * Restart the node's Docker container.
 * @param node - The node configuration.
 */
const restartNodeContainer = async (node: NodeConfig): Promise<void> => {
  let containers: ListContainerResponse[];
  try {
    containers = await docker.containers.list();
  } catch (e) {
    console.error(`[${node.name}] Error listing Docker containers:`, e);
    throw e;
  }

  // Find the container with a name that includes node.containerNameIncludes
  const container = containers.find((container) =>
    container.Names?.some((name: string) => name.includes(node.containerNameIncludes))
  );

  if (container) {
    try {
      await docker.containers.restart(container.Id!);
      console.log(`[${node.name}] Restarted container ${container.Id}`);
    } catch (e) {
      console.error(`[${node.name}] Error restarting container ${container.Id}:`, e);
      throw e;
    }
  } else {
    console.error(`[${node.name}] Container with name including '${node.containerNameIncludes}' not found.`);
    throw new Error(`Container with name including '${node.containerNameIncludes}' not found.`);
  }
};

/**
 * Wait until the node's health endpoint returns healthy status.
 * @param node - The node configuration.
 */
const waitUntilNodeHealthy = async (node: NodeConfig): Promise<void> => {
  const maxRetries = 60; // Maximum number of retries (adjust as needed)
  const retryInterval = 1000; // Retry every 1 second

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(node.healthEndpoint);
      if (response.ok) {
        const data = await response.json();
        if (data.healthy) {
          console.log(`[${node.name}] Node is healthy.`);
          return;
        } else {
          console.log(`[${node.name}] Node is not healthy yet. Waiting...`);
        }
      } else {
        console.log(`[${node.name}] Health endpoint returned status ${response.status}`);
      }
    } catch (e) {
      console.log(`[${node.name}] Error checking health endpoint:`, e);
    }
    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, retryInterval));
  }
  // If we reach here, the node did not become healthy in time
  throw new Error(`[${node.name}] Node did not become healthy after ${maxRetries} attempts.`);
};

/**
 * Handle changes in subnets.
 * @param subnets - The complete list of current subnets.
 * @param lastNodeId - The Node ID of the last node added.
 */
const onChange = async (subnets: Subnet[], lastNodeId: string) => {
  console.log("Detected change in subnets");

  // Get the NodeConfig for the last node added
  const lastNode = nodes[lastNodeId];
  if (!lastNode) {
    console.error(`Node with ID '${lastNodeId}' not found in nodes object.`);
    return;
  }

  // Get the other node
  const otherNodeId = Object.keys(nodes).find((id) => id !== lastNodeId);
  const otherNode = otherNodeId ? nodes[otherNodeId] : null;
  if (!otherNode) {
    console.error("Could not determine the other node.");
    return;
  }

  // Update and restart the last node added first
  try {
    await updateNode(lastNode, subnets);
  } catch (e) {
    console.error(`[${lastNode.name}] Failed to update node:`, e);
    return; // Exit if the first node update fails
  }

  // Wait until the last node reports healthy
  try {
    await waitUntilNodeHealthy(lastNode);
  } catch (e) {
    console.error(`[${lastNode.name}] Node did not become healthy:`, e);
    return; // Exit if the node does not become healthy
  }

  // Update and restart the other node
  try {
    await updateNode(otherNode, subnets);
  } catch (e) {
    console.error(`[${otherNode.name}] Failed to update node:`, e);
    return;
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
const pollDatabase = async (lastNodeId: string) => {
  try {
    const subnets = await getAllSubnets();
    const currentSubnetIDs = new Set(subnets.map((subnet) => subnet.subnet_id));

    // Compare current subnet IDs with previous ones
    const isDifferent =
      currentSubnetIDs.size !== previousSubnetIDs.size ||
      [...currentSubnetIDs].some((id) => !previousSubnetIDs.has(id));

    if (isDifferent) {
      await onChange(subnets, lastNodeId);
      previousSubnetIDs = currentSubnetIDs;
    }
  } catch (e) {
    console.error("Error during polling:", e);
  }
};

// Main Execution Flow
const main = async () => {
  // Retrieve the last node ID from the KV store
  const lastNodeId = await getValue("lastNodeAdded");
  if (!lastNodeId) {
    console.error("Could not retrieve last node ID from KV store.");
    return;
  }
  console.log(`Last node added: ${lastNodeId}`);

  // Fetch the initial list of subnets
  const initialSubnets = await getAllSubnets();
  previousSubnetIDs = new Set(initialSubnets.map((subnet) => subnet.subnet_id));

  console.log("Starting with", initialSubnets.length, "subnets.");
  // Run the initial onChange to set up the environment
  await onChange(initialSubnets, lastNodeId);

  console.log("Polling started. Press Ctrl+C to exit.");

  // Start polling every second (1000 milliseconds)
  const pollInterval = setInterval(() => pollDatabase(lastNodeId), 1000);

  // Add shutdown listeners
  addShutdownListeners(pollInterval);

  // Prevent the script from exiting
  await new Promise<void>(() => { });
};

// Execute the main function
await main();
