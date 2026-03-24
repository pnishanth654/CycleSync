export default async function handler(req, res) {
  try {
    // Vercel maps this to your Render URL you set in the Vercel Dashboard
    const backendUrl = process.env.VITE_API_URL;
    
    if (!backendUrl) {
      return res.status(400).json({ error: "VITE_API_URL is not set in Vercel." });
    }

    const response = await fetch(backendUrl);
    console.log("Pinged backend at:", backendUrl, "Response:", response.status);
    
    return res.status(200).json({ 
      success: true, 
      message: 'CycleSync backend forcefully kept awake!',
      status: response.status 
    });
  } catch (error) {
    console.error("Backend ping failed:", error);
    return res.status(500).json({ error: 'Failed to ping backend', details: error.message });
  }
}
