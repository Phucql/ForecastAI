export async function getTimeGPTForecast(data: { ds: string; y: number }[], h: number) {
    const response = await fetch('https://timegpt.nixtla.io/forecast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_TIMEGPT_API_KEY}`
      },
      body: JSON.stringify({ df: data, h })
    });
  
    const result = await response.json();
    return result;
  }
  