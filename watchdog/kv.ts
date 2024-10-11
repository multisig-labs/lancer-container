// Function to get a value from Vercel KV
export async function getValue(key: string): Promise<string | null> {
  // Retrieve environment variables
  const kvUrl = Deno.env.get("KV_REST_API_URL");
  const kvToken = Deno.env.get("KV_REST_API_TOKEN");

  // Check if environment variables are set
  if (!kvUrl || !kvToken) {
    console.error(
      "Environment variables KV_REST_API_URL or KV_REST_API_TOKEN are not set."
    );
    return null;
  }

  // Construct the request URL
  const url = `${kvUrl}/get/${encodeURIComponent(key)}`;

  // Perform the fetch request
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${kvToken}`,
    },
  });

  // Handle non-OK responses
  if (!response.ok) {
    console.error(
      `Failed to get value for key "${key}": ${response.status} ${response.statusText}`
    );
    return null;
  }

  // Parse the JSON response
  const data = await response.json();

  // Extract and return the result
  return data.result;
}
