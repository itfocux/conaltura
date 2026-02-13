// lib/sinco.ts

const AUTH_URL = 'https://site.conaltura.com/api/login/usuario';
const COTIZACIONES_URL = 'https://site.conaltura.com/api/consultas/crm/cotizaciones_hs';
const VENTAS_URL = 'https://site.conaltura.com/api/consultas/crm/ventas_hs';


const CONALTURA_USERNAME = process.env.CONALTURA_USERNAME!;
// const CONALTURA_PASSWORD = process.env.CONALTURA_PASSWORD!;
const CONALTURA_PASSWORD = process.env.CONALTURA_PASSWORD;

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

/** Obtener ventas con token */
export async function getVentas(): Promise<any[]> {
  const token = await getAccessToken();
  const res = await fetch(VENTAS_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al obtener ventas desde Conaltura');
  return res.json();
}
