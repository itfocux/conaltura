import { NextResponse } from 'next/server';
import { getVentas } from '../../lib/cotizaciones';
import { updateDealVentaById } from '../../lib/hubspot';

const BATCH_SIZE = 10;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET() {
  try {
    const ventas = await getVentas();

    const results: any[] = [];

    for (let i = 0; i < ventas.length; i += BATCH_SIZE) {
      const batch = ventas.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(updateDealVentaById)
      );

      results.push(...batchResults);

      await delay(15);
    }

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
      { status: failed.length > 0 ? 207 : 200 }
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
