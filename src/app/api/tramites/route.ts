// app/api/sinco/route.ts
import { NextResponse } from 'next/server';

const SINCO_AUTH_URL = 'https://pruebas3.sincoerp.com/SincoInmCarbone_Nueva_PRBINT/V3/API/Auth/Usuario' as any;
const SINCO_VISIT_URL = process.env.SINCO_VISIT_URL as any;
const SINCO_VISIT_UPDATE_URL = process.env.SINCO_VISIT_UPDATE_URL as any;
const HUBSPOT_API_URL = "https://api.hubapi.com";
const HUBSPOT_TOKEN = process.env.HUBSPOT_API_KEY!;
const SINCO_BASE_URL = 'https://pruebas3.sincoerp.com/SincoInmCarbone_Nueva_PRBINT/V3/CBRClientes/API/Ventas/NumeroIdentificacion'
const HUBSPOT_BASE_URL_DEALS = "https://api.hubapi.com/crm/v3/objects/deals";
const tramitesEndpoint = 'https://api.hubapi.com/crm/v3/objects/deals/';

// Helper function to get Sinco access token
async function getSincoAccessToken() {
  const NomUsuario = process.env.SINCO_USERNAME;
  const ClaveUsuario = process.env.SINCO_PASSWORD

  if (!NomUsuario || !ClaveUsuario) {
    throw new Error('Faltan las credenciales Sinco API');
  }

  const authRes = await fetch(SINCO_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ NomUsuario, ClaveUsuario }),
  });

  // if (!authRes.ok) {
  //   const error = await authRes.text();
  //   throw new Error(`Auth error sinco: ${error}`);
  // }

  const authData = await authRes.json();
  const accessToken = authData.access_token;

  if (!accessToken) {
    throw new Error('No access token recibido');
  }

  return accessToken;
}

async function fetchContacts(after?: string) {
  const res = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/contacts/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "negocio",
              operator: "EQ",
              value: "TRUE",
            },
          ],
        },
      ],
      properties: ["numero_de_documento", "email", "firstname", "lastname"],
      limit: 100,
      after, // pagination cursor
    }),
  });

  if (!res.ok) {
    throw new Error(`HubSpot API error: ${res.status}`);
  }

  return res.json();
}

async function fetchDealDocuments(after?: string) {
  const res = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/deals/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      "Content-Type": "application/json",
    },
      body: JSON.stringify({
    filterGroups: [
      {
        filters: [
          {
            propertyName: "documento_comprador_1",
            operator: "HAS_PROPERTY"
          }
        ]
      }
    ],
    properties: [
      "documento_comprador_1",
      "dealname",
      "amount"
    ],
    limit: 100,
    after
  }),
  });

  if (!res.ok) {
    throw new Error(`HubSpot API error: ${res.status}`);
  }

  return res.json();
}

// GET method - Sync contacts with "cotizacion pedida" status from HubSpot to Sinco
export async function GET() {
    if (!HUBSPOT_TOKEN) {
      return NextResponse.json({ message: 'HUBSPOT_TOKEN is required' }, { status: 400 });
    }

    try {
        let allContacts: any[] = [];
        let after: string | undefined = undefined;

        // Consulta documentos negocios 
        do {
            const data = await fetchDealDocuments(after);
            allContacts = [...allContacts, ...(data.results || [])];
            after = data.paging?.next?.after;
        } while (after);

        // Extrae el numero de identificacion
        const identificationNumbers = allContacts.map((c) => ({
            id: c.id,
            numero_de_documento: c.properties?.documento_comprador_1 || null,
        }));

        // Sinco access token
        const accessToken = await getSincoAccessToken();
        console.log('identificationNumbers', identificationNumbers)

        // Consulta negocios por numero de identificacion en sinco
        const results = await Promise.all(
            identificationNumbers.map(async (contact) => {
                const url = `${SINCO_BASE_URL}/${contact.numero_de_documento}`;

                const res = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                         "Authorization": `Bearer ${accessToken}`,
                    },
                });

                if (!res.ok) {
                    return {
                        id: contact.id,
                        numero_de_documento: contact.numero_de_documento,
                        error: `Failed with status ${res.status}`,
                    };
                }

                const data = await res.json();

                const sincoData = data.agrupacionesComprador.map((agrupacion: any) => {
                    return {
                        tramites: agrupacion.tramitesAgrupacion,
                        idHubspot: agrupacion.idHusbpot
                    }
                })

                // const sincoData = data.agrupacionesComprador

                return {
                    id: contact.id,
                    numero_de_documento: contact.numero_de_documento,
                    sincoData, // response from Sinco
                };
            })
         );

        // Envia tramites a a negocio en hubspot
        const updates = await Promise.all(
            results.map(async (contact) => {
                const sinco = contact.sincoData?.[0];
                if (!sinco || !sinco.idHubspot) {
                    return { contactId: contact.id, skipped: true };
                }
                console.log('sincoData', sinco)
                // Build properties object from tramites
                const properties: any = {};
                const propertiesTramite: any = {};
                const tramitesUpdate = await Promise.all(
                  sinco.tramites.map(async(tramite: any) => {
                    // if(tramite.fechaCumplimiento){
                    //     const propertyName = `tramite_${tramite.codigo.toLowerCase()}`;
                    //     properties[propertyName] = 'TRUE';
                    // }
                    // const propertiesTramite = {
                    //   nombre: tramite.nombre,
                    //   fecha_de_compromiso: tramite.fechaCompromiso,
                    //   fecha_de_cumplimiento: tramite.fechaCumplimiento, 
                    // };
                    // const requestBody = {
                    //   properties: propertiesTramite,
                    //   associations: [
                    //     {
                    //       to: {
                    //         id: sinco.idHubspot,
                    //       },
                    //       types: [
                    //         {
                    //           associationCategory: "HUBSPOT_DEFINED",
                    //           associationTypeId: 19,
                    //         },
                    //       ],
                    //     },
                    //   ],
                    // };

                    let data = [];

                    propertiesTramite[`tramite_${tramite.codigo.toLowerCase()}_compromiso`] = tramite.fechaCompromiso
                    propertiesTramite[`tramite_${tramite.codigo.toLowerCase()}_cumplimiento`] = tramite.fechaCumplimiento

                    const response = await fetch(`${tramitesEndpoint}/${'45145002254'}`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${HUBSPOT_TOKEN}`,
                        },
                        body: JSON.stringify({properties: propertiesTramite }),
                    });

                    data = await response.json();

                    if (!response.ok) {
                      console.error('HubSpot API error:', data);
                      // Return HubSpot's error message to the client
                      return NextResponse.json(data, { status: response.status });
                    }

                    return {
                      data
                    }
                })
                );
                
                console.log('tramitesUpdate', tramitesUpdate)

                // Update deal in HubSpot
                // const url = `${HUBSPOT_BASE_URL_DEALS}/${sinco.idHubspot}`;
                // const res = await fetch(url, {
                //     method: "PATCH",
                //     headers: {
                //         "Content-Type": "application/json",
                //         Authorization: `Bearer ${HUBSPOT_TOKEN}`,
                //     },
                //     body: JSON.stringify({ properties }),
                // });

                // if (!res.ok) {
                //     const errorText = await res.text();
                //     return {
                //         contactId: contact.id,
                //         dealId: sinco.idHubspot,
                //         error: errorText,
                //     };
                // }

                // const data = await res.json();
                return {
                    contactId: contact.id,
                    dealId: sinco.idHubspot,
                    updated: true,
                    updatedProperties: properties,
                    hubspotResponse: true,
                };
            })
        );

    return NextResponse.json({ updates });
    } catch (error: any) {
        console.error("Error fetching contacts:", error);
        return NextResponse.json(
        { error: "Failed to fetch contacts" },
        { status: 500 }
        );
    }
}