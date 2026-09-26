import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAdmin, getUserSession } from '../../../../lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const body = await request.json();
    const decodedEmail = decodeURIComponent(email).toLowerCase().trim();

    // Session authorization check (Anti-IDOR / Anti-Account Takeover)
    const adminCheck = await requireAdmin(request);
    const isAdmin = !adminCheck;
    const session = await getUserSession(request);
    const isOwner = session && session.email.toLowerCase() === decodedEmail;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi tidak sah atau Anda tidak berhak mengubah profil ini.' },
        { status: 401 }
      );
    }
    
    // Find user in PostgreSQL
    const existingUser = await prisma.user.findUnique({
      where: { email: decodedEmail }
    });
    
    if (!existingUser) {
      return NextResponse.json({ 
        success: true, 
        data: {
          email: decodedEmail,
          ...body,
          role: 'customer',
          provider: 'local',
        } 
      }, { status: 200 });
    }
    
    // Build update data - only update provided fields
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.dob !== undefined) updateData.dob = body.dob;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    
    const updatedUser = await prisma.user.update({
      where: { email: decodedEmail },
      data: updateData
    });
    
    return NextResponse.json({ 
      success: true, 
      data: {
        name: updatedUser.name || '',
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        gender: updatedUser.gender || '',
        dob: updatedUser.dob || '',
        role: updatedUser.role?.toLowerCase() === 'admin' ? 'admin'
            : updatedUser.role?.toLowerCase() === 'b2b' ? 'b2b'
            : 'customer',
        provider: 'local',
        avatarUrl: updatedUser.avatarUrl || '',
        coffeePreferences: body.coffeePreferences !== undefined ? body.coffeePreferences : undefined,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
