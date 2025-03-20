export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get("url");
    const tool = url.searchParams.get("tool");

    if (!imageUrl || !tool) {
      return new Response("Missing required parameters: url and tool", { status: 400 });
    }

    const apiEndpoints = {
      removebg: "https://api.remove.bg/v1.0/removebg",
      enhance: "https://api.deepai.org/api/torch-srgan",
      upscale: "https://api.deepai.org/api/waifu2x",
      restore: "https://api.deepai.org/api/image-editor",
      colorize: "https://api.deepai.org/api/colorizer"
    };

    const apiKey = {
      removebg: env.REMOVEBG_API_KEY,
      deepai: env.DEEPAI_API_KEY
    };

    if (!apiEndpoints[tool]) {
      return new Response("Invalid tool specified", { status: 400 });
    }

    try {
      let apiUrl = apiEndpoints[tool];
      let headers = {};
      let body = new URLSearchParams();

      if (tool === "removebg") {
        headers["X-Api-Key"] = apiKey.removebg;
        body.append("image_url", imageUrl);
      } else {
        headers["api-key"] = apiKey.deepai;
        body.append("image", imageUrl);
      }

      const apiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: headers,
        body: body
      });

      if (!apiResponse.ok) {
        throw new Error("Failed to process image");
      }

      const jsonResponse = await apiResponse.json();
      const resultUrl = jsonResponse.output_url || jsonResponse.data?.output_url;

      if (!resultUrl) {
        throw new Error("No output received");
      }

      const finalImageResponse = await fetch(resultUrl);
      return new Response(finalImageResponse.body, {
        headers: { "Content-Type": finalImageResponse.headers.get("Content-Type") }
      });

    } catch (error) {
      return new Response(`Error processing request: ${error.message}`, { status: 500 });
    }
  }
};
