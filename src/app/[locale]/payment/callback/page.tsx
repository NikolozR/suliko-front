'use client';
import { useEffect, useState } from 'react';

export default function PaymentTestPage() {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleFormSubmit = async (data: FormData) => {
      try {
        // Convert FormData to object
        const formObject: Record<string, string> = {};
        data.forEach((value, key) => {
          formObject[key] = value.toString();
        });
        
        setFormData(formObject);

        // Convert FormData to query string
        const queryString = new URLSearchParams(formObject).toString();
        console.log(queryString);

        const res = await fetch(
          `https://content.api24.ge/api/Payment/callback?${queryString}`,
          { method: 'GET' }
        );
        const apiData = await res.json();
        setResponse(apiData);
      } catch (err) {
        setError(`Callback execution failed = ${err}`);
      }
    };

    // Listen for form submission
    const handleSubmit = (e: Event) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const data = new FormData(form);
      handleFormSubmit(data);
    };

    const form = document.getElementById('paymentForm') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', handleSubmit);
      return () => form.removeEventListener('submit', handleSubmit);
    }
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Payment Callback Test</h1>
      
      <form id="paymentForm">
        <div style={{ marginBottom: 12 }}>
          <label>Transaction ID:</label>
          <input type="text" name="transactionId" required />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Status:</label>
          <input type="text" name="status" required />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Amount:</label>
          <input type="text" name="amount" required />
        </div>
        <button type="submit">Submit Payment</button>
      </form>

      <h3>Form Data</h3>
      <pre>{JSON.stringify(formData, null, 2)}</pre>

      <h3>API Response</h3>
      <pre>{JSON.stringify(response, null, 2)}</pre>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}