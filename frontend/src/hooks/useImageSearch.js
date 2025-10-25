import { useCallback, useState } from "react";
import { searchImage, fetchImageWithAuth } from "../api/client";

export default function useImageSearch() {
    const [state, setState] = useState({
        uploadedUrl: null,
        bestMatchUrl: null,
        results: [],
        loading: false,
        error: null,
    });

    const doSearch = useCallback(async (blob) => {
        const localUrl = URL.createObjectURL(blob);
        setState((s) => ({ ...s, uploadedUrl: localUrl, loading: true, error: null }));
        try {
            const data = await searchImage(blob, 5);

            // Fetch all images with auth and convert to blob URLs
            const resultsWithBlobUrls = await Promise.all(
                (data.results || []).map(async (result) => ({
                    ...result,
                    image_url: await fetchImageWithAuth(result.image_url),
                }))
            );

            // Best match is the first result (highest score)
            const bestMatchBlobUrl = resultsWithBlobUrls.length > 0 ? resultsWithBlobUrls[0].image_url : null;

            setState((s) => ({
                ...s,
                bestMatchUrl: bestMatchBlobUrl,
                results: resultsWithBlobUrls,
                loading: false,
            }));
        } catch (e) {
            setState((s) => ({ ...s, loading: false, error: e.message || String(e) }));
        }
    }, []);

    const reset = useCallback(() => {
        setState({ uploadedUrl: null, bestMatchUrl: null, results: [], loading: false, error: null });
    }, []);

    const clearError = useCallback(() => {
        setState((s) => ({ ...s, error: null }));
    }, []);

    return { ...state, doSearch, reset, clearError };
}


