export class ARService {
    apiKey;
    baseUrl = 'https://us-central1-geo-ar-services.cloudfunctions.net/ar';
    constructor() {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.warn('Google Maps API key is not configured, some features may be limited');
            this.apiKey = '';
        }
        else {
            this.apiKey = apiKey;
        }
    }
    async getARExperience(location) {
        try {
            const response = await fetch(`${this.baseUrl}/experiences`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
                },
                body: JSON.stringify({
                    location,
                    radius: 100 // meters
                })
            });
            if (!response.ok) {
                throw new Error(`AR API error: ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Failed to fetch AR experience:', error);
            throw error;
        }
    }
    async createARAnchor(asset) {
        try {
            const response = await fetch(`${this.baseUrl}/anchors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
                },
                body: JSON.stringify(asset)
            });
            if (!response.ok) {
                throw new Error(`Failed to create AR anchor: ${response.statusText}`);
            }
            const result = await response.json();
            return result.anchorId;
        }
        catch (error) {
            console.error('Failed to create AR anchor:', error);
            throw error;
        }
    }
    generateCloudAnchorHTML(anchorId) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AR Experience</title>
          <script src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
        </head>
        <body>
          <model-viewer
            id="ar-model"
            camera-controls
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="auto"
            src="https://storage.googleapis.com/ar-assets/${anchorId}"
            ios-src="https://storage.googleapis.com/ar-assets/${anchorId}.usdz"
            alt="3D AR Model"
            data-anchor-id="${anchorId}">
          </model-viewer>
        </body>
      </html>
    `;
    }
}
