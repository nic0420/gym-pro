import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, Activity, AlertCircle } from 'lucide-react';
import prisma from '@/lib/prisma';

// Server Component: Consulta la DB directamente
export default async function DashboardPage() {
  
  // 1. Asistencias Hoy (Aforo aproximado si filtramos por las últimas 2 horas, pero haremos del día)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const attendancesToday = await prisma.attendance.count({
    where: {
      timestamp: { gte: today },
      granted: true
    }
  });

  // 2. Membresías Activas Totales
  const activeMembershipsCount = await prisma.membership.count({
    where: { status: 'ACTIVE' }
  });

  // 3. Socios por vencer en los próximos 7 días
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const expiringMemberships = await prisma.membership.count({
    where: {
      status: 'ACTIVE',
      endDate: {
        gte: today,
        lte: nextWeek
      }
    }
  });

  // 4. Clases de Hoy
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysClasses = await prisma.classSession.findMany({
    where: {
      startTime: { gte: today, lt: tomorrow }
    },
    include: {
      classType: true,
      professor: true,
      _count: { select: { reservations: true } }
    },
    orderBy: { startTime: 'asc' },
    take: 5 // Mostramos solo las próximas 5
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel Principal</h1>
        <p className="text-slate-500 mt-1">Resumen general del gimnasio en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Aforo / Asistencias Hoy</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{attendancesToday}</div>
            <p className="text-xs text-slate-500 mt-1">Personas ingresaron hoy</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Membresías Activas</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{activeMembershipsCount}</div>
            <p className="text-xs text-green-600 mt-1">Socios al día</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-red-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Por Vencer (7 días)</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{expiringMemberships}</div>
            <p className="text-xs text-slate-500 mt-1">Requieren seguimiento</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Accesos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex h-48 items-center justify-center text-slate-400 border-2 border-dashed rounded-lg border-slate-200 bg-slate-50">
               Aquí iría un gráfico de barras (Recharts) con asistencias por hora.
             </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Clases de Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysClasses.length === 0 ? (
                 <p className="text-sm text-slate-500 text-center py-4">No hay clases programadas hoy.</p>
              ) : (
                todaysClasses.map((cls) => {
                  const isFull = cls._count.reservations >= cls.capacity;
                  return (
                    <div key={cls.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{cls.classType.name}</p>
                        <p className="text-xs text-slate-500">
                          {cls.startTime.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })} • Prof. {cls.professor.firstName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{cls._count.reservations}/{cls.capacity}</p>
                        <p className={`text-[10px] font-bold ${isFull ? 'text-red-500' : 'text-green-500'}`}>
                          {isFull ? 'LLENO' : 'DISPONIBLE'}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
