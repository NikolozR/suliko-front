'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentTestPage() {
  const searchParams = useSearchParams();
  const [response, setResponse] = useState(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runCallback = async () => {
      try {
        const queryString = searchParams.toString();
        console.log(queryString)
        const res = await fetch(
          `https://content.api24.ge/api/Payment/callback?${queryString}`,
          { method: 'GET' }
        );

        const data = await res.json();
        setResponse(data);
      } catch (err) {
        setError(`Callback execution failed = ${err}`);
      }
    };

    if (searchParams.toString()) {
      runCallback();
    }
  }, [searchParams]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Payment Callback Test</h1>

      <h3>Query Params</h3>
      <pre>{searchParams.toString()}</pre>

      <h3>API Response</h3>
      <pre>{JSON.stringify(response, null, 2)}</pre>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
