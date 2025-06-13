// lib/hubspot.ts
const HUBSPOT_TOKEN = process.env.HUBSPOT_API_KEY!;
const API_BASE = 'https://api.hubapi.com';

async function getContactByEmail(email: string) {
  const res = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'EQ',
              value: email,
            },
          ],
        },
      ],
      properties: ['email'],
    }),
  });

  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;
  return data.results[0]; // contiene el ID y más info
}

async function getDealsByContactId(contactId: string) {
  const res = await fetch(
    `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/deals`,
    {
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await res.json();
  return data.results || [];
}

async function getDealById(dealId: string) {
  const res = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=negocio_lista_de_proyectos_y_etapa`, {
    headers: {
      'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
    },
  });

  return res.json();
}

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
          { propertyName: 'negocio_lista_de_proyectos_y_etapa', operator: 'EQ', value: proyecto }
        ]
      }],
      properties: ['dealname', 'email', 'nombre_del_proyecto']
    }),
  });

  const data = await res.json();
  return data.results?.[0] || null;
}

export async function createOrUpdateDeal(cotizacion: any) {
  const contact = await getContactByEmail('it@focuxdigital.com');
  if (!contact) throw new Error('Contacto no encontrado');

  const contactId = contact.id;
  const deals = await getDealsByContactId(contactId);

  for (const d of deals) {
    const dealData = await getDealById(d.id);
    console.log('delas', dealData.properties);
    if (dealData.properties?.negocio_lista_de_proyectos_y_etapa === 'Campura Etapa 3 Torre 2') {
      // Ya existe el negocio, puedes actualizarlo aquí si lo deseas
      console.log('Negocio ya existe con esa etapa y contacto', dealData.properties);
      return;
    }
  }
  // const existingDeal = await findDealByEmailAndProject(cotizacion['Cliente potencial (Correo)'], cotizacion['Proyecto(Nombre)']);
  // const existingDeal = await findDealByEmailAndProject('it@focuxdigital.com', 'Campura Etapa 3 Torre 2');
  
  // Cotizaciones propiedades
  // const payload = {
  //   properties: {
  //     dealname: cotizacion.nombreProyecto,
  //     email: cotizacion.correo,
  //     monto: cotizacion.valor,
  //     etapa: cotizacion.estado,
  //     fecha_cotizacion: cotizacion.fecha
  //     // Agrega más campos según los disponibles
  //   }
  // };

  // if (existingDeal) {
  //   await fetch(`${API_BASE}/crm/v3/objects/deals/${existingDeal.id}`, {
  //     method: 'PATCH',
  //     headers: {
  //       'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify(payload),
  //   });
  // } 
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
