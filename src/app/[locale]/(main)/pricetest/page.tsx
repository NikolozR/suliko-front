"use client";

import { useEffect, useState } from "react";

export default function PriceTestPage() {
    const [choice, setChoice] = useState<string | null>('paysera');
    useEffect(() => {
        localStorage.setItem("paymentChoice", "paysera");
    }, [])
    return <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Price Test Page</h1>
        <p>This page is for testing pricing and payment flows.</p>
        <p>Current payment choice: {choice}</p>
        <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => { setChoice('paysera'); localStorage.setItem("paymentChoice", "paysera"); }}
        >
            Set Paysera
        </button>
        <button
            className="mt-4 ml-4 px-4 py-2 bg-green-500 text-white rounded"
            onClick={() => { setChoice('flitt'); localStorage.setItem("paymentChoice", "flitt"); }}
        >
            Set Flitt
        </button>
    </div>;
}

