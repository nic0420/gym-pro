import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ITEMS_PER_PAGE = 20;

// GET: Listar usuarios con paginación, filtros y búsqueda
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Construcción dinámica del query para Prisma
    const whereClause: any = { role: 'CLIENT' };
    
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { dni: { contains: search } }
      ];
    }

    if (status !== 'ALL') {
      whereClause.memberships = {
        some: { status: status as any }
      };
    }

    const members = await prisma.user.findMany({
      where: whereClause,
      skip,
      take: ITEMS_PER_PAGE,
      include: {
        memberships: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: { select: { name: true } } }
        },
        attendances: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { lastName: 'asc' }
    });

    const total = await prisma.user.count({ where: whereClause });

    return NextResponse.json({
      members,
      metadata: {
        total,
        page,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE)
      }
    });

  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PUT: Renovar o actualizar membresía
export async function PUT(request: Request) {
  try {
    const { userId, planId } = await request.json();

    if (!userId || !planId) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    await prisma.membership.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'INACTIVE' }
    });

    const newMembership = await prisma.membership.create({
      data: {
        userId,
        planId,
        startDate,
        endDate,
        status: 'ACTIVE',
        remainingClasses: plan.classLimit
      }
    });

    await prisma.payment.create({
      data: {
        userId,
        membershipId: newMembership.id,
        amount: plan.price,
        method: 'CASH',
        status: 'PENDING'
      }
    });

    return NextResponse.json({ message: 'Membresía renovada con éxito', membership: newMembership });

  } catch (error) {
    console.error('Error renewing membership:', error);
    return NextResponse.json({ error: 'Error renovando membresía' }, { status: 500 });
  }
}
