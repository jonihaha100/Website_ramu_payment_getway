import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resi = searchParams.get('resi');
  const courier = searchParams.get('courier');
  const orderDateStr = searchParams.get('date');

  if (!resi || !courier) {
    return NextResponse.json({ error: "No resi or courier provided" }, { status: 400 });
  }

  // Simulator logic: we will generate a realistic timeline 
  // based on the order date (or current date if missing).
  const startDate = orderDateStr ? new Date(orderDateStr) : new Date(Date.now() - 48 * 60 * 60 * 1000); // default to 2 days ago
  
  const addHours = (date: Date, hours: number) => new Date(date.getTime() + hours * 60 * 60 * 1000);

  // We determine how many events to show based on time passed since order date.
  // For demo, we just show a full progression up to "Out for Delivery" if enough time passed,
  // or we just show a static 5-step progression so it looks great in the demo.
  
  const simulatedEvents = [
    {
      time: addHours(startDate, 8),
      status: "Manifested / Paket telah didaftarkan",
      location: `Gerai ${courier} Jakarta`,
      active: true
    },
    {
      time: addHours(startDate, 12),
      status: "Paket telah diberangkatkan dari fasilitas sortir",
      location: "Hub Sortir Jakarta Pusat",
      active: true
    },
    {
      time: addHours(startDate, 24),
      status: "Paket tiba di kota tujuan",
      location: "Fasilitas Sortir Kota Tujuan",
      active: true
    },
    {
      time: addHours(startDate, 32),
      status: "Paket dibawa kurir menuju alamat Anda",
      location: "Kurir (Bpk. Mulyono - 0812345678)",
      active: true
    }
  ];

  // Optionally, if the order status is Delivered, we would add the final step.
  // But for this simulation, we'll just return the array. The client will append this to the base history.

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return NextResponse.json({
    status: "success",
    message: "Tracking data retrieved successfully",
    data: {
      resi: resi,
      courier: courier,
      history: simulatedEvents
    }
  });
}
