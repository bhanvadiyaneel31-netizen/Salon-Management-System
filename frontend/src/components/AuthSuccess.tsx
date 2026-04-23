import { useEffect } from "react";

export default function AuthSuccess() {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (token) {
            localStorage.setItem("token", token); // 🔥 STORE TOKEN
            window.location.href = "/"; // or dashboard
        } else {
            window.location.href = "/login";
        }
    }, []);

    return <div>Logging you in...</div>;
}