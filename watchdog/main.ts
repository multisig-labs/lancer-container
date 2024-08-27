import { Database } from './types.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1?target=deno';
import Docker from "https://deno.land/x/docker_deno@v0.3.3/mod.ts"
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceKey = Deno.env.get('SUPABASE_SERVICE_KEY');

const docker = new Docker("/var/run/docker.sock");

type Config = {
  "track-subnets": string;
  "public-ip": string;
  "http-host": string;
}

if (!supabaseUrl || !serviceKey) {
  throw new Error('Please provide SUPABASE_URL and SUPABASE_SERVICE_KEY');
}

const supabase = createClient<Database>(supabaseUrl, serviceKey);

const getAllSubnets = async () => {
  const { data, error } = await supabase.from('subnets').select('*');
  if (error) {
    throw error;
  }
  return data;
}

// deno-lint-ignore no-explicit-any
const onChange = async (_: any) => {
  console.log('Subnet inserted or deleted');
  const subnets = await getAllSubnets();
  const config = {
    'track-subnets': subnets.map((subnet) => subnet.subnet_id).join(',')
  } as Config;

  // read the existing config and include all existing attributes
  try {
    const decoder = new TextDecoder('utf-8');
    const data = await Deno.readFile('/avalanche/configs/node.json');
    const existingConfig: Config = JSON.parse(decoder.decode(data));
    console.log('Existing config:', existingConfig);
    config['public-ip'] = existingConfig['public-ip'];
    config['http-host'] = existingConfig['http-host'];
    console.log('New config:', config);
  } catch (e) {
    // ignore the error if the file does not exist
    console.error(e);
  }

  // overwrite the config at avalanche/config.json
  const encoder = new TextEncoder();
  await Deno.writeFile('/avalanche/configs/node.json', encoder.encode(JSON.stringify(config)));
  // make sure all the subnet VMs are in the plugins folder
  // if they are not, copy subnet-evm to their respective VM ID
  const vmIDs = subnets.map((subnet) => subnet.vm_id);
  // list all files in the plugins folder
  const files = Array.from(Deno.readDirSync('/avalanche/plugins'));
  for (const vmID of vmIDs) {
    // check if the file exists
    const file = files.find((file) => file.name === vmID);
    if (!file) {
      // copy the file
      Deno.copyFile('/avalanche/vms/subnet-evm', `/avalanche/plugins/${vmID}`);
    }
  }
  // now check to make sure there are no extra files in the plugins folder
  for (const file of files) {
    if (!vmIDs.includes(file.name)) {
      // delete the file
      Deno.remove(`/avalanche/plugins/${file.name}`);
    }
  }
  // list all containers
  const containers = await docker.containers.list();
  console.log('Containers:', containers);
  // find the container id with the name "avalanche"
  const container = containers.find((container) => container?.Names?.find((name) => name.includes('avalanche')));
  if (container) {
    // restart the container
    await docker.containers.restart(container.Id!);
  } else {
    console.error('Container not found');
  }
}

const changes = supabase
  .channel('table-db-changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'subnets',
  }, onChange)
  .on('postgres_changes', {
    event: 'DELETE',
    schema: 'public',
    table: 'subnets',
  }, onChange);

changes.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    console.log('Subscription to table changes is active');
  }
});

const handleSignal = () => {
  console.log(`Received kill signal, unsubscribing and exiting...`);
  changes.unsubscribe();
  Deno.exit();
};

// Add signal listeners for SIGINT and SIGTERM
Deno.addSignalListener("SIGINT", handleSignal);
Deno.addSignalListener("SIGTERM", handleSignal);

console.log("Press Ctrl+C to exit");

while (true) {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Keep the program running
}
