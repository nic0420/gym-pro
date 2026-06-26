'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, QrCode } from 'lucide-react';

type CheckinStatus = 'idle' | 'loading' | 'success' | 'error';

export default function CheckinKiosk() {
  const [dni, setDni] = useState('');
  const [status, setStatus] = useState<CheckinStatus>('idle');
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState<any>(null);

  const handleCheckin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dni) return;

    setStatus('loading');
    
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        body: JSON.stringify({ dni })
      });
      
      const data = await res.json();
      
      if (res.ok && data.granted) {
        setStatus('success');
        setUserData(data.user);
        setMessage(`¡Bienvenido, ${data.user.firstName}!`);
      } else {
        setStatus('error');
        setMessage(data.denialReason || 'Acceso Denegado');
      }
      
      setTimeout(() => {
        setStatus('idle');
        setDni('');
        setUserData(null);
      }, 3000);
      
    } catch (error) {
      setStatus('error');
      setMessage('Error de conexión');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-white tracking-tight">GYM<span className="text-blue-500">PRO</span></h1>
        <p className="text-slate-400 mt-2">Kiosco de Acceso</p>
      </div>

      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-white text-2xl">Ingresa tu DNI o Escanea QR</CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'idle' && (
            <form onSubmit={handleCheckin} className="space-y-4">
              <Input 
                type="number" 
                placeholder="Número de DNI" 
                className="text-center text-2xl py-6 bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 text-white font-bold">
                Check-in
              </Button>
              <div className="pt-4 flex justify-center">
                <Button variant="outline" type="button" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                  <QrCode className="mr-2 h-5 w-5" />
                  Escanear QR
                </Button>
              </div>
            </form>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-slate-400 mt-4 animate-pulse">Validando acceso...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center text-center py-6 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-24 w-24 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-white">{message}</h2>
              <p className="text-green-400 font-medium mt-2">Acceso Concedido</p>
              {userData?.daysRemaining && (
                <p className="text-slate-400 text-sm mt-4">
                  Te quedan {userData.daysRemaining} días de membresía.
                </p>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center text-center py-6 animate-in zoom-in duration-300">
              <XCircle className="h-24 w-24 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-white">Acceso Denegado</h2>
              <p className="text-red-400 font-medium mt-2">{message}</p>
              <p className="text-slate-400 text-sm mt-4">Por favor, acércate a recepción.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
