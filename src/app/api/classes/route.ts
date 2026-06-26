import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await prisma.classSession.findMany({
      where: {
        startTime: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        classType: {
          select: { name: true, colorHex: true }
        },
        professor: {
          select: { firstName: true, lastName: true }
        },
        _count: {
          select: { reservations: true } 
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    return NextResponse.json(sessions);

  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Error fetching classes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classTypeId, professorId, startTime, endTime, capacity } = body;

    if (!classTypeId || !professorId || !startTime || !endTime || !capacity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const overlappingClass = await prisma.classSession.findFirst({
      where: {
        professorId: professorId,
        AND: [
          { startTime: { lt: new Date(endTime) } },
          { endTime: { gt: new Date(startTime) } }
        ]
      }
    });

    if (overlappingClass) {
      return NextResponse.json(
        { error: 'El profesor ya tiene una clase asignada en ese horario' }, 
        { status: 409 }
      );
    }

    const newSession = await prisma.classSession.create({
      data: {
        classTypeId,
        professorId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        capacity: parseInt(capacity, 10)
      },
      include: {
        classType: true,
        professor: true,
        _count: {
          select: { reservations: true }
        }
      }
    });

    return NextResponse.json(newSession, { status: 201 });

  } catch (error) {
    console.error('Error creating class session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
