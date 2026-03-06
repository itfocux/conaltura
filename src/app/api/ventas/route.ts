import { NextResponse } from 'next/server';
import { getVentas } from '../../lib/cotizaciones';
import { updateDealVentaById } from '../../lib/hubspot';

export async function GET() {
  try {
    // const delay = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));
    const ventas = await getVentas();

    // const results = await Promise.allSettled(
    //   ventas.map(updateDealVentaById)
    // );
    const results: any = [];

    for (const venta of ventas) {
      try {
        const result = await updateDealVentaById(venta);
        results.push(result);
      } catch (error) {
        results.push({ success: false, status: "rejected", reason: error });
      }

      // await delay(120); // ~8 requests por segundo
    }

    // const normalized = results.map((r) =>
    //   r.success === 'fulfilled'
    //     ? r.value
    //     : { success: false, error: r.reason }
    // );

    const successful = results.filter((r :any) => r.success);
    const failed = results.filter((r : any) => !r.success);

    return NextResponse.json(
      {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        results,
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
