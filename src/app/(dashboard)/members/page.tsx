'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search } from 'lucide-react';

type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING_PAYMENT' | 'INACTIVE';

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  memberships: {
    status: MembershipStatus;
    endDate: string;
    plan: { name: string };
  }[];
  attendances: { timestamp: string }[];
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planToRenew, setPlanToRenew] = useState('');

  const plans = [
    { id: '1', name: 'Pase Libre Mensual' },
    { id: '2', name: 'Musculación 3x Semana' }
  ];

  const fetchMembers = async () => {
    const params = new URLSearchParams({ search, status: statusFilter, page: page.toString() });
    const res = await fetch(`/api/members?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => fetchMembers(), 300);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter, page]);

  const handleRenewMembership = async () => {
    if (!selectedMember || !planToRenew) return;
    
    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedMember.id, planId: planToRenew })
      });
      
      if (res.ok) {
        fetchMembers();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error renewing membership', error);
    }
  };

  const getStatusBadge = (status?: MembershipStatus) => {
    switch (status) {
      case 'ACTIVE': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Activo</Badge>;
      case 'EXPIRED': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Vencido</Badge>;
      case 'PENDING_PAYMENT': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Moroso</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Inactivo</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Directorio de Socios</h1>
          <p className="text-slate-500 mt-1">Busca, filtra y gestiona las membresías.</p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por DNI o Nombre..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="ACTIVE">Activos</SelectItem>
              <SelectItem value="EXPIRED">Vencidos</SelectItem>
              <SelectItem value="PENDING_PAYMENT">Morosos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Socio</th>
                <th className="px-6 py-4 font-semibold">DNI</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold">Vencimiento</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => {
                const activeMem = member.memberships[0];
                return (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors bg-white">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {member.firstName} {member.lastName}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{member.dni}</td>
                    <td className="px-6 py-4">{getStatusBadge(activeMem?.status)}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {activeMem?.endDate ? new Date(activeMem.endDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => { setSelectedMember(member); setIsModalOpen(true); }}
                      >
                        Ver Ficha
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
          <span>Mostrando página {page}</span>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>Siguiente</Button>
          </div>
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedMember && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedMember.firstName} {selectedMember.lastName}</DialogTitle>
                <p className="text-slate-500">DNI: {selectedMember.dni} • {selectedMember.email}</p>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 my-6">
                <Card className="bg-slate-50 border-none shadow-none">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-slate-500 mb-2">Estado Actual</h4>
                    <div className="mb-2">{getStatusBadge(selectedMember.memberships[0]?.status)}</div>
                    <p className="text-sm font-medium">Plan: {selectedMember.memberships[0]?.plan?.name || 'Ninguno'}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50 border-none shadow-none">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-slate-500 mb-2">Última Asistencia</h4>
                    <p className="text-sm font-medium">
                      {selectedMember.attendances[0]?.timestamp 
                        ? new Date(selectedMember.attendances[0].timestamp).toLocaleString()
                        : 'Sin registros recientes'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-slate-900">Renovar / Asignar Plan</h4>
                <div className="flex gap-4">
                  <Select onValueChange={setPlanToRenew}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleRenewMembership} className="bg-green-600 hover:bg-green-700">
                    Aplicar Renovación
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
