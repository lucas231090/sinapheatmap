import { useState } from "react";
import api from "@/services/api";

export const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = async (method, url, data = null) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api[method](url, data);
            setLoading(false);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || "Ocorreu um erro na requisição");
            setLoading(false);
            throw err;
        }
    };

    return {
        loading,
        error,
        get: (url) => request("get", url),
        post: (url, data) => request("post", url, data),
        put: (url, data) => request("put", url, data),
        delete: (url) => request("delete", url),
    };
};