import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; 

export async function POST(request: Request) {
  try {
    const { dni } = await request.json();

    if (!dni) {
      return NextResponse.json({ granted: false, denialReason: 'DNI no proporcionado' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { dni },
      include: {
        memberships: {
          where: {
            status: 'ACTIVE',
            endDate: { gte: new Date() }
          },
          orderBy: { endDate: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ granted: false, denialReason: 'Usuario no encontrado' }, { status: 404 });
    }

    const activeMembership = user.memberships[0];

    if (!activeMembership) {
      await prisma.attendance.create({
        data: { userId: user.id, accessMethod: 'DNI', granted: false, denialReason: 'MEMBERSHIP_EXPIRED' }
      });
      return NextResponse.json({ granted: false, denialReason: 'Membresía inactiva o vencida' }, { status: 403 });
    }

    await prisma.attendance.create({
      data: {
        userId: user.id,
        accessMethod: 'DNI',
        granted: true
      }
    });

    const daysRemaining = Math.ceil((activeMembership.endDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

    return NextResponse.json({
      granted: true,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        daysRemaining
      }
    });

  } catch (error) {
    console.error('Error en Checkin:', error);
    return NextResponse.json({ granted: false, denialReason: 'Error interno del servidor' }, { status: 500 });
  }
}
