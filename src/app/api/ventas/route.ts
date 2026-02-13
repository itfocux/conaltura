import { NextResponse } from 'next/server';
import { getVentas } from '../../lib/cotizaciones';
import { updateDealVentaById } from '../../lib/hubspot';

export async function GET() {
  try {
    const ventas = await getVentas();

    const results = await Promise.allSettled(
      ventas.map(updateDealVentaById)
    );

    const normalized = results.map((r) =>
      r.status === 'fulfilled'
        ? r.value
        : { success: false, error: r.reason }
    );

    const successful = normalized.filter((r) => r.success);
    const failed = normalized.filter((r) => !r.success);

    return NextResponse.json(
      {
        total: normalized.length,
        successful: successful.length,
        failed: failed.length,
        results: normalized,
      },
      { status: failed.length > 0 ? 207 : 200 } // 207 = Multi-Status (optional)
    );

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unexpected server error',
      },
      { status: 500 }
    );
  }
}
