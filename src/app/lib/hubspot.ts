// lib/hubspot.ts
const HUBSPOT_TOKEN = process.env.HUBSPOT_API_KEY!;
const API_BASE = 'https://api.hubapi.com';

export async function findDealByEmailAndProject(email: string, proyecto: string) {
  const res = await fetch(`${API_BASE}/crm/v3/objects/deals/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filterGroups: [{
        filters: [
          { propertyName: 'email', operator: 'EQ', value: email },
          { propertyName: 'dealname', operator: 'EQ', value: proyecto }
        ]
      }],
      properties: ['dealname', 'email', 'nombre_del_proyecto']
    }),
  });

  const data = await res.json();
  return data.results?.[0] || null;
}

export async function createOrUpdateDeal(cotizacion: any) {
  const existingDeal = await findDealByEmailAndProject(cotizacion.correo, cotizacion.nombreProyecto);

  // Cotizaciones propiedades
  const payload = {
    properties: {
      dealname: cotizacion.nombreProyecto,
      email: cotizacion.correo,
      monto: cotizacion.valor,
      etapa: cotizacion.estado,
      fecha_cotizacion: cotizacion.fecha
      // Agrega más campos según los disponibles
    }
  };

  if (existingDeal) {
    await fetch(`${API_BASE}/crm/v3/objects/deals/${existingDeal.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } 
//   else {
//     await fetch(`${API_BASE}/crm/v3/objects/deals`, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(payload),
//     });
//   }
}
