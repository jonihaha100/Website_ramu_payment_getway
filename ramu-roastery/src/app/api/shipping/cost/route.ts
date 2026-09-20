import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, weight } = body; // destination is city ID or name, weight in grams

    if (!destination || !weight) {
      return NextResponse.json({ error: "Destination and weight are required" }, { status: 400 });
    }

    const apiKey = process.env.RAJAONGKIR_API_KEY;
    
    // REAL MODE: Call actual RajaOngkir API
    try {
      // Note: The Komerce API might need different headers/body structure.
      // We attempt RajaOngkir legacy format first.
      const response = await fetch("https://api.rajaongkir.com/starter/cost", {
        method: "POST",
        headers: {
          "key": apiKey || "",
          "content-type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          origin: "23", // ID for Kota Bandung (Ramu Roastery Hub)
          destination: destination.toString(),
          weight: weight.toString(),
          courier: "jne" // or any other courier
        })
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.rajaongkir.results[0];
        const costs = results.costs.map((c: any) => ({
          courier: results.code.toUpperCase(),
          service: c.service,
          description: c.description,
          cost: c.cost[0].value,
          etd: c.cost[0].etd + " Hari"
        }));
        if (destination.toString().toLowerCase().includes("bandung") || destination.toString().toLowerCase().includes("cimahi")) {
          costs.unshift(
            { courier: "GOSEND", service: "Instant", description: "GoSend Instant", cost: 25000, etd: "Hari ini (1-3 jam)" },
            { courier: "GOSEND", service: "SameDay", description: "GoSend Same Day", cost: 15000, etd: "Hari ini (6-8 jam)" }
          );
        }

        // Add B2B Cargo for large shipments (>= 5kg)
        if (weight >= 5000) {
          costs.push({
            courier: "J&T CARGO",
            service: "CARGO",
            description: "Spesial B2B Cargo (Ekonomis Partai Besar)",
            cost: Math.round(Math.max(50000, (weight / 1000) * 8500)),
            etd: "3-5 Hari"
          });
        }

        return NextResponse.json({ success: true, data: costs });
      } else {
        console.warn(`RajaOngkir API failed with status ${response.status}. Falling back to Dummy Mode.`);
      }
    } catch (e) {
      console.warn("RajaOngkir API fetch failed. Falling back to Dummy Mode.", e);
    }

    // FALLBACK / DUMMY MODE (Origin: Kota Bandung)
    const weightKg = Math.max(1, Math.ceil(weight / 1000));
    let baseCost = 25000; // Default
    
    const destLower = destination.toString().toLowerCase();
    if (destLower.includes("bandung") || destLower.includes("cimahi")) baseCost = 10000;
    else if (destLower.includes("jakarta") || destLower.includes("bogor") || destLower.includes("depok") || destLower.includes("tangerang") || destLower.includes("bekasi")) baseCost = 12000;
    else if (destLower.includes("surabaya") || destLower.includes("semarang") || destLower.includes("yogyakarta") || destLower.includes("solo")) baseCost = 19000;
    else if (destLower.includes("bali") || destLower.includes("denpasar")) baseCost = 30000;
    else if (destLower.includes("medan") || destLower.includes("makassar") || destLower.includes("padang")) baseCost = 42000;
    
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate delay

    const dummyOptions = [
      { courier: "JNE", service: "REG", description: "Layanan Reguler", cost: baseCost * weightKg, etd: "2-3 Hari" },
      { courier: "JNE", service: "YES", description: "Yakin Esok Sampai", cost: (baseCost + 12000) * weightKg, etd: "1 Hari" },
      { courier: "SICEPAT", service: "REG", description: "SiCepat Reguler", cost: Math.max(9000, (baseCost - 1000) * weightKg), etd: "2-3 Hari" }
    ];

    // Add GoSend specifically if in Bandung or same-city delivery (Ramu Roastery Hegarmanah/Bandung)
    if (destLower.includes("bandung") || destLower.includes("cimahi")) {
      dummyOptions.unshift(
        { courier: "GOSEND", service: "Instant", description: "GoSend Instant", cost: 25000, etd: "Hari ini (1-3 jam)" },
        { courier: "GOSEND", service: "SameDay", description: "GoSend Same Day", cost: 15000, etd: "Hari ini (6-8 jam)" }
      );
    }

    // Add B2B Cargo option for orders >= 5kg (5000g)
    if (weight >= 5000) {
      dummyOptions.push({
        courier: "J&T CARGO",
        service: "CARGO",
        description: "Spesial B2B Cargo (Ekonomis Partai Besar)",
        cost: Math.round(Math.max(50000, weightKg * 8500)),
        etd: "3-5 Hari"
      });
    }

    return NextResponse.json({
      success: true,
      data: dummyOptions
    });

  } catch (error) {
    console.error("Shipping API error:", error);
    return NextResponse.json({ error: "Failed to calculate shipping cost" }, { status: 500 });
  }
}
