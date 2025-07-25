// app/api/sync-cotizaciones/route.ts

import { NextResponse } from 'next/server';
import { getCotizaciones } from '../../lib/cotizaciones';
import { createOrUpdateDeal } from '../../lib/hubspot';

export async function GET() {
  try {
    const cotizaciones = await getCotizaciones();
    for (const cotizacion of cotizaciones) {
      await createOrUpdateDeal(cotizacion); // Lógica personalizada en hubspot.ts
    }

    return NextResponse.json({ status: 'ok', total: cotizaciones.length });
  } catch (error: any) {
    console.error('Error al sincronizar cotizaciones:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
