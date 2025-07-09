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
  const res = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=lista_proyectos_negocios_sinco`, {
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

async function updateDealById(dealId: string, updateData: any) {
  const res = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${parseInt(dealId)}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        fecha_de_creacion_cotizacion: updateData['Fecha de creación'], // ejemplo de propiedad
        idunidad: updateData.IDUnidad || 0,
        area_construida: updateData['Área construida'] || 0,
        area_privada: updateData['Área privada'] || 0,
        balcon: updateData['Balcón'] || 0,
        id_de_cotizacion: updateData['Id. de cotización'],
        proyecto_codigo_: updateData['Proyecto(codigo)'],
        lote: updateData['Lote'] || 0,
        terraza: updateData['Terraza'] || 0,
        unidad: updateData['Unidad'] || '',
        idvisitante: updateData['IdVisitante'] || 0,
        agrupacion: updateData['Agrupación'] || 0,
        valor_cotizacion: updateData['VrCotiza'],
        amount: updateData['VrCotiza']
      },
    }),
  });

  const data = await res.json();
  return data;
}


export async function createOrUpdateDeal(cotizacion: any) {
  // const contact = await getContactByEmail(cotizacion['Cliente potencial (Correo)']);
  const contact = await getContactByEmail('it@focuxdigital.com');

  if (contact) {
    const contactId = contact.id;
    const deals = await getDealsByContactId(contactId);

    if(deals.length > 0) {
      for (const d of deals) {
        const dealData = await getDealById(d.id);
        // cotizacion['Proyecto(Nombre)']
        if (dealData.properties?.lista_proyectos_negocios_sinco === '182-VENTAS PALMA ETAPA 2') {
          // Crear propiedades de negocio en hubspot
          updateDealById(dealData.properties.hs_object_id, cotizacion);
        }
      }
    }
  }
}
