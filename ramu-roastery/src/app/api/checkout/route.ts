import { NextRequest, NextResponse } from "next/server";
import { CheckoutPayload } from "../../../types/cart";

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutPayload = await req.json();
    
    // Validate request
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    
    // Generate a dummy order ID
    const orderId = `RAMU-DUMMY-${Math.floor(Math.random() * 100000)}`;

    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return a dummy token
    return NextResponse.json({ 
      token: "dummy_token_12345", 
      orderId,
      message: "DUMMY MODE: Transaction created successfully" 
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create dummy transaction" }, { status: 500 });
  }
}
