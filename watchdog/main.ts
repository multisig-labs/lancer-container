import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1?target=deno';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceKey = Deno.env.get('SUPABASE_SERVICE_KEY');

if (!supabaseUrl || !serviceKey) {
  throw new Error('Please provide SUPABASE_URL and SUPABASE_SERVICE_KEY');
}

const supabase = createClient(supabaseUrl, serviceKey);

const changes = supabase
  .channel('table-db-changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'subnets',
  }, (payload) => {
    console.log('Change received:', payload);
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
