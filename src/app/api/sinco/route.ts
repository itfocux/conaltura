

// app/api/sinco/route.ts
import { NextResponse } from 'next/server';

const SINCO_AUTH_URL = process.env.SINCO_AUTH_URL as any;
const SINCO_VISIT_URL = process.env.SINCO_VISIT_URL as any;
const HUBSPOT_URL = process.env.HUBSPOT_URL as any;

// Helper function to get Sinco access token
async function getSincoAccessToken() {
  const NomUsuario = process.env.SINCO_USERNAME;
  const ClaveUsuario = process.env.SINCO_PASSWORD;

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

// GET method - Sync contacts with "cotizacion pedida" status from HubSpot to Sinco
export async function GET() {
  try {
    const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;
    
    if (!HUBSPOT_API_KEY) {
      return NextResponse.json({ message: 'HUBSPOT_API_KEY is required' }, { status: 400 });
    }

    // 1. Search for contacts with "cotizacion pedida" status
    const hubspotRes = await fetch(HUBSPOT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'etapa_del_lead_conaltura',
                operator: 'EQ',
                value: 'Cotización Enviada',
              },
            ],
          },
        ],
        limit: 100,
        properties: [
          'email', 
          'firstname', 
          'lastname', 
          'phone',
          'cedula_contacto',
          'tipo_identificacion',
          'sexo',
          'address',
          'hs_country_region_code',
          'idciudadresidencia',
          'idzonaresidencia',
          'idbarrioresidencia',
          'ocupacion',
          'profesion',
          'date_of_birth',
          'idnivelacademico',
          'idestadocivil',
          'idcargoempresa',
          'etapa_del_lead_conaltura'
        ],
      }),
    });

    const hubspotData = await hubspotRes.json();
    
    const contactos = hubspotData.results || [];
    
    let enviados = 0;
    let errores = [];

    // Get Sinco access token once for all operations
    const accessToken = await getSincoAccessToken();

    for (const contacto of contactos) {
      try {
        const props = contacto.properties;
        const email = props.email;
        const celular = props.phone

        const telefonoLimpio = celular.startsWith('+') ? celular.slice(1) : celular;

        // 2. Verificar si el visitante ya existe en Sinco (por celular)
        const sincoCheck = await fetch(`${SINCO_VISIT_URL}/Celular/${telefonoLimpio}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        console.log('sincoCheck', sincoCheck, props)

        const noExiste = sincoCheck.status === 409;

        if (noExiste) {
          // 2. Create visitor payload for Sinco
          const visitantePayload = {
            id: 1,
            nombres: props.firstname || '',
            apellidos: props.lastname || '',
            correo: props.email,
            celular: telefonoLimpio || '',
            numeroIdentificacion: props?.cedula_contacto || '',
            tipoIdentificacion: props?.tipo_identificacion || '',
            sexo: props?.sexo || '',
            haAutorizadoManejoInformacion: true,
            direccionResidencia: props?.address || '',
            idPaisResidencia: parseInt(props?.hs_country_region_code || '0'),
            idCiudadResidencia: parseInt(props?.idciudadresidencia || '0'),
            idZonaResidencia: parseInt(props?.idzonaresidencia || '0'),
            idBarrioResidencia: parseInt(props?.idbarrioresidencia || '0'),
            idOcupacion: parseInt(props?.ocupacion || '0'),
            idProfesion: parseInt(props?.profesion || '0'),
            fechaNacimiento: props?.date_of_birth || new Date().toISOString(),
            idPaisOficina: 0,
            idCiudadOficina: 0,
            valorIngresosFamiliares: 0,
            haAutorizadoEnvioCorreo: false,
            haAutorizadoEnvioSMS: false,
            idNivelAcademico: parseInt(props?.idnivelacademico || '0'),
            idEstadoCivil: props?.idestadocivil || '',
            idCargoEmpresa: parseInt(props?.idcargoempresa || '0'),
            idVisitanteExterno: '',
            camposAdicionales: [],
            HaAutorizadoEnvioWhatsApp: false,
            HaAutorizadoLlamada: false,
          };

          // 3. Create visitor in Sinco
          const visitRes = await fetch(SINCO_VISIT_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(visitantePayload),
          });

          if (visitRes.ok) {
            enviados++;
          } else {
            const errorResponse = await visitRes.text();
            errores.push({ email, error: errorResponse });
          }
        }
      } catch (contactError) {
        errores.push({ email: contacto.properties?.email, error: String(contactError) });
      }
    }

    return NextResponse.json({ 
      success: true, 
      enviados, 
      totalContactos: contactos.length,
      errores: errores.length > 0 ? errores : undefined
    });
  } catch (error) {
    console.error('Error en sincronización:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// export async function POST(req: NextRequest) {
//   try {
//     const { email } = await req.json();

//     if (!email) {
//       return NextResponse.json({ message: 'Email is required' }, { status: 400 });
//     }

//     // === 1. Obtener datos del contacto en HubSpot ===
//     const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;
//     const hubspotRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${HUBSPOT_API_KEY}`,
//       },
//       body: JSON.stringify({
//         filterGroups: [
//           {
//             filters: [
//               {
//                 propertyName: 'email',
//                 operator: 'EQ',
//                 value: email,
//               },
//             ],
//           },
//         ],
//         properties: [
//           'firstname',
//           'lastname',
//           'email',
//           'phone',
//           'cedula_contacto',
//           'tipo_identificacion',
//           'sexo',
//           'address',
//           'country',
//           'city',
//           'zona',
//           'barrio',
//           'ocupacion',
//           'profesion',
//           'fecha_nacimiento',
//           'nivel_academico',
//           'estado_civil',
//           'cargo',
//         ],
//       }),
//     });

//     const hubspotData = await hubspotRes.json();
//     const contacto = hubspotData.results?.[0]?.properties;

//     if (!contacto) {
//       return NextResponse.json({ message: 'Contacto no encontrado en HubSpot' }, { status: 404 });
//     }

//     // Paso 1: Obtener el token usando la función helper
//     const accessToken = await getSincoAccessToken();

//     console.log('visitResponse', accessToken, contacto)

//     // === 3. Crear el visitante en Sinco ===
//     const visitantePayload = {
//       id: 1,
//       nombres: contacto.firstname || '',
//       apellidos: contacto.lastname || '',
//       correo: contacto.email,
//       celular: contacto.phone || '',
//       numeroIdentificacion: contacto?.cedula_contacto || '',
//       tipoIdentificacion: contacto?.tipo_identificacion || '',
//       sexo: contacto?.sexo || '',
//       haAutorizadoManejoInformacion: true,
//       direccionResidencia: contacto?.address || '',
//       idPaisResidencia: parseInt(contacto?.country || '0'),
//       idCiudadResidencia: parseInt(contacto?.city || '0'),
//       idZonaResidencia: parseInt(contacto?.zona || '0'),
//       idBarrioResidencia: parseInt(contacto?.barrio || '0'),
//       idOcupacion: parseInt(contacto?.ocupacion || '0'),
//       idProfesion: parseInt(contacto?.profesion || '0'),
//       fechaNacimiento: contacto?.fecha_nacimiento || new Date().toISOString(),
//       idPaisOficina: 0,
//       idCiudadOficina: 0,
//       valorIngresosFamiliares: 0,
//       haAutorizadoEnvioCorreo: true,
//       haAutorizadoEnvioSMS: true,
//       idNivelAcademico: parseInt(contacto?.nivel_academico || '0'),
//       idEstadoCivil: contacto?.estado_civil || '',
//       idCargoEmpresa: parseInt(contacto?.cargo || '0'),
//       idVisitanteExterno: '',
//       camposAdicionales: [],
//       HaAutorizadoEnvioWhatsApp: true,
//       HaAutorizadoLlamada: true,
//     };

//     // Paso 2: Enviar datos del visitante
//     const visitRes = await fetch(SINCO_VISIT_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${accessToken}`,
//       },
//       body: JSON.stringify(visitantePayload),
//     });

//     // // const visitRes = await fetch('https://www3.sincoerp.com/SincoConaltura/V3/CBRClientes/API/SalaVentas/Vendedores', {
//     // //    method: 'GET',
//     // //    headers: {
//     // //      'Content-Type': 'application/json',
//     // //      Authorization: `Bearer ${accessToken}`,
//     // //    },
//     // // });

//     const visitResponse = await visitRes.json();

//     console.log('visitResponse', visitResponse)

//     if (!visitRes.ok) {
//       return NextResponse.json({ message: 'Fallo la creacion del visitante', visitResponse }, { status: visitRes.status });
//     }

//     return NextResponse.json({ message: 'Visitante registrado con éxito', data: visitResponse });
//   } catch (error: any) {
//     return NextResponse.json({ message: 'Error interno', error: error.message }, { status: 500 });
//   }
// }
