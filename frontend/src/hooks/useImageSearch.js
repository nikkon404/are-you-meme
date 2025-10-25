import { useCallback, useState } from "react";
import { searchImage } from "../api/client";

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
            setState((s) => ({
                ...s,
                bestMatchUrl: data.best_match,
                results: data.all_results || [],
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


