// app/api/sinco/route.ts
import { NextResponse } from 'next/server';

const SINCO_AUTH_URL = 'https://pruebas3.sincoerp.com/SincoInmCarbone_Nueva_PRBINT/V3/API/Auth/Usuario' as any;
const SINCO_VISIT_URL = process.env.SINCO_VISIT_URL as any;
const SINCO_VISIT_UPDATE_URL = process.env.SINCO_VISIT_UPDATE_URL as any;
const HUBSPOT_API_URL = "https://api.hubapi.com";
const HUBSPOT_TOKEN = process.env.HUBSPOT_API_KEY!;
const SINCO_BASE_URL = 'https://www3.sincoerp.com/SincoConaltura/V3/CBRClientes/API'
const HUBSPOT_BASE_URL_DEALS = "https://api.hubapi.com/crm/v3/objects/deals";
const tramitesEndpoint = 'https://api.hubapi.com/crm/v3/objects/deals/';
const SINCO_MACROS_PATH = '/Macroproyectos/Basica';
const SINCO_PROJECTS_PATH = '/Proyectos';
const SINCO_UNITS_PATH = '/Unidades/PorProyecto';
const HUBSPOT_OBJECT = 'p45318801_unidades';

// Helper function to get Sinco access token
async function getSincoAccessToken() {
  const NomUsuario = "APICBR";
  const ClaveUsuario = "cvapLoD2d3RqL568tt1NhFE7Y0hIp9vxj6lTA20bw2r2E6x++3unVhNY/TZrElHSoxgq9YwRmbSbj2BIzWDjASfAPuccZKSnnrLD4QatGSo9b81ot+jeU+q/ena9OrIF9J8HbyMUtb0aQGVnSYdz2Cj2LFOaawLHSXww3N5IB9Yc1hQQokt8CqYy2iHJdIHMsOzQsYOX6ded9yVNDKzlQ0cPfwZ0s0qG/FBejq4JsB70bJYgR20f+5QaYHqKw+grfyjjSLA9z5cJ4wee1mMl+/LGtP36vJslkeRgAnHmNko=5";

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

async function fetchSinco(path: string, token: string) {
  const url = `${SINCO_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  console.log('resTest', res)
  if(res.status === 409) {
    return [];
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SINCO request failed ${url}: ${res.status} ${text}`);
  }
  return res.json();
}

async function hubspotSearchBySincoId(sincoUnitId: number) {
  // Search custom object for existing record with sinco_unit_id equal to value
    const url = `${HUBSPOT_API_URL}/crm/v3/objects/${HUBSPOT_OBJECT}/search`;
    const body = {
        filterGroups: [
        {
            filters: [
            {
                propertyName: "id_sinco",
                operator: "EQ",
                value: sincoUnitId,
            },
            ],
        },
        ],
        properties: ["id_sinco"],
        limit: 1,
    };

    const res = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${HUBSPOT_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HubSpot search failed: ${res.status} ${text}`);
    }

    const json = await res.json();
    return json.results?.[0] || null;
}

function mapSincoUnitToHubspotProps(unit: any) {
  // Since you said HubSpot property names are identical to SINCO,
  // copy only the keys we care about and convert dates if needed.
  const props: Record<string, any> = {};

  // copy all top-level keys (you may want to whitelist instead)
  for (const key of Object.keys(unit)) {
    let value = unit[key];

    // convert booleans/numbers to strings if HubSpot expects strings
    // if (value === null || value === undefined) continue;

    // HubSpot expects property values as strings (or numbers for numeric fields).
    // We'll stringify non-object primitives; leave objects/arrays out.
    if (typeof value === "object") {
      // skip arrays/objects — you may want to JSON.stringify them or map nested fields
      // For example, keep dates as ISO strings
      if (value instanceof Date) {
        props[key] = value.toISOString();
      } else {
        // skip nested objects by default
        continue;
      }
    } else {
      props[key.toLocaleLowerCase()] = value;
    }
  }

  // ensure the id_sinco is present and mapped from `id` (SINCO unit id)
  if (unit.id && !props["id_sinco"]) {
    props["id_sinco"] = unit.id;
  }

  delete props.id;

  return props;
}

async function hubspotUpdateUnit(hubspotId: string, properties: Record<string, any>) {
  const url = `${HUBSPOT_API_URL}/crm/v3/objects/${HUBSPOT_OBJECT}/${hubspotId}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot update failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function hubspotCreateUnit(properties: Record<string, any>) {
  const url = `${HUBSPOT_API_URL}/crm/v3/objects/${HUBSPOT_OBJECT}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot create failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function GET() {
  try {
    // 1) Get SINCO token
    const sincoToken = await getSincoAccessToken();

    // 2) Get macros
    const macrosRes = await fetchSinco(SINCO_MACROS_PATH, sincoToken);
    const macros = Array.isArray(macrosRes) ? macrosRes : macrosRes?.data || macrosRes?.result || macrosRes?.items || [];

    const updates: any[] = [];
    const macrosTest = macros.slice(0,2);

    // iterate macros sequentially
    for (const macro of macrosTest) {
      const macroId = macro.id;
      if (!macroId) continue;

      // 3) Get projects for macro
      const projectsRes = await fetchSinco(`${SINCO_PROJECTS_PATH}/${macroId}`, sincoToken);
      const projects = Array.isArray(projectsRes) ? projectsRes : projectsRes?.data || projectsRes?.items || [];

      for (const project of projects) {
        const projectId = project.id ?? project.Id ?? project.ID ?? project.idProyecto;
        if (!projectId) continue;

        // 4) Get units for project
        const unitsRes = await fetchSinco(`${SINCO_UNITS_PATH}/${projectId}`, sincoToken);
        const units = Array.isArray(unitsRes) ? unitsRes : unitsRes?.data || unitsRes?.items || unitsRes?.result || [];

        // process units sequentially to avoid hammering APIs
        for (const unit of units) {
          try {
            const props = mapSincoUnitToHubspotProps(unit);

            // Upsert logic: search by sinco_unit_id
            const existing = await hubspotSearchBySincoId(unit.id);
            if (existing) {
              // update
              const updated = await hubspotUpdateUnit(existing.id, props);
              updates.push({ id_sinco: props["id_sinco"], action: "updated", hubspotId: existing.id });
            } else {
              // create
              const created = await hubspotCreateUnit(props);
              updates.push({ id_sinco: props["id_sinco"], action: "created", hubspotId: created.id });
            }
          } catch (uErr: any) {
            updates.push({ id_sinco: unit?.id, error: String(uErr.message || uErr) });
            // continue with next unit
          }
        }
      }
    }

    return NextResponse.json({ ok: true, updates });
  } catch (err: any) {
    console.error("Sync error:", err);
    return NextResponse.json({ ok: false, error: String(err.message || err) }, { status: 500 });
  }
}