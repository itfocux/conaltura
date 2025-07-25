'use client';

import { useState } from 'react';

export default function AgregarVisitantePage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSyncVisitantes = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/sinco', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`¡Operación exitosa! Se sincronizaron ${data.enviados}, se actualizaron ${data.actualizados} visitantes de ${data.totalContactos} contactos totales.`);
      } else {
        alert(`Error en la operación: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al conectar con el servidor. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        color: 'white'
      }}>
        Agregar Visitante
      </h1>
      
      <div style={{ 
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        border: '1px solid #e9ecef'
      }}>
        <h2 style={{ 
          marginTop: '0',
          marginBottom: '15px',
          color: '#495057'
        }}>
          Instrucciones
        </h2>
        <p style={{ 
          lineHeight: '1.6',
          color: '#6c757d',
          margin: '0'
        }}>
          Haga clic en el botón verde a continuación para sincronizar los contactos de HubSpot 
          hacia el sistema Sinco como visitantes. 
          Esta operación procesará automáticamente todos los contactos elegibles y 
          mostrará un resumen de los resultados.
        </p>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleSyncVisitantes}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#218838';
            }
          }}
          onMouseOut={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#28a745';
            }
          }}
        >
          {isLoading ? 'Procesando...' : 'Agregar Visitantes'}
        </button>
      </div>

      {isLoading && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          color: '#6c757d'
        }}>
          <p>Por favor espere mientras se procesan los contactos...</p>
        </div>
      )}
    </div>
  );
}
