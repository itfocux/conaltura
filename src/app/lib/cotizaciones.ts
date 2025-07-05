// lib/sinco.ts

const AUTH_URL = 'https://site.conaltura.com/api/login/usuario';
const COTIZACIONES_URL = 'https://site.conaltura.com/api/consultas/crm/cotizaciones_hs';

const CONALTURA_USERNAME = process.env.CONALTURA_USERNAME!;
// const CONALTURA_PASSWORD = process.env.CONALTURA_PASSWORD!;
const CONALTURA_PASSWORD = 'F5B6E135-C929-4455-8CD8-22C377DFC379-$ur51496-ZSRR5RWr/mzQSkl+7m/g9HeiMt2s5JhrYv06ezB/1rXinYpZLchHL/5HtTWE3yPGSK1AiBE25GyNNMOtVKntc1yiqcK7ex9REtoheod+RrnGkZUwhOSaoIgz7HU+cO27VOnx7ZmEf/63RDJA6M-118CF31E-3898-4E2A-9F49-315AA985B8EF';
console.log('credenciales', CONALTURA_USERNAME, CONALTURA_PASSWORD);

/** Obtener access_token de conaltura */
async function getAccessToken(): Promise<string> {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Username: CONALTURA_USERNAME, Password: CONALTURA_PASSWORD }),
  });

  if (!res) throw new Error('Error al autenticar en conaltura');
  const data = await res.json();
  return data;
}

/** Obtener cotizaciones con token */
export async function getCotizaciones(): Promise<any[]> {
  const token = await getAccessToken();
  const res = await fetch(COTIZACIONES_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al obtener cotizaciones desde Conaltura');
  return res.json();
}
