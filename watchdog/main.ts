import { Database } from './types.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1?target=deno';
import Docker from "https://deno.land/x/docker_deno@v0.3.3/mod.ts"
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceKey = Deno.env.get('SUPABASE_SERVICE_KEY');

const docker = new Docker("/var/run/docker.sock");

type Config = {
  "track-subnets": string;
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

const changes = supabase
  .channel('table-db-changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'subnets',
  }, async (_) => {
    const subnets = await getAllSubnets();
    const config = {
      'track-subnets': subnets.map((subnet) => subnet.subnet_id).join(',')
    } as Config;

    // overwrite the config at avalanche/config.json
    const encoder = new TextEncoder();
    await Deno.writeFile('./avalanche/config.json', encoder.encode(JSON.stringify(config)));
    // make sure all the subnet VMs are in the plugins folder
    // if they are not, copy srEXiWaHuhNyGwPUi444Tu47ZEDwxTWrbQiuD7FmgSAQ6X7Dy to their respective VM ID
    const vmIDs = subnets.map((subnet) => subnet.vm_id);
    // list all files in the plugins folder
    const files = Array.from(Deno.readDirSync('./avalanche/plugins'));
    for (const vmID of vmIDs) {
      // check if the file exists
      const file = files.find((file) => file.name === vmID);
      if (!file) {
        // copy the file
        Deno.copyFile('./avalanche/plugins/srEXiWaHuhNyGwPUi444Tu47ZEDwxTWrbQiuD7FmgSAQ6X7Dy', `./avalanche/plugins/${vmID}`);
      }
    }
    // list all containers
    const containers = await docker.containers.list();
    // find the container id with the name "avalanche"
    const container = containers.find((container) => container?.Names?.includes('/avalanche'));
    if (container) {
      // restart the container
      await docker.containers.restart(container.Id!);
    }
  });

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
