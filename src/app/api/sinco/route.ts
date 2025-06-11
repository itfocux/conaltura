// app/api/sinco/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SINCO_AUTH_URL = 'https://www3.sincoerp.com/SincoConaltura/V3/API/Auth/Usuario';
const SINCO_VISIT_URL = 'https://www3.sincoerp.com/SincoConaltura/V3/CBRClientes/API/SalaVentas/Visitantes';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // === 1. Obtener datos del contacto en HubSpot ===
    const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;
    const hubspotRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
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
        properties: [
          'firstname',
          'lastname',
          'email',
          'phone',
          'cedula_contacto',
          'tipo_identificacion',
          'sexo',
          'address',
          'country',
          'city',
          'zona',
          'barrio',
          'ocupacion',
          'profesion',
          'fecha_nacimiento',
          'nivel_academico',
          'estado_civil',
          'cargo',
        ],
      }),
    });

    const hubspotData = await hubspotRes.json();
    const contacto = hubspotData.results?.[0]?.properties;

    if (!contacto) {
      return NextResponse.json({ message: 'Contacto no encontrado en HubSpot' }, { status: 404 });
    }

    const NomUsuario = process.env.SINCO_USERNAME;
    const ClaveUsuario = process.env.SINCO_PASSWORD;

    if (!NomUsuario || !ClaveUsuario) {
      return NextResponse.json({ message: 'Faltan las credenciales Sinco API' }, { status: 400 });
    }

    // Paso 1: Obtener el token
    const authRes = await fetch(SINCO_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ NomUsuario, ClaveUsuario }),
    });

    if (!authRes.status) {
      const error = await authRes.text();
      return NextResponse.json({ message: 'Auth error sinco', error }, { status: 401 });
    }

    const authData = await authRes.json();
    const accessToken = authData.access_token;

    if (!accessToken) {
      return NextResponse.json({ message: 'No access token recibido' }, { status: 500 });
    }

    console.log('visitResponse', accessToken, contacto)

    // === 3. Crear el visitante en Sinco ===
    const visitantePayload = {
      id: 1,
      nombres: contacto.firstname || '',
      apellidos: contacto.lastname || '',
      correo: contacto.email,
      celular: contacto.phone || '',
      numeroIdentificacion: contacto?.cedula_contacto || '',
      tipoIdentificacion: contacto?.tipo_identificacion || '',
      sexo: contacto?.sexo || '',
      haAutorizadoManejoInformacion: true,
      direccionResidencia: contacto?.address || '',
      idPaisResidencia: parseInt(contacto?.country || '0'),
      idCiudadResidencia: parseInt(contacto?.city || '0'),
      idZonaResidencia: parseInt(contacto?.zona || '0'),
      idBarrioResidencia: parseInt(contacto?.barrio || '0'),
      idOcupacion: parseInt(contacto?.ocupacion || '0'),
      idProfesion: parseInt(contacto?.profesion || '0'),
      fechaNacimiento: contacto?.fecha_nacimiento || new Date().toISOString(),
      idPaisOficina: 0,
      idCiudadOficina: 0,
      valorIngresosFamiliares: 0,
      haAutorizadoEnvioCorreo: true,
      haAutorizadoEnvioSMS: true,
      idNivelAcademico: parseInt(contacto?.nivel_academico || '0'),
      idEstadoCivil: contacto?.estado_civil || '',
      idCargoEmpresa: parseInt(contacto?.cargo || '0'),
      idVisitanteExterno: '',
      camposAdicionales: [],
      HaAutorizadoEnvioWhatsApp: true,
      HaAutorizadoLlamada: true,
    };

    // Paso 2: Enviar datos del visitante
    const visitRes = await fetch(SINCO_VISIT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(visitantePayload),
    });

    // // const visitRes = await fetch('https://www3.sincoerp.com/SincoConaltura/V3/CBRClientes/API/SalaVentas/Vendedores', {
    // //    method: 'GET',
    // //    headers: {
    // //      'Content-Type': 'application/json',
    // //      Authorization: `Bearer ${accessToken}`,
    // //    },
    // // });

    const visitResponse = await visitRes.json();

    console.log('visitResponse', visitResponse)

    if (!visitRes.ok) {
      return NextResponse.json({ message: 'Fallo la creacion del visitante', visitResponse }, { status: visitRes.status });
    }

    return NextResponse.json({ message: 'Visitante registrado con éxito', data: visitResponse });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error interno', error: error.message }, { status: 500 });
  }
}
