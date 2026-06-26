'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar as CalendarIcon, Clock, Users, Trash2 } from 'lucide-react';

type ClassSession = {
  id: string;
  classType: { name: string; colorHex: string };
  professor: { firstName: string; lastName: string };
  startTime: string;
  endTime: string;
  capacity: string;
  _count: { reservations: number };
};

export default function ClassManagementPage() {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    classTypeId: '',
    professorId: '',
    startTime: '',
    endTime: '',
    capacity: 20
  });

  const classTypes = [
    { id: '1', name: 'Cross Training', color: '#ef4444' },
    { id: '2', name: 'Yoga Vinyasa', color: '#8b5cf6' },
    { id: '3', name: 'Musculación', color: '#3b82f6' }
  ];
  
  const professors = [
    { id: 'p1', name: 'Marcos R.' },
    { id: 'p2', name: 'Elena S.' },
    { id: 'p3', name: 'Juan P.' }
  ];

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsDialogOpen(false);
        fetchSessions();
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Agenda de Clases</h1>
          <p className="text-slate-500 mt-1">Gestiona horarios, profesores y cupos.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md" />}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Sesión
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Clase</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSession} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Disciplina</label>
                <Select onValueChange={(val: string | null) => { if (val) setFormData({...formData, classTypeId: val}) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {classTypes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Profesor a Cargo</label>
                <Select onValueChange={(val: string | null) => { if (val) setFormData({...formData, professorId: val}) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el profesor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professors.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Inicio</label>
                  <Input 
                    type="datetime-local" 
                    onChange={(e) => setFormData({...formData, startTime: new Date(e.target.value).toISOString()})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fin</label>
                  <Input 
                    type="datetime-local" 
                    onChange={(e) => setFormData({...formData, endTime: new Date(e.target.value).toISOString()})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cupo Máximo</label>
                <Input 
                  type="number" 
                  value={formData.capacity} 
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                  min="1" max="100"
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Guardar Sesión
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100">
          <CardTitle className="text-lg text-slate-800 flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5 text-slate-500" />
            Programación de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No hay clases programadas para hoy.</div>
            ) : (
              sessions.map((session) => {
                const start = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const end = new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isFull = session._count.reservations >= parseInt(session.capacity);

                return (
                  <div key={session.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-12 rounded-full" style={{ backgroundColor: session.classType.colorHex || '#ccc' }}></div>
                      
                      <div>
                        <h3 className="font-bold text-slate-900">{session.classType.name}</h3>
                        <p className="text-sm text-slate-500 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" /> {start} - {end}
                          <span className="mx-2">•</span>
                          Prof. {session.professor.firstName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="flex items-center justify-end text-sm font-medium text-slate-700">
                          <Users className="h-4 w-4 mr-1 text-slate-400" />
                          {session._count.reservations} / {session.capacity}
                        </div>
                        <p className={`text-[11px] font-bold mt-1 ${isFull ? 'text-red-500' : 'text-green-500'}`}>
                          {isFull ? 'CUPO LLENO' : 'DISPONIBLE'}
                        </p>
                      </div>
                      
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
