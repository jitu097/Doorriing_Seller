const axios = require('axios');

/**
 * Fetch a related image from Unsplash
 * @param {string} query The search query (e.g., category name)
 * @returns {Promise<string|null>} The image URL or null if fallback occurs
 */
async function fetchImageFromUnsplash(query) {
    try {
        if (!process.env.UNSPLASH_ACCESS_KEY) {
            console.warn('UNSPLASH_ACCESS_KEY is not configured. Falling back to null.');
            return null;
        }

        const response = await axios.get('https://api.unsplash.com/search/photos', {
            params: {
                query: query,
                per_page: 1,
            },
            headers: {
                Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
            },
            timeout: 5000, // 5 seconds timeout
        });

        const imageUrl = response.data.results?.[0]?.urls?.regular;

        if (imageUrl) {
            return imageUrl;
        } else {
            // Fallback placeholder
            const fallback = "https://via.placeholder.com/400x400?text=" + encodeURIComponent(query);
            return fallback;
        }
    } catch (error) {
        console.error('Error fetching image from Unsplash:', error.message);
        // Do not crash, fall back to null
        return null;
    }
}

module.exports = {
    fetchImageFromUnsplash,
};
